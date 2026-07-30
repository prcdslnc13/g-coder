"use client";

import { useState } from "react";
import { SettingFlavor } from "@/types/settings";
import { ParsedSetting } from "@/lib/settings/parse";
import { diffConfigs, maskBitChanges, DiffRow } from "@/lib/settings/diff";
import { lookupSettingDef } from "@/lib/settings/catalog";

const STATUS_STYLES: Record<DiffRow["status"], string> = {
  same: "",
  changed: "bg-amber-950/20",
  onlyA: "bg-red-950/20",
  onlyB: "bg-emerald-950/20",
};

const STATUS_LABELS: Record<DiffRow["status"], string | null> = {
  same: null,
  changed: "changed",
  onlyA: "only in A",
  onlyB: "only in B",
};

export function DiffTable({ a, b, flavor }: { a: ParsedSetting[]; b: ParsedSetting[]; flavor: SettingFlavor }) {
  const [diffOnly, setDiffOnly] = useState(true);
  const rows = diffConfigs(a, b).filter((r) => !diffOnly || r.status !== "same");

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
        Differences only
      </label>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <th className="py-2 pr-3">Setting</th>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Config A</th>
            <th className="py-2 pr-3">Config B</th>
            <th className="py-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const found = lookupSettingDef(r.id, flavor);
            const bitChanges =
              found && found.def.type === "mask" && r.status === "changed" && r.a && r.b
                ? maskBitChanges(found.def, r.a, r.b)
                : [];
            return (
              <tr key={r.id} className={`border-b border-gray-800/50 align-top ${STATUS_STYLES[r.status]}`}>
                <td className="py-2 pr-3 font-mono text-emerald-400">${r.id}</td>
                <td className="py-2 pr-3 text-gray-300">{found?.def.name ?? <span className="text-gray-500">Unknown</span>}</td>
                <td className="py-2 pr-3 font-mono text-gray-200">{r.a ?? <span className="text-gray-600">—</span>}</td>
                <td className="py-2 pr-3 font-mono text-gray-200">{r.b ?? <span className="text-gray-600">—</span>}</td>
                <td className="py-2 text-xs">
                  {STATUS_LABELS[r.status] && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                      {STATUS_LABELS[r.status]}
                    </span>
                  )}
                  {bitChanges.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {bitChanges.map((c) => (
                        <div key={c.label} className={c.to ? "text-emerald-400" : "text-red-400"}>
                          {c.to ? "+" : "−"} {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-sm text-gray-500">No differences.</p>}
    </div>
  );
}
