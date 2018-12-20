/**
 * Copyright (c) 2018 Huub de Beer
 *
 * This file is part of twenty-one-pips.
 *
 * Twenty-one-pips is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Twenty-one-pips is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with twenty-one-pips.  If not, see <http://www.gnu.org/licenses/>.
 * @ignore
 */
//import {ConfigurationError} from "./error/ConfigurationError.js";
import {GridLayout} from "./GridLayout.js";
import {DEFAULT_SYSTEM_PLAYER} from "./TopPlayerHTMLElement.js";

/**
 * @module
 */

const DEFAULT_DIE_SIZE = 100; // px
const DEFAULT_HOLD_DURATION = 375; // ms
const DEFAULT_BACKGROUND = "#FFFFAA";
const DEFAULT_DRAGGABLE_DICE = true;
const DEFAULT_HOLDABLE_DICE = true;

const ROWS = 10;
const COLS = 10;

const DEFAULT_WIDTH = COLS * DEFAULT_DIE_SIZE; // px
const DEFAULT_HEIGHT = ROWS * DEFAULT_DIE_SIZE; // px
const DEFAULT_DISPERSION = 2;

const MIN_DELTA = 3; //px

// Private properties
const _canvas = new WeakMap();
const _layout = new WeakMap();
const _currentPlayer = new WeakMap();

// Interaction states
const NONE = Symbol("no_interaction");
const HOLD = Symbol("hold");
const MOVE = Symbol("move");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction
const _renderDiceBoard = (board, dice) => {
    board.context.clearRect(0, 0, board.width, board.height);

    for (const die of dice) {
        die.render(board.context, board.dieSize);
    }
};

const convertWindowCoordinatesToCanvas = (canvas, xWindow, yWindow) => {
    const canvasBox = canvas.getBoundingClientRect();

    const x = xWindow - canvasBox.left * (canvas.width / canvasBox.width);
    const y = yWindow - canvasBox.top * (canvas.height / canvasBox.height);

    return {x, y};
};



const setupInteraction = (board) => {
    const canvas = _canvas.get(board);

    // Setup interaction
    let origin = {};
    let state = NONE;
    let staticBoard = null;
    let dieUnderCursor = null;
    let holdTimeout = null;

    const holdDie = () => {
        if (HOLD === state || INDETERMINED === state) {
            // toggle hold / release
            if (dieUnderCursor.isHeld()) {
                dieUnderCursor.releaseIt(board.currentPlayer);
            } else {
                dieUnderCursor.holdIt(board.currentPlayer);
            }
            state = NONE;

            _renderDiceBoard(board, board.dice);
        }

        holdTimeout = null;
    };

    const startHolding = () => {
        holdTimeout = window.setTimeout(holdDie, board.holdDuration);
    };

    const stopHolding = () => {
        window.clearTimeout(holdTimeout);
        holdTimeout = null;
    };

    const startInteraction = (event) => {
        if (NONE === state) {

            origin = {
                x: event.clientX,
                y: event.clientY
            };

            dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));

            if (null !== dieUnderCursor) {
                // Only interaction with the board via a die
                if (board.holdableDice && board.draggableDice) {
                    state = INDETERMINED;
                    startHolding();
                } else if (board.holdableDice) {
                    state = HOLD;
                    startHolding();
                } else if (board.draggableDice) {
                    state = MOVE;
                }
            }

        }
    };

    const showInteraction = (event) => {
        const dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));
        if (DRAGGING === state) {
            canvas.style.cursor = "grabbing";
        } else if (null !== dieUnderCursor) {
            canvas.style.cursor = "grab";
        } else {
            canvas.style.cursor = "default";
        }
    };

    const move = (event) => {
        if (MOVE === state || INDETERMINED === state) {
            // determine if a die is under the cursor
            // Ignore small movements
            const dx = Math.abs(origin.x - event.clientX);
            const dy = Math.abs(origin.y - event.clientY);

            if (MIN_DELTA < dx || MIN_DELTA < dy) {
                state = DRAGGING;
                stopHolding();

                const diceWithoutDieUnderCursor = board.dice.filter(die => die !== dieUnderCursor);
                _renderDiceBoard(board, diceWithoutDieUnderCursor);
                staticBoard = board.context.getImageData(0, 0, canvas.width, canvas.height);
            }
        } else if (DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = dieUnderCursor.coordinates;

            board.context.putImageData(staticBoard, 0, 0);
            dieUnderCursor.render(board.context, board.dieSize, {x: x - dx, y: y - dy});
        }
    };

    const stopInteraction = (event) => {
        if (null !== dieUnderCursor && DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = dieUnderCursor.coordinates;

            const snapToCoords = board.layout.snapTo({
                die: dieUnderCursor,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            dieUnderCursor.coordinates = newCoords;
        }

        // Clear state
        dieUnderCursor = null;
        state = NONE;

        // Refresh board; Render dice
        _renderDiceBoard(board, board.dice);
    };


    // Register the actual event listeners defined above

    canvas.addEventListener("mousedown", startInteraction);

    if (board.draggableDice) {
        canvas.addEventListener("mousemove", move);
    }

    if (board.draggableDice || board.holdableDice) {
        canvas.addEventListener("mousemove", showInteraction);
    }

    canvas.addEventListener("mouseup", stopInteraction);
    canvas.addEventListener("mouseout", stopInteraction);
};

const OBSERVED_ATTRIBUTES = {
    "width": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.width = v;
            _canvas.get(board).setAttribute("width", v);
        }
    },
    "height": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.height = v;
            _canvas.get(board).setAttribute("height", v);
        }
    },
    "dispersion": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.dispersion = v;
        }
    },
    "draggable-dice": {
        convert: (v) => v
    },
    "holdable-dice": {
        convert: (v) => v
    },
    "hold-duration": {
        convert: (v) => v
    },
    "die-size": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.dieSize = v;
        }
    },
    "background": {
        convert: (v) => v,
        setter: (board, v) => {
            _canvas.get(board).style.background = v;
        }
    }
};

/**
 * TopDiceBoardHTMLElement is the "top-dice-board" custom HTML element.
 *
 */
const TopDiceBoardHTMLElement = class extends HTMLElement {

    /**
     * Create a new TopDiceBoardHTMLElement.
     */
    constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        const canvas = document.createElement("canvas");
        shadow.appendChild(canvas);

        _canvas.set(this, canvas);
        _currentPlayer.set(this, DEFAULT_SYSTEM_PLAYER);
        _layout.set(this, new GridLayout({
            width: this.width,
            height: this.height,
            dieSize: this.dieSize,
            dispersion: this.dispersion
        }));
        setupInteraction(this);
    }

    static get observedAttributes() {
        return Object.keys(OBSERVED_ATTRIBUTES);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const attribute = OBSERVED_ATTRIBUTES[name];

        if (attribute.setter) {
            attribute.setter(this, attribute.convert(newValue));
        }
    }

    connectedCallback() {
        let numberOfReadyDice = 0;

        this.addEventListener("top-die:added", () => {
            numberOfReadyDice++;
            if (numberOfReadyDice === this.dice.length) {
                _renderDiceBoard(this, this.layout.layout(this.dice));
            }
        });

        this.addEventListener("top-die:removed", () => {
            _renderDiceBoard(this, this.layout.layout(this.dice));
            numberOfReadyDice--;
        });
    }

    disconnectedCallback() {
    }

    adoptedCallback() {
    }

    get context() {
        return _canvas.get(this).getContext("2d");
    }

    /**
     * The GridLayout used by this DiceBoard to layout the dice.
     *
     * @type {GridLayout}
     */
    get layout() {
        return _layout.get(this);
    }

    /**
     * The dice on this board. Note, to actually throw the dice use
     * @see{throwDice}. 
     *
     * @type {module:Die~Die[]}
     */
    get dice() {
        return [...this.getElementsByTagName("top-die")];
    }

    /**
     * The maximum number of dice that can be put on this board.
     *
     * @return {Number} The maximum number of dice, 0 < maximum.
     */
    get maximumNumberOfDice() {
        return this.layout.maximumNumberOfDice;
    }

    /**
     * The width of this board.
     *
     * @type {Number}
     */
    get width() {
        return this.hasAttribute("width") ? parseInt(this.getAttribute("width"), 10) : DEFAULT_WIDTH;
    }

    /**
     * The height of this board.
     * @type {Number}
     */
    get height() {
        return this.hasAttribute("height") ? parseInt(this.getAttribute("height"), 10) : DEFAULT_HEIGHT;
    }

    /**
     * The dispersion level of this board.
     * @type {Number}
     */
    get dispersion() {
        return this.hasAttribute("dispersion") ? parseInt(this.getAttribute("dispersion"), 10) : DEFAULT_DISPERSION;
    }

    /**
     * The background color of this board.
     * @type {String}
     */
    get background() {
        return this.hasAttribute("background") ? this.getAttribute("background") : DEFAULT_BACKGROUND;
    }

    /**
     * The size of dice on this board.
     *
     * @type {Number}
     */
    get dieSize() {
        return this.hasAttribute("die-size") ? parseInt(this.getAttribute("die-size"), 10) : DEFAULT_DIE_SIZE;
    }

    /**
     * Can dice on this board be dragged?
     * @type {Boolean}
     */
    get draggableDice() {
        return this.hasAttribute("draggable-dice") ? this.getAttribute("draggable-dice") : DEFAULT_DRAGGABLE_DICE;
    }

    /**
     * Can dice on this board be held by a Player?
     * @type {Boolean}
     */
    get holdableDice() {
        return this.hasAttribute("holdable-dice") ? this.getAttribute("holdable-dice") : DEFAULT_HOLDABLE_DICE;
    }

    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */
    get holdDuration() {
        return this.hasAttribute("hold-duration") ? parseInt(this.getAttribute("hold-duration"), 10) : DEFAULT_HOLD_DURATION;
    }

    set currentPlayer(newPlayer) {
        _currentPlayer.set(this, newPlayer);
    }

    get currentPlayer() {
        return _currentPlayer.get(this);
    }

    getPlayer(playerName) {
        const playerList = this.querySelector("top-player-list");
        return null === playerList ? null : playerList.find(playerName);
    }

    throwDice(player = DEFAULT_SYSTEM_PLAYER) {
        this.dice.forEach(die => die.throwIt());
        this.currentPlayer = player;;
        _renderDiceBoard(this, this.layout.layout(this.dice));
        return this.dice;
    }
};

window.customElements.define("top-dice-board", TopDiceBoardHTMLElement);

export {
    TopDiceBoardHTMLElement,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_DRAGGABLE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
};
