/* ==========================================================================
   Beyaz Kuaför — Site Yükleyici (index sayfası özelleştirme)
   --------------------------------------------------------------------------
   • Site kimliğini <meta name="site-id"> veya ?site= parametresinden alır.
   • Sunucudaki site bilgilerini (ad, slogan, telefon, adres, tema) çeker ve
     data-site="..." ile işaretlenen alanlara uygular.
   • Randevu ve yönetim paneli bağlantılarına site kimliğini ekler.
   ========================================================================== */
(() => {
  'use strict';

  const store = window.BerberStore;
  const meta = document.querySelector('meta[name="site-id"]');
  const params = new URLSearchParams(location.search);
  const siteId = params.get('site') || (meta && meta.content) || 'beyaz';

  /* ------------------------------------------------------------------
     Site bağlantıları
  ------------------------------------------------------------------ */
  function tagSiteLinks() {
    const addSite = (href) => {
      const [base, hash] = href.split('#');
      const sep = base.includes('?') ? '&' : '?';
      return base + sep + 'site=' + encodeURIComponent(siteId) + (hash ? '#' + hash : '');
    };

    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      /* randevu / login / admin sayfalarına site kimliğini ekle */
      if (/(^|\/)(randevu|login|admin)\.html$/.test(href)) {
        a.setAttribute('href', addSite(href));
      }
    });

    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.href = addSite('login.html');
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.href = addSite('login.html');
  }

  /* ------------------------------------------------------------------
     Site bilgilerini uygula
  ------------------------------------------------------------------ */
  function applySite(info) {
    if (!info) return;

    const setText = (field, value) => {
      if (!value) return;
      document.querySelectorAll(`[data-site="${field}"]`).forEach((el) => { el.textContent = value; });
    };

    setText('name', info.name);
    setText('tagline', info.tagline);
    setText('heroBadge', info.heroBadge);
    setText('heroSub', info.heroSub);
    setText('address', info.address);
    setText('addressShort', (info.address || '').split(',').slice(0, 2).join(',').trim() || info.name);
    setText('hours', info.hours);

    if (info.name) {
      const initial = info.name.trim().charAt(0).toUpperCase();
      document.querySelectorAll('[data-site="initial"]').forEach((el) => { el.textContent = initial; });
      document.title = `${info.name} — ${info.tagline || ''}`.trim();
    }

    if (info.phone) {
      document.querySelectorAll('[data-site="phone"]').forEach((el) => { el.textContent = info.phone; });
      document.querySelectorAll('[data-site="phoneLink"]').forEach((el) => {
        const digits = String(info.phone).replace(/[^\d+]/g, '');
        el.href = 'tel:' + digits;
        if (info.phoneDisplay) el.textContent = '📞 ' + info.phoneDisplay;
      });
    }

    if (info.theme && info.theme.accent) {
      const root = document.documentElement;
      root.style.setProperty('--gold', info.theme.accent);
      if (info.theme.accentDark) root.style.setProperty('--gold-2', info.theme.accentDark);
    }
  }

  /* ------------------------------------------------------------------
     Başlat
  ------------------------------------------------------------------ */
  tagSiteLinks();

  if (store && store.loadSiteInfo) {
    store.loadSiteInfo().then(applySite).catch(() => {});
  }
})();
