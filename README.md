# koishi-plugin-wordle-game

多模式猜词游戏插件。

## 安装

~~~sh
yarn add koishi-plugin-wordle-game
~~~

在 Koishi 配置中启用 koishi-plugin-wordle-game，并提供 monetary、database 和 puppeteer 服务。

## 指令

| 指令 | 说明 |
| --- | --- |
| wordle.开始 [长度] | 开始引导 |
| wordle.开始.&lt;模式&gt; [长度] | 指定模式开局 |
| wordle.猜 &lt;内容&gt; | 提交猜测 |

模式包括经典、汉兜、词影、Numberle、Math、Lewdle 及其他词库。
可用选项：--hard、--uhard、--absurd、--challenge、--wordles、--free、--all。

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。
