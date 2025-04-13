import myHelpers from './helper.js';

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
  if (url === 'modal-book.html') {
    toggleBookPipe.style.display = 'inline';   // or 'block'
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'inline';
  } else if (url === 'modal-info.html') {
    toggleInfoPipe.style.display = 'inline';   // or 'block'
    toggleBookPipe.style.display = 'none';
    closeModalBtn.style.display  = 'inline';
  } else {
    // Default case: hide both
    toggleBookPipe.style.display = 'none';
    toggleInfoPipe.style.display = 'none';
    closeModalBtn.style.display  = 'none'; 
  }

  if (url === 'modal-book.html') {
    let modalFooterPlaceholder = document.getElementsByClassName('modal-footer-placeholder');
    if (modalFooterPlaceholder.length > 0) {
      modalFooterPlaceholder[0].style.position = 'fixed';
    }
  }else{
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

    if (myHelpers.isMobile() === false) {
      initializeDesktopHoverEffect();
    } else {
      initializeCarousel();
      startCarousel();
    }

    toggleModal(true);

    const event = new Event('modalOpened');
    document.dispatchEvent(event);  // Dispatch event after modal content is loaded and displayed
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

  textItems.forEach(item => {
    item.addEventListener('mouseover', event => {
      const text = event.target.innerText.trim();
      const imagePath = `/images/${text}`; // Adjust the path as needed
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

  // Add hover effect for video item
  if (videoItem) {
    videoItem.addEventListener('mouseover', () => {
      const videoPath = `videos/video-001_maria_studio.mp4`;
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
    // Is the modal currently open?
    if (modal.style.display === 'block') {

      // If we're on the booking modal, don't auto-close at all
      if (currentContentUrl === 'modal-book.html') {
        return;
      }

      // Existing checks:
      const isClickInsideModal      = modalBodyContainer.contains(event.target);
      const isClickOnHeader         = header.contains(event.target);
      const isClickOnFooter         = footer.contains(event.target);
      const isClickOnInfoButton     = toggleInfoBtn.contains(event.target);
      const isClickOnLanguageButton = document.getElementById('toggleLanguageBtn')
                                             .contains(event.target);

      // NEW: Check if the click is inside either newsletter form
      const newsletterFormMobil = document.querySelector('.newsletter-form-mobil');
      const newsletterForm      = document.getElementById('newsletterForm');
      let isClickOnNewsletter   = false;

      // If these elements exist, see if they contain the click target
      if (newsletterFormMobil && newsletterFormMobil.contains(event.target)) {
        isClickOnNewsletter = true;
      }
      if (newsletterForm && newsletterForm.contains(event.target)) {
        isClickOnNewsletter = true;
      }

      // Close the modal only if:
      // - The click is outside the modal content
      // - Not on header, not on footer
      // - Not on any newsletter form
      // - Not on the info button
      // - Not on the language button
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

toggleInfoBtn.addEventListener('click', () => loadModalContent(import.meta.env.BASE_URL + 'modal-info.html'));
toggleBookBtn.addEventListener('click', () => loadModalContent(import.meta.env.BASE_URL + 'modal-book.html'));

//Mobile: start / stop Carousel
const images = [
  "./images/IMG-001_MARIA_STUDIO.JPG",
  "./images/IMG-002_MARIA_STUDIO.JPG",
  "./images/IMG-003_MARIA_STUDIO.JPG",
  "./images/IMG-004_MARIA_STUDIO.JPG",
  "./images/IMG-005_MARIA_STUDIO.JPG",
  "./images/IMG-006_MARIA_STUDIO.JPG",
  "./images/IMG-007_MARIA_STUDIO.JPG",
  "./images/IMG-008_MARIA_STUDIO.JPG",
];

let currentIndex = 0;
let intervalId = null;

function showImage(index) {
  const carouselImage = document.getElementById('carousel-image');
  const imageCounter = document.getElementById('image-counter');

  if (carouselImage) {
    carouselImage.src = images[index];
    imageCounter.innerText = `${String(index + 1).padStart(2, '0')}/${String(images.length).padStart(2, '0')}`;
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
  }
  document.addEventListener('modalOpened', startCarousel);
  document.addEventListener('modalClosed', stopCarousel);
}



