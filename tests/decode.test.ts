import { describe, it, expect } from "vitest";
import { decodeValue } from "@/lib/settings/decode";
import { SettingDef } from "@/types/settings";

const maskDef: SettingDef = {
  id: 23, flavors: ["grbl"], name: "Homing direction invert", description: "",
  type: "mask", values: { 0: "X homes positive", 1: "Y homes positive", 2: "Z homes positive" },
  sources: ["https://example.com"],
};

const intDef: SettingDef = {
  id: 0, flavors: ["grbl"], name: "Step pulse", description: "",
  type: "int", units: "µs", range: { min: 1, max: 255 }, sources: ["https://example.com"],
};

const enumDef: SettingDef = {
  id: 99, flavors: ["grblhal"], name: "Mode", description: "",
  type: "enum", values: { 0: "Normal", 1: "Laser" }, sources: ["https://example.com"],
};

describe("decodeValue", () => {
  it("decodes mask bits with labels ($23=5 → X and Z set)", () => {
    const d = decodeValue(maskDef, "5");
    expect(d.kind).toBe("mask");
    if (d.kind !== "mask") return;
    expect(d.bits.filter((b) => b.set).map((b) => b.label))
      .toEqual(["X homes positive", "Z homes positive"]);
    expect(d.unknownBits).toBe(0);
    expect(d.display).toContain("X homes positive");
  });

  it("reports bits set beyond the known labels", () => {
    const d = decodeValue(maskDef, "9"); // bit 3 has no label
    if (d.kind !== "mask") throw new Error("expected mask");
    expect(d.unknownBits).toBe(8);
  });

  it("decodes mask 0 as none set", () => {
    const d = decodeValue(maskDef, "0");
    if (d.kind !== "mask") throw new Error("expected mask");
    expect(d.bits.every((b) => !b.set)).toBe(true);
    expect(d.display).toBe("None");
  });

  it("rejects negative mask values as raw", () => {
    const d = decodeValue(maskDef, "-1");
    expect(d.kind).toBe("raw");
    expect(d.display).toBe("-1");
  });

  it("decodes bool 0/1", () => {
    const boolDef: SettingDef = { ...intDef, type: "bool", units: undefined, range: undefined };
    expect(decodeValue(boolDef, "1")).toMatchObject({ kind: "bool", on: true, display: "On" });
    expect(decodeValue(boolDef, "0")).toMatchObject({ kind: "bool", on: false, display: "Off" });
  });

  it("decodes numbers with units and flags out-of-range", () => {
    expect(decodeValue(intDef, "10")).toMatchObject({ kind: "number", value: 10, outOfRange: false, display: "10 µs" });
    expect(decodeValue(intDef, "999")).toMatchObject({ kind: "number", outOfRange: true });
  });

  it("decodes enums, null label for unknown values", () => {
    expect(decodeValue(enumDef, "1")).toMatchObject({ kind: "enum", label: "Laser" });
    expect(decodeValue(enumDef, "7")).toMatchObject({ kind: "enum", label: null });
  });

  it("passes strings through and falls back to raw for unparseable numerics", () => {
    const strDef: SettingDef = { ...intDef, type: "string", units: undefined, range: undefined };
    expect(decodeValue(strDef, "My Network")).toMatchObject({ kind: "string", display: "My Network" });
    expect(decodeValue(intDef, "abc")).toMatchObject({ kind: "raw", display: "abc" });
  });
});
