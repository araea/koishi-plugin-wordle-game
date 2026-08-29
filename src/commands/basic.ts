import { h, RuntimeError } from "koishi";
import type { GameContext } from "../context";
import { updateNameInPlayerRecord } from "../services/database";
import { sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";

// 注册基础指令：帮助、玩法介绍、改名。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordleGame 帮助
  ctx.command("wordleGame", "猜单词游戏帮助").action(async ({ session }) => {
    let { userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    if (g.isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
      return await sendMessage(
        g,
        session,
        `📋 猜单词游戏
可用：改名 / 玩法介绍 / 排行榜 / 查询玩家记录 / 开始游戏`,
        `改名 玩法介绍 排行榜 查询玩家记录 开始游戏`,
        3
      );
    }
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
      h.image(g.data.introductionImgBuffer, `image/${config.imageType}`),
      ``
    );
  });

  // wordleGame.改名
  ctx
    .command("wordleGame.改名 [newPlayerName:text]", "更改玩家名字")
    .action(async ({ session }, newPlayerName) => {
      const { userId } = session;
      const username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);

      newPlayerName = newPlayerName?.trim();
      if (!newPlayerName) {
        return sendMessage(g, session, `⚠️ 请输入新的玩家名字。`, `改名`);
      }

      if (
        !(
          config.isEnableQQOfficialRobotMarkdownTemplate &&
          session.platform === "qq" &&
          config.key &&
          config.customTemplateId
        )
      ) {
        return sendMessage(
          g,
          session,
          `⚠️ 不是 QQ 官方机器人，无需改名。`,
          `改名`
        );
      }

      if (newPlayerName.length > 20) {
        return sendMessage(g, session, `⚠️ 新的玩家名字过长，请重新输入。`, `改名`);
      }

      if (newPlayerName.includes("@everyone")) {
        return sendMessage(g, session, `⚠️ 新的玩家名字不合法，请重新输入。`, `改名`);
      }

      if (config.isUsingUnifiedKoishiBuiltInUsername) {
        return handleUnifiedKoishiUsername(g, session, newPlayerName);
      } else {
        return handleCustomUsername(g, session, userId, newPlayerName);
      }
    });
}

// 使用统一的 Koishi 内置用户名改名。
async function handleUnifiedKoishiUsername(
  g: GameContext,
  session,
  newPlayerName
) {
  newPlayerName = h
    .transform(newPlayerName, { text: true, default: false })
    .trim();

  const users = await g.ctx.database.get("user", {});
  if (users.some((user) => user.name === newPlayerName)) {
    return sendMessage(g, session, `新的玩家名字已经存在，请重新输入。`, `改名`);
  }

  try {
    session.user.name = newPlayerName;
    await session.user.$update();
    return sendMessage(
      g,
      session,
      `玩家名字已更改为：【${newPlayerName}】`,
      `查询玩家记录 开始游戏 改名`,
      2
    );
  } catch (error) {
    if (RuntimeError.check(error, "duplicate-entry")) {
      return sendMessage(
        g,
        session,
        `新的玩家名字已经存在，请重新输入。`,
        `改名`
      );
    } else {
      g.logger.warn(error);
      return sendMessage(g, session, `玩家名字更改失败。`, `改名`);
    }
  }
}

// 使用玩家记录表中的自定义用户名改名。
async function handleCustomUsername(
  g: GameContext,
  session,
  userId,
  newPlayerName
) {
  const players = await g.ctx.database.get("wordle_player_records", {});
  if (players.some((player) => player.username === newPlayerName)) {
    return sendMessage(g, session, `新的玩家名字已经存在，请重新输入。`, `改名`);
  }

  const userRecord = await g.ctx.database.get("wordle_player_records", {
    userId,
  });
  if (userRecord.length === 0) {
    await g.ctx.database.create("wordle_player_records", {
      userId,
      username: newPlayerName,
    });
  } else {
    await g.ctx.database.set(
      "wordle_player_records",
      { userId },
      { username: newPlayerName }
    );
  }
  return await sendMessage(
    g,
    session,
    `玩家名字已更改为：【${newPlayerName}】`,
    `查询玩家记录 开始游戏 改名`,
    2
  );
}
