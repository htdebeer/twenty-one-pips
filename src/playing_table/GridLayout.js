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
import {Layout, DIE_SIZE} from "./Layout.js";
import {ConfigurationError} from "../error/ConfigurationError.js";

/**
 * @module
 */

const DEFAULT_WIDTH = 10 * DIE_SIZE;
const DEFAULT_HEIGHT = 10 * DIE_SIZE;
const DEFAULT_DISPERSION = 2;

// Private fields
const _cols = new WeakMap();
const _rows = new WeakMap();
const _dispersion = new WeakMap();

/**
 * Calculate the dimensions needed to fit max number of dice.
 *
 * @param {Number} width - The minimal width
 * @param {Number} height - The minimal height
 * @param {Number} max - The minimal number of dice to fit
 *
 * @return {Object} The number of rows and columns needed to fit at least max number of
 * dice.
 * @private
 */
const calculateDimensions = (width, height, max) => {
    let cols = Math.ceil(width / DIE_SIZE);
    let rows = Math.ceil(height / DIE_SIZE);

    const ratio = width / height;
    let h = height;
    let w = width;
    
    while (max > cols*rows) {
        // calculate better fit: increase height, compute corresponding width
        // by keeping the aspect ratio, and try to see if the cols*rows now is
        // larger than the minimum number of cells needed.
        h = h + DIE_SIZE;
        w = ratio * h;

        cols = Math.ceil(w / DIE_SIZE);
        rows = Math.ceil(h / DIE_SIZE);
    }

    return {cols, rows};
};

/**
 * Convert a (row, col) cell to (x, y) coordinates.
 *
 * @param {Object} cell
 * @return {Object} The corresponding coordinates.
 * @private
 */
const cellToCoords = ({row, col}) => {
    return {x: col * DIE_SIZE, y: row * DIE_SIZE}
};  

/**
 * Convert (x, y) coordinates to a (row, col) cell.
 *
 * @param {Object} coordinates
 * @return {Object} The corresponding cell
 * @private
 */
const coordsToCell = ({x, y}) => {
    return {
        row: Math.trunc(x / DIE_SIZE),
        col: Math.trunc(y / DIE_SIZE)
    }
};

/**
 * GridLayout handles laying out the dice on a PlayingTable.
 *
 * @property {Number} width - The width of this GridLayout.
 * @property {Number} height - The height of this GridLayout.
 * @property {Number} maximumNumberOfDice - The maximum number of dice that
 * can be layout on this GridLayout.
 * @property {Boolean} rotate - Indicates if dice are to be rotated.
 * @property {Number} dispersion - The distance from the center of this Layout a die can be layout.
 *
 * @extends module:playing_table/Layout.Layout
 */
const GridLayout = class extends Layout {

    /**
     * Create a new GridLayout.
     *
     * @param {Object} config
     * @param {Number} config.maximumNumberOfDice
     * The maximum number of dice that should fit on this GridLayout.
     * @param {Number} [config.width = 600] - The minimal width of this
     * GridLayout in pixels. Defaults to 600px;
     * @param {Number} [config.height = 400] - The minimal height of
     * this GridLayout in pixels. Defaults to 400px.
     * @param {Boolean} [config.rotate = true] - Should dice be rotated?
     * Defaults to true.
     * @param {Number} [dispersion = 2] - The distance from the center of the
     * layout a die can be layout.
     *
     * @throws module:error/ConfigurationError.ConfigurationError The dieSize
     * has to be an Integer.
     */
    constructor({
        maximumNumberOfDice, 
        width = DEFAULT_WIDTH, 
        height = DEFAULT_HEIGHT, 
        rotate = true, 
        dispersion = DEFAULT_DISPERSION
    }) {
        super({maximumNumberOfDice, width, height, rotate});

        const {cols, rows} = calculateDimensions(width, height, maximumNumberOfDice);
        _cols.set(this, cols);
        _rows.set(this, rows);
        _dispersion.set(this, dispersion);
    }

    get width() {
        return _cols.get(this) * DIE_SIZE;
    }

    get height() {
        return _rows.get(this) * DIE_SIZE;
    }

    get maximumNumberOfDice() {
        return _cols.get(this) * _rows.get(this);
    }

    get dispersion() {
        return _dispersion.get(this);
    }

    get _rows() {
        return _rows.get(this);
    }

    get _cols() {
        return _cols.get(this);
    }

    get _center() {
        const row = Math.floor(this._rows / 2);
        const col = Math.floor(this._cols / 2);
        
        return {row, col};
    }

    /**
     * Layout dice on this GridLayout.
     *
     * @param {module:Die~Die[]} dice - The dice to layout on this Layout.
     * @return {module:Die~Die[]} The same list of dice, but now layout.
     *
     * @throws {module:error/ConfigurationError~ConfigurationError} The number of
     * dice should not exceed the maximum number of dice this Layout can
     * layout.
     */
    layout(dice) {
        if (dice.length > this.maximumNumberOfDice) {
            throw new ConfigurationError(`The number of dice that can be layout is ${this.maximumNumberOfDice}, got ${dice.lenght} dice instead.`);
        }

        const alreadyLayoutDice = [];
        const diceToLayout = [];

        for (const die of dice) {
            if (die.hasCoordinates() && die.isHeld()) {
                // Dice that are being held and have been layout before should
                // keep their current coordinates and rotation. In other words,
                // these dice are skipped.
                alreadyLayoutDice.push(die);
            } else {
                diceToLayout.push(die);
            }
        }

        const max = Math.min(dice.length * this.dispersion, this.maximumNumberOfDice);
        const availableCells = this._computeAvailableCells(max, alreadyLayoutDice);

        for (const die of diceToLayout) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const randomCell = availableCells[randomIndex];
            availableCells.splice(randomIndex, 1);

            die.coordinates = this._numberToCoordinates(randomCell);
            die.rotation = this.rotate ? Math.random() * 360 : 0;
            alreadyLayoutDice.push(die);
        }

        return alreadyLayoutDice;
    }

    /**
     * Compute a list with available cells to place dice on.
     *
     * @param {Number} max - The number empty cells to compute.
     * @param {Die[]} alreadyLayoutDice - A list with dice that have already been layout.
     * 
     * @return {NUmber[]} The list of available cells represented by their number.
     * @private
     */
    _computeAvailableCells(max, alreadyLayoutDice) {
        let available = [];
        let level = 0;
        const maxLevel = Math.min(this._rows, this._cols);

        while (available.length < max && level < maxLevel) {
            for (const cell of this._cellsOnLevel(level)) {
                if (this._cellIsEmpty(cell, alreadyLayoutDice)) {
                    available.push(cell);
                }
            }

            level++;
        }

        return available;
    }

    /**
     * Calculate all cells on level from the center of the layout.
     *
     * @param {Number} level - The level from the center of the layout. 0
     * indicates the center.
     *
     * @return {Number[]} the cells on the level in this layout represented by
     * their number.
     * @private
     */
     _cellsOnLevel(level) {
        const cells = [];
        const center = this._center;

        if (0 === level) {
            cells.push(this._cellToNumber(center));
        } else {
            for (let row = center.row - level; row <= center.row + level; row++) {
                cells.push(this._cellToNumber({row, col: center.col - level}));
                cells.push(this._cellToNumber({row, col: center.col + level}));
            }

            for (let col = center.col - level + 1; col < center.col + level; col++) {
                cells.push(this._cellToNumber({row: center.row - level, col}));
                cells.push(this._cellToNumber({row: center.row + level, col}));
            }
        }

        return cells.filter(n => 0 <= n && n <= this.maximumNumberOfDice);
    }

    /**
     * Does cell contain a cell from alreadyLayoutDice?
     *
     * @param {Number} cell - A cell in layout represented by a number.
     * @param {Die[]} alreadyLayoutDice - A list of dice that have already been layout.
     *
     * @return {Boolean} True if cell does not contain a die.
     * @private
     */
    _cellIsEmpty(cell, alreadyLayoutDice) {
        return undefined === alreadyLayoutDice.find(
            die => cell === this._coordinatesToNumber(die.coordinates)
        );
    }

    /**
     * Convert a number to a cell (row, col)
     *
     * @param {Number} n - The number representing a cell
     * @returns {Object} Return the cell ({row, col}) corresponding n.
     * @private
     */
    _numberToCell(n) {
        return {row: n / this._cols, col: n % this._cols}
    }

    /**
     * Convert a cell to a number
     *
     * @param {Object} cell - The cell to convert to its number.
     * @return {Number} The number corresponding to the cell.
     * @private
     */
    _cellToNumber({row, col}) {
        return row * this._cols + col;
    }

    /**
     * Convert a cell represented by its number to their coordinates.
     *
     * @param {Number} n - The number representing a cell
     *
     * @return {Object} The coordinates corresponding to the cell represented by
     * this number.
     * @private
     */
    _numberToCoordinates(n) {
        return cellToCoords(this._numberToCell(n));
    }

    /**
     * Convert a pair of coordinates to a number.
     *
     * @param {Object} coords - The coordinates to convert
     *
     * @return {Number} The coordinates converted to a number.
     * @private
     */
    _coordinatesToNumber(coords) {
        return this._cellToNumber(coordsToCell(coords));
    }

    /**
     * Snap (x,y) to the closest cell in this Layout.
     *
     * @param {Object} coordinate
     * @param {Number} coordinate.x - The x-coordinate.
     * @param {Number} coordinate.y - The y-coordinate.
     * 
     * @return {Object} The coordinate of the cell closest to (x, y).
     */
    snapTo({x, y}) {
        console.log("Snapping to ", x, y);
        // TODO
    }

};

export {GridLayout};
