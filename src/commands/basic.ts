import { h } from "koishi";
import type { GameContext } from "../context";
import { updateNameInPlayerRecord } from "../services/database";
import { sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";

// 注册基础指令：帮助、玩法介绍。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordle 帮助；旧主指令继续作为兼容别名。
  ctx.command("wordle", "猜单词游戏帮助")
    .alias("wordleGame")
    .action(async ({ session }) => {
      let { userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      await session.execute(`wordle -h`);
    });

  // wordle.玩法介绍
  ctx.command("wordle.玩法介绍", "游戏玩法介绍").action(async ({ session }) => {
    let { userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    return sendMessage(
      g,
      session,
      h.image(g.data.introductionImgBuffer, `image/${config.imageType}`)
    );
  });
}
