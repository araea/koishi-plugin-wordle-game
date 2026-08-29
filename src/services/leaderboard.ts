import type { GameContext } from "../context";
import type { PlayerRecord } from "../types";
import { formatGameDuration2 } from "../utils/time";
import { sendMessage } from "./message";

// 词影胜场排行榜。
export async function getWinCountLeaderboardForCiying(
  g: GameContext,
  session: any,
  wordlesNum: number,
  title: string,
  number: number,
  isHardMode: boolean
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  let sortedPlayers;
  let result = "";

  let winCountField = isHardMode ? "winIn1HardMode" : "winIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    winCountField = `winIn${wordlesNum}Mode`;
  }

  sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[winCountField] -
      a.extraCiyingRankInfo[winCountField]
  );
  const topPlayers = sortedPlayers.slice(0, number);

  result = `${title}：\n`;
  topPlayers.forEach((player, index) => {
    result += `${index + 1}. ${player.username}：${
      player.extraCiyingRankInfo[winCountField]
    } 次\n`;
  });

  return await sendMessage(g, session, result, `开始游戏 排行榜`);
}

// 词影输场排行榜。
export async function getLoseCountLeaderboardForCiying(
  g: GameContext,
  session: any,
  wordlesNum: number,
  title: string,
  number: number,
  isHardMode: boolean
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  let sortedPlayers;
  let result = "";

  let loseCountField = isHardMode ? "loseIn1HardMode" : "loseIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    loseCountField = `loseIn${wordlesNum}Mode`;
  }

  sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[loseCountField] -
      a.extraCiyingRankInfo[loseCountField]
  );
  const topPlayers = sortedPlayers.slice(0, number);

  result = `${title}：\n`;
  topPlayers.forEach((player, index) => {
    result += `${index + 1}. ${player.username}：${
      player.extraCiyingRankInfo[loseCountField]
    } 次\n`;
  });

  return await sendMessage(g, session, result, `开始游戏 排行榜`);
}

// 词影最快用时排行榜。
export async function getFastestGuessTimeLeaderboardForCiying(
  g: GameContext,
  session: any,
  wordlesNum: number,
  title: string,
  number: number,
  isHardMode: boolean
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  let sortedPlayers;
  let result = "";

  let fastestGuessTimeField = isHardMode
    ? "fastestGuessTimeIn1HardMode"
    : "fastestGuessTimeIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    fastestGuessTimeField = `fastestGuessTimeIn${wordlesNum}Mode`;
  }

  sortedPlayers = getPlayers
    .filter((player) => player.extraCiyingRankInfo[fastestGuessTimeField] > 0)
    .sort(
      (a, b) =>
        a.extraCiyingRankInfo[fastestGuessTimeField] -
        b.extraCiyingRankInfo[fastestGuessTimeField]
    );
  const topPlayers = sortedPlayers.slice(0, number);

  result = `${title}：\n`;
  topPlayers.forEach((player, index) => {
    result += `${index + 1}. ${player.username}：${formatGameDuration2(
      player.extraCiyingRankInfo[fastestGuessTimeField]
    )}\n`;
  });

  return await sendMessage(g, session, result, `开始游戏 排行榜`);
}

// 词影猜出次数排行榜。
export async function getCiyingSuccessCountLeaderboardForCiying(
  g: GameContext,
  session: any,
  wordlesNum: number,
  sortField: string,
  title: string,
  number: number,
  isHardMode: boolean
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  let sortedPlayers;
  let result = "";

  let successCountField = isHardMode
    ? "successCountIn1HardMode"
    : "successCountIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    successCountField = `successCountIn${wordlesNum}Mode`;
  }

  sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[successCountField] -
      a.extraCiyingRankInfo[successCountField]
  );
  const topPlayers = sortedPlayers.slice(0, number);

  result = `${title}：\n`;
  topPlayers.forEach((player, index) => {
    result += `${index + 1}. ${player.username}：${
      player.extraCiyingRankInfo[successCountField]
    } 次\n`;
  });

  return await sendMessage(g, session, result, `开始游戏 排行榜`);
}

// 通用排行榜（损益、猜出次数、总胜场/输场）。
export async function getLeaderboard(
  g: GameContext,
  session: any,
  type: string,
  sortField: string,
  title: string,
  number: number
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  const sortedPlayers = getPlayers.sort(
    (a, b) => (b as any)[sortField] - (a as any)[sortField]
  );
  const topPlayers = sortedPlayers.slice(0, number);

  let result = `${title}：\n`;
  topPlayers.forEach((player, index) => {
    result += `${index + 1}. ${player.username}：${
      (player as any)[sortField]
    } ${type === "moneyChange" ? "点" : "次"}\n`;
  });
  return await sendMessage(g, session, result, `开始游戏 排行榜`);
}

// 某模式的胜场/输场排行榜。
export async function getLeaderboardWinOrLose(
  g: GameContext,
  type,
  number,
  statKey,
  label
) {
  if (typeof number !== "number" || isNaN(number) || number < 0) {
    return "请输入不小于 0 的数字作为排行榜的参数。";
  }
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );

  getPlayers.sort(
    (a, b) =>
      (b.stats[type]?.[statKey] || 0) - (a.stats[type]?.[statKey] || 0)
  );

  const leaderboard: string[] = getPlayers
    .slice(0, number)
    .map(
      (player, index) =>
        `${index + 1}. ${player.username}：${
          player.stats[type]?.[statKey]
        } 次`
    );

  return `${type}模式${label}排行榜：\n${leaderboard.join("\n")}`;
}

// 某模式的最快用时排行榜。
export async function getLeaderboardFastestGuessTime(
  g: GameContext,
  type: string,
  number: number
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  const leaderboard = getPlayers
    .filter((player) => player.fastestGuessTime[type] > 0)
    .sort((a, b) => a.fastestGuessTime[type] - b.fastestGuessTime[type])
    .slice(0, number)
    .map(
      (player, index) =>
        `${index + 1}. ${player.username}：${formatGameDuration2(
          player.fastestGuessTime[type]
        )}`
    )
    .join("\n");

  return `${type}模式最快用时排行榜：\n${leaderboard}`;
}
