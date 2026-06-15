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
  return String(s).toLowerCase()
    .replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae')
    .replace(/-/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return dp[m][n];
}

function wordMatch(u, t) {
  if (u === t) return true;
  if (t.length >= 4 && u.includes(t)) return true;
  if (u.length >= 4 && t.includes(u)) return true;
  const md = t.length <= 5 ? 1 : 2;
  return levenshtein(u, t) <= md;
}

function cleanFiliere(f) {
  return f.replace(/\([^)]*\)/g, '').trim();
}

function allWordsPresent(userWords, targetStr, minLen) {
  minLen = minLen || 3;
  const tw = normalize(targetStr).split(' ').filter(w => w.length >= minLen);
  if (!tw.length) return true;
  return tw.every(t => userWords.some(u => wordMatch(u, t)));
}

function wordRatio(userWords, targetStr, minLen) {
  minLen = minLen || 3;
  const tw = normalize(targetStr).split(' ').filter(w => w.length >= minLen);
  if (!tw.length) return 1;
  const h = tw.filter(t => userWords.some(u => wordMatch(u, t))).length;
  return h / tw.length;
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
  if (context === 'answer') return '<div class="answer-badge-wrap"><div class="badge-img">' + svg + '</div></div>';
  if (context === 'result') return '<div class="badge-img">' + svg + '</div>';
  if (context === 'stats') return '<div class="badge-img">' + svg + '</div>';
  if (context === 'recit') return '<div class="badge-img">' + svg + '</div>';
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

function emoji(p) { return p >= 80 ? '\u{1F3C6}' : p >= 60 ? '\u{1F4DA}' : '\u{1F4AA}'; }

// ── Circulaires : parsing + matching robuste ──────────────────────────────────
function parseCirc(q) {
  const surIdx = q.a.indexOf(' sur ');
  const pourIdx = q.a.lastIndexOf(' pour ');
  if (surIdx === -1 || pourIdx === -1) return null;
  const filiere = q.a.slice(pourIdx + 6).trim();
  const matCoul = q.a.slice(surIdx + 5, pourIdx).trim();
  // Une filière est "variable" si sa couleur dépend d'autre chose (pas une couleur fixe)
  const isVariable = /couleur|ufr/i.test(matCoul);
  return {
    id: q.id,
    insigne: q.a.slice(0, surIdx).trim(),
    matCoul: matCoul,
    filiere: filiere,
    filiereClean: cleanFiliere(filiere),
    isVariable: isVariable,
    full: q.a,
  };
}

// Liste des circulaires à COULEUR FIXE (pour le matching couleur strict)
function getCircList(type) {
  return ALL_QUESTIONS
    .filter(q => q.cat === ('Circulaire ' + type) && q.src === 'NATIONAL'
      && / sur /.test(q.a) && / pour /.test(q.a))
    .map(parseCirc)
    .filter(c => c && !c.isVariable);
}

// Liste des circulaires à COULEUR VARIABLE (PASS, LAS, DU, IUP, Communication, Écoles nationales)
function getCircVarList(type) {
  return ALL_QUESTIONS
    .filter(q => q.cat === ('Circulaire ' + type) && q.src === 'NATIONAL'
      && / sur /.test(q.a) && / pour /.test(q.a))
    .map(parseCirc)
    .filter(c => c && c.isVariable);
}

// Mots-clés indiquant que l'utilisateur précise d'où vient la couleur variable.
// Match exact ou inclusion uniquement (PAS de tolérance Levenshtein : "pass" ne doit
// pas être confondu avec "pays", etc.)
function mentionsColorSource(userWords) {
  const kw = ['filiere','majeure','discipline','matiere','choisie','pays','ecole',
              'rattachement','ufr','majoritaire','etudiee','sante'];
  return kw.some(k => userWords.some(u =>
    u === k || (k.length >= 4 && (u.includes(k) || k.includes(u) && u.length >= 4))
  ));
}

function filiereWordsCount(c) {
  return normalize(c.filiereClean).split(' ').filter(w => w.length >= 3).length;
}

// Ratio de match d'une filière, en gérant le "/" comme un OU
// "BUT/DUT" -> il suffit de citer "but" OU "dut" pour matcher à 100%
function filiereMatchRatio(userWords, filiereClean) {
  if (filiereClean.indexOf('/') !== -1) {
    const variants = filiereClean.split('/').map(v => v.trim()).filter(Boolean);
    let best = 0;
    for (const v of variants) best = Math.max(best, wordRatio(userWords, v, 2));
    return best;
  }
  return wordRatio(userWords, filiereClean, 3);
}
function filiereSpecificity(c) {
  if (c.filiereClean.indexOf('/') !== -1) {
    // nombre de mots du variant le plus court (pour départager)
    const variants = c.filiereClean.split('/').map(v => v.trim()).filter(Boolean);
    return Math.min(...variants.map(v => normalize(v).split(' ').filter(w => w.length >= 2).length));
  }
  return filiereWordsCount(c);
}

function checkCirc(input, type) {
  const circs = getCircList(type);
  const userWords = normalize(input).split(' ').filter(w => w.length >= 2);

  // Construire la liste des candidates à couleur FIXE avec leur score de filière
  const candidates = [];
  for (const c of circs) {
    const nWords = filiereSpecificity(c);
    if (nWords === 0) continue;
    const fr = filiereMatchRatio(userWords, c.filiereClean);
    if (fr >= 0.5) candidates.push({ c, fr, spec: nWords });
  }

  // Candidates à couleur VARIABLE (PASS, LAS, DU, IUP, etc.)
  const varCircs = getCircVarList(type);
  const varCandidates = [];
  for (const c of varCircs) {
    const ml = c.filiereClean.length <= 3 ? 2 : 3;
    const fr = wordRatio(userWords, c.filiereClean, ml);
    if (fr >= 0.99) varCandidates.push({ c, fr });
  }

  // 1. Essayer les filières à couleur fixe (priorité car plus strictes)
  candidates.sort((a, b) => {
    const aFull = a.fr >= 0.99 ? 1 : 0, bFull = b.fr >= 0.99 ? 1 : 0;
    if (aFull !== bFull) return bFull - aFull;
    if (b.spec !== a.spec) return b.spec - a.spec;
    return b.fr - a.fr;
  });
  let firstFiliere = candidates.length ? candidates[0].c.filiere : null;
  let lastInsigneOk = false, lastMatCoulOk = false;
  for (const cand of candidates) {
    const insigneOk = wordRatio(userWords, cand.c.insigne, 3) >= 0.5;
    const matCoulOk = allWordsPresent(userWords, cand.c.matCoul, 3);
    if (insigneOk && matCoulOk) return { ok: true, filiere: cand.c.filiere, circ: cand.c };
    lastInsigneOk = insigneOk; lastMatCoulOk = matCoulOk;
  }

  // 2. Essayer les filières à couleur variable
  //    Validation : insigne correct + mention d'où vient la couleur
  for (const cand of varCandidates) {
    const insigneOk = wordRatio(userWords, cand.c.insigne, 3) >= 0.4;
    const sourceOk = mentionsColorSource(userWords);
    if (insigneOk && sourceOk) return { ok: true, filiere: cand.c.filiere, circ: cand.c };
    if (!firstFiliere) {
      firstFiliere = cand.c.filiere;
      lastInsigneOk = insigneOk; lastMatCoulOk = sourceOk;
    }
  }

  if (!firstFiliere) return { ok: false, reason: 'filiere_inconnue' };
  return { ok: false, reason: 'incomplet', filiere: firstFiliere,
           insigneOk: lastInsigneOk, matCoulOk: lastMatCoulOk };
}

// ── State ─────────────────────────────────────────────────────────────────────
const STATE = {
  screen: 'home',
  questions: [], idx: 0, revealed: false,
  userInput: '', answerStatus: null,
  sessionScore: { correct: 0, partial: 0, wrong: 0 },
  sessionHistory: [],
  qstats: {}, sessions: [],
  filterSrc: 'ALL', filterCat: 'ALL', filterMode: 'normal',
  songFilterLevel: -1, songSearch: '', songEditingId: null, songOpenId: null,
  authMode: 'login',
  recitHistory: [], recitInput: '', recitResult: null,
  customQuestions: [],
  showAddQuestion: false,
  recitMode: 'libre',
  showCorrection: null,
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
  'Grands Singes':'#2a2a2a','Archivistes':'#003a4a','Insignes anciens':'#3a1a3a',
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
  else if (STATE.screen === 'contact') renderContact(main);

  // Footer (auteur + contact), masqué pendant le quiz
  if (STATE.screen !== 'quiz') {
    const footer = document.createElement('div');
    footer.className = 'app-footer';
    footer.innerHTML =
      '<span class="footer-author">Créé par VI VII, IPP</span>' +
      '<button class="footer-contact-btn" id="footerContactBtn">✉️ Contact / Feedback</button>';
    app.appendChild(footer);
    const fc = document.getElementById('footerContactBtn');
    if (fc) fc.addEventListener('click', () => { STATE.screen = 'contact'; render(); });
  }
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
  const fresh = shuffle(pool).filter(q => !recentIds.has(q.id));
  const recent = shuffle(pool).filter(q => recentIds.has(q.id));
  const combined = [...fresh, ...recent];

  STATE.questions = combined.slice(0, size);
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
  const openId = STATE.songOpenId || null;

  if (openId) {
    const opened = songs.find(s => s.id === openId);
    if (opened) {
      let html = '<div class="songs-wrap">';
      html += '<div class="song-detail">';
      html += '<div class="song-detail-title"><span>' + opened.title + '</span><button id="closeDetail">✕</button></div>';
      html += '<div class="add-q-field"><label>Paroles</label>';
      html += '<textarea class="add-q-input" id="songLyrics" rows="10" placeholder="Paroles...">' + (opened.lyrics || '') + '</textarea></div>';
      html += '<div class="add-q-field"><label>Notes</label>';
      html += '<textarea class="add-q-input" id="songNotes" rows="5" placeholder="Notes, astuces, mémo...">' + (opened.notes || '') + '</textarea></div>';
      html += '<div class="btn-row"><button class="btn-primary" id="saveSongDetail">Enregistrer</button>';
      html += '<button class="btn-ghost" id="cancelDetail">Annuler</button></div>';
      html += '</div></div>';
      main.innerHTML = html;

      $('closeDetail').addEventListener('click', () => { STATE.songOpenId = null; renderSongs(main); });
      $('cancelDetail').addEventListener('click', () => { STATE.songOpenId = null; renderSongs(main); });
      $('saveSongDetail').addEventListener('click', async () => {
        await updateSongFields(openId, {
          lyrics: $('songLyrics').value,
          notes:  $('songNotes').value,
        });
        if (typeof SYNC !== 'undefined') SYNC.markDirty();
        STATE.songOpenId = null;
        renderSongs(main);
      });
      return;
    }
  }

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
      const hasContent = s.lyrics || s.notes;
      html += '<div class="song-item" data-sid="' + s.id + '">';
      html += '<div class="song-left song-title-open" data-open="' + s.id + '" style="cursor:pointer;flex:1;min-width:0">';
      if (isEditing) {
        html += '<input class="song-edit-input" id="editInput_' + s.id + '" value="' + s.title.replace(/"/g,'&quot;') + '" autocomplete="off"/>';
      } else {
        html += '<div class="song-title">' + s.title + (hasContent ? ' <span style="color:#c9a96e;font-size:0.65rem">●</span>' : '') + '</div>';
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

main.querySelectorAll('.song-title-open').forEach(b => {
    let startY = 0;
    b.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    b.addEventListener('touchend', e => {
      if (Math.abs(e.changedTouches[0].clientY - startY) > 10) return; // scroll, on ignore
      if (STATE.songEditingId) return;
      e.stopPropagation();
      e.preventDefault();
      STATE.songOpenId = b.dataset.open;
      STATE.songEditingId = null;
      renderSongs(main);
    });
    b.addEventListener('click', e => {
      if (STATE.songEditingId) return;
      e.stopPropagation();
      STATE.songOpenId = b.dataset.open;
      STATE.songEditingId = null;
      renderSongs(main);
    });
  });

  main.querySelectorAll('.lvl-dot').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    await updateSongLevel(b.dataset.sid, parseInt(b.dataset.lvl));
    if (typeof SYNC !== 'undefined') SYNC.markDirty();
    renderSongs(main);
  }));

  main.querySelectorAll('.song-edit-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    STATE.songEditingId = b.dataset.sid;
    STATE.songOpenId = null;
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

// Couleurs d'affichage par nom de matière/couleur (arc-en-ciel)
const COLOR_HEX = {
  'Velours fuchsia':'#cc007a', 'Velours rouge':'#c0152a', 'Velours bordeaux':'#800020',
  'Velours marron':'#5C3317', 'Velours vert':'#2d8b2d', 'Velours bleu roy':'#00416A',
  'Velours violet':'#6a0dad', 'Velours rose':'#e87ab0', 'Velours blanc':'#e8e8e8',
  'Satin rouge':'#c0152a', 'Satin rouge et vert':'#9a4a1a', 'Satin rouge et bleu':'#7a2a6a',
  'Satin orange':'#cc6600', 'Satin jaune':'#d4c020', 'Satin vert clair':'#7acc7a',
  'Satin vert foncé':'#1a6b1a', 'Satin bleu':'#2266cc', 'Satin bleu roy et noir':'#1a2a5a',
  'Satin violet':'#6a0dad', 'Satin saumon':'#e89b7a', 'Satin blanc et rouge':'#d89a9a',
  'Satin blanc':'#e8e8e8', 'Satin argenté':'#b8b8c0', 'Satin gris':'#888888',
  'Satin marron':'#5C3317',
};
// Ordre arc-en-ciel pour le tri d'affichage
const COLOR_ORDER = [
  'fuchsia','rose','rouge','bordeaux','rouge et vert','rouge et bleu','saumon','orange',
  'marron','jaune','argenté','vert clair','vert','vert foncé','bleu','bleu roy','bleu roy et noir',
  'violet','blanc et rouge','blanc','gris',
];
function colorRank(matCoul) {
  const c = matCoul.replace(/^(Velours|Satin)\s+/i, '').toLowerCase();
  const i = COLOR_ORDER.indexOf(c);
  return i === -1 ? 999 : i;
}
function colorHex(matCoul) {
  if (COLOR_HEX[matCoul]) return COLOR_HEX[matCoul];
  // fallback : déduire du nom de couleur
  const c = matCoul.toLowerCase();
  if (c.includes('fuchsia')) return '#cc007a';
  if (c.includes('rose')) return '#e87ab0';
  if (c.includes('bordeaux')) return '#800020';
  if (c.includes('rouge')) return '#c0152a';
  if (c.includes('saumon')) return '#e89b7a';
  if (c.includes('orange')) return '#cc6600';
  if (c.includes('marron')) return '#5C3317';
  if (c.includes('jaune')) return '#d4c020';
  if (c.includes('argent')) return '#b8b8c0';
  if (c.includes('gris')) return '#888888';
  if (c.includes('vert')) return '#2d8b2d';
  if (c.includes('bleu')) return '#2266cc';
  if (c.includes('violet')) return '#6a0dad';
  if (c.includes('blanc')) return '#e8e8e8';
  return '#888888';
}

// Construit les groupes de couleurs pour un type donné, triés arc-en-ciel.
// Les filières à couleur variable sont regroupées dans un groupe spécial "Variable".
function buildCircGroups(type) {
  const circs = getCircList(type);
  const groups = {};
  for (const c of circs) {
    const key = c.matCoul;
    if (!groups[key]) groups[key] = { matCoul: key, hex: colorHex(key), filieres: [], variable: false };
    groups[key].filieres.push(c);
  }
  const ordered = Object.values(groups).sort((a, b) => colorRank(a.matCoul) - colorRank(b.matCoul));

  // Groupe variable (PASS, LAS, DU, IUP, Communication, Écoles nationales)
  const varCircs = getCircVarList(type);
  if (varCircs.length) {
    ordered.push({ matCoul: 'Variable', hex: 'VARIABLE', filieres: varCircs, variable: true });
  }
  return ordered;
}

function renderRecit(main) {
  const mode = STATE.recitMode || 'libre';
  let html = '<div class="recit-wrap">';
  html += '<div class="recit-tabs">';
  html += '<button class="recit-tab ' + (mode==='libre'?'active':'') + '" data-rmode="libre">Libre</button>';
  html += '<button class="recit-tab ' + (mode==='velours'?'active':'') + '" data-rmode="velours">Circ. Velours</button>';
  html += '<button class="recit-tab ' + (mode==='satin'?'active':'') + '" data-rmode="satin">Circ. Satin</button>';
  html += '</div>';

  if (mode === 'libre') html += renderRecitLibre();
  else html += renderRecitCirculaire(mode);

  html += '</div>';
  main.innerHTML = html;

  main.querySelectorAll('[data-rmode]').forEach(b => b.addEventListener('click', () => {
    STATE.recitMode = b.dataset.rmode;
    STATE.showCorrection = null;
    renderRecit(main);
  }));

  if (mode === 'libre') bindRecitLibre(main);
  else bindRecitCirculaire(main, mode);
}

function renderRecitLibre() {
  const history = STATE.recitHistory || [];
  let html = '';
  html += '<div class="recit-header"><div class="recit-title">Mode Récitation</div>';
  html += '<div class="recit-sub">Énonce n\'importe quel fait, insigne, circulaire…</div></div>';
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
      html += '</div>';
    }
  }

  if (history.length) {
    html += '<div class="section-label mt">Historique (' + history.length + ')</div><div class="recit-hist-list">';
    history.slice().reverse().forEach(h => {
      html += '<div class="recit-hist-item" style="border-color:' + (h.result.status==='correct'?'#2a5a2a':h.result.status==='partial'?'#4a3a00':'#3a2a00') + '">';
      html += '<div class="recit-hist-input">"' + h.input + '"</div>';
      html += '<div class="recit-hist-verdict" style="color:' + (h.result.status==='correct'?'#4CAF50':h.result.status==='partial'?'#FF9800':'#888') + '">' + (h.result.status==='correct'?'✓':h.result.status==='partial'?'~':'○') + '</div>';
      html += '</div>';
    });
    html += '</div><button class="btn-ghost btn-danger mt" id="recitClearHistBtn">🗑 Effacer</button>';
  }
  return html;
}

function renderRecitCirculaire(type) {
  const groups = buildCircGroups(type);
  const done = STATE['recitDone_' + type] || {};
  const total = groups.reduce((a, g) => a + g.filieres.length, 0);
  const totalDone = Object.keys(done).length;
  const matLabel = type === 'velours' ? 'Velours' : 'Satin';

  // Camembert : une tranche par filière NON FAITE, groupée par couleur
  const cx = 130, cy = 130, r = 120;
  let svgSlices = '';
  let startAngle = -Math.PI / 2;
  const remainingFilieres = [];
  groups.forEach(g => {
    g.filieres.forEach(c => {
      if (!done[c.filiere]) remainingFilieres.push({ hex: g.hex, filiere: c.filiere });
    });
  });
  const totalTranches = remainingFilieres.length;

  if (totalTranches === 0) {
    svgSlices = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1a5a1a" stroke="#4CAF50" stroke-width="2"/>';
    svgSlices += '<text x="' + cx + '" y="' + (cy+10) + '" text-anchor="middle" fill="#4CAF50" font-size="28">✓</text>';
  } else {
    const angleStep = (2 * Math.PI) / totalTranches;
    remainingFilieres.forEach(({ hex, filiere }) => {
      const endAngle = startAngle + angleStep;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const lg = angleStep > Math.PI ? 1 : 0;
      const fill = hex === 'VARIABLE' ? 'url(#rainbowGrad)' : hex;
      svgSlices += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + lg + ',1 ' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' Z" fill="' + fill + '" stroke="#0a0a0a" stroke-width="1.5"><title>' + filiere + '</title></path>';
      startAngle = endAngle;
    });
  }

  // Dégradé arc-en-ciel pour les tranches à couleur variable
  const svgDefs = '<defs><linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">'
    + '<stop offset="0%" stop-color="#e8003a"/>'
    + '<stop offset="20%" stop-color="#ff8c00"/>'
    + '<stop offset="40%" stop-color="#ffd400"/>'
    + '<stop offset="60%" stop-color="#2db82d"/>'
    + '<stop offset="80%" stop-color="#1e6fff"/>'
    + '<stop offset="100%" stop-color="#9b30ff"/>'
    + '</linearGradient></defs>';
  svgSlices = svgDefs + svgSlices;

  let html = '';
  html += '<div class="circ-progress">' + totalDone + ' / ' + total + ' filières récitées</div>';

  html += '<div class="circ-layout">';
  html += '<svg viewBox="0 0 260 260" class="circ-pie">' + svgSlices + '</svg>';

  // Légende : chaque couleur, son compteur, et les filières déjà récitées en dessous
  html += '<div class="circ-legend">';
  groups.forEach(g => {
    const remaining = g.filieres.filter(c => !done[c.filiere]).length;
    const isDone = remaining === 0;
    const colName = g.matCoul.replace(/^(Velours|Satin)\s+/i, '');
    const dotStyle = g.hex === 'VARIABLE'
      ? 'background:linear-gradient(135deg,#e8003a,#ff8c00,#ffd400,#2db82d,#1e6fff,#9b30ff);opacity:' + (isDone?'0.3':'1')
      : 'background:' + g.hex + ';opacity:' + (isDone?'0.3':'1');
    html += '<div class="circ-leg-block">';
    html += '<div class="circ-leg-item">';
    html += '<span class="circ-leg-dot" style="' + dotStyle + '"></span>';
    html += '<span class="circ-leg-name" style="color:' + (isDone?'#555':'#bbb') + '">' + colName + '</span>';
    html += '<span class="circ-leg-count" style="color:' + (isDone?'#4CAF50':'#c9a96e') + '">' + remaining + '</span>';
    html += '</div>';
    g.filieres.filter(c => done[c.filiere]).forEach(c => {
      html += '<div class="circ-done-item">✓ ' + c.filiere + '</div>';
    });
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  // Input
  html += '<div class="recit-input-area" style="margin-top:0.75rem">';
  html += '<div class="recit-sub" style="margin-bottom:0.4rem;font-size:0.78rem">Format : <em>insigne sur ' + matLabel + ' couleur pour Filière</em></div>';
  html += '<textarea class="answer-input" id="circInput" placeholder="ex: Caducée médecine sur ' + matLabel + ' rouge pour Médecine" rows="2">' + (STATE['circInput_'+type]||'') + '</textarea>';
  html += '<div class="btn-row"><button class="btn-primary" id="circCheckBtn">Vérifier ✓</button><button class="btn-ghost" id="circCorrectionBtn">📖 Correction</button></div>';
  html += '<div class="btn-row" style="margin-top:0.4rem"><button class="btn-ghost btn-danger" id="circResetBtn">🗑 Reset progression</button></div>';
  html += '</div>';

  if (STATE['circResult_'+type]) {
    const res = STATE['circResult_'+type];
    html += '<div class="recit-result-box" style="border-color:' + (res.ok?'#4CAF5044':'#f4433644') + ';margin-top:0.5rem">';
    html += '<div class="recit-verdict" style="color:' + (res.ok?'#4CAF50':'#f44336') + '">' + (res.ok?'✓ Correct ! (' + res.filiere + ')':'✗ ' + res.msg) + '</div>';
    html += '</div>';
  }

  // Sous-fenêtre Correction (modal)
  if (STATE.showCorrection === type) {
    const notDone = [];
    groups.forEach(g => g.filieres.forEach(c => { if (!done[c.filiere]) notDone.push(c); }));
    html += '<div class="modal-overlay" id="correctionOverlay">';
    html += '<div class="modal-box">';
    html += '<div class="modal-header"><span>📖 Correction — ' + (notDone.length) + ' restantes</span><button id="closeCorrection">✕</button></div>';
    html += '<div class="modal-body">';
    if (!notDone.length) {
      html += '<div style="text-align:center;color:#4CAF50;padding:1rem">🎯 Toutes les filières ont été récitées !</div>';
    } else {
      notDone.forEach(c => {
        html += '<div class="corr-item"><div class="corr-fil">' + c.filiere + '</div><div class="corr-full">' + c.full + '</div></div>';
      });
    }
    html += '</div></div></div>';
  }

  return html;
}

function bindRecitLibre(main) {
  const ta = $('recitInput');
  if (ta) {
    ta.addEventListener('input', e => { STATE.recitInput = e.target.value; });
    ta.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); doRecitCheck(main); } });
  }
  const checkBtn = $('recitCheckBtn');
  if (checkBtn) checkBtn.addEventListener('click', () => doRecitCheck(main));
  const clearBtn = $('recitClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => { STATE.recitInput=''; STATE.recitResult=null; renderRecit(main); });
  const histBtn = $('recitClearHistBtn');
  if (histBtn) histBtn.addEventListener('click', () => { STATE.recitHistory=[]; renderRecit(main); });
}

function doRecitCheck(main) {
  const input = (STATE.recitInput||'').trim();
  if (!input) return;
  const result = recitCheck(input);
  STATE.recitResult = { input, result };
  if (!STATE.recitHistory) STATE.recitHistory = [];
  STATE.recitHistory.push({ input, result });
  renderRecit(main);
}

function bindRecitCirculaire(main, type) {
  const checkBtn = $('circCheckBtn');
  if (checkBtn) checkBtn.addEventListener('click', () => {
    const ta = $('circInput');
    const input = (ta ? ta.value : '').trim();
    STATE['circInput_'+type] = input;
    if (!input) return;

    const res = checkCirc(input, type);
    if (res.ok) {
      if (!STATE['recitDone_'+type]) STATE['recitDone_'+type] = {};
      if (STATE['recitDone_'+type][res.filiere]) {
        STATE['circResult_'+type] = { ok:false, msg:'Déjà récité : ' + res.filiere };
      } else {
        STATE['recitDone_'+type][res.filiere] = true;
        STATE['circResult_'+type] = { ok:true, filiere: res.filiere };
        STATE['circInput_'+type] = '';
      }
    } else {
      let msg;
      if (res.reason === 'filiere_inconnue') msg = 'Filière non reconnue';
      else if (res.reason === 'incomplet') {
        const parts = [];
        if (!res.insigneOk) parts.push('insigne');
        if (!res.matCoulOk) parts.push('matière/couleur');
        msg = 'Incomplet pour « ' + res.filiere + ' » : vérifie ' + parts.join(' et ');
      } else msg = 'Pas reconnu';
      STATE['circResult_'+type] = { ok:false, msg };
    }
    renderRecit(main);
  });

  const corrBtn = $('circCorrectionBtn');
  if (corrBtn) corrBtn.addEventListener('click', () => {
    STATE.showCorrection = (STATE.showCorrection === type) ? null : type;
    renderRecit(main);
  });

  const closeCorr = $('closeCorrection');
  if (closeCorr) closeCorr.addEventListener('click', () => { STATE.showCorrection = null; renderRecit(main); });
  const overlay = $('correctionOverlay');
  if (overlay) overlay.addEventListener('click', e => {
    if (e.target === overlay) { STATE.showCorrection = null; renderRecit(main); }
  });

  const resetBtn = $('circResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('Remettre la progression à zéro ?')) {
      STATE['recitDone_'+type] = {};
      STATE['circResult_'+type] = null;
      STATE['circInput_'+type] = '';
      renderRecit(main);
    }
  });

  const ta = $('circInput');
  if (ta) {
    ta.addEventListener('input', e => { STATE['circInput_'+type] = e.target.value; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('circCheckBtn') && $('circCheckBtn').click(); }
    });
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

// ── CONTACT / FEEDBACK ────────────────────────────────────────────────────────
function renderContact(main) {
  let html = '<div class="account-wrap contact-wrap">';
  html += '<button class="btn-ghost contact-back" id="contactBack">← Retour</button>';
  html += '<div class="account-avatar">✉️</div>';
  html += '<div class="account-title">Contact / Feedback</div>';
  html += '<div class="account-subtitle">Une remarque, un bug, une question, une filière manquante ? Écris-moi, ça aide à améliorer l\'appli.</div>';
  html += '<div class="auth-form contact-form">';
  html += '<label class="contact-label">Prénom <span class="contact-req">*</span></label>';
  html += '<input class="auth-input" id="ctPrenom" type="text" placeholder="Ton prénom" autocomplete="given-name"/>';
  html += '<label class="contact-label">Nom de famille</label>';
  html += '<input class="auth-input" id="ctNom" type="text" placeholder="(optionnel)" autocomplete="family-name"/>';
  html += '<label class="contact-label">Surnom de faluche</label>';
  html += '<input class="auth-input" id="ctSurnom" type="text" placeholder="(optionnel)"/>';
  html += '<label class="contact-label">Filière</label>';
  html += '<input class="auth-input" id="ctFiliere" type="text" placeholder="(optionnel)"/>';
  html += '<label class="contact-label">Contact (mail, tel, réseau…)</label>';
  html += '<input class="auth-input" id="ctContact" type="text" placeholder="(optionnel, si tu veux une réponse)"/>';
  html += '<label class="contact-label">Raison du contact <span class="contact-req">*</span></label>';
  html += '<textarea class="auth-input contact-textarea" id="ctRaison" rows="5" placeholder="Décris ta remarque, ton bug, ta suggestion…"></textarea>';
  html += '<div class="auth-error" id="contactError"></div>';
  html += '<button class="btn-primary" id="contactSendBtn">✉️ Envoyer</button>';
  html += '<div class="account-offline-note">Le bouton ouvre ton application mail avec le message pré-rempli. Il ne te reste qu\'à appuyer sur « Envoyer ».</div>';
  html += '</div>';
  html += '</div>';
  main.innerHTML = html;

  $('contactBack').addEventListener('click', () => { STATE.screen = 'home'; render(); });

  $('contactSendBtn').addEventListener('click', () => {
    const prenom  = $('ctPrenom').value.trim();
    const nom     = $('ctNom').value.trim();
    const surnom  = $('ctSurnom').value.trim();
    const filiere = $('ctFiliere').value.trim();
    const contact = $('ctContact').value.trim();
    const raison  = $('ctRaison').value.trim();
    const errEl = $('contactError');
    errEl.textContent = '';

    if (!prenom) { errEl.textContent = 'Le prénom est obligatoire.'; $('ctPrenom').focus(); return; }
    if (!raison) { errEl.textContent = 'La raison du contact est obligatoire.'; $('ctRaison').focus(); return; }

    // Date et heure d'envoi
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    // Corps du mail
    const lines = [
      'Date et heure d\'envoi : ' + dateStr + ' à ' + timeStr,
      '',
      'Prénom : ' + prenom,
      'Nom de famille : ' + (nom || '(non renseigné)'),
      'Surnom de faluche : ' + (surnom || '(non renseigné)'),
      'Filière : ' + (filiere || '(non renseignée)'),
      'Contact : ' + (contact || '(non renseigné)'),
      '',
      'Raison du contact :',
      raison,
    ];
    const body = lines.join('\n');
    const subject = 'report Cherevi';
    const mailto = 'mailto:lucas.jacquot@estaca.eu'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    // Ouvre l'application mail
    window.location.href = mailto;

    // Confirmation visuelle
    const btn = $('contactSendBtn');
    btn.textContent = '✅ Mail ouvert — appuie sur Envoyer';
    setTimeout(() => { if ($('contactSendBtn')) $('contactSendBtn').textContent = '✉️ Envoyer'; }, 4000);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await openDB();
  if (typeof AUTH !== 'undefined') {
    await AUTH.load();
    // On ne vérifie la validité de la session auprès du serveur QUE si on a du réseau.
    // Hors ligne, on conserve la session locale telle quelle : l'utilisateur reste
    // connecté et la revalidation/refresh se fera automatiquement au retour en ligne.
    if (AUTH.isLoggedIn() && navigator.onLine) {
      const user = await SB.getUser().catch(() => undefined);
      // user === null  -> le serveur a répondu mais le token est invalide  -> on tente un refresh
      // user === undefined -> le fetch a échoué (réseau capricieux) -> on NE déconnecte PAS
      if (user === null || (user && user.error)) {
        const refreshed = await AUTH.refresh();
        if (!refreshed) { AUTH.user = null; AUTH.token = null; AUTH.refreshToken = null; AUTH.save(); }
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
      // Au cas où le token aurait expiré, on le rafraîchit avant de tirer les données
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
