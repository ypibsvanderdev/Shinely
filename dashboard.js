// ============================================================
//  SHINELY DASHBOARD.JS — Firebase Edition
// ============================================================

let currentFilter = 'all';
let cachedBookings = [];
let cachedUsers = [];
let cachedPhotos = [];
let cachedRatings = [];

// --- INIT WITH FIREBASE AUTH ---
onAuthReady(async (user) => {
  if (!user || !isAdmin(user)) {
    window.location.href = 'index.html';
    return;
  }

  const session = getSession();
  const name = session?.firstName || user.displayName?.split(' ')[0] || 'Admin';
  document.getElementById('dashGreeting').textContent = `Welcome back, ${name}!`;
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  // Load data
  await loadAllData();
});

function doLogout() { signOut(); }

async function loadAllData() {
  try {
    cachedBookings = await getBookings();
    cachedUsers = await getAllUsers();
    cachedPhotos = await getPhotos();
    cachedRatings = await getRatings();
    
    // Hide loading, show content
    document.getElementById('dashLoading').style.display = 'none';
    document.getElementById('statsRow').style.display = '';
    document.getElementById('tab-bookings').style.display = '';

    renderStats();
    renderBookingsView();
    renderCustomersView();
    populateEmailPicker();
    renderPhotosView();
    renderRatingsView();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('dashLoading').innerHTML = '<p style="color:#ef4444">❌ Error loading data. Check Firebase config.</p>';
  }
}

// --- TABS ---
function showTab(name, el) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.add('hidden'));
  const tab = document.getElementById('tab-' + name);
  if (tab) { tab.classList.remove('hidden'); tab.style.display = ''; }
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');
  if (name === 'customers') renderCustomersView();
  if (name === 'email') populateEmailPicker();
  if (name === 'photos') renderPhotosView();
  if (name === 'ratings') renderRatingsView();
  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('sb-open');
  return false;
}

// --- STATS ---
function renderStats() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('statTotal').textContent     = cachedBookings.length;
  document.getElementById('statPending').textContent   = cachedBookings.filter(b => b.status === 'pending').length;
  document.getElementById('statConfirmed').textContent = cachedBookings.filter(b => b.status === 'confirmed').length;
  document.getElementById('statToday').textContent     = cachedBookings.filter(b => b.date === today).length;
}

// --- BOOKINGS TABLE ---
function filterBookings(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBookingsView();
}

function renderBookingsView() {
  const search = (document.getElementById('bookingSearch')?.value || '').toLowerCase();
  let list = [...cachedBookings];
  if (currentFilter !== 'all') list = list.filter(b => b.status === currentFilter);
  if (search) list = list.filter(b =>
    `${b.firstName} ${b.lastName} ${b.email}`.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('bookingsTbody');
  const noEl  = document.getElementById('noBookings');
  tbody.innerHTML = '';
  noEl.classList.toggle('hidden', list.length > 0);
  if (!list.length) return;

  list.forEach(b => {
    let serviceDisplay = b.service || '—';
    if (b.service && b.service.includes('estimed')) {
      serviceDisplay = `<span class="badge badge-estimate-warn" title="${b.service}">⚠️ Count on Arrival</span>`;
    }
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${b.firstName || ''} ${b.lastName || ''}</strong></td>
      <td>${b.email || '—'}</td>
      <td>${b.phone || '—'}</td>
      <td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${serviceDisplay}</td>
      <td>${b.date || '—'}</td>
      <td>${b.time || '—'}</td>
      <td>${b.payment || 'cash'}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td>
        <button class="act-btn act-view" onclick="viewBooking('${b.id}')">View</button>
        ${b.status !== 'confirmed'  ? `<button class="act-btn act-confirm" onclick="setBookingStatus('${b.id}','confirmed')">✓</button>` : ''}
        ${b.status !== 'cancelled'  ? `<button class="act-btn act-cancel"  onclick="setBookingStatus('${b.id}','cancelled')">✕</button>`  : ''}
        <button class="act-btn act-email" onclick="quickEmail('${b.email}','${b.firstName}')">📧</button>
        <button class="act-btn act-delete" onclick="confirmDelete('${b.id}')">🗑️</button>
      </td>`;
    tbody.appendChild(row);
  });
  renderStats();
}

async function setBookingStatus(id, status) {
  try {
    await updateBookingStatus(id, status);
    // Update cache
    const b = cachedBookings.find(x => x.id === id);
    if (b) b.status = status;
    renderBookingsView();
    closeDetail();
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating booking status.');
  }
}

// --- DELETE ---
let deleteTargetId = null;
function confirmDelete(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
      await deleteBooking(deleteTargetId);
      cachedBookings = cachedBookings.filter(b => b.id !== deleteTargetId);
      renderBookingsView();
      closeDeleteModal();
      closeDetail();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking.');
    }
  };
}
function closeDeleteModal() {
  document.getElementById('deleteModal').classList.add('hidden');
  deleteTargetId = null;
}
document.getElementById('deleteModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

// --- VIEW BOOKING DETAIL ---
function viewBooking(id) {
  const b = cachedBookings.find(x => x.id === id);
  if (!b) return;
  const fmt = (v) => v || '—';
  const createdAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : (b.createdAt ? new Date(b.createdAt).toLocaleString() : '—');

  let serviceDisplay = b.service || '—';
  if (b.service && b.service.includes('estimed')) {
    serviceDisplay = `<span class="badge-estimate-warn-large">${b.service}</span>`;
  }

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-row"><strong>Name</strong><span>${b.firstName} ${b.lastName}</span></div>
    <div class="detail-row"><strong>Email</strong><span>${b.email}</span></div>
    <div class="detail-row"><strong>Phone</strong><span>${b.phone}</span></div>
    <div class="detail-row"><strong>Address</strong><span>${b.address}</span></div>
    <div class="detail-row"><strong>Service</strong><span>${serviceDisplay}</span></div>
    <div class="detail-row"><strong>Interior</strong><span>${b.interior}</span></div>
    <div class="detail-row"><strong>Date</strong><span>${b.date}</span></div>
    <div class="detail-row"><strong>Time</strong><span>${b.time}</span></div>
    <div class="detail-row"><strong>Payment</strong><span>${fmt(b.payment)}</span></div>
    <div class="detail-row"><strong>Status</strong><span class="badge badge-${b.status}">${b.status}</span></div>
    <div class="detail-row"><strong>Notes</strong><span>${fmt(b.notes)}</span></div>
    <div class="detail-row"><strong>Booked At</strong><span>${createdAt}</span></div>`;

  document.getElementById('detailActions').innerHTML = `
    ${b.status !== 'confirmed' ? `<button class="act-btn act-confirm" style="padding:9px 16px" onclick="setBookingStatus('${b.id}','confirmed')">✓ Confirm Booking</button>` : ''}
    ${b.status !== 'cancelled' ? `<button class="act-btn act-cancel"  style="padding:9px 16px" onclick="setBookingStatus('${b.id}','cancelled')">✕ Cancel Booking</button>`  : ''}
    <button class="act-btn act-email" style="padding:9px 16px" onclick="quickEmail('${b.email}','${b.firstName}')">📧 Email Customer</button>
    <button class="act-btn act-delete" style="padding:9px 16px" onclick="confirmDelete('${b.id}')">🗑️ Delete</button>`;

  document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetail() { document.getElementById('detailModal').classList.add('hidden'); }
document.getElementById('detailModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('detailModal')) closeDetail();
});

// --- CUSTOMERS TABLE ---
function renderCustomersView() {
  const search = (document.getElementById('customerSearch')?.value || '').toLowerCase();
  let users = [...cachedUsers];
  if (search) users = users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search));

  const tbody = document.getElementById('customersTbody');
  const noEl  = document.getElementById('noCustomers');
  tbody.innerHTML = '';
  noEl.classList.toggle('hidden', users.length > 0);

  users.forEach(u => {
    const count = cachedBookings.filter(b => b.email === u.email || b.userId === u.uid).length;
    const joinedDate = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${u.firstName || ''} ${u.lastName || ''}</strong></td>
      <td>${u.email || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td>${joinedDate}</td>
      <td>${count}</td>
      <td>
        <button class="act-btn act-email" onclick="quickEmail('${u.email}','${u.firstName}')">📧 Email</button>
      </td>`;
    tbody.appendChild(row);
  });
}

// --- EMAIL ---
function populateEmailPicker() {
  const sel = document.getElementById('emailCustomerPick');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Or pick a customer —</option>';
  cachedUsers.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.email;
    opt.textContent = `${u.firstName} ${u.lastName} (${u.email})`;
    sel.appendChild(opt);
  });
}

function pickCustomer(sel) {
  if (sel.value) document.getElementById('emailTo').value = sel.value;
}

function quickEmail(email, name) {
  showTab('email', document.querySelector('[data-tab="email"]'));
  document.getElementById('emailTo').value = email;
  loadTemplate('reschedule', name);
}

const TEMPLATES = {
  full: {
    subject: 'About Your Shinely Booking — Schedule Update',
    body: `Hi there,\n\nThanks for booking with Shinely! Unfortunately our schedule is full on your requested date. We'd love to still help you — could we reschedule for another day?\n\nPlease reply to this email or text/call us at (224) 855-1121 and we'll find a time that works.\n\nSorry for the inconvenience!\n\n— The Shinely Crew\n📍 St. Charles, IL`
  },
  confirm: {
    subject: '✅ Your Shinely Booking is Confirmed!',
    body: `Hi there,\n\nGreat news — your window cleaning appointment with Shinely is confirmed!\n\nWe'll show up at your place on the date and time you selected. Please make sure there's access to the windows.\n\nIf anything changes, just text or call us at (224) 855-1121.\n\nSee you soon!\n\n— The Shinely Crew\n📍 St. Charles, IL`
  },
  reschedule: {
    subject: 'Shinely — We Need to Reschedule',
    body: `Hi there,\n\nSomething came up on our end and we need to reschedule your window cleaning appointment. We're really sorry about this!\n\nCould you let us know some dates and times that work for you? You can reply here or text/call us at (224) 855-1121.\n\nWe'll make it right!\n\n— The Shinely Crew\n📍 St. Charles, IL`
  },
  blank: { subject: '', body: '' }
};

function loadTemplate(key, name) {
  const t = TEMPLATES[key];
  if (!t) return;
  document.getElementById('emailSubject').value = t.subject;
  document.getElementById('emailBody').value    = name
    ? t.body.replace('Hi there,', `Hi ${name},`)
    : t.body;
}

function sendEmail() {
  const to      = document.getElementById('emailTo').value;
  const subject = encodeURIComponent(document.getElementById('emailSubject').value);
  const body    = encodeURIComponent(document.getElementById('emailBody').value);
  if (!to) { alert('Please enter a customer email address.'); return; }
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

// --- EXPORT BOOKINGS ---
function exportBookings() {
  if (!cachedBookings.length) { alert('No bookings to export.'); return; }
  
  const headers = ['Name', 'Email', 'Phone', 'Address', 'Service', 'Interior', 'Date', 'Time', 'Payment', 'Status', 'Notes'];
  const rows = cachedBookings.map(b => [
    `${b.firstName} ${b.lastName}`,
    b.email, b.phone, b.address, b.service, b.interior,
    b.date, b.time, b.payment || 'cash', b.status, b.notes || ''
  ].map(v => `"${(v||'').replace(/"/g, '""')}"`).join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shinely-bookings-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- FIRESTORE: PHOTOS & RATINGS ---
async function getPhotos() {
  const snapshot = await db.collection('photos').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getRatings() {
  const snapshot = await db.collection('ratings').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function deleteRating(ratingId) {
  await db.collection('ratings').doc(ratingId).delete();
}

// --- PHOTOS RENDER ---
function renderPhotosView() {
  const list = document.getElementById('photosList');
  const noEl = document.getElementById('noPhotos');
  if (!list) return;
  list.innerHTML = '';
  noEl.classList.toggle('hidden', cachedPhotos.length > 0);
  if (!cachedPhotos.length) return;

  cachedPhotos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'photo-submission-card';
    
    const dateStr = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : (p.createdAt ? new Date(p.createdAt).toLocaleString() : '—');
    
    let galleryHtml = '';
    if (p.photos && p.photos.length > 0) {
      p.photos.forEach((imgSrc, idx) => {
        galleryHtml += `
          <div class="psc-photo-item">
            <img src="${imgSrc}" alt="Customer photo"/>
            <a href="${imgSrc}" download="photo-${p.name.replace(/\s+/g, '_')}-${idx}.jpg" class="psc-photo-download-btn">📥 Download</a>
          </div>`;
      });
    } else {
      galleryHtml = '<span style="color:var(--muted)">No photos uploaded</span>';
    }

    card.innerHTML = `
      <div class="psc-header">
        <div>
          <span class="psc-sender">${p.name}</span>
          <span class="psc-email">(${p.email})</span>
        </div>
        <span class="psc-date">${dateStr}</span>
      </div>
      ${p.note ? `<p class="psc-note">💬 ${p.note}</p>` : ''}
      <div class="psc-gallery">${galleryHtml}</div>`;
    list.appendChild(card);
  });
}

// --- RATINGS RENDER & ACTIONS ---
function renderRatingsView() {
  const list = document.getElementById('adminRatingsList');
  const noEl = document.getElementById('noAdminRatings');
  if (!list) return;
  list.innerHTML = '';
  noEl.classList.toggle('hidden', cachedRatings.length > 0);
  if (!cachedRatings.length) return;

  cachedRatings.forEach(r => {
    const card = document.createElement('div');
    card.className = 'admin-rating-card';
    
    const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—');
    const stars = '⭐'.repeat(r.rating);

    card.innerHTML = `
      <div class="arc-header">
        <div class="arc-stars">${stars}</div>
        <div class="arc-meta">
          <span class="arc-author">${r.name}</span>
          <span class="arc-date">${dateStr}</span>
        </div>
      </div>
      <p class="arc-text">"${r.text}"</p>
      <div class="arc-actions">
        <button class="arc-delete-btn" onclick="confirmDeleteRating('${r.id}')">🗑️ Delete</button>
      </div>`;
    list.appendChild(card);
  });
}

async function confirmDeleteRating(ratingId) {
  if (!confirm('Are you sure you want to delete this rating?')) return;
  try {
    await deleteRating(ratingId);
    cachedRatings = cachedRatings.filter(r => r.id !== ratingId);
    renderRatingsView();
  } catch (err) {
    console.error('Error deleting rating:', err);
    alert('Failed to delete rating.');
  }
}

async function addManualRating(e) {
  e.preventDefault();
  const name = document.getElementById('manName').value.trim();
  const rating = parseInt(document.getElementById('manRating').value) || 5;
  const text = document.getElementById('manText').value.trim();

  const form = document.getElementById('manualRatingForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;
  }

  try {
    const docRef = await db.collection('ratings').add({
      name,
      rating,
      text,
      userId: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update local cache and view
    cachedRatings.unshift({
      id: docRef.id,
      name,
      rating,
      text,
      userId: 'admin',
      createdAt: { toDate: () => new Date() }
    });

    renderRatingsView();
    form.reset();
    alert('Manual rating added successfully! ⭐');
  } catch (err) {
    console.error('Error adding manual rating:', err);
    alert('Failed to add manual rating.');
  } finally {
    if (submitBtn) {
      submitBtn.textContent = '⭐ Add Rating';
      submitBtn.disabled = false;
    }
  }
}
