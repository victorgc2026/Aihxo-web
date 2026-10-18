'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const required=['gestion/index.html','gestion/app.js','gestion/styles.css','Web/index.html','.github/workflows/deploy-pages.yml'];
for(const p of required)assert.ok(fs.statSync(p).size>0,'Missing or empty required file: '+p);
const index=read('gestion/index.html');
const scripts=[...index.matchAll(/['"]([^'"\\\n]+\.js)['"]/g)].map(m=>m[1]);
assert.ok(scripts.length>=20,'Unexpectedly short Gestion script registry');
for(const script of scripts){
  assert.ok(!script.includes('..'),'Unsafe script registry path: '+script);
  assert.ok(fs.existsSync(path.join('gestion',script)),'Missing registered Gestion module: '+script);
}
const deploy=read('.github/workflows/deploy-pages.yml');
assert.match(deploy,/branches:\s*\n\s*- main/,'Production deploy must be restricted to main');
assert.match(deploy,/github-pages/,'Expected GitHub Pages environment');
assert.match(deploy,/actions\/deploy-pages@/,'Expected explicit Pages deployment step');
console.log('PASS: Guardian static checks ('+scripts.length+' registered modules, critical files and deployment boundary)');
