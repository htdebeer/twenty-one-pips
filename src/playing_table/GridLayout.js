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
    DEFAULT_DIE_SIZE,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
} from "./PlayingTable.js";
import {ConfigurationError} from "../error/ConfigurationError.js";

/**
 * @module
 */

const HALF = 2;
const FULL_CIRCLE_IN_DEGREES = 360;

// Private fields
const _rotate = new WeakMap();
const _width = new WeakMap();
const _height = new WeakMap();
const _cols = new WeakMap();
const _rows = new WeakMap();
const _dice = new WeakMap();
const _dieSize = new WeakMap();
const _dispersion = new WeakMap();


/**
 * GridLayout handles laying out the dice on a PlayingTable.
 */
const GridLayout = class {

    /**
     * Create a new GridLayout.
     *
     * @param {Object} config - The configuration of the GridLayout
     * @param {Number} [config.width = DEFAULT_WIDTH] - The minimal width of this
     * GridLayout in pixels. Defaults to DEFAULT_WIDTH;
     * @param {Number} [config.height = DEFAULT_HEIGHT] - The minimal height of
     * this GridLayout in pixels. Defaults to DEFAULT_HEIGHT.
     * @param {Boolean} [config.rotate = true] - Should dice be rotated?
     * Defaults to true.
     * @param {Number} [config.dispersion = 2] - The distance from the center of the
     * layout a die can be layout.
     * @param {Number} [config.dieSize = DEFAULT_DIE_SIZE] - The size of a die.
     */
    constructor({
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        rotate = true,
        dispersion = DEFAULT_DISPERSION,
        dieSize = DEFAULT_DIE_SIZE
    } = {}) {
        _dieSize.set(this, 1);
        _width.set(this, 0);
        _height.set(this, 0);

        this.dispersion = dispersion;
        this.rotate = rotate;
        this.dieSize = dieSize;
        this.width = width;
        this.height = height;
    }

    /**
     * The width in pixels used by this GridLayout.
     * @throws module:error/ConfigurationError.ConfigurationError Width >= 0
     * @type {Number} 
     */
    get width() {
        return _width.get(this);
    }

    set width(w) {
        if (0 > w) {
            throw new ConfigurationError(`Width should be a number larger than 0, got '${w}' instead.`);
        }
        _width.set(this, w);
        this._calculateGrid(this.width, this.height);
    }

    /**
     * The height in pixels used by this GridLayout. 
     * @throws module:error/ConfigurationError.ConfigurationError Height >= 0
     *
     * @type {Number}
     */
    get height() {
        return _height.get(this);
    }

    set height(h) {
        if (0 > h) {
            throw new ConfigurationError(`Height should be a number larger than 0, got '${h}' instead.`);
        }
        _height.set(this, h);
        this._calculateGrid(this.width, this.height);
    }

    /**
     * The maximum number of dice that can be layout on this GridLayout. This
     * number is >= 0. Read only.
     *
     * @type {Number}
     */
    get maximumNumberOfDice() {
        return this._cols * this._rows;
    }

    /**
     * The dispersion level used by this GridLayout. The dispersion level
     * indicates the distance from the center dice can be layout. Use 1 for a
     * tight packed layout.
     *
     * @throws module:error/ConfigurationError.ConfigurationError Dispersion >= 0
     * @type {Number}
     */
    get dispersion() {
        return _dispersion.get(this);
    }

    set dispersion(d) {
        if (0 > d) {
            throw new ConfigurationError(`Dispersion should be a number larger than 0, got '${d}' instead.`);
        }
        return _dispersion.set(this, d);
    }

    /**
     * Should dice be rotated when layout?
     *
     * @type {Boolean}
     */
    get rotate() {
        return _rotate.get(this);
    }

    set rotate(r) {
        _rotate.set(this, r);
    }

    /**
     * The size of a die.
     *
     * @throws module:error/ConfigurationError.ConfigurationError DieSize >= 0
     * @type {Number}
     */
    get dieSize() {
        return _dieSize.get(this);
    }

    set dieSize(ds) {
        if (0 >= ds) {
            throw new ConfigurationError(`dieSize should be a number larger than 1, got '${ds}' instead.`);
        }
        _dieSize.set(this, ds);
        this._calculateGrid(this.width, this.height);
    }

    /**
     * The number of rows in this GridLayout.
     *
     * @return {Number} The number of rows, 0 < rows.
     * @private
     */
    get _rows() {
        return _rows.get(this);
    }

    /**
     * The number of columns in this GridLayout.
     *
     * @return {Number} The number of columns, 0 < columns.
     * @private
     */
    get _cols() {
        return _cols.get(this);
    }

    /**
     * The center cell in this GridLayout.
     *
     * @return {Object} The center (row, col).
     * @private
     */
    get _center() {
        const row = Math.floor(this._rows / HALF);
        const col = Math.floor(this._cols / HALF);

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
            die.rotation = this.rotate ? Math.random() * FULL_CIRCLE_IN_DEGREES : 0;
            alreadyLayoutDice.push(die);
        }

        _dice.set(this, alreadyLayoutDice);

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
        const available = new Set();
        let level = 0;
        const maxLevel = Math.min(this._rows, this._cols);

        while (available.size < max && level < maxLevel) {
            for (const cell of this._cellsOnLevel(level)) {
                if (undefined !== cell && this._cellIsEmpty(cell, alreadyLayoutDice)) {
                    available.add(cell);
                }
            }

            level++;
        }

        return Array.from(available);
    }

    /**
     * Calculate all cells on level from the center of the layout.
     *
     * @param {Number} level - The level from the center of the layout. 0
     * indicates the center.
     *
     * @return {Set<Number>} the cells on the level in this layout represented by
     * their number.
     * @private
     */
    _cellsOnLevel(level) {
        const cells = new Set();
        const center = this._center;

        if (0 === level) {
            cells.add(this._cellToNumber(center));
        } else {
            for (let row = center.row - level; row <= center.row + level; row++) {
                cells.add(this._cellToNumber({row, col: center.col - level}));
                cells.add(this._cellToNumber({row, col: center.col + level}));
            }

            for (let col = center.col - level + 1; col < center.col + level; col++) {
                cells.add(this._cellToNumber({row: center.row - level, col}));
                cells.add(this._cellToNumber({row: center.row + level, col}));
            }
        }

        return cells;
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
        return undefined === alreadyLayoutDice.find(die => cell === this._coordinatesToNumber(die.coordinates));
    }

    /**
     * Convert a number to a cell (row, col)
     *
     * @param {Number} n - The number representing a cell
     * @returns {Object} Return the cell ({row, col}) corresponding n.
     * @private
     */
    _numberToCell(n) {
        return {row: Math.trunc(n / this._cols), col: n % this._cols};
    }

    /**
     * Convert a cell to a number
     *
     * @param {Object} cell - The cell to convert to its number.
     * @return {Number|undefined} The number corresponding to the cell.
     * Returns undefined when the cell is not on the layout
     * @private
     */
    _cellToNumber({row, col}) {
        if (0 <= row && row < this._rows && 0 <= col && col < this._cols) {
            return row * this._cols + col;
        }
        return undefined;
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
        return this._cellToCoords(this._numberToCell(n));
    }

    /**
     * Convert a pair of coordinates to a number.
     *
     * @param {Object} coords - The coordinates to convert
     *
     * @return {Number|undefined} The coordinates converted to a number. If
     * the coordinates are not on this layout, the number is undefined.
     * @private
     */
    _coordinatesToNumber(coords) {
        const n = this._cellToNumber(this._coordsToCell(coords));
        if (0 <= n && n < this.maximumNumberOfDice) {
            return n;
        }
        return undefined;
    }

    _coordinatesInCell({x, y}) {
        const cell = {
            row: Math.trunc(x / this.dieSize),
            col: Math.trunc(y / this.dieSize)
        };

        return cell.row >= 0 && cell.col >= 0 ? cell : null;
    }

    /**
     * Snap (x,y) to the closest cell in this Layout.
     *
     * @param {Object} coordinate - The coordinate to find the closest cell
     * for.
     * @param {Number} coordinate.x - The x-coordinate.
     * @param {Number} coordinate.y - The y-coordinate.
     *
     * @return {Object|null} The coordinate of the cell closest to (x, y).
     * Null when no suitable cell is near (x, y)
     */
    snapTo({x, y, gx, gy}) {

        const snapToCoords = {
            max: -1,
            coords: null
        };

        console.log("snapping with: ", x, gx, y, gy, this.dieSize);

        const tl = {x: x - gx, y: y - gy};
        const tlc = this._coordinatesInCell(tl);


        if (null !== tlc) {
            const tlcc = this._cellToCoords(tlc);
            const tla = (tlcc.x + this.dieSize - tl.x) * (tlcc.y + this.dieSize - tl.y);
            snapToCoords.max = tla;
            snapToCoords.coords = tlcc;

            console.log("topleft: ", tl, tlcc, tla, snapToCoords);
        }

        const tr = {x: tl.x + this.dieSize, y: tl.y};
        const trc = this._coordinatesInCell(tr);
        if (null !== trc) {
            const trcc = this._cellToCoords(trc);
            const tra = (tr.x - trcc.x) * (trcc.y + this.dieSize - tr.y);

            if (tra > snapToCoords.max) {
                snapToCoords.max = tra;
                snapToCoords.coords = trcc;
            }
            console.log("topright: ", tr, trcc, tra, snapToCoords);
        }

        const bl = {x: tl.x, y: tl.y + this.dieSize};
        const blc = this._coordinatesInCell(bl);
        if (null !== blc) {
            const blcc = this._cellToCoords(blc);
            const bla = (blcc.x + this.dieSize - bl.x) * (bl.y - blcc.y);

            if (bla > snapToCoords.max) {
                snapToCoords.max = bla;
                snapToCoords.coords = blcc;
            }
            console.log("bottomleft: ", bl, blcc, bla, snapToCoords);
        }

        const br = {x: tr.x, y: bl.y};
        const brc = this._coordinatesInCell(br);

        if (null !== brc) {

            const brcc = this._cellToCoords(brc);
            const bra = (br.x - brcc.x) * (br.y - brcc.y);

            if (bra > snapToCoords.max) {
                snapToCoords.coords = brcc;
            }
            console.log("bottomright: ", br, brcc, bra, snapToCoords);
        }

        return snapToCoords.coords;
    }

    /**
     * Calculate the grid size given width and height.
     *
     * @param {Number} width - The minimal width
     * @param {Number} height - The minimal height
     *
     * @private
     */
    _calculateGrid(width, height) {
        _cols.set(this, Math.floor(width / this.dieSize));
        _rows.set(this, Math.floor(height / this.dieSize));
    }

    /**
     * Convert a (row, col) cell to (x, y) coordinates.
     *
     * @param {Object} cell - The cell to convert to coordinates
     * @return {Object} The corresponding coordinates.
     * @private
     */
    _cellToCoords({row, col}) {
        return {x: col * this.dieSize, y: row * this.dieSize};
    }

    /**
     * Convert (x, y) coordinates to a (row, col) cell.
     *
     * @param {Object} coordinates - The coordinates to convert to a cell.
     * @return {Object} The corresponding cell
     * @private
     */
    _coordsToCell({x, y}) {
        return {
            row: Math.trunc(x / this.dieSize),
            col: Math.trunc(y / this.dieSize)
        };
    }
};

export {GridLayout};
