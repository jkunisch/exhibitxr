# ExhibitXR - Gemini CLI Instructions

## Projekt
**3D-SNAP / ExhibitXR**: Modernes 3D-Studio für Creator & moderne Brands. 
Weg vom steifen B2B-SaaS, hin zum schnellen, "geilen" Prosumer-Produkt. 

## ZUERST LESEN
- `/.context.md` — Aktuelle Architektur, Vision & Status.
- `/src/types/schema.ts` — Single Source of Truth für alle Typen (Heilig).

## Fokus & Regeln
- **Modernes Wording:** Wir sprechen von "Studio", "Pro-Modellen" und "Creator-Assets", nicht von "Tenant" oder "B2B SaaS".
- **Mobile-First:** Jede UI-Komponente (besonders das Studio) muss auf dem Handy perfekt performen.
- **Omnichannel AR:** Jedes Modell braucht ein GLB (Web/Android) und ein USDZ (iOS) Asset.
- **Speed & Quality:** Optimierung der GLB-Files auf < 3MB ist Pflicht.

## Technische Standards
- Next.js 16, TypeScript strict (kein `any`).
- Firestore: Daten unter `/tenants/{tenantId}/` (technisch beibehalten).
- Auth: Google Login + Session Cookies + Custom Claims (`studioId`, `role`).
- Server Actions für alle Backend-Operationen.
- **Deployment:** Vercel Git-Webhook ist kaputt. Nach `git push` immer manuell deployen:
  ```bash
  npx vercel --prod --yes
  ```

## Aktuelle Priorität (Next Steps)
1. **USDZ Conversion:** Integration in die AI-Pipeline in `generate3d.ts`.
2. **Studio UI:** Redesign des Dashboards und des `ModelGeneratorPanel` für den "Magic Camera" Look.
3. **Quality Tuning:** Meshy-API Parameter für maximale Geometrie-Qualität anpassen.

---
*Anmerkung: Bei Unsicherheit über Architektur-Entscheidungen immer nachfragen, aber bei der Umsetzung von UI-Details proaktiv moderne Design-Standards (OLED-optimiert, Framer Motion) anwenden.*
