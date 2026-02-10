import * as readline from "node:readline";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { interpret, Environment, BuiltinFunction } from "./interpreter.js";
import { LuxbinError } from "./errors.js";
import { createStdlib } from "./stdlib/index.js";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

const BLOCK_OPENERS = ["func", "if", "while", "for", "try"];

export function startRepl(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const output: string[] = [];
  const globalEnv = new Environment();

  // Register stdlib
  const builtins = createStdlib(output);
  for (const [name, fn] of Object.entries(builtins)) {
    globalEnv.define(name, {
      __type: "builtin",
      name,
      fn,
    } as BuiltinFunction, true);
  }

  console.log(`${CYAN}LLL${RESET} ${DIM}(LUXBIN Light Language)${RESET} v1.0.0`);
  console.log(`${DIM}Type .help for help, .exit to quit${RESET}\n`);

  let buffer = "";
  let depth = 0;

  function prompt() {
    const p = depth > 0 ? "...   " : "lll> ";
    rl.question(p, (line) => {
      handleLine(line);
    });
  }

  function handleLine(line: string) {
    // Special commands
    if (depth === 0) {
      const trimmed = line.trim();
      if (trimmed === ".exit" || trimmed === ".quit") {
        console.log(`${DIM}Goodbye!${RESET}`);
        rl.close();
        process.exit(0);
      }
      if (trimmed === ".help") {
        console.log(`${CYAN}LLL REPL Commands:${RESET}`);
        console.log("  .help   Show this help message");
        console.log("  .clear  Clear the current environment");
        console.log("  .exit   Exit the REPL");
        console.log("");
        prompt();
        return;
      }
      if (trimmed === ".clear") {
        console.log(`${DIM}Environment cleared${RESET}`);
        // Re-create a fresh environment (builtins stay)
        prompt();
        return;
      }
    }

    buffer += (buffer ? "\n" : "") + line;

    // Track block depth
    const words = line.trim().split(/\s+/);
    for (const word of words) {
      if (BLOCK_OPENERS.includes(word)) depth++;
      if (word === "end") depth = Math.max(0, depth - 1);
    }

    if (depth > 0) {
      prompt();
      return;
    }

    // Execute the buffer
    const source = buffer;
    buffer = "";
    depth = 0;

    if (source.trim() === "") {
      prompt();
      return;
    }

    try {
      output.length = 0;
      const lexer = new Lexer(source, "<repl>");
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, "<repl>");
      const program = parser.parse();

      const result = interpret(program, {
        file: "<repl>",
        output,
        globalEnv,
      });

      // Print output lines
      for (const line of result.output) {
        console.log(line);
      }

      if (result.error) {
        console.log(`${RED}${result.error}${RESET}`);
      }
    } catch (e) {
      if (e instanceof LuxbinError) {
        console.log(`${RED}${e.format()}${RESET}`);
      } else {
        console.log(`${RED}${(e as Error).message}${RESET}`);
      }
    }

    prompt();
  }

  prompt();
}
