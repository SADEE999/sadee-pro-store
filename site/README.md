# SADEE PRO STORE — Advanced Storefront + Admin Panel

A responsive black/red storefront with product search, category filters, order requests, and a separate Supabase-authenticated admin dashboard. Designed for phone-first setup using GitHub + Netlify + Supabase.

## Included
- Responsive storefront and product catalogue.
- Search, category filters, stock status, and product order modal.
- Customer order requests stored in Supabase.
- Separate `/admin/` login, product add/edit/delete, active/hidden toggle, stock management, order list, and order status controls.
- Row Level Security (RLS), admin allowlist, explicit API grants, and server-side order price validation trigger.
- No service-role key or payment credentials in frontend code.
- GitHub Actions ZIP extractor for the current repository workflow.

## A. Supabase setup (one time)
1. Open https://supabase.com/ and create/open your project.
2. Go to **SQL Editor → New query**.
3. Open `supabase/schema.sql` in this ZIP, copy the entire file, paste it into SQL Editor, then click **Run**.
4. The website uses `config.js` for the project URL and browser-safe publishable key. These are meant for browser use; security comes from RLS. Never put a `service_role` or secret key in frontend code.
5. Edit `SUPPORT_EMAIL` in `config.js` to the real store support email.

### Create the admin account
1. Supabase → **Authentication → Users** → **Add user** (or invite the owner email). Do not add public sign-up to the website.
2. Open that user and copy their UUID.
3. In SQL Editor run this, replacing the placeholder with the real UUID:
   ```sql
   insert into public.admin_users(user_id)
   values ('PASTE-ADMIN-USER-UUID-HERE');
   ```
4. Admin page: `https://YOUR-SITE.netlify.app/admin/`.
5. Sign in with the Supabase email/password you created.

## B. GitHub ZIP workflow (the current setup)
Your repository uses `.github/workflows/extract-zip.yml`. It extracts the uploaded project ZIP into `site/` and commits the files. The archive should contain a single top-level `sadee-pro-store/` folder (as this ZIP does); the workflow strips that outer folder.

1. Open the repository `https://github.com/SADEE999/sadee-pro-store`.
2. **Add file → Upload files**, upload this ZIP to the repository root, and commit the upload.
3. Open **Actions → Extract Store ZIP** and wait for a green successful run.
4. Check `site/` contains `index.html`, `styles.css`, `store.js`, `config.js`, `admin/`, and `supabase/`.

Do not upload the ZIP inside `site/`; upload it to the repository root so the workflow can find it.

## C. Netlify settings (important for the 404 fix)
Netlify → your `sadeexdimaa` project → **Project configuration → Build & deploy / Continuous deployment → Build settings**:
- Production branch: `main`
- Base directory: blank (or `/` if Netlify shows that as the default)
- Build command: blank / not set
- Publish directory: `site`
- Functions directory: blank unless you separately add Netlify Functions

Save settings, then open **Deploys → Trigger deploy → Deploy site**. Wait for the latest production deploy to finish. Open the published site URL, then test `/admin/`.

If the site still returns 404, check the latest deploy log. The deploy must include `site/index.html`. A green GitHub Action alone means extraction succeeded; it does not guarantee Netlify published the same folder.

## D. Add products
1. Sign in at `/admin/`.
2. Use **Add product** and enter name, description, price in LKR, category, stock, and an optional public HTTPS image URL.
3. Turn **Visible in store** on to publish it. Turn it off to hide it without deleting.
4. Use the Orders tab to review incoming requests and update status.

## E. Safety and production notes
- The public page creates an **order request**, not a confirmed purchase and not a payment. Confirm stock, delivery, and payment terms with the customer before collecting payment.
- SQL trigger replaces browser-submitted product name/price with current database values and forces new orders to `pending`.
- The order form is public, so spam is possible. For a high-volume store, add server-side rate limiting or a CAPTCHA/Edge Function.
- The site does not process card payments. Never ask customers for passwords, OTPs, or payment PINs.
- Use only images and product descriptions you have permission to publish.
