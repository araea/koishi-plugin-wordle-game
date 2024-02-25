// noinspection CssUnresolvedCustomProperty

import {Context, h, Schema} from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import {} from 'koishi-plugin-monetary'
import {} from 'koishi-plugin-markdown-to-image-service'
import {load} from "cheerio";
import * as path from 'path';
import * as fs from 'fs';

export const inject = {
  required: ['monetary', 'database', 'puppeteer'],
  optional: ['markdownToImage'],
}
export const name = 'wordle-game'
export const usage = `## 🎣 使用

- 启动必要的服务。您需要启用 \`monetary\`，\`database\` 和 \`puppeteer\` 插件，以实现货币系统，数据存储和图片生成的功能。
- 建议自行添加指令别名，以方便您和您的用户使用。
- 享受猜单词游戏吧！😊

## 🎳 游戏指令

以下是该插件提供的指令列表:

### 游戏操作

- \`wordleGame.加入 [money:number]\` - 加入游戏，可选参数为投入的货币数额。
- \`wordleGame.退出\` - 退出游戏，只能在游戏未开始时使用。
- \`wordleGame.结束\` - 结束游戏，只能在游戏已开始时使用。

### 游戏模式

- \`wordleGame.开始 [guessWordLength:number]\`
  - 开始游戏引导，可选参数为猜单词的长度。

- \`wordleGame.开始.经典/汉兜\`
  - 开始经典猜单词|四字词语游戏，可投入货币，赢了有奖励。

- \`wordleGame.开始.CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle [guessWordLength:number]\`
  - 开始猜不同考试/类别的单词游戏，可选参数为猜单词的长度。
    - \`--hard\`
      - 困难模式，绿色线索必须保特固定，黄色线索必须重复使用。
    - \`--uhard\`
      - 超困难模式，在困难模式的基础上，黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。
    - \`--absurd\`
      - 荒谬/变态模式，AI将尽量避免给出答案，每次猜测时都会尽可能少地透露信息，甚至可能更换秘密词。
      - 在这种模式下，你将面对一个极具挑战性的对手。
      - [如何玩？](https://qntm.org/absurdle)
    - \`--challenge\`
      - 荒谬/变态挑战模式，要求你从一个给定的目标词出发，通过某种方式使其变成秘密词。
      - 仅建议高级玩家尝试。
      - [如何玩？](https://qntm.org/challenge)
    - \`--wordles <value:number>\`
      - 同时猜测多个单词|词语，默认范围为 1 ~ 4，可自定义。

> Tip：可以同时启用困难模式和变态模式，经典与汉兜模式同样适用。

### 游戏操作

- \`wordleGame.猜 [inputWord:text]\` - 猜单词|成语，参数为输入的词。
  - \`-r\`
    - 随机一个单词|成语。
- \`wordleGame.查询进度\` - 查询当前游戏进度。

### 数据查询

- \`wordleGame.查单词.ALL [targetWord:text]\` - 在 ALL 词库中查询单词信息（翻译）。
- \`wordleGame.查单词.WordWord [targetWord:text]\` - 在 [WordWord](https://wordword.org/) 中查询单词信息（英文定义）。
- \`wordleGame.查成语.百度汉语 [targetWord:text]\` - 在 [百度汉语](https://hanyu.baidu.com/) 中查询成语信息（内地）。
- \`wordleGame.查成语.汉典 [targetWord:text]\` - 在 [汉典](https://www.zdic.net/) 中查询成语信息（台湾词典）。
- \`wordleGame.拼音速查表\` - 查看拼音速查表。
- \`wordleGame.单词查找器\` - 使用 [WordFinder](https://wordword.org/) 查找匹配的单词。
- \`wordleGame.查询玩家记录 [targetUser:text]\` - 查询玩家记录，可选参数为目标玩家的 at 信息。
- \`wordleGame.排行榜 [number:number]\` - 查看排行榜，可选参数为排行榜的人数。
- \`wordleGame.排行榜.损益/总.胜场/总.输场/经典/CET4/CET6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle/汉兜.胜场/输场/最快用时 [number:number]\` -
  查看不同模式的玩家排行榜，可选参数为排行榜的人数。`

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
  shouldPromptForWordLengthOnNonClassicStart: boolean

  enableWordGuessTimeLimit: boolean
  wordGuessTimeLimitInSeconds: number

  imageType: "png" | "jpeg" | "webp"
  isTextToImageConversionEnabled: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isDarkThemeEnabled: Schema.boolean().default(false).description(`是否开启黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean().default(false).description(`是否开启高对比度（色盲）主题。`),
    // shouldAddBorderInHandleMode: Schema.boolean().default(true).description(`是否为块添加边框，仅在汉兜模式下生效。`),
  }).description('主题设置'),

  Schema.object({
    defaultMaxLeaderboardEntries: Schema.number().min(0).default(10).description(`显示排行榜时默认的最大人数。`),
    defaultWordLengthForGuessing: Schema.number().min(1).default(5).description(`非经典游戏模式下，默认的猜单词长度。`),
    maxInvestmentCurrency: Schema.number().min(0).default(50).description(`加入游戏时可投入的最大货币数额。`),
    defaultRewardMultiplier: Schema.number().min(0).default(2).description(`猜单词经典模式赢了之后奖励的货币倍率。`),
    maxSimultaneousGuesses: Schema.number().min(1).default(4).description(`最多同时猜测单词的数量。`),
    compositeImagePageWidth: Schema.number().min(1).default(800).description(`合成图片页面宽度。`),
    compositeImagePageHeight: Schema.number().min(1).default(100).description(`合成图片页面高度。`),
  }).description('游戏设置'),

  Schema.intersect([
    Schema.object({
      allowNonPlayersToGuess: Schema.boolean().default(true).description(`是否允许未加入游戏的玩家进行猜单词的操作，开启后可以无需加入直接开始。`),
      enableWordGuessMiddleware: Schema.boolean().default(true).description(`是否开启猜单词指令无前缀的中间件。`),
      shouldPromptWordLengthInput: Schema.boolean().default(true).description(`是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。`),
      shouldPromptForWordLengthOnNonClassicStart: Schema.boolean().default(false).description(`是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。`),
    }).description('游戏行为设置'),
    Schema.object({
      enableWordGuessTimeLimit: Schema.boolean().default(false).description(`是否开启猜单词游戏作答时间限制功能。`),
    }),
    Schema.union([
      Schema.object({
        enableWordGuessTimeLimit: Schema.const(true).required(),
        wordGuessTimeLimitInSeconds: Schema.number().min(0).default(120).description(` 猜单词游戏作答时间，单位是秒。`),
      }),
      Schema.object({}),
    ]),
    Schema.object({
      imageType: Schema.union(['png', 'jpeg', 'webp']).default('png').description(`发送的图片类型。`),
      isTextToImageConversionEnabled: Schema.boolean().default(false).description(`是否开启将文本转为图片的功能（可选），如需启用，需要启用 \`markdownToImage\` 服务。`),
    }),
  ])
]) as any;

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
  timestamp: number
  remainingWordsList: string[]
  isAbsurd: boolean
  isChallengeMode: boolean
  targetWord: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  pinyin: string
}

export interface ExtraGameRecord {
  id: number
  channelId: string
  gameMode: string
  wordGuessHtmlCache: string
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
  timestamp: number
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  remainingGuessesCount: number
  pinyin: string
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
}

interface WinLoseStats {
  win: number;
  lose: number;
}

const initialStats: PlayerStats = {
  经典: {win: 0, lose: 0},
  Lewdle: {win: 0, lose: 0},
  CET4: {win: 0, lose: 0},
  CET6: {win: 0, lose: 0},
  GMAT: {win: 0, lose: 0},
  GRE: {win: 0, lose: 0},
  IELTS: {win: 0, lose: 0},
  SAT: {win: 0, lose: 0},
  TOEFL: {win: 0, lose: 0},
  考研: {win: 0, lose: 0},
  专八: {win: 0, lose: 0},
  专四: {win: 0, lose: 0},
  ALL: {win: 0, lose: 0},
  汉兜: {win: 0, lose: 0},
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
};

interface LetterState {
  letter: string;
  state: 'correct' | 'present' | 'absent' | 'undefined';
}

interface WordEntry {
  word: string;
  translation: string;
}

// bl*
const badWordsList: string[] = ["BONER", "FELCH", "PUSSY", "TAINT", "SEMEN", "DILDO", "FARTS", "CHODE", "MINGE", "GONAD", "TWATS", "SPUNK", "QUEEF", "GAPED", "PRICK", "BUSSY", "SHART", "BALLS", "VULVA", "PORNO", "COOCH", "PONUT", "LOADS", "DADDY", "FROTS", "SKEET", "MILFS", "BOOTY", "QUIMS", "DICKS", "CUSSY", "BOOBS", "BONCH", "TWINK", "GROOL", "HORNY", "YIFFY", "THICC", "BULGE", "TITTY", "WANKS", "FUCKS", "HUSSY", "COCKS", "FANNY", "SHAFT", "TWERK", "PUBES", "GONZO", "HANDY", "NARDS", "RIMJOB", "ERECT", "SPANK", "SQUIRT", "CUNTS", "PRECUM", "SCREW", "EDGING", "GOATSE", "BOINK", "PUNANI", "ASSES", "PECKER", "HINEY", "WANKER", "GUMMY", "CUMRAG", "PEGGED", "LEWDS", "MOPED", "TEABAG", "SCROTE", "BEAVER", "NOOKIE", "CRABS", "FUCKED", "BUTTS", "GOOCH", "TAGNUT", "TRUMP", "COUGAR", "SHTUP", "TOOBIN", "KANCHO", "KINKY", "WILLY", "SYBIAN", "GLUCK", "BONED", "GOBBLE", "TRIBS", "BROJOB", "DOGGY", "DOCKS", "CHUBBY", "TOSSER", "SHAGS", "FISTED", "STIFFY", "NASTY", "CLIMAX", "JOBBY", "BONERS", "RAWDOG", "PLUMS", "RANDY", "CLUNGE", "FEMDOM", "ZADDY", "SMEGMA", "THROB", "MERKIN", "CLITS", "MOMMY", "TITJOB", "MOIST", "GAGGED", "GUSHER", "FLAPS", "TODGER", "YONIC", "FRICK", "PROBE", "GIRTH", "PERVY", "AROUSE", "AHEGAO", "FLEDGE", "HENTAI", "GROWER", "SIMBA", "MENAGE", "LENGTH", "DOMME", "DIDDLE", "SHOWER", "BOYTOY", "SMANG", "GILFS", "NYASH", "LIGMA", "FACIAL", "OPPAI", "ASSJOB", "LUBED", "PAYPIG", "SPAFF", "PENGUS", "RIMBOW", "CUMPT", "FROMBE", "MILKER", "HIMBO", "FAPPY", "CUCKED", "HOOHA", "REAMED", "TOEJOB", "BEMHO", "BOOFED", "SEXILE", "GOOSE", "BANGED", "NORKS", "CHONES", "GLANS", "GLORP", "EPEEN", "JELQS", "CRANK", "ASSMAN", "SPURT", "BLOWIE", "ECCHI", "DICKED", "COOZE", "BEWBS", "BONKED", "BUGGER", "CUMWAD", "HANDY", "PORNO", "DILDO", "FELCH", "WANKS", "LOADS", "BOOBS", "QUIMS", "TITTY", "MILFS", "TWATS", "SCREW", "BUSSY", "DADDY", "BULGE", "BONER", "COOCH", "CUNTS", "FANNY", "TAINT", "SPUNK", "GONAD", "CUMRAG", "RIMJOB", "SHAFT", "SEMEN", "SCROTE", "TWERK", "HINEY", "SKEET", "CUSSY", "FROTS", "BONCH", "BOOTY", "BUTTS", "TAGNUT", "GAPED", "TOOBIN", "SYBIAN", "DICKS", "KINKY", "NARDS", "BONED", "DOGGY", "PUSSY", "WANKER", "PEGGED", "DOCKS", "KANCHO", "PONUT", "CHODE", "FUCKED", "THICC", "CRABS", "JOBBY", "TEABAG", "STIFFY", "EDGING", "COUGAR", "BALLS", "RAWDOG", "SMEGMA", "SQUIRT", "NASTY", "HUSSY", "FEMDOM", "PECKER", "TENTED", "SPLOSH", "BLUMPY", "CUMET", "SUCKLE", "SEXTS", "SUGMA", "SCROG", "BRAIN", "HOOKUP", "HICKEY", "AHOLE", "ANALLY", "COOMER", "ENEMA", "BARSE", "BOOBA", "CLUSSY", "HUMMER", "BEZOS", "CANING", "CHOKER", "BENWA", "CUMJAR", "DUMPER", "FIGGED", "GOONER", "INCEST", "SNUSNU", "SOUND", "ASSHAT", "BUNDA", "BREED", "CAGING", "MOIST", "FACIAL", "MOPED", "SHTUP", "GUMMY", "GOOCH", "LEWDS", "COCKS", "ASSES", "ZADDY", "MINGE", "LENGTH", "BOYTOY", "SEXILE", "PRECUM", "SHART", "PENGUS", "GOBBLE", "LUBED", "SMANG", "GUSHER", "CUMPT", "GONZO", "MERKIN", "JELQS", "TRIBS", "PERVY", "PROBE", "PUBES", "NORKS", "BUGGER", "SIMBA", "CUMWAD", "PRICK", "FISTED", "YONIC", "AROUSE", "BOOBS", "GAGGED", "YIFFY", "CLIMAX", "CRANK", "SPANK", "MILKER", "RANDY", "SHAGS", "GOOSE", "TOSSER", "SCREW", "LOADS", "CHONES", "RIMBOW", "BULGE", "BEWBS", "TITTY", "CLUNGE", "OPPAI", "HANDY", "EPEEN", "MILFS", "GILFS", "PAYPIG", "PUNANI", "SPAFF", "TWERK", "FAPPY", "CUNTS", "GAPED", "BLOWIE", "BOOTY", "CUMRAG", "TOOBIN", "DICKED", "FROMBE", "COOZE", "NARDS", "BONERS", "FUCKS", "TAGNUT", "PLUMS", "GONAD", "AHEGAO", "SYBIAN", "FUCKED", "GOATSE", "TWINK", "HOOHA", "CLITS", "COUGAR", "ERECT", "BONED", "SEMEN", "TWATS", "TITJOB", "CRABS", "THROB", "MOMMY", "VULVA", "DILDO", "PORNO", "KINKY", "SMEGMA", "NASTY", "TOEJOB", "LIGMA", "SPURT", "BEMHO", "TODGER", "FEMDOM", "EDGING", "NOOKIE", "KANCHO", "FLAPS", "TRUMP", "GROOL", "JOBBY", "BUSSY", "HICKEY", "BEZOS", "PUSSY", "BUTTS", "SCROG", "FELCH", "DUMPER", "REAMED", "HIMBO", "FIGGED", "ASSJOB", "CHUBBY", "BROJOB", "SPLOSH", "NYASH", "SHOWER", "FRICK", "TAINT", "BOOFED", "CHODE", "SEXTS", "BLUMPY", "FROTS", "SQUIRT", "LEWDS", "WANKS", "COOMER", "BREED", "CHOKER", "WANKER", "GLANS", "HUSSY", "BOINK", "BALLS", "HORNY", "QUIMS", "COOCH", "WILLY", "SPUNK", "BARSE", "BONKED", "DADDY", "MOPED", "FLEDGE", "PROBE", "SHAFT", "SCROTE", "PUBES", "HINEY", "CUMET", "BONCH", "BENWA", "SUCKLE", "ECCHI", "TENTED", "GUSHER", "FISTED", "BUNDA", "CUCKED", "MILKER", "SOUND", "SIMBA", "DIDDLE", "CAGING", "PRECUM", "YONIC", "CUSSY", "TEABAG", "BEWBS", "SPANK", "PEGGED", "FANNY", "RIMBOW", "GIRTH", "RAWDOG", "TRIBS", "INCEST", "HUMMER", "TWERK", "DOCKS", "YIFFY", "MERKIN", "CUMJAR", "ANALLY", "AHOLE", "SHTUP", "TOSSER", "FROMBE", "LOADS", "ASSES", "BEAVER", "DOMME", "BOOBA", "DICKED", "CUMPT", "CUMWAD", "ZADDY", "LUBED", "GONZO", "GAPED", "CUNTS", "RIMJOB", "PECKER", "GOOCH", "FARTS", "COUGAR", "DOGGY", "PLUMS", "PENGUS", "ENEMA", "BLOWIE", "FUCKED", "CLUNGE", "TOOBIN", "CUMRAG", "SHAGS", "OPPAI", "GLORP", "GOBBLE", "MINGE", "TAGNUT", "MOIST", "CLUSSY", "COOZE", "EPEEN", "STIFFY", "PUNANI", "TITJOB", "GUMMY", "HOOHA", "TODGER", "RANDY", "VULVA", "PORNO", "CLITS", "SMANG", "GILFS", "THROB", "FACIAL", "FAPPY", "BUGGER", "GROWER", "NOOKIE", "DILDO", "BOOTY", "FUCKS", "NORKS", "SEMEN", "CLIMAX", "FIGGED", "JELQS", "PRICK", "SUGMA", "ASSHAT", "FLAPS", "SQUIRT", "BRAIN", "EDGING", "GAGGED", "BULGE", "DICKS", "GOONER", "BANGED", "BOINK", "GOOSE", "BUTTS", "COOMER", "CANING", "SMEGMA", "GROOL", "KANCHO", "SEXILE", "NYASH", "TRUMP", "TWINK", "WILLY", "BLUMPY", "BOOBS", "FRICK", "HICKEY", "PUSSY", "SHART", "GOATSE", "HIMBO", "BONER", "LEWDS", "GLANS", "TOEJOB", "BEMHO", "HORNY", "ECCHI", "WANKER", "BARSE", "GUSHER", "FROTS", "CHOKER", "SOUND", "BREED", "QUIMS", "FEMDOM", "BENWA", "PUBES", "CAGING", "SUCKLE", "HINEY", "BONKED", "ERECT", "BONERS", "SHAFT", "SEXTS", "HENTAI", "PEGGED", "CRABS", "ASSJOB", "GIRTH", "TENTED", "BUSSY", "LIGMA", "ASSMAN", "MERKIN", "BROJOB", "NARDS", "PAYPIG", "SCROTE", "INCEST", "COCKS", "SPURT", "FELCH", "TRIBS", "TITTY", "CUMWAD", "PONUT", "MILKER", "BOOFED", "REAMED", "HUMMER", "MOPED", "MENAGE", "BEZOS", "DOGGY", "SPLOSH", "RIMJOB", "TWERK", "TAINT", "CLUNGE", "AHOLE", "DIDDLE", "ENEMA", "QUEEF", "WANKS", "HANDY", "SHAGS", "SNUSNU", "KINKY", "AHEGAO", "ASSES", "CUMJAR", "YIFFY", "GOOCH", "FLEDGE", "HOOKUP", "GOBBLE", "GUMMY", "OPPAI", "BEAVER", "CUMRAG", "GLUCK", "SIMBA", "FANNY", "PENGUS", "EPEEN", "BUGGER", "COUGAR", "CUMPT", "SKEET", "DOCKS", "MILFS", "FARTS", "BONCH", "THROB", "BLOWIE", "PERVY", "HUSSY", "HOOHA", "SEMEN", "MOMMY", "CLUSSY", "SCREW", "AROUSE", "CHONES", "FISTED", "THICC", "SYBIAN", "VULVA", "PECKER", "DADDY", "BOYTOY", "JOBBY", "SQUIRT", "ANALLY", "ZADDY", "BOOTY", "SHTUP", "DOMME", "TOOBIN", "CUNTS", "BOOBA", "SEXILE", "BOOBS", "TWATS", "CUSSY", "CANING", "STIFFY", "SHOWER", "NYASH", "NORKS", "RIMBOW", "COOCH", "TOSSER", "FLAPS", "SCROG", "BRAIN", "GILFS", "FRICK", "TODGER", "GONZO", "FUCKS", "CLIMAX", "LOADS", "BEMHO", "PUSSY", "PRECUM", "CHODE", "COOMER", "BUNDA", "HIMBO", "GOONER", "SPUNK", "KANCHO", "FROTS", "HINEY", "BARSE", "BONERS", "LENGTH", "BOINK", "PROBE", "SHAFT", "SUCKLE", "SUGMA", "WILLY", "BULGE", "ASSHAT", "GAGGED", "JELQS", "SMEGMA", "TRUMP", "SOUND", "BONKED", "SPURT", "TITJOB", "CAGING", "RANDY", "PUBES", "COOZE", "NOOKIE", "HORNY", "ERECT", "CRABS", "LUBED", "SMANG", "ASSJOB", "BLUMPY", "DICKS", "SPAFF", "BUTTS", "MENAGE", "GAPED", "PLUMS", "LIGMA", "PEGGED", "HENTAI", "TWINK", "BROJOB", "WANKS", "PUNANI", "GOOSE", "DUMPER", "FEMDOM", "NARDS", "FIGGED", "CUMET", "DILDO", "TEABAG", "EDGING", "AHOLE", "RAWDOG", "INCEST", "PORNO", "ASSES", "GROOL", "CUMWAD", "DICKED", "HOOKUP", "GOOCH", "TAGNUT", "LEWDS", "GUSHER", "GLANS", "BUGGER", "PAYPIG", "FUCKED", "CHOKER", "OPPAI", "SCROTE", "CUCKED", "TRIBS", "TENTED", "SPANK", "EPEEN", "AROUSE", "BONER", "QUEEF", "NASTY", "TITTY", "YIFFY", "GOATSE", "AHEGAO", "TWERK", "GUMMY", "DOGGY", "MILFS", "FISTED", "CLITS", "FAPPY", "KINKY", "JOBBY", "VULVA", "THICC", "MERKIN", "BUSSY", "DIDDLE", "MILKER", "GLORP", "FACIAL", "FROMBE", "SHAGS", "BONCH", "SPLOSH", "COCKS", "DOCKS", "GONAD", "GROWER", "COOCH", "SHOWER", "SIMBA", "PENGUS", "QUIMS", "RIMJOB", "TOOBIN", "BOOBA", "FARTS", "BONED", "CHUBBY", "SQUIRT", "SKEET", "GONZO", "SHART", "HUSSY", "THROB", "TAINT", "MOPED", "LOADS", "CRANK", "BEZOS", "DADDY", "CUMJAR", "SYBIAN", "NYASH", "SCREW", "BENWA", "CLIMAX", "HIMBO", "BONERS", "FLEDGE", "FUCKS", "BULGE", "SPUNK", "PECKER", "ASSHAT", "BOYTOY", "TITJOB", "WANKER", "JELQS", "SPURT", "BOINK", "SOUND", "FANNY", "LENGTH", "STIFFY", "MINGE", "FRICK", "BEAVER", "SMEGMA", "YONIC", "CHONES", "CUMRAG", "CLUSSY", "NORKS", "LUBED", "CUSSY", "ZADDY", "PUSSY", "TWATS", "PLUMS", "DICKS", "SEXILE", "CRABS", "COUGAR", "BREED", "HORNY", "GOBBLE", "HUMMER", "ERECT", "CHODE", "HINEY", "BARSE", "DILDO", "GOOSE", "WANKS", "COOMER", "BRAIN", "HICKEY", "SMANG", "CAGING", "AHOLE", "BALLS", "BUTTS", "ASSES", "NARDS", "SEMEN", "FIGGED", "TWINK", "SEXTS", "FELCH", "PORNO", "RIMBOW", "PROBE", "LIGMA", "PUNANI", "ASSJOB", "GOOCH", "REAMED", "PRICK", "PRECUM", "DUMPER", "TOSSER", "HOOHA", "QUEEF", "GROOL", "RANDY", "GIRTH", "SCROG", "GUSHER", "BONKED", "LEWDS", "PUBES", "TAGNUT", "FAPPY", "TRUMP", "SHTUP", "KINKY", "CLUNGE", "DIDDLE", "CLITS", "MILFS", "OPPAI", "SHAGS", "SPAFF", "BLUMPY", "BEMHO", "AROUSE", "ANALLY", "GROWER", "DICKED", "GLORP", "DOMME", "TWERK", "FLAPS", "BROJOB", "CUCKED", "BUNDA", "CUMET", "EDGING", "DOGGY", "SQUIRT", "RIMJOB", "HENTAI", "INCEST", "SUCKLE", "YIFFY", "BOOFED"];
const lowerCaseWordArray: string[] = ["aback", "abase", "abate", "abbey", "abbot", "abhor", "abide", "abled", "abode", "abort", "about", "above", "abuse", "abyss", "acorn", "acrid", "actor", "acute", "adage", "adapt", "adept", "admin", "admit", "adobe", "adopt", "adore", "adorn", "adult", "affix", "afire", "afoot", "afoul", "after", "again", "agape", "agate", "agent", "agile", "aging", "aglow", "agony", "agora", "agree", "ahead", "aider", "aisle", "alarm", "album", "alert", "algae", "alibi", "alien", "align", "alike", "alive", "allay", "alley", "allot", "allow", "alloy", "aloft", "alone", "along", "aloof", "aloud", "alpha", "altar", "alter", "amass", "amaze", "amber", "amble", "amend", "amiss", "amity", "among", "ample", "amply", "amuse", "angel", "anger", "angle", "angry", "angst", "anime", "ankle", "annex", "annoy", "annul", "anode", "antic", "anvil", "aorta", "apart", "aphid", "aping", "apnea", "apple", "apply", "apron", "aptly", "arbor", "ardor", "arena", "argue", "arise", "armor", "aroma", "arose", "array", "arrow", "arson", "artsy", "ascot", "ashen", "aside", "askew", "assay", "asset", "atoll", "atone", "attic", "audio", "audit", "augur", "aunty", "avail", "avert", "avian", "avoid", "await", "awake", "award", "aware", "awash", "awful", "awoke", "axial", "axiom", "axion", "azure", "bacon", "badge", "badly", "bagel", "baggy", "baker", "baler", "balmy", "banal", "banjo", "barge", "baron", "basal", "basic", "basil", "basin", "basis", "baste", "batch", "bathe", "baton", "batty", "bawdy", "bayou", "beach", "beady", "beard", "beast", "beech", "beefy", "befit", "began", "begat", "beget", "begin", "begun", "being", "belch", "belie", "belle", "belly", "below", "bench", "beret", "berry", "berth", "beset", "betel", "bevel", "bezel", "bible", "bicep", "biddy", "bigot", "bilge", "billy", "binge", "bingo", "biome", "birch", "birth", "bison", "bitty", "black", "blade", "blame", "bland", "blank", "blare", "blast", "blaze", "bleak", "bleat", "bleed", "bleep", "blend", "bless", "blimp", "blind", "blink", "bliss", "blitz", "bloat", "block", "bloke", "blond", "blood", "bloom", "blown", "bluer", "bluff", "blunt", "blurb", "blurt", "blush", "board", "boast", "bobby", "boney", "bongo", "bonus", "booby", "boost", "booth", "booty", "booze", "boozy", "borax", "borne", "bosom", "bossy", "botch", "bough", "boule", "bound", "bowel", "boxer", "brace", "braid", "brain", "brake", "brand", "brash", "brass", "brave", "bravo", "brawl", "brawn", "bread", "break", "breed", "briar", "bribe", "brick", "bride", "brief", "brine", "bring", "brink", "briny", "brisk", "broad", "broil", "broke", "brood", "brook", "broom", "broth", "brown", "brunt", "brush", "brute", "buddy", "budge", "buggy", "bugle", "build", "built", "bulge", "bulky", "bully", "bunch", "bunny", "burly", "burnt", "burst", "bused", "bushy", "butch", "butte", "buxom", "buyer", "bylaw", "cabal", "cabby", "cabin", "cable", "cacao", "cache", "cacti", "caddy", "cadet", "cagey", "cairn", "camel", "cameo", "canal", "candy", "canny", "canoe", "canon", "caper", "caput", "carat", "cargo", "carol", "carry", "carve", "caste", "catch", "cater", "catty", "caulk", "cause", "cavil", "cease", "cedar", "cello", "chafe", "chaff", "chain", "chair", "chalk", "champ", "chant", "chaos", "chard", "charm", "chart", "chase", "chasm", "cheap", "cheat", "check", "cheek", "cheer", "chess", "chest", "chick", "chide", "chief", "child", "chili", "chill", "chime", "china", "chirp", "chock", "choir", "choke", "chord", "chore", "chose", "chuck", "chump", "chunk", "churn", "chute", "cider", "cigar", "cinch", "circa", "civic", "civil", "clack", "claim", "clamp", "clang", "clank", "clash", "clasp", "class", "clean", "clear", "cleat", "cleft", "clerk", "click", "cliff", "climb", "cling", "clink", "cloak", "clock", "clone", "close", "cloth", "cloud", "clout", "clove", "clown", "cluck", "clued", "clump", "clung", "coach", "coast", "cobra", "cocoa", "colon", "color", "comet", "comfy", "comic", "comma", "conch", "condo", "conic", "copse", "coral", "corer", "corny", "couch", "cough", "could", "count", "coupe", "court", "coven", "cover", "covet", "covey", "cower", "coyly", "crack", "craft", "cramp", "crane", "crank", "crash", "crass", "crate", "crave", "crawl", "craze", "crazy", "creak", "cream", "credo", "creed", "creek", "creep", "creme", "crepe", "crept", "cress", "crest", "crick", "cried", "crier", "crime", "crimp", "crisp", "croak", "crock", "crone", "crony", "crook", "cross", "croup", "crowd", "crown", "crude", "cruel", "crumb", "crump", "crush", "crust", "crypt", "cubic", "cumin", "curio", "curly", "curry", "curse", "curve", "curvy", "cutie", "cyber", "cycle", "cynic", "daddy", "daily", "dairy", "daisy", "dally", "dance", "dandy", "datum", "daunt", "dealt", "death", "debar", "debit", "debug", "debut", "decal", "decay", "decor", "decoy", "decry", "defer", "deign", "deity", "delay", "delta", "delve", "demon", "demur", "denim", "dense", "depot", "depth", "derby", "deter", "detox", "deuce", "devil", "diary", "dicey", "digit", "dilly", "dimly", "diner", "dingo", "dingy", "diode", "dirge", "dirty", "disco", "ditch", "ditto", "ditty", "diver", "dizzy", "dodge", "dodgy", "dogma", "doing", "dolly", "donor", "donut", "dopey", "doubt", "dough", "dowdy", "dowel", "downy", "dowry", "dozen", "draft", "drain", "drake", "drama", "drank", "drape", "drawl", "drawn", "dread", "dream", "dress", "dried", "drier", "drift", "drill", "drink", "drive", "droit", "droll", "drone", "drool", "droop", "dross", "drove", "drown", "druid", "drunk", "dryer", "dryly", "duchy", "dully", "dummy", "dumpy", "dunce", "dusky", "dusty", "dutch", "duvet", "dwarf", "dwell", "dwelt", "dying", "eager", "eagle", "early", "earth", "easel", "eaten", "eater", "ebony", "eclat", "edict", "edify", "eerie", "egret", "eight", "eject", "eking", "elate", "elbow", "elder", "elect", "elegy", "elfin", "elide", "elite", "elope", "elude", "email", "embed", "ember", "emcee", "empty", "enact", "endow", "enema", "enemy", "enjoy", "ennui", "ensue", "enter", "entry", "envoy", "epoch", "epoxy", "equal", "equip", "erase", "erect", "erode", "error", "erupt", "essay", "ester", "ether", "ethic", "ethos", "etude", "evade", "event", "every", "evict", "evoke", "exact", "exalt", "excel", "exert", "exile", "exist", "expel", "extol", "extra", "exult", "eying", "fable", "facet", "faint", "fairy", "faith", "false", "fancy", "fanny", "farce", "fatal", "fatty", "fault", "fauna", "favor", "feast", "fecal", "feign", "fella", "felon", "femme", "femur", "fence", "feral", "ferry", "fetal", "fetch", "fetid", "fetus", "fever", "fewer", "fiber", "fibre", "ficus", "field", "fiend", "fiery", "fifth", "fifty", "fight", "filer", "filet", "filly", "filmy", "filth", "final", "finch", "finer", "first", "fishy", "fixer", "fizzy", "fjord", "flack", "flail", "flair", "flake", "flaky", "flame", "flank", "flare", "flash", "flask", "fleck", "fleet", "flesh", "flick", "flier", "fling", "flint", "flirt", "float", "flock", "flood", "floor", "flora", "floss", "flour", "flout", "flown", "fluff", "fluid", "fluke", "flume", "flung", "flunk", "flush", "flute", "flyer", "foamy", "focal", "focus", "foggy", "foist", "folio", "folly", "foray", "force", "forge", "forgo", "forte", "forth", "forty", "forum", "found", "foyer", "frail", "frame", "frank", "fraud", "freak", "freed", "freer", "fresh", "friar", "fried", "frill", "frisk", "fritz", "frock", "frond", "front", "frost", "froth", "frown", "froze", "fruit", "fudge", "fugue", "fully", "fungi", "funky", "funny", "furor", "furry", "fussy", "fuzzy", "gaffe", "gaily", "gamer", "gamma", "gamut", "gassy", "gaudy", "gauge", "gaunt", "gauze", "gavel", "gawky", "gayer", "gayly", "gazer", "gecko", "geeky", "geese", "genie", "genre", "ghost", "ghoul", "giant", "giddy", "gipsy", "girly", "girth", "given", "giver", "glade", "gland", "glare", "glass", "glaze", "gleam", "glean", "glide", "glint", "gloat", "globe", "gloom", "glory", "gloss", "glove", "glyph", "gnash", "gnome", "godly", "going", "golem", "golly", "gonad", "goner", "goody", "gooey", "goofy", "goose", "gorge", "gouge", "gourd", "grace", "grade", "graft", "grail", "grain", "grand", "grant", "grape", "graph", "grasp", "grass", "grate", "grave", "gravy", "graze", "great", "greed", "green", "greet", "grief", "grill", "grime", "grimy", "grind", "gripe", "groan", "groin", "groom", "grope", "gross", "group", "grout", "grove", "growl", "grown", "gruel", "gruff", "grunt", "guard", "guava", "guess", "guest", "guide", "guild", "guile", "guilt", "guise", "gulch", "gully", "gumbo", "gummy", "guppy", "gusto", "gusty", "gypsy", "habit", "hairy", "halve", "handy", "happy", "hardy", "harem", "harpy", "harry", "harsh", "haste", "hasty", "hatch", "hater", "haunt", "haute", "haven", "havoc", "hazel", "heady", "heard", "heart", "heath", "heave", "heavy", "hedge", "hefty", "heist", "helix", "hello", "hence", "heron", "hilly", "hinge", "hippo", "hippy", "hitch", "hoard", "hobby", "hoist", "holly", "homer", "honey", "honor", "horde", "horny", "horse", "hotel", "hotly", "hound", "house", "hovel", "hover", "howdy", "human", "humid", "humor", "humph", "humus", "hunch", "hunky", "hurry", "husky", "hussy", "hutch", "hydro", "hyena", "hymen", "hyper", "icily", "icing", "ideal", "idiom", "idiot", "idler", "idyll", "igloo", "iliac", "image", "imbue", "impel", "imply", "inane", "inbox", "incur", "index", "inept", "inert", "infer", "ingot", "inlay", "inlet", "inner", "input", "inter", "intro", "ionic", "irate", "irony", "islet", "issue", "itchy", "ivory", "jaunt", "jazzy", "jelly", "jerky", "jetty", "jewel", "jiffy", "joint", "joist", "joker", "jolly", "joust", "judge", "juice", "juicy", "jumbo", "jumpy", "junta", "junto", "juror", "kappa", "karma", "kayak", "kebab", "khaki", "kinky", "kiosk", "kitty", "knack", "knave", "knead", "kneed", "kneel", "knelt", "knife", "knock", "knoll", "known", "koala", "krill", "label", "labor", "laden", "ladle", "lager", "lance", "lanky", "lapel", "lapse", "large", "larva", "lasso", "latch", "later", "lathe", "latte", "laugh", "layer", "leach", "leafy", "leaky", "leant", "leapt", "learn", "lease", "leash", "least", "leave", "ledge", "leech", "leery", "lefty", "legal", "leggy", "lemon", "lemur", "leper", "level", "lever", "libel", "liege", "light", "liken", "lilac", "limbo", "limit", "linen", "liner", "lingo", "lipid", "lithe", "liver", "livid", "llama", "loamy", "loath", "lobby", "local", "locus", "lodge", "lofty", "logic", "login", "loopy", "loose", "lorry", "loser", "louse", "lousy", "lover", "lower", "lowly", "loyal", "lucid", "lucky", "lumen", "lumpy", "lunar", "lunch", "lunge", "lupus", "lurch", "lurid", "lusty", "lying", "lymph", "lynch", "lyric", "macaw", "macho", "macro", "madam", "madly", "mafia", "magic", "magma", "maize", "major", "maker", "mambo", "mamma", "mammy", "manga", "mange", "mango", "mangy", "mania", "manic", "manly", "manor", "maple", "march", "marry", "marsh", "mason", "masse", "match", "matey", "mauve", "maxim", "maybe", "mayor", "mealy", "meant", "meaty", "mecca", "medal", "media", "medic", "melee", "melon", "mercy", "merge", "merit", "merry", "metal", "meter", "metro", "micro", "midge", "midst", "might", "milky", "mimic", "mince", "miner", "minim", "minor", "minty", "minus", "mirth", "miser", "missy", "mocha", "modal", "model", "modem", "mogul", "moist", "molar", "moldy", "money", "month", "moody", "moose", "moral", "moron", "morph", "mossy", "motel", "motif", "motor", "motto", "moult", "mound", "mount", "mourn", "mouse", "mouth", "mover", "movie", "mower", "mucky", "mucus", "muddy", "mulch", "mummy", "munch", "mural", "murky", "mushy", "music", "musky", "musty", "myrrh", "nadir", "naive", "nanny", "nasal", "nasty", "natal", "naval", "navel", "needy", "neigh", "nerdy", "nerve", "never", "newer", "newly", "nicer", "niche", "niece", "night", "ninja", "ninny", "ninth", "noble", "nobly", "noise", "noisy", "nomad", "noose", "north", "nosey", "notch", "novel", "nudge", "nurse", "nutty", "nylon", "nymph", "oaken", "obese", "occur", "ocean", "octal", "octet", "odder", "oddly", "offal", "offer", "often", "olden", "older", "olive", "ombre", "omega", "onion", "onset", "opera", "opine", "opium", "optic", "orbit", "order", "organ", "other", "otter", "ought", "ounce", "outdo", "outer", "outgo", "ovary", "ovate", "overt", "ovine", "ovoid", "owing", "owner", "oxide", "ozone", "paddy", "pagan", "paint", "paler", "palsy", "panel", "panic", "pansy", "papal", "paper", "parer", "parka", "parry", "parse", "party", "pasta", "paste", "pasty", "patch", "patio", "patsy", "patty", "pause", "payee", "payer", "peace", "peach", "pearl", "pecan", "pedal", "penal", "pence", "penne", "penny", "perch", "peril", "perky", "pesky", "pesto", "petal", "petty", "phase", "phone", "phony", "photo", "piano", "picky", "piece", "piety", "piggy", "pilot", "pinch", "piney", "pinky", "pinto", "piper", "pique", "pitch", "pithy", "pivot", "pixel", "pixie", "pizza", "place", "plaid", "plain", "plait", "plane", "plank", "plant", "plate", "plaza", "plead", "pleat", "plied", "plier", "pluck", "plumb", "plume", "plump", "plunk", "plush", "poesy", "point", "poise", "poker", "polar", "polka", "polyp", "pooch", "poppy", "porch", "poser", "posit", "posse", "pouch", "pound", "pouty", "power", "prank", "prawn", "preen", "press", "price", "prick", "pride", "pried", "prime", "primo", "print", "prior", "prism", "privy", "prize", "probe", "prone", "prong", "proof", "prose", "proud", "prove", "prowl", "proxy", "prude", "prune", "psalm", "pubic", "pudgy", "puffy", "pulpy", "pulse", "punch", "pupal", "pupil", "puppy", "puree", "purer", "purge", "purse", "pushy", "putty", "pygmy", "quack", "quail", "quake", "qualm", "quark", "quart", "quash", "quasi", "queen", "queer", "quell", "query", "quest", "queue", "quick", "quiet", "quill", "quilt", "quirk", "quite", "quota", "quote", "quoth", "rabbi", "rabid", "racer", "radar", "radii", "radio", "rainy", "raise", "rajah", "rally", "ralph", "ramen", "ranch", "randy", "range", "rapid", "rarer", "raspy", "ratio", "ratty", "raven", "rayon", "razor", "reach", "react", "ready", "realm", "rearm", "rebar", "rebel", "rebus", "rebut", "recap", "recur", "recut", "reedy", "refer", "refit", "regal", "rehab", "reign", "relax", "relay", "relic", "remit", "renal", "renew", "repay", "repel", "reply", "rerun", "reset", "resin", "retch", "retro", "retry", "reuse", "revel", "revue", "rhino", "rhyme", "rider", "ridge", "rifle", "right", "rigid", "rigor", "rinse", "ripen", "riper", "risen", "riser", "risky", "rival", "river", "rivet", "roach", "roast", "robin", "robot", "rocky", "rodeo", "roger", "rogue", "roomy", "roost", "rotor", "rouge", "rough", "round", "rouse", "route", "rover", "rowdy", "rower", "royal", "ruddy", "ruder", "rugby", "ruler", "rumba", "rumor", "rupee", "rural", "rusty", "sadly", "safer", "saint", "salad", "sally", "salon", "salsa", "salty", "salve", "salvo", "sandy", "saner", "sappy", "sassy", "satin", "satyr", "sauce", "saucy", "sauna", "saute", "savor", "savoy", "savvy", "scald", "scale", "scalp", "scaly", "scamp", "scant", "scare", "scarf", "scary", "scene", "scent", "scion", "scoff", "scold", "scone", "scoop", "scope", "score", "scorn", "scour", "scout", "scowl", "scram", "scrap", "scree", "screw", "scrub", "scrum", "scuba", "sedan", "seedy", "segue", "seize", "semen", "sense", "sepia", "serif", "serum", "serve", "setup", "seven", "sever", "sewer", "shack", "shade", "shady", "shaft", "shake", "shaky", "shale", "shall", "shalt", "shame", "shank", "shape", "shard", "share", "shark", "sharp", "shave", "shawl", "shear", "sheen", "sheep", "sheer", "sheet", "sheik", "shelf", "shell", "shied", "shift", "shine", "shiny", "shire", "shirk", "shirt", "shoal", "shock", "shone", "shook", "shoot", "shore", "shorn", "short", "shout", "shove", "shown", "showy", "shrew", "shrub", "shrug", "shuck", "shunt", "shush", "shyly", "siege", "sieve", "sight", "sigma", "silky", "silly", "since", "sinew", "singe", "siren", "sissy", "sixth", "sixty", "skate", "skier", "skiff", "skill", "skimp", "skirt", "skulk", "skull", "skunk", "slack", "slain", "slang", "slant", "slash", "slate", "slave", "sleek", "sleep", "sleet", "slept", "slice", "slick", "slide", "slime", "slimy", "sling", "slink", "sloop", "slope", "slosh", "sloth", "slump", "slung", "slunk", "slurp", "slush", "slyly", "smack", "small", "smart", "smash", "smear", "smell", "smelt", "smile", "smirk", "smite", "smith", "smock", "smoke", "smoky", "smote", "snack", "snail", "snake", "snaky", "snare", "snarl", "sneak", "sneer", "snide", "sniff", "snipe", "snoop", "snore", "snort", "snout", "snowy", "snuck", "snuff", "soapy", "sober", "soggy", "solar", "solid", "solve", "sonar", "sonic", "sooth", "sooty", "sorry", "sound", "south", "sower", "space", "spade", "spank", "spare", "spark", "spasm", "spawn", "speak", "spear", "speck", "speed", "spell", "spelt", "spend", "spent", "sperm", "spice", "spicy", "spied", "spiel", "spike", "spiky", "spill", "spilt", "spine", "spiny", "spire", "spite", "splat", "split", "spoil", "spoke", "spoof", "spook", "spool", "spoon", "spore", "sport", "spout", "spray", "spree", "sprig", "spunk", "spurn", "spurt", "squad", "squat", "squib", "stack", "staff", "stage", "staid", "stain", "stair", "stake", "stale", "stalk", "stall", "stamp", "stand", "stank", "stare", "stark", "start", "stash", "state", "stave", "stead", "steak", "steal", "steam", "steed", "steel", "steep", "steer", "stein", "stern", "stick", "stiff", "still", "stilt", "sting", "stink", "stint", "stock", "stoic", "stoke", "stole", "stomp", "stone", "stony", "stood", "stool", "stoop", "store", "stork", "storm", "story", "stout", "stove", "strap", "straw", "stray", "strip", "strut", "stuck", "study", "stuff", "stump", "stung", "stunk", "stunt", "style", "suave", "sugar", "suing", "suite", "sulky", "sully", "sumac", "sunny", "super", "surer", "surge", "surly", "sushi", "swami", "swamp", "swarm", "swash", "swath", "swear", "sweat", "sweep", "sweet", "swell", "swept", "swift", "swill", "swine", "swing", "swirl", "swish", "swoon", "swoop", "sword", "swore", "sworn", "swung", "synod", "syrup", "tabby", "table", "taboo", "tacit", "tacky", "taffy", "taint", "taken", "taker", "tally", "talon", "tamer", "tango", "tangy", "taper", "tapir", "tardy", "tarot", "taste", "tasty", "tatty", "taunt", "tawny", "teach", "teary", "tease", "teddy", "teeth", "tempo", "tenet", "tenor", "tense", "tenth", "tepee", "tepid", "terra", "terse", "testy", "thank", "theft", "their", "theme", "there", "these", "theta", "thick", "thief", "thigh", "thing", "think", "third", "thong", "thorn", "those", "three", "threw", "throb", "throw", "thrum", "thumb", "thump", "thyme", "tiara", "tibia", "tidal", "tiger", "tight", "tilde", "timer", "timid", "tipsy", "titan", "tithe", "title", "toast", "today", "toddy", "token", "tonal", "tonga", "tonic", "tooth", "topaz", "topic", "torch", "torso", "torus", "total", "totem", "touch", "tough", "towel", "tower", "toxic", "toxin", "trace", "track", "tract", "trade", "trail", "train", "trait", "tramp", "trash", "trawl", "tread", "treat", "trend", "triad", "trial", "tribe", "trice", "trick", "tried", "tripe", "trite", "troll", "troop", "trope", "trout", "trove", "truce", "truck", "truer", "truly", "trump", "trunk", "truss", "trust", "truth", "tryst", "tubal", "tuber", "tulip", "tulle", "tumor", "tunic", "turbo", "tutor", "twang", "tweak", "tweed", "tweet", "twice", "twine", "twirl", "twist", "twixt", "tying", "udder", "ulcer", "ultra", "umbra", "uncle", "uncut", "under", "undid", "undue", "unfed", "unfit", "unify", "union", "unite", "unity", "unlit", "unmet", "unset", "untie", "until", "unwed", "unzip", "upper", "upset", "urban", "urine", "usage", "usher", "using", "usual", "usurp", "utile", "utter", "vague", "valet", "valid", "valor", "value", "valve", "vapid", "vapor", "vault", "vaunt", "vegan", "venom", "venue", "verge", "verse", "verso", "verve", "vicar", "video", "vigil", "vigor", "villa", "vinyl", "viola", "viper", "viral", "virus", "visit", "visor", "vista", "vital", "vivid", "vixen", "vocal", "vodka", "vogue", "voice", "voila", "vomit", "voter", "vouch", "vowel", "vying", "wacky", "wafer", "wager", "wagon", "waist", "waive", "waltz", "warty", "waste", "watch", "water", "waver", "waxen", "weary", "weave", "wedge", "weedy", "weigh", "weird", "welch", "welsh", "wench", "whack", "whale", "wharf", "wheat", "wheel", "whelp", "where", "which", "whiff", "while", "whine", "whiny", "whirl", "whisk", "white", "whole", "whoop", "whose", "widen", "wider", "widow", "width", "wield", "wight", "willy", "wimpy", "wince", "winch", "windy", "wiser", "wispy", "witch", "witty", "woken", "woman", "women", "woody", "wooer", "wooly", "woozy", "wordy", "world", "worry", "worse", "worst", "worth", "would", "wound", "woven", "wrack", "wrath", "wreak", "wreck", "wrest", "wring", "wrist", "write", "wrong", "wrote", "wrung", "wryly", "yacht", "yearn", "yeast", "yield", "young", "youth", "zebra", "zesty", "zonal"]
// const lowerCaseWordArray: string[] = ["cigar", "rebut", "sissy", "humph", "awake", "blush", "focal", "evade", "naval", "serve", "heath", "dwarf", "model", "karma", "stink", "grade", "quiet", "bench", "abate", "feign", "major", "death", "fresh", "crust", "stool", "colon", "abase", "marry", "react", "batty", "pride", "floss", "helix", "croak", "staff", "paper", "unfed", "whelp", "trawl", "outdo", "adobe", "crazy", "sower", "repay", "digit", "crate", "cluck", "spike", "mimic", "pound", "maxim", "linen", "unmet", "flesh", "booby", "forth", "first", "stand", "belly", "ivory", "seedy", "print", "yearn", "drain", "bribe", "stout", "panel", "crass", "flume", "offal", "agree", "error", "swirl", "argue", "bleed", "delta", "flick", "totem", "wooer", "front", "shrub", "parry", "biome", "lapel", "start", "greet", "goner", "golem", "lusty", "loopy", "round", "audit", "lying", "gamma", "labor", "islet", "civic", "forge", "corny", "moult", "basic", "salad", "agate", "spicy", "spray", "essay", "fjord", "spend", "kebab", "guild", "aback", "motor", "alone", "hatch", "hyper", "thumb", "dowry", "ought", "belch", "dutch", "pilot", "tweed", "comet", "jaunt", "enema", "steed", "abyss", "growl", "fling", "dozen", "boozy", "erode", "world", "gouge", "click", "briar", "great", "altar", "pulpy", "blurt", "coast", "duchy", "groin", "fixer", "group", "rogue", "badly", "smart", "pithy", "gaudy", "chill", "heron", "vodka", "finer", "surer", "radio", "rouge", "perch", "retch", "wrote", "clock", "tilde", "store", "prove", "bring", "solve", "cheat", "grime", "exult", "usher", "epoch", "triad", "break", "rhino", "viral", "conic", "masse", "sonic", "vital", "trace", "using", "peach", "champ", "baton", "brake", "pluck", "craze", "gripe", "weary", "picky", "acute", "ferry", "aside", "tapir", "troll", "unify", "rebus", "boost", "truss", "siege", "tiger", "banal", "slump", "crank", "gorge", "query", "drink", "favor", "abbey", "tangy", "panic", "solar", "shire", "proxy", "point", "robot", "prick", "wince", "crimp", "knoll", "sugar", "whack", "mount", "perky", "could", "wrung", "light", "those", "moist", "shard", "pleat", "aloft", "skill", "elder", "frame", "humor", "pause", "ulcer", "ultra", "robin", "cynic", "agora", "aroma", "caulk", "shake", "pupal", "dodge", "swill", "tacit", "other", "thorn", "trove", "bloke", "vivid", "spill", "chant", "choke", "rupee", "nasty", "mourn", "ahead", "brine", "cloth", "hoard", "sweet", "month", "lapse", "watch", "today", "focus", "smelt", "tease", "cater", "movie", "lynch", "saute", "allow", "renew", "their", "slosh", "purge", "chest", "depot", "epoxy", "nymph", "found", "shall", "harry", "stove", "lowly", "snout", "trope", "fewer", "shawl", "natal", "fibre", "comma", "foray", "scare", "stair", "black", "squad", "royal", "chunk", "mince", "slave", "shame", "cheek", "ample", "flair", "foyer", "cargo", "oxide", "plant", "olive", "inert", "askew", "heist", "shown", "zesty", "hasty", "trash", "fella", "larva", "forgo", "story", "hairy", "train", "homer", "badge", "midst", "canny", "fetus", "butch", "farce", "slung", "tipsy", "metal", "yield", "delve", "being", "scour", "glass", "gamer", "scrap", "money", "hinge", "album", "vouch", "asset", "tiara", "crept", "bayou", "atoll", "manor", "creak", "showy", "phase", "froth", "depth", "gloom", "flood", "trait", "girth", "piety", "payer", "goose", "float", "donor", "atone", "primo", "apron", "blown", "cacao", "loser", "input", "gloat", "awful", "brink", "smite", "beady", "rusty", "retro", "droll", "gawky", "hutch", "pinto", "gaily", "egret", "lilac", "sever", "field", "fluff", "hydro", "flack", "agape", "wench", "voice", "stead", "stalk", "berth", "madam", "night", "bland", "liver", "wedge", "augur", "roomy", "wacky", "flock", "angry", "bobby", "trite", "aphid", "tryst", "midge", "power", "elope", "cinch", "motto", "stomp", "upset", "bluff", "cramp", "quart", "coyly", "youth", "rhyme", "buggy", "alien", "smear", "unfit", "patty", "cling", "glean", "label", "hunky", "khaki", "poker", "gruel", "twice", "twang", "shrug", "treat", "unlit", "waste", "merit", "woven", "octal", "needy", "clown", "widow", "irony", "ruder", "gauze", "chief", "onset", "prize", "fungi", "charm", "gully", "inter", "whoop", "taunt", "leery", "class", "theme", "lofty", "tibia", "booze", "alpha", "thyme", "eclat", "doubt", "parer", "chute", "stick", "trice", "alike", "sooth", "recap", "saint", "liege", "glory", "grate", "admit", "brisk", "soggy", "usurp", "scald", "scorn", "leave", "twine", "sting", "bough", "marsh", "sloth", "dandy", "vigor", "howdy", "enjoy", "valid", "ionic", "equal", "unset", "floor", "catch", "spade", "stein", "exist", "quirk", "denim", "grove", "spiel", "mummy", "fault", "foggy", "flout", "carry", "sneak", "libel", "waltz", "aptly", "piney", "inept", "aloud", "photo", "dream", "stale", "vomit", "ombre", "fanny", "unite", "snarl", "baker", "there", "glyph", "pooch", "hippy", "spell", "folly", "louse", "gulch", "vault", "godly", "threw", "fleet", "grave", "inane", "shock", "crave", "spite", "valve", "skimp", "claim", "rainy", "musty", "pique", "daddy", "quasi", "arise", "aging", "valet", "opium", "avert", "stuck", "recut", "mulch", "genre", "plume", "rifle", "count", "incur", "total", "wrest", "mocha", "deter", "study", "lover", "safer", "rivet", "funny", "smoke", "mound", "undue", "sedan", "pagan", "swine", "guile", "gusty", "equip", "tough", "canoe", "chaos", "covet", "human", "udder", "lunch", "blast", "stray", "manga", "melee", "lefty", "quick", "paste", "given", "octet", "risen", "groan", "leaky", "grind", "carve", "loose", "sadly", "spilt", "apple", "slack", "honey", "final", "sheen", "eerie", "minty", "slick", "derby", "wharf", "spelt", "coach", "erupt", "singe", "price", "spawn", "fairy", "jiffy", "filmy", "stack", "chose", "sleep", "ardor", "nanny", "niece", "woozy", "handy", "grace", "ditto", "stank", "cream", "usual", "diode", "valor", "angle", "ninja", "muddy", "chase", "reply", "prone", "spoil", "heart", "shade", "diner", "arson", "onion", "sleet", "dowel", "couch", "palsy", "bowel", "smile", "evoke", "creek", "lance", "eagle", "idiot", "siren", "built", "embed", "award", "dross", "annul", "goody", "frown", "patio", "laden", "humid", "elite", "lymph", "edify", "might", "reset", "visit", "gusto", "purse", "vapor", "crock", "write", "sunny", "loath", "chaff", "slide", "queer", "venom", "stamp", "sorry", "still", "acorn", "aping", "pushy", "tamer", "hater", "mania", "awoke", "brawn", "swift", "exile", "birch", "lucky", "freer", "risky", "ghost", "plier", "lunar", "winch", "snare", "nurse", "house", "borax", "nicer", "lurch", "exalt", "about", "savvy", "toxin", "tunic", "pried", "inlay", "chump", "lanky", "cress", "eater", "elude", "cycle", "kitty", "boule", "moron", "tenet", "place", "lobby", "plush", "vigil", "index", "blink", "clung", "qualm", "croup", "clink", "juicy", "stage", "decay", "nerve", "flier", "shaft", "crook", "clean", "china", "ridge", "vowel", "gnome", "snuck", "icing", "spiny", "rigor", "snail", "flown", "rabid", "prose", "thank", "poppy", "budge", "fiber", "moldy", "dowdy", "kneel", "track", "caddy", "quell", "dumpy", "paler", "swore", "rebar", "scuba", "splat", "flyer", "horny", "mason", "doing", "ozone", "amply", "molar", "ovary", "beset", "queue", "cliff", "magic", "truce", "sport", "fritz", "edict", "twirl", "verse", "llama", "eaten", "range", "whisk", "hovel", "rehab", "macaw", "sigma", "spout", "verve", "sushi", "dying", "fetid", "brain", "buddy", "thump", "scion", "candy", "chord", "basin", "march", "crowd", "arbor", "gayly", "musky", "stain", "dally", "bless", "bravo", "stung", "title", "ruler", "kiosk", "blond", "ennui", "layer", "fluid", "tatty", "score", "cutie", "zebra", "barge", "matey", "bluer", "aider", "shook", "river", "privy", "betel", "frisk", "bongo", "begun", "azure", "weave", "genie", "sound", "glove", "braid", "scope", "wryly", "rover", "assay", "ocean", "bloom", "irate", "later", "woken", "silky", "wreck", "dwelt", "slate", "smack", "solid", "amaze", "hazel", "wrist", "jolly", "globe", "flint", "rouse", "civil", "vista", "relax", "cover", "alive", "beech", "jetty", "bliss", "vocal", "often", "dolly", "eight", "joker", "since", "event", "ensue", "shunt", "diver", "poser", "worst", "sweep", "alley", "creed", "anime", "leafy", "bosom", "dunce", "stare", "pudgy", "waive", "choir", "stood", "spoke", "outgo", "delay", "bilge", "ideal", "clasp", "seize", "hotly", "laugh", "sieve", "block", "meant", "grape", "noose", "hardy", "shied", "drawl", "daisy", "putty", "strut", "burnt", "tulip", "crick", "idyll", "vixen", "furor", "geeky", "cough", "naive", "shoal", "stork", "bathe", "aunty", "check", "prime", "brass", "outer", "furry", "razor", "elect", "evict", "imply", "demur", "quota", "haven", "cavil", "swear", "crump", "dough", "gavel", "wagon", "salon", "nudge", "harem", "pitch", "sworn", "pupil", "excel", "stony", "cabin", "unzip", "queen", "trout", "polyp", "earth", "storm", "until", "taper", "enter", "child", "adopt", "minor", "fatty", "husky", "brave", "filet", "slime", "glint", "tread", "steal", "regal", "guest", "every", "murky", "share", "spore", "hoist", "buxom", "inner", "otter", "dimly", "level", "sumac", "donut", "stilt", "arena", "sheet", "scrub", "fancy", "slimy", "pearl", "silly", "porch", "dingo", "sepia", "amble", "shady", "bread", "friar", "reign", "dairy", "quill", "cross", "brood", "tuber", "shear", "posit", "blank", "villa", "shank", "piggy", "freak", "which", "among", "fecal", "shell", "would", "algae", "large", "rabbi", "agony", "amuse", "bushy", "copse", "swoon", "knife", "pouch", "ascot", "plane", "crown", "urban", "snide", "relay", "abide", "viola", "rajah", "straw", "dilly", "crash", "amass", "third", "trick", "tutor", "woody", "blurb", "grief", "disco", "where", "sassy", "beach", "sauna", "comic", "clued", "creep", "caste", "graze", "snuff", "frock", "gonad", "drunk", "prong", "lurid", "steel", "halve", "buyer", "vinyl", "utile", "smell", "adage", "worry", "tasty", "local", "trade", "finch", "ashen", "modal", "gaunt", "clove", "enact", "adorn", "roast", "speck", "sheik", "missy", "grunt", "snoop", "party", "touch", "mafia", "emcee", "array", "south", "vapid", "jelly", "skulk", "angst", "tubal", "lower", "crest", "sweat", "cyber", "adore", "tardy", "swami", "notch", "groom", "roach", "hitch", "young", "align", "ready", "frond", "strap", "puree", "realm", "venue", "swarm", "offer", "seven", "dryer", "diary", "dryly", "drank", "acrid", "heady", "theta", "junto", "pixie", "quoth", "bonus", "shalt", "penne", "amend", "datum", "build", "piano", "shelf", "lodge", "suing", "rearm", "coral", "ramen", "worth", "psalm", "infer", "overt", "mayor", "ovoid", "glide", "usage", "poise", "randy", "chuck", "prank", "fishy", "tooth", "ether", "drove", "idler", "swath", "stint", "while", "begat", "apply", "slang", "tarot", "radar", "credo", "aware", "canon", "shift", "timer", "bylaw", "serum", "three", "steak", "iliac", "shirk", "blunt", "puppy", "penal", "joist", "bunny", "shape", "beget", "wheel", "adept", "stunt", "stole", "topaz", "chore", "fluke", "afoot", "bloat", "bully", "dense", "caper", "sneer", "boxer", "jumbo", "lunge", "space", "avail", "short", "slurp", "loyal", "flirt", "pizza", "conch", "tempo", "droop", "plate", "bible", "plunk", "afoul", "savoy", "steep", "agile", "stake", "dwell", "knave", "beard", "arose", "motif", "smash", "broil", "glare", "shove", "baggy", "mammy", "swamp", "along", "rugby", "wager", "quack", "squat", "snaky", "debit", "mange", "skate", "ninth", "joust", "tramp", "spurn", "medal", "micro", "rebel", "flank", "learn", "nadir", "maple", "comfy", "remit", "gruff", "ester", "least", "mogul", "fetch", "cause", "oaken", "aglow", "meaty", "gaffe", "shyly", "racer", "prowl", "thief", "stern", "poesy", "rocky", "tweet", "waist", "spire", "grope", "havoc", "patsy", "truly", "forty", "deity", "uncle", "swish", "giver", "preen", "bevel", "lemur", "draft", "slope", "annoy", "lingo", "bleak", "ditty", "curly", "cedar", "dirge", "grown", "horde", "drool", "shuck", "crypt", "cumin", "stock", "gravy", "locus", "wider", "breed", "quite", "chafe", "cache", "blimp", "deign", "fiend", "logic", "cheap", "elide", "rigid", "false", "renal", "pence", "rowdy", "shoot", "blaze", "envoy", "posse", "brief", "never", "abort", "mouse", "mucky", "sulky", "fiery", "media", "trunk", "yeast", "clear", "skunk", "scalp", "bitty", "cider", "koala", "duvet", "segue", "creme", "super", "grill", "after", "owner", "ember", "reach", "nobly", "empty", "speed", "gipsy", "recur", "smock", "dread", "merge", "burst", "kappa", "amity", "shaky", "hover", "carol", "snort", "synod", "faint", "haunt", "flour", "chair", "detox", "shrew", "tense", "plied", "quark", "burly", "novel", "waxen", "stoic", "jerky", "blitz", "beefy", "lyric", "hussy", "towel", "quilt", "below", "bingo", "wispy", "brash", "scone", "toast", "easel", "saucy", "value", "spice", "honor", "route", "sharp", "bawdy", "radii", "skull", "phony", "issue", "lager", "swell", "urine", "gassy", "trial", "flora", "upper", "latch", "wight", "brick", "retry", "holly", "decal", "grass", "shack", "dogma", "mover", "defer", "sober", "optic", "crier", "vying", "nomad", "flute", "hippo", "shark", "drier", "obese", "bugle", "tawny", "chalk", "feast", "ruddy", "pedal", "scarf", "cruel", "bleat", "tidal", "slush", "semen", "windy", "dusty", "sally", "igloo", "nerdy", "jewel", "shone", "whale", "hymen", "abuse", "fugue", "elbow", "crumb", "pansy", "welsh", "syrup", "terse", "suave", "gamut", "swung", "drake", "freed", "afire", "shirt", "grout", "oddly", "tithe", "plaid", "dummy", "broom", "blind", "torch", "enemy", "again", "tying", "pesky", "alter", "gazer", "noble", "ethos", "bride", "extol", "decor", "hobby", "beast", "idiom", "utter", "these", "sixth", "alarm", "erase", "elegy", "spunk", "piper", "scaly", "scold", "hefty", "chick", "sooty", "canal", "whiny", "slash", "quake", "joint", "swept", "prude", "heavy", "wield", "femme", "lasso", "maize", "shale", "screw", "spree", "smoky", "whiff", "scent", "glade", "spent", "prism", "stoke", "riper", "orbit", "cocoa", "guilt", "humus", "shush", "table", "smirk", "wrong", "noisy", "alert", "shiny", "elate", "resin", "whole", "hunch", "pixel", "polar", "hotel", "sword", "cleat", "mango", "rumba", "puffy", "filly", "billy", "leash", "clout", "dance", "ovate", "facet", "chili", "paint", "liner", "curio", "salty", "audio", "snake", "fable", "cloak", "navel", "spurt", "pesto", "balmy", "flash", "unwed", "early", "churn", "weedy", "stump", "lease", "witty", "wimpy", "spoof", "saner", "blend", "salsa", "thick", "warty", "manic", "blare", "squib", "spoon", "probe", "crepe", "knack", "force", "debut", "order", "haste", "teeth", "agent", "widen", "icily", "slice", "ingot", "clash", "juror", "blood", "abode", "throw", "unity", "pivot", "slept", "troop", "spare", "sewer", "parse", "morph", "cacti", "tacky", "spool", "demon", "moody", "annex", "begin", "fuzzy", "patch", "water", "lumpy", "admin", "omega", "limit", "tabby", "macho", "aisle", "skiff", "basis", "plank", "verge", "botch", "crawl", "lousy", "slain", "cubic", "raise", "wrack", "guide", "foist", "cameo", "under", "actor", "revue", "fraud", "harpy", "scoop", "climb", "refer", "olden", "clerk", "debar", "tally", "ethic", "cairn", "tulle", "ghoul", "hilly", "crude", "apart", "scale", "older", "plain", "sperm", "briny", "abbot", "rerun", "quest", "crisp", "bound", "befit", "drawn", "suite", "itchy", "cheer", "bagel", "guess", "broad", "axiom", "chard", "caput", "leant", "harsh", "curse", "proud", "swing", "opine", "taste", "lupus", "gumbo", "miner", "green", "chasm", "lipid", "topic", "armor", "brush", "crane", "mural", "abled", "habit", "bossy", "maker", "dusky", "dizzy", "lithe", "brook", "jazzy", "fifty", "sense", "giant", "surly", "legal", "fatal", "flunk", "began", "prune", "small", "slant", "scoff", "torus", "ninny", "covey", "viper", "taken", "moral", "vogue", "owing", "token", "entry", "booth", "voter", "chide", "elfin", "ebony", "neigh", "minim", "melon", "kneed", "decoy", "voila", "ankle", "arrow", "mushy", "tribe", "cease", "eager", "birth", "graph", "odder", "terra", "weird", "tried", "clack", "color", "rough", "weigh", "uncut", "ladle", "strip", "craft", "minus", "dicey", "titan", "lucid", "vicar", "dress", "ditch", "gypsy", "pasta", "taffy", "flame", "swoop", "aloof", "sight", "broke", "teary", "chart", "sixty", "wordy", "sheer", "leper", "nosey", "bulge", "savor", "clamp", "funky", "foamy", "toxic", "brand", "plumb", "dingy", "butte", "drill", "tripe", "bicep", "tenor", "krill", "worse", "drama", "hyena", "think", "ratio", "cobra", "basil", "scrum", "bused", "phone", "court", "camel", "proof", "heard", "angel", "petal", "pouty", "throb", "maybe", "fetal", "sprig", "spine", "shout", "cadet", "macro", "dodgy", "satyr", "rarer", "binge", "trend", "nutty", "leapt", "amiss", "split", "myrrh", "width", "sonar", "tower", "baron", "fever", "waver", "spark", "belie", "sloop", "expel", "smote", "baler", "above", "north", "wafer", "scant", "frill", "awash", "snack", "scowl", "frail", "drift", "limbo", "fence", "motel", "ounce", "wreak", "revel", "talon", "prior", "knelt", "cello", "flake", "debug", "anode", "crime", "salve", "scout", "imbue", "pinky", "stave", "vague", "chock", "fight", "video", "stone", "teach", "cleft", "frost", "prawn", "booty", "twist", "apnea", "stiff", "plaza", "ledge", "tweak", "board", "grant", "medic", "bacon", "cable", "brawl", "slunk", "raspy", "forum", "drone", "women", "mucus", "boast", "toddy", "coven", "tumor", "truer", "wrath", "stall", "steam", "axial", "purer", "daily", "trail", "niche", "mealy", "juice", "nylon", "plump", "merry", "flail", "papal", "wheat", "berry", "cower", "erect", "brute", "leggy", "snipe", "sinew", "skier", "penny", "jumpy", "rally", "umbra", "scary", "modem", "gross", "avian", "greed", "satin", "tonic", "parka", "sniff", "livid", "stark", "trump", "giddy", "reuse", "taboo", "avoid", "quote", "devil", "liken", "gloss", "gayer", "beret", "noise", "gland", "dealt", "sling", "rumor", "opera", "thigh", "tonga", "flare", "wound", "white", "bulky", "etude", "horse", "circa", "paddy", "inbox", "fizzy", "grain", "exert", "surge", "gleam", "belle", "salvo", "crush", "fruit", "sappy", "taker", "tract", "ovine", "spiky", "frank", "reedy", "filth", "spasm", "heave", "mambo", "right", "clank", "trust", "lumen", "borne", "spook", "sauce", "amber", "lathe", "carat", "corer", "dirty", "slyly", "affix", "alloy", "taint", "sheep", "kinky", "wooly", "mauve", "flung", "yacht", "fried", "quail", "brunt", "grimy", "curvy", "cagey", "rinse", "deuce", "state", "grasp", "milky", "bison", "graft", "sandy", "baste", "flask", "hedge", "girly", "swash", "boney", "coupe", "endow", "abhor", "welch", "blade", "tight", "geese", "miser", "mirth", "cloud", "cabal", "leech", "close", "tenth", "pecan", "droit", "grail", "clone", "guise", "ralph", "tango", "biddy", "smith", "mower", "payee", "serif", "drape", "fifth", "spank", "glaze", "allot", "truck", "kayak", "virus", "testy", "tepee", "fully", "zonal", "metro", "curry", "grand", "banjo", "axion", "bezel", "occur", "chain", "nasal", "gooey", "filer", "brace", "allay", "pubic", "raven", "plead", "gnash", "flaky", "munch", "dully", "eking", "thing", "slink", "hurry", "theft", "shorn", "pygmy", "ranch", "wring", "lemon", "shore", "mamma", "froze", "newer", "style", "moose", "antic", "drown", "vegan", "chess", "guppy", "union", "lever", "lorry", "image", "cabby", "druid", "exact", "truth", "dopey", "spear", "cried", "chime", "crony", "stunk", "timid", "batch", "gauge", "rotor", "crack", "curve", "latte", "witch", "bunch", "repel", "anvil", "soapy", "meter", "broth", "madly", "dried", "scene", "known", "magma", "roost", "woman", "thong", "punch", "pasty", "downy", "knead", "whirl", "rapid", "clang", "anger", "drive", "goofy", "email", "music", "stuff", "bleep", "rider", "mecca", "folio", "setup", "verso", "quash", "fauna", "gummy", "happy", "newly", "fussy", "relic", "guava", "ratty", "fudge", "femur", "chirp", "forte", "alibi", "whine", "petty", "golly", "plait", "fleck", "felon", "gourd", "brown", "thrum", "ficus", "stash", "decry", "wiser", "junta", "visor", "daunt", "scree", "impel", "await", "press", "whose", "turbo", "stoop", "speak", "mangy", "eying", "inlet", "crone", "pulse", "mossy", "staid", "hence", "pinch", "teddy", "sully", "snore", "ripen", "snowy", "attic", "going", "leach", "mouth", "hound", "clump", "tonal", "bigot", "peril", "piece", "blame", "haute", "spied", "undid", "intro", "basal", "shine", "gecko", "rodeo", "guard", "steer", "loamy", "scamp", "scram", "manly", "hello", "vaunt", "organ", "feral", "knock", "extra", "condo", "adapt", "willy", "polka", "rayon", "skirt", "faith", "torso", "match", "mercy", "tepid", "sleek", "riser", "twixt", "peace", "flush", "catty", "login", "eject", "roger", "rival", "untie", "refit", "aorta", "adult", "judge", "rower", "artsy", "rural", "shave"]

// zhs*
export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('wordleGame')
  const currentPath = __dirname;
  const filePath = path.join(currentPath, 'idioms.json');
  const idiomsData = fs.readFileSync(filePath, 'utf-8');
  const idiomsList = JSON.parse(idiomsData);
  // tzb*
  ctx.model.extend('wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    isStarted: 'boolean',
    remainingGuessesCount: 'integer',
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    guessWordLength: 'unsigned',
    gameMode: 'string',
    isRunning: 'boolean',
    timestamp: {type: 'integer', length: 20},
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    isHardMode: 'boolean',
    remainingWordsList: 'list',
    isAbsurd: 'boolean',
    isChallengeMode: 'boolean',
    targetWord: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    isUltraHardMode: 'boolean',
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
    guessWordLength: 'unsigned',
    gameMode: 'string',
    timestamp: {type: 'integer', length: 20},
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

    content = content?.trim()
    const gameInfo = await getGameInfo(channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await next();
    }

    // 判断输入
    if (gameInfo.gameMode === '汉兜') {
      if (!isFourCharacterIdiom(content)) {
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
  // wordleGame帮助
  ctx.command('wordleGame', '猜单词游戏帮助')
    .action(async ({session}) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      await session.execute(`wordleGame -h`)
    })
  // wordleGame.加入 j* jr*
  ctx.command('wordleGame.加入 [money:number]', '加入游戏')
    .action(async ({session}, money = 0) => {
      const {channelId, userId, username, user} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      let gameInfo: any = await getGameInfo(channelId)
      const isInGame = await isPlayerInGame(channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(session, `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`)
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
            const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
            const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
            // 图
            imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            imageBuffers.push(imageBuffer);
          }
          if (wordlesNum > 1) {
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(htmlImgString);
          }
          // 返回提示和游戏进程图
          return await sendMessage(session, `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
        }
      }
      // 判断输入
      if (typeof money !== 'number' || money < 0) {
        return await sendMessage(session, `【@${username}】\n真是个傻瓜呢~\n投个钱也要别人教你嘛！`);
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(session, `【@${username}】\n咱们这是小游戏呀...\n不许玩这么大！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】`);
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
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n当前投入金额为：【${money}】\n当前玩家人数：${numberOfPlayers} 名！`);
        } else {
          // 余额不够
          await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money: userMonetary.value});
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers} 名！`);
        }
      }
      // 加入游戏
      // money 为 0
      if (money === 0) {
        await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
        // 有余额
        if (userMonetary.value > 0) {
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n如果您想玩的模式为：【经典】\n那您可以带上货币数额再加入一次！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        } else {
          // 没余额
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n加油哇，祝您好运！\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        }
      } else {
        // money !== 0
        // 余额足够
        if (userMonetary.value >= money) {
          await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！您投入的金额为：【${money}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        } else {
          // 余额不够
          await ctx.database.create('wordle_gaming_player_records', {
            channelId,
            userId,
            username,
            money: userMonetary.value
          });
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        }
      }
      // .action
    })
  // wordleGame.退出 q* tc*
  ctx.command('wordleGame.退出', '退出游戏')
    .action(async ({session}) => {
      const {channelId, userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始啦！\n无法进行此操作！`);
      }
      // 玩家
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        return await sendMessage(session, `【@${username}】\n您还没加入游戏呢！\n怎么退出？`);
      }
      // 退出
      await ctx.database.remove('wordle_gaming_player_records', {channelId, userId})
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      return await sendMessage(session, `【@${username}】\n您成功退出游戏啦！\n那就让我们下次再见吧~\n剩余玩家人数：${numberOfPlayers} 名！`);
      // .action
    })
  // wordleGame.结束 s* js*
  ctx.command('wordleGame.结束', '结束游戏')
    .action(async ({session}) => {
      const {channelId, userId, username, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始哦~怎么结束呐？`);
      }
      // 玩家记录输
      await updatePlayerRecordsLose(channelId, gameInfo)
      // 结束
      const processedResult: string = gameInfo.wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
      await endGame(channelId)
      const duration = calculateGameDuration(gameInfo.timestamp, timestamp);
      const message = `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${gameInfo.isAbsurd ? '' : `\n${generateGameEndMessage(gameInfo)}`}${processedResult}`;
      return await sendMessage(session, message);
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
      const {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
      }
      // 提示输入
      await sendMessage(session, `【@${username}】\n当前可以开始的游戏模式如下：\n${exams.map((exam, index) => `${index + 1}. ${exam}`).join('\n')}\n请输入您想开始的【序号】或【模式名】：`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
      // 判断 userInput 是否为有效输入
      const selectedExam = isNaN(parseInt(userInput)) ? userInput.toUpperCase().trim() : exams[parseInt(userInput) - 1];
      if (exams.includes(selectedExam)) {
        if (!guessWordLength) {
          if (config.shouldPromptWordLengthInput && selectedExam !== '经典' && selectedExam !== 'Lewdle') {
            await sendMessage(session, `【@${username}】\n请输入猜单词的长度：`);
            const userInput = await session.prompt();
            if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
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
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重新输入。`);
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
      const {channelId, userId, username, platform, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
      }
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`);
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
        timestamp: timestamp,
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
            timestamp: timestamp,
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

      return await sendMessage(session, message);
      // .action
    })
  const exams = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜",
  ];
  exams.forEach((exam) => {
    if (exam !== "经典") {
      // 10* fjd*
      ctx.command(`wordleGame.开始.${exam} [guessWordLength:number]`, `开始猜${exam}单词游戏`)
        .option('hard', '--hard 困难模式', {fallback: false})
        .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
        .option('absurd', '--absurd 变态模式', {fallback: false})
        .option('challenge', '--challenge 变态挑战模式', {fallback: false})
        .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
        .action(async ({session, options}, guessWordLength) => {
          const {channelId, userId, username, timestamp, platform} = session;
          // 更新玩家记录表中的用户名
          await updateNameInPlayerRecord(userId, username)
          if (!guessWordLength) {
            if (config.shouldPromptForWordLengthOnNonClassicStart && exam !== 'Lewdle') {
              await sendMessage(session, `【@${session.username}】\n请输入猜单词的长度：`);
              const userInput = await session.prompt();
              if (!userInput) return await sendMessage(session, `【@${session.username}】\n输入无效或超时。`);
              guessWordLength = parseInt(userInput)
            } else {
              guessWordLength = config.defaultWordLengthForGuessing
            }
          }
          if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
            return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
          }

          // 判断输入
          if (typeof guessWordLength !== 'number' || !isValidGuessWordLength(exam, guessWordLength) && exam !== 'Lewdle' && exam !== '汉兜') {
            return await sendMessage(session, `【@${username}】\n无效的单词长度参数！\n${exam}单词长度可选值范围：${getValidGuessWordLengthRange(exam)}`);
          }

          // 游戏状态
          const gameInfo = await getGameInfo(channelId);
          if (gameInfo.isStarted) {
            return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
          }

          // 人数
          const numberOfPlayers = await getNumberOfPlayers(channelId);
          if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
            return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n先加入游戏吧~`);
          }

          // 非经典还钱
          if (exam !== '汉兜') {
            await updateGamingPlayerRecords(channelId);
          } else {
            // 汉兜扣钱
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
          } else if (exam === '汉兜') {
            const selectedIdiom: Idiom = getRandomIdiom(idiomsList);
            guessWordLength = 4
            pinyin = selectedIdiom.pinyin
            randomWord = selectedIdiom.idiom
            translation = selectedIdiom.explanation
          } else {
            const result = getRandomWordTranslation(exam, guessWordLength);
            randomWord = result.word
            translation = result.translation
            wordCount = result.wordCount
          }
          selectedWords.push(randomWord);
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
          if (wordlesNum > 1 || exam === '汉兜') {
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
            remainingGuessesCount: exam === '汉兜' ? 10 + wordlesNum - 1 : guessWordLength + 1 + wordlesNum - 1,
            guessWordLength,
            gameMode: exam,
            timestamp: timestamp,
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
                } else if (exam === '汉兜') {
                  const selectedIdiom: Idiom = getRandomIdiom(idiomsList);
                  guessWordLength = 4
                  pinyin = selectedIdiom.pinyin
                  randomWordExtra = selectedIdiom.idiom
                  translation = selectedIdiom.explanation
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
                remainingGuessesCount: exam === '汉兜' ? 10 + wordlesNum - 1 : guessWordLength + 1 + wordlesNum - 1,
                guessWordLength,
                wordGuess: randomWordExtra,
                wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
                gameMode: exam,
                timestamp: timestamp,
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
          } else {
            const emptyGridHtml = isAbsurdMode ? generateEmptyGridHtml(1, guessWordLength) : generateEmptyGridHtml(guessWordLength + 1 + wordlesNum - 1, guessWordLength);
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

          const gameMode = `游戏开始！\n当前游戏模式为：【${exam}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurdMode ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】`;
          const challengeInfo = isChallengeMode ? `\n目标单词为：【${randomWord}】` : '';
          const wordLength = `单词长度为：【${guessWordLength}】`;
          const guessChance = `猜${exam === '汉兜' ? '词语|成语' : '单词'}机会为：【${isAbsurdMode ? '♾️' : exam === '汉兜' ? `${10 + wordlesNum - 1}` : guessWordLength + 1 + wordlesNum - 1}】`;
          const wordCount2 = exam === '汉兜' ? `待猜词语|成语数量为：【${idiomsList.length}】` : `待猜单词数量为：【${exam === 'Lewdle' ? '1000' : wordCount}】`;
          const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
          const image = h.image(imageBuffer, `image/${config.imageType}`);

          if (exam === '汉兜') {
            return await sendMessage(session, `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`);
          } else {
            return await sendMessage(session, `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`);
          }


        });
    }
  })
  // wordleGame.猜 c* cdc* ccy*
  ctx.command('wordleGame.猜 [inputWord:text]', '做出一次猜测')
    .option('random', '-r 随机', {fallback: false})
    .action(async ({session, options}, inputWord) => {
      const {channelId, userId, username, platform, timestamp} = session
      // 游戏状态
      let gameInfo: any = await getGameInfo(channelId)
      inputWord = inputWord?.trim()
      // 操作太快
      if (gameInfo.isRunning === true) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n操作太快了哦~\n再试一次吧！`);
      }

      if (!inputWord) {
        await sendMessage(session, `【@${username}】\n请输入【猜测词】或【取消】：`);
        const userInput = await session.prompt()
        if (!userInput) return await sendMessage(session, `【${username}】\n输入无效或超时。`);
        if (userInput === '取消') return await sendMessage(session, `【${username}】\n猜测操作已取消！`);
        inputWord = userInput.trim()
      }
      if (options.random) {
        inputWord = gameInfo.gameMode === '汉兜' ? getRandomIdiom(idiomsList).idiom : getRandomWordTranslation('ALL', gameInfo.guessWordLength).word
      }
      // 运行状态
      await setGuessRunningStatus(channelId, true)
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (!gameInfo.isStarted) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n游戏还没开始呢！`);
      }
      // 作答时间限制
      const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000; // 将时间戳转换为秒
      if (config.enableWordGuessTimeLimit) {
        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // // 生成 html 字符串
          // const emptyGridHtml = gameInfo.isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
          // const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // // 图
          // const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo)
          await endGame(channelId)
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`)
          // return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
        }
      }
      // 玩家不在游戏中
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        if (!config.allowNonPlayersToGuess) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n没加入游戏的话~不能猜哦！`);
        } else {
          // 更新玩家记录表中的用户名
          await updateNameInPlayerRecord(userId, username)
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
      } = gameInfo;
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(inputWord) && gameMode !== '汉兜') {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }
      if (!isFourCharacterIdiom(inputWord) && gameMode === '汉兜') {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`);
      }
      if (inputWord.length !== gameInfo.guessWordLength && gameMode !== '汉兜') {
        await setGuessRunningStatus(channelId, false)
        const usernameMention = `【@${username}】`;
        const inputLengthMessage = `输入的单词长度不对哦！\n您的输入为：【${inputWord}】\n它的长度为：【${inputWord.length}】\n待猜单词的长度为：【${gameInfo.guessWordLength}】`;
        const presentLettersWithoutAsterisk = uniqueSortedLowercaseLetters(presentLetters);
        const processedResult = wordlesNum > 1 ? '\n' + await processExtraGameInfos(channelId) : '';
        const progressMessage = `当前${calculateGameDuration(gameInfo.timestamp, timestamp)}\n当前进度：【${correctLetters.join('')}】${presentLettersWithoutAsterisk.length === 0 ? `` : `\n包含字母：【${presentLettersWithoutAsterisk}】`}${absentLetters.length === 0 ? '' : `\n不包含字母：【${absentLetters}】`}${processedResult}`;
        return await sendMessage(session, `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`);
      }
      // 是否存在该单词
      // 小写化
      const lowercaseInputWord = gameMode === '汉兜' ? inputWord : inputWord.toLowerCase();
      if (gameMode !== '汉兜') {
        const foundWord = findWord(lowercaseInputWord)
        if (!foundWord) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n你确定存在这样的单词吗？`);
        }
      }
      let userInptPinyin: string = ''
      if (gameMode === '汉兜') {
        if (!isIdiomInList(inputWord, idiomsList)) {
          const idiomInfo = await getIdiomInfo(inputWord)
          if (idiomInfo.pinyin === '未找到拼音') {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n你确定存在这样的四字词语吗？`);
          } else {
            userInptPinyin = idiomInfo.pinyin
          }
        }
      }
      const foundIdiom = findIdiomByIdiom(inputWord, idiomsList);
      if (!userInptPinyin && foundIdiom) {
        userInptPinyin = foundIdiom.pinyin
      }
      // 困难模式
      if (isHardMode) {
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

          return await sendMessage(session, message);
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
          await endGame(channelId)
          return await sendMessage(session, `【@${username}】\n根据透露出的信息！\n已经无任何可用单词！\n很遗憾，你们输了！`);
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
          await sendMessage(session, `【@${username}】\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n您可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`);
          let userInput = await session.prompt()
          // 生成 html 字符串
          // 图
          const imageBuffer2 = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          if (!userInput) {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。\n${h.image(imageBuffer2, `image/${config.imageType}`)}`);
          }
          if (userInput === '结束') {
            await session.execute(`wordleGame.结束`)
            return
          } else {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！\n${h.image(imageBuffer2, `image/${config.imageType}`)}`);
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
            letterTilesHtml = await generateLetterTilesHtmlForHandle(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo, gameInfo.pinyin, userInptPinyin);
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
          } else {
            emptyGridHtml = generateEmptyGridHtml(gameInfo.isWin ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
          }
        }
        const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
        // 图
        if (gameMode === '汉兜') {
          imageBuffer = await generateImageForHandle(`${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
        } else {
          imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
        }
        imageBuffers.push(imageBuffer);
        // 更新游戏记录
        const remainingGuessesCount = isAbsurd ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1
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
        await ctx.database.set('wordle_player_records', {userId}, {
          wordGuessCount: playerRecord.wordGuessCount + 1,
          fastestGuessTime: playerRecord.fastestGuessTime
        })

        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const gameDuration = calculateGameDuration(gameInfo.timestamp, timestamp);
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

        return await sendMessage(session, message);
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(channelId, gameInfo)
        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const challengeMessage = isChallengeMode ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！` : '';
        const answerInfo = isChallengeMode ? '' : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(gameInfo.timestamp, timestamp);
        const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n${gameDuration}${answerInfo}${processedResult}`;

        return await sendMessage(session, message);
      }
      // 继续
      await setGuessRunningStatus(channelId, false)
      return await sendMessage(session, `${h.image(imageBuffer, `image/${config.imageType}`)}`)
      // .action
    })
  // wordleGame.查询玩家记录 cx* cxwjjl*
  ctx.command('wordleGame.查询玩家记录 [targetUser:text]', '查询玩家记录')
    .action(async ({session}, targetUser) => {
      let {userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (targetUser) {
        const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
        const match = targetUser.match(userIdRegex);
        userId = match?.[1] ?? userId;
        username = match?.[2] ?? username;
      }

      const targetUserRecord = await ctx.database.get('wordle_player_records', {userId});

      if (targetUserRecord.length === 0) {
        await ctx.database.create('wordle_player_records', {userId, username});
        return sendMessage(session, `查询对象：${username} 无任何游戏记录。`);
      }

      const {
        win,
        lose,
        moneyChange,
        wordGuessCount,
        stats,
        fastestGuessTime
      } = targetUserRecord[0];

      const queryInfo = `【@${session.username}】
查询对象：${username}
猜出单词次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
损益为：${moneyChange} 点
详细统计信息如下：
${generateStatsInfo(stats, fastestGuessTime)}
    `;

      return sendMessage(session, queryInfo);
    });
  ctx.command('wordleGame.查单词 [targetWord:text]', '查单词引导')
    .action(async ({session, options}, targetWord) => {
      const {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      // 提示输入
      const availableDictionaryArray = ['ALL', 'WordWord'];
      const availableDictionaryArrayToLowerCase = availableDictionaryArray.map(word => word.toLowerCase());
      await sendMessage(session, `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray.map((dictionary, index) => `${index + 1}. ${dictionary}`).join('\n')}\n请输入您选择的【序号】或【词库名】：`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput)) ? userInput.toLowerCase().trim() : availableDictionaryArrayToLowerCase[parseInt(userInput) - 1];
      if (availableDictionaryArrayToLowerCase.includes(selectedDictionary)) {
        const command = `wordleGame.查单词.${selectedDictionary}${targetWord ? ` ${targetWord}` : ''}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重新输入。`);
      }
      // .action
    });
  // wordleGame.查单词 cxdc*
  ctx.command('wordleGame.查单词.ALL [targetWord:text]', '在ALL词库中查询单词释义（英译中）')
    .action(async ({session}, targetWord) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查询的单词】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查询单词操作已取消。`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }

      // 寻找
      const foundWord = findWord(targetWord)
      if (!foundWord) {
        return await sendMessage(session, `【@${username}】\n未在ALL词库中找到该单词。`);
      }
      return sendMessage(session, `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(foundWord.translation)}`);
    })
  // czdc*
  ctx.command('wordleGame.查单词.WordWord [targetWord:text]', '在WordWord中查找单词定义（英译英）')
    .action(async ({session}, targetWord) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的单词】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找单词操作已取消。`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }

      // 寻找
      fetchWordDefinitions(targetWord)
        .then((responseData) => {
          const definitions = responseData.word.definitions;
          const serializedDefinitions = serializeDefinitions(definitions);
          return sendMessage(session, `${capitalizeFirstLetter(targetWord)} Definitions: \n${serializedDefinitions ? serializedDefinitions : `- 该单词定义暂未收录。`}`);
        })
        .catch((error) => {
          return sendMessage(session, `【@${username}】\n未在WordWord中找到该单词。`);
        });
    })
  // ccy*
  ctx.command('wordleGame.查成语 [targetIdiom:text]', '查成语引导')
    .action(async ({session, options}, targetIdiom) => {
      const {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      // 提示输入
      const availableDictionaryArray = ['百度汉语', '汉典'];
      await sendMessage(session, `【@${username}】\n当前可用词库如下：\n${availableDictionaryArray.map((dictionary, index) => `${index + 1}. ${dictionary}`).join('\n')}\n请输入您选择的【序号】或【词库名】：`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput)) ? userInput.trim() : availableDictionaryArray[parseInt(userInput) - 1];
      if (availableDictionaryArray.includes(selectedDictionary)) {
        const command = `wordleGame.查成语.${selectedDictionary}${targetIdiom ? ` ${targetIdiom}` : ''}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n您的输入无效，请重新输入。`);
      }
      // .action
    });
  // czcy*
  ctx.command('wordleGame.查成语.百度汉语 [targetIdiom:text]', '在百度汉语中查找成语解释')
    .action(async ({session}, targetIdiom) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的成语】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入无效或超时。`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找成语操作已取消。`);
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`);
      }

      // 寻找
      const idiomInfo = await getIdiomInfo(targetIdiom)
      if (idiomInfo.pinyin === '未找到拼音') {
        return await sendMessage(session, `【@${username}】\n未在百度汉语中找到该成语。`);
      }
      return await sendMessage(session, `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n【解释】${idiomInfo.explanation}`);
    })
  ctx.command('wordleGame.查成语.汉典 [targetIdiom:text]', '在汉典中查找成语解释')
    .action(async ({session}, targetIdiom) => {
      let {userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的成语】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(session, `【@${username}】\n输入超时！`);
        if (userInput === '取消')
          return await sendMessage(session, `【@${username}】\n查找成语操作已取消。`);
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字词语吗？`);
      }
      // 寻找
      const idiomInfo = await getIdiomInfo2(targetIdiom);
      if (idiomInfo.pinyin === '未找到拼音') {
        return await sendMessage(session, `【@${username}】\n未在汉典中找到该成语。`);
      }
      return await sendMessage(session, `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n${idiomInfo.explanation}`);
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
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)

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
        const {isStarted, wordlesNum, guessWordLength, absentLetters, presentLetters} = gameInfo
        if (!isStarted) {
          return await sendMessage(session, `【@${username}】\n未检测到任何游戏进度！\n无法使用自动查找功能！`);
        }
        if (wordlesNum === 1) {
          await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
        } else {
          let userInput: string = ''
          if (!wordleIndexs) {
            await sendMessage(session, `【@${username}】\n检测到当前进度数量为：【${wordlesNum}】\n请输入【待查询序号（从左到右）】：\n支持输入多个（用空格隔开）\n例如：1 2`);
            userInput = await session.prompt()
            if (!userInput) return await sendMessage(session, `【${username}】\n输入无效或超时。`);
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
        return await sendMessage(session, chineseTutorial);
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
      return await sendMessage(session, `${result}`);
    });
  // wordleGame.查询进度 jd* cxjd*
  ctx.command('wordleGame.查询进度', '查询当前游戏进度')
    .action(async ({session}) => {
      const {channelId, userId, username, user, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      const gameInfo = await getGameInfo(channelId)
      // 未开始
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始呢~\n开始后再来查询进度吧！`)
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
      const inputLengthMessage = `待猜${gameMode === '汉兜' ? '词语' : '成语'}的长度为：【${guessWordLength}】`;
      const extraGameInfo = wordlesNum > 1 ? `\n${await processExtraGameInfos(channelId)}` : '';
      const gameDuration = calculateGameDuration(gameInfo.timestamp, timestamp);
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

      const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000;
      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurd ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ''}`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message);

      // .action
    })
  // pyscb* pysc*
  ctx.command('wordleGame.拼音速查表', '查看拼音速查表')
    .action(async ({session}) => {
      const page = await ctx.puppeteer.page();
      await page.setViewport({width: 500, height: 570, deviceScaleFactor: 1})
      const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
      await page.goto('file://' + filePath);

      const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 7.55px;">
<head>
    <meta charset="UTF-8">
    <title>汉兜 - 汉字 Wordle</title>
    <link rel="stylesheet" href="./handle.css">
</head>
<body>
${pinyinHtml}
</body>
</html>`;

      await page.setContent(html, {waitUntil: 'load'});
      const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
      await page.close();

      return sendMessage(session,`${h.image(imageBuffer, `image/${config.imageType}`)}`);
    })

  const rankType = [
    "总", "损益", "猜出单词次数", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜",
  ];

// r* phb*
  ctx.command('wordleGame.排行榜 [number:number]', '查看排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }

      await sendMessage(session, `当前可查看排行榜如下：
${rankType.map((type, index) => `${index + 1}. ${type}`).join('\n')}
请输入想要查看的【排行榜名】或【序号】：`);

      const userInput = await session.prompt();
      if (!userInput) return sendMessage(session, `输入无效或超时。`);

      // 处理用户输入
      const userInputNumber = parseInt(userInput);
      if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType.length) {
        const rankName = rankType[userInputNumber - 1];
        await session.execute(`wordleGame.排行榜.${rankName} ${number}`);
      } else if (rankType.includes(userInput)) {
        await session.execute(`wordleGame.排行榜.${userInput} ${number}`);
      } else {
        return sendMessage(session, `无效的输入。`);
      }
    });

  const rankType2 = [
    "总", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜",
  ];

  rankType2.forEach(type => {
    // phb*
    ctx.command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        const rankType3 = [
          "胜场", "输场", "最快用时"
        ];
        await sendMessage(session, `当前可查看排行榜如下：
${rankType3.map((type, index) => `${index + 1}. ${type}`).join('\n')}
请输入想要查看的【类型名】或【序号】：`);

        const userInput = await session.prompt();
        if (!userInput) return sendMessage(session, `输入无效或超时。`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType3.length) {
          const rankName = rankType3[userInputNumber - 1];
          await session.execute(`wordleGame.排行榜.${type}.${rankName} ${number}`);
        } else if (rankType3.includes(userInput)) {
          await session.execute(`wordleGame.排行榜.${type}.${userInput} ${number}`);
        } else {
          return sendMessage(session, `无效的输入。`);
        }
      });
  });
  // sy*
  ctx.command('wordleGame.排行榜.损益 [number:number]', '查看玩家损益排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'moneyChange', 'moneyChange', '玩家损益排行榜', number);
    });
  // ccdccs*
  ctx.command('wordleGame.排行榜.猜出单词次数 [number:number]', '查看玩家猜出单词次数排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'wordGuessCount', 'wordGuessCount', '玩家猜出单词次数排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.胜场 [number:number]', '查看玩家总胜场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'win', 'win', '玩家总胜场排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.输场 [number:number]', '查看玩家总输场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'lose', 'lose', '查看玩家总输场排行榜', number);
    });
  const rankType4 = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle", "汉兜",
  ];
  // 注册胜场、输场、用时排行榜指令
  rankType4.forEach((type) => {
    ctx.command(`wordleGame.排行榜.${type}.胜场 [number:number]`, `查看${type}胜场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'win', '胜场'));
      });

    ctx.command(`wordleGame.排行榜.${type}.输场 [number:number]`, `查看${type}输场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'lose', '输场'));
      });

    ctx.command(`wordleGame.排行榜.${type}.最快用时 [number:number]`, `查看${type}最快用时排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardFastestGuessTime(type, number));
      });
  });


  // ch*
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
      .map(({correctLetters, presentLetters, absentLetters, presentLettersWithIndex,presentPinyinsWithIndex,correctPinyinsWithIndex,correctTonesWithIndex,presentTonesWithIndex,presentTones,absentTones,absentPinyins,presentPinyins}) => {
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
      return `\n答案是：【${info.wordGuess}】${info.pinyin === '' ? '' : `\n拼音为：【${info.pinyin}】`}\n释义如下：\n${info.wordAnswerChineseDefinition}`
    })

    return resultStrings.join('\n')
  }

  async function generateWordlesImage(htmlImgString: string,) {
    const page = await ctx.puppeteer.page();
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
  };

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
                                             style="bottom: 1.3rem;">
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
      await setGuessRunningStatus(channelId, false),
    ]);
  }

  async function getLeaderboard(session: any, type: string, sortField: string, title: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {})
    const sortedPlayers = getPlayers.sort((a, b) => b[sortField] - a[sortField])
    const topPlayers = sortedPlayers.slice(0, number)

    let result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player[sortField]} ${(type === 'moneyChange') ? '点' : '次'}\n`
    })
    return await sendMessage(session, result);
  }

  async function updatePlayerRecordsLose(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const playerInfo: PlayerRecord = (await ctx.database.get('wordle_player_records', {userId: player.userId}))[0];
      const updatedLose = playerInfo.lose + 1;
      const gameMode = gameInfo.gameMode as keyof PlayerStats;
      playerInfo.stats[gameMode].lose += 1;
      await ctx.database.set('wordle_player_records', {userId: player.userId}, {
        stats: playerInfo.stats,
        lose: updatedLose
      });
    }
  }

  async function updatePlayerRecordsWin(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const playerInfo: PlayerRecord = (await ctx.database.get('wordle_player_records', {userId: player.userId}))[0];
      const updatedWin = playerInfo.win + 1;
      const gameMode = gameInfo.gameMode as keyof PlayerStats;
      playerInfo.stats[gameMode].win += 1;
      await ctx.database.set('wordle_player_records', {userId: player.userId}, {
        stats: playerInfo.stats,
        win: updatedWin
      });
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
    const page = await ctx.puppeteer.page();
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

    return imageBuffer;
  }

  async function generateImageForHandle(gridHtml: string): Promise<Buffer> {
    const page = await ctx.puppeteer.page();
    await page.setViewport({width: 611, height: 731, deviceScaleFactor: 1})
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<html lang="en" class="${config.isDarkThemeEnabled ? 'dark' : ''}" style="--vh: 7.55px;">
<head>
    <meta charset="UTF-8">
    <title>汉兜 - 汉字 Wordle</title>
    <link rel="stylesheet" href="./handle.css">
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

  async function updateNameInPlayerRecord(userId: string, username: string): Promise<void> {
    const userRecord = await ctx.database.get('wordle_player_records', {userId});

    if (userRecord.length === 0) {
      await ctx.database.create('wordle_player_records', {
        userId,
        username,
      });
      return;
    }

    const existingRecord = userRecord[0];
    let isChange = false

    if (username !== existingRecord.username) {
      existingRecord.username = username;
      isChange = true
    }

    const statsKeys = ['Lewdle', '汉兜'];
    const timeKeys = ['Lewdle', '汉兜'];

    for (const key of statsKeys) {
      if (!existingRecord.stats.hasOwnProperty(key)) {
        existingRecord.stats[key] = {win: 0, lose: 0};
        isChange = true;
      }
    }

    for (const key of timeKeys) {
      if (!existingRecord.fastestGuessTime.hasOwnProperty(key)) {
        existingRecord.fastestGuessTime[key] = 0;
        isChange = true;
      }
    }

    if (isChange) {
      await ctx.database.set('wordle_player_records', {userId}, {
        username: existingRecord.username,
        stats: existingRecord.stats,
        fastestGuessTime: existingRecord.fastestGuessTime
      });
    }

  }


  // csh*
  async function sendMessage(session: any, message: any): Promise<void> {
    if (config.isTextToImageConversionEnabled) {
      const lines = message.split('\n');
      const isOnlyImgTag = lines.length === 1 && lines[0].trim().startsWith('<img');
      if (isOnlyImgTag) {
        await session.send(message);
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
        const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
        await session.send(h.image(imageBuffer, 'image/png'));
      }
    } else {
      await session.send(message);
    }
  }

  // hs*
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
        const isHasTone = !!p.split('-')[2]; // 检查是否有数字声调
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
      for (let i = 0; i < word.length; i++) {
        if (toneMap[word[i]]) {
          processedWord.push(toneMap[word[i]]);
        } else {
          processedWord.push(word[i]);
        }
      }
      result.push(processedWord);
    });

    return result;
  }

  function isFourCharacterIdiom(targetIdiom: string): boolean {
    // 判断字符串长度是否为四
    if (targetIdiom.length !== 4) {
      return false;
    }

    // 使用正则表达式判断是否为中文字符
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
          explanation
        };
        idiomsList.push(newIdiom);
        writeIdiomsToFile(filePath, idiomsList);
      }
      return {pinyin, explanation};
    } catch (error) {
      // logger.error(error);
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
        writeIdiomsToFile(filePath, idiomsList);
      }
      return {pinyin, explanation};
    } catch (error) {
      // logger.error(error);
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
      'ALL'
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
    const folderPath = path.join(__dirname, '词汇', command);
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
      default:
        return false;
    }
  }

  function getValidGuessWordLengthRange(command: string): string {
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
            src: url("./franklin-normal-700.woff2") format("woff2");
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
            src: url("./franklin-normal-700.woff2") format("woff2");
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

  const pinyinHtml = `<div fixed="" z-40="" class="bottom-0 left-0 right-0 top-0">
    <div class="bg-base left-0 right-0 top-0 bottom-0 absolute transition-opacity ease-out opacity-50"></div>
    <div class="bg-base border-base absolute transition-all ease-out max-w-screen max-h-screen overflow-auto scrolls top-0 left-0 right-0 border-b"
         style="">
        <div p8="" pt4="" flex="~ col center" relative=""><p text-xl="" font-serif="" mb8=""><b>拼音速查表</b></p>
            <div grid="~ cols-[1fr_3fr] gap-x-10 gap-y-4" font-mono="" font-light="">
                <div text-center="">声母</div>
                <div text-center="">韵母</div>
                <div grid="~ cols-2 gap-3" h-min="">
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
                </div>
            </div>
        </div>
    </div>
</div>
    </div>`
  // apply
}
