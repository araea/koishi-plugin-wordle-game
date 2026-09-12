import * as fs from "fs";
import { load } from "cheerio";
import type { GameContext } from "../context";
import type { ChatCompletion, Idiom } from "../types";
import { isIdiomInList } from "../utils/idiom";

// 把成语写入 JSON 文件。
export function writeIdiomsToFile(
  g: GameContext,
  filePath: string,
  idiomsList: Idiom[]
): void {
  try {
    const jsonData = JSON.stringify(idiomsList, null, 2);
    fs.writeFileSync(filePath, jsonData, "utf-8");
  } catch (error) {
    g.logger.error("将词语|成语写入文件时出错：", error);
  }
}

/**
 * 调用 OpenAI 兼容接口为生僻四字词生成拼音。
 * 接口地址、密钥与模型都来自配置——早先版本把一个真实的 API Key 硬编码在这里。
 */
export async function sendPostRequestForAI(
  g: GameContext,
  content: string
): Promise<string> {
  const { pinyinApiEndpoint, pinyinApiKey, pinyinApiModel, requestTimeout } = g.config;
  if (!pinyinApiKey) {
    g.logger.info("未配置拼音接口的 API Key，跳过 AI 生成拼音。");
    return "";
  }

  const prompt = `# 汉语拼音生成器
- 提供一个四个汉字的词语，期望输出对应的正确的汉语拼音。
- 只输出汉语拼音，不包含其他无关内容。

示例输入:
戒奢宁俭

期望输出:
jiè shē nìng jiǎn

输入：
${content}

输出：`;

  try {
    const data = await g.ctx.http.post<ChatCompletion>(
      pinyinApiEndpoint,
      {
        messages: [{ role: "user", content: prompt }],
        stream: false,
        model: pinyinApiModel,
        temperature: 0.5,
        presence_penalty: 2,
      },
      {
        headers: { Authorization: `Bearer ${pinyinApiKey}` },
        timeout: requestTimeout,
      }
    );
    return data?.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    g.logger.error("调用拼音接口失败：", error);
    return "";
  }
}

// 调用 wordword.org 接口获取单词定义。
export async function fetchWordDefinitions(g: GameContext, word: string) {
  return g.ctx.http.post<any>(
    "https://wordword.org/api/words/get_by_word",
    { word },
    { timeout: g.config.requestTimeout }
  );
}

// 把词性分组的定义序列化为文本。
export function serializeDefinitions(definitions: { [part: string]: any }) {
  let resultString = "";
  for (const part in definitions) {
    resultString += `${part}.\n`;
    definitions[part].forEach((definition: any) => {
      resultString += `- ${definition.text}\n`;
    });
    resultString += "\n";
  }
  return resultString;
}

// 从汉典获取成语拼音与解释。
// 汉典改版后词语、成语、国语辞典各用一套结构，按优先级依次尝试。
export async function getIdiomInfo(
  g: GameContext,
  idiom: string
): Promise<{ pinyin: string; explanation: string }> {
  const { idiomsList } = g.data;
  try {
    const html = await g.ctx.http.get<string>(
      `https://zdic.net/hans/${encodeURIComponent(idiom)}`,
      { responseType: "text", timeout: g.config.requestTimeout }
    );

    const $ = load(html);

    const pinyin = $(".word-pronun-text")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const pickTexts = (selector: string) =>
      $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 0);

    let explanationParts = pickTexts("#xxjs .xxjs-item__def");
    if (explanationParts.length === 0) {
      const idiomDefinition = $("#cy .idiom-entry__line")
        .filter(
          (_, el) => $(el).find(".idiom-entry__label").text().trim() === "解释"
        )
        .find(".idiom-entry__text")
        .text()
        .trim();
      if (idiomDefinition) {
        explanationParts = [idiomDefinition];
      }
    }
    if (explanationParts.length === 0) {
      explanationParts = pickTexts("#gyjs .gy-sense__def");
    }
    const explanation = explanationParts.join("\n");

    if (!pinyin || !explanation) {
      throw new Error("找不到拼音或解释。");
    }
    if (!isIdiomInList(idiom, idiomsList)) {
      const newIdiom: Idiom = {
        idiom,
        pinyin,
        explanation,
      };
      idiomsList.push(newIdiom);
      writeIdiomsToFile(g, g.paths.idiomsKoishi, idiomsList);
    }
    return { pinyin, explanation };
  } catch (error) {
    return { pinyin: "未找到拼音", explanation: "未找到解释" };
  }
}

// 根据随机到的成语，返回其在词库中的完整信息（词库中没有时联网查询）。
// 返回结构仅保证 pinyin 与 explanation，供调用方取拼音与释义。
export async function getSelectedIdiom(
  g: GameContext,
  randomIdiom: string
): Promise<{ pinyin: string; explanation: string } | undefined> {
  const { idiomsList } = g.data;
  let selectedIdiom: { pinyin: string; explanation: string } | undefined =
    undefined;

  if (isIdiomInList(randomIdiom, idiomsList)) {
    const foundIdiom = idiomsList.find((item) => item.idiom === randomIdiom);
    if (foundIdiom) {
      selectedIdiom = foundIdiom;
    }
  } else {
    selectedIdiom = await getIdiomInfo(g, randomIdiom);
  }

  return selectedIdiom;
}
