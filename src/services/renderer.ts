import * as path from "path";
import type { GameContext } from "../context";
import { htmlAfterStyle, htmlPrefix, htmlSuffix } from "../html/template";

// 使用 puppeteer 打开页面并截图，返回图片 Buffer。
// 各类游戏画面共用同一套「打开空页面 -> setContent -> 截图」的流程。

// 生成 Wordle 类游戏画面。
export async function generateImage(
  g: GameContext,
  styledHtml: string,
  gridHtml: string
): Promise<Buffer> {
  const browser = g.ctx.puppeteer.browser;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 611, height: 731, deviceScaleFactor: 1 });
  const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
  await page.goto("file://" + filePath);

  const html = `${htmlPrefix}
    ${styledHtml}
    ${htmlAfterStyle(g.config)}
    <div class="Board-module_board__jeoPS" style="width: 600px; height: 720px;">
      ${gridHtml}
    </div>
    ${htmlSuffix}`;

  await page.setContent(html, { waitUntil: "load" });
  const imageBuffer = await page.screenshot({
    fullPage: true,
    type: g.config.imageType,
  });
  await page.close();
  await context.close();

  return imageBuffer;
}

// 生成「词影」游戏画面。
export async function generateImageForCiying(
  g: GameContext,
  gridHtml: string,
  rowNum: number
): Promise<Buffer> {
  const browser = g.ctx.puppeteer.browser;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({
    width: 611,
    height: 140 * rowNum,
    deviceScaleFactor: 1,
  });
  const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
  await page.goto("file://" + filePath);

  const html = `<html lang="zh" class="h-full ${
    g.config.isDarkThemeEnabled ? "dark" : ""
  }">
<head>
    <meta charset="UTF-8">
    <title>词影</title>
    <link rel="stylesheet" href="./assets/词影/ciying.css">
        <style>
        .container {
            padding-top: 10px;
            padding-bottom: 10px;
        }
    </style>
</head>

<body class="h-full overflow-y-hidden dark:bg-neutral-900 dark:text-white">
<div class="container">

<div class="flex h-full w-full flex-col">

    <div class="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden">
        <div class="flex h-full items-center justify-center overflow-y-auto">
            <div class="max-h-full">
                <div class="grid grid-rows-5 gap-2 py-2">
${gridHtml}
                </div>
            </div>
        </div>
    </div>
</div>
</div>

</body>
</html>`;

  await page.setContent(html, { waitUntil: "load" });
  const imageBuffer = await page.screenshot({
    fullPage: true,
    type: g.config.imageType,
  });
  await page.close();
  await context.close();

  return imageBuffer;
}

// 生成「汉兜」游戏画面。
export async function generateImageForHandle(
  g: GameContext,
  gridHtml: string
): Promise<Buffer> {
  const browser = g.ctx.puppeteer.browser;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 611, height: 731, deviceScaleFactor: 1 });
  const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
  await page.goto("file://" + filePath);

  const html = `<html lang="en" class="${
    g.config.isDarkThemeEnabled ? "dark" : ""
  }" style="--vh: 7.55px;">
<head>
    <meta charset="UTF-8">
    <title>汉兜 - 汉字 Wordle</title>
    <link rel="stylesheet" href="./assets/汉兜/handle.css">
    <style>
        .container {
            padding-top: 30px;
            padding-bottom: 30px;
        }
    </style>
</head>
<body>
<div class="container">
    <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class="${
      g.config.isHighContrastThemeEnabled ? "colorblind" : ""
    }">
        <div flex="~ col" items-center="">
           ${gridHtml}
        </div>
    </main>
</div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: "load" });
  const imageBuffer = await page.screenshot({
    fullPage: true,
    type: g.config.imageType,
  });
  await page.close();
  await context.close();

  return imageBuffer;
}

// 生成「汉兜」拼音速查表图片。
export async function generateHandlePinyinsImage(
  g: GameContext,
  pinyinsHtml: string
) {
  const browser = g.ctx.puppeteer.browser;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 420, height: 570, deviceScaleFactor: 1 });
  const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
  await page.goto("file://" + filePath);

  const html = `<html lang="en" class="${
    g.config.isDarkThemeEnabled ? "dark" : ""
  }" style="--vh: 6.04px;">
    <head>
        <meta charset="UTF-8">
        <title>汉兜 - 汉字 Wordle</title>
        <link rel="stylesheet" href="./assets/汉兜/handle.css">
    </head>
    <body>
        <div id="app" data-v-app="">
            <main font-sans="" text="center gray-700 dark:gray-300" select-none="" class=""><!---->
                <div fixed="" z-40="" class="bottom-0 left-0 right-0 top-0">
                    <div class="bg-base left-0 right-0 top-0 bottom-0 absolute transition-opacity duration-500 ease-out opacity-50"></div>
                    <div class="bg-base border-base absolute transition-all duration-200 ease-out max-w-screen max-h-screen overflow-auto scrolls top-0 left-0 right-0 border-b"
                         style="">
                        <div p8="" pt4="" flex="~ col center" relative=""><p text-xl="" font-serif="" mb8=""><b>拼音速查表</b></p>
                            <div grid="~ cols-[1fr_3fr] gap-x-10 gap-y-4" font-mono="" font-light="">
                                <div text-center="">声母</div>
                                <div text-center="">韵母</div>
                                    ${pinyinsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
</html>`;

  await page.setContent(html, { waitUntil: "load" });
  const imageBuffer = await page.screenshot({
    fullPage: true,
    type: g.config.imageType,
  });
  await page.close();
  await context.close();

  return imageBuffer;
}

// 生成多词（wordles）模式的合成图。
export async function generateWordlesImage(
  g: GameContext,
  htmlImgString: string
) {
  const browser = g.ctx.puppeteer.browser;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({
    width: g.config.compositeImagePageWidth,
    height: g.config.compositeImagePageHeight,
    deviceScaleFactor: 1,
  });
  const filePath = path.join(__dirname, "emptyHtml.html").replace(/\\/g, "/");
  await page.goto("file://" + filePath);

  const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            .image-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: space-between;
                align-items: center;
            }
            .image-container img {
                max-width: 100%;
            }
        </style>
        <script>
            window.onload = function() {
                var imageContainer = document.querySelector('.image-container');
                var images = imageContainer.getElementsByTagName('img');

                if (images.length > 4) {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(25% - 15px)";
                    }
                } else {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(50% - 10px)";
                    }
                }
            };
        </script>
    </head>
    <body>
    <div class="image-container">
    ${htmlImgString}
    </div>
    </body>
    </html>`;

  await page.setContent(html, { waitUntil: "load" });
  const wordlesImageBuffer = await page.screenshot({
    fullPage: true,
    type: g.config.imageType,
  });
  await page.close();
  await context.close();

  return wordlesImageBuffer;
}
