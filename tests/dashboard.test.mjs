import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Script } from "node:vm";

const dashboard = readFileSync(new URL("../dashboard.html", import.meta.url), "utf8");
const embedded = dashboard.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test("Dashboard: eingebettetes JavaScript ist syntaktisch gültig", () => {
  assert.ok(embedded, "Eingebettetes Script fehlt");
  assert.doesNotThrow(() => new Script(embedded));
});

test("Kalenderdatum bleibt an die lokale Zeitzone gebunden", () => {
  assert.ok(embedded);
  const formatter = embedded.match(/^const fmt=.*;$/m)?.[0];
  const today = embedded.match(/^const todayISO=.*;$/m)?.[0];
  assert.ok(formatter, "Einheitlicher Datumsformatierer fehlt");
  assert.ok(today, "Heutiges Datum fehlt");

  const scenarios = [
    { timezone: "Pacific/Honolulu", instant: "2026-01-01T01:00:00Z", expected: "2025-12-31" },
    { timezone: "Europe/Berlin", instant: "2026-12-31T23:30:00Z", expected: "2027-01-01" },
    { timezone: "UTC", instant: "2026-06-15T12:00:00Z", expected: "2026-06-15" },
  ];

  for (const { timezone, instant, expected } of scenarios) {
    const source = `
const NativeDate = Date;
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [${JSON.stringify(instant)}])); }
};
${formatter}
${today}
process.stdout.write(JSON.stringify({
  formatted: fmt(new Date(${JSON.stringify(instant)})),
  today: todayISO(),
}));
`;
    const output = execFileSync(process.execPath, ["-e", source], {
      encoding: "utf8",
      env: { ...process.env, TZ: timezone },
    });
    const actual = JSON.parse(output);
    assert.deepEqual(actual, { formatted: expected, today: expected }, timezone);
  }
});


test("Beschädigter JSON-Import lässt Notizen und Songeditor unverändert", async () => {
  const start = embedded.indexOf("async function importText(txt){");
  const end = embedded.indexOf("\nfunction bind(){", start);
  assert.ok(start >= 0 && end > start, "Importfunktion fehlt");
  const source = embedded.slice(start, end);
  const createImport = new Function(
    "state", "uid", "COLORS", "todayISO", "confirm", "fill", "selected", "save", "render", "$", "toast", "sendModuleConfig",
    source + "\nreturn importText;"
  );
  const state = { notes: [{ id: "keep", text: "Wichtig" }], proSong: { title: "Alter Song" }, selectedId: "keep" };
  const original = JSON.stringify(state);
  const output = [];
  const doImport = createImport(state, () => "id", ["#000"], () => "2026-10-23", () => true,
    () => {}, () => state.notes[0], () => true, () => {},
    () => ({ classList: { remove() {} } }), msg => output.push(msg), () => {});
  await doImport(JSON.stringify({ notes: [{ id: "eins" }, null], proSong: { title: "Unerwünscht" } }));
  assert.equal(JSON.stringify(state), original, "Fehlerhafter Import darf Daten nicht verändern");
  assert.match(output.at(-1), /Importfehler/);
  await doImport(JSON.stringify({ notes: [{ id: "neu", title: "Gültig" }], proSong: { title: "Neu" } }));
  assert.equal(state.notes[0].id, "neu");
  assert.equal(state.proSong.title, "Neu");
});

test("Import weist beschädigte Notizfelder ohne Zustandsänderung zurück", async () => {
  const start = embedded.indexOf("async function importText(txt){");
  const end = embedded.indexOf("\nfunction bind(){", start);
  assert.ok(start >= 0 && end > start);
  const createImport = new Function(
    "state", "uid", "COLORS", "todayISO", "confirm", "fill", "selected", "save", "render", "$", "toast", "sendModuleConfig",
    embedded.slice(start, end) + "\nreturn importText;"
  );
  for (const broken of [
    { notes: [{ id: "neu", tags: [null] }] },
    { notes: [{ id: "neu", text: ["kein Text"] }] },
    { notes: [{ id: "neu", pinned: "ja" }] },
    { notes: [{ id: "neu", tags: "keine Liste" }] },
    { notes: [{ id: "neu", title: "Okay" }], proSong: { title: ["ungültig"] } },
    { notes: [{ id: "neu", title: "Okay" }], proSong: { templates: [null] } },
  ]) {
    const state = { notes: [{ id: "keep", text: "Wichtig" }], proSong: { title: "Alter Song" }, selectedId: "keep" };
    const original = JSON.stringify(state);
    const messages = [];
    let saves = 0;
    const importText = createImport(state, () => "id", ["#000"], () => "2026-10-23", () => true,
      () => {}, () => state.notes[0], () => { saves++; return true; }, () => {},
      () => ({ classList: { remove() {} } }), msg => messages.push(msg), () => {});
    await importText(JSON.stringify(broken));
    assert.equal(JSON.stringify(state), original, JSON.stringify(broken));
    assert.equal(saves, 0, "Ungültige Daten dürfen nicht gespeichert werden");
    assert.match(messages.at(-1), /Importfehler/);
  }
});

test("Import akzeptiert gültige Notizen mit Tags und Songvorlagen", async () => {
  const start = embedded.indexOf("async function importText(txt){");
  const end = embedded.indexOf("\nfunction bind(){", start);
  const createImport = new Function(
    "state", "uid", "COLORS", "todayISO", "confirm", "fill", "selected", "save", "render", "$", "toast", "sendModuleConfig",
    embedded.slice(start, end) + "\nreturn importText;"
  );
  const state = { notes: [{ id: "keep" }], proSong: { title: "Alt" }, selectedId: "keep" };
  let saves = 0;
  const importText = createImport(state, () => "id", ["#000"], () => "2026-10-23", () => true,
    () => {}, () => state.notes[0], () => { saves++; return true; }, () => {},
    () => ({ classList: { remove() {} } }), () => {}, () => {});
  await importText(JSON.stringify({
    notes: [{ id: "neu", title: "Titel", text: "Text", tags: ["Song", "Idee"], pinned: true, done: false }],
    proSong: { title: "Song", templates: ["Intro", "Outro"] }
  }));
  assert.equal(saves, 1);
  assert.deepEqual(state.notes[0].tags, ["Song", "Idee"]);
  assert.equal(state.proSong.title, "Song");
});

test("Import rollt bei vollem Browserspeicher zurück und meldet den Fehler", async () => {
  const start = embedded.indexOf("async function importText(txt){");
  const end = embedded.indexOf("\nfunction bind(){", start);
  const saveStart = embedded.indexOf("function save(silent=true,syncModules=true){");
  const saveEnd = embedded.indexOf("\nlet tmr;", saveStart);
  assert.ok(start >= 0 && end > start && saveStart >= 0 && saveEnd > saveStart);
  const createImport = new Function(
    "state", "uid", "COLORS", "todayISO", "confirm", "fill", "selected", "save", "render", "$", "toast", "sendModuleConfig",
    embedded.slice(start, end) + "\nreturn importText;"
  );
  const createSave = new Function(
    "state", "localStorage", "STORAGE_KEY", "syncSong", "setStatus", "$", "toast",
    embedded.slice(saveStart, saveEnd) + "\nreturn save;"
  );
  const state = { notes: [{ id: "keep", text: "Nicht verlieren" }], proSong: { title: "Vorher" }, selectedId: "keep" };
  const original = JSON.stringify(state);
  const messages = [];
  let fills = 0, renders = 0, moduleMessages = 0, modalCloses = 0, status = "";
  const save = createSave(state, { setItem() { throw new DOMException("Speicher voll", "QuotaExceededError"); } },
    "test-storage", () => { moduleMessages++; }, msg => { status = msg; },
    () => ({ textContent: "" }), msg => messages.push(msg));
  const importText = createImport(state, () => "neu", ["#000"], () => "2026-10-24", () => true,
    () => { fills++; }, () => state.notes.find(n => n.id === state.selectedId),
    save, () => { renders++; },
    () => ({ classList: { remove() { modalCloses++; } } }),
    msg => messages.push(msg), () => { moduleMessages++; });
  await importText(JSON.stringify({ notes: [{ id: "neu", title: "Import" }], proSong: { title: "Importiert" } }));
  assert.equal(JSON.stringify(state), original, "Notizen, Songeditor und Auswahl müssen erhalten bleiben");
  assert.equal(fills, 0, "Editor darf bei Fehlschlag nicht überschrieben werden");
  assert.equal(renders, 0);
  assert.equal(moduleMessages, 0, "Modul darf vor erfolgreichem Speichern keine Importdaten erhalten");
  assert.equal(modalCloses, 0, "Importdialog muss für erneuten Versuch geöffnet bleiben");
  assert.match(status, /Speichern blockiert/);
  assert.match(messages.at(-1), /Import abgebrochen.*Speichern blockiert/);
});
