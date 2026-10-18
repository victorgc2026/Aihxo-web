'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
for(const file of ['Web/index.html','Web/producto/index.html']){
  const source=fs.readFileSync(file,'utf8');
  const queries=[...source.matchAll(/\.from\(['"]products['"]\)([\s\S]{0,650}?)(?:;|\n\s*if\s*\()/g)];
  assert.ok(queries.length>0,'Expected storefront products query in '+file);
  for(const [,q] of queries){
    assert.doesNotMatch(q,/\.select\(['"]\*['"]\)/,'Wildcard product reads forbidden in '+file);
    assert.match(q,/\.eq\(['"]web_published['"]\s*,\s*true\)/,'Published filter required in '+file);
    const match=q.match(/\.select\(['"]([^'"]+)['"]\)/);
    assert.ok(match,'Explicit projection required in '+file);
    const columns=match[1].split(',').map(x=>x.trim());
    for(const forbidden of ['garment_cost','dtf_cost','extras_cost','purchase_cost','supplier']){
      assert.ok(!columns.includes(forbidden),'Internal field exposed in '+file+': '+forbidden);
    }
  }
}
console.log('PASS: storefront product queries use published-only explicit projections (static only; backend RLS still requires remediation)');
