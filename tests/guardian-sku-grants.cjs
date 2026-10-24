'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('database/proposals/guardian-restrict-sku-sequences.sql','utf8');
const check=(pattern,description)=>assert.match(sql,pattern,description);
check(/revoke\s+execute\s+on\s+function\s+public\.aihxo_next_sku\(text\)\s+from\s+PUBLIC\s*,\s*anon\s*;/i,'Revoke anonymous function access');
check(/grant\s+execute\s+on\s+function\s+public\.aihxo_next_sku\(text\)\s+to\s+authenticated\s*,\s*service_role\s*;/i,'Preserve legitimate function access');
for(const seq of ['aihxo_sku_base_seq','aihxo_sku_design_seq']){
  check(new RegExp('revoke\\s+usage\\s+on\\s+sequence\\s+public\\.'+seq+'\\s+from\\s+PUBLIC\\s*,\\s*anon\\s*;','i'),'Revoke anonymous sequence access: '+seq);
  check(new RegExp('grant\\s+usage\\s+on\\s+sequence\\s+public\\.'+seq+'\\s+to\\s+authenticated\\s*,\\s*service_role\\s*;','i'),'Preserve authenticated sequence access: '+seq);
}
assert.doesNotMatch(sql,/\b(drop|truncate|insert|update|delete|alter\s+sequence|setval|nextval)\b/i,'Proposal must not modify data or sequence values');
check(/\bbegin\s*;/i,'Transactional start');
check(/\bcommit\s*;/i,'Transactional end');
console.log('PASS: SKU permissions proposal restricts anonymous access while preserving authenticated and service roles (static check; not applied)');
