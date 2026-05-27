// ── SONGS.JS — Système de chants entièrement dynamique ───────────────────────
// Les chants sont ajoutés par l'utilisateur et stockés dans IndexedDB

const LEVELS = [
  { id:0, label:"Pas commencé", color:"#444",    icon:"○" },
  { id:1, label:"Découverte",   color:"#8B4513", icon:"◔" },
  { id:2, label:"En cours",     color:"#FF9800", icon:"◑" },
  { id:3, label:"Presque",      color:"#5a9fd4", icon:"◕" },
  { id:4, label:"Maîtrisé",     color:"#4CAF50", icon:"●" },
];
