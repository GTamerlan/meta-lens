import { sources, market, batteries, phases } from './technical-data.js';

const $ = s => document.querySelector(s);
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const sourceLink = id => `#source-${id}`;
const components = [
  {title:'The interface with the eye.',tag:'CARRIER / PROPOSED',body:'The carrier determines curvature, fit and how the optical system sits relative to the pupil. The electronic stack changes the lens mechanically and biologically; it cannot simply be added to an ordinary prescription lens.',design:'Co-design geometry, oxygen transport, water behavior, surface quality and the location of electronic islands with qualified ophthalmic partners.',test:'Measure the complete device after ageing and processing. Evaluate fit, mechanical stability and biological response through the appropriate professional program.',source:'fda'},
  {title:'Keep two environments apart.',tag:'ENCAPSULATION / PROPOSED',body:'The tear-facing surface and the electronic surface have very different requirements. A protective barrier must resist moisture and ions without creating an unacceptable mechanical, optical or oxygen-transport penalty.',design:'Treat edge seals, interfaces and interconnect exits as critical. A thin film with a pinhole is not a reliable sealed package.',test:'Inspect leakage, swelling, flex cracks, corrosion, leachables and optical change after soak and mechanical tests. Material-level evidence is not device-level qualification.',source:'nano'},
  {title:'Move functions into custom silicon.',tag:'CONTROL + ROUTING / PROPOSED',body:'A conventional development board proves behavior on the desk. A lens-scale endpoint would need a different integration strategy: compact control, pixel timing, sensing and power supervision connected by fine interconnects.',design:'Minimize I/O, capacitance and conversion overhead. Specify rail sequencing, clocking, packet validation, watchdogs and independently reviewed failure states.',test:'Record active, idle and transient currents. Check signal integrity, manufacturing tolerances, test access and fault response—not just average power.',source:'nordic'},
  {title:'Make the light useful.',tag:'DISPLAY + OPTICS / PROPOSED',body:'A microdisplay is only the source. Projection optics must deliver a viewable angular image through the pupil while preserving the wearer’s view of the environment.',design:'Trade resolution, field, brightness, throughput, alignment tolerance, contrast and electrical load together. A supplier’s display diagonal excludes the complete optical engine.',test:'Measure optical transfer, stray light, distortion and performance across pupil positions. The animated rays are conceptual, not a validated ray trace or exposure calculation.',source:'xpanceo'},
  {title:'Power is a system decision.',tag:'POWER + DATA / PROPOSED',body:'The model illustrates a nearby off-eye coupling interface and a companion computer. It does not show that a pocket device can safely power a contact lens over that distance.',design:'Compare a receiver/harvester, regulation, energy buffering and sealed-storage options. Antenna geometry, frequency, field strength and placement remain undefined research choices.',test:'Measure efficiency, alignment tolerance, load transients, link reliability and protection behavior. Qualify RF, thermal and optical exposure independently.',source:'st'},
  {title:'Know the eye. Know the world.',tag:'SENSING / PROPOSED',body:'The wearer’s gaze and the room are different things. Passive or active sensing could contribute to alignment or input, but the proposed experience also needs external world tracking and deliberate controls.',design:'Time-align eye, head and scene estimates. Design around calibration drift, blinks, saccades, lens movement and incomplete sensor data.',test:'Measure tracking error and end-to-end latency under realistic motion. A passive lens-tag experiment does not prove a complete spatial operating system.',source:'eye'},
];

$('#source-ledger').innerHTML = sources.map((s,i)=>`<article class="t-source" id="source-${esc(s.id)}"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${String(i+1).padStart(2,'0')} / ${esc(s.title)}</span><span aria-hidden="true">↗</span></a><p>${esc(s.note)}</p></article>`).join('');
$('#market-grid').innerHTML = market.map(m=>`<article class="t-market-card" data-category="${esc(m.category)}"><span class="t-badge">${esc(m.tag)}</span><h3>${esc(m.title)}</h3><ul>${m.specs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>${esc(m.body)}</p><p class="t-limitation">${esc(m.limitation)}</p><a href="${sourceLink(m.source)}">Inspect the primary source ↗</a></article>`).join('');
$('#battery-evidence').innerHTML = batteries.map(b=>`<article class="t-battery-card"><span class="t-badge">${esc(b.tag)}</span><h3>${esc(b.title)}</h3><div class="t-battery-stat">${esc(b.stat)}<small>${esc(b.unit)}</small></div><p>${esc(b.body)}</p><p class="t-limitation">${esc(b.limitation)}</p><a href="${sourceLink(b.source)}">Read the evidence ↗</a></article>`).join('');
$('#build-roadmap').innerHTML = phases.map((p,i)=>`<details class="t-phase" ${i===0?'open':''}><summary><span>${esc(p.number)}</span><strong>${esc(p.title)}</strong></summary><div class="t-phase-body"><div><h4>THE WORK</h4><p>${esc(p.work)}</p></div><div><h4>TOOLS + PARTNERS</h4><p>${esc(p.tools)}</p></div><div><h4>DELIVERABLE</h4><p>${esc(p.deliverable)}</p></div><div class="t-phase-gate"><h4>EXIT CRITERION</h4><p>${esc(p.gate)}</p></div></div></details>`).join('');

const filterButtons = [...document.querySelectorAll('[data-filter]')];
function filterMarket(filter) {
  let count=0;
  document.querySelectorAll('.t-market-card').forEach(card=>{ card.hidden = filter!=='all' && card.dataset.category!==filter; if(!card.hidden) count++; });
  filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
  $('#market-count').textContent = `${count} evidence ${count===1?'entry':'entries'} shown · catalog status is not eye-wear qualification`;
}
filterButtons.forEach(b=>b.addEventListener('click',()=>filterMarket(b.dataset.filter)));
filterMarket('all');

let scene, activeComponent=0, activeView='stack';
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
const componentButtons=[...document.querySelectorAll('[data-component]')];
function selectComponent(index) {
  activeComponent=index;
  const c=components[index];
  componentButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.component)===index)));
  $('#t-component-copy').innerHTML=`<span class="t-badge">${esc(c.tag)}</span><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p><dl><dt>Design considerations</dt><dd>${esc(c.design)}</dd><dt>Verification</dt><dd>${esc(c.test)}</dd></dl><a href="${sourceLink(c.source)}">Related primary source ↗</a>`;
  scene?.setActiveComponent(index);
}
componentButtons.forEach(b=>b.addEventListener('click',()=>selectComponent(Number(b.dataset.component))));
selectComponent(0);
const viewInfo={
  stack:{name:'ILLUSTRATIVE SYSTEM ARCHITECTURE',caption:'Drag to rotate. Six functional subsystems shown as a conceptual exploded stack—not a verified physical layer order.'},
  power:{name:'CONCEPTUAL POWER + DATA PATH',caption:'Animated packets and coils illustrate functions, not an RF-field simulation. Coupler placement, separation, frequency, efficiency and safe exposure are not specified.'},
  optics:{name:'SCHEMATIC OPTICAL PATH',caption:'A conceptual source-to-optics-to-retina pathway. Geometry and rays are not a physiological model, engineered optical prescription or validated ray trace.'},
};
function setView(mode) {
  activeView=mode; scene?.setView(mode);
  if(mode==='power') selectComponent(4);
  if(mode==='optics') selectComponent(3);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
  $('#t-view-name').textContent=viewInfo[mode].name;
  $('#t-view-caption').textContent=viewInfo[mode].caption;
  $('#t-explode').disabled=mode!=='stack';
  $('#t-explode-label').style.opacity=mode==='stack'?'1':'.4';
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#t-explode').addEventListener('input',e=>scene?.setExploded(Number(e.target.value)/100));
$('#t-reset').addEventListener('click',()=>{scene?.reset(); $('#t-explode').value='85'; scene?.setExploded(.85); selectComponent(0); setView(activeView); setPaused(paused);});
function setPaused(value){paused=value;document.body.classList.toggle('tech-paused',paused);scene?.setPaused(paused);$('#t-motion').setAttribute('aria-pressed',String(paused));$('#t-motion').textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';}
$('#t-motion').addEventListener('click',()=>setPaused(!paused));
setPaused(paused);
import('./technical-scene.js').then(({createTechnicalScene})=>{
  const container=$('#technical-canvas');
  scene=createTechnicalScene({container,onSelect:selectComponent});
  if(container.querySelector('canvas')&&!container.classList.contains('technical-scene--fallback'))container.classList.add('t-scene-ready');
  container.addEventListener('technicalscene:error',()=>container.classList.remove('t-scene-ready'));
  container.querySelector('canvas')?.addEventListener('webglcontextrestored',()=>container.classList.add('t-scene-ready'));
  scene.setExploded(Number($('#t-explode').value)/100);selectComponent(activeComponent);setView(activeView);setPaused(paused);
}).catch(e=>console.warn('Technical 3D unavailable; static illustration retained.',e));

const powerInputs=['display','duty','logic','eff','companion','battery'];
const defaults={display:2,duty:25,logic:.5,eff:25,companion:2,battery:10};
const powerLabels={display:'Display power while active, in milliwatts',duty:'Display duty cycle, percent',logic:'Other on-lens average load, in milliwatts',eff:'End-to-end power-link efficiency, percent',companion:'Companion base power, in watts',battery:'Companion battery energy, in watt-hours'};
powerInputs.forEach(key=>$(`#p-${key}`).setAttribute('aria-label',powerLabels[key]));
function updatePower(){
  const v=Object.fromEntries(powerInputs.map(key=>[key,Number($(`#p-${key}`).value)]));
  const load=v.display*v.duty/100+v.logic;
  const input=load/(v.eff/100),loss=input-load,current=1000*load/3;
  const runtime=.85*v.battery/(v.companion+input/1000);
  $('#display-value').textContent=`${v.display.toFixed(1)} mW`;
  $('#duty-value').textContent=`${v.duty}%`;
  $('#logic-value').textContent=`${v.logic.toFixed(2)} mW`;
  $('#eff-value').textContent=`${v.eff}%`;
  $('#companion-value').textContent=`${v.companion.toFixed(1)} W`;
  $('#battery-value').textContent=`${v.battery.toFixed(1)} Wh`;
  $('#p-runtime').textContent=runtime.toFixed(2);
  $('#p-lens-load').textContent=`${load.toFixed(2)} mW`;
  $('#p-input').textContent=`${input.toFixed(2)} mW`;
  $('#p-loss').textContent=`${loss.toFixed(2)} mW`;
  $('#p-current').textContent=`${Math.round(current).toLocaleString('en-US')} µA`;
}
powerInputs.forEach(key=>$(`#p-${key}`).addEventListener('input',updatePower));
$('#t-budget-reset').addEventListener('click',()=>{powerInputs.forEach(key=>$(`#p-${key}`).value=String(defaults[key]));updatePower();});
updatePower();
const dataPresets={minimal:[320,240,8,30],color:[640,480,24,60],hd:[1280,720,24,60]};
function updateData(){const [w,h,b,f]=dataPresets[$('#data-preset').value];$('#data-rate').textContent=(w*h*b*f/1e6).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
$('#data-preset').addEventListener('change',updateData);updateData();

$('#nano-pattern').innerHTML='<i></i>'.repeat(64);
const scales={
  assembly:{label:'ASSEMBLY SCALE',category:'SYSTEM INTEGRATION',title:'Millimeters decide what fits.',copy:'The lens, complete optical engine, packages and protective barriers occupy physical volume. A tiny active display area is not the footprint of its driver, optics, wiring and encapsulation.',evidence:'A supplier lists a 3.3 mm active diagonal for an in-production JBD microdisplay. It is not a completed contact-lens optical engine.',source:'jbd'},
  routing:{label:'FINE-SCALE INTERCONNECTS',category:'MATERIALS RESEARCH',title:'Thinner routes. Harder interfaces.',copy:'Flexible conductors connect rigid electronic islands while limiting obstruction and mechanical stress. Resistance, optical transmission, corrosion and reliable insulation have to be evaluated together.',evidence:'A 2017 sensor study used graphene and approximately 30 nm silver nanowires. That nanomaterial is part of a larger circuit; this visual is not a scale reconstruction or a validated display lens.',source:'nano'},
  photonic:{label:'SUBWAVELENGTH OPTICAL STRUCTURE',category:'NANOPHOTONICS RESEARCH',title:'Nanometers can shape a wavefront.',copy:'Patterned optical structures can redirect and couple light. Their size matters relative to wavelength, but the complete illumination, modulation and imaging system still occupies much more space.',evidence:'A 2024 AR-glasses study used a metasurface with a 384 nm period and 220 nm height. The schematic pillars here explain scale, not the paper’s actual grating geometry or a contact-lens design.',source:'nature'},
};
document.querySelectorAll('[data-scale]').forEach(button=>{if(button.tagName!=='BUTTON')return;button.addEventListener('click',()=>{const mode=button.dataset.scale,s=scales[mode];document.querySelectorAll('button[data-scale]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('.t-nano-stage').dataset.scale=mode;$('#nano-scale-label').textContent=s.label;$('#nano-category').textContent=s.category;$('#nano-title').textContent=s.title;$('#nano-copy').textContent=s.copy;$('#nano-evidence').textContent=s.evidence;$('#nano-source').href=sourceLink(s.source);});});

const chapterObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('.t-jump a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`));}}),{rootMargin:'-15% 0px -70% 0px'});
document.querySelectorAll('main>section[id]').forEach(s=>chapterObserver.observe(s));
