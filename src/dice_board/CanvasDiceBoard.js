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
import {
    DiceBoard,
    //NATURAL_DIE_SIZE,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_DRAGGABLE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
} from "./DiceBoard.js";

/**
 * @module
 */
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

const renderDiceBoard = (board, dice) => {
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



const setupInteraction = (board, player) => {
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
                dieUnderCursor.releaseIt(player);
            } else {
                dieUnderCursor.holdIt(player);
            }
            state = NONE;

            renderDiceBoard(board, board.dice);
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
                renderDiceBoard(board, diceWithoutDieUnderCursor);
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
                dieUnderCursor,
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
        renderDiceBoard(board, board.dice);
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

/**
 * CanvasDiceBoard is a component to render and control dice using the
 * CanvasHTMLElement.
 */
const CanvasDiceBoard = class extends DiceBoard {

    /**
     * @typedef {Object} DiceBoardConfiguration
     * @property {HTMLElement} [parent = null] - The DiceBoard's parent HTML
     * Element, if any. Defaults to null;
     * @property {Number} [width = DEFAULT_WIDTH] - The width of the
     * DiceBoard.
     * @property {Number} [height = DEFAULT_HEIGHT] - The height of the
     * DiceBoard.
     * @property {ColorString} [color = DEFAULT_BACKGROUND] - The background
     * color of the DiceBoard.
     * @property {Number|Dice[]} [dice = []] - The dice to put on the
     * DiceBoard. If dice is a number, that amount of random dice are put on
     * the DiceBoard.
     * @property {Number} [dieSize = DEFAULT_DIE_SIZE] - The size of the dice
     * on the DiceBoard.
     * @property {Boolean} [draggableDice = DEFAULT_DRAGGABLE_DICE] - Can the
     * dice on the DiceBoard be dragged around? Defaults to true.
     * @property {Boolean} [holdableDice = DEFAULT_HOLDABLE_DICE] - Can the
     * dice on the DiceBoard be hold by a player? Defaults to true. 
     * @property {Number} [holdDuration = DEFAULT_HOLD_DURATION] - The time a
     * player needs to click on a die to hold or release it.
     * @property {Number} [dispersion = DEFAULT_DISPERSION] - The dispersion
     * spread of dice on the DiceBoard.
     */

    /**
     * Create a new DiceBoard.
     *
     * @param {DiceBoardConfiguration} config - The configuration of this
     * DiceBoard.
     */
    constructor({
        parent = null,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        background = DEFAULT_BACKGROUND,
        dice = [],
        dieSize = DEFAULT_DIE_SIZE,
        draggableDice = DEFAULT_DRAGGABLE_DICE,
        holdableDice = DEFAULT_HOLDABLE_DICE,
        holdDuration = DEFAULT_HOLD_DURATION,
        dispersion = DEFAULT_DISPERSION
    } = {}) {
        super({
            parent,
            width,
            height,
            background,
            dice,
            dieSize,
            draggableDice,
            holdableDice,
            holdDuration,
            dispersion
        });
    }

    /***
     * The 2D rendering context of this DiceBoard.
     *
     * @type {CanvasRenderingContext2D}
     */
    get context() {
        return this.element.getContext("2d");
    }

    createElement() {
        return document.createElement("canvas");
    }

    renderDice({dice, player}) {
        super.renderDice({dice, player});
        this.clearRenderedDice(dice);
        renderDiceBoard(this, this.layout.layout(dice));
        setupInteraction(this, player);
    }
};

export {
    CanvasDiceBoard
};
