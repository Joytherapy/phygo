-- Quiz questions were V1-scoped to Italian-only content; the user asked for
-- full IT/EN/ES/FR generation, matching every other PHYGO string. Existing
-- cached rows (all generated in Italian so far) are correctly backfilled to
-- language = 'it' by the column default, so nothing already in the pool
-- needs to be touched or regenerated.

alter table quiz_questions
  add column if not exists language text not null default 'it'
  check (language in ('it', 'en', 'es', 'fr'));

drop index if exists quiz_questions_subject_difficulty_idx;
create index if not exists quiz_questions_subject_difficulty_language_idx
  on quiz_questions(subject, difficulty, language);
