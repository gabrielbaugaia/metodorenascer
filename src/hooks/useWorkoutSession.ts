import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SetLog {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  repsDone: number;
  restSeconds: number;
  restRespected: boolean;
  completedAt: Date;
}

interface RestTimer {
  active: boolean;
  remainingSeconds: number;
  endsAt: Date | null;
  exerciseName: string;
  setNumber: number;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

export interface SessionSummary {
  totalDurationSeconds: number;
  totalSets: number;
  totalVolume: number; // sum of weight * reps
  exercisesCompleted: number;
  logs: SetLog[];
}

// Parse rest string like "60s", "1min", "1:30", "90s", "2min" to seconds
function parseRestToSeconds(rest: string): number {
  if (!rest) return 60;
  const trimmed = rest.trim().toLowerCase();

  // "1:30" format
  const colonMatch = trimmed.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }

  // "2min" or "2 min"
  const minMatch = trimmed.match(/^(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1]) * 60;

  // "60s" or "60"
  const secMatch = trimmed.match(/^(\d+)\s*s?$/);
  if (secMatch) return parseInt(secMatch[1]);

  return 60;
}

export function useWorkoutSession(exercises: Exercise[]) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isRecovering, setIsRecovering] = useState(true); // true while checking for active session
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [restTimer, setRestTimer] = useState<RestTimer>({
    active: false,
    remainingSeconds: 0,
    endsAt: null,
    exerciseName: "",
    setNumber: 0,
  });
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const sessionStartRef = useRef<Date | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which set logs have already been persisted to DB (to avoid duplicates on finishSession)
  const persistedLogKeysRef = useRef<Set<string>>(new Set());

  // Load last weights for exercises
  const loadLastWeights = useCallback(async () => {
    if (!user || exercises.length === 0) return;
    try {
      const names = exercises.map((e) => e.name);
      const { data } = await supabase
        .from("workout_set_logs")
        .select("exercise_name, weight_kg, created_at")
        .eq("user_id", user.id)
        .in("exercise_name", names)
        .order("created_at", { ascending: false });

      if (data) {
        const weightMap: Record<string, number> = {};
        for (const row of data) {
          if (!weightMap[row.exercise_name] && row.weight_kg > 0) {
            weightMap[row.exercise_name] = Number(row.weight_kg);
          }
        }
        setLastWeights(weightMap);
      }
    } catch (err) {
      console.error("[WorkoutSession] Error loading weights:", err);
    }
  }, [user, exercises]);

  // Attempt to rehydrate an active session from DB on mount
  const rehydrateSession = useCallback(async (workoutName: string) => {
    if (!user) {
      setIsRecovering(false);
      return false;
    }
    try {
      // Find the most recent active session for this workout
      const { data: existing, error } = await supabase
        .from("active_workout_sessions")
        .select("id, started_at, workout_name")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("workout_name", workoutName)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !existing) {
        setIsRecovering(false);
        return false;
      }

      // Load set logs for this session
      const { data: existingLogs, error: logsError } = await supabase
        .from("workout_set_logs")
        .select("*")
        .eq("session_id", existing.id)
        .order("created_at", { ascending: true });

      if (logsError) {
        console.error("[WorkoutSession] Error loading logs:", logsError);
        setIsRecovering(false);
        return false;
      }

      // Map DB rows to SetLog[]
      const recovered: SetLog[] = (existingLogs || []).map((row: any) => ({
        exerciseName: row.exercise_name,
        setNumber: row.set_number,
        weightKg: Number(row.weight_kg),
        repsDone: row.reps_done,
        restSeconds: row.rest_seconds,
        restRespected: row.rest_respected,
        completedAt: new Date(row.created_at),
      }));

      // Mark all recovered logs as already persisted
      recovered.forEach((l) => {
        persistedLogKeysRef.current.add(`${existing.id}:${l.exerciseName}:${l.setNumber}`);
      });

      // Restore state
      setSessionId(existing.id);
      sessionStartRef.current = new Date(existing.started_at);
      setLogs(recovered);
      setSessionActive(true);
      setIsRecovering(false);

      console.log(`[WorkoutSession] Recovered session ${existing.id} with ${recovered.length} sets`);
      return true;
    } catch (err) {
      console.error("[WorkoutSession] Rehydration error:", err);
      setIsRecovering(false);
      return false;
    }
  }, [user]);

  useEffect(() => {
    loadLastWeights();
  }, [loadLastWeights]);

  // Elapsed timer based on start time (drift-proof)
  useEffect(() => {
    if (sessionActive && sessionStartRef.current) {
      // Initialize elapsed immediately to avoid 0 flash after recovery
      const now = new Date();
      const diff = Math.floor(
        (now.getTime() - sessionStartRef.current!.getTime()) / 1000
      );
      setElapsedSeconds(diff);

      elapsedIntervalRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor(
          (now.getTime() - sessionStartRef.current!.getTime()) / 1000
        );
        setElapsedSeconds(diff);
      }, 1000);
    }
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [sessionActive]);

  // Rest timer based on endsAt (drift-proof) — with localStorage persistence
  useEffect(() => {
    if (restTimer.active && restTimer.endsAt) {
      // Persist rest timer state to localStorage
      localStorage.setItem("renascer_rest_timer", JSON.stringify({
        endsAt: restTimer.endsAt.toISOString(),
        exerciseName: restTimer.exerciseName,
        setNumber: restTimer.setNumber,
      }));

      restIntervalRef.current = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(
          0,
          Math.ceil((restTimer.endsAt!.getTime() - now.getTime()) / 1000)
        );
        if (remaining <= 0) {
          setRestTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));
          localStorage.removeItem("renascer_rest_timer");
          // Vibrate on rest complete
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        } else {
          setRestTimer((prev) => ({ ...prev, remainingSeconds: remaining }));
        }
      }, 250);
    } else if (!restTimer.active) {
      localStorage.removeItem("renascer_rest_timer");
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [restTimer.active, restTimer.endsAt]);

  // Rehydrate rest timer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("renascer_rest_timer");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const endsAt = new Date(parsed.endsAt);
      const remaining = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 1000));
      if (remaining > 0) {
        setRestTimer({
          active: true,
          remainingSeconds: remaining,
          endsAt,
          exerciseName: parsed.exerciseName || "",
          setNumber: parsed.setNumber || 0,
        });
      } else {
        localStorage.removeItem("renascer_rest_timer");
      }
    } catch {
      localStorage.removeItem("renascer_rest_timer");
    }
  }, []);

  const startSession = useCallback(
    async (workoutName: string) => {
      if (!user) return;
      try {
        // Abandon any previous active sessions for this user + workout
        await supabase
          .from("active_workout_sessions")
          .update({ status: "abandoned" })
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("workout_name", workoutName);

        const { data, error } = await supabase
          .from("active_workout_sessions")
          .insert({
            user_id: user.id,
            workout_name: workoutName,
            status: "active",
          })
          .select("id, started_at")
          .single();

        if (error) throw error;

        persistedLogKeysRef.current.clear();
        setSessionId(data.id);
        sessionStartRef.current = new Date(data.started_at);
        setSessionActive(true);
        setElapsedSeconds(0);
        setLogs([]);
      } catch (err) {
        console.error("[WorkoutSession] Error starting session:", err);
      }
    },
    [user]
  );

  const logSet = useCallback(
    (
      exerciseName: string,
      setNumber: number,
      weightKg: number,
      repsDone: number,
      restSeconds: number
    ) => {
      const newLog: SetLog = {
        exerciseName,
        setNumber,
        weightKg,
        repsDone,
        restSeconds,
        restRespected: true,
        completedAt: new Date(),
      };

      setLogs((prev) => {
        const updatedLogs = [...prev, newLog];

        // Check if all sets of all exercises are done
        const allDone = exercises.every((ex) => {
          const exLogs = updatedLogs.filter((l) => l.exerciseName === ex.name);
          return exLogs.length >= ex.sets;
        });

        // Start rest timer only if not all done
        if (!allDone && restSeconds > 0) {
          const endsAt = new Date(Date.now() + restSeconds * 1000);
          setRestTimer({
            active: true,
            remainingSeconds: restSeconds,
            endsAt,
            exerciseName,
            setNumber,
          });
        }

        return updatedLogs;
      });

      // Persist this set to DB immediately (fire-and-forget) if session is active
      if (sessionId && user) {
        const logKey = `${sessionId}:${exerciseName}:${setNumber}`;
        if (!persistedLogKeysRef.current.has(logKey)) {
          persistedLogKeysRef.current.add(logKey);
          supabase
            .from("workout_set_logs")
            .insert({
              user_id: user.id,
              session_id: sessionId,
              exercise_name: exerciseName,
              set_number: setNumber,
              weight_kg: weightKg,
              reps_done: repsDone,
              rest_seconds: restSeconds,
              rest_respected: true,
            })
            .then(({ error }) => {
              if (error) {
                // Remove from persisted set so finishSession will retry
                persistedLogKeysRef.current.delete(logKey);
                console.error("[WorkoutSession] Error persisting set:", error);
              }
            });
        }
      }
    },
    [exercises, sessionId, user]
  );

  const canLogSet = useCallback(() => {
    return !restTimer.active;
  }, [restTimer.active]);

  const getCompletedSets = useCallback(
    (exerciseName: string) => {
      return logs.filter((l) => l.exerciseName === exerciseName);
    },
    [logs]
  );

  const allSetsCompleted = exercises.every((ex) => {
    const exLogs = logs.filter((l) => l.exerciseName === ex.name);
    return exLogs.length >= ex.sets;
  });

  const canCompleteWorkout = allSetsCompleted && !restTimer.active;

  const finishSession = useCallback(async (): Promise<SessionSummary | null> => {
    if (!user || !sessionId) return null;
    setSaving(true);

    try {
      const now = new Date();
      const totalDuration = sessionStartRef.current
        ? Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 1000)
        : elapsedSeconds;

      // Update session
      await supabase
        .from("active_workout_sessions")
        .update({
          ended_at: now.toISOString(),
          total_duration_seconds: totalDuration,
          status: "finished",
        })
        .eq("id", sessionId);

      // Only insert logs that were NOT already persisted incrementally
      const unpersisted = logs.filter((l) => {
        const key = `${sessionId}:${l.exerciseName}:${l.setNumber}`;
        return !persistedLogKeysRef.current.has(key);
      });

      if (unpersisted.length > 0) {
        const setLogRows = unpersisted.map((l) => ({
          user_id: user.id,
          session_id: sessionId,
          exercise_name: l.exerciseName,
          set_number: l.setNumber,
          weight_kg: l.weightKg,
          reps_done: l.repsDone,
          rest_seconds: l.restSeconds,
          rest_respected: l.restRespected,
        }));

        await supabase.from("workout_set_logs").insert(setLogRows);
      }

      // Clean up state
      setSessionActive(false);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);

      const totalVolume = logs.reduce(
        (acc, l) => acc + l.weightKg * l.repsDone,
        0
      );
      const uniqueExercises = new Set(logs.map((l) => l.exerciseName)).size;

      const summary: SessionSummary = {
        totalDurationSeconds: totalDuration,
        totalSets: logs.length,
        totalVolume,
        exercisesCompleted: uniqueExercises,
        logs,
      };

      return summary;
    } catch (err) {
      console.error("[WorkoutSession] Error finishing session:", err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, sessionId, logs, elapsedSeconds]);

  const parseRest = parseRestToSeconds;

  return {
    sessionId,
    sessionActive,
    isRecovering,
    elapsedSeconds,
    logs,
    restTimer,
    lastWeights,
    saving,
    allSetsCompleted,
    canCompleteWorkout,
    startSession,
    rehydrateSession,
    logSet,
    canLogSet,
    getCompletedSets,
    finishSession,
    parseRest,
  };
}
