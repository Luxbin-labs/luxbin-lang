import { LuxValue } from "../interpreter.js";
import { stringify } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

export function createNetBuiltins(): Record<string, BuiltinFn> {
  return {
    net_fetch: (args) => {
      if (typeof args[0] !== "string") throw new Error("net_fetch: expected string URL");
      // Synchronous HTTP is not natively available in Node.js
      // Use child_process.execSync as a workaround for sync fetch
      const { execSync } = require("node:child_process");
      try {
        const result = execSync(`node -e "fetch('${args[0].replace(/'/g, "\\'")}').then(r=>r.text()).then(t=>process.stdout.write(t))"`, {
          encoding: "utf-8",
          timeout: 30000,
        });
        return result;
      } catch (e) {
        throw new Error(`net_fetch: ${(e as Error).message}`);
      }
    },
    net_fetch_json: (args) => {
      if (typeof args[0] !== "string") throw new Error("net_fetch_json: expected string URL");
      const { execSync } = require("node:child_process");
      try {
        const result = execSync(`node -e "fetch('${args[0].replace(/'/g, "\\'")}').then(r=>r.text()).then(t=>process.stdout.write(t))"`, {
          encoding: "utf-8",
          timeout: 30000,
        });
        return luxbinFromJson(JSON.parse(result));
      } catch (e) {
        throw new Error(`net_fetch_json: ${(e as Error).message}`);
      }
    },
    json_parse: (args) => {
      if (typeof args[0] !== "string") throw new Error("json_parse: expected string");
      try {
        return luxbinFromJson(JSON.parse(args[0]));
      } catch (e) {
        throw new Error(`json_parse: ${(e as Error).message}`);
      }
    },
    json_stringify: (args) => {
      return JSON.stringify(luxbinToJson(args[0]), null, 2);
    },
  };
}

function luxbinFromJson(val: unknown): LuxValue {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") return val;
  if (typeof val === "boolean") return val;
  if (Array.isArray(val)) return val.map(luxbinFromJson);
  if (typeof val === "object") {
    // Convert objects to arrays of [key, value] pairs
    return Object.entries(val as Record<string, unknown>).map(
      ([k, v]) => [k, luxbinFromJson(v)] as LuxValue[]
    );
  }
  return stringify(val as LuxValue);
}

function luxbinToJson(val: LuxValue): unknown {
  if (val === null) return null;
  if (typeof val === "number" || typeof val === "string" || typeof val === "boolean") return val;
  if (Array.isArray(val)) return val.map(luxbinToJson);
  return null;
}
