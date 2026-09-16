import * as fs from "fs";
import { h } from "koishi";
import badWordsList from "../assets/Wordle/词汇/badWordsList.json";
import lowerCaseWordArray from "../assets/Wordle/词汇/lowerCaseWordArray.json";
import commonIdiomsList from "../assets/commonIdiomsList.json";
import { exams } from "../constants";
import type { GameContext } from "../context";
import type { PinyinItem2 } from "../types";
import {
  generateEmptyGridHtml,
  generateEmptyGridHtmlForCiying,
  generateEmptyGridHtmlForHandle,
  generateImageTags,
  generateLetterTilesHtml,
  generateLetterTilesHtmlForCiying,
  generateLetterTilesHtmlForHandle,
  generateStyledHtml,
} from "../html/tiles";
import {
  endGame,
  getGameInfo,
  getGameInfo2,
  isPlayerInGame,
  processExtraGameInfos,
  processExtraGameRecords,
  setGuessRunningStatus,
  updateNameInPlayerRecord,
  updatePlayerRecordsLose,
  updatePlayerRecordsWin,
} from "../services/database";
import {
  getIdiomInfo,
  getSelectedIdiom,
  sendPostRequestForAI,
} from "../services/network";
import { sendMessage } from "../services/message";
import {
  generateImage,
  generateImageForCiying,
  generateImageForHandle,
  generateWordlesImage,
  renderPanel,
} from "../services/renderer";
import { getSessionUserName } from "../services/user";
import {
  findIdiomByIdiom,
  getRandomIdiom,
  isFourCharacterIdiom,
  isIdiomInList,
} from "../utils/idiom";
import {
  mergeSameLetters,
  replaceEscapeCharacters,
  uniqueSortedLowercaseLetters,
} from "../utils/string";
import { calculateGameDuration } from "../utils/time";
import {
  checkAbsentLetters,
  checkPresentLettersWithIndex,
  checkStrokesData,
  generateNumberString,
  getRandomFromStringList,
  isMathEquationValid,
  isNumericString,
} from "../utils/validation";
import {
  extractLowerCaseWords,
  findLongestMatchedWords,
  findWord,
  generateGameEndMessage,
  getJsonFilePathAndWordCountByLength,
  getRandomWordTranslation,
  getValidGuessWordLengthRange,
  isValidGuessWordLength,
} from "../utils/wordle";

// 注册游戏核心指令：结束、开始（含各模式）、猜，以及无前缀猜测中间件。
export function register(g: GameContext) {
  const { ctx, config } = g;
  const idiomsList = g.data.idiomsList;
  const pinyinData = g.data.pinyinData;
  const equations = g.data.equations;

  // 无前缀猜测中间件：在游戏进行中，符合当前模式特征的输入自动作为猜测。
  ctx.middleware(async (session, next) => {
    let { channelId, content } = session;
    if (!config.enableDirectInput) {
      return await next();
    }

    if (content) {
      content = `${h.select(content, "text")}`.trim();
    }

    const gameInfo = await getGameInfo(g, channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await next();
    }
    // 判断输入
    if (gameInfo.gameMode === "汉兜" || gameInfo.gameMode === "词影") {
      if (!isFourCharacterIdiom(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === "Numberle") {
      if (!isNumericString(content)) {
        return await next();
      }
    } else if (gameInfo.gameMode === "Math") {
      if (!isMathEquationValid(content)) {
        return await next();
      }
    } else {
      if (!/^[a-zA-Z]+$/.test(content)) {
        return await next();
      }
    }

    if (content.length !== gameInfo.guessWordLength) {
      return await next();
    }

    await session.execute(`wordle.猜 ${content}`);
    return;
  });

  // wordle.结束
  ctx
    .command("wordle.结束", "结束当前对局")
    .userFields(["id", "name", "authority"])
    .action(async ({ session }) => {
      let { channelId, userId, username, timestamp } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (!gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `💡 本频道没有进行中的对局\n发送「wordle.开始」开一局。`
        );
      }
      // 破坏性操作：结束他人的对局会替全频道收摊，并改掉参与者的战绩
      if (
        gameInfo.startUserId &&
        gameInfo.startUserId !== userId &&
        (session.user?.authority ?? 0) < 2
      ) {
        return await sendMessage(
          g,
          session,
          `⚠️ 权限不够\n只有发起者或权限 2 以上的人能结束这一局。`
        );
      }
      // 玩家记录输
      await updatePlayerRecordsLose(g, channelId, gameInfo);
      // 结束
      const processedResult: string =
        gameInfo.wordlesNum > 1
          ? `\n${await processExtraGameRecords(g, channelId)}`
          : "";

      const duration = calculateGameDuration(
        Number(gameInfo.timestamp),
        timestamp
      );
      const message = `✅ 本局已结束\n${duration}${
        gameInfo.isAbsurd ? "" : `\n${generateGameEndMessage(gameInfo)}`
      }${processedResult}\n发送「wordle.开始」再来一局。`;
      await sendMessage(
        g,
        session,
        message
      );
      await endGame(g, channelId);
      return;
    });

  // wordle.开始
  ctx
    .command("wordle.开始 [guessWordLength:number]", "引导式开局")
    .option("hard", "--hard 困难模式", { fallback: false })
    .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
    .option("absurd", "--absurd 变态模式", { fallback: false })
    .option("challenge", "--challenge 变态挑战模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 同时猜测多个单词", {
      fallback: 1,
    })
    .action(async ({ session, options }, guessWordLength) => {
      let { channelId, userId, username } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      if (
        typeof options.wordles !== "number" ||
        options.wordles < 1 ||
        options.wordles > config.maxSimultaneousGuesses
      ) {
        return await sendMessage(
          g,
          session,
          `⚠️ 同时猜测的数量须在 1 到 ${config.maxSimultaneousGuesses} 之间。`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `⚠️ 本频道已有对局正在进行\n发送「wordle.结束」收掉这一局，再开新的。`
        );
      }
      // 提示输入：十七个模式列出来长过五行，出图；渲染不可用时回退成同一份清单
      const examPanel = await renderPanel(
        g,
        exams.map((exam, index) => ({ lead: String(index + 1), name: exam }))
      );
      const examList = exams
        .map((exam, index) => `${index + 1}. ${exam}`)
        .join("\n");
      await sendMessage(
        g,
        session,
        `💡 可选模式\n${
          examPanel ?? examList
        }\n发送序号或模式名即可开局，或发送「取消」。`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⏳ 没有等到有效输入，这次先作罢。`
        );
      if (userInput.trim() === "取消")
        return await sendMessage(g, session, `✅ 已取消开局。`);
      // 判断 userInput 是否为有效输入
      const selectedExam = isNaN(parseInt(userInput))
        ? userInput.toUpperCase().trim()
        : exams[parseInt(userInput) - 1].toUpperCase();
      const examsInUpperCase = exams.map((exam) => exam.toUpperCase());
      if (examsInUpperCase.includes(selectedExam)) {
        if (!guessWordLength) {
          if (
            config.shouldPromptWordLengthInput &&
            selectedExam !== "经典" &&
            selectedExam !== "LEWDLE" &&
            selectedExam !== "汉兜" &&
            selectedExam !== "词影"
          ) {
            await sendMessage(
              g,
              session,
              `💡 可选长度 ${getValidGuessWordLengthRange(
                selectedExam
              )}\n发送一个长度即可开局，或发送「取消」。`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `⏳ 没有等到有效输入，这次先作罢。`
              );
            if (userInput.trim() === "取消")
              return await sendMessage(g, session, `✅ 已取消开局。`);
            guessWordLength = parseInt(userInput);
          } else {
            guessWordLength = config.defaultWordLengthForGuessing;
          }
        }
        const hardOption = options.hard ? ` --hard` : "";
        const uhardOption = options.ultraHardMode ? ` --uhard` : "";
        const absurdOption = options.absurd ? ` --absurd` : "";
        const challengeOption = options.challenge ? ` --challenge` : "";
        const wordlesOption =
          options.wordles > 1 ? `--wordles ${options.wordles}` : "";
        const command = `wordle.开始.${selectedExam}${hardOption}${uhardOption}${absurdOption}${challengeOption}${wordlesOption} ${guessWordLength}`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          g,
          session,
          `⚠️ 认不出这个模式\n发送上面列出的序号或模式名。`
        );
      }
    });

  // wordle.开始.经典
  ctx
    .command("wordle.开始.经典", "以经典模式开局")
    .option("hard", "--hard 困难模式", { fallback: false })
    .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
    .option("absurd", "--absurd 变态模式", { fallback: false })
    .option("challenge", "--challenge 变态挑战模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 同时猜测多个单词", {
      fallback: 1,
    })
    .action(async ({ session, options }) => {
      let { channelId, userId, username, timestamp } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      
      if (
        typeof options.wordles !== "number" ||
        options.wordles < 1 ||
        options.wordles > config.maxSimultaneousGuesses
      ) {
        return await sendMessage(
          g,
          session,
          `⚠️ 同时猜测的数量须在 1 到 ${config.maxSimultaneousGuesses} 之间。`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `⚠️ 本频道已有对局正在进行\n发送「wordle.结束」收掉这一局，再开新的。`
        );
      }
      // 选待猜单词（随机选择一个单词并小写化）
      const selectedWords: string[] = [];
      const randomWord: string =
        lowerCaseWordArray[
          Math.floor(Math.random() * lowerCaseWordArray.length)
        ].toLowerCase();
      selectedWords.push(randomWord);

      let isHardMode = options.hard;
      let isUltraHardMode = options.ultraHardMode;
      let isChallengeMode = options.challenge;
      let isAbsurdMode = isChallengeMode ? true : options.absurd;
      const wordlesNum = options.wordles;
      if (isUltraHardMode) {
        isHardMode = true;
      }
      if (wordlesNum > 1) {
        isHardMode = false;
        isUltraHardMode = false;
        isChallengeMode = false;
        isAbsurdMode = false;
      }

      const correctLetters: string[] = new Array(5).fill("*");

      const foundWord = findWord(randomWord);

      await ctx.database.set(
        "wordle_game_records",
        { channelId },
        {
          isStarted: true,
          wordGuess: randomWord,
          wordAnswerChineseDefinition: replaceEscapeCharacters(
            foundWord.translation
          ),
          remainingGuessesCount: 6 + wordlesNum - 1,
          guessWordLength: 5,
          gameMode: "经典",
          startUserId: userId,
          timestamp: String(timestamp),
          isHardMode: isHardMode,
          isUltraHardMode,
          correctLetters: correctLetters,
          presentLetters: "",
          absentLetters: "",
          isAbsurd: isAbsurdMode,
          isChallengeMode: isChallengeMode,
          targetWord: randomWord,
          wordlesNum: wordlesNum,
          wordleIndex: 1,
        }
      );

      if (wordlesNum > 1) {
        let randomWordExtra: string = "";
        for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {
          while (selectedWords.length < wordleIndex) {
            randomWordExtra =
              lowerCaseWordArray[
                Math.floor(Math.random() * lowerCaseWordArray.length)
              ].toLowerCase();
            if (!selectedWords.includes(randomWordExtra)) {
              selectedWords.push(randomWordExtra);
            }
          }
          const foundWordExtra = findWord(randomWordExtra);
          await ctx.database.create("extra_wordle_game_records", {
            channelId,
            remainingGuessesCount: 6 + wordlesNum - 1,
            guessWordLength: 5,
            wordGuess: randomWordExtra,
            wordAnswerChineseDefinition: replaceEscapeCharacters(
              foundWordExtra.translation
            ),
            gameMode: "经典",
            timestamp: String(timestamp),
            correctLetters: correctLetters,
            presentLetters: "",
            absentLetters: "",
            wordlesNum: wordlesNum,
            wordleIndex,
          });
        }
      }
      // 游戏图
      const emptyGridHtml = isAbsurdMode
        ? generateEmptyGridHtml(1, 5)
        : generateEmptyGridHtml(6 + wordlesNum - 1, 5);
      const styledHtml = generateStyledHtml(6);
      let imageBuffer = await generateImage(g, styledHtml, emptyGridHtml);
      let imageBuffers: Buffer[] = [];
      if (wordlesNum > 1) {
        for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
          imageBuffers.push(imageBuffer);
        }
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(g, htmlImgString);
      }

      const gameMode = `经典${wordlesNum > 1 ? `（x${wordlesNum}）` : ""}${
        isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""
      }${isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""}`;
      const targetWord = isChallengeMode
        ? `\n目标单词 ${randomWord}`
        : "";
      const facts = [
        "单词长度 5",
        `机会 ${isAbsurdMode ? "无限" : `${6 + wordlesNum - 1}`} 次`,
        "候选 2315 个",
      ].join(" · ");
      const timeLimit = config.enableWordGuessTimeLimit
        ? `\n作答时间 ${config.wordGuessTimeLimitInSeconds} 秒`
        : "";
      const image = h.image(imageBuffer, `image/${config.imageType}`);

      const message = `✅ 对局开始 · ${gameMode}${
        isChallengeMode ? targetWord : ""
      }\n${facts}${timeLimit}\n${image}\n直接发送单词即可猜测。`;

      
      return await sendMessage(g, session, message);
    });

  // wordle.开始.<模式>（经典以外的所有模式）
  exams.forEach((exam) => {
    if (exam === "经典") {
      return;
    }
    ctx
      .command(
        `wordle.开始.${exam} [guessWordLength:number]`,
        `以${exam}模式开局`
      )
      .option("free", "--free 自由模式（仅限汉兜与词影）", {
        fallback: false,
      })
      .option("all", "--all 全成语模式（仅限汉兜与词影）", {
        fallback: false,
      })
      .option("hard", "--hard 困难模式", { fallback: false })
      .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
      .option("absurd", "--absurd 变态模式", { fallback: false })
      .option("challenge", "--challenge 变态挑战模式", { fallback: false })
      .option("wordles", "--wordles <value:number> 同时猜测多个词", {
        fallback: 1,
      })
      .action(async ({ session, options }, guessWordLength) => {
        let { channelId, userId, username, timestamp } = session;
        username = await getSessionUserName(g, session);
        await updateNameInPlayerRecord(g, session, userId, username);
        
        if (!guessWordLength) {
          if (
            config.shouldPromptForWordLengthOnNonClassicStart &&
            exam !== "Lewdle" &&
            exam !== "汉兜" &&
            exam !== "词影"
          ) {
            await sendMessage(
              g,
              session,
              `💡 可选长度 ${getValidGuessWordLengthRange(
                exam
              )}\n发送一个长度即可开局，或发送「取消」。`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `⏳ 没有等到有效输入，这次先作罢。`
              );
            if (userInput.trim() === "取消")
              return await sendMessage(g, session, `✅ 已取消开局。`);
            guessWordLength = parseInt(userInput);
          } else {
            guessWordLength = config.defaultWordLengthForGuessing;
          }
        }
        if (
          typeof options.wordles !== "number" ||
          options.wordles < 1 ||
          options.wordles > config.maxSimultaneousGuesses
        ) {
          return await sendMessage(
            g,
            session,
            `⚠️ 同时猜测的数量须在 1 到 ${config.maxSimultaneousGuesses} 之间。`
          );
        }

        // 判断输入
        if (
          typeof guessWordLength !== "number" ||
          (!isValidGuessWordLength(exam, guessWordLength) &&
            exam !== "Lewdle" &&
            exam !== "汉兜" &&
            exam !== "词影")
        ) {
          return await sendMessage(
            g,
            session,
            `⚠️ 长度不在可选范围内\n${exam} 的可选长度是 ${getValidGuessWordLengthRange(
              exam
            )}。`
          );
        }

        // 游戏状态
        const gameInfo = await getGameInfo(g, channelId);
        if (gameInfo.isStarted) {
          return await sendMessage(
            g,
            session,
            `⚠️ 本频道已有对局正在进行\n发送「wordle.结束」收掉这一局，再开新的。`
          );
        }

        const selectedWords: string[] = [];
        let randomWord: string = "";
        let translation: string = "";
        let wordCount: number = 0;
        let pinyin: string = "";
        if (exam === "Lewdle") {
          const randomLowerCaseWord = getRandomFromStringList(badWordsList);
          guessWordLength = randomLowerCaseWord.length;
          const foundWord = findWord(randomLowerCaseWord);
          randomWord = randomLowerCaseWord;
          translation = foundWord ? foundWord.translation : "";
        } else if (exam === "汉兜" || exam === "词影") {
          const randomIdiom = getRandomFromStringList(commonIdiomsList);
          let selectedIdiom;

          if (options.all) {
            selectedIdiom = getRandomIdiom(idiomsList);
          } else {
            selectedIdiom = await getSelectedIdiom(g, randomIdiom);
          }

          guessWordLength = 4;
          pinyin = selectedIdiom.pinyin;
          randomWord = options.all ? selectedIdiom.idiom : randomIdiom;
          translation = selectedIdiom.explanation;
        } else if (exam === "Numberle") {
          randomWord = generateNumberString(guessWordLength);
          translation = "";
        } else if (exam === "Math") {
          randomWord = getRandomFromStringList(equations[guessWordLength]);
          translation = "";
        } else {
          const result = getRandomWordTranslation(exam, guessWordLength);
          randomWord = result.word;
          translation = result.translation;
          wordCount = result.wordCount;
        }
        selectedWords.push(randomWord);
        let isFreeMode = options.free;
        let isHardMode = options.hard;
        let isUltraHardMode = options.ultraHardMode;
        let isChallengeMode = options.challenge;
        let isAbsurdMode = isChallengeMode ? true : options.absurd;
        const wordlesNum = options.wordles;
        if (isUltraHardMode) {
          isHardMode = true;
        }

        if (
          wordlesNum > 1 ||
          exam === "汉兜" ||
          exam === "Numberle" ||
          exam === "Math" ||
          exam === "词影"
        ) {
          isChallengeMode = false;
          isAbsurdMode = false;
        }

        const correctLetters: string[] = new Array(guessWordLength).fill("*");

        await ctx.database.set(
          "wordle_game_records",
          { channelId },
          {
            isStarted: true,
            wordGuess: randomWord,
            wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
            remainingGuessesCount:
              exam === "汉兜"
                ? 10 + wordlesNum - 1
                : exam === "Math" || exam === "词影"
                ? 6 + wordlesNum - 1
                : guessWordLength + 1 + wordlesNum - 1,
            guessWordLength,
            gameMode: exam,
            startUserId: userId,
            timestamp: String(timestamp),
            isHardMode: isHardMode,
            isUltraHardMode,
            correctLetters: correctLetters,
            presentLetters: "",
            absentLetters: "",
            isAbsurd: isAbsurdMode,
            isChallengeMode: isChallengeMode,
            targetWord: randomWord,
            wordlesNum: wordlesNum,
            wordleIndex: 1,
            pinyin,
            isFreeMode,
          }
        );

        if (wordlesNum > 1) {
          let randomWordExtra: string = "";
          let translation: string = "";
          let pinyin: string = "";
          for (
            let wordleIndex = 2;
            wordleIndex < wordlesNum + 1;
            wordleIndex++
          ) {
            while (selectedWords.length < wordleIndex) {
              if (exam === "Lewdle") {
                let randomLowerCaseWord =
                  getRandomFromStringList(badWordsList);
                while (randomLowerCaseWord.length !== guessWordLength) {
                  randomLowerCaseWord = getRandomFromStringList(badWordsList);
                }
                const foundWord = findWord(randomLowerCaseWord);
                randomWordExtra = randomLowerCaseWord;
                translation = foundWord ? foundWord.translation : "";
              } else if (exam === "汉兜" || exam === "词影") {
                const randomIdiom = getRandomFromStringList(commonIdiomsList);
                let selectedIdiom;

                if (options.all) {
                  selectedIdiom = getRandomIdiom(idiomsList);
                } else {
                  selectedIdiom = await getSelectedIdiom(g, randomIdiom);
                }

                guessWordLength = 4;
                pinyin = selectedIdiom.pinyin;
                randomWordExtra = options.all
                  ? selectedIdiom.idiom
                  : randomIdiom;
                translation = selectedIdiom.explanation;
              } else if (exam === "Numberle") {
                randomWordExtra = generateNumberString(guessWordLength);
                translation = "";
              } else if (exam === "Math") {
                randomWordExtra = getRandomFromStringList(
                  equations[guessWordLength]
                );
                translation = "";
              } else {
                const resultExtra = getRandomWordTranslation(
                  exam,
                  guessWordLength
                );
                translation = resultExtra.translation;
                randomWordExtra = resultExtra.word;
              }

              if (!selectedWords.includes(randomWordExtra)) {
                selectedWords.push(randomWordExtra);
              }
            }
            await ctx.database.create("extra_wordle_game_records", {
              channelId,
              remainingGuessesCount:
                exam === "汉兜"
                  ? 10 + wordlesNum - 1
                  : exam === "Math" || exam === "词影"
                  ? 6 + wordlesNum - 1
                  : guessWordLength + 1 + wordlesNum - 1,
              guessWordLength,
              wordGuess: randomWordExtra,
              wordAnswerChineseDefinition:
                replaceEscapeCharacters(translation),
              gameMode: exam,
              timestamp: String(timestamp),
              correctLetters: correctLetters,
              presentLetters: "",
              absentLetters: "",
              wordlesNum: wordlesNum,
              wordleIndex,
              pinyin,
            });
          }
        }
        // 生成并发送游戏图
        let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
        if (exam === "汉兜") {
          const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4);
          imageBuffer = await generateImageForHandle(g, emptyGridHtml);
        } else if (exam === "词影") {
          const emptyGridHtmlWithBorder = generateEmptyGridHtmlForCiying(
            1,
            4,
            true
          );
          const emptyGridHtml = generateEmptyGridHtmlForCiying(
            6 + wordlesNum - 1 - 1,
            4,
            false
          );
          imageBuffer = await generateImageForCiying(
            g,
            emptyGridHtmlWithBorder + emptyGridHtml,
            6 + wordlesNum - 1
          );
        } else {
          const emptyGridHtml = isAbsurdMode
            ? generateEmptyGridHtml(1, guessWordLength)
            : exam === "Math"
            ? generateEmptyGridHtml(6 + wordlesNum - 1, guessWordLength)
            : generateEmptyGridHtml(
                guessWordLength + 1 + wordlesNum - 1,
                guessWordLength
              );
          const styledHtml = generateStyledHtml(guessWordLength + 1);
          imageBuffer = await generateImage(g, styledHtml, emptyGridHtml);
        }

        let imageBuffers: Buffer[] = [];
        if (wordlesNum > 1) {
          for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
            imageBuffers.push(imageBuffer);
          }
          const htmlImgString = generateImageTags(imageBuffers);
          imageBuffer = await generateWordlesImage(g, htmlImgString);
        }

        const gameMode = `✅ 对局开始 · ${exam}${
          wordlesNum > 1 ? `（x${wordlesNum}）` : ""
        }${
          (isFreeMode && exam === "汉兜") || (isFreeMode && exam === "词影")
            ? `（自由）`
            : ""
        }${isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""}${
          isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""
        }`;
        const challengeInfo = isChallengeMode ? `\n目标单词 ${randomWord}` : "";
        // 各模式的猜测对象名称，用于拼出「长度 / 机会 / 候选」三项事实
        const subject =
          exam === "汉兜" || exam === "词影"
            ? "词语"
            : exam === "Numberle"
            ? "数字"
            : exam === "Math"
            ? "方程式"
            : "单词";
        const wordLength = `${subject}长度 ${guessWordLength}`;
        const guessChance = `机会 ${
          isAbsurdMode
            ? "无限"
            : exam === "汉兜"
            ? `${10 + wordlesNum - 1}`
            : exam === "Math"
            ? `${6 + wordlesNum - 1}`
            : exam === "词影"
            ? `${6 + wordlesNum - 1}`
            : guessWordLength + 1 + wordlesNum - 1
        } 次`;
        const wordCount2 =
          exam === "汉兜" || exam === "词影"
            ? `候选 ${
                options.all ? idiomsList.length : commonIdiomsList.length
              } 条`
            : exam === "Math"
            ? `候选 ${equations[guessWordLength].length} 个`
            : `候选 ${exam === "Lewdle" ? "1000" : wordCount} 个`;
        const timeLimit = config.enableWordGuessTimeLimit
          ? `\n作答时间 ${config.wordGuessTimeLimitInSeconds} 秒`
          : "";
        const image = h.image(imageBuffer, `image/${config.imageType}`);
        const tail = `\n直接发送${subject}即可猜测。`;

        if (exam === "汉兜" || exam === "词影") {
          return await sendMessage(
            g,
            session,
            `${gameMode}\n${[guessChance, wordCount2].join(" · ")}${timeLimit}\n${image}${tail}`
          );
        } else {
          return await sendMessage(
            g,
            session,
            `${gameMode}${challengeInfo}\n${[
              wordLength,
              guessChance,
              ...(exam === "Numberle" ? [] : [wordCount2]),
            ].join(" · ")}${timeLimit}\n${image}${tail}`
          );
        }
      });
  });

  // wordle.猜
  ctx
    .command("wordle.猜 [inputWord:text]", "做出一次猜测")
    .option("random", "-r 随机", { fallback: false })
    .action(async ({ session, options }, inputWord) => {
      let { channelId, userId, username, timestamp } = session;
      let gameInfo: any = await getGameInfo(g, channelId);
      inputWord = inputWord?.trim();

      if (gameInfo.isRunning === true) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⏳ 上一次猜测还在处理，稍等一下。`
        );
      }

      await setGuessRunningStatus(g, channelId, true);
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);

      if (!gameInfo.isStarted) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `💡 本频道没有进行中的对局\n发送「wordle.开始」开一局。`
        );
      }

      if (options.random) {
        inputWord =
          gameInfo.gameMode === "汉兜" || gameInfo.gameMode === "词影"
            ? getRandomIdiom(idiomsList).idiom
            : gameInfo.gameMode === "Numberle"
            ? generateNumberString(gameInfo.guessWordLength)
            : gameInfo.gameMode === "Math"
            ? getRandomFromStringList(equations[gameInfo.guessWordLength])
            : getRandomWordTranslation("ALL", gameInfo.guessWordLength).word;
      }

      if (!inputWord) {
        await sendMessage(
          g,
          session,
          `💡 发送一个猜测词，或发送「取消」。`
        );
        const userInput = await session.prompt();
        if (!userInput) {
          await setGuessRunningStatus(g, channelId, false);
          return await sendMessage(
            g,
            session,
            `⏳ 没有等到有效输入，这次先作罢。`
          );
        }
        if (userInput === "取消") {
          await setGuessRunningStatus(g, channelId, false);
          return await sendMessage(
            g,
            session,
            `✅ 已取消这次猜测。`
          );
        }
        inputWord = userInput.trim();
      }

      // 作答时间限制
      const timeDifferenceInSeconds =
        (timestamp - Number(gameInfo.timestamp)) / 1000;
      if (config.enableWordGuessTimeLimit) {
        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // 玩家记录输
          await updatePlayerRecordsLose(g, channelId, gameInfo);
          await sendMessage(
            g,
            session,
            `⏳ 作答超过 ${config.wordGuessTimeLimitInSeconds} 秒，本局结束\n发送「wordle.开始」再来一局。`
          );
          await endGame(g, channelId);

          return;
        }
      }

      // 玩家不在本局记录中，自动登记为参与者
      const isInGame = await isPlayerInGame(g, channelId, userId);
      if (!isInGame) {
        await ctx.database.create("wordle_gaming_player_records", {
          channelId,
          userId,
          username,
        });
      }
      let {
        correctLetters,
        presentLetters,
        isHardMode,
        absentLetters,
        isAbsurd,
        remainingWordsList,
        gameMode,
        guessWordLength,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
        isFreeMode,
      } = gameInfo;

      // 判断输入
      if (
        gameInfo.guessHistory &&
        gameInfo.guessHistory.includes(inputWord.toLowerCase())
      ) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `💡 这个已经猜过了，换一个试试。`
        );
      }
      if (
        !/^[a-zA-Z]+$/.test(inputWord) &&
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⚠️ 猜测里有非字母字符\n只用 A-Z 组词再试一次。`
        );
      }
      if (
        (!isFourCharacterIdiom(inputWord) && gameMode === "汉兜") ||
        (!isFourCharacterIdiom(inputWord) && gameMode === "词影")
      ) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⚠️ 这里只收四字词语。`
        );
      }
      if (
        gameMode === "Numberle" &&
        (!isNumericString(inputWord) || inputWord.length !== guessWordLength)
      ) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⚠️ 数字长度不对，这一局要 ${guessWordLength} 位。`
        );
      }
      if (
        gameMode === "Math" &&
        (!isMathEquationValid(inputWord) ||
          inputWord.length !== guessWordLength)
      ) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⚠️ 这不是一个成立的方程式\n只用 0-9 与 + - * / =，且等式两边要相等。`
        );
      }
      if (
        inputWord.length !== gameInfo.guessWordLength &&
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        await setGuessRunningStatus(g, channelId, false);
        const inputLengthMessage = `⚠️ 单词长度不对\n「${inputWord}」有 ${inputWord.length} 个字母，这一局要 ${gameInfo.guessWordLength} 个。`;
        const presentLettersWithoutAsterisk =
          uniqueSortedLowercaseLetters(presentLetters);
        const processedResult =
          wordlesNum > 1
            ? "\n" + (await processExtraGameInfos(g, channelId))
            : "";
        // 并列成一行，条数压回五行内
        const progressMessage = [
          `当前${calculateGameDuration(
            Number(gameInfo.timestamp),
            timestamp
          )}`,
          `当前进度 ${correctLetters.join("")}`,
          presentLettersWithoutAsterisk.length === 0
            ? ""
            : `包含字母 ${presentLettersWithoutAsterisk}`,
          absentLetters.length === 0 ? "" : `不包含字母 ${absentLetters}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return await sendMessage(
          g,
          session,
          `${inputLengthMessage}\n${progressMessage}${processedResult}`
        );
      }
      // 是否存在该单词
      // 小写化
      const lowercaseInputWord =
        gameMode === "汉兜" || gameMode === "词影"
          ? inputWord
          : inputWord.toLowerCase();
      if (
        gameMode !== "汉兜" &&
        gameMode !== "词影" &&
        gameMode !== "Numberle" &&
        gameMode !== "Math"
      ) {
        const foundWord = findWord(lowercaseInputWord);
        if (!foundWord) {
          await setGuessRunningStatus(g, channelId, false);
          return await sendMessage(
            g,
            session,
            `⚠️ 词库里没有这个单词，换一个试试。`
          );
        }
      }
      let userInputPinyin: string = "";
      if (gameMode === "词影") {
        if (!checkStrokesData(inputWord, g.data.strokesData)) {
          await setGuessRunningStatus(g, channelId, false);
          return await sendMessage(
            g,
            session,
            `⚠️ 词影的笔画库里还没有这个字\n换一个常见些的字试试。`
          );
        }
        if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
          const idiomInfo = await getIdiomInfo(g, inputWord);
          if (idiomInfo.pinyin === "未找到拼音") {
            await setGuessRunningStatus(g, channelId, false);
            return await sendMessage(
              g,
              session,
              `⚠️ 汉典里查不到这个四字词语，换一个试试。`
            );
          } else {
            userInputPinyin = idiomInfo.pinyin;
          }
        }
      }
      if (gameMode === "汉兜") {
        if (!isIdiomInList(inputWord, idiomsList)) {
          if (isFreeMode) {
            const foundItem = pinyinData.find(
              (item) => item.term === inputWord
            );

            if (foundItem) {
              userInputPinyin = foundItem.pinyin;
            } else {
              userInputPinyin = await sendPostRequestForAI(g, inputWord);
              if (userInputPinyin !== "") {
                const newItem: PinyinItem2 = {
                  term: inputWord,
                  pinyin: userInputPinyin,
                };
                pinyinData.push(newItem);

                fs.writeFileSync(
                  g.paths.pinyinKoishi,
                  JSON.stringify(pinyinData, null, 2),
                  "utf8"
                );
              } else {
                userInputPinyin = "wǒ chū cuò le";
              }
            }
          } else {
            const idiomInfo = await getIdiomInfo(g, inputWord);
            if (idiomInfo.pinyin === "未找到拼音") {
              await setGuessRunningStatus(g, channelId, false);
              return await sendMessage(
                g,
                session,
                `⚠️ 汉典里查不到这个四字词语，换一个试试。`
              );
            } else {
              userInputPinyin = idiomInfo.pinyin;
            }
          }
        }
      }
      await ctx.database.set(
        "wordle_game_records",
        { channelId },
        {
          guessHistory: gameInfo.guessHistory
            ? [...gameInfo.guessHistory, lowercaseInputWord]
            : [lowercaseInputWord],
        }
      );
      const foundIdiom = findIdiomByIdiom(inputWord, idiomsList);
      if (!userInputPinyin && foundIdiom) {
        userInputPinyin = foundIdiom.pinyin;
      }
      // 困难模式
      if (isHardMode && gameMode !== "词影") {
        let isInputWordWrong = false;
        // 包含
        const containsAllLetters = lowercaseInputWord
          .split("")
          .filter(
            (letter) => presentLetters.includes(letter) && letter !== "*"
          );
        if (
          mergeSameLetters(containsAllLetters).length !==
            presentLetters.length &&
          presentLetters.length !== 0
        ) {
          isInputWordWrong = true;
        }
        // 正确
        for (let i = 0; i < lowercaseInputWord.length; i++) {
          if (
            correctLetters[i] !== "*" &&
            correctLetters[i] !== lowercaseInputWord[i] &&
            correctLetters.some((letter) => letter !== "*")
          ) {
            isInputWordWrong = true;
            break;
          }
        }
        // 不包含 灰色的线索必须被遵守  超困难
        if (
          isUltraHardMode &&
          absentLetters.length !== 0 &&
          checkAbsentLetters(lowercaseInputWord, absentLetters)
        ) {
          isInputWordWrong = true;
        }
        // 黄色字母必须远离它们被线索的地方 超困难
        if (
          isUltraHardMode &&
          presentLettersWithIndex.length !== 0 &&
          checkPresentLettersWithIndex(
            lowercaseInputWord,
            presentLettersWithIndex
          )
        ) {
          isInputWordWrong = true;
        }
        if (isInputWordWrong) {
          await setGuessRunningStatus(g, channelId, false);
          const difficulty = isUltraHardMode ? "超困难" : "困难";
          const rule = `绿色线索必须保持在原位，黄色线索必须继续使用。${
            isUltraHardMode
              ? `\n黄色线索要避开已经排除的位置，灰色线索不得再用。`
              : ""
          }`;

          const message = `⚠️ 这个词不符合${difficulty}模式的要求\n${rule}\n你的输入 ${inputWord}\n要求 ${correctLetters.join(
            ""
          )}${
            presentLetters.length === 0 ? `` : `\n包含 ${presentLetters}`
          }${
            absentLetters.length === 0 || !isUltraHardMode
              ? ``
              : `\n不包含 ${absentLetters}`
          }${
            presentLettersWithIndex.length === 0 || !isUltraHardMode
              ? ``
              : `\n避开黄色线索 ${presentLettersWithIndex.join("、")}`
          }`;

          return await sendMessage(g, session, message);
        }
      }
      // 初始化输
      let isLose = false;
      // 变态模式
      if (isAbsurd) {
        let wordsList: string[];
        if (remainingWordsList.length === 0) {
          if (gameMode === "经典") {
            wordsList = lowerCaseWordArray;
          } else {
            const fileData = getJsonFilePathAndWordCountByLength(
              gameMode,
              guessWordLength
            );
            if (gameMode === "ALL") {
              const jsonData = JSON.parse(
                fs.readFileSync(fileData.filePath, "utf-8")
              );
              wordsList = extractLowerCaseWords(jsonData);
            } else {
              const jsonData = JSON.parse(
                fs.readFileSync(fileData.filePath, "utf-8")
              );
              wordsList = Object.keys(jsonData).map((word) =>
                word.toLowerCase()
              );
            }
          }
        } else {
          wordsList = remainingWordsList;
        }
        let longestRemainingWordList = await findLongestMatchedWords(
          wordsList,
          lowercaseInputWord,
          targetWord,
          isChallengeMode
        );
        if (!longestRemainingWordList) {
          longestRemainingWordList = [];
        } else {
          while (
            isChallengeMode &&
            wordsList.includes(targetWord) &&
            longestRemainingWordList &&
            longestRemainingWordList.length === 1 &&
            longestRemainingWordList[0] !== targetWord
          ) {
            longestRemainingWordList = await findLongestMatchedWords(
              wordsList,
              lowercaseInputWord,
              targetWord,
              isChallengeMode
            );
          }

          // 变态挑战模式
          if (isChallengeMode) {
            isLose = !longestRemainingWordList.includes(targetWord);
          }
        }
        if (longestRemainingWordList.length === 0) {
          await updatePlayerRecordsLose(g, channelId, gameInfo);
          await sendMessage(
            g,
            session,
            `💡 按现有线索，已经没有可用的单词了，本局到此为止\n发送「wordle.开始」再来一局。`
          );
          await endGame(g, channelId);
          return;
        }
        let randomWord =
          longestRemainingWordList[
            Math.floor(Math.random() * longestRemainingWordList.length)
          ];
        const foundWord = findWord(randomWord);
        if (isLose && isChallengeMode) {
          // 生成 html 字符串
          const letterTilesHtml =
            '<div class="Row-module_row__pwpBq">' +
            (await generateLetterTilesHtml(
              g,
              foundWord.word.toLowerCase(),
              inputWord,
              channelId,
              1,
              gameInfo
            )) +
            "</div>";
          const emptyGridHtml = isAbsurd
            ? generateEmptyGridHtml(1, gameInfo.guessWordLength)
            : generateEmptyGridHtml(
                gameInfo.remainingGuessesCount - 1,
                gameInfo.guessWordLength
              );
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          const imageBuffer = await generateImage(
            g,
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}`
          );
          await sendMessage(
            g,
            session,
            `⚠️ 目标单词 ${targetWord} 已经不可能是答案了\n${h.image(
              imageBuffer,
              `image/${config.imageType}`
            )}\n发送「撤销」回到上一步，或发送「结束」收掉这一局。\n没有等到有效输入时，按「撤销」处理。`
          );
          let userInput = await session.prompt();
          const imageBuffer2 = await generateImage(
            g,
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
          );
          if (!userInput) {
            await setGuessRunningStatus(g, channelId, false);
            
            return await sendMessage(
              g,
              session,
              `⏳ 没有等到有效输入，已按「撤销」处理\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`
            );
          }
          if (userInput === "结束") {
            await session.execute(`wordle.结束`);
            return;
          } else {
            await setGuessRunningStatus(g, channelId, false);
            
            return await sendMessage(
              g,
              session,
              `✅ 已撤销，挑战继续\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`
            );
          }
        }
        await ctx.database.set(
          "wordle_game_records",
          { channelId },
          {
            remainingWordsList: longestRemainingWordList,
            wordGuess: foundWord.word.toLowerCase(),
            wordAnswerChineseDefinition: replaceEscapeCharacters(
              foundWord.translation
            ),
          }
        );
        gameInfo = await getGameInfo(g, channelId);
      }
      // 胜
      let isWin = false;
      if (wordlesNum === 1 && lowercaseInputWord === gameInfo.wordGuess) {
        isWin = true;
      }
      let isWinNum = 0;
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(g, channelId, wordleIndex);
        }
        const isWin = lowercaseInputWord === gameInfo.wordGuess;
        if (isWin || gameInfo.isWin) {
          ++isWinNum;
        }
        // 负
        if (!isWin && gameInfo.remainingGuessesCount - 1 === 0 && !isAbsurd) {
          isLose = true;
        }
        let letterTilesHtml: string;

        if (gameInfo.isWin) {
          letterTilesHtml = "";
        } else {
          if (gameMode === "汉兜") {
            letterTilesHtml = await generateLetterTilesHtmlForHandle(
              g,
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo,
              gameInfo.pinyin,
              userInputPinyin
            );
          } else if (gameMode === "词影") {
            letterTilesHtml = await generateLetterTilesHtmlForCiying(
              g,
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo,
              isHardMode
            );
          } else {
            const generatedHtml = await generateLetterTilesHtml(
              g,
              gameInfo.wordGuess,
              inputWord,
              channelId,
              wordleIndex,
              gameInfo
            );
            letterTilesHtml =
              '<div class="Row-module_row__pwpBq">' + generatedHtml + "</div>";
          }
        }
        let emptyGridHtml;
        if (isAbsurd) {
          emptyGridHtml = generateEmptyGridHtml(
            isWin ? 0 : 1,
            gameInfo.guessWordLength
          );
        } else {
          if (gameMode === "汉兜") {
            emptyGridHtml = generateEmptyGridHtmlForHandle(
              gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1,
              4
            );
          } else if (gameMode === "词影") {
            emptyGridHtml =
              generateEmptyGridHtmlForCiying(
                gameInfo.isWin || isWin ? 0 : isLose ? 0 : 1,
                4,
                true
              ) +
              generateEmptyGridHtmlForCiying(
                gameInfo.isWin || isWin
                  ? gameInfo.remainingGuessesCount - 1
                  : gameInfo.remainingGuessesCount - 1 - 1,
                4,
                false
              );
          } else {
            emptyGridHtml = generateEmptyGridHtml(
              gameInfo.isWin
                ? gameInfo.remainingGuessesCount
                : gameInfo.remainingGuessesCount - 1,
              gameInfo.guessWordLength
            );
          }
        }
        const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
        if (gameMode === "汉兜") {
          imageBuffer = await generateImageForHandle(
            g,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`
          );
        } else if (gameMode === "词影") {
          imageBuffer = await generateImageForCiying(
            g,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`,
            6 + wordlesNum - 1
          );
        } else {
          imageBuffer = await generateImage(
            g,
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`
          );
        }
        imageBuffers.push(imageBuffer);
        // 更新游戏记录
        const remainingGuessesCount =
          isAbsurd || (gameMode === "词影" && (gameInfo.isWin || isWin))
            ? gameInfo.remainingGuessesCount
            : gameInfo.remainingGuessesCount - 1;
        if (wordleIndex === 1 && !gameInfo.isWin) {
          await ctx.database.set(
            "wordle_game_records",
            { channelId },
            {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            }
          );
        } else if (wordleIndex > 1 && !gameInfo.isWin) {
          await ctx.database.set(
            "extra_wordle_game_records",
            { channelId, wordleIndex },
            {
              isWin,
              remainingGuessesCount: remainingGuessesCount,
              wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
            }
          );
        }
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(g, htmlImgString);
        if (isWinNum === wordlesNum) {
          isWin = true;
        }
      }
      gameInfo = await getGameInfo(g, channelId);

      // 处理赢
      if (isWin) {
        // 玩家记录赢
        await updatePlayerRecordsWin(g, channelId, gameInfo);
        // 增加该玩家猜出单词的次数
        const [playerRecord] = await ctx.database.get("wordle_player_records", {
          userId,
        });
        // 更新最快用时
        if (
          timeDifferenceInSeconds <
            playerRecord.fastestGuessTime[gameInfo.gameMode] ||
          playerRecord.fastestGuessTime[gameInfo.gameMode] === 0
        ) {
          playerRecord.fastestGuessTime[gameInfo.gameMode] = Math.floor(
            timeDifferenceInSeconds
          );
        }

        if (gameInfo.gameMode === "词影") {
          if (gameInfo.wordlesNum === 1) {
            if (gameInfo.isHardMode) {
              playerRecord.extraCiyingRankInfo.successCountIn1HardMode += 1;
              if (
                timeDifferenceInSeconds <
                  playerRecord.extraCiyingRankInfo
                    .fastestGuessTimeIn1HardMode ||
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode ===
                  0
              ) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1HardMode =
                  Math.floor(timeDifferenceInSeconds);
              }
            } else {
              playerRecord.extraCiyingRankInfo.successCountIn1Mode += 1;
              if (
                timeDifferenceInSeconds <
                  playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode ||
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode === 0
              ) {
                playerRecord.extraCiyingRankInfo.fastestGuessTimeIn1Mode =
                  Math.floor(timeDifferenceInSeconds);
              }
            }
          } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
            const extraCiyingRankInfoKey = `successCountIn${gameInfo.wordlesNum}Mode`;
            const extraCiyingRankInfoKeyFastestGuessTimeIn = `fastestGuessTimeIn${gameInfo.wordlesNum}Mode`;
            playerRecord.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
            if (
              timeDifferenceInSeconds <
                playerRecord.extraCiyingRankInfo[
                  extraCiyingRankInfoKeyFastestGuessTimeIn
                ] ||
              playerRecord.extraCiyingRankInfo[
                extraCiyingRankInfoKeyFastestGuessTimeIn
              ] === 0
            ) {
              playerRecord.extraCiyingRankInfo[
                extraCiyingRankInfoKeyFastestGuessTimeIn
              ] = Math.floor(timeDifferenceInSeconds);
            }
          }
        }

        const updateData = {
          wordGuessCount: playerRecord.wordGuessCount + 1,
          fastestGuessTime: playerRecord.fastestGuessTime,
        };

        if (gameInfo.gameMode === "词影") {
          updateData["extraCiyingRankInfo"] = playerRecord.extraCiyingRankInfo;
        }

        await ctx.database.set(
          "wordle_player_records",
          { userId: userId },
          updateData
        );

        const processedResult: string =
          wordlesNum > 1
            ? `\n${await processExtraGameRecords(g, channelId)}`
            : "";
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const imageType = config.imageType;

        const message = `🏆 猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
发送「wordle.开始」再来一局。`;

        
        await sendMessage(
          g,
          session,
          message
        );
        await endGame(g, channelId);
        return;
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(g, channelId, gameInfo);
        const processedResult: string =
          wordlesNum > 1
            ? `\n${await processExtraGameRecords(g, channelId)}`
            : "";
        const challengeMessage = isChallengeMode
          ? `\n目标单词 ${targetWord} 已经不可能是答案了。`
          : "";
        const answerInfo = isChallengeMode
          ? ""
          : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const message = `✅ 本局结束，这次没有猜出来${challengeMessage}\n${h.image(
          imageBuffer,
          `image/${config.imageType}`
        )}\n${gameDuration}${answerInfo}${processedResult}\n发送「wordle.开始」再来一局。`;

        
        await sendMessage(
          g,
          session,
          message
        );
        await endGame(g, channelId);
        return;
      }
      // 继续
      await setGuessRunningStatus(g, channelId, false);
      await sendMessage(
        g,
        session,
        h.image(imageBuffer, `image/${config.imageType}`)
      );
      
      return;
    });
}
