import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

export function createOsBuiltins(): Record<string, BuiltinFn> {
  return {
    os_args: () => {
      return process.argv.slice(2);
    },
    os_env: (args) => {
      if (typeof args[0] !== "string") throw new Error("os_env: expected string key");
      return process.env[args[0]] ?? null;
    },
    os_exit: (args) => {
      const code = typeof args[0] === "number" ? args[0] : 0;
      process.exit(code);
    },
    os_clock: () => {
      return Date.now() / 1000;
    },
    os_sleep: (args) => {
      if (typeof args[0] !== "number") throw new Error("os_sleep: expected number (milliseconds)");
      const { execSync } = require("node:child_process");
      execSync(`node -e "setTimeout(()=>{},${Math.floor(args[0])})"`, { timeout: args[0] + 5000 });
      return null;
    },
    os_platform: () => {
      return process.platform;
    },
    os_cwd: () => {
      return process.cwd();
    },
  };
}
