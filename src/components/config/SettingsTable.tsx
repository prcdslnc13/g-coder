"use client";

import { SettingFlavor } from "@/types/settings";
import { ParsedSetting } from "@/lib/settings/parse";
import { lookupSettingDef } from "@/lib/settings/catalog";
import { decodeValue } from "@/lib/settings/decode";
import { toggleMaskBit, validateValue } from "@/lib/settings/edit";
import { getFirmwareData } from "@/lib/data";

interface SettingsTableProps {
  parsed: ParsedSetting[];
  flavor: SettingFlavor;
  edits: Map<number, string>;
  onEdit: (id: number, raw: string) => void;
}

export function SettingsTable({ parsed, flavor, edits, onEdit }: SettingsTableProps) {
  const wikiCodes = new Set(getFirmwareData(flavor).codes.map((c) => c.code));
  const rows = [...parsed].sort((a, b) => a.id - b.id);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
          <th className="py-2 pr-3">Setting</th>
          <th className="py-2 pr-3">Name</th>
          <th className="py-2 pr-3">Value</th>
          <th className="py-2">Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const found = lookupSettingDef(p.id, flavor);
          // Same last-imported-raw baseline handleEdit uses, so reset (and the
          // modified check) agree even for duplicate ids across rows.
          const original = parsed.filter((x) => x.id === p.id).at(-1)!.raw;
          const current = edits.get(p.id) ?? original;
          const modified = current !== original;
          const decoded = found ? decodeValue(found.def, current) : null;
          const wikiCode = `$${p.id}`;
          const hasWiki = wikiCodes.has(wikiCode);

          return (
            <tr key={`${p.id}-${p.lineNumber}`} className="border-b border-gray-800/50 align-top">
              <td className="py-2 pr-3 font-mono text-emerald-400 whitespace-nowrap">
                {hasWiki ? (
                  <a href={`/?fw=${flavor}&code=${encodeURIComponent(wikiCode)}`}
                     className="underline hover:text-emerald-300">
                    ${p.id}
                  </a>
                ) : (
                  <>${p.id}</>
                )}
                {p.duplicate && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">dup</span>
                )}
              </td>
              <td className="py-2 pr-3 text-gray-300">
                {found ? found.def.name : (
                  <span className="text-gray-500">
                    Unknown setting
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-500 border border-gray-700">unknown</span>
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 font-mono text-gray-200 whitespace-nowrap">
                {!found && <span>{p.raw}</span>}
                {found && found.def.type === "bool" && (
                  <button
                    role="switch"
                    aria-checked={decoded?.kind === "bool" && decoded.on}
                    aria-label={found.def.name}
                    onClick={() => onEdit(p.id, decoded?.kind === "bool" && decoded.on ? "0" : "1")}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      decoded?.kind === "bool" && decoded.on ? "bg-emerald-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        decoded?.kind === "bool" && decoded.on ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
                {found && found.def.type === "enum" && (
                  <select
                    value={current}
                    onChange={(e) => onEdit(p.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                  >
                    {!Object.keys(found.def.values ?? {}).includes(current) && (
                      <option value={current}>Unknown value ({current})</option>
                    )}
                    {Object.entries(found.def.values ?? {}).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                )}
                {found && (found.def.type === "int" || found.def.type === "float" || found.def.type === "string" || found.def.type === "mask") && (
                  <input
                    value={current}
                    onChange={(e) => onEdit(p.id, e.target.value)}
                    className={`w-24 bg-gray-800 border rounded px-2 py-1 text-sm font-mono ${
                      validateValue(found.def, current) ? "border-red-700" : "border-gray-700"
                    }`}
                  />
                )}
                {modified && (
                  <button
                    onClick={() => onEdit(p.id, original)}
                    title={`Reset to imported value (${original})`}
                    className="ml-2 text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    reset
                  </button>
                )}
                {found && validateValue(found.def, current) && (
                  <div className="text-xs text-red-400 mt-1">{validateValue(found.def, current)}</div>
                )}
              </td>
              <td className="py-2 text-gray-400">
                {!decoded && <span className="text-gray-600">—</span>}
                {decoded?.kind === "mask" && found && (
                  <div className="flex flex-wrap gap-1">
                    {decoded.bits.map((b) => (
                      <button
                        key={b.bit}
                        onClick={() => onEdit(p.id, toggleMaskBit(current, b.bit, !b.set))}
                        className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                          b.set
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                            : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                    {decoded.unknownBits !== 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">
                        +unknown bits ({decoded.unknownBits})
                      </span>
                    )}
                  </div>
                )}
                {decoded?.kind === "number" && (
                  <span>
                    {decoded.display}
                    {decoded.outOfRange && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">out of range</span>
                    )}
                  </span>
                )}
                {decoded && decoded.kind !== "mask" && decoded.kind !== "number" && (
                  <span>{decoded.display}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
