-- =============================================================================
-- HouseUp · Banco de Terrenos
-- Schema completo do Supabase: enums, tabelas, índices, triggers, RLS e storage.
--
-- Como aplicar:
--   1. Abra o projeto no Supabase Dashboard → SQL Editor → New query
--   2. Cole este arquivo inteiro e clique em "Run"
--   (ou via CLI: `supabase db push` / `psql ... -f supabase/schema.sql`)
--
-- O script é idempotente o suficiente para reaplicação em ambiente novo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensões
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'manager', 'broker');
  end if;

  if not exists (select 1 from pg_type where typname = 'terreno_status') then
    create type public.terreno_status as enum ('pendente', 'disponivel', 'em_negociacao', 'vendido');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Tabela: profiles
-- Espelha auth.users com dados de aplicação (nome, role, status).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        public.user_role not null default 'broker',
  email       text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de aplicação de cada usuário autenticado (role, status, nome).';

-- -----------------------------------------------------------------------------
-- Tabela: terrenos
-- -----------------------------------------------------------------------------
create table if not exists public.terrenos (
  id           uuid primary key default gen_random_uuid(),
  endereco     text not null,
  bairro       text not null,
  area_m2      numeric(12, 2) not null check (area_m2 > 0),
  valor        numeric(14, 2) not null check (valor >= 0),
  status       public.terreno_status not null default 'pendente',
  link_maps    text,
  observacoes  text,
  created_by   uuid references public.profiles (id) on delete set null,
  approved_by  uuid references public.profiles (id) on delete set null,
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.terrenos is 'Terrenos cadastrados no banco de terrenos da HouseUp.';

create index if not exists terrenos_status_idx on public.terrenos (status);
create index if not exists terrenos_bairro_idx on public.terrenos (bairro);
create index if not exists terrenos_created_by_idx on public.terrenos (created_by);

-- -----------------------------------------------------------------------------
-- Tabela: terreno_fotos
-- -----------------------------------------------------------------------------
create table if not exists public.terreno_fotos (
  id            uuid primary key default gen_random_uuid(),
  terreno_id    uuid not null references public.terrenos (id) on delete cascade,
  storage_path  text not null,
  ordem         int not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.terreno_fotos is 'Fotos associadas a um terreno (armazenadas no Supabase Storage).';

create index if not exists terreno_fotos_terreno_id_idx on public.terreno_fotos (terreno_id);

-- =============================================================================
-- Funções auxiliares
-- =============================================================================

-- Retorna a role do usuário autenticado, ou null se inativo/inexistente.
-- SECURITY DEFINER evita recursão de RLS ao consultar profiles dentro de outras
-- policies, e é STABLE para permitir uso eficiente dentro das policies.
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and active = true;
$$;

-- Touch genérico de updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists terrenos_set_updated_at on public.terrenos;
create trigger terrenos_set_updated_at
  before update on public.terrenos
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: cria automaticamente o profile quando um usuário é convidado/criado
-- no Supabase Auth. O role e o nome completo vêm dos metadados passados em
-- `inviteUserByEmail(email, { data: { full_name, role } })`; default = broker.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'broker'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Trigger: força regras de cadastro de terrenos por corretor (broker).
--   - created_by sempre = auth.uid() (não pode ser forjado)
--   - status sempre 'pendente' na criação por broker
--   - approved_by/approved_at sempre nulos na criação
-- -----------------------------------------------------------------------------
create or replace function public.enforce_terreno_insert_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.user_role;
begin
  my_role := public.current_user_role();

  new.created_by := auth.uid();

  if my_role = 'broker' then
    new.status := 'pendente';
    new.approved_by := null;
    new.approved_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists terrenos_enforce_insert_rules on public.terrenos;
create trigger terrenos_enforce_insert_rules
  before insert on public.terrenos
  for each row
  execute function public.enforce_terreno_insert_rules();

-- -----------------------------------------------------------------------------
-- Trigger: preenche approved_by/approved_at automaticamente quando o status
-- sai de 'pendente' para qualquer outro (aprovação feita por admin/manager).
-- Também limpa os campos de aprovação se o terreno voltar para 'pendente'.
-- -----------------------------------------------------------------------------
create or replace function public.set_terreno_approval_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pendente' and new.status <> 'pendente' then
    new.approved_by := coalesce(new.approved_by, auth.uid());
    new.approved_at := coalesce(new.approved_at, now());
  elsif new.status = 'pendente' then
    new.approved_by := null;
    new.approved_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists terrenos_set_approval_fields on public.terrenos;
create trigger terrenos_set_approval_fields
  before update on public.terrenos
  for each row
  execute function public.set_terreno_approval_fields();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.terrenos enable row level security;
alter table public.terreno_fotos enable row level security;

-- ---------------------------------------------------------------- profiles --
-- Qualquer usuário autenticado lê o próprio perfil (necessário para a UI
-- saber nome/role). Apenas admins listam/gerenciam todos os perfis.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select
  using (public.current_user_role() = 'admin');

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update
  using (public.current_user_role() = 'admin');

-- Inserts em profiles só acontecem via trigger (security definer) disparado
-- pela criação do usuário no Auth; nenhuma policy de INSERT é necessária para
-- o client, então o INSERT direto pelo client permanece bloqueado por padrão.

-- ---------------------------------------------------------------- terrenos --
-- SELECT: admin/manager veem tudo. Broker vê terrenos aprovados (qualquer
-- status != pendente) OU os próprios terrenos pendentes.
drop policy if exists terrenos_select on public.terrenos;
create policy terrenos_select on public.terrenos
  for select
  using (
    public.current_user_role() in ('admin', 'manager')
    or status <> 'pendente'
    or created_by = auth.uid()
  );

-- INSERT: admin/manager inserem com qualquer status; broker insere e o
-- trigger `enforce_terreno_insert_rules` já garante status='pendente' e
-- created_by=auth.uid() antes desta checagem ser avaliada.
drop policy if exists terrenos_insert on public.terrenos;
create policy terrenos_insert on public.terrenos
  for insert
  with check (
    public.current_user_role() in ('admin', 'manager')
    or (public.current_user_role() = 'broker' and status = 'pendente' and created_by = auth.uid())
  );

-- UPDATE: somente admin/manager (broker nunca edita, aprova ou exclui).
drop policy if exists terrenos_update on public.terrenos;
create policy terrenos_update on public.terrenos
  for update
  using (public.current_user_role() in ('admin', 'manager'));

-- DELETE: somente admin/manager.
drop policy if exists terrenos_delete on public.terrenos;
create policy terrenos_delete on public.terrenos
  for delete
  using (public.current_user_role() in ('admin', 'manager'));

-- ------------------------------------------------------------ terreno_fotos --
-- SELECT: segue a visibilidade da tabela terrenos.
drop policy if exists terreno_fotos_select on public.terreno_fotos;
create policy terreno_fotos_select on public.terreno_fotos
  for select
  using (
    exists (
      select 1 from public.terrenos t
      where t.id = terreno_fotos.terreno_id
        and (
          public.current_user_role() in ('admin', 'manager')
          or t.status <> 'pendente'
          or t.created_by = auth.uid()
        )
    )
  );

-- INSERT: admin/manager sempre; broker apenas enquanto o terreno é dele e
-- ainda está pendente (fluxo de cadastro/upload de fotos antes da aprovação).
drop policy if exists terreno_fotos_insert on public.terreno_fotos;
create policy terreno_fotos_insert on public.terreno_fotos
  for insert
  with check (
    exists (
      select 1 from public.terrenos t
      where t.id = terreno_fotos.terreno_id
        and (
          public.current_user_role() in ('admin', 'manager')
          or (t.created_by = auth.uid() and t.status = 'pendente')
        )
    )
  );

-- UPDATE (reordenamento): mesma regra do INSERT.
drop policy if exists terreno_fotos_update on public.terreno_fotos;
create policy terreno_fotos_update on public.terreno_fotos
  for update
  using (
    exists (
      select 1 from public.terrenos t
      where t.id = terreno_fotos.terreno_id
        and (
          public.current_user_role() in ('admin', 'manager')
          or (t.created_by = auth.uid() and t.status = 'pendente')
        )
    )
  );

-- DELETE: mesma regra do INSERT.
drop policy if exists terreno_fotos_delete on public.terreno_fotos;
create policy terreno_fotos_delete on public.terreno_fotos
  for delete
  using (
    exists (
      select 1 from public.terrenos t
      where t.id = terreno_fotos.terreno_id
        and (
          public.current_user_role() in ('admin', 'manager')
          or (t.created_by = auth.uid() and t.status = 'pendente')
        )
    )
  );

-- =============================================================================
-- Storage: bucket de fotos dos terrenos
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'terreno-fotos',
  'terreno-fotos',
  true, -- leitura pública (URLs de imagem usadas direto em <img>/next/image)
  5242880, -- 5MB por arquivo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de path: `${terreno_id}/${uuid}.ext`. A primeira pasta do path
-- identifica o terreno, usada para checar propriedade/status nas policies.
drop policy if exists terreno_fotos_storage_select on storage.objects;
create policy terreno_fotos_storage_select on storage.objects
  for select
  using (
    bucket_id = 'terreno-fotos'
    and (
      public.current_user_role() in ('admin', 'manager')
      or exists (
        select 1 from public.terrenos t
        where t.id::text = (storage.foldername(name))[1]
          and (t.status <> 'pendente' or t.created_by = auth.uid())
      )
    )
  );

drop policy if exists terreno_fotos_storage_insert on storage.objects;
create policy terreno_fotos_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'terreno-fotos'
    and (
      public.current_user_role() in ('admin', 'manager')
      or exists (
        select 1 from public.terrenos t
        where t.id::text = (storage.foldername(name))[1]
          and t.created_by = auth.uid()
          and t.status = 'pendente'
      )
    )
  );

drop policy if exists terreno_fotos_storage_delete on storage.objects;
create policy terreno_fotos_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'terreno-fotos'
    and (
      public.current_user_role() in ('admin', 'manager')
      or exists (
        select 1 from public.terrenos t
        where t.id::text = (storage.foldername(name))[1]
          and t.created_by = auth.uid()
          and t.status = 'pendente'
      )
    )
  );

-- =============================================================================
-- Fim do schema.
-- Próximo passo: convide o primeiro usuário admin (ver README.md → "Como
-- convidar o primeiro usuário admin").
-- =============================================================================
