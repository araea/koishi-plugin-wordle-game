import type { GameContext } from "../context";

// 获取会话用户在当前上下文中的显示名。
export async function getSessionUserName(
  _g: GameContext,
  session: any
): Promise<string> {
  return session.username;
}
