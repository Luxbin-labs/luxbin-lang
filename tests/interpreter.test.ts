import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { interpret } from "../src/interpreter.js";

function run(source: string) {
  const tokens = new Lexer(source).tokenize();
  const program = new Parser(tokens).parse();
  return interpret(program);
}

describe("Interpreter", () => {
  it("executes print statements", () => {
    const result = run('println("hello")');
    assert.equal(result.error, null);
    assert.deepEqual(result.output, ["hello"]);
  });

  it("handles variable declarations", () => {
    const result = run('let x = 42\nprintln(to_string(x))');
    assert.equal(result.error, null);
    assert.deepEqual(result.output, ["42"]);
  });

  it("handles const declarations", () => {
    const result = run('const PI = 3.14\nprintln(to_string(PI))');
    assert.equal(result.error, null);
    assert.deepEqual(result.output, ["3.14"]);
  });

  it("prevents const reassignment", () => {
    const result = run("const x = 1\nx = 2");
    assert.ok(result.error);
    assert.ok(result.error!.includes("Cannot reassign constant"));
  });

  it("handles arithmetic", () => {
    const result = run("println(to_string(2 + 3 * 4))");
    assert.deepEqual(result.output, ["14"]);
  });

  it("handles string concatenation", () => {
    const result = run('println("hello" + " " + "world")');
    assert.deepEqual(result.output, ["hello world"]);
  });

  it("handles if/else", () => {
    const result = run('if 1 > 0 then\nprintln("yes")\nelse\nprintln("no")\nend');
    assert.deepEqual(result.output, ["yes"]);
  });

  it("handles while loops", () => {
    const result = run("let i = 0\nwhile i < 3 do\nprintln(to_string(i))\ni = i + 1\nend");
    assert.deepEqual(result.output, ["0", "1", "2"]);
  });

  it("handles for loops", () => {
    const result = run("for x in [10, 20, 30] do\nprintln(to_string(x))\nend");
    assert.deepEqual(result.output, ["10", "20", "30"]);
  });

  it("handles functions", () => {
    const result = run("func add(a, b)\nreturn a + b\nend\nprintln(to_string(add(3, 4)))");
    assert.deepEqual(result.output, ["7"]);
  });

  it("handles recursive functions", () => {
    const result = run("func fac(n)\nif n <= 1 then\nreturn 1\nend\nreturn n * fac(n - 1)\nend\nprintln(to_string(fac(5)))");
    assert.deepEqual(result.output, ["120"]);
  });

  it("handles break in loops", () => {
    const result = run("let i = 0\nwhile true do\nif i == 3 then\nbreak\nend\ni = i + 1\nend\nprintln(to_string(i))");
    assert.deepEqual(result.output, ["3"]);
  });

  it("handles continue in loops", () => {
    const result = run("for i in range(5) do\nif i == 2 then\ncontinue\nend\nprintln(to_string(i))\nend");
    assert.deepEqual(result.output, ["0", "1", "3", "4"]);
  });

  it("handles array indexing", () => {
    const result = run("let arr = [10, 20, 30]\nprintln(to_string(arr[1]))");
    assert.deepEqual(result.output, ["20"]);
  });

  it("handles index assignment", () => {
    const result = run("let arr = [1, 2, 3]\narr[1] = 99\nprintln(to_string(arr[1]))");
    assert.deepEqual(result.output, ["99"]);
  });

  it("handles try/catch", () => {
    const result = run('try\nlet x = 1 / 0\ncatch err\nprintln("caught: " + err)\nend');
    assert.equal(result.error, null);
    assert.equal(result.output.length, 1);
    assert.ok(result.output[0].includes("caught:"));
  });

  it("handles closures", () => {
    const result = run("func make_counter()\nlet count = 0\nfunc inc()\ncount = count + 1\nreturn count\nend\nreturn inc\nend\nlet c = make_counter()\nprintln(to_string(c()))\nprintln(to_string(c()))");
    assert.deepEqual(result.output, ["1", "2"]);
  });

  it("handles nested scopes", () => {
    const result = run('let x = "outer"\nif true then\nlet x = "inner"\nprintln(x)\nend\nprintln(x)');
    assert.deepEqual(result.output, ["inner", "outer"]);
  });

  it("handles logical operators", () => {
    const result = run("println(to_string(true and false))\nprintln(to_string(true or false))");
    assert.deepEqual(result.output, ["false", "true"]);
  });

  it("handles comparison operators", () => {
    const result = run("println(to_string(1 < 2))\nprintln(to_string(2 >= 2))\nprintln(to_string(3 == 3))\nprintln(to_string(3 != 4))");
    assert.deepEqual(result.output, ["true", "true", "true", "true"]);
  });

  it("handles nil", () => {
    const result = run("let x = nil\nprintln(to_string(x))");
    assert.deepEqual(result.output, ["nil"]);
  });

  it("reports division by zero", () => {
    const result = run("let x = 1 / 0");
    assert.ok(result.error);
    assert.ok(result.error!.includes("Division by zero"));
  });

  it("reports undefined variables", () => {
    const result = run("println(to_string(xyz))");
    assert.ok(result.error);
    assert.ok(result.error!.includes("Undefined variable"));
  });
});
