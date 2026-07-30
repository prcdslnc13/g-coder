import { describe, it, expect } from "vitest";
import { toggleMaskBit, validateValue, serializeConfig } from "@/lib/settings/edit";
import { SettingDef } from "@/types/settings";

const intDef: SettingDef = {
  id: 0, flavors: ["grbl"], name: "Step pulse", description: "",
  type: "int", units: "µs", range: { min: 1, max: 255 }, sources: ["https://example.com"],
};

describe("toggleMaskBit", () => {
  it("sets and clears bits", () => {
    expect(toggleMaskBit("0", 2, true)).toBe("4");
    expect(toggleMaskBit("5", 0, false)).toBe("4");
    expect(toggleMaskBit("5", 1, true)).toBe("7");
  });
  it("treats unparseable input as 0", () => {
    expect(toggleMaskBit("abc", 0, true)).toBe("1");
  });
});

describe("validateValue", () => {
  it("accepts in-range numbers", () => {
    expect(validateValue(intDef, "10")).toBeNull();
  });
  it("rejects non-numeric input for numeric types", () => {
    expect(validateValue(intDef, "abc")).toMatch(/number/i);
  });
  it("rejects out-of-range values with the range in the message", () => {
    expect(validateValue(intDef, "999")).toMatch(/1.*255/);
  });
  it("rejects non-integers for int type", () => {
    expect(validateValue(intDef, "1.5")).toMatch(/integer/i);
  });
  it("accepts anything for string type", () => {
    const strDef: SettingDef = { ...intDef, type: "string", range: undefined };
    expect(validateValue(strDef, "My Network")).toBeNull();
  });
});

describe("serializeConfig", () => {
  it("emits $N=V lines sorted by id with trailing newline", () => {
    expect(serializeConfig([{ id: 100, raw: "80" }, { id: 0, raw: "10" }]))
      .toBe("$0=10\n$100=80\n");
  });
  it("returns empty string for no entries", () => {
    expect(serializeConfig([])).toBe("");
  });
});
