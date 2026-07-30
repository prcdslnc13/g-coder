import { describe, it, expect } from "vitest";
import { parseUrlState, serializeUrlState, DEFAULT_URL_STATE } from "@/lib/urlState";

describe("parseUrlState", () => {
  it("returns defaults for empty search", () => {
    expect(parseUrlState("")).toEqual(DEFAULT_URL_STATE);
  });

  it("parses firmware, type, query, code, view", () => {
    const s = parseUrlState("?fw=grblhal&type=RT&q=%2420%2C%2421&code=G28&view=compare");
    expect(s).toEqual({ fw: "grblhal", type: "RT", q: "$20,$21", code: "G28", view: "compare" });
  });

  it("falls back to defaults on unknown fw / type / view", () => {
    const s = parseUrlState("?fw=marlin&type=ZZZ&view=split");
    expect(s.fw).toBe("grbl");
    expect(s.type).toBe("all");
    expect(s.view).toBeNull();
  });

  it("handles $-codes and RT codes in the code param", () => {
    expect(parseUrlState("?code=%2423").code).toBe("$23");
    expect(parseUrlState("?code=RT%3A%3F").code).toBe("RT:?");
  });
});

describe("serializeUrlState", () => {
  it("returns empty string for all-default state", () => {
    expect(serializeUrlState(DEFAULT_URL_STATE)).toBe("");
  });

  it("omits default fields and keeps the rest", () => {
    const qs = serializeUrlState({ fw: "grbl", type: "$", q: "", code: "$23", view: null });
    expect(qs.startsWith("?")).toBe(true);
    expect(qs).not.toContain("fw=");
    expect(qs).not.toContain("q=");
  });

  it("round-trips every field", () => {
    const state = { fw: "fluidnc" as const, type: "ALARM", q: "hard limit", code: "ALARM:1", view: "compare" as const };
    expect(parseUrlState(serializeUrlState(state))).toEqual(state);
  });
});
