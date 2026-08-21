import type { Idiom } from "../types";

// 按成语文本在列表中查找。
export function findIdiomByIdiom(
  inputWord: string,
  idiomsList: Idiom[]
): Idiom | undefined {
  return idiomsList.find((idiom) => idiom.idiom === inputWord);
}

// 判断成语是否在列表中。
export function isIdiomInList(inputWord: string, idiomsList: Idiom[]): boolean {
  return idiomsList.some((idiom) => idiom.idiom === inputWord);
}

// 从成语列表中随机取一个。
export function getRandomIdiom(idiomsList: Idiom[]): Idiom {
  const randomIndex: number = Math.floor(Math.random() * idiomsList.length);
  return idiomsList[randomIndex];
}

// 判断是否为四字成语（四个汉字）。
export function isFourCharacterIdiom(targetIdiom: string): boolean {
  if (targetIdiom.length !== 4) {
    return false;
  }

  const chineseRegex = /^[\u4e00-\u9fa5]+$/;
  if (!chineseRegex.test(targetIdiom)) {
    return false;
  }

  return true;
}
