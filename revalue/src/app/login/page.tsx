'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';
export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [mode, setMode] = useState<'in' | 'up'>('in');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setMsg(''); const c = sb();
    const r = mode === 'in' ? await c.auth.signInWithPassword({ email, password }) : await c.auth.signUp({ email, password, options: { data: { full_name: name } } });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    if (mode === 'up' && r.data.user) await c.from('profiles').insert({ id: r.data.user.id, full_name: name || email, role: 'seller' });
    window.location.href = '/marketplace';
  }
  return (<main style={{ maxWidth: 380, margin: '60px auto', padding: 24, display: 'grid', gap: 10 }}>
    <h1>{mode === 'in' ? 'Log in' : 'Create account'}</h1>
    {mode === 'up' && <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}
    <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
    <button disabled={busy} onClick={submit}>{busy ? 'Please wait' : mode === 'in' ? 'Log in' : 'Create account'}</button>
    {msg && <p role="alert" style={{ color: '#b00020' }}>{msg}</p>}
    <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Log in'}</button>
  </main>);
}
