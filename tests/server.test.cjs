const {test}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('../server/server.cjs');
const item={device:'ps4',main:'clean',extras:[],modification:'',firmware:'',distro:'',mode:'',backup:false,model:'',notes:'',extraRequest:''};
const valid=()=>({items:[{...item}],customer:{name:'Test',phone:'01000000000'},agree:true,moddingConsent:false,applyPromos:true,locale:'en'});
test('server validates, recomputes, signs and rejects unsafe requests',async t=>{
 const origin='https://warshabeteya.github.io',s=createServer({secret:'test-only-secret-not-for-production-123456789',origin,publicUrl:'http://localhost',limit:100});await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>s.close(r)));const base='http://127.0.0.1:'+s.address().port;
 const post=(payload,custom={})=>fetch(base+'/quote',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...custom},body:JSON.stringify(payload)});
 await t.test('server ignores forged totals and returns a verified estimate',async()=>{const r=await post({...valid(),total:1,discount:9999});assert.equal(r.status,200);const out=await r.json();assert.equal(out.total,250);assert.match(out.message,/Due at intake: 125 EGP/);const token=new URL(out.message.split('Verify estimate: ')[1]).searchParams.get('token');const check=await fetch(base+'/verify?token='+encodeURIComponent(token));assert.equal(check.status,200);assert.match(await check.text(),/250 EGP/);const forged=token.slice(0,-4)+'AAAA';assert.equal((await fetch(base+'/verify?token='+encodeURIComponent(forged))).status,400);});
 await t.test('missing modification consent is rejected',async()=>{const p=valid();p.items[0]={...item,main:'(jailbreak) goldhen',firmware:'unknown'};assert.equal((await post(p)).status,422);});
 await t.test('incompatible extras and invalid phones are rejected',async()=>{const p=valid();p.items[0].extras=['oclp'];assert.equal((await post(p)).status,422);const b=valid();b.customer.phone='01300000000';assert.equal((await post(b)).status,422);});
 await t.test('foreign origins and unsupported media types are rejected',async()=>{assert.equal((await post(valid(),{Origin:'https://example.com'})).status,403);assert.equal((await post(valid(),{'Content-Type':'text/plain'})).status,415);});
 await t.test('oversized requests are rejected',async()=>{const p=valid();p.items[0].notes='x'.repeat(40000);assert.equal((await post(p)).status,413);});
 await t.test('Arabic responses use Arabic messages',async()=>{const p=valid();p.locale='ar';const out=await (await post(p)).json();assert.equal(out.ok,true);assert.match(out.message,/المطلوب عند الاستلام/);});
});
