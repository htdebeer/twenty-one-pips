// Constants
const INCREASE = Symbol();
const DECREASE = Symbol();

const INTERVAL = 1000; // ms

// Private functions

/**
 * Add a die to the dice-board.
 *
 * @param {ContinuouslyThrownDiceAnimation} controller - The animation
 * controller.
 *
 * @private
 */
const addADie = (controller) => {
    controller
        .board
        .addDie();
};

/**
 * Randomly pick a die from the dice-board and remove it.
 *
 * @param {ContinuouslyThrownDiceAnimation} controller - The animation
 * controller.
 *
 * @private
 */
const removeRandomDie = (controller) => {
    controller
        .board
        .removeDie(controller.board.dice[Math.floor(Math.random() * controller.board.dice.length)]);
};

/**
 * Randomly pick a player from the list with players and give he or she a
 * turn, i.e. make it the current player in the "game".
 *
 * @param {ContinuouslyThrownDiceAnimation} controller - The animation
 * controller.
 *
 * @private
 */
const giveRandomPlayerATurn = (controller) => {
    return controller
        .board
        .players[Math.floor(Math.random() * controller.board.players.length)]
        .startTurn();
};

/**
 * Change the number of dice played on the dice-board.
 *
 * @param {ContinuouslyThrownDiceAnimation} controller - The animation
 * controller.
 *
 * @private
 */
const changeTheNumberOfDice = (controller) => {
    // Make sure the current direction is still possible. If not, flip the
    // direction.
    if (INCREASE === controller.direction) {
        if (controller.board.dice.length >= controller.board.maximumNumberOfDice - 1) {
            controller.direction = DECREASE;
        }
    } else {
        if (0 >= controller.board.dice.length) {
            controller.direction = INCREASE;
        }
    }

    // Change the number of dice according to the current direction.
    if (INCREASE === controller.direction) {
        addADie(controller);
    } else {
        removeRandomDie(controller);
    }
};

/**
 * Randomly pick a random number of dice from the dice-board and have the
 * player hold or release it depending on if the picked die is already being
 * held or not.
 *
 * @param {ContinuouslyThrownDiceAnimation} controller - The animation
 * controller.
 * @param {TopPlayerHTMLElement} player - The player that is to hold or
 * release some dice.
 *
 * @private
 */
const holdAndReleaseSomeDice = (controller, player) => {
    controller
        .board
        .dice
        .filter((_, index) => index < Math.floor(Math.random() * controller.board.dice.length))
        .forEach((die) => {
            if (die.heldBy === player) {
                die.releaseIt(player);
            } else {
                die.holdIt(player);
            }
        });
};

// Private properties
const _board = new WeakMap();
const _direction = new WeakMap();
const _stepDuration = new WeakMap();
const _intervalId = new WeakMap();

/**
 * A animation of dice being thrown continuously.
 */
class ContinuouslyThrownDiceAnimation {

    /**
     * Create a new ContinuouslyThrownDiceAnimation.
     *
     * @param {TopDiceBoardHTMLElement} board - The dice board used for the
     * animation.
     * @param {Number} [stepDuration = INTERVAL] - The number of milliseconds
     * between each step in the animation.
     * @param {Boolean} [fullScreen = true] - If true, the browser's whole
     * screen is being used.
     */
    constructor({board, stepDuration = INTERVAL, fullScreen = true}) {
        _board.set(this, board);
        _direction.set(this, INCREASE);
        _stepDuration.set(this, stepDuration);
        _intervalId.set(this, null);

        if (fullScreen) {
            window.addEventListener("resize", () => this.fillWindow());
            this.fillWindow();
        }
    }

    /**
     * The dice board used for this ContiunuouslyThrownDiceAnimation.
     *
     * @type {TopDiceBoardHTMLElement}
     */
    get board() {
        return _board.get(this);
    }

    /**
     * The direction of growth of number of dice of this
     * ContinuouslyThrownDiceAnimation.
     *
     * @type {INCREASE|DECREASE}
     */
    get direction() {
        return _direction.get(this);
    }
    
    set direction(aDirection) {
        _direction.set(this, aDirection);
    }

    /**
     * The time to wait between steps during this
     * ContinuouslyThrownDiceAnimation in milliseconds.
     *
     * @type {Number}
     */
    get stepDuration() {
        return _stepDuration.get(this);
    }

    /**
     * Start this ContinuouslyThrownDiceAnimation
     */
    start() {
        // Stop any running animation and remove all dice from the board.
        this.stop();
        this.clear();

        // Start the animation.
        _intervalId.set(this, setInterval(() => this.step(), this.stepDuration));
    }

    /**
     * Stop this ContinuouslyThrownDiceAnimation.
     */
    stop() {
        // Stop any running animation.
        clearInterval(_intervalId.get(this));
    }

    /**
     * Perform one step of this ContinuouslyThrownDiceAnimation.
     */
    step() {
        changeTheNumberOfDice(this);
        holdAndReleaseSomeDice(this, giveRandomPlayerATurn(this));
        this.board.throwDice();
    }

    /**
     * Remove all dice from the dice board being used in this
     * ContinuouslyThrownDiceAnimation.
     */
    clear() {
        this.board.dice.forEach(die => this.board.removeChild(die));
    }

    /**
     * Make sure the dice board being used in this
     * ContinuouslyThrownDiceAnimation fills the whole browser window.
     */
    fillWindow() {
        this.board.setAttribute("width", window.innerWidth);
        this.board.setAttribute("height", window.innerHeight);

        // Remove all dice from the board to ensure that there are no more
        // dice being thrown than fit on the screen.
        this.clear();
    }

}

// Create and start a ContinuouslyThrownDiceAnimation.
(new ContinuouslyThrownDiceAnimation({board: document.querySelector("top-dice-board")})).start();
