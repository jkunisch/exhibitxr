import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

/**
 * Converts a GLB Buffer to a USDZ Buffer using Three.js.
 * This runs in a Node.js server environment (Server Action).
 */
export async function convertGlbToUsdz(glbBuffer: Buffer): Promise<Buffer> {
  // 1. Create a scene
  const scene = new THREE.Scene();
  
  // Add lighting (crucial for Quick Look visibility)
  const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
  scene.add(ambientLight);

  // 2. Load GLB from buffer
  const loader = new GLTFLoader();

  const arrayBuffer: ArrayBuffer = glbBuffer.buffer.slice(
    glbBuffer.byteOffset,
    glbBuffer.byteOffset + glbBuffer.byteLength
  ) as ArrayBuffer;

  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject);
  });

  scene.add(gltf.scene);

  // 3. Export to USDZ using parseAsync (Three.js async API)
  const exporter = new USDZExporter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usdzResult = await (exporter as any).parseAsync(scene, {});

  return Buffer.from(usdzResult as ArrayBuffer);
}
