import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const html = readFileSync(new URL("../dashboard.html", import.meta.url), "utf8");
const start = html.indexOf("const localISO=date=>");
const endMarker = "const fmt=localISO;";
const end = html.indexOf(endMarker, start);
assert.ok(start !== -1 && end !== -1, "Gemeinsame Kalender-Datumsfunktion fehlt");
const dateCode = html.slice(start, end + endMarker.length);

test("Kalendertag bleibt bei deutscher Zeitzone auch nach Mitternacht lokal", () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = "Europe/Berlin";
  try {
    const output = vm.runInNewContext(
      `${dateCode}\n[localISO(new Date(2026, 9, 9, 0, 15)), localISO(new Date(2026, 0, 1, 0, 5))]`
    );
    assert.deepEqual(Array.from(output), ["2026-10-09", "2026-01-01"]);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});
