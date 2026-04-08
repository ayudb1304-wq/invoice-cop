-- Rename legacy column if you created the DB from an older 001 that used razorpay_subscription_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'razorpay_subscription_id'
  ) then
    alter table public.profiles
      rename column razorpay_subscription_id to dodo_subscription_id;
  end if;
end $$;

comment on column public.profiles.dodo_subscription_id is
  'External billing subscription id (legacy migration)';
