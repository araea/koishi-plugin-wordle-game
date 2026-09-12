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
    .command("wordle.查单词 [targetWord:text]", "查单词引导")
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
        `当前可用词库如下：\n${availableDictionaryArray
          .map((dictionary, index) => `${index + 1}. ${dictionary}`)
          .join("\n")}\n请输入序号或词库名。`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效或超时。`
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
          `⚠️ 输入无效，请重新输入。`
        );
      }
    });

  // wordle.查单词.ALL
  ctx
    .command(
      "wordle.查单词.ALL [targetWord:text]",
      "在ALL词库中查询单词释义（英译中）"
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
          `⚠️ 请输入待查询的单词，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找单词。`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入包含非字母字符，请重新输入。`
        );
      }

      // 寻找
      const foundWord = findWord(targetWord);
      if (!foundWord) {
        return await sendMessage(
          g,
          session,
          `⚠️ 未在 ALL 词库中找到该单词。`
        );
      }
      return sendMessage(
        g,
        session,
        `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(
          foundWord.translation
        )}`
      );
    });

  // wordle.查单词.WordWord
  ctx
    .command(
      "wordle.查单词.WordWord [targetWord:text]",
      "在WordWord中查找单词定义（英译英）"
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
          `⚠️ 请输入待查找的单词，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找单词。`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入包含非字母字符，请重新输入。`
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
                : `- 该单词定义暂未收录。`
            }`
          );
        })
        .catch((error) => {
          return sendMessage(
            g,
            session,
            `⚠️ 未在 WordWord 中找到该单词。`
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
          `⚠️ 请输入待查找的成语，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找成语。`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 请输入四字词语。`
        );
      }
      // 寻找
      const idiomInfo = await getIdiomInfo(g, targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          g,
          session,
          `⚠️ 未在汉典中找到该成语。`
        );
      }
      return await sendMessage(
        g,
        session,
        `【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n【解释】${idiomInfo.explanation}`
      );
    });

  // wordle.查询玩家记录
  ctx
    .command("wordle.查询玩家记录 [targetUser:text]", "查询玩家记录")
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
          `⚠️ 被查询对象没有任何游戏记录。`
        );
      }

      const { win, lose, wordGuessCount, stats, fastestGuessTime } =
        targetUserRecord[0];

      const queryInfo = `📋 查询对象：${targetUserRecord[0].username}
猜出次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
详细统计信息如下：
${generateStatsInfo(stats, fastestGuessTime)}
    `;

      return sendMessage(g, session, queryInfo);
    });
}
