// Shared content for all look-and-feel variants.
// Each variant imports this file. Do not put facts in a variant that are not here.
//
// The site must not show the street address or the phone number from the resume.

// Resolve an asset path relative to the repo root, from any variant folder.
export const asset = (path) => new URL(`../${path}`, import.meta.url).href;

export const site = {
  // Page metadata for the live site.
  meta: {
    // Set the domain (for example "https://example.com") before launch.
    // The build then writes absolute links for social cards and a canonical link.
    url: "https://vongillern.github.io",
    title: "Jon von Gillern — Engineer, inventor, AI consultant",
    description:
      "Engineer and inventor in West Des Moines, Iowa. 28 years of hard problems: type, cardiology, maize genomics, building lighting, and now AI.",
    ogImage: "assets/og.jpg",
    knowsAbout: ["Generative AI", "Typography", "Computer vision", "Healthcare software", "Genomics", "Data visualization", "3D printing"],
  },

  person: {
    name: "Jon von Gillern",
    first: "Jon",
    last: "von Gillern",
    roles: ["Engineer", "Inventor", "AI consultant"],
    location: "West Des Moines, Iowa",
    timezone: "America/Chicago",
    coords: "41.58° N, 93.71° W",
    email: "jvongillern@gmail.com",
    github: "https://github.com/vongillern",
    githubHandle: "vongillern",
    since: 1998,
    status: "Taking on hard problems",
  },

  hero: {
    // Variants may pick one headline. Keep the wording as is.
    headlines: [
      "Hand me the problem everyone calls unsolvable.",
      "I solve the problems people call intractable.",
      "The deep end is where I do my best work.",
    ],
    intro:
      "I go after the problems that other people call unsolvable. I get thrown in the deep end, I become the expert fast, and I ship. Type, cardiology, maize genomics, building lighting, and now AI.",
    short: "Engineer and inventor. 28 years of hard problems, from fonts to genomes to AI.",
  },

  // Proof points. Every value is from the resume or from the project folders.
  stats: [
    { value: "4", label: "patent applications" },
    { value: "1", label: "side project acquired by Monotype" },
    { value: "97%", label: "smaller genomic data files at Pioneer" },
    { value: "800 → 10,000s", label: "patients on the platform I ran as CTO" },
    { value: "20–30 → 2", label: "minutes to commission a room of lights" },
    { value: "~10,000", label: "measurements per typeface in the Font Genome" },
  ],

  domains: ["Type", "Cardiology", "Genomics", "Lighting", "Analytics", "3D", "AI"],

  // Selected work. Order is the suggested order on the page.
  work: [
    {
      id: "roomscale",
      name: "Room Scale",
      year: "2026",
      kind: "AI · Computer vision",
      title: "One photo in. A true-scale room out.",
      summary:
        "AI staging tools paint furniture with no idea of size: sofas that would never fit through the door. Room Scale measures the room first.",
      problem:
        "Diffusion models make pretty rooms with no scale. A listing photo needs furniture that would actually fit.",
      insight:
        "One photo holds enough clues to recover real size: the floor plane, a door, an outlet plate. It is the same monocular idea as my original Virtual Staging app, rebuilt with modern models.",
      result:
        "SAM 3 segments the room and Apple Depth Pro measures it. A RANSAC floor plane and a weighted median of known-size objects fix the scale. Then a one-foot floor grid and the ceiling height go down, templates place the furniture at true size, and image models paint it.",
      metrics: [
        { value: "1", label: "photo in" },
        { value: "8′ 8.9″", label: "ceiling, measured" },
        { value: "11", label: "image models benchmarked" },
        { value: "360", label: "judged prompt runs" },
      ],
      stack: ["Python", "PyTorch", "OpenCV", "SAM 3", "Depth Pro", "Replicate", "OpenRouter", "Next.js", "Three.js", "Supabase"],
      // A pipeline. Each stage is one image of the same photo, same size.
      stages: [
        { label: "Photo", note: "One listing photo. No second view, no tape measure.", src: "assets/shots/roomscale-photo.webp" },
        { label: "Segment", note: "SAM 3 finds the floor, walls, doors and outlets.", src: "assets/shots/roomscale-segment.webp" },
        { label: "Depth", note: "Depth Pro gives metric depth, 1.4 m to 9.5 m.", src: "assets/shots/roomscale-depth.webp" },
        { label: "Measure", note: "Known objects fix the scale. A one-foot grid goes down.", src: "assets/shots/roomscale-grid.webp" },
        { label: "Plan", note: "A sofa, a rug and a table, placed at true size.", src: "assets/shots/roomscale-guide.webp" },
        { label: "Render", note: "An image model paints inside the plan.", src: "assets/shots/roomscale-render.webp" },
      ],
      media: [
        { type: "image", src: "assets/shots/roomscale-render.webp", w: 1500, h: 1001, alt: "An empty living room staged with a sofa, rug and coffee table at true size." },
        { type: "image", src: "assets/shots/roomscale-grid.webp", w: 1500, h: 1001, alt: "A one-foot floor grid drawn into the room, with the ceiling height measured." },
        { type: "image", src: "assets/shots/roomscale-depth.webp", w: 1500, h: 1001, alt: "A color depth map of the room." },
      ],
      models: [
        { name: "FLUX.2 Pro", src: "assets/shots/roomscale-m-flux-2-pro.webp" },
        { name: "FLUX Kontext Max", src: "assets/shots/roomscale-m-flux-kontext-max.webp" },
        { name: "Nano Banana Pro", src: "assets/shots/roomscale-m-nano-banana-pro.webp" },
        { name: "Qwen Image Edit+", src: "assets/shots/roomscale-m-qwen-image-edit-plus.webp" },
        { name: "Seedream 4.5", src: "assets/shots/roomscale-m-seedream-4-5.webp" },
        { name: "FLUX Fill Pro", src: "assets/shots/roomscale-m-flux-fill-pro.webp" },
      ],
      links: [],
    },
    {
      id: "finityforge",
      name: "FinityForge",
      year: "2026",
      kind: "3D · CAD · AI",
      title: "Design storage bins in live 3D. Or photograph an object and get a model back.",
      summary:
        "A no-render-button designer for Gridfinity bins: drag, snap and resize on a real printer bed, then export STL or multi-color 3MF.",
      problem:
        "Gridfinity is a great open storage system, but a custom bin means CAD software or a pile of remixed files.",
      insight:
        "You do not need a CAD kernel. Watertight meshes can be generated live while you drag. For the photo scan, the language model only proposes a shape; a deterministic optimizer does the fitting.",
      result:
        "Dividers, embossed labels, magnet holes, multi-plate layouts, filament cost, share by URL. The photo-to-CAD path traces silhouettes, proposes a parametric tree, and fits it to rendered silhouettes with no model in the loop.",
      metrics: [
        { value: "0", label: "render buttons" },
        { value: "STL · 3MF", label: "multi-color export" },
        { value: "Photo → CAD", label: "parametric fit" },
      ],
      stack: ["React", "TypeScript", "three.js", "react-three-fiber", "zustand", "OpenAI", "Anthropic"],
      media: [
        { type: "image", src: "assets/shots/finityforge-viewport.webp", w: 2400, h: 1500, alt: "FinityForge: eight storage bins in different colors and heights, with dividers and embossed labels, on a printer bed." },
        { type: "video", src: "assets/shots/finityforge-demo.mp4", poster: "assets/shots/finityforge-demo-poster.webp", w: 960, h: 630, alt: "A tray is dragged across the bed, stretched to a new size, and given dividers, live." },
        { type: "image", src: "assets/shots/finityforge-hero.webp", w: 2400, h: 1500, alt: "The full FinityForge interface with the inspector open." },
        { type: "video", src: "assets/shots/finityforge-ui.mp4", poster: "assets/shots/finityforge-ui-poster.webp", w: 1280, h: 800, alt: "The same edit in the full interface, with the inspector." },
        { type: "image", src: "assets/shots/finityforge-scan.webp", w: 2400, h: 1500, alt: "The photo scan view: a hand gripper rebuilt as a parametric model from four views." },
        { type: "image", src: "assets/shots/finityforge-mobile.webp", w: 780, h: 1688, alt: "FinityForge on a phone." },
      ],
      credit: "Gridfinity is an open standard by Zack Freedman.",
      links: [],
    },
    {
      id: "skyline",
      name: "Claude Skyline",
      year: "2026",
      kind: "Developer tools · Data viz",
      title: "Where did every token go? A city built from an AI agent's work.",
      summary:
        "Each API call is a tower. Height is output, footprint is input, the shell is cache read, the glow is cache write. Subagents get their own streets.",
      problem:
        "Agent sessions cost real money, and a transcript file tells you almost nothing about where it went.",
      insight:
        "Make cost physical. A skyline shows at a glance which calls were expensive, what was cached, and when a subagent went off on its own.",
      result:
        "A streaming extractor dedupes calls, prices cache reads and writes correctly, and rebuilds the subagent tree. 59 sessions load in 2 s cold and 0.2 s warm.",
      metrics: [
        { value: "2 s → 0.2 s", label: "cold to warm load" },
        { value: "1 tower", label: "per API call" },
      ],
      stack: ["Node", "three.js", "d3", "Playwright"],
      media: [
        { type: "image", src: "assets/shots/skyline-inspector.webp", w: 2400, h: 1350, alt: "Golden towers of API calls, with the inspector open on one call." },
        { type: "image", src: "assets/shots/skyline-lane.webp", w: 2400, h: 1350, alt: "A subagent lane in the skyline." },
        { type: "image", src: "assets/shots/skyline-city.webp", w: 1600, h: 840, alt: "A violet skyline of one session." },
      ],
      links: [{ label: "Source on GitHub", href: "https://github.com/vongillern/claude-skyline" }],
    },
    {
      id: "films",
      name: "Films made of code",
      year: "2026",
      kind: "Motion · Type · AI audio",
      title: "The caption is the scene.",
      summary:
        "Sermon clips where the words become the world: road paint in fog, stencils across 32,000 stadium seats, wood type on a letterpress bed, footprints in snow.",
      problem:
        "Captioned video usually puts text on top of a picture. I wanted the type to carry the voice, the same idea behind Dynamic Captions.",
      insight:
        "Make every frame a pure function of time. Then a browser can render it frame by frame, exactly, and any scene can be built from code.",
      result:
        "Each film is an HTML and three.js page. Headless Chromium seeks each frame and pipes it to ffmpeg. Voices, music and word times come from ElevenLabs and AssemblyAI with forced alignment.",
      metrics: [
        { value: "32,000", label: "instanced stadium seats" },
        { value: "48", label: "commits in 14 days" },
        { value: "t → frame", label: "every frame is deterministic" },
      ],
      stack: ["three.js", "Playwright", "ffmpeg", "Blender", "ElevenLabs", "AssemblyAI"],
      media: [
        { type: "video", src: "assets/shots/film-letterpress-loop.mp4", poster: "assets/shots/film-letterpress.webp", w: 960, h: 540, alt: "Wood type on a letterpress bed." },
        { type: "video", src: "assets/shots/film-stadium-loop.mp4", poster: "assets/shots/film-stadium.webp", w: 960, h: 540, alt: "Words spelled out across red stadium seats." },
        { type: "video", src: "assets/shots/film-fog-loop.mp4", poster: "assets/shots/film-fog.webp", w: 960, h: 540, alt: "Words painted on a road in fog." },
        { type: "video", src: "assets/shots/film-snow-loop.mp4", poster: "assets/shots/film-snow.webp", w: 960, h: 540, alt: "Words on a snowy mountain." },
      ],
      stills: [
        "assets/shots/film-letterpress.webp", "assets/shots/film-stadium.webp", "assets/shots/film-fog.webp",
        "assets/shots/film-snow.webp", "assets/shots/film-tabernacle.webp", "assets/shots/film-chalk.webp",
        "assets/shots/film-keylight.webp", "assets/shots/film-silverpoint.webp", "assets/shots/film-wireframe.webp",
        "assets/shots/film-roof.webp",
      ],
      links: [],
    },
    {
      id: "reduction",
      name: "Reduction",
      year: "2026",
      kind: "AI · Visualization",
      title: "Paste a recipe. See what can happen at the same time.",
      summary:
        "A language model turns a recipe into structured steps. A hand-built layout turns the steps into a flow diagram that shows what can run in parallel.",
      problem: "A recipe is a list, but cooking is a graph. The list hides what you can do while the butter softens.",
      insight:
        "Validate the model's output against a strict schema, then do the layout by hand: no graph library. Ribbons merge with widths by the square root of their weight and blend their colors.",
      result: "Diagrams for print and for phones, plus 51 generated ingredient illustrations and a 2,919-ingredient manifest.",
      metrics: [
        { value: "2,919", label: "ingredients in the manifest" },
        { value: "0", label: "graph libraries" },
      ],
      stack: ["React", "TypeScript", "zod", "SVG", "OpenRouter"],
      media: [
        { type: "image", src: "assets/shots/reduction-cookies.webp", w: 2400, h: 928, alt: "A flow diagram for chocolate chip cookies on parchment." },
        { type: "image", src: "assets/shots/reduction-pancakes.webp", w: 2400, h: 960, alt: "A flow diagram for pancakes." },
      ],
      links: [],
    },
    {
      id: "airplane",
      name: "Airplane Mode",
      year: "2026",
      kind: "Games · PWA",
      title: "Thirteen games that work at 35,000 feet.",
      summary:
        "A hub and thirteen games, six of them in 3D, each an installable app that runs with no network at all.",
      problem: "Offline web apps fail in quiet ways. Four of five regressions here were service-worker bugs.",
      insight:
        "Make the rules a check, not a habit. A script enforces every offline invariant, and the game rules are pure modules that test in milliseconds.",
      result: "A Playwright smoke test opens every game, then opens it again with the network cut.",
      metrics: [
        { value: "13", label: "offline games" },
        { value: "0", label: "build steps" },
      ],
      stack: ["JavaScript", "three.js", "Service Workers", "Playwright", "GitHub Pages"],
      // Phone captures (portrait). device: "phone" means: show in a phone frame or a tall slot.
      media: [
        { type: "video", device: "phone", src: "assets/shots/airplane-carve.mp4", poster: "assets/shots/airplane-carve-poster.webp", w: 390, h: 844, alt: "A snowboard run in Carve, one of the thirteen games." },
        { type: "image", device: "phone", src: "assets/shots/airplane-wake.webp", w: 780, h: 1688, alt: "Wake: a jet-ski race against seven rivals." },
        { type: "image", device: "phone", src: "assets/shots/airplane-hub.webp", w: 780, h: 1688, alt: "The Airplane Mode hub with its list of games." },
        { type: "image", device: "phone", src: "assets/shots/airplane-air.webp", w: 780, h: 1688, alt: "Carve: a clean-air bonus between the pines." },
      ],
      links: [{ label: "Play it", href: "https://vongillern.github.io/plane-games/" }],
    },
    {
      id: "sermons",
      name: "Sermon Atlas",
      year: "2026",
      kind: "Data · NLP",
      title: "Four years of sermons. Which parts of the Bible actually get preached?",
      summary:
        "163 sermons and 1.1 million words, annotated into 68,370 timestamped mentions, then drawn as star charts and atlases.",
      problem: "Hand annotation is accurate and slow. 25 sermons took real time; 163 would not.",
      insight:
        "Use the hand work as the teacher. Rules and a vocabulary distilled from the 25 hand-annotated sermons tag the rest, and both directions are scored.",
      result: "93.6% agreement on the same entity and 95.4% on the same category. 273 of 1,189 chapters were ever opened.",
      metrics: [
        { value: "1.1M", label: "words" },
        { value: "68,370", label: "timestamped mentions" },
        { value: "95.4%", label: "category agreement" },
      ],
      stack: ["Python", "Whisper", "AssemblyAI", "Canvas"],
      media: [
        { type: "image", src: "assets/shots/sermons-constellation.webp", w: 1200, h: 1200, alt: "A star chart of ideas that travel together." },
      ],
      links: [],
    },
  ],

  // Monotype R&D, 2022 to 2025. No screenshots exist; variants illustrate these.
  inventions: [
    {
      id: "humaneyesonly",
      name: "HumanEyesOnly",
      status: "Acquired by Monotype",
      title: "Readable by people. Gibberish to machines.",
      summary:
        "A scrambled font makes a PDF that you can read and a computer cannot. Copy the text and you paste noise. It started as my side project; Monotype bought it and hired me.",
      media: { type: "image", src: "assets/shots/humaneyesonly.webp", w: 2560, h: 1280, alt: "HumanEyesOnly: 'Your eyes see' a name and number; 'Your computer sees' scrambled characters." },
      link: { label: "humaneyesonly.com", href: "https://www.humaneyesonly.com" },
      demo: { see: "Name: Satoshi Nakamoto", bot: "ƐコϘおᆵ グゆƨᄰɵっӊ" },
    },
    {
      id: "genome",
      name: "Font Genome Project",
      status: "Provisional patent application",
      title: "About 10,000 measurements of a typeface.",
      summary:
        "The average, spread, minimum and maximum of every stroke's width and angle, plus hundreds of qualitative features. A typeface becomes data that a model can learn from.",
    },
    {
      id: "glyphs",
      name: "Glyph generation",
      status: "Started the GenAI team",
      title: "Draw a few letters. Get the whole alphabet.",
      summary:
        "From a small set of designed glyphs, usually the words “Hamburger” or “Adhesion”, generate the rest of the Adobe Latin-2 character set.",
      demo: { seed: ["Hamburger", "Adhesion"] },
    },
    {
      id: "typetester",
      name: "TypeTester",
      status: "Provisional patent application",
      title: "Image generation that respects the font.",
      summary:
        "Diffusion models mangle text. A custom pipeline keeps exact fidelity to the font, so a customer sees what the typeface will really look like in context.",
    },
    {
      id: "captions",
      name: "Dynamic Captions",
      status: "Provisional patent application",
      title: "Fonts are the voice of text.",
      summary:
        "Captions that change font, add effects, and move the axes of variable fonts to match the emotion and the rhythm of the speaker. Built on multimodal language models.",
      demo: {
        line: ["I", "never", "said", "it", "was", "easy."],
        moods: ["calm", "excited", "whisper", "angry"],
      },
    },
  ],

  // Stories from earlier roles. Variants can illustrate these.
  stories: [
    {
      id: "igor",
      org: "Igor",
      years: "2013–2015",
      title: "Lights that tell you their names.",
      summary:
        "Commissioning a room of networked lights took 20 to 30 minutes of matching MAC addresses. I made each light flash its own number sequence; a webcam pointed at the ceiling read them all.",
      before: "20–30 min",
      after: "2 min",
      // The first two names are real examples. The others follow the same scheme, for the illustration.
      names: ["Green Skywalker 7", "Rioting Gandalf 3", "Amber Ripley 2", "Quiet Frodo 5", "Brave Leia 9", "Silver Gimli 4"],
    },
    {
      id: "pioneer",
      org: "Pioneer Hi-Bred",
      years: "2007–2011",
      title: "1.4 GB to 30 MB.",
      summary:
        "Research stations with poor connections needed genomic data in real time. Custom compression made the file 97% smaller. I also wrote a small language so 250 PhD maize breeders could define their own metrics.",
      before: "1.4 GB",
      after: "30 MB",
    },
    {
      id: "webcare",
      org: "WebCareHealth",
      years: "2015–2021",
      title: "From 800 patients to tens of thousands.",
      summary:
        "Remote monitoring for cardiology patients with chronic conditions, under HIPAA and HITECH. Millions of lab results reviewed. We built a dongle that read a blood-clotting meter's infrared port and ran on power taken from the phone's headphone jack.",
      before: "800",
      after: "10,000s",
    },
  ],

  experience: [
    { org: "von Gillern Consulting", role: "AI consultant", years: "2025–now", summary: "Custom AI with OpenAI, Anthropic and Gemini models. RAG, MCP servers, fine-tuning, n8n, Open WebUI and voice agents, on Azure and AWS." },
    { org: "Monotype", role: "Principal Engineer, R&D", years: "2022–2025", summary: "Joined when Monotype acquired HumanEyesOnly. The Font Genome Project, TypeTester, Dynamic Captions, and a GenAI team for glyph generation." },
    { org: "von Gillern Consulting", role: "Consultant", years: "2021–2022", summary: "Freelance .NET and Azure work. Built HumanEyesOnly on the side." },
    { org: "WebCareHealth", role: "CTO", years: "2015–2021", summary: "Remote patient monitoring for cardiology. Grew from 800 to tens of thousands of patients. Test-driven health code, custom meter hardware, a Xamarin app with Bluetooth meters." },
    { org: "Igor", role: "Consultant", years: "2013–2015", summary: "The first cloud app for power-over-Ethernet lighting. Real-time room-use reports, automatic routines, and lights that identify themselves to a webcam." },
    { org: "ITA Group", role: "Consultant", years: "2011–2013", summary: "Sales incentive programs for Hyundai, Mazda and Verizon. Led the move to ASP.NET MVC and brought in TDD and SOLID." },
    { org: "Pioneer Hi-Bred", role: "Molecular breeding consultant", years: "2007–2011", summary: "Apps for 250 PhD maize breeders. 97% compression of genomic files, WPF visualizations of genetic flow, and a language for breeders' own metrics." },
    { org: "Wells Fargo · Accenture · Spindustry", role: "Early career", years: "1998–2007", summary: "Where it started." },
  ],

  // Shipped products from before, mostly retired. Real screenshots from the Wayback Machine.
  archive: [
    {
      id: "nitriq",
      name: "Nitriq",
      year: "2009",
      title: "Static analysis for .NET, with a treemap I wrote from the research paper.",
      summary: "Write LINQ queries against your own code base. Mono.Cecil for deep reflection and a squarified treemap in WPF.",
      media: { type: "image", src: "assets/shots/nitriq.webp", w: 1280, h: 1024, alt: "Nitriq: a query editor, a code tree and a red and blue treemap." },
    },
    {
      id: "atomiq",
      name: "Atomiq",
      year: "2010",
      title: "Find the copy-paste in a large code base.",
      summary: "A simple, effective way to find duplicate code, and a wheel that shows where the copies go.",
      media: { type: "image", src: "assets/shots/atomiq-wheel.webp", w: 1016, h: 1024, alt: "Atomiq's wheel: arcs of color link duplicated code across files." },
      media2: { type: "image", src: "assets/shots/atomiq-main.webp", w: 1280, h: 1024, alt: "Atomiq's main screen." },
    },
    {
      id: "regexpixie",
      name: "RegexPixie",
      year: "2012",
      title: "Live regular expressions with real support for named groups.",
      summary: "The original was a WPF app. I rebuilt it in Vue in 2026.",
      media: { type: "image", src: "assets/shots/regexpixie-2012.webp", w: 1280, h: 1024, alt: "RegexPixie: a pattern, sample text with highlighted matches, and the named groups." },
      media2: { type: "image", src: "assets/shots/regexpixie-2026.webp", w: 2400, h: 1500, alt: "The 2026 rebuild of RegexPixie, with date groups highlighted." },
    },
    {
      id: "sizzle",
      name: "Sizzle Analytics",
      year: "c. 2013",
      title: "Millions of rows, filtered in real time, with animation that means something.",
      summary: "d3 and crossfilter, before it was common. Rebuilt in 2026: drop in a CSV, a model classifies the columns, and the dashboard builds itself.",
      media: { type: "video", src: "assets/shots/sizzle-dashboard.mp4", poster: "assets/shots/sizzle-dashboard-poster.webp", w: 600, h: 360, alt: "A Sizzle dashboard filtering NFL penalty data." },
      media2: { type: "video", src: "assets/shots/sizzle-analyze.mp4", poster: "assets/shots/sizzle-analyze-poster.webp", w: 1080, h: 524, alt: "Sizzle bar charts updating as filters change." },
    },
    {
      id: "staging",
      name: "Virtual Staging",
      year: "Unreleased",
      title: "Furniture in an empty room, from one photo.",
      summary: "Monocular photogrammetry: one orthogonal corner and the ceiling height were enough to recover the room. Room Scale is its successor.",
    },
  ],

  // Smaller builds. Good for an index or a list.
  builds: [
    { name: "Fontdex", year: "2026", title: "Every Google Font, measured from its outlines.", detail: "3,101 font files: stems, crossbars and x-heights from 500 scanlines through the H.", data: "content/fontdex.json" },
    { name: "Sculpture slicer", year: "2026", title: "Slice a 28-million-triangle Bernini into a printable relief.", detail: "The browser loads light versions; a Python server cuts the full 1.4 GB mesh with exact, sealed caps.", media: { type: "image", src: "assets/shots/slicer-hero.webp", w: 2400, h: 1500, alt: "A sculpture scan inside a 240 mm cube, ready to slice." }, media2: { type: "image", src: "assets/shots/slicer-inside.webp", w: 2400, h: 1500, alt: "The part of the sculpture inside the cube." } },
    { name: "Spruce Pine", year: "2026", title: "Gifts designed in the browser and printed on a desk.", detail: "Parametric models with circuit-board traces and a spiral notebook insert. STL and two-color 3MF export.", media: { type: "image", src: "assets/shots/spruce-spiral.webp", w: 2400, h: 1500, alt: "A gold spiral coil holds a notebook insert." }, media2: { type: "image", src: "assets/shots/spruce-plate.webp", w: 2400, h: 1500, alt: "A display plate with gold circuit traces between specimen pockets." } },
    { name: "Truss", year: "2026", title: "A slicer-native gyroid with a real second skin.", detail: "179 cm³ of plastic against 202 cm³ for plain 15% gyroid, proven by slicing.", media: { type: "image", src: "assets/shots/truss-skins.webp", w: 1800, h: 1200, alt: "Shells and cavities for a cube, a sphere and a dumbbell." } },
    { name: "ClubOS", year: "2026", title: "A country-club platform on one immutable ledger.", detail: "Offline point of sale, a race-safe tee sheet, row-level tenancy, 63 tests." },
    { name: "Paper.js → TypeScript", year: "2026", title: "A library migration run by a team of coding agents.", detail: "A dependency graph of 64 tasks and a 526-test safety net." },
    { name: "KV cache chapter", year: "2026", title: "An animated chapter for Brendan Bycroft's LLM Visualization.", detail: "Why prompt caching makes long prompts cheap." },
  ],

  consulting: {
    name: "von Gillern Consulting",
    pitch: "AI that has to work on Monday morning, not only in the demo.",
    services: [
      { name: "AI systems", detail: "RAG, agents and MCP servers on OpenAI, Anthropic and Gemini models." },
      { name: "Evaluation", detail: "Benchmarks, judges and cost tracking, so you know which model earns its price." },
      { name: "Automation", detail: "n8n, Open WebUI and voice agents wired into the tools you already use." },
      { name: "Prototype to production", detail: "Node, React, .NET and Python on Azure and AWS, with tests." },
    ],
    tools: ["Claude Code", "Cursor", "OpenAI", "Anthropic", "Gemini", "n8n", "Azure", "AWS"],
  },

  contact: {
    line: "Bring me the problem nobody else will take.",
    cta: "Start a conversation",
  },
};

// Metadata for the chooser page and the preview boards.
export const variants = [
  { slug: "monograph", n: "01", name: "Monograph", note: "Light editorial. Big serif type, quiet grid, image reveals." },
  { slug: "instrument", n: "02", name: "Instrument", note: "Dark and technical. Live data, measured motion." },
  { slug: "specimen", n: "03", name: "Specimen", note: "A type foundry. Variable fonts that move with a voice." },
  { slug: "fieldnotes", n: "04", name: "Field Notes", note: "Warm paper and engineering drawings that draw themselves." },
];
