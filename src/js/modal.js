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

// Track current mode to react to breakpoint changes
let currentMode = myHelpers.isMobile() ? 'mobile' : 'desktop';

// hide any desktop overlays when leaving desktop
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

// Ensure header/footer visuals match current mode + modal state
function syncHeaderFooterForMode() {
  const isOpen = modal.style.display === 'block';
  if (currentMode === 'mobile') {
    if (isOpen) {
      header.style.background = 'white';
      header.style.opacity = 1;
      footer.style.opacity = 0;          // hide footer under mobile modal
    } else {
      header.style.background = '';
      header.style.opacity = 1;
      footer.style.opacity = 1;          // footer visible when modal closed
    }
  } else {
    // desktop
    header.style.background = '';
    header.style.opacity = 1;
    footer.style.opacity = 1;            // always visible on desktop
  }
}

// Apply the right behavior when crossing the 1275px breakpoint
function applyMode() {
  const isMobileNow = myHelpers.isMobile();
  const newMode = isMobileNow ? 'mobile' : 'desktop';
  const modeChanged = newMode !== currentMode;
  currentMode = newMode;

  const isOpen = modal.style.display === 'block';

  if (modeChanged && isOpen) {
    if (currentMode === 'mobile') {
      // desktop -> mobile
      hideHoverOverlays();
      initializeCarousel();
      startCarousel();  // guarded by intervalId
      showImage(0);     // immediate paint
      const carousel = document.getElementById('main-01-carousel');
      if (carousel) requestAnimationFrame(() => { carousel.style.opacity = 1; });
    } else {
      // mobile -> desktop
      stopCarousel();
      initializeDesktopHoverEffect();
    }
  }

  // Always sync header/footer styles (fixes footer "stuck" opacity)
  syncHeaderFooterForMode();
}

// React to media query changes (exactly matches CSS breakpoint)
const mq = window.matchMedia('(max-width: 1275px)');
if (mq && mq.addEventListener) {
  mq.addEventListener('change', () => applyMode());
} else if (mq && mq.addListener) {
  // older Safari fallback
  mq.addListener(() => applyMode());
}
window.addEventListener('resize', () => applyMode()); // extra safety

// Function to toggle the modal display
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

  // Keep header/footer in sync for current mode after open/close
  syncHeaderFooterForMode();
}

// Function to load the modal content
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

    // Newly injected DOM needs translating + link refresh
    applyTranslations();
    updateTermsLinks();

    currentContentUrl = url;

    // initialize behavior for the *current* width
    if (myHelpers.isMobile()) {
      initializeCarousel();
      startCarousel();
      showImage(0); // ensure first image is painted to avoid flicker
      const carousel = document.getElementById('main-01-carousel');
      if (carousel) requestAnimationFrame(() => { carousel.style.opacity = 1; });
    } else {
      initializeDesktopHoverEffect();
      hideHoverOverlays();
    }

    toggleModal(true);

    // ensure future resizes switch smoothly & footer/header synced
    applyMode();

    const event = new Event('modalOpened');
    document.dispatchEvent(event);
  } catch (error) {
    console.error('Failed to load modal content:', error);
  }
}

//Desktop: Hover over Images / Video
function initializeDesktopHoverEffect() {
  const textItems = document.querySelectorAll('#main-01 p');
  const videoItem = document.querySelector('#videodiv');
  const imageContainer = document.getElementById('image-container');
  const videoContainer = document.getElementById('video-container');

  if (!textItems || !imageContainer) return;

  textItems.forEach(item => {
    item.addEventListener('mouseover', event => {
      const text = event.target.innerText.trim().replace(/\.JPG$/i, '.jpg');
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
      const videoPath = base + `videos/video-001_maria_studio.mp4`;
      modal.style.opacity = 1;
      videoContainer.innerHTML = `<video src="${videoPath}" autoplay loop></video>`;
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

//Desktop: Click / ESC the Modal
function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (modal.style.display === 'block') {
      toggleModal();
    }
  }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('click', (event) => {
  if (myHelpers.isMobile() === false) {
    if (modal.style.display === 'block') {
      if (currentContentUrl && currentContentUrl.endsWith('modal-book.html')) {
        return;
      }

      const isClickInsideModal      = modalBodyContainer.contains(event.target);
      const isClickOnHeader         = header.contains(event.target);
      const isClickOnFooter         = footer.contains(event.target);
      const isClickOnInfoButton     = toggleInfoBtn.contains(event.target);
      const isClickOnLanguageButton = document.getElementById('toggleLanguageBtn')
                                             .contains(event.target);

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

toggleInfoBtn.addEventListener('click', () => loadModalContent(base + 'modal-info.html'));
toggleBookBtn.addEventListener('click', () => loadModalContent(base + 'modal-book.html'));

//Mobile: start / stop Carousel
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

console.log("modal: " + images[0]);

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

function resetInterval() {
  stopCarousel();
  startCarousel();
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
  resetInterval();
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex);
  resetInterval();
}

let touchstartX = 0;
let touchendX = 0;

function handleGesture() {
  if (touchendX < touchstartX) nextImage();
  if (touchendX > touchstartX) prevImage();
}

function startCarousel() {
  if (!intervalId) {
    intervalId = setInterval(nextImage, 5000);
    showImage(currentIndex); // Show the first image immediately
  }
}

function stopCarousel() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function initializeCarousel() {
  showImage(currentIndex);
  const carousel = document.getElementById('main-01-carousel');
  const carouselImage = document.getElementById('carousel-image');
  if (carousel && carouselImage) {
    carousel.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    });
    carousel.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      handleGesture();
    });
    carouselImage.addEventListener('click', e => {
      const clickX = e.clientX;
      const imageWidth = carouselImage.clientWidth;
      const clickPosition = clickX / imageWidth;
      if (clickPosition < 0.5) {
        prevImage();
      } else {
        nextImage();
      }
    });

    // smooth show when entering mobile mode
    requestAnimationFrame(() => { carousel.style.opacity = 1; });
  }
  document.addEventListener('modalOpened', startCarousel);
  document.addEventListener('modalClosed', stopCarousel);
}
