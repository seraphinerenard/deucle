# DEUCLE

The daily tennis word. Six guesses at a five-letter word, a new one every day at local midnight.

Play it at https://seraphinerenard.github.io/deucle/

## How it works

Every answer comes from tennis. The list holds 72 words. A guess must be a real word: the game checks it against the original Wordle's 14,855 accepted guesses joined with this game's answers, so every themed term stays guessable; only the answers are themed.

Tiles report each guess the way the original does. A filled tile means the letter sits in the right place, a mid-tone tile means the letter is in the word somewhere else, and a flat tile means the letter is absent. Repeated letters follow the two-pass rule: a guess claims exact positions first, then spends whatever copies the answer has left on misplaced letters.

The daily word is a function of the date rather than anything stored on a server. Both the date arithmetic and the answer lookup are pure functions in `src/engine.js`, so the puzzle is identical for every player and reproducible in a test.

## Running it

No build step and no dependencies. Serve the directory and open it:

```sh
python3 -m http.server 8000
```

The page loads `src/main.js` as a native ES module, which needs `http://` rather than `file://`.

## Tests

The engine's rules are covered by Node's built-in test runner, which also checks the shipped word lists for length, duplicates and a valid stride:

```sh
node --test
```

## Layout

    index.html        markup and the element ids the interface binds to
    styles.css        every colour token in the game, declared once
    src/engine.js     pure logic: scoring, puzzle numbering, answer lookup
    src/words.js      the 72-word answer list and daily-cycle settings
    src/main.js       DOM wiring, keyboard input, saved progress and stats
    tests/            engine and word-list tests

## Licence

MIT. See `LICENSE`.
