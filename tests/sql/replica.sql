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

-- profiles: every live column, default and check constraint (information_schema
-- and pg_constraint, read on 12 Oct 2026), so the migrations meet the real names.
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  role text default 'physio',
  display_name text,
  bio text,
  avatar_url text,
  credentials jsonb default '[]'::jsonb,
  registration_number text,
  practice_stage text not null default 'professional',
  professional_status text not null default 'not_applicable',
  preferred_language text not null default 'it',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role = any (array['physio', 'patient'])),
  constraint profiles_practice_stage_check check (practice_stage = any (array['student', 'professional'])),
  constraint profiles_professional_status_check check (professional_status = any (array['not_applicable', 'pending', 'verified']))
);
create table patients (id uuid primary key, user_id uuid not null, name text not null, patient_user_id uuid);
create table notes (id uuid primary key default gen_random_uuid(), patient_id uuid not null, user_id uuid not null, assessment text);
create table appointments (id uuid primary key default gen_random_uuid(), patient_id uuid, physio_id uuid, scheduled_at timestamptz not null default now(), requested_by text, status text);
create table patient_clinical_references (id uuid primary key default gen_random_uuid(), patient_id uuid, note_id uuid, content_type text, content_id text);
create table patient_invites (id uuid primary key default gen_random_uuid(), patient_id uuid, code text, created_by uuid, used_at timestamptz, expires_at timestamptz);
create table video_calls (id uuid primary key default gen_random_uuid(), patient_id uuid, room_url text not null default 'https://x.daily.co/r', room_name text, created_by uuid, status text default 'active');
create table metabolic_profiles (id uuid primary key default gen_random_uuid(), patient_id uuid);
create table demo_usage (ip text primary key, count int);
create table ask_phygo_usage (ip text primary key, request_count int not null default 0, window_start timestamptz not null default now());

-- Foreign keys exactly as live (pg_constraint, 12 Oct 2026): deleting a patient
-- cascades to its clinical rows; deleting a note clears note_id on its links.
alter table patients add foreign key (user_id) references auth.users(id) on delete cascade,
  add foreign key (patient_user_id) references auth.users(id);
alter table notes add foreign key (patient_id) references patients(id) on delete cascade,
  add foreign key (user_id) references auth.users(id) on delete cascade;
alter table appointments add foreign key (patient_id) references patients(id) on delete cascade,
  add foreign key (physio_id) references auth.users(id);
alter table patient_invites add foreign key (patient_id) references patients(id) on delete cascade;
alter table video_calls add foreign key (patient_id) references patients(id) on delete cascade;
alter table patient_clinical_references add foreign key (patient_id) references patients(id) on delete cascade,
  add foreign key (note_id) references notes(id) on delete set null;
alter table metabolic_profiles add foreign key (patient_id) references patients(id) on delete cascade;

do $$ declare t text; begin
  foreach t in array array['profiles','patients','notes','appointments','patient_clinical_references','patient_invites','video_calls','metabolic_profiles','demo_usage','ask_phygo_usage'] loop
    execute format('alter table %I enable row level security', t);
    execute format('grant all on %I to anon, authenticated, service_role', t);
  end loop;
end $$;

-- Live SECURITY DEFINER functions and the signup trigger, as defined in production.
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'free');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

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

-- Storage (approximation, for sql/2026-10_verification_evidence_PROPOSED.sql):
-- Supabase grants table privileges on storage.objects to the client roles and
-- relies on RLS policies. The live storage policies were not snapshotted; one
-- bucket-scoped policy like the workspace one stands in for them, so the tests
-- show that a policy scoped to another bucket does not reach a new bucket.
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
insert into storage.buckets (id, name, public) values ('workspace-files', 'workspace-files', false) on conflict do nothing;
create or replace function storage.foldername_first(name text) returns text language sql immutable as $$ select split_part(name, '/', 1) $$;
create policy "workspace owners" on storage.objects for all to authenticated
  using (bucket_id = 'workspace-files' and (storage.foldername_first(name)) = auth.uid()::text)
  with check (bucket_id = 'workspace-files' and (storage.foldername_first(name)) = auth.uid()::text);
