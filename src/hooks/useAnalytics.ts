"use client";

import { useEffect, useRef, useCallback } from "react";
import { recordView, recordEvents } from "@/app/actions/analytics";

interface AnalyticsEvent {
  type: "view_start" | "hotspot_click" | "variant_change" | "chat_message";
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Custom hook for client-side analytics collection.
 * Collects events and batches them to Firestore.
 */
export function useAnalytics(exhibitId: string, tenantId: string) {
  const eventsRef = useRef<AnalyticsEvent[]>([]);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const flushEvents = useCallback(async () => {
    if (eventsRef.current.length === 0) return;

    const eventsToFlush = [...eventsRef.current];
    eventsRef.current = [];

    try {
      await recordEvents(exhibitId, tenantId, sessionIdRef.current, eventsToFlush);
    } catch (error) {
      console.error("Error flushing analytics events:", error);
      // Re-add events to queue on failure (optional)
      eventsRef.current = [...eventsToFlush, ...eventsRef.current];
    }
  }, [exhibitId, tenantId]);

  const trackEvent = useCallback(
    (type: AnalyticsEvent["type"], data?: Record<string, unknown>) => {
      const event: AnalyticsEvent = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      eventsRef.current.push(event);
    },
    []
  );

  useEffect(() => {
    // Initial view record
    recordView(exhibitId, tenantId).catch(console.error);

    // Initial event
    trackEvent("view_start");

    // Start flush interval
    flushIntervalRef.current = setInterval(flushEvents, 10000);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      // Final flush on unmount
      flushEvents();
    };
  }, [exhibitId, tenantId, flushEvents, trackEvent]);

  return {
    trackHotspotClick: (hotspotId: string) => trackEvent("hotspot_click", { hotspotId }),
    trackVariantChange: (variantId: string) => trackEvent("variant_change", { variantId }),
    trackChatMessage: () => trackEvent("chat_message"),
  };
}
