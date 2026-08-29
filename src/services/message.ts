import { h } from "koishi";
import type { GameContext } from "../context";

// 统一的发送消息入口，支持文本转图片与自动撤回。
export async function sendMessage(
  g: GameContext,
  session: any,
  message: any
): Promise<void> {
  const config = g.config;
  const { bot, channelId } = session;
  let messageId;
  if (config.isTextToImageConversionEnabled) {
    const lines = message.toString().split("\n");
    const isOnlyImgTag =
      lines.length === 1 && lines[0].trim().startsWith("<img");
    if (isOnlyImgTag) {
      [messageId] = await session.send(message);
    } else {
      const modifiedMessage = lines
        .map((line) => {
          if (line.trim() !== "" && !line.includes("<img")) {
            return `# ${line}`;
          } else {
            return line + "\n";
          }
        })
        .join("\n");
      g.ctx.inject(["markdownToImage"], async (ctx) => {
        const imageBuffer = await ctx.markdownToImage.convertToImage(
          modifiedMessage
        );
        [messageId] = await session.send(
          h.image(imageBuffer, `image/${config.imageType}`)
        );
      });
    }
  } else {
    [messageId] = await session.send(message);
  }

  if (config.retractDelay > 0 && messageId) {
    const prevMessage = g.lastMessageInfo.get(channelId);

    if (prevMessage) {
      const timePassed = Date.now() - prevMessage.timestamp;
      const remainingDelay = config.retractDelay * 1000 - timePassed;

      if (timePassed < 118000) {
        // 留 2 秒余量；用 ctx.setTimeout 以便插件停用时一并清理
        g.ctx.setTimeout(() => {
          bot.deleteMessage(channelId, prevMessage.id).catch((error) => {
            g.logger.warn(
              `Failed to retract message ${prevMessage.id}: ${error.message}`
            );
          });
        }, Math.max(0, remainingDelay));
      }
    }

    g.lastMessageInfo.set(channelId, { id: messageId, timestamp: Date.now() });
  }
}

// 将消息中的 at 标签补充用户名。
export async function replaceAtTags(
  session: any,
  content: string
): Promise<string> {
  const atRegex = /<at id="(\d+)"(?: name="([^"]*)")?\/>/g;

  let match;
  while ((match = atRegex.exec(content)) !== null) {
    const userId = match[1];
    const name = match[2];

    if (!name) {
      let guildMember;
      try {
        guildMember = await session.bot.getGuildMember(
          session.guildId,
          userId
        );
      } catch (error) {
        guildMember = {
          user: {
            name: "未知用户",
          },
        };
      }

      const newAtTag = `<at id="${userId}" name="${guildMember.user.name}"/>`;
      content = content.replace(match[0], newAtTag);
    }
  }

  return content;
}
