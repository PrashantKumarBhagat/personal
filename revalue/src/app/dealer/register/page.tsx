'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';
export default function DealerRegister() {
  const [f, setF] = useState({ business: '', abn: '', postcode: '2150', radius: 25, cats: ['furniture'] as string[] }); const [msg, setMsg] = useState('');
  async function go() {
    if (!/^\d{11}$/.test(f.abn)) return setMsg('ABN must be 11 digits.');
    const { error } = await sb().rpc('register_dealer', { p_business: f.business, p_abn: f.abn, p_cats: f.cats, p_postcode: f.postcode, p_radius: f.radius });
    setMsg(error ? error.message : 'Submitted. An administrator must approve you before you can bid.');
  }
  const toggle = (c: string) => setF(p => ({ ...p, cats: p.cats.includes(c) ? p.cats.filter(x => x !== c) : [...p.cats, c] }));
  return (<main style={{ maxWidth: 480, margin: '0 auto', padding: 24, display: 'grid', gap: 10 }}>
    <h1>Register as a dealer</h1>
    <input placeholder="Business name" value={f.business} onChange={e => setF({ ...f, business: e.target.value })} />
    <input placeholder="ABN (11 digits)" value={f.abn} onChange={e => setF({ ...f, abn: e.target.value })} />
    <input placeholder="Postcode" value={f.postcode} onChange={e => setF({ ...f, postcode: e.target.value })} />
    <label>Buying radius (km) <input type="number" min={1} value={f.radius} onChange={e => setF({ ...f, radius: +e.target.value })} /></label>
    {['furniture','appliances','electronics','kitchen','other'].map(c => <label key={c}><input type="checkbox" checked={f.cats.includes(c)} onChange={() => toggle(c)} /> {c}</label>)}
    <button onClick={go}>Submit for approval</button>{msg && <p role="status">{msg}</p>}
  </main>);
}
