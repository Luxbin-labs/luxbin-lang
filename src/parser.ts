import {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  LetDeclaration,
  ConstDeclaration,
  Assignment,
  IndexAssignment,
  IfStatement,
  WhileStatement,
  ForStatement,
  FunctionDeclaration,
  ReturnStatement,
  ImportStatement,
  TryCatchStatement,
  ExpressionStatement,
} from "./types.js";
import { ParseError } from "./errors.js";

export class Parser {
  private tokens: Token[];
  private pos = 0;
  private file: string;

  constructor(tokens: Token[], file = "<stdin>") {
    this.tokens = tokens;
    this.file = file;
  }

  parse(): Program {
    const body: Statement[] = [];
    this.skipNewlines();
    while (!this.isAtEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    return { type: "Program", body };
  }

  // ── Helpers ────────────────────────────────────────────

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private peekAt(offset: number): Token {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[idx];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: TokenType, msg?: string): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new ParseError(
        msg || `Expected ${type} but got ${token.type} ("${token.value}")`,
        this.file,
        token.line,
        token.column
      );
    }
    return this.advance();
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private skipNewlines() {
    while (this.peek().type === TokenType.NEWLINE) {
      this.advance();
    }
  }

  private expectNewline() {
    if (this.peek().type === TokenType.NEWLINE || this.peek().type === TokenType.EOF) {
      if (this.peek().type === TokenType.NEWLINE) this.advance();
    }
    // Be lenient — don't throw if newline is missing
  }

  // ── Statements ─────────────────────────────────────────

  private parseStatement(): Statement {
    const token = this.peek();

    switch (token.type) {
      case TokenType.LET:
        return this.parseLetDeclaration();
      case TokenType.CONST:
        return this.parseConstDeclaration();
      case TokenType.FUNC:
        return this.parseFunctionDeclaration();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      case TokenType.IMPORT:
        return this.parseImportStatement();
      case TokenType.TRY:
        return this.parseTryCatchStatement();
      case TokenType.BREAK: {
        this.advance();
        this.expectNewline();
        return { type: "BreakStatement", line: token.line, column: token.column };
      }
      case TokenType.CONTINUE: {
        this.advance();
        this.expectNewline();
        return { type: "ContinueStatement", line: token.line, column: token.column };
      }
      case TokenType.IDENTIFIER: {
        // Assignment: name = expr  or  name[idx] = expr
        const next = this.peekAt(1);
        if (next.type === TokenType.EQUALS) {
          return this.parseAssignment();
        }
        if (next.type === TokenType.LBRACKET) {
          return this.parseIndexAssignmentOrExpression();
        }
        return this.parseExpressionStatement();
      }
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseLetDeclaration(): LetDeclaration {
    const tok = this.expect(TokenType.LET);
    const name = this.expect(TokenType.IDENTIFIER).value;
    let typeAnnotation: string | null = null;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.expect(TokenType.IDENTIFIER).value;
    }
    let value: Expression | null = null;
    if (this.match(TokenType.EQUALS)) {
      value = this.parseExpression();
    }
    this.expectNewline();
    return { type: "LetDeclaration", name, typeAnnotation, value, line: tok.line, column: tok.column };
  }

  private parseConstDeclaration(): ConstDeclaration {
    const tok = this.expect(TokenType.CONST);
    const name = this.expect(TokenType.IDENTIFIER).value;
    let typeAnnotation: string | null = null;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.expect(TokenType.IDENTIFIER).value;
    }
    this.expect(TokenType.EQUALS);
    const value = this.parseExpression();
    this.expectNewline();
    return { type: "ConstDeclaration", name, typeAnnotation, value, line: tok.line, column: tok.column };
  }

  private parseAssignment(): Assignment {
    const tok = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.EQUALS);
    const value = this.parseExpression();
    this.expectNewline();
    return { type: "Assignment", name: tok.value, value, line: tok.line, column: tok.column };
  }

  private parseIndexAssignmentOrExpression(): Statement {
    const savedPos = this.pos;
    const tok = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.LBRACKET);
    const index = this.parseExpression();
    this.expect(TokenType.RBRACKET);

    if (this.peek().type === TokenType.EQUALS) {
      this.advance();
      const value = this.parseExpression();
      this.expectNewline();
      return { type: "IndexAssignment", name: tok.value, index, value, line: tok.line, column: tok.column } as IndexAssignment;
    }

    // It was actually an expression (index access), backtrack
    this.pos = savedPos;
    return this.parseExpressionStatement();
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const tok = this.expect(TokenType.FUNC);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LPAREN);

    const params: { name: string; typeAnnotation: string | null }[] = [];
    if (this.peek().type !== TokenType.RPAREN) {
      do {
        const pName = this.expect(TokenType.IDENTIFIER).value;
        let pType: string | null = null;
        if (this.match(TokenType.COLON)) {
          pType = this.expect(TokenType.IDENTIFIER).value;
        }
        params.push({ name: pName, typeAnnotation: pType });
      } while (this.match(TokenType.COMMA));
    }
    this.expect(TokenType.RPAREN);

    let returnType: string | null = null;
    if (this.match(TokenType.COLON)) {
      returnType = this.expect(TokenType.IDENTIFIER).value;
    }
    this.expectNewline();
    this.skipNewlines();

    const body: Statement[] = [];
    while (this.peek().type !== TokenType.END && !this.isAtEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    this.expect(TokenType.END);
    this.expectNewline();

    return { type: "FunctionDeclaration", name, params, returnType, body, line: tok.line, column: tok.column };
  }

  private parseIfStatement(): IfStatement {
    const tok = this.expect(TokenType.IF);
    const condition = this.parseExpression();
    this.expect(TokenType.THEN);
    this.expectNewline();
    this.skipNewlines();

    const consequent: Statement[] = [];
    while (
      this.peek().type !== TokenType.ELSE &&
      this.peek().type !== TokenType.END &&
      !this.isAtEnd()
    ) {
      consequent.push(this.parseStatement());
      this.skipNewlines();
    }

    const alternateConditions: { condition: Expression; body: Statement[] }[] = [];
    let alternate: Statement[] | null = null;

    while (this.peek().type === TokenType.ELSE) {
      this.advance(); // consume 'else'
      if (this.peek().type === TokenType.IF) {
        // else if
        this.advance(); // consume 'if'
        const elifCondition = this.parseExpression();
        this.expect(TokenType.THEN);
        this.expectNewline();
        this.skipNewlines();

        const elifBody: Statement[] = [];
        while (
          this.peek().type !== TokenType.ELSE &&
          this.peek().type !== TokenType.END &&
          !this.isAtEnd()
        ) {
          elifBody.push(this.parseStatement());
          this.skipNewlines();
        }
        alternateConditions.push({ condition: elifCondition, body: elifBody });
      } else {
        // else block
        this.expectNewline();
        this.skipNewlines();
        alternate = [];
        while (this.peek().type !== TokenType.END && !this.isAtEnd()) {
          alternate.push(this.parseStatement());
          this.skipNewlines();
        }
        break;
      }
    }

    this.expect(TokenType.END);
    this.expectNewline();

    return { type: "IfStatement", condition, consequent, alternateConditions, alternate, line: tok.line, column: tok.column };
  }

  private parseWhileStatement(): WhileStatement {
    const tok = this.expect(TokenType.WHILE);
    const condition = this.parseExpression();
    this.expect(TokenType.DO);
    this.expectNewline();
    this.skipNewlines();

    const body: Statement[] = [];
    while (this.peek().type !== TokenType.END && !this.isAtEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    this.expect(TokenType.END);
    this.expectNewline();

    return { type: "WhileStatement", condition, body, line: tok.line, column: tok.column };
  }

  private parseForStatement(): ForStatement {
    const tok = this.expect(TokenType.FOR);
    const variable = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.IN);
    const iterable = this.parseExpression();
    this.expect(TokenType.DO);
    this.expectNewline();
    this.skipNewlines();

    const body: Statement[] = [];
    while (this.peek().type !== TokenType.END && !this.isAtEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    this.expect(TokenType.END);
    this.expectNewline();

    return { type: "ForStatement", variable, iterable, body, line: tok.line, column: tok.column };
  }

  private parseReturnStatement(): ReturnStatement {
    const tok = this.expect(TokenType.RETURN);
    let value: Expression | null = null;
    if (this.peek().type !== TokenType.NEWLINE && this.peek().type !== TokenType.EOF) {
      value = this.parseExpression();
    }
    this.expectNewline();
    return { type: "ReturnStatement", value, line: tok.line, column: tok.column };
  }

  private parseImportStatement(): ImportStatement {
    const tok = this.expect(TokenType.IMPORT);
    const path = this.expect(TokenType.STRING).value;
    this.expectNewline();
    return { type: "ImportStatement", path, line: tok.line, column: tok.column };
  }

  private parseTryCatchStatement(): TryCatchStatement {
    const tok = this.expect(TokenType.TRY);
    this.expectNewline();
    this.skipNewlines();

    const tryBody: Statement[] = [];
    while (this.peek().type !== TokenType.CATCH && !this.isAtEnd()) {
      tryBody.push(this.parseStatement());
      this.skipNewlines();
    }

    this.expect(TokenType.CATCH);
    const catchVariable = this.expect(TokenType.IDENTIFIER).value;
    this.expectNewline();
    this.skipNewlines();

    const catchBody: Statement[] = [];
    while (this.peek().type !== TokenType.END && !this.isAtEnd()) {
      catchBody.push(this.parseStatement());
      this.skipNewlines();
    }
    this.expect(TokenType.END);
    this.expectNewline();

    return { type: "TryCatchStatement", tryBody, catchVariable, catchBody, line: tok.line, column: tok.column };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const token = this.peek();
    const expression = this.parseExpression();
    this.expectNewline();
    return { type: "ExpressionStatement", expression, line: token.line, column: token.column };
  }

  // ── Expressions (precedence climbing) ──────────────────

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    while (this.peek().type === TokenType.OR) {
      this.advance();
      const right = this.parseAnd();
      left = { type: "BinaryExpression", operator: "or", left, right };
    }
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseEquality();
    while (this.peek().type === TokenType.AND) {
      this.advance();
      const right = this.parseEquality();
      left = { type: "BinaryExpression", operator: "and", left, right };
    }
    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();
    while (
      this.peek().type === TokenType.DOUBLE_EQUALS ||
      this.peek().type === TokenType.NOT_EQUALS
    ) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseAddition();
    while (
      this.peek().type === TokenType.LESS_THAN ||
      this.peek().type === TokenType.GREATER_THAN ||
      this.peek().type === TokenType.LESS_EQUALS ||
      this.peek().type === TokenType.GREATER_EQUALS
    ) {
      const op = this.advance().value;
      const right = this.parseAddition();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  }

  private parseAddition(): Expression {
    let left = this.parseMultiplication();
    while (
      this.peek().type === TokenType.PLUS ||
      this.peek().type === TokenType.MINUS
    ) {
      const op = this.advance().value;
      const right = this.parseMultiplication();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  }

  private parseMultiplication(): Expression {
    let left = this.parseExponent();
    while (
      this.peek().type === TokenType.STAR ||
      this.peek().type === TokenType.SLASH ||
      this.peek().type === TokenType.PERCENT
    ) {
      const op = this.advance().value;
      const right = this.parseExponent();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  }

  private parseExponent(): Expression {
    const left = this.parseUnary();
    if (this.peek().type === TokenType.CARET) {
      this.advance();
      const right = this.parseExponent(); // right-associative
      return { type: "BinaryExpression", operator: "^", left, right };
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.peek().type === TokenType.NOT) {
      this.advance();
      const operand = this.parseUnary();
      return { type: "UnaryExpression", operator: "not", operand };
    }
    if (this.peek().type === TokenType.MINUS) {
      this.advance();
      const operand = this.parseUnary();
      return { type: "UnaryExpression", operator: "-", operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    // Number literal
    if (token.type === TokenType.NUMBER) {
      this.advance();
      const isFloat = token.value.includes(".");
      return { type: "NumberLiteral", value: Number(token.value), isFloat };
    }

    // String literal
    if (token.type === TokenType.STRING) {
      this.advance();
      return { type: "StringLiteral", value: token.value };
    }

    // Boolean literals
    if (token.type === TokenType.TRUE) {
      this.advance();
      return { type: "BooleanLiteral", value: true };
    }
    if (token.type === TokenType.FALSE) {
      this.advance();
      return { type: "BooleanLiteral", value: false };
    }

    // Nil
    if (token.type === TokenType.NIL) {
      this.advance();
      return { type: "NilLiteral" };
    }

    // Parenthesized expression
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Array literal
    if (token.type === TokenType.LBRACKET) {
      this.advance();
      const elements: Expression[] = [];
      if (this.peek().type !== TokenType.RBRACKET) {
        elements.push(this.parseExpression());
        while (this.match(TokenType.COMMA)) {
          elements.push(this.parseExpression());
        }
      }
      this.expect(TokenType.RBRACKET);
      return { type: "ArrayLiteral", elements };
    }

    // Identifier, function call, or index expression
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      const name = token.value;

      // Function call: name(args)
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        const args: Expression[] = [];
        if (this.peek().type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) {
            args.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RPAREN);
        let expr: Expression = { type: "CallExpression", callee: name, arguments: args, line: token.line, column: token.column };

        // Handle chained index: func()[i]
        while (this.peek().type === TokenType.LBRACKET) {
          this.advance();
          const index = this.parseExpression();
          this.expect(TokenType.RBRACKET);
          expr = { type: "IndexExpression", object: expr, index };
        }
        return expr;
      }

      // Index expression: name[idx]
      if (this.peek().type === TokenType.LBRACKET) {
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        return { type: "IndexExpression", object: { type: "Identifier", name }, index };
      }

      return { type: "Identifier", name };
    }

    throw new ParseError(
      `Unexpected token ${token.type} ("${token.value}")`,
      this.file,
      token.line,
      token.column
    );
  }
}
