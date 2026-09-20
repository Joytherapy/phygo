-- Aggiunge alla tabella "notes" una colonna per il ragionamento clinico
-- strutturato (ipotesi, differenziali, elementi a favore/contro, info
-- mancanti, red flags) generato separatamente dal campo "assessment".
-- Additiva e sicura: colonna nullable, nessuna riga esistente viene toccata,
-- nessun default che forzi valori sulle note già salvate.

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS clinical_reasoning jsonb;

COMMENT ON COLUMN notes.clinical_reasoning IS
  'Ragionamento clinico strutturato generato da /api/generate-note: { hypotheses[], differentials[], supportingFindings, findingsAgainst, missingInformation, suggestedAssessments, redFlagsPrecautions }. Sempre linguaggio cauto/hedged, mai una diagnosi autonoma.';
