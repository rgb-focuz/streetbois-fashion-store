-- Full admin fresh start for StreetBois Fashion.
--
-- Use this after the catalogue reset when you also want the dashboard
-- revenue, orders, recent orders, and order analytics to return to zero.
--
-- This script creates backup tables first, then clears operational records.
-- It keeps admin users, customer profiles, store settings, shop locations,
-- categories, and security settings.

begin;

create table if not exists public.orders_reset_backup
as
select now() as backed_up_at, o.*
from public.orders o
where false;

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

insert into public.orders_reset_backup
select now() as backed_up_at, o.*
from public.orders o;

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
delete from public.orders;
delete from public.products;

commit;
