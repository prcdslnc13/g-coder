# Phase 3 — Remaining Work

## Completed
- [x] Clickable navigation between related codes and cross-firmware references
- [x] Cross-firmware comparison mode (side-by-side view)
- [x] $ settings reference for grbl ($0-$132) and grblHAL (key extended settings)
- [x] Data Expansion (all 5 steps — see below)
- [x] Contextual filter buttons for RT, Errors, Alarms, Meta, NGC, O-codes
- [x] Comma-separated multi-term search
- [x] Fix code column overflow for long code names (META:, NGC:, etc.)
- [x] Add missing G10 base entries for grbl, grblHAL, LinuxCNC (was only variants like G10 L2/L20)
- [x] Fix cross-firmware comparison matching to recognize variant codes (prefix fallback)
- [x] Add 11 missing FluidNC codes (G28.1, G30.1, G59.1-G59.3, G61, G80, G91.1, G92.1, M1, M68)
- [x] Add missing M9 (coolant off) to Smoothieware
- [x] Add missing M30 (delete SD file) to RepRapFirmware with CRITICAL cross-firmware conflict warnings

## Current State
- **6 firmwares**: grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, FluidNC
- **810 total entries** (grbl: 165, grblHAL: 245, LinuxCNC: 110, Smoothieware: 93, RepRapFirmware: 87, FluidNC: 110)
- Branch: `main`

## Remaining

### Visual Polish
- [ ] Review and refine against matrix.millmage.com interaction style
- [ ] Mobile responsiveness pass (header stacking, dialog sizing, touch targets)
- [ ] Keyboard navigation (arrow keys to move through code list, Enter to open)
- [ ] Add a "back" button or breadcrumb when navigating cross-firmware from the detail dialog

### Data Verification
- [ ] Expert review of all 810 entries for accuracy (especially cross-references and conflict warnings)
- [ ] Verify source URLs are still live and correct
- [x] Check for missing codes in each firmware (compare against official docs) — gap analysis complete, key missing codes added
- [x] Validate grbl/grblHAL/FluidNC lineage — confirmed grblHAL is full superset of grbl G/M codes; FluidNC gaps filled
- [ ] Validate grbl/grblHAL/FluidNC lineage notes — ensure "same as grbl" / "modified" / "new" labels are correct

### Feature Enhancements
- [ ] Search across all firmwares simultaneously (not just the selected one)
- [ ] URL-based routing (e.g., /grbl/G28 as shareable deep links)
- [ ] Bookmark/favorites for frequently referenced codes
- [ ] Print-friendly view for offline reference
- [ ] Dark/light theme toggle
- [ ] Export filtered results as JSON / CSV / plaintext for offline reference at the machine

### Code Quality / Refactors
- [x] **Schema type union fix** — widen `GCodeEntry.type` from `"G" | "M" | "$"` to cover `RT`, `ERR`, `ALARM`, `META`, `NGC`, `O`, `CMT`. Retype misfiled entries in all data files. Drop prefix-matching on `code` in `codeCategories`; filter by `type` directly. Extend `typeOrder` in the sort comparator.
- [x] **Memoize conflict/firmware-count lookup** — `CodeList.getConflictBadge` currently scans every other firmware on every render of every row. Precompute a conflict map once in `src/lib/data.ts` and expose a helper.
- [ ] URL state migration — move `selectedFirmware`, `searchQuery`, `typeFilter`, `selectedCode`, `compareCode` into URL params via `useSearchParams`. Unlocks deep links, bookmarks, back-button.
- [ ] Memoize `codeCategories` / `filterMatch` at module scope so firmware switches don't recreate the filter functions.

### New Command Types (data + type union additions)
- [ ] **Comment operators** (`type: "CMT"`) — `;`, `(...)`, `(MSG,...)`, `(PRINT,...)`, `(DEBUG,...)`, `(LOG,...)`, `(LOGOPEN,...)`, `(LOGCLOSE)`, `(LOGAPPEND,...)`, `(PROBEOPEN,...)`, `(PROBECLOSE)`. Per-firmware: grbl/grblHAL/FluidNC parse `;` and `()` as pass-through comments; LinuxCNC parses `MSG`/`PRINT`/`DEBUG`/`LOG`; RepRap has its own expression syntax in comments. High-value for revealing firmware differences. Sources: LinuxCNC G-code docs (comments chapter), grbl wiki, Duet gcode reference.
- [ ] **T-codes** — tool select (`T0`–`T99`). Universal. Pairs with `M6` for tool change.
- [ ] **F / S modal words** — feed rate and spindle speed. Firmware differences in scaling, laser mode, max values.
- [ ] **H / D offsets** — tool length comp (`H1`) and diameter comp (`D1`). LinuxCNC-flavored; partial grblHAL support.
- [ ] **Axis words** (`X Y Z A B C U V W I J K R`) — reference table for parameter usage rather than individual entries.
- [ ] **P / Q / E parameters** — `P` (dwell time, subroutine number), `Q` (probe/cycle param), `E` (extruder, RepRap-specific).

### Data Expansion (Complete)

**Step 1 — Add FluidNC as a firmware target**
- [x] Add `"fluidnc"` to the `FirmwareId` type union
- [x] Create `data/fluidnc.json` with all G-codes, M-codes, and $ commands (99 entries: 36 G, 20 M, 43 $)
- [x] Update `src/lib/data.ts` to import fluidnc
- [x] Add cross-references between FluidNC and existing firmwares
- [x] Sources: wiki.fluidnc.com (supported_gcodes, commands_and_settings, alarm_and_error_codes)

**Step 2 — Add grbl real-time commands & error/alarm codes**
- [x] Real-time commands: 22 entries (0x18, ?, !, ~, 0x84-0x85, 0x90-0x97, 0x99-0x9E, 0xA0-0xA1)
- [x] Error codes 1–38 (36 entries, codes 18-19 intentionally skipped per grbl source)
- [x] Alarm codes 1–10

**Step 3 — Add grblHAL extended data**
- [x] WiFi settings $70-$79 (10 entries), Network $300-$308 (9 entries), VFD $460-$479 (6 entries), plus $340, $345, $374, $375
- [x] Real-time commands: 30 entries including grblHAL extensions (0x19 stop, 0x80 alt status, 0x83 parser state, 0x87 complete report, 0x88 optional stop, 0x89 single step, 0x8A fan toggle, 0xA3 tool change ack)
- [x] Expression/flow control: 5 reference entries (if/elseif/else, while/do/repeat, sub/call/return, parameters/expressions, alarm/error from G-code)

**Step 4 — Add RepRapFirmware meta commands**
- [x] 10 entries: if/elif/else, while, break, continue, var, global, set, echo, abort, expressions/object model

**Step 5 — Add LinuxCNC O-codes**
- [x] 9 entries: sub/endsub, call, return, if/elseif/else/endif, while/endwhile, do/while, repeat/endrepeat, break, continue

### Deployment
- [x] Cloudflare Pages connected to GitHub repo (static export from `out/`)
- [x] Docker multi-stage build for local pre-deploy testing (nginx serves the same static output Pages does)
- [x] `.nvmrc` pins Node 22 so the CF Pages build and local builds use the same interpreter
- [ ] Custom domain (if needed) — CF Pages free tier supports unlimited custom domains with auto SSL; requires the domain's DNS on Cloudflare
- [ ] Branch-preview URL review — CF Pages auto-builds every branch by default; confirm whether to restrict previews to PR branches only
