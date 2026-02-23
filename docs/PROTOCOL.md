# ExhibitXR - Agent-Protokoll

## Goldene Regeln fuer alle Agents
1. Lies `src/types/schema.ts` bevor du Code schreibst
2. Aendere `src/types/schema.ts` niemals ohne explizite Erlaubnis
3. TypeScript strict - kein `any`
4. Nutze nur Packages aus `package.json`
5. R3F: `@react-three/drei` statt roher Three.js-Mathe
6. R3F: In `useFrame` nur `getState()` (Transient Updates)
7. R3F: `useFrame` immer mit `delta`
8. Firebase: Alle Reads/Writes tenant-scoped
9. Aufgaben immer als Checkbox-Liste abarbeiten (`- [ ]` / `- [x]`)
10. Keine halbfertigen Uebergaben: Fehler eigenstaendig fixen
11. Kein Handholding: klarer, direkter und zielfuehrender Arbeitsstil
12. Bei Blockade nichts kaputt machen; stattdessen stoppen und eigenes Scheitern klar benennen

## 3-Strike-Protokoll
### Strike 1
- Exakte Error-Message kopieren
- Prompt: "Fixe nur dieses Problem. Aendere nichts anderes. Zeige Diff."
- Zeitlimit: 10 Minuten

### Strike 2
- Agent wechseln
- Prompt mit Datei, Fehler und betroffenem Code
- Funktion komplett neu schreiben
- Zeitlimit: 15 Minuten

### Strike 3
- Stop coding, Denkmodell-Review
- Architektur/Ansatz pruefen
- Danach vereinfachen oder Block selbst schreiben

### Strike 4
- Gibt es nicht. Feature verschieben.

## Debug-Log
| Datum | Modul | Agent | Strike | Problem | Loesung |
|-------|-------|-------|--------|---------|---------|
| | | | | | |
