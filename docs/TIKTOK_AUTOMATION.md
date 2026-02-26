# 🎬 3D-Snap TikTok & Social Media Automation

Diese Pipeline ermöglicht es, aus jedem 3D-Modell (.glb) vollautomatisch hochkant-Videos (9:16) für TikTok, Instagram Reels oder YouTube Shorts zu generieren.

## 🛠 Funktionsweise
1. **Recording-Page:** Die Route `/record-tiktok?modelUrl=...` lädt den 3D-Viewer im Fullscreen-Modus (1080x1920) und startet automatisch eine 360°-Rotation.
2. **Playwright Automation:** Ein Headless-Browser öffnet diese Seite live auf `3d-snap.com`, wartet auf das Laden des Modells und nimmt 10 Sekunden Videomaterial auf.
3. **AI Creative Brief:** Die Pipeline nutzt Groq (LLM), um passend zum Produkt-Titel Captions, Vibes und Musik-Vorschläge zu generieren.

## 🚀 Nutzung

### 1. Einzelnes Video generieren
Um für ein spezifisches Modell ein Video zu erstellen, nutze diesen Befehl:
```bash
npx tsx scripts/generate-tiktok-video.ts "DEINE_GLB_URL"
```
*Das Video landet als `.webm` im Ordner `output/tiktok/`.*

### 2. Batch-Pipeline (UGC-Modus)
Um automatisch die neuesten 5 veröffentlichten Modelle aus der Datenbank zu verarbeiten und passende Marketing-Texte zu generieren:
```bash
npx tsx scripts/tiktok-pipeline.ts
```

## 📂 Output Struktur
- `output/tiktok/*.webm`: Das fertige Video.
- `output/tiktok/*.json`: Die von der KI generierten Captions und Metadaten (nur bei der Pipeline).

## 💡 Tipps für Agenten
- **Hintergrund:** Der Viewer nutzt aktuell den edlen "Dark Mode" Hintergrund. Für farbige Hintergründe kann der Parameter `bgColor` in der `record-tiktok` Page erweitert werden.
- **Konvertierung:** Falls `.mp4` benötigt wird, kann `ffmpeg` genutzt werden:
  `ffmpeg -i input.webm -c:v libx264 -crf 23 -profile:v high -level:v 4.1 output.mp4`

---
*Status: Live & Operativ unter https://www.3d-snap.com*
