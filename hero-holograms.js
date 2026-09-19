let sequence = 0;
const mounts = new WeakMap();

/** Decorative concept UI. No account, camera, message or network connection. */
export function initHeroHolograms({ visual, canvasContainer, hint } = {}) {
  if (!visual?.appendChild || !canvasContainer?.addEventListener || !hint?.appendChild) return () => {};
  mounts.get(visual)?.();
  const id = `hero-holograms-${++sequence}`;
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'hero-holograms';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <svg class="hh-connectors" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false" aria-hidden="true">
      <path d="M265 285 L314 285 L369 364"/><circle cx="369" cy="364" r="3"/>
      <path d="M756 260 L718 260 L658 342"/><circle cx="658" cy="342" r="3"/>
      <path d="M304 711 L352 711 L402 615"/><circle cx="402" cy="615" r="3"/>
    </svg>
    <span class="hh-concept">INTERFACE CONCEPT</span>
    <div class="hh-panel hh-whatsapp"><div class="hh-panel-inner">
      <div class="hh-app"><span class="hh-app-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M16.3 9.5a6.4 6.4 0 0 1-9.6 5.6L3 16l.9-3.5a6.4 6.4 0 1 1 12.4-3Z"/><path d="M7 6.5c.5 3 2 4.5 5 5l1-1.4-1.7-1-.9.6a6 6 0 0 1-1.6-1.6l.6-.9L8.3 5.8 7 6.5Z"/></svg></span>WhatsApp<span class="hh-status"></span></div>
      <p class="hh-person">Alex <span>· fictional</span></p>
      <p class="hh-message">“That bracket looks aligned.”</p>
    </div></div>
    <div class="hh-panel hh-instagram"><div class="hh-panel-inner">
      <div class="hh-app"><span class="hh-app-icon"><svg viewBox="0 0 20 20" fill="none"><rect x="3.5" y="3.5" width="13" height="13" rx="4"/><circle cx="10" cy="10" r="3.1"/><circle cx="14" cy="6" r=".7" fill="currentColor" stroke="none"/></svg></span>Instagram</div>
      <p class="hh-step"><span>02</span> Stir it together.</p>
      <p class="hh-caption">Saved recipe, in view.</p>
      <div class="hh-progress"><i></i><i></i><i></i><i></i></div>
    </div></div>
    <div class="hh-panel hh-ai"><div class="hh-panel-inner">
      <div class="hh-app"><span class="hh-ai-orb"></span>Meta AI<span class="hh-spark">✦</span></div>
      <p class="hh-message">Keep the next step in view.</p>
      <p class="hh-caption">Illustrative suggestion</p>
    </div></div>`;
  visual.appendChild(overlay);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'hh-toggle';
  button.setAttribute('aria-controls', id); button.setAttribute('aria-pressed', 'false');
  hint.appendChild(button);
  const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  let pinned = false, hovered = false, suppressed = false, shown = false, disposed = false;
  function sync() {
    shown = pinned || (hovered && !suppressed);
    visual.classList.toggle('hero-holograms-open', shown);
    button.setAttribute('aria-pressed', String(shown));
    button.textContent = shown ? 'Hide interface' : 'Show interface';
  }
  function enter(event) { if (hoverMedia.matches && event.pointerType !== 'touch') { hovered = true; sync(); } }
  function leave() { hovered = false; suppressed = false; sync(); }
  function toggle() { if (shown) { pinned = false; suppressed = true; } else { pinned = true; suppressed = false; } sync(); }
  function key(event) { if (event.key === 'Escape' && shown) { pinned = false; hovered = false; suppressed = true; sync(); } }
  function hoverChange() { if (!hoverMedia.matches) { hovered = false; suppressed = false; sync(); } }
  canvasContainer.addEventListener('pointerenter', enter);
  canvasContainer.addEventListener('pointerleave', leave);
  button.addEventListener('click', toggle);
  visual.addEventListener('keydown', key);
  hoverMedia.addEventListener('change', hoverChange);
  sync();
  function cleanup() {
    if (disposed) return; disposed = true;
    canvasContainer.removeEventListener('pointerenter', enter); canvasContainer.removeEventListener('pointerleave', leave);
    button.removeEventListener('click', toggle); visual.removeEventListener('keydown', key); hoverMedia.removeEventListener('change', hoverChange);
    overlay.remove(); button.remove(); visual.classList.remove('hero-holograms-open');
    if (mounts.get(visual) === cleanup) mounts.delete(visual);
  }
  mounts.set(visual, cleanup);
  return cleanup;
}
