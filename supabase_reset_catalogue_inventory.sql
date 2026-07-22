-- Fresh catalogue reset for StreetBois Fashion.
--
-- Use this when you want the admin dashboard and public website to start
-- with no old products or old inventory movements.
--
-- This script keeps a database backup copy before clearing anything.
-- It does not delete orders, customers, shop locations, store settings,
-- admin users, or delivery tracking.

begin;

create table if not exists public.products_reset_backup
as
select now() as backed_up_at, p.*
from public.products p
where false;

create table if not exists public.reviews_reset_backup
as
select now() as backed_up_at, r.*
from public.reviews r
where false;

create table if not exists public.inventory_history_reset_backup
as
select now() as backed_up_at, h.*
from public.inventory_history h
where false;

insert into public.products_reset_backup
select now() as backed_up_at, p.*
from public.products p;

insert into public.reviews_reset_backup
select now() as backed_up_at, r.*
from public.reviews r;

insert into public.inventory_history_reset_backup
select now() as backed_up_at, h.*
from public.inventory_history h;

delete from public.reviews;
delete from public.inventory_history;
delete from public.products;

commit;
