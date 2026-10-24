'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('database/proposals/guardian-restrict-inventory-rpc.sql','utf8');
const frontend=fs.readFileSync('gestion/inventario-reset.js','utf8');
const functions=[
  {name:'begin_inventory_reset',signature:'text'},
  {name:'finish_inventory_cycle',signature:'uuid'}
];
for(const {name,signature} of functions){
  assert.match(frontend,new RegExp("\\.rpc\\(['\"]"+name+"['\"]"),'Missing authenticated frontend caller for '+name);
  const revoke=new RegExp('revoke\\s+execute\\s+on\\s+function\\s+public\\.'+name+'\\('+signature+'\\)\\s+from\\s+PUBLIC\\s*,\\s*anon\\s*;','i');
  assert.match(sql,revoke,'Missing least-privilege revoke for '+name);
  assert.doesNotMatch(sql,new RegExp('grant\\s+execute\\s+on\\s+function\\s+public\\.'+name,'i'),'Unexpected GRANT for '+name);
}
assert.doesNotMatch(sql,/\b(drop\s+function|truncate|delete\s+from|update\s+public\.|insert\s+into)\b/i,'Proposal must not modify stock data');
assert.match(sql,/\bbegin\s*;/i);
assert.match(sql,/\bcommit\s*;/i);
console.log('PASS: inventory RPC grant proposal references the real frontend calls and contains only intended revocations (static; no database execution)');
