# Gemini Deep Think — Task 1: Cinematic Showcase Engine

## Kontext
Du arbeitest an **ExhibitXR**, einem B2B SaaS für interaktive 3D-Produkt-Showrooms.

**Stack:** Next.js 16, React 19, React Three Fiber v9 RC, @react-three/drei v10 RC, Three.js 0.183, Zustand 5, TailwindCSS 4, Framer Motion, TypeScript strict.

Lies `/.context.md` für vollständige Architektur. Lies `src/types/schema.ts` für Typen (NICHT ändern).

## Auftrag
Baue einen **Cinematic Showcase Engine** — ein professionelles Kamera- und Lichtsystem,
das 3D-Produkte automatisch inszeniert wie in einem Apple-Keynote-Video.

Das ist der USP von ExhibitXR: Kunden embed den Viewer auf ihrer Website und Besucher
sehen ein cinematisches Produkt-Erlebnis, nicht nur ein statisches 3D-Modell.

---

## Architektur (4 neue Dateien + 1 Modifikation)

### 1. `src/components/3d/CinematicController.tsx` (NEU)

State Machine mit 3 Modi, gesteuert per Zustand Atom:

```typescript
type CinematicMode = 'idle' | 'orbit' | 'showcase';
```

**`idle`**: Standard OrbitControls, User hat volle Kontrolle.

**`orbit`**: Sanfte Auto-Rotation.
- Elliptischer Orbit (nicht kreisförmig!) — `a = 3.5`, `b = 2.8` um Tiefe zu erzeugen
- Sinusförmige Höhenmodulation: `y = baseY + sin(t * 0.4) * 0.3`
- Geschwindigkeit: `0.15 rad/s` (gemessen, nicht gefühlt — nutze `delta`)
- **Interrupt-Logik**: Bei User-Input (pointer down) → sofort `idle`
- **Resume-Logik**: Nach 4s Inaktivität → smooth zurück zu `orbit`
  - Nutze GSAP-ähnliches Easing: `easeInOutCubic` (manuell implementieren, kein GSAP importieren)
  - Interpoliere aktuelle Kamera-Position zur nächsten Orbit-Position über 1.5s

**`showcase`**: Automatische Kamera-Choreografie entlang vordefinierter Keyframes.
- Definiere 5-6 Keyframes als Array von `{ position: Vector3, target: Vector3, duration: number }`
- Catmull-Rom Spline Interpolation zwischen Keyframes (Three.js `CatmullRomCurve3`)
- Looping: nach dem letzten Keyframe → smooth zurück zum ersten
- Timing: jeder Keyframe hält 2s, Transition 1.5s
- Bei User-Input → sofort `idle` mit smooth Transition

**Technische Anforderungen:**
- Nutze `useFrame((state, delta) => { ... })` mit `delta` für frame-unabhängige Animation
- Kamera-Manipulation: `state.camera.position.lerp(target, alpha)` — NICHT `OrbitControls.target` direkt setzen
- Stattdessen: Disable `OrbitControls` via ref wenn nicht `idle`, re-enable danach
- Pointer Event Detection: `onPointerDown` auf dem Canvas
- Performance: Keine Allokationen in `useFrame` (pre-allocate Vector3s mit `useMemo`)

### 2. `src/components/3d/DynamicLightRig.tsx` (NEU)

Physik-basiertes Lichtsystem das auf Kamera-Bewegung reagiert:

**Key Light (Directional):**
- Folgt der Kamera mit 30° Offset (immer leicht links-oben von der Blickrichtung)
- `shadow-mapSize={2048}` für scharfe Schatten
- Intensity variiert mit Kamera-Geschwindigkeit: schnelle Bewegung → leicht gedimmt (0.9), still → volle Kraft (1.3)
- Smooth Easing der Intensity (exponential decay, `tau = 0.3s`)

**Rim Light (Point):**
- Positioniert sich immer gegenüber dem Key Light (180° um das Modell)
- Erzeugt den "Apple-Style" Silhouetten-Effekt
- Intensity: 0.4-0.7, abhängig vom Kamera-Winkel zum Modell
- Farbe: leicht warm (#fff5e6) für natürlichen Kontrast

**Fill Light (Hemisphere):**
- Sky: `#ffffff`, Ground: `#334155` (leicht bläulich für Tiefe)
- Intensity: 0.3 (konstant, Basis-Illumination)

**Accent Light (SpotLight):**
- Fest positioniert von oben (`[0, 8, 0]`), zeigt nach unten
- Erzeugt den "Spotlight-auf-Bühne" Effekt
- `angle={Math.PI / 6}`, `penumbra={0.8}` für weichen Falloff
- Nur aktiv in `showcase` Mode

**Performance-Constraint:**
- Maximal 4 Lichter gleichzeitig aktiv (GPU Budget)
- In `orbit` Mode: Key + Rim + Fill (3)
- In `showcase` Mode: Key + Rim + Fill + Accent (4)
- In `idle` Mode: Statische Positionen, kein `useFrame` Update

### 3. `src/components/3d/PostProcessing.tsx` (NEU)

Subtile Post-Processing Effekte für Premium-Look:

**ACHTUNG**: Nutze KEINE @react-three/postprocessing (nicht installiert).
Implementiere stattdessen mit nativen Three.js Mitteln innerhalb der Canvas-Pipeline:

- **Vignette**: Custom Shader als Screen-Space Overlay
  ```glsl
  // Fragment Shader Konzept:
  float vignette = smoothstep(0.8, 0.2, length(uv - 0.5));
  gl_FragColor = vec4(color.rgb * vignette, 1.0);
  ```
  Implementiere als `<mesh>` mit `ShaderMaterial` das vor der Kamera sitzt (`renderOrder: 999`)

- **Subtiler Bloom-Ersatz**: Erhöhe `toneMappingExposure` beim Showcase-Mode leicht (1.15 → 1.3)
  Nutze `useThree` um `gl.toneMappingExposure` im `useFrame` zu animieren

**Falls die Shader-Lösung zu komplex**: Fallback auf eine einfache CSS-basierte Vignette
über dem Canvas (`box-shadow: inset 0 0 150px rgba(0,0,0,0.4)` auf dem Container-Div).

### 4. `src/store/cinematicStore.ts` (NEU)

Zustand Store für den Cinematic State:

```typescript
interface CinematicState {
  mode: 'idle' | 'orbit' | 'showcase';
  isTransitioning: boolean;
  transitionProgress: number; // 0-1
  lastInteractionTime: number;
  // Actions
  setMode: (mode: CinematicMode) => void;
  recordInteraction: () => void;
  tick: (delta: number) => void; // Called from useFrame
}
```

Logik: `recordInteraction()` setzt `lastInteractionTime = Date.now()` und `mode = 'idle'`.
`tick()` prüft ob `Date.now() - lastInteractionTime > 4000` und triggert Transition zurück zu `orbit`.

### 5. `src/components/3d/EmbedViewer.tsx` (MODIFIZIEREN)

Integration der neuen Komponenten:

- Import `CinematicController`, `DynamicLightRig`
- Neuer Toggle-Button-Gruppe (bottom-right):
  - "Auto" Button → setzt `orbit` Mode
  - "Showcase" Button → setzt `showcase` Mode
  - Aktiver Mode hat `border-[#00aaff]` + Glow
- Buttons: Glassmorphism, `pointer-events-auto`, lucide-react Icons (`RotateCw`, `Film`)
- `CinematicController` und `DynamicLightRig` werden INNERHALB des `<ViewerCanvas>` gerendert
- Übergib `cinematicMode` als Prop an diese Komponenten

---

## Qualitäts-Anforderungen

1. **Keine Allokationen in useFrame** — alle Vektoren pre-allocaten mit `useMemo(() => new THREE.Vector3(), [])`
2. **Frame-unabhängige Animation** — immer `delta` nutzen, nie `Date.now()` in useFrame
3. **Smooth Transitions** — keine abrupten Sprünge, alles mit Lerp/Slerp/Easing
4. **Mobile-Safe** — Touch Events berücksichtigen, keine hover-only Features
5. **TypeScript strict** — kein `any`, keine Type Assertions außer für Three.js Internals
6. **Kein State in useFrame** — nur `getState()` lesen
7. **Testbar** — `npm run build` muss durchgehen

## Output-Format
Gib mir zu jeder Datei den VOLLSTÄNDIGEN, fertigen Code. Kein Pseudocode.
Markiere Änderungen an bestehenden Dateien als Diff-Block.
