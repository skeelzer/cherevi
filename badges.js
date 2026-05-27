// ── BADGES.JS — Photos réelles uniquement ────────────────────────────────────
// Seules les images locales (dossier badges/) et faluche.info confirmées sont utilisées.
// Aucun SVG.

const BADGE_SVG = {
  // ── Photos locales (offline) ──────────────────────────────────────────────
  abeille:            '<img src="badges/abeille.jpg">',
  bacchus:            '<img src="badges/bacchus_perso.jpg">',
  chouette_bicephale: '<img src="badges/chouette_bicephale.jpg">',
  cor_chasse:         '<img src="badges/cor_de_chasse.jpg">',
  globe:              '<img src="badges/globe.jpg">',
  parapluie:          '<img src="badges/parapluie_perso.jpg">',
  parapluie_ouvert:   '<img src="badges/parapluie_perso.jpg">',
  sou_troue:          '<img src="badges/sou_troue.jpg">',
  spheroide:          '<img src="badges/spheroide.jpg">',
  tortue:             '<img src="badges/tortue.jpg">',
  volant:             '<img src="badges/volant.jpg">',
};

// Map question id -> badge key
// Seules les questions avec une vraie photo sont mappées
const BADGE_MAP = {
  // Circulaires (photo dans la réponse)
  'cv4': 'spheroide',
  'cv8': 'chouette_bicephale',
  'cs15':'chouette_bicephale',
  'cs20':'globe',

  // Insignes personnels (photo dans la question)
  // (chameau, nounours, feuille de vigne, étoile/foudre → pas de photo, pas mappés)

  // Insignes GM (photo dans la question)
  'gm3': 'bacchus',
  'gm4': 'bacchus',
  'gm11':'cor_chasse',
  'gm12':'cor_chasse',
  'gm18':'parapluie_ouvert',
  'gm19':'parapluie',
  'gm23':'sou_troue',
  'gm24':'sou_troue',
  'gm25':'tortue',
  'gm26':'volant',
  'gm28':'abeille',

  // Velours/rubans
  'v1':  'abeille',
  'v4':  'abeille',
  'v5':  'abeille',
  'v6':  'tortue',
  'v7':  'tortue',
};
