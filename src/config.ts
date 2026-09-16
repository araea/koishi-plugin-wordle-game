import { Schema } from "koishi";

// 插件的使用说明，展示在「帮助」中。
export const usage = `## 使用

发送 \`wordle.开始\` 开局，之后直接发送猜测词即可。

## 指令

| 指令 | 说明 |
| --- | --- |
| \`wordle.开始 [长度]\` | 引导式开局 |
| \`wordle.开始.<模式> [长度]\` | 指定模式开局 |
| \`wordle.猜 <内容>\` | 提交猜测 |
| \`wordle.查询进度\` | 查看当前对局进度 |
| \`wordle.结束\` | 结束当前对局 |
| \`wordle.排行榜 [人数]\` | 查看排行榜 |
| \`wordle.战绩 [@某人]\` | 查询玩家战绩 |
| \`wordle.查单词 <词>\` | 引导式查单词 |
| \`wordle.查成语 <成语>\` | 查询成语的拼音与解释（汉典） |
| \`wordle.拼音速查表\` | 查看拼音速查表 |
| \`wordle.玩法介绍\` | 查看玩法介绍 |

模式包括经典、汉兜、词影、Numberle、Math、Lewdle 及其他词库。

可用选项：\`--hard\`、\`--uhard\`、\`--absurd\`、\`--challenge\`、\`--wordles\`、\`--free\`、\`--all\`。`;

export interface Config {
  isDarkThemeEnabled: boolean;
  isHighContrastThemeEnabled: boolean;

  defaultMaxLeaderboardEntries: number;
  defaultWordLengthForGuessing: number;
  maxSimultaneousGuesses: number;
  compositeImagePageWidth: number;
  compositeImagePageHeight: number;

  enableDirectInput: boolean;
  shouldPromptWordLengthInput: boolean;
  isPreventUserDuplicateGuessInput: boolean;
  shouldPromptForWordLengthOnNonClassicStart: boolean;

  enableWordGuessTimeLimit: boolean;
  wordGuessTimeLimitInSeconds: number;

  retractDelay: number;
  imageType: "png" | "jpeg" | "webp";

  pinyinApiEndpoint: string;
  pinyinApiKey: string;
  pinyinApiModel: string;
  requestTimeout: number;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isDarkThemeEnabled: Schema.boolean()
      .default(false)
      .description(`使用黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean()
      .default(false)
      .description(`使用高对比度主题，为色觉障碍准备。`),
  }).description("主题设置"),

  Schema.object({
    compositeImagePageWidth: Schema.number()
      .min(1)
      .default(800)
      .description(`多词合成图的页面宽度（像素）。`),
    compositeImagePageHeight: Schema.number()
      .min(1)
      .default(100)
      .description(`多词合成图的页面高度（像素）。`),
    maxSimultaneousGuesses: Schema.number()
      .min(1)
      .default(4)
      .description(`同时猜测的单词数量上限。`),
    defaultMaxLeaderboardEntries: Schema.number()
      .min(0)
      .default(10)
      .description(`排行榜默认显示的人数。`),
    defaultWordLengthForGuessing: Schema.number()
      .min(1)
      .default(5)
      .description(`非经典模式下默认的猜测长度。`),
  }).description("游戏设置"),

  Schema.intersect([
    Schema.object({
      enableDirectInput: Schema.boolean()
        .default(true)
        .description(`对局中直接发送猜测词即可续猜，无需指令前缀。`),
      isPreventUserDuplicateGuessInput: Schema.boolean()
        .default(true)
        .description(`拦截重复提交的猜测词。`),
      shouldPromptWordLengthInput: Schema.boolean()
        .default(true)
        .description(
          `引导式开局时，追问一次单词长度。关闭则直接用默认长度。`
        ),
      shouldPromptForWordLengthOnNonClassicStart: Schema.boolean()
        .default(true)
        .description(
          `以非经典模式开局时，追问一次单词长度。关闭则直接用默认长度。`
        ),
    }).description("游戏行为设置"),
    Schema.object({
      enableWordGuessTimeLimit: Schema.boolean()
        .default(false)
        .description(`给每次作答加上时间限制。`),
    }),
    Schema.union([
      Schema.object({
        enableWordGuessTimeLimit: Schema.const(true).required(),
        wordGuessTimeLimitInSeconds: Schema.number()
          .min(0)
          .default(120)
          .description(`每次作答的时间限制（秒）。`),
      }),
      Schema.object({}),
    ]),
    Schema.object({
      retractDelay: Schema.number()
        .min(0)
        .default(0)
        .description(
          `自动撤回延迟（秒），0 表示不撤回。`
        ),
      imageType: Schema.union(["png", "jpeg", "webp"])
        .default("png")
        .description(`发送的图片格式。`),
    }),
  ]),
]) as any;
