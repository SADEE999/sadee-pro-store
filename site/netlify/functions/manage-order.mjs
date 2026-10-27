import crypto from 'node:crypto';
const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const key=()=>crypto.randomBytes(18).toString('hex').toUpperCase().match(/.{1,6}/g).join('-');
const headers=()=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'});
async function rest(path,options={}){return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}})}
export async function handler(event){
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,STORE_ADMIN_SECRET,RESEND_API_KEY,STORE_FROM_EMAIL}=process.env;
 if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!STORE_ADMIN_SECRET)return json(503,{error:'Admin order service is not configured.'});
 const supplied=Buffer.from(String(event.headers['x-admin-secret']||'')),expected=Buffer.from(STORE_ADMIN_SECRET);if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))return json(401,{error:'Admin authorization failed.'});
 let d;try{d=JSON.parse(event.body||'{}')}catch{return json(400,{error:'Invalid request'});}
 if(d.action==='list'){const r=await rest('store_orders?select=id,order_code,created_at,customer_name,customer_email,device,product_name,plan_name,amount,payment_reference,status,license_key&order=created_at.desc&limit=100');if(!r.ok)return json(500,{error:'Could not load orders. Run orders SQL setup.'});return json(200,{orders:await r.json()});}
 const id=String(d.id||''),status=String(d.status||'');if(!id||!['verified','rejected'].includes(status))return json(400,{error:'Invalid order action.'});
 const get=await rest(`store_orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);const rows=await get.json();const o=rows[0];if(!get.ok||!o)return json(404,{error:'Order not found.'});if(o.status!=='pending')return json(409,{error:'Only pending orders can be reviewed.'});
 const license=status==='verified'?key():null;const patch=await rest(`store_orders?id=eq.${encodeURIComponent(id)}&status=eq.pending`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status,license_key:license,verified_at:status==='verified'?new Date().toISOString():null})});const updatedRows=await patch.json();const updated=updatedRows[0];if(!patch.ok||!updated)return json(409,{error:'Order status changed; refresh and try again.'});
 let emailSent=false;if(status==='verified'&&RESEND_API_KEY&&STORE_FROM_EMAIL){try{const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:STORE_FROM_EMAIL,to:[updated.customer_email],subject:`Your SADEE PRO STORE license — ${updated.order_code}`,text:`Hello,\n\nYour payment has been verified.\nOrder: ${updated.order_code}\nProduct: ${updated.product_name}\nPlan: ${updated.plan_name}\nLicense key: ${updated.license_key}\n\nKeep this key private.\nSADEE PRO STORE`})});emailSent=res.ok;}catch{}}
 return json(200,{order:{order_code:updated.order_code,status:updated.status,license_key:updated.license_key,customer_email:updated.customer_email,product_name:updated.product_name,plan_name:updated.plan_name,amount:updated.amount},email_sent:emailSent});
}
