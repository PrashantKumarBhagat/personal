import { NextResponse } from 'next/server';
import { z } from 'zod';
import { suggestListing } from '@/lib/ai';
export async function POST(req: Request) {
  const b = z.object({ hint: z.string().max(200).optional() }).safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  try { return NextResponse.json(await suggestListing([], b.data.hint)); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 502 }); }
}
