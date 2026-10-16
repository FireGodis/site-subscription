-- Fechou: schema inicial. Execute no SQL Editor do seu projeto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mp_preapproval_id text unique,
  plan_id text not null check (plan_id in ('essencial','pro','estudio')),
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  amount numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  estimated_hours numeric(8,2) check (estimated_hours is null or estimated_hours > 0),
  actual_hours numeric(8,2) check (actual_hours is null or actual_hours > 0),
  estimated_costs numeric(10,2) not null default 0 check (estimated_costs >= 0),
  actual_costs numeric(10,2) not null default 0 check (actual_costs >= 0),
  status text not null default 'sent' check (status in ('sent','approved','paid','cancelled')),
  due_date date,
  scope text check (scope is null or char_length(scope) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists clients_user_created_idx on public.clients(user_id,created_at desc);
create index if not exists proposals_user_created_idx on public.proposals(user_id,created_at desc);
create index if not exists proposals_client_idx on public.proposals(client_id);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email) values(new.id,new.email)
  on conflict(id) do update set email=excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.create_profile_for_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.clients enable row level security;
alter table public.proposals enable row level security;

create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Clients cannot create, change, or inspect a paid workspace without an active recurring subscription.
create policy "Users can read their own subscription" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "Active subscribers read their clients" on public.clients for select to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
);
create policy "Active subscribers create their clients" on public.clients for insert to authenticated with check (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
);
create policy "Active subscribers update their clients" on public.clients for update to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
) with check (user_id = (select auth.uid()));
create policy "Active subscribers delete their clients" on public.clients for delete to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
);

create policy "Active subscribers read their proposals" on public.proposals for select to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
);
create policy "Active subscribers create their proposals" on public.proposals for insert to authenticated with check (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
  and exists(select 1 from public.clients c where c.id=client_id and c.user_id=(select auth.uid()))
);
create policy "Active subscribers update their proposals" on public.proposals for update to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
) with check (user_id = (select auth.uid()) and exists(select 1 from public.clients c where c.id=client_id and c.user_id=(select auth.uid())));
create policy "Active subscribers delete their proposals" on public.proposals for delete to authenticated using (
  user_id = (select auth.uid()) and exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status='authorized')
);

-- Enforce tier caps in Postgres too, so direct API calls cannot bypass the application checks.
create or replace function public.enforce_workspace_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_plan text; current_count bigint;
begin
  select s.plan_id into current_plan from public.subscriptions s
  where s.user_id=new.user_id and s.status='authorized';
  if current_plan is null then raise exception 'active subscription required' using errcode='42501'; end if;
  if tg_table_name='clients' then
    select count(*) into current_count from public.clients c where c.user_id=new.user_id;
    if current_count >= case current_plan when 'essencial' then 5 when 'pro' then 50 else 200 end then
      raise exception 'client limit reached for plan' using errcode='23514';
    end if;
  elsif current_plan='essencial' then
    select count(*) into current_count from public.proposals p where p.user_id=new.user_id
      and p.created_at >= date_trunc('month',now());
    if current_count >= 10 then raise exception 'monthly proposal limit reached for plan' using errcode='23514'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_client_plan_limit on public.clients;
create trigger enforce_client_plan_limit before insert on public.clients
for each row execute function public.enforce_workspace_limits();
drop trigger if exists enforce_proposal_plan_limit on public.proposals;
create trigger enforce_proposal_plan_limit before insert on public.proposals
for each row execute function public.enforce_workspace_limits();

-- The service-role key is used only in server routes. Never expose it as NEXT_PUBLIC_*.
