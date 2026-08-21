import { Schema } from "koishi";

// 插件的使用说明，展示在「帮助」中。
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
