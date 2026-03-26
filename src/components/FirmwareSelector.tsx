"use client";

import { FirmwareId, FirmwareInfo } from "@/types/gcode";

interface FirmwareSelectorProps {
  firmwareList: FirmwareInfo[];
  selected: FirmwareId;
  onSelect: (id: FirmwareId) => void;
}

export function FirmwareSelector({
  firmwareList,
  selected,
  onSelect,
}: FirmwareSelectorProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {firmwareList.map((fw) => (
        <button
          key={fw.id}
          onClick={() => onSelect(fw.id)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            selected === fw.id
              ? "bg-emerald-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          }`}
        >
          {fw.name}
        </button>
      ))}
    </div>
  );
}
