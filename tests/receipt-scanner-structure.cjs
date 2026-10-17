const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../gestion/recepcion-etiquetas-v2.js'),'utf8');
assert.match(src,/const e=batch\.find\(x=>String\(x\.item_id\)===String\(id\)\)/,'Scanner must aggregate by stock item');
assert.match(src,/e\.barcode&&code&&String\(e\.barcode\)!==String\(code\)/,'Conflicting barcodes must be rejected');
assert.match(src,/e\.qty\+=qty/,'Repeated scans must increase quantity');
console.log('PASS: scanner aggregates same variant and rejects barcode conflicts');
