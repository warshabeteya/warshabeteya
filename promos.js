/* Optional campaign adapter. Missing/disabled/invalid campaigns cannot break booking. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory;
 else root.WarshaPromos=factory(root.WarshaCampaigns,root.WarshaConfig,root.WarshaData,document.documentElement.lang);
})(globalThis,function(campaigns,config,D,locale){
 'use strict';
 if(!config?.promotionsEnabled||!Array.isArray(campaigns))return [];
 const language=locale==='en'?'en':'ar', ids=new Set();
 const text=v=>typeof v==='string'?v:(v?.[language]||v?.ar||'');
 const dateOK=v=>!v || (typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v+'T12:00:00Z')) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
 return campaigns.flatMap(p=>{
  if(!p||p.active!==true||typeof p.id!=='string'||!p.id||ids.has(p.id)||!dateOK(p.startDate)||!dateOK(p.endDate)|| (p.startDate&&p.endDate&&p.startDate>p.endDate)) return [];
  if(!['percent','bundle','second-controller'].includes(p.type)||!Array.isArray(p.services)||!p.services.length||new Set(p.services).size!==p.services.length)return [];
  // Diagnosis retains its clear, fixed price; offers apply to service labour.
  if(p.services.includes('inspect'))return [];
  if(p.device&&!D.devices.some(d=>d[0]===p.device))return [];
  const targets=p.type==='second-controller'?p.devices:p.device?[p.device]:D.devices.map(d=>d[0]);
  if(!Array.isArray(targets)||!targets.length||targets.some(id=>!D.services[id]))return [];
  if(p.type==='second-controller'&&targets.some(id=>!['ds2','ds3','ds4'].includes(id)))return [];
  if(!targets.some(id=>p.services.every(s=>D.services[id].some(row=>row[0]===s))))return [];
  if(p.type==='bundle'&&(!p.device||!Number.isFinite(p.price)||p.price<0||p.services.some(id=>D.LINUX_ADDON_IDS.has(id)||id==='linux')))return [];
  if(p.type==='bundle'&&p.services.some((id,i)=>p.services.slice(i+1).some(other=>id==='fullthermal'&&['clean','thermal','pads'].includes(other)||other==='fullthermal'&&['clean','thermal','pads'].includes(id))))return [];
  if(p.type!=='bundle'&&(!Number.isFinite(p.percentOff)||p.percentOff<=0||p.percentOff>100))return [];
  if(!text(p.title)||!text(p.description))return [];
  ids.add(p.id);return [{...p,title:text(p.title),description:text(p.description),note:text(p.note)}];
 });
});
