-- Run after the migration inside BEGIN ... ROLLBACK. Never persist fixtures.
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from auth.users where email='gracielaoliveros.go@gmail.com' limit 1),'email','gracielaoliveros.go@gmail.com','role','authenticated')::text,true);
set local role authenticated;
do $$
declare a uuid; b uuid; request uuid:=gen_random_uuid(); pay uuid:=gen_random_uuid(); purchase uuid; result jsonb; payload jsonb; lines jsonb; rejected boolean; before_count integer;
begin
 if auth.uid() is null then raise exception 'Graci auth fixture not available'; end if;
 a:=(public.quick_order_garment('AIHXO TEST ROLLBACK','Fixture','L','Negro',4)->>'id')::uuid;
 b:=(public.quick_order_garment('AIHXO TEST ROLLBACK','Fixture','XL','Negro',4)->>'id')::uuid;
 update public.base_stock_items set quantity=2 where id=a;
 payload:=jsonb_build_object('order_type','personalizado','customer_name','TEST ROLLBACK','shipping',5,'estimated_costs',jsonb_build_object('dtf',3,'packaging',1),'design_source','customer_final');
 lines:=jsonb_build_array(jsonb_build_object('item_id',a,'quantity',2,'unit_price',10),jsonb_build_object('item_id',b,'quantity',3,'unit_price',12));
 result:=public.create_order_atomic(request,payload,lines);
 if (result->>'total')::numeric<>61 or (result->>'product_cost')::numeric<>24 then raise exception 'Totals incorrect: %',result;end if;
 if (result->>'base_stock_allocated')::boolean or result->>'production_status'<>'Pendiente llegada' then raise exception 'Waiting state incorrect';end if;
 if (select quantity from public.base_stock_items where id=a)<>0 then raise exception 'Stock reservation failed';end if;
 if (result->>'ai_design_allowed')::boolean then raise exception 'Customer artwork protection failed';end if;
 result:=public.create_order_atomic(request,payload,lines);
 if (select count(*) from public.base_stock_movements where item_id=a)<>1 then raise exception 'Retry deducted stock twice';end if;
 insert into public.purchases(purchase_number,description,status) values('TEST-'||request,'TEST ROLLBACK','Pedido') returning id into purchase;
 insert into public.purchase_lines(purchase_id,item_id,ordered_quantity,unit_cost) values(purchase,b,3,4);
 perform public.receive_stock_batch(jsonb_build_array(jsonb_build_object('item_id',b,'qty',3)),purchase);
 if not (select base_stock_allocated from public.orders where id=request) then raise exception 'Multi-line allocation failed';end if;
 if (select quantity from public.base_stock_items where id=b)<>0 then raise exception 'Receipt allocation incorrect';end if;
 rejected:=false;
 begin perform public.receive_stock_batch(jsonb_build_array(jsonb_build_object('item_id',b,'qty',3)),purchase);exception when others then rejected:=true;end;
 if not rejected then raise exception 'Duplicate receipt accepted';end if;
 perform public.record_order_payment(pay,request,20,'Bizum');
 perform public.record_order_payment(pay,request,20,'Bizum');
 if (select amount_paid from public.orders where id=request)<>20 then raise exception 'Duplicate payment';end if;
 perform public.record_order_payment(gen_random_uuid(),request,41,'Efectivo');
 if (select payment_status from public.orders where id=request)<>'Pagado' then raise exception 'Payment status';end if;
 perform public.record_order_payment(gen_random_uuid(),request,-5,'Efectivo','Devolución de prueba');
 if (select amount_paid from public.orders where id=request)<>56 then raise exception 'Refund failed';end if;
 rejected:=false;
 begin perform public.record_order_payment(gen_random_uuid(),request,10,'Bizum');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Overpayment accepted';end if;
 select count(*) into before_count from public.customers;
 rejected:=false;
 begin perform public.create_order_atomic(gen_random_uuid(),payload,jsonb_build_array(jsonb_build_object('item_id',a,'quantity',1.5,'unit_price',10)));exception when others then rejected:=true;end;
 if not rejected or (select count(*) from public.customers)<>before_count then raise exception 'Failed order was not rolled back';end if;
end;$$;
do $$
declare p uuid; o jsonb; req uuid:=gen_random_uuid();
begin
 insert into public.products(sku,category,model,size,color,garment_cost,dtf_cost,extras_cost,sale_price,stock) values('TEST-'||req,'TEST','TEST ROLLBACK','L','Negro',4,1,1,12,2) returning id into p;
 o:=public.create_order_atomic(req,'{"order_type":"catalogo","customer_name":"TEST CATALOG ROLLBACK","shipping":0}',jsonb_build_array(jsonb_build_object('product_id',p,'quantity',2,'unit_price',12)));
 if (o->>'product_cost')::numeric<>12 or (select stock from public.products where id=p)<>0 then raise exception 'Catalog totals / stock failed';end if;
end;$$;
reset role;
select 'PASS: Graci RLS, atomic multi-size order, idempotency, receipt, payments, refund and rollback' as test_result;
