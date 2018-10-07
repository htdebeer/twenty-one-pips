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

// Private properties
const _dragHandler = new WeakMap();


// Interaction states
const NONE = Symbol("no_interaction");
const HOLD = Symbol("hold");
const MOVE = Symbol("move");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction

let offset = {};
const startDragging = (board, point, dieElement) => {
    offset = {
        x: point.x,
        y: point.y
    };

    const transform = dieElement.ownerSVGElement.createSVGTransform();
    const transformList = dieElement.transform.baseVal;

    _dragHandler.set(board, (event) => {
        // Move dieElement to the top of the SVG so it moves over the other dice
        // rather than below them. 
        board.element.removeChild(dieElement);
        board.element.appendChild(dieElement);

        // Get a point in svgport coordinates
        let mappedPoint = board.element.createSVGPoint();
        mappedPoint.x = event.clientX - document.body.scrollLeft;
        mappedPoint.y = event.clientY - document.body.scrollTop;

        // Transform them to user coordinates
        mappedPoint = mappedPoint.matrixTransform(dieElement.getScreenCTM().inverse());

        // Keep track of the offset so the dieElement that is being dragged stays
        // under the cursor rather than having a jerk after starting dragging.
        mappedPoint.x -= offset.x;
        mappedPoint.y -= offset.y;

        // Setup the transformation
        transform.setTranslate(mappedPoint.x, mappedPoint.y);
        transformList.appendItem(transform);
        transformList.consolidate();
    });

    board.element.addEventListener("mousemove", _dragHandler.get(board));
};

const stopDragging = (board) => {
    board.element.removeEventListener("mousemove", _dragHandler.get(board));
};


const convertWindowCoordinatesToCanvas = (canvas, xWindow, yWindow) => {
    const canvasBox = canvas.getBoundingClientRect();

    const x = xWindow - canvasBox.left * (canvas.width / canvasBox.width);
    const y = yWindow - canvasBox.top * (canvas.height / canvasBox.height);

    return {x, y};
};

const renderDie = (board, die) => {
    const HALF = board.dieSize / 2;
    const QUARTER = HALF / 2;
    const {x, y} = die.coordinates;
    if (die.isHeld()) {
        // Render hold circle
        board.context.beginPath();
        board.context.fillStyle = die.heldBy.color;
        board.context.arc(x + HALF, y + HALF, HALF, 0, 2 * Math.PI, false);
        board.context.fill();
    }

    console.log(convertWindowCoordinatesToCanvas(board.context.canvas, 4, 34));

    // Render die

    board.context.fillStyle = die.color;
    board.context.strokeStyle = "black";
    board.context.fillRect(x + QUARTER, y + QUARTER, HALF, HALF);
    board.context.strokeRect(x + QUARTER, y + QUARTER, HALF, HALF);


};

const renderDiceBoard = (board, {dice, player}) => {
    console.log(player);
    board.context.clearRect(0, 0, board.width, board.height);

    const layoutDice = board.layout.layout(dice);
    for (const die of layoutDice) {


        renderDie(board, die);
    }
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
        this.clearRenderedDice(dice);
        renderDiceBoard(this, {dice, player});
    }
};

export {
    CanvasDiceBoard
};
