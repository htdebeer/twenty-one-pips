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
import {Layout} from "./Layout.js";

/**
 * @module
 */

const _cols = new WeakMap();
const _rows = new WeakMap();
const _layoutDice = new WeakMap();

const calculateDimensions = (size, width, height, max) => {
    let cols = Math.ceil(width/size);
    let rows = Math.ceil(height/size);
    
    if (max > cols*rows) {
        // calculate better fit
    }

    return {cols, rows};
};

const numberToCell = (n, cols) => {
    return {row: n / cols, col: n % cols}
};
const cellToNumber = ({row, col}, cols) => row * cols + col;
const cellToCoords = ({row, col}, size) => {
    return {x: col * size, y: row * size}
};  
const numberToCoords = (n, cols, size) => cellToCoords(numberToCell(n, cols), size);

const determineCenter = (rows, cells) => {
    const row = Math.floor(rows / 2);
    const col = Math.floor(cells / 2);

    return {row, col};
};

const levelCells = (rows, cols, level) => {
    const cells = [];
    const center = determineCenter(rows, cols);
    if (0 === level) {
        cells.push(cellToNumber(center));
    } else {
        for (let row = center.row - level; row <= center.row + level; row++) {
            cells.push(cellToNumber({row, col: center.col - level}, cols));
            cells.push(cellToNumber({row, col: center.col + level}, cols));
        }

        for (let column = center.col - level + 1; column < center.col + level; column++) {
            cells.push(cellToNumber({row: center.row - level, col}, cols));
            cells.push(cellToNumber({row: center.row + level, col}, cols));
        }
    }
    return cells.filter(n => 0 <= n && n <= rows * cols);
};

const computeAvailableCells = (rows, cols, max, alreadyTakenCells) => {
    let availableCells = [];
    let level = 0;
    const maxLevel = Math.min(rows, cols);

    while (availableCells.length < max && level < maxLevel) {
        const cellsOnLevel = levelCells(rows, cols, level);
        const availableCellsOnLevel = cellsOnLevel.filter(c => 0 === alreadyTakenCells.filter(ndie => ndie.n === c).length);
        availableCells = availableCells.concat(availableCellsOnLevel);
        level++;
    }

    return availableCells;
};

/**
 * GridLayout handles laying out the dice on a PlayingTable.
 *
 * @extends module:playing_table/Layout~Layout
 */
const GridLayout = class extends Layout {

    /**
     * Create a new GridLayout.
     *
     * @param {Object} config
     * @param {Number} config.maximumNumberOfDice
     * The maximum number of dice that should fit on this GridLayout.
     * @param {Integer} config.dieSize - The size of a die in pixels. This has to be an
     * Integer.
     * @param {Number} [config.width = 600] - The minimal width of this
     * GridLayout in pixels. Defaults to 600px;
     * @param {Number} [config.height = 400] - The minimal height of
     * this GridLayout in pixels. Defaults to 400px.
     * @param {Boolean} [config.rotate = true] - Should dice be rotated?
     * Defaults to true.
     *
     * @throws module:error/ConfigurationError.ConfigurationError The dieSize
     * has to be an Integer.
     */
    constructor({maximumNumberOfDice, dieSize, width = 600, height = 400, rotate = true}) {
        super({maximumNumberOfDice, dieSize, width, height, rotate});
        const {cols, rows} = calculateDimensions(this.dieSize, width, height, maximumNumberOfDice);
        _cols.set(this, cols);
        _rows.set(this, rows);
        _layoutDice.set(this, []);
    }

    get width() {
        return _cols.get(this) * this.dieSize;
    }

    get height() {
        return _rows.get(this) * this.dieSize;
    }

    get maximumNumberOfDice() {
        return _cols.get(this) * _rows.get(this);
    }

    /**
     * Layout dice on this Layout.
     *
     * @param {module:Die~Die[]} dice - The dice to layout on this Layout.
     * @return {Object[]} A list with dice and their layout coordinates (x, y) and their rotation.
     *
     * throw module:error/ConfigurationError~ConfigurationError The number of
     * dice should not exceed the maximum number of dice this Layout can
     * layout.
     */
    layout(dice, dispersion = 1) {
        if (dice.length > this.maximumNumberOfDice) {
            throw new ConfigurationError(`The number of dice that can be layout is ${this.maximumNumberOfDice}, got ${dice.lenght} dice instead.`);
        }

        const newLayoutDice = _layoutDice.get(this).filter(ndie => ndie.die.isHeld());
        const diceToLayout = dice.filter(die => !die.isHeld())
        const max = Math.min(dice.length * dispersion, this.maximumNumberOfDice);
        const availableCells = computeAvailableCells(_rows.get(this), _cols.get(this), max, newLayoutDice);

        for (const die of diceToLayout) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const randomCell = availableCells[randomIndex];
            availableCells.splice(randomIndex, 1);
            const rotation = this.rotate ? Math.random() * 360 : 0;
            cells.push({n: randomCell, die, rotation});
        }

        _layoutDice.set(this, newLayoutDice);

        return newLayoutDice.map(ndie => {
            const coords = numberToCoords(ndie.n, _cols.get(this), this.dieSize);
            coords.die = ndie.die;
            return coords;
        });
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
