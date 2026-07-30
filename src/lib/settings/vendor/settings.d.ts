export interface VendorSettingEntry {
  id: number;
  flavors: ("grbl11" | "grblhal" | "fluidnc")[];
  name: string;
  description: string;
  type: "bool" | "int" | "float" | "mask" | "enum" | "string";
  units?: string;
  range?: { min: number; max: number };
  values?: Record<number, string>;
  axisBase?: boolean;
  axis?: string;
}

export const FLAVORS: Record<string, string>;
export const AXIS_LABELS: string[];
export function lookupSetting(
  id: number,
  preferredFlavor?: string
): { entry: VendorSettingEntry; candidates: VendorSettingEntry[] } | null;
export function knownIds(): number[];
