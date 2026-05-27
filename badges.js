// ── BADGES.JS — SVG insignes embarqués, dessinés d'après le code national ─────
// Chaque SVG est inline, fond transparent, trait blanc/doré, 80×80px viewBox

const BADGE_SVG = {

// ─── CADUCÉE MÉDECINE (bâton d'Asclépios : un serpent enroulé) ────────────────
caducee_medecine: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="10" x2="40" y2="72" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 18 C55 22, 55 32, 40 36 C25 40, 25 50, 40 54" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="34" y1="10" x2="46" y2="10" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="40" cy="8" rx="5" ry="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── CADUCÉE DE MERCURE (bâton ailé, deux serpents) ──────────────────────────
caducee_mercure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="14" x2="40" y2="72" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 26 C54 28,54 40,40 42 C26 44,26 56,40 58" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M40 26 C26 28,26 40,40 42 C54 44,54 56,40 58" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M30 14 Q40 8 50 14" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="28" y1="18" x2="30" y2="14" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="18" x2="50" y2="14" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── CADUCÉE PHARMACIE (coupe d'Hygie : coupe avec serpent) ──────────────────
caducee_pharmacie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M30 28 Q28 50 32 68 L48 68 Q52 50 50 28 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="26" y1="28" x2="54" y2="28" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M44 22 C56 26,54 42,44 44 C38 45,36 40,40 36" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="44" cy="20" r="3" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── GLAIVE ET BALANCE (droit) ────────────────────────────────────────────────
glaive_balance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="8" x2="40" y2="72" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="18" y1="28" x2="62" y2="28" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="18" y1="28" x2="18" y2="46" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="28" x2="62" y2="46" stroke="#c9a96e" stroke-width="2"/>
  <path d="M10 46 Q18 42 26 46" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M54 46 Q62 42 70 46" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="34" y1="8" x2="46" y2="8" stroke="#c9a96e" stroke-width="2.5"/>
  <polygon points="40,68 36,58 44,58" fill="#c9a96e"/>
</svg>`,

// ─── ANKH / CROIX D'ÂNKH (sage-femme) ────────────────────────────────────────
ankh: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="28" rx="12" ry="16" fill="none" stroke="#c9a96e" stroke-width="3"/>
  <line x1="40" y1="44" x2="40" y2="74" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
  <line x1="22" y1="52" x2="58" y2="52" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
</svg>`,

// ─── MOLAIRE (chirurgie dentaire) ─────────────────────────────────────────────
molaire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M20 24 C18 18,24 12,32 16 C36 10,44 10,48 16 C56 12,62 18,60 24 C64 30,62 52,56 64 L48 64 C46 58,44 52,40 50 C36 52,34 58,32 64 L24 64 C18 52,16 30,20 24 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
</svg>`,

// ─── ÉTOILE ET FOUDRE (ingénieurs) ───────────────────────────────────────────
etoile_foudre: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <polygon points="40,8 44,28 64,28 48,40 54,60 40,48 26,60 32,40 16,28 36,28" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <polyline points="46,34 36,46 42,46 34,62" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

// ─── SQUELETTE / TÊTE DE MORT (PASS, études courtes santé) ───────────────────
tete_de_mort: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="30" rx="20" ry="22" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="32" cy="28" rx="5" ry="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="48" cy="28" rx="5" ry="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M30 52 L30 62 L50 62 L50 52" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="35" y1="52" x2="35" y2="62" stroke="#c9a96e" stroke-width="2"/>
  <line x1="40" y1="52" x2="40" y2="62" stroke="#c9a96e" stroke-width="2"/>
  <line x1="45" y1="52" x2="45" y2="62" stroke="#c9a96e" stroke-width="2"/>
  <path d="M28 44 Q40 50 52 44" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── CHOUETTE BICÉPHALE (prépas) ──────────────────────────────────────────────
chouette_bicephale: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="26" cy="32" rx="14" ry="18" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="54" cy="32" rx="14" ry="18" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="21" cy="28" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="31" cy="28" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="49" cy="28" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="59" cy="28" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <polygon points="26,36 22,42 30,42" fill="#c9a96e"/>
  <polygon points="54,36 50,42 58,42" fill="#c9a96e"/>
  <line x1="26" y1="50" x2="54" y2="50" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="26" y1="50" x2="20" y2="64" stroke="#c9a96e" stroke-width="2"/>
  <line x1="26" y1="50" x2="32" y2="64" stroke="#c9a96e" stroke-width="2"/>
  <line x1="54" y1="50" x2="48" y2="64" stroke="#c9a96e" stroke-width="2"/>
  <line x1="54" y1="50" x2="60" y2="64" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── SPHÉNOÏDE (ostéopathie) ─────────────────────────────────────────────────
spheroide: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="38" rx="22" ry="14" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="18" y1="38" x2="8" y2="28" stroke="#c9a96e" stroke-width="2"/>
  <line x1="18" y1="38" x2="8" y2="48" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="38" x2="72" y2="28" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="38" x2="72" y2="48" stroke="#c9a96e" stroke-width="2"/>
  <line x1="40" y1="24" x2="34" y2="12" stroke="#c9a96e" stroke-width="2"/>
  <line x1="40" y1="24" x2="46" y2="12" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="40" cy="38" rx="10" ry="6" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── TÊTE DE CHEVAL (vétérinaire) ─────────────────────────────────────────────
tete_cheval: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M44 10 C60 10,68 22,66 36 C64 46,56 52,46 54 C40 56,30 58,24 66 L20 66 C26 56,30 48,28 40 C24 28,28 16,44 10 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M44 10 C42 6,46 4,50 8" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="58" cy="24" r="3" fill="#c9a96e"/>
  <path d="M36 42 Q40 44 44 42" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── PARAPLUIE (sciences po) ─────────────────────────────────────────────────
parapluie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M12 40 Q40 6 68 40 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="40" y1="40" x2="40" y2="68" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M40 68 Q46 68 46 62" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 40 Q24 50 30 50 Q36 50 36 40" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <path d="M44 40 Q44 50 50 50 Q56 50 56 40" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── COQ (sports) ─────────────────────────────────────────────────────────────
coq: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="46" rx="18" ry="22" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="40" cy="22" r="12" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M46 16 C54 10,60 12,56 20" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M46 18 C52 14,56 16,53 22" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <polygon points="36,28 32,34 40,32" fill="#c9a96e"/>
  <line x1="28" y1="68" x2="22" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="28" y1="68" x2="32" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="68" x2="48" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="68" x2="56" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="36" cy="18" r="2" fill="#c9a96e"/>
</svg>`,

// ─── CASQUE DE PÉRICLÈS (histoire) ────────────────────────────────────────────
casque_pericles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M18 44 Q18 16 40 12 Q62 16 62 44 L58 44 Q56 28 40 22 Q24 28 22 44 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <rect x="14" y="44" width="52" height="6" rx="3" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M28 50 L24 68" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M52 50 L56 68" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="24" y1="68" x2="56" y2="68" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M36 12 Q40 6 44 12" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── LIVRE OUVERT ET PLUME (lettres/langues) ──────────────────────────────────
livre_plume: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M40 18 Q26 16 14 20 L14 62 Q26 58 40 60 Q54 58 66 62 L66 20 Q54 16 40 18 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="40" y1="18" x2="40" y2="60" stroke="#c9a96e" stroke-width="2"/>
  <line x1="20" y1="28" x2="36" y2="26" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="20" y1="35" x2="36" y2="33" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="20" y1="42" x2="36" y2="40" stroke="#c9a96e" stroke-width="1.5"/>
  <path d="M58 20 C70 16,72 28,64 32 C60 34,56 30,58 26 L68 14" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="58" y1="26" x2="52" y2="48" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,

// ─── LYRE (musique) ───────────────────────────────────────────────────────────
lyre: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M24 52 C20 40,20 24,30 16 Q40 10 50 16 C60 24,60 40,56 52" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="24" y1="52" x2="56" y2="52" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="30" y1="52" x2="30" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="52" x2="50" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="68" x2="50" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="34" y1="28" x2="34" y2="52" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="40" y1="22" x2="40" y2="52" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="46" y1="28" x2="46" y2="52" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── GRAPPE DE RAISIN (œnologie) ──────────────────────────────────────────────
grappe_raisin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="8" x2="40" y2="22" stroke="#c9a96e" stroke-width="2"/>
  <path d="M40 14 C32 10,24 14,24 14" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <circle cx="40" cy="28" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="28" cy="34" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="52" cy="34" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="34" cy="46" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="46" cy="46" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="40" cy="58" r="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── PALETTE ET PINCEAU (beaux-arts) ─────────────────────────────────────────
palette_pinceau: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M20 40 Q18 22,32 16 Q46 10,56 20 Q66 30,60 44 Q54 58,40 60 Q32 60,30 54 C28 50,32 46,30 44 Q26 42,20 40 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="30" cy="28" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="46" cy="20" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="56" cy="34" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="50" cy="50" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="16" y1="64" x2="30" y2="50" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="14" y1="68" x2="18" y2="62" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
</svg>`,

// ─── ÉQUERRE ET COMPAS (architecture) ────────────────────────────────────────
equerre_compas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <polyline points="18,66 18,18 66,66" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="18" y1="42" x2="42" y2="42" stroke="#c9a96e" stroke-width="2"/>
  <line x1="40" y1="14" x2="26" y2="66" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="40" y1="14" x2="54" y2="66" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="30" y1="54" x2="50" y2="54" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── MASQUE DE COMÉDIE (arts du spectacle) ────────────────────────────────────
masque_comedie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="30" cy="36" rx="18" ry="22" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="55" cy="38" rx="16" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="26" cy="30" rx="4" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="34" cy="30" rx="4" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M24 42 Q30 48 36 42" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="51" cy="34" rx="4" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="59" cy="34" rx="4" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M49 44 Q55 38 61 44" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── BACCHUS (insigne GM) ─────────────────────────────────────────────────────
bacchus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="44" rx="22" ry="24" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M32 20 C28 14,24 10,26 8 C36 4,44 4,54 8 C56 10,52 14,48 20" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="40" cy="20" rx="8" ry="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="40" cy="44" rx="14" ry="10" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="30" y1="60" x2="26" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="60" x2="54" y2="70" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── PENDU / POTENCE (marié) ──────────────────────────────────────────────────
pendu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <polyline points="20,72 20,12 52,12 52,22" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="20" y1="36" x2="36" y2="36" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="22" x2="52" y2="28" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="52" cy="34" r="6" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="52" y1="40" x2="50" y2="52" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="40" x2="54" y2="52" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="44" x2="44" y2="40" stroke="#c9a96e" stroke-width="2"/>
  <line x1="54" y1="44" x2="60" y2="40" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="52" x2="48" y2="62" stroke="#c9a96e" stroke-width="2"/>
  <line x1="54" y1="52" x2="56" y2="62" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── CHAMEAU ──────────────────────────────────────────────────────────────────
chameau: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M10 58 L10 46 Q10 36,20 34 L24 28 Q24 18,32 18 Q38 18,38 26 L38 30 Q44 26,52 28 Q58 30,58 38 L58 28 Q58 18,66 18 Q70 18,70 24 L70 34 Q72 36,72 46 L72 58" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 34 Q32 30,38 30 Q44 32,52 28" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="20" y1="58" x2="18" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="58" x2="28" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="58" x2="50" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="58" x2="60" y2="70" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── FAUX (médecin de garde, décès patient) ───────────────────────────────────
faux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="50" y1="8" x2="18" y2="72" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="44" y1="18" x2="50" y2="8" stroke="#c9a96e" stroke-width="2"/>
  <path d="M50 8 C72 12,76 32,58 40 C46 46,32 42,28 54" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
</svg>`,

// ─── ABEILLE (associative / cursus exemplaire) ────────────────────────────────
abeille: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="46" rx="14" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="28" y1="40" x2="52" y2="40" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="26" y1="50" x2="54" y2="50" stroke="#c9a96e" stroke-width="1.5"/>
  <ellipse cx="40" cy="26" rx="8" ry="8" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M28 32 C20 22,16 12,24 10" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
  <path d="M52 32 C60 22,64 12,56 10" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
  <line x1="36" y1="66" x2="32" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="44" y1="66" x2="48" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="34" y1="23" x2="46" y2="23" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── TORTUE (hébergeur) ───────────────────────────────────────────────────────
tortue: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="42" rx="24" ry="18" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="40" cy="42" r="10" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <path d="M32 32 L36 42 L40 32 L44 42 L48 32" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <ellipse cx="40" cy="24" rx="6" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="16" y1="40" x2="8" y2="34" stroke="#c9a96e" stroke-width="2"/>
  <line x1="16" y1="46" x2="8" y2="52" stroke="#c9a96e" stroke-width="2"/>
  <line x1="64" y1="40" x2="72" y2="34" stroke="#c9a96e" stroke-width="2"/>
  <line x1="64" y1="46" x2="72" y2="52" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="60" x2="26" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="60" x2="54" y2="70" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── GRENOUILLE (sociologie / élu UFR) ───────────────────────────────────────
grenouille: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="46" rx="20" ry="16" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="28" cy="28" r="8" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="52" cy="28" r="8" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="26" cy="26" r="3" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="50" cy="26" r="3" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M32 50 Q40 56 48 50" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="20" y1="58" x2="10" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="20" y1="58" x2="14" y2="70" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="60" y1="58" x2="70" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="60" y1="58" x2="66" y2="70" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── POULE ────────────────────────────────────────────────────────────────────
poule: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="50" rx="20" ry="16" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="52" cy="26" r="12" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M56 18 C62 12,66 14,64 20" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M58 16 C62 10,65 12,63 17" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <polygon points="48,30 44,36 52,36" fill="#c9a96e"/>
  <circle cx="56" cy="22" r="2" fill="#c9a96e"/>
  <line x1="30" y1="66" x2="24" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="66" x2="34" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="66" x2="46" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="66" x2="54" y2="76" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── VOLANT (conducteur) ──────────────────────────────────────────────────────
volant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="28" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="40" cy="40" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="40" y1="30" x2="40" y2="12" stroke="#c9a96e" stroke-width="2"/>
  <line x1="40" y1="50" x2="40" y2="68" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="40" x2="12" y2="40" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="40" x2="68" y2="40" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── COR DE CHASSE ────────────────────────────────────────────────────────────
cor_chasse: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M16 44 C16 28,28 18,40 20 C52 22,60 32,60 44 C60 56,52 66,40 66 C28 66,16 60,16 44 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M38 20 L38 10 L62 10 L62 36" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="40" cy="44" r="10" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="62" y1="10" x2="70" y2="14" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="10" x2="68" y2="6" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── PARAPLUIE OUVERT (a vomi dans sa faluche) ────────────────────────────────
parapluie_ouvert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M10 38 Q40 4 70 38 Z" fill="#c9a96e22" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="40" y1="38" x2="40" y2="66" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M40 66 Q46 66 46 60" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M22 38 Q22 48 28 48 Q34 48 34 38" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
  <path d="M46 38 Q46 48 52 48 Q58 48 58 38" fill="none" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── BOUTEILLE DE BORDEAUX ────────────────────────────────────────────────────
bouteille_bordeaux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect x="30" y="36" width="20" height="36" rx="4" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M30 36 C28 30,26 24,30 20 L30 14 L50 14 L50 20 C54 24,52 30,50 36" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="34" y1="14" x2="46" y2="14" stroke="#c9a96e" stroke-width="2"/>
  <line x1="36" y1="14" x2="36" y2="8" stroke="#c9a96e" stroke-width="2"/>
  <line x1="44" y1="14" x2="44" y2="8" stroke="#c9a96e" stroke-width="2"/>
  <line x1="30" y1="50" x2="50" y2="50" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── SOU TROUÉ ────────────────────────────────────────────────────────────────
sou_troue: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="28" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="40" cy="40" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
</svg>`,

// ─── FEUILLE DE VIGNE ─────────────────────────────────────────────────────────
feuille_vigne: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M40 12 C50 12,66 20,66 36 C66 52,52 62,40 68 C28 62,14 52,14 36 C14 20,30 12,40 12 Z" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <line x1="40" y1="12" x2="40" y2="68" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="40" y1="36" x2="18" y2="24" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="40" y1="36" x2="62" y2="24" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="40" y1="50" x2="22" y2="56" stroke="#c9a96e" stroke-width="1.5"/>
  <line x1="40" y1="50" x2="58" y2="56" stroke="#c9a96e" stroke-width="1.5"/>
</svg>`,

// ─── SINGE (quémandeur) ───────────────────────────────────────────────────────
singe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="36" rx="18" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="24" cy="28" rx="7" ry="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="56" cy="28" rx="7" ry="6" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="34" cy="32" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="46" cy="32" r="4" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M34 44 Q40 50 46 44" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <line x1="28" y1="56" x2="22" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="56" x2="58" y2="70" stroke="#c9a96e" stroke-width="2"/>
  <path d="M52 56 C62 52,70 56,68 64" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
</svg>`,

// ─── MAMMOUTH ─────────────────────────────────────────────────────────────────
mammouth: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="38" cy="46" rx="24" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="52" cy="26" r="14" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M44 36 C44 46,36 50,30 46" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M38 40 C36 52,26 58,20 52" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
  <line x1="46" y1="18" x2="42" y2="10" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="58" y1="16" x2="62" y2="8" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="56" cy="22" r="2.5" fill="#c9a96e"/>
  <line x1="22" y1="64" x2="18" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="34" y1="66" x2="32" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="50" y1="64" x2="48" y2="74" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── CLÉ DE SOL ───────────────────────────────────────────────────────────────
cle_sol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M44 10 C44 10,52 16,52 26 C52 36,44 40,44 48 C44 56,48 62,44 70 C40 78,34 72,36 66" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M44 36 C36 30,28 32,28 40 C28 48,36 52,44 48" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M36 66 C30 64,28 68,32 70 C38 72,44 66,40 62 L36 50" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
</svg>`,

// ─── ANNEAUX OLYMPIQUES ───────────────────────────────────────────────────────
anneaux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="20" cy="36" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="40" cy="36" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="60" cy="36" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="30" cy="50" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
</svg>`,

// ─── COQ (grand maître) ───────────────────────────────────────────────────────
// (même que coq ci-dessus, alias)

// ─── PACHYDERME (éléphant) ────────────────────────────────────────────────────
pachyderme: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="46" rx="26" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="54" cy="26" r="16" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <path d="M40 38 C40 50,34 60,26 64 C22 66,18 62,22 58 C26 54,30 50,30 44" fill="none" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="58" y1="14" x2="56" y2="8" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="60" cy="22" r="2.5" fill="#c9a96e"/>
  <line x1="22" y1="66" x2="18" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="32" y1="66" x2="30" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="52" y1="66" x2="50" y2="76" stroke="#c9a96e" stroke-width="2"/>
  <line x1="62" y1="64" x2="62" y2="74" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── FOURCHETTE ───────────────────────────────────────────────────────────────
fourchette: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="40" x2="40" y2="72" stroke="#c9a96e" stroke-width="3" stroke-linecap="round"/>
  <line x1="28" y1="10" x2="28" y2="36" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="36" y1="10" x2="36" y2="36" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="44" y1="10" x2="44" y2="36" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="52" y1="10" x2="52" y2="36" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M28 36 Q40 44 52 36" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── PLUME / ÉPÉE (insigne partenaire) ────────────────────────────────────────
epee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="8" x2="40" y2="62" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="40,8 36,20 44,20" fill="#c9a96e"/>
  <line x1="26" y1="52" x2="54" y2="52" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M40 62 C36 66,34 72,40 72 C46 72,44 66,40 62 Z" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── FLÈCHE (éjaculateur précoce) ─────────────────────────────────────────────
fleche: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="14" y1="60" x2="66" y2="20" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="66,20 52,22 60,34" fill="#c9a96e"/>
  <path d="M14 60 L18 48 L26 56 Z" fill="#c9a96e"/>
</svg>`,

// ─── ÉPI DE BLÉ (radin) ──────────────────────────────────────────────────────
epi_ble: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <line x1="40" y1="10" x2="40" y2="72" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="40" cy="18" rx="6" ry="9" fill="none" stroke="#c9a96e" stroke-width="2" transform="rotate(-15,40,18)"/>
  <ellipse cx="40" cy="28" rx="6" ry="9" fill="none" stroke="#c9a96e" stroke-width="2" transform="rotate(15,40,28)"/>
  <ellipse cx="40" cy="38" rx="6" ry="9" fill="none" stroke="#c9a96e" stroke-width="2" transform="rotate(-15,40,38)"/>
  <ellipse cx="40" cy="48" rx="6" ry="9" fill="none" stroke="#c9a96e" stroke-width="2" transform="rotate(15,40,48)"/>
  <line x1="34" y1="70" x2="40" y2="72" stroke="#c9a96e" stroke-width="2"/>
  <line x1="46" y1="70" x2="40" y2="72" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── NOUNOURS ─────────────────────────────────────────────────────────────────
nounours: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="44" r="22" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="24" cy="24" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="56" cy="24" r="10" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="32" cy="40" r="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="48" cy="40" r="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <ellipse cx="40" cy="50" rx="8" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M34 54 Q40 60 46 54" fill="none" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

// ─── COCHON ───────────────────────────────────────────────────────────────────
cochon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="46" rx="24" ry="20" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <circle cx="52" cy="24" r="14" fill="none" stroke="#c9a96e" stroke-width="2.5"/>
  <ellipse cx="52" cy="28" rx="7" ry="5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="49" cy="28" r="1.5" fill="#c9a96e"/>
  <circle cx="55" cy="28" r="1.5" fill="#c9a96e"/>
  <circle cx="47" cy="20" r="2.5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <circle cx="56" cy="18" r="2.5" fill="none" stroke="#c9a96e" stroke-width="2"/>
  <path d="M62 16 C68 12,72 18,68 22" fill="none" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="64" x2="20" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="36" y1="66" x2="34" y2="74" stroke="#c9a96e" stroke-width="2"/>
  <line x1="54" y1="64" x2="52" y2="74" stroke="#c9a96e" stroke-width="2"/>
</svg>`,

};

// Alias
BADGE_SVG['coq'] = BADGE_SVG['coq'] || BADGE_SVG['abeille']; // fallback

// Map question id / keyword → badge key
const BADGE_MAP = {
  // circulaires
  'cv3': 'caducee_medecine',
  'cv4': 'spheroide',
  'cv5': 'tete_de_mort', // ciseaux → pas de SVG dédié
  'cv7': 'caducee_pharmacie',
  'cv8': 'chouette_bicephale',
  'cv9': 'ankh',
  'cv11':'tete_cheval',
  'cv17':'caducee_mercure',
  'cv18':'tete_de_mort',
  'cs1': 'glaive_balance',
  'cs2': 'etoile_foudre',
  'cs4': 'caducee_mercure',
  'cs6': 'livre_plume',  // plume
  'cs7': 'lyre',
  'cs8': 'grappe_raisin',
  'cs11':'parapluie',
  'cs13':'equerre_compas',
  'cs15':'chouette_bicephale',
  'cs16':'coq',
  'cs17':'casque_pericles',
  'cs20':'lyre', // globe → pas de svg
  'cs21':'casque_pericles',
  'cs22':'grenouille',
  'cs24':'masque_comedie',
  'cs28':'palette_pinceau',
  // insignes perso
  'ip1': 'chameau',
  'ip2': 'chameau',
  'ip7': 'pendu',
  'ip9': 'bacchus',
  'ip14':'feuille_vigne',
  'ip17':'nounours',
  'ip19':'etoile_foudre',
  // insignes GM
  'gm1': 'anneaux',
  'gm3': 'bacchus',
  'gm5': 'bouteille_bordeaux',
  'gm9': 'coq',
  'gm11':'cor_chasse',
  'gm13':'parapluie_ouvert',
  'gm15':'fourchette',
  'gm17':'pachyderme',
  'gm18':'parapluie_ouvert',
  'gm19':'poule',
  'gm21':'singe',
  'gm23':'sou_troue',
  'gm25':'tortue',
  'gm26':'volant',
  'gm27':'cle_sol',
  'gm28':'mammouth',
  // insignes partenaire
  'part1':'epee',
  'part2':'epee',
  // velours/rubans
  'v1':  'faux',
  'v4':  'grenouille',
  'v5':  'grenouille',
  'v6':  'tortue',
  'v7':  'tortue',
  // cursus
  'cu1': 'abeille', // étoile dorée → abeille comme placeholder déco
  'cu12':'abeille',
  // potager
  'pot1':'epi_ble',  // carotte → pas de SVG dédié, epi_ble comme légume
  // partenaire
};
