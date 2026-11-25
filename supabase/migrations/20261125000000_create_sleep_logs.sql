create table public.sleep_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  bedtime text not null check (bedtime ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sleep_onset_time text not null check (sleep_onset_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  waso_minutes integer not null default 0 check (waso_minutes >= 0 and waso_minutes <= 720),
  wake_time text not null check (wake_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  out_of_bed_time text not null check (out_of_bed_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sleep_quality_score smallint not null check (sleep_quality_score between 1 and 5),
  daytime_impairment_score smallint not null check (daytime_impairment_score between 1 and 5),
  memo text not null default '',
  tib_minutes integer not null check (tib_minutes > 0 and tib_minutes <= 1440),
  tst_minutes integer not null check (tst_minutes >= 0 and tst_minutes <= 1440),
  sleep_efficiency numeric(5, 2) not null check (sleep_efficiency >= 0 and sleep_efficiency <= 100),
  total_awake_minutes integer not null check (total_awake_minutes >= 0 and total_awake_minutes <= 1440),
  sleep_latency_minutes integer not null check (sleep_latency_minutes >= 0 and sleep_latency_minutes <= 1440),
  morning_awake_minutes integer not null check (morning_awake_minutes >= 0 and morning_awake_minutes <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sleep_logs_user_date_unique unique (user_id, log_date)
);

create or replace function public.set_sleep_logs_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_sleep_logs_updated_at
  before update on public.sleep_logs
  for each row
  execute function public.set_sleep_logs_updated_at();

alter table public.sleep_logs enable row level security;

grant select, insert, update, delete on public.sleep_logs to authenticated;
grant usage, select on sequence public.sleep_logs_id_seq to authenticated;

create policy "sleep_logs_select_own"
  on public.sleep_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "sleep_logs_insert_own"
  on public.sleep_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sleep_logs_update_own"
  on public.sleep_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sleep_logs_delete_own"
  on public.sleep_logs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
