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
  const words = c.split(' ').filter(w => w.length > 4);
  if (!words.length) return u.length > 1 && c.includes(u) ? 'partial' : 'wrong';
  const matched = words.filter(w => u.includes(w)).length;
  if (matched >= Math.ceil(words.length * 0.65)) return 'partial';
  return 'wrong';
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
  screen: 'home',   // home | quiz | results | history | stats
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
      <div class="nav-tabs">
        <button class="nav-btn ${STATE.screen==='home'?'active':''}" data-screen="home">Quiz</button>
        <button class="nav-btn ${STATE.screen==='history'?'active':''}" data-screen="history">Historique</button>
        <button class="nav-btn ${STATE.screen==='stats'?'active':''}" data-screen="stats">Stats</button>
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

  // Weighted shuffle: questions seen less / wrong more appear first
  pool = pool.map(q => {
    const s = STATE.qstats[q.id] || { seen: 0, wrong: 0 };
    const weight = 1 + (s.wrong || 0) * 2 - (s.correct || 0) * 0.5 + (s.seen === 0 ? 3 : 0);
    return { q, weight: Math.max(weight, 0.1) };
  });
  pool.sort(() => Math.random() - 0.5);
  // weighted pick
  const totalW = pool.reduce((a, x) => a + x.weight, 0);
  const picked = [];
  const used = new Set();
  for (let i = 0; i < size && picked.length < pool.length; i++) {
    let r = Math.random() * pool.reduce((a, x, j) => !used.has(j) ? a + x.weight : a, 0);
    for (let j = 0; j < pool.length; j++) {
      if (used.has(j)) continue;
      r -= pool[j].weight;
      if (r <= 0) { picked.push(pool[j].q); used.add(j); break; }
    }
  }

  STATE.questions = picked.length ? picked : shuffle(filteredPool()).slice(0, size);
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

  if (STATE.idx + 1 >= STATE.questions.length) {
    // Save session
    const sc = STATE.sessionScore;
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
              <div class="wrong-q">${h.q.q.replace(/^\[.*?\]\s*/, '')}</div>
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
              <div class="worst-q">${q.q.replace(/^\[.*?\]\s*/,'')}</div>
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
  STATE.qstats = await getAllQStats();
  STATE.sessions = await getSessions(30);
  render();
})();
