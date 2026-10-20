/* ==========================================================================
   Beyaz Kuaför — Panel: Mali İşlemler PIN Kilidi
   --------------------------------------------------------------------------
   • "Mali İşlemler" sekmesine girmek için PIN kartı açılır.
   • Kartta yalnızca rakam tuşları vardır (klavye girişi de desteklenir).
   • PIN sunucuda saklanır (scrypt + tuz), tüm cihazlarda aynı geçerlidir.
   • Kilit, tarayıcı oturumu boyunca açık kalır (sayfa yenilense de).
   ========================================================================== */
(() => {
  'use strict';

  const store = window.BerberStore;
  if (!store) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const modal = $('#pinModal');
  const dotsBox = $('#pinDots');
  const errBox = $('#pinError');
  const pad = $('#pinPad');
  if (!modal || !dotsBox || !pad) return;

  let code = '';
  let pinLen = 4;
  let onSuccess = null;
  let busy = false;

  /* ------------------------------------------------------------------
     Kilit durumu (tarayıcı oturumu)
  ------------------------------------------------------------------ */
  const flagKey = () => `bb_pin_ok_${store.siteId}`;

  const isUnlocked = () => {
    try { return sessionStorage.getItem(flagKey()) === '1'; } catch { return false; }
  };

  const setUnlocked = (on) => {
    try {
      if (on) sessionStorage.setItem(flagKey(), '1');
      else sessionStorage.removeItem(flagKey());
    } catch { /* yoksay */ }
  };

  /* ------------------------------------------------------------------
     Görsel
  ------------------------------------------------------------------ */
  function paintDots() {
    dotsBox.innerHTML = '';
    for (let i = 0; i < pinLen; i++) {
      const dot = document.createElement('span');
      dot.className = 'adm-pinbox__dot' + (i < code.length ? ' is-filled' : '');
      dotsBox.appendChild(dot);
    }
  }

  function showError(msg) {
    errBox.textContent = msg || '';
    if (msg) {
      dotsBox.classList.add('is-error');
      setTimeout(() => dotsBox.classList.remove('is-error'), 500);
    }
  }

  function reset() {
    code = '';
    busy = false;
    showError('');
    paintDots();
    const btn = $('#pinSubmit');
    if (btn) btn.disabled = true;
  }

  /* ------------------------------------------------------------------
     Tuş takımı
  ------------------------------------------------------------------ */
  function press(digit) {
    if (busy) return;
    if (code.length >= 6) return;
    code += digit;
    showError('');
    paintDots();
    if (code.length >= 4) {
      const btn = $('#pinSubmit');
      if (btn) btn.disabled = false;
    }
    if (pinLen && code.length === pinLen) submit();
  }

  function backspace() {
    if (busy) return;
    code = code.slice(0, -1);
    showError('');
    paintDots();
    const btn = $('#pinSubmit');
    if (btn) btn.disabled = code.length < 4;
  }

  function clearAll() {
    reset();
  }

  /* ------------------------------------------------------------------
     Doğrulama
  ------------------------------------------------------------------ */
  async function submit() {
    if (busy || code.length < 4) return;
    busy = true;
    const btn = $('#pinSubmit');
    if (btn) btn.disabled = true;
    dotsBox.classList.add('is-checking');

    try {
      await store.pin.verify(code);
      setUnlocked(true);
      modal.classList.remove('is-open');
      reset();
      const cb = onSuccess;
      onSuccess = null;
      if (cb) cb();
    } catch (err) {
      busy = false;
      dotsBox.classList.remove('is-checking');
      showError(err.message || 'Yanlış PIN.');
      code = '';
      paintDots();
      const b = $('#pinSubmit');
      if (b) b.disabled = true;
    }
  }

  /* ------------------------------------------------------------------
     Kartı aç / kapat
  ------------------------------------------------------------------ */
  function open(callback, title) {
    onSuccess = callback || null;
    reset();
    const titleEl = $('#pinModalTitle');
    if (titleEl && title) titleEl.textContent = title;
    modal.classList.add('is-open');
    setTimeout(() => {
      const first = pad.querySelector('[data-pin="1"]');
      if (first) first.focus();
    }, 80);
  }

  /**
   * Kilitli ekranı açmadan önce PIN ister.
   * @param {Function} callback Kilit açıldıktan sonra çalışacak işlem
   * @param {string} title Kart başlığı
   * @returns {boolean} true → kilit zaten açıkmış, callback çalıştı
   */
  function requireUnlock(callback, title) {
    if (isUnlocked()) {
      if (callback) callback();
      return true;
    }
    open(callback, title);
    return false;
  }

  /* ------------------------------------------------------------------
     Olaylar
  ------------------------------------------------------------------ */
  pad.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pin]');
    if (!btn) return;
    const key = btn.dataset.pin;
    if (key === 'back') backspace();
    else if (key === 'clear') clearAll();
    else if (/^\d$/.test(key)) press(key);
  });

  const submitBtn = $('#pinSubmit');
  if (submitBtn) submitBtn.addEventListener('click', submit);

  /* Klavye ile giriş */
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { modal.classList.remove('is-open'); reset(); return; }
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
    if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
  });

  /* ------------------------------------------------------------------
     Dışa aç
  ------------------------------------------------------------------ */
  window.BerberPin = {
    isUnlocked,
    open,
    require: requireUnlock,
    lock() { setUnlocked(false); },
    refreshLength: async () => {
      const st = await store.pin.status();
      if (st && st.length) { pinLen = st.length; paintDots(); }
      return st;
    }
  };

  /* ------------------------------------------------------------------
     Başlat — PIN uzunluğunu öğren
  ------------------------------------------------------------------ */
  store.pin.status().then((st) => {
    if (st && typeof st.length === 'number') { pinLen = st.length; paintDots(); }
  });
})();
