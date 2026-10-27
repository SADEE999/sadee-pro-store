const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const headers=()=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'});
async function rest(path,options={}){return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}})}
export async function handler(event){
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return json(503,{error:'Order service is not configured yet. Store owner must add server environment variables.'});
 let d;try{d=JSON.parse(event.body||'{}')}catch{return json(400,{error:'Invalid request'});}
 const name=String(d.customer_name||'').trim().slice(0,80),email=String(d.email||'').trim().toLowerCase().slice(0,254),device=String(d.device||'').trim().slice(0,100),reference=String(d.payment_reference||'').trim().slice(0,100),productId=String(d.product_id||'');
 if(!name||!/^\S+@\S+\.\S+$/.test(email)||!reference||!productId)return json(400,{error:'Name, valid email, product and eZ Cash transaction reference are required.'});
 const pr=await rest(`products?select=id,name,plans,active&id=eq.${encodeURIComponent(productId)}&active=eq.true&limit=1`);if(!pr.ok)return json(500,{error:'Could not check product availability.'});const products=await pr.json(),p=products[0];if(!p)return json(400,{error:'Product is not available.'});
 let plans=[];try{plans=Array.isArray(p.plans)?p.plans:JSON.parse(p.plans||'[]')}catch{}
 if(!plans.length)plans=[{name:'Lifetime',duration:'Lifetime access',price:4500},{name:'1 Month',duration:'30 days',price:2200},{name:'7 Days',duration:'7 days',price:1000},{name:'1 Day Trial',duration:'24 hours',price:300},{name:'3 Days',duration:'3 days',price:600},{name:'15 Days',duration:'15 days',price:1500},{name:'3 Months',duration:'90 days',price:3500},{name:'6 Months',duration:'180 days',price:4000}];
 const plan=plans[Number(d.plan_index)];if(!plan||!plan.name||!Number.isFinite(Number(plan.price))||Number(plan.price)<0)return json(400,{error:'Selected plan is invalid.'});
 const response=await rest('store_orders',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({customer_name:name,customer_email:email,device,product_id:p.id,product_name:p.name,plan_name:String(plan.name).slice(0,100),amount:Number(plan.price),payment_method:'eZ Cash',payment_reference:reference,status:'pending'})});
 if(!response.ok)return json(500,{error:'Could not create order. Run the orders SQL setup and contact store support if this continues.'});const [order]=await response.json();return json(200,{order:{order_code:order.order_code,status:order.status,amount:order.amount,product_name:order.product_name,plan_name:order.plan_name}});
}
