(() => {
  const cfg=window.STORE_CONFIG||{},$=s=>document.querySelector(s);
  const loginPanel=$("#login-panel"),dashboard=$("#dashboard"),loginForm=$("#login-form");
  let sb=null,adminUser=null,products=[];
  const ready=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes("YOUR_PROJECT")&&!cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  if(ready&&window.supabase)sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  const money=n=>`${cfg.CURRENCY||"LKR"} ${Number(n||0).toLocaleString("en-LK")}`;
  function note(sel,text,ok=false){const e=$(sel);e.textContent=text;e.className="form-message"+(ok?" success":"");}
  function show(isAdmin){loginPanel.hidden=isAdmin;dashboard.hidden=!isAdmin;}
  async function verifySession(){
    if(!sb){show(false);note("#login-message","Set your Supabase URL and publishable/anon key in ../config.js first.");return;}
    const {data:{session}}=await sb.auth.getSession();
    if(!session){show(false);return;}
    const {data,error}=await sb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
    if(error||!data){await sb.auth.signOut();show(false);note("#login-message","This account is not authorised as a store admin.");return;}
    adminUser=session.user;show(true);$("#admin-email").textContent=session.user.email||"Authenticated admin";await loadProducts();await loadOrders();
  }
  loginForm.addEventListener("submit",async e=>{e.preventDefault();if(!sb){note("#login-message","Configure Supabase first.");return;}const fd=new FormData(loginForm);const {error}=await sb.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});if(error){note("#login-message","Sign-in failed. Check your details and Supabase configuration.");return;}note("#login-message","");await verifySession();});
  $("#logout").addEventListener("click",async()=>{if(sb)await sb.auth.signOut();adminUser=null;show(false);});
  function empty(message){return `<div class="empty-state">${esc(message)}</div>`;}
  async function loadProducts(){
    const host=$("#admin-products");host.innerHTML=empty("Loading products…");
    const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
    if(error){host.innerHTML=empty("Could not load products. Check SQL setup and admin policies.");return;}
    products=data||[];host.innerHTML=products.length?products.map(p=>`<article class="admin-item"><div class="admin-item-main"><h3>${esc(p.name)} · ${money(p.price)}</h3><p>${esc(p.category||"Other")} · Stock: ${p.stock??0} · ${p.active?"Visible":"Hidden"}<br>${esc(p.description||"No description")}</p></div><div class="admin-item-actions"><button class="small-btn" data-edit="${p.id}">Edit</button><button class="small-btn danger" data-delete="${p.id}">Delete</button></div></article>`).join(""):empty("No products yet. Add your first product.");
    host.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
    host.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
  }
  function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const f=$("#product-form");f.hidden=false;f.elements.id.value=p.id;f.elements.name.value=p.name;f.elements.description.value=p.description||"";f.elements.price.value=p.price;f.elements.stock.value=p.stock??0;f.elements.category.value=p.category||"Gaming";f.elements.image_url.value=p.image_url||"";f.elements.active.checked=!!p.active;$("#product-form-title").textContent="Edit product";f.scrollIntoView({behavior:"smooth",block:"start"});}
  $("#new-product").onclick=()=>{const f=$("#product-form");f.reset();f.hidden=false;f.elements.id.value="";f.elements.stock.value="1";f.elements.active.checked=true;$("#product-form-title").textContent="Add product";note("#product-message","");f.scrollIntoView({behavior:"smooth",block:"start"});};
  $("#cancel-product").onclick=()=>{$("#product-form").hidden=true;};
  $("#product-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),id=String(fd.get("id")||"");const item={name:String(fd.get("name")).trim(),description:String(fd.get("description")||"").trim(),price:Number(fd.get("price")),stock:Number(fd.get("stock")),category:String(fd.get("category")),image_url:String(fd.get("image_url")||"").trim()||null,active:f.elements.active.checked};if(!item.name||!Number.isFinite(item.price)||item.price<0||!Number.isInteger(item.stock)||item.stock<0){note("#product-message","Check product name, price and stock.");return;}const {error}=id?await sb.from("products").update(item).eq("id",id):await sb.from("products").insert(item);if(error){note("#product-message","Could not save product. Check your admin permissions.");return;}note("#product-message","Product saved.",true);f.hidden=true;await loadProducts();});
  async function deleteProduct(id){if(!confirm("Delete this product? This cannot be undone."))return;const {error}=await sb.from("products").delete().eq("id",id);if(error){note("#dashboard-message","Could not delete product. It may be linked to an order.");return;}note("#dashboard-message","Product deleted.",true);await loadProducts();}
  async function loadOrders(){
    const host=$("#admin-orders");host.innerHTML=empty("Loading orders…");
    const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false});
    if(error){host.innerHTML=empty("Could not load orders. Check your admin policies.");return;}
    host.innerHTML=data&&data.length?data.map(o=>`<article class="admin-item"><div class="admin-item-main"><h3>${esc(o.product_name)} × ${o.quantity} · ${money(Number(o.unit_price)*Number(o.quantity))}</h3><p>${esc(o.customer_name)} · ${esc(o.phone)}<br>${esc(o.notes||"No delivery notes")}<br>${new Date(o.created_at).toLocaleString()}</p><div class="order-meta"><span class="pill ${esc(o.status)}">${esc(o.status)}</span><span class="pill">Order ${esc(o.id.slice(0,8))}</span></div></div><div class="admin-item-actions"><select class="status-select" data-status="${o.id}" aria-label="Update order status"><option value="pending" ${o.status==="pending"?"selected":""}>Pending</option><option value="confirmed" ${o.status==="confirmed"?"selected":""}>Confirmed</option><option value="completed" ${o.status==="completed"?"selected":""}>Completed</option><option value="cancelled" ${o.status==="cancelled"?"selected":""}>Cancelled</option></select></div></article>`).join(""):empty("No orders have arrived yet.");
    host.querySelectorAll("[data-status]").forEach(s=>s.onchange=async()=>{const {error}=await sb.from("orders").update({status:s.value}).eq("id",s.dataset.status);if(error){note("#dashboard-message","Could not update order status.");await loadOrders();}else note("#dashboard-message","Order status updated.",true);});
  }
  $("#refresh-orders").onclick=loadOrders;
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));$("#products-tab").hidden=b.dataset.tab!=="products";$("#orders-tab").hidden=b.dataset.tab!=="orders";});
  if(sb)sb.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){show(false);}else if(event==="SIGNED_IN"&&session){setTimeout(verifySession,0);}});
  verifySession();
})();