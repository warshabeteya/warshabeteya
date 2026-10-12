const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const Q = require('../quote.js');
const Draft = require('../draft.js');
const duringOffer = new Date('2026-10-12T10:00:00Z');
const afterOffer = new Date('2026-10-14T10:00:00Z');
const device = (id,main,extras=[]) => ({device:id,main,extras,firmware:'',distro:'',mode:'',backup:false});

test('PS4 physical maintenance and inspection do not need firmware',()=>{
 for (const main of ['clean','thermal','pads','fullthermal','disc','storage','inspect']) {
  const item=device('ps4',main);
  assert.equal(Q.needsFirmware(item),false,main);
  assert.equal(Q.deviceIssue(item),null,main);
 }
});
test('PS4 software compatibility checks apply to main and extra services',()=>{
 for (const main of ['(jailbreak) goldhen','setup','brick']) {
  for(const item of [device('ps4',main),device('ps4','clean',[main])]) {
   assert.equal(Q.deviceIssue(item).field,'firmware');
   item.firmware='لا أعرف'; assert.equal(Q.deviceIssue(item),null);
  }
 }
 assert.equal(Q.needsFirmware(device('ps3','hen')),false);
});
test('family order preserves existing price and best-offer rules',()=>{
 const order=Q.calculateOrder([device('ps4','clean'),device('ds4','drift')],true,duringOffer);
 assert.equal(order.total,407.5); assert.equal(order.discount,62.5);
 assert.equal(order.entries[1].quote.total,220);
 assert.equal(Q.calculateOrder([device('ps4','clean'),device('ds4','drift')],false,duringOffer).total,470);
});
test('restored selections recalculate prices after offer expiry',()=>{
 const raw=Draft.encode([device('ps4','clean')],true,duringOffer.getTime());
 const restored=Draft.decode(raw,afterOffer.getTime());
 assert.equal(Q.calculateOrder(restored.items,restored.applyPromos,duringOffer).total,187.5);
 assert.equal(Q.calculateOrder(restored.items,restored.applyPromos,afterOffer).total,250);
});
test('draft excludes all free text, contact details and consent',()=>{
 const raw=Draft.encode([{...device('pc-laptop','linux'),distro:'mint',mode:'dual',backup:true,name:'PRIVATE',phone:'PRIVATE',model:'PRIVATE',notes:'PRIVATE',extraRequest:'PRIVATE',agree:true}],true,100);
 assert.equal(raw.includes('PRIVATE'),false);
 const restored=Draft.decode(raw,101).items[0];
 assert.equal(restored.backup,undefined); assert.equal(restored.agree,undefined);
 assert.equal(Q.deviceIssue(restored).field,'linuxBackup');
});
test('draft filters unsupported services and duplicate bundle components',()=>{
 const raw=Draft.encode([{...device('mac-intel','fullthermal',['thermal','clean','battery','battery','unknown']),category:'wrong'},{...device('mac-silicon','battery')},null],true,100);
 const restored=Draft.decode(raw,101);
 assert.deepEqual(restored.items[0].extras,['battery']); assert.equal(restored.items[0].category,'mac');
 assert.equal(restored.items[1].main,'');
 assert.equal(Q.calculateOrder([restored.items[0]],false).total,750);
});
test('corrupt, stale and future-dated drafts never restore',()=>{
 for(const raw of ['{','null','{}',JSON.stringify({version:99,savedAt:100,items:[]})])assert.equal(Draft.decode(raw,101),null);
 const raw=Draft.encode([device('ps4','clean')],true,100);
 assert.equal(Draft.decode(raw,100+Draft.maxAge+1),null);
 assert.equal(Draft.decode(raw,99),null);
});
test('message is complete for cleaning without an empty firmware line',()=>{
 const items=[device('ps4','clean')], order=Q.calculateOrder(items,true,duringOffer);
 const text=Q.orderMessage(items,{name:'اختبار',phone:'٠١٠٠٠٠٠٠٠٠٠'},order,'TEST');
 assert.match(text,/187.5/); assert.match(text,/01000000000/); assert.doesNotMatch(text,/إصدار النظام/);
 assert.throws(()=>Q.orderMessage([device('ps4','brick')],{name:'اختبار',phone:'01000000000'},Q.calculateOrder([device('ps4','brick')]),'TEST'));
});
test('all catalogue devices have an inquiry path and limited Mac coverage is explicit',()=>{
 for(const [id] of D.devices)assert.ok(D.inquirySymptoms(id).length);
 assert.match(D.deviceGuidance('mac-silicon'),/فقط/);
 assert.deepEqual(D.services['mac-silicon'].map(s=>s[0]),['clean','inspect']);
});
test('all available main services produce finite nonnegative quotes',()=>{
 for(const [id] of D.devices)for(const [main] of Q.availableServices(id,[],true)) {
  const result=Q.calculateOrder([device(id,main)],true,duringOffer);
  assert.ok(Number.isFinite(result.total) && result.total>=0,`${id} ${main}`);
 }
});
