'use client';
import { useState } from 'react';
import { sb, aud } from '@/lib/supabase';
export default function Sell() {
  const [f, setF] = useState({ title: '', description: '', category: 'furniture', condition: 'good', age: 2, price: 500, postcode: '2150', suburb: '', owns: false });
  const [files, setFiles] = useState<File[]>([]); const [v, setV] = useState<any>(null); const [ask, setAsk] = useState(0);
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string, val: any) => setF(p => ({ ...p, [k]: val }));
  async function suggest() {
    const r = await fetch('/api/ai/suggest', { method: 'POST', body: JSON.stringify({ hint: f.title || 'Household item' }) });
    if (!r.ok) return setMsg('AI suggestion failed. Enter details manually.');
    const s = await r.json(); setF(p => ({ ...p, title: s.title, description: s.description, category: s.category, condition: s.visibleCondition }));
    setMsg('AI suggestions loaded. Review and edit before publishing.');
  }
  async function estimate() {
    const r = await fetch('/api/valuation', { method: 'POST', body: JSON.stringify({ category: f.category, condition: f.condition, ageYears: f.age, originalPriceCents: f.price * 100 }) });
    if (r.ok) { const x = await r.json(); setV(x); setAsk(x.recommended / 100); } else setMsg('Check the valuation inputs.');
  }
  async function publish() {
    if (!f.title || !f.owns || !v) return setMsg('Add a title, get an estimate and confirm ownership first.');
    setBusy(true); setMsg(''); const c = sb(); const { data: u } = await c.auth.getUser();
    if (!u.user) { setBusy(false); return setMsg('Log in first.'); }
    const { data: item, error } = await c.from('items').insert({ seller_id: u.user.id, title: f.title, description: f.description, category: f.category, condition: f.condition,
      age_years: f.age, original_price_cents: f.price * 100, postcode: f.postcode, suburb: f.suburb, ownership_confirmed: f.owns }).select().single();
    if (error) { setBusy(false); return setMsg(error.message); }
    for (const [i, file] of files.entries()) {
      const path = `${u.user.id}/${item.id}/${i}-${file.name}`;
      const up = await c.storage.from('item-images').upload(path, file);
      if (!up.error) await c.from('item_images').insert({ item_id: item.id, storage_path: path, position: i });
    }
    await c.from('item_valuations').insert({ item_id: item.id, private_low_cents: v.privateLow, private_high_cents: v.privateHigh, dealer_low_cents: v.dealerLow, dealer_high_cents: v.dealerHigh,
      recommended_cents: v.recommended, quick_sale_cents: v.quickSale, confidence: v.confidence, explanation: v.explanation });
    const pub = await c.rpc('publish_item', { p_item: item.id, p_price: Math.round(ask * 100) });
    setBusy(false);
    if (pub.error) return setMsg(`Saved as draft. ${pub.error.message}`);
    window.location.href = `/item/${item.id}`;
  }
  return (<main style={{ maxWidth: 640, margin: '0 auto', padding: 24, display: 'grid', gap: 10 }}>
    <h1>List an item</h1>
    <input placeholder="Title" value={f.title} onChange={e => set('title', e.target.value)} />
    <button onClick={suggest}>Suggest details with AI</button>
    <textarea placeholder="Description" value={f.description} onChange={e => set('description', e.target.value)} />
    <select value={f.category} onChange={e => set('category', e.target.value)}>{['furniture','appliances','electronics','kitchen','other'].map(c => <option key={c}>{c}</option>)}</select>
    <select value={f.condition} onChange={e => set('condition', e.target.value)}>{['new','like_new','good','fair','poor'].map(c => <option key={c}>{c}</option>)}</select>
    <label>Age (years) <input type="number" min={0} value={f.age} onChange={e => set('age', +e.target.value)} /></label>
    <label>Original price (AUD) <input type="number" min={1} value={f.price} onChange={e => set('price', +e.target.value)} /></label>
    <input placeholder="Postcode" value={f.postcode} onChange={e => set('postcode', e.target.value)} /><input placeholder="Suburb" value={f.suburb} onChange={e => set('suburb', e.target.value)} />
    <input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))} />
    <button onClick={estimate}>Get demonstration estimate</button>
    {v && <div style={{ background: '#0B1F3A', color: '#fff', padding: 14, borderRadius: 12 }}>Private sale {aud(v.privateLow)} to {aud(v.privateHigh)}. Dealer {aud(v.dealerLow)} to {aud(v.dealerHigh)}. <small>{v.explanation}</small>
      <label style={{ display: 'block' }}>Asking price (AUD) <input type="number" min={0} value={ask} onChange={e => setAsk(+e.target.value)} /></label></div>}
    <label><input type="checkbox" checked={f.owns} onChange={e => set('owns', e.target.checked)} /> I own this item and consent to publishing it on ReValue</label>
    <button disabled={busy} onClick={publish}>{busy ? 'Publishing' : 'Publish listing'}</button>
    {msg && <p role="status">{msg}</p>}
  </main>);
}
