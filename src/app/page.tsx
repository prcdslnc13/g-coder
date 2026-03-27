"use client";

import { useState, useMemo } from "react";
import { FirmwareId, GCodeEntry } from "@/types/gcode";
import { getFirmwareList, getFirmwareData, getAllFirmwareData } from "@/lib/data";
import { FirmwareSelector } from "@/components/FirmwareSelector";
import { CodeList } from "@/components/CodeList";
import { CodeDetail } from "@/components/CodeDetail";
import { CompareView } from "@/components/CompareView";

export default function Home() {
  const [selectedFirmware, setSelectedFirmware] = useState<FirmwareId>("grbl");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<GCodeEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [compareCode, setCompareCode] = useState<string | null>(null);

  const firmwareList = getFirmwareList();
  const firmwareData = getFirmwareData(selectedFirmware);
  const allFirmwareData = getAllFirmwareData();

  // Prefix-based code categories for contextual filter buttons
  const codeCategories = useMemo(() => {
    const prefixes = [
      { id: "G", label: "G", match: (c: GCodeEntry) => c.type === "G" },
      { id: "M", label: "M", match: (c: GCodeEntry) => c.type === "M" },
      { id: "$", label: "$", match: (c: GCodeEntry) => c.type === "$" && c.code.startsWith("$") },
      { id: "RT", label: "RT", match: (c: GCodeEntry) => c.code.startsWith("RT:") },
      { id: "ERR", label: "Errors", match: (c: GCodeEntry) => c.code.startsWith("ERR:") },
      { id: "ALARM", label: "Alarms", match: (c: GCodeEntry) => c.code.startsWith("ALARM:") },
      { id: "META", label: "Meta", match: (c: GCodeEntry) => c.code.startsWith("META:") },
      { id: "NGC", label: "NGC", match: (c: GCodeEntry) => c.code.startsWith("NGC:") },
      { id: "O", label: "O-codes", match: (c: GCodeEntry) => c.code.startsWith("O:") },
    ];
    return prefixes.filter((p) => firmwareData.codes.some(p.match));
  }, [firmwareData.codes]);

  const filterMatch = useMemo(() => {
    const cat = codeCategories.find((c) => c.id === typeFilter);
    return cat?.match;
  }, [typeFilter, codeCategories]);

  const filteredCodes = useMemo(() => {
    let codes = firmwareData.codes;

    if (typeFilter !== "all" && filterMatch) {
      codes = codes.filter(filterMatch);
    }

    if (searchQuery.trim()) {
      const terms = searchQuery.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      codes = codes.filter((c) =>
        terms.some(
          (q) =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        )
      );
    }

    return codes.sort((a, b) => {
      const typeOrder = { G: 0, M: 1, $: 2 };
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
      const numA = parseFloat(a.code.replace(/[^0-9.]/g, "")) || 0;
      const numB = parseFloat(b.code.replace(/[^0-9.]/g, "")) || 0;
      return numA - numB;
    });
  }, [firmwareData.codes, searchQuery, typeFilter, filterMatch]);

  function handleNavigate(code: string, firmwareId?: FirmwareId) {
    if (firmwareId && firmwareId !== selectedFirmware) {
      setSelectedFirmware(firmwareId);
      const targetFw = allFirmwareData[firmwareId];
      const targetEntry = targetFw?.codes.find((c) => c.code === code);
      if (targetEntry) {
        setSelectedCode(targetEntry);
      } else {
        setSelectedCode(null);
      }
      setTypeFilter("all");
    } else {
      const targetEntry = firmwareData.codes.find((c) => c.code === code);
      if (targetEntry) {
        setSelectedCode(targetEntry);
      }
    }
    setCompareCode(null);
  }

  function handleCompare(code: string) {
    setSelectedCode(null);
    setCompareCode(code);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">G</span>-Coder
            </h1>
            <FirmwareSelector
              firmwareList={firmwareList}
              selected={selectedFirmware}
              onSelect={(id) => {
                setSelectedFirmware(id);
                setSelectedCode(null);
                setCompareCode(null);
                setTypeFilter("all");
              }}
            />
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search codes (comma-separated for multiple, e.g. $20, $21, $22)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              suppressHydrationWarning
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  typeFilter === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-750"
                }`}
              >
                All
              </button>
              {codeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setTypeFilter(cat.id)}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    typeFilter === cat.id
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-750"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="mb-3 text-sm text-gray-500">
          {filteredCodes.length} code{filteredCodes.length !== 1 ? "s" : ""} in{" "}
          {firmwareData.firmware.name}
        </div>
        <CodeList
          codes={filteredCodes}
          onSelect={setSelectedCode}
          selectedCode={selectedCode?.code ?? null}
          allFirmwareData={allFirmwareData}
          currentFirmware={selectedFirmware}
        />
      </main>

      {selectedCode && (
        <CodeDetail
          entry={selectedCode}
          firmware={firmwareData.firmware}
          allFirmwareData={allFirmwareData}
          onClose={() => setSelectedCode(null)}
          onNavigate={handleNavigate}
          onCompare={handleCompare}
        />
      )}

      {compareCode && (
        <CompareView
          code={compareCode}
          allFirmwareData={allFirmwareData}
          onClose={() => setCompareCode(null)}
          onNavigate={(code, fwId) => {
            setCompareCode(null);
            handleNavigate(code, fwId);
          }}
        />
      )}
    </div>
  );
}
