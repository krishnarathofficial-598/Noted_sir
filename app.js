const body = document.body;
const pills = document.querySelectorAll('.template-pill');
const kicker = document.querySelector('.kicker-text');
const copy = {
  paper: '-------------------------------------', midnight: '-------------------------------------', studio: '-------------------------------------'
};
// Version 02 opens in the selected Midnight Club direction.
pills.forEach(pill => pill.addEventListener('click', () => {
  const theme = pill.dataset.theme;
  body.dataset.theme = theme;
  pills.forEach(item => item.classList.toggle('active', item === pill));
  kicker.textContent = copy[theme];
}));

// Scroll reveals and staggered entrances inspired by the reference site's editorial rhythm.
document.querySelectorAll('.hero-copy, .hero-art, .section-heading, .feature-card, .quote-band').forEach((element, index) => {
  element.classList.add('motion-reveal');
  element.style.setProperty('--reveal-delay', `${Math.min(index * 70, 280)}ms`);
});
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
}), { threshold: 0.14 });
document.querySelectorAll('.motion-reveal').forEach(element => revealObserver.observe(element));

// Keep the navigation present while scrolling, with a compact state.
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('is-scrolled', window.scrollY > 30), { passive: true });
const menuButton = document.querySelector('.reference-menu');
menuButton.addEventListener('click', () => { const open = navbar.classList.toggle('menu-open'); menuButton.setAttribute('aria-expanded', String(open)); });
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => { navbar.classList.remove('menu-open'); menuButton.setAttribute('aria-expanded', 'false'); }));

// Lightweight detail popups for the three workspace cards.
const popupCopy = {
  'notes-card': ['Notes / your thinking space', 'Capture a thought before it disappears. Add tags, pin a useful idea, or return to an unfinished thread when the timing feels right.'],
  'assignment-card': ['Assignments / your next move', 'See what needs attention, what is already moving, and what can wait. A small view of the week keeps the whole week lighter.'],
  'focus-card': ['Focus room / one thing at a time', 'Start a quiet session with a single intention. The timer is here to create a boundary around the work—not pressure.']
};
const modal = document.createElement('div');
modal.className = 'detail-modal';
modal.innerHTML = '<div class="modal-backdrop" data-close></div><div class="modal-panel" role="dialog" aria-modal="true"><button class="modal-close" aria-label="Close">×</button><span class="modal-label"></span><h3 class="modal-title"></h3><p class="modal-body"></p><a class="modal-action" href="#focus">Open workspace <span>↗</span></a></div>';
document.body.appendChild(modal);
const openModal = key => { const [title, text] = popupCopy[key]; modal.querySelector('.modal-label').textContent = title.split(' / ')[0]; modal.querySelector('.modal-title').textContent = title.split(' / ')[1]; modal.querySelector('.modal-body').textContent = text; modal.classList.add('open'); document.body.classList.add('modal-open'); };
document.querySelectorAll('.feature-card').forEach(card => card.addEventListener('click', event => { if (event.target.closest('a')) return; openModal([...card.classList].find(name => popupCopy[name])); }));
modal.addEventListener('click', event => { if (event.target.closest('[data-close], .modal-close, .modal-action')) { modal.classList.remove('open'); document.body.classList.remove('modal-open'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { modal.classList.remove('open'); document.body.classList.remove('modal-open'); } });
