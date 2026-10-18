// Static preflight: validates locally referenced scripts and styles in AIHXO Gestion.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'gestion/index.html'), 'utf8');
const moduleList = html.match(/const archivosAIHXO\s*=\s*\[([\s\S]*?)\]/);
assert(moduleList, 'Missing archivosAIHXO module registry');
const modules = [...moduleList[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
assert(modules.length >= 10, 'Module registry unexpectedly short');
const duplicates = modules.filter((name, i) => modules.indexOf(name) !== i);
assert.equal(duplicates.length, 0, 'Duplicate modules: ' + duplicates.join(', '));

const required = ['app.js', 'styles.css', ...modules];
const missing = required.filter(name => !fs.existsSync(path.join(root, 'gestion', name)));
assert.equal(missing.length, 0, 'Missing Gestion assets: ' + missing.join(', '));

for (const file of ['gestion/index.html', 'Web/index.html', 'gestion/studio-dtf.js', 'gestion/exportador-dtf.js']) {
  assert(fs.statSync(path.join(root, file)).size > 0, 'Empty essential file: ' + file);
}
console.log('PASS: ' + modules.length + ' Gestion modules present, unique and essential assets available');
