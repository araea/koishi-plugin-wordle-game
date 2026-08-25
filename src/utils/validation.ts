// 输入合法性校验相关工具。

/**
 * 求值一个只含非负整数与 + - * / 的表达式。
 * 自己写个极小的递归下降解析器，不必为了算一条等式去 eval 用户输入。
 * 无法解析、除零或有多余字符时返回 null。
 */
function evaluate(expression: string): number | null {
  let index = 0;
  const peek = () => expression[index];

  const number = (): number | null => {
    const start = index;
    while (index < expression.length && expression[index] >= "0" && expression[index] <= "9") index++;
    return start === index ? null : Number(expression.slice(start, index));
  };

  const unary = (): number | null => {
    if (peek() === "-") {
      index++;
      const value = unary();
      return value === null ? null : -value;
    }
    if (peek() === "+") {
      index++;
      return unary();
    }
    return number();
  };

  const term = (): number | null => {
    let left = unary();
    if (left === null) return null;
    while (peek() === "*" || peek() === "/") {
      const operator = expression[index++];
      const right = unary();
      if (right === null) return null;
      if (operator === "/" && right === 0) return null;
      left = operator === "*" ? left * right : left / right;
    }
    return left;
  };

  let left = term();
  if (left === null) return null;
  while (peek() === "+" || peek() === "-") {
    const operator = expression[index++];
    const right = term();
    if (right === null) return null;
    left = operator === "+" ? left + right : left - right;
  }
  return index === expression.length ? left : null;
}

// 判断内容是否为合法的数学方程式（仅含数字与 + - * / = 运算符，且等式成立）。
export function isMathEquationValid(content: string): boolean {
  if (!/^[0-9+\-*/=]+$/.test(content)) return false;
  const parts = content.split("=");
  if (parts.length !== 2) return false;
  const [left, right] = parts.map(evaluate);
  return left !== null && right !== null && left === right;
}

// 判断内容是否为纯数字字符串。
export function isNumericString(content: string): boolean {
  const numericRegex = /^[0-9]+$/;
  return numericRegex.test(content);
}

// 生成指定长度的随机数字字符串。
export function generateNumberString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

// 检查词的每个字是否都存在笔画数据。
export function checkStrokesData(
  inputWord: string,
  strokesData: Record<string, any>
): boolean {
  for (const char of inputWord) {
    if (!strokesData[char]) {
      return false;
    }
  }
  return true;
}

// 检查输入是否包含「已排除」的字母（超困难模式）。
export function checkAbsentLetters(
  lowercaseInputWord: string,
  absentLetters: string
): boolean {
  for (let i = 0; i < lowercaseInputWord.length; i++) {
    if (absentLetters.includes(lowercaseInputWord[i])) {
      return true;
    }
  }
  return false;
}

// 检查输入是否把黄色线索字母放在了被排除的位置（超困难模式）。
export function checkPresentLettersWithIndex(
  lowercaseInputWord: string,
  presentLettersWithIndex: string[]
): boolean {
  let isInputWordWrong = false;

  presentLettersWithIndex.forEach((item) => {
    const [letter, indexStr] = item.split("-");
    const index = parseInt(indexStr, 10) - 1;

    if (
      lowercaseInputWord.length > index &&
      lowercaseInputWord[index] === letter
    ) {
      isInputWordWrong = true;
    }
  });

  return isInputWordWrong;
}

// 从字符串列表中随机取一个（并转小写）。
export function getRandomFromStringList(words: string[]): string {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex].toLowerCase();
}
