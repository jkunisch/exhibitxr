# Task: Implement Texture Enhancement (Upscale & Denoise) Credit Sink

**Context:** AI-generated 3D models (from Tripo/Meshy) often suffer from low-resolution (1K) or noisy textures. Our roadmap dictates a "Premium Credit Sink" feature where users can click a button to magically upscale their model's textures to 4K using an AI upscaler API.

**Objective:** Build a server-side pipeline to extract, upscale, and re-pack textures inside a GLB file, and expose this in the Editor UI as a premium feature requiring credits.

**Implementation Steps:**
1. **Server Action (`src/app/actions/upscaleTextures.ts`):** 
   - Create a new Next.js server action.
   - It should accept an `exhibitId` and the current `glbUrl`.
   - Use `@gltf-transform/core` to parse the GLB and extract the base color / normal textures.
   - **API Integration:** Call an external Image Upscaling API (e.g., Replicate using `replicate` SDK, or Photoroom API). *Note: For this implementation, mock the actual API call with a `setTimeout` and a dummy response if no API key is provided in `.env`.*
   - Replace the old textures with the upscaled ones, write the new GLB buffer, and upload it to Firebase Storage (e.g., `_upscaled.glb`).
   - Deduct 1 Credit from the Tenant's `generationCredits` (use existing Firebase Admin logic).
2. **UI Integration (`src/components/editor/EditorForm.tsx`):**
   - In the "Modell" or "Varianten" section, add a prominent, premium-styled button: "✨ Texturen auf 4K hochskalieren (1 Credit)".
   - Implement loading states (e.g., `<Loader2 />`) and error handling via `alert` or toast notifications.
3. **Graceful Degradation:** If the GLB parsing fails or the API times out, catch the error and return a user-friendly message without crashing the server.

**Quality & Testing Requirements:**
- **Strict Typing:** No `any`. Ensure all `@gltf-transform` and API types are strictly defined.
- **Regression Tests:** You MUST run `npx tsc --noEmit` and `npx tsx tests/regression.test.ts` to guarantee that the billing/credit logic and model variants aren't broken.
- Ensure the button is disabled if the user has 0 credits.