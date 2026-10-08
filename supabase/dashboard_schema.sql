-- ============================================================================
-- dashboard_schema.sql — บัญชีเข้าสู่ระบบของแดชบอร์ด (แยกจาก schema `app` ของแอปจัดการขยะ)
--
-- รันครั้งเดียวใน Supabase → SQL Editor (รันซ้ำได้) แล้ว:
--   1) Settings → API → Exposed schemas: เพิ่ม `dashboard`
--   2) Authentication → Providers → Email: ปิด "Allow new users to sign up" (ตั้งค่านี้มีผลทั้งโปรเจกต์ — ตรวจก่อนว่าแอปจัดการขยะไม่ได้ใช้การสมัครผ่าน Supabase Auth)
--   3) pnpm run create-root-admin <email>
--
-- Supabase Auth เก็บแค่อีเมล+รหัสผ่าน; บทบาท/สถานะอยู่ที่ dashboard.accounts
-- ============================================================================

create schema if not exists dashboard;

create table if not exists dashboard.accounts (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null unique,
  full_name            text not null,
  role                 text not null default 'user',
  status               text not null default 'unverified',
  is_root              boolean not null default false,
  email_verified_at    timestamptz,
  approved_at          timestamptz,
  approved_by          uuid references dashboard.accounts(id) on delete set null,
  sessions_valid_after timestamptz not null default now(),
  last_email_sent_at   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint accounts_role_check   check (role in ('user', 'admin')),
  constraint accounts_status_check check (status in ('unverified', 'pending', 'active', 'disabled')),
  -- root ต้องเป็นแอดมินที่ใช้งานอยู่เสมอ
  constraint accounts_root_is_active_admin check (not is_root or (role = 'admin' and status = 'active'))
);

-- root มีได้คนเดียว
create unique index if not exists accounts_single_root on dashboard.accounts (is_root) where is_root;
create index if not exists accounts_status_created on dashboard.accounts (status, created_at desc);

create or replace function dashboard.tg_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger accounts_touch
  before update on dashboard.accounts
  for each row execute function dashboard.tg_touch_updated_at();

-- ----------------------------------------------------------------------------
-- สร้างแถว dashboard.accounts ใน transaction เดียวกับที่ Supabase Auth สร้างผู้ใช้
-- (insert ล้ม = สร้างผู้ใช้ล้มด้วย) เฉพาะผู้ใช้ที่เซิร์ฟเวอร์แดชบอร์ดติดป้าย source = dashboard
-- Supabase Auth (admin API) INSERT ผู้ใช้ก่อน แล้วค่อย UPDATE app_metadata ใน transaction เดียวกัน
-- จึงดักทั้ง insert และ update ของ raw_app_meta_data — ทำงานครั้งแรกที่ source กลายเป็น dashboard
-- บทบาท/สถานะใช้ค่าเริ่มต้นเสมอ (user/unverified) — ไม่อ่านจาก metadata จึงสร้างแอดมินผ่านทางนี้ไม่ได้
-- ----------------------------------------------------------------------------
create or replace function dashboard.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'source' is distinct from 'dashboard' then
    return new;
  end if;
  -- เป็นบัญชีแดชบอร์ดอยู่แล้ว (เช่น Supabase อัปเดต providers ภายหลัง) — ไม่ต้องสร้างซ้ำ
  if tg_op = 'UPDATE' then
    if old.raw_app_meta_data ->> 'source' = 'dashboard' then
      return new;
    end if;
  end if;

  insert into dashboard.accounts (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- create or replace (ไม่ใช่ drop + create) เพราะ auth.users เป็นของ supabase_auth_admin — drop ต้องเป็นเจ้าของตาราง
create or replace trigger dashboard_on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function dashboard.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- ย้าย root ไปบัญชีอื่นที่ใช้งานอยู่ ภายใน transaction เดียว (ไม่มีช่วงที่ root เป็น 0 หรือ 2 คน)
--   DB001 = ไม่พบบัญชี, DB002 = บัญชีไม่ได้อยู่ในสถานะ active
-- ----------------------------------------------------------------------------
create or replace function dashboard.transfer_root(p_new_root uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from dashboard.accounts where id = p_new_root for update;
  if not found then
    raise exception 'account not found' using errcode = 'DB001';
  end if;
  if v_status <> 'active' then
    raise exception 'account is not active' using errcode = 'DB002';
  end if;

  update dashboard.accounts set is_root = false where is_root and id <> p_new_root;
  update dashboard.accounts set is_root = true, role = 'admin' where id = p_new_root;
end;
$$;

-- ----------------------------------------------------------------------------
-- สิทธิ์: เฉพาะ service_role (เซิร์ฟเวอร์แดชบอร์ด) — anon/authenticated เข้าไม่ได้เลย
-- ----------------------------------------------------------------------------
alter table dashboard.accounts enable row level security;

revoke all on schema dashboard from public, anon, authenticated;
grant usage on schema dashboard to service_role;

revoke all on all tables in schema dashboard from public, anon, authenticated;
grant select, insert, update, delete on dashboard.accounts to service_role;

revoke all on function dashboard.tg_touch_updated_at() from public, anon, authenticated;
revoke all on function dashboard.handle_new_auth_user() from public, anon, authenticated;
revoke all on function dashboard.transfer_root(uuid) from public, anon, authenticated;
grant execute on function dashboard.transfer_root(uuid) to service_role;
