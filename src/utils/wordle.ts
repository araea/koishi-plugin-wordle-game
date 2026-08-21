import * as fs from "fs";
import * as path from "path";
import { gameTypes } from "../constants";
import type { GameRecord, LetterState, WordData, WordEntry } from "../types";
import { replaceEscapeCharacters } from "./string";
import { formatGameDuration } from "./time";

// 提取单词数组中的小写单词。
export function extractLowerCaseWords(
  arr: { word: string; translation: string }[]
): string[] {
  return arr.map((item) => item.word.toLowerCase());
}

// 根据待猜单词与用户输入，计算每个字母的猜测结果（correct/present/absent）。
export function processWord(userInputWord: string, word: string): LetterState[] {
  const bucket: LetterState[] = [];
  const wordArray: number[] = new Array(26).fill(0);

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    wordArray[letter.charCodeAt(0) - 97]++;
    const userLetter = userInputWord[i];
    bucket.push({
      letter: userLetter,
      state: userLetter === letter ? "correct" : "undefined",
    });
  }

  for (let i = 0; i < userInputWord.length; i++) {
    const currentBucket = bucket[i];
    if (currentBucket.state !== "correct") {
      const letterIndex = currentBucket.letter.charCodeAt(0) - 97;
      if (wordArray[letterIndex] > 0) {
        currentBucket.state = "present";
        wordArray[letterIndex]--;
      } else {
        currentBucket.state = "absent";
      }
    }
  }

  return bucket;
}

// 判断某个候选词是否符合给定的字母状态桶。
export function isMatch(word: string, bucket: LetterState[]): boolean {
  for (let i = 0; i < bucket.length; i++) {
    const bucketState = bucket[i].state;
    const bucketLetter = bucket[i].letter;
    const wordLetter = word[i];

    if (bucketState === "correct" && wordLetter !== bucketLetter) {
      return false;
    }

    if (bucketState === "absent" && word.includes(bucketLetter)) {
      return false;
    }

    if (
      bucketState === "present" &&
      (wordLetter === bucketLetter || !word.includes(bucketLetter))
    ) {
      return false;
    }
  }
  return true;
}

// 在候选列表中筛选符合字母状态桶的单词。
export function matchWordsList(
  bucket: LetterState[],
  word: string,
  wordsList: string[]
): string[] {
  return wordsList.filter((candidateWord) => isMatch(candidateWord, bucket));
}

// 计算一次猜测后仍可能匹配的单词集合。
export function processWordAndMatch(
  lowercaseInputWord: string,
  word: string,
  wordsList: string[]
): {
  matchedWords: string[];
  length: number;
} {
  const bucket = processWord(lowercaseInputWord, word);
  const matchedWordsList = matchWordsList(bucket, word, wordsList);
  return { matchedWords: matchedWordsList, length: matchedWordsList.length };
}

// 在候选单词中找到匹配数量最多的一组（荒谬/挑战模式的核心算法）。
export async function findLongestMatchedWords(
  wordsList: string[],
  lowercaseInputWord: string,
  targetWord: string,
  isChallengeMode: boolean
): Promise<string[]> {
  const results = await Promise.all(
    wordsList.map((word) =>
      processWordAndMatch(lowercaseInputWord, word, wordsList)
    )
  );

  const maxLength = Math.max(
    ...results.map((result) => result.matchedWords.length)
  );
  let longestMatchedWords = results
    .filter((result) => result.matchedWords.length === maxLength)
    .map((result) => result.matchedWords);
  if (isChallengeMode && wordsList.includes(targetWord)) {
    const filteredWords = longestMatchedWords.filter((words) =>
      words.includes(targetWord)
    );
    if (filteredWords.length > 0) {
      longestMatchedWords = filteredWords;
    }
  }
  const randomIndex = Math.floor(Math.random() * longestMatchedWords.length);
  return longestMatchedWords[randomIndex];
}

// 在 ALL 词库中按单词查找释义。
export function findWord(targetWord: string): WordEntry | undefined {
  const fileData = getJsonFilePathAndWordCountByLength(
    "ALL",
    targetWord.length
  );
  const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, "utf-8"));

  const lowercaseTargetWord = targetWord.toLowerCase();

  return jsonData.find(
    (entry) => entry.word.toLowerCase() === lowercaseTargetWord
  );
}

// 根据模式与长度，随机取一个待猜单词及其释义。
export function getRandomWordTranslation(
  command: string,
  guessWordLength: number
): WordData {
  const fileData = getJsonFilePathAndWordCountByLength(
    command,
    guessWordLength
  );
  if (command === "ALL") {
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, "utf-8"));
    const randomIndex = Math.floor(Math.random() * jsonData.length);
    const randomWordData = jsonData[randomIndex];
    return {
      word: randomWordData.word.toLowerCase(),
      translation: randomWordData.translation
        .replace(/\\r/g, "\r")
        .replace(/\\n/g, "\n"),
      wordCount: jsonData.length,
    };
  } else {
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, "utf-8"));
    const words = Object.keys(jsonData);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const translation = jsonData[randomWord]["中释"].trim();
    return {
      word: randomWord.toLowerCase(),
      translation,
      wordCount: fileData.wordCount,
    };
  }
}

// 根据模式与长度，定位对应词库 JSON 文件路径及词数。
export function getJsonFilePathAndWordCountByLength(
  command: string,
  guessWordLength: number
): {
  filePath: string;
  wordCount: number;
} | null {
  const folderPath = path.join(
    __dirname,
    "assets",
    "Wordle",
    "词汇",
    command
  );
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const match = file.match(new RegExp(`${command}_(\\d+)_(\\d+)\\.json`));
    if (match && match[1] && match[2]) {
      const length = parseInt(match[1]);
      const wordCount = parseInt(match[2]);
      if (length === guessWordLength) {
        return { filePath: path.join(folderPath, file), wordCount };
      }
    }
  }
  return null;
}

// 判断某个模式是否支持指定的单词长度。
export function isValidGuessWordLength(
  command: string,
  guessWordLength: number
): boolean {
  switch (command) {
    case "CET4":
      return guessWordLength >= 1 && guessWordLength <= 15;
    case "CET6":
      return (
        (guessWordLength >= 3 && guessWordLength <= 16) ||
        guessWordLength === 18
      );
    case "GMAT":
      return guessWordLength >= 3 && guessWordLength <= 18;
    case "GRE":
      return (
        (guessWordLength >= 3 && guessWordLength <= 16) ||
        guessWordLength === 1
      );
    case "IELTS":
      return (
        (guessWordLength >= 2 && guessWordLength <= 15) ||
        guessWordLength === 17
      );
    case "SAT":
      return guessWordLength >= 3 && guessWordLength <= 16;
    case "TOEFL":
      return (
        (guessWordLength >= 2 && guessWordLength <= 17) ||
        guessWordLength === 20
      );
    case "考研":
      return guessWordLength >= 2 && guessWordLength <= 15;
    case "专八":
      return guessWordLength >= 1 && guessWordLength <= 18;
    case "专四":
      return (
        (guessWordLength >= 2 && guessWordLength <= 16) ||
        guessWordLength === 18
      );
    case "ALL":
      return (
        (guessWordLength >= 1 && guessWordLength <= 35) ||
        guessWordLength === 45 ||
        guessWordLength === 52
      );
    case "Numberle":
      return guessWordLength >= 1 && guessWordLength <= 35;
    case "Math":
      return guessWordLength >= 5 && guessWordLength <= 12;
    default:
      return false;
  }
}

// 返回某个模式支持的长度范围文案。
export function getValidGuessWordLengthRange(command: string): string {
  if (command === "NUMBERLE") {
    command = "Numberle";
  } else if (command === "MATH") {
    command = "Math";
  }
  switch (command) {
    case "CET4":
      return "【1 ~ 15】";
    case "CET6":
      return "【3 ~ 16, 18】";
    case "GMAT":
      return "【3 ~ 18】";
    case "GRE":
      return "【1, 3 ~ 16】";
    case "IELTS":
      return "【2 ~ 15, 17】";
    case "SAT":
      return "【3 ~ 16】";
    case "TOEFL":
      return "【2 ~ 17, 20】";
    case "考研":
      return "【2 ~ 15】";
    case "专八":
      return "【1 ~ 18】";
    case "专四":
      return "【2 ~ 16, 18】";
    case "ALL":
      return "【1 ~ 35, 45, 52】";
    case "Numberle":
      return "【1 ~ 35】";
    case "Math":
      return "【5 ~ 12】";
    default:
      return "";
  }
}

// 生成玩家统计信息的文本。
export function generateStatsInfo(stats, fastestGuessTime) {
  let statsInfo = "";

  gameTypes.forEach((type) => {
    const winCount = stats[type]?.win || 0;
    const loseCount = stats[type]?.lose || 0;
    const fastestTime = fastestGuessTime[type] || 0;

    statsInfo += `${type} - 胜：${winCount} 次，负：${loseCount} 次`;
    statsInfo +=
      fastestTime === 0 ? "" : `，最快${formatGameDuration(fastestTime)}`;
    statsInfo += "\n";
  });

  return statsInfo;
}

// 生成游戏结束时的答案提示信息。
export function generateGameEndMessage(gameInfo: GameRecord): string {
  return `答案是：【${gameInfo.wordGuess}】${
    gameInfo.wordAnswerChineseDefinition !== ""
      ? `${
          gameInfo.pinyin === "" ? "" : `\n拼音为：【${gameInfo.pinyin}】`
        }\n释义如下：\n${replaceEscapeCharacters(
          gameInfo.wordAnswerChineseDefinition
        )}`
      : ""
  }`;
}
