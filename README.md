# 猜单词

Koishi 插件：猜词游戏，支持单词、成语、数字与方程式等多种模式

[![GitHub](https://img.shields.io/badge/GitHub-araea%2Fkoishi--plugin--wordle--game-181717?logo=github&logoColor=white)](https://github.com/araea/koishi-plugin-wordle-game)
[![npm](https://img.shields.io/npm/v/koishi-plugin-wordle-game?logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/koishi-plugin-wordle-game)

## 安装

```sh
npm i koishi-plugin-wordle-game
```

启用插件，并安装 `database` 与 `puppeteer` 服务。

## 快速使用

发送 `wordle.开始` 选择模式开局，之后直接发送猜测词即可续猜（默认开启 `enableDirectInput`）。

| 指令 | 说明 |
| --- | --- |
| `wordle.开始 [长度]` | 开始模式选择 |
| `wordle.开始.<模式> [长度]` | 指定模式开局 |
| `wordle.猜 <内容>` | 提交猜测 |
| `wordle.查询进度` | 查看当前进度 |
| `wordle.结束` | 结束游戏 |
| `wordle.排行榜 [人数]` | 查看排行榜 |
| `wordle.战绩 [@某人]` | 查询玩家记录 |
| `wordle.查单词 <词>` | 查询单词并开始引导 |
| `wordle.查成语 <成语>` | 查询拼音和释义（汉典） |
| `wordle.拼音速查表` | 查看拼音速查表 |
| `wordle.玩法介绍` | 查看玩法 |

模式包括经典、汉兜、词影、Numberle、Math 与 Lewdle 等。部分模式支持 `--hard`、`--uhard`、`--absurd`、`--challenge`、`--wordles`、`--free` 和 `--all` 选项。

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `isDarkThemeEnabled` | boolean | `false` | 使用黑暗主题 |
| `isHighContrastThemeEnabled` | boolean | `false` | 使用高对比度主题，为色觉障碍准备 |
| `compositeImagePageWidth` | number | `800` | 多词合成图的页面宽度（像素） |
| `compositeImagePageHeight` | number | `100` | 多词合成图的页面高度（像素） |
| `maxSimultaneousGuesses` | number | `4` | 同时猜测的单词数量上限 |
| `defaultMaxLeaderboardEntries` | number | `10` | 排行榜默认显示的人数 |
| `defaultWordLengthForGuessing` | number | `5` | 非经典模式下默认的猜测长度 |
| `enableDirectInput` | boolean | `true` | 对局中直接发送猜测词即可续猜 |
| `isPreventUserDuplicateGuessInput` | boolean | `true` | 拦截重复提交的猜测词 |
| `shouldPromptWordLengthInput` | boolean | `true` | 引导式开局时追问一次单词长度 |
| `shouldPromptForWordLengthOnNonClassicStart` | boolean | `true` | 非经典模式开局时追问一次单词长度 |
| `enableWordGuessTimeLimit` | boolean | `false` | 给每次作答加上时间限制 |
| `wordGuessTimeLimitInSeconds` | number | `120` | 每次作答的时间限制（秒） |
| `retractDelay` | number | `0` | 自动撤回延迟（秒），0 表示不撤回 |
| `imageType` | `png` / `jpeg` / `webp` | `png` | 发送的图片格式 |

## 限制 / 风险

需要 `database` 服务保存战绩，以及 `puppeteer` 服务渲染图片。

`wordle.查成语` 依赖外部汉典数据，拼音查询依赖配置的拼音 API。

## 链接

- [设计系统](DESIGN_SYSTEM.md)
- [更新日志](CHANGELOG.md)
- [MIT](LICENSE-MIT) / [Apache-2.0](LICENSE-APACHE)
