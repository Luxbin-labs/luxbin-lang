import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

export function createMathBuiltins(): Record<string, BuiltinFn> {
  return {
    abs: (args) => {
      if (typeof args[0] !== "number") throw new Error("abs: expected number");
      return Math.abs(args[0]);
    },
    sqrt: (args) => {
      if (typeof args[0] !== "number") throw new Error("sqrt: expected number");
      return Math.sqrt(args[0]);
    },
    pow: (args) => {
      if (typeof args[0] !== "number" || typeof args[1] !== "number")
        throw new Error("pow: expected two numbers");
      return Math.pow(args[0], args[1]);
    },
    sin: (args) => {
      if (typeof args[0] !== "number") throw new Error("sin: expected number");
      return Math.sin(args[0]);
    },
    cos: (args) => {
      if (typeof args[0] !== "number") throw new Error("cos: expected number");
      return Math.cos(args[0]);
    },
    tan: (args) => {
      if (typeof args[0] !== "number") throw new Error("tan: expected number");
      return Math.tan(args[0]);
    },
    floor: (args) => {
      if (typeof args[0] !== "number") throw new Error("floor: expected number");
      return Math.floor(args[0]);
    },
    ceil: (args) => {
      if (typeof args[0] !== "number") throw new Error("ceil: expected number");
      return Math.ceil(args[0]);
    },
    round: (args) => {
      if (typeof args[0] !== "number") throw new Error("round: expected number");
      return Math.round(args[0]);
    },
    min: (args) => {
      const nums = args.filter((a): a is number => typeof a === "number");
      if (nums.length === 0) throw new Error("min: expected at least one number");
      return Math.min(...nums);
    },
    max: (args) => {
      const nums = args.filter((a): a is number => typeof a === "number");
      if (nums.length === 0) throw new Error("max: expected at least one number");
      return Math.max(...nums);
    },
    random: () => {
      return Math.random();
    },
  };
}
