-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
-- Apply AFTER the 12 Oct 2026 security release (it is already live).
--
-- Professional verification with evidence: an audit trail of each request and
-- a private store for the registration document. It extends the existing flow
-- and does not change it:
--   - profiles.professional_status stays the one source of the verified status;
--   - can_manage_patients() and professional_transition_accounts are untouched;
--   - no existing policy is relaxed.
--
-- 1. professional_verification_requests: one row per submission. It holds the
--    legal name, the registration number, the territorial Order, the private
--    path of the document, the accepted declaration (version and time), the
--    administrator's check against the official register, and the decision.
-- 2. professional_verification_reviews: append-only history of administrator
--    actions (registry checks and decisions), with an internal note.
-- 3. Storage bucket verification-documents: private, 4 MB, PDF/JPEG/PNG only.
--
-- Access: both tables have RLS on and NO policy, and anon/authenticated have
-- no privilege on them; the bucket has no storage policy for anon or
-- authenticated. Only the server (service role) reads and writes, after its
-- own permission checks (lib/verificationEvidence.ts). Users see their own
-- request only through /api/profile/verification, which returns a filtered
-- view (never the internal note or the reviewer's identity).
--
-- Before applying, check that no existing storage.objects policy grants
-- anon/authenticated access to every bucket (read-only):
--   select policyname, roles, cmd, qual, with_check from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
-- A policy without a bucket_id condition would also reach this bucket.
--
-- Rollback (only while no request exists; it refuses otherwise, so evidence
-- and the audit trail are never dropped by mistake):
--   begin;
--   do $g$ begin
--     if exists (select 1 from professional_verification_requests) then
--       raise exception 'verification requests exist: export and review them before removing this feature';
--     end if;
--   end $g$;
--   drop table if exists professional_verification_reviews;
--   drop table if exists professional_verification_requests;
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
    check (document_path is null or document_path like user_id::text || '/' || id::text || '/%')
);
create index if not exists professional_verification_requests_user on professional_verification_requests (user_id, submitted_at desc);
create index if not exists professional_verification_requests_status on professional_verification_requests (status, submitted_at);

create table if not exists professional_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references professional_verification_requests(id) on delete cascade,
  action text not null check (action in ('registry_check', 'verified', 'needs_info', 'rejected', 'revoked')),
  registry_check text check (registry_check in ('match', 'mismatch', 'not_found')),
  rejection_category text,
  internal_note text check (char_length(internal_note) <= 1000),
  reviewer text not null,
  created_at timestamptz not null default now()
);
create index if not exists professional_verification_reviews_request on professional_verification_reviews (request_id, created_at);

alter table professional_verification_requests enable row level security;
alter table professional_verification_reviews enable row level security;
revoke all on professional_verification_requests from anon, authenticated;
revoke all on professional_verification_reviews from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;
