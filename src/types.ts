// 数据库表与业务数据结构定义，同时把插件用到的表注册到 koishi 的 Tables 中。

// 货币表（由 monetary 服务提供）
interface Monetary {
  uid: number;
  currency: string;
  value: number;
}

// 单局游戏记录
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

// 多词模式（wordles）下的额外游戏记录
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

// 已加入游戏的玩家
export interface GamingPlayer {
  id: number;
  channelId: string;
  userId: string;
  username: string;
  money: number;
}

// 玩家长期记录
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

export interface WordData {
  word: string;
  translation: string;
  wordCount: number;
}

export interface PlayerStats {
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

export interface WinLoseStats {
  win: number;
  lose: number;
}

export interface ExtraCiyingRankInfo {
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

// Wordle 单词方块的字母状态
export interface LetterState {
  letter: string;
  state: "correct" | "present" | "absent" | "undefined";
}

export interface WordEntry {
  word: string;
  translation: string;
}

// 拼音条目（pinyin.json 中的单项）
export interface PinyinItem2 {
  term: string;
  pinyin: string;
}

// 成语结构
export interface Idiom {
  idiom: string;
  pinyin: string;
  explanation: string;
}

// 拼音分割后的单元（声母/韵母）
export interface PinyinItem {
  value: string;
  status: "absent" | "present" | "correct";
  isHasTone: boolean;
}

export interface SeparatedPinyin {
  initials: PinyinItem[];
  finals: PinyinItem[];
}

export interface ProcessedRecord {
  word: string;
  pinyin: string[];
  initial: string;
  final: string;
}

// 调用 AI 生成拼音时的响应结构
export interface ChatCompletion {
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

export interface Choice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  logprobs: any;
  finish_reason: string;
}

declare module "koishi" {
  interface Tables {
    wordle_game_records: GameRecord;
    extra_wordle_game_records: ExtraGameRecord;
    wordle_gaming_player_records: GamingPlayer;
    wordle_player_records: PlayerRecord;
    monetary: Monetary;
  }
}
