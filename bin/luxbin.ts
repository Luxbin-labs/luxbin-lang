#!/usr/bin/env node

import * as path from "node:path";
import { ModuleLoader } from "../src/module-loader.js";
import { startRepl } from "../src/repl.js";

const VERSION = "1.0.0";

function printUsage() {
  console.log(`LLL (LUXBIN Light Language) v${VERSION}`);
  console.log("");
  console.log("Usage:");
  console.log("  luxbin run <file.lux>     Execute a .lux file");
  console.log("  luxbin repl               Start interactive REPL");
  console.log("  luxbin <file.lux>         Shorthand for run");
  console.log("  luxbin --version          Print version");
  console.log("  luxbin --help             Print this help message");
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    startRepl();
    return;
  }

  const cmd = args[0];

  if (cmd === "--version" || cmd === "-v") {
    console.log(`LLL v${VERSION}`);
    return;
  }

  if (cmd === "--help" || cmd === "-h") {
    printUsage();
    return;
  }

  if (cmd === "repl") {
    startRepl();
    return;
  }

  // Run a file
  let filePath: string;
  if (cmd === "run") {
    if (!args[1]) {
      console.error("Error: missing file argument");
      console.error("Usage: luxbin run <file.lux>");
      process.exit(1);
    }
    filePath = args[1];
  } else {
    filePath = cmd;
  }

  // Resolve file path
  const resolved = path.resolve(filePath);

  const loader = new ModuleLoader([]);
  const result = loader.runFile(resolved);

  // Print output
  for (const line of result.output) {
    console.log(line);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
}

main();
