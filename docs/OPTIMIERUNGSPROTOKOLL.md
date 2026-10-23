# Optimierungsprotokoll – TOOL2026

## 2026-10-23: Import beschädigter Notizdateien absichern

- **Basis-HEAD:** `30ff3d3c77799c2b0986628336b040263dfba87c`.
- **Ausgangsbefund (reproduziert):** Ein JSON-Import mit gültigem `proSong` und beschädigter `notes`-Liste veränderte Songeditor und leerte vorhandene Notizen bereits vor dem Scheitern der Notizabbildung.
- **Änderung:** Form und Einträge der Notizliste sowie `proSong` vorab validieren; Notizen vollständig in einem neuen Array vorbereiten; erst danach das Ersetzen/Hinzufügen bestätigen und Zustand ändern.
- **Nutzermehrwert:** Fehlerhaftes Import-JSON darf beim Vorprüfen weder Notizen noch Songeditor-Inhalte verändern.
- **Gezielter Quelltest:** Originalfunktion verändert bei beschädigter Eingabe den Zustand (**Fehler reproduziert**). Die korrigierte Funktion erhält den Zustand und akzeptiert einen gültigen Testimport (**PASS**). Automatisierter Regressionstest in `tests/dashboard.test.mjs` ergänzt.
- **Noch offen:** GitHub-CI des neuen Commits und Browserprüfung. Ohne diese keine Übernahme nach `main`.
- **Risiko:** Gering; ungültige Imports werden nun abgewiesen. Kein neues Speicherformat und keine Migration.
- **Branch:** `sync/20261023-atomic-notes-import`; Commit/PR über GitHub abrufbar.
