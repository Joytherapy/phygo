-- PROPOSED — NOT APPLIED. Needs the owner's approval. My Phygo profile photo.
--
-- Additive only: one new PRIVATE Storage bucket and one policy on it. No table,
-- column, row or existing policy is changed. Until this runs, the My Phygo
-- profile page still saves the name and the goal; only the photo shows
-- "not active yet" (the app treats "Bucket not found" as that state).
--
-- Why a separate private bucket: the existing 'avatars' bucket is public and
-- is used for clinicians' photos. A patient of a health app must not have a
-- photo reachable by anyone with the URL, so patient photos live in
-- 'patient-avatars' (public = false) and the app shows them through a signed
-- URL valid for one hour (lib/myPhygo/avatar.ts).
--
-- Layout: one file per patient at "<auth user id>/avatar.jpg". The app crops
-- and re-encodes every photo in the browser to a 512x512 JPEG (which also drops
-- EXIF/location metadata), so the 2 MB server-side cap is ample; the 10 MB
-- limit shown to the patient applies to the original picture before resizing.
-- profiles.avatar_url of the patient holds that path, not a URL; it is already
-- a column users may update on their own row ("Users can update own profile").
--
-- Access: only the owner of the folder (the signed-in patient) can read,
-- upload, replace or delete their photo. Nobody else — no other patient and,
-- for now, not the clinician either — can read it. Letting the clinician see
-- the photo of their linked patient would be a separate, explicit policy.
--
-- Rollback:
--   begin;
--   drop policy if exists "patient avatar: owner manages" on storage.objects;
--   delete from storage.objects where bucket_id = 'patient-avatars';
--   delete from storage.buckets where id = 'patient-avatars';
--   update profiles set avatar_url = null where avatar_url like '%/avatar.jpg' and avatar_url not like 'http%';
--   commit;

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-avatars', 'patient-avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "patient avatar: owner manages" on storage.objects;
create policy "patient avatar: owner manages"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

commit;

-- Check after running (expected: one row, public = false; one policy):
--   select id, public, file_size_limit from storage.buckets where id = 'patient-avatars';
--   select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'patient avatar: owner manages';
