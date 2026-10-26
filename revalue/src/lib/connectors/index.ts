export type PublishMode = 'api' | 'assisted';
export interface ListingPayload { id: string; title: string; description: string; priceCents: number; imageUrls: string[] }
export interface PublishResult { status: 'published' | 'awaiting_manual' | 'failed'; externalId?: string; assistedUrl?: string; message: string }
export interface MarketplaceConnector {
  channel: string; mode: PublishMode;
  connect(userId: string): Promise<{ authUrl?: string }>;
  validate(userId: string): Promise<boolean>;
  prepare(l: ListingPayload): ListingPayload;
  publish(l: ListingPayload): Promise<PublishResult>;
  update(externalId: string, l: ListingPayload): Promise<PublishResult>;
  status(externalId: string): Promise<'published' | 'ended' | 'unknown'>;
  end(externalId: string): Promise<boolean>;
}
/** eBay: never reports success without a real API call. */
export class EbayMock implements MarketplaceConnector {
  channel = 'ebay_au'; mode: PublishMode = 'api';
  async connect() { return {}; }
  async validate() { return !!process.env.EBAY_CLIENT_ID; }
  prepare(l: ListingPayload) { return { ...l, title: l.title.slice(0, 80) }; }
  async publish(): Promise<PublishResult> {
    return { status: 'failed', message: process.env.EBAY_CLIENT_ID ? 'Live eBay Sell API call not implemented in this build.' : 'eBay credentials not configured. Nothing was published.' };
  }
  async update() { return this.publish(); }
  async status() { return 'unknown' as const; }
  async end() { return false; }
}
/** Assisted publishing: no automation; the seller posts manually and confirms. */
export class AssistedConnector implements MarketplaceConnector {
  mode: PublishMode = 'assisted';
  constructor(public channel: string, private postUrl: string) {}
  async connect() { return {}; }
  async validate() { return true; }
  prepare(l: ListingPayload) { return { ...l, title: l.title.slice(0, 100) }; }
  async publish(l: ListingPayload): Promise<PublishResult> {
    return { status: 'awaiting_manual', assistedUrl: this.postUrl, message: `Copy the details for "${l.title}", post on ${this.channel}, then confirm.` };
  }
  async update(_id: string, l: ListingPayload) { return this.publish(l); }
  async status() { return 'unknown' as const; }
  async end() { return false; }
}
export const connectors: MarketplaceConnector[] = [
  new EbayMock(),
  new AssistedConnector('facebook_marketplace', 'https://www.facebook.com/marketplace/create/item'),
  new AssistedConnector('gumtree_au', 'https://www.gumtree.com.au/'),
];
