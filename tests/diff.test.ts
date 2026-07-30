import { describe, it, expect } from "vitest";
import { diffConfigs, maskBitChanges } from "@/lib/settings/diff";
import { parseDollarConfig } from "@/lib/settings/parse";
import { SettingDef } from "@/types/settings";

const maskDef: SettingDef = {
  id: 23, flavors: ["grbl"], name: "Homing direction invert", description: "",
  type: "mask", values: { 0: "X homes positive", 1: "Y homes positive", 2: "Z homes positive" },
  sources: ["https://example.com"],
};

describe("diffConfigs", () => {
  it("classifies same, changed, onlyA, onlyB", () => {
    const a = parseDollarConfig("$0=10\n$1=25\n$2=0");
    const b = parseDollarConfig("$0=10\n$1=50\n$3=7");
    expect(diffConfigs(a, b)).toEqual([
      { id: 0, a: "10", b: "10", status: "same" },
      { id: 1, a: "25", b: "50", status: "changed" },
      { id: 2, a: "0", b: null, status: "onlyA" },
      { id: 3, a: null, b: "7", status: "onlyB" },
    ]);
  });

  it("treats numerically equal values as same (200 vs 200.000)", () => {
    const rows = diffConfigs(parseDollarConfig("$130=200"), parseDollarConfig("$130=200.000"));
    expect(rows[0].status).toBe("same");
  });

  it("compares non-numeric values as strings", () => {
    const rows = diffConfigs(parseDollarConfig("$74=NetA"), parseDollarConfig("$74=NetB"));
    expect(rows[0].status).toBe("changed");
  });

  it("uses the last value for duplicated ids", () => {
    const rows = diffConfigs(parseDollarConfig("$1=1\n$1=9"), parseDollarConfig("$1=9"));
    expect(rows[0].status).toBe("same");
  });
});

describe("maskBitChanges", () => {
  it("reports only the differing bits with direction", () => {
    // 5 = X+Z set, 3 = X+Y set → Y turned on, Z turned off
    expect(maskBitChanges(maskDef, "5", "3")).toEqual([
      { label: "Y homes positive", from: false, to: true },
      { label: "Z homes positive", from: true, to: false },
    ]);
  });

  it("returns [] when masks are equal or unparseable", () => {
    expect(maskBitChanges(maskDef, "5", "5")).toEqual([]);
    expect(maskBitChanges(maskDef, "abc", "5")).toEqual([]);
  });
});
