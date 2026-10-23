/* Seasonal campaigns: edit this file only, then enable promotions in site-config.js.
   Dates are inclusive in Cairo. Empty dates mean no start/end restriction.
   No sample offer is active. Keep IDs stable for reporting. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WarshaCampaigns=factory();})(globalThis,()=>[
  {
    id:'seasonal-cleaning-example', active:false,
    startDate:'', endDate:'', type:'percent', services:['clean'], percentOff:10,
    title:{ar:'عرض تنظيف موسمي',en:'Seasonal cleaning offer'},
    description:{ar:'خصم على شغل التنظيف فقط، بدون رسوم فحص.',en:'A discount on cleaning labour, with no inspection fee.'},
    note:{ar:'مثال غير مفعّل. عدّل النسبة والمواعيد قبل التشغيل.',en:'Inactive example. Set the discount and dates before enabling.'}
  }
]);
