import { SettingDef } from "@/types/settings";
import { ParsedSetting, asNumber } from "./parse";

export type DiffStatus = "same" | "changed" | "onlyA" | "onlyB";

export interface DiffRow {
  id: number;
  a: string | null;
  b: string | null;
  status: DiffStatus;
}

function toMap(parsed: ParsedSetting[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const p of parsed) m.set(p.id, p.raw); // last value wins
  return m;
}

function valuesEqual(a: string, b: string): boolean {
  const na = asNumber(a);
  const nb = asNumber(b);
  if (na !== null && nb !== null) return na === nb;
  return a === b;
}

export function diffConfigs(a: ParsedSetting[], b: ParsedSetting[]): DiffRow[] {
  const ma = toMap(a);
  const mb = toMap(b);
  const ids = [...new Set([...ma.keys(), ...mb.keys()])].sort((x, y) => x - y);
  return ids.map((id) => {
    const va = ma.get(id) ?? null;
    const vb = mb.get(id) ?? null;
    let status: DiffStatus;
    if (va === null) status = "onlyB";
    else if (vb === null) status = "onlyA";
    else status = valuesEqual(va, vb) ? "same" : "changed";
    return { id, a: va, b: vb, status };
  });
}

export function maskBitChanges(
  def: SettingDef,
  aRaw: string,
  bRaw: string
): { label: string; from: boolean; to: boolean }[] {
  const na = asNumber(aRaw);
  const nb = asNumber(bRaw);
  if (na === null || nb === null) return [];
  const out: { label: string; from: boolean; to: boolean }[] = [];
  for (const [bitStr, label] of Object.entries(def.values ?? {})) {
    const bit = 1 << Number(bitStr);
    const from = (na & bit) !== 0;
    const to = (nb & bit) !== 0;
    if (from !== to) out.push({ label, from, to });
  }
  return out;
}
