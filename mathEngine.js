// Advanced math functions
const mathFunctions = {
  sin: x => Math.sin(x * Math.PI / 180),
  cos: x => Math.cos(x * Math.PI / 180),
  tan: x => Math.tan(x * Math.PI / 180),
  log: x => Math.log10(x),
  ln: x => Math.log(x),
  sqrt: x => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),
  factorial: x => {
    if (x < 0) return NaN;
    if (x <= 1) return 1;
    return x * mathFunctions.factorial(x - 1);
  },
  abs: x => Math.abs(x),
  exp: x => Math.exp(x),
  floor: x => Math.floor(x),
  ceil: x => Math.ceil(x)
};

const operators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '×': (a, b) => a * b,
  '*': (a, b) => a * b,
  '÷': (a, b) => a / b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '^': (a, b) => Math.pow(a, b)
};

export function evaluateExpression(expression) {
  // Replace function calls
  Object.keys(mathFunctions).forEach(fn => {
    const regex = new RegExp(`${fn}\\((.*?)\\)`, 'g');
    expression = expression.replace(regex, (match, p1) => {
      return mathFunctions[fn](evaluateExpression(p1));
    });
  });

  // Handle parentheses
  while (expression.includes('(')) {
    expression = expression.replace(/\(([^()]+)\)/g, (match, p1) => {
      return evaluateExpression(p1);
    });
  }

  // Evaluate operators in order of precedence
  const tokens = expression.match(/[+\-×÷*/%^]|\d*\.?\d+/g) || [];
  let result = parseFloat(tokens[0]);

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const operand = parseFloat(tokens[i + 1]);
    result = operators[operator](result, operand);
  }

  return result;
}