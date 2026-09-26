import test from 'node:test'
import assert from 'node:assert/strict'
import { register } from '../src/commands/game'
test('a concurrent guess cannot release the active lock; exceptions release it for retry', async () => {
 const commands = new Map<string,Function>(), messages:string[]=[]
 let release!: () => void, reads=0
 const pause = new Promise<void>(resolve=>{release=resolve})
 const ctx:any = {root:{},on(){},middleware(){},filter(){return true},command(name:string){
  const chain:any = new Proxy({}, {get(_,key){return (...args:any[])=>{if(key==='action')commands.set(name,args[0]);return chain}}});return chain
 },database:{get:async()=>{reads++;await pause;throw Error('database unavailable')},set:async()=>{}}}
 const g:any = {ctx,config:{},data:{idiomsList:[],pinyinData:[],equations:[]},logger:{error(){}},lastMessageInfo:new Map()}
 register(g)
 const action=commands.get('wordle.猜 [inputWord:text]')!
 const session:any={platform:'mock',selfId:'bot',userId:'u',channelId:'g',event:{user:{}},send:async(message:any)=>{messages.push(String(message));return []}}
 const first=action({session,options:{}},'hello')
 await action({session,options:{}},'world');await action({session,options:{}},'again')
 assert.equal(reads,1);assert.equal(messages.filter(s=>s.includes('还在处理')).length,2)
 release();await first
 await action({session,options:{}},'retry')
 assert.equal(reads,2);assert.equal(messages.filter(s=>s.includes('本次处理未完成')).length,2)
})
