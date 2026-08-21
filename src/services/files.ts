import * as fs from "fs";
import type { Logger } from "koishi";

// 文件读写辅助工具（启动时初始化数据目录用）。

export async function writeJSONFile(filePath: string, data: any) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData, "utf-8");
}

export async function readJSONFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }
  return [];
}

export async function ensureFileExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
}

export async function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 把源文件中缺失的数据同步追加到目标文件（按指定属性去重）。
export async function updateDataInTargetFile(
  logger: Logger,
  newFilePath: string,
  targetFilePath: string,
  missingProperty: string
): Promise<void> {
  try {
    const [newData, targetData] = await Promise.all([
      readJSONFile(newFilePath),
      readJSONFile(targetFilePath),
    ]);

    const targetDataMap = new Map(
      targetData.map((item: any) => [item[missingProperty], item])
    );

    const missingData = newData.filter(
      (dataItem: any) => !targetDataMap.has(dataItem[missingProperty])
    );

    targetData.push(...missingData);
    await writeJSONFile(targetFilePath, targetData);

    if (missingData.length > 0) {
      logger.success("添加的对象：", missingData);
    }
  } catch (error) {
    logger.error("发生错误：", error);
  }
}
