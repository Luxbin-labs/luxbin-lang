import * as fs from "node:fs";
import * as path from "node:path";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { interpret, Environment, LuxFunction, BuiltinFunction, LuxValue } from "./interpreter.js";
import { LuxbinError } from "./errors.js";
import { createStdlib } from "./stdlib/index.js";

interface ModuleCache {
  [absolutePath: string]: Environment;
}

export class ModuleLoader {
  private cache: ModuleCache = {};
  private loading: Set<string> = new Set();
  private output: string[];
  private globalEnv: Environment;

  constructor(output: string[]) {
    this.output = output;
    this.globalEnv = new Environment();

    // Register stdlib builtins in the global environment
    const builtins = createStdlib(output);
    for (const [name, fn] of Object.entries(builtins)) {
      this.globalEnv.define(name, {
        __type: "builtin",
        name,
        fn,
      } as BuiltinFunction, true);
    }
  }

  getGlobalEnv(): Environment {
    return this.globalEnv;
  }

  getOutput(): string[] {
    return this.output;
  }

  runFile(filePath: string): { output: string[]; error: string | null } {
    const absPath = path.resolve(filePath);
    try {
      const source = fs.readFileSync(absPath, "utf-8");
      const lexer = new Lexer(source, absPath);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, absPath);
      const program = parser.parse();

      const result = interpret(program, {
        file: absPath,
        output: this.output,
        globalEnv: this.globalEnv,
        onImport: (importPath, fromFile) => {
          this.importModule(importPath, fromFile);
        },
      });

      return { output: result.output, error: result.error };
    } catch (e) {
      if (e instanceof LuxbinError) {
        return { output: this.output, error: e.format() };
      }
      return { output: this.output, error: (e as Error).message };
    }
  }

  importModule(importPath: string, fromFile: string): void {
    const dir = path.dirname(fromFile);
    let resolved = path.resolve(dir, importPath);

    // Auto-append .lux extension
    if (!resolved.endsWith(".lux")) {
      resolved += ".lux";
    }

    // Circular import detection
    if (this.loading.has(resolved)) {
      throw new Error(`Circular import detected: ${resolved}`);
    }

    // Module cache — only execute once
    if (this.cache[resolved]) {
      this.mergeExports(this.cache[resolved]);
      return;
    }

    if (!fs.existsSync(resolved)) {
      throw new Error(`Module not found: ${resolved}`);
    }

    this.loading.add(resolved);

    try {
      const source = fs.readFileSync(resolved, "utf-8");
      const lexer = new Lexer(source, resolved);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, resolved);
      const program = parser.parse();

      // Create a child environment for the module
      const moduleEnv = new Environment(this.globalEnv);

      const result = interpret(program, {
        file: resolved,
        output: this.output,
        globalEnv: moduleEnv,
        onImport: (nestedPath, nestedFromFile) => {
          this.importModule(nestedPath, nestedFromFile);
        },
      });

      if (result.error) {
        throw new Error(`Error in module ${resolved}: ${result.error}`);
      }

      // Cache the module environment
      this.cache[resolved] = result.env;

      // Merge exported declarations into global env
      this.mergeExports(result.env);
    } finally {
      this.loading.delete(resolved);
    }
  }

  private mergeExports(moduleEnv: Environment): void {
    // Export all top-level functions and constants from the module
    for (const name of moduleEnv.getOwnNames()) {
      const entry = moduleEnv.getOwnEntry(name);
      if (!entry) continue;
      const val = entry.value;

      // Export functions and constants
      if (val && typeof val === "object" && "__type" in val) {
        if ((val as LuxFunction).__type === "function" || (val as BuiltinFunction).__type === "builtin") {
          if (!this.globalEnv.has(name)) {
            this.globalEnv.define(name, val, entry.constant);
          }
        }
      } else if (entry.constant) {
        if (!this.globalEnv.has(name)) {
          this.globalEnv.define(name, val, true);
        }
      }
    }
  }
}
