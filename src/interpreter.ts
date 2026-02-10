import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
} from "./types.js";
import { RuntimeError, StackFrame } from "./errors.js";
import { createStdlib } from "./stdlib/index.js";

// ── Runtime Values ──────────────────────────────────────────

export type LuxValue = number | string | boolean | null | LuxValue[] | LuxFunction | BuiltinFunction;

export interface LuxFunction {
  __type: "function";
  declaration: FunctionDeclaration;
  closure: Environment;
}

export interface BuiltinFunction {
  __type: "builtin";
  name: string;
  fn: (args: LuxValue[], env: Environment) => LuxValue;
}

// ── Control Flow Signals ────────────────────────────────────

class ReturnSignal {
  value: LuxValue;
  constructor(value: LuxValue) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

// ── Environment (Scope Chain) ───────────────────────────────

export class Environment {
  private vars: Map<string, { value: LuxValue; constant: boolean }> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: LuxValue, constant = false) {
    this.vars.set(name, { value, constant });
  }

  get(name: string): LuxValue {
    const entry = this.vars.get(name);
    if (entry !== undefined) return entry.value;
    if (this.parent) return this.parent.get(name);
    throw new Error(`Undefined variable: '${name}'`);
  }

  set(name: string, value: LuxValue) {
    const entry = this.vars.get(name);
    if (entry !== undefined) {
      if (entry.constant) throw new Error(`Cannot reassign constant: '${name}'`);
      entry.value = value;
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new Error(`Undefined variable: '${name}'`);
  }

  has(name: string): boolean {
    if (this.vars.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  getOwnNames(): string[] {
    return [...this.vars.keys()];
  }

  getOwnEntry(name: string): { value: LuxValue; constant: boolean } | undefined {
    return this.vars.get(name);
  }
}

// ── Interpreter ─────────────────────────────────────────────

export interface InterpreterOptions {
  file?: string;
  output?: string[];
  globalEnv?: Environment;
  onImport?: (path: string, fromFile: string) => void;
}

const STEP_LIMIT = 10_000_000;

export function interpret(program: Program, options: InterpreterOptions = {}): {
  output: string[];
  steps: number;
  error: string | null;
  env: Environment;
} {
  const output = options.output ?? [];
  const file = options.file ?? "<stdin>";
  let steps = 0;
  const callStack: StackFrame[] = [];

  function step() {
    steps++;
    if (steps > STEP_LIMIT) {
      throw new RuntimeError(
        "Execution limit exceeded (10,000,000 steps). Possible infinite loop.",
        file, 0, 0, [...callStack]
      );
    }
  }

  // Create global environment with builtins
  const globalEnv = options.globalEnv ?? new Environment();
  if (!options.globalEnv) {
    const builtins = createStdlib(output);
    for (const [name, fn] of Object.entries(builtins)) {
      globalEnv.define(name, {
        __type: "builtin",
        name,
        fn,
      } as BuiltinFunction, true);
    }
  }

  function executeBlock(statements: Statement[], env: Environment): ReturnSignal | BreakSignal | ContinueSignal | void {
    for (const stmt of statements) {
      const result = executeStatement(stmt, env);
      if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) {
        return result;
      }
    }
  }

  function executeStatement(stmt: Statement, env: Environment): ReturnSignal | BreakSignal | ContinueSignal | void {
    step();
    switch (stmt.type) {
      case "LetDeclaration": {
        const value = stmt.value ? evaluateExpression(stmt.value, env) : null;
        env.define(stmt.name, value, false);
        return;
      }
      case "ConstDeclaration": {
        const value = evaluateExpression(stmt.value, env);
        env.define(stmt.name, value, true);
        return;
      }
      case "Assignment": {
        const value = evaluateExpression(stmt.value, env);
        try {
          env.set(stmt.name, value);
        } catch (e) {
          throw new RuntimeError(
            (e as Error).message,
            file, stmt.line, stmt.column, [...callStack]
          );
        }
        return;
      }
      case "IndexAssignment": {
        const arr = env.get(stmt.name);
        if (!Array.isArray(arr)) {
          throw new RuntimeError(`'${stmt.name}' is not an array`, file, stmt.line, stmt.column, [...callStack]);
        }
        const index = evaluateExpression(stmt.index, env);
        if (typeof index !== "number") {
          throw new RuntimeError("Array index must be a number", file, stmt.line, stmt.column, [...callStack]);
        }
        const idx = Math.floor(index);
        if (idx < 0 || idx >= arr.length) {
          throw new RuntimeError(`Index ${idx} out of bounds (length ${arr.length})`, file, stmt.line, stmt.column, [...callStack]);
        }
        arr[idx] = evaluateExpression(stmt.value, env);
        return;
      }
      case "ExpressionStatement": {
        evaluateExpression(stmt.expression, env);
        return;
      }
      case "FunctionDeclaration": {
        const func: LuxFunction = {
          __type: "function",
          declaration: stmt,
          closure: env,
        };
        env.define(stmt.name, func, true);
        return;
      }
      case "ReturnStatement": {
        const value = stmt.value ? evaluateExpression(stmt.value, env) : null;
        return new ReturnSignal(value);
      }
      case "BreakStatement":
        return new BreakSignal();
      case "ContinueStatement":
        return new ContinueSignal();
      case "IfStatement": {
        const cond = evaluateExpression(stmt.condition, env);
        if (isTruthy(cond)) {
          return executeBlock(stmt.consequent, new Environment(env));
        }
        for (const alt of stmt.alternateConditions) {
          const altCond = evaluateExpression(alt.condition, env);
          if (isTruthy(altCond)) {
            return executeBlock(alt.body, new Environment(env));
          }
        }
        if (stmt.alternate) {
          return executeBlock(stmt.alternate, new Environment(env));
        }
        return;
      }
      case "WhileStatement": {
        while (isTruthy(evaluateExpression(stmt.condition, env))) {
          step();
          const blockEnv = new Environment(env);
          const result = executeBlock(stmt.body, blockEnv);
          if (result instanceof ReturnSignal) return result;
          if (result instanceof BreakSignal) break;
          // ContinueSignal just continues the loop
        }
        return;
      }
      case "ForStatement": {
        const iterable = evaluateExpression(stmt.iterable, env);
        if (!Array.isArray(iterable)) {
          throw new RuntimeError("for..in requires an array", file, stmt.line, stmt.column, [...callStack]);
        }
        for (const item of iterable) {
          step();
          const blockEnv = new Environment(env);
          blockEnv.define(stmt.variable, item, false);
          const result = executeBlock(stmt.body, blockEnv);
          if (result instanceof ReturnSignal) return result;
          if (result instanceof BreakSignal) break;
        }
        return;
      }
      case "ImportStatement": {
        if (options.onImport) {
          options.onImport(stmt.path, file);
        }
        return;
      }
      case "TryCatchStatement": {
        try {
          const result = executeBlock(stmt.tryBody, new Environment(env));
          if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) {
            return result;
          }
        } catch (e) {
          const catchEnv = new Environment(env);
          const errorMsg = e instanceof Error ? e.message : String(e);
          catchEnv.define(stmt.catchVariable, errorMsg, false);
          const result = executeBlock(stmt.catchBody, catchEnv);
          if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) {
            return result;
          }
        }
        return;
      }
    }
  }

  function evaluateExpression(expr: Expression, env: Environment): LuxValue {
    step();
    switch (expr.type) {
      case "NumberLiteral":
        return expr.value;
      case "StringLiteral":
        return expr.value;
      case "BooleanLiteral":
        return expr.value;
      case "NilLiteral":
        return null;
      case "Identifier": {
        try {
          return env.get(expr.name);
        } catch {
          throw new RuntimeError(`Undefined variable: '${expr.name}'`, file, 0, 0, [...callStack]);
        }
      }
      case "ArrayLiteral":
        return expr.elements.map((e) => evaluateExpression(e, env));
      case "UnaryExpression": {
        const operand = evaluateExpression(expr.operand, env);
        switch (expr.operator) {
          case "-":
            if (typeof operand !== "number") throw new RuntimeError("Unary '-' requires a number", file, 0, 0, [...callStack]);
            return -operand;
          case "not":
            return !isTruthy(operand);
          default:
            throw new RuntimeError(`Unknown unary operator: ${expr.operator}`, file, 0, 0, [...callStack]);
        }
      }
      case "BinaryExpression": {
        // Short-circuit for logical operators
        if (expr.operator === "and") {
          const left = evaluateExpression(expr.left, env);
          if (!isTruthy(left)) return left;
          return evaluateExpression(expr.right, env);
        }
        if (expr.operator === "or") {
          const left = evaluateExpression(expr.left, env);
          if (isTruthy(left)) return left;
          return evaluateExpression(expr.right, env);
        }

        const left = evaluateExpression(expr.left, env);
        const right = evaluateExpression(expr.right, env);
        return evaluateBinaryOp(expr.operator, left, right);
      }
      case "CallExpression": {
        const callee = (() => {
          try { return env.get(expr.callee); } catch {
            throw new RuntimeError(`Undefined function: '${expr.callee}'`, file, expr.line, expr.column, [...callStack]);
          }
        })();
        const args = expr.arguments.map((a) => evaluateExpression(a, env));

        if (callee && typeof callee === "object" && "__type" in callee) {
          if (callee.__type === "builtin") {
            try {
              return (callee as BuiltinFunction).fn(args, env);
            } catch (e) {
              if (e instanceof RuntimeError) throw e;
              throw new RuntimeError((e as Error).message, file, expr.line, expr.column, [...callStack]);
            }
          }
          if (callee.__type === "function") {
            const func = callee as LuxFunction;
            callStack.push({ name: func.declaration.name, file, line: expr.line, column: expr.column });
            const funcEnv = new Environment(func.closure);
            const params = func.declaration.params;
            for (let i = 0; i < params.length; i++) {
              funcEnv.define(params[i].name, i < args.length ? args[i] : null, false);
            }
            const result = executeBlock(func.declaration.body, funcEnv);
            callStack.pop();
            if (result instanceof ReturnSignal) return result.value;
            return null;
          }
        }
        throw new RuntimeError(`'${expr.callee}' is not a function`, file, expr.line, expr.column, [...callStack]);
      }
      case "IndexExpression": {
        const obj = evaluateExpression(expr.object, env);
        const index = evaluateExpression(expr.index, env);
        if (Array.isArray(obj)) {
          if (typeof index !== "number") throw new RuntimeError("Array index must be a number", file, 0, 0, [...callStack]);
          const idx = Math.floor(index);
          if (idx < 0 || idx >= obj.length) throw new RuntimeError(`Index ${idx} out of bounds (length ${obj.length})`, file, 0, 0, [...callStack]);
          return obj[idx];
        }
        if (typeof obj === "string") {
          if (typeof index !== "number") throw new RuntimeError("String index must be a number", file, 0, 0, [...callStack]);
          const idx = Math.floor(index);
          if (idx < 0 || idx >= obj.length) throw new RuntimeError(`Index ${idx} out of bounds (length ${obj.length})`, file, 0, 0, [...callStack]);
          return obj[idx];
        }
        throw new RuntimeError("Index operator requires an array or string", file, 0, 0, [...callStack]);
      }
    }
  }

  function evaluateBinaryOp(op: string, left: LuxValue, right: LuxValue): LuxValue {
    // String concatenation
    if (op === "+" && (typeof left === "string" || typeof right === "string")) {
      return stringify(left) + stringify(right);
    }

    // Arithmetic
    if (typeof left === "number" && typeof right === "number") {
      switch (op) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/":
          if (right === 0) throw new RuntimeError("Division by zero", file, 0, 0, [...callStack]);
          return left / right;
        case "%":
          if (right === 0) throw new RuntimeError("Division by zero", file, 0, 0, [...callStack]);
          return left % right;
        case "^": return Math.pow(left, right);
        case "<": return left < right;
        case ">": return left > right;
        case "<=": return left <= right;
        case ">=": return left >= right;
        case "==": return left === right;
        case "!=": return left !== right;
      }
    }

    // Equality for all types
    if (op === "==") return left === right;
    if (op === "!=") return left !== right;

    // Comparison for strings
    if (typeof left === "string" && typeof right === "string") {
      switch (op) {
        case "<": return left < right;
        case ">": return left > right;
        case "<=": return left <= right;
        case ">=": return left >= right;
      }
    }

    throw new RuntimeError(
      `Cannot apply operator '${op}' to ${typeOf(left)} and ${typeOf(right)}`,
      file, 0, 0, [...callStack]
    );
  }

  // ── Run ───────────────────────────────────────────────────

  try {
    executeBlock(program.body, globalEnv);
    return { output, steps, error: null, env: globalEnv };
  } catch (e) {
    if (e instanceof RuntimeError) {
      return { output, steps, error: e.format(), env: globalEnv };
    }
    const message = e instanceof Error ? e.message : String(e);
    return { output, steps, error: message, env: globalEnv };
  }
}

// ── Utility functions (exported for use by stdlib and module loader) ──

export function isTruthy(value: LuxValue): boolean {
  if (value === null) return false;
  if (value === false) return false;
  if (value === 0) return false;
  if (value === "") return false;
  return true;
}

export function stringify(value: LuxValue): string {
  if (value === null) return "nil";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return "[" + value.map(stringify).join(", ") + "]";
  if (typeof value === "object" && "__type" in value) {
    if (value.__type === "function") return `<function ${(value as LuxFunction).declaration.name}>`;
    if (value.__type === "builtin") return `<builtin ${(value as BuiltinFunction).name}>`;
  }
  return String(value);
}

export function typeOf(value: LuxValue): string {
  if (value === null) return "nil";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && "__type" in value) {
    return value.__type === "function" ? "function" : "builtin";
  }
  return typeof value;
}
