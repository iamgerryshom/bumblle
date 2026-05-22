import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!analytics) return;

    logEvent(analytics, "page_view", {
      page_path: location.pathname,
      page_search: location.search
    });
  }, [location]);

  return null; // nothing is rendered
}