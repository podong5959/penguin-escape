-- Supabase schema for PENGTAL
-- Includes guest profile bootstrap, progress/daily data, RLS, and leaderboard RPCs.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  highest_stage integer not null default 1 check (highest_stage >= 1),
  gold integer not null default 0 check (gold >= 0),
  gem integer not null default 0 check (gem >= 0),
  hint integer not null default 0 check (hint >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_status (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_key date not null,
  daily_level integer not null check (daily_level between 1 and 3),
  clear_count integer not null default 1 check (clear_count >= 1),
  first_cleared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key, daily_level)
);

create index if not exists idx_progress_rank on public.progress (highest_stage desc, updated_at asc);
create index if not exists idx_daily_status_date on public.daily_status (date_key, user_id);

-- Nickname uniqueness (case-insensitive, trimmed). Blank values are excluded.
-- If duplicates already exist, keep the earliest row's nickname and reset later duplicates to Guest-XXXXXXXX.
with dup as (
  select
    id,
    row_number() over (
      partition by lower(btrim(display_name))
      order by created_at asc, id asc
    ) as rn
  from public.profiles
  where nullif(btrim(display_name), '') is not null
)
update public.profiles p
set display_name = 'Guest-' || substr(p.id::text, 1, 8)
from dup
where p.id = dup.id
  and dup.rn > 1;

create unique index if not exists idx_profiles_display_name_unique
on public.profiles ((lower(btrim(display_name))))
where nullif(btrim(display_name), '') is not null;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_progress_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

create trigger trg_daily_status_updated_at
before update on public.daily_status
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.daily_status enable row level security;

-- Profiles: any signed user can read profile names for UI, but only update own row.
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Progress: each user only reads/writes own progress.
drop policy if exists progress_select_own on public.progress;
create policy progress_select_own
on public.progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists progress_insert_own on public.progress;
create policy progress_insert_own
on public.progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists progress_update_own on public.progress;
create policy progress_update_own
on public.progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Daily status: each user only reads/writes own daily rows.
drop policy if exists daily_status_select_own on public.daily_status;
create policy daily_status_select_own
on public.daily_status
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists daily_status_insert_own on public.daily_status;
create policy daily_status_insert_own
on public.daily_status
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists daily_status_update_own on public.daily_status;
create policy daily_status_update_own
on public.daily_status
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Auto bootstrap profile/progress for anonymous auth users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'Guest-' || substr(new.id::text, 1, 8))
  on conflict (id) do nothing;

  insert into public.progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Stage leaderboard: top
create or replace function public.stage_leaderboard_top(p_limit integer default 50)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  highest_stage integer
)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      row_number() over (
        order by p.highest_stage desc, p.updated_at asc, p.user_id asc
      ) as r,
      p.user_id,
      coalesce(nullif(pr.display_name, ''), 'Guest-' || substr(p.user_id::text, 1, 8)) as display_name,
      p.highest_stage
    from public.progress p
    left join public.profiles pr on pr.id = p.user_id
  )
  select
    r as rank,
    user_id,
    display_name,
    highest_stage
  from ranked
  order by r
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Stage leaderboard: around me (±range)
create or replace function public.stage_leaderboard_around_me(
  p_user_id uuid,
  p_range integer default 10
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  highest_stage integer
)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      row_number() over (
        order by p.highest_stage desc, p.updated_at asc, p.user_id asc
      ) as r,
      p.user_id,
      coalesce(nullif(pr.display_name, ''), 'Guest-' || substr(p.user_id::text, 1, 8)) as display_name,
      p.highest_stage
    from public.progress p
    left join public.profiles pr on pr.id = p.user_id
  ),
  me as (
    select r from ranked where user_id = p_user_id
  )
  select
    ranked.r as rank,
    ranked.user_id,
    ranked.display_name,
    ranked.highest_stage
  from ranked
  cross join me
  where ranked.r between greatest(1, me.r - greatest(1, coalesce(p_range, 10)))
                     and me.r + greatest(1, coalesce(p_range, 10))
  order by ranked.r;
$$;

-- Daily leaderboard: top
create or replace function public.daily_leaderboard_top(
  p_date_key date,
  p_limit integer default 50
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  cleared_levels integer,
  first_cleared_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with daily as (
    select
      d.user_id,
      count(*)::int as cleared_levels,
      min(d.first_cleared_at) as first_cleared_at
    from public.daily_status d
    where d.date_key = p_date_key
    group by d.user_id
  ),
  ranked as (
    select
      row_number() over (
        order by daily.cleared_levels desc, daily.first_cleared_at asc, daily.user_id asc
      ) as r,
      daily.user_id,
      coalesce(nullif(pr.display_name, ''), 'Guest-' || substr(daily.user_id::text, 1, 8)) as display_name,
      daily.cleared_levels,
      daily.first_cleared_at
    from daily
    left join public.profiles pr on pr.id = daily.user_id
  )
  select
    r as rank,
    user_id,
    display_name,
    cleared_levels,
    first_cleared_at
  from ranked
  order by r
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Daily leaderboard: around me (±range)
create or replace function public.daily_leaderboard_around_me(
  p_date_key date,
  p_user_id uuid,
  p_range integer default 10
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  cleared_levels integer,
  first_cleared_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with daily as (
    select
      d.user_id,
      count(*)::int as cleared_levels,
      min(d.first_cleared_at) as first_cleared_at
    from public.daily_status d
    where d.date_key = p_date_key
    group by d.user_id
  ),
  ranked as (
    select
      row_number() over (
        order by daily.cleared_levels desc, daily.first_cleared_at asc, daily.user_id asc
      ) as r,
      daily.user_id,
      coalesce(nullif(pr.display_name, ''), 'Guest-' || substr(daily.user_id::text, 1, 8)) as display_name,
      daily.cleared_levels,
      daily.first_cleared_at
    from daily
    left join public.profiles pr on pr.id = daily.user_id
  ),
  me as (
    select r from ranked where user_id = p_user_id
  )
  select
    ranked.r as rank,
    ranked.user_id,
    ranked.display_name,
    ranked.cleared_levels,
    ranked.first_cleared_at
  from ranked
  cross join me
  where ranked.r between greatest(1, me.r - greatest(1, coalesce(p_range, 10)))
                     and me.r + greatest(1, coalesce(p_range, 10))
  order by ranked.r;
$$;

grant execute on function public.stage_leaderboard_top(integer) to authenticated;
grant execute on function public.stage_leaderboard_around_me(uuid, integer) to authenticated;
grant execute on function public.daily_leaderboard_top(date, integer) to authenticated;
grant execute on function public.daily_leaderboard_around_me(date, uuid, integer) to authenticated;
