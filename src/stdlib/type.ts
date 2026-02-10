import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

function stringify(value: LuxValue): string {
  if (value === null) return "nil";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return "[" + value.map(stringify).join(", ") + "]";
  return String(value);
}

export function createTypeBuiltins(): Record<string, BuiltinFn> {
  return {
    to_int: (args) => {
      const val = args[0];
      if (typeof val === "number") return Math.floor(val);
      if (typeof val === "string") {
        const n = parseInt(val, 10);
        if (isNaN(n)) throw new Error(`to_int: cannot convert '${val}'`);
        return n;
      }
      if (typeof val === "boolean") return val ? 1 : 0;
      throw new Error("to_int: unsupported type");
    },
    to_float: (args) => {
      const val = args[0];
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const n = parseFloat(val);
        if (isNaN(n)) throw new Error(`to_float: cannot convert '${val}'`);
        return n;
      }
      if (typeof val === "boolean") return val ? 1.0 : 0.0;
      throw new Error("to_float: unsupported type");
    },
    to_string: (args) => {
      return stringify(args[0]);
    },
    to_bool: (args) => {
      const val = args[0];
      if (val === null || val === false || val === 0 || val === "") return false;
      return true;
    },
    type: (args) => {
      const val = args[0];
      if (val === null) return "nil";
      if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
      if (typeof val === "string") return "string";
      if (typeof val === "boolean") return "bool";
      if (Array.isArray(val)) return "array";
      if (typeof val === "object" && "__type" in val) return "function";
      return "unknown";
    },
  };
}
