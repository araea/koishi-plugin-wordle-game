import type { GameContext } from "../context";
import type {
  ExtraGameRecord,
  GameRecord,
  GamingPlayer,
  PlayerRecord,
} from "../types";
import { replaceEscapeCharacters } from "../utils/string";

// 获取频道当前的游戏记录，不存在则初始化一条未开始的记录。
export async function getGameInfo(
  g: GameContext,
  channelId: string
): Promise<GameRecord> {
  let gameRecord = await g.ctx.database.get("wordle_game_records", {
    channelId,
  });
  if (gameRecord.length === 0) {
    await g.ctx.database.create("wordle_game_records", {
      channelId,
      isStarted: false,
    });
    gameRecord = await g.ctx.database.get("wordle_game_records", { channelId });
  }
  return gameRecord[0];
}

// 获取多词模式下指定序号的额外游戏记录。
export async function getGameInfo2(
  g: GameContext,
  channelId: string,
  wordleIndex: number
): Promise<ExtraGameRecord> {
  const gameRecord = await g.ctx.database.get("extra_wordle_game_records", {
    channelId,
    wordleIndex,
  });
  return gameRecord[0];
}

// 获取频道内已加入游戏的玩家数量。
export async function getNumberOfPlayers(
  g: GameContext,
  channelId: string
): Promise<number> {
  const playerRecords = await g.ctx.database.get(
    "wordle_gaming_player_records",
    { channelId }
  );
  return playerRecords.length;
}

// 判断玩家是否已加入游戏。
export async function isPlayerInGame(
  g: GameContext,
  channelId: string,
  userId: string
): Promise<boolean> {
  const getPlayer = await g.ctx.database.get("wordle_gaming_player_records", {
    channelId,
    userId,
  });
  return getPlayer.length !== 0;
}

// 根据平台与用户 ID 获取用户记录。
export async function getUserFromDatabase(
  g: GameContext,
  platform: string,
  userId: string
) {
  return await g.ctx.database.getUser(platform, userId);
}

// 获取用户的数据库主键 uid。
export async function getPlayerUid(
  g: GameContext,
  platform: string,
  userId: string
): Promise<number> {
  const user = await getUserFromDatabase(g, platform, userId);
  return user.id;
}

// 更新玩家记录表中的用户名（必要时初始化统计字段）。
export async function updateNameInPlayerRecord(
  g: GameContext,
  session,
  userId: string,
  username: string
): Promise<void> {
  const userRecord = await g.ctx.database.get("wordle_player_records", {
    userId,
  });

  let isChange = false;

  if (userRecord.length === 0) {
    await g.ctx.database.create("wordle_player_records", {
      userId,
      username,
    });
    return;
  }

  const existingRecord = userRecord[0];

  if (username !== existingRecord.username) {
    existingRecord.username = username;
    isChange = true;
  }

  const keys = ["Lewdle", "汉兜", "Numberle", "Math", "词影"];

  keys.forEach((key) => {
    if (
      !existingRecord.stats[key] ||
      !existingRecord.stats.hasOwnProperty(key)
    ) {
      existingRecord.stats[key] = { win: 0, lose: 0 };
      isChange = true;
    }
    if (!existingRecord.fastestGuessTime[key]) {
      existingRecord.fastestGuessTime[key] = 0;
      isChange = true;
    }
  });

  if (isChange) {
    await g.ctx.database.set(
      "wordle_player_records",
      { userId },
      {
        username: existingRecord.username,
        stats: existingRecord.stats,
        fastestGuessTime: existingRecord.fastestGuessTime,
      }
    );
  }
}

// 设置当前频道猜测操作的运行状态（用于防止过快重复提交）。
export async function setGuessRunningStatus(
  g: GameContext,
  channelId: string,
  isRunning: boolean
): Promise<void> {
  await g.ctx.database.set("wordle_game_records", { channelId }, { isRunning });
}

// 结束游戏：清理该频道的所有游戏相关记录与消息状态。
export async function endGame(g: GameContext, channelId: string) {
  g.lastMessageInfo.delete(channelId);

  await Promise.all([
    g.ctx.database.remove("wordle_gaming_player_records", { channelId }),
    g.ctx.database.remove("wordle_game_records", { channelId }),
    g.ctx.database.remove("extra_wordle_game_records", { channelId }),
  ]);
}

// 经典/汉兜模式开始时扣除投入的货币。
export async function deductMoney(
  g: GameContext,
  channelId: string,
  platform: string
) {
  const getPlayers = await g.ctx.database.get("wordle_gaming_player_records", {
    channelId,
  });
  for (const thisGamingPlayer of getPlayers) {
    const { userId, money } = thisGamingPlayer;
    if (money === 0) {
      continue;
    }
    const uid = await getPlayerUid(g, platform, userId);
    const [userMonetary] = await g.ctx.database.get("monetary", { uid });
    const value = userMonetary.value - money;
    await g.ctx.database.set("monetary", { uid }, { value });
    const [playerInfo] = await g.ctx.database.get("wordle_player_records", {
      userId,
    });
    await g.ctx.database.set(
      "wordle_player_records",
      { userId },
      { moneyChange: playerInfo.moneyChange - money }
    );
  }
}

// 非经典模式开始时，把玩家投入的货币清零（还钱）。
export async function updateGamingPlayerRecords(
  g: GameContext,
  channelId: string
) {
  const getPlayers = await g.ctx.database.get("wordle_gaming_player_records", {
    channelId,
  });
  for (const thisGamingPlayer of getPlayers) {
    const { userId, money } = thisGamingPlayer;
    if (money === 0) {
      continue;
    }
    await g.ctx.database.set(
      "wordle_gaming_player_records",
      { channelId, userId },
      { money: 0 }
    );
  }
}

// 结算获胜玩家的货币奖励，并返回结算文本。
export async function processNonZeroMoneyPlayers(
  g: GameContext,
  channelId: string,
  platform: string
) {
  const getPlayers = await g.ctx.database.get("wordle_gaming_player_records", {
    channelId,
  });
  const settlementRecords: string[] = [];

  for (const thisGamingPlayer of getPlayers) {
    const { userId, money, username } = thisGamingPlayer;

    if (money === 0) {
      continue;
    }

    const uid = await getPlayerUid(g, platform, userId);
    const rewardMultiplier = g.config.defaultRewardMultiplier;
    const gainAmount = money * rewardMultiplier;

    await g.ctx.monetary.gain(uid, gainAmount);

    const [playerInfo] = await g.ctx.database.get("wordle_player_records", {
      userId,
    });
    const updatedMoneyChange = playerInfo.moneyChange + gainAmount;
    await g.ctx.database.set(
      "wordle_player_records",
      { userId },
      { moneyChange: updatedMoneyChange }
    );

    const settlementString = `【${username}】：【+${gainAmount}】`;
    settlementRecords.push(settlementString);
  }

  return settlementRecords.join("\n");
}

// 玩家失败时更新其胜负统计。
export async function updatePlayerRecordsLose(
  g: GameContext,
  channelId: string,
  gameInfo: GameRecord
) {
  const gamingPlayers: GamingPlayer[] = await g.ctx.database.get(
    "wordle_gaming_player_records",
    { channelId }
  );

  for (const player of gamingPlayers) {
    const gameMode = gameInfo.gameMode;
    const [playerInfo] = await g.ctx.database.get("wordle_player_records", {
      userId: player.userId,
    });
    if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
      continue;
    }
    const updatedLose = playerInfo.lose + 1;
    playerInfo.stats[gameMode].lose += 1;

    if (gameInfo.gameMode === "词影") {
      if (gameInfo.wordlesNum === 1) {
        if (gameInfo.isHardMode) {
          playerInfo.extraCiyingRankInfo.loseIn1HardMode += 1;
        } else {
          playerInfo.extraCiyingRankInfo.loseIn1Mode += 1;
        }
      } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
        const extraCiyingRankInfoKey = `loseIn${gameInfo.wordlesNum}Mode`;
        playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
      }
    }

    const updateData = {
      stats: playerInfo.stats,
      lose: updatedLose,
    };

    if (gameInfo.gameMode === "词影") {
      updateData["extraCiyingRankInfo"] = playerInfo.extraCiyingRankInfo;
    }

    await g.ctx.database.set(
      "wordle_player_records",
      { userId: player.userId },
      updateData
    );
  }
}

// 玩家获胜时更新其胜负统计。
export async function updatePlayerRecordsWin(
  g: GameContext,
  channelId: string,
  gameInfo: GameRecord
) {
  const gamingPlayers: GamingPlayer[] = await g.ctx.database.get(
    "wordle_gaming_player_records",
    { channelId }
  );

  for (const player of gamingPlayers) {
    const gameMode = gameInfo.gameMode;
    const [playerInfo] = await g.ctx.database.get("wordle_player_records", {
      userId: player.userId,
    });
    if (!playerInfo || !playerInfo.stats.hasOwnProperty(gameMode)) {
      continue;
    }
    const updatedWin = playerInfo.win + 1;
    playerInfo.stats[gameMode].win += 1;

    if (gameInfo.gameMode === "词影") {
      if (gameInfo.wordlesNum === 1) {
        if (gameInfo.isHardMode) {
          playerInfo.extraCiyingRankInfo.winIn1HardMode += 1;
        } else {
          playerInfo.extraCiyingRankInfo.winIn1Mode += 1;
        }
      } else if (gameInfo.wordlesNum >= 2 && gameInfo.wordlesNum <= 4) {
        const extraCiyingRankInfoKey = `winIn${gameInfo.wordlesNum}Mode`;
        playerInfo.extraCiyingRankInfo[extraCiyingRankInfoKey] += 1;
      }
    }

    const updateData = {
      stats: playerInfo.stats,
      win: updatedWin,
    };

    if (gameInfo.gameMode === "词影") {
      updateData["extraCiyingRankInfo"] = playerInfo.extraCiyingRankInfo;
    }

    await g.ctx.database.set(
      "wordle_player_records",
      { userId: player.userId },
      updateData
    );
  }
}

// 汇总多词模式下各额外记录的进度信息。
export async function processExtraGameInfos(
  g: GameContext,
  channelId: string
): Promise<string> {
  const extraGameInfos: ExtraGameRecord[] = await g.ctx.database.get(
    "extra_wordle_game_records",
    { channelId }
  );

  return extraGameInfos
    .map(
      ({
        correctLetters,
        presentLetters,
        absentLetters,
        presentLettersWithIndex,
        presentPinyinsWithIndex,
        correctPinyinsWithIndex,
        correctTonesWithIndex,
        presentTonesWithIndex,
        presentTones,
        absentTones,
        absentPinyins,
        presentPinyins,
      }) => {
        const present =
          presentLetters.length === 0 ? "" : `\n包含：【${presentLetters}】`;
        const absent =
          absentLetters.length === 0 ? "" : `\n不包含：【${absentLetters}】`;
        const presentWithoutIndex =
          presentLettersWithIndex.length === 0
            ? ""
            : `\n位置排除：【${presentLettersWithIndex.join(", ")}】`;

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
        return `\n当前进度：【${correctLetters.join(
          ""
        )}】${present}${absent}${presentWithoutIndex}${pinyinsCorrectInfo}${pinyinsPresentInfo}${pinyinsAbsentInfo}${pinyinsPresentWithIndexInfo}${tonesCorrectInfo}${tonesPresentInfo}${tonesAbsentInfo}${tonesPresentWithIndexInfo}`;
      }
    )
    .join("\n");
}

// 汇总多词模式下各额外记录的答案信息。
export async function processExtraGameRecords(
  g: GameContext,
  channelId: string
): Promise<string> {
  const extraGameInfos: ExtraGameRecord[] = await g.ctx.database.get(
    "extra_wordle_game_records",
    { channelId }
  );

  const resultStrings: string[] = extraGameInfos.map((info) => {
    return `\n答案是：【${info.wordGuess}】${
      info.wordAnswerChineseDefinition !== ""
        ? `${
            info.pinyin === "" ? "" : `\n拼音为：【${info.pinyin}】`
          }\n释义如下：\n${replaceEscapeCharacters(
            info.wordAnswerChineseDefinition
          )}`
        : ""
    }`;
  });

  return resultStrings.join("\n");
}
