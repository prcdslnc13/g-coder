import { SettingDef } from "@/types/settings";

// Project-owned overlay of grblHAL extended settings for the $$ decoder.
// The vendored catalog (vendor/settings.js) is copied verbatim from upstream
// and only covers common settings; this file fills the gap and corrects a few
// entries that lag current grblHAL core. For flavor "grblhal" these
// definitions take precedence (see catalog.ts).
//
// Verified against the setting_id_t enum and setting registration tables in
// grblHAL core and official plugin sources; per-entry URLs below.

const CORE_SETTINGS_H = "https://github.com/grblHAL/core/blob/master/settings.h";
const CORE_SETTINGS_C = "https://github.com/grblHAL/core/blob/master/settings.c";
const CORE_SPINDLE_C = "https://github.com/grblHAL/core/blob/master/spindle_control.c";
const CORE_MODBUS_C = "https://github.com/grblHAL/core/blob/master/modbus_rtu.c";
const CORE_IOPORTS_C = "https://github.com/grblHAL/core/blob/master/ioports.c";
const CORE_WIKI = "https://github.com/grblHAL/core/wiki/Additional-or-extended-settings";
const PLUGIN_SPINDLE_SELECT = "https://github.com/grblHAL/Plugins_spindle/blob/master/select.c";
const PLUGIN_SPINDLE_OFFSET = "https://github.com/grblHAL/Plugins_spindle/blob/master/offset.c";
const PLUGIN_SPINDLE_VFD = "https://github.com/grblHAL/Plugins_spindle";
const PLUGIN_EVENTOUT = "https://github.com/grblHAL/Plugins_misc/blob/master/eventout.c";
const PLUGIN_KEYPAD_MACROS = "https://github.com/grblHAL/Plugin_keypad/blob/master/macros.c";
const PLUGIN_SDCARD_MACROS = "https://github.com/grblHAL/Plugin_SD_card/blob/master/macros.c";
const PLUGIN_NETWORKING = "https://github.com/grblHAL/Plugin_networking";
const SIENCI_ATCI = "https://github.com/Sienci-Labs/sienci-atci-plugin/blob/main/sienci-atci-plugin.c";

const CONTROL_SIGNAL_BITS: Record<number, string> = {
  0: "Reset",
  1: "Feed hold",
  2: "Cycle start",
  3: "Safety door",
  4: "Block delete",
  5: "Optional stop",
  6: "EStop",
  7: "Probe disconnected",
  8: "Motor fault",
  9: "Motor warning",
  10: "Limits override",
  11: "Single step blocks",
  12: "Toolsetter overtravel",
};

const AXIS_BITS: Record<number, string> = { 0: "X", 1: "Y", 2: "Z", 3: "A", 4: "B", 5: "C" };

const PWM_SPINDLE_OPTION_BITS: Record<number, string> = {
  0: "Enable",
  1: "RPM controls spindle enable signal",
  2: "Disable laser mode capability",
  3: "Enable ramping",
  4: "Ignore on/off delays",
};

const SPINDLE_SIGNAL_BITS: Record<number, string> = {
  0: "Spindle enable",
  1: "Spindle direction",
  2: "PWM",
};

const BUTTON_ACTIONS: Record<number, string> = {
  0: "Macro",
  1: "Cycle start",
  2: "Feed hold",
  3: "Park",
  4: "Reset",
  5: "Spindle stop (during feed hold)",
  6: "Mist toggle",
  7: "Flood toggle",
  8: "Probe connected toggle",
  9: "Optional stop toggle",
  10: "Single block mode toggle",
};

const EVENTOUT_TRIGGERS: Record<number, string> = {
  0: "None",
  1: "Spindle enable",
  2: "Laser enable",
  3: "Mist enable (M7)",
  4: "Flood enable (M8)",
  5: "Feed hold",
  6: "Alarm",
  7: "Spindle at speed",
  8: "Motion",
  9: "Optional stop toggle",
  10: "Single stepping toggle",
  11: "Block delete toggle",
};

// Omitted flavors/sources are filled in by build() below.
type OverlayEntry = Omit<SettingDef, "flavors" | "sources"> & { sources?: string[] };

const CORE_SOURCES = [CORE_SETTINGS_H, CORE_SETTINGS_C, CORE_WIKI];

const ENTRIES: OverlayEntry[] = [
  // --- Corrections of vendored entries (current grblHAL core semantics) ---
  {
    id: 9,
    name: "PWM spindle options",
    description:
      "Options for the PWM spindle. 'RPM controls spindle enable signal' makes S0 switch the spindle off while M3/M4 is active. Ramping computes spin up/down time from $394/$539.",
    type: "mask",
    values: PWM_SPINDLE_OPTION_BITS,
  },
  {
    id: 14,
    name: "Invert control inputs",
    description:
      "Inverts the control input signals (active low). Several bits are optional signals; availability is driver dependent.",
    type: "mask",
    values: CONTROL_SIGNAL_BITS,
  },
  {
    id: 16,
    name: "Invert spindle signals",
    description:
      "Inverts the spindle on, direction (CCW) and PWM signals (active low). Reboot required; CCW/PWM inversion is not supported by all drivers.",
    type: "mask",
    values: SPINDLE_SIGNAL_BITS,
  },
  {
    id: 17,
    name: "Pullup disable control inputs",
    description:
      "Disables the control signal pullup resistors, potentially enabling pulldown resistors where available. Same bit layout as $14.",
    type: "mask",
    values: CONTROL_SIGNAL_BITS,
  },
  {
    id: 19,
    name: "Pullup disable probe inputs",
    description:
      "Disables the probe signal pullup resistor(s), potentially enabling pulldown resistor(s). Toolsetter/probe 2 bits appear when compiled in.",
    type: "mask",
    values: { 0: "Probe", 1: "Toolsetter", 2: "Probe 2" },
  },
  {
    id: 39,
    name: "Enable legacy RT commands",
    description:
      "Enables normal processing of ?, ! and ~ characters when part of a $-setting or comment. If disabled they are added to the input string instead of acting as realtime commands.",
    type: "bool",
  },
  {
    id: 65,
    name: "Probing options",
    description:
      "Probing options. 'Apply soft limits' restricts probing commands to the machine workspace for homed axes; 'Probe protection' guards against probing with a triggered probe.",
    type: "mask",
    values: {
      0: "Allow feed override",
      1: "Apply soft limits",
      3: "Auto select toolsetter",
      4: "Auto select probe 2",
      5: "Probe protection",
    },
  },
  {
    id: 346,
    name: "Tool change options",
    description:
      "Manual tool change options. 'Restore position after M6' moves the tool tip back to where it was before the M6; 'Change tool at G30' rapids to the G30 position via tool axis home.",
    type: "mask",
    values: { 0: "Restore position after M6", 1: "Change tool at G30", 2: "Fast probe pull off" },
  },

  // --- Parking cycle ($41-$59) ---
  {
    id: 41,
    name: "Parking cycle",
    description: "Enables the parking cycle. Requires the parking axis to be homed.",
    type: "mask",
    values: { 0: "Enable", 1: "Deactivate upon init", 2: "Enable parking override control" },
  },
  {
    id: 42,
    name: "Parking axis",
    description: "Axis that performs the parking motion.",
    type: "enum",
    values: { 0: "X", 1: "Y", 2: "Z" },
  },
  {
    id: 56,
    name: "Parking pull-out distance",
    description: "Spindle pull-out and plunge distance during a parking cycle (incremental).",
    type: "float",
    units: "mm",
  },
  {
    id: 57,
    name: "Parking pull-out rate",
    description: "Spindle pull-out/plunge slow feed rate during a parking cycle.",
    type: "float",
    units: "mm/min",
  },
  {
    id: 58,
    name: "Parking target",
    description: "Parking axis target as a machine coordinate in the range [-max travel, 0].",
    type: "float",
    units: "mm",
  },
  {
    id: 59,
    name: "Parking fast rate",
    description: "Parking fast rate to target after pull-out.",
    type: "float",
    units: "mm/min",
  },
  {
    id: 60,
    name: "Restore overrides",
    description: "Restores feed/rapid/spindle overrides to default values at program end (M2/M30).",
    type: "bool",
  },
  {
    id: 61,
    name: "Safety door options",
    description:
      "'Ignore when idle' disregards the door signal in IDLE state to allow jogging with the door open.",
    type: "mask",
    values: { 0: "Ignore when idle", 1: "Keep coolant state on door open" },
  },

  // --- Bluetooth / WiFi extras missing from the vendored catalog ---
  {
    id: 71,
    name: "Bluetooth device name",
    description: "Bluetooth device name, max 32 characters.",
    type: "string",
    sources: [CORE_SETTINGS_H, CORE_WIKI],
  },
  {
    id: 72,
    name: "Bluetooth service name",
    description: "Bluetooth service name, max 32 characters.",
    type: "string",
    sources: [CORE_SETTINGS_H, CORE_WIKI],
  },
  {
    id: 79,
    name: "WiFi AP channel",
    description: "WiFi channel for Access Point mode; 0 selects automatically.",
    type: "int",
    range: { min: 0, max: 11 },
    sources: [CORE_SETTINGS_H, CORE_WIKI],
  },

  // --- Per-axis backlash compensation ($160+) and dual axis offset ($170+) ---
  ...(["X", "Y", "Z", "A", "B", "C"] as const).map((axis, i) => ({
    id: 160 + i,
    name: `${axis}-axis backlash compensation`,
    description: `Backlash distance to compensate for on the ${axis} axis. Available when the firmware is built with backlash compensation.`,
    type: "float" as const,
    units: "mm",
    axis,
    sources: [CORE_SETTINGS_H, CORE_SETTINGS_C],
  })),
  ...(["X", "Y", "Z", "A", "B", "C"] as const).map((axis, i) => ({
    id: 170 + i,
    name: `${axis}-axis dual axis offset`,
    description: `Offset between sides to compensate for homing switch inaccuracies on an auto-squared (ganged) ${axis} axis.`,
    type: "float" as const,
    units: "mm",
    range: { min: -10, max: 10 },
    axis,
    sources: [CORE_SETTINGS_H, CORE_SETTINGS_C],
  })),

  // --- Networking ($300-$308) ---
  {
    id: 300,
    name: "Hostname",
    description: "Network hostname, max 32 characters.",
    type: "string",
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 301,
    name: "IP mode",
    description: "IP address mode for the primary network interface.",
    type: "enum",
    values: { 0: "Static", 1: "DHCP", 2: "AutoIP" },
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 302,
    name: "IP address",
    description: "Static IP address for the primary network interface.",
    type: "string",
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 303,
    name: "Gateway",
    description: "Gateway address for the primary network interface.",
    type: "string",
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 304,
    name: "Netmask",
    description: "Subnet mask for the primary network interface.",
    type: "string",
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 305,
    name: "Telnet port",
    description: "Port for the Telnet (raw socket) service.",
    type: "int",
    range: { min: 1, max: 65535 },
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 306,
    name: "HTTP port",
    description: "Port for the HTTP web server.",
    type: "int",
    range: { min: 1, max: 65535 },
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 307,
    name: "Websocket port",
    description: "Port for the Websocket service.",
    type: "int",
    range: { min: 1, max: 65535 },
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 308,
    name: "FTP port",
    description: "Port for the FTP service.",
    type: "int",
    range: { min: 1, max: 65535 },
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },

  // --- Spindle / tool change extras ---
  {
    id: 340,
    name: "Spindle at speed tolerance",
    description:
      "Percentage tolerance for spindle at-speed detection. If greater than 0, alarm 14 is raised when the spindle fails to reach speed within the $394 delay.",
    type: "float",
    units: "%",
  },
  {
    id: 347,
    name: "Dual axis length fail",
    description:
      "Auto-squaring homing fail threshold as a percentage of axis max travel. Homing fails if the distance between the two switch trigger points exceeds this.",
    type: "float",
    units: "%",
    range: { min: 0, max: 100 },
  },
  {
    id: 348,
    name: "Dual axis length fail min",
    description: "Auto-squaring homing length fail minimum distance.",
    type: "float",
    units: "mm",
  },
  {
    id: 349,
    name: "Dual axis length fail max",
    description: "Auto-squaring homing length fail maximum distance.",
    type: "float",
    units: "mm",
  },

  // --- Aux I/O ---
  {
    id: 370,
    name: "Invert I/O port inputs",
    description:
      "Inverts auxiliary digital input ports. Each bit corresponds to an aux input port; names and count are driver dependent.",
    type: "mask",
    values: {
      0: "Aux in 0", 1: "Aux in 1", 2: "Aux in 2", 3: "Aux in 3",
      4: "Aux in 4", 5: "Aux in 5", 6: "Aux in 6", 7: "Aux in 7",
    },
    sources: [CORE_SETTINGS_H, CORE_IOPORTS_C],
  },
  {
    id: 372,
    name: "Invert I/O port outputs",
    description:
      "Inverts auxiliary digital output ports. Each bit corresponds to an aux output port; names and count are driver dependent.",
    type: "mask",
    values: {
      0: "Aux out 0", 1: "Aux out 1", 2: "Aux out 2", 3: "Aux out 3",
      4: "Aux out 4", 5: "Aux out 5", 6: "Aux out 6", 7: "Aux out 7",
    },
    sources: [CORE_SETTINGS_H, CORE_IOPORTS_C],
  },

  // --- ModBus ---
  {
    id: 374,
    name: "ModBus baud rate",
    description: "Baud rate selection for ModBus RTU communication (VFD spindles etc.).",
    type: "int",
    sources: [CORE_SETTINGS_H, CORE_MODBUS_C],
  },
  {
    id: 375,
    name: "ModBus RX timeout",
    description: "ModBus receive timeout; a timeout raises a spindle communication alarm.",
    type: "int",
    units: "ms",
    sources: [CORE_SETTINGS_H, CORE_MODBUS_C],
  },

  // --- Delays / spindle selection / planner ---
  {
    id: 392,
    name: "Spindle on delay (safety door)",
    description:
      "Delay to allow the spindle to spin up after the safety door is closed or on resume from park. 0 or 0.5-20 seconds.",
    type: "float",
    units: "s",
  },
  {
    id: 393,
    name: "Coolant on delay (safety door)",
    description:
      "Delay to allow coolant to restart after the safety door is closed or on resume from park. 0 or 0.5-20 seconds.",
    type: "float",
    units: "s",
  },
  {
    id: 394,
    name: "Spindle on delay",
    description:
      "Delay to allow the spindle to spin up, 0 or 0.5-20 seconds. If the spindle supports at-speed detection it is the time to wait before alarm 14 is raised.",
    type: "float",
    units: "s",
  },
  {
    id: 395,
    name: "Default spindle",
    description:
      "Spindle selected on startup; the value indexes the spindles registered in the build. Reboot required.",
    type: "int",
  },

  // --- VFD spindles ---
  {
    id: 460,
    name: "VFD ModBus address",
    description: "Primary VFD ModBus slave address for spindle control.",
    type: "int",
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_VFD],
  },
  {
    id: 461,
    name: "VFD RPM per Hz",
    description: "Conversion factor from RPM to Hz used to translate S (RPM) commands into VFD frequency.",
    type: "float",
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_VFD],
  },
  ...[0, 1, 2, 3].map((n) => ({
    id: 476 + n,
    name: `VFD ModBus address, spindle ${n}`,
    description: `ModBus address for spindle ${n} when multiple VFD spindles are configured.`,
    type: "int" as const,
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_VFD],
  })),

  // --- Misc core ($484-$539) ---
  {
    id: 484,
    name: "Unlock required after E-Stop",
    description: "When set, unlock ($X) is required after resetting a cleared E-Stop condition.",
    type: "bool",
  },
  {
    id: 485,
    name: "Keep tool number over reboot",
    description: "Persists the current tool number over a reboot.",
    type: "bool",
  },
  {
    id: 486,
    name: "Lock coordinate systems",
    description: "Locks coordinate systems against accidental changes.",
    type: "mask",
    values: { 0: "G59.1", 1: "G59.2", 2: "G59.3" },
  },
  ...[0, 1, 2, 3].map((n) => ({
    id: 490 + n,
    name: `Macro ${n + 1}`,
    description:
      `Content of user macro ${n + 1}, triggerable by an aux input pin or keypad. Separate blocks with the vertical bar character |.`,
    type: "string" as const,
    sources: [CORE_SETTINGS_H, PLUGIN_KEYPAD_MACROS],
  })),
  ...[2, 3, 4].map((n) => ({
    id: 509 + n,
    name: `Spindle ${n} binding`,
    description:
      `Selects which registered spindle driver is bound as spindle ${n}. 0 = Disabled; other values index the spindle types compiled into the build.`,
    type: "int" as const,
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_SELECT],
  })),
  {
    id: 520,
    name: "Spindle 1 tool number start",
    description:
      "Start of tool numbers used for selecting this spindle when spindles are switched by tool number. Normally 0 for the default spindle.",
    type: "int",
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_SELECT],
  },
  {
    id: 534,
    name: "Output NGC debug messages",
    description: "Enables output of NGC (debug, ...) comment messages from G-code expressions.",
    type: "bool",
  },
  {
    id: 535,
    name: "MAC address",
    description:
      "Optional MAC address for the ethernet interface. When not set the driver generates one. Reboot required.",
    type: "string",
    sources: [CORE_SETTINGS_H, PLUGIN_NETWORKING],
  },
  {
    id: 536,
    name: "LED strip 1 length",
    description: "Number of LEDs in NeoPixel/WS2812 strip 1.",
    type: "int",
    range: { min: 0, max: 255 },
  },
  {
    id: 537,
    name: "LED strip 2 length",
    description: "Number of LEDs in NeoPixel/WS2812 strip 2.",
    type: "int",
    range: { min: 0, max: 255 },
  },
  {
    id: 538,
    name: "Fast rotary go to G28",
    description:
      "Rotary axes for which a fast return to the G28-stored angle is enabled (unwinds the axis instead of winding back).",
    type: "mask",
    values: AXIS_BITS,
  },
  {
    id: 539,
    name: "Spindle off delay",
    description: "Delay to allow the spindle to spin down, 0 or 0.5-20 seconds.",
    type: "float",
    units: "s",
  },

  // --- Macro buttons ($590-$592) ---
  ...[0, 1, 2].map((n) => ({
    id: 590 + n,
    name: `Button ${n + 1} action`,
    description: `Action taken when macro input pin/button ${n + 1} is triggered.`,
    type: "enum" as const,
    values: BUTTON_ACTIONS,
    sources: [CORE_SETTINGS_H, PLUGIN_KEYPAD_MACROS],
  })),

  // --- File systems / delays / reset ---
  {
    id: 650,
    name: "File systems options",
    description:
      "Filing system options. 'Hierarchical listing' adds directory entries in $F and $F+ output.",
    type: "mask",
    values: { 0: "Auto mount SD card", 1: "Hide LittleFS", 2: "Hierarchical listing" },
  },
  {
    id: 673,
    name: "Coolant on delay",
    description: "Delay to allow coolant to start, 0 or 0.5-20 seconds.",
    type: "float",
    units: "s",
  },
  {
    id: 675,
    name: "Macro ATC options",
    description: "Options for macro-based automatic tool change (tc.macro on SD card/LittleFS).",
    type: "mask",
    values: { 0: "Execute M6T0", 1: "Fail M6 if tc.macro not found" },
    sources: [CORE_SETTINGS_H, PLUGIN_SDCARD_MACROS],
  },
  {
    id: 676,
    name: "Reset actions",
    description: "Actions taken on a soft reset.",
    type: "mask",
    values: {
      0: "Clear homed status if position lost",
      1: "Clear offsets (except G92)",
      2: "Clear rapids override",
      3: "Clear feed override",
    },
  },
  {
    id: 680,
    name: "Stepper enable delay",
    description:
      "Delay from stepper enable to first step output. The driver typically adds ~2 ms to this.",
    type: "int",
    units: "ms",
    range: { min: 0, max: 500 },
  },
  {
    id: 681,
    name: "ModBus serial format",
    description: "Serial format for the ModBus RTU stream (used e.g. for VFD spindles).",
    type: "enum",
    values: { 0: "8-bit no parity", 1: "8-bit even parity", 2: "8-bit odd parity" },
    sources: [CORE_SETTINGS_H, CORE_MODBUS_C],
  },

  // --- Sienci ATCi plugin ($683-$687; ID range reserved for Sienci in core) ---
  {
    id: 683,
    name: "ATCi plugin options (Sienci)",
    description:
      "Sienci SLB/AltMill ATCi (automatic tool changer) plugin options. Part of the ATC tool-rack keepout-zone feature (M960 toggles the runtime keepout state).",
    type: "mask",
    values: { 0: "Enable", 1: "Monitor rack presence", 2: "Monitor TC macro" },
    sources: [CORE_SETTINGS_H, SIENCI_ATCI],
  },
  ...([
    ["X min", 684],
    ["Y min", 685],
    ["X max", 686],
    ["Y max", 687],
  ] as const).map(([label, id]) => ({
    id,
    name: `ATCi keepout ${label} (Sienci)`,
    description: `${label} boundary of the ATC tool-rack keepout zone in machine coordinates. Jogs/moves into the zone are blocked while keepout is active.`,
    type: "float" as const,
    units: "mm",
    range: { min: -10000, max: 10000 },
    sources: [CORE_SETTINGS_H, SIENCI_ATCI],
  })),

  // --- Subroutines / second PWM spindle / motor fault ($700-$745) ---
  {
    id: 700,
    name: "Subroutine options",
    description:
      "Subroutine handling options. Available when the controller has SD card or littlefs storage.",
    type: "mask",
    values: { 0: "Prescan for internal M98 subroutines" },
  },
  {
    id: 709,
    name: "PWM2 spindle options",
    description:
      "Options for the second PWM spindle; mirrors $9 for spindle 0. On the Sienci SLB the PWM2 spindle drives the laser output.",
    type: "mask",
    values: PWM_SPINDLE_OPTION_BITS,
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 716,
    name: "PWM2 spindle signals invert",
    description:
      "Inverts the second PWM spindle's on, direction and PWM signals (active low); mirrors $16 for spindle 0. Reboot required.",
    type: "mask",
    values: SPINDLE_SIGNAL_BITS,
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 730,
    name: "PWM2 spindle max speed",
    description:
      "Maximum spindle speed (S value) for the second PWM spindle; mirrors $30. On the Sienci SLB this is the laser's max power S value.",
    type: "float",
    units: "rpm",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 731,
    name: "PWM2 spindle min speed",
    description: "Minimum spindle speed (S value) for the second PWM spindle; mirrors $31.",
    type: "float",
    units: "rpm",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 733,
    name: "PWM2 spindle PWM frequency",
    description: "PWM carrier frequency for the second PWM spindle; mirrors $33.",
    type: "float",
    units: "Hz",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 734,
    name: "PWM2 spindle PWM off value",
    description: "PWM duty cycle when the second PWM spindle is off; mirrors $34.",
    type: "float",
    units: "%",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 735,
    name: "PWM2 spindle PWM min value",
    description: "PWM duty cycle at minimum speed for the second PWM spindle; mirrors $35.",
    type: "float",
    units: "%",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 736,
    name: "PWM2 spindle PWM max value",
    description: "PWM duty cycle at maximum speed for the second PWM spindle; mirrors $36.",
    type: "float",
    units: "%",
    sources: [CORE_SETTINGS_H, CORE_SPINDLE_C],
  },
  {
    id: 744,
    name: "Motor fault inputs enable",
    description:
      "Axes for which motor fault (driver alarm) input signals are enabled. Available on boards with motor fault inputs.",
    type: "mask",
    values: AXIS_BITS,
  },
  {
    id: 745,
    name: "Invert motor fault inputs",
    description: "Inverts the motor fault input signals (active low); same bit layout as $744.",
    type: "mask",
    values: AXIS_BITS,
  },

  // --- Eventout plugin ($750-$763) ---
  ...[0, 1, 2, 3].map((n) => ({
    id: 750 + n,
    name: `Event out ${n} trigger`,
    description:
      `Event that drives auxiliary output ${n}. The port can still be controlled by M62-M65 when bound to an event. On the Sienci SLB these map to the accessory outputs (SWT1/SWT2/PWR1/PWR2).`,
    type: "enum" as const,
    values: EVENTOUT_TRIGGERS,
    sources: [CORE_SETTINGS_H, PLUGIN_EVENTOUT],
  })),
  ...[0, 1, 2, 3].map((n) => ({
    id: 760 + n,
    name: `Event out ${n} port`,
    description: `Aux output port number bound to event trigger $${750 + n}. -1 disables. Reboot required.`,
    type: "int" as const,
    sources: [CORE_SETTINGS_H, PLUGIN_EVENTOUT],
  })),

  // --- Laser offset plugin ($770-$772) ---
  {
    id: 770,
    name: "Laser X offset",
    description:
      "X distance of the laser head from the primary spindle; applied when switching between spindle and laser.",
    type: "float",
    units: "mm",
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_OFFSET],
  },
  {
    id: 771,
    name: "Laser Y offset",
    description:
      "Y distance of the laser head from the primary spindle; applied when switching between spindle and laser.",
    type: "float",
    units: "mm",
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_OFFSET],
  },
  {
    id: 772,
    name: "Laser offset options",
    description: "How the laser XY offset is applied on spindle change.",
    type: "enum",
    values: { 0: "Keep new position", 1: "Update G92 on spindle change" },
    sources: [CORE_SETTINGS_H, PLUGIN_SPINDLE_OFFSET],
  },
];

function build(): Map<number, SettingDef> {
  const map = new Map<number, SettingDef>();
  for (const e of ENTRIES) {
    map.set(e.id, {
      ...e,
      flavors: ["grblhal"],
      sources: e.sources ?? CORE_SOURCES,
    });
  }
  return map;
}

export const EXTENDED_GRBLHAL: Map<number, SettingDef> = build();
