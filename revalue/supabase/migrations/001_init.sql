create type user_role as enum ('seller','dealer','buyer','admin');
create type item_status as enum ('draft','active','reserved','sold','removed');
create type offer_status as enum ('pending','accepted','rejected','countered','withdrawn','expired');
create type txn_status as enum ('offer_accepted','pickup_scheduled','pickup_confirmed','payment_confirmed','completed','cancelled','disputed');
create type pub_status as enum ('draft','ready','published','awaiting_manual','failed','reserved','sold','removed');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'seller',
  full_name text not null, mobile text, postcode text, pickup_suburb text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table dealer_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text not null, abn text not null check (abn ~ '^\d{11}$'),
  approved boolean not null default false,
  categories text[] not null default '{}', postcode text, radius_km int not null default 25 check (radius_km > 0),
  max_budget_cents int
);
create table items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id),
  title text not null, description text, category text not null, brand text, model text,
  age_years numeric, original_price_cents int, condition text not null check (condition in ('new','like_new','good','fair','poor')),
  defects text, suburb text, postcode text not null,
  ownership_confirmed boolean not null default false,
  asking_price_cents int check (asking_price_cents >= 0),
  status item_status not null default 'draft',
  created_at timestamptz not null default now()
);
create index on items(status, category); create index on items(postcode);
create table item_images (id uuid primary key default gen_random_uuid(), item_id uuid not null references items on delete cascade, storage_path text not null, position int not null default 0);
create table item_valuations (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references items on delete cascade,
  private_low_cents int, private_high_cents int, dealer_low_cents int, dealer_high_cents int,
  recommended_cents int, quick_sale_cents int, confidence numeric check (confidence between 0 and 1),
  method text not null default 'rules_demo', explanation text, admin_override boolean not null default false,
  created_at timestamptz not null default now()
);
create table offers (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references items,
  bidder_id uuid not null references profiles(id),
  amount_cents int not null check (amount_cents > 0), pickup_fee_cents int not null default 0 check (pickup_fee_cents >= 0),
  net_cents int generated always as (amount_cents - pickup_fee_cents) stored,
  expires_at timestamptz not null, conditions text,
  status offer_status not null default 'pending', created_at timestamptz not null default now()
);
create index on offers(item_id, status);
create table transactions (
  id uuid primary key default gen_random_uuid(), item_id uuid not null unique references items,
  offer_id uuid not null references offers, seller_id uuid not null references profiles, buyer_id uuid not null references profiles,
  status txn_status not null default 'offer_accepted',
  pickup_at timestamptz, pickup_window text, payment_confirmed_offline boolean not null default false,
  commission_bps int not null default 500, created_at timestamptz not null default now()
);
create table marketplace_publications (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references items on delete cascade,
  channel text not null, mode text not null check (mode in ('api','assisted','internal')),
  status pub_status not null default 'draft', external_id text, updated_at timestamptz not null default now(),
  unique (item_id, channel)
);
create table audit_logs (id bigserial primary key, actor uuid, action text not null, detail jsonb, at timestamptz not null default now());

create function app_role() returns user_role language sql stable security definer as $$ select role from profiles where id = auth.uid() $$;

alter table profiles enable row level security; alter table dealer_profiles enable row level security;
alter table items enable row level security; alter table offers enable row level security;
alter table transactions enable row level security; alter table item_valuations enable row level security;
alter table item_images enable row level security; alter table marketplace_publications enable row level security;

create policy p_self on profiles for select using (id = auth.uid() or app_role() = 'admin');
create policy p_upd on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy d_read on dealer_profiles for select using (id = auth.uid() or app_role() = 'admin');
create policy d_write on dealer_profiles for insert with check (id = auth.uid() and approved = false);
create policy d_admin on dealer_profiles for update using (app_role() = 'admin');
create policy i_public on items for select using (status = 'active' or seller_id = auth.uid() or app_role() = 'admin');
create policy i_own on items for insert with check (seller_id = auth.uid());
create policy i_upd on items for update using (seller_id = auth.uid() or app_role() = 'admin');
create policy img_read on item_images for select using (exists (select 1 from items i where i.id = item_id));
create policy val_read on item_valuations for select using (exists (select 1 from items i where i.id = item_id and (i.seller_id = auth.uid() or app_role() in ('admin','dealer'))));
create policy pub_own on marketplace_publications for all using (exists (select 1 from items i where i.id = item_id and i.seller_id = auth.uid()));
create policy o_read on offers for select using (bidder_id = auth.uid() or app_role() = 'admin' or exists (select 1 from items i where i.id = item_id and i.seller_id = auth.uid()));
create policy t_read on transactions for select using (seller_id = auth.uid() or buyer_id = auth.uid() or app_role() = 'admin');

-- Offers are created only through place_offer (no direct insert policy), so business rules always apply.
create function place_offer(p_item uuid, p_amount int, p_fee int, p_expires timestamptz, p_cond text)
returns uuid language plpgsql security definer as $$
declare it items; me profiles; d dealer_profiles; oid uuid;
begin
  select * into me from profiles where id = auth.uid();
  select * into it from items where id = p_item for update;
  if it.status <> 'active' then raise exception 'Item is not open for offers'; end if;
  if it.seller_id = me.id then raise exception 'Sellers cannot bid on their own item'; end if;
  if me.role = 'dealer' then
    select * into d from dealer_profiles where id = me.id;
    if not coalesce(d.approved,false) then raise exception 'Dealer is not approved'; end if;
  end if;
  if p_expires <= now() then raise exception 'Offer expiry must be in the future'; end if;
  insert into offers(item_id,bidder_id,amount_cents,pickup_fee_cents,expires_at,conditions)
  values (p_item,me.id,p_amount,p_fee,p_expires,p_cond) returning id into oid;
  return oid;
end $$;

-- Row locks guarantee a single accepted offer per item.
create function accept_offer(p_offer uuid) returns uuid language plpgsql security definer as $$
declare o offers; it items; tid uuid;
begin
  select * into o from offers where id = p_offer for update;
  select * into it from items where id = o.item_id for update;
  if it.seller_id <> auth.uid() then raise exception 'Only the seller can accept offers'; end if;
  if it.status <> 'active' then raise exception 'Item is no longer available'; end if;
  if o.status <> 'pending' then raise exception 'Offer is not pending'; end if;
  if o.expires_at <= now() then update offers set status='expired' where id=o.id; raise exception 'Offer has expired'; end if;
  update offers set status='accepted' where id=o.id;
  update offers set status='rejected' where item_id=o.item_id and id<>o.id and status='pending';
  update items set status='reserved' where id=o.item_id;
  insert into transactions(item_id,offer_id,seller_id,buyer_id) values (o.item_id,o.id,it.seller_id,o.bidder_id) returning id into tid;
  insert into audit_logs(actor,action,detail) values (auth.uid(),'offer_accepted',jsonb_build_object('offer',o.id,'txn',tid));
  return tid;
end $$;

create function advance_transaction(p_txn uuid, p_next txn_status, p_pickup timestamptz default null) returns void
language plpgsql security definer as $$
declare t transactions;
begin
  select * into t from transactions where id = p_txn for update;
  if auth.uid() not in (t.seller_id, t.buyer_id) then raise exception 'Not a party to this transaction'; end if;
  if not ((t.status,p_next) in (('offer_accepted','pickup_scheduled'),('pickup_scheduled','pickup_confirmed'),
        ('pickup_confirmed','payment_confirmed'),('payment_confirmed','completed'))
        or p_next in ('cancelled','disputed')) then raise exception 'Invalid transition % -> %', t.status, p_next; end if;
  update transactions set status=p_next, pickup_at=coalesce(p_pickup,pickup_at),
         payment_confirmed_offline = (p_next in ('payment_confirmed','completed')) or payment_confirmed_offline where id=p_txn;
  if p_next = 'completed' then
    update items set status='sold' where id=t.item_id;
    update marketplace_publications set status='sold' where item_id=t.item_id and status='published';
  elsif p_next = 'cancelled' then
    update items set status='active' where id=t.item_id;
    update offers set status='withdrawn' where id=t.offer_id;
  end if;
end $$;
