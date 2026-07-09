# TOOL2026

Lokales Provoware Kompakt-Dashboard für Notizen, Kalender, Filter und Backups.

## Aktuell

- Responsives Singlefile-Layout: passt Spalten automatisch an und schaltet auf kleinen Bildschirmen in eine einspaltige Ansicht.
- Bereiche lassen sich per Kopfzeile verschieben; per Einstellung können alle Fenster automatisch gleichmäßig angepasst oder manuell unten rechts skaliert werden.
- Barriereärmere Bedienung: sichtbarer Tastaturfokus, Sprunglink zum Editor, ARIA-Dialoge und erweiterte Kurzhilfe.
- Einstellungen im Dashboard: Farbtheme, kompakte Darstellung und sichtbare Listengröße.
- Farbthemes: Dunkel Türkis, Hell Klar, Midnight Blau, Forest Grün, Sunset Modern und Kontrast Stark mit verbesserten Text- und Hilfekontrasten.
- Speicherung bleibt lokal im Browser; Export und Import laufen offline über JSON/TXT.
- Der Profi-Songeditor liegt als eigenes HTML-Modul unter `modules/pro-song.html`, bringt Vorlagen und Auswahlwerte selbst mit und tauscht Daten über die Hauptseite aus.
- Die Hauptseite koordiniert Modulstatus, Theme und lokale Speicherung; das Modul bleibt offline nutzbar.
