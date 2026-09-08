import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import { captureAcquisitionChannel, useAnalytics, captureUtmParameters } from "@/hooks/useAnalytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Track page views
  usePageTracking();
  const location = useLocation();
  const { trackLandingView, trackNotificationOpened } = useAnalytics();

  // Capture acquisition channel and UTM on first load
  useEffect(() => {
    const initAnalytics = async () => {
      await captureAcquisitionChannel();
      await captureUtmParameters();
    };
    initAnalytics();
  }, []);

  // Abertura vinda de notificação (sw.js adiciona ?notif=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("notif") === "1") {
      trackNotificationOpened(location.pathname);
      params.delete("notif");
      const qs = params.toString();
      window.history.replaceState({}, "", location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  // Track landing page view specifically
  useEffect(() => {
    if (location.pathname === "/") {
      trackLandingView();
    }
  }, [location.pathname, trackLandingView]);

  return <>{children}</>;
}
