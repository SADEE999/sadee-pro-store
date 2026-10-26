# SADEE PRO STORE — Full Website ZIP

A responsive digital-product storefront for SADEE PRO STORE with a separate admin URL, Supabase-backed product catalog, product detail views, configurable plan prices, WhatsApp ordering, and a configurable muted autoplay hero video.

## Included
- Public storefront at `/` (no Admin link displayed in public navigation).
- Separate admin page at `/admin/`.
- Supabase Auth sign-in plus `admin_users` allowlist check. No hardcoded admin password is included.
- Product create/edit/delete, visible/hidden status, featured status, image URL, features, version, compatibility, and custom plans.
- Default sample plan list: Lifetime LKR 4,500; 1 Month LKR 2,200; 7 Days LKR 1,000; optional 1 Day Trial LKR 300; 3 Days LKR 600; 15 Days LKR 1,500; 3 Months LKR 3,500; 6 Months LKR 4,000. The store admin can edit plans per product. Confirm that optional plans are your intended prices before publishing them.
- WhatsApp order message prepared for +94 76 847 2404. Customer reviews and sends the message manually; the site does not send messages automatically.
- Admin can set a direct HTTPS hero video URL. Video autoplay is muted and may be blocked by some browsers. The video must be hosted somewhere accessible by a direct URL.
- Existing orders table retained for legacy/database orders. WhatsApp messages do not automatically appear in the Orders tab.
- GitHub Actions ZIP extraction workflow and Netlify configuration.

## Deploy with GitHub + Netlify
1. Upload the ZIP to the root of your GitHub repository and commit it. Keep `.github/workflows/extract-zip.yml` in the repo if you want GitHub Actions to extract it into `site/`.
2. In Netlify, use the GitHub repository, production branch `main`, build command blank, and publish directory `site`.
3. Confirm the GitHub Actions workflow succeeds and Netlify redeploys.

## Supabase setup
1. Open the Supabase project linked in `config.js` (or update `config.js` with your own project URL and publishable/anon key). Never put a `service_role` key in browser code.
2. Open **SQL Editor** and run the complete `supabase/schema.sql` file.
3. In Supabase Authentication, create an admin user. Then copy that user's UUID and run the final allowlist insert shown in the SQL comments:
   `insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');`
4. Open `/admin/`, sign in using that Supabase Auth account, and add/edit products.
5. For each product, fill the name, description, base price, category, stock, optional image URL, authorized download URL (HTTPS), version, compatibility, and features (one per line). Enter plans one per line in this format:
   `Lifetime | Lifetime access | 4500`
   `1 Month | 30 days | 2200`
   `7 Days | 7 days | 1000`
6. To add a hero video, use a direct HTTPS MP4 URL in Admin → Homepage hero video. Leave it blank or remove it to use the designed hero artwork.

## Important security and content notes
- The public page does not display a link to the admin page, but hiding a link is not security. The admin area is protected by Supabase Auth and the `admin_users` allowlist/RLS policies. Do not share admin credentials.
- Do not add secrets or service-role keys to `config.js`.
- Only list software, APKs, images, videos, and digital products you own or have permission to distribute. Describe compatibility and limitations accurately.
- Supabase public image URLs should only be used for assets intended to be public. This version stores product image/video/download references as URLs; it does not upload large APK files or create paid, authenticated download links. Only use public download URLs for files intended to be public; use protected delivery for paid files.
- WhatsApp order requests are sent by the customer from WhatsApp after reviewing the prefilled message. Do not request passwords, OTPs, or payment PINs.

## Files
- `index.html`, `styles.css`, `store.js`: public storefront
- `admin/`: separate admin console
- `config.js`: public Supabase config and WhatsApp contact
- `supabase/schema.sql`: tables and row-level security policies
- `.github/workflows/extract-zip.yml`: extracts project ZIP into `site/`
