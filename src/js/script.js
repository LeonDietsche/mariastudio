// script.js
import * as THREE from 'three';

const MOBILE_BP = 1275;

let camera, scene, renderer;
let isUserInteracting = false;
let isPinching = false;
let lon = 0, lat = 0, phi = 0, theta = 0;

let focalLength = 10;       // starting focal length in mm
const minFocalLength = 10;  // wide angle limit
const maxFocalLength = 35;  // zoom-in limit

let pinchDistanceStart = 0, pinchDistanceEnd = 0;

init();
animate();

function wW() { return window.innerWidth; }
function wH() { return window.innerHeight; }
function isMobile() { return wW() <= MOBILE_BP; }

function init() {
  const container = document.getElementById('studio');
  const cover = document.getElementById('cover');
  cover.style.opacity = 1; // logo visible initially

  // Mobile-only white splash (separate layer) while pano loads
  let splash = null;
  if (isMobile()) {
    splash = document.createElement('div');
    splash.id = 'cover-splash';
    // Insert behind the <img> inside #cover
    cover.insertBefore(splash, cover.firstChild);
  }

  // Camera
  camera = new THREE.PerspectiveCamera(70, wW() / wH(), 1, 2000);
  camera.target = new THREE.Vector3(0, 0, 0);
  camera.setFocalLength(focalLength);
  camera.updateProjectionMatrix();

  // Scene
  scene = new THREE.Scene();

  // 360 sphere
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  // Texture with onLoad → cross-fade splash out & canvas in
  const texture = new THREE.TextureLoader().load(
    import.meta.env.BASE_URL + '250506_ms_studio_360_20-150.jpg',
    () => {
      if (isMobile()) {
        // background (canvas) fades in
        renderer?.domElement && (renderer.domElement.style.opacity = '1');
      }
      // white splash fades out
      if (splash) {
        splash.style.opacity = 0;
        setTimeout(() => splash && splash.remove(), 1000);
      }
    }
  );
  texture.encoding = THREE.sRGBEncoding;

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Renderer (keep default clear; preserves blend-mode look after splash)
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(wW(), wH());

  // Cross-fade: start canvas hidden on mobile, then fade in on texture load
  if (isMobile()) {
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.9s ease';
  }

  container.appendChild(renderer.domElement);

  // Safety fallback if loading is slow/fails
  if (isMobile() && splash) {
    setTimeout(() => {
      if (document.body.contains(splash)) {
        renderer.domElement.style.opacity = '1';
        splash.style.opacity = 0;
        setTimeout(() => splash && splash.remove(), 1000);
      }
    }, 5000);
  }

  // Input events on the cover (logo fade behavior unchanged)
  cover.addEventListener('mousedown', onMouseDown, false);
  cover.addEventListener('mousemove', onMouseMove, false);
  cover.addEventListener('mouseup', onMouseUp, false);
  cover.addEventListener('wheel', onMouseWheel, { passive: false });

  cover.addEventListener('touchstart', onTouchStart, false);
  cover.addEventListener('touchmove', onTouchMove, false);
  cover.addEventListener('touchend', onTouchEnd, false);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = wW() / wH();
  camera.updateProjectionMatrix();
  renderer.setSize(wW(), wH());
}

let onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

const header = document.getElementById('idheader');
const footer = document.getElementById('idfooter');
const headings = document.querySelectorAll('h3');

function onMouseDown(e) {
  headings.forEach(h => { h.style.color = 'white'; });
  header.style.mixBlendMode = 'difference';
  footer.style.mixBlendMode = 'difference';
  e.preventDefault();

  isUserInteracting = true;
  document.getElementById('cover').style.opacity = 0; // fade logo out while interacting

  onPointerDownPointerX = e.clientX;
  onPointerDownPointerY = e.clientY;
  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onMouseMove(e) {
  if (isUserInteracting && !isPinching) {
    const sensitivity = window.innerWidth <= 1024 ? 0.3 : 0.2;
    lon = (onPointerDownPointerX - e.clientX) * sensitivity + onPointerDownLon;
    lat = (e.clientY - onPointerDownPointerY) * sensitivity + onPointerDownLat;
  }
}

function onMouseUp() {
  isUserInteracting = false;
  setTimeout(() => {
    if (!isUserInteracting) {
      document.getElementById('cover').style.opacity = 1; // fade logo back in
    }
  }, 500);
}

function clampFocal(f) {
  return Math.max(minFocalLength, Math.min(maxFocalLength, f));
}

// Inverted wheel zoom: up = zoom in, down = zoom out
function onMouseWheel(e) {
  e.preventDefault();
  const zoomSpeed = 0.5;
  focalLength -= e.deltaY * zoomSpeed * 0.01; // inverted direction
  focalLength = clampFocal(focalLength);
  camera.setFocalLength(focalLength);
  camera.updateProjectionMatrix();
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    onMouseDown({
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
      preventDefault: () => e.preventDefault()
    });
  } else if (e.touches.length === 2) {
    isPinching = true;
    pinchDistanceStart = getPinchDistance(e.touches);
  }
}

function onTouchMove(e) {
  if (isPinching && e.touches.length === 2) {
    e.preventDefault();
    pinchDistanceEnd = getPinchDistance(e.touches);
    const delta = pinchDistanceEnd - pinchDistanceStart;

    // Pinch out = zoom in (increase focal length)
    focalLength += delta * 0.05;
    focalLength = clampFocal(focalLength);

    camera.setFocalLength(focalLength);
    camera.updateProjectionMatrix();

    pinchDistanceStart = pinchDistanceEnd;
  } else if (e.touches.length === 1) {
    onMouseMove({
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    });
  }
}

function onTouchEnd(e) {
  if (e.touches.length === 0) {
    isPinching = false;
    onMouseUp(e);
  }
}

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function animate() {
  requestAnimationFrame(animate);
  update();
}

function update() {
  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(camera.target);

  renderer.render(scene, camera);
}
