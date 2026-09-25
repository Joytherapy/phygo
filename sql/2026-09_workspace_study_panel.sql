-- PHYGO Workspace — Smart Study Panel (select text in a document → resolve
-- to an existing PHYGO knowledge object → view it in-context → optionally
-- pin a reference card onto the page, or save it to a personal list).
--
-- Per the feature's own architecture rule ("reuse existing tables/knowledge,
-- create the smallest normalized structure possible"):
--   - The KNOWLEDGE ITSELF is never duplicated — the panel reads directly
--     from the existing `knowledge_base` table (already the single,
--     already-translated source of truth for condition-type content across
--     every Library section — see app/api/knowledge-lookup/route.ts).
--   - A card PINNED ONTO A PAGE reuses the existing, already-generic
--     workspace_annotations system (position/size/delete/undo already all
--     work for any type) — this migration only widens its `type` CHECK
--     constraint, exactly like 2026-09_workspace_image_annotations.sql did
--     for 'image'. No x/y/width columns are duplicated here.
--   - Only a genuinely new concept — "the user's personal saved-knowledge
--     list", independent of any one document/page — has no existing table,
--     so workspace_knowledge_saves is added below.

alter table workspace_annotations drop constraint if exists workspace_annotations_type_check;
alter table workspace_annotations
  add constraint workspace_annotations_type_check
  check (type in ('highlight', 'stroke', 'text', 'shape', 'image', 'knowledge_card'));
-- knowledge_card data shape: { x, y, width, knowledgeType: 'condition',
-- knowledgeId, title, category, sectionLabel, href } — same normalized 0..1
-- x/y/width convention as 'image' (see lib/workspace/types.ts).

create table if not exists workspace_knowledge_saves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  knowledge_type text not null check (knowledge_type in ('condition')), -- widen when structures/tests are added (P1)
  knowledge_id text not null, -- knowledge_base.id, stored as text to stay generic across future knowledge_type sources with non-uuid keys
  title text not null,
  category text,
  section_label text,
  href text,
  personal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, knowledge_type, knowledge_id)
);
create index if not exists workspace_knowledge_saves_owner_idx on workspace_knowledge_saves(owner_id);

alter table workspace_knowledge_saves enable row level security;

drop policy if exists workspace_knowledge_saves_owner on workspace_knowledge_saves;
create policy workspace_knowledge_saves_owner on workspace_knowledge_saves
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop trigger if exists trg_workspace_knowledge_saves_updated on workspace_knowledge_saves;
create trigger trg_workspace_knowledge_saves_updated before update on workspace_knowledge_saves
  for each row execute function workspace_set_updated_at();
