import {Context, h, noop, RuntimeError, Schema} from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import {} from 'koishi-plugin-monetary'
import {} from 'koishi-plugin-markdown-to-image-service'
import {load} from "cheerio";
import * as path from 'path';
import * as fs from 'fs';

import {
  Ot as compareStrokes,
} from './assets/词影/main.js';

export const inject = {
  required: ['monetary', 'database', 'puppeteer'],
  optional: ['markdownToImage'],
}
export const name = 'wordle-game'
export const usage = `## 使用

1. 启用 \`monetary\`，\`database\` 和 \`puppeteer\` 服务。
2. 设置指令别名。
3. 输入 \`wordleGame.开始\` 指令引导游戏模式。
4. 输入猜测词。

## 注意事项

- 输入成语出现未知错误时，可前往 \`data/wordleGame/idioms.json\` 文件中搜索该成语，查看是否存在拼音的错误。

## 特性

- 词影有细分模式的排行榜，可自行使用 \`help\` 探索。
- 可自行在 \`idioms.json\` 中添加成语，例如“原神启动”，注意格式即可（注意：JSON 格式最后一项不需要逗号）。

## 关键指令

- \`wordleGame.开始 [待猜词的长度]\`
  - 开始游戏引导。

- \`wordleGame.开始.经典/CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle/Numberle/Math/汉兜/词影 [待猜词的长度]\`
  - 经典模式和汉兜模式，输加入指令可投入货币，赢了有奖励。
    - \`--hard\`
      - 困难模式，绿色线索必须保特固定，黄色线索必须重复使用。在词影模式下，将提高匹配难度。
    - \`--uhard\`
      - 超困难模式，在困难模式的基础上，黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。
    - \`--absurd\`
      - 在这种模式下，你将面对一个极具挑战性的对手。
      - 荒谬/变态模式，AI 将尽量避免给出答案。
      - 每次猜测时都会尽可能少地透露信息，甚至可能更换秘密词。
      - [如何玩？](https://qntm.org/absurdle)
    - \`--challenge\`
      - 仅建议高级玩家尝试。
      - 荒谬/变态挑战模式，要求你从一个给定的目标词出发，通过某种方式使其变成秘密词。
      - [如何玩？](https://qntm.org/challenge)
    - \`--wordles <多开的数量>\`
      - 同时猜测多个，默认范围为 1 ~ 4。可自行配置。
    - \`--free\`
      - 汉兜&词影的自由模式，任意四字词语都可作为猜测词。
    - \`--all\`
      - 汉兜&词影的全成语模式。开启时，词语数量为 29766+ 个（含生僻字，极难）；关闭时，为 7208 个常用成语（义务教育）。
    - 可同时启用困难模式和变态模式。

- \`wordleGame.猜 [inputWord:text]\` - 猜单词|成语|...，参数为输入的词。
  - \`-r\`
    - 随机猜测一次。

## QQ 群

- 956758505
`

// pz* pzx*
export interface Config {
  isDarkThemeEnabled: boolean
  isHighContrastThemeEnabled: boolean
  // shouldAddBorderInHandleMode: boolean

  defaultMaxLeaderboardEntries: number
  defaultWordLengthForGuessing: number
  maxInvestmentCurrency: number
  defaultRewardMultiplier: number
  maxSimultaneousGuesses: number
  compositeImagePageWidth: number
  compositeImagePageHeight: number

  allowNonPlayersToGuess: boolean
  enableWordGuessMiddleware: boolean
  shouldPromptWordLengthInput: boolean
  isPreventUserDuplicateGuessInput: boolean
  shouldPromptForWordLengthOnNonClassicStart: boolean

  enableWordGuessTimeLimit: boolean
  wordGuessTimeLimitInSeconds: number

  retractDelay: number
  imageType: "png" | "jpeg" | "webp"
  isTextToImageConversionEnabled: boolean
  isEnableQQOfficialRobotMarkdownTemplate: boolean
  customTemplateId: string
  key: string
  numberOfMessageButtonsPerRow: number
  isUsingUnifiedKoishiBuiltInUsername: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isDarkThemeEnabled: Schema.boolean().default(false).description(`是否开启黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean().default(false).description(`是否开启高对比度（色盲）主题。`),
    // shouldAddBorderInHandleMode: Schema.boolean().default(true).description(`是否为块添加边框，仅在汉兜模式下生效。`),
  }).description('主题设置'),

  Schema.object({
    compositeImagePageWidth: Schema.number().min(1).default(800).description(`合成图片页面宽度。`),
    compositeImagePageHeight: Schema.number().min(1).default(100).description(`合成图片页面高度。`),
    maxSimultaneousGuesses: Schema.number().min(1).default(4).description(`最多同时猜测单词的数量。`),
    maxInvestmentCurrency: Schema.number().min(0).default(50).description(`加入游戏时可投入的最大货币数额。`),
    defaultMaxLeaderboardEntries: Schema.number().min(0).default(10).description(`显示排行榜时默认的最大人数。`),
    defaultRewardMultiplier: Schema.number().min(0).default(2).description(`猜单词经典模式赢了之后奖励的货币倍率。`),
    defaultWordLengthForGuessing: Schema.number().min(1).default(5).description(`非经典游戏模式下，默认的猜单词长度。`),
  }).description('游戏设置'),

  Schema.intersect([
    Schema.object({
      enableWordGuessMiddleware: Schema.boolean().default(true).description(`是否开启猜单词指令无前缀的中间件。`),
      isPreventUserDuplicateGuessInput: Schema.boolean().default(true).description(`是否阻止用户重复输入相同的猜测词。`),
      shouldPromptWordLengthInput: Schema.boolean().default(true).description(`是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。`),
      allowNonPlayersToGuess: Schema.boolean().default(true).description(`是否允许未加入游戏的玩家进行猜单词的操作，开启后可以无需加入直接开始。`),
      shouldPromptForWordLengthOnNonClassicStart: Schema.boolean().default(true).description(`是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。`),
    }).description('游戏行为设置'),
    Schema.object({
      enableWordGuessTimeLimit: Schema.boolean().default(false).description(`是否开启猜单词游戏作答时间限制功能。`),
    }),
    Schema.union([
      Schema.object({
        enableWordGuessTimeLimit: Schema.const(true).required(),
        wordGuessTimeLimitInSeconds: Schema.number().min(0).default(120).description(`猜单词游戏作答时间，单位是秒。`),
      }),
      Schema.object({}),
    ]),
    Schema.object({
      retractDelay: Schema.number().min(0).default(0).description(`自动撤回等待的时间，单位是秒。值为 0 时不启用自动撤回功能。`),
      imageType: Schema.union(['png', 'jpeg', 'webp']).default('png').description(`发送的图片类型。`),
      isTextToImageConversionEnabled: Schema.boolean().default(false).description(`是否开启将文本转为图片的功能（可选），如需启用，需要启用 \`markdownToImage\` 服务。`),
      isEnableQQOfficialRobotMarkdownTemplate: Schema.boolean().default(false).description(`是否启用 QQ 官方机器人的 Markdown 模板，带消息按钮。`),
    }),
    Schema.union([
      Schema.object({
        isEnableQQOfficialRobotMarkdownTemplate: Schema.const(true).required(),
        customTemplateId: Schema.string().default('').description(`自定义模板 ID。`),
        key: Schema.string().default('').description(`文本内容中特定插值的 key，用于存放文本。如果你的插值为 {{.info}}，那么请在这里填 info。`),
        numberOfMessageButtonsPerRow: Schema.number().min(4).max(5).default(4).description(`每行消息按钮的数量。`),
        isUsingUnifiedKoishiBuiltInUsername: Schema.boolean().default(true).description(`是否使用统一的 Koishi 内置用户名。`),
      }),
      Schema.object({}),
    ]),
  ])
]) as any;

// smb*
declare module 'koishi' {
  interface Tables {
    wordle_game_records: GameRecord
    extra_wordle_game_records: ExtraGameRecord
    wordle_gaming_player_records: GamingPlayer
    wordle_player_records: PlayerRecord
    monetary: Monetary
  }
}

// jk*
interface Monetary {
  uid: number
  currency: string
  value: number
}

export interface GameRecord {
  id: number
  channelId: string
  isStarted: boolean
  gameMode: string
  wordGuessHtmlCache: string
  strokesHtmlCache: string[][]
  remainingGuessesCount: number
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  isRunning: boolean
  isHardMode: boolean
  isUltraHardMode: boolean
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  correctPinyinsWithIndex: string[]
  presentPinyins: string[]
  presentTones: string[]
  presentPinyinsWithIndex: string[]
  absentPinyins: string[]
  correctTonesWithIndex: string[]
  presentTonesWithIndex: string[]
  absentTones: string[]
  timestamp: string
  remainingWordsList: string[]
  isAbsurd: boolean
  isChallengeMode: boolean
  targetWord: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  pinyin: string
  isFreeMode: boolean
  previousGuess: string[]
  previousGuessIdioms: string[]
  guessHistory: string[]
}

export interface ExtraGameRecord {
  id: number
  channelId: string
  gameMode: string
  wordGuessHtmlCache: string
  strokesHtmlCache: string[][]
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  correctPinyinsWithIndex: string[]
  presentPinyinsWithIndex: string[]
  absentPinyins: string[]
  presentPinyins: string[]
  presentTones: string[]
  correctTonesWithIndex: string[]
  presentTonesWithIndex: string[]
  absentTones: string[]
  timestamp: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  remainingGuessesCount: number
  pinyin: string
  previousGuess: string[]
  previousGuessIdioms: string[]
}

export interface GamingPlayer {
  id: number
  channelId: string
  userId: string
  username: string
  money: number
}

export interface PlayerRecord {
  id: number
  userId: string
  username: string
  win: number
  lose: number
  moneyChange: number
  wordGuessCount: number
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
  '经典'?: WinLoseStats;
  'Lewdle'?: WinLoseStats;
  'CET4'?: WinLoseStats;
  'CET6'?: WinLoseStats;
  'GMAT'?: WinLoseStats;
  'GRE'?: WinLoseStats;
  'IELTS'?: WinLoseStats;
  'SAT'?: WinLoseStats;
  'TOEFL'?: WinLoseStats;
  '考研'?: WinLoseStats;
  '专八'?: WinLoseStats;
  '专四'?: WinLoseStats;
  'ALL'?: WinLoseStats;
  '汉兜'?: WinLoseStats;
  'Numberle'?: WinLoseStats;
  'Math'?: WinLoseStats;
  '词影'?: WinLoseStats;
}

interface WinLoseStats {
  win: number;
  lose: number;
}

interface ExtraCiyingRankInfo {
  successCountIn1HardMode: number
  successCountIn1Mode: number
  successCountIn2Mode: number
  successCountIn3Mode: number
  successCountIn4Mode: number

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
  "successCountIn1HardMode": 0,
  "successCountIn1Mode": 0,
  "successCountIn2Mode": 0,
  "successCountIn3Mode": 0,
  "successCountIn4Mode": 0,
  "winIn1HardMode": 0,
  "winIn1Mode": 0,
  "winIn2Mode": 0,
  "winIn3Mode": 0,
  "winIn4Mode": 0,
  "loseIn1HardMode": 0,
  "loseIn1Mode": 0,
  "loseIn2Mode": 0,
  "loseIn3Mode": 0,
  "loseIn4Mode": 0,
  "fastestGuessTimeIn1HardMode": 0,
  "fastestGuessTimeIn1Mode": 0,
  "fastestGuessTimeIn2Mode": 0,
  "fastestGuessTimeIn3Mode": 0,
  "fastestGuessTimeIn4Mode": 0
}

const initialStats: PlayerStats = {
  '经典': {win: 0, lose: 0},
  'Lewdle': {win: 0, lose: 0},
  'CET4': {win: 0, lose: 0},
  'CET6': {win: 0, lose: 0},
  'GMAT': {win: 0, lose: 0},
  'GRE': {win: 0, lose: 0},
  'IELTS': {win: 0, lose: 0},
  'SAT': {win: 0, lose: 0},
  'TOEFL': {win: 0, lose: 0},
  '考研': {win: 0, lose: 0},
  '专八': {win: 0, lose: 0},
  '专四': {win: 0, lose: 0},
  'ALL': {win: 0, lose: 0},
  'Numberle': {win: 0, lose: 0},
  'Math': {win: 0, lose: 0},
  '汉兜': {win: 0, lose: 0},
  '词影': {win: 0, lose: 0},
};

const initialFastestGuessTime: Record<string, number> = {
  '经典': 0,
  'Lewdle': 0,
  'CET4': 0,
  'CET6': 0,
  'GMAT': 0,
  'GRE': 0,
  'IELTS': 0,
  'SAT': 0,
  'TOEFL': 0,
  '考研': 0,
  '专八': 0,
  '专四': 0,
  'ALL': 0,
  '汉兜': 0,
  'Numberle': 0,
  'Math': 0,
  '词影': 0,
};

interface LetterState {
  letter: string;
  state: 'correct' | 'present' | 'absent' | 'undefined';
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
const badWordsList: string[] = ["BONER", "FELCH", "PUSSY", "TAINT", "SEMEN", "DILDO", "FARTS", "CHODE", "MINGE", "GONAD", "TWATS", "SPUNK", "QUEEF", "GAPED", "PRICK", "BUSSY", "SHART", "BALLS", "VULVA", "PORNO", "COOCH", "PONUT", "LOADS", "DADDY", "FROTS", "SKEET", "MILFS", "BOOTY", "QUIMS", "DICKS", "CUSSY", "BOOBS", "BONCH", "TWINK", "GROOL", "HORNY", "YIFFY", "THICC", "BULGE", "TITTY", "WANKS", "FUCKS", "HUSSY", "COCKS", "FANNY", "SHAFT", "TWERK", "PUBES", "GONZO", "HANDY", "NARDS", "RIMJOB", "ERECT", "SPANK", "SQUIRT", "CUNTS", "PRECUM", "SCREW", "EDGING", "GOATSE", "BOINK", "PUNANI", "ASSES", "PECKER", "HINEY", "WANKER", "GUMMY", "CUMRAG", "PEGGED", "LEWDS", "MOPED", "TEABAG", "SCROTE", "BEAVER", "NOOKIE", "CRABS", "FUCKED", "BUTTS", "GOOCH", "TAGNUT", "TRUMP", "COUGAR", "SHTUP", "TOOBIN", "KANCHO", "KINKY", "WILLY", "SYBIAN", "GLUCK", "BONED", "GOBBLE", "TRIBS", "BROJOB", "DOGGY", "DOCKS", "CHUBBY", "TOSSER", "SHAGS", "FISTED", "STIFFY", "NASTY", "CLIMAX", "JOBBY", "BONERS", "RAWDOG", "PLUMS", "RANDY", "CLUNGE", "FEMDOM", "ZADDY", "SMEGMA", "THROB", "MERKIN", "CLITS", "MOMMY", "TITJOB", "MOIST", "GAGGED", "GUSHER", "FLAPS", "TODGER", "YONIC", "FRICK", "PROBE", "GIRTH", "PERVY", "AROUSE", "AHEGAO", "FLEDGE", "HENTAI", "GROWER", "SIMBA", "MENAGE", "LENGTH", "DOMME", "DIDDLE", "SHOWER", "BOYTOY", "SMANG", "GILFS", "NYASH", "LIGMA", "FACIAL", "OPPAI", "ASSJOB", "LUBED", "PAYPIG", "SPAFF", "PENGUS", "RIMBOW", "CUMPT", "FROMBE", "MILKER", "HIMBO", "FAPPY", "CUCKED", "HOOHA", "REAMED", "TOEJOB", "BEMHO", "BOOFED", "SEXILE", "GOOSE", "BANGED", "NORKS", "CHONES", "GLANS", "GLORP", "EPEEN", "JELQS", "CRANK", "ASSMAN", "SPURT", "BLOWIE", "ECCHI", "DICKED", "COOZE", "BEWBS", "BONKED", "BUGGER", "CUMWAD", "HANDY", "PORNO", "DILDO", "FELCH", "WANKS", "LOADS", "BOOBS", "QUIMS", "TITTY", "MILFS", "TWATS", "SCREW", "BUSSY", "DADDY", "BULGE", "BONER", "COOCH", "CUNTS", "FANNY", "TAINT", "SPUNK", "GONAD", "CUMRAG", "RIMJOB", "SHAFT", "SEMEN", "SCROTE", "TWERK", "HINEY", "SKEET", "CUSSY", "FROTS", "BONCH", "BOOTY", "BUTTS", "TAGNUT", "GAPED", "TOOBIN", "SYBIAN", "DICKS", "KINKY", "NARDS", "BONED", "DOGGY", "PUSSY", "WANKER", "PEGGED", "DOCKS", "KANCHO", "PONUT", "CHODE", "FUCKED", "THICC", "CRABS", "JOBBY", "TEABAG", "STIFFY", "EDGING", "COUGAR", "BALLS", "RAWDOG", "SMEGMA", "SQUIRT", "NASTY", "HUSSY", "FEMDOM", "PECKER", "TENTED", "SPLOSH", "BLUMPY", "CUMET", "SUCKLE", "SEXTS", "SUGMA", "SCROG", "BRAIN", "HOOKUP", "HICKEY", "AHOLE", "ANALLY", "COOMER", "ENEMA", "BARSE", "BOOBA", "CLUSSY", "HUMMER", "BEZOS", "CANING", "CHOKER", "BENWA", "CUMJAR", "DUMPER", "FIGGED", "GOONER", "INCEST", "SNUSNU", "SOUND", "ASSHAT", "BUNDA", "BREED", "CAGING", "MOIST", "FACIAL", "MOPED", "SHTUP", "GUMMY", "GOOCH", "LEWDS", "COCKS", "ASSES", "ZADDY", "MINGE", "LENGTH", "BOYTOY", "SEXILE", "PRECUM", "SHART", "PENGUS", "GOBBLE", "LUBED", "SMANG", "GUSHER", "CUMPT", "GONZO", "MERKIN", "JELQS", "TRIBS", "PERVY", "PROBE", "PUBES", "NORKS", "BUGGER", "SIMBA", "CUMWAD", "PRICK", "FISTED", "YONIC", "AROUSE", "BOOBS", "GAGGED", "YIFFY", "CLIMAX", "CRANK", "SPANK", "MILKER", "RANDY", "SHAGS", "GOOSE", "TOSSER", "SCREW", "LOADS", "CHONES", "RIMBOW", "BULGE", "BEWBS", "TITTY", "CLUNGE", "OPPAI", "HANDY", "EPEEN", "MILFS", "GILFS", "PAYPIG", "PUNANI", "SPAFF", "TWERK", "FAPPY", "CUNTS", "GAPED", "BLOWIE", "BOOTY", "CUMRAG", "TOOBIN", "DICKED", "FROMBE", "COOZE", "NARDS", "BONERS", "FUCKS", "TAGNUT", "PLUMS", "GONAD", "AHEGAO", "SYBIAN", "FUCKED", "GOATSE", "TWINK", "HOOHA", "CLITS", "COUGAR", "ERECT", "BONED", "SEMEN", "TWATS", "TITJOB", "CRABS", "THROB", "MOMMY", "VULVA", "DILDO", "PORNO", "KINKY", "SMEGMA", "NASTY", "TOEJOB", "LIGMA", "SPURT", "BEMHO", "TODGER", "FEMDOM", "EDGING", "NOOKIE", "KANCHO", "FLAPS", "TRUMP", "GROOL", "JOBBY", "BUSSY", "HICKEY", "BEZOS", "PUSSY", "BUTTS", "SCROG", "FELCH", "DUMPER", "REAMED", "HIMBO", "FIGGED", "ASSJOB", "CHUBBY", "BROJOB", "SPLOSH", "NYASH", "SHOWER", "FRICK", "TAINT", "BOOFED", "CHODE", "SEXTS", "BLUMPY", "FROTS", "SQUIRT", "LEWDS", "WANKS", "COOMER", "BREED", "CHOKER", "WANKER", "GLANS", "HUSSY", "BOINK", "BALLS", "HORNY", "QUIMS", "COOCH", "WILLY", "SPUNK", "BARSE", "BONKED", "DADDY", "MOPED", "FLEDGE", "PROBE", "SHAFT", "SCROTE", "PUBES", "HINEY", "CUMET", "BONCH", "BENWA", "SUCKLE", "ECCHI", "TENTED", "GUSHER", "FISTED", "BUNDA", "CUCKED", "MILKER", "SOUND", "SIMBA", "DIDDLE", "CAGING", "PRECUM", "YONIC", "CUSSY", "TEABAG", "BEWBS", "SPANK", "PEGGED", "FANNY", "RIMBOW", "GIRTH", "RAWDOG", "TRIBS", "INCEST", "HUMMER", "TWERK", "DOCKS", "YIFFY", "MERKIN", "CUMJAR", "ANALLY", "AHOLE", "SHTUP", "TOSSER", "FROMBE", "LOADS", "ASSES", "BEAVER", "DOMME", "BOOBA", "DICKED", "CUMPT", "CUMWAD", "ZADDY", "LUBED", "GONZO", "GAPED", "CUNTS", "RIMJOB", "PECKER", "GOOCH", "FARTS", "COUGAR", "DOGGY", "PLUMS", "PENGUS", "ENEMA", "BLOWIE", "FUCKED", "CLUNGE", "TOOBIN", "CUMRAG", "SHAGS", "OPPAI", "GLORP", "GOBBLE", "MINGE", "TAGNUT", "MOIST", "CLUSSY", "COOZE", "EPEEN", "STIFFY", "PUNANI", "TITJOB", "GUMMY", "HOOHA", "TODGER", "RANDY", "VULVA", "PORNO", "CLITS", "SMANG", "GILFS", "THROB", "FACIAL", "FAPPY", "BUGGER", "GROWER", "NOOKIE", "DILDO", "BOOTY", "FUCKS", "NORKS", "SEMEN", "CLIMAX", "FIGGED", "JELQS", "PRICK", "SUGMA", "ASSHAT", "FLAPS", "SQUIRT", "BRAIN", "EDGING", "GAGGED", "BULGE", "DICKS", "GOONER", "BANGED", "BOINK", "GOOSE", "BUTTS", "COOMER", "CANING", "SMEGMA", "GROOL", "KANCHO", "SEXILE", "NYASH", "TRUMP", "TWINK", "WILLY", "BLUMPY", "BOOBS", "FRICK", "HICKEY", "PUSSY", "SHART", "GOATSE", "HIMBO", "BONER", "LEWDS", "GLANS", "TOEJOB", "BEMHO", "HORNY", "ECCHI", "WANKER", "BARSE", "GUSHER", "FROTS", "CHOKER", "SOUND", "BREED", "QUIMS", "FEMDOM", "BENWA", "PUBES", "CAGING", "SUCKLE", "HINEY", "BONKED", "ERECT", "BONERS", "SHAFT", "SEXTS", "HENTAI", "PEGGED", "CRABS", "ASSJOB", "GIRTH", "TENTED", "BUSSY", "LIGMA", "ASSMAN", "MERKIN", "BROJOB", "NARDS", "PAYPIG", "SCROTE", "INCEST", "COCKS", "SPURT", "FELCH", "TRIBS", "TITTY", "CUMWAD", "PONUT", "MILKER", "BOOFED", "REAMED", "HUMMER", "MOPED", "MENAGE", "BEZOS", "DOGGY", "SPLOSH", "RIMJOB", "TWERK", "TAINT", "CLUNGE", "AHOLE", "DIDDLE", "ENEMA", "QUEEF", "WANKS", "HANDY", "SHAGS", "SNUSNU", "KINKY", "AHEGAO", "ASSES", "CUMJAR", "YIFFY", "GOOCH", "FLEDGE", "HOOKUP", "GOBBLE", "GUMMY", "OPPAI", "BEAVER", "CUMRAG", "GLUCK", "SIMBA", "FANNY", "PENGUS", "EPEEN", "BUGGER", "COUGAR", "CUMPT", "SKEET", "DOCKS", "MILFS", "FARTS", "BONCH", "THROB", "BLOWIE", "PERVY", "HUSSY", "HOOHA", "SEMEN", "MOMMY", "CLUSSY", "SCREW", "AROUSE", "CHONES", "FISTED", "THICC", "SYBIAN", "VULVA", "PECKER", "DADDY", "BOYTOY", "JOBBY", "SQUIRT", "ANALLY", "ZADDY", "BOOTY", "SHTUP", "DOMME", "TOOBIN", "CUNTS", "BOOBA", "SEXILE", "BOOBS", "TWATS", "CUSSY", "CANING", "STIFFY", "SHOWER", "NYASH", "NORKS", "RIMBOW", "COOCH", "TOSSER", "FLAPS", "SCROG", "BRAIN", "GILFS", "FRICK", "TODGER", "GONZO", "FUCKS", "CLIMAX", "LOADS", "BEMHO", "PUSSY", "PRECUM", "CHODE", "COOMER", "BUNDA", "HIMBO", "GOONER", "SPUNK", "KANCHO", "FROTS", "HINEY", "BARSE", "BONERS", "LENGTH", "BOINK", "PROBE", "SHAFT", "SUCKLE", "SUGMA", "WILLY", "BULGE", "ASSHAT", "GAGGED", "JELQS", "SMEGMA", "TRUMP", "SOUND", "BONKED", "SPURT", "TITJOB", "CAGING", "RANDY", "PUBES", "COOZE", "NOOKIE", "HORNY", "ERECT", "CRABS", "LUBED", "SMANG", "ASSJOB", "BLUMPY", "DICKS", "SPAFF", "BUTTS", "MENAGE", "GAPED", "PLUMS", "LIGMA", "PEGGED", "HENTAI", "TWINK", "BROJOB", "WANKS", "PUNANI", "GOOSE", "DUMPER", "FEMDOM", "NARDS", "FIGGED", "CUMET", "DILDO", "TEABAG", "EDGING", "AHOLE", "RAWDOG", "INCEST", "PORNO", "ASSES", "GROOL", "CUMWAD", "DICKED", "HOOKUP", "GOOCH", "TAGNUT", "LEWDS", "GUSHER", "GLANS", "BUGGER", "PAYPIG", "FUCKED", "CHOKER", "OPPAI", "SCROTE", "CUCKED", "TRIBS", "TENTED", "SPANK", "EPEEN", "AROUSE", "BONER", "QUEEF", "NASTY", "TITTY", "YIFFY", "GOATSE", "AHEGAO", "TWERK", "GUMMY", "DOGGY", "MILFS", "FISTED", "CLITS", "FAPPY", "KINKY", "JOBBY", "VULVA", "THICC", "MERKIN", "BUSSY", "DIDDLE", "MILKER", "GLORP", "FACIAL", "FROMBE", "SHAGS", "BONCH", "SPLOSH", "COCKS", "DOCKS", "GONAD", "GROWER", "COOCH", "SHOWER", "SIMBA", "PENGUS", "QUIMS", "RIMJOB", "TOOBIN", "BOOBA", "FARTS", "BONED", "CHUBBY", "SQUIRT", "SKEET", "GONZO", "SHART", "HUSSY", "THROB", "TAINT", "MOPED", "LOADS", "CRANK", "BEZOS", "DADDY", "CUMJAR", "SYBIAN", "NYASH", "SCREW", "BENWA", "CLIMAX", "HIMBO", "BONERS", "FLEDGE", "FUCKS", "BULGE", "SPUNK", "PECKER", "ASSHAT", "BOYTOY", "TITJOB", "WANKER", "JELQS", "SPURT", "BOINK", "SOUND", "FANNY", "LENGTH", "STIFFY", "MINGE", "FRICK", "BEAVER", "SMEGMA", "YONIC", "CHONES", "CUMRAG", "CLUSSY", "NORKS", "LUBED", "CUSSY", "ZADDY", "PUSSY", "TWATS", "PLUMS", "DICKS", "SEXILE", "CRABS", "COUGAR", "BREED", "HORNY", "GOBBLE", "HUMMER", "ERECT", "CHODE", "HINEY", "BARSE", "DILDO", "GOOSE", "WANKS", "COOMER", "BRAIN", "HICKEY", "SMANG", "CAGING", "AHOLE", "BALLS", "BUTTS", "ASSES", "NARDS", "SEMEN", "FIGGED", "TWINK", "SEXTS", "FELCH", "PORNO", "RIMBOW", "PROBE", "LIGMA", "PUNANI", "ASSJOB", "GOOCH", "REAMED", "PRICK", "PRECUM", "DUMPER", "TOSSER", "HOOHA", "QUEEF", "GROOL", "RANDY", "GIRTH", "SCROG", "GUSHER", "BONKED", "LEWDS", "PUBES", "TAGNUT", "FAPPY", "TRUMP", "SHTUP", "KINKY", "CLUNGE", "DIDDLE", "CLITS", "MILFS", "OPPAI", "SHAGS", "SPAFF", "BLUMPY", "BEMHO", "AROUSE", "ANALLY", "GROWER", "DICKED", "GLORP", "DOMME", "TWERK", "FLAPS", "BROJOB", "CUCKED", "BUNDA", "CUMET", "EDGING", "DOGGY", "SQUIRT", "RIMJOB", "HENTAI", "INCEST", "SUCKLE", "YIFFY", "BOOFED"];
const lowerCaseWordArray: string[] = ["aback", "abase", "abate", "abbey", "abbot", "abhor", "abide", "abled", "abode", "abort", "about", "above", "abuse", "abyss", "acorn", "acrid", "actor", "acute", "adage", "adapt", "adept", "admin", "admit", "adobe", "adopt", "adore", "adorn", "adult", "affix", "afire", "afoot", "afoul", "after", "again", "agape", "agate", "agent", "agile", "aging", "aglow", "agony", "agora", "agree", "ahead", "aider", "aisle", "alarm", "album", "alert", "algae", "alibi", "alien", "align", "alike", "alive", "allay", "alley", "allot", "allow", "alloy", "aloft", "alone", "along", "aloof", "aloud", "alpha", "altar", "alter", "amass", "amaze", "amber", "amble", "amend", "amiss", "amity", "among", "ample", "amply", "amuse", "angel", "anger", "angle", "angry", "angst", "anime", "ankle", "annex", "annoy", "annul", "anode", "antic", "anvil", "aorta", "apart", "aphid", "aping", "apnea", "apple", "apply", "apron", "aptly", "arbor", "ardor", "arena", "argue", "arise", "armor", "aroma", "arose", "array", "arrow", "arson", "artsy", "ascot", "ashen", "aside", "askew", "assay", "asset", "atoll", "atone", "attic", "audio", "audit", "augur", "aunty", "avail", "avert", "avian", "avoid", "await", "awake", "award", "aware", "awash", "awful", "awoke", "axial", "axiom", "axion", "azure", "bacon", "badge", "badly", "bagel", "baggy", "baker", "baler", "balmy", "banal", "banjo", "barge", "baron", "basal", "basic", "basil", "basin", "basis", "baste", "batch", "bathe", "baton", "batty", "bawdy", "bayou", "beach", "beady", "beard", "beast", "beech", "beefy", "befit", "began", "begat", "beget", "begin", "begun", "being", "belch", "belie", "belle", "belly", "below", "bench", "beret", "berry", "berth", "beset", "betel", "bevel", "bezel", "bible", "bicep", "biddy", "bigot", "bilge", "billy", "binge", "bingo", "biome", "birch", "birth", "bison", "bitty", "black", "blade", "blame", "bland", "blank", "blare", "blast", "blaze", "bleak", "bleat", "bleed", "bleep", "blend", "bless", "blimp", "blind", "blink", "bliss", "blitz", "bloat", "block", "bloke", "blond", "blood", "bloom", "blown", "bluer", "bluff", "blunt", "blurb", "blurt", "blush", "board", "boast", "bobby", "boney", "bongo", "bonus", "booby", "boost", "booth", "booty", "booze", "boozy", "borax", "borne", "bosom", "bossy", "botch", "bough", "boule", "bound", "bowel", "boxer", "brace", "braid", "brain", "brake", "brand", "brash", "brass", "brave", "bravo", "brawl", "brawn", "bread", "break", "breed", "briar", "bribe", "brick", "bride", "brief", "brine", "bring", "brink", "briny", "brisk", "broad", "broil", "broke", "brood", "brook", "broom", "broth", "brown", "brunt", "brush", "brute", "buddy", "budge", "buggy", "bugle", "build", "built", "bulge", "bulky", "bully", "bunch", "bunny", "burly", "burnt", "burst", "bused", "bushy", "butch", "butte", "buxom", "buyer", "bylaw", "cabal", "cabby", "cabin", "cable", "cacao", "cache", "cacti", "caddy", "cadet", "cagey", "cairn", "camel", "cameo", "canal", "candy", "canny", "canoe", "canon", "caper", "caput", "carat", "cargo", "carol", "carry", "carve", "caste", "catch", "cater", "catty", "caulk", "cause", "cavil", "cease", "cedar", "cello", "chafe", "chaff", "chain", "chair", "chalk", "champ", "chant", "chaos", "chard", "charm", "chart", "chase", "chasm", "cheap", "cheat", "check", "cheek", "cheer", "chess", "chest", "chick", "chide", "chief", "child", "chili", "chill", "chime", "china", "chirp", "chock", "choir", "choke", "chord", "chore", "chose", "chuck", "chump", "chunk", "churn", "chute", "cider", "cigar", "cinch", "circa", "civic", "civil", "clack", "claim", "clamp", "clang", "clank", "clash", "clasp", "class", "clean", "clear", "cleat", "cleft", "clerk", "click", "cliff", "climb", "cling", "clink", "cloak", "clock", "clone", "close", "cloth", "cloud", "clout", "clove", "clown", "cluck", "clued", "clump", "clung", "coach", "coast", "cobra", "cocoa", "colon", "color", "comet", "comfy", "comic", "comma", "conch", "condo", "conic", "copse", "coral", "corer", "corny", "couch", "cough", "could", "count", "coupe", "court", "coven", "cover", "covet", "covey", "cower", "coyly", "crack", "craft", "cramp", "crane", "crank", "crash", "crass", "crate", "crave", "crawl", "craze", "crazy", "creak", "cream", "credo", "creed", "creek", "creep", "creme", "crepe", "crept", "cress", "crest", "crick", "cried", "crier", "crime", "crimp", "crisp", "croak", "crock", "crone", "crony", "crook", "cross", "croup", "crowd", "crown", "crude", "cruel", "crumb", "crump", "crush", "crust", "crypt", "cubic", "cumin", "curio", "curly", "curry", "curse", "curve", "curvy", "cutie", "cyber", "cycle", "cynic", "daddy", "daily", "dairy", "daisy", "dally", "dance", "dandy", "datum", "daunt", "dealt", "death", "debar", "debit", "debug", "debut", "decal", "decay", "decor", "decoy", "decry", "defer", "deign", "deity", "delay", "delta", "delve", "demon", "demur", "denim", "dense", "depot", "depth", "derby", "deter", "detox", "deuce", "devil", "diary", "dicey", "digit", "dilly", "dimly", "diner", "dingo", "dingy", "diode", "dirge", "dirty", "disco", "ditch", "ditto", "ditty", "diver", "dizzy", "dodge", "dodgy", "dogma", "doing", "dolly", "donor", "donut", "dopey", "doubt", "dough", "dowdy", "dowel", "downy", "dowry", "dozen", "draft", "drain", "drake", "drama", "drank", "drape", "drawl", "drawn", "dread", "dream", "dress", "dried", "drier", "drift", "drill", "drink", "drive", "droit", "droll", "drone", "drool", "droop", "dross", "drove", "drown", "druid", "drunk", "dryer", "dryly", "duchy", "dully", "dummy", "dumpy", "dunce", "dusky", "dusty", "dutch", "duvet", "dwarf", "dwell", "dwelt", "dying", "eager", "eagle", "early", "earth", "easel", "eaten", "eater", "ebony", "eclat", "edict", "edify", "eerie", "egret", "eight", "eject", "eking", "elate", "elbow", "elder", "elect", "elegy", "elfin", "elide", "elite", "elope", "elude", "email", "embed", "ember", "emcee", "empty", "enact", "endow", "enema", "enemy", "enjoy", "ennui", "ensue", "enter", "entry", "envoy", "epoch", "epoxy", "equal", "equip", "erase", "erect", "erode", "error", "erupt", "essay", "ester", "ether", "ethic", "ethos", "etude", "evade", "event", "every", "evict", "evoke", "exact", "exalt", "excel", "exert", "exile", "exist", "expel", "extol", "extra", "exult", "eying", "fable", "facet", "faint", "fairy", "faith", "false", "fancy", "fanny", "farce", "fatal", "fatty", "fault", "fauna", "favor", "feast", "fecal", "feign", "fella", "felon", "femme", "femur", "fence", "feral", "ferry", "fetal", "fetch", "fetid", "fetus", "fever", "fewer", "fiber", "fibre", "ficus", "field", "fiend", "fiery", "fifth", "fifty", "fight", "filer", "filet", "filly", "filmy", "filth", "final", "finch", "finer", "first", "fishy", "fixer", "fizzy", "fjord", "flack", "flail", "flair", "flake", "flaky", "flame", "flank", "flare", "flash", "flask", "fleck", "fleet", "flesh", "flick", "flier", "fling", "flint", "flirt", "float", "flock", "flood", "floor", "flora", "floss", "flour", "flout", "flown", "fluff", "fluid", "fluke", "flume", "flung", "flunk", "flush", "flute", "flyer", "foamy", "focal", "focus", "foggy", "foist", "folio", "folly", "foray", "force", "forge", "forgo", "forte", "forth", "forty", "forum", "found", "foyer", "frail", "frame", "frank", "fraud", "freak", "freed", "freer", "fresh", "friar", "fried", "frill", "frisk", "fritz", "frock", "frond", "front", "frost", "froth", "frown", "froze", "fruit", "fudge", "fugue", "fully", "fungi", "funky", "funny", "furor", "furry", "fussy", "fuzzy", "gaffe", "gaily", "gamer", "gamma", "gamut", "gassy", "gaudy", "gauge", "gaunt", "gauze", "gavel", "gawky", "gayer", "gayly", "gazer", "gecko", "geeky", "geese", "genie", "genre", "ghost", "ghoul", "giant", "giddy", "gipsy", "girly", "girth", "given", "giver", "glade", "gland", "glare", "glass", "glaze", "gleam", "glean", "glide", "glint", "gloat", "globe", "gloom", "glory", "gloss", "glove", "glyph", "gnash", "gnome", "godly", "going", "golem", "golly", "gonad", "goner", "goody", "gooey", "goofy", "goose", "gorge", "gouge", "gourd", "grace", "grade", "graft", "grail", "grain", "grand", "grant", "grape", "graph", "grasp", "grass", "grate", "grave", "gravy", "graze", "great", "greed", "green", "greet", "grief", "grill", "grime", "grimy", "grind", "gripe", "groan", "groin", "groom", "grope", "gross", "group", "grout", "grove", "growl", "grown", "gruel", "gruff", "grunt", "guard", "guava", "guess", "guest", "guide", "guild", "guile", "guilt", "guise", "gulch", "gully", "gumbo", "gummy", "guppy", "gusto", "gusty", "gypsy", "habit", "hairy", "halve", "handy", "happy", "hardy", "harem", "harpy", "harry", "harsh", "haste", "hasty", "hatch", "hater", "haunt", "haute", "haven", "havoc", "hazel", "heady", "heard", "heart", "heath", "heave", "heavy", "hedge", "hefty", "heist", "helix", "hello", "hence", "heron", "hilly", "hinge", "hippo", "hippy", "hitch", "hoard", "hobby", "hoist", "holly", "homer", "honey", "honor", "horde", "horny", "horse", "hotel", "hotly", "hound", "house", "hovel", "hover", "howdy", "human", "humid", "humor", "humph", "humus", "hunch", "hunky", "hurry", "husky", "hussy", "hutch", "hydro", "hyena", "hymen", "hyper", "icily", "icing", "ideal", "idiom", "idiot", "idler", "idyll", "igloo", "iliac", "image", "imbue", "impel", "imply", "inane", "inbox", "incur", "index", "inept", "inert", "infer", "ingot", "inlay", "inlet", "inner", "input", "inter", "intro", "ionic", "irate", "irony", "islet", "issue", "itchy", "ivory", "jaunt", "jazzy", "jelly", "jerky", "jetty", "jewel", "jiffy", "joint", "joist", "joker", "jolly", "joust", "judge", "juice", "juicy", "jumbo", "jumpy", "junta", "junto", "juror", "kappa", "karma", "kayak", "kebab", "khaki", "kinky", "kiosk", "kitty", "knack", "knave", "knead", "kneed", "kneel", "knelt", "knife", "knock", "knoll", "known", "koala", "krill", "label", "labor", "laden", "ladle", "lager", "lance", "lanky", "lapel", "lapse", "large", "larva", "lasso", "latch", "later", "lathe", "latte", "laugh", "layer", "leach", "leafy", "leaky", "leant", "leapt", "learn", "lease", "leash", "least", "leave", "ledge", "leech", "leery", "lefty", "legal", "leggy", "lemon", "lemur", "leper", "level", "lever", "libel", "liege", "light", "liken", "lilac", "limbo", "limit", "linen", "liner", "lingo", "lipid", "lithe", "liver", "livid", "llama", "loamy", "loath", "lobby", "local", "locus", "lodge", "lofty", "logic", "login", "loopy", "loose", "lorry", "loser", "louse", "lousy", "lover", "lower", "lowly", "loyal", "lucid", "lucky", "lumen", "lumpy", "lunar", "lunch", "lunge", "lupus", "lurch", "lurid", "lusty", "lying", "lymph", "lynch", "lyric", "macaw", "macho", "macro", "madam", "madly", "mafia", "magic", "magma", "maize", "major", "maker", "mambo", "mamma", "mammy", "manga", "mange", "mango", "mangy", "mania", "manic", "manly", "manor", "maple", "march", "marry", "marsh", "mason", "masse", "match", "matey", "mauve", "maxim", "maybe", "mayor", "mealy", "meant", "meaty", "mecca", "medal", "media", "medic", "melee", "melon", "mercy", "merge", "merit", "merry", "metal", "meter", "metro", "micro", "midge", "midst", "might", "milky", "mimic", "mince", "miner", "minim", "minor", "minty", "minus", "mirth", "miser", "missy", "mocha", "modal", "model", "modem", "mogul", "moist", "molar", "moldy", "money", "month", "moody", "moose", "moral", "moron", "morph", "mossy", "motel", "motif", "motor", "motto", "moult", "mound", "mount", "mourn", "mouse", "mouth", "mover", "movie", "mower", "mucky", "mucus", "muddy", "mulch", "mummy", "munch", "mural", "murky", "mushy", "music", "musky", "musty", "myrrh", "nadir", "naive", "nanny", "nasal", "nasty", "natal", "naval", "navel", "needy", "neigh", "nerdy", "nerve", "never", "newer", "newly", "nicer", "niche", "niece", "night", "ninja", "ninny", "ninth", "noble", "nobly", "noise", "noisy", "nomad", "noose", "north", "nosey", "notch", "novel", "nudge", "nurse", "nutty", "nylon", "nymph", "oaken", "obese", "occur", "ocean", "octal", "octet", "odder", "oddly", "offal", "offer", "often", "olden", "older", "olive", "ombre", "omega", "onion", "onset", "opera", "opine", "opium", "optic", "orbit", "order", "organ", "other", "otter", "ought", "ounce", "outdo", "outer", "outgo", "ovary", "ovate", "overt", "ovine", "ovoid", "owing", "owner", "oxide", "ozone", "paddy", "pagan", "paint", "paler", "palsy", "panel", "panic", "pansy", "papal", "paper", "parer", "parka", "parry", "parse", "party", "pasta", "paste", "pasty", "patch", "patio", "patsy", "patty", "pause", "payee", "payer", "peace", "peach", "pearl", "pecan", "pedal", "penal", "pence", "penne", "penny", "perch", "peril", "perky", "pesky", "pesto", "petal", "petty", "phase", "phone", "phony", "photo", "piano", "picky", "piece", "piety", "piggy", "pilot", "pinch", "piney", "pinky", "pinto", "piper", "pique", "pitch", "pithy", "pivot", "pixel", "pixie", "pizza", "place", "plaid", "plain", "plait", "plane", "plank", "plant", "plate", "plaza", "plead", "pleat", "plied", "plier", "pluck", "plumb", "plume", "plump", "plunk", "plush", "poesy", "point", "poise", "poker", "polar", "polka", "polyp", "pooch", "poppy", "porch", "poser", "posit", "posse", "pouch", "pound", "pouty", "power", "prank", "prawn", "preen", "press", "price", "prick", "pride", "pried", "prime", "primo", "print", "prior", "prism", "privy", "prize", "probe", "prone", "prong", "proof", "prose", "proud", "prove", "prowl", "proxy", "prude", "prune", "psalm", "pubic", "pudgy", "puffy", "pulpy", "pulse", "punch", "pupal", "pupil", "puppy", "puree", "purer", "purge", "purse", "pushy", "putty", "pygmy", "quack", "quail", "quake", "qualm", "quark", "quart", "quash", "quasi", "queen", "queer", "quell", "query", "quest", "queue", "quick", "quiet", "quill", "quilt", "quirk", "quite", "quota", "quote", "quoth", "rabbi", "rabid", "racer", "radar", "radii", "radio", "rainy", "raise", "rajah", "rally", "ralph", "ramen", "ranch", "randy", "range", "rapid", "rarer", "raspy", "ratio", "ratty", "raven", "rayon", "razor", "reach", "react", "ready", "realm", "rearm", "rebar", "rebel", "rebus", "rebut", "recap", "recur", "recut", "reedy", "refer", "refit", "regal", "rehab", "reign", "relax", "relay", "relic", "remit", "renal", "renew", "repay", "repel", "reply", "rerun", "reset", "resin", "retch", "retro", "retry", "reuse", "revel", "revue", "rhino", "rhyme", "rider", "ridge", "rifle", "right", "rigid", "rigor", "rinse", "ripen", "riper", "risen", "riser", "risky", "rival", "river", "rivet", "roach", "roast", "robin", "robot", "rocky", "rodeo", "roger", "rogue", "roomy", "roost", "rotor", "rouge", "rough", "round", "rouse", "route", "rover", "rowdy", "rower", "royal", "ruddy", "ruder", "rugby", "ruler", "rumba", "rumor", "rupee", "rural", "rusty", "sadly", "safer", "saint", "salad", "sally", "salon", "salsa", "salty", "salve", "salvo", "sandy", "saner", "sappy", "sassy", "satin", "satyr", "sauce", "saucy", "sauna", "saute", "savor", "savoy", "savvy", "scald", "scale", "scalp", "scaly", "scamp", "scant", "scare", "scarf", "scary", "scene", "scent", "scion", "scoff", "scold", "scone", "scoop", "scope", "score", "scorn", "scour", "scout", "scowl", "scram", "scrap", "scree", "screw", "scrub", "scrum", "scuba", "sedan", "seedy", "segue", "seize", "semen", "sense", "sepia", "serif", "serum", "serve", "setup", "seven", "sever", "sewer", "shack", "shade", "shady", "shaft", "shake", "shaky", "shale", "shall", "shalt", "shame", "shank", "shape", "shard", "share", "shark", "sharp", "shave", "shawl", "shear", "sheen", "sheep", "sheer", "sheet", "sheik", "shelf", "shell", "shied", "shift", "shine", "shiny", "shire", "shirk", "shirt", "shoal", "shock", "shone", "shook", "shoot", "shore", "shorn", "short", "shout", "shove", "shown", "showy", "shrew", "shrub", "shrug", "shuck", "shunt", "shush", "shyly", "siege", "sieve", "sight", "sigma", "silky", "silly", "since", "sinew", "singe", "siren", "sissy", "sixth", "sixty", "skate", "skier", "skiff", "skill", "skimp", "skirt", "skulk", "skull", "skunk", "slack", "slain", "slang", "slant", "slash", "slate", "slave", "sleek", "sleep", "sleet", "slept", "slice", "slick", "slide", "slime", "slimy", "sling", "slink", "sloop", "slope", "slosh", "sloth", "slump", "slung", "slunk", "slurp", "slush", "slyly", "smack", "small", "smart", "smash", "smear", "smell", "smelt", "smile", "smirk", "smite", "smith", "smock", "smoke", "smoky", "smote", "snack", "snail", "snake", "snaky", "snare", "snarl", "sneak", "sneer", "snide", "sniff", "snipe", "snoop", "snore", "snort", "snout", "snowy", "snuck", "snuff", "soapy", "sober", "soggy", "solar", "solid", "solve", "sonar", "sonic", "sooth", "sooty", "sorry", "sound", "south", "sower", "space", "spade", "spank", "spare", "spark", "spasm", "spawn", "speak", "spear", "speck", "speed", "spell", "spelt", "spend", "spent", "sperm", "spice", "spicy", "spied", "spiel", "spike", "spiky", "spill", "spilt", "spine", "spiny", "spire", "spite", "splat", "split", "spoil", "spoke", "spoof", "spook", "spool", "spoon", "spore", "sport", "spout", "spray", "spree", "sprig", "spunk", "spurn", "spurt", "squad", "squat", "squib", "stack", "staff", "stage", "staid", "stain", "stair", "stake", "stale", "stalk", "stall", "stamp", "stand", "stank", "stare", "stark", "start", "stash", "state", "stave", "stead", "steak", "steal", "steam", "steed", "steel", "steep", "steer", "stein", "stern", "stick", "stiff", "still", "stilt", "sting", "stink", "stint", "stock", "stoic", "stoke", "stole", "stomp", "stone", "stony", "stood", "stool", "stoop", "store", "stork", "storm", "story", "stout", "stove", "strap", "straw", "stray", "strip", "strut", "stuck", "study", "stuff", "stump", "stung", "stunk", "stunt", "style", "suave", "sugar", "suing", "suite", "sulky", "sully", "sumac", "sunny", "super", "surer", "surge", "surly", "sushi", "swami", "swamp", "swarm", "swash", "swath", "swear", "sweat", "sweep", "sweet", "swell", "swept", "swift", "swill", "swine", "swing", "swirl", "swish", "swoon", "swoop", "sword", "swore", "sworn", "swung", "synod", "syrup", "tabby", "table", "taboo", "tacit", "tacky", "taffy", "taint", "taken", "taker", "tally", "talon", "tamer", "tango", "tangy", "taper", "tapir", "tardy", "tarot", "taste", "tasty", "tatty", "taunt", "tawny", "teach", "teary", "tease", "teddy", "teeth", "tempo", "tenet", "tenor", "tense", "tenth", "tepee", "tepid", "terra", "terse", "testy", "thank", "theft", "their", "theme", "there", "these", "theta", "thick", "thief", "thigh", "thing", "think", "third", "thong", "thorn", "those", "three", "threw", "throb", "throw", "thrum", "thumb", "thump", "thyme", "tiara", "tibia", "tidal", "tiger", "tight", "tilde", "timer", "timid", "tipsy", "titan", "tithe", "title", "toast", "today", "toddy", "token", "tonal", "tonga", "tonic", "tooth", "topaz", "topic", "torch", "torso", "torus", "total", "totem", "touch", "tough", "towel", "tower", "toxic", "toxin", "trace", "track", "tract", "trade", "trail", "train", "trait", "tramp", "trash", "trawl", "tread", "treat", "trend", "triad", "trial", "tribe", "trice", "trick", "tried", "tripe", "trite", "troll", "troop", "trope", "trout", "trove", "truce", "truck", "truer", "truly", "trump", "trunk", "truss", "trust", "truth", "tryst", "tubal", "tuber", "tulip", "tulle", "tumor", "tunic", "turbo", "tutor", "twang", "tweak", "tweed", "tweet", "twice", "twine", "twirl", "twist", "twixt", "tying", "udder", "ulcer", "ultra", "umbra", "uncle", "uncut", "under", "undid", "undue", "unfed", "unfit", "unify", "union", "unite", "unity", "unlit", "unmet", "unset", "untie", "until", "unwed", "unzip", "upper", "upset", "urban", "urine", "usage", "usher", "using", "usual", "usurp", "utile", "utter", "vague", "valet", "valid", "valor", "value", "valve", "vapid", "vapor", "vault", "vaunt", "vegan", "venom", "venue", "verge", "verse", "verso", "verve", "vicar", "video", "vigil", "vigor", "villa", "vinyl", "viola", "viper", "viral", "virus", "visit", "visor", "vista", "vital", "vivid", "vixen", "vocal", "vodka", "vogue", "voice", "voila", "vomit", "voter", "vouch", "vowel", "vying", "wacky", "wafer", "wager", "wagon", "waist", "waive", "waltz", "warty", "waste", "watch", "water", "waver", "waxen", "weary", "weave", "wedge", "weedy", "weigh", "weird", "welch", "welsh", "wench", "whack", "whale", "wharf", "wheat", "wheel", "whelp", "where", "which", "whiff", "while", "whine", "whiny", "whirl", "whisk", "white", "whole", "whoop", "whose", "widen", "wider", "widow", "width", "wield", "wight", "willy", "wimpy", "wince", "winch", "windy", "wiser", "wispy", "witch", "witty", "woken", "woman", "women", "woody", "wooer", "wooly", "woozy", "wordy", "world", "worry", "worse", "worst", "worth", "would", "wound", "woven", "wrack", "wrath", "wreak", "wreck", "wrest", "wring", "wrist", "write", "wrong", "wrote", "wrung", "wryly", "yacht", "yearn", "yeast", "yield", "young", "youth", "zebra", "zesty", "zonal"]
// 7208
const commonIdiomsList = ["坚定不移", "随时随地", "全力以赴", "丰富多彩", "余波未平", "脱颖而出", "实事求是", "一如既往", "众所周知", "一年一度", "因地制宜", "千方百计", "息息相关", "层出不穷", "引人注目", "当务之急", "滥用职权", "深入人心", "见义勇为", "敲诈勒索", "名不虚传", "来之不易", "名副其实", "下落不明", "坚持不懈", "源源不断", "络绎不绝", "弄虚作假", "不可思议", "不正之风", "小心翼翼", "长治久安", "如火如荼", "不折不扣", "后顾之忧", "纸醉金迷", "力所能及", "供不应求", "一目了然", "显而易见", "持之以恒", "成千上万", "大街小巷", "可想而知", "安居乐业", "齐心协力", "得天独厚", "一见钟情", "艰苦奋斗", "全心全意", "独一无二", "不约而同", "紧锣密鼓", "五花八门", "一应俱全", "应运而生", "与众不同", "触目惊心", "屡见不鲜", "无独有偶", "行之有效", "不知不觉", "大势所趋", "千家万户", "心有余悸", "不得而知", "前所未有", "迫不及待", "雪上加霜", "迫在眉睫", "此起彼伏", "脚踏实地", "意想不到", "错综复杂", "无可厚非", "源远流长", "举一反三", "循序渐进", "不遗余力", "不言而喻", "讨价还价", "深恶痛绝", "三位一体", "截然不同", "记忆犹新", "喜闻乐见", "家喻户晓", "日新月异", "取而代之", "莫名其妙", "名列前茅", "排忧解难", "各式各样", "玩忽职守", "任重道远", "奋发有为", "举足轻重", "比比皆是", "卓有成效", "落地生根", "势在必行", "史无前例", "理所当然", "耳熟能详", "由来已久", "一模一样", "厉行节约", "恶性循环", "铤而走险", "举世瞩目", "再接再厉", "足不出户", "翻天覆地", "非同寻常", "挨家挨户", "不翼而飞", "参差不齐", "水涨船高", "沸沸扬扬", "先发制人", "轩然大波", "出人意料", "土生土长", "统筹兼顾", "明察暗访", "刻不容缓", "融为一体", "焕然一新", "以身作则", "潜移默化", "风口浪尖", "有条不紊", "归根结底", "发扬光大", "旗帜鲜明", "万无一失", "可见一斑", "一视同仁", "相辅相成", "淋漓尽致", "耳目一新", "不了了之", "热火朝天", "有目共睹", "久而久之", "视而不见", "自强不息", "以权谋私", "继往开来", "赞不绝口", "义不容辞", "未雨绸缪", "一举一动", "绳之以法", "尽如人意", "有所作为", "对症下药", "出谋划策", "四面八方", "首当其冲", "马不停蹄", "不以为然", "必由之路", "所作所为", "一蹴而就", "人满为患", "身体力行", "精益求精", "大吃一惊", "竭尽全力", "拭目以待", "无家可归", "哭笑不得", "铺张浪费", "不知所措", "座无虚席", "可乘之机", "琳琅满目", "卷土重来", "铺天盖地", "理直气壮", "面目全非", "忧心忡忡", "在所难免", "燃眉之急", "不绝于耳", "津津乐道", "立竿见影", "议论纷纷", "与日俱增", "衣食住行", "急功近利", "博大精深", "根深蒂固", "大有可为", "轰轰烈烈", "惊心动魄", "不亦乐乎", "何去何从", "独立自主", "相得益彰", "取信于民", "耐人寻味", "别开生面", "水泄不通", "接二连三", "无能为力", "难以为继", "陷入僵局", "感同身受", "不知去向", "匪夷所思", "背道而驰", "难以置信", "拳打脚踢", "一帆风顺", "掉以轻心", "畅所欲言", "习以为常", "漏洞百出", "出乎意料", "一脉相承", "当之无愧", "肆无忌惮", "寥寥无几", "顺藤摸瓜", "助人为乐", "欢聚一堂", "泪流满面", "接踵而至", "直言不讳", "义无反顾", "力不从心", "遍地开花", "慕名而来", "纷至沓来", "兴致勃勃", "家常便饭", "措手不及", "心急如焚", "一席之地", "栩栩如生", "眼花缭乱", "雪中送炭", "得不偿失", "安然无恙", "深入浅出", "捉襟见肘", "自始至终", "拒之门外", "望而却步", "默默无闻", "顺理成章", "难能可贵", "来龙去脉", "不谋而合", "如出一辙", "提心吊胆", "徇私舞弊", "一无所知", "锲而不舍", "别有用心", "大打出手", "同舟共济", "雨后春笋", "兢兢业业", "泣不成声", "无人问津", "应有尽有", "引以为戒", "异军突起", "波澜壮阔", "无可奈何", "归根到底", "品学兼优", "司空见惯", "推波助澜", "微乎其微", "相提并论", "束手无策", "信以为真", "死灰复燃", "苦不堪言", "争分夺秒", "集思广益", "蛮不讲理", "自力更生", "有的放矢", "严阵以待", "建功立业", "人山人海", "溃不成军", "国计民生", "年事已高", "绿水青山", "半壁江山", "求同存异", "蛛丝马迹", "鱼龙混杂", "扑朔迷离", "熙熙攘攘", "一技之长", "大江南北", "屈指可数", "交相辉映", "公之于众", "一拍即合", "絮絮叨叨", "一丝不苟", "相依为命", "微不足道", "大有作为", "良莠不齐", "令人瞩目", "迎刃而解", "从天而降", "不合时宜", "现身说法", "新陈代谢", "声势浩大", "高高在上", "合情合理", "量力而行", "不切实际", "针锋相对", "责无旁贷", "高瞻远瞩", "千千万万", "明目张胆", "连锁反应", "适得其反", "摇身一变", "跃跃欲试", "聚精会神", "承前启后", "杯水车薪", "一网打尽", "开花结果", "慷慨解囊", "素不相识", "无可争辩", "长此以往", "格格不入", "蔚然成风", "生机勃勃", "吃苦耐劳", "昏迷不醒", "金字招牌", "大相径庭", "堂而皇之", "如数家珍", "争先恐后", "浓墨重彩", "大刀阔斧", "惊慌失措", "所剩无几", "高官厚禄", "一心一意", "井然有序", "一波三折", "形迹可疑", "炙手可热", "身临其境", "二话不说", "流连忘返", "热泪盈眶", "销声匿迹", "打击报复", "尽心尽力", "一以贯之", "恍然大悟", "置之不理", "轻而易举", "人来人往", "青山绿水", "齐头并进", "一筹莫展", "百花齐放", "各执一词", "志同道合", "绞尽脑汁", "首屈一指", "水到渠成", "物美价廉", "众说纷纭", "各自为政", "语重心长", "德才兼备", "乐此不疲", "方兴未艾", "五颜六色", "无动于衷", "锦上添花", "推陈出新", "荒淫无度", "畅通无阻", "独树一帜", "省吃俭用", "无济于事", "情不自禁", "不足为奇", "忍无可忍", "埋头苦干", "郁郁葱葱", "事半功倍", "不省人事", "分门别类", "别出心裁", "明明白白", "热情洋溢", "大张旗鼓", "防不胜防", "惊魂未定", "蒙混过关", "错落有致", "一点一滴", "入不敷出", "我行我素", "深思熟虑", "趋之若鹜", "无微不至", "溢于言表", "车水马龙", "同心同德", "无所适从", "变本加厉", "壮士断腕", "崭露头角", "雄心勃勃", "以点带面", "学以致用", "心中有数", "五湖四海", "审时度势", "不择手段", "大起大落", "不厌其烦", "一针见血", "四通八达", "不可开交", "春暖花开", "天经地义", "悬而未决", "一言不发", "蜂拥而至", "扬长而去", "水落石出", "大开眼界", "载歌载舞", "子虚乌有", "了如指掌", "历历在目", "徇私枉法", "风云变幻", "公正廉洁", "茁壮成长", "千丝万缕", "奋不顾身", "轻描淡写", "不解之缘", "有意无意", "顾名思义", "有声有色", "流离失所", "诸如此类", "一清二楚", "众志成城", "救死扶伤", "梦寐以求", "逍遥法外", "按捺不住", "信誓旦旦", "不计其数", "缺一不可", "脱胎换骨", "真心实意", "对簿公堂", "不辱使命", "狂风暴雨", "日复一日", "白发苍苍", "山清水秀", "随心所欲", "不堪设想", "浩浩荡荡", "叹为观止", "不由自主", "天下第一", "如愿以偿", "取长补短", "所见所闻", "近在咫尺", "一言一行", "惨不忍睹", "一无所获", "既得利益", "呼之欲出", "一厢情愿", "黄金时代", "无与伦比", "无中生有", "轰动一时", "街头巷尾", "掷地有声", "戛然而止", "念念不忘", "偷工减料", "津津有味", "改头换面", "据为己有", "大同小异", "刮目相看", "令人发指", "目瞪口呆", "三三两两", "雷厉风行", "风雨无阻", "江郎才尽", "美轮美奂", "货真价实", "三令五申", "和睦相处", "感慨万千", "拾金不昧", "因人而异", "一纸空文", "双管齐下", "脱口而出", "曾几何时", "逃之夭夭", "心甘情愿", "一朝一夕", "倾家荡产", "有利可图", "证据确凿", "万众一心", "古色古香", "刻骨铭心", "东窗事发", "开门见山", "蒸蒸日上", "艰苦卓绝", "承上启下", "振奋人心", "风起云涌", "乱七八糟", "浑身解数", "一意孤行", "大有人在", "年复一年", "水土不服", "绝无仅有", "奄奄一息", "生生不息", "从头到尾", "迫不得已", "公平合理", "独善其身", "恰到好处", "一触即发", "说三道四", "不胜枚举", "各抒己见", "意味深长", "聪明才智", "生死存亡", "蠢蠢欲动", "摇摇欲坠", "世外桃源", "滔滔不绝", "欣欣向荣", "添砖加瓦", "相差无几", "来势汹汹", "有朝一日", "疑难杂症", "指日可待", "每况愈下", "精打细算", "真知灼见", "遥遥无期", "代代相传", "勇往直前", "好景不长", "另辟蹊径", "朝气蓬勃", "一劳永逸", "见怪不怪", "目不暇接", "热气腾腾", "脍炙人口", "无所事事", "甚嚣尘上", "时不我待", "一成不变", "打成一片", "怀恨在心", "总而言之", "支支吾吾", "艰苦创业", "不务正业", "身无分文", "别具一格", "治病救人", "岌岌可危", "丰功伟绩", "他山之石", "避重就轻", "按部就班", "急转直下", "一举两得", "兴高采烈", "同心协力", "侃侃而谈", "恼羞成怒", "天壤之别", "咄咄逼人", "千篇一律", "寸步难行", "嘘寒问暖", "不失时机", "直截了当", "白手起家", "人去楼空", "置若罔闻", "瞠目结舌", "长途跋涉", "有说有笑", "严于律己", "群策群力", "前车之鉴", "一拥而上", "违法乱纪", "大政方针", "痛定思痛", "始终如一", "啼笑皆非", "数不胜数", "不闻不问", "不相上下", "有生之年", "自给自足", "打草惊蛇", "守望相助", "鼓舞人心", "三五成群", "铿锵有力", "接踵而来", "赏心悦目", "夜以继日", "起早贪黑", "爱不释手", "手足无措", "一分为二", "不可多得", "喜出望外", "口口相传", "只争朝夕", "气喘吁吁", "猝不及防", "不甘示弱", "亡羊补牢", "意气风发", "摩拳擦掌", "千差万别", "喜怒哀乐", "酸甜苦辣", "惟妙惟肖", "自相矛盾", "中流砥柱", "真相大白", "早出晚归", "异口同声", "繁荣昌盛", "喜气洋洋", "大是大非", "自食其力", "言传身教", "浴血奋战", "大惊小怪", "转危为安", "见缝插针", "平易近人", "古今中外", "怨声载道", "人声鼎沸", "千里迢迢", "融会贯通", "整装待发", "得心应手", "守土有责", "破口大骂", "不可磨灭", "永无止境", "犹豫不决", "火眼金睛", "袖手旁观", "苦口婆心", "游刃有余", "始终不渝", "发家致富", "耿耿于怀", "油然而生", "害群之马", "权宜之计", "背井离乡", "支离破碎", "皆大欢喜", "大名鼎鼎", "合二为一", "风吹草动", "依依不舍", "秋高气爽", "挺身而出", "掩人耳目", "姗姗来迟", "事与愿违", "实至名归", "翩翩起舞", "名目繁多", "凤毛麟角", "忍气吞声", "耳濡目染", "一气呵成", "天伦之乐", "千载难逢", "满目疮痍", "堆积如山", "一无所有", "追根溯源", "精神抖擞", "人心惶惶", "朝夕相处", "当仁不让", "不依不饶", "设身处地", "名胜古迹", "焦头烂额", "无缘无故", "日积月累", "旷日持久", "不胫而走", "忍俊不禁", "成群结队", "接连不断", "无稽之谈", "债台高筑", "因材施教", "居安思危", "手忙脚乱", "轻重缓急", "应接不暇", "矢志不渝", "触手可及", "发人深省", "异曲同工", "破门而入", "自言自语", "左邻右舍", "乐在其中", "以身试法", "养家糊口", "众矢之的", "心平气和", "繁荣富强", "若隐若现", "哗众取宠", "纵横交错", "空穴来风", "叫苦不迭", "因势利导", "德高望重", "舆论哗然", "有恃无恐", "人命关天", "气势磅礴", "昙花一现", "息事宁人", "日日夜夜", "荡然无存", "欢欣鼓舞", "惊天动地", "艰难险阻", "险象环生", "数一数二", "切身体会", "以假乱真", "风风雨雨", "天寒地冻", "负债累累", "任劳任怨", "走投无路", "令行禁止", "重蹈覆辙", "无时无刻", "成家立业", "炎黄子孙", "剑拔弩张", "将心比心", "大手大脚", "一览无余", "为所欲为", "名正言顺", "纸上谈兵", "夜深人静", "川流不息", "美不胜收", "善始善终", "枝繁叶茂", "意料之外", "斩钉截铁", "风云人物", "大有裨益", "防微杜渐", "无影无踪", "举手之劳", "中西合璧", "走马上任", "拍手称快", "小心谨慎", "来历不明", "海纳百川", "汗流浃背", "七嘴八舌", "本末倒置", "不顾一切", "混淆视听", "热血沸腾", "左右为难", "风平浪静", "如履薄冰", "先天不足", "招摇撞骗", "解疑释惑", "不速之客", "心服口服", "东拼西凑", "一落千丈", "原原本本", "就事论事", "火上浇油", "没完没了", "劳民伤财", "危言耸听", "天马行空", "煞费苦心", "自欺欺人", "讳莫如深", "断章取义", "五彩缤纷", "进退两难", "改过自新", "一口咬定", "急于求成", "严惩不贷", "疲惫不堪", "百折不挠", "一家老小", "大显身手", "头破血流", "浑水摸鱼", "不容置疑", "孜孜不倦", "长久之计", "闻名遐迩", "千辛万苦", "指手画脚", "赫赫有名", "灭顶之灾", "如影随形", "风调雨顺", "无所作为", "茶余饭后", "痛哭流涕", "高屋建瓴", "走马观花", "步调一致", "蒙在鼓里", "屡教不改", "歪风邪气", "失之交臂", "漫天要价", "平心而论", "不在话下", "担惊受怕", "约定俗成", "廉洁奉公", "果不其然", "晴天霹雳", "正本清源", "不负众望", "瞬息万变", "不可逾越", "靠天吃饭", "语焉不详", "悲痛欲绝", "前赴后继", "翻山越岭", "临危受命", "忐忑不安", "不拘一格", "有机可乘", "漫山遍野", "而立之年", "赞叹不已", "不假思索", "不屈不挠", "潸然泪下", "条条框框", "灵机一动", "礼尚往来", "引人入胜", "若无其事", "熟视无睹", "骇人听闻", "供过于求", "趋利避害", "交口称赞", "精力充沛", "冠冕堂皇", "分道扬镳", "老生常谈", "荷枪实弹", "彻头彻尾", "活灵活现", "安身立命", "风雨同舟", "游手好闲", "心灰意冷", "耸人听闻", "网开一面", "电闪雷鸣", "精兵强将", "星罗棋布", "谈何容易", "三缄其口", "众目睽睽", "混为一谈", "不能自拔", "多才多艺", "不欢而散", "井井有条", "鳞次栉比", "自以为是", "不动声色", "腾空而起", "似曾相识", "稳扎稳打", "空空如也", "危在旦夕", "开诚布公", "可歌可泣", "口诛笔伐", "釜底抽薪", "口口声声", "举世闻名", "光明正大", "一门心思", "不一而足", "文山会海", "德艺双馨", "顾全大局", "能上能下", "胆战心惊", "坚韧不拔", "起死回生", "全神贯注", "死里逃生", "一马当先", "平安无事", "厚积薄发", "无理取闹", "当机立断", "八方支援", "深情厚谊", "名存实亡", "如释重负", "雷打不动", "一望无际", "与世隔绝", "大摇大摆", "门可罗雀", "将信将疑", "勤勤恳恳", "心旷神怡", "柴米油盐", "心照不宣", "半途而废", "半信半疑", "无计可施", "轻装上阵", "一塌糊涂", "震撼人心", "后来居上", "并驾齐驱", "不时之需", "自告奋勇", "东山再起", "轻车简从", "锒铛入狱", "通力合作", "石沉大海", "隐姓埋名", "愤愤不平", "一鼓作气", "千头万绪", "心安理得", "冰天雪地", "后起之秀", "谨言慎行", "时过境迁", "必争之地", "唯利是图", "居高临下", "事无巨细", "无孔不入", "势不可挡", "烟消云散", "席地而坐", "豁然开朗", "义愤填膺", "不进则退", "一概而论", "身先士卒", "敷衍了事", "高枕无忧", "巧立名目", "万不得已", "震耳欲聋", "今非昔比", "拉帮结派", "无忧无虑", "手舞足蹈", "千呼万唤", "各取所需", "杳无音信", "遥遥领先", "相濡以沫", "先入为主", "横七竖八", "痛心疾首", "千军万马", "可有可无", "化整为零", "阳奉阴违", "沉默寡言", "你追我赶", "顺手牵羊", "渐入佳境", "听之任之", "心无旁骛", "束手就擒", "以防万一", "振聋发聩", "杳无音讯", "情有可原", "尽力而为", "小题大做", "投机取巧", "不屑一顾", "约法三章", "自圆其说", "人尽其才", "迎来送往", "从容应对", "财大气粗", "随波逐流", "望子成龙", "鸡毛蒜皮", "肃然起敬", "公平交易", "因噎废食", "束之高阁", "另起炉灶", "打破常规", "饮食起居", "青黄不接", "面面俱到", "天涯海角", "语无伦次", "箭在弦上", "朗朗上口", "舍近求远", "置身事外", "鞠躬尽瘁", "活蹦乱跳", "不寒而栗", "明辨是非", "言简意赅", "鸟语花香", "避而不谈", "头头是道", "安营扎寨", "风尘仆仆", "前无古人", "无可非议", "无所不能", "筋疲力尽", "一来二去", "一哄而上", "张灯结彩", "不由分说", "酣畅淋漓", "难以预料", "南辕北辙", "自由自在", "风风火火", "冒名顶替", "保家卫国", "年富力强", "不义之财", "事出有因", "见死不救", "模棱两可", "三天两头", "中饱私囊", "一贫如洗", "没日没夜", "见贤思齐", "戒备森严", "千奇百怪", "麻痹大意", "满载而归", "至高无上", "一草一木", "扬长避短", "同甘共苦", "铜墙铁壁", "孜孜以求", "抱头痛哭", "移风易俗", "独具匠心", "追悔莫及", "久负盛名", "冷嘲热讽", "泛滥成灾", "横冲直撞", "沾沾自喜", "争奇斗艳", "有血有肉", "精神恍惚", "盘根错节", "大兴土木", "老泪纵横", "雄心壮志", "瞒天过海", "丧心病狂", "目不转睛", "相安无事", "和而不同", "乐善好施", "快马加鞭", "人心向背", "无关紧要", "入土为安", "峰回路转", "闻所未闻", "手无寸铁", "据理力争", "不虚此行", "漏网之鱼", "乘风破浪", "出类拔萃", "挖空心思", "有求必应", "价廉物美", "暴露无遗", "千疮百孔", "嗤之以鼻", "春意盎然", "矢口否认", "原封不动", "无可比拟", "三番五次", "登高望远", "板上钉钉", "杞人忧天", "心满意足", "无所不在", "举手投足", "动荡不安", "东张西望", "三足鼎立", "物归原主", "不远万里", "空中楼阁", "家长里短", "通宵达旦", "一掷千金", "言之凿凿", "挥汗如雨", "天衣无缝", "如鱼得水", "僧多粥少", "互相推诿", "本来面目", "来者不拒", "欣喜若狂", "呕心沥血", "精耕细作", "汗马功劳", "稍纵即逝", "远见卓识", "千钧一发", "不攻自破", "奋发图强", "运筹帷幄", "同归于尽", "声情并茂", "喜笑颜开", "就地取材", "谈笑风生", "一本正经", "按兵不动", "真刀真枪", "春风化雨", "天罗地网", "摩肩接踵", "飞来横祸", "依山傍水", "胸有成竹", "花样翻新", "万事大吉", "虎视眈眈", "古往今来", "独占鳌头", "萎靡不振", "舍己救人", "欲罢不能", "敲锣打鼓", "化险为夷", "穷凶极恶", "休戚与共", "相映成趣", "按图索骥", "不偏不倚", "穿针引线", "闭门造车", "入乡随俗", "迎头赶上", "不堪一击", "有识之士", "出尔反尔", "如痴如醉", "天翻地覆", "毁于一旦", "只言片语", "不期而遇", "仁人志士", "疲于奔命", "放眼世界", "妙趣横生", "大海捞针", "气势汹汹", "似是而非", "差强人意", "含辛茹苦", "风华正茂", "招兵买马", "贪赃枉法", "披荆斩棘", "殚精竭虑", "风雨飘摇", "尽善尽美", "以偏概全", "豪言壮语", "跃然纸上", "前功尽弃", "诗情画意", "重操旧业", "各自为战", "鬼鬼祟祟", "扪心自问", "用心良苦", "恰如其分", "经久不息", "千姿百态", "步履蹒跚", "休养生息", "风靡一时", "不明不白", "唇枪舌剑", "家破人亡", "重男轻女", "东倒西歪", "包罗万象", "十全十美", "行色匆匆", "不劳而获", "百感交集", "互通有无", "国泰民安", "西装革履", "扶危济困", "百年不遇", "和衷共济", "纹丝不动", "人才辈出", "步履维艰", "艰难困苦", "付之一炬", "众望所归", "一干二净", "一走了之", "红白喜事", "同仇敌忾", "粗制滥造", "崇山峻岭", "回味无穷", "不近人情", "不紧不慢", "励精图治", "敬而远之", "生死未卜", "知法犯法", "颠倒黑白", "门庭若市", "两败俱伤", "开阔眼界", "劳逸结合", "心血来潮", "洁身自好", "盛况空前", "动之以情", "十有八九", "偷梁换柱", "传为佳话", "灰头土脸", "信手拈来", "偃旗息鼓", "大获全胜", "守株待兔", "患难与共", "全军覆没", "忙忙碌碌", "浮想联翩", "慷慨激昂", "安家落户", "形影不离", "真情实感", "湖光山色", "长年累月", "问心无愧", "乍暖还寒", "多管闲事", "后继有人", "踌躇满志", "背水一战", "天南海北", "一语道破", "花花绿绿", "拨乱反正", "苦心经营", "科班出身", "雾里看花", "振振有词", "声泪俱下", "看家本领", "不辞而别", "敷衍塞责", "一蹶不振", "放任自流", "只字不提", "东躲西藏", "趁热打铁", "痛不欲生", "风和日丽", "万里长城", "周而复始", "一往无前", "乘胜追击", "煞有介事", "夺眶而出", "温文尔雅", "内忧外患", "一锤定音", "操之过急", "心潮澎湃", "翻来覆去", "吉祥如意", "斤斤计较", "积劳成疾", "甜言蜜语", "漠不关心", "大声疾呼", "杂乱无章", "临危不惧", "奋起直追", "顶天立地", "一鸣惊人", "一盘散沙", "不管不顾", "道听途说", "言行一致", "两全其美", "以讹传讹", "是非曲直", "如意算盘", "一生一世", "兴风作浪", "风吹日晒", "一尘不染", "胆大妄为", "百家争鸣", "功亏一篑", "不置可否", "前因后果", "富丽堂皇", "专心致志", "轻举妄动", "一丝一毫", "于事无补", "千变万化", "粉墨登场", "顾此失彼", "重见天日", "无法无天", "不以为意", "大错特错", "颗粒无收", "坐立不安", "花言巧语", "心惊胆战", "势均力敌", "气急败坏", "留有余地", "标新立异", "步步为营", "喃喃自语", "积重难返", "一字一句", "表面文章", "有心无力", "游山玩水", "自暴自弃", "不得人心", "一知半解", "囤积居奇", "绚丽多彩", "明知故犯", "花团锦簇", "情真意切", "灵丹妙药", "毛骨悚然", "名不副实", "左顾右盼", "浑然一体", "像模像样", "欢天喜地", "受制于人", "海阔天空", "扼腕叹息", "心惊肉跳", "独当一面", "危机四伏", "如法炮制", "彬彬有礼", "异想天开", "源头活水", "不远千里", "为人师表", "固步自封", "如日中天", "弥留之际", "物尽其用", "一语中的", "大快人心", "屡试不爽", "面红耳赤", "迥然不同", "难言之隐", "泾渭分明", "三六九等", "大浪淘沙", "华而不实", "大失所望", "扣人心弦", "不可告人", "破烂不堪", "驾轻就熟", "你死我活", "心领神会", "一衣带水", "忽冷忽热", "恋恋不舍", "遍体鳞伤", "神采奕奕", "翻箱倒柜", "干净利落", "处心积虑", "独断专行", "切中要害", "朴实无华", "和蔼可亲", "地广人稀", "后悔莫及", "乘虚而入", "四分五裂", "望尘莫及", "英姿飒爽", "阴差阳错", "出其不意", "谦虚谨慎", "虎头蛇尾", "分崩离析", "抽丝剥茧", "蜻蜓点水", "千山万水", "并行不悖", "奔走相告", "有问必答", "量体裁衣", "铁证如山", "完璧归赵", "狂轰滥炸", "无可奉告", "不可动摇", "软硬兼施", "疏而不漏", "急中生智", "监守自盗", "闷闷不乐", "心心相印", "人杰地灵", "不堪回首", "身不由己", "生老病死", "捷报频传", "开宗明义", "粗心大意", "感人肺腑", "瓢泼大雨", "任人唯亲", "惴惴不安", "沁人心脾", "昏昏欲睡", "言外之意", "不出所料", "无精打采", "行云流水", "一穷二白", "无所畏惧", "出人头地", "切肤之痛", "无所顾忌", "赤子之心", "大功告成", "拍案叫绝", "举国上下", "得过且过", "扬眉吐气", "趁火打劫", "乌烟瘴气", "见仁见智", "寸步不离", "各得其所", "有口皆碑", "风光旖旎", "不痛不痒", "济济一堂", "不慌不忙", "返璞归真", "利欲熏心", "才华横溢", "既成事实", "为国捐躯", "平起平坐", "各有千秋", "称心如意", "叱咤风云", "一反常态", "不知所终", "胡说八道", "毅然决然", "雁过拔毛", "打抱不平", "呼风唤雨", "怦然心动", "颐养天年", "绘声绘色", "适可而止", "漫不经心", "艰苦朴素", "隐隐约约", "先睹为快", "金碧辉煌", "功成名就", "言谈举止", "闻风而动", "家徒四壁", "掩耳盗铃", "如虎添翼", "枪林弹雨", "价值连城", "以儆效尤", "见势不妙", "不伦不类", "身败名裂", "波光粼粼", "旁若无人", "轻车熟路", "节衣缩食", "默不作声", "肝胆相照", "尽心竭力", "兼容并蓄", "无懈可击", "行家里手", "延年益寿", "夸大其词", "伤筋动骨", "跋山涉水", "前仆后继", "攻城略地", "负隅顽抗", "捕风捉影", "越俎代庖", "文人墨客", "好吃懒做", "祸不单行", "莫衷一是", "指名道姓", "无拘无束", "牢不可破", "坚如磐石", "艰难曲折", "人云亦云", "悬崖勒马", "一举成名", "雨过天晴", "与人为善", "变幻莫测", "激浊扬清", "灯火辉煌", "人心所向", "光天化日", "七零八落", "沧海桑田", "令人作呕", "风雨交加", "回心转意", "心力衰竭", "望而生畏", "一无是处", "光明磊落", "养儿防老", "出言不逊", "化为乌有", "惨绝人寰", "万家灯火", "煽风点火", "力挽狂澜", "荡气回肠", "矫枉过正", "诚心诚意", "赤身裸体", "名噪一时", "大气磅礴", "苍白无力", "相亲相爱", "神清气爽", "妙语连珠", "慌慌张张", "吞吞吐吐", "姹紫嫣红", "见多识广", "大雨倾盆", "如临大敌", "有备无患", "独辟蹊径", "百废待兴", "胡言乱语", "催人泪下", "积少成多", "一己之私", "心力交瘁", "初出茅庐", "大大咧咧", "浑然天成", "南来北往", "真心诚意", "多如牛毛", "心急火燎", "逆水行舟", "颠沛流离", "慌不择路", "发号施令", "投其所好", "故伎重演", "照本宣科", "移花接木", "人人自危", "共商国是", "单枪匹马", "在天之灵", "声嘶力竭", "多此一举", "鱼目混珠", "老实巴交", "舟车劳顿", "稀奇古怪", "一窍不通", "不堪入目", "愁眉不展", "百年大计", "细枝末节", "和盘托出", "美中不足", "落荒而逃", "不甘寂寞", "狭路相逢", "饮水思源", "绰绰有余", "名利双收", "战火纷飞", "大庭广众", "思前想后", "人人皆知", "精疲力竭", "幸灾乐祸", "两袖清风", "答非所问", "一事无成", "简明扼要", "相形见绌", "惊涛骇浪", "麻木不仁", "觥筹交错", "舍生忘死", "寿终正寝", "拔苗助长", "除恶务尽", "妄自菲薄", "毫不讳言", "风驰电掣", "自生自灭", "有板有眼", "议论风生", "孤立无援", "喋喋不休", "沆瀣一气", "人财两空", "弄巧成拙", "念念有词", "亭台楼阁", "亲密无间", "坚不可摧", "终身大事", "天花乱坠", "风吹雨打", "千言万语", "异乎寻常", "亦步亦趋", "惩前毖后", "扶老携幼", "攻守同盟", "白雪皑皑", "充耳不闻", "安于现状", "青梅竹马", "一针一线", "大好河山", "人才济济", "咎由自取", "高人一等", "藏污纳垢", "上行下效", "口干舌燥", "灯红酒绿", "能说会道", "所向披靡", "招架不住", "自觉自愿", "嗷嗷待哺", "砸锅卖铁", "厚德载物", "闪烁其词", "神通广大", "大风大浪", "风餐露宿", "喜上眉梢", "细水长流", "了然于胸", "关门大吉", "判若两人", "火冒三丈", "胡作非为", "街谈巷议", "年逾古稀", "筚路蓝缕", "自作主张", "天南地北", "过街老鼠", "坑蒙拐骗", "高不可攀", "酒足饭饱", "啧啧称赞", "夕阳西下", "头晕目眩", "怒不可遏", "残缺不全", "引经据典", "花花公子", "饮鸩止渴", "五谷丰登", "有名无实", "滥竽充数", "若有所思", "号啕大哭", "坐而论道", "真才实学", "无足轻重", "怒气冲冲", "拥政爱民", "泪如雨下", "雅俗共赏", "独到之处", "下不为例", "任人唯贤", "如获至宝", "左右逢源", "感天动地", "无伤大雅", "泥沙俱下", "论资排辈", "事不关己", "欲言又止", "精美绝伦", "一扫而空", "衣衫褴褛", "九牛一毛", "排山倒海", "一团和气", "灰飞烟灭", "推心置腹", "鬼斧神工", "无穷无尽", "永垂不朽", "墨守成规", "惊弓之鸟", "波涛汹涌", "孤注一掷", "血流如注", "毛遂自荐", "大动干戈", "水乳交融", "人浮于事", "开天辟地", "繁花似锦", "柳暗花明", "饥肠辘辘", "手下留情", "谨小慎微", "大肆宣传", "过犹不及", "口耳相传", "蝇头小利", "众口难调", "晕头转向", "不可理喻", "走南闯北", "殊途同归", "窃窃私语", "其貌不扬", "求贤若渴", "蜂拥而上", "摇旗呐喊", "人情世故", "各有所长", "半身不遂", "秘而不宣", "借题发挥", "朝令夕改", "怨天尤人", "改弦更张", "循规蹈矩", "哄堂大笑", "家家户户", "当头一棒", "传宗接代", "完美无缺", "金榜题名", "黯然失色", "救亡图存", "虚张声势", "博采众长", "大而化之", "招摇过市", "事倍功半", "不可收拾", "心灵手巧", "愚公移山", "水深火热", "一扫而光", "无依无靠", "一念之差", "抛头露面", "花甲之年", "打退堂鼓", "两手空空", "以牙还牙", "刚正不阿", "哑口无言", "宾至如归", "忙里偷闲", "发人深思", "无所不包", "一臂之力", "裹足不前", "知难而退", "三言两语", "神情恍惚", "心不在焉", "隔靴搔痒", "昭然若揭", "肺腑之言", "从容不迫", "惺惺相惜", "铁面无私", "山珍海味", "悲欢离合", "孤军奋战", "深山老林", "东奔西跑", "文质彬彬", "一丝不挂", "顶礼膜拜", "头疼脑热", "一见如故", "天下为公", "里应外合", "路见不平", "大发雷霆", "狼吞虎咽", "执迷不悟", "待人接物", "洗心革面", "同病相怜", "不治之症", "神采飞扬", "舍我其谁", "衣食父母", "言过其实", "势如破竹", "反目成仇", "知己知彼", "咬牙切齿", "以理服人", "大惊失色", "纷纷扬扬", "万马奔腾", "意气用事", "生死关头", "赤手空拳", "韬光养晦", "废寝忘食", "分内之事", "身经百战", "怒火中烧", "点睛之笔", "素未谋面", "风声鹤唳", "光彩夺目", "自立门户", "满不在乎", "病入膏肓", "愁眉苦脸", "百里挑一", "一览无遗", "多多益善", "昏昏沉沉", "有利有弊", "好大喜功", "妻离子散", "巧夺天工", "如坐针毡", "守口如瓶", "张冠李戴", "循循善诱", "患得患失", "无声无息", "悠然自得", "政出多门", "受宠若惊", "自作聪明", "唇齿相依", "娇生惯养", "平淡无奇", "八仙过海", "五光十色", "与世长辞", "尽人皆知", "正襟危坐", "繁文缛节", "吹毛求疵", "暗度陈仓", "克己奉公", "遮天蔽日", "倒行逆施", "大千世界", "一面之词", "因循守旧", "滴水不漏", "非此即彼", "万人空巷", "不同凡响", "兼收并蓄", "生死攸关", "垂涎欲滴", "推而广之", "瞻前顾后", "自投罗网", "扶摇直上", "高风亮节", "平分秋色", "一诺千金", "自行其是", "顾虑重重", "开源节流", "窗明几净", "唉声叹气", "量入为出", "随行就市", "一飞冲天", "因小失大", "分秒必争", "屡战屡败", "落叶归根", "面面相觑", "坐以待毙", "深更半夜", "视若无睹", "巍然屹立", "亭亭玉立", "鸦雀无声", "以小见大", "去伪存真", "兴师动众", "千夫所指", "琴棋书画", "短兵相接", "风云突变", "如饥似渴", "广开言路", "有气无力", "威风凛凛", "百年之后", "四脚朝天", "捧腹大笑", "见利忘义", "不胜其烦", "出生入死", "休戚相关", "各就各位", "浅尝辄止", "炉火纯青", "身强力壮", "五脏六腑", "贪官污吏", "破釜沉舟", "好逸恶劳", "罪有应得", "三十而立", "年轻力壮", "举棋不定", "纠缠不清", "郁郁寡欢", "吞云吐雾", "抛砖引玉", "明哲保身", "历久弥坚", "双喜临门", "大红大紫", "捷足先登", "望眼欲穿", "出于无奈", "鞭长莫及", "平心静气", "含苞待放", "如梦初醒", "称兄道弟", "谢天谢地", "马到成功", "千锤百炼", "春寒料峭", "辗转反侧", "骨瘦如柴", "归心似箭", "痛改前非", "四面楚歌", "生离死别", "良师益友", "后继无人", "土崩瓦解", "蓬头垢面", "上下一心", "化为泡影", "在所不惜", "杀人灭口", "不苟言笑", "垂头丧气", "眼疾手快", "海市蜃楼", "好高骛远", "一笑了之", "气壮山河", "为非作歹", "笑逐颜开", "非同小可", "言犹在耳", "高谈阔论", "由浅入深", "知易行难", "素昧平生", "讳疾忌医", "信口开河", "十字路口", "旗鼓相当", "装聋作哑", "分庭抗礼", "劈头盖脸", "门当户对", "无价之宝", "忍辱负重", "政通人和", "唾手可得", "乔装打扮", "峥嵘岁月", "天网恢恢", "高山流水", "言听计从", "不声不响", "春光明媚", "付诸东流", "自私自利", "心烦意乱", "快人快语", "画龙点睛", "胡思乱想", "歪门邪道", "引火烧身", "弱肉强食", "竭泽而渔", "寸草不生", "明争暗斗", "私相授受", "堂堂正正", "同流合污", "治国安邦", "畅行无阻", "一文不值", "凶多吉少", "立足之地", "逐字逐句", "万象更新", "费尽心机", "从中渔利", "铩羽而归", "微言大义", "眉飞色舞", "做贼心虚", "连绵不断", "匹夫有责", "视死如归", "重于泰山", "不怀好意", "入木三分", "忘乎所以", "扫地出门", "老调重弹", "一股脑儿", "授业解惑", "多事之秋", "短小精悍", "碌碌无为", "劫后余生", "无关痛痒", "痴人说梦", "抑扬顿挫", "不可限量", "掌上明珠", "大处着眼", "岿然不动", "水漫金山", "牵肠挂肚", "登峰造极", "度日如年", "大公无私", "浩如烟海", "别有洞天", "变化多端", "霸王别姬", "字正腔圆", "天旋地转", "九死一生", "惊世骇俗", "防患未然", "药到病除", "半路出家", "曲径通幽", "反复推敲", "芸芸众生", "生龙活虎", "一马平川", "登堂入室", "踉踉跄跄", "一本万利", "大难不死", "心悦诚服", "人间天堂", "野心勃勃", "假公济私", "斗志昂扬", "不可偏废", "后患无穷", "春华秋实", "独来独往", "旁征博引", "阳春白雪", "一年半载", "举目无亲", "欺上瞒下", "装模作样", "饥寒交迫", "骑虎难下", "挥金如土", "投桃报李", "无地自容", "畏首畏尾", "原形毕露", "断壁残垣", "眼高手低", "天之骄子", "欲盖弥彰", "栋梁之才", "肆意妄为", "不二法门", "强词夺理", "内外交困", "厚此薄彼", "损人利己", "以邻为壑", "郑重其事", "光怪陆离", "天上人间", "恶意中伤", "精诚团结", "夙夜在公", "有生力量", "访贫问苦", "过目不忘", "喧宾夺主", "懵懵懂懂", "病从口入", "旧病复发", "深谋远虑", "不知所云", "花好月圆", "交头接耳", "出神入化", "强加于人", "春风得意", "颐指气使", "东奔西走", "陈词滥调", "不可一世", "神乎其神", "穷困潦倒", "抚今追昔", "长袖善舞", "寅吃卯粮", "表里如一", "例行公事", "寒冬腊月", "刨根问底", "捏一把汗", "自得其乐", "六神无主", "躲躲闪闪", "半夜三更", "人多势众", "先声夺人", "冷眼旁观", "勃然大怒", "先斩后奏", "天长地久", "力排众议", "穷途末路", "机不可失", "听天由命", "戒骄戒躁", "得寸进尺", "草木皆兵", "众口一词", "养老送终", "从长计议", "得意之作", "说一不二", "回天乏术", "头晕眼花", "地大物博", "慎终追远", "功德无量", "笑容可掬", "虚无缥缈", "四平八稳", "官官相护", "善罢甘休", "有生以来", "开疆拓土", "金蝉脱壳", "大言不惭", "天真烂漫", "山穷水尽", "软弱无力", "丰衣足食", "荒无人烟", "概莫能外", "爱莫能助", "忧国忧民", "咄咄怪事", "暴风骤雨", "璀璨夺目", "感激不尽", "说来说去", "始作俑者", "血雨腥风", "丧尽天良", "张牙舞爪", "望闻问切", "崇洋媚外", "自不待言", "升官发财", "兼容并包", "平白无故", "不冷不热", "心神不宁", "勉为其难", "日夜兼程", "扶正祛邪", "纵横捭阖", "连篇累牍", "深居简出", "舍本逐末", "贪得无厌", "浑浑噩噩", "另眼相看", "反复无常", "沽名钓誉", "酩酊大醉", "求之不得", "鹤立鸡群", "当头棒喝", "比翼齐飞", "飞黄腾达", "百尺竿头", "惶恐不安", "知难而进", "口出狂言", "哭哭啼啼", "婀娜多姿", "杀鸡取卵", "盛极一时", "蜂拥而来", "误打误撞", "死去活来", "经年累月", "耳闻目睹", "齐心合力", "嫌贫爱富", "宁缺毋滥", "驰名中外", "心向往之", "付之东流", "心事重重", "恨之入骨", "弱不禁风", "悔不当初", "身怀六甲", "高朋满座", "古为今用", "睡眼惺忪", "知足常乐", "鼻青脸肿", "绿草如茵", "言行不一", "摇头晃脑", "各个击破", "长篇大论", "落井下石", "各行其是", "步步高升", "顺水推舟", "匠心独运", "乱作一团", "从头至尾", "左思右想", "点石成金", "群龙无首", "近亲繁殖", "一败涂地", "命中注定", "风花雪月", "混淆是非", "雍容华贵", "刀光剑影", "大雨滂沱", "无以复加", "死于非命", "百无聊赖", "改名换姓", "夸夸其谈", "精疲力尽", "大权在握", "一线生机", "正大光明", "怡然自得", "长驱直入", "利令智昏", "垂涎三尺", "情投意合", "节外生枝", "黯然神伤", "显山露水", "龙凤呈祥", "衣锦还乡", "兵戎相见", "深仇大恨", "严丝合缝", "声名狼藉", "仗义执言", "依然如故", "勤学苦练", "对答如流", "血气方刚", "雕梁画栋", "妇孺皆知", "举重若轻", "知无不言", "义正词严", "待价而沽", "言之有物", "变化无常", "迷途知返", "高耸入云", "一呼百应", "逢山开路", "退避三舍", "人文荟萃", "苦中作乐", "从善如流", "卧薪尝胆", "生搬硬套", "非亲非故", "昂首挺胸", "鬼使神差", "叫苦连天", "大势已去", "无奇不有", "戮力同心", "百年树人", "不卑不亢", "开国元勋", "流言蜚语", "委曲求全", "居心叵测", "选贤任能", "别具匠心", "小恩小惠", "慢条斯理", "挑拨离间", "有志之士", "罪大恶极", "谆谆教导", "革故鼎新", "万念俱灰", "装点门面", "坐享其成", "平步青云", "诚惶诚恐", "音容笑貌", "达官贵人", "奇形怪状", "黑灯瞎火", "打得火热", "狼狈不堪", "秋后算账", "披星戴月", "民不聊生", "街坊邻里", "依依惜别", "相见恨晚", "一日千里", "贼喊捉贼", "促膝谈心", "寡不敌众", "花天酒地", "杀一儆百", "一板一眼", "望其项背", "深入骨髓", "目无法纪", "近水楼台", "为非作恶", "唯我独尊", "反躬自省", "评头论足", "物是人非", "草长莺飞", "重整旗鼓", "体无完肤", "大放厥词", "奋笔疾书", "万紫千红", "刚柔相济", "弹丸之地", "心驰神往", "体贴入微", "心浮气躁", "毁誉参半", "一笔勾销", "好说歹说", "深得人心", "令人神往", "劫富济贫", "察言观色", "不毛之地", "鼓鼓囊囊", "将错就错", "魂牵梦萦", "拿手好戏", "自知之明", "一箭双雕", "嬉笑怒骂", "字斟句酌", "为期不远", "群雄逐鹿", "急不可耐", "不辞劳苦", "高歌猛进", "同日而语", "硕果仅存", "饱经沧桑", "倒背如流", "勾心斗角", "油盐酱醋", "以防不测", "包打天下", "和风细雨", "年近古稀", "英雄本色", "夺门而出", "一见倾心", "不着边际", "出乎预料", "炯炯有神", "虚位以待", "养尊处优", "徒劳无功", "闻风丧胆", "故弄玄虚", "耀武扬威", "贪污腐化", "一面之缘", "上下其手", "兼而有之", "镜花水月", "事在人为", "十万火急", "聪明伶俐", "心花怒放", "深不可测", "清水衙门", "牢骚满腹", "聚沙成塔", "七手八脚", "尸位素餐", "巧取豪夺", "添油加醋", "开路先锋", "雷电交加", "口若悬河", "坐吃山空", "珠联璧合", "风度翩翩", "一哄而散", "如鲠在喉", "一唱一和", "出奇制胜", "大义凛然", "小巧玲珑", "暴跳如雷", "逆来顺受", "云淡风轻", "传经送宝", "曲高和寡", "改弦易辙", "牵强附会", "从轻发落", "满腔热忱", "先知先觉", "气焰嚣张", "消极怠工", "飞檐走壁", "一笑置之", "展翅高飞", "易如反掌", "马首是瞻", "严刑峻法", "人所共知", "惨淡经营", "连绵不绝", "连绵起伏", "一五一十", "路人皆知", "咬文嚼字", "触景生情", "抱残守缺", "桀骜不驯", "万劫不复", "上天入地", "原来如此", "粉身碎骨", "好事多磨", "伤天害理", "惹是生非", "背信弃义", "钻牛角尖", "锱铢必较", "成双成对", "白头偕老", "赤膊上阵", "发财致富", "大义灭亲", "一路平安", "各色人等", "大有文章", "寄人篱下", "死而后已", "滴水穿石", "源源不绝", "过从甚密", "日以继夜", "求全责备", "寸步不让", "投石问路", "根深叶茂", "灭绝人性", "功成身退", "如雷贯耳", "舍己为人", "穷乡僻壤", "普天同庆", "马马虎虎", "先见之明", "旁敲侧击", "倒打一耙", "无事生非", "谈天说地", "力争上游", "吃哑巴亏", "心如刀绞", "拖泥带水", "用之不竭", "离经叛道", "骄傲自满", "奇装异服", "插科打诨", "春回大地", "推己及人", "分文不取", "将计就计", "引狼入室", "强人所难", "心狠手辣", "无可置疑", "若即若离", "不分彼此", "南征北战", "以退为进", "不拘小节", "死心塌地", "汹涌澎湃", "真枪实弹", "损公肥私", "温情脉脉", "优哉游哉", "天生丽质", "摇头叹息", "贤妻良母", "贻笑大方", "敢作敢为", "斯文扫地", "粗茶淡饭", "以身殉职", "缩手缩脚", "趁虚而入", "安安稳稳", "死而复生", "汗牛充栋", "糖衣炮弹", "出谋献策", "望洋兴叹", "熟门熟路", "礼仪之邦", "蹑手蹑脚", "鱼水深情", "亡国灭种", "醍醐灌顶", "嫉恶如仇", "气象万千", "盛气凌人", "七上八下", "多灾多难", "安分守己", "投鼠忌器", "健步如飞", "民怨沸腾", "男女老少", "首善之区", "大煞风景", "妙不可言", "直抒胸臆", "相敬如宾", "矢志不移", "风云际会", "不敢苟同", "助纣为虐", "昂首阔步", "满城风雨", "耳聪目明", "几次三番", "叶落归根", "进退维谷", "文过饰非", "灿烂辉煌", "狐假虎威", "百年好合", "成败得失", "浓妆艳抹", "谋财害命", "改邪归正", "一了百了", "散兵游勇", "天各一方", "彪形大汉", "恣意妄为", "胆大包天", "栉风沐雨", "各持己见", "磨刀霍霍", "一手遮天", "一言难尽", "杂七杂八", "风言风语", "不乏其人", "十年寒窗", "子子孙孙", "瓮中捉鳖", "血战到底", "国色天香", "少言寡语", "战无不胜", "拨云见日", "虚晃一枪", "如临深渊", "空前绝后", "精神焕发", "缓兵之计", "拍案而起", "鸿篇巨制", "凶神恶煞", "朝思暮想", "画蛇添足", "大肆挥霍", "改朝换代", "胡搅蛮缠", "乌合之众", "大禹治水", "无恶不作", "空头支票", "谁是谁非", "神出鬼没", "雄伟壮观", "争风吃醋", "引以为荣", "姓甚名谁", "滴水成冰", "天下太平", "忘恩负义", "感情用事", "长命百岁", "传为美谈", "容光焕发", "照章办事", "穷兵黩武", "一路顺风", "为国为民", "雷霆万钧", "半推半就", "自食其果", "茅塞顿开", "蛊惑人心", "头重脚轻", "念兹在兹", "趾高气扬", "得而复失", "随遇而安", "形单影只", "旧事重提", "阴魂不散", "死气沉沉", "纲举目张", "一言九鼎", "滂沱大雨", "话不投机", "烟波浩渺", "弹尽粮绝", "投笔从戎", "斗转星移", "婆婆妈妈", "豪情壮志", "十恶不赦", "各尽所能", "大展宏图", "大惑不解", "强弩之末", "似懂非懂", "得意洋洋", "见财起意", "言无不尽", "由表及里", "声东击西", "捶胸顿足", "令人捧腹", "光辉灿烂", "克敌制胜", "歌功颂德", "闭关锁国", "动人心魄", "关怀备至", "避实就虚", "鱼贯而出", "高抬贵手", "与世无争", "心心念念", "条分缕析", "苦思冥想", "迎风招展", "闲言碎语", "千人一面", "唯唯诺诺", "大雅之堂", "提纲挈领", "三思而行", "调兵遣将", "大吉大利", "谆谆告诫", "无坚不摧", "长生不老", "火树银花", "眉开眼笑", "一手包办", "四书五经", "固若金汤", "孤家寡人", "无师自通", "三顾茅庐", "养精蓄锐", "势不两立", "大腹便便", "歌舞升平", "一往情深", "优柔寡断", "冥思苦想", "结结巴巴", "苦尽甘来", "闻风而逃", "杀人放火", "不修边幅", "拉拉扯扯", "营私舞弊", "久别重逢", "指鹿为马", "枯燥无味", "盖棺定论", "悔过自新", "泛泛而谈", "投机倒把", "奇谈怪论", "赴汤蹈火", "上下同心", "众星捧月", "出师不利", "千真万确", "博览群书", "大材小用", "教学相长", "窥见一斑", "腰缠万贯", "追本溯源", "饥不择食", "乐不可支", "单刀直入", "和气生财", "民富国强", "瓜熟蒂落", "无的放矢", "机关算尽", "各不相让", "天女散花", "满打满算", "俯拾皆是", "惨无人道", "陈规陋习", "一泻千里", "一潭死水", "无为而治", "浮光掠影", "得意门生", "毕恭毕敬", "零零星星", "物极必反", "笑而不答", "荣华富贵", "宁死不屈", "日理万机", "疑神疑鬼", "光宗耀祖", "图谋不轨", "成竹在胸", "精雕细刻", "颠扑不破", "忠心耿耿", "反唇相讥", "有钱有势", "相持不下", "返老还童", "一花独放", "哀鸿遍野", "造谣中伤", "十面埋伏", "争强好胜", "既往不咎", "日进斗金", "零敲碎打", "飞扬跋扈", "尔虞我诈", "难兄难弟", "喜新厌旧", "因祸得福", "自顾不暇", "兹事体大", "略胜一筹", "鼎鼎大名", "举不胜举", "老当益壮", "身外之物", "众叛亲离", "孤苦伶仃", "心直口快", "血肉相连", "量力而为", "飒爽英姿", "不惑之年", "杀鸡儆猴", "举世无双", "千难万险", "赶尽杀绝", "名落孙山", "沧海一粟", "洋洋得意", "胆大心细", "以貌取人", "拐弯抹角", "表里不一", "乐极生悲", "疾风骤雨", "牙牙学语", "三更半夜", "公而忘私", "天长日久", "情同手足", "无边无际", "行尸走肉", "忿忿不平", "息息相通", "挑三拣四", "龙腾虎跃", "奇货可居", "言而无信", "慷慨陈词", "匠心独具", "画地为牢", "龙马精神", "人丁兴旺", "悔之晚矣", "无机可乘", "结党营私", "荒诞不经", "生不逢时", "百花争艳", "盲人摸象", "神来之笔", "为民请命", "寥寥可数", "恃强凌弱", "腹背受敌", "丢三落四", "为富不仁", "得意忘形", "厚颜无耻", "响彻云霄", "大家闺秀", "三长两短", "万水千山", "斩草除根", "假戏真做", "坚贞不屈", "解囊相助", "过眼云烟", "挥霍无度", "管中窥豹", "草菅人命", "寒来暑往", "发愤图强", "扬汤止沸", "舍生取义", "苟延残喘", "鲜艳夺目", "和颜悦色", "索然无味", "作壁上观", "颜面扫地", "别无二致", "沾亲带故", "离乡背井", "进退失据", "隔岸观火", "兴趣盎然", "挑肥拣瘦", "腥风血雨", "认祖归宗", "人仰马翻", "开怀畅饮", "不徇私情", "涂脂抹粉", "何乐不为", "六亲不认", "通情达理", "冷暖自知", "孤芳自赏", "富可敌国", "弦外之音", "无妄之灾", "真凭实据", "人情冷暖", "不学无术", "世道人心", "浪子回头", "阿谀奉承", "天朗气清", "绝处逢生", "自我牺牲", "不值一驳", "巧舌如簧", "造谣惑众", "鳏寡孤独", "引吭高歌", "轻手轻脚", "层峦叠嶂", "推三阻四", "晚节不保", "树大招风", "眉清目秀", "英雄辈出", "奉公守法", "身家性命", "不能自已", "歪打正着", "火急火燎", "真情实意", "鱼死网破", "临阵脱逃", "猴年马月", "略知一二", "百发百中", "喜形于色", "从中作梗", "作茧自缚", "品头论足", "玩世不恭", "世风日下", "其乐无穷", "星火燎原", "瘦骨嶙峋", "明察秋毫", "鱼贯而入", "反败为胜", "熙来攘往", "翻云覆雨", "失魂落魄", "惜字如金", "贻害无穷", "远走高飞", "有头有脸", "等闲视之", "纷纷扰扰", "虚怀若谷", "首尾相连", "五体投地", "画饼充饥", "虚与委蛇", "黑白分明", "与民同乐", "争权夺利", "学贯中西", "徒有虚名", "滔天罪行", "万古长青", "十之八九", "水天一色", "爱憎分明", "生死相依", "白驹过隙", "食不果腹", "鱼与熊掌", "地主之谊", "旗开得胜", "熟能生巧", "反客为主", "翻江倒海", "锋芒毕露", "下里巴人", "各色各样", "大权独揽", "言之有理", "偷鸡摸狗", "生灵涂炭", "一叶障目", "玉汝于成", "一颦一笑", "孑然一身", "置之度外", "不白之冤", "吐故纳新", "渔翁得利", "胆小怕事", "金童玉女", "丧权辱国", "招贤纳士", "破涕为笑", "言不由衷", "道貌岸然", "为民除害", "忠贞不渝", "碧空如洗", "骄奢淫逸", "名满天下", "心慈手软", "具体而微", "悲天悯人", "一刀两断", "一官半职", "固执己见", "无可救药", "鹿死谁手", "妄自尊大", "江河日下", "三心二意", "囫囵吞枣", "夫唱妇随", "花枝招展", "饱经风霜", "丝丝入扣", "含饴弄孙", "揠苗助长", "满山遍野", "七情六欲", "以柔克刚", "偏听偏信", "枕戈待旦", "破旧立新", "闭门不出", "头昏眼花", "破镜重圆", "罄竹难书", "魂飞魄散", "毫无疑义", "动人心弦", "信口雌黄", "暗无天日", "血流成河", "厉兵秣马", "愤世嫉俗", "打情骂俏", "兵临城下", "心如刀割", "慈眉善目", "有伤风化", "精忠报国", "红杏出墙", "街坊四邻", "腾云驾雾", "藏龙卧虎", "风烛残年", "三头六臂", "鬼迷心窍", "后发制人", "挥洒自如", "文武双全", "狼狈为奸", "公事公办", "别有风味", "义正辞严", "貌合神离", "金科玉律", "借酒浇愁", "狗急跳墙", "男尊女卑", "花里胡哨", "装腔作势", "无病呻吟", "本固邦宁", "兵荒马乱", "忆苦思甜", "气吞山河", "入情入理", "奇花异草", "摧枯拉朽", "事不宜迟", "常胜将军", "自相残杀", "铮铮铁骨", "卧虎藏龙", "变化莫测", "周游列国", "奇耻大辱", "妙手回春", "山崩地裂", "难舍难分", "祸国殃民", "稳操胜券", "以毒攻毒", "凶相毕露", "不惜工本", "坐冷板凳", "有始有终", "风雪交加", "切中时弊", "前仰后合", "天昏地暗", "悲观厌世", "珠光宝气", "生死与共", "一来一往", "用武之地", "事必躬亲", "血光之灾", "金戈铁马", "国富民强", "多愁善感", "多难兴邦", "大逆不道", "在劫难逃", "昏天黑地", "灰心丧气", "精兵简政", "自讨苦吃", "卖官鬻爵", "后会无期", "如此而已", "恍如隔世", "死不瞑目", "由近及远", "情窦初开", "聚众滋事", "悲从中来", "一望无垠", "卿卿我我", "噤若寒蝉", "一吐为快", "畸轻畸重", "铁板钉钉", "中庸之道", "去粗取精", "口是心非", "至理名言", "苍松翠柏", "一哄而起", "作恶多端", "分毫不差", "刻舟求剑", "大喜过望", "物华天宝", "百依百顺", "自作自受", "草草了事", "逍遥自在", "卓尔不群", "想入非非", "才子佳人", "智勇双全", "大步流星", "斯斯文文", "泰然自若", "藕断丝连", "闻过则喜", "尾大不掉", "宠辱不惊", "泰然处之", "自身难保", "虎头虎脑", "一病不起", "深明大义", "善男信女", "尊师重道", "故步自封", "无迹可寻", "能言善辩", "骁勇善战", "常备不懈", "心存芥蒂", "各执己见", "拂袖而去", "敲山震虎", "无出其右", "老骥伏枥", "襟怀坦白", "八面玲珑", "垂死挣扎", "战战兢兢", "比翼双飞", "童叟无欺", "丢人现眼", "永不磨灭", "自愧不如", "串通一气", "居心不良", "老谋深算", "人事不省", "合而为一", "因时制宜", "粗枝大叶", "言而有信", "聊胜于无", "精明能干", "问寒问暖", "一元复始", "哑然失笑", "啧有烦言", "礼义廉耻", "颠倒是非", "漫无边际", "男女有别", "老态龙钟", "冲昏头脑", "坐收渔利", "感恩戴德", "感激涕零", "童心未泯", "天方夜谭", "捉摸不定", "极目远眺", "气宇轩昂", "扭扭捏捏", "见钱眼开", "高深莫测", "左右开弓", "狂风骤雨", "面黄肌瘦", "有勇有谋", "百口莫辩", "高山仰止", "兴师问罪", "水滴石穿", "大书特书", "心腹大患", "恩将仇报", "改天换地", "人间地狱", "弥天大谎", "来者不善", "古道热肠", "幡然悔悟", "谦谦君子", "龙飞凤舞", "丈二和尚", "鸡犬升天", "怀才不遇", "手到擒来", "故态复萌", "人心不古", "余音绕梁", "触类旁通", "分而治之", "师出有名", "数典忘祖", "滚瓜烂熟", "及时行乐", "战天斗地", "楚楚动人", "何必当初", "半死不活", "干净利索", "海誓山盟", "臭不可闻", "虚情假意", "一统天下", "肝肠寸断", "不露声色", "分外妖娆", "删繁就简", "自吹自擂", "打入冷宫", "转眼之间", "三教九流", "人心涣散", "同床异梦", "如胶似漆", "旖旎风光", "龇牙咧嘴", "糊里糊涂", "鸡飞狗跳", "世态炎凉", "以德报怨", "朝发夕至", "欢声雷动", "盛情难却", "罪加一等", "谈虎色变", "乔迁之喜", "大雨如注", "庞然大物", "殃及池鱼", "塞上江南", "授人以柄", "瓜田李下", "论功行赏", "不三不四", "东施效颦", "乘人之危", "人亡政息", "妖魔鬼怪", "小家子气", "起承转合", "远涉重洋", "饭来张口", "削足适履", "形势逼人", "功名利禄", "抱成一团", "百战不殆", "良辰吉日", "不堪入耳", "奖罚分明", "洋为中用", "国难当头", "孟母三迁", "泪如泉涌", "生气勃勃", "附庸风雅", "一语双关", "寓意深远", "弃之可惜", "若有若无", "闲情逸致", "半生不熟", "牛郎织女", "百战百胜", "莺歌燕舞", "财迷心窍", "集腋成裘", "飞禽走兽", "倾巢而出", "披头散发", "风霜雨雪", "咬紧牙关", "汗如雨下", "目中无人", "揭竿而起", "束手束脚", "拍案惊奇", "追根究底", "大家风范", "昼夜兼程", "稳如泰山", "面不改色", "情非得已", "搬弄是非", "望穿秋水", "叠床架屋", "风姿绰约", "黔驴技穷", "百般刁难", "闲杂人等", "不可救药", "影影绰绰", "无亲无故", "殷鉴不远", "奉为圭臬", "火中取栗", "生财有道", "笼络人心", "不破不立", "化零为整", "惶惶不安", "造谣生事", "黄道吉日", "上情下达", "开山鼻祖", "一鼻子灰", "倾巢出动", "大器晚成", "嬉皮笑脸", "皮开肉绽", "诲人不倦", "一步登天", "个中滋味", "安之若素", "洛阳纸贵", "伶牙俐齿", "前所未闻", "夜郎自大", "一毛不拔", "故土难离", "果然如此", "甘拜下风", "冷言冷语", "如履平地", "百鸟朝凤", "花前月下", "多快好省", "大江东去", "挂一漏万", "朝不保夕", "犬牙交错", "人定胜天", "鸠占鹊巢", "作奸犯科", "吃喝玩乐", "回头是岸", "天作之合", "绵延不断", "鱼米之乡", "从一而终", "命途多舛", "急流勇退", "流芳百世", "玩物丧志", "矫揉造作", "乐不思蜀", "含沙射影", "四面出击", "文以载道", "此起彼落", "养生之道", "自取灭亡", "九霄云外", "动辄得咎", "叶公好龙", "名扬四海", "封官许愿", "声色犬马", "如梦方醒", "寸土不让", "欺世盗名", "水调歌头", "至圣先师", "侠肝义胆", "千难万难", "夜长梦多", "执法如山", "目不识丁", "纵横驰骋", "罪孽深重", "万里无云", "乘兴而来", "劳燕分飞", "打马虎眼", "粉饰太平", "自怨自艾", "钢筋铁骨", "不落俗套", "仓皇出逃", "新婚燕尔", "蔚为大观", "鸣金收兵", "不以为耻", "口说无凭", "无远弗届", "自有公论", "不舍昼夜", "书声琅琅", "白头到老", "自甘堕落", "喜怒无常", "志士仁人", "自惭形秽", "东挪西借", "九泉之下", "怒发冲冠", "刀耕火种", "名垂青史", "心怀鬼胎", "重振旗鼓", "两肋插刀", "出头之日", "萍水相逢", "不足挂齿", "不骄不躁", "仁至义尽", "断子绝孙", "烽火连天", "大难临头", "欲擒故纵", "波谲云诡", "舞文弄墨", "迷惑不解", "坐卧不安", "瑕不掩瑜", "等量齐观", "锦衣玉食", "风流韵事", "高头大马", "借尸还魂", "光阴荏苒", "放荡不羁", "生杀予夺", "穷则思变", "迎头痛击", "倚老卖老", "心术不正", "榜上无名", "求知若渴", "装疯卖傻", "弄假成真", "火烧眉毛", "白山黑水", "眉来眼去", "衣冠楚楚", "兵不血刃", "无米之炊", "渔翁之利", "满园春色", "痴心妄想", "真命天子", "一石二鸟", "伤风败俗", "未老先衰", "查无实据", "满腹牢骚", "狐朋狗友", "狐狸尾巴", "锦囊妙计", "鸡犬不宁", "喝西北风", "搔首弄姿", "自我解嘲", "大动肝火", "百密一疏", "为虎作伥", "初露锋芒", "千秋万代", "时来运转", "死无对证", "浩然之气", "精诚所至", "血迹斑斑", "民脂民膏", "待字闺中", "反戈一击", "唱对台戏", "寻欢作乐", "溘然长逝", "邪不压正", "形形色色", "止于至善", "永无宁日", "树碑立传", "青出于蓝", "鼎鼎有名", "宽以待人", "岂有此理", "百无禁忌", "自鸣得意", "落英缤纷", "除暴安良", "见风使舵", "醉生梦死", "风流倜傥", "不见天日", "悠闲自在", "抖擞精神", "口不择言", "烂醉如泥", "盖棺论定", "颠三倒四", "安危与共", "临阵磨枪", "大开大合", "忠言逆耳", "悬崖绝壁", "金石为开", "孤陋寡闻", "抓耳挠腮", "拔刀相助", "温故知新", "百炼成钢", "难解难分", "千恩万谢", "字字珠玑", "屏气凝神", "花红柳绿", "疾恶如仇", "繁荣兴旺", "鞭辟入里", "大做文章", "师道尊严", "披麻戴孝", "等闲之辈", "聪明智慧", "奇珍异宝", "欲壑难填", "狡兔三窟", "风行一时", "木已成舟", "招财进宝", "推崇备至", "自寻短见", "孤军作战", "害人不浅", "虚虚实实", "足智多谋", "祸从天降", "青天白日", "全民皆兵", "纨绔子弟", "赏罚分明", "逼上梁山", "避人耳目", "问长问短", "不分伯仲", "十里洋场", "官运亨通", "小家碧玉", "庸人自扰", "洁身自爱", "满腹经纶", "知人善任", "赤胆忠心", "卑躬屈膝", "掩鼻而过", "深山密林", "讲信修睦", "空洞无物", "绵绵不绝", "兴利除弊", "功败垂成", "壮志未酬", "左支右绌", "眼观六路", "请君入瓮", "过河拆桥", "含情脉脉", "忧心如焚", "怅然若失", "急起直追", "玲珑剔透", "神魂颠倒", "名闻遐迩", "得道多助", "丑态百出", "狂妄自大", "甘之如饴", "相视而笑", "臭味相投", "高出一筹", "鼓乐齐鸣", "凡夫俗子", "探头探脑", "真心真意", "破绽百出", "祸从口出", "苦心孤诣", "九天揽月", "以弱胜强", "身体发肤", "普天之下", "月黑风高", "缠绵悱恻", "缺衣少食", "飞蛾扑火", "十拿九稳", "如泣如诉", "山高水长", "欢喜冤家", "一分一毫", "千古绝唱", "恬不知耻", "杨柳依依", "下情上达", "满面春风", "鞍前马后", "养痈遗患", "大而无当", "振臂一呼", "浪迹天涯", "长吁短叹", "面目狰狞", "飞沙走石", "夜不闭户", "自我表现", "蝇营狗苟", "逼不得已", "悬崖峭壁", "另谋高就", "四海一家", "坚强不屈", "怵目惊心", "明日黄花", "洋洋自得", "百年难遇", "睹物思人", "蛮横无理", "迂回曲折", "鸟枪换炮", "杀气腾腾", "万全之策", "夙兴夜寐", "顽固不化", "作威作福", "威风八面", "巾帼英雄", "离心离德", "逢凶化吉", "东拉西扯", "以暴易暴", "师出无名", "成人之美", "满盘皆输", "先礼后兵", "寸土必争", "桃红柳绿", "秀色可餐", "随声附和", "万箭穿心", "信马由缰", "成王败寇", "浩气长存", "精妙绝伦", "不留余地", "仰面朝天", "姑息养奸", "孤掌难鸣", "戎马生涯", "欺人太甚", "耳提面命", "贫病交加", "以德服人", "替天行道", "阴谋诡计", "鸡犬相闻", "古木参天", "暴殄天物", "朝三暮四", "毫无二致", "拱手让人", "冰清玉洁", "天下大乱", "山盟海誓", "巴山蜀水", "七七八八", "书香世家", "出口成章", "淡然处之", "不疾不徐", "立此存照", "自命不凡", "衣不蔽体", "闭口不言", "稍逊一筹", "窈窕淑女", "能文能武", "金鸡独立", "客死他乡", "天崩地裂", "人以群分", "今生今世", "刚愎自用", "南腔北调", "吊儿郎当", "善有善报", "好自为之", "有来有往", "铁石心肠", "喜不自胜", "尖酸刻薄", "情意绵绵", "望文生义", "耳听八方", "落花流水", "包办代替", "小鸟依人", "旁观者清", "畏缩不前", "缄口不言", "逢场作戏", "遇水架桥", "面目可憎", "一决胜负", "一叶知秋", "互为表里", "井底之蛙", "物以类聚", "胸怀大志", "装神弄鬼", "因陋就简", "无往不胜", "败兴而归", "风轻云淡", "鸡飞蛋打", "功德圆满", "媒妁之言", "魂不守舍", "乘其不备", "以眼还眼", "略逊一筹", "良辰美景", "不乏先例", "口传心授", "宽宏大量", "恶语相加", "杯弓蛇影", "紫气东来", "风华绝代", "三番两次", "不上不下", "如醉如痴", "适逢其时", "低声下气", "火上加油", "日薄西山", "目空一切", "唇亡齿寒", "富国强兵", "心高气傲", "泥牛入海", "降格以求", "项庄舞剑", "香消玉殒", "不求甚解", "屈打成招", "拔刀相向", "爱屋及乌", "称王称霸", "半真半假", "名山大川", "志得意满", "独步天下", "自掘坟墓", "门户之见", "人微言轻", "分化瓦解", "一星半点", "不识时务", "心腹之患", "天下无敌", "才貌双全", "穷奢极欲", "冷若冰霜", "外强中干", "少不更事", "有色眼镜", "独木难支", "身首异处", "二龙戏珠", "口齿伶俐", "坐井观天", "学无止境", "忘战必危", "旁门左道", "贩夫走卒", "同室操戈", "喜从天降", "话里有话", "鱼跃龙门", "不甚了了", "力透纸背", "反求诸己", "完好无缺", "聊以自慰", "血肉横飞", "调虎离山", "开卷有益", "正气凛然", "解甲归田", "七拼八凑", "覆水难收", "拈花惹草", "酗酒滋事", "俯拾即是", "吃里扒外", "天下一家", "广种薄收", "明火执仗", "杂乱无序", "皇亲国戚", "不自量力", "听而不闻", "告老还乡", "声如洪钟", "词不达意", "予取予求", "因果报应", "痛快淋漓", "豆蔻年华", "放虎归山", "有福同享", "风俗人情", "一拥而入", "同床共枕", "特立独行", "出以公心", "手足之情", "满腹狐疑", "苦大仇深", "路不拾遗", "过眼烟云", "声色俱厉", "家道中落", "本乡本土", "面授机宜", "人神共愤", "强颜欢笑", "探囊取物", "正人君子", "物竞天择", "病魔缠身", "决一死战", "惠风和畅", "暮气沉沉", "轻言细语", "否极泰来", "安然无事", "尸横遍野", "梳妆打扮", "楚楚可怜", "毫不介意", "一表人才", "弹无虚发", "旭日东升", "春色满园", "自讨没趣", "谬以千里", "伯仲之间", "克勤克俭", "公正无私", "回天无力", "来日方长", "骨肉相连", "光芒万丈", "呆若木鸡", "恶有恶报", "博学多才", "妻儿老小", "愚昧无知", "挤眉弄眼", "横生枝节", "臭名远扬", "锦绣前程", "顺水人情", "黯淡无光", "南橘北枳", "少年老成", "疾风暴雨", "见机行事", "五大三粗", "仗势欺人", "俭以养德", "时移世易", "清规戒律", "闭关自守", "患难夫妻", "有言在先", "以礼相待", "全盘托出", "壮志凌云", "戴罪立功", "改换门庭", "玩火自焚", "与虎谋皮", "国家栋梁", "掐头去尾", "无所不有", "至死不渝", "取信于人", "安贫乐道", "密锣紧鼓", "云蒸霞蔚", "刀下留人", "唠唠叨叨", "患难之交", "破罐破摔", "以卵击石", "先公后私", "兵强马壮", "劳苦功高", "有案可查", "牛鬼蛇神", "膘肥体壮", "过江之鲫", "回光返照", "收回成命", "有棱有角", "枯枝败叶", "空口无凭", "君子之交", "横行无忌", "谷贱伤农", "出人意外", "刚直不阿", "握手言欢", "无所不知", "自求多福", "不可捉摸", "关门闭户", "冤冤相报", "决胜千里", "唯命是从", "江湖骗子", "没精打采", "离群索居", "不言不语", "弊绝风清", "低三下四", "大智大勇", "应付自如", "自成一家", "不咸不淡", "以文会友", "势不可当", "失道寡助", "直上直下", "礼崩乐坏", "九五之尊", "寝食不安", "自成一格", "三人成虎", "偷天换日", "同心合力", "怜香惜玉", "振振有辞", "除旧布新", "鹬蚌相争", "不共戴天", "目光炯炯", "言为心声", "雄才大略", "鸣锣开道", "不干不净", "倾国倾城", "如花似玉", "小脚女人", "旧话重提", "时不再来", "晨钟暮鼓", "爱惜羽毛", "茂林修竹", "五毒俱全", "含苞欲放", "咫尺天涯", "未卜先知", "百思不解", "百步穿杨", "踌躇不前", "志在四方", "排除异己", "满面红光", "一定之规", "以逸待劳", "垂帘听政", "安家立业", "独揽大权", "脚不沾地", "半梦半醒", "后生可畏", "天理难容", "神情自若", "自卖自夸", "万籁俱寂", "于心何忍", "徒劳无益", "大彻大悟", "能工巧匠", "邯郸学步", "今不如昔", "四海为家", "居功自傲", "相生相克", "养虎为患", "指桑骂槐", "有口难辩", "似水流年", "心神不定", "时运不济", "格物致知", "水火无情", "男耕女织", "言归正传", "劳师动众", "拈轻怕重", "接风洗尘", "望梅止渴", "秀外慧中", "羊肠小道", "自寻烦恼", "蜕化变质", "自不量力", "说来话长", "风卷残云", "俗不可耐", "傲然挺立", "学富五车", "拼死拼活", "敢作敢当", "百折不回", "穷山恶水", "龙争虎斗", "思绪万千", "民生凋敝", "因人制宜", "弹冠相庆", "成年累月", "所向无敌", "方寸之地", "下回分解", "仙风道骨", "以身殉国", "壁垒森严", "清心寡欲", "群魔乱舞", "阴错阳差", "凄风冷雨", "千回百转", "又红又专", "涸泽而渔", "益寿延年", "逼良为娼", "鼠目寸光", "一张一弛", "五花大绑", "处之泰然", "目光如炬", "绵里藏针", "至善至美", "针头线脑", "不越雷池", "愁云惨雾", "手眼通天", "一钱不值", "不绝如缕", "心慌意乱", "贪生怕死", "亦庄亦谐", "庖丁解牛", "狼烟四起", "苦难深重", "点头哈腰", "女娲补天", "少见多怪", "春去秋来", "狰狞面目", "鉴往知来", "不懂装懂", "南郭先生", "吃里爬外", "惜墨如金", "永志不忘", "照猫画虎", "鼓乐喧天", "光阴似箭", "山重水复", "是非分明", "破除迷信", "自视甚高", "青史留名", "鸣冤叫屈", "志在千里", "择善而从", "眼明手快", "遗臭万年", "酒酣耳热", "不祥之兆", "东挪西凑", "摇头摆尾", "泼妇骂街", "风雨不改", "风雨如晦", "不可胜数", "仪表堂堂", "局促不安", "欺软怕硬", "一夫当关", "与时偕行", "偷偷摸摸", "狗血淋头", "趋炎附势", "飘飘欲仙", "事不过三", "大地回春", "开疆辟土", "悔恨交加", "有条有理", "沸反盈天", "牛刀小试", "鹤发童颜", "一决雌雄", "伯乐相马", "出乎意外", "洞若观火", "玉树临风", "一息尚存", "云开雾散", "心如止水", "星星之火", "比肩而立", "珍禽异兽", "精明强干", "东西南北", "两小无猜", "仁义道德", "大智若愚", "棒打鸳鸯", "洋洋洒洒", "锦绣河山", "冤家路窄", "情景交融", "金风送爽", "左邻右里", "手不释卷", "格杀勿论", "等米下锅", "缘木求鱼", "耍嘴皮子", "莫逆之交", "别无他物", "变化无穷", "宝刀未老", "寥若晨星", "杀身之祸", "苟且偷生", "专横跋扈", "人各有志", "以人为镜", "动荡不定", "大呼小叫", "大模大样", "庸庸碌碌", "心猿意马", "无往不利", "气贯长虹", "河东狮吼", "淡泊明志", "众星拱月", "地老天荒", "好勇斗狠", "嫁祸于人", "对牛弹琴", "寻死觅活", "难分难解", "飞针走线", "国破家亡", "塞翁失马", "头痛脑热", "泰山压顶", "积土成山", "黄粱一梦", "党同伐异", "分进合击", "勤能补拙", "吃穿用度", "宾客盈门", "惊恐万状", "晓以利害", "有胆有识", "玉石俱焚", "五洲四海", "内查外调", "味同嚼蜡", "高山峻岭", "不容分说", "变幻无常", "天下无双", "女中豪杰", "文弱书生", "炮火连天", "老气横秋", "代人受过", "宝刀不老", "瓮中之鳖", "破铜烂铁", "遇人不淑", "孔孟之道", "平铺直叙", "水来土掩", "生死之交", "评头品足", "金玉良言", "鹦鹉学舌", "刻苦耐劳", "君子协定", "寿比南山", "青云直上", "上下同欲", "不打自招", "口服心服", "梁上君子", "白日做梦", "闻风而至", "天造地设", "报仇雪恨", "文武兼备", "朝野上下", "一脉相传", "悲喜交集", "锐不可当", "命在旦夕", "如芒在背", "当局者迷", "旧地重游", "极乐世界", "三阳开泰", "亲仁善邻", "兵贵神速", "插翅难逃", "棋逢对手", "立锥之地", "笨鸟先飞", "傲慢无礼", "单刀赴会", "壁立千仞", "有凭有据", "要死要活", "逆耳之言", "郎才女貌", "风韵犹存", "三省吾身", "出人意表", "流年不利", "英雄豪杰", "诛心之论", "一命呜呼", "外柔内刚", "精神百倍", "至亲好友", "色胆包天", "谈古论今", "逐鹿中原", "排斥异己", "久病成医", "分文未取", "定国安邦", "林林总总", "江山如画", "甘苦与共", "凄风苦雨", "出水芙蓉", "变动不居", "同声相应", "承先启后", "盗亦有道", "遗世独立", "七老八十", "从恶如崩", "将功补过", "笔走龙蛇", "言之成理", "心中无数", "心怀叵测", "怒气冲天", "手到病除", "满天星斗", "苦乐不均", "长篇累牍", "不可企及", "人财两失", "同声同气", "鹰击长空", "一面之交", "从谏如流", "坐失良机", "铸剑为犁", "零打碎敲", "古圣先贤", "天理不容", "暗送秋波", "死皮赖脸", "胼手胝足", "坚贞不渝", "恩重如山", "感慨万端", "无牵无挂", "舐犊情深", "诚心实意", "飞龙在天", "修齐治平", "先人后己", "图财害命", "在所不辞", "女大当嫁", "怒目而视", "惟利是图", "正经八百", "池鱼之殃", "良药苦口", "不知深浅", "壮心不已", "没头没脑", "赌咒发誓", "轻歌曼舞", "难如登天", "一介书生", "从善如登", "博古通今", "奋勇当先", "杀人越货", "男大当婚", "罪责难逃", "草船借箭", "重峦叠嶂", "一文不名", "丢卒保车", "以攻为守", "心怀忐忑", "梨花带雨", "爬山涉水", "男欢女爱", "看破红尘", "闯荡江湖", "半丝半缕", "变幻无穷", "喷薄欲出", "心乱如麻", "积沙成塔", "苛捐杂税", "乌七八糟", "心细如发", "目不斜视", "攻无不克", "春和景明", "金无足赤", "钟灵毓秀", "黄雀在后", "半斤八两", "土豪劣绅", "生生死死", "略见一斑", "相貌堂堂", "跳梁小丑", "一团漆黑", "怡然自乐", "蔚成风气", "远交近攻", "回眸一笑", "天外有天", "孤军深入", "惹火烧身", "毛手毛脚", "莺飞草长", "风急浪高", "不耻下问", "事过境迁", "好为人师", "小肚鸡肠", "暧昧不明", "神经错乱", "五子登科", "慷慨就义", "日落西山", "普度众生", "残羹冷炙", "洗耳恭听", "身单力薄", "三皇五帝", "举世皆知", "义薄云天", "另眼相待", "对酒当歌", "文如其人", "积善成德", "节哀顺变", "面目一新", "顾影自怜", "各取所长", "大红大绿", "怪力乱神", "打小算盘", "方便之门", "汪洋大海", "洗手不干", "狗皮膏药", "蹉跎岁月", "闲云野鹤", "临别赠言", "何患无辞", "何罪之有", "柔情蜜意", "锦绣山河", "风流人物", "刀枪入库", "前呼后拥", "原封未动", "天府之国", "孝悌忠信", "家学渊源", "徒有其名", "终南捷径", "阴阳怪气", "封妻荫子", "悄然无声", "望风而逃", "李代桃僵", "温文儒雅", "硕大无比", "纤尘不染", "近悦远来", "马革裹尸", "以观后效", "列祖列宗", "地久天长", "贫困潦倒", "逸闻趣事", "金玉满堂", "一家之言", "三跪九叩", "不顾大局", "反躬自问", "大显神通", "沃野千里", "百年大业", "神气活现", "虾兵蟹将", "遮人耳目", "雕虫小技", "一片汪洋", "一长一短", "人言可畏", "利害得失", "千叮万嘱", "坚壁清野", "家贼难防", "精卫填海", "耳鬓厮磨", "话中有话", "危如累卵", "围魏救赵", "始乱终弃", "实心实意", "巧言令色", "正中下怀", "清汤寡水", "负荆请罪", "靡靡之音", "风吹浪打", "鬼哭狼嚎", "一目十行", "公报私仇", "墨迹未干", "开国功臣", "披肝沥胆", "父慈子孝", "震天动地", "吹吹打打", "奉若神明", "引而不发", "张口结舌", "损兵折将", "重起炉灶", "一片丹心", "万马齐喑", "国将不国", "守身如玉", "岁月峥嵘", "徒子徒孙", "成名成家", "断垣残壁", "日久天长", "枯木逢春", "立地成佛", "精锐之师", "能屈能伸", "视为畏途", "首鼠两端", "另眼看待", "天下归心", "如狼似虎", "如箭在弦", "孤立无助", "安不忘危", "游移不定", "砥柱中流", "众口铄金", "同气相求", "天知地知", "学非所用", "红男绿女", "苍翠欲滴", "长话短说", "一柱擎天", "不败之地", "千刀万剐", "湮没无闻", "福如东海", "积习难改", "螳臂当车", "见猎心喜", "言多必失", "一通百通", "不知所以", "出口伤人", "敝帚自珍", "横冲直闯", "绵绵不断", "置之脑后", "老成持重", "闻鸡起舞", "阿猫阿狗", "举案齐眉", "亲临其境", "土洋结合", "富商巨贾", "曲意逢迎", "火烧火燎", "自由放任", "色厉内荏", "丢盔弃甲", "凤冠霞帔", "威武不屈", "王侯将相", "积水成渊", "置之不顾", "蝇头小楷", "三朝元老", "夫妻反目", "弃暗投明", "无所不为", "水火之中", "滔天大罪", "狼子野心", "缺吃少穿", "长幼有序", "慷慨悲歌", "欢呼雀跃", "耳顺之年", "茹毛饮血", "一路风尘", "从心所欲", "付之一笑", "小道消息", "搜肠刮肚", "独霸一方", "隐忍不发", "难分难舍", "魑魅魍魉", "一字千金", "一挥而就", "买椟还珠", "以怨报德", "千沟万壑", "四大皆空", "形影相随", "本性难移", "生花妙笔", "胸中有数", "超然物外", "阿谀逢迎", "鸡零狗碎", "分家析产", "垂暮之年", "拾人牙慧", "救苦救难", "虚度年华", "闭目塞听", "三纲五常", "不足为虑", "各奔前程", "嗟来之食", "寸有所长", "尺有所短", "急公好义", "新仇旧恨", "油嘴滑舌", "焚书坑儒", "相对无言", "肆意横行", "自食其言", "若烹小鲜", "表里山河", "贪心不足", "金屋藏娇", "食不甘味", "黄粱美梦", "人老珠黄", "全知全能", "剥茧抽丝", "力所不及", "国仇家恨", "坎坷不平", "恶贯满盈", "横征暴敛", "漠然置之", "爱民如子", "花容月貌", "言归于好", "误人子弟", "不敢造次", "乔装改扮", "争名夺利", "同出一辙", "困兽犹斗", "必经之路", "放浪形骸", "立身处世", "震古烁今", "作如是观", "六畜兴旺", "卷帙浩繁", "备而不用", "孔武有力", "选贤与能", "金玉良缘", "万里迢迢", "南柯一梦", "大恩大德", "天渊之别", "山明水秀", "披坚执锐", "江东父老", "江洋大盗", "渺无人烟", "独出心裁", "等而下之", "赞口不绝", "青红皂白", "面有难色", "公正廉明", "君子好逑", "大敌当前", "攻心为上", "眉目传情", "闭门思过", "以一当十", "修旧利废", "好好先生", "就地正法", "插翅难飞", "点头之交", "苦口良药", "见惯不惊", "冷眼相待", "勤学好问", "哀而不伤", "坐卧不宁", "得失成败", "有始无终", "比肩接踵", "泽被后世", "狗血喷头", "甜酸苦辣", "生生世世", "三生有幸", "伉俪情深", "大音希声", "情深义重", "目不暇给", "身价百倍", "上兵伐谋", "九九归一", "心宽体胖", "户枢不蠹", "睚眦必报", "黄钟大吕", "不平则鸣", "两面三刀", "冤家对头", "安土重迁", "寡廉鲜耻", "干脆利落", "白纸黑字", "秋收冬藏", "英雄气短", "门禁森严", "一丘之貉", "一手一脚", "内外夹攻", "后会有期", "坐言起行", "威胁利诱", "无关大局", "死有余辜", "温柔敦厚", "窒碍难行", "缓不济急", "马放南山", "鱼肉百姓", "万物之灵", "兄弟阋墙", "弃笔从戎", "意气相投", "文韬武略", "死得其所", "班门弄斧", "畏葸不前", "虚有其表", "道德文章", "鼾声如雷", "借刀杀人", "千娇百媚", "外圆内方", "欲速不达", "胸无大志", "一时半刻", "三姑六婆", "全军覆灭", "同生共死", "大梦初醒", "心明眼亮", "有头有尾", "权宜之策", "步步登高", "漆黑一团", "点铁成金", "绝顶聪明", "芒刺在背", "趋吉避凶", "驷马难追", "是是非非", "淡而无味", "贼心不死", "马到功成", "鸿鹄之志", "娇小玲珑", "怡情养性", "明枪暗箭", "泪眼汪汪", "言之无物", "鸡鸣狗盗", "书香门第", "从容就义", "出头露面", "哼哼唧唧", "宾朋满座", "富国强民", "捐弃前嫌", "排除万难", "斑驳陆离", "舌战群儒", "舍本求末", "荒谬绝伦", "见异思迁", "诡计多端", "三从四德", "不可言传", "业精于勤", "忠孝节义", "才高八斗", "敌众我寡", "日甚一日", "破竹之势", "老鼠过街", "包藏祸心", "学而不厌", "归去来兮", "打家劫舍", "杀人如麻", "不忍卒读", "五谷不分", "怨气冲天", "愚不可及", "无名小卒", "百万雄师", "黄袍加身", "不知好歹", "呼天抢地", "如切如磋", "愁肠百结", "欢蹦乱跳", "水木清华", "海枯石烂", "秦晋之好", "竹篮打水", "萧规曹随", "近乡情怯", "非我族类", "一清二白", "一片焦土", "临渊羡鱼", "任其自然", "削铁如泥", "前思后想", "太平无事", "戎马倥偬", "抱头鼠窜", "流落他乡", "溢美之辞", "理屈词穷", "虎口拔牙", "虎背熊腰", "天大地大", "天荒地老", "收之桑榆", "有害无利", "死不悔改", "流芳千古", "老奸巨猾", "触目皆是", "遁入空门", "邪门歪道", "面如土色", "七扭八歪", "不分胜负", "了若指掌", "云泥之别", "低吟浅唱", "利害相关", "力不能及", "呼朋唤友", "忘年之交", "无影无形", "粗中有细", "踟蹰不前", "人生如梦", "以德报德", "以绝后患", "初露头角", "十室九空", "十指连心", "干脆利索", "打落水狗", "溜须拍马", "离题万里", "聚少成多", "誉满天下", "七零八碎", "军令如山", "击中要害", "好心好意", "无所忌惮", "昏天暗地", "片言只语", "经天纬地", "驰骋疆场", "今夕何夕", "器宇轩昂", "失之东隅", "嫣然一笑", "披红戴花", "攀龙附凤", "攻其不备", "歃血为盟", "法力无边", "电光石火", "触景伤情", "计上心来", "轻如鸿毛", "龙蛇混杂", "一脉相通", "万寿无疆", "亲痛仇快", "傲然屹立", "吉星高照", "挨门挨户", "春风满面", "有头无尾", "未定之天", "父债子还", "生拉硬扯", "看家本事", "知我罪我", "秋毫无犯", "乐而忘返", "乳臭未干", "反攻倒算", "天人之际", "心口不一", "扭亏增盈", "未能免俗", "树大根深", "汪洋恣肆", "人困马乏", "低眉顺眼", "关门打狗", "各有所好", "天摇地动", "孝子贤孙", "徇情枉法", "故作高深", "故技重演", "斩尽杀绝", "有口难言", "洞天福地", "一己之见", "之乎者也", "事无大小", "协力同心", "士农工商", "天塌地陷", "山光水色", "心惊胆寒", "杜绝后患", "痴男怨女", "笑里藏刀", "血海深仇", "谈情说爱", "雁过留声", "不成体统", "丧家之犬", "习焉不察", "俯首帖耳", "兼善天下", "劳而无功", "哭天喊地", "回天之力", "左拥右抱", "恭贺新禧", "承欢膝下", "横扫千军", "混世魔王", "神气十足", "祸起萧墙", "翩翩少年", "荟萃一堂", "谋事在人", "财运亨通", "鹏程万里", "人烟稠密", "仪态万方", "各为其主", "四体不勤", "寻花问柳", "草莽英雄", "见所未见", "调和鼎鼐", "走马看花", "馋涎欲滴", "亘古未有", "以己度人", "余音袅袅", "先忧后乐", "公私兼顾", "恶语中伤", "敷衍搪塞", "暮鼓晨钟", "直抒己见", "要言不烦", "雄姿英发", "从容自如", "卑鄙无耻", "娓娓而谈", "无所不及", "明德惟馨", "春秋笔法", "洞房花烛", "浮皮潦草", "疾言厉色", "瞎子摸象", "碍手碍脚", "赏心乐事", "趁人之危", "踽踽独行", "防微虑远", "雍容大度", "不死不活", "丹凤朝阳", "人地生疏", "创业维艰", "老马识途", "英姿勃勃", "装傻充愣", "诡谲多变", "七弯八拐", "三年五载", "判若云泥", "城下之盟", "大有起色", "好言好语", "年深日久", "新人新事", "是非颠倒", "汗流满面", "狗尾续貂", "珠圆玉润", "裙带关系", "迟疑不决", "雕龙画凤", "一无所得", "举国一致", "仁心仁术", "付诸一炬", "借古喻今", "借花献佛", "弃恶从善", "摩肩擦踵", "日行千里", "用其所长", "金枝玉叶", "饱学之士", "高人一筹", "便宜行事", "动如脱兔", "坐怀不乱", "开山祖师", "恶语伤人", "男婚女嫁", "行将就木", "不可名状", "分身无术", "妖言惑众", "白面书生", "礼贤下士", "脱缰之马", "葬身鱼腹", "螳臂挡车", "言不及义", "阳关大道", "默默无言", "不可言喻", "不肖子孙", "似笑非笑", "声誉鹊起", "大厦将倾", "恃才傲物", "损人害己", "玄之又玄", "知彼知己", "秉笔直书", "纵横天下", "血债累累", "遗老遗少", "金声玉振", "不尴不尬", "人面桃花", "以此类推", "吹糠见米", "心比天高", "惟命是从", "敬业乐群", "无所不至", "气息奄奄", "洋洋大观", "琼浆玉液", "逝者如斯", "一望无边", "下逐客令", "克己复礼", "兴利除害", "别有滋味", "大慈大悲", "当耳边风", "情深似海", "扼腕长叹", "文人相轻", "明知故问", "曾经沧海", "泄露天机", "浓妆淡抹", "烈火烹油", "熔于一炉", "良莠不分", "衣香鬓影", "迟暮之年", "铁树开花", "须发皆白", "一无所成", "一点半点", "不敢问津", "大权旁落", "心如死灰", "心醉神迷", "慌作一团", "正正经经", "毁家纾难", "积非成是", "竭尽心力", "里通外国", "仰人鼻息", "当耳旁风", "此伏彼起", "浓荫蔽日", "皓首穷经", "福星高照", "能者多劳", "虎落平阳", "重温旧梦", "食古不化", "饮食男女", "五味俱全", "人非草木", "寂寂无闻", "巨细无遗", "晓以大义", "直捣黄龙", "神色自若", "绿林好汉", "良禽择木", "荒诞无稽", "语不惊人", "东风浩荡", "举止大方", "以身许国", "前俯后仰", "小国寡民", "巴山夜雨", "抱薪救火", "日上三竿", "生吞活剥", "还我河山", "连中三元", "酒池肉林", "长歌当哭", "黄发垂髫", "令人喷饭", "修桥补路", "呆头呆脑", "文武之道", "文治武功", "晨光熹微", "杀身成仁", "杳无踪迹", "棋高一着", "甘心情愿", "神乎其技", "罢黜百家", "长江天堑", "青面獠牙", "食不知味", "一往直前", "冥顽不灵", "博闻强记", "好色之徒", "始料不及", "寻根究底", "明心见性", "朝朝暮暮", "猖獗一时", "自高自大", "一鳞半爪", "儿女亲家", "兴味索然", "喷云吐雾", "嘉言懿行", "山水相连", "抱头大哭", "明眸皓齿", "海晏河清", "船坚炮利", "轻徭薄赋", "不教而诛", "兔死狐悲", "内圣外王", "大发慈悲", "天高地厚", "干柴烈火", "悬梁刺股", "清风明月", "遐迩闻名", "鲍鱼之肆", "不得善终", "和衣而卧", "天诛地灭", "姑妄听之", "屁滚尿流", "岁月蹉跎", "引车卖浆", "秣马厉兵", "铸成大错", "龙生九子", "不仁不义", "仪态万千", "修心养性", "富贵荣华", "无所用心", "沉心静气", "百无一用", "百花争妍", "胆小如鼠", "风流才子", "人多嘴杂", "养痈成患", "击楫中流", "寸步难移", "无人之境", "知恩报恩", "老有所终", "一时之选", "一望而知", "刨根究底", "图穷匕见", "多谋善断", "学海无涯", "帝王将相", "无名小辈", "月明星稀", "沉鱼落雁", "秉公办理", "虚应故事", "铭心刻骨", "闲言闲语", "雏鹰展翅", "饿殍遍野", "势如水火", "含笑九泉", "喊冤叫屈", "安邦定国", "惊喜交加", "气味相投", "永矢弗谖", "物换星移", "积谷防饥", "胯下之辱", "血性男儿", "闭月羞花", "三山五岳", "丹书铁券", "人才难得", "同气连枝", "愁云惨淡", "料事如神", "无关宏旨", "杞人之忧", "杯盘狼藉", "没齿难忘", "耳根清净", "若有所失", "讲经说法", "识文断字", "饱食终日", "不知就里", "倒果为因", "切齿痛恨", "参差错落", "天外飞来", "奇技淫巧", "子丑寅卯", "文人学士", "添枝加叶", "玉树琼枝", "钩心斗角", "仗义疏财", "怒火冲天", "惺惺作态", "改恶从善", "有约在先", "泰山北斗", "跃马扬鞭", "转弯抹角", "利害攸关", "夸父逐日", "威信扫地", "得陇望蜀", "曲里拐弯", "枉费心机", "没头苍蝇", "盖世英雄", "舍身求法", "踏破铁鞋", "遥遥相对", "长夜漫漫", "食不下咽", "不药而愈", "冲口而出", "刀枪剑戟", "在此一举", "大头小尾", "当断不断", "忠肝义胆", "成群结伙", "扶危救困", "暗箭伤人", "杳无踪影", "目不忍睹", "身无长物", "一天一地", "一触即溃", "不知凡几", "不识抬举", "力有未逮", "头昏目眩", "娓娓动听", "恩断义绝", "招蜂引蝶", "桃之夭夭", "油腔滑调", "济世救人", "海角天涯", "清廉正直", "源源而来", "熬更守夜", "片甲不留", "离奇古怪", "糟糠之妻", "邪不胜正", "七十二行", "亲如手足", "以直报怨", "十二金钗", "名垂千古", "唇红齿白", "如痴如狂", "水中捞月", "海底捞针", "百孔千疮", "空话连篇", "艺高胆大", "莫此为甚", "言人人殊", "谬种流传", "不落窠臼", "国无宁日", "官逼民反", "择邻而居", "明升暗降", "春花秋月", "求仁得仁", "沁人肺腑", "相沿成习", "相辅而行", "自命清高", "贼眉鼠眼", "酒后失言", "临危授命", "云谲波诡", "侧目而视", "光复旧物", "好事之徒", "渺无音讯", "独断独行", "班师回朝", "神机妙算", "秋水伊人", "筋疲力竭", "绫罗绸缎", "说长道短", "三妻四妾", "东跑西颠", "包罗万有", "居大不易", "水性杨花", "海阔天高", "罪恶滔天", "胡服骑射", "行有余力", "魂不附体", "不知轻重", "参差不一", "夸父追日", "无可讳言", "肥头大耳", "鼎足而立", "万古流芳", "不知死活", "乐天知命", "好整以暇", "宁折不弯", "废话连篇", "归根结蒂", "敬谢不敏", "月下老人", "男盗女娼", "碧空万里", "结发夫妻", "绣花枕头", "视如珍宝", "剑胆琴心", "匹夫之勇", "另请高明", "明镜高悬", "束手待毙", "移山填海", "穷且益坚", "自轻自贱", "蓬荜生辉", "赤地千里", "乘龙快婿", "争前恐后", "宵衣旰食", "形容憔悴", "拆东补西", "日月如梭", "灿若繁星", "空谷幽兰", "穿凿附会", "视同儿戏", "不名一文", "不矜细行", "不足为训", "东郭先生", "分文不值", "割据一方", "同心戮力", "坐地分赃", "奉天承运", "定于一尊", "宛转悠扬", "开物成务", "放火烧山", "敬老尊贤", "极而言之", "百废待举", "看菜吃饭", "竹报平安", "红颜薄命", "花香鸟语", "衣不解带", "身历其境", "躬行实践", "过而能改", "饱经风雨", "一个半个", "令人齿冷", "低声细语", "养家活口", "前倨后恭", "千山万壑", "四面受敌", "宏图大志", "小康之家", "强奸民意", "感慨系之", "所见略同", "明媒正娶", "视为儿戏", "躬逢其盛", "雨打风吹", "不辨真伪", "人穷志短", "借古讽今", "光可鉴人", "兵不厌诈", "千门万户", "地灵人杰", "始终不懈", "嫁狗随狗", "支吾其词", "星移斗转", "来去无踪", "混淆黑白", "物阜民丰", "长幼尊卑", "不吝赐教", "俯首听命", "双宿双飞", "家贫如洗", "尽释前嫌", "狼奔豕突", "琼楼玉宇", "粥少僧多", "长风破浪", "鲜衣怒马", "龙盘虎踞", "决一胜负", "回肠荡气", "宽宏大度", "弹尽援绝", "彼此彼此", "有眼无珠", "死乞白赖", "每下愈况", "物伤其类", "祛病延年", "福寿双全", "述而不作", "非驴非马", "额手称庆", "一碧万顷", "万头攒动", "不如归去", "天打雷劈", "惟我独尊", "明月清风", "月朗星稀", "碧血丹心", "袒胸露背", "认贼作父", "走为上策", "身心交瘁", "雀屏中选", "买空卖空", "加官进爵", "孤魂野鬼", "山摇地动", "感恩图报", "料峭春寒", "束手无措", "游必有方", "率土之滨", "袅袅婷婷", "锦绣江山", "争强斗狠", "先入之见", "天涯咫尺", "寻踪觅迹", "笔墨官司", "绝代佳人", "聪明睿智", "铮铮铁汉", "隔墙有耳", "一曝十寒", "半懂不懂", "博闻强识", "厚古薄今", "同心共济", "吴下阿蒙", "应答如流", "惠而不费", "慎终如始", "斜风细雨", "无所不通", "月朗风清", "有勇无谋", "有来无回", "杳无人烟", "正心诚意", "百川归海", "蚕食鲸吞", "远亲近邻", "鸡鸣犬吠", "一语破的", "世态人情", "书香人家", "俯仰之间", "冰雪聪明", "奴颜婢膝", "好学不倦", "尊姓大名", "幕天席地", "忠孝两全", "暮色苍茫", "河清海晏", "海底捞月", "百业萧条", "破门而出", "虎踞龙盘", "郁郁苍苍", "鱼贯而行", "事缓则圆", "假手于人", "凿壁偷光", "半新不旧", "抱打不平", "朴素无华", "美人迟暮", "车载斗量", "遥遥在望", "隐名埋姓", "颠来倒去", "一言为定", "不足为凭", "以战养战", "传为笑谈", "冰雪严寒", "名震一时", "四海升平", "地利人和", "山长水远", "岁寒三友", "心灰意懒", "怪模怪样", "愣头愣脑", "撒泼打滚", "无可置喙", "是非得失", "暗箭难防", "狗拿耗子", "环肥燕瘦", "立功赎罪", "能掐会算", "蟾宫折桂", "谈笑自如", "进退有度", "难乎其难", "不容置喙", "令人起敬", "以丰补歉", "倚强凌弱", "八面威风", "公平正直", "君臣佐使", "堂皇富丽", "形影相吊", "急不及待", "投鞭断流", "昏头昏脑", "有闻必录", "止戈为武", "瞎子摸鱼", "福寿康宁", "股掌之上", "茕茕孑立", "豁达大度", "黯然销魂", "不过尔尔", "人多手杂", "以人为鉴", "八方支持", "古稀之年", "垂手可得", "夜阑人静", "子为父隐", "寸草春晖", "慎重其事", "浑身是胆", "狗仗人势", "纯属骗局", "绕梁三日", "脑满肠肥", "贪财好色", "逞强好胜", "酣然入梦", "一无所长", "举止言谈", "云消雾散", "人模狗样", "区区小事", "大巧若拙", "尺寸之功", "挨门逐户", "敢怒敢言", "文武全才", "无补于事", "时移势易", "朝秦暮楚", "柔肠寸断", "沾花惹草", "画中有诗", "罪该万死", "羽扇纶巾", "肝脑涂地", "虽死犹生", "一唱三叹", "一箭之遥", "万世师表", "万语千言", "东歪西倒", "别树一帜", "地动山摇", "好声好气", "弹指之间", "心口如一", "敏而好学", "有耻且格", "杏花春雨", "母慈子孝", "用尽心机", "祸福相依", "细微末节", "草蛇灰线", "长生不死", "不相为谋", "五方杂处", "交口赞誉", "前车可鉴", "十字街口", "吉凶祸福", "名缰利锁", "奉为至宝", "才疏学浅", "泛泛之交", "流年似水", "浮生若梦", "混混沌沌", "父为子隐", "狂风恶浪", "诲淫诲盗", "音容宛在", "顾盼生辉", "鱼肉乡里", "鸡鸣狗吠", "人世沧桑", "低头哈腰", "别来无恙", "卖国求荣", "安家乐业", "心无挂碍", "手疾眼快", "改弦易张", "有凤来仪", "来处不易", "狂涛巨浪", "瓜分豆剖", "百年之好", "相机而动", "置之死地", "赤身露体", "逼人太甚", "钟鸣鼎食", "一男半女", "为善最乐", "人事不知", "债多不愁", "养虎遗患", "嫉贤妒能", "寓意深长", "旭日初升", "春满人间", "楼台亭阁", "深信不疑", "清静无为", "白云苍狗", "老于世故", "诗中有画", "谈笑自若", "转战千里", "锄强扶弱", "阴曹地府", "鹊巢鸠占", "不分轩轾", "偏信则暗", "十字街头", "即兴之作", "响遏行云", "庄周梦蝶", "忸怩作态", "我见犹怜", "极目远望", "海不扬波", "焚膏继晷", "用兵如神", "百花生日", "相形失色", "知情不举", "积年累月", "观者如云", "调和阴阳", "辩才无碍", "霄壤之别", "义结金兰", "兄友弟恭", "如丧考妣", "寻根问底", "敲骨吸髓", "有口无心", "横行天下", "正直无私", "流言飞语", "罪恶深重", "翩若惊鸿", "七窍生烟", "人寿年丰", "以身试险", "公道合理", "凤凰于飞", "出将入相", "口蜜腹剑", "开花结实", "披沙拣金", "明眸善睐", "是非之心", "略高一筹", "百般折磨", "离乡别井", "落草为寇", "血口喷人", "衣冠禽兽", "衮衮诸公", "说千道万", "财不露白", "送往迎来", "避实击虚", "问鼎中原", "雕栏玉砌", "青枝绿叶", "首尾两端", "一片冰心", "六道轮回", "刀山火海", "初试锋芒", "刻骨仇恨", "奸淫掳掠", "弄巧反拙", "摇尾乞怜", "柳绿花红", "死不足惜", "水光山色", "永垂青史", "畸重畸轻", "积小成大", "自愧弗如", "足不出门", "以古为镜", "佶屈聱牙", "决一雌雄", "哭天抹泪", "大仁大义", "夫子自道", "小人得志", "引以为耻", "徐娘半老", "扬幡招魂", "民胞物与", "煞费心机", "狗头军师", "硕大无朋", "神思恍惚", "穷奢极侈", "笼中之鸟", "绿肥红瘦", "莫可奈何", "贵在知心", "走为上计", "铁壁铜墙", "驽马十驾", "不值一哂", "不识好歹", "借坡下驴", "儿女情长", "刁钻古怪", "十二万分", "危急存亡", "四方八面", "太平盛世", "将功赎罪", "弃如敝屣", "得意之色", "火上添油", "百读不厌", "私心杂念", "称心满意", "篡党夺权", "芬芳馥郁", "草草收兵", "藏头露尾", "鼎足之势", "一孔之见", "一物不知", "两虎相争", "喃喃细语", "大吹大擂", "大谬不然", "屡次三番", "弥天大祸", "悠游自在", "残兵败将", "洞察秋毫", "深恶痛疾", "漫天开价", "相煎何急", "稍胜一筹", "聚讼纷纭", "蜚短流长", "贪小失大", "送旧迎新", "餐风露宿", "丢盔卸甲", "于今为烈", "以夷制夷", "六根清净", "宽大为怀", "排难解纷", "无从置喙", "白手兴家", "百足之虫", "诗礼传家", "轻于鸿毛", "雍容典雅", "非分之想", "驻颜有术", "不足为据", "丑态毕露", "后悔不及", "坦然自若", "少安毋躁", "崛地而起", "戴高帽子", "晓风残月", "森严壁垒", "涕泪交加", "相反相成", "神不守舍", "脉脉含情", "酒囊饭袋", "金口玉言", "不求闻达", "不生不灭", "不蔓不枝", "史不绝书", "夜不成寐", "妇人之仁", "峨冠博带", "急如星火", "撒豆成兵", "新来乍到", "杀鸡骇猴", "血染沙场", "饱经忧患", "首善之地", "一枕黄粱", "不无小补", "勇者不惧", "唾面自干", "官样文章", "宝马香车", "心焦如焚", "意在言外", "所费不赀", "期期艾艾", "法不阿贵", "浩浩汤汤", "猜拳行令", "真伪莫辨", "福无双至", "积毁销骨", "缩衣节食", "脸红耳赤", "转忧为喜", "轻装简从", "逢山开道", "青灯黄卷", "一笑一颦", "三宫六院", "五里雾中", "众口相传", "余味无穷", "倏忽之间", "借贷无门", "命里注定", "天不作美", "天清气朗", "开国元老", "放纵不羁", "数见不鲜", "整军经武", "文采风流", "犯上作乱", "知人论世", "老羞成怒", "言笑晏晏", "追根求源", "金刚怒目", "铁嘴钢牙", "骨肉至亲", "万里长征", "三拳两脚", "不避艰险", "亦复如是", "以守为攻", "少不经事", "恒河沙数", "打铁趁热", "拒人千里", "旁枝末节", "无隙可乘", "父母之邦", "狼心狗肺", "离合悲欢", "绳锯木断", "艰深晦涩", "血泪斑斑", "见利思义", "谆谆善诱", "过路财神", "酒肉朋友", "闭门读书", "霞光万道", "面如死灰", "驰名天下", "何足挂齿", "别有天地", "半文半白", "大有可观", "夹枪带棒", "寓情于景", "岁月不居", "弃旧图新", "恻隐之心", "惊慌失色", "掎角之势", "无始无终", "旷世奇才", "曲不离口", "栉比鳞次", "狗屁不通", "百废俱兴", "稀世之宝", "要而言之", "议论纷纭", "豺狼虎豹", "迁怒于人", "进道若退", "香车宝马", "一日三省", "东游西逛", "临渴掘井", "仰之弥高", "位极人臣", "兔死狗烹", "凭空捏造", "别出新意", "哀兵必胜", "四肢百骸", "存而不论", "寻章摘句", "形销骨立", "截长补短", "深宅大院", "生死不渝", "痛入骨髓", "苦海无边", "荒唐无稽", "莫可名状", "莫测高深", "趑趄不前", "酒色财气", "雪泥鸿爪", "一口一声", "下笔千言", "人情世态", "从容自若", "再三再四", "冷血动物", "剑及履及", "囊萤映雪", "大得人心", "安如泰山", "寝不安席", "开门揖盗", "志大才疏", "愧不敢当", "文房四宝", "斩关夺隘", "油光可鉴", "清闲自在", "瞒上欺下", "纷纷攘攘", "若明若暗", "豪放不羁", "风月无边", "一往而深", "万万千千", "临机应变", "为人作嫁", "予取予夺", "争妍斗艳", "余音缭绕", "千金一诺", "大发议论", "大喊大叫", "姑妄言之", "密不通风", "弥天大罪", "拉拉杂杂", "日月经天", "显露头角", "步人后尘", "江天一色", "沉郁顿挫", "油光水滑", "滴水成河", "索然寡味", "蛇蝎心肠", "贼头贼脑", "风流云散", "不容置辩", "不揣冒昧", "不测之忧", "东摇西摆", "东游西荡", "乐而不淫", "俯仰无愧", "入地无门", "兵多将广", "兵无常势", "再造之恩", "加油添醋", "和光同尘", "大中至正", "天差地远", "巫山云雨", "异香扑鼻", "恩怨分明", "抚今思昔", "浪迹江湖", "爱财如命", "牛高马大", "独往独来", "生财之道", "百岁之后", "笔酣墨饱", "管鲍之交", "老之将至", "能者为师", "薪尽火传", "虱多不痒", "视死如生", "言出法随", "誓死不屈", "说东道西", "顿足捶胸", "骨肉离散", "人之常情", "含英咀华", "好善乐施", "安步当车", "宾客如云", "密密层层", "对症之药", "摇唇鼓舌", "旧调重弹", "昼伏夜行", "杜鹃啼血", "来回来去", "来者可追", "炼石补天", "相机行事", "瞬息之间", "程门立雪", "自出机杼", "自我吹嘘", "自我陶醉", "诱敌深入", "风土人情", "饿虎扑食", "骨肉相残", "一笔抹杀", "三十六行", "人弃我取", "十目所视", "卓然不群", "名重一时", "吹牛拍马", "周公吐哺", "外方内圆", "妙手偶得", "富商大贾", "推三推四", "放马后炮", "断线风筝", "无人之地", "无可名状", "杳如黄鹤", "浓眉大眼", "瘦骨如柴", "竖子成名", "胸无点墨", "膏腴之地", "舍己为公", "芝兰之室", "荦荦大者", "蓬生麻中", "误入歧途", "诸恶莫作", "载沉载浮", "道路以目", "酒后无德", "钻心刺骨", "顾盼生姿", "五行八作", "人间天上", "仁义之师", "众怒难犯", "功高震主", "名山胜水", "外刚内柔", "奇光异彩", "小户人家", "尖嘴猴腮", "山南海北", "弃若敝屣", "急赤白脸", "无所不晓", "无风起浪", "昏头转向", "江河行地", "沐猴而冠", "沧海遗珠", "油头粉面", "焚林而猎", "瓦釜雷鸣", "疮痍满目", "白璧无瑕", "白色恐怖", "皇天后土", "直认不讳", "碎尸万段", "舍身为国", "茫无头绪", "落落大方", "谓予不信", "败军之将", "适逢其会", "露水夫妻", "顺时而动", "风行草偃", "香火不绝", "鼎新革故", "龙潭虎穴", "万死不辞", "下车伊始", "不情之请", "不违农时", "东征西讨", "云中白鹤", "人心大快", "人情之常", "人面兽心", "创巨痛深", "嘻皮笑脸", "天兵天将", "婆娑起舞", "屏声静气", "恶声恶气", "成败利钝", "扬名四海", "抽刀断水", "拈花微笑", "捉刀代笔", "梅妻鹤子", "流水无情", "流离颠沛", "深山幽谷", "游目骋怀", "焚琴煮鹤", "稗官野史", "花花世界", "表里一致", "超凡入圣", "过门不入", "长乐未央", "黯然伤神", "一掷百万", "一误再误", "不见经传", "串亲访友", "人心难测", "克己慎行", "八万四千", "千依百顺", "千姿万态", "千难万苦", "君子固穷", "喟然长叹", "大张声势", "大题小做", "小手小脚", "忍辱偷生", "挂冠求去", "敬若神明", "断井颓垣", "有进无退", "玉洁冰清", "盘根问底", "知止不殆", "罪魁祸首", "耸入云霄", "芙蓉出水", "蚍蜉撼树", "血盆大口", "衣锦夜行", "视为知己", "转悲为喜", "过河卒子", "进德修业", "追根问底", "非同儿戏", "风吹云散", "鲸吞蚕食", "一时三刻", "不识大体", "临事而惧", "人来客往", "以古喻今", "传诵一时", "卖文为生", "呵欠连天", "四时八节", "地覆天翻", "多言多语", "大放悲声", "威风扫地", "形只影单", "慨然应允", "持盈保泰", "指腹为婚", "梦幻泡影", "民生在勤", "没轻没重", "治丝益棼", "清风两袖", "甘居人后", "由衷之言", "知命之年", "穷极无聊", "窥豹一斑", "终成泡影", "绝路逢生", "虎口逃生", "视民如伤", "迟疑不定", "顾盼自雄", "风中之烛", "骄兵必败", "一无所求", "一蹴可几", "中外合璧", "事出无奈", "以古为鉴", "假仁假义", "取精用宏", "口出不逊", "吉人天相", "安邦治国", "小时了了", "形格势禁", "慷慨赴义", "民贵君轻", "气喘如牛", "漫天遍野", "激昂慷慨", "爽心悦目", "犁庭扫穴", "目无尊长", "眼明心亮", "瞠乎其后", "穷山僻壤", "穿红着绿", "肆虐横行", "行成于思", "规行矩步", "计上心头", "载舟覆舟", "连战皆捷", "选贤举能", "险遭不测", "鞍马劳顿", "鸾凤和鸣", "麻姑献寿", "七步成诗", "不徐不疾", "丝竹管弦", "临深履薄", "乱臣贼子", "仓皇失措", "千秋万世", "历历可见", "和气致祥", "坐拥书城", "天理昭昭", "头角峥嵘", "如坐春风", "孺子可教", "履险如夷", "开科取士", "怀璧其罪", "意义深长", "成千成万", "文理不通", "易地而处", "星星点点", "未为不可", "残渣余孽", "水碧山青", "漫无止境", "牛之一毛", "留恋不舍", "空谷足音", "纡尊降贵", "羽毛丰满", "臧否人物", "迎神赛会", "食言而肥", "骨鲠在喉", "黄口小儿", "一隅之地", "三朋四友", "不可言状", "不知所言", "五短身材", "五马分尸", "亢龙有悔", "以管窥豹", "出师有名", "刀光血影", "切磋琢磨", "反哺之情", "塞北江南", "年高德劭", "怨天怨地", "扬清抑浊", "挖肉补疮", "操纵自如", "擒贼擒王", "放浪不羁", "无功受禄", "旦夕之间", "有案可稽", "欺人之谈", "殚精竭力", "求神问卜", "江汉朝宗", "瓮声瓮气", "目迷五色", "老王卖瓜", "自由泛滥", "荒淫无道", "观者云集", "观者如堵", "进身之阶", "逐句逐字", "饕餮之徒", "鹅毛大雪", "一瓣心香", "一言中的", "不差毫厘", "乘隙而入", "仰不愧天", "免开尊口", "出于意外", "初生之犊", "千峰万壑", "半壁河山", "博学多闻", "口含天宪", "名士风流", "含血喷人", "听其自然", "吴头楚尾", "夫贵妻荣", "存亡续绝", "宠辱皆忘", "富贵逼人", "忧谗畏讥", "慨当以慷", "抑郁寡欢", "李广难封", "杯中之物", "杳无人迹", "杳无消息", "毫无逊色", "牛头马面", "犀牛望月", "百折不屈", "百折千回", "知足不辱", "础润而雨", "肤如凝脂", "见风转舵", "贫贱不移", "踌躇不决", "青山不老", "面无人色", "风行水上", "高头讲章", "鬼头鬼脑", "黄钟毁弃", "黑白混淆", "一箭之地", "万贯家财", "不关痛痒", "不差上下", "关心民瘼", "可乘之隙", "吉日良辰", "名实相副", "夙夜匪懈", "天理人情", "寂然无声", "恩威并重", "惩一儆百", "慷慨激扬", "才德兼备", "朗朗乾坤", "欲扬先抑", "母以子贵", "求过于供", "沦落风尘", "泥古不化", "玉液琼浆", "田连阡陌", "画栋雕梁", "百弊丛生", "目不忍视", "睥睨一切", "笨嘴拙舌", "经纬万端", "罚不当罪", "肉眼凡胎", "薄技在身", "装潢门面", "诚心正意", "谈天论地", "迟疑观望", "铜壶滴漏", "青灯古佛", "马前泼水", "一悲一喜", "三寸之舌", "三心两意", "不改其乐", "不知肉味", "东扯西拉", "九死不悔", "人多口杂", "人心叵测", "冯唐易老", "出乖露丑", "刻画入微", "大度包容", "大肆铺张", "天王老子", "奇花异卉", "好骑者堕", "小惩大诫", "左右两难", "庐山真面", "心神恍惚", "手脚干净", "报仇雪耻", "晕晕沉沉", "曲意迎合", "月圆花好", "未竟之志", "权倾天下", "梦笔生花", "洒扫应对", "活龙活现", "略窥一斑", "知遇之恩", "翩翩公子", "草率从事", "解民倒悬", "避难就易", "酒绿灯红", "铁马金戈", "飞珠溅玉", "饱以老拳", "鸟尽弓藏", "鼻孔朝天", "东藏西躲", "久闻大名", "五劳七伤", "仆仆风尘", "付诸一笑", "半生半熟", "半饥半饱", "吟风弄月", "啼饥号寒", "国富民安", "声气相通", "天不假年", "天堂地狱", "如之奈何", "开合自如", "徒托空言", "性命交关", "教导有方", "整旧如新", "日暮途穷", "月晕而风", "月白风清", "杯觥交错", "枭首示众", "涕泗横流", "漫天叫价", "相忍为国", "翩翩风度", "肉食者鄙", "胶柱鼓瑟", "苟且偷安", "茫然若失", "识途老马", "负重致远", "追风逐日", "铁画银钩", "雪里送炭", "风刀霜剑", "饶有风趣", "骇浪惊涛", "龙精虎猛", "一丘一壑", "一命归西", "一言兴邦", "不可胜计", "不服水土", "不贪为宝", "不露锋芒", "举措失当", "乐业安居", "人欢马叫", "以勤补拙", "信赏必罚", "勇冠三军", "卑鄙龌龊", "博采众议", "吐气扬眉", "喘息未定", "大地春回", "好生之德", "威震天下", "官官相卫", "宜室宜家", "宦海浮沉", "富贵不淫", "市井无赖", "心急如火", "恍如梦境", "悠悠荡荡", "惟精惟一", "憎爱分明", "打躬作揖", "月满则亏", "有隙可乘", "桂子飘香", "残汤剩饭", "民不畏死", "民膏民脂", "清新俊逸", "百万雄兵", "离情别绪", "缩头缩脑", "老僧入定", "脸红耳热", "英姿焕发", "言简意深", "话里带刺", "迁客骚人", "酒醉饭饱", "量才录用", "陈陈相因", "面有菜色", "风清月朗", "鬼话连篇", "鼻青眼肿", "一路货色", "严于律已", "乐以忘忧", "乱世英雄", "从宽发落", "偶一为之", "允执厥中", "光风霁月", "嚣张一时", "因循苟且", "大人先生", "奉为楷模", "孤儿寡妇", "寻幽探胜", "将功折罪", "引以为憾", "心旌摇曳", "慎始敬终", "扇枕温衾", "搬石砸脚", "明珠暗投", "有负众望", "有财有势", "柔肠百转", "桑间濮上", "横眉怒目", "武艺超群", "殿堂楼阁", "烽火四起", "片瓦不留", "狂涛骇浪", "王祥卧冰", "生而知之", "男女老幼", "相时而动", "神闲气定", "福地洞天", "秋月春风", "等因奉此", "藏之名山", "金鼓齐鸣", "音信杳无", "香草美人", "齐驱并进", "一字之师", "亡国之音", "以心传心", "儿女之情", "关山阻隔", "凌云之志", "出敌不意", "剜肉补疮", "千古不朽", "千古罪人", "南征北讨", "却之不恭", "各有所短", "吉凶未卜", "味如嚼蜡", "哀哀父母", "喜逐颜开", "安如磐石", "将本求利", "怙恶不悛", "急人之困", "拈花一笑", "摧眉折腰", "无踪无影", "无边无垠", "日月无光", "昂头挺胸", "星月交辉", "朝生暮死", "榆木疙瘩", "求贤如渴", "治国安民", "涕泪交流", "清风朗月", "满脸春风", "神完气足", "绝世佳人", "羊续悬鱼", "聊备一格", "脚不点地", "荦荦大端", "贿赂公行", "过目成诵", "逸趣横生", "门户之争", "降尊纡贵", "颠簸不破", "餐风饮露", "齐家治国", "一身二任", "万古长存", "万应灵药", "不厌其详", "不咎既往", "不顾死活", "丰姿绰约", "丹青妙手", "为渊驱鱼", "众寡悬殊", "傻头傻脑", "光焰万丈", "凤凰来仪", "出师无名", "别无长物", "卧床不起", "叨陪末座", "国而忘家", "墙头马上", "存心不良", "将门虎子", "山鸣谷应", "年深月久", "张皇失措", "抚掌大笑", "探赜索隐", "春风雨露", "枝节横生", "桃花流水", "案牍劳形", "残花败柳", "毁誉不一", "永生永世", "没头没脸", "济世安邦", "济困扶危", "涂炭生灵", "片瓦无存", "片言只字", "犬马之劳", "瓜瓞绵绵", "相煎太急", "知足知止", "竭忠尽智", "竹篱茅舍", "笔下生花", "粉妆玉砌", "纵虎归山", "胜友如云", "臭名昭彰", "苦心积虑", "言必有据", "诗酒风流", "豺狼当道", "超然独立", "郁郁不乐", "鸢飞鱼跃", "一无可取", "万事亨通", "万应灵丹", "三三五五", "不知进退", "不立文字", "不虞之誉", "丹心碧血", "信笔涂鸦", "倾城倾国", "傲霜斗雪", "匹夫无罪", "十年生聚", "卖身投靠", "厚今薄古", "告贷无门", "子曰诗云", "扶弱抑强", "抑强扶弱", "挫骨扬灰", "损己利人", "推本溯源", "擦脂抹粉", "无头无尾", "气壮如牛", "沉思默想", "泛泛之谈", "洪福齐天", "满坑满谷", "爱钱如命", "神工鬼斧", "秋风落叶", "粉妆玉琢", "腹心之疾", "言近旨远", "诸子百家", "道骨仙风", "铭记不忘", "间不容发", "陌路相逢", "骑马找马", "骚人墨客", "齐烟九点", "一代楷模", "一字千钧", "一笔抹煞", "万目睽睽", "不世之功", "不亢不卑", "举贤任能", "乘热打铁", "井井有序", "以身报国", "你唱我和", "信口胡言", "兴致索然", "兵连祸结", "前程万里", "历历可数", "取义成仁", "呢喃细语", "坚苦卓绝", "多嘴多舌", "天公地道", "天随人愿", "安内攘外", "居无求安", "应付裕如", "应对如流", "悔之不及", "惊喜若狂", "手胼足胝", "报应不爽", "招降纳叛", "救灾恤患", "无事生事", "旧瓶新酒", "旷古未有", "朝乾夕惕", "杀鸡吓猴", "淡妆浓抹", "燕瘦环肥", "现世现报", "百媚千娇", "相逢恨晚", "福至心灵", "稳操胜算", "穷寇莫追", "穷形尽相", "穷愁潦倒", "纲纪废弛", "群而不党", "群起效尤", "荒淫无耻", "落落寡合", "蚁穴溃堤", "褒衣博带", "贪天之功", "超群出众", "轻诺寡信", "铮铮有声", "顺水顺风", "食而不化", "饮马长江", "骂不绝口", "一身是胆", "七折八扣", "不可终日", "不欺暗室", "与民更始", "世代书香", "丛山峻岭", "久经风霜", "人中之龙", "人心惟危", "仁民爱物", "仙山琼阁", "何足为奇", "何足道哉", "倾盆大雨", "出入人罪", "出没无常", "削职为民", "劈风斩浪", "勃然变色", "北门锁钥", "半新半旧", "反骄破满", "后生小子", "咸与维新", "大张挞伐", "奔走呼号", "康庄大道", "弦外之意", "曲突徙薪", "梨园子弟", "残暴不仁", "水月观音", "沉滓泛起", "没齿不忘", "流水行云", "浅斟低唱", "济世安民", "狂风怒号", "独运匠心", "琴心剑胆", "白衣秀士", "百端待举", "眼尖手快", "秀才造反", "羚羊挂角", "耐人咀嚼", "落拓不羁", "行己有耻", "袅袅娜娜", "讷言敏行", "逸兴遄飞", "隐恶扬善", "雨淋日晒", "面红耳热", "韦编三绝", "风流潇洒", "骨肉团圆", "一切众生", "一画开天", "七擒七纵", "万里鹏程", "不古不今", "不安于室", "不甘后人", "不知其详", "习非成是", "优胜劣败", "依法炮制", "八府巡按", "公诸同好", "冷水浇头", "力不能支", "功名富贵", "勾魂摄魄", "吴带当风", "天地不容", "天理良心", "如是我闻", "如芒刺背", "如花似锦", "如鸟兽散", "存亡绝续", "小试锋芒", "尧天舜日", "怒形于色", "悔罪自新", "惊喜交集", "惊才绝艳", "扬清激浊", "授受不亲", "改名易姓", "改过迁善", "攻其无备", "日丽风和", "横槊赋诗", "水月镜花", "渔人之利", "牵牛织女", "珍馐美馔", "看风使舵", "破玩意儿", "粗通文墨", "绿叶成荫", "翻箱倒箧", "老弱残兵", "聪明一世", "胸有丘壑", "至亲骨肉", "良知良能", "补偏救弊", "见机而作", "贻人口实", "达官显宦", "近在眉睫", "连日连夜", "里勾外连", "非分之财", "顺水行舟", "鼎足而三"]
// const lowerCaseWordArray: string[] = ["cigar", "rebut", "sissy", "humph", "awake", "blush", "focal", "evade", "naval", "serve", "heath", "dwarf", "model", "karma", "stink", "grade", "quiet", "bench", "abate", "feign", "major", "death", "fresh", "crust", "stool", "colon", "abase", "marry", "react", "batty", "pride", "floss", "helix", "croak", "staff", "paper", "unfed", "whelp", "trawl", "outdo", "adobe", "crazy", "sower", "repay", "digit", "crate", "cluck", "spike", "mimic", "pound", "maxim", "linen", "unmet", "flesh", "booby", "forth", "first", "stand", "belly", "ivory", "seedy", "print", "yearn", "drain", "bribe", "stout", "panel", "crass", "flume", "offal", "agree", "error", "swirl", "argue", "bleed", "delta", "flick", "totem", "wooer", "front", "shrub", "parry", "biome", "lapel", "start", "greet", "goner", "golem", "lusty", "loopy", "round", "audit", "lying", "gamma", "labor", "islet", "civic", "forge", "corny", "moult", "basic", "salad", "agate", "spicy", "spray", "essay", "fjord", "spend", "kebab", "guild", "aback", "motor", "alone", "hatch", "hyper", "thumb", "dowry", "ought", "belch", "dutch", "pilot", "tweed", "comet", "jaunt", "enema", "steed", "abyss", "growl", "fling", "dozen", "boozy", "erode", "world", "gouge", "click", "briar", "great", "altar", "pulpy", "blurt", "coast", "duchy", "groin", "fixer", "group", "rogue", "badly", "smart", "pithy", "gaudy", "chill", "heron", "vodka", "finer", "surer", "radio", "rouge", "perch", "retch", "wrote", "clock", "tilde", "store", "prove", "bring", "solve", "cheat", "grime", "exult", "usher", "epoch", "triad", "break", "rhino", "viral", "conic", "masse", "sonic", "vital", "trace", "using", "peach", "champ", "baton", "brake", "pluck", "craze", "gripe", "weary", "picky", "acute", "ferry", "aside", "tapir", "troll", "unify", "rebus", "boost", "truss", "siege", "tiger", "banal", "slump", "crank", "gorge", "query", "drink", "favor", "abbey", "tangy", "panic", "solar", "shire", "proxy", "point", "robot", "prick", "wince", "crimp", "knoll", "sugar", "whack", "mount", "perky", "could", "wrung", "light", "those", "moist", "shard", "pleat", "aloft", "skill", "elder", "frame", "humor", "pause", "ulcer", "ultra", "robin", "cynic", "agora", "aroma", "caulk", "shake", "pupal", "dodge", "swill", "tacit", "other", "thorn", "trove", "bloke", "vivid", "spill", "chant", "choke", "rupee", "nasty", "mourn", "ahead", "brine", "cloth", "hoard", "sweet", "month", "lapse", "watch", "today", "focus", "smelt", "tease", "cater", "movie", "lynch", "saute", "allow", "renew", "their", "slosh", "purge", "chest", "depot", "epoxy", "nymph", "found", "shall", "harry", "stove", "lowly", "snout", "trope", "fewer", "shawl", "natal", "fibre", "comma", "foray", "scare", "stair", "black", "squad", "royal", "chunk", "mince", "slave", "shame", "cheek", "ample", "flair", "foyer", "cargo", "oxide", "plant", "olive", "inert", "askew", "heist", "shown", "zesty", "hasty", "trash", "fella", "larva", "forgo", "story", "hairy", "train", "homer", "badge", "midst", "canny", "fetus", "butch", "farce", "slung", "tipsy", "metal", "yield", "delve", "being", "scour", "glass", "gamer", "scrap", "money", "hinge", "album", "vouch", "asset", "tiara", "crept", "bayou", "atoll", "manor", "creak", "showy", "phase", "froth", "depth", "gloom", "flood", "trait", "girth", "piety", "payer", "goose", "float", "donor", "atone", "primo", "apron", "blown", "cacao", "loser", "input", "gloat", "awful", "brink", "smite", "beady", "rusty", "retro", "droll", "gawky", "hutch", "pinto", "gaily", "egret", "lilac", "sever", "field", "fluff", "hydro", "flack", "agape", "wench", "voice", "stead", "stalk", "berth", "madam", "night", "bland", "liver", "wedge", "augur", "roomy", "wacky", "flock", "angry", "bobby", "trite", "aphid", "tryst", "midge", "power", "elope", "cinch", "motto", "stomp", "upset", "bluff", "cramp", "quart", "coyly", "youth", "rhyme", "buggy", "alien", "smear", "unfit", "patty", "cling", "glean", "label", "hunky", "khaki", "poker", "gruel", "twice", "twang", "shrug", "treat", "unlit", "waste", "merit", "woven", "octal", "needy", "clown", "widow", "irony", "ruder", "gauze", "chief", "onset", "prize", "fungi", "charm", "gully", "inter", "whoop", "taunt", "leery", "class", "theme", "lofty", "tibia", "booze", "alpha", "thyme", "eclat", "doubt", "parer", "chute", "stick", "trice", "alike", "sooth", "recap", "saint", "liege", "glory", "grate", "admit", "brisk", "soggy", "usurp", "scald", "scorn", "leave", "twine", "sting", "bough", "marsh", "sloth", "dandy", "vigor", "howdy", "enjoy", "valid", "ionic", "equal", "unset", "floor", "catch", "spade", "stein", "exist", "quirk", "denim", "grove", "spiel", "mummy", "fault", "foggy", "flout", "carry", "sneak", "libel", "waltz", "aptly", "piney", "inept", "aloud", "photo", "dream", "stale", "vomit", "ombre", "fanny", "unite", "snarl", "baker", "there", "glyph", "pooch", "hippy", "spell", "folly", "louse", "gulch", "vault", "godly", "threw", "fleet", "grave", "inane", "shock", "crave", "spite", "valve", "skimp", "claim", "rainy", "musty", "pique", "daddy", "quasi", "arise", "aging", "valet", "opium", "avert", "stuck", "recut", "mulch", "genre", "plume", "rifle", "count", "incur", "total", "wrest", "mocha", "deter", "study", "lover", "safer", "rivet", "funny", "smoke", "mound", "undue", "sedan", "pagan", "swine", "guile", "gusty", "equip", "tough", "canoe", "chaos", "covet", "human", "udder", "lunch", "blast", "stray", "manga", "melee", "lefty", "quick", "paste", "given", "octet", "risen", "groan", "leaky", "grind", "carve", "loose", "sadly", "spilt", "apple", "slack", "honey", "final", "sheen", "eerie", "minty", "slick", "derby", "wharf", "spelt", "coach", "erupt", "singe", "price", "spawn", "fairy", "jiffy", "filmy", "stack", "chose", "sleep", "ardor", "nanny", "niece", "woozy", "handy", "grace", "ditto", "stank", "cream", "usual", "diode", "valor", "angle", "ninja", "muddy", "chase", "reply", "prone", "spoil", "heart", "shade", "diner", "arson", "onion", "sleet", "dowel", "couch", "palsy", "bowel", "smile", "evoke", "creek", "lance", "eagle", "idiot", "siren", "built", "embed", "award", "dross", "annul", "goody", "frown", "patio", "laden", "humid", "elite", "lymph", "edify", "might", "reset", "visit", "gusto", "purse", "vapor", "crock", "write", "sunny", "loath", "chaff", "slide", "queer", "venom", "stamp", "sorry", "still", "acorn", "aping", "pushy", "tamer", "hater", "mania", "awoke", "brawn", "swift", "exile", "birch", "lucky", "freer", "risky", "ghost", "plier", "lunar", "winch", "snare", "nurse", "house", "borax", "nicer", "lurch", "exalt", "about", "savvy", "toxin", "tunic", "pried", "inlay", "chump", "lanky", "cress", "eater", "elude", "cycle", "kitty", "boule", "moron", "tenet", "place", "lobby", "plush", "vigil", "index", "blink", "clung", "qualm", "croup", "clink", "juicy", "stage", "decay", "nerve", "flier", "shaft", "crook", "clean", "china", "ridge", "vowel", "gnome", "snuck", "icing", "spiny", "rigor", "snail", "flown", "rabid", "prose", "thank", "poppy", "budge", "fiber", "moldy", "dowdy", "kneel", "track", "caddy", "quell", "dumpy", "paler", "swore", "rebar", "scuba", "splat", "flyer", "horny", "mason", "doing", "ozone", "amply", "molar", "ovary", "beset", "queue", "cliff", "magic", "truce", "sport", "fritz", "edict", "twirl", "verse", "llama", "eaten", "range", "whisk", "hovel", "rehab", "macaw", "sigma", "spout", "verve", "sushi", "dying", "fetid", "brain", "buddy", "thump", "scion", "candy", "chord", "basin", "march", "crowd", "arbor", "gayly", "musky", "stain", "dally", "bless", "bravo", "stung", "title", "ruler", "kiosk", "blond", "ennui", "layer", "fluid", "tatty", "score", "cutie", "zebra", "barge", "matey", "bluer", "aider", "shook", "river", "privy", "betel", "frisk", "bongo", "begun", "azure", "weave", "genie", "sound", "glove", "braid", "scope", "wryly", "rover", "assay", "ocean", "bloom", "irate", "later", "woken", "silky", "wreck", "dwelt", "slate", "smack", "solid", "amaze", "hazel", "wrist", "jolly", "globe", "flint", "rouse", "civil", "vista", "relax", "cover", "alive", "beech", "jetty", "bliss", "vocal", "often", "dolly", "eight", "joker", "since", "event", "ensue", "shunt", "diver", "poser", "worst", "sweep", "alley", "creed", "anime", "leafy", "bosom", "dunce", "stare", "pudgy", "waive", "choir", "stood", "spoke", "outgo", "delay", "bilge", "ideal", "clasp", "seize", "hotly", "laugh", "sieve", "block", "meant", "grape", "noose", "hardy", "shied", "drawl", "daisy", "putty", "strut", "burnt", "tulip", "crick", "idyll", "vixen", "furor", "geeky", "cough", "naive", "shoal", "stork", "bathe", "aunty", "check", "prime", "brass", "outer", "furry", "razor", "elect", "evict", "imply", "demur", "quota", "haven", "cavil", "swear", "crump", "dough", "gavel", "wagon", "salon", "nudge", "harem", "pitch", "sworn", "pupil", "excel", "stony", "cabin", "unzip", "queen", "trout", "polyp", "earth", "storm", "until", "taper", "enter", "child", "adopt", "minor", "fatty", "husky", "brave", "filet", "slime", "glint", "tread", "steal", "regal", "guest", "every", "murky", "share", "spore", "hoist", "buxom", "inner", "otter", "dimly", "level", "sumac", "donut", "stilt", "arena", "sheet", "scrub", "fancy", "slimy", "pearl", "silly", "porch", "dingo", "sepia", "amble", "shady", "bread", "friar", "reign", "dairy", "quill", "cross", "brood", "tuber", "shear", "posit", "blank", "villa", "shank", "piggy", "freak", "which", "among", "fecal", "shell", "would", "algae", "large", "rabbi", "agony", "amuse", "bushy", "copse", "swoon", "knife", "pouch", "ascot", "plane", "crown", "urban", "snide", "relay", "abide", "viola", "rajah", "straw", "dilly", "crash", "amass", "third", "trick", "tutor", "woody", "blurb", "grief", "disco", "where", "sassy", "beach", "sauna", "comic", "clued", "creep", "caste", "graze", "snuff", "frock", "gonad", "drunk", "prong", "lurid", "steel", "halve", "buyer", "vinyl", "utile", "smell", "adage", "worry", "tasty", "local", "trade", "finch", "ashen", "modal", "gaunt", "clove", "enact", "adorn", "roast", "speck", "sheik", "missy", "grunt", "snoop", "party", "touch", "mafia", "emcee", "array", "south", "vapid", "jelly", "skulk", "angst", "tubal", "lower", "crest", "sweat", "cyber", "adore", "tardy", "swami", "notch", "groom", "roach", "hitch", "young", "align", "ready", "frond", "strap", "puree", "realm", "venue", "swarm", "offer", "seven", "dryer", "diary", "dryly", "drank", "acrid", "heady", "theta", "junto", "pixie", "quoth", "bonus", "shalt", "penne", "amend", "datum", "build", "piano", "shelf", "lodge", "suing", "rearm", "coral", "ramen", "worth", "psalm", "infer", "overt", "mayor", "ovoid", "glide", "usage", "poise", "randy", "chuck", "prank", "fishy", "tooth", "ether", "drove", "idler", "swath", "stint", "while", "begat", "apply", "slang", "tarot", "radar", "credo", "aware", "canon", "shift", "timer", "bylaw", "serum", "three", "steak", "iliac", "shirk", "blunt", "puppy", "penal", "joist", "bunny", "shape", "beget", "wheel", "adept", "stunt", "stole", "topaz", "chore", "fluke", "afoot", "bloat", "bully", "dense", "caper", "sneer", "boxer", "jumbo", "lunge", "space", "avail", "short", "slurp", "loyal", "flirt", "pizza", "conch", "tempo", "droop", "plate", "bible", "plunk", "afoul", "savoy", "steep", "agile", "stake", "dwell", "knave", "beard", "arose", "motif", "smash", "broil", "glare", "shove", "baggy", "mammy", "swamp", "along", "rugby", "wager", "quack", "squat", "snaky", "debit", "mange", "skate", "ninth", "joust", "tramp", "spurn", "medal", "micro", "rebel", "flank", "learn", "nadir", "maple", "comfy", "remit", "gruff", "ester", "least", "mogul", "fetch", "cause", "oaken", "aglow", "meaty", "gaffe", "shyly", "racer", "prowl", "thief", "stern", "poesy", "rocky", "tweet", "waist", "spire", "grope", "havoc", "patsy", "truly", "forty", "deity", "uncle", "swish", "giver", "preen", "bevel", "lemur", "draft", "slope", "annoy", "lingo", "bleak", "ditty", "curly", "cedar", "dirge", "grown", "horde", "drool", "shuck", "crypt", "cumin", "stock", "gravy", "locus", "wider", "breed", "quite", "chafe", "cache", "blimp", "deign", "fiend", "logic", "cheap", "elide", "rigid", "false", "renal", "pence", "rowdy", "shoot", "blaze", "envoy", "posse", "brief", "never", "abort", "mouse", "mucky", "sulky", "fiery", "media", "trunk", "yeast", "clear", "skunk", "scalp", "bitty", "cider", "koala", "duvet", "segue", "creme", "super", "grill", "after", "owner", "ember", "reach", "nobly", "empty", "speed", "gipsy", "recur", "smock", "dread", "merge", "burst", "kappa", "amity", "shaky", "hover", "carol", "snort", "synod", "faint", "haunt", "flour", "chair", "detox", "shrew", "tense", "plied", "quark", "burly", "novel", "waxen", "stoic", "jerky", "blitz", "beefy", "lyric", "hussy", "towel", "quilt", "below", "bingo", "wispy", "brash", "scone", "toast", "easel", "saucy", "value", "spice", "honor", "route", "sharp", "bawdy", "radii", "skull", "phony", "issue", "lager", "swell", "urine", "gassy", "trial", "flora", "upper", "latch", "wight", "brick", "retry", "holly", "decal", "grass", "shack", "dogma", "mover", "defer", "sober", "optic", "crier", "vying", "nomad", "flute", "hippo", "shark", "drier", "obese", "bugle", "tawny", "chalk", "feast", "ruddy", "pedal", "scarf", "cruel", "bleat", "tidal", "slush", "semen", "windy", "dusty", "sally", "igloo", "nerdy", "jewel", "shone", "whale", "hymen", "abuse", "fugue", "elbow", "crumb", "pansy", "welsh", "syrup", "terse", "suave", "gamut", "swung", "drake", "freed", "afire", "shirt", "grout", "oddly", "tithe", "plaid", "dummy", "broom", "blind", "torch", "enemy", "again", "tying", "pesky", "alter", "gazer", "noble", "ethos", "bride", "extol", "decor", "hobby", "beast", "idiom", "utter", "these", "sixth", "alarm", "erase", "elegy", "spunk", "piper", "scaly", "scold", "hefty", "chick", "sooty", "canal", "whiny", "slash", "quake", "joint", "swept", "prude", "heavy", "wield", "femme", "lasso", "maize", "shale", "screw", "spree", "smoky", "whiff", "scent", "glade", "spent", "prism", "stoke", "riper", "orbit", "cocoa", "guilt", "humus", "shush", "table", "smirk", "wrong", "noisy", "alert", "shiny", "elate", "resin", "whole", "hunch", "pixel", "polar", "hotel", "sword", "cleat", "mango", "rumba", "puffy", "filly", "billy", "leash", "clout", "dance", "ovate", "facet", "chili", "paint", "liner", "curio", "salty", "audio", "snake", "fable", "cloak", "navel", "spurt", "pesto", "balmy", "flash", "unwed", "early", "churn", "weedy", "stump", "lease", "witty", "wimpy", "spoof", "saner", "blend", "salsa", "thick", "warty", "manic", "blare", "squib", "spoon", "probe", "crepe", "knack", "force", "debut", "order", "haste", "teeth", "agent", "widen", "icily", "slice", "ingot", "clash", "juror", "blood", "abode", "throw", "unity", "pivot", "slept", "troop", "spare", "sewer", "parse", "morph", "cacti", "tacky", "spool", "demon", "moody", "annex", "begin", "fuzzy", "patch", "water", "lumpy", "admin", "omega", "limit", "tabby", "macho", "aisle", "skiff", "basis", "plank", "verge", "botch", "crawl", "lousy", "slain", "cubic", "raise", "wrack", "guide", "foist", "cameo", "under", "actor", "revue", "fraud", "harpy", "scoop", "climb", "refer", "olden", "clerk", "debar", "tally", "ethic", "cairn", "tulle", "ghoul", "hilly", "crude", "apart", "scale", "older", "plain", "sperm", "briny", "abbot", "rerun", "quest", "crisp", "bound", "befit", "drawn", "suite", "itchy", "cheer", "bagel", "guess", "broad", "axiom", "chard", "caput", "leant", "harsh", "curse", "proud", "swing", "opine", "taste", "lupus", "gumbo", "miner", "green", "chasm", "lipid", "topic", "armor", "brush", "crane", "mural", "abled", "habit", "bossy", "maker", "dusky", "dizzy", "lithe", "brook", "jazzy", "fifty", "sense", "giant", "surly", "legal", "fatal", "flunk", "began", "prune", "small", "slant", "scoff", "torus", "ninny", "covey", "viper", "taken", "moral", "vogue", "owing", "token", "entry", "booth", "voter", "chide", "elfin", "ebony", "neigh", "minim", "melon", "kneed", "decoy", "voila", "ankle", "arrow", "mushy", "tribe", "cease", "eager", "birth", "graph", "odder", "terra", "weird", "tried", "clack", "color", "rough", "weigh", "uncut", "ladle", "strip", "craft", "minus", "dicey", "titan", "lucid", "vicar", "dress", "ditch", "gypsy", "pasta", "taffy", "flame", "swoop", "aloof", "sight", "broke", "teary", "chart", "sixty", "wordy", "sheer", "leper", "nosey", "bulge", "savor", "clamp", "funky", "foamy", "toxic", "brand", "plumb", "dingy", "butte", "drill", "tripe", "bicep", "tenor", "krill", "worse", "drama", "hyena", "think", "ratio", "cobra", "basil", "scrum", "bused", "phone", "court", "camel", "proof", "heard", "angel", "petal", "pouty", "throb", "maybe", "fetal", "sprig", "spine", "shout", "cadet", "macro", "dodgy", "satyr", "rarer", "binge", "trend", "nutty", "leapt", "amiss", "split", "myrrh", "width", "sonar", "tower", "baron", "fever", "waver", "spark", "belie", "sloop", "expel", "smote", "baler", "above", "north", "wafer", "scant", "frill", "awash", "snack", "scowl", "frail", "drift", "limbo", "fence", "motel", "ounce", "wreak", "revel", "talon", "prior", "knelt", "cello", "flake", "debug", "anode", "crime", "salve", "scout", "imbue", "pinky", "stave", "vague", "chock", "fight", "video", "stone", "teach", "cleft", "frost", "prawn", "booty", "twist", "apnea", "stiff", "plaza", "ledge", "tweak", "board", "grant", "medic", "bacon", "cable", "brawl", "slunk", "raspy", "forum", "drone", "women", "mucus", "boast", "toddy", "coven", "tumor", "truer", "wrath", "stall", "steam", "axial", "purer", "daily", "trail", "niche", "mealy", "juice", "nylon", "plump", "merry", "flail", "papal", "wheat", "berry", "cower", "erect", "brute", "leggy", "snipe", "sinew", "skier", "penny", "jumpy", "rally", "umbra", "scary", "modem", "gross", "avian", "greed", "satin", "tonic", "parka", "sniff", "livid", "stark", "trump", "giddy", "reuse", "taboo", "avoid", "quote", "devil", "liken", "gloss", "gayer", "beret", "noise", "gland", "dealt", "sling", "rumor", "opera", "thigh", "tonga", "flare", "wound", "white", "bulky", "etude", "horse", "circa", "paddy", "inbox", "fizzy", "grain", "exert", "surge", "gleam", "belle", "salvo", "crush", "fruit", "sappy", "taker", "tract", "ovine", "spiky", "frank", "reedy", "filth", "spasm", "heave", "mambo", "right", "clank", "trust", "lumen", "borne", "spook", "sauce", "amber", "lathe", "carat", "corer", "dirty", "slyly", "affix", "alloy", "taint", "sheep", "kinky", "wooly", "mauve", "flung", "yacht", "fried", "quail", "brunt", "grimy", "curvy", "cagey", "rinse", "deuce", "state", "grasp", "milky", "bison", "graft", "sandy", "baste", "flask", "hedge", "girly", "swash", "boney", "coupe", "endow", "abhor", "welch", "blade", "tight", "geese", "miser", "mirth", "cloud", "cabal", "leech", "close", "tenth", "pecan", "droit", "grail", "clone", "guise", "ralph", "tango", "biddy", "smith", "mower", "payee", "serif", "drape", "fifth", "spank", "glaze", "allot", "truck", "kayak", "virus", "testy", "tepee", "fully", "zonal", "metro", "curry", "grand", "banjo", "axion", "bezel", "occur", "chain", "nasal", "gooey", "filer", "brace", "allay", "pubic", "raven", "plead", "gnash", "flaky", "munch", "dully", "eking", "thing", "slink", "hurry", "theft", "shorn", "pygmy", "ranch", "wring", "lemon", "shore", "mamma", "froze", "newer", "style", "moose", "antic", "drown", "vegan", "chess", "guppy", "union", "lever", "lorry", "image", "cabby", "druid", "exact", "truth", "dopey", "spear", "cried", "chime", "crony", "stunk", "timid", "batch", "gauge", "rotor", "crack", "curve", "latte", "witch", "bunch", "repel", "anvil", "soapy", "meter", "broth", "madly", "dried", "scene", "known", "magma", "roost", "woman", "thong", "punch", "pasty", "downy", "knead", "whirl", "rapid", "clang", "anger", "drive", "goofy", "email", "music", "stuff", "bleep", "rider", "mecca", "folio", "setup", "verso", "quash", "fauna", "gummy", "happy", "newly", "fussy", "relic", "guava", "ratty", "fudge", "femur", "chirp", "forte", "alibi", "whine", "petty", "golly", "plait", "fleck", "felon", "gourd", "brown", "thrum", "ficus", "stash", "decry", "wiser", "junta", "visor", "daunt", "scree", "impel", "await", "press", "whose", "turbo", "stoop", "speak", "mangy", "eying", "inlet", "crone", "pulse", "mossy", "staid", "hence", "pinch", "teddy", "sully", "snore", "ripen", "snowy", "attic", "going", "leach", "mouth", "hound", "clump", "tonal", "bigot", "peril", "piece", "blame", "haute", "spied", "undid", "intro", "basal", "shine", "gecko", "rodeo", "guard", "steer", "loamy", "scamp", "scram", "manly", "hello", "vaunt", "organ", "feral", "knock", "extra", "condo", "adapt", "willy", "polka", "rayon", "skirt", "faith", "torso", "match", "mercy", "tepid", "sleek", "riser", "twixt", "peace", "flush", "catty", "login", "eject", "roger", "rival", "untie", "refit", "aorta", "adult", "judge", "rower", "artsy", "rural", "shave"]

// zhs*
export async function apply(ctx: Context, config: Config) {
  // cl*
  const isQQOfficialRobotMarkdownTemplateEnabled = config.isEnableQQOfficialRobotMarkdownTemplate && config.key !== '' && config.customTemplateId !== ''
  // rz*
  const logger = ctx.logger(`wordleGame`)
  // wj*
  const wordleGameDirPath = path.join(ctx.baseDir, 'data', 'wordleGame');
  const idiomsFilePath = path.join(__dirname, 'assets', '汉兜', 'idioms.json');
  const pinyinFilePath = path.join(__dirname, 'assets', '汉兜', 'pinyin.json');
  const strokesFilePath = path.join(__dirname, 'assets', '词影', 'strokes.json');
  const equationsFilePath = path.join(__dirname, 'assets', 'equations.json');
  const introductionFilePath = path.join(__dirname, 'assets', '玩法介绍.png');
  const idiomsKoishiFilePath = path.join(wordleGameDirPath, 'idioms.json');
  const pinyinKoishiFilePath = path.join(wordleGameDirPath, 'pinyin.json');

  await ensureDirExists(wordleGameDirPath);
  await ensureFileExists(idiomsKoishiFilePath);
  await ensureFileExists(pinyinKoishiFilePath);

  await updateDataInTargetFile(idiomsFilePath, idiomsKoishiFilePath, 'idiom');
  await updateDataInTargetFile(pinyinFilePath, pinyinKoishiFilePath, 'term');

  const idiomsData = fs.readFileSync(idiomsKoishiFilePath, 'utf-8');
  const strokesData = JSON.parse(fs.readFileSync(strokesFilePath, 'utf-8'));
  const pinyinData: PinyinItem2[] = JSON.parse(fs.readFileSync(pinyinKoishiFilePath, 'utf8'));
  const equations: string[][] = JSON.parse(fs.readFileSync(equationsFilePath, 'utf8'));
  const idiomsList = JSON.parse(idiomsData);
  const introductionImgBuffer = fs.readFileSync(introductionFilePath)
  // tzb*
  ctx.model.extend('wordle_game_records', {
    id: 'unsigned',
    isWin: 'boolean',
    pinyin: 'string',
    wordGuess: 'string',
    channelId: 'string',
    gameMode: 'string',
    timestamp: 'string',
    absentTones: 'list',
    isAbsurd: 'boolean',
    isStarted: 'boolean',
    targetWord: 'string',
    presentTones: 'list',
    guessHistory: 'list',
    isRunning: 'boolean',
    correctLetters: 'list',
    isHardMode: 'boolean',
    previousGuess: 'list',
    absentPinyins: 'list',
    isFreeMode: 'boolean',
    wordlesNum: 'unsigned',
    presentPinyins: 'list',
    absentLetters: 'string',
    wordleIndex: 'unsigned',
    presentLetters: 'string',
    wordGuessHtmlCache: 'text',
    remainingWordsList: 'list',
    isChallengeMode: 'boolean',
    isUltraHardMode: 'boolean',
    guessWordLength: 'unsigned',
    previousGuessIdioms: 'list',
    presentTonesWithIndex: 'list',
    correctTonesWithIndex: 'list',
    presentPinyinsWithIndex: 'list',
    presentLettersWithIndex: 'list',
    correctPinyinsWithIndex: 'list',
    remainingGuessesCount: 'integer',
    wordAnswerChineseDefinition: 'string',
    strokesHtmlCache: {type: 'json', initial: [[], [], [], []]},
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('extra_wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    strokesHtmlCache: {type: 'json', initial: [[], [], [], []]},
    guessWordLength: 'unsigned',
    gameMode: 'string',
    timestamp: 'string',
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    remainingGuessesCount: 'integer',
    presentLettersWithIndex: 'list',
    pinyin: 'string',
    presentTonesWithIndex: 'list',
    absentPinyins: 'list',
    absentTones: 'list',
    presentPinyinsWithIndex: 'list',
    correctTonesWithIndex: 'list',
    correctPinyinsWithIndex: 'list',
    presentPinyins: 'list',
    presentTones: 'list',
    previousGuess: 'list',
    previousGuessIdioms: 'list',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('wordle_gaming_player_records', {
    id: 'unsigned',
    channelId: 'string',
    username: 'string',
    money: 'unsigned',
    userId: 'string',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('wordle_player_records', {
    id: 'unsigned',
    username: 'string',
    userId: 'string',
    lose: 'unsigned',
    win: 'unsigned',
    moneyChange: 'double',
    wordGuessCount: 'unsigned',
    stats: {type: 'json', initial: initialStats},
    fastestGuessTime: {type: 'json', initial: initialFastestGuessTime},
    extraCiyingRankInfo: {type: 'json', initial: initialExtraCiyingRankInfo},
  }, {
    primary: 'id',
    autoInc: true,
  })
  // zjj*
  ctx.middleware(async (session, next) => {
    let {channelId, content} = session;
    if (!config.enableWordGuessMiddleware) {
      return await next();
    }

    if (content) {
      content = `${h.select(content, 'text')}`.trim()
    }

    const gameInfo = await getGameInfo(channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await next();
    }
    // 判断输入
    if (gameInfo.gameMode === '汉兜' || gameInfo.gameMode === '词影') {
      if (!isFourCharacterIdiom(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === 'Numberle') {
      if (!isNumericString(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === 'Math') {
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
  ctx.command('wordleGame', '猜单词游戏帮助')
    .action(async ({session}) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return await sendMessage(session, `🌸🎐 《WordleGame》 🎐🌸
😆 欢迎游玩~ 祝您玩得开心！`, `改名 玩法介绍 排行榜 查询玩家记录 开始游戏`, 3)
      }
      await session.execute(`wordleGame -h`)
    })
  // 玩法介绍 wfjs*
  ctx.command('wordleGame.玩法介绍', '游戏玩法介绍')
    .action(async ({session}) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      return sendMessage(session, h.image(introductionImgBuffer, `image/${config.imageType}`), ``)
    })
  // wordleGame.加入 j* jr*
  ctx.command('wordleGame.加入 [money:number]', '加入游戏')
    .action(async ({session}, money = 0) => {
      let {channelId, userId, username, user} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      let gameInfo: any = await getGameInfo(channelId)
      const isInGame = await isPlayerInGame(channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(session, `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`, `猜测`)
        } else {
          const wordlesNum = gameInfo.wordlesNum
          const isAbsurd = gameInfo.isAbsurd
          // 生成 html 字符串
          let imageBuffers: Buffer[] = [];
          let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
          for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
            if (wordleIndex > 1) {
              gameInfo = await getGameInfo2(channelId, wordleIndex)
            }
            if (gameInfo.gameMode === '汉兜') {
              const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4)
              imageBuffer = await generateImageForHandle(`${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            } else {
              const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
              const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
              // 图
              imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            }
            imageBuffers.push(imageBuffer);
          }
          if (wordlesNum > 1) {
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(htmlImgString);
          }
          // 返回提示和游戏进程图
          if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
            await sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), ``)
            return await sendMessage(session, `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！`, `猜测`)
          } else {
            return await sendMessage(session, `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！\n${h.image(imageBuffer, `image/${config.imageType}`)}`, `猜测`)
          }
        }
      }
      // 判断输入
      if (typeof money !== 'number' || money < 0) {
        return await sendMessage(session, `【@${username}】\n真是个傻瓜呢~\n投个钱也要别人教你嘛！`, `改名 加入游戏`);
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(session, `【@${username}】\n咱们这是小游戏呀...\n不许玩这么大！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】`, `改名 加入游戏`);
      }
      // @ts-ignore
      const uid = user.id;
      let getUserMonetary = await ctx.database.get('monetary', {uid});
      if (getUserMonetary.length === 0) {
        await ctx.database.create('monetary', {uid, value: 0, currency: 'default'});
        getUserMonetary = await ctx.database.get('monetary', {uid})
      }
      const userMonetary = getUserMonetary[0]
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      // 修改金额
      if (isInGame) {
        // 余额够
        if (userMonetary.value >= money) {
          await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money});
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n当前投入金额为：【${money}】\n当前玩家人数：${numberOfPlayers} 名！`, `改名 加入游戏 开始游戏`);
        } else {
          // 余额不够
          await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money: userMonetary.value});
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers} 名！`, `改名 加入游戏 开始游戏`);
        }
      }
      // 加入游戏
      // money 为 0
      if (money === 0) {
        await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
        // 有余额
        if (userMonetary.value > 0) {
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n如果您想玩的模式为：【经典】\n那您可以带上货币数额再加入一次！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`, `改名 加入游戏 开始游戏`);
        } else {
          // 没余额
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n加油哇，祝您好运！\n当前玩家人数：${numberOfPlayers + 1} 名！`, `改名 加入游戏 开始游戏`);
        }
      } else {
        // money !== 0
        // 余额足够
        if (userMonetary.value >= money) {
          await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！您投入的金额为：【${money}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`, `改名 加入游戏 开始游戏`);
        } else {
          // 余额不够
          await ctx.database.create('wordle_gaming_player_records', {
            channelId,
            userId,
            username,
            money: userMonetary.value
          });
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers + 1} 名！`, `改名 加入游戏 开始游戏`);
        }
      }
      // .action
    })
  // wordleGame.退出 q* tc*
  ctx.command('wordleGame.退出', '退出游戏')
    .action(async ({session}) => {
      let {channelId, userId, username} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始啦！\n无法进行此操作！`, `猜测`);
      }
      // 玩家
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        return await sendMessage(session, `【@${username}】\n您还没加入游戏呢！\n怎么退出？`, `改名 加入游戏`);
      }
      // 退出
      await ctx.database.remove('wordle_gaming_player_records', {channelId, userId})
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      return await sendMessage(session, `【@${username}】\n您成功退出游戏啦！\n那就让我们下次再见吧~\n剩余玩家人数：${numberOfPlayers} 名！`, `改名 退出游戏 开始游戏 加入游戏`, 2);
      // .action
    })
  // wordleGame.结束 s* js*
  ctx.command('wordleGame.结束', '结束游戏')
    .action(async ({session}) => {
      let {channelId, userId, username, timestamp} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始哦~怎么结束呐？`, `改名 开始游戏`);
      }
      // 玩家记录输
      await updatePlayerRecordsLose(channelId, gameInfo)
      // 结束
      const processedResult: string = gameInfo.wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';

      const duration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
      const message = `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${gameInfo.isAbsurd ? '' : `\n${generateGameEndMessage(gameInfo)}`}${processedResult}`;
      await sendMessage(session, message, `改名 玩法介绍 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
      await endGame(channelId)
      return
      // .action
    })
  // wordleGame.开始 s* ks*
  ctx.command('wordleGame.开始 [guessWordLength:number]', '开始游戏引导')
    .option('hard', '--hard 困难模式', {fallback: false})
    .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
    .option('absurd', '--absurd 变态模式', {fallback: false})
    .option('challenge', '--challenge 变态挑战模式', {fallback: false})
    .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
    .action(async ({session, options}, guessWordLength) => {
      let {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username);
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`, `改名 开始游戏`);
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`, `猜测`);
      }
      // 提示输入
      await sendMessage(session, `【@${username}】\n${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `可选模式如下：\n${exams.map((exam, index) => `${index + 1}. ${exam}`).join('\n')}`}
请输入要开始的${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `【序号】或`}【模式名】：`, `经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`, 4);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 开始游戏`);
      // 判断 userInput 是否为有效输入
      const selectedExam = isNaN(parseInt(userInput)) ? userInput.toUpperCase().trim() : exams[parseInt(userInput) - 1].toUpperCase();
      const examsInUpperCase = exams.map(exam => exam.toUpperCase());
      if (examsInUpperCase.includes(selectedExam)) {
        if (!guessWordLength) {
          if (config.shouldPromptWordLengthInput && selectedExam !== '经典' && selectedExam !== 'LEWDLE' && selectedExam !== '汉兜' && selectedExam !== '词影') {
            await sendMessage(session, `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(selectedExam)}\n请输入待猜项目的的长度：`, `输入`);
            const userInput = await session.prompt();
            if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 开始游戏`);
            guessWordLength = parseInt(userInput)
          } else {
            guessWordLength = config.defaultWordLengthForGuessing
          }
        }
        const hardOption = options.hard ? ` --hard` : '';
        const uhardOption = options.ultraHardMode ? ` --uhard` : '';
        const absurdOption = options.absurd ? ` --absurd` : '';
        const challengeOption = options.challenge ? ` --challenge` : '';
        const wordlesOption = options.wordles > 1 ? `--wordles ${options.wordles}` : '';
        const command = `wordleGame.开始.${selectedExam}${hardOption}${uhardOption}${absurdOption}${challengeOption}${wordlesOption} ${guessWordLength}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重试。`, `改名 开始游戏`);
      }
      // .action
    });
  // wordleGame.开始.经典 jd*
  ctx.command('wordleGame.开始.经典', '开始经典猜单词游戏')
    .option('hard', '--hard 困难模式', {fallback: false})
    .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
    .option('absurd', '--absurd 变态模式', {fallback: false})
    .option('challenge', '--challenge 变态挑战模式', {fallback: false})
    .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
    .action(async ({session, options}) => {
      let {channelId, userId, username, platform, timestamp} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        await sendMessage(session, `【@${username}】\n附加游戏模式（可多选）：`, `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`, 4);
        const userInput = await session.prompt();

        if (!userInput) {
          return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 开始游戏`);
        }

        const modes = {
          '困难': 'hard',
          '超困难': 'ultraHardMode',
          '变态': 'absurd',
          '变态挑战': 'challenge',
        };

        const wordles = {
          'x1': 1,
          'x2': 2,
          'x3': 3,
          'x4': 4,
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

        if (userInput.includes('跳过')) {
          noop();
        }

      }
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`, `改名 开始游戏`);
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`, `猜测`);
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`, `改名 加入游戏`);
      }
      // 经典扣钱
      await deductMoney(channelId, platform);
      // 开始游戏
      // 选待猜单词
      // 随机选择一个单词并小写化
      const selectedWords: string[] = [];
      const randomWord: string = lowerCaseWordArray[Math.floor(Math.random() * lowerCaseWordArray.length)].toLowerCase();
      selectedWords.push(randomWord);

      let isHardMode = options.hard;
      let isUltraHardMode = options.ultraHardMode;
      let isChallengeMode = options.challenge;
      let isAbsurdMode = isChallengeMode ? true : options.absurd;
      const wordlesNum = options.wordles
      if (isUltraHardMode) {
        isHardMode = true
      }
      if (wordlesNum > 1) {
        isHardMode = false
        isUltraHardMode = false
        isChallengeMode = false
        isAbsurdMode = false
      }


      const correctLetters: string[] = new Array(5).fill('*');

      const foundWord = findWord(randomWord)

      await ctx.database.set('wordle_game_records', {channelId}, {
        isStarted: true,
        wordGuess: randomWord,
        wordAnswerChineseDefinition: replaceEscapeCharacters(foundWord.translation),
        remainingGuessesCount: 6 + wordlesNum - 1,
        guessWordLength: 5,
        gameMode: '经典',
        timestamp: String(timestamp),
        isHardMode: isHardMode,
        isUltraHardMode,
        correctLetters: correctLetters,
        presentLetters: '',
        absentLetters: '',
        isAbsurd: isAbsurdMode,
        isChallengeMode: isChallengeMode,
        targetWord: randomWord,
        wordlesNum: wordlesNum,
        wordleIndex: 1,
      })

      if (wordlesNum > 1) {
        let randomWordExtra: string = ''
        for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {
          while (selectedWords.length < wordleIndex) {
            randomWordExtra = lowerCaseWordArray[Math.floor(Math.random() * lowerCaseWordArray.length)].toLowerCase();
            if (!selectedWords.includes(randomWordExtra)) {
              selectedWords.push(randomWordExtra);
            }
          }
          const foundWordExtra = findWord(randomWordExtra)
          await ctx.database.create('extra_wordle_game_records', {
            channelId,
            remainingGuessesCount: 6 + wordlesNum - 1,
            guessWordLength: 5,
            wordGuess: randomWordExtra,
            wordAnswerChineseDefinition: replaceEscapeCharacters(foundWordExtra.translation),
            gameMode: '经典',
            timestamp: String(timestamp),
            correctLetters: correctLetters,
            presentLetters: '',
            absentLetters: '',
            wordlesNum: wordlesNum,
            wordleIndex,
          })
        }
      }
      // 游戏图
      const emptyGridHtml = isAbsurdMode ? generateEmptyGridHtml(1, 5) : generateEmptyGridHtml(6 + wordlesNum - 1, 5);
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

      const gameMode = `【经典${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurdMode ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】`;
      const targetWord = isChallengeMode ? `\n目标单词为：【${randomWord}】` : '';
      const wordLength = '单词长度为：【5】';
      const guessChance = `猜单词机会为：【${isAbsurdMode ? '♾️' : `${6 + wordlesNum - 1}`}】`;
      const wordCount = '待猜单词数量为：【2315】';
      const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
      const image = h.image(imageBuffer, `image/${config.imageType}`);

      const message = `游戏开始！\n当前游戏模式为：${gameMode}${isChallengeMode ? targetWord : ''}\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}\n${image}`;

      if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        await sendMessage(session, image, ``)
        return await sendMessage(session, `游戏开始！\n当前游戏模式为：${gameMode}${isChallengeMode ? targetWord : ''}\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}`, `结束游戏 猜测`, 2)
      }
      return await sendMessage(session, message, `结束游戏 猜测`);
      // .action
    })
  const exams = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜", 'Numberle', 'Math', '词影',
  ];
  exams.forEach((exam) => {
    if (exam !== "经典") {
      // 10* fjd*
      ctx.command(`wordleGame.开始.${exam} [guessWordLength:number]`, `开始猜${exam}单词游戏`)
        .option('free', '--free 自由模式（仅限汉兜与词影）', {fallback: false})
        .option('all', '--all 全成语模式（仅限汉兜与词影）', {fallback: false})
        .option('hard', '--hard 困难模式', {fallback: false})
        .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
        .option('absurd', '--absurd 变态模式', {fallback: false})
        .option('challenge', '--challenge 变态挑战模式', {fallback: false})
        .option('wordles', '--wordles <value:number> 同时猜测多个', {fallback: 1})
        .action(async ({session, options}, guessWordLength) => {
          let {channelId, userId, username, timestamp, platform} = session;
          // 更新玩家记录表中的用户名
          username = await getSessionUserName(session)
          await updateNameInPlayerRecord(session, userId, username)
          if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
            let markdownCommands = ''
            let numberOfMessageButtonsPerRow = 2
            if (exam === '汉兜' || exam === '词影') {
              markdownCommands = `困难 超困难 x1 x2 x3 x4 自由 全成语 跳过`
            } else if (exam === 'Numberle' || exam === 'Math') {
              markdownCommands = `困难 超困难 x1 x2 x3 x4 跳过`
            } else {
              markdownCommands = `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`
            }
            await sendMessage(session, `【@${username}】\n附加游戏模式（可多选）：`, markdownCommands, numberOfMessageButtonsPerRow);

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 开始游戏`);
            }

            if (exam === '汉兜' || exam === '词影') {
              options.free = userInput.includes(`自由`);
              options.all = userInput.includes(`全成语`);
            }

            const modes = {
              '困难': 'hard',
              '超困难': 'ultraHardMode',
              '变态': 'absurd',
              '变态挑战': 'challenge'
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              'x1': 1,
              'x2': 2,
              'x3': 3,
              'x4': 4
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
            if (config.shouldPromptForWordLengthOnNonClassicStart && exam !== 'Lewdle' && exam !== '汉兜' && exam !== '词影') {
              await sendMessage(session, `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(exam)}\n请输入待猜测项目的长度：`, `输入`);
              const userInput = await session.prompt();
              if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 开始游戏`);
              guessWordLength = parseInt(userInput)
            } else {
              guessWordLength = config.defaultWordLengthForGuessing
            }
          }
          if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
            return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个的话~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`, `改名 开始游戏`);
          }

          // 判断输入
          if (typeof guessWordLength !== 'number' || !isValidGuessWordLength(exam, guessWordLength) && exam !== 'Lewdle' && exam !== '汉兜' && exam !== '词影') {
            return await sendMessage(session, `【@${username}】\n无效的长度参数！\n${exam} 长度可选值范围：${getValidGuessWordLengthRange(exam)}`, `改名 开始游戏`);
          }

          // 游戏状态
          const gameInfo = await getGameInfo(channelId);
          if (gameInfo.isStarted) {
            return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`, `猜测`);
          }

          // 人数
          const numberOfPlayers = await getNumberOfPlayers(channelId);
          if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
            return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜测】\n先加入游戏吧~`, `改名 加入游戏`);
          }

          // 非经典还钱
          if (exam !== '汉兜') {
            await updateGamingPlayerRecords(channelId);
          } else {
            // 汉兜 扣钱
            await deductMoney(channelId, platform);
          }

          const selectedWords: string[] = [];
          // 开始游戏
          let randomWord: string = ''
          let translation: string = ''
          let wordCount: number = 0
          let pinyin: string = ''
          if (exam === 'Lewdle') {
            const randomLowerCaseWord = getRandomFromStringList(badWordsList);
            guessWordLength = randomLowerCaseWord.length
            const foundWord = findWord(randomLowerCaseWord)
            randomWord = randomLowerCaseWord
            translation = foundWord ? foundWord.translation : ''
          } else if (exam === '汉兜' || exam === '词影') {
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
          } else if (exam === 'Numberle') {
            randomWord = generateNumberString(guessWordLength);
            translation = ''
          } else if (exam === 'Math') {
            randomWord = getRandomFromStringList(equations[guessWordLength]);
            translation = ''
          } else {
            const result = getRandomWordTranslation(exam, guessWordLength);
            randomWord = result.word
            translation = result.translation
            wordCount = result.wordCount
          }
          selectedWords.push(randomWord);
          let isFreeMode = options.free;
          let isHardMode = options.hard;
          let isUltraHardMode = options.ultraHardMode;
          let isChallengeMode = options.challenge;
          let isAbsurdMode = isChallengeMode ? true : options.absurd;
          const wordlesNum = options.wordles
          if (isUltraHardMode) {
            isHardMode = true
          }

          // if (exam === '汉兜') {
          //   isHardMode = false
          //   isUltraHardMode = false
          //   isChallengeMode = false
          //   isAbsurdMode = false
          // }
          if (wordlesNum > 1 || exam === '汉兜' || exam === 'Numberle' || exam === 'Math' || exam === '词影') {
            // isHardMode = false
            // isUltraHardMode = false
            isChallengeMode = false
            isAbsurdMode = false
          }

          const correctLetters: string[] = new Array(guessWordLength).fill('*');

          await ctx.database.set('wordle_game_records', {channelId}, {
            isStarted: true,
            wordGuess: randomWord,
            wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
            remainingGuessesCount: exam === '汉兜' ? 10 + wordlesNum - 1 : exam === 'Math' || exam === '词影' ? 6 + wordlesNum - 1 : guessWordLength + 1 + wordlesNum - 1,
            guessWordLength,
            gameMode: exam,
            timestamp: String(timestamp),
            isHardMode: isHardMode,
            isUltraHardMode,
            correctLetters: correctLetters,
            presentLetters: '',
            absentLetters: '',
            isAbsurd: isAbsurdMode,
            isChallengeMode: isChallengeMode,
            targetWord: randomWord,
            wordlesNum: wordlesNum,
            wordleIndex: 1,
            pinyin,
            isFreeMode,
          })

          if (wordlesNum > 1) {
            let randomWordExtra: string = ''
            let translation: string = ''
            let pinyin: string = ''
            for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {

              while (selectedWords.length < wordleIndex) {
                if (exam === 'Lewdle') {
                  let randomLowerCaseWord = getRandomFromStringList(badWordsList);
                  while (randomLowerCaseWord.length !== guessWordLength) {
                    randomLowerCaseWord = getRandomFromStringList(badWordsList);
                  }
                  const foundWord = findWord(randomLowerCaseWord)
                  randomWordExtra = randomLowerCaseWord
                  translation = foundWord ? foundWord.translation : ''
                } else if (exam === '汉兜' || exam === '词影') {
                  const randomIdiom = getRandomFromStringList(commonIdiomsList);
                  let selectedIdiom;

                  if (options.all) {
                    selectedIdiom = getRandomIdiom(idiomsList);
                  } else {
                    selectedIdiom = await getSelectedIdiom(randomIdiom);
                  }

                  guessWordLength = 4
                  pinyin = selectedIdiom.pinyin
                  randomWordExtra = options.all ? selectedIdiom.idiom : randomIdiom;
                  translation = selectedIdiom.explanation
                } else if (exam === 'Numberle') {
                  randomWordExtra = generateNumberString(guessWordLength);
                  translation = ''
                } else if (exam === 'Math') {
                  randomWordExtra = getRandomFromStringList(equations[guessWordLength]);
                  translation = ''
                } else {
                  const resultExtra = getRandomWordTranslation(exam, guessWordLength);
                  translation = resultExtra.translation
                  randomWordExtra = resultExtra.word;
                }

                if (!selectedWords.includes(randomWordExtra)) {
                  selectedWords.push(randomWordExtra);
                }
              }
              await ctx.database.create('extra_wordle_game_records', {
                channelId,
                remainingGuessesCount: exam === '汉兜' ? 10 + wordlesNum - 1 : exam === 'Math' || exam === '词影' ? 6 + wordlesNum - 1 : guessWordLength + 1 + wordlesNum - 1,
                guessWordLength,
                wordGuess: randomWordExtra,
                wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
                gameMode: exam,
                timestamp: String(timestamp),
                correctLetters: correctLetters,
                presentLetters: '',
                absentLetters: '',
                wordlesNum: wordlesNum,
                wordleIndex,
                pinyin,
              })
            }
          }
          // 生成并发送游戏图
          let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
          if (exam === '汉兜') {
            const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4)
            imageBuffer = await generateImageForHandle(emptyGridHtml);
          } else if (exam === '词影') {
            const emptyGridHtmlWithBorder = generateEmptyGridHtmlForCiying(1, 4, true)
            const emptyGridHtml = generateEmptyGridHtmlForCiying(6 + wordlesNum - 1 - 1, 4, false)
            imageBuffer = await generateImageForCiying(emptyGridHtmlWithBorder + emptyGridHtml, 6 + wordlesNum - 1);
          } else {
            const emptyGridHtml = isAbsurdMode ? generateEmptyGridHtml(1, guessWordLength) : exam === 'Math' ? generateEmptyGridHtml(6 + wordlesNum - 1, guessWordLength) : generateEmptyGridHtml(guessWordLength + 1 + wordlesNum - 1, guessWordLength);
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

          const gameMode = `游戏开始！\n当前游戏模式为：【${exam}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isFreeMode && exam === '汉兜' || isFreeMode && exam === '词影' ? `（自由）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurdMode ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】`;
          const challengeInfo = isChallengeMode ? `\n目标单词为：【${randomWord}】` : '';
          const wordLength = `${exam === 'Numberle' ? '数字' : exam === 'Math' ? '数学方程式' : '单词'}长度为：【${guessWordLength}】`;
          const guessChance = `猜${exam === '汉兜' || exam === '词影' ? '词语|成语' : exam === 'Numberle' ? '数字' : exam === 'Math' ? '数学方程式' : '单词'}机会为：【${isAbsurdMode ? '♾️' : exam === '汉兜' ? `${10 + wordlesNum - 1}` : exam === 'Math' ? `${6 + wordlesNum - 1}` : exam === '词影' ? `${6 + wordlesNum - 1}` : guessWordLength + 1 + wordlesNum - 1}】`;
          const wordCount2 = exam === '汉兜' || exam === '词影' ? `待猜词语|成语数量为：【${options.all ? idiomsList.length : commonIdiomsList.length}】` : exam === 'Math' ? `待猜方程式数量为：【${equations[guessWordLength].length}】` : `待猜单词数量为：【${exam === 'Lewdle' ? '1000' : wordCount}】`;
          const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
          const image = h.image(imageBuffer, `image/${config.imageType}`);

          if (exam === '汉兜' || exam === '词影') {
            if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
              await sendMessage(session, image, ``)
              return await sendMessage(session, `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}`, `结束游戏 猜测`, 2)
            } else {
              return await sendMessage(session, `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`, `结束游戏 猜测`);
            }
          } else {
            if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
              await sendMessage(session, image, ``)
              return await sendMessage(session, `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${exam === 'Numberle' ? '' : wordCount2}${timeLimit}`, `结束游戏 猜测`, 2)
            } else {
              return await sendMessage(session, `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${exam === 'Numberle' ? '' : wordCount2}${timeLimit}\n${image}`, `结束游戏 猜测`);
            }
          }

        });
    }
  })
  // wordleGame.猜 c* cdc* ccy*
  ctx.command('wordleGame.猜 [inputWord:text]', '做出一次猜测')
    .option('random', '-r 随机', {fallback: false})
    .action(async ({session, options}, inputWord) => {
        let {channelId, userId, username, platform, timestamp} = session
        // 游戏状态
        let gameInfo: any = await getGameInfo(channelId)
        inputWord = inputWord?.trim()

        // 操作太快
        if (gameInfo.isRunning === true) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n操作太快了哦~\n再试一次吧！`, `猜测`);
        }

        // 运行状态
        await setGuessRunningStatus(channelId, true)
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)

        if (!gameInfo.isStarted) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n游戏还没开始呢！`, `改名 开始游戏`);
        }

        if (options.random) {
          inputWord = gameInfo.gameMode === '汉兜' || gameInfo.gameMode === '词影' ? getRandomIdiom(idiomsList).idiom : gameInfo.gameMode === 'Numberle' ? generateNumberString(gameInfo.guessWordLength) : gameInfo.gameMode === 'Math' ? getRandomFromStringList(equations[gameInfo.guessWordLength]) : getRandomWordTranslation('ALL', gameInfo.guessWordLength).word
        }

        if (!inputWord) {
          await sendMessage(session, `【@${username}】\n请输入【猜测词】或【取消】：`, `取消 输入`);
          const userInput = await session.prompt()
          if (!userInput) return await sendMessage(session, `【${username}】\n输入无效或超时。`, `猜测`);
          if (userInput === '取消') return await sendMessage(session, `【${username}】\n猜测操作已取消！`, `猜测`);
          inputWord = userInput.trim()
        }


        // 作答时间限制
        const timeDifferenceInSeconds = (timestamp - Number(gameInfo.timestamp)) / 1000; // 将时间戳转换为秒
        if (config.enableWordGuessTimeLimit) {
          if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
            // // 生成 html 字符串
            // const emptyGridHtml = gameInfo.isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
            // const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
            // // 图
            // const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            // 玩家记录输
            await updatePlayerRecordsLose(channelId, gameInfo)
            await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
            await endGame(channelId)

            return // return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
          }
        }
        // 玩家不在游戏中
        const isInGame = await isPlayerInGame(channelId, userId);
        if (!isInGame) {
          if (!config.allowNonPlayersToGuess) {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n没加入游戏的话~不能猜哦！`, `猜测`);
          } else {
            await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money: 0})
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
        if (gameInfo.guessHistory && gameInfo.guessHistory.includes(inputWord.toLowerCase())) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n这个已经猜过了哦！`, `猜测`);
        }
        if (!/^[a-zA-Z]+$/.test(inputWord) && gameMode !== '汉兜' && gameMode !== '词影' && gameMode !== 'Numberle' && gameMode !== 'Math') {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`, `猜测`);
        }
        if (!isFourCharacterIdiom(inputWord) && gameMode === '汉兜' || !isFourCharacterIdiom(inputWord) && gameMode === '词影') {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`, `猜测`);
        }
        if (gameMode === 'Numberle' && !isNumericString(inputWord)) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n您确定您输入的是 ${guessWordLength} 长度的数字吗？`, `猜测`);
        }
        if (gameMode === 'Math' && !isMathEquationValid(inputWord)) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n请使用+-*/=运算符和0-9之间的数字！\n并组成正确的数学方程式！`, `猜测`);
        }
        if (inputWord.length !== gameInfo.guessWordLength && gameMode !== '汉兜' && gameMode !== '词影' && gameMode !== 'Numberle' && gameMode !== 'Math') {
          await setGuessRunningStatus(channelId, false)
          const usernameMention = `【@${username}】`;
          const inputLengthMessage = `输入的单词长度不对哦！\n您的输入为：【${inputWord}】\n它的长度为：【${inputWord.length}】\n待猜单词的长度为：【${gameInfo.guessWordLength}】`;
          const presentLettersWithoutAsterisk = uniqueSortedLowercaseLetters(presentLetters);
          const processedResult = wordlesNum > 1 ? '\n' + await processExtraGameInfos(channelId) : '';
          const progressMessage = `当前${calculateGameDuration(Number(gameInfo.timestamp), timestamp)}\n当前进度：【${correctLetters.join('')}】${presentLettersWithoutAsterisk.length === 0 ? `` : `\n包含字母：【${presentLettersWithoutAsterisk}】`}${absentLetters.length === 0 ? '' : `\n不包含字母：【${absentLetters}】`}${processedResult}`;
          return await sendMessage(session, `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`, `猜测`);
        }
        // 是否存在该单词
        // 小写化
        const lowercaseInputWord = gameMode === '汉兜' || gameMode === '词影' ? inputWord : inputWord.toLowerCase();
        if (gameMode !== '汉兜' && gameMode !== '词影' && gameMode !== 'Numberle' && gameMode !== 'Math') {
          const foundWord = findWord(lowercaseInputWord)
          if (!foundWord) {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n你确定存在这样的单词吗？`, `猜测`);
          }
        }
        let userInputPinyin: string = ''
        if (gameMode === '词影') {
          if (!checkStrokesData(inputWord)) {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n不好意思啊...\n我还没学会这个字（`, `猜测`);
          }
          if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
            const idiomInfo = await getIdiomInfo(inputWord)
            if (idiomInfo.pinyin === '未找到拼音') {
              await setGuessRunningStatus(channelId, false)
              return await sendMessage(session, `【@${username}】\n你确定存在这样的四字词语吗？`, `猜测`);
            } else {
              userInputPinyin = idiomInfo.pinyin
            }
          }
        }
        if (gameMode === '汉兜') {
          if (!isIdiomInList(inputWord, idiomsList)) {
            if (isFreeMode) {
              const foundItem = pinyinData.find(item => item.term === inputWord);

              if (foundItem) {
                userInputPinyin = foundItem.pinyin
              } else {
                userInputPinyin = await sendPostRequestForGPT1106(inputWord)
                if (userInputPinyin !== '') {
                  const newItem: PinyinItem2 = {
                    term: inputWord,
                    pinyin: userInputPinyin
                  };
                  pinyinData.push(newItem);

                  fs.writeFileSync(pinyinKoishiFilePath, JSON.stringify(pinyinData, null, 2), 'utf8');
                } else {
                  userInputPinyin = 'wǒ chū cuò le'
                }
              }
            } else {
              const idiomInfo = await getIdiomInfo(inputWord)
              if (idiomInfo.pinyin === '未找到拼音') {
                await setGuessRunningStatus(channelId, false)
                return await sendMessage(session, `【@${username}】\n你确定存在这样的四字词语吗？`, `猜测`);
              } else {
                userInputPinyin = idiomInfo.pinyin
              }
            }

          }
        }
        await ctx.database.set('wordle_game_records', {channelId}, {
          guessHistory: gameInfo.guessHistory ? [...gameInfo.guessHistory, lowercaseInputWord] : [lowercaseInputWord]
        })
        const foundIdiom = findIdiomByIdiom(inputWord, idiomsList);
        if (!userInputPinyin && foundIdiom) {
          userInputPinyin = foundIdiom.pinyin
        }
        // 困难模式
        if (isHardMode && gameMode !== '词影') {
          let isInputWordWrong = false;
          // 包含
          const containsAllLetters = lowercaseInputWord.split('').filter(letter => presentLetters.includes(letter) && letter !== '*');
          if (mergeSameLetters(containsAllLetters).length !== presentLetters.length && presentLetters.length !== 0) {
            isInputWordWrong = true;
          }
          // 正确
          for (let i = 0; i < lowercaseInputWord.length; i++) {
            if (correctLetters[i] !== '*' && correctLetters[i] !== lowercaseInputWord[i] && correctLetters.some(letter => letter !== '*')) {
              isInputWordWrong = true;
              break;
            }
          }
          // 不包含 灰色的线索必须被遵守  超困难
          if (isUltraHardMode && absentLetters.length !== 0 && checkAbsentLetters(lowercaseInputWord, absentLetters)) {
            isInputWordWrong = true;
          }
          // 黄色字母必须远离它们被线索的地方 超困难
          if (isUltraHardMode && presentLettersWithIndex.length !== 0 && checkPresentLettersWithIndex(lowercaseInputWord, presentLettersWithIndex)) {
            isInputWordWrong = true
          }
          if (isInputWordWrong) {
            await setGuessRunningStatus(channelId, false);
            const difficulty = isUltraHardMode ? '超困难' : '困难';
            const rule = `绿色线索必须保特固定，黄色线索必须重复使用。${isUltraHardMode ? `\n黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。` : ''}`

            const message = `【@${username}】\n当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n您输入的词不符合要求！\n您的输入为：【${inputWord}】\n要求：【${correctLetters.join('')}】${presentLetters.length === 0 ? `` : `\n包含：【${presentLetters}】`}${absentLetters.length === 0 || !isUltraHardMode ? `` : `\n不包含：【${absentLetters}】`}${presentLettersWithIndex.length === 0 || !isUltraHardMode ? `` : `\n远离黄色线索：【${presentLettersWithIndex.join(', ')}】`}`;

            return await sendMessage(session, message, `猜测`);
          }
        }
        // 初始化输
        let isLose = false
        // 变态模式
        if (isAbsurd) {
          let wordsList: string[];
          if (remainingWordsList.length === 0) {
            if (gameMode === '经典') {
              wordsList = lowerCaseWordArray;
            } else {
              const fileData = getJsonFilePathAndWordCountByLength(gameMode, guessWordLength);
              if (gameMode === "ALL") {
                const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
                wordsList = extractLowerCaseWords(jsonData)
              } else {
                const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
                wordsList = Object.keys(jsonData).map(word => word.toLowerCase());
              }
            }
          } else {
            wordsList = remainingWordsList;
          }
          let longestRemainingWordList = await findLongestMatchedWords(wordsList, lowercaseInputWord, targetWord, isChallengeMode);
          if (!longestRemainingWordList) {
            longestRemainingWordList = []
          } else {
            while (isChallengeMode && wordsList.includes(targetWord) && longestRemainingWordList && longestRemainingWordList.length === 1 && longestRemainingWordList[0] !== targetWord) {
              longestRemainingWordList = await findLongestMatchedWords(wordsList, lowercaseInputWord, targetWord, isChallengeMode);
            }

            // 变态挑战模式
            if (isChallengeMode) {
              isLose = !longestRemainingWordList.includes(targetWord);
            }
          }
          if (longestRemainingWordList.length === 0) {
            await updatePlayerRecordsLose(channelId, gameInfo)
            await sendMessage(session, `【@${username}】\n根据透露出的信息！\n已经无任何可用单词！\n很遗憾，你们输了！`, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
            await endGame(channelId)
            return
          }
          let randomWord = longestRemainingWordList[Math.floor(Math.random() * longestRemainingWordList.length)];
          const foundWord = findWord(randomWord)
          if (isLose && isChallengeMode) {
            // 生成 html 字符串
            const letterTilesHtml = '<div class="Row-module_row__pwpBq">' + await generateLetterTilesHtml(foundWord.word.toLowerCase(), inputWord, channelId, 1, gameInfo) + '</div>';
            const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
            const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
            // 图
            const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}`);
            await sendMessage(session, `【@${username}】\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n您可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`, `撤销 结束`);
            let userInput = await session.prompt()
            // 生成 html 字符串
            // 图
            const imageBuffer2 = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            if (!userInput) {
              await setGuessRunningStatus(channelId, false)
              if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
                await sendMessage(session, h.image(imageBuffer2, `image/${config.imageType}`), ``)
                return await sendMessage(session, `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。`, `猜测`);
              }
              return await sendMessage(session, `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。\n${h.image(imageBuffer2, `image/${config.imageType}`)}`, `猜测`);
            }
            if (userInput === '结束') {
              await session.execute(`wordleGame.结束`)
              return
            } else {
              await setGuessRunningStatus(channelId, false)
              if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
                await sendMessage(session, h.image(imageBuffer2, `image/${config.imageType}`), ``)
                return await sendMessage(session, `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！`, `猜测`);
              }
              return await sendMessage(session, `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！\n${h.image(imageBuffer2, `image/${config.imageType}`)}`, `猜测`);
            }
          }
          await ctx.database.set('wordle_game_records', {channelId}, {
            remainingWordsList: longestRemainingWordList,
            wordGuess: foundWord.word.toLowerCase(),
            wordAnswerChineseDefinition: replaceEscapeCharacters(foundWord.translation),
          })
          gameInfo = await getGameInfo(channelId)
        }
        // 胜
        let isWin = false
        if (wordlesNum === 1 && lowercaseInputWord === gameInfo.wordGuess) {
          isWin = true
        }
        let isWinNum = 0
        // 生成 html 字符串
        let imageBuffers: Buffer[] = [];
        let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
        for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
          if (wordleIndex > 1) {
            gameInfo = await getGameInfo2(channelId, wordleIndex)
          }
          const isWin = lowercaseInputWord === gameInfo.wordGuess
          if (isWin || gameInfo.isWin) {
            ++isWinNum
          }
          // 负
          if (!isWin && gameInfo.remainingGuessesCount - 1 === 0 && !isAbsurd) {
            isLose = true
          }
          let letterTilesHtml: string;

          if (gameInfo.isWin) {
            letterTilesHtml = '';
          } else {
            if (gameMode === '汉兜') {
              letterTilesHtml = await generateLetterTilesHtmlForHandle(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo, gameInfo.pinyin, userInputPinyin);
            } else if (gameMode === '词影') {
              letterTilesHtml = await generateLetterTilesHtmlForCiying(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo, isHardMode);
            } else {
              const generatedHtml = await generateLetterTilesHtml(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo);
              letterTilesHtml = '<div class="Row-module_row__pwpBq">' + generatedHtml + '</div>';
            }
          }
          let emptyGridHtml;
          if (isAbsurd) {
            emptyGridHtml = generateEmptyGridHtml(isWin ? 0 : 1, gameInfo.guessWordLength);
          } else {
            if (gameMode === '汉兜') {
              emptyGridHtml = generateEmptyGridHtmlForHandle(gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1, 4)
            } else if (gameMode === '词影') {
              emptyGridHtml = generateEmptyGridHtmlForCiying(gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1, 4, true) + generateEmptyGridHtmlForCiying(gameInfo.isWin || isWin ? gameInfo.remainingGuessesCount - 1 : gameInfo.remainingGuessesCount - 1 - 1, 4, false)
            } else {
              emptyGridHtml = generateEmptyGridHtml(gameInfo.isWin ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
            }
          }
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // 图
          if (gameMode === '汉兜') {
            imageBuffer = await generateImageForHandle(`${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
          } else if (gameMode === '词影') {
            imageBuffer = await generateImageForCiying(`${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`, 6 + wordlesNum - 1);
          } else {
            imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
          }
          imageBuffers.push(imageBuffer);
          // 更新游戏记录
          const remainingGuessesCount = isAbsurd || gameMode === '词影' && (gameInfo.isWin || isWin) ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1
          if (wordleIndex === 1 && !gameInfo.isWin) {
            await ctx.database.set('wordle_game_records', {channelId}, {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            })
          } else if (wordleIndex > 1 && !gameInfo.isWin) {
            await ctx.database.set('extra_wordle_game_records', {channelId, wordleIndex}, {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            })
          }
        }
        if (wordlesNum > 1) {
          const htmlImgString = generateImageTags(imageBuffers);
          imageBuffer = await generateWordlesImage(htmlImgString);
          if (isWinNum === wordlesNum) {
            isWin = true
          }
        }
        gameInfo = await getGameInfo(channelId)

        // 处理赢
        if (isWin) {
          let finalSettlementString: string = ''
          // 经典有收入
          if (gameInfo.gameMode === '经典' || gameInfo.gameMode === '汉兜') {
            finalSettlementString = await processNonZeroMoneyPlayers(channelId, platform);
          }
          // 玩家记录赢
          await updatePlayerRecordsWin(channelId, gameInfo)
          // 增加该玩家猜出单词的次数
          const [playerRecord] = await ctx.database.get('wordle_player_records', {userId})
          // 更新最快用时
          if (timeDifferenceInSeconds < playerRecord.fastestGuessTime[gameInfo.gameMode] || playerRecord.fastestGuessTime[gameInfo.gameMode] === 0) {
            playerRecord.fastestGuessTime[gameInfo.gameMode] = Math.floor(timeDifferenceInSeconds);
          }

          if (gameInfo.gameMode === '词影') {
            if (gameInfo.wordlesNum === 1) {
              if (gameInfo.isHardMode) {
                playerRecord.extraCiyingRankInfo.successCountIn1HardMode += 1;
                if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode || playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode === 0) {
                  playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode = Math.floor(timeDifferenceInSeconds);
                }
              } else {
                playerRecord.extraCiyingRankInfo.successCountIn1Mode += 1;
                if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode || playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode === 0) {
                  playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode = Math.floor(timeDifferenceInSeconds);
                }
              }
            } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
              const extraCiyingRankInfoKey = `successCountIn${gameInfo.wordlesNum}Mode`;
              const extraCiyingRankInfoKeyFastestGuessTimeIn = `fastestGuessTimeIn${gameInfo.wordlesNum}Mode`;
              playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
              if (timeDifferenceInSeconds < playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] || playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] === 0) {
                playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKeyFastestGuessTimeIn] = Math.floor(timeDifferenceInSeconds);
              }
            }
          }

          const updateData = {
            wordGuessCount: playerRecord.wordGuessCount + 1,
            fastestGuessTime: playerRecord.fastestGuessTime
          };

          if (gameInfo.gameMode === '词影') {
            updateData['extraCiyingRankInfo'] = playerRecord.extraCiyingRankInfo;
          }

          await ctx.database.set('wordle_player_records', {userId: userId}, updateData);

          const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
          const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
          const imageType = config.imageType;
          const settlementResult = finalSettlementString === '' ? '' : `最终结算结果如下：\n${finalSettlementString}`;

          const message = `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

          if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
            await sendMessage(session, h.image(imageBuffer, `image/${imageType}`), ``)
            await sendMessage(session, `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
            await endGame(channelId);
            return;
          }
          await sendMessage(session, message, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
          await endGame(channelId);
          return;
        }
        // 处理输
        if (isLose) {
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo);
          const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
          const challengeMessage = isChallengeMode ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！` : '';
          const answerInfo = isChallengeMode ? '' : `\n${generateGameEndMessage(gameInfo)}`;
          const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
          const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n${gameDuration}${answerInfo}${processedResult}`;

          if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
            await sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), ``)
            await sendMessage(session, `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${gameDuration}${answerInfo}${processedResult}`, `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`, 2);
            await endGame(channelId);
            return;
          }
          await sendMessage(session, message, `改名 排行榜 查询玩家记录 开始游戏 再来一把`, 2);
          await endGame(channelId);
          return;
        }
        // 继续
        await setGuessRunningStatus(channelId, false)
        await sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), `结束游戏 ${gameInfo.gameMode === '汉兜' ? `拼音速查表 ` : ``}查询进度 猜测`, 2)
        if (!config.isTextToImageConversionEnabled && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          return sendMessage(session, `<@${userId}>`, `结束游戏 ${gameInfo.gameMode === '汉兜' ? `拼音速查表 ` : ``}查询进度 猜测`, 2);
        }
        return
        // .action
      }
    )
// wordleGame.查询玩家记录 cx* cxwjjl*
  ctx.command('wordleGame.查询玩家记录 [targetUser:text]', '查询玩家记录')
    .action(async ({session}, targetUser) => {
      let {userId, username} = session;
      const originalUerId = userId
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      const sessionUserName = username
      await updateNameInPlayerRecord(session, userId, username)

      let targetUserRecord: PlayerRecord[] = [];
      if (!targetUser) {
        targetUserRecord = await ctx.database.get('wordle_player_records', {userId})
      } else {
        targetUser = await replaceAtTags(session, targetUser)
        if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          targetUserRecord = await ctx.database.get('wordle_player_records', {username: targetUser})
          if (targetUserRecord.length === 0) {
            targetUserRecord = await ctx.database.get('wordle_player_records', {userId: targetUser})
          }
        } else {
          const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
          const match = targetUser.match(userIdRegex);
          userId = match?.[1] ?? userId;
          username = match?.[2] ?? username;
          if (originalUerId === userId) {
            targetUserRecord = await ctx.database.get('wordle_player_records', {userId: targetUser})
          } else {
            targetUserRecord = await ctx.database.get('wordle_player_records', {userId})
          }
        }
      }

      if (targetUserRecord.length === 0) {
        return sendMessage(session, `被查询对象无任何游戏记录。`, `改名 查询玩家记录 开始游戏`, 2);
      }

      const {
        win,
        lose,
        moneyChange,
        wordGuessCount,
        stats,
        fastestGuessTime
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
  ctx.command('wordleGame.查单词 [targetWord:text]', '查单词引导')
    .action(async ({session, options}, targetWord) => {
      if (!targetWord && session.event.message.quote && session.event.message.quote.content) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim()
        }
      }
      let {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username);
      // 提示输入
      const availableDictionaryArray = ['ALL', 'WordWord'];
      const availableDictionaryArrayToLowerCase = availableDictionaryArray.map(word => word.toLowerCase());
      await sendMessage(session, `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray.map((dictionary, index) => `${index + 1}. ${dictionary}`).join('\n')}\n请输入您选择的【序号】或【词库名】：`, `ALL WordWord`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `查单词`);
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput)) ? userInput.toLowerCase().trim() : availableDictionaryArrayToLowerCase[parseInt(userInput) - 1];
      if (availableDictionaryArrayToLowerCase.includes(selectedDictionary)) {
        const command = `wordleGame.查单词.${selectedDictionary}${targetWord ? ` ${targetWord}` : ''}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重新输入。`, `查单词`);
      }
      // .action
    });
// wordleGame.查单词 cxdc* cdc*
  ctx.command('wordleGame.查单词.ALL [targetWord:text]', '在ALL词库中查询单词释义（英译中）')
    .action(async ({session}, targetWord) => {
      if (!targetWord && session.event.message.quote && session.event.message.quote.content) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim()
        }
      }
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查询的单词】或【取消】：`, `取消 输入`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `查单词`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查询单词操作已取消。`, `查单词`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`, `查单词`);
      }

      // 寻找
      const foundWord = findWord(targetWord)
      if (!foundWord) {
        return await sendMessage(session, `【@${username}】\n未在ALL词库中找到该单词。`, `查单词`);
      }
      return sendMessage(session, `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(foundWord.translation)}`, `查单词`);
    })
// czdc*
  ctx.command('wordleGame.查单词.WordWord [targetWord:text]', '在WordWord中查找单词定义（英译英）')
    .action(async ({session}, targetWord) => {
      if (!targetWord && session.event.message.quote && session.event.message.quote.content) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim()
        }
      }
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的单词】或【取消】：`, `取消 输入`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `查单词`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找单词操作已取消。`, `查单词`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`, `查单词`);
      }

      // 寻找
      fetchWordDefinitions(targetWord)
        .then((responseData) => {
          const definitions = responseData.word.definitions;
          const serializedDefinitions = serializeDefinitions(definitions);
          return sendMessage(session, `${capitalizeFirstLetter(targetWord)} Definitions: \n${serializedDefinitions ? serializedDefinitions : `- 该单词定义暂未收录。`}`, `查单词`);
        })
        .catch((error) => {
          return sendMessage(session, `【@${username}】\n未在WordWord中找到该单词。`, `查单词`);
        });
    })
// ccy*
  ctx.command('wordleGame.查成语 [targetIdiom:text]', '查成语引导')
    .action(async ({session, options}, targetIdiom) => {
      if (!targetIdiom && session.event.message.quote && session.event.message.quote.content) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim()
        }
      }
      let {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username);
      // 提示输入
      const availableDictionaryArray = ['百度汉语', '汉典'];
      await sendMessage(session, `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray.map((dictionary, index) => `${index + 1}. ${dictionary}`).join('\n')}\n请输入您选择的【序号】或【词库名】：`, `百度汉语 汉典`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `查成语`);
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput)) ? userInput.trim() : availableDictionaryArray[parseInt(userInput) - 1];
      if (availableDictionaryArray.includes(selectedDictionary)) {
        const command = `wordleGame.查成语.${selectedDictionary}${targetIdiom ? ` ${targetIdiom}` : ''}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重新输入。`, `查成语`);
      }
      // .action
    });
// czcy*
  ctx.command('wordleGame.查成语.百度汉语 [targetIdiom:text]', '在百度汉语中查找成语解释')
    .action(async ({session}, targetIdiom) => {
      if (!targetIdiom && session.event.message.quote && session.event.message.quote.content) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim()
        }
      }
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的成语】或【取消】：`, `取消 输入`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `查成语`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找成语操作已取消。`, `查成语`);
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`, `查成语`);
      }

      // 寻找
      const idiomInfo = await getIdiomInfo(targetIdiom)
      if (idiomInfo.pinyin === '未找到拼音') {
        return await sendMessage(session, `【@${username}】\n未在百度汉语中找到该成语。`, `查成语`);
      }
      return await sendMessage(session, `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n【解释】${idiomInfo.explanation}`, `查成语`);
    })
  ctx.command('wordleGame.查成语.汉典 [targetIdiom:text]', '在汉典中查找成语解释')
    .action(async ({session}, targetIdiom) => {
      if (!targetIdiom && session.event.message.quote && session.event.message.quote.content) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim()
        }
      }
      let {userId, username} = session;
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username);
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的成语】或【取消】：`, `取消 输入`);
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(session, `【@${username}】\n输入超时！`, `查成语`);
        if (userInput === '取消')
          return await sendMessage(session, `【@${username}】\n查找成语操作已取消。`, `查成语`);
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`, `查成语`);
      }
      // 寻找
      const idiomInfo = await getIdiomInfo2(targetIdiom);
      if (idiomInfo.pinyin === '未找到拼音') {
        return await sendMessage(session, `【@${username}】\n未在汉典中找到该成语。`, `查成语`);
      }
      return await sendMessage(session, `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n${idiomInfo.explanation}`, `查成语`);
    });
// dcczq*
  ctx.command('wordleGame.单词查找器 [wordleIndexs:text]', '使用WordFinder查找匹配的单词')
    .option('auto', '-a 自动查找（根据游戏进程）', {fallback: false})
    .option('wordLength', '-l <length> 指定要搜索的单词长度', {fallback: undefined})
    .option('wordWithThreeWildcards', '-w <word> 搜索带有最多三个通配符字符的单词', {fallback: undefined})
    .option('containingLetters', '-c <letters> 搜索包含特定字母组合的单词', {fallback: undefined})
    .option('containingTheseLetters', '--ct <letters> 搜索只包含指定字母的单词', {fallback: undefined})
    .option('withoutTheseLetters', '--wt <letters> 搜索不包含特定字母的单词', {fallback: undefined})
    .option('startingWithTheseLetters', '--sw <letters> 搜索以特定字母开头的单词', {fallback: undefined})
    .option('endingWithTheseLetters', '--ew <letters> 搜索以特定字母结尾的单词', {fallback: undefined})
    .action(async ({session, options}, wordleIndexs) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)

      let {
        auto,
        wordLength,
        wordWithThreeWildcards,
        containingLetters,
        containingTheseLetters,
        withoutTheseLetters,
        startingWithTheseLetters,
        endingWithTheseLetters
      } = options;

      if (auto) {
        const gameInfo = await getGameInfo(channelId)
        const {isStarted, wordlesNum, guessWordLength, absentLetters, presentLetters, gameMode} = gameInfo
        if (!isStarted) {
          return await sendMessage(session, `【@${username}】\n未检测到任何游戏进度！\n无法使用自动查找功能！`, `单词查找器`);
        }
        if (gameMode === '汉兜') {
          return await sendMessage(session, `【@${username}】\n你拿单词查找器查四字词语？`, `单词查找器`);
        }
        if (wordlesNum === 1) {
          await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
        } else {
          let userInput: string = ''
          if (!wordleIndexs) {
            await sendMessage(session, `【@${username}】\n检测到当前进度数量为：【${wordlesNum}】\n请输入【待查询序号（从左到右）】：\n支持输入多个（用空格隔开）\n例如：1 2`, `单词查找器`);
            userInput = await session.prompt()
            if (!userInput) return await sendMessage(session, `【${username}】\n输入无效或超时。`, `单词查找器`);
          } else {
            userInput = wordleIndexs
          }

          const stringArray = userInput.split(' ');

          for (const element of stringArray) {

            if (!isNaN(Number(element))) {
              const index = parseInt(element);
              if (index > 0 && index <= wordlesNum) {
                if (index === 1) {
                  await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
                } else {
                  const gameInfo2 = await getGameInfo2(channelId, index)
                  const {guessWordLength, absentLetters, presentLetters} = gameInfo2
                  await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
                }
              } else {
                await session.send(`序号 ${index} 超出范围（1~${wordlesNum}）。`);
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
        return
      }

      const noOptionsSpecified = !wordLength &&
        !wordWithThreeWildcards &&
        !containingLetters &&
        !containingTheseLetters &&
        !withoutTheseLetters &&
        !startingWithTheseLetters &&
        !endingWithTheseLetters;

      if (noOptionsSpecified) {
        const chineseTutorial = "欢迎使用单词查找器！\n你可以使用以下选项来搜索匹配的单词：\n- 使用 -a 自动查找（根据游戏进程）\n- 使用 -l <length> 指定要搜索的单词长度\n- 使用 -w <word> 搜索带有最多三个通配符字符的单词\n- 使用 -c <letters> 搜索包含特定字母组合的单词\n- 使用 --ct <letters> 搜索只包含指定字母的单词\n- 使用 --wt <letters> 搜索不包含特定字母的单词\n- 使用 --sw <letters> 搜索以特定字母开头的单词\n- 使用 --ew <letters> 搜索以特定字母结尾的单词";
        return await sendMessage(session, chineseTutorial, `单词查找器`);
      }

      const params = {
        wordLength: wordLength ? `${wordLength}-letter-words` : '',
        wordWithThreeWildcards: wordWithThreeWildcards ? `out-of-${wordWithThreeWildcards}` : '',
        containingLetters: containingLetters ? `containing-${containingLetters}` : '',
        containingTheseLetters: containingTheseLetters ? `with-${containingTheseLetters}` : '',
        withoutTheseLetters: withoutTheseLetters ? `without-${withoutTheseLetters}` : '',
        startingWithTheseLetters: startingWithTheseLetters ? `starting-with-${startingWithTheseLetters}` : '',
        endingWithTheseLetters: endingWithTheseLetters ? `ending-with-${endingWithTheseLetters}` : ''
      };

      const queryParams = Object.values(params).filter(param => param).join('-');

      const url = `https://wordword.org/search/${queryParams}`;
      const result = await fetchAndParseWords(url);
      return await sendMessage(session, `${result}`, `单词查找器`);
    });
// wordleGame.查询进度 jd* cxjd*
  ctx.command('wordleGame.查询进度', '查询当前游戏进度')
    .action(async ({session}) => {
      let {channelId, userId, username, user, timestamp} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      const gameInfo = await getGameInfo(channelId)
      // 未开始
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始呢~\n开始后再来查询进度吧！`, `改名 开始游戏`)
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
        presentTones
      } = gameInfo;
      const usernameMention = `【@${username}】`;
      const inputLengthMessage = `待猜${gameMode === '汉兜' || gameMode === '词影' ? '词语' : gameMode === 'Numberle' ? '数字' : gameMode === 'Math' ? '数学方程式' : '单词'}的长度为：【${guessWordLength}】`;
      const extraGameInfo = wordlesNum > 1 ? `\n${await processExtraGameInfos(channelId)}` : '';
      const gameDuration = calculateGameDuration(Number(gameInfo.timestamp), timestamp);
      const progressInfo = `当前${gameDuration}\n当前进度：【${correctLetters.join('')}】`;

      const presentInfo = presentLetters.length !== 0 ? `\n包含：【${presentLetters}】` : '';
      const absentInfo = absentLetters.length !== 0 ? `\n不包含：【${absentLetters}】` : '';
      const presentWithIndexInfo = presentLettersWithIndex.length !== 0 ? `\n位置排除：【${presentLettersWithIndex.join(', ')}】` : '';

      const pinyinsCorrectInfo = correctPinyinsWithIndex.length !== 0 ? `\n正确拼音：【${correctPinyinsWithIndex.join(', ')}】` : '';
      const pinyinsPresentInfo = presentPinyins.length !== 0 ? `\n包含拼音：【${presentPinyins.join(', ')}】` : '';
      const pinyinsAbsentInfo = absentPinyins.length !== 0 ? `\n不包含拼音：【${absentPinyins.join(', ')}】` : '';
      const pinyinsPresentWithIndexInfo = presentPinyinsWithIndex.length !== 0 ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(', ')}】` : '';

      const tonesCorrectInfo = correctTonesWithIndex.length !== 0 ? `\n正确声调：【${correctTonesWithIndex.join(', ')}】` : '';
      const tonesPresentInfo = presentTones.length !== 0 ? `\n包含声调：【${presentTones.join(', ')}】` : '';
      const tonesAbsentInfo = absentTones.length !== 0 ? `\n不包含声调：【${absentTones.join(', ')}】` : '';
      const tonesPresentWithIndexInfo = presentTonesWithIndex.length !== 0 ? `\n声调位置排除：【${presentTonesWithIndex.join(', ')}】` : '';


      const progressMessage = `${progressInfo}${presentInfo}${absentInfo}${presentWithIndexInfo}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}${extraGameInfo}`;

      const timeDifferenceInSeconds = (timestamp - Number(gameInfo.timestamp)) / 1000;
      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurd ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ''}`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message, `猜测`);

      // .action
    })
// pyscb* pysc*
  ctx.command('wordleGame.拼音速查表', '查看拼音速查表')
    .action(async ({session}) => {
      let {channelId, userId, username} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      let gameInfo: any = await getGameInfo(channelId)

      if (!gameInfo.isStarted || gameInfo.gameMode !== '汉兜') {
        const imageBuffer = await generateHandlePinyinsImage(defaultPinyinsHtml)
        return sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), ``);
      }
      const wordlesNum = gameInfo.wordlesNum
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex)
        }
        const {presentPinyins, correctPinyinsWithIndex, absentPinyins} = gameInfo
        const correctPinyins: string[] = removeIndexFromPinyins(correctPinyinsWithIndex);
        if (gameInfo.gameMode === '汉兜') {
          const $ = load(defaultPinyinsHtml);

          $('div').each((index, element) => {
            const text = $(element).text();
            if (correctPinyins.includes(text)) {
              $(element).attr('class', 'text-ok');
            } else if (presentPinyins.includes(text)) {
              $(element).attr('class', 'text-mis');
            } else if (absentPinyins.includes(text)) {
              $(element).attr('class', 'op30');
            }
          });

          const modifiedHTML = $.html();
          imageBuffer = await generateHandlePinyinsImage(modifiedHTML)
        }
        imageBuffers.push(imageBuffer);
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
      }
      return sendMessage(session, h.image(imageBuffer, `image/${config.imageType}`), ``);
    })

  const rankType = [
    "总", "损益", "猜出次数", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜", 'Numberle', 'Math', '词影',
  ];

// r* phb*
  ctx.command('wordleGame.排行榜 [number:number]', '查看排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }

      await sendMessage(session, `【@${username}】\n${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `当前可查看排行榜如下：
${rankType.map((type, index) => `${index + 1}. ${type}`).join('\n')}`}
请输入要查看的【排行榜名】${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `或【序号】`}：`, `总 损益 猜出次数 经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`);

      const userInput = await session.prompt();
      if (!userInput) return sendMessage(session, `输入无效或超时。`, `排行榜`);

      // 处理用户输入
      const userInputNumber = parseInt(userInput);
      if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType.length) {
        const rankName = rankType[userInputNumber - 1];
        await session.execute(`wordleGame.排行榜.${rankName} ${number}`);
      } else if (rankType.includes(userInput)) {
        await session.execute(`wordleGame.排行榜.${userInput} ${number}`);
      } else {
        return sendMessage(session, `无效的输入。`, `排行榜`);
      }
    });

  const rankType2 = [
    "总", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜", 'Numberle', 'Math', '词影',
  ];

  rankType2.forEach(type => {
    // phb*
    ctx.command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        let {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        let rankType3: string[];
        if (type === '总') {
          rankType3 = ["胜场", "输场"];
        } else if (type === '词影') {
          rankType3 = ["猜出次数", "胜场", "输场", "最快用时"];
        } else {
          rankType3 = ["胜场", "输场", "最快用时"];
        }
        await sendMessage(session, `【@${username}】\n${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `当前可查看排行榜如下：
${rankType3.map((type, index) => `${index + 1}. ${type}`).join('\n')}`}
请输入要查看的【类型名】${isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' ? `` : `或【序号】`}：`, rankType3.join(' '));

        const userInput = await session.prompt();
        if (!userInput) return sendMessage(session, `输入无效或超时。`, `排行榜`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType3.length) {
          const rankName = rankType3[userInputNumber - 1];
          await session.execute(`wordleGame.排行榜.${type}.${rankName} ${number}`);
        } else if (rankType3.includes(userInput)) {
          await session.execute(`wordleGame.排行榜.${type}.${userInput} ${number}`);
        } else {
          return sendMessage(session, `无效的输入。`, `排行榜`);
        }
      });
  });
// sy*
  ctx.command('wordleGame.排行榜.损益 [number:number]', '查看玩家损益排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'moneyChange', 'moneyChange', '玩家损益排行榜', number);
    });
// ccdccs*
  ctx.command('wordleGame.排行榜.猜出次数 [number:number]', '查看玩家猜出次数排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'wordGuessCount', 'wordGuessCount', '玩家猜出次数排行榜', number);
    });
// zsc*
  ctx.command('wordleGame.排行榜.总.胜场 [number:number]', '查看玩家总胜场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'win', 'win', '玩家总胜场排行榜', number);
    });
// zsc*
  ctx.command('wordleGame.排行榜.总.输场 [number:number]', '查看玩家总输场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'lose', 'lose', '查看玩家总输场排行榜', number);
    });
  const rankType4 = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜", 'Numberle', 'Math', '词影',
  ];
  // 注册胜场、输场、用时排行榜指令
  rankType4.forEach((type) => {
    ctx.command(`wordleGame.排行榜.${type}.胜场 [number:number]`, `查看${type}胜场排行榜`)
      .option('hard', '--hard 查看困难模式', {fallback: false})
      .option('wordles', '--wordles <value:number> 查看多猜测模式', {fallback: 0})
      .action(async ({session, options}, number = config.defaultMaxLeaderboardEntries) => {
        let {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        if (type === '词影' && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          let markdownCommands = `x1 x2 x3 x4 困难 跳过`
          let numberOfMessageButtonsPerRow = 4
          await sendMessage(session, `【@${username}】\n特定游戏模式（可多选）：`, markdownCommands, numberOfMessageButtonsPerRow);

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 排行榜`);
          }

          const modes = {
            '困难': 'hard',
          };

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          const wordlesMap = {
            'x1': 1,
            'x2': 2,
            'x3': 3,
            'x4': 4
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
        if (type === '词影' && options.wordles !== 0 || type === '词影' && options.hard) {
          if (options.wordles === 0) {
            options.wordles = 1
          }
          if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > 4) {
            return await sendMessage(session, `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`, `开始游戏 排行榜`);
          }
          return await getWinCountLeaderboardForCiying(session, options.wordles, `玩家胜场排行榜（词影 x${options.wordles}${options.hard && options.wordles === 1 ? '（困难）' : ''}）`, number, options.hard);
        }
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'win', '胜场'), `开始游戏 排行榜`);
      });

    ctx.command(`wordleGame.排行榜.${type}.输场 [number:number]`, `查看${type}输场排行榜`)
      .option('hard', '--hard 查看困难模式', {fallback: false})
      .option('wordles', '--wordles <value:number> 查看多猜测模式', {fallback: 0})
      .action(async ({session, options}, number = config.defaultMaxLeaderboardEntries) => {
        let {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        if (type === '词影' && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          let markdownCommands = `x1 x2 x3 x4 困难 跳过`
          let numberOfMessageButtonsPerRow = 4
          await sendMessage(session, `【@${username}】\n特定游戏模式（可多选）：`, markdownCommands, numberOfMessageButtonsPerRow);

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 排行榜`);
          }

          const modes = {
            '困难': 'hard',
          };

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          const wordlesMap = {
            'x1': 1,
            'x2': 2,
            'x3': 3,
            'x4': 4
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
        if (type === '词影' && options.wordles !== 0 || type === '词影' && options.hard) {
          if (options.wordles === 0) {
            options.wordles = 1
          }
          if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > 4) {
            return await sendMessage(session, `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`, `开始游戏 排行榜`);
          }
          return await getLoseCountLeaderboardForCiying(session, options.wordles, `玩家输场排行榜（词影 x${options.wordles}${options.hard && options.wordles === 1 ? '（困难）' : ''}）`, number, options.hard);
        }
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'lose', '输场'), `开始游戏 排行榜`);
      });

    ctx.command(`wordleGame.排行榜.${type}.最快用时 [number:number]`, `查看${type}最快用时排行榜`)
      .option('hard', '--hard 查看困难模式', {fallback: false})
      .option('wordles', '--wordles <value:number> 查看多猜测模式', {fallback: 0})
      .action(async ({session, options}, number = config.defaultMaxLeaderboardEntries) => {
        let {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        username = await getSessionUserName(session)
        await updateNameInPlayerRecord(session, userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        if (type === '词影' && isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
          let markdownCommands = `x1 x2 x3 x4 困难 跳过`
          let numberOfMessageButtonsPerRow = 4
          await sendMessage(session, `【@${username}】\n特定游戏模式（可多选）：`, markdownCommands, numberOfMessageButtonsPerRow);

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 排行榜`);
          }

          const modes = {
            '困难': 'hard',
          };

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          const wordlesMap = {
            'x1': 1,
            'x2': 2,
            'x3': 3,
            'x4': 4
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
        if (type === '词影' && options.wordles !== 0 || type === '词影' && options.hard) {
          if (options.wordles === 0) {
            options.wordles = 1
          }
          if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > 4) {
            return await sendMessage(session, `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`, `开始游戏 排行榜`);
          }
          return await getFastestGuessTimeLeaderboardForCiying(session, options.wordles, `玩家最快用时排行榜（词影 x${options.wordles}${options.hard && options.wordles === 1 ? '（困难）' : ''}）`, number, options.hard);
        }

        return await sendMessage(session, await getLeaderboardFastestGuessTime(type, number), `开始游戏 排行榜`);
      });
  });

  ctx.command('wordleGame.排行榜.词影.猜出次数 [number:number]', '查看玩家猜出次数排行榜（词影）')
    .option('hard', '--hard 查看困难模式', {fallback: false})
    .option('wordles', '--wordles <value:number> 查看多猜测模式', {fallback: 1})
    .action(async ({session, options}, number = config.defaultMaxLeaderboardEntries) => {
      let {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      username = await getSessionUserName(session)
      await updateNameInPlayerRecord(session, userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        let markdownCommands = `x1 x2 x3 x4 困难 跳过`
        let numberOfMessageButtonsPerRow = 4
        await sendMessage(session, `【@${username}】\n特定游戏模式（可多选）：`, markdownCommands, numberOfMessageButtonsPerRow);

        const userInput = await session.prompt();

        if (!userInput) {
          return await sendMessage(session, `【@${username}】\n输入无效或超时。`, `改名 排行榜`);
        }

        const modes = {
          '困难': 'hard',
        };

        for (const mode of Object.keys(modes)) {
          if (userInput.includes(mode)) {
            options[modes[mode]] = true;
          }
        }

        const wordlesMap = {
          'x1': 1,
          'x2': 2,
          'x3': 3,
          'x4': 4
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
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > 4) {
        return await sendMessage(session, `【@${username}】\n词影可查看的多猜测排行榜应在 1 ~ 4 之间！`, `开始游戏 排行榜`);
      }
      return await getCiyingSuccessCountLeaderboardForCiying(session, options.wordles, 'successCount', `玩家猜出次数排行榜（词影 x${options.wordles}${options.hard && options.wordles === 1 ? '（困难）' : ''}）`, number, options.hard);
    });

  // gm*
  ctx.command('wordleGame.改名 [newPlayerName:text]', '更改玩家名字')
    .action(async ({session}, newPlayerName) => {
      const {userId} = session;
      const username = await getSessionUserName(session);
      await updateNameInPlayerRecord(session, userId, username);

      newPlayerName = newPlayerName?.trim();
      if (!newPlayerName) {
        return sendMessage(session, `请输入新的玩家名字。`, `改名`);
      }

      if (!(config.isEnableQQOfficialRobotMarkdownTemplate && session.platform === 'qq' && config.key && config.customTemplateId)) {
        return sendMessage(session, `不是 QQ 官方机器人的话，不用改名哦~`, `改名`);
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
    newPlayerName = h.transform(newPlayerName, {text: true, default: false}).trim();

    const users = await ctx.database.get('user', {});
    if (users.some(user => user.name === newPlayerName)) {
      return sendMessage(session, `新的玩家名字已经存在，请重新输入。`, `改名`);
    }

    try {
      session.user.name = newPlayerName;
      await session.user.$update();
      return sendMessage(session, `玩家名字已更改为：【${newPlayerName}】`, `查询玩家记录 开始游戏 改名`, 2);
    } catch (error) {
      if (RuntimeError.check(error, 'duplicate-entry')) {
        return sendMessage(session, `新的玩家名字已经存在，请重新输入。`, `改名`);
      } else {
        logger.warn(error);
        return sendMessage(session, `玩家名字更改失败。`, `改名`);
      }
    }
  }

  async function handleCustomUsername(ctx, session, userId, newPlayerName) {
    const players = await ctx.database.get('wordle_player_records', {});
    if (players.some(player => player.username === newPlayerName)) {
      return sendMessage(session, `新的玩家名字已经存在，请重新输入。`, `改名`);
    }

    const userRecord = await ctx.database.get('wordle_player_records', {userId});
    if (userRecord.length === 0) {
      await ctx.database.create('wordle_player_records', {
        userId,
        username: newPlayerName,
      });
    } else {
      await ctx.database.set('wordle_player_records', {userId}, {username: newPlayerName});
    }
    return await sendMessage(session, `玩家名字已更改为：【${newPlayerName}】`, `查询玩家记录 开始游戏 改名`, 2);
  }

  function replaceSymbols(message: string): string {
    let firstLessThan = true;
    let firstGreaterThan = true;
    let result = '';

    for (let i = 0; i < message.length; i++) {
      const char = message[i];

      if (char === '<' && firstLessThan) {
        firstLessThan = false;
        result += char;
      } else if (char === '>' && firstGreaterThan) {
        firstGreaterThan = false;
        result += char;
      } else if (char === '<') {
        result += '[';
      } else if (char === '>') {
        result += ']';
      } else {
        result += char;
      }
    }

    return result;
  }

  async function getSessionUserName(session: any): Promise<string> {
    let sessionUserName = session.username;

    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
      const [user] = await ctx.database.get('user', {id: session.user.id})
      if (config.isUsingUnifiedKoishiBuiltInUsername && user.name) {
        sessionUserName = user.name
      } else {
        let userRecord = await ctx.database.get('wordle_player_records', {userId: session.userId});

        if (userRecord.length === 0) {
          await ctx.database.create('wordle_player_records', {
            userId: session.userId,
            username: sessionUserName,
          });

          userRecord = await ctx.database.get('wordle_player_records', {userId: session.userId});
        }
        sessionUserName = userRecord[0].username;
      }

    }

    return sessionUserName;
  }

  async function getWinCountLeaderboardForCiying(session: any, wordlesNum: number, title: string, number: number, isHardMode: boolean) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    let sortedPlayers;
    let result = '';

    let winCountField = isHardMode ? 'winIn1HardMode' : 'winIn1Mode';

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      winCountField = `winIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort((a, b) => b.extraCiyingRankInfo[winCountField] - a.extraCiyingRankInfo[winCountField]);
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player.extraCiyingRankInfo[winCountField]} 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getLoseCountLeaderboardForCiying(session: any, wordlesNum: number, title: string, number: number, isHardMode: boolean) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    let sortedPlayers;
    let result = '';

    let loseCountField = isHardMode ? 'loseIn1HardMode' : 'loseIn1Mode';

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      loseCountField = `loseIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort((a, b) => b.extraCiyingRankInfo[loseCountField] - a.extraCiyingRankInfo[loseCountField]);
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player.extraCiyingRankInfo[loseCountField]} 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getFastestGuessTimeLeaderboardForCiying(session: any, wordlesNum: number, title: string, number: number, isHardMode: boolean) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    let sortedPlayers;
    let result = '';

    let fastestGuessTimeField = isHardMode ? 'fastestGuessTimeIn1HardMode' : 'fastestGuessTimeIn1Mode';

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      fastestGuessTimeField = `fastestGuessTimeIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers
      .filter(player => player.extraCiyingRankInfo[fastestGuessTimeField] > 0)
      .sort((a, b) => a.extraCiyingRankInfo[fastestGuessTimeField] - b.extraCiyingRankInfo[fastestGuessTimeField]);
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${formatGameDuration2(player.extraCiyingRankInfo[fastestGuessTimeField])}\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function generateHandlePinyinsImage(pinyinsHtml: string) {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({width: 420, height: 570, deviceScaleFactor: 1});
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 6.04px;">
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

    await page.setContent(html, {waitUntil: 'load'});
    const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();
    await context.close()


    return imageBuffer;
  }

  async function deductMoney(channelId: string, platform: string) {
    const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId});
    for (const thisGamingPlayer of getPlayers) {
      const {userId, money} = thisGamingPlayer;
      if (money === 0) {
        continue;
      }
      const uid = await getPlayerUid(platform, userId);
      const [userMonetary] = await ctx.database.get('monetary', {uid});
      const value = userMonetary.value - money;
      await ctx.database.set('monetary', {uid}, {value});
      // 更新货币变动记录
      const [playerInfo] = await ctx.database.get('wordle_player_records', {userId});
      await ctx.database.set('wordle_player_records', {userId}, {moneyChange: playerInfo.moneyChange - money});
    }
  }

  async function processExtraGameInfos(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('extra_wordle_game_records', {channelId});

    return extraGameInfos
      .map(({
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
              presentPinyins
            }) => {
        const present = presentLetters.length === 0 ? '' : `\n包含：【${presentLetters}】`;
        const absent = absentLetters.length === 0 ? '' : `\n不包含：【${absentLetters}】`;
        const presentWithoutIndex = presentLettersWithIndex.length === 0 ? '' : `\n位置排除：【${presentLettersWithIndex.join(', ')}】`;

        const pinyinsCorrectInfo = correctPinyinsWithIndex.length !== 0 ? `\n正确拼音：【${correctPinyinsWithIndex.join(', ')}】` : '';
        const pinyinsPresentInfo = presentPinyins.length !== 0 ? `\n包含拼音：【${presentPinyins.join(', ')}】` : '';
        const pinyinsAbsentInfo = absentPinyins.length !== 0 ? `\n不包含拼音：【${absentPinyins.join(', ')}】` : '';
        const pinyinsPresentWithIndexInfo = presentPinyinsWithIndex.length !== 0 ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(', ')}】` : '';

        const tonesCorrectInfo = correctTonesWithIndex.length !== 0 ? `\n正确声调：【${correctTonesWithIndex.join(', ')}】` : '';
        const tonesPresentInfo = presentTones.length !== 0 ? `\n包含声调：【${presentTones.join(', ')}】` : '';
        const tonesAbsentInfo = absentTones.length !== 0 ? `\n不包含声调：【${absentTones.join(', ')}】` : '';
        const tonesPresentWithIndexInfo = presentTonesWithIndex.length !== 0 ? `\n声调位置排除：【${presentTonesWithIndex.join(', ')}】` : '';
        return `\n当前进度：【${correctLetters.join('')}】${present}${absent}${presentWithoutIndex}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}`;
      })
      .join('\n');
  }

  async function processExtraGameRecords(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('extra_wordle_game_records', {channelId})

    const resultStrings: string[] = extraGameInfos.map(info => {
      // return `\n答案是：【${info.wordGuess}】${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${info.wordAnswerChineseDefinition}`
      return `\n答案是：【${info.wordGuess}】${info.wordAnswerChineseDefinition !== '' ? `${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${replaceEscapeCharacters(info.wordAnswerChineseDefinition)}` : ''}`;
    })

    return resultStrings.join('\n')
  }

  async function generateWordlesImage(htmlImgString: string,) {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({
      width: config.compositeImagePageWidth,
      height: config.compositeImagePageHeight,
      deviceScaleFactor: 1
    })
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

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

    await page.setContent(html, {waitUntil: 'load'});
    const wordlesImageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();
    await context.close()

    return wordlesImageBuffer;
  }

  async function getLeaderboardWinOrLose(type, number, statKey, label) {
    if (typeof number !== 'number' || isNaN(number) || number < 0) {
      return '请输入大于等于 0 的数字作为排行榜的参数。';
    }
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});

    // 降序排序
    getPlayers.sort((a, b) => (b.stats[type]?.[statKey] || 0) - (a.stats[type]?.[statKey] || 0));

    const leaderboard: string[] = getPlayers.slice(0, number).map((player, index) => `${index + 1}. ${player.username}：${player.stats[type]?.[statKey]} 次`);

    return `${type}模式${label}排行榜：\n${leaderboard.join('\n')}`;
  }

  async function getLeaderboardFastestGuessTime(type: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    const leaderboard = getPlayers
      .filter(player => player.fastestGuessTime[type] > 0)
      .sort((a, b) => a.fastestGuessTime[type] - b.fastestGuessTime[type])
      .slice(0, number)
      .map((player, index) => `${index + 1}. ${player.username}：${formatGameDuration2(player.fastestGuessTime[type])}`)
      .join('\n');

    return `${type}模式最快用时排行榜：\n${leaderboard}`;
  }

  async function generateLetterTilesHtml(wordGuess: string, inputWord: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord): Promise<string> {
    const wordHtml: string[] = new Array(inputWord.length);
    const letterCountMap: { [key: string]: number } = {};

    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex


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
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="correct">${letter}</div></div>`;
        letterCountMap[letter]--;

        correctLetters[i] = letter;
      } else {
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="unchecked">${letter}</div></div>`;
      }
      htmlIndex++;
    }

    // 处理其他标记
    htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordHtml[htmlIndex].includes("data-state=\"unchecked\"")) {
        if (wordGuess.includes(letter)) {
          if (letterCountMap[letter] > 0) {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"present\"");
            letterCountMap[letter]--;

            presentLetters += letter;
            presentLettersWithIndex.push(`${letter}-${i + 1}`)
          } else {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
            absentLetters += letter;
          }
        } else {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
          absentLetters += letter;
        }
      }
      htmlIndex++;
    }
    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: uniqueSortedLowercaseLetters(presentLetters),
        absentLetters: removeLetters(gameInfo.wordGuess, uniqueSortedLowercaseLetters(absentLetters)),
        presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
      });
    };
    if (wordleIndex === 1) {
      await setWordleGameRecord('wordle_game_records', {channelId});
    } else {
      await setWordleGameRecord('extra_wordle_game_records', {channelId, wordleIndex});
    }
    return wordHtml.join("\n");
  }

  async function generateLetterTilesHtmlForCiying(answerIdiom: string, userInputIdiom: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord, isHardMode: boolean): Promise<string> {
    const htmlResult: string[] = [`<div class="relative flex items-center">
<div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`];
    const strokesHtmlCache: string[][] = gameInfo.strokesHtmlCache
    const correctLetters: string[] = gameInfo.correctLetters;
    const previousGuess: string[] = gameInfo.previousGuess;
    const previousGuessIdioms: string[] = gameInfo.previousGuessIdioms;
    const defaultModeSettings = {
      keepShadow: !0,
      correctThreshold: .5,
      presentThreshold: 1,
      shiftFactor: .7,
      idiomLimit: 2e3
    }
    const hardModeSettings = {
      keepShadow: !1,
      correctThreshold: .3,
      presentThreshold: 1,
      shiftFactor: .7
    }
    const config = isHardMode ? hardModeSettings : defaultModeSettings
    for (let i = 0; i < answerIdiom.length; i++) {
      const compareReslut = compareStrokes(strokesData[answerIdiom[i]], strokesData[userInputIdiom[i]], null, config)
      compareReslut.match = answerIdiom[i] === userInputIdiom[i]
      if (compareReslut.match || correctLetters[i] !== '*') {
        correctLetters[i] = answerIdiom[i]
        compareReslut.shadows = []
        for (const stroke of strokesData[answerIdiom[i]].strokes) {
          compareReslut.shadows.push({stroke, shiftX: 0, shiftY: 0, distance: 0})
        }
        compareReslut.match = true
      }
      htmlResult.push(` <button class="transition-transform betterhover:hover:scale-y-90">
                                <div class="flex h-32 w-32 items-center justify-center border-neutral-400 dark:border-neutral-600 ${compareReslut.match ? 'bg-correct' : 'border-2'}"
                                     style="">
                                    <svg viewBox="0 0 1024 1024" class="h-24 w-24">
                                        <g transform="scale(1, -1) translate(0, -900)">
                                        ${compareReslut.match || previousGuessIdioms.includes(userInputIdiom) || isHardMode ? '' : strokesHtmlCache[i].join('\n')}`)

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
          continue
        }

        const theStrokePath = `  <path d="${shadow.stroke}"
                                                  opacity="${(config.presentThreshold - Math.max(shadow.distance, config.correctThreshold)) / (config.presentThreshold - config.correctThreshold)}"
                                                  transform="translate(${shadow.shiftX}, ${shadow.shiftY})"
                                                  class="${compareReslut.match ? 'fill-white' : shadow.distance === 0 ? 'fill-correct' : 'dark:fill-white'}"></path>
                                           `
        htmlResult.push(theStrokePath)
        if (!previousGuess.includes(`${userInputIdiom[i]}-${i}`)) {
          strokesHtmlCache[i].push(theStrokePath)
        }

      }
      htmlResult.push(`</g>
                                    </svg>
                                </div>
                            </button>`)
    }


    htmlResult.push(`</div>
</div>`)
    const userInputIdiomArray = userInputIdiom.split("").map((char, index) => `${char}-${index}`);
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
      await setWordleGameRecord('wordle_game_records', {channelId});
    } else {
      await setWordleGameRecord('extra_wordle_game_records', {channelId, wordleIndex});
    }
    return htmlResult.join('\n')
  }


  async function generateLetterTilesHtmlForHandle(answerIdiom: string, userInputIdiom: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord, answerPinyin: string, userInputPinyin: string) {
    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex
    let correctPinyinsWithIndex = gameInfo.correctPinyinsWithIndex
    let presentPinyinsWithIndex = gameInfo.presentPinyinsWithIndex
    let absentPinyins = gameInfo.absentPinyins
    let correctTonesWithIndex = gameInfo.correctTonesWithIndex
    let presentTonesWithIndex = gameInfo.presentTonesWithIndex
    let absentTones = gameInfo.absentTones
    let presentPinyins = gameInfo.presentPinyins
    let presentTones = gameInfo.presentTones

    interface WordInfo {
      word: string;
      pinyin: string[];
    }

    if (!userInputPinyin) {
      const userInputIdiomInfo = await getIdiomInfo(userInputIdiom)
      userInputPinyin = userInputIdiomInfo.pinyin
    }

    // 拼音转换 分离音标 string[][]
    const processedUserInputPinyin = processPinyin(userInputPinyin)
    const processedAnswerIdiomPinyin = processPinyin(answerPinyin)

    // 总信息
    const userInputIdiomAllRecords: WordInfo[] = userInputIdiom.split('').map((char, index) => {
      const pinyinArray = processedUserInputPinyin[index].map(p => {
        const [pinyin, status = ''] = p.split('-');
        return `${pinyin}-absent${status ? `-${status}-absent` : ''}`;
      });
      return {word: `${char}-absent`, pinyin: pinyinArray};
    });


    // 汉字统计
    const userInputIdiomCharCount = countCharactersAndIndexes(userInputIdiom);
    const answerIdiomCharCount = countCharactersAndIndexes(answerIdiom);
    // 声母、韵母、整体认读音节统计
    const userInputPinyinOccurrences = processPinyinArray(processedUserInputPinyin);
    const answerIdiomPinyinOccurrences = processPinyinArray(processedAnswerIdiomPinyin);

    const userInputPinyinAllOccurrences = mergeOccurrences(userInputPinyinOccurrences);
    const answerIdiomPinyinAllOccurrences = mergeOccurrences(answerIdiomPinyinOccurrences);
    // 声调统计
    const userInputTones = countNumericTones(processedUserInputPinyin);
    const answerIdiomTones = countNumericTones(processedAnswerIdiomPinyin);
    const answerIdiomTonesCopy = answerIdiomTones

    for (const char in userInputIdiomCharCount) {
      if (char in answerIdiomCharCount) {
        const userInputCharInfo = userInputIdiomCharCount[char];
        const answerCharInfo = answerIdiomCharCount[char];

        const commonIndexes = userInputCharInfo.indexes.filter(index => answerCharInfo.indexes.includes(index));

        commonIndexes.forEach(index => {
          // correct
          // userInputIdiomAllRecords[index].pinyin = userInputIdiomAllRecords[index].pinyin.map(pinyin => pinyin.replace(/-\w+$/g, '-correct'));
          userInputIdiomAllRecords[index].word = userInputIdiomAllRecords[index].word.replace(/-\w+$/g, '-correct');
          correctLetters[index] = userInputIdiomAllRecords[index].word.split('-')[0]
          // updateOccurrences(answerIdiomPinyinAllOccurrences, index);
          // updateOccurrences(userInputPinyinAllOccurrences, index);
          // updateOccurrences(userInputTones, index);
          // updateOccurrences(answerIdiomTones, index);

          userInputCharInfo.count -= 1;
          userInputCharInfo.indexes = userInputCharInfo.indexes.filter(i => i !== index);

          answerCharInfo.count -= 1;
          answerCharInfo.indexes = answerCharInfo.indexes.filter(i => i !== index);
        });

        userInputCharInfo.indexes.forEach(userIndex => {
          if (!answerCharInfo.indexes.includes(userIndex) && answerCharInfo.count > 0) {
            // present
            userInputIdiomAllRecords[userIndex].word = userInputIdiomAllRecords[userIndex].word.replace(/-\w+$/g, '-present');

            presentLetters += userInputIdiomAllRecords[userIndex].word.split('-')[0]
            presentLettersWithIndex.push(`${userInputIdiomAllRecords[userIndex].word.split('-')[0]}-${userIndex + 1}`)
            answerCharInfo.count -= 1;
          }
        });
      } else {
        // absent
        absentLetters += char
      }
    }

    for (const element in userInputPinyinAllOccurrences) {
      if (element in answerIdiomPinyinAllOccurrences) {
        const userInputElementInfo = userInputPinyinAllOccurrences[element];
        const answerElementInfo = answerIdiomPinyinAllOccurrences[element];

        const commonPositions = userInputElementInfo.positions.filter(position => answerElementInfo.positions.includes(position));

        commonPositions.forEach(position => {
          // correct
          const pinyinArray = userInputIdiomAllRecords[position].pinyin.map(pinyin => {
            return pinyin.split('-')[0]
          }).join('')

          const matchIndex = pinyinArray.indexOf(element)
          if (matchIndex !== -1) {
            for (let i = matchIndex; i < matchIndex + element.length; i++) {
              userInputIdiomAllRecords[position].pinyin[i] = userInputIdiomAllRecords[position].pinyin[i].replace('absent', 'correct')
            }
          }

          correctPinyinsWithIndex.push(`${element}-${position + 1}`)

          userInputElementInfo.count -= 1;
          userInputElementInfo.positions = userInputElementInfo.positions.filter(i => i !== position);

          answerElementInfo.count -= 1;
          answerElementInfo.positions = answerElementInfo.positions.filter(i => i !== position);
        });

        userInputElementInfo.positions.forEach(userPosition => {
          if (!answerElementInfo.positions.includes(userPosition) && answerElementInfo.count > 0) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin.map(pinyin => {
              return pinyin.split('-')[0]
            }).join('')

            const matchIndex = pinyinArray.indexOf(element)
            if (matchIndex !== -1) {
              for (let i = matchIndex; i < matchIndex + element.length; i++) {
                userInputIdiomAllRecords[userPosition].pinyin[i] = userInputIdiomAllRecords[userPosition].pinyin[i].replace('absent', 'present')
              }
            }
            presentPinyins.push(element)
            presentPinyinsWithIndex.push(`${element}-${userPosition + 1}`)
            answerElementInfo.count -= 1;
          }
        });
      } else {
        absentPinyins.push(element)
      }
    }


    for (const tone in userInputTones) {
      if (tone in answerIdiomTones) {
        // correct
        const userInputToneInfo = userInputTones[tone];
        const answerToneInfo = answerIdiomTones[tone];

        const commonPositions = userInputToneInfo.positions.filter(position => answerToneInfo.positions.includes(position));

        commonPositions.forEach(position => {
          const matchIndex = userInputIdiomAllRecords[position].pinyin.findIndex(pinyin => pinyin.includes(`-${tone}-absent`));
          if (matchIndex !== -1) {
            userInputIdiomAllRecords[position].pinyin[matchIndex] = userInputIdiomAllRecords[position].pinyin[matchIndex].replace(`-${tone}-absent`, `-${tone}-correct`);
          }
          correctTonesWithIndex.push(`第${tone}声-${position + 1}`)
          userInputToneInfo.count -= 1;
          userInputToneInfo.positions = userInputToneInfo.positions.filter(i => i !== position);

          answerToneInfo.count -= 1;
          answerToneInfo.positions = answerToneInfo.positions.filter(i => i !== position);
        });

        userInputToneInfo.positions.forEach(userPosition => {
          if (!answerToneInfo.positions.includes(userPosition) && answerToneInfo.count > 0) {
            // present
            const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin;
            const matchIndex = pinyinArray.findIndex(pinyin => pinyin.includes(`-${tone}-absent`));
            if (matchIndex !== -1) {
              userInputIdiomAllRecords[userPosition].pinyin[matchIndex] = pinyinArray[matchIndex].replace(`-${tone}-absent`, `-${tone}-present`);
            }
            presentTones.push(`第${tone}声`)
            presentTonesWithIndex.push(`第${tone}声-${userPosition + 1}`)
            answerToneInfo.count -= 1;
          }
        });
      } else {
        absentTones.push(`第${tone}声`)
      }
    }

    const processedRecords = processAllRecords(userInputIdiomAllRecords);

    const processedRecords2 = transformRecords(processedRecords)

    const htmlResult: string[] = [`<div flex="">`]
    for (const record of processedRecords2) {
      const wordValue = record.word.value
      const statusMap: { [key: string]: string } = {
        'absent': 'op80',
        'present': 'text-mis',
        'correct': 'text-ok'
      };

      let wordStatus = record.word.status;
      wordStatus = statusMap[wordStatus] || wordStatus;

      const statusMap2: { [key: string]: string } = {
        'absent': 'op35',
        'present': 'text-mis',
        'correct': 'text-ok'
      };
      const pinyin = record.pinyin
      const separatedPinyin = separatePinyin(record);
      const initial = record.initial
      const final = record.final
      const toneValue = record.tune.value
      const toneStatus = record.tune.status
      const tonesPaths = [
        '0',
        // 第 1 声
        '<path d="M3.35 8C2.60442 8 2 8.60442 2 9.35V10.35C2 11.0956 2.60442 11.7 3.35 11.7H17.35C18.0956 11.7 18.7 11.0956 18.7 10.35V9.35C18.7 8.60442 18.0956 8 17.35 8H3.35Z" fill="currentColor"></path>',
        // 第 2 声
        '<path d="M16.581 3.71105C16.2453 3.27254 15.6176 3.18923 15.1791 3.52498L3.26924 12.6439C2.83073 12.9796 2.74743 13.6073 3.08318 14.0458L4.29903 15.6338C4.63478 16.0723 5.26244 16.1556 5.70095 15.8199L17.6108 6.70095C18.0493 6.3652 18.1327 5.73754 17.7969 5.29903L16.581 3.71105Z" fill="currentColor"></path>',
        // 第 3 声
        '<path d="M1.70711 7.70712C1.31658 7.3166 1.31658 6.68343 1.70711 6.29291L2.41421 5.5858C2.80474 5.19528 3.4379 5.19528 3.82843 5.5858L9.31502 11.0724C9.70555 11.4629 10.3387 11.4629 10.7292 11.0724L16.2158 5.5858C16.6064 5.19528 17.2395 5.19528 17.63 5.5858L18.3372 6.29291C18.7277 6.68343 18.7277 7.3166 18.3372 7.70712L10.7292 15.315C10.3387 15.7056 9.70555 15.7056 9.31502 15.315L1.70711 7.70712Z" fill="currentColor"></path>',
        // 第 4 声
        '<path d="M4.12282 3.71105C4.45857 3.27254 5.08623 3.18923 5.52474 3.52498L17.4346 12.6439C17.8731 12.9796 17.9564 13.6073 17.6207 14.0458L16.4048 15.6338C16.0691 16.0723 15.4414 16.1556 15.0029 15.8199L3.09303 6.70095C2.65452 6.3652 2.57122 5.73754 2.90697 5.29903L4.12282 3.71105Z" fill="currentColor"></path>'
      ];
      const html: string[] = [`<div w-30="" h-30="" m2="">
                    <div h-30="" w-30="" border-2="" flex="~ center" relative="" leading-1em="" em="" font-serif=""
                         class="bg-gray-400/8 border-transparent">
                        <div absolute="" text-5xl="" leading-1em="" class="${wordStatus} top-12">${wordValue}</div>
                        <div absolute="" font-mono="" text-center="" left-0="" right-0="" font-100="" flex=""
                             flex-col="" items-center="" class="top-14px" text-2xl="">
                            <div relative="" ma="" items-start="" flex="~ x-center">
                                ${separatedPinyin.initials.length > 0 ? `<div class="${statusMap2[separatedPinyin.initials[0].status]}" mx-1px="">${initial}</div>` : ''}
<div mx-1px="" flex="">`]
      for (const final of separatedPinyin.finals) {
        if (!final.isHasTone) {
          html.push(`<div class="${statusMap2[final.status]}">${final.value}</div>`)
        } else {
          html.push(`                  <div relative="">
                                        <div class="${statusMap2[final.status]}">${final.value === 'i' ? 'ı' : final.value}</div>
                                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                             class="${statusMap2[toneStatus]}" absolute="" w="86%" left="8%"
                                             style="bottom: 1.5rem;">
                                            ${tonesPaths[toneValue]}
                                        </svg>
                                    </div>`)
        }
      }
      html.push(`</div>
                            </div>
                        </div>
                    </div>
                </div>`)
      htmlResult.push(html.join('\n'))
    }
    htmlResult.push(`</div>`)

    const pinyinSet = new Set(Object.keys(answerIdiomPinyinOccurrences.initialsOccurrences)
      .concat(Object.keys(answerIdiomPinyinOccurrences.finalsOccurrences)));

    const filteredAbsentPinyins = absentPinyins.filter(pinyin => !pinyinSet.has(pinyin));
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
        absentLetters: removeLetters(gameInfo.wordGuess, removeDuplicates(absentLetters)),
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
      await setWordleGameRecord('wordle_game_records', {channelId});
    } else {
      await setWordleGameRecord('extra_wordle_game_records', {channelId, wordleIndex});
    }

    return htmlResult.join('\n')

  }


  async function setGuessRunningStatus(channelId: string, isRunning: boolean): Promise<void> {
    await ctx.database.set('wordle_game_records', {channelId}, {isRunning});
  }

  async function endGame(channelId: string) {
    await Promise.all([
      ctx.database.remove('wordle_gaming_player_records', {channelId}),
      ctx.database.remove('wordle_game_records', {channelId}),
      ctx.database.remove('extra_wordle_game_records', {channelId}),
    ]);
  }

  async function getCiyingSuccessCountLeaderboardForCiying(session: any, wordlesNum: number, sortField: string, title: string, number: number, isHardMode: boolean) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    let sortedPlayers;
    let result = '';

    let successCountField = isHardMode ? 'successCountIn1HardMode' : 'successCountIn1Mode';

    if (wordlesNum >= 2 && wordlesNum <= 4) {
      successCountField = `successCountIn${wordlesNum}Mode`;
    }

    sortedPlayers = getPlayers.sort((a, b) => b.extraCiyingRankInfo[successCountField] - a.extraCiyingRankInfo[successCountField]);
    const topPlayers = sortedPlayers.slice(0, number);

    result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player.extraCiyingRankInfo[successCountField]} 次\n`;
    });

    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function getLeaderboard(session: any, type: string, sortField: string, title: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {})
    const sortedPlayers = getPlayers.sort((a, b) => b[sortField] - a[sortField])
    const topPlayers = sortedPlayers.slice(0, number)

    let result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player[sortField]} ${(type === 'moneyChange') ? '点' : '次'}\n`
    })
    return await sendMessage(session, result, `开始游戏 排行榜`);
  }

  async function updatePlayerRecordsLose(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get('wordle_player_records', {userId: player.userId});
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedLose = playerInfo.lose + 1;
      playerInfo.stats[gameMode].lose += 1;

      if (gameInfo.gameMode === '词影') {
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
        lose: updatedLose
      };

      if (gameInfo.gameMode === '词影') {
        updateData['extraCiyingRankInfo'] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set('wordle_player_records', {userId: player.userId}, updateData);
    }
  }


  async function updatePlayerRecordsWin(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const gameMode = gameInfo.gameMode;
      const [playerInfo] = await ctx.database.get('wordle_player_records', {userId: player.userId});
      if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
        continue;
      }
      const updatedWin = playerInfo.win + 1;
      playerInfo.stats[gameMode].win += 1;

      if (gameInfo.gameMode === '词影') {
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
        win: updatedWin
      };

      if (gameInfo.gameMode === '词影') {
        updateData['extraCiyingRankInfo'] = playerInfo.extraCiyingRankInfo;
      }

      await ctx.database.set('wordle_player_records', {userId: player.userId}, updateData);
    }
  }

  async function processNonZeroMoneyPlayers(channelId: string, platform: string) {
    const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId});
    const settlementRecords: string[] = [];

    for (const thisGamingPlayer of getPlayers) {
      const {userId, money, username} = thisGamingPlayer;

      if (money === 0) {
        continue;
      }

      const uid = await getPlayerUid(platform, userId);
      const rewardMultiplier = config.defaultRewardMultiplier;
      const gainAmount = money * rewardMultiplier;

      await ctx.monetary.gain(uid, gainAmount);

      // 更新货币变动记录
      const [playerInfo] = await ctx.database.get('wordle_player_records', {userId});
      const updatedMoneyChange = playerInfo.moneyChange + gainAmount;
      await ctx.database.set('wordle_player_records', {userId}, {moneyChange: updatedMoneyChange});

      // 为投入货币不是零的玩家生成结算字符串并添加到结算记录数组
      const settlementString = `【${username}】：【+${gainAmount}】`;
      settlementRecords.push(settlementString);
    }

    // 将结算记录数组组合成一个最终结算字符串
    return settlementRecords.join('\n');
  }

  async function updateGamingPlayerRecords(channelId: string) {
    // 非经典还钱
    const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId});
    for (const thisGamingPlayer of getPlayers) {
      const {userId, money} = thisGamingPlayer;
      if (money === 0) {
        continue;
      }
      await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money: 0});
    }
  }

  async function generateImage(styledHtml: string, gridHtml: string): Promise<Buffer> {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({width: 611, height: 731, deviceScaleFactor: 1})
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `${htmlPrefix}
    ${styledHtml}
    ${htmlAfterStyle}
    <div class="Board-module_board__jeoPS" style="width: 600px; height: 720px;">
      ${gridHtml}
    </div>
    ${htmlSuffix}`;


    await page.setContent(html, {waitUntil: 'load'});
    const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();
    await context.close()

    return imageBuffer;
  }

  async function generateImageForCiying(gridHtml: string, rowNum: number): Promise<Buffer> {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({width: 611, height: 140 * rowNum, deviceScaleFactor: 1})
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="zh" class="h-full ${config.isDarkThemeEnabled ? 'dark' : ''}">
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


    await page.setContent(html, {waitUntil: 'load'});
    const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();
    await context.close()

    return imageBuffer;
  }

  async function generateImageForHandle(gridHtml: string): Promise<Buffer> {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({width: 611, height: 731, deviceScaleFactor: 1})
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 7.55px;">
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
    <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class="${config.isHighContrastThemeEnabled ? 'colorblind' : ''}">
        <div flex="~ col" items-center="">
           ${gridHtml}
        </div>
    </main>
</div>
</body>
</html>`;


    await page.setContent(html, {waitUntil: 'load'});
    const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();
    await context.close();

    return imageBuffer;
  }

  async function getPlayerUid(platform: string, userId: string): Promise<number> {
    const user = await getUserFromDatabase(platform, userId);
    return user.id;
  }

  async function getUserFromDatabase(platform: string, userId: string) {
    return await ctx.database.getUser(platform, userId);
  }

  async function getNumberOfPlayers(channelId: string): Promise<number> {
    const playerRecords = await ctx.database.get('wordle_gaming_player_records', {channelId});
    return playerRecords.length;
  }

  async function isPlayerInGame(channelId: string, userId: string): Promise<boolean> {
    const getPlayer = await ctx.database.get('wordle_gaming_player_records', {channelId, userId});
    return getPlayer.length !== 0;
  }

  async function getGameInfo(channelId: string): Promise<GameRecord> {
    let gameRecord = await ctx.database.get('wordle_game_records', {channelId});
    if (gameRecord.length === 0) {
      await ctx.database.create('wordle_game_records', {
        channelId,
        isStarted: false,
      });
      gameRecord = await ctx.database.get('wordle_game_records', {channelId});
    }
    return gameRecord[0];
  }

  async function getGameInfo2(channelId: string, wordleIndex: number): Promise<ExtraGameRecord> {
    const gameRecord = await ctx.database.get('extra_wordle_game_records', {channelId, wordleIndex});
    return gameRecord[0];
  }

  async function updateNameInPlayerRecord(session, userId: string, username: string): Promise<void> {
    const userRecord = await ctx.database.get('wordle_player_records', {userId});

    let isChange = false;

    if (userRecord.length === 0) {
      await ctx.database.create('wordle_player_records', {
        userId,
        username,
      });
      return;
    }

    const existingRecord = userRecord[0];

    if (username !== existingRecord.username && (!(isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') || (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' && config.isUsingUnifiedKoishiBuiltInUsername))) {
      existingRecord.username = username;
      isChange = true;
    }

    const keys = ['Lewdle', '汉兜', 'Numberle', 'Math', '词影'];

    keys.forEach((key) => {
      if (!existingRecord.stats[key] || !existingRecord.stats.hasOwnProperty(key)) {
        existingRecord.stats[key] = {win: 0, lose: 0};
        isChange = true;
      }
      if (!existingRecord.fastestGuessTime[key]) {
        existingRecord.fastestGuessTime[key] = 0;
        isChange = true;
      }
    });

    if (isChange) {
      await ctx.database.set('wordle_player_records', {userId}, {
        username: existingRecord.username,
        stats: existingRecord.stats,
        fastestGuessTime: existingRecord.fastestGuessTime
      });
    }
  }

  let sentMessages = [];
  const msgSeqMap: { [msgId: string]: number } = {};

  async function sendMessage(session: any, message: any, markdownCommands: string, numberOfMessageButtonsPerRow?: number, isButton?: boolean): Promise<void> {
    isButton = isButton || false;
    numberOfMessageButtonsPerRow = numberOfMessageButtonsPerRow || config.numberOfMessageButtonsPerRow;
    const {bot, channelId} = session;
    let messageId;
    let isPushMessageId = false;
    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
      const msgSeq = msgSeqMap[session.messageId] || 10;
      msgSeqMap[session.messageId] = msgSeq + 100;
      const buttons = await createButtons(session, markdownCommands);

      const rows = [];
      let row = {buttons: []};
      buttons.forEach((button, index) => {
        row.buttons.push(button);
        if (row.buttons.length === 5 || index === buttons.length - 1 || row.buttons.length === numberOfMessageButtonsPerRow) {
          rows.push(row);
          row = {buttons: []};
        }
      });

      if (!isButton && config.isTextToImageConversionEnabled) {
        const lines = message.toString().split('\n');
        const isOnlyImgTag = lines.length === 1 && lines[0].trim().startsWith('<img');
        if (isOnlyImgTag) {
          [messageId] = await session.send(message);
        } else {
          const modifiedMessage = lines
            .map((line) => {
              if (line.trim() !== '' && !line.includes('<img')) {
                return `# ${line}`;
              } else {
                return line + '\n';
              }
            })
            .join('\n');
          ctx.inject(['markdownToImage'], async (ctx) => {
            const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
            [messageId] = await session.send(h.image(imageBuffer, `image/${config.imageType}`));
          })
        }
        if (config.retractDelay !== 0) {
          isPushMessageId = true;
          sentMessages.push(messageId);
        }

        if (config.isTextToImageConversionEnabled && markdownCommands !== '') {
          await sendMessage(session, '', markdownCommands, numberOfMessageButtonsPerRow, true)
        }
      } else if (isButton && config.isTextToImageConversionEnabled) {
        const result = await session.qq.sendMessage(session.channelId, {
          msg_type: 2,
          msg_id: session.messageId,
          msg_seq: msgSeq,
          content: '',
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
        if (message.attrs?.src || message.includes('<img')) {
          [messageId] = await session.send(message);
        } else {
          // message = message.replace(/\n/g, '\r').replace(/\*/g, "？");
          // message = replaceSymbols(message);
          message = replaceSymbols(message.replace(/\n/g, '\r').replace(/\*/g, "？"));

          const result = await session.qq.sendMessage(session.channelId, {
            msg_type: 2,
            msg_id: session.messageId,
            msg_seq: msgSeq,
            content: '111',
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
        const lines = message.toString().split('\n');
        const isOnlyImgTag = lines.length === 1 && lines[0].trim().startsWith('<img');
        if (isOnlyImgTag) {
          [messageId] = await session.send(message);
        } else {
          const modifiedMessage = lines
            .map((line) => {
              if (line.trim() !== '' && !line.includes('<img')) {
                return `# ${line}`;
              } else {
                return line + '\n';
              }
            })
            .join('\n');
          ctx.inject(['markdownToImage'], async (ctx) => {
            const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
            [messageId] = await session.send(h.image(imageBuffer, `image/${config.imageType}`));
          })
        }
      } else {
        [messageId] = await session.send(message);
      }
    }


    if (config.retractDelay === 0) return;
    if (!isPushMessageId) {
      sentMessages.push(messageId);
    }

    if (sentMessages.length > 1) {
      const oldestMessageId = sentMessages.shift();
      setTimeout(async () => {
        await bot.deleteMessage(channelId, oldestMessageId);
      }, config.retractDelay * 1000);
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

  async function sendPostRequestForGPT1106(content: string): Promise<string> {
    const url = 'https://ngedlktfticp.cloud.sealos.io/v1/chat/completions';
    const headers = {
      'Authorization': 'sk-0HXyYeM287tS1qsI8bAb5f0c3dB746E9A3Bf416dBf99228d',
      'Content-Type': 'application/json'
    };

    const requestBody = {
      "messages": [
        {
          "role": "user",
          "content": `# 汉语拼音生成器
- 提供一个四个汉字的词语，期望输出对应的正确的汉语拼音。
- 只输出汉语拼音，不包含其他无关内容。

示例输入:
戒奢宁俭

期望输出:
jiè shē nìng jiǎn

输入：
${content}

输出：`
        }
      ],
      "stream": false,
      "model": "gpt-3.5-turbo-0125",
      "temperature": 0.5,
      "presence_penalty": 2
    };

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    };

    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        const data = await response.json() as ChatCompletion;
        return data.choices[0].message.content
      } else {
        logger.error('未能提取数据:', response.status);
        return ''
      }
    } catch (error) {
      logger.error('读取数据时出错：', error);
      return ''
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
    return markdownCommands.split(' ').filter(command => command.trim() !== '');
  }

  async function createButtons(session: any, markdownCommands: string) {
    const commands = parseMarkdownCommands(markdownCommands);

    const mapCommandToDataValue = (command: string) => {
      const commandMappings: Record<string, string> = {
        '加入游戏': 'wordlegame.加入',
        '开始游戏': 'wordlegame.开始',
        '改名': 'wordlegame.改名',
        '查询玩家记录': 'wordlegame.查询玩家记录',
        '猜测': 'wordlegame.猜',
        '随机猜测': 'wordlegame.猜 -r',
        '输入': '',
        '排行榜': 'wordlegame.排行榜',
        '玩法介绍': 'wordlegame.玩法介绍',
        '退出游戏': 'wordlegame.退出',
        '查单词': 'wordlegame.查单词',
        '查成语': 'wordlegame.查成语',
        '单词查找器': 'wordlegame.单词查找器',
        '查询进度': 'wordlegame.查询进度',
        '拼音速查表': 'wordlegame.拼音速查表',
        '结束游戏': 'wordlegame.结束',
        '再来一把': 'wordlegame.开始',
        '再来一把经典': 'wordlegame.开始.经典',
        '再来一把CET4': 'wordlegame.开始.CET4',
        '再来一把CET6': 'wordlegame.开始.CET6',
        '再来一把GMAT': 'wordlegame.开始.GMAT',
        '再来一把GRE': 'wordlegame.开始.GRE',
        '再来一把IELTS': 'wordlegame.开始.IELTS',
        '再来一把SAT': 'wordlegame.开始.SAT',
        '再来一把TOEFL': 'wordlegame.开始.TOEFL',
        '再来一把考研': 'wordlegame.开始.考研',
        '再来一把专八': 'wordlegame.开始.专八',
        '再来一把专四': 'wordlegame.开始.专四',
        '再来一把ALL': 'wordlegame.开始.ALL',
        '再来一把Lewdle': 'wordlegame.开始.Lewdle',
        '再来一把汉兜': 'wordlegame.开始.汉兜',
        '再来一把Numberle': 'wordlegame.开始.Numberle',
        '再来一把Math': 'wordlegame.开始.Math',
        '再来一把词影': 'wordlegame.开始.词影',
        '数字': 'Numberle',
        '脏话': 'Lewdle',
        '方程': 'Math',
      };

      return commandMappings[command];
    };

    const createButton = async (command: string) => {
      let dataValue = mapCommandToDataValue(command);
      if (dataValue === undefined) {
        dataValue = command
      }

      return {
        render_data: {
          label: command,
          visited_label: command,
          style: 1,
        },
        action: {
          type: 2,
          permission: {type: 2},
          data: `${dataValue}`,
          enter: !['加入游戏', '猜测', '查询玩家记录', '改名', '输入', '困难', '超困难', '变态', '变态挑战', 'x1', 'x2', 'x3', 'x4', '自由', '全成语'].includes(command),
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
          guildMember = await session.bot.getGuildMember(session.guildId, userId);
        } catch (error) {
          guildMember = {
            user: {
              name: '未知用户',
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
      if (content.includes('=')) {
        try {
          const result = eval(content.split('=')[1]);
          if (!isNaN(result)) {
            return eval(content.split('=')[0]) === result;
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
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  function removeIndexFromPinyins(pinyinsWithIndex: string[]): string[] {
    return pinyinsWithIndex.map((item) => {
      return item.split('-')[0];
    });
  }

  async function updateDataInTargetFile(newFilePath: string, targetFilePath: string, missingProperty: string): Promise<void> {
    try {
      const [newData, targetData] = await Promise.all([readJSONFile(newFilePath), readJSONFile(targetFilePath)]);

      const targetDataMap = new Map(targetData.map((item: any) => [item[missingProperty], item]));

      const missingData = newData.filter((dataItem: any) => !targetDataMap.has(dataItem[missingProperty]));

      targetData.push(...missingData);
      await writeJSONFile(targetFilePath, targetData);

      if (missingData.length > 0) {
        logger.success('添加的对象：', missingData);
      }
    } catch (error) {
      logger.error('发生错误：', error);
    }
  }


  async function writeJSONFile(filePath: string, data: any) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf-8');
  }

  async function readJSONFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  }

  async function ensureFileExists(filePath: string) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }

  async function ensureDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {recursive: true});
    }
  }

  function removeDuplicates(inputString: string): string {
    let result = '';
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

  function findIdiomByIdiom(inputWord: string, idiomsList: Idiom[]): Idiom | undefined {
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
    status: 'absent' | 'present' | 'correct';
    isHasTone: boolean;
  }

  interface SeparatedPinyin {
    initials: PinyinItem[];
    finals: PinyinItem[];
  }

  function separatePinyin(record): SeparatedPinyin {
    const {initial, final, pinyin} = record;

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

    return {initials, finals};
  }


  function transformRecords(records: {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }[]): {
    word: { value: string; status: string };
    pinyin: { value: string; status: string; isHasTone: boolean }[];
    tune: { value: number; status: string };
    initial: string;
    final: string;
  }[] {
    return records.map(record => {
      // 处理 word
      const word = record.word.split('-')[0];
      const status = record.word.split('-')[1];

      let tuneValue: number = 0;
      let tuneStatus = '';
      // 处理 pinyin
      const pinyin = record.pinyin.map(p => {
        let value = p.split('-')[0];
        const status = p.split('-')[1];
        const isHasTone = !!p.split('-')[2]; // 是否有数字声调
        if (isHasTone) {
          tuneValue = parseInt(p.split('-')[2], 10);
          tuneStatus = p.split('-')[3];
        }
        return {value, status, isHasTone};
      });

      return {
        word: {value: word, status},
        pinyin,
        tune: {value: tuneValue, status: tuneStatus},
        initial: record.initial,
        final: record.final,
      };
    });
  }

  function updateOccurrences(occurrences, index) {
    for (const key in occurrences) {
      if (occurrences[key].positions.includes(index)) {
        occurrences[key].count -= 1;
        occurrences[key].positions = occurrences[key].positions.filter(p => p !== index);
      }
    }
  }

  function mergeOccurrences(occurrences: any) {
    const {wholeSyllableRecognitionOccurrences, initialsOccurrences, finalsOccurrences, ...rest} = occurrences;
    const mergedOccurrences = {
      ...wholeSyllableRecognitionOccurrences,
      ...initialsOccurrences,
      ...finalsOccurrences
    };
    return {
      ...mergedOccurrences,
      ...rest
    };
  }

  function countNumericTones(processedPinyin: string[][]) {
    const toneCounts: { [key: number]: { count: number, positions: number[] } } = {};

    processedPinyin.forEach((pinyin, index) => {
      pinyin.forEach((syllable, syllableIndex) => {
        const numericToneMatch = syllable.match(/-(\d)/);
        if (numericToneMatch) {
          const tone = parseInt(numericToneMatch[1]);
          if (toneCounts[tone]) {
            toneCounts[tone].count++;
            toneCounts[tone].positions.push(index);
          } else {
            toneCounts[tone] = {count: 1, positions: [index]};
          }
        }
      });
    });

    return toneCounts;
  }

  function isWholeSyllableRecognition(pinyin: string): boolean {
    const wholeSyllableRecognitionTable = [
      'zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu', 'ye', 'yue', 'yin', 'yun', 'yuan', 'ying'
    ];
    return wholeSyllableRecognitionTable.includes(pinyin);
  }

  function processPinyin2(pinyinArray: string[]): string {
    return pinyinArray.map(pinyin => pinyin.replace(/-\d/g, "")).join("")
  }

  function processPinyin3(pinyin: string): string {
    // 在这里实现处理拼音的逻辑，将状态和数字声调去掉
    return pinyin.replace(/-\w+/g, '').replace(/\d/g, '');
  }

  interface ProcessedRecord {
    word: string;
    pinyin: string[];
    initial: string;
    final: string;
  }

// 韵母
  const finals = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'er', 'ia', 'ie', 'ua', 'uo', 'üe', 'ue', 'iao', 'iou', 'uai', 'uei', 'an', 'ian', 'uan', 'üan', 'en', 'in', 'uen', 'ün', 'un', 'ang', 'iang', 'uang', 'eng', 'ing', 'ueng', 'ong', 'iong'];

  function processAllRecords(userInputIdiomAllRecords: { word: string, pinyin: string[] }[]): ProcessedRecord[] {
    const processedRecords: ProcessedRecord[] = userInputIdiomAllRecords.map(record => {
      const processedPinyinStrings = record.pinyin.map(processPinyin3);
      let initial = '';
      let final = '';
      for (let i = finals.length - 1; i >= 0; i--) {
        const potentialFinal = finals[i];
        const combinedPinyin = processedPinyinStrings.join('');
        if (combinedPinyin.endsWith(potentialFinal)) {
          final = potentialFinal;
          initial = combinedPinyin.slice(0, combinedPinyin.length - potentialFinal.length);
          break;
        }
      }
      return {
        word: record.word,
        pinyin: record.pinyin,
        initial,
        final
      };
    });

    return processedRecords;
  }

  function processPinyinArray(pinyinArray: string[][]): {
    wholeSyllableRecognitionOccurrences: { [key: string]: { count: number, positions: number[] } },
    initialsOccurrences: { [key: string]: { count: number, positions: number[] } },
    finalsOccurrences: { [key: string]: { count: number, positions: number[] } }
  } {
    const processedPinyinStrings = pinyinArray.map(processPinyin2);
    const wholeSyllableRecognitionOccurrences: { [key: string]: { count: number, positions: number[] } } = {};
    const initialsOccurrences: { [key: string]: { count: number, positions: number[] } } = {};
    const finalsOccurrences: { [key: string]: { count: number, positions: number[] } } = {};

    processedPinyinStrings.forEach((pinyin, index) => {
      // if (isWholeSyllableRecognition(pinyin) && false) {
      //   if (wholeSyllableRecognitionOccurrences[pinyin]) {
      //     wholeSyllableRecognitionOccurrences[pinyin].count++;
      //     wholeSyllableRecognitionOccurrences[pinyin].positions.push(index);
      //   } else {
      //     wholeSyllableRecognitionOccurrences[pinyin] = {count: 1, positions: [index]};
      //   }
      // } else {
      let initial = '';
      let final = '';
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
          initialsOccurrences[initial] = {count: 1, positions: [index]};
        }
      }
      if (final) {
        if (finalsOccurrences[final]) {
          finalsOccurrences[final].count++;
          finalsOccurrences[final].positions.push(index);
        } else {
          finalsOccurrences[final] = {count: 1, positions: [index]};
        }
      }
      // }
    });

    return {
      wholeSyllableRecognitionOccurrences,
      initialsOccurrences,
      finalsOccurrences
    };
  }

  function countCharactersAndIndexes(idiom: string): { [key: string]: { count: number, indexes: number[] } } {
    const charCount: { [key: string]: { count: number, indexes: number[] } } = {};
    for (let i = 0; i < idiom.length; i++) {
      const char = idiom[i];
      if (charCount[char]) {
        charCount[char].count++;
        charCount[char].indexes.push(i);
      } else {
        charCount[char] = {count: 1, indexes: [i]};
      }
    }
    return charCount;
  }

  function processPinyin(pinyin: string): string[][] {
    const toneMap: { [key: string]: string } = {
      'ā': 'a-1', 'á': 'a-2', 'ǎ': 'a-3', 'à': 'a-4',
      'ē': 'e-1', 'é': 'e-2', 'ě': 'e-3', 'è': 'e-4',
      'ī': 'i-1', 'í': 'i-2', 'ǐ': 'i-3', 'ì': 'i-4',
      'ō': 'o-1', 'ó': 'o-2', 'ǒ': 'o-3', 'ò': 'o-4',
      'ū': 'u-1', 'ú': 'u-2', 'ǔ': 'u-3', 'ù': 'u-4',
      'ǖ': 'ü-1', 'ǘ': 'ü-2', 'ǚ': 'ü-3', 'ǜ': 'ü-4'
    };

    const splitPinyin = pinyin.split(' ');
    const result: string[][] = [];

    splitPinyin.forEach((word) => {
      const processedWord: string[] = [];
      let tempWord = word;
      if (/[jqxy]u/.test(tempWord)) {
        tempWord = tempWord.replace(/u/g, 'ü');
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
      fs.writeFileSync(filePath, jsonData, 'utf-8');
    } catch (error) {
      logger.error("将词语|成语写入文件时出错：", error);
    }
  }

  async function getIdiomInfo(idiom: string): Promise<{ pinyin: string, explanation: string }> {
    try {
      const response = await fetch(`https://dict.baidu.com/s?wd=${idiom}&device=pc&ptype=zici`);
      if (!response.ok) {
        throw new Error('未能提取数据。');
      }

      const html = await response.text();

      // fs.writeFileSync(`${idiom}.html`, html, 'utf8');
      const $ = load(html);
      const basicMeanWrapper = $("#basicmean-wrapper");

      const pinyin = basicMeanWrapper.find(".tab-content .pinyin-font").text().trim();
      const explanation = basicMeanWrapper.find(".tab-content dd p").text().trim();

      if (!pinyin || !explanation) {
        throw new Error('找不到拼音或解释。');
      }
      if (!isIdiomInList(idiom, idiomsList)) {
        const newIdiom: Idiom = {
          idiom,
          pinyin,
          explanation: '【解释】' + explanation,
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(idiomsKoishiFilePath, idiomsList);
      }
      return {pinyin, explanation};
    } catch (error) {
      return {pinyin: '未找到拼音', explanation: '未找到解释'};
    }
  }

  async function getIdiomInfo2(idiom: string): Promise<{ pinyin: string, explanation: string }> {
    try {
      const response = await fetch(`https://www.zdic.net/hans/${idiom}`);
      if (!response.ok) {
        throw new Error('未能提取数据。');
      }

      const html = await response.text();

      // fs.writeFileSync(`${idiom}.html`, html, 'utf8');

      const $ = load(html);

      const pinyin = $('.ciif.noi.zisong .dicpy').first().text().replace(/\s+/g, ' ').trim();
      // const explanation = $('#cyjs .content.definitions.cnr').text().replace(/\s+/g, ' ').trim();
      const cyjsDiv = $("#cyjs");
      cyjsDiv.find("h3").remove();
      const explanation = cyjsDiv.find("p").map((_, p) => $(p).text()).get().join("\n");

      if (!pinyin || !explanation) {
        throw new Error('找不到拼音或解释。');
      }
      if (!isIdiomInList(idiom, idiomsList)) {
        const newIdiom: Idiom = {
          idiom,
          pinyin,
          explanation
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(idiomsFilePath, idiomsList);
      }
      return {pinyin, explanation};
    } catch (error) {
      return {pinyin: '未找到拼音', explanation: '未找到解释'};
    }
  }

  function checkAbsentLetters(lowercaseInputWord: string, absentLetters: string): boolean {
    for (let i = 0; i < lowercaseInputWord.length; i++) {
      if (absentLetters.includes(lowercaseInputWord[i])) {
        return true;
      }
    }
    return false;
  }

  function checkPresentLettersWithIndex(lowercaseInputWord: string, presentLettersWithIndex: string[]): boolean {
    let isInputWordWrong = false;

    presentLettersWithIndex.forEach(item => {
      const [letter, indexStr] = item.split('-');
      const index = parseInt(indexStr, 10) - 1;

      if (lowercaseInputWord.length > index && lowercaseInputWord[index] === letter) {
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

      const wordGroups = $('.word-group');
      let finalResult = '';

      if (wordGroups.length === 0) {
        finalResult = '未找到。';
      } else {
        wordGroups.each((_, element) => {
          const title = $(element).find('.word-group__title').text();
          const words = $(element).find('.word-group__inner .word').map((_, el) => $(el).contents().filter(function () {
            return this.nodeType === 3;
          }).text().trim()).get();
          finalResult += `${title}:\n${words.join(', ')}\n\n`;
        });
      }

      return finalResult
    } catch (error) {
      logger.error('发生错误：', error);
    }
  }

  function capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function fetchWordDefinitions(word: string) {
    const url = 'https://wordword.org/api/words/get_by_word';
    const requestBody = {
      word: word
    };

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {'Content-Type': 'application/json'}
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData;
  }

  function serializeDefinitions(definitions: { [part: string]: any }) {
    let resultString = '';
    for (const part in definitions) {
      resultString += `${part}.\n`;
      definitions[part].forEach((definition: any) => {
        resultString += `- ${definition.text}\n`;
      });
      resultString += '\n';
    }
    return resultString;
  }


  function generateImageTags(buffers: Buffer[]): string {
    return buffers
      .map((buffer, index) => {
        const base64Image = buffer.toString('base64');
        return `    <img src="data:image/png;base64,${base64Image}" alt="图片${index + 1}">`;
      })
      .join('\n');
  }

  function extractLowerCaseWords(arr: { word: string; translation: string }[]): string[] {
    return arr.map(item => item.word.toLowerCase());
  }

  function replaceEscapeCharacters(input: string): string {
    return input.replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  }

  function combineWord(letters: LetterState[]): string {
    return letters.reduce((word, {letter}) => word + letter, '');
  }

  function findWord(targetWord: string): WordEntry | undefined {
    const fileData = getJsonFilePathAndWordCountByLength('ALL', targetWord.length);
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));

    // 小写化
    const lowercaseTargetWord = targetWord.toLowerCase();

    // 寻找
    return jsonData.find((entry) => entry.word.toLowerCase() === lowercaseTargetWord);
  }

  async function findLongestMatchedWords(wordsList: string[], lowercaseInputWord: string, targetWord: string, isChallengeMode: boolean): Promise<string[]> {
    const results = await Promise.all(
      wordsList.map(word => processWordAndMatch(lowercaseInputWord, word, wordsList))
    );

    const maxLength = Math.max(...results.map(result => result.matchedWords.length));
    let longestMatchedWords = results.filter(result => result.matchedWords.length === maxLength).map(result => result.matchedWords);
    if (isChallengeMode && wordsList.includes(targetWord)) {
      const filteredWords = longestMatchedWords.filter(words => words.includes(targetWord));
      if (filteredWords.length > 0) {
        longestMatchedWords = filteredWords;
      }
    }
    const randomIndex = Math.floor(Math.random() * longestMatchedWords.length);
    return longestMatchedWords[randomIndex];
  }


  function processWordAndMatch(lowercaseInputWord: string, word: string, wordsList: string[]): {
    matchedWords: string[],
    length: number
  } {
    const bucket = processWord(lowercaseInputWord, word);
    const matchedWordsList = matchWordsList(bucket, word, wordsList);
    return {matchedWords: matchedWordsList, length: matchedWordsList.length};
  }


  function matchWordsList(bucket: LetterState[], word: string, wordsList: string[]): string[] {
    return wordsList.filter(candidateWord => isMatch(candidateWord, bucket));
  }

  function isMatch(word: string, bucket: LetterState[]): boolean {
    for (let i = 0; i < bucket.length; i++) {
      const bucketState = bucket[i].state;
      const bucketLetter = bucket[i].letter;
      const wordLetter = word[i];

      if (bucketState === 'correct' && wordLetter !== bucketLetter) {
        return false;
      }

      if (bucketState === 'absent' && word.includes(bucketLetter)) {
        return false;
      }

      if (bucketState === 'present' && (wordLetter === bucketLetter || !word.includes(bucketLetter))) {
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
      bucket.push({letter: userLetter, state: userLetter === letter ? 'correct' : 'undefined'});
    }

    for (let i = 0; i < userInputWord.length; i++) {
      const currentBucket = bucket[i];
      if (currentBucket.state !== 'correct') {
        const letterIndex = currentBucket.letter.charCodeAt(0) - 97;
        if (wordArray[letterIndex] > 0) {
          currentBucket.state = 'present';
          wordArray[letterIndex]--;
        } else {
          currentBucket.state = 'absent';
        }
      }
    }

    return bucket;
  }


  function generateStatsInfo(stats, fastestGuessTime) {
    const gameTypes = [
      '经典',
      'CET4',
      'CET6',
      'GMAT',
      'GRE',
      'IELTS',
      'SAT',
      'TOEFL',
      '考研',
      '专八',
      '专四',
      'ALL',
      "Lewdle", "汉兜", 'Numberle', 'Math', '词影',
    ];

    let statsInfo = '';

    gameTypes.forEach(type => {
      const winCount = stats[type]?.win || 0;
      const loseCount = stats[type]?.lose || 0;
      const fastestTime = fastestGuessTime[type] || 0;

      statsInfo += `${type} - 胜：${winCount} 次，负：${loseCount} 次`;
      statsInfo += fastestTime === 0 ? '' : `，最快${formatGameDuration(fastestTime)}`;
      statsInfo += '\n';
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
    return absentLetters.split('').filter(letter => !letterSet.has(letter)).join('');
  }

  function calculateGameDuration(startTime: number, currentTime: number): string {
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
    const uniqueLetters = Array.from(new Set(input.toLowerCase().match(/[a-z]/g)));
    return uniqueLetters.sort().join('');
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
    return `答案是：【${gameInfo.wordGuess}】${gameInfo.wordAnswerChineseDefinition !== '' ? `${gameInfo.pinyin === '' ? '' : `\n拼音为：【${gameInfo.pinyin}】`}\n释义如下：\n${replaceEscapeCharacters(gameInfo.wordAnswerChineseDefinition)}` : ''}`;
  }

  function getRandomWordTranslation(command: string, guessWordLength: number): WordData {
    const fileData = getJsonFilePathAndWordCountByLength(command, guessWordLength);
    if (command === "ALL") {
      const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
      const randomIndex = Math.floor(Math.random() * jsonData.length);
      const randomWordData = jsonData[randomIndex];
      return {
        word: randomWordData.word.toLowerCase(),
        translation: randomWordData.translation.replace(/\\r/g, '\r').replace(/\\n/g, '\n'),
        wordCount: jsonData.length
      };
    } else {
      const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
      const words = Object.keys(jsonData);
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const translation = jsonData[randomWord]['中释'].trim();
      return {word: randomWord.toLowerCase(), translation, wordCount: fileData.wordCount};
    }
  }

  function getJsonFilePathAndWordCountByLength(command: string, guessWordLength: number): {
    filePath: string;
    wordCount: number
  } | null {
    const folderPath = path.join(__dirname, 'assets', 'Wordle', '词汇', command);
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const match = file.match(new RegExp(`${command}_(\\d+)_(\\d+)\\.json`));
      if (match && match[1] && match[2]) {
        const length = parseInt(match[1]);
        const wordCount = parseInt(match[2]);
        if (length === guessWordLength) {
          return {filePath: path.join(folderPath, file), wordCount};
        }
      }
    }
    return null;
  }

  function isValidGuessWordLength(command: string, guessWordLength: number): boolean {
    switch (command) {
      case 'CET4':
        return guessWordLength >= 1 && guessWordLength <= 15;
      case 'CET6':
        return (guessWordLength >= 3 && guessWordLength <= 16) || guessWordLength === 18;
      case 'GMAT':
        return guessWordLength >= 3 && guessWordLength <= 18;
      case 'GRE':
        return (guessWordLength >= 3 && guessWordLength <= 16) || guessWordLength === 1;
      case 'IELTS':
        return (guessWordLength >= 2 && guessWordLength <= 15) || guessWordLength === 17;
      case 'SAT':
        return guessWordLength >= 3 && guessWordLength <= 16;
      case 'TOEFL':
        return (guessWordLength >= 2 && guessWordLength <= 17) || guessWordLength === 20;
      case '考研':
        return guessWordLength >= 2 && guessWordLength <= 15;
      case '专八':
        return guessWordLength >= 1 && guessWordLength <= 18;
      case '专四':
        return (guessWordLength >= 2 && guessWordLength <= 16) || guessWordLength === 18;
      case 'ALL':
        return (guessWordLength >= 1 && guessWordLength <= 35) || guessWordLength === 45 || guessWordLength === 52;
      case 'Numberle':
        return (guessWordLength >= 1 && guessWordLength <= 35);
      case 'Math':
        return (guessWordLength >= 5 && guessWordLength <= 12);
      default:
        return false;
    }
  }

  function getValidGuessWordLengthRange(command: string): string {
    if (command === 'NUMBERLE') {
      command = 'Numberle'
    } else if (command === 'MATH') {
      command = 'Math'
    }
    switch (command) {
      case 'CET4':
        return '【1 ~ 15】';
      case 'CET6':
        return '【3 ~ 16, 18】';
      case 'GMAT':
        return '【3 ~ 18】';
      case 'GRE':
        return '【1, 3 ~ 16】';
      case 'IELTS':
        return '【2 ~ 15, 17】';
      case 'SAT':
        return '【3 ~ 16】';
      case 'TOEFL':
        return '【2 ~ 17, 20】';
      case '考研':
        return '【2 ~ 15】';
      case '专八':
        return '【1 ~ 18】';
      case '专四':
        return '【2 ~ 16, 18】';
      case 'ALL':
        return '【1 ~ 35, 45, 52】';
      case 'Numberle':
        return '【1 ~ 35】';
      case 'Math':
        return '【5 ~ 12】';
      default:
        return '';
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
    let html = '';
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

  function generateEmptyGridHtmlForCiying(rowNum: number, tileNum: number, isBorder: boolean): string {
    let html = '';
    for (let i = 0; i < rowNum; i++) {
      html += `<div class="relative flex items-center">
                        <div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`;
      for (let j = 0; j < tileNum; j++) {
        html += `
        <!--第${i + 1}行第${j + 1}列-->
         <input enterkeyhint="done" disabled="" class="h-32 w-32 border-2 bg-transparent text-center font-serif text-5xl border-neutral-300 dark:border-neutral-700 ${isBorder ? 'border-neutral-500 dark:border-neutral-500' : ''}" placeholder="">
                            `;
      }
      html += `   </div>
                    </div>`;
    }
    return html;
  }

  function generateEmptyGridHtmlForHandle(rowNum: number, tileNum: number): string {
    let html = '';
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
`
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

    </style>`
// htmlStyle* bl* cl*
  const htmlAfterStyle = `
</head>
<body>

<body class="${config.isDarkThemeEnabled ? 'dark' : ''} ${config.isHighContrastThemeEnabled ? 'colorblind' : ''}">
<div>
  <div class="MomentSystem-module_moment__G9hyw">
    <div class="App-module_gameContainer__K_CBh" data-testid="game-wrapper" style="height: calc(100% - 210px);">
      <main class="App-module_game__yruqo" id="wordle-app-game">
        <div class="Board-module_boardContainer__TBHNL" style="overflow: unset;">`

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
                    </div>`
// apply
}
