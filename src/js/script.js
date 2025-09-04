// script.js (responsive focal length via focalLength in mm)
import * as THREE from 'three';

const MOBILE_BP = 1275;

// 🔧 Device-specific focal presets
const MOBILE_FOCAL = 16;      // starting focal on mobile (wider)
const DESKTOP_FOCAL = 10;     // starting focal on desktop (tighter)
const MOBILE_MIN = 16, MOBILE_MAX = 35;
const DESKTOP_MIN = 10, DESKTOP_MAX = 35;

// Core state
var camera, scene, renderer;
var isUserInteracting = false, isPinching = false, lon = 0, lat = 0, phi = 0, theta = 0;

// Focal state (set by applyDeviceCameraPreset)
var focalLength;              // current focal length in mm
var minFocalLength;           // lower clamp
var maxFocalLength;           // upper clamp
var pinchDistanceStart = 0, pinchDistanceEnd = 0;
var wasMobile = null;         // tracks last-known device class to react on resize

init();
animate();

function wW() { return window.innerWidth; }
function wH() { return window.innerHeight; }
function isMobile() { return wW() <= MOBILE_BP; }

function applyDeviceCameraPreset() {
  const mobile = isMobile();

  // On first run, pick a base focal. On later runs, keep current focal but re-clamp.
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
  var container = document.getElementById("studio");
  var cover = document.getElementById("cover");
  cover.style.opacity = 1;

  camera = new THREE.PerspectiveCamera(70, wW() / wH(), 1, 2000);
  camera.target = new THREE.Vector3(0, 0, 0);

  scene = new THREE.Scene();

  // Slightly fewer segments on mobile for perf
  var segW = isMobile() ? 40 : 60;
  var segH = isMobile() ? 28 : 40;
  var geometry = new THREE.SphereGeometry(500, segW, segH);
  geometry.scale(-1, 1, 1);

  // ✅ Use small JPG on mobile, full JPG on desktop
  const texFile = isMobile()
    ? '250506_ms_studio_360_20-150.jpg'
    : '250506_ms_studio_360_20-150.jpg';
  const texPath = (import.meta.env.BASE_URL || '/') + texFile;

  const texture = new THREE.TextureLoader().load(texPath);
  texture.encoding = THREE.sRGBEncoding;

  const material = new THREE.MeshBasicMaterial({ map: texture });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(isMobile() ? 1 : Math.min(2, window.devicePixelRatio));
  renderer.setSize(wW(), wH());
  container.appendChild(renderer.domElement);

  // 🔑 Apply focal + clamps per device AFTER camera exists
  applyDeviceCameraPreset();

  // Event listeners
  cover.addEventListener("mousedown", onMouseDown, false);
  cover.addEventListener("mousemove", onMouseMove, false);
  cover.addEventListener("mouseup", onMouseUp, false);
  cover.addEventListener("wheel", onMouseWheel, { passive: false });

  cover.addEventListener("touchstart", onTouchStart, false);
  cover.addEventListener("touchmove", onTouchMove, false);
  cover.addEventListener("touchend", onTouchEnd, false);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = wW() / wH();
  camera.updateProjectionMatrix();

  // If device class flips across breakpoint, re-apply device preset
  const mobile = isMobile();
  if (mobile !== wasMobile) {
    applyDeviceCameraPreset();
  } else {
    // keep current focal but ensure it's within clamps
    focalLength = clampFocal(focalLength);
    camera.setFocalLength(focalLength);
    camera.updateProjectionMatrix();
  }

  renderer.setPixelRatio(mobile ? 1 : Math.min(2, window.devicePixelRatio));
  renderer.setSize(wW(), wH());
}

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var header = document.getElementById('idheader');
var footer = document.getElementById('idfooter');
var headings = document.querySelectorAll('h3');

function onMouseDown(e) {
  headings.forEach(function(heading) { heading.style.color = 'white'; });
  if (header) header.style.mixBlendMode = 'difference';
  if (footer) footer.style.mixBlendMode = 'difference';
  e.preventDefault();

  isUserInteracting = true;
  document.getElementById("cover").style.opacity = 0;

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
      document.getElementById("cover").style.opacity = 1;
    }
  }, 500);
}

function clampFocal(f) {
  return Math.max(minFocalLength, Math.min(maxFocalLength, f));
}

function onMouseWheel(e) {
  e.preventDefault();
  const zoomSpeed = 0.5;
  // Wheel up (deltaY < 0) => zoom in; down => zoom out
  focalLength -= e.deltaY * zoomSpeed * 0.01; // inverted
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
    var delta = pinchDistanceEnd - pinchDistanceStart;

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
  var dx = touches[0].clientX - touches[1].clientX;
  var dy = touches[0].clientY - touches[1].clientY;
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
