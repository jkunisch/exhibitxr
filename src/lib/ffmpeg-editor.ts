/**
 * Post-production overlay burn-in for TikTok safe zones.
 *
 * Design goals:
 * - High readability on mobile: white text + black stroke + semi-transparent box.
 * - Safe zones:
 *   - Avoid edges (centered).
 *   - Avoid bottom 20% where TikTok UI sits -> CTA placed above bottom zone.
 *
 * Technical:
 * - Uses drawtext twice with enable=between(t, start, end).
 * - Outputs H.264 MP4 with faststart for social upload friendliness.
 *
 * NOTE:
 * - fluent-ffmpeg is CommonJS in many setups; this import assumes TS esModuleInterop=true.
 */

import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface BurnInOverlaysOptions {
  readonly inputPath: string;
  readonly outputPath: string;

  /** 0-2s */
  readonly hookText: string;

  /** 6-8s */
  readonly ctaText: string;

  /**
   * Optional custom font file path.
   * If omitted, ffmpeg will try system default fontconfig lookup (works on many Linux images).
   */
  readonly fontFile?: string;

  /** Optional tuning knobs */
  readonly fps?: number; // default 24
  readonly hookStartSec?: number; // default 0
  readonly hookEndSec?: number; // default 2
  readonly ctaStartSec?: number; // default 6
  readonly ctaEndSec?: number; // default 8
}

/**
 * Escape text for ffmpeg drawtext.
 * drawtext parsing is fragile: we must escape characters like ':' '' '%' and quotes.
 */
function escapeForDrawtext(text: string): string {
  // Reference: ffmpeg drawtext escaping rules are context-sensitive.
  // This is a pragmatic escape set that avoids most production failures.
  return text
    .replace(/\\\\/g, "\\\\\\\\")
    .replace(/:/g, "\\\\:")
    .replace(/'/g, "\\\\'")
    .replace(/%/g, "\\\\%")
    .replace(/\\n/g, "\\\\n");
}

function fmtBetween(t0: number, t1: number): string {
  // enable='between(t,0,2)'
  return `between(t\,${t0.toFixed(3)}\,${t1.toFixed(3)})`;
}

export async function burnInTikTokOverlays(opts: BurnInOverlaysOptions): Promise<void> {
  const fps = opts.fps ?? 24;

  const hookStart = opts.hookStartSec ?? 0.0;
  const hookEnd = opts.hookEndSec ?? 2.0;
  const ctaStart = opts.ctaStartSec ?? 6.0;
  const ctaEnd = opts.ctaEndSec ?? 8.0;

  await mkdir(dirname(opts.outputPath), { recursive: true });

  const hook = escapeForDrawtext(opts.hookText);
  const cta = escapeForDrawtext(opts.ctaText);

  // Positions:
  // - Hook: upper-middle ~ 18% height
  // - CTA: above bottom UI ~ 70% height (bottom 20% starts at 80%)
  //
  // Font size: proportional to height (h*0.055). For 1920px => ~105px.
  
  // Use a default Windows font as fallback to avoid "Invalid argument" drawtext errors
  // Notice the escaped colon for the drive letter which is required in FFmpeg filter graphs
  const fallbackFont = process.platform === "win32" ? "C\\\\:/Windows/Fonts/arial.ttf" : undefined;
  const actualFontFile = opts.fontFile || fallbackFont;

  const fontfile = actualFontFile ? `fontfile='${actualFontFile.replace(/'/g, "\\'")}'` : "";

  const hookDraw = [
    `drawtext=text='${hook}'`,
    fontfile,
    "x=(w-text_w)/2",
    "y=(h*0.18)-(text_h/2)",
    "fontsize=h*0.055",
    "fontcolor=white",
    "borderw=3",
    "bordercolor=black",
    "box=1",
    "boxcolor=black@0.55",
    "boxborderw=22",
    `enable='${fmtBetween(hookStart, hookEnd)}'`,
  ].filter(Boolean).join(":");

  const ctaDraw = [
    `drawtext=text='${cta}'`,
    fontfile,
    "x=(w-text_w)/2",
    "y=(h*0.70)-(text_h/2)",
    "fontsize=h*0.055",
    "fontcolor=white",
    "borderw=3",
    "bordercolor=black",
    "box=1",
    "boxcolor=black@0.55",
    "boxborderw=22",
    `enable='${fmtBetween(ctaStart, ctaEnd)}'`,
  ].filter(Boolean).join(":");

  const vf = `${hookDraw},${ctaDraw}`;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(opts.inputPath)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a?", // keep audio if it exists
        `-r ${fps}`,
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-preset veryfast",
        "-crf 18",
        "-movflags +faststart",
        "-c:a copy",
      ])
      .videoFilters(vf)
      .on("start", (cmd) => {
        // eslint-disable-next-line no-console
        console.log(`[ffmpeg] ${cmd}`);
      })
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(opts.outputPath);
  });
}
