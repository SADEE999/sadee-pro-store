# SADEE PRO STORE — GitHub Pages-ready package

## Fix the GitHub Pages 404
1. Extract this ZIP on your phone/computer.
2. Upload the *contents* of this ZIP to the repository root `SADEE999/sadee-pro-store` (not the ZIP as a single file, and not inside an extra folder).
3. Confirm `index.html` is visible beside `styles.css` and `config.js` in the repository root.
4. Keep Settings → Pages set to `Deploy from a branch`, branch `main`, folder `/ (root)`.
5. Open Actions and wait for the Pages deployment to complete, then retry `https://sadee999.github.io/sadee-pro-store/`.

## Important backend limitation
GitHub Pages hosts static HTML/CSS/JS only. Netlify Functions in `netlify/functions/` do not run on GitHub Pages, so checkout/order creation, promo validation, admin approval, and license delivery that depend on those functions will not work from this URL. Use the Netlify deployment for the full store backend, with the required environment variables configured in Netlify. Never publish service-role keys or admin secrets.
