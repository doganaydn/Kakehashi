import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {learningDisplay} from '../display';
import {parsePackageText, packageSummary} from '../resolver';
import {createPackageManager} from '../package-store';

const packet=parsePackageText(readFileSync(resolve(process.cwd(),'translation-packages/wanikani-tr-v3.json'),'utf8'));
const display=learningDisplay(packet,true);
const subject=(id:string)=>({id:Number(id),object:packet.subjects[id].source.type,
 characters:packet.subjects[id].source.word,meanings:packet.subjects[id].source.meaningsEn,
 readings:packet.subjects[id].source.readingsJa.map(reading=>({reading}))});
it('resolves the complete current package and all 1–15 sentence levels',()=>{
 expect(packageSummary(packet).sentences).toBe(5522);
 const counts:Record<number,number>={};
 for(const [id,entry] of Object.entries(packet.subjects)){
  const level=entry.source.level!;counts[level]=(counts[level]??0)+entry.examples.length;
  for(const example of entry.examples)expect(display.sentence(subject(id),example.source)?.translation).toBe(example.translation);
 }
 expect(Object.fromEntries(Object.entries(counts).filter(([,n])=>n>0))).toEqual({1:112,2:238,3:219,4:350,5:417,6:383,7:376,8:409,9:448,10:492,11:429,12:457,13:395,14:401,15:396});
});
it('resolves radical and related kanji shapes without weakening source checks',()=>{
 expect(display.meaning(subject('80'))).toBe('Hayalet');
 for(const [id,entry] of Object.entries(packet.subjects)){
  if(!['radical','kanji'].includes(entry.source.type))continue;
  expect(display.resolveMeaning(subject(id))?.primary).toBe(entry.meaning.primary);
  expect(learningDisplay(packet,false).resolveMeaning(subject(id))).toBeNull();
  expect(display.resolveMeaning({...subject(id),meanings:['changed']})).toBeNull();
  if(entry.source.type==='kanji'){
   expect(display.resolveMeaning({...subject(id),readings:[]})).toBeNull();
   expect(display.resolveMeaning({...subject(id),object:'radical'})).toBeNull();
  }
 }
 expect(Object.values(packet.subjects).filter(e=>e.source.type==='radical'&&e.source.word===null)).toHaveLength(15);
});
it('stores the complete new package in chunks and restores it after restart',async()=>{
 const values=new Map<string,string>();
 const storage={getItem:async(k:string)=>values.get(k)??null,
  setItem:async(k:string,v:string)=>{values.set(k,v);},
  removeItem:async(k:string)=>{values.delete(k);},
  multiGet:async(keys:string[])=>keys.map(k=>[k,values.get(k)??null]),
  multiSet:async(pairs:string[][])=>{pairs.forEach(([k,v])=>values.set(k,v));},
  multiRemove:async(keys:string[])=>{keys.forEach(k=>values.delete(k));}};
 const first=createPackageManager(storage as any);await first.activate(packet);
 const restarted=createPackageManager(storage as any);await restarted.hydrate();
 expect(restarted.state.getState().packet).toEqual(packet);
 expect(packageSummary(restarted.state.getState().packet!).sentences).toBe(5522);
 expect(values.size).toBeGreaterThan(2);
});
