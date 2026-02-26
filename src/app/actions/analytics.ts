"use server";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type AnalyticsEvent = {
  type: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

type AnalyticsEventInput = {
  type: string;
  data?: unknown;
  timestamp: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEventData(data: unknown): Record<string, unknown> | undefined {
  if (typeof data === "undefined") {
    return undefined;
  }

  if (isRecord(data)) {
    return data;
  }

  return { value: data };
}

function normalizeIncomingEvent(event: AnalyticsEventInput): AnalyticsEvent {
  const normalizedData = normalizeEventData(event.data);
  return {
    type: event.type,
    timestamp: event.timestamp,
    ...(normalizedData ? { data: normalizedData } : {}),
  };
}

function normalizeStoredEvent(value: unknown): AnalyticsEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value.type;
  const timestamp = value.timestamp;

  if (typeof type !== "string" || typeof timestamp !== "string") {
    return null;
  }

  const normalizedData = normalizeEventData(value.data);
  return {
    type,
    timestamp,
    ...(normalizedData ? { data: normalizedData } : {}),
  };
}

/**
 * Record a view for an exhibition and its tenant.
 * Updates global tenant stats and per-exhibition stats.
 */
export async function recordView(exhibitId: string, tenantId: string): Promise<void> {
  const adminDb = getAdminDb();
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const monthKey = dateKey.substring(0, 7); // YYYY-MM

  const tenantStatsRef = adminDb.collection("tenants").doc(tenantId).collection("stats").doc("views");
  const exhibitStatsRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .doc(exhibitId)
    .collection("stats")
    .doc("views");

  const increment = FieldValue.increment(1);

  const batch = adminDb.batch();

  // Update Tenant Stats
  batch.set(
    tenantStatsRef,
    {
      total: increment,
      [`daily.${dateKey}`]: increment,
      [`monthly.${monthKey}`]: increment,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Update Exhibit Stats
  batch.set(
    exhibitStatsRef,
    {
      total: increment,
      [`daily.${dateKey}`]: increment,
      [`monthly.${monthKey}`]: increment,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await batch.commit();
  } catch (error) {
    console.error("Failed to record view:", error);
  }
}

/**
 * Record interaction events (hotspot clicks, variant changes, etc.) in batches.
 */
export async function recordEvents(
  exhibitId: string,
  tenantId: string,
  sessionId: string,
  events: AnalyticsEventInput[]
): Promise<void> {
  if (events.length === 0) return;

  const adminDb = getAdminDb();
  const sessionRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .doc(exhibitId)
    .collection("analytics")
    .doc(sessionId);
  const normalizedEvents = events.map(normalizeIncomingEvent);

  try {
    await sessionRef.set(
      {
        events: FieldValue.arrayUnion(...normalizedEvents),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to record events:", error);
  }
}

/**
 * Fetch stats for all exhibitions of a tenant.
 */
export async function getTenantExhibitionsStats(tenantId: string) {
  const adminDb = getAdminDb();
  
  try {
    const exhibitionsSnapshot = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("exhibitions")
      .get();

    const statsPromises = exhibitionsSnapshot.docs.map(async (doc) => {
      const exhibitId = doc.id;
      const title = doc.data().title || "Untitled";
      
      const statsDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("exhibitions")
        .doc(exhibitId)
        .collection("stats")
        .doc("views")
        .get();
      
      const statsData = statsDoc.data();
      
      return {
        id: exhibitId,
        title,
        totalViews: (statsData?.total as number) || 0,
        monthlyViews: (statsData?.monthly as Record<string, number>) || {},
        dailyViews: (statsData?.daily as Record<string, number>) || {},
      };
    });

    return await Promise.all(statsPromises);
  } catch (error) {
    console.error("Error fetching tenant exhibition stats:", error);
    return [];
  }
}

/**
 * Fetch detailed analytics events for an exhibition.
 */
export async function getExhibitionAnalytics(exhibitId: string, tenantId: string) {
  const adminDb = getAdminDb();
  
  try {
    const analyticsSnapshot = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("exhibitions")
      .doc(exhibitId)
      .collection("analytics")
      .get();
    
    const allEvents: AnalyticsEvent[] = [];
    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();
      const rawEvents = data.events;

      if (Array.isArray(rawEvents)) {
        rawEvents.forEach((eventValue) => {
          const normalized = normalizeStoredEvent(eventValue);
          if (normalized) {
            allEvents.push(normalized);
          }
        });
      }
    });
    
    return allEvents;
  } catch (error) {
    console.error("Error fetching exhibition analytics:", error);
    return [];
  }
}

