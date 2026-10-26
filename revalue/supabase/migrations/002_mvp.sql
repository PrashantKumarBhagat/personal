create policy p_ins on profiles for insert with check (id = auth.uid() and role = 'seller');
create policy img_ins on item_images for insert with check (exists (select 1 from items i where i.id = item_id and i.seller_id = auth.uid()));
create policy val_ins on item_valuations for insert with check (exists (select 1 from items i where i.id = item_id and i.seller_id = auth.uid()));

insert into storage.buckets (id, name, public) values ('item-images','item-images', true) on conflict do nothing;
create policy img_up on storage.objects for insert to authenticated with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Publishing requires a verified (email-confirmed) seller who has confirmed ownership.
create function publish_item(p_item uuid, p_price int) returns void language plpgsql security definer as $$
declare it items;
begin
  select * into it from items where id = p_item for update;
  if it.seller_id <> auth.uid() then raise exception 'Not your item'; end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then raise exception 'Confirm your email before publishing'; end if;
  if not it.ownership_confirmed then raise exception 'Confirm you own this item'; end if;
  if it.status not in ('draft') then raise exception 'Item is already published'; end if;
  update items set status='active', asking_price_cents=p_price where id=p_item;
  insert into marketplace_publications(item_id,channel,mode,status) values (p_item,'revalue_marketplace','internal','published');
  insert into audit_logs(actor,action,detail) values (auth.uid(),'item_published',jsonb_build_object('item',p_item));
end $$;

create function register_dealer(p_business text, p_abn text, p_cats text[], p_postcode text, p_radius int) returns void
language plpgsql security definer as $$
begin
  update profiles set role='dealer' where id = auth.uid() and role in ('seller','buyer');
  insert into dealer_profiles(id,business_name,abn,categories,postcode,radius_km) values (auth.uid(),p_business,p_abn,p_cats,p_postcode,p_radius);
end $$;
