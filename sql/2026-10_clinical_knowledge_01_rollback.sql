-- Rollback for 2026-10_clinical_knowledge_01_schema.sql.
-- Removes only what step 1 added. Run the step 3 and step 2 rollbacks first
-- if those steps were applied. Any draft or protocol written after step 1 is
-- lost, so export clinical_content_drafts and rehab_protocols before running.

begin;

drop function if exists promote_condition_draft(text);
drop function if exists backfill_legacy_protocols();
drop table if exists clinical_content_drafts;
drop table if exists rehab_phase_exercises;
alter table rehab_phases
  drop column if exists protocol_id,
  drop column if exists regression_criteria,
  drop column if exists reassessment;
drop table if exists protocol_sources;
drop table if exists rehab_protocol_conditions;
drop table if exists rehab_protocols;
drop table if exists condition_sources;
drop table if exists clinical_sources;

alter table condition_translations
  drop constraint if exists condition_translations_status_check,
  drop column if exists translation_status,
  drop column if exists reviewed_by,
  drop column if exists reviewed_at;

drop index if exists knowledge_base_slug_key;
alter table knowledge_base
  drop constraint if exists knowledge_base_review_status_check,
  drop column if exists review_status,
  drop column if exists reviewed_by,
  drop column if exists reviewed_at,
  drop column if exists review_notes,
  drop column if exists synonyms,
  drop column if exists specialty,
  drop column if exists body_region,
  drop column if exists clinical_presentation,
  drop column if exists assessment_considerations,
  drop column if exists field_status,
  drop column if exists slug,
  drop column if exists updated_at;

commit;
