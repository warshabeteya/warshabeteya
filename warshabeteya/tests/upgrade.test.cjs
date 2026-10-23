const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../data.js'),Q=require('../quote.js'),V=require('../validation.js'),adapt=require('../promos.js'),Draft=require('../draft.js');
const item=(device='ps4',main='clean',extra={})=>({device,main,extras:[],modification:'',firmware:'',distro:'',mode:'',backup:false,model:'',notes:'',extraRequest:'',...extra});
const payload=(items)=>({items,customer:{name:'Test',phone:'٠١٠٠٠٠٠٠٠٠٠'},agree:true,moddingConsent:false,applyPromos:true,locale:'en'});
test('cleaning never adds diagnosis; standalone diagnosis is paid entirely at intake',()=>{
 for(const [device] of D.devices){const s=item(device,'clean'),o=Q.calculateOrder([s]);assert.equal(o.total,Q.service(device,'clean').price);assert.equal(Q.paymentSchedule(o).inspection,0);assert.equal(Q.paymentSchedule(o).intake,o.total/2);}
 const o=Q.calculateOrder([item('ps4','inspect')]);assert.deepEqual(Q.paymentSchedule(o),{inspection:150,intake:150,delivery:0});
 const mix=Q.calculateOrder([item('ds2','clean'),item('ps4','inspect')]);assert.deepEqual(Q.paymentSchedule(mix),{inspection:150,intake:200,delivery:50});
});
test('ordinary setup and recovery never require modification consent; explicit modification does',()=>{
 for(const [device] of D.devices)for(const id of ['setup','brick'])if(Q.service(device,id)){
  const s=item(device,id,{modification:'standard'});assert.equal(Q.calculate(s).requiresModding,false);assert.equal(Q.needsFirmware(s),false);assert.equal(Q.deviceIssue(s),null);
  s.modification='unsure';assert.equal(Q.calculate(s).requiresModding,false);
  s.modification='modified';assert.equal(Q.calculate(s).requiresModding,true);
  s.modification='';assert.equal(Q.deviceIssue(s).field,'modificationChoice');
 }
});
test('all catalogue services have a valid request and finite nonnegative total',()=>{
 for(const [device] of D.devices)for(const [main] of Q.availableServices(device,[],true)){
  const s=item(device,main,{modification:'standard',firmware:'unknown',distro:'mint',mode:'dual',backup:true});const p=payload([s]);p.moddingConsent=true;
  const r=V.validate(p,Q,D);assert.equal(r.ok,true,device+'/'+main+': '+r.error);assert.ok(Number.isFinite(r.order.total)&&r.order.total>=0);
 }
});
test('shared validator rejects incompatible, repeated and bundled extras',()=>{
 for(const s of [item('ps1','oclp'),item('ds4','clean',{extras:['clean']}),item('ps4','fullthermal',{extras:['thermal']}),item('ps4','inspect',{extras:['clean']}),item('pc-laptop','clean',{extras:['lx-printer']})])assert.equal(V.validate(payload([s]),Q,D).ok,false);
});
test('shared validator rejects missing consent, long data, bad types and excessive devices',()=>{
 for(const change of [{agree:false},{customer:{name:' ',phone:'01000000000'}},{items:Array(11).fill(item())},{items:[item('ps4','clean',{notes:'x'.repeat(1001)})]},{items:[item('ps4','clean',{extras:null})]},{items:[item('ps4','(jailbreak) goldhen',{firmware:'unknown'})]}])assert.equal(V.validate({...payload([item()]),...change},Q,D).ok,false);
});
test('draft retains canonical preferences across languages, excluding personal data and consent',()=>{
 const raw=Draft.encode([item('ps4','setup',{modification:'modified',firmware:'unknown',notes:'PRIVATE',model:'PRIVATE',backup:true})],true);
 assert.ok(!raw.includes('PRIVATE'));const r=Draft.decode(raw).items[0];assert.equal(r.modification,'modified');assert.equal(r.firmware,'unknown');assert.equal(r.backup,undefined);assert.equal(r.moddingConsent,undefined);
});
test('promotions are detached by default; malformed or expired campaigns cannot apply',()=>{
 const p={id:'test',active:true,type:'percent',services:['clean'],percentOff:25,startDate:'2026-10-01',endDate:'2026-10-31',title:{ar:'عرض',en:'Offer'},description:{ar:'خصم',en:'Discount'}};
 assert.deepEqual(adapt([p],{promotionsEnabled:false},D),[]);
 const promos=adapt([p],{promotionsEnabled:true},D,'en');assert.equal(promos[0].title,'Offer');
 const engine=Q.withPromos(promos);assert.equal(engine.calculateOrder([item()],true,new Date('2026-10-23T12:00:00Z')).total,187.5);assert.equal(engine.calculateOrder([item()],true,new Date('2026-11-01T12:00:00Z')).total,250);
 for(const change of [{percentOff:101},{services:['inspect']},{endDate:'2026-02-31'},{type:'unknown'},{type:'bundle',device:'ps1',services:['oclp'],price:50}])assert.deepEqual(adapt([{...p,...change}],{promotionsEnabled:true},D),[]);
});
test('multiple second-controller offers compete for the best single discount',()=>{
 const p={active:true,type:'second-controller',devices:['ds4'],services:['drift']};const q=Q.withPromos([{...p,id:'small',percentOff:10},{...p,id:'large',percentOff:20}]);const order=q.calculateOrder([item('ds4','drift'),item('ds4','drift')]);assert.equal(order.discount,44);assert.equal(order.offer.id,'large');
});
test('English and Arabic prices, payment rules and catalogue IDs stay identical',()=>{
 const E=require('../en/data.js'),EQ=require('../en/quote.js');
 for(const [device] of D.devices){assert.deepEqual(D.services[device].map(([id,,price])=>[id,price]),E.services[device].map(([id,,price])=>[id,price]));}
 const items=[item('ps4','inspect'),item('ds2','clean')];assert.deepEqual(Q.paymentSchedule(Q.calculateOrder(items)),EQ.paymentSchedule(EQ.calculateOrder(items)));
 const msg=EQ.orderMessage(items,{name:'Test',phone:'01000000000'},EQ.calculateOrder(items),'TEST');assert.doesNotMatch(msg,/[\u0621-\u064a]/);assert.match(msg,/Due at intake: 200 EGP/);
});
test('English supports Eastern Arabic phone digits and international prefixes',()=>{
 const q=require('../en/quote.js');for(const p of ['٠١٠٠٠٠٠٠٠٠٠','+201000000000','00201000000000','201000000000','01000000000'])assert.equal(q.validPhone(p),true);for(const p of ['01300000000','0100000000','abc'])assert.equal(q.validPhone(p),false);
});
