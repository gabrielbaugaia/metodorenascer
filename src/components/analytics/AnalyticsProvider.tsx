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
  const { trackLandingView } = useAnalytics();

  // Capture acquisition channel and UTM on first load
  useEffect(() => {
    captureAcquisitionChannel();
    captureUtmParameters();
  }, []);

  // Track landing page view specifically
  useEffect(() => {
    if (location.pathname === "/") {
      trackLandingView();
    }
  }, [location.pathname, trackLandingView]);

  return <>{children}</>;
}
