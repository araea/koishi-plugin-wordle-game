import { h } from "koishi";
import type { GameContext } from "../context";
import type { Button } from "../types";
import { replaceSymbols } from "../utils/string";

// 拆分 Markdown 命令字符串为命令数组。
export function parseMarkdownCommands(markdownCommands: string): string[] {
  return markdownCommands
    .split(" ")
    .filter((command) => command.trim() !== "");
}

// 根据 Markdown 命令生成 QQ 官方机器人的消息按钮。
export async function createButtons(
  g: GameContext,
  session: any,
  markdownCommands: string
): Promise<Button[]> {
  const commands = parseMarkdownCommands(markdownCommands);

  const mapCommandToDataValue = (command: string) => {
    const commandMappings: Record<string, string> = {
      加入游戏: "wordlegame.加入",
      开始游戏: "wordlegame.开始",
      改名: "wordlegame.改名",
      查询玩家记录: "wordlegame.查询玩家记录",
      猜测: "wordlegame.猜",
      随机猜测: "wordlegame.猜 -r",
      输入: "",
      排行榜: "wordlegame.排行榜",
      玩法介绍: "wordlegame.玩法介绍",
      退出游戏: "wordlegame.退出",
      查单词: "wordlegame.查单词",
      查成语: "wordlegame.查成语",
      单词查找器: "wordlegame.单词查找器",
      查询进度: "wordlegame.查询进度",
      拼音速查表: "wordlegame.拼音速查表",
      结束游戏: "wordlegame.结束",
      再来一把: "wordlegame.开始",
      再来一把经典: "wordlegame.开始.经典",
      再来一把CET4: "wordlegame.开始.CET4",
      再来一把CET6: "wordlegame.开始.CET6",
      再来一把GMAT: "wordlegame.开始.GMAT",
      再来一把GRE: "wordlegame.开始.GRE",
      再来一把IELTS: "wordlegame.开始.IELTS",
      再来一把SAT: "wordlegame.开始.SAT",
      再来一把TOEFL: "wordlegame.开始.TOEFL",
      再来一把考研: "wordlegame.开始.考研",
      再来一把专八: "wordlegame.开始.专八",
      再来一把专四: "wordlegame.开始.专四",
      再来一把ALL: "wordlegame.开始.ALL",
      再来一把Lewdle: "wordlegame.开始.Lewdle",
      再来一把汉兜: "wordlegame.开始.汉兜",
      再来一把Numberle: "wordlegame.开始.Numberle",
      再来一把Math: "wordlegame.开始.Math",
      再来一把词影: "wordlegame.开始.词影",
      数字: "Numberle",
      脏话: "Lewdle",
      方程: "Math",
    };

    return commandMappings[command];
  };

  const createButton = async (command: string) => {
    let dataValue = mapCommandToDataValue(command);
    if (dataValue === undefined) {
      dataValue = command;
    }

    return {
      render_data: {
        label: command,
        visited_label: command,
        style: 1,
      },
      action: {
        type: 2,
        permission: { type: 2 },
        data: `${dataValue}`,
        enter: ![
          "加入游戏",
          "猜测",
          "查询玩家记录",
          "改名",
          "输入",
          "困难",
          "超困难",
          "变态",
          "变态挑战",
          "x1",
          "x2",
          "x3",
          "x4",
          "自由",
          "全成语",
        ].includes(command),
      },
    };
  };

  const buttonPromises = commands.map(createButton);
  return Promise.all(buttonPromises);
}

// 统一的发送消息入口，兼容 QQ 官方机器人 Markdown 模板与文本转图片。
export async function sendMessage(
  g: GameContext,
  session: any,
  message: any,
  markdownCommands: string,
  numberOfMessageButtonsPerRow?: number,
  isButton?: boolean
): Promise<void> {
  const config = g.config;
  isButton = isButton || false;
  numberOfMessageButtonsPerRow =
    numberOfMessageButtonsPerRow || config.numberOfMessageButtonsPerRow;
  const { bot, channelId } = session;
  let messageId;
  if (g.isQQOfficialRobotMarkdownTemplateEnabled && session.platform === "qq") {
    const msgSeq = g.msgSeqMap[session.messageId] || 10;
    g.msgSeqMap[session.messageId] = msgSeq + 100;
    const buttons = await createButtons(g, session, markdownCommands);

    const rows = [];
    let row = { buttons: [] };
    buttons.forEach((button, index) => {
      row.buttons.push(button);
      if (
        row.buttons.length === 5 ||
        index === buttons.length - 1 ||
        row.buttons.length === numberOfMessageButtonsPerRow
      ) {
        rows.push(row);
        row = { buttons: [] };
      }
    });

    if (!isButton && config.isTextToImageConversionEnabled) {
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

      if (config.isTextToImageConversionEnabled && markdownCommands !== "") {
        await sendMessage(
          g,
          session,
          "",
          markdownCommands,
          numberOfMessageButtonsPerRow,
          true
        );
      }
    } else if (isButton && config.isTextToImageConversionEnabled) {
      const result = await session.qq.sendMessage(session.channelId, {
        msg_type: 2,
        msg_id: session.messageId,
        msg_seq: msgSeq,
        content: "",
        markdown: {
          custom_template_id: config.customTemplateId,
          params: [
            {
              key: config.key,
              values: [`<@${session.userId}>`],
            },
          ],
        },
        keyboard: {
          content: {
            rows: rows.slice(0, 5),
          },
        },
      });
      messageId = result.id;
    } else {
      if (message.attrs?.src || message.includes("<img")) {
        [messageId] = await session.send(message);
      } else {
        message = replaceSymbols(
          message.replace(/\n/g, "\r").replace(/\*/g, "？")
        );

        const result = await session.qq.sendMessage(session.channelId, {
          msg_type: 2,
          msg_id: session.messageId,
          msg_seq: msgSeq,
          content: "111",
          markdown: {
            custom_template_id: config.customTemplateId,
            params: [
              {
                key: config.key,
                values: [`${message}`],
              },
            ],
          },
          keyboard: {
            content: {
              rows: rows.slice(0, 5),
            },
          },
        });

        messageId = result.id;
      }
    }
  } else {
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
