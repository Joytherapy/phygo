-- Phygo Metabolic & Macro Calculator — tabella storica dei profili metabolici
-- (14/09/2026). Una riga per ogni calcolo salvato, sia lato professionista
-- (Clinical Toolkit, durante una valutazione) sia lato paziente (futuro
-- portale My PHYGO, sezione Life). Entrambi i contesti condividono la stessa
-- riga tramite patient_id — lo stesso identificatore che gia' unifica la
-- vista del professionista (patients.id) e quella del paziente
-- (patients.patient_user_id = auth.uid()), come nel resto dello schema.
--
-- patient_id e' nullable per coprire l'uso "libero" del calcolatore da parte
-- del professionista (calcolo esplorativo non ancora legato a un paziente,
-- es. test rapido durante l'onboarding di un nuovo assistito).

create table if not exists metabolic_profiles (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  created_by_user_id uuid not null,
  entered_by text not null check (entered_by in ('professional', 'patient')),
  shared_with_professional boolean not null default true,

  -- input
  sex text not null check (sex in ('male', 'female')),
  age integer not null,
  weight_kg numeric(6,2) not null,
  height_cm numeric(5,1) not null,
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'very', 'extreme')),
  body_fat_pct numeric(4,1),
  goal text not null check (goal in ('maintain', 'fat_loss', 'muscle_gain', 'performance')),
  macro_strategy text not null check (macro_strategy in ('balanced', 'high_protein', 'high_carb', 'low_carb', 'custom')),
  custom_macro_pct jsonb,

  -- output
  bmr numeric(7,1) not null,
  tdee numeric(7,1) not null,
  bmi numeric(4,1) not null,
  bmi_category text not null check (bmi_category in ('underweight', 'normal', 'overweight', 'obese')),
  lean_body_mass_kg numeric(6,2),
  fat_mass_kg numeric(6,2),
  calorie_target numeric(6,0) not null,
  calorie_target_maintain numeric(6,0) not null,
  calorie_target_fat_loss numeric(6,0) not null,
  calorie_target_muscle_gain numeric(6,0) not null,
  calorie_target_performance numeric(6,0) not null,
  protein_g numeric(5,0) not null,
  carbs_g numeric(5,0) not null,
  fat_g numeric(5,0) not null,
  calculation_method text not null,

  notes text,
  created_at timestamptz not null default now()
);

create index if not exists metabolic_profiles_patient_id_idx on metabolic_profiles (patient_id, created_at desc);
create index if not exists metabolic_profiles_created_by_idx on metabolic_profiles (created_by_user_id, created_at desc);

alter table metabolic_profiles enable row level security;

-- Scritture e letture passano tutte dagli endpoint server-side
-- (app/api/metabolic/*), che usano la service-role key e applicano
-- l'autorizzazione via codice (stesso schema di app/api/events/save) — coerente
-- con il resto dell'app, che oggi e' single-tenant (un solo professionista).
-- Nessuna policy per l'anon/authenticated key: niente accesso diretto da client.
drop policy if exists "No direct client access" on metabolic_profiles;
create policy "No direct client access" on metabolic_profiles
  for all using (false);
