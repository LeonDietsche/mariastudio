// booking.js
import myHelpers from './helper.js';
import { t } from './translation.js';
const base = import.meta.env.BASE_URL;

// Toast durations
const TOAST_SUCCESS_MS = 7000; // success toast duration (ms)
const TOAST_ERROR_MS   = 10000;    // server error toast; 0 = don't auto-hide

/* ---------------------------
   Toast (loading/success/error)
--------------------------- */
function ensureToast() {
  let toast = document.getElementById('form-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'form-toast';
    toast.className = 'toast';
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__spinner" aria-hidden="true"></span>
      <span id="toast-text">${t('toast_loading')}</span>
    `;
    document.body.appendChild(toast);
  } else if (toast.parentElement !== document.body) {
    document.body.appendChild(toast);
  }
  toast.style.zIndex = '2000';
  return toast;
}

function positionToast() {
  const toast = document.getElementById('form-toast');
  const header = document.getElementById('idheader');
  if (!toast || !header) return;
  const headerHeight = Math.ceil(header.getBoundingClientRect().height);
  toast.style.top = `${headerHeight + 8}px`;
  toast.style.left = '50%';
  toast.style.transform = toast.classList.contains('toast--show')
    ? 'translate(-50%, 0)'
    : 'translate(-50%, -12px)';
}

function showToast(type, message, durationMs) {
  const toast = ensureToast();
  const text = document.getElementById('toast-text');
  const spinner = toast.querySelector('.toast__spinner');

  if (toast._finalizeTimer) { clearTimeout(toast._finalizeTimer); toast._finalizeTimer = null; }
  if (toast._hideTimer)     { clearTimeout(toast._hideTimer);     toast._hideTimer     = null; }

  text.textContent = message || '';
  spinner.style.display = (type === 'loading') ? 'inline-block' : 'none';

  toast.hidden = false;
  positionToast();
  requestAnimationFrame(() => toast.classList.add('toast--show'));

  if (durationMs && durationMs > 0) {
    toast._hideTimer = setTimeout(hideToast, durationMs);
  }
}

function hideToast() {
  const toast = document.getElementById('form-toast');
  if (!toast || toast.hidden) return;

  toast.classList.remove('toast--show');
  if (toast._hideTimer) { clearTimeout(toast._hideTimer); toast._hideTimer = null; }
  if (toast._finalizeTimer) { clearTimeout(toast._finalizeTimer); toast._finalizeTimer = null; }

  toast._finalizeTimer = setTimeout(() => {
    toast.hidden = true;
    toast._finalizeTimer = null;
  }, 200);
}

window.addEventListener('resize', positionToast);
document.addEventListener('modalOpened', positionToast);

/* ---------------------------
   Modal open bootstrap
--------------------------- */
document.addEventListener('modalOpened', () => {
  // If booking form isn’t on page, bail out (prevents null errors on other pages)
  if (!document.getElementById('main-book-01')) return;

  // Phone input (intl-tel-input)
  const input = document.querySelector("#phone");
  if (input && window.intlTelInput) {
    window.intlTelInput(input, {
      loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/utils.js"),
      initialCountry: "auto",
      geoIpLookup: (success, failure) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => success(data.country_code))
          .catch(() => failure());
      },
      nationalMode: false,
      strictMode: true
    });
  }

  // Radios + dynamic fields
  const yesRadio = document.getElementById('firsttime_yes');
  const noRadio  = document.getElementById('firsttime_no');
  if (yesRadio) yesRadio.addEventListener('click', toggleFirstTimeBooking);
  if (noRadio)  noRadio.addEventListener('click', toggleFirstTimeBooking);

  const projectTypeDropdown = document.getElementById('project-type');
  if (projectTypeDropdown) {
    projectTypeDropdown.addEventListener('change', () => {
      toggleInputsBasedOnProjectType();              // keeps brand/magazine/tellusmore logic
      updatePhotographerContainerVisibility();       // overrides photographer visibility properly
    });
  }

  const youAreaSelect = document.getElementById('youarea');
  if (youAreaSelect) {
    youAreaSelect.addEventListener('change', updatePhotographerContainerVisibility);
  }

  const equipmentListReadyYes = document.getElementById('equipmentlistreadyyes');
  const equipmentListReadyNo  = document.getElementById('equipmentlistreadyno');
  if (equipmentListReadyYes) equipmentListReadyYes.addEventListener('click', toggleEQListFields);
  if (equipmentListReadyNo)  equipmentListReadyNo.addEventListener('click', toggleEQListFields);

  const billingDetailsSame = document.getElementById('billingdetails-same');
  const billingDetailsNew  = document.getElementById('billingdetails-new');
  if (billingDetailsSame) billingDetailsSame.addEventListener('click', toggleBillingDetails);
  if (billingDetailsNew)  billingDetailsNew.addEventListener('click', toggleBillingDetails);

  initializeBookingForm();
});

/* ---------------------------
   UI Toggles
--------------------------- */
function toggleFirstTimeBooking() {
  const yesRadio = document.getElementById('firsttime_yes');
  const noRadio  = document.getElementById('firsttime_no');
  const imgYes = document.getElementById('img-yes');
  const imgNo  = document.getElementById('img-no');
  const youAreaContainer = document.getElementById('youarea-container');
  const billingDetailsContainer = document.getElementById('billing-details-container');
  const billingDetailsSame = document.getElementById('billingdetails-same');

  if (yesRadio.checked) {
    imgYes.src = `${base}radio_button_checked.png`;
    imgNo.src  = `${base}radio_button_unchecked.png`;
    youAreaContainer.classList.remove('hidden');
    billingDetailsContainer.classList.remove('hidden');
    if (billingDetailsSame) billingDetailsSame.checked = true;
  } else if (noRadio.checked) {
    imgYes.src = `${base}radio_button_unchecked.png`;
    imgNo.src  = `${base}radio_button_checked.png`;
    youAreaContainer.classList.add('hidden');
    billingDetailsContainer.classList.add('hidden');
  }
}

function toggleInputsBasedOnProjectType() {
  const projectType = document.getElementById('project-type').value;
  // const photographerContainer = document.getElementById('photographer-container');
  const brandNameContainer    = document.getElementById('brandname-container');
  const magazineNameContainer = document.getElementById('magazinename-container');
  const tellUsMoreContainer   = document.getElementById('tellusmore-container');

  // Photographer for all except Ecommerce
  // photographerContainer.classList.toggle('hidden', projectType === 'Ecommerce');

  // Brand for Campaign/Lookbook/Ecommerce
  brandNameContainer.classList.toggle('hidden', !['Campaign','Lookbook','Ecommerce'].includes(projectType));

  // Magazine for Editorial
  magazineNameContainer.classList.toggle('hidden', projectType !== 'Editorial');

  // Tell us more for Personal/Other
  tellUsMoreContainer.classList.toggle('hidden', !['Personal','Other'].includes(projectType));
}

function updatePhotographerContainerVisibility() {
  const projectType = document.getElementById('project-type')?.value;
  const youArea     = document.getElementById('youarea')?.value; // producer/photographer/...

  const photographerContainer = document.getElementById('photographer-container');
  if (!photographerContainer) return;

  // Rule A: if user is the photographer, never show the field
  const hideBecauseUserIsPhotographer = (youArea === 'photographer');

  // Rule B: otherwise follow project type rule (hide for Ecommerce)
  const hideBecauseProjectType = (projectType === 'Ecommerce');

  photographerContainer.classList.toggle(
    'hidden',
    hideBecauseUserIsPhotographer || hideBecauseProjectType
  );
}

function toggleEQListFields() {
  const equipmentListReadyYes = document.getElementById('equipmentlistreadyyes');
  const equipmentListReadyNo  = document.getElementById('equipmentlistreadyno');
  const eqImgYes = document.getElementById('eq-img-yes');
  const eqImgNo  = document.getElementById('eq-img-no');
  const eqlistContainer = document.getElementById('eqlist-container');

  if (equipmentListReadyYes.checked) {
    eqImgYes.src = `${base}radio_button_checked.png`;
    eqImgNo.src  = `${base}radio_button_unchecked.png`;
    eqlistContainer.classList.remove('hidden');
  } else if (equipmentListReadyNo.checked) {
    eqImgYes.src = `${base}radio_button_unchecked.png`;
    eqImgNo.src  = `${base}radio_button_checked.png`;
    eqlistContainer.classList.add('hidden');
  }
}

function toggleBillingDetails() {
  const billingDetailsSame = document.getElementById('billingdetails-same');
  const billingDetailsNew  = document.getElementById('billingdetails-new');
  const billingImgSame = document.getElementById('billing-img-same');
  const billingImgNew  = document.getElementById('billing-img-new');
  const billingDetailsContainer = document.getElementById('billing-details-container');

  if (billingDetailsSame.checked) {
    billingImgSame.src = `${base}radio_button_checked.png`;
    billingImgNew.src  = `${base}radio_button_unchecked.png`;
    billingDetailsContainer.classList.add('hidden');
  } else if (billingDetailsNew.checked) {
    billingImgSame.src = `${base}radio_button_unchecked.png`;
    billingImgNew.src  = `${base}radio_button_checked.png`;
    billingDetailsContainer.classList.remove('hidden');
  }
}

/* ---------------------------
   Date pickers
--------------------------- */
function initializeDatePickers() {
  const appointmentDates = document.getElementById('appointment-dates');
  if (!appointmentDates) return;  // prevents null .placeholder error

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = String(today.getMonth() + 1).padStart(2, '0');
  const dd   = String(today.getDate()).padStart(2, '0');
  appointmentDates.placeholder = `${yyyy}-${mm}-${dd}`;

  if (window.flatpickr) {
    flatpickr("#appointment-dates", {
      mode: "multiple",
      dateFormat: "Y-m-d",
    });
  }
}

/* ---------------------------
   Booking form wiring
--------------------------- */
function initializeBookingForm() {
  // If booking form isn’t on the page, bail out
  if (!document.getElementById('form-part-01')) return;

  initializeDatePickers();

  const nextBtn1  = document.getElementById('nextBtn1');
  const nextBtn2  = document.getElementById('nextBtn2');
  const backBtn2  = document.getElementById('backBtn2');
  const backBtn3  = document.getElementById('backBtn3');
  const submitBtn = document.querySelector('#form-part-03 button[type="submit"]');

  if (nextBtn1) { nextBtn1.removeEventListener('click', handleNextBtn1); nextBtn1.addEventListener('click', handleNextBtn1); }
  if (nextBtn2) { nextBtn2.removeEventListener('click', handleNextBtn2); nextBtn2.addEventListener('click', handleNextBtn2); }
  if (backBtn2) { backBtn2.removeEventListener('click', handleBackBtn2); backBtn2.addEventListener('click', handleBackBtn2); }
  if (backBtn3) { backBtn3.removeEventListener('click', handleBackBtn3); backBtn3.addEventListener('click', handleBackBtn3); }
  if (submitBtn){ submitBtn.removeEventListener('click', handleFormSubmit); submitBtn.addEventListener('click', handleFormSubmit); }
}

// No error toasts; just inline highlights
function handleNextBtn1() {
  const formPart1 = document.getElementById('form-part-01');
  if (validateForm(formPart1)) {
    showNextPart(1);
    enableSwiping();
  }
}

function handleNextBtn2() {
  const formPart2 = document.getElementById('form-part-02');
  if (validateForm(formPart2)) {
    showNextPart(2);
  }
}

function handleBackBtn2() { showPreviousPart(2); }
function handleBackBtn3() { showPreviousPart(3); }

function handleFormSubmit(event) {
  event.preventDefault();
  const submitBtn = event.currentTarget;
  if (submitBtn) submitBtn.disabled = true;

  const formPart3 = document.getElementById('form-part-03');
  if (validateForm(formPart3)) {
    showToast('loading', t('toast_loading'));
    logFormData(submitBtn);
  } else {
    if (submitBtn) submitBtn.disabled = false;
    hideToast(); // remove loading
  }
}

function showNextPart(currentPart) {
  const currentForm = document.getElementById(`form-part-0${currentPart}`);
  const currentBook = document.getElementById(`main-book-0${currentPart}`);
  if (currentForm && validateForm(currentForm)) {
    const nextBook = document.getElementById(`main-book-0${currentPart + 1}`);
    if (nextBook) {
      nextBook.style.display = 'block';
      if (myHelpers.isMobile() === true) {
        currentBook.style.display = 'none';
        const backBtn = document.getElementById(`backBtn${currentPart + 1}`);
        if (backBtn) backBtn.style.display = 'inline-block';
      }
    }
  }
}

function showPreviousPart(currentPart) {
  const currentBook = document.getElementById(`main-book-0${currentPart}`);
  if (currentBook) {
    const previousBook = document.getElementById(`main-book-0${currentPart - 1}`);
    if (previousBook) {
      previousBook.style.display = 'block';
      currentBook.style.display = 'none';
    }
  }
}

function validateForm(form) {
  let valid = true;

  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  inputs.forEach(input => {
    const value = input.value.trim();
    if (!value) {
      valid = false;
      input.classList.add('error');
    } else {
      if (input.type === 'text' && input.name === 'contact_email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          valid = false;
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      } else {
        input.classList.remove('error');
      }
    }
  });

  const radioGroups = form.querySelectorAll('.custom-radio');
  radioGroups.forEach(group => {
    const radios = group.querySelectorAll('input[type="radio"]');
    const isSelected = Array.from(radios).some(radio => radio.checked);
    if (!isSelected) {
      valid = false;
      group.classList.add('error');
    } else {
      group.classList.remove('error');
    }
  });

  return valid;
}

/* ---------------------------
   Submission (multipart/form-data)
--------------------------- */
function logFormData(submitBtn) {
  const fd = new FormData();

  // Merge fields from all 3 forms
  ['form-part-01', 'form-part-02', 'form-part-03'].forEach(id => {
    const formEl = document.getElementById(id);
    if (!formEl) return;
    const f = new FormData(formEl);
    for (const [k, v] of f.entries()) {
      // (If the same key appears twice across forms, both will be appended;
      // your names are distinct so this is fine.)
      fd.append(k, v ?? '');
    }
  });

  // Extra client timestamp (server also stamps its own)
  fd.append('client_date', new Date().toISOString());

  // NOTE: The file input with name="general_eqlistfile" (id="eqlistfile")
  // is already included by the FormData(form) above. No need to add again.

  sendFormDataToServer(fd, submitBtn);
}

function sendFormDataToServer(formData, submitBtn) {
  fetch(`${base}api/submit-booking.php`, {
    method: 'POST',
    // Do NOT set Content-Type header; the browser sets the right multipart boundary
    body: formData
  })
  .then(async res => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} – ${body}`);
    }
    return res.json();
  })
  .then(response => {
    console.log('Booking submitted successfully:', response);
    showToast('success', t('toast_success'), TOAST_SUCCESS_MS);
    if (submitBtn) submitBtn.disabled = false;
  })
  .catch(err => {
    console.error('Error submitting booking:', err);
    showToast('error', t('toast_error'), TOAST_ERROR_MS);
    if (submitBtn) submitBtn.disabled = false;
  });
}

/* ---------------------------
   Swipe navigation (mobile)
--------------------------- */
function enableSwiping() {
  const mainBookElements = document.querySelectorAll('[id^="main-book-"]');
  mainBookElements.forEach((element) => {
    const partNumber = parseInt(element.id.split('-')[2], 10);
    let startX = 0, startY = 0;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaY) > 50) return;
      if (deltaX < -50)      showNextPart(partNumber);
      else if (deltaX > 50)  showPreviousPart(partNumber);
    });
  });
}
