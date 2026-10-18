// Read-only structural checks for production DTF entrypoints.
// This intentionally does not transform any artwork.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'gestion', name), 'utf8');
const studio = read('studio-dtf.js');
const exporter = read('exportador-dtf.js');
const html = read('index.html');

assert.match(studio, /const DPI\s*=\s*300\s*;/, 'Studio: 300 dpi configuration missing');
assert.match(exporter, /const DPI\s*=\s*300\s*;/, 'Exporter: 300 dpi configuration missing');
assert.match(studio, /function\s+snapshot\s*\(/, 'Studio: history snapshot missing');
assert.match(studio, /function\s+undo\s*\(/, 'Studio: undo missing');
assert.match(studio, /function\s+redo\s*\(/, 'Studio: redo missing');
assert.match(exporter, /function\s+canvasToBlob\s*\(/, 'Exporter: PNG blob conversion missing');
assert.match(html, /'studio-dtf\.js'/, 'Studio not registered');
assert.match(html, /'exportador-dtf\.js'/, 'DTF exporter not registered');
console.log('PASS: DTF entrypoints, 300 dpi constants, history and exporter present');
