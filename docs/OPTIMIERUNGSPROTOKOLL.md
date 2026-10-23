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

## 2026-10-23: JSON-Import – Typprüfung vor Zustandsänderung

- **Basis-HEAD:** `30063c11c0e5b955de0adc59e0f3f0ccfff55d8e`; **Entwicklungszweig:** `automation/20261023-tool2026-import-schema`.
- **Befund:** Verschachtelte Importfelder wie `tags: [null]`, `text: []` oder `proSong.title: []` wurden bisher akzeptiert. Das kann die Suche, Wortzählung oder Songeditor-Darstellung nach dem Import beschädigen.
- **Änderung:** Vor dem Import werden bekannte Text-, Listen- und Wahrheitsfelder typgeprüft. Fehlende optionale Felder bleiben für alte Exporte erlaubt. Bei Fehlern werden weder Notizen noch Songdaten verändert.
- **Regression:** Tests für sechs beschädigte Eingaben und einen gültigen Import ergänzt. CI auf dem PR-HEAD ist maßgeblich.
- **Risiko:** Ungültige Altdaten werden abgewiesen statt übernommen; keine Datenmigration.

### Release-Pflichtmatrix (nur belegte Stände)

| Pflichtbereich | Stand | Evidenz / offener Nachweis |
| --- | --- | --- |
| Notizen, Kalender, Suche, Filter | TEILWEISE | Funktionen im `dashboard.html`; umfassende Funktionstests offen |
| Songeditor und Modulverbindung | TEILWEISE | `modules/pro-song.html`; Integration im Browser offen |
| Import / Export und Grenzfälle | TEILWEISE | JSON-Typprüfung und Regression im Entwicklungszweig; weitere Importfälle offen |
| Datensicherheit / Wiederherstellung | OFFEN | Quota-Fehler, beschädigter Browser-Speicher, Backup-Restore |
| Fehlerbehandlung / Sicherheit | TEILWEISE | Typprüfung; PostMessage-Vertrauensgrenzen und XSS-Audit offen |
| Design / Lesbarkeit | OFFEN | Nachweisbare visuelle Prüfung aller Themes |
| 800×600 / hohe Skalierung | OFFEN | Browserprüfung bei 200 % / 400 % und ohne horizontales Scrollen |
| Tastatur / Barrierefreiheit | OFFEN | Fokus, Dialoge, Listenbedienung, Screenreader |
| Performance | OFFEN | Viele Notizen, Filter und Monatswechsel messen |
| Wartbarkeit | TEILWEISE | Bestehende Node-Tests; Entkopplung / gemeinsame Funktionen prüfen |
| Paketierung / Installation | OFFEN | Kubuntu/XFCE Offline-Start und Berechtigungen |
| Automatisierte Funktionstests | TEILWEISE | `tests/dashboard.test.mjs`; Abdeckung ausbauen |
| Integration / GUI / Browser | OFFEN | Echter Browserlauf einschließlich Songeditor |
| Regression | TEILWEISE | Import- und Kalenderprüfungen; weitere Grenzfälle offen |
| CI | TEILWEISE | Workflow für Node 20/22; PR-HEAD-Ergebnis abwarten |
| Dokumentation / Release | OFFEN | Handbuch, vollständige Gates, RC-Freeze, einmalige Endabnahme |

**Nächste unabhängige Pflichtaufgabe:** Browser-Speicherfehler und fehlgeschlagenes Speichern beim Import ohne Datenverlust behandeln; danach Browser-/Skalierungstests.
