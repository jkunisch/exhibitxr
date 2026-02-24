import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadMetadata,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Uploads a .glb file to Firebase Storage with progress tracking.
 * Path: /tenants/{tenantId}/models/{timestamp}-{filename}
 * Constraints: .glb only, max 50MB, custom metadata.
 */
export async function uploadGlbFile(
  tenantId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  // 1. Client-side validation: .glb only
  if (!file.name.toLowerCase().endsWith(".glb")) {
    throw new Error("Only .glb files are allowed.");
  }

  // 2. Client-side validation: max 50MB
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    throw new Error("File is too large. Maximum size is 50MB.");
  }

  // 3. Sanitize filename (remove non-alphanumeric except dots/dashes)
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `tenants/${tenantId}/models/${Date.now()}-${sanitizedName}`;
  const storageRef = ref(storage, filePath);

  // 4. Set custom metadata (as required by security rules and prompt)
  const metadata: UploadMetadata = {
    contentType: "model/gltf-binary", // Standard for .glb
    customMetadata: {
      tenantId,
      isPublished: "false",
      originalName: file.name,
    },
  };

  // 5. Start resumable upload
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        
        // Human-readable error messages based on Firebase error codes
        switch (error.code) {
          case "storage/unauthorized":
            reject(new Error("Permission denied. Check your authentication."));
            break;
          case "storage/canceled":
            reject(new Error("Upload canceled."));
            break;
          case "storage/quota-exceeded":
            reject(new Error("Storage quota exceeded. Please contact support."));
            break;
          default:
            reject(new Error("Failed to upload file. Please try again."));
        }
      },
      async () => {
        // 6. Handle successful upload
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(new Error("Failed to retrieve the file URL after upload."));
        }
      }
    );
  });
}
