const compliments = ["Cheater", "Lucky", "Genius", "Brilliant", "Clever", "Great", "Close one", "Phew"]
const themes = ["default", "colorblind", "three", "four", "five", "six", "seven"]
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const body = document.querySelector("body")
const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const MAX_ALERTS = 3
const MAX_REVEALS = 3

const offsetFromDate = new Date(2022, 4, 6)
const msOffset = Date.now() - offsetFromDate
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24)

var link = document.querySelector("link[rel~='icon']");

var targetWord
var reveals = 0
var hasEnded = false

startInteraction()
setDaily(dayOffset)
showAlert("Daily word generated")

function startInteraction() {
	document.addEventListener("click", handleMouseClick)
	document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
	document.removeEventListener("click", handleMouseClick)
	document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
	focus()

	if (e.target.matches("[data-newword]")) {
		newWord()
		return
	}

	if (e.target.matches("[data-themeswapper]")) {
		swapTheme()
		return
	}

	if (hasEnded) {
		return
	}

	if (e.target.matches("[data-key]")) {
		pressKey(e.target.dataset.key)
		return
	}

	if (e.target.matches("[data-enter]")) {
		submitGuess()
		return
	}

	if (e.target.matches("[data-delete]")) {
		deleteKey()
		return
	}

	if (e.target.classList.contains("hidden") && reveals < MAX_REVEALS && !e.target.classList.contains("old")) {
		stopInteraction()

		const letter = e.target.dataset.letter
		const key = keyboard.querySelector(`[data-key="${letter}"i]`)
		reveals++

		e.target.classList.add("flip")

		e.target.addEventListener("transitionend", () => {
			e.target.classList.remove("flip")
			e.target.classList.remove("hidden")
			key.classList.remove("hidden")

			const others = guessGrid.querySelectorAll(`[data-letter="${letter}"i]:not(.old)`)

			stateCheck(others, e.target, key)

		}, { once: true })

		e.target.addEventListener("transitionend", () => {
			startInteraction()
		}, { once: true })
	}
}

function handleKeyPress(e) {
	focus()

	if (hasEnded) {
		return
	}

	if (e.key === "Enter") {
		submitGuess()
		return
	}

	if (e.key === "Backspace" || e.key === "Delete") {
		deleteKey()
		return
	}

	if (e.key.match(/^[a-z]$/) || e.key.match(/^[A-Z]$/)) {
		pressKey(e.key.toLowerCase())
		return
	}

	if (e.key === "?") {
		pressKey("?")
	}
}

function swapTheme() {
	for (var u = 0; u < themes.length; u++) {
		if (themes[u] === body.className) {
			if (u + 2 > themes.length) {
				body.className = themes[0]
			}
			else {
				body.className = themes[u + 1]
				showAlert("Theme switched")
				link.href = `images/favicon_${body.className}.png`
				break
			}
		}
	}
}

function focus() {
	if (hasEnded) { return }

	let item = document.querySelector(".tile:not([data-letter])")

	if (!item) {
		item = document.querySelector(".active")
	}

	item.focus()
}

async function askWord(word) {
	let response = await fetch(`https://thatwordleapi.azurewebsites.net/ask/?word=${word}`)
	let data = await response.json()
	return await data.Response
}

async function getWord() {
	let response = await fetch('https://thatwordleapi.azurewebsites.net/get/')
	let data = await response.json()
	return await data.Response
}

async function setDaily(day) {
	let response = await fetch(`https://thatwordleapi.azurewebsites.net/daily/?day=${day}`)
	let data = await response.json()
	targetWord = await data.Response
	console.log('targetWord: "' + targetWord.toUpperCase() + '"')
}

async function newWord() {
	stopInteraction()

	reveals = 0
	hasEnded = false

	const tiles = guessGrid.querySelectorAll('[data-letter]')

	tiles.forEach((tile) => {
		tile.textContent = ""
		delete tile.dataset.state
		delete tile.dataset.letter
		delete tile.dataset.color
		tile.className = "tile"
	});

	const keys = keyboard.querySelectorAll(".key:not(.large):not(.long)")

	keys.forEach((key) => {
		delete key.dataset.color
		key.className = "key"
	});

	targetWord = await getWord()
	console.log('targetWord: "' + targetWord.toUpperCase() + '"')

	const alerts = alertContainer.querySelectorAll(".alert")

	alerts.forEach((alert) => {
		alert.className = "alert hide"
		alert.addEventListener("transitionend", () => {
			alert.remove()
		})
	});

	showAlert("New word generated")
	focus()

	startInteraction()
}

function stateCheck(others, mine, key) {
	let revTiles = []
	let bonds = [false, false, false, false, false]
	const letter = mine.dataset.letter

	if (targetWord[mine.dataset.index] === letter) {
		mine.dataset.color = "correct"
		key.dataset.color = "correct"
	} else if (targetWord.includes(letter)) {
		mine.dataset.color = "wrong-location"

		if (key.dataset.color !== "correct") {
			key.dataset.color = "wrong-location"
		}
	} else {
		mine.dataset.color = "wrong"

		if (!key.dataset.color) {
			key.dataset.color = "wrong"
		}
	}

	others.forEach((tile) => {
		if (!tile.classList.contains("hidden")) {
			revTiles.push(tile)
		}
	});

	revTiles.forEach((tile) => {
		if (targetWord[tile.dataset.index] === tile.dataset.letter) {
			bonds[tile.dataset.index] = true
		}
	});

	revTiles.forEach((tile) => {
		if (targetWord.includes(tile.dataset.letter) && targetWord[tile.dataset.index] !== tile.dataset.letter) {
			let hasBonded = false

			for (var u = 0; u < targetWord.length; u++) {
				if (bonds[u] === false && targetWord[u] === tile.dataset.letter) {
					bonds[u] = true
					hasBonded = true
					u = 99
				}
			}

			if (hasBonded === false && tile.dataset.color !== "wrong") {
				if (tile !== mine) {
					tile.classList.add("flip")

					tile.addEventListener("transitionend", () => {
						tile.classList.remove("flip")
						tile.dataset.color = "wrong"
					}, { once: true })
				} else {
					tile.dataset.color = "wrong"
				}
			}
		}
	});
}

function pressKey(key) {
	const activeTiles = getActiveTiles()

	if (activeTiles.length >= WORD_LENGTH) return

	const nextTile = guessGrid.querySelector(":not([data-letter])")

	nextTile.dataset.letter = key.toLowerCase()
	nextTile.textContent = key.toLowerCase()
	nextTile.classList.add("active")
	nextTile.classList.add("enter")

	nextTile.addEventListener("animationend", () => {
		nextTile.classList.remove("enter")
	}, { once: true })
}

function deleteKey() {
	const activeTiles = getActiveTiles()
	const lastTile = activeTiles[activeTiles.length - 1]

	if (lastTile == null) return

	lastTile.textContent = ""
	lastTile.classList.remove("active")
	delete lastTile.dataset.letter
}

async function submitGuess() {
	const activeTiles = [...getActiveTiles()]

	if (activeTiles.length !== WORD_LENGTH) {
		showAlert("Not enough letters")
		shakeTiles(activeTiles)
		return
	}

	const guess = activeTiles.reduce((word, tile) => {
		return word + tile.dataset.letter
	}, "")

	if (guess.includes("?")) {
		showAlert("Remove all fillers")
		shakeTiles(activeTiles)
		return
	}

	let isWord = await askWord(guess)
	if (!isWord) {
		showAlert("Word not found")
		shakeTiles(activeTiles)
		return
	}

	stopInteraction()

	reveals = 0

	activeTiles.forEach((...params) => flipTile(...params, guess))
}

function flipTile(tile, index, array, guess) {
	const letter = tile.dataset.letter
	const key = keyboard.querySelector(`[data-key="${letter}"i]`)

	setTimeout(() => {
		tile.classList.add("flip")
	}, ((Math.pow(1.35, index) - 0.35) * FLIP_ANIMATION_DURATION) / 2)

	tile.addEventListener("transitionend", () => {
		tile.classList.remove("flip")
		tile.classList.remove("active")

		if (guess === targetWord) {
			tile.dataset.color = "correct"
			key.dataset.color = "correct"
		} else {
			tile.classList.add("hidden")
		}

		if (index === array.length - 1) {
			tile.addEventListener("transitionend", () => {
				startInteraction()

				let olds = guessGrid.querySelectorAll(`[data-letter]:not([data-row="${getGuesses()}"i])`)
				if (olds !== null) {
					olds.forEach((tile) => {
						tile.classList.add("old")
					});
				}

				checkWinLose(guess, array)
			}, { once: true })
		}
	}, { once: true })
}

function getActiveTiles() {
	return guessGrid.querySelectorAll(".active")
}

function getGuesses() {
	const letters = guessGrid.querySelectorAll("[data-letter]:not(.active)")
	return Math.floor(((letters.length - WORD_LENGTH) / WORD_LENGTH) + 1)
}

function showAlert(message, duration = 1000) {
	if (alertContainer.children.length >= MAX_ALERTS) return

	const alert = document.createElement("div")
	alert.textContent = message;
	alert.classList.add("alert")
	alertContainer.prepend(alert)
	if (duration == null) return

	setTimeout(() => {
		alert.classList.add("hide")
		alert.addEventListener("transitionend", () => {
			alert.remove()
		})
	}, duration)
}

function shakeTiles(tiles) {
	tiles.forEach(tile => {
		tile.classList.add("shake")
		tile.addEventListener("animationend", () => {
			tile.classList.remove("shake")
		}, { once: true })
	})
}

function checkWinLose(guess, tiles) {
	if (guess === targetWord) {
		showAlert(compliments[getGuesses() - 1], 5000)
		danceTiles(tiles)
		hasEnded = true
		return
	}

	const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
	if (remainingTiles.length === 0) {
		showAlert(targetWord.toUpperCase(), null)
		hasEnded = true
	}
}

function danceTiles(tiles) {
	tiles.forEach((tile, index) => {
		setTimeout(() => {
			tile.classList.add("dance")
			tile.addEventListener("animationend", () => {
				tile.classList.remove("dance")
			}, { once: true })
		}, (index * DANCE_ANIMATION_DURATION) / 5)
	})
}