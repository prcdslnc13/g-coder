import { SettingDef } from "@/types/settings";
import { asNumber } from "./parse";

export type DecodedValue =
  | { kind: "bool"; on: boolean; display: string }
  | { kind: "mask"; bits: { bit: number; label: string; set: boolean }[]; unknownBits: number; display: string }
  | { kind: "enum"; label: string | null; display: string }
  | { kind: "number"; value: number; outOfRange: boolean; display: string }
  | { kind: "string"; display: string }
  | { kind: "raw"; display: string };

export function decodeValue(def: SettingDef, raw: string): DecodedValue {
  if (def.type === "string") return { kind: "string", display: raw };

  const n = asNumber(raw);
  if (n === null) return { kind: "raw", display: raw };

  switch (def.type) {
    case "bool":
      return { kind: "bool", on: n !== 0, display: n !== 0 ? "On" : "Off" };

    case "mask": {
      const bits = Object.entries(def.values ?? {}).map(([bit, label]) => ({
        bit: Number(bit),
        label,
        set: (n & (1 << Number(bit))) !== 0,
      }));
      const knownMask = bits.reduce((m, b) => m | (1 << b.bit), 0);
      const unknownBits = (n & ~knownMask) >>> 0;
      const setLabels = bits.filter((b) => b.set).map((b) => b.label);
      const display = setLabels.length > 0 ? setLabels.join(", ") : "None";
      return { kind: "mask", bits, unknownBits, display };
    }

    case "enum": {
      const label = def.values?.[n] ?? null;
      return { kind: "enum", label, display: label ?? `Unknown value (${raw})` };
    }

    case "int":
    case "float": {
      const outOfRange =
        def.range !== undefined && (n < def.range.min || n > def.range.max);
      const display = def.units ? `${raw} ${def.units}` : raw;
      return { kind: "number", value: n, outOfRange, display };
    }
  }
}
