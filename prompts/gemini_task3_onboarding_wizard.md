# Gemini Deep Think — Task 3: Intelligent Onboarding & First-Run Experience

## Kontext
Du arbeitest an **ExhibitXR**, einem B2B SaaS für interaktive 3D-Produkt-Showrooms.

**Stack:** Next.js 16, React 19, TailwindCSS 4, Framer Motion 12, Zustand 5, Firebase, lucide-react, TypeScript strict.

Lies `/.context.md` für vollständige Architektur.

## Problem
Ein neuer Kunde registriert sich → landet auf einem leeren Dashboard → weiß nicht was tun → churnt.
Wir brauchen einen **Onboarding Flow** der den Kunden innerhalb von 60 Sekunden zu seinem
ersten 3D-Ergebnis führt.

## Auftrag
Baue eine **Guided First-Run Experience** die intelligent erkennt ob der User neu ist
und ihn durch die Kern-Value-Proposition führt: Foto → 3D → Embed.

---

## Architektur

### 1. `src/components/onboarding/OnboardingFlow.tsx` (NEU — Client Component)

**State Machine** (nicht einfach Steps, sondern echte Zustandsmaschine):

```typescript
type OnboardingState =
  | { step: 'welcome' }
  | { step: 'choose_path'; selectedPath?: 'photo' | 'upload' | 'demo' }
  | { step: 'configure'; title: string; environment: string }
  | { step: 'processing'; exhibitionId: string }
  | { step: 'complete'; exhibitionId: string; embedCode: string };

type OnboardingAction =
  | { type: 'START' }
  | { type: 'SELECT_PATH'; path: 'photo' | 'upload' | 'demo' }
  | { type: 'CONFIGURE'; title: string; environment: string }
  | { type: 'CREATED'; exhibitionId: string }
  | { type: 'BACK' }
  | { type: 'SKIP' };
```

Implementiere mit `useReducer` — kein Zustand Store (lokal zum Wizard).

**Step 1 — Welcome:**
- Headline: "Willkommen bei ExhibitXR"
- Subline: "In unter 60 Sekunden haben Sie Ihren ersten interaktiven 3D-Showroom."
- Animierte Illustration: Drei schwebende 3D-Würfel die rotieren (CSS-only, `@keyframes`)
- "Los geht's" CTA Button mit Glow-Effekt
- "Überspringen" Link (subtle, text-white/40)

**Step 2 — Choose Path:**
3 Karten nebeneinander, jede anklickbar:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  📸              │ │  📦              │ │  🎮              │
│  Foto hochladen  │ │  GLB-Datei       │ │  Demo testen     │
│                  │ │                  │ │                  │
│  Laden Sie ein   │ │  Sie haben       │ │  Starten Sie     │
│  Produktfoto     │ │  bereits ein     │ │  mit einem       │
│  hoch — unsere   │ │  3D-Modell?      │ │  Beispiel-Modell │
│  KI macht den    │ │  Laden Sie es    │ │  und erkunden    │
│  Rest.           │ │  direkt hoch.    │ │  den Editor.     │
│                  │ │                  │ │                  │
│  ⚡ KI-powered   │ │  🔄 Sofort       │ │  ✨ In 10 Sek.   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

- Hover: `scale(1.03)` + `border-[#00aaff]` + `shadow-glow`
- Selected: Fester `border-[#00aaff]` + Checkmark Overlay
- `AnimatePresence` mit stagger (100ms pro Karte)

**Step 3 — Configure:**
- Titel-Input (pre-filled: "Meine erste Ausstellung")
- Environment-Auswahl als visuelle Thumbnails (nicht Dropdown!)
  - 6 Presets: studio, city, sunset, warehouse, forest, apartment
  - Jeder Thumbnail: 80x60px Gradient (Farben aus `EditorForm.tsx` ENVIRONMENT_THUMBNAILS)
  - Selected: Ring + Glow
- Preview: kleines Mockup-Fenster das den gewählten Background-Gradient zeigt
- "Ausstellung erstellen" Button

**Step 4 — Processing:**
- Nur bei "Foto" Path:
  - Upload Progress Bar
  - "KI generiert Ihr 3D-Modell..." Text
  - Estimated Time: "~2-4 Minuten"
  - Animierter Spinner (CSS, nicht GIF)
- Bei "Demo" Path: direkt weiter zu Step 5
- Bei "GLB" Path: File Upload mit Progress → weiter

**Step 5 — Complete:**
- Konfetti-Explosion (CSS `@keyframes` mit 30 `<span>` Partikeln, verschiedene Farben)
- "Ihre Ausstellung ist bereit! 🎉"
- Embed-Code Vorschau (`<code>` Block mit Copy-Button)
- Zwei CTAs:
  - "Im Editor öffnen" → `/dashboard/editor/{id}` (Primary)
  - "Live-Vorschau" → `/embed/{id}` (Secondary, neuer Tab)

### 2. `src/components/onboarding/EnvironmentPicker.tsx` (NEU)

Wiederverwendbare Komponente für Environment-Auswahl:
- Grid von Gradient-Thumbnails
- Keyboard-navigierbar (Pfeiltasten)
- `aria-label` auf jedem Thumbnail
- Selected-State mit Ring + Scale
- Emits: `onSelect(preset: string)`

### 3. `src/components/onboarding/ConfettiExplosion.tsx` (NEU)

CSS-only Konfetti (keine Library):
```tsx
// 30 Partikel mit zufälligen:
// - Startpositionen (center, leicht gestreut)
// - Endpositionen (weit verstreut, gravity-affected)
// - Rotation (3D rotate)
// - Farben (#00aaff, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)
// - Delays (0-500ms)
// - Durationen (1-2s)
// Animation: translateY + translateX + rotateZ + opacity
```
Auto-cleanup nach 3s. Keine DOM-Leftovers.

### 4. `src/hooks/useOnboardingStatus.ts` (NEU)

```typescript
export function useOnboardingStatus(exhibitionCount: number): {
  shouldShowOnboarding: boolean;
  dismissOnboarding: () => void;
} {
  // LocalStorage key: 'exhibitxr_onboarding_dismissed'
  // Show onboarding if: exhibitionCount === 0 AND not dismissed
}
```

### 5. Integration in Dashboard

In `src/app/(dashboard)/dashboard/page.tsx`:
```tsx
// Server Component
const exhibitions = await listTenantExhibitions(sessionUser.tenantId);

return exhibitions.length === 0
  ? <OnboardingWrapper tenantId={sessionUser.tenantId} />
  : <DashboardContent exhibitions={exhibitions} />;
```

Erstelle `OnboardingWrapper` als thin Client Component wrapper der den Hook nutzt
und entweder den Wizard oder die "Empty State" Nachricht zeigt.

---

## Technische Anforderungen

1. **Reducer statt useState-Chaos**: `useReducer` mit typed Actions für den Flow
2. **Server Action Integration**: Nutze `createExhibitionAction` aus `src/app/actions/exhibitions.ts`
3. **Kein neuer State Store**: Wizard-State ist lokal, nicht global
4. **Accessibility**: Focus Management bei Step-Wechsel (`autoFocus` auf ersten interaktiven Element)
5. **Keyboard Navigation**: Enter zum Fortfahren, Escape zum Schließen
6. **Animation**: `AnimatePresence` + `motion.div` mit `exit` Prop für smooth Step Transitions
7. **Mobile-First**: Steps stacken vertikal auf Mobile, Cards werden full-width
8. **TypeScript strict**: kein `any`, saubere Discriminated Unions für State
9. **Teste mit `npm run build`**

## Output  
Vollständiger Code für alle 5 Dateien. Kein Pseudocode.
