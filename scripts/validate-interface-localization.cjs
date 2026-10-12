/** Offline runtime-catalog checks; the raw source inventory is a separate snapshot. */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const load = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const en = load('src/features/interface-language/locales/en.json');
const tr = load('src/features/interface-language/locales/tr.json');
const overrides = load('localization/turkish-ui-overrides.json');
const errors = [], calls = [], residual = [];
const placeholders = (s) => [...s.matchAll(/\{\{([^{}]+)\}\}/g)].map(m => m[1]).sort().join('|');
if (Object.keys(en).sort().join('|') !== Object.keys(tr).sort().join('|')) errors.push('English/Turkish key sets differ');
for (const [key, value] of Object.entries(en)) {
  if (typeof tr[key] !== 'string' || !tr[key].trim()) errors.push(`Empty Turkish value: ${key}`);
  else if (placeholders(value) !== placeholders(tr[key])) errors.push(`Placeholder mismatch: ${key}`);
}
function visitDirectory(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { if (!['__tests__', 'node_modules', 'locales'].includes(entry.name)) visitDirectory(file); continue; }
    if (!/\.tsx?$/.test(file) || /(?:\.test\.|\.d\.ts$)/.test(file)) continue;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    for (const error of tree.parseDiagnostics) errors.push(`${file}: ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`);
    if (/['"]use dom['"]/.test(source) && !/^\s*['"]use dom['"]\s*;/.test(source)) errors.push(`DOM directive must come first: ${file}`);
    const imports = new Set();
    for (const statement of tree.statements) if (ts.isImportDeclaration(statement)) {
      const names = statement.importClause?.namedBindings;
      if (names && ts.isNamedImports(names)) for (const name of names.elements) {
        if (imports.has(name.name.text)) errors.push(`Duplicate import ${name.name.text}: ${file}`);
        imports.add(name.name.text);
      }
    }
    function walk(node) {
      if (ts.isCallExpression(node) && node.expression.getText(tree) === 'uiT' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        if (!(key in en)) errors.push(`Missing key ${key}: ${file}`);
        let parent = node.parent;
        while (ts.isParenthesizedExpression(parent)) parent = parent.parent;
        if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(parent.operatorToken.kind)) errors.push(`Translated internal comparison: ${file}:${key}`);
        if (ts.isElementAccessExpression(parent) || ts.isCaseClause(parent)) errors.push(`Translated internal key: ${file}:${key}`);
        calls.push({ file, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1, key });
      }
      if (ts.isJsxText(node)) {
        const text = node.text.replace(/\s+/g, ' ').trim();
        if (/[A-Za-z]{2}/.test(text)) residual.push({ file, line: tree.getLineAndCharacterOfPosition(node.pos).line + 1, text,
          disposition: file.endsWith('.ios.tsx') ? 'iOS outside Android rollout' : /^(Apprentice|Guru|Master|Enlightened|Burned|Kakehashi|WaniKani|Bunpro|Patreon|JLPT)$/.test(text) ? 'Proper name or retained SRS term' : /^&quot;/.test(text) ? 'Encoded punctuation' : 'Needs classification' });
      }
      ts.forEachChild(node, walk);
    }
    walk(tree);
  }
}
visitDirectory('app'); visitDirectory('src');
const reviewed = Object.keys(en).filter(k => typeof tr[k] === 'string' && overrides[en[k]] === tr[k]);
const report = {
  runtimeKeys: Object.keys(en).length, bindingSites: calls.length,
  boundFiles: new Set(calls.map(c => c.file)).size,
  placeholderErrors: errors.length,
  reviewedOverrideKeys: reviewed,
  draftOrAdditionalKeys: Object.keys(en).filter(k => !reviewed.includes(k)),
  independentExpertReview: false,
  deviceVisualReview: false,
  residualJsxTextCandidates: residual,
  note: 'Residual candidates need classification; zero candidates would not prove complete dynamic/native coverage. Keys outside reviewed overrides include both drafts and separately authored labels.',
  resources: Object.fromEntries(['en', 'tr'].map(language => [language, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, `src/features/interface-language/locales/${language}.json`))).digest('hex')])),
};
if (process.argv.includes('--write-report')) {
  fs.writeFileSync(path.join(root, 'localization/android-translation-review.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'localization/android-bindings.json'), JSON.stringify({ note: 'Current runtime call sites, not an editing script input.', calls }, null, 2) + '\n');
}
console.log(JSON.stringify({ keys: report.runtimeKeys, sites: calls.length, files: report.boundFiles, reviewedOverrides: reviewed.length, residualJsxCandidates: residual.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
