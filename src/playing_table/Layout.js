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

/**
 * @module
 */
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

const _dieSize = new WeakMap();
const _rotate = new WeakMap();
const _width = new WeakMap();
const _height = new WeakMap();
const _maximumNumberOfDice = new WeakMap();

/**
 * Layout handles laying out the dice on a PlayingTable.
 *
 * @property {Number} width - The width of this GridLayout.
 * @property {Number} height - The height of this GridLayout.
 * @property {Number} dieSize - The size of the dice.
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
     * The maximum number of dice that should fit on this GridLayout.
     * @param {Integer} config.dieSize - The size of a die in pixels. This has to be an
     * Integer.
     * @param {Number} [config.width = DEFAULT_WIDTH] - The minimal width of this
     * GridLayout in pixels. Defaults to 600px;
     * @param {Number} [config.height = DEFAULT_HEIGHT] - The minimal height of
     * this GridLayout in pixels. Defaults to 400px.
     * @param {Boolean} [config.rotate = true] - Should dice be rotated?
     * Defaults to true.
     *
     * @throws module:error/ConfigurationError.ConfigurationError The dieSize
     * has to be an Integer and the height and width > 0.
     */
    constructor({
        maximumNumberOfDice, 
        dieSize, 
        width = DEFAULT_WIDTH, 
        height = DEFAULT_HEIGHT, 
        rotate = true
    }) {
        if (!Number.isInteger(dieSize) || 0 >= dieSize) {
            throw new ConfigurationError(`The dieSize needs to be a whole number > 0, got '${dieSize}' instead.`);
        }

        if (0 >= width) {
            throw new ConfigurationError(`Width should be a number larger than 0, got '${width}' instead.`);
        }
        
        if (0 >= height) {
            throw new ConfigurationError(`Height should be a number larger than 0, got '${height}' instead.`);
        }
        _dieSize.set(this, dieSize);
        _rotate.set(this, rotate);
        _width.set(this, width);
        _height.set(this, height);
        _maximumNumberOfDice.set(this, maximumNumberOfDice);
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

    get dieSize() {
        return _dieSize.get(this);
    }

    get rotate() {
        return _rotate.get(this);
    }

    set rotate(r) {
        _rotate.set(this, r);
    }

    /**
     * Layout dice on this GridLayout. To be implemented in a child class.
     *
     * @param {module:Die~Die[]} dice - The dice to layout on this GridLayout.
     * @return {Object[]} A list with dice and their layout coordinates (x, y) and their rotation.
     *
     * throw module:error/ConfigurationError~ConfigurationError The number of
     * dice should not exceed the maximum number of dice this GridLayout can
     * layout.
     */
    layout(dice, dispersion = 1) {
    }

    /**
     * Snap (x,y) to the closest cell on this Layout. To be implemented in a
     * child class.
     *
     * @param {Object} coordinate
     * @param {Number} coordinate.x - The x-coordinate.
     * @param {Number} coordinate.y - The y-coordinate.
     * 
     * @return {Object} The coordinate of the cell closest to (x, y).
     */
    snapTo({x, y}) {
    }

};

export {Layout};
