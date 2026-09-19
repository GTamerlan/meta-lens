import { initExperience } from './experience.js';

const layers = [
  { title:'Comfort is the starting point.', copy:'A contact-lens surface designed around fit, oxygen transmission and a stable optical position. The goal is less bulk on the face—not an assumption that every eye will find it comfortable.', proof:'Demonstrate safe wear, reliable fit and sustained comfort with qualified clinical partners.' },
  { title:'An image. Almost impossibly small.', copy:'A miniature display and proposed projection optics create the visual interface. The challenge is not just making pixels smaller. It is delivering readable imagery, safely, at the eye.', proof:'Validate brightness, resolution, field of view, contrast and optical performance as an integrated system.' },
  { title:'A view that knows where to look.', copy:'A sensing concept to help align the interface with the wearer. Eye tracking alone cannot anchor a window to your room: separate head and world tracking would also be needed.', proof:'Demonstrate stable tracking, calibration and deliberate input across real movement and lighting.' },
  { title:'Connections at a different scale.', copy:'Illustrative fine-scale routes connect the optical and electronic elements. Advanced materials and miniaturization would have to preserve flexibility, transparency and safe contact with the eye.', proof:'Test fabrication yield, long-term encapsulation, biocompatibility and mechanical durability.' },
  { title:'Small interface. Serious power challenge.', copy:'A proposed interface to an off-eye companion system. The animation represents an idea for power and data—not a proven wireless-power architecture or an all-day battery claim.', proof:'Measure the complete power budget, transfer efficiency, exposure and heat under safe-wear conditions.' },
];
const $ = (s) => document.querySelector(s);
let heroScene, labScene;
let exploded = 1;
let activeLayer = 0;
let motionPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
const layerButtons = [...document.querySelectorAll('[data-layer]')];

function setSeparation(value) {
  exploded = Math.min(1, Math.max(0, value));
  labScene?.setExploded(exploded);
  $('#separation').value = String(Math.round(exploded * 100));
  $('#explode-toggle').setAttribute('aria-pressed', String(exploded > .5));
  $('#explode-toggle').innerHTML = exploded > .5 ? 'Assemble lens <span>↙</span>' : 'Explore layers <span>↗</span>';
  $('#lab-lens .fallback-lens')?.classList.toggle('exploded', exploded > .5);
}
function selectLayer(index, open = true) {
  activeLayer = index;
  const layer = layers[index];
  layerButtons.forEach((button, i) => { button.classList.toggle('is-active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  $('#layer-number').textContent = `0${index + 1}`;
  $('#layer-title').textContent = layer.title;
  $('#layer-copy').textContent = layer.copy;
  $('#layer-proof').textContent = layer.proof;
  labScene?.setActiveLayer(index);
  if (open) setSeparation(1);
}
layerButtons.forEach(button => button.addEventListener('click', () => selectLayer(Number(button.dataset.layer))));
$('#explode-toggle').addEventListener('click', () => setSeparation(exploded > .5 ? 0 : 1));
$('#separation').addEventListener('input', e => setSeparation(Number(e.target.value) / 100));
$('#reset-lens').addEventListener('click', () => { labScene?.reset(); selectLayer(0); });

function updateMotion() {
  document.body.classList.toggle('motion-paused', motionPaused);
  heroScene?.setPaused(motionPaused); labScene?.setPaused(motionPaused);
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle').textContent = motionPaused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
updateMotion();

// The static content and CSS lens remain usable if WebGL cannot initialize.
import('./lens-scene.js').then(({ createLensScene }) => {
  const create = (id, mode, onSelect) => {
    const container = $(id);
    try {
      const scene = createLensScene({ container, mode, onSelect });
      if (container.querySelector('canvas') && !container.classList.contains('lens-scene--fallback')) container.classList.add('lens-ready');
      container.addEventListener('lensscene:error', () => container.classList.remove('lens-ready'));
      container.querySelector('canvas')?.addEventListener('webglcontextrestored', () => container.classList.add('lens-ready'));
      return scene;
    } catch (error) { console.warn('3D preview unavailable; showing static concept.', error); return null; }
  };
  heroScene = create('#hero-lens', 'hero');
  labScene = create('#lab-lens', 'lab', index => selectLayer(index));
  setSeparation(exploded); selectLayer(activeLayer, false); updateMotion();
}).catch(error => console.warn('Using the static lens preview.', error));

initExperience($('#experience-demo'));

const menu = $('.menu-toggle');
function closeMenu() { menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Open navigation'); $('.header').classList.remove('menu-open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation'); $('.header').classList.toggle('menu-open',open); });
document.querySelectorAll('#navigation a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); entry.target.classList.remove('reveal-waiting'); revealObserver.unobserve(entry.target); }
}), { threshold:.08, rootMargin:'0px 0px -20px 0px' });
document.querySelectorAll('.reveal').forEach(element => { if (element.getBoundingClientRect().top > innerHeight && !motionPaused) element.classList.add('reveal-waiting'); revealObserver.observe(element); });

const dialog = $('#research-dialog');
$('#research-open').addEventListener('click', () => dialog.showModal());
$('#research-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => $('#research-open').focus({preventScroll:true}));
