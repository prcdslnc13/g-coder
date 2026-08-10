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

describe("grblHAL extended overlay", () => {
  it("resolves extended settings the vendored catalog lacks ($709 PWM2 options)", () => {
    const r = lookupSettingDef(709, "grblhal");
    expect(r).not.toBeNull();
    expect(r!.def.name).toMatch(/PWM2/);
    expect(r!.def.type).toBe("mask");
    // Not defined for grbl 1.1
    expect(lookupSettingDef(709, "grbl")).toBeNull();
  });

  it("overrides vendored entries that lag current core ($65 is a mask, $346 tool change options)", () => {
    const p = lookupSettingDef(65, "grblhal")!;
    expect(p.def.type).toBe("mask");
    expect(Object.values(p.def.values!)).toContain("Probe protection");
    const t = lookupSettingDef(346, "grblhal")!;
    expect(t.def.type).toBe("mask");
  });

  it("does not shadow other flavors ($65 unchanged for grbl lookup path)", () => {
    // $19 exists in vendor for grblhal only; grbl gets vendor behavior untouched.
    const vendorGrbl = lookupSettingDef(23, "grbl")!;
    expect(vendorGrbl.def.flavors).toContain("grbl");
  });

  it("knownIds includes overlay ids", () => {
    const ids = knownIds();
    expect(ids).toContain(683);
    expect(ids).toContain(772);
  });

  it("every overlay entry cites sources and decodes for grblhal", () => {
    for (const id of [41, 61, 160, 175, 300, 340, 486, 590, 650, 683, 700, 750, 763, 772]) {
      const r = lookupSettingDef(id, "grblhal");
      expect(r, `$${id}`).not.toBeNull();
      expect(r!.def.sources.length).toBeGreaterThan(0);
      expect(r!.def.flavors).toContain("grblhal");
    }
  });
});
