(() => {
'use strict';
const $ = id => document.getElementById(id);
const catalog = {
 'PS1 / PS2': ['درج أو قراءة الأقراص','محتاج تنظيف','مش بيشتغل','مشكلة تانية'],
 'PS3 / PS4': ['صوت المروحة عالي أو سخونة','درج أو قراءة الأقراص','مش بيشتغل','مشكلة تانية'],
 'DualShock 2 / 3 / 4': ['العصا بتتحرك لوحدها (Drift)','أزرار مش بتستجيب','مشكلة شحن أو بطارية','مشكلة تانية'],
 'PSP / PS Vita': ['أزرار أو Analog','بطارية أو شاشة','مش بيشتغل','مشكلة تانية'],
 'MacBook Intel': ['صوت المروحة عالي أو سخونة','مشكلة نظام أو بطء','مش بيشتغل','مشكلة تانية'],
 'كمبيوتر / لابتوب': ['مشكلة نظام أو بطء','مشكلة تانية'],
 'جهاز تاني / مش متأكد': ['محتاج أتأكد إن الخدمة متاحة']
};
Object.keys(catalog).forEach(name => $('inqDevice').add(new Option(name,name)));
function invalidate(){ $('inqResult').hidden=true; $('inqSend').removeAttribute('href'); }
$('inqDevice').addEventListener('change',()=>{
 const rows=catalog[$('inqDevice').value]||[];
 $('inqSymptom').replaceChildren(new Option('اختار المشكلة',''));
 rows.forEach(x=>$('inqSymptom').add(new Option(x,x)));
 $('inqSymptom').disabled=!rows.length;
 $('inqGuidance').textContent='اختار المشكلة الأقرب، ولو مش موجودة اختار مشكلة تانية.';
 invalidate();
});
$('inqSymptom').addEventListener('change',()=>{
 const s=$('inqSymptom').value;
 $('inqGuidance').textContent = /مش بيشتغل|مشكلة تانية|متاحة/.test(s)
 ? 'هنراجع الأعراض معاك الأول ونأكد إذا كنا نقدر نتعامل مع الحالة. وصف المشكلة لوحده مش كفاية لتأكيد السبب أو إمكانية الإصلاح.'
 : 'بنقدّم خدمات في المجال ده. محتاجين نعرف الموديل والأعراض بالتفصيل عشان نأكد الخدمة المناسبة وتوافر أي قطع مطلوبة.';
});
$('inquiryForm').addEventListener('input',invalidate);
$('inquiryForm').addEventListener('change',invalidate);
$('inquiryForm').addEventListener('submit',event=>{
 event.preventDefault();
 if(!$('inquiryForm').reportValidity())return;
 const ref='WB-I-'+Date.now().toString(36).toUpperCase();
 const text=['أهلاً ورشة بيتية، عندي استفسار عن صيانة جهاز.','مرجع الاستفسار: '+ref,'الجهاز: '+$('inqDevice').value,'المشكلة: '+$('inqSymptom').value,'الموديل: '+($('inqModel').value.trim()||'مش متأكد'),'تفاصيل: '+($('inqNotes').value.trim()||'لا يوجد'),'عرفتكم من: '+$('inqSource').value,'حابب أعرف الخطوة المناسبة والتكلفة التقريبية قبل الاتفاق.'].join('\n');
 $('inqMessage').textContent=text;
 $('inqSend').href='https://wa.me/'+window.WarshaData.CONFIG.whatsapp+'?text='+encodeURIComponent(text);
 $('inqResult').hidden=false; $('inqResult').focus();
});
const demos=(window.WarshaDemonstrations||[]).filter(d=>d.title&&((d.before&&d.after&&d.work&&d.test)||(d.image&&d.caption))&&['own','customer-permission'].includes(d.ownership));
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
for(const d of demos){
 const card=el('article','');card.className='demo-card';
 const badge=el('span',d.ownership==='own'?'تجارب موثّقة، خطوة بخطوة.':'شغل عميل · منشور بإذنه');badge.className='demo-badge';card.append(badge,el('h3',d.title));
 const photos=el('div','');photos.className='demo-photos'+(d.image?' demo-single':'');
 for(const [key,label] of (d.image?[['image','صور من أثناء الشغل']]:[['before',d.beforeLabel||'قبل'],['after',d.afterLabel||'بعد']])){const f=el('figure','');const img=document.createElement('img');img.src=d[key];img.alt=label+' — '+d.title;img.loading='lazy';f.append(img,el('figcaption',label));photos.append(f);}
 card.append(photos);
 if(d.image) card.append(el('p',d.caption));
 else card.append(el('p','الشغل: '+d.work),el('p','الملاحظة: '+d.test));
 $('demoCards').append(card);
}
$('workGallery').hidden=!demos.length;
})();
