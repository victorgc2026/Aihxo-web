const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../gestion/pedido-detalle-v2.js'),'utf8');

async function save(status,production){
 const old={id:'o1',status:'Pendiente',base_stock_allocated:false,base_stock_item_id:'s1',order_lines:[]};
 const fields={pdStatus:status,pdProduction:production,pdProdNotes:'',pdGarmentCost:'0',pdDtfCost:'0',pdPackCost:'0',pdShipCost:'0',pdOutboundShipCost:'0',pdExtraCost:'0',pdInternal:''};
 let writes=0;const messages=[];
 const context={window:{},orders:[old],Date,console,document:{getElementById:()=>null},$:id=>fields[id]?{value:fields[id]}:{value:''},supabaseClient:{from:()=>({update:()=>({eq:async()=>{writes++;return {error:null}}})})},toast:x=>messages.push(x),drawOrders:()=>{},esc:x=>x,money:x=>String(x)};
 vm.runInNewContext(source,context,{filename:'pedido-detalle-v2.js'});
 await context.window.guardarFichaPedido('o1');
 return {writes,messages};
}
(async()=>{
 assert.equal((await save('Cancelado','Pendiente')).writes,1,'Cancellation must not require stock');
 assert.equal((await save('Pendiente','En producción')).writes,0,'Active orders must require stock');
 assert.equal((await save('Pendiente','Pendiente llegada')).writes,1,'Waiting active order can be saved');
 console.log('PASS: cancellation without garment allocation; active order stock guard remains');
})().catch(e=>{console.error(e);process.exitCode=1});
