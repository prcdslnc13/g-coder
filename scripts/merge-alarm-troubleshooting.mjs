// One-time merge of alarm troubleshooting data (causes/fixes) from the vendored
// cnc_firmware_tools alarm catalog into the firmware data JSON files.
// Run: node scripts/merge-alarm-troubleshooting.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { ALARMS } from "./vendor/cnc-alarm-codes.js";

const GRBL_SOURCES = [
  "https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv",
  "https://github.com/gnea/grbl/wiki/Grbl-v1.1-Interface",
];
const GRBLHAL_SOURCES = ["https://github.com/grblHAL/core/blob/master/alarms.h"];
// wiki.fluidnc.com/en/support/commands_and_settings 404s; the wiki has a dedicated
// alarm/error codes page, so cite that instead (verified 200 on 2026-07-30).
const FLUIDNC_SOURCES = ["http://wiki.fluidnc.com/en/support/alarm_and_error_codes"];
// Verified live 2026-07-30 (LightBurn docs GRBL error/alarm troubleshooting page).
const LIGHTBURN_URL = "https://docs.lightburnsoftware.com/latest/Troubleshooting/GRBLErrors/";
const TOOL_CREDIT = "https://github.com/adammhaile/cnc_firmware_tools";

function load(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}
function save(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
function troubleshootingFor(alarm) {
  if (!alarm.causes && !alarm.fixes) return undefined;
  return { causes: alarm.causes ?? [], fixes: alarm.fixes ?? [] };
}
function mergeSources(entry, urls) {
  for (const u of [...urls, ...(LIGHTBURN_URL ? [LIGHTBURN_URL] : []), TOOL_CREDIT]) {
    if (!entry.sources.includes(u)) entry.sources.push(u);
  }
}
function newAlarmEntry(n, alarm, sources) {
  const e = {
    code: `ALARM:${n}`,
    type: "ALARM",
    name: `Alarm ${n}: ${alarm.title}`,
    description: alarm.description,
    parameters: [],
    examples: [],
    relatedCodes: [],
    crossReferences: [],
    modeNotes: [],
    sources: [],
  };
  const t = troubleshootingFor(alarm);
  if (t) e.troubleshooting = t;
  mergeSources(e, sources);
  return e;
}

// --- grbl: attach troubleshooting to existing ALARM:1..10 entries ---
const grbl = load("data/grbl.json");
let grblUpdated = 0;
for (const entry of grbl.codes) {
  const m = entry.code.match(/^ALARM:(\d+)$/);
  if (!m) continue;
  const alarm = ALARMS[Number(m[1])];
  if (!alarm || !alarm.flavors.includes("grbl11")) continue;
  const t = troubleshootingFor(alarm);
  if (t) {
    entry.troubleshooting = t;
    mergeSources(entry, GRBL_SOURCES);
    grblUpdated++;
  }
}
save("data/grbl.json", grbl);

// --- grblHAL: create ALARM:1..17 entries (it currently has none) ---
const grblhal = load("data/grblhal.json");
let halAdded = 0;
for (const [nStr, alarm] of Object.entries(ALARMS)) {
  const n = Number(nStr);
  if (!alarm.flavors.includes("grblhal")) continue;
  if (grblhal.codes.some((c) => c.code === `ALARM:${n}`)) continue;
  grblhal.codes.push(newAlarmEntry(n, alarm, GRBLHAL_SOURCES));
  halAdded++;
}
save("data/grblhal.json", grblhal);

// --- FluidNC: create entries for the shared numeric codes ---
const fluidnc = load("data/fluidnc.json");
let fncAdded = 0;
for (const [nStr, alarm] of Object.entries(ALARMS)) {
  const n = Number(nStr);
  if (!alarm.flavors.includes("fluidnc")) continue;
  if (fluidnc.codes.some((c) => c.code === `ALARM:${n}`)) continue;
  fluidnc.codes.push(newAlarmEntry(n, alarm, FLUIDNC_SOURCES));
  fncAdded++;
}
save("data/fluidnc.json", fluidnc);

console.log(`grbl: ${grblUpdated} alarms updated; grblHAL: ${halAdded} added; FluidNC: ${fncAdded} added`);
