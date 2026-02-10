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

describe("Standard Library", () => {
  describe("Math", () => {
    it("abs", () => {
      const r = run("println(to_string(abs(-5)))");
      assert.deepEqual(r.output, ["5"]);
    });

    it("sqrt", () => {
      const r = run("println(to_string(sqrt(9)))");
      assert.deepEqual(r.output, ["3"]);
    });

    it("pow", () => {
      const r = run("println(to_string(pow(2, 10)))");
      assert.deepEqual(r.output, ["1024"]);
    });

    it("floor and ceil", () => {
      const r = run("println(to_string(floor(3.7)))\nprintln(to_string(ceil(3.2)))");
      assert.deepEqual(r.output, ["3", "4"]);
    });

    it("min and max", () => {
      const r = run("println(to_string(min(1, 2, 3)))\nprintln(to_string(max(1, 2, 3)))");
      assert.deepEqual(r.output, ["1", "3"]);
    });

    it("round", () => {
      const r = run("println(to_string(round(3.5)))");
      assert.deepEqual(r.output, ["4"]);
    });

    it("random returns number between 0 and 1", () => {
      const r = run("let x = random()\nprintln(to_string(x >= 0 and x < 1))");
      assert.deepEqual(r.output, ["true"]);
    });
  });

  describe("String", () => {
    it("len", () => {
      const r = run('println(to_string(len("hello")))');
      assert.deepEqual(r.output, ["5"]);
    });

    it("upper and lower", () => {
      const r = run('println(upper("hello"))\nprintln(lower("WORLD"))');
      assert.deepEqual(r.output, ["HELLO", "world"]);
    });

    it("concat", () => {
      const r = run('println(concat("a", "b", "c"))');
      assert.deepEqual(r.output, ["abc"]);
    });

    it("slice", () => {
      const r = run('println(slice("hello", 1, 3))');
      assert.deepEqual(r.output, ["el"]);
    });

    it("contains", () => {
      const r = run('println(to_string(contains("hello world", "world")))');
      assert.deepEqual(r.output, ["true"]);
    });

    it("replace", () => {
      const r = run('println(replace("hello world", "world", "LLL"))');
      assert.deepEqual(r.output, ["hello LLL"]);
    });

    it("trim", () => {
      const r = run('println(trim("  hello  "))');
      assert.deepEqual(r.output, ["hello"]);
    });

    it("split and join", () => {
      const r = run('let parts = split("a,b,c", ",")\nprintln(join(parts, " - "))');
      assert.deepEqual(r.output, ["a - b - c"]);
    });
  });

  describe("Array", () => {
    it("push and pop", () => {
      const r = run("let arr = [1, 2]\npush(arr, 3)\nprintln(to_string(arr))\nlet x = pop(arr)\nprintln(to_string(x))");
      assert.deepEqual(r.output, ["[1, 2, 3]", "3"]);
    });

    it("sort", () => {
      const r = run("println(to_string(sort([3, 1, 2])))");
      assert.deepEqual(r.output, ["[1, 2, 3]"]);
    });

    it("reverse", () => {
      const r = run("println(to_string(reverse([1, 2, 3])))");
      assert.deepEqual(r.output, ["[3, 2, 1]"]);
    });

    it("range with one arg", () => {
      const r = run("println(to_string(range(5)))");
      assert.deepEqual(r.output, ["[0, 1, 2, 3, 4]"]);
    });

    it("range with two args", () => {
      const r = run("println(to_string(range(2, 6)))");
      assert.deepEqual(r.output, ["[2, 3, 4, 5]"]);
    });

    it("range with step", () => {
      const r = run("println(to_string(range(0, 10, 2)))");
      assert.deepEqual(r.output, ["[0, 2, 4, 6, 8]"]);
    });

    it("indexOf", () => {
      const r = run("println(to_string(indexOf([10, 20, 30], 20)))");
      assert.deepEqual(r.output, ["1"]);
    });

    it("len for arrays", () => {
      const r = run("println(to_string(len([1, 2, 3])))");
      assert.deepEqual(r.output, ["3"]);
    });
  });

  describe("Type", () => {
    it("to_int", () => {
      const r = run('println(to_string(to_int(3.7)))\nprintln(to_string(to_int("42")))');
      assert.deepEqual(r.output, ["3", "42"]);
    });

    it("to_float", () => {
      const r = run('println(to_string(to_float("3.14")))');
      assert.deepEqual(r.output, ["3.14"]);
    });

    it("to_string", () => {
      const r = run("println(to_string(42))");
      assert.deepEqual(r.output, ["42"]);
    });

    it("to_bool", () => {
      const r = run("println(to_string(to_bool(0)))\nprintln(to_string(to_bool(1)))");
      assert.deepEqual(r.output, ["false", "true"]);
    });

    it("type", () => {
      const r = run('println(type(42))\nprintln(type("hi"))\nprintln(type(true))\nprintln(type(nil))\nprintln(type([1]))');
      assert.deepEqual(r.output, ["int", "string", "bool", "nil", "array"]);
    });
  });

  describe("Quantum", () => {
    it("superpose returns array", () => {
      const r = run("let s = superpose([0, 1])\nprintln(to_string(len(s)))");
      assert.deepEqual(r.output, ["2"]);
    });

    it("measure returns element from array", () => {
      const r = run("let s = superpose([42])\nlet m = measure(s)\nprintln(to_string(m))");
      assert.deepEqual(r.output, ["42"]);
    });

    it("entangle returns pair", () => {
      const r = run('let pair = entangle("A", "B")\nprintln(to_string(len(pair)))');
      assert.deepEqual(r.output, ["2"]);
    });

    it("hadamard returns 0 or 1", () => {
      const r = run("let h = hadamard(0)\nprintln(to_string(h == 0 or h == 1))");
      assert.deepEqual(r.output, ["true"]);
    });

    it("photon_wavelength maps char to nm", () => {
      const r = run('let w = photon_wavelength("A")\nprintln(to_string(w > 0))');
      assert.deepEqual(r.output, ["true"]);
    });
  });

  describe("File System", () => {
    it("fs_write and fs_read", () => {
      const r = run('fs_write("/tmp/lll-test.txt", "hello")\nlet c = fs_read("/tmp/lll-test.txt")\nprintln(c)\nfs_remove("/tmp/lll-test.txt")');
      assert.deepEqual(r.output, ["hello"]);
      assert.equal(r.error, null);
    });

    it("fs_exists", () => {
      const r = run('println(to_string(fs_exists("/tmp")))\nprintln(to_string(fs_exists("/tmp/nonexistent-lll-test-xyz")))');
      assert.deepEqual(r.output, ["true", "false"]);
    });
  });

  describe("OS", () => {
    it("os_clock returns a number", () => {
      const r = run("let t = os_clock()\nprintln(to_string(t > 0))");
      assert.deepEqual(r.output, ["true"]);
    });

    it("os_platform returns a string", () => {
      const r = run('println(to_string(type(os_platform()) == "string"))');
      assert.deepEqual(r.output, ["true"]);
    });

    it("os_cwd returns a string", () => {
      const r = run("let d = os_cwd()\nprintln(to_string(len(d) > 0))");
      assert.deepEqual(r.output, ["true"]);
    });
  });
});
