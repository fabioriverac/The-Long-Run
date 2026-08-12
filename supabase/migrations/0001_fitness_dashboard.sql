-- Becoming Self — fitness dashboard schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`
-- if you're using the Supabase CLI locally).
--
-- Four tables, all populated by scripts/sync-garmin.mjs via a scheduled
-- Claude Code Routine. All are RLS-locked to public SELECT only — writes
-- require the service_role key, which is only ever used server-side by
-- the ingestion script, never shipped to the browser.

-- ---------------------------------------------------------------------
-- runs — training log, one row per Garmin activity
-- ---------------------------------------------------------------------
create table if not exists public.runs (
  id                  bigint generated always as identity primary key,
  garmin_activity_id  bigint unique,
  title               text not null,
  date                date not null,
  distance_km         numeric(6, 2) not null,
  duration_seconds    integer not null,
  avg_hr              integer,
  max_hr              integer,
  type                text not null default 'Easy',
  note                text,
  source              text not null default 'garmin',
  synced_at           timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

comment on table public.runs is
  'Training log entries. source = garmin rows are upserted by scripts/sync-garmin.mjs, keyed on garmin_activity_id; source = manual rows can be added by hand for notes Garmin does not provide.';

create index if not exists runs_date_idx on public.runs (date desc);

-- ---------------------------------------------------------------------
-- training_status_snapshots — VO2max, training status, race predictions
-- ---------------------------------------------------------------------
create table if not exists public.training_status_snapshots (
  date                                date primary key,
  vo2max                              numeric(4, 1),
  training_status                     text,
  training_readiness_score            integer,
  race_predictor_5k_seconds           integer,
  race_predictor_10k_seconds          integer,
  race_predictor_half_marathon_seconds integer,
  race_predictor_marathon_seconds     integer,
  synced_at                           timestamptz not null default now()
);

comment on table public.training_status_snapshots is
  'One row per day Garmin captured a training status snapshot. Sparse by nature (e.g. vo2max is not measured daily) — upsert on date conflict, only overwriting fields Garmin actually returned that day.';

-- ---------------------------------------------------------------------
-- daily_health — steps, resting HR, stress, intensity minutes
-- ---------------------------------------------------------------------
create table if not exists public.daily_health (
  date                        date primary key,
  steps                       integer,
  resting_hr                  integer,
  avg_stress                  integer,
  max_stress                  integer,
  respiration_avg             numeric(4, 1),
  spo2_avg                    numeric(4, 1),
  intensity_minutes_moderate  integer,
  intensity_minutes_vigorous  integer,
  synced_at                   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- sleep_nights — sleep stages, body battery change
-- ---------------------------------------------------------------------
create table if not exists public.sleep_nights (
  date                  date primary key,
  sleep_start            timestamptz,
  sleep_end              timestamptz,
  total_sleep_seconds    integer,
  deep_sleep_seconds     integer,
  light_sleep_seconds    integer,
  rem_sleep_seconds      integer,
  awake_seconds          integer,
  sleep_score            integer,
  avg_hrv                numeric(5, 1),
  body_battery_change    integer,
  synced_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security — public read-only on all four tables
-- ---------------------------------------------------------------------
alter table public.runs enable row level security;
alter table public.training_status_snapshots enable row level security;
alter table public.daily_health enable row level security;
alter table public.sleep_nights enable row level security;

create policy "Public read access" on public.runs
  for select to anon using (true);

create policy "Public read access" on public.training_status_snapshots
  for select to anon using (true);

create policy "Public read access" on public.daily_health
  for select to anon using (true);

create policy "Public read access" on public.sleep_nights
  for select to anon using (true);

-- No insert/update/delete policy is created for `anon` on any table, on
-- purpose — writes are only possible with the service_role key, which
-- bypasses RLS by design.
