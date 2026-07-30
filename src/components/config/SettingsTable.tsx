"use client";

import { SettingFlavor } from "@/types/settings";
import { ParsedSetting } from "@/lib/settings/parse";
import { lookupSettingDef } from "@/lib/settings/catalog";
import { decodeValue } from "@/lib/settings/decode";
import { getFirmwareData } from "@/lib/data";

interface SettingsTableProps {
  parsed: ParsedSetting[];
  flavor: SettingFlavor;
}

export function SettingsTable({ parsed, flavor }: SettingsTableProps) {
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
          const decoded = found ? decodeValue(found.def, p.raw) : null;
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
              <td className="py-2 pr-3 font-mono text-gray-200 whitespace-nowrap">{p.raw}</td>
              <td className="py-2 text-gray-400">
                {!decoded && <span className="text-gray-600">—</span>}
                {decoded?.kind === "mask" && (
                  <div className="flex flex-wrap gap-1">
                    {decoded.bits.filter((b) => b.set).map((b) => (
                      <span key={b.bit} className="px-1.5 py-0.5 text-xs rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
                        {b.label}
                      </span>
                    ))}
                    {decoded.bits.every((b) => !b.set) && decoded.unknownBits === 0 && <span>None</span>}
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
