import { SettingDef } from "@/types/settings";
import { asNumber } from "./parse";

export function toggleMaskBit(raw: string, bit: number, on: boolean): string {
  const n = asNumber(raw) ?? 0;
  const v = on ? n | (1 << bit) : n & ~(1 << bit);
  return String(v >>> 0);
}

export function validateValue(def: SettingDef, raw: string): string | null {
  if (def.type === "string") return null;
  const n = asNumber(raw);
  if (n === null) return "Must be a number";
  if (def.type === "int" || def.type === "bool" || def.type === "mask" || def.type === "enum") {
    if (!Number.isInteger(n)) return "Must be an integer";
  }
  if (def.range && (n < def.range.min || n > def.range.max)) {
    return `Must be between ${def.range.min} and ${def.range.max}`;
  }
  return null;
}

export function serializeConfig(entries: { id: number; raw: string }[]): string {
  return [...entries]
    .sort((a, b) => a.id - b.id)
    .map((e) => `$${e.id}=${e.raw}\n`)
    .join("");
}
