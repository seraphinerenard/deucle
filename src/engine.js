// @ts-check

/** Letters in every answer and every guess. */
export const WORD_LENGTH = 5

/** Guesses allowed before the puzzle is lost. */
export const MAX_GUESSES = 6

/** @typedef {'correct' | 'present' | 'absent'} Mark */

/**
 * Score a guess against the answer.
 *
 * Two passes, because a single pass gets repeated letters wrong. The first pass
 * claims exact positions and tallies the answer's remaining letters; the second
 * pass spends that tally on misplaced letters, left to right. So guessing SPEED
 * against SLICE marks only the first E as present: the answer holds one E and the
 * first misplaced E consumes it.
 *
 * @param {string} guess Must be WORD_LENGTH letters, uppercase.
 * @param {string} answer Must be WORD_LENGTH letters, uppercase.
 * @returns {Mark[]} One mark per position in the guess.
 */
export function scoreGuess(guess, answer) {
  if (guess.length !== answer.length) {
    throw new Error(`guess ${guess} and answer ${answer} differ in length`)
  }

  /** @type {Mark[]} */
  const marks = new Array(guess.length).fill('absent')
  /** @type {Map<string, number>} */
  const unclaimed = new Map()

  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = 'correct'
    } else {
      unclaimed.set(answer[i], (unclaimed.get(answer[i]) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue
    const left = unclaimed.get(guess[i]) ?? 0
    if (left > 0) {
      marks[i] = 'present'
      unclaimed.set(guess[i], left - 1)
    }
  }

  return marks
}

/**
 * Which puzzle belongs to a given day, counting from the launch date.
 *
 * Both dates collapse to a UTC midnight built from their local calendar fields,
 * so the subtraction is a whole number of days even across a daylight-saving
 * boundary, where two local midnights can sit 23 or 25 hours apart.
 *
 * @param {Date} today
 * @param {Date} launch
 * @returns {number} Zero on launch day, rising by one each local midnight.
 */
export function puzzleNumber(today, launch) {
  const day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const origin = Date.UTC(launch.getFullYear(), launch.getMonth(), launch.getDate())
  return Math.floor((day - origin) / 86_400_000)
}

/**
 * Pick the answer for a puzzle number.
 *
 * Walking the list in order would let a player read tomorrow's word out of the
 * source. Striding by a number coprime to the list length visits every entry
 * exactly once before repeating, which scatters the order while keeping the
 * cycle complete. `stride` must be coprime to `words.length`; the test suite
 * checks that for each shipped list.
 *
 * @param {number} puzzle
 * @param {readonly string[]} words
 * @param {number} stride
 * @returns {string}
 */
export function answerFor(puzzle, words, stride) {
  if (words.length === 0) throw new Error('word list is empty')
  const wrapped = ((puzzle % words.length) + words.length) % words.length
  return words[(wrapped * stride) % words.length]
}

/**
 * Best mark earned by each letter so far, for colouring the keyboard.
 *
 * A letter keeps its strongest result: once correct it never drops back to
 * present, however many later guesses misplace it.
 *
 * @param {readonly {word: string, marks: readonly Mark[]}[]} rows
 * @returns {Map<string, Mark>}
 */
export function keyboardMarks(rows) {
  /** @type {Record<Mark, number>} */
  const rank = { absent: 0, present: 1, correct: 2 }
  /** @type {Map<string, Mark>} */
  const best = new Map()

  for (const row of rows) {
    for (let i = 0; i < row.word.length; i++) {
      const letter = row.word[i]
      const mark = row.marks[i]
      const held = best.get(letter)
      if (held === undefined || rank[mark] > rank[held]) best.set(letter, mark)
    }
  }

  return best
}

/**
 * The shareable result grid.
 *
 * Block characters rather than coloured squares, so the grid survives being
 * pasted into a terminal, a commit message, or any font without emoji coverage.
 *
 * @param {readonly {marks: readonly Mark[]}[]} rows
 * @returns {string}
 */
export function shareGrid(rows) {
  /** @type {Record<Mark, string>} */
  const glyph = { correct: '█', present: '▒', absent: '░' }
  return rows.map((row) => row.marks.map((mark) => glyph[mark]).join('')).join('\n')
}

/**
 * Greatest common divisor, used by the tests to verify stride choices.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a, b) {
  while (b !== 0) [a, b] = [b, a % b]
  return a
}
