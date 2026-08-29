koishi-plugin-wordle-game
=========================

[<img alt="github" src="https://img.shields.io/badge/github-araea/wordle_game-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-wordle-game)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-wordle-game.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-wordle-game)

Koishi 的 Wordle | 汉兜 | 词影 | Numberle | Math | Lewdle 游戏插件。

- [Wordle](https://www.nytimes.com/games/wordle/index.html)
- [汉兜](https://handle.antfu.me/)
- [词影](https://cy.surprising.studio/)
- [Numberle](https://dduarte.github.io/numberle/)
- [Math](https://numberle.org/)
- [Lewdle](https://www.lewdlegame.com/App)

## 使用

1. 启用 `monetary`、`database`、`puppeteer` 服务。
2. 设置指令别名。
3. `wordleGame.开始` 引导开局，然后直接输入猜测词。

## 注意事项

- 成语报未知错误时，检查 `data/wordleGame/idioms.json` 的拼音。
- 汉兜遇到词库里没有的四字词，会走配置「拼音接口设置」里的 OpenAI 兼容接口；留空则不发请求，只提示手动补全。
- 词影模式有细分排行榜，`help` 可查。
- 可在 `idioms.json` 自行加词（如「原神启动」），注意 JSON 末项无逗号。

## 指令

### `wordleGame.开始 [待猜词长度]`

开始游戏引导。

#### `wordleGame.开始.<模式> [待猜词长度]`

可用模式：`经典`、`CET4/6`、`GMAT`、`GRE`、`IELTS`、`SAT`、`TOEFL`、`考研`、`专八/四`、`ALL`、`Lewdle`、`Numberle`、`Math`、`汉兜`、`词影`。

通用选项：

- `--hard` 困难：绿色线索保持固定，黄色线索必须再用。词影模式下提高匹配难度。
- `--uhard` 超困难：基于困难。黄色线索必须离位，灰色线索不得再用。
- `--absurd` 荒谬：尽量少给信息，甚至可能更换秘密词。[玩法参考](https://qntm.org/absurdle)
- `--challenge` 挑战：从一个给定目标词反向推导秘密词。[玩法参考](https://qntm.org/challenge)
- `--wordles <数量>` 同时猜多个词，默认 1 ~ 4，可配置。

汉兜与词影：

- `--free` 任意四字词都可作猜测。
- `--all` 词库扩到 29766+（含生僻字）。关掉时用 7208 个常用成语。

经典模式和汉兜模式可投入货币，获胜有奖励。多种难度可同时开。

### `wordleGame.猜 <猜测内容>`

猜单词、成语等。`-r` 随机猜一次。

## 示例

<!-- markdownlint-disable MD033 -->
<details>
<summary>点击展开/折叠</summary>

- **经典模式**
    ![经典模式](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/dd55af6e-f38d-4f95-9bed-9d6ba967c429)
- **汉兜模式**
    ![汉兜模式](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/d968f7fe-544b-4d29-a825-8ae59109a50b)
- **词影模式**
    ![词影模式1](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/b11d911b-f534-4800-aef6-e42ef184803c)
    ![词影模式2](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/45810d3f-732e-4338-9351-b21f4dd9a814)
- **方程式模式**
    ![方程式模式](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/b792df4b-baa2-4453-83f6-6fb58784b921)
- **游戏引导**
    ![游戏引导](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/80bb3c2b-d41c-44e0-8a4d-acd1845c1644)
- **进度查询**
    ![进度查询](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/65e28147-feef-4794-bbbb-9565c65cae36)
- **多开模式**
    ![多开模式](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/86db4fcf-9a6f-4b15-8c50-6f2d7ea017e3)
- **拼音速查**
    ![拼音速查](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/669c625a-9360-4d88-a0ec-01103e82d9f4)
- **查单词 (英译中/英译英)**
    ![英译中](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/c1913df7-1e1a-4324-a228-ed1679e4e330)
    ![英译英](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/18f7806e-641c-4135-8255-73e139e7e427)
- **查成语**
    ![查成语](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/76f88dd3-e0b1-48d4-bac7-6cafb0d996c7)
- **玩家记录**
    ![玩家记录](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/a14dd774-4148-4a0e-b7bc-deab8180c919)
- **单词查找器**
    ![单词查找器](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/4bad2757-8b49-4e39-b2b3-a311e6cfc08f)
- **排行榜**
    ![排行榜](https://github.com/araea/koishi-plugin-wordle-game/assets/120614554/9d87c34f-353c-49ed-a885-5ac8128dbd4a)

</details>
<!-- markdownlint-enable MD033 -->

## 致谢

- [Koishi](https://koishi.chat/)
- ly、麦神等朋友
- [Akisa](https://forum.koishi.xyz/u/akisa/summary)
- [汉典](https://www.zdic.net/)
- [百度汉语](https://hanyu.baidu.com/)
- [WordFinder](https://wordword.org/)
- [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)
- [Wordle](https://www.nytimes.com/games/wordle/index.html)
- [汉兜](https://handle.antfu.me/)
- [词影](https://cy.surprising.studio/)
- [Numberle (dduarte)](https://dduarte.github.io/numberle/)
- [Numberle (numberle.org)](https://numberle.org/)
- [LewdleGame](https://www.lewdlegame.com/App)
- [WordlePlay](https://wordleplay.com/wordle-games)
- [koishi-plugin-wordle](https://www.npmjs.com/package/koishi-plugin-wordle)
- [nonebot-plugin-wordle](https://github.com/noneplugin/nonebot-plugin-wordle)
- [Wordle 2315 words list](https://gist.github.com/DevilXD/6ad6cc1fe37872d069a795edd51233b2#file-wordle_words-txt)

## QQ 群

- 956758505

<br>

#### License

<sup>
Licensed under either of <a href="LICENSE-APACHE">Apache License, Version
2.0</a> or <a href="LICENSE-MIT">MIT license</a> at your option.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be dual licensed as above, without any additional terms or conditions.
</sub>
