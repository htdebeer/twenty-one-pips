const INCREASE = Symbol();
const DECREASE = Symbol();
const INTERVAL = 1000; // ms
const BOARD = document.querySelector("top-dice-board");

let throwingDiceAnimationIntervalId = null;

const shouldAddDie = (direction) => {
    if (INCREASE === direction) {
        if (BOARD.dice.length >= BOARD.maximumNumberOfDice - 1) {
            direction = DECREASE;
        }
    } else {
        if (0 >= BOARD.dice.length) {
            direction = INCREASE;
        }
    }

    return INCREASE === direction;
};

const removeRandomDie = () => {
    BOARD.removeChild(BOARD.dice[Math.floor(Math.random() * BOARD.dice.length)]);
};

const changeTheNumberOfDice = (direction) => {
    if (shouldAddDie(direction)) {
        BOARD.appendChild(new twentyonepips.Die());
    } else {
        removeRandomDie();
    }
};

const giveRandomPlayerATurn = () => {
    return BOARD
        .players[Math.floor(Math.random() * BOARD.players.length)]
        .startTurn();
};

const holdAndReleaseSomeDice = (player) => {
    BOARD.dice
        .filter((_, index) => index < Math.floor(Math.random() * BOARD.dice.length))
        .forEach((die) => {
            if (die.heldBy === player) {
                die.releaseIt(player);
            } else {
                die.holdIt(player);
            }
        });
};

let direction = INCREASE;
const throwDice = () => {
    changeTheNumberOfDice(direction);
    holdAndReleaseSomeDice(giveRandomPlayerATurn());
    BOARD.throwDice();
};

const start = () => {
    clearInterval(throwingDiceAnimationIntervalId);
    throwingDiceAnimationIntervalId = null;

    BOARD.dice.forEach(die => BOARD.removeChild(die));

    throwingDiceAnimationIntervalId = setInterval(throwDice, INTERVAL);
};

const diceBoardFillsWindow = () => {
    BOARD.setAttribute("width", window.innerWidth);
    BOARD.setAttribute("height", window.innerHeight);
    start();
}

window.addEventListener("resize", diceBoardFillsWindow);

diceBoardFillsWindow();
