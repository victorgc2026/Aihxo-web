'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('gestion/compras-recepcion-manual.js','utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

async function scenario({status='Pendiente',lines,confirmAnswer=true,delay=false,rpcError=null}){
  const calls=[],messages=[],alerts=[];
  let finishRpc;
  const wait=delay?new Promise(resolve=>{finishRpc=resolve}):null;
  const purchase={id:'purchase-1',purchase_number:'P-1',status,extracted_data:{lines:[]}};
  const client={
    from(table){
      if(table==='purchases')return {select:()=>({eq:()=>({single:async()=>({data:purchase,error:null})})})};
      if(table==='purchase_lines')return {select:()=>({eq:async()=>({data:lines,error:null})})};
      throw Error('Unexpected table '+table);
    },
    async rpc(name,args){calls.push({name,args});if(wait)await wait;return {data:rpcError?null:{ok:true},error:rpcError}}
  };
  const view={};
  const btn={textContent:'Recibir completo',disabled:false};
  const context={
    window:{comprasView:async()=>{},cargarStockCamisetas:async()=>{}},
    supabaseClient:client,
    document:{documentElement:{},getElementById:()=>view,querySelectorAll:()=>[],body:{contains:()=>true}},
    MutationObserver:class{observe(){}},
    setTimeout:()=>0,
    toast:m=>messages.push(m),
    alert:m=>alerts.push(m),
    confirm:()=>confirmAnswer,
    console,
    Set,Number,String,Array,Promise
  };
  vm.runInNewContext(source,context,{filename:'compras-recepcion-manual.js'});
  const receive=context.window.recepcionarCompraCompleta;
  const p1=receive(purchase.id,btn);
  if(delay){await tick();const p2=receive(purchase.id,btn);finishRpc();await Promise.all([p1,p2]);}
  else await p1;
  return {calls,messages,alerts,btn};
}

(async()=>{
  const line=(id,ordered,received=0)=>({id:'line-'+id,item_id:id,ordered_quantity:ordered,received_quantity:received});
  let r=await scenario({lines:[line('item-a',5,2),line('item-b',3,0)]});
  assert.equal(r.calls.length,1,'Should call RPC once');
  assert.equal(r.calls[0].name,'receive_stock_batch');
  assert.equal(r.calls[0].args.p_items.length,2);
  assert.equal(r.calls[0].args.p_items[0].qty,3);
  assert.equal(r.calls[0].args.p_items[1].qty,3);
  assert.equal(r.btn.disabled,false);

  r=await scenario({status:'Recibido',lines:[line('item-a',2)]});
  assert.equal(r.calls.length,0,'Received purchase must not call RPC');

  r=await scenario({lines:[line('item-a',2,2)]});
  assert.equal(r.calls.length,0,'No pending units must not call RPC');

  r=await scenario({lines:[line('item-a',2),line('item-a',3)]});
  assert.equal(r.calls.length,0,'Duplicate items must be rejected');
  assert.match(r.alerts.join(' '),/misma referencia/);

  r=await scenario({lines:[line('item-a',2.5)]});
  assert.equal(r.calls.length,0,'Fractional units must be rejected');

  r=await scenario({lines:[line('item-a',2)],confirmAnswer:false});
  assert.equal(r.calls.length,0,'Declined confirmation must not receive stock');

  r=await scenario({lines:[line('item-a',2)],delay:true});
  assert.equal(r.calls.length,1,'Concurrent double click must only call RPC once');
  r=await scenario({lines:[line('item-a',3)],rpcError:new Error('network timeout')});
  assert.equal(r.calls.length,1,'Ambiguous network error must not trigger an automatic retry');
  assert.match(r.alerts.join(' '),/PODRÍA haberse registrado/,'Network error must warn about possible committed receipt');
  assert.equal(r.btn.disabled,false,'Button must unlock after RPC failure');

  r=await scenario({lines:[line('item-a',2147483648)]});
  assert.equal(r.calls.length,0,'Quantity over PostgreSQL integer limit must be rejected');

  r=await scenario({lines:[line('item-a',2,3)]});
  assert.equal(r.calls.length,0,'Already received units cannot exceed ordered units');

  r=await scenario({lines:[{id:'line-missing',item_id:null,ordered_quantity:2,received_quantity:0}]});
  assert.equal(r.calls.length,0,'Unassigned purchase lines must be rejected');

  console.log('PASS: manual receipt runtime flows with isolated fake Supabase');
})().catch(e=>{console.error(e);process.exitCode=1});
