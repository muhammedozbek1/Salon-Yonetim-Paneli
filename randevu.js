const STORAGE_KEY = 'beyaz_kuafor_randevular';

// ---------- State ----------
let selectedService = null;
let selectedDate = null;
let selectedSlot = null;
let currentStep = 1;

// ---------- Helpers ----------
function loadAppts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveAppts(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(t) { return t; }

function isSunday(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.getDay() === 0;
}
function isPastDate(iso) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso + 'T00:00:00');
  return d < today;
}
function isPastSlot(iso, slot) {
  const now = new Date();
  const d = new Date(iso + 'T' + slot + ':00');
  return d <= now;
}

// Working hours slots: 08:00..20:30 (last start 20:30 for 30min)
function generateSlots() {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 30) break;
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      slots.push(`${hh}:${mm}`);
    }
  }
  // ensure 20:30 included, 21:00 excluded as start
  return slots.filter(s => s <= '20:30');
}

function takenSlots(date) {
  return loadAppts()
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
}

// ---------- Step navigation ----------
function showStep(n) {
  currentStep = n;
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('step' + i);
    if (el) el.classList.toggle('hidden', i !== n);
  });
  document.querySelectorAll('.rv-step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active','done');
    if (sn === n) s.classList.add('active');
    else if (sn < n) s.classList.add('done');
  });
  window.scrollTo({ top: document.querySelector('.rv-steps').offsetTop - 80, behavior: 'smooth' });
}

// Step 1
document.querySelectorAll('.rv-svc').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.rv-svc').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedService = btn.dataset.service;
    document.getElementById('toStep2').disabled = false;
  });
});
document.getElementById('toStep2').addEventListener('click', () => {
  if (selectedService) showStep(2);
});

// Step 2
const dateInput = document.getElementById('date');
// min date today
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;
// default tomorrow-ish: today
dateInput.value = today;

function renderSlots() {
  const container = document.getElementById('slots');
  container.innerHTML = '';
  const dateErr = document.getElementById('dateError');
  dateErr.textContent = '';
  selectedSlot = null;
  document.getElementById('toStep3').disabled = true;

  if (!selectedDate) return;
  if (isPastDate(selectedDate)) { dateErr.textContent = 'Geçmiş bir tarih seçemezsiniz.'; return; }
  if (isSunday(selectedDate)) { dateErr.textContent = 'Pazar günleri kapalıyız. Lütfen başka bir gün seçin.'; return; }

  const taken = takenSlots(selectedDate);
  const slots = generateSlots();
  let any = false;
  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.className = 'rv-slot';
    btn.textContent = slot;
    if (taken.includes(slot)) {
      btn.classList.add('taken');
      btn.disabled = true;
    } else if (isPastSlot(selectedDate, slot)) {
      btn.classList.add('past');
      btn.disabled = true;
    } else {
      any = true;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.rv-slot').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSlot = slot;
        document.getElementById('toStep3').disabled = false;
      });
    }
    container.appendChild(btn);
  });
  if (!any) {
    const p = document.createElement('p');
    p.className = 'rv-slots__empty';
    p.textContent = 'Bu tarihte uygun saat kalmamış. Lütfen başka bir gün seçin.';
    container.appendChild(p);
  }
}

dateInput.addEventListener('change', () => {
  selectedDate = dateInput.value;
  renderSlots();
});
// initial
selectedDate = dateInput.value;
renderSlots();

document.getElementById('back1').addEventListener('click', () => showStep(1));
document.getElementById('toStep3').addEventListener('click', () => {
  if (selectedDate && selectedSlot) showStep(3);
});

// Step 3
document.getElementById('back2').addEventListener('click', () => showStep(2));
document.getElementById('infoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const note = document.getElementById('note').value.trim();
  const err = document.getElementById('infoError');
  err.textContent = '';
  if (!name) { err.textContent = 'Ad soyad zorunludur.'; return; }
  if (!phone || phone.replace(/\D/g,'').length < 10) { err.textContent = 'Geçerli bir telefon numarası girin.'; return; }

  const appt = {
    id: 'A' + Date.now(),
    service: selectedService,
    date: selectedDate,
    time: selectedSlot,
    name, phone, note,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  const list = loadAppts();
  // double-check slot not taken
  if (list.some(a => a.date === selectedDate && a.time === selectedSlot && a.status !== 'cancelled')) {
    err.textContent = 'Bu saat az önce doldu. Lütfen başka bir saat seçin.';
    showStep(2); renderSlots(); return;
  }
  list.push(appt);
  saveAppts(list);

  // confirmation
  const summary = document.getElementById('summary');
  summary.innerHTML = `
    <div><span>Randevu No</span><span>${appt.id}</span></div>
    <div><span>Hizmet</span><span>${appt.service}</span></div>
    <div><span>Tarih</span><span>${fmtDate(appt.date)}</span></div>
    <div><span>Saat</span><span>${appt.time}</span></div>
    <div><span>Ad Soyad</span><span>${appt.name}</span></div>
    <div><span>Telefon</span><span>${appt.phone}</span></div>
    ${appt.note ? `<div><span>Not</span><span>${appt.note}</span></div>` : ''}
  `;
  showStep(4);
  renderList(currentFilter || 'all');
});

// Step 4
document.getElementById('newAppt').addEventListener('click', () => {
  // reset
  selectedService = null; selectedDate = today; selectedSlot = null;
  document.querySelectorAll('.rv-svc').forEach(b => b.classList.remove('selected'));
  document.getElementById('toStep2').disabled = true;
  dateInput.value = today;
  renderSlots();
  document.getElementById('name').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('note').value = '';
  showStep(1);
});

// ---------- Appointments list ----------
let currentFilter = 'all';

function renderList(mode) {
  const container = document.getElementById('apptList');
  container.innerHTML = '';
  let list = loadAppts();
  if (mode === 'phone') {
    const phone = document.getElementById('lookupPhone').value.trim();
    if (phone) list = list.filter(a => a.phone.includes(phone.replace(/\s/g,'')));
  }
  // sort by date/time
  list.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  if (!list.length) {
    container.innerHTML = '<p class="rv-empty">Kayıtlı randevu bulunamadı.</p>';
    return;
  }
  list.forEach(a => {
    const div = document.createElement('div');
    div.className = 'rv-appt';
    const cancelled = a.status === 'cancelled';
    div.innerHTML = `
      <div class="rv-appt__info">
        <strong>${a.service}</strong>
        <span>${fmtDate(a.date)} · ${a.time} · ${a.name}</span>
        <span>${a.phone}${a.note ? ' · ' + a.note : ''}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="rv-appt__badge ${cancelled ? 'cancelled' : ''}">${cancelled ? 'İptal' : 'Onaylı'}</span>
        ${!cancelled ? `<div class="rv-appt__actions"><button class="btn btn--sm btn--ghost" data-cancel="${a.id}">İptal Et</button></div>` : ''}
      </div>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.cancel;
      if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;
      const list = loadAppts();
      const idx = list.findIndex(a => a.id === id);
      if (idx > -1) { list[idx].status = 'cancelled'; saveAppts(list); renderList(currentFilter); renderSlots(); }
    });
  });
}

document.getElementById('lookupBtn').addEventListener('click', () => { currentFilter = 'phone'; renderList('phone'); });
document.getElementById('showAllBtn').addEventListener('click', () => { currentFilter = 'all'; document.getElementById('lookupPhone').value = ''; renderList('all'); });

// initial list
renderList('all');
// refresh slots if date changed by cancellation
