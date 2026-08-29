import { noop } from "koishi";
import { rankType, rankType2, rankType4 } from "../constants";
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
import { getSessionUserName } from "../services/user";

// 注册排行榜相关指令。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordleGame.排行榜（引导）
  ctx
    .command("wordleGame.排行榜 [number:number]", "查看排行榜")
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }

        await sendMessage(
          g,
          session,
          `${
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
              ? ``
              : `当前可查看排行榜如下：
${rankType.map((type, index) => `${index + 1}. ${type}`).join("\n")}`
          }
请输入要查看的【排行榜名】${
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
              ? ``
              : `或【序号】`
          }：`,
          `总 损益 猜出次数 经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`
        );

        const userInput = await session.prompt();
        if (!userInput)
          return sendMessage(g, session, `⚠️ 输入无效或超时。`, `排行榜`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (
          !isNaN(userInputNumber) &&
          userInputNumber > 0 &&
          userInputNumber <= rankType.length
        ) {
          const rankName = rankType[userInputNumber - 1];
          await session.execute(`wordleGame.排行榜.${rankName} ${number}`);
        } else if (rankType.includes(userInput)) {
          await session.execute(`wordleGame.排行榜.${userInput} ${number}`);
        } else {
          return sendMessage(g, session, `⚠️ 输入无效，请重新输入。`, `排行榜`);
        }
      }
    );

  // wordleGame.排行榜.<type>（二级引导）
  rankType2.forEach((type) => {
    ctx
      .command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(
        async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
          let { username, userId } = session;
          username = await getSessionUserName(g, session);
          await updateNameInPlayerRecord(g, session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
          }
          let rankType3: string[];
          if (type === "总") {
            rankType3 = ["胜场", "输场"];
          } else if (type === "词影") {
            rankType3 = ["猜出次数", "胜场", "输场", "最快用时"];
          } else {
            rankType3 = ["胜场", "输场", "最快用时"];
          }
          await sendMessage(
            g,
            session,
            `${
              g.isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
                ? ``
                : `当前可查看排行榜如下：
${rankType3.map((type, index) => `${index + 1}. ${type}`).join("\n")}`
            }
请输入要查看的【类型名】${
              g.isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
                ? ``
                : `或【序号】`
            }：`,
            rankType3.join(" ")
          );

          const userInput = await session.prompt();
          if (!userInput)
            return sendMessage(g, session, `⚠️ 输入无效或超时。`, `排行榜`);

          // 处理用户输入
          const userInputNumber = parseInt(userInput);
          if (
            !isNaN(userInputNumber) &&
            userInputNumber > 0 &&
            userInputNumber <= rankType3.length
          ) {
            const rankName = rankType3[userInputNumber - 1];
            await session.execute(
              `wordleGame.排行榜.${type}.${rankName} ${number}`
            );
          } else if (rankType3.includes(userInput)) {
            await session.execute(
              `wordleGame.排行榜.${type}.${userInput} ${number}`
            );
          } else {
            return sendMessage(g, session, `⚠️ 输入无效，请重新输入。`, `排行榜`);
          }
        }
      );
  });

  // wordleGame.排行榜.损益
  ctx
    .command("wordleGame.排行榜.损益 [number:number]", "查看玩家损益排行榜")
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }
        return await getLeaderboard(
          g,
          session,
          "moneyChange",
          "moneyChange",
          "玩家损益排行榜",
          number
        );
      }
    );

  // wordleGame.排行榜.猜出次数
  ctx
    .command(
      "wordleGame.排行榜.猜出次数 [number:number]",
      "查看玩家猜出次数排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }
        return await getLeaderboard(
          g,
          session,
          "wordGuessCount",
          "wordGuessCount",
          "玩家猜出次数排行榜",
          number
        );
      }
    );

  // wordleGame.排行榜.总.胜场
  ctx
    .command(
      "wordleGame.排行榜.总.胜场 [number:number]",
      "查看玩家总胜场排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }
        return await getLeaderboard(
          g,
          session,
          "win",
          "win",
          "玩家总胜场排行榜",
          number
        );
      }
    );

  // wordleGame.排行榜.总.输场
  ctx
    .command(
      "wordleGame.排行榜.总.输场 [number:number]",
      "查看玩家总输场排行榜"
    )
    .action(
      async ({ session }, number = config.defaultMaxLeaderboardEntries) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }
        return await getLeaderboard(
          g,
          session,
          "lose",
          "lose",
          "查看玩家总输场排行榜",
          number
        );
      }
    );

  // 注册胜场、输场、用时排行榜指令
  rankType4.forEach((type) => {
    ctx
      .command(
        `wordleGame.排行榜.${type}.胜场 [number:number]`,
        `查看${type}胜场排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { username, userId } = session;
          username = await getSessionUserName(g, session);
          await updateNameInPlayerRecord(g, session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
          }
          if (
            type === "词影" &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              g,
              session,
              `特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                g,
                session,
                `⚠️ 词影多猜测排行榜范围应在 1 ~ 4 之间。`,
                `开始游戏 排行榜`
              );
            }
            return await getWinCountLeaderboardForCiying(
              g,
              session,
              options.wordles,
              `玩家胜场排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }
          return await sendMessage(
            g,
            session,
            await getLeaderboardWinOrLose(g, type, number, "win", "胜场"),
            `开始游戏 排行榜`
          );
        }
      );

    ctx
      .command(
        `wordleGame.排行榜.${type}.输场 [number:number]`,
        `查看${type}输场排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { username, userId } = session;
          username = await getSessionUserName(g, session);
          await updateNameInPlayerRecord(g, session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
          }
          if (
            type === "词影" &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              g,
              session,
              `特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                g,
                session,
                `⚠️ 词影多猜测排行榜范围应在 1 ~ 4 之间。`,
                `开始游戏 排行榜`
              );
            }
            return await getLoseCountLeaderboardForCiying(
              g,
              session,
              options.wordles,
              `玩家输场排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }
          return await sendMessage(
            g,
            session,
            await getLeaderboardWinOrLose(g, type, number, "lose", "输场"),
            `开始游戏 排行榜`
          );
        }
      );

    ctx
      .command(
        `wordleGame.排行榜.${type}.最快用时 [number:number]`,
        `查看${type}最快用时排行榜`
      )
      .option("hard", "--hard 查看困难模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 查看多猜测模式", {
        fallback: 0,
      })
      .action(
        async (
          { session, options },
          number = config.defaultMaxLeaderboardEntries
        ) => {
          let { username, userId } = session;
          username = await getSessionUserName(g, session);
          await updateNameInPlayerRecord(g, session, userId, username);
          if (typeof number !== "number" || isNaN(number) || number < 0) {
            return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
          }
          if (
            type === "词影" &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
            let numberOfMessageButtonsPerRow = 4;
            await sendMessage(
              g,
              session,
              `特定游戏模式（可多选）：`,
              markdownCommands,
              numberOfMessageButtonsPerRow
            );

            const userInput = await session.prompt();

            if (!userInput) {
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`,
                `改名 排行榜`
              );
            }

            const modes = {
              困难: "hard",
            };

            for (const mode of Object.keys(modes)) {
              if (userInput.includes(mode)) {
                options[modes[mode]] = true;
              }
            }

            const wordlesMap = {
              x1: 1,
              x2: 2,
              x3: 3,
              x4: 4,
            };

            for (const wordle of Object.keys(wordlesMap)) {
              if (userInput.includes(wordle)) {
                options.wordles = wordlesMap[wordle];
              }
            }

            if (userInput.includes(`跳过`)) {
              noop();
            }
          }
          if (
            (type === "词影" && options.wordles !== 0) ||
            (type === "词影" && options.hard)
          ) {
            if (options.wordles === 0) {
              options.wordles = 1;
            }
            if (
              typeof options.wordles !== "number" ||
              options.wordles < 1 ||
              options.wordles > 4
            ) {
              return await sendMessage(
                g,
                session,
                `⚠️ 词影多猜测排行榜范围应在 1 ~ 4 之间。`,
                `开始游戏 排行榜`
              );
            }
            return await getFastestGuessTimeLeaderboardForCiying(
              g,
              session,
              options.wordles,
              `玩家最快用时排行榜（词影 x${options.wordles}${
                options.hard && options.wordles === 1 ? "（困难）" : ""
              }）`,
              number,
              options.hard
            );
          }

          return await sendMessage(
            g,
            session,
            await getLeaderboardFastestGuessTime(g, type, number),
            `开始游戏 排行榜`
          );
        }
      );
  });

  // wordleGame.排行榜.词影.猜出次数
  ctx
    .command(
      "wordleGame.排行榜.词影.猜出次数 [number:number]",
      "查看玩家猜出次数排行榜（词影）"
    )
    .option("hard", "--hard 查看困难模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 查看多猜测模式", {
      fallback: 1,
    })
    .action(
      async (
        { session, options },
        number = config.defaultMaxLeaderboardEntries
      ) => {
        let { username, userId } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        if (typeof number !== "number" || isNaN(number) || number < 0) {
          return "⚠️ 请输入不小于 0 的数字作为排行榜人数。";
        }
        if (
          g.isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          let markdownCommands = `x1 x2 x3 x4 困难 跳过`;
          let numberOfMessageButtonsPerRow = 4;
          await sendMessage(
            g,
            session,
            `特定游戏模式（可多选）：`,
            markdownCommands,
            numberOfMessageButtonsPerRow
          );

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(
              g,
              session,
              `⚠️ 输入无效或超时。`,
              `改名 排行榜`
            );
          }

          const modes = {
            困难: "hard",
          };

          for (const mode of Object.keys(modes)) {
            if (userInput.includes(mode)) {
              options[modes[mode]] = true;
            }
          }

          const wordlesMap = {
            x1: 1,
            x2: 2,
            x3: 3,
            x4: 4,
          };

          for (const wordle of Object.keys(wordlesMap)) {
            if (userInput.includes(wordle)) {
              options.wordles = wordlesMap[wordle];
            }
          }

          if (userInput.includes(`跳过`)) {
            noop();
          }
        }
        if (
          typeof options.wordles !== "number" ||
          options.wordles < 1 ||
          options.wordles > 4
        ) {
          return await sendMessage(
            g,
            session,
            `⚠️ 词影多猜测排行榜范围应在 1 ~ 4 之间。`,
            `开始游戏 排行榜`
          );
        }
        return await getCiyingSuccessCountLeaderboardForCiying(
          g,
          session,
          options.wordles,
          "successCount",
          `玩家猜出次数排行榜（词影 x${options.wordles}${
            options.hard && options.wordles === 1 ? "（困难）" : ""
          }）`,
          number,
          options.hard
        );
      }
    );
}
