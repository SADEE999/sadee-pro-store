(() => {
  const cfg = window.STORE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const grid = $("#product-grid"), modal = $("#order-modal"), form = $("#order-form");
  let client = null, products = [], selected = null, category = "All";
  $("#year").textContent = new Date().getFullYear();
  $("#contact-link").href = `mailto:${cfg.SUPPORT_EMAIL || "hello@example.com"}`;
  $("#contact-link").textContent = "Contact support ↗";
  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("YOUR_PROJECT") && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  if (ready && window.supabase) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const money = n => `${cfg.CURRENCY || "LKR"} ${Number(n || 0).toLocaleString("en-LK")}`;
  function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function render(){
    const q = ($("#search").value || "").trim().toLowerCase();
    const visible = products.filter(p => (category==="All" || p.category===category) &&
      `${p.name} ${p.description||""} ${p.category||""}`.toLowerCase().includes(q));
    grid.innerHTML = visible.length ? visible.map(p => `<article class="product-card">
      <div class="product-image">${p.image_url ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.remove()">` : `<span class="product-placeholder">SP<span style="font-size:15px">+</span></span>`}<span class="product-tag">${escapeHTML(p.category||"Featured")}</span></div>
      <div class="product-info"><span class="product-category">${escapeHTML(p.category||"Product")}</span><h3>${escapeHTML(p.name)}</h3><p class="product-description">${escapeHTML(p.description||"A selected item from SADEE PRO STORE.")}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="order-btn" data-order="${escapeHTML(p.id)}" ${p.stock<=0?"disabled":""}>${p.stock<=0?"Out of stock":"Order now ↗"}</button></div></div></article>`).join("") :
      `<div class="empty-state">${ready ? "No products found. Check back soon." : "Connect Supabase to publish your live products. See README.md for setup."}</div>`;
    grid.querySelectorAll("[data-order]").forEach(b=>b.addEventListener("click",()=>openOrder(b.dataset.order)));
  }
  async function load(){
    if(!client){products=[];render();return;}
    const {data,error}=await client.from("products").select("id,name,description,price,category,image_url,stock,active").eq("active",true).order("created_at",{ascending:false});
    if(error){grid.innerHTML='<div class="empty-state">Could not load products. Check your Supabase setup and table policies.</div>';return;}
    products=(data||[]).map(p=>({...p,stock:p.stock ?? 1}));render();
  }
  function openOrder(id){
    selected=products.find(p=>p.id===id);if(!selected)return;
    $("#selected-product").innerHTML=`<b>${escapeHTML(selected.name)}</b><span>${money(selected.price)}</span>`;
    $("#order-message").textContent="";$("#order-message").className="form-message";form.reset();form.quantity.value="1";modal.hidden=false;document.body.style.overflow="hidden";
  }
  function closeOrder(){modal.hidden=true;document.body.style.overflow="";}
  $("#close-modal").addEventListener("click",closeOrder);
  modal.addEventListener("click",e=>{if(e.target===modal)closeOrder();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOrder();});
  $("#search").addEventListener("input",render);
  $("#filters").querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{category=b.dataset.category;$("#filters").querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();}));
  form.addEventListener("submit",async e=>{
    e.preventDefault();const msg=$("#order-message"),btn=form.querySelector("button[type=submit]");
    if(!client){msg.textContent="Store backend is not connected yet. Please contact the store owner.";return;}
    const fd=new FormData(form),qty=Math.max(1,Math.min(20,Number(fd.get("quantity")||1)));
    const order={product_id:selected.id,product_name:selected.name,unit_price:Number(selected.price),quantity:qty,customer_name:String(fd.get("customer_name")).trim(),phone:String(fd.get("phone")).trim(),notes:String(fd.get("notes")||"").trim(),status:"pending"};
    if(!order.customer_name||!order.phone){msg.textContent="Please enter your name and phone number.";return;}
    btn.disabled=true;btn.textContent="Submitting…";msg.textContent="";
    const {error}=await client.from("orders").insert(order);
    btn.disabled=false;btn.textContent="Submit order request ↗";
    if(error){msg.textContent="Order could not be submitted. Please try again or contact support.";return;}
    msg.textContent="Order request received! The store team will contact you to confirm.";msg.className="form-message success";form.reset();form.quantity.value="1";
  });
  load();
})();