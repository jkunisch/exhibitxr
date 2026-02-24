# Gemini Deep Think — Task 2: Premium Dashboard mit Analytics-Grade UI

## Kontext
Du arbeitest an **ExhibitXR**, einem B2B SaaS für interaktive 3D-Produkt-Showrooms.

**Stack:** Next.js 16, React 19, TailwindCSS 4, Framer Motion 12, Zustand 5, Firebase (Firestore), lucide-react, TypeScript strict.

Lies `/.context.md` für vollständige Architektur. Lies `src/types/schema.ts` für Typen (NICHT ändern).

## Auftrag
Das aktuelle Dashboard (`src/app/(dashboard)/dashboard/page.tsx`) ist eine Entwickler-Ansicht.
Redesigne es zu einem **Premium B2B Control Center** auf dem Niveau von Linear, Vercel, oder Stripe Dashboard.

Firmen-Kunden loggen sich ein und sollen sofort denken: "Das ist ein Premium-Produkt."

---

## Architektur

### Design-Philosophie
- **Dunkles Theme**: `#0a0a0f` Basis, `#00aaff` Akzent, subtile Gradients
- **Glassmorphism**: Nicht übertreiben — nur auf primären Containern
- **Information Hierarchy**: Wichtigstes zuerst, progressive Disclosure
- **Micro-Animations**: Subtil aber spürbar — nichts Flashiges
- **Data-Driven**: Jede Zahl erzählt eine Geschichte

### 1. `src/components/dashboard/StatsGrid.tsx` (NEU — Client Component)

Obere Stats-Zeile mit 4 Metriken:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ▲ 12        │ │ ● 8         │ │ 👁 2.4k      │ │ ⏱ 45s       │
│ Exhibitions │ │ Published   │ │ Views (30d) │ │ Avg. Session│
│ +3 this mo  │ │ 67% rate    │ │ +12% ↑      │ │ -5% ↓       │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

- Props: `stats: { total: number, published: number, views: number, avgSession: number, trends: {...} }`
- Jede Karte: `bg-white/[0.04]`, `border border-white/[0.08]`, `rounded-2xl`
- Trend-Indikator: grün ↑ oder rot ↓ mit prozentualem Vergleich
- **Counter-Animation**: Zahlen zählen von 0 hoch bei Mount (Framer Motion `useSpring`)
- **Stagger-Animation**: Karten erscheinen nacheinander (50ms Delay pro Karte)
- Responsive: 4 Spalten Desktop, 2 Tablet, 1 Mobile

**Hinweis**: Views und Session-Daten sind Mock-Daten für jetzt. Definiere die Props sauber,
damit echte Analytics später einfach eingesteckt werden können.

### 2. `src/components/dashboard/ExhibitionGrid.tsx` (NEU — Client Component)

Ersetze die einfache `<ul>` durch ein Premium Card Grid:

Jede Karte:
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │    3D Preview Gradient    │  │  ← Gradient-Thumbnail (kein echtes 3D)
│  │    + Environment Icon     │  │     Farbe basiert auf `environment` Preset
│  └───────────────────────────┘  │
│                                 │
│  Cyber-Gear Configurator        │  ← Titel
│  city • 2 variants • 2 hotspots│  ← Metadata-Zeile
│                                 │
│  ┌──────┐  ┌──────┐  ┌───────┐ │
│  │ Edit │  │Embed │  │ Share │ │  ← Action Buttons
│  └──────┘  └──────┘  └───────┘ │
│                                 │
│  Updated: 24.02.2026, 14:00     │
│  ● Published                    │  ← Status Badge
└─────────────────────────────────┘
```

**Thumbnail-Gradient Logic:**
```typescript
const ENV_GRADIENTS: Record<string, string> = {
  studio: 'from-slate-800 via-slate-600 to-slate-900',
  city: 'from-sky-900 via-blue-800 to-slate-900',
  sunset: 'from-orange-900 via-rose-800 to-purple-900',
  warehouse: 'from-amber-900 via-stone-800 to-zinc-900',
  // ... etc
};
```

**Hover-Effekt:**
- Scale: `1.0 → 1.02` (subtil)
- Border: `white/8 → white/20`
- Shadow: `0 0 0 → 0 8px 32px rgba(0,170,255,0.08)`
- Transition: `300ms ease-out`

**Action Buttons:**
- "Edit" → `/dashboard/editor/{id}` (lucide `Pencil`)
- "Embed" → Kopiert Embed-Code in Clipboard + Toast (lucide `Code2`)
- "Preview" → Öffnet `/embed/{id}` in neuem Tab (lucide `ExternalLink`)

**Embed-Code Format:**
```html
<iframe src="https://exhibitxr.com/embed/{id}" width="100%" height="600" frameborder="0" allow="xr-spatial-tracking" allowfullscreen></iframe>
```

**Layout:** CSS Grid mit `auto-fill, minmax(320px, 1fr)` — fluid responsive ohne Breakpoints.

### 3. `src/components/dashboard/ActivityFeed.tsx` (NEU — Client Component)

Rechte Sidebar oder unterer Bereich mit Timeline:

```
Letzte Aktivitäten
──────────────────
🎨 14:02  Cyber-Gear Configurator bearbeitet
📤 12:30  Industrial Viewer veröffentlicht
🆕 11:15  Neue Ausstellung "Luxus-Uhr" erstellt
🤖 10:45  3D-Modell generiert (KI)
```

- Props: `activities: Array<{ type, title, timestamp, exhibitionId }>`
- Activity Types: `edited`, `published`, `created`, `model_generated`, `viewed`
- Jeder Eintrag: Icon + relative Zeit + Titel
- Max 10 Einträge
- Framer Motion `AnimatePresence` für Live-Updates

**Hinweis:** Für jetzt Mock-Daten basierend auf `updatedAt` der Exhibitions.
Definiere das Interface sauber für spätere Firestore-Integration.

### 4. `src/components/dashboard/DashboardHeader.tsx` (NEU — Client Component)

Ersetzt den statischen Header in `layout.tsx`:

```
┌──────────────────────────────────────────────────┐
│  Guten Tag, Jonathan 👋                          │
│  3 Ausstellungen aktiv • 8 veröffentlicht        │
│                                                   │
│  ┌──────────────────┐  ┌─────────────────┐       │
│  │ + Neue Ausstellung│  │ 📸 Foto → 3D   │       │
│  └──────────────────┘  └─────────────────┘       │
└──────────────────────────────────────────────────┘
```

- Zeitbasierter Gruß (6-12: Morgen, 12-18: Tag, 18-22: Abend, 22-6: Nacht)
- Statistik-Zeile unter dem Gruß
- Quick Action Buttons (primary + secondary)

### 5. `src/app/(dashboard)/dashboard/page.tsx` (MODIFIZIEREN)

Assembliere alles:

```tsx
// Server Component — Firestore Queries bleiben serverseitig
export default async function DashboardPage() {
  // ... existierende Auth + Firestore Logic ...

  return (
    <>
      <DashboardHeader userName={...} stats={...} />
      <StatsGrid stats={...} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <ExhibitionGrid exhibitions={...} />
        <ActivityFeed activities={...} />
      </div>
    </>
  );
}
```

### 6. `src/components/ui/Toast.tsx` (NEU — Client Component)

Minimaler Toast für Embed-Code-Copy Feedback:
- Erscheint bottom-center
- "Embed-Code kopiert! ✓"
- Auto-dismiss nach 3s
- Framer Motion slide-up + fade
- Nutze `createPortal` für z-index Safety

---

## Technische Anforderungen

1. **Server/Client Split**: `page.tsx` bleibt Server Component. Alle interaktiven Komponenten sind `'use client'`
2. **Serialization Boundary**: Nur serializable Props (keine Funktionen) von Server → Client übergeben
3. **Performance**: `React.memo` auf `ExhibitionCard` da die Grid re-renders vermeiden soll
4. **Accessibility**: Alle Buttons haben `aria-label`, Focus-visible Styles
5. **TypeScript strict**: Kein `any`. Definiere saubere Interfaces für alle Props
6. **Tailwind 4**: Keine `@apply` — utility-first direkt in JSX
7. **Framer Motion**: `motion.div` mit `initial`, `animate`, `transition` — kein `whileInView` in SSR
8. **Teste mit `npm run build`**

## Output
Vollständiger, fertiger Code für alle 6 Dateien. Kein Pseudocode, keine TODOs.
