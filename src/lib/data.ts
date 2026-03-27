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

export function getFirmwareList(): FirmwareInfo[] {
  return Object.values(firmwareMap).map((fw) => fw.firmware);
}

export function getFirmwareData(id: FirmwareId): FirmwareData {
  return firmwareMap[id];
}

export function getAllFirmwareData(): Record<FirmwareId, FirmwareData> {
  return firmwareMap;
}
