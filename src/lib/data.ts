import { FirmwareData, FirmwareId, FirmwareInfo } from "@/types/gcode";

import grblData from "../../data/grbl.json";
import grblhalData from "../../data/grblhal.json";
import linuxcncData from "../../data/linuxcnc.json";
import smoothiewareData from "../../data/smoothieware.json";
import reprapfirmwareData from "../../data/reprapfirmware.json";
import fluidncData from "../../data/fluidnc.json";

const firmwareMap: Record<FirmwareId, FirmwareData> = {
  grbl: grblData as FirmwareData,
  grblhal: grblhalData as FirmwareData,
  linuxcnc: linuxcncData as FirmwareData,
  smoothieware: smoothiewareData as FirmwareData,
  reprapfirmware: reprapfirmwareData as FirmwareData,
  fluidnc: fluidncData as FirmwareData,
};

export interface ConflictInfo {
  hasConflict: boolean;
  firmwareCount: number;
}

// code-per-firmware presence index + per-firmware per-code warning flag,
// precomputed once at module load so list renders don't rescan every firmware.
const codePresence = new Map<string, Set<FirmwareId>>();
const warningIndex = new Map<string, boolean>();

for (const fwId of Object.keys(firmwareMap) as FirmwareId[]) {
  for (const entry of firmwareMap[fwId].codes) {
    let presence = codePresence.get(entry.code);
    if (!presence) {
      presence = new Set();
      codePresence.set(entry.code, presence);
    }
    presence.add(fwId);

    for (const xref of entry.crossReferences) {
      const note = xref.note;
      if (note.includes("WARNING") || note.includes("CONFLICT") || note.includes("CRITICAL")) {
        warningIndex.set(`${fwId}|${entry.code}|${xref.firmwareId}`, true);
      }
    }
  }
}

export function getFirmwareList(): FirmwareInfo[] {
  return Object.values(firmwareMap).map((fw) => fw.firmware);
}

export function getFirmwareData(id: FirmwareId): FirmwareData {
  return firmwareMap[id];
}

export function getAllFirmwareData(): Record<FirmwareId, FirmwareData> {
  return firmwareMap;
}

export function getConflictInfo(code: string, currentFirmware: FirmwareId): ConflictInfo {
  const presence = codePresence.get(code);
  if (!presence) return { hasConflict: false, firmwareCount: 0 };

  let firmwareCount = 0;
  let hasConflict = false;
  for (const fwId of presence) {
    if (fwId === currentFirmware) continue;
    firmwareCount++;
    if (warningIndex.has(`${currentFirmware}|${code}|${fwId}`)) {
      hasConflict = true;
    }
  }
  return { hasConflict, firmwareCount };
}
