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
    "state", "uid", "COLORS", "todayISO", "confirm", "fill", "selected", "save", "render", "$", "toast",
    source + "\nreturn importText;"
  );
  const state = { notes: [{ id: "keep", text: "Wichtig" }], proSong: { title: "Alter Song" }, selectedId: "keep" };
  const original = JSON.stringify(state);
  const output = [];
  const doImport = createImport(state, () => "id", ["#000"], () => "2026-10-23", () => true,
    () => {}, () => state.notes[0], () => {}, () => {},
    () => ({ classList: { remove() {} } }), msg => output.push(msg));
  await doImport(JSON.stringify({ notes: [{ id: "eins" }, null], proSong: { title: "Unerwünscht" } }));
  assert.equal(JSON.stringify(state), original, "Fehlerhafter Import darf Daten nicht verändern");
  assert.match(output.at(-1), /Importfehler/);
  await doImport(JSON.stringify({ notes: [{ id: "neu", title: "Gültig" }], proSong: { title: "Neu" } }));
  assert.equal(state.notes[0].id, "neu");
  assert.equal(state.proSong.title, "Neu");
});
