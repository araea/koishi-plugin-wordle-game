# koishi-plugin-wordle-game

[<img alt="github" src="https://img.shields.io/badge/github-araea/wordle_game-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-wordle-game)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-wordle-game.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-wordle-game)

Koishi 的 [Wordle](https://www.nytimes.com/games/wordle/index.html) | [汉兜](https://handle.antfu.me/) | [词影](https://cy.surprising.studio/) | [Numberle](https://dduarte.github.io/numberle/) | [Math](https://numberle.org/) | [Lewdle](https://www.lewdlegame.com/App) 游戏插件。

## 使用

1. 启用 `monetary`，`database` 和 `puppeteer` 服务。
2. 设置指令别名。
3. 输入 `wordleGame.开始` 指令引导游戏模式。
4. 输入猜测词。

## 注意事项

- 输入成语出现未知错误时，可前往 `data/wordleGame/idioms.json` 文件中搜索该成语，查看是否存在拼音的错误。

## 特性

- 词影有细分模式的排行榜，可自行使用 `help` 探索。
- 可自行在 `idioms.json` 中添加成语，例如“原神启动”，注意格式即可（注意：JSON 格式最后一项不需要逗号）。

## 关键指令

- `wordleGame.开始 [待猜词的长度]`
  - 开始游戏引导。

- `wordleGame.开始.经典/CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle/Numberle/Math/汉兜/词影 [待猜词的长度]`
  - 经典模式和汉兜模式，输加入指令可投入货币，赢了有奖励。
    - `--hard`
      - 困难模式，绿色线索必须保特固定，黄色线索必须重复使用。在词影模式下，将提高匹配难度。
    - `--uhard`
      - 超困难模式，在困难模式的基础上，黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。
    - `--absurd`
      - 在这种模式下，你将面对一个极具挑战性的对手。
      - 荒谬/变态模式，AI 将尽量避免给出答案。
      - 每次猜测时都会尽可能少地透露信息，甚至可能更换秘密词。
      - [如何玩？](https://qntm.org/absurdle)
    - `--challenge`
      - 仅建议高级玩家尝试。
      - 荒谬/变态挑战模式，要求你从一个给定的目标词出发，通过某种方式使其变成秘密词。
      - [如何玩？](https://qntm.org/challenge)
    - `--wordles <多开的数量>`
      - 同时猜测多个，默认范围为 1 ~ 4。可自行配置。
    - `--free`
      - 汉兜&词影的自由模式，任意四字词语都可作为猜测词。
    - `--all`
      - 汉兜&词影的全成语模式。开启时，词语数量为 29766+ 个（含生僻字，极难）；关闭时，为 7208 个常用成语（义务教育）。
    - 可同时启用困难模式和变态模式。

- `wordleGame.猜 [inputWord:text]` - 猜单词|成语|...，参数为输入的词。
  - `-r`
    - 随机猜测一次。

## 测试图

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

## 致谢

- [Koishi](https://koishi.chat/) - 机器人框架
- ly、麦神等朋友的纠错&反馈
- [Akisa](https://forum.koishi.xyz/u/akisa/summary) - Akisa 大人
- [汉典](https://www.zdic.net/) - 查找成语
- [汉兜](https://handle.antfu.me/) - 汉兜游戏样式
- [百度汉语](https://hanyu.baidu.com/) - 查找成语
- [WordFinder](https://wordword.org/) - 单词查找
- [Numberle](https://dduarte.github.io/numberle/) - 数字猜测游戏
- [词影](https://cy.surprising.studio/) - 词影游戏代码与样式
- [Numberle](https://numberle.org/) - 数学方程式猜测游戏
- [Wordle](https://www.nytimes.com/games/wordle/index.html) - 原版 Wordle 游戏网页样式
- [LewdleGame](https://www.lewdlegame.com/App) - Lewdle 模式单词列表
- [WordlePlay](https://wordleplay.com/wordle-games) - 拓展玩法/单词列表补充
- [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) - 英汉语词典数据库
- [koishi-plugin-wordle](https://www.npmjs.com/package/koishi-plugin-wordle) - Wordle 经典模式词典
- [nonebot-plugin-wordle](https://github.com/noneplugin/nonebot-plugin-wordle) - Nonebot Wordle 的词典
- [Wordle 2315 words list](https://gist.github.com/DevilXD/6ad6cc1fe37872d069a795edd51233b2#file-wordle_words-txt) - 经典 Wordle 单词列表

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
