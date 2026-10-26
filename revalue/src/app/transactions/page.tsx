'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
const NEXT: Record<string, [string, string]> = { offer_accepted: ['pickup_scheduled', 'Schedule pickup'], pickup_scheduled: ['pickup_confirmed', 'Confirm pickup'],
  pickup_confirmed: ['payment_confirmed', 'Confirm payment received (offline)'], payment_confirmed: ['completed', 'Complete sale'] };
export default function Transactions() {
  const [rows, setRows] = useState<any[]>([]); const [when, setWhen] = useState(''); const [msg, setMsg] = useState('');
  const load = useCallback(async () => setRows((await sb().from('transactions').select('*, items(title)').order('created_at', { ascending: false })).data ?? []), []);
  useEffect(() => { load(); }, [load]);
  async function step(id: string, next: string) {
    if (next === 'pickup_scheduled' && !when) return setMsg('Choose a pickup date and time first.');
    const { error } = await sb().rpc('advance_transaction', { p_txn: id, p_next: next, p_pickup: next === 'pickup_scheduled' ? new Date(when).toISOString() : null });
    setMsg(error ? error.message : 'Updated.'); load();
  }
  return (<main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}><h1>Transactions</h1>
    {rows.length === 0 && <p>No transactions yet. Accepted offers appear here.</p>}
    <label>Pickup (Sydney time) <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></label>
    {rows.map(t => { const n = NEXT[t.status]; return (<div key={t.id} style={{ background: '#fff', padding: 12, borderRadius: 12, margin: '8px 0' }}>
      <strong>{t.items?.title}</strong>: {t.status.replace(/_/g, ' ')}{t.pickup_at && `, pickup ${new Date(t.pickup_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`}
      {n && <button style={{ marginLeft: 8 }} onClick={() => step(t.id, n[0])}>{n[1]}</button>}
      {n && <button style={{ marginLeft: 8 }} onClick={() => step(t.id, 'cancelled')}>Cancel</button>}</div>); })}
    {msg && <p role="status">{msg}</p>}</main>);
}
