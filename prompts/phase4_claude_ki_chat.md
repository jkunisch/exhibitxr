# Phase 4D – Claude Opus (Antigravity)
# KI Text-Chat Widget (OpenAI Streaming)

Lies zuerst:
- `.antigravity/rules`
- `src/types/schema.ts`
- `src/store/editorStore.ts` (um Exhibit-Context zu verstehen)
- `src/components/3d/EmbedViewer.tsx`
- `src/app/embed/[id]/page.tsx`

Strikte Regeln:
- Server Actions fuer API-Calls (kein API Route)
- OpenAI Streaming via ReadableStream
- KEIN Voice, KEIN Avatar – nur Text-Chat
- TypeScript strict, kein `any`

Checkliste:

- [ ] Chat Server Action erstellen (`src/app/actions/chat.ts`):
  - Server Action: `streamChatResponse(userMessage: string, context: string)`
  - Nutzt OpenAI Chat Completions API (`gpt-4o-mini` fuer Kosten)
  - System-Prompt:
    ```
    Du bist ein freundlicher Produktberater fuer eine 3D-Ausstellung.
    Hier sind die Produktinformationen:
    {context}
    Beantworte Fragen kurz und praezise. Maximal 3 Saetze.
    Wenn du etwas nicht weisst, sag es ehrlich.
    ```
  - `context` = JSON.stringify der ExhibitConfig (Titel, Hotspot-Descriptions, Varianten)
  - Streaming-Response zurueckgeben

- [ ] Chat Widget erstellen (`src/components/ui/ChatWidget.tsx`):
  - `'use client'` Komponente
  - Floating Button unten rechts (Chat-Bubble Icon, Lucide `MessageCircle`)
  - Klick → Panel oeffnet sich (300px breit, 400px hoch)
  - Eingabefeld + Senden-Button
  - Nachrichtenverlauf (User-Bubbles rechts, Bot-Bubbles links)
  - Streaming: Bot-Antwort wird zeichenweise angezeigt
  - Glassmorphism-Stil (bg-black/60, backdrop-blur-xl, border-white/10)
  - Max 20 Nachrichten im Verlauf halten (aelteste loeschen)
  - Schliessen-Button (X)

- [ ] Chat in EmbedViewer integrieren:
  - `EmbedViewer.tsx` bekommt optionales `enableChat` Prop
  - Wenn true: `<ChatWidget context={JSON.stringify(config)} />`
  - Chat schwebt ueber dem 3D-Canvas

- [ ] Rate-Limiting (einfach):
  - Max 10 Nachrichten pro Session (zaehle im State)
  - Danach: "Chat-Limit erreicht. Kontaktieren Sie uns direkt."

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`
  - Manuell: Chat oeffnen, Frage stellen, Streaming-Antwort pruefen

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken (z.B. API-Key Exposure, Kosten)
