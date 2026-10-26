import { NextResponse } from 'next/server';
import { z } from 'zod';
import { estimate } from '@/lib/valuation';
const Body = z.object({ category: z.string(), condition: z.enum(['new','like_new','good','fair','poor']),
  ageYears: z.number().min(0).max(100), originalPriceCents: z.number().int().positive().optional() });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  return NextResponse.json(estimate(p.data));
}
