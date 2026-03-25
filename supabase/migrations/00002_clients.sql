-- Add email to profiles (for display in trainer view)
alter table profiles add column if not exists email text;

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, created_at)
  values (new.id, null, new.email, 'user', now())
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Allow trainers to view the profiles of their clients
create policy "Trainers can view client profiles"
  on profiles for select to authenticated
  using (id in (select client_id from trainer_clients where trainer_id = auth.uid()));
