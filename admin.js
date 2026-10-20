const JOBS_KEY = 'beyaz_admin_jobs';
const SVCS_KEY = 'beyaz_admin_services';
const MASTERS_KEY = 'beyaz_admin_masters';

const DEFAULT_SVCS = [
  { name: 'Erkek Saç Kesimi', price: 200 },
  { name: 'Sakal Tıraşı', price: 150 },
  { name: 'Saç & Sakal Paketi', price: 300 }
];
const DEFAULT_MASTERS = ['Usta 1', 'Usta 2', 'Usta 3'];

// ---------- Storage helpers ----------
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch {} }
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
function getMasters() {
  try {
    const s = JSON.parse(safeGet(MASTERS_KEY));
    if (Array.isArray(s) && s.length) return s;
  } catch {}
  return [...DEFAULT_MASTERS];
}
function saveMasters(m) { safeSet(MASTERS_KEY, JSON.stringify(m)); }

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function todayISO() { return new Date().toISOString().split('T')[0]; }
function nowTime() {
  const n = new Date();
  return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function svcPrice(name) { const s = getSvcs().find(x => x.name === name); return s ? s.price : 0; }

// ---------- State ----------
const state = {
  selected: [],   // service names in transaction
  master: null,
  manualDelta: 0, // adjustment on top of auto sum
};

function autoSum() { return state.selected.reduce((a, n) => a + svcPrice(n), 0); }
function totalAmount() { return autoSum() + state.manualDelta; }

// ---------- Stats ----------
function renderStats() {
  const jobs = getJobs();
  const today = todayISO();
  const thisMonth = today.slice(0,7);
  const todayJobs = jobs.filter(j => j.date === today);
  const monthJobs = jobs.filter(j => j.date.startsWith(thisMonth));
  document.getElementById('stToday').textContent = todayJobs.length;
  document.getElementById('stTodayAmt').textContent = sum(todayJobs) + '₺';
  document.getElementById('stMonth').textContent = monthJobs.length;
  document.getElementById('stMonthAmt').textContent = sum(monthJobs) + '₺';
  document.getElementById('stAll').textContent = jobs.length;
  document.getElementById('stAllAmt').textContent = sum(jobs) + '₺';
  const counts = {};
  jobs.forEach(j => (j.services || [j.service]).forEach(s => counts[s] = (counts[s]||0)+1));
  let top = '—', max = 0;
  for (const k in counts) if (counts[k] > max) { max = counts[k]; top = k; }
  document.getElementById('stTop').textContent = top;
}
function sum(arr) { return arr.reduce((a,b) => a + (b.amount||0), 0); }

// ---------- Service boxes ----------
function renderServices() {
  const container = document.getElementById('svcBoxes');
  container.innerHTML = '';
  getSvcs().forEach(s => {
    const box = document.createElement('div');
    box.className = 'adm-svcbox' + (state.selected.includes(s.name) ? ' selected' : '');
    box.dataset.name = s.name;
    box.innerHTML = `
      <div class="name">${escapeHtml(s.name)}</div>
      <div class="price">Fiyat: <strong>${s.price} ₺</strong></div>
      <div class="detail"><span class="fee">${s.price} ₺</span> — tıkla/kaldır</div>
    `;
    box.addEventListener('click', () => {
      box.classList.toggle('open');
      if (state.selected.includes(s.name)) {
        state.selected = state.selected.filter(x => x !== s.name);
      } else {
        state.selected.push(s.name);
      }
      box.classList.toggle('selected', state.selected.includes(s.name));
      renderAll();
    });
    container.appendChild(box);
  });
  // presets for amount: use selected service prices + common
  renderPresets();
}

function renderPresets() {
  const container = document.getElementById('amtPresets');
  container.innerHTML = '';
  const vals = [50, 100, 150, 200, 250, 300, 400, 500];
  vals.forEach(v => {
    const b = document.createElement('button');
    b.className = 'adm-preset';
    b.textContent = v + ' ₺';
    b.addEventListener('click', () => {
      state.manualDelta = v - autoSum();
      renderAll();
    });
    container.appendChild(b);
  });
}

// ---------- Masters ----------
function renderMasters() {
  const container = document.getElementById('masterBoxes');
  container.innerHTML = '';
  getMasters().forEach(m => {
    const box = document.createElement('div');
    box.className = 'adm-masterbox' + (state.master === m ? ' selected' : '');
    box.textContent = m;
    box.addEventListener('click', () => {
      state.master = (state.master === m) ? null : m;
      renderMasters();
      renderSummary();
    });
    container.appendChild(box);
  });
}

// ---------- Extra chips ----------
function renderExtras() {
  const container = document.getElementById('extraChips');
  container.innerHTML = '';
  // extras = all selected except first
  state.selected.slice(1).forEach((name, i) => {
    const chip = document.createElement('span');
    chip.className = 'adm-chip';
    chip.innerHTML = `${escapeHtml(name)} <button data-i="${i+1}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      state.selected.splice(i+1, 1);
      renderAll();
    });
    container.appendChild(chip);
  });
  if (!state.selected.slice(1).length) {
    container.innerHTML = '<span style="color:var(--muted);font-size:12px;">Ekstra yok</span>';
  }
}

// ---------- Summary ----------
function renderSummary() {
  const container = document.getElementById('summaryList');
  container.innerHTML = '';
  state.selected.forEach(name => {
    const div = document.createElement('div');
    div.innerHTML = `<span>${escapeHtml(name)}</span><span>${svcPrice(name)} ₺</span>`;
    container.appendChild(div);
  });
  if (state.master) {
    const div = document.createElement('div');
    div.innerHTML = `<span>Usta</span><span>${escapeHtml(state.master)}</span>`;
    container.appendChild(div);
  }
  document.getElementById('amountDisplay').textContent = totalAmount() + ' ₺';
  document.getElementById('totalAmt').textContent = totalAmount() + ' ₺';
}

function renderAll() {
  renderServices();
  renderMasters();
  renderExtras();
  renderSummary();
}

// ---------- Amount buttons ----------
document.querySelectorAll('.adm-amtbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const d = parseInt(btn.dataset.delta);
    state.manualDelta += d;
    renderSummary();
  });
});

// ---------- Complete ----------
document.getElementById('completeBtn').addEventListener('click', () => {
  const msg = document.getElementById('completeMsg');
  msg.textContent = '';
  if (!state.selected.length) { msg.style.color = '#ff6b6b'; msg.textContent = 'Hizmet seçin.'; return; }
  if (!state.master) { msg.style.color = '#ff6b6b'; msg.textContent = 'Usta seçin.'; return; }
  const job = {
    id: 'J' + Date.now(),
    date: todayISO(),
    time: nowTime(),
    master: state.master,
    services: [...state.selected],
    service: state.selected.join(' + '),
    amount: totalAmount(),
    createdAt: new Date().toISOString()
  };
  const jobs = getJobs();
  jobs.push(job);
  saveJobs(jobs);
  // reset
  state.selected = [];
  state.master = null;
  state.manualDelta = 0;
  renderAll();
  renderStats();
  msg.style.color = '#7ddf8a';
  msg.textContent = 'Kaydedildi ✓';
  setTimeout(() => msg.textContent = '', 1500);
});

// ---------- Modals helpers ----------
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// History
document.getElementById('histBtn').addEventListener('click', () => { renderJobs(); openModal('histModal'); });
document.getElementById('histClose').addEventListener('click', () => closeModal('histModal'));

function renderJobs() {
  const tbody = document.getElementById('jobBody');
  tbody.innerHTML = '';
  let jobs = getJobs();
  const from = document.getElementById('fFrom').value;
  const to = document.getElementById('fTo').value;
  const search = document.getElementById('fSearch').value.trim();
  if (from) jobs = jobs.filter(j => j.date >= from);
  if (to) jobs = jobs.filter(j => j.date <= to);
  if (search) {
    const q = search.toLowerCase();
    jobs = jobs.filter(j => ((j.services||[j.service]).join(' ') + ' ' + (j.master||'')).toLowerCase().includes(q));
  }
  jobs.sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time));
  const empty = document.getElementById('jobEmpty');
  if (!jobs.length) { empty.style.display = 'block'; return; } else empty.style.display = 'none';
  jobs.forEach(j => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(j.date)}</td>
      <td>${j.time}</td>
      <td>${escapeHtml(j.master||'—')}</td>
      <td>${escapeHtml((j.services||[j.service]).join(', '))}</td>
      <td><strong>${j.amount} ₺</strong></td>
      <td><button class="adm-del" data-id="${j.id}">🗑</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.adm-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
      saveJobs(getJobs().filter(j => j.id !== btn.dataset.id));
      renderJobs();
      renderStats();
    });
  });
}
document.getElementById('applyFilter').addEventListener('click', renderJobs);
document.getElementById('clearFilter').addEventListener('click', () => {
  document.getElementById('fFrom').value = '';
  document.getElementById('fTo').value = '';
  document.getElementById('fSearch').value = '';
  renderJobs();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  const jobs = getJobs();
  if (!jobs.length) { alert('Dışa aktarılacak kayıt yok.'); return; }
  const header = ['Tarih','Saat','Usta','Hizmetler','Ücret'];
  const rows = jobs.map(j => [j.date, j.time, j.master||'', (j.services||[j.service]).join(' + '), j.amount]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'beyaz-kuafor-is-gecmisi.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Settings
document.getElementById('settBtn').addEventListener('click', () => { renderSettings(); openModal('settModal'); });
document.getElementById('settClose').addEventListener('click', () => closeModal('settModal'));

function renderSettings() {
  // services
  const svcContainer = document.getElementById('svcList');
  svcContainer.innerHTML = '';
  getSvcs().forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'adm-svcrow';
    row.innerHTML = `<span>${escapeHtml(s.name)}</span><input type="number" value="${s.price}" data-idx="${idx}" min="0" /><button data-del="${idx}">🗑</button>`;
    svcContainer.appendChild(row);
  });
  svcContainer.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      const svcs = getSvcs();
      svcs[inp.dataset.idx].price = parseFloat(inp.value) || 0;
      saveSvcs(svcs);
      renderServices();
    });
  });
  svcContainer.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svcs = getSvcs();
      svcs.splice(btn.dataset.del, 1);
      saveSvcs(svcs);
      renderSettings();
      renderServices();
    });
  });
  // masters
  const mContainer = document.getElementById('masterList');
  mContainer.innerHTML = '';
  getMasters().forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'adm-svcrow';
    row.innerHTML = `<span>${escapeHtml(m)}</span><button data-del="${idx}">🗑</button>`;
    mContainer.appendChild(row);
  });
  mContainer.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ms = getMasters();
      ms.splice(btn.dataset.del, 1);
      saveMasters(ms);
      renderSettings();
      renderMasters();
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
  renderSettings();
  renderServices();
});
document.getElementById('addMasterBtn').addEventListener('click', () => {
  const name = document.getElementById('newMasterName').value.trim();
  if (!name) { alert('Usta adı girin.'); return; }
  const ms = getMasters();
  ms.push(name);
  saveMasters(ms);
  document.getElementById('newMasterName').value = '';
  renderSettings();
  renderMasters();
});

// Quick add service modal
document.getElementById('addSvcQuick').addEventListener('click', () => openModal('addSvcModal'));
document.getElementById('addSvcClose').addEventListener('click', () => closeModal('addSvcModal'));
document.getElementById('qsSave').addEventListener('click', () => {
  const name = document.getElementById('qsName').value.trim();
  const price = parseFloat(document.getElementById('qsPrice').value);
  if (!name || isNaN(price)) { alert('Bilgileri girin.'); return; }
  const svcs = getSvcs();
  svcs.push({ name, price });
  saveSvcs(svcs);
  document.getElementById('qsName').value = '';
  document.getElementById('qsPrice').value = '';
  closeModal('addSvcModal');
  renderServices();
});

// Quick add master modal
document.getElementById('addMasterQuick').addEventListener('click', () => openModal('addMasterModal'));
document.getElementById('addMasterClose').addEventListener('click', () => closeModal('addMasterModal'));
document.getElementById('qmSave').addEventListener('click', () => {
  const name = document.getElementById('qmName').value.trim();
  if (!name) { alert('Ad girin.'); return; }
  const ms = getMasters();
  ms.push(name);
  saveMasters(ms);
  document.getElementById('qmName').value = '';
  closeModal('addMasterModal');
  renderMasters();
});

// Extra picker
document.getElementById('extraPickBtn').addEventListener('click', () => {
  const list = document.getElementById('extraPickList');
  list.innerHTML = '';
  getSvcs().forEach(s => {
    const box = document.createElement('div');
    box.className = 'adm-svcbox';
    box.innerHTML = `<div class="name">${escapeHtml(s.name)}</div><div class="price"><strong>${s.price} ₺</strong></div>`;
    box.addEventListener('click', () => {
      state.selected.push(s.name);
      closeModal('extraModal');
      renderAll();
    });
    list.appendChild(box);
  });
  openModal('extraModal');
});
document.getElementById('extraClose').addEventListener('click', () => closeModal('extraModal'));

// Close modals on backdrop click
document.querySelectorAll('.adm-modal').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('open'); });
});

// Init
renderStats();
renderAll();
