-- Snapshot of the LIVE row-level security policies on the clinical tables,
-- read from pg_policies on 12 Oct 2026 (project dckmumxswheamyymerea).
-- Until now these existed only in the live database. This file documents them
-- and is used by tests/sql/run.sh to build a faithful local replica.
-- It is not a migration: do not run it against production.
-- RLS is enabled (not forced) on: appointments, ask_phygo_usage (no policies),
-- demo_usage, metabolic_profiles, notes, patient_clinical_references,
-- patient_invites, patients, profiles, video_calls.

create policy "Physios manage appointments for their own patients" on appointments for all
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))
  with check (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())));
create policy "Patients can request appointments for themselves" on appointments for insert
  with check ((patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid()))) AND (requested_by = 'patient'::text) AND (status = 'requested'::text));
create policy "Patients can read their own appointments" on appointments for select
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid())));
create policy "anon can insert demo_usage" on demo_usage for insert to anon
  with check (true);
create policy "anon can read demo_usage" on demo_usage for select to anon
  using (true);
create policy "anon can update demo_usage" on demo_usage for update to anon
  using (true)
  with check (true);
create policy "No direct client access" on metabolic_profiles for all
  using (false);
create policy "Users can delete their own notes" on notes for delete
  using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes for insert
  with check (auth.uid() = user_id);
create policy "Patients can read their own notes" on notes for select
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid())));
create policy "Users can view their own notes" on notes for select
  using (auth.uid() = user_id);
create policy "Users can update their own notes" on notes for update
  using (auth.uid() = user_id);
create policy "Users can manage their own patient references" on patient_clinical_references for all
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))
  with check (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())));
create policy "Patients can read their own clinical references" on patient_clinical_references for select
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid())));
create policy "Physios manage invites for their own patients" on patient_invites for all
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))
  with check (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())));
create policy "Users can delete their own patients" on patients for delete
  using (auth.uid() = user_id);
create policy "Users can insert their own patients" on patients for insert
  with check (auth.uid() = user_id);
create policy "Patients can read their own record" on patients for select
  using (patient_user_id = auth.uid());
create policy "Users can view their own patients" on patients for select
  using (auth.uid() = user_id);
create policy "Users can update their own patients" on patients for update
  using (auth.uid() = user_id);
create policy "Users can view own profile" on profiles for select
  using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update
  using (auth.uid() = id);
create policy "Physios manage calls for their own patients" on video_calls for all
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))
  with check (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())));
create policy "Patients can read their own calls" on video_calls for select
  using (patient_id IN ( SELECT patients.id FROM patients WHERE (patients.patient_user_id = auth.uid())));
