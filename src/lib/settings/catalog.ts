import { SettingDef, SettingFlavor } from "@/types/settings";
import {
  lookupSetting as vendorLookup,
  knownIds as vendorKnownIds,
  VendorSettingEntry,
} from "./vendor/settings";
import { EXTENDED_GRBLHAL } from "./extended-grblhal";

const TO_VENDOR: Record<SettingFlavor, string> = {
  grbl: "grbl11",
  grblhal: "grblhal",
  fluidnc: "fluidnc",
};

const FROM_VENDOR: Record<string, SettingFlavor> = {
  grbl11: "grbl",
  grblhal: "grblhal",
  fluidnc: "fluidnc",
};

// Official documentation per flavor (project sourcing rule).
const FLAVOR_SOURCES: Record<SettingFlavor, string> = {
  grbl: "https://github.com/gnea/grbl/wiki/Grbl-v1.1-Configuration",
  grblhal: "https://github.com/grblHAL/core/wiki/Additional-or-extended-settings",
  fluidnc: "http://wiki.fluidnc.com/en/features/commands_and_settings",
};

function adapt(e: VendorSettingEntry): SettingDef {
  const flavors = e.flavors.map((f) => FROM_VENDOR[f]);
  return {
    id: e.id,
    flavors,
    name: e.name,
    description: e.description,
    type: e.type,
    units: e.units,
    range: e.range,
    values: e.values,
    axis: e.axis,
    sources: [...new Set(flavors.map((f) => FLAVOR_SOURCES[f]))],
  };
}

export function lookupSettingDef(
  id: number,
  flavor: SettingFlavor
): { def: SettingDef; candidates: SettingDef[] } | null {
  const r = vendorLookup(id, TO_VENDOR[flavor]);
  // The grblHAL overlay wins over the vendored catalog: it covers extended
  // settings the vendor lacks and corrects entries that lag current core.
  if (flavor === "grblhal") {
    const ext = EXTENDED_GRBLHAL.get(id);
    if (ext) {
      const others = r
        ? r.candidates.map(adapt).filter((c) => !c.flavors.includes("grblhal"))
        : [];
      return { def: ext, candidates: [ext, ...others] };
    }
  }
  if (!r) return null;
  return { def: adapt(r.entry), candidates: r.candidates.map(adapt) };
}

export function knownIds(): number[] {
  return [...new Set([...vendorKnownIds(), ...EXTENDED_GRBLHAL.keys()])].sort(
    (a, b) => a - b
  );
}
