import { describe, it, expect } from "vitest";
import { parseDollarConfig, asNumber, detectFlavor } from "@/lib/settings/parse";

const GRBL_DUMP = [
  "$0=10 (Step pulse time, microseconds)",
  "$1=25",
  "$130 = 200.000",
  "ok",
  "<Idle|MPos:0.000,0.000,0.000|FS:0,0>",
  "",
  "$23=5",
].join("\r\n");

describe("parseDollarConfig", () => {
  it("extracts $N=V pairs, ignoring noise lines and CRLF", () => {
    const p = parseDollarConfig(GRBL_DUMP);
    expect(p.map((x) => x.id)).toEqual([0, 1, 130, 23]);
  });

  it("strips trailing parenthesized comments from values", () => {
    expect(parseDollarConfig(GRBL_DUMP)[0].raw).toBe("10");
  });

  it("tolerates spaces around '='", () => {
    expect(parseDollarConfig(GRBL_DUMP)[2].raw).toBe("200.000");
  });

  it("flags duplicate ids and records line numbers", () => {
    const p = parseDollarConfig("$1=1\n$1=2");
    expect(p[0].duplicate).toBe(false);
    expect(p[1].duplicate).toBe(true);
    expect(p[1].lineNumber).toBe(2);
  });

  it("returns [] for garbage input without throwing", () => {
    expect(parseDollarConfig("complete\ngarbage 123")).toEqual([]);
  });
});

describe("asNumber", () => {
  it("parses ints, floats, negatives", () => {
    expect(asNumber("255")).toBe(255);
    expect(asNumber("200.000")).toBe(200);
    expect(asNumber("-1.5")).toBe(-1.5);
  });
  it("returns null for non-numeric strings (grblHAL SSIDs etc.)", () => {
    expect(asNumber("My Network")).toBeNull();
    expect(asNumber("")).toBeNull();
  });
});

describe("detectFlavor", () => {
  it("detects grblHAL from exclusive setting ids", () => {
    expect(detectFlavor(parseDollarConfig("$1=25\n$341=0"))).toBe("grblhal");
  });
  it("detects grblHAL when $22 is a mask value > 1", () => {
    expect(detectFlavor(parseDollarConfig("$22=6"))).toBe("grblhal");
  });
  it("defaults to grbl for a plain 1.1 dump", () => {
    expect(detectFlavor(parseDollarConfig(GRBL_DUMP))).toBe("grbl");
  });
});
