-- PROPOSED - NOT APPLIED. Needs the owner's approval. Part B of 2 (PR #8).
-- Apply AFTER Part A, AFTER 2026-10_security_clinical_rls_hardening_PROPOSED.sql
-- (PR #5, whose notes policies these replace and extend), and only once the
-- transition list holds every existing account that should keep working.
--
-- Real patient management requires can_manage_patients() (verified, or on the
-- owner's transition list). For everybody else:
--   - CREATING, CHANGING or DELETING patients, notes, appointments,
--     invitations, video calls and clinical links is refused;
--   - the existing records of their own patients stay readable (nothing is hidden);
--   - patients keep exactly their current access to their own data
--     (My Phygo, appointment requests, invite redemption): those policies and
--     redeem_patient_invite() are not changed.
-- Deleting a patient cascades (foreign keys ON DELETE CASCADE, which do not
-- check RLS) to its notes, appointments, invitations, video calls, clinical
-- links and metabolic profiles; deleting a note sets note_id to null on its
-- clinical links. Because the DELETE on patients itself requires
-- can_manage_patients(), only authorised clinicians can trigger a cascade.
-- Also: new invitations and video calls must record the signed-in clinician
-- as creator, and video calls must point to a Daily room
-- (https://<team>.daily.co/...), so a patient is never sent elsewhere.
--
-- ROLLBACK. There is deliberately NO block here that returns to the earlier
-- (PR #5) rules: those let any signed-in account manage patient data.
-- If something goes wrong, use one of these instead (see
-- docs/security/professional-verification-rollout.md):
--   - the wrong people have (or lack) access: edit professional_transition_accounts
--     or approve/reject in the admin page; immediate, no SQL file needed;
--   - emergency stop: sql/2026-10_patient_management_R_freeze_PROPOSED.sql
--     makes every browser create/change/delete on these tables fail for
--     everyone (reads keep working); undo it by re-running Part A;
--   - the application misbehaves: roll the CODE back to a deployment that
--     contains PR #7 or later; these rules stay in place and keep protecting
--     patient data whatever the code does.
-- Part A must stay while these policies exist: PostgreSQL refuses to drop its
-- function, and Part A's own rollback block refuses to run. Never use
-- DROP ... CASCADE on it.

begin;

-- patients: read own (unchanged); create, change and delete need can_manage_patients().
drop policy if exists "Users can delete their own patients" on patients;
create policy "Users can delete their own patients" on patients for delete
  using (auth.uid() = user_id and can_manage_patients());
drop policy if exists "Users can insert their own patients" on patients;
create policy "Users can insert their own patients" on patients for insert
  with check (auth.uid() = user_id and can_manage_patients());
drop policy if exists "Users can update their own patients" on patients;
create policy "Users can update their own patients" on patients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and can_manage_patients());

-- notes: own patient (PR #5) and can_manage_patients(); deleting too.
drop policy if exists "Users can delete their own notes" on notes;
create policy "Users can delete their own notes" on notes for delete
  using (auth.uid() = user_id and can_manage_patients());
drop policy if exists "Users can insert their own notes" on notes;
create policy "Users can insert their own notes" on notes for insert
  with check (auth.uid() = user_id
              and patient_id in (select id from patients where user_id = auth.uid())
              and can_manage_patients());
drop policy if exists "Users can update their own notes" on notes;
create policy "Users can update their own notes" on notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id
              and patient_id in (select id from patients where user_id = auth.uid())
              and can_manage_patients());

-- appointments (clinician side): the single FOR ALL policy is split; only reading stays open.
drop policy if exists "Physios manage appointments for their own patients" on appointments;
drop policy if exists "Physios read appointments for their own patients" on appointments;
create policy "Physios read appointments for their own patients" on appointments for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Physios delete appointments for their own patients" on appointments;
drop policy if exists "Verified physios delete appointments for their own patients" on appointments;
create policy "Verified physios delete appointments for their own patients" on appointments for delete
  using (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified physios create appointments for their own patients" on appointments;
create policy "Verified physios create appointments for their own patients" on appointments for insert
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified physios update appointments for their own patients" on appointments;
create policy "Verified physios update appointments for their own patients" on appointments for update
  using (patient_id in (select id from patients where user_id = auth.uid()))
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());

-- patient_invites: creating an invitation links a real person to the record.
drop policy if exists "Physios manage invites for their own patients" on patient_invites;
drop policy if exists "Physios read invites for their own patients" on patient_invites;
create policy "Physios read invites for their own patients" on patient_invites for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Physios delete invites for their own patients" on patient_invites;
drop policy if exists "Verified physios delete invites for their own patients" on patient_invites;
create policy "Verified physios delete invites for their own patients" on patient_invites for delete
  using (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified physios create invites for their own patients" on patient_invites;
create policy "Verified physios create invites for their own patients" on patient_invites for insert
  with check (patient_id in (select id from patients where user_id = auth.uid())
              and created_by = auth.uid() and can_manage_patients());
drop policy if exists "Verified physios update invites for their own patients" on patient_invites;
create policy "Verified physios update invites for their own patients" on patient_invites for update
  using (patient_id in (select id from patients where user_id = auth.uid()))
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());

-- video_calls: rows the patient opens from My Phygo; only verified clinicians
-- write them, and only with a Daily room URL.
drop policy if exists "Physios manage calls for their own patients" on video_calls;
drop policy if exists "Physios read calls for their own patients" on video_calls;
create policy "Physios read calls for their own patients" on video_calls for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Physios delete calls for their own patients" on video_calls;
drop policy if exists "Verified physios delete calls for their own patients" on video_calls;
create policy "Verified physios delete calls for their own patients" on video_calls for delete
  using (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified physios create calls for their own patients" on video_calls;
create policy "Verified physios create calls for their own patients" on video_calls for insert
  with check (patient_id in (select id from patients where user_id = auth.uid())
              and created_by = auth.uid()
              and room_url ~ '^https://[a-z0-9-]+\.daily\.co/'
              and can_manage_patients());
drop policy if exists "Verified physios update calls for their own patients" on video_calls;
create policy "Verified physios update calls for their own patients" on video_calls for update
  using (patient_id in (select id from patients where user_id = auth.uid()))
  with check (patient_id in (select id from patients where user_id = auth.uid())
              and room_url ~ '^https://[a-z0-9-]+\.daily\.co/'
              and can_manage_patients());

-- patient_clinical_references: clinical links visible to the patient.
drop policy if exists "Users can manage their own patient references" on patient_clinical_references;
drop policy if exists "Users can read their own patient references" on patient_clinical_references;
create policy "Users can read their own patient references" on patient_clinical_references for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Users can delete their own patient references" on patient_clinical_references;
drop policy if exists "Verified users can delete patient references" on patient_clinical_references;
create policy "Verified users can delete patient references" on patient_clinical_references for delete
  using (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified users can add patient references" on patient_clinical_references;
create policy "Verified users can add patient references" on patient_clinical_references for insert
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified users can update patient references" on patient_clinical_references;
create policy "Verified users can update patient references" on patient_clinical_references for update
  using (patient_id in (select id from patients where user_id = auth.uid()))
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());

commit;
