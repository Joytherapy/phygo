-- PROPOSED - NOT APPLIED. Needs the owner's approval. Part B of 2 (PR #8).
-- Apply AFTER Part A, AFTER 2026-10_security_clinical_rls_hardening_PROPOSED.sql
-- (PR #5, whose notes policies these replace and extend), and only once the
-- transition list holds every existing account that should keep working.
--
-- Real patient management requires can_manage_patients() (verified, or on the
-- owner's transition list). For everybody else:
--   - CREATING or CHANGING patients, notes, appointments, invitations, video
--     calls and clinical links is refused;
--   - their OWN existing records stay readable and deletable (they created
--     them; nothing is hidden or lost, and they can clean up);
--   - patients keep exactly their current access to their own data
--     (My Phygo, appointment requests, invite redemption): those policies and
--     redeem_patient_invite() are not changed.
-- Also: new invitations and video calls must record the signed-in clinician
-- as creator, and video calls must point to a Daily room
-- (https://<team>.daily.co/...), so a patient is never sent elsewhere.
--
-- Rollback (re-creates the policies as they are after PR #5):
--   begin;
--   drop policy if exists "Users can insert their own patients" on patients;
--   create policy "Users can insert their own patients" on patients for insert with check (auth.uid() = user_id);
--   drop policy if exists "Users can update their own patients" on patients;
--   create policy "Users can update their own patients" on patients for update using (auth.uid() = user_id);
--   drop policy if exists "Users can insert their own notes" on notes;
--   create policy "Users can insert their own notes" on notes for insert
--     with check (auth.uid() = user_id and patient_id in (select id from patients where user_id = auth.uid()));
--   drop policy if exists "Users can update their own notes" on notes;
--   create policy "Users can update their own notes" on notes for update using (auth.uid() = user_id)
--     with check (auth.uid() = user_id and patient_id in (select id from patients where user_id = auth.uid()));
--   drop policy if exists "Physios read appointments for their own patients" on appointments;
--   drop policy if exists "Physios delete appointments for their own patients" on appointments;
--   drop policy if exists "Verified physios create appointments for their own patients" on appointments;
--   drop policy if exists "Verified physios update appointments for their own patients" on appointments;
--   create policy "Physios manage appointments for their own patients" on appointments for all
--     using (patient_id in (select id from patients where user_id = auth.uid()))
--     with check (patient_id in (select id from patients where user_id = auth.uid()));
--   drop policy if exists "Physios read invites for their own patients" on patient_invites;
--   drop policy if exists "Physios delete invites for their own patients" on patient_invites;
--   drop policy if exists "Verified physios create invites for their own patients" on patient_invites;
--   drop policy if exists "Verified physios update invites for their own patients" on patient_invites;
--   create policy "Physios manage invites for their own patients" on patient_invites for all
--     using (patient_id in (select id from patients where user_id = auth.uid()))
--     with check (patient_id in (select id from patients where user_id = auth.uid()));
--   drop policy if exists "Physios read calls for their own patients" on video_calls;
--   drop policy if exists "Physios delete calls for their own patients" on video_calls;
--   drop policy if exists "Verified physios create calls for their own patients" on video_calls;
--   drop policy if exists "Verified physios update calls for their own patients" on video_calls;
--   create policy "Physios manage calls for their own patients" on video_calls for all
--     using (patient_id in (select id from patients where user_id = auth.uid()))
--     with check (patient_id in (select id from patients where user_id = auth.uid()));
--   drop policy if exists "Users can read their own patient references" on patient_clinical_references;
--   drop policy if exists "Users can delete their own patient references" on patient_clinical_references;
--   drop policy if exists "Verified users can add patient references" on patient_clinical_references;
--   drop policy if exists "Verified users can update patient references" on patient_clinical_references;
--   create policy "Users can manage their own patient references" on patient_clinical_references for all
--     using (patient_id in (select id from patients where user_id = auth.uid()))
--     with check (patient_id in (select id from patients where user_id = auth.uid()));
--   commit;

begin;

-- patients: read and delete own (unchanged); create and change need can_manage_patients().
drop policy if exists "Users can insert their own patients" on patients;
create policy "Users can insert their own patients" on patients for insert
  with check (auth.uid() = user_id and can_manage_patients());
drop policy if exists "Users can update their own patients" on patients;
create policy "Users can update their own patients" on patients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and can_manage_patients());

-- notes: own patient (PR #5) and can_manage_patients().
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

-- appointments (clinician side): the single FOR ALL policy is split.
drop policy if exists "Physios manage appointments for their own patients" on appointments;
drop policy if exists "Physios read appointments for their own patients" on appointments;
create policy "Physios read appointments for their own patients" on appointments for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Physios delete appointments for their own patients" on appointments;
create policy "Physios delete appointments for their own patients" on appointments for delete
  using (patient_id in (select id from patients where user_id = auth.uid()));
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
create policy "Physios delete invites for their own patients" on patient_invites for delete
  using (patient_id in (select id from patients where user_id = auth.uid()));
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
create policy "Physios delete calls for their own patients" on video_calls for delete
  using (patient_id in (select id from patients where user_id = auth.uid()));
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
create policy "Users can delete their own patient references" on patient_clinical_references for delete
  using (patient_id in (select id from patients where user_id = auth.uid()));
drop policy if exists "Verified users can add patient references" on patient_clinical_references;
create policy "Verified users can add patient references" on patient_clinical_references for insert
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());
drop policy if exists "Verified users can update patient references" on patient_clinical_references;
create policy "Verified users can update patient references" on patient_clinical_references for update
  using (patient_id in (select id from patients where user_id = auth.uid()))
  with check (patient_id in (select id from patients where user_id = auth.uid()) and can_manage_patients());

commit;
