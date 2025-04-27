const images = [
  `${base}IMG-001_MARIA_STUDIO.JPG`,
  `${base}images/IMG-002_MARIA_STUDIO.JPG`,
  `${base}images/IMG-003_MARIA_STUDIO.JPG`,
  `${base}images/IMG-004_MARIA_STUDIO.JPG`,
  `${base}images/IMG-005_MARIA_STUDIO.JPG`,
  `${base}images/IMG-006_MARIA_STUDIO.JPG`,
  `${base}images/IMG-007_MARIA_STUDIO.JPG`,
  `${base}images/IMG-008_MARIA_STUDIO.JPG`,
  `${base}images/IMG-009_MARIA_STUDIO.JPG`,
  `${base}images/IMG-010_MARIA_STUDIO.JPG`,
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
  window.stopCarousel();
  window.startCarousel();
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

window.startCarousel = function() {
  if (!intervalId) {
    intervalId = setInterval(nextImage, 5000);
  }
}

window.stopCarousel = function() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

window.initializeCarousel = function() {
  console.log('Carousel initialized');
  showImage(currentIndex);
  
  const carousel = document.getElementById('main-01-carousel');
  const carouselImage = document.getElementById('carousel-image');

  if (carousel && carouselImage) {
    // Touch events for swipe
    carousel.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      handleGesture();
    });

    // Click events for navigation
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
}
