# ReValue Australia (Phase 1 core)
Run: `npm i`, copy `.env.example` to `.env.local`, apply `supabase/migrations/001_init.sql` in Supabase, then `npm run dev` / `npm test`.

Implemented: schema with RLS; atomic `place_offer`, `accept_offer`, `advance_transaction`; rules-based demo valuation; dealer matching; Zod-validated AI service (mock); connector interface (eBay mock, assisted Facebook/Gumtree); valuation page and API.

Not implemented: live eBay API, payments (offline confirmation only, no escrow), live AI vision, most UI screens, seed data, messaging, admin UI. Mock results are labelled and never shown as real publications.
