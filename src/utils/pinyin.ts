import { finals } from "../constants";
import type { ProcessedRecord, SeparatedPinyin, PinyinItem } from "../types";

// 去除拼音中的数字声调（如 "a-1" -> "a"），并拼接。
export function processPinyin2(pinyinArray: string[]): string {
  return pinyinArray.map((pinyin) => pinyin.replace(/-\d/g, "")).join("");
}

// 去除拼音中的状态标记与数字声调。
export function processPinyin3(pinyin: string): string {
  return pinyin.replace(/-\w+/g, "").replace(/\d/g, "");
}

// 判断是否为整体认读音节。
export function isWholeSyllableRecognition(pinyin: string): boolean {
  const wholeSyllableRecognitionTable = [
    "zhi",
    "chi",
    "shi",
    "ri",
    "zi",
    "ci",
    "si",
    "yi",
    "wu",
    "yu",
    "ye",
    "yue",
    "yin",
    "yun",
    "yuan",
    "ying",
  ];
  return wholeSyllableRecognitionTable.includes(pinyin);
}

// 把带声调标记的拼音拆分为「字母-声调数字」的形式。
export function processPinyin(pinyin: string): string[][] {
  const toneMap: { [key: string]: string } = {
    ā: "a-1",
    á: "a-2",
    ǎ: "a-3",
    à: "a-4",
    ē: "e-1",
    é: "e-2",
    ě: "e-3",
    è: "e-4",
    ī: "i-1",
    í: "i-2",
    ǐ: "i-3",
    ì: "i-4",
    ō: "o-1",
    ó: "o-2",
    ǒ: "o-3",
    ò: "o-4",
    ū: "u-1",
    ú: "u-2",
    ǔ: "u-3",
    ù: "u-4",
    ǖ: "ü-1",
    ǘ: "ü-2",
    ǚ: "ü-3",
    ǜ: "ü-4",
  };

  const splitPinyin = pinyin.split(" ");
  const result: string[][] = [];

  splitPinyin.forEach((word) => {
    const processedWord: string[] = [];
    let tempWord = word;
    if (/[jqxy]u/.test(tempWord)) {
      tempWord = tempWord.replace(/u/g, "ü");
    }
    for (let i = 0; i < tempWord.length; i++) {
      if (toneMap[tempWord[i]]) {
        processedWord.push(toneMap[tempWord[i]]);
      } else {
        processedWord.push(tempWord[i]);
      }
    }
    result.push(processedWord);
  });

  return result;
}

// 统计每个位置的声母与韵母出现次数。
export function processPinyinArray(pinyinArray: string[][]): {
  wholeSyllableRecognitionOccurrences: {
    [key: string]: { count: number; positions: number[] };
  };
  initialsOccurrences: {
    [key: string]: { count: number; positions: number[] };
  };
  finalsOccurrences: {
    [key: string]: { count: number; positions: number[] };
  };
} {
  const processedPinyinStrings = pinyinArray.map(processPinyin2);
  const wholeSyllableRecognitionOccurrences: {
    [key: string]: { count: number; positions: number[] };
  } = {};
  const initialsOccurrences: {
    [key: string]: { count: number; positions: number[] };
  } = {};
  const finalsOccurrences: {
    [key: string]: { count: number; positions: number[] };
  } = {};

  processedPinyinStrings.forEach((pinyin, index) => {
    let initial = "";
    let final = "";
    for (let i = finals.length - 1; i >= 0; i--) {
      const potentialFinal = finals[i];
      if (pinyin.endsWith(potentialFinal)) {
        final = potentialFinal;
        initial = pinyin.slice(0, -potentialFinal.length);
        break;
      }
    }
    if (initial) {
      if (initialsOccurrences[initial]) {
        initialsOccurrences[initial].count++;
        initialsOccurrences[initial].positions.push(index);
      } else {
        initialsOccurrences[initial] = { count: 1, positions: [index] };
      }
    }
    if (final) {
      if (finalsOccurrences[final]) {
        finalsOccurrences[final].count++;
        finalsOccurrences[final].positions.push(index);
      } else {
        finalsOccurrences[final] = { count: 1, positions: [index] };
      }
    }
  });

  return {
    wholeSyllableRecognitionOccurrences,
    initialsOccurrences,
    finalsOccurrences,
  };
}

// 为每个字的拼音切分声母与韵母。
export function processAllRecords(
  userInputIdiomAllRecords: { word: string; pinyin: string[] }[]
): ProcessedRecord[] {
  const processedRecords: ProcessedRecord[] = userInputIdiomAllRecords.map(
    (record) => {
      const processedPinyinStrings = record.pinyin.map(processPinyin3);
      let initial = "";
      let final = "";
      for (let i = finals.length - 1; i >= 0; i--) {
        const potentialFinal = finals[i];
        const combinedPinyin = processedPinyinStrings.join("");
        if (combinedPinyin.endsWith(potentialFinal)) {
          final = potentialFinal;
          initial = combinedPinyin.slice(
            0,
            combinedPinyin.length - potentialFinal.length
          );
          break;
        }
      }
      return {
        word: record.word,
        pinyin: record.pinyin,
        initial,
        final,
      };
    }
  );

  return processedRecords;
}

// 统计每个声调数字出现的位置。
export function countNumericTones(processedPinyin: string[][]) {
  const toneCounts: {
    [key: number]: { count: number; positions: number[] };
  } = {};

  processedPinyin.forEach((pinyin, index) => {
    pinyin.forEach((syllable, syllableIndex) => {
      const numericToneMatch = syllable.match(/-(\d)/);
      if (numericToneMatch) {
        const tone = parseInt(numericToneMatch[1]);
        if (toneCounts[tone]) {
          toneCounts[tone].count++;
          toneCounts[tone].positions.push(index);
        } else {
          toneCounts[tone] = { count: 1, positions: [index] };
        }
      }
    });
  });

  return toneCounts;
}

// 统计字符串中每个字符的出现次数与位置。
export function countCharactersAndIndexes(idiom: string): {
  [key: string]: { count: number; indexes: number[] };
} {
  const charCount: { [key: string]: { count: number; indexes: number[] } } =
    {};
  for (let i = 0; i < idiom.length; i++) {
    const char = idiom[i];
    if (charCount[char]) {
      charCount[char].count++;
      charCount[char].indexes.push(i);
    } else {
      charCount[char] = { count: 1, indexes: [i] };
    }
  }
  return charCount;
}

// 把一条记录中的拼音切分为声母与韵母两部分。
export function separatePinyin(record): SeparatedPinyin {
  const { initial, final, pinyin } = record;

  const initials: PinyinItem[] = [];
  const finals: PinyinItem[] = [];

  for (let i = 0; i < initial.length; i++) {
    const pinyinItem = pinyin[i];
    if (pinyinItem) {
      initials.push(pinyinItem);
    }
  }

  for (let i = initial.length; i < pinyin.length; i++) {
    const pinyinItem = pinyin[i];
    if (pinyinItem) {
      finals.push(pinyinItem);
    }
  }

  return { initials, finals };
}

// 把拼音记录转换为包含状态的结构化对象。
export function transformRecords(
  records: {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }[]
): {
  word: { value: string; status: string };
  pinyin: { value: string; status: string; isHasTone: boolean }[];
  tune: { value: number; status: string };
  initial: string;
  final: string;
}[] {
  return records.map((record) => {
    const word = record.word.split("-")[0];
    const status = record.word.split("-")[1];

    let tuneValue: number = 0;
    let tuneStatus = "";
    const pinyin = record.pinyin.map((p) => {
      const value = p.split("-")[0];
      const status = p.split("-")[1];
      const isHasTone = !!p.split("-")[2];
      if (isHasTone) {
        tuneValue = parseInt(p.split("-")[2], 10);
        tuneStatus = p.split("-")[3];
      }
      return { value, status, isHasTone };
    });

    return {
      word: { value: word, status },
      pinyin,
      tune: { value: tuneValue, status: tuneStatus },
      initial: record.initial,
      final: record.final,
    };
  });
}

// 从统计表中减去指定位置的计数。
export function updateOccurrences(occurrences, index) {
  for (const key in occurrences) {
    if (occurrences[key].positions.includes(index)) {
      occurrences[key].count -= 1;
      occurrences[key].positions = occurrences[key].positions.filter(
        (p) => p !== index
      );
    }
  }
}

// 合并整体认读、声母、韵母的统计结果。
export function mergeOccurrences(occurrences: any) {
  const {
    wholeSyllableRecognitionOccurrences,
    initialsOccurrences,
    finalsOccurrences,
    ...rest
  } = occurrences;
  const mergedOccurrences = {
    ...wholeSyllableRecognitionOccurrences,
    ...initialsOccurrences,
    ...finalsOccurrences,
  };
  return {
    ...mergedOccurrences,
    ...rest,
  };
}

// 去除拼音中的位置索引（"a-1" -> "a"）。
export function removeIndexFromPinyins(pinyinsWithIndex: string[]): string[] {
  return pinyinsWithIndex.map((item) => {
    return item.split("-")[0];
  });
}
