import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRMeshQuantization, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, weld, simplify, textureCompress, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

export async function optimizeGlb(inputBuffer: Buffer): Promise<Buffer> {
  const originalSizeMB = inputBuffer.length / (1024 * 1024);

  try {
    const io = new NodeIO().registerExtensions([
      KHRDracoMeshCompression,
      KHRMeshQuantization,
      EXTTextureWebP
    ]);

    const document = await io.readBinary(new Uint8Array(inputBuffer));

    await MeshoptSimplifier.ready;

    await document.transform(
      dedup(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.01 }),
      textureCompress({ targetFormat: 'webp' }),
      draco()
    );

    const optimizedArray = await io.writeBinary(document);
    const optimizedBuffer = Buffer.from(optimizedArray.buffer, optimizedArray.byteOffset, optimizedArray.byteLength);

    const optimizedSizeMB = optimizedBuffer.length / (1024 * 1024);
    const reductionPercent = ((originalSizeMB - optimizedSizeMB) / originalSizeMB) * 100;

    console.log(`Originalgröße: ${originalSizeMB.toFixed(2)} MB -> Optimierte Größe: ${optimizedSizeMB.toFixed(2)} MB -> Reduktion: ${reductionPercent.toFixed(2)} %`);

    return optimizedBuffer;
  } catch (error) {
    console.error('Optimization failed:', error);
    return inputBuffer;
  }
}
