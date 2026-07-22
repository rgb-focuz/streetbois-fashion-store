-- Shared-stock checkout for product image variants.
-- Run this in Supabase SQL Editor.
--
-- Products with the same name + category + price are treated as one inventory
-- group. Example: four JOGGERS rows at GH₵250 share one stock number.

alter table public.orders
add column if not exists order_reference text;

create unique index if not exists orders_order_reference_unique
on public.orders (order_reference)
where order_reference is not null;

create table if not exists public.order_reference_counters (
  product_prefix text primary key,
  next_number integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.order_reference_counters enable row level security;

with numbered_orders as (
  select
    id,
    coalesce(
      nullif(
        trim(
          both '-' from left(
            regexp_replace(
              upper(coalesce(items->0->>'name', 'ORDER')),
              '[^A-Z0-9]+',
              '-',
              'g'
            ),
            16
          )
        ),
        ''
      ),
      'ORDER'
    ) as product_prefix,
    row_number() over (
      partition by coalesce(
        nullif(
          trim(
            both '-' from left(
              regexp_replace(
                upper(coalesce(items->0->>'name', 'ORDER')),
                '[^A-Z0-9]+',
                '-',
                'g'
              ),
              16
            )
          ),
          ''
        ),
        'ORDER'
      )
      order by created_at, id
    ) as reference_number
  from public.orders
  where order_reference is null
)
update public.orders as existing_order
set order_reference =
  numbered_orders.product_prefix ||
  '-' ||
  lpad(numbered_orders.reference_number::text, 5, '0')
from numbered_orders
where existing_order.id = numbered_orders.id;

insert into public.order_reference_counters (product_prefix, next_number)
select
  regexp_replace(order_reference, '-[0-9]+$', '') as product_prefix,
  coalesce(max((substring(order_reference from '-([0-9]+)$'))::integer), 0) + 1 as next_number
from public.orders
where order_reference is not null
group by regexp_replace(order_reference, '-[0-9]+$', '')
on conflict (product_prefix) do update
set
  next_number = greatest(
    public.order_reference_counters.next_number,
    excluded.next_number
  ),
  updated_at = now();

create or replace function public.create_secure_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_address text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_product_id uuid;
  item_quantity integer;
  product_row products%rowtype;
  group_row record;
  available_stock integer;
  next_stock integer;
  order_items jsonb;
  order_total numeric;
  new_order_id uuid;
  order_prefix text;
  next_reference_number integer;
  new_order_reference text;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Invalid customer name.';
  end if;

  if length(trim(coalesce(p_customer_phone, ''))) < 7 then
    raise exception 'Invalid phone number.';
  end if;

  if length(trim(coalesce(p_delivery_address, ''))) < 3 then
    raise exception 'Invalid delivery address.';
  end if;

  if p_customer_email is not null
    and p_customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Invalid email address.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The order contains no products.';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many products in one order.';
  end if;

  create temporary table if not exists checkout_order_lines (
    product_id uuid,
    name text,
    category text,
    price numeric,
    image_url text,
    quantity integer,
    subtotal numeric,
    group_name text,
    group_category text,
    group_price numeric
  ) on commit drop;

  truncate table checkout_order_lines;

  for item in select * from jsonb_array_elements(p_items)
  loop
    if item->>'id' is null or item->>'quantity' is null then
      raise exception 'Each item requires an id and quantity.';
    end if;

    begin
      item_product_id := (item->>'id')::uuid;
      item_quantity := (item->>'quantity')::integer;
    exception when others then
      raise exception 'Invalid order item.';
    end;

    if item_quantity < 1 or item_quantity > 100 then
      raise exception 'Product quantity must be between 1 and 100.';
    end if;

    select *
    into product_row
    from products
    where id = item_product_id
    for update;

    if not found then
      raise exception 'Invalid product identifier.';
    end if;

    if coalesce(product_row.status, 'Active') = 'Out of Stock'
      or coalesce(product_row.in_stock, true) = false
      or coalesce(product_row.stock, 0) <= 0 then
      raise exception 'A selected product is no longer available.';
    end if;

    if coalesce(product_row.price, 0) <= 0 then
      raise exception 'A selected product has an invalid price.';
    end if;

    insert into checkout_order_lines (
      product_id,
      name,
      category,
      price,
      image_url,
      quantity,
      subtotal,
      group_name,
      group_category,
      group_price
    )
    values (
      product_row.id,
      product_row.name,
      product_row.category,
      product_row.price,
      product_row.image_url,
      item_quantity,
      product_row.price * item_quantity,
      lower(trim(product_row.name)),
      lower(trim(product_row.category)),
      product_row.price
    );
  end loop;

  for group_row in
    select
      group_name,
      group_category,
      group_price,
      sum(quantity)::integer as requested_quantity
    from checkout_order_lines
    group by group_name, group_category, group_price
  loop
    perform 1
    from products
    where lower(trim(name)) = group_row.group_name
      and lower(trim(category)) = group_row.group_category
      and price = group_row.group_price
    for update;

    select coalesce(max(stock), 0)
    into available_stock
    from products
    where lower(trim(name)) = group_row.group_name
      and lower(trim(category)) = group_row.group_category
      and price = group_row.group_price;

    if available_stock < group_row.requested_quantity then
      raise exception '% are available for this product group.', available_stock;
    end if;
  end loop;

  select coalesce(sum(subtotal), 0)
  into order_total
  from checkout_order_lines;

  select jsonb_agg(
    jsonb_build_object(
      'id', product_id,
      'name', name,
      'category', category,
      'price', price,
      'quantity', quantity,
      'subtotal', subtotal,
      'image_url', image_url
    )
  )
  into order_items
  from checkout_order_lines;

  order_prefix :=
    coalesce(
      nullif(
        trim(
          both '-' from left(
            regexp_replace(
              upper(coalesce(order_items->0->>'name', 'ORDER')),
              '[^A-Z0-9]+',
              '-',
              'g'
            ),
            16
          )
        ),
        ''
      ),
      'ORDER'
    );

  insert into public.order_reference_counters (product_prefix, next_number)
  values (order_prefix, 2)
  on conflict (product_prefix) do update
  set
    next_number = public.order_reference_counters.next_number + 1,
    updated_at = now()
  returning next_number - 1 into next_reference_number;

  new_order_reference :=
    order_prefix || '-' || lpad(next_reference_number::text, 5, '0');

  insert into orders (
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    items,
    total,
    status,
    order_reference
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_delivery_address),
    order_items,
    order_total,
    'Pending',
    new_order_reference
  )
  returning id into new_order_id;

  for group_row in
    select
      group_name,
      group_category,
      group_price,
      sum(quantity)::integer as requested_quantity
    from checkout_order_lines
    group by group_name, group_category, group_price
  loop
    perform 1
    from products
    where lower(trim(name)) = group_row.group_name
      and lower(trim(category)) = group_row.group_category
      and price = group_row.group_price
    for update;

    select coalesce(max(stock), 0)
    into available_stock
    from products
    where lower(trim(name)) = group_row.group_name
      and lower(trim(category)) = group_row.group_category
      and price = group_row.group_price;

    next_stock := greatest(available_stock - group_row.requested_quantity, 0);

    update products
    set
      stock = next_stock,
      in_stock = next_stock > 0,
      status = case
        when next_stock > 0 then 'Active'
        else 'Out of Stock'
      end
    where lower(trim(name)) = group_row.group_name
      and lower(trim(category)) = group_row.group_category
      and price = group_row.group_price;

    insert into inventory_history (
      product_id,
      product_name,
      old_stock,
      new_stock,
      quantity_changed,
      action_type,
      reason,
      changed_by
    )
    select
      product_id,
      name,
      available_stock,
      next_stock,
      next_stock - available_stock,
      'Online Order Reserved',
      'Reserved stock for online order ' || new_order_id::text,
      'Online Checkout'
    from checkout_order_lines
    where group_name = group_row.group_name
      and group_category = group_row.group_category
      and group_price = group_row.group_price
    limit 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'order_id', new_order_id,
    'order_reference', new_order_reference,
    'items', order_items,
    'total', order_total
  );
end;
$$;

grant execute on function public.create_secure_order(text, text, text, text, jsonb)
to anon, authenticated;

create or replace function public.record_physical_sale(
  p_product_id uuid,
  p_quantity integer,
  p_reason text default 'Physical shop sale'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  product_row products%rowtype;
  group_row record;
  available_stock integer;
  next_stock integer;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can record physical shop sales.';
  end if;

  if p_product_id is null then
    raise exception 'Product is required.';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 1000 then
    raise exception 'Sale quantity must be between 1 and 1000.';
  end if;

  select *
  into product_row
  from products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  perform 1
  from products
  where lower(trim(name)) = lower(trim(product_row.name))
    and lower(trim(category)) = lower(trim(product_row.category))
    and price = product_row.price
  for update;

  select coalesce(max(stock), 0)
  into available_stock
  from products
  where lower(trim(name)) = lower(trim(product_row.name))
    and lower(trim(category)) = lower(trim(product_row.category))
    and price = product_row.price;

  if available_stock < p_quantity then
    raise exception 'Only % item(s) are available for this product group.', available_stock;
  end if;

  next_stock := greatest(available_stock - p_quantity, 0);

  update products
  set
    stock = next_stock,
    in_stock = next_stock > 0,
    status = case
      when next_stock > 0 then 'Active'
      else 'Out of Stock'
    end
  where lower(trim(name)) = lower(trim(product_row.name))
    and lower(trim(category)) = lower(trim(product_row.category))
    and price = product_row.price;

  insert into inventory_history (
    product_id,
    product_name,
    old_stock,
    new_stock,
    quantity_changed,
    action_type,
    reason,
    changed_by
  )
  values (
    product_row.id,
    product_row.name,
    available_stock,
    next_stock,
    next_stock - available_stock,
    'Physical Shop Sale',
    coalesce(nullif(trim(p_reason), ''), 'Physical shop sale'),
    coalesce(auth.email(), 'Administrator')
  );

  return jsonb_build_object(
    'success', true,
    'product_id', product_row.id,
    'product_name', product_row.name,
    'old_stock', available_stock,
    'new_stock', next_stock,
    'quantity_changed', next_stock - available_stock
  );
end;
$$;

grant execute on function public.record_physical_sale(uuid, integer, text)
to authenticated;
