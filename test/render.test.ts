import test from 'node:test'
import assert from 'node:assert/strict'
import { generateImage, imageMessage, generatePanelImage } from '../src/services/renderer'
const g: any = {ctx:{puppeteer:{page:async()=>{throw Error('browser unavailable')}}},config:{imageType:'png'},logger:{warn(){}}}
test('board render failures preserve each letter and result without interrupting the game', async () => {
 const buffer = await generateImage(g,'','<div data-state="correct">A</div><div data-state="present">B</div><div data-state="absent">C</div>')
 const message = imageMessage(buffer,'image/png').toString()
 assert.match(message,/A（位置正确）/);assert.match(message,/B（位置不符）/);assert.match(message,/C（不包含）/)
 assert.doesNotMatch(message,/<img/)
})
test('panel fallback retains rows beyond the fourth and escapes user markup', async () => {
 const rows = Array.from({length:8},(_,i)=>({lead:String(i+1),name:i===7?'<img src=x>':`Player${i}`,value:String(i)}))
 const result = imageMessage(await generatePanelImage(g,rows),'image/png').toString()
 assert.match(result,/Player6/); assert.match(result,/&lt;img src=x&gt;/)
})
