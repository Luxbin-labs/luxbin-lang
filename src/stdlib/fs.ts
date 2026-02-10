import * as fs from "node:fs";
import * as path from "node:path";
import { LuxValue } from "../interpreter.js";

type BuiltinFn = (args: LuxValue[]) => LuxValue;

export function createFsBuiltins(): Record<string, BuiltinFn> {
  return {
    fs_read: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_read: expected string path");
      try {
        return fs.readFileSync(args[0], "utf-8");
      } catch (e) {
        throw new Error(`fs_read: ${(e as Error).message}`);
      }
    },
    fs_write: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_write: expected string path");
      if (typeof args[1] !== "string") throw new Error("fs_write: expected string content");
      try {
        fs.writeFileSync(args[0], args[1], "utf-8");
        return null;
      } catch (e) {
        throw new Error(`fs_write: ${(e as Error).message}`);
      }
    },
    fs_append: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_append: expected string path");
      if (typeof args[1] !== "string") throw new Error("fs_append: expected string content");
      try {
        fs.appendFileSync(args[0], args[1], "utf-8");
        return null;
      } catch (e) {
        throw new Error(`fs_append: ${(e as Error).message}`);
      }
    },
    fs_exists: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_exists: expected string path");
      return fs.existsSync(args[0]);
    },
    fs_mkdir: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_mkdir: expected string path");
      try {
        fs.mkdirSync(args[0], { recursive: true });
        return null;
      } catch (e) {
        throw new Error(`fs_mkdir: ${(e as Error).message}`);
      }
    },
    fs_readdir: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_readdir: expected string path");
      try {
        return fs.readdirSync(args[0]);
      } catch (e) {
        throw new Error(`fs_readdir: ${(e as Error).message}`);
      }
    },
    fs_remove: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_remove: expected string path");
      try {
        const stat = fs.statSync(args[0]);
        if (stat.isDirectory()) {
          fs.rmSync(args[0], { recursive: true });
        } else {
          fs.unlinkSync(args[0]);
        }
        return null;
      } catch (e) {
        throw new Error(`fs_remove: ${(e as Error).message}`);
      }
    },
    fs_basename: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_basename: expected string path");
      return path.basename(args[0]);
    },
    fs_dirname: (args) => {
      if (typeof args[0] !== "string") throw new Error("fs_dirname: expected string path");
      return path.dirname(args[0]);
    },
  };
}
