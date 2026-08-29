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
  deductMoney,
  endGame,
  getGameInfo,
  getGameInfo2,
  getNumberOfPlayers,
  isPlayerInGame,
  processExtraGameInfos,
  processExtraGameRecords,
  processNonZeroMoneyPlayers,
  setGuessRunningStatus,
  updateGamingPlayerRecords,
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

// 注册游戏核心指令：加入、退出、结束、开始（含各模式）、猜，以及无前缀猜测中间件。
export function register(g: GameContext) {
  const { ctx, config } = g;
  const idiomsList = g.data.idiomsList;
  const pinyinData = g.data.pinyinData;
  const equations = g.data.equations;

  // 无前缀猜测中间件：在游戏进行中，符合当前模式特征的输入自动作为猜测。
  ctx.middleware(async (session, next) => {
    let { channelId, content } = session;
    if (!config.enableWordGuessMiddleware) {
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

    await session.execute(`wordleGame.猜 ${content}`);
    return;
  });

  // wordleGame.加入
  ctx
    .command("wordleGame.加入 [money:number]", "加入游戏")
    .action(async ({ session }, money = 0) => {
      let { channelId, userId, username, user } = session;
      username = await getSessionUserName(g, session);
      await updateNameInPlayerRecord(g, session, userId, username);
      let gameInfo: any = await getGameInfo(g, channelId);
      const isInGame = await isPlayerInGame(g, channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(
            g,
            session,
            `⚠️ 游戏已经开始，无法中途加入。`
          );
        } else {
          const wordlesNum = gameInfo.wordlesNum;
          const isAbsurd = gameInfo.isAbsurd;
          let imageBuffers: Buffer[] = [];
          let imageBuffer: Buffer = Buffer.from("initial value", "utf-8");
          for (
            let wordleIndex = 1;
            wordleIndex < wordlesNum + 1;
            wordleIndex++
          ) {
            if (wordleIndex > 1) {
              gameInfo = await getGameInfo2(g, channelId, wordleIndex);
            }
            if (gameInfo.gameMode === "汉兜") {
              const emptyGridHtml = generateEmptyGridHtmlForHandle(1, 4);
              imageBuffer = await generateImageForHandle(
                g,
                `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
              );
            } else {
              const emptyGridHtml = isAbsurd
                ? generateEmptyGridHtml(1, gameInfo.guessWordLength)
                : generateEmptyGridHtml(
                    gameInfo.remainingGuessesCount,
                    gameInfo.guessWordLength
                  );
              const styledHtml = generateStyledHtml(
                gameInfo.guessWordLength + 1
              );
              imageBuffer = await generateImage(
                g,
                styledHtml,
                `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
              );
            }
            imageBuffers.push(imageBuffer);
          }
          if (wordlesNum > 1) {
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(g, htmlImgString);
          }
                    return await sendMessage(
            g,
            session,
            `⚠️ 你已经在游戏中。\n${h.image(
              imageBuffer,
              `image/${config.imageType}`
            )}`
          );

        }
      }
      // 判断输入
      if (typeof money !== "number" || money < 0) {
        return await sendMessage(
          g,
          session,
          `⚠️ 请输入不小于 0 的投入金额。`
        );
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(
          g,
          session,
          `⚠️ 投入金额不能超过 ${config.maxInvestmentCurrency}。`
        );
      }
      // @ts-ignore
      const uid = user.id;
      let getUserMonetary = await ctx.database.get("monetary", { uid });
      if (getUserMonetary.length === 0) {
        await ctx.database.create("monetary", {
          uid,
          value: 0,
          currency: "default",
        });
        getUserMonetary = await ctx.database.get("monetary", { uid });
      }
      const userMonetary = getUserMonetary[0];
      const numberOfPlayers = await getNumberOfPlayers(g, channelId);
      // 修改金额
      if (isInGame) {
        // 余额够
        if (userMonetary.value >= money) {
          await ctx.database.set(
            "wordle_gaming_player_records",
            { channelId, userId },
            { money }
          );
          return await sendMessage(
            g,
            session,
            `✅ 投入已改为 ${money}。当前玩家：${numberOfPlayers} 人。`
          );
        } else {
          // 余额不够
          await ctx.database.set(
            "wordle_gaming_player_records",
            { channelId, userId },
            { money: userMonetary.value }
          );
          return await sendMessage(
            g,
            session,
            `⚠️ 余额不足，投入已修正为 ${userMonetary.value}。当前玩家：${numberOfPlayers} 人。`
          );
        }
      }
      // 加入游戏
      // money 为 0
      if (money === 0) {
        await ctx.database.create("wordle_gaming_player_records", {
          channelId,
          userId,
          username,
          money,
        });
        // 有余额
        if (userMonetary.value > 0) {
          return await sendMessage(
            g,
            session,
            `✅ 加入成功。经典模式可带上金额再加入一次以投入。\n最大投入：${
              config.maxInvestmentCurrency
            }，倍率：${
              config.defaultRewardMultiplier
            }。当前玩家：${numberOfPlayers + 1} 人。`
          );
        } else {
          // 没余额
          return await sendMessage(
            g,
            session,
            `✅ 加入成功。当前玩家：${
              numberOfPlayers + 1
            } 人。`
          );
        }
      } else {
        // money !== 0
        // 余额足够
        if (userMonetary.value >= money) {
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money,
          });
          return await sendMessage(
            g,
            session,
            `✅ 加入成功，投入 ${money}。倍率：${
              config.defaultRewardMultiplier
            }。当前玩家：${numberOfPlayers + 1} 人。`
          );
        } else {
          // 余额不够
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money: userMonetary.value,
          });
          return await sendMessage(
            g,
            session,
            `⚠️ 余额不足，投入已修正为 ${
              userMonetary.value
            }。当前玩家：${numberOfPlayers + 1} 人。`
          );
        }
      }
    });

  // wordleGame.退出
  ctx.command("wordleGame.退出", "退出游戏").action(async ({ session }) => {
    let { channelId, userId, username } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    // 游戏状态
    const gameInfo = await getGameInfo(g, channelId);
    if (gameInfo.isStarted) {
      return await sendMessage(
        g,
        session,
        `⚠️ 游戏已经开始，无法进行此操作。`
      );
    }
    // 玩家
    const isInGame = await isPlayerInGame(g, channelId, userId);
    if (!isInGame) {
      return await sendMessage(
        g,
        session,
        `⚠️ 你还没有加入游戏。`
      );
    }
    // 退出
    await ctx.database.remove("wordle_gaming_player_records", {
      channelId,
      userId,
    });
    const numberOfPlayers = await getNumberOfPlayers(g, channelId);
    return await sendMessage(
      g,
      session,
      `✅ 已退出。剩余玩家：${numberOfPlayers} 人。`
    );
  });

  // wordleGame.结束
  ctx.command("wordleGame.结束", "结束游戏").action(async ({ session }) => {
    let { channelId, userId, username, timestamp } = session;
    username = await getSessionUserName(g, session);
    await updateNameInPlayerRecord(g, session, userId, username);
    // 游戏状态
    const gameInfo = await getGameInfo(g, channelId);
    if (!gameInfo.isStarted) {
      return await sendMessage(
        g,
        session,
        `⚠️ 当前没有进行中的对局。`
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
    const message = `由于你执行了操作：【结束】\n游戏已结束！\n${duration}${
      gameInfo.isAbsurd ? "" : `\n${generateGameEndMessage(gameInfo)}`
    }${processedResult}`;
    await sendMessage(
      g,
      session,
      message
    );
    await endGame(g, channelId);
    return;
  });

  // wordleGame.开始
  ctx
    .command("wordleGame.开始 [guessWordLength:number]", "开始游戏引导")
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
          `⚠️ 同时猜测的数量须在 1 ~ ${config.maxSimultaneousGuesses} 之间。`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `⚠️ 游戏已经开始了。`
        );
      }
      // 提示输入
      await sendMessage(
        g,
        session,
        `可选模式如下：\n${exams
                .map((exam, index) => `${index + 1}. ${exam}`)
                .join("\n")}
请输入要开始的序号或模式名：`
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效或超时。`
        );
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
              `长度可选值范围：${getValidGuessWordLengthRange(
                selectedExam
              )}\n请输入待猜项目的的长度：`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`
              );
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
        const command = `wordleGame.开始.${selectedExam}${hardOption}${uhardOption}${absurdOption}${challengeOption}${wordlesOption} ${guessWordLength}`;
        return await session.execute(command);
      } else {
        return await sendMessage(
          g,
          session,
          `⚠️ 输入无效，请重新输入。`
        );
      }
    });

  // wordleGame.开始.经典
  ctx
    .command("wordleGame.开始.经典", "开始经典猜单词游戏")
    .option("hard", "--hard 困难模式", { fallback: false })
    .option("ultraHardMode", "--uhard 超困难模式", { fallback: false })
    .option("absurd", "--absurd 变态模式", { fallback: false })
    .option("challenge", "--challenge 变态挑战模式", { fallback: false })
    .option("wordles", "--wordles <value:number> 同时猜测多个单词", {
      fallback: 1,
    })
    .action(async ({ session, options }) => {
      let { channelId, userId, username, platform, timestamp } = session;
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
          `⚠️ 同时猜测的数量须在 1 ~ ${config.maxSimultaneousGuesses} 之间。`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `⚠️ 游戏已经开始了。`
        );
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(g, channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(
          g,
          session,
          `没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`
        );
      }
      // 经典扣钱
      await deductMoney(g, channelId, platform);
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

      const gameMode = `【经典${wordlesNum > 1 ? `（x${wordlesNum}）` : ""}${
        isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""
      }${isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""}】`;
      const targetWord = isChallengeMode
        ? `\n目标单词为：【${randomWord}】`
        : "";
      const wordLength = "单词长度为：【5】";
      const guessChance = `猜单词机会为：【${
        isAbsurdMode ? "♾️" : `${6 + wordlesNum - 1}`
      }】`;
      const wordCount = "待猜单词数量为：【2315】";
      const timeLimit = config.enableWordGuessTimeLimit
        ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒`
        : "";
      const image = h.image(imageBuffer, `image/${config.imageType}`);

      const message = `游戏开始！\n当前游戏模式为：${gameMode}${
        isChallengeMode ? targetWord : ""
      }\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}\n${image}`;

      
      return await sendMessage(g, session, message);
    });

  // wordleGame.开始.<模式>（经典以外的所有模式）
  exams.forEach((exam) => {
    if (exam === "经典") {
      return;
    }
    ctx
      .command(
        `wordleGame.开始.${exam} [guessWordLength:number]`,
        `开始猜${exam}单词游戏`
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
      .option("wordles", "--wordles <value:number> 同时猜测多个", {
        fallback: 1,
      })
      .action(async ({ session, options }, guessWordLength) => {
        let { channelId, userId, username, timestamp, platform } = session;
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
              `长度可选值范围：${getValidGuessWordLengthRange(
                exam
              )}\n请输入待猜测项目的长度：`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `⚠️ 输入无效或超时。`
              );
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
            `⚠️ 同时猜测的数量须在 1 ~ ${config.maxSimultaneousGuesses} 之间。`
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
            `无效的长度参数！\n${exam} 长度可选值范围：${getValidGuessWordLengthRange(
              exam
            )}`
          );
        }

        // 游戏状态
        const gameInfo = await getGameInfo(g, channelId);
        if (gameInfo.isStarted) {
          return await sendMessage(
            g,
            session,
            `⚠️ 游戏已经开始了。`
          );
        }

        // 人数
        const numberOfPlayers = await getNumberOfPlayers(g, channelId);
        if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
          return await sendMessage(
            g,
            session,
            `没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜测】\n先加入游戏吧~`
          );
        }

        // 非经典还钱
        if (exam !== "汉兜") {
          await updateGamingPlayerRecords(g, channelId);
        } else {
          // 汉兜 扣钱
          await deductMoney(g, channelId, platform);
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

        const gameMode = `游戏开始！\n当前游戏模式为：【${exam}${
          wordlesNum > 1 ? `（x${wordlesNum}）` : ""
        }${
          (isFreeMode && exam === "汉兜") || (isFreeMode && exam === "词影")
            ? `（自由）`
            : ""
        }${isHardMode ? `（${isUltraHardMode ? "超" : ""}困难）` : ""}${
          isAbsurdMode ? `（变态${isChallengeMode ? "挑战" : ""}）` : ""
        }】`;
        const challengeInfo = isChallengeMode
          ? `\n目标单词为：【${randomWord}】`
          : "";
        const wordLength = `${
          exam === "Numberle"
            ? "数字"
            : exam === "Math"
            ? "数学方程式"
            : "单词"
        }长度为：【${guessWordLength}】`;
        const guessChance = `猜${
          exam === "汉兜" || exam === "词影"
            ? "词语|成语"
            : exam === "Numberle"
            ? "数字"
            : exam === "Math"
            ? "数学方程式"
            : "单词"
        }机会为：【${
          isAbsurdMode
            ? "♾️"
            : exam === "汉兜"
            ? `${10 + wordlesNum - 1}`
            : exam === "Math"
            ? `${6 + wordlesNum - 1}`
            : exam === "词影"
            ? `${6 + wordlesNum - 1}`
            : guessWordLength + 1 + wordlesNum - 1
        }】`;
        const wordCount2 =
          exam === "汉兜" || exam === "词影"
            ? `待猜词语|成语数量为：【${
                options.all ? idiomsList.length : commonIdiomsList.length
              }】`
            : exam === "Math"
            ? `待猜方程式数量为：【${equations[guessWordLength].length}】`
            : `待猜单词数量为：【${exam === "Lewdle" ? "1000" : wordCount}】`;
        const timeLimit = config.enableWordGuessTimeLimit
          ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒`
          : "";
        const image = h.image(imageBuffer, `image/${config.imageType}`);

        if (exam === "汉兜" || exam === "词影") {
          return await sendMessage(
            g,
            session,
            `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`
          );
        } else {
          return await sendMessage(
            g,
            session,
            `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${
              exam === "Numberle" ? "" : wordCount2
            }${timeLimit}\n${image}`
          );
        }
      });
  });

  // wordleGame.猜
  ctx
    .command("wordleGame.猜 [inputWord:text]", "做出一次猜测")
    .option("random", "-r 随机", { fallback: false })
    .action(async ({ session, options }, inputWord) => {
      let { channelId, userId, username, platform, timestamp } = session;
      let gameInfo: any = await getGameInfo(g, channelId);
      inputWord = inputWord?.trim();

      if (gameInfo.isRunning === true) {
        await setGuessRunningStatus(g, channelId, false);
        return await sendMessage(
          g,
          session,
          `⏳ 操作过快，请稍后再试。`
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
          `⚠️ 游戏还没开始。`
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
          `⚠️ 请输入猜测词，或发送「取消」。`
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
            `✅ 已取消猜测。`
          );
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
            `⏳ 作答超过 ${config.wordGuessTimeLimitInSeconds} 秒，本局结束。`
          );
          await endGame(g, channelId);

          return;
        }
      }

      // 玩家不在游戏中
      const isInGame = await isPlayerInGame(g, channelId, userId);
      if (!isInGame) {
        if (!config.allowNonPlayersToGuess) {
          await setGuessRunningStatus(g, channelId, false);
          return await sendMessage(
            g,
            session,
            `⚠️ 你还没有加入游戏，无法猜测。`
          );
        } else {
          await ctx.database.create("wordle_gaming_player_records", {
            channelId,
            userId,
            username,
            money: 0,
          });
        }
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
          `⚠️ 这个已经猜过了。`
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
          `⚠️ 输入包含非字母字符，请重新输入。`
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
          `⚠️ 请输入四字词语。`
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
          `⚠️ 请输入长度为 ${guessWordLength} 的数字。`
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
          `⚠️ 请使用 + - * / = 运算符和 0-9 的数字，组成正确的数学方程式。`
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
        const usernameMention = ``;
        const inputLengthMessage = `⚠️ 单词长度不对。输入「${inputWord}」长度为 ${inputWord.length}，待猜长度为 ${gameInfo.guessWordLength}。`;
        const presentLettersWithoutAsterisk =
          uniqueSortedLowercaseLetters(presentLetters);
        const processedResult =
          wordlesNum > 1
            ? "\n" + (await processExtraGameInfos(g, channelId))
            : "";
        const progressMessage = `当前${calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        )}\n当前进度：【${correctLetters.join("")}】${
          presentLettersWithoutAsterisk.length === 0
            ? ``
            : `\n包含字母：【${presentLettersWithoutAsterisk}】`
        }${
          absentLetters.length === 0 ? "" : `\n不包含字母：【${absentLetters}】`
        }${processedResult}`;
        return await sendMessage(
          g,
          session,
          `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`
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
            `⚠️ 词库中没有这个单词。`
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
            `不好意思啊...\n我还没学会这个字（`
          );
        }
        if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
          const idiomInfo = await getIdiomInfo(g, inputWord);
          if (idiomInfo.pinyin === "未找到拼音") {
            await setGuessRunningStatus(g, channelId, false);
            return await sendMessage(
              g,
              session,
              `⚠️ 未找到该四字词语。`
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
                `⚠️ 未找到该四字词语。`
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
          const rule = `绿色线索必须保特固定，黄色线索必须重复使用。${
            isUltraHardMode
              ? `\n黄色线索必须远离它们被线索的地方，灰色的线索必须被遵守。`
              : ""
          }`;

          const message = `当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n你输入的词不符合要求！\n你的输入为：【${inputWord}】\n要求：【${correctLetters.join(
            ""
          )}】${
            presentLetters.length === 0 ? `` : `\n包含：【${presentLetters}】`
          }${
            absentLetters.length === 0 || !isUltraHardMode
              ? ``
              : `\n不包含：【${absentLetters}】`
          }${
            presentLettersWithIndex.length === 0 || !isUltraHardMode
              ? ``
              : `\n远离黄色线索：【${presentLettersWithIndex.join(", ")}】`
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
            `⚠️ 根据已有信息，已经没有可用单词。本局结束。`
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
            `目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(
              imageBuffer,
              `image/${config.imageType}`
            )}\n你可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`
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
              `⚠️ 输入无效或超时。\n已自动选择【撤销】操作。\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`
            );
          }
          if (userInput === "结束") {
            await session.execute(`wordleGame.结束`);
            return;
          } else {
            await setGuessRunningStatus(g, channelId, false);
            
            return await sendMessage(
              g,
              session,
              `✅ 已撤销，挑战继续。\n${h.image(
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
        let finalSettlementString: string = "";
        // 经典有收入
        if (gameInfo.gameMode === "经典" || gameInfo.gameMode === "汉兜") {
          finalSettlementString = await processNonZeroMoneyPlayers(
            g,
            channelId,
            platform
          );
        }
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
        const settlementResult =
          finalSettlementString === ""
            ? ""
            : `最终结算结果如下：\n${finalSettlementString}`;

        const message = `
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

        
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
          ? `\n目标单词为「${targetWord}」，它不再是可能的秘密单词。`
          : "";
        const answerInfo = isChallengeMode
          ? ""
          : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const message = `本局未猜出。${challengeMessage}\n${h.image(
          imageBuffer,
          `image/${config.imageType}`
        )}\n${gameDuration}${answerInfo}${processedResult}`;

        
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
