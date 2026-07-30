import { FirmwareId } from "@/types/gcode";

export interface UrlState {
  fw: FirmwareId;
  type: string; // a CodeType or "all"
  q: string;
  code: string | null;
  view: "compare" | null;
}

const FIRMWARE_IDS: readonly string[] = [
  "grbl", "grblhal", "linuxcnc", "smoothieware", "reprapfirmware", "fluidnc",
];
const TYPE_FILTERS: readonly string[] = [
  "all", "G", "M", "$", "RT", "ERR", "ALARM", "META", "NGC", "O", "CMT",
];

export const DEFAULT_URL_STATE: UrlState = {
  fw: "grbl",
  type: "all",
  q: "",
  code: null,
  view: null,
};

export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  const fw = p.get("fw") ?? "";
  const type = p.get("type") ?? "";
  return {
    fw: FIRMWARE_IDS.includes(fw) ? (fw as FirmwareId) : DEFAULT_URL_STATE.fw,
    type: TYPE_FILTERS.includes(type) ? type : DEFAULT_URL_STATE.type,
    q: p.get("q") ?? "",
    code: p.get("code"),
    view: p.get("view") === "compare" ? "compare" : null,
  };
}

export function serializeUrlState(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.fw !== DEFAULT_URL_STATE.fw) p.set("fw", s.fw);
  if (s.type !== DEFAULT_URL_STATE.type) p.set("type", s.type);
  if (s.q) p.set("q", s.q);
  if (s.code) p.set("code", s.code);
  if (s.view) p.set("view", s.view);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}
