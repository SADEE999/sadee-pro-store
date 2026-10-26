# SADEE PRO STORE

A mobile-friendly black/red storefront with a separate authenticated admin dashboard. Built for GitHub + Netlify + Supabase.

## Features
- Responsive store landing page, product search and category filters.
- Live product catalogue from Supabase.
- Customer order requests stored in Supabase.
- Separate `/admin/` sign-in, product create/edit/delete and order status management.
- Row Level Security policies so only UUIDs explicitly inserted into `admin_users` can manage inventory or read/update orders.
- No payment credentials or service-role keys in frontend code.
- Optional GitHub Actions workflow to extract the project ZIP automatically after it is uploaded to the repository root.

## 1. Create the Supabase backend
1. Create a project at https://supabase.com/ and open **SQL Editor**.
2. Open `supabase/schema.sql` from this repository, copy all of it, paste into SQL Editor and run.
3. `config.js` is prefilled with the Supabase project URL and public publishable key supplied for this project. If you replace the backend, update these values.
4. Replace `hello@example.com` in `config.js` with the real store support email.
5. A public anon/publishable key is intended for browser use when Row Level Security is configured. **Never** put a `service_role` or secret key in `config.js`.

## 2. Create the admin login securely
1. In Supabase → **Authentication → Users**, create/invite your admin account. Do not add a public sign-up form.
2. Open the new user and copy its UUID.
3. In SQL Editor run this with your real UUID:
   ```sql
   insert into public.admin_users(user_id)
   values ('PASTE-ADMIN-USER-UUID-HERE');
   ```
4. Only this allowlisted user can manage products or read orders. If an account is not listed in `admin_users`, the admin page signs it out.
5. Test at `https://YOUR-SITE.netlify.app/admin/`. Use a unique password and keep it private.

## 3. Auto-extract the ZIP with GitHub Actions (Android-friendly)
GitHub does **not** automatically unpack ZIP uploads. The workflow does that after you add the workflow file to the repository.

1. Create a GitHub repository.
2. In the repository choose **Add file → Create new file**.
3. Enter the filename `.github/workflows/extract-zip.yml`.
4. Copy the complete contents of `.github/workflows/extract-zip.yml` from this project ZIP into the GitHub editor and commit it. (The workflow has to exist in GitHub before it can run.)
5. Upload `SADEE_PRO_STORE_GitHub_Netlify.zip` to the repository root using **Add file → Upload files** and commit the upload.
6. Open the **Actions** tab and check **Extract Store ZIP**. It will unpack the site files into the repository root and commit them. Keep the ZIP in the repository; the workflow ignores ZIP files when committing extracted files.

If you update the project later, upload the replacement ZIP to the repository root and commit it. Check Actions for the run result.

## 4. Deploy on Netlify
1. Open https://netlify.com/ and sign in.
2. Choose **Add new site → Import an existing project**, connect GitHub, and select the repository.
3. Leave the build command empty. Set the publish directory to `.` (repository root).
4. Deploy. After the GitHub Actions workflow commits the extracted `index.html`, Netlify should deploy the updated site automatically if continuous deployment is enabled.
5. Store URL: `/`. Admin URL: `/admin/`.

## 5. Add and manage products
- Sign in at `/admin/` and use **Add product**.
- Image URL is optional. Use a stable public HTTPS image URL that you have permission to use. The image URL must be publicly accessible.
- Use product descriptions and prices that accurately represent the item.
- Delete the sample “Starter Gaming Pack” and add your real products before advertising the store.

## 6. Important production notes
- Customer orders are requests, not confirmed purchases. Contact the customer to confirm stock, delivery and payment terms before collecting payment.
- The sample schema accepts public order inserts, but a public website can still receive spam. Add rate limiting/CAPTCHA or a server-side function before a high-volume launch.
- The public order form submits product name and price from the browser. For a production store, use a Supabase Edge Function or other server-side validation to fetch current product price/stock and create the order. Do not treat browser-submitted totals as authoritative.
- Consider restricting who can update/delete products and adding image uploads with a private admin-only storage policy if you need them.
- This project does not process card payments. Do not ask customers for passwords, OTPs or payment PINs.
