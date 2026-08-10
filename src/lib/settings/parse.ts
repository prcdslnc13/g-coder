import { SettingFlavor } from "@/types/settings";

export interface ParsedSetting {
  id: number;
  raw: string;
  lineNumber: number;
  duplicate: boolean;
}

// Value may be empty: string settings (e.g. $490= macro slots) are emitted
// with no value when unset.
const LINE_RE = /^\s*\$(\d+)\s*=\s*([^\r\n]*?)\s*$/;
const TRAILING_COMMENT_RE = /\s*\([^)]*\)\s*$/;

// Tolerant parser for `$$` output. Anything that isn't `$<number>=<value>`
// (ok lines, status reports, [MSG:...], blanks) is ignored, never an error.
export function parseDollarConfig(text: string): ParsedSetting[] {
  const out: ParsedSetting[] = [];
  const seen = new Set<number>();
  String(text ?? "").split(/\r?\n/).forEach((line, i) => {
    const m = line.match(LINE_RE);
    if (!m) return;
    const id = Number(m[1]);
    const raw = m[2].replace(TRAILING_COMMENT_RE, "").trim();
    out.push({ id, raw, lineNumber: i + 1, duplicate: seen.has(id) });
    seen.add(id);
  });
  return out;
}

export function asNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// Setting ids that only exist in grblHAL (upstream cnc_firmware_tools heuristic).
const HAL_EXCLUSIVE = [
  7, 8, 9, 14, 15, 16, 17, 18, 19, 28, 29, 33, 34, 35, 36, 37, 39, 40, 43, 44,
  45, 46, 47, 48, 62, 63, 64, 65, 70, 73, 74, 75, 76, 77, 78, 341, 342, 343,
  344, 345, 346, 376, 384, 398, 481,
];

export function detectFlavor(parsed: ParsedSetting[]): SettingFlavor {
  const ids = new Set(parsed.map((p) => p.id));
  for (const id of HAL_EXCLUSIVE) if (ids.has(id)) return "grblhal";
  const s22 = parsed.find((p) => p.id === 22);
  if (s22 && (asNumber(s22.raw) ?? 0) > 1) return "grblhal";
  return "grbl";
}
