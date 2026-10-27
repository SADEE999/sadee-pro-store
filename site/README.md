# SADEE PRO STORE

Mobile-first red/black gaming and digital store using Supabase and Netlify.

## eZ Cash manual payment + license workflow
1. Run `supabase/orders-schema.sql` in the Supabase SQL Editor.
2. In `config.js`, set `EZCASH_NUMBER` to the store's correct official eZ Cash payment number. Do not leave the placeholder live.
3. Add these environment variables in Netlify (Site configuration → Environment variables):
   - `SUPABASE_URL` — the project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key; server-side only, never put in `config.js` or the GitHub repository
   - `STORE_ADMIN_SECRET` — a long random secret used to authorize order-management actions
   - Optional email: `RESEND_API_KEY` and `STORE_FROM_EMAIL` using a sender/domain verified with Resend
4. Redeploy the site after adding environment variables.
5. Customer submits name, email, selected product/plan and eZ Cash transaction reference. The order remains `pending`.
6. Admin opens `/admin/`, chooses Orders and enters the private `STORE_ADMIN_SECRET`. Verify the actual incoming eZ Cash transaction before clicking Verify payment. Only verified orders receive a generated license key.
7. Email delivery only works after Resend and a verified sender are configured. Otherwise, the generated key is visible in the protected admin orders panel.

## Deployment from ZIP
Upload this ZIP to the root of the GitHub repository. The workflow extracts public website files into `site/`, and secure server functions into the repository's `netlify/functions/` folder. Netlify should publish `site/` and use `netlify/functions/` for functions.

## Security notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser JavaScript or commit it to GitHub.
- Do not enable public RLS policies on `store_orders`. It contains customer details and license keys and is accessible only to server-side functions.
- Existing product-management policies in older project setups may permit public writes. Review and restrict product/settings/storage write policies before running a public store; no-login admin panels are not secure by themselves.
- A transaction reference or screenshot is not proof of payment. Verify the actual transaction in eZ Cash before releasing the key.
- This is a manual eZ Cash verification workflow, not an official automated eZ Cash gateway integration.
