import * as THREE from 'three';

var camera, scene, renderer;
var isUserInteracting = false, isPinching = false, lon = 0, lat = 0, phi = 0, theta = 0;
var initialFOV = getFOV(), fov = initialFOV, pinchDistanceStart = 0, pinchDistanceEnd = 0;

init();
animate();

function wW() {
  return window.innerWidth;
}
function wH() {
  return window.innerHeight;
}

function getFOV() {
  return window.innerWidth <= 1024 ? 90 : 70; // Use a larger FOV for phones
}

function init() {
  var container, cover, mesh, loader = new THREE.TextureLoader();

  container = document.getElementById("studio");
  cover = document.getElementById("cover");
  cover.style.opacity = 1;
  camera = new THREE.PerspectiveCamera(fov, wW() / wH(), 1, 2000);
  camera.target = new THREE.Vector3(0, 0, 0);

  scene = new THREE.Scene();

  var geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  const texture = new THREE.TextureLoader().load(import.meta.env.BASE_URL + '250107_180.jpg')
  texture.encoding = THREE.sRGBEncoding;
  const material = new THREE.MeshBasicMaterial({ map: texture });

  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(wW(), wH());
  container.appendChild(renderer.domElement);

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
  camera.fov = getFOV();
  camera.updateProjectionMatrix();
  renderer.setSize(wW(), wH());
}

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var header = document.getElementById('idheader');
var footer = document.getElementById('idfooter');
var headings = document.querySelectorAll('h3');
function onMouseDown(e) {
  headings.forEach(function(heading) {
    heading.style.color = 'white';
  });
  header.style.mixBlendMode = 'difference';
  footer.style.mixBlendMode = 'difference';
  e.preventDefault();

  isUserInteracting = true;
  document.getElementById("cover").style.opacity = 0; // Hide cover on interaction

  onPointerDownPointerX = e.clientX;
  onPointerDownPointerY = e.clientY;
  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onMouseMove(e) {
  if (isUserInteracting && !isPinching) {
    // Adjust sensitivity based on screen width
    const sensitivity = window.innerWidth <= 1024 ? 0.3 : 0.2;

    lon = (onPointerDownPointerX - e.clientX) * sensitivity + onPointerDownLon;
    lat = (e.clientY - onPointerDownPointerY) * sensitivity + onPointerDownLat;
  }
}

function onMouseUp(e) {
  isUserInteracting = false;
  setTimeout(() => {
    if (!isUserInteracting) {
      document.getElementById("cover").style.opacity = 1; // Show cover after interaction stops
    }
  }, 500); // Delay to wait for any potential continued interaction
}

function onMouseWheel(e) {
  e.preventDefault();  // Prevent default page scrolling
  
  // The sign of deltaY determines direction (positive = scroll down, negative = scroll up)
  // Adjust multiplier to tweak zoom speed
  const zoomSpeed = 0.1;
  
  // If deltaY > 0, user is scrolling down => increase FOV => zoom out
  // If deltaY < 0, user is scrolling up => decrease FOV => zoom in
  fov += e.deltaY * zoomSpeed;
  
  // Same clamp logic as pinch: between 30 and initialFOV
  fov = Math.max(30, Math.min(initialFOV, fov));
  
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    onMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, preventDefault: () => e.preventDefault() });
  } else if (e.touches.length === 2) {
    isPinching = true;
    pinchDistanceStart = getPinchDistance(e.touches);
  }
}

function onTouchMove(e) {
  if (isPinching && e.touches.length === 2) {
    e.preventDefault(); // Prevent default action
    pinchDistanceEnd = getPinchDistance(e.touches);
    var delta = pinchDistanceEnd - pinchDistanceStart;
    fov -= delta * 0.2; // Adjust zoom speed
    fov = Math.max(30, Math.min(initialFOV, fov)); // Limit zoom in and out
    camera.fov = fov;
    camera.updateProjectionMatrix();
    pinchDistanceStart = pinchDistanceEnd;
  } else if (e.touches.length === 1) {
    onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
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
  if (!isUserInteracting && !isPinching);

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(camera.target);

  renderer.render(scene, camera);
}
