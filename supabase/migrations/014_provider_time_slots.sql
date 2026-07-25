-- Replace single available_from/available_to with multiple time_slots
alter table providers
  add column if not exists time_slots jsonb not null default '[]'::jsonb;

-- Migrate existing single-range data into time_slots array
update providers
set time_slots = jsonb_build_array(
  jsonb_build_object(
    'label', 'Session',
    'from',  available_from,
    'to',    available_to
  )
)
where jsonb_array_length(time_slots) = 0;

alter table providers
  drop column if exists available_from,
  drop column if exists available_to;
