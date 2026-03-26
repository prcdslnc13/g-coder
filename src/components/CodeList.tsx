"use client";

import { FirmwareData, FirmwareId, GCodeEntry } from "@/types/gcode";

interface CodeListProps {
  codes: GCodeEntry[];
  onSelect: (entry: GCodeEntry) => void;
  selectedCode: string | null;
  allFirmwareData: Record<FirmwareId, FirmwareData>;
  currentFirmware: FirmwareId;
}

function getConflictBadge(
  entry: GCodeEntry,
  allFirmwareData: Record<FirmwareId, FirmwareData>,
  currentFirmware: FirmwareId
): { hasConflict: boolean; firmwareCount: number } {
  const otherFirmwares = Object.keys(allFirmwareData).filter(
    (id) => id !== currentFirmware
  ) as FirmwareId[];

  let hasConflict = false;
  let firmwareCount = 0;

  for (const fwId of otherFirmwares) {
    const fwData = allFirmwareData[fwId];
    const match = fwData.codes.find((c) => c.code === entry.code);
    if (match) {
      firmwareCount++;
      // Check if there's a cross-reference with a warning
      const xref = entry.crossReferences.find((x) => x.firmwareId === fwId);
      if (
        xref &&
        (xref.note.includes("WARNING") ||
          xref.note.includes("CONFLICT") ||
          xref.note.includes("CRITICAL"))
      ) {
        hasConflict = true;
      }
    }
  }

  return { hasConflict, firmwareCount };
}

export function CodeList({
  codes,
  onSelect,
  selectedCode,
  allFirmwareData,
  currentFirmware,
}: CodeListProps) {
  if (codes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        No codes found matching your search.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {codes.map((entry) => {
        const { hasConflict, firmwareCount } = getConflictBadge(
          entry,
          allFirmwareData,
          currentFirmware
        );

        return (
          <button
            key={entry.code}
            onClick={() => onSelect(entry)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
              selectedCode === entry.code
                ? "border-emerald-500 bg-emerald-950/30"
                : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-850"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400 w-16 shrink-0">
                {entry.code}
              </span>
              <span className="text-gray-200 font-medium">{entry.name}</span>
              <div className="flex gap-1.5 ml-auto shrink-0">
                {hasConflict && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-900/50 text-amber-400 border border-amber-800">
                    conflict
                  </span>
                )}
                {firmwareCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                    {firmwareCount} other fw
                  </span>
                )}
                {entry.modeNotes.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-400 border border-blue-800">
                    mode-dependent
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {entry.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
