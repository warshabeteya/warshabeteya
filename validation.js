/* Shared strict validator: browser and independently hosted Node service.
   The server never accepts client-supplied totals or prices. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WarshaValidation=factory();})(globalThis,()=>{
 'use strict';
 const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const text=(v,max,required=false)=>typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0)&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
 function validate(payload,Q,D){
  const fail=error=>({ok:false,error});
  if(!plain(payload)||!Array.isArray(payload.items)||!payload.items.length||payload.items.length>10)return fail('اختار من جهاز واحد إلى 10 أجهزة.');
  if(!plain(payload.customer)||!text(payload.customer.name,100,true)||!text(payload.customer.phone,30,true)||!Q.validPhone(payload.customer.phone))return fail('راجع الاسم ورقم الموبايل المصري.');
  if(payload.agree!==true||typeof payload.applyPromos!=='boolean'||typeof payload.moddingConsent!=='boolean')return fail('راجع الموافقات المطلوبة.');
  for(const item of payload.items){
   if(!plain(item)||typeof item.device!=='string'||typeof item.main!=='string'||!Array.isArray(item.extras)||item.extras.length>15||!['','standard','modified','unsure'].includes(item.modification||''))return fail('اختيارات الجهاز غير صحيحة.');
   for(const [key,max] of Object.entries({model:100,notes:1000,extraRequest:1000,firmware:30,distro:30,mode:20}))if(!text(item[key]??'',max))return fail('راجع طول ونوع البيانات المدخلة.');
   if(typeof item.backup!=='boolean')return fail('راجع تأكيد النسخة الاحتياطية.');
   if(item.firmware&&!/^(?:\d{1,2}\.\d{2}|unknown|other)$/.test(item.firmware))return fail('اختار إصدار النظام من القائمة.');
   if(!Q.availableServices(item.device,[],true).some(s=>s[0]===item.main))return fail('الخدمة غير متاحة للجهاز المختار.');
   const selected=[item.main];
   for(const extra of item.extras){
    if(typeof extra!=='string'||item.main==='inspect'||!Q.availableServices(item.device,selected,false,item.main==='linux').some(s=>s[0]===extra))return fail('في خدمة مكررة أو غير متوافقة مع الجهاز.');
    selected.push(extra);
   }
   const issue=Q.deviceIssue(item);if(issue)return fail(issue.text);
  }
  const order=Q.calculateOrder(payload.items,payload.applyPromos);
  if(!Number.isFinite(order.total)||order.total<0||order.pending)return fail('تعذر حساب الطلب. راجع الاختيارات.');
  if(order.requiresModding&&payload.moddingConsent!==true)return fail('الموافقة على خدمات التعديل مطلوبة.');
  return {ok:true,order};
 }
 return {validate};
});
