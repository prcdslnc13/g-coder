# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

g-coder is an interactive G-code/M-code wiki and troubleshooter for CNC firmware systems. Built as a support tool for agents working with LightBurn and MillMage software. Target firmwares: grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware (Duet3D), FluidNC.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — run ESLint
- `docker build -t g-coder .` — build Docker image (static export served by nginx)
- `docker run -p 3000:80 g-coder` — run in Docker; visit http://localhost:3000

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4

**Key directories:**
- `data/` — JSON files per firmware containing all G-code/M-code entries
- `src/types/gcode.ts` — TypeScript types defining the data schema
- `src/lib/data.ts` — data loading functions that import the JSON files
- `src/components/` — React components (FirmwareSelector, CodeList, CodeDetail)
- `src/app/page.tsx` — main page (client component, manages all UI state)

**Data flow:** JSON files → `src/lib/data.ts` → page component → child components. All data is static and bundled at build time. No API routes or database.

**Firmware lineage:** NIST RS274/NGC standard → LinuxCNC → grbl → grblHAL. Also grbl → Grbl_ESP32 → FluidNC. grbl and grblHAL are distinct systems with documented differences. The $ commands are grbl/grblHAL/FluidNC-specific.

## Agent Instructions
1. First think through the problem, read the codebase for the relevant files or resources.
2. Before you make any major changes check in with me and I will verify the plan.
3. Give a high level explanation of the changes you make every step of the way.
4. Make every task and code change as simple as possible. Avoid making massive or complex changes. Every change should impact as little code as possible. Maintain simplicity everywhere possible.
5. Maintain a documentation file that describes how the architecture of the app works inside and out.
6. Never speculate about code or files you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering or making changes to the codebase. Never make any claims about the code before investigating unless you are certain of the correct answer. Give grounded and hallucination-free answers.
7. Cite sources of information. This project is a compilation of knowledge, so it needs to be accurate and able to be verified. The information should come from official sources of truth and not random forum posts. 