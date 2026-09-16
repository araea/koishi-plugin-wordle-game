import { rankType, rankType2 } from "../constants";
import type { GameContext } from "../context";
import { updateNameInPlayerRecord } from "../services/database";
import {
  getCiyingSuccessCountLeaderboardForCiying,
  getFastestGuessTimeLeaderboardForCiying,
  getLeaderboard,
  getLeaderboardFastestGuessTime,
  getLeaderboardWinOrLose,
  getLoseCountLeaderboardForCiying,
  getWinCountLeaderboardForCiying,
} from "../services/leaderboard";
import { sendMessage } from "../services/message";
import { renderPanel } from "../services/renderer";
import { getSessionUserName } from "../services/user";

// 每个类型可查看的维度：「总」没有用时榜，词影多一个猜出次数。
function dimensionsOf(type: string): string[] {
  if (type === "总") return ["胜场", "输场"];
  if (type === "词影") return ["猜出次数", "胜场", "输场", "最快用时"];
  return ["胜场", "输场", "最快用时"];
}

// 注册排行榜相关指令。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordle.排行榜（引导）
  ctx
    .command("wordle.排行榜 [count:posint]", "查看排行榜")
    .action(
      async ({ session }, count = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);

        // 十九项列出来长过五行，出图；渲染不可用时回退成同一份清单
        const listPanel = await renderPanel(
          g,
          rankType.map((item, index) => ({
            lead: String(index + 1),
            name: item,
          }))
        );
        const listText = rankType
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n");

        await sendMessage(
          g,
          session,
          `💡 可查看的排行榜\n${
            listPanel ?? listText
          }\n发送序号或排行榜名即可查看，或发送「取消」。`
        );

        const userInput = await session.prompt();
        if (!userInput)
          return sendMessage(g, session, `⏳ 没有等到有效输入，这次先作罢。`);
        if (userInput.trim() === "取消")
          return sendMessage(g, session, `✅ 已取消。`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (
          !isNaN(userInputNumber) &&
          userInputNumber > 0 &&
          userInputNumber <= rankType.length
        ) {
          const rankName = rankType[userInputNumber - 1];
          await session.execute(`wordle.排行榜.${rankName} ${count}`);
        } else if (rankType.includes(userInput)) {
          await session.execute(`wordle.排行榜.${userInput} ${count}`);
        } else {
          return sendMessage(g, session, `⚠️ 认不出这一项\n发送上面列出的序号或名称。`);
        }
      }
    );

  // wordle.排行榜.猜出次数
  ctx
    .command(
      "wordle.排行榜.猜出次数 [count:posint]",
      "查看玩家猜出次数排行榜"
    )
    .action(
      async ({ session }, count = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        return await getLeaderboard(
          g,
          session,
          "wordGuessCount",
          "玩家猜出次数排行榜",
          count
        );
      }
    );

  // wordle.排行榜.<类型>：人数是位置参数，维度缺省时把选项摆出来
  rankType2.forEach((type) => {
    const dimensions = dimensionsOf(type);

    ctx
      .command(
        `wordle.排行榜.${type} [count:posint] [dimension:string]`,
        `查看${type}排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          count = config.defaultMaxLeaderboardEntries,
          dimension
        ) => {
          let { username, userId } = session;
          username = await getSessionUserName(g, session);
          await updateNameInPlayerRecord(g, session, userId, username);

          // 维度缺省时先问一次
          if (!dimension) {
            await sendMessage(
              g,
              session,
              `💡 可查看的类型
${dimensions.map((item, index) => `${index + 1}. ${item}`).join("\n")}
发送序号或类型名即可查看，或发送「取消」。`
            );

            const userInput = await session.prompt();
            if (!userInput)
              return sendMessage(
                g,
                session,
                `⏳ 没有等到有效输入，这次先作罢。`
              );
            if (userInput.trim() === "取消")
              return sendMessage(g, session, `✅ 已取消。`);

            const userInputNumber = parseInt(userInput);
            dimension =
              !isNaN(userInputNumber) &&
              userInputNumber > 0 &&
              userInputNumber <= dimensions.length
                ? dimensions[userInputNumber - 1]
                : dimensions.includes(userInput.trim())
                ? userInput.trim()
                : "";
            if (!dimension)
              return sendMessage(
                g,
                session,
                `⚠️ 认不出这一项\n发送上面列出的序号或名称。`
              );
          }

          // 直接写在指令里的维度也过一遍校验，拼错了不至于落到别的榜
          if (!dimensions.includes(dimension)) {
            return sendMessage(
              g,
              session,
              `⚠️ 认不出这一项\n发送上面列出的序号或名称。`
            );
          }

          // 词影的榜可以按同时猜测的词数细分，未指定时走通用榜
          if (type === "词影") {
            const wordlesNum =
              options.wordles === 0 ? 1 : options.wordles;
            if (
              dimension === "猜出次数" ||
              options.wordles !== 0 ||
              options.hard
            ) {
              if (
                typeof wordlesNum !== "number" ||
                wordlesNum < 1 ||
                wordlesNum > 4
              ) {
                return await sendMessage(
                  g,
                  session,
                  `⚠️ 词影多猜测排行榜的范围是 1 到 4。`
                );
              }
              const suffix = `（词影 x${wordlesNum}${
                options.hard && wordlesNum === 1 ? "（困难）" : ""
              }）`;
              if (dimension === "猜出次数")
                return await getCiyingSuccessCountLeaderboardForCiying(
                  g,
                  session,
                  wordlesNum,
                  "successCount",
                  `玩家猜出次数排行榜${suffix}`,
                  count,
                  options.hard
                );
              if (dimension === "胜场")
                return await getWinCountLeaderboardForCiying(
                  g,
                  session,
                  wordlesNum,
                  `玩家胜场排行榜${suffix}`,
                  count,
                  options.hard
                );
              if (dimension === "输场")
                return await getLoseCountLeaderboardForCiying(
                  g,
                  session,
                  wordlesNum,
                  `玩家输场排行榜${suffix}`,
                  count,
                  options.hard
                );
              return await getFastestGuessTimeLeaderboardForCiying(
                g,
                session,
                wordlesNum,
                `玩家最快用时排行榜${suffix}`,
                count,
                options.hard
              );
            }
          }

          if (dimension === "胜场")
            return await getLeaderboardWinOrLose(
              g,
              session,
              type,
              count,
              "win",
              "胜场"
            );
          if (dimension === "输场")
            return await getLeaderboardWinOrLose(
              g,
              session,
              type,
              count,
              "lose",
              "输场"
            );
          return await getLeaderboardFastestGuessTime(g, session, type, count);
        }
      );
  });
}
