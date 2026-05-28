// ── APP.JS ────────────────────────────────────────────────────────────────────

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
  const words = c.split(' ').filter(w => w.length > 4);
  if (!words.length) return u.length > 1 && c.includes(u) ? 'partial' : 'wrong';
  const matched = words.filter(w => u.includes(w)).length;
  if (matched >= Math.ceil(words.length * 0.65)) return 'partial';
  return 'wrong';
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function getBadgeSVG(qid) {
  if (!qid) return null;
  const base = String(qid).replace(/_[rim]$/, '');
  const key = (typeof BADGE_MAP !== 'undefined') ? BADGE_MAP[base] : null;
  if (!key || !BADGE_SVG[key]) return null;
  return BADGE_SVG[key];
}
function renderBadgeHTML(qid, context) {
  const svg = getBadgeSVG(qid);
  if (!svg) return '';
  // context: 'question' | 'answer' | 'result' | 'stats' | 'recit'
  if (context === 'answer') {
    return '<div class="answer-badge-wrap"><div class="badge-img">' + svg + '</div></div>';
  }
  if (context === 'result') {
    return '<div class="badge-img">' + svg + '</div>';
  }
  if (context === 'stats') {
    return '<div class="badge-img">' + svg + '</div>';
  }
  if (context === 'recit') {
    return '<div class="badge-img">' + svg + '</div>';
  }
  // default: question context — large centered
  return '<div class="quiz-badge-wrap"><div class="badge-img">' + svg + '</div></div>';
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
  screen: 'home',
  questions: [], idx: 0, revealed: false,
  userInput: '', answerStatus: null,
  sessionScore: { correct: 0, partial: 0, wrong: 0 },
  sessionHistory: [],
  qstats: {}, sessions: [],
  filterSrc: 'ALL', filterCat: 'ALL', filterMode: 'normal',
  songFilterLevel: -1, songSearch: '', songEditingId: null,
  authMode: 'login',
  recitHistory: [], recitInput: '', recitResult: null,
  customQuestions: [],
  showAddQuestion: false,
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

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (STATE.screen !== 'quiz') {
    const nav = document.createElement('div');
    nav.className = 'nav';
    nav.innerHTML =
      '<span class="nav-title">🎓 Faluche</span>' +
      '<span id="syncIndicator" class="sync-indicator"></span>' +
      '<div class="nav-tabs">' +
        '<button class="nav-btn ' + (STATE.screen==='home'?'active':'') + '" data-screen="home">Quiz</button>' +
        '<button class="nav-btn ' + (STATE.screen==='recit'?'active':'') + '" data-screen="recit">Récit</button>' +
        '<button class="nav-btn ' + (STATE.screen==='songs'?'active':'') + '" data-screen="songs">Chants</button>' +
        '<button class="nav-btn ' + (STATE.screen==='history'?'active':'') + '" data-screen="history">Historique</button>' +
        '<button class="nav-btn ' + (STATE.screen==='stats'?'active':'') + '" data-screen="stats">Stats</button>' +
        '<button class="nav-btn ' + (STATE.screen==='account'?'active':'') + '" data-screen="account">' + (AUTH && AUTH.isLoggedIn() ? '👤' : '🔑') + '</button>' +
      '</div>';
    nav.querySelectorAll('[data-screen]').forEach(b =>
      b.addEventListener('click', () => { STATE.screen = b.dataset.screen; render(); }));
    app.appendChild(nav);
    if (typeof renderSyncIndicator !== 'undefined') renderSyncIndicator();
  }

  const main = document.createElement('div');
  main.className = 'main';
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
  let html = '<div class="home-wrap">';
  html += '<div class="home-title">Code de la Faluche</div>';
  html += '<div class="home-sub">' + ALL_QUESTIONS.length + ' questions — Code National + IPP</div>';
  html += '<div class="card">';
  html += '<div class="section-label">Source</div><div class="chip-row">';
  ['ALL','NATIONAL','IPP','BOTH'].forEach(s => {
    html += '<button class="chip ' + (STATE.filterSrc===s?'chip-active':'') + '" data-src="' + s + '">' + (s==='ALL'?'Tous':s==='BOTH'?'Les deux':s) + '</button>';
  });
  html += '</div><div class="section-label mt">Catégorie</div>';
  html += '<select class="sel" id="catsel">';
  CATS.forEach(c => { html += '<option value="' + c + '"' + (STATE.filterCat===c?' selected':'') + '>' + (c==='ALL'?'Toutes les catégories':c) + '</option>'; });
  html += '</select>';
  html += '<div class="section-label mt">Mode</div><div class="chip-row">';
  html += '<button class="chip ' + (STATE.filterMode==='normal'?'chip-active':'') + '" data-mode="normal">Normal</button>';
  html += '<button class="chip ' + (STATE.filterMode==='weak'?'chip-active':'') + '" data-mode="weak">⚠️ Points faibles</button>';
  html += '</div><div class="pool-count">' + pool.length + ' question' + (pool.length>1?'s':'') + ' dans ce filtre</div></div>';
  html += '<div class="card"><div class="section-label">Nombre de questions</div><div class="chip-row">';
  [10,20,30,50,'Tout'].forEach(n => {
    const sz = n==='Tout' ? pool.length : Math.min(n, pool.length);
    html += '<button class="chip chip-size" data-size="' + sz + '">' + (n==='Tout'?'Tout ('+pool.length+')':n>pool.length?'Tout ('+pool.length+')':n) + '</button>';
  });
  html += '</div></div>';
  html += '<button class="btn-add-question" id="addQBtn">✚ Ajouter une question</button>';
  if (STATE.showAddQuestion) html += renderAddQuestionForm();
  html += '<div class="src-legend"><span><span style="color:#5a9fd4">●</span> National</span><span><span style="color:#e8a030">●</span> IPP</span><span><span style="color:#90d050">●</span> Les deux</span></div>';
  html += '</div>';
  main.innerHTML = html;
  main.querySelectorAll('[data-src]').forEach(b => b.addEventListener('click', () => { STATE.filterSrc = b.dataset.src; render(); }));
  $('catsel').addEventListener('change', e => { STATE.filterCat = e.target.value; render(); });
  main.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { STATE.filterMode = b.dataset.mode; render(); }));
  main.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => startSession(parseInt(b.dataset.size))));

  const addQBtn = document.getElementById('addQBtn');
  if (addQBtn) addQBtn.addEventListener('click', () => { STATE.showAddQuestion = !STATE.showAddQuestion; render(); });
  bindAddQuestionForm(main);
}

function filteredPool() {
  const custom = (STATE.customQuestions || []).map(q => ({ ...q, _custom: true }));
  let pool = [...ALL_QUESTIONS, ...custom];
  if (STATE.filterSrc !== 'ALL') pool = pool.filter(q => q.src === STATE.filterSrc);
  if (STATE.filterCat !== 'ALL') pool = pool.filter(q => q.cat === STATE.filterCat);
  if (STATE.filterMode === 'weak') {
    const weak = pool.filter(q => {
      const s = STATE.qstats[q.id];
      if (!s || !s.seen) return true;
      return (s.wrong / s.seen) >= 0.4;
    });
    if (weak.length) pool = weak;
  }
  return pool;
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
async function startSession(size) {
  STATE.qstats = await getAllQStats();
  STATE.customQuestions = await getAllCustomQuestions();
  const pool = filteredPool();

  const recentIds = new Set(STATE.lastSessionIds || []);
  const sorted = shuffle(pool).sort((a, b) => {
    const aRecent = recentIds.has(a.id) ? 1 : 0;
    const bRecent = recentIds.has(b.id) ? 1 : 0;
    return aRecent - bRecent;
  });
  STATE.questions = sorted.slice(0, size);
  STATE.lastSessionIds = STATE.questions.map(q => q.id);

  STATE.idx = 0;
  STATE.revealed = false;
  STATE.userInput = '';
  STATE.answerStatus = null;
  STATE.sessionScore = { correct:0, partial:0, wrong:0 };
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

  let html = '<div class="quiz-wrap">';
  html += '<div class="quiz-topbar">';
  html += '<button class="back-btn" id="quitBtn">✕</button>';
  html += '<div class="prog-info">' + (STATE.idx+1) + ' / ' + STATE.questions.length + (p!==null?' · '+p+'%':'') + '</div>';
  html += '<div class="score-mini">✓' + s.correct + ' ~' + s.partial + ' ✗' + s.wrong + '</div>';
  html += '</div>';
  html += '<div class="prog-bar-wrap"><div class="prog-bar" style="width:' + progress + '%"></div></div>';
  html += '<div class="quiz-card" style="border-left-color:' + catColor + '">';
  html += '<div class="badge-row">';
  html += '<span class="badge" style="color:' + srcColor + ';border-color:' + srcColor + '55;background:' + srcColor + '15">' + q.src + '</span>';
  html += '<span class="badge" style="color:#c9a96e;border-color:#c9a96e44;background:#c9a96e10">' + q.cat + '</span>';
  html += '</div>';
  html += '<div class="question-text">' + qtext + '</div>';
  // Badge dans la question seulement si ce n'est PAS un circulaire
  if (q.cat !== 'Circulaire velours' && q.cat !== 'Circulaire satin') {
    html += renderBadgeHTML(q.id, 'question');
  }

  if (!STATE.revealed) {
    html += '<textarea class="answer-input" id="answerTA" placeholder="Ta réponse... (Entrée pour valider)" rows="3">' + STATE.userInput + '</textarea>';
    html += '<div class="btn-row"><button class="btn-primary" id="submitBtn">Valider</button><button class="btn-ghost" id="skipBtn">Passer</button></div>';
  } else {
    if (STATE.userInput) {
      const bc = STATE.answerStatus==='correct'?'#2a5a2a':STATE.answerStatus==='partial'?'#5a4000':'#5a0000';
      const tc = STATE.answerStatus==='correct'?'#80d060':STATE.answerStatus==='partial'?'#d0a040':'#e06060';
      html += '<div class="answer-box user-answer" style="border-color:' + bc + '">';
      html += '<div class="answer-label">Ta réponse</div>';
      html += '<div style="color:' + tc + '">' + STATE.userInput + '</div></div>';
    }
    html += '<div class="answer-box correct-answer"><div class="answer-label">Réponse attendue</div>';
    // Badge dans la réponse pour les circulaires
    if (q.cat === 'Circulaire velours' || q.cat === 'Circulaire satin') {
      html += renderBadgeHTML(q.id, 'answer');
    }
    html += '<div style="color:#a0d080">' + q.a + '</div></div>';
    html += '<div class="judge-label">Corriger l\'évaluation :</div>';
    html += '<div class="judge-row">';
    html += '<button class="judge-btn correct" id="j_correct">✓ Correct</button>';
    html += '<button class="judge-btn partial" id="j_partial">~ Partiel</button>';
    html += '<button class="judge-btn wrong" id="j_wrong">✗ Raté</button>';
    html += '</div>';
  }
  html += '</div></div>';
  main.innerHTML = html;

  $('quitBtn').addEventListener('click', () => {
    if (confirm('Quitter la session ?')) { STATE.screen = 'home'; render(); }
  });

  if (!STATE.revealed) {
    const ta = $('answerTA');
    ta.addEventListener('input', e => { STATE.userInput = e.target.value; });
    ta.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); submitAnswer(); } });
    $('submitBtn').addEventListener('click', submitAnswer);
    $('skipBtn').addEventListener('click', () => { STATE.revealed=true; STATE.answerStatus='wrong'; render(); });
  } else {
    ['correct','partial','wrong'].forEach(r => {
      $('j_'+r).addEventListener('click', () => nextQuestion(r));
    });
  }
}

function submitAnswer() {
  const ta = $('answerTA');
  STATE.userInput = ta ? ta.value.trim() : STATE.userInput;
  if (!STATE.userInput) { STATE.revealed=true; STATE.answerStatus='wrong'; render(); return; }
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
    const sc = STATE.sessionScore;
    if (typeof SYNC !== 'undefined') SYNC.markDirty();
    await saveSession({
      ts: Date.now(), total: STATE.questions.length,
      correct: sc.correct, partial: sc.partial, wrong: sc.wrong,
      score: pct(sc.correct, sc.partial, sc.wrong),
      history: STATE.sessionHistory.map(h => ({ id: h.q.id, result: h.result })),
    });
    STATE.qstats = await getAllQStats();
    STATE.screen = 'results';
    render();
  } else {
    STATE.idx++; STATE.revealed=false; STATE.userInput=''; STATE.answerStatus=null;
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

  let html = '<div class="results-wrap">';
  html += '<div class="result-emoji">' + emoji(p) + '</div>';
  html += '<div class="result-pct" style="color:' + (p>=80?'#4CAF50':p>=60?'#FF9800':'#f44336') + '">' + p + '%</div>';
  html += '<div class="result-detail">✓ ' + sc.correct + ' correctes &nbsp;·&nbsp; ~ ' + sc.partial + ' partielles &nbsp;·&nbsp; ✗ ' + sc.wrong + ' ratées</div>';

  if (wrongs.length) {
    html += '<div class="section-label mt" style="color:#FF9800">⚠️ À retravailler (' + wrongs.length + ')</div>';
    html += '<div class="wrongs-list">';
    wrongs.forEach(h => {
      html += '<div class="wrong-item" style="border-color:' + (h.result==='partial'?'#5a4000':'#5a0000') + '">';
      html += '<div class="wrong-src">[' + h.q.src + '] ' + h.q.cat + '</div>';
      html += renderBadgeHTML(h.q.id, 'result');
      html += '<div class="wrong-q">' + h.q.q.replace(/^\[.*?\]\s*/, '') + '</div>';
      if (h.userAnswer) html += '<div class="wrong-user">« ' + h.userAnswer + ' »</div>';
      html += '<div class="wrong-a">✓ ' + h.q.a + '</div></div>';
    });
    html += '</div>';
  } else {
    html += '<div class="perfect">🎯 Parfait ! Aucune erreur.</div>';
  }

  html += '<div class="btn-col mt">';
  html += '<button class="btn-primary" id="againBtn">Recommencer (' + total + ' q.)</button>';
  html += '<button class="btn-ghost" id="weakBtn">⚠️ Refaire les ratées</button>';
  html += '<button class="btn-ghost" id="homeBtn">Accueil</button>';
  html += '</div></div>';
  main.innerHTML = html;

  $('againBtn').addEventListener('click', () => startSession(total));
  $('weakBtn').addEventListener('click', () => { STATE.filterMode='weak'; STATE.filterSrc='ALL'; STATE.filterCat='ALL'; startSession(Math.max(wrongs.length,10)); });
  $('homeBtn').addEventListener('click', () => { STATE.screen='home'; render(); });
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
async function renderHistory(main) {
  const sessions = await getSessions(30);

  if (!sessions.length) {
    main.innerHTML = '<div class="empty">Aucune session encore.<br>Lance ton premier quiz !</div>';
    return;
  }

  const avgScore = Math.round(sessions.reduce((a,s) => a+s.score, 0) / sessions.length);
  const totalQ = sessions.reduce((a,s) => a+s.total, 0);

  let html = '<div class="hist-wrap">';
  html += '<div class="hist-summary">';
  html += '<div class="hist-stat"><div class="hist-stat-n">' + sessions.length + '</div><div class="hist-stat-l">Sessions</div></div>';
  html += '<div class="hist-stat"><div class="hist-stat-n">' + totalQ + '</div><div class="hist-stat-l">Questions</div></div>';
  html += '<div class="hist-stat"><div class="hist-stat-n" style="color:' + (avgScore>=80?'#4CAF50':avgScore>=60?'#FF9800':'#f44336') + '">' + avgScore + '%</div><div class="hist-stat-l">Moy.</div></div>';
  html += '</div><div class="hist-list">';

  sessions.forEach(s => {
    const p = s.score;
    html += '<div class="hist-item">';
    html += '<div class="hist-item-left"><div class="hist-score" style="color:' + (p>=80?'#4CAF50':p>=60?'#FF9800':'#f44336') + '">' + emoji(p) + ' ' + p + '%</div>';
    html += '<div class="hist-date">' + fmt(s.ts) + '</div></div>';
    html += '<div class="hist-item-right"><div>' + s.total + ' questions</div><div style="color:#666;font-size:0.75rem">✓' + s.correct + ' ~' + s.partial + ' ✗' + s.wrong + '</div></div>';
    html += '</div>';
  });

  html += '</div><button class="btn-ghost btn-danger mt" id="clearBtn">🗑 Effacer l\'historique</button></div>';
  main.innerHTML = html;

  $('clearBtn').addEventListener('click', async () => {
    if (confirm('Effacer tout l\'historique des sessions ?')) { await clearSessions(); render(); }
  });
}

// ── STATS ─────────────────────────────────────────────────────────────────────
async function renderStats(main) {
  STATE.qstats = await getAllQStats();
  const allSeen = ALL_QUESTIONS.filter(q => STATE.qstats[q.id] && STATE.qstats[q.id].seen > 0);
  const allUnseen = ALL_QUESTIONS.filter(q => !STATE.qstats[q.id] || !STATE.qstats[q.id].seen);

  const withStats = allSeen.map(q => {
    const s = STATE.qstats[q.id];
    return { q, s, wrongRate: s.wrong / s.seen };
  }).sort((a,b) => b.wrongRate - a.wrongRate);
  const worst = withStats.slice(0, 10);

  const catStats = {};
  CATS.filter(c => c !== 'ALL').forEach(cat => {
    const qs = ALL_QUESTIONS.filter(q => q.cat === cat);
    const seen = qs.filter(q => STATE.qstats[q.id] && STATE.qstats[q.id].seen > 0);
    if (!seen.length) { catStats[cat] = null; return; }
    const tc = seen.reduce((a,q) => a+(STATE.qstats[q.id].correct||0), 0);
    const tp = seen.reduce((a,q) => a+(STATE.qstats[q.id].partial||0), 0);
    const tw = seen.reduce((a,q) => a+(STATE.qstats[q.id].wrong||0), 0);
    catStats[cat] = { p: pct(tc,tp,tw), seen: seen.length, total: qs.length };
  });

  let html = '<div class="stats-wrap">';
  html += '<div class="stats-overview">';
  html += '<div class="hist-stat"><div class="hist-stat-n">' + allSeen.length + '/' + ALL_QUESTIONS.length + '</div><div class="hist-stat-l">Vues</div></div>';
  html += '<div class="hist-stat"><div class="hist-stat-n">' + allUnseen.length + '</div><div class="hist-stat-l">Jamais vues</div></div>';
  html += '</div><div class="section-label mt">Par catégorie</div><div class="cat-bars">';

  CATS.filter(c => c !== 'ALL').forEach(cat => {
    const s = catStats[cat];
    if (!s) {
      html += '<div class="cat-bar-item"><div class="cat-bar-top"><span class="cat-bar-name">' + cat + '</span><div class="cat-bar-none">Jamais vue</div></div></div>';
      return;
    }
    const col = s.p>=80?'#4CAF50':s.p>=60?'#FF9800':'#f44336';
    html += '<div class="cat-bar-item"><div class="cat-bar-top"><span class="cat-bar-name">' + cat + '</span>';
    html += '<span style="color:' + col + ';font-size:0.8rem">' + s.p + '% (' + s.seen + '/' + s.total + ')</span></div>';
    html += '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + s.p + '%;background:' + col + '"></div></div></div>';
  });
  html += '</div>';

  if (worst.length) {
    html += '<div class="section-label mt">⚠️ Pires questions (' + worst.length + ')</div><div class="worst-list">';
    worst.forEach(({q,s,wrongRate}) => {
      html += '<div class="worst-item">';
      html += '<div class="worst-meta">' + q.src + ' · ' + q.cat + ' · ✗ ' + Math.round(wrongRate*100) + '% (' + s.seen + ' fois)</div>';
      html += renderBadgeHTML(q.id, 'stats');
      html += '<div class="worst-q">' + q.q.replace(/^\[.*?\]\s*/,'') + '</div>';
      html += '<div class="worst-a">' + q.a + '</div></div>';
    });
    html += '</div>';
  }

  html += '<button class="btn-ghost btn-danger mt" id="resetStatsBtn">🗑 Remettre les stats à zéro</button></div>';
  main.innerHTML = html;

  $('resetStatsBtn').addEventListener('click', async () => {
    if (confirm('Effacer toutes les statistiques ?')) { await resetAllStats(); STATE.qstats={}; render(); }
  });
}

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
  const mastered = songs.filter(s => s.level===4).length;
  const inProgress = songs.filter(s => s.level>=1&&s.level<4).length;
  const notStarted = songs.filter(s => s.level===0).length;
  const progMaster = total ? Math.round(mastered/total*100) : 0;
  const progInProg = total ? Math.round(inProgress/total*100) : 0;

  let html = '<div class="songs-wrap">';

  if (total > 0) {
    html += '<div class="songs-stats-row">';
    html += '<div class="songs-stat"><div class="songs-stat-n" style="color:#4CAF50">' + mastered + '</div><div class="songs-stat-l">Maîtrisés</div></div>';
    html += '<div class="songs-stat"><div class="songs-stat-n" style="color:#FF9800">' + inProgress + '</div><div class="songs-stat-l">En cours</div></div>';
    html += '<div class="songs-stat"><div class="songs-stat-n" style="color:#555">' + notStarted + '</div><div class="songs-stat-l">Non commencé</div></div>';
    html += '<div class="songs-stat"><div class="songs-stat-n" style="color:#c9a96e">' + total + '</div><div class="songs-stat-l">Total</div></div>';
    html += '</div>';
    html += '<div class="songs-prog-bg">';
    html += '<div class="songs-prog-fill" style="width:' + progMaster + '%;background:#4CAF50"></div>';
    html += '<div class="songs-prog-fill2" style="width:' + progInProg + '%;left:' + progMaster + '%;background:#FF9800"></div>';
    html += '</div>';
  }

  html += '<div class="songs-add-area">';
  html += '<input class="search-input" id="newSongInput" placeholder="✚ Nom du chant à ajouter..." autocomplete="off" autocorrect="off"/>';
  html += '<button class="btn-primary" id="addSongBtn" style="margin-top:0.5rem">Ajouter</button>';
  html += '</div>';

  if (total > 0) {
    html += '<div class="songs-filters">';
    html += '<input class="search-input" id="songSearch" placeholder="🔍 Rechercher..." value="' + (STATE.songSearch||'') + '"/>';
    html += '<div class="chip-row" style="margin-top:0.5rem">';
    html += '<button class="chip ' + (filterLevel===-1?'chip-active':'') + '" data-slvl="-1">Tous</button>';
    LEVELS.forEach(l => {
      html += '<button class="chip ' + (filterLevel===l.id?'chip-active':'') + '" data-slvl="' + l.id + '" style="' + (filterLevel===l.id?'color:'+l.color+';border-color:'+l.color:'') + '">' + l.icon + ' ' + l.label + '</button>';
    });
    html += '</div></div>';
  }

  html += '<div class="songs-list">';
  if (pool.length === 0 && total === 0) {
    html += '<div class="songs-empty"><div style="font-size:2rem;margin-bottom:0.5rem">🎵</div>';
    html += '<div style="color:#555;font-size:0.9rem">Aucun chant encore.<br>Ajoute tes paillardes à apprendre !</div></div>';
  } else if (pool.length === 0) {
    html += '<div class="empty">Aucun chant ne correspond.</div>';
  } else {
    pool.forEach(s => {
      const L = LEVELS[s.level];
      const isEditing = editingId === s.id;
      html += '<div class="song-item" data-sid="' + s.id + '">';
      html += '<div class="song-left">';
      if (isEditing) {
        html += '<input class="song-edit-input" id="editInput_' + s.id + '" value="' + s.title.replace(/"/g,'&quot;') + '" autocomplete="off"/>';
      } else {
        html += '<div class="song-title">' + s.title + '</div>';
      }
      html += '</div><div class="song-right">';
      if (isEditing) {
        html += '<div class="song-edit-btns">';
        html += '<button class="song-edit-save" data-sid="' + s.id + '">✓</button>';
        html += '<button class="song-edit-cancel" data-sid="' + s.id + '">✕</button>';
        html += '<button class="song-del-btn" data-sid="' + s.id + '">🗑</button>';
        html += '</div>';
      } else {
        html += '<div class="level-dots">';
        LEVELS.forEach(l => {
          html += '<button class="lvl-dot ' + (s.level===l.id?'lvl-dot-active':'') + '" data-sid="' + s.id + '" data-lvl="' + l.id + '" style="background:' + (s.level>=l.id&&l.id>0?l.color:'#222') + ';border-color:' + (l.id>0?l.color:'#333') + '" title="' + l.label + '"></button>';
        });
        html += '</div>';
        html += '<div class="song-level-label" style="color:' + L.color + '">' + L.icon + ' ' + L.label + '</div>';
        html += '<button class="song-edit-btn" data-sid="' + s.id + '" title="Renommer">✏️</button>';
      }
      html += '</div></div>';
    });
  }
  html += '</div><div style="height:2rem"></div></div>';
  main.innerHTML = html;

  const newInput = $('newSongInput');
  const doAdd = async () => {
    const title = newInput.value.trim();
    if (!title) return;
    await addSong(title);
    if (typeof SYNC !== 'undefined') SYNC.markDirty();
    newInput.value = '';
    STATE.songSearch = '';
    STATE.songFilterLevel = -1;
    await renderSongs(main);
    $('newSongInput') && $('newSongInput').focus();
  };
  newInput.addEventListener('keydown', e => { if (e.key==='Enter') doAdd(); });
  $('addSongBtn').addEventListener('click', doAdd);

  if ($('songSearch')) $('songSearch').addEventListener('input', e => { STATE.songSearch=e.target.value; renderSongs(main); });
  main.querySelectorAll('[data-slvl]').forEach(b => b.addEventListener('click', () => { STATE.songFilterLevel=parseInt(b.dataset.slvl); renderSongs(main); }));

  main.querySelectorAll('.lvl-dot').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    await updateSongLevel(b.dataset.sid, parseInt(b.dataset.lvl));
    if (typeof SYNC !== 'undefined') SYNC.markDirty();
    renderSongs(main);
  }));

  main.querySelectorAll('.song-edit-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    STATE.songEditingId = b.dataset.sid;
    renderSongs(main);
    const inp = $('editInput_' + b.dataset.sid);
    if (inp) { inp.focus(); inp.select(); }
  }));

  main.querySelectorAll('.song-edit-save').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    const inp = $('editInput_' + b.dataset.sid);
    if (inp && inp.value.trim()) await updateSongTitle(b.dataset.sid, inp.value);
    STATE.songEditingId = null;
    renderSongs(main);
  }));

  main.querySelectorAll('.song-edit-cancel').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    STATE.songEditingId = null;
    renderSongs(main);
  }));

  main.querySelectorAll('.song-edit-input').forEach(inp => inp.addEventListener('keydown', async e => {
    const sid = inp.id.replace('editInput_', '');
    if (e.key === 'Enter') {
      if (inp.value.trim()) await updateSongTitle(sid, inp.value);
      STATE.songEditingId = null;
      renderSongs(main);
    }
    if (e.key === 'Escape') { STATE.songEditingId = null; renderSongs(main); }
  }));

  main.querySelectorAll('.song-del-btn').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    if (confirm('Supprimer ce chant ?')) {
      await deleteSong(b.dataset.sid);
      if (typeof SYNC !== 'undefined') SYNC.markDirty();
      STATE.songEditingId = null;
      renderSongs(main);
    }
  }));
}

// ── RÉCITATION ────────────────────────────────────────────────────────────────
function buildKnowledgeBase() {
  const kb = [];
  for (const q of ALL_QUESTIONS) {
    kb.push({ question: q.q.replace(/^\[.*?\]\s*/,''), answer: q.a, cat: q.cat, src: q.src, id: q.id });
    const surIdx = q.a.indexOf(' sur ');
    const pourIdx = q.a.indexOf(' pour ');
    if (surIdx !== -1 && pourIdx !== -1) {
      const insigne = q.a.slice(0, surIdx).trim();
      const matCoul = q.a.slice(surIdx+5, pourIdx).trim();
      const filiere = q.a.slice(pourIdx+6).trim();
      kb.push({ question: 'Circulaire de ' + filiere, answer: q.a, cat: q.cat, src: q.src, id: q.id+'_r' });
      kb.push({ question: 'Insigne de ' + filiere, answer: insigne, cat: q.cat, src: q.src, id: q.id+'_i' });
      kb.push({ question: 'Matière/couleur de ' + filiere, answer: matCoul, cat: q.cat, src: q.src, id: q.id+'_m' });
    }
  }
  return kb;
}

function findMatchingFacts(input) {
  const kb = buildKnowledgeBase();
  const u = normalize(input);
  const results = [];
  for (const fact of kb) {
    const a = normalize(fact.answer), q = normalize(fact.question);
    let score = 0, matchType = null;
    if (u === a) { score=1.0; matchType='exact'; }
    else if (a.includes(u) && u.length>5) { score=0.85; matchType='contained'; }
    else if (u.includes(a) && a.length>5) { score=0.8; matchType='extended'; }
    else {
      const aWords = a.split(' ').filter(w=>w.length>4);
      const uWords = u.split(' ').filter(w=>w.length>4);
      if (aWords.length>0) {
        const hit = aWords.filter(w=>u.includes(w)).length;
        const rev = uWords.filter(w=>a.includes(w)).length;
        const ratio = (hit + rev*0.5) / (aWords.length + uWords.length*0.5 || 1);
        if (ratio>=0.5) { score=ratio*0.75; matchType='keyword'; }
      }
      const qWords = q.split(' ').filter(w=>w.length>4);
      if (qWords.length>0) {
        const hit = qWords.filter(w=>u.includes(w)).length / qWords.length;
        if (hit>=0.6) { score=Math.max(score,hit*0.5); matchType=matchType||'question'; }
      }
    }
    if (score>0.3) results.push({ ...fact, score, matchType });
  }
  return results.sort((a,b)=>b.score-a.score).slice(0,5);
}

function recitCheck(input) {
  if (!input.trim()) return null;
  const matches = findMatchingFacts(input);
  if (!matches.length) return { status:'unknown', matches:[] };
  const best = matches[0];
  let status = best.score>=0.85?'correct':best.score>=0.5?'partial':'close';
  return { status, matches, best };
}

function renderRecit(main) {
  const history = STATE.recitHistory || [];
  let html = '<div class="recit-wrap">';
  html += '<div class="recit-header"><div class="recit-title">Mode Récitation</div>';
  html += '<div class="recit-sub">Énonce n\'importe quel fait, insigne, circulaire…<br>L\'app vérifie si c\'est juste.</div></div>';
  html += '<div class="recit-examples"><div class="recit-ex-label">Exemples :</div><div class="recit-ex-list">';
  const examples = [
    ['Caducée médecine sur Velours rouge pour Médecine','Circulaire médecine'],
    ['Le chameau à l\'endroit signifie célibataire','Insigne chameau'],
    ['La faluche a été officialisée le 20 décembre 1888','Date création'],
    ['Une tortue décernée par un GM signifie grand hébergeur','Insigne GM'],
  ];
  examples.forEach(([ex, label]) => {
    html += '<button class="recit-ex-btn" data-ex="' + ex.replace(/"/g,'&quot;') + '">' + label + '</button>';
  });
  html += '</div></div>';
  html += '<div class="recit-input-area">';
  html += '<textarea class="answer-input" id="recitInput" placeholder="Énonce un fait…" rows="3">' + (STATE.recitInput||'') + '</textarea>';
  html += '<div class="btn-row"><button class="btn-primary" id="recitCheckBtn">Vérifier ✓</button><button class="btn-ghost" id="recitClearBtn">Effacer</button></div>';
  html += '</div>';

  if (STATE.recitResult) {
    const { result } = STATE.recitResult;
    if (!result || result.status==='unknown') {
      html += '<div class="recit-result-box recit-unknown"><div class="recit-verdict">❓ Introuvable dans la base</div><div class="recit-hint">Essaie d\'être plus précis.</div></div>';
    } else {
      const best = result.best;
      const statusColor = result.status==='correct'?'#4CAF50':result.status==='partial'?'#FF9800':'#888';
      const statusLabel = result.status==='correct'?'✓ Correct !':result.status==='partial'?'~ Partiellement correct':'○ Proche mais incomplet';
      const srcColor = SRC_COLORS[best.src]||'#aaa';
      html += '<div class="recit-result-box" style="border-color:' + statusColor + '44">';
      html += '<div class="recit-verdict" style="color:' + statusColor + '">' + statusLabel + '</div>';
      html += '<div class="recit-match-card">';
      html += '<div class="badge-row"><span class="badge" style="color:' + srcColor + ';border-color:' + srcColor + '55;background:' + srcColor + '15">' + best.src + '</span>';
      html += '<span class="badge" style="color:#c9a96e;border-color:#c9a96e44;background:#c9a96e10">' + best.cat + '</span></div>';
      html += renderBadgeHTML(best.id, 'recit');
      html += '<div class="recit-match-q">' + best.question + '</div>';
      html += '<div class="recit-match-a">' + best.answer + '</div></div>';
      if (result.matches.length>1) {
        html += '<details class="recit-other-matches"><summary style="color:#555;font-size:0.75rem;cursor:pointer">' + (result.matches.length-1) + ' autre(s) résultat(s)</summary>';
        result.matches.slice(1).forEach(m => {
          html += '<div class="recit-other-item"><div style="color:#666;font-size:0.75rem">' + m.question + '</div><div style="color:#80a060;font-size:0.8rem">' + m.answer + '</div></div>';
        });
        html += '</details>';
      }
      html += '</div>';
    }
  }

  if (history.length) {
    html += '<div class="section-label mt">Historique de la session (' + history.length + ')</div><div class="recit-hist-list">';
    history.slice().reverse().forEach(h => {
      html += '<div class="recit-hist-item" style="border-color:' + (h.result.status==='correct'?'#2a5a2a':h.result.status==='partial'?'#4a3a00':'#3a2a00') + '">';
      html += '<div class="recit-hist-input">"' + h.input + '"</div>';
      html += '<div class="recit-hist-verdict" style="color:' + (h.result.status==='correct'?'#4CAF50':h.result.status==='partial'?'#FF9800':'#888') + '">' + (h.result.status==='correct'?'✓ Correct':h.result.status==='partial'?'~ Partiel':'○ Proche') + '</div>';
      html += '</div>';
    });
    html += '</div><button class="btn-ghost btn-danger mt" id="recitClearHistBtn">🗑 Effacer l\'historique</button>';
  }
  html += '</div>';
  main.innerHTML = html;

  $('recitInput').addEventListener('input', e => { STATE.recitInput=e.target.value; });
  $('recitInput').addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); doRecitCheck(); } });
  $('recitCheckBtn').addEventListener('click', doRecitCheck);
  $('recitClearBtn').addEventListener('click', () => { STATE.recitInput=''; STATE.recitResult=null; renderRecit(main); });
  if ($('recitClearHistBtn')) $('recitClearHistBtn').addEventListener('click', () => { STATE.recitHistory=[]; renderRecit(main); });
  main.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => {
    STATE.recitInput = b.dataset.ex;
    const ta = $('recitInput'); if (ta) ta.value = b.dataset.ex;
    doRecitCheck();
  }));

  function doRecitCheck() {
    const input = (STATE.recitInput||'').trim();
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

// ── ACCOUNT ───────────────────────────────────────────────────────────────────
function renderAccount(main) {
  const loggedIn = AUTH && AUTH.isLoggedIn();
  const lastSync = SYNC_STATE && SYNC_STATE.lastSync ? 'Dernière sync : ' + fmt(SYNC_STATE.lastSync) : 'Jamais synchronisé';

  let html = '<div class="account-wrap">';

  if (loggedIn) {
    html += '<div class="account-avatar">👤</div>';
    html += '<div class="account-email">' + AUTH.user.email + '</div>';
    html += '<div class="account-sync-status" id="syncStatus">' + lastSync + '</div>';
    html += '<div class="account-actions">';
    html += '<button class="btn-primary" id="syncNowBtn">🔄 Synchroniser maintenant</button>';
    html += '<div class="account-info-box">';
    html += '<div class="account-info-row"><span>Statut réseau</span><span>' + (navigator.onLine?'🟢 En ligne':'🔴 Hors ligne') + '</span></div>';
    html += '<div class="account-info-row"><span>Questions vues</span><span id="infoQstats">…</span></div>';
    html += '<div class="account-info-row"><span>Sessions</span><span id="infoSessions">…</span></div>';
    html += '<div class="account-info-row"><span>Chants</span><span id="infoSongs">…</span></div>';
    html += '</div>';
    html += '<button class="btn-ghost" id="logoutBtn" style="margin-top:0.5rem">Se déconnecter</button>';
    html += '</div>';

  } else {
    html += '<div class="account-avatar">🔑</div>';
    html += '<div class="account-title">Compte Faluche</div>';
    html += '<div class="account-subtitle">Connectez-vous pour synchroniser vos données entre appareils.</div>';
    html += '<div class="auth-tabs">';
    html += '<button class="auth-tab ' + (STATE.authMode!=='signup'?'active':'') + '" id="tabLogin">Connexion</button>';
    html += '<button class="auth-tab ' + (STATE.authMode==='signup'?'active':'') + '" id="tabSignup">Créer un compte</button>';
    html += '</div>';
    html += '<div class="auth-form">';
    html += '<input class="auth-input" type="email" id="authEmail" placeholder="Email" autocomplete="email" inputmode="email"/>';
    html += '<input class="auth-input" type="password" id="authPass" placeholder="Mot de passe (min. 6 car.)" autocomplete="' + (STATE.authMode==='signup'?'new-password':'current-password') + '"/>';
    if (STATE.authMode==='signup') html += '<input class="auth-input" type="password" id="authPass2" placeholder="Confirmer le mot de passe" autocomplete="new-password"/>';
    html += '<div class="auth-error" id="authError"></div>';
    html += '<button class="btn-primary" id="authSubmitBtn">' + (STATE.authMode==='signup'?'Créer le compte':'Se connecter') + '</button>';
    html += '</div>';
    html += '<div class="account-offline-note">Sans compte, l\'app fonctionne entièrement hors ligne.<br>Le compte sert uniquement à la synchronisation multi-appareils.</div>';
  }

  html += '</div>';
  main.innerHTML = html;

  if (loggedIn) {
    Promise.all([getAllQStats(), getSessions(500), getAllSongs()]).then(([qs, sess, songs]) => {
      const seen = Object.values(qs).filter(s => s.seen > 0).length;
      if ($('infoQstats')) $('infoQstats').textContent = seen + ' questions';
      if ($('infoSessions')) $('infoSessions').textContent = sess.length + ' sessions';
      if ($('infoSongs')) $('infoSongs').textContent = songs.length + ' chants';
    });

    $('syncNowBtn').addEventListener('click', async () => {
      $('syncNowBtn').textContent = '🔄 Synchronisation…';
      $('syncNowBtn').disabled = true;
      if (typeof SYNC !== 'undefined') {
        SYNC_STATE.status = 'syncing'; renderSyncIndicator();
        await SYNC.push();
      }
      $('syncNowBtn').textContent = '🔄 Synchroniser maintenant';
      $('syncNowBtn').disabled = false;
      if ($('syncStatus')) $('syncStatus').textContent = SYNC_STATE.lastSync ? 'Dernière sync : ' + fmt(SYNC_STATE.lastSync) : 'Erreur';
    });

    $('logoutBtn').addEventListener('click', async () => {
      if (confirm('Se déconnecter ? Vos données locales sont conservées.')) {
        await AUTH.signOut();
        SYNC_STATE.status = 'idle';
        render();
      }
    });

  } else {
    $('tabLogin').addEventListener('click', () => { STATE.authMode='login'; renderAccount(main); });
    $('tabSignup').addEventListener('click', () => { STATE.authMode='signup'; renderAccount(main); });

    const doAuth = async () => {
      const email = $('authEmail').value.trim();
      const pass  = $('authPass').value;
      const errEl = $('authError');
      errEl.textContent = '';
      if (!email || !pass) { errEl.textContent = 'Remplis tous les champs.'; return; }
      if (pass.length < 6) { errEl.textContent = 'Mot de passe trop court (min. 6).'; return; }
      if (STATE.authMode==='signup') {
        const pass2 = $('authPass2') ? $('authPass2').value : '';
        if (pass !== pass2) { errEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }
      }
      const btn = $('authSubmitBtn');
      btn.disabled = true; btn.textContent = '…';
      try {
        if (STATE.authMode==='signup') await AUTH.signUp(email, pass);
        else await AUTH.signIn(email, pass);
        if (typeof SYNC !== 'undefined') {
          SYNC_STATE.status = 'syncing'; renderSyncIndicator();
          if (STATE.authMode==='login') await SYNC.pull();
          await SYNC.push();
        }
        render();
      } catch(e) {
        errEl.textContent = e.message || 'Erreur. Vérifie tes identifiants.';
        btn.disabled = false;
        btn.textContent = STATE.authMode==='signup' ? 'Créer le compte' : 'Se connecter';
      }
    };

    $('authSubmitBtn').addEventListener('click', doAuth);
    [$('authEmail'), $('authPass'), STATE.authMode==='signup' ? $('authPass2') : null]
      .filter(Boolean)
      .forEach(inp => inp.addEventListener('keydown', e => { if (e.key==='Enter') doAuth(); }));
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await openDB();
  if (typeof AUTH !== 'undefined') {
    await AUTH.load();
    if (AUTH.isLoggedIn()) {
      const user = await SB.getUser().catch(() => null);
      if (!user || user.error) {
        const refreshed = await AUTH.refresh();
        if (!refreshed) { AUTH.user=null; AUTH.token=null; AUTH.save(); }
      }
    }
  }
  STATE.qstats = await getAllQStats();
  STATE.sessions = await getSessions(30);
  STATE.customQuestions = await getAllCustomQuestions();
  render();
  if (typeof SYNC !== 'undefined') {
    SYNC.startAutoSync();
    if (AUTH.isLoggedIn() && navigator.onLine) {
      SYNC_STATE.status = 'syncing'; renderSyncIndicator();
      await SYNC.pull();
      STATE.qstats = await getAllQStats();
      render();
    }
    renderSyncIndicator();
  }
})();

// ── ADD / MANAGE CUSTOM QUESTIONS ─────────────────────────────────────────────
const CUSTOM_CATS = [
  'Histoire','Règles','Circulaire velours','Circulaire satin','Cursus',
  'Insignes perso','Insignes GM','Insignes régionaux','Velours/Rubans',
  'Types de faluche','Potager','GM & GC','Baptême','Parrains',
  'Honoris Causa','Grands Singes','Archivistes','Perso'
];

function renderAddQuestionForm() {
  const editing = STATE.editingCustomQ;
  const v = editing || { q:'', a:'', cat:'Perso', src:'NATIONAL' };
  let html = '<div class="add-q-form" id="addQForm">';
  html += '<div class="add-q-title">' + (editing ? '✏️ Modifier la question' : '✚ Nouvelle question') + '</div>';
  html += '<div class="add-q-field"><label>Question</label>';
  html += '<textarea class="add-q-input" id="aqQuestion" rows="2" placeholder="Ta question...">' + (v.q||'') + '</textarea></div>';
  html += '<div class="add-q-field"><label>Réponse</label>';
  html += '<textarea class="add-q-input" id="aqAnswer" rows="2" placeholder="La réponse attendue...">' + (v.a||'') + '</textarea></div>';
  html += '<div class="add-q-row">';
  html += '<div class="add-q-field" style="flex:1"><label>Catégorie</label><select class="sel" id="aqCat">';
  CUSTOM_CATS.forEach(cat => {
    html += '<option value="' + cat + '"' + (v.cat===cat?' selected':'') + '>' + cat + '</option>';
  });
  html += '</select></div>';
  html += '<div class="add-q-field" style="flex:1"><label>Source</label><select class="sel" id="aqSrc">';
  ['NATIONAL','IPP','BOTH','CUSTOM'].forEach(s => {
    html += '<option value="' + s + '"' + (v.src===s?' selected':'') + '>' + s + '</option>';
  });
  html += '</select></div></div>';
  html += '<div class="btn-row">';
  html += '<button class="btn-primary" id="aqSaveBtn">' + (editing ? 'Enregistrer' : 'Ajouter') + '</button>';
  html += '<button class="btn-ghost" id="aqCancelBtn">Annuler</button>';
  if (editing) html += '<button class="btn-ghost btn-danger" id="aqDeleteBtn">🗑 Supprimer</button>';
  html += '</div>';
  html += '</div>';

  // Custom questions list
  const customs = STATE.customQuestions || [];
  if (customs.length) {
    html += '<div class="add-q-title" style="margin-top:1rem">Mes questions (' + customs.length + ')</div>';
    html += '<div class="custom-q-list">';
    customs.forEach(q => {
      html += '<div class="custom-q-item" data-cqid="' + q.id + '">';
      html += '<div class="custom-q-text">' + q.q + '</div>';
      html += '<div class="custom-q-ans">' + q.a + '</div>';
      html += '<div class="custom-q-meta">' + q.cat + ' · ' + q.src + '</div>';
      html += '<button class="song-edit-btn cq-edit-btn" data-cqid="' + q.id + '">✏️</button>';
      html += '</div>';
    });
    html += '</div>';
  }

  return html;
}

function bindAddQuestionForm(main) {
  const saveBtn = document.getElementById('aqSaveBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const q = (document.getElementById('aqQuestion').value || '').trim();
    const a = (document.getElementById('aqAnswer').value || '').trim();
    const cat = document.getElementById('aqCat').value;
    const src = document.getElementById('aqSrc').value;
    if (!q || !a) { alert('Question et réponse obligatoires.'); return; }

    if (STATE.editingCustomQ) {
      await updateCustomQuestion(STATE.editingCustomQ.id, { q, a, cat, src });
    } else {
      await addCustomQuestion({ q, a, cat, src });
    }
    if (typeof SYNC !== 'undefined') SYNC.markDirty();
    STATE.customQuestions = await getAllCustomQuestions();
    STATE.editingCustomQ = null;
    STATE.showAddQuestion = true;
    render();
  });

  const cancelBtn = document.getElementById('aqCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    STATE.editingCustomQ = null;
    STATE.showAddQuestion = false;
    render();
  });

  const deleteBtn = document.getElementById('aqDeleteBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', async () => {
    if (confirm('Supprimer cette question ?')) {
      await deleteCustomQuestion(STATE.editingCustomQ.id);
      if (typeof SYNC !== 'undefined') SYNC.markDirty();
      STATE.customQuestions = await getAllCustomQuestions();
      STATE.editingCustomQ = null;
      render();
    }
  });

  main.querySelectorAll('.cq-edit-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.dataset.cqid;
    STATE.editingCustomQ = (STATE.customQuestions || []).find(q => q.id === id) || null;
    STATE.showAddQuestion = true;
    render();
    document.getElementById('addQForm') && document.getElementById('addQForm').scrollIntoView({ behavior:'smooth' });
  }));
}
