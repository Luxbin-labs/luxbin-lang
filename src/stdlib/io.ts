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

export function createIoBuiltins(output: string[]): Record<string, BuiltinFn> {
  return {
    print: (args) => {
      output.push(args.map(stringify).join(" "));
      return null;
    },
    println: (args) => {
      output.push(args.map(stringify).join(" "));
      return null;
    },
    input: (args) => {
      // In CLI mode, this is replaced by the REPL/runner with readline
      // Default: return empty string
      const _prompt = args.length > 0 ? stringify(args[0]) : "";
      return "";
    },
  };
}
