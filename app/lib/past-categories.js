// Categorías de los streams de antes de que la página empezara a registrarlas
// (octubre 2026). Sacadas de los capítulos de cada VOD en Twitch.
// Cada VOD: lista de [categoría, segundos] en orden; null = el resto del stream.

const OVERWATCH = { id: "515025", name: "Overwatch" };
const PERSONA_5_ROYAL = { id: "511864", name: "Persona 5 Royal" };
const JUST_CHATTING = { id: "509658", name: "Just Chatting" };
const FORTNITE = { id: "33214", name: "Fortnite" };
const COZY_CLEANER = { id: "1631375188", name: "Cozy Cleaner" };
const JIGSAW_PUZZLE_DREAMS = { id: "1422832474", name: "Jigsaw Puzzle Dreams" };
const DISNEY_DREAMLIGHT_VALLEY = { id: "1515862749", name: "Disney Dreamlight Valley" };
const QUARANTINE_ZONE = { id: "569438345", name: "Quarantine Zone: The Last Check" };
const READY_OR_NOT = { id: "511701", name: "Ready or Not" };
const PACK_A_PLUSH = { id: "2144413261", name: "Pack A Plush!" };
const ANIIMO = { id: "1267582829", name: "Aniimo" };

const PAST_CATEGORIES = {
  "2889139397": [[OVERWATCH, null]],
  "2890017286": [[OVERWATCH, null]],
  "2890998367": [
    [PERSONA_5_ROYAL, null],
    [JUST_CHATTING, 814],
    [PERSONA_5_ROYAL, 6000],
    [FORTNITE, 7860],
    [PERSONA_5_ROYAL, 14340]
  ],
  "2892789011": [
    [COZY_CLEANER, null],
    [JUST_CHATTING, 277],
    [JIGSAW_PUZZLE_DREAMS, 5940]
  ],
  "2893642267": [[OVERWATCH, null]],
  "2895369747": [[OVERWATCH, null]],
  "2896249807": [[OVERWATCH, null]],
  "2897231721": [[PERSONA_5_ROYAL, null]],
  "2899898333": [[OVERWATCH, null]],
  "2900761514": [[OVERWATCH, null]],
  "2901625509": [[OVERWATCH, null]],
  "2902505415": [
    [JUST_CHATTING, null],
    [DISNEY_DREAMLIGHT_VALLEY, 1172],
    [QUARANTINE_ZONE, 14340],
    [JIGSAW_PUZZLE_DREAMS, 5940]
  ],
  "2903484702": [
    [PERSONA_5_ROYAL, null],
    [OVERWATCH, 2068],
    [PERSONA_5_ROYAL, 14880]
  ],
  "2905275573": [[OVERWATCH, null]],
  "2906131690": [[OVERWATCH, null]],
  "2906993471": [[OVERWATCH, null]],
  "2907854958": [[READY_OR_NOT, null]],
  "2909725449": [[PERSONA_5_ROYAL, null]],
  "2911521183": [[OVERWATCH, null]],
  "2912394281": [[OVERWATCH, null]],
  "2913266600": [
    [PACK_A_PLUSH, null],
    [ANIIMO, 835],
    [PACK_A_PLUSH, 1590]
  ],
  "2914151359": [[OVERWATCH, null]],
  "2915042765": [[OVERWATCH, null]],
  "2916005288": [[PERSONA_5_ROYAL, null]]
};

// Categorías de un VOD viejo con sus segundos (vacío si no está en la lista)
export function getPastCategories(vodId, streamSeconds) {
  const chapters = PAST_CATEGORIES[vodId];

  if (!chapters) {
    return [];
  }

  const known = chapters.reduce((total, [, seconds]) => total + (seconds || 0), 0);

  return chapters.map(([category, seconds]) => ({
    ...category,
    seconds: seconds === null ? Math.max(0, streamSeconds - known) : seconds
  }));
}
