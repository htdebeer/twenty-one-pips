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
import {ViewController} from "../ViewController.js";
import {GridLayout} from "./GridLayout.js";
import {PlayingTableSVG} from "./PlayingTableSVG.js";
import {DEFAULT_SYSTEM_PLAYER} from "../Player.js";

/**
 * @module
 */

/**
 * @const
 * DIE_SIZE is the width and height of a dice with hold toggle activated. 
 *
 * See dice_svg_template.js for the specification of the dice.
 */
const NATURAL_DIE_SIZE = 72.5; // px
const DEFAULT_DIE_SIZE = NATURAL_DIE_SIZE; // px
const DEFAULT_HOLD_DURATION = 375; // ms
const DEFAULT_BACKGROUND = "#FFFFAA";
const DEFAULT_MINIMAL_NUMBER_OF_DICE = 1;
const DEFAULT_WIDTH = 10 * DEFAULT_DIE_SIZE; // px
const DEFAULT_HEIGHT = 10 * DEFAULT_DIE_SIZE; // px
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
                throw new PlayingTableConfigurationError(`Die specification '${die}' cannot be interpreted as a die.`);
            }
        });
    } else {
        throw new PlayingTableConfigurationError(`Dice specification '${dice}' cannot be interpreted as dice or number of dice`);
    }
};

/**
 * PlayingTable is a component to render and control a playing table with dice
 * thrown upon it.
 *
 * @extends module:ViewController~ViewController
 */
const PlayingTable = class extends ViewController {

    constructor({
        parent = null,
        dice = [],
        minimalNumberOfDice = DEFAULT_MINIMAL_NUMBER_OF_DICE,
        background = DEFAULT_BACKGROUND,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        dieSize = DEFAULT_DIE_SIZE,
        rotateDice = true,
        draggableDice = true,
        holdableDice = true,
        holdDuration = DEFAULT_HOLD_DURATION,
        dispersion = DEFAULT_DISPERSION,
    }) {
        super();
        this.element.classList.add("playing-table");

        this.dice = dice;

        _layout.set(this, new GridLayout({
            minimalNumberOfDice: Math.max(minimalNumberOfDice, this.dice.length),
            width,
            height,
            dieSize,
            rotation,
            dispersion
        }));
    }

    get dice() {
        return _dice.get(this);
    }

    set dice(dice) {
        // Complain if |dice| > this.maximumNumberOfDice
        _dice.set(this, makeDice(dice));
    }

    get maximumNumberOfDice() {
        return _layout.get(this).maximumNumberOfDice;
    }

    get width() {
        return _view.get(this).width;
    }

    set width(w) {
        // Should layout be reset as well?
        _view.get(this).width = width;
    }

    get height() {
        return _view.get(this).height;
    }

    set height(h) {
        // Should layout be reset as well?
        _view.get(this).height = height;
    }

    get dispersion() {
        return _layout.get(this).dispersion;
    }

    set dispersion(d) {
        _layout.get(this).dispersion = d;
    }

    get background() {
        return _view.get(this).background;
    }

    set background(b) {
        _view.get(this).background = b;
    }

    get dieSize() {
        return _layout.get(this).dieSize;
    }

    get rotateDice() {
        return _layout.get(this).rotate;
    }

    set rotateDice(r) {
        _layout.get(this).rotate = r;
    }

    get draggableDice() {
        return _view.get(this).draggableDice;
    }

    set draggableDice(d) {
        _view.set(this).draggableDice = d;
    }

    get holdableDice() {
        return _view.get(this).holdableDice;
    }

    set holdableDice(d) {
        _view.get(this).holdableDice = d;
    }

    get holdDuration() {
        return _view.get(this).holdDuration;
    }

    set holdDuration(h) {
        _view.get(this).holdDuration = h;
    }

    throwDice({
        dice = null,
        player = null,
    }) {
        if (null !== dice) {
            this.dice = dice;
        }

        if (null === player) {
            player = DEFAULT_SYSTEM_PLAYER;
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
    DEFAULT_MINIMAL_NUMBER_OF_DICE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
};
