import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

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

    // Wavelength (Photonic Encoding)
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
  };
}
