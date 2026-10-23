(() => {
'use strict';
const $ = id => document.getElementById(id), D = window.WarshaData;
D.devices.forEach(([id,name]) => $('inqDevice').add(new Option(name,id)));
$('inqDevice').add(new Option('جهاز تاني / مش متأكد','other'));
function invalidate(){ $('inqResult').hidden=true; $('inqSend').removeAttribute('href'); $('inqCopyStatus').textContent=''; }
function openInquiry() {
 $('quickInquiry').open=true;
 $('quickInquiry').scrollIntoView({block:'start',behavior:'auto'});
 $('inqDevice').focus({preventScroll:true});
}
document.querySelectorAll('a[href="#quickInquiry"]').forEach(link=>link.addEventListener('click',()=>openInquiry()));
if(location.hash==='#quickInquiry')openInquiry();
window.addEventListener('hashchange',()=>{if(location.hash==='#quickInquiry')openInquiry();});
$('inqDevice').addEventListener('change',()=>{
 const device=$('inqDevice').value, rows=device ? D.inquirySymptoms(device) : [];
 $('inqSymptom').replaceChildren(new Option('اختار المشكلة',''));
 rows.forEach(x=>$('inqSymptom').add(new Option(x,x)));
 $('inqSymptom').disabled=!rows.length;
 $('inqGuidance').textContent=D.deviceGuidance(device)||(device==='other'?'الجهاز مش ضمن قائمة الخدمات المسعّرة. نأكد توفر خدمته على واتساب قبل أي اتفاق.':'اختار المشكلة الأقرب، ولو مش موجودة اختار مشكلة تانية.');
 invalidate();
});
$('inqSymptom').addEventListener('change',()=>{
 const s=$('inqSymptom').value;
 $('inqGuidance').textContent = D.deviceGuidance($('inqDevice').value) || (['مش بيشتغل','مشكلة تانية','محتاج أتأكد إن الخدمة متاحة','محتاج أتأكد إن خدمة تانية متاحة'].includes(s)
 ? 'هنراجع الأعراض معاك الأول ونأكد إذا كنا نقدر نتعامل مع الحالة. وصف المشكلة لوحده مش كفاية لتأكيد السبب أو إمكانية الإصلاح.'
 : 'محتاجين نعرف الموديل والأعراض عشان نأكد الخدمة المناسبة وتوافر أي قطع مطلوبة.');
});
$('inquiryForm').addEventListener('input',event=>{invalidate();event.target.removeAttribute('aria-invalid');$('inqError').hidden=true;});
$('inquiryForm').addEventListener('change',invalidate);
$('inquiryForm').addEventListener('submit',event=>{
 event.preventDefault();
 const invalid=['inqDevice','inqSymptom'].find(id=>!$(id).value);
 if(invalid){$(invalid).setAttribute('aria-invalid','true');$('inqError').textContent=invalid==='inqDevice'?'اختار الجهاز أو «جهاز تاني / مش متأكد».':'اختار المشكلة الأقرب.';$('inqError').hidden=false;$(invalid).focus();return;}
 if ($('inqSymptom').value === 'مشكلة تانية' && !$('inqNotes').value.trim()) {
  $('inqNotes').closest('details').open=true; $('inqNotes').setAttribute('aria-invalid','true');
  $('inqError').textContent='اكتب وصف بسيط للمشكلة عشان نقدر نساعدك.'; $('inqError').hidden=false; $('inqNotes').focus(); return;
 }
 $('inqError').hidden=true;
 const ref='WB-I-'+Date.now().toString(36).toUpperCase();
 const name=$('inqDevice').selectedOptions[0].textContent;
 const text=['أهلاً ورشة بيتية، عندي استفسار عن صيانة جهاز.','مرجع الاستفسار: '+ref,'الجهاز: '+name,'المشكلة: '+$('inqSymptom').value,'الموديل: '+($('inqModel').value.trim()||'مش متأكد'),'تفاصيل: '+($('inqNotes').value.trim()||'لا يوجد'),'عرفتكم من: '+$('inqSource').selectedOptions[0].textContent,'حابب أعرف الخطوة المناسبة والتكلفة التقريبية، ومكان الاستلام ومدة التنفيذ قبل الاتفاق.'].join('\n');
 $('inqMessage').textContent=text;
 $('inqSend').href='https://wa.me/'+D.CONFIG.whatsapp+'?text='+encodeURIComponent(text);
 $('inqResult').hidden=false; $('inqResult').focus();
});
$('inqCopy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('inqMessage').textContent);$('inqCopyStatus').textContent='تم نسخ الرسالة. ابعتها على واتساب لما تكون جاهز.';}
 catch(_){$('inqCopyStatus').textContent='النسخ التلقائي غير متاح. حدد نص الرسالة وانسخه يدويًا.';}
});
const demos=(window.WarshaDemonstrations||[]).filter(d=>d.title&&((d.before&&d.after&&d.work&&d.test)||(d.image&&d.caption))&&['own','customer-permission'].includes(d.ownership));
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
let photoTrigger=null;
$('photoLarge').addEventListener('load',()=>{$('photoLarge').hidden=false;$('photoStatus').textContent='';});
$('photoLarge').addEventListener('error',()=>{$('photoStatus').textContent='تعذر تحميل الصورة. جرّب رابط تنزيل الصورة الأصلية.';});
$('closePhoto').addEventListener('click',()=>$('photoDialog').close());
$('photoDialog').addEventListener('close',()=>photoTrigger?.focus({preventScroll:true}));
for(const d of demos){
 const card=el('article','');card.className='demo-card';
 const badge=el('span',d.ownership==='own'?'تجربة موثّقة من الورشة':'شغل عميل · منشور بإذنه');badge.className='demo-badge';card.append(badge,el('h3',d.title));
 const photos=el('div','');photos.className='demo-photos'+(d.image?' demo-single':'');
 for(const [key,label] of (d.image?[['image','صور من أثناء الشغل']]:[['before',d.beforeLabel||'قبل'],['after',d.afterLabel||'بعد']])){
  const f=el('figure',''),img=document.createElement('img'),button=el('button','');
  img.src=d[key].replace('demos/','demos/thumbs/').replace(/\.jpeg$/,'.webp');img.alt=label+' — '+d.title;img.loading='lazy';img.decoding='async';img.width=640;img.height=640;
  button.type='button';button.className='photo-button';button.setAttribute('aria-label','تكبير: '+img.alt);
  button.addEventListener('click',()=>{photoTrigger=button;$('photoLarge').hidden=true;$('photoStatus').textContent='جاري تحميل الصورة الأصلية كاملة الدقة…';$('photoLarge').src=d[key];$('downloadPhoto').href=d[key];$('photoLarge').alt=img.alt;$('photoCaption').textContent=img.alt;$('photoDialog').showModal();});
  button.append(img);f.append(button,el('figcaption',label));photos.append(f);
 }
 card.append(photos);
 if(d.image)card.append(el('p',d.caption));else card.append(el('p','الشغل: '+d.work),el('p','الملاحظة: '+d.test));
 const ask=el('a','اسأل عن شغل مشابه ←');ask.href='#quickInquiry';ask.className='demo-action';
 ask.addEventListener('click',()=>{openInquiry();$('inqNotes').value='مهتم بشغل مشابه: '+d.title;$('inqNotes').closest('details').open=true;invalidate();});
 card.append(ask);$('demoCards').append(card);
}
$('workGallery').hidden=!demos.length;
})();
