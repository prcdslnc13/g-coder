# GCode Atlas Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app to GCode Atlas, make every view deep-linkable via query params, add a `/config` page that imports/decodes/diffs/edits grbl-family `$$` dumps, and add structured troubleshooting to alarm entries.

**Architecture:** Fully static Next.js 16 App Router app (client components, `output: "export"`, Cloudflare Pages). New pure-logic modules live in `src/lib/` with vitest tests; UI stays in client components. Settings knowledge is vendored verbatim from Adam Haile's MIT-licensed cnc_firmware_tools and wrapped in a typed adapter rather than transcribed.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, vitest (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-07-30-gcode-atlas-refresh-design.md`

## Global Constraints

- Static export must keep working: `next.config.ts` has `output: "export"`; no API routes, no server components with dynamic data, no `useSearchParams` (read `window.location.search` in effects instead).
- No new runtime dependencies. vitest is the only new devDependency.
- The product name is exactly **GCode Atlas** everywhere user-visible.
- Sourcing rule (project CLAUDE.md #7): every data entry cites official documentation URLs. **Verify each cited URL resolves (HTTP 200) before committing it**; if a listed candidate URL 404s, find the correct official page and use that.
- Attribution: data adapted from https://github.com/adammhaile/cnc_firmware_tools (MIT, © 2026 Adam Haile) — attribution required in README and in each vendored file header.
- Keep changes minimal and simple (project CLAUDE.md #4). Match existing Tailwind styling (gray-900 surfaces, emerald-400 accents).
- Every task ends: `npm run lint && npm run build` must pass before commit.
- End of each phase: rebuild Docker and verify by hand (`docker build -t gcode-atlas . && docker run -p 3000:80 gcode-atlas`, check http://localhost:3000) — standing project practice.
- Work on branch `gcode-atlas-refresh`, created from the current `cloudflare-pages-migration` HEAD (Task 1).
- All commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

# Phase 1 — Rename + Direct Linking

### Task 1: Branch + rename branding to GCode Atlas

**Files:**
- Modify: `src/app/layout.tsx:4-8` (metadata)
- Modify: `src/app/page.tsx:100-102` (header wordmark)
- Modify: `package.json:2-4` (name, description)
- Modify: `README.md` (title line)
- Modify: `ARCHITECTURE.md:1-5`, `CLAUDE.md` (project description lines)

**Interfaces:**
- Consumes: nothing
- Produces: nothing code-visible; branding only

- [ ] **Step 1: Create the branch**

```bash
git checkout -b gcode-atlas-refresh
```

- [ ] **Step 2: Update metadata in `src/app/layout.tsx`**

Replace the `metadata` export with:

```tsx
export const metadata: Metadata = {
  title: "GCode Atlas — Cross-Firmware G-Code Reference",
  description:
    "Search and compare G-code, M-code, and $ settings across open-source CNC firmwares: grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, and FluidNC.",
};
```

- [ ] **Step 3: Update the header wordmark in `src/app/page.tsx`**

Replace:

```tsx
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">G</span>-Coder
            </h1>
```

with:

```tsx
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">GCode</span> Atlas
            </h1>
```

- [ ] **Step 4: Update `package.json` fields**

`"name": "gcode-atlas"`, `"description": "GCode Atlas — search and compare G-code standards across open-source CNC firmwares"`. Leave `repository`/`bugs`/`homepage` URLs unchanged (repo rename is deferred).

- [ ] **Step 5: Update docs**

- `README.md`: first lines become:

```markdown
# GCode Atlas

Search and compare G-code, M-code, and $ settings across open-source CNC firmwares (grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, FluidNC). Formerly "g-coder".
```

- `ARCHITECTURE.md` line 5: replace "g-coder is a static..." with "GCode Atlas (formerly g-coder) is a static...".
- `CLAUDE.md` "## Project" paragraph: replace "g-coder is an interactive G-code/M-code wiki" with "GCode Atlas (repo: g-coder) is an interactive G-code/M-code wiki".

- [ ] **Step 6: Verify and commit**

```bash
npm run lint && npm run build
git add -A && git commit -m "Rename app to GCode Atlas (branding only)"
```

Expected: build succeeds; `grep -ri "g-coder" src/` returns nothing.

---

### Task 2: vitest setup + URL state module (TDD)

**Files:**
- Modify: `package.json` (add `test` script, vitest devDependency)
- Create: `vitest.config.ts`
- Create: `src/lib/urlState.ts`
- Test: `tests/urlState.test.ts`

**Interfaces:**
- Consumes: `FirmwareId`, `CodeType` from `@/types/gcode`
- Produces (used by Task 3):
  - `interface UrlState { fw: FirmwareId; type: string; q: string; code: string | null; view: "compare" | null }`
  - `const DEFAULT_URL_STATE: UrlState`
  - `parseUrlState(search: string): UrlState`
  - `serializeUrlState(state: UrlState): string` — returns `"?..."` or `""` when every field is default

- [ ] **Step 1: Install vitest and add config**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 2: Write the failing tests**

Create `tests/urlState.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/urlState`.

- [ ] **Step 4: Implement `src/lib/urlState.ts`**

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
npm run lint && npm run build
git add package.json package-lock.json vitest.config.ts src/lib/urlState.ts tests/urlState.test.ts
git commit -m "Add vitest and URL state serialize/parse module"
```

---

### Task 3: Wire URL state into the main page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `parseUrlState`, `serializeUrlState` from `@/lib/urlState` (Task 2)
- Produces: the address bar always reflects `fw`/`type`/`q`/`code`/`view` state; loading a deep link restores that state.

- [ ] **Step 1: Add imports and init-from-URL effect**

In `src/app/page.tsx`, change the react import to include `useEffect` and import the url module:

```tsx
import { useState, useMemo, useEffect } from "react";
import { parseUrlState, serializeUrlState } from "@/lib/urlState";
```

Add state + two effects inside `Home()`, directly after the existing `useState` declarations (initial render must stay deterministic for hydration, so URL reading happens in a mount effect, not in initializers):

```tsx
  const [urlReady, setUrlReady] = useState(false);

  // Initialize state from the URL once on mount (deep-link support).
  useEffect(() => {
    const s = parseUrlState(window.location.search);
    setSelectedFirmware(s.fw);
    setTypeFilter(s.type);
    setSearchQuery(s.q);
    if (s.code) {
      if (s.view === "compare") {
        setCompareCode(s.code);
      } else {
        const entry = getFirmwareData(s.fw).codes.find((c) => c.code === s.code);
        if (entry) setSelectedCode(entry);
      }
    }
    setUrlReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror state into the URL so the address bar is always a shareable link.
  useEffect(() => {
    if (!urlReady) return;
    const qs = serializeUrlState({
      fw: selectedFirmware,
      type: typeFilter,
      q: searchQuery,
      code: compareCode ?? selectedCode?.code ?? null,
      view: compareCode ? "compare" : null,
    });
    history.replaceState(null, "", qs === "" ? window.location.pathname : qs);
  }, [urlReady, selectedFirmware, typeFilter, searchQuery, selectedCode, compareCode]);
```

- [ ] **Step 2: Manual verification**

Run `npm run dev` and check each of these in a browser:

1. Click grblHAL tab, RT filter, open `$J` — URL becomes `/?fw=grblhal&type=RT&code=%24J` (order may vary).
2. Copy that URL into a new tab — same firmware/filter/modal restored.
3. Open a code, click "Compare across N firmwares" — URL gains `view=compare`; reload restores the compare view.
4. `/?fw=bogus&code=NOPE` — loads clean default view, no console errors.
5. Back on defaults (grbl, All, no search, no modal) — URL shows bare `/`.

- [ ] **Step 3: Commit**

```bash
npm run lint && npm run build
git add src/app/page.tsx
git commit -m "Mirror UI state to query params for deep linking"
```

---

### Task 4: Copy-link buttons + Phase 1 docs

**Files:**
- Create: `src/components/CopyLinkButton.tsx`
- Modify: `src/components/CodeDetail.tsx` (header, next to close button)
- Modify: `src/components/CompareView.tsx` (header, next to close button)
- Modify: `ARCHITECTURE.md` (URL state section)

**Interfaces:**
- Consumes: `window.location.href` (already kept current by Task 3)
- Produces: `<CopyLinkButton />` — self-contained client component, no props.

- [ ] **Step 1: Create `src/components/CopyLinkButton.tsx`**

```tsx
"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS); select-the-URL-bar fallback not worth code.
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy link to this view"
      className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
```

- [ ] **Step 2: Add to CodeDetail and CompareView headers**

In both files, import `CopyLinkButton` and wrap the existing close button so the two sit together. In `CodeDetail.tsx`, replace the close `<button ...>` block (the one containing the X svg) with:

```tsx
          <div className="flex items-center gap-2">
            <CopyLinkButton />
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
```

Make the identical change in `CompareView.tsx`.

- [ ] **Step 3: Update ARCHITECTURE.md**

In the "### Page (`src/app/page.tsx`)" section, after the state list, add:

```markdown
All of this state is mirrored into query params (`fw`, `type`, `q`, `code`, `view=compare`)
via `src/lib/urlState.ts` and `history.replaceState`, so the address bar is always a
shareable deep link. State is initialized from the URL in a mount effect (static export —
no `useSearchParams`). Invalid params fall back to defaults.
```

- [ ] **Step 4: Verify, commit, Docker check (end of Phase 1)**

```bash
npm run lint && npm run build && npm test
git add -A && git commit -m "Add copy-link buttons to detail and compare views"
docker build -t gcode-atlas . && docker run --rm -p 3000:80 gcode-atlas
```

Manually verify http://localhost:3000: new name in header/tab title, deep link + copy-link work on the static build. Stop the container.

---

# Phase 2 — `$$` Import + Readout

### Task 5: Vendor cnc_firmware_tools data + typed settings catalog

**Files:**
- Create: `src/lib/settings/vendor/settings.js` (verbatim copy + attribution header)
- Create: `src/lib/settings/vendor/settings.d.ts`
- Create: `scripts/vendor/cnc-alarm-codes.js` (verbatim copy of `tools/alarms/codes.js` + attribution header; used only by the Phase 5 merge script, never bundled)
- Create: `src/types/settings.ts`
- Create: `src/lib/settings/catalog.ts`
- Modify: `README.md` (attribution section)
- Test: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: vendored `lookupSetting(id, vendorFlavor)`, `knownIds()` from `vendor/settings.js`
- Produces (used by Tasks 7, 8, 10, 12):
  - `type SettingFlavor = "grbl" | "grblhal" | "fluidnc"` (values match `FirmwareId`)
  - `type SettingType = "bool" | "int" | "float" | "mask" | "enum" | "string"`
  - `interface SettingDef { id: number; flavors: SettingFlavor[]; name: string; description: string; type: SettingType; units?: string; range?: { min: number; max: number }; values?: Record<number, string>; axis?: string; sources: string[] }`
  - `lookupSettingDef(id: number, flavor: SettingFlavor): { def: SettingDef; candidates: SettingDef[] } | null`
  - `knownIds(): number[]`

- [ ] **Step 1: Vendor the upstream files**

```bash
git clone --depth 1 https://github.com/adammhaile/cnc_firmware_tools /tmp/cft-vendor
mkdir -p src/lib/settings/vendor scripts/vendor
cp /tmp/cft-vendor/tools/grbl-config/settings.js src/lib/settings/vendor/settings.js
cp /tmp/cft-vendor/tools/alarms/codes.js scripts/vendor/cnc-alarm-codes.js
git -C /tmp/cft-vendor rev-parse HEAD   # note the SHA for the headers below
rm -rf /tmp/cft-vendor
```

Prepend this header to BOTH copied files (fill in the SHA from above):

```js
// Vendored verbatim from https://github.com/adammhaile/cnc_firmware_tools
// (tools/grbl-config/settings.js | tools/alarms/codes.js), commit <SHA>.
// MIT License, Copyright (c) 2026 Adam Haile. See upstream repo for license text.
// Do not edit by hand — update by re-copying from upstream.
```

- [ ] **Step 2: Add the README attribution section**

Append to `README.md`:

```markdown
## Attribution

The `$$` settings catalog and alarm troubleshooting seed data are adapted from
[cnc_firmware_tools](https://github.com/adammhaile/cnc_firmware_tools) by Adam Haile
(MIT License). Vendored copies live in `src/lib/settings/vendor/` and `scripts/vendor/`.
```

- [ ] **Step 3: Create `src/lib/settings/vendor/settings.d.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/types/settings.ts`**

```ts
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
```

- [ ] **Step 5: Write the failing tests**

Create `tests/catalog.test.ts`:

```ts
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
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/settings/catalog`.

- [ ] **Step 7: Implement `src/lib/settings/catalog.ts`**

Before committing, verify the three source URLs below return HTTP 200 (`curl -sI <url>`); replace with the correct official page if any moved.

```ts
import { SettingDef, SettingFlavor } from "@/types/settings";
import {
  lookupSetting as vendorLookup,
  knownIds as vendorKnownIds,
  VendorSettingEntry,
} from "./vendor/settings";

const TO_VENDOR: Record<SettingFlavor, string> = {
  grbl: "grbl11",
  grblhal: "grblhal",
  fluidnc: "fluidnc",
};

const FROM_VENDOR: Record<string, SettingFlavor> = {
  grbl11: "grbl",
  grblhal: "grblhal",
  fluidnc: "fluidnc",
};

// Official documentation per flavor (project sourcing rule).
const FLAVOR_SOURCES: Record<SettingFlavor, string> = {
  grbl: "https://github.com/gnea/grbl/wiki/Grbl-v1.1-Configuration",
  grblhal: "https://github.com/grblHAL/core/wiki/Additional-or-extended-settings",
  fluidnc: "http://wiki.fluidnc.com/en/support/commands_and_settings",
};

function adapt(e: VendorSettingEntry): SettingDef {
  const flavors = e.flavors.map((f) => FROM_VENDOR[f]);
  return {
    id: e.id,
    flavors,
    name: e.name,
    description: e.description,
    type: e.type,
    units: e.units,
    range: e.range,
    values: e.values,
    axis: e.axis,
    sources: [...new Set(flavors.map((f) => FLAVOR_SOURCES[f]))],
  };
}

export function lookupSettingDef(
  id: number,
  flavor: SettingFlavor
): { def: SettingDef; candidates: SettingDef[] } | null {
  const r = vendorLookup(id, TO_VENDOR[flavor]);
  if (!r) return null;
  return { def: adapt(r.entry), candidates: r.candidates.map(adapt) };
}

export function knownIds(): number[] {
  return vendorKnownIds();
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
npm run lint && npm run build
git add -A && git commit -m "Vendor cnc_firmware_tools settings/alarm data (MIT) with typed catalog adapter"
```

---

### Task 6: `$$` dump parser (TDD)

**Files:**
- Create: `src/lib/settings/parse.ts`
- Test: `tests/parse.test.ts`

**Interfaces:**
- Consumes: `SettingFlavor` from `@/types/settings`
- Produces (used by Tasks 7–12):
  - `interface ParsedSetting { id: number; raw: string; lineNumber: number; duplicate: boolean }`
  - `parseDollarConfig(text: string): ParsedSetting[]`
  - `asNumber(raw: string): number | null`
  - `detectFlavor(parsed: ParsedSetting[]): SettingFlavor` — returns `"grbl"` or `"grblhal"` (FluidNC is indistinguishable over `$$`, never auto-selected)

This is a TypeScript port of the vendored upstream `parser.js` (same tolerant behavior, our flavor ids).

- [ ] **Step 1: Write the failing tests**

Create `tests/parse.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/settings/parse`.

- [ ] **Step 3: Implement `src/lib/settings/parse.ts`**

```ts
import { SettingFlavor } from "@/types/settings";

export interface ParsedSetting {
  id: number;
  raw: string;
  lineNumber: number;
  duplicate: boolean;
}

const LINE_RE = /^\s*\$(\d+)\s*=\s*([^\r\n]+?)\s*$/;
const TRAILING_COMMENT_RE = /\s*\([^)]*\)\s*$/;

// Tolerant parser for `$$` output. Anything that isn't `$<number>=<value>`
// (ok lines, status reports, [MSG:...], blanks) is ignored, never an error.
export function parseDollarConfig(text: string): ParsedSetting[] {
  const out: ParsedSetting[] = [];
  const seen = new Set<number>();
  String(text ?? "").split(/\r?\n/).forEach((line, i) => {
    const m = line.match(LINE_RE);
    if (!m) return;
    const id = Number(m[1]);
    const raw = m[2].replace(TRAILING_COMMENT_RE, "").trim();
    out.push({ id, raw, lineNumber: i + 1, duplicate: seen.has(id) });
    seen.add(id);
  });
  return out;
}

export function asNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// Setting ids that only exist in grblHAL (upstream cnc_firmware_tools heuristic).
const HAL_EXCLUSIVE = [
  7, 8, 9, 14, 15, 16, 17, 18, 19, 28, 29, 33, 34, 35, 36, 37, 39, 40, 43, 44,
  45, 46, 47, 48, 62, 63, 64, 65, 70, 73, 74, 75, 76, 77, 78, 341, 342, 343,
  344, 345, 346, 376, 384, 398, 481,
];

export function detectFlavor(parsed: ParsedSetting[]): SettingFlavor {
  const ids = new Set(parsed.map((p) => p.id));
  for (const id of HAL_EXCLUSIVE) if (ids.has(id)) return "grblhal";
  const s22 = parsed.find((p) => p.id === 22);
  if (s22 && (asNumber(s22.raw) ?? 0) > 1) return "grblhal";
  return "grbl";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run build
git add src/lib/settings/parse.ts tests/parse.test.ts
git commit -m "Add tolerant \$\$ dump parser with flavor auto-detect"
```

---

### Task 7: Value decoder (TDD)

**Files:**
- Create: `src/lib/settings/decode.ts`
- Test: `tests/decode.test.ts`

**Interfaces:**
- Consumes: `SettingDef` (Task 5), `asNumber` (Task 6)
- Produces (used by Tasks 8, 10, 12):

```ts
export type DecodedValue =
  | { kind: "bool"; on: boolean; display: string }
  | { kind: "mask"; bits: { bit: number; label: string; set: boolean }[]; unknownBits: number; display: string }
  | { kind: "enum"; label: string | null; display: string }
  | { kind: "number"; value: number; outOfRange: boolean; display: string }
  | { kind: "string"; display: string }
  | { kind: "raw"; display: string };

export function decodeValue(def: SettingDef, raw: string): DecodedValue;
```

- [ ] **Step 1: Write the failing tests**

Create `tests/decode.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/settings/decode`.

- [ ] **Step 3: Implement `src/lib/settings/decode.ts`**

```ts
import { SettingDef } from "@/types/settings";
import { asNumber } from "./parse";

export type DecodedValue =
  | { kind: "bool"; on: boolean; display: string }
  | { kind: "mask"; bits: { bit: number; label: string; set: boolean }[]; unknownBits: number; display: string }
  | { kind: "enum"; label: string | null; display: string }
  | { kind: "number"; value: number; outOfRange: boolean; display: string }
  | { kind: "string"; display: string }
  | { kind: "raw"; display: string };

export function decodeValue(def: SettingDef, raw: string): DecodedValue {
  if (def.type === "string") return { kind: "string", display: raw };

  const n = asNumber(raw);
  if (n === null) return { kind: "raw", display: raw };

  switch (def.type) {
    case "bool":
      return { kind: "bool", on: n !== 0, display: n !== 0 ? "On" : "Off" };

    case "mask": {
      const bits = Object.entries(def.values ?? {}).map(([bit, label]) => ({
        bit: Number(bit),
        label,
        set: (n & (1 << Number(bit))) !== 0,
      }));
      const knownMask = bits.reduce((m, b) => m | (1 << b.bit), 0);
      const unknownBits = (n & ~knownMask) >>> 0;
      const setLabels = bits.filter((b) => b.set).map((b) => b.label);
      const display = setLabels.length > 0 ? setLabels.join(", ") : "None";
      return { kind: "mask", bits, unknownBits, display };
    }

    case "enum": {
      const label = def.values?.[n] ?? null;
      return { kind: "enum", label, display: label ?? `Unknown value (${raw})` };
    }

    case "int":
    case "float": {
      const outOfRange =
        def.range !== undefined && (n < def.range.min || n > def.range.max);
      const display = def.units ? `${raw} ${def.units}` : raw;
      return { kind: "number", value: n, outOfRange, display };
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run build
git add src/lib/settings/decode.ts tests/decode.test.ts
git commit -m "Add typed setting value decoder (mask bits, enums, ranges)"
```

---

### Task 8: `/config` page with readout UI

**Files:**
- Create: `src/app/config/page.tsx`
- Create: `src/components/config/SettingsTable.tsx`
- Modify: `src/app/page.tsx` (header nav link)
- Modify: `ARCHITECTURE.md`

**Interfaces:**
- Consumes: `parseDollarConfig`, `detectFlavor` (Task 6), `lookupSettingDef` (Task 5), `decodeValue` (Task 7), `getFirmwareData` from `@/lib/data`
- Produces (extended by Task 12):
  - `SettingsTable({ parsed, flavor }: { parsed: ParsedSetting[]; flavor: SettingFlavor })` — renders the decoded readout table.

Spec note: the catalog has no category metadata, so rows are ordered by setting id in a single table (unknown settings inline with a badge) rather than invented topic groups — simplest faithful rendering.

- [ ] **Step 1: Create `src/components/config/SettingsTable.tsx`**

```tsx
"use client";

import { SettingFlavor } from "@/types/settings";
import { ParsedSetting } from "@/lib/settings/parse";
import { lookupSettingDef } from "@/lib/settings/catalog";
import { decodeValue } from "@/lib/settings/decode";
import { getFirmwareData } from "@/lib/data";

interface SettingsTableProps {
  parsed: ParsedSetting[];
  flavor: SettingFlavor;
}

export function SettingsTable({ parsed, flavor }: SettingsTableProps) {
  const wikiCodes = new Set(getFirmwareData(flavor).codes.map((c) => c.code));
  const rows = [...parsed].sort((a, b) => a.id - b.id);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
          <th className="py-2 pr-3">Setting</th>
          <th className="py-2 pr-3">Name</th>
          <th className="py-2 pr-3">Value</th>
          <th className="py-2">Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const found = lookupSettingDef(p.id, flavor);
          const decoded = found ? decodeValue(found.def, p.raw) : null;
          const wikiCode = `$${p.id}`;
          const hasWiki = wikiCodes.has(wikiCode);

          return (
            <tr key={`${p.id}-${p.lineNumber}`} className="border-b border-gray-800/50 align-top">
              <td className="py-2 pr-3 font-mono text-emerald-400 whitespace-nowrap">
                {hasWiki ? (
                  <a href={`/?fw=${flavor}&code=${encodeURIComponent(wikiCode)}`}
                     className="underline hover:text-emerald-300">
                    ${p.id}
                  </a>
                ) : (
                  <>${p.id}</>
                )}
                {p.duplicate && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">dup</span>
                )}
              </td>
              <td className="py-2 pr-3 text-gray-300">
                {found ? found.def.name : (
                  <span className="text-gray-500">
                    Unknown setting
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-500 border border-gray-700">unknown</span>
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 font-mono text-gray-200 whitespace-nowrap">{p.raw}</td>
              <td className="py-2 text-gray-400">
                {!decoded && <span className="text-gray-600">—</span>}
                {decoded?.kind === "mask" && (
                  <div className="flex flex-wrap gap-1">
                    {decoded.bits.filter((b) => b.set).map((b) => (
                      <span key={b.bit} className="px-1.5 py-0.5 text-xs rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
                        {b.label}
                      </span>
                    ))}
                    {decoded.bits.every((b) => !b.set) && decoded.unknownBits === 0 && <span>None</span>}
                    {decoded.unknownBits !== 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">
                        +unknown bits ({decoded.unknownBits})
                      </span>
                    )}
                  </div>
                )}
                {decoded?.kind === "number" && (
                  <span>
                    {decoded.display}
                    {decoded.outOfRange && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">out of range</span>
                    )}
                  </span>
                )}
                {decoded && decoded.kind !== "mask" && decoded.kind !== "number" && (
                  <span>{decoded.display}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Create `src/app/config/page.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { SettingFlavor } from "@/types/settings";
import { parseDollarConfig, detectFlavor } from "@/lib/settings/parse";
import { SettingsTable } from "@/components/config/SettingsTable";

const FLAVOR_LABELS: Record<SettingFlavor, string> = {
  grbl: "grbl 1.1",
  grblhal: "grblHAL",
  fluidnc: "FluidNC",
};

export default function ConfigPage() {
  const [text, setText] = useState("");
  const [flavorOverride, setFlavorOverride] = useState<SettingFlavor | "auto">("auto");

  const parsed = useMemo(() => parseDollarConfig(text), [text]);
  const detected = useMemo(() => detectFlavor(parsed), [parsed]);
  const flavor = flavorOverride === "auto" ? detected : flavorOverride;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-emerald-400">GCode</span> Atlas
            <span className="ml-3 text-sm font-normal text-gray-400">$$ Config Tools</span>
          </h1>
          <a href="/" className="text-sm text-emerald-500 hover:text-emerald-400 underline">
            ← Code reference
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="dump" className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Paste a $$ settings dump
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Firmware:</span>
              <select
                value={flavorOverride}
                onChange={(e) => setFlavorOverride(e.target.value as SettingFlavor | "auto")}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-200"
              >
                <option value="auto">Auto ({FLAVOR_LABELS[detected]})</option>
                {(Object.keys(FLAVOR_LABELS) as SettingFlavor[]).map((f) => (
                  <option key={f} value={f}>{FLAVOR_LABELS[f]}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            id="dump"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"$0=10\n$1=25\n$23=5\n..."}
            rows={8}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Everything except $N=value lines (ok, status reports, messages) is ignored. Nothing leaves your browser.
            </p>
            <label className="text-xs text-emerald-500 hover:text-emerald-400 underline cursor-pointer">
              Load from file
              <input
                type="file"
                accept=".txt,.nc,.gcode,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setText(await f.text());
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </section>

        {parsed.length > 0 && (
          <section>
            <div className="mb-3 text-sm text-gray-500">
              {parsed.length} setting{parsed.length !== 1 ? "s" : ""} · decoded as {FLAVOR_LABELS[flavor]}
            </div>
            <SettingsTable parsed={parsed} flavor={flavor} />
          </section>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add the nav link on the main page**

In `src/app/page.tsx`, inside the header's first flex row (next to `<FirmwareSelector ... />`), wrap the selector and add the link:

```tsx
            <div className="flex items-center gap-4">
              <FirmwareSelector
                firmwareList={firmwareList}
                selected={selectedFirmware}
                onSelect={(id) => {
                  setSelectedFirmware(id);
                  setSelectedCode(null);
                  setCompareCode(null);
                  setTypeFilter("all");
                }}
              />
              <a href="/config" className="text-sm text-emerald-500 hover:text-emerald-400 underline whitespace-nowrap">
                $$ Config Tools
              </a>
            </div>
```

- [ ] **Step 4: Manual verification**

`npm run dev`, open `/config`:

1. Paste a grbl dump (use the `$$` example values from `data/grbl.json` entries, e.g. `$0=10`, `$23=5`, `$130=200.000`) — table shows names, decoded chips for `$23` ("X homes positive", "Z homes positive").
2. Add `$341=0` — auto-detect flips to grblHAL.
3. Add `$999=42` — row renders with "unknown" badge, nothing crashes.
4. Click a `$N` link — lands on the reference page with that setting's detail open.

- [ ] **Step 5: Update ARCHITECTURE.md, commit, Docker check (end of Phase 2)**

Add to ARCHITECTURE.md after the UI Components section:

```markdown
## $$ Config Tools (`/config`)

Client-only page for grbl-family `$$` dumps. `src/lib/settings/`:
- `vendor/settings.js` — settings catalog vendored verbatim from Adam Haile's
  MIT-licensed cnc_firmware_tools (typed via `vendor/settings.d.ts`).
- `catalog.ts` — typed adapter (`lookupSettingDef`), maps vendor flavor ids to
  `FirmwareId` values and attaches official-doc source URLs.
- `parse.ts` — tolerant `$$` parser + flavor auto-detect.
- `decode.ts` — decodes raw values per setting type (mask bits, enums, ranges).
Everything runs in the browser; no data is uploaded.
```

```bash
npm run lint && npm run build && npm test
git add -A && git commit -m "Add /config page: \$\$ dump import with decoded readout"
docker build -t gcode-atlas . && docker run --rm -p 3000:80 gcode-atlas
```

Verify `/config` works on the static build. Stop the container.

---

# Phase 3 — `$$` Config Diff

### Task 9: Diff engine (TDD)

**Files:**
- Create: `src/lib/settings/diff.ts`
- Test: `tests/diff.test.ts`

**Interfaces:**
- Consumes: `ParsedSetting`, `asNumber` (Task 6), `SettingDef` (Task 5)
- Produces (used by Task 10):
  - `type DiffStatus = "same" | "changed" | "onlyA" | "onlyB"`
  - `interface DiffRow { id: number; a: string | null; b: string | null; status: DiffStatus }`
  - `diffConfigs(a: ParsedSetting[], b: ParsedSetting[]): DiffRow[]` — sorted by id; duplicate ids resolved last-wins; numeric values compared numerically (`200` == `200.000`)
  - `maskBitChanges(def: SettingDef, aRaw: string, bRaw: string): { label: string; from: boolean; to: boolean }[]` — only the bits that differ

- [ ] **Step 1: Write the failing tests**

Create `tests/diff.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/settings/diff`.

- [ ] **Step 3: Implement `src/lib/settings/diff.ts`**

```ts
import { SettingDef } from "@/types/settings";
import { ParsedSetting, asNumber } from "./parse";

export type DiffStatus = "same" | "changed" | "onlyA" | "onlyB";

export interface DiffRow {
  id: number;
  a: string | null;
  b: string | null;
  status: DiffStatus;
}

function toMap(parsed: ParsedSetting[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const p of parsed) m.set(p.id, p.raw); // last value wins
  return m;
}

function valuesEqual(a: string, b: string): boolean {
  const na = asNumber(a);
  const nb = asNumber(b);
  if (na !== null && nb !== null) return na === nb;
  return a === b;
}

export function diffConfigs(a: ParsedSetting[], b: ParsedSetting[]): DiffRow[] {
  const ma = toMap(a);
  const mb = toMap(b);
  const ids = [...new Set([...ma.keys(), ...mb.keys()])].sort((x, y) => x - y);
  return ids.map((id) => {
    const va = ma.get(id) ?? null;
    const vb = mb.get(id) ?? null;
    let status: DiffStatus;
    if (va === null) status = "onlyB";
    else if (vb === null) status = "onlyA";
    else status = valuesEqual(va, vb) ? "same" : "changed";
    return { id, a: va, b: vb, status };
  });
}

export function maskBitChanges(
  def: SettingDef,
  aRaw: string,
  bRaw: string
): { label: string; from: boolean; to: boolean }[] {
  const na = asNumber(aRaw);
  const nb = asNumber(bRaw);
  if (na === null || nb === null) return [];
  const out: { label: string; from: boolean; to: boolean }[] = [];
  for (const [bitStr, label] of Object.entries(def.values ?? {})) {
    const bit = 1 << Number(bitStr);
    const from = (na & bit) !== 0;
    const to = (nb & bit) !== 0;
    if (from !== to) out.push({ label, from, to });
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run build
git add src/lib/settings/diff.ts tests/diff.test.ts
git commit -m "Add config diff engine with per-bit mask change detection"
```

---

### Task 10: Diff UI on `/config`

**Files:**
- Create: `src/components/config/DiffTable.tsx`
- Modify: `src/app/config/page.tsx` (mode tabs + second textarea)

**Interfaces:**
- Consumes: `diffConfigs`, `maskBitChanges` (Task 9), `lookupSettingDef` (Task 5)
- Produces: `DiffTable({ a, b, flavor })` where `a`/`b` are `ParsedSetting[]`.

- [ ] **Step 1: Create `src/components/config/DiffTable.tsx`**

```tsx
"use client";

import { useState } from "react";
import { SettingFlavor } from "@/types/settings";
import { ParsedSetting } from "@/lib/settings/parse";
import { diffConfigs, maskBitChanges, DiffRow } from "@/lib/settings/diff";
import { lookupSettingDef } from "@/lib/settings/catalog";

const STATUS_STYLES: Record<DiffRow["status"], string> = {
  same: "",
  changed: "bg-amber-950/20",
  onlyA: "bg-red-950/20",
  onlyB: "bg-emerald-950/20",
};

const STATUS_LABELS: Record<DiffRow["status"], string | null> = {
  same: null,
  changed: "changed",
  onlyA: "only in A",
  onlyB: "only in B",
};

export function DiffTable({ a, b, flavor }: { a: ParsedSetting[]; b: ParsedSetting[]; flavor: SettingFlavor }) {
  const [diffOnly, setDiffOnly] = useState(true);
  const rows = diffConfigs(a, b).filter((r) => !diffOnly || r.status !== "same");

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
        Differences only
      </label>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <th className="py-2 pr-3">Setting</th>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Config A</th>
            <th className="py-2 pr-3">Config B</th>
            <th className="py-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const found = lookupSettingDef(r.id, flavor);
            const bitChanges =
              found && found.def.type === "mask" && r.status === "changed" && r.a && r.b
                ? maskBitChanges(found.def, r.a, r.b)
                : [];
            return (
              <tr key={r.id} className={`border-b border-gray-800/50 align-top ${STATUS_STYLES[r.status]}`}>
                <td className="py-2 pr-3 font-mono text-emerald-400">${r.id}</td>
                <td className="py-2 pr-3 text-gray-300">{found?.def.name ?? <span className="text-gray-500">Unknown</span>}</td>
                <td className="py-2 pr-3 font-mono text-gray-200">{r.a ?? <span className="text-gray-600">—</span>}</td>
                <td className="py-2 pr-3 font-mono text-gray-200">{r.b ?? <span className="text-gray-600">—</span>}</td>
                <td className="py-2 text-xs">
                  {STATUS_LABELS[r.status] && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                      {STATUS_LABELS[r.status]}
                    </span>
                  )}
                  {bitChanges.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {bitChanges.map((c) => (
                        <div key={c.label} className={c.to ? "text-emerald-400" : "text-red-400"}>
                          {c.to ? "+" : "−"} {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-sm text-gray-500">No differences.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add mode tabs and a second textarea to `src/app/config/page.tsx`**

Add state and derived values:

```tsx
  const [mode, setMode] = useState<"analyze" | "compare">("analyze");
  const [textB, setTextB] = useState("");
  const parsedB = useMemo(() => parseDollarConfig(textB), [textB]);
```

Add tabs under the header (top of `<main>`):

```tsx
        <div className="flex gap-1">
          {(["analyze", "compare"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                mode === m ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              {m === "analyze" ? "Analyze" : "Compare two configs"}
            </button>
          ))}
        </div>
```

When `mode === "compare"`, render a second textarea (label "Config B", state `textB`, same styling — relabel the first "Config A") side by side in a `grid grid-cols-1 md:grid-cols-2 gap-4`, and replace `<SettingsTable ...>` with:

```tsx
        {mode === "compare" && parsed.length > 0 && parsedB.length > 0 && (
          <DiffTable a={parsed} b={parsedB} flavor={flavor} />
        )}
```

Flavor auto-detect in compare mode should consider both dumps:

```tsx
  const detected = useMemo(
    () => detectFlavor([...parsed, ...parsedB]),
    [parsed, parsedB]
  );
```

- [ ] **Step 3: Manual verification**

Paste two dumps differing in `$23` (5 vs 3), `$110`, and one setting present in only one dump. Verify: changed rows highlighted, `$23` shows "+ Y homes positive / − Z homes positive", differences-only toggle works, "only in A/B" rows tinted.

- [ ] **Step 4: Commit, Docker check (end of Phase 3)**

```bash
npm run lint && npm run build && npm test
git add -A && git commit -m "Add side-by-side \$\$ config diff with per-bit mask changes"
docker build -t gcode-atlas . && docker run --rm -p 3000:80 gcode-atlas
```

Verify compare mode on the static build; stop the container.

---

# Phase 4 — `$$` Config Editor

### Task 11: Edit helpers (TDD)

**Files:**
- Create: `src/lib/settings/edit.ts`
- Test: `tests/edit.test.ts`

**Interfaces:**
- Consumes: `SettingDef` (Task 5), `asNumber` (Task 6)
- Produces (used by Task 12):
  - `toggleMaskBit(raw: string, bit: number, on: boolean): string`
  - `validateValue(def: SettingDef, raw: string): string | null` — human-readable error, or null when valid
  - `serializeConfig(entries: { id: number; raw: string }[]): string` — `$N=V` lines sorted by id, trailing newline

- [ ] **Step 1: Write the failing tests**

Create `tests/edit.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/settings/edit`.

- [ ] **Step 3: Implement `src/lib/settings/edit.ts`**

```ts
import { SettingDef } from "@/types/settings";
import { asNumber } from "./parse";

export function toggleMaskBit(raw: string, bit: number, on: boolean): string {
  const n = asNumber(raw) ?? 0;
  const v = on ? n | (1 << bit) : n & ~(1 << bit);
  return String(v >>> 0);
}

export function validateValue(def: SettingDef, raw: string): string | null {
  if (def.type === "string") return null;
  const n = asNumber(raw);
  if (n === null) return "Must be a number";
  if (def.type === "int" || def.type === "bool" || def.type === "mask" || def.type === "enum") {
    if (!Number.isInteger(n)) return "Must be an integer";
  }
  if (def.range && (n < def.range.min || n > def.range.max)) {
    return `Must be between ${def.range.min} and ${def.range.max}`;
  }
  return null;
}

export function serializeConfig(entries: { id: number; raw: string }[]): string {
  return [...entries]
    .sort((a, b) => a.id - b.id)
    .map((e) => `$${e.id}=${e.raw}\n`)
    .join("");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run build
git add src/lib/settings/edit.ts tests/edit.test.ts
git commit -m "Add config edit helpers: bit toggling, validation, serialization"
```

---

### Task 12: Editor UI + export

**Files:**
- Modify: `src/components/config/SettingsTable.tsx` (editable controls)
- Modify: `src/app/config/page.tsx` (edits state, export buttons)

**Interfaces:**
- Consumes: `toggleMaskBit`, `validateValue`, `serializeConfig` (Task 11), `decodeValue` (Task 7)
- Produces: `SettingsTable` gains props `{ edits: Map<number, string>; onEdit: (id: number, raw: string) => void }`. Page owns `edits`; export produces a `$N=V` file.

- [ ] **Step 1: Add edits state and export handlers to `src/app/config/page.tsx`**

```tsx
  const [edits, setEdits] = useState<Map<number, string>>(new Map());

  function handleEdit(id: number, raw: string) {
    setEdits((prev) => {
      const next = new Map(prev);
      const original = parsed.filter((p) => p.id === id).at(-1)?.raw;
      if (raw === original) next.delete(id);
      else next.set(id, raw);
      return next;
    });
  }

  // Current value per id: edited value if present, else last imported value.
  function currentEntries(): { id: number; raw: string }[] {
    const byId = new Map<number, string>();
    for (const p of parsed) byId.set(p.id, p.raw);
    for (const [id, raw] of edits) byId.set(id, raw);
    return [...byId.entries()].map(([id, raw]) => ({ id, raw }));
  }

  function download(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
```

Clear edits whenever the imported text changes (stale edits must not survive a new import) — add `setEdits(new Map());` alongside `setText(...)` in BOTH places that set it: the textarea `onChange` and the "Load from file" input's `onChange`.

Render export controls above the table when `mode === "analyze" && parsed.length > 0`:

```tsx
            <div className="flex items-center gap-2 mb-3">
              {edits.size > 0 && (
                <span className="text-xs text-amber-400">{edits.size} setting{edits.size !== 1 ? "s" : ""} modified</span>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(serializeConfig(currentEntries()))}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700"
              >
                Copy full config
              </button>
              <button
                onClick={() => download(serializeConfig(currentEntries()), "config.txt")}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700"
              >
                Download full config
              </button>
              <button
                disabled={edits.size === 0}
                onClick={() =>
                  download(
                    serializeConfig([...edits.entries()].map(([id, raw]) => ({ id, raw }))),
                    "config-changes.txt"
                  )
                }
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 disabled:opacity-40"
              >
                Download changed only
              </button>
            </div>
```

Pass `edits={edits} onEdit={handleEdit}` to `<SettingsTable>`.

- [ ] **Step 2: Make `SettingsTable` rows editable**

Extend props:

```tsx
interface SettingsTableProps {
  parsed: ParsedSetting[];
  flavor: SettingFlavor;
  edits: Map<number, string>;
  onEdit: (id: number, raw: string) => void;
}
```

Per row, compute `const current = edits.get(p.id) ?? p.raw;` and `const modified = edits.has(p.id);` and decode `current` instead of `p.raw`. Replace the raw-value `<td>` content with a control chosen by `found?.def.type`:

```tsx
              <td className="py-2 pr-3 font-mono text-gray-200 whitespace-nowrap">
                {!found && <span>{p.raw}</span>}
                {found && found.def.type === "bool" && (
                  <button
                    role="switch"
                    aria-checked={decoded?.kind === "bool" && decoded.on}
                    onClick={() => onEdit(p.id, decoded?.kind === "bool" && decoded.on ? "0" : "1")}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      decoded?.kind === "bool" && decoded.on ? "bg-emerald-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        decoded?.kind === "bool" && decoded.on ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
                {found && found.def.type === "enum" && (
                  <select
                    value={current}
                    onChange={(e) => onEdit(p.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                  >
                    {Object.entries(found.def.values ?? {}).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                )}
                {found && (found.def.type === "int" || found.def.type === "float" || found.def.type === "string" || found.def.type === "mask") && (
                  <input
                    value={current}
                    onChange={(e) => onEdit(p.id, e.target.value)}
                    className={`w-24 bg-gray-800 border rounded px-2 py-1 text-sm font-mono ${
                      validateValue(found.def, current) ? "border-red-700" : "border-gray-700"
                    }`}
                  />
                )}
                {modified && (
                  <button
                    onClick={() => onEdit(p.id, p.raw)}
                    title={`Reset to imported value (${p.raw})`}
                    className="ml-2 text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    reset
                  </button>
                )}
              </td>
```

For **mask** rows, additionally render each bit as a toggle in the Meaning column (replacing the read-only chips): every labeled bit becomes a clickable chip that flips state via `onEdit(p.id, toggleMaskBit(current, b.bit, !b.set))`:

```tsx
                {decoded?.kind === "mask" && found && (
                  <div className="flex flex-wrap gap-1">
                    {decoded.bits.map((b) => (
                      <button
                        key={b.bit}
                        onClick={() => onEdit(p.id, toggleMaskBit(current, b.bit, !b.set))}
                        className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                          b.set
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                            : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                    {decoded.unknownBits !== 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400">
                        +unknown bits ({decoded.unknownBits})
                      </span>
                    )}
                  </div>
                )}
```

Show a validation error under the input when invalid:

```tsx
                {found && validateValue(found.def, current) && (
                  <div className="text-xs text-red-400 mt-1">{validateValue(found.def, current)}</div>
                )}
```

Add imports to SettingsTable: `toggleMaskBit`, `validateValue` from `@/lib/settings/edit`.

Note: `validateValue` errors block nothing — invalid values still export (the user may know better than our ranges); the red border + message is advisory.

- [ ] **Step 3: Manual verification**

1. Paste a grbl dump. Toggle `$23`'s "Y homes positive" chip — raw value updates (5 → 7), "modified" count appears, reset link restores.
2. Flip `$32` (laser mode bool) via the switch.
3. Type `abc` into `$110` — red border + "Must be a number"; value still exportable.
4. "Download changed only" → file contains exactly the edited `$N=V` lines.
5. "Copy full config" → paste somewhere; all settings present, edits applied, sorted by id.
6. Change the pasted dump — edits reset.

- [ ] **Step 4: Update ARCHITECTURE.md, commit, Docker check (end of Phase 4)**

Append to the "$$ Config Tools" section:

```markdown
- `diff.ts` — aligns two parsed configs by id; mask diffs decoded per bit.
- `edit.ts` — bit toggling, advisory validation, `$N=V` serialization.
The Analyze tab is also the editor: bools are switches, mask bits are toggle
chips, enums are dropdowns. Export copies/downloads the full or changed-only
config. Edits reset when new text is pasted.
```

```bash
npm run lint && npm run build && npm test
git add -A && git commit -m "Make \$\$ readout editable with mask bit toggles and config export"
docker build -t gcode-atlas . && docker run --rm -p 3000:80 gcode-atlas
```

Verify the editor on the static build; stop the container.

---

# Phase 5 — Alarm Troubleshooting

### Task 13: Troubleshooting data (schema + merge script)

**Files:**
- Modify: `src/types/gcode.ts` (add `troubleshooting` to `GCodeEntry`)
- Create: `scripts/merge-alarm-troubleshooting.mjs`
- Modify (generated): `data/grbl.json`, `data/grblhal.json`, `data/fluidnc.json`

**Interfaces:**
- Consumes: `scripts/vendor/cnc-alarm-codes.js` (Task 5) — `ALARMS: Record<number, { title, description, causes?, fixes?, flavors }>`
- Produces: `GCodeEntry.troubleshooting?: { causes: string[]; fixes: string[] }` populated on alarm entries (used by Task 14).

- [ ] **Step 1: Extend the type**

In `src/types/gcode.ts`, add to `GCodeEntry` after `modeNotes`:

```ts
  troubleshooting?: {
    causes: string[];
    fixes: string[];
  };
```

- [ ] **Step 2: Verify source URLs**

Confirm each of these resolves (HTTP 200); substitute the correct official page for any that 404 before using them in the script:

- grbl alarms: `https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv` and `https://github.com/gnea/grbl/wiki/Grbl-v1.1-Interface`
- grblHAL alarms: `https://github.com/grblHAL/core/blob/master/alarms.h`
- FluidNC: `http://wiki.fluidnc.com/en/support/commands_and_settings` (FluidNC reuses grbl numeric alarm codes; if the wiki has a dedicated alarms page, cite that instead)
- LightBurn: find the current grbl alarm/error troubleshooting page under `https://docs.lightburnsoftware.com` (Joe's team owns these docs — ask him if it isn't obvious) and add it to `LIGHTBURN_URL` in the script. If none exists, drop that citation rather than guessing.

- [ ] **Step 3: Create `scripts/merge-alarm-troubleshooting.mjs`**

```js
// One-time merge of alarm troubleshooting data (causes/fixes) from the vendored
// cnc_firmware_tools alarm catalog into the firmware data JSON files.
// Run: node scripts/merge-alarm-troubleshooting.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { ALARMS } from "./vendor/cnc-alarm-codes.js";

const GRBL_SOURCES = [
  "https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv",
  "https://github.com/gnea/grbl/wiki/Grbl-v1.1-Interface",
];
const GRBLHAL_SOURCES = ["https://github.com/grblHAL/core/blob/master/alarms.h"];
const FLUIDNC_SOURCES = ["http://wiki.fluidnc.com/en/support/commands_and_settings"];
const LIGHTBURN_URL = ""; // set after Step 2 verification; skipped when empty
const TOOL_CREDIT = "https://github.com/adammhaile/cnc_firmware_tools";

function load(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}
function save(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
function troubleshootingFor(alarm) {
  if (!alarm.causes && !alarm.fixes) return undefined;
  return { causes: alarm.causes ?? [], fixes: alarm.fixes ?? [] };
}
function mergeSources(entry, urls) {
  for (const u of [...urls, ...(LIGHTBURN_URL ? [LIGHTBURN_URL] : []), TOOL_CREDIT]) {
    if (!entry.sources.includes(u)) entry.sources.push(u);
  }
}
function newAlarmEntry(n, alarm, sources) {
  const e = {
    code: `ALARM:${n}`,
    type: "ALARM",
    name: `Alarm ${n}: ${alarm.title}`,
    description: alarm.description,
    parameters: [],
    examples: [],
    relatedCodes: [],
    crossReferences: [],
    modeNotes: [],
    sources: [],
  };
  const t = troubleshootingFor(alarm);
  if (t) e.troubleshooting = t;
  mergeSources(e, sources);
  return e;
}

// --- grbl: attach troubleshooting to existing ALARM:1..10 entries ---
const grbl = load("data/grbl.json");
let grblUpdated = 0;
for (const entry of grbl.codes) {
  const m = entry.code.match(/^ALARM:(\d+)$/);
  if (!m) continue;
  const alarm = ALARMS[Number(m[1])];
  if (!alarm || !alarm.flavors.includes("grbl11")) continue;
  const t = troubleshootingFor(alarm);
  if (t) {
    entry.troubleshooting = t;
    mergeSources(entry, GRBL_SOURCES);
    grblUpdated++;
  }
}
save("data/grbl.json", grbl);

// --- grblHAL: create ALARM:1..17 entries (it currently has none) ---
const grblhal = load("data/grblhal.json");
let halAdded = 0;
for (const [nStr, alarm] of Object.entries(ALARMS)) {
  const n = Number(nStr);
  if (!alarm.flavors.includes("grblhal")) continue;
  if (grblhal.codes.some((c) => c.code === `ALARM:${n}`)) continue;
  grblhal.codes.push(newAlarmEntry(n, alarm, GRBLHAL_SOURCES));
  halAdded++;
}
save("data/grblhal.json", grblhal);

// --- FluidNC: create entries for the shared numeric codes ---
const fluidnc = load("data/fluidnc.json");
let fncAdded = 0;
for (const [nStr, alarm] of Object.entries(ALARMS)) {
  const n = Number(nStr);
  if (!alarm.flavors.includes("fluidnc")) continue;
  if (fluidnc.codes.some((c) => c.code === `ALARM:${n}`)) continue;
  fluidnc.codes.push(newAlarmEntry(n, alarm, FLUIDNC_SOURCES));
  fncAdded++;
}
save("data/fluidnc.json", fluidnc);

console.log(`grbl: ${grblUpdated} alarms updated; grblHAL: ${halAdded} added; FluidNC: ${fncAdded} added`);
```

- [ ] **Step 4: Run the script and spot-check**

```bash
node scripts/merge-alarm-troubleshooting.mjs
```

Expected output: `grbl: ~8 alarms updated; grblHAL: 17 added; FluidNC: ~9 added` (exact counts depend on which upstream alarms carry causes/fixes and flavor tags — verify they're plausible, not zero).

Spot-check `data/grbl.json` ALARM:1 now has `troubleshooting.causes` ("Limit switch wired wrong...") and the new sources. Check `data/grblhal.json` has `ALARM:13` (Safety door). Fact-check 3 random entries against the official docs from Step 2 (accuracy rule) — fix any text that contradicts them.

- [ ] **Step 5: Verify build and commit**

```bash
npm run lint && npm run build && npm test
git add -A
git commit -m "Add structured alarm troubleshooting data for grbl, grblHAL, FluidNC"
```

---

### Task 14: Troubleshooting UI + final docs

**Files:**
- Modify: `src/components/CodeDetail.tsx` (causes/fixes sections)
- Modify: `ARCHITECTURE.md` (schema + phase notes)

**Interfaces:**
- Consumes: `GCodeEntry.troubleshooting` (Task 13)
- Produces: user-visible "Likely Causes" / "How to Fix" sections in the detail dialog.

- [ ] **Step 1: Render troubleshooting in `CodeDetail.tsx`**

Insert between the "Mode-specific notes" and "Cross-references" sections:

```tsx
          {/* Troubleshooting */}
          {entry.troubleshooting && entry.troubleshooting.causes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Likely Causes
              </h3>
              <ul className="space-y-1 list-disc list-inside">
                {entry.troubleshooting.causes.map((c, i) => (
                  <li key={i} className="text-sm text-gray-300">{c}</li>
                ))}
              </ul>
            </section>
          )}
          {entry.troubleshooting && entry.troubleshooting.fixes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                How to Fix
              </h3>
              <ol className="space-y-1 list-decimal list-inside">
                {entry.troubleshooting.fixes.map((f, i) => (
                  <li key={i} className="text-sm text-gray-300">{f}</li>
                ))}
              </ol>
            </section>
          )}
```

- [ ] **Step 2: Manual verification**

`npm run dev`: open grbl → Alarms → ALARM:1 — causes and numbered fixes render. Open grblHAL → Alarms filter now appears — ALARM:13 renders. Deep-link `/?fw=grblhal&code=ALARM%3A13` works.

- [ ] **Step 3: Final ARCHITECTURE.md update**

- In the schema tree, add `troubleshooting?: { causes, fixes }` under `GCodeEntry`.
- Note under Data Files: "Alarm entries carry structured troubleshooting (causes/fixes) adapted from cnc_firmware_tools (MIT) and official firmware docs; merged by `scripts/merge-alarm-troubleshooting.mjs`."

- [ ] **Step 4: Verify, commit, Docker check (end of Phase 5)**

```bash
npm run lint && npm run build && npm test
git add -A && git commit -m "Render alarm troubleshooting sections in code detail"
docker build -t gcode-atlas . && docker run --rm -p 3000:80 gcode-atlas
```

Full manual pass on the static build: rename visible, deep links, /config analyze + compare + edit + export, alarm troubleshooting. Stop the container.
