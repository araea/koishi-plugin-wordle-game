import type { Config } from '../config'
import { baseline, scheme } from '../m3'
export const htmlPrefix = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>Wordle</title></head><body>'
export const htmlSuffix = '</body></html>'
export function htmlAfterStyle(config: Config) {
 const c = scheme(142, config.isDarkThemeEnabled)
 return `<style>${baseline(c)}
 body{padding:16px;background:${c.surface}}
 .Board-module_board__jeoPS{width:100%!important;height:auto!important;gap:8px!important;padding:8px!important}
 .Row-module_row__pwpBq{gap:8px!important}
 .Tile-module_tile__UWEHN{display:flex;position:relative;align-items:center;justify-content:center;min-height:64px;aspect-ratio:1;border-radius:12px;border:1px solid ${c.outline};font-size:28px;font-weight:500;background:${c.surfaceContainer};color:${c.onSurface}}
 [data-state=correct]{background:${c.primary}!important;color:${c.onPrimary}!important}
 [data-state=present]{background:${c.tertiaryContainer}!important;color:${c.onTertiaryContainer}!important}
 [data-state=absent]{background:${c.surfaceContainerHighest}!important;color:${c.onSurface}!important}
 [data-state]::after{position:absolute;right:4px;bottom:2px;font-size:12px;line-height:16px}
 [data-state=correct]::after{content:'✓'}[data-state=present]::after{content:'↔'}[data-state=absent]::after{content:'×'}
 </style><p>✓ 位置正确 · ↔ 位置不符 · × 不包含</p>`
}

// 汉兜「拼音速查表」的默认拼音表。
export const defaultPinyinsHtml = `                    <div grid="~ cols-2 gap-3" h-min="">
                        <div class="">b</div>
                        <div class="">p</div>
                        <div class="">m</div>
                        <div class="">f</div>
                        <div class="">d</div>
                        <div class="">t</div>
                        <div class="">n</div>
                        <div class="">l</div>
                        <div class="">g</div>
                        <div class="">k</div>
                        <div class="">h</div>
                        <div class="">j</div>
                        <div class="">q</div>
                        <div class="">r</div>
                        <div class="">x</div>
                        <div class="">w</div>
                        <div class="">y</div>
                        <div class="">zh</div>
                        <div class="">ch</div>
                        <div class="">sh</div>
                        <div class="">z</div>
                        <div class="">c</div>
                        <div class="">s</div>
                    </div>
                    <div grid="~ cols-3 gap-3" h-min="">
                        <div class="">a</div>
                        <div class="">ai</div>
                        <div class="">an</div>
                        <div class="">ang</div>
                        <div class="">ao</div>
                        <div class="">e</div>
                        <div class="">ei</div>
                        <div class="">en</div>
                        <div class="">eng</div>
                        <div class="">er</div>
                        <div class="">i</div>
                        <div class="">ia</div>
                        <div class="">ian</div>
                        <div class="">iang</div>
                        <div class="">iao</div>
                        <div class="">ie</div>
                        <div class="">in</div>
                        <div class="">ing</div>
                        <div class="">io</div>
                        <div class="">iong</div>
                        <div class="">iu</div>
                        <div class="">o</div>
                        <div class="">ong</div>
                        <div class="">ou</div>
                        <div class="">u</div>
                        <div class="">ua</div>
                        <div class="">uai</div>
                        <div class="">uan</div>
                        <div class="">uang</div>
                        <div class="">ui</div>
                        <div class="">un</div>
                        <div class="">uo</div>
                        <div class="">ü</div>
                        <div class="">üan</div>
                        <div class="">üe</div>
                        <div class="">ün</div>
                    </div>`;
