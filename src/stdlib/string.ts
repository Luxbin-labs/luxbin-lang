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

export function createStringBuiltins(): Record<string, BuiltinFn> {
  return {
    len: (args) => {
      const val = args[0];
      if (typeof val === "string") return val.length;
      if (Array.isArray(val)) return val.length;
      throw new Error("len: expected string or array");
    },
    concat: (args) => {
      return args.map(stringify).join("");
    },
    slice: (args) => {
      const val = args[0];
      const start = typeof args[1] === "number" ? args[1] : 0;
      const end = typeof args[2] === "number" ? args[2] : undefined;
      if (typeof val === "string") return val.slice(start, end);
      if (Array.isArray(val)) return val.slice(start, end);
      throw new Error("slice: expected string or array");
    },
    upper: (args) => {
      if (typeof args[0] !== "string") throw new Error("upper: expected string");
      return args[0].toUpperCase();
    },
    lower: (args) => {
      if (typeof args[0] !== "string") throw new Error("lower: expected string");
      return args[0].toLowerCase();
    },
    split: (args) => {
      if (typeof args[0] !== "string") throw new Error("split: expected string");
      const sep = typeof args[1] === "string" ? args[1] : "";
      return args[0].split(sep);
    },
    join: (args) => {
      if (!Array.isArray(args[0])) throw new Error("join: expected array");
      const sep = typeof args[1] === "string" ? args[1] : "";
      return args[0].map(stringify).join(sep);
    },
    trim: (args) => {
      if (typeof args[0] !== "string") throw new Error("trim: expected string");
      return args[0].trim();
    },
    contains: (args) => {
      if (typeof args[0] !== "string" || typeof args[1] !== "string")
        throw new Error("contains: expected two strings");
      return args[0].includes(args[1]);
    },
    replace: (args) => {
      if (typeof args[0] !== "string" || typeof args[1] !== "string" || typeof args[2] !== "string")
        throw new Error("replace: expected three strings");
      return args[0].split(args[1]).join(args[2]);
    },
  };
}
