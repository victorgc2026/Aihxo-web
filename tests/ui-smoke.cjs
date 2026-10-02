const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.AIHXO_TEST_CHROMIUM,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://test.local/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="nav"></div><div id="title"></div><div id="view"></div><div id="drawer"><div class="drawer-card"><div id="drawerBody"></div></div></div><div id="toast"></div></body></html>'}));
 await page.goto('https://test.local');await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../gestion/styles.css'),'utf8')});
 await page.addScriptTag({content:`
 const $=s=>document.querySelector(s),money=v=>Number(v||0).toFixed(2)+' €',toast=t=>document.querySelector('#toast').textContent=t,kpi=(a,b)=>'<div>'+a+': '+b+'</div>',esc=v=>String(v||'');
 const customers=[{id:'c1',name:'Cliente Test',contact:'600123456'}],products=[{id:'p1',category:'Catalogo',model:'Camiseta catálogo',size:'L',color:'Blanco',sale_price:12,garment_cost:4,dtf_cost:1,extras_cost:1},{id:'p2',category:'Diseño propio',model:'Diseño propio',sale_price:14}],orders=[];
 const items=[{id:'s1',supplier:'Mukua',supplier_model:'Melbourne',size:'L',color:'Blanco',unit_cost:4,quantity:2},{id:'s2',supplier:'Mukua',supplier_model:'Melbourne',size:'XL',color:'Negro',unit_cost:4,quantity:0}];
 window.aihxoPurchaseStockOptions=async()=>items;window.setView=()=>{};window.closeMobileMenu=()=>{};window.closeDrawer=()=>{};window.loadAll=async()=>{};window.cost=p=>p.garment_cost+p.dtf_cost+p.extras_cost;window.calls=[];
 const supabaseClient={rpc:async(name,args)=>{calls.push({name,args});await new Promise(r=>setTimeout(r,30));return {data:{id:args.p_request_id,order_number:'TEST-1',print_zones:args.p_order?.print_zones||[],base_stock_allocated:false},error:null}},from:()=>({update:()=>({eq:async()=>({error:null})})}),storage:{from:()=>({upload:async()=>({error:null})})}};
 `});
 await page.addScriptTag({path:path.join(__dirname,'../gestion/pedidos-pendiente-stock.js')});await page.evaluate(()=>window.orderForm());
 await page.selectOption('#customerSelect','c1');assert.equal(await page.inputValue('#orderContact'),'600123456');
 await page.selectOption('.lineItem','s1');await page.fill('.lineQty','2');await page.fill('.linePrice','10');
 await page.click('#addOrderLine');await page.locator('.lineItem').nth(1).selectOption('s2');await page.locator('.lineQty').nth(1).fill('3');await page.locator('.linePrice').nth(1).fill('12');
 await page.fill('#estimate_dtf','3');await page.fill('#estimate_packaging','1');await page.fill('#oshipping','5');await page.click('#addPrintZone');await page.locator('.zoneName').nth(1).selectOption('Manga izquierda');
 assert.match(await page.textContent('#orderSummary'),/61.00/);assert.match(await page.textContent('#orderSummary'),/24.00/);
 await page.evaluate(()=>{const f=document.querySelector('#of');f.dispatchEvent(new Event('submit',{cancelable:true}));f.dispatchEvent(new Event('submit',{cancelable:true}));});
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('guardado'));
 const calls=await page.evaluate(()=>window.calls);assert.equal(calls.filter(c=>c.name==='create_order_atomic').length,1);assert.equal(calls[0].args.p_lines.length,2);assert.equal(calls[0].args.p_order.print_zones[1].zone,'Manga izquierda');assert.equal(errors.length,0,errors.join('\n'));
 await page.evaluate(()=>window.orderForm());await page.selectOption('#orderType','catalogo');await page.selectOption('.lineItem','p1');assert.equal(await page.inputValue('.linePrice'),'12');assert.equal(await page.locator('.lineProductField').isVisible(),false);
 await page.screenshot({path:'/tmp/aihxo-order-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Mobile overflow');
 await browser.close();console.log('PASS: mobile, customer lookup, multiple sizes/zones, totals, single submit and catalog pricing');
})().catch(e=>{console.error(e);process.exit(1)});
