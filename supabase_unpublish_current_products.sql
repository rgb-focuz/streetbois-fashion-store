-- Run this in Supabase SQL Editor when you are ready to remove the
-- current product catalogue from the public website.
--
-- It does NOT permanently delete products. It marks them inactive so old
-- products disappear from the shop, home feed, related products, and direct
-- product pages. New correct products uploaded from admin with status "Active"
-- will show normally.

update public.products
set
  status = 'Inactive',
  featured = false
where status is distinct from 'Inactive';
