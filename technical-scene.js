import * as THREE from './vendor/three.module.js';

// Deliberately schematic architecture. Geometry, rays and energy paths are not
// manufacturing drawings, optical ray tracing, or power-transfer predictions.
const TAU = Math.PI * 2;
const NAMES = ['Carrier', 'Barrier', 'Circuits', 'Microdisplay & optics', 'Power & data', 'Sensing'];
const POSES = { stack: [-0.76, -0.36, -0.13], power: [-0.20, -0.20, -0.035], optics: [0.10, -0.19, -0.025] };
const clamp = THREE.MathUtils.clamp;
const zAt = r => -0.37 + 0.37 * r * r / (1.6 * 1.6);

function filmGeometry(inner, outer, segments = 112, rows = 10) {
  const vertices = [], normals = [], indices = [];
  for (let row = 0; row <= rows; row++) {
    const r = inner + (outer - inner) * row / rows;
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * TAU, x = Math.cos(a) * r, y = Math.sin(a) * r;
      vertices.push(x, y, zAt(r));
      const n = new THREE.Vector3(-0.289 * x, -0.289 * y, 1).normalize();
      normals.push(n.x, n.y, n.z);
    }
  }
  for (let row = 0; row < rows; row++) for (let i = 0; i < segments; i++) {
    const a = row * (segments + 1) + i, b = a + segments + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

function pointsOnRing(r, start = 0, sweep = TAU, z = 0, segments = 96) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = start + sweep * i / segments;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, zAt(r) + z);
  });
}

function lineGeometry(paths) {
  const vertices = [];
  for (const path of paths) for (let i = 1; i < path.length; i++) vertices.push(...path[i - 1].toArray(), ...path[i].toArray());
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
}

function roundedBox(width, height, depth, radius = 0.1) {
  const x = -width / 2, y = -height / 2, s = new THREE.Shape();
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius); s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height); s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.016, bevelThickness: 0.016, curveSegments: 8 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

export function createTechnicalScene({ container, onSelect } = {}) {
  if (!container?.appendChild) throw new TypeError('createTechnicalScene requires a container element.');
  let renderer, fallback;
  const fallbackView = reason => {
    if (fallback) return;
    container.classList.add('technical-scene--fallback', 'lens-scene--fallback');
    fallback = document.createElement('div');
    fallback.className = 'technical-scene-fallback';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Schematic lens layers. Interactive 3D is unavailable.');
    fallback.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;color:#a7cde0;';
    fallback.innerHTML = '<svg viewBox="0 0 600 480" width="100%" height="100%" aria-hidden="true"><g fill="#9acbe3" fill-opacity=".045" stroke="#8dbfd7" stroke-width="1.3"><ellipse cx="300" cy="126" rx="146" ry="61"/><ellipse cx="300" cy="169" rx="146" ry="61"/><ellipse cx="300" cy="212" rx="146" ry="61"/><ellipse cx="300" cy="255" rx="146" ry="61"/><ellipse cx="300" cy="298" rx="146" ry="61"/><ellipse cx="300" cy="341" rx="146" ry="61"/></g><text x="300" y="444" fill="#8ba8bc" font-family="Arial,sans-serif" font-size="12" text-anchor="middle">Schematic architecture · 3D view unavailable</text></svg>';
    container.appendChild(fallback);
    queueMicrotask(() => container.dispatchEvent(new CustomEvent('technicalscene:error', { detail: { reason } })));
  };
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (error) {
    fallbackView(error.message || 'WebGL unavailable');
    return { setView() {}, setExploded() {}, setActiveComponent() {}, setPaused() {}, reset() {}, destroy() { fallback?.remove(); container.classList.remove('technical-scene--fallback', 'lens-scene--fallback'); } };
  }

  const resources = new Set(), textures = new Set(), picks = [], accents = [], flows = [], fields = [];
  const keep = item => (resources.add(item), item);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
  const canvas = renderer.domElement;
  canvas.className = 'technical-scene-canvas';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive conceptual lens architecture. Use the external view and component controls; drag to rotate.');
  container.appendChild(canvas); container.classList.add('technical-scene--ready');

  const environment = new THREE.Scene();
  environment.background = new THREE.Color(0x344f63);
  const envResources = [];
  for (const [w, h, x, y, z, intensity] of [[5, 3, -4, 5, 4, 3], [1.2, 5, 4, 1, 3, 2], [4, 1, 0, -4, 3, 1.7], [4, 3, 0, 3, -4, 1]]) {
    const geometry = new THREE.PlaneGeometry(w, h), material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe0f3ff).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
    const panel = new THREE.Mesh(geometry, material); panel.position.set(x, y, z); panel.lookAt(0, 0, 0);
    environment.add(panel); envResources.push(geometry, material);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget;
  try { envTarget = pmrem.fromScene(environment, 0.07, 0.1, 40); scene.environment = envTarget.texture; } catch { /* Lit fallback remains usable. */ }
  finally { pmrem.dispose(); envResources.forEach(x => x.dispose()); environment.clear(); }
  scene.add(new THREE.HemisphereLight(0xd9f3ff, 0x102a41, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8ddcff, 2.4); rim.position.set(4, 1, -2); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  const views = Object.fromEntries(['stack', 'power', 'optics'].map(name => { const group = new THREE.Group(); group.name = name; root.add(group); return [name, group]; }));
  const layers = Array.from({ length: 6 }, (_, index) => { const group = new THREE.Group(); group.name = NAMES[index]; views.stack.add(group); return group; });
  function material(options = {}, index = -1, basic = false) {
    const mat = keep(basic ? new THREE.MeshBasicMaterial(options) : new THREE.MeshPhysicalMaterial({ roughness: 0.25, metalness: 0.35, clearcoat: 0.8, ...options }));
    if (index >= 0) accents.push({ mat, index, color: mat.color.clone(), emissive: mat.emissiveIntensity || 0, opacity: mat.opacity });
    return mat;
  }
  function mesh(parent, geometry, mat, index = -1, priority = 2) {
    const object = new THREE.Mesh(keep(geometry), mat); parent.add(object);
    object.userData.component = index; object.userData.priority = priority;
    if (index >= 0) picks.push(object);
    return object;
  }
  function glass(index, opacity = 0.10) {
    return material({ color: 0xaddbeb, roughness: 0.09, metalness: 0, transmission: 0.58, thickness: 0.025, ior: 1.4, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.1 }, index);
  }
  function lines(parent, paths, color = 0x8ecae5, opacity = 0.72, index = -1) {
    const mat = keep(new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    if (index >= 0) accents.push({ mat, index, color: mat.color.clone(), emissive: 0, opacity });
    const object = new THREE.LineSegments(keep(lineGeometry(paths)), mat); parent.add(object); return object;
  }
  function ring(parent, radius, index, width = 0.008, color = 0x9ddbee, opacity = 1) {
    const object = mesh(parent, new THREE.TorusGeometry(radius, width, 6, 112), material({ color, emissive: color, emissiveIntensity: 0.11, metalness: 0.6, transparent: opacity < 1, opacity }, index), index, 5);
    object.position.z = zAt(radius); return object;
  }
  function spiral(parent, startRadius, endRadius, turns, index, width = 0.006) {
    const points = Array.from({ length: 481 }, (_, i) => { const a = 0.18 + TAU * turns * i / 480, r = startRadius + (endRadius - startRadius) * i / 480; return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, zAt(r) + 0.01); });
    return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 480, width, 5, false), material({ color: 0x85c4dd, emissive: 0x4fafd7, emissiveIntensity: 0.18, metalness: 0.75, roughness: 0.24 }, index), index, 6);
  }
  function displayChip(parent, index, size = 1) {
    const group = new THREE.Group(); group.scale.setScalar(size); parent.add(group);
    mesh(group, roundedBox(0.36, 0.25, 0.04, 0.025), material({ color: 0x698d9f, metalness: 0.92, roughness: 0.2 }, index), index, 10);
    const pixels = document.createElement('canvas'); pixels.width = 128; pixels.height = 88;
    const context = pixels.getContext('2d');
    if (context) { context.fillStyle = '#02192c'; context.fillRect(0, 0, 128, 88); for (let y = 6; y < 84; y += 6) for (let x = 7; x < 123; x += 6) { context.fillStyle = `rgba(123,218,255,${0.44 + 0.3 * (1 - Math.abs(x / 128 - 0.5))})`; context.fillRect(x, y, 3, 3); } }
    const texture = new THREE.CanvasTexture(pixels); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const face = mesh(group, new THREE.PlaneGeometry(0.31, 0.205), material({ map: texture, emissiveMap: texture, emissive: 0x8bdfff, emissiveIntensity: 0.55, metalness: 0.2 }, index), index, 11); face.position.z = 0.040;
    const pinMat = material({ color: 0xc2dfe7, metalness: 0.9 }, index);
    const pins = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(0.027, 0.012, 0.01)), pinMat, 14), matrix = new THREE.Matrix4();
    for (let i = 0; i < 14; i++) { matrix.makeTranslation(i < 7 ? -0.195 : 0.195, -0.085 + (i % 7) * 0.028, 0); pins.setMatrixAt(i, matrix); }
    group.add(pins); return group;
  }
  function sensorIslands(parent, radius, scale = 1) {
    const body = material({ color: 0x23495f, metalness: 0.68 }, 5), cap = material({ color: 0xb0d4df, metalness: 0.8, roughness: 0.22 }, 5);
    for (const a of [0.3, 1.85, 3.42, 5.0]) {
      const group = new THREE.Group(); group.position.set(Math.cos(a) * radius, Math.sin(a) * radius, zAt(radius) + 0.025); group.rotation.z = a; group.scale.setScalar(scale); parent.add(group);
      mesh(group, roundedBox(0.23, 0.16, 0.025, 0.02), body, 5, 8);
      const tile = mesh(group, new THREE.BoxGeometry(0.13, 0.085, 0.012), cap, 5, 9); tile.position.z = 0.037;
    }
  }
  function circuits(parent, index = 2) {
    const paths = [];
    for (let sector = 0; sector < 8; sector++) for (let lane = 0; lane < 3; lane++) {
      const start = sector * TAU / 8 + 0.035, r = 1.06 + lane * 0.066;
      const path = pointsOnRing(r, start, 0.57 - lane * 0.025, 0.014, 24);
      const a = start + 0.57 - lane * 0.025, end = 1.40 + lane * 0.025;
      path.push(new THREE.Vector3(Math.cos(a) * end, Math.sin(a) * end, zAt(end) + 0.014));
      paths.push(path, pointsOnRing(end, a, 0.06, 0.014, 5));
    }
    lines(parent, paths, 0x88bfd8, 0.88, index);
  }

  // STACK — six mechanically separated, individually inspectable component groups.
  mesh(layers[0], filmGeometry(0, 1.6), glass(0, 0.16), 0, 1); ring(layers[0], 1.6, 0, 0.013, 0xb9ecff);
  mesh(layers[1], filmGeometry(0, 1.54), glass(1, 0.085), 1, 1); ring(layers[1], 1.54, 1, 0.005, 0x77b7d3, 0.8);
  lines(layers[1], [pointsOnRing(1.46), pointsOnRing(1.49)], 0x67a8c3, 0.36, 1);
  mesh(layers[2], filmGeometry(0.97, 1.49), glass(2, 0.13), 2, 1); circuits(layers[2]); ring(layers[2], 1.49, 2, 0.004, 0x6ea9c5, 0.7);
  mesh(layers[3], filmGeometry(0, 1.46), glass(3, 0.065), 3, 1);
  lines(layers[3], [0.42, 0.45, 0.48, 0.51, 0.54, 0.57].map(r => pointsOnRing(r)), 0xa9e4f8, 0.46, 3);
  const stackChip = displayChip(layers[3], 3); stackChip.position.set(1.03, -0.62, zAt(1.2) + 0.03); stackChip.rotation.z = 0.55;
  const projection = mesh(layers[3], new THREE.SphereGeometry(0.15, 24, 16), glass(3, 0.3), 3, 9); projection.scale.set(1.15, 0.7, 0.28); projection.position.set(0.77, -0.42, -0.20);
  mesh(layers[4], filmGeometry(1.24, 1.53), glass(4, 0.12), 4, 1); spiral(layers[4], 1.51, 1.29, 4.2, 4);
  mesh(layers[5], filmGeometry(1.10, 1.45), glass(5, 0.11), 5, 1); sensorIslands(layers[5], 1.28); ring(layers[5], 1.45, 5, 0.005, 0x6da3bf, 0.7);
  const layerHalos = layers.map((group, index) => {
    const halo = mesh(group, new THREE.TorusGeometry([1.62, 1.56, 1.51, 1.48, 1.55, 1.47][index], 0.006, 6, 112), material({ color: 0xbfefff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }, -1, true));
    halo.position.z = 0.01; return halo;
  });

  // POWER — an external companion, coupling path, and on-lens receiving interface.
  const pod = new THREE.Group(); pod.position.set(-1.8, 0, 0); pod.rotation.set(0.08, 0.12, -0.09); views.power.add(pod);
  mesh(pod, roundedBox(1.04, 1.65, 0.18, 0.18), material({ color: 0x506f82, metalness: 0.88, roughness: 0.28 }, 4), 4, 5);
  const front = mesh(pod, roundedBox(0.94, 1.54, 0.016, 0.145), material({ color: 0x0b2337, metalness: 0.22, roughness: 0.24 }, 4), 4, 6); front.position.z = 0.10;
  for (let i = 0; i < 5; i++) { const coil = ring(pod, 0.285 + i * 0.025, 4, 0.007, 0x70bddc); coil.position.z = 0.127; coil.position.y = 0.13; }
  const powerDie = displayChip(pod, 4, 0.76); powerDie.position.set(0, -0.48, 0.13);
  const led = mesh(pod, new THREE.SphereGeometry(0.025, 12, 8), material({ color: 0xc5f3ff, toneMapped: false }, 4, true), 4); led.position.set(0.29, 0.60, 0.14);
  const poweredLens = new THREE.Group(); poweredLens.position.set(1.32, 0, 0); poweredLens.rotation.set(-0.19, 0.27, -0.16); poweredLens.scale.setScalar(0.78); views.power.add(poweredLens);
  mesh(poweredLens, filmGeometry(0, 1.6), glass(0, 0.13), 0, 1); ring(poweredLens, 1.6, 0, 0.011, 0xaddff2); spiral(poweredLens, 1.49, 1.30, 4, 4);
  circuits(poweredLens); sensorIslands(poweredLens, 1.24, 0.8);
  const receiverChip = displayChip(poweredLens, 3, 0.85); receiverChip.position.set(0.93, -0.57, zAt(1.09) + 0.025); receiverChip.rotation.z = 0.55;
  function animatedPath(parent, points, count, speed, index, color = 0x89dfff, radius = 0.025, phase = 0) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const path = mesh(parent, new THREE.TubeGeometry(curve, 96, 0.004, 4, false), material({ color, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }, -1, true));
    path.userData.decorative = true;
    const geometry = keep(new THREE.SphereGeometry(radius, 10, 7)), mat = material({ color, toneMapped: false }, index, true);
    for (let i = 0; i < count; i++) { const packet = new THREE.Mesh(geometry, mat); parent.add(packet); flows.push({ object: packet, parent, curve, phase: (i / count + phase) % 1, speed }); }
    return curve;
  }
  animatedPath(views.power, [[-1.43, 0.15, 0.30], [-0.77, 0.72, 0.48], [0, 0.65, 0.5], [0.51, 0.15, 0.26]], 7, 0.16, 4, 0xa9eaff, 0.026);
  animatedPath(views.power, [[0.51, -0.15, 0.2], [-0.1, -0.55, 0.35], [-0.85, -0.49, 0.32], [-1.43, -0.15, 0.2]], 4, 0.11, 4, 0x4c9cc5, 0.018, 0.08);
  for (let i = 0; i < 3; i++) {
    const mat = material({ color: 0x7fd5fb, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }, -1, true);
    const field = new THREE.Mesh(keep(new THREE.TorusGeometry(0.23 + i * 0.12, 0.0035, 4, 64)), mat);
    field.position.set(-0.59 + i * 0.18, 0.2, 0.27); field.rotation.y = Math.PI / 2 - 0.3; views.power.add(field); fields.push({ object: field, phase: i / 3 });
  }

  // OPTICS — an explicitly schematic display-to-retina bundle, not a ray tracer.
  const eye = new THREE.Group(); eye.position.set(0.75, 0, 0); views.optics.add(eye);
  const shell = mesh(eye, new THREE.SphereGeometry(1.38, 64, 40), glass(-1, 0.065));
  shell.scale.set(1, 0.95, 0.95);
  const meridians = [];
  for (const a of [0, Math.PI / 2]) {
    meridians.push(Array.from({ length: 145 }, (_, i) => { const u = i / 144 * TAU; return new THREE.Vector3(Math.cos(u) * 1.39, Math.sin(u) * 1.31 * Math.cos(a), Math.sin(u) * 1.31 * Math.sin(a)); }));
  }
  lines(eye, meridians, 0x8eb8ce, 0.22);
  const retina = mesh(eye, filmGeometry(0, 0.88), material({ color: 0x4582a0, emissive: 0x1f678a, emissiveIntensity: 0.2, metalness: 0, transparent: true, opacity: 0.21, side: THREE.DoubleSide, depthWrite: false }));
  retina.rotation.y = -Math.PI / 2; retina.position.x = 0.98;
  const retinaRings = new THREE.Group(); retinaRings.rotation.y = -Math.PI / 2; retinaRings.position.x = 0.995; eye.add(retinaRings);
  lines(retinaRings, [pointsOnRing(0.30), pointsOnRing(0.57), pointsOnRing(0.85)], 0x8bd5f2, 0.23);
  const eyeLens = mesh(eye, new THREE.SphereGeometry(0.47, 40, 28), glass(-1, 0.16)); eyeLens.scale.set(0.27, 1, 1); eyeLens.position.x = -0.64;
  const iris = mesh(eye, new THREE.RingGeometry(0.25, 0.65, 64), material({ color: 0x214e69, metalness: 0.2, transparent: true, opacity: 0.44, side: THREE.DoubleSide, depthWrite: false })); iris.rotation.y = Math.PI / 2; iris.position.x = -0.89;
  const cornea = new THREE.Group(); cornea.position.set(-0.64, 0, 0); cornea.rotation.y = -Math.PI / 2; cornea.scale.setScalar(0.69); views.optics.add(cornea);
  mesh(cornea, filmGeometry(0, 1.25), glass(0, 0.15), 0, 1); ring(cornea, 1.25, 0, 0.01, 0x98d9f1);
  const emitter = displayChip(views.optics, 3, 1.12); emitter.position.set(-2.03, -0.51, 0.15); emitter.rotation.set(0.0, 0.18, -0.13);
  const opticMount = mesh(views.optics, new THREE.TorusGeometry(0.24, 0.013, 8, 64), material({ color: 0xb0d9e5, metalness: 0.8 }, 3), 3, 8);
  opticMount.position.set(-1.42, -0.10, 0.08); opticMount.rotation.y = Math.PI / 2;
  const optic = mesh(views.optics, new THREE.SphereGeometry(0.225, 32, 24), glass(3, 0.29), 3, 9); optic.scale.set(0.32, 1, 1); optic.position.copy(opticMount.position);
  for (let i = 0; i < 7; i++) {
    const h = (i - 3) * 0.055;
    animatedPath(views.optics, [[-1.87, -0.47 + h * 0.35, 0.20], [-1.43, -0.1 + h, 0.10], [-0.60, h * 1.6, 0.035], [0.15, h * 1.55, 0.025], [2.095, h * 0.45, 0.01]], 2, 0.115 + i * 0.003, 3, i % 2 ? 0x79c8ed : 0xb4ecff, 0.012, i * 0.13);
  }
  const focus = mesh(views.optics, new THREE.SphereGeometry(0.045, 16, 10), material({ color: 0xd8f7ff, transparent: true, opacity: 0.75, toneMapped: false }, -1, true)); focus.position.set(2.095, 0, 0.012);

  const media = window.matchMedia('(prefers-reduced-motion: reduce)'), coarse = window.matchMedia('(pointer: coarse)');
  let view = 'stack', active = -1, targetExplosion = 0.85, explosion = 0.85, paused = false, reduced = media.matches;
  let destroyed = false, lost = false, visible = false, width = 1, height = 1, raf = 0, previous = 0, elapsed = 0;
  let pitch = POSES.stack[0], yaw = POSES.stack[1], rx = pitch, ry = yaw, pointer = null, cachedPose = null;
  const bounds = new THREE.Box3(), center = new THREE.Vector3(), size = new THREE.Vector3(), raycaster = new THREE.Raycaster(), cursor = new THREE.Vector2();
  function inView() { return !destroyed && !lost && visible && !document.hidden && width > 1 && height > 1; }
  function schedule() { if (!raf && inView()) raf = requestAnimationFrame(frame); }
  function cancel() { if (raf) cancelAnimationFrame(raf); raf = 0; previous = 0; }
  function update(dt) {
    const moving = !paused && !reduced, ease = moving ? 1 - Math.exp(-dt * 8) : 1;
    explosion += (targetExplosion - explosion) * ease;
    rx += (pitch - rx) * ease; ry += (yaw - ry) * ease;
    root.rotation.set(rx, ry, POSES[view][2]);
    for (const name of Object.keys(views)) views[name].visible = name === view;
    layers.forEach((layer, index) => { layer.position.z = (2.5 - index) * (0.038 + explosion * 0.69); layerHalos[index].material.opacity = active === index ? 0.84 : 0; });
    for (const entry of accents) {
      const selected = active === entry.index;
      if (entry.mat.emissive) entry.mat.emissiveIntensity = entry.emissive + (selected ? 0.25 : 0);
      if (entry.mat.isLineBasicMaterial) { entry.mat.color.copy(entry.color); if (selected) entry.mat.color.lerp(new THREE.Color(0xdbf6ff), 0.55); entry.mat.opacity = entry.opacity * (active < 0 || selected ? 1 : 0.58); }
    }
    for (const flow of flows) {
      const progress = (elapsed * flow.speed + flow.phase) % 1;
      flow.object.position.copy(flow.curve.getPointAt(progress));
      flow.object.scale.setScalar(0.7 + Math.sin(progress * Math.PI) * 0.4);
    }
    fields.forEach(({ object, phase }) => { object.material.opacity = 0.06 + 0.14 * (0.5 + 0.5 * Math.sin(elapsed * 2.4 - phase * TAU)); });
    focus.material.opacity = 0.58 + 0.18 * (0.5 + 0.5 * Math.sin(elapsed * 2));
    root.updateMatrixWorld(true);
    if (!cachedPose || cachedPose.view !== view || Math.abs(rx - cachedPose.x) > 0.004 || Math.abs(ry - cachedPose.y) > 0.004 || Math.abs(explosion - cachedPose.explosion) > 0.008) {
      bounds.setFromObject(views[view], true); bounds.getSize(size); bounds.getCenter(center);
      cachedPose = { view, x: rx, y: ry, explosion };
    }
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(size.y / (2 * tangent), size.x / (2 * tangent * camera.aspect)) * 1.08 + size.z / 2 + 0.08;
    camera.position.set(center.x, center.y + 0.015, center.z + distance); camera.lookAt(center);
  }
  function frame(now) {
    raf = 0; if (!inView()) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60; previous = now;
    if (!paused && !reduced) elapsed += dt;
    update(dt); renderer.render(scene, camera);
    const easing = Math.abs(explosion - targetExplosion) > 0.0003 || Math.abs(rx - pitch) + Math.abs(ry - yaw) > 0.0003;
    if (!paused && !reduced && (view !== 'stack' || easing)) schedule();
  }
  function resize() {
    if (destroyed) return;
    const rect = container.getBoundingClientRect(); width = Math.round(rect.width); height = Math.round(rect.height);
    if (width < 2 || height < 2) { cancel(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse.matches || window.innerWidth < 760 ? 1.4 : 1.8));
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth; schedule();
  }
  function pick(x, y) {
    const rect = canvas.getBoundingClientRect(); cursor.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(cursor, camera); root.updateMatrixWorld(true);
    const eligible = picks.filter(object => { let parent = object; while (parent) { if (!parent.visible) return false; parent = parent.parent; } return true; });
    const hits = raycaster.intersectObjects(eligible, false);
    if (view !== 'stack' || explosion < 0.15) hits.sort((a, b) => b.object.userData.priority - a.object.userData.priority || a.distance - b.distance);
    const chosen = hits.find(hit => hit.object.userData.priority > 1) || hits[0]; return chosen?.object.userData.component ?? null;
  }
  function down(event) {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    canvas.style.cursor = 'grabbing'; try { canvas.setPointerCapture(event.pointerId); } catch { /* Detached canvas. */ }
  }
  function move(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5) pointer.moved = true;
    if (pointer.moved) { yaw += (event.clientX - pointer.lastX) * 0.006; pitch = clamp(pitch + (event.clientY - pointer.lastY) * 0.0045, -1.3, 1.3); schedule(); }
    pointer.lastX = event.clientX; pointer.lastY = event.clientY;
  }
  function up(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const clicked = !pointer.moved; pointer = null; canvas.style.cursor = 'grab';
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    if (clicked && event.type === 'pointerup') { const index = pick(event.clientX, event.clientY); if (index !== null) { active = index; onSelect?.(index); container.dispatchEvent(new CustomEvent('technicalscene:select', { detail: { index, name: NAMES[index], view } })); } }
    schedule();
  }
  function motion(event) { reduced = event.matches; cancel(); schedule(); }
  function visibility() { document.hidden ? cancel() : schedule(); }
  function contextLost(event) { event.preventDefault(); lost = true; cancel(); canvas.style.visibility = 'hidden'; fallbackView('WebGL context lost'); }
  function contextRestored() { lost = false; fallback?.remove(); fallback = null; canvas.style.visibility = ''; container.classList.remove('technical-scene--fallback', 'lens-scene--fallback'); resize(); }
  const events = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['lostpointercapture', up], ['webglcontextlost', contextLost], ['webglcontextrestored', contextRestored]];
  events.forEach(([name, handler]) => canvas.addEventListener(name, handler));
  document.addEventListener('visibilitychange', visibility); media.addEventListener('change', motion);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? schedule() : cancel(); }, { threshold: 0 }); observer.observe(container);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); window.addEventListener('resize', resize, { passive: true }); resize();

  return {
    setView(mode) { if (destroyed || !POSES[mode]) return; view = mode; pitch = POSES[mode][0]; yaw = POSES[mode][1]; rx = pitch; ry = yaw; cachedPose = null; pointer = null; canvas.style.cursor = 'grab'; schedule(); },
    setExploded(value) { if (!destroyed) { targetExplosion = clamp(Number(value) || 0, 0, 1); schedule(); } },
    setActiveComponent(index) { if (!destroyed) { active = Number.isInteger(index) && index >= 0 && index < 6 ? index : -1; schedule(); } },
    setPaused(value) { if (!destroyed) { paused = Boolean(value); cancel(); schedule(); } },
    reset() { if (!destroyed) { pitch = POSES[view][0]; yaw = POSES[view][1]; targetExplosion = 0.85; active = -1; elapsed = 0; pointer = null; canvas.style.cursor = 'grab'; schedule(); } },
    destroy() {
      if (destroyed) return; destroyed = true; cancel(); observer.disconnect(); resizeObserver.disconnect();
      events.forEach(([name, handler]) => canvas.removeEventListener(name, handler)); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', motion); window.removeEventListener('resize', resize);
      scene.clear(); resources.forEach(item => item.dispose()); textures.forEach(item => item.dispose()); envTarget?.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); fallback?.remove();
      container.classList.remove('technical-scene--ready', 'technical-scene--fallback', 'lens-scene--fallback');
    }
  };
}
