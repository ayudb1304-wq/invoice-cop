-- Rename billing column for Dodo Payments (replaces Lemon Squeezy)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'lemon_squeezy_subscription_id'
  ) then
    alter table public.profiles
      rename column lemon_squeezy_subscription_id to dodo_subscription_id;
  end if;
end $$;

comment on column public.profiles.dodo_subscription_id is
  'Dodo Payments subscription_id from webhooks';
