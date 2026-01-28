import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface EventMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

// Session tracking
let sessionStartTime: number | null = null;
let currentPage: string | null = null;

// Anonymous session ID for tracking visitors before login
const SESSION_ID_KEY = "renascer_session_id";
const UTM_DATA_KEY = "renascer_utm_data";

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Capture and store UTM parameters
export function captureUtmParameters(): Record<string, string> | null {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  utmKeys.forEach(key => {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  if (Object.keys(utmParams).length > 0) {
    localStorage.setItem(UTM_DATA_KEY, JSON.stringify(utmParams));
    return utmParams;
  }
  
  // Return stored UTM data if available
  const stored = localStorage.getItem(UTM_DATA_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function getStoredUtmData(): Record<string, string> | null {
  const stored = localStorage.getItem(UTM_DATA_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function useAnalytics() {
  const { user } = useAuth();
  const hasTrackedAppOpen = useRef(false);
  const sessionId = useRef<string>(getOrCreateSessionId());

  // Track event to Supabase (supports both authenticated and anonymous users)
  const trackEvent = useCallback(
    async (
      eventName: string,
      pageName?: string,
      metadata?: EventMetadata
    ) => {
      try {
        // Get UTM data to include in metadata
        const utmData = getStoredUtmData();
        const enrichedMetadata = {
          ...metadata,
          ...(utmData || {}),
        };

        await supabase.from("events").insert({
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId.current, // Only use session_id for anonymous
          event_name: eventName,
          page_name: pageName || currentPage,
          metadata: enrichedMetadata,
        });
      } catch (error) {
        console.error("Failed to track event:", error);
      }
    },
    [user?.id]
  );

  // Track page view
  const trackPageView = useCallback(
    (pageName: string) => {
      currentPage = pageName;
      trackEvent("page_view", pageName);
    },
    [trackEvent]
  );

  // Track landing page view (anonymous-friendly)
  const trackLandingView = useCallback(() => {
    trackEvent("landing_view", "landing");
  }, [trackEvent]);

  // Track plan clicked (before checkout)
  const trackPlanClicked = useCallback(
    (planName: string, priceId: string) => {
      trackEvent("plan_clicked", "planos", { plan_name: planName, price_id: priceId });
    },
    [trackEvent]
  );

  // Track app open (session start)
  const trackAppOpen = useCallback(() => {
    if (hasTrackedAppOpen.current) return;
    hasTrackedAppOpen.current = true;
    sessionStartTime = Date.now();
    trackEvent("app_open");
  }, [trackEvent]);

  // Track session end with duration
  const trackSessionEnd = useCallback(() => {
    if (!sessionStartTime) return;
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    trackEvent("session_end", undefined, { duration_seconds: durationSeconds });
    sessionStartTime = null;
  }, [trackEvent]);

  // Funnel events
  const trackPlanView = useCallback(
    (planName?: string) => {
      trackEvent("plan_view", "planos", { plan_name: planName });
    },
    [trackEvent]
  );

  const trackCheckoutStarted = useCallback(
    (planName: string, priceId: string) => {
      trackEvent("checkout_started", "checkout", { plan_name: planName, price_id: priceId });
    },
    [trackEvent]
  );

  const trackCheckoutCompleted = useCallback(
    (planName: string, priceId: string) => {
      trackEvent("checkout_completed", "checkout", { plan_name: planName, price_id: priceId });
    },
    [trackEvent]
  );

  // Onboarding events
  const trackAnamneseStarted = useCallback(() => {
    trackEvent("anamnese_started", "anamnese");
  }, [trackEvent]);

  const trackAnamneseCompleted = useCallback(() => {
    trackEvent("anamnese_completed", "anamnese");
  }, [trackEvent]);

  const trackProtocolGenerated = useCallback(
    (protocolType: "treino" | "nutricao" | "mindset") => {
      trackEvent("protocol_generated", "protocolos", { tipo: protocolType });
    },
    [trackEvent]
  );

  const trackProtocolViewed = useCallback(
    (protocolType: "treino" | "nutricao" | "mindset") => {
      trackEvent("protocol_viewed", protocolType, { tipo: protocolType });
    },
    [trackEvent]
  );

  // Activation events
  const trackFirstWorkoutCompleted = useCallback(() => {
    trackEvent("first_workout_completed", "treino");
  }, [trackEvent]);

  const trackStreak3Days = useCallback(() => {
    trackEvent("streak_3_days", "treino");
  }, [trackEvent]);

  const trackPdfDownloaded = useCallback(
    (pdfType: "treino" | "nutricao" | "mindset" | "anamnese" | "evolucao") => {
      trackEvent("pdf_downloaded", pdfType, { pdf_type: pdfType });
    },
    [trackEvent]
  );

  // Workout events
  const trackWorkoutStarted = useCallback(
    (workoutName: string) => {
      trackEvent("workout_started", "treino", { workout_name: workoutName });
    },
    [trackEvent]
  );

  const trackWorkoutCompleted = useCallback(
    (workoutName: string, exercisesCompleted: number) => {
      trackEvent("workout_completed", "treino", {
        workout_name: workoutName,
        exercises_completed: exercisesCompleted,
      });
    },
    [trackEvent]
  );

  // Nutrition events
  const trackMealPlanViewed = useCallback(() => {
    trackEvent("meal_plan_viewed", "nutricao");
  }, [trackEvent]);

  const trackMealChecked = useCallback(
    (mealName: string) => {
      trackEvent("meal_checked", "nutricao", { meal_name: mealName });
    },
    [trackEvent]
  );

  // Mindset events
  const trackMindsetTaskCompleted = useCallback(
    (taskType: string) => {
      trackEvent("mindset_task_completed", "mindset", { task_type: taskType });
    },
    [trackEvent]
  );

  // Photo events
  const trackPhotoCheckinUploaded = useCallback(() => {
    trackEvent("photo_checkin_uploaded", "checkin");
  }, [trackEvent]);

  // Support events
  const trackSupportMessageSent = useCallback(() => {
    trackEvent("support_message_sent", "suporte");
  }, [trackEvent]);

  // Churn events
  const trackCancelIntent = useCallback(() => {
    trackEvent("cancel_intent", "assinatura");
  }, [trackEvent]);

  const trackSubscriptionCanceled = useCallback(
    (planName: string) => {
      trackEvent("subscription_canceled", "assinatura", { plan_name: planName });
    },
    [trackEvent]
  );

  const trackSubscriptionResumed = useCallback(
    (planName: string) => {
      trackEvent("subscription_resumed", "assinatura", { plan_name: planName });
    },
    [trackEvent]
  );

  // Track session end on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [trackSessionEnd]);

  return {
    trackEvent,
    trackPageView,
    trackLandingView,
    trackPlanClicked,
    trackAppOpen,
    trackSessionEnd,
    // Funnel
    trackPlanView,
    trackCheckoutStarted,
    trackCheckoutCompleted,
    // Onboarding
    trackAnamneseStarted,
    trackAnamneseCompleted,
    trackProtocolGenerated,
    trackProtocolViewed,
    // Activation
    trackFirstWorkoutCompleted,
    trackStreak3Days,
    trackPdfDownloaded,
    // Workout
    trackWorkoutStarted,
    trackWorkoutCompleted,
    // Nutrition
    trackMealPlanViewed,
    trackMealChecked,
    // Mindset
    trackMindsetTaskCompleted,
    // Photos
    trackPhotoCheckinUploaded,
    // Support
    trackSupportMessageSent,
    // Churn
    trackCancelIntent,
    trackSubscriptionCanceled,
    trackSubscriptionResumed,
  };
}

// Utility to capture UTM parameters and save acquisition channel
export function captureAcquisitionChannel(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Capture UTM params first
  captureUtmParameters();
  
  // Check UTM source first
  const utmSource = urlParams.get("utm_source");
  if (utmSource) {
    const channel = mapUtmToChannel(utmSource);
    localStorage.setItem("acquisition_channel", channel);
    return channel;
  }
  
  // Check referrer
  const referrer = document.referrer;
  if (referrer) {
    if (referrer.includes("instagram.com")) {
      localStorage.setItem("acquisition_channel", "instagram_organico");
      return "instagram_organico";
    }
    if (referrer.includes("tiktok.com")) {
      localStorage.setItem("acquisition_channel", "tiktok");
      return "tiktok";
    }
  }
  
  // Check if from referral
  const refCode = urlParams.get("ref");
  if (refCode) {
    localStorage.setItem("acquisition_channel", "indicacao");
    return "indicacao";
  }
  
  return localStorage.getItem("acquisition_channel");
}

function mapUtmToChannel(utmSource: string): string {
  const source = utmSource.toLowerCase();
  if (source.includes("instagram") && source.includes("ads")) return "instagram_ads";
  if (source.includes("instagram")) return "instagram_organico";
  if (source.includes("tiktok")) return "tiktok";
  if (source.includes("facebook") && source.includes("ads")) return "facebook_ads";
  if (source.includes("google")) return "google_ads";
  return "outro";
}
