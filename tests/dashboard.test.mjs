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
