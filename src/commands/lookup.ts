import type { GameContext } from "../context";
import type { PlayerRecord } from "../types";
import { getGameInfo, getGameInfo2, updateNameInPlayerRecord } from "../services/database";
import {
  fetchAndParseWords,
  fetchWordDefinitions,
  getIdiomInfo,
  getIdiomInfo2,
  serializeDefinitions,
} from "../services/network";
import { replaceAtTags, sendMessage } from "../services/message";
import { getSessionUserName } from "../services/user";
import { isFourCharacterIdiom } from "../utils/idiom";
import { capitalizeFirstLetter, replaceEscapeCharacters } from "../utils/string";
import { findWord, generateStatsInfo } from "../utils/wordle";

// 注册查询类指令：查单词、查成语、单词查找器。
export function register(g: GameContext) {
  const { ctx } = g;

  // wordleGame.查单词（引导）
  ctx
    .command("wordleGame.查单词 [targetWord:text]", "查单词引导")
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
          .join("\n")}\n请输入序号或词库名。`,
        `ALL WordWord`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效或超时。`,
          `查单词`
        );
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput))
        ? userInput.toLowerCase().trim()
        : availableDictionaryArrayToLowerCase[parseInt(userInput) - 1];
      if (availableDictionaryArrayToLowerCase.includes(selectedDictionary)) {
        const command = `wordleGame.查单词.${selectedDictionary}${
          targetWord ? ` ${targetWord}` : ""
        }`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效，请重新输入。`,
          `查单词`
        );
      }
    });

  // wordleGame.查单词.ALL
  ctx
    .command(
      "wordleGame.查单词.ALL [targetWord:text]",
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
          `⚠️ 请输入待查询的单词，或发送「取消」。`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`,
            `查单词`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找单词。`,
            `查单词`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入包含非字母字符，请重新输入。`,
          `查单词`
        );
      }

      // 寻找
      const foundWord = findWord(targetWord);
      if (!foundWord) {
        return await sendMessage(
          g,
          session,
          `⚠️ 未在 ALL 词库中找到该单词。`,
          `查单词`
        );
      }
      return sendMessage(
        g,
        session,
        `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(
          foundWord.translation
        )}`,
        `查单词`
      );
    });

  // wordleGame.查单词.WordWord
  ctx
    .command(
      "wordleGame.查单词.WordWord [targetWord:text]",
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
          `⚠️ 请输入待查找的单词，或发送「取消」。`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`,
            `查单词`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找单词。`,
            `查单词`
          );
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入包含非字母字符，请重新输入。`,
          `查单词`
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
            }`,
            `查单词`
          );
        })
        .catch((error) => {
          return sendMessage(
            g,
            session,
            `⚠️ 未在 WordWord 中找到该单词。`,
            `查单词`
          );
        });
    });

  // wordleGame.查成语（引导）
  ctx
    .command("wordleGame.查成语 [targetIdiom:text]", "查成语引导")
    .action(async ({ session, options }, targetIdiom) => {
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
      // 提示输入
      const availableDictionaryArray = ["百度汉语", "汉典"];
      await sendMessage(
        g,
        session,
        `当前可用词库如下：\n${availableDictionaryArray
          .map((dictionary, index) => `${index + 1}. ${dictionary}`)
          .join("\n")}\n请输入序号或词库名。`,
        `百度汉语 汉典`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效或超时。`,
          `查成语`
        );
      // 判断 userInput 是否为有效输入
      const selectedDictionary = isNaN(parseInt(userInput))
        ? userInput.trim()
        : availableDictionaryArray[parseInt(userInput) - 1];
      if (availableDictionaryArray.includes(selectedDictionary)) {
        const command = `wordleGame.查成语.${selectedDictionary}${
          targetIdiom ? ` ${targetIdiom}` : ""
        }`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效，请重新输入。`,
          `查成语`
        );
      }
    });

  // wordleGame.查成语.百度汉语
  ctx
    .command(
      "wordleGame.查成语.百度汉语 [targetIdiom:text]",
      "在百度汉语中查找成语解释"
    )
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
          `⚠️ 请输入待查找的成语，或发送「取消」。`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`,
            `查成语`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找成语。`,
            `查成语`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 请输入四字词语。`,
          `查成语`
        );
      }

      // 寻找
      const idiomInfo = await getIdiomInfo(g, targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          g,
          session,
          `⚠️ 未在百度汉语中找到该成语。`,
          `查成语`
        );
      }
      return await sendMessage(
        g,
        session,
        `【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n【解释】${idiomInfo.explanation}`,
        `查成语`
      );
    });

  // wordleGame.查成语.汉典
  ctx
    .command(
      "wordleGame.查成语.汉典 [targetIdiom:text]",
      "在汉典中查找成语解释"
    )
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
          `⚠️ 请输入待查找的成语，或发送「取消」。`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `⚠️ 输入无效或超时。`,
            `查成语`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `✅ 已取消查找成语。`,
            `查成语`
          );
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(
          g,
          session,
          `⚠️ 请输入四字词语。`,
          `查成语`
        );
      }
      // 寻找
      const idiomInfo = await getIdiomInfo2(g, targetIdiom);
      if (idiomInfo.pinyin === "未找到拼音") {
        return await sendMessage(
          g,
          session,
          `⚠️ 未在汉典中找到该成语。`,
          `查成语`
        );
      }
      return await sendMessage(
        g,
        session,
        `【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n${idiomInfo.explanation}`,
        `查成语`
      );
    });

  // wordleGame.单词查找器
  ctx
    .command(
      "wordleGame.单词查找器 [wordleIndexs:text]",
      "使用WordFinder查找匹配的单词"
    )
    .option("auto", "-a 自动查找（根据游戏进程）", { fallback: false })
    .option("wordLength", "-l <length> 指定要搜索的单词长度", {
      fallback: undefined,
    })
    .option(
      "wordWithThreeWildcards",
      "-w <word> 搜索带有最多三个通配符字符的单词",
      { fallback: undefined }
    )
    .option("containingLetters", "-c <letters> 搜索包含特定字母组合的单词", {
      fallback: undefined,
    })
    .option(
      "containingTheseLetters",
      "--ct <letters> 搜索只包含指定字母的单词",
      { fallback: undefined }
    )
    .option("withoutTheseLetters", "--wt <letters> 搜索不包含特定字母的单词", {
      fallback: undefined,
    })
    .option(
      "startingWithTheseLetters",
      "--sw <letters> 搜索以特定字母开头的单词",
      { fallback: undefined }
    )
    .option(
      "endingWithTheseLetters",
      "--ew <letters> 搜索以特定字母结尾的单词",
      { fallback: undefined }
    )
    .action(async ({ session, options }, wordleIndexs) => {
      let { channelId, username, userId } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);

      let {
        auto,
        wordLength,
        wordWithThreeWildcards,
        containingLetters,
        containingTheseLetters,
        withoutTheseLetters,
        startingWithTheseLetters,
        endingWithTheseLetters,
      } = options;

      if (auto) {
        const gameInfo = await getGameInfo(g, channelId);
        const {
          isStarted,
          wordlesNum,
          guessWordLength,
          absentLetters,
          presentLetters,
          gameMode,
        } = gameInfo;
        if (!isStarted) {
          return await sendMessage(
            g,
            session,
            `⚠️ 未检测到游戏进度，无法使用自动查找。`,
            `单词查找器`
          );
        }
        if (gameMode === "汉兜") {
          return await sendMessage(
            g,
            session,
            `⚠️ 单词查找器不能用于四字词语。`,
            `单词查找器`
          );
        }
        if (wordlesNum === 1) {
          await session.execute(
            `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
          );
        } else {
          let userInput: string = "";
          if (!wordleIndexs) {
            await sendMessage(
              g,
              session,
              `当前进度数量：${wordlesNum}。请输入待查询序号（从左到右，可用空格隔开，例如：1 2）。`,
              `单词查找器`
            );
            userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`,
                `单词查找器`
              );
          } else {
            userInput = wordleIndexs;
          }

          const stringArray = userInput.split(" ");

          for (const element of stringArray) {
            if (!isNaN(Number(element))) {
              const index = parseInt(element);
              if (index > 0 && index <= wordlesNum) {
                if (index === 1) {
                  await session.execute(
                    `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
                  );
                } else {
                  const gameInfo2 = await getGameInfo2(g, channelId, index);
                  const { guessWordLength, absentLetters, presentLetters } =
                    gameInfo2;
                  await session.execute(
                    `wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`
                  );
                }
              } else {
                await session.send(
                  `序号 ${index} 超出范围（1~${wordlesNum}）。`
                );
                continue;
              }
            } else {
              continue;
            }
          }
        }
      }

      if (auto) {
        return;
      }

      const noOptionsSpecified =
        !wordLength &&
        !wordWithThreeWildcards &&
        !containingLetters &&
        !containingTheseLetters &&
        !withoutTheseLetters &&
        !startingWithTheseLetters &&
        !endingWithTheseLetters;

      if (noOptionsSpecified) {
        const chineseTutorial =
          "欢迎使用单词查找器！\n你可以使用以下选项来搜索匹配的单词：\n- 使用 -a 自动查找（根据游戏进程）\n- 使用 -l <length> 指定要搜索的单词长度\n- 使用 -w <word> 搜索带有最多三个通配符字符的单词\n- 使用 -c <letters> 搜索包含特定字母组合的单词\n- 使用 --ct <letters> 搜索只包含指定字母的单词\n- 使用 --wt <letters> 搜索不包含特定字母的单词\n- 使用 --sw <letters> 搜索以特定字母开头的单词\n- 使用 --ew <letters> 搜索以特定字母结尾的单词";
        return await sendMessage(g, session, chineseTutorial, `单词查找器`);
      }

      const params = {
        wordLength: wordLength ? `${wordLength}-letter-words` : "",
        wordWithThreeWildcards: wordWithThreeWildcards
          ? `out-of-${wordWithThreeWildcards}`
          : "",
        containingLetters: containingLetters
          ? `containing-${containingLetters}`
          : "",
        containingTheseLetters: containingTheseLetters
          ? `with-${containingTheseLetters}`
          : "",
        withoutTheseLetters: withoutTheseLetters
          ? `without-${withoutTheseLetters}`
          : "",
        startingWithTheseLetters: startingWithTheseLetters
          ? `starting-with-${startingWithTheseLetters}`
          : "",
        endingWithTheseLetters: endingWithTheseLetters
          ? `ending-with-${endingWithTheseLetters}`
          : "",
      };

      const queryParams = Object.values(params)
        .filter((param) => param)
        .join("-");

      const url = `https://wordword.org/search/${queryParams}`;
      const result = await fetchAndParseWords(g, url);
      return await sendMessage(g, session, `${result}`, `单词查找器`);
    });

  // wordleGame.查询玩家记录
  ctx
    .command("wordleGame.查询玩家记录 [targetUser:text]", "查询玩家记录")
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
        if (
          g.isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          targetUserRecord = await ctx.database.get("wordle_player_records", {
            username: targetUser,
          });
          if (targetUserRecord.length === 0) {
            targetUserRecord = await ctx.database.get("wordle_player_records", {
              userId: targetUser,
            });
          }
        } else {
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
      }

      if (targetUserRecord.length === 0) {
        return sendMessage(
          g,
          session,
          `⚠️ 被查询对象没有任何游戏记录。`,
          `改名 查询玩家记录 开始游戏`,
          2
        );
      }

      const {
        win,
        lose,
        moneyChange,
        wordGuessCount,
        stats,
        fastestGuessTime,
      } = targetUserRecord[0];

      const queryInfo = `📋 查询对象：${targetUserRecord[0].username}
猜出次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
损益为：${moneyChange} 点
详细统计信息如下：
${generateStatsInfo(stats, fastestGuessTime)}
    `;

      return sendMessage(g, session, queryInfo, `改名 查询玩家记录 开始游戏`, 2);
    });
}
