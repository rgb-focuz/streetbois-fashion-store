-- Shared-stock checkout for product image variants.
-- Run this in Supabase SQL Editor.
--
-- Products with the same name + category + price are treated as one inventory
-- group. Example: four JOGGERS rows at GH₵250 share one stock number.

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

  insert into orders (
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    items,
    total,
    status
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_delivery_address),
    order_items,
    order_total,
    'Pending'
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
  end loop;

  return jsonb_build_object(
    'success', true,
    'order_id', new_order_id,
    'items', order_items,
    'total', order_total
  );
end;
$$;

grant execute on function public.create_secure_order(text, text, text, text, jsonb)
to anon, authenticated;
