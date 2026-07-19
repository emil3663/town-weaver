const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById('map');
const CX = 340, CY = 380;
const INNER_R = 140, OUTER_R = 250, FOREST_R = 290;
const RING_ANGLES = [0,45,135,180,225,315];
const DWELL_COLORS = ['var(--coral)','var(--gold)','var(--magic)','var(--teal)'];

function el(tag, attrs, parent){
  const e = document.createElementNS(NS, tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}
function polar(r, angleDeg){
  const rad = angleDeg * Math.PI/180;
  return { x: CX + r*Math.sin(rad), y: CY - r*Math.cos(rad) };
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

// --- icon drawing helpers (each draws into a local <g>, origin-centered) ---
function iconHouse(g, color){
  el('rect', {x:-16, y:-6, width:32, height:22, rx:2, fill:'var(--parchment)', stroke:color, 'stroke-width':1.5, class:'loc-icon'}, g);
  el('polygon', {points:'-19,-6 0,-24 19,-6', fill:color, class:'loc-icon'}, g);
}
function iconWell(g){
  el('circle', {cx:0, cy:2, r:13, fill:'var(--parchment)', stroke:'var(--river)', 'stroke-width':2.5, class:'loc-icon'}, g);
  el('rect', {x:-2, y:-16, width:4, height:14, fill:'var(--line)'}, g);
}
function iconGarden(g){
  el('rect', {x:-16, y:-8, width:32, height:20, rx:2, fill:'var(--parchment)', stroke:'var(--forest)', 'stroke-width':1.5, class:'loc-icon'}, g);
  [-9,0,9].forEach(dx=>{ el('circle', {cx:dx, cy:0, r:4, fill:'var(--forest)'}, g); });
}
function iconTower(g){
  el('rect', {x:-11, y:-26, width:22, height:34, fill:'var(--parchment)', stroke:'var(--stone)', 'stroke-width':2, class:'loc-icon'}, g);
  [-11,-3.5,4.5].forEach(x=>{ el('rect', {x:x, y:-30, width:4, height:6, fill:'var(--stone)'}, g); });
}
function iconPen(g){
  el('line', {x1:-16, y1:2, x2:16, y2:2, stroke:'var(--line)', 'stroke-width':2, class:'loc-icon'}, g);
  [-14,-7,0,7,14].forEach(x=>{ el('line', {x1:x, y1:-8, x2:x, y2:8, stroke:'var(--line)', 'stroke-width':2}, g); });
}
function iconMound(g){
  el('path', {d:'M-18,8 A18,14 0 0 1 18,8 Z', fill:'var(--stone-soft)', stroke:'var(--stone)', 'stroke-width':1.5, class:'loc-icon'}, g);
}
function iconGate(g){
  el('rect', {x:-14, y:-14, width:5, height:26, fill:'var(--line)', class:'loc-icon'}, g);
  el('rect', {x:9, y:-14, width:5, height:26, fill:'var(--line)'}, g);
  el('path', {d:'M-14,-14 Q0,-30 14,-14', fill:'none', stroke:'var(--line)', 'stroke-width':4}, g);
}
function iconDock(g){
  el('rect', {x:-18, y:-4, width:36, height:8, fill:'var(--line)', class:'loc-icon'}, g);
  [-12,0,12].forEach(x=>{ el('line', {x1:x, y1:4, x2:x, y2:14, stroke:'var(--line)', 'stroke-width':2}, g); });
}
function iconStones(g){
  for(let i=0;i<6;i++){
    const rad = (i*60)*Math.PI/180;
    const x = 12*Math.sin(rad), y = -12*Math.cos(rad);
    el('circle', {cx:x, cy:y, r:3.2, fill:'var(--stone)', class:'loc-icon'}, g);
  }
}
function iconLandmark(g){
  el('circle', {r:52, fill:'var(--gold)', opacity:0.18, class:'oak-glow'}, g);
  el('ellipse', {cx:-14, cy:-14, rx:26, ry:20, fill:'var(--forest)'}, g);
  el('ellipse', {cx:14, cy:-16, rx:24, ry:19, fill:'var(--forest-dark)'}, g);
  el('ellipse', {cx:0, cy:-26, rx:22, ry:18, fill:'var(--forest)'}, g);
  el('rect', {x:-6, y:0, width:12, height:20, fill:'#5a4530'}, g);
}
function iconForCategory(cat, dwellIndexRef){
  switch(cat){
    case 'water': return iconWell;
    case 'nature': return iconGarden;
    case 'defense': return iconTower;
    case 'agriculture': return iconPen;
    case 'burial': return iconMound;
    case 'gate': return iconGate;
    case 'dock': return iconDock;
    case 'ritual': return iconStones;
    default: {
      const color = DWELL_COLORS[dwellIndexRef.i % DWELL_COLORS.length];
      dwellIndexRef.i++;
      return (g)=>iconHouse(g, color);
    }
  }
}

let currentInfo = {};

function renderMap(data){
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  currentInfo = {};

  // forest border
  const forestGroup = el('g', {class:'map-loc', 'data-id':'forest'}, svg);
  el('circle', {cx:CX, cy:CY, r:FOREST_R, fill:'none', stroke:'var(--line)', 'stroke-width':1, 'stroke-dasharray':'3 6', opacity:0.5}, forestGroup);
  const TREE_COUNT = 30;
  for(let i=0;i<TREE_COUNT;i++){
    const a = (360/TREE_COUNT)*i;
    const p = polar(FOREST_R, a);
    const s = 8 + (i%3)*2;
    const t = el('g', {transform:`translate(${p.x},${p.y})`}, forestGroup);
    el('polygon', {points:`0,${-s} ${s*0.8},${s*0.6} ${-s*0.8},${s*0.6}`, fill:'var(--forest)', stroke:'var(--forest-dark)', 'stroke-width':0.5}, t);
    el('rect', {x:-1.5, y:s*0.6, width:3, height:s*0.5, fill:'var(--forest-dark)'}, t);
  }
  el('text', {x:CX, y:66, class:'loc-label', 'text-anchor':'middle'}, svg).textContent = 'Border';
  currentInfo['forest'] = {name:'The border', desc:data.forestDesc || 'Wild land rings the settlement.'};

  // river
  if(data.riverName){
    const riverPath = "M75,120 C140,170 150,200 178,213 C230,238 180,350 235,425 C290,500 400,480 470,535 C500,558 505,548 517,557 C555,580 585,610 610,640";
    const riverGroup = el('g', {class:'map-loc', 'data-id':'river'}, svg);
    el('path', {d:riverPath, fill:'none', stroke:'var(--river)', 'stroke-width':9, 'stroke-linecap':'round', opacity:0.55}, riverGroup);
    el('text', {x:48, y:96, class:'loc-label', 'text-anchor':'start'}, svg).textContent = data.riverName;
    currentInfo['river'] = {name:data.riverName, desc:data.riverDesc || ''};
  }

  // roads (fixed hex skeleton)
  const roadGroup = el('g', {}, svg);
  RING_ANGLES.forEach(a=>{
    const pIn = polar(INNER_R, a);
    const pOut = polar(OUTER_R, a);
    el('line', {x1:CX, y1:CY, x2:pIn.x, y2:pIn.y, stroke:'var(--line)', 'stroke-width':1.2, opacity:0.6}, roadGroup);
    el('line', {x1:pIn.x, y1:pIn.y, x2:pOut.x, y2:pOut.y, stroke:'var(--line)', 'stroke-width':1.2, opacity:0.6}, roadGroup);
  });

  // locations
  let innerIdx = 0, outerIdx = 0;
  const dwellRef = {i:0};
  (data.locations || []).forEach((loc, i)=>{
    const ring = loc.ring === 'outer' ? 'outer' : 'inner';
    const idx = ring === 'inner' ? innerIdx++ : outerIdx++;
    if(idx >= 6) return;
    const angle = RING_ANGLES[idx];
    const r = ring === 'inner' ? INNER_R : OUTER_R;
    const p = polar(r, angle);
    const id = 'loc_' + ring + '_' + idx;
    const g = el('g', {class:'map-loc', 'data-id':id, transform:`translate(${p.x},${p.y})`}, svg);
    el('circle', {class:'loc-ring', r:28}, g);
    const iconFn = iconForCategory(loc.category, dwellRef);
    iconFn(g);
    const labelY = (angle===0 || angle===45 || angle===315) ? -34 : 40;
    el('text', {x:0, y:labelY, class:'loc-label', 'text-anchor':'middle'}, g).textContent = loc.name;
    currentInfo[id] = {name:loc.name, desc:loc.description || ''};
  });

  // landmark (center)
  const landmarkGroup = el('g', {class:'map-loc', 'data-id':'landmark', transform:`translate(${CX},${CY})`}, svg);
  iconLandmark(landmarkGroup);
  el('text', {x:0, y:46, class:'loc-label-title', 'text-anchor':'middle'}, landmarkGroup).textContent = data.landmark.name;
  currentInfo['landmark'] = {name:data.landmark.name, desc:data.landmark.description || ''};
}

function renderDoc(data){
  document.getElementById('townName').textContent = data.name;
  document.getElementById('townSubtitle').textContent = data.subtitle || '';
  document.getElementById('overviewBody').innerHTML = `<p>${escapeHtml(data.overview)}</p>`;
  document.getElementById('landmarkSummary').textContent = data.landmark.name;
  document.getElementById('landmarkBody').innerHTML = `<p>${escapeHtml(data.landmark.description)}</p>`;
  document.getElementById('residentsBody').innerHTML = (data.residents || [])
    .map(r=>`<p><strong>${escapeHtml(r.name)}</strong> (${escapeHtml(r.role)}) — ${escapeHtml(r.bio)}</p>`).join('');
  document.getElementById('economyBody').innerHTML =
    `<p>${escapeHtml(data.economy)}</p><ul>${(data.customs||[]).map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>`;
  document.getElementById('hooksBody').innerHTML =
    `<ul>${(data.hooks||[]).map(h=>`<li>${escapeHtml(h)}</li>`).join('')}</ul><p>${escapeHtml(data.dangers)}</p>`;
  document.getElementById('footerQuote').innerHTML = data.quote ? `"${escapeHtml(data.quote)}"` : '';
}

// --- interactivity: click map ---
const infoName = document.getElementById('infoName');
const infoDesc = document.getElementById('infoDesc');
let selectedEl = null;
svg.addEventListener('click', (e)=>{
  const target = e.target.closest('.map-loc');
  if(!target) return;
  const id = target.getAttribute('data-id');
  const data = currentInfo[id];
  if(!data) return;
  if(selectedEl) selectedEl.classList.remove('selected');
  target.classList.add('selected');
  selectedEl = target;
  infoName.textContent = data.name;
  infoDesc.textContent = data.desc;
  infoDesc.classList.remove('info-hint');
});

// --- default town: Thornwick ---
const DEFAULT_DATA = {
  name: "Thornwick",
  subtitle: "Town of the Library of Journeys",
  overview: "Nestled in a valley where three ancient ley lines converge, Thornwick appears as an unremarkable medieval settlement to casual travelers. Those who know its true nature come seeking the legendary Library of Journeys, where stories literally come alive. Population: 50. Governance: Council of Shamans.",
  landmark: {name:"Great Oak Library", description:"A massive oak hollowed and carved into spiraling chambers, lit by luminescent fungi. Five shaman-librarians tend its living stories: Elderoak Mirin, Thornwick Garreth, Mistral Yuki, Shadowleaf Kael, and Brightstone Zara."},
  riverName: "River Thorne",
  riverDesc: "Curves in from the northwest past the dock and exits southeast near the Barrow — Old Tam says it remembers every tale ever read on its banks.",
  forestDesc: "Old forest rings the entire valley. The treeline is said to shift whenever the Library adds a particularly powerful story to its collection.",
  locations: [
    {name:"Shaman's Circle", ring:"inner", category:"ritual", description:"Open ground where the shamans conduct rituals and town meetings."},
    {name:"Wayfarers' Rest", ring:"inner", category:"dwelling", description:"Inn and tavern run by Brenn Copperkettle, whose meals somehow taste like memories."},
    {name:"Trading Post", ring:"inner", category:"dwelling", description:"Senna Goldweaver's stall of inks, papers, and binding materials."},
    {name:"Memory Well", ring:"inner", category:"water", description:"A stone well where visitors safely return from story-journeys."},
    {name:"The Bindery", ring:"inner", category:"dwelling", description:"Workshop where damaged story-books are repaired."},
    {name:"Herb Gardens", ring:"inner", category:"nature", description:"Ritual plants tended by Moss Greenthumb, arranged in mirroring spirals."},
    {name:"Watchtower", ring:"outer", category:"defense", description:"Overlooks the valley approaches, commanded by Osric Vane."},
    {name:"Livestock Pens", ring:"outer", category:"agriculture", description:"Goats, chickens, and sheep for basic sustenance."},
    {name:"Barrow of Lost Readers", ring:"outer", category:"burial", description:"Where the town buries those who never fully came back from a story."},
    {name:"Threshold Gate", ring:"outer", category:"gate", description:"The town's warded official entrance."},
    {name:"Healer's Cottage", ring:"outer", category:"dwelling", description:"Dr. Ysolde Fenwick treats story-sickness as often as broken bones."},
    {name:"Fisherman's Dock", ring:"outer", category:"dock", description:"Old Tam ferries goods and claims the river remembers every story."}
  ],
  residents: [
    {name:"Brenn Copperkettle", role:"Innkeeper, dwarf, 78", bio:"Former adventurer whose meals taste like memories."},
    {name:"Senna Goldweaver", role:"Merchant, human, 41", bio:"Rumored ties to other magical libraries."},
    {name:"Moss Greenthumb", role:"Herbalist, halfling, 52", bio:"Speaks to plants who 'gossip' about visitors."},
    {name:"Osric Vane", role:"Guard Captain, human, 52", bio:"Read one story too many, and chose to stay."},
    {name:"Dr. Ysolde Fenwick", role:"Physician, human, 61", bio:"Keeps a ledger of visitors who returned 'not quite right.'"},
    {name:"Old Tam", role:"Ferryman, age unknown", bio:"Claims the river remembers every story read on its banks."}
  ],
  economy: "Income: library fees, lodging, ritual components, story transcription. Trade: imports of inks and parchment; exports of transcribed stories and magical herbs.",
  customs: ["The Story-Sharing Circle — weekly gathering of daily-life tales", "The Binding Day Festival — annual addition of new stories", "The Silence Hour — daily meditation honoring the stories' power"],
  hooks: ["The Missing Librarian — a shaman has vanished into a story", "The Corrupted Tale — a dark story spreading beyond its book", "The Storyteller's Curse — a bard barred from the story-books seeks help"],
  dangers: "Story Sickness, Narrative Entanglement, and the sealed Blank Pages all threaten unwary readers.",
  quote: "Every story is a door, but not every door should be opened."
};

// --- settings: Ollama URL + model, persisted to localStorage ---
const SETTINGS_KEY = 'townWeaverSettings';
const DEFAULT_SETTINGS = { ollamaUrl: 'http://localhost:11434', model: 'mistral' };

function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw) return {...DEFAULT_SETTINGS};
    const parsed = JSON.parse(raw);
    return {
      ollamaUrl: parsed.ollamaUrl || DEFAULT_SETTINGS.ollamaUrl,
      model: parsed.model || DEFAULT_SETTINGS.model,
    };
  }catch(err){
    return {...DEFAULT_SETTINGS};
  }
}

function saveSettings(settings){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

let currentSettings = loadSettings();

const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const ollamaUrlInput = document.getElementById('ollamaUrlInput');
const modelInput = document.getElementById('modelInput');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsStatus = document.getElementById('settingsStatus');

function setSettingsStatus(msg, isError){
  settingsStatus.textContent = msg;
  settingsStatus.style.color = isError ? 'var(--coral)' : 'var(--forest)';
}

settingsBtn.addEventListener('click', ()=>{
  if(settingsPanel.hidden){
    ollamaUrlInput.value = currentSettings.ollamaUrl;
    modelInput.value = currentSettings.model;
    settingsStatus.textContent = '';
    settingsPanel.hidden = false;
  }else{
    settingsPanel.hidden = true;
  }
});

testConnectionBtn.addEventListener('click', async ()=>{
  const url = ollamaUrlInput.value.trim().replace(/\/$/, '') || DEFAULT_SETTINGS.ollamaUrl;
  setSettingsStatus('Testing…', false);
  try{
    const res = await fetch(`${url}/api/tags`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = (data.models || []).length;
    setSettingsStatus(`Connected — ${count} model${count === 1 ? '' : 's'} available.`, false);
  }catch(err){
    setSettingsStatus('Could not reach Ollama at that URL. Is it running?', true);
  }
});

saveSettingsBtn.addEventListener('click', ()=>{
  const url = ollamaUrlInput.value.trim().replace(/\/$/, '') || DEFAULT_SETTINGS.ollamaUrl;
  const model = modelInput.value.trim() || DEFAULT_SETTINGS.model;
  currentSettings = { ollamaUrl: url, model: model };
  saveSettings(currentSettings);
  setSettingsStatus('Settings saved.', false);
});

// --- tier-aware prompts, embedded client-side (Ollama has no server to hold
// a secret system prompt, so these are plain strings shipped with the app) ---
const TIER_SPECS = {
  'town': {
    label: 'Town', popMin: 500, popMax: 2000, locMin: 6, locMax: 10, resMin: 3, resMax: 4,
    flavor: 'an intimate market town or regional hub, with a simple economy and informal governance (a single leader, council, or elder)',
  },
  'city': {
    label: 'City', popMin: 3000, popMax: 8000, locMin: 10, locMax: 15, resMin: 6, resMax: 8,
    flavor: 'a regional capital or major trade center, with a complex, layered economy and multiple named administrative or guild roles',
  },
  'county-seat': {
    label: 'County Seat', popMin: 8000, popMax: 15000, locMin: 12, locMax: 18, resMin: 8, resMax: 12,
    flavor: 'an administrative capital for a county, with an established history, visible military or civic infrastructure, and formal governance',
  },
  'provincial-capital': {
    label: 'Provincial Capital', popMin: 15000, popMax: 40000, locMin: 15, locMax: 25, resMin: 12, resMax: 20,
    flavor: "a kingdom or region's major city, with extensive infrastructure, multiple distinct districts, and a deep bureaucracy or noble hierarchy",
  },
};

function buildTierPrompt(tier){
  const spec = TIER_SPECS[tier];
  return `You design fictional settlements for a tabletop RPG map app. This settlement is ${spec.flavor}.
Output ONLY a valid JSON object, no markdown, no explanation, no backticks. Return exactly this shape:
{"name":string,"subtitle":string,"overview":string (2-3 sentences, evoking a settlement of roughly ${spec.popMin}-${spec.popMax} inhabitants),
"population":integer (a specific plausible population between ${spec.popMin} and ${spec.popMax}),
"landmark":{"name":string,"description":string (1-2 sentences)},
"riverName":string or null,"riverDesc":string or null (1 sentence),
"forestDesc":string or null (1 sentence, describes whatever borders the settlement — forest, dunes, ice, etc.),
"locations":[${spec.locMin} to ${spec.locMax} objects: {"name":string,"ring":"inner" or "outer","category": one of "dwelling","water","nature","defense","agriculture","burial","gate","dock","ritual","description":string (under 18 words)}],
"residents":[${spec.resMin} to ${spec.resMax} objects: {"name":string,"role":string,"bio":string (under 15 words)}],
"economy":string (1 sentence),"customs":[3 short strings],"hooks":[3 short strings],"dangers":string (1 sentence),"quote":string (a short inscription-style line)}
Pick categories that genuinely match each location's function. Keep every string terse. Split locations roughly evenly between "inner" and "outer" rings. Output ONLY the JSON object — never add backticks, markdown fences, or any explanation before or after it.`;
}

const TIER_PROMPTS = {
  'town': buildTierPrompt('town'),
  'city': buildTierPrompt('city'),
  'county-seat': buildTierPrompt('county-seat'),
  'provincial-capital': buildTierPrompt('provincial-capital'),
};

// --- Ollama generation ---
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const promptInput = document.getElementById('promptInput');
const genStatus = document.getElementById('genStatus');

function setStatus(msg, isError){
  genStatus.textContent = msg;
  genStatus.style.color = isError ? 'var(--coral)' : 'var(--ink-soft)';
}

function getSelectedTier(){
  const checked = document.querySelector('input[name="tier"]:checked');
  return checked ? checked.value : 'town';
}

// Ollama sometimes wraps its JSON in markdown fences or adds stray prose
// around it; strip fences and isolate the outermost {...} before parsing.
function parseOllamaJson(rawText){
  let cleaned = (rawText || '').trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if(start !== -1 && end !== -1 && end > start){
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

function assignLocationIds(data){
  (data.locations || []).forEach((loc, i)=>{
    if(!loc.id) loc.id = `loc-${i}-${Date.now()}`;
  });
  return data;
}

async function generateTown(promptText){
  const tier = getSelectedTier();
  setStatus('Drafting the settlement charter…', false);
  generateBtn.disabled = true;
  try{
    const base = (currentSettings.ollamaUrl || DEFAULT_SETTINGS.ollamaUrl).replace(/\/$/, '');
    const fullPrompt = `${TIER_PROMPTS[tier]}\n\nConcept: ${promptText}`;

    let response;
    try{
      response = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: currentSettings.model, prompt: fullPrompt, stream: false })
      });
    }catch(networkErr){
      throw new Error(`Could not reach Ollama at ${base}. Is it running? Check Settings (⚙).`);
    }

    if(!response.ok){
      throw new Error(`Ollama returned an error (HTTP ${response.status}). Check the URL and model name in Settings.`);
    }

    const json = await response.json();
    let data;
    try{
      data = parseOllamaJson(json.response);
    }catch(parseErr){
      throw new Error("Ollama's response wasn't valid JSON — try regenerating, or try a different model in Settings.");
    }

    data.tier = tier;
    if(!data.landmark) data.landmark = {name:"The landmark", description:""};
    assignLocationIds(data);
    renderMap(data);
    renderDoc(data);
    setStatus('Done — click anything on the map to explore it.', false);
  }catch(err){
    console.error(err);
    setStatus(err.message || 'Something went wrong generating that settlement — try rephrasing, or simplifying the concept.', true);
  }finally{
    generateBtn.disabled = false;
  }
}

generateBtn.addEventListener('click', ()=>{
  const val = promptInput.value.trim();
  if(!val){ setStatus('Type a short concept first.', true); return; }
  generateTown(val);
});
resetBtn.addEventListener('click', ()=>{
  renderMap(DEFAULT_DATA);
  renderDoc(DEFAULT_DATA);
  promptInput.value = '';
  setStatus('', false);
});

// initial render
renderMap(DEFAULT_DATA);
renderDoc(DEFAULT_DATA);
