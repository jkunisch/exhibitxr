"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { canCreateExhibition, getPlanLimits, type TenantPlan } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";

const environmentPresetSchema = z.enum([
  "studio",
  "city",
  "sunset",
  "dawn",
  "night",
]);

const exhibitionInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long.")
    .max(120, "Title must be 120 characters or less."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less.")
    .optional()
    .default(""),
  isPublished: z.boolean(),
  environment: environmentPresetSchema,
  glbUrl: z
    .union([z.literal(""), z.string().trim().url("GLB URL must be a valid URL.")])
    .optional()
    .default(""),
});

const exhibitionIdSchema = z
  .string()
  .trim()
  .min(1, "Missing exhibition id.");

const deleteSchema = z.object({
  exhibitionId: exhibitionIdSchema,
  confirmTitle: z.string().trim().min(1, "Please type the exhibition title to confirm deletion."),
});

export type ExhibitionMutationResult =
  | {
    ok: true;
    exhibitionId: string;
  }
  | {
    ok: false;
    error: string;
  };

export type ExhibitionDeleteResult =
  | {
    ok: true;
    deletedId: string;
  }
  | {
    ok: false;
    error: string;
  };

function formDataToPayload(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    isPublished: formData.get("isPublished") === "on",
    environment: formData.get("environment"),
    glbUrl: formData.get("glbUrl"),
  };
}

function extractZodError(result: { success: false; error: z.ZodError }): string {
  return result.error.issues[0]?.message ?? "Invalid form input.";
}

function normalizeTenantPlan(value: unknown): TenantPlan {
  if (
    value === "free" ||
    value === "starter" ||
    value === "pro" ||
    value === "enterprise"
  ) {
    return value;
  }

  return "free";
}

export async function createExhibitionAction(
  formData: FormData,
): Promise<ExhibitionMutationResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsedInput = exhibitionInputSchema.safeParse(formDataToPayload(formData));
  if (!parsedInput.success) {
    return { ok: false, error: extractZodError(parsedInput) };
  }

  const adminDb = getAdminDb();
  const tenantRef = adminDb.collection("tenants").doc(sessionUser.tenantId);
  const exhibitionsRef = tenantRef.collection("exhibitions");
  const [tenantSnapshot, exhibitionsSnapshot] = await Promise.all([
    tenantRef.get(),
    exhibitionsRef.get(),
  ]);

  const tenantPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const currentExhibitionCount = exhibitionsSnapshot.size;

  if (!canCreateExhibition(tenantPlan, currentExhibitionCount)) {
    const limit = getPlanLimits(tenantPlan).exhibitions;

    return {
      ok: false,
      error: `Plan limit reached. ${tenantPlan.toUpperCase()} allows ${limit} exhibition(s).`,
    };
  }

  const exhibitionId = crypto.randomUUID();
  const now = FieldValue.serverTimestamp();

  await exhibitionsRef.doc(exhibitionId).set({
      id: exhibitionId,
      tenantId: sessionUser.tenantId,
      title: parsedInput.data.title,
      description: parsedInput.data.description,
      isPublished: parsedInput.data.isPublished,
      environment: parsedInput.data.environment,
      glbUrl: parsedInput.data.glbUrl,
      model: {
        id: crypto.randomUUID(),
        label: parsedInput.data.title,
        glbUrl: parsedInput.data.glbUrl || "",
        scale: 1,
        position: [0, 0, 0],
        variants: [],
        hotspots: [],
      },
      createdAt: now,
      updatedAt: now,
    });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/exhibitions");

  return { ok: true, exhibitionId };
}

export async function updateExhibitionAction(
  formData: FormData,
): Promise<ExhibitionMutationResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { ok: false, error: "Not authenticated." };
  }

  const exhibitionIdResult = exhibitionIdSchema.safeParse(formData.get("exhibitionId"));
  if (!exhibitionIdResult.success) {
    return { ok: false, error: extractZodError(exhibitionIdResult) };
  }

  const parsedInput = exhibitionInputSchema.safeParse(formDataToPayload(formData));
  if (!parsedInput.success) {
    return { ok: false, error: extractZodError(parsedInput) };
  }

  const exhibitionId = exhibitionIdResult.data;
  const adminDb = getAdminDb();
  const exhibitionRef = adminDb
    .collection("tenants")
    .doc(sessionUser.tenantId)
    .collection("exhibitions")
    .doc(exhibitionId);

  const snapshot = await exhibitionRef.get();
  if (!snapshot.exists) {
    return { ok: false, error: "Exhibition not found." };
  }

  const currentData = snapshot.data();
  const tenantId =
    currentData && typeof currentData.tenantId === "string"
      ? currentData.tenantId
      : sessionUser.tenantId;

  if (tenantId !== sessionUser.tenantId) {
    return { ok: false, error: "Tenant mismatch detected." };
  }
  const modelId =
    currentData &&
      typeof currentData === "object" &&
      "model" in currentData &&
      currentData.model &&
      typeof currentData.model === "object" &&
      "id" in currentData.model &&
      typeof currentData.model.id === "string"
      ? currentData.model.id
      : crypto.randomUUID();

  await exhibitionRef.update({
    title: parsedInput.data.title,
    description: parsedInput.data.description,
    isPublished: parsedInput.data.isPublished,
    environment: parsedInput.data.environment,
    glbUrl: parsedInput.data.glbUrl,
    model: {
      id: modelId,
      label: parsedInput.data.title,
      glbUrl: parsedInput.data.glbUrl || "",
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: [],
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/exhibitions");
  revalidatePath(`/dashboard/exhibitions/${exhibitionId}`);

  return { ok: true, exhibitionId };
}

export async function deleteExhibitionAction(
  formData: FormData,
): Promise<ExhibitionDeleteResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsedInput = deleteSchema.safeParse({
    exhibitionId: formData.get("exhibitionId"),
    confirmTitle: formData.get("confirmTitle"),
  });

  if (!parsedInput.success) {
    return { ok: false, error: extractZodError(parsedInput) };
  }

  const adminDb = getAdminDb();
  const exhibitionRef = adminDb
    .collection("tenants")
    .doc(sessionUser.tenantId)
    .collection("exhibitions")
    .doc(parsedInput.data.exhibitionId);

  const snapshot = await exhibitionRef.get();
  if (!snapshot.exists) {
    return { ok: false, error: "Exhibition not found." };
  }

  const data = snapshot.data();
  const exhibitionTitle = typeof data?.title === "string" ? data.title.trim() : "";
  const tenantId =
    data && typeof data.tenantId === "string" ? data.tenantId : sessionUser.tenantId;

  if (tenantId !== sessionUser.tenantId) {
    return { ok: false, error: "Tenant mismatch detected." };
  }

  if (parsedInput.data.confirmTitle !== exhibitionTitle) {
    return {
      ok: false,
      error: "Confirmation text mismatch. Type the exact title to delete.",
    };
  }

  await exhibitionRef.delete();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/exhibitions");
  revalidatePath(`/dashboard/exhibitions/${parsedInput.data.exhibitionId}`);

  return { ok: true, deletedId: parsedInput.data.exhibitionId };
}

