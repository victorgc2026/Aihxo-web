const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../gestion/tpv-production.js'),'utf8');
async function check(status,expectedWrites){
 const messages=[],order={id:'o1',status,production_status:'Pendiente',base_stock_allocated:false};
 let writes=0;
 const context={window:{},orders:[order],Date,console,setTimeout:()=>{},document:{getElementById:()=>null},supabaseClient:{from:()=>({update:()=>({eq:async()=>{writes++;return {error:null}}})})},toast:s=>messages.push(s)};
 vm.runInNewContext(source,context);
 context.window.produccionView=async()=>{};
 await context.window.aihxoKanbanMove('o1','pending');
 assert.equal(writes,expectedWrites,'Unexpected write for '+status);
 if(!expectedWrites)assert.match(messages.join(' '),/cerrado/);
}
(async()=>{await check('Cancelado',0);await check('Entregado',0);await check('Pendiente',1);console.log('PASS: Kanban cannot reopen cancelled or delivered orders');})().catch(e=>{console.error(e);process.exitCode=1});
