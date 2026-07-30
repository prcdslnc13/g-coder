export type SettingFlavor = "grbl" | "grblhal" | "fluidnc";

export type SettingType = "bool" | "int" | "float" | "mask" | "enum" | "string";

export interface SettingDef {
  id: number;
  flavors: SettingFlavor[];
  name: string;
  description: string;
  type: SettingType;
  units?: string;
  range?: { min: number; max: number };
  // enum: value → label; mask: BIT INDEX → label
  values?: Record<number, string>;
  axis?: string;
  sources: string[];
}
