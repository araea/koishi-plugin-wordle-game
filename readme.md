# koishi-plugin-wordle-game

[![npm](https://img.shields.io/npm/v/koishi-plugin-wordle-game?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-wordle-game)

## 📚 目录

- [koishi-plugin-wordle-game](#koishi-plugin-wordle-game)
  - [📚 目录](#-目录)
  - [🎮 简介](#-简介)
  - [🚀 安装](#-安装)
  - [🎣 使用](#-使用)
  - [🎛 配置](#-配置)
    - [主题设置](#主题设置)
    - [游戏设置](#游戏设置)
    - [游戏行为设置](#游戏行为设置)
  - [🎳 游戏指令](#-游戏指令)
    - [游戏操作](#游戏操作)
    - [游戏模式](#游戏模式)
    - [游戏操作](#游戏操作-1)
    - [数据查询](#数据查询)
  - [🌸测试图](#测试图)
    - [经典模式](#经典模式)
    - [汉兜模式](#汉兜模式)
    - [词影模式](#词影模式)
    - [方程式模式](#方程式模式)
    - [开始游戏引导](#开始游戏引导)
    - [查询进度](#查询进度)
    - [同时猜多个](#同时猜多个)
    - [拼音速查表](#拼音速查表)
    - [查单词](#查单词)
      - [英译中](#英译中)
      - [英译英](#英译英)
    - [查成语](#查成语)
    - [查询玩家记录](#查询玩家记录)
    - [单词查找器](#单词查找器)
    - [排行榜引导](#排行榜引导)
  - [🍰 致谢](#-致谢)
  - [✨ License](#-license)

## 🎮 简介

`koishi-plugin-wordle-game` 是一个基于 Koishi
框架的 [Wordle](https://www.nytimes.com/games/wordle/index.html) | [汉兜](https://handle.antfu.me/) | [词影](https://cy.surprising.studio/) |...
猜单词|猜成语|猜数字|猜数学方程式... 的小游戏插件。

主要功能：

- **汉兜模式**：汉兜猜成语，投入金币获得奖励。

- **可自定义游戏设置**：支持自定义猜词长度等设置，让游戏更有挑战性。

- **排行榜系统**：支持查询不同模式下的总胜负场次，为游戏增添竞技氛围。

- **经典模式**：随机从经典的 Wordle 英文单词中抽选，投入金币获得奖励。

- **多种题库模式**：涵盖 CET4/6、GRE、GMAT、IELTS、SAT、TOEFL、考研、ALL等考试和类别的热点单词。

> 共同游戏，提高英语水平，增进友谊，尽情享受游戏的乐趣。

## 🚀 安装

您可以通过以下命令安装该插件：

```bash
npm install koishi-plugin-wordle-game
```

或者通过 Koishi 插件市场搜索并安装该插件。

## 🎣 使用

- 启动必要的服务。您需要启用 `monetary`，`database` 和 `puppeteer` 插件。
  - 以实现货币系统，数据存储和图片生成的功能。
- 建议自行添加指令别名，以方便您和您的用户使用。
- 享受猜单词|四字词语|成语|数字|...游戏吧！😊
- 如果使用过程中出现成语的未知错误，可以前往 `data/wordleGame/idioms.json` 文件中搜索该成语，查看是否存在拼音的错误。
  - 当然你也可以直接删除这个 `idioms.json` 文件，然后重新启动机器人，这样会重新生成一个可能已经修复问题的新的 `idioms.json` 文件。
  - 这个文件里可以添加自定义的成语 0.0，例如：如果你想加 “原神启动” 也是可以的，注意格式即可（提醒：最后一个元素后面不要加逗号，因为不符合
    JSON 格式）。
- 遇到解决不了的问题，也可以想办法联系我，我很乐意帮助你！希望你玩的开心~😊

## 🎛 配置

### 主题设置

- `isDarkThemeEnabled: boolean`
  - 是否开启黑暗主题，默认值为 `false`。
- `isHighContrastThemeEnabled: boolean`
  - 是否开启高对比度（色盲）主题，默认值为 `false`。

### 游戏设置

- `defaultMaxLeaderboardEntries: number`
  - 显示排行榜时默认的最大人数。默认值为 `10`.
- `defaultWordLengthForGuessing: number`
  - 非经典游戏模式下，默认的猜单词长度。默认值为 `5`.
- `maxInvestmentCurrency: number`
  - 加入游戏时可投入的最大货币数额。默认值为 `50`.
- `defaultRewardMultiplier: number`
  - 猜单词经典模式赢了之后奖励的货币倍率。默认值为 `2`.
- `maxSimultaneousGuesses: number`
  - 最多同时猜测单词的数量，默认值为 `4`。
- `compositeImagePageWidth: number`
  - 合成图片页面宽度，默认值为 `800`。
- `compositeImagePageHeight: number`
  - 合成图片页面高度，默认值为 `100`。

### 游戏行为设置

- `allowNonPlayersToGuess: boolean`
  - 是否允许未加入游戏的玩家进行猜单词的操作，开启后可以无需加入直接开始。默认值为 `true`.
- `enableWordGuessMiddleware: boolean`
  - 是否开启猜单词指令无前缀的中间件。默认值为 `true`.
- `shouldPromptWordLengthInput: boolean`
  - 是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。默认值为 `true`.
- `shouldPromptForWordLengthOnNonClassicStart: boolean`
  - 是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。默认值为 `true`.
- `enableWordGuessTimeLimit: boolean`
  - 是否开启猜单词游戏作答时间限制功能。默认值为 `false`.
  - `wordGuessTimeLimitInSeconds: number`
    - 猜单词游戏作答时间，单位是秒。默认值为 `120`.
- `retractDelay`：自动撤回等待的时间，默认值为 0，单位是秒。值为 0 时不启用自动撤回功能。
- `imageType: "png" | "jpeg" | "webp"`
  - 发送的图片类型。默认值为 `"png"`.
- `isTextToImageConversionEnabled: boolean`
  - 是否开启将文本转为图片的功能（可选），如需启用，需要启用 `markdownToImage` 服务。默认值为 `false`.
- `isEnableQQOfficialRobotMarkdownTemplate: boolean`
  - 是否启用 QQ 官方机器人的 Markdown 模板，带消息按钮。
    - `customTemplateId: string`
      - 自定义模板 ID。
    - `key: string`
      - 文本内容中特定插值的 key，用于存放文本。如果你的插值为 {{.info}}，那么请在这里填 info。
    - `numberOfMessageButtonsPerRow: number`
      - 每行消息按钮的数量。

## 🎳 游戏指令

以下是该插件提供的指令列表:

### 游戏操作

- `wordleGame.退出` - 退出游戏，只能在游戏未开始时使用。
- `wordleGame.结束` - 结束游戏，只能在游戏已开始时使用。
- `wordleGame.加入 [money:number]` - 加入游戏，可选参数为投入的货币数额。

### 游戏模式

- `wordleGame.开始 [guessWordLength:number]`
  - 开始游戏引导，可选参数为待猜测项目的长度。

- `wordleGame.开始.经典/CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle/Numberle/Math/汉兜/词影 [guessWordLength:number]`
  - 开始猜不同类别的单词|数字|...游戏，可选参数为猜单词的长度。
  - 对于经典模式和汉兜模式，可投入货币，赢了有奖励。
    - `--hard`
      - 困难模式，绿色线索必须保特固定，黄色线索必须重复使用。在词影模式下，将提高匹配难度。
    - `--uhard`
      - 超困难模式，在困难模式的基础上，黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。
    - `--absurd`
      - 在这种模式下，你将面对一个极具挑战性的对手。
      - 荒谬/变态模式，AI将尽量避免给出答案。
      - 每次猜测时都会尽可能少地透露信息，甚至可能更换秘密词。
      - [如何玩？](https://qntm.org/absurdle)
    - `--challenge`
      - 仅建议高级玩家尝试。
      - 荒谬/变态挑战模式，要求你从一个给定的目标词出发，通过某种方式使其变成秘密词。
      - [如何玩？](https://qntm.org/challenge)
    - `--wordles <value:number>`
      - 同时猜测多个单词|词语，默认范围为 1 ~ 4，可自定义。
    - `--free`
      - 汉兜或词影的自由模式，任意四字词语都可作为猜测词。
    - `--all`
      - 汉兜或词影的全成语模式，成语|四字词语的数量会增加到 29766 多个，若不开启，则为常用成语 7208 个。

> Tip：可以同时启用困难模式和变态模式。

### 游戏操作

- `wordleGame.猜 [inputWord:text]` - 猜单词|成语|...，参数为输入的词。
  - `-r`
    - 随机一个单词|成语|数字|方程式。
- `wordleGame.查询进度` - 查询当前游戏进度。

### 数据查询

- `wordleGame.玩法介绍` - 各类类 Wordle 游戏玩法介绍。
- `wordleGame.单词查找器` - 使用 [WordFinder](https://wordword.org/) 查找匹配的单词。
- `wordleGame.拼音速查表` - 查看拼音速查表（会根据汉兜游戏进度自动变化）。
- `wordleGame.排行榜 [number:number]` - 查看排行榜，可选参数为排行榜的人数。
- `wordleGame.查单词.ALL [targetWord:text]` - 在 ALL 词库中查询单词信息（翻译）。
- `wordleGame.查成语.汉典 [targetWord:text]` - 在 [汉典](https://www.zdic.net/) 中查询成语信息（台湾词典）。
- `wordleGame.查询玩家记录 [targetUser:text]` - 查询玩家记录，可选参数为目标玩家的 at 信息。
- `wordleGame.查成语.百度汉语 [targetWord:text]` - 在 [百度汉语](https://hanyu.baidu.com/) 中查询成语信息（内地）。
- `wordleGame.查单词.WordWord [targetWord:text]` - 在 [WordWord](https://wordword.org/) 中查询单词信息（英文定义）。
- `wordleGame.排行榜.损益/总.胜场/总.输场/经典/CET4/CET6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle/汉兜/Numberle/Math.胜场/输场/最快用时 [number:number]` -
  查看不同模式的玩家排行榜，可选参数为排行榜的人数（偷偷插一嘴，词影有细分模式的排行榜哦~ 用 help 自行探索咯！）。

## 🌸测试图

<details>
<summary>点击这里展开/折叠内容</summary>

### 经典模式

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/dd55af6e-f38d-4f95-9bed-9d6ba967c429)

### 汉兜模式

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/d968f7fe-544b-4d29-a825-8ae59109a50b)

### 词影模式

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/b11d911b-f534-4800-aef6-e42ef184803c)
![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/45810d3f-732e-4338-9351-b21f4dd9a814)

### 方程式模式

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/b792df4b-baa2-4453-83f6-6fb58784b921)

### 开始游戏引导

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/80bb3c2b-d41c-44e0-8a4d-acd1845c1644)

### 查询进度

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/65e28147-feef-4794-bbbb-9565c65cae36)

### 同时猜多个

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/86db4fcf-9a6f-4b15-8c50-6f2d7ea017e3)

### 拼音速查表

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/669c625a-9360-4d88-a0ec-01103e82d9f4)

### 查单词

#### 英译中

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/c1913df7-1e1a-4324-a228-ed1679e4e330)

#### 英译英

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/18f7806e-641c-4135-8255-73e139e7e427)

### 查成语

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/76f88dd3-e0b1-48d4-bac7-6cafb0d996c7)

### 查询玩家记录

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/a14dd774-4148-4a0e-b7bc-deab8180c919)

### 单词查找器

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/4bad2757-8b49-4e39-b2b3-a311e6cfc08f)

### 排行榜引导

![image](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/9d87c34f-353c-49ed-a885-5ac8128dbd4a)


</details>

## 🍰 致谢

- [Koishi](https://koishi.chat/) - 机器人框架
- [Akisa](https://forum.koishi.xyz/u/akisa/summary) - Akisa 大人我爱你 💕
- [汉典](https://www.zdic.net/) - 查找成语
- [汉兜](https://handle.antfu.me/) - 汉兜游戏样式
- [百度汉语](https://hanyu.baidu.com/) - 查找成语
- [WordFinder](https://wordword.org/) - 单词查找
- [Numberle](https://dduarte.github.io/numberle/) - 数字猜测游戏
- [词影](https://cy.surprising.studio/) - 词影游戏代码与样式
- [Numberle](https://numberle.org/) - 数学方程式猜测游戏
- [LewdleGame](https://www.lewdlegame.com/App) - Lewdle 模式单词列表
- [WordlePlay](https://wordleplay.com/wordle-games) - 拓展玩法/单词列表补充
- [Wordle](https://www.nytimes.com/games/wordle/index.html) - 原版 Wordle 游戏网页样式
- [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) - 英汉语词典数据库
- [koishi-plugin-wordle](https://www.npmjs.com/package/koishi-plugin-wordle) - Wordle 经典模式词典
- [nonebot-plugin-wordle](https://github.com/noneplugin/nonebot-plugin-wordle) - Nonebot Wordle 的词典
- [Wordle 2315 words list](https://gist.github.com/DevilXD/6ad6cc1fe37872d069a795edd51233b2#file-wordle_words-txt) - 经典
  Wordle 的单词列表

## 🐱 QQ 群

- 956758505

## ✨ License

MIT License © 2024

希望您喜欢这款插件！ 💫

如有任何问题或建议，欢迎联系我哈~ 🎈
