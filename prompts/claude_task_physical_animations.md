# Task: Implement Physical Entry Animations for 3D Models

**Context:** We want to give the 3D-SNAP viewer an "Apple-website-like" feel. When a model loads in the viewer or embed, it shouldn't just instantly appear; it should have a smooth, physical entry animation (e.g., floating up, or dropping down with a slight bounce).

**Objective:** Add an "Entry Animation" setting to the ExhibitXR schema and implement the physics-like motion using `@react-spring/three` or `framer-motion-3d` in the Viewer.

**Implementation Steps:**
1. **Schema Update (`src/types/schema.ts`):**
   - Add `entryAnimation: z.enum(["none", "float", "drop", "spin-in"]).default("none")` to the `ExhibitConfigSchema`.
   - **Critical:** Using `.default("none")` ensures older Firestore documents parse flawlessly.
2. **UI Integration (`src/components/editor/EditorForm.tsx`):**
   - In the "Allgemein" (General) section, add a dropdown or button group for "Start-Animation".
   - Map the options to visually pleasing labels (e.g., "Keine", "Sanftes Schweben", "Drop-In", "Spin").
3. **Canvas Wiring (`src/components/3d/ModelViewer.tsx`):**
   - Install or utilize `@react-spring/three` (preferred for R3F) or implement a custom `useFrame` hook.
   - If `config.entryAnimation === "float"`, make the model's Y-position gently oscillate using a sine wave inside `useFrame`.
   - If `config.entryAnimation === "drop"`, animate the model's Y-position from `+5` down to its actual `config.position[1]` with an elastic/spring physics effect upon loading.
   
**Quality & Testing Requirements:**
- **Performance:** Ensure animations do not leak memory or cause infinite re-renders. Use `useFrame` effectively or rely on battle-tested Spring physics.
- **PivotControls Compatibility:** If the user is actively using `PivotControls` to move the model in Editor mode, the "Float" animation MUST be temporarily disabled to prevent conflicting position updates.
- **Regression Tests:** You MUST run `npx tsc --noEmit` and `npx tsx tests/regression.test.ts` to guarantee that the schema update didn't break backend parsing.