import { imageMessage } from '../services/renderer'
import { h } from "koishi";
import { helpOf } from "../help";
import type { GameContext } from "../context";
import { updateNameInPlayerRecord } from "../services/database";
import { sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";

// 注册基础指令：帮助、玩法介绍。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordle 帮助；旧主指令继续作为兼容别名。
  ctx.command("wordle", "猜单词 · 多词库多模式")
    .alias("wordleGame")
    .action(async ({ session }) => {
      const { title, entries } = helpOf(
        session,
        "wordle",
        ["开始", "猜", "查询进度", "结束", "排行榜", "战绩", "查单词", "查成语", "拼音速查表", "玩法介绍"].map(
          (name) => `wordle.${name}`,
        ),
      );
      return await sendMessage(
        g,
        session,
        [
          title,
          ...entries.map(({ name, description }) => `　${name}　${description}`),
          "发送「wordle.开始」开局，之后直接发送猜测词即可。",
        ].join("\n"),
      );
    });

  // wordle.玩法介绍
  ctx.command("wordle.玩法介绍", "查看玩法介绍").action(async ({ session }) => {
    let { userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    return sendMessage(
      g,
      session,
      '玩法：发送「wordle.开始」选择词库，再发送「wordle.猜 单词」。\n每次猜测会标记：✓ 字符与位置均正确；↔ 答案含该字符但位置不符；× 不包含（重复字符按数量判断）。\n「wordle.查询进度」查看已知线索；「wordle.拼音速查表」查看汉兜拼音；「wordle.结束」结束本局。'
    );
  });
}
