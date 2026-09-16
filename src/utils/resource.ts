import * as fs from "fs";
import * as path from "path";

// 模块所在目录有两种取值。开发模式（esbuild-register）按源码位置加载模块，
// 本文件在 src/utils 下，__dirname 是 src/utils；生产模式整包被打进 lib/index.js，
// 包里所有模块的 __dirname 都是 lib。
// 资源根取这两种情形的同一层：lib 自身，或 src 下模块的上一级 src。
const moduleDir = __dirname;
const root =
  path.basename(moduleDir) === "lib" ? moduleDir : path.resolve(moduleDir, "..");

// 资源根下应有 assets/ 与 emptyHtml.html。缺一项就说明资源没随构建产出，直接报错。
const missing = ["assets", "emptyHtml.html"].filter(
  (entry) => !fs.existsSync(path.join(root, entry))
);
if (missing.length > 0) {
  throw new Error(`资源根 ${root} 缺少 ${missing.join("、")}`);
}

/** 资源根。开发模式是包内 src/，生产模式是包内 lib/。 */
export const resourceRoot = root;

/** 取资源根下的路径。 */
export function resource(...segments: string[]): string {
  return path.join(resourceRoot, ...segments);
}
