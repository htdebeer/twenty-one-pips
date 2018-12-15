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
import {ConfigurationError} from "./error/ConfigurationError.js";
import {GridLayout} from "./GridLayout.js";
import {DEFAULT_SYSTEM_PLAYER} from "./Player.js";
import {Die} from "./Die.js";

/**
 * @module
 */

const NATURAL_DIE_SIZE = 145; // px
const DEFAULT_DIE_SIZE = NATURAL_DIE_SIZE; // px
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

// Interaction states
const NONE = Symbol("no_interaction");
const HOLD = Symbol("hold");
const MOVE = Symbol("move");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction

const renderDie = (board, die, point) => {
    const HALF = board.dieSize / 2;
    const QUARTER = HALF / 2;
    const {x, y} = point;
    if (die.isHeld()) {
        // Render hold circle
        board.context.beginPath();
        board.context.fillStyle = die.heldBy.color;
        board.context.arc(x + HALF, y + HALF, HALF, 0, 2 * Math.PI, false);
        board.context.fill();
    }

    // Render die

    board.context.fillStyle = die.color;
    board.context.strokeStyle = "black";
    board.context.fillRect(x + QUARTER, y + QUARTER, HALF, HALF);
    board.context.strokeRect(x + QUARTER, y + QUARTER, HALF, HALF);
};

const _renderDiceBoard = (board, dice) => {
    board.context.clearRect(0, 0, board.width, board.height);

    for (const die of dice) {
        renderDie(board, die, die.coordinates);
    }
};

const convertWindowCoordinatesToCanvas = (canvas, xWindow, yWindow) => {
    const canvasBox = canvas.getBoundingClientRect();

    const x = xWindow - canvasBox.left * (canvas.width / canvasBox.width);
    const y = yWindow - canvasBox.top * (canvas.height / canvasBox.height);

    return {x, y};
};



const setupInteraction = (board) => {
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

            dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(board.element, event.clientX, event.clientY));

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

    const showInteraction = () => {
        /*
        const dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(board.element, event.clientX, event.clientY));
        if (DRAGGING === state) {
            board.element.style.cursor = "grabbing";
        } else if (null !== dieUnderCursor) {
            board.element.style.cursor = "grab";
        } else {
            board.element.style.cursor = "default";
        }
        */
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
                staticBoard = board.context.getImageData(0, 0, board.element.width, board.element.height);
            }
        } else if (DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = dieUnderCursor.coordinates;

            board.context.putImageData(staticBoard, 0, 0);
            renderDie(board, dieUnderCursor, {x: x - dx, y: y - dy});
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

    board.element.addEventListener("mousedown", startInteraction);

    if (board.draggableDice) {
        board.element.addEventListener("mousemove", move);
    }

    if (board.draggableDice || board.holdableDice) {
        board.element.addEventListener("mousemove", showInteraction);
    }

    board.element.addEventListener("mouseup", stopInteraction);
    board.element.addEventListener("mouseout", stopInteraction);
};

// Private properties
const _element = new WeakMap();
const _layout = new WeakMap();
const _dice = new WeakMap();
const _renderedDice = new WeakMap();
const _currentPlayer = new WeakMap();

const makeDice = function (dice) {
    if (Number.isInteger(dice)) {
        return (new Array(dice)).fill(null).map(_ => new Die());
    } else if (Array.isArray(dice)) {
        return dice.map((die) => {
            if (Number.isInteger(die)) {
                return new Die({pips: die});
            } else if ("string" === typeof die) {
                return Die.fromUnicode(die);
            } else if (die instanceof Die) {
                return die;
            } else {
                throw new ConfigurationError(`Die specification '${die}' cannot be interpreted as a die.`);
            }
        });
    } else {
        throw new ConfigurationError(`Dice specification '${dice}' cannot be interpreted as dice or number of dice`);
    }
};



const _diceBoard = new WeakMap();
const OBSERVED_ATTRIBUTES = {
    "width": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.width = v;
            board.element.setAttribute("width", v);
        }
    },
    "height": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => {
            board.layout.height = v;
            board.element.setAttribute("height", v);
        }
    },
    "dispersion": {
        convert: (v) => parseInt(v, 10),
        setter: (board, v) => board.layout.dispersion = v
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
        setter: (board, v) => board.layout.dieSize = v
    },
    "background": {
        convert: (v) => v,
        setter: (board, v) => board.element.style.background = v
    }
};

const attributeNameToPropertyName = (name) => {
    return name.split("-").map((part, index) => {
        if (0 === index) {
            return part;
        } else {
            return part[0].toUpperCase() + part.slice(1);
        }
    }).join("");
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

        _element.set(this, canvas);

        this.dice = [];
        
        // Initialize component
        _renderedDice.set(this, new Map());
        _currentPlayer.set(this, null);
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
        const board = _diceBoard.get(this);

        if (attribute.setter) {
            attribute.setter(this, attribute.convert(newValue));
        }
        
        this._redraw();
    }

    get context() {
        return _element.get(this).getContext("2d");
    }

    get element() {
        return _element.get(this);
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
        return _dice.get(this);
    }
    set dice(dice) {
        // TODO: Complain if |dice| > this.maximumNumberOfDice
        _dice.set(this, makeDice(dice));
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
        return this.hasAttribute("width") ? this.getAttribute("width") : DEFAULT_WIDTH;
    }

    /**
     * The height of this board.
     * @type {Number}
     */
    get height() {
        return this.hasAttribute("height") ? this.getAttribute("height") : DEFAULT_HEIGHT;
    }

    /**
     * The dispersion level of this board.
     * @type {Number}
     */
    get dispersion() {
        return this.hasAttribute("dispersion") ? this.getAttribute("dispersion") : DEFAULT_DISPERSION;
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
        return this.hasAttribute("die-size") ? this.getAttribute("die-size") : DEFAULT_DIE_SIZE;
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
        return this.hasAttribute("hold-duration") ? this.getAttribute("hold-duration") : DEFAULT_HOLD_DURATION;
    }

    /**
     * List of rendered dice.
     *
     * @type {Die[]}
     */
    get renderedDice() {
        return _renderedDice.get(this);
    }

    get currentPlayer() {
        return _currentPlayer.get(this);
    }

    _renderDice({dice, player}) {
        this._clearRenderedDice(dice);
        _currentPlayer.set(this, player);
        _renderDiceBoard(this, this.layout.layout(dice));
    }

    _clearRenderedDice(dice) {
        // Remove all rendered dice that are not to be rendered again
        for (const die of this.renderedDice.keys()) {
            if (!dice.includes(die)) {
                this.renderedDice.delete(die);
            }
        }
    }

    throwDice(player = DEFAULT_SYSTEM_PLAYER) {
        if (!this.dice) {
            this.dice = [];
        }
        this.dice.forEach(die => die.throwIt());
        this._renderDice({dice: this.dice, player});
        return this.dice;
    }

    _redraw() {
        this._renderDice({dice: this.dice, player: this.currentPlayer});
    }

};

window.customElements.define("top-dice-board", TopDiceBoardHTMLElement);

export {
    TopDiceBoardHTMLElement,
    NATURAL_DIE_SIZE,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_DRAGGABLE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
};
