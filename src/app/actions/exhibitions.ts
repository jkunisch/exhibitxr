"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminDb } from "@/lib/firebaseAdmin";
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
});

const exhibitionIdSchema = z
  .string()
  .trim()
  .min(1, "Missing exhibition id.");

const deleteSchema = z.object({
  exhibitionId: exhibitionIdSchema,
  confirmTitle: z
    .string()
    .trim()
    .min(1, "Please type the exhibition title to confirm deletion."),
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
  };
}

function extractZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid form input.";
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
    return { ok: false, error: extractZodError(parsedInput.error) };
  }

  const adminDb = getAdminDb();
  const exhibitionId = crypto.randomUUID();
  const now = FieldValue.serverTimestamp();

  await adminDb
    .collection("tenants")
    .doc(sessionUser.tenantId)
    .collection("exhibitions")
    .doc(exhibitionId)
    .set({
      id: exhibitionId,
      tenantId: sessionUser.tenantId,
      title: parsedInput.data.title,
      description: parsedInput.data.description,
      isPublished: parsedInput.data.isPublished,
      environment: parsedInput.data.environment,
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
    return { ok: false, error: extractZodError(exhibitionIdResult.error) };
  }

  const parsedInput = exhibitionInputSchema.safeParse(formDataToPayload(formData));
  if (!parsedInput.success) {
    return { ok: false, error: extractZodError(parsedInput.error) };
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

  await exhibitionRef.update({
    title: parsedInput.data.title,
    description: parsedInput.data.description,
    isPublished: parsedInput.data.isPublished,
    environment: parsedInput.data.environment,
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
    return { ok: false, error: extractZodError(parsedInput.error) };
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

