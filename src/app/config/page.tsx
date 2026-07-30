"use client";

import { useMemo, useState } from "react";
import { SettingFlavor } from "@/types/settings";
import { parseDollarConfig, detectFlavor } from "@/lib/settings/parse";
import { serializeConfig } from "@/lib/settings/edit";
import { SettingsTable } from "@/components/config/SettingsTable";
import { DiffTable } from "@/components/config/DiffTable";

const FLAVOR_LABELS: Record<SettingFlavor, string> = {
  grbl: "grbl 1.1",
  grblhal: "grblHAL",
  fluidnc: "FluidNC",
};

export default function ConfigPage() {
  const [text, setText] = useState("");
  const [flavorOverride, setFlavorOverride] = useState<SettingFlavor | "auto">("auto");
  const [mode, setMode] = useState<"analyze" | "compare">("analyze");
  const [textB, setTextB] = useState("");
  const [edits, setEdits] = useState<Map<number, string>>(new Map());

  const parsed = useMemo(() => parseDollarConfig(text), [text]);
  const parsedB = useMemo(() => parseDollarConfig(textB), [textB]);
  const detected = useMemo(
    () => detectFlavor([...parsed, ...parsedB]),
    [parsed, parsedB]
  );
  const flavor = flavorOverride === "auto" ? detected : flavorOverride;

  function handleEdit(id: number, raw: string) {
    setEdits((prev) => {
      const next = new Map(prev);
      const original = parsed.filter((p) => p.id === id).at(-1)?.raw;
      if (raw === original) next.delete(id);
      else next.set(id, raw);
      return next;
    });
  }

  // Current value per id: edited value if present, else last imported value.
  function currentEntries(): { id: number; raw: string }[] {
    const byId = new Map<number, string>();
    for (const p of parsed) byId.set(p.id, p.raw);
    for (const [id, raw] of edits) byId.set(id, raw);
    return [...byId.entries()].map(([id, raw]) => ({ id, raw }));
  }

  function download(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-emerald-400">GCode</span> Atlas
            <span className="ml-3 text-sm font-normal text-gray-400">$$ Config Tools</span>
          </h1>
          <a href="/" className="text-sm text-emerald-500 hover:text-emerald-400 underline">
            ← Code reference
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
        <div className="flex gap-1">
          {(["analyze", "compare"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                mode === m ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              {m === "analyze" ? "Analyze" : "Compare two configs"}
            </button>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="dump" className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {mode === "compare" ? "Config A" : "Paste a $$ settings dump"}
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Firmware:</span>
              <select
                value={flavorOverride}
                onChange={(e) => setFlavorOverride(e.target.value as SettingFlavor | "auto")}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-200"
              >
                <option value="auto">Auto ({FLAVOR_LABELS[detected]})</option>
                {(Object.keys(FLAVOR_LABELS) as SettingFlavor[]).map((f) => (
                  <option key={f} value={f}>{FLAVOR_LABELS[f]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={mode === "compare" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : undefined}>
            <div>
              <textarea
                id="dump"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setEdits(new Map());
                }}
                placeholder={"$0=10\n$1=25\n$23=5\n..."}
                rows={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Everything except $N=value lines (ok, status reports, messages) is ignored. Nothing leaves your browser.
                </p>
                <label className="text-xs text-emerald-500 hover:text-emerald-400 underline cursor-pointer">
                  Load from file
                  <input
                    type="file"
                    accept=".txt,.nc,.gcode,text/plain"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setText(await f.text());
                        setEdits(new Map());
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            {mode === "compare" && (
              <div>
                <label htmlFor="dumpB" className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Config B
                </label>
                <textarea
                  id="dumpB"
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder={"$0=10\n$1=25\n$23=5\n..."}
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Everything except $N=value lines (ok, status reports, messages) is ignored. Nothing leaves your browser.
                </p>
              </div>
            )}
          </div>
        </section>

        {mode === "analyze" && parsed.length > 0 && (
          <section>
            <div className="mb-3 text-sm text-gray-500">
              {parsed.length} setting{parsed.length !== 1 ? "s" : ""} · decoded as {FLAVOR_LABELS[flavor]}
            </div>
            <div className="flex items-center gap-2 mb-3">
              {edits.size > 0 && (
                <span className="text-xs text-amber-400">{edits.size} setting{edits.size !== 1 ? "s" : ""} modified</span>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(serializeConfig(currentEntries()))}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700"
              >
                Copy full config
              </button>
              <button
                onClick={() => download(serializeConfig(currentEntries()), "config.txt")}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700"
              >
                Download full config
              </button>
              <button
                disabled={edits.size === 0}
                onClick={() =>
                  download(
                    serializeConfig([...edits.entries()].map(([id, raw]) => ({ id, raw }))),
                    "config-changes.txt"
                  )
                }
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 disabled:opacity-40"
              >
                Download changed only
              </button>
            </div>
            <SettingsTable parsed={parsed} flavor={flavor} edits={edits} onEdit={handleEdit} />
          </section>
        )}

        {mode === "compare" && parsed.length > 0 && parsedB.length > 0 && (
          <DiffTable a={parsed} b={parsedB} flavor={flavor} />
        )}
      </main>
    </div>
  );
}
