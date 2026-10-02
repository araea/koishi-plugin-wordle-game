import { Session } from 'koishi'

export interface HelpEntry { name: string; description: string }

/**
 * 主指令帮助的内容：从已注册的指令树现取标题与直接子指令，不依赖 help 插件，也不会和指令脱节。
 * `order` 列出希望靠前的子指令（完整指令名），没列到的按注册顺序排在后面；排版交给各插件。
 * 不要在动作里 `session.execute('… -h')` 转发：`-h` 由 help 插件提供，缺它指令会无限调用自己。
 */
export function helpOf(session: Session, name: string, order: string[] = []): { title: string; entries: HelpEntry[] } {
  const describe = (command: string) => session.text([`commands.${command}.description`, ''])
  const rank = (command: string) => { const i = order.indexOf(command); return i < 0 ? order.length : i }
  const entries: HelpEntry[] = []
  for (const child of session.app.$commander.get(name)?.children ?? []) {
    // `hidden` 是 help 插件补进指令配置的字段；没装它时为 undefined，指令照常列出。
    const { hidden } = child.config as { hidden?: boolean | ((session: Session) => boolean) }
    if (!child.match(session) || session.resolve(hidden)) continue
    entries.push({ name: child.name, description: describe(child.name) })
  }
  entries.sort((a, b) => rank(a.name) - rank(b.name))
  return { title: describe(name), entries }
}
