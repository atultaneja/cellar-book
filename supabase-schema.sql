-- ============================================================
--  THE CELLAR BOOK — Supabase schema
--  Paste this whole file into Supabase -> SQL Editor -> Run.
--  Safe to run more than once.
-- ============================================================

-- ---------- BOTTLES ----------
create table if not exists public.bottles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,               -- e.g. "Glenfiddich 12"
  brand       text,                        -- optional distiller / maker
  category    text not null default 'Other',
  -- level: 5=Full 4=Three-quarters 3=Half 2=Quarter 1=Nearly empty 0=Empty
  level       smallint not null default 5 check (level between 0 and 5),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- PARTIES ----------
create table if not exists public.parties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(9), 'hex'),
  name        text not null default 'This Evening',
  event_date  date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- BOTTLES OPEN AT A PARTY ----------
create table if not exists public.party_bottles (
  party_id    uuid not null references public.parties (id) on delete cascade,
  bottle_id   uuid not null references public.bottles (id) on delete cascade,
  primary key (party_id, bottle_id)
);

-- ---------- COCKTAILS ON OFFER AT A PARTY (cocktail id is a code-side string) ----------
create table if not exists public.party_cocktails (
  party_id     uuid not null references public.parties (id) on delete cascade,
  cocktail_id  text not null,
  primary key (party_id, cocktail_id)
);

-- keep updated_at fresh on bottles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_bottles_touch on public.bottles;
create trigger trg_bottles_touch before update on public.bottles
  for each row execute function public.touch_updated_at();

-- ============================================================
--  ROW LEVEL SECURITY — each account sees only its own data
-- ============================================================
-- Auto-fill the owner on insert (previously omitted — bottle inserts failed).
alter table public.bottles alter column user_id set default auth.uid();
alter table public.parties alter column user_id set default auth.uid();

-- ┌────────────────────────────────────────────────────────────┐
-- │  SET YOUR ADMIN EMAIL HERE — the read/write (owner) login.   │
-- │  Any other confirmed login is a read-only viewer.            │
-- └────────────────────────────────────────────────────────────┘
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = lower('atultaneja316@gmail.com')
$$;

alter table public.bottles         enable row level security;
alter table public.parties         enable row level security;
alter table public.party_bottles   enable row level security;
alter table public.party_cocktails enable row level security;

-- Pattern for every bar table: any signed-in user may READ; only admin may WRITE.
-- bottles
drop policy if exists "own bottles" on public.bottles;
drop policy if exists "read bottles" on public.bottles;
drop policy if exists "admin writes bottles" on public.bottles;
create policy "read bottles" on public.bottles
  for select using (auth.uid() is not null);
create policy "admin writes bottles" on public.bottles
  for all using (public.is_admin()) with check (public.is_admin());

-- parties
drop policy if exists "own parties" on public.parties;
drop policy if exists "read parties" on public.parties;
drop policy if exists "admin writes parties" on public.parties;
create policy "read parties" on public.parties
  for select using (auth.uid() is not null);
create policy "admin writes parties" on public.parties
  for all using (public.is_admin()) with check (public.is_admin());

-- party_bottles
drop policy if exists "own party_bottles" on public.party_bottles;
drop policy if exists "read party_bottles" on public.party_bottles;
drop policy if exists "admin writes party_bottles" on public.party_bottles;
create policy "read party_bottles" on public.party_bottles
  for select using (auth.uid() is not null);
create policy "admin writes party_bottles" on public.party_bottles
  for all using (public.is_admin()) with check (public.is_admin());

-- party_cocktails
drop policy if exists "own party_cocktails" on public.party_cocktails;
drop policy if exists "read party_cocktails" on public.party_cocktails;
drop policy if exists "admin writes party_cocktails" on public.party_cocktails;
create policy "read party_cocktails" on public.party_cocktails
  for select using (auth.uid() is not null);
create policy "admin writes party_cocktails" on public.party_cocktails
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  PUBLIC PARTY VIEW
--  Guests open a share link with no login. This function returns
--  only the chosen party's open bottles + cocktails, nothing else.
-- ============================================================
create or replace function public.get_party_by_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select case when p.id is null then null else json_build_object(
    'name', p.name,
    'event_date', p.event_date,
    'active', p.active,
    'bottles', coalesce((
      select json_agg(json_build_object('name', b.name, 'brand', b.brand, 'category', b.category)
                      order by b.category, b.name)
      from public.party_bottles pb
      join public.bottles b on b.id = pb.bottle_id
      where pb.party_id = p.id
    ), '[]'::json),
    'cocktails', coalesce((
      select json_agg(pc.cocktail_id)
      from public.party_cocktails pc
      where pc.party_id = p.id
    ), '[]'::json)
  ) end
  from public.parties p
  where p.token = p_token and p.active = true;
$$;

-- allow anonymous guests to call ONLY this function
grant execute on function public.get_party_by_token(text) to anon, authenticated;

-- ============================================================
--  TASTE PROFILE — the app's memory of your palate
-- ============================================================
create table if not exists public.taste_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- One shared bar profile: any signed-in user may READ it (so the viewer's
-- recommendations are tuned to it); only the admin may edit it.
alter table public.taste_profiles alter column user_id set default auth.uid();
alter table public.taste_profiles enable row level security;
drop policy if exists "own taste profile" on public.taste_profiles;
drop policy if exists "read taste profile" on public.taste_profiles;
drop policy if exists "admin writes taste profile" on public.taste_profiles;
create policy "read taste profile" on public.taste_profiles
  for select using (auth.uid() is not null);
create policy "admin writes taste profile" on public.taste_profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  AI RECOMMENDATION LOG — remembers what was suggested & when
-- ============================================================
create table if not exists public.ai_recommendations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null default 'guided',   -- 'guided' | 'weekly'
  context     jsonb,                             -- mood answers / inputs used
  result      jsonb not null,                    -- the picks returned
  created_at  timestamptz not null default now()
);

alter table public.ai_recommendations enable row level security;
drop policy if exists "own recommendations" on public.ai_recommendations;
create policy "own recommendations" on public.ai_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
