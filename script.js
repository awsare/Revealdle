const compliments = ["Cheater","Lucky","Genius","Brilliant", "Magnificent","Splendid","Great","Close one"]
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const MAX_ALERTS = 3
const MAX_REVEALS = 3
const offsetFromDate = new Date(2023, 0, 1)
const msOffset = offsetFromDate - Date.now()
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24)
const targetWord = targetWords[dayOffset]

let guesses = 0
let reveals = 0

startInteraction()
console.log('targetWord: "' + targetWord.toUpperCase() + '"')

function startInteraction() {
    document.addEventListener("click", handleMouseClick)
    document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
    document.removeEventListener("click", handleMouseClick)
    document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
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
		reveals++
		const letter = e.target.textContent
  		const key = keyboard.querySelector(`[data-key="${letter}"i]`)
		
    	e.target.classList.add("flip")

		e.target.addEventListener(
			"transitionend",
			() => {
      			e.target.classList.remove("flip")
				e.target.classList.remove("hidden")
				key.classList.remove("needs-update")
				key.classList.remove("hidden")
				key.classList.add("revealed")

				const others = guessGrid.querySelectorAll(`[data-letter="${letter}"i]`)

				stateCheck(others, e.target, key)
				
			},
			{ once: true }
		)
	}
}

function stateCheck(others, mine, key) {
	let revTiles = []
	let bonds = [false, false, false , false , false]

	//get revealed tiles
	others.forEach((tile) => {
		if (!tile.classList.contains("hidden")) {
			revTiles.push(tile)
		}
	});
	
	//bond the correct tiles first
	revTiles.forEach((tile) => {
		if (tile.classList.contains("correct")) {
			bonds[tile.dataset.index - 1] = true
			key.classList.add("correct")
		}
	});

	//then bond the wrong-location tiles
	
	revTiles.forEach((tile) => {
		if (tile.classList.contains("wrong-location")) {
			let hasBonded = false
			
			for (var u = 0; u < targetWord.length; u++) {
   				if (bonds[u] === false && targetWord[u] === tile.textContent) {
					bonds[u] = true
					hasBonded = true
					u = 99
				}
 			}

			if (hasBonded === false) {

				if (tile !== mine) {
					tile.classList.add("flip")

					tile.addEventListener(
						"transitionend",
						() => {
							tile.classList.remove("flip")
							
							tile.classList.remove("wrong-location")
							tile.classList.add("wrong")
							tile.dataset.state = "wrong"
							key.classList.add("wrong-location")
						},
					{ once: true }
					) 
				} else {
					tile.classList.remove("wrong-location")
					tile.classList.add("wrong")
					tile.dataset.state = "wrong"
				}
			}
		}
	});

}

function handleKeyPress(e) {
    if (e.key === "Enter") {
        submitGuess()
        return
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        deleteKey()
        return
    }
    if (e.key.match(/^[a-z]$/)) {
        pressKey(e.key.toLowerCase())
        return
    }
}

function pressKey(key) {
    const activeTiles = getActiveTiles()
    if (activeTiles.length >= WORD_LENGTH) return
    const nextTile = guessGrid.querySelector(":not([data-letter])")
    nextTile.dataset.letter = key.toLowerCase()
    nextTile.textContent = key
    nextTile.dataset.state = "active"
	
    nextTile.classList.add("enter")

	nextTile.addEventListener(
		"animationend",
		() => {
      		nextTile.classList.remove("enter")
		},
		{ once: true }
	) 
}

function deleteKey() {
    const activeTiles = getActiveTiles()
    const lastTile = activeTiles[activeTiles.length - 1]
    if (lastTile == null) return
    lastTile.textContent = ""
    delete lastTile.dataset.state
    delete lastTile.dataset.letter
}

function submitGuess() {
    const activeTiles = [...getActiveTiles()]
	reveals = 0
	
    if (activeTiles.length !== WORD_LENGTH) {
        showAlert("Not enough letters")
        shakeTiles(activeTiles)
        return
    }

	const guess = activeTiles.reduce((word, tile) => {
		return word + tile.dataset.letter
	}, "")

	if (!dictionary.concat(targetWords).includes(guess)) {
		showAlert("Word not found")
		shakeTiles(activeTiles)
		return
	}

	stopInteraction()
	
	let olds = guessGrid.querySelectorAll(".hidden:not(.old)")
	if (olds !== null) {
		olds.forEach((tile) => {
			tile.classList.add("old")
		});
	}
	
	activeTiles.forEach((...params) => flipTile(...params, guess))
	guesses++
}

function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)
  setTimeout(() => {
    tile.classList.add("flip")
  }, (index * FLIP_ANIMATION_DURATION) / 2)

	
  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip")
		
		if (targetWord !== guess) {
			tile.classList.add("hidden")
			if (!key.classList.contains("revealed")) {
				key.classList.add("hidden")
			}
		}
	  
      if (targetWord[index] === letter) {
        tile.dataset.state = "correct"
		tile.classList.add("correct")
		if (key.classList.contains("wrong-location")) {
			key.classList.add("needs-update")
		} else {
			key.classList.add("correct")
			key.classList.remove("wrong-location")
		}
        
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location"
		tile.classList.add("wrong-location")
        key.classList.add("wrong-location")
      } else {
        tile.dataset.state = "wrong"
		tile.classList.add("wrong")
        key.classList.add("wrong")
      }

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction()
            checkWinLose(guess, array)
          },
          { once: true }
        )
      }
    },
    { once: true }
  )
}

function getActiveTiles() {
    return guessGrid.querySelectorAll('[data-state="active"]')
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
		}, {once: true})
	})
}

function checkWinLose(guess, tiles) {
	if (guess === targetWord) {
		showAlert(compliments[guesses - 1], 5000)
		danceTiles(tiles)
		stopInteraction()
		return
	}

	const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
	if (remainingTiles.length === 0) {
		showAlert(targetWord.toUpperCase(), null)
		stopInteraction()
	}
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}