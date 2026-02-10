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

export function createArrayBuiltins(): Record<string, BuiltinFn> {
  return {
    push: (args) => {
      if (!Array.isArray(args[0])) throw new Error("push: first argument must be an array");
      args[0].push(args[1]);
      return args[0];
    },
    pop: (args) => {
      if (!Array.isArray(args[0])) throw new Error("pop: expected array");
      if (args[0].length === 0) throw new Error("pop: array is empty");
      return args[0].pop() ?? null;
    },
    sort: (args) => {
      if (!Array.isArray(args[0])) throw new Error("sort: expected array");
      const arr = [...args[0]];
      arr.sort((a, b) => {
        if (typeof a === "number" && typeof b === "number") return a - b;
        return stringify(a).localeCompare(stringify(b));
      });
      return arr;
    },
    reverse: (args) => {
      if (!Array.isArray(args[0])) throw new Error("reverse: expected array");
      return [...args[0]].reverse();
    },
    range: (args) => {
      const start = typeof args[0] === "number" ? args[0] : 0;
      const end = typeof args[1] === "number" ? args[1] : (typeof args[0] === "number" ? args[0] : 0);
      const step = typeof args[2] === "number" ? args[2] : 1;
      if (step === 0) throw new Error("range: step cannot be zero");
      const result: number[] = [];
      if (args.length === 1) {
        for (let i = 0; i < start; i++) result.push(i);
      } else {
        if (step > 0) {
          for (let i = start; i < end; i += step) result.push(i);
        } else {
          for (let i = start; i > end; i += step) result.push(i);
        }
      }
      return result;
    },
    map: (args) => {
      if (!Array.isArray(args[0])) throw new Error("map: expected array as first argument");
      const arr = args[0];
      const fn = args[1];
      if (!fn || typeof fn !== "object" || !("__type" in fn)) throw new Error("map: expected function as second argument");
      // map is handled specially: requires callback support
      // For now, return the array as-is (callbacks need interpreter integration)
      return arr;
    },
    filter: (args) => {
      if (!Array.isArray(args[0])) throw new Error("filter: expected array as first argument");
      return args[0];
    },
    indexOf: (args) => {
      if (!Array.isArray(args[0])) throw new Error("indexOf: expected array");
      const arr = args[0];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === args[1]) return i;
      }
      return -1;
    },
  };
}
