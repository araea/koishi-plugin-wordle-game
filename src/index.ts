import { Context, h, noop, RuntimeError, Schema } from "koishi";
import {} from "koishi-plugin-puppeteer";
import {} from "koishi-plugin-monetary";
import {} from "koishi-plugin-markdown-to-image-service";

import { load } from "cheerio";
import * as path from "path";
import * as fs from "fs";

import { Ot as compareStrokes } from "./assets/词影/main.js";
import badWordsList from "./assets/Wordle/词汇/badWordsList.json";
import lowerCaseWordArray from "./assets/Wordle/词汇/lowerCaseWordArray.json";
// 7208
import commonIdiomsList from "./assets/commonIdiomsList.json";

export const inject = {
  required: ["monetary", "database", "puppeteer"],
  optional: ["markdownToImage"],
};
export const name = "wordle-game";
export const usage = `## 使用

1. 启用 \`monetary\`，\`database\` 和 \`puppeteer\` 服务。
2. 设置指令别名。
3. 输入 \`wordleGame.开始\` 指令引导游戏模式。
4. 输入猜测词。

## 注意事项

- 若输入成语时出现未知错误，可检查 \`data/wordleGame/idioms.json\` 文件，确认拼音是否正确。

## 特性

- 词影模式拥有细分排行榜，可通过 \`help\` 指令探索。
- 可在 \`idioms.json\` 中自行添加成语（如“原神启动”），注意 JSON 格式，末项无逗号。

## 关键指令

### \`wordleGame.开始 [待猜词长度]\`

开始游戏引导。

#### \`wordleGame.开始.<模式> [待猜词长度]\`

- **可用模式**:
  - \`经典\`, \`CET4/6\`, \`GMAT\`, \`GRE\`, \`IELTS\`, \`SAT\`, \`TOEFL\`, \`考研\`, \`专八/四\`
  - \`ALL\`, \`Lewdle\`, \`Numberle\`, \`Math\`, \`汉兜\`, \`词影\`

- **通用选项**:

  - \`--hard\` (困难模式)
    - 绿色线索必须保持固定。
    - 黄色线索必须重复使用。
    - 词影模式下，提高匹配难度。

  - \`--uhard\` (超困难模式)
    - 基于困难模式。
    - 黄色线索必须移离其原位。
    - 灰色线索不得再次使用。

  - \`--absurd\` (荒谬模式)
    - AI 将尽量避免给出答案，每次猜测仅透露最少信息，甚至可能更换秘密词。
    - [玩法参考](https://qntm.org/absurdle)

  - \`--challenge\` (挑战模式)
    - 高级玩家限定。要求从一个给定的目标词出发，反向推导秘密词。
    - [玩法参考](https://qntm.org/challenge)

  - \`--wordles <数量>\`
    - 同时猜测多个词，默认数量 1 ~ 4，可配置。

- **汉兜 & 词影专属选项**:

  - \`--free\` (自由模式)
    - 任意四字词语均可作为猜测词。

  - \`--all\` (全成语模式)
    - 开启后，词库扩展至 29766+ (含生僻字，极难)。
    - 关闭时，使用 7208 个常用成语 (义务教育)。

> 注：经典模式和汉兜模式可投入货币，获胜有奖励。可同时启用多种难度模式。

### \`wordleGame.猜 <猜测内容>\`

- 猜单词、成语等。
- 选项:
  - \`-r\`: 随机猜测一次。

## QQ 群

- 956758505
`;

// pz* pzx*
export interface Config {
  isDarkThemeEnabled: boolean;
  isHighContrastThemeEnabled: boolean;
  // shouldAddBorderInHandleMode: boolean

  defaultMaxLeaderboardEntries: number;
  defaultWordLengthForGuessing: number;
  maxInvestmentCurrency: number;
  defaultRewardMultiplier: number;
  maxSimultaneousGuesses: number;
  compositeImagePageWidth: number;
  compositeImagePageHeight: number;

  allowNonPlayersToGuess: boolean;
  enableWordGuessMiddleware: boolean;
  shouldPromptWordLengthInput: boolean;
  isPreventUserDuplicateGuessInput: boolean;
  shouldPromptForWordLengthOnNonClassicStart: boolean;

  enableWordGuessTimeLimit: boolean;
  wordGuessTimeLimitInSeconds: number;

  retractDelay: number;
  imageType: "png" | "jpeg" | "webp";
  isTextToImageConversionEnabled: boolean;
  isEnableQQOfficialRobotMarkdownTemplate: boolean;
  customTemplateId: string;
  key: string;
  numberOfMessageButtonsPerRow: number;
  isUsingUnifiedKoishiBuiltInUsername: boolean;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isDarkThemeEnabled: Schema.boolean()
      .default(false)
      .description(`是否开启黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean()
      .default(false)
      .description(`是否开启高对比度（色盲）主题。`),
    // shouldAddBorderInHandleMode: Schema.boolean().default(true).description(`是否为块添加边框，仅在汉兜模式下生效。`),
  }).description("主题设置"),

  Schema.object({
    compositeImagePageWidth: Schema.number()
      .min(1)
      .default(800)
      .description(`合成图片页面宽度。`),
    compositeImagePageHeight: Schema.number()
      .min(1)
      .default(100)
      .description(`合成图片页面高度。`),
    maxSimultaneousGuesses: Schema.number()
      .min(1)
      .default(4)
      .description(`最多同时猜测单词的数量。`),
    maxInvestmentCurrency: Schema.number()
      .min(0)
      .default(50)
      .description(`加入游戏时可投入的最大货币数额。`),
    defaultMaxLeaderboardEntries: Schema.number()
      .min(0)
      .default(10)
      .description(`显示排行榜时默认的最大人数。`),
    defaultRewardMultiplier: Schema.number()
      .min(0)
      .default(2)
      .description(`猜单词经典模式赢了之后奖励的货币倍率。`),
    defaultWordLengthForGuessing: Schema.number()
      .min(1)
      .default(5)
      .description(`非经典游戏模式下，默认的猜单词长度。`),
  }).description("游戏设置"),

  Schema.intersect([
    Schema.object({
      enableWordGuessMiddleware: Schema.boolean()
        .default(true)
        .description(`是否开启猜单词指令无前缀的中间件。`),
      isPreventUserDuplicateGuessInput: Schema.boolean()
        .default(true)
        .description(`是否阻止用户重复输入相同的猜测词。`),
      shouldPromptWordLengthInput: Schema.boolean()
        .default(true)
        .description(
          `是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。`
        ),
      allowNonPlayersToGuess: Schema.boolean()
        .default(true)
        .description(
          `是否允许未加入游戏的玩家进行猜单词的操作，开启后可以无需加入直接开始。`
        ),
      shouldPromptForWordLengthOnNonClassicStart: Schema.boolean()
        .default(true)
        .description(
          `是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。`
        ),
    }).description("游戏行为设置"),
    Schema.object({
      enableWordGuessTimeLimit: Schema.boolean()
        .default(false)
        .description(`是否开启猜单词游戏作答时间限制功能。`),
    }),
    Schema.union([
      Schema.object({
        enableWordGuessTimeLimit: Schema.const(true).required(),
        wordGuessTimeLimitInSeconds: Schema.number()
          .min(0)
          .default(120)
          .description(`猜单词游戏作答时间，单位是秒。`),
      }),
      Schema.object({}),
    ]),
    Schema.object({
      retractDelay: Schema.number()
        .min(0)
        .default(0)
        .description(
          `撤回上一条消息的等待时间，单位是秒。值为 0 时不启用自动撤回功能。`
        ),
      imageType: Schema.union(["png", "jpeg", "webp"])
        .default("png")
        .description(`发送的图片类型。`),
      isTextToImageConversionEnabled: Schema.boolean()
        .default(false)
        .description(
          `是否开启将文本转为图片的功能（可选），如需启用，需要启用 \`markdownToImage\` 服务。`
        ),
      isEnableQQOfficialRobotMarkdownTemplate: Schema.boolean()
        .default(false)
        .description(`是否启用 QQ 官方机器人的 Markdown 模板，带消息按钮。`),
    }),
    Schema.union([
      Schema.object({
        isEnableQQOfficialRobotMarkdownTemplate: Schema.const(true).required(),
        customTemplateId: Schema.string()
          .default("")
          .description(`自定义模板 ID。`),
        key: Schema.string()
          .default("")
          .description(
            `文本内容中特定插值的 key，用于存放文本。如果你的插值为 {{.info}}，那么请在这里填 info。`
          ),
        numberOfMessageButtonsPerRow: Schema.number()
          .min(4)
          .max(5)
          .default(4)
          .description(`每行消息按钮的数量。`),
        isUsingUnifiedKoishiBuiltInUsername: Schema.boolean()
          .default(true)
          .description(`是否使用统一的 Koishi 内置用户名。`),
      }),
      Schema.object({}),
    ]),
  ]),
]) as any;

// smb*
declare module "koishi" {
  interface Tables {
    wordle_game_records: GameRecord;
    extra_wordle_game_records: ExtraGameRecord;
    wordle_gaming_player_records: GamingPlayer;
    wordle_player_records: PlayerRecord;
    monetary: Monetary;
  }
}

// jk*
interface Monetary {
  uid: number;
  currency: string;
  value: number;
}

export interface GameRecord {
  id: number;
  channelId: string;
  isStarted: boolean;
  gameMode: string;
  wordGuessHtmlCache: string;
  strokesHtmlCache: string[][];
  remainingGuessesCount: number;
  wordAnswerChineseDefinition: string;
  guessWordLength: number;
  wordGuess: string;
  isRunning: boolean;
  isHardMode: boolean;
  isUltraHardMode: boolean;
  correctLetters: string[];
  presentLetters: string;
  presentLettersWithIndex: string[];
  absentLetters: string;
  correctPinyinsWithIndex: string[];
  presentPinyins: string[];
  presentTones: string[];
  presentPinyinsWithIndex: string[];
  absentPinyins: string[];
  correctTonesWithIndex: string[];
  presentTonesWithIndex: string[];
  absentTones: string[];
  timestamp: string;
  remainingWordsList: string[];
  isAbsurd: boolean;
  isChallengeMode: boolean;
  targetWord: string;
  wordlesNum: number;
  wordleIndex: number;
  isWin: boolean;
  pinyin: string;
  isFreeMode: boolean;
  previousGuess: string[];
  previousGuessIdioms: string[];
  guessHistory: string[];
}

export interface ExtraGameRecord {
  id: number;
  channelId: string;
  gameMode: string;
  wordGuessHtmlCache: string;
  strokesHtmlCache: string[][];
  wordAnswerChineseDefinition: string;
  guessWordLength: number;
  wordGuess: string;
  correctLetters: string[];
  presentLetters: string;
  presentLettersWithIndex: string[];
  absentLetters: string;
  correctPinyinsWithIndex: string[];
  presentPinyinsWithIndex: string[];
  absentPinyins: string[];
  presentPinyins: string[];
  presentTones: string[];
  correctTonesWithIndex: string[];
  presentTonesWithIndex: string[];
  absentTones: string[];
  timestamp: string;
  wordlesNum: number;
  wordleIndex: number;
  isWin: boolean;
  remainingGuessesCount: number;
  pinyin: string;
  previousGuess: string[];
  previousGuessIdioms: string[];
}

export interface GamingPlayer {
  id: number;
  channelId: string;
  userId: string;
  username: string;
  money: number;
}

export interface PlayerRecord {
  id: number;
  userId: string;
  username: string;
  win: number;
  lose: number;
  moneyChange: number;
  wordGuessCount: number;
  stats: PlayerStats;
  fastestGuessTime: Record<string, number>;
  extraCiyingRankInfo: ExtraCiyingRankInfo;
}

interface WordData {
  word: string;
  translation: string;
  wordCount: number;
}

interface PlayerStats {
  经典?: WinLoseStats;
  Lewdle?: WinLoseStats;
  CET4?: WinLoseStats;
  CET6?: WinLoseStats;
  GMAT?: WinLoseStats;
  GRE?: WinLoseStats;
  IELTS?: WinLoseStats;
  SAT?: WinLoseStats;
  TOEFL?: WinLoseStats;
  考研?: WinLoseStats;
  专八?: WinLoseStats;
  专四?: WinLoseStats;
  ALL?: WinLoseStats;
  汉兜?: WinLoseStats;
  Numberle?: WinLoseStats;
  Math?: WinLoseStats;
  词影?: WinLoseStats;
}

interface WinLoseStats {
  win: number;
  lose: number;
}

interface ExtraCiyingRankInfo {
  successCountIn1HardMode: number;
  successCountIn1Mode: number;
  successCountIn2Mode: number;
  successCountIn3Mode: number;
  successCountIn4Mode: number;

  winIn1HardMode: number;
  winIn1Mode: number;
  winIn2Mode: number;
  winIn3Mode: number;
  winIn4Mode: number;

  loseIn1HardMode: number;
  loseIn1Mode: number;
  loseIn2Mode: number;
  loseIn3Mode: number;
  loseIn4Mode: number;

  fastestGuessTimeIn1HardMode: number;
  fastestGuessTimeIn1Mode: number;
  fastestGuessTimeIn2Mode: number;
  fastestGuessTimeIn3Mode: number;
  fastestGuessTimeIn4Mode: number;
}

const initialExtraCiyingRankInfo: ExtraCiyingRankInfo = {
  successCountIn1HardMode: 0,
  successCountIn1Mode: 0,
  successCountIn2Mode: 0,
  successCountIn3Mode: 0,
  successCountIn4Mode: 0,
  winIn1HardMode: 0,
  winIn1Mode: 0,
  winIn2Mode: 0,
  winIn3Mode: 0,
  winIn4Mode: 0,
  loseIn1HardMode: 0,
  loseIn1Mode: 0,
  loseIn2Mode: 0,
  loseIn3Mode: 0,
  loseIn4Mode: 0,
  fastestGuessTimeIn1HardMode: 0,
  fastestGuessTimeIn1Mode: 0,
  fastestGuessTimeIn2Mode: 0,
  fastestGuessTimeIn3Mode: 0,
  fastestGuessTimeIn4Mode: 0,
};

const initialStats: PlayerStats = {
  经典: { win: 0, lose: 0 },
  Lewdle: { win: 0, lose: 0 },
  CET4: { win: 0, lose: 0 },
  CET6: { win: 0, lose: 0 },
  GMAT: { win: 0, lose: 0 },
  GRE: { win: 0, lose: 0 },
  IELTS: { win: 0, lose: 0 },
  SAT: { win: 0, lose: 0 },
  TOEFL: { win: 0, lose: 0 },
  考研: { win: 0, lose: 0 },
  专八: { win: 0, lose: 0 },
  专四: { win: 0, lose: 0 },
  ALL: { win: 0, lose: 0 },
  Numberle: { win: 0, lose: 0 },
  Math: { win: 0, lose: 0 },
  汉兜: { win: 0, lose: 0 },
  词影: { win: 0, lose: 0 },
};

const initialFastestGuessTime: Record<string, number> = {
  经典: 0,
  Lewdle: 0,
  CET4: 0,
  CET6: 0,
  GMAT: 0,
  GRE: 0,
  IELTS: 0,
  SAT: 0,
  TOEFL: 0,
  考研: 0,
  专八: 0,
  专四: 0,
  ALL: 0,
  汉兜: 0,
  Numberle: 0,
  Math: 0,
  词影: 0,
};

interface LetterState {
  letter: string;
  state: "correct" | "present" | "absent" | "undefined";
}

interface WordEntry {
  word: string;
  translation: string;
}

interface PinyinItem2 {
  term: string;
  pinyin: string;
}

// bl* cl*

// zhs*
export async function apply(ctx: Context, config: Config) {
  // cl*
  const isQQOfficialRobotMarkdownTemplateEnabled =
    config.isEnableQQOfficialRobotMarkdownTemplate &&
    config.key !== "" &&
    config.customTemplateId !== "";
  // rz*
  const logger = ctx.logger(`wordleGame`);
  // wj*
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

  await updateDataInTargetFile(idiomsFilePath, idiomsKoishiFilePath, "idiom");
  await updateDataInTargetFile(pinyinFilePath, pinyinKoishiFilePath, "term");

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
  // tzb*
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
  // zjj*
  ctx.middleware(async (session, next) => {
    let { channelId, content } = session;
    if (!config.enableWordGuessMiddleware) {
      return await next();
    }

    if (content) {
      content = `${h.select(content, "text")}`.trim();
    }

    const gameInfo = await getGameInfo(channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await next();
    }
    // 判断输入
    if (gameInfo.gameMode === "汉兜" || gameInfo.gameMode === "词影") {
      if (!isFourCharacterIdiom(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === "Numberle") {
      if (!isNumericString(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === "Math") {
      if (!isMathEquationValid(content)) {
        return await next();
      }
    } else {
      if (!/^[a-zA-Z]+$/.test(content)) {
        return await next();
      }
    }

    if (content.length !== gameInfo.guessWordLength) {
      return await next();
    }

    await session.execute(`wordleGame.猜 ${content}`);
    return;
  });
  // zl*
  // wordleGame帮助 bz* h*
  ctx.command("wordleGame", "猜单词游戏帮助").action(async ({ session }) => {
    let { channelId, username, userId } = session;
    // 更新玩家记录表中的用户名
    username = await getSessionUserName(session);
    await updateNameInPlayerRecord(session, userId, username);
    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
      return await sendMessage(
        session,
        `🌸🎐 《WordleGame》 🎐🌸
😆 欢迎游玩~ 祝您玩得开心！`,
        `改名 玩法介绍 排行榜 查询玩家记录 开始游戏`,
        3
      );
    }
    await session.execute(`wordleGame -h`);
  });
  // 玩法介绍 wfjs*
  ctx
    .command("wordleGame.玩法介绍", "游戏玩法介绍")
    .action(async ({ session }) => {
      let { channelId, username, userId } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      return sendMessage(
        session,
        h.image(introductionImgBuffer, `image/${config.imageType}`),
        ``
      );
    });
  // wordleGame.加入 j* jr*
  ctx
    .command("wordleGame.加入 [money:number]", "加入游戏")
    .action(async ({ session }, money = 0) => {
      let { channelId, userId, username, user } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      let gameInfo: any = await getGameInfo(channelId);
      const isInGame = await isPlayerInGame(channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(
            session,
            `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`,
            `猜测`
          );
        } else {
          const wordlesNum = gameInfo.wordlesNum;
          const isAbsurd = gameInfo.isAbsurd;
          // 生成 html 字符串
          let imageBuffers: Buffer[] = [];
          let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
          for (
            let wordleIndex = 1;
            wordleIndex < wordlesNum + 1;
            wordleIndex++
          ) {
            if (wordleIndex > 1) {
              gameInfo = await getGameInfo2(channelId, wordleIndex);
            }
            if (gameInfo.gameMode === "汉兜") {
              const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4);
              imageBuffer = await generateImageForHandle(
                `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
              );
            } else {
              const emptyGridHtml = isAbsurd
                ? generateEmptyGridHtml(1, gameInfo.guessWordLength)
                : generateEmptyGridHtml(
                    gameInfo.remainingGuessesCount,
                    gameInfo.guessWordLength
                  );
              const styledHtml = generateStyledHtml(
                gameInfo.guessWordLength + 1
              );
              // 图
              imageBuffer = await generateImage(
                styledHtml,
                `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
              );
            }
            imageBuffers.push(imageBuffer);
          }
          if (wordlesNum > 1) {
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(htmlImgString);
          }
          // 返回提示和游戏进程图
          if (
            !config.isTextToImageConversionEnabled &&
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            await sendMessage(
              session,
              h.image(imageBuffer, `image/${config.imageType}`),
              ``
            );
            return await sendMessage(
              session,
              `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！`,
              `猜测`
            );
          } else {
            return await sendMessage(
              session,
              `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！\n${h.image(
                imageBuffer,
                `image/${config.imageType}`
              )}`,
              `猜测`
            );
          }
        }
      }
      // 判断输入
      if (typeof money !== "number" || money < 0) {
        return await sendMessage(
          session,
          `【@${username}】\n真是个傻瓜呢~\n投个钱也要别人教你嘛！`,
          `改名 加入游戏`
        );
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(
          session,
          `【@${username}】\n咱们这是小游戏呀...\n不许玩这么大！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】`,
          `改名 加入游戏`
        );
      }
      // @ts-ignore
      const uid = user.id;
      let getUserMonetary = await ctx.database.get("monetary", { uid });
      if (getUserMonetary.length === 0) {
        await ctx.database.create("monetary", {
          uid,
          value: 0,
          currency: "default",
        });
        getUserMonetary = await ctx.database.get("monetary", { uid });
      }
      const userMonetary = getUserMonetary[0];
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      // 修改金额
      if (isInGame) {
        // 余额够
        if (userMonetary.value >= money) {
          await ctx.database.set(
            "wordle_gaming_player_records",
            { channelId, userId },
            { money }
          );
          return await sendMessage(
            session,
            `【@${username}】\n修改投入金额成功！\n当前投入金额为：【${money}】\n当前玩家人数：${numberOfPlayers} 名！`,
            `改名 加入游戏 开始游戏`
          );
        } else {
          // 余额不够
          await ctx.database.set(
            "wordle_gaming_player_records",
            { channelId, userId },
            { money: userMonetary.value }
          );
          return await sendMessage(
            session,
            `【@${username}】\n修改投入金额成功！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers} 名！`,
            `改名 加入游戏 开始游戏`
          );
        }
      }
      // 加入游戏
      // money 为 0
      if (money === 0) {
        await ctx.database.create("wordle_gaming_player_records", {
          channelId,
          userId,
          username,
          money,
        });
        // 有余额
        if (userMonetary.value > 0) {
          return await sendMessage(
            session,
            `【@${username}】\n您成功加入游戏了！\n如果您想玩的模式为：【经典】\n那您可以带上货币数额再加入一次！\n当前的最大投入金额为：【${
              config.maxInvestmentCurrency
            }】\n当前奖励倍率为：【${
              config.defaultRewardMultiplier
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
          );
        } else {
          // 没余额
          return await sendMessage(
            session,
            `【@${username}】\n您成功加入游戏了！\n加油哇，祝您好运！\n当前玩家人数：${
              numberOfPlayers + 1
            } 名！`,
            `改名 加入游戏 开始游戏`
          );
        }
      } else {
        // money !== 0
        // 余额足够
        if (userMonetary.value >= money) {
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money,
          });
          return await sendMessage(
            session,
            `【@${username}】\n您成功加入游戏了！您投入的金额为：【${money}】\n当前奖励倍率为：【${
              config.defaultRewardMultiplier
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
          );
        } else {
          // 余额不够
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money: userMonetary.value,
          });
          return await sendMessage(
            session,
            `【@${username}】\n您成功加入游戏了！\n不过好像余额不足啦！\n投入金额已修正为：【${
              userMonetary.value
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
          );
        }
      }
      // .action
    });
  // wordleGame.退出 q* tc*
  ctx.command("wordleGame.退出", "退出游戏").action(async ({ session }) => {
    let { channelId, userId, username } = session;
    // 更新玩家记录表中的用户名
    username = await getSessionUserName(session);
    await updateNameInPlayerRecord(session, userId, username);
    // 游戏状态
    const gameInfo = await getGameInfo(channelId);
    if (gameInfo.isStarted) {
      return await sendMessage(
        session,
        `【@${username}】\n游戏已经开始啦！\n无法进行此操作！`,
        `猜测`
      );
    }
    // 玩家
    const isInGame = await isPlayerInGame(channelId, userId);
    if (!isInGame) {
      return await sendMessage(
        session,
        `【@${username}】\n您还没加入游戏呢！\n怎么退出？`,
        `改名 加入游戏`
      );
    }
    // 退出
    await ctx.database.remove("wordle_gaming_player_records", {
      channelId,
      userId,
    });
    const numberOfPlayers = await getNumberOfPlayers(channelId);
    return await sendMessage(
      session,
      `【@${username}】\n您成功退出游戏啦！\n那就让我们下次再见吧~\n剩余玩家人数：${numberOfPlayers} 名！`,
      `改名 退出游戏 开始游戏 加入游戏`,
      2
    );
    // .action
  });
  // wordleGame.结束 s* js*
  ctx.command("wordleGame.结束", "结束游戏").action(async ({ session }) => {
    let { channelId, userId, username, timestamp } = session;
    // 更新玩家记录表中的用户名
    username = await getSessionUserName(session);
    await updateNameInPlayerRecord(session, userId, username);
    // 游戏状态
    const gameInfo = await getGameInfo(channelId);
    if (!gameInfo.isStarted) {
      return await sendMessage(
        session,
        `【@${username}】\n游戏还没开始哦~怎么结束呐？`,
        `改名 开始游戏`
      );
    }
    // 玩家记录输
    await updatePlayerRecordsLose(channelId, gameInfo);
    // 结束
    const processedResult: string =
      gameInfo.wordlesNum > 1
        ? `\n${await processExtraGameRecords(channelId)}`
        : "";

    const duration = calculateGameDuration(
      Number(gameInfo.timestamp),
      timestamp
    );
    const message = `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${
      gameInfo.isAbsurd ? "" : `\n${generateGameEndMessage(gameInfo)}`
    }${processedResult}`;
    await sendMessage(
      session,
      message,
      `改名 玩法介绍 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
      2
    );
    await endGame(channelId);
    return;
    // .action
  });
  // wordleGame.开始 s* ks*
  ctx
    .command("wordleGame.开始 [guessWordLength:number]", "开始游戏引导")
    .option("hard", "--hard 困难模式", { fallback: false })
    .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
    .option("absurd", "--absurd 变态模式", { fallback: false })
    .option("challenge", "--challenge 变态挑战模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 同时猜测多个单词", {
      fallback: 1,
    })
    .action(async ({ session, options }, guessWordLength) => {
      let { channelId, userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      if (
        typeof options.wordles !== "number" ||
        options.wordles < 1 ||
        options.wordles > config.maxSimultaneousGuesses
      ) {
        return await sendMessage(
          session,
          `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
          `改名 开始游戏`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          session,
          `【@${username}】\n游戏已经开始了哦~`,
          `猜测`
        );
      }
      // 提示输入
      await sendMessage(
        session,
        `【@${username}】\n${
          isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq"
            ? ``
            : `可选模式如下：\n${exams
                .map((exam, index) => `${index + 1}. ${exam}`)
                .join("\n")}`
        }
请输入要开始的${
          isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq"
            ? ``
            : `【序号】或`
        }【模式名】：`,
        `经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`,
        4
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          session,
          `【@${username}】\n输入无效或超时。`,
          `改名 开始游戏`
        );
      // 判断 userInput 是否为有效输入
      const selectedExam = isNaN(parseInt(userInput))
        ? userInput.toUpperCase().trim()
        : exams[parseInt(userInput) - 1].toUpperCase();
      const examsInUpperCase = exams.map((exam) => exam.toUpperCase());
      if (examsInUpperCase.includes(selectedExam)) {
        if (!guessWordLength) {
          if (
            config.shouldPromptWordLengthInput &&
            selectedExam !== "经典" &&
            selectedExam !== "LEWDLE" &&
            selectedExam !== "汉兜" &&
            selectedExam !== "词影"
          ) {
            await sendMessage(
              session,
              `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(
                selectedExam
              )}\n请输入待猜项目的的长度：`,
              `输入`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 开始游戏`
              );
            guessWordLength = parseInt(userInput);
          } else {
            guessWordLength = config.defaultWordLengthForGuessing;
          }
        }
        const hardOption = options.hard ? ` --hard` : "";
        const uhardOption = options.ultraHardMode ? ` --uhard` : "";
        const absurdOption = options.absurd ? ` --absurd` : "";
        const challengeOption = options.challenge ? ` --challenge` : "";
        const wordlesOption =
          options.wordles > 1 ? `--wordles ${options.wordles}` : "";
        const command = `wordleGame.开始.${selectedExam}${hardOption}${uhardOption}${absurdOption}${challengeOption}${wordlesOption} ${guessWordLength}`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          session,
          `【@${username}】\n您的输入无效，请重试。`,
          `改名 开始游戏`
        );
      }
      // .action
    });
  // wordleGame.开始.经典 jd*
  ctx
    .command("wordleGame.开始.经典", "开始经典猜单词游戏")
    .option("hard", "--hard 困难模式", { fallback: false })
    .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
    .option("absurd", "--absurd 变态模式", { fallback: false })
    .option("challenge", "--challenge 变态挑战模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 同时猜测多个单词", {
      fallback: 1,
    })
    .action(async ({ session, options }) => {
      let { channelId, userId, username, platform, timestamp } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      if (
        isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        await sendMessage(
          session,
          `【@${username}】\n附加游戏模式（可多选）：`,
          `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`,
          4
        );
        const userInput = await session.prompt();

        if (!userInput) {
          return await sendMessage(
            session,
            `【@${username}】\n输入无效或超时。`,
            `改名 开始游戏`
          );
        }

        const modes = {
          困难: "hard",
          超困难: "ultraHardMode",
          变态: "absurd",
          变态挑战: "challenge",
        };

        const wordles = {
          x1: 1,
          x2: 2,
          x3: 3,
          x4: 4,
        };

        for (const mode in modes) {
          if (userInput.includes(mode)) {
            options[modes[mode]] = true;
          }
        }

        for (const wordle in wordles) {
          if (userInput.includes(wordle)) {
            options.wordles = wordles[wordle];
          }
        }

        if (userInput.includes("跳过")) {
          noop();
        }
      }
      if (
        typeof options.wordles !== "number" ||
        options.wordles < 1 ||
        options.wordles > config.maxSimultaneousGuesses
      ) {
        return await sendMessage(
          session,
          `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
          `改名 开始游戏`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          session,
          `【@${username}】\n游戏已经开始了哦~`,
          `猜测`
        );
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(
          session,
          `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`,
          `改名 加入游戏`
        );
      }
      // 经典扣钱
      await deductMoney(channelId, platform);
      // 开始游戏
      // 选待猜单词
      // 随机选择一个单词并小写化
      const selectedWords: string[] = [];
      const randomWord: string =
        lowerCaseWordArray[
          Math.floor(Math.random() * lowerCaseWordArray.length)
        ].toLowerCase();
      selectedWords.push(randomWord);

      let isHardMode = options.hard;
      let isUltraHardMode = options.ultraHardMode;
      let isChallengeMode = options.challenge;
      let isAbsurdMode = isChallengeMode ? true : options.absurd;
      const wordlesNum = options.wordles;
      if (isUltraHardMode) {
        isHardMode = true;
      }
      if (wordlesNum > 1) {
        isHardMode = false;
        isUltraHardMode = false;
        isChallengeMode = false;
        isAbsurdMode = false;
      }

      const correctLetters: string[] = new Array(5).fill("*");

      const foundWord = findWord(randomWord);

      await ctx.database.set(
        "wordle_game_records",
        { channelId },
        {
          isStarted: true,
          wordGuess: randomWord,
          wordAnswerChineseDefinition: replaceEscapeCharacters(
            foundWord.translation
          ),
          remainingGuessesCount: 6 + wordlesNum - 1,
          guessWordLength: 5,
          gameMode: "经典",
          timestamp: String(timestamp),
          isHardMode: isHardMode,
          isUltraHardMode,
          correctLetters: correctLetters,
          presentLetters: "",
          absentLetters: "",
          isAbsurd: isAbsurdMode,
          isChallengeMode: isChallengeMode,
          targetWord: randomWord,
          wordlesNum: wordlesNum,
          wordleIndex: 1,
        }
      );

      if (wordlesNum > 1) {
        let randomWordExtra: string = "";
        for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {
          while (selectedWords.length < wordleIndex) {
            randomWordExtra =
              lowerCaseWordArray[
                Math.floor(Math.random() * lowerCaseWordArray.length)
              ].toLowerCase();
            if (!selectedWords.includes(randomWordExtra)) {
              selectedWords.push(randomWordExtra);
            }
          }
          const foundWordExtra = findWord(randomWordExtra);
          await ctx.database.create("extra_wordle_game_records", {
            channelId,
            remainingGuessesCount: 6 + wordlesNum - 1,
            guessWordLength: 5,
            wordGuess: randomWordExtra,
            wordAnswerChineseDefinition: replaceEscapeCharacters(
              foundWordExtra.translation
            ),
            gameMode: "经典",
            timestamp: String(timestamp),
            correctLetters: correctLetters,
            presentLetters: "",
            absentLetters: "",
            wordlesNum: wordlesNum,
            wordleIndex,
          });
        }
      }
      // 游戏图
      const emptyGridHtml = isAbsurdMode
        ? generateEmptyGridHtml(1, 5)
        : generateEmptyGridHtml(6 + wordlesNum - 1, 5);
      const styledHtml = generateStyledHtml(6);
      let imageBuffer = await generateImage(styledHtml, emptyGridHtml);
      let imageBuffers: Buffer[] = [];
      if (wordlesNum > 1) {
        for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
          imageBuffers.push(imageBuffer);
        }
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
      }

      const gameMode = `【经典${wordlesNum > 1 ? `（x${wordlesNum}）` : ""}${
        isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""
      }${isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""}】`;
      const targetWord = isChallengeMode
        ? `\n目标单词为：【${randomWord}】`
        : "";
      const wordLength = "单词长度为：【5】";
      const guessChance = `猜单词机会为：【${
        isAbsurdMode ? "♾️" : `${6 + wordlesNum - 1}`
      }】`;
      const wordCount = "待猜单词数量为：【2315】";
      const timeLimit = config.enableWordGuessTimeLimit
        ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒`
        : "";
      const image = h.image(imageBuffer, `image/${config.imageType}`);

      const message = `游戏开始！\n当前游戏模式为：${gameMode}${
        isChallengeMode ? targetWord : ""
      }\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}\n${image}`;

      if (
        !config.isTextToImageConversionEnabled &&
        isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        await sendMessage(session, image, ``);
        return await sendMessage(
          session,
          `游戏开始！\n当前游戏模式为：${gameMode}${
            isChallengeMode ? targetWord : ""
          }\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}`,
          `结束游戏 猜测`,
          2
        );
      }
      return await sendMessage(session, message, `结束游戏 猜测`);
      // .action
    });
  const exams = [
    "经典",
    "CET4",
    "CET6",
    "GMAT",
    "GRE",
    "IELTS",
    "SAT",
    "TOEFL",
    "考研",
    "专八",
    "专四",
    "ALL",
    "Lewdle",
    "汉兜",
    "Numberle",
    "Math",
    "词影",
  ];
  exams.forEach((exam) => {
    if (exam !== "经典") {
      // 10* fjd*
      ctx
        .command(
          `wordleGame.开始.${exam} [guessWordLength:number]`,
          `开始猜${exam}单词游戏`
        )
        .option("free", "--free 自由模式（仅限汉兜与词影）", {
          fallback: false,
        })
        .option("all", "--all 全成语模式（仅限汉兜与词影）", {
          fallback: false,
        })
        .option("hard", "--hard 困难模式", { fallback: false })
        .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
        .option("absurd", "--absurd 变态模式", { fallback: false })
        .option("challenge", "--challenge 变态挑战模式", { fallback: false })
        .option("wordles", "--wordles <value:number> 同时猜测多个", {
          fallback: 1,
        })
        .action(async ({ session, options }, guessWordLength) => {
          let { channelId, userId, username, timestamp, platform } = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session);
          await updateNameInPlayerRecord(session, userId, username);
          if (
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = "";
            let numberOfMessageButtonsPerRow = 2;
            if (exam === "汉兜" || exam === "词影") {
              markdownCommands = `困难 超困难 x1 x2 x3 x4 自由 全成语 跳过`;
            } else if (exam === "Numberle" || exam === "Math") {
              markdownCommands = `困难 超困难 x1 x2 x3 x4 跳过`;
            } else {
              markdownCommands = `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`;
            }
            await sendMessage(
              session,
              `【@${username}】\n附加游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 开始游戏`
              );
            }

            if (exam === "汉兜" || exam === "词影") {
              options.free = userInput.includes(`自由`);
              options.all = userInput.includes(`全成语`);
            }

            const modes = {
              困难: "hard",
              超困难: "ultraHardMode",
              变态: "absurd",
              变态挑战: "challenge",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }

          if (!guessWordLength) {
            if (
              config.shouldPromptForWordLengthOnNonClassicStart &&
              exam !== "Lewdle" &&
              exam !== "汉兜" &&
              exam !== "词影"
            ) {
              await sendMessage(
                session,
                `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(
                  exam
                )}\n请输入待猜测项目的长度：`,
                `输入`
              );
              const userInput = await session.prompt();
              if (!userInput)
                return await sendMessage(
                  session,
                  `【@${username}】\n输入无效或超时。`,
                  `改名 开始游戏`
                );
              guessWordLength = parseInt(userInput);
            } else {
              guessWordLength = config.defaultWordLengthForGuessing;
            }
          }
          if (
            typeof options.wordles !== "number" ||
            options.wordles < 1 ||
            options.wordles > config.maxSimultaneousGuesses
          ) {
            return await sendMessage(
              session,
              `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个的话~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
              `改名 开始游戏`
            );
          }

          // 判断输入
          if (
            typeof guessWordLength !== "number" ||
            (!isValidGuessWordLength(exam, guessWordLength) &&
              exam !== "Lewdle" &&
              exam !== "汉兜" &&
              exam !== "词影")
          ) {
            return await sendMessage(
              session,
              `【@${username}】\n无效的长度参数！\n${exam} 长度可选值范围：${getValidGuessWordLengthRange(
                exam
              )}`,
              `改名 开始游戏`
            );
          }

          // 游戏状态
          const gameInfo = await getGameInfo(channelId);
          if (gameInfo.isStarted) {
            return await sendMessage(
              session,
              `【@${username}】\n游戏已经开始了哦~`,
              `猜测`
            );
          }

          // 人数
          const numberOfPlayers = await getNumberOfPlayers(channelId);
          if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
            return await sendMessage(
              session,
              `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜测】\n先加入游戏吧~`,
              `改名 加入游戏`
            );
          }

          // 非经典还钱
          if (exam !== "汉兜") {
            await updateGamingPlayerRecords(channelId);
          } else {
            // 汉兜 扣钱
            await deductMoney(channelId, platform);
          }

          const selectedWords: string[] = [];
          // 开始游戏
          let randomWord: string = "";
          let translation: string = "";
          let wordCount: number = 0;
          let pinyin: string = "";
          if (exam === "Lewdle") {
            const randomLowerCaseWord = getRandomFromStringList(badWordsList);
            guessWordLength = randomLowerCaseWord.length;
            const foundWord = findWord(randomLowerCaseWord);
            randomWord = randomLowerCaseWord;
            translation = foundWord ? foundWord.translation : "";
          } else if (exam === "汉兜" || exam === "词影") {
            const randomIdiom = getRandomFromStringList(commonIdiomsList);
            let selectedIdiom;

            if (options.all) {
              selectedIdiom = getRandomIdiom(idiomsList);
            } else {
              selectedIdiom = await getSelectedIdiom(randomIdiom);
            }

            guessWordLength = 4;
            pinyin = selectedIdiom.pinyin;
            randomWord = options.all ? selectedIdiom.idiom : randomIdiom;
            translation = selectedIdiom.explanation;
          } else if (exam === "Numberle") {
            randomWord = generateNumberString(guessWordLength);
            translation = "";
          } else if (exam === "Math") {
            randomWord = getRandomFromStringList(equations[guessWordLength]);
            translation = "";
          } else {
            const result = getRandomWordTranslation(exam, guessWordLength);
            randomWord = result.word;
            translation = result.translation;
            wordCount = result.wordCount;
          }
          selectedWords.push(randomWord);
          let isFreeMode = options.free;
          let isHardMode = options.hard;
          let isUltraHardMode = options.ultraHardMode;
          let isChallengeMode = options.challenge;
          let isAbsurdMode = isChallengeMode ? true : options.absurd;
          const wordlesNum = options.wordles;
          if (isUltraHardMode) {
            isHardMode = true;
          }

          // if (exam === '汉兜') {
          //   isHardMode = false
          //   isUltraHardMode = false
          //   isChallengeMode = false
          //   isAbsurdMode = false
          // }
          if (
            wordlesNum > 1 ||
            exam === "汉兜" ||
            exam === "Numberle" ||
            exam === "Math" ||
            exam === "词影"
          ) {
            // isHardMode = false
            // isUltraHardMode = false
            isChallengeMode = false;
            isAbsurdMode = false;
          }

          const correctLetters: string[] = new Array(guessWordLength).fill("*");

          await ctx.database.set(
            "wordle_game_records",
            { channelId },
            {
              isStarted: true,
              wordGuess: randomWord,
              wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
              remainingGuessesCount:
                exam === "汉兜"
                  ? 10 + wordlesNum - 1
                  : exam === "Math" || exam === "词影"
                  ? 6 + wordlesNum - 1
                  : guessWordLength + 1 + wordlesNum - 1,
              guessWordLength,
              gameMode: exam,
              timestamp: String(timestamp),
              isHardMode: isHardMode,
              isUltraHardMode,
              correctLetters: correctLetters,
              presentLetters: "",
              absentLetters: "",
              isAbsurd: isAbsurdMode,
              isChallengeMode: isChallengeMode,
              targetWord: randomWord,
              wordlesNum: wordlesNum,
              wordleIndex: 1,
              pinyin,
              isFreeMode,
            }
          );

          if (wordlesNum > 1) {
            let randomWordExtra: string = "";
            let translation: string = "";
            let pinyin: string = "";
            for (
              let wordleIndex = 2;
              wordleIndex < wordlesNum + 1;
              wordleIndex++
            ) {
              while (selectedWords.length < wordleIndex) {
                if (exam === "Lewdle") {
                  let randomLowerCaseWord =
                    getRandomFromStringList(badWordsList);
                  while (randomLowerCaseWord.length !== guessWordLength) {
                    randomLowerCaseWord = getRandomFromStringList(badWordsList);
                  }
                  const foundWord = findWord(randomLowerCaseWord);
                  randomWordExtra = randomLowerCaseWord;
                  translation = foundWord ? foundWord.translation : "";
                } else if (exam === "汉兜" || exam === "词影") {
                  const randomIdiom = getRandomFromStringList(commonIdiomsList);
                  let selectedIdiom;

                  if (options.all) {
                    selectedIdiom = getRandomIdiom(idiomsList);
                  } else {
                    selectedIdiom = await getSelectedIdiom(randomIdiom);
                  }

                  guessWordLength = 4;
                  pinyin = selectedIdiom.pinyin;
                  randomWordExtra = options.all
                    ? selectedIdiom.idiom
                    : randomIdiom;
                  translation = selectedIdiom.explanation;
                } else if (exam === "Numberle") {
                  randomWordExtra = generateNumberString(guessWordLength);
                  translation = "";
                } else if (exam === "Math") {
                  randomWordExtra = getRandomFromStringList(
                    equations[guessWordLength]
                  );
                  translation = "";
                } else {
                  const resultExtra = getRandomWordTranslation(
                    exam,
                    guessWordLength
                  );
                  translation = resultExtra.translation;
                  randomWordExtra = resultExtra.word;
                }

                if (!selectedWords.includes(randomWordExtra)) {
                  selectedWords.push(randomWordExtra);
                }
              }
              await ctx.database.create("extra_wordle_game_records", {
                channelId,
                remainingGuessesCount:
                  exam === "汉兜"
                    ? 10 + wordlesNum - 1
                    : exam === "Math" || exam === "词影"
                    ? 6 + wordlesNum - 1
                    : guessWordLength + 1 + wordlesNum - 1,
                guessWordLength,
                wordGuess: randomWordExtra,
                wordAnswerChineseDefinition:
                  replaceEscapeCharacters(translation),
                gameMode: exam,
                timestamp: String(timestamp),
                correctLetters: correctLetters,
                presentLetters: "",
                absentLetters: "",
                wordlesNum: wordlesNum,
                wordleIndex,
                pinyin,
              });
            }
          }
          // 生成并发送游戏图
          let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
          if (exam === "汉兜") {
            const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4);
            imageBuffer = await generateImageForHandle(emptyGridHtml);
          } else if (exam === "词影") {
            const emptyGridHtmlWithBorder = generateEmptyGridHtmlForCiying(
              1,
              4,
              true
            );
            const emptyGridHtml = generateEmptyGridHtmlForCiying(
              6 + wordlesNum - 1 - 1,
              4,
              false
            );
            imageBuffer = await generateImageForCiying(
              emptyGridHtmlWithBorder + emptyGridHtml,
              6 + wordlesNum - 1
            );
          } else {
            const emptyGridHtml = isAbsurdMode
              ? generateEmptyGridHtml(1, guessWordLength)
              : exam === "Math"
              ? generateEmptyGridHtml(6 + wordlesNum - 1, guessWordLength)
              : generateEmptyGridHtml(
                  guessWordLength + 1 + wordlesNum - 1,
                  guessWordLength
                );
            const styledHtml = generateStyledHtml(guessWordLength + 1);
            imageBuffer = await generateImage(styledHtml, emptyGridHtml);
          }

          let imageBuffers: Buffer[] = [];
          if (wordlesNum > 1) {
            for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
              imageBuffers.push(imageBuffer);
            }
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(htmlImgString);
          }

          const gameMode = `游戏开始！\n当前游戏模式为：【${exam}${
            wordlesNum > 1 ? `（x${wordlesNum}）` : ""
          }${
            (isFreeMode && exam === "汉兜") || (isFreeMode && exam === "词影")
              ? `（自由）`
              : ""
          }${isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""}${
            isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""
          }】`;
          const challengeInfo = isChallengeMode
            ? `\n目标单词为：【${randomWord}】`
            : "";
          const wordLength = `${
            exam === "Numberle"
              ? "数字"
              : exam === "Math"
              ? "数学方程式"
              : "单词"
          }长度为：【${guessWordLength}】`;
          const guessChance = `猜${
            exam === "汉兜" || exam === "词影"
              ? "词语|成语"
              : exam === "Numberle"
              ? "数字"
              : exam === "Math"
              ? "数学方程式"
              : "单词"
          }机会为：【${
            isAbsurdMode
              ? "♾️"
              : exam === "汉兜"
              ? `${10 + wordlesNum - 1}`
              : exam === "Math"
              ? `${6 + wordlesNum - 1}`
              : exam === "词影"
              ? `${6 + wordlesNum - 1}`
              : guessWordLength + 1 + wordlesNum - 1
          }】`;
          const wordCount2 =
            exam === "汉兜" || exam === "词影"
              ? `待猜词语|成语数量为：【${
                  options.all ? idiomsList.length : commonIdiomsList.length
                }】`
              : exam === "Math"
              ? `待猜方程式数量为：【${equations[guessWordLength].length}】`
              : `待猜单词数量为：【${exam === "Lewdle" ? "1000" : wordCount}】`;
          const timeLimit = config.enableWordGuessTimeLimit
            ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒`
            : "";
          const image = h.image(imageBuffer, `image/${config.imageType}`);

          if (exam === "汉兜" || exam === "词影") {
            if (
              !config.isTextToImageConversionEnabled &&
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(session, image, ``);
              return await sendMessage(
                session,
                `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}`,
                `结束游戏 猜测`,
                2
              );
            } else {
              return await sendMessage(
                session,
                `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`,
                `结束游戏 猜测`
              );
            }
          } else {
            if (
              !config.isTextToImageConversionEnabled &&
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(session, image, ``);
              return await sendMessage(
                session,
                `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${
                  exam === "Numberle" ? "" : wordCount2
                }${timeLimit}`,
                `结束游戏 猜测`,
                2
              );
            } else {
              return await sendMessage(
                session,
                `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${
                  exam === "Numberle" ? "" : wordCount2
                }${timeLimit}\n${image}`,
                `结束游戏 猜测`
              );
            }
          }
        });
    }
  });
  // wordleGame.猜 c* cdc* ccy*
  ctx
    .command("wordleGame.猜 [inputWord:text]", "做出一次猜测")
    .option("random", "-r 随机", { fallback: false })
    .action(async ({ session, options }, inputWord) => {
      let { channelId, userId, username, platform, timestamp } = session;
      let gameInfo: any = await getGameInfo(channelId);
      inputWord = inputWord?.trim();

      if (gameInfo.isRunning === true) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n操作太快了哦~\n再试一次吧！`,
          `猜测`
        );
      }

      await setGuessRunningStatus(channelId, true);
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);

      if (!gameInfo.isStarted) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n游戏还没开始呢！`,
          `改名 开始游戏`
        );
      }

      if (options.random) {
        inputWord =
          gameInfo.gameMode === "汉兜" || gameInfo.gameMode === "词影"
            ? getRandomIdiom(idiomsList).idiom
            : gameInfo.gameMode === "Numberle"
            ? generateNumberString(gameInfo.guessWordLength)
            : gameInfo.gameMode === "Math"
            ? getRandomFromStringList(equations[gameInfo.guessWordLength])
            : getRandomWordTranslation("ALL", gameInfo.guessWordLength).word;
      }

      if (!inputWord) {
        await sendMessage(
          session,
          `【@${username}】\n请输入【猜测词】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            session,
            `【${username}】\n输入无效或超时。`,
            `猜测`
          );
        if (userInput === "取消")
          return await sendMessage(
            session,
            `【${username}】\n猜测操作已取消！`,
            `猜测`
          );
        inputWord = userInput.trim();
      }

      // 作答时间限制
      const timeDifferenceInSeconds =
        (timestamp - Number(gameInfo.timestamp)) / 1000;
      if (config.enableWordGuessTimeLimit) {
        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo);
          await sendMessage(
            session,
            `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(channelId);

          return;
        }
      }

      // 玩家不在游戏中
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        if (!config.allowNonPlayersToGuess) {
          await setGuessRunningStatus(channelId, false);
          return await sendMessage(
            session,
            `【@${username}】\n没加入游戏的话~不能猜哦！`,
            `猜测`
          );
        } else {
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money: 0,
          });
        }
      }
      let {
        correctLetters,
        presentLetters,
        isHardMode,
        absentLetters,
        isAbsurd,
        remainingWordsList,
        gameMode,
        guessWordLength,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
        isFreeMode,
      } = gameInfo;

      // 判断输入
      if (
        gameInfo.guessHistory &&
        gameInfo.guessHistory.includes(inputWord.toLowerCase())
      ) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n这个已经猜过了哦！`,
          `猜测`
        );
      }
      if (
        !/^[a-zA-Z]+$/.test(inputWord) &&
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n输入包含非字母字符，请重新输入！`,
          `猜测`
        );
      }
      if (
        (!isFourCharacterIdiom(inputWord) && gameMode === "汉兜") ||
        (!isFourCharacterIdiom(inputWord) && gameMode === "词影")
      ) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n您确定您输入的是四字词语吗？`,
          `猜测`
        );
      }
      if (
        gameMode === "Numberle" &&
        (!isNumericString(inputWord) || inputWord.length !== guessWordLength)
      ) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n您确定您输入的是 ${guessWordLength} 长度的数字吗？`,
          `猜测`
        );
      }
      if (
        gameMode === "Math" &&
        (!isMathEquationValid(inputWord) ||
          inputWord.length !== guessWordLength)
      ) {
        await setGuessRunningStatus(channelId, false);
        return await sendMessage(
          session,
          `【@${username}】\n请使用+-*/=运算符和0-9之间的数字！\n并组成正确的数学方程式！`,
          `猜测`
        );
      }
      if (
        inputWord.length !== gameInfo.guessWordLength &&
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        await setGuessRunningStatus(channelId, false);
        const usernameMention = `【@${username}】`;
        const inputLengthMessage = `输入的单词长度不对哦！\n您的输入为：【${inputWord}】\n它的长度为：【${inputWord.length}】\n待猜单词的长度为：【${gameInfo.guessWordLength}】`;
        const presentLettersWithoutAsterisk =
          uniqueSortedLowercaseLetters(presentLetters);
        const processedResult =
          wordlesNum > 1 ? "\n" + (await processExtraGameInfos(channelId)) : "";
        const progressMessage = `当前${calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        )}\n当前进度：【${correctLetters.join("")}】${
          presentLettersWithoutAsterisk.length === 0
            ? ``
            : `\n包含字母：【${presentLettersWithoutAsterisk}】`
        }${
          absentLetters.length === 0 ? "" : `\n不包含字母：【${absentLetters}】`
        }${processedResult}`;
        return await sendMessage(
          session,
          `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`,
          `猜测`
        );
      }
      // 是否存在该单词
      // 小写化
      const lowercaseInputWord =
        gameMode === "汉兜" || gameMode === "词影"
          ? inputWord
          : inputWord.toLowerCase();
      if (
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        const foundWord = findWord(lowercaseInputWord);
        if (!foundWord) {
          await setGuessRunningStatus(channelId, false);
          return await sendMessage(
            session,
            `【@${username}】\n你确定存在这样的单词吗？`,
            `猜测`
          );
        }
      }
      let userInputPinyin: string = "";
      if (gameMode === "词影") {
        if (!checkStrokesData(inputWord)) {
          await setGuessRunningStatus(channelId, false);
          return await sendMessage(
            session,
            `【@${username}】\n不好意思啊...\n我还没学会这个字（`,
            `猜测`
          );
        }
        if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
          const idiomInfo = await getIdiomInfo(inputWord);
          if (idiomInfo.pinyin === "未找到拼音") {
            await setGuessRunningStatus(channelId, false);
            return await sendMessage(
              session,
              `【@${username}】\n你确定存在这样的四字词语吗？`,
              `猜测`
            );
          } else {
            userInputPinyin = idiomInfo.pinyin;
          }
        }
      }
      if (gameMode === "汉兜") {
        if (!isIdiomInList(inputWord, idiomsList)) {
          if (isFreeMode) {
            const foundItem = pinyinData.find(
              (item) => item.term === inputWord
            );

            if (foundItem) {
              userInputPinyin = foundItem.pinyin;
            } else {
              userInputPinyin = await sendPostRequestForAI(inputWord);
              if (userInputPinyin !== "") {
                const newItem: PinyinItem2 = {
                  term: inputWord,
                  pinyin: userInputPinyin,
                };
                pinyinData.push(newItem);

                fs.writeFileSync(
                  pinyinKoishiFilePath,
                  JSON.stringify(pinyinData, null, 2),
                  "utf8"
                );
              } else {
                userInputPinyin = "wǒ chū cuò le";
              }
            }
          } else {
            const idiomInfo = await getIdiomInfo(inputWord);
            if (idiomInfo.pinyin === "未找到拼音") {
              await setGuessRunningStatus(channelId, false);
              return await sendMessage(
                session,
                `【@${username}】\n你确定存在这样的四字词语吗？`,
                `猜测`
              );
            } else {
              userInputPinyin = idiomInfo.pinyin;
            }
          }
        }
      }
      await ctx.database.set(
        "wordle_game_records",
        { channelId },
        {
          guessHistory: gameInfo.guessHistory
            ? [...gameInfo.guessHistory, lowercaseInputWord]
            : [lowercaseInputWord],
        }
      );
      const foundIdiom = findIdiomByIdiom(inputWord, idiomsList);
      if (!userInputPinyin && foundIdiom) {
        userInputPinyin = foundIdiom.pinyin;
      }
      // 困难模式
      if (isHardMode && gameMode !== "词影") {
        let isInputWordWrong = false;
        // 包含
        const containsAllLetters = lowercaseInputWord
          .split("")
          .filter(
            (letter) => presentLetters.includes(letter) && letter !== "*"
          );
        if (
          mergeSameLetters(containsAllLetters).length !==
            presentLetters.length &&
          presentLetters.length !== 0
        ) {
          isInputWordWrong = true;
        }
        // 正确
        for (let i = 0; i < lowercaseInputWord.length; i++) {
          if (
            correctLetters[i] !== "*" &&
            correctLetters[i] !== lowercaseInputWord[i] &&
            correctLetters.some((letter) => letter !== "*")
          ) {
            isInputWordWrong = true;
            break;
          }
        }
        // 不包含 灰色的线索必须被遵守  超困难
        if (
          isUltraHardMode &&
          absentLetters.length !== 0 &&
          checkAbsentLetters(lowercaseInputWord, absentLetters)
        ) {
          isInputWordWrong = true;
        }
        // 黄色字母必须远离它们被线索的地方 超困难
        if (
          isUltraHardMode &&
          presentLettersWithIndex.length !== 0 &&
          checkPresentLettersWithIndex(
            lowercaseInputWord,
            presentLettersWithIndex
          )
        ) {
          isInputWordWrong = true;
        }
        if (isInputWordWrong) {
          await setGuessRunningStatus(channelId, false);
          const difficulty = isUltraHardMode ? "超困难" : "困难";
          const rule = `绿色线索必须保特固定，黄色线索必须重复使用。${
            isUltraHardMode
              ? `\n黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。`
              : ""
          }`;

          const message = `【@${username}】\n当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n您输入的词不符合要求！\n您的输入为：【${inputWord}】\n要求：【${correctLetters.join(
            ""
          )}】${
            presentLetters.length === 0 ? `` : `\n包含：【${presentLetters}】`
          }${
            absentLetters.length === 0 || !isUltraHardMode
              ? ``
              : `\n不包含：【${absentLetters}】`
          }${
            presentLettersWithIndex.length === 0 || !isUltraHardMode
              ? ``
              : `\n远离黄色线索：【${presentLettersWithIndex.join(", ")}】`
          }`;

          return await sendMessage(session, message, `猜测`);
        }
      }
      // 初始化输
      let isLose = false;
      // 变态模式
      if (isAbsurd) {
        let wordsList: string[];
        if (remainingWordsList.length === 0) {
          if (gameMode === "经典") {
            wordsList = lowerCaseWordArray;
          } else {
            const fileData = getJsonFilePathAndWordCountByLength(
              gameMode,
              guessWordLength
            );
            if (gameMode === "ALL") {
              const jsonData = JSON.parse(
                fs.readFileSync(fileData.filePath, "utf-8")
              );
              wordsList = extractLowerCaseWords(jsonData);
            } else {
              const jsonData = JSON.parse(
                fs.readFileSync(fileData.filePath, "utf-8")
              );
              wordsList = Object.keys(jsonData).map((word) =>
                word.toLowerCase()
              );
            }
          }
        } else {
          wordsList = remainingWordsList;
        }
        let longestRemainingWordList = await findLongestMatchedWords(
          wordsList,
          lowercaseInputWord,
          targetWord,
          isChallengeMode
        );
        if (!longestRemainingWordList) {
          longestRemainingWordList = [];
        } else {
          while (
            isChallengeMode &&
            wordsList.includes(targetWord) &&
            longestRemainingWordList &&
            longestRemainingWordList.length === 1 &&
            longestRemainingWordList[0] !== targetWord
          ) {
            longestRemainingWordList = await findLongestMatchedWords(
              wordsList,
              lowercaseInputWord,
              targetWord,
              isChallengeMode
            );
          }

          // 变态挑战模式
          if (isChallengeMode) {
            isLose = !longestRemainingWordList.includes(targetWord);
          }
        }
        if (longestRemainingWordList.length === 0) {
          await updatePlayerRecordsLose(channelId, gameInfo);
          await sendMessage(
            session,
            `【@${username}】\n根据透露出的信息！\n已经无任何可用单词！\n很遗憾，你们输了！`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(channelId);
          return;
        }
        let randomWord =
          longestRemainingWordList[
            Math.floor(Math.random() * longestRemainingWordList.length)
          ];
        const foundWord = findWord(randomWord);
        if (isLose && isChallengeMode) {
          // 生成 html 字符串
          const letterTilesHtml =
            '<div class="Row-module_row__pwpBq">' +
            (await generateLetterTilesHtml(
              foundWord.word.toLowerCase(),
              inputWord,
              channelId,
              1,
              gameInfo
            )) +
            "</div>";
          const emptyGridHtml = isAbsurd
            ? generateEmptyGridHtml(1, gameInfo.guessWordLength)
            : generateEmptyGridHtml(
                gameInfo.remainingGuessesCount - 1,
                gameInfo.guessWordLength
              );
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // 图
          const imageBuffer = await generateImage(
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}`
          );
          await sendMessage(
            session,
            `【@${username}】\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(
              imageBuffer,
              `image/${config.imageType}`
            )}\n您可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`,
            `撤销 结束`
          );
          let userInput = await session.prompt();
          // 生成 html 字符串
          // 图
          const imageBuffer2 = await generateImage(
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
          );
          if (!userInput) {
            await setGuessRunningStatus(channelId, false);
            if (
              !config.isTextToImageConversionEnabled &&
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(
                session,
                h.image(imageBuffer2, `image/${config.imageType}`),
                ``
              );
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。`,
                `猜测`
              );
            }
            return await sendMessage(
              session,
              `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`,
              `猜测`
            );
          }
          if (userInput === "结束") {
            await session.execute(`wordleGame.结束`);
            return;
          } else {
            await setGuessRunningStatus(channelId, false);
            if (
              !config.isTextToImageConversionEnabled &&
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(
                session,
                h.image(imageBuffer2, `image/${config.imageType}`),
                ``
              );
              return await sendMessage(
                session,
                `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！`,
                `猜测`
              );
            }
            return await sendMessage(
              session,
              `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`,
              `猜测`
            );
          }
        }
        await ctx.database.set(
          "wordle_game_records",
          { channelId },
          {
            remainingWordsList: longestRemainingWordList,
            wordGuess: foundWord.word.toLowerCase(),
            wordAnswerChineseDefinition: replaceEscapeCharacters(
              foundWord.translation
            ),
          }
        );
        gameInfo = await getGameInfo(channelId);
      }
      // 胜
      let isWin = false;
      if (wordlesNum === 1 && lowercaseInputWord === gameInfo.wordGuess) {
        isWin = true;
      }
      let isWinNum = 0;
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex);
        }
        const isWin = lowercaseInputWord === gameInfo.wordGuess;
        if (isWin || gameInfo.isWin) {
          ++isWinNum;
        }
        // 负
        if (!isWin && gameInfo.remainingGuessesCount - 1 === 0 && !isAbsurd) {
          isLose = true;
        }
        let letterTilesHtml: string;

        if (gameInfo.isWin) {
          letterTilesHtml = "";
        } else {
          if (gameMode === "汉兜") {
            letterTilesHtml = await generateLetterTilesHtmlForHandle(
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo,
              gameInfo.pinyin,
              userInputPinyin
            );
          } else if (gameMode === "词影") {
            letterTilesHtml = await generateLetterTilesHtmlForCiying(
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo,
              isHardMode
            );
          } else {
            const generatedHtml = await generateLetterTilesHtml(
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo
            );
            letterTilesHtml =
              '<div class="Row-module_row__pwpBq">' + generatedHtml + "</div>";
          }
        }
        let emptyGridHtml;
        if (isAbsurd) {
          emptyGridHtml = generateEmptyGridHtml(
            isWin ? 0 : 1,
            gameInfo.guessWordLength
          );
        } else {
          if (gameMode === "汉兜") {
            emptyGridHtml = generateEmptyGridHtmlForHandle(
              gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1,
              4
            );
          } else if (gameMode === "词影") {
            emptyGridHtml =
              generateEmptyGridHtmlForCiying(
                gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1,
                4,
                true
              ) +
              generateEmptyGridHtmlForCiying(
                gameInfo.isWin || isWin
                  ? gameInfo.remainingGuessesCount - 1
                  : gameInfo.remainingGuessesCount - 1 - 1,
                4,
                false
              );
          } else {
            emptyGridHtml = generateEmptyGridHtml(
              gameInfo.isWin
                ? gameInfo.remainingGuessesCount
                : gameInfo.remainingGuessesCount - 1,
              gameInfo.guessWordLength
            );
          }
        }
        const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
        // 图
        if (gameMode === "汉兜") {
          imageBuffer = await generateImageForHandle(
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`
          );
        } else if (gameMode === "词影") {
          imageBuffer = await generateImageForCiying(
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`,
            6 + wordlesNum - 1
          );
        } else {
          imageBuffer = await generateImage(
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`
          );
        }
        imageBuffers.push(imageBuffer);
        // 更新游戏记录
        const remainingGuessesCount =
          isAbsurd || (gameMode === "词影" && (gameInfo.isWin || isWin))
            ? gameInfo.remainingGuessesCount
            : gameInfo.remainingGuessesCount - 1;
        if (wordleIndex === 1 && !gameInfo.isWin) {
          await ctx.database.set(
            "wordle_game_records",
            { channelId },
            {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            }
          );
        } else if (wordleIndex > 1 && !gameInfo.isWin) {
          await ctx.database.set(
            "extra_wordle_game_records",
            { channelId, wordleIndex },
            {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            }
          );
        }
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
        if (isWinNum === wordlesNum) {
          isWin = true;
        }
      }
      gameInfo = await getGameInfo(channelId);

      // 处理赢
      if (isWin) {
        let finalSettlementString: string = "";
        // 经典有收入
        if (gameInfo.gameMode === "经典" || gameInfo.gameMode === "汉兜") {
          finalSettlementString = await processNonZeroMoneyPlayers(
            channelId,
            platform
          );
        }
        // 玩家记录赢
        await updatePlayerRecordsWin(channelId, gameInfo);
        // 增加该玩家猜出单词的次数
        const [playerRecord] = await ctx.database.get("wordle_player_records", {
          userId,
        });
        // 更新最快用时
        if (
          timeDifferenceInSeconds <
            playerRecord.fastestGuessTime[gameInfo.gameMode] ||
          playerRecord.fastestGuessTime[gameInfo.gameMode] === 0
        ) {
          playerRecord.fastestGuessTime[gameInfo.gameMode] = Math.floor(
            timeDifferenceInSeconds
          );
        }

        if (gameInfo.gameMode === "词影") {
          if (gameInfo.wordlesNum === 1) {
            if (gameInfo.isHardMode) {
              playerRecord.extraCiyingRankInfo.successCountIn1HardMode += 1;
              if (
                timeDifferenceInSeconds <
                  playerRecord.extraCiyingRankInfo
                    .fastestGuessTimeIn1HardMode ||
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode ===
                  0
              ) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode =
                  Math.floor(timeDifferenceInSeconds);
              }
            } else {
              playerRecord.extraCiyingRankInfo.successCountIn1Mode += 1;
              if (
                timeDifferenceInSeconds <
                  playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode ||
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode === 0
              ) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode =
                  Math.floor(timeDifferenceInSeconds);
              }
            }
          } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
            const extraCiyingRankInfoKey = `successCountIn${gameInfo.wordlesNum}Mode`;
            const extraCiyingRankInfoKeyFastestGuessTimeIn = `fastestGuessTimeIn${gameInfo.wordlesNum}Mode`;
            playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
            if (
              timeDifferenceInSeconds <
                playerRecord.extraCiyingRankInfo[
                  extraCiyingRankInfoKeyFastestGuessTimeIn
                ] ||
              playerRecord.extraCiyingRankInfo[
                extraCiyingRankInfoKeyFastestGuessTimeIn
              ] === 0
            ) {
              playerRecord.extraCiyingRankInfo[
                extraCiyingRankInfoKeyFastestGuessTimeIn
              ] = Math.floor(timeDifferenceInSeconds);
            }
          }
        }

        const updateData = {
          wordGuessCount: playerRecord.wordGuessCount + 1,
          fastestGuessTime: playerRecord.fastestGuessTime,
        };

        if (gameInfo.gameMode === "词影") {
          updateData["extraCiyingRankInfo"] = playerRecord.extraCiyingRankInfo;
        }

        await ctx.database.set(
          "wordle_player_records",
          { userId: userId },
          updateData
        );

        const processedResult: string =
          wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : "";
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const imageType = config.imageType;
        const settlementResult =
          finalSettlementString === ""
            ? ""
            : `最终结算结果如下：\n${finalSettlementString}`;

        const message = `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

        if (
          !config.isTextToImageConversionEnabled &&
          isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          await sendMessage(
            session,
            h.image(imageBuffer, `image/${imageType}`),
            ``
          );
          await sendMessage(
            session,
            `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(channelId);
          return;
        }
        await sendMessage(
          session,
          message,
          `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
          2
        );
        await endGame(channelId);
        return;
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(channelId, gameInfo);
        const processedResult: string =
          wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : "";
        const challengeMessage = isChallengeMode
          ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！`
          : "";
        const answerInfo = isChallengeMode
          ? ""
          : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(
          imageBuffer,
          `image/${config.imageType}`
        )}\n${gameDuration}${answerInfo}${processedResult}`;

        if (
          !config.isTextToImageConversionEnabled &&
          isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          await sendMessage(
            session,
            h.image(imageBuffer, `image/${config.imageType}`),
            ``
          );
          await sendMessage(
            session,
            `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${gameDuration}${answerInfo}${processedResult}`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(channelId);
          return;
        }
        await sendMessage(
          session,
          message,
          `改名 排行榜 查询玩家记录 开始游戏 再来一把`,
          2
        );
        await endGame(channelId);
        return;
      }
      // 继续
      await setGuessRunningStatus(channelId, false);
      await sendMessage(
        session,
        h.image(imageBuffer, `image/${config.imageType}`),
        `结束游戏 ${
          gameInfo.gameMode === "汉兜" ? `拼音速查表 ` : ``
        }查询进度 猜测`,
        2
      );
      if (
        !config.isTextToImageConversionEnabled &&
        isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        return sendMessage(
          session,
          `<@${userId}>`,
          `结束游戏 ${
            gameInfo.gameMode === "汉兜" ? `拼音速查表 ` : ``
          }查询进度 猜测`,
          2
        );
      }
      return;
      // .action
    });
  // wordleGame.查询玩家记录 cx* cxwjjl*
  ctx
    .command("wordleGame.查询玩家记录 [targetUser:text]", "查询玩家记录")
    .action(async ({ session }, targetUser) => {
      let { userId, username } = session;
      const originalUerId = userId;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      const sessionUserName = username;
      await updateNameInPlayerRecord(session, userId, username);

      let targetUserRecord: PlayerRecord[] = [];
      if (!targetUser) {
        targetUserRecord = await ctx.database.get("wordle_player_records", {
          userId,
        });
      } else {
        targetUser = await replaceAtTags(session, targetUser);
        if (
          isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          targetUserRecord = await ctx.database.get("wordle_player_records", {
            username: targetUser,
          });
          if (targetUserRecord.length === 0) {
            targetUserRecord = await ctx.database.get("wordle_player_records", {
              userId: targetUser,
            });
          }
        } else {
          const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
          const match = targetUser.match(userIdRegex);
          userId = match?.[1] ?? userId;
          username = match?.[2] ?? username;
          if (originalUerId === userId) {
            targetUserRecord = await ctx.database.get("wordle_player_records", {
              userId: targetUser,
            });
          } else {
            targetUserRecord = await ctx.database.get("wordle_player_records", {
              userId,
            });
          }
        }
      }

      if (targetUserRecord.length === 0) {
        return sendMessage(
          session,
          `被查询对象无任何游戏记录。`,
          `改名 查询玩家记录 开始游戏`,
          2
        );
      }

      const {
        win,
        lose,
        moneyChange,
        wordGuessCount,
        stats,
        fastestGuessTime,
      } = targetUserRecord[0];

      const queryInfo = `【@${sessionUserName}】
查询对象：${targetUserRecord[0].username}
猜出次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
损益为：${moneyChange} 点
详细统计信息如下：
${generateStatsInfo(stats, fastestGuessTime)}
    `;

      return sendMessage(session, queryInfo, `改名 查询玩家记录 开始游戏`, 2);
    });
  ctx
    .command("wordleGame.查单词 [targetWord:text]", "查单词引导")
    .action(async ({ session, options }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { channelId, userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      // 提示输入
      const availableDictionaryArray = ["ALL", "WordWord"];
      const availableDictionaryArrayToLowerCase = availableDictionaryArray.map(
        (word) => word.toLowerCase()
      );
      await sendMessage(
        session,
        `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray
          .map((dictionary, index) => `${index + 1}. ${dictionary}`)
          .join("\n")}\n请输入您选择的【序号】或【词库名】：`,
        `ALL WordWord`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          session,
          `【@${username}】\n输入无效或超时。`,
          `查单词`
        );
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput))
        ? userInput.toLowerCase().trim()
        : availableDictionaryArrayToLowerCase[parseInt(userInput) - 1];
      if (availableDictionaryArrayToLowerCase.includes(selectedDictionary)) {
        const command = `wordleGame.查单词.${selectedDictionary}${
          targetWord ? ` ${targetWord}` : ""
        }`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          session,
          `【@${username}】\n您的输入无效，请重新输入。`,
          `查单词`
        );
      }
      // .action
    });
  // wordleGame.查单词 cxdc* cdc*
  ctx
    .command(
      "wordleGame.查单词.ALL [targetWord:text]",
      "在ALL词库中查询单词释义（英译中）"
    )
    .action(async ({ session }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(
          session,
          `【@${username}】\n请输入【待查询的单词】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            session,
            `【@${username}】\n输入无效或超时。`,
            `查单词`
          );
        if (userInput === "取消")
          return await sendMessage(
            session,
            `【@${username}】\n查询单词操作已取消。`,
            `查单词`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          session,
          `【@${username}】\n输入包含非字母字符，请重新输入！`,
          `查单词`
        );
      }

      // 寻找
      const foundWord = findWord(targetWord);
      if (!foundWord) {
        return await sendMessage(
          session,
          `【@${username}】\n未在ALL词库中找到该单词。`,
          `查单词`
        );
      }
      return sendMessage(
        session,
        `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(
          foundWord.translation
        )}`,
        `查单词`
      );
    });
  // czdc*
  ctx
    .command(
      "wordleGame.查单词.WordWord [targetWord:text]",
      "在WordWord中查找单词定义（英译英）"
    )
    .action(async ({ session }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(
          session,
          `【@${username}】\n请输入【待查找的单词】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            session,
            `【@${username}】\n输入无效或超时。`,
            `查单词`
          );
        if (userInput === "取消")
          return await sendMessage(
            session,
            `【@${username}】\n查找单词操作已取消。`,
            `查单词`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          session,
          `【@${username}】\n输入包含非字母字符，请重新输入！`,
          `查单词`
        );
      }

      // 寻找
      fetchWordDefinitions(targetWord)
        .then((responseData) => {
          const definitions = responseData.word.definitions;
          const serializedDefinitions = serializeDefinitions(definitions);
          return sendMessage(
            session,
            `${capitalizeFirstLetter(targetWord)} Definitions: \n${
              serializedDefinitions
                ? serializedDefinitions
                : `- 该单词定义暂未收录。`
            }`,
            `查单词`
          );
        })
        .catch((error) => {
          return sendMessage(
            session,
            `【@${username}】\n未在WordWord中找到该单词。`,
            `查单词`
          );
        });
    });
  // ccy*
  ctx
    .command("wordleGame.查成语 [targetIdiom:text]", "查成语引导")
    .action(async ({ session, options }, targetIdiom) => {
      if (
        !targetIdiom &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim();
        }
      }
      let { channelId, userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      // 提示输入
      const availableDictionaryArray = ["百度汉语", "汉典"];
      await sendMessage(
        session,
        `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray
          .map((dictionary, index) => `${index + 1}. ${dictionary}`)
          .join("\n")}\n请输入您选择的【序号】或【词库名】：`,
        `百度汉语 汉典`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          session,
          `【@${username}】\n输入无效或超时。`,
          `查成语`
        );
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput))
        ? userInput.trim()
        : availableDictionaryArray[parseInt(userInput) - 1];
      if (availableDictionaryArray.includes(selectedDictionary)) {
        const command = `wordleGame.查成语.${selectedDictionary}${
          targetIdiom ? ` ${targetIdiom}` : ""
        }`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          session,
          `【@${username}】\n您的输入无效，请重新输入。`,
          `查成语`
        );
      }
      // .action
    });
  // czcy*
  ctx
    .command(
      "wordleGame.查成语.百度汉语 [targetIdiom:text]",
      "在百度汉语中查找成语解释"
    )
    .action(async ({ session }, targetIdiom) => {
      if (
        !targetIdiom &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(
          session,
          `【@${username}】\n请输入【待查找的成语】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            session,
            `【@${username}】\n输入无效或超时。`,
            `查成语`
          );
        if (userInput === "取消")
          return await sendMessage(
            session,
            `【@${username}】\n查找成语操作已取消。`,
            `查成语`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          session,
          `【@${username}】\n您确定您输入的是四字词语吗？`,
          `查成语`
        );
      }

      // 寻找
      const idiomInfo = await getIdiomInfo(targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          session,
          `【@${username}】\n未在百度汉语中找到该成语。`,
          `查成语`
        );
      }
      return await sendMessage(
        session,
        `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n【解释】${idiomInfo.explanation}`,
        `查成语`
      );
    });
  ctx
    .command(
      "wordleGame.查成语.汉典 [targetIdiom:text]",
      "在汉典中查找成语解释"
    )
    .action(async ({ session }, targetIdiom) => {
      if (
        !targetIdiom &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(
          session,
          `【@${username}】\n请输入【待查找的成语】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            session,
            `【@${username}】\n输入超时！`,
            `查成语`
          );
        if (userInput === "取消")
          return await sendMessage(
            session,
            `【@${username}】\n查找成语操作已取消。`,
            `查成语`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          session,
          `【@${username}】\n您确定您输入的是四字词语吗？`,
          `查成语`
        );
      }
      // 寻找
      const idiomInfo = await getIdiomInfo2(targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          session,
          `【@${username}】\n未在汉典中找到该成语。`,
          `查成语`
        );
      }
      return await sendMessage(
        session,
        `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n${idiomInfo.explanation}`,
        `查成语`
      );
    });
  // dcczq*
  ctx
    .command(
      "wordleGame.单词查找器 [wordleIndexs:text]",
      "使用WordFinder查找匹配的单词"
    )
    .option("auto", "-a 自动查找（根据游戏进程）", { fallback: false })
    .option("wordLength", "-l <length> 指定要搜索的单词长度", {
      fallback: undefined,
    })
    .option(
      "wordWithThreeWildcards",
      "-w <word> 搜索带有最多三个通配符字符的单词",
      { fallback: undefined }
    )
    .option("containingLetters", "-c <letters> 搜索包含特定字母组合的单词", {
      fallback: undefined,
    })
    .option(
      "containingTheseLetters",
      "--ct <letters> 搜索只包含指定字母的单词",
      { fallback: undefined }
    )
    .option("withoutTheseLetters", "--wt <letters> 搜索不包含特定字母的单词", {
      fallback: undefined,
    })
    .option(
      "startingWithTheseLetters",
      "--sw <letters> 搜索以特定字母开头的单词",
      { fallback: undefined }
    )
    .option(
      "endingWithTheseLetters",
      "--ew <letters> 搜索以特定字母结尾的单词",
      { fallback: undefined }
    )
    .action(async ({ session, options }, wordleIndexs) => {
      let { channelId, username, userId } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);

      let {
        auto,
        wordLength,
        wordWithThreeWildcards,
        containingLetters,
        containingTheseLetters,
        withoutTheseLetters,
        startingWithTheseLetters,
        endingWithTheseLetters,
      } = options;

      if (auto) {
        const gameInfo = await getGameInfo(channelId);
        const {
          isStarted,
          wordlesNum,
          guessWordLength,
          absentLetters,
          presentLetters,
          gameMode,
        } = gameInfo;
        if (!isStarted) {
          return await sendMessage(
            session,
            `【@${username}】\n未检测到任何游戏进度！\n无法使用自动查找功能！`,
            `单词查找器`
          );
        }
        if (gameMode === "汉兜") {
          return await sendMessage(
            session,
            `【@${username}】\n你拿单词查找器查四字词语？`,
            `单词查找器`
          );
        }
        if (wordlesNum === 1) {
          await session.execute(
            `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
          );
        } else {
          let userInput: string = "";
          if (!wordleIndexs) {
            await sendMessage(
              session,
              `【@${username}】\n检测到当前进度数量为：【${wordlesNum}】\n请输入【待查询序号（从左到右）】：\n支持输入多个（用空格隔开）\n例如：1 2`,
              `单词查找器`
            );
            userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                session,
                `【${username}】\n输入无效或超时。`,
                `单词查找器`
              );
          } else {
            userInput = wordleIndexs;
          }

          const stringArray = userInput.split(" ");

          for (const element of stringArray) {
            if (!isNaN(Number(element))) {
              const index = parseInt(element);
              if (index > 0 && index <= wordlesNum) {
                if (index === 1) {
                  await session.execute(
                    `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
                  );
                } else {
                  const gameInfo2 = await getGameInfo2(channelId, index);
                  const { guessWordLength, absentLetters, presentLetters } =
                    gameInfo2;
                  await session.execute(
                    `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
                  );
                }
              } else {
                await session.send(
                  `序号 ${index} 超出范围（1~${wordlesNum}）。`
                );
                continue;
              }
            } else {
              continue;
            }
            //
          }

          // else
        }
      }

      if (auto) {
        return;
      }

      const noOptionsSpecified =
        !wordLength &&
        !wordWithThreeWildcards &&
        !containingLetters &&
        !containingTheseLetters &&
        !withoutTheseLetters &&
        !startingWithTheseLetters &&
        !endingWithTheseLetters;

      if (noOptionsSpecified) {
        const chineseTutorial =
          "欢迎使用单词查找器！\n你可以使用以下选项来搜索匹配的单词：\n- 使用 -a 自动查找（根据游戏进程）\n- 使用 -l <length> 指定要搜索的单词长度\n- 使用 -w <word> 搜索带有最多三个通配符字符的单词\n- 使用 -c <letters> 搜索包含特定字母组合的单词\n- 使用 --ct <letters> 搜索只包含指定字母的单词\n- 使用 --wt <letters> 搜索不包含特定字母的单词\n- 使用 --sw <letters> 搜索以特定字母开头的单词\n- 使用 --ew <letters> 搜索以特定字母结尾的单词";
        return await sendMessage(session, chineseTutorial, `单词查找器`);
      }

      const params = {
        wordLength: wordLength ? `${wordLength}-letter-words` : "",
        wordWithThreeWildcards: wordWithThreeWildcards
          ? `out-of-${wordWithThreeWildcards}`
          : "",
        containingLetters: containingLetters
          ? `containing-${containingLetters}`
          : "",
        containingTheseLetters: containingTheseLetters
          ? `with-${containingTheseLetters}`
          : "",
        withoutTheseLetters: withoutTheseLetters
          ? `without-${withoutTheseLetters}`
          : "",
        startingWithTheseLetters: startingWithTheseLetters
          ? `starting-with-${startingWithTheseLetters}`
          : "",
        endingWithTheseLetters: endingWithTheseLetters
          ? `ending-with-${endingWithTheseLetters}`
          : "",
      };

      const queryParams = Object.values(params)
        .filter((param) => param)
        .join("-");

      const url = `https://wordword.org/search/${queryParams}`;
      const result = await fetchAndParseWords(url);
      return await sendMessage(session, `${result}`, `单词查找器`);
    });
  // wordleGame.查询进度 jd* cxjd*
  ctx
    .command("wordleGame.查询进度", "查询当前游戏进度")
    .action(async ({ session }) => {
      let { channelId, userId, username, user, timestamp } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      const gameInfo = await getGameInfo(channelId);
      // 未开始
      if (!gameInfo.isStarted) {
        return await sendMessage(
          session,
          `【@${username}】\n游戏还没开始呢~\n开始后再来查询进度吧！`,
          `改名 开始游戏`
        );
      }
      // 返回信息
      const {
        correctLetters,
        presentLetters,
        isHardMode,
        gameMode,
        guessWordLength,
        absentLetters,
        isAbsurd,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
        correctPinyinsWithIndex,
        presentPinyins,
        presentPinyinsWithIndex,
        absentPinyins,
        absentTones,
        presentTonesWithIndex,
        correctTonesWithIndex,
        presentTones,
      } = gameInfo;
      const usernameMention = `【@${username}】`;
      const inputLengthMessage = `待猜${
        gameMode === "汉兜" || gameMode === "词影"
          ? "词语"
          : gameMode === "Numberle"
          ? "数字"
          : gameMode === "Math"
          ? "数学方程式"
          : "单词"
      }的长度为：【${guessWordLength}】`;
      const extraGameInfo =
        wordlesNum > 1 ? `\n${await processExtraGameInfos(channelId)}` : "";
      const gameDuration = calculateGameDuration(
        Number(gameInfo.timestamp),
        timestamp
      );
      const progressInfo = `当前${gameDuration}\n当前进度：【${correctLetters.join(
        ""
      )}】`;

      const presentInfo =
        presentLetters.length !== 0 ? `\n包含：【${presentLetters}】` : "";
      const absentInfo =
        absentLetters.length !== 0 ? `\n不包含：【${absentLetters}】` : "";
      const presentWithIndexInfo =
        presentLettersWithIndex.length !== 0
          ? `\n位置排除：【${presentLettersWithIndex.join(", ")}】`
          : "";

      const pinyinsCorrectInfo =
        correctPinyinsWithIndex.length !== 0
          ? `\n正确拼音：【${correctPinyinsWithIndex.join(", ")}】`
          : "";
      const pinyinsPresentInfo =
        presentPinyins.length !== 0
          ? `\n包含拼音：【${presentPinyins.join(", ")}】`
          : "";
      const pinyinsAbsentInfo =
        absentPinyins.length !== 0
          ? `\n不包含拼音：【${absentPinyins.join(", ")}】`
          : "";
      const pinyinsPresentWithIndexInfo =
        presentPinyinsWithIndex.length !== 0
          ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(", ")}】`
          : "";

      const tonesCorrectInfo =
        correctTonesWithIndex.length !== 0
          ? `\n正确声调：【${correctTonesWithIndex.join(", ")}】`
          : "";
      const tonesPresentInfo =
        presentTones.length !== 0
          ? `\n包含声调：【${presentTones.join(", ")}】`
          : "";
      const tonesAbsentInfo =
        absentTones.length !== 0
          ? `\n不包含声调：【${absentTones.join(", ")}】`
          : "";
      const tonesPresentWithIndexInfo =
        presentTonesWithIndex.length !== 0
          ? `\n声调位置排除：【${presentTonesWithIndex.join(", ")}】`
          : "";

      const progressMessage = `${progressInfo}${presentInfo}${absentInfo}${presentWithIndexInfo}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}${extraGameInfo}`;

      const timeDifferenceInSeconds =
        (timestamp - Number(gameInfo.timestamp)) / 1000;
      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${
        wordlesNum > 1 ? `（x${wordlesNum}）` : ""
      }${isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""}${
        isAbsurd ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""
      }】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ""}`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message, `猜测`);

      // .action
    });
  // pyscb* pysc*
  ctx
    .command("wordleGame.拼音速查表", "查看拼音速查表")
    .action(async ({ session }) => {
      let { channelId, userId, username } = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);
      let gameInfo: any = await getGameInfo(channelId);

      if (!gameInfo.isStarted || gameInfo.gameMode !== "汉兜") {
        const imageBuffer = await generateHandlePinyinsImage(
          defaultPinyinsHtml
        );
        return sendMessage(
          session,
          h.image(imageBuffer, `image/${config.imageType}`),
          ``
        );
      }
      const wordlesNum = gameInfo.wordlesNum;
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex);
        }
        const { presentPinyins, correctPinyinsWithIndex, absentPinyins } =
          gameInfo;
        const correctPinyins: string[] = removeIndexFromPinyins(
          correctPinyinsWithIndex
        );
        if (gameInfo.gameMode === "汉兜") {
          const $ = load(defaultPinyinsHtml);

          $("div").each((index, element) => {
            const text = $(element).text();
            if (correctPinyins.includes(text)) {
              $(element).attr("class", "text-ok");
            } else if (presentPinyins.includes(text)) {
              $(element).attr("class", "text-mis");
            } else if (absentPinyins.includes(text)) {
              $(element).attr("class", "op30");
            }
          });

          const modifiedHTML = $.html();
          imageBuffer = await generateHandlePinyinsImage(modifiedHTML);
        }
        imageBuffers.push(imageBuffer);
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
      }
      return sendMessage(
        session,
        h.image(imageBuffer, `image/${config.imageType}`),
        ``
      );
    });

  const rankType = [
    "总",
    "损益",
    "猜出次数",
    "经典",
    "CET4",
    "CET6",
    "GMAT",
    "GRE",
    "IELTS",
    "SAT",
    "TOEFL",
    "考研",
    "专八",
    "专四",
    "ALL",
    "Lewdle",
    "汉兜",
    "Numberle",
    "Math",
    "词影",
  ];

  // r* phb*
  ctx
    .command("wordleGame.排行榜 [number:number]", "查看排行榜")
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }

        await sendMessage(
          session,
          `【@${username}】\n${
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
              ? ``
              : `当前可查看排行榜如下：
${rankType.map((type, index) => `${index + 1}. ${type}`).join("\n")}`
          }
请输入要查看的【排行榜名】${
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
              ? ``
              : `或【序号】`
          }：`,
          `总 损益 猜出次数 经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`
        );

        const userInput = await session.prompt();
        if (!userInput)
          return sendMessage(session, `输入无效或超时。`, `排行榜`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (
          !isNaN(userInputNumber) &&
          userInputNumber > 0 &&
          userInputNumber <= rankType.length
        ) {
          const rankName = rankType[userInputNumber - 1];
          await session.execute(`wordleGame.排行榜.${rankName} ${number}`);
        } else if (rankType.includes(userInput)) {
          await session.execute(`wordleGame.排行榜.${userInput} ${number}`);
        } else {
          return sendMessage(session, `无效的输入。`, `排行榜`);
        }
      }
    );

  const rankType2 = [
    "总",
    "经典",
    "CET4",
    "CET6",
    "GMAT",
    "GRE",
    "IELTS",
    "SAT",
    "TOEFL",
    "考研",
    "专八",
    "专四",
    "ALL",
    "Lewdle",
    "汉兜",
    "Numberle",
    "Math",
    "词影",
  ];

  rankType2.forEach((type) => {
    // phb*
    ctx
      .command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(
        async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
          let { channelId, username, userId } = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session);
          await updateNameInPlayerRecord(session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "请输入大于等于 0 的数字作为排行榜的参数。";
          }
          let rankType3: string[];
          if (type === "总") {
            rankType3 = ["胜场", "输场"];
          } else if (type === "词影") {
            rankType3 = ["猜出次数", "胜场", "输场", "最快用时"];
          } else {
            rankType3 = ["胜场", "输场", "最快用时"];
          }
          await sendMessage(
            session,
            `【@${username}】\n${
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
                ? ``
                : `当前可查看排行榜如下：
${rankType3.map((type, index) => `${index + 1}. ${type}`).join("\n")}`
            }
请输入要查看的【类型名】${
              isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
                ? ``
                : `或【序号】`
            }：`,
            rankType3.join(" ")
          );

          const userInput = await session.prompt();
          if (!userInput)
            return sendMessage(session, `输入无效或超时。`, `排行榜`);

          // 处理用户输入
          const userInputNumber = parseInt(userInput);
          if (
            !isNaN(userInputNumber) &&
            userInputNumber > 0 &&
            userInputNumber <= rankType3.length
          ) {
            const rankName = rankType3[userInputNumber - 1];
            await session.execute(
              `wordleGame.排行榜.${type}.${rankName} ${number}`
            );
          } else if (rankType3.includes(userInput)) {
            await session.execute(
              `wordleGame.排行榜.${type}.${userInput} ${number}`
            );
          } else {
            return sendMessage(session, `无效的输入。`, `排行榜`);
          }
        }
      );
  });
  // sy*
  ctx
    .command("wordleGame.排行榜.损益 [number:number]", "查看玩家损益排行榜")
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }
        return await getLeaderboard(
          session,
          "moneyChange",
          "moneyChange",
          "玩家损益排行榜",
          number
        );
      }
    );
  // ccdccs*
  ctx
    .command(
      "wordleGame.排行榜.猜出次数 [number:number]",
      "查看玩家猜出次数排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }
        return await getLeaderboard(
          session,
          "wordGuessCount",
          "wordGuessCount",
          "玩家猜出次数排行榜",
          number
        );
      }
    );
  // zsc*
  ctx
    .command(
      "wordleGame.排行榜.总.胜场 [number:number]",
      "查看玩家总胜场排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }
        return await getLeaderboard(
          session,
          "win",
          "win",
          "玩家总胜场排行榜",
          number
        );
      }
    );
  // zsc*
  ctx
    .command(
      "wordleGame.排行榜.总.输场 [number:number]",
      "查看玩家总输场排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }
        return await getLeaderboard(
          session,
          "lose",
          "lose",
          "查看玩家总输场排行榜",
          number
        );
      }
    );
  const rankType4 = [
    "经典",
    "CET4",
    "CET6",
    "GMAT",
    "GRE",
    "IELTS",
    "SAT",
    "TOEFL",
    "考研",
    "专八",
    "专四",
    "ALL",
    "Lewdle",
    "汉兜",
    "Numberle",
    "Math",
    "词影",
  ];
  // 注册胜场、输场、用时排行榜指令
  rankType4.forEach((type) => {
    ctx
      .command(
        `wordleGame.排行榜.${type}.胜场 [number:number]`,
        `查看${type}胜场排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { channelId, username, userId } = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session);
          await updateNameInPlayerRecord(session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "请输入大于等于 0 的数字作为排行榜的参数。";
          }
          if (
            type === "词影" &&
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              session,
              `【@${username}】\n特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                session,
                `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`,
                `开始游戏 排行榜`
              );
            }
            return await getWinCountLeaderboardForCiying(
              session,
              options.wordles,
              `玩家胜场排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }
          return await sendMessage(
            session,
            await getLeaderboardWinOrLose(type, number, "win", "胜场"),
            `开始游戏 排行榜`
          );
        }
      );

    ctx
      .command(
        `wordleGame.排行榜.${type}.输场 [number:number]`,
        `查看${type}输场排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { channelId, username, userId } = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session);
          await updateNameInPlayerRecord(session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "请输入大于等于 0 的数字作为排行榜的参数。";
          }
          if (
            type === "词影" &&
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              session,
              `【@${username}】\n特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                session,
                `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`,
                `开始游戏 排行榜`
              );
            }
            return await getLoseCountLeaderboardForCiying(
              session,
              options.wordles,
              `玩家输场排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }
          return await sendMessage(
            session,
            await getLeaderboardWinOrLose(type, number, "lose", "输场"),
            `开始游戏 排行榜`
          );
        }
      );

    ctx
      .command(
        `wordleGame.排行榜.${type}.最快用时 [number:number]`,
        `查看${type}最快用时排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { channelId, username, userId } = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session);
          await updateNameInPlayerRecord(session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "请输入大于等于 0 的数字作为排行榜的参数。";
          }
          if (
            type === "词影" &&
            isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              session,
              `【@${username}】\n特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                session,
                `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`,
                `开始游戏 排行榜`
              );
            }
            return await getFastestGuessTimeLeaderboardForCiying(
              session,
              options.wordles,
              `玩家最快用时排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }

          return await sendMessage(
            session,
            await getLeaderboardFastestGuessTime(type, number),
            `开始游戏 排行榜`
          );
        }
      );
  });

  ctx
    .command(
      "wordleGame.排行榜.词影.猜出次数 [number:number]",
      "查看玩家猜出次数排行榜（词影）"
    )
    .option("hard", "--hard 查看困难模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 查看多猜测模式", {
      fallback: 1,
    })
    .action(
      async (
        { session, options },
        number = config.defaultMaxLeaderboardEntries
      ) => {
        let { channelId, username, userId } = session;
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session);
        await updateNameInPlayerRecord(session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "请输入大于等于 0 的数字作为排行榜的参数。";
        }
        if (
          isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
          let numberOfMessageButtonsPerRow = 4;
          await sendMessage(
            session,
            `【@${username}】\n特定游戏模式（可多选）：`,
            markdownCommands,
            numberOfMessageButtonsPerRow
          );

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(
              session,
              `【@${username}】\n输入无效或超时。`,
              `改名 排行榜`
            );
          }

          const modes = {
            困难: "hard",
          };

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          const wordlesMap = {
            x1: 1,
            x2: 2,
            x3: 3,
            x4: 4,
          };

          for (const wordle of Object.keys(wordlesMap)) {
            if (userInput.includes(wordle)) {
              options.wordles = wordlesMap[wordle];
            }
          }

          if (userInput.includes(`跳过`)) {
            noop();
          }
        }
        if (
          typeof options.wordles !== "number" ||
          options.wordles < 1 ||
          options.wordles > 4
        ) {
          return await sendMessage(
            session,
            `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`,
            `开始游戏 排行榜`
          );
        }
        return await getCiyingSuccessCountLeaderboardForCiying(
          session,
          options.wordles,
          "successCount",
          `玩家猜出次数排行榜（词影 x${options.wordles}${
            options.hard && options.wordles === 1 ? "（困难）" : ""
          }）`,
          number,
          options.hard
        );
      }
    );

  // gm*
  ctx
    .command("wordleGame.改名 [newPlayerName:text]", "更改玩家名字")
    .action(async ({ session }, newPlayerName) => {
      const { userId } = session;
      const username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);

      newPlayerName = newPlayerName?.trim();
      if (!newPlayerName) {
        return sendMessage(session, `请输入新的玩家名字。`, `改名`);
      }

      if (
        !(
          config.isEnableQQOfficialRobotMarkdownTemplate &&
          session.platform === "qq" &&
          config.key &&
          config.customTemplateId
        )
      ) {
        return sendMessage(
          session,
          `不是 QQ 官方机器人的话，不用改名哦~`,
          `改名`
        );
      }

      if (newPlayerName.length > 20) {
        return sendMessage(session, `新的玩家名字过长，请重新输入。`, `改名`);
      }

      if (newPlayerName.includes("@everyone")) {
        return sendMessage(session, `新的玩家名字不合法，请重新输入。`, `改名`);
      }

      if (config.isUsingUnifiedKoishiBuiltInUsername) {
        return handleUnifiedKoishiUsername(session, newPlayerName);
      } else {
        return handleCustomUsername(ctx, session, userId, newPlayerName);
      }
    });

  // hs*
  async function handleUnifiedKoishiUsername(session, newPlayerName) {
    newPlayerName = h
      .transform(newPlayerName, { text: true, default: false })
      .trim();

    const users = await ctx.database.get("user", {});
    if (users.some((user) => user.name === newPlayerName)) {
      return sendMessage(session, `新的玩家名字已经存在，请重新输入。`, `改名`);
    }

    try {
      session.user.name = newPlayerName;
      await session.user.$update();
      return sendMessage(
        session,
        `玩家名字已更改为：【${newPlayerName}】`,
        `查询玩家记录 开始游戏 改名`,
        2
      );
    } catch (error) {
      if (RuntimeError.check(error, "duplicate-entry")) {
        return sendMessage(
          session,
          `新的玩家名字已经存在，请重新输入。`,
          `改名`
        );
      } else {
        logger.warn(error);
        return sendMessage(session, `玩家名字更改失败。`, `改名`);
      }
    }
  }

  async function handleCustomUsername(ctx, session, userId, newPlayerName) {
    const players = await ctx.database.get("wordle_player_records", {});
    if (players.some((player) => player.username === newPlayerName)) {
      return sendMessage(session, `新的玩家名字已经存在，请重新输入。`, `改名`);
    }

    const userRecord = await ctx.database.get("wordle_player_records", {
      userId,
    });
    if (userRecord.length === 0) {
      await ctx.database.create("wordle_player_records", {
        userId,
        username: newPlayerName,
      });
    } else {
      await ctx.database.set(
        "wordle_player_records",
        { userId },
        { username: newPlayerName }
      );
    }
    return await sendMessage(
      session,
      `玩家名字已更改为：【${newPlayerName}】`,
      `查询玩家记录 开始游戏 改名`,
      2
    );
  }

  function replaceSymbols(message: string): string {
    let firstLessThan = true;
    let firstGreaterThan = true;
    let result = "";

    for (let i = 0; i < message.length; i++) {
      const char = message[i];

      if (char === "<" && firstLessThan) {
        firstLessThan = false;
        result += char;
      } else if (char === ">" && firstGreaterThan) {
        firstGreaterThan = false;
        result += char;
      } else if (char === "<") {
        result += "[";
      } else if (char === ">") {
        result += "]";
      } else {
        result += char;
      }
    }

    return result;
  }

  async function getSessionUserName(session: any): Promise<string> {
    let sessionUserName = session.username;

    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
      const [user] = await ctx.database.get("user", { id: session.user.id });
      if (config.isUsingUnifiedKoishiBuiltInUsername && user.name) {
        sessionUserName = user.name;
      } else {
        let userRecord = await ctx.database.get("wordle_player_records", {
          userId: session.userId,
        });

        if (userRecord.length === 0) {
          await ctx.database.create("wordle_player_records", {
            userId: session.userId,
            username: sessionUserName,
          });

          userRecord = await ctx.database.get("wordle_player_records", {
            userId: session.userId,
          });
        }
        sessionUserName = userRecord[0].username;
      }
    }

    return sessionUserName;
  }

  async function getWinCountLeaderboardForCiying(
    session: any,
    wordlesNum: number,
    title: string,
    number: number,
    isHardMode: boolean
  ) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    let sortedPlayers;
    let result = "";

    let winCountField = isHardMode ? "winIn1HardMode" : "winIn1Mode";

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      winCountField = `winIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort(
      (a, b) =>
        b.extraCiyingRankInfo[winCountField] -
        a.extraCiyingRankInfo[winCountField]
    );
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${
        player.extraCiyingRankInfo[winCountField]
      } 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getLoseCountLeaderboardForCiying(
    session: any,
    wordlesNum: number,
    title: string,
    number: number,
    isHardMode: boolean
  ) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    let sortedPlayers;
    let result = "";

    let loseCountField = isHardMode ? "loseIn1HardMode" : "loseIn1Mode";

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      loseCountField = `loseIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort(
      (a, b) =>
        b.extraCiyingRankInfo[loseCountField] -
        a.extraCiyingRankInfo[loseCountField]
    );
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${
        player.extraCiyingRankInfo[loseCountField]
      } 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getFastestGuessTimeLeaderboardForCiying(
    session: any,
    wordlesNum: number,
    title: string,
    number: number,
    isHardMode: boolean
  ) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    let sortedPlayers;
    let result = "";

    let fastestGuessTimeField = isHardMode
      ? "fastestGuessTimeIn1HardMode"
      : "fastestGuessTimeIn1Mode";

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      fastestGuessTimeField = `fastestGuessTimeIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers
      .filter((player) => player.extraCiyingRankInfo[fastestGuessTimeField] > 0)
      .sort(
        (a, b) =>
          a.extraCiyingRankInfo[fastestGuessTimeField] -
          b.extraCiyingRankInfo[fastestGuessTimeField]
      );
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${formatGameDuration2(
        player.extraCiyingRankInfo[fastestGuessTimeField]
      )}\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function generateHandlePinyinsImage(pinyinsHtml: string) {
    const browser = ctx.puppeteer.browser;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 420, height: 570, deviceScaleFactor: 1 });
    const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
    await page.goto("file://" + filePath);

    const html = `<html lang="en" class="${
      config.isDarkThemeEnabled ? "dark" : ""
    }" style="--vh: 6.04px;">
    <head>
        <meta charset="UTF-8">
        <title>汉兜 - 汉字 Wordle</title>
        <link rel="stylesheet" href="./assets/汉兜/handle.css">
    </head>
    <body>
        <div id="app" data-v-app="">
            <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class=""><!---->
                <div fixed="" z-40="" class="bottom-0 left-0 right-0 top-0">
                    <div class="bg-base left-0 right-0 top-0 bottom-0 absolute transition-opacity duration-500 ease-out opacity-50"></div>
                    <div class="bg-base border-base absolute transition-all duration-200 ease-out max-w-screen max-h-screen overflow-auto scrolls top-0 left-0 right-0 border-b"
                         style="">
                        <div p8="" pt4="" flex="~ col center" relative=""><p text-xl="" font-serif="" mb8=""><b>拼音速查表</b></p>
                            <div grid="~ cols-[1fr_3fr] gap-x-10 gap-y-4" font-mono="" font-light="">
                                <div text-center="">声母</div>
                                <div text-center="">韵母</div>
                                    ${pinyinsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
</html>`;

    await page.setContent(html, { waitUntil: "load" });
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: config.imageType,
    });
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function deductMoney(channelId: string, platform: string) {
    const getPlayers = await ctx.database.get("wordle_gaming_player_records", {
      channelId,
    });
    for (const thisGamingPlayer of getPlayers) {
      const { userId, money } = thisGamingPlayer;
      if (money === 0) {
        continue;
      }
      const uid = await getPlayerUid(platform, userId);
      const [userMonetary] = await ctx.database.get("monetary", { uid });
      const value = userMonetary.value - money;
      await ctx.database.set("monetary", { uid }, { value });
      // 更新货币变动记录
      const [playerInfo] = await ctx.database.get("wordle_player_records", {
        userId,
      });
      await ctx.database.set(
        "wordle_player_records",
        { userId },
        { moneyChange: playerInfo.moneyChange - money }
      );
    }
  }

  async function processExtraGameInfos(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get(
      "extra_wordle_game_records",
      { channelId }
    );

    return extraGameInfos
      .map(
        ({
          correctLetters,
          presentLetters,
          absentLetters,
          presentLettersWithIndex,
          presentPinyinsWithIndex,
          correctPinyinsWithIndex,
          correctTonesWithIndex,
          presentTonesWithIndex,
          presentTones,
          absentTones,
          absentPinyins,
          presentPinyins,
        }) => {
          const present =
            presentLetters.length === 0 ? "" : `\n包含：【${presentLetters}】`;
          const absent =
            absentLetters.length === 0 ? "" : `\n不包含：【${absentLetters}】`;
          const presentWithoutIndex =
            presentLettersWithIndex.length === 0
              ? ""
              : `\n位置排除：【${presentLettersWithIndex.join(", ")}】`;

          const pinyinsCorrectInfo =
            correctPinyinsWithIndex.length !== 0
              ? `\n正确拼音：【${correctPinyinsWithIndex.join(", ")}】`
              : "";
          const pinyinsPresentInfo =
            presentPinyins.length !== 0
              ? `\n包含拼音：【${presentPinyins.join(", ")}】`
              : "";
          const pinyinsAbsentInfo =
            absentPinyins.length !== 0
              ? `\n不包含拼音：【${absentPinyins.join(", ")}】`
              : "";
          const pinyinsPresentWithIndexInfo =
            presentPinyinsWithIndex.length !== 0
              ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(", ")}】`
              : "";

          const tonesCorrectInfo =
            correctTonesWithIndex.length !== 0
              ? `\n正确声调：【${correctTonesWithIndex.join(", ")}】`
              : "";
          const tonesPresentInfo =
            presentTones.length !== 0
              ? `\n包含声调：【${presentTones.join(", ")}】`
              : "";
          const tonesAbsentInfo =
            absentTones.length !== 0
              ? `\n不包含声调：【${absentTones.join(", ")}】`
              : "";
          const tonesPresentWithIndexInfo =
            presentTonesWithIndex.length !== 0
              ? `\n声调位置排除：【${presentTonesWithIndex.join(", ")}】`
              : "";
          return `\n当前进度：【${correctLetters.join(
            ""
          )}】${present}${absent}${presentWithoutIndex}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}`;
        }
      )
      .join("\n");
  }

  async function processExtraGameRecords(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get(
      "extra_wordle_game_records",
      { channelId }
    );

    const resultStrings: string[] = extraGameInfos.map((info) => {
      // return `\n答案是：【${info.wordGuess}】${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${info.wordAnswerChineseDefinition}`
      return `\n答案是：【${info.wordGuess}】${
        info.wordAnswerChineseDefinition !== ""
          ? `${
              info.pinyin === "" ? "" : `\n拼音为：【${info.pinyin}】`
            }\n释义如下：\n${replaceEscapeCharacters(
              info.wordAnswerChineseDefinition
            )}`
          : ""
      }`;
    });

    return resultStrings.join("\n");
  }

  async function generateWordlesImage(htmlImgString: string) {
    const browser = ctx.puppeteer.browser;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width: config.compositeImagePageWidth,
      height: config.compositeImagePageHeight,
      deviceScaleFactor: 1,
    });
    const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
    await page.goto("file://" + filePath);

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            .image-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: space-between;
                align-items: center;
            }
            .image-container img {
                max-width: 100%;
                /*margin-top: 20px;*/
                /*margin-bottom: 20px;*/
            }
        </style>
        <script>
            window.onload = function() {
                var imageContainer = document.querySelector('.image-container');
                var images = imageContainer.getElementsByTagName('img');

                if (images.length > 4) {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(25% - 15px)";
                    }
                } else {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(50% - 10px)";
                    }
                }
            };
        </script>
    </head>
    <body>
    <div class="image-container">
    ${htmlImgString}
    </div>
    </body>
    </html>`;

    await page.setContent(html, { waitUntil: "load" });
    const wordlesImageBuffer = await page.screenshot({
      fullPage: true,
      type: config.imageType,
    });
    await page.close();
    await context.close();

    return wordlesImageBuffer;
  }

  async function getLeaderboardWinOrLose(type, number, statKey, label) {
    if (typeof number !== "number" || isNaN(number) || number < 0) {
      return "请输入大于等于 0 的数字作为排行榜的参数。";
    }
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );

    // 降序排序
    getPlayers.sort(
      (a, b) =>
        (b.stats[type]?.[statKey] || 0) - (a.stats[type]?.[statKey] || 0)
    );

    const leaderboard: string[] = getPlayers
      .slice(0, number)
      .map(
        (player, index) =>
          `${index + 1}. ${player.username}：${
            player.stats[type]?.[statKey]
          } 次`
      );

    return `${type}模式${label}排行榜：\n${leaderboard.join("\n")}`;
  }

  async function getLeaderboardFastestGuessTime(type: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    const leaderboard = getPlayers
      .filter((player) => player.fastestGuessTime[type] > 0)
      .sort((a, b) => a.fastestGuessTime[type] - b.fastestGuessTime[type])
      .slice(0, number)
      .map(
        (player, index) =>
          `${index + 1}. ${player.username}：${formatGameDuration2(
            player.fastestGuessTime[type]
          )}`
      )
      .join("\n");

    return `${type}模式最快用时排行榜：\n${leaderboard}`;
  }

  async function generateLetterTilesHtml(
    wordGuess: string,
    inputWord: string,
    channelId: string,
    wordleIndex: number,
    gameInfo: GameRecord | ExtraGameRecord
  ): Promise<string> {
    const wordHtml: string[] = new Array(inputWord.length);
    const letterCountMap: { [key: string]: number } = {};

    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters;
    let absentLetters = gameInfo.absentLetters;
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex;

    for (const letter of wordGuess) {
      if (letterCountMap[letter]) {
        letterCountMap[letter]++;
      } else {
        letterCountMap[letter] = 1;
      }
    }

    const lowercaseInputWord = inputWord.toLowerCase();

    // 处理 "correct"
    let htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordGuess[i] === letter) {
        wordHtml[
          htmlIndex
        ] = `<div><div class="Tile-module_tile__UWEHN" data-state="correct">${letter}</div></div>`;
        letterCountMap[letter]--;

        correctLetters[i] = letter;
      } else {
        wordHtml[
          htmlIndex
        ] = `<div><div class="Tile-module_tile__UWEHN" data-state="unchecked">${letter}</div></div>`;
      }
      htmlIndex++;
    }

    // 处理其他标记
    htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordHtml[htmlIndex].includes('data-state="unchecked"')) {
        if (wordGuess.includes(letter)) {
          if (letterCountMap[letter] > 0) {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
              'data-state="unchecked"',
              'data-state="present"'
            );
            letterCountMap[letter]--;

            presentLetters += letter;
            presentLettersWithIndex.push(`${letter}-${i + 1}`);
          } else {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
              'data-state="unchecked"',
              'data-state="absent"'
            );
            absentLetters += letter;
          }
        } else {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
            'data-state="unchecked"',
            'data-state="absent"'
          );
          absentLetters += letter;
        }
      }
      htmlIndex++;
    }
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: uniqueSortedLowercaseLetters(presentLetters),
        absentLetters: removeLetters(
          gameInfo.wordGuess,
          uniqueSortedLowercaseLetters(absentLetters)
        ),
        presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord("wordle_game_records", { channelId });
    } else {
      await setWordleGameRecord("extra_wordle_game_records", {
        channelId,
        wordleIndex,
      });
    }
    return wordHtml.join("\n");
  }

  async function generateLetterTilesHtmlForCiying(
    answerIdiom: string,
    userInputIdiom: string,
    channelId: string,
    wordleIndex: number,
    gameInfo: GameRecord | ExtraGameRecord,
    isHardMode: boolean
  ): Promise<string> {
    const htmlResult: string[] = [
      `<div class="relative flex items-center">
<div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`,
    ];
    const strokesHtmlCache: string[][] = gameInfo.strokesHtmlCache;
    const correctLetters: string[] = gameInfo.correctLetters;
    const previousGuess: string[] = gameInfo.previousGuess;
    const previousGuessIdioms: string[] = gameInfo.previousGuessIdioms;
    const defaultModeSettings = {
      keepShadow: !0,
      correctThreshold: 0.5,
      presentThreshold: 1,
      shiftFactor: 0.7,
      idiomLimit: 2e3,
    };
    const hardModeSettings = {
      keepShadow: !1,
      correctThreshold: 0.3,
      presentThreshold: 1,
      shiftFactor: 0.7,
    };
    const config = isHardMode ? hardModeSettings : defaultModeSettings;
    for (let i = 0; i < answerIdiom.length; i++) {
      const compareReslut = compareStrokes(
        strokesData[answerIdiom[i]],
        strokesData[userInputIdiom[i]],
        null,
        config
      );
      compareReslut.match = answerIdiom[i] === userInputIdiom[i];
      if (compareReslut.match || correctLetters[i] !== "*") {
        correctLetters[i] = answerIdiom[i];
        compareReslut.shadows = [];
        for (const stroke of strokesData[answerIdiom[i]].strokes) {
          compareReslut.shadows.push({
            stroke,
            shiftX: 0,
            shiftY: 0,
            distance: 0,
          });
        }
        compareReslut.match = true;
      }
      htmlResult.push(` <button class="transition-transform betterhover:hover:scale-y-90">
                                <div class="flex h-32 w-32 items-center justify-center border-neutral-400 dark:border-neutral-600 ${
                                  compareReslut.match
                                    ? "bg-correct"
                                    : "border-2"
                                }"
                                     style="">
                                    <svg viewBox="0 0 1024 1024" class="h-24 w-24">
                                        <g transform="scale(1, -1) translate(0, -900)">
                                        ${
                                          compareReslut.match ||
                                          previousGuessIdioms.includes(
                                            userInputIdiom
                                          ) ||
                                          isHardMode
                                            ? ""
                                            : strokesHtmlCache[i].join("\n")
                                        }`);

      // strokesHtmlCache[i].forEach((path, index) => {
      //   const dAttribute = path.match(/d="([^"]*)"/);
      //   if (dAttribute) {
      //     const dValue = dAttribute[1];
      //
      //     compareReslut.shadows = compareReslut.shadows.filter(shadow => shadow.stroke !== dValue);
      //   }
      // });

      for (let shadow of compareReslut.shadows) {
        if (!shadow.stroke) {
          continue;
        }

        const theStrokePath = `  <path d="${shadow.stroke}"
                                                  opacity="${
                                                    (config.presentThreshold -
                                                      Math.max(
                                                        shadow.distance,
                                                        config.correctThreshold
                                                      )) /
                                                    (config.presentThreshold -
                                                      config.correctThreshold)
                                                  }"
                                                  transform="translate(${
                                                    shadow.shiftX
                                                  }, ${shadow.shiftY})"
                                                  class="${
                                                    compareReslut.match
                                                      ? "fill-white"
                                                      : shadow.distance === 0
                                                      ? "fill-correct"
                                                      : "dark:fill-white"
                                                  }"></path>
                                           `;
        htmlResult.push(theStrokePath);
        if (!previousGuess.includes(`${userInputIdiom[i]}-${i}`)) {
          strokesHtmlCache[i].push(theStrokePath);
        }
      }
      htmlResult.push(`</g>
                                    </svg>
                                </div>
                            </button>`);
    }

    htmlResult.push(`</div>
</div>`);
    const userInputIdiomArray = userInputIdiom
      .split("")
      .map((char, index) => `${char}-${index}`);
    userInputIdiomArray.forEach((charIndex) => {
      if (!previousGuess.includes(charIndex)) {
        previousGuess.push(charIndex);
      }
    });
    if (!previousGuessIdioms.includes(userInputIdiom)) {
      previousGuessIdioms.push(userInputIdiom);
    }
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        strokesHtmlCache,
        correctLetters,
        previousGuess,
        previousGuessIdioms,
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord("wordle_game_records", { channelId });
    } else {
      await setWordleGameRecord("extra_wordle_game_records", {
        channelId,
        wordleIndex,
      });
    }
    return htmlResult.join("\n");
  }

  async function generateLetterTilesHtmlForHandle(
    answerIdiom: string,
    userInputIdiom: string,
    channelId: string,
    wordleIndex: number,
    gameInfo: GameRecord | ExtraGameRecord,
    answerPinyin: string,
    userInputPinyin: string
  ) {
    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters;
    let absentLetters = gameInfo.absentLetters;
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex;
    let correctPinyinsWithIndex = gameInfo.correctPinyinsWithIndex;
    let presentPinyinsWithIndex = gameInfo.presentPinyinsWithIndex;
    let absentPinyins = gameInfo.absentPinyins;
    let correctTonesWithIndex = gameInfo.correctTonesWithIndex;
    let presentTonesWithIndex = gameInfo.presentTonesWithIndex;
    let absentTones = gameInfo.absentTones;
    let presentPinyins = gameInfo.presentPinyins;
    let presentTones = gameInfo.presentTones;

    interface WordInfo {
      word: string;
      pinyin: string[];
    }

    if (!userInputPinyin) {
      const userInputIdiomInfo = await getIdiomInfo(userInputIdiom);
      userInputPinyin = userInputIdiomInfo.pinyin;
    }

    // 拼音转换 分离音标 string[][]
    const processedUserInputPinyin = processPinyin(userInputPinyin);
    const processedAnswerIdiomPinyin = processPinyin(answerPinyin);

    // 总信息
    const userInputIdiomAllRecords: WordInfo[] = userInputIdiom
      .split("")
      .map((char, index) => {
        const pinyinArray = processedUserInputPinyin[index].map((p) => {
          const [pinyin, status = ""] = p.split("-");
          return `${pinyin}-absent${status ? `-${status}-absent` : ""}`;
        });
        return { word: `${char}-absent`, pinyin: pinyinArray };
      });

    // 汉字统计
    const userInputIdiomCharCount = countCharactersAndIndexes(userInputIdiom);
    const answerIdiomCharCount = countCharactersAndIndexes(answerIdiom);
    // 声母、韵母、整体认读音节统计
    const userInputPinyinOccurrences = processPinyinArray(
      processedUserInputPinyin
    );
    const answerIdiomPinyinOccurrences = processPinyinArray(
      processedAnswerIdiomPinyin
    );

    const userInputPinyinAllOccurrences = mergeOccurrences(
      userInputPinyinOccurrences
    );
    const answerIdiomPinyinAllOccurrences = mergeOccurrences(
      answerIdiomPinyinOccurrences
    );
    // 声调统计
    const userInputTones = countNumericTones(processedUserInputPinyin);
    const answerIdiomTones = countNumericTones(processedAnswerIdiomPinyin);
    const answerIdiomTonesCopy = answerIdiomTones;

    for (const char in userInputIdiomCharCount) {
      if (char in answerIdiomCharCount) {
        const userInputCharInfo = userInputIdiomCharCount[char];
        const answerCharInfo = answerIdiomCharCount[char];

        const commonIndexes = userInputCharInfo.indexes.filter((index) =>
          answerCharInfo.indexes.includes(index)
        );

        commonIndexes.forEach((index) => {
          // correct
          // userInputIdiomAllRecords[index].pinyin = userInputIdiomAllRecords[index].pinyin.map(pinyin => pinyin.replace(/-\w+$/g, '-correct'));
          userInputIdiomAllRecords[index].word = userInputIdiomAllRecords[
            index
          ].word.replace(/-\w+$/g, "-correct");
          correctLetters[index] =
            userInputIdiomAllRecords[index].word.split("-")[0];
          // updateOccurrences(answerIdiomPinyinAllOccurrences, index);
          // updateOccurrences(userInputPinyinAllOccurrences, index);
          // updateOccurrences(userInputTones, index);
          // updateOccurrences(answerIdiomTones, index);

          userInputCharInfo.count -= 1;
          userInputCharInfo.indexes = userInputCharInfo.indexes.filter(
            (i) => i !== index
          );

          answerCharInfo.count -= 1;
          answerCharInfo.indexes = answerCharInfo.indexes.filter(
            (i) => i !== index
          );
        });

        userInputCharInfo.indexes.forEach((userIndex) => {
          if (
            !answerCharInfo.indexes.includes(userIndex) &&
            answerCharInfo.count > 0
          ) {
            // present
            userInputIdiomAllRecords[userIndex].word = userInputIdiomAllRecords[
              userIndex
            ].word.replace(/-\w+$/g, "-present");

            presentLetters +=
              userInputIdiomAllRecords[userIndex].word.split("-")[0];
            presentLettersWithIndex.push(
              `${userInputIdiomAllRecords[userIndex].word.split("-")[0]}-${
                userIndex + 1
              }`
            );
            answerCharInfo.count -= 1;
          }
        });
      } else {
        // absent
        absentLetters += char;
      }
    }

    for (const element in userInputPinyinAllOccurrences) {
      if (element in answerIdiomPinyinAllOccurrences) {
        const userInputElementInfo = userInputPinyinAllOccurrences[element];
        const answerElementInfo = answerIdiomPinyinAllOccurrences[element];

        const commonPositions = userInputElementInfo.positions.filter(
          (position) => answerElementInfo.positions.includes(position)
        );

        commonPositions.forEach((position) => {
          // correct
          const pinyinArray = userInputIdiomAllRecords[position].pinyin
            .map((pinyin) => {
              return pinyin.split("-")[0];
            })
            .join("");

          const matchIndex = pinyinArray.indexOf(element);
          if (matchIndex !== -1) {
            for (let i = matchIndex; i < matchIndex + element.length; i++) {
              userInputIdiomAllRecords[position].pinyin[i] =
                userInputIdiomAllRecords[position].pinyin[i].replace(
                  "absent",
                  "correct"
                );
            }
          }

          correctPinyinsWithIndex.push(`${element}-${position + 1}`);

          userInputElementInfo.count -= 1;
          userInputElementInfo.positions =
            userInputElementInfo.positions.filter((i) => i !== position);

          answerElementInfo.count -= 1;
          answerElementInfo.positions = answerElementInfo.positions.filter(
            (i) => i !== position
          );
        });

        userInputElementInfo.positions.forEach((userPosition) => {
          if (
            !answerElementInfo.positions.includes(userPosition) &&
            answerElementInfo.count > 0
          ) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin
              .map((pinyin) => {
                return pinyin.split("-")[0];
              })
              .join("");

            const matchIndex = pinyinArray.indexOf(element);
            if (matchIndex !== -1) {
              for (let i = matchIndex; i < matchIndex + element.length; i++) {
                userInputIdiomAllRecords[userPosition].pinyin[i] =
                  userInputIdiomAllRecords[userPosition].pinyin[i].replace(
                    "absent",
                    "present"
                  );
              }
            }
            presentPinyins.push(element);
            presentPinyinsWithIndex.push(`${element}-${userPosition + 1}`);
            answerElementInfo.count -= 1;
          }
        });
      } else {
        absentPinyins.push(element);
      }
    }

    for (const tone in userInputTones) {
      if (tone in answerIdiomTones) {
        // correct
        const userInputToneInfo = userInputTones[tone];
        const answerToneInfo = answerIdiomTones[tone];

        const commonPositions = userInputToneInfo.positions.filter((position) =>
          answerToneInfo.positions.includes(position)
        );

        commonPositions.forEach((position) => {
          const matchIndex = userInputIdiomAllRecords[
            position
          ].pinyin.findIndex((pinyin) => pinyin.includes(`-${tone}-absent`));
          if (matchIndex !== -1) {
            userInputIdiomAllRecords[position].pinyin[matchIndex] =
              userInputIdiomAllRecords[position].pinyin[matchIndex].replace(
                `-${tone}-absent`,
                `-${tone}-correct`
              );
          }
          correctTonesWithIndex.push(`第${tone}声-${position + 1}`);
          userInputToneInfo.count -= 1;
          userInputToneInfo.positions = userInputToneInfo.positions.filter(
            (i) => i !== position
          );

          answerToneInfo.count -= 1;
          answerToneInfo.positions = answerToneInfo.positions.filter(
            (i) => i !== position
          );
        });

        userInputToneInfo.positions.forEach((userPosition) => {
          if (
            !answerToneInfo.positions.includes(userPosition) &&
            answerToneInfo.count > 0
          ) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin;
            const matchIndex = pinyinArray.findIndex((pinyin) =>
              pinyin.includes(`-${tone}-absent`)
            );
            if (matchIndex !== -1) {
              userInputIdiomAllRecords[userPosition].pinyin[matchIndex] =
                pinyinArray[matchIndex].replace(
                  `-${tone}-absent`,
                  `-${tone}-present`
                );
            }
            presentTones.push(`第${tone}声`);
            presentTonesWithIndex.push(`第${tone}声-${userPosition + 1}`);
            answerToneInfo.count -= 1;
          }
        });
      } else {
        absentTones.push(`第${tone}声`);
      }
    }

    const processedRecords = processAllRecords(userInputIdiomAllRecords);

    const processedRecords2 = transformRecords(processedRecords);

    const htmlResult: string[] = [`<div flex="">`];
    for (const record of processedRecords2) {
      const wordValue = record.word.value;
      const statusMap: { [key: string]: string } = {
        absent: "op80",
        present: "text-mis",
        correct: "text-ok",
      };

      let wordStatus = record.word.status;
      wordStatus = statusMap[wordStatus] || wordStatus;

      const statusMap2: { [key: string]: string } = {
        absent: "op35",
        present: "text-mis",
        correct: "text-ok",
      };
      const pinyin = record.pinyin;
      const separatedPinyin = separatePinyin(record);
      const initial = record.initial;
      const final = record.final;
      const toneValue = record.tune.value;
      const toneStatus = record.tune.status;
      const tonesPaths = [
        "0",
        // 第 1 声
        '<path d="M3.35 8C2.60442 8 2 8.60442 2 9.35V10.35C2 11.0956 2.60442 11.7 3.35 11.7H17.35C18.0956 11.7 18.7 11.0956 18.7 10.35V9.35C18.7 8.60442 18.0956 8 17.35 8H3.35Z" fill="currentColor"></path>',
        // 第 2 声
        '<path d="M16.581 3.71105C16.2453 3.27254 15.6176 3.18923 15.1791 3.52498L3.26924 12.6439C2.83073 12.9796 2.74743 13.6073 3.08318 14.0458L4.29903 15.6338C4.63478 16.0723 5.26244 16.1556 5.70095 15.8199L17.6108 6.70095C18.0493 6.3652 18.1327 5.73754 17.7969 5.29903L16.581 3.71105Z" fill="currentColor"></path>',
        // 第 3 声
        '<path d="M1.70711 7.70712C1.31658 7.3166 1.31658 6.68343 1.70711 6.29291L2.41421 5.5858C2.80474 5.19528 3.4379 5.19528 3.82843 5.5858L9.31502 11.0724C9.70555 11.4629 10.3387 11.4629 10.7292 11.0724L16.2158 5.5858C16.6064 5.19528 17.2395 5.19528 17.63 5.5858L18.3372 6.29291C18.7277 6.68343 18.7277 7.3166 18.3372 7.70712L10.7292 15.315C10.3387 15.7056 9.70555 15.7056 9.31502 15.315L1.70711 7.70712Z" fill="currentColor"></path>',
        // 第 4 声
        '<path d="M4.12282 3.71105C4.45857 3.27254 5.08623 3.18923 5.52474 3.52498L17.4346 12.6439C17.8731 12.9796 17.9564 13.6073 17.6207 14.0458L16.4048 15.6338C16.0691 16.0723 15.4414 16.1556 15.0029 15.8199L3.09303 6.70095C2.65452 6.3652 2.57122 5.73754 2.90697 5.29903L4.12282 3.71105Z" fill="currentColor"></path>',
      ];
      const html: string[] = [
        `<div w-30="" h-30="" m2="">
                    <div h-30="" w-30="" border-2="" flex="~ center" relative="" leading-1em="" em="" font-serif=""
                         class="bg-gray-400/8 border-transparent">
                        <div absolute="" text-5xl="" leading-1em="" class="${wordStatus} top-12">${wordValue}</div>
                        <div absolute="" font-mono="" text-center="" left-0="" right-0="" font-100="" flex=""
                             flex-col="" items-center="" class="top-14px" text-2xl="">
                            <div relative="" ma="" items-start="" flex="~ x-center">
                                ${
                                  separatedPinyin.initials.length > 0
                                    ? `<div class="${
                                        statusMap2[
                                          separatedPinyin.initials[0].status
                                        ]
                                      }" mx-1px="">${initial}</div>`
                                    : ""
                                }
<div mx-1px="" flex="">`,
      ];
      for (const final of separatedPinyin.finals) {
        if (!final.isHasTone) {
          html.push(
            `<div class="${statusMap2[final.status]}">${final.value}</div>`
          );
        } else {
          html.push(`                  <div relative="">
                                        <div class="${
                                          statusMap2[final.status]
                                        }">${
            final.value === "i" ? "ı" : final.value
          }</div>
                                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                             class="${
                                               statusMap2[toneStatus]
                                             }" absolute="" w="86%" left="8%"
                                             style="bottom: 1.5rem;">
                                            ${tonesPaths[toneValue]}
                                        </svg>
                                    </div>`);
        }
      }
      html.push(`</div>
                            </div>
                        </div>
                    </div>
                </div>`);
      htmlResult.push(html.join("\n"));
    }
    htmlResult.push(`</div>`);

    const pinyinSet = new Set(
      Object.keys(answerIdiomPinyinOccurrences.initialsOccurrences).concat(
        Object.keys(answerIdiomPinyinOccurrences.finalsOccurrences)
      )
    );

    const filteredAbsentPinyins = absentPinyins.filter(
      (pinyin) => !pinyinSet.has(pinyin)
    );
    absentTones.forEach((tone, index) => {
      const toneNumber = tone.match(/\d+/);
      if (toneNumber) {
        const key = toneNumber[0];
        if (answerIdiomTonesCopy[key]) {
          absentTones.splice(index, 1);
        }
      }
    });
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: removeDuplicates(presentLetters),
        absentLetters: removeLetters(
          gameInfo.wordGuess,
          removeDuplicates(absentLetters)
        ),
        presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
        correctPinyinsWithIndex: mergeDuplicates(correctPinyinsWithIndex),
        presentPinyinsWithIndex: mergeDuplicates(presentPinyinsWithIndex),
        correctTonesWithIndex: mergeDuplicates(correctTonesWithIndex),
        presentTonesWithIndex: mergeDuplicates(presentTonesWithIndex),
        presentPinyins: mergeDuplicates(presentPinyins),
        presentTones: mergeDuplicates(presentTones),
        absentPinyins: mergeDuplicates(filteredAbsentPinyins),
        absentTones: mergeDuplicates(absentTones),
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord("wordle_game_records", { channelId });
    } else {
      await setWordleGameRecord("extra_wordle_game_records", {
        channelId,
        wordleIndex,
      });
    }

    return htmlResult.join("\n");
  }

  async function setGuessRunningStatus(
    channelId: string,
    isRunning: boolean
  ): Promise<void> {
    await ctx.database.set("wordle_game_records", { channelId }, { isRunning });
  }

  async function endGame(channelId: string) {
    lastMessageInfo.delete(channelId);

    await Promise.all([
      ctx.database.remove("wordle_gaming_player_records", { channelId }),
      ctx.database.remove("wordle_game_records", { channelId }),
      ctx.database.remove("extra_wordle_game_records", { channelId }),
    ]);
  }

  async function getCiyingSuccessCountLeaderboardForCiying(
    session: any,
    wordlesNum: number,
    sortField: string,
    title: string,
    number: number,
    isHardMode: boolean
  ) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    let sortedPlayers;
    let result = "";

    let successCountField = isHardMode
      ? "successCountIn1HardMode"
      : "successCountIn1Mode";

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      successCountField = `successCountIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort(
      (a, b) =>
        b.extraCiyingRankInfo[successCountField] -
        a.extraCiyingRankInfo[successCountField]
    );
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${
        player.extraCiyingRankInfo[successCountField]
      } 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getLeaderboard(
    session: any,
    type: string,
    sortField: string,
    title: string,
    number: number
  ) {
    const getPlayers: PlayerRecord[] = await ctx.database.get(
      "wordle_player_records",
      {}
    );
    const sortedPlayers = getPlayers.sort(
      (a, b) => b[sortField] - a[sortField]
    );
    const topPlayers = sortedPlayers.slice(0, number);

    let result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player[sortField]} ${
        type === "moneyChange" ? "点" : "次"
      }\n`;
    });
    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function updatePlayerRecordsLose(
    channelId: string,
    gameInfo: GameRecord
  ) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get(
      "wordle_gaming_player_records",
      { channelId }
    );

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get("wordle_player_records", {
        userId: player.userId,
      });
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedLose = playerInfo.lose + 1;
      playerInfo.stats[gameMode].lose += 1;

      if (gameInfo.gameMode === "词影") {
        if (gameInfo.wordlesNum === 1) {
          if (gameInfo.isHardMode) {
            playerInfo.extraCiyingRankInfo.loseIn1HardMode += 1;
          } else {
            playerInfo.extraCiyingRankInfo.loseIn1Mode += 1;
          }
        } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
          const extraCiyingRankInfoKey = `loseIn${gameInfo.wordlesNum}Mode`;
          playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
        }
      }

      const updateData = {
        stats: playerInfo.stats,
        lose: updatedLose,
      };

      if (gameInfo.gameMode === "词影") {
        updateData["extraCiyingRankInfo"] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set(
        "wordle_player_records",
        { userId: player.userId },
        updateData
      );
    }
  }

  async function updatePlayerRecordsWin(
    channelId: string,
    gameInfo: GameRecord
  ) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get(
      "wordle_gaming_player_records",
      { channelId }
    );

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get("wordle_player_records", {
        userId: player.userId,
      });
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedWin = playerInfo.win + 1;
      playerInfo.stats[gameMode].win += 1;

      if (gameInfo.gameMode === "词影") {
        if (gameInfo.wordlesNum === 1) {
          if (gameInfo.isHardMode) {
            playerInfo.extraCiyingRankInfo.winIn1HardMode += 1;
          } else {
            playerInfo.extraCiyingRankInfo.winIn1Mode += 1;
          }
        } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
          const extraCiyingRankInfoKey = `winIn${gameInfo.wordlesNum}Mode`;
          playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
        }
      }

      const updateData = {
        stats: playerInfo.stats,
        win: updatedWin,
      };

      if (gameInfo.gameMode === "词影") {
        updateData["extraCiyingRankInfo"] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set(
        "wordle_player_records",
        { userId: player.userId },
        updateData
      );
    }
  }

  async function processNonZeroMoneyPlayers(
    channelId: string,
    platform: string
  ) {
    const getPlayers = await ctx.database.get("wordle_gaming_player_records", {
      channelId,
    });
    const settlementRecords: string[] = [];

    for (const thisGamingPlayer of getPlayers) {
      const { userId, money, username } = thisGamingPlayer;

      if (money === 0) {
        continue;
      }

      const uid = await getPlayerUid(platform, userId);
      const rewardMultiplier = config.defaultRewardMultiplier;
      const gainAmount = money * rewardMultiplier;

      await ctx.monetary.gain(uid, gainAmount);

      // 更新货币变动记录
      const [playerInfo] = await ctx.database.get("wordle_player_records", {
        userId,
      });
      const updatedMoneyChange = playerInfo.moneyChange + gainAmount;
      await ctx.database.set(
        "wordle_player_records",
        { userId },
        { moneyChange: updatedMoneyChange }
      );

      // 为投入货币不是零的玩家生成结算字符串并添加到结算记录数组
      const settlementString = `【${username}】：【+${gainAmount}】`;
      settlementRecords.push(settlementString);
    }

    // 将结算记录数组组合成一个最终结算字符串
    return settlementRecords.join("\n");
  }

  async function updateGamingPlayerRecords(channelId: string) {
    // 非经典还钱
    const getPlayers = await ctx.database.get("wordle_gaming_player_records", {
      channelId,
    });
    for (const thisGamingPlayer of getPlayers) {
      const { userId, money } = thisGamingPlayer;
      if (money === 0) {
        continue;
      }
      await ctx.database.set(
        "wordle_gaming_player_records",
        { channelId, userId },
        { money: 0 }
      );
    }
  }

  async function generateImage(
    styledHtml: string,
    gridHtml: string
  ): Promise<Buffer> {
    const browser = ctx.puppeteer.browser;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 611, height: 731, deviceScaleFactor: 1 });
    const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
    await page.goto("file://" + filePath);

    const html = `${htmlPrefix}
    ${styledHtml}
    ${htmlAfterStyle}
    <div class="Board-module_board__jeoPS" style="width: 600px; height: 720px;">
      ${gridHtml}
    </div>
    ${htmlSuffix}`;

    await page.setContent(html, { waitUntil: "load" });
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: config.imageType,
    });
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function generateImageForCiying(
    gridHtml: string,
    rowNum: number
  ): Promise<Buffer> {
    const browser = ctx.puppeteer.browser;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width: 611,
      height: 140 * rowNum,
      deviceScaleFactor: 1,
    });
    const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
    await page.goto("file://" + filePath);

    const html = `<html lang="zh" class="h-full ${
      config.isDarkThemeEnabled ? "dark" : ""
    }">
<head>
    <meta charset="UTF-8">
    <title>词影</title>
    <link rel="stylesheet" href="./assets/词影/ciying.css">
        <style>
        .container {
            padding-top: 10px;
            padding-bottom: 10px;
        }
    </style>
</head>

<body class="h-full overflow-y-hidden dark:bg-neutral-900 dark:text-white">
<div class="container">

<div class="flex h-full w-full flex-col">

    <div class="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden">
        <div class="flex h-full items-center justify-center overflow-y-auto">
            <div class="max-h-full">
                <div class="grid grid-rows-5 gap-2 py-2">
${gridHtml}
                </div>
            </div>
        </div>
    </div>
</div>
</div>

</body>
</html>`;

    await page.setContent(html, { waitUntil: "load" });
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: config.imageType,
    });
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function generateImageForHandle(gridHtml: string): Promise<Buffer> {
    const browser = ctx.puppeteer.browser;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 611, height: 731, deviceScaleFactor: 1 });
    const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
    await page.goto("file://" + filePath);

    const html = `<html lang="en" class="${
      config.isDarkThemeEnabled ? "dark" : ""
    }" style="--vh: 7.55px;">
<head>
    <meta charset="UTF-8">
    <title>汉兜 - 汉字 Wordle</title>
    <link rel="stylesheet" href="./assets/汉兜/handle.css">
    <style>
        .container {
            padding-top: 30px;
            padding-bottom: 30px;
        }
    </style>
</head>
<body>
<div class="container">
    <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class="${
      config.isHighContrastThemeEnabled ? "colorblind" : ""
    }">
        <div flex="~ col" items-center="">
           ${gridHtml}
        </div>
    </main>
</div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: "load" });
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: config.imageType,
    });
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function getPlayerUid(
    platform: string,
    userId: string
  ): Promise<number> {
    const user = await getUserFromDatabase(platform, userId);
    return user.id;
  }

  async function getUserFromDatabase(platform: string, userId: string) {
    return await ctx.database.getUser(platform, userId);
  }

  async function getNumberOfPlayers(channelId: string): Promise<number> {
    const playerRecords = await ctx.database.get(
      "wordle_gaming_player_records",
      { channelId }
    );
    return playerRecords.length;
  }

  async function isPlayerInGame(
    channelId: string,
    userId: string
  ): Promise<boolean> {
    const getPlayer = await ctx.database.get("wordle_gaming_player_records", {
      channelId,
      userId,
    });
    return getPlayer.length !== 0;
  }

  async function getGameInfo(channelId: string): Promise<GameRecord> {
    let gameRecord = await ctx.database.get("wordle_game_records", {
      channelId,
    });
    if (gameRecord.length === 0) {
      await ctx.database.create("wordle_game_records", {
        channelId,
        isStarted: false,
      });
      gameRecord = await ctx.database.get("wordle_game_records", { channelId });
    }
    return gameRecord[0];
  }

  async function getGameInfo2(
    channelId: string,
    wordleIndex: number
  ): Promise<ExtraGameRecord> {
    const gameRecord = await ctx.database.get("extra_wordle_game_records", {
      channelId,
      wordleIndex,
    });
    return gameRecord[0];
  }

  async function updateNameInPlayerRecord(
    session,
    userId: string,
    username: string
  ): Promise<void> {
    const userRecord = await ctx.database.get("wordle_player_records", {
      userId,
    });

    let isChange = false;

    if (userRecord.length === 0) {
      await ctx.database.create("wordle_player_records", {
        userId,
        username,
      });
      return;
    }

    const existingRecord = userRecord[0];

    if (
      username !== existingRecord.username &&
      (!(
        isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq"
      ) ||
        (isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq" &&
          config.isUsingUnifiedKoishiBuiltInUsername))
    ) {
      existingRecord.username = username;
      isChange = true;
    }

    const keys = ["Lewdle", "汉兜", "Numberle", "Math", "词影"];

    keys.forEach((key) => {
      if (
        !existingRecord.stats[key] ||
        !existingRecord.stats.hasOwnProperty(key)
      ) {
        existingRecord.stats[key] = { win: 0, lose: 0 };
        isChange = true;
      }
      if (!existingRecord.fastestGuessTime[key]) {
        existingRecord.fastestGuessTime[key] = 0;
        isChange = true;
      }
    });

    if (isChange) {
      await ctx.database.set(
        "wordle_player_records",
        { userId },
        {
          username: existingRecord.username,
          stats: existingRecord.stats,
          fastestGuessTime: existingRecord.fastestGuessTime,
        }
      );
    }
  }

  const lastMessageInfo = new Map<string, { id: string; timestamp: number }>();
  const msgSeqMap: { [msgId: string]: number } = {};

  async function sendMessage(
    session: any,
    message: any,
    markdownCommands: string,
    numberOfMessageButtonsPerRow?: number,
    isButton?: boolean
  ): Promise<void> {
    isButton = isButton || false;
    numberOfMessageButtonsPerRow =
      numberOfMessageButtonsPerRow || config.numberOfMessageButtonsPerRow;
    const { bot, channelId } = session;
    let messageId;
    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
      const msgSeq = msgSeqMap[session.messageId] || 10;
      msgSeqMap[session.messageId] = msgSeq + 100;
      const buttons = await createButtons(session, markdownCommands);

      const rows = [];
      let row = { buttons: [] };
      buttons.forEach((button, index) => {
        row.buttons.push(button);
        if (
          row.buttons.length === 5 ||
          index === buttons.length - 1 ||
          row.buttons.length === numberOfMessageButtonsPerRow
        ) {
          rows.push(row);
          row = { buttons: [] };
        }
      });

      if (!isButton && config.isTextToImageConversionEnabled) {
        const lines = message.toString().split("\n");
        const isOnlyImgTag =
          lines.length === 1 && lines[0].trim().startsWith("<img");
        if (isOnlyImgTag) {
          [messageId] = await session.send(message);
        } else {
          const modifiedMessage = lines
            .map((line) => {
              if (line.trim() !== "" && !line.includes("<img")) {
                return `# ${line}`;
              } else {
                return line + "\n";
              }
            })
            .join("\n");
          ctx.inject(["markdownToImage"], async (ctx) => {
            const imageBuffer = await ctx.markdownToImage.convertToImage(
              modifiedMessage
            );
            [messageId] = await session.send(
              h.image(imageBuffer, `image/${config.imageType}`)
            );
          });
        }

        if (config.isTextToImageConversionEnabled && markdownCommands !== "") {
          await sendMessage(
            session,
            "",
            markdownCommands,
            numberOfMessageButtonsPerRow,
            true
          );
        }
      } else if (isButton && config.isTextToImageConversionEnabled) {
        const result = await session.qq.sendMessage(session.channelId, {
          msg_type: 2,
          msg_id: session.messageId,
          msg_seq: msgSeq,
          content: "",
          markdown: {
            custom_template_id: config.customTemplateId,
            params: [
              {
                key: config.key,
                values: [`<@${session.userId}>`],
              },
            ],
          },
          keyboard: {
            content: {
              rows: rows.slice(0, 5),
            },
          },
        });
        messageId = result.id;
      } else {
        if (message.attrs?.src || message.includes("<img")) {
          [messageId] = await session.send(message);
        } else {
          // message = message.replace(/\n/g, '\r').replace(/\*/g, "？");
          // message = replaceSymbols(message);
          message = replaceSymbols(
            message.replace(/\n/g, "\r").replace(/\*/g, "？")
          );

          const result = await session.qq.sendMessage(session.channelId, {
            msg_type: 2,
            msg_id: session.messageId,
            msg_seq: msgSeq,
            content: "111",
            markdown: {
              custom_template_id: config.customTemplateId,
              params: [
                {
                  key: config.key,
                  values: [`${message}`],
                },
              ],
            },
            keyboard: {
              content: {
                rows: rows.slice(0, 5),
              },
            },
          });

          messageId = result.id;
        }
      }
    } else {
      if (config.isTextToImageConversionEnabled) {
        const lines = message.toString().split("\n");
        const isOnlyImgTag =
          lines.length === 1 && lines[0].trim().startsWith("<img");
        if (isOnlyImgTag) {
          [messageId] = await session.send(message);
        } else {
          const modifiedMessage = lines
            .map((line) => {
              if (line.trim() !== "" && !line.includes("<img")) {
                return `# ${line}`;
              } else {
                return line + "\n";
              }
            })
            .join("\n");
          ctx.inject(["markdownToImage"], async (ctx) => {
            const imageBuffer = await ctx.markdownToImage.convertToImage(
              modifiedMessage
            );
            [messageId] = await session.send(
              h.image(imageBuffer, `image/${config.imageType}`)
            );
          });
        }
      } else {
        [messageId] = await session.send(message);
      }
    }

    if (config.retractDelay > 0 && messageId) {
      const prevMessage = lastMessageInfo.get(channelId);

      if (prevMessage) {
        const timePassed = Date.now() - prevMessage.timestamp;
        const remainingDelay = config.retractDelay * 1000 - timePassed;

        if (timePassed < 118000) {
          // 留2秒余量
          setTimeout(async () => {
            try {
              await bot.deleteMessage(channelId, prevMessage.id);
            } catch (error) {
              logger.warn(
                `Failed to retract message ${prevMessage.id}: ${error.message}`
              );
            }
          }, remainingDelay);
        }
      }

      lastMessageInfo.set(channelId, { id: messageId, timestamp: Date.now() });
    }
  }

  interface ChatCompletion {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    system_fingerprint: string;
  }

  interface Choice {
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: any;
    finish_reason: string;
  }

  async function sendPostRequestForAI(content: string): Promise<string> {
    const url = "https://happyapi.org/v1/chat/completions";
    const headers = {
      Authorization: "sk-vO5N4lICC3gEMRURDbjkrE5RwaKPKHXiEhk1VRTpHd2vvQyU",
      "Content-Type": "application/json",
    };

    const requestBody = {
      messages: [
        {
          role: "user",
          content: `# 汉语拼音生成器
- 提供一个四个汉字的词语，期望输出对应的正确的汉语拼音。
- 只输出汉语拼音，不包含其他无关内容。

示例输入:
戒奢宁俭

期望输出:
jiè shē nìng jiǎn

输入：
${content}

输出：`,
        },
      ],
      stream: false,
      model: "gpt-4o-mini",
      temperature: 0.5,
      presence_penalty: 2,
    };

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    };

    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        const data = (await response.json()) as ChatCompletion;
        return data.choices[0].message.content;
      } else {
        logger.error("未能提取数据:", response.status);
        return "";
      }
    } catch (error) {
      logger.error("读取数据时出错：", error);
      return "";
    }
  }

  interface Button {
    render_data: {
      label: string;
      visited_label: string;
      style: number;
    };
    action: {
      type: number;
      permission: { type: number };
      data: string;
      enter: boolean;
    };
  }

  function parseMarkdownCommands(markdownCommands: string): string[] {
    return markdownCommands
      .split(" ")
      .filter((command) => command.trim() !== "");
  }

  async function createButtons(session: any, markdownCommands: string) {
    const commands = parseMarkdownCommands(markdownCommands);

    const mapCommandToDataValue = (command: string) => {
      const commandMappings: Record<string, string> = {
        加入游戏: "wordlegame.加入",
        开始游戏: "wordlegame.开始",
        改名: "wordlegame.改名",
        查询玩家记录: "wordlegame.查询玩家记录",
        猜测: "wordlegame.猜",
        随机猜测: "wordlegame.猜 -r",
        输入: "",
        排行榜: "wordlegame.排行榜",
        玩法介绍: "wordlegame.玩法介绍",
        退出游戏: "wordlegame.退出",
        查单词: "wordlegame.查单词",
        查成语: "wordlegame.查成语",
        单词查找器: "wordlegame.单词查找器",
        查询进度: "wordlegame.查询进度",
        拼音速查表: "wordlegame.拼音速查表",
        结束游戏: "wordlegame.结束",
        再来一把: "wordlegame.开始",
        再来一把经典: "wordlegame.开始.经典",
        再来一把CET4: "wordlegame.开始.CET4",
        再来一把CET6: "wordlegame.开始.CET6",
        再来一把GMAT: "wordlegame.开始.GMAT",
        再来一把GRE: "wordlegame.开始.GRE",
        再来一把IELTS: "wordlegame.开始.IELTS",
        再来一把SAT: "wordlegame.开始.SAT",
        再来一把TOEFL: "wordlegame.开始.TOEFL",
        再来一把考研: "wordlegame.开始.考研",
        再来一把专八: "wordlegame.开始.专八",
        再来一把专四: "wordlegame.开始.专四",
        再来一把ALL: "wordlegame.开始.ALL",
        再来一把Lewdle: "wordlegame.开始.Lewdle",
        再来一把汉兜: "wordlegame.开始.汉兜",
        再来一把Numberle: "wordlegame.开始.Numberle",
        再来一把Math: "wordlegame.开始.Math",
        再来一把词影: "wordlegame.开始.词影",
        数字: "Numberle",
        脏话: "Lewdle",
        方程: "Math",
      };

      return commandMappings[command];
    };

    const createButton = async (command: string) => {
      let dataValue = mapCommandToDataValue(command);
      if (dataValue === undefined) {
        dataValue = command;
      }

      return {
        render_data: {
          label: command,
          visited_label: command,
          style: 1,
        },
        action: {
          type: 2,
          permission: { type: 2 },
          data: `${dataValue}`,
          enter: ![
            "加入游戏",
            "猜测",
            "查询玩家记录",
            "改名",
            "输入",
            "困难",
            "超困难",
            "变态",
            "变态挑战",
            "x1",
            "x2",
            "x3",
            "x4",
            "自由",
            "全成语",
          ].includes(command),
        },
      };
    };

    const buttonPromises = commands.map(createButton);
    return Promise.all(buttonPromises);
  }

  async function replaceAtTags(session, content: string): Promise<string> {
    // 正则表达式用于匹配 at 标签
    const atRegex = /<at id="(\d+)"(?: name="([^"]*)")?\/>/g;

    // 匹配所有 at 标签
    let match;
    while ((match = atRegex.exec(content)) !== null) {
      const userId = match[1];
      const name = match[2];

      // 如果 name 不存在，根据 userId 获取相应的 name
      if (!name) {
        let guildMember;
        try {
          guildMember = await session.bot.getGuildMember(
            session.guildId,
            userId
          );
        } catch (error) {
          guildMember = {
            user: {
              name: "未知用户",
            },
          };
        }

        // 替换原始的 at 标签
        const newAtTag = `<at id="${userId}" name="${guildMember.user.name}"/>`;
        content = content.replace(match[0], newAtTag);
      }
    }

    return content;
  }

  function checkStrokesData(inputWord: string): boolean {
    for (const char of inputWord) {
      if (!strokesData[char]) {
        return false;
      }
    }
    return true;
  }

  async function getSelectedIdiom(randomIdiom) {
    let selectedIdiom = undefined;

    if (isIdiomInList(randomIdiom, idiomsList)) {
      const foundIdiom = idiomsList.find((item) => item.idiom === randomIdiom);
      if (foundIdiom) {
        selectedIdiom = foundIdiom;
      }
    } else {
      selectedIdiom = await getIdiomInfo(randomIdiom);
    }

    return selectedIdiom;
  }

  function isMathEquationValid(content: string): boolean {
    const validExpression = /^[0-9\+\-\*\/\=]*$/; // 只包含 0-9 的数字和 +-*/= 运算符

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

  function isNumericString(content: string): boolean {
    const numericRegex = /^[0-9]+$/;
    return numericRegex.test(content);
  }

  function generateNumberString(length: number): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  function removeIndexFromPinyins(pinyinsWithIndex: string[]): string[] {
    return pinyinsWithIndex.map((item) => {
      return item.split("-")[0];
    });
  }

  async function updateDataInTargetFile(
    newFilePath: string,
    targetFilePath: string,
    missingProperty: string
  ): Promise<void> {
    try {
      const [newData, targetData] = await Promise.all([
        readJSONFile(newFilePath),
        readJSONFile(targetFilePath),
      ]);

      const targetDataMap = new Map(
        targetData.map((item: any) => [item[missingProperty], item])
      );

      const missingData = newData.filter(
        (dataItem: any) => !targetDataMap.has(dataItem[missingProperty])
      );

      targetData.push(...missingData);
      await writeJSONFile(targetFilePath, targetData);

      if (missingData.length > 0) {
        logger.success("添加的对象：", missingData);
      }
    } catch (error) {
      logger.error("发生错误：", error);
    }
  }

  async function writeJSONFile(filePath: string, data: any) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, "utf-8");
  }

  async function readJSONFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
    return [];
  }

  async function ensureFileExists(filePath: string) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]", "utf-8");
    }
  }

  async function ensureDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  function removeDuplicates(inputString: string): string {
    let result = "";
    for (let i = 0; i < inputString.length; i++) {
      if (result.indexOf(inputString[i]) === -1) {
        result += inputString[i];
      }
    }
    return result;
  }

  function mergeDuplicates(arr: string[]): string[] {
    const uniqueArr = arr.reduce((acc: string[], current: string) => {
      if (!acc.includes(current)) {
        acc.push(current);
      }
      return acc;
    }, []);
    return uniqueArr;
  }

  function findIdiomByIdiom(
    inputWord: string,
    idiomsList: Idiom[]
  ): Idiom | undefined {
    return idiomsList.find((idiom) => idiom.idiom === inputWord);
  }

  function isIdiomInList(inputWord: string, idiomsList: Idiom[]): boolean {
    return idiomsList.some((idiom) => idiom.idiom === inputWord);
  }

  interface Idiom {
    idiom: string;
    pinyin: string;
    explanation: string;
  }

  function getRandomIdiom(idiomsList: Idiom[]): Idiom {
    const randomIndex: number = Math.floor(Math.random() * idiomsList.length);
    return idiomsList[randomIndex];
  }

  interface PinyinItem {
    value: string;
    status: "absent" | "present" | "correct";
    isHasTone: boolean;
  }

  interface SeparatedPinyin {
    initials: PinyinItem[];
    finals: PinyinItem[];
  }

  function separatePinyin(record): SeparatedPinyin {
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

  function transformRecords(
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
      // 处理 word
      const word = record.word.split("-")[0];
      const status = record.word.split("-")[1];

      let tuneValue: number = 0;
      let tuneStatus = "";
      // 处理 pinyin
      const pinyin = record.pinyin.map((p) => {
        let value = p.split("-")[0];
        const status = p.split("-")[1];
        const isHasTone = !!p.split("-")[2]; // 是否有数字声调
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

  function updateOccurrences(occurrences, index) {
    for (const key in occurrences) {
      if (occurrences[key].positions.includes(index)) {
        occurrences[key].count -= 1;
        occurrences[key].positions = occurrences[key].positions.filter(
          (p) => p !== index
        );
      }
    }
  }

  function mergeOccurrences(occurrences: any) {
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

  function countNumericTones(processedPinyin: string[][]) {
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

  function isWholeSyllableRecognition(pinyin: string): boolean {
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

  function processPinyin2(pinyinArray: string[]): string {
    return pinyinArray.map((pinyin) => pinyin.replace(/-\d/g, "")).join("");
  }

  function processPinyin3(pinyin: string): string {
    // 在这里实现处理拼音的逻辑，将状态和数字声调去掉
    return pinyin.replace(/-\w+/g, "").replace(/\d/g, "");
  }

  interface ProcessedRecord {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }

  // 韵母
  const finals = [
    "a",
    "o",
    "e",
    "i",
    "u",
    "ü",
    "ai",
    "ei",
    "ui",
    "ao",
    "ou",
    "er",
    "ia",
    "ie",
    "ua",
    "uo",
    "üe",
    "ue",
    "iao",
    "iou",
    "uai",
    "uei",
    "an",
    "ian",
    "uan",
    "üan",
    "en",
    "in",
    "uen",
    "ün",
    "un",
    "ang",
    "iang",
    "uang",
    "eng",
    "ing",
    "ueng",
    "ong",
    "iong",
  ];

  function processAllRecords(
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

  function processPinyinArray(pinyinArray: string[][]): {
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
      // if (isWholeSyllableRecognition(pinyin) && false) {
      //   if (wholeSyllableRecognitionOccurrences[pinyin]) {
      //     wholeSyllableRecognitionOccurrences[pinyin].count++;
      //     wholeSyllableRecognitionOccurrences[pinyin].positions.push(index);
      //   } else {
      //     wholeSyllableRecognitionOccurrences[pinyin] = {count: 1, positions: [index]};
      //   }
      // } else {
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
      // }
    });

    return {
      wholeSyllableRecognitionOccurrences,
      initialsOccurrences,
      finalsOccurrences,
    };
  }

  function countCharactersAndIndexes(idiom: string): {
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

  function processPinyin(pinyin: string): string[][] {
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

  function isFourCharacterIdiom(targetIdiom: string): boolean {
    if (targetIdiom.length !== 4) {
      return false;
    }

    const chineseRegex = /^[\u4e00-\u9fa5]+$/;
    if (!chineseRegex.test(targetIdiom)) {
      return false;
    }

    return true;
  }

  function writeIdiomsToFile(filePath: string, idiomsList: Idiom[]): void {
    try {
      const jsonData = JSON.stringify(idiomsList, null, 2);
      fs.writeFileSync(filePath, jsonData, "utf-8");
    } catch (error) {
      logger.error("将词语|成语写入文件时出错：", error);
    }
  }

  async function getIdiomInfo(
    idiom: string
  ): Promise<{ pinyin: string; explanation: string }> {
    try {
      const response = await fetch(
        `https://dict.baidu.com/s?wd=${idiom}&device=pc&ptype=zici`
      );
      if (!response.ok) {
        throw new Error("未能提取数据。");
      }

      const html = await response.text();

      // fs.writeFileSync(`${idiom}.html`, html, 'utf8');
      const $ = load(html);
      const basicMeanWrapper = $("#basicmean-wrapper");

      const pinyin = basicMeanWrapper
        .find(".tab-content .pinyin-font")
        .text()
        .trim();
      const explanation = basicMeanWrapper
        .find(".tab-content dd p")
        .text()
        .trim();

      if (!pinyin || !explanation) {
        throw new Error("找不到拼音或解释。");
      }
      if (!isIdiomInList(idiom, idiomsList)) {
        const newIdiom: Idiom = {
          idiom,
          pinyin,
          explanation: "【解释】" + explanation,
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(idiomsKoishiFilePath, idiomsList);
      }
      return { pinyin, explanation };
    } catch (error) {
      return { pinyin: "未找到拼音", explanation: "未找到解释" };
    }
  }

  async function getIdiomInfo2(
    idiom: string
  ): Promise<{ pinyin: string; explanation: string }> {
    try {
      const response = await fetch(`https://www.zdic.net/hans/${idiom}`);
      if (!response.ok) {
        throw new Error("未能提取数据。");
      }

      const html = await response.text();

      // fs.writeFileSync(`${idiom}.html`, html, 'utf8');

      const $ = load(html);

      const pinyin = $(".ciif.noi.zisong .dicpy")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();
      // const explanation = $('#cyjs .content.definitions.cnr').text().replace(/\s+/g, ' ').trim();
      const cyjsDiv = $("#cyjs");
      cyjsDiv.find("h3").remove();
      const explanation = cyjsDiv
        .find("p")
        .map((_, p) => $(p).text())
        .get()
        .join("\n");

      if (!pinyin || !explanation) {
        throw new Error("找不到拼音或解释。");
      }
      if (!isIdiomInList(idiom, idiomsList)) {
        const newIdiom: Idiom = {
          idiom,
          pinyin,
          explanation,
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(idiomsFilePath, idiomsList);
      }
      return { pinyin, explanation };
    } catch (error) {
      return { pinyin: "未找到拼音", explanation: "未找到解释" };
    }
  }

  function checkAbsentLetters(
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

  function checkPresentLettersWithIndex(
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

  function getRandomFromStringList(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].toLowerCase();
  }

  async function fetchAndParseWords(url: string) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = load(html);

      const wordGroups = $(".word-group");
      let finalResult = "";

      if (wordGroups.length === 0) {
        finalResult = "未找到。";
      } else {
        wordGroups.each((_, element) => {
          const title = $(element).find(".word-group__title").text();
          const words = $(element)
            .find(".word-group__inner .word")
            .map((_, el) =>
              $(el)
                .contents()
                .filter(function () {
                  return this.nodeType === 3;
                })
                .text()
                .trim()
            )
            .get();
          finalResult += `${title}:\n${words.join(", ")}\n\n`;
        });
      }

      return finalResult;
    } catch (error) {
      logger.error("发生错误：", error);
    }
  }

  function capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function fetchWordDefinitions(word: string) {
    const url = "https://wordword.org/api/words/get_by_word";
    const requestBody = {
      word: word,
    };

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const responseData = await response.json();
    return responseData;
  }

  function serializeDefinitions(definitions: { [part: string]: any }) {
    let resultString = "";
    for (const part in definitions) {
      resultString += `${part}.\n`;
      definitions[part].forEach((definition: any) => {
        resultString += `- ${definition.text}\n`;
      });
      resultString += "\n";
    }
    return resultString;
  }

  function generateImageTags(buffers: Buffer[]): string {
    return buffers
      .map((buffer, index) => {
        const base64Image = buffer.toString("base64");
        return `    <img src="data:image/png;base64,${base64Image}" alt="图片${
          index + 1
        }">`;
      })
      .join("\n");
  }

  function extractLowerCaseWords(
    arr: { word: string; translation: string }[]
  ): string[] {
    return arr.map((item) => item.word.toLowerCase());
  }

  function replaceEscapeCharacters(input: string): string {
    return input.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
  }

  function combineWord(letters: LetterState[]): string {
    return letters.reduce((word, { letter }) => word + letter, "");
  }

  function findWord(targetWord: string): WordEntry | undefined {
    const fileData = getJsonFilePathAndWordCountByLength(
      "ALL",
      targetWord.length
    );
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, "utf-8"));

    // 小写化
    const lowercaseTargetWord = targetWord.toLowerCase();

    // 寻找
    return jsonData.find(
      (entry) => entry.word.toLowerCase() === lowercaseTargetWord
    );
  }

  async function findLongestMatchedWords(
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

  function processWordAndMatch(
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

  function matchWordsList(
    bucket: LetterState[],
    word: string,
    wordsList: string[]
  ): string[] {
    return wordsList.filter((candidateWord) => isMatch(candidateWord, bucket));
  }

  function isMatch(word: string, bucket: LetterState[]): boolean {
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

  function processWord(userInputWord: string, word: string): LetterState[] {
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

  function generateStatsInfo(stats, fastestGuessTime) {
    const gameTypes = [
      "经典",
      "CET4",
      "CET6",
      "GMAT",
      "GRE",
      "IELTS",
      "SAT",
      "TOEFL",
      "考研",
      "专八",
      "专四",
      "ALL",
      "Lewdle",
      "汉兜",
      "Numberle",
      "Math",
      "词影",
    ];

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

  function formatGameDuration(elapsedSeconds: number): string {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `用时：${minutes} 分 ${seconds} 秒`;
    } else {
      return `用时：${seconds} 秒`;
    }
  }

  function formatGameDuration2(elapsedSeconds: number): string {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `${minutes} 分 ${seconds} 秒`;
    } else {
      return `${seconds} 秒`;
    }
  }

  function removeLetters(wordAnswer: string, absentLetters: string): string {
    const letterSet = new Set(wordAnswer);
    return absentLetters
      .split("")
      .filter((letter) => !letterSet.has(letter))
      .join("");
  }

  function calculateGameDuration(
    startTime: number,
    currentTime: number
  ): string {
    const elapsedMilliseconds = currentTime - startTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `用时：【${minutes} 分 ${seconds} 秒】`;
    } else {
      return `用时：【${seconds} 秒】`;
    }
  }

  function uniqueSortedLowercaseLetters(input: string): string {
    const uniqueLetters = Array.from(
      new Set(input.toLowerCase().match(/[a-z]/g))
    );
    return uniqueLetters.sort().join("");
  }

  function mergeSameLetters(arr: string[]): string[] {
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

  // function countNonAsteriskChars(arr: string[]): number {
  //   arr = mergeSameLetters(arr)
  //   let count = 0;
  //   for (let char of arr) {
  //     if (char !== '*') {
  //       count++;
  //     }
  //   }
  //   return count;
  // }

  function generateGameEndMessage(gameInfo: GameRecord): string {
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

  function getRandomWordTranslation(
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

  function getJsonFilePathAndWordCountByLength(
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

  function isValidGuessWordLength(
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

  function getValidGuessWordLengthRange(command: string): string {
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

  function generateStyledHtml(row: number): string {
    // noinspection CssInvalidFunction
    const styledHtml = `
<style>
        .Row-module_row__pwpBq {
            display: grid;
            grid-template-columns: repeat(${row - 1}, 1fr);
            grid-gap: 5px;
        }

        .Board-module_board__jeoPS {
            display: grid;
            grid-template-rows: repeat(${row}, 1fr);
            grid-gap: 5px;
            padding: 10px;
            box-sizing: border-box;
        }
    </style>`;

    return styledHtml;
  }

  function generateEmptyGridHtml(rowNum: number, tileNum: number): string {
    let html = "";
    for (let i = 0; i < rowNum; i++) {
      html += `<div class="Row-module_row__pwpBq">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <div>
            <div class="Tile-module_tile__UWEHN" data-state="empty"></div>
            <!--第${i + 1}行第${j + 1}列-->
        </div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  function generateEmptyGridHtmlForCiying(
    rowNum: number,
    tileNum: number,
    isBorder: boolean
  ): string {
    let html = "";
    for (let i = 0; i < rowNum; i++) {
      html += `<div class="relative flex items-center">
                        <div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <!--第${i + 1}行第${j + 1}列-->
         <input enterkeyhint="done" disabled="" class="h-32 w-32 border-2 bg-transparent text-center font-serif text-5xl border-neutral-300 dark:border-neutral-700 ${
           isBorder ? "border-neutral-500 dark:border-neutral-500" : ""
         }" placeholder="">
                            `;
      }
      html += `   </div>
                    </div>`;
    }
    return html;
  }

  function generateEmptyGridHtmlForHandle(
    rowNum: number,
    tileNum: number
  ): string {
    let html = "";
    for (let i = 0; i < rowNum; i++) {
      html += `<div flex="">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <!--第${i + 1}行第${j + 1}列-->
        <div w-30="" h-30="" m2="">
            <div h-30="" w-30="" border-4="" flex="~ center" relative="" leading-1em="" font-serif=""
                 class="bg-gray-400/8">
            </div>
        </div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  // html*
  const htmlSuffix = `</div>
      </main>
    </div>
  </div>
</div>
</body>
</html>
`;
  const htmlPrefix = `<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wordle</title>

    <style>

        .pz-error__message h1 {
            font-style: normal;
            font-size: 2em;
            font-size: min(2em, 90px);
            line-height: 1.15;
            font-weight: 700;
            margin-bottom: 25px
        }

        .pz-error__message p {
            font-size: 1.125em;
            line-height: 1.39;
            margin-bottom: 30px;
            max-width: 510px
        }


        .pz-error__stack-trace pre {
            white-space: normal
        }

        button, input, optgroup, select, textarea {
            font-family: inherit;
            font-size: 100%;
            line-height: 1.15;
            margin: 0
        }

        button, input {
            overflow: visible
        }

        button, select {
            text-transform: none
        }

        button, [type=button], [type=reset], [type=submit] {
            -webkit-appearance: button
        }

        html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline
        }

        article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
            display: block
        }

        body {
            line-height: 1
        }

        ol, ul {
            list-style: none
        }

        blockquote, q {
            quotes: none
        }

        blockquote:before, blockquote:after, q:before, q:after {
            content: "";
            content: none
        }

        table {
            border-collapse: collapse;
            border-spacing: 0
        }

        @font-face {
            font-family: "nyt-franklin";
            src: url("./assets/Wordle/franklin-normal-700.woff2") format("woff2");
            font-weight: 700;
            font-style: normal
        }

        :root {
            --green: #6aaa64;
            --green-4: #538d4e;
            --wordle-high-contrast-green: #58a351;
            --spellingBeeYellow: #f7da21;
            --miniCrosswordBlue: #95befa;
            --connectionsPeriwinkle: #b4a8ff;
            --sudoku-orange: #fb9b00;
            --tiles-green: #b5e352;
            --dailyCrosswordBlue: #6493e6;
            --yellow-3: #c9b458;
            --yellow-4: #b59f3b;
            --newsGray-10: #dfdfdf;
            --newsGray-100: #121212;
            --newsGray-85: #363636;
            --gray-3: #ccc;
            --gray-4: #dcdcdc;
            --gray-6: #f4f4f4;
            --gray-13: #d3d6da;
            --gray-18: #787c7e;
            --gray-19: #878a8c;
            --gray-20: #edeff1;
            --gray-21: #f6f7f8;
            --gray-22: #e3e3e1;
            --gray-23: #a6a6a6;
            --gray-24: #818384;
            --gray-25: #565758;
            --gray-26: #3a3a3c;
            --gray-27: #424242;
            --gray-28: #59595a;
            --gray-29: #afafaf;
            --black: #000;
            --white: #fff;
            --newsDarkContentPrimary: #f8f8f8;
            --wordleBlack: #212121;
            --wordleBlack-2: #272729;
            --wordleBlack-3: #1a1a1b;
            --wordleBlack-4: #121213;
            --wordleBlack-5: #2f2f31;
            --linkBlue: #346eb7;
            --linkDarkBlue: #6ba1dd;
            --orange: #f5793a;
            --blue: #85c0f9;
            --outlineBlue: #2671dc;
            --svg-arrow-fill: var(--white);
            --svg-arrow-stroke: var(--black);
            --svg-arrow-fill-hover: var(--black);
            --svg-arrow-stroke-hover: var(--white)
        }

        :root {
            --color-tone-1: var(--black);
            --color-tone-2: var(--gray-18);
            --color-tone-3: var(--gray-19);
            --color-tone-4: var(--gray-13);
            --color-tone-5: var(--gray-20);
            --color-tone-6: var(--gray-21);
            --color-tone-7: var(--white);
            --color-tone-8: var(--newsGray-100);
            --color-tone-9: var(--newsGray-10);
            --color-tone-10: var(--black);
            --color-tone-11: var(--gray-18);
            --color-tone-12: var(--newsGray-85);
            --color-nav-hover: var(--gray-6);
            --opacity-50: rgba(255, 255, 255, 0.5);
            --error-background: var(--gray-22);
            --icon-disabled: var(--gray-23);
            --background-gray: var(--gray-29);
            --inline-links: var(--linkBlue);
            --warning-red: #d0021b
        }

        .dark {
            --color-tone-1: var(--newsDarkContentPrimary);
            --color-tone-2: var(--gray-24);
            --color-tone-3: var(--gray-25);
            --color-tone-4: var(--gray-26);
            --color-tone-5: var(--wordleBlack-2);
            --color-tone-6: var(--wordleBlack-3);
            --color-tone-7: var(--wordleBlack-4);
            --color-tone-8: var(--newsDarkContentPrimary);
            --color-tone-9: var(--gray-27);
            --color-tone-10: var(--newsGray-10);
            --color-tone-11: var(--newsGray-10);
            --color-tone-12: var(--newsGray-10);
            --color-nav-hover: var(--wordleBlack-5);
            --opacity-50: rgba(0, 0, 0, 0.5);
            --error-background: var(--color-tone-7);
            --icon-disabled: var(--gray-28);
            --svg-arrow-fill: var(--black);
            --svg-arrow-stroke: var(--white);
            --svg-arrow-fill-hover: var(--white);
            --svg-arrow-stroke-hover: var(--black);
            --inline-links: var(--linkDarkBlue);
            --warning-red: #ea7980
        }

        :root, .dark {
            --color-background: var(--color-tone-7)
        }

        :root {
            --color-present: var(--yellow-3);
            --color-correct: var(--green);
            --color-absent: var(--color-tone-2);
            --tile-text-color: var(--color-tone-7);
            --key-text-color: var(--color-tone-1);
            --key-evaluated-text-color: var(--color-tone-7);
            --key-bg: var(--color-tone-4);
            --key-bg-present: var(--color-present);
            --key-bg-correct: var(--color-correct);
            --key-bg-absent: var(--color-absent);
            --key-evaluated-text-color: var(--color-tone-7);
            --key-evaluated-text-color-absent: var(--white);
            --modal-content-bg: var(--color-tone-7);
            --outline-focus: var(--outlineBlue);
            --color-correct-high-contrast: var(--wordle-high-contrast-green)
        }

        @font-face {
            font-family: "nyt-franklin";
            src: url("./assets/Wordle/franklin-normal-700.woff2") format("woff2");
            font-weight: 700;
            font-style: normal
        }

        html {
            height: 100%
        }

        body {
            height: 100%;
            background-color: var(--color-background);
            margin: 0;
            padding: 0;
            overflow-y: hidden
        }

        html, body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale
        }

        button:focus-visible, a:focus-visible {
            outline: 2px solid var(--outline-focus)
        }

        @media (min-width: 415px) {
            :root {
                --header-height: 65px
            }
        }

        @media (min-width: 1024px) {
            :root {
                --header-padding-x: 24px
            }
        }

        @media (min-width: 768px) {
            :root {
                --header-padding-x: 20px
            }
        }

        /*# sourceMappingURL=wordle.e3c9f95c41d06668a615.css.map*/

    </style>
    <style>
        .MomentSystem-module_moment__G9hyw {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0
        }


        .LandscapeWarning-module_landscapeWarning__MFIwn i {
            height: 30%;
            width: 20%;
            margin: 2rem
        }

        .LandscapeWarning-module_landscapeWarning__MFIwn p {
            font-family: "nyt-franklin";
            font-weight: 500;
            margin: 0;
            font-size: 16px;
            font-size: 1rem;
            line-height: 20.8px;
            line-height: 1.3rem
        }

        .LandscapeWarning-module_landscapeWarning__MFIwn span {
            font-family: "nyt-franklin";
            font-weight: 700
        }


        .dark before {
            background: var(--hybrid-back-dark-mode) center no-repeat;
            background-position-x: 0px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG i {
            min-height: 35px;
            min-width: 35px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG.NonDismissalBanner-module_bannerMessageIcon__xCwfD i {
            min-height: 20px;
            min-width: 20px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl h3 {
            font-size: 14px;
            font-size: 0.875rem;
            line-height: 18.2px;
            line-height: 1.1375rem;
            font-weight: 700;
            margin: 0
        }



        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl p {
            font-size: 16px;
            font-size: 1rem;
            line-height: 20.8px;
            line-height: 1.3rem
        }

        .NonDismissalBanner-module_banner__CqPDp a {
            color: inherit;
            text-decoration: none
        }




        .NonDismissalBanner-module_multiIconBannerTest__t8tvf button.NonDismissalBanner-module_iconButtonTest__oaGgl i {
            margin-right: 0
        }



        .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerInformationTest__Q0Dqp i {
            min-height: 25px;
            min-width: 25px
        }


        .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerBodyTest__UrtZZ h3 {
            font-size: .85rem;
            font-weight: 700;
            margin: 0
        }

        .NonDismissalBanner-module_multiIconBannerTest__t8tvf a {
            color: inherit;
            text-decoration: none
        }


        .LargeCTABanner-module_playButton__if85L i {
            width: 27px;
            height: 27px;
            border-radius: 7px
        }

        .LargeCTABanner-module_iconTextWrapper__goI7a + i {
            position: absolute;
            right: 10px
        }



        .Skip-module_skipButton__m8KJ8 svg {
            margin-left: .5rem
        }


        :root {
            --inter-ad-skip-button-height: 52px;
            --inter-ad-top-bar-height: 34px;
            --inter-ad-bottom-bar-height: 24px
        }

        .AdInterstitial-module_adSlug__lH065 h3 {
            font-family: "nyt-franklin";
            font-weight: 500;
            font-size: 12px;
            line-height: 12px;
            margin: 12px auto 10px;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: #5a5a5a;
            font-style: normal
        }

        .Welcome-module_buttonContainer__K4GEw a {
            all: inherit
        }

        .Welcome-module_back__cUvW3 button::before {
            background: var(--hybrid-back) center no-repeat !important;
            background-position-x: 0px !important
        }

        .Tile-module_tile__UWEHN {
            font-family: "nyt-franklin";
            width: 100%;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            font-size: 3rem;
            line-height: 1;
            font-weight: bold;
            vertical-align: middle;
            box-sizing: border-box;
            color: var(--tile-text-color);
            text-transform: uppercase;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none
        }

        .Tile-module_tile__UWEHN::before {
            content: "";
            display: inline-block;
            padding-bottom: 100%
        }

        @media (max-height: 600px) {
            .Tile-module_tile__UWEHN {
                font-size: 1em
            }
        }

        .Tile-module_tile__UWEHN[data-state=empty] {
            border: 2px solid var(--color-tone-4)
        }

        .Tile-module_tile__UWEHN[data-state=tbd] {
            background-color: var(--color-tone-7);
            border: 2px solid var(--color-tone-3);
            color: var(--color-tone-1)
        }

        .Tile-module_tile__UWEHN[data-state=correct] {
            background-color: var(--color-correct);
            color: var(--key-evaluated-text-color)
        }

        .Tile-module_tile__UWEHN[data-state=present] {
            background-color: var(--color-present);
            color: var(--key-evaluated-text-color)
        }

        .Tile-module_tile__UWEHN[data-state=absent] {
            background-color: var(--color-absent);
            color: var(--key-evaluated-text-color-absent)
        }

        .Tile-module_tile__UWEHN[data-animation=pop] {
            animation-name: Tile-module_PopIn__CmX51;
            animation-duration: 100ms
        }

        .Tile-module_tile__UWEHN[data-animation=flip-in] {
            animation-name: Tile-module_FlipIn__PCdh1;
            animation-duration: 250ms;
            animation-timing-function: ease-in
        }

        .Tile-module_tile__UWEHN[data-animation=flip-out] {
            animation-name: Tile-module_FlipOut__xeJcb;
            animation-duration: 250ms;
            animation-timing-function: ease-in
        }


        .Board-module_boardContainer__TBHNL {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
            overflow: hidden
        }

        .Help-module_instructions__uXsG6 li {
            margin-bottom: 4px
        }

        .Help-module_instructions__uXsG6 li::marker {
            font-size: 18px
        }


        .Help-module_examples__W3VXL strong {
            font-weight: bold
        }

        .Help-module_examples__W3VXL p {
            margin: 0;
            font-size: 16px;
            line-height: 20px
        }


        .Help-module_example__gldBI p {
            font-size: 16px;
            line-height: 20px;
            margin-top: 8px
        }


        .Help-module_reminderSignUp__oQ42D a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }



        .Help-module_statsLogin__HkQec button {
            border: none;
            background-color: rgba(0, 0, 0, 0);
            font-family: "nyt-franklin";
            font-size: 16px;
            line-height: 20px;
            text-align: left;
            padding: 0px 0px 3px
        }

        .Help-module_statsLogin__HkQec a, .Help-module_statsLogin__HkQec button {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }


        .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR > a {
            color: inherit
        }


        .Stats-module_statsBtnLeft__IyDkc h1 {
            display: inline-block
        }

        .Stats-module_statsBtnLeft__IyDkc button {
            margin-left: 10px
        }

        .Footer-module_textContainer__LWkeW > p {
            margin: 5px
        }


        .Footer-module_buttonsContainer__YNxCQ .Footer-module_loginButton__abKD3 > a {
            color: inherit;
            text-decoration: none
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_nextWordle__Bzpb0 span {
            margin-right: 4px
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc span {
            color: #121212;
            letter-spacing: normal
        }

        .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
            font: 700 14px/17.5px "nyt-franklin";
            margin: 0
        }

        .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p span {
            font-weight: 400;
            text-decoration: underline
        }

        @media (max-height: 548px) {
            .driveToMore .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
                font-size: 13px
            }
        }



        .HardModeAwareness-module_settingsButton__DGkRg svg {
            width: 12px;
            height: 12px;
            margin: 1px 0 0 5px;
            display: inline-block
        }

        #hardModeAwareness-dialog > div:first-child {
            padding: 0;
            max-width: 440px
        }

        @media (max-width: 500px) {
            #hardModeAwareness-dialog > div:first-child {
                width: 90%;
                height: auto;
                min-height: unset;
                align-self: center
            }
        }


        .ActivationRegiModal-module_loginLink__qqJOJ > a {
            color: inherit;
            text-decoration: none
        }


        .driveToMore h4 {
            font: 700 0.6875rem/0.859375rem "nyt-franklin";
            letter-spacing: .05em;
            border-top: solid 2px var(--color-tone-1);
            padding-top: 10px;
            margin: 0 auto 18px;
            width: calc(100% - 50px);
            display: none
        }

        @media (min-height: 548px) {
            .driveToMore h4 {
                display: block
            }
        }

        @media (min-width: 768px) {
            .driveToMore h4 {
                width: calc(100% - 100px)
            }
        }


        @media (min-width: 768px) {

            .driveToMore .DriveToMoreContent-module_fitContent__h6S25 h4 {
                width: 100%
            }
        }

        .driveToMore .DriveToMoreContent-module_fitContentGrid__TDzaq h4 {
            width: auto
        }

        .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
            font: 700 0.875rem/1.1875rem "nyt-karnakcondensed";
            margin: 5px 0 2px
        }

        @media (min-height: 548px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
                font-size: 1rem
            }
        }

        @media (min-width: 768px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
                font-size: 1rem
            }
        }

        .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
            font: 500 0.75rem/1rem "nyt-franklin"
        }

        @media (min-height: 548px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
                font-size: 0.875rem;
                line-height: 1.125rem
            }
        }

        @media (min-width: 992px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
                font-size: 0.75rem
            }
        }


        .NewsCarousel-module_carouselNewsItem__iTjNZ p {
            font: 500 0.875rem/1.09375rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }

        img {
            width: 100%;
            animation: NewsCarousel-module_fadeIn__XJI1h 500ms
        }


        .NewsCarousel-module_desktopCarouselNewsItem__pjK2M p {
            font: 500 1rem/1.25rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }


        .NewsCarousel-module_carouselControl__P2VRs svg {
            width: 100%;
            height: 100%
        }

        .NewsCarousel-module_carouselControl__P2VRs:hover svg {
            fill: #dfdfdf
        }

        .Settings-module_setting__EaMz6 a, .Settings-module_setting__EaMz6 a:visited {
            color: var(--color-tone-8);
            text-decoration: underline
        }


        .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c svg {
            width: 100%;
            height: auto
        }

        .Modal-module_closeIcon__TcEKb svg {
            width: 100%;
            height: auto
        }


        .AppHeader-module_menuRight__Noasd button svg {
            vertical-align: middle
        }

        @media (max-width: 499px) {
            .pz-web .AppHeader-module_menuRight__Noasd.AppHeader-module_longTextVariant__guJaD svg {
                width: 20px
            }
        }

        .Explainer-module_containerLink__Eahjg p:last-child {
            font-weight: 700
        }


        .Explainer-module_text__DosQz > a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }



        .Explainer-module_headerNew__y8y2y > p {
            text-align: center;
            margin: 10px 0px
        }



        .Page-module_page__Py6Ys header {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative
        }

        .Page-module_page__Py6Ys h1 {
            font-weight: 700;
            font-size: 16px;
            letter-spacing: .5px;
            text-transform: uppercase;
            text-align: center;
            margin-bottom: 10px
        }



        .Page-module_headerNew__FQAkL > p {
            text-align: center;
            margin: 10px 0px
        }




        .Error-module_errorBannerContainer__pfK75 p {
            font-weight: 400;
            margin: 5px 5px 5px 10px
        }

        .Ad-module_adContainer__ZAFEc > *:first-child {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%)
        }

        .App-module_gameContainer__K_CBh {
            position: relative
        }

        .App-module_game__yruqo {
            width: 100%;
            max-width: var(--game-max-width);
            margin: 0 auto;
            height: calc(100% - var(--header-height));
            display: flex;
            flex-direction: column
        }

        .pz-offline-ticker svg path {
            fill: var(--white)
        }

        .StatsSelectionTool-module_form__eOT7F fieldset {
            margin-bottom: 40px
        }

        .dark.colorblind {
            --color-absent: var(--color-tone-4);
            --key-bg-absent: var(--color-tone-4)
        }

        .colorblind {
            --color-correct: var(--orange);
            --color-present: var(--blue);
            --color-absent: var(--color-tone-2);
            --tile-text-color: var(--white);
            --key-bg-present: var(--color-present);
            --key-bg-correct: var(--color-correct);
            --key-bg-absent: var(--color-tone-2);
            --key-evaluated-text-color: var(--black);
            --key-evaluated-text-color-absent: var(--white);
            --color-correct-high-contrast: var(--orange);
            --modal-content-bg: var(--color-tone-7)
        }

        /*# sourceMappingURL=62.9d339ad0d09ddf80c92e.css.map*/

    </style>`;
  // htmlStyle* bl* cl*
  const htmlAfterStyle = `
</head>
<body>

<body class="${config.isDarkThemeEnabled ? "dark" : ""} ${
    config.isHighContrastThemeEnabled ? "colorblind" : ""
  }">
<div>
  <div class="MomentSystem-module_moment__G9hyw">
    <div class="App-module_gameContainer__K_CBh" data-testid="game-wrapper" style="height: calc(100% - 210px);">
      <main class="App-module_game__yruqo" id="wordle-app-game">
        <div class="Board-module_boardContainer__TBHNL" style="overflow: unset;">`;

  const defaultPinyinsHtml = `                    <div grid="~ cols-2 gap-3" h-min="">
                        <div class="">b</div>
                        <div class="">p</div>
                        <div class="">m</div>
                        <div class="">f</div>
                        <div class="">d</div>
                        <div class="">t</div>
                        <div class="">n</div>
                        <div class="">l</div>
                        <div class="">g</div>
                        <div class="">k</div>
                        <div class="">h</div>
                        <div class="">j</div>
                        <div class="">q</div>
                        <div class="">r</div>
                        <div class="">x</div>
                        <div class="">w</div>
                        <div class="">y</div>
                        <div class="">zh</div>
                        <div class="">ch</div>
                        <div class="">sh</div>
                        <div class="">z</div>
                        <div class="">c</div>
                        <div class="">s</div>
                    </div>
                    <div grid="~ cols-3 gap-3" h-min="">
                        <div class="">a</div>
                        <div class="">ai</div>
                        <div class="">an</div>
                        <div class="">ang</div>
                        <div class="">ao</div>
                        <div class="">e</div>
                        <div class="">ei</div>
                        <div class="">en</div>
                        <div class="">eng</div>
                        <div class="">er</div>
                        <div class="">i</div>
                        <div class="">ia</div>
                        <div class="">ian</div>
                        <div class="">iang</div>
                        <div class="">iao</div>
                        <div class="">ie</div>
                        <div class="">in</div>
                        <div class="">ing</div>
                        <div class="">io</div>
                        <div class="">iong</div>
                        <div class="">iu</div>
                        <div class="">o</div>
                        <div class="">ong</div>
                        <div class="">ou</div>
                        <div class="">u</div>
                        <div class="">ua</div>
                        <div class="">uai</div>
                        <div class="">uan</div>
                        <div class="">uang</div>
                        <div class="">ui</div>
                        <div class="">un</div>
                        <div class="">uo</div>
                        <div class="">ü</div>
                        <div class="">üan</div>
                        <div class="">üe</div>
                        <div class="">ün</div>
                    </div>`;
  // apply
}
