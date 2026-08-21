import type { GameContext } from "../context";

// 获取会话用户在当前上下文中的显示名。
// 在 QQ 官方机器人 Markdown 模板场景下，优先使用统一的 Koishi 内置用户名，
// 否则读取玩家记录表中保存的自定义名。
export async function getSessionUserName(
  g: GameContext,
  session: any
): Promise<string> {
  let sessionUserName = session.username;

  if (g.isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
    const [user] = await g.ctx.database.get("user", { id: session.user.id });
    if (g.config.isUsingUnifiedKoishiBuiltInUsername && user.name) {
      sessionUserName = user.name;
    } else {
      let userRecord = await g.ctx.database.get("wordle_player_records", {
        userId: session.userId,
      });

      if (userRecord.length === 0) {
        await g.ctx.database.create("wordle_player_records", {
          userId: session.userId,
          username: sessionUserName,
        });

        userRecord = await g.ctx.database.get("wordle_player_records", {
          userId: session.userId,
        });
      }
      sessionUserName = userRecord[0].username;
    }
  }

  return sessionUserName;
}
