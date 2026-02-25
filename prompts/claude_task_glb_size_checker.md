# 🤖 CLAUDE TASK ASSIGNMENT: Engineering as Marketing - GLB Size Crusher
**Project:** ExhibitXR (3D-Snap)
**Context:** We are executing the "3D-Snap Growth OS". We need highly useful, free B2B utilities ("Drop-Tools") that act as SEO magnets and inbound funnels. Your task is to build the first magnet.

---

### ⚠️ CRITICAL INSTRUCTIONS FOR CLAUDE
You are working in a dedicated git worktree located at: `../exhibitxr-claude` (which should be your current workspace root if opened correctly).
Your current branch is: `feature/copy-and-tools-claude`.
**DO NOT** modify the global routing or data files. Focus entirely on the standalone UI component.

---

## 🎯 YOUR TASK: Build the "GLB File-Size Crusher" Tool

**Goal:** Create a standalone tool page where developers and E-Commerce managers can drag and drop their huge, unoptimized `.glb` files (usually delivered by expensive agencies). The tool analyzes the file size completely locally in the browser and gives them a "Snap Score" with an aggressive upsell to use 3D-Snap.

1. **Create the Route:**
   - Create a new folder structure: `src/app/tools/glb-size-checker/page.tsx`.
   - This page must NOT be on the root page. It is a dedicated SEO landing page.

2. **The UI (Tailwind 4 & Framer Motion):**
   - **Hero:** "Dein 3D-Modell ruiniert deine Shop-Performance."
   - **Upload Zone:** A massive, dotted drag-and-drop zone (`accept=".glb,.gltf"`).
   - **Design Language:** Black backgrounds (`#010102`), zinc accents, neon blue (`#00aaff`) highlights. Rounded corners (`rounded-3xl` or `rounded-[2rem]`).

3. **The Logic (Client-Side Only!):**
   - Use standard HTML5 File API `onChange` or drag events.
   - Read `file.size` and convert it to Megabytes (MB).
   - **The Judgement (The Hook):**
     - If `< 2MB`: Green checkmark. "Perfekt für E-Commerce."
     - If `> 2MB` and `< 5MB`: Yellow warning. "Grenzwertig. Kostet Mobile-Conversions."
     - If `> 5MB`: Massive Red Alert. "Performance-Killer. Ladezeit: ~8 Sekunden (4G)."
   - Assign a visual "Snap Score" (e.g., 90/100 for small files, 20/100 for massive files).

4. **The Upsell (The Trojan Horse):**
   - Below the analysis, place a massive CTA:
   - *"Dein Agentur-Modell ist zu groß? 3D-Snap generiert dir aus einem Foto in 30 Sekunden ein hochkomprimiertes, Draco-optimiertes Asset."*
   - Button: `[ 3D-Snap kostenlos testen -> ]` (Link to `/register`).

### Execution Rules:
- The file reading must happen 100% in the browser (no backend upload!). This guarantees privacy and speed.
- Show me the complete code for `page.tsx`.
- Ensure 100% TypeScript strictness. No `any`.
- After generating the code, remind the user to run `tsc --noEmit` to verify type safety.