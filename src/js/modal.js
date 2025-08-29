import myHelpers from './helper.js';
import { applyTranslations, updateTermsLinks } from './translation.js';

const base = import.meta.env.BASE_URL;
console.log(base);

const modal = document.getElementById('myModal');
const header = document.getElementById('idheader');
const footer = document.getElementById('idfooter');
const headings = document.querySelectorAll('h3');
const toggleInfoBtn = document.getElementById('toggleInfoBtn');
const toggleBookBtn = document.getElementById('toggleBookBtn');
const toggleInfoPipe = document.getElementById('toggleInfoPipe');
const toggleBookPipe = document.getElementById('toggleBookPipe');
const modalBodyContainer = document.getElementById('modal-body-container');

//Desktop: Toggle Newsletter
const newsletterToggle = document.getElementById('newsletterToggle');
const newsletterForm = document.getElementById('newsletterForm');
newsletterToggle.addEventListener('click', function() {
  newsletterForm.classList.toggle('hidden');
});

//Mobile: Toggle Newsletter
const newsletterToggleMobile = document.getElementById('newsletterToggleMobile');
const newsletterFormMobile = document.getElementById('newsletterFormMobile');
newsletterToggleMobile.addEventListener('click', function() {
  newsletterFormMobile.classList.toggle('hidden');
});

//Close Modal on X
const closeModalBtn = document.getElementById('closeModalBtn');
closeModalBtn.addEventListener('click', () => toggleModal());

let currentContentUrl = null;

/* ------------------------------
   Responsive mode management (JS-only)
------------------------------ */
const mq = window.matchMedia('(max-width: 1275px)');
let isMobileMode = mq.matches;
let desktopHoverInitialized = false; // avoid double-binding
let carouselInitialized = false;

function debounce(fn, wait = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// When INFO modal is open, ensure the right UI is active for current viewport
function setupUIModeForInfoView() {
  const infoOpen =
    currentContentUrl &&
    currentContentUrl.endsWith('modal-info.html') &&
    modal.style.display === 'block';

  if (!infoOpen) return;

  if (isMobileMode) {
    if (!carouselInitialized) {
      initializeCarousel();   // safe to call once
      carouselInitialized = true;
    }
    startCarousel();          // (re)start timer & show current slide
  } else {
    stopCarousel();           // stop timers when leaving mobile
    if (!desktopHoverInitialized) {
      initializeDesktopHoverEffect();
      desktopHoverInitialized = true;
    }
  }
}

// React to viewport changes (no CSS changes needed)
mq.addEventListener('change', debounce((e) => {
  const prev = isMobileMode;
  isMobileMode = e.matches;
  if (prev !== isMobileMode) setupUIModeForInfoView();
}, 150));

/* ------------------------------
   Modal show/hide
------------------------------ */
function toggleModal(forceOpen = false) {
  const isModalOpen = modal.style.display === 'block';
  if (forceOpen) {
    modal.style.display = 'block';
  } else {
    modal.style.display = isModalOpen ? 'none' : 'block';
    if (isModalOpen) {
      // Hide pipes + X
      toggleBookPipe.style.display = 'none';
      toggleInfoPipe.style.display = 'none';
      closeModalBtn.style.display  = 'none';
    }
  }
  
  const blendMode = isModalOpen && !forceOpen ? 'difference' : 'normal';
  const color = isModalOpen && !forceOpen ? 'white' : 'black';

  header.style.mixBlendMode = blendMode;
  footer.style.mixBlendMode = blendMode;
  headings.forEach(heading => heading.style.color = color);

  const event = new Event(isModalOpen && !forceOpen ? 'modalClosed' : 'modalOpened');
  document.dispatchEvent(event);

  if (myHelpers.isMobile() === true) {
    if (isModalOpen && !forceOpen) {
      header.style.background = '';
      header.style.opacity = 1;
      footer.style.opacity = 1;
    } else {
      header.style.background = 'white';
      header.style.opacity = 1.0;
      footer.style.opacity = 0;
    }
  }

  // When closing modal, stop carousel so no timers run in background
  if (!forceOpen && isModalOpen) {
    stopCarousel();
  }
}

/* ------------------------------
   Load modal content
------------------------------ */
async function loadModalContent(url) {
  if (modal.style.display === 'block' && currentContentUrl === url) {
    // Close modal if the same content is being loaded
    toggleModal();
    toggleBookPipe.style.display = 'none';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'none';
    currentContentUrl = null;
    return;
  }

  // Show/hide pipes based on which modal is being opened
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

  // Footer placeholder behavior
  if (url.endsWith('modal-book.html')) {
    let modalFooterPlaceholder = document.getElementsByClassName('modal-footer-placeholder');
    if (modalFooterPlaceholder.length > 0) {
      modalFooterPlaceholder[0].style.position = 'fixed';
    }
  } else {
    let modalFooterPlaceholder = document.getElementsByClassName('modal-footer-placeholder');
    if (modalFooterPlaceholder.length > 0) {
      modalFooterPlaceholder[0].style.position = 'static';
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    modalBodyContainer.innerHTML = await response.text();
    currentContentUrl = url;

    // Translate & update terms link for freshly injected DOM
    applyTranslations();
    updateTermsLinks();

    // Open modal now that content exists
    toggleModal(true);

    // Ensure right UI for current viewport (works even after resize)
    setupUIModeForInfoView();

    const event = new Event('modalOpened');
    document.dispatchEvent(event);  // after content is loaded and displayed
  } catch (error) {
    console.error('Failed to load modal content:', error);
  }
}

/* ------------------------------
   Desktop: Hover over Images / Video
------------------------------ */
function initializeDesktopHoverEffect() {
  const textItems = document.querySelectorAll('#main-01 p');
  const videoItem = document.querySelector('#videodiv');
  const imageContainer = document.getElementById('image-container');
  const videoContainer = document.getElementById('video-container');

  // Build canonical on-disk filename from text (solves case mismatches)
  const buildImageFilename = (rawText) => {
    const match = String(rawText).match(/IMG[-_ ]?(\d{3})/i);
    if (!match) return null;
    const num = match[1];
    return `IMG-${num}_MARIA_STUDIO.jpg`;
  };

  textItems.forEach(item => {
    item.addEventListener('mouseover', event => {
      const raw = event.target.innerText.trim();
      const filename = buildImageFilename(raw);
      if (!filename) return;

      const imagePath = `${base}images/${filename}`;
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

  if (videoItem) {
    videoItem.addEventListener('mouseover', () => {
      const videoPath = base + `videos/video-001_maria_studio.mp4`;
      modal.style.opacity = 1;
      videoContainer.innerHTML = `<video src="${videoPath}" autoplay loop playsinline muted></video>`;
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

/* ------------------------------
   Carousel (mobile)
------------------------------ */
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
let visibilityListenerAdded = false;

function showImage(index) {
  const carouselImage = document.getElementById('carousel-image');
  const imageCounter = document.getElementById('image-counter');

  if (carouselImage) {
    carouselImage.src = images[index];
  }
  if (imageCounter) {
    imageCounter.innerText = `${String(index + 1).padStart(2, '0')}/${String(images.length).padStart(2, '0')}`;
  }
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex);
}

function startCarousel() {
  const carouselImage = document.getElementById('carousel-image');
  if (!carouselImage) return; // not in DOM yet

  if (!intervalId) {
    showImage(currentIndex); // show immediately
    intervalId = setInterval(nextImage, 5000);
  }

  // Pause/resume when tab visibility changes
  if (!visibilityListenerAdded) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCarousel();
      else if (isMobileMode && modal.style.display === 'block') startCarousel();
    });
    visibilityListenerAdded = true;
  }
}

function stopCarousel() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function initializeCarousel() {
  const carousel = document.getElementById('main-01-carousel');
  const carouselImage = document.getElementById('carousel-image');
  if (!carousel || !carouselImage) return;

  showImage(currentIndex);

  // Touch & click navigation
  let touchstartX = 0;
  let touchendX = 0;

  const handleGesture = () => {
    if (touchendX < touchstartX) nextImage();
    if (touchendX > touchstartX) prevImage();
    // reset timer on manual nav
    stopCarousel();
    startCarousel();
  };

  carousel.addEventListener('touchstart', (e) => {
    touchstartX = e.changedTouches[0].screenX;
  });
  carousel.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    handleGesture();
  });

  carouselImage.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const imageWidth = carouselImage.clientWidth;
    const clickPosition = clickX / imageWidth;
    if (clickPosition < 0.5) {
      prevImage();
    } else {
      nextImage();
    }
    stopCarousel();
    startCarousel();
  });

  // Also tie to modal lifecycle
  document.addEventListener('modalOpened', () => {
    if (isMobileMode) startCarousel();
  });
  document.addEventListener('modalClosed', () => {
    stopCarousel();
  });
}

/* ------------------------------
   Close on ESC (already present)
------------------------------ */
function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (modal.style.display === 'block') {
      toggleModal();
    }
  }
}

document.addEventListener('keydown', handleKeyDown);

// Desktop: click outside to close (keep your logic)
document.addEventListener('click', (event) => {
  if (myHelpers.isMobile() === false) {
    if (modal.style.display === 'block') {

      // If we're on the booking modal, don't auto-close at all
      if (currentContentUrl && currentContentUrl.endsWith('modal-book.html')) {
        return;
      }

      const isClickInsideModal      = modalBodyContainer.contains(event.target);
      const isClickOnHeader         = header.contains(event.target);
      const isClickOnFooter         = footer.contains(event.target);
      const isClickOnInfoButton     = toggleInfoBtn.contains(event.target);
      const isClickOnLanguageButton = document.getElementById('toggleLanguageBtn')
                                             .contains(event.target);

      // Check if the click is inside either newsletter form
      const newsletterFormMobil = document.querySelector('.newsletter-form-mobil');
      const newsletterForm      = document.getElementById('newsletterForm');
      let isClickOnNewsletter   = false;

      if (newsletterFormMobil && newsletterFormMobil.contains(event.target)) {
        isClickOnNewsletter = true;
      }
      if (newsletterForm && newsletterForm.contains(event.target)) {
        isClickOnNewsletter = true;
      }

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
  }
});

// Openers
toggleInfoBtn.addEventListener('click', () => loadModalContent(base + 'modal-info.html'));
toggleBookBtn.addEventListener('click', () => loadModalContent(base + 'modal-book.html'));
