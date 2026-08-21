// 输入合法性校验相关工具。

// 判断内容是否为合法的数学方程式（仅含数字与 + - * / = 运算符，且等式成立）。
export function isMathEquationValid(content: string): boolean {
  const validExpression = /^[0-9\+\-\*\/\=]*$/;

  if (validExpression.test(content)) {
    if (content.includes("=")) {
      try {
        const result = eval(content.split("=")[1]);
        if (!isNaN(result)) {
          return eval(content.split("=")[0]) === result;
        }
      } catch (e) {
        return false;
      }
    }
  }
  return false;
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
