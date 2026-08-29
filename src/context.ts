import type { Context, Logger } from "koishi";
import type { Config } from "./config";
import type { Idiom, PinyinItem2 } from "./types";

// 插件运行时的共享上下文，聚合所有模块所需的依赖与运行时状态。
// 通过显式传参代替原来大闭包中的隐式捕获，使各模块职责清晰、便于测试。
export interface GameContext {
  ctx: Context;
  config: Config;
  logger: Logger;

  // 文件路径
  paths: {
    wordleGameDir: string;
    idioms: string;
    pinyin: string;
    strokes: string;
    equations: string;
    introduction: string;
    idiomsKoishi: string;
    pinyinKoishi: string;
  };

  // 加载进内存的数据
  data: {
    idiomsList: Idiom[];
    pinyinData: PinyinItem2[];
    strokesData: Record<string, any>;
    equations: string[][];
    introductionImgBuffer: Buffer;
  };

  // 消息状态（用于撤回）
  lastMessageInfo: Map<string, { id: string; timestamp: number }>;
}
