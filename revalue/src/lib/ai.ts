import { z } from 'zod';
export const ListingSuggestion = z.object({
  category: z.enum(['furniture', 'appliances', 'electronics', 'kitchen', 'other']),
  title: z.string().min(3).max(100), description: z.string().max(1500),
  brand: z.string().nullable(), visibleCondition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
});
export type ListingSuggestion = z.infer<typeof ListingSuggestion>;
export interface AiProvider { suggestListing(imageUrls: string[], hint?: string): Promise<unknown> }
class MockProvider implements AiProvider {
  async suggestListing(_i: string[], hint = 'Household item') {
    return { category: 'furniture', title: hint.slice(0, 80), brand: null, visibleCondition: 'good',
      description: `${hint}. [Demo suggestion: review and edit before saving. No specifications inferred.]` };
  }
}
let calls = 0; const MAX_CALLS = 200; // crude cost control; replace with per-user quotas
export async function suggestListing(urls: string[], hint?: string, provider: AiProvider = new MockProvider()) {
  if (++calls > MAX_CALLS) throw new Error('AI usage limit reached');
  let lastErr: unknown;
  for (let a = 0; a < 3; a++) { try { return ListingSuggestion.parse(await provider.suggestListing(urls, hint)); } catch (e) { lastErr = e; } }
  throw new Error(`AI response failed validation: ${String(lastErr)}`);
}
