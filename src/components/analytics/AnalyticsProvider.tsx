import { useEffect } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { captureAcquisitionChannel } from "@/hooks/useAnalytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Track page views
  usePageTracking();

  // Capture acquisition channel on first load
  useEffect(() => {
    captureAcquisitionChannel();
  }, []);

  return <>{children}</>;
}
