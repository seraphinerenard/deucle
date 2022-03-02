// @ts-check

/** Shown under the masthead, so a player knows what the answers are drawn from. */
export const GAME_NAME = 'DEUCLE'

/** The one line of guidance the game gives. */
export const HINT = 'Every answer comes from tennis.'

/** Puzzle zero. Every later puzzle number counts local midnights from here. */
export const LAUNCH_DATE = new Date(2022, 2, 2)

/**
 * Step between consecutive puzzles' entries in ANSWERS. Coprime to the list
 * length, so the sequence visits every word once before repeating and the
 * order on screen does not match the order in this file. The test suite
 * enforces the coprimality.
 */
export const STRIDE = 29

/** Every possible answer. 72 entries, all five letters. */
export const ANSWERS = Object.freeze([
  'SERVE', 'ACERS', 'FAULT', 'WIDES', 'KICKS', 'FLATS', 'SLICE', 'SPINS',
  'SMASH', 'DROPS', 'CHIPS', 'LOOPS', 'FLICK', 'SHANK', 'SHOTS', 'ANGLE',
  'DEPTH', 'PACES', 'ERROR', 'RALLY', 'DEUCE', 'FORTY', 'LOVES', 'POINT',
  'GAMES', 'MATCH', 'BREAK', 'HOLDS', 'BAGEL', 'CHOKE', 'COURT', 'CLAYS',
  'GRASS', 'LINES', 'CALLS', 'CHAIR', 'POSTS', 'CORDS', 'BANDS', 'TAPES',
  'SPLIT', 'STEPS', 'PIVOT', 'LUNGE', 'REACH', 'SLIDE', 'DIVES', 'SKIDS',
  'WRIST', 'ELBOW', 'SWING', 'CRAMP', 'READY', 'FRAME', 'BALLS', 'GRIPS',
  'TOWEL', 'CLOCK', 'DRAWS', 'SEEDS', 'ROUND', 'SEMIS', 'FINAL', 'SLAMS',
  'OPENS', 'ENTRY', 'QUALI', 'TOURS', 'RANKS', 'TITLE', 'CROWN', 'COACH',
])
