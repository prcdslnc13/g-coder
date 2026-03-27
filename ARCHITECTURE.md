# Architecture

## Overview

g-coder is a static, client-side web application that serves as an interactive reference for G-code, M-code, and $ commands across multiple CNC firmware systems. All data is stored in JSON files and bundled at build time — there is no backend or database.

## Tech Stack

- **Next.js 16** (App Router) — framework and build system
- **TypeScript** — type safety
- **Tailwind CSS v4** — styling
- **Vercel** — production hosting
- **Docker** — local testing (standalone output mode)

## Data Layer

### Schema (`src/types/gcode.ts`)

Each firmware has a JSON file in `data/` with this structure:

```
FirmwareData
├── firmware: FirmwareInfo (id, name, description, version, sourceUrl)
└── codes: GCodeEntry[]
    ├── code: string (e.g., "G0", "M3", "$H")
    ├── type: "G" | "M" | "$"
    ├── name, description
    ├── parameters: CodeParameter[]
    ├── examples: CodeExample[]
    ├── relatedCodes: string[]
    ├── crossReferences: CrossReference[] (links to same code in other firmwares, with conflict notes)
    ├── modeNotes: ModeNote[] (laser mode, CNC mode, etc.)
    ├── sources: string[] (URLs to official documentation)
    ├── notes?: string
    └── versionNotes?: string
```

### Data Files (`data/`)

One JSON file per firmware:
- `grbl.json` — grbl 1.1 (includes $ commands like $H, $J)
- `grblhal.json` — grblHAL (includes grbl extensions: tool change M6, multi-axis, etc.)
- `linuxcnc.json` — LinuxCNC (NIST reference implementation)
- `smoothieware.json` — Smoothieware (3D printing origin, module-based)
- `reprapfirmware.json` — RepRapFirmware/Duet3D (multi-mode: M451/M452/M453)
- `fluidnc.json` — FluidNC (ESP32, YAML config, WiFi/Bluetooth, grbl-compatible)

### Loading (`src/lib/data.ts`)

JSON files are imported directly as ES modules. At build time, Next.js bundles them into the client JavaScript. Functions:
- `getFirmwareList()` — returns all firmware metadata
- `getFirmwareData(id)` — returns codes for a specific firmware
- `getAllFirmwareData()` — returns everything (used for cross-references)

## UI Components

### Page (`src/app/page.tsx`)
Client component that owns all state:
- `selectedFirmware` — which firmware tab is active
- `searchQuery` — text filter
- `typeFilter` — G/M/$/all filter
- `selectedCode` — which code's detail dialog is open

### FirmwareSelector
Row of buttons to switch between firmware systems.

### CodeList
Scrollable list of code entries for the selected firmware. Each row shows:
- Code identifier and name
- "conflict" badge if cross-references contain WARNING/CONFLICT/CRITICAL
- "mode-dependent" badge if the code has mode-specific behavior
- Count of how many other firmwares implement the same code

### CodeDetail
Floating dialog (modal) that opens when a code is clicked. Sections:
- Description, parameters, examples
- Mode-specific behavior (e.g., laser mode, CNC mode)
- Cross-firmware references with visual warning indicators
- Related codes, notes, version notes
- Source links to official documentation

## Key Domain Concepts

### Firmware Lineage
NIST RS274/NGC → LinuxCNC → grbl → grblHAL. Additionally, grbl → Grbl_ESP32 → FluidNC. Each descendant makes adaptations and subsets from its parent. Cross-references document where behavior diverges.

### G28 Conflict
The most critical cross-firmware conflict: In grbl/LinuxCNC (NIST), G28 moves to a stored position. In Smoothieware/RepRapFirmware (RepRap convention), G28 performs homing. Sending the wrong G28 can crash a machine.

### Laser Mode
grbl/grblHAL differentiate M3 (constant power) and M4 (dynamic power) in laser mode ($32=1). Smoothieware uses module config. RepRapFirmware uses mode commands (M452 for laser mode) and S parameter on G1 moves. These differences mean G-code for one laser system often won't work correctly on another without modification.

### $ Commands
grbl, grblHAL, and FluidNC use $ commands for configuration and real-time control ($H for homing, $J for jogging, $$ for settings). FluidNC extends this significantly with filesystem commands ($SD/*, $LocalFS/*), networking ($WiFi/*, $HTTP/*), macros ($RM), and diagnostics ($Heap, $GD, $Limits). These have no equivalent in LinuxCNC, Smoothieware, or RepRapFirmware — those systems use G/M codes or external configuration.

## Deployment

- **Vercel**: Standard Next.js deployment, no special configuration needed
- **Docker**: Uses multi-stage build with `output: "standalone"` in next.config.ts for minimal image size
