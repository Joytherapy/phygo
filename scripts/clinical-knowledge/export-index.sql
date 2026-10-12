-- Read-only export of the live library for duplicate checks before an import.
-- Run in the Supabase SQL editor (or psql) and save the single JSON value as
-- existing-index.json. It contains names and synonyms only; no other content.
select coalesce(json_agg(json_build_object(
  'id', id,
  'condition_name', condition_name,
  'condition_keywords', condition_keywords
) order by id), '[]'::json)
from knowledge_base;
