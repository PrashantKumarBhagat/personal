import { describe, it, expect } from 'vitest';
import { estimate } from '../src/lib/valuation';
import { matchDealers } from '../src/lib/matching';
import { suggestListing } from '../src/lib/ai';
describe('valuation', () => {
  it('orders ranges and is labelled demo', () => {
    const v = estimate({ category: 'furniture', condition: 'good', ageYears: 3, originalPriceCents: 80000 });
    expect(v.privateLow).toBeLessThan(v.privateHigh); expect(v.dealerHigh).toBeLessThan(v.privateHigh); expect(v.demo).toBe(true);
  });
  it('declines without original price', () => expect(estimate({ category: 'x', condition: 'good', ageYears: 1 }).confidence).toBeLessThan(0.2));
});
describe('matching', () => {
  it('excludes unapproved and out-of-radius dealers', () => {
    const item = { category: 'furniture', postcode: '2150', askingCents: 5000, distanceKm: (p: string) => p === '2000' ? 10 : 99 };
    const m = matchDealers(item, [
      { id: 'a', approved: true, categories: ['furniture'], postcode: '2000', radiusKm: 25 },
      { id: 'b', approved: false, categories: ['furniture'], postcode: '2000', radiusKm: 25 },
      { id: 'c', approved: true, categories: ['furniture'], postcode: '2000', radiusKm: 5 }]);
    expect(m.map(x => x.dealerId)).toEqual(['a']);
  });
});
describe('ai', () => { it('returns schema-valid suggestion', async () => expect((await suggestListing([], 'Oak table')).title).toBe('Oak table')); });
