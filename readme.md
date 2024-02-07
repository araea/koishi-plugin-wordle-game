# koishi-plugin-wordle-game

[![npm](https：//img.shields.io/npm/v/koishi-plugin-wordle-game?style=flat-square)](https：//www.npmjs.com/package/koishi-plugin-wordle-game)

### 🎮 简介

`koishi-plugin-wordle-game` 是一个基于 Koishi 框架的 Wordle 猜单词小游戏插件。主要功能：

- **经典模式**：随机从经典的 Wordle 英文单词中抽选，投入金币获得奖励。

- **多种题库模式**：涵盖 CET4/6、GRE、GMAT、IELTS、SAT、TOEFL、考研、ALL等考试和类别的热点单词。

- **可自定义游戏设置**：支持自定义猜词长度等设置，让游戏更有挑战性。

- **排行榜系统**：支持查询不同模式下的总胜负场次，为游戏增添竞技氛围。

共同游戏，提高英语水平，增进友谊，尽情享受游戏的乐趣。

## 🚀 安装

您可以通过以下命令安装该插件：

```bash
npm install koishi-plugin-wordle-game
```

或者通过 Koishi 插件市场搜索并安装该插件。

## 🎣 使用

- 启动必要的服务。您需要启用 `monetary`，`database` 和 `puppeteer` 插件，以实现货币系统，数据存储和图片生成的功能。
- 建议自行添加指令别名，以方便您和您的用户使用。
- 享受猜单词游戏吧！😊

## 🎛 配置

### 游戏设置

- `defaultMaxLeaderboardEntries: number`
  - 显示排行榜时默认的最大人数。默认值为 `10`.
- `defaultWordLengthForGuessing: number`
  - 非经典游戏模式下，默认的猜单词长度。默认值为 `5`.
- `maxInvestmentCurrency: number`
  - 加入游戏时可投入的最大货币数额。默认值为 `50`.
- `defaultRewardMultiplier: number`
  - 猜单词经典模式赢了之后奖励的货币倍率。默认值为 `2`.

### 游戏行为设置

- `allowNonPlayersToGuess: boolean`
  - 是否允许未加入游戏的玩家进行猜单词的操作。默认值为 `true`.
- `enableWordGuessMiddleware: boolean`
  - 是否开启猜单词指令无前缀的中间件。默认值为 `true`.
- `shouldPromptWordLengthInput: boolean`
  - 是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。默认值为 `true`.
- `shouldPromptForWordLengthOnNonClassicStart: boolean`
  - 是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。默认值为 `false`.
- `imageType: "png" | "jpeg" | "webp"`
  - 发送的图片类型。默认值为 `"png"`.
- `isTextToImageConversionEnabled: boolean`
  - 是否开启将文本转为图片的功能（可选），如需启用，需要启用 `markdownToImage` 服务。默认值为 `false`.

## 🎳 游戏指令

以下是该插件提供的指令列表:

### 游戏操作

- `wordleGame.加入 [money:number]` - 加入游戏，可选参数为投入的货币数额。
- `wordleGame.退出` - 退出游戏，只能在游戏未开始时使用。
- `wordleGame.结束` - 结束游戏，只能在游戏已开始时使用。

### 游戏模式

- `wordleGame.开始 [guessWordLength:number]` - 开始游戏引导，可选参数为猜单词的长度。
- `wordleGame.开始.经典` - 开始经典猜单词游戏，需要投入货币，赢了有奖励。
- `wordleGame.开始.CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL [guessWordLength:number]` -
  开始猜不同考试/类别的单词游戏，可选参数为猜单词的长度。

### 游戏操作

- `wordleGame.猜 [inputWord:text]` - 猜单词，参数为输入的单词。

### 数据查询

- `wordleGame.查询玩家记录 [targetUser:text]` - 查询玩家记录，可选参数为目标玩家的 at 信息。
- `wordleGame.排行榜 [number:number]` - 查看排行榜，可选参数为排行榜的人数。
- `wordleGame.排行榜.损益/总.胜场/总.输场/经典/CET4/CET6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL.胜场/输场 [number:number]` -
  查看不同模式的玩家排行榜，可选参数为排行榜的人数。

## 🍰 致谢

- [Koishi](https：//koishi.chat/) - 机器人框架
- [Akisa](https：//forum.koishi.xyz/u/akisa/summary) - Akisa 大人我爱你 💕
- [Wordle](https：//www.nytimes.com/games/wordle/index.html) - 原版 Wordle 游戏网页样式
- [nonebot-plugin-wordle](https：//github.com/noneplugin/nonebot-plugin-wordle) - Nonebot Wordle 的词典

## ✨ License

MIT License © 2024
