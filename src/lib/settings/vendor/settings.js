// Vendored verbatim from https://github.com/adammhaile/cnc_firmware_tools
// (tools/grbl-config/settings.js | tools/alarms/codes.js), commit 00c343648aa9ae19840dcdd77c49ec2d7789a6b9.
// MIT License, Copyright (c) 2026 Adam Haile. See upstream repo for license text.
// Do not edit by hand — update by re-copying from upstream.

// GRBL settings reference data.
//
// Coverage:
//   - Grbl 1.1: complete
//   - grblHAL: common settings, including network/spindle/tool-change groups
//   - FluidNC: shares Grbl 1.1 numeric settings; most config lives in YAML and
//     is not emitted by $$, so unknowns are expected and shown as raw.
//
// Each setting entry:
//   id          number; the $N number. For axis-indexed settings use the
//               base id (e.g. 100) and set axisBase: true so the lookup
//               generates 100/101/102/... per axis.
//   flavors     array of strings: 'grbl11' | 'grblhal' | 'fluidnc'
//   name        short title
//   description longer prose
//   type        'bool' | 'int' | 'float' | 'mask' | 'enum' | 'string'
//   units       optional string (e.g. 'mm', 'mm/min', 'us')
//   range       optional { min, max } for numeric types
//   values      for 'enum': { '0': 'label', '1': 'label', ... }
//               for 'mask': { '0': 'bit 0 label', '1': 'bit 1 label', ... }
//                          (keys are bit indices, NOT values)
//   axisBase    true if this is the first of an axis-indexed group
//               (X=+0, Y=+1, Z=+2, A=+3, B=+4, C=+5, U=+6, V=+7)

export const FLAVORS = {
  grbl11: 'Grbl 1.1',
  grblhal: 'grblHAL',
  fluidnc: 'FluidNC',
};

export const AXIS_LABELS = ['X', 'Y', 'Z', 'A', 'B', 'C', 'U', 'V'];

// Base settings catalog. Axis-indexed entries are expanded by lookupSetting.
const CATALOG = [
  {
    id: 0, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Step pulse time',
    description: 'Sets the step pulse duration sent to the stepper drivers. Most drivers need at least 3µs; some can use less.',
    type: 'int', units: 'µs', range: { min: 1, max: 255 },
  },
  {
    id: 1, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Step idle delay',
    description: 'Time the steppers remain energized after a motion before being disabled. 255 keeps them always enabled.',
    type: 'int', units: 'ms', range: { min: 0, max: 255 },
  },
  {
    id: 2, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Step port invert mask',
    description: 'Inverts the step signal per axis. Set the bit for any axis whose driver expects an active-low step pulse.',
    type: 'mask',
    values: { 0: 'X step', 1: 'Y step', 2: 'Z step', 3: 'A step', 4: 'B step', 5: 'C step' },
  },
  {
    id: 3, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Direction port invert mask',
    description: 'Inverts the direction signal per axis. Use this to flip an axis without rewiring.',
    type: 'mask',
    values: { 0: 'X direction', 1: 'Y direction', 2: 'Z direction', 3: 'A direction', 4: 'B direction', 5: 'C direction' },
  },
  {
    id: 4, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Invert step enable pin',
    description: 'Inverts the stepper enable output. Default is active-low (0); set to 1 if your drivers expect active-high enable.',
    type: 'bool',
  },
  {
    id: 5, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Invert limit pins',
    description: 'Inverts the limit input pins. Set to 1 for normally-closed (NC) switches, 0 for normally-open (NO).',
    type: 'bool',
  },
  {
    id: 6, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Invert probe pin',
    description: 'Inverts the probe input pin.',
    type: 'bool',
  },
  {
    id: 7, flavors: ['grblhal'],
    name: 'Spindle invert mask',
    description: 'Inverts spindle output signals.',
    type: 'mask',
    values: { 0: 'Spindle enable', 1: 'Spindle direction', 2: 'PWM' },
  },
  {
    id: 8, flavors: ['grblhal'],
    name: 'Ganged axes direction invert mask',
    description: 'Inverts direction signal for the ganged (secondary) motor on dual-motor axes.',
    type: 'mask',
    values: { 0: 'X2', 1: 'Y2', 2: 'Z2' },
  },
  {
    id: 9, flavors: ['grblhal'],
    name: 'PWM Spindle options',
    description: 'Spindle PWM behavior flags.',
    type: 'mask',
    values: { 0: 'Enable', 1: 'RPM controls spindle enable signal' },
  },
  {
    id: 10, flavors: ['grbl11', 'fluidnc'],
    name: 'Status report options',
    description: 'Controls what is included in the status report. Bit 0: position type (MPos when set, WPos when clear). Bit 1: include buffer state.',
    type: 'mask',
    values: { 0: 'Report machine position (MPos)', 1: 'Include buffer state' },
  },
  {
    id: 10, flavors: ['grblhal'],
    name: 'Status report options (grblHAL)',
    description: 'grblHAL extends $10 with many additional report fields.',
    type: 'mask',
    values: {
      0: 'Position in machine coordinate',
      1: 'Buffer state',
      2: 'Line numbers',
      3: 'Feed & speed',
      4: 'Pin state',
      5: 'Work coordinate offset',
      6: 'Overrides',
      7: 'Probe coordinates',
      8: 'Sync on WCO change',
      9: 'Parser state',
      10: 'Alarm substatus',
      11: 'Run substatus',
    },
  },
  {
    id: 11, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Junction deviation',
    description: 'Cornering aggressiveness. Larger values mean faster cornering but rougher motion; smaller is smoother but slower.',
    type: 'float', units: 'mm',
  },
  {
    id: 12, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Arc tolerance',
    description: 'Maximum deviation allowed when approximating arcs with line segments.',
    type: 'float', units: 'mm',
  },
  {
    id: 13, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Report in inches',
    description: 'Switches status report units between millimeters (0) and inches (1).',
    type: 'bool',
  },
  {
    id: 14, flavors: ['grblhal'],
    name: 'Control signals invert mask',
    description: 'Inverts control input pins (cycle start, feed hold, reset, etc).',
    type: 'mask',
    values: { 0: 'Reset', 1: 'Feed hold', 2: 'Cycle start', 3: 'Safety door', 4: 'Block delete', 5: 'Optional stop', 6: 'EStop', 7: 'Probe connected' },
  },
  {
    id: 15, flavors: ['grblhal'],
    name: 'Coolant signals invert mask',
    description: 'Inverts coolant output pins.',
    type: 'mask',
    values: { 0: 'Flood', 1: 'Mist' },
  },
  {
    id: 16, flavors: ['grblhal'],
    name: 'Spindle signals invert mask',
    description: 'Inverts spindle output pins.',
    type: 'mask',
    values: { 0: 'Spindle enable', 1: 'Spindle direction' },
  },
  {
    id: 17, flavors: ['grblhal'],
    name: 'Control signals pull-up disable mask',
    description: 'Disables internal pull-ups on control input pins.',
    type: 'mask',
    values: { 0: 'Reset', 1: 'Feed hold', 2: 'Cycle start', 3: 'Safety door', 4: 'Block delete', 5: 'Optional stop', 6: 'EStop', 7: 'Probe connected' },
  },
  {
    id: 18, flavors: ['grblhal'],
    name: 'Limit signals pull-up disable mask',
    description: 'Disables internal pull-ups on limit input pins.',
    type: 'mask',
    values: { 0: 'X limit', 1: 'Y limit', 2: 'Z limit', 3: 'A limit', 4: 'B limit', 5: 'C limit' },
  },
  {
    id: 19, flavors: ['grblhal'],
    name: 'Probe signal pull-up disable',
    description: 'Disables internal pull-up on probe input pin.',
    type: 'bool',
  },
  {
    id: 20, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Soft limits enable',
    description: 'When enabled, motion is restricted to within the machine travel limits. Requires homing.',
    type: 'bool',
  },
  {
    id: 21, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Hard limits enable',
    description: 'When enabled, triggering a limit switch immediately stops motion and raises an alarm.',
    type: 'bool',
  },
  {
    id: 22, flavors: ['grbl11', 'fluidnc'],
    name: 'Homing cycle enable',
    description: 'Enables the homing cycle. Required before soft limits can be used.',
    type: 'bool',
  },
  {
    id: 22, flavors: ['grblhal'],
    name: 'Homing cycle enable (grblHAL)',
    description: 'grblHAL extends $22 with additional homing flags.',
    type: 'mask',
    values: {
      0: 'Enable',
      1: 'Enable single axis commands',
      2: 'Homing on startup required',
      3: 'Set machine origin to 0',
      4: 'Two switches share one input pin',
      5: 'Allow manual homing of axes without switches',
      6: 'Override locks',
      7: 'Keep homed status on reset',
    },
  },
  {
    id: 23, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Homing direction invert mask',
    description: 'Inverts homing direction per axis. Set the bit for any axis that should home toward minimum instead of maximum.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 24, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Homing locate feed rate',
    description: 'Slow feed rate used during the precision (second) phase of homing.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 25, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Homing search seek rate',
    description: 'Fast seek rate used during the first phase of homing to find the limit switch.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 26, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Homing switch debounce delay',
    description: 'Delay after a limit switch triggers, to filter out electrical noise/bounce.',
    type: 'int', units: 'ms',
  },
  {
    id: 27, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Homing pull-off distance',
    description: 'Distance moved away from the limit switch after homing, so the switch is not triggered during normal motion.',
    type: 'float', units: 'mm',
  },
  {
    id: 28, flavors: ['grblhal'],
    name: 'G73 retract distance',
    description: 'Retract distance used by the G73 peck-drilling cycle.',
    type: 'float', units: 'mm',
  },
  {
    id: 29, flavors: ['grblhal'],
    name: 'Step pulse delay',
    description: 'Delay between direction change and the next step pulse.',
    type: 'float', units: 'µs',
  },
  {
    id: 30, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Maximum spindle speed',
    description: 'RPM at PWM=100%. Spindle PWM output scales linearly between $31 and $30.',
    type: 'float', units: 'rpm',
  },
  {
    id: 31, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Minimum spindle speed',
    description: 'RPM at the minimum PWM output. Below this RPM, the spindle output is held at minimum (PWM never drops to 0% during operation).',
    type: 'float', units: 'rpm',
  },
  {
    id: 32, flavors: ['grbl11', 'grblhal', 'fluidnc'],
    name: 'Laser mode',
    description: 'Enables laser mode. When set, S commands change power without pausing motion, and the laser turns off during G0 rapids.',
    type: 'bool',
  },
  {
    id: 33, flavors: ['grblhal'],
    name: 'Spindle PWM frequency',
    description: 'PWM carrier frequency for spindle output.',
    type: 'float', units: 'Hz',
  },
  {
    id: 34, flavors: ['grblhal'],
    name: 'Spindle off PWM value',
    description: 'PWM duty cycle when spindle is off, as a percentage.',
    type: 'float', units: '%',
  },
  {
    id: 35, flavors: ['grblhal'],
    name: 'Spindle min PWM value',
    description: 'PWM duty cycle at minimum spindle speed, as a percentage.',
    type: 'float', units: '%',
  },
  {
    id: 36, flavors: ['grblhal'],
    name: 'Spindle max PWM value',
    description: 'PWM duty cycle at maximum spindle speed, as a percentage.',
    type: 'float', units: '%',
  },
  {
    id: 37, flavors: ['grblhal'],
    name: 'Steppers de-energize mask',
    description: 'Per-axis mask of motors to de-energize when idle (after $1 idle delay).',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 39, flavors: ['grblhal'],
    name: 'Enable legacy realtime command chars',
    description: 'Echoes legacy realtime command characters back in $G output.',
    type: 'bool',
  },
  {
    id: 40, flavors: ['grblhal'],
    name: 'Limit jog commands to soft limits',
    description: 'Restricts jogging to within soft-limit travel bounds.',
    type: 'bool',
  },
  {
    id: 43, flavors: ['grblhal'],
    name: 'Homing passes',
    description: 'Number of homing passes to perform per axis.',
    type: 'int', range: { min: 1, max: 128 },
  },
  {
    id: 44, flavors: ['grblhal'],
    name: 'Homing cycle 1',
    description: 'Mask of axes homed in the first homing cycle.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 45, flavors: ['grblhal'],
    name: 'Homing cycle 2',
    description: 'Mask of axes homed in the second homing cycle.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 46, flavors: ['grblhal'],
    name: 'Homing cycle 3',
    description: 'Mask of axes homed in the third homing cycle.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 47, flavors: ['grblhal'],
    name: 'Homing cycle 4',
    description: 'Mask of axes homed in the fourth homing cycle.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 48, flavors: ['grblhal'],
    name: 'Homing cycle 5',
    description: 'Mask of axes homed in the fifth homing cycle.',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 62, flavors: ['grblhal'],
    name: 'Sleep enable',
    description: 'Enables sleep mode after a period of inactivity.',
    type: 'bool',
  },
  {
    id: 63, flavors: ['grblhal'],
    name: 'Feed hold actions',
    description: 'Disables certain actions during feed hold.',
    type: 'mask',
    values: { 0: 'Disable laser during hold', 1: 'Restore spindle and coolant state on resume' },
  },
  {
    id: 64, flavors: ['grblhal'],
    name: 'Force init alarm',
    description: 'Forces alarm state on startup, requiring user acknowledgement before motion.',
    type: 'bool',
  },
  {
    id: 65, flavors: ['grblhal'],
    name: 'Probing feed override',
    description: 'Allows feed override during probing.',
    type: 'bool',
  },
  {
    id: 70, flavors: ['grblhal'],
    name: 'Network services',
    description: 'Bitmask of enabled network services (grblHAL with networking).',
    type: 'mask',
    values: { 0: 'Telnet', 1: 'WebSocket', 2: 'HTTP', 3: 'FTP', 4: 'DNS', 5: 'mDNS', 6: 'SSDP', 7: 'WebDAV' },
  },
  {
    id: 73, flavors: ['grblhal'],
    name: 'WiFi mode',
    description: 'WiFi operating mode.',
    type: 'enum',
    values: { 0: 'Off', 1: 'Station', 2: 'Access Point', 3: 'Access Point + Station' },
  },
  {
    id: 74, flavors: ['grblhal'],
    name: 'WiFi STA SSID',
    description: 'SSID to connect to in station mode.',
    type: 'string',
  },
  {
    id: 75, flavors: ['grblhal'],
    name: 'WiFi STA password',
    description: 'Password for station mode (hidden in $$ output).',
    type: 'string',
  },
  {
    id: 76, flavors: ['grblhal'],
    name: 'WiFi AP SSID',
    description: 'SSID broadcast in access point mode.',
    type: 'string',
  },
  {
    id: 77, flavors: ['grblhal'],
    name: 'WiFi AP password',
    description: 'Password for access point mode.',
    type: 'string',
  },
  {
    id: 78, flavors: ['grblhal'],
    name: 'WiFi country',
    description: 'Regulatory country code for WiFi.',
    type: 'string',
  },
  {
    id: 100, flavors: ['grbl11', 'grblhal', 'fluidnc'], axisBase: true,
    name: '{AXIS} steps per millimeter',
    description: 'Calibration: number of step pulses required to move the {AXIS} axis one millimeter.',
    type: 'float', units: 'steps/mm',
  },
  {
    id: 110, flavors: ['grbl11', 'grblhal', 'fluidnc'], axisBase: true,
    name: '{AXIS} max rate',
    description: 'Maximum feed rate for the {AXIS} axis. Used by G0 rapids and clamps the commanded feed.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 120, flavors: ['grbl11', 'grblhal', 'fluidnc'], axisBase: true,
    name: '{AXIS} acceleration',
    description: 'Maximum acceleration for the {AXIS} axis.',
    type: 'float', units: 'mm/sec²',
  },
  {
    id: 130, flavors: ['grbl11', 'grblhal', 'fluidnc'], axisBase: true,
    name: '{AXIS} max travel',
    description: 'Maximum travel distance for the {AXIS} axis. Used by soft limits and homing.',
    type: 'float', units: 'mm',
  },
  {
    id: 140, flavors: ['grblhal'], axisBase: true,
    name: '{AXIS} motor current',
    description: 'Motor RMS current for the {AXIS} axis (Trinamic drivers).',
    type: 'float', units: 'mA',
  },
  {
    id: 150, flavors: ['grblhal'], axisBase: true,
    name: '{AXIS} microsteps',
    description: 'Microstep setting for the {AXIS} axis (Trinamic drivers).',
    type: 'int',
  },
  {
    id: 200, flavors: ['grblhal'], axisBase: true,
    name: '{AXIS} auto square offset',
    description: 'Offset for the secondary motor on the {AXIS} ganged axis to square the gantry after homing.',
    type: 'float', units: 'mm',
  },
  {
    id: 341, flavors: ['grblhal'],
    name: 'Tool change mode',
    description: 'Selects manual or automatic tool change behavior.',
    type: 'enum',
    values: { 0: 'Normal', 1: 'Manual touch off', 2: 'Manual touch off @ G59.3', 3: 'Automatic touch off @ G59.3', 4: 'Ignore M6' },
  },
  {
    id: 342, flavors: ['grblhal'],
    name: 'Tool change probing distance',
    description: 'Maximum distance to probe during automatic tool change.',
    type: 'float', units: 'mm',
  },
  {
    id: 343, flavors: ['grblhal'],
    name: 'Tool change locate feed rate',
    description: 'Slow probing feed rate during tool change.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 344, flavors: ['grblhal'],
    name: 'Tool change search seek rate',
    description: 'Fast probing seek rate during tool change.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 345, flavors: ['grblhal'],
    name: 'Tool change probe pull-off rate',
    description: 'Pull-off rate after tool change probe contact.',
    type: 'float', units: 'mm/min',
  },
  {
    id: 346, flavors: ['grblhal'],
    name: 'Restore position after M6',
    description: 'Returns to the pre-tool-change position after M6 completes.',
    type: 'bool',
  },
  {
    id: 376, flavors: ['grblhal'],
    name: 'Rotary axes',
    description: 'Mask of axes treated as rotary (degrees instead of mm).',
    type: 'mask',
    values: { 0: 'X', 1: 'Y', 2: 'Z', 3: 'A', 4: 'B', 5: 'C' },
  },
  {
    id: 384, flavors: ['grblhal'],
    name: 'Disable G92 persistence',
    description: 'When set, G92 offsets are not persisted across resets.',
    type: 'bool',
  },
  {
    id: 398, flavors: ['grblhal'],
    name: 'Planner buffer blocks',
    description: 'Number of motion-planner buffer blocks.',
    type: 'int',
  },
  {
    id: 481, flavors: ['grblhal'],
    name: 'Autoreport interval',
    description: 'Interval at which status reports are automatically pushed (0 disables).',
    type: 'int', units: 'ms',
  },
];

// Expand a base axis entry for a given axis offset.
function axisExpand(base, axisOffset) {
  const axis = AXIS_LABELS[axisOffset];
  return {
    ...base,
    id: base.id + axisOffset,
    name: base.name.replace('{AXIS}', axis),
    description: base.description.replace(/\{AXIS\}/g, axis),
    axisBase: false,
    axis,
  };
}

// Build a fast lookup map. Returns Map<id, Array<entry>> where the array
// holds one entry per flavor that defines that id.
function buildIndex() {
  const idx = new Map();
  const push = (entry) => {
    if (!idx.has(entry.id)) idx.set(entry.id, []);
    idx.get(entry.id).push(entry);
  };
  for (const base of CATALOG) {
    if (base.axisBase) {
      for (let i = 0; i < AXIS_LABELS.length; i++) push(axisExpand(base, i));
    } else {
      push(base);
    }
  }
  return idx;
}

const INDEX = buildIndex();

// Look up the best definition for a given id and preferred flavor.
// Returns { entry, candidates } or null. `entry` is the chosen definition;
// `candidates` is the full list (so the UI can show "also defined for: ...").
export function lookupSetting(id, preferredFlavor = 'grbl11') {
  const candidates = INDEX.get(id);
  if (!candidates || candidates.length === 0) return null;
  // Prefer a definition that includes the requested flavor.
  const preferred = candidates.find((c) => c.flavors.includes(preferredFlavor));
  return { entry: preferred ?? candidates[0], candidates };
}

// Iterate all known setting ids (for "missing setting" feature).
export function knownIds() {
  return Array.from(INDEX.keys()).sort((a, b) => a - b);
}
