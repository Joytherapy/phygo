-- PROPOSED — NOT APPLIED. Patients stop reading the clinician's notes table directly.
--
-- Problem (live policy, docs/security/live-clinical-rls-2026-10-12.sql):
--   "Patients can read their own notes" grants SELECT on whole rows. A signed-in
--   patient can call GET /rest/v1/notes?select=* with their own session and
--   receive every column of every note on their record: subjective, objective,
--   assessment, plan, clinical_reasoning (AI-drafted hypotheses, differentials,
--   red flags, possibly not reviewed), exercises with internal checks, and the
--   clinician's user_id. My Phygo only shows the summary and the exercises.
--
-- Change: the policy is removed. Patients get their notes from
-- GET /api/my-phygo/notes, which resolves their record on the server and returns
-- only the summary for the patient, the exercises (internal fields removed),
-- the id and the date (lib/myPhygo/patientNote.ts).
-- Clinicians' policies on notes are not touched.
--
-- ORDER: deploy the code that uses /api/my-phygo/notes FIRST, then apply this.
-- If applied before that code is live, My Phygo shows no notes (nothing is
-- exposed; the patient just sees an empty history) until the deploy.
--
-- Apply in the Supabase SQL editor. Tested on a local PostgreSQL copy of the
-- live policies: tests/sql/patient_notes.sh.
--
-- Rollback (restores the live policy):
--   begin;
--   create policy "Patients can read their own notes" on notes for select
--     using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid())));
--   commit;

begin;

drop policy if exists "Patients can read their own notes" on notes;

commit;
