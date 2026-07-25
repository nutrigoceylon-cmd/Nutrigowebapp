-- Public-safe function to get registration counts per event.
-- SECURITY DEFINER bypasses RLS so anyone can read aggregate counts
-- without exposing individual registrant PII.
create or replace function get_event_registration_counts()
returns table(event_id uuid, count bigint)
language sql
security definer
stable
as $$
  select event_id, count(*)::bigint
  from event_registrations
  where status in ('registered', 'attended')
  group by event_id;
$$;
