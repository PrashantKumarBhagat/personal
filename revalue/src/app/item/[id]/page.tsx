'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sb, aud } from '@/lib/supabase';
export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null); const [offers, setOffers] = useState<any[]>([]); const [uid, setUid] = useState<string | null>(null);
  const [f, setF] = useState({ amount: 50, fee: 0, days: 3 }); const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const c = sb(); setUid((await c.auth.getUser()).data.user?.id ?? null);
    setItem((await c.from('items').select('*').eq('id', id).single()).data);
    setOffers((await c.from('offers').select('*').eq('item_id', id).order('net_cents', { ascending: false })).data ?? []);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  async function bid() {
    setMsg(''); const expires = new Date(Date.now() + f.days * 864e5).toISOString();
    const { error } = await sb().rpc('place_offer', { p_item: id, p_amount: Math.round(f.amount * 100), p_fee: Math.round(f.fee * 100), p_expires: expires, p_cond: null });
    setMsg(error ? error.message : 'Offer submitted'); load();
  }
  async function accept(offerId: string) {
    if (!confirm('Accept this offer? Other pending offers will be rejected.')) return;
    const r = await fetch('/api/offers/accept', { method: 'POST', body: JSON.stringify({ offerId }) });
    setMsg(r.ok ? 'Offer accepted. Next: schedule pickup.' : (await r.json()).error); load();
  }
  if (!item) return <main style={{ padding: 24 }}>Loading item</main>;
  const isSeller = uid === item.seller_id; const open = item.status === 'active';
  return (<main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
    <a href="/marketplace">Back to marketplace</a>
    <h1>{item.title}</h1><p>{item.description}</p><p>Status: {item.status}</p>
    {!uid && <p><a href="/login">Log in</a> to make an offer.</p>}
    {uid && !isSeller && open && <div style={{ display: 'grid', gap: 8, background: '#fff', padding: 16, borderRadius: 16 }}>
      <label>Offer (AUD) <input type="number" min={1} value={f.amount} onChange={e => setF({ ...f, amount: +e.target.value })} /></label>
      <label>Pickup fee (AUD) <input type="number" min={0} value={f.fee} onChange={e => setF({ ...f, fee: +e.target.value })} /></label>
      <label>Valid for (days) <input type="number" min={1} value={f.days} onChange={e => setF({ ...f, days: +e.target.value })} /></label>
      <button onClick={bid}>Submit offer</button></div>}
    {!open && <p>This item is no longer open for offers.</p>}
    {msg && <p role="status">{msg}</p>}
    {offers.length > 0 && <><h2>{isSeller ? 'Offers, ranked by net proceeds' : 'Your offers'}</h2>
      {offers.map(o => <div key={o.id} style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 }}>
        Net {aud(o.net_cents)} (offer {aud(o.amount_cents)}, pickup fee {aud(o.pickup_fee_cents)}). {o.status}. Expires {new Date(o.expires_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
        {isSeller && o.status === 'pending' && <button style={{ marginLeft: 8 }} onClick={() => accept(o.id)}>Accept</button>}</div>)}</>}
  </main>);
}
