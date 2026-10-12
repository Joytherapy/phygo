-- Minimal local replica of the Supabase pieces the security migrations touch:
-- roles, auth.uid(), the clinical tables (only the columns the policies use)
-- and the live RLS policies from docs/security/live-clinical-rls-2026-10-12.sql.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;

create table profiles (
  id uuid primary key, plan text not null default 'free', role text default 'physio', display_name text,
  registration_number text, practice_stage text not null default 'professional',
  professional_status text not null default 'not_applicable'
);
create table patients (id uuid primary key, user_id uuid not null, name text not null, patient_user_id uuid);
create table notes (id uuid primary key default gen_random_uuid(), patient_id uuid not null, user_id uuid not null, assessment text);
create table appointments (id uuid primary key default gen_random_uuid(), patient_id uuid, requested_by text, status text);
create table patient_clinical_references (id uuid primary key default gen_random_uuid(), patient_id uuid);
create table patient_invites (id uuid primary key default gen_random_uuid(), patient_id uuid, code text, used_at timestamptz, expires_at timestamptz);
create table video_calls (id uuid primary key default gen_random_uuid(), patient_id uuid);
create table metabolic_profiles (id uuid primary key default gen_random_uuid(), patient_id uuid);
create table demo_usage (ip text primary key, count int);
create table ask_phygo_usage (ip text primary key, request_count int not null default 0, window_start timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['profiles','patients','notes','appointments','patient_clinical_references','patient_invites','video_calls','metabolic_profiles','demo_usage','ask_phygo_usage'] loop
    execute format('alter table %I enable row level security', t);
    execute format('grant all on %I to anon, authenticated, service_role', t);
  end loop;
end $$;

-- Live SECURITY DEFINER function, as defined in production.
create function redeem_patient_invite(invite_code text) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_patient_id uuid; v_invite_id uuid;
begin
  select id, patient_id into v_invite_id, v_patient_id from patient_invites where code = invite_code and used_at is null and expires_at > now();
  if v_patient_id is null then raise exception 'Invalid or expired invite code'; end if;
  update patients set patient_user_id = auth.uid() where id = v_patient_id;
  update patient_invites set used_at = now() where id = v_invite_id;
  update profiles set role = 'patient' where id = auth.uid();
  return v_patient_id;
end; $$;
grant execute on function redeem_patient_invite(text) to authenticated;
