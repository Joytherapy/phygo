-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
-- Apply AFTER the 12 Oct 2026 security release (it is already live), and
-- BEFORE deploying the code of the evidence PR (the server reads the tables
-- below and fails closed when they are missing).
--
-- Professional verification with evidence: an audit trail of each request, a
-- private store for the registration document, and the deadline table for
-- accounts verified before documents were required. On its own this file
-- changes nobody's access:
--   - profiles.professional_status stays the one source of the verified status;
--   - can_manage_patients(), professional_transition_accounts and every
--     existing policy are untouched (the deadline is enforced in the database
--     only by sql/2026-10_verification_evidence_access_PROPOSED.sql, and only
--     for accounts given a deadline by ..._backfill_PROPOSED.sql);
--   - no existing policy is relaxed.
--
-- 1. professional_verification_requests: one row per submission (legal name,
--    registration number, territorial Order, private document path, accepted
--    declaration, the administrator's register check and the decision).
--    submitted_while_verified marks a request sent by an already verified
--    account with unchanged details: the account stays verified meanwhile.
-- 2. professional_verification_reviews: the history of administrator actions
--    (register checks and decisions) with an optional internal note. It is
--    protected, not absolute:
--      - no UPDATE, except removing the internal note (internal_note -> null,
--        note_redacted_at set) when its retention period ends;
--      - no direct DELETE or TRUNCATE; rows go only with their request or
--        account (foreign-key cascade: account deletion, or the documented
--        retention of old requests);
--      - the service role has no DELETE or TRUNCATE privilege on it;
--      - the database owner (postgres) can still change anything: this is a
--        guard against application mistakes, not against the owner.
-- 3. professional_evidence_deadlines: per-account date by which an account
--    verified before this feature must have a document confirmed. Empty here.
-- 4. Functions for the server (service role only), each one transaction, so a
--    failed history write never leaves a half-applied decision:
--      verification_submit, verification_record_check, verification_decide.
-- 5. Storage bucket verification-documents: private, 4 MB, PDF/JPEG/PNG only.
--
-- Access: the request and review tables have RLS on and NO policy, and
-- anon/authenticated have no privilege on them or on the functions; the bucket
-- has no storage policy for anon or authenticated. Only the server (service
-- role) reads and writes, after its own permission checks. Users see their own
-- request only through /api/profile/verification (a filtered view, never the
-- internal note or the reviewer's identity) and their own deadline row.
--
-- Before applying, check that no existing storage.objects policy grants
-- anon/authenticated access to every bucket (read-only):
--   select policyname, roles, cmd, qual, with_check from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
-- A policy without a bucket_id condition would also reach this bucket.
--
-- Rollback (only while no request and no deadline exists; it refuses
-- otherwise, so evidence and the audit trail are never dropped by mistake;
-- roll back the access file first if it was applied):
--   begin;
--   do $g$ begin
--     if exists (select 1 from professional_verification_requests)
--        or exists (select 1 from professional_evidence_deadlines) then
--       raise exception 'verification requests or deadlines exist: export and review them before removing this feature';
--     end if;
--     if position('professional_evidence_deadlines' in pg_get_functiondef('public.can_manage_patients()'::regprocedure)) > 0 then
--       raise exception 'can_manage_patients() still reads the deadlines: re-run Part A first (see the access file)';
--     end if;
--   end $g$;
--   drop function if exists verification_submit(uuid, uuid, text, text, text, text, text, text, text, integer, text);
--   drop function if exists verification_record_check(uuid, text, text, text);
--   drop function if exists verification_decide(uuid, text, text, text, text, text);
--   drop table if exists professional_evidence_deadlines;
--   drop table if exists professional_verification_reviews;
--   drop table if exists professional_verification_requests;
--   drop function if exists professional_verification_reviews_guard();
--   delete from storage.buckets where id = 'verification-documents';
--   commit;

begin;

create table if not exists professional_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legal_first_name text not null check (char_length(legal_first_name) between 1 and 80),
  legal_last_name text not null check (char_length(legal_last_name) between 1 and 80),
  registry_country text not null check (registry_country ~ '^[A-Z]{2}$'),
  registry_name text not null check (char_length(registry_name) between 2 and 120),
  registration_number text not null check (char_length(registration_number) between 1 and 40),
  document_path text,
  document_mime text check (document_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  document_size integer check (document_size between 1 and 4194304),
  document_deleted_at timestamptz,
  declaration_version text not null,
  declaration_accepted_at timestamptz not null,
  submitted_while_verified boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'needs_info', 'verified', 'rejected', 'superseded')),
  submitted_at timestamptz not null default now(),
  registry_check text not null default 'not_checked'
    check (registry_check in ('not_checked', 'match', 'mismatch', 'not_found')),
  registry_checked_at timestamptz,
  registry_checked_by text,
  decided_at timestamptz,
  decided_by text,
  rejection_category text
    check (rejection_category in ('not_in_register', 'data_mismatch', 'document_unreadable', 'document_not_valid', 'other')),
  user_message text check (char_length(user_message) <= 500),
  -- A document path always lives under the owner's folder.
  constraint verification_document_in_owner_folder
    check (document_path is null or document_path like user_id::text || '/' || id::text || '/%'),
  -- Lets each history entry point at a request of the same account.
  constraint professional_verification_requests_id_user unique (id, user_id)
);
create index if not exists professional_verification_requests_user on professional_verification_requests (user_id, submitted_at desc);
create index if not exists professional_verification_requests_status on professional_verification_requests (status, submitted_at);

create table if not exists professional_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- null for a decision on an account that has no request (for example, the
  -- revocation of an account verified before documents were required).
  request_id uuid,
  action text not null check (action in ('registry_check', 'verified', 'confirmed', 'needs_info', 'rejected', 'revoked')),
  registry_check text check (registry_check in ('match', 'mismatch', 'not_found')),
  rejection_category text
    check (rejection_category in ('not_in_register', 'data_mismatch', 'document_unreadable', 'document_not_valid', 'other')),
  internal_note text check (char_length(internal_note) <= 1000),
  note_redacted_at timestamptz,
  reviewer text not null,
  created_at timestamptz not null default now(),
  constraint professional_verification_reviews_request
    foreign key (request_id, user_id) references professional_verification_requests (id, user_id) on delete cascade
);
create index if not exists professional_verification_reviews_user on professional_verification_reviews (user_id, created_at);
create index if not exists professional_verification_reviews_request on professional_verification_reviews (request_id, created_at);

-- The history guard (see 2. in the header).
create or replace function professional_verification_reviews_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'TRUNCATE' then
    raise exception 'the verification history cannot be truncated' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    -- Depth 1 is a direct DELETE; a foreign-key cascade runs one level deeper.
    if pg_trigger_depth() > 1 then return old; end if;
    raise exception 'verification history entries are removed only with their request or account' using errcode = '42501';
  end if;
  -- UPDATE: only the removal of the internal note, once.
  if old.note_redacted_at is null
     and new.note_redacted_at is not null
     and new.internal_note is null
     and (new.id, new.user_id, new.request_id, new.action, new.registry_check, new.rejection_category, new.reviewer, new.created_at)
         is not distinct from
         (old.id, old.user_id, old.request_id, old.action, old.registry_check, old.rejection_category, old.reviewer, old.created_at) then
    return new;
  end if;
  raise exception 'verification history entries cannot be changed' using errcode = '42501';
end $$;
drop trigger if exists professional_verification_reviews_guard_rows on professional_verification_reviews;
create trigger professional_verification_reviews_guard_rows
  before update or delete on professional_verification_reviews
  for each row execute function professional_verification_reviews_guard();
drop trigger if exists professional_verification_reviews_guard_truncate on professional_verification_reviews;
create trigger professional_verification_reviews_guard_truncate
  before truncate on professional_verification_reviews
  for each statement execute function professional_verification_reviews_guard();

create table if not exists professional_evidence_deadlines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  due_at timestamptz not null,
  added_at timestamptz not null default now(),
  added_by text not null,
  note text,
  satisfied_at timestamptz,
  constraint professional_evidence_deadline_window check (due_at > added_at and due_at <= added_at + interval '90 days')
);

alter table professional_verification_requests enable row level security;
alter table professional_verification_reviews enable row level security;
alter table professional_evidence_deadlines enable row level security;
revoke all on professional_verification_requests from anon, authenticated;
revoke all on professional_verification_reviews from anon, authenticated;
revoke all on professional_evidence_deadlines from anon, authenticated;
grant select, insert, update, delete on professional_verification_requests to service_role;
grant select, insert, update on professional_verification_reviews to service_role;
revoke delete, truncate on professional_verification_reviews from service_role;
grant select, insert, update on professional_evidence_deadlines to service_role;
-- Users read only their own deadline (to see the date); nothing else.
drop policy if exists "Users can see their own evidence deadline" on professional_evidence_deadlines;
create policy "Users can see their own evidence deadline" on professional_evidence_deadlines
  for select using (user_id = auth.uid());
grant select on professional_evidence_deadlines to authenticated;

-- Server functions. Errors are raised as 'verification:<code>' so the API can
-- answer precisely; any error rolls back every write of the call.
-- Spaces and letter case do not count as a change of details.
create or replace function verification_same_text(a text, b text) returns boolean
language sql immutable set search_path = public as $$
  select lower(regexp_replace(btrim(coalesce(a, '')), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(coalesce(b, '')), '\s+', ' ', 'g'))
$$;

-- A new request with its document (already uploaded by the server under
-- p_document_path). A verified account whose name, number and Order are
-- unchanged stays verified while the document is reviewed; any other request
-- puts the account back to 'pending' with the new details. Earlier open
-- requests are superseded; their document paths are returned so the server
-- deletes the files.
create or replace function verification_submit(
  p_user_id uuid, p_request_id uuid, p_legal_first_name text, p_legal_last_name text,
  p_registry_country text, p_registry_name text, p_registration_number text,
  p_document_path text, p_document_mime text, p_document_size integer, p_declaration_version text
) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_profile profiles;
  v_last_verified professional_verification_requests;
  v_keep boolean;
  v_superseded text[];
begin
  select * into v_profile from profiles where id = p_user_id for update;
  if not found then raise exception 'verification:not_found'; end if;
  select * into v_last_verified from professional_verification_requests
    where user_id = p_user_id and status = 'verified' order by decided_at desc nulls last limit 1;
  v_keep := v_profile.professional_status = 'verified'
    and verification_same_text(v_profile.registry_country, p_registry_country)
    and verification_same_text(v_profile.registry_name, p_registry_name)
    and verification_same_text(v_profile.registration_number, p_registration_number)
    and (v_last_verified.id is null
         or (verification_same_text(v_last_verified.legal_first_name, p_legal_first_name)
             and verification_same_text(v_last_verified.legal_last_name, p_legal_last_name)));

  insert into professional_verification_requests (
    id, user_id, legal_first_name, legal_last_name, registry_country, registry_name, registration_number,
    document_path, document_mime, document_size, declaration_version, declaration_accepted_at,
    submitted_while_verified, status, submitted_at)
  values (
    p_request_id, p_user_id, p_legal_first_name, p_legal_last_name, p_registry_country, p_registry_name, p_registration_number,
    p_document_path, p_document_mime, p_document_size, p_declaration_version, now(),
    v_keep, 'pending', now());

  with replaced as (
    update professional_verification_requests set status = 'superseded', decided_at = now()
    where user_id = p_user_id and id <> p_request_id and status in ('pending', 'needs_info')
    returning document_path)
  select coalesce(array_agg(document_path) filter (where document_path is not null), '{}') into v_superseded from replaced;

  if v_keep then
    update profiles set verification_requested_at = now() where id = p_user_id;
  else
    update profiles set
      registry_country = p_registry_country, registry_name = p_registry_name, registration_number = p_registration_number,
      professional_status = 'pending', verification_requested_at = now(),
      verification_reviewed_at = null, verification_reviewed_by = null, verification_message = null
    where id = p_user_id;
  end if;
  return jsonb_build_object('kept_verified', v_keep, 'superseded_paths', to_jsonb(v_superseded));
end $$;

-- The administrator's own check on the official register, with its history entry.
create or replace function verification_record_check(p_request_id uuid, p_result text, p_note text, p_reviewer text)
returns void
language plpgsql set search_path = public as $$
declare
  v_request professional_verification_requests;
begin
  select * into v_request from professional_verification_requests where id = p_request_id for update;
  if not found then raise exception 'verification:not_found'; end if;
  if v_request.status not in ('pending', 'needs_info') then raise exception 'verification:already_decided'; end if;
  update professional_verification_requests
    set registry_check = p_result, registry_checked_at = now(), registry_checked_by = p_reviewer
    where id = p_request_id;
  insert into professional_verification_reviews (user_id, request_id, action, registry_check, internal_note, reviewer)
    values (v_request.user_id, p_request_id, 'registry_check', p_result, nullif(btrim(p_note), ''), p_reviewer);
end $$;

-- A decision on an account: 'verified' (approve, or confirm an already
-- verified account), 'needs_info' or 'rejected' (a revocation when the account
-- was verified). Profile, request, deadline and history change together.
--   - Approval needs the latest request to be open, to still have its
--     document, a recorded 'match' on the official register, and the same
--     details as the profile.
--   - needs_info on a verified account keeps it verified (the user is asked
--     for a better document); only a revocation removes access.
--   - A decided request is never rewritten: a later revocation is recorded in
--     the history and on the profile.
create or replace function verification_decide(
  p_user_id uuid, p_decision text, p_message text, p_category text, p_note text, p_reviewer text
) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_profile profiles;
  v_latest professional_verification_requests;
  v_open boolean;
  v_was_verified boolean;
  v_status text;
  v_action text;
begin
  if p_decision not in ('verified', 'needs_info', 'rejected') then raise exception 'verification:invalid_decision'; end if;
  if p_decision <> 'verified' and nullif(btrim(p_message), '') is null then raise exception 'verification:message_required'; end if;
  if p_decision = 'rejected' and (p_category is null or p_category not in ('not_in_register', 'data_mismatch', 'document_unreadable', 'document_not_valid', 'other')) then
    raise exception 'verification:category_required';
  end if;
  select * into v_profile from profiles where id = p_user_id for update;
  if not found then raise exception 'verification:not_found'; end if;
  select * into v_latest from professional_verification_requests
    where user_id = p_user_id order by submitted_at desc limit 1 for update;
  v_open := v_latest.id is not null and v_latest.status in ('pending', 'needs_info');
  v_was_verified := v_profile.professional_status = 'verified';

  if p_decision = 'verified' then
    if not v_open then raise exception 'verification:no_request'; end if;
    if v_latest.document_path is null then raise exception 'verification:no_document'; end if;
    if v_latest.registry_check <> 'match' then raise exception 'verification:registry_not_matched'; end if;
    if v_profile.registration_number is null then raise exception 'verification:no_registration'; end if;
    if not (verification_same_text(v_profile.registry_country, v_latest.registry_country)
            and verification_same_text(v_profile.registry_name, v_latest.registry_name)
            and verification_same_text(v_profile.registration_number, v_latest.registration_number)) then
      raise exception 'verification:details_changed';
    end if;
  end if;

  v_status := case when p_decision = 'needs_info' and v_was_verified then 'verified' else p_decision end;
  v_action := case
    when p_decision = 'verified' and v_was_verified then 'confirmed'
    when p_decision = 'rejected' and v_was_verified then 'revoked'
    else p_decision end;

  update profiles set
    professional_status = v_status, verification_reviewed_at = now(),
    verification_reviewed_by = p_reviewer, verification_message = nullif(btrim(p_message), '')
  where id = p_user_id;
  if v_open then
    update professional_verification_requests set
      status = p_decision, decided_at = now(), decided_by = p_reviewer,
      rejection_category = case when p_decision = 'rejected' then p_category end,
      user_message = nullif(btrim(p_message), '')
    where id = v_latest.id;
  end if;
  if p_decision = 'verified' then
    update professional_evidence_deadlines set satisfied_at = now() where user_id = p_user_id and satisfied_at is null;
  end if;
  insert into professional_verification_reviews (user_id, request_id, action, rejection_category, internal_note, reviewer)
    values (p_user_id, v_latest.id, v_action, case when p_decision = 'rejected' then p_category end, nullif(btrim(p_note), ''), p_reviewer);
  return jsonb_build_object('status', v_status, 'action', v_action, 'request_id', v_latest.id);
end $$;

revoke all on function verification_same_text(text, text) from public, anon, authenticated;
revoke all on function verification_submit(uuid, uuid, text, text, text, text, text, text, text, integer, text) from public, anon, authenticated;
revoke all on function verification_record_check(uuid, text, text, text) from public, anon, authenticated;
revoke all on function verification_decide(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function verification_same_text(text, text) to service_role;
grant execute on function verification_submit(uuid, uuid, text, text, text, text, text, text, text, integer, text) to service_role;
grant execute on function verification_record_check(uuid, text, text, text) to service_role;
grant execute on function verification_decide(uuid, text, text, text, text, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;
