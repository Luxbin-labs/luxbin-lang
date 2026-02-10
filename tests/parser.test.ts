import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

function parse(source: string) {
  const tokens = new Lexer(source).tokenize();
  return new Parser(tokens).parse();
}

describe("Parser", () => {
  it("parses let declarations", () => {
    const ast = parse("let x = 42");
    assert.equal(ast.body.length, 1);
    assert.equal(ast.body[0].type, "LetDeclaration");
    const decl = ast.body[0] as any;
    assert.equal(decl.name, "x");
    assert.equal(decl.value.type, "NumberLiteral");
    assert.equal(decl.value.value, 42);
  });

  it("parses const declarations", () => {
    const ast = parse("const PI = 3.14");
    assert.equal(ast.body[0].type, "ConstDeclaration");
    const decl = ast.body[0] as any;
    assert.equal(decl.name, "PI");
    assert.equal(decl.value.value, 3.14);
  });

  it("parses assignments", () => {
    const ast = parse("let x = 1\nx = 2");
    assert.equal(ast.body[1].type, "Assignment");
  });

  it("parses if statements", () => {
    const ast = parse("if true then\nlet x = 1\nend");
    assert.equal(ast.body[0].type, "IfStatement");
    const stmt = ast.body[0] as any;
    assert.equal(stmt.consequent.length, 1);
  });

  it("parses if/else statements", () => {
    const ast = parse("if true then\nlet x = 1\nelse\nlet x = 2\nend");
    const stmt = ast.body[0] as any;
    assert.ok(stmt.alternate);
    assert.equal(stmt.alternate.length, 1);
  });

  it("parses else if chains", () => {
    const ast = parse("if x == 1 then\nlet a = 1\nelse if x == 2 then\nlet a = 2\nelse\nlet a = 3\nend");
    const stmt = ast.body[0] as any;
    assert.equal(stmt.alternateConditions.length, 1);
    assert.ok(stmt.alternate);
  });

  it("parses while loops", () => {
    const ast = parse("while true do\nbreak\nend");
    assert.equal(ast.body[0].type, "WhileStatement");
  });

  it("parses for loops", () => {
    const ast = parse("for x in [1, 2, 3] do\nlet y = x\nend");
    assert.equal(ast.body[0].type, "ForStatement");
    const stmt = ast.body[0] as any;
    assert.equal(stmt.variable, "x");
  });

  it("parses function declarations", () => {
    const ast = parse("func add(a, b)\nreturn a + b\nend");
    assert.equal(ast.body[0].type, "FunctionDeclaration");
    const func = ast.body[0] as any;
    assert.equal(func.name, "add");
    assert.equal(func.params.length, 2);
  });

  it("parses function calls", () => {
    const ast = parse("print(42)");
    assert.equal(ast.body[0].type, "ExpressionStatement");
    const expr = (ast.body[0] as any).expression;
    assert.equal(expr.type, "CallExpression");
    assert.equal(expr.callee, "print");
  });

  it("parses binary expressions with precedence", () => {
    const ast = parse("let x = 1 + 2 * 3");
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "BinaryExpression");
    assert.equal(val.operator, "+");
    assert.equal(val.right.operator, "*");
  });

  it("parses unary expressions", () => {
    const ast = parse("let x = -42");
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "UnaryExpression");
    assert.equal(val.operator, "-");
  });

  it("parses array literals", () => {
    const ast = parse("let arr = [1, 2, 3]");
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "ArrayLiteral");
    assert.equal(val.elements.length, 3);
  });

  it("parses index expressions", () => {
    const ast = parse("let x = arr[0]");
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "IndexExpression");
  });

  it("parses import statements", () => {
    const ast = parse('import "utils.lux"');
    assert.equal(ast.body[0].type, "ImportStatement");
    assert.equal((ast.body[0] as any).path, "utils.lux");
  });

  it("parses try/catch statements", () => {
    const ast = parse("try\nlet x = 1\ncatch err\nlet y = err\nend");
    assert.equal(ast.body[0].type, "TryCatchStatement");
    const stmt = ast.body[0] as any;
    assert.equal(stmt.catchVariable, "err");
    assert.equal(stmt.tryBody.length, 1);
    assert.equal(stmt.catchBody.length, 1);
  });

  it("parses return statements", () => {
    const ast = parse("func foo()\nreturn 42\nend");
    const func = ast.body[0] as any;
    assert.equal(func.body[0].type, "ReturnStatement");
    assert.equal(func.body[0].value.value, 42);
  });

  it("parses break and continue", () => {
    const ast = parse("while true do\nbreak\nend");
    const loop = ast.body[0] as any;
    assert.equal(loop.body[0].type, "BreakStatement");
  });

  it("parses string concatenation", () => {
    const ast = parse('let x = "a" + "b"');
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "BinaryExpression");
    assert.equal(val.operator, "+");
  });

  it("parses logical operators", () => {
    const ast = parse("let x = true and false or true");
    const val = (ast.body[0] as any).value;
    assert.equal(val.type, "BinaryExpression");
    assert.equal(val.operator, "or");
  });

  it("parses exponent operator (right-associative)", () => {
    const ast = parse("let x = 2 ^ 3 ^ 2");
    const val = (ast.body[0] as any).value;
    assert.equal(val.operator, "^");
    assert.equal(val.right.operator, "^");
  });
});
