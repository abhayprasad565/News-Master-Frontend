import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/api";

/**
 * Tracks reader page navigations and qualified visible story reads.
 * - Filters out administrative routes.
 * - Sends raw document.referrer to the server for normalization.
 * - Uses the Page Visibility API to ensure story views are only counted
 *   after the story has been actively visible for at least 3 seconds.
 */
export function usePageTracking() {
  const [location] = useLocation();
  const lastRecordedPath = useRef<string | null>(null);

  // 1. General reader page visit beacon
  useEffect(() => {
    // Exclude administrative paths
    if (location.startsWith("/admin")) {
      return;
    }

    // Avoid duplicate beacon for identical path
    if (lastRecordedPath.current === location) {
      return;
    }
    lastRecordedPath.current = location;

    apiFetch("/api/analytics/visit", {
      method: "POST",
      body: JSON.stringify({
        path: location,
        referrer: document.referrer ? document.referrer.slice(0, 500) : "",
      }),
    }).catch(() => {});
  }, [location]);

  // 2. Qualified Story View with Page Visibility API + 3s active dwell timer
  useEffect(() => {
    // Only target story pages: /stories/:id or /stories/:slug
    if (!location.startsWith("/stories/") || location === "/stories") {
      return;
    }

    const storyParam = location.slice("/stories/".length).split("/")[0]?.split("?")[0];
    if (!storyParam) {
      return;
    }

    let accumulatedVisibleMs = 0;
    let lastVisibleStart = document.visibilityState === "visible" ? Date.now() : 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let viewRecorded = false;

    const recordQualifiedView = () => {
      if (viewRecorded) return;
      viewRecorded = true;

      apiFetch(`/api/stories/${encodeURIComponent(storyParam)}/view`, {
        method: "POST",
        body: JSON.stringify({}),
      }).catch(() => {});
    };

    const scheduleTimer = () => {
      if (viewRecorded || document.visibilityState !== "visible") return;

      const remainingMs = Math.max(0, 3000 - accumulatedVisibleMs);
      if (remainingMs === 0) {
        recordQualifiedView();
        return;
      }

      timer = setTimeout(() => {
        if (document.visibilityState === "visible") {
          accumulatedVisibleMs += Date.now() - lastVisibleStart;
          if (accumulatedVisibleMs >= 3000) {
            recordQualifiedView();
          }
        }
      }, remainingMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastVisibleStart = Date.now();
        scheduleTimer();
      } else {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (lastVisibleStart > 0) {
          accumulatedVisibleMs += Date.now() - lastVisibleStart;
          lastVisibleStart = 0;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.visibilityState === "visible") {
      scheduleTimer();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [location]);
}
