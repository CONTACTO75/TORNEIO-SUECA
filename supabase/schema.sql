-- Torneio de Sueca: esquema da base de dados (Supabase / PostgreSQL)
-- Correr uma vez no Supabase: SQL Editor > New query > colar tudo > Run.

create extension if not exists pgcrypto;

create table if not exists tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  settings    jsonb not null default '{}'::jsonb,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists teams (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  code           text not null,
  name           text,
  player1        text,
  player2        text,
  substitute     text,
  contact1       text,
  contact2       text,
  paid           boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (tournament_id, code)
);

create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  round          int  not null,
  table_no       int,
  home_id        uuid references teams(id) on delete cascade,
  away_id        uuid references teams(id) on delete cascade,  -- null = folga
  home_points    int check (home_points >= 0),
  away_points    int check (away_points >= 0),
  updated_at     timestamptz,
  updated_by     text,
  check ((home_points is null) = (away_points is null))
);

create table if not exists adjustments (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  team_id        uuid not null references teams(id) on delete cascade,
  round          int,
  points         int not null,
  reason         text,
  created_at     timestamptz not null default now()
);

create index if not exists teams_t_idx on teams(tournament_id);
create index if not exists matches_t_idx on matches(tournament_id, round);
create index if not exists adjustments_t_idx on adjustments(tournament_id);

-- Segurança: toda a gente pode LER (classificações públicas);
-- só utilizadores com sessão iniciada (a organização) podem ESCREVER.
alter table tournaments enable row level security;
alter table teams       enable row level security;
alter table matches     enable row level security;
alter table adjustments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['tournaments','teams','matches','adjustments'] loop
    execute format('drop policy if exists "leitura publica" on %I', t);
    execute format('drop policy if exists "escrita organizacao" on %I', t);
    execute format('create policy "leitura publica" on %I for select using (true)', t);
    execute format('create policy "escrita organizacao" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Tempo real (a TV e os telemóveis atualizam sozinhos)
alter publication supabase_realtime add table tournaments, teams, matches, adjustments;
