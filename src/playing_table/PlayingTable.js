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
import {ViewController} from "../ViewController.js";
import {GridLayout} from "./GridLayout.js";
import {PlayingTableSVG} from "./PlayingTableSVG.js";
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

const ROWS = 10;
const COLS = 10;

const DEFAULT_WIDTH = COLS * DEFAULT_DIE_SIZE; // px
const DEFAULT_HEIGHT = ROWS * DEFAULT_DIE_SIZE; // px
const DEFAULT_DISPERSION = 2;

// Private properties
const _view = new WeakMap();
const _layout = new WeakMap();
const _dice = new WeakMap();

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
 * PlayingTable is a component to render and control a playing table with dice
 * thrown upon it.
 *
 * @property {HTMLElement|null} [parent = null] - The parent HTML DOM element this PlayingTable is a child of.
 * @property {module:Die~Die[]|Number} [dice = []] - The dice to show in this
 * PlayingTable. If dice is a positive number, create that many dice.
 * @property {Number} [minimalNumberOfDice = DEFAULT_MINIMAL_NUMBER_OF_DICE]
 * - The minimal number of dice that can be shown in this PlayingTable.
 * @property {String} [background = DEFAULT_BACKGROUND] - This PlayingTable's
 * background color.
 * @property {Number} [width = DEFAULT_WIDTH] - This PlayingTable's width,
 * width > 0.
 * @property {Number} [height = DEFAULT_HEIGHT] - This PlayingTable's
 * height, height > 0.
 * @property {Number} [dieSize = DEFAULT_DIE_SIZE] - The size of dice
 * on this PlayingTable, size > 0.
 * @property {Boolean} [rotateDice = true] - Should dice be rotated
 * when thrown on this PlayingTable?
 * @property {Boolean} [draggableDice = true] - Can dice be dragged
 * around on this PlayingTable?
 * @property {Boolean} [holdableDice = true] - Can dice be held by a
 * Player on this PlayingTable?
 * @property {Number} [holdDuration = DEFAULT_HOLD_DURATION] - The
 * duration a Player needs to press the mouse curson on a die to mark a
 * Die as being held by her.
 * @property {Number} [dispersion = DEFAULT_DISPERSION] - The
 * dispersion level, wich implies the possible distance of a Die from the center of
 * this PlayingTable.
 *
 * @extends module:ViewController~ViewController
 */
const PlayingTable = class extends ViewController {

    /**
     * Create a new PlayingTable component.
     *
     * @param {Object} config - The initial configuration of the new
     * PlayingTable.
     * @param {HTMLElement|null} [config.parent = null] - The parent HTML DOM element this PlayingTable is a child of.
     * @param {module:Die~Die[]|Number} [config.dice = []] - The dice to show in this
     * PlayingTable. If dice is a positive number, create that many dice.
     * @param {Number} [config.minimalNumberOfDice = DEFAULT_MINIMAL_NUMBER_OF_DICE]
     * - The minimal number of dice that can be shown in this PlayingTable.
     * @param {String} [config.background = DEFAULT_BACKGROUND] - This PlayingTable's
     * background color.
     * @param {Number} [config.width = DEFAULT_WIDTH] - This PlayingTable's width,
     * width > 0.
     * @param {Number} [config.height = DEFAULT_HEIGHT] - This PlayingTable's
     * height, height > 0.
     * @param {Number} [config.dieSize = DEFAULT_DIE_SIZE] - The size of dice
     * on this PlayingTable, size > 0.
     * @param {Boolean} [config.rotateDice = true] - Should dice be rotated
     * when thrown on this PlayingTable?
     * @param {Boolean} [config.draggableDice = true] - Can dice be dragged
     * around on this PlayingTable?
     * @param {Boolean} [config.holdableDice = true] - Can dice be held by a
     * Player on this PlayingTable?
     * @param {Number} [config.holdDuration = DEFAULT_HOLD_DURATION] - The
     * duration a Player needs to press the mouse curson on a die to mark a
     * Die as being held by her.
     * @param {Number} [config.dispersion = DEFAULT_DISPERSION] - The
     * dispersion level, wich implies the possible distance of a Die from the center of
     * this PlayingTable.
     */
    constructor({
        parent = null,
        dice = [],
        background = DEFAULT_BACKGROUND,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        dieSize = DEFAULT_DIE_SIZE,
        rotateDice = true,
        draggableDice = true,
        holdableDice = true,
        holdDuration = DEFAULT_HOLD_DURATION,
        dispersion = DEFAULT_DISPERSION,
    } = {}) {
        super({parent});
        this.element.classList.add("playing-table");

        this.dice = dice;

        _layout.set(this, new GridLayout({
            width,
            height,
            dieSize,
            rotate: rotateDice,
            dispersion
        }));

        _view.set(this, new PlayingTableSVG({
            parent: this.element,
            width,
            height,
            layout: _layout.get(this),
            dieSize,
            background,
            draggableDice,
            holdableDice,
            holdDuration
        }));

    }


    /**
     * The dice on this PlayingTable. Note, to actually throw the dice use
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
     * The maximum number of dice that can be put on this PlayingTable.
     *
     * @return {Number} The maximum number of dice, 0 < maximum.
     */
    get maximumNumberOfDice() {
        return _layout.get(this).maximumNumberOfDice;
    }

    /**
     * The width of this PlayingTable.
     *
     * @type {Number}
     */
    get width() {
        return _layout.get(this).width;
    }
    set width(w) {
        _view.get(this).width = w;
        _layout.get(this).width = w;
    }

    /**
     * The height of this PlayingTable.
     * @type {Number}
     */
    get height() {
        return _layout.get(this).height;
    }
    set height(h) {
        _view.get(this).height = h;
        _layout.get(this).height = h;
    }

    /**
     * The dispersion level of this PlayingTable.
     * @type {Number}
     */
    get dispersion() {
        return _layout.get(this).dispersion;
    }
    set dispersion(d) {
        _layout.get(this).dispersion = d;
    }

    /**
     * The background color of this PlayingTable.
     * @type {String}
     */
    get background() {
        return _view.get(this).background;
    }
    set background(b) {
        _view.get(this).background = b;
    }

    /**
     * The size of dice on this PlayingTable.
     *
     * @type {Number}
     */
    get dieSize() {
        return _layout.get(this).dieSize;
    }
    set dieSize(ds) {
        _layout.get(this).dieSize = ds;
    }

    /**
     * Should dice be rotated on this PlayingTable?
     * @type {Boolean}
     */
    get rotateDice() {
        return _layout.get(this).rotate;
    }
    set rotateDice(r) {
        _layout.get(this).rotate = r;
    }

    /**
     * Can dice on this PlayingTable be dragged?
     * @type {Boolean}
     */
    get draggableDice() {
        return _view.get(this).draggableDice;
    }
    set draggableDice(d) {
        _view.set(this).draggableDice = d;
    }

    /**
     * Can dice on this PlayingTable be held by a Player?
     * @type {Boolean}
     */
    get holdableDice() {
        return _view.get(this).holdableDice;
    }
    set holdableDice(d) {
        _view.get(this).holdableDice = d;
    }

    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */
    get holdDuration() {
        return _view.get(this).holdDuration;
    }
    set holdDuration(h) {
        _view.get(this).holdDuration = h;
    }

    /**
     * Throw the dice on this PlayingTable.
     *
     * @param {Object} config - the throw configuration.
     * @param {module:Player~Player} [config.player = DEFAULT_SYSTEM_PLAYER] - The throwing
     * player. Dice are always thrown by a
     * Player. If your application does not need Players, the
     * DEFAULT_SYSTEM_PLAYER is used as a Player.
     * @param {module:Die~Die[]|Number|null} [dice = null] - The dice to
     * throw. By default, the dice already on the PlayingTable are thrown.
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
        _view.get(this).renderDice({dice: this.dice, player});
        return this.dice;
    }

    /**
     * Place the dice on this PlayingTable.
     *
     * @param {Object} config - the throw configuration.
     * @param {module:Player~Player} [config.player = DEFAULT_SYSTEM_PLAYER] - The throwing
     * player. Dice are always thrown by a
     * Player. If your application does not need Players, the
     * DEFAULT_SYSTEM_PLAYER is used as a Player.
     * @param {module:Die~Die[]|Number|null} [dice = null] - The dice to
     * throw. By default, the dice already on the PlayingTable are thrown.
     * However, as a shorthand you can specify the dice to throw.
     *
     * @return {module:Die~Die[]} The list with thrown dice.
     */
    placeDice({
        dice = null,
        player = DEFAULT_SYSTEM_PLAYER,
    } = {}) {
        if (null !== dice) {
            this.dice = dice;
        }
        _view.get(this).renderDice({dice: this.dice, player});
        return this.dice;
    }

};

export {
    PlayingTable,
    NATURAL_DIE_SIZE,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
};
