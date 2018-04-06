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

/**
 * @module
 */

const _view = new WeakMap();
const _layout = new WeakMap();

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

    constructor() {
        _view.set(this, new PlayingTableView());
        const layout = new GridLayout();
    }
};

export {PlayingTable};
