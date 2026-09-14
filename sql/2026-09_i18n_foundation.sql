-- Foundation for whole-site (dashboard) multi-language support.
-- Two independent pieces:
--   1. profiles.preferred_language — lets a physiotherapist pick a language
--      for their own account, persisted so it's the same on every device.
--   2. content_translations — a GENERIC lazy-translate-and-cache table for
--      any dashboard content that isn't the `knowledge_base` conditions
--      table (which already has its own dedicated `condition_translations`
--      table, see sql/2026-09_condition_translations.sql, and keeps using
--      it — no need to migrate that data). This generic table is meant to
--      serve every other section as it gets translated: Brain Map zones,
--      Oncology structures, Cardiopulmonary conditions, Manual Therapy
--      techniques, Orthopedic tests, and anything hardcoded in a frontend
--      file that has a stable slug/id (e.g. a Body Map zone slug like
--      "cervical-spine" works fine as content_id even though that content
--      currently lives in a TSX file rather than a table).

alter table profiles
  add column if not exists preferred_language text not null default 'it';

create table if not exists content_translations (
  id bigserial primary key,
  content_type text not null,   -- e.g. 'brain_map_zone', 'oncology_structure', 'body_map_zone_anatomy'
  content_id text not null,     -- the source row's id or slug, as text (covers both numeric ids and string slugs)
  lang text not null,
  fields jsonb not null,        -- translated field values, keyed by field name
  source_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_id, lang)
);

alter table content_translations enable row level security;

drop policy if exists "Public read access" on content_translations;
create policy "Public read access" on content_translations
  for select using (true);
