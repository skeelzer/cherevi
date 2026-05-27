// ── APP.JS — Main application ─────────────────────────────────────────────────

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function autoCheck(userAns, correctAns) {
  const u = normalize(userAns), c = normalize(correctAns);
  if (u === c) return 'correct';

  // Format circulaire : "insigne sur Matiere couleur pour filiere"
  const surIdx = c.indexOf(' sur ');
  const pourIdx = c.indexOf(' pour ');
  if (surIdx !== -1 && pourIdx !== -1) {
    const insigne = c.slice(0, surIdx).trim();
    const matCoul = c.slice(surIdx + 5, pourIdx).trim();
    const filiere = c.slice(pourIdx + 6).trim();
    const found = [insigne, matCoul, filiere].filter(p => u.includes(p)).length;
    if (found === 3) return 'correct';
    if (found === 2) return 'partial';
    const kw = c.split(' ').filter(w => w.length > 4);
    return kw.filter(w => u.includes(w)).length >= Math.ceil(kw.length * 0.6) ? 'partial' : 'wrong';
  }

  // Standard
  const words = c.split(' ').filter(w => w.length > 4);
  if (!words.length) return u.length > 1 && c.includes(u) ? 'partial' : 'wrong';
  const matched = words.filter(w => u.includes(w)).length;
  if (matched >= Math.ceil(words.length * 0.65)) return 'partial';
  return 'wrong';
}
// ── Badge SVG helpers ────────────────────────────────────────────────────────
function getBadgeSVG(qid) {
  if (!qid) return null;
  var base = String(qid).replace(/_[rim]$/, '');
  var key = (typeof BADGE_MAP !== 'undefined') ? BADGE_MAP[base] : null;
  if (!key || !BADGE_SVG[key]) return null;
  return BADGE_SVG[key];
}
function renderBadgeHTML(qid, size) {
  var svg = getBadgeSVG(qid);
  if (!svg) return '';
  var s = size || 72;
  return '<div class="badge-img" style="width:' + s + 'px;height:' + s + 'px;margin:0.5rem auto">' + svg + '</div>';
}


function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function pct(c, p, w) {
  const t = c + p + w;
  return t ? Math.round(((c + p * 0.5) / t) * 100) : 0;
}

function emoji(p) { return p >= 80 ? '🏆' : p >= 60 ? '📚' : '💪'; }

// ── State ─────────────────────────────────────────────────────────────────────
const STATE = {
  screen: 'home',   // home | quiz | results | history | stats | songs | recit
  questions: [],
  idx: 0,
  revealed: false,
  userInput: '',
  answerStatus: null,
  sessionScore: { correct: 0, partial: 0, wrong: 0 },
  sessionHistory: [],
  qstats: {},
  sessions: [],
  filterSrc: 'ALL',
  filterCat: 'ALL',
  filterMode: 'normal', // normal | weak
  sessionSize: 20,
  loading: false,
};

const CATS = ['ALL', ...Array.from(new Set(ALL_QUESTIONS.map(q => q.cat)))];
const SRC_COLORS = { NATIONAL: '#5a9fd4', IPP: '#e8a030', BOTH: '#90d050' };
const CAT_COLORS = {
  'Histoire':'#7a3300','Règles':'#2a5a2a','Structure':'#3a2a6a',
  'Circulaire velours':'#6a0000','Circulaire satin':'#003a7a',
  'Cursus':'#1a4a1a','Insignes perso':'#4a3a00','Insignes partenaire':'#5a005a',
  'Insignes GM':'#5a4a00','Insignes régionaux':'#004a2a','Velours/Rubans':'#2a2a5a',
  'Types de faluche':'#4a2a00','Potager':'#1a4a3a','GM & GC':'#5a2a00',
  'Baptême':'#4a001a','Parrains':'#00304a','Honoris Causa':'#3a3000',
  'Grands Singes':'#2a2a2a','Archivistes':'#003a4a',
};

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
function el(tag, cls, html, attrs) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (attrs) Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
  return e;
}

// ── Render engine ─────────────────────────────────────────────────────────────
function render() {
  const app = $('app');
  app.innerHTML = '';

  // Nav bar (always shown except quiz)
  if (STATE.screen !== 'quiz') {
    const nav = el('div', 'nav');
    nav.innerHTML = `
      <span class="nav-title">🎓 Faluche</span>
      <span id="syncIndicator" class="sync-indicator"></span>
      <div class="nav-tabs">
        <button class="nav-btn ${STATE.screen==='home'?'active':''}" data-screen="home">Quiz</button>
        <button class="nav-btn ${STATE.screen==='recit'?'active':''}" data-screen="recit">Récit</button>
        <button class="nav-btn ${STATE.screen==='songs'?'active':''}" data-screen="songs">Chants</button>
        <button class="nav-btn ${STATE.screen==='history'?'active':''}" data-screen="history">Historique</button>
        <button class="nav-btn ${STATE.screen==='stats'?'active':''}" data-screen="stats">Stats</button>
        <button class="nav-btn ${STATE.screen==='account'?'active':''}" data-screen="account">${AUTH.isLoggedIn()?'👤':'🔑'}</button>
      </div>`;
    nav.querySelectorAll('[data-screen]').forEach(b =>
      b.addEventListener('click', () => { STATE.screen = b.dataset.screen; render(); }));
    app.appendChild(nav);
  }

  const main = el('div', 'main');
  app.appendChild(main);

  if (STATE.screen === 'home') renderHome(main);
  else if (STATE.screen === 'quiz') renderQuiz(main);
  else if (STATE.screen === 'results') renderResults(main);
  else if (STATE.screen === 'history') renderHistory(main);
  else if (STATE.screen === 'stats') renderStats(main);
  else if (STATE.screen === 'songs') renderSongs(main);
  else if (STATE.screen === 'recit') renderRecit(main);
  else if (STATE.screen === 'account') renderAccount(main);
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function renderHome(main) {
  const pool = filteredPool();

  main.innerHTML = `
    <div class="home-wrap">
      <div class="home-title">Code de la Faluche</div>
      <div class="home-sub">${ALL_QUESTIONS.length} questions — Code National + IPP</div>

      <div class="card">
        <div class="section-label">Source</div>
        <div class="chip-row">
          ${['ALL','NATIONAL','IPP','BOTH'].map(s =>
            `<button class="chip ${STATE.filterSrc===s?'chip-active':''}" data-src="${s}">${s==='ALL'?'Tous':s==='BOTH'?'Les deux':s}</button>`
          ).join('')}
        </div>
        <div class="section-label mt">Catégorie</div>
        <select class="sel" id="catsel">
          ${CATS.map(c => `<option value="${c}" ${STATE.filterCat===c?'selected':''}>${c==='ALL'?'Toutes les catégories':c}</option>`).join('')}
        </select>
        <div class="section-label mt">Mode</div>
        <div class="chip-row">
          <button class="chip ${STATE.filterMode==='normal'?'chip-active':''}" data-mode="normal">Normal</button>
          <button class="chip ${STATE.filterMode==='weak'?'chip-active':''}" data-mode="weak">⚠️ Points faibles</button>
        </div>
        <div class="pool-count">${pool.length} question${pool.length>1?'s':''} dans ce filtre</div>
      </div>

      <div class="card">
        <div class="section-label">Nombre de questions</div>
        <div class="chip-row">
          ${[10,20,30,50,'Tout'].map(n => {
            const sz = n==='Tout' ? pool.length : Math.min(n, pool.length);
            return `<button class="chip chip-size" data-size="${sz}">${n==='Tout'?`Tout (${pool.length})`:n>pool.length?`Tout (${pool.length})`:n}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="src-legend">
        <span><span style="color:#5a9fd4">●</span> National</span>
        <span><span style="color:#e8a030">●</span> IPP</span>
        <span><span style="color:#90d050">●</span> Les deux</span>
      </div>
    </div>`;

  main.querySelectorAll('[data-src]').forEach(b =>
    b.addEventListener('click', () => { STATE.filterSrc = b.dataset.src; render(); }));
  main.querySelector('#catsel').addEventListener('change', e => { STATE.filterCat = e.target.value; render(); });
  main.querySelectorAll('[data-mode]').forEach(b =>
    b.addEventListener('click', () => { STATE.filterMode = b.dataset.mode; render(); }));
  main.querySelectorAll('[data-size]').forEach(b =>
    b.addEventListener('click', () => startSession(parseInt(b.dataset.size))));
}

function filteredPool() {
  let pool = ALL_QUESTIONS;
  if (STATE.filterSrc !== 'ALL') pool = pool.filter(q => q.src === STATE.filterSrc);
  if (STATE.filterCat !== 'ALL') pool = pool.filter(q => q.cat === STATE.filterCat);
  if (STATE.filterMode === 'weak') {
    pool = pool.filter(q => {
      const s = STATE.qstats[q.id];
      if (!s || !s.seen) return true; // unseen = weak
      return (s.wrong / s.seen) >= 0.4;
    });
    if (!pool.length) pool = ALL_QUESTIONS; // fallback
  }
  return pool;
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
async function startSession(size) {
  STATE.qstats = await getAllQStats();
  let pool = filteredPool();

  // 1. Assign each question a random sort key, biased by stats.
  //    Base is always Math.random() → true randomness.
  //    Bias nudges weak/unseen questions upward, but never deterministically.
  const weighted = pool.map(q => {
    const s = STATE.qstats[q.id] || { seen: 0, wrong: 0, correct: 0 };
    const seen = s.seen || 0;
    const wrongRate  = seen ? (s.wrong  || 0) / seen : 0;
    const correctRate= seen ? (s.correct|| 0) / seen : 0;
    const bias = (seen === 0 ? 0.35 : 0) + wrongRate * 0.4 - correctRate * 0.15;
    return { q, key: Math.random() + Math.min(Math.max(bias, -0.3), 0.5) };
  });

  // 2. Sort descending — highest key = most likely to be picked
  weighted.sort((a, b) => b.key - a.key);

  // 3. Take top `size`, then Fisher-Yates the subset so order is fully random
  const top = weighted.slice(0, size).map(x => x.q);
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }

  STATE.questions = top.length ? top : shuffle(filteredPool()).slice(0, size);
  STATE.idx = 0;
  STATE.revealed = false;
  STATE.userInput = '';
  STATE.answerStatus = null;
  STATE.sessionScore = { correct: 0, partial: 0, wrong: 0 };
  STATE.sessionHistory = [];
  STATE.screen = 'quiz';
  render();
  setTimeout(() => { const ta = document.querySelector('textarea'); if (ta) ta.focus(); }, 100);
}

function renderQuiz(main) {
  const q = STATE.questions[STATE.idx];
  const progress = (STATE.idx / STATE.questions.length) * 100;
  const catColor = CAT_COLORS[q.cat] || '#333';
  const srcColor = SRC_COLORS[q.src] || '#aaa';
  const qtext = q.q.replace(/^\[.*?\]\s*/, '');
  const s = STATE.sessionScore;
  const total = s.correct + s.partial + s.wrong;
  const p = total ? pct(s.correct, s.partial, s.wrong) : null;

  main.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-topbar">
        <button class="back-btn" id="quitBtn">✕</button>
        <div class="prog-info">${STATE.idx+1} / ${STATE.questions.length}${p!==null?' · '+p+'%':''}</div>
        <div class="score-mini">✓${s.correct} ~${s.partial} ✗${s.wrong}</div>
      </div>

      <div class="prog-bar-wrap"><div class="prog-bar" style="width:${progress}%"></div></div>

      <div class="quiz-card" style="border-left-color:${catColor}">
        <div class="badge-row">
          <span class="badge" style="color:${srcColor};border-color:${srcColor}55;background:${srcColor}15">${q.src}</span>
          <span class="badge" style="color:#c9a96e;border-color:#c9a96e44;background:#c9a96e10">${q.cat}</span>
        </div>

        <div class="question-text">${qtext}</div>

        ${renderBadgeHTML(q.id)}

        ${!STATE.revealed ? `
          <textarea class="answer-input" id="answerTA" placeholder="Ta réponse... (Entrée pour valider)" rows="3">${STATE.userInput}</textarea>
          <div class="btn-row">
            <button class="btn-primary" id="submitBtn">Valider</button>
            <button class="btn-ghost" id="skipBtn">Passer</button>
          </div>
        ` : `
          ${STATE.userInput ? `
            <div class="answer-box user-answer" style="border-color:${STATE.answerStatus==='correct'?'#2a5a2a':STATE.answerStatus==='partial'?'#5a4000':'#5a0000'}">
              <div class="answer-label">Ta réponse</div>
              <div style="color:${STATE.answerStatus==='correct'?'#80d060':STATE.answerStatus==='partial'?'#d0a040':'#e06060'}">${STATE.userInput}</div>
            </div>` : ''}
          <div class="answer-box correct-answer">
            <div class="answer-label">Réponse attendue</div>
            <div style="color:#a0d080">${q.a}</div>
          </div>
          <div class="judge-label">Corriger l'évaluation :</div>
          <div class="judge-row">
            <button class="judge-btn correct" id="j_correct">✓ Correct</button>
            <button class="judge-btn partial" id="j_partial">~ Partiel</button>
            <button class="judge-btn wrong" id="j_wrong">✗ Raté</button>
          </div>
        `}
      </div>
    </div>`;

  $('quitBtn').addEventListener('click', () => {
    if (confirm('Quitter la session en cours ?')) { STATE.screen = 'home'; render(); }
  });

  if (!STATE.revealed) {
    const ta = $('answerTA');
    ta.addEventListener('input', e => { STATE.userInput = e.target.value; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
    });
    $('submitBtn').addEventListener('click', submitAnswer);
    $('skipBtn').addEventListener('click', () => { STATE.revealed = true; STATE.answerStatus = 'wrong'; render(); });
  } else {
    ['correct','partial','wrong'].forEach(r => {
      $(('j_'+r)).addEventListener('click', () => nextQuestion(r));
    });
  }
}

function submitAnswer() {
  const ta = $('answerTA');
  STATE.userInput = ta ? ta.value.trim() : STATE.userInput;
  if (!STATE.userInput) { STATE.revealed = true; STATE.answerStatus = 'wrong'; render(); return; }
  STATE.answerStatus = autoCheck(STATE.userInput, STATE.questions[STATE.idx].a);
  STATE.revealed = true;
  render();
}

async function nextQuestion(result) {
  const q = STATE.questions[STATE.idx];
  STATE.sessionScore[result]++;
  STATE.sessionHistory.push({ q, userAnswer: STATE.userInput, result });
  await updateQStat(q.id, result);
  if (typeof SYNC !== 'undefined') SYNC.markDirty();

  if (STATE.idx + 1 >= STATE.questions.length) {
    // Save session
    const sc = STATE.sessionScore;
    if (typeof SYNC!=='undefined') SYNC.markDirty();
    await saveSession({
      ts: Date.now(),
      total: STATE.questions.length,
      correct: sc.correct, partial: sc.partial, wrong: sc.wrong,
      score: pct(sc.correct, sc.partial, sc.wrong),
      history: STATE.sessionHistory.map(h => ({ id: h.q.id, result: h.result })),
    });
    STATE.qstats = await getAllQStats();
    STATE.screen = 'results';
    render();
  } else {
    STATE.idx++;
    STATE.revealed = false;
    STATE.userInput = '';
    STATE.answerStatus = null;
    render();
    setTimeout(() => { const ta = document.querySelector('textarea'); if (ta) ta.focus(); }, 80);
  }
}

// ── RESULTS ───────────────────────────────────────────────────────────────────
function renderResults(main) {
  const sc = STATE.sessionScore;
  const p = pct(sc.correct, sc.partial, sc.wrong);
  const total = sc.correct + sc.partial + sc.wrong;
  const wrongs = STATE.sessionHistory.filter(h => h.result !== 'correct');

  main.innerHTML = `
    <div class="results-wrap">
      <div class="result-emoji">${emoji(p)}</div>
      <div class="result-pct" style="color:${p>=80?'#4CAF50':p>=60?'#FF9800':'#f44336'}">${p}%</div>
      <div class="result-detail">✓ ${sc.correct} correctes &nbsp;·&nbsp; ~ ${sc.partial} partielles &nbsp;·&nbsp; ✗ ${sc.wrong} ratées</div>

      ${wrongs.length ? `
        <div class="section-label mt" style="color:#FF9800">⚠️ À retravailler (${wrongs.length})</div>
        <div class="wrongs-list">
          ${wrongs.map(h => `
            <div class="wrong-item" style="border-color:${h.result==='partial'?'#5a4000':'#5a0000'}">
              <div class="wrong-src">[${h.q.src}] ${h.q.cat}</div>
              ${renderBadgeHTML(h.q.id, 44)}<div class="wrong-q">${h.q.q.replace(/^\[.*?\]\s*/, '')}</div>
              ${h.userAnswer ? `<div class="wrong-user">« ${h.userAnswer} »</div>` : ''}
              <div class="wrong-a">✓ ${h.q.a}</div>
            </div>`).join('')}
        </div>` : `<div class="perfect">🎯 Parfait ! Aucune erreur.</div>`}

      <div class="btn-col mt">
        <button class="btn-primary" id="againBtn">Recommencer (${total} q.)</button>
        <button class="btn-ghost" id="weakBtn">⚠️ Refaire les ratées</button>
        <button class="btn-ghost" id="homeBtn">Accueil</button>
      </div>
    </div>`;

  $('againBtn').addEventListener('click', () => startSession(total));
  $('weakBtn').addEventListener('click', () => {
    STATE.filterMode = 'weak'; STATE.filterSrc = 'ALL'; STATE.filterCat = 'ALL';
    startSession(Math.max(wrongs.length, 10));
  });
  $('homeBtn').addEventListener('click', () => { STATE.screen = 'home'; render(); });
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
async function renderHistory(main) {
  if (STATE.loading) { main.innerHTML = '<div class="loading">Chargement…</div>'; return; }
  STATE.loading = true;
  const sessions = await getSessions(30);
  STATE.loading = false;

  if (!sessions.length) {
    main.innerHTML = '<div class="empty">Aucune session encore.<br>Lance ton premier quiz !</div>';
    return;
  }

  const avgScore = Math.round(sessions.reduce((a,s) => a + s.score, 0) / sessions.length);
  const totalQ = sessions.reduce((a, s) => a + s.total, 0);

  main.innerHTML = `
    <div class="hist-wrap">
      <div class="hist-summary">
        <div class="hist-stat"><div class="hist-stat-n">${sessions.length}</div><div class="hist-stat-l">Sessions</div></div>
        <div class="hist-stat"><div class="hist-stat-n">${totalQ}</div><div class="hist-stat-l">Questions</div></div>
        <div class="hist-stat"><div class="hist-stat-n" style="color:${avgScore>=80?'#4CAF50':avgScore>=60?'#FF9800':'#f44336'}">${avgScore}%</div><div class="hist-stat-l">Moy.</div></div>
      </div>

      <div class="hist-list">
        ${sessions.map(s => {
          const p = s.score;
          return `
          <div class="hist-item">
            <div class="hist-item-left">
              <div class="hist-score" style="color:${p>=80?'#4CAF50':p>=60?'#FF9800':'#f44336'}">${emoji(p)} ${p}%</div>
              <div class="hist-date">${fmt(s.ts)}</div>
            </div>
            <div class="hist-item-right">
              <div>${s.total} questions</div>
              <div style="color:#666;font-size:0.75rem">✓${s.correct} ~${s.partial} ✗${s.wrong}</div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <button class="btn-ghost btn-danger mt" id="clearBtn">🗑 Effacer l'historique</button>
    </div>`;

  $('clearBtn').addEventListener('click', async () => {
    if (confirm('Effacer tout l\'historique des sessions ?')) {
      await clearSessions();
      render();
    }
  });
}

// ── STATS ─────────────────────────────────────────────────────────────────────
async function renderStats(main) {
  STATE.loading = true;
  STATE.qstats = await getAllQStats();
  STATE.loading = false;

  const allSeen = ALL_QUESTIONS.filter(q => STATE.qstats[q.id]?.seen > 0);
  const allUnseen = ALL_QUESTIONS.filter(q => !STATE.qstats[q.id]?.seen);

  // Worst questions
  const withStats = allSeen.map(q => {
    const s = STATE.qstats[q.id];
    return { q, s, wrongRate: s.wrong / s.seen };
  }).sort((a,b) => b.wrongRate - a.wrongRate);

  const worst = withStats.slice(0, 10);

  // Per category
  const catStats = {};
  CATS.filter(c => c !== 'ALL').forEach(cat => {
    const qs = ALL_QUESTIONS.filter(q => q.cat === cat);
    const seen = qs.filter(q => STATE.qstats[q.id]?.seen > 0);
    if (!seen.length) { catStats[cat] = null; return; }
    const tc = seen.reduce((a,q) => a + (STATE.qstats[q.id].correct||0), 0);
    const tp = seen.reduce((a,q) => a + (STATE.qstats[q.id].partial||0), 0);
    const tw = seen.reduce((a,q) => a + (STATE.qstats[q.id].wrong||0), 0);
    catStats[cat] = { p: pct(tc,tp,tw), seen: seen.length, total: qs.length };
  });

  main.innerHTML = `
    <div class="stats-wrap">
      <div class="stats-overview">
        <div class="hist-stat"><div class="hist-stat-n">${allSeen.length}/${ALL_QUESTIONS.length}</div><div class="hist-stat-l">Vues</div></div>
        <div class="hist-stat"><div class="hist-stat-n">${allUnseen.length}</div><div class="hist-stat-l">Jamais vues</div></div>
      </div>

      <div class="section-label mt">Par catégorie</div>
      <div class="cat-bars">
        ${CATS.filter(c=>c!=='ALL').map(cat => {
          const s = catStats[cat];
          if (!s) return `<div class="cat-bar-item"><div class="cat-bar-name">${cat}</div><div class="cat-bar-none">Jamais vue</div></div>`;
          const col = s.p>=80?'#4CAF50':s.p>=60?'#FF9800':'#f44336';
          return `
            <div class="cat-bar-item">
              <div class="cat-bar-top">
                <span class="cat-bar-name">${cat}</span>
                <span style="color:${col};font-size:0.8rem">${s.p}% (${s.seen}/${s.total})</span>
              </div>
              <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${s.p}%;background:${col}"></div></div>
            </div>`;
        }).join('')}
      </div>

      ${worst.length ? `
        <div class="section-label mt">⚠️ Pires questions (${worst.length})</div>
        <div class="worst-list">
          ${worst.map(({q,s,wrongRate}) => `
            <div class="worst-item">
              <div class="worst-meta">${q.src} · ${q.cat} · ✗ ${Math.round(wrongRate*100)}% (${s.seen} fois)</div>
              ${renderBadgeHTML(q.id, 40)}<div class="worst-q">${q.q.replace(/^\[.*?\]\s*/,'')}</div>
              <div class="worst-a">${q.a}</div>
            </div>`).join('')}
        </div>` : ''}

      <button class="btn-ghost btn-danger mt" id="resetStatsBtn">🗑 Remettre les stats à zéro</button>
    </div>`;

  $('resetStatsBtn').addEventListener('click', async () => {
    if (confirm('Effacer toutes les statistiques de questions ?')) {
      await resetAllStats();
      STATE.qstats = {};
      render();
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await openDB();
  // Load saved auth session
  if (typeof AUTH !== 'undefined') {
    await AUTH.load();
    if (AUTH.isLoggedIn()) {
      // Verify token still valid, refresh if needed
      const user = await SB.getUser().catch(() => null);
      if (!user || user.error) {
        const refreshed = await AUTH.refresh();
        if (!refreshed) { AUTH.user = null; AUTH.token = null; AUTH.save(); }
      }
    }
  }
  STATE.qstats = await getAllQStats();
  STATE.sessions = await getSessions(30);
  render();
  // After first render, pull cloud data if logged in
  if (typeof SYNC !== 'undefined') {
    SYNC.startAutoSync();
    if (AUTH.isLoggedIn() && navigator.onLine) {
      SYNC_STATE.status = 'syncing';
      renderSyncIndicator();
      await SYNC.pull();
      STATE.qstats = await getAllQStats();
      render();
    }
    renderSyncIndicator();
  }
})();

// ── SONGS ─────────────────────────────────────────────────────────────────────
async function renderSongs(main) {
  const songs = await getAllSongs();
  const filterLevel = STATE.songFilterLevel !== undefined ? STATE.songFilterLevel : -1;
  const search = (STATE.songSearch || '').toLowerCase();
  const editingId = STATE.songEditingId || null;

  let pool = songs;
  if (filterLevel >= 0) pool = pool.filter(s => s.level === filterLevel);
  if (search) pool = pool.filter(s => s.title.toLowerCase().includes(search));

  const total = songs.length;
  const mastered   = songs.filter(s => s.level === 4).length;
  const inProgress = songs.filter(s => s.level >= 1 && s.level < 4).length;
  const notStarted = songs.filter(s => s.level === 0).length;

  const progMaster = total ? Math.round(mastered / total * 100) : 0;
  const progInProg = total ? Math.round(inProgress / total * 100) : 0;

  main.innerHTML = \`
    <div class="songs-wrap">

      \${total > 0 ? \`
      <div class="songs-stats-row">
        <div class="songs-stat"><div class="songs-stat-n" style="color:#4CAF50">\${mastered}</div><div class="songs-stat-l">Maîtrisés</div></div>
        <div class="songs-stat"><div class="songs-stat-n" style="color:#FF9800">\${inProgress}</div><div class="songs-stat-l">En cours</div></div>
        <div class="songs-stat"><div class="songs-stat-n" style="color:#555">\${notStarted}</div><div class="songs-stat-l">Non commencé</div></div>
        <div class="songs-stat"><div class="songs-stat-n" style="color:#c9a96e">\${total}</div><div class="songs-stat-l">Total</div></div>
      </div>
      <div class="songs-prog-bg">
        <div class="songs-prog-fill" style="width:\${progMaster}%;background:#4CAF50"></div>
        <div class="songs-prog-fill2" style="width:\${progInProg}%;left:\${progMaster}%;background:#FF9800"></div>
      </div>\` : ''}

      <div class="songs-add-area">
        <input class="search-input" id="newSongInput" placeholder="✚ Nom du chant à ajouter..." autocomplete="off" autocorrect="off"/>
        <button class="btn-primary" id="addSongBtn" style="margin-top:0.5rem">Ajouter</button>
      </div>

      \${total > 0 ? \`
      <div class="songs-filters">
        <input class="search-input" id="songSearch" placeholder="🔍 Rechercher..." value="\${STATE.songSearch || ''}"/>
        <div class="chip-row" style="margin-top:0.5rem">
          <button class="chip \${filterLevel===-1?'chip-active':''}" data-slvl="-1">Tous</button>
          \${LEVELS.map(l => \`<button class="chip \${filterLevel===l.id?'chip-active':''}" data-slvl="\${l.id}" style="\${filterLevel===l.id?'color:'+l.color+';border-color:'+l.color:''}">\${l.icon} \${l.label}</button>\`).join('')}
        </div>
      </div>\` : ''}

      <div class="songs-list" id="songsList">
        \${pool.length === 0 && total === 0 ? \`
          <div class="songs-empty">
            <div style="font-size:2rem;margin-bottom:0.5rem">🎵</div>
            <div style="color:#555;font-size:0.9rem">Aucun chant encore.<br>Ajoute tes paillardes à apprendre !</div>
          </div>\` :
          pool.length === 0 ? '<div class="empty">Aucun chant ne correspond.</div>' :
          pool.map(s => {
            const L = LEVELS[s.level];
            const isEditing = editingId === s.id;
            return \`
            <div class="song-item" data-sid="\${s.id}">
              <div class="song-left">
                \${isEditing
                  ? \`<input class="song-edit-input" id="editInput_\${s.id}" value="\${s.title.replace(/"/g,'&quot;')}" autocomplete="off"/>\`
                  : \`<div class="song-title">\${s.title}</div>\`}
              </div>
              <div class="song-right">
                \${isEditing
                  ? \`<div class="song-edit-btns">
                      <button class="song-edit-save" data-sid="\${s.id}">✓</button>
                      <button class="song-edit-cancel" data-sid="\${s.id}">✕</button>
                      <button class="song-del-btn" data-sid="\${s.id}">🗑</button>
                    </div>\`
                  : \`<div class="level-dots">
                      \${LEVELS.map(l => \`<button class="lvl-dot \${s.level===l.id?'lvl-dot-active':''}" data-sid="\${s.id}" data-lvl="\${l.id}" style="background:\${s.level>=l.id&&l.id>0?l.color:'#222'};border-color:\${l.id>0?l.color:'#333'}" title="\${l.label}"></button>\`).join('')}
                    </div>
                    <div class="song-level-label" style="color:\${L.color}">\${L.icon} \${L.label}</div>
                    <button class="song-edit-btn" data-sid="\${s.id}" title="Renommer">✏️</button>\`}
              </div>
            </div>\`;
          }).join('')}
      </div>

      <div style="height:2rem"></div>
    </div>\`;

  // ── Add song ──
  const newInput = $('newSongInput');
  const doAdd = async () => {
    const title = newInput.value.trim();
    if (!title) return;
    await addSong(title);
    if (typeof SYNC!=='undefined') SYNC.markDirty();
    newInput.value = '';
    STATE.songSearch = '';
    STATE.songFilterLevel = -1;
    await renderSongs(main);
    $('newSongInput') && $('newSongInput').focus();
  };
  newInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
  $('addSongBtn').addEventListener('click', doAdd);

  // ── Search & filter ──
  if ($('songSearch')) {
    $('songSearch').addEventListener('input', e => { STATE.songSearch = e.target.value; renderSongs(main); });
  }
  main.querySelectorAll('[data-slvl]').forEach(b =>
    b.addEventListener('click', () => { STATE.songFilterLevel = parseInt(b.dataset.slvl); renderSongs(main); }));

  // ── Level dots ──
  main.querySelectorAll('.lvl-dot').forEach(b =>
    b.addEventListener('click', async e => {
      e.stopPropagation();
      await updateSongLevel(b.dataset.sid, parseInt(b.dataset.lvl));
      if (typeof SYNC!=='undefined') SYNC.markDirty();
      renderSongs(main);
    }));

  // ── Edit / rename ──
  main.querySelectorAll('.song-edit-btn').forEach(b =>
    b.addEventListener('click', e => {
      e.stopPropagation();
      STATE.songEditingId = b.dataset.sid;
      renderSongs(main);
      const inp = $('editInput_' + b.dataset.sid);
      if (inp) { inp.focus(); inp.select(); }
    }));

  main.querySelectorAll('.song-edit-save').forEach(b =>
    b.addEventListener('click', async e => {
      e.stopPropagation();
      const inp = $('editInput_' + b.dataset.sid);
      if (inp && inp.value.trim()) await updateSongTitle(b.dataset.sid, inp.value);
      STATE.songEditingId = null;
      renderSongs(main);
    }));

  main.querySelectorAll('.song-edit-cancel').forEach(b =>
    b.addEventListener('click', e => {
      e.stopPropagation();
      STATE.songEditingId = null;
      renderSongs(main);
    }));

  main.querySelectorAll('.song-edit-input').forEach(inp =>
    inp.addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        if (inp.value.trim()) await updateSongTitle(inp.dataset ? inp.id.replace('editInput_','') : inp.getAttribute('id').replace('editInput_',''), inp.value);
        STATE.songEditingId = null;
        renderSongs(main);
      }
      if (e.key === 'Escape') { STATE.songEditingId = null; renderSongs(main); }
    }));

  // ── Delete ──
  main.querySelectorAll('.song-del-btn').forEach(b =>
    b.addEventListener('click', async e => {
      e.stopPropagation();
      if (confirm('Supprimer ce chant ?')) {
        await deleteSong(b.dataset.sid);
        if (typeof SYNC!=='undefined') SYNC.markDirty();
        STATE.songEditingId = null;
        renderSongs(main);
      }
    }));
}

// ── RÉCITATION ────────────────────────────────────────────────────────────────
// Build a flat knowledge base of all facts from ALL_QUESTIONS
// for free-form checking
function buildKnowledgeBase() {
  const kb = [];
  for (const q of ALL_QUESTIONS) {
    // Every question/answer pair is a fact
    kb.push({
      question: q.q.replace(/^\[.*?\]\s*/, ''),
      answer: q.a,
      cat: q.cat,
      src: q.src,
      id: q.id,
    });
    // Also index reversed: answer tokens → question
    // For circulaire format "X sur Y pour Z", also index fragments
    const surIdx = q.a.indexOf(' sur ');
    const pourIdx = q.a.indexOf(' pour ');
    if (surIdx !== -1 && pourIdx !== -1) {
      const insigne  = q.a.slice(0, surIdx).trim();
      const matCoul  = q.a.slice(surIdx + 5, pourIdx).trim();
      const filiere  = q.a.slice(pourIdx + 6).trim();
      kb.push({ question: `Circulaire de ${filiere}`, answer: q.a, cat: q.cat, src: q.src, id: q.id + '_r' });
      kb.push({ question: `Insigne de ${filiere}`, answer: insigne, cat: q.cat, src: q.src, id: q.id + '_i' });
      kb.push({ question: `Matière/couleur de ${filiere}`, answer: matCoul, cat: q.cat, src: q.src, id: q.id + '_m' });
    }
  }
  return kb;
}

function findMatchingFacts(input) {
  const kb = buildKnowledgeBase();
  const u = normalize(input);
  const results = [];

  for (const fact of kb) {
    const a = normalize(fact.answer);
    const q = normalize(fact.question);

    // Score: how much of the user input matches this fact
    let score = 0;
    let matchType = null;

    // Direct answer match
    if (u === a) { score = 1.0; matchType = 'exact'; }
    else if (a.includes(u) && u.length > 5) { score = 0.85; matchType = 'contained'; }
    else if (u.includes(a) && a.length > 5) { score = 0.8;  matchType = 'extended'; }
    else {
      // Keyword overlap on answer
      const aWords = a.split(' ').filter(w => w.length > 4);
      const uWords = u.split(' ').filter(w => w.length > 4);
      if (aWords.length > 0) {
        const hit = aWords.filter(w => u.includes(w)).length;
        const rev = uWords.filter(w => a.includes(w)).length;
        const ratio = (hit + rev * 0.5) / (aWords.length + uWords.length * 0.5 || 1);
        if (ratio >= 0.5) { score = ratio * 0.75; matchType = 'keyword'; }
      }
      // Keyword overlap on question (user might be stating the question)
      const qWords = q.split(' ').filter(w => w.length > 4);
      if (qWords.length > 0) {
        const hit = qWords.filter(w => u.includes(w)).length / qWords.length;
        if (hit >= 0.6) { score = Math.max(score, hit * 0.5); matchType = matchType || 'question'; }
      }
    }

    if (score > 0.3) results.push({ ...fact, score, matchType });
  }

  return results.sort((a,b) => b.score - a.score).slice(0, 5);
}

function recitCheck(input) {
  if (!input.trim()) return null;
  const matches = findMatchingFacts(input);
  if (!matches.length) return { status: 'unknown', matches: [] };

  const best = matches[0];
  let status;
  if (best.score >= 0.85) status = 'correct';
  else if (best.score >= 0.5) status = 'partial';
  else status = 'close';

  return { status, matches, best };
}

function renderRecit(main) {
  const history = STATE.recitHistory || [];

  main.innerHTML = `
    <div class="recit-wrap">
      <div class="recit-header">
        <div class="recit-title">Mode Récitation</div>
        <div class="recit-sub">Énonce n'importe quel fait, insigne, circulaire…<br>L'app vérifie si c'est juste.</div>
      </div>

      <div class="recit-examples">
        <div class="recit-ex-label">Exemples :</div>
        <div class="recit-ex-list">
          <button class="recit-ex-btn" data-ex="Médecine : Caducée médecine sur Velours rouge">Circulaire médecine</button>
          <button class="recit-ex-btn" data-ex="Le chameau à l'endroit signifie célibataire">Insigne chameau</button>
          <button class="recit-ex-btn" data-ex="La faluche a été officialisée le 20 décembre 1888">Date création</button>
          <button class="recit-ex-btn" data-ex="Une tortue décernée par un GM signifie grand hébergeur">Insigne GM</button>
        </div>
      </div>

      <div class="recit-input-area">
        <textarea class="answer-input" id="recitInput" placeholder="Énonce un fait…" rows="3">${STATE.recitInput || ''}</textarea>
        <div class="btn-row">
          <button class="btn-primary" id="recitCheckBtn">Vérifier ✓</button>
          <button class="btn-ghost" id="recitClearBtn">Effacer</button>
        </div>
      </div>

      ${STATE.recitResult ? renderRecitResult(STATE.recitResult) : ''}

      ${history.length > 0 ? `
        <div class="section-label mt">Historique de la session (${history.length})</div>
        <div class="recit-hist-list">
          ${history.slice().reverse().map(h => `
            <div class="recit-hist-item" style="border-color:${h.result.status==='correct'?'#2a5a2a':h.result.status==='partial'?'#4a3a00':'#3a2a00'}">
              <div class="recit-hist-input">"${h.input}"</div>
              <div class="recit-hist-verdict" style="color:${h.result.status==='correct'?'#4CAF50':h.result.status==='partial'?'#FF9800':'#888'}">
                ${h.result.status==='correct'?'✓ Correct':h.result.status==='partial'?'~ Partiel':'○ Proche'}
              </div>
            </div>`).join('')}
        </div>
        <button class="btn-ghost btn-danger mt" id="recitClearHistBtn">🗑 Effacer l'historique</button>
      ` : ''}
    </div>`;

  $('recitInput').addEventListener('input', e => { STATE.recitInput = e.target.value; });
  $('recitInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doRecitCheck(); }
  });
  $('recitCheckBtn').addEventListener('click', doRecitCheck);
  $('recitClearBtn').addEventListener('click', () => {
    STATE.recitInput = ''; STATE.recitResult = null; renderRecit(main);
  });
  if ($('recitClearHistBtn')) {
    $('recitClearHistBtn').addEventListener('click', () => {
      STATE.recitHistory = []; renderRecit(main);
    });
  }
  main.querySelectorAll('[data-ex]').forEach(b =>
    b.addEventListener('click', () => {
      STATE.recitInput = b.dataset.ex;
      const ta = $('recitInput');
      if (ta) ta.value = b.dataset.ex;
      doRecitCheck();
    }));

  function doRecitCheck() {
    const input = (STATE.recitInput || '').trim();
    if (!input) return;
    const result = recitCheck(input);
    STATE.recitResult = { input, result };
    if (!STATE.recitHistory) STATE.recitHistory = [];
    STATE.recitHistory.push({ input, result });
    renderRecit(main);
    const el = document.querySelector('.recit-result-box');
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
}

function renderRecitResult(data) {
  const { input, result } = data;
  if (!result) return '';
  if (result.status === 'unknown') return `
    <div class="recit-result-box recit-unknown">
      <div class="recit-verdict">❓ Introuvable dans la base</div>
      <div class="recit-hint">Essaie d'être plus précis ou d'utiliser les termes du code.</div>
    </div>`;

  const best = result.best;
  const statusColor = result.status==='correct'?'#4CAF50':result.status==='partial'?'#FF9800':'#888';
  const statusLabel = result.status==='correct'?'✓ Correct !':result.status==='partial'?'~ Partiellement correct':'○ Proche mais incomplet';
  const srcColor = SRC_COLORS[best.src] || '#aaa';

  return `
    <div class="recit-result-box" style="border-color:${statusColor}44">
      <div class="recit-verdict" style="color:${statusColor}">${statusLabel}</div>
      <div class="recit-match-card">
        <div class="badge-row">
          <span class="badge" style="color:${srcColor};border-color:${srcColor}55;background:${srcColor}15">${best.src}</span>
          <span class="badge" style="color:#c9a96e;border-color:#c9a96e44;background:#c9a96e10">${best.cat}</span>
        </div>
        ${renderBadgeHTML(best.id, 52)}<div class="recit-match-q">${best.question}</div>
        <div class="recit-match-a">${best.answer}</div>
      </div>
      ${result.matches.length > 1 ? `
        <details class="recit-other-matches">
          <summary style="color:#555;font-size:0.75rem;cursor:pointer">${result.matches.length-1} autre(s) résultat(s) proche(s)</summary>
          ${result.matches.slice(1).map(m => `
            <div class="recit-other-item">
              <div style="color:#666;font-size:0.75rem">${m.question}</div>
              <div style="color:#80a060;font-size:0.8rem">${m.answer}</div>
            </div>`).join('')}
        </details>` : ''}
    </div>`;
}

// ── ACCOUNT ───────────────────────────────────────────────────────────────────
function renderAccount(main) {
  const loggedIn = AUTH.isLoggedIn();
  const lastSync = SYNC_STATE.lastSync
    ? 'Dernière sync : ' + fmt(SYNC_STATE.lastSync)
    : 'Jamais synchronisé';

  if (loggedIn) {
    main.innerHTML = `
      <div class="account-wrap">
        <div class="account-avatar">👤</div>
        <div class="account-email">${AUTH.user.email}</div>
        <div class="account-sync-status" id="syncStatus">${lastSync}</div>

        <div class="account-actions">
          <button class="btn-primary" id="syncNowBtn">🔄 Synchroniser maintenant</button>
          <div class="account-info-box">
            <div class="account-info-row"><span>Quiz stats</span><span id="infoQstats">…</span></div>
            <div class="account-info-row"><span>Sessions</span><span id="infoSessions">…</span></div>
            <div class="account-info-row"><span>Chants</span><span id="infoSongs">…</span></div>
            <div class="account-info-row"><span>Statut réseau</span><span>${navigator.onLine ? '🟢 En ligne' : '🔴 Hors ligne'}</span></div>
          </div>
          <button class="btn-ghost" id="logoutBtn" style="margin-top:0.5rem">Se déconnecter</button>
        </div>
      </div>`;

    // Fill stats
    Promise.all([getAllQStats(), getSessions(500), getAllSongs()]).then(([qs, sess, songs]) => {
      const seen = Object.values(qs).filter(s => s.seen > 0).length;
      document.getElementById('infoQstats') && (document.getElementById('infoQstats').textContent = seen + ' questions vues');
      document.getElementById('infoSessions') && (document.getElementById('infoSessions').textContent = sess.length + ' sessions');
      document.getElementById('infoSongs') && (document.getElementById('infoSongs').textContent = songs.length + ' chants');
    });

    $('syncNowBtn').addEventListener('click', async () => {
      $('syncNowBtn').textContent = '🔄 Synchronisation…';
      $('syncNowBtn').disabled = true;
      SYNC_STATE.status = 'syncing';
      renderSyncIndicator();
      await SYNC.push();
      $('syncNowBtn').textContent = '🔄 Synchroniser maintenant';
      $('syncNowBtn').disabled = false;
      const el = $('syncStatus');
      if (el) el.textContent = SYNC_STATE.lastSync ? 'Dernière sync : ' + fmt(SYNC_STATE.lastSync) : 'Erreur';
    });

    $('logoutBtn').addEventListener('click', async () => {
      if (confirm('Se déconnecter ? Vos données locales sont conservées.')) {
        await AUTH.signOut();
        SYNC_STATE.status = 'idle';
        render();
      }
    });

  } else {
    // Login / signup form
    main.innerHTML = `
      <div class="account-wrap">
        <div class="account-avatar">🔑</div>
        <div class="account-title">Compte Faluche</div>
        <div class="account-subtitle">Connectez-vous pour synchroniser vos données entre appareils.</div>

        <div class="auth-tabs">
          <button class="auth-tab ${STATE.authMode!=='signup'?'active':''}" id="tabLogin">Connexion</button>
          <button class="auth-tab ${STATE.authMode==='signup'?'active':''}" id="tabSignup">Créer un compte</button>
        </div>

        <div class="auth-form">
          <input class="auth-input" type="email" id="authEmail" placeholder="Email" autocomplete="email" inputmode="email"/>
          <input class="auth-input" type="password" id="authPass" placeholder="Mot de passe (min. 6 car.)" autocomplete="${STATE.authMode==='signup'?'new-password':'current-password'}"/>
          ${STATE.authMode === 'signup' ? '<input class="auth-input" type="password" id="authPass2" placeholder="Confirmer le mot de passe" autocomplete="new-password"/>' : ''}
          <div class="auth-error" id="authError"></div>
          <button class="btn-primary" id="authSubmitBtn">${STATE.authMode === 'signup' ? 'Créer le compte' : 'Se connecter'}</button>
        </div>

        <div class="account-offline-note">
          Sans compte, l'app fonctionne entièrement hors ligne.<br>
          Le compte sert uniquement à la synchronisation multi-appareils.
        </div>
      </div>`;

    $('tabLogin').addEventListener('click', () => { STATE.authMode = 'login'; renderAccount(main); });
    $('tabSignup').addEventListener('click', () => { STATE.authMode = 'signup'; renderAccount(main); });

    const doAuth = async () => {
      const email = $('authEmail').value.trim();
      const pass  = $('authPass').value;
      const errEl = $('authError');
      errEl.textContent = '';

      if (!email || !pass) { errEl.textContent = 'Remplis tous les champs.'; return; }
      if (pass.length < 6) { errEl.textContent = 'Mot de passe trop court (min. 6).'; return; }

      if (STATE.authMode === 'signup') {
        const pass2 = $('authPass2') ? $('authPass2').value : '';
        if (pass !== pass2) { errEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }
      }

      const btn = $('authSubmitBtn');
      btn.disabled = true;
      btn.textContent = '…';
      try {
        if (STATE.authMode === 'signup') {
          await AUTH.signUp(email, pass);
        } else {
          await AUTH.signIn(email, pass);
        }
        // On success: push local data then pull (merge)
        SYNC_STATE.status = 'syncing';
        renderSyncIndicator();
        if (STATE.authMode === 'login') {
          // Pull first to get cloud data, then push merged result
          await SYNC.pull();
        }
        await SYNC.push();
        render();
      } catch(e) {
        errEl.textContent = e.message || 'Erreur. Vérifie tes identifiants.';
        btn.disabled = false;
        btn.textContent = STATE.authMode === 'signup' ? 'Créer le compte' : 'Se connecter';
      }
    };

    $('authSubmitBtn').addEventListener('click', doAuth);
    [$('authEmail'), $('authPass'), STATE.authMode === 'signup' ? $('authPass2') : null]
      .filter(Boolean)
      .forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') doAuth(); }));
  }
}
