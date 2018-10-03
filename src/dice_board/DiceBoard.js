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
        _element.set(this, this.createElement());

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

    createElement() {
        // Override in subclass
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
        return _width.get(this) || DEFAULT_WIDTH;
    }

    set width(newWidth) {
        _width.set(this, newWidth);
        this.layout.width = newWidth;
        this.element.setAttribute("width", newWidth);
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
        this.layout.height = newHeight;
        this.element.setAttribute("height", newHeight);
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
        this.layout.dispersion = newDispersion;
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
        this.element.style.background = newBackground;
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
        this.layout.dieSize = newDieSize;
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
     * List of rendered dice.
     *
     * @type {Die[]}
     */
    get renderedDice() {
        return _renderedDice.get(this);
    }

    /**
     * Render dice for this player.
     *
     * @param {module:Die~Die[]} dice - The dice to render in this svg.
     * @param {module:Player~Player} player - The player for which this svg
     * is rendered.
     */
    renderDice({dice, player}) {
        console.log(dice, player);
    }

    clearRenderedDice(dice) {
        // Remove all rendered dice that are not to be rendered again
        for (const die of this.renderedDice.keys()) {
            if (!dice.includes(die)) {
                const renderedDie = this.renderedDice.get(die);
                renderedDie.element.parentElement.removeChild(renderedDie.element);
                this.renderedDice.delete(die);
            }
        }
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
    DEFAULT_DISPERSION
};
