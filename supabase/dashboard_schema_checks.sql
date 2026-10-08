-- ============================================================================
-- ตรวจ dashboard_schema.sql — รันทั้งไฟล์ใน SQL Editor หลังรัน dashboard_schema.sql
-- ผ่าน = เห็น NOTICE "checks 1-5 passed" และ "check 6 passed"; ไม่ผ่าน = error ขึ้นต้นด้วย FAIL
-- ทุกอย่างอยู่ใน transaction ที่ rollback ตอนท้าย จึงไม่เหลือข้อมูลทดสอบ
-- ============================================================================
begin;

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'check-root@example.invalid', '{"source":"dashboard"}', '{"full_name":"Check Root"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'check-second@example.invalid', '{"source":"dashboard"}', '{"full_name":"Check Second"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'check-other-app@example.invalid', '{}', '{}', now(), now());

do $$
declare
  r1 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  r2 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  r3 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000003';
  v dashboard.accounts%rowtype;
begin
  -- 1. trigger สร้างแถวเฉพาะผู้ใช้ source = dashboard ด้วยค่าเริ่มต้น
  select * into v from dashboard.accounts where id = r1;
  if not found or v.role <> 'user' or v.status <> 'unverified' or v.full_name <> 'Check Root' or v.is_root then
    raise exception 'FAIL 1: trigger row for a dashboard user is wrong: %', row_to_json(v);
  end if;
  if exists (select 1 from dashboard.accounts where id = r3) then
    raise exception 'FAIL 1: trigger created a row for a non-dashboard user';
  end if;

  -- 2. root มีได้คนเดียว
  update dashboard.accounts set role = 'admin', status = 'active', is_root = true where id = r1;
  update dashboard.accounts set role = 'admin', status = 'active' where id = r2;
  begin
    update dashboard.accounts set is_root = true where id = r2;
    raise exception 'FAIL 2: a second root was allowed';
  exception when unique_violation then null;
  end;

  -- 3. root ต้องเป็นแอดมินที่ใช้งานอยู่
  begin
    update dashboard.accounts set status = 'disabled' where id = r1;
    raise exception 'FAIL 3: the root account could be disabled';
  exception when check_violation then null;
  end;

  -- 4. transfer_root ย้าย root และ root เดิมยังเป็นแอดมิน
  perform dashboard.transfer_root(r2);
  if (select is_root from dashboard.accounts where id = r1) or not (select is_root from dashboard.accounts where id = r2) then
    raise exception 'FAIL 4: transfer_root did not move root';
  end if;
  if (select role from dashboard.accounts where id = r1) <> 'admin' then
    raise exception 'FAIL 4: the old root lost its admin role';
  end if;

  -- 5. ย้าย root ไปบัญชีที่ไม่ active ไม่ได้
  update dashboard.accounts set status = 'disabled' where id = r1;
  begin
    perform dashboard.transfer_root(r1);
    raise exception 'FAIL 5: transfer_root accepted a disabled account';
  exception when sqlstate 'DB002' then null;
  end;

  raise notice 'checks 1-5 passed';
end;
$$;

-- 6. anon อ่านตารางไม่ได้
set local role anon;
do $$
begin
  perform 1 from dashboard.accounts limit 1;
  raise exception 'FAIL 6: anon can read dashboard.accounts';
exception when insufficient_privilege then
  raise notice 'check 6 passed';
end;
$$;
reset role;

rollback;
