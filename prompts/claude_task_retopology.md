# Task: Implement Basic Retopology & Decimation Tool

**Context:** Our 3D models (especially AI-generated ones) can be excessively heavy with high polycounts. Our roadmap defines a "Basic Retopology (Decimation)" feature to act as a "garbage collector" for dense meshes, drastically improving Web and AR performance. We already possess the core logic in `src/lib/glbOptimizer.ts` using `gltf-transform` and `MeshoptSimplifier`.

**Objective:** Expose a "Pro Optimize" (Decimation) tool in the Editor UI that triggers a server-side optimization of the current 3D model, reducing its file size and updating the exhibit.

**Implementation Steps:**
1. **Server Action (`src/app/actions/optimizeModel.ts`):** Create a new Next.js server action. It should:
   - Accept an `exhibitId` and the current `glbUrl`.
   - Download the GLB buffer.
   - Pass it through `optimizeGlb()` from `src/lib/glbOptimizer.ts`.
   - Upload the optimized buffer back to Firebase Storage (overwriting or creating a new `_optimized.glb` file).
   - Update the Firestore document (`exhibits/{exhibitId}`) with the new URL and increment a potential "optimization count" or just return success.
2. **UI Integration (`src/components/editor/EditorForm.tsx`):** In the "Modell" section, add a clear "Modell optimieren & komprimieren" button. 
3. **UX State Management:** Implementing intelligent loading states is crucial. The optimization process takes time. Show a clear loading indicator (e.g., `Loader2` from Lucide) inside the button and disable it while processing to prevent duplicate requests.
4. **Credit Sink Architecture:** Add a comment or a structural placeholder indicating where a "Credit" check and deduction would occur, as this is planned as a premium API feature.

**Quality & Testing Requirements:**
- **Clean Code & Error Handling:** Ensure the server action has robust `try/catch` blocks. If `gltf-transform` fails on a malformed file, the app must not crash; it should return a graceful error to the UI.
- **Regression Tests:** You MUST run `npx tsc --noEmit` and `npx tsx tests/regression.test.ts`. Verify that this new isolated action does not interfere with or break the existing `generate3d.ts` creation pipeline.