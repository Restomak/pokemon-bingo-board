let urlParams = new URLSearchParams(window.location.search);
let seed = urlParams.get('seed')
let allCells = [
  'r1c1', 'r1c2', 'r1c3', 'r1c4', 'r1c5',
  'r2c1', 'r2c2', 'r2c3', 'r2c4', 'r2c5',
  'r3c1', 'r3c2', 'r3c3', 'r3c4', 'r3c5',
  'r4c1', 'r4c2', 'r4c3', 'r4c4', 'r4c5',
  'r5c1', 'r5c2', 'r5c3', 'r5c4', 'r5c5'
];
let diagonal1 = ['r1c1', 'r2c2', 'r3c3', 'r4c4', 'r5c5']
let diagonal2 = ['r5c1', 'r4c2', 'r3c3', 'r2c4', 'r1c5']

if (!seed) {
  seed = generateSeedString();
}

let mySeededRng = new Math.seedrandom('' + seed);

const genSelector = document.getElementById("genSelector");
// persist gen selection via local storage
const previouslySelectedGen = localStorage.getItem("selected-generation");
if (previouslySelectedGen) {
  genSelector.value = previouslySelectedGen;
}
let gen = genSelector.value;

function randomizeBoard(reroll = false) {
  gen = genSelector.value;

  mySeededRng = new Math.seedrandom('' + seed); // this is inconsistent if you pass a number instead of a string

  let pokemonOnTheBoard = [];

  let porygonFound = false;
  let cyndaquilFound = false;
  let umbreonFound = false;
  let excludedPokemonFound = false;
  let giveUpTimer = 0;
  let exitLoop = false;
  do {
    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 5; col++) {
        if (row === 3 && col === 3) {
          //free space
          continue;
        }
        let chosen = false
        while (!chosen) {
          let pokeNum = getSeededRandomInt(1, getPokemonCountByGeneration(gen)) - 1;
          if (pokemonOnTheBoard.indexOf(pokeNum) < 0) {
            chosen = true;
            if (pokeNum == 137 - 1) { //-1 because of how it's put into the array
              porygonFound = true;
            }
            if (pokeNum == 155 - 1) { //-1 because of how it's put into the array
              cyndaquilFound = true;
            }
            if (pokeNum == 197 - 1) { //-1 because of how it's put into the array
              umbreonFound = true;
            }
            if (pokeNum <= 356 - 1 && pokeNum >= 354 - 1 || //gen 3 ghosts
                pokeNum <= 348 - 1 && pokeNum >= 343 - 1 || //gen 3 fossils & claydoll line
                pokeNum == 338 - 1 || //solrock
                pokeNum == 337 - 1 || //lunatone
                pokeNum <= 314 - 1 && pokeNum >= 311 - 1 || //illumise, volbeat, minun, plusle
                pokeNum == 308 - 1 || //medicham
                pokeNum == 307 - 1 || //meditite
                pokeNum <= 297 - 1 && pokeNum >= 293 - 1 || //whismur & makuhita lines
                pokeNum <= 275 - 1 && pokeNum >= 273 - 1 || //seedot line
                pokeNum <= 240 - 1 && pokeNum >= 236 - 1 || //magby, elekid, smoochum, hitmontop, tyrogue
                pokeNum == 174 - 1 || //igglybuff
                pokeNum == 173 - 1 || //cleffa
                pokeNum == 354 - 1) {
              excludedPokemonFound = true;
            }
            const chosenPoke = pokemonData[pokeNum]
            pokemonOnTheBoard.push(pokeNum);
            let cell = document.getElementById("r" + row + "c" + col + "-div");
            const genImageToUse = chosenPoke['gen' + gen]?.image ? 'gen' + gen : 'gen5'; //fall back to gen 5 as it has (unofficial) sprites for every mon
            let image = chosenPoke[genImageToUse]['image'];
            if (gen !== '1' && mySeededRng() < .007) {
              image = chosenPoke[genImageToUse]['image-shiny'];
              console.log('shiny', chosenPoke.name)
            }
            cell.innerHTML =
              "<img class=\"pokeball\" src=\"sprites/poke-ball.png\"/>" +
              "<img class=\"masterball\" src=\"sprites/master-ball.png\"/>" +
              "<img class=\"pokemon-sprite " + genImageToUse + "\"" +
              " src=\"" + image + "\"/><span>" + chosenPoke.name + "</span>";
          }
        }
      }
    }
    /*if (gen == '1' ||
        porygonFound && cyndaquilFound && umbreonFound ||
        giveUpTimer > 251 && porygonFound && (cyndaquilFound || umbreonFound) ||
        giveUpTimer > 2510 && porygonFound ||
        giveUpTimer > 2510000) {*/
    if (gen == '1' ||
        !reroll && porygonFound ||
        porygonFound && cyndaquilFound && umbreonFound ||
        porygonFound && (cyndaquilFound || umbreonFound) && giveUpTimer > 50 ||
        porygonFound && !excludedPokemonFound && giveUpTimer > 100 ||
        porygonFound && giveUpTimer > 150 ||
        giveUpTimer > 200) {
      exitLoop = true;
    } else {
      porygonFound = false;
      cyndaquilFound = false;
      umbreonFound = false;
      seed = generateSeedString();
      mySeededRng = new Math.seedrandom('' + seed); // this is inconsistent if you pass a number instead of a string
      pokemonOnTheBoard = [];
      giveUpTimer++;
    }
  } while (!exitLoop)

  //set cells as marked if they returned to the same seed in a single session
  if (seed === sessionStorage.getItem('seed')) {
    let selectedArray = JSON.parse(sessionStorage.getItem('selectedCells') || '[]')
    selectedArray.forEach(cellId => toggleCell(cellId, true));
  } else {
    sessionStorage.setItem('seed', seed);
    sessionStorage.removeItem('selectedCells');
  }

  document.getElementById('seed-label').innerText = 'Seed: ' + seed;

}


function checkBingo() {
  let markedCells = document.querySelectorAll('.marked');
  if (markedCells.length < 5) {
    document.querySelectorAll('.bingo').forEach(ele => ele.classList.remove('bingo'));
    return;
  }
  let marked = [];
  let bingoWinners = [];

  markedCells.forEach(c => marked.push(c.id.split('-')[0]));
  //horizontal and vertical checks
  for (let i = 1; i <= 5; i++) {
    let horizontalCheck = marked.filter(id => id.indexOf('r' + i) >= 0);
    if (horizontalCheck.length >= 5) {
      bingoWinners = [...bingoWinners, ...horizontalCheck];
    }
    verticalCheck = marked.filter(id => id.indexOf('c' + i) >= 0);
    if (verticalCheck.length >= 5) {
      bingoWinners = [...bingoWinners, ...verticalCheck];
    }
  }

  if (diagonal1.every(c => marked.includes(c))) {
    bingoWinners = [...bingoWinners, ...diagonal1];
  }


  if (diagonal2.every(c => marked.includes(c))) {
    bingoWinners = [...bingoWinners, ...diagonal2];
  }

  bingoWinners = [...new Set(bingoWinners)] || [];
  let nonWinners = allCells.filter(c => !bingoWinners.includes(c)) || [];

  document.querySelectorAll('.bingo').forEach(ele => {
    if (nonWinners.indexOf(ele.id.split('-')[0]) >= 0) ele.classList.remove('bingo');
  });
  bingoWinners.forEach(id => document.getElementById(id + '-td').classList.add('bingo'));
}


function toggleCell(event, skipSessionStorage = false) {
  let cell = document.getElementById(event);
  cell.classList.toggle('marked');
  let alreadySelected = JSON.parse(sessionStorage.getItem('selectedCells') || '[]');
  if (!skipSessionStorage) {
    if (cell.classList.contains('marked')) {
      sessionStorage.setItem('selectedCells', JSON.stringify([cell.id, ...alreadySelected]))
    } else {
      sessionStorage.setItem('selectedCells', JSON.stringify(alreadySelected.filter(c => c !== cell.id)))
    }
  }
  checkBingo();
}


function rerollBoard() {
  seed = generateSeedString();
  randomizeBoard(true);
  document.querySelectorAll('.marked').forEach(ele => ele.classList.remove('marked'))
  document.querySelectorAll('.bingo').forEach(ele => ele.classList.remove('bingo'))
}

function changeGen() {
  randomizeBoard();
  localStorage.setItem("selected-generation", genSelector.value);
}

function generateSeedString() {
  let urlParams = new URLSearchParams(window.location.search);
  let seed = Math.round(Math.random() * new Date().getTime())
  urlParams.set('seed', seed);
  const url = new URL(window.location.href);
  url.searchParams.set('seed', seed);
  window.history.replaceState(null, null, url);
  return seed;
}


function getSeededRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(mySeededRng() * (max - min + 1)) + min;
}

function getPokemonCountByGeneration(generation) {
  switch (generation) {
    case "1":
      return 151;
    case "2":
      return 251;
    case "3":
      return 386;
    case "4":
      return 493;
    case "5":
      return 649;
    case "6":
      return 721;
    case "7":
      return 809;
    case "8":
      return 898;
    default:
      return 898;
  }
}
