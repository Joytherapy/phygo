-- PHYGO Quiz — student-facing, per-subject, per-difficulty practice quizzes.
-- Questions are auto-generated (OpenAI, same integration already used by
-- /api/ask-phygo) from PHYGO's own existing content tables, then cached
-- here so the same question bank is reused across students instead of
-- calling the model on every quiz start. No RLS read policy on
-- quiz_questions is intentional: it is shared reference content, not
-- user-owned, and is only ever read through /api/quiz/* via the
-- service-role client (same treatment as ask_phygo_usage) — this also
-- keeps `correct_index`/`explanation` out of reach of a direct anon/
-- authenticated query, which a row-level (not column-level) RLS policy
-- could not do on its own.

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question text not null,
  options jsonb not null, -- array of option strings (4)
  correct_index int not null check (correct_index >= 0 and correct_index <= 3),
  explanation text,
  source_table text,
  source_id text,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_subject_difficulty_idx on quiz_questions(subject, difficulty);

alter table quiz_questions enable row level security;
-- deliberately no policies — see note above.

-- Per-attempt results, so a student can see progress by subject over time.
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  total_questions int not null,
  correct_count int not null,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_owner_idx on quiz_attempts(owner_id);
create index if not exists quiz_attempts_owner_subject_idx on quiz_attempts(owner_id, subject);

alter table quiz_attempts enable row level security;
drop policy if exists quiz_attempts_owner on quiz_attempts;
create policy quiz_attempts_owner on quiz_attempts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
