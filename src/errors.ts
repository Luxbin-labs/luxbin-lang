export class LuxbinError extends Error {
  file: string;
  line: number;
  column: number;

  constructor(message: string, file = "<unknown>", line = 0, column = 0) {
    super(message);
    this.name = "LuxbinError";
    this.file = file;
    this.line = line;
    this.column = column;
  }

  format(): string {
    const loc = this.line > 0 ? ` at ${this.file}:${this.line}:${this.column}` : "";
    return `${this.name}: ${this.message}${loc}`;
  }
}

export class LexerError extends LuxbinError {
  constructor(message: string, file = "<unknown>", line = 0, column = 0) {
    super(message, file, line, column);
    this.name = "LexerError";
  }
}

export class ParseError extends LuxbinError {
  constructor(message: string, file = "<unknown>", line = 0, column = 0) {
    super(message, file, line, column);
    this.name = "ParseError";
  }
}

export class RuntimeError extends LuxbinError {
  callStack: StackFrame[];

  constructor(message: string, file = "<unknown>", line = 0, column = 0, callStack: StackFrame[] = []) {
    super(message, file, line, column);
    this.name = "RuntimeError";
    this.callStack = callStack;
  }

  format(): string {
    let result = `${this.name}: ${this.message}`;
    if (this.line > 0) {
      result += `\n  at ${this.file}:${this.line}:${this.column}`;
    }
    for (const frame of this.callStack) {
      result += `\n  at ${frame.name} (${frame.file}:${frame.line}:${frame.column})`;
    }
    return result;
  }
}

export interface StackFrame {
  name: string;
  file: string;
  line: number;
  column: number;
}
