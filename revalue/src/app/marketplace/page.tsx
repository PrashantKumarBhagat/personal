'use client';
import { useEffect, useState } from 'react';
import { sb, aud } from '@/lib/supabase';
type Item = { id: string; title: string; category: string; suburb: string | null; asking_price_cents: number | null };
export default function Marketplace() {
  const [items, setItems] = useState<Item[] | null>(null); const [q, setQ] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { sb().from('items').select('id,title,category,suburb,asking_price_cents').eq('status', 'active').order('created_at', { ascending: false })
    .then(({ data, error }) => error ? setErr(error.message) : setItems(data as Item[])); }, []);
  const shown = (items ?? []).filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
  return (<main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
    <nav style={{ display: 'flex', justifyContent: 'space-between' }}><a href="/">ReValue Australia</a><span><a href="/sell">Sell</a> <a href="/transactions">Transactions</a> <a href="/dealer/register">Dealers</a> <a href="/admin">Admin</a> <a href="/login">Log in</a></span></nav>
    <h1>Marketplace</h1>
    <input placeholder="Search items" value={q} onChange={e => setQ(e.target.value)} />
    {err && <p role="alert">{err}</p>}
    {items === null && !err && <p>Loading items</p>}
    {items?.length === 0 && <p>No items are listed yet. Run the seed script to add demo items.</p>}
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', marginTop: 16 }}>
      {shown.map(i => <a key={i.id} href={`/item/${i.id}`} style={{ background: '#fff', padding: 16, borderRadius: 16, color: 'inherit', textDecoration: 'none' }}>
        <strong>{i.title}</strong><div>{i.category}, {i.suburb ?? 'Sydney'}</div><div>{i.asking_price_cents != null ? aud(i.asking_price_cents) : 'Make an offer'}</div></a>)}
    </div></main>);
}
