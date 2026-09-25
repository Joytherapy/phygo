-- PHYGO Smart Study Panel — P1: widen knowledge_type to also cover
-- anatomical structures and clinical/functional tests (previously
-- conditions-only, see 2026-09_workspace_study_panel.sql). Same additive
-- CHECK-constraint-widen pattern as every other Workspace migration — no
-- new table, no new columns, just the value list a save is allowed to carry.

alter table workspace_knowledge_saves drop constraint if exists workspace_knowledge_saves_knowledge_type_check;
alter table workspace_knowledge_saves
  add constraint workspace_knowledge_saves_knowledge_type_check
  check (knowledge_type in ('condition', 'structure', 'test'));
