(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');

/* ---------- header / menu ---------- */
const hd = $('#hd'), burger = $('#burger');
burger.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
$$('#nav a').forEach(a => a.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', false);
}));
const zones = $$('[data-hd]');

/* ---------- hero topo lines ---------- */
const topo = $('#topoLines');
function drawTopo() {
  const w = topo.clientWidth, h = topo.clientHeight;
  topo.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let out = '';
  const n = 18;
  for (let i = 0; i < n; i++) {
    const base = h * (i + .5) / n;
    let d = '';
    for (let x = -20; x <= w + 20; x += 24) {
      const y = base + Math.sin(x / 210 + i * .55) * 26 + Math.sin(x / 90 + i * 1.7) * 7 + Math.cos(x / 520 - i * .3) * 40 * (i / n);
      d += (x < 0 ? 'M' : 'L') + x.toFixed(0) + ' ' + y.toFixed(1);
    }
    out += `<path d="${d}"${i === 11 ? ' class="hl"' : ''}/>`;
  }
  topo.innerHTML = out;
}
drawTopo();

/* ---------- boring log (ilustrativo) ---------- */
const TOTAL = 20;
const LAYERS = [
  { to: 1.5, c: '#6b5843', n: 'Aterro areno-argiloso', s: 'heterogêneo' },
  { to: 5, c: '#3d3933', n: 'Argila orgânica', s: 'muito mole' },
  { to: 9, c: '#b0743a', n: 'Areia fina siltosa', s: 'fofa a med. compacta' },
  { to: 14, c: '#8a4a2c', n: 'Argila siltosa', s: 'rija' },
  { to: 18, c: '#7c5a3c', n: 'Silte arenoso', s: 'compacto' },
  { to: 20, c: '#4a4846', n: 'Rocha alterada', s: 'impenetrável' }
];
const SPT = [2,3,1,1,2,2,5,8,11,13,14,16,18,21,26,29,33,38,46,50];
const col = $('#logCol'), rod = $('#logRod'), names = $('#logNames'), ruler = $('#logRuler');
let prev = 0;
LAYERS.forEach((l, i) => {
  const top = prev / TOTAL * 100, hgt = (l.to - prev) / TOTAL * 100;
  const el = document.createElement('div');
  el.className = 'lay';
  el.style.cssText = `top:${top}%;height:${hgt}%;--c:${l.c};--pat:radial-gradient(rgba(0,0,0,.28) 1px,transparent 1.5px) 0 0/${6 + i}px ${6 + i}px`;
  col.appendChild(el);
  const li = document.createElement('li');
  li.style.cssText = `top:${top}%;height:${hgt}%`;
  li.innerHTML = `<div>${l.n}<small>${l.s}</small></div>`;
  names.appendChild(li);
  prev = l.to;
});
for (let m = 0; m <= TOTAL; m += 2) {
  const s = document.createElement('span');
  s.style.top = (m / TOTAL * 100) + '%';
  s.textContent = m;
  ruler.appendChild(s);
}
const sptLine = $('#sptLine'), dEl = $('#logDepth'), nEl = $('#logN'), stEl = $('#logStatus');
const sptPts = SPT.map((n, i) => [Math.min(n, 50) / 50 * 96 + 2, (i + 1) / TOTAL * 300]);
const nameEls = $$('li', names);
function setDepth(z) {
  rod.style.height = (z / TOTAL * 100) + '%';
  dEl.textContent = fmt(z);
  const k = Math.floor(z);
  const pts = [[sptPts[0][0], 0], ...sptPts.slice(0, Math.max(0, k))];
  if (k < TOTAL && k > 0) {
    const a = sptPts[k - 1], b = sptPts[k], t = z - k;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  sptLine.setAttribute('points', pts.map(p => p.join(',')).join(' '));
  nEl.textContent = k > 0 ? (SPT[k - 1] >= 50 ? '50/12' : SPT[k - 1]) : 0;
  let acc = 0;
  LAYERS.forEach((l, i) => { nameEls[i].classList.toggle('on', z > acc); acc = l.to; });
  const done = z >= TOTAL;
  stEl.textContent = done ? 'Impenetrável' : 'Avançando';
  stEl.classList.toggle('done', done);
}
let logStart = null, logVisible = true;
function runLog(t) {
  if (!logStart) logStart = t;
  const el = (t - logStart) / 1000;
  const cycle = 9.5;
  const p = (el % cycle) / 7.5;
  const z = Math.min(1, p);
  const eased = z < 1 ? 1 - Math.pow(1 - z, 1.6) : 1;
  setDepth(eased * TOTAL);
  if (logVisible) requestAnimationFrame(runLog);
}
if (reduce) setDepth(TOTAL);
else new IntersectionObserver(([e]) => {
  const was = logVisible;
  logVisible = e.isIntersecting;
  if (logVisible && !was) { logStart = null; requestAnimationFrame(runLog); }
}).observe($('#log'));
if (!reduce) requestAnimationFrame(runLog);

/* ---------- counters ---------- */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const to = +e.target.dataset.count, pre = e.target.dataset.prefix || '';
  if (reduce) return;
  const t0 = performance.now();
  const tick = t => {
    const p = Math.min(1, (t - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
    e.target.textContent = pre + v;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: .6 });
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- reveal ---------- */
const rio = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
}), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => rio.observe(el));

/* ---------- services descent ---------- */
const svs = $$('.sv'), strata = $$('#svcStrata .st'), bit = $('#svcBit'), depthEl = $('#svcDepth');
const svcList = $('.svc-list');
const DEPTH_MAX = 30;
function svcUpdate() {
  const vh = innerHeight, mid = vh * .5;
  let cur = 0;
  svs.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) cur = i; });
  svs.forEach((s, i) => s.classList.toggle('on', i === cur));
  strata.forEach((s, i) => { s.classList.toggle('on', i === cur); s.classList.toggle('past', i < cur); });
  const r = svcList.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (mid - r.top) / (r.height - vh * .3)));
  bit.style.height = (p * 100) + '%';
  depthEl.textContent = Math.round(p * DEPTH_MAX);
}

/* ---------- reels ---------- */
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) {
    if (!v.src) v.src = v.dataset.src;
    if (!reduce) v.play().catch(() => {});
  } else v.pause();
}), { rootMargin: '200px 0px' });
$$('.clip video').forEach(v => vio.observe(v));

/* ---------- works filter + lightbox ---------- */
const wks = $$('.wk');
$$('.works-filter button').forEach(b => b.addEventListener('click', () => {
  $$('.works-filter button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  const f = b.dataset.f;
  wks.forEach(w => w.classList.toggle('off', f !== 'all' && w.dataset.c !== f));
}));
const lb = document.createElement('div');
lb.className = 'lb';
lb.innerHTML = '<button aria-label="Fechar">×</button><img alt=""><p></p>';
document.body.appendChild(lb);
const closeLb = () => lb.classList.remove('open');
lb.addEventListener('click', e => { if (e.target !== $('img', lb)) closeLb(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
wks.forEach(w => w.addEventListener('click', () => {
  const img = $('img', w);
  $('img', lb).src = img.src;
  $('img', lb).alt = img.alt;
  $('p', lb).textContent = $('figcaption', w).lastChild.textContent;
  lb.classList.add('open');
}));

/* ---------- units / map ---------- */
const UNITS = {
  belem: { x: 252, y: 72, name: 'Belém', uf: 'PA · Matriz', addr: ['Av. Gov. José Malcher, 168, sala 110, Nazaré, 66035-065', 'Pátio: Rodovia Mário Covas, 500, Coqueiro, 66650-000'], tel: ['(91) 3039-7200', '(91) 98116-0679', '(91) 99349-2626'], mail: ['contato@fnengenharia.eng.br'] },
  manaus: { x: 140, y: 89, name: 'Manaus', uf: 'AM', addr: ['R. da Floresta, 32, Tarumã-açu, 69058-832'], tel: ['(92) 99370-3336', '(92) 99212-0945', '(92) 99983-6186'], mail: ['contato@fnengenharia.eng.br'] },
  saoluis: { x: 293, y: 83, name: 'São Luís', uf: 'MA', addr: ['Rua Tremembés, 17, Quadra 11, Calhau, 65071-485'], tel: ['(98) 3011-9858', '(98) 99971-2347'], mail: ['contato@fnengenharia.eng.br'] },
  salvador: { x: 349, y: 188, name: 'Salvador', uf: 'BA', addr: ['Av. Tancredo Neves, 2539, CEO Salvador Shopping, sala 1015, Caminho das Árvores'], tel: ['(71) 98256-1910', '(71) 98262-2172'], mail: ['comercialbafnengenharia@gmail.com', 'gestaobafnengenharia@gmail.com'] },
  bh: { x: 296, y: 257, name: 'Belo Horizonte', uf: 'MG', addr: ['Rua Guaicuí, 20, sala 1002, Coração de Jesus'], tel: ['(91) 98116-0679', '(91) 99349-2626'], mail: ['contato@fnengenharia.eng.br'] },
  vitoria: { x: 331, y: 261, name: 'Vitória', uf: 'ES', addr: ['Rua Neves Armond, 210, sala 607, Newport Center'], tel: ['(91) 99984-0640', '(91) 99349-2626'], mail: ['contato@fnengenharia.eng.br'] },
  sp: { x: 270, y: 294, name: 'São Paulo', uf: 'SP', addr: ['Rua Alvarenga, 797, sala 03A, Butantã'], tel: ['(11) 98383-7648'], mail: ['gestaospfnengenharia@gmail.com'] }
};
const DOTS = '136,13 107,23 116,23 126,23 136,23 223,23 107,33 116,33 126,33 136,33 213,33 223,33 49,43 58,43 68,43 107,43 116,43 126,43 136,43 146,43 165,43 175,43 184,43 194,43 204,43 213,43 223,43 233,43 49,53 58,53 68,53 78,53 87,53 97,53 107,53 116,53 126,53 136,53 146,53 155,53 165,53 175,53 184,53 194,53 204,53 213,53 223,53 49,63 58,63 68,63 78,63 87,63 97,63 107,63 116,63 126,63 136,63 146,63 155,63 165,63 175,63 184,63 194,63 204,63 213,63 223,63 233,63 243,63 252,63 58,73 68,73 78,73 87,73 97,73 107,73 116,73 126,73 136,73 146,73 155,73 165,73 175,73 184,73 194,73 204,73 223,73 233,73 243,73 262,73 272,73 281,73 49,83 58,83 68,83 78,83 87,83 97,83 107,83 116,83 126,83 136,83 146,83 155,83 165,83 175,83 184,83 194,83 204,83 213,83 223,83 233,83 252,83 262,83 272,83 281,83 49,93 58,93 68,93 78,93 87,93 97,93 107,93 116,93 126,93 136,93 146,93 155,93 165,93 175,93 184,93 194,93 204,93 213,93 223,93 233,93 243,93 252,93 262,93 272,93 281,93 291,93 301,93 310,93 320,93 330,93 340,93 29,103 39,103 49,103 58,103 68,103 78,103 87,103 97,103 107,103 116,103 126,103 136,103 146,103 155,103 165,103 175,103 184,103 194,103 204,103 213,103 223,103 233,103 243,103 252,103 262,103 272,103 281,103 291,103 301,103 310,103 320,103 330,103 340,103 349,103 19,113 29,113 39,113 49,113 58,113 68,113 78,113 87,113 97,113 107,113 116,113 126,113 136,113 146,113 155,113 165,113 175,113 184,113 194,113 204,113 213,113 223,113 233,113 243,113 252,113 262,113 272,113 281,113 291,113 301,113 310,113 320,113 330,113 340,113 349,113 359,113 369,113 378,113 19,123 29,123 39,123 49,123 58,123 68,123 78,123 87,123 97,123 107,123 116,123 126,123 136,123 146,123 155,123 165,123 175,123 184,123 194,123 204,123 213,123 223,123 233,123 243,123 252,123 262,123 272,123 281,123 291,123 301,123 310,123 320,123 330,123 340,123 349,123 359,123 369,123 378,123 10,133 19,133 29,133 39,133 49,133 58,133 68,133 78,133 87,133 97,133 107,133 116,133 126,133 136,133 146,133 155,133 165,133 175,133 184,133 194,133 204,133 213,133 223,133 233,133 243,133 252,133 262,133 272,133 281,133 291,133 301,133 310,133 320,133 330,133 340,133 349,133 359,133 369,133 378,133 19,143 29,143 39,143 49,143 58,143 68,143 78,143 87,143 97,143 107,143 116,143 126,143 136,143 146,143 155,143 165,143 175,143 184,143 194,143 204,143 213,143 223,143 233,143 243,143 252,143 262,143 272,143 281,143 291,143 301,143 310,143 320,143 330,143 340,143 349,143 359,143 369,143 378,143 29,153 39,153 49,153 58,153 68,153 78,153 87,153 97,153 107,153 116,153 126,153 136,153 146,153 155,153 165,153 175,153 184,153 194,153 204,153 213,153 223,153 233,153 243,153 252,153 262,153 272,153 281,153 291,153 301,153 310,153 320,153 330,153 340,153 349,153 359,153 369,153 39,163 49,163 58,163 97,163 107,163 116,163 126,163 136,163 146,163 155,163 165,163 175,163 184,163 194,163 204,163 213,163 223,163 233,163 243,163 252,163 262,163 272,163 281,163 291,163 301,163 310,163 320,163 330,163 340,163 349,163 359,163 369,163 97,173 107,173 116,173 126,173 136,173 146,173 155,173 165,173 175,173 184,173 194,173 204,173 213,173 223,173 233,173 243,173 252,173 262,173 272,173 281,173 291,173 301,173 310,173 320,173 330,173 340,173 349,173 359,173 107,183 116,183 126,183 136,183 146,183 155,183 165,183 175,183 184,183 194,183 204,183 213,183 223,183 233,183 243,183 252,183 262,183 272,183 281,183 291,183 301,183 310,183 320,183 330,183 340,183 349,183 126,193 136,193 146,193 155,193 165,193 175,193 184,193 194,193 204,193 213,193 223,193 233,193 243,193 252,193 262,193 272,193 281,193 291,193 301,193 310,193 320,193 330,193 340,193 146,203 155,203 165,203 175,203 184,203 194,203 204,203 213,203 223,203 233,203 243,203 252,203 262,203 272,203 281,203 291,203 301,203 310,203 320,203 330,203 340,203 146,213 155,213 165,213 175,213 184,213 194,213 204,213 213,213 223,213 233,213 243,213 252,213 262,213 272,213 281,213 291,213 301,213 310,213 320,213 330,213 340,213 165,223 175,223 184,223 194,223 204,223 213,223 223,223 233,223 243,223 252,223 262,223 272,223 281,223 291,223 301,223 310,223 320,223 330,223 340,223 165,233 175,233 184,233 194,233 204,233 213,233 223,233 233,233 243,233 252,233 262,233 272,233 281,233 291,233 301,233 310,233 320,233 330,233 340,233 165,243 175,243 184,243 194,243 204,243 213,243 223,243 233,243 243,243 252,243 262,243 272,243 281,243 291,243 301,243 310,243 320,243 330,243 165,253 175,253 184,253 194,253 204,253 213,253 223,253 233,253 243,253 252,253 262,253 272,253 281,253 291,253 301,253 310,253 320,253 330,253 165,263 175,263 184,263 194,263 204,263 213,263 223,263 233,263 243,263 252,263 262,263 272,263 281,263 291,263 301,263 310,263 320,263 330,263 165,273 175,273 184,273 194,273 204,273 213,273 223,273 233,273 243,273 252,273 262,273 272,273 281,273 291,273 301,273 310,273 320,273 184,283 194,283 204,283 213,283 223,283 233,283 243,283 252,283 262,283 272,283 281,283 291,283 301,283 310,283 184,293 194,293 204,293 213,293 223,293 233,293 243,293 252,293 262,293 272,293 281,293 204,303 213,303 223,303 233,303 243,303 252,303 262,303 194,313 204,313 213,313 223,313 233,313 243,313 204,323 213,323 223,323 233,323 243,323 194,333 204,333 213,333 223,333 233,333 243,333 252,333 184,343 194,343 204,343 213,343 223,343 233,343 243,343 175,353 184,353 194,353 204,353 213,353 223,353 233,353 184,363 194,363 204,363 213,363 223,363 233,363 194,373 204,373 213,373 213,383 204,393';
const svg = $('#brMap'), NS = 'http://www.w3.org/2000/svg';
const dots = DOTS.split(' ').map(p => p.split(',').map(Number));
let g = '';
dots.forEach(([x, y]) => { g += `<circle class="d" cx="${x}" cy="${y}" r="2.6"/>`; });
const hq = UNITS.belem;
Object.entries(UNITS).forEach(([k, u]) => {
  if (k !== 'belem') {
    const mx = (hq.x + u.x) / 2, my = (hq.y + u.y) / 2 - 30;
    g += `<path class="route" d="M${hq.x} ${hq.y} Q${mx} ${my} ${u.x} ${u.y}"/>`;
  }
});
Object.entries(UNITS).forEach(([k, u]) => {
  const left = u.x > 300;
  g += `<g class="pin" data-u="${k}"><circle class="r" cx="${u.x}" cy="${u.y}" r="6"/><circle class="c" cx="${u.x}" cy="${u.y}" r="${k === 'belem' ? 6 : 4.5}"/><text x="${left ? u.x - 10 : u.x + 10}" y="${u.y + 3}" text-anchor="${left ? 'end' : 'start'}">${u.name}</text></g>`;
});
svg.innerHTML = g;
const dotEls = $$('circle.d', svg);
const card = $('#unitCard');
const tel = t => `<a href="tel:+55${t.replace(/\D/g, '')}">${t}</a>`;
function selectUnit(k) {
  const u = UNITS[k];
  $$('#units li').forEach(li => li.classList.toggle('on', li.dataset.u === k));
  $$('.pin', svg).forEach(p => p.classList.toggle('on', p.dataset.u === k));
  dotEls.forEach((d, i) => {
    const [x, y] = dots[i];
    d.classList.toggle('lit', Math.hypot(x - u.x, y - u.y) < 34);
  });
  card.innerHTML = `<p class="mono">Unidade ${u.uf}</p><h3>${u.name}</h3>${u.addr.map(a => `<p>${a}</p>`).join('')}<p>${u.tel.map(tel).join(' · ')}</p><p>${u.mail.map(m => `<a href="mailto:${m}">${m}</a>`).join('<br>')}</p><div class="unit-tabs">${Object.entries(UNITS).map(([kk, uu]) => `<button data-u="${kk}" class="${kk === k ? 'on' : ''}">${uu.name}</button>`).join('')}</div>`;
}
$$('#units li').forEach(li => li.addEventListener('click', () => selectUnit(li.dataset.u)));
$$('.pin', svg).forEach(p => p.addEventListener('click', () => selectUnit(p.dataset.u)));
card.addEventListener('click', e => { const b = e.target.closest('button[data-u]'); if (b) selectUnit(b.dataset.u); });
selectUnit('belem');

/* ---------- form -> WhatsApp ---------- */
const WA = '559131178484';
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  const err = $('#formErr');
  if (!d.nome.trim() || !d.local.trim()) { err.hidden = false; return; }
  err.hidden = true;
  const msg = [
    'Olá, FN Engenharia! Gostaria de falar sobre uma obra.',
    '',
    `*Nome:* ${d.nome.trim()}`,
    d.empresa.trim() && `*Empresa:* ${d.empresa.trim()}`,
    `*Local da obra:* ${d.local.trim()}`,
    `*Serviço:* ${d.servico}`,
    d.msg.trim() && `*Sobre a obra:* ${d.msg.trim()}`
  ].filter(x => x !== '' && x !== false).join('\n');
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

/* ---------- scroll loop ---------- */
let lastY = scrollY, ticking = false;
function onScroll() {
  const y = scrollY;
  hd.classList.toggle('scrolled', y > 30);
  hd.classList.toggle('hide', y > lastY && y > 600 && !document.body.classList.contains('menu-open'));
  lastY = y;
  const probe = hd.offsetHeight * .5;
  let mode = 'dark';
  for (const z of zones) {
    const r = z.getBoundingClientRect();
    if (r.top <= probe && r.bottom > probe) { mode = z.dataset.hd; break; }
  }
  hd.classList.toggle('light', mode === 'light');
  svcUpdate();
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', () => { drawTopo(); onScroll(); });
onScroll();

$('#yr').textContent = new Date().getFullYear();
requestAnimationFrame(() => document.body.classList.add('ready'));
})();
