// 在 yakumo 构建流程中，esbuild 只会打包入口文件（lib/index.js），
// 而 src 中通过 __dirname 在运行时读取的静态资源不会被复制到 lib 目录。
// 本脚本在 esbuild 步骤完成后执行，把这些资源同步到 lib/ 下。
import { cp, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// 先清掉旧的资源目录，避免残留过期文件，再整体复制
await rm(join(root, "lib", "assets"), { recursive: true, force: true })
await mkdir(join(root, "lib"), { recursive: true })
await cp(join(root, "src", "assets"), join(root, "lib", "assets"), {
  recursive: true,
  force: true,
})
await cp(join(root, "src", "emptyHtml.html"), join(root, "lib", "emptyHtml.html"), {
  force: true,
})

console.log("copied assets and emptyHtml.html to lib/")
