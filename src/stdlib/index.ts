import { LuxValue, Environment } from "../interpreter.js";
import { createIoBuiltins } from "./io.js";
import { createMathBuiltins } from "./math.js";
import { createStringBuiltins } from "./string.js";
import { createArrayBuiltins } from "./array.js";
import { createTypeBuiltins } from "./type.js";
import { createFsBuiltins } from "./fs.js";
import { createNetBuiltins } from "./net.js";
import { createOsBuiltins } from "./os.js";
import { createQuantumBuiltins } from "./quantum.js";

type BuiltinFn = (args: LuxValue[], env: Environment) => LuxValue;

export function createStdlib(output: string[]): Record<string, BuiltinFn> {
  const io = createIoBuiltins(output);
  const math = createMathBuiltins();
  const string = createStringBuiltins();
  const array = createArrayBuiltins();
  const type = createTypeBuiltins();
  const fs = createFsBuiltins();
  const net = createNetBuiltins();
  const os = createOsBuiltins();
  const quantum = createQuantumBuiltins();

  // Wrap simple builtins to match the (args, env) signature
  const wrap = (fns: Record<string, (args: LuxValue[]) => LuxValue>): Record<string, BuiltinFn> => {
    const result: Record<string, BuiltinFn> = {};
    for (const [name, fn] of Object.entries(fns)) {
      result[name] = (args, _env) => fn(args);
    }
    return result;
  };

  return {
    ...wrap(io),
    ...wrap(math),
    ...wrap(string),
    ...wrap(array),
    ...wrap(type),
    ...wrap(fs),
    ...wrap(net),
    ...wrap(os),
    ...wrap(quantum),
  };
}
