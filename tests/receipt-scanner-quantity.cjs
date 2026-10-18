// Prueba aislada de la validación de cantidades en el escáner.
// Extrae el cuerpo real de add() y lo ejecuta con DOM simulado.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('gestion/recepcion-etiquetas-v2.js','utf8');
const start=source.indexOf('  function add(id,code){');
const end=source.indexOf('\n  function resume(){',start);
assert(start>=0&&end>start,'No se encontró add()');
const functionSource=source.slice(start,end);
function test(value,initial=0){
 const batch=initial?[{item_id:'sku-1',qty:initial,barcode:'012345'}]:[];
 const alerts=[];
 const sandbox={batch,document:{getElementById:id=>id==='recvQty'?{value}:null},
  alert:msg=>alerts.push(msg),renderBatch:()=>{},resume:()=>{}};
 vm.runInNewContext(functionSource+'\nadd("sku-1","012345");',sandbox);
 return {batch,alerts};
}
for(const value of ['0','-1','1.5','NaN','Infinity','2147483648','']){
 const result=test(value);
 assert.equal(result.batch.length,0,'Se admitió '+JSON.stringify(value));
 assert.equal(result.alerts.length,1,'No se avisó para '+JSON.stringify(value));
}
assert.equal(test('3').batch[0].qty,3);
assert.equal(test('2',4).batch[0].qty,6);
assert.equal(test('2',2147483646).batch[0].qty,2147483646);
assert.equal(test('2',2147483646).alerts.length,1);
console.log('PASS: scanner rejects invalid quantities and overflow before stock receipt');
