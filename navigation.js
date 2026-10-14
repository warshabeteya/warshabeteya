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
