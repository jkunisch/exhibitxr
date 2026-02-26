# Claude Task: Adaptive Mobile Performance Optimization for 3D Viewer

**Context:**
We have a React Three Fiber (R3F) application (`exhibitxr`) that renders high-quality PBR models. The current implementation in `ViewerCanvas.tsx` looks gorgeous on desktop (using 2048px shadow maps, `antialias: true`, and DPR up to 2.0). However, on mobile devices (especially those with high-density Retina displays), the GPU is overloaded, leading to laggy orbit controls and low framerates.

**Objective:**
Implement a strict "Adaptive Quality" system within `src/components/3d/ViewerCanvas.tsx`. The goal is to detect if the user is on a mobile device and aggressively throttle render-heavy features *only* for mobile, preserving the "State of the Art" look on desktop.

**Target File:**
`src/components/3d/ViewerCanvas.tsx`

**Requirements & Acceptance Criteria:**

1.  **Mobile Detection:**
    *   Implement a robust client-side check to determine if the device is mobile (e.g., `window.innerWidth < 768` or checking `navigator.userAgent`).
    *   Ensure this check is hydration-safe (SSR compatible). Use a `useState` and `useEffect` pattern so the server renders a safe default, and the client updates it upon mounting.

2.  **DPR (Device Pixel Ratio) Throttling:**
    *   Desktop: Keep `dpr={[1, 2]}` (or the dynamic `PerformanceMonitor` setup we currently have).
    *   Mobile: Force a lower cap, e.g., `dpr={[1, 1.5]}` or strictly `dpr={1}`. Mobile Retina displays try to push too many pixels; capping the DPR is the #1 way to gain FPS.

3.  **Disable Anti-Aliasing on Mobile:**
    *   Desktop: `gl={{ antialias: true, ... }}`
    *   Mobile: `gl={{ antialias: false, ... }}`. On small, high-density screens, aliasing is barely noticeable, but the performance cost of MSAA is huge.

4.  **Downgrade Shadow Map Resolution:**
    *   Locate the `<directionalLight castShadow ... />` component.
    *   Desktop: `shadow-mapSize-width={2048}` and `shadow-mapSize-height={2048}`.
    *   Mobile: Reduce this to `1024` or even `512`.

5.  **Graceful Degradation (Optional but recommended):**
    *   If you see fit, you can also reduce the `blur` or `scale` of `<ContactShadows>` on mobile, as this component requires multiple render passes.

**Constraint:**
Do NOT change the overall lighting logic, color grading (`ACESFilmicToneMapping`), or the integration with the `useEditorStore`. Strictly focus on performance toggles based on the device type.

**Output Expected:**
Provide the complete, updated code for `src/components/3d/ViewerCanvas.tsx` with inline comments explaining the performance throttles.
