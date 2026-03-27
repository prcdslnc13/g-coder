# Phase 3 — Remaining Work

## Completed
- [x] Clickable navigation between related codes and cross-firmware references
- [x] Cross-firmware comparison mode (side-by-side view)
- [x] $ settings reference for grbl ($0-$132) and grblHAL (key extended settings)
- [x] Data Expansion (all 5 steps — see below)
- [x] Contextual filter buttons for RT, Errors, Alarms, Meta, NGC, O-codes
- [x] Comma-separated multi-term search
- [x] Fix code column overflow for long code names (META:, NGC:, etc.)

## Current State
- **6 firmwares**: grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, FluidNC
- **794 total entries** (up from 544)
- Branch: `expansion` (ahead of `main`)

## Remaining

### Visual Polish
- [ ] Review and refine against matrix.millmage.com interaction style
- [ ] Mobile responsiveness pass (header stacking, dialog sizing, touch targets)
- [ ] Keyboard navigation (arrow keys to move through code list, Enter to open)
- [ ] Add a "back" button or breadcrumb when navigating cross-firmware from the detail dialog

### Data Verification
- [ ] Expert review of all 794 entries for accuracy (especially cross-references and conflict warnings)
- [ ] Verify source URLs are still live and correct
- [ ] Check for missing codes in each firmware (compare against official docs)
- [ ] Validate grbl/grblHAL/FluidNC lineage notes — ensure "same as grbl" / "modified" / "new" labels are correct

### Feature Enhancements
- [ ] Search across all firmwares simultaneously (not just the selected one)
- [ ] URL-based routing (e.g., /grbl/G28 as shareable deep links)
- [ ] Bookmark/favorites for frequently referenced codes
- [ ] Print-friendly view for offline reference
- [ ] Dark/light theme toggle

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
- [x] Vercel configuration (vercel.json)
- [ ] Connect GitHub repo to Vercel project
- [ ] Set up preview deployments for PRs
- [ ] Custom domain (if needed)
