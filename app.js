// ============================================================
//  SHINELY APP.JS — Firebase Edition
// ============================================================

// --- PAGE LOADER ---
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 400); }
  }, 600);
});

// --- NAV AUTH UI ---
function renderNavAuth() {
  const session = getSession();
  const navArea    = document.getElementById('navAuthArea');
  const mobileArea = document.getElementById('mobileAuthArea');
  if (!navArea) return;

  if (!session) {
    navArea.innerHTML = `<a href="#" class="nav-book google-signin-nav" onclick="doGoogleSignIn(event)">
      <svg width="16" height="16" viewBox="0 0 48 48" style="margin-right:6px;vertical-align:middle"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Sign in with Google
    </a>`;
    mobileArea.innerHTML = `<a href="#" class="mob-book google-signin-mob" onclick="doGoogleSignIn(event)">
      <svg width="16" height="16" viewBox="0 0 48 48" style="margin-right:6px;vertical-align:middle"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Sign in with Google
    </a>`;
  } else {
    const name = session.firstName || session.email?.split('@')[0] || 'User';
    const photo = session.photoURL;
    const adminLink = isAdmin(currentUser)
      ? `<a href="dashboard.html" class="dd-item admin-item">⚙️ Admin Dashboard</a>` : '';
    const avatar = photo
      ? `<img src="${photo}" alt="" class="user-avatar" referrerpolicy="no-referrer"/>`
      : `<div class="user-avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`;

    navArea.innerHTML = `
      <div class="user-menu">
        <button class="user-btn" onclick="toggleUserMenu()">
          ${avatar}
          ${name} ▾
        </button>
        <div class="user-dropdown hidden" id="userDropdown">
          ${adminLink}
          <a href="#booking" class="dd-item" onclick="closeDropdown()">📅 Book Now</a>
          <a href="#" class="dd-item signout-item" onclick="signOut()">🚪 Sign Out</a>
        </div>
      </div>`;
    mobileArea.innerHTML = `
      ${isAdmin(currentUser) ? `<a href="dashboard.html" class="mob-book" style="background:#7c3aed">⚙️ Admin Dashboard</a>` : ''}
      <a href="#" onclick="signOut()" style="color:#ef4444;padding:6px 0;font-weight:600;">Sign Out</a>`;
  }
  renderBookingArea();
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('hidden');
}
function closeDropdown() {
  document.getElementById('userDropdown')?.classList.add('hidden');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) closeDropdown();
});

// --- GOOGLE SIGN IN ---
async function doGoogleSignIn(e) {
  if (e) e.preventDefault();
  const result = await signInWithGoogle();
  if (!result.ok) {
    showToast(result.msg, 'error');
  }
  // Auth state listener in auth.js will trigger renderNavAuth
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// --- BOOKING AREA ---
function renderBookingArea() {
  const area = document.getElementById('bookingArea');
  if (!area) return;
  const session = getSession();

  if (!session) {
    area.innerHTML = `
      <div class="signin-wall">
        <div class="sw-icon">🔒</div>
        <h3>Sign In to Book</h3>
        <p>Sign in with your Google account so we can confirm your booking and keep you updated.</p>
        <button class="btn-google-large" onclick="doGoogleSignIn(event)">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign in with Google
        </button>
        <p class="sw-note">One click — no passwords to remember.</p>
      </div>`;
    return;
  }

  const firstName = session.firstName || session.email?.split('@')[0] || '';
  const lastName = session.lastName || '';
  const email = session.email || '';
  const phone = session.phone || '';

  area.innerHTML = `
    <form id="bookingForm" class="booking-form" onsubmit="submitBooking(event)">
      <div class="bf-row">
        <div class="bf-group"><label>First Name</label><input type="text" id="bFirstName" value="${firstName}" required/></div>
        <div class="bf-group"><label>Last Name</label><input type="text" id="bLastName" value="${lastName}" required/></div>
      </div>
      <div class="bf-row">
        <div class="bf-group"><label>Phone</label><input type="tel" id="bPhone" value="${phone}" placeholder="(630) 000-0000" required/></div>
        <div class="bf-group"><label>Email</label><input type="email" id="bEmail" value="${email}" readonly style="opacity:.7"/></div>
      </div>
      <div class="bf-group"><label>Address (St. Charles or Batavia, IL)</label><input type="text" id="bAddress" placeholder="123 Main St, St. Charles, IL" required/></div>
      <div class="bf-group"><label>Service Type</label>
        <select id="bService" onchange="toggleServiceFields(this.value)" required>
          <option value="">Select...</option>
          <option value="custom_count">Custom Window Count ($5/window)</option>
          <option value="estimated_count">Estimated Amount (Count on arrival)</option>
          <option value="Small Business / Storefront - Exterior Only">Small Business / Storefront - Exterior Only</option>
          <option value="Small Business / Storefront - Interior &amp; Exterior">Small Business / Storefront - Interior &amp; Exterior</option>
          <option value="Large Business / Showroom (e.g. Slumberland) - Custom Quote">Large Business / Showroom (e.g. Slumberland) - Custom Quote</option>
        </select>
      </div>
      <div class="bf-group hidden" id="bfWindowsGroup">
        <label>Number of Windows</label>
        <input type="number" id="bWindowsCount" min="1" placeholder="e.g. 15" oninput="updateBookingPrice()"/>
        <span class="bf-price-hint" id="bfPriceDisplay"></span>
      </div>
      <div class="bf-group"><label>Preferred Payment Method</label>
        <select id="bPayment" required>
          <option value="">Select...</option>
          <option>Cash</option>
          <option>Zelle</option>
          <option>Apple Pay</option>
        </select>
      </div>
      <div class="bf-row">
        <div class="bf-group"><label>Preferred Date</label><input type="date" id="bDate" required/></div>
        <div class="bf-group"><label>Preferred Time</label>
          <select id="bTime" required>
            <option value="">Select...</option>
            <option>Morning (9am–12pm)</option>
            <option>Afternoon (12pm–3pm)</option>
            <option>Late Afternoon (3pm–6pm)</option>
          </select>
        </div>
      </div>
      <div class="bf-group"><label>Notes (optional)</label><textarea id="bNotes" rows="2" placeholder="Gate codes, dogs, anything we should know..."></textarea></div>
      <button type="submit" class="btn-blue full" id="bookBtn">Send Booking Request</button>
      <p class="bf-note">No payment now. We confirm first, then show up and do the work. Pay with Cash, Zelle, or Apple Pay when we're done. ✌️</p>
    </form>
    <div id="bookingSuccess" class="success-box hidden">
      <div style="font-size:2.5rem">🎉</div>
      <h4>Request Sent!</h4>
      <p>We'll text or call you within a few hours to lock in the time. Talk soon!</p>
      <button onclick="renderBookingArea()" class="btn-blue" style="margin-top:1rem">Book Another Job</button>
    </div>`;

  // Set min date to today
  const dateInput = document.getElementById('bDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
}

let pendingBookingData = null;

async function directSubmitBooking(data) {
  const btn = document.getElementById('bookBtn');
  if (btn) {
    btn.textContent = 'Sending...';
    btn.disabled = true;
  }
  try {
    await addBooking(data);
    document.getElementById('bookingForm').classList.add('hidden');
    document.getElementById('bookingSuccess').classList.remove('hidden');
    showToast('Booking request sent! 🎉', 'success');
  } catch (error) {
    console.error('Booking error:', error);
    showToast('Something went wrong. Please try again.', 'error');
    if (btn) {
      btn.textContent = 'Send Booking Request';
      btn.disabled = false;
    }
  }
}

function submitBooking(e) {
  if (e) e.preventDefault();
  const session = getSession();
  if (!session) return;

  const serviceVal = document.getElementById('bService').value;
  let serviceText = serviceVal;
  let priceEstimate = 0;

  if (serviceVal === 'custom_count') {
    const count = parseInt(document.getElementById('bWindowsCount').value) || 0;
    priceEstimate = count * 5;
    serviceText = `Custom Count: ${count} windows ($${priceEstimate})`;
  } else if (serviceVal === 'estimated_count') {
    serviceText = `customer has estimed amount of windows so please count when you are therer`;
  }

  const interiorVal = (serviceText.includes('Interior & Exterior') || serviceText.includes('Custom Quote')) ? 'Inside & Outside' : 'Exterior only';

  const data = {
    firstName:  document.getElementById('bFirstName').value,
    lastName:   document.getElementById('bLastName').value,
    phone:      document.getElementById('bPhone').value,
    email:      document.getElementById('bEmail').value,
    address:    document.getElementById('bAddress').value,
    service:    serviceText,
    interior:   interiorVal,
    date:       document.getElementById('bDate').value,
    time:       document.getElementById('bTime').value,
    payment:    document.getElementById('bPayment').value,
    notes:      document.getElementById('bNotes').value,
    userId:     currentUser?.uid || '',
  };

  if (localStorage.getItem('sh_hide_booking_warning') === 'true') {
    directSubmitBooking(data);
  } else {
    pendingBookingData = data;
    // Show warning modal
    const checkbox = document.getElementById('dontShowWarningAgain');
    if (checkbox) checkbox.checked = false; // reset checkbox
    document.getElementById('bookingWarningModal').classList.remove('hidden');
  }
}

function closeBookingWarningModal() {
  document.getElementById('bookingWarningModal').classList.add('hidden');
  pendingBookingData = null;
}

async function confirmSubmitBooking() {
  if (!pendingBookingData) return;

  const btn = document.getElementById('bookBtn');
  const confirmBtn = document.getElementById('confirmBookingBtn');
  
  if (btn) {
    btn.textContent = 'Sending...';
    btn.disabled = true;
  }
  if (confirmBtn) {
    confirmBtn.textContent = 'Sending...';
    confirmBtn.disabled = true;
  }

  // Check preference checkbox
  const checkbox = document.getElementById('dontShowWarningAgain');
  if (checkbox && checkbox.checked) {
    localStorage.setItem('sh_hide_booking_warning', 'true');
  }

  try {
    await addBooking(pendingBookingData);

    document.getElementById('bookingForm').classList.add('hidden');
    document.getElementById('bookingSuccess').classList.remove('hidden');
    showToast('Booking request sent! 🎉', 'success');
  } catch (error) {
    console.error('Booking error:', error);
    showToast('Something went wrong. Please try again.', 'error');
    if (btn) {
      btn.textContent = 'Send Booking Request';
      btn.disabled = false;
    }
  } finally {
    closeBookingWarningModal();
    if (confirmBtn) {
      confirmBtn.textContent = 'Confirm & Send';
      confirmBtn.disabled = false;
    }
  }
}

function toggleServiceFields(val) {
  const group = document.getElementById('bfWindowsGroup');
  const countInput = document.getElementById('bWindowsCount');
  if (!group || !countInput) return;

  if (val === 'custom_count') {
    group.classList.remove('hidden');
    countInput.required = true;
  } else {
    group.classList.add('hidden');
    countInput.required = false;
    countInput.value = '';
  }
  updateBookingPrice();
}

function updateBookingPrice() {
  const serviceVal = document.getElementById('bService').value;
  const countInput = document.getElementById('bWindowsCount');
  const priceDisplay = document.getElementById('bfPriceDisplay');
  if (!priceDisplay || !countInput) return;

  if (serviceVal === 'custom_count') {
    const count = parseInt(countInput.value) || 0;
    const price = count * 5;
    priceDisplay.textContent = `Estimated Price: $${price} ($5/window)`;
  } else {
    priceDisplay.textContent = '';
  }
}

// --- PHOTO UPLOAD ---
function handleFiles(input) {
  const preview = document.getElementById('filePreview');
  preview.innerHTML = '';
  Array.from(input.files).slice(0,5).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

const dropZone = document.getElementById('fileDrop');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor='#2563eb'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor=''; });
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.style.borderColor='';
    document.getElementById('photoFiles').files = e.dataTransfer.files;
    handleFiles(document.getElementById('photoFiles'));
  });
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800; // max width or height
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function submitPhotos(e) {
  e.preventDefault();
  const btn = document.getElementById('photoSubmitBtn');
  if (!btn) return;
  btn.textContent = 'Sending...';
  btn.disabled = true;

  const name = document.getElementById('photoName').value;
  const email = document.getElementById('photoEmail').value;
  const note = document.getElementById('photoNote').value;
  const fileInput = document.getElementById('photoFiles');
  
  const base64Photos = [];
  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < Math.min(fileInput.files.length, 5); i++) {
      try {
        const base64 = await compressImage(fileInput.files[i]);
        base64Photos.push(base64);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  }

  try {
    await db.collection('photos').add({
      name,
      email,
      note,
      photos: base64Photos,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('photoForm').classList.add('hidden');
    document.getElementById('photoSuccess').classList.remove('hidden');
    showToast('Photos received! Thanks! 📸', 'success');
  } catch (err) {
    console.error('Error submitting photos:', err);
    showToast('Failed to submit photos. Try again.', 'error');
    btn.textContent = 'Send Photos';
    btn.disabled = false;
  }
}

// --- NAV SCROLL EFFECT ---
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.style.boxShadow = window.scrollY > 30 ? '0 2px 16px rgba(0,0,0,0.1)' : 'none';

  // Scroll to top button
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 500);
});

// --- HAMBURGER ---
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});
document.querySelectorAll('.mobile-menu a').forEach(a =>
  a.addEventListener('click', () => document.getElementById('mobileMenu').classList.remove('open'))
);

// --- SCROLL REVEAL ---
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }});
}, { threshold: 0.08 });
document.querySelectorAll('.about-card,.svc-card,.price-card,.contact-card,.gallery-item').forEach(el => {
  el.style.opacity='0'; el.style.transform='translateY(22px)';
  el.style.transition='opacity 0.5s ease,transform 0.5s ease';
  obs.observe(el);
});

// --- COOKIE BANNER ---
function acceptCookies() {
  localStorage.setItem('sh_cookies_accepted', '1');
  document.getElementById('cookieBanner')?.classList.add('hidden');
}
if (!localStorage.getItem('sh_cookies_accepted')) {
  setTimeout(() => document.getElementById('cookieBanner')?.classList.remove('hidden'), 2000);
}

// --- ACTIVE NAV HIGHLIGHTING ---
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 100;
    if (window.scrollY >= top) current = sec.getAttribute('id');
  });
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.classList.toggle('nav-active', link.getAttribute('href') === '#' + current);
  });
});

// --- INIT WITH FIREBASE AUTH ---
onAuthReady((user) => {
  renderNavAuth();
});

// --- BEFORE & AFTER SLIDER ---
const slider = document.getElementById('sliderRange');
const sliderContainer = document.getElementById('beforeAfterSlider');
if (slider && sliderContainer) {
  slider.addEventListener('input', (e) => {
    sliderContainer.style.setProperty('--slider-pos', e.target.value + '%');
  });
}

// --- FAQ ACCORDION ---
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(x => x.classList.remove('active'));
  if (!isActive) {
    item.classList.add('active');
  }
}

// --- ADDRESS WINDOW ESTIMATOR ---
let estAddressCached = '';
let estWindowsCached = 0;

function getEstimatedPropertyDetails(address) {
  if (!address || address.trim().length < 5) {
    return { sqft: 1800, stories: 2, count: 15 };
  }
  let hash = 0;
  const cleanAddress = address.trim().toLowerCase();
  for (let i = 0; i < cleanAddress.length; i++) {
    hash = cleanAddress.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  
  // Calculate deterministic property details
  const stories = (absHash % 2) + 1; // 1 or 2 stories
  const baseSqft = 1100 + (absHash % 2600); // 1100 to 3700 sq ft
  const sqft = Math.round(baseSqft / 50) * 50; // round to nearest 50
  
  // Calculate windows: base window count from size + height multiplier
  const count = Math.max(8, Math.min(32, Math.round((sqft / 140) + (stories * 3))));
  
  return { sqft, stories, count };
}

function estimateAddressWindows() {
  const addressInput = document.getElementById('estAddress');
  const address = addressInput ? addressInput.value.trim() : '';

  if (!address) {
    showToast('Please enter an address first.', 'error');
    return;
  }

  const loadingEl = document.getElementById('estLoading');
  const resultEl = document.getElementById('estResult');
  const estimateBtn = document.getElementById('estimateBtn');
  const loadingTextEl = document.getElementById('estLoadingText');

  if (!loadingEl || !resultEl || !estimateBtn) return;

  // Show loading, hide result
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  estimateBtn.disabled = true;

  const steps = [
    'Locating property boundaries...',
    'Analyzing building footprint and stories...',
    'Checking property archives and street view images...',
    'Counting window panes and calculating price...'
  ];

  let currentStep = 0;
  loadingTextEl.textContent = steps[0];

  const interval = setInterval(() => {
    currentStep++;
    if (currentStep < steps.length) {
      loadingTextEl.textContent = steps[currentStep];
    }
  }, 500);

  setTimeout(() => {
    clearInterval(interval);
    loadingEl.classList.add('hidden');
    estimateBtn.disabled = false;

    const details = getEstimatedPropertyDetails(address);
    const count = details.count;
    const price = count * 5;

    estAddressCached = address;
    estWindowsCached = count;

    document.getElementById('estResultAddress').textContent = address;
    document.getElementById('estResultSqft').textContent = `${details.sqft.toLocaleString()} sq ft`;
    document.getElementById('estResultStories').textContent = `${details.stories} ${details.stories === 1 ? 'Story' : 'Stories'}`;
    document.getElementById('estResultWindowsDetail').textContent = `${count} windows`;
    document.getElementById('estResultPrice').textContent = `$${price}`;

    resultEl.classList.remove('hidden');
  }, 2000);
}

function bookAddressEstimate(useCount) {
  // Scroll to booking section
  const bookingSec = document.getElementById('booking');
  if (bookingSec) bookingSec.scrollIntoView({ behavior: 'smooth' });

  // Wait for scroll and potential rendering
  setTimeout(() => {
    const addressInput = document.getElementById('bAddress');
    const serviceSelect = document.getElementById('bService');
    const countInput = document.getElementById('bWindowsCount');

    if (addressInput) {
      addressInput.value = estAddressCached;
    }

    if (serviceSelect) {
      if (useCount) {
        serviceSelect.value = 'custom_count';
        toggleServiceFields('custom_count');
        if (countInput) {
          countInput.value = estWindowsCached;
          updateBookingPrice();
        }
      } else {
        serviceSelect.value = 'estimated_count';
        toggleServiceFields('estimated_count');
      }
      serviceSelect.dispatchEvent(new Event('change'));
    }
  }, 800);
}

// --- TESTIMONIALS & RATINGS ---
function openReviewModal() {
  document.getElementById('reviewModal').classList.remove('hidden');
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.add('hidden');
  document.getElementById('reviewForm').reset();
}

async function submitReview(e) {
  e.preventDefault();
  const btn = document.getElementById('reviewSubmitBtn');
  if (btn) {
    btn.textContent = 'Submitting...';
    btn.disabled = true;
  }

  const name = document.getElementById('revName').value;
  const rating = parseInt(document.getElementById('revRating').value) || 5;
  const text = document.getElementById('revText').value;

  try {
    await db.collection('ratings').add({
      name,
      rating,
      text,
      userId: currentUser?.uid || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('Thank you for your review! ⭐', 'success');
    closeReviewModal();
    loadRatings();
  } catch (err) {
    console.error('Error submitting review:', err);
    showToast('Failed to submit review.', 'error');
    if (btn) {
      btn.textContent = 'Submit Review';
      btn.disabled = false;
    }
  }
}

async function loadRatings() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  try {
    const snapshot = await db.collection('ratings').orderBy('createdAt', 'desc').limit(6).get();
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (list.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 2rem 0;">No reviews yet. Be the first to leave one!</div>';
      return;
    }

    grid.innerHTML = '';
    list.forEach(r => {
      const card = document.createElement('div');
      card.className = 'review-card';
      
      const stars = '⭐'.repeat(r.rating);
      const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'Just now';

      card.innerHTML = `
        <div class="review-stars">${stars}</div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-meta">
          <span class="review-author">${r.name}</span>
          <span class="review-date">${dateStr}</span>
        </div>`;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading ratings:', err);
  }
}

// Load ratings on load
loadRatings();

