import type { GameContext } from "../context";
import type { PlayerRecord } from "../types";
import { formatGameDuration2 } from "../utils/time";
import { sendMessage } from "./message";
import { renderPanel } from "./renderer";

/**
 * 排行榜的统一出口：标题一行，名次多到超过五行就出图，
 * 图渲染不可用时回退成同一份数据的文本。空榜走空状态的三段。
 */
async function sendLeaderboard(
  g: GameContext,
  session: any,
  title: string,
  rows: { name: string; value: string }[]
) {
  if (rows.length === 0) {
    return await sendMessage(
      g,
      session,
      `📋 排行榜还空着\n第一个上榜的人，名字会写在这里。\n发送「wordle.开始」开一局。`
    );
  }

  const lines = rows.map(
    (row, index) => `${index + 1}. ${row.name}：${row.value}`
  );
  const panel = await renderPanel(
    g,
    rows.map((row, index) => ({
      lead: String(index + 1),
      name: row.name,
      value: row.value,
    })),
    true
  );

  return await sendMessage(
    g,
    session,
    panel ? `📋 ${title}\n${panel}` : `📋 ${title}\n${lines.join("\n")}`
  );
}

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

  let winCountField = isHardMode ? "winIn1HardMode" : "winIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    winCountField = `winIn${wordlesNum}Mode`;
  }

  const sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[winCountField] -
      a.extraCiyingRankInfo[winCountField]
  );
  const rows = sortedPlayers.slice(0, number).map((player) => ({
    name: player.username,
    value: `${player.extraCiyingRankInfo[winCountField]} 次`,
  }));

  return await sendLeaderboard(g, session, title, rows);
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

  let loseCountField = isHardMode ? "loseIn1HardMode" : "loseIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    loseCountField = `loseIn${wordlesNum}Mode`;
  }

  const sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[loseCountField] -
      a.extraCiyingRankInfo[loseCountField]
  );
  const rows = sortedPlayers.slice(0, number).map((player) => ({
    name: player.username,
    value: `${player.extraCiyingRankInfo[loseCountField]} 次`,
  }));

  return await sendLeaderboard(g, session, title, rows);
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

  let fastestGuessTimeField = isHardMode
    ? "fastestGuessTimeIn1HardMode"
    : "fastestGuessTimeIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    fastestGuessTimeField = `fastestGuessTimeIn${wordlesNum}Mode`;
  }

  const sortedPlayers = getPlayers
    .filter((player) => player.extraCiyingRankInfo[fastestGuessTimeField] > 0)
    .sort(
      (a, b) =>
        a.extraCiyingRankInfo[fastestGuessTimeField] -
        b.extraCiyingRankInfo[fastestGuessTimeField]
    );
  const rows = sortedPlayers.slice(0, number).map((player) => ({
    name: player.username,
    value: formatGameDuration2(
      player.extraCiyingRankInfo[fastestGuessTimeField]
    ),
  }));

  return await sendLeaderboard(g, session, title, rows);
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

  let successCountField = isHardMode
    ? "successCountIn1HardMode"
    : "successCountIn1Mode";

  if (wordlesNum >= 2 && wordlesNum <= 4) {
    successCountField = `successCountIn${wordlesNum}Mode`;
  }

  const sortedPlayers = getPlayers.sort(
    (a, b) =>
      b.extraCiyingRankInfo[successCountField] -
      a.extraCiyingRankInfo[successCountField]
  );
  const rows = sortedPlayers.slice(0, number).map((player) => ({
    name: player.username,
    value: `${player.extraCiyingRankInfo[successCountField]} 次`,
  }));

  return await sendLeaderboard(g, session, title, rows);
}

// 通用排行榜（猜出次数、总胜场/输场）。
export async function getLeaderboard(
  g: GameContext,
  session: any,
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
  const rows = sortedPlayers.slice(0, number).map((player) => ({
    name: player.username,
    value: `${(player as any)[sortField]} 次`,
  }));

  return await sendLeaderboard(g, session, title, rows);
}

// 某模式的胜场/输场排行榜。
export async function getLeaderboardWinOrLose(
  g: GameContext,
  session: any,
  type,
  number,
  statKey,
  label
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );

  getPlayers.sort(
    (a, b) =>
      (b.stats[type]?.[statKey] || 0) - (a.stats[type]?.[statKey] || 0)
  );

  const rows = getPlayers
    .slice(0, number)
    .map((player) => ({
      name: player.username,
      value: `${player.stats[type]?.[statKey] ?? 0} 次`,
    }));

  return await sendLeaderboard(g, session, `${type}模式${label}排行榜`, rows);
}

// 某模式的最快用时排行榜。
export async function getLeaderboardFastestGuessTime(
  g: GameContext,
  session: any,
  type: string,
  number: number
) {
  const getPlayers: PlayerRecord[] = await g.ctx.database.get(
    "wordle_player_records",
    {}
  );
  const rows = getPlayers
    .filter((player) => player.fastestGuessTime[type] > 0)
    .sort((a, b) => a.fastestGuessTime[type] - b.fastestGuessTime[type])
    .slice(0, number)
    .map((player) => ({
      name: player.username,
      value: formatGameDuration2(player.fastestGuessTime[type]),
    }));

  return await sendLeaderboard(g, session, `${type}模式最快用时排行榜`, rows);
}
