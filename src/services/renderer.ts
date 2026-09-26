import { load } from 'cheerio';
import { pathToFileURL } from "url";
import { h } from "koishi";
import {} from "koishi-plugin-puppeteer";
import type { GameContext } from "../context";
import { baseline, components, MONO_STACK, scheme, TYPE } from "../m3";
import { htmlAfterStyle, htmlPrefix, htmlSuffix } from "../html/template";
import { resource } from "../utils/resource";

/** 合成图外壳的主色。盘面本身不受影响，这只管它们之间的那层底。 */
const HUE = 142;
const imageDescriptions = new WeakMap<Buffer, string>();
export function imageText(buffer: Buffer): string { return imageDescriptions.get(buffer) ?? '棋盘说明暂不可用，可发送「wordle.查询进度」。' }
export function imageMessage(buffer: Buffer, type: string): h {
  const text = imageText(buffer) ?? '图片内容请使用「wordle.查询进度」查询。';
  return h('p', {}, [ ...(buffer.length ? [h.image(buffer, type)] : []), h('p', {}, h.text(text)) ]);
}

/** 信息面板的宽度，与盘面图一致；高度随内容长。 */
const PANEL_WIDTH = 611;

/** 统一截图：走 Koishi 的 `page()`。词影/汉兜的 CSS 是相对路径，先落到资源根下的空白页才读得到。 */
async function capture(
  g: GameContext,
  html: string,
  viewport: { width: number; height: number },
  fileOrigin = false,
): Promise<Buffer> {
  const $ = load(html);
  $('script,style,link').remove();
  $('img').each((_, element) => { const item = $(element); item.replaceWith($('<p>').text(item.attr('alt') ?? '')); });
  $('[data-state]').each((_, element) => {
    const item = $(element), label = ({ correct: '位置正确', present: '位置不符', absent: '不包含', empty: '空' } as Record<string,string>)[item.attr('data-state') ?? ''];
    if (label) item.append(`（${label}） `);
  });
  $('[data-description]').each((_, element) => { const item = $(element); item.text(item.attr('data-description') ?? ''); });
  $('div,p,li,tr').append('\n');
  const description = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim() || '空棋盘。发送「wordle.查询进度」查看当前对局。';
  let page: Awaited<ReturnType<typeof g.ctx.puppeteer.page>> | undefined;
  let buffer: Buffer = Buffer.alloc(0);
  try {
    page = await g.ctx.puppeteer.page();
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    if (fileOrigin) await page.goto(pathToFileURL(resource('emptyHtml.html')).href);
    await page.setContent(html, { waitUntil: 'load' });
    const c = scheme(HUE, g.config.isDarkThemeEnabled);
    await page.addStyleTag({content: `${baseline(c)} body{background:${c.surface}!important;color:${c.onSurface}!important} input{color:${c.onSurface};border-radius:12px}
.text-ok{color:${c.primary}!important;text-decoration:underline;text-decoration-style:double}.text-mis{color:${c.tertiary}!important;text-decoration:underline;text-decoration-style:dashed}.op35,.op80{opacity:1!important;color:${c.onSurfaceVariant}!important}
.bg-correct{background:${c.primary}!important;border-radius:12px}.fill-correct{fill:${c.primary}!important}.fill-white{fill:${c.onPrimary}!important}
 .bg-base{background:${c.surface}!important} *{animation:none!important;transition:none!important}`});
    buffer = await page.screenshot({ fullPage: true, type: g.config.imageType });
  } catch (error) {
    g.logger.warn('棋盘图片生成失败，保留文字：%s', error);
  } finally {
    await page?.close().catch(() => {});
  }
  imageDescriptions.set(buffer, description);
  return buffer;
}

// 生成 Wordle 类游戏画面。
export async function generateImage(
  g: GameContext,
  styledHtml: string,
  gridHtml: string
): Promise<Buffer> {
  const html = `${htmlPrefix}
    ${styledHtml}
    ${htmlAfterStyle(g.config)}
    <div class="Board-module_board__jeoPS" style="width: 600px; height: 720px;">
      ${gridHtml}
    </div>
    ${htmlSuffix}`;

  return capture(g, html, { width: 611, height: 128 });
}

// 生成「词影」游戏画面。
export async function generateImageForCiying(
  g: GameContext,
  gridHtml: string,
  rowNum: number
): Promise<Buffer> {
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

  return capture(g, html, { width: 611, height: 140 * rowNum }, true);
}

// 生成「汉兜」游戏画面。
export async function generateImageForHandle(
  g: GameContext,
  gridHtml: string
): Promise<Buffer> {
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

  return capture(g, html, { width: 611, height: 731 }, true);
}

// 生成「汉兜」拼音速查表图片。
export async function generateHandlePinyinsImage(
  g: GameContext,
  pinyinsHtml: string
) {
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

  return capture(g, html, { width: 420, height: 570 }, true);
}

/**
 * 生成多词（wordles）模式的合成图。
 *
 * 这张页面是本插件自己的容器——里面那几张盘面分别复刻 Wordle / 汉兜 / 词影，
 * 那是玩家要的样子，一个像素都不该改；但把它们摆在一起的这层外壳归我们，
 * 所以走设计系统：表面色打底、盘面各自嵌进圆角容器、间距落在 4dp 栅格上。
 */
export async function generateWordlesImage(
  g: GameContext,
  htmlImgString: string
) {
  const s = scheme(HUE, g.config.isDarkThemeEnabled);
  const html = `<!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <style>
            ${baseline(s)}
            body {
                padding: 24px;
                background: var(--md-sys-color-surface);
            }
            .image-container {
                display: grid;
                gap: 16px;
                align-items: start;
            }
            /* 四张以内两列，再多就四列——和原先按张数换宽度是同一个规则，
               只是交给 grid 去算，不必等 onload 再逐张改样式 */
            .image-container[data-dense="false"] { grid-template-columns: repeat(2, 1fr); }
            .image-container[data-dense="true"] { grid-template-columns: repeat(4, 1fr); }
            .image-container img {
                display: block;
                width: 100%;
                border-radius: var(--md-sys-shape-corner-large);
                background: var(--md-sys-color-surface-container-low);
            }
        </style>
    </head>
    <body>
    <div class="image-container" data-dense="${(htmlImgString.match(/<img/g) ?? []).length > 4}">
    ${htmlImgString}
    </div>
    </body>
    </html>`;

  return capture(g, html, {
    width: g.config.compositeImagePageWidth,
    height: g.config.compositeImagePageHeight,
  });
}

/** 信息面板的一行：短标记进徽章，名字占主位，值靠右对齐。 */
export interface PanelRow {
  /** 行首的短标记，排行榜与清单是序号。 */
  lead?: string;
  name: string;
  value?: string;
}

/**
 * 生成信息面板图：模式清单、战绩、排行榜共用同一张。
 *
 * 这三处的内容天然长过五行，出图是规范给的办法。面板本身是本插件自己的
 * 外壳，走设计系统；里面的盘面才是不该改的复刻品。前三名用金银铜。
 */
export async function generatePanelImage(
  g: GameContext,
  rows: PanelRow[],
  isRanked = false
): Promise<Buffer> {
  const s = scheme(HUE, g.config.isDarkThemeEnabled);
  const items = rows
    .map((row, index) => {
      const medal = isRanked
        ? ["--gold", "--silver", "--bronze"][index] ?? ""
        : "";
      const badge = row.lead
        ? `<span class="m3-badge${medal ? ` m3-badge${medal}` : ""}">${
            h.escape(row.lead)
          }</span>`
        : "";
      const value = row.value
        ? `<span class="panel-row__value">${h.escape(row.value)}</span>`
        : "";
      return `<li class="m3-list-item">${badge}<span class="panel-row__name">${h.escape(row.name)}</span>${value}</li>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <style>
            ${baseline(s)}
            ${components()}
            body {
                width: ${PANEL_WIDTH}px;
                padding: 24px;
                background: var(--md-sys-color-surface);
            }
            /* 一屏里要放下十几行，行高比默认的列表项紧一档 */
            .m3-list-item {
                min-height: 48px;
                padding: 6px 16px;
            }
            .panel-row__name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-size: ${TYPE.bodyLarge.size}px;
                line-height: ${TYPE.bodyLarge.line}px;
            }
            .panel-row__value {
                flex: none;
                color: var(--md-sys-color-on-surface-variant);
                font-family: ${MONO_STACK};
                font-size: ${TYPE.bodyMedium.size}px;
                line-height: ${TYPE.bodyMedium.line}px;
                font-variant-numeric: tabular-nums;
            }
        </style>
    </head>
    <body>
    <ul class="m3-list">
    ${items}
    </ul>
    </body>
    </html>`;

  return capture(g, html, { width: PANEL_WIDTH, height: 128 });
}

/**
 * 面板图的可选包装：出图只是增强，浏览器起不来或渲染超时就安静回退，
 * 由调用方接上等价的文本。
 */
export async function renderPanel(
  g: GameContext,
  rows: PanelRow[],
  isRanked = false
): Promise<h | null> {
  try {
    const imageBuffer = await generatePanelImage(g, rows, isRanked);
    return imageMessage(imageBuffer, `image/${g.config.imageType}`);
  } catch (error: any) {
    g.logger.warn(`图片渲染失败，这次回退为文本：${error?.message ?? error}`);
    return null;
  }
}
