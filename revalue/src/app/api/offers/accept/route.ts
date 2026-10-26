import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function POST(req: Request) {
  const body = z.object({ offerId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid offer id' }, { status: 400 });
  const jar = cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
  const { data, error } = await sb.rpc('accept_offer', { p_offer: body.data.offerId });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ transactionId: data });
}
