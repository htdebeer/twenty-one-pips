const DISABLED = "disabled";
const INVALID = "invalid";
const WIDTH = "width";
const HEIGHT = "height";
const RESIZE = "resize";
const CLICK = "click";
const INPUT = "input";

const MESSAGE = "message";

const WIN_MESSAGE = "win";
const LOSE_MESSAGE = "lose";

const SHOW = "show";

const WAIT_FOR_MESSAGE = 2500; // ms
const WAIT_FOR_SCORE = 500; //ms

const MASK = document.querySelector(".mask");
const BOARD = document.querySelector("top-dice-board");
const CONTROL = document.querySelector(".control");
const GUESS = document.querySelector("input");
const BUTTON = document.getElementById("go");


const mask = () => MASK.classList.add(SHOW);
const unMask = () => MASK.classList.remove(SHOW);
    
const hideMessages = () => {
    const messages = document.querySelectorAll(`.${MESSAGE}`);

    for (const message of messages) {
        message.classList.remove(SHOW);
    }

    unMask();
};

const initialize = () => {
    GUESS.value = "";
    hideMessages();
};

const showMessage = (type) => {
    mask();
    document.querySelector(`.${MESSAGE}.${type}`).classList.add(SHOW);
    setTimeout(initialize, WAIT_FOR_MESSAGE);
};

const validateGuess = () => {
    const guess = parseInt(GUESS.value, 10);

    return !Number.isNaN(guess) && 0 < guess;
};

const enableGoWhenGuessIsValid = () => {
    if (validateGuess()) {
        GUESS.classList.remove(INVALID);
        BUTTON.removeAttribute(DISABLED);
    } else {
        GUESS.classList.add(INVALID);
        BUTTON.setAttribute(DISABLED, true);
    }
};

const throwAndCheckGuess = () => {
    const guess = parseInt(GUESS.value, 10);
    const sumOfDice = BOARD.throwDice().reduce((sum, die) => sum += die.pips, 0);

    setTimeout(() => {
        showMessage(guess === sumOfDice ? WIN_MESSAGE : LOSE_MESSAGE);
    }, WAIT_FOR_SCORE);

};

const setupSize = () => {
    BOARD.setAttribute(WIDTH, window.innerWidth);
    BOARD.setAttribute(HEIGHT, window.innerHeight - 2 * CONTROL.getBoundingClientRect().height);
};

window.addEventListener(RESIZE, setupSize);
BUTTON.addEventListener(CLICK, throwAndCheckGuess);
GUESS.addEventListener(INPUT, enableGoWhenGuessIsValid);

setupSize();
initialize();
