const PW_KEY = 'beyaz_admin_pw';
const JOBS_KEY = 'beyaz_admin_jobs';
const SVCS_KEY = 'beyaz_admin_services';
const SESSION_KEY = 'beyaz_admin_session';

const DEFAULT_PW = 'beyaz2026';
const DEFAULT_SVCS = [
  { name: 'Erkek Saç Kesimi', price: 200 },
  { name: 'Sakal Tıraşı', price: 150 },
  { name: 'Saç & Sakal Paketi', price: 300 }
];

// ---------- Storage helpers (safe) ----------
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch {} }
function safeSessionGet(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
function safeSessionSet(key, val) { try { sessionStorage.setItem(key, val); } catch {} }
function safeSessionRemove(key) { try { sessionStorage.removeItem(key); } catch {} }

function getPw() { return safeGet(PW_KEY) || DEFAULT_PW; }
function setPw(p) { safeSet(PW_KEY, p); }
function getJobs() { try { return JSON.parse(safeGet(JOBS_KEY) || '[]'); } catch { return []; } }
function saveJobs(j) { safeSet(JOBS_KEY, JSON.stringify(j)); }
function getSvcs() {
  try {
    const s = JSON.parse(safeGet(SVCS_KEY));
    if (Array.isArray(s) && s.length) return s;
  } catch {}
  return DEFAULT_SVCS.map(x => ({...x}));
}
function saveSvcs(s) { safeSet(SVCS_KEY, JSON.stringify(s)); }

function isLoggedIn() { return safeSessionGet(SESSION_KEY) === '1'; }

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function todayISO() { return new Date().toISOString().split('T')[0]; }
function monthKey(iso) { return iso.slice(0,7); }

// ---------- Auth ----------
const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');

function isLoggedIn() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
function showApp() {
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  initDashboard();
}
function showLogin() {
  loginScreen.classList.remove('hidden');
  app.classList.add('hidden');
}

const loginBtn = document.querySelector('#loginForm button[type="submit"]');
function doLogin() {
  const pw = document.getElementById('pw').value;
  if (pw === getPw()) {
    safeSessionSet(SESSION_KEY, '1');
    showApp();
  } else {
    document.getElementById('loginErr').textContent = 'Şifre hatalı.';
  }
}
document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); doLogin(); });
if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); doLogin(); });

document.getElementById('logoutBtn').addEventListener('click', () => {
  safeSessionRemove(SESSION_KEY);
  showLogin();
});

if (isLoggedIn()) showApp(); else showLogin();

// ---------- Dashboard ----------
let currentFilter = { from: '', to: '', search: '' };

function initDashboard() {
  // date defaults
  document.getElementById('jDate').value = todayISO();
  const now = new Date();
  document.getElementById('jTime').value = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

  populateServiceSelect();
  renderSvcList();
  renderStats();
  renderJobs();
}

function populateServiceSelect() {
  const sel = document.getElementById('jService');
  sel.innerHTML = '';
  getSvcs().forEach(s => {
    const o = document.createElement('option');
    o.value = s.name; o.textContent = `${s.name} — ${s.price} ₺`;
    o.dataset.price = s.price;
    sel.appendChild(o);
  });
  updateAmountFromService();
  sel.addEventListener('change', updateAmountFromService);
}

function updateAmountFromService() {
  const sel = document.getElementById('jService');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.price) document.getElementById('jAmount').value = opt.dataset.price;
}

// Add job
document.getElementById('jobForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = document.getElementById('jobErr');
  err.textContent = '';
  const date = document.getElementById('jDate').value;
  const time = document.getElementById('jTime').value;
  const customer = document.getElementById('jCustomer').value.trim();
  const service = document.getElementById('jService').value;
  const amount = parseFloat(document.getElementById('jAmount').value);
  const note = document.getElementById('jNote').value.trim();
  if (!date) { err.textContent = 'Tarih zorunludur.'; return; }
  if (isNaN(amount) || amount < 0) { err.textContent = 'Geçerli bir ücret girin.'; return; }
  const job = {
    id: 'J' + Date.now(),
    date, time: time || '—',
    customer: customer || '—',
    service, amount, note,
    createdAt: new Date().toISOString()
  };
  const jobs = getJobs();
  jobs.push(job);
  saveJobs(jobs);
  // reset form
  document.getElementById('jCustomer').value = '';
  document.getElementById('jNote').value = '';
  document.getElementById('jDate').value = todayISO();
  renderStats();
  renderJobs();
  // subtle feedback
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Kaydedildi ✓';
  setTimeout(() => btn.textContent = orig, 1200);
});

// Stats
function renderStats() {
  const jobs = getJobs();
  const today = todayISO();
  const thisMonth = today.slice(0,7);
  const todayJobs = jobs.filter(j => j.date === today);
  const monthJobs = jobs.filter(j => j.date.startsWith(thisMonth));
  document.getElementById('stToday').textContent = todayJobs.length;
  document.getElementById('stTodayAmt').textContent = sum(todayJobs) + ' ₺';
  document.getElementById('stMonth').textContent = monthJobs.length;
  document.getElementById('stMonthAmt').textContent = sum(monthJobs) + ' ₺';
  document.getElementById('stAll').textContent = jobs.length;
  document.getElementById('stAllAmt').textContent = sum(jobs) + ' ₺';
  // top service
  const counts = {};
  jobs.forEach(j => counts[j.service] = (counts[j.service]||0) + 1);
  let top = '—', max = 0;
  for (const k in counts) if (counts[k] > max) { max = counts[k]; top = k; }
  document.getElementById('stTop').textContent = top;
}
function sum(arr) { return arr.reduce((a,b) => a + (b.amount||0), 0); }

// Render jobs
function renderJobs() {
  const tbody = document.getElementById('jobBody');
  tbody.innerHTML = '';
  let jobs = getJobs();
  // filter
  const { from, to, search } = currentFilter;
  if (from) jobs = jobs.filter(j => j.date >= from);
  if (to) jobs = jobs.filter(j => j.date <= to);
  if (search) {
    const q = search.toLowerCase();
    jobs = jobs.filter(j => (j.customer + ' ' + j.service + ' ' + (j.note||'')).toLowerCase().includes(q));
  }
  jobs.sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time));

  const empty = document.getElementById('jobEmpty');
  if (!jobs.length) { empty.style.display = 'block'; return; } else empty.style.display = 'none';

  jobs.forEach(j => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(j.date)}</td>
      <td>${j.time}</td>
      <td>${escapeHtml(j.customer)}</td>
      <td>${escapeHtml(j.service)}</td>
      <td><strong>${j.amount} ₺</strong></td>
      <td>${escapeHtml(j.note||'')}</td>
      <td><button class="adm-del" data-id="${j.id}" title="Sil">🗑</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.adm-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
      const id = btn.dataset.id;
      saveJobs(getJobs().filter(j => j.id !== id));
      renderStats();
      renderJobs();
    });
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Filters
document.getElementById('applyFilter').addEventListener('click', () => {
  currentFilter = {
    from: document.getElementById('fFrom').value,
    to: document.getElementById('fTo').value,
    search: document.getElementById('fSearch').value.trim()
  };
  renderJobs();
});
document.getElementById('clearFilter').addEventListener('click', () => {
  currentFilter = { from: '', to: '', search: '' };
  document.getElementById('fFrom').value = '';
  document.getElementById('fTo').value = '';
  document.getElementById('fSearch').value = '';
  renderJobs();
});

// CSV export
document.getElementById('exportBtn').addEventListener('click', () => {
  const jobs = getJobs();
  if (!jobs.length) { alert('Dışa aktarılacak kayıt yok.'); return; }
  const header = ['Tarih','Saat','Müşteri','Hizmet','Ücret','Not'];
  const rows = jobs.map(j => [j.date, j.time, j.customer, j.service, j.amount, j.note||'']);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'beyaz-kuafor-is-gecmisi.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Settings: services
function renderSvcList() {
  const container = document.getElementById('svcList');
  container.innerHTML = '';
  getSvcs().forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'adm-svcrow';
    row.innerHTML = `
      <span>${escapeHtml(s.name)}</span>
      <input type="number" value="${s.price}" data-idx="${idx}" min="0" />
      <button data-del="${idx}" title="Sil">🗑</button>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      const svcs = getSvcs();
      svcs[inp.dataset.idx].price = parseFloat(inp.value) || 0;
      saveSvcs(svcs);
      populateServiceSelect();
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svcs = getSvcs();
      svcs.splice(btn.dataset.del, 1);
      saveSvcs(svcs);
      renderSvcList();
      populateServiceSelect();
    });
  });
}

document.getElementById('addSvcBtn').addEventListener('click', () => {
  const name = document.getElementById('newSvcName').value.trim();
  const price = parseFloat(document.getElementById('newSvcPrice').value);
  if (!name) { alert('Hizmet adı girin.'); return; }
  if (isNaN(price)) { alert('Fiyat girin.'); return; }
  const svcs = getSvcs();
  svcs.push({ name, price });
  saveSvcs(svcs);
  document.getElementById('newSvcName').value = '';
  document.getElementById('newSvcPrice').value = '';
  renderSvcList();
  populateServiceSelect();
});

// Password change
document.getElementById('pwForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const p1 = document.getElementById('newPw').value;
  const p2 = document.getElementById('newPw2').value;
  const err = document.getElementById('pwErr');
  err.textContent = '';
  if (p1.length < 4) { err.textContent = 'Şifre en az 4 karakter olmalı.'; return; }
  if (p1 !== p2) { err.textContent = 'Şifreler eşleşmiyor.'; return; }
  setPw(p1);
  err.style.color = '#7ddf8a';
  err.textContent = 'Şifre güncellendi.';
  document.getElementById('newPw').value = '';
  document.getElementById('newPw2').value = '';
});
