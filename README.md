# SADEE PRO STORE — Gaming Store Update

Premium dark gaming storefront with neon-red styling, responsive product cards, wishlist, stock visibility, customer order lookup, eZ Cash manual verification, license delivery, promo codes, announcements, reviews moderation, website customization, and a separate admin console.

## Included in this build

- Gaming-style black / neon-red storefront with responsive layout and reduced-motion support.
- Product search, category filters, plans, product detail modal, stock visibility, and device-local wishlist.
- Customer order submission using a server-side function; the displayed order code is used with the customer's email in **My Orders**.
- eZ Cash manual verification: the admin must check the actual transaction before verifying. A key is generated only after verification.
- License key appears in My Orders after verification; email delivery is attempted using Resend when configured.
- Admin product add/edit/delete and product-image upload through a secret-protected Netlify Function.
- Admin overview cards for products, low stock, orders and verified sales (orders/sales cards are based on the most recent 100 orders returned by the function).
- Site customizer for logo image, hero image, hero video and accent color.
- Promo code creation and checkout discount validation.
- Announcements/maintenance notices and customer review submission with admin approval.
- PWA manifest and basic offline shell caching.

## Before deploying

**This ZIP has not been connected to your live Supabase or Netlify account, and has not been deployed.** Do not assume that payments, email, database policies or the live site have been verified. Run the setup below and test with a small test order before announcing it to customers.

### 1. Supabase

1. Open the Supabase SQL Editor for the project configured in `config.js`.
2. Run `supabase/schema.sql`.
3. Run `supabase/orders-schema.sql`.
4. Confirm the `product-images` storage bucket exists and is public-read only. The SQL removes anonymous upload/update/delete policies; uploads are done server-side.
5. Check that your products table uses the fields defined in `schema.sql` and edit the sample listing before publishing.

### 2. Netlify environment variables

Add these under Netlify site settings → Environment variables. Never add the service-role key or admin secret to `config.js` or commit them to GitHub.

- `SUPABASE_URL` — your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key; server-side only.
- `STORE_ADMIN_SECRET` — a long, random private value. You enter it in the admin prompt when performing protected actions.
- `RESEND_API_KEY` — optional; required for automatic email delivery.
- `STORE_FROM_EMAIL` — optional; a sender address verified with Resend.

Redeploy after adding or changing environment variables. Functions require Node.js support; the included `netlify.toml` sets the functions directory to `netlify/functions`.

### 3. Store configuration

Edit `config.js` and set the correct public Supabase URL and publishable/anon key, the official `EZCASH_NUMBER`, and your WhatsApp number. The supplied eZ Cash number is configured as 94760625028 (displayed as 076 062 5028). Verify the number belongs to the store owner before accepting payments. `SUPPORT_EMAIL` is a placeholder and should be replaced with a real support email or left unused.

### 4. eZ Cash and licenses

1. Customer submits an order code, email and payment reference.
2. Admin checks the actual incoming eZ Cash transaction outside the website.
3. Admin chooses Verify or Reject. A verified order gets one generated license key.
4. The customer uses **My Orders** with the order code and matching email to see the status and key. Email is sent only when Resend settings are valid.

A screenshot or payment reference alone is not proof of payment. Do not verify until the transaction is confirmed in the official account/merchant records.

### Promo-code JSON error fix (Unexpected token '<')

If clicking **Validate promo code** shows `Unexpected token '<'` or says the response starts with `<!DOCTYPE`, the browser received an HTML page (often a Netlify 404 page) instead of the JSON response from the function. The frontend now reports this clearly. Fix the deployment too:

1. Confirm the Netlify site is connected to the GitHub repository that contains the extracted `site/` folder and `netlify/functions/validate-promo.mjs`.
2. The repository root `netlify.toml` must use `publish = "site"` and `directory = "netlify/functions"` when using the included ZIP-extraction workflow. The workflow creates that configuration automatically.
3. Trigger a new GitHub Actions run after uploading this ZIP to the repository root, wait for it to finish, then trigger/confirm a Netlify deploy. Do not use a manual drag-and-drop static deploy for this functions-based checkout.
4. Open `https://YOUR-SITE.netlify.app/.netlify/functions/validate-promo` in a browser. A JSON `Method not allowed` response is expected for a GET request and confirms the function route exists. If an HTML page appears, the function still is not deployed at that site.
5. In Netlify environment variables set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then redeploy. Run `supabase/orders-schema.sql` in Supabase so the `promo_codes` table exists.

### 5. Promo codes

Promo codes are validated server-side when an order is submitted. Discounts are applied to the order amount. This is a manual-payment checkout, not an automatic eZ Cash gateway. Verify the final amount received matches the discounted amount before issuing a key.

### 6. Testing checklist

- Test product add/edit/delete with the admin secret.
- Test image upload with a small JPG/PNG/WebP/GIF (maximum about 3 MB).
- Test promo code with valid, expired/invalid and repeated-code cases.
- Submit a test order, confirm it stays pending, then test reject and verify flows.
- Confirm stock decrements only after successful verification; restock products before verifying if stock is zero.
- Confirm My Orders does not reveal a key for pending/rejected orders.
- Configure Resend and test email delivery before using it for real orders.
- Test phone layout and PWA install on the deployed HTTPS domain.

## Security notes

- Product, settings, image upload and order-review mutations are routed through server-side Netlify Functions using `STORE_ADMIN_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`.
- Never put `SUPABASE_SERVICE_ROLE_KEY`, `STORE_ADMIN_SECRET` or Resend secrets in browser code.
- The order lookup currently relies on the order code plus matching email. Add rate limiting/CAPTCHA at the edge before a high-traffic public launch.
- Review submissions are hidden until approved by an admin.
- This project uses manual eZ Cash verification; it does not automatically query eZ Cash transaction records.
- A promo code is applied to the order total; check the amount received before verifying payment.


## Troubleshooting JSON response errors (important)

If the browser shows `Unexpected token '<'` or `Unexpected end of JSON input`, the website was receiving an HTML/empty response from a server endpoint. This release shows a clearer message instead of crashing while parsing. It does not bypass a missing deployment or missing environment variables.

In Netlify Site configuration → Environment variables, configure: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `STORE_ADMIN_SECRET`. Set `RESEND_API_KEY` and `STORE_FROM_EMAIL` only if email delivery is configured. Redeploy after changing variables. Do not place the service-role key in `config.js` or commit it to GitHub.

For GitHub ZIP extraction, run the `Extract Store ZIP` workflow and confirm the generated `site/`, `netlify/functions/`, and `netlify.toml` are committed. In Netlify deploy logs, confirm all functions (`validate-promo`, `manage-order`, `manage-store`, `create-order`, `lookup-order`, `submit-review`) are published.

Run `supabase/schema.sql` and `supabase/orders-schema.sql` in the Supabase SQL Editor if they have not already been applied. Check the SQL output for errors before testing again.


## Deployment troubleshooting (important)

The browser error `Unexpected token '<'` or `Unexpected end of JSON input` usually means the browser received an HTML 404/redirect/error page or an empty response instead of JSON. The frontend now reports a clearer message, but that does not by itself repair a missing server function.

1. In Netlify, confirm the latest deploy is **Published** and that the deployed site publishes the `site/` directory. The GitHub Actions workflow extracts `netlify/functions/*.mjs` into the repository-level `netlify/functions/` directory and writes `netlify.toml` with `publish = "site"`.
2. In Netlify environment variables, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong `STORE_ADMIN_SECRET`. Optional email delivery needs `RESEND_API_KEY` and a verified `STORE_FROM_EMAIL`. Redeploy after changing variables. Never put the service role key in `config.js`, HTML, browser JS, or public GitHub files.
3. Confirm `supabase/schema.sql` and `supabase/orders-schema.sql` have been run in the correct Supabase project. Review SQL Editor results for errors.
4. Open `https://YOUR-SITE/.netlify/functions/validate-promo` in a browser. A JSON `Method not allowed` response is expected for GET and proves the route exists. An HTML page indicates a routing/deployment issue; check Netlify function logs.
5. Test a low-risk order using a real product and do not mark it verified until the incoming eZ Cash payment is confirmed independently.

This ZIP cannot confirm live Netlify/Supabase state. A successful local ZIP/syntax check is not proof that deployment, database schema, credentials, email delivery, or payment flow work in production.


## Fixed checkout diagnostics (this release)

The `create-order` Function now logs Supabase REST failures (HTTP status and safe response details, never the API key) and returns a clearer customer-facing message for common setup problems:
- Missing `products` table: run `supabase/schema.sql`.
- Missing `store_orders` / promo tables: run `supabase/orders-schema.sql`.
- Rejected server key: recheck the Netlify `SUPABASE_SERVICE_ROLE_KEY` value.
- Network/URL failure: recheck `SUPABASE_URL`.

After uploading this ZIP and allowing the GitHub Actions extraction workflow to finish, wait for Netlify to publish the new deploy. Then check the `create-order` Function logs if checkout still fails. The SQL scripts must be run manually in the correct Supabase project; deploying code does not run database migrations automatically.
