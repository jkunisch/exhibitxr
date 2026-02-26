# Task: Implement Basic Scene Staging (Turntable Animation)

**Context:** We are building a "State of the Art" 3D product viewer (`exhibitxr`). A highly requested feature from our roadmap is "Basic Scene Staging" — specifically, a turntable animation that slowly rotates the model to showcase it dynamically without user interaction.

**Objective:** Add an "Auto-Rotate" (Turntable) toggle to the ExhibitXR Editor, persisting the setting in the database and reflecting it live in the 3D Canvas.

**Implementation Steps:**
1. **Schema Update (`src/types/schema.ts`):** Add `autoRotate: z.boolean().default(false)` to the `ExhibitConfigSchema`. **Critical:** You must use `.default(false)` to maintain strict backward compatibility so older Firestore documents parse successfully without this field.
2. **UI Integration (`src/components/editor/EditorForm.tsx`):** Add a sleek toggle switch for "Turntable Animation" (Auto-Rotate) in the "Allgemein" (General) or a suitable section of the editor form. Match the existing UI components (e.g., the Contact Shadows toggle style).
3. **Canvas Wiring (`src/components/editor/EditorShell.tsx` & `src/components/3d/ViewerCanvas.tsx`):** Pass the `autoRotate` value from the `effectiveConfig` down to the `ViewerCanvas`. Note that `ViewerCanvas` already accepts an `autoRotate` prop which is wired to `@react-three/drei`'s `OrbitControls`.

**Quality & Testing Requirements:**
- **Clean Code:** Write robust, type-safe TypeScript. Do not use `any`.
- **Regression Tests:** After implementation, you MUST run `npx tsc --noEmit` and `npx tsx tests/regression.test.ts` to guarantee no existing business logic or schema parsing rules were broken.
- **Intelligent UX:** OrbitControls naturally pauses rotation when the user interacts. Ensure this behavior is preserved so the staging feels professional.