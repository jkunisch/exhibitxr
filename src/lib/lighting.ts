export const AMBIENT_INTENSITY_MIN = 0;
export const AMBIENT_INTENSITY_MAX = 2;
export const AMBIENT_INTENSITY_STEP = 0.1;
export const DEFAULT_AMBIENT_INTENSITY = 0.45;

/**
 * Clamp ambient intensity to editor-supported bounds.
 * Falls back to the default value for invalid inputs.
 */
export function sanitizeAmbientIntensity(value: unknown): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return DEFAULT_AMBIENT_INTENSITY;
    }

    return Math.min(
        AMBIENT_INTENSITY_MAX,
        Math.max(AMBIENT_INTENSITY_MIN, value)
    );
}
