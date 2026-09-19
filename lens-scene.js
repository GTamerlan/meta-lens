import * as THREE from './vendor/three.module.js';

// An illustrative product sculpture, not a validated optical or electrical design.
// Each instance owns its renderer, environment and resources; two instances are safe.
const TAU = Math.PI * 2;
const RADIUS = 2;
const LAYER_NAMES = ['Surface & fit', 'Display & optics', 'Sensing', 'Interconnects', 'Power interface'];
const LAYER_RADII = [2, 1.86, 1.78, 1.82, 1.92];
const clamp = THREE.MathUtils.clamp;
const curveZ = r => -0.46 + 0.46 * (r * r) / (RADIUS * RADIUS);

function curvedFilm(inner, outer, { thickness = 0, start = 0, sweep = TAU, steps = 144, rows = 16 } = {}) {
  const positions = [], normals = [], uvs = [], indices = [];
  const sides = thickness ? 2 : 1;
  const stride = steps + 1;
  for (let side = 0; side < sides; side++) {
    const sign = side ? -1 : 1;
    for (let row = 0; row <= rows; row++) {
      const r = inner + (outer - inner) * row / rows;
      for (let j = 0; j <= steps; j++) {
        const a = start + sweep * j / steps;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        positions.push(x, y, curveZ(r) + sign * thickness / 2);
        const normal = new THREE.Vector3(-0.23 * x, -0.23 * y, 1).normalize().multiplyScalar(sign);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(0.5 + x / (RADIUS * 2), 0.5 + y / (RADIUS * 2));
      }
    }
    const offset = side * (rows + 1) * stride;
    for (let row = 0; row < rows; row++) {
      for (let j = 0; j < steps; j++) {
        const a = offset + row * stride + j, b = a + stride;
        if (!side) indices.push(a, b, a + 1, b, b + 1, a + 1);
        else indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  // The rounded-looking, very thin edge closes the shell without a thick disk.
  if (thickness) {
    const offset = positions.length / 3;
    for (let j = 0; j <= steps; j++) {
      const a = start + sweep * j / steps;
      const x = Math.cos(a), y = Math.sin(a);
      for (const sign of [1, -1]) {
        positions.push(x * outer, y * outer, curveZ(outer) + sign * thickness / 2);
        normals.push(x, y, 0);
        uvs.push(j / steps, sign > 0 ? 1 : 0);
      }
    }
    for (let j = 0; j < steps; j++) {
      const a = offset + j * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function arcPoints(radius, start = 0, sweep = TAU, zOffset = 0, segments = 144) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = start + sweep * i / segments;
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, curveZ(radius) + zOffset);
  });
}

function linesGeometry(paths) {
  const points = [];
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) points.push(...path[i - 1].toArray(), ...path[i].toArray());
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFallback(container, mode, reason) {
  container.classList.add('lens-scene--fallback');
  const fallback = document.createElement('div');
  fallback.className = 'lens-scene-fallback';
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', 'Illustration of a contact-lens concept. Interactive 3D is unavailable.');
  fallback.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;';
  const dark = mode === 'lab';
  fallback.innerHTML = `<svg viewBox="0 0 620 500" width="100%" height="100%" aria-hidden="true" style="max-width:720px;overflow:visible"><defs><radialGradient id="lens-fallback-${mode}"><stop offset="0" stop-color="${dark ? '#13293c' : '#effaff'}" stop-opacity=".12"/><stop offset=".85" stop-color="#a7dcf1" stop-opacity=".22"/><stop offset="1" stop-color="#6cbbdc" stop-opacity=".56"/></radialGradient></defs><g transform="translate(310 235) rotate(-24)"><ellipse rx="205" ry="149" fill="url(#lens-fallback-${mode})" stroke="#9ddcf3" stroke-width="2"/><ellipse rx="201" ry="145" fill="none" stroke="#e5f8ff" stroke-width="1.5"/><ellipse rx="182" ry="131" fill="none" stroke="#669db8" stroke-opacity=".65"/><ellipse rx="174" ry="125" fill="none" stroke="#669db8" stroke-opacity=".55"/><ellipse rx="159" ry="114" fill="none" stroke="#669db8" stroke-opacity=".45"/><ellipse rx="90" ry="65" fill="none" stroke="#b4e6f6" stroke-opacity=".6"/><rect x="102" y="48" width="28" height="18" rx="3" fill="#164c6c" stroke="#b4e6f6"/></g><text x="310" y="454" fill="${dark ? '#94adc0' : '#657f8d'}" font-family="Arial,sans-serif" font-size="13" text-anchor="middle">Product concept · 3D view unavailable</text></svg>`;
  container.appendChild(fallback);
  queueMicrotask(() => container.dispatchEvent(new CustomEvent('lensscene:error', { detail: { reason, mode } })));
  return fallback;
}

/**
 * @param {{container: HTMLElement, mode?: 'hero'|'lab', onSelect?: (index:number)=>void}} options
 * @returns {{setExploded:(value:boolean|number)=>void, setActiveLayer:(index:number)=>void,
 * setPaused:(value:boolean)=>void, reset:()=>void, destroy:()=>void}}
 */
export function createLensScene({ container, mode = 'hero', onSelect } = {}) {
  if (!container?.appendChild) throw new TypeError('createLensScene requires a container element.');
  const dark = mode === 'lab';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (error) {
    const fallback = makeFallback(container, mode, error.message || 'WebGL unavailable');
    return {
      setExploded() {}, setActiveLayer() {}, setPaused() {}, reset() {},
      destroy() { fallback.remove(); container.classList.remove('lens-scene--fallback'); }
    };
  }

  const geometries = new Set(), materials = new Set(), textures = new Set();
  const g = geometry => (geometries.add(geometry), geometry);
  const m = material => (materials.add(material), material);
  const t = texture => (textures.add(texture), texture);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = dark ? 1.28 : 1.12;
  const canvas = renderer.domElement;
  canvas.className = 'lens-scene-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive contact-lens concept. Drag to rotate; use the adjacent controls to explore five illustrative layers.');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none;';
  container.appendChild(canvas);
  container.classList.add('lens-scene--ready');

  // A self-contained photographic studio for reflections, not an external HDRI.
  // High-intensity panels keep broad, clean highlights on the curved polymer.
  let environmentTarget = null;
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(dark ? 0x344e65 : 0xb1c3d2);
  const studioResources = [];
  function softbox(color, intensity, width, height, position) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(...position);
    plane.lookAt(0, 0, 0);
    studio.add(plane);
    studioResources.push(geometry, material);
  }
  softbox(0xffffff, 3.0, 5.2, 3.0, [-3.8, 4.5, 4]);
  softbox(0xd8efff, 1.9, 1.0, 5.5, [4, 0.8, 2.8]);
  softbox(0xffffff, 2.2, 4.2, 1.2, [0, -3.5, 4]);
  softbox(0x5a829f, 0.65, 8, 8, [0, -4.8, -1]);
  softbox(0xc3e5f4, 1.25, 4.5, 2, [0, 4, -4]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  try {
    environmentTarget = pmrem.fromScene(studio, 0.07, 0.1, 40);
    scene.environment = environmentTarget.texture;
  } catch {
    // The directional lights still provide a usable model on constrained GPUs.
  } finally {
    pmrem.dispose();
    studioResources.forEach(resource => resource.dispose());
    studio.clear();
  }
  scene.add(new THREE.HemisphereLight(0xe4f7ff, dark ? 0x233c52 : 0x738ea1, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0x91d9ff, dark ? 3.2 : 1.8);
  edge.position.set(4, 1, -2);
  scene.add(edge);

  const model = new THREE.Group();
  scene.add(model);
  const layers = LAYER_NAMES.map((name, index) => {
    const group = new THREE.Group();
    group.name = name;
    group.userData.layerIndex = index;
    model.add(group);
    return group;
  });
  const picks = [], accents = [], halos = [];
  function mesh(layer, geometry, material, priority = 3) {
    const object = new THREE.Mesh(g(geometry), m(material));
    object.userData.layerIndex = layer;
    object.userData.pickPriority = priority;
    layers[layer].add(object);
    picks.push(object);
    return object;
  }
  function accent(material, layer) {
    accents.push({ material, layer, color: material.color?.clone(), opacity: material.opacity, emissiveIntensity: material.emissiveIntensity || 0 });
    return material;
  }
  function linePaths(layer, paths, color, opacity = 0.8) {
    const material = m(accent(new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }), layer));
    const object = new THREE.LineSegments(g(linesGeometry(paths)), material);
    object.userData.layerIndex = layer;
    layers[layer].add(object);
    return object;
  }
  function ring(layer, radius, thickness, color, opacity = 1, offset = 0) {
    const object = mesh(layer, new THREE.TorusGeometry(radius, thickness, 8, 160), accent(new THREE.MeshPhysicalMaterial({ color, metalness: 0.35, roughness: 0.23, clearcoat: 1, transparent: opacity < 1, opacity, emissive: color, emissiveIntensity: dark ? 0.18 : 0.045 }), layer), 4);
    object.position.z = curveZ(radius) + offset;
    return object;
  }
  function film(layer, inner, outer, opacity, thickness = 0) {
    return mesh(layer, curvedFilm(inner, outer, { thickness }), new THREE.MeshPhysicalMaterial({
      color: dark ? 0xaeddef : 0xc3e7f5, metalness: 0, roughness: 0.095,
      transmission: 0.66, thickness: thickness || 0.025, ior: 1.4,
      transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
      clearcoat: 1, clearcoatRoughness: 0.075, envMapIntensity: dark ? 0.9 : 1.08,
      attenuationColor: new THREE.Color(0xa0d8f0), attenuationDistance: 1.3
    }), 1);
  }

  // 0 — the clear, shallow bowl and its polished, ice-blue edge.
  film(0, 0, RADIUS, dark ? 0.15 : 0.20, 0.03);
  ring(0, RADIUS, dark ? 0.012 : 0.0144, dark ? 0xb7efff : 0x89d4ef, 0.9);
  ring(0, 1.976, 0.0035, dark ? 0x74bddb : 0x65adce, dark ? 0.7 : 0.84, -0.011);
  linePaths(0, [arcPoints(1.97, 0.5, 0.78, 0.007, 50)], 0xf3fcff, 0.88);

  // 1 — an optical film, restrained microstructure and a peripheral display die.
  film(1, 0, 1.86, dark ? 0.075 : 0.085);
  const opticalPaths = [0.67, 0.704, 0.738, 0.772, 0.806, 0.84].map(r => arcPoints(r, 0, TAU, 0.012, 128));
  opticalPaths.push(arcPoints(1.835, 0, TAU, 0.012));
  linePaths(1, opticalPaths, dark ? 0x8ecfe9 : 0x689eb8, dark ? 0.40 : 0.31);
  const display = new THREE.Group();
  const displayAngle = -0.61, displayRadius = 1.38;
  display.position.set(Math.cos(displayAngle) * displayRadius, Math.sin(displayAngle) * displayRadius, curveZ(displayRadius) + 0.035);
  display.rotation.set(0.23 * display.position.y, -0.23 * display.position.x, displayAngle + Math.PI / 2);
  layers[1].add(display);
  const bezel = mesh(1, new THREE.BoxGeometry(0.38, 0.27, 0.042), accent(new THREE.MeshPhysicalMaterial({ color: 0x7293a8, metalness: 0.88, roughness: 0.23, clearcoat: 1 }), 1), 10);
  display.add(bezel);
  const pixels = t(canvasTexture(128, 96, (ctx, w, h) => {
    ctx.fillStyle = '#031d32'; ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 7; y += 7) for (let x = 8; x < w - 7; x += 7) {
      const intensity = 0.32 + 0.55 * (1 - Math.abs(x / w - 0.47)) * (1 - Math.abs(y / h - 0.5));
      ctx.fillStyle = `rgba(125,219,255,${intensity})`; ctx.fillRect(x, y, 4, 4);
    }
  }));
  const pixelFace = mesh(1, new THREE.PlaneGeometry(0.326, 0.218), accent(new THREE.MeshStandardMaterial({ map: pixels, emissiveMap: pixels, emissive: 0x7bdaff, emissiveIntensity: dark ? 0.55 : 0.3, metalness: 0.25, roughness: 0.22 }), 1), 12);
  pixelFace.position.z = 0.023;
  display.add(pixelFace);
  const pinGeometry = g(new THREE.BoxGeometry(0.034, 0.014, 0.012));
  const pinMaterial = m(accent(new THREE.MeshStandardMaterial({ color: 0xb8d5de, metalness: 0.9, roughness: 0.27 }), 1));
  const pins = new THREE.InstancedMesh(pinGeometry, pinMaterial, 16);
  const matrix = new THREE.Matrix4();
  for (let side = 0; side < 2; side++) for (let i = 0; i < 8; i++) {
    matrix.makeTranslation((side ? 1 : -1) * 0.202, -0.095 + i * 0.027, 0);
    pins.setMatrixAt(side * 8 + i, matrix);
  }
  display.add(pins);

  // 2 — four small sensing islands, not an invented array of tiny cameras.
  film(2, 1.44, 1.78, 0.11);
  const sensorMaterial = m(accent(new THREE.MeshPhysicalMaterial({ color: 0x1d4058, metalness: 0.65, roughness: 0.28, clearcoat: 0.8 }), 2));
  const sensorCapMaterial = m(accent(new THREE.MeshStandardMaterial({ color: 0x8ebed1, metalness: 0.8, roughness: 0.2 }), 2));
  const sensorContacts = [];
  for (const a of [0.43, 1.95, 3.58, 5.17]) {
    const island = mesh(2, curvedFilm(1.50, 1.74, { start: a - 0.105, sweep: 0.21, steps: 18, rows: 3 }), sensorMaterial, 8);
    island.position.z = 0.012;
    const tile = mesh(2, new THREE.BoxGeometry(0.12, 0.15, 0.022), sensorCapMaterial, 9);
    tile.position.set(Math.cos(a) * 1.61, Math.sin(a) * 1.61, curveZ(1.61) + 0.033);
    tile.rotation.set(0.23 * tile.position.y, -0.23 * tile.position.x, a);
    for (const shift of [-0.073, 0.073]) sensorContacts.push(arcPoints(1.61, a + shift, 0.022, 0.04, 4));
  }
  linePaths(2, sensorContacts, 0xb7e6f7, 0.9);

  // 3 — deliberate concentric buses with short, orthogonal-looking feed routes.
  film(3, 1.24, 1.82, 0.12);
  const routes = [], fineRoutes = [];
  for (let sector = 0; sector < 8; sector++) {
    const angle = sector * TAU / 8;
    for (let lane = 0; lane < 4; lane++) {
      const r = 1.38 + lane * 0.055;
      const start = angle + 0.045 + lane * 0.009;
      const route = arcPoints(r, start, TAU / 8 - 0.14 - lane * 0.014, 0.014, 28);
      const last = route.at(-1), endAngle = Math.atan2(last.y, last.x);
      const outer = 1.71 + lane * 0.023;
      route.push(new THREE.Vector3(Math.cos(endAngle) * outer, Math.sin(endAngle) * outer, curveZ(outer) + 0.014));
      route.push(...arcPoints(outer, endAngle, 0.032, 0.014, 5).slice(1));
      (lane % 2 ? fineRoutes : routes).push(route);
    }
  }
  linePaths(3, routes, dark ? 0x8ec6df : 0x557e96, 0.92);
  linePaths(3, fineRoutes, dark ? 0x5f92ac : 0x8cb2c3, 0.8);
  const viaGeometry = g(new THREE.CylinderGeometry(0.017, 0.017, 0.009, 10));
  const viaMaterial = m(accent(new THREE.MeshStandardMaterial({ color: 0xa9cdd9, metalness: 0.85, roughness: 0.24 }), 3));
  const vias = new THREE.InstancedMesh(viaGeometry, viaMaterial, 32);
  const temp = new THREE.Object3D();
  for (let i = 0; i < 32; i++) {
    const a = (i >> 2) * TAU / 8 + 0.69 + (i % 4) * 0.018;
    const r = 1.71 + (i % 4) * 0.023;
    temp.position.set(Math.cos(a) * r, Math.sin(a) * r, curveZ(r) + 0.02);
    temp.rotation.set(Math.PI / 2, 0, 0); temp.updateMatrix(); vias.setMatrixAt(i, temp.matrix);
  }
  layers[3].add(vias);

  // 4 — a peripheral coupling loop; energy supply still belongs to a full system.
  film(4, 1.67, 1.92, 0.16);
  const spiral = [];
  for (let i = 0; i <= 640; i++) {
    const a = 0.12 + TAU * 3.7 * i / 640, r = 1.89 - 0.19 * i / 640;
    spiral.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, curveZ(r) + 0.015));
  }
  mesh(4, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 640, 0.007, 5, false), accent(new THREE.MeshPhysicalMaterial({ color: 0x83b7ca, metalness: 0.72, roughness: 0.23, clearcoat: 1, emissive: 0x4faacb, emissiveIntensity: dark ? 0.20 : 0.035 }), 4), 6);
  const powerBridge = mesh(4, new THREE.BoxGeometry(0.19, 0.075, 0.024), accent(new THREE.MeshStandardMaterial({ color: 0x4b7c94, metalness: 0.8, roughness: 0.22 }), 4), 8);
  powerBridge.position.set(-1.75, 0.36, curveZ(1.786) + 0.02);
  powerBridge.rotation.z = -0.2;

  // Selection is a single fine perimeter glow, not a distracting particle system.
  for (let index = 0; index < layers.length; index++) {
    const material = m(new THREE.MeshBasicMaterial({ color: dark ? 0xb0eaff : 0x309bc7, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    const halo = new THREE.Mesh(g(new THREE.TorusGeometry(LAYER_RADII[index] + 0.018, 0.0065, 6, 144)), material);
    halo.position.z = curveZ(LAYER_RADII[index]) + 0.008;
    layers[index].add(halo);
    halos.push(halo);
  }
  const shadowTexture = t(canvasTexture(256, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h / 2);
    gradient.addColorStop(0, dark ? 'rgba(40,139,180,.5)' : 'rgba(46,101,130,.4)');
    gradient.addColorStop(0.4, dark ? 'rgba(38,116,160,.18)' : 'rgba(69,130,162,.18)');
    gradient.addColorStop(1, 'rgba(55,128,163,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }));
  const shadow = new THREE.Sprite(m(new THREE.SpriteMaterial({ map: shadowTexture, transparent: true, opacity: dark ? 0.55 : 0.8, depthWrite: false, toneMapped: false })));
  shadow.scale.set(7.5, 1.0, 1);
  shadow.position.set(0, -1.86, -1.8);
  scene.add(shadow);

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  let reduced = media.matches, paused = false, destroyed = false, lost = false;
  let width = 1, height = 1, baseDistance = 7, visible = false, raf = 0, previous = 0, elapsed = 0;
  let exploded = 0, requestedExplosion = 0, hovered = false, activeLayer = -1;
  let pitch = -0.62, yaw = -0.42, rotationX = pitch, rotationY = yaw;
  let hoverX = 0, hoverY = 0, pointer = null, hoverFrame = 0, pendingHover = null;
  let fallback = null;
  const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const framingBox = new THREE.Box3(), framingSize = new THREE.Vector3();
  const baseZ = [0.078, 0.038, 0, -0.034, -0.073];
  const spreadZ = dark ? [1.95, 0.96, 0, -0.96, -1.92] : [1.10, 0.54, 0, -0.54, -1.08];
  let framingPose = null;
  const currentRect = () => container.getBoundingClientRect();
  const canRender = () => !destroyed && !lost && visible && !document.hidden && width > 1 && height > 1;
  const explosionTarget = () => Math.max(requestedExplosion, mode === 'hero' && hovered && !pointer ? 0.83 : 0);
  function requestFrame() { if (!raf && canRender()) raf = requestAnimationFrame(frame); }
  function cancelFrame() { if (raf) cancelAnimationFrame(raf); raf = 0; previous = 0; }
  function renderState(dt, immediate = false) {
    const animate = !reduced && !paused;
    const target = explosionTarget();
    const amount = immediate || !animate ? 1 : 1 - Math.exp(-dt * 7.5);
    exploded += (target - exploded) * amount;
    const drift = animate && !pointer ? Math.sin(elapsed * 0.19) * 0.035 : 0;
    const targetX = pitch + (animate ? hoverY * 0.06 : 0);
    const targetY = yaw + drift + (animate ? hoverX * 0.09 : 0);
    rotationX += (targetX - rotationX) * (immediate || !animate ? 1 : 1 - Math.exp(-dt * 11));
    rotationY += (targetY - rotationY) * (immediate || !animate ? 1 : 1 - Math.exp(-dt * 11));
    model.rotation.set(rotationX, rotationY, -0.15);
    model.position.y = animate && !pointer ? Math.sin(elapsed * 0.52) * 0.035 : 0;
    for (let i = 0; i < layers.length; i++) {
      layers[i].position.z = baseZ[i] + exploded * spreadZ[i];
      const opacity = activeLayer === i ? 0.94 : 0;
      halos[i].material.opacity += (opacity - halos[i].material.opacity) * (immediate || !animate ? 1 : 1 - Math.exp(-dt * 12));
    }
    for (const entry of accents) {
      const selected = activeLayer === entry.layer;
      if (entry.material.emissive) entry.material.emissiveIntensity = entry.emissiveIntensity + (selected ? dark ? 0.28 : 0.07 : 0);
      if (entry.material.isLineBasicMaterial) {
        entry.material.color.copy(entry.color);
        if (selected) entry.material.color.lerp(new THREE.Color(dark ? 0xd2f3ff : 0x197fb0), 0.5);
        entry.material.opacity = entry.opacity * (activeLayer < 0 || selected ? 1 : 0.6);
      }
    }
    // Fit the real rotated/exploded bounds, not a fixed camera distance: a tall
    // mobile card and a wide hero must both preserve the entire optical stack.
    model.updateMatrixWorld(true);
    // Precise lab bounds remove the excess padding introduced by rotated local
    // bounding boxes. Cache them between meaningful pose changes to stay light.
    if (!dark || !framingPose || Math.abs(rotationX - framingPose.x) > 0.004 || Math.abs(rotationY - framingPose.y) > 0.004 || Math.abs(exploded - framingPose.exploded) > 0.008) {
      framingBox.setFromObject(model, dark);
      framingPose = { x: rotationX, y: rotationY, exploded };
    }
    framingBox.getSize(framingSize);
    const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfWidth = dark ? Math.max(Math.abs(framingBox.min.x), Math.abs(framingBox.max.x)) : framingSize.x / 2;
    const halfHeight = dark ? Math.max(Math.abs(framingBox.min.y), Math.abs(framingBox.max.y)) : framingSize.y / 2;
    const fitDistance = Math.max(halfHeight / halfFov, halfWidth / (halfFov * camera.aspect));
    baseDistance = fitDistance * (dark ? 1.06 : 1.20) + Math.max(0, framingBox.max.z) + 0.15;
    camera.position.set(0, 0.02, baseDistance);
    camera.lookAt(0, -0.02, -0.15);
    shadow.material.opacity = (dark ? 0.55 : 0.8) * (1 - exploded * 0.36);
    shadow.scale.x = 7.5 + exploded * 0.35;
  }
  function frame(time) {
    raf = 0;
    if (!canRender()) return;
    const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 1 / 60;
    previous = time;
    if (!paused && !reduced) elapsed += dt;
    renderState(dt);
    renderer.render(scene, camera);
    // No automatic animation is scheduled under reduced motion or a pause.
    if (!paused && !reduced) requestFrame();
  }
  function resize() {
    if (destroyed) return;
    const rect = currentRect();
    width = Math.round(rect.width); height = Math.round(rect.height);
    if (width < 2 || height < 2) { cancelFrame(); return; }
    const mobile = coarse.matches || window.innerWidth < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    visible = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
    requestFrame();
  }
  function pickAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    mouse.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    scene.updateMatrixWorld(true);
    const hits = raycaster.intersectObjects(picks, false);
    if (!hits.length) return null;
    // In the assembled view, don't let the transparent skin steal every click.
    if (exploded < 0.18) hits.sort((a, b) => b.object.userData.pickPriority - a.object.userData.pickPriority || a.distance - b.distance);
    else {
      const solid = hits.filter(hit => hit.object.userData.pickPriority > 1);
      if (solid.length) return solid[0].object.userData.layerIndex;
    }
    return hits[0].object.userData.layerIndex;
  }
  function pointerDown(event) {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, touch: event.pointerType === 'touch' };
    canvas.style.cursor = 'grabbing';
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Detached canvas. */ }
    requestFrame();
  }
  function pointerMove(event) {
    if (pointer && event.pointerId === pointer.id) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (Math.hypot(dx, dy) > 5) pointer.moved = true;
      if (pointer.moved) {
        yaw += (event.clientX - pointer.lastX) * 0.006;
        pitch = clamp(pitch + (event.clientY - pointer.lastY) * 0.0045, -1.25, 0.82);
        requestFrame();
      }
      pointer.lastX = event.clientX; pointer.lastY = event.clientY;
      return;
    }
    if (event.pointerType === 'touch') return;
    const rect = currentRect();
    hoverX = clamp((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5, -0.5, 0.5);
    hoverY = clamp((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5, -0.5, 0.5);
    pendingHover = { x: event.clientX, y: event.clientY };
    if (!hoverFrame) hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0;
      if (pendingHover && !destroyed && !pointer) canvas.style.cursor = pickAt(pendingHover.x, pendingHover.y) === null ? 'grab' : 'pointer';
    });
    requestFrame();
  }
  function pointerUp(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const wasClick = !pointer.moved;
    pointer = null;
    canvas.style.cursor = 'grab';
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    if (wasClick && event.type === 'pointerup') {
      const selected = pickAt(event.clientX, event.clientY);
      if (selected !== null) {
        activeLayer = selected;
        onSelect?.(selected);
        container.dispatchEvent(new CustomEvent('lensscene:select', { detail: { index: selected, name: LAYER_NAMES[selected], mode } }));
      }
    }
    requestFrame();
  }
  function pointerEnter(event) { if (event.pointerType !== 'touch') { hovered = true; requestFrame(); } }
  function pointerLeave() { hovered = false; hoverX = 0; hoverY = 0; pendingHover = null; requestFrame(); }
  function visibilityChange() { document.hidden ? cancelFrame() : requestFrame(); }
  function motionChange(event) { reduced = event.matches; cancelFrame(); requestFrame(); }
  function contextLost(event) {
    event.preventDefault(); lost = true; cancelFrame();
    canvas.style.visibility = 'hidden';
    fallback = makeFallback(container, mode, 'WebGL context lost');
  }
  function contextRestored() {
    lost = false; fallback?.remove(); fallback = null;
    canvas.style.visibility = '';
    container.classList.remove('lens-scene--fallback');
    resize(); requestFrame();
  }
  const events = [['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerUp], ['pointercancel', pointerUp], ['lostpointercapture', pointerUp], ['pointerenter', pointerEnter], ['pointerleave', pointerLeave], ['webglcontextlost', contextLost], ['webglcontextrestored', contextRestored]];
  events.forEach(([name, handler]) => canvas.addEventListener(name, handler));
  document.addEventListener('visibilitychange', visibilityChange);
  media.addEventListener('change', motionChange);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible ? requestFrame() : cancelFrame();
  }, { threshold: 0 });
  observer.observe(container);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  return {
    setExploded(value) {
      if (destroyed) return;
      requestedExplosion = typeof value === 'boolean' ? Number(value) : clamp(Number(value) || 0, 0, 1);
      requestFrame();
    },
    setActiveLayer(index) {
      if (destroyed) return;
      activeLayer = Number.isInteger(index) && index >= 0 && index < 5 ? index : -1;
      requestFrame();
    },
    setPaused(value) {
      if (destroyed) return;
      paused = Boolean(value); cancelFrame(); requestFrame();
    },
    reset() {
      if (destroyed) return;
      pitch = -0.62; yaw = -0.42; requestedExplosion = 0; activeLayer = -1;
      hovered = false; hoverX = 0; hoverY = 0; elapsed = 0; pointer = null;
      canvas.style.cursor = 'grab'; requestFrame();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; cancelFrame();
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      observer.disconnect(); resizeObserver.disconnect();
      events.forEach(([name, handler]) => canvas.removeEventListener(name, handler));
      document.removeEventListener('visibilitychange', visibilityChange);
      media.removeEventListener('change', motionChange);
      window.removeEventListener('resize', resize);
      scene.clear(); geometries.forEach(resource => resource.dispose());
      materials.forEach(resource => resource.dispose()); textures.forEach(resource => resource.dispose());
      environmentTarget?.dispose(); renderer.dispose(); renderer.forceContextLoss();
      fallback?.remove(); canvas.remove();
      container.classList.remove('lens-scene--ready', 'lens-scene--fallback');
    }
  };
}
