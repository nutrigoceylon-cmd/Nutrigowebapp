-- Migration 012: Phase one meals-only adjustments

alter table meals
  alter column meal_plan_id drop not null;

alter table meals
  add column if not exists category text,
  add column if not exists price numeric(10,2),
  add column if not exists discount_price numeric(10,2),
  add column if not exists calories_min integer,
  add column if not exists calories_max integer;

update meals
set
  calories_min = coalesce(calories_min, calories),
  calories_max = coalesce(calories_max, calories)
where calories_min is null or calories_max is null;
