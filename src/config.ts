import { Schema } from "koishi";

// 插件的使用说明，展示在「帮助」中。
export const usage = `## 使用

\`wordle.开始\` 开局，然后直接输入猜测词。

## 指令

| 指令 | 说明 |
| --- | --- |
| \`wordle.开始 [长度]\` | 开始引导 |
| \`wordle.开始.<模式> [长度]\` | 指定模式开局 |
| \`wordle.猜 <内容>\` | 提交猜测 |

模式：\`经典\`、\`汉兜\`、\`词影\`、\`Numberle\`、\`Math\`、\`Lewdle\` 及多种词库。

选项：\`--hard\`、\`--uhard\`、\`--absurd\`、\`--challenge\`、\`--wordles\`、\`--free\`、\`--all\`。`;

export interface Config {
  isDarkThemeEnabled: boolean;
  isHighContrastThemeEnabled: boolean;

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

  pinyinApiEndpoint: string;
  pinyinApiKey: string;
  pinyinApiModel: string;
  requestTimeout: number;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isDarkThemeEnabled: Schema.boolean()
      .default(false)
      .description(`是否开启黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean()
      .default(false)
      .description(`是否开启高对比度（色盲）主题。`),
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
    }),
  ]),
]) as any;
