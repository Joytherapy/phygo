-- PHYGO Workspace — foundation schema, applied 2026-09-20 (see conversation log).
-- Mirrors exactly what was run against the live project via the Supabase
-- migration tool; kept here for repo history, consistent with
-- sql/2026-09_i18n_foundation.sql.
--
-- Two migrations were applied, in this order:
--   1. workspace_foundation        (tables, RLS, triggers — this file)
--   2. workspace_storage_bucket    (the `workspace-files` private bucket + its RLS)
--
-- ============================================================
-- 1) workspace_foundation
-- ============================================================
-- PHYGO Workspace — foundation schema (additive, does not touch existing tables)
-- Personal study space: folders, PDF documents, notebooks, annotations, tags, bookmarks.
-- Strict tenant isolation: every row is owned by exactly one auth user (owner_id = auth.uid()),
-- enforced by RLS. Workspace content is never automatically linked to clinical data
-- (patients/notes) — see app-level boundary in lib/workspace.

-- ── Folders (self-referencing tree) ────────────────────────────────────────
create table if not exists workspace_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references workspace_folders(id) on delete cascade,
  name text not null,
  color text,
  starred boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists workspace_folders_owner_idx on workspace_folders(owner_id);
create index if not exists workspace_folders_parent_idx on workspace_folders(parent_id);

-- ── Notebooks (native PHYGO notebooks; pages added below) ──────────────────
create table if not exists workspace_notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references workspace_folders(id) on delete set null,
  name text not null,
  starred boolean not null default false,
  last_opened_at timestamptz,
  last_page_id uuid, -- FK added after workspace_notebook_pages exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists workspace_notebooks_owner_idx on workspace_notebooks(owner_id);
create index if not exists workspace_notebooks_folder_idx on workspace_notebooks(folder_id);

-- ── Notebook pages ───────────────────────────────────────────────────────
create table if not exists workspace_notebook_pages (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references workspace_notebooks(id) on delete cascade,
  position integer not null default 0,
  template text not null default 'blank' check (template in ('blank','ruled','grid','dotted')),
  content jsonb not null default '{}'::jsonb, -- Tiptap typed-note document
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workspace_notebook_pages_notebook_idx on workspace_notebook_pages(notebook_id, position);

alter table workspace_notebooks
  add constraint workspace_notebooks_last_page_fk
  foreign key (last_page_id) references workspace_notebook_pages(id) on delete set null;

-- ── Documents (uploaded PDFs) ───────────────────────────────────────────
create table if not exists workspace_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references workspace_folders(id) on delete set null,
  name text not null,
  storage_key text not null, -- path inside the `workspace-files` bucket, always "<owner_id>/<id>.pdf"
  mime_type text not null default 'application/pdf',
  size_bytes bigint,
  page_count integer,
  starred boolean not null default false,
  last_opened_at timestamptz,
  last_page integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists workspace_documents_owner_idx on workspace_documents(owner_id);
create index if not exists workspace_documents_folder_idx on workspace_documents(folder_id);

-- ── Annotations (highlights + freehand strokes + text/shape marks) ──────────
-- One row per annotation object, not one blob per page — keeps them editable,
-- deletable and (later) searchable/AI-readable individually.
create table if not exists workspace_annotations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('document','notebook_page')),
  target_id uuid not null, -- workspace_documents.id or workspace_notebook_pages.id
  page_number integer, -- only meaningful for target_type = 'document'
  type text not null check (type in ('highlight','stroke','text','shape')),
  data jsonb not null default '{}'::jsonb,
  -- highlight: { color, text, rects: [{x,y,w,h}] } in page-relative 0..1 coordinates
  -- stroke:    { tool: 'pen'|'highlighter'|'eraser', color, width, points: [[x,y,pressure]] }
  -- text:      { x, y, body, color }
  -- shape:     { kind: 'rect'|'line'|'arrow', x1,y1,x2,y2, color, width }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists workspace_annotations_target_idx on workspace_annotations(target_type, target_id);
create index if not exists workspace_annotations_owner_idx on workspace_annotations(owner_id);

-- ── Tags (free-form, per-owner) ─────────────────────────────────────────
create table if not exists workspace_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists workspace_item_tags (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references workspace_tags(id) on delete cascade,
  item_type text not null check (item_type in ('document','notebook')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, item_type, item_id)
);
create index if not exists workspace_item_tags_item_idx on workspace_item_tags(item_type, item_id);

-- ── Bookmarks (a specific page inside a document — distinct from "starred") ─
create table if not exists workspace_bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references workspace_documents(id) on delete cascade,
  page_number integer not null,
  label text,
  created_at timestamptz not null default now()
);
create index if not exists workspace_bookmarks_document_idx on workspace_bookmarks(document_id);

-- ── Row Level Security: every table is owner-only ───────────────────────
alter table workspace_folders enable row level security;
alter table workspace_notebooks enable row level security;
alter table workspace_notebook_pages enable row level security;
alter table workspace_documents enable row level security;
alter table workspace_annotations enable row level security;
alter table workspace_tags enable row level security;
alter table workspace_item_tags enable row level security;
alter table workspace_bookmarks enable row level security;

drop policy if exists workspace_folders_owner on workspace_folders;
create policy workspace_folders_owner on workspace_folders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_notebooks_owner on workspace_notebooks;
create policy workspace_notebooks_owner on workspace_notebooks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_documents_owner on workspace_documents;
create policy workspace_documents_owner on workspace_documents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_annotations_owner on workspace_annotations;
create policy workspace_annotations_owner on workspace_annotations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_tags_owner on workspace_tags;
create policy workspace_tags_owner on workspace_tags
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_bookmarks_owner on workspace_bookmarks;
create policy workspace_bookmarks_owner on workspace_bookmarks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workspace_notebook_pages_owner on workspace_notebook_pages;
create policy workspace_notebook_pages_owner on workspace_notebook_pages
  for all using (
    exists (select 1 from workspace_notebooks n where n.id = notebook_id and n.owner_id = auth.uid())
  ) with check (
    exists (select 1 from workspace_notebooks n where n.id = notebook_id and n.owner_id = auth.uid())
  );

drop policy if exists workspace_item_tags_owner on workspace_item_tags;
create policy workspace_item_tags_owner on workspace_item_tags
  for all using (
    exists (select 1 from workspace_tags t where t.id = tag_id and t.owner_id = auth.uid())
  ) with check (
    exists (select 1 from workspace_tags t where t.id = tag_id and t.owner_id = auth.uid())
  );

-- ── updated_at triggers (reuse moddatetime if available, else simple fn) ───
create or replace function workspace_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_workspace_folders_updated on workspace_folders;
create trigger trg_workspace_folders_updated before update on workspace_folders
  for each row execute function workspace_set_updated_at();

drop trigger if exists trg_workspace_notebooks_updated on workspace_notebooks;
create trigger trg_workspace_notebooks_updated before update on workspace_notebooks
  for each row execute function workspace_set_updated_at();

drop trigger if exists trg_workspace_notebook_pages_updated on workspace_notebook_pages;
create trigger trg_workspace_notebook_pages_updated before update on workspace_notebook_pages
  for each row execute function workspace_set_updated_at();

drop trigger if exists trg_workspace_documents_updated on workspace_documents;
create trigger trg_workspace_documents_updated before update on workspace_documents
  for each row execute function workspace_set_updated_at();

drop trigger if exists trg_workspace_annotations_updated on workspace_annotations;
create trigger trg_workspace_annotations_updated before update on workspace_annotations
  for each row execute function workspace_set_updated_at();

-- ============================================================
-- 2) workspace_storage_bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('workspace-files', 'workspace-files', false)
on conflict (id) do nothing;

drop policy if exists workspace_files_owner_select on storage.objects;
create policy workspace_files_owner_select on storage.objects
  for select using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists workspace_files_owner_insert on storage.objects;
create policy workspace_files_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists workspace_files_owner_update on storage.objects;
create policy workspace_files_owner_update on storage.objects
  for update using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists workspace_files_owner_delete on storage.objects;
create policy workspace_files_owner_delete on storage.objects
  for delete using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
