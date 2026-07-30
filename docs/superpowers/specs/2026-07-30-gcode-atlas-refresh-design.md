# GCode Atlas — Project Refresh Design

**Date:** 2026-07-30
**Status:** Approved by Joe (design review 2026-07-30)

## Background

The project (currently "g-coder") is an interactive G-code/M-code wiki and troubleshooter
for CNC firmware systems (grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, FluidNC),
built as a support tool for agents working with LightBurn and MillMage. It is a fully static
Next.js 16 app (client-side, JSON data bundled at build time) deployed to Cloudflare Pages.

This refresh covers six requests:

1. Rename the project ("G-Coder" collides with many existing projects).
2. Direct linking to a firmware, filter, or specific code.
3. Import `$$` dumps from grbl-based controls with a decoded readout.
4. A `$$` config editor with intuitive UI for masks (gSender-style).
5. A `$$` config diff screen.
6. Troubleshooting steps on alarm readouts.

## Decisions (settled 2026-07-30)

| Decision | Choice |
|---|---|
| New name | **GCode Atlas** (verified no existing project/site uses it) |
| Rename scope | In-app branding + docs only. GitHub repo + Cloudflare Pages project rename deferred to a manual step later. |
| Direct-link mechanism | Query params on the existing single page (not static per-code pages). |
| Build order | 1) rename + linking → 2) $$ import/readout → 3) $$ diff → 4) $$ editor → 5) alarm troubleshooting |
| Seed data | Adapt Adam Haile's MIT-licensed [cnc_firmware_tools](https://github.com/adammhaile/cnc_firmware_tools) (settings catalog, parser behavior, alarm causes/fixes) with attribution, adding official-doc citations per the project's sourcing rule. |

Rationale for query params over per-code static pages: codes like `$H`, `RT:?`, `ERR:1`,
`$SD/Run` need no slug scheme; the URL captures *full* app state (firmware + filter +
search + open modal + compare view); minimal code. SEO-oriented per-code pages can be
added later without conflicting with this scheme.

## Phase 1 — Rename + Direct Linking

### Rename (branding only)

- `src/app/layout.tsx`: `<title>`/metadata → "GCode Atlas".
- `src/app/page.tsx`: header wordmark → GCode Atlas.
- `package.json` (`name`, `description`), `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`.
- Repo URL references stay as-is until the repo is renamed manually.

### URL state

All UI state mirrors into query params on `/`:

| Param | Meaning | Example |
|---|---|---|
| `fw` | firmware tab | `?fw=grblhal` |
| `type` | type filter | `?fw=grbl&type=RT` |
| `q` | search text | `?fw=grbl&q=$20,$21` |
| `code` | open code-detail modal | `?fw=grbl&code=G28` |
| `view` | `compare` for the cross-firmware compare view | `?code=G28&view=compare` |

Behavior:

- On mount, read `window.location.search` once and initialize state
  (avoids `useSearchParams`/Suspense complications under static export).
- On any state change, `history.replaceState` rewrites the URL silently —
  the address bar is always a shareable link. No router navigation.
- A copy-link button on CodeDetail and CompareView.
- Serialization/parsing lives in a pure module (`src/lib/urlState.ts`), unit-tested.
- Invalid or stale params (unknown firmware, code missing from that firmware)
  fall back to defaults silently — old links never crash the app.

## Phase 2 — `$$` Import + Readout

A new statically-exported route **`/config`** ("$$ Config Tools" in the header nav),
keeping `page.tsx` focused on the reference wiki. Phases 2–4 all build on this page.

### Settings catalog (`data/settings/`)

New typed catalog adapted from cnc_firmware_tools `settings.js`
(MIT; attribution in README and file headers). One entry per setting per flavor:

```
SettingDef {
  id: number                 // the $N number
  flavors: ("grbl" | "grblhal" | "fluidnc")[]
  name: string
  description: string
  type: "bool" | "int" | "float" | "mask" | "enum" | "string"
  units?: string             // "mm", "mm/min", "µs", ...
  range?: { min, max }
  values?: Record<number, string>  // enum: value→label; mask: BIT INDEX→label
  axisBase?: boolean         // $100-style groups: X=+0, Y=+1, Z=+2, A=+3, ...
  sources: string[]          // official docs URLs (project sourcing rule)
}
```

Coverage: grbl 1.1 complete; grblHAL common settings; FluidNC shares grbl numerics
(most FluidNC config is YAML and never appears in `$$` — unknowns are expected there).
Catalog entries cross-link to the existing `$N` wiki entries where present.

### Parser (`src/lib/settings/parse.ts`)

Pure, unit-tested function. Tolerates `ok` lines, blank lines, CRLF, `[MSG:...]` noise,
leading prompts. Extracts `$N=V` pairs; reports duplicates and unparseable lines as
warnings instead of failing. Flavor auto-detect *hint* (any setting id > 132 → suggest
grblHAL) with a manual flavor selector as the authority.

### Readout UI

Paste box + file upload → grouped, decoded table. Per row: `$N`, name, raw value,
decoded meaning:

- **mask** → set bits rendered as labeled chips (e.g. `$23=5` → "X homes positive",
  "Z homes positive")
- **bool** → On/Off; **enum** → label; **numeric** → value + units, out-of-range warning
- unknown settings shown raw with an "unknown" badge — displayed, never dropped
- each row links to the full wiki entry for that setting

## Phase 3 — `$$` Config Diff

Same `/config` page: a second paste box switches to a side-by-side table aligned by
setting id. Changed rows highlighted. Mask diffs are decoded per bit ("B adds
'Y direction' invert"), not just raw numbers. "Differences only" filter. Settings
present in only one dump are marked added/missing.

## Phase 4 — `$$` Config Editor

The readout table becomes editable (gSender-style):

- **bool** → toggle switch
- **mask** → one toggle per labeled bit; raw value recomputes live
- **enum** → dropdown; **numeric** → validated number input with units
- per-row "modified" indicator and reset-to-imported
- Export: copy to clipboard or download `.txt` of `$N=V` lines — full config or
  changed-settings-only. Entirely client-side; nothing persisted.

## Phase 5 — Alarm Troubleshooting

Extend `GCodeEntry` with an optional structured field:

```
troubleshooting?: {
  causes: string[]
  fixes: string[]
}
```

Content work:

- grbl `ALARM:1`–`ALARM:10`: causes/fixes adapted from cnc_firmware_tools + LightBurn docs.
- Add missing grblHAL alarm entries (extension alarms 10–17).
- FluidNC alarm coverage via the shared numeric codes.
- Sources cited per entry: grbl wiki, grblHAL docs, LightBurn documentation;
  tool credit to cnc_firmware_tools.

`CodeDetail` renders "Likely causes" and "How to fix" sections when present.

## Cross-cutting

- **Testing:** add vitest (devDependency, `npm test`) for pure logic only —
  URL state serialize/parse, `$$` parser, mask encode/decode, diff alignment.
  UI remains manually verified.
- **Error handling philosophy:** pasted garbage never crashes; unknown data is
  displayed with a badge, not hidden.
- **Shipping:** each phase builds and ships independently; rebuild Docker and verify
  the live static output after each phase (standing project practice).
- **Docs:** ARCHITECTURE.md updated per phase.

## Out of Scope

- GitHub repo / Cloudflare Pages project rename (manual, later).
- Custom domain purchase.
- Pre-rendered per-code pages for SEO (possible later; does not conflict with
  the query-param scheme).
- FluidNC YAML config editing (only its `$$` numeric compat output is supported).
- Persisting imported configs (localStorage or accounts).
