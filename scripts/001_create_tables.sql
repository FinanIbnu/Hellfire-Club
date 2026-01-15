-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create skills table
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  description text,
  category text not null, -- 'teaching', 'repairs', 'cleaning', 'caregiving', 'other'
  created_at timestamp with time zone default now()
);

-- Create tasks table (skill offerings and requests)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  status text default 'open', -- 'open', 'accepted', 'completed', 'cancelled'
  credits_value integer default 1,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Create task completions (for credit transfers)
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  credits_transferred integer default 1,
  confirmation_status text default 'pending', -- 'pending', 'approved', 'disputed'
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Create credits table (ledger)
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  transaction_type text not null, -- 'earned', 'spent'
  related_task_id uuid references public.tasks(id),
  description text,
  created_at timestamp with time zone default now()
);

-- Create badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_name text not null,
  badge_type text not null, -- 'helper', 'popular', 'trusted', 'consistent'
  earned_at timestamp with time zone default now()
);

-- Create impact view data
create table if not exists public.impact_stats (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value integer default 0,
  updated_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.credits enable row level security;
alter table public.badges enable row level security;
alter table public.impact_stats enable row level security;

-- RLS Policies for profiles
create policy "Allow users to view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to view all profiles (public)"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for skills
create policy "Allow users to view all skills"
  on public.skills for select
  using (true);

create policy "Allow users to create skills"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update own skills"
  on public.skills for update
  using (auth.uid() = user_id);

create policy "Allow users to delete own skills"
  on public.skills for delete
  using (auth.uid() = user_id);

-- RLS Policies for tasks
create policy "Allow users to view all tasks"
  on public.tasks for select
  using (true);

create policy "Allow users to create tasks"
  on public.tasks for insert
  with check (auth.uid() = requester_id);

create policy "Allow users to update tasks they are involved in"
  on public.tasks for update
  using (auth.uid() = requester_id or auth.uid() = provider_id or auth.uid() = (select user_id from public.skills where id = skill_id));

create policy "Allow users to delete own tasks"
  on public.tasks for delete
  using (auth.uid() = requester_id);

-- RLS Policies for task completions
create policy "Allow users to view task completions"
  on public.task_completions for select
  using (auth.uid() = provider_id or auth.uid() = requester_id);

create policy "Allow providers to create task completions"
  on public.task_completions for insert
  with check (auth.uid() = provider_id);

create policy "Allow requester to update task completion status"
  on public.task_completions for update
  using (auth.uid() = requester_id);

-- RLS Policies for credits
create policy "Allow users to view their own credits"
  on public.credits for select
  using (auth.uid() = user_id);

create policy "Allow system to insert credits"
  on public.credits for insert
  with check (true);

-- RLS Policies for badges
create policy "Allow users to view all badges"
  on public.badges for select
  using (true);

create policy "Allow system to insert badges"
  on public.badges for insert
  with check (true);

-- RLS Policies for impact stats
create policy "Allow users to view impact stats"
  on public.impact_stats for select
  using (true);

-- Create helper functions
create or replace function public.get_user_credit_balance(user_id uuid)
returns integer as $$
  select coalesce(sum(amount), 0) from public.credits where user_id = $1;
$$ language sql stable;

create or replace function public.get_user_total_hours(user_id uuid)
returns integer as $$
  select coalesce(sum(credits_transferred), 0) from public.task_completions where provider_id = $1 and confirmation_status = 'approved';
$$ language sql stable;

-- Create trigger for auto-creating profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Community Member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
