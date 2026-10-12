/* Extract first-party localization candidates without modifying runtime code. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),out=path.join(root,'localization/source');
const tracked=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).sort();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const catalog={},review={},audit=[],files=[],diagnostics=[],dynamic=[];
const roots=/^(app\/|src\/|modules\/|targets\/|android\/app\/src\/|ios\/|web\/src\/|web\/public\/|website\/src\/|shared\/|services\/|supabase\/functions\/|app\.json$|app\.config\.js$)/;
const ext=/\.(tsx?|jsx?|swift|kt|java|m|mm|xml|plist|strings|json|html|css)$/i;
const test=/(^|\/)(__tests__|__mocks__|fixtures|test|tests|e2e|previews)(\/|$)|\.(test|spec)\.|Preview(Fixtures|Environment)|androidTest\/|\/test\/|\.d\.ts$/;
const learningContent=/(\.generated\.json$)|\/questions\/generated\/|^src\/hooks\/response\.json$|^web\/src\/data\//;
const external=/(^translation-packages\/)|^src\/data\/(?!patchNotes\.ts$)|^src\/features\/kanji-patterns\/.*\.json$|^web\/public\/.*\.(json|html)$|^src\/ui\/settings\/(artwork|row-artwork)\.ts$/;
function surface(f){return /^(services|supabase)\//.test(f)?'backend':f.startsWith('website/')?'website':f.startsWith('web/')?'web':f.startsWith('targets/kakehashi-watch')?'watch':f.startsWith('targets/share-extension')?'share-extension':/widget/i.test(f)?'widgets':f.startsWith('ios/')?'ios-native':/^(android|modules)\//.test(f)?'native':'mobile';}
function add(file,source,nodeStart,text,kind,context='',vars=[]){
 text=text.replace(/\r\n/g,'\n');if(!text.trim())return;
 const line=source.slice(0,nodeStart).split('\n').length;
 let disposition='review-needed';
 if(kind==='import'||kind==='type'||kind==='property-key'||/^(https?:|file:|data:|@\/|\.\.?\/|#[0-9a-f]{3,8}$)/i.test(text)||/^[\w./-]+\.(png|jpg|svg|json|mp3|ttf|otf|tsx?|js|css|xml|html)$/.test(text)||/^(GET|POST|PUT|PATCH|DELETE|Content-Type|Authorization|application\/|Bearer )/.test(text)||!/[A-Za-zÀ-ž]/.test(text))disposition='technical';
 else if(/^[a-z][A-Z\w]*[A-Z]\w*$/.test(text)||/^[a-z\d]+(?:[-_.:/][a-z\d]+)+$/.test(text))disposition='technical';
 else if(kind==='xml-string' && /<key>(CF|UI|WK|NSExtension|EX|Expo|LS|ITS|UT)/.test(context))disposition='technical';
 else if(/^(jsx-text|jsx-template|xml-string|html-text)$/.test(kind)||/accessibilityLabel|accessibilityHint|placeholder|Alert\.|Toast|title|message|description|label|subtitle|button|notification|errorMessage|emptyText|headerTitle|prompt/i.test(context))disposition='ui';
 else if(/console\.|logger\.|log\(/.test(context))disposition='diagnostic';
 else if(/^[a-z][A-Z\w]*[A-Z]\w*$/.test(text)||/^[a-z\d]+(?:[-_.:/][a-z\d]+)+$/.test(text))disposition='technical';
 const key=file.replace(/\.[^.]+$/,'').replace(/[^A-Za-z0-9]+/g,'.')+'.'+hash(text).slice(0,16);
 const occurrence={key,file,line,kind,disposition,text,context:context.slice(0,120),variables:vars};audit.push(occurrence);
 if(disposition==='ui')catalog[key]=text;
 else if(disposition==='review-needed')review[key]=text;
}
function visitTs(file,s){
 const sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:file.endsWith('jsx')?ts.ScriptKind.JSX:file.endsWith('js')?ts.ScriptKind.JS:ts.ScriptKind.TS);
 for(const d of sf.parseDiagnostics)diagnostics.push({file,line:sf.getLineAndCharacterOfPosition(d.start||0).line+1,message:ts.flattenDiagnosticMessageText(d.messageText,' ')});
 function walk(n){
  const parent=n.parent;
  const ctx=parent?parent.getText(sf):'';
  if(ts.isJsxText(n))add(file,s,n.pos,n.text.replace(/\s+/g,' ').trim(),'jsx-text',ctx);
  else if(ts.isTemplateExpression(n)){
   const vars=n.templateSpans.map((x,i)=>({placeholder:'value'+(i+1),expression:x.expression.getText(sf)}));
   let v=n.head.text;n.templateSpans.forEach((x,i)=>v+='{value'+(i+1)+'}'+x.literal.text);add(file,s,n.getStart(sf),v,'template',ctx,vars);
  }else if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)){
   let kind='literal';if(parent&&(ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)))kind='import';else if(parent&&ts.isLiteralTypeNode(parent))kind='type';else if(parent&&ts.isPropertyAssignment(parent)&&parent.name===n)kind='property-key';else if(parent&&ts.isJsxAttribute(parent))kind='jsx-attribute';
   add(file,s,n.getStart(sf),n.text,kind,ctx);
  }
  if(ts.isJsxElement(n)&&n.children.some(ts.isJsxExpression)&&n.children.some(x=>ts.isJsxText(x)&&x.text.trim())){
   const vars=[];let v='';for(const c of n.children){if(ts.isJsxText(c))v+=c.text.replace(/\s+/g,' ');else if(ts.isJsxExpression(c)&&c.expression){vars.push({placeholder:'value'+(vars.length+1),expression:c.expression.getText(sf)});v+='{value'+vars.length+'}';}else if(ts.isJsxElement(c)||ts.isJsxSelfClosingElement(c)){vars.push({placeholder:'component'+(vars.length+1),expression:c.getText(sf)});v+='{component'+vars.length+'}';}}
   add(file,s,n.getStart(sf),v.trim(),'jsx-template',n.openingElement.getText(sf),vars);
  }
  ts.forEachChild(n,walk);
 }
 walk(sf);
}
function nativeLiterals(source){
 const found=[];
 function skipQuoted(i){const quote=source[i++];while(i<source.length){if(source[i]==='\\'){i+=2;continue;}if(source[i++]===quote)break;}return i;}
 function balanced(i,open,close){let depth=1;while(i<source.length&&depth){if(source[i]==='"'||source[i]==="'"){i=skipQuoted(i);continue;}if(source[i]===open)depth++;if(source[i]===close)depth--;i++;}return i;}
 for(let i=0;i<source.length;i++){
  if(source[i]!== '"')continue;
  const start=i;let end,vars=[],text='';
  if(source.slice(i,i+3)==='"""'){end=source.indexOf('"""',i+3);if(end<0)end=source.length;text=source.slice(i+3,end);end+=3;}
  else{let j=i+1,last=j;while(j<source.length){
   const kotlin=source[j]==='$'&&source[j+1]==='{',swift=source[j]==='\\'&&source[j+1]==='(';
   if(kotlin||swift){text+=source.slice(last,j);const finish=balanced(j+2,kotlin?'{':'(',kotlin?'}':')');vars.push({placeholder:'value'+(vars.length+1),expression:source.slice(j+2,finish-1)});text+='{value'+vars.length+'}';j=finish;last=j;continue;}
   if(source[j]==='$'&&/[A-Za-z_]/.test(source[j+1]||'')){text+=source.slice(last,j);let finish=j+1;while(/[A-Za-z0-9_]/.test(source[finish]||''))finish++;vars.push({placeholder:'value'+(vars.length+1),expression:source.slice(j+1,finish)});text+='{value'+vars.length+'}';j=finish;last=j;continue;}
   if(source[j]==='\\'){j+=2;continue;}
   if(source[j]==='"')break;j++;
  }text+=source.slice(last,j);end=j+1;}
  found.push({start,text,vars,raw:source.slice(start,end)});i=end-1;
 }
 return found;
}
for(const file of tracked){
 if(!roots.test(file))continue;
 let reason=/(^|\/)(tsconfig[^/]*\.json|expo-module\.config\.json|Contents\.json)$/.test(file)?'build/module metadata; no user-facing interface text':!ext.test(file)?'non-text asset or non-runtime source':test.test(file)?'tests, fixtures or previews':learningContent.test(file)?'learning/example/API snapshot data; separate from interface localization':external.test(file)?'external learning/reference data or icon geometry':null;
 if(reason){files.push({file,surface:surface(file),status:'excluded',reason});continue;}
 const s=fs.readFileSync(path.join(root,file),'utf8'),before=audit.length;
 for(const [i,line] of s.split('\n').entries())if(/Intl\.|toLocale(Date|Time|String|LowerCase|UpperCase)|format(Date|Distance|Relative|Duration)|plural|\.replace\(|\.split\(|humanize|capitalize|scheduleNotification|Alert\.|accessibility(Label|Hint)/.test(line))dynamic.push({file,line:i+1,source:line.trim().slice(0,240),status:'manual-audit-needed',reason:'Formatting, constructed labels, pluralization, notifications, accessibility or replacement logic'});
 if(/\.[jt]sx?$/.test(file))visitTs(file,s);
 else if(/\.json$/.test(file)){
  try{const obj=JSON.parse(s);function walk(v,route){if(typeof v==='string'){add(file,s,Math.max(0,s.indexOf(JSON.stringify(v))),v,'json',route);}else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))walk(x,route+'.'+k);}walk(obj,'');}catch(e){diagnostics.push({file,message:e.message});}
 }else if(/\.(xml|plist)$/.test(file)){
  for(const m of s.matchAll(/<string(?:\s[^>]*)?>([\s\S]*?)<\/string>/g)){add(file,s,m.index,m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),'xml-string',s.slice(Math.max(0,m.index-100),m.index)+m[0]);}
  for(const m of s.matchAll(/(?:android:)?(?:text|hint|contentDescription|label)="([^"]+)"/g))if(!m[1].startsWith('@'))add(file,s,m.index,m[1],'xml-string',m[0]);
 }else if(/\.(swift|kt|java|m|mm|strings)$/.test(file)){
  for(const m of nativeLiterals(s))add(file,s,m.start,m.text,'native-literal',s.slice(Math.max(0,m.start-60),m.start+60),m.vars);
 }else if(/\.css$/.test(file)){
  for(const m of s.matchAll(/content\s*:\s*["']([^"']+)["']/g))add(file,s,m.index,m[1],'literal',m[0]);
 }else if(/\.html$/.test(file)){
  for(const m of s.matchAll(/>([^<>]+)</g))add(file,s,m.index,m[1].replace(/\s+/g,' ').trim(),'html-text',m[0]);
  for(const m of s.matchAll(/(?:title|alt|placeholder|aria-label)=["']([^"']+)["']/g))add(file,s,m.index,m[1],'jsx-attribute',m[0]);
 }
 files.push({file,surface:surface(file),status:'scanned',sha256:hash(s),literals:audit.length-before,ui:audit.slice(before).filter(x=>x.disposition==='ui').length,review:audit.slice(before).filter(x=>x.disposition==='review-needed').length});
}
const nativeDynamic=audit.filter(x=>x.kind==='native-literal'&&(x.variables.length||(/\\\(|\$\{|%[\ds@f]/.test(x.text)))).map(x=>({key:x.key,file:x.file,line:x.line,text:x.text,reason:'Native interpolation/format syntax must be converted manually before runtime integration'}));
const write=(name,x)=>fs.writeFileSync(path.join(out,name),JSON.stringify(x,null,2)+'\n');
write('en.json',Object.fromEntries(Object.entries(catalog).sort()));write('review-needed.en.json',Object.fromEntries(Object.entries(review).sort()));
fs.writeFileSync(path.join(out,'occurrences.json.gz'),require('node:zlib').gzipSync(JSON.stringify(audit)));if(fs.existsSync(path.join(out,'occurrences.json')))fs.unlinkSync(path.join(out,'occurrences.json')); write('files.json',files);write('native-format-review.json',nativeDynamic);write('parse-diagnostics.json',diagnostics);write('dynamic-rules.json',dynamic);
const summary={generatedAt:new Date().toISOString(),sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),stage:'extracted-source-candidates; not runtime-wired or editorially complete',uiKeys:Object.keys(catalog).length,reviewKeys:Object.keys(review).length,totalOccurrences:audit.length,scannedFiles:files.filter(x=>x.status==='scanned').length,excludedFiles:files.filter(x=>x.status==='excluded').length,parseDiagnostics:diagnostics.length,nativeDynamic:nativeDynamic.length,dynamicRuleSites:dynamic.length,surfaces:{}};
for(const f of files){const z=summary.surfaces[f.surface]??={scanned:0,excluded:0,uiOccurrences:0,reviewOccurrences:0};z[f.status==='scanned'?'scanned':'excluded']++;z.uiOccurrences+=f.ui||0;z.reviewOccurrences+=f.review||0;}
write('manifest.json',summary);console.log(JSON.stringify(summary));
const lines=['# UI translation source coverage','',`Source commit: ${summary.sourceCommit}`,'','Every tracked source file under mobile, web, website, shared and native roots has a disposition in files.json. This is a source inventory, not a claim that every runtime-generated label is ready for translation.','', '| Surface | Scanned files | UI occurrences | Review occurrences | Excluded files |','|---|---:|---:|---:|---:|'];
for(const [k,v] of Object.entries(summary.surfaces))lines.push(`| ${k} | ${v.scanned} | ${v.uiOccurrences} | ${v.reviewOccurrences} | ${v.excluded} |`);
lines.push('','## Areas by source file','','All scanned files are listed, including zero-candidate files. Names and line numbers are preserved in occurrences.json.gz (gzip-compressed JSON).','');
for(const f of files.filter(x=>x.status==='scanned'))lines.push(`- ${f.file}: ${f.ui} UI + ${f.review} review candidates (${f.literals} literals audited)`);
fs.writeFileSync(path.join(out,'COVERAGE.md'),lines.join('\n')+'\n');
