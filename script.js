// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Header shrink on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.classList.add('scrolled'); else header.classList.remove('scrolled');
});

// Open/closed status based on Istanbul time
function updateStatus() {
  const el = document.getElementById('statusText');
  if (!el) return;
  const now = new Date();
  // Istanbul offset (UTC+3)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3 * 3600000);
  const day = ist.getDay(); // 0 Sun
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const open = day >= 1 && day <= 6; // Mon-Sat
  const start = 8 * 60, end = 21 * 60;
  let text;
  if (!open) text = 'Kapalı (Pazar)';
  else if (mins < start) text = `Kapalı · ${Math.floor((start - mins)/60)}s ${ (start-mins)%60 }dk sonra açılıyor`;
  else if (mins >= end) text = 'Kapalı · Yarın 08:00 açılıyor';
  else text = `Açık · ${Math.floor((end - mins)/60)}s ${ (end-mins)%60 }dk sonra kapanıyor`;
  el.textContent = text;
  el.style.color = text.startsWith('Açık') ? '#7ddf8a' : '#ff6b6b';
}
updateStatus();
setInterval(updateStatus, 60000);

// Reveal on scroll
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.section, .service-card, .review, .feature').forEach(el => {
  el.classList.add('reveal');
  obs.observe(el);
});
