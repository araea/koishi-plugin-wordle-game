import { load } from "cheerio";
import { h } from "koishi";
import type { GameContext } from "../context";
import { defaultPinyinsHtml } from "../html/template";
import { generateImageTags } from "../html/tiles";
import { getGameInfo, getGameInfo2, processExtraGameInfos, updateNameInPlayerRecord } from "../services/database";
import { sendMessage } from "../services/message";
import { generateHandlePinyinsImage, generateWordlesImage } from "../services/renderer";
import { getSessionUserName } from "../services/user";
import { removeIndexFromPinyins } from "../utils/pinyin";
import { calculateGameDuration } from "../utils/time";

// 注册进度类指令：查询进度、拼音速查表。
export function register(g: GameContext) {
  const { ctx, config } = g;

  // wordleGame.查询进度
  ctx.command("wordleGame.查询进度", "查询当前游戏进度").action(async ({ session }) => {
    let { channelId, userId, username, timestamp } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    const gameInfo = await getGameInfo(g, channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await sendMessage(
        g,
        session,
        `【@${username}】\n游戏还没开始呢~\n开始后再来查询进度吧！`,
        `改名 开始游戏`
      );
    }
    // 返回信息
    const {
      correctLetters,
      presentLetters,
      isHardMode,
      gameMode,
      guessWordLength,
      absentLetters,
      isAbsurd,
      isChallengeMode,
      targetWord,
      wordlesNum,
      isUltraHardMode,
      presentLettersWithIndex,
      correctPinyinsWithIndex,
      presentPinyins,
      presentPinyinsWithIndex,
      absentPinyins,
      absentTones,
      presentTonesWithIndex,
      correctTonesWithIndex,
      presentTones,
    } = gameInfo;
    const usernameMention = `【@${username}】`;
    const inputLengthMessage = `待猜${
      gameMode === "汉兜" || gameMode === "词影"
        ? "词语"
        : gameMode === "Numberle"
        ? "数字"
        : gameMode === "Math"
        ? "数学方程式"
        : "单词"
    }的长度为：【${guessWordLength}】`;
    const extraGameInfo =
      wordlesNum > 1
        ? `\n${await processExtraGameInfos(g, channelId)}`
        : "";
    const gameDuration = calculateGameDuration(
      Number(gameInfo.timestamp),
      timestamp
    );
    const progressInfo = `当前${gameDuration}\n当前进度：【${correctLetters.join(
      ""
    )}】`;

    const presentInfo =
      presentLetters.length !== 0 ? `\n包含：【${presentLetters}】` : "";
    const absentInfo =
      absentLetters.length !== 0 ? `\n不包含：【${absentLetters}】` : "";
    const presentWithIndexInfo =
      presentLettersWithIndex.length !== 0
        ? `\n位置排除：【${presentLettersWithIndex.join(", ")}】`
        : "";

    const pinyinsCorrectInfo =
      correctPinyinsWithIndex.length !== 0
        ? `\n正确拼音：【${correctPinyinsWithIndex.join(", ")}】`
        : "";
    const pinyinsPresentInfo =
      presentPinyins.length !== 0
        ? `\n包含拼音：【${presentPinyins.join(", ")}】`
        : "";
    const pinyinsAbsentInfo =
      absentPinyins.length !== 0
        ? `\n不包含拼音：【${absentPinyins.join(", ")}】`
        : "";
    const pinyinsPresentWithIndexInfo =
      presentPinyinsWithIndex.length !== 0
        ? `\n拼音位置排除：【${presentPinyinsWithIndex.join(", ")}】`
        : "";

    const tonesCorrectInfo =
      correctTonesWithIndex.length !== 0
        ? `\n正确声调：【${correctTonesWithIndex.join(", ")}】`
        : "";
    const tonesPresentInfo =
      presentTones.length !== 0
        ? `\n包含声调：【${presentTones.join(", ")}】`
        : "";
    const tonesAbsentInfo =
      absentTones.length !== 0
        ? `\n不包含声调：【${absentTones.join(", ")}】`
        : "";
    const tonesPresentWithIndexInfo =
      presentTonesWithIndex.length !== 0
        ? `\n声调位置排除：【${presentTonesWithIndex.join(", ")}】`
        : "";

    const progressMessage = `${progressInfo}${presentInfo}${absentInfo}${presentWithIndexInfo}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}${extraGameInfo}`;

    const timeDifferenceInSeconds =
      (timestamp - Number(gameInfo.timestamp)) / 1000;
    let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${
      wordlesNum > 1 ? `（x${wordlesNum}）` : ""
    }${isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""}${
      isAbsurd ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""
    }】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ""}`;
    if (config.enableWordGuessTimeLimit) {
      message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
    }
    message += `\n${inputLengthMessage}\n${progressMessage}`;

    return await sendMessage(g, session, message, `猜测`);
  });

  // wordleGame.拼音速查表
  ctx.command("wordleGame.拼音速查表", "查看拼音速查表").action(async ({ session }) => {
    let { channelId, userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    let gameInfo: any = await getGameInfo(g, channelId);

    if (!gameInfo.isStarted || gameInfo.gameMode !== "汉兜") {
      const imageBuffer = await generateHandlePinyinsImage(
        g,
        defaultPinyinsHtml
      );
      return sendMessage(
        g,
        session,
        h.image(imageBuffer, `image/${config.imageType}`),
        ``
      );
    }
    const wordlesNum = gameInfo.wordlesNum;
    let imageBuffers: Buffer[] = [];
    let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
    for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
      if (wordleIndex > 1) {
        gameInfo = await getGameInfo2(g, channelId, wordleIndex);
      }
      const { presentPinyins, correctPinyinsWithIndex, absentPinyins } =
        gameInfo;
      const correctPinyins: string[] = removeIndexFromPinyins(
        correctPinyinsWithIndex
      );
      if (gameInfo.gameMode === "汉兜") {
        const $ = load(defaultPinyinsHtml);

        $("div").each((index, element) => {
          const text = $(element).text();
          if (correctPinyins.includes(text)) {
            $(element).attr("class", "text-ok");
          } else if (presentPinyins.includes(text)) {
            $(element).attr("class", "text-mis");
          } else if (absentPinyins.includes(text)) {
            $(element).attr("class", "op30");
          }
        });

        const modifiedHTML = $.html();
        imageBuffer = await generateHandlePinyinsImage(g, modifiedHTML);
      }
      imageBuffers.push(imageBuffer);
    }
    if (wordlesNum > 1) {
      const htmlImgString = generateImageTags(imageBuffers);
      imageBuffer = await generateWordlesImage(g, htmlImgString);
    }
    return sendMessage(
      g,
      session,
      h.image(imageBuffer, `image/${config.imageType}`),
      ``
    );
  });
}
