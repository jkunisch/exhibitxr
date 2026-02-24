"use client";

import { type ChangeEvent, type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createExhibitionAction } from "@/app/actions/exhibitions";
import { auth } from "@/lib/firebase";
import { uploadGlbFile } from "@/lib/storage";

const MAX_GLB_FILE_SIZE_BYTES = 50 * 1024 * 1024;

type UploadStatus =
  | {
    status: "idle";
  }
  | {
    status: "uploading";
    progress: number;
  }
  | {
    status: "done";
    progress: number;
  }
  | {
    status: "error";
    message: string;
  };

type NewExhibitionFormProps = {
  tenantId: string;
  environmentOptions: readonly string[];
  initialErrorMessage: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Upload failed. Please try again.";
}

async function getTenantIdFromAuthContext(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  const tokenResult = await user.getIdTokenResult();
  const claimTenantId = tokenResult.claims.tenantId;

  if (typeof claimTenantId !== "string" || claimTenantId.trim().length === 0) {
    throw new Error("Missing tenant claim in auth context.");
  }

  return claimTenantId;
}

export default function NewExhibitionForm({
  tenantId,
  environmentOptions,
  initialErrorMessage,
}: NewExhibitionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialErrorMessage);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: "idle" });
  const [glbUrl, setGlbUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleGlbSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setGlbUrl("");
      setUploadStatus({ status: "idle" });
      return;
    }

    const lowerCaseName = selectedFile.name.toLowerCase();
    if (!lowerCaseName.endsWith(".glb")) {
      setGlbUrl("");
      setUploadStatus({ status: "error", message: "Only .glb files are allowed." });
      return;
    }

    if (selectedFile.size > MAX_GLB_FILE_SIZE_BYTES) {
      setGlbUrl("");
      setUploadStatus({
        status: "error",
        message: "File is too large. Maximum size is 50MB.",
      });
      return;
    }

    setUploadStatus({ status: "uploading", progress: 0 });
    setGlbUrl("");

    try {
      const authTenantId = await getTenantIdFromAuthContext();
      if (authTenantId !== tenantId) {
        throw new Error("Tenant mismatch detected. Please refresh the page.");
      }

      const downloadUrl = await uploadGlbFile(
        authTenantId,
        selectedFile,
        (progress) => {
          setUploadStatus({ status: "uploading", progress });
        },
      );

      setGlbUrl(downloadUrl);
      setUploadStatus({ status: "done", progress: 100 });
    } catch (uploadError) {
      setGlbUrl("");
      setUploadStatus({ status: "error", message: getErrorMessage(uploadError) });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (uploadStatus.status === "uploading") {
      setError("Please wait for the GLB upload to finish.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createExhibitionAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/exhibitions/${result.exhibitionId}?created=1`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="glbUrl" value={glbUrl} />

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={120}
          className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
          placeholder="Premium Product Showcase"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-800 dark:text-slate-100"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
          placeholder="High-level summary for your team."
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="environment"
          className="text-sm font-medium text-slate-800 dark:text-slate-100"
        >
          Environment Preset
        </label>
        <select
          id="environment"
          name="environment"
          defaultValue="studio"
          className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white"
        >
          {environmentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="glbFile" className="text-sm font-medium text-slate-800 dark:text-slate-100">
          GLB File (optional, max 50MB)
        </label>
        <input
          id="glbFile"
          type="file"
          accept=".glb"
          onChange={handleGlbSelection}
          className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-3 py-2 text-sm text-slate-900 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-cyan-900 hover:file:bg-cyan-500/30 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:file:text-cyan-100"
        />

        <div className="space-y-1">
          {uploadStatus.status === "idle" ? (
            <p className="text-xs text-slate-600 dark:text-slate-300">Status: idle</p>
          ) : null}

          {uploadStatus.status === "uploading" ? (
            <p className="text-xs text-cyan-700 dark:text-cyan-200">
              Status: uploading ({uploadStatus.progress}%)
            </p>
          ) : null}

          {uploadStatus.status === "done" ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-200">Status: done ✓</p>
          ) : null}

          {uploadStatus.status === "error" ? (
            <p className="text-xs text-rose-700 dark:text-rose-200">
              Status: error ✗ ({uploadStatus.message})
            </p>
          ) : null}

          {(uploadStatus.status === "uploading" || uploadStatus.status === "done") ? (
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{
                  width: `${uploadStatus.status === "uploading" ? uploadStatus.progress : 100}%`,
                }}
              />
            </div>
          ) : null}

          {glbUrl ? (
            <p className="break-all text-xs text-slate-600 dark:text-slate-300">{glbUrl}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
        <input
          type="checkbox"
          name="isPublished"
          className="h-4 w-4 rounded border-slate-400 text-cyan-500 focus:ring-cyan-400/50 dark:border-white/30"
        />
        Publish immediately
      </label>

      {error ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || uploadStatus.status === "uploading"}
        className="rounded-xl border border-cyan-500/45 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
      >
        {isPending ? "Creating..." : "Create Exhibition"}
      </button>
    </form>
  );
}
