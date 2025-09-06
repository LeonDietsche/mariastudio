// script.js — new version + device-specific focal presets
import * as THREE from 'three';

const MOBILE_BP = 1275;

// Assets (adjust if you change filenames)
const TEX_DESKTOP = '250506_ms_studio_360_15000-7500.jpg';
const TEX_MOBILE  = '250506_ms_studio_360_9900-4950.jpg';

// 🔧 Focal presets (mm)
const MOBILE_FOCAL   = 18;       // starting focal on mobile (wider)
const DESKTOP_FOCAL  = 18;       // starting focal on desktop (tighter)
const MOBILE_MIN     = 10, MOBILE_MAX   = 30;
const DESKTOP_MIN    = 10, DESKTOP_MAX  = 30;

let camera, scene, renderer;
let isUserInteracting = false;
let isPinching = false;
let lon = 0, lat = 0, phi = 0, theta = 0;

// Focal state (set by applyDeviceCameraPreset)
let focalLength;              // current focal in mm
let minFocalLength;           // clamps
let maxFocalLength;
let pinchDistanceStart = 0, pinchDistanceEnd = 0;
let wasMobile = null;         // last known device class

init();
animate();

function wW() { return window.innerWidth; }
function wH() { return window.innerHeight; }
function isMobile() { return wW() <= MOBILE_BP; }

function applyDeviceCameraPreset() {
  const mobile = isMobile();

  // On first run, set a base focal. Afterwards, keep current but re-clamp.
  if (wasMobile === null) {
    focalLength = mobile ? MOBILE_FOCAL : DESKTOP_FOCAL;
  }

  minFocalLength = mobile ? MOBILE_MIN : DESKTOP_MIN;
  maxFocalLength = mobile ? MOBILE_MAX : DESKTOP_MAX;

  focalLength = clampFocal(focalLength);
  camera.setFocalLength(focalLength);
  camera.updateProjectionMatrix();

  wasMobile = mobile;
}

function init() {
  const container = document.getElementById('studio');
  const cover = document.getElementById('cover');
  if (cover) cover.style.opacity = 1;

  // Always keep header/footer normal (no blend mode)
  const header = document.getElementById('idheader');
  const footer = document.getElementById('idfooter');
  if (header) header.style.mixBlendMode = 'normal';
  if (footer) footer.style.mixBlendMode = 'normal';

  // CAMERA
  camera = new THREE.PerspectiveCamera(70, wW() / wH(), 1, 2000);
  camera.target = new THREE.Vector3(0, 0, 0);

  // RENDERER (crisper on HiDPI, but keep mobile reasonable)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const dpr = isMobile()
    ? Math.min(2, window.devicePixelRatio)
    : Math.max(1, Math.min(3, window.devicePixelRatio));
  renderer.setPixelRatio(dpr);
  renderer.setSize(wW(), wH());
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  container.appendChild(renderer.domElement);

  // SCENE + GEOMETRY
  scene = new THREE.Scene();
  const segW = isMobile() ? 60 : 80;
  const segH = isMobile() ? 40 : 60;
  const geometry = new THREE.SphereGeometry(500, segW, segH);
  geometry.scale(-1, 1, 1);

  // TEXTURE
  const texFile = (import.meta.env.BASE_URL || '/') + (isMobile() ? TEX_MOBILE : TEX_DESKTOP);
  const texture = new THREE.TextureLoader().load(texFile);
  if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
  else texture.encoding = THREE.SRGBEncoding;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 🔑 Apply device preset AFTER camera exists
  applyDeviceCameraPreset();

  // EVENTS (no blend-mode toggling)
  const target = cover || container;
  target.addEventListener('mousedown', onMouseDown, false);
  target.addEventListener('mousemove', onMouseMove, false);
  target.addEventListener('mouseup', onMouseUp, false);
  target.addEventListener('wheel', onMouseWheel, { passive: false });

  target.addEventListener('touchstart', onTouchStart, false);
  target.addEventListener('touchmove', onTouchMove, false);
  target.addEventListener('touchend', onTouchEnd, false);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = wW() / wH();
  camera.updateProjectionMatrix();

  const mobile = isMobile();
  if (mobile !== wasMobile) {
    applyDeviceCameraPreset();     // switch preset when crossing breakpoint
  } else {
    focalLength = clampFocal(focalLength); // keep but enforce clamps
    camera.setFocalLength(focalLength);
    camera.updateProjectionMatrix();
  }

  const dpr = mobile
    ? Math.min(2, window.devicePixelRatio)
    : Math.max(1, Math.min(3, window.devicePixelRatio));
  renderer.setPixelRatio(dpr);
  renderer.setSize(wW(), wH());
}

let onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

function onMouseDown(e) {
  e.preventDefault();
  isUserInteracting = true;
  const cover = document.getElementById('cover');
  if (cover) cover.style.opacity = 0;

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
      const cover = document.getElementById('cover');
      if (cover) cover.style.opacity = 1;
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
  focalLength -= e.deltaY * zoomSpeed * 0.01;
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

    // Pinch out = zoom in
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
