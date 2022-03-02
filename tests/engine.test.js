// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_GUESSES,
  WORD_LENGTH,
  answerFor,
  gcd,
  keyboardMarks,
  puzzleNumber,
  scoreGuess,
  shareGrid,
} from '../src/engine.js'
import { GUESSES, VALID_GUESSES } from '../src/guesses.js'
import { ANSWERS, LAUNCH_DATE, STRIDE } from '../src/words.js'

test('an exact guess scores every position correct', () => {
  assert.deepEqual(scoreGuess('BRAKE', 'BRAKE'), Array(5).fill('correct'))
})

test('a guess sharing no letters scores every position absent', () => {
  assert.deepEqual(scoreGuess('MOTIF', 'ARCED'), Array(5).fill('absent'))
})

test('a misplaced letter scores present', () => {
  assert.deepEqual(scoreGuess('SPEED', 'DEEPS'), [
    'present',
    'present',
    'correct',
    'present',
    'present',
  ])
})

test('a repeated guess letter only claims as many as the answer holds', () => {
  // SLICE holds one E. SPEED offers two, neither in position, so the first takes
  // the single available E and the second finds nothing left.
  assert.deepEqual(scoreGuess('SPEED', 'SLICE'), [
    'correct',
    'absent',
    'present',
    'absent',
    'absent',
  ])
})

test('an exact match is claimed before any misplaced copy of the same letter', () => {
  // EERIE ends on SLICE's E, so that E scores correct and the two leading Es have
  // no copies left to claim. The I is the only other letter SLICE still holds.
  assert.deepEqual(scoreGuess('EERIE', 'SLICE'), [
    'absent',
    'absent',
    'absent',
    'present',
    'correct',
  ])
})

test('an exact position outranks an earlier misplaced copy of the same letter', () => {
  // The final S sits correctly, so the leading S finds nothing left to claim.
  assert.deepEqual(scoreGuess('SPINS', 'CHAOS'), [
    'absent',
    'absent',
    'absent',
    'absent',
    'correct',
  ])
})

test('scoring a guess of the wrong length throws', () => {
  assert.throws(() => scoreGuess('PIT', 'BRAKE'), /differ in length/)
})

test('the puzzle number is zero on launch day and rises one per day', () => {
  const launch = new Date(2022, 1, 6)
  assert.equal(puzzleNumber(new Date(2022, 1, 6), launch), 0)
  assert.equal(puzzleNumber(new Date(2022, 1, 7), launch), 1)
  assert.equal(puzzleNumber(new Date(2023, 1, 6), launch), 365)
})

test('the puzzle number advances exactly one across a daylight-saving change', () => {
  // North American clocks moved forward on 2026-03-08, making that local day 23
  // hours long. A naive millisecond division would floor to the same puzzle.
  const launch = new Date(2026, 2, 7)
  assert.equal(puzzleNumber(new Date(2026, 2, 8), launch), 1)
  assert.equal(puzzleNumber(new Date(2026, 2, 9), launch), 2)
})

test('the stride visits every word before repeating any', () => {
  const seen = new Set()
  for (let puzzle = 0; puzzle < ANSWERS.length; puzzle++) {
    seen.add(answerFor(puzzle, ANSWERS, STRIDE))
  }
  assert.equal(seen.size, ANSWERS.length)
})

test('the stride is coprime to the list length', () => {
  assert.equal(gcd(STRIDE, ANSWERS.length), 1)
})

test('the answer cycle wraps instead of running off the list', () => {
  assert.equal(
    answerFor(ANSWERS.length, ANSWERS, STRIDE),
    answerFor(0, ANSWERS, STRIDE)
  )
})

test('every shipped answer is exactly WORD_LENGTH uppercase letters', () => {
  const pattern = new RegExp(`^[A-Z]{${WORD_LENGTH}}$`)
  for (const word of ANSWERS) {
    assert.match(word, pattern, `${word} is not ${WORD_LENGTH} uppercase letters`)
  }
})

test('the answer list holds no duplicates', () => {
  assert.equal(new Set(ANSWERS).size, ANSWERS.length)
})

test('no answer is a proper noun', () => {
  // Answers are terms of the sport. Drivers, players, teams, circuits and towns
  // are out, so a solver never needs to know who won something. This list is the
  // set that was removed when the rule came in, kept as a regression guard.
  const NAMES = [
    // Formula 1 drivers, teams and circuits
    'MONZA', 'IMOLA', 'MIAMI', 'SENNA', 'PROST', 'LAUDA', 'CLARK', 'ALESI',
    'MASSA', 'ALBON', 'PEREZ', 'SAINZ', 'GASLY', 'LOTUS', 'MARCH', 'MATRA',
    'NOMEX',
    // IndyCar winners and venues
    'DIXON', 'RAHAL', 'UNSER', 'MEARS', 'PALOU', 'HERTA', 'ROSSI', 'SNEVA',
    'JONES', 'MEYER', 'HANKS', 'TRACY', 'MOORE', 'LEGGE', 'TEXAS',
    // Tennis champions, tournaments and towns
    'NADAL', 'LAVER', 'LENDL', 'EVERT', 'SELES', 'HENIN', 'OSAKA', 'GAUFF',
    'THIEM', 'SAFIN', 'HALEP', 'VINCI', 'KENIN', 'CHANG', 'SMITH', 'VILAS',
    'KODES', 'GOMEZ', 'COSTA', 'BLAKE', 'ISNER', 'STICH', 'BUENO', 'QUEEN',
    'HALLE', 'BASEL', 'DUBAI', 'PARIS',
  ]

  const found = ANSWERS.filter((word) => NAMES.includes(word))
  assert.deepEqual(found, [], `proper nouns in the answer list: ${found.join(', ')}`)
})

test('the launch date is not in the future', () => {
  assert.ok(LAUNCH_DATE.getTime() <= Date.now(), 'launch date must already have passed')
})

test('the list outlasts a year of daily puzzles', () => {
  assert.ok(ANSWERS.length >= 40, `only ${ANSWERS.length} answers, want at least 40`)
})

test('a letter keeps its strongest mark across guesses', () => {
  const marks = keyboardMarks([
    { word: 'BRAKE', marks: ['present', 'absent', 'absent', 'absent', 'absent'] },
    { word: 'BOOST', marks: ['correct', 'absent', 'absent', 'absent', 'absent'] },
  ])
  assert.equal(marks.get('B'), 'correct')
  assert.equal(marks.get('R'), 'absent')
})

test('the share grid renders one line per guess with no emoji', () => {
  const grid = shareGrid([
    { marks: ['correct', 'present', 'absent', 'absent', 'absent'] },
    { marks: Array(5).fill('correct') },
  ])
  assert.equal(grid, '█▒░░░\n█████')
  assert.equal(grid.split('\n').length, 2)
  assert.ok(!/\p{Extended_Pictographic}/u.test(grid), 'share grid must stay emoji-free')
})

test('the board dimensions are the classic six by five', () => {
  assert.equal(WORD_LENGTH, 5)
  assert.equal(MAX_GUESSES, 6)
})

test('every accepted guess is exactly WORD_LENGTH uppercase letters', () => {
  const pattern = new RegExp(`^[A-Z]{${WORD_LENGTH}}$`)
  for (const word of GUESSES) {
    assert.match(word, pattern, `${word} is not ${WORD_LENGTH} uppercase letters`)
  }
})

test('the guess list holds no duplicates', () => {
  assert.equal(new Set(GUESSES).size, GUESSES.length)
})

test('every answer is a valid guess', () => {
  for (const word of ANSWERS) {
    assert.ok(VALID_GUESSES.has(word), `${word} would be rejected by its own game`)
  }
})

test('a string of letters that is not a word is not a valid guess', () => {
  for (const junk of ['QQQQQ', 'AEIOU', 'XKCDZ']) {
    assert.ok(!VALID_GUESSES.has(junk), `${junk} should be rejected`)
  }
})

test('common words outside the theme are valid guesses', () => {
  for (const word of ['ABOUT', 'CRANE', 'HOUSE']) {
    assert.ok(VALID_GUESSES.has(word), `${word} should be accepted`)
  }
})
