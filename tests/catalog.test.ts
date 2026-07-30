import { describe, it, expect } from "vitest";
import { lookupSettingDef, knownIds } from "@/lib/settings/catalog";

describe("lookupSettingDef", () => {
  it("finds $23 for grbl as a mask with axis bit labels", () => {
    const r = lookupSettingDef(23, "grbl");
    expect(r).not.toBeNull();
    expect(r!.def.type).toBe("mask");
    expect(r!.def.values![0]).toMatch(/X/);
    expect(r!.def.flavors).toContain("grbl");
  });

  it("expands axis-indexed settings ($100 base → $102 is Z)", () => {
    const r = lookupSettingDef(102, "grbl");
    expect(r).not.toBeNull();
    expect(r!.def.name).toMatch(/Z/);
  });

  it("prefers the flavor-specific definition ($10 differs between grbl and grblHAL)", () => {
    const grbl = lookupSettingDef(10, "grbl")!;
    const hal = lookupSettingDef(10, "grblhal")!;
    expect(grbl.def.name).not.toBe(hal.def.name);
    expect(hal.candidates.length).toBeGreaterThan(1);
  });

  it("returns null for unknown ids", () => {
    expect(lookupSettingDef(9999, "grbl")).toBeNull();
  });

  it("every returned def cites at least one source", () => {
    for (const id of knownIds().slice(0, 20)) {
      const r = lookupSettingDef(id, "grbl") ?? lookupSettingDef(id, "grblhal");
      expect(r!.def.sources.length).toBeGreaterThan(0);
    }
  });
});
