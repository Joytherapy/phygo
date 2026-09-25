-- PHYGO Workspace — image annotations ("insert/take a photo" on a document
-- or notebook page, like GoodNotes). Widens the existing `type` CHECK
-- constraint on workspace_annotations (see 2026-09_workspace_foundation.sql)
-- to also accept 'image', alongside the existing highlight/stroke/text/shape
-- types. No new table: an inserted photo is stored the same way every other
-- annotation is — its own row in workspace_annotations, with
-- data = { storageKey, naturalWidth, naturalHeight, x, y, width } — and the
-- actual image bytes live in the existing private `workspace-files` Storage
-- bucket (same bucket already used for imported PDFs), under
-- `<owner_id>/<uuid>.<ext>`, exactly like a PDF's storage_key.

alter table workspace_annotations drop constraint if exists workspace_annotations_type_check;
alter table workspace_annotations
  add constraint workspace_annotations_type_check
  check (type in ('highlight', 'stroke', 'text', 'shape', 'image'));
