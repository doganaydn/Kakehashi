import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {learningDisplay} from '../display';
import {parsePackageText, packageSummary} from '../resolver';
import {createPackageManager} from '../package-store';

const packet=parsePackageText(readFileSync(resolve(process.cwd(),'translation-packages/wanikani-tr.json'),'utf8'));
const display=learningDisplay(packet,true);
const subject=(id:string)=>({id:Number(id),object:packet.subjects[id].source.type,
 characters:packet.subjects[id].source.word,meanings:packet.subjects[id].source.meaningsEn,
 readings:packet.subjects[id].source.readingsJa.map(reading=>({reading}))});
it('preserves existing content and adds all 448 level 9 sentences',()=>{
 const old=JSON.parse(readFileSync(resolve(process.cwd(),'tests/fixtures/translation-packages/wanikani-tr-01-60-seviye08-cumleler-radikaller.json'),'utf8'));
 expect(packageSummary(packet).sentences).toBe(857);
 let added=0;
 for(const [id,entry] of Object.entries(packet.subjects)){
  expect(entry.source).toEqual(old.subjects[id].source);
  expect(entry.meaning).toEqual(old.subjects[id].meaning);
  if(entry.source.level!==9)expect(entry.examples).toEqual(old.subjects[id].examples);
  else added+=entry.examples.length;
  for(const example of entry.examples)expect(display.sentence(subject(id),example.source)?.translation).toBe(example.translation);
 }
 expect(added).toBe(448);
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
 expect(packageSummary(restarted.state.getState().packet!).sentences).toBe(857);
 expect(values.size).toBeGreaterThan(2);
});
