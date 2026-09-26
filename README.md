# 猜单词

Koishi 猜词插件，包含多种词库和游戏模式。

## 安装

```sh
yarn add koishi-plugin-wordle-game
```

在 Koishi 中启用，并安装 `database` 与 `puppeteer` 服务。

## 指令

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

模式包括经典、汉兜、词影、Numberle、Math 和 Lewdle 等。部分模式支持 `--hard`、`--uhard`、`--absurd`、`--challenge`、`--wordles`、`--free` 和 `--all` 选项。

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。
