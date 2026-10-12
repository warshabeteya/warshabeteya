/* One editor, independent device records, one shared customer and order. */
(function() {
  'use strict';
  const D = window.WarshaData, Q = window.WarshaQuote;
  const $ = id => document.getElementById(id);
  const form = $('requestForm'), money = Q.formatMoney;
  let nextUid = 1, extraSequence = 0, lastMessage = '', lastSignature = '', lastReference = '', campaignDate = '', lastModdingSignature = '';
  const blank = () => ({uid:nextUid++,device:'',main:'',extras:[],distro:'',mode:'',backup:false,model:'',firmware:'',notes:'',extraRequest:'',category:''});
  const items = [blank()];
  let state = items[0], journeyStep = 1, removedDevice = null, pendingDraft = null, storageAvailable = true;
  const Draft = window.WarshaDraft;
  try { pendingDraft = Draft.decode(localStorage.getItem(Draft.key)); } catch (_) { storageAvailable = false; }
  function persistDraft() {
    if (pendingDraft) return;
    const hasChoices = items.some(item => item.device || item.category);
    $('clearDraft').hidden = !hasChoices;
    try {
      if (hasChoices) localStorage.setItem(Draft.key,Draft.encode(items,$('applyPromos').checked));
      else localStorage.removeItem(Draft.key);
      storageAvailable = true;
    } catch (_) { storageAvailable = false; }
    $('draftStatus').textContent = storageAvailable
      ? (hasChoices ? 'اختيارات الجهاز والخدمات محفوظة هنا لمدة 7 أيام. بياناتك وملاحظاتك وموافقاتك مش محفوظة.' : 'اختيارات الجهاز والخدمات فقط بتتحفظ على المتصفح لمدة 7 أيام.')
      : 'الحفظ على المتصفح غير متاح. احتفظ بنسخة من رسالتك قبل إغلاق الصفحة.';
  }
  function renderJourney() {
    document.querySelector('.booking-layout').dataset.step = journeyStep;
    $('deviceStage').hidden = journeyStep !== 1;
    $('stepService').hidden = journeyStep !== 2;
    $('checkout').hidden = journeyStep !== 3;
    $('deviceManager').hidden = journeyStep === 3;
    $('activeDeviceLabel').hidden = journeyStep === 3;
    $('nextService').disabled = !state.device;
    $('serviceDeviceName').textContent = Q.bidiText(D.devices.find(d => d[0] === state.device)?.[1] || 'اختار جهازك');
    $('deviceEligibility').textContent = D.deviceGuidance(state.device);
    $('deviceEligibility').hidden = !D.deviceGuidance(state.device);
    $('quoteContinue').hidden = journeyStep === 3 || !$('total').textContent || $('total').textContent === '—';
    const column = document.querySelector('.quote-column');
    column.hidden = journeyStep === 1 || (window.matchMedia('(max-width: 760px)').matches && journeyStep !== 3);
    $('mobileQuote').hidden = journeyStep === 3 || !Q.calculateOrder(items,false).entries.some(e => e.quote);
    updateProgress();
  }
  function goStep(step, focus = true) {
    window.WarshaPicker.close(); journeyStep = step; renderJourney();
    const target = step === 1 ? $('deviceStage') : step === 2 ? $('stepService') : $('checkout');
    if (focus) { scrollToNode(target); target.focus({preventScroll:true}); }
  }
  function validateDevices() {
    saveCurrent();
    const incomplete = items.find(item => Q.deviceIssue(item));
    if (!incomplete) { show('formError',false); return true; }
    state = incomplete; journeyStep = state.device ? 2 : 1; renderEditor();
    const issue = Q.deviceIssue(state);
    $('formError').textContent = 'الجهاز ' + (items.indexOf(state)+1) + ': ' + issue.text;
    show('formError',true);
    const field = issue.field === 'linuxModeBox' ? document.querySelector('[name="linuxMode"]') : $(issue.field);
    field.setAttribute('aria-invalid','true'); field.setAttribute('aria-describedby','formError'); scrollToNode(focusControl(field)); return false;
  }
  function reviewOrder(event) { event?.preventDefault(); if (validateDevices()) goStep(3); }
  function showUndo(item,index) {
    removedDevice = {item,index,wasLast:items.length === 0}; $('undoRemoval').hidden = false;
    $('undoText').textContent = 'اتحذف الجهاز من الطلب. تقدر ترجّعه قبل حذف جهاز تاني.';
  }
  const element = (tag,text,className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = Q.bidiText(text);
    if (className) node.className = className;
    return node;
  };
  const focusControl = node => {
    if (node.id === 'device') {
      const target = document.querySelector('#deviceModels [aria-pressed=true]') || document.querySelector('#deviceModels button') || document.querySelector('[data-category]');
      target.focus({preventScroll:true}); return target;
    }
    if (node.tagName === 'SELECT') return window.WarshaPicker.focus(node);
    node.focus({preventScroll:true}); return node;
  };
  const focusDevice = () => state.category || state.device ? focusControl($('device')) : document.querySelector('[data-category]').focus({preventScroll:true});
  const show = (id,on) => $(id).classList.toggle('hidden',!on);
  function track(name,params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event',name,params);
  }
  function initAnalytics() {
    // Keep local previews out of the live property's reports.
    if (!/^https?:$/.test(location.protocol) || ['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js',new Date());
    window.gtag('config',D.CONFIG.analyticsId, {allow_google_signals:false,allow_ad_personalization_signals:false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(D.CONFIG.analyticsId);
    document.head.appendChild(script);
  }

  function wa(text = '') { return 'https://wa.me/' + D.CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(Q.displayText(text)) : ''); }
  function scrollToNode(node) { node.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'}); }
  function setOptions(select,rows,placeholder,current = '') {
    select.dir = 'rtl';
    select.replaceChildren(new Option(placeholder,''));
    rows.forEach(([id,label,price]) => { const option=new Option(Q.optionLabel(label,price),id); option.dataset.label=label; if(typeof price==='number') option.dataset.price=price; select.add(option); });
    if (rows.some(row => row[0] === current)) select.value = current;
  }
  function saveCurrent() {
    state.device = $('device').value; state.main = $('mainService').value;
    state.extras = [...document.querySelectorAll('.additional-service')].map(s => s.value).filter(Boolean);
    state.distro = $('linuxDistro').value;
    state.mode = document.querySelector('[name="linuxMode"]:checked')?.value || '';
    state.backup = $('linuxBackup').checked;
    ['model','firmware','notes','extraRequest'].forEach(key => state[key] = $(key).value);
  }
  function invalidatePrepared() {
    show('successBox',false); lastMessage = ''; $('messagePreview').textContent = ''; $('whatsappFallback').href = '#';
  }
  function newItem(focus = true) {
    state = blank(); items.push(state); journeyStep = 1;
    if (focus) { renderEditor(); invalidatePrepared(); scrollToNode(document.querySelector('.category-prompt')); focusDevice(); }
  }
  function switchItem(uid) {
    saveCurrent(); state = items.find(item => item.uid === uid); journeyStep = state.device ? 2 : 1; renderEditor();
    goStep(journeyStep);
  }
  function removeItem(uid) {
    saveCurrent(); const index = items.findIndex(item => item.uid === uid);
    const [removed] = items.splice(index,1); showUndo(removed,index);
    if (!items.length) { items.push(blank()); journeyStep = 1; }
    if (state.uid === uid) state = items[Math.min(index,items.length-1)];
    if (!state.device) journeyStep = 1;
    renderEditor(); invalidatePrepared(); $('undoDevice').focus({preventScroll:true});
  }
  function renderDeviceList(order) {
    $('orderDevices').replaceChildren();
    order.entries.forEach(({state:item,quote,index}) => {
      const li = element('li',undefined,'order-device-row');
      const edit = element('button',undefined,'order-device-button'); edit.type = 'button';
      edit.dataset.deviceUid = item.uid;
      if (item.uid === state.uid) edit.setAttribute('aria-current','true');
      const name = D.devices.find(d => d[0] === item.device)?.[1] || 'جهاز جديد';
      edit.append(element('strong','الجهاز ' + (index+1) + ' — ' + name));
      edit.append(element('small',quote ? money(quote.total) + (Q.deviceIssue(item) ? ' · كمّل التفاصيل' : ' · تعديل الخدمات') : 'اختار خدمته عشان يظهر السعر'));
      edit.addEventListener('click',() => switchItem(item.uid));
      const remove = element('button','حذف','remove-device-button'); remove.type = 'button';
      remove.disabled = items.length === 1; remove.setAttribute('aria-label','حذف الجهاز ' + (index+1));
      remove.addEventListener('click',() => removeItem(item.uid));
      li.append(edit,remove); $('orderDevices').append(li);
    });
    const name = D.devices.find(d => d[0] === state.device)?.[1] || 'اختار نوع الجهاز';
    $('activeDeviceLabel').textContent = Q.bidiText('تعديل الجهاز ' + (items.indexOf(state)+1) + ' من ' + items.length + ' — ' + name);
  }
  function mountExtra(value = '') {
    const row = element('div',undefined,'service-row'), field = element('div',undefined,'extra-field');
    const select = element('select',undefined,'additional-service'); select.id = 'extra-service-' + (++extraSequence);
    const label = element('label','خدمة إضافية ' + ($('additionalServices').children.length+1)); label.htmlFor = select.id;
    // Initial options allow restoration; refreshServices then removes conflicts.
    setOptions(select,Q.availableServices(state.device,[],false,state.main === 'linux'),'-- اختر خدمة إضافية --',value);
    const remove = element('button','حذف','remove-service-btn'); remove.type = 'button'; remove.setAttribute('aria-label','حذف ' + label.textContent);
    select.addEventListener('change',() => { saveCurrent(); refresh(); invalidatePrepared(); });
    remove.addEventListener('click',() => { row.remove(); saveCurrent(); refresh(); invalidatePrepared(); $('addServiceButton').focus(); });
    field.append(label,select); row.append(field,remove); $('additionalServices').append(row);
    return select;
  }
  function renderModels() {
    const shortNames = {ps1:'PS1',ps2:'PS2',ps3:'PS3',ps4:'PS4',psp:'PSP',vita:'PS Vita',ds2:'DualShock 2',ds3:'DualShock 3',ds4:'DualShock 4','mac-intel':'MacBook Intel','mac-silicon':'MacBook Apple Silicon','pc-laptop':'كمبيوتر / لابتوب'};
    const descriptions = {ps1:'بلايستيشن 1',ps2:'بلايستيشن 2',ps3:'بلايستيشن 3',ps4:'بلايستيشن 4',psp:'بلايستيشن محمول',vita:'بلايستيشن فيتا',ds2:'يد بلايستيشن 2',ds3:'يد بلايستيشن 3',ds4:'يد بلايستيشن 4','mac-intel':'معالج Intel','mac-silicon':'معالج Apple — سلسلة M','pc-laptop':'كمبيوتر مكتبي أو محمول'};
    $('deviceModels').replaceChildren();
    [...$('device').options].filter(o => o.value).forEach(option => {
      const button = element('button',undefined,'model-card'); button.type = 'button';
      button.dataset.model = option.value; button.setAttribute('aria-pressed',String(state.device === option.value));
      button.append(element('strong',shortNames[option.value]),element('small',descriptions[option.value]));
      button.addEventListener('click',() => {
        if (state.device === option.value) return;
        $('device').value = option.value;
        $('device').dispatchEvent(new Event('change',{bubbles:true}));
        const selected = document.querySelector('#deviceModels [aria-pressed=true]');
        selected?.focus({preventScroll:true});
      });
      $('deviceModels').append(button);
    });
  }
  function renderEditor() {
    window.WarshaPicker.close();
    show('stepDevice',Boolean(state.category || state.device));
    show('stepService',Boolean(state.device));
    $('deviceOptional').open = Boolean(state.model);
    $('serviceNotes').open = Boolean(state.notes || state.extraRequest);
    $('extraBox').open = state.extras.length > 0;
    // No mutation of a different device while rebuilding the active editor.
    setOptions($('device'),D.devices.filter(d => d[2] === (state.category || D.devices.find(row => row[0] === state.device)?.[2])).map(d => d.slice(0,2)),'-- اختر الجهاز --',state.device);
    renderModels();
    setOptions($('mainService'),Q.availableServices(state.device,[],true),'-- اختر الخدمة الأساسية --',state.main);
    ['model','firmware','notes','extraRequest'].forEach(key => $(key).value = state[key]);
    $('linuxDistro').value = state.distro;
    document.querySelectorAll('[name="linuxMode"]').forEach(r => r.checked = r.value === state.mode);
    $('linuxBackup').checked = state.backup;
    $('additionalServices').replaceChildren(); state.extras.forEach(id => mountExtra(id));
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.category === state.category)));
    refresh();
  }
  function refreshServices() {
    setOptions($('mainService'),Q.availableServices(state.device,[],true),'-- اختر الخدمة الأساسية --',state.main);
    $('mainService').disabled = !state.device; state.main = $('mainService').value;
    $('serviceHelp').textContent = D.serviceDescriptions[state.main] || '';
    $('serviceHelp').hidden = !state.main;
    show('inspectionHelp',!state.main);
    const selected = state.main ? [state.main] : [];
    const controls = [...document.querySelectorAll('.additional-service')];
    controls.forEach(select => {
      const available = Q.availableServices(state.device,selected,false,state.main === 'linux');
      if (select.value && !available.some(row => row[0] === select.value)) select.value = '';
      if (select.value) selected.push(select.value);
    });
    controls.forEach(select => {
      const other = [state.main,...controls.filter(s => s !== select).map(s => s.value)].filter(Boolean);
      setOptions(select,Q.availableServices(state.device,other,false,state.main === 'linux'),'-- اختر خدمة إضافية --',select.value);
    });
    if (state.main === 'inspect' || !state.main) $('additionalServices').replaceChildren();
    state.extras = [...document.querySelectorAll('.additional-service')].map(s => s.value).filter(Boolean);
    $('addServiceButton').disabled = !state.main || !Q.availableServices(state.device,[state.main,...state.extras],false,state.main === 'linux').length;
    show('extraBox',Boolean(state.main) && state.main !== 'inspect'); show('extraRequestBox',Boolean(state.device));
    const firmwareNeeded = Q.needsFirmware(state);
    show('ps4FirmwareBox',firmwareNeeded); $('firmware').required = firmwareNeeded; $('firmware').disabled = !firmwareNeeded;
    if (!firmwareNeeded) { state.firmware = ''; $('firmware').value = ''; }
  }
  function refreshLinux() {
    const on = state.main === 'linux';
    if (!on) { state.distro = ''; state.mode = ''; state.backup = false; }
    if (!state.distro) { state.mode = ''; state.backup = false; }
    const hasDistro = on && Boolean(state.distro), hasMode = hasDistro && Boolean(state.mode);
    show('linuxDistroBox',on); show('linuxModeBox',hasDistro); show('linuxBackupBox',hasMode);
    $('linuxDistro').value = state.distro; $('linuxDistro').required = on; $('linuxDistro').disabled = !on;
    document.querySelectorAll('[name="linuxMode"]').forEach(r => { r.required = hasDistro; r.disabled = !hasDistro; r.checked = r.value === state.mode; });
    if (!hasMode) state.backup = false;
    $('linuxBackup').required = hasMode; $('linuxBackup').disabled = !hasMode; $('linuxBackup').checked = state.backup;
    show('linuxBitlockerHint',state.mode !== 'wipe');
  }
  function refresh() { refreshServices(); refreshLinux(); renderQuote(); }
  function moddingScope(entries) {
    const ps = new Set(['ps1','ps2','ps3','ps4','psp','vita']);
    return {
      playstation: entries.some(({state:item,quote}) => quote?.requiresModding && ps.has(item.device)),
      mac: entries.some(({state:item,quote}) => quote?.requiresModding && item.device === 'mac-intel' && [item.main,...item.extras].some(id => id === 'oclp' || id === 'oclp_full'))
    };
  }
  function renderQuote() {
    const order = Q.calculateOrder(items,$('applyPromos').checked);
    renderDeviceList(order);
    const scope = moddingScope(order.entries);
    const moddingSignature = JSON.stringify(order.entries.filter(e => e.quote?.requiresModding).map(({state:item}) => [item.uid,item.device,[item.main,...item.extras].filter(id => D.moddingServices.has(id)).sort()]));
    if (moddingSignature !== lastModdingSignature) $('moddingOptIn').checked = false;
    lastModdingSignature = moddingSignature;
    $('playstationModdingWarning').hidden = !scope.playstation;
    $('playstationOnlineTerm').hidden = !scope.playstation;
    $('macModdingWarning').hidden = !scope.mac;
    $('macPerformanceNote').hidden = !scope.mac;
    $('macUpdateTerm').hidden = !scope.mac;
    $('otherModdingWarning').hidden = !order.requiresModding || scope.playstation || scope.mac;
    show('moddingSection',order.requiresModding); $('moddingOptIn').required = order.requiresModding; $('moddingOptIn').disabled = !order.requiresModding;
    if (!order.requiresModding) $('moddingOptIn').checked = false;
    const hasQuote = order.entries.some(e => e.quote);
    show('checkout',hasQuote);
    show('deviceManager',items.length > 1);
    show('activeDeviceLabel',items.length > 1);
    $('emptyQuote').hidden = hasQuote;
    document.querySelector('.offer-toggle').hidden = !hasQuote;
    show('offerStatus',hasQuote);
    $('quoteDetails').hidden = !hasQuote;
    $('total').textContent = hasQuote ? money(order.total) : '—';
    $('quoteDevice').textContent = items.length + ' جهاز في الطلب' + (order.pending ? ' · ' + order.pending + ' بدون خدمة مختارة' : '');
    $('mobileQuote').hidden = !hasQuote; $('mobileTotal').textContent = hasQuote ? money(order.total) : '';
    $('quoteContinue').hidden = !hasQuote; $('nextContact').hidden = !hasQuote; $('breakdown').replaceChildren();
    order.entries.forEach(({state:item,quote,index}) => {
      const group = element('section',undefined,'device-quote');
      const name = D.devices.find(d => d[0] === item.device)?.[1] || 'جهاز جديد';
      group.append(element('h3','الجهاز ' + (index+1) + ' — ' + name));
      const actions = element('div',undefined,'quote-actions');
      const edit = element('button','تعديل','text-button'); edit.type = 'button'; edit.setAttribute('aria-label','تعديل الجهاز ' + (index+1)); edit.addEventListener('click',() => switchItem(item.uid));
      const remove = element('button','حذف','text-button'); remove.type = 'button'; remove.setAttribute('aria-label','حذف الجهاز ' + (index+1) + ' من الملخص'); remove.addEventListener('click',() => removeItem(item.uid));
      actions.append(edit,remove); group.append(actions);
      if (item.model) group.append(element('p','الموديل: ' + item.model,'hint'));
      if (!quote) group.append(element('p','لسه فاضل اختيار خدمة الجهاز ده؛ سعره مش داخل الإجمالي.','hint quote-pending'));
      else {
        quote.lines.forEach(line => {
          const row = element('div',undefined,'quote-line');
          row.append(element('span',line.name),element('bdi',money(line.price))); group.append(row);
        });
        if (quote.discount) {
          const row = element('div',undefined,'quote-line quote-discount');
          row.append(element('span','خصم العرض'),element('bdi','− ' + money(quote.discount))); group.append(row);
        }
        const subtotal = element('div',undefined,'quote-line device-subtotal');
        subtotal.append(element('strong','إجمالي الجهاز'),element('bdi',money(quote.total))); group.append(subtotal);
        quote.warnings.forEach(w => group.append(element('p',w,'hint')));
      }
      $('breakdown').append(group);
    });
    $('offerStatus').textContent = order.offer ? Q.bidiText(order.offer.title + ' · عرض واحد للطلب، بعد تأكيد الاستحقاق.') : ($('applyPromos').checked ? 'ده سعر خدماتك المختارة. لو فيه عرض مناسب، هنحسبه هنا.' : 'السعر بدون عروض.');
    const payment = $('paymentEstimate'); payment.replaceChildren(); payment.hidden = !hasQuote || order.pending > 0;
    if (!payment.hidden) {
      payment.append(element('h3','توزيع مبدئي للدفع'));
      const half = Math.round(order.total * 50) / 100, rest = Math.round((order.total-half)*100)/100;
      [['50% عند الاستلام',half],['الباقي عند التسليم',rest]].forEach(([label,value]) => {
        const row = element('div',undefined,'quote-line'); row.append(element('span',label),element('bdi',money(value))); payment.append(row);
      });
      payment.append(element('p','حسب السعر التقريبي الحالي. نأكد المبلغ معاك قبل التسليم للورشة. القطع المستوردة تُدفع منفصلة ومقدمًا؛ الفحص مش رسوم إضافية فوق الخدمة المنفذة.'));
      if (order.entries.some(e => e.state.main === 'inspect')) payment.append(element('p','الفحص المختار خدمة مستقلة. لو اتفقنا على إصلاح لنفس الجهاز، رسوم الفحص بتتحسب من سعره.'));
    }
    window.WarshaPicker.sync();
    renderJourney(); persistDraft();
    $('quoteAnnouncement').textContent = hasQuote ? 'إجمالي ' + items.length + ' جهاز: ' + money(order.total) + (order.pending ? '، أكمل الأجهزة الناقصة.' : '') : '';
  }
  const formatDate = Q.formatOfferDate;
  function renderPromos() {
    campaignDate = Q.cairoDate();
    const active = Q.activePromos();
    const banner = $('promoBannerSlot'), slot = $('promoSectionSlot'); banner.replaceChildren(); slot.replaceChildren();
    if (!active.length) return;
    const section = element('details',undefined,'panel promo-section');
    const heading = element('span','الباقات والعروض (' + active.length + ')'); heading.id = 'promoHeading'; section.setAttribute('aria-labelledby',heading.id);
    const summary=element('summary',undefined,'offers-summary'); summary.append(heading,element('small','الخصم المناسب بيتحسب تلقائيًا في ملخصك')); section.append(summary);
    const grid = element('div',undefined,'promo-cards');
    active.forEach(p => {
      const card = element('article',undefined,'promo-card');
      card.append(element('h3',p.title),element('p',p.description));
      const price = element('p',undefined,'promo-price');
      if (p.type === 'bundle') {
        const was = p.services.reduce((sum,id) => sum + Q.service(p.device,id).price,0);
        price.append(element('s',money(was)),element('strong',money(p.price)));
      } else price.append(element('strong','خصم ' + p.percentOff + '%'));
      card.append(price,element('p','لحد ' + formatDate(p.endDate) + ' ' + p.endDate.slice(0,4) + ' بتوقيت القاهرة','hint'));
      if (p.type === 'bundle') card.append(element('p','الباقة تشمل: ' + p.services.map(id => Q.service(p.device,id).name).join(' + ') + '. لو بدأت جهاز بالفعل، هنضيف جهاز مستقل للطلب.','hint'));
      if (p.note) card.append(element('p',p.note,'hint'));
      const button = element('button',p.type === 'bundle' ? 'أضف ' + D.devices.find(d => d[0] === p.device)[1] + ' بالباقة' : p.type === 'second-controller' ? 'أضف أيدي التحكم' : 'اختار جهازك واستفيد','button button-outline');
      button.type = 'button';
      button.addEventListener('click',() => {
        if (!Q.activePromos().some(item => item.id === p.id)) { renderPromos(); renderQuote(); return; }
        saveCurrent(); pendingDraft = null; $('draftResume').hidden = true;
        if (p.type === 'bundle') {
          // A promotion adds a device instead of overwriting another device's work.
          if (state.device || state.main || state.notes || state.model || state.extraRequest) newItem(false);
          Object.assign(state,{device:p.device,main:p.services[0],extras:p.services.slice(1),category:D.devices.find(d => d[0] === p.device)[2]});
        } else if (p.type === 'second-controller') {
          if (state.device || state.main || state.notes || state.model || state.extraRequest) newItem(false);
          state.category = 'controllers';
        }
        $('applyPromos').checked = true;
        journeyStep = state.device ? 2 : 1; renderEditor(); invalidatePrepared();
        goStep(journeyStep);
        track('promo_select',{promo:p.id});
      });
      card.append(button);
      grid.append(card);
    });
    section.append(grid);
    const terms = element('ul',undefined,'promo-terms');
    ['أفضل عرض واحد لكل الطلب ورقم الموبايل، بدون جمع خصومات. بنأكد الاستحقاق على واتساب.',
      'الخصم على الشغل فقط. القطع المستوردة بسعرها المعتاد، وبتستغرق تقريبًا من 1 إلى 5 أسابيع.',
      'تأكيد العرض وسداد العربون قبل نهاية فترته شرط لتثبيت السعر.'].forEach(t => terms.append(element('li',t)));
    section.append(terms); slot.append(section);
  }

  function updateProgress() {
    const current = journeyStep;
    document.querySelectorAll('[data-order-step]').forEach(link => {
      const step = Number(link.dataset.orderStep);
      const available = step === 1 || (step === 2 ? Boolean(state.device) : !$('checkout').classList.contains('hidden'));
      link.setAttribute('aria-disabled',String(!available));
      if (step === current) link.setAttribute('aria-current','step'); else link.removeAttribute('aria-current');
    });
  }
  document.querySelectorAll('[data-order-step]').forEach(link => link.addEventListener('click',event => {
    event.preventDefault();
    if (link.getAttribute('aria-disabled') === 'true') return;
    const step = Number(link.dataset.orderStep);
    if (step === 3) reviewOrder(); else goStep(step);
  }));
  form.addEventListener('focusin',updateProgress);
  $('chooseInspection').addEventListener('click',() => {
    saveCurrent(); state.main = 'inspect'; state.extras = [];
    renderEditor(); invalidatePrepared(); reviewOrder();
  });

  ['addDeviceButton','addAnotherDeviceButton','reviewAddDevice'].forEach(id => $(id).addEventListener('click',() => { saveCurrent(); newItem(); }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click',() => {
    saveCurrent(); const uid = state.uid;
    if (button.getAttribute('aria-pressed') === 'true') return;
    const category = button.dataset.category;
    if (state.device && category && !D.devices.some(d => d[0] === state.device && d[2] === category)) Object.assign(state,blank(),{uid});
    state.category = category; journeyStep = 1;
    const candidates = D.devices.filter(d => !category || d[2] === category);
    if (category && candidates.length === 1) state.device = candidates[0][0];
    renderEditor(); invalidatePrepared(); scrollToNode(document.querySelector('.category-prompt')); focusDevice();
  }));
  $('device').addEventListener('change',() => {
    const device = $('device').value, uid = state.uid, category = state.category;
    Object.assign(state,blank(),{uid,category,device}); renderEditor(); invalidatePrepared();
  });
  $('mainService').addEventListener('change',() => { saveCurrent(); refresh(); invalidatePrepared(); });
  $('addServiceButton').addEventListener('click',() => { const select = mountExtra(); refresh(); focusControl(select); });
  $('linuxDistro').addEventListener('change',() => { saveCurrent(); state.backup = false; refresh(); invalidatePrepared(); });
  $('linuxModeBox').addEventListener('change',() => { saveCurrent(); state.backup = false; refresh(); invalidatePrepared(); });
  $('linuxBackup').addEventListener('change',() => { saveCurrent(); renderQuote(); invalidatePrepared(); });
  $('applyPromos').addEventListener('change',() => { renderQuote(); invalidatePrepared(); });
  form.addEventListener('input',event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    if (event.target.id === 'name') show('nameError',false);
    event.target.removeAttribute('aria-invalid'); show('formError',false);
    if (event.target.id === 'phone') show('phoneError',false);
    saveCurrent(); renderQuote(); invalidatePrepared();
  });
  $('moddingOptIn').addEventListener('change',() => {
    show('moddingError',$('moddingOptIn').required && !$('moddingOptIn').checked);
  });
  form.addEventListener('change',invalidatePrepared);
  document.querySelectorAll('input[type="text"],input[type="tel"],textarea').forEach(field => field.addEventListener('blur',() => {
    field.value = Q.displayText(field.value);
    if (field.id === 'phone') field.value = Q.normalizePhone(field.value);
    saveCurrent();
  }));
  function validate() {
    if (!validateDevices()) return false;
    goStep(3,false);
    // Bring the required modification consent into view before contact validation.
    const missingModdingConsent = $('moddingOptIn').required && !$('moddingOptIn').checked;
    show('moddingError',missingModdingConsent);
    if (missingModdingConsent) {
      const checkbox = $('moddingOptIn');
      checkbox.setAttribute('aria-invalid','true');
      $('formError').textContent = $('moddingError').textContent;
      show('formError',true);
      checkbox.closest('.modding-confirm').scrollIntoView({behavior:'instant',block:'center'});
      checkbox.focus({preventScroll:true});
      return false;
    }
    $('name').setCustomValidity($('name').value.trim() ? '' : 'اكتب اسمك.');
    $('phone').value = Q.normalizePhone($('phone').value);
    $('phone').setCustomValidity(Q.validPhone($('phone').value) ? '' : 'اكتب رقم موبايل مصري صحيح.');
    $('agree').setCustomValidity($('agree').checked ? '' : 'وافق على بنود الخدمة وسياسة الدفع قبل تجهيز الرسالة.');
    const invalid = [...form.elements].find(field => field.willValidate && !field.validity.valid);
    for (const field of form.elements) if (field.willValidate) field.setAttribute('aria-invalid',String(!field.validity.valid));
    show('nameError',!$('name').validity.valid);
    show('phoneError',!$('phone').validity.valid); show('agreeError',!$('agree').checked);
    show('moddingError',$('moddingOptIn').required && !$('moddingOptIn').checked);
    if (!invalid) { show('formError',false); return true; }
    const label = invalid.labels?.[0]?.textContent.replace(/\s+/g,' ').trim() || 'البيانات المطلوبة';
    $('formError').textContent = 'راجع الحقل: ' + label; show('formError',true); scrollToNode(focusControl(invalid)); return false;
  }
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (journeyStep < 3) { if (journeyStep === 1 && state.device) goStep(2); else if (journeyStep === 2) reviewOrder(); return; } saveCurrent(); refresh(); if (!validate()) return;
    const order = Q.calculateOrder(items,$('applyPromos').checked);
    const customer = {name:$('name').value,phone:$('phone').value};
    const signature = JSON.stringify({items:items.map(({uid,category,...data}) => data),customer,total:order.total,offer:order.offer?.id});
    if (signature !== lastSignature) {
      const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      const random = new Uint8Array(6); crypto.getRandomValues(random);
      const suffix = [...random].map(n => alphabet[n & 31]).join('');
      lastReference = 'WB-' + Q.cairoDate().replace(/-/g,'') + '-' + suffix; lastSignature = signature;
    }
    lastMessage = Q.orderMessage(items,customer,order,lastReference);
    $('orderRef').textContent = lastReference; $('messagePreview').textContent = lastMessage;
    $('whatsappFallback').href = wa(lastMessage); $('copyStatus').textContent = ''; show('successBox',true);
    $('successBox').focus({preventScroll:true}); scrollToNode($('successBox'));
    track('request_prepared',{device_count:items.length,promo:order.offer?.id || 'none'});
  });
  $('copyRequest').addEventListener('click',async () => {
    try { await navigator.clipboard.writeText(lastMessage); $('copyStatus').textContent = 'تم نسخ تفاصيل الطلب.'; }
    catch (_) { $('messagePreview').parentElement.open = true; $('copyStatus').textContent = 'النسخ التلقائي غير متاح. تقدر تحدد الرسالة وتنسخها يدويًا.'; }
  });
  // Accessible RTL radio group: roving tab stop, arrows, Home and End.
  const stars = [...document.querySelectorAll('#starRating .star')];
  let rating = 0;
  function chooseRating(value, focus = false) {
    rating = value;
    stars.forEach((button,index) => {
      button.setAttribute('aria-checked',String(index + 1 === rating));
      button.tabIndex = index + 1 === (rating || 1) ? 0 : -1;
      button.classList.toggle('filled',index < rating);
    });
    $('rateSelectedLabel').textContent = ['اختر تقييمك','ضعيف','مقبول','جيد','جيد جدًا','ممتاز'][rating];
    show('rateError',false); if (focus) stars[rating - 1].focus();
  }
  stars.forEach((button,index) => {
    button.addEventListener('click',() => chooseRating(index + 1));
    button.addEventListener('keydown',event => {
      let next;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = (index + 1) % 5;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = (index + 4) % 5;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 4;
      if (next !== undefined) { event.preventDefault(); chooseRating(next + 1,true); }
    });
  });
  $('rateSendButton').addEventListener('click',() => {
    if (!rating) { show('rateError',true); stars[0].focus(); return; }
    const message = ['تقييم خدمة - ' + D.CONFIG.name,'التقييم: ' + rating + ' من 5',$('rateComment').value.trim()].filter(Boolean).join('\n');
    window.open(wa(message),'_blank','noopener,noreferrer');
    let fallback = $('ratingFallback');
    if (!fallback) { fallback = element('a','فتح رسالة التقييم على واتساب','rating-fallback'); fallback.id = 'ratingFallback'; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; $('rateSendButton').after(fallback); }
    fallback.href = wa(message); track('rating_handoff');
  });

  function checkCampaignDate() {
    if (campaignDate !== Q.cairoDate()) { renderPromos(); renderQuote(); invalidatePrepared(); }
  }
  document.addEventListener('visibilitychange',() => { if (!document.hidden) checkCampaignDate(); });
  window.addEventListener('focus',checkCampaignDate); setInterval(checkCampaignDate,60000);
  document.querySelectorAll('[data-inspection-fee]').forEach(node => node.textContent = D.CONFIG.inspectionFee);
  document.querySelectorAll('[data-whatsapp]').forEach(link => { link.href = wa('مرحبًا، عندي استفسار عن صيانة أجهزتي.'); link.addEventListener('click',() => track('whatsapp_enquiry')); });
  document.querySelectorAll('[data-facebook]').forEach(link => link.href = D.CONFIG.facebook);
  $('copySiteLink').addEventListener('click',async () => {
    try { await navigator.clipboard.writeText(D.CONFIG.siteUrl); $('siteCopyStatus').textContent = 'تم نسخ رابط الموقع. تقدر تبعته لأي حد.'; }
    catch (_) { show('siteLinkFallback',true); $('siteCopyStatus').textContent = 'اضغط مطوّلًا على الرابط لنسخه، أو انسخه من شريط العنوان.'; }
  });
  document.querySelector('.hero-cta').addEventListener('click',() => track('hero_cta_click'));
  setOptions($('linuxDistro'),D.LINUX_DISTROS.map(([id,label,tier]) => [id,label,D.LINUX_TIERS[tier].price]),'-- اختر التوزيعة --');
  $('nextService').addEventListener('click',() => { saveCurrent(); if (state.device) goStep(2); });
  $('backDevice').addEventListener('click',() => goStep(1));
  $('backService').addEventListener('click',() => goStep(2));
  ['nextContact','quoteContinue','mobileReview'].forEach(id => $(id).addEventListener('click',reviewOrder));
  $('undoDevice').addEventListener('click',() => {
    if (!removedDevice) return;
    saveCurrent();
    if (removedDevice.wasLast && items.length === 1 && !items[0].device && !items[0].category) items.splice(0,1);
    items.splice(Math.min(removedDevice.index,items.length),0,removedDevice.item); state = removedDevice.item;
    removedDevice = null; $('undoRemoval').hidden = true; journeyStep = state.device ? 2 : 1;
    renderEditor(); invalidatePrepared(); goStep(journeyStep);
  });
  function clearChoices() {
    pendingDraft = null; removedDevice = null; $('undoRemoval').hidden = true; $('draftResume').hidden = true;
    items.splice(0,items.length,blank()); state = items[0]; journeyStep = 1;
    ['name','phone'].forEach(id => { $(id).value = ''; $(id).setCustomValidity(''); });
    ['agree','moddingOptIn'].forEach(id => { $(id).checked = false; $(id).setCustomValidity(''); });
    ['formError','nameError','phoneError','agreeError','moddingError'].forEach(id => show(id,false));
    $('applyPromos').checked = true; renderEditor(); invalidatePrepared(); goStep(1);
  }
  $('clearDraft').addEventListener('click',clearChoices);
  $('discardDraft').addEventListener('click',clearChoices);
  $('resumeDraft').addEventListener('click',() => {
    if (!pendingDraft) return;
    const draft = pendingDraft; pendingDraft = null; $('draftResume').hidden = true;
    items.splice(0,items.length,...draft.items.map(item => Object.assign(blank(),item)));
    state = items.find(item => Q.deviceIssue(item)) || items[0];
    $('applyPromos').checked = draft.applyPromos; journeyStep = state.device ? 2 : 1;
    renderEditor(); invalidatePrepared(); goStep(journeyStep);
  });
  // If a customer starts fresh instead, deliberately discard the older draft.
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click',() => {
    if (pendingDraft) { pendingDraft = null; $('draftResume').hidden = true; persistDraft(); }
  }));
  $('draftResume').hidden = !pendingDraft;
  const mobileLayout = window.matchMedia('(max-width: 760px)'), quoteColumn = document.querySelector('.quote-column');
  function placeQuote() { if (mobileLayout.matches) $('reviewQuoteSlot').append(quoteColumn); else document.querySelector('.booking-layout').append(quoteColumn); renderJourney(); }
  mobileLayout.addEventListener('change',placeQuote); placeQuote();
  renderEditor(); renderPromos(); chooseRating(0); initAnalytics();
})();
