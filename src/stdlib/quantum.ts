import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

/*
 * Electromagnetic Spectrum Bands (wavelength ranges)
 *
 * Band         Wavelength              Frequency           Use Cases
 * ─────────────────────────────────────────────────────────────────────────
 * Gamma        < 0.01 nm               > 30 EHz            Medical imaging
 * X-ray        0.01 - 10 nm            30 PHz - 30 EHz     Security, medical
 * Ultraviolet  10 - 380 nm             790 THz - 30 PHz    Sterilization
 * Visible      380 - 780 nm            385 THz - 790 THz   Fiber optics, PWDC
 * Infrared     780 nm - 1 mm           300 GHz - 385 THz   Remote controls, thermal
 * Microwave    1 mm - 1 m              300 MHz - 300 GHz   WiFi, 5G, radar, satellite
 * Radio        1 m - 100 km            3 Hz - 300 MHz      FM/AM radio, TV broadcast
 */

const SPEED_OF_LIGHT = 299792458; // m/s

// Band definitions: [minWavelength_m, maxWavelength_m]
const EM_BANDS: Record<string, { min: number; max: number; label: string }> = {
  gamma:      { min: 0,           max: 1e-11,    label: "Gamma Ray" },
  xray:       { min: 1e-11,       max: 1e-8,     label: "X-Ray" },
  ultraviolet:{ min: 1e-8,        max: 3.8e-7,   label: "Ultraviolet" },
  visible:    { min: 3.8e-7,      max: 7.8e-7,   label: "Visible Light" },
  infrared:   { min: 7.8e-7,      max: 1e-3,     label: "Infrared" },
  microwave:  { min: 1e-3,        max: 1,         label: "Microwave" },
  radio:      { min: 1,           max: 1e5,       label: "Radio Wave" },
};

export function createQuantumBuiltins(): Record<string, BuiltinFn> {
  return {
    // Superpose returns an array of states with equal probability
    superpose: (args) => {
      if (!Array.isArray(args[0])) throw new Error("superpose: expected array of states");
      return args[0];
    },

    // Collapse superposition: pick one randomly
    measure: (args) => {
      if (Array.isArray(args[0]) && args[0].length > 0) {
        const idx = Math.floor(Math.random() * args[0].length);
        return args[0][idx];
      }
      return args[0];
    },

    // Simulate entanglement: return correlated pair
    entangle: (args) => {
      if (args.length < 2) throw new Error("entangle: expected two values");
      return [args[0], args[1]];
    },

    // Hadamard gate simulation: 50/50 collapse
    hadamard: (args) => {
      if (typeof args[0] === "number") {
        return Math.random() < 0.5 ? 0 : 1;
      }
      return Math.random() < 0.5 ? args[0] : (args.length > 1 ? args[1] : null);
    },

    // Wavelength (Photonic Encoding — visible light)
    photon_wavelength: (args) => {
      if (typeof args[0] !== "string" || args[0].length === 0)
        throw new Error("photon_wavelength: expected a non-empty string");
      const code = args[0].charCodeAt(0);
      const wavelength = 380 + (code % 128) * (400 / 128);
      return Math.round(wavelength * 100) / 100;
    },
    photon_char: (args) => {
      if (typeof args[0] !== "number")
        throw new Error("photon_char: expected a number (wavelength in nm)");
      const code = Math.round(((args[0] - 380) * 128) / 400) % 128;
      return String.fromCharCode(Math.abs(code));
    },

    // ═══════════════════════════════════════════════════════════
    // Full Electromagnetic Spectrum Builtins
    // ═══════════════════════════════════════════════════════════

    // Convert frequency (Hz) to wavelength (meters)
    em_wavelength: (args) => {
      if (typeof args[0] !== "number" || args[0] <= 0)
        throw new Error("em_wavelength: expected positive frequency in Hz");
      return SPEED_OF_LIGHT / args[0];
    },

    // Convert wavelength (meters) to frequency (Hz)
    em_frequency: (args) => {
      if (typeof args[0] !== "number" || args[0] <= 0)
        throw new Error("em_frequency: expected positive wavelength in meters");
      return SPEED_OF_LIGHT / args[0];
    },

    // Identify which EM band a wavelength (meters) falls in
    em_band: (args) => {
      if (typeof args[0] !== "number" || args[0] <= 0)
        throw new Error("em_band: expected positive wavelength in meters");
      const wl = args[0];
      for (const [name, band] of Object.entries(EM_BANDS)) {
        if (wl >= band.min && wl < band.max) return name;
      }
      return wl >= 1e5 ? "radio" : "gamma";
    },

    // Get band label (human-readable name)
    em_band_label: (args) => {
      if (typeof args[0] !== "string")
        throw new Error("em_band_label: expected band name string");
      const band = EM_BANDS[args[0]];
      if (!band) throw new Error(`em_band_label: unknown band "${args[0]}"`);
      return band.label;
    },

    // Map a byte (0-255) to a wavelength within a specific EM band
    // em_channel(byte, "microwave") → wavelength in meters
    em_channel: (args) => {
      if (typeof args[0] !== "number")
        throw new Error("em_channel: expected byte value (0-255)");
      const bandName = typeof args[1] === "string" ? args[1] : "visible";
      const band = EM_BANDS[bandName];
      if (!band) throw new Error(`em_channel: unknown band "${bandName}"`);
      const byte = Math.max(0, Math.min(255, Math.round(args[0])));
      // Logarithmic mapping for bands spanning many orders of magnitude
      if (band.max / Math.max(band.min, 1e-15) > 100) {
        const logMin = Math.log10(Math.max(band.min, 1e-15));
        const logMax = Math.log10(band.max);
        return Math.pow(10, logMin + (byte / 255) * (logMax - logMin));
      }
      // Linear mapping for narrow bands (visible, UV)
      return band.min + (byte / 255) * (band.max - band.min);
    },

    // Reverse: wavelength (meters) back to byte (0-255) for a band
    em_byte: (args) => {
      if (typeof args[0] !== "number" || args[0] <= 0)
        throw new Error("em_byte: expected positive wavelength in meters");
      const bandName = typeof args[1] === "string" ? args[1] : "visible";
      const band = EM_BANDS[bandName];
      if (!band) throw new Error(`em_byte: unknown band "${bandName}"`);
      if (band.max / Math.max(band.min, 1e-15) > 100) {
        const logMin = Math.log10(Math.max(band.min, 1e-15));
        const logMax = Math.log10(band.max);
        const logWl = Math.log10(args[0]);
        return Math.max(0, Math.min(255, Math.round(((logWl - logMin) / (logMax - logMin)) * 255)));
      }
      return Math.max(0, Math.min(255, Math.round(((args[0] - band.min) / (band.max - band.min)) * 255)));
    },

    // Get frequency in human-readable units
    em_freq_label: (args) => {
      if (typeof args[0] !== "number" || args[0] <= 0)
        throw new Error("em_freq_label: expected positive frequency in Hz");
      const f = args[0];
      if (f >= 1e18) return `${(f / 1e18).toFixed(2)} EHz`;
      if (f >= 1e15) return `${(f / 1e15).toFixed(2)} PHz`;
      if (f >= 1e12) return `${(f / 1e12).toFixed(2)} THz`;
      if (f >= 1e9)  return `${(f / 1e9).toFixed(2)} GHz`;
      if (f >= 1e6)  return `${(f / 1e6).toFixed(2)} MHz`;
      if (f >= 1e3)  return `${(f / 1e3).toFixed(2)} kHz`;
      return `${f.toFixed(2)} Hz`;
    },

    // List all EM band names
    em_bands: () => {
      return Object.keys(EM_BANDS);
    },

    // Get band wavelength range [min, max] in meters
    em_band_range: (args) => {
      if (typeof args[0] !== "string")
        throw new Error("em_band_range: expected band name string");
      const band = EM_BANDS[args[0]];
      if (!band) throw new Error(`em_band_range: unknown band "${args[0]}"`);
      return [band.min, band.max];
    },

    // Map byte to specific application frequencies
    // em_app_freq(byte, "wifi") → frequency in Hz for WiFi band (2.4-5.8 GHz)
    em_app_freq: (args) => {
      if (typeof args[0] !== "number")
        throw new Error("em_app_freq: expected byte value (0-255)");
      const app = typeof args[1] === "string" ? args[1] : "wifi";
      const byte = Math.max(0, Math.min(255, Math.round(args[0])));
      const apps: Record<string, { min: number; max: number }> = {
        "am_radio":   { min: 530e3,    max: 1700e3 },    // AM: 530-1700 kHz
        "fm_radio":   { min: 88e6,     max: 108e6 },     // FM: 88-108 MHz
        "tv_vhf":     { min: 54e6,     max: 216e6 },     // TV VHF: 54-216 MHz
        "tv_uhf":     { min: 470e6,    max: 890e6 },     // TV UHF: 470-890 MHz
        "wifi":       { min: 2.4e9,    max: 5.8e9 },     // WiFi: 2.4-5.8 GHz
        "5g":         { min: 600e6,    max: 39e9 },      // 5G: 600 MHz - 39 GHz
        "5g_mmwave":  { min: 24e9,     max: 100e9 },     // 5G mmWave: 24-100 GHz
        "satellite":  { min: 1e9,      max: 40e9 },      // Satellite: 1-40 GHz
        "radar":      { min: 1e9,      max: 110e9 },     // Radar: 1-110 GHz
        "fiber":      { min: 186e12,   max: 196e12 },    // Fiber optic: 1530-1610nm → THz
        "quantum":    { min: 384e12,   max: 790e12 },    // Quantum optical: visible to near-IR
      };
      const range = apps[app];
      if (!range) throw new Error(`em_app_freq: unknown application "${app}". Available: ${Object.keys(apps).join(", ")}`);
      return range.min + (byte / 255) * (range.max - range.min);
    },
  };
}
