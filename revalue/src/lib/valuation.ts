// DEMONSTRATION ESTIMATOR: transparent rules, not live market data.
export const CATEGORY_DEPRECIATION: Record<string, number> = { furniture: 0.12, appliances: 0.15, electronics: 0.25, kitchen: 0.10, other: 0.15 };
export const CONDITION_FACTOR = { new: 1, like_new: 0.9, good: 0.75, fair: 0.55, poor: 0.3 } as const;
export type Condition = keyof typeof CONDITION_FACTOR;
export const DEALER_DISCOUNT = 0.6;
export interface ValuationInput { category: string; condition: Condition; ageYears: number; originalPriceCents?: number }
export interface Valuation { privateLow: number; privateHigh: number; dealerLow: number; dealerHigh: number; recommended: number; quickSale: number; confidence: number; explanation: string; demo: true }
const r = (n: number) => Math.round(n / 100) * 100;
export function estimate(i: ValuationInput): Valuation {
  if (!i.originalPriceCents || i.originalPriceCents <= 0)
    return { privateLow: 0, privateHigh: 0, dealerLow: 0, dealerHigh: 0, recommended: 0, quickSale: 0, confidence: 0.1, demo: true,
      explanation: 'No original price supplied, so no estimate can be made.' };
  const rate = CATEGORY_DEPRECIATION[i.category] ?? CATEGORY_DEPRECIATION.other;
  const age = Math.max(0, i.ageYears);
  const mid = Math.max(i.originalPriceCents * Math.pow(1 - rate, age) * CONDITION_FACTOR[i.condition], i.originalPriceCents * 0.05);
  const privateLow = r(mid * 0.85), privateHigh = r(mid * 1.15);
  return { privateLow, privateHigh, dealerLow: r(privateLow * DEALER_DISCOUNT), dealerHigh: r(privateHigh * DEALER_DISCOUNT),
    recommended: r(mid * 1.05), quickSale: r(mid * 0.8), confidence: 0.35, demo: true,
    explanation: `Demonstration estimate: ${Math.round(rate * 100)}%/yr depreciation for ${i.category}, ${age} yr(s), condition "${i.condition}". Not based on live comparable sales.` };
}
