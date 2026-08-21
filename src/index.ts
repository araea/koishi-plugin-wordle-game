import * as fs from "fs";
import * as path from "path";
import { Context } from "koishi";
import {} from "koishi-plugin-puppeteer";
import {} from "koishi-plugin-monetary";
import {} from "koishi-plugin-markdown-to-image-service";
import { Config, usage } from "./config";
import { initialExtraCiyingRankInfo, initialFastestGuessTime, initialStats } from "./constants";
import type { GameContext } from "./context";
import type { PinyinItem2 } from "./types";
import {
  ensureDirExists,
  ensureFileExists,
  updateDataInTargetFile,
} from "./services/files";
import { register as registerBasic } from "./commands/basic";
import { register as registerGame } from "./commands/game";
import { register as registerLookup } from "./commands/lookup";
import { register as registerProgress } from "./commands/progress";
import { register as registerLeaderboard } from "./commands/leaderboard";

export { Config, usage };
export type {
  ExtraCiyingRankInfo,
  ExtraGameRecord,
  GameRecord,
  GamingPlayer,
  LetterState,
  PlayerRecord,
  PlayerStats,
  WinLoseStats,
  WordData,
  WordEntry,
} from "./types";

export const inject = {
  required: ["monetary", "database", "puppeteer"],
  optional: ["markdownToImage"],
};
export const name = "wordle-game";

// 插件的入口：加载资源、扩展数据表、构建运行时上下文并注册全部指令。
export async function apply(ctx: Context, config: Config) {
  // 是否已启用 QQ 官方机器人 Markdown 模板
  const isQQOfficialRobotMarkdownTemplateEnabled =
    config.isEnableQQOfficialRobotMarkdownTemplate &&
    config.key !== "" &&
    config.customTemplateId !== "";
  const logger = ctx.logger(`wordleGame`);

  // 资源与数据文件路径
  const wordleGameDirPath = path.join(ctx.baseDir, "data", "wordleGame");
  const idiomsFilePath = path.join(__dirname, "assets", "汉兜", "idioms.json");
  const pinyinFilePath = path.join(__dirname, "assets", "汉兜", "pinyin.json");
  const strokesFilePath = path.join(
    __dirname,
    "assets",
    "词影",
    "strokes.json"
  );
  const equationsFilePath = path.join(__dirname, "assets", "equations.json");
  const introductionFilePath = path.join(__dirname, "assets", "玩法介绍.png");
  const idiomsKoishiFilePath = path.join(wordleGameDirPath, "idioms.json");
  const pinyinKoishiFilePath = path.join(wordleGameDirPath, "pinyin.json");

  await ensureDirExists(wordleGameDirPath);
  await ensureFileExists(idiomsKoishiFilePath);
  await ensureFileExists(pinyinKoishiFilePath);

  await updateDataInTargetFile(logger, idiomsFilePath, idiomsKoishiFilePath, "idiom");
  await updateDataInTargetFile(logger, pinyinFilePath, pinyinKoishiFilePath, "term");

  // 加载静态资源与数据
  const idiomsData = fs.readFileSync(idiomsKoishiFilePath, "utf-8");
  const strokesData = JSON.parse(fs.readFileSync(strokesFilePath, "utf-8"));
  const pinyinData: PinyinItem2[] = JSON.parse(
    fs.readFileSync(pinyinKoishiFilePath, "utf8")
  );
  const equations: string[][] = JSON.parse(
    fs.readFileSync(equationsFilePath, "utf8")
  );
  const idiomsList = JSON.parse(idiomsData);
  const introductionImgBuffer = fs.readFileSync(introductionFilePath);

  // 扩展数据库表
  ctx.model.extend(
    "wordle_game_records",
    {
      id: "unsigned",
      isWin: "boolean",
      pinyin: "string",
      wordGuess: "string",
      channelId: "string",
      gameMode: "string",
      timestamp: "string",
      absentTones: "list",
      isAbsurd: "boolean",
      isStarted: "boolean",
      targetWord: "string",
      presentTones: "list",
      guessHistory: "list",
      isRunning: "boolean",
      correctLetters: "list",
      isHardMode: "boolean",
      previousGuess: "list",
      absentPinyins: "list",
      isFreeMode: "boolean",
      wordlesNum: "unsigned",
      presentPinyins: "list",
      absentLetters: "string",
      wordleIndex: "unsigned",
      presentLetters: "string",
      wordGuessHtmlCache: "text",
      remainingWordsList: "list",
      isChallengeMode: "boolean",
      isUltraHardMode: "boolean",
      guessWordLength: "unsigned",
      previousGuessIdioms: "list",
      presentTonesWithIndex: "list",
      correctTonesWithIndex: "list",
      presentPinyinsWithIndex: "list",
      presentLettersWithIndex: "list",
      correctPinyinsWithIndex: "list",
      remainingGuessesCount: "integer",
      wordAnswerChineseDefinition: "string",
      strokesHtmlCache: { type: "json", initial: [[], [], [], []] },
    },
    {
      primary: "id",
      autoInc: true,
    }
  );
  ctx.model.extend(
    "extra_wordle_game_records",
    {
      id: "unsigned",
      channelId: "string",
      wordAnswerChineseDefinition: "string",
      wordGuess: "string",
      wordGuessHtmlCache: "text",
      strokesHtmlCache: { type: "json", initial: [[], [], [], []] },
      guessWordLength: "unsigned",
      gameMode: "string",
      timestamp: "string",
      correctLetters: "list",
      presentLetters: "string",
      absentLetters: "string",
      wordlesNum: "unsigned",
      wordleIndex: "unsigned",
      isWin: "boolean",
      remainingGuessesCount: "integer",
      presentLettersWithIndex: "list",
      pinyin: "string",
      presentTonesWithIndex: "list",
      absentPinyins: "list",
      absentTones: "list",
      presentPinyinsWithIndex: "list",
      correctTonesWithIndex: "list",
      correctPinyinsWithIndex: "list",
      presentPinyins: "list",
      presentTones: "list",
      previousGuess: "list",
      previousGuessIdioms: "list",
    },
    {
      primary: "id",
      autoInc: true,
    }
  );
  ctx.model.extend(
    "wordle_gaming_player_records",
    {
      id: "unsigned",
      channelId: "string",
      username: "string",
      money: "unsigned",
      userId: "string",
    },
    {
      primary: "id",
      autoInc: true,
    }
  );
  ctx.model.extend(
    "wordle_player_records",
    {
      id: "unsigned",
      username: "string",
      userId: "string",
      lose: "unsigned",
      win: "unsigned",
      moneyChange: "double",
      wordGuessCount: "unsigned",
      stats: { type: "json", initial: initialStats },
      fastestGuessTime: { type: "json", initial: initialFastestGuessTime },
      extraCiyingRankInfo: {
        type: "json",
        initial: initialExtraCiyingRankInfo,
      },
    },
    {
      primary: "id",
      autoInc: true,
    }
  );

  // 构建运行时上下文
  const g: GameContext = {
    ctx,
    config,
    logger,
    isQQOfficialRobotMarkdownTemplateEnabled,
    paths: {
      wordleGameDir: wordleGameDirPath,
      idioms: idiomsFilePath,
      pinyin: pinyinFilePath,
      strokes: strokesFilePath,
      equations: equationsFilePath,
      introduction: introductionFilePath,
      idiomsKoishi: idiomsKoishiFilePath,
      pinyinKoishi: pinyinKoishiFilePath,
    },
    data: {
      idiomsList,
      pinyinData,
      strokesData,
      equations,
      introductionImgBuffer,
    },
    lastMessageInfo: new Map<string, { id: string; timestamp: number }>(),
    msgSeqMap: {},
  };

  // 注册指令
  registerBasic(g);
  registerGame(g);
  registerLookup(g);
  registerProgress(g);
  registerLeaderboard(g);
}
