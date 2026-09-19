const tools = [
  { name: "calculator", description: "Safely evaluate basic arithmetic expressions.", enabled: true },
  { name: "text_summarizer", description: "Summarize supplied text through the configured AI service.", enabled: true },
  { name: "document_reader", description: "Read metadata for an uploaded document.", enabled: true },
];

export const listTools = () => tools;

export function calculate(expression: string): number {
  if (!/^[\d\s()+\-*/%.]+$/.test(expression) || expression.length > 100) {
    throw new Error("Only numbers and basic arithmetic operators are supported.");
  }
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) ?? [];
  if (tokens.join("") !== expression.replaceAll(" ", "")) throw new Error("Invalid calculator expression.");
  const values: number[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (!operator || right === undefined || left === undefined) throw new Error("Invalid calculator expression.");
    if (operator === "/" && right === 0) throw new Error("Cannot divide by zero.");
    values.push(operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" ? left * right : operator === "/" ? left / right : left % right);
  };
  for (const token of tokens) {
    if (!Number.isNaN(Number(token))) values.push(Number(token));
    else if (token === "(") operators.push(token);
    else if (token === ")") {
      while (operators.at(-1) && operators.at(-1) !== "(") apply();
      if (operators.pop() !== "(") throw new Error("Invalid calculator expression.");
    } else {
      const lastOperator = operators.at(-1);
      while (lastOperator && lastOperator !== "(" && precedence[lastOperator] >= precedence[token]) apply();
      operators.push(token);
    }
  }
  while (operators.length) {
    if (operators.at(-1) === "(") throw new Error("Invalid calculator expression.");
    apply();
  }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error("Invalid calculator expression.");
  return values[0];
}