"use client";

import { useState, useMemo } from "react";
import { CodeType, FirmwareId, GCodeEntry } from "@/types/gcode";
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

  // Type-based code categories for contextual filter buttons.
  // Order here also drives the sort order below and the button order in the header.
  const codeCategories = useMemo(() => {
    const all: { id: CodeType; label: string }[] = [
      { id: "G", label: "G" },
      { id: "M", label: "M" },
      { id: "$", label: "$" },
      { id: "RT", label: "RT" },
      { id: "ERR", label: "Errors" },
      { id: "ALARM", label: "Alarms" },
      { id: "META", label: "Meta" },
      { id: "NGC", label: "NGC" },
      { id: "O", label: "O-codes" },
      { id: "CMT", label: "Comments" },
    ];
    return all.filter((p) => firmwareData.codes.some((c) => c.type === p.id));
  }, [firmwareData.codes]);

  const filteredCodes = useMemo(() => {
    let codes = firmwareData.codes;

    if (typeFilter !== "all") {
      codes = codes.filter((c) => c.type === typeFilter);
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

    const typeOrder: Record<CodeType, number> = {
      G: 0, M: 1, $: 2, RT: 3, ERR: 4, ALARM: 5, META: 6, NGC: 7, O: 8, CMT: 9,
    };
    return codes.slice().sort((a, b) => {
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
      const numA = parseFloat(a.code.replace(/[^0-9.]/g, "")) || 0;
      const numB = parseFloat(b.code.replace(/[^0-9.]/g, "")) || 0;
      return numA - numB;
    });
  }, [firmwareData.codes, searchQuery, typeFilter]);

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
