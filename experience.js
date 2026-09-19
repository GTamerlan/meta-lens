/** A self-contained, deliberately simulated spatial interface. No camera or network APIs. */
let experienceCount = 0;

const scenes = [
  {
    id: 'create', label: 'Create', app: 'WhatsApp + Meta AI', image: './assets/workbench.png',
    location: 'At your workbench', contextTitle: 'A second pair of eyes',
    description: 'Keep a friend and the next step in view while your hands stay on your project.',
    requirement: 'A permitted external-camera view and companion processing would be required.',
    steps: [
      { title: 'Make room for your next idea.', text: 'Set your prototype in view. Keep the instructions beside it, instead of reaching for your phone.', detail: 'Workspace ready', chip: 'Your project, in focus', message: 'Start with the part you want a second opinion on.' },
      { title: 'Bring someone into the moment.', text: 'Imagine sharing a view from a separate camera while a friend helps you think through the design.', detail: 'Simulated call', chip: 'Alex · fictional contact', message: '“What if the controller sat behind the front wheels?”' },
      { title: 'Keep the useful part in sight.', text: 'Pin the suggestion beside your project. Turn back to the work without losing your place.', detail: 'Idea saved in this scene', chip: 'One suggestion to try', message: 'Compare the two layouts before changing your prototype.' },
    ],
  },
  {
    id: 'cook', label: 'Cook', app: 'Instagram + Meta AI', image: './assets/kitchen.png',
    location: 'In your kitchen', contextTitle: 'From saved to made',
    description: 'A saved recipe becomes a few calm instructions, right where you are preparing it.',
    requirement: 'An illustrative saved recipe. No scene recognition or live food-safety guidance.',
    steps: [
      { title: 'Your saved recipe, at hand.', text: 'Start a tomato and basil pasta. Rinse and tear the basil, then set out your ingredients.', detail: '01 / Prep', chip: 'Saved recipe · concept', message: 'Prepared pasta · tomato sauce · fresh basil · olive oil' },
      { title: 'One step. More room to cook.', text: 'Bring your prepared pasta and tomato sauce together. Keep the full recipe out of the way.', detail: '02 / Assemble', chip: 'Tomato & basil pasta', message: 'The next instruction stays visible when your hands are busy.' },
      { title: 'A small finishing touch.', text: 'Finish your pasta with fresh basil. Your recipe stays with you through the last step.', detail: '03 / Finish', chip: 'Ready for the table', message: 'The idea: less scrolling between the recipe and the real world.' },
    ],
  },
  {
    id: 'discover', label: 'Discover', app: 'Facebook Marketplace', image: './assets/workspace.png',
    location: 'In your space', contextTitle: 'Picture it here',
    description: 'Explore how a correctly scaled item could fit before you make a decision.',
    requirement: 'Reliable room tracking and a correctly dimensioned 3D asset would be required.',
    steps: [
      { title: 'See the shape of a possibility.', text: 'A fictional studio desk, shown as a simulated spatial preview. Start with a natural oak finish.', detail: 'Natural oak', chip: 'Studio desk · fictional listing', message: '120 × 60 × 74 cm · illustrative dimensions', finish: 'oak' },
      { title: 'Try a different point of view.', text: 'Switch to walnut. The idea is to compare a listing in your room, beyond a flat product photograph.', detail: 'Warm walnut', chip: 'Finish 02 / 03', message: 'This visual is not a measurement or a real product model.', finish: 'walnut' },
      { title: 'Find the one that feels at home.', text: 'Try a cloud-white finish. A real experience would need verified dimensions, tracking and a suitable model.', detail: 'Cloud white', chip: 'Finish 03 / 03', message: 'No purchase, camera feed or room scan is connected.', finish: 'white' },
    ],
  },
];

const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const lensIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.1" stroke="currentColor" stroke-width="1.5"/><path d="m17.4 6.6-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

/** Mount once; returns a cleanup function. Images resolve relative to the host page. */
export function initExperience(rootElement) {
  if (!(rootElement instanceof HTMLElement)) throw new TypeError('initExperience needs a root element.');
  const instance = `ex-${++experienceCount}`;
  const abortController = new AbortController();
  const { signal } = abortController;
  let activeIndex = 0;
  let lensOn = true;
  const positions = [0, 0, 0];
  let revealFrame = 0;

  rootElement.classList.add('ex-root');
  rootElement.innerHTML = `
    <div class="ex-controls">
      <div class="ex-tabs" role="tablist" aria-label="Choose a concept scene">
        ${scenes.map((scene, index) => `<button class="ex-tab" type="button" role="tab" id="${instance}-tab-${scene.id}" aria-controls="${instance}-scene" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}" data-ex-scene="${index}">${scene.label}</button>`).join('')}
      </div>
      <button class="ex-lens-toggle" type="button" aria-pressed="true" aria-label="Lens overlays" aria-controls="${instance}-overlays">
        ${lensIcon}<span class="ex-lens-label">Lens on</span><span class="ex-switch" aria-hidden="true"></span>
      </button>
    </div>
    <div class="ex-scene" id="${instance}-scene" role="tabpanel" aria-labelledby="${instance}-tab-create" data-ex-active="create">
      <div class="ex-backgrounds" aria-hidden="true">
        ${scenes.map((scene, index) => `<img class="ex-background${index === 0 ? ' ex-background-active' : ''}" src="${scene.image}" alt="" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" data-ex-background="${index}">`).join('')}
      </div>
      <div class="ex-scene-shade" aria-hidden="true"></div>
      <div class="ex-world-label"><span class="ex-world-dot" aria-hidden="true"></span><span class="ex-location">At your workbench</span></div>
      <div class="ex-world-counter" aria-hidden="true">01 <span>/ 03</span></div>
      <div class="ex-overlays ex-reveal" id="${instance}-overlays">
        <div class="ex-app-label"><span class="ex-app-mark" aria-hidden="true">M</span><span class="ex-app-name">WhatsApp + Meta AI</span><span class="ex-concept-chip">CONCEPT</span></div>
        <article class="ex-primary-hud">
          <p class="ex-hud-eyebrow">A little less phone. A little more here.</p>
          <h3 class="ex-step-title"></h3>
          <p class="ex-step-text"></p>
          <div class="ex-progress-row"><span class="ex-step-detail"></span><span class="ex-progress" role="img" aria-label="Step 1 of 3"><i></i><i></i><i></i></span></div>
        </article>
        <div class="ex-context-hud">
          <div class="ex-context-orbit" aria-hidden="true"><span></span></div>
          <p class="ex-context-chip"></p>
          <p class="ex-context-message"></p>
          <span class="ex-context-footnote">Simulated interface</span>
        </div>
        <div class="ex-desk-preview" data-ex-finish="oak" aria-hidden="true">
          <div class="ex-desk-shadow"></div>
          <div class="ex-desk-model"><div class="ex-desk-top"></div><div class="ex-desk-edge"></div><div class="ex-desk-leg ex-desk-leg-one"></div><div class="ex-desk-leg ex-desk-leg-two"></div><div class="ex-desk-leg ex-desk-leg-three"></div></div>
          <div class="ex-desk-dimension"><span></span>120 cm<span></span></div>
          <span class="ex-desk-caption">SIMULATED 3D PREVIEW</span>
        </div>
      </div>
      <div class="ex-lens-off-message" aria-hidden="true"><span>Your world, uninterrupted.</span>Switch the lens on to explore the concept.</div>
      <div class="ex-scene-bottom"><span>Simulated interface · concept experience</span><span class="ex-scene-bottom-right">No live camera or connected account</span></div>
    </div>
    <div class="ex-caption-row">
      <div class="ex-caption"><p class="ex-description"></p><p class="ex-requirement"></p></div>
      <button type="button" class="ex-next"><span class="ex-next-label">Next step</span>${arrowIcon}</button>
    </div>
    <p class="ex-sr-only ex-live-status" role="status" aria-live="polite" aria-atomic="true"></p>
  `;

  const query = (selector) => rootElement.querySelector(selector);
  const tabs = Array.from(rootElement.querySelectorAll('.ex-tab'));
  const backgrounds = Array.from(rootElement.querySelectorAll('.ex-background'));
  const panel = query('.ex-scene');
  const overlays = query('.ex-overlays');
  const toggle = query('.ex-lens-toggle');
  const next = query('.ex-next');
  const status = query('.ex-live-status');

  function reveal() {
    cancelAnimationFrame(revealFrame);
    overlays.classList.remove('ex-reveal');
    // Commit the starting style so a repeated step can replay its reveal.
    void overlays.offsetWidth;
    revealFrame = requestAnimationFrame(() => {
      if (!signal.aborted) overlays.classList.add('ex-reveal');
    });
  }

  function render(announce = false) {
    const scene = scenes[activeIndex];
    const position = positions[activeIndex];
    const step = scene.steps[position];
    panel.dataset.exActive = scene.id;
    panel.setAttribute('aria-labelledby', `${instance}-tab-${scene.id}`);
    tabs.forEach((tab, index) => {
      tab.setAttribute('aria-selected', String(index === activeIndex));
      tab.tabIndex = index === activeIndex ? 0 : -1;
      backgrounds[index].classList.toggle('ex-background-active', index === activeIndex);
    });
    query('.ex-location').textContent = scene.location;
    query('.ex-world-counter').innerHTML = `0${activeIndex + 1} <span>/ 03</span>`;
    query('.ex-app-name').textContent = scene.app;
    query('.ex-app-mark').textContent = scene.id === 'cook' ? 'I' : scene.id === 'discover' ? 'f' : 'M';
    query('.ex-step-title').textContent = step.title;
    query('.ex-step-text').textContent = step.text;
    query('.ex-step-detail').textContent = step.detail;
    query('.ex-context-chip').textContent = step.chip;
    query('.ex-context-message').textContent = step.message;
    query('.ex-description').textContent = scene.description;
    query('.ex-requirement').textContent = scene.requirement;
    query('.ex-desk-preview').dataset.exFinish = step.finish || 'oak';
    query('.ex-progress').setAttribute('aria-label', `Step ${position + 1} of 3`);
    query('.ex-progress').querySelectorAll('i').forEach((dot, index) => dot.classList.toggle('ex-progress-active', index <= position));
    query('.ex-next-label').textContent = scene.id === 'discover' ? 'Try another finish' : position === 2 ? 'Start again' : 'Next step';
    next.setAttribute('aria-label', scene.id === 'discover' ? `Try next desk finish. Current finish: ${step.detail}` : position === 2 ? `Restart the ${scene.label.toLowerCase()} scene` : `Next step in the ${scene.label.toLowerCase()} scene`);
    if (announce) status.textContent = `${scene.label}. Step ${position + 1} of 3. ${step.title} ${step.text}`;
    reveal();
  }

  function setScene(index, focus = false) {
    if (index < 0 || index >= scenes.length) return;
    activeIndex = index;
    render(true);
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setScene(index), { signal });
    tab.addEventListener('keydown', (event) => {
      let target;
      if (event.key === 'ArrowRight') target = (activeIndex + 1) % scenes.length;
      if (event.key === 'ArrowLeft') target = (activeIndex + scenes.length - 1) % scenes.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = scenes.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        setScene(target, true);
      }
    }, { signal });
  });

  toggle.addEventListener('click', () => {
    lensOn = !lensOn;
    toggle.setAttribute('aria-pressed', String(lensOn));
    query('.ex-lens-label').textContent = lensOn ? 'Lens on' : 'Lens off';
    panel.classList.toggle('ex-lens-off', !lensOn);
    overlays.setAttribute('aria-hidden', String(!lensOn));
    query('.ex-lens-off-message').setAttribute('aria-hidden', String(lensOn));
    next.disabled = !lensOn;
    status.textContent = lensOn ? 'Lens overlays on. Concept interface visible.' : 'Lens overlays off. Uninterrupted scene view.';
    if (lensOn) reveal();
  }, { signal });

  next.addEventListener('click', () => {
    positions[activeIndex] = (positions[activeIndex] + 1) % scenes[activeIndex].steps.length;
    render(true);
  }, { signal });

  render();
  return () => {
    abortController.abort();
    cancelAnimationFrame(revealFrame);
    rootElement.replaceChildren();
    rootElement.classList.remove('ex-root');
  };
}
