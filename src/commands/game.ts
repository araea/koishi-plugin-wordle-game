import * as fs from "fs";
import { h, noop } from "koishi";
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
            `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`,
            `猜测`
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
          if (
            !config.isTextToImageConversionEnabled &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            await sendMessage(
              g,
              session,
              h.image(imageBuffer, `image/${config.imageType}`),
              ``
            );
            return await sendMessage(
              g,
              session,
              `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！`,
              `猜测`
            );
          } else {
            return await sendMessage(
              g,
              session,
              `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！\n${h.image(
                imageBuffer,
                `image/${config.imageType}`
              )}`,
              `猜测`
            );
          }
        }
      }
      // 判断输入
      if (typeof money !== "number" || money < 0) {
        return await sendMessage(
          g,
          session,
          `【@${username}】\n真是个傻瓜呢~\n投个钱也要别人教你嘛！`,
          `改名 加入游戏`
        );
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(
          g,
          session,
          `【@${username}】\n咱们这是小游戏呀...\n不许玩这么大！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】`,
          `改名 加入游戏`
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
            `【@${username}】\n修改投入金额成功！\n当前投入金额为：【${money}】\n当前玩家人数：${numberOfPlayers} 名！`,
            `改名 加入游戏 开始游戏`
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
            `【@${username}】\n修改投入金额成功！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers} 名！`,
            `改名 加入游戏 开始游戏`
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
            `【@${username}】\n您成功加入游戏了！\n如果您想玩的模式为：【经典】\n那您可以带上货币数额再加入一次！\n当前的最大投入金额为：【${
              config.maxInvestmentCurrency
            }】\n当前奖励倍率为：【${
              config.defaultRewardMultiplier
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
          );
        } else {
          // 没余额
          return await sendMessage(
            g,
            session,
            `【@${username}】\n您成功加入游戏了！\n加油哇，祝您好运！\n当前玩家人数：${
              numberOfPlayers + 1
            } 名！`,
            `改名 加入游戏 开始游戏`
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
            `【@${username}】\n您成功加入游戏了！您投入的金额为：【${money}】\n当前奖励倍率为：【${
              config.defaultRewardMultiplier
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
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
            `【@${username}】\n您成功加入游戏了！\n不过好像余额不足啦！\n投入金额已修正为：【${
              userMonetary.value
            }】\n当前玩家人数：${numberOfPlayers + 1} 名！`,
            `改名 加入游戏 开始游戏`
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
        `【@${username}】\n游戏已经开始啦！\n无法进行此操作！`,
        `猜测`
      );
    }
    // 玩家
    const isInGame = await isPlayerInGame(g, channelId, userId);
    if (!isInGame) {
      return await sendMessage(
        g,
        session,
        `【@${username}】\n您还没加入游戏呢！\n怎么退出？`,
        `改名 加入游戏`
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
      `【@${username}】\n您成功退出游戏啦！\n那就让我们下次再见吧~\n剩余玩家人数：${numberOfPlayers} 名！`,
      `改名 退出游戏 开始游戏 加入游戏`,
      2
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
        `【@${username}】\n游戏还没开始哦~怎么结束呐？`,
        `改名 开始游戏`
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
    const message = `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${
      gameInfo.isAbsurd ? "" : `\n${generateGameEndMessage(gameInfo)}`
    }${processedResult}`;
    await sendMessage(
      g,
      session,
      message,
      `改名 玩法介绍 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
      2
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
          `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
          `改名 开始游戏`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `【@${username}】\n游戏已经开始了哦~`,
          `猜测`
        );
      }
      // 提示输入
      await sendMessage(
        g,
        session,
        `【@${username}】\n${
          g.isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq"
            ? ``
            : `可选模式如下：\n${exams
                .map((exam, index) => `${index + 1}. ${exam}`)
                .join("\n")}`
        }
请输入要开始的${
          g.isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq"
            ? ``
            : `【序号】或`
        }【模式名】：`,
        `经典 CET4 CET6 GMAT GRE IELTS SAT TOEFL 考研 专八 专四 ALL 脏话 汉兜 数字 方程 词影`,
        4
      );
      const userInput = await session.prompt();
      if (!userInput)
        return await sendMessage(
          g,
          session,
          `【@${username}】\n输入无效或超时。`,
          `改名 开始游戏`
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
              `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(
                selectedExam
              )}\n请输入待猜项目的的长度：`,
              `输入`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 开始游戏`
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
          `【@${username}】\n您的输入无效，请重新输入。`,
          `改名 开始游戏`
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
        g.isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        await sendMessage(
          g,
          session,
          `【@${username}】\n附加游戏模式（可多选）：`,
          `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`,
          4
        );
        const userInput = await session.prompt();

        if (!userInput) {
          return await sendMessage(
            g,
            session,
            `【@${username}】\n输入无效或超时。`,
            `改名 开始游戏`
          );
        }

        const modes = {
          困难: "hard",
          超困难: "ultraHardMode",
          变态: "absurd",
          变态挑战: "challenge",
        };

        const wordles = {
          x1: 1,
          x2: 2,
          x3: 3,
          x4: 4,
        };

        for (const mode in modes) {
          if (userInput.includes(mode)) {
            options[modes[mode]] = true;
          }
        }

        for (const wordle in wordles) {
          if (userInput.includes(wordle)) {
            options.wordles = wordles[wordle];
          }
        }

        if (userInput.includes("跳过")) {
          noop();
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
          `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
          `改名 开始游戏`
        );
      }
      // 游戏状态
      const gameInfo = await getGameInfo(g, channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(
          g,
          session,
          `【@${username}】\n游戏已经开始了哦~`,
          `猜测`
        );
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(g, channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(
          g,
          session,
          `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`,
          `改名 加入游戏`
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

      if (
        !config.isTextToImageConversionEnabled &&
        g.isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        await sendMessage(g, session, image, ``);
        return await sendMessage(
          g,
          session,
          `游戏开始！\n当前游戏模式为：${gameMode}${
            isChallengeMode ? targetWord : ""
          }\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}`,
          `结束游戏 猜测`,
          2
        );
      }
      return await sendMessage(g, session, message, `结束游戏 猜测`);
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
        if (
          g.isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          let markdownCommands = "";
          let numberOfMessageButtonsPerRow = 2;
          if (exam === "汉兜" || exam === "词影") {
            markdownCommands = `困难 超困难 x1 x2 x3 x4 自由 全成语 跳过`;
          } else if (exam === "Numberle" || exam === "Math") {
            markdownCommands = `困难 超困难 x1 x2 x3 x4 跳过`;
          } else {
            markdownCommands = `困难 超困难 变态 变态挑战 x1 x2 x3 x4 跳过`;
          }
          await sendMessage(
            g,
            session,
            `【@${username}】\n附加游戏模式（可多选）：`,
            markdownCommands,
            numberOfMessageButtonsPerRow
          );

          const userInput = await session.prompt();

          if (!userInput) {
            return await sendMessage(
              g,
              session,
              `【@${username}】\n输入无效或超时。`,
              `改名 开始游戏`
            );
          }

          if (exam === "汉兜" || exam === "词影") {
            options.free = userInput.includes(`自由`);
            options.all = userInput.includes(`全成语`);
          }

          const modes = {
            困难: "hard",
            超困难: "ultraHardMode",
            变态: "absurd",
            变态挑战: "challenge",
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
              `【@${username}】\n长度可选值范围：${getValidGuessWordLengthRange(
                exam
              )}\n请输入待猜测项目的长度：`,
              `输入`
            );
            const userInput = await session.prompt();
            if (!userInput)
              return await sendMessage(
                g,
                session,
                `【@${username}】\n输入无效或超时。`,
                `改名 开始游戏`
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
            `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个的话~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`,
            `改名 开始游戏`
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
            `【@${username}】\n无效的长度参数！\n${exam} 长度可选值范围：${getValidGuessWordLengthRange(
              exam
            )}`,
            `改名 开始游戏`
          );
        }

        // 游戏状态
        const gameInfo = await getGameInfo(g, channelId);
        if (gameInfo.isStarted) {
          return await sendMessage(
            g,
            session,
            `【@${username}】\n游戏已经开始了哦~`,
            `猜测`
          );
        }

        // 人数
        const numberOfPlayers = await getNumberOfPlayers(g, channelId);
        if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
          return await sendMessage(
            g,
            session,
            `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜测】\n先加入游戏吧~`,
            `改名 加入游戏`
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
          if (
            !config.isTextToImageConversionEnabled &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            await sendMessage(g, session, image, ``);
            return await sendMessage(
              g,
              session,
              `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}`,
              `结束游戏 猜测`,
              2
            );
          } else {
            return await sendMessage(
              g,
              session,
              `${gameMode}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`,
              `结束游戏 猜测`
            );
          }
        } else {
          if (
            !config.isTextToImageConversionEnabled &&
            g.isQQOfficialRobotMarkdownTemplateEnabled &&
            session.platform === "qq"
          ) {
            await sendMessage(g, session, image, ``);
            return await sendMessage(
              g,
              session,
              `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${
                exam === "Numberle" ? "" : wordCount2
              }${timeLimit}`,
              `结束游戏 猜测`,
              2
            );
          } else {
            return await sendMessage(
              g,
              session,
              `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${
                exam === "Numberle" ? "" : wordCount2
              }${timeLimit}\n${image}`,
              `结束游戏 猜测`
            );
          }
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
          `【@${username}】\n操作太快了哦~\n再试一次吧！`,
          `猜测`
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
          `【@${username}】\n游戏还没开始呢！`,
          `改名 开始游戏`
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
          `【@${username}】\n请输入【猜测词】或【取消】：`,
          `取消 输入`
        );
        const userInput = await session.prompt();
        if (!userInput)
          return await sendMessage(
            g,
            session,
            `【@${username}】\n输入无效或超时。`,
            `猜测`
          );
        if (userInput === "取消")
          return await sendMessage(
            g,
            session,
            `【@${username}】\n猜测操作已取消！`,
            `猜测`
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
            `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
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
            `【@${username}】\n没加入游戏的话~不能猜哦！`,
            `猜测`
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
          `【@${username}】\n这个已经猜过了哦！`,
          `猜测`
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
          `【@${username}】\n输入包含非字母字符，请重新输入！`,
          `猜测`
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
          `【@${username}】\n您确定您输入的是四字词语吗？`,
          `猜测`
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
          `【@${username}】\n您确定您输入的是 ${guessWordLength} 长度的数字吗？`,
          `猜测`
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
          `【@${username}】\n请使用+-*/=运算符和0-9之间的数字！\n并组成正确的数学方程式！`,
          `猜测`
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
        const usernameMention = `【@${username}】`;
        const inputLengthMessage = `输入的单词长度不对哦！\n您的输入为：【${inputWord}】\n它的长度为：【${inputWord.length}】\n待猜单词的长度为：【${gameInfo.guessWordLength}】`;
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
          `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`,
          `猜测`
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
            `【@${username}】\n你确定存在这样的单词吗？`,
            `猜测`
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
            `【@${username}】\n不好意思啊...\n我还没学会这个字（`,
            `猜测`
          );
        }
        if (!isIdiomInList(inputWord, idiomsList) && !isFreeMode) {
          const idiomInfo = await getIdiomInfo(g, inputWord);
          if (idiomInfo.pinyin === "未找到拼音") {
            await setGuessRunningStatus(g, channelId, false);
            return await sendMessage(
              g,
              session,
              `【@${username}】\n你确定存在这样的四字词语吗？`,
              `猜测`
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
                `【@${username}】\n你确定存在这样的四字词语吗？`,
                `猜测`
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

          const message = `【@${username}】\n当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n您输入的词不符合要求！\n您的输入为：【${inputWord}】\n要求：【${correctLetters.join(
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

          return await sendMessage(g, session, message, `猜测`);
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
            `【@${username}】\n根据透露出的信息！\n已经无任何可用单词！\n很遗憾，你们输了！`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
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
            `【@${username}】\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(
              imageBuffer,
              `image/${config.imageType}`
            )}\n您可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`,
            `撤销 结束`
          );
          let userInput = await session.prompt();
          const imageBuffer2 = await generateImage(
            g,
            styledHtml,
            `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`
          );
          if (!userInput) {
            await setGuessRunningStatus(g, channelId, false);
            if (
              !config.isTextToImageConversionEnabled &&
              g.isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(
                g,
                session,
                h.image(imageBuffer2, `image/${config.imageType}`),
                ``
              );
              return await sendMessage(
                g,
                session,
                `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。`,
                `猜测`
              );
            }
            return await sendMessage(
              g,
              session,
              `【@${username}】\n输入无效或超时。\n已自动选择【撤销】操作。\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`,
              `猜测`
            );
          }
          if (userInput === "结束") {
            await session.execute(`wordleGame.结束`);
            return;
          } else {
            await setGuessRunningStatus(g, channelId, false);
            if (
              !config.isTextToImageConversionEnabled &&
              g.isQQOfficialRobotMarkdownTemplateEnabled &&
              session.platform === "qq"
            ) {
              await sendMessage(
                g,
                session,
                h.image(imageBuffer2, `image/${config.imageType}`),
                ``
              );
              return await sendMessage(
                g,
                session,
                `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！`,
                `猜测`
              );
            }
            return await sendMessage(
              g,
              session,
              `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！\n${h.image(
                imageBuffer2,
                `image/${config.imageType}`
              )}`,
              `猜测`
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
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

        if (
          !config.isTextToImageConversionEnabled &&
          g.isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          await sendMessage(
            g,
            session,
            h.image(imageBuffer, `image/${imageType}`),
            ``
          );
          await sendMessage(
            g,
            session,
            `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(g, channelId);
          return;
        }
        await sendMessage(
          g,
          session,
          message,
          `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
          2
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
          ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！`
          : "";
        const answerInfo = isChallengeMode
          ? ""
          : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(
          Number(gameInfo.timestamp),
          timestamp
        );
        const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(
          imageBuffer,
          `image/${config.imageType}`
        )}\n${gameDuration}${answerInfo}${processedResult}`;

        if (
          !config.isTextToImageConversionEnabled &&
          g.isQQOfficialRobotMarkdownTemplateEnabled &&
          session.platform === "qq"
        ) {
          await sendMessage(
            g,
            session,
            h.image(imageBuffer, `image/${config.imageType}`),
            ``
          );
          await sendMessage(
            g,
            session,
            `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${gameDuration}${answerInfo}${processedResult}`,
            `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
            2
          );
          await endGame(g, channelId);
          return;
        }
        await sendMessage(
          g,
          session,
          message,
          `改名 排行榜 查询玩家记录 开始游戏 再来一把${gameInfo.gameMode}`,
          2
        );
        await endGame(g, channelId);
        return;
      }
      // 继续
      await setGuessRunningStatus(g, channelId, false);
      await sendMessage(
        g,
        session,
        h.image(imageBuffer, `image/${config.imageType}`),
        `结束游戏 ${
          gameInfo.gameMode === "汉兜" ? `拼音速查表 ` : ``
        }查询进度 猜测`,
        2
      );
      if (
        !config.isTextToImageConversionEnabled &&
        g.isQQOfficialRobotMarkdownTemplateEnabled &&
        session.platform === "qq"
      ) {
        return sendMessage(
          g,
          session,
          `<@${userId}>`,
          `结束游戏 ${
            gameInfo.gameMode === "汉兜" ? `拼音速查表 ` : ``
          }查询进度 猜测`,
          2
        );
      }
      return;
    });
}
