-- Cache table for auto-generated English (and future language) translations
-- of knowledge_base conditions, used by the public /en/library/condition pages.
-- Nothing needs to be filled in by hand: the app writes into this table itself
-- the first time each condition is viewed in a given language, and reuses the
-- cached row on every later visit until the source condition changes.

begin;

create table if not exists condition_translations (
  id bigserial primary key,
  condition_id integer not null references knowledge_base(id) on delete cascade,
  lang text not null,
  condition_name text,
  goals text,
  clinical_tests text,
  red_flags text,
  contraindications text,
  typical_exercises text,
  progression_criteria text,
  return_to_activity_criteria text,
  outcome_measures text,
  source_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condition_id, lang)
);

alter table condition_translations enable row level security;

-- Translations are public, non-sensitive content (the same clinical text
-- already public in Italian) — safe to read for anyone. All writes happen
-- server-side with the service_role key, which bypasses RLS entirely, so no
-- insert/update/delete policy is needed here.
drop policy if exists "Public read access" on condition_translations;
create policy "Public read access" on condition_translations
  for select using (true);

commit;
