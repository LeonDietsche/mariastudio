import myHelpers from './helper.js';
import { applyTranslations, updateTermsLinks } from './translation.js';

const base = import.meta.env.BASE_URL;

const modal = document.getElementById('myModal');
const header = document.getElementById('idheader');
const footer = document.getElementById('idfooter');
const toggleInfoBtn = document.getElementById('toggleInfoBtn');
const toggleBookBtn = document.getElementById('toggleBookBtn');
const toggleInfoPipe = document.getElementById('toggleInfoPipe');
const toggleBookPipe = document.getElementById('toggleBookPipe');
const modalBodyContainer = document.getElementById('modal-body-container');

// Desktop: Toggle Newsletter
const newsletterToggle = document.getElementById('newsletterToggle');
const newsletterForm = document.getElementById('newsletterForm');
newsletterToggle.addEventListener('click', () => {
  newsletterForm.classList.toggle('hidden');
});

// Mobile: Toggle Newsletter
const newsletterToggleMobile = document.getElementById('newsletterToggleMobile');
const newsletterFormMobile = document.getElementById('newsletterFormMobile');
newsletterToggleMobile.addEventListener('click', () => {
  newsletterFormMobile.classList.toggle('hidden');
});

/* ➜ NEU: Helper, um den mobilen Newsletter sicher zu schließen */
function closeMobileNewsletter() {
  if (newsletterFormMobile && !newsletterFormMobile.classList.contains('hidden')) {
    newsletterFormMobile.classList.add('hidden');
  }
}

// Close Modal on X
const closeModalBtn = document.getElementById('closeModalBtn');
closeModalBtn.addEventListener('click', () => toggleModal());

let currentContentUrl = null;

// Mode tracking
let currentMode = myHelpers.isMobile() ? 'mobile' : 'desktop';

/* === A) NEU: Helper zum Setzen der Header-Hintergrundfarbe auf Mobile === */
function updateHeaderBgForMobile() {
  if (!header) return;

  const isMobile = (currentMode === 'mobile');
  const isOpen   = modal.style.display === 'block';

  // Klassen sauber halten
  header.classList.remove('header--transparent', 'header--white');

  if (isMobile) {
    // Mobile: Standard = transparent; Modal offen = weiß
    header.classList.add(isOpen ? 'header--white' : 'header--transparent');
  }
}

function hideHoverOverlays() {
  const imageContainer = document.getElementById('image-container');
  const videoContainer = document.getElementById('video-container');
  if (imageContainer) {
    imageContainer.style.opacity = 0;
    imageContainer.style.display = 'none';
    imageContainer.style.backgroundImage = '';
  }
  if (videoContainer) {
    videoContainer.style.opacity = 0;
    videoContainer.style.display = 'none';
    videoContainer.innerHTML = '';
  }
}

// Keep header/footer always normal (black text), only hide footer under mobile modal
function syncHeaderFooterForMode() {
  const isOpen = modal.style.display === 'block';

  // force normal blend
  if (header) header.style.mixBlendMode = 'normal';
  if (footer) footer.style.mixBlendMode = 'normal';

  // keep opacities sane
  if (currentMode === 'mobile') {
    if (header) header.style.opacity = 1;
    if (footer) footer.style.opacity = isOpen ? 0 : 1;
  } else {
    if (header) header.style.opacity = 1;
    if (footer) footer.style.opacity = 1;
  }

  // ensure headings remain black (in case older code ever flipped them)
  document.querySelectorAll('h1,h2,h3').forEach(el => (el.style.color = '#000'));

  /* === B) NEU: Header-Hintergrund nachführen === */
  updateHeaderBgForMobile();
}

function applyMode() {
  const isMobileNow = myHelpers.isMobile();
  const newMode = isMobileNow ? 'mobile' : 'desktop';
  const modeChanged = newMode !== currentMode;
  currentMode = newMode;

  const isOpen = modal.style.display === 'block';

  if (modeChanged && isOpen) {
    if (currentMode === 'mobile') {
      hideHoverOverlays();
      initializeCarousel();
      startCarousel();
      showImage(0);
      const carousel = document.getElementById('main-01-carousel');
      if (carousel) requestAnimationFrame(() => { carousel.style.opacity = 1; });
    } else {
      stopCarousel();
      initializeDesktopHoverEffect();
    }
  }

  syncHeaderFooterForMode();
}

// React to breakpoint
const mq = window.matchMedia('(max-width: 1275px)');
if (mq && mq.addEventListener) {
  mq.addEventListener('change', () => applyMode());
} else if (mq && mq.addListener) {
  mq.addListener(() => applyMode());
}
window.addEventListener('resize', () => applyMode());

// Toggle modal (no blend-mode or color toggling)
function toggleModal(forceOpen = false) {
  const isModalOpen = modal.style.display === 'block';
  modal.style.display = forceOpen ? 'block' : (isModalOpen ? 'none' : 'block');

  if (modal.style.display === 'none') {
    toggleBookPipe.style.display = 'none';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'none';
  }

  const evt = new Event(modal.style.display === 'block' ? 'modalOpened' : 'modalClosed');
  document.dispatchEvent(evt);

  syncHeaderFooterForMode();

  /* === C) NEU: Sofort nach dem Öffnen/Schließen aktualisieren === */
  updateHeaderBgForMobile();
}

// Load modal content
async function loadModalContent(url) {
  if (modal.style.display === 'block' && currentContentUrl === url) {
    toggleModal();
    toggleBookPipe.style.display = 'none';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'none';
    currentContentUrl = null;
    return;
  }

  if (url.endsWith('modal-book.html')) {
    toggleBookPipe.style.display = 'inline';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'inline';
  } else if (url.endsWith('modal-info.html')) {
    toggleInfoPipe.style.display = 'inline';
    toggleBookPipe.style.display = 'none';
    closeModalBtn.style.display  = 'inline';
  } else {
    toggleBookPipe.style.display = 'none';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'none';
  }

  // footer placeholder positioning
  const placeholderEls = document.getElementsByClassName('modal-footer-placeholder');
  if (placeholderEls.length > 0) {
    placeholderEls[0].style.position = url.endsWith('modal-book.html') ? 'fixed' : 'static';
  }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Network response was not ok');

    modalBodyContainer.innerHTML = await resp.text();

    applyTranslations();
    updateTermsLinks();

    currentContentUrl = url;

    if (myHelpers.isMobile()) {
      initializeCarousel();
      startCarousel();
      showImage(0);
      const carousel = document.getElementById('main-01-carousel');
      if (carousel) requestAnimationFrame(() => { carousel.style.opacity = 1; });
    } else {
      initializeDesktopHoverEffect();
      hideHoverOverlays();
    }

    toggleModal(true);
    applyMode();

    const evt = new Event('modalOpened');
    document.dispatchEvent(evt);
  } catch (err) {
    console.error('Failed to load modal content:', err);
  }
}

// Desktop hover image/video
function initializeDesktopHoverEffect() {
  const textItems = document.querySelectorAll('#main-01 p');
  const videoItem = document.querySelector('#videodiv');
  const imageContainer = document.getElementById('image-container');
  const videoContainer = document.getElementById('video-container');

  if (!textItems || !imageContainer) return;

  textItems.forEach(item => {
    item.addEventListener('mouseover', e => {
      const text = e.target.innerText.trim().replace(/\.JPG$/i, '.jpg');
      const imagePath = `${base}images/${text}`;
      modal.style.opacity = 1;
      imageContainer.style.backgroundImage = `url('${imagePath}')`;
      imageContainer.style.opacity = 1;
      imageContainer.style.display = 'block';
    });

    item.addEventListener('mouseout', () => {
      modal.style.opacity = 0.9;
      imageContainer.style.opacity = 0;
      imageContainer.style.display = 'none';
    });
  });

  if (videoItem && videoContainer) {
    videoItem.addEventListener('mouseover', () => {
      const videoPath = base + 'videos/video-001_maria_studio.mp4';
      modal.style.opacity = 1;
      videoContainer.innerHTML = `<video src="${videoPath}") autoplay loop></video>`;
      videoContainer.style.opacity = 1;
      videoContainer.style.display = 'block';
    });

    videoItem.addEventListener('mouseout', () => {
      modal.style.opacity = 0.9;
      videoContainer.style.opacity = 0;
      videoContainer.style.display = 'none';
      videoContainer.innerHTML = '';
    });
  }
}

// Desktop: click outside / ESC to close
function handleKeyDown(event) {
  if (event.key === 'Escape' && modal.style.display === 'block') {
    toggleModal();
  }
}
document.addEventListener('keydown', handleKeyDown);

document.addEventListener('click', (event) => {
  if (myHelpers.isMobile() === false && modal.style.display === 'block') {
    if (currentContentUrl && currentContentUrl.endsWith('modal-book.html')) return;

    const isClickInsideModal      = modalBodyContainer.contains(event.target);
    const isClickOnHeader         = header.contains(event.target);
    const isClickOnFooter         = footer.contains(event.target);
    const isClickOnInfoButton     = toggleInfoBtn.contains(event.target);
    const isClickOnLanguageButton = document.getElementById('toggleLanguageBtn').contains(event.target);

    const newsletterFormMobil = document.querySelector('.newsletter-form-mobil');
    const newsletterForm      = document.getElementById('newsletterForm');
    const isClickOnNewsletter =
      (newsletterFormMobil && newsletterFormMobil.contains(event.target)) ||
      (newsletterForm && newsletterForm.contains(event.target));

    if (
      !isClickInsideModal &&
      !isClickOnHeader &&
      !isClickOnFooter &&
      !isClickOnNewsletter &&
      !isClickOnInfoButton &&
      !isClickOnLanguageButton
    ) {
      toggleModal();
    }
  }
});

/* ➜ NEU: Beim Wechsel der Menüpunkte mobilen Newsletter sicher schließen */
toggleInfoBtn.addEventListener('click', () => { 
  closeMobileNewsletter();                       // NEU
  loadModalContent(base + 'modal-info.html'); 
});
toggleBookBtn.addEventListener('click', () => { 
  closeMobileNewsletter();                       // NEU
  loadModalContent(base + 'modal-book.html'); 
});

/* ➜ NEU: Auch wenn das Modal anders geöffnet wird, Newsletter schließen */
document.addEventListener('modalOpened', closeMobileNewsletter);

// Mobile carousel (unchanged)
const images = [
  `${base}images/IMG-001_MARIA_STUDIO.jpg`,
  `${base}images/IMG-002_MARIA_STUDIO.jpg`,
  `${base}images/IMG-003_MARIA_STUDIO.jpg`,
  `${base}images/IMG-004_MARIA_STUDIO.jpg`,
  `${base}images/IMG-005_MARIA_STUDIO.jpg`,
  `${base}images/IMG-006_MARIA_STUDIO.jpg`,
  `${base}images/IMG-007_MARIA_STUDIO.jpg`,
  `${base}images/IMG-008_MARIA_STUDIO.jpg`,
  `${base}images/IMG-009_MARIA_STUDIO.jpg`,
  `${base}images/IMG-010_MARIA_STUDIO.jpg`,
];

let currentIndex = 0;
let intervalId = null;

function showImage(index) {
  const carouselImage = document.getElementById('carousel-image');
  const imageCounter = document.getElementById('image-counter');
  if (carouselImage) {
    carouselImage.src = images[index];
    if (imageCounter) {
      imageCounter.innerText = `${String(index + 1).padStart(2, '0')}/${String(images.length).padStart(2, '0')}`;
    }
  }
}
function resetInterval() { stopCarousel(); startCarousel(); }
function nextImage() { currentIndex = (currentIndex + 1) % images.length; showImage(currentIndex); resetInterval(); }
function prevImage() { currentIndex = (currentIndex - 1 + images.length) % images.length; showImage(currentIndex); resetInterval(); }

let touchstartX = 0, touchendX = 0;
function handleGesture() { if (touchendX < touchstartX) nextImage(); if (touchendX > touchstartX) prevImage(); }

function startCarousel() {
  if (!intervalId) {
    intervalId = setInterval(nextImage, 5000);
    showImage(currentIndex);
  }
}
function stopCarousel() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

function initializeCarousel() {
  showImage(currentIndex);
  const carousel = document.getElementById('main-01-carousel');
  const carouselImage = document.getElementById('carousel-image');
  if (carousel && carouselImage) {
    carousel.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
    carousel.addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; handleGesture(); });
    carouselImage.addEventListener('click', e => {
      const clickX = e.clientX;
      const w = carouselImage.clientWidth;
      (clickX / w < 0.5) ? prevImage() : nextImage();
    });
    requestAnimationFrame(() => { carousel.style.opacity = 1; });
  }
  document.addEventListener('modalOpened', startCarousel);
  document.addEventListener('modalClosed', stopCarousel);
}

/* === D) NEU: Initial beim Laden setzen === */
document.addEventListener('DOMContentLoaded', () => {
  applyMode();
  updateHeaderBgForMobile();
});
