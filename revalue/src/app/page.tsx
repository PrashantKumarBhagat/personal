'use client';
import { useState } from 'react';
const aud = (c: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(c / 100);
export default function Home() {
  const [f, setF] = useState({ category: 'furniture', condition: 'good', ageYears: 3, price: 800 });
  const [v, setV] = useState<any>(null); const [err, setErr] = useState('');
  async function go() {
    setErr('');
    const res = await fetch('/api/valuation', { method: 'POST', body: JSON.stringify({ category: f.category, condition: f.condition, ageYears: f.ageYears, originalPriceCents: f.price * 100 }) });
    if (res.ok) setV(await res.json()); else setErr('Check your details and try again.');
  }
  return (<main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
    <h1 style={{ fontSize: 40 }}>Upload once. Know your price. Sell everywhere.</h1>
    <div style={{ display: 'grid', gap: 12, background: '#fff', padding: 20, borderRadius: 16 }}>
      <label>Category <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{['furniture','appliances','electronics','kitchen','other'].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Condition <select value={f.condition} onChange={e => setF({ ...f, condition: e.target.value })}>{['new','like_new','good','fair','poor'].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Age (years) <input type="number" min={0} value={f.ageYears} onChange={e => setF({ ...f, ageYears: +e.target.value })} /></label>
      <label>Original price (AUD) <input type="number" min={1} value={f.price} onChange={e => setF({ ...f, price: +e.target.value })} /></label>
      <button onClick={go} style={{ background: '#0F8B8D', color: '#fff', border: 0, padding: 12, borderRadius: 12 }}>Estimate value</button>
    </div>
    {err && <p role="alert" style={{ color: '#b00020' }}>{err}</p>}
    {v && <section style={{ marginTop: 20, background: '#0B1F3A', color: '#fff', padding: 20, borderRadius: 16 }}>
      <strong>Demonstration estimate</strong>
      <p>Private sale: {aud(v.privateLow)} to {aud(v.privateHigh)}</p>
      <p>Dealer: {aud(v.dealerLow)} to {aud(v.dealerHigh)}</p>
      <p>Recommended: {aud(v.recommended)}. Quick sale: {aud(v.quickSale)}.</p>
      <small>{v.explanation} Confidence {Math.round(v.confidence * 100)}%.</small></section>}
  </main>);
}
