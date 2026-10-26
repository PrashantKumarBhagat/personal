export interface DealerPref { id: string; approved: boolean; categories: string[]; postcode?: string; radiusKm: number; maxBudgetCents?: number }
export interface ItemLite { category: string; postcode: string; askingCents: number; distanceKm: (dealerPostcode: string) => number }
export function matchDealers(item: ItemLite, dealers: DealerPref[]) {
  return dealers
    .filter(d => d.approved && d.categories.includes(item.category)
      && (!d.maxBudgetCents || item.askingCents <= d.maxBudgetCents)
      && (!d.postcode || item.distanceKm(d.postcode) <= d.radiusKm))
    .map(d => ({ dealerId: d.id, distanceKm: d.postcode ? item.distanceKm(d.postcode) : 0 }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
