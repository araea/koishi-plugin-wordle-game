import type { LetterState } from "../types";

// 去除字符串中的重复字符，保留首次出现的顺序。
export function removeDuplicates(inputString: string): string {
  let result = "";
  for (let i = 0; i < inputString.length; i++) {
    if (result.indexOf(inputString[i]) === -1) {
      result += inputString[i];
    }
  }
  return result;
}

// 去除字符串数组中的重复项，保留首次出现的顺序。
export function mergeDuplicates(arr: string[]): string[] {
  const uniqueArr = arr.reduce((acc: string[], current: string) => {
    if (!acc.includes(current)) {
      acc.push(current);
    }
    return acc;
  }, []);
  return uniqueArr;
}

// 去除数组中的重复元素，保留首次出现的顺序。
export function mergeSameLetters(arr: string[]): string[] {
  const seen: { [key: string]: boolean } = {};
  const result: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    const currentLetter = arr[i];
    if (!seen[currentLetter]) {
      result.push(currentLetter);
      seen[currentLetter] = true;
    }
  }

  return result;
}

// 提取字符串中的小写字母，去重并排序后拼接返回。
export function uniqueSortedLowercaseLetters(input: string): string {
  const uniqueLetters = Array.from(
    new Set(input.toLowerCase().match(/[a-z]/g))
  );
  return uniqueLetters.sort().join("");
}

// 首字母大写。
export function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// 把转义后的 \r、\n 还原为真实换行符。
export function replaceEscapeCharacters(input: string): string {
  return input.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
}

// 从 absentLetters 中剔除答案单词里实际包含的字母。
export function removeLetters(wordAnswer: string, absentLetters: string): string {
  const letterSet = new Set(wordAnswer);
  return absentLetters
    .split("")
    .filter((letter) => !letterSet.has(letter))
    .join("");
}

// 把一组字母状态拼接成单词。
export function combineWord(letters: LetterState[]): string {
  return letters.reduce((word, { letter }) => word + letter, "");
}
