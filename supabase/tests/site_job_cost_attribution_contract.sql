begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

select has_function('public','reconcile_site_job_costs',array['date','date','uuid'],'cost reconciliation RPC exists');
select ok(not has_function_privilege('anon','public.reconcile_site_job_costs(date,date,uuid)','EXECUTE'),'anon cannot execute reconciliation');
select ok(has_function_privilege('authenticated','public.reconcile_site_job_costs(date,date,uuid)','EXECUTE'),'authenticated can execute guarded reconciliation');
select ok(not has_function_privilege('authenticated','private.prepare_ppe_cost_snapshot()','EXECUTE'),'authenticated cannot execute private PPE helper');
select ok(not has_function_privilege('authenticated','private.prepare_fuel_cost_snapshot()','EXECUTE'),'authenticated cannot execute private fuel helper');
select ok(not has_function_privilege('authenticated','private.prepare_work_order_cost_snapshot()','EXECUTE'),'authenticated cannot execute private work-order helper');
select ok(not has_function_privilege('authenticated','private.normalize_vendor_site_allocations(uuid,jsonb)','EXECUTE'),'authenticated cannot execute private allocation helper');
select ok(not has_function_privilege('authenticated','private.guard_vendor_invoice_cost_state()','EXECUTE'),'authenticated cannot execute private invoice helper');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}';

insert into public.ppe_issue_records(id,organization_id,employee_id,item_type,size,unit_cost,order_date,status)
values ('71000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001','safety_boots','9',1000,date '2026-08-10','ordered');
insert into public.asset_fuel_entries(id,organization_id,asset_id,fuel_date,litres,unit_cost,recorded_by)
values ('71000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001',date '2026-08-11',10,25,'51000000-0000-4000-8000-000000000002');
insert into public.asset_work_orders(id,organization_id,asset_id,title,status,completed_at,cost)
values ('71000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','Completed test','completed',timestamptz '2026-08-12 22:30:00+00',500);
insert into public.vendor_accounts(id,organization_id,name)
values ('71000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','Attribution Vendor');
insert into public.vendor_invoice_records(id,organization_id,vendor_id,invoice_date,order_number,items_purchased,total,responsible_person,requested_by,requested_by_name,site_allocations)
values ('71000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000004',date '2026-08-13','ATTR-001','Test service',1000,'Office A','51000000-0000-4000-8000-000000000002','Office A','[{"siteId":"52000000-0000-4000-8000-000000000001","ratio":0.6},{"siteId":"52000000-0000-4000-8000-000000000002","ratio":0.4}]');

select is((select attribution_site_id from public.ppe_issue_records where id='71000000-0000-4000-8000-000000000001'),'52000000-0000-4000-8000-000000000001'::uuid,'PPE snapshots employee site');
select is((select job_number_snapshot from public.asset_fuel_entries where id='71000000-0000-4000-8000-000000000002'),'AUDIT-JOB-NORTH','fuel snapshots job number');
select throws_ok($$ update public.ppe_issue_records set unit_cost=1200 where id='71000000-0000-4000-8000-000000000001' $$,'P0001','Ordered PPE cost fields are immutable','ordered PPE cost is immutable');
select throws_ok($$ update public.asset_work_orders set status='open' where id='71000000-0000-4000-8000-000000000003' $$,'P0001','Completed or cancelled work orders are terminal','completed work order cannot reopen');
select throws_ok($$ update public.vendor_invoice_records set total=2000 where id='71000000-0000-4000-8000-000000000005' $$,'P0001','Vendor invoice commercial fields are immutable','invoice amount is immutable');

set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
update public.vendor_invoice_records set status='approved' where id='71000000-0000-4000-8000-000000000005';
select is((select director_reviewed_by from public.vendor_invoice_records where id='71000000-0000-4000-8000-000000000005'),'51000000-0000-4000-8000-000000000001'::uuid,'database derives invoice reviewer');
select throws_ok($$ update public.vendor_invoice_records set status='rejected' where id='71000000-0000-4000-8000-000000000005' $$,'23514','Invalid vendor invoice status transition','approved invoice cannot be rejected');

select is((select recognized_amount from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_id='71000000-0000-4000-8000-000000000001'),1000::numeric,'ordered PPE is recognized');
select is((select recognized_amount from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_id='71000000-0000-4000-8000-000000000002'),250::numeric,'fuel generated total is recognized once');
select is((select cost_date from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_id='71000000-0000-4000-8000-000000000003'),date '2026-08-13','timestamp cost date uses Johannesburg boundary');
select is((select recognized_amount from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_id='71000000-0000-4000-8000-000000000005'),1000::numeric,'approved invoice recognized once at organization scope');
select is((select recognized_amount from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01','52000000-0000-4000-8000-000000000001') where source_id='71000000-0000-4000-8000-000000000005'),600::numeric,'north filter receives invoice allocation share');
select is((select recognized_amount from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01','52000000-0000-4000-8000-000000000002') where source_id='71000000-0000-4000-8000-000000000005'),400::numeric,'south filter receives invoice allocation share');
select is((select count(*) from public.reconcile_site_job_costs(date '2026-08-13',date '2026-08-14',null) where source_id='71000000-0000-4000-8000-000000000005'),1::bigint,'period start is inclusive');
select is((select count(*) from public.reconcile_site_job_costs(date '2026-08-01',date '2026-08-13',null) where source_id='71000000-0000-4000-8000-000000000005'),0::bigint,'period end is exclusive');
select throws_ok($$ select * from public.reconcile_site_job_costs(date '2026-09-01',date '2026-08-01',null) $$,'22007','A valid half-open cost period is required','reversed period rejected');

set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000004","role":"authenticated","exp":4102444800}';
select throws_ok($$ select * from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) $$,'42501','Office or Director access required','site role cannot read commercial reconciliation');
set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000002","role":"authenticated","exp":1}';
select throws_ok($$ select * from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) $$,'42501','Active authenticated session required','expired JWT rejected');

reset role;
select ok((select not exists(select 1 from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_type='labour_provisional' and recognized_amount<>0)),'provisional labour is never recognized');
select ok((select not exists(select 1 from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_type='labour_provisional' and not (quality_reasons @> array['LABOUR_SOURCE_UNSTRUCTURED','LABOUR_RATE_UNIT_UNDEFINED']::text[]))),'provisional labour carries both quality reasons');
select is((select count(*) from public.reconcile_site_job_costs(date '2026-08-01',date '2026-09-01',null) where source_id='71000000-0000-4000-8000-000000000005'),1::bigint,'source-level invoice appears once without allocation double count');

select * from finish();
rollback;
