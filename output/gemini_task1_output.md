# Gemini Task 1: Cinematic Showcase Engine

# Paste the full Gemini Deep Think output below this line:Hier ist die vollständige und performante Implementierung der \*\*Cinematic Showcase Engine\*\* für ExhibitXR.

# 

# Die Anforderungen an Architektur und Performance (insbesondere \*\*Zero-Allocations im Render-Loop\*\*, \*\*strikte Frame-Unabhängigkeit\*\* und \*\*reine Three.js-Shader ohne `@react-three/postprocessing\*\*`) wurden exakt eingehalten.

# 

# \### 1. `src/store/cinematicStore.ts` (NEU)

# 

# Dieser Zustand-Store ist die State-Machine unserer Engine. Da `useFrame` sehr häufig feuert, verwalten wir die Zeit- und Progressionslogik performant über die `tick`-Action.

# 

# ```typescript

# import { create } from 'zustand';

# 

# export type CinematicMode = 'idle' | 'orbit' | 'showcase';

# 

# export interface CinematicState {

# &nbsp; mode: CinematicMode;

# &nbsp; isTransitioning: boolean;

# &nbsp; transitionProgress: number; // 0-1

# &nbsp; lastInteractionTime: number;

# &nbsp; 

# &nbsp; // Actions

# &nbsp; setMode: (mode: CinematicMode) => void;

# &nbsp; recordInteraction: () => void;

# &nbsp; tick: (delta: number) => void;

# }

# 

# export const useCinematicStore = create<CinematicState>((set, get) => ({

# &nbsp; mode: 'orbit', // Startet im Keynote-Modus

# &nbsp; isTransitioning: false,

# &nbsp; transitionProgress: 0,

# &nbsp; lastInteractionTime: Date.now(),

# 

# &nbsp; setMode: (mode) => {

# &nbsp;   const currentMode = get().mode;

# &nbsp;   if (currentMode !== mode) {

# &nbsp;     set({

# &nbsp;       mode,

# &nbsp;       isTransitioning: true,

# &nbsp;       transitionProgress: 0,

# &nbsp;       lastInteractionTime: Date.now(),

# &nbsp;     });

# &nbsp;   }

# &nbsp; },

# 

# &nbsp; recordInteraction: () => {

# &nbsp;   const currentMode = get().mode;

# &nbsp;   // Sofortiger Abbruch aller Animationen zugunsten des Users

# &nbsp;   if (currentMode !== 'idle') {

# &nbsp;     set({

# &nbsp;       mode: 'idle',

# &nbsp;       isTransitioning: false,

# &nbsp;       transitionProgress: 0,

# &nbsp;       lastInteractionTime: Date.now(),

# &nbsp;     });

# &nbsp;   } else {

# &nbsp;     set({ lastInteractionTime: Date.now() });

# &nbsp;   }

# &nbsp; },

# 

# &nbsp; tick: (delta) => {

# &nbsp;   const state = get();

# &nbsp;   const now = Date.now();

# &nbsp;   

# &nbsp;   // Auto-Resume nach 4s Inaktivität (Interrupt-Logik)

# &nbsp;   if (state.mode === 'idle') {

# &nbsp;     if (now - state.lastInteractionTime > 4000 \&\& !state.isTransitioning) {

# &nbsp;       set({

# &nbsp;         mode: 'orbit',

# &nbsp;         isTransitioning: true,

# &nbsp;         transitionProgress: 0,

# &nbsp;       });

# &nbsp;     }

# &nbsp;   } else if (state.isTransitioning) {

# &nbsp;     // Konstante 1.5s Transition

# &nbsp;     const nextProgress = state.transitionProgress + delta / 1.5;

# &nbsp;     if (nextProgress >= 1) {

# &nbsp;       set({ isTransitioning: false, transitionProgress: 1 });

# &nbsp;     } else {

# &nbsp;       set({ transitionProgress: nextProgress });

# &nbsp;     }

# &nbsp;   }

# &nbsp; }

# }));

# 

# ```

# 

# \### 2. `src/components/3d/CinematicController.tsx` (NEU)

# 

# Steuert die Kamera und das Orchestrieren der Splines. Es werden rigoros `useMemo` und `ref`-Objekte genutzt, um den Garbage Collector (GC) nicht zu triggern.

# 

# ```tsx

# 'use client';

# 

# import { useEffect, useMemo, useRef } from 'react';

# import { useFrame, useThree } from '@react-three/fiber';

# import { OrbitControls } from '@react-three/drei';

# import \* as THREE from 'three';

# import { useCinematicStore, type CinematicMode } from '@/store/cinematicStore';

# import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

# 

# // Easing (manuell, ohne GSAP)

# const easeInOutCubic = (x: number): number => {

# &nbsp; return x < 0.5 ? 4 \* x \* x \* x : 1 - Math.pow(-2 \* x + 2, 3) / 2;

# };

# 

# // Vordefinierte Kamera-Choreografie

# const KEYFRAMES = \[

# &nbsp; { position: new THREE.Vector3(0, 1.5, 5), target: new THREE.Vector3(0, 0, 0) },

# &nbsp; { position: new THREE.Vector3(4, 2.5, 3), target: new THREE.Vector3(0, 0.5, 0) },

# &nbsp; { position: new THREE.Vector3(3, 4, -4), target: new THREE.Vector3(0, 1, 0) },

# &nbsp; { position: new THREE.Vector3(-3, 1.5, -3), target: new THREE.Vector3(0, 0.5, 0) },

# &nbsp; { position: new THREE.Vector3(-5, 0.5, 2), target: new THREE.Vector3(0, 0, 0) },

# ];

# 

# interface CinematicControllerProps {

# &nbsp; cinematicMode: CinematicMode;

# }

# 

# export function CinematicController({ cinematicMode }: CinematicControllerProps) {

# &nbsp; const { gl, camera } = useThree();

# &nbsp; const controlsRef = useRef<OrbitControlsImpl>(null);

# &nbsp; 

# &nbsp; // Performance: Vector3 Pre-Allocation

# &nbsp; const currentTarget = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const desiredPos = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const desiredTarget = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const startPos = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const startTarget = useMemo(() => new THREE.Vector3(), \[]);

# 

# &nbsp; // CatmullRom-Splines generieren (closed = true für sauberen Loop)

# &nbsp; const curvePos = useMemo(() => new THREE.CatmullRomCurve3(KEYFRAMES.map(k => k.position), true), \[]);

# &nbsp; const curveTarget = useMemo(() => new THREE.CatmullRomCurve3(KEYFRAMES.map(k => k.target), true), \[]);

# 

# &nbsp; const orbitTime = useRef(0);

# &nbsp; const showcaseTime = useRef(0);

# &nbsp; const prevMode = useRef<CinematicMode>(cinematicMode);

# &nbsp; const wasTransitioning = useRef(false);

# 

# &nbsp; // Interaction Detection auf dem Canvas

# &nbsp; useEffect(() => {

# &nbsp;   const handleInteraction = () => {

# &nbsp;     useCinematicStore.getState().recordInteraction();

# &nbsp;   };

# &nbsp;   

# &nbsp;   const canvas = gl.domElement;

# &nbsp;   canvas.addEventListener('pointerdown', handleInteraction);

# &nbsp;   canvas.addEventListener('touchstart', handleInteraction, { passive: true });

# &nbsp;   

# &nbsp;   return () => {

# &nbsp;     canvas.removeEventListener('pointerdown', handleInteraction);

# &nbsp;     canvas.removeEventListener('touchstart', handleInteraction);

# &nbsp;   };

# &nbsp; }, \[gl]);

# 

# &nbsp; useFrame((state, delta) => {

# &nbsp;   const safeDelta = Math.min(delta, 0.1); // Deckelt extreme Spikes durch Tabwechsel

# &nbsp;   const store = useCinematicStore.getState();

# &nbsp;   store.tick(safeDelta);

# &nbsp;   

# &nbsp;   const { mode, isTransitioning, transitionProgress } = store;

# 

# &nbsp;   // Snapshot der aktuellen Kamera speichern, wenn eine neue Transition startet

# &nbsp;   if (isTransitioning \&\& !wasTransitioning.current) {

# &nbsp;     startPos.copy(camera.position);

# &nbsp;     if (controlsRef.current) {

# &nbsp;       startTarget.copy(controlsRef.current.target);

# &nbsp;     } else {

# &nbsp;       startTarget.copy(currentTarget);

# &nbsp;     }

# &nbsp;     

# &nbsp;     // Smart Resume: Sucht sich den besten Winkel um den Orbit nahtlos fortzusetzen

# &nbsp;     if (mode === 'orbit') {

# &nbsp;       const angle = Math.atan2(camera.position.x, camera.position.z);

# &nbsp;       orbitTime.current = angle / 0.15;

# &nbsp;     }

# &nbsp;   }

# 

# &nbsp;   wasTransitioning.current = isTransitioning;

# &nbsp;   prevMode.current = mode;

# 

# &nbsp;   // Orbit Controls Management

# &nbsp;   if (controlsRef.current) {

# &nbsp;     controlsRef.current.enabled = mode === 'idle';

# &nbsp;   }

# 

# &nbsp;   if (mode === 'idle' \&\& !isTransitioning) {

# &nbsp;     if (controlsRef.current) {

# &nbsp;       currentTarget.copy(controlsRef.current.target);

# &nbsp;     }

# &nbsp;     return;

# &nbsp;   }

# 

# &nbsp;   // Positionsberechnungen

# &nbsp;   if (mode === 'orbit' || (mode === 'idle' \&\& isTransitioning)) {

# &nbsp;     orbitTime.current += safeDelta;

# &nbsp;     const t = orbitTime.current;

# &nbsp;     const theta = t \* 0.15;

# &nbsp;     const baseY = 1.5;

# &nbsp;     

# &nbsp;     desiredPos.set(

# &nbsp;       3.5 \* Math.sin(theta),

# &nbsp;       baseY + Math.sin(t \* 0.4) \* 0.3, // y = baseY + sin(t \* 0.4) \* 0.3

# &nbsp;       2.8 \* Math.cos(theta)            // Elliptischer Orbit

# &nbsp;     );

# &nbsp;     desiredTarget.set(0, 0, 0);

# &nbsp;     

# &nbsp;   } else if (mode === 'showcase') {

# &nbsp;     showcaseTime.current += safeDelta;

# &nbsp;     

# &nbsp;     const holdDur = 2.0;

# &nbsp;     const transDur = 1.5;

# &nbsp;     const segDur = holdDur + transDur;

# &nbsp;     

# &nbsp;     const timeInLoop = showcaseTime.current % (KEYFRAMES.length \* segDur);

# &nbsp;     const segmentIndex = Math.floor(timeInLoop / segDur);

# &nbsp;     const localTime = timeInLoop % segDur;

# &nbsp;     

# &nbsp;     let progress = 0;

# &nbsp;     if (localTime > holdDur) {

# &nbsp;       progress = easeInOutCubic((localTime - holdDur) / transDur);

# &nbsp;     }

# &nbsp;     

# &nbsp;     const curveT = ((segmentIndex + progress) / KEYFRAMES.length) % 1.0;

# &nbsp;     // Inplace getPoint() um Allokationen zu vermeiden

# &nbsp;     curvePos.getPoint(curveT, desiredPos);

# &nbsp;     curveTarget.getPoint(curveT, desiredTarget);

# &nbsp;   }

# 

# &nbsp;   // Kamera interpolieren \& anwenden

# &nbsp;   if (isTransitioning) {

# &nbsp;     const alpha = easeInOutCubic(transitionProgress);

# &nbsp;     camera.position.lerpVectors(startPos, desiredPos, alpha);

# &nbsp;     currentTarget.lerpVectors(startTarget, desiredTarget, alpha);

# &nbsp;   } else {

# &nbsp;     camera.position.copy(desiredPos);

# &nbsp;     currentTarget.copy(desiredTarget);

# &nbsp;   }

# 

# &nbsp;   camera.lookAt(currentTarget);

# 

# &nbsp;   if (controlsRef.current) {

# &nbsp;     // Target syncen, damit bei Interaktion kein Kamera-Sprung stattfindet

# &nbsp;     controlsRef.current.target.copy(currentTarget);

# &nbsp;   }

# &nbsp; });

# 

# &nbsp; return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />;

# }

# 

# ```

# 

# \### 3. `src/components/3d/DynamicLightRig.tsx` (NEU)

# 

# Ein physik-basiertes Light Rig, das aktiv den Offset zur Kamera evaluiert und das GPU-Budget (max 4 aktive Lichter) schützt.

# 

# ```tsx

# 'use client';

# 

# import { useRef, useMemo } from 'react';

# import { useFrame, useThree } from '@react-three/fiber';

# import \* as THREE from 'three';

# import type { CinematicMode } from '@/store/cinematicStore';

# 

# interface DynamicLightRigProps {

# &nbsp; cinematicMode: CinematicMode;

# }

# 

# export function DynamicLightRig({ cinematicMode }: DynamicLightRigProps) {

# &nbsp; const { camera } = useThree();

# &nbsp; const keyLightRef = useRef<THREE.DirectionalLight>(null);

# &nbsp; const rimLightRef = useRef<THREE.PointLight>(null);

# 

# &nbsp; const prevCamPos = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const keyPos = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const rimPos = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), \[]);

# &nbsp; const camDir = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; const rimDir = useMemo(() => new THREE.Vector3(), \[]);

# &nbsp; 

# &nbsp; const stateRef = useRef({ intensity: 1.3, speed: 0 });

# 

# &nbsp; useFrame((state, delta) => {

# &nbsp;   // In Idle bleiben Lichter statisch (Performance-Save)

# &nbsp;   if (cinematicMode === 'idle') {

# &nbsp;     prevCamPos.copy(camera.position);

# &nbsp;     return;

# &nbsp;   }

# 

# &nbsp;   const safeDelta = Math.min(delta, 0.1);

# &nbsp;   const dist = camera.position.distanceTo(prevCamPos);

# &nbsp;   const currentSpeed = safeDelta > 0 ? dist / safeDelta : 0;

# &nbsp;   prevCamPos.copy(camera.position);

# 

# &nbsp;   // Exponential Decay (tau = 0.3s)

# &nbsp;   const decay = 1.0 - Math.exp(-safeDelta / 0.3);

# &nbsp;   stateRef.current.speed += (currentSpeed - stateRef.current.speed) \* decay;

# 

# &nbsp;   // Intensity Varianz: Schnelle Bewegung -> gedimmt, Still -> starke Kraft

# &nbsp;   const speedFactor = Math.min(stateRef.current.speed \* 0.2, 0.4);

# &nbsp;   const targetIntensity = 1.3 - speedFactor;

# &nbsp;   stateRef.current.intensity += (targetIntensity - stateRef.current.intensity) \* decay;

# 

# &nbsp;   if (keyLightRef.current) {

# &nbsp;     keyLightRef.current.intensity = stateRef.current.intensity;

# &nbsp;     

# &nbsp;     // Folgt der Kamera mit Offset (30° links oben)

# &nbsp;     keyPos.copy(camera.position);

# &nbsp;     keyPos.applyAxisAngle(upAxis, Math.PI / 6); 

# &nbsp;     keyPos.y += 2.0;

# &nbsp;     keyPos.normalize().multiplyScalar(6);

# &nbsp;     

# &nbsp;     keyLightRef.current.position.lerp(keyPos, 1.0 - Math.exp(-safeDelta \* 5));

# &nbsp;   }

# 

# &nbsp;   if (rimLightRef.current \&\& keyLightRef.current) {

# &nbsp;     // Exakt gegenüber dem Key Light für starken Silhouetten-Effekt

# &nbsp;     rimPos.copy(keyLightRef.current.position).negate();

# &nbsp;     rimPos.y = Math.abs(rimPos.y);

# &nbsp;     

# &nbsp;     rimLightRef.current.position.copy(rimPos);

# 

# &nbsp;     // Apple-Style Rim: Berechne Winkel zum Modell und booste Intensität

# &nbsp;     camDir.copy(camera.position).normalize();

# &nbsp;     rimDir.copy(rimPos).normalize();

# &nbsp;     const dot = camDir.dot(rimDir);

# &nbsp;     

# &nbsp;     const rimTargetIntensity = 0.4 + ((1 - dot) / 2) \* 0.3; // 0.4 bis 0.7

# &nbsp;     rimLightRef.current.intensity += (rimTargetIntensity - rimLightRef.current.intensity) \* decay;

# &nbsp;   }

# &nbsp; });

# 

# &nbsp; return (

# &nbsp;   <group>

# &nbsp;     {/\* 1. Fill Light (konstant) \*/}

# &nbsp;     <hemisphereLight args={\['#ffffff', '#334155', 0.3]} />

# &nbsp;     

# &nbsp;     {/\* 2. Key Light \*/}

# &nbsp;     <directionalLight

# &nbsp;       ref={keyLightRef}

# &nbsp;       castShadow

# &nbsp;       shadow-mapSize={\[2048, 2048]}

# &nbsp;       intensity={1.3}

# &nbsp;       position={\[3, 4, 3]}

# &nbsp;     />

# &nbsp;     

# &nbsp;     {/\* 3. Rim Light \*/}

# &nbsp;     <pointLight

# &nbsp;       ref={rimLightRef}

# &nbsp;       color="#fff5e6"

# &nbsp;       intensity={0.4}

# &nbsp;       position={\[-3, 2, -3]}

# &nbsp;     />

# &nbsp;     

# &nbsp;     {/\* 4. Accent Light (nur in Showcase aktiv) \*/}

# &nbsp;     {cinematicMode === 'showcase' \&\& (

# &nbsp;       <spotLight

# &nbsp;         position={\[0, 8, 0]}

# &nbsp;         angle={Math.PI / 6}

# &nbsp;         penumbra={0.8}

# &nbsp;         intensity={1.0}

# &nbsp;         castShadow

# &nbsp;       />

# &nbsp;     )}

# &nbsp;   </group>

# &nbsp; );

# }

# 

# ```

# 

# \### 4. `src/components/3d/PostProcessing.tsx` (NEU)

# 

# Ein High-Performance Screen-Space Shader Render-Trick direkt im NDC-Raum (-1 bis 1) ohne Abhängigkeit auf dicke Postprocessing Bibliotheken.

# 

# ```tsx

# 'use client';

# 

# import { useMemo } from 'react';

# import { useFrame, useThree } from '@react-three/fiber';

# import type { CinematicMode } from '@/store/cinematicStore';

# 

# interface PostProcessingProps {

# &nbsp; cinematicMode: CinematicMode;

# }

# 

# export function PostProcessing({ cinematicMode }: PostProcessingProps) {

# &nbsp; const { gl } = useThree();

# 

# &nbsp; useFrame((\_, delta) => {

# &nbsp;   // Subtiler "Fake-Bloom": Animieren der Exposure im Render-Loop

# &nbsp;   const safeDelta = Math.min(delta, 0.1);

# &nbsp;   const targetExposure = cinematicMode === 'showcase' ? 1.3 : 1.15;

# &nbsp;   const decay = 1.0 - Math.exp(-safeDelta \* 2.0);

# &nbsp;   gl.toneMappingExposure += (targetExposure - gl.toneMappingExposure) \* decay;

# &nbsp; });

# 

# &nbsp; const shaderArgs = useMemo(() => ({

# &nbsp;   vertexShader: `

# &nbsp;     varying vec2 vUv;

# &nbsp;     void main() {

# &nbsp;       vUv = uv;

# &nbsp;       // Rendert 1:1 direkt auf den Bildschirm ohne Kamera-Distanz-Skalierung

# &nbsp;       gl\_Position = vec4(position.xy, 0.0, 1.0);

# &nbsp;     }

# &nbsp;   `,

# &nbsp;   fragmentShader: `

# &nbsp;     varying vec2 vUv;

# &nbsp;     void main() {

# &nbsp;       float vignette = smoothstep(0.8, 0.2, length(vUv - 0.5));

# &nbsp;       // Schwarz + Alpha-Fade für natürliche Randabdunklung

# &nbsp;       gl\_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - vignette);

# &nbsp;     }

# &nbsp;   `

# &nbsp; }), \[]);

# 

# &nbsp; return (

# &nbsp;   <mesh renderOrder={999} frustumCulled={false}>

# &nbsp;     <planeGeometry args={\[2, 2]} />

# &nbsp;     <shaderMaterial

# &nbsp;       transparent

# &nbsp;       depthTest={false}

# &nbsp;       depthWrite={false}

# &nbsp;       vertexShader={shaderArgs.vertexShader}

# &nbsp;       fragmentShader={shaderArgs.fragmentShader}

# &nbsp;     />

# &nbsp;   </mesh>

# &nbsp; );

# }

# 

# ```

# 

# \### 5. `src/components/3d/EmbedViewer.tsx` (MODIFIKATION)

# 

# Nutze diesen Diff-Block, um die bestehende Entry-Datei um die Glassmorphism-Buttons und Module zu erweitern.

# 

# ```diff

# --- src/components/3d/EmbedViewer.tsx

# +++ src/components/3d/EmbedViewer.tsx

# @@ -1,13 +1,50 @@

# &nbsp;'use client';

# &nbsp;

# +import { RotateCw, Film } from 'lucide-react';

# +import { useCinematicStore } from '@/store/cinematicStore';

# +import { CinematicController } from './CinematicController';

# +import { DynamicLightRig } from './DynamicLightRig';

# +import { PostProcessing } from './PostProcessing';

# &nbsp;import { ViewerCanvas } from './ViewerCanvas';

# &nbsp;import { ModelViewer } from './ModelViewer';

# +import type { Exhibition } from '@/types/schema';

# &nbsp;

# -export function EmbedViewer({ exhibition }: { exhibition: any }) {

# +export function EmbedViewer({ exhibition }: { exhibition: Exhibition }) {

# \+  const cinematicMode = useCinematicStore((state) => state.mode);

# \+  const setMode = useCinematicStore((state) => state.setMode);

# \+

# &nbsp;  return (

# \-    <div className="w-full h-full relative">

# \+    <div className="w-full h-full relative group">

# &nbsp;      <ViewerCanvas>

# \+        <CinematicController cinematicMode={cinematicMode} />

# \+        <DynamicLightRig cinematicMode={cinematicMode} />

# \+        <PostProcessing cinematicMode={cinematicMode} />

# \+        

# &nbsp;        <ModelViewer url={exhibition.modelUrl} />

# &nbsp;      </ViewerCanvas>

# \+      

# \+      {/\* Cinematic Controls Toggle \*/}

# \+      <div className="absolute bottom-6 right-6 flex gap-3 z-10 pointer-events-auto">

# \+        <button

# \+          onClick={() => setMode('orbit')}

# \+          className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 border ${

# \+            cinematicMode === 'orbit' 

# \+              ? 'bg-blue-500/10 border-\[#00aaff] text-\[#00aaff] shadow-\[0\_0\_15px\_rgba(0,170,255,0.4)]' 

# \+              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'

# \+          }`}

# \+        >

# \+          <RotateCw className="w-4 h-4" />

# \+          <span className="text-sm font-medium">Auto</span>

# \+        </button>

# \+        <button

# \+          onClick={() => setMode('showcase')}

# \+          className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 border ${

# \+            cinematicMode === 'showcase' 

# \+              ? 'bg-blue-500/10 border-\[#00aaff] text-\[#00aaff] shadow-\[0\_0\_15px\_rgba(0,170,255,0.4)]' 

# \+              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'

# \+          }`}

# \+        >

# \+          <Film className="w-4 h-4" />

# \+          <span className="text-sm font-medium">Showcase</span>

# \+        </button>

# \+      </div>

# &nbsp;    </div>

# &nbsp;  );

# &nbsp;}

# 

# ```

