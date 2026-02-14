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

  useEffect(() => {
    loadLastWeights();
  }, [loadLastWeights]);

  // Elapsed timer based on start time (drift-proof)
  useEffect(() => {
    if (sessionActive && sessionStartRef.current) {
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

  // Rest timer based on endsAt (drift-proof)
  useEffect(() => {
    if (restTimer.active && restTimer.endsAt) {
      restIntervalRef.current = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(
          0,
          Math.ceil((restTimer.endsAt!.getTime() - now.getTime()) / 1000)
        );
        if (remaining <= 0) {
          setRestTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));
          // Vibrate on rest complete
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        } else {
          setRestTimer((prev) => ({ ...prev, remainingSeconds: remaining }));
        }
      }, 250);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [restTimer.active, restTimer.endsAt]);

  const startSession = useCallback(
    async (workoutName: string) => {
      if (!user) return;
      try {
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

      setLogs((prev) => [...prev, newLog]);

      // Check if this is the last set of the last exercise - no rest needed
      const exerciseObj = exercises.find((e) => e.name === exerciseName);
      const isLastSetOfExercise = exerciseObj
        ? setNumber >= exerciseObj.sets
        : true;

      // Check if all sets of all exercises are done after this log
      const updatedLogs = [...logs, newLog];
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
    },
    [exercises, logs]
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

      // Insert all set logs
      if (logs.length > 0) {
        const setLogRows = logs.map((l) => ({
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
    elapsedSeconds,
    logs,
    restTimer,
    lastWeights,
    saving,
    allSetsCompleted,
    canCompleteWorkout,
    startSession,
    logSet,
    canLogSet,
    getCompletedSets,
    finishSession,
    parseRest,
  };
}
