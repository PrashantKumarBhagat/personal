// Demo data. Uses the service-role key: run locally only, never in the browser.
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const PASSWORD = 'Demo1234!';
const users = [['seller', 'Sam Seller'], ['dealer', 'Dana Dealer'], ['buyer', 'Ben Buyer'], ['admin', 'Ada Admin']] as const;
async function main() {
  const ids: Record<string, string> = {};
  for (const [role, name] of users) {
    const email = `${role}@revalue.test`;
    const { data, error } = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    const id = data.user?.id ?? (await sb.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;
    if (!id) throw error ?? new Error(`No user for ${email}`);
    ids[role] = id;
    await sb.from('profiles').upsert({ id, role, full_name: name, postcode: '2150', verified: true });
  }
  await sb.from('dealer_profiles').upsert({ id: ids.dealer, business_name: 'Parramatta Second-Hand Co', abn: '12345678901', approved: true, categories: ['furniture', 'appliances'], postcode: '2150', radius_km: 30 });
  await sb.from('items').insert([
    { seller_id: ids.seller, title: 'Oak dining table, seats 6', description: 'Solid oak, minor surface marks.', category: 'furniture', condition: 'good', postcode: '2150', suburb: 'Parramatta', asking_price_cents: 18000, ownership_confirmed: true, status: 'active' },
    { seller_id: ids.seller, title: 'Front-load washing machine 8kg', description: 'Works well, 4 years old.', category: 'appliances', condition: 'good', postcode: '2150', suburb: 'Parramatta', asking_price_cents: 25000, ownership_confirmed: true, status: 'active' },
  ]);
  console.log(`Seeded. Log in as seller|dealer|buyer|admin@revalue.test / ${PASSWORD}`);
}
main().catch(e => { console.error(e); process.exit(1); });
