# ReValue Australia (Phase 1 core)
Run: `npm i`, copy `.env.example` to `.env.local`, apply `supabase/migrations/001_init.sql` in Supabase, then `npm run dev` / `npm test`.

Implemented: schema with RLS; atomic `place_offer`, `accept_offer`, `advance_transaction`; rules-based demo valuation; dealer matching; Zod-validated AI service (mock); connector interface (eBay mock, assisted Facebook/Gumtree); valuation page and API.

Not implemented: live eBay API, payments (offline confirmation only, no escrow), live AI vision, most UI screens, seed data, messaging, admin UI. Mock results are labelled and never shown as real publications.

## Added in step 2
Login/signup, marketplace catalogue with search, item page with bidding (`place_offer`) and seller accept (`accept_offer`), and `npm run seed` (demo users seller/dealer/buyer/admin@revalue.test, password Demo1234!).
Still to build: listing wizard with image upload, dealer registration and admin approval UI, pickup and transaction screens, messaging, SmartPublish UI.

## Step 3 (MVP journey)
Apply `002_mvp.sql` too. Pages: /sell (wizard, image upload, AI suggest, estimate, publish), /dealer/register, /admin (approve dealers), /transactions (pickup, offline payment, complete). Sold items close bidding.
Demo: seller lists item, dealer bids on /item/<id>, seller accepts, both advance /transactions to completed. Supabase email confirmation must be on (or confirm users manually) for publish_item.
Not yet: dealer-match notifications, messaging, SmartPublish UI, moderation, analytics, settings, automated tests of the SQL functions.
