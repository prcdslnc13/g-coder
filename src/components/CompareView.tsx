"use client";

import { useEffect } from "react";
import { FirmwareData, FirmwareId } from "@/types/gcode";

interface CompareViewProps {
  code: string;
  allFirmwareData: Record<FirmwareId, FirmwareData>;
  onClose: () => void;
  onNavigate: (code: string, firmwareId: FirmwareId) => void;
}

export function CompareView({
  code,
  allFirmwareData,
  onClose,
  onNavigate,
}: CompareViewProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const firmwareEntries = Object.entries(allFirmwareData)
    .map(([id, fw]) => {
      const entry = fw.codes.find((c) => c.code === code) ??
        fw.codes.find((c) => c.code.startsWith(code + " "));
      return { id: id as FirmwareId, firmware: fw.firmware, entry };
    })
    .filter((f) => f.entry);

  const missingFirmwares = Object.entries(allFirmwareData)
    .filter(([, fw]) => !fw.codes.some((c) => c.code === code || c.code.startsWith(code + " ")))
    .map(([, fw]) => fw.firmware.name);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-emerald-400">
                {code}
              </span>
              <span className="text-lg text-gray-200">Cross-Firmware Comparison</span>
            </div>
            <span className="text-xs text-gray-500">
              {firmwareEntries.length} firmware{firmwareEntries.length !== 1 ? "s" : ""}
              {missingFirmwares.length > 0 && (
                <> · Not in: {missingFirmwares.join(", ")}</>
              )}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {firmwareEntries.map(({ id, firmware, entry }) => {
            if (!entry) return null;
            const hasWarnings = entry.crossReferences.some(
              (x) =>
                x.note.includes("WARNING") ||
                x.note.includes("CONFLICT") ||
                x.note.includes("CRITICAL")
            );

            return (
              <div
                key={id}
                className={`rounded-lg border p-4 ${
                  hasWarnings
                    ? "border-amber-900/50 bg-amber-950/10"
                    : "border-gray-800 bg-gray-800/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate(code, id)}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 underline"
                    >
                      {firmware.name}
                    </button>
                    {hasWarnings && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-900/50 text-amber-400 border border-amber-800">
                        has conflicts
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{entry.name}</span>
                </div>

                <p className="text-sm text-gray-300 mb-3">{entry.description}</p>

                {/* Parameters summary */}
                {entry.parameters.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase">Params: </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {entry.parameters.map((p) => p.name).join(", ")}
                    </span>
                  </div>
                )}

                {/* Mode notes */}
                {entry.modeNotes.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {entry.modeNotes.map((mn, i) => (
                      <div
                        key={i}
                        className="text-xs bg-blue-950/30 border border-blue-900/30 rounded px-2 py-1"
                      >
                        <span className="text-blue-400 font-medium">{mn.mode}:</span>{" "}
                        <span className="text-gray-400">{mn.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key warnings from cross-refs */}
                {entry.crossReferences
                  .filter(
                    (x) =>
                      x.note.includes("WARNING") ||
                      x.note.includes("CONFLICT") ||
                      x.note.includes("CRITICAL")
                  )
                  .map((xref, i) => (
                    <div
                      key={i}
                      className="text-xs bg-amber-950/30 border border-amber-900/30 rounded px-2 py-1 mt-1"
                    >
                      <span className="text-amber-400">{xref.note}</span>
                    </div>
                  ))}

                {/* Notes */}
                {entry.notes && (
                  <p className="text-xs text-gray-500 mt-2">{entry.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
