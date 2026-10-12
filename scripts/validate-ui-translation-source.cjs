const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),vm=require('node:vm');
const root='localization/source/',a=JSON.parse(z.gunzipSync(fs.readFileSync(root+'occurrences.json.gz'))),en=JSON.parse(fs.readFileSync(root+'en.json')),review=JSON.parse(fs.readFileSync(root+'review-needed.en.json')),files=JSON.parse(fs.readFileSync(root+'files.json'));
const scanned=new Set(files.filter(f=>f.status==='scanned').map(f=>f.file));
assert.equal(JSON.parse(fs.readFileSync(root+'parse-diagnostics.json')).length,0);
for(const x of a){assert(scanned.has(x.file));if(x.disposition==='ui')assert.equal(en[x.key],x.text);if(x.disposition==='review-needed')assert.equal(review[x.key],x.text);for(const v of x.variables)assert(x.text.includes('{'+v.placeholder+'}'));}
assert(a.some(x=>x.file.includes('WatchQuestionLabel')&&x.text==='Reading'));
assert(a.some(x=>x.file.includes('modules/home-widget')&&x.text.includes('Choose content')));
assert(a.some(x=>x.text.includes('needs access to your Camera')));
const source=fs.readFileSync('scripts/extract-ui-translation-source.cjs','utf8'),scope={};
vm.runInNewContext(source.slice(source.indexOf('function nativeLiterals'),source.indexOf('for(const file of tracked)')),scope);
const fixture='Text("Hello $count ${if (count == 1) "review" else "reviews"} available")';
const native=scope.nativeLiterals(fixture);assert.equal(native.length,1);assert.equal(native[0].text,'Hello {value1} {value2} available');assert.equal(native[0].vars.length,2);
const swift=scope.nativeLiterals('Text("Meaning: \\(item.meaning ?? "Unknown")")');assert.equal(swift.length,1);assert.equal(swift[0].vars.length,1);
console.log('PASS: source linkage, placeholders, native nested interpolation, permissions, widgets and watch coverage.');
