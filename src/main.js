// @ts-check
import {
  MAX_GUESSES,
  WORD_LENGTH,
  answerFor,
  keyboardMarks,
  puzzleNumber,
  scoreGuess,
  shareGrid,
} from './engine.js'
import { ANSWERS, GAME_NAME, HINT, LAUNCH_DATE, STRIDE } from './words.js'

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
const STORAGE_KEY = `${GAME_NAME.toLowerCase()}.v1`

const puzzle = puzzleNumber(new Date(), LAUNCH_DATE)
const answer = answerFor(puzzle, ANSWERS, STRIDE)

/**
 * @typedef {{word: string, marks: import('./engine.js').Mark[]}} Row
 * @typedef {{puzzle: number, rows: Row[], played: number, won: number, streak: number, best: number}} Save
 */

/** @type {Save} */
const save = load()

/** Letters typed into the row in progress. */
let typed = ''
let finished = save.rows.some((row) => row.word === answer) || save.rows.length >= MAX_GUESSES

const board = must('board')
const keyboard = must('keyboard')
const toast = must('toast')
const guide = must('guide')
const statsLine = must('stats')
const endPanel = must('end')
const endTitle = must('end-title')
const shareButton = must('share')

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function must(id) {
  const element = document.getElementById(id)
  if (element === null) throw new Error(`missing element #${id}`)
  return element
}

/** @returns {Save} */
function load() {
  /** @type {Save} */
  const fresh = { puzzle, rows: [], played: 0, won: 0, streak: 0, best: 0 }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return fresh

  try {
    const stored = JSON.parse(raw)
    // Yesterday's guesses do not belong on today's board, but the stats survive.
    if (stored.puzzle !== puzzle) return { ...fresh, ...stored, puzzle, rows: [] }
    return { ...fresh, ...stored }
  } catch {
    return fresh
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

/** @param {string} message */
function say(message) {
  toast.textContent = message
  toast.classList.add('visible')
  setTimeout(() => toast.classList.remove('visible'), 1200)
}

function drawBoard() {
  board.replaceChildren()

  for (let row = 0; row < MAX_GUESSES; row++) {
    const played = save.rows[row]
    const pending = !finished && row === save.rows.length

    for (let column = 0; column < WORD_LENGTH; column++) {
      const tile = document.createElement('div')
      tile.className = 'tile'

      if (played !== undefined) {
        tile.textContent = played.word[column]
        tile.dataset.mark = played.marks[column]
      } else if (pending && column < typed.length) {
        tile.textContent = typed[column]
        tile.dataset.state = 'filled'
      }

      board.append(tile)
    }
  }
}

function drawKeyboard() {
  const marks = keyboardMarks(save.rows)
  keyboard.replaceChildren()

  KEY_ROWS.forEach((letters, index) => {
    const row = document.createElement('div')
    row.className = 'key-row'

    if (index === 2) row.append(key('ENTER', 'wide'))
    for (const letter of letters) {
      const button = key(letter)
      const mark = marks.get(letter)
      if (mark !== undefined) button.dataset.mark = mark
      row.append(button)
    }
    if (index === 2) row.append(key('BACK', 'wide'))

    keyboard.append(row)
  })
}

/**
 * @param {string} label
 * @param {string} [extra]
 * @returns {HTMLButtonElement}
 */
function key(label, extra) {
  const button = document.createElement('button')
  button.className = extra === undefined ? 'key' : `key ${extra}`
  button.type = 'button'
  button.textContent = label === 'BACK' ? '⌫' : label
  button.setAttribute('aria-label', label)
  button.addEventListener('click', () => press(label))
  return button
}

/** @param {string} label */
function press(label) {
  if (finished) return

  // Once play starts the rules are in the way; the summary reopens them.
  if (guide instanceof HTMLDetailsElement && guide.open) guide.open = false

  if (label === 'ENTER') {
    submit()
  } else if (label === 'BACK') {
    typed = typed.slice(0, -1)
    drawBoard()
  } else if (/^[A-Z]$/.test(label) && typed.length < WORD_LENGTH) {
    typed += label
    drawBoard()
  }
}

function submit() {
  if (typed.length < WORD_LENGTH) {
    say(`${WORD_LENGTH} letters`)
    return
  }

  save.rows.push({ word: typed, marks: scoreGuess(typed, answer) })
  const won = typed === answer
  typed = ''

  if (won || save.rows.length >= MAX_GUESSES) {
    finished = true
    save.played += 1
    if (won) {
      save.won += 1
      save.streak += 1
      save.best = Math.max(save.best, save.streak)
    } else {
      save.streak = 0
    }
  }

  persist()
  drawBoard()
  drawKeyboard()
  drawStats()
  if (finished) showEnd(won)
}

function drawStats() {
  const rate = save.played === 0 ? 0 : Math.round((save.won / save.played) * 100)
  statsLine.textContent = `${save.played} played · ${rate}% won · streak ${save.streak} · best ${save.best}`
}

/** @param {boolean} won */
function showEnd(won) {
  endTitle.textContent = won
    ? `Solved in ${save.rows.length}`
    : `The answer was ${answer}`
  endPanel.hidden = false
}

shareButton.addEventListener('click', async () => {
  const solved = save.rows.some((row) => row.word === answer)
  const score = solved ? `${save.rows.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
  const text = `${GAME_NAME} ${puzzle} ${score}\n\n${shareGrid(save.rows)}`

  try {
    await navigator.clipboard.writeText(text)
    say('Copied')
  } catch {
    // Clipboard access needs a secure context and a permission the browser may
    // withhold, so fall back to something the player can select by hand.
    say('Copy failed')
    window.prompt('Your result', text)
  }
})

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'Enter') press('ENTER')
  else if (event.key === 'Backspace') press('BACK')
  else if (/^[a-zA-Z]$/.test(event.key)) press(event.key.toUpperCase())
})

must('hint').textContent = HINT
must('puzzle-number').textContent = `No. ${puzzle}`

// A newcomer sees the rules; anyone with a game in progress or a record does not.
// On a short screen they stay folded, because an open panel would push the
// keyboard off the bottom of a phone the size of an iPhone SE.
if (guide instanceof HTMLDetailsElement) {
  const firstVisit = save.played === 0 && save.rows.length === 0
  guide.open = firstVisit && window.innerHeight >= 780
}

drawBoard()
drawKeyboard()
drawStats()
if (finished) showEnd(save.rows.some((row) => row.word === answer))
