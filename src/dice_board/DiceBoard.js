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
import {ConfigurationError} from "../error/ConfigurationError.js";
import {GridLayout} from "./GridLayout.js";
import {DEFAULT_SYSTEM_PLAYER} from "../Player.js";
import {Die} from "../Die.js";

/**
 * @module
 */

/**
 * @const
 * DIE_SIZE is the width and height of a dice with hold toggle activated.
 *
 * See dice_svg_template.js for the specification of the dice.
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

// Private properties
const _element = new WeakMap();
const _layout = new WeakMap();
const _width = new WeakMap();
const _height = new WeakMap();
const _background = new WeakMap();
const _dieSize = new WeakMap();
const _dice = new WeakMap();
const _draggableDice = new WeakMap();
const _holdableDice = new WeakMap();
const _holdDuration = new WeakMap();
const _dispersion = new WeakMap();

const _renderedDice = new WeakMap();
const _dragHandler = new WeakMap();

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
        _element.get(board).removeChild(dieElement);
        _element.get(board).appendChild(dieElement);

        // Get a point in svgport coordinates
        let mappedPoint = _element.get(board).createSVGPoint();
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

    _element.get(board).addEventListener("mousemove", _dragHandler.get(board));
};

const stopDragging = (board) => {
    _element.get(board).removeEventListener("mousemove", _dragHandler.get(board));
};

const renderDie = (board, {die, player}) => {
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

                let point = _element.get(board).createSVGPoint();
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
            const snapToCoords = _layout.get(board).snapTo({
                die,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            die.coordinates = newCoords;
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
 * DiceBoard is a component to render and control dice 
 */
const DiceBoard = class extends EventTarget {

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
        super();
        setupDiceSVGSource();

        // Setup element
        _element.set(this, document.createElementNS(SVGNS, "svg"));

        if (null !== parent) {
            parent.appendChild(this.element);
        }

        // Initialize component
        _renderedDice.set(this, new Map());
        _layout.set(this, new GridLayout({
            width: width,
            height: height,
            dieSize: dieSize,
            dispersion: dispersion
        }));

        // Initialize properties of the DiceBoard.
        this.width = width;
        this.height = height;
        this.background = background;
        this.dieSize = dieSize;
        this.dice = dice;
        this.draggableDice = draggableDice;
        this.holdableDice = holdableDice;
        this.holdDuration = holdDuration;
        this.dispersion = dispersion;
    }

    /**
     * The DIV element that represents this DiceBoard.
     *
     * @type {DIVHTMLElement}
     */
    get element() {
        return _element.get(this);
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
        return _layout.get(this).maximumNumberOfDice;
    }

    /**
     * The width of this board.
     *
     * @type {Number}
     */
    get width() {
        return _width.get(this) || DEFAULT_WIDTH;
    }

    set width(newWidth) {
        _width.set(this, newWidth);
        _layout.get(this).width = newWidth;
        _element.get(this).setAttribute("width", newWidth);
    }

    /**
     * The height of this board.
     * @type {Number}
     */
    get height() {
        return _height.get(this) || DEFAULT_HEIGHT;
    }

    set height(newHeight) {
        _height.set(this, newHeight);
        _layout.get(this).height = newHeight;
        _element.get(this).setAttribute("height", newHeight);
    }

    /**
     * The dispersion level of this board.
     * @type {Number}
     */
    get dispersion() {
        return _dispersion.get(this) || DEFAULT_DISPERSION;
    }

    set dispersion(newDispersion) {
        _dispersion.set(this, newDispersion);
        _layout.get(this).dispersion = newDispersion;
    }

    /**
     * The background color of this board.
     * @type {String}
     */
    get background() {
        return _background.get(this) || DEFAULT_BACKGROUND;
    }

    set background(newBackground) {
        _background.set(this, newBackground);
        _element.get(this).style.background = newBackground;
    }

    /**
     * The size of dice on this board.
     *
     * @type {Number}
     */
    get dieSize() {
        return _dieSize.get(this) || DEFAULT_DIE_SIZE;
    }

    set dieSize(newDieSize) {
        _dieSize.set(this, newDieSize);
        _layout.get(this).dieSize = newDieSize;
        DieSVG.size = newDieSize;
    }

    /**
     * Can dice on this board be dragged?
     * @type {Boolean}
     */
    get draggableDice() {
        return _draggableDice.get(this) || DEFAULT_DRAGGABLE_DICE;
    }

    set draggableDice(newDraggableDice) {
        _draggableDice.set(this, newDraggableDice);
    }

    /**
     * Can dice on this board be held by a Player?
     * @type {Boolean}
     */
    get holdableDice() {
        return _holdableDice.get(this) || DEFAULT_HOLDABLE_DICE;
    }

    set holdableDice(newHoldableDice) {
        _holdableDice.set(this, newHoldableDice);
    }

    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */
    get holdDuration() {
        return _holdDuration.get(this) || DEFAULT_HOLD_DURATION;
    }

    set holdDuration(newHoldDuration) {
        _holdDuration.set(this, newHoldDuration);
    }

    /**
     * Render dice for this player.
     *
     * @param {module:Die~Die[]} dice - The dice to render in this svg.
     * @param {module:Player~Player} player - The player for which this svg
     * is rendered.
     */
    renderDice({dice, player}) {
        const renderedDice = _renderedDice.get(this);

        // Remove all rendered dice that are not to be rendered again
        for (const die of renderedDice.keys()) {
            if (!dice.includes(die)) {
                const renderedDie = renderedDice.get(die);
                renderedDie.element.parentElement.removeChild(renderedDie.element);
                renderedDice.delete(die);
            }
        }

        _layout.get(this)
            .layout(dice)
            .forEach(die => {
                if (!renderedDice.has(die)) {
                    const renderedDie = renderDie(this, {die, player});
                    _element.get(this).appendChild(renderedDie.element);
                    renderedDice.set(die, renderedDie);
                }

                renderedDice.get(die).render();
            });
    }

    /**
     * Throw the dice on this board.
     *
     * @param {Object} config - the throw configuration.
     * @param {module:Player~Player} [config.player = DEFAULT_SYSTEM_PLAYER] - The throwing
     * player. Dice are always thrown by a
     * Player. If your application does not need Players, the
     * DEFAULT_SYSTEM_PLAYER is used as a Player.
     * @param {module:Die~Die[]|Number|null} [dice = null] - The dice to
     * throw. By default, the dice already on the board are thrown.
     * However, as a shorthand you can specify the dice to throw.
     *
     * @return {module:Die~Die[]} The list with thrown dice.
     */
    throwDice({
        dice = null,
        player = DEFAULT_SYSTEM_PLAYER,
    } = {}) {
        if (null !== dice) {
            this.dice = dice;
        }
        this.dice.forEach(die => die.throwIt());
        this.renderDice({dice: this.dice, player});
        return this.dice;
    }

};

export {
    DiceBoard,
    NATURAL_DIE_SIZE,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_DRAGGABLE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION,
};
