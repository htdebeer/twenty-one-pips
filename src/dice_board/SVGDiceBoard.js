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
import {SVGNS} from "./svg.js";
import template from "./dice_svg_template.js";
import {DieSVG} from "./DieSVG.js";
import {
    DiceBoard,
    NATURAL_DIE_SIZE,
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

const renderADie = (board, {die, player}) => {
    const dieSVG = new DieSVG(die);

    // Setup interaction
    let state = NONE;
    let origin = {};
    let holdTimeout = null;

    const holdDie = () => {
        if (HOLD === state || INDETERMINED === state) {
            // toggle hold / release
            if (die.isHeld()) {
                die.releaseIt(player);
            } else {
                die.holdIt(player);
            }
            state = NONE;
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
    };

    const showInteraction = () => {
        dieSVG.element.setAttribute("cursor", "grab");
    };

    const hideInteraction = () => {
        dieSVG.element.setAttribute("cursor", "default");
    };

    const move = (event) => {
        if (MOVE === state || INDETERMINED === state) {
            // Ignore small movements
            const dx = Math.abs(origin.x - event.clientX);
            const dy = Math.abs(origin.y - event.clientY);

            if (MIN_DELTA < dx || MIN_DELTA < dy) {
                state = DRAGGING;
                stopHolding();

                dieSVG.element.setAttribute("cursor", "grabbing");

                let point = board.element.createSVGPoint();
                point.x = event.clientX - document.body.scrollLeft;
                point.y = event.clientY - document.body.scrollTop;
                point = point.matrixTransform(dieSVG.element.getScreenCTM().inverse());

                startDragging(board, point, dieSVG.element, die);
            }
        }
    };

    const stopInteraction = (event) => {
        if (DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = die.coordinates;
            const snapToCoords = board.layout.snapTo({
                die,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            die.coordinates = newCoords;
            console.log(board.dieSize, NATURAL_DIE_SIZE);
            const scale = board.dieSize / NATURAL_DIE_SIZE;
            dieSVG.element.setAttribute("transform", `translate(${newCoords.x},${newCoords.y})scale(${scale})`);

            stopDragging(board);
        }

        state = NONE;
    };

    dieSVG.element.addEventListener("mousedown", startInteraction);
    dieSVG.element.addEventListener("touchstart", startInteraction);

    if (board.draggableDice) {
        dieSVG.element.addEventListener("mousemove", move);
        dieSVG.element.addEventListener("touchmove", move);
    }

    if (board.draggableDice || board.holdableDice) {
        dieSVG.element.addEventListener("mouseover", showInteraction);
        dieSVG.element.addEventListener("mouseout", hideInteraction);
    }

    dieSVG.element.addEventListener("mouseup", stopInteraction);
    dieSVG.element.addEventListener("touchend", stopInteraction);

    return dieSVG;
};

// Apparently, SVG definitions in a shadow DOM do not work (see
// https://github.com/w3c/webcomponents/issues/179). As a workaround, the SVG
// with the dice definitions is put on the BODY. As this SVG with definitions
// only contains definitions, nothing is shown on the screen. However, to make
// sure, it is hidden anyway.
const setupDiceSVGSource = () => {
    if (null === document.querySelector("svg.twenty-one-pips-dice")) {
        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(template, "image/svg+xml");
        const diceSVG = document.body.appendChild(document.importNode(svgDocument.documentElement, true));
        diceSVG.style.display = "none";
    }
};

/**
 * SVGDiceBoard is a component to render and control dice using SVG.
 */
const SVGDiceBoard = class extends DiceBoard {

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

    createElement() {
        setupDiceSVGSource();
        return document.createElementNS(SVGNS, "svg");
    }

    get dieSize() {
        return super.dieSize;
    }

    set dieSize(newDieSize) {
        super.dieSize = newDieSize;
        DieSVG.size = newDieSize;
    }

    renderDie({die, player}) {
        return renderADie(this, {die, player});
    }
};

export {
    SVGDiceBoard
};
