/* Keep secondary content discoverable from footer links and deep links. */
(() => {
  const reveal = () => {
    if (location.hash === '#rateSection') {
      document.getElementById('feedbackDetails').open = true;
      document.getElementById('rateSection').scrollIntoView();
    }
  };
  document.querySelector('a[href="#rateSection"]').addEventListener('click', () => {
    document.getElementById('feedbackDetails').open = true;
  });
  window.addEventListener('hashchange', reveal);
  reveal();
  const links = [...document.querySelectorAll('.site-header nav a')];
  if (!('IntersectionObserver' in window)) return;
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id));
    const current = links.find(link => visible.has(link.hash.slice(1)));
    links.forEach(link => link === current ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  }, {rootMargin:'-120px 0px -30% 0px',threshold:0});
  links.forEach(link => {const target = document.getElementById(link.hash.slice(1)); if (target) observer.observe(target);});
})();
(() => {
 const header=document.querySelector('.site-header');
 const update=()=>document.documentElement.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
 update(); if('ResizeObserver' in window)new ResizeObserver(update).observe(header);else window.addEventListener('resize',update);
 document.querySelector('.skip-link').addEventListener('click',()=>document.getElementById('requestForm').focus({preventScroll:true}));
 // Keep public language links usable without JS; carry the current section only.
 document.querySelector('.language-switch').addEventListener('click',event=>{const a=event.currentTarget;const url=new URL(a.href);url.hash=['#top','#requestForm','#quickInquiry','#workGallery','#faqHeading','#rateSection'].includes(location.hash)?location.hash:'#requestForm';a.href=url.href;});
})();
