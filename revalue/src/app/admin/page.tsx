'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
export default function Admin() {
  const [rows, setRows] = useState<any[]>([]); const [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data, error } = await sb().from('dealer_profiles').select('*').eq('approved', false); if (error) setMsg(error.message); setRows(data ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  async function approve(id: string) {
    if (!confirm('Approve this dealer to bid?')) return;
    const { error } = await sb().from('dealer_profiles').update({ approved: true }).eq('id', id); setMsg(error ? error.message : 'Dealer approved.'); load();
  }
  return (<main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}><h1>Dealer approvals</h1>
    {rows.length === 0 && <p>No dealers are waiting for approval.</p>}
    {rows.map(d => <div key={d.id} style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 }}>{d.business_name}, ABN {d.abn}, {d.categories.join(', ')}, {d.postcode} ({d.radius_km} km)
      <button style={{ marginLeft: 8 }} onClick={() => approve(d.id)}>Approve</button></div>)}
    {msg && <p role="status">{msg}</p>}</main>);
}
