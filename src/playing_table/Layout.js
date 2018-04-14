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

/**
 * @const
 * DIE_SIZE is the width and height of a dice with hold toggle activated.
 */
const DIE_SIZE = 72.5; //pixels. See dice_svg_template.js for specification of the dice.

// Private fields
const _width = new WeakMap();
const _height = new WeakMap();
const _maximumNumberOfDice = new WeakMap();
const _rotate = new WeakMap();

/**
 * Layout handles laying out the dice on a PlayingTable.
 *
 * @property {Number} width - The width of this GridLayout.
 * @property {Number} height - The height of this GridLayout.
 * @property {Number} maximumNumberOfDice - The maximum number of dice that
 * can be layout on this GridLayout.
 * @property {Boolean} rotate - Indicates if dice are to be rotated.
 */
const Layout = class {

    /**
     * Create a new Layout.
     *
     * @param {Object} config
     * @param {Number} config.maximumNumberOfDice
     * The maximum number of dice that should fit on this Layout.
     * @param {Number} [config.width = 725] - The minimal width of this
     * Layout in pixels. Defaults to 10 dice = 725px;
     * @param {Number} [config.height = 725] - The minimal height of
     * this Layout in pixels. Defaults to 10 dice = 725px.
     * @param {Boolean} [config.rotate = true] - Should dice be rotated?
     * Defaults to true.
     *
     * @throws module:error/ConfigurationError.ConfigurationError width and
     * height have to be a positive number.
     */
    constructor({maximumNumberOfDice, width = 10 * DIE_SIZE, height = 10 * DIE_SIZE, rotate = true}) {
        if (0 >= width) {
            throw new ConfigurationError(`Width should be a number larger than 0, got '${width}' instead.`);
        }
        
        if (0 >= height) {
            throw new ConfigurationError(`Height should be a number larger than 0, got '${height}' instead.`);
        }
        _width.set(this, width);
        _height.set(this, height);
        _maximumNumberOfDice.set(this, maximumNumberOfDice);
        _rotate.set(this, rotate);
    }

    get width() {
        return _width.get(this);
    }

    get height() {
        return _height.get(this);
    }

    get maximumNumberOfDice() {
        return _maximumNumberOfDice.get(this);
    }
    
    get rotate() {
        return _rotate.get(this);
    }

    set rotate(r) {
        _rotate.set(this, r);
    }

    layout(dice) {
    }

    snapTo({x, y}) {
    }
}

export {Layout, DIE_SIZE};
