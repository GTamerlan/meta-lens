// Research snapshot: 18 September 2026. Commercial parts are bench references,
// not an approved ocular bill of materials. Roadmap entries are proposed gates.
export const sources = [
  { id: 'jbd', title: 'JBD · AM-µLED 0.13-inch display', url: 'https://www.jb-display.com/product_des/3.html', note: 'Manufacturer specifications; listed in production. Display active area is not the full package footprint. Exact variant, interface, price and supply require confirmation.' },
  { id: 'hummingbird', title: 'JBD · Hummingbird II projector', url: 'https://www.jb-display.com/product_des/17.html', note: 'Manufacturer product page for a glasses projector. The 95 mW figure is typical, not a contact-lens power budget; other press material gives different operating figures.' },
  { id: 'nordic', title: 'Nordic · nRF52840 product specification', url: 'https://docs.nordicsemi.com/r/bundle/ps_nrf52840/page/keyfeatures_html5.html', note: 'Catalog wireless microcontroller specifications. Package dimensions exclude the supporting circuit, antenna and protective structure.' },
  { id: 'nordicdk', title: 'Nordic · nRF52840 development kit', url: 'https://www.nordicsemi.com/Products/Development-hardware/nRF52840-DK', note: 'Commercial board for firmware, radio and power-measurement experiments. A bench tool, not eye-worn hardware; check seller inventory when ordering.' },
  { id: 'ti', title: 'Texas Instruments · BQ25570', url: 'https://www.ti.com/product/BQ25570', note: 'Active catalog energy-management IC. It conditions an external energy source; it does not generate power or receive wireless energy by itself. Evaluation-board stock was not reliably established.' },
  { id: 'st', title: 'STMicroelectronics · ANT7-T-25DV64KC', url: 'https://www.st.com/en/evaluation-tools/ant7-t-25dv64kc.html', note: 'Active NFC reference board with an analog energy-harvesting output. Its antenna is 14 × 14 mm. Received power depends on the reader, antenna and coupling.' },
  { id: 'xpanceo', title: 'XPANCEO + JBD · Custom contact display, July 2026', url: 'https://www.xpanceo.com/newsroom/xpanceo-and-jbd-take-ar-to-the-next-level-with-custom-micro-display-for-smart-contact-lenses', note: 'Company announcement of specialized display co-development. Sub-millimeter dimensions are a development intention, not an orderable product specification or independent safety finding.' },
  { id: 'xprototypes', title: 'XPANCEO · Prototype portfolio, June 2026', url: 'https://www.xpanceo.com/newsroom/xpanceo-presents-smart-contact-lens-prototype-portfolio-at-vivatech-paving-the-way-for-first-integrated-prototype-demonstration-in-2027', note: 'Company-reported component demonstrations. The close-eye display uses a stick-holder; an integrated, worn demonstration is planned for early 2027, not established by this announcement.' },
  { id: 'ntu', title: 'NTU research · Tear-based biobattery paper', url: 'https://www3.ntu.edu.sg/CorpComms2/Research%20Papers/tearbased.pdf', note: 'Laboratory battery study, not a commercial display-lens power supply. Different charging methods have different reported cycle counts.' },
  { id: 'tdk', title: 'TDK · CeraCharge B73180A0101M062', url: 'https://product.tdk.com/de/search/solid-state-batt/solid-state-batt/smd-assbs/info?part_no=B73180A0101M062', note: 'Commercial-grade production battery: nominal capacity, voltage and discharge current. Catalog availability does not establish suitability for contact with an eye.' },
  { id: 'mojo', title: 'Mojo Vision · A new direction, January 2023', url: 'https://www.mojo.vision/news/a-new-direction', note: 'The CEO reports wearing a prototype in 2022 and describes the 2023 pivot to micro-LEDs amid funding difficulties. The announcement does not provide a battery capacity or validated operating duration.' },
  { id: 'nature', title: 'Nature · Metasurface-waveguide AR display, 2024', url: 'https://www.nature.com/articles/s41586-024-07386-0', note: 'Peer-reviewed holographic AR-glasses research using nanoscale waveguide structures. It is not a demonstrated contact-lens optical stack.' },
  { id: 'nano', title: 'Nature Communications · Contact-lens sensor materials, 2017', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5414034/', note: 'Research on graphene and silver-nanowire electronics for ocular sensing. A sensor/material demonstration, not a consumer AR display or proof of general human wear safety.' },
  { id: 'eye', title: 'Nature Communications · Frequency-encoded gaze tracking, 2024', url: 'https://www.nature.com/articles/s41467-024-47851-y', note: 'Chip-free, battery-free lens tags with an external reader; reported demonstrations use an eye model and a rabbit. Gaze tracking is not room mapping or world-locked AR.' },
  { id: 'fda', title: 'FDA · Contact lenses', url: 'https://www.fda.gov/medical-devices/consumer-products/contact-lenses', note: 'Contact lenses are medical devices. Prescription, fitting, care and professional supervision matter; ordinary-lens authorization does not cover a new electronic system.' },
  { id: 'efs', title: 'FDA · Early Feasibility Studies program', url: 'https://www.fda.gov/medical-devices/investigational-device-exemption-ide/early-feasibility-studies-efs-program', note: 'Early clinical-development framework involving regulatory engagement, risk analysis and nonclinical evidence. Specialists must determine the applicable study and marketing requirements for this concept.' },
];

export const market = [
  {
    category: 'commercial', tag: 'SUPPLIER COMPONENT', title: 'A real microdisplay. Not a complete lens.',
    specs: ['640 × 480 monochrome pixels', '4 µm pixel pitch', '2.64 × 2.02 mm published active area', '60 mW typical · supplier specification'],
    body: 'JBD’s AM-µLED 0.13-inch series is listed in production. It is a credible starting point for discussions about display performance and an optical bench experiment.',
    limitation: 'The active area is not the package size. A panel alone does not focus an image at the eye. Contact-specific optics, power, packaging and safety are unresolved; obtain the exact supplier datasheet.', source: 'jbd',
  },
  {
    category: 'commercial', tag: 'GLASSES OPTICAL MODULE', title: 'An optical system shows the size gap.',
    specs: ['500 × 380 full-color image', '25° specified field of view', '0.2 cm³ volume · 0.5 g', '95 mW typical · product-page figure'],
    body: 'Hummingbird II combines three microdisplays and a prism into a glasses projector. It demonstrates that the light source and the surrounding optics must be designed together.',
    limitation: 'This is not an ocular component or a proven contact-lens design. Field-of-view axis and power test conditions need supplier confirmation; do not infer pixels per degree or battery life from these figures.', source: 'hummingbird',
  },
  {
    category: 'commercial', tag: 'CATALOG SILICON', title: 'A wireless controller for the bench.',
    specs: ['64 MHz Arm Cortex-M4', '1 MB flash · 256 KB RAM', '3.544 × 3.607 mm WLCSP option', 'Bluetooth LE and NFC capabilities'],
    body: 'The nRF52840 can help engineers prototype simple controls, sensor messages and a companion link before custom electronics are considered.',
    limitation: 'The chip needs supporting circuitry and antennas. It is not a spatial-rendering computer, a full system footprint or an eye-safe component. Tiny does not mean suitable for the cornea.', source: 'nordic',
  },
  {
    category: 'commercial', tag: 'BUYABLE BENCH KIT', title: 'Start with an oversized development board.',
    specs: ['nRF52840 DK', 'USB power and onboard debugger', 'Bluetooth and NFC antennas', 'Dedicated current-measurement pins'],
    body: 'A commercial development kit is useful for testing the interaction loop: send a command, receive a response, measure delays and record energy use.',
    limitation: 'Keep it on the desk or in an external companion prototype. This is a test instrument, not a lens assembly. Confirm distributor stock before purchase.', source: 'nordicdk',
  },
  {
    category: 'commercial', tag: 'CATALOG POWER MANAGEMENT', title: 'Manage energy. Do not assume it appears.',
    specs: ['BQ25570 · 3.5 × 3.5 mm package', '488 nA typical quiescent current', '600 mV cold-start threshold', 'Operation down to 100 mV after startup'],
    body: 'TI’s IC helps condition energy from sources such as a photovoltaic cell and manage storage. Engineers can use it to investigate whether a measured source can support a measured load.',
    limitation: 'It is not a wireless receiver, generator or complete battery system. The very low idle figure is not the power draw of the display, radio or whole product. External components are required.', source: 'ti',
  },
  {
    category: 'commercial', tag: 'NFC BENCH REFERENCE', title: 'Test wireless coupling on the desk.',
    specs: ['ANT7-T-25DV64KC · active product', '14 × 14 mm antenna', '13.56 MHz NFC', 'Analog energy-harvesting output'],
    body: 'ST’s reference board can demonstrate NFC communication and energy harvesting with a compatible reader. It makes distance, alignment and load dependence tangible.',
    limitation: 'A bench demonstration does not prove reliable power near an eye. This antenna and board are not an ocular design, and safe exposure and heating must be evaluated professionally.', source: 'st',
  },
  {
    category: 'development', tag: 'CUSTOM CO-DEVELOPMENT', title: 'A display designed specifically for contacts.',
    specs: ['XPANCEO + JBD · July 2026', 'Specialized low-power backplane', 'Sub-millimeter display diameter targeted', 'Not commercially ready'],
    body: 'The partners describe work toward an unusually small display with electronics optimized for contact-lens use. This is the kind of supplier partnership the concept would need.',
    limitation: 'The company announcement is a development claim, not a purchasable specification, manufacturing quote or independent clinical result. It explicitly distinguishes prototypes from commercial readiness.', source: 'xpanceo',
  },
  {
    category: 'development', tag: 'COMPONENT PROTOTYPES', title: 'Separate breakthroughs still need integration.',
    specs: ['Display and close-eye optics', 'External computing/power companion', 'Microbattery and conductor prototypes', 'Integrated demonstration targeted for 2027'],
    body: 'XPANCEO’s June 2026 showcase describes several parts of a future system. Its display demonstration uses a holder brought close to the eye, alongside other component prototypes.',
    limitation: 'Do not present these demonstrations as an already-validated, all-day wearable. Integrating power, display, sensing and fit is a separate test; the planned 2027 milestone remains a company target.', source: 'xprototypes',
  },
  {
    category: 'research', tag: 'NANOPHOTONICS RESEARCH', title: 'Nanostructures can shape light.',
    specs: ['Nature · 2024', 'Holographic AR-glasses experiment'],
    body: 'Patterned surfaces guide and couple light. See the nanotechnology section for dimensions.',
    limitation: 'A glasses prototype, not a demonstrated contact-lens display.', source: 'nature',
  },
  {
    category: 'research', tag: 'FLEXIBLE MATERIALS RESEARCH', title: 'Transparent conductors are a research ingredient.',
    specs: ['Nature Communications · 2017', 'Graphene and silver-nanowire electronics', 'Soft contact-lens sensor system', 'Ocular sensing, not an AR display'],
    body: 'Researchers investigated flexible, transparent conducting materials in a contact-lens sensor. This supports studying better interconnects and sensors—not calling the entire system solved by nanotechnology.',
    limitation: 'A materials or sensing experiment does not establish a full visual interface, clinical authorization, human comfort over time or mass production.', source: 'nano',
  },
  {
    category: 'research', tag: 'GAZE-TRACKING RESEARCH', title: 'Knowing where the eye points is one problem.',
    specs: ['Nature Communications · 2024', 'Four passive frequency-encoded tags', 'External reader required', 'Eye-model and rabbit demonstrations'],
    body: 'The paper explores detecting eye movement using chip-free, battery-free tags in a lens. It is one possible research direction for input and alignment.',
    limitation: 'The experiment does not give the lens a view of the room. Head motion, world tracking, calibration, privacy and deliberate input still require a broader system. Human product performance is not established.', source: 'eye',
  },
];

export const batteries = [
  {
    tag: 'COMMERCIAL COMPONENT', title: 'TDK CeraCharge', stat: '100', unit: 'µAh nominal capacity',
    body: 'B73180A0101M062 is a production solid-state battery: 1.5 V nominal voltage, 20 µA nominal discharge current and a 4.4 × 3.0 × 1.1 mm body. It is a real catalog reference for an off-eye bench experiment.',
    limitation: 'These are separate ratings, not proof it can drive a display. Its package, materials and electrical performance are not qualified here for contact with an eye; do not embed it in a wearable lens.', source: 'tdk',
  },
  {
    tag: 'LABORATORY RESEARCH', title: 'NTU tear-based biobattery', stat: '27.1', unit: 'µAh total reported capacity',
    body: 'The study reports 45 µAh/cm² capacity, 201 µW/cm² peak power density and 0.310 V open-circuit voltage. More than 15 biocharging cycles were demonstrated; biocharging and electrical charging are distinct tests.',
    limitation: 'The paper identifies insufficient output for the electronics discussed. These results do not establish an all-day AR power supply, production availability or an approved eye-worn system.', source: 'ntu',
  },
  {
    tag: 'PROTOTYPE HISTORY', title: 'Mojo Lens', stat: '2022', unit: 'worn prototype reported',
    body: 'Mojo’s CEO says he wore and tested a feature-complete prototype in 2022. In January 2023, the company described funding difficulties and shifted its focus to micro-LED technology.',
    limitation: 'A prototype is not a commercial battery solution. This source supplies no battery capacity or verified runtime, and the pivot does not prove either technical impossibility or product readiness.', source: 'mojo',
  },
];

export const phases = [
  { number: '01', title: 'Define the useful job.', work: 'Choose one task worth doing without a phone. Set user, safety, privacy and optical requirements with ophthalmic-device specialists.', tools: 'User interviews, interface sketches, clinical and regulatory consultation.', deliverable: 'A written intended-use statement, requirements and initial risk register.', gate: 'A clear user benefit and a professionally reviewed research plan—not a promise that everyone will want contacts.' },
  { number: '02', title: 'Prove the interaction without eye hardware.', work: 'Test readable layouts, deliberate controls, distraction and permission choices using a simulation or existing display.', tools: 'Browser prototype, phone or existing headset, usability observation.', deliverable: 'An interaction demo and measured task results against a phone or glasses.', gate: 'Users understand the interface and complete the chosen task; unresolved distraction or weak value sends the design back.' },
  { number: '03', title: 'Build the oversized bench system.', work: 'Evaluate display and optics separately from radio and power. Keep prototypes off the body and record measured performance.', tools: 'Supplier display kit, development board, optical bench, current profiler and thermal instruments.', deliverable: 'A working desk demonstration with a measured optical, latency and power budget.', gate: 'Evidence supports the requirements under defined conditions. A tiny chip alone is not a pass.' },
  { number: '04', title: 'Co-develop the contact-specific parts.', work: 'Seek specialist proposals for custom display electronics, optics, interconnects, materials and protective packaging.', tools: 'Supplier engineering reviews, optical/electronic simulation, fabrication samples and cost quotations.', deliverable: 'A candidate architecture with supplier evidence, manufacturing assumptions and IP review.', gate: 'Credible routes exist for integration, quality and cost. No off-the-shelf part is assumed safe on the eye.' },
  { number: '05', title: 'Integrate on an artificial eye.', work: 'Test fit geometry, alignment, motion, display stability, power loss and failure behavior in controlled fixtures—not on a person.', tools: 'Artificial-eye fixtures, motion stages, calibrated optical instruments and environmental testing.', deliverable: 'An integrated non-worn prototype and documented failure results.', gate: 'The whole system meets agreed bench criteria, including adverse conditions; attractive imagery alone is insufficient.' },
  { number: '06', title: 'Build the safety evidence.', work: 'Qualified teams evaluate oxygen transport, materials, encapsulation, hygiene, mechanical integrity and optical, thermal and electrical risks.', tools: 'Accredited laboratories, a quality system and regulator-agreed nonclinical protocols.', deliverable: 'A traceable nonclinical evidence package and proposed clinical investigation plan.', gate: 'Clinical and regulatory reviewers determine whether human investigation is justified and which approvals are required.' },
  { number: '07', title: 'Study wear under clinical oversight.', work: 'Only after applicable approvals, study safety, fit, comfort and usable performance with qualified investigators and informed consent.', tools: 'Authorized protocol, trained eye-care professionals, monitoring and predefined stopping rules.', deliverable: 'Clinical results with adverse events and limitations reported, not just a demo video.', gate: 'Predefined criteria are met. Investigators can stop or redesign the study; there is no DIY-wear stage.' },
  { number: '08', title: 'Earn the right to manufacture.', work: 'Validate repeatable production, fitting, care, service costs and real customer value; complete the required route to market.', tools: 'Pilot manufacturing, yield testing, supplier quality, controlled commercial research and safety monitoring.', deliverable: 'A validated product and operating plan, subject to the required authorization.', gate: 'Only launch after safety, performance, manufacturing and commercial criteria pass. These phases are evidence gates, not a promised launch timetable.' },
];
