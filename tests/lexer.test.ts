import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/types.js";

describe("Lexer", () => {
  it("tokenizes numbers", () => {
    const tokens = new Lexer("42 3.14").tokenize();
    assert.equal(tokens[0].type, TokenType.NUMBER);
    assert.equal(tokens[0].value, "42");
    assert.equal(tokens[1].type, TokenType.NUMBER);
    assert.equal(tokens[1].value, "3.14");
  });

  it("tokenizes strings", () => {
    const tokens = new Lexer('"hello world"').tokenize();
    assert.equal(tokens[0].type, TokenType.STRING);
    assert.equal(tokens[0].value, "hello world");
  });

  it("tokenizes string escape sequences", () => {
    const tokens = new Lexer('"hello\\nworld"').tokenize();
    assert.equal(tokens[0].value, "hello\nworld");
  });

  it("tokenizes keywords", () => {
    const tokens = new Lexer("let const func if then else end while do for in return").tokenize();
    assert.equal(tokens[0].type, TokenType.LET);
    assert.equal(tokens[1].type, TokenType.CONST);
    assert.equal(tokens[2].type, TokenType.FUNC);
    assert.equal(tokens[3].type, TokenType.IF);
    assert.equal(tokens[4].type, TokenType.THEN);
    assert.equal(tokens[5].type, TokenType.ELSE);
    assert.equal(tokens[6].type, TokenType.END);
    assert.equal(tokens[7].type, TokenType.WHILE);
    assert.equal(tokens[8].type, TokenType.DO);
    assert.equal(tokens[9].type, TokenType.FOR);
    assert.equal(tokens[10].type, TokenType.IN);
    assert.equal(tokens[11].type, TokenType.RETURN);
  });

  it("tokenizes try/catch keywords", () => {
    const tokens = new Lexer("try catch").tokenize();
    assert.equal(tokens[0].type, TokenType.TRY);
    assert.equal(tokens[1].type, TokenType.CATCH);
  });

  it("tokenizes operators", () => {
    const tokens = new Lexer("+ - * / % ^ == != <= >= < >").tokenize();
    assert.equal(tokens[0].type, TokenType.PLUS);
    assert.equal(tokens[1].type, TokenType.MINUS);
    assert.equal(tokens[2].type, TokenType.STAR);
    assert.equal(tokens[3].type, TokenType.SLASH);
    assert.equal(tokens[4].type, TokenType.PERCENT);
    assert.equal(tokens[5].type, TokenType.CARET);
    assert.equal(tokens[6].type, TokenType.DOUBLE_EQUALS);
    assert.equal(tokens[7].type, TokenType.NOT_EQUALS);
    assert.equal(tokens[8].type, TokenType.LESS_EQUALS);
    assert.equal(tokens[9].type, TokenType.GREATER_EQUALS);
    assert.equal(tokens[10].type, TokenType.LESS_THAN);
    assert.equal(tokens[11].type, TokenType.GREATER_THAN);
  });

  it("tokenizes boolean and nil literals", () => {
    const tokens = new Lexer("true false nil").tokenize();
    assert.equal(tokens[0].type, TokenType.TRUE);
    assert.equal(tokens[1].type, TokenType.FALSE);
    assert.equal(tokens[2].type, TokenType.NIL);
  });

  it("tokenizes logical operators", () => {
    const tokens = new Lexer("and or not").tokenize();
    assert.equal(tokens[0].type, TokenType.AND);
    assert.equal(tokens[1].type, TokenType.OR);
    assert.equal(tokens[2].type, TokenType.NOT);
  });

  it("skips comments", () => {
    const tokens = new Lexer("42 # this is a comment\n43").tokenize();
    assert.equal(tokens[0].type, TokenType.NUMBER);
    assert.equal(tokens[0].value, "42");
    assert.equal(tokens[2].type, TokenType.NUMBER);
    assert.equal(tokens[2].value, "43");
  });

  it("tracks line and column", () => {
    const tokens = new Lexer("let x = 42\nlet y = 10").tokenize();
    assert.equal(tokens[0].line, 1);
    assert.equal(tokens[0].column, 1);
    // After newline
    const letY = tokens.find((t, i) => t.type === TokenType.LET && i > 0);
    assert.ok(letY);
    assert.equal(letY!.line, 2);
  });

  it("tokenizes punctuation", () => {
    const tokens = new Lexer("( ) [ ] , :").tokenize();
    assert.equal(tokens[0].type, TokenType.LPAREN);
    assert.equal(tokens[1].type, TokenType.RPAREN);
    assert.equal(tokens[2].type, TokenType.LBRACKET);
    assert.equal(tokens[3].type, TokenType.RBRACKET);
    assert.equal(tokens[4].type, TokenType.COMMA);
    assert.equal(tokens[5].type, TokenType.COLON);
  });

  it("throws on unexpected characters", () => {
    assert.throws(() => new Lexer("@").tokenize(), /Unexpected character/);
  });

  it("throws on unterminated strings", () => {
    assert.throws(() => new Lexer('"hello').tokenize(), /Unterminated string/);
  });

  it("tokenizes import keyword", () => {
    const tokens = new Lexer('import "foo.lux"').tokenize();
    assert.equal(tokens[0].type, TokenType.IMPORT);
    assert.equal(tokens[1].type, TokenType.STRING);
    assert.equal(tokens[1].value, "foo.lux");
  });
});
