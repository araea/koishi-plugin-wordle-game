# koishi-plugin-wordle-game

多模式猜词游戏

## 安装

```sh
yarn add koishi-plugin-wordle-game
```

在 Koishi 配置中启用，并提供 database 与 puppeteer 服务。

## 指令

| 指令 | 说明 |
| --- | --- |
| `wordle.开始 [长度]` | 开始引导 |
| `wordle.开始.<模式> [长度]` | 指定模式开局 |
| `wordle.猜 <内容>` | 提交猜测 |
| `wordle.查询进度` | 查询当前游戏进度 |
| `wordle.结束` | 结束游戏 |
| `wordle.排行榜 [人数]` | 查看排行榜 |
| `wordle.战绩 [@某人]` | 查询玩家记录 |
| `wordle.查单词 <词>` | 查单词引导 |
| `wordle.查成语 <成语>` | 查询成语的拼音与解释（汉典） |
| `wordle.拼音速查表` | 查看拼音速查表 |
| `wordle.玩法介绍` | 游戏玩法介绍 |

模式包括经典、汉兜、词影、Numberle、Math、Lewdle 及其他词库。

可用选项：`--hard`、`--uhard`、`--absurd`、`--challenge`、`--wordles`、`--free`、`--all`。

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。
