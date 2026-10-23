/* Optional independent validation service. GitHub Pages cannot execute this file.
   No request database, no payment processing, no booking confirmation. */
'use strict';
const http=require('node:http'),crypto=require('node:crypto');
const config=require('../site-config.js'),campaigns=require('../campaigns.js'),adapt=require('../promos.js');
const modules={ar:{D:require('../data.js'),Q:require('../quote.js'),V:require('../validation.js')},en:{D:require('../en/data.js'),Q:require('../en/quote.js'),V:require('../en/validation.js')}};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createServer({secret,origin='https://warshabeteya.github.io',publicUrl,limit=30,trustProxy=false}={}){
 if(typeof secret!=='string'||secret.length<32)throw new Error('QUOTE_SECRET must be at least 32 characters. Keep it server-side only.');
 if(!publicUrl||!/^https?:\/\//.test(publicUrl))throw new Error('Set PUBLIC_URL to this service URL. Use HTTPS in production.');
 const rates=new Map();
 function sign(data){const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url');}
 function verify(token){
  if(typeof token!=='string'||token.length>16000)return null;const [body,sig,...extra]=token.split('.');if(!body||!sig||extra.length)return null;
  const expected=crypto.createHmac('sha256',secret).update(body).digest(),actual=Buffer.from(sig,'base64url');
  if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
  try{const data=JSON.parse(Buffer.from(body,'base64url'));return data.expires>Date.now()?data:null;}catch{return null;}
 }
 return http.createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"};
  if(req.headers.origin===origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Vary':'Origin'});
  const send=(status,data)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/health')return send(200,{ok:true});
  if(req.method==='GET'&&url.pathname==='/verify'){
   const data=verify(url.searchParams.get('token'));if(!data)return send(400,{ok:false,error:'Invalid or expired quote verification.'});
   const en=data.locale==='en',title=en?'Verified estimate':'تقدير سعر تم التحقق منه';
   res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});
   return res.end(`<!doctype html><html lang="${en?'en':'ar'}" dir="${en?'ltr':'rtl'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:18px/1.8 system-ui,sans-serif;margin:40px auto;padding:0 20px;max-width:700px;background:#faf9f5;color:#193b3a}li{margin-block:12px}strong{font-size:24px}</style><main><h1>${title}</h1><p>${escape(data.reference)}</p><ul>${data.devices.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p><strong>${data.total} EGP</strong></p><p>${en?'At intake':'عند الاستلام'}: ${data.intake} EGP · ${en?'On return':'عند التسليم'}: ${data.delivery} EGP</p><p>${en?'This verifies the calculated estimate, not a booking, payment, identity or device compatibility. Parts are separate. Final scope and price are agreed with the workshop.':'هذا التحقق يخص حساب السعر فقط، وليس حجزًا أو دفعًا أو تحققًا من الهوية أو توافق الجهاز. قطع الغيار منفصلة. السعر ونطاق الشغل النهائي بالاتفاق مع الورشة.'}</p></main></html>`);
  }
  if(url.pathname!=='/quote')return send(404,{ok:false,error:'Not found'});
  if(req.headers.origin!==origin)return send(403,{ok:false,error:'Origin not allowed'});
  if(req.method==='OPTIONS'){res.writeHead(204,{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});return res.end();}
  if(req.method!=='POST')return send(405,{ok:false,error:'POST required'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{ok:false,error:'JSON required'});
  const ip=trustProxy?(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
  const now=Date.now();for(const [key,v] of rates)if(now-v.start>60000)rates.delete(key);
  const rate=rates.get(ip)||{start:now,count:0};rate.count++;rates.set(ip,rate);
  if(rate.count>limit){res.setHeader('Retry-After','60');return send(429,{ok:false,error:'Too many requests; try again shortly.'});}
  if(Number(req.headers['content-length']||0)>32768)return send(413,{ok:false,error:'Request too large'});
  try{
   let size=0,chunks=[];
   for await(const chunk of req){size+=chunk.length;if(size>32768){send(413,{ok:false,error:'Request too large'});return;}chunks.push(chunk);}
   let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{ok:false,error:'Invalid JSON'});}
   const locale=payload?.locale==='en'?'en':'ar', {D,Q:base,V}=modules[locale];
   const Q=base.withPromos(adapt(campaigns,config,D,locale)),result=V.validate(payload,Q,D);
   if(!result.ok)return send(422,result);
   // Recompute from the server catalogue; client total/discount/reference are ignored.
   const order=result.order,payment=Q.paymentSchedule(order),reference='WB-'+Q.cairoDate().replaceAll('-','')+'-'+crypto.randomBytes(6).toString('hex').toUpperCase();
   const proof={reference,locale,total:order.total,intake:payment.intake,delivery:payment.delivery,expires:Date.now()+24*60*60*1000,
    devices:order.entries.map(e=>D.devices.find(d=>d[0]===e.state.device)[1]+': '+e.quote.lines.map(l=>l.name).join(' + '))};
   const verificationUrl=publicUrl.replace(/\/$/,'')+'/verify?token='+sign(proof);
   const message=Q.orderMessage(payload.items,payload.customer,order,reference)+'\n'+(locale==='en'?'Verify estimate: ':'التحقق من السعر: ')+verificationUrl;
   return send(200,{ok:true,total:order.total,reference,message});
  }catch(error){if(!res.headersSent)send(400,{ok:false,error:'Could not validate the request.'});}
 });
}
if(require.main===module){
 const server=createServer({secret:process.env.QUOTE_SECRET,origin:process.env.ALLOWED_ORIGIN||'https://warshabeteya.github.io',publicUrl:process.env.PUBLIC_URL,trustProxy:process.env.TRUST_PROXY==='1'});
 server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log('Quote validation service listening. Request bodies are not logged.'));
}
module.exports={createServer};
