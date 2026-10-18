const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../gestion/pedido-stock-checklist-fix.js'),'utf8');

async function check(status,expectedWaiting){
 const order={id:'o1',status,production_status:'Pendiente llegada',base_stock_allocated:false};
 const select={options:[],value:'',insertBefore(option){this.options.unshift(option)},firstChild:null};
 const elements={pdProduction:select};
 const context={
  window:{abrirFichaPedido:async()=>{}},
  orders:[order],
  document:{
   getElementById:id=>elements[id]||null,
   createElement:()=>({value:'',textContent:''}),
   querySelectorAll:()=>[]
  }
 };
 vm.runInNewContext(source,context,{filename:'pedido-stock-checklist-fix.js'});
 await context.window.abrirFichaPedido('o1');
 assert.equal(select.value==='Pendiente llegada',expectedWaiting,'Incorrect pending-stock display for '+status);
}
(async()=>{
 await check('Cancelado',false);
 await check('Entregado',false);
 await check('Pendiente',true);
 console.log('PASS: cancelled/delivered orders do not show pending-stock checklist; active orders do');
})().catch(e=>{console.error(e);process.exitCode=1});
