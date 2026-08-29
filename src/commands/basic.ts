import { h } from "koishi";
import type { GameContext } from "../context";
import { updateNameInPlayerRecord } from "../services/database";
import { sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";

// 注册基础指令：帮助、玩法介绍。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordleGame 帮助
  ctx.command("wordleGame", "猜单词游戏帮助").action(async ({ session }) => {
    let { userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    await session.execute(`wordleGame -h`);
  });

  // wordleGame.玩法介绍
  ctx.command("wordleGame.玩法介绍", "游戏玩法介绍").action(async ({ session }) => {
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
