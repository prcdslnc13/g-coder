export type FirmwareId = "grbl" | "grblhal" | "linuxcnc" | "smoothieware" | "reprapfirmware" | "fluidnc";

export interface FirmwareInfo {
  id: FirmwareId;
  name: string;
  description: string;
  version: string;
  sourceUrl: string;
}

export interface CodeParameter {
  name: string;
  description: string;
  optional: boolean;
  example?: string;
}

export interface CodeExample {
  code: string;
  description: string;
}

export interface CrossReference {
  firmwareId: FirmwareId;
  code: string;
  note: string;
}

export interface ModeNote {
  mode: string;
  description: string;
}

export interface GCodeEntry {
  code: string;
  type: "G" | "M" | "$";
  name: string;
  description: string;
  parameters: CodeParameter[];
  examples: CodeExample[];
  relatedCodes: string[];
  crossReferences: CrossReference[];
  modeNotes: ModeNote[];
  sources: string[];
  notes?: string;
  versionNotes?: string;
}

export interface FirmwareData {
  firmware: FirmwareInfo;
  codes: GCodeEntry[];
}
