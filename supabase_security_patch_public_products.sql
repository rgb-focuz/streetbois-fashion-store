-- Fix public product reads after security hardening.
-- Run this in Supabase SQL Editor.
--
-- The public products policy calls public.is_active_admin().
-- Anonymous visitors must be allowed to execute it so it can return false
-- instead of blocking the product query.

grant execute on function public.is_active_admin() to anon, authenticated;
