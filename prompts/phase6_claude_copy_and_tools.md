# 🤖 CLAUDE TASK ASSIGNMENT: Growth OS - Copy & Drop Tools
**Project:** ExhibitXR (3D-Snap)
**Context:** We are splitting the implementation of a massive Programmatic SEO & Growth Architecture. Gemini CLI is handling the dynamic pSEO Next.js routing in the main repository. YOUR job is to handle high-converting Copywriting pages and "Engineering as Marketing" Drop-Tools in an isolated Git Worktree.

---

### ⚠️ CRITICAL INSTRUCTIONS FOR CLAUDE
You are working in a dedicated git worktree located at: `../exhibitxr-claude` (which should be your current workspace root if opened correctly).
Your current branch is: `feature/copy-and-tools-claude`.
**DO NOT** modify the `src/data/industries.ts` file or the `app/3d-snap` programmatic routes. Gemini is handling those.
**DO NOT** change the `src/types/schema.ts` file.

---

## 🎯 YOUR TASKS (Execute one by one)

### TASK 1: Category Home & Intent Interception Pages
**Goal:** Build the "Money Pages" that reframe "3D model generation" into the transitive verb "to snap". We need a split-screen narrative comparing old agencies vs. our 3D-Snap workflow.

1. **Create `/app/was-ist-3d-snap/page.tsx`:**
   - Build a highly visual page defining "3D-Snap".
   - Include a visual Split-Screen Section: Left Side = "Agency Workflow" (3 weeks, 1500€, complex briefings). Right Side = "3D-Snap" (Smartphone upload, 30 seconds, Cents). Use Tailwind 4, Framer Motion, and high-contrast styling (black/zinc/neon blue).
2. **Create `/app/foto-zu-3d-modell/page.tsx`:**
   - This is an SEO interception page. The H1 should acknowledge the search intent but immediately pivot: *"Wenn du ein 3D-Modell aus einem Foto erstellen willst: Hör auf zu suchen. Snap es."*
   - Embed the `<HomeSnapModule />` here as the main interactive element.
3. **Create `/app/3d-snap-vs-agentur/page.tsx`:**
   - Pure B2B objection crusher page. Focus on "Zero-Impact 3D" (file sizes), "Time-to-Catalog" and ROI.

### TASK 2: Engineering as Marketing - The Drop Tools
**Goal:** Build free utility tools that act as SEO magnets for Developers and E-Commerce Managers.

1. **Build `/app/(tools)/tools/glb-size-checker/page.tsx`:**
   - **UI:** A drag-and-drop zone where users drop an existing `.glb` or `.gltf` file (e.g. from an expensive agency).
   - **Logic (Client-side):** Read the file size in JS (`file.size`).
   - **Output:** Render a beautiful dashboard showing the MB size. If size > 3MB, render it in red and calculate a simulated "Mobile Load Time" (e.g. 5 seconds on 4G). Give it a "Snap Score".
   - **The Upsell Hook:** Render a massive CTA below it: *"Dieses Modell ruiniert deine Shop-Performance. Lade einfach das Produktfoto hoch und lass 3D-Snap ein komprimiertes < 2MB Asset generieren."*
2. **Build `/app/(tools)/tools/ar-preview-generator/page.tsx`:**
   - A tool where users can upload a GLB, and it generates an iOS Quick Look / Android Scene Viewer QR-Code. (Use `qrcode.react` or similar to generate the QR code pointing to a viewer route).

---

### Execution Rules for Claude:
- Work iteratively. Show me the code for Task 1 first, let me test it, then move to Task 2.
- Adhere strictly to the UI design system (black backgrounds `#010102`, zinc accents, `#00aaff` neon blue highlights, strict `rounded-[2rem]` or `3rem` borders).
- Ensure 100% TypeScript strictness and zero `any` types.
- Validate your work by running `tsc --noEmit` and `npm run lint`.