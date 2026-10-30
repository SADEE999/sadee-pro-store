const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body)
});

function getConfig() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  return { url, key };
}

async function supabaseRequest(url, key, path, options = {}) {
  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function responseError(response) {
  let body = "";
  try { body = await response.text(); } catch {}
  // Log the full Supabase response server-side, but never expose credentials.
  console.error("Supabase create-order request failed", {
    status: response.status,
    statusText: response.statusText,
    body: body.slice(0, 1500)
  });
  let parsed;
  try { parsed = JSON.parse(body); } catch {}
  return {
    code: parsed?.code || null,
    message: parsed?.message || parsed?.error || body.slice(0, 300) || response.statusText
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const { url, key } = getConfig();
  if (!url || !key) {
    console.error("create-order configuration missing", {
      hasSupabaseUrl: Boolean(url),
      hasServiceKey: Boolean(key)
    });
    return json(503, {
      error: "Order service is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this Netlify site, then redeploy."
    });
  }

  let d;
  try { d = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid request body." }); }

  const name = String(d.customer_name || "").trim().slice(0, 80);
  const email = String(d.email || "").trim().toLowerCase().slice(0, 254);
  const device = String(d.device || "").trim().slice(0, 100);
  const reference = String(d.payment_reference || "").trim().slice(0, 100);
  const productId = String(d.product_id || "");
  const promoCode = String(d.promo_code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !reference || !/^[0-9a-f-]{36}$/i.test(productId)) {
    return json(400, { error: "Name, valid email, product and eZ Cash transaction reference are required." });
  }

  let productResponse;
  try {
    productResponse = await supabaseRequest(
      url, key,
      `products?select=id,name,plans,active,stock&id=eq.${encodeURIComponent(productId)}&active=eq.true&limit=1`
    );
  } catch (err) {
    console.error("Supabase product availability network error", err?.message || err);
    return json(502, { error: "Could not connect to Supabase to check product availability. Check the Netlify SUPABASE_URL value." });
  }

  if (!productResponse.ok) {
    const detail = await responseError(productResponse);
    const message = detail.code === "PGRST205" || detail.code === "42P01"
      ? "Supabase products table is missing. Run supabase/schema.sql in the Supabase SQL Editor."
      : detail.code === "PGRST301" || productResponse.status === 401 || productResponse.status === 403
        ? "Supabase rejected the server key. Check SUPABASE_SERVICE_ROLE_KEY in this Netlify site, then redeploy."
        : `Supabase could not check product availability (HTTP ${productResponse.status}). Check the create-order Function logs for the Supabase error.`;
    return json(502, { error: message });
  }

  let productRows;
  try { productRows = await productResponse.json(); }
  catch {
    console.error("Supabase product response was not JSON");
    return json(502, { error: "Supabase returned an invalid product response. Check the create-order Function logs." });
  }

  const product = productRows[0];
  if (!product || product.active !== true) return json(400, { error: "This product is not available." });
  if (Number(product.stock || 0) <= 0) return json(400, { error: "This product is out of stock. Contact the store." });

  let plans = [];
  try { plans = Array.isArray(product.plans) ? product.plans : JSON.parse(product.plans || "[]"); } catch {}
  if (!plans.length) {
    plans = [
      { name: "Lifetime", duration: "Lifetime access", price: 4500 },
      { name: "1 Month", duration: "30 days", price: 2200 },
      { name: "7 Days", duration: "7 days", price: 1000 },
      { name: "1 Day Trial", duration: "24 hours", price: 300 },
      { name: "3 Days", duration: "3 days", price: 600 },
      { name: "15 Days", duration: "15 days", price: 1500 },
      { name: "3 Months", duration: "90 days", price: 3500 },
      { name: "6 Months", duration: "180 days", price: 4000 }
    ];
  }

  const planIndex = Number(d.plan_index);
  const plan = Number.isInteger(planIndex) ? plans[planIndex] : null;
  if (!plan || !plan.name || !Number.isFinite(Number(plan.price)) || Number(plan.price) < 0) {
    return json(400, { error: "Selected plan is invalid. Close the product and choose a plan again." });
  }

  let discountPercent = 0;
  if (promoCode) {
    let promoResponse;
    try {
      promoResponse = await supabaseRequest(
        url, key,
        `promo_codes?select=code,discount_percent,active,starts_at,expires_at,max_uses,uses&code=eq.${encodeURIComponent(promoCode)}&limit=1`
      );
    } catch {
      return json(502, { error: "Could not connect to Supabase to validate the promo code." });
    }
    if (!promoResponse.ok) {
      const detail = await responseError(promoResponse);
      return json(502, {
        error: detail.code === "PGRST205" || detail.code === "42P01"
          ? "Promo-code table is missing. Run supabase/orders-schema.sql in Supabase SQL Editor."
          : "Could not validate promo code. Check the create-order Function logs."
      });
    }
    const promos = await promoResponse.json();
    const promo = promos[0];
    const now = Date.now();
    if (!promo || !promo.active ||
      (promo.starts_at && new Date(promo.starts_at).getTime() > now) ||
      (promo.expires_at && new Date(promo.expires_at).getTime() < now) ||
      (promo.max_uses !== null && promo.max_uses !== undefined && Number(promo.uses) >= Number(promo.max_uses))) {
      return json(400, { error: "Promo code is invalid, expired or fully used." });
    }
    discountPercent = Number(promo.discount_percent) || 0;
  }

  const originalAmount = Number(plan.price);
  const discountAmount = Math.round(originalAmount * discountPercent) / 100;
  const finalAmount = Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100);

  let orderResponse;
  try {
    orderResponse = await supabaseRequest(url, key, "store_orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        customer_name: name,
        customer_email: email,
        device,
        product_id: product.id,
        product_name: product.name,
        plan_name: String(plan.name).slice(0, 100),
        amount: finalAmount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        promo_code: promoCode || null,
        payment_method: "eZ Cash",
        payment_reference: reference,
        status: "pending"
      })
    });
  } catch (err) {
    console.error("Supabase order insert network error", err?.message || err);
    return json(502, { error: "Could not connect to Supabase to save the order. Check Netlify Function logs." });
  }

  if (!orderResponse.ok) {
    const detail = await responseError(orderResponse);
    const missingTable = detail.code === "PGRST205" || detail.code === "42P01";
    return json(502, {
      error: missingTable
        ? "Orders database is not set up. Run supabase/orders-schema.sql in the Supabase SQL Editor."
        : detail.code === "23505"
          ? "This eZ Cash transaction reference has already been used. Check the reference and try again."
          : "Could not save the order. Check that supabase/orders-schema.sql has been run and review the create-order Function logs."
    });
  }

  const [order] = await orderResponse.json();
  if (promoCode) {
    try {
      await supabaseRequest(url, key, "rpc/increment_promo_use", {
        method: "POST",
        body: JSON.stringify({ p_code: promoCode })
      });
    } catch (err) {
      console.error("Promo use counter update failed", err?.message || err);
    }
  }

  return json(200, {
    order: {
      order_code: order.order_code,
      status: order.status,
      amount: order.amount,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount,
      product_name: order.product_name,
      plan_name: order.plan_name
    }
  });
}
