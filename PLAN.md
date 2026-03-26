# Phase 3 — Remaining Work

## Completed
- [x] Clickable navigation between related codes and cross-firmware references
- [x] Cross-firmware comparison mode (side-by-side view)
- [x] $ settings reference for grbl ($0-$132) and grblHAL (key extended settings)

## Remaining

### Visual Polish
- [ ] Review and refine against matrix.millmage.com interaction style
- [ ] Mobile responsiveness pass (header stacking, dialog sizing, touch targets)
- [ ] Keyboard navigation (arrow keys to move through code list, Enter to open)
- [ ] Add a "back" button or breadcrumb when navigating cross-firmware from the detail dialog

### Data Verification
- [ ] Expert review of all 544 entries for accuracy (especially cross-references and conflict warnings)
- [ ] Verify source URLs are still live and correct
- [ ] Check for missing codes in each firmware (compare against official docs)
- [ ] Validate grbl/grblHAL lineage notes — ensure "same as grbl" / "modified" / "new" labels are correct

### Feature Enhancements
- [ ] Search across all firmwares simultaneously (not just the selected one)
- [ ] URL-based routing (e.g., /grbl/G28 as shareable deep links)
- [ ] Bookmark/favorites for frequently referenced codes
- [ ] Print-friendly view for offline reference
- [ ] Dark/light theme toggle

### Data Expansion
- [ ] Add remaining grblHAL $ settings ($70-$79 WiFi, $300-$328 network, $200+ axis-specific, $460-$479 VFD)
- [ ] Add grbl real-time commands (0x18 soft reset, ? status, ~ cycle start, ! feed hold, override characters)
- [ ] Add grblHAL real-time commands (extended set: 0x87 complete report, 0x88 optional stop toggle, etc.)
- [ ] Add grbl error codes (1-38) and alarm codes (1-10) as reference entries
- [ ] Add grblHAL expression/flow control reference (parameters, operators, functions, if/while/sub)
- [ ] Add RepRapFirmware meta commands (if/elif/else/while/var/set) reference
- [ ] Add LinuxCNC O-codes (subroutines, loops, conditionals) reference

### Deployment
- [x] Vercel configuration (vercel.json)
- [ ] Connect GitHub repo to Vercel project
- [ ] Set up preview deployments for PRs
- [ ] Custom domain (if needed)
