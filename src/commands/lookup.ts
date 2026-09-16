import type { GameContext } from "../context";
import type { PlayerRecord } from "../types";
import { updateNameInPlayerRecord } from "../services/database";
import {
  fetchWordDefinitions,
  getIdiomInfo,
  serializeDefinitions,
} from "../services/network";
import { replaceAtTags, sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";
import { isFourCharacterIdiom } from "../utils/idiom";
import { capitalizeFirstLetter, replaceEscapeCharacters } from "../utils/string";
import { findWord, generateStatsInfo } from "../utils/wordle";

// 注册查询类指令：查单词、查成语、查询玩家记录。
export function register(g: GameContext) {
  const { ctx } = g;

  // wordle.查单词（引导）
  ctx
    .command("wordle.查单词 [targetWord:text]", "引导式查单词")
    .action(async ({ session, options }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      // 提示输入
      const availableDictionaryArray = ["ALL", "WordWord"];
      const availableDictionaryArrayToLowerCase = availableDictionaryArray.map(
        (word) => word.toLowerCase()
      );
      await sendMessage(
        g,
        session,
        `💡 可用词库\n${availableDictionaryArray
          .map((dictionary, index) => `${index + 1}. ${dictionary}`)
          .join("\n")}\n发送序号或词库名即可查询。`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⏳ 没有等到有效输入，这次先作罢。`
        );
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput))
        ? userInput.toLowerCase().trim()
        : availableDictionaryArrayToLowerCase[parseInt(userInput) - 1];
      if (availableDictionaryArrayToLowerCase.includes(selectedDictionary)) {
        const command = `wordle.查单词.${selectedDictionary}${
          targetWord ? ` ${targetWord}` : ""
        }`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          g,
          session,
          `⚠️ 认不出这一项\n发送上面列出的序号或名称。`
        );
      }
    });

  // wordle.查单词.ALL
  ctx
    .command(
      "wordle.查单词.ALL [targetWord:text]",
      "在 ALL 词库查释义（英译中）"
    )
    .action(async ({ session }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(
          g,
          session,
          `💡 发送要查询的单词，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⏳ 没有等到有效输入，这次先作罢。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消这次查询。`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 查询词里有非字母字符\n只用 A-Z 再试一次。`
        );
      }

      // 寻找
      const foundWord = findWord(targetWord);
      if (!foundWord) {
        return await sendMessage(
          g,
          session,
          `⚠️ ALL 词库里没有这个单词\n换一个拼写试试，或发送「wordle.查单词」换个词库。`
        );
      }
      return sendMessage(
        g,
        session,
        `📋 ${targetWord}\n${replaceEscapeCharacters(
          foundWord.translation
        )}`
      );
    });

  // wordle.查单词.WordWord
  ctx
    .command(
      "wordle.查单词.WordWord [targetWord:text]",
      "在 WordWord 查定义（英译英）"
    )
    .action(async ({ session }, targetWord) => {
      if (
        !targetWord &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (/^[a-zA-Z]+$/.test(session.event.message.quote.content.trim())) {
          targetWord = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(
          g,
          session,
          `💡 发送要查询的单词，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⏳ 没有等到有效输入，这次先作罢。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消这次查询。`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 查询词里有非字母字符\n只用 A-Z 再试一次。`
        );
      }

      // 寻找
      fetchWordDefinitions(g, targetWord)
        .then((responseData) => {
          const definitions = responseData.word.definitions;
          const serializedDefinitions = serializeDefinitions(definitions);
          return sendMessage(
            g,
            session,
            `${capitalizeFirstLetter(targetWord)} Definitions: \n${
              serializedDefinitions
                ? serializedDefinitions
                : `• 这个单词的定义暂未收录。`
            }`
          );
        })
        .catch((error) => {
          return sendMessage(
            g,
            session,
            `⚠️ WordWord 里没有这个单词\n换一个拼写试试，或发送「wordle.查单词」换个词库。`
          );
        });
    });

  // wordle.查成语
  ctx
    .command("wordle.查成语 [targetIdiom:text]", "查询成语的拼音与解释（汉典）")
    .action(async ({ session }, targetIdiom) => {
      if (
        !targetIdiom &&
        session.event.message.quote &&
        session.event.message.quote.content
      ) {
        if (isFourCharacterIdiom(session.event.message.quote.content.trim())) {
          targetIdiom = session.event.message.quote.content.trim();
        }
      }
      let { userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(
          g,
          session,
          `💡 发送要查询的成语，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⏳ 没有等到有效输入，这次先作罢。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消这次查询。`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 这里只收四字词语。`
        );
      }
      // 寻找
      const idiomInfo = await getIdiomInfo(g, targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          g,
          session,
          `⚠️ 汉典里查不到这个成语，换一个试试。`
        );
      }
      return await sendMessage(
        g,
        session,
        `📋 ${targetIdiom}\n拼音 ${idiomInfo.pinyin}\n解释 ${idiomInfo.explanation}`
      );
    });

  // wordle.查询玩家记录
  ctx
    .command("wordle.查询玩家记录 [targetUser:text]", "查询玩家战绩")
    .action(async ({ session }, targetUser) => {
      let { userId, username } = session;
      const originalUserId = userId;
      username = await getSessionUserName(g, session);
      const sessionUserName = username;
      await updateNameInPlayerRecord(g, session, userId, username);

      let targetUserRecord: PlayerRecord[] = [];
      if (!targetUser) {
        targetUserRecord = await ctx.database.get("wordle_player_records", {
          userId,
        });
      } else {
        targetUser = await replaceAtTags(session, targetUser);
        const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
        const match = targetUser.match(userIdRegex);
        userId = match?.[1] ?? userId;
        username = match?.[2] ?? username;
        if (originalUserId === userId) {
          targetUserRecord = await ctx.database.get("wordle_player_records", {
            userId: targetUser,
          });
        } else {
          targetUserRecord = await ctx.database.get("wordle_player_records", {
            userId,
          });
        }

      }

      if (targetUserRecord.length === 0) {
        return sendMessage(
          g,
          session,
          `📋 这个用户还没有游戏记录。\n发送「wordle.开始」开一局，记录就有了。`
        );
      }

      const { win, lose, wordGuessCount, stats, fastestGuessTime } =
        targetUserRecord[0];

      const queryInfo = `📋 ${targetUserRecord[0].username} 的战绩
猜出 ${wordGuessCount} 次 · 胜 ${win} 场 · 负 ${lose} 场

${generateStatsInfo(stats, fastestGuessTime)}`;

      return sendMessage(g, session, queryInfo);
    });
}
