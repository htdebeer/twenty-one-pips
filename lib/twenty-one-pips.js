/** 
 * Copyright (c) 2018, 2019 Huub de Beer
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
 * ConfigurationError
 *
 * @extends Error
 */
const ConfigurationError = class extends Error {

    /**
     * Create a new ConfigurationError with message.
     *
     * @param {String} message - The message associated with this
     * ConfigurationError.
     */
    constructor(message) {
        super(message);
    }
};

/** 
 * Copyright (c) 2018, 2019 Huub de Beer
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
const FULL_CIRCLE_IN_DEGREES = 360;

const randomizeCenter = (n) => {
    return (0.5 <= Math.random() ? Math.floor : Math.ceil).call(0, n);
};

// Private fields
const _width = new WeakMap();
const _height = new WeakMap();
const _cols = new WeakMap();
const _rows = new WeakMap();
const _dice = new WeakMap();
const _dieSize = new WeakMap();
const _dispersion = new WeakMap();
const _rotate = new WeakMap();

/**
 * @typedef {Object} GridLayoutConfiguration
 * @property {Number} config.width - The minimal width of this
 * GridLayout in pixels.;
 * @property {Number} config.height] - The minimal height of
 * this GridLayout in pixels..
 * @property {Number} config.dispersion - The distance from the center of the
 * layout a die can be layout.
 * @property {Number} config.dieSize - The size of a die.
 */

/**
 * GridLayout handles laying out the dice on a DiceBoard.
 */
const GridLayout = class {

    /**
     * Create a new GridLayout.
     *
     * @param {GridLayoutConfiguration} config - The configuration of the GridLayout
     */
    constructor({
        width,
        height,
        dispersion,
        dieSize
    } = {}) {
        _dice.set(this, []);
        _dieSize.set(this, 1);
        _width.set(this, 0);
        _height.set(this, 0);
        _rotate.set(this, true);

        this.dispersion = dispersion;
        this.dieSize = dieSize;
        this.width = width;
        this.height = height;
    }

    /**
     * The width in pixels used by this GridLayout.
     * @throws ConfigurationError Width >= 0
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
     * @throws ConfigurationError Height >= 0
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
     * @throws ConfigurationError Dispersion >= 0
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
     * The size of a die.
     *
     * @throws ConfigurationError DieSize >= 0
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

    get rotate() {
        const r = _rotate.get(this);
        return undefined === r ? true : r;
    }

    set rotate(r) {
        _rotate.set(this, r);
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
        const row = randomizeCenter(this._rows / 2) - 1;
        const col = randomizeCenter(this._cols / 2) - 1;

        return {row, col};
    }

    /**
     * Layout dice on this GridLayout.
     *
     * @param {TopDie[]} dice - The dice to layout on this Layout.
     * @return {TopDie[]} The same list of dice, but now layout.
     *
     * @throws {ConfigurationError} The number of
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
            die.rotation = this.rotate ? Math.round(Math.random() * FULL_CIRCLE_IN_DEGREES) : null;
            alreadyLayoutDice.push(die);
        }

        _dice.set(this, alreadyLayoutDice);

        return alreadyLayoutDice;
    }

    /**
     * Compute a list with available cells to place dice on.
     *
     * @param {Number} max - The number empty cells to compute.
     * @param {TopDie[]} alreadyLayoutDice - A list with dice that have already been layout.
     * 
     * @return {Number[]} The list of available cells represented by their number.
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
     * @param {TopDie[]} alreadyLayoutDice - A list of dice that have already been layout.
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

    /**
     * Snap (x,y) to the closest cell in this Layout.
     *
     * @param {Object} diecoordinate - The coordinate to find the closest cell
     * for.
     * @param {TopDie} [diecoordinat.die = null] - The die to snap to.
     * @param {Number} diecoordinate.x - The x-coordinate.
     * @param {Number} diecoordinate.y - The y-coordinate.
     *
     * @return {Object|null} The coordinate of the cell closest to (x, y).
     * Null when no suitable cell is near (x, y)
     */
    snapTo({die = null, x, y}) {
        const cornerCell = {
            row: Math.trunc(y / this.dieSize),
            col: Math.trunc(x / this.dieSize)
        };

        const corner = this._cellToCoords(cornerCell);
        const widthIn = corner.x + this.dieSize - x;
        const widthOut = this.dieSize - widthIn;
        const heightIn = corner.y + this.dieSize - y;
        const heightOut = this.dieSize - heightIn;

        const quadrants = [{
            q: this._cellToNumber(cornerCell),
            coverage: widthIn * heightIn
        }, {
            q: this._cellToNumber({
                row: cornerCell.row,
                col: cornerCell.col + 1
            }),
            coverage: widthOut * heightIn
        }, {
            q: this._cellToNumber({
                row: cornerCell.row + 1,
                col: cornerCell.col
            }),
            coverage: widthIn * heightOut
        }, {
            q: this._cellToNumber({
                row: cornerCell.row + 1,
                col: cornerCell.col + 1
            }),
            coverage: widthOut * heightOut
        }];

        const snapTo = quadrants
            // cell should be on the layout
            .filter((quadrant) => undefined !== quadrant.q)
            // cell should be not already taken except by itself
            .filter((quadrant) => (
                null !== die && this._coordinatesToNumber(die.coordinates) === quadrant.q)
                || this._cellIsEmpty(quadrant.q, _dice.get(this)))
            // cell should be covered by the die the most
            .reduce(
                (maxQ, quadrant) => quadrant.coverage > maxQ.coverage ? quadrant : maxQ,
                {q: undefined, coverage: -1}
            );

        return undefined !== snapTo.q ? this._numberToCoordinates(snapTo.q) : null;
    }

    /**
     * Get the die at point (x, y);
     *
     * @param {Point} point - The point in (x, y) coordinates
     * @return {TopDie|null} The die under coordinates (x, y) or null if no die
     * is at the point.
     */
    getAt(point = {x: 0, y: 0}) {
        for (const die of _dice.get(this)) {
            const {x, y} = die.coordinates;

            const xFit = x <= point.x && point.x <= x + this.dieSize;
            const yFit = y <= point.y && point.y <= y + this.dieSize;

            if (xFit && yFit) {
                return die;
            }
        }

        return null;
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
            row: Math.trunc(y / this.dieSize),
            col: Math.trunc(x / this.dieSize)
        };
    }
};

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
 * @module mixin/ReadOnlyAttributes
 */

/*
 * Convert an HTML attribute to an instance's property. 
 *
 * @param {String} name - The attribute's name
 * @return {String} The corresponding property's name. For example, "my-attr"
 * will be converted to "myAttr", and "disabled" to "disabled".
 */
const attribute2property = (name) => {
    const [first, ...rest] = name.split("-");
    return first + rest.map(word => word.slice(0, 1).toUpperCase() + word.slice(1)).join();
};

/**
 * Mixin {@link ReadOnlyAttributes} to a class.
 *
 * @param {*} Sup - The class to mix into.
 * @return {ReadOnlyAttributes} The mixed-in class
 */
const ReadOnlyAttributes = (Sup) =>
    /**
     * Mixin to make all attributes on a custom HTMLElement read-only in the sense
     * that when the attribute gets a new value that differs from the value of the
     * corresponding property, it is reset to that property's value. The
     * assumption is that attribute "my-attribute" corresponds with property "this.myAttribute".
     *
     * @param {Class} Sup - The class to mixin this ReadOnlyAttributes.
     * @return {ReadOnlyAttributes} The mixed in class.
     *
     * @mixin
     * @alias ReadOnlyAttributes
     */
    class extends Sup {

        /**
         * Callback that is executed when an observed attribute's value is
         * changed. If the HTMLElement is connected to the DOM, the attribute
         * value can only be set to the corresponding HTMLElement's property.
         * In effect, this makes this HTMLElement's attributes read-only.
         *
         * For example, if an HTMLElement has an attribute "x" and
         * corresponding property "x", then changing the value "x" to "5"
         * will only work when `this.x === 5`.
         *
         * @param {String} name - The attribute's name.
         * @param {String} oldValue - The attribute's old value.
         * @param {String} newValue - The attribute's new value.
         */
        attributeChangedCallback(name, oldValue, newValue) {
            // All attributes are made read-only to prevent cheating by changing
            // the attribute values. Of course, this is by no
            // guarantee that users will not cheat in a different way.
            const property = attribute2property(name);
            if (this.connected && newValue !== `${this[property]}`) {
                this.setAttribute(name, this[property]);
            }
        }
    };

/** 
 * Copyright (c) 2019 Huub de Beer
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
const ValidationError = class extends Error {
    constructor(msg) {
        super(msg);
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const _value = new WeakMap();
const _defaultValue = new WeakMap();
const _errors = new WeakMap();

const TypeValidator = class {
    constructor({value, defaultValue, errors = []}) {
        _value.set(this, value);
        _defaultValue.set(this, defaultValue);
        _errors.set(this, errors);
    }

    get origin() {
        return _value.get(this);
    }

    get value() {
        return this.isValid ? this.origin : _defaultValue.get(this);
    }

    get errors() {
        return _errors.get(this);
    }

    get isValid() {
        return 0 >= this.errors.length;
    }

    defaultTo(newDefault) {
        _defaultValue.set(this, newDefault);
        return this;
    }

    _check({predicate, bindVariables = [], ErrorType = ValidationError}) {
        const proposition = predicate.apply(this, bindVariables);
        if (!proposition) {
            const error = new ErrorType(this.value, bindVariables);
            //console.warn(error.toString());
            this.errors.push(error);
        }

        return this;
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const ParseError = class extends ValidationError {
    constructor(msg) {
        super(msg);
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const InvalidTypeError = class extends ValidationError {
    constructor(msg) {
        super(msg);
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const INTEGER_DEFAULT_VALUE = 0;
const IntegerTypeValidator = class extends TypeValidator {
    constructor(input) {
        let value = INTEGER_DEFAULT_VALUE;
        const defaultValue = INTEGER_DEFAULT_VALUE;
        const errors = [];

        if (Number.isInteger(input)) {
            value = input;
        } else if ("string" === typeof input) {
            const parsedValue = parseInt(input, 10);
            if (Number.isInteger(parsedValue)) {
                value = parsedValue;
            } else {
                errors.push(new ParseError(input));
            }
        } else {
            errors.push(new InvalidTypeError(input));
        }

        super({value, defaultValue, errors});
    }

    largerThan(n) {
        return this._check({
            predicate: (n) => this.origin >= n,
            bindVariables: [n]
        });
    }

    smallerThan(n) {
        return this._check({
            predicate: (n) => this.origin <= n,
            bindVariables: [n]
        });
    }

    between(n, m) {
        return this._check({
            predicate: (n, m) => this.largerThan(n) && this.smallerThan(m),
            bindVariables: [n, m]
        });
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const STRING_DEFAULT_VALUE = "";
const StringTypeValidator = class extends TypeValidator {
    constructor(input) {
        let value = STRING_DEFAULT_VALUE;
        const defaultValue = STRING_DEFAULT_VALUE;
        const errors = [];

        if ("string" === typeof input) {
            value = input;
        } else {
            errors.push(new InvalidTypeError(input));
        }

        super({value, defaultValue, errors});
    }

    notEmpty() {
        return this._check({
            predicate: () => "" !== this.origin
        });
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
//import {ParseError} from "./error/ParseError.js";
const COLOR_DEFAULT_VALUE = "black";
const ColorTypeValidator = class extends TypeValidator {
    constructor(input) {
        let value = COLOR_DEFAULT_VALUE;
        const defaultValue = COLOR_DEFAULT_VALUE;
        const errors = [];

        if ("string" === typeof input) {
            value = input;
        } else {
            errors.push(new InvalidTypeError(input));
        }

        super({value, defaultValue, errors});
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const BOOLEAN_DEFAULT_VALUE = false;
const BooleanTypeValidator = class extends TypeValidator {
    constructor(input) {
        let value = BOOLEAN_DEFAULT_VALUE;
        const defaultValue = BOOLEAN_DEFAULT_VALUE;
        const errors = [];

        if (input instanceof Boolean) {
            value = input;
        } else if ("string" === typeof input) {
            if (/true/i.test(input)) {
                value = true;
            } else if (/false/i.test(input)) {
                value = false;
            } else {
                errors.push(new ParseError(input));
            }
        } else {
            errors.push(new InvalidTypeError(input));
        }

        super({value, defaultValue, errors});
    }

    isTrue() {
        return this._check({
            predicate: () => true === this.origin
        });
    }

    isFalse() {
        return this._check({
            predicate: () => false === this.origin
        });
    }
};

/** 
 * Copyright (c) 2019 Huub de Beer
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
const Validator = class {
    constructor() {
    }

    boolean(input) {
        return new BooleanTypeValidator(input);
    }

    color(input) {
        return new ColorTypeValidator(input);
    }

    integer(input) {
        return new IntegerTypeValidator(input);
    }

    string(input) {
        return new StringTypeValidator(input);
    }

};

const ValidatorSingleton = new Validator();

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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

//import {ConfigurationError} from "./error/ConfigurationError.js";
const TAG_NAME$1 = "top-die";

const CIRCLE_DEGREES = 360; // degrees
const NUMBER_OF_PIPS = 6; // Default / regular six sided die has 6 pips maximum.
const DEFAULT_COLOR = "Ivory";
const DEFAULT_X = 0; // px
const DEFAULT_Y = 0; // px
const DEFAULT_ROTATION = 0; // degrees
const DEFAULT_OPACITY = 0.5;

const COLOR_ATTRIBUTE = "color";
const HELD_BY_ATTRIBUTE = "held-by";
const PIPS_ATTRIBUTE = "pips";
const ROTATION_ATTRIBUTE = "rotation";
const X_ATTRIBUTE = "x";
const Y_ATTRIBUTE = "y";

const BASE_DIE_SIZE = 100; // px
const BASE_ROUNDED_CORNER_RADIUS = 15; // px
const BASE_STROKE_WIDTH = 2.5; // px
const MIN_STROKE_WIDTH = 1; // px
const HALF = BASE_DIE_SIZE / 2; // px
const THIRD = BASE_DIE_SIZE / 3; // px
const PIP_SIZE = BASE_DIE_SIZE / 15; //px
const PIP_COLOR = "black";

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

const isPipNumber = n => {
    const number = parseInt(n, 10);
    return Number.isInteger(number) && 1 <= number && number <= NUMBER_OF_PIPS;
};

/**
 * Generate a random number of pips between 1 and the NUMBER_OF_PIPS.
 *
 * @returns {Number} A random number n, 1 ≤ n ≤ NUMBER_OF_PIPS.
 */
const randomPips = () => Math.floor(Math.random() * NUMBER_OF_PIPS) + 1;

const DIE_UNICODE_CHARACTERS = ["⚀","⚁","⚂","⚃","⚄","⚅"];

/**
 * Convert a number of pips, 1 ≤ pips ≤ 6 to a unicode character
 * representation of the corresponding die face. This function is the reverse
 * of unicodeToPips.
 *
 * @param {Number} p - The number of pips to convert to a unicode character.
 * @returns {String|undefined} The corresponding unicode characters or
 * undefined if p was not between 1 and 6 inclusive.
 */
const pipsToUnicode = p => isPipNumber(p) ? DIE_UNICODE_CHARACTERS[p - 1] : undefined;

const renderHold = (context, x, y, width, color) => {
    const SEPERATOR = width / 30;
    context.save();
    context.globalAlpha = DEFAULT_OPACITY;
    context.beginPath();
    context.fillStyle = color;
    context.arc(x + width, y + width, width - SEPERATOR, 0, 2 * Math.PI, false);
    context.fill();
    context.restore();
};

const renderDie = (context, x, y, width, color) => {
    const SCALE = (width / HALF);
    const HALF_INNER_SIZE = Math.sqrt(width ** 2 / 2);
    const INNER_SIZE = 2 * HALF_INNER_SIZE;
    const ROUNDED_CORNER_RADIUS = BASE_ROUNDED_CORNER_RADIUS * SCALE;
    const INNER_SIZE_ROUNDED = INNER_SIZE - 2 * ROUNDED_CORNER_RADIUS;
    const STROKE_WIDTH = Math.max(MIN_STROKE_WIDTH, BASE_STROKE_WIDTH * SCALE);

    const startX = x + width - HALF_INNER_SIZE + ROUNDED_CORNER_RADIUS;
    const startY = y + width - HALF_INNER_SIZE;

    context.save();
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = "black";
    context.lineWidth = STROKE_WIDTH;
    context.moveTo(startX, startY);
    context.lineTo(startX + INNER_SIZE_ROUNDED, startY);
    context.arc(startX + INNER_SIZE_ROUNDED, startY + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(270), deg2rad(0));
    context.lineTo(startX + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS);
    context.arc(startX + INNER_SIZE_ROUNDED, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(0), deg2rad(90));
    context.lineTo(startX, startY + INNER_SIZE);
    context.arc(startX, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(90), deg2rad(180));
    context.lineTo(startX - ROUNDED_CORNER_RADIUS, startY + ROUNDED_CORNER_RADIUS);
    context.arc(startX, startY + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(180), deg2rad(270));

    context.stroke();
    context.fill();
    context.restore();
};

const renderPip = (context, x, y, width) => {
    context.save();
    context.beginPath();
    context.fillStyle = PIP_COLOR;
    context.moveTo(x, y);
    context.arc(x, y, width, 0, 2 * Math.PI, false);
    context.fill();
    context.restore();
};


// Private properties
const _board = new WeakMap();
const _color = new WeakMap();
const _heldBy = new WeakMap();
const _pips = new WeakMap();
const _rotation = new WeakMap();
const _x = new WeakMap();
const _y = new WeakMap();

/**
 * TopDie is the "top-die" custom [HTML
 * element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) representing a die
 * on the dice board.
 *
 * @extends HTMLElement
 * @mixes ReadOnlyAttributes
 */
const TopDie = class extends ReadOnlyAttributes(HTMLElement) {

    /**
     * Create a new TopDie.
     *
     * @param {Object} [config = {}] - The initial configuration of the die.
     * @param {Number|null} [config.pips] - The pips of the die to add.
     * If no pips are specified or the pips are not between 1 and 6, a random
     * number between 1 and 6 is generated instead.
     * @param {String} [config.color] - The color of the die to add. Default
     * to the default color.
     * @param {Number} [config.x] - The x coordinate of the die.
     * @param {Number} [config.y] - The y coordinate of the die.
     * @param {Number} [config.rotation] - The rotation of the die.
     * @param {TopPlayer} [config.heldBy] - The player holding the die.
     */
    constructor({pips, color, rotation, x, y, heldBy} = {}) {
        super();

        const pipsValue = ValidatorSingleton.integer(pips || this.getAttribute(PIPS_ATTRIBUTE))
            .between(1, 6)
            .defaultTo(randomPips())
            .value;

        _pips.set(this, pipsValue);
        this.setAttribute(PIPS_ATTRIBUTE, pipsValue);

        this.color = ValidatorSingleton.color(color || this.getAttribute(COLOR_ATTRIBUTE))
            .defaultTo(DEFAULT_COLOR)
            .value;

        this.rotation = ValidatorSingleton.integer(rotation || this.getAttribute(ROTATION_ATTRIBUTE))
            .between(0, 360)
            .defaultTo(DEFAULT_ROTATION)
            .value;

        this.x = ValidatorSingleton.integer(x || this.getAttribute(X_ATTRIBUTE))
            .largerThan(0)
            .defaultTo(DEFAULT_X)
            .value;

        this.y = ValidatorSingleton.integer(y || this.getAttribute(Y_ATTRIBUTE))
            .largerThan(0)
            .defaultTo(DEFAULT_Y)
            .value;

        this.heldBy = ValidatorSingleton.string(heldBy || this.getAttribute(HELD_BY_ATTRIBUTE))
            .notEmpty()
            .defaultTo(null)
            .value;
    }

    static get observedAttributes() {
        return [
            COLOR_ATTRIBUTE,
            HELD_BY_ATTRIBUTE,
            PIPS_ATTRIBUTE,
            ROTATION_ATTRIBUTE,
            X_ATTRIBUTE,
            Y_ATTRIBUTE
        ];
    }

    connectedCallback() {
        _board.set(this, this.parentNode);
        _board.get(this).dispatchEvent(new Event("top-die:added"));
    }

    disconnectedCallback() {
        _board.get(this).dispatchEvent(new Event("top-die:removed"));
        _board.set(this, null);
    }

    /**
     * Convert this Die to the corresponding unicode character of a die face.
     *
     * @return {String} The unicode character corresponding to the number of
     * pips of this Die.
     */
    toUnicode() {
        return pipsToUnicode(this.pips);
    }

    /**
     * Create a string represenation for this die.
     *
     * @return {String} The unicode symbol corresponding to the number of pips
     * of this die.
     */
    toString() {
        return this.toUnicode();
    }

    /**
     * This Die's number of pips, 1 ≤ pips ≤ 6.
     *
     * @type {Number}
     */
    get pips() {
        return _pips.get(this);
    }

    /**
     * This Die's color.
     *
     * @type {String}
     */
    get color() {
        return _color.get(this);
    }
    set color(newColor) {
        if (null === newColor) {
            this.removeAttribute(COLOR_ATTRIBUTE);
            _color.set(this, DEFAULT_COLOR);
        } else {
            _color.set(this, newColor);
            this.setAttribute(COLOR_ATTRIBUTE, newColor);
        }
    }


    /**
     * The player that is holding this Die, if any. Null otherwise.
     *
     * @type {TopPlayer|null} 
     */
    get heldBy() {
        return _heldBy.get(this);
    }
    set heldBy(player) {
        _heldBy.set(this, player);
        if (null === player) {
            this.removeAttribute("held-by");
        } else {
            this.setAttribute("held-by", player.toString());
        }
    }

    /**
     * The coordinates of this Die.
     *
     * @type {Coordinates|null}
     */
    get coordinates() {
        return null === this.x || null === this.y ? null : {x: this.x, y: this.y};
    }
    set coordinates(c) {
        if (null === c) {
            this.x = null;
            this.y = null;
        } else{
            const {x, y} = c;
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Does this Die have coordinates?
     *
     * @return {Boolean} True when the Die does have coordinates
     */
    hasCoordinates() {
        return null !== this.coordinates;
    }

    /**
     * The x coordinate
     *
     * @type {Number}
     */
    get x() {
        return _x.get(this);
    }
    set x(newX) {
        _x.set(this, newX);
        this.setAttribute("x", newX);
    }

    /**
     * The y coordinate
     *
     * @type {Number}
     */
    get y() {
        return _y.get(this);
    }
    set y(newY) {
        _y.set(this, newY);
        this.setAttribute("y", newY);
    }

    /**
     * The rotation of this Die. 0 ≤ rotation ≤ 360.
     *
     * @type {Number|null}
     */
    get rotation() {
        return _rotation.get(this);
    }
    set rotation(newR) {
        if (null === newR) {
            this.removeAttribute("rotation");
        } else {
            const normalizedRotation = newR % CIRCLE_DEGREES;
            _rotation.set(this, normalizedRotation);
            this.setAttribute("rotation", normalizedRotation);
        }
    }

    /**
     * Throw this Die. The number of pips to a random number n, 1 ≤ n ≤ 6.
     * Only dice that are not being held can be thrown.
     *
     * @fires "top:throw-die" with parameters this Die.
     */
    throwIt() {
        if (!this.isHeld()) {
            _pips.set(this, randomPips());
            this.setAttribute(PIPS_ATTRIBUTE, this.pips);
            this.dispatchEvent(new Event("top:throw-die", {
                detail: {
                    die: this
                }
            }));
        }
    }

    /**
     * The player holds this Die. A player can only hold a die that is not
     * being held by another player yet.
     *
     * @param {TopPlayer} player - The player who wants to hold this Die.
     * @fires "top:hold-die" with parameters this Die and the player.
     */
    holdIt(player) {
        if (!this.isHeld()) {
            this.heldBy = player;
            this.dispatchEvent(new Event("top:hold-die", {
                detail: {
                    die: this,
                    player
                }
            }));
        }
    }

    /**
     * Is this Die being held by any player?
     *
     * @return {Boolean} True when this Die is being held by any player, false otherwise.
     */
    isHeld() {
        return null !== this.heldBy;
    }

    /**
     * The player releases this Die. A player can only release dice that she is
     * holding.
     *
     * @param {TopPlayer} player - The player who wants to release this Die.
     * @fires "top:relase-die" with parameters this Die and the player releasing it.
     */
    releaseIt(player) {
        if (this.isHeld() && this.heldBy.equals(player)) {
            this.heldBy = null;
            this.removeAttribute(HELD_BY_ATTRIBUTE);
            this.dispatchEvent(new CustomEvent("top:release-die", {
                detail: {
                    die: this,
                    player
                }
            }));
        }
    }

    /**
     * Render this Die.
     *
     * @param {CanvasRenderingContext2D} context - The canvas context to draw
     * on
     * @param {Number} dieSize - The size of a die.
     * @param {Number} [coordinates = this.coordinates] - The coordinates to
     * draw this die. By default, this die is drawn at its own coordinates,
     * but you can also draw it elsewhere if so needed.
     */
    render(context, dieSize, coordinates = this.coordinates) {
        const scale = dieSize / BASE_DIE_SIZE;
        const SHALF = HALF * scale;
        const STHIRD = THIRD * scale;
        const SPIP_SIZE = PIP_SIZE * scale;

        const {x, y} = coordinates;

        if (this.isHeld()) {
            renderHold(context, x, y, SHALF, this.heldBy.color);
        }

        if (0 !== this.rotation) {
            context.translate(x + SHALF, y + SHALF);
            context.rotate(deg2rad(this.rotation));
            context.translate(-1 * (x + SHALF), -1 * (y + SHALF));
        }

        renderDie(context, x, y, SHALF, this.color);

        switch (this.pips) {
        case 1: {
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            break;
        }
        case 2: {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            break;
        }
        case 3: {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            break;
        }
        case 4: {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            break;
        }
        case 5: {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            break;
        }
        case 6: {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + SHALF, SPIP_SIZE);
            break;
        }
        default: // No other values allowed / possible
        }

        // Clear context
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
};

window.customElements.define(TAG_NAME$1, TopDie);

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
const TAG_NAME$2 = "top-player";

// The names of the (observed) attributes of the TopPlayer.
const COLOR_ATTRIBUTE$1 = "color";
const NAME_ATTRIBUTE = "name";
const SCORE_ATTRIBUTE = "score";
const HAS_TURN_ATTRIBUTE = "has-turn";

// The private properties of the TopPlayer 
const _color$1 = new WeakMap();
const _name = new WeakMap();
const _score = new WeakMap();
const _hasTurn = new WeakMap();

/**
 * A Player in a dice game.
 *
 * A player's name should be unique in the game. Two different
 * TopPlayer elements with the same name attribute are treated as
 * the same player.
 *
 * In general it is recommended that no two players do have the same color,
 * although it is not unconceivable that certain dice games have players work
 * in teams where it would make sense for two or more different players to
 * have the same color.
 *
 * The name and color attributes are required. The score and has-turn
 * attributes are not.
 *
 * @extends HTMLElement
 * @mixes ReadOnlyAttributes
 */
const TopPlayer = class extends ReadOnlyAttributes(HTMLElement) {

    /**
     * Create a new TopPlayer, optionally based on an intitial
     * configuration via an object parameter or declared attributes in HTML.
     *
     * @param {Object} [config] - An initial configuration for the
     * player to create.
     * @param {String} config.color - This player's color used in the game.
     * @param {String} config.name - This player's name.
     * @param {Number} [config.score] - This player's score.
     * @param {Boolean} [config.hasTurn] - This player has a turn.
     */
    constructor({color, name, score, hasTurn} = {}) {
        super();

        const colorValue = ValidatorSingleton.color(color || this.getAttribute(COLOR_ATTRIBUTE$1));
        if (colorValue.isValid) {
            _color$1.set(this, colorValue.value);
            this.setAttribute(COLOR_ATTRIBUTE$1, this.color);
        } else {
            throw new ConfigurationError("A Player needs a color, which is a String.");
        }

        const nameValue = ValidatorSingleton.string(name || this.getAttribute(NAME_ATTRIBUTE));
        if (nameValue.isValid) {
            _name.set(this, name);
            this.setAttribute(NAME_ATTRIBUTE, this.name);
        } else {
            throw new ConfigurationError("A Player needs a name, which is a String.");
        }

        const scoreValue = ValidatorSingleton.integer(score || this.getAttribute(SCORE_ATTRIBUTE));
        if (scoreValue.isValid) {
            _score.set(this, score);
            this.setAttribute(SCORE_ATTRIBUTE, this.score);
        } else {
            // Okay. A player does not need to have a score.
            _score.set(this, null);
            this.removeAttribute(SCORE_ATTRIBUTE);
        }

        const hasTurnValue = ValidatorSingleton.boolean(hasTurn || this.getAttribute(HAS_TURN_ATTRIBUTE))
            .isTrue();
        if (hasTurnValue.isValid) {
            _hasTurn.set(this, hasTurn);
            this.setAttribute(HAS_TURN_ATTRIBUTE, hasTurn);
        } else {
            // Okay, A player does not always have a turn.
            _hasTurn.set(this, null);
            this.removeAttribute(HAS_TURN_ATTRIBUTE);
        }
    }

    static get observedAttributes() {
        return [
            COLOR_ATTRIBUTE$1,
            NAME_ATTRIBUTE,
            SCORE_ATTRIBUTE,
            HAS_TURN_ATTRIBUTE
        ];
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    /**
     * This player's color.
     *
     * @type {String}
     */
    get color() {
        return _color$1.get(this);
    }

    /**
     * This player's name.
     *
     * @type {String}
     */
    get name() {
        return _name.get(this);
    }

    /**
     * This player's score.
     *
     * @type {Number}
     */
    get score() {
        return null === _score.get(this) ? 0 : _score.get(this);
    }
    set score(newScore) {
        _score.set(this, newScore);
        if (null === newScore) {
            this.removeAttribute(SCORE_ATTRIBUTE);
        } else {
            this.setAttribute(SCORE_ATTRIBUTE, newScore);
        }
    }

    /**
     * Start a turn for this player.
     *
     * @return {TopPlayer} The player with a turn
     */
    startTurn() {
        if (this.isConnected) {
            this.parentNode.dispatchEvent(new CustomEvent("top:start-turn", {
                detail: {
                    player: this
                }
            }));
        }
        _hasTurn.set(this, true);
        this.setAttribute(HAS_TURN_ATTRIBUTE, true);
        return this;
    }

    /**
     * End a turn for this player.
     */
    endTurn() {
        _hasTurn.set(this, null);
        this.removeAttribute(HAS_TURN_ATTRIBUTE);
    }

    /**
     * Does this player have a turn?
     *
     * @type {Boolean}
     */
    get hasTurn() {
        return true === _hasTurn.get(this);
    }

    /**
     * A String representation of this player, his or hers name.
     *
     * @return {String} The player's name represents the player as a string.
     */
    toString() {
        return `${this.name}`;
    }

    /**
     * Is this player equal another player?
     * 
     * @param {TopPlayer} other - The other player to compare this player with.
     * @return {Boolean} True when either the object references are the same
     * or when both name and color are the same.
     */
    equals(other) {
        const name = "string" === typeof other ? other : other.name;
        return other === this || name === this.name;
    }
};

window.customElements.define(TAG_NAME$2, TopPlayer);

/**
 * The default system player. Dice are thrown by a player. For situations
 * where you want to render a bunch of dice without needing the concept of Players
 * this DEFAULT_SYSTEM_PLAYER can be a substitute. Of course, if you'd like to
 * change the name and/or the color, create and use your own "system player".
 * @const
 */
const DEFAULT_SYSTEM_PLAYER = new TopPlayer({color: "red", name: "*"});

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
const TAG_NAME$3 = "top-player-list";

/**
 * TopPlayerList to describe the players in the game.
 *
 * @extends HTMLElement
 */
const TopPlayerList = class extends HTMLElement {

    /**
     * Create a new TopPlayerList.
     */
    constructor() {
        super();
    }

    connectedCallback() {
        if (0 >= this.players.length) {
            this.appendChild(DEFAULT_SYSTEM_PLAYER);
        }

        this.addEventListener("top:start-turn", (event) => {
            // Only one player can have a turn at any given time.
            this.players
                .filter(p => !p.equals(event.detail.player))
                .forEach(p => p.endTurn());
        });
    }

    disconnectedCallback() {
    }

    /**
     * The players in this list.
     *
     * @type {TopPlayer[]}
     */
    get players() {
        return [...this.getElementsByTagName(TAG_NAME$2)];
    }
};

window.customElements.define(TAG_NAME$3, TopPlayerList);

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
//import {ConfigurationError} from "./error/ConfigurationError.js";
const TAG_NAME$$1 = "top-dice-board";

const DEFAULT_DIE_SIZE = 100; // px
const DEFAULT_HOLD_DURATION = 375; // ms
const DEFAULT_DRAGGING_DICE_DISABLED = false;
const DEFAULT_HOLDING_DICE_DISABLED = false;
const DEFAULT_ROTATING_DICE_DISABLED = false;

const ROWS = 10;
const COLS = 10;

const DEFAULT_WIDTH = COLS * DEFAULT_DIE_SIZE; // px
const DEFAULT_HEIGHT = ROWS * DEFAULT_DIE_SIZE; // px
const DEFAULT_DISPERSION = Math.floor(ROWS / 2);

const MIN_DELTA = 3; //px

const WIDTH_ATTRIBUTE = "width";
const HEIGHT_ATTRIBUTE = "height";
const DISPERSION_ATTRIBUTE = "dispersion";
const DIE_SIZE_ATTRIBUTE = "die-size";
const DRAGGING_DICE_DISABLED_ATTRIBUTE = "dragging-dice-disabled";
const HOLDING_DICE_DISABLED_ATTRIBUTE = "holding-dice-disabled";
const ROTATING_DICE_DISABLED_ATTRIBUTE = "rotating-dice-disabled";
const HOLD_DURATION_ATTRIBUTE = "hold-duration";

const parseNumber = (numberString, defaultNumber = 0) => {
    const number = parseInt(numberString, 10);
    return Number.isNaN(number) ? defaultNumber : number;
};

const getPositiveNumber = (numberString, defaultValue) => {
    return ValidatorSingleton.integer(numberString)
        .largerThan(0)
        .defaultTo(defaultValue)
        .value;
};

const getPositiveNumberAttribute = (element, name, defaultValue) => {
    if (element.hasAttribute(name)) {
        const valueString = element.getAttribute(name);
        return getPositiveNumber(valueString, defaultValue);
    }
    return defaultValue;
};

const getBoolean = (booleanString, trueValue, defaultValue) => {
    if (trueValue === booleanString || "true" === booleanString) {
        return true;
    } else if ("false" === booleanString) {
        return false;
    } else {
        return defaultValue;
    }
};

const getBooleanAttribute = (element, name, defaultValue) => {
    if (element.hasAttribute(name)) {
        const valueString = element.getAttribute(name);
        return getBoolean(valueString, [valueString, "true"], ["false"], defaultValue);
    }

    return defaultValue;
};

// Private properties
const _canvas = new WeakMap();
const _layout = new WeakMap();
const _currentPlayer = new WeakMap();
const _numberOfReadyDice = new WeakMap();

const context = (board) => _canvas.get(board).getContext("2d");

const getReadyDice = (board) => {
    if (undefined === _numberOfReadyDice.get(board)) {
        _numberOfReadyDice.set(board, 0);
    }

    return _numberOfReadyDice.get(board);
};

const updateReadyDice = (board, update) => {
    _numberOfReadyDice.set(board, getReadyDice(board) + update);
};

const isReady = (board) => getReadyDice(board) === board.dice.length;

const updateBoard = (board, dice = board.dice) => {
    if (isReady(board)) {
        context(board).clearRect(0, 0, board.width, board.height);

        for (const die of dice) {
            die.render(context(board), board.dieSize);
        }
    }
};


// Interaction states
const NONE = Symbol("no_interaction");
const HOLD = Symbol("hold");
const MOVE = Symbol("move");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction
const convertWindowCoordinatesToCanvas = (canvas, xWindow, yWindow) => {
    const canvasBox = canvas.getBoundingClientRect();

    const x = xWindow - canvasBox.left * (canvas.width / canvasBox.width);
    const y = yWindow - canvasBox.top * (canvas.height / canvasBox.height);

    return {x, y};
};

const setupInteraction = (board) => {
    const canvas = _canvas.get(board);

    // Setup interaction
    let origin = {};
    let state = NONE;
    let staticBoard = null;
    let dieUnderCursor = null;
    let holdTimeout = null;

    const holdDie = () => {
        if (HOLD === state || INDETERMINED === state) {
            // toggle hold / release
            const playerWithATurn = board.querySelector(`${TAG_NAME$3} ${TAG_NAME$2}[${HAS_TURN_ATTRIBUTE}]`);
            if (dieUnderCursor.isHeld()) {
                dieUnderCursor.releaseIt(playerWithATurn);
            } else {
                dieUnderCursor.holdIt(playerWithATurn);
            }
            state = NONE;

            updateBoard(board);
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

            dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));

            if (null !== dieUnderCursor) {
                // Only interaction with the board via a die
                if (!board.disabledHoldingDice && !board.disabledDraggingDice) {
                    state = INDETERMINED;
                    startHolding();
                } else if (!board.disabledHoldingDice) {
                    state = HOLD;
                    startHolding();
                } else if (!board.disabledDraggingDice) {
                    state = MOVE;
                }
            }

        }
    };

    const showInteraction = (event) => {
        const dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));
        if (DRAGGING === state) {
            canvas.style.cursor = "grabbing";
        } else if (null !== dieUnderCursor) {
            canvas.style.cursor = "grab";
        } else {
            canvas.style.cursor = "default";
        }
    };

    const move = (event) => {
        if (MOVE === state || INDETERMINED === state) {
            // determine if a die is under the cursor
            // Ignore small movements
            const dx = Math.abs(origin.x - event.clientX);
            const dy = Math.abs(origin.y - event.clientY);

            if (MIN_DELTA < dx || MIN_DELTA < dy) {
                state = DRAGGING;
                stopHolding();

                const diceWithoutDieUnderCursor = board.dice.filter(die => die !== dieUnderCursor);
                updateBoard(board, diceWithoutDieUnderCursor);
                staticBoard = context(board).getImageData(0, 0, canvas.width, canvas.height);
            }
        } else if (DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = dieUnderCursor.coordinates;

            context(board).putImageData(staticBoard, 0, 0);
            dieUnderCursor.render(context(board), board.dieSize, {x: x - dx, y: y - dy});
        }
    };

    const stopInteraction = (event) => {
        if (null !== dieUnderCursor && DRAGGING === state) {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = dieUnderCursor.coordinates;

            const snapToCoords = board.layout.snapTo({
                die: dieUnderCursor,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            dieUnderCursor.coordinates = newCoords;
        }

        // Clear state
        dieUnderCursor = null;
        state = NONE;

        // Refresh board; Render dice
        updateBoard(board);
    };


    // Register the actual event listeners defined above. Map touch events to
    // equivalent mouse events. Because the "touchend" event does not have a
    // clientX and clientY, record and use the last ones from the "touchmove"
    // (or "touchstart") events.

    let touchCoordinates = {clientX: 0, clientY: 0};
    const touch2mouseEvent = (mouseEventName) => {
        return (touchEvent) => {
            if (touchEvent && 0 < touchEvent.touches.length) {
                const {clientX, clientY} = touchEvent.touches[0];
                touchCoordinates = {clientX, clientY};
            }
            canvas.dispatchEvent(new MouseEvent(mouseEventName, touchCoordinates));
        };
    };

    canvas.addEventListener("touchstart", touch2mouseEvent("mousedown"));
    canvas.addEventListener("mousedown", startInteraction);

    if (!board.disabledDraggingDice) {
        canvas.addEventListener("touchmove", touch2mouseEvent("mousemove"));
        canvas.addEventListener("mousemove", move);
    }

    if (!board.disabledDraggingDice || !board.disabledHoldingDice) {
        canvas.addEventListener("mousemove", showInteraction);
    }

    canvas.addEventListener("touchend", touch2mouseEvent("mouseup"));
    canvas.addEventListener("mouseup", stopInteraction);
    canvas.addEventListener("mouseout", stopInteraction);
};

/**
 * TopDiceBoard is a custom HTML element to render and control a
 * dice board. 
 *
 * @extends HTMLElement
 */
const TopDiceBoard = class extends HTMLElement {

    /**
     * Create a new TopDiceBoard.
     */
    constructor() {
        super();
        this.style.display = "inline-block";
        const shadow = this.attachShadow({mode: "closed"});
        const canvas = document.createElement("canvas");
        shadow.appendChild(canvas);

        _canvas.set(this, canvas);
        _currentPlayer.set(this, DEFAULT_SYSTEM_PLAYER);
        _layout.set(this, new GridLayout({
            width: this.width,
            height: this.height,
            dieSize: this.dieSize,
            dispersion: this.dispersion
        }));
        setupInteraction(this);
    }

    static get observedAttributes() {
        return [
            WIDTH_ATTRIBUTE,
            HEIGHT_ATTRIBUTE,
            DISPERSION_ATTRIBUTE,
            DIE_SIZE_ATTRIBUTE,
            DRAGGING_DICE_DISABLED_ATTRIBUTE,
            ROTATING_DICE_DISABLED_ATTRIBUTE,
            HOLDING_DICE_DISABLED_ATTRIBUTE,
            HOLD_DURATION_ATTRIBUTE
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const canvas = _canvas.get(this);
        switch (name) {
        case WIDTH_ATTRIBUTE: {
            const width = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_WIDTH);
            this.layout.width = width;
            canvas.setAttribute(WIDTH_ATTRIBUTE, width);
            break;
        }
        case HEIGHT_ATTRIBUTE: {
            const height = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_HEIGHT);
            this.layout.height = height;
            canvas.setAttribute(HEIGHT_ATTRIBUTE, height);
            break;
        }
        case DISPERSION_ATTRIBUTE: {
            const dispersion = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_DISPERSION);
            this.layout.dispersion = dispersion;
            break;
        }
        case DIE_SIZE_ATTRIBUTE: {
            const dieSize = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_DIE_SIZE);
            this.layout.dieSize = dieSize;
            break;
        }
        case ROTATING_DICE_DISABLED_ATTRIBUTE: {
            const disabledRotation = ValidatorSingleton.boolean(newValue, getBoolean(oldValue, ROTATING_DICE_DISABLED_ATTRIBUTE, DEFAULT_ROTATING_DICE_DISABLED)).value;
            this.layout.rotate = !disabledRotation;
            break;
        }
        default: 
        }

        updateBoard(this);
    }

    connectedCallback() {
        this.addEventListener("top-die:added", () => {
            updateReadyDice(this, 1);
            if (isReady(this)) {
                updateBoard(this, this.layout.layout(this.dice));
            }
        });

        this.addEventListener("top-die:removed", () => {
            updateBoard(this, this.layout.layout(this.dice));
            updateReadyDice(this, -1);
        });
    }

    disconnectedCallback() {
    }

    adoptedCallback() {
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
     * {@link throwDice}. 
     *
     * @type {TopDie[]}
     */
    get dice() {
        return [...this.getElementsByTagName(TAG_NAME$1)];
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
        return getPositiveNumberAttribute(this, WIDTH_ATTRIBUTE, DEFAULT_WIDTH);
    }

    /**
     * The height of this board.
     * @type {Number}
     */
    get height() {
        return getPositiveNumberAttribute(this, HEIGHT_ATTRIBUTE, DEFAULT_HEIGHT);
    }

    /**
     * The dispersion level of this board.
     * @type {Number}
     */
    get dispersion() {
        return getPositiveNumberAttribute(this, DISPERSION_ATTRIBUTE, DEFAULT_DISPERSION);
    }

    /**
     * The size of dice on this board.
     *
     * @type {Number}
     */
    get dieSize() {
        return getPositiveNumberAttribute(this, DIE_SIZE_ATTRIBUTE, DEFAULT_DIE_SIZE);
    }

    /**
     * Can dice on this board be dragged?
     * @type {Boolean}
     */
    get disabledDraggingDice() {
        return getBooleanAttribute(this, DRAGGING_DICE_DISABLED_ATTRIBUTE, DEFAULT_DRAGGING_DICE_DISABLED);
    }

    /**
     * Can dice on this board be held by a Player?
     * @type {Boolean}
     */
    get disabledHoldingDice() {
        return getBooleanAttribute(this, HOLDING_DICE_DISABLED_ATTRIBUTE, DEFAULT_HOLDING_DICE_DISABLED);
    }

    /**
     * Is rotating dice on this board disabled?
     * @type {Boolean}
     */
    get disabledRotatingDice() {
        return getBooleanAttribute(this, ROTATING_DICE_DISABLED_ATTRIBUTE, DEFAULT_ROTATING_DICE_DISABLED);
    }

    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */
    get holdDuration() {
        return getPositiveNumberAttribute(this, HOLD_DURATION_ATTRIBUTE, DEFAULT_HOLD_DURATION);
    }

    /**
     * The TopPlayerList element of this TopDiceBoard. If it does not exist,
     * it will be created.
     *
     * @type {TopPlayerList}
     * @private
     */
    get _playerList() {
        let playerList = this.querySelector(TAG_NAME$3);
        if (null === playerList) {
            playerList = this.appendChild(TAG_NAME$3);
        }

        return playerList;
    }

    /**
     * The players playing on this board.
     *
     * @type {TopPlayer[]}
     */
    get players() {
        return this._playerList.players;
    }

    /**
     * As player, throw the dice on this board.
     *
     * @param {TopPlayer} [player = DEFAULT_SYSTEM_PLAYER] - The
     * player that is throwing the dice on this board.
     *
     * @return {TopDie[]} The thrown dice on this board. This list of dice is the same as this TopDiceBoard's {@see dice} property
     */
    throwDice(player = DEFAULT_SYSTEM_PLAYER) {
        if (player && !player.hasTurn) {
            player.startTurn();
        }
        this.dice.forEach(die => die.throwIt());
        updateBoard(this, this.layout.layout(this.dice));
        return this.dice;
    }

    /**
     * Add a die to this TopDiceBoard.
     *
     * @param {TopDie|Object} [config = {}] - The die or a configuration of
     * the die to add to this TopDiceBoard.
     * @param {Number|null} [config.pips] - The pips of the die to add.
     * If no pips are specified or the pips are not between 1 and 6, a random
     * number between 1 and 6 is generated instead.
     * @param {String} [config.color] - The color of the die to add. Default
     * to the default color.
     * @param {Number} [config.x] - The x coordinate of the die.
     * @param {Number} [config.y] - The y coordinate of the die.
     * @param {Number} [config.rotation] - The rotation of the die.
     * @param {TopPlayer} [config.heldBy] - The player holding the die.
     *
     * @return {TopDie} The added die.
     */
    addDie(config = {}) {
        return this.appendChild(config instanceof TopDie ? config : new TopDie(config));
    }

    /**
     * Remove die from this TopDiceBoard.
     *
     * @param {TopDie} die - The die to remove from this board.
     */
    removeDie(die) {
        if (die.parentNode && die.parentNode === this) {
            this.removeChild(die);
        }
    }

    /**
     * Add a player to this TopDiceBoard.
     *
     * @param {TopPlayer|Object} config - The player or a configuration of a
     * player to add to this TopDiceBoard.
     * @param {String} config.color - This player's color used in the game.
     * @param {String} config.name - This player's name.
     * @param {Number} [config.score] - This player's score.
     * @param {Boolean} [config.hasTurn] - This player has a turn.
     *
     * @throws Error when the player to add conflicts with a pre-existing
     * player.
     *
     * @return {TopPlayer} The added player.
     */
    addPlayer(config = {}) {
        return this._playerList.appendChild(config instanceof TopPlayer ? config : new TopPlayer(config));
    }

    /**
     * Remove player from this TopDiceBoard.
     *
     * @param {TopPlayer} player - The player to remove from this board.
     */
    removePlayer(player) {
        if (player.parentNode && player.parentNode === this._playerList) {
            this._playerList.removeChild(player);
        }
    }

};

window.customElements.define(TAG_NAME$$1, TopDiceBoard);

/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
 */
window.twentyonepips = window.twentyonepips || Object.freeze({
    VERSION: "0.0.1",
    LICENSE: "LGPL-3.0",
    WEBSITE: "https://twentyonepips.org",
    TopDiceBoard: TopDiceBoard,
    TopDie: TopDie,
    TopPlayer: TopPlayer,
    TopPlayerList: TopPlayerList
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcERpZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJUb3BEaWNlQm9hcmQuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgRlVMTF9DSVJDTEVfSU5fREVHUkVFUyA9IDM2MDtcblxuY29uc3QgcmFuZG9taXplQ2VudGVyID0gKG4pID0+IHtcbiAgICByZXR1cm4gKDAuNSA8PSBNYXRoLnJhbmRvbSgpID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbCkuY2FsbCgwLCBuKTtcbn07XG5cbi8vIFByaXZhdGUgZmllbGRzXG5jb25zdCBfd2lkdGggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlaWdodCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29scyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm93cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGljZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGllU2l6ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGlzcGVyc2lvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRlID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmlkTGF5b3V0Q29uZmlndXJhdGlvblxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy53aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoIG9mIHRoaXNcbiAqIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLjtcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuaGVpZ2h0XSAtIFRoZSBtaW5pbWFsIGhlaWdodCBvZlxuICogdGhpcyBHcmlkTGF5b3V0IGluIHBpeGVscy4uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpc3BlcnNpb24gLSBUaGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIG9mIHRoZVxuICogbGF5b3V0IGEgZGllIGNhbiBiZSBsYXlvdXQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAqL1xuXG4vKipcbiAqIEdyaWRMYXlvdXQgaGFuZGxlcyBsYXlpbmcgb3V0IHRoZSBkaWNlIG9uIGEgRGljZUJvYXJkLlxuICovXG5jb25zdCBHcmlkTGF5b3V0ID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0dyaWRMYXlvdXRDb25maWd1cmF0aW9ufSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgR3JpZExheW91dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgZGlzcGVyc2lvbixcbiAgICAgICAgZGllU2l6ZVxuICAgIH0gPSB7fSkge1xuICAgICAgICBfZGljZS5zZXQodGhpcywgW10pO1xuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgMSk7XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIDApO1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICB0aGlzLmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICogQHRocm93cyBDb25maWd1cmF0aW9uRXJyb3IgV2lkdGggPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9IFxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIF93aWR0aC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IHdpZHRoKHcpIHtcbiAgICAgICAgaWYgKDAgPiB3KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBXaWR0aCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke3d9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgdyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBcbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBIZWlnaHQgPj0gMFxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gX2hlaWdodC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGhlaWdodChoKSB7XG4gICAgICAgIGlmICgwID4gaCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgSGVpZ2h0IHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7aH0nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2hlaWdodC5zZXQodGhpcywgaCk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIGxheW91dCBvbiB0aGlzIEdyaWRMYXlvdXQuIFRoaXNcbiAgICAgKiBudW1iZXIgaXMgPj0gMC4gUmVhZCBvbmx5LlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbHMgKiB0aGlzLl9yb3dzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBUaGUgZGlzcGVyc2lvbiBsZXZlbFxuICAgICAqIGluZGljYXRlcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIGRpY2UgY2FuIGJlIGxheW91dC4gVXNlIDEgZm9yIGFcbiAgICAgKiB0aWdodCBwYWNrZWQgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyBDb25maWd1cmF0aW9uRXJyb3IgRGlzcGVyc2lvbiA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGlzcGVyc2lvbihkKSB7XG4gICAgICAgIGlmICgwID4gZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgRGlzcGVyc2lvbiBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2R9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5zZXQodGhpcywgZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBEaWVTaXplID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gX2RpZVNpemUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaWVTaXplKGRzKSB7XG4gICAgICAgIGlmICgwID49IGRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBkaWVTaXplIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAxLCBnb3QgJyR7ZHN9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCBkcyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdldCByb3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBfcm90YXRlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gciA/IHRydWUgOiByO1xuICAgIH1cblxuICAgIHNldCByb3RhdGUocikge1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIHJvd3MsIDAgPCByb3dzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9yb3dzKCkge1xuICAgICAgICByZXR1cm4gX3Jvd3MuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2YgY29sdW1ucywgMCA8IGNvbHVtbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NvbHMoKSB7XG4gICAgICAgIHJldHVybiBfY29scy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNlbnRlciBjZWxsIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNlbnRlciAocm93LCBjb2wpLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9yb3dzIC8gMikgLSAxO1xuICAgICAgICBjb25zdCBjb2wgPSByYW5kb21pemVDZW50ZXIodGhpcy5fY29scyAvIDIpIC0gMTtcblxuICAgICAgICByZXR1cm4ge3JvdywgY29sfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXlvdXQgZGljZSBvbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZVtdfSBkaWNlIC0gVGhlIGRpY2UgdG8gbGF5b3V0IG9uIHRoaXMgTGF5b3V0LlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7Q29uZmlndXJhdGlvbkVycm9yfSBUaGUgbnVtYmVyIG9mXG4gICAgICogZGljZSBzaG91bGQgbm90IGV4Y2VlZCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGlzIExheW91dCBjYW5cbiAgICAgKiBsYXlvdXQuXG4gICAgICovXG4gICAgbGF5b3V0KGRpY2UpIHtcbiAgICAgICAgaWYgKGRpY2UubGVuZ3RoID4gdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBUaGUgbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IGlzICR7dGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlfSwgZ290ICR7ZGljZS5sZW5naHR9IGRpY2UgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlMYXlvdXREaWNlID0gW107XG4gICAgICAgIGNvbnN0IGRpY2VUb0xheW91dCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGlmIChkaWUuaGFzQ29vcmRpbmF0ZXMoKSAmJiBkaWUuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEaWNlIHRoYXQgYXJlIGJlaW5nIGhlbGQgYW5kIGhhdmUgYmVlbiBsYXlvdXQgYmVmb3JlIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIGtlZXAgdGhlaXIgY3VycmVudCBjb29yZGluYXRlcyBhbmQgcm90YXRpb24uIEluIG90aGVyIHdvcmRzLFxuICAgICAgICAgICAgICAgIC8vIHRoZXNlIGRpY2UgYXJlIHNraXBwZWQuXG4gICAgICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWNlVG9MYXlvdXQucHVzaChkaWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5taW4oZGljZS5sZW5ndGggKiB0aGlzLmRpc3BlcnNpb24sIHRoaXMubWF4aW11bU51bWJlck9mRGljZSk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzID0gdGhpcy5fY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2VUb0xheW91dCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhdmFpbGFibGVDZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tQ2VsbCA9IGF2YWlsYWJsZUNlbGxzW3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUNlbGxzLnNwbGljZShyYW5kb21JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGRpZS5jb29yZGluYXRlcyA9IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMocmFuZG9tQ2VsbCk7XG4gICAgICAgICAgICBkaWUucm90YXRpb24gPSB0aGlzLnJvdGF0ZSA/IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMpIDogbnVsbDtcbiAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgcmV0dXJuIGFscmVhZHlMYXlvdXREaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYSBsaXN0IHdpdGggYXZhaWxhYmxlIGNlbGxzIHRvIHBsYWNlIGRpY2Ugb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4IC0gVGhlIG51bWJlciBlbXB0eSBjZWxscyB0byBjb21wdXRlLlxuICAgICAqIEBwYXJhbSB7VG9wRGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IHdpdGggZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGNlbGxzIHJlcHJlc2VudGVkIGJ5IHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBsZXZlbCA9IDA7XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gTWF0aC5taW4odGhpcy5fcm93cywgdGhpcy5fY29scyk7XG5cbiAgICAgICAgd2hpbGUgKGF2YWlsYWJsZS5zaXplIDwgbWF4ICYmIGxldmVsIDwgbWF4TGV2ZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsc09uTGV2ZWwobGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCAhPT0gY2VsbCAmJiB0aGlzLl9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlLmFkZChjZWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldmVsKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhdmFpbGFibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSBhbGwgY2VsbHMgb24gbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSBUaGUgbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuIDBcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGNlbnRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NldDxOdW1iZXI+fSB0aGUgY2VsbHMgb24gdGhlIGxldmVsIGluIHRoaXMgbGF5b3V0IHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxzT25MZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zdCBjZWxscyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5fY2VudGVyO1xuXG4gICAgICAgIGlmICgwID09PSBsZXZlbCkge1xuICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcihjZW50ZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IGNlbnRlci5yb3cgLSBsZXZlbDsgcm93IDw9IGNlbnRlci5yb3cgKyBsZXZlbDsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCAtIGxldmVsfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sICsgbGV2ZWx9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IGNlbnRlci5jb2wgLSBsZXZlbCArIDE7IGNvbCA8IGNlbnRlci5jb2wgKyBsZXZlbDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgLSBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyArIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyBjZWxsIGNvbnRhaW4gYSBjZWxsIGZyb20gYWxyZWFkeUxheW91dERpY2U/XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY2VsbCAtIEEgY2VsbCBpbiBsYXlvdXQgcmVwcmVzZW50ZWQgYnkgYSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtUb3BEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgb2YgZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgY2VsbCBkb2VzIG5vdCBjb250YWluIGEgZGllLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IGFscmVhZHlMYXlvdXREaWNlLmZpbmQoZGllID0+IGNlbGwgPT09IHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIG51bWJlciB0byBhIGNlbGwgKHJvdywgY29sKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm4gdGhlIGNlbGwgKHtyb3csIGNvbH0pIGNvcnJlc3BvbmRpbmcgbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0NlbGwobikge1xuICAgICAgICByZXR1cm4ge3JvdzogTWF0aC50cnVuYyhuIC8gdGhpcy5fY29scyksIGNvbDogbiAlIHRoaXMuX2NvbHN9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHRvIGEgbnVtYmVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gaXRzIG51bWJlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwuXG4gICAgICogUmV0dXJucyB1bmRlZmluZWQgd2hlbiB0aGUgY2VsbCBpcyBub3Qgb24gdGhlIGxheW91dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb051bWJlcih7cm93LCBjb2x9KSB7XG4gICAgICAgIGlmICgwIDw9IHJvdyAmJiByb3cgPCB0aGlzLl9yb3dzICYmIDAgPD0gY29sICYmIGNvbCA8IHRoaXMuX2NvbHMpIHtcbiAgICAgICAgICAgIHJldHVybiByb3cgKiB0aGlzLl9jb2xzICsgY29sO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgcmVwcmVzZW50ZWQgYnkgaXRzIG51bWJlciB0byB0aGVpciBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb29yZGluYXRlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsIHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhpcyBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9Db29yZGluYXRlcyhuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jZWxsVG9Db29yZHModGhpcy5fbnVtYmVyVG9DZWxsKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgcGFpciBvZiBjb29yZGluYXRlcyB0byBhIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydFxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvb3JkaW5hdGVzIGNvbnZlcnRlZCB0byBhIG51bWJlci4gSWZcbiAgICAgKiB0aGUgY29vcmRpbmF0ZXMgYXJlIG5vdCBvbiB0aGlzIGxheW91dCwgdGhlIG51bWJlciBpcyB1bmRlZmluZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRpbmF0ZXNUb051bWJlcihjb29yZHMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuX2NlbGxUb051bWJlcih0aGlzLl9jb29yZHNUb0NlbGwoY29vcmRzKSk7XG4gICAgICAgIGlmICgwIDw9IG4gJiYgbiA8IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbmFwICh4LHkpIHRvIHRoZSBjbG9zZXN0IGNlbGwgaW4gdGhpcyBMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGllY29vcmRpbmF0ZSAtIFRoZSBjb29yZGluYXRlIHRvIGZpbmQgdGhlIGNsb3Nlc3QgY2VsbFxuICAgICAqIGZvci5cbiAgICAgKiBAcGFyYW0ge1RvcERpZX0gW2RpZWNvb3JkaW5hdC5kaWUgPSBudWxsXSAtIFRoZSBkaWUgdG8gc25hcCB0by5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS54IC0gVGhlIHgtY29vcmRpbmF0ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS55IC0gVGhlIHktY29vcmRpbmF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudWxsfSBUaGUgY29vcmRpbmF0ZSBvZiB0aGUgY2VsbCBjbG9zZXN0IHRvICh4LCB5KS5cbiAgICAgKiBOdWxsIHdoZW4gbm8gc3VpdGFibGUgY2VsbCBpcyBuZWFyICh4LCB5KVxuICAgICAqL1xuICAgIHNuYXBUbyh7ZGllID0gbnVsbCwgeCwgeX0pIHtcbiAgICAgICAgY29uc3QgY29ybmVyQ2VsbCA9IHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvcm5lciA9IHRoaXMuX2NlbGxUb0Nvb3Jkcyhjb3JuZXJDZWxsKTtcbiAgICAgICAgY29uc3Qgd2lkdGhJbiA9IGNvcm5lci54ICsgdGhpcy5kaWVTaXplIC0geDtcbiAgICAgICAgY29uc3Qgd2lkdGhPdXQgPSB0aGlzLmRpZVNpemUgLSB3aWR0aEluO1xuICAgICAgICBjb25zdCBoZWlnaHRJbiA9IGNvcm5lci55ICsgdGhpcy5kaWVTaXplIC0geTtcbiAgICAgICAgY29uc3QgaGVpZ2h0T3V0ID0gdGhpcy5kaWVTaXplIC0gaGVpZ2h0SW47XG5cbiAgICAgICAgY29uc3QgcXVhZHJhbnRzID0gW3tcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcihjb3JuZXJDZWxsKSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93LFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodE91dFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodE91dFxuICAgICAgICB9XTtcblxuICAgICAgICBjb25zdCBzbmFwVG8gPSBxdWFkcmFudHNcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG9uIHRoZSBsYXlvdXRcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiB1bmRlZmluZWQgIT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBub3QgYWxyZWFkeSB0YWtlbiBleGNlcHQgYnkgaXRzZWxmXG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gKFxuICAgICAgICAgICAgICAgIG51bGwgIT09IGRpZSAmJiB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykgPT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5fY2VsbElzRW1wdHkocXVhZHJhbnQucSwgX2RpY2UuZ2V0KHRoaXMpKSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIGNvdmVyZWQgYnkgdGhlIGRpZSB0aGUgbW9zdFxuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAobWF4USwgcXVhZHJhbnQpID0+IHF1YWRyYW50LmNvdmVyYWdlID4gbWF4US5jb3ZlcmFnZSA/IHF1YWRyYW50IDogbWF4USxcbiAgICAgICAgICAgICAgICB7cTogdW5kZWZpbmVkLCBjb3ZlcmFnZTogLTF9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IHNuYXBUby5xID8gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhzbmFwVG8ucSkgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGllIGF0IHBvaW50ICh4LCB5KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50IC0gVGhlIHBvaW50IGluICh4LCB5KSBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge1RvcERpZXxudWxsfSBUaGUgZGllIHVuZGVyIGNvb3JkaW5hdGVzICh4LCB5KSBvciBudWxsIGlmIG5vIGRpZVxuICAgICAqIGlzIGF0IHRoZSBwb2ludC5cbiAgICAgKi9cbiAgICBnZXRBdChwb2ludCA9IHt4OiAwLCB5OiAwfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBfZGljZS5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3QgeEZpdCA9IHggPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHggKyB0aGlzLmRpZVNpemU7XG4gICAgICAgICAgICBjb25zdCB5Rml0ID0geSA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0geSArIHRoaXMuZGllU2l6ZTtcblxuICAgICAgICAgICAgaWYgKHhGaXQgJiYgeUZpdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGdyaWQgc2l6ZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGhcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gVGhlIG1pbmltYWwgaGVpZ2h0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVHcmlkKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgX2NvbHMuc2V0KHRoaXMsIE1hdGguZmxvb3Iod2lkdGggLyB0aGlzLmRpZVNpemUpKTtcbiAgICAgICAgX3Jvd3Muc2V0KHRoaXMsIE1hdGguZmxvb3IoaGVpZ2h0IC8gdGhpcy5kaWVTaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIChyb3csIGNvbCkgY2VsbCB0byAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb0Nvb3Jkcyh7cm93LCBjb2x9KSB7XG4gICAgICAgIHJldHVybiB7eDogY29sICogdGhpcy5kaWVTaXplLCB5OiByb3cgKiB0aGlzLmRpZVNpemV9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgKHgsIHkpIGNvb3JkaW5hdGVzIHRvIGEgKHJvdywgY29sKSBjZWxsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkaW5hdGVzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnQgdG8gYSBjZWxsLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY2VsbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3Jkc1RvQ2VsbCh7eCwgeX0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7R3JpZExheW91dH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGUgbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cblxuLypcbiAqIENvbnZlcnQgYW4gSFRNTCBhdHRyaWJ1dGUgdG8gYW4gaW5zdGFuY2UncyBwcm9wZXJ0eS4gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSdzIG5hbWUuIEZvciBleGFtcGxlLCBcIm15LWF0dHJcIlxuICogd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJteUF0dHJcIiwgYW5kIFwiZGlzYWJsZWRcIiB0byBcImRpc2FibGVkXCIuXG4gKi9cbmNvbnN0IGF0dHJpYnV0ZTJwcm9wZXJ0eSA9IChuYW1lKSA9PiB7XG4gICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybiBmaXJzdCArIHJlc3QubWFwKHdvcmQgPT4gd29yZC5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKSkuam9pbigpO1xufTtcblxuLyoqXG4gKiBNaXhpbiB7QGxpbmsgUmVhZE9ubHlBdHRyaWJ1dGVzfSB0byBhIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7Kn0gU3VwIC0gVGhlIGNsYXNzIHRvIG1peCBpbnRvLlxuICogQHJldHVybiB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIFJlYWRPbmx5QXR0cmlidXRlc1xuICAgICAqL1xuICAgIGNsYXNzIGV4dGVuZHMgU3VwIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdGhhdCBpcyBleGVjdXRlZCB3aGVuIGFuIG9ic2VydmVkIGF0dHJpYnV0ZSdzIHZhbHVlIGlzXG4gICAgICAgICAqIGNoYW5nZWQuIElmIHRoZSBIVE1MRWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIERPTSwgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiB2YWx1ZSBjYW4gb25seSBiZSBzZXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgSFRNTEVsZW1lbnQncyBwcm9wZXJ0eS5cbiAgICAgICAgICogSW4gZWZmZWN0LCB0aGlzIG1ha2VzIHRoaXMgSFRNTEVsZW1lbnQncyBhdHRyaWJ1dGVzIHJlYWQtb25seS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIGFuIEhUTUxFbGVtZW50IGhhcyBhbiBhdHRyaWJ1dGUgXCJ4XCIgYW5kXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgXCJ4XCIsIHRoZW4gY2hhbmdpbmcgdGhlIHZhbHVlIFwieFwiIHRvIFwiNVwiXG4gICAgICAgICAqIHdpbGwgb25seSB3b3JrIHdoZW4gYHRoaXMueCA9PT0gNWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBvbGQgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgICAgICAqL1xuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBBbGwgYXR0cmlidXRlcyBhcmUgbWFkZSByZWFkLW9ubHkgdG8gcHJldmVudCBjaGVhdGluZyBieSBjaGFuZ2luZ1xuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuIE9mIGNvdXJzZSwgdGhpcyBpcyBieSBub1xuICAgICAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdXNlcnMgd2lsbCBub3QgY2hlYXQgaW4gYSBkaWZmZXJlbnQgd2F5LlxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBhdHRyaWJ1dGUycHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQgJiYgbmV3VmFsdWUgIT09IGAke3RoaXNbcHJvcGVydHldfWApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB0aGlzW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQge1xuICAgIFJlYWRPbmx5QXR0cmlidXRlc1xufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgVmFsaWRhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0aW9uRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgX3ZhbHVlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kZWZhdWx0VmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Vycm9ycyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IFR5cGVWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Ioe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9ycyA9IFtdfSkge1xuICAgICAgICBfdmFsdWUuc2V0KHRoaXMsIHZhbHVlKTtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgX2Vycm9ycy5zZXQodGhpcywgZXJyb3JzKTtcbiAgICB9XG5cbiAgICBnZXQgb3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gX3ZhbHVlLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLm9yaWdpbiA6IF9kZWZhdWx0VmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBlcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiBfZXJyb3JzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgaXNWYWxpZCgpIHtcbiAgICAgICAgcmV0dXJuIDAgPj0gdGhpcy5lcnJvcnMubGVuZ3RoO1xuICAgIH1cblxuICAgIGRlZmF1bHRUbyhuZXdEZWZhdWx0KSB7XG4gICAgICAgIF9kZWZhdWx0VmFsdWUuc2V0KHRoaXMsIG5ld0RlZmF1bHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfY2hlY2soe3ByZWRpY2F0ZSwgYmluZFZhcmlhYmxlcyA9IFtdLCBFcnJvclR5cGUgPSBWYWxpZGF0aW9uRXJyb3J9KSB7XG4gICAgICAgIGNvbnN0IHByb3Bvc2l0aW9uID0gcHJlZGljYXRlLmFwcGx5KHRoaXMsIGJpbmRWYXJpYWJsZXMpO1xuICAgICAgICBpZiAoIXByb3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvclR5cGUodGhpcy52YWx1ZSwgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUud2FybihlcnJvci50b1N0cmluZygpKTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IFBhcnNlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBQYXJzZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IEludmFsaWRUeXBlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnZhbGlkVHlwZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSBcIi4vZXJyb3IvUGFyc2VFcnJvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IElOVEVHRVJfREVGQVVMVF9WQUxVRSA9IDA7XG5jb25zdCBJbnRlZ2VyVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gSU5URUdFUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGlucHV0KSkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZhbHVlID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VkVmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGxhcmdlclRoYW4obikge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobikgPT4gdGhpcy5vcmlnaW4gPj0gbixcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzbWFsbGVyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA8PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGJldHdlZW4obiwgbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobiwgbSkgPT4gdGhpcy5sYXJnZXJUaGFuKG4pICYmIHRoaXMuc21hbGxlclRoYW4obSksXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbiwgbV1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnRlZ2VyVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgU1RSSU5HX0RFRkFVTFRfVkFMVUUgPSBcIlwiO1xuY29uc3QgU3RyaW5nVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IFNUUklOR19ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBub3RFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gXCJcIiAhPT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBTdHJpbmdUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbi8vaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQ09MT1JfREVGQVVMVF9WQUxVRSA9IFwiYmxhY2tcIjtcbmNvbnN0IENvbG9yVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBDb2xvclR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQk9PTEVBTl9ERUZBVUxUX1ZBTFVFID0gZmFsc2U7XG5jb25zdCBCb29sZWFuVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQk9PTEVBTl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoL3RydWUvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL2ZhbHNlL2kudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgUGFyc2VFcnJvcihpbnB1dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBpc1RydWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IHRydWUgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlzRmFsc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IGZhbHNlID09PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEJvb2xlYW5UeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0ludGVnZXJUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9JbnRlZ2VyVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtTdHJpbmdUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0NvbG9yVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vQ29sb3JUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0Jvb2xlYW5UeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Cb29sZWFuVHlwZVZhbGlkYXRvci5qc1wiO1xuXG5jb25zdCBWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgfVxuXG4gICAgYm9vbGVhbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEJvb2xlYW5UeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBjb2xvcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG4gICAgaW50ZWdlcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXJUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBzdHJpbmcoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbn07XG5cbmNvbnN0IFZhbGlkYXRvclNpbmdsZXRvbiA9IG5ldyBWYWxpZGF0b3IoKTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0b3JTaW5nbGV0b24gYXMgdmFsaWRhdGVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBmcm9tIFwiLi9taXhpbi9SZWFkT25seUF0dHJpYnV0ZXMuanNcIjtcbmltcG9ydCB7dmFsaWRhdGV9IGZyb20gXCIuL3ZhbGlkYXRlL3ZhbGlkYXRlLmpzXCI7XG5cbmNvbnN0IFRBR19OQU1FID0gXCJ0b3AtZGllXCI7XG5cbmNvbnN0IENJUkNMRV9ERUdSRUVTID0gMzYwOyAvLyBkZWdyZWVzXG5jb25zdCBOVU1CRVJfT0ZfUElQUyA9IDY7IC8vIERlZmF1bHQgLyByZWd1bGFyIHNpeCBzaWRlZCBkaWUgaGFzIDYgcGlwcyBtYXhpbXVtLlxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFwiSXZvcnlcIjtcbmNvbnN0IERFRkFVTFRfWCA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1kgPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ST1RBVElPTiA9IDA7IC8vIGRlZ3JlZXNcbmNvbnN0IERFRkFVTFRfT1BBQ0lUWSA9IDAuNTtcblxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgSEVMRF9CWV9BVFRSSUJVVEUgPSBcImhlbGQtYnlcIjtcbmNvbnN0IFBJUFNfQVRUUklCVVRFID0gXCJwaXBzXCI7XG5jb25zdCBST1RBVElPTl9BVFRSSUJVVEUgPSBcInJvdGF0aW9uXCI7XG5jb25zdCBYX0FUVFJJQlVURSA9IFwieFwiO1xuY29uc3QgWV9BVFRSSUJVVEUgPSBcInlcIjtcblxuY29uc3QgQkFTRV9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTID0gMTU7IC8vIHB4XG5jb25zdCBCQVNFX1NUUk9LRV9XSURUSCA9IDIuNTsgLy8gcHhcbmNvbnN0IE1JTl9TVFJPS0VfV0lEVEggPSAxOyAvLyBweFxuY29uc3QgSEFMRiA9IEJBU0VfRElFX1NJWkUgLyAyOyAvLyBweFxuY29uc3QgVEhJUkQgPSBCQVNFX0RJRV9TSVpFIC8gMzsgLy8gcHhcbmNvbnN0IFBJUF9TSVpFID0gQkFTRV9ESUVfU0laRSAvIDE1OyAvL3B4XG5jb25zdCBQSVBfQ09MT1IgPSBcImJsYWNrXCI7XG5cbmNvbnN0IGRlZzJyYWQgPSAoZGVnKSA9PiB7XG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcbn07XG5cbmNvbnN0IGlzUGlwTnVtYmVyID0gbiA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobiwgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcikgJiYgMSA8PSBudW1iZXIgJiYgbnVtYmVyIDw9IE5VTUJFUl9PRl9QSVBTO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgb2YgcGlwcyBiZXR3ZWVuIDEgYW5kIHRoZSBOVU1CRVJfT0ZfUElQUy5cbiAqXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBBIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgTlVNQkVSX09GX1BJUFMuXG4gKi9cbmNvbnN0IHJhbmRvbVBpcHMgPSAoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOVU1CRVJfT0ZfUElQUykgKyAxO1xuXG5jb25zdCBESUVfVU5JQ09ERV9DSEFSQUNURVJTID0gW1wi4pqAXCIsXCLimoFcIixcIuKaglwiLFwi4pqDXCIsXCLimoRcIixcIuKahVwiXTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllIGZhY2UgdG8gdGhlIG51bWJlciBvZiBwaXBzIG9mXG4gKiB0aGF0IHNhbWUgZGllLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlIG9mIHBpcHNUb1VuaWNvZGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHUgLSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgdG8gY29udmVydCB0byBwaXBzLlxuICogQHJldHVybnMge051bWJlcnx1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2LCBvclxuICogdW5kZWZpbmVkIGlmIHUgd2FzIG5vdCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZS5cbiAqL1xuY29uc3QgdW5pY29kZVRvUGlwcyA9ICh1KSA9PiB7XG4gICAgY29uc3QgZGllQ2hhckluZGV4ID0gRElFX1VOSUNPREVfQ0hBUkFDVEVSUy5pbmRleE9mKHUpO1xuICAgIHJldHVybiAwIDw9IGRpZUNoYXJJbmRleCA/IGRpZUNoYXJJbmRleCArIDEgOiB1bmRlZmluZWQ7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiB0byBhIHVuaWNvZGUgY2hhcmFjdGVyXG4gKiByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29ycmVzcG9uZGluZyBkaWUgZmFjZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZVxuICogb2YgdW5pY29kZVRvUGlwcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcCAtIFRoZSBudW1iZXIgb2YgcGlwcyB0byBjb252ZXJ0IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgdW5pY29kZSBjaGFyYWN0ZXJzIG9yXG4gKiB1bmRlZmluZWQgaWYgcCB3YXMgbm90IGJldHdlZW4gMSBhbmQgNiBpbmNsdXNpdmUuXG4gKi9cbmNvbnN0IHBpcHNUb1VuaWNvZGUgPSBwID0+IGlzUGlwTnVtYmVyKHApID8gRElFX1VOSUNPREVfQ0hBUkFDVEVSU1twIC0gMV0gOiB1bmRlZmluZWQ7XG5cbmNvbnN0IHJlbmRlckhvbGQgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0VQRVJBVE9SID0gd2lkdGggLyAzMDtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gREVGQVVMVF9PUEFDSVRZO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LmFyYyh4ICsgd2lkdGgsIHkgKyB3aWR0aCwgd2lkdGggLSBTRVBFUkFUT1IsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJEaWUgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0NBTEUgPSAod2lkdGggLyBIQUxGKTtcbiAgICBjb25zdCBIQUxGX0lOTkVSX1NJWkUgPSBNYXRoLnNxcnQod2lkdGggKiogMiAvIDIpO1xuICAgIGNvbnN0IElOTkVSX1NJWkUgPSAyICogSEFMRl9JTk5FUl9TSVpFO1xuICAgIGNvbnN0IFJPVU5ERURfQ09STkVSX1JBRElVUyA9IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTICogU0NBTEU7XG4gICAgY29uc3QgSU5ORVJfU0laRV9ST1VOREVEID0gSU5ORVJfU0laRSAtIDIgKiBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3QgU1RST0tFX1dJRFRIID0gTWF0aC5tYXgoTUlOX1NUUk9LRV9XSURUSCwgQkFTRV9TVFJPS0VfV0lEVEggKiBTQ0FMRSk7XG5cbiAgICBjb25zdCBzdGFydFggPSB4ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkUgKyBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3Qgc3RhcnRZID0geSArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFO1xuXG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgY29udGV4dC5saW5lV2lkdGggPSBTVFJPS0VfV0lEVEg7XG4gICAgY29udGV4dC5tb3ZlVG8oc3RhcnRYLCBzdGFydFkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDI3MCksIGRlZzJyYWQoMCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDApLCBkZWcycmFkKDkwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDkwKSwgZGVnMnJhZCgxODApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggLSBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgxODApLCBkZWcycmFkKDI3MCkpO1xuXG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlclBpcCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCkgPT4ge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBQSVBfQ09MT1I7XG4gICAgY29udGV4dC5tb3ZlVG8oeCwgeSk7XG4gICAgY29udGV4dC5hcmMoeCwgeSwgd2lkdGgsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2JvYXJkID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGVsZEJ5ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9waXBzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3RhdGlvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogVG9wRGllIGlzIHRoZSBcInRvcC1kaWVcIiBjdXN0b20gW0hUTUxcbiAqIGVsZW1lbnRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudCkgcmVwcmVzZW50aW5nIGEgZGllXG4gKiBvbiB0aGUgZGljZSBib2FyZC5cbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICogQG1peGVzIFJlYWRPbmx5QXR0cmlidXRlc1xuICovXG5jb25zdCBUb3BEaWUgPSBjbGFzcyBleHRlbmRzIFJlYWRPbmx5QXR0cmlidXRlcyhIVE1MRWxlbWVudCkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnID0ge31dIC0gVGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvZiB0aGUgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfG51bGx9IFtjb25maWcucGlwc10gLSBUaGUgcGlwcyBvZiB0aGUgZGllIHRvIGFkZC5cbiAgICAgKiBJZiBubyBwaXBzIGFyZSBzcGVjaWZpZWQgb3IgdGhlIHBpcHMgYXJlIG5vdCBiZXR3ZWVuIDEgYW5kIDYsIGEgcmFuZG9tXG4gICAgICogbnVtYmVyIGJldHdlZW4gMSBhbmQgNiBpcyBnZW5lcmF0ZWQgaW5zdGVhZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2NvbmZpZy5jb2xvcl0gLSBUaGUgY29sb3Igb2YgdGhlIGRpZSB0byBhZGQuIERlZmF1bHRcbiAgICAgKiB0byB0aGUgZGVmYXVsdCBjb2xvci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24gb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gW2NvbmZpZy5oZWxkQnldIC0gVGhlIHBsYXllciBob2xkaW5nIHRoZSBkaWUuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe3BpcHMsIGNvbG9yLCByb3RhdGlvbiwgeCwgeSwgaGVsZEJ5fSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgY29uc3QgcGlwc1ZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihwaXBzIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwc1ZhbHVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHBpcHNWYWx1ZSk7XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHZhbGlkYXRlLmNvbG9yKGNvbG9yIHx8IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfQ09MT1IpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHZhbGlkYXRlLmludGVnZXIocm90YXRpb24gfHwgdGhpcy5nZXRBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDAsIDM2MClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ST1RBVElPTilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnggPSB2YWxpZGF0ZS5pbnRlZ2VyKHggfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLmludGVnZXIoeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1kpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5oZWxkQnkgPSB2YWxpZGF0ZS5zdHJpbmcoaGVsZEJ5IHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoVEFHX05BTUUsIFRvcERpZSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllLFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZSxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLXBsYXllclwiO1xuXG4vLyBUaGUgbmFtZXMgb2YgdGhlIChvYnNlcnZlZCkgYXR0cmlidXRlcyBvZiB0aGUgVG9wUGxheWVyLlxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgTkFNRV9BVFRSSUJVVEUgPSBcIm5hbWVcIjtcbmNvbnN0IFNDT1JFX0FUVFJJQlVURSA9IFwic2NvcmVcIjtcbmNvbnN0IEhBU19UVVJOX0FUVFJJQlVURSA9IFwiaGFzLXR1cm5cIjtcblxuLy8gVGhlIHByaXZhdGUgcHJvcGVydGllcyBvZiB0aGUgVG9wUGxheWVyIFxuY29uc3QgX2NvbG9yID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9uYW1lID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9zY29yZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGFzVHVybiA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogQSBQbGF5ZXIgaW4gYSBkaWNlIGdhbWUuXG4gKlxuICogQSBwbGF5ZXIncyBuYW1lIHNob3VsZCBiZSB1bmlxdWUgaW4gdGhlIGdhbWUuIFR3byBkaWZmZXJlbnRcbiAqIFRvcFBsYXllciBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG5hbWUgYXR0cmlidXRlIGFyZSB0cmVhdGVkIGFzXG4gKiB0aGUgc2FtZSBwbGF5ZXIuXG4gKlxuICogSW4gZ2VuZXJhbCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IG5vIHR3byBwbGF5ZXJzIGRvIGhhdmUgdGhlIHNhbWUgY29sb3IsXG4gKiBhbHRob3VnaCBpdCBpcyBub3QgdW5jb25jZWl2YWJsZSB0aGF0IGNlcnRhaW4gZGljZSBnYW1lcyBoYXZlIHBsYXllcnMgd29ya1xuICogaW4gdGVhbXMgd2hlcmUgaXQgd291bGQgbWFrZSBzZW5zZSBmb3IgdHdvIG9yIG1vcmUgZGlmZmVyZW50IHBsYXllcnMgdG9cbiAqIGhhdmUgdGhlIHNhbWUgY29sb3IuXG4gKlxuICogVGhlIG5hbWUgYW5kIGNvbG9yIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkLiBUaGUgc2NvcmUgYW5kIGhhcy10dXJuXG4gKiBhdHRyaWJ1dGVzIGFyZSBub3QuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBSZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wUGxheWVyID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXIsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBwbGF5ZXIgd2l0aCBhIHR1cm5cbiAgICAgKi9cbiAgICBzdGFydFR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6c3RhcnQtdHVyblwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wUGxheWVyKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzeXN0ZW0gcGxheWVyLiBEaWNlIGFyZSB0aHJvd24gYnkgYSBwbGF5ZXIuIEZvciBzaXR1YXRpb25zXG4gKiB3aGVyZSB5b3Ugd2FudCB0byByZW5kZXIgYSBidW5jaCBvZiBkaWNlIHdpdGhvdXQgbmVlZGluZyB0aGUgY29uY2VwdCBvZiBQbGF5ZXJzXG4gKiB0aGlzIERFRkFVTFRfU1lTVEVNX1BMQVlFUiBjYW4gYmUgYSBzdWJzdGl0dXRlLiBPZiBjb3Vyc2UsIGlmIHlvdSdkIGxpa2UgdG9cbiAqIGNoYW5nZSB0aGUgbmFtZSBhbmQvb3IgdGhlIGNvbG9yLCBjcmVhdGUgYW5kIHVzZSB5b3VyIG93biBcInN5c3RlbSBwbGF5ZXJcIi5cbiAqIEBjb25zdFxuICovXG5jb25zdCBERUZBVUxUX1NZU1RFTV9QTEFZRVIgPSBuZXcgVG9wUGxheWVyKHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXIsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSLFxuICAgIFRBR19OQU1FLFxuICAgIEhBU19UVVJOX0FUVFJJQlVURVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUiwgVEFHX05BTUUgYXMgVE9QX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5cbmNvbnN0IFRBR19OQU1FID0gXCJ0b3AtcGxheWVyLWxpc3RcIjtcblxuLyoqXG4gKiBUb3BQbGF5ZXJMaXN0IHRvIGRlc2NyaWJlIHRoZSBwbGF5ZXJzIGluIHRoZSBnYW1lLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcFBsYXllckxpc3QgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXJMaXN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBpZiAoMCA+PSB0aGlzLnBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3A6c3RhcnQtdHVyblwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgb25lIHBsYXllciBjYW4gaGF2ZSBhIHR1cm4gYXQgYW55IGdpdmVuIHRpbWUuXG4gICAgICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4gIXAuZXF1YWxzKGV2ZW50LmRldGFpbC5wbGF5ZXIpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHAgPT4gcC5lbmRUdXJuKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBpbiB0aGlzIGxpc3QuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyW119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShUT1BfUExBWUVSKV07XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wUGxheWVyTGlzdCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVyTGlzdCxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7R3JpZExheW91dH0gZnJvbSBcIi4vR3JpZExheW91dC5qc1wiO1xuaW1wb3J0IHtUb3BEaWUsIFRBR19OQU1FIGFzIFRPUF9ESUV9IGZyb20gXCIuL1RvcERpZS5qc1wiO1xuaW1wb3J0IHtERUZBVUxUX1NZU1RFTV9QTEFZRVIsIFRvcFBsYXllciwgVEFHX05BTUUgYXMgVE9QX1BMQVlFUiwgSEFTX1RVUk5fQVRUUklCVVRFfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcbmltcG9ydCB7VEFHX05BTUUgYXMgVE9QX1BMQVlFUl9MSVNUfSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLWRpY2UtYm9hcmRcIjtcblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuY29uc3QgcGFyc2VOdW1iZXIgPSAobnVtYmVyU3RyaW5nLCBkZWZhdWx0TnVtYmVyID0gMCkgPT4ge1xuICAgIGNvbnN0IG51bWJlciA9IHBhcnNlSW50KG51bWJlclN0cmluZywgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNOYU4obnVtYmVyKSA/IGRlZmF1bHROdW1iZXIgOiBudW1iZXI7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIHJldHVybiB2YWxpZGF0ZS5pbnRlZ2VyKG51bWJlclN0cmluZylcbiAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgLmRlZmF1bHRUbyhkZWZhdWx0VmFsdWUpXG4gICAgICAgIC52YWx1ZTtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXIodmFsdWVTdHJpbmcsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG5jb25zdCBnZXRCb29sZWFuID0gKGJvb2xlYW5TdHJpbmcsIHRydWVWYWx1ZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKHRydWVWYWx1ZSA9PT0gYm9vbGVhblN0cmluZyB8fCBcInRydWVcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKFwiZmFsc2VcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG59O1xuXG5jb25zdCBnZXRCb29sZWFuQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbih2YWx1ZVN0cmluZywgW3ZhbHVlU3RyaW5nLCBcInRydWVcIl0sIFtcImZhbHNlXCJdLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbmNvbnN0IF9jYW52YXMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2xheW91dCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY3VycmVudFBsYXllciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbnVtYmVyT2ZSZWFkeURpY2UgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBjb250ZXh0ID0gKGJvYXJkKSA9PiBfY2FudmFzLmdldChib2FyZCkuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG5jb25zdCBnZXRSZWFkeURpY2UgPSAoYm9hcmQpID0+IHtcbiAgICBpZiAodW5kZWZpbmVkID09PSBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKSkge1xuICAgICAgICBfbnVtYmVyT2ZSZWFkeURpY2Uuc2V0KGJvYXJkLCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX251bWJlck9mUmVhZHlEaWNlLmdldChib2FyZCk7XG59O1xuXG5jb25zdCB1cGRhdGVSZWFkeURpY2UgPSAoYm9hcmQsIHVwZGF0ZSkgPT4ge1xuICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIGdldFJlYWR5RGljZShib2FyZCkgKyB1cGRhdGUpO1xufTtcblxuY29uc3QgaXNSZWFkeSA9IChib2FyZCkgPT4gZ2V0UmVhZHlEaWNlKGJvYXJkKSA9PT0gYm9hcmQuZGljZS5sZW5ndGg7XG5cbmNvbnN0IHVwZGF0ZUJvYXJkID0gKGJvYXJkLCBkaWNlID0gYm9hcmQuZGljZSkgPT4ge1xuICAgIGlmIChpc1JlYWR5KGJvYXJkKSkge1xuICAgICAgICBjb250ZXh0KGJvYXJkKS5jbGVhclJlY3QoMCwgMCwgYm9hcmQud2lkdGgsIGJvYXJkLmhlaWdodCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgZGllLnJlbmRlcihjb250ZXh0KGJvYXJkKSwgYm9hcmQuZGllU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbi8vIEludGVyYWN0aW9uIHN0YXRlc1xuY29uc3QgTk9ORSA9IFN5bWJvbChcIm5vX2ludGVyYWN0aW9uXCIpO1xuY29uc3QgSE9MRCA9IFN5bWJvbChcImhvbGRcIik7XG5jb25zdCBNT1ZFID0gU3ltYm9sKFwibW92ZVwiKTtcbmNvbnN0IElOREVURVJNSU5FRCA9IFN5bWJvbChcImluZGV0ZXJtaW5lZFwiKTtcbmNvbnN0IERSQUdHSU5HID0gU3ltYm9sKFwiZHJhZ2dpbmdcIik7XG5cbi8vIE1ldGhvZHMgdG8gaGFuZGxlIGludGVyYWN0aW9uXG5jb25zdCBjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyA9IChjYW52YXMsIHhXaW5kb3csIHlXaW5kb3cpID0+IHtcbiAgICBjb25zdCBjYW52YXNCb3ggPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB4ID0geFdpbmRvdyAtIGNhbnZhc0JveC5sZWZ0ICogKGNhbnZhcy53aWR0aCAvIGNhbnZhc0JveC53aWR0aCk7XG4gICAgY29uc3QgeSA9IHlXaW5kb3cgLSBjYW52YXNCb3gudG9wICogKGNhbnZhcy5oZWlnaHQgLyBjYW52YXNCb3guaGVpZ2h0KTtcblxuICAgIHJldHVybiB7eCwgeX07XG59O1xuXG5jb25zdCBzZXR1cEludGVyYWN0aW9uID0gKGJvYXJkKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gX2NhbnZhcy5nZXQoYm9hcmQpO1xuXG4gICAgLy8gU2V0dXAgaW50ZXJhY3Rpb25cbiAgICBsZXQgb3JpZ2luID0ge307XG4gICAgbGV0IHN0YXRlID0gTk9ORTtcbiAgICBsZXQgc3RhdGljQm9hcmQgPSBudWxsO1xuICAgIGxldCBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgbGV0IGhvbGRUaW1lb3V0ID0gbnVsbDtcblxuICAgIGNvbnN0IGhvbGREaWUgPSAoKSA9PiB7XG4gICAgICAgIGlmIChIT0xEID09PSBzdGF0ZSB8fCBJTkRFVEVSTUlORUQgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICAvLyB0b2dnbGUgaG9sZCAvIHJlbGVhc2VcbiAgICAgICAgICAgIGNvbnN0IHBsYXllcldpdGhBVHVybiA9IGJvYXJkLnF1ZXJ5U2VsZWN0b3IoYCR7VE9QX1BMQVlFUl9MSVNUfSAke1RPUF9QTEFZRVJ9WyR7SEFTX1RVUk5fQVRUUklCVVRFfV1gKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZCBpcyBhIGN1c3RvbSBIVE1MIGVsZW1lbnQgdG8gcmVuZGVyIGFuZCBjb250cm9sIGFcbiAqIGRpY2UgYm9hcmQuIFxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcERpY2VCb2FyZCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpY2VCb2FyZC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSB2YWxpZGF0ZS5ib29sZWFuKG5ld1ZhbHVlLCBnZXRCb29sZWFuKG9sZFZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKSkudmFsdWU7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5yb3RhdGUgPSAhZGlzYWJsZWRSb3RhdGlvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSBpcyBkZXRlcm1pbmVkIHdoZW4gdXNpbmcgdGhlIGdldHRlclxuICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTphZGRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgMSk7XG4gICAgICAgICAgICBpZiAoaXNSZWFkeSh0aGlzKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTpyZW1vdmVkXCIsICgpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIHVwZGF0ZVJlYWR5RGljZSh0aGlzLCAtMSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIGFkb3B0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgR3JpZExheW91dCB1c2VkIGJ5IHRoaXMgRGljZUJvYXJkIHRvIGxheW91dCB0aGUgZGljZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtHcmlkTGF5b3V0fVxuICAgICAqL1xuICAgIGdldCBsYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiBfbGF5b3V0LmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGljZSBvbiB0aGlzIGJvYXJkLiBOb3RlLCB0byBhY3R1YWxseSB0aHJvdyB0aGUgZGljZSB1c2VcbiAgICAgKiB7QGxpbmsgdGhyb3dEaWNlfS4gXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wRGllW119XG4gICAgICovXG4gICAgZ2V0IGRpY2UoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShUT1BfRElFKV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgcHV0IG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlLCAwIDwgbWF4aW11bS5cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0Lm1heGltdW1OdW1iZXJPZkRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIFdJRFRIX0FUVFJJQlVURSwgREVGQVVMVF9XSURUSCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhFSUdIVF9BVFRSSUJVVEUsIERFRkFVTFRfSEVJR0hUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESVNQRVJTSU9OX0FUVFJJQlVURSwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElFX1NJWkVfQVRUUklCVVRFLCBERUZBVUxUX0RJRV9TSVpFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGRyYWdnZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkRHJhZ2dpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGhlbGQgYnkgYSBQbGF5ZXI/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkSG9sZGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyByb3RhdGluZyBkaWNlIG9uIHRoaXMgYm9hcmQgZGlzYWJsZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkUm90YXRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZHVyYXRpb24gaW4gbXMgdG8gcHJlc3MgdGhlIG1vdXNlIC8gdG91Y2ggYSBkaWUgYmVmb3JlIGl0IGJla29tZXNcbiAgICAgKiBoZWxkIGJ5IHRoZSBQbGF5ZXIuIEl0IGhhcyBvbmx5IGFuIGVmZmVjdCB3aGVuIHRoaXMuaG9sZGFibGVEaWNlID09PVxuICAgICAqIHRydWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBob2xkRHVyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSwgREVGQVVMVF9IT0xEX0RVUkFUSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgVG9wUGxheWVyTGlzdCBlbGVtZW50IG9mIHRoaXMgVG9wRGljZUJvYXJkLiBJZiBpdCBkb2VzIG5vdCBleGlzdCxcbiAgICAgKiBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyTGlzdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfcGxheWVyTGlzdCgpIHtcbiAgICAgICAgbGV0IHBsYXllckxpc3QgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoVE9QX1BMQVlFUl9MSVNUKTtcbiAgICAgICAgaWYgKG51bGwgPT09IHBsYXllckxpc3QpIHtcbiAgICAgICAgICAgIHBsYXllckxpc3QgPSB0aGlzLmFwcGVuZENoaWxkKFRPUF9QTEFZRVJfTElTVCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGxheWVyTGlzdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBwbGF5aW5nIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyW119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wbGF5ZXJMaXN0LnBsYXllcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXMgcGxheWVyLCB0aHJvdyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVJdIC0gVGhlXG4gICAgICogcGxheWVyIHRoYXQgaXMgdGhyb3dpbmcgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgdGhyb3duIGRpY2Ugb24gdGhpcyBib2FyZC4gVGhpcyBsaXN0IG9mIGRpY2UgaXMgdGhlIHNhbWUgYXMgdGhpcyBUb3BEaWNlQm9hcmQncyB7QHNlZSBkaWNlfSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHRocm93RGljZShwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVIpIHtcbiAgICAgICAgaWYgKHBsYXllciAmJiAhcGxheWVyLmhhc1R1cm4pIHtcbiAgICAgICAgICAgIHBsYXllci5zdGFydFR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpY2UuZm9yRWFjaChkaWUgPT4gZGllLnRocm93SXQoKSk7XG4gICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaWUgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZXxPYmplY3R9IFtjb25maWcgPSB7fV0gLSBUaGUgZGllIG9yIGEgY29uZmlndXJhdGlvbiBvZlxuICAgICAqIHRoZSBkaWUgdG8gYWRkIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfG51bGx9IFtjb25maWcucGlwc10gLSBUaGUgcGlwcyBvZiB0aGUgZGllIHRvIGFkZC5cbiAgICAgKiBJZiBubyBwaXBzIGFyZSBzcGVjaWZpZWQgb3IgdGhlIHBpcHMgYXJlIG5vdCBiZXR3ZWVuIDEgYW5kIDYsIGEgcmFuZG9tXG4gICAgICogbnVtYmVyIGJldHdlZW4gMSBhbmQgNiBpcyBnZW5lcmF0ZWQgaW5zdGVhZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2NvbmZpZy5jb2xvcl0gLSBUaGUgY29sb3Igb2YgdGhlIGRpZSB0byBhZGQuIERlZmF1bHRcbiAgICAgKiB0byB0aGUgZGVmYXVsdCBjb2xvci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24gb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gW2NvbmZpZy5oZWxkQnldIC0gVGhlIHBsYXllciBob2xkaW5nIHRoZSBkaWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BEaWV9IFRoZSBhZGRlZCBkaWUuXG4gICAgICovXG4gICAgYWRkRGllKGNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcGVuZENoaWxkKGNvbmZpZyBpbnN0YW5jZW9mIFRvcERpZSA/IGNvbmZpZyA6IG5ldyBUb3BEaWUoY29uZmlnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRpZSBmcm9tIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BEaWV9IGRpZSAtIFRoZSBkaWUgdG8gcmVtb3ZlIGZyb20gdGhpcyBib2FyZC5cbiAgICAgKi9cbiAgICByZW1vdmVEaWUoZGllKSB7XG4gICAgICAgIGlmIChkaWUucGFyZW50Tm9kZSAmJiBkaWUucGFyZW50Tm9kZSA9PT0gdGhpcykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChkaWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcGxheWVyIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ8T2JqZWN0fSBjb25maWcgLSBUaGUgcGxheWVyIG9yIGEgY29uZmlndXJhdGlvbiBvZiBhXG4gICAgICogcGxheWVyIHRvIGFkZCB0byB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIEVycm9yIHdoZW4gdGhlIHBsYXllciB0byBhZGQgY29uZmxpY3RzIHdpdGggYSBwcmUtZXhpc3RpbmdcbiAgICAgKiBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBhZGRlZCBwbGF5ZXIuXG4gICAgICovXG4gICAgYWRkUGxheWVyKGNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wbGF5ZXJMaXN0LmFwcGVuZENoaWxkKGNvbmZpZyBpbnN0YW5jZW9mIFRvcFBsYXllciA/IGNvbmZpZyA6IG5ldyBUb3BQbGF5ZXIoY29uZmlnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYXllciBmcm9tIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IHBsYXllciAtIFRoZSBwbGF5ZXIgdG8gcmVtb3ZlIGZyb20gdGhpcyBib2FyZC5cbiAgICAgKi9cbiAgICByZW1vdmVQbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIGlmIChwbGF5ZXIucGFyZW50Tm9kZSAmJiBwbGF5ZXIucGFyZW50Tm9kZSA9PT0gdGhpcy5fcGxheWVyTGlzdCkge1xuICAgICAgICAgICAgdGhpcy5fcGxheWVyTGlzdC5yZW1vdmVDaGlsZChwbGF5ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFRBR19OQU1FLCBUb3BEaWNlQm9hcmQpO1xuXG5leHBvcnQge1xuICAgIFRvcERpY2VCb2FyZCxcbiAgICBERUZBVUxUX0RJRV9TSVpFLFxuICAgIERFRkFVTFRfSE9MRF9EVVJBVElPTixcbiAgICBERUZBVUxUX1dJRFRILFxuICAgIERFRkFVTFRfSEVJR0hULFxuICAgIERFRkFVTFRfRElTUEVSU0lPTixcbiAgICBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQsXG4gICAgVEFHX05BTUVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuaW1wb3J0IHtUb3BEaWNlQm9hcmR9IGZyb20gXCIuL1RvcERpY2VCb2FyZC5qc1wiO1xuaW1wb3J0IHtUb3BEaWV9IGZyb20gXCIuL1RvcERpZS5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJ9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJMaXN0fSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5cbndpbmRvdy50d2VudHlvbmVwaXBzID0gd2luZG93LnR3ZW50eW9uZXBpcHMgfHwgT2JqZWN0LmZyZWV6ZSh7XG4gICAgVkVSU0lPTjogXCIwLjAuMVwiLFxuICAgIExJQ0VOU0U6IFwiTEdQTC0zLjBcIixcbiAgICBXRUJTSVRFOiBcImh0dHBzOi8vdHdlbnR5b25lcGlwcy5vcmdcIixcbiAgICBUb3BEaWNlQm9hcmQ6IFRvcERpY2VCb2FyZCxcbiAgICBUb3BEaWU6IFRvcERpZSxcbiAgICBUb3BQbGF5ZXI6IFRvcFBsYXllcixcbiAgICBUb3BQbGF5ZXJMaXN0OiBUb3BQbGF5ZXJMaXN0XG59KTtcbiJdLCJuYW1lcyI6WyJUQUdfTkFNRSIsInZhbGlkYXRlIiwiQ09MT1JfQVRUUklCVVRFIiwiX2NvbG9yIiwiVE9QX1BMQVlFUiIsIlRPUF9QTEFZRVJfTElTVCIsIlRP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QyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFD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QVM7SUFDcEIsYUFBYSxFQUFFLGFBQWE7Q0FDL0IsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNFUnBaUzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlVYjNCUWJHRjVaWEl1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1VHeGhlV1Z5VEdsemRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OVViM0JFYVdObFFtOWhjbVF1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMbXB6SWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRVZ5Y205eVhHNGdLaTljYm1OdmJuTjBJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCM2FYUm9JRzFsYzNOaFoyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JXVnpjMkZuWlNBdElGUm9aU0J0WlhOellXZGxJR0Z6YzI5amFXRjBaV1FnZDJsMGFDQjBhR2x6WEc0Z0lDQWdJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxbGMzTmhaMlVwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYldWemMyRm5aU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNExDQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVaVlRFeGZRMGxTUTB4RlgwbE9YMFJGUjFKRlJWTWdQU0F6TmpBN1hHNWNibU52Ym5OMElISmhibVJ2YldsNlpVTmxiblJsY2lBOUlDaHVLU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJQ2d3TGpVZ1BEMGdUV0YwYUM1eVlXNWtiMjBvS1NBL0lFMWhkR2d1Wm14dmIzSWdPaUJOWVhSb0xtTmxhV3dwTG1OaGJHd29NQ3dnYmlrN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElHWnBaV3hrYzF4dVkyOXVjM1FnWDNkcFpIUm9JRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9aV2xuYUhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOdmJITWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzSnZkM01nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwWTJVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScFpWTnBlbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwYzNCbGNuTnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZEdGMFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNiaThxS2x4dUlDb2dRSFI1Y0dWa1pXWWdlMDlpYW1WamRIMGdSM0pwWkV4aGVXOTFkRU52Ym1acFozVnlZWFJwYjI1Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VkMmxrZEdnZ0xTQlVhR1VnYldsdWFXMWhiQ0IzYVdSMGFDQnZaaUIwYUdselhHNGdLaUJIY21sa1RHRjViM1YwSUdsdUlIQnBlR1ZzY3k0N1hHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbWhsYVdkb2RGMGdMU0JVYUdVZ2JXbHVhVzFoYkNCb1pXbG5hSFFnYjJaY2JpQXFJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDQnBiaUJ3YVhobGJITXVMbHh1SUNvZ1FIQnliM0JsY25SNUlIdE9kVzFpWlhKOUlHTnZibVpwWnk1a2FYTndaWEp6YVc5dUlDMGdWR2hsSUdScGMzUmhibU5sSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVmNiaUFxSUd4aGVXOTFkQ0JoSUdScFpTQmpZVzRnWW1VZ2JHRjViM1YwTGx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NWthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkhjbWxrVEdGNWIzVjBJR2hoYm1Sc1pYTWdiR0Y1YVc1bklHOTFkQ0IwYUdVZ1pHbGpaU0J2YmlCaElFUnBZMlZDYjJGeVpDNWNiaUFxTDF4dVkyOXVjM1FnUjNKcFpFeGhlVzkxZENBOUlHTnNZWE56SUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRIY21sa1RHRjViM1YwUTI5dVptbG5kWEpoZEdsdmJuMGdZMjl1Wm1sbklDMGdWR2hsSUdOdmJtWnBaM1Z5WVhScGIyNGdiMllnZEdobElFZHlhV1JNWVhsdmRYUmNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaDdYRzRnSUNBZ0lDQWdJSGRwWkhSb0xGeHVJQ0FnSUNBZ0lDQm9aV2xuYUhRc1hHNGdJQ0FnSUNBZ0lHUnBjM0JsY25OcGIyNHNYRzRnSUNBZ0lDQWdJR1JwWlZOcGVtVmNiaUFnSUNCOUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ1gyUnBZMlV1YzJWMEtIUm9hWE1zSUZ0ZEtUdGNiaUFnSUNBZ0lDQWdYMlJwWlZOcGVtVXVjMlYwS0hSb2FYTXNJREVwTzF4dUlDQWdJQ0FnSUNCZmQybGtkR2d1YzJWMEtIUm9hWE1zSURBcE8xeHVJQ0FnSUNBZ0lDQmZhR1ZwWjJoMExuTmxkQ2gwYUdsekxDQXdLVHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVdWVGFYcGxJRDBnWkdsbFUybDZaVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNhV1IwYUNBOUlIZHBaSFJvTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZDJsa2RHZ2dhVzRnY0dsNFpXeHpJSFZ6WldRZ1lua2dkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUlGZHBaSFJvSUQ0OUlEQmNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlNCY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2QybGtkR2dvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmQybGtkR2d1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCM2FXUjBhQ2gzS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUQ0Z2R5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGdWMmxrZEdnZ2MyaHZkV3hrSUdKbElHRWdiblZ0WW1WeUlHeGhjbWRsY2lCMGFHRnVJREFzSUdkdmRDQW5KSHQzZlNjZ2FXNXpkR1ZoWkM1Z0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JmZDJsa2RHZ3VjMlYwS0hSb2FYTXNJSGNwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbDlqWVd4amRXeGhkR1ZIY21sa0tIUm9hWE11ZDJsa2RHZ3NJSFJvYVhNdWFHVnBaMmgwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdhR1ZwWjJoMElHbHVJSEJwZUdWc2N5QjFjMlZrSUdKNUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM0Z1hHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1NHVnBaMmgwSUQ0OUlEQmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdobGFXZG9kQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5b1pXbG5hSFF1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCb1pXbG5hSFFvYUNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK0lHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUc1bGR5QkRiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSW9ZRWhsYVdkb2RDQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTUN3Z1oyOTBJQ2NrZTJoOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUY5b1pXbG5hSFF1YzJWMEtIUm9hWE1zSUdncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TGw5allXeGpkV3hoZEdWSGNtbGtLSFJvYVhNdWQybGtkR2dzSUhSb2FYTXVhR1ZwWjJoMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR0YwSUdOaGJpQmlaU0JzWVhsdmRYUWdiMjRnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJVYUdselhHNGdJQ0FnSUNvZ2JuVnRZbVZ5SUdseklENDlJREF1SUZKbFlXUWdiMjVzZVM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRzFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYjJ4eklDb2dkR2hwY3k1ZmNtOTNjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1pHbHpjR1Z5YzJsdmJpQnNaWFpsYkNCMWMyVmtJR0o1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnVkdobElHUnBjM0JsY25OcGIyNGdiR1YyWld4Y2JpQWdJQ0FnS2lCcGJtUnBZMkYwWlhNZ2RHaGxJR1JwYzNSaGJtTmxJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQmthV05sSUdOaGJpQmlaU0JzWVhsdmRYUXVJRlZ6WlNBeElHWnZjaUJoWEc0Z0lDQWdJQ29nZEdsbmFIUWdjR0ZqYTJWa0lHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGFISnZkM01nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUVScGMzQmxjbk5wYjI0Z1BqMGdNRnh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjM0JsY25OcGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsemNHVnljMmx2Ymk1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzJWMElHUnBjM0JsY25OcGIyNG9aQ2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0ErSUdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lFUnBjM0JsY25OcGIyNGdjMmh2ZFd4a0lHSmxJR0VnYm5WdFltVnlJR3hoY21kbGNpQjBhR0Z1SURBc0lHZHZkQ0FuSkh0a2ZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJScGMzQmxjbk5wYjI0dWMyVjBLSFJvYVhNc0lHUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCemFYcGxJRzltSUdFZ1pHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFJvY205M2N5QkRiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSWdSR2xsVTJsNlpTQStQU0F3WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2xsVTJsNlpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlrYVdWVGFYcGxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpaWFFnWkdsbFUybDZaU2hrY3lrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK1BTQmtjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhnWkdsbFUybDZaU0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Td2daMjkwSUNja2UyUnpmU2NnYVc1emRHVmhaQzVnS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmZaR2xsVTJsNlpTNXpaWFFvZEdocGN5d2daSE1wTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbDlqWVd4amRXeGhkR1ZIY21sa0tIUm9hWE11ZDJsa2RHZ3NJSFJvYVhNdWFHVnBaMmgwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2NtOTBZWFJsS0NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeUlEMGdYM0p2ZEdGMFpTNW5aWFFvZEdocGN5azdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUWdQVDA5SUhJZ1B5QjBjblZsSURvZ2NqdGNiaUFnSUNCOVhHNWNiaUFnSUNCelpYUWdjbTkwWVhSbEtISXBJSHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnY2lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRzUxYldKbGNpQnZaaUJ5YjNkeklHbHVJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY24wZ1ZHaGxJRzUxYldKbGNpQnZaaUJ5YjNkekxDQXdJRHdnY205M2N5NWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmZjbTkzY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXliM2R6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdiblZ0WW1WeUlHOW1JR052YkhWdGJuTWdhVzRnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZTQlVhR1VnYm5WdFltVnlJRzltSUdOdmJIVnRibk1zSURBZ1BDQmpiMngxYlc1ekxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElGOWpiMnh6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyTnZiSE11WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmpaVzUwWlhJZ1kyVnNiQ0JwYmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjlJRlJvWlNCalpXNTBaWElnS0hKdmR5d2dZMjlzS1M1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCZlkyVnVkR1Z5S0NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeWIzY2dQU0J5WVc1a2IyMXBlbVZEWlc1MFpYSW9kR2hwY3k1ZmNtOTNjeUF2SURJcElDMGdNVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMjlzSUQwZ2NtRnVaRzl0YVhwbFEyVnVkR1Z5S0hSb2FYTXVYMk52YkhNZ0x5QXlLU0F0SURFN1hHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdHliM2NzSUdOdmJIMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dUR0Y1YjNWMElHUnBZMlVnYjI0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCRWFXVmJYWDBnWkdsalpTQXRJRlJvWlNCa2FXTmxJSFJ2SUd4aGVXOTFkQ0J2YmlCMGFHbHpJRXhoZVc5MWRDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFViM0JFYVdWYlhYMGdWR2hsSUhOaGJXVWdiR2x6ZENCdlppQmthV05sTENCaWRYUWdibTkzSUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnVkdobElHNTFiV0psY2lCdlpseHVJQ0FnSUNBcUlHUnBZMlVnYzJodmRXeGtJRzV2ZENCbGVHTmxaV1FnZEdobElHMWhlR2x0ZFcwZ2JuVnRZbVZ5SUc5bUlHUnBZMlVnZEdocGN5Qk1ZWGx2ZFhRZ1kyRnVYRzRnSUNBZ0lDb2diR0Y1YjNWMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUd4aGVXOTFkQ2hrYVdObEtTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoa2FXTmxMbXhsYm1kMGFDQStJSFJvYVhNdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGdWR2hsSUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUd4aGVXOTFkQ0JwY3lBa2UzUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlgwc0lHZHZkQ0FrZTJScFkyVXViR1Z1WjJoMGZTQmthV05sSUdsdWMzUmxZV1F1WUNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTQTlJRnRkTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrYVdObFZHOU1ZWGx2ZFhRZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHUnBaU0J2WmlCa2FXTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvWkdsbExtaGhjME52YjNKa2FXNWhkR1Z6S0NrZ0ppWWdaR2xsTG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdSR2xqWlNCMGFHRjBJR0Z5WlNCaVpXbHVaeUJvWld4a0lHRnVaQ0JvWVhabElHSmxaVzRnYkdGNWIzVjBJR0psWm05eVpTQnphRzkxYkdSY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QnJaV1Z3SUhSb1pXbHlJR04xY25KbGJuUWdZMjl2Y21ScGJtRjBaWE1nWVc1a0lISnZkR0YwYVc5dUxpQkpiaUJ2ZEdobGNpQjNiM0prY3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QjBhR1Z6WlNCa2FXTmxJR0Z5WlNCemEybHdjR1ZrTGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sTG5CMWMyZ29aR2xsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xqWlZSdlRHRjViM1YwTG5CMWMyZ29aR2xsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUcxaGVDQTlJRTFoZEdndWJXbHVLR1JwWTJVdWJHVnVaM1JvSUNvZ2RHaHBjeTVrYVhOd1pYSnphVzl1TENCMGFHbHpMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVwTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JoZG1GcGJHRmliR1ZEWld4c2N5QTlJSFJvYVhNdVgyTnZiWEIxZEdWQmRtRnBiR0ZpYkdWRFpXeHNjeWh0WVhnc0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtUdGNibHh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdScFpTQnZaaUJrYVdObFZHOU1ZWGx2ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEpoYm1SdmJVbHVaR1Y0SUQwZ1RXRjBhQzVtYkc5dmNpaE5ZWFJvTG5KaGJtUnZiU2dwSUNvZ1lYWmhhV3hoWW14bFEyVnNiSE11YkdWdVozUm9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhKaGJtUnZiVU5sYkd3Z1BTQmhkbUZwYkdGaWJHVkRaV3hzYzF0eVlXNWtiMjFKYm1SbGVGMDdYRzRnSUNBZ0lDQWdJQ0FnSUNCaGRtRnBiR0ZpYkdWRFpXeHNjeTV6Y0d4cFkyVW9jbUZ1Wkc5dFNXNWtaWGdzSURFcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVXVZMjl2Y21ScGJtRjBaWE1nUFNCMGFHbHpMbDl1ZFcxaVpYSlViME52YjNKa2FXNWhkR1Z6S0hKaGJtUnZiVU5sYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbExuSnZkR0YwYVc5dUlEMGdkR2hwY3k1eWIzUmhkR1VnUHlCTllYUm9Mbkp2ZFc1a0tFMWhkR2d1Y21GdVpHOXRLQ2tnS2lCR1ZVeE1YME5KVWtOTVJWOUpUbDlFUlVkU1JVVlRLU0E2SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnSUNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlM1d2RYTm9LR1JwWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JmWkdsalpTNXpaWFFvZEdocGN5d2dZV3h5WldGa2VVeGhlVzkxZEVScFkyVXBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjIxd2RYUmxJR0VnYkdsemRDQjNhWFJvSUdGMllXbHNZV0pzWlNCalpXeHNjeUIwYnlCd2JHRmpaU0JrYVdObElHOXVMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHMWhlQ0F0SUZSb1pTQnVkVzFpWlhJZ1pXMXdkSGtnWTJWc2JITWdkRzhnWTI5dGNIVjBaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0VScFpWdGRmU0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU0F0SUVFZ2JHbHpkQ0IzYVhSb0lHUnBZMlVnZEdoaGRDQm9ZWFpsSUdGc2NtVmhaSGtnWW1WbGJpQnNZWGx2ZFhRdVhHNGdJQ0FnSUNvZ1hHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5VzExOUlGUm9aU0JzYVhOMElHOW1JR0YyWVdsc1lXSnNaU0JqWld4c2N5QnlaWEJ5WlhObGJuUmxaQ0JpZVNCMGFHVnBjaUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyOXRjSFYwWlVGMllXbHNZV0pzWlVObGJHeHpLRzFoZUN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1lYWmhhV3hoWW14bElEMGdibVYzSUZObGRDZ3BPMXh1SUNBZ0lDQWdJQ0JzWlhRZ2JHVjJaV3dnUFNBd08xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdFlYaE1aWFpsYkNBOUlFMWhkR2d1YldsdUtIUm9hWE11WDNKdmQzTXNJSFJvYVhNdVgyTnZiSE1wTzF4dVhHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoaGRtRnBiR0ZpYkdVdWMybDZaU0E4SUcxaGVDQW1KaUJzWlhabGJDQThJRzFoZUV4bGRtVnNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR05sYkd3Z2IyWWdkR2hwY3k1ZlkyVnNiSE5QYmt4bGRtVnNLR3hsZG1Wc0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMWJtUmxabWx1WldRZ0lUMDlJR05sYkd3Z0ppWWdkR2hwY3k1ZlkyVnNiRWx6Ulcxd2RIa29ZMlZzYkN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGMllXbHNZV0pzWlM1aFpHUW9ZMlZzYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JzWlhabGJDc3JPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUVGeWNtRjVMbVp5YjIwb1lYWmhhV3hoWW14bEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRZV3hqZFd4aGRHVWdZV3hzSUdObGJHeHpJRzl1SUd4bGRtVnNJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQnZaaUIwYUdVZ2JHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR3hsZG1Wc0lDMGdWR2hsSUd4bGRtVnNJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQnZaaUIwYUdVZ2JHRjViM1YwTGlBd1hHNGdJQ0FnSUNvZ2FXNWthV05oZEdWeklIUm9aU0JqWlc1MFpYSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFRaWFE4VG5WdFltVnlQbjBnZEdobElHTmxiR3h6SUc5dUlIUm9aU0JzWlhabGJDQnBiaUIwYUdseklHeGhlVzkxZENCeVpYQnlaWE5sYm5SbFpDQmllVnh1SUNBZ0lDQXFJSFJvWldseUlHNTFiV0psY2k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWld4c2MwOXVUR1YyWld3b2JHVjJaV3dwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJWc2JITWdQU0J1WlhjZ1UyVjBLQ2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR05sYm5SbGNpQTlJSFJvYVhNdVgyTmxiblJsY2p0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvTUNBOVBUMGdiR1YyWld3cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb1kyVnVkR1Z5S1NrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0J5YjNjZ1BTQmpaVzUwWlhJdWNtOTNJQzBnYkdWMlpXdzdJSEp2ZHlBOFBTQmpaVzUwWlhJdWNtOTNJQ3NnYkdWMlpXdzdJSEp2ZHlzcktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMlZzYkhNdVlXUmtLSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3Y205M0xDQmpiMnc2SUdObGJuUmxjaTVqYjJ3Z0xTQnNaWFpsYkgwcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpaV3hzY3k1aFpHUW9kR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHR5YjNjc0lHTnZiRG9nWTJWdWRHVnlMbU52YkNBcklHeGxkbVZzZlNrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0JqYjJ3Z1BTQmpaVzUwWlhJdVkyOXNJQzBnYkdWMlpXd2dLeUF4T3lCamIyd2dQQ0JqWlc1MFpYSXVZMjlzSUNzZ2JHVjJaV3c3SUdOdmJDc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJWc2JITXVZV1JrS0hSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loN2NtOTNPaUJqWlc1MFpYSXVjbTkzSUMwZ2JHVjJaV3dzSUdOdmJIMHBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWld4c2N5NWhaR1FvZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0eWIzYzZJR05sYm5SbGNpNXliM2NnS3lCc1pYWmxiQ3dnWTI5c2ZTa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR05sYkd4ek8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFUnZaWE1nWTJWc2JDQmpiMjUwWVdsdUlHRWdZMlZzYkNCbWNtOXRJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxQMXh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHTmxiR3dnTFNCQklHTmxiR3dnYVc0Z2JHRjViM1YwSUhKbGNISmxjMlZ1ZEdWa0lHSjVJR0VnYm5WdFltVnlMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdWRzl3UkdsbFcxMTlJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxJQzBnUVNCc2FYTjBJRzltSUdScFkyVWdkR2hoZENCb1lYWmxJR0ZzY21WaFpIa2dZbVZsYmlCc1lYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElHbG1JR05sYkd3Z1pHOWxjeUJ1YjNRZ1kyOXVkR0ZwYmlCaElHUnBaUzVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpaV3hzU1hORmJYQjBlU2hqWld4c0xDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJRDA5UFNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlM1bWFXNWtLR1JwWlNBOVBpQmpaV3hzSUQwOVBTQjBhR2x6TGw5amIyOXlaR2x1WVhSbGMxUnZUblZ0WW1WeUtHUnBaUzVqYjI5eVpHbHVZWFJsY3lrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQnVkVzFpWlhJZ2RHOGdZU0JqWld4c0lDaHliM2NzSUdOdmJDbGNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdUlDMGdWR2hsSUc1MWJXSmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmpaV3hzWEc0Z0lDQWdJQ29nUUhKbGRIVnlibk1nZTA5aWFtVmpkSDBnVW1WMGRYSnVJSFJvWlNCalpXeHNJQ2g3Y205M0xDQmpiMng5S1NCamIzSnlaWE53YjI1a2FXNW5JRzR1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZiblZ0WW1WeVZHOURaV3hzS0c0cElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdHliM2M2SUUxaGRHZ3VkSEoxYm1Nb2JpQXZJSFJvYVhNdVgyTnZiSE1wTENCamIydzZJRzRnSlNCMGFHbHpMbDlqYjJ4emZUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdZMlZzYkNCMGJ5QmhJRzUxYldKbGNseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdObGJHd2dMU0JVYUdVZ1kyVnNiQ0IwYnlCamIyNTJaWEowSUhSdklHbDBjeUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZIVnVaR1ZtYVc1bFpIMGdWR2hsSUc1MWJXSmxjaUJqYjNKeVpYTndiMjVrYVc1bklIUnZJSFJvWlNCalpXeHNMbHh1SUNBZ0lDQXFJRkpsZEhWeWJuTWdkVzVrWldacGJtVmtJSGRvWlc0Z2RHaGxJR05sYkd3Z2FYTWdibTkwSUc5dUlIUm9aU0JzWVhsdmRYUmNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNWRzlPZFcxaVpYSW9lM0p2ZHl3Z1kyOXNmU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0E4UFNCeWIzY2dKaVlnY205M0lEd2dkR2hwY3k1ZmNtOTNjeUFtSmlBd0lEdzlJR052YkNBbUppQmpiMndnUENCMGFHbHpMbDlqYjJ4ektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY205M0lDb2dkR2hwY3k1ZlkyOXNjeUFySUdOdmJEdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdZU0JqWld4c0lISmxjSEpsYzJWdWRHVmtJR0o1SUdsMGN5QnVkVzFpWlhJZ2RHOGdkR2hsYVhJZ1kyOXZjbVJwYm1GMFpYTXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JpQXRJRlJvWlNCdWRXMWlaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdZMlZzYkZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdZMjl5Y21WemNHOXVaR2x1WnlCMGJ5QjBhR1VnWTJWc2JDQnlaWEJ5WlhObGJuUmxaQ0JpZVZ4dUlDQWdJQ0FxSUhSb2FYTWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDI1MWJXSmxjbFJ2UTI5dmNtUnBibUYwWlhNb2Jpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyVnNiRlJ2UTI5dmNtUnpLSFJvYVhNdVgyNTFiV0psY2xSdlEyVnNiQ2h1S1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElIQmhhWElnYjJZZ1kyOXZjbVJwYm1GMFpYTWdkRzhnWVNCdWRXMWlaWEl1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdZMjl2Y21SeklDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZJR052Ym5abGNuUmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY254MWJtUmxabWx1WldSOUlGUm9aU0JqYjI5eVpHbHVZWFJsY3lCamIyNTJaWEowWldRZ2RHOGdZU0J1ZFcxaVpYSXVJRWxtWEc0Z0lDQWdJQ29nZEdobElHTnZiM0prYVc1aGRHVnpJR0Z5WlNCdWIzUWdiMjRnZEdocGN5QnNZWGx2ZFhRc0lIUm9aU0J1ZFcxaVpYSWdhWE1nZFc1a1pXWnBibVZrTGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YjNKa2FXNWhkR1Z6Vkc5T2RXMWlaWElvWTI5dmNtUnpLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzRnUFNCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2RHaHBjeTVmWTI5dmNtUnpWRzlEWld4c0tHTnZiM0prY3lrcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBOFBTQnVJQ1ltSUc0Z1BDQjBhR2x6TG0xaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1TzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1UyNWhjQ0FvZUN4NUtTQjBieUIwYUdVZ1kyeHZjMlZ6ZENCalpXeHNJR2x1SUhSb2FYTWdUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdScFpXTnZiM0prYVc1aGRHVWdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpTQjBieUJtYVc1a0lIUm9aU0JqYkc5elpYTjBJR05sYkd4Y2JpQWdJQ0FnS2lCbWIzSXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JFYVdWOUlGdGthV1ZqYjI5eVpHbHVZWFF1WkdsbElEMGdiblZzYkYwZ0xTQlVhR1VnWkdsbElIUnZJSE51WVhBZ2RHOHVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHUnBaV052YjNKa2FXNWhkR1V1ZUNBdElGUm9aU0I0TFdOdmIzSmthVzVoZEdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdScFpXTnZiM0prYVc1aGRHVXVlU0F0SUZSb1pTQjVMV052YjNKa2FXNWhkR1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjhiblZzYkgwZ1ZHaGxJR052YjNKa2FXNWhkR1VnYjJZZ2RHaGxJR05sYkd3Z1kyeHZjMlZ6ZENCMGJ5QW9lQ3dnZVNrdVhHNGdJQ0FnSUNvZ1RuVnNiQ0IzYUdWdUlHNXZJSE4xYVhSaFlteGxJR05sYkd3Z2FYTWdibVZoY2lBb2VDd2dlU2xjYmlBZ0lDQWdLaTljYmlBZ0lDQnpibUZ3Vkc4b2UyUnBaU0E5SUc1MWJHd3NJSGdzSUhsOUtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHTnZjbTVsY2tObGJHd2dQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUUxaGRHZ3VkSEoxYm1Nb2VTQXZJSFJvYVhNdVpHbGxVMmw2WlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklFMWhkR2d1ZEhKMWJtTW9lQ0F2SUhSb2FYTXVaR2xsVTJsNlpTbGNiaUFnSUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjNKdVpYSWdQU0IwYUdsekxsOWpaV3hzVkc5RGIyOXlaSE1vWTI5eWJtVnlRMlZzYkNrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhkcFpIUm9TVzRnUFNCamIzSnVaWEl1ZUNBcklIUm9hWE11WkdsbFUybDZaU0F0SUhnN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhkcFpIUm9UM1YwSUQwZ2RHaHBjeTVrYVdWVGFYcGxJQzBnZDJsa2RHaEpianRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhR1ZwWjJoMFNXNGdQU0JqYjNKdVpYSXVlU0FySUhSb2FYTXVaR2xsVTJsNlpTQXRJSGs3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2hsYVdkb2RFOTFkQ0E5SUhSb2FYTXVaR2xsVTJsNlpTQXRJR2hsYVdkb2RFbHVPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEYxWVdSeVlXNTBjeUE5SUZ0N1hHNGdJQ0FnSUNBZ0lDQWdJQ0J4T2lCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb1kyOXlibVZ5UTJWc2JDa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIzWmxjbUZuWlRvZ2QybGtkR2hKYmlBcUlHaGxhV2RvZEVsdVhHNGdJQ0FnSUNBZ0lIMHNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQmpiM0p1WlhKRFpXeHNMbkp2ZHl4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIydzZJR052Y201bGNrTmxiR3d1WTI5c0lDc2dNVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIzWmxjbUZuWlRvZ2QybGtkR2hQZFhRZ0tpQm9aV2xuYUhSSmJseHVJQ0FnSUNBZ0lDQjlMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnhPaUIwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dZMjl5Ym1WeVEyVnNiQzV5YjNjZ0t5QXhMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1kyOXlibVZ5UTJWc2JDNWpiMnhjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOTJaWEpoWjJVNklIZHBaSFJvU1c0Z0tpQm9aV2xuYUhSUGRYUmNiaUFnSUNBZ0lDQWdmU3dnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjVG9nZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeWIzYzZJR052Y201bGNrTmxiR3d1Y205M0lDc2dNU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklHTnZjbTVsY2tObGJHd3VZMjlzSUNzZ01WeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaFBkWFFnS2lCb1pXbG5hSFJQZFhSY2JpQWdJQ0FnSUNBZ2ZWMDdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjMjVoY0ZSdklEMGdjWFZoWkhKaGJuUnpYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmpaV3hzSUhOb2IzVnNaQ0JpWlNCdmJpQjBhR1VnYkdGNWIzVjBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVptbHNkR1Z5S0NoeGRXRmtjbUZ1ZENrZ1BUNGdkVzVrWldacGJtVmtJQ0U5UFNCeGRXRmtjbUZ1ZEM1eEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1kyVnNiQ0J6YUc5MWJHUWdZbVVnYm05MElHRnNjbVZoWkhrZ2RHRnJaVzRnWlhoalpYQjBJR0o1SUdsMGMyVnNabHh1SUNBZ0lDQWdJQ0FnSUNBZ0xtWnBiSFJsY2lnb2NYVmhaSEpoYm5RcElEMCtJQ2hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J1ZFd4c0lDRTlQU0JrYVdVZ0ppWWdkR2hwY3k1ZlkyOXZjbVJwYm1GMFpYTlViMDUxYldKbGNpaGthV1V1WTI5dmNtUnBibUYwWlhNcElEMDlQU0J4ZFdGa2NtRnVkQzV4S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUh4OElIUm9hWE11WDJObGJHeEpjMFZ0Y0hSNUtIRjFZV1J5WVc1MExuRXNJRjlrYVdObExtZGxkQ2gwYUdsektTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmpaV3hzSUhOb2IzVnNaQ0JpWlNCamIzWmxjbVZrSUdKNUlIUm9aU0JrYVdVZ2RHaGxJRzF2YzNSY2JpQWdJQ0FnSUNBZ0lDQWdJQzV5WldSMVkyVW9YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdLRzFoZUZFc0lIRjFZV1J5WVc1MEtTQTlQaUJ4ZFdGa2NtRnVkQzVqYjNabGNtRm5aU0ErSUcxaGVGRXVZMjkyWlhKaFoyVWdQeUJ4ZFdGa2NtRnVkQ0E2SUcxaGVGRXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlM0U2SUhWdVpHVm1hVzVsWkN3Z1kyOTJaWEpoWjJVNklDMHhmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0tUdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJQ0U5UFNCemJtRndWRzh1Y1NBL0lIUm9hWE11WDI1MWJXSmxjbFJ2UTI5dmNtUnBibUYwWlhNb2MyNWhjRlJ2TG5FcElEb2diblZzYkR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCSFpYUWdkR2hsSUdScFpTQmhkQ0J3YjJsdWRDQW9lQ3dnZVNrN1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFCdmFXNTBmU0J3YjJsdWRDQXRJRlJvWlNCd2IybHVkQ0JwYmlBb2VDd2dlU2tnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQkVhV1Y4Ym5Wc2JIMGdWR2hsSUdScFpTQjFibVJsY2lCamIyOXlaR2x1WVhSbGN5QW9lQ3dnZVNrZ2IzSWdiblZzYkNCcFppQnVieUJrYVdWY2JpQWdJQ0FnS2lCcGN5QmhkQ0IwYUdVZ2NHOXBiblF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwUVhRb2NHOXBiblFnUFNCN2VEb2dNQ3dnZVRvZ01IMHBJSHRjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWDJScFkyVXVaMlYwS0hSb2FYTXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCa2FXVXVZMjl2Y21ScGJtRjBaWE03WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIaEdhWFFnUFNCNElEdzlJSEJ2YVc1MExuZ2dKaVlnY0c5cGJuUXVlQ0E4UFNCNElDc2dkR2hwY3k1a2FXVlRhWHBsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2VVWnBkQ0E5SUhrZ1BEMGdjRzlwYm5RdWVTQW1KaUJ3YjJsdWRDNTVJRHc5SUhrZ0t5QjBhR2x6TG1ScFpWTnBlbVU3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoNFJtbDBJQ1ltSUhsR2FYUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdaR2xsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHdzdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMkZzWTNWc1lYUmxJSFJvWlNCbmNtbGtJSE5wZW1VZ1oybDJaVzRnZDJsa2RHZ2dZVzVrSUdobGFXZG9kQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQjNhV1IwYUNBdElGUm9aU0J0YVc1cGJXRnNJSGRwWkhSb1hHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdobGFXZG9kQ0F0SUZSb1pTQnRhVzVwYldGc0lHaGxhV2RvZEZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMkZzWTNWc1lYUmxSM0pwWkNoM2FXUjBhQ3dnYUdWcFoyaDBLU0I3WEc0Z0lDQWdJQ0FnSUY5amIyeHpMbk5sZENoMGFHbHpMQ0JOWVhSb0xtWnNiMjl5S0hkcFpIUm9JQzhnZEdocGN5NWthV1ZUYVhwbEtTazdYRzRnSUNBZ0lDQWdJRjl5YjNkekxuTmxkQ2gwYUdsekxDQk5ZWFJvTG1ac2IyOXlLR2hsYVdkb2RDQXZJSFJvYVhNdVpHbGxVMmw2WlNrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQW9jbTkzTENCamIyd3BJR05sYkd3Z2RHOGdLSGdzSUhrcElHTnZiM0prYVc1aGRHVnpMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFBZbXBsWTNSOUlHTmxiR3dnTFNCVWFHVWdZMlZzYkNCMGJ5QmpiMjUyWlhKMElIUnZJR052YjNKa2FXNWhkR1Z6WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJqYjI5eVpHbHVZWFJsY3k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWld4c1ZHOURiMjl5WkhNb2UzSnZkeXdnWTI5c2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdlM2c2SUdOdmJDQXFJSFJvYVhNdVpHbGxVMmw2WlN3Z2VUb2djbTkzSUNvZ2RHaHBjeTVrYVdWVGFYcGxmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjI1MlpYSjBJQ2g0TENCNUtTQmpiMjl5WkdsdVlYUmxjeUIwYnlCaElDaHliM2NzSUdOdmJDa2dZMlZzYkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JqYjI5eVpHbHVZWFJsY3lBdElGUm9aU0JqYjI5eVpHbHVZWFJsY3lCMGJ5QmpiMjUyWlhKMElIUnZJR0VnWTJWc2JDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklHTmxiR3hjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpiMjl5WkhOVWIwTmxiR3dvZTNnc0lIbDlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUUxaGRHZ3VkSEoxYm1Nb2VTQXZJSFJvYVhNdVpHbGxVMmw2WlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklFMWhkR2d1ZEhKMWJtTW9lQ0F2SUhSb2FYTXVaR2xsVTJsNlpTbGNiaUFnSUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UwZHlhV1JNWVhsdmRYUjlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnc0lESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkFiVzlrZFd4bElHMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dUlDb3ZYRzVjYmk4cVhHNGdLaUJEYjI1MlpYSjBJR0Z1SUVoVVRVd2dZWFIwY21saWRYUmxJSFJ2SUdGdUlHbHVjM1JoYm1ObEozTWdjSEp2Y0dWeWRIa3VJRnh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVZVzFsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc1aGJXVmNiaUFxSUVCeVpYUjFjbTRnZTFOMGNtbHVaMzBnVkdobElHTnZjbkpsYzNCdmJtUnBibWNnY0hKdmNHVnlkSGtuY3lCdVlXMWxMaUJHYjNJZ1pYaGhiWEJzWlN3Z1hDSnRlUzFoZEhSeVhDSmNiaUFxSUhkcGJHd2dZbVVnWTI5dWRtVnlkR1ZrSUhSdklGd2liWGxCZEhSeVhDSXNJR0Z1WkNCY0ltUnBjMkZpYkdWa1hDSWdkRzhnWENKa2FYTmhZbXhsWkZ3aUxseHVJQ292WEc1amIyNXpkQ0JoZEhSeWFXSjFkR1V5Y0hKdmNHVnlkSGtnUFNBb2JtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRnRtYVhKemRDd2dMaTR1Y21WemRGMGdQU0J1WVcxbExuTndiR2wwS0Z3aUxWd2lLVHRjYmlBZ0lDQnlaWFIxY200Z1ptbHljM1FnS3lCeVpYTjBMbTFoY0NoM2IzSmtJRDArSUhkdmNtUXVjMnhwWTJVb01Dd2dNU2t1ZEc5VmNIQmxja05oYzJVb0tTQXJJSGR2Y21RdWMyeHBZMlVvTVNrcExtcHZhVzRvS1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVFdsNGFXNGdlMEJzYVc1cklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdkRzhnWVNCamJHRnpjeTVjYmlBcVhHNGdLaUJBY0dGeVlXMGdleXA5SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYZ2dhVzUwYnk1Y2JpQXFJRUJ5WlhSMWNtNGdlMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnVkdobElHMXBlR1ZrTFdsdUlHTnNZWE56WEc0Z0tpOWNibU52Ym5OMElGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5QTlJQ2hUZFhBcElEMCtYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dUV2w0YVc0Z2RHOGdiV0ZyWlNCaGJHd2dZWFIwY21saWRYUmxjeUJ2YmlCaElHTjFjM1J2YlNCSVZFMU1SV3hsYldWdWRDQnlaV0ZrTFc5dWJIa2dhVzRnZEdobElITmxibk5sWEc0Z0lDQWdJQ29nZEdoaGRDQjNhR1Z1SUhSb1pTQmhkSFJ5YVdKMWRHVWdaMlYwY3lCaElHNWxkeUIyWVd4MVpTQjBhR0YwSUdScFptWmxjbk1nWm5KdmJTQjBhR1VnZG1Gc2RXVWdiMllnZEdobFhHNGdJQ0FnSUNvZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ3Y205d1pYSjBlU3dnYVhRZ2FYTWdjbVZ6WlhRZ2RHOGdkR2hoZENCd2NtOXdaWEowZVNkeklIWmhiSFZsTGlCVWFHVmNiaUFnSUNBZ0tpQmhjM04xYlhCMGFXOXVJR2x6SUhSb1lYUWdZWFIwY21saWRYUmxJRndpYlhrdFlYUjBjbWxpZFhSbFhDSWdZMjl5Y21WemNHOXVaSE1nZDJsMGFDQndjbTl3WlhKMGVTQmNJblJvYVhNdWJYbEJkSFJ5YVdKMWRHVmNJaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMnhoYzNOOUlGTjFjQ0F0SUZSb1pTQmpiR0Z6Y3lCMGJ5QnRhWGhwYmlCMGFHbHpJRkpsWVdSUGJteDVRWFIwY21saWRYUmxjeTVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRTWldGa1QyNXNlVUYwZEhKcFluVjBaWE45SUZSb1pTQnRhWGhsWkNCcGJpQmpiR0Z6Y3k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCdGFYaHBibHh1SUNBZ0lDQXFJRUJoYkdsaGN5QlNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTmNiaUFnSUNBZ0tpOWNiaUFnSUNCamJHRnpjeUJsZUhSbGJtUnpJRk4xY0NCN1hHNWNiaUFnSUNBZ0lDQWdMeW9xWEc0Z0lDQWdJQ0FnSUNBcUlFTmhiR3hpWVdOcklIUm9ZWFFnYVhNZ1pYaGxZM1YwWldRZ2QyaGxiaUJoYmlCdlluTmxjblpsWkNCaGRIUnlhV0oxZEdVbmN5QjJZV3gxWlNCcGMxeHVJQ0FnSUNBZ0lDQWdLaUJqYUdGdVoyVmtMaUJKWmlCMGFHVWdTRlJOVEVWc1pXMWxiblFnYVhNZ1kyOXVibVZqZEdWa0lIUnZJSFJvWlNCRVQwMHNJSFJvWlNCaGRIUnlhV0oxZEdWY2JpQWdJQ0FnSUNBZ0lDb2dkbUZzZFdVZ1kyRnVJRzl1YkhrZ1ltVWdjMlYwSUhSdklIUm9aU0JqYjNKeVpYTndiMjVrYVc1bklFaFVUVXhGYkdWdFpXNTBKM01nY0hKdmNHVnlkSGt1WEc0Z0lDQWdJQ0FnSUNBcUlFbHVJR1ZtWm1WamRDd2dkR2hwY3lCdFlXdGxjeUIwYUdseklFaFVUVXhGYkdWdFpXNTBKM01nWVhSMGNtbGlkWFJsY3lCeVpXRmtMVzl1YkhrdVhHNGdJQ0FnSUNBZ0lDQXFYRzRnSUNBZ0lDQWdJQ0FxSUVadmNpQmxlR0Z0Y0d4bExDQnBaaUJoYmlCSVZFMU1SV3hsYldWdWRDQm9ZWE1nWVc0Z1lYUjBjbWxpZFhSbElGd2llRndpSUdGdVpGeHVJQ0FnSUNBZ0lDQWdLaUJqYjNKeVpYTndiMjVrYVc1bklIQnliM0JsY25SNUlGd2llRndpTENCMGFHVnVJR05vWVc1bmFXNW5JSFJvWlNCMllXeDFaU0JjSW5oY0lpQjBieUJjSWpWY0lseHVJQ0FnSUNBZ0lDQWdLaUIzYVd4c0lHOXViSGtnZDI5eWF5QjNhR1Z1SUdCMGFHbHpMbmdnUFQwOUlEVmdMbHh1SUNBZ0lDQWdJQ0FnS2x4dUlDQWdJQ0FnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JtRnRaU0F0SUZSb1pTQmhkSFJ5YVdKMWRHVW5jeUJ1WVcxbExseHVJQ0FnSUNBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdiMnhrVm1Gc2RXVWdMU0JVYUdVZ1lYUjBjbWxpZFhSbEozTWdiMnhrSUhaaGJIVmxMbHh1SUNBZ0lDQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnYm1WM1ZtRnNkV1VnTFNCVWFHVWdZWFIwY21saWRYUmxKM01nYm1WM0lIWmhiSFZsTGx4dUlDQWdJQ0FnSUNBZ0tpOWNiaUFnSUNBZ0lDQWdZWFIwY21saWRYUmxRMmhoYm1kbFpFTmhiR3hpWVdOcktHNWhiV1VzSUc5c1pGWmhiSFZsTENCdVpYZFdZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1FXeHNJR0YwZEhKcFluVjBaWE1nWVhKbElHMWhaR1VnY21WaFpDMXZibXg1SUhSdklIQnlaWFpsYm5RZ1kyaGxZWFJwYm1jZ1lua2dZMmhoYm1kcGJtZGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklIUm9aU0JoZEhSeWFXSjFkR1VnZG1Gc2RXVnpMaUJQWmlCamIzVnljMlVzSUhSb2FYTWdhWE1nWW5rZ2JtOWNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHZDFZWEpoYm5SbFpTQjBhR0YwSUhWelpYSnpJSGRwYkd3Z2JtOTBJR05vWldGMElHbHVJR0VnWkdsbVptVnlaVzUwSUhkaGVTNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJ5YjNCbGNuUjVJRDBnWVhSMGNtbGlkWFJsTW5CeWIzQmxjblI1S0c1aGJXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdVkyOXVibVZqZEdWa0lDWW1JRzVsZDFaaGJIVmxJQ0U5UFNCZ0pIdDBhR2x6VzNCeWIzQmxjblI1WFgxZ0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9ibUZ0WlN3Z2RHaHBjMXR3Y205d1pYSjBlVjBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtTnZibk4wSUZaaGJHbGtZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtHMXpaeWtnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWh0YzJjcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWbUZzYVdSaGRHbHZia1Z5Y205eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMVpoYkdsa1lYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRjkyWVd4MVpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZlpHVm1ZWFZzZEZaaGJIVmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWxjbkp2Y25NZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNWpiMjV6ZENCVWVYQmxWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk1nUFNCYlhYMHBJSHRjYmlBZ0lDQWdJQ0FnWDNaaGJIVmxMbk5sZENoMGFHbHpMQ0IyWVd4MVpTazdYRzRnSUNBZ0lDQWdJRjlrWldaaGRXeDBWbUZzZFdVdWMyVjBLSFJvYVhNc0lHUmxabUYxYkhSV1lXeDFaU2s3WEc0Z0lDQWdJQ0FnSUY5bGNuSnZjbk11YzJWMEtIUm9hWE1zSUdWeWNtOXljeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUc5eWFXZHBiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5MllXeDFaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUhaaGJIVmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXBjMVpoYkdsa0lEOGdkR2hwY3k1dmNtbG5hVzRnT2lCZlpHVm1ZWFZzZEZaaGJIVmxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQm5aWFFnWlhKeWIzSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJWeWNtOXljeTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUdselZtRnNhV1FvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBd0lENDlJSFJvYVhNdVpYSnliM0p6TG14bGJtZDBhRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmtaV1poZFd4MFZHOG9ibVYzUkdWbVlYVnNkQ2tnZTF4dUlDQWdJQ0FnSUNCZlpHVm1ZWFZzZEZaaGJIVmxMbk5sZENoMGFHbHpMQ0J1WlhkRVpXWmhkV3gwS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1gyTm9aV05yS0h0d2NtVmthV05oZEdVc0lHSnBibVJXWVhKcFlXSnNaWE1nUFNCYlhTd2dSWEp5YjNKVWVYQmxJRDBnVm1Gc2FXUmhkR2x2YmtWeWNtOXlmU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J3Y205d2IzTnBkR2x2YmlBOUlIQnlaV1JwWTJGMFpTNWhjSEJzZVNoMGFHbHpMQ0JpYVc1a1ZtRnlhV0ZpYkdWektUdGNiaUFnSUNBZ0lDQWdhV1lnS0NGd2NtOXdiM05wZEdsdmJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWlhKeWIzSWdQU0J1WlhjZ1JYSnliM0pVZVhCbEtIUm9hWE11ZG1Gc2RXVXNJR0pwYm1SV1lYSnBZV0pzWlhNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk5amIyNXpiMnhsTG5kaGNtNG9aWEp5YjNJdWRHOVRkSEpwYm1jb0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbVZ5Y205eWN5NXdkWE5vS0dWeWNtOXlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkhsd1pWWmhiR2xrWVhSdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRXWVd4cFpHRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMVpoYkdsa1lYUnBiMjVGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCUVlYSnpaVVZ5Y205eUlEMGdZMnhoYzNNZ1pYaDBaVzVrY3lCV1lXeHBaR0YwYVc5dVJYSnliM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxelp5a2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaHRjMmNwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1VHRnljMlZGY25KdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRXWVd4cFpHRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMVpoYkdsa1lYUnBiMjVGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCSmJuWmhiR2xrVkhsd1pVVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJXWVd4cFpHRjBhVzl1UlhKeWIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLRzF6WnlrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lodGMyY3BPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnU1c1MllXeHBaRlI1Y0dWRmNuSnZjbHh1ZlR0Y2JpSXNJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dWFXMXdiM0owSUh0VWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlVZVhCbFZtRnNhV1JoZEc5eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFCaGNuTmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDFCaGNuTmxSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3U1c1MllXeHBaRlI1Y0dWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZTVzUyWVd4cFpGUjVjR1ZGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCSlRsUkZSMFZTWDBSRlJrRlZURlJmVmtGTVZVVWdQU0F3TzF4dVkyOXVjM1FnU1c1MFpXZGxjbFI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUVsT1ZFVkhSVkpmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pHVm1ZWFZzZEZaaGJIVmxJRDBnU1U1VVJVZEZVbDlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjbk1nUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb1RuVnRZbVZ5TG1selNXNTBaV2RsY2locGJuQjFkQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdhVzV3ZFhRN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9YQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUdsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCd1lYSnpaV1JXWVd4MVpTQTlJSEJoY25ObFNXNTBLR2x1Y0hWMExDQXhNQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvVG5WdFltVnlMbWx6U1c1MFpXZGxjaWh3WVhKelpXUldZV3gxWlNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjJZV3gxWlNBOUlIQmhjbk5sWkZaaGJIVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnVUdGeWMyVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUVsdWRtRnNhV1JVZVhCbFJYSnliM0lvYVc1d2RYUXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lITjFjR1Z5S0h0MllXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbExDQmxjbkp2Y25OOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCc1lYSm5aWEpVYUdGdUtHNHBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0c0cElEMCtJSFJvYVhNdWIzSnBaMmx1SUQ0OUlHNHNYRzRnSUNBZ0lDQWdJQ0FnSUNCaWFXNWtWbUZ5YVdGaWJHVnpPaUJiYmwxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyMWhiR3hsY2xSb1lXNG9iaWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb2Jpa2dQVDRnZEdocGN5NXZjbWxuYVc0Z1BEMGdiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnBibVJXWVhKcFlXSnNaWE02SUZ0dVhWeHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmlaWFIzWldWdUtHNHNJRzBwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tHNHNJRzBwSUQwK0lIUm9hWE11YkdGeVoyVnlWR2hoYmlodUtTQW1KaUIwYUdsekxuTnRZV3hzWlhKVWFHRnVLRzBwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZbWx1WkZaaGNtbGhZbXhsY3pvZ1cyNHNJRzFkWEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0SmJuWmhiR2xrVkhsd1pVVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlKYm5aaGJHbGtWSGx3WlVWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZJRDBnWENKY0lqdGNibU52Ym5OMElGTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmtaV1poZFd4MFZtRnNkV1VnUFNCVFZGSkpUa2RmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYSnliM0p6SUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2ljM1J5YVc1blhDSWdQVDA5SUhSNWNHVnZaaUJwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2JtOTBSVzF3ZEhrb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5amFHVmpheWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndjbVZrYVdOaGRHVTZJQ2dwSUQwK0lGd2lYQ0lnSVQwOUlIUm9hWE11YjNKcFoybHVYRzRnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1UzUnlhVzVuVkhsd1pWWmhiR2xrWVhSdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzR2TDJsdGNHOXlkQ0I3VUdGeWMyVkZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2VUdGeWMyVkZjbkp2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRKYm5aaGJHbGtWSGx3WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVZ1BTQmNJbUpzWVdOclhDSTdYRzVqYjI1emRDQkRiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFTlBURTlTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUmxabUYxYkhSV1lXeDFaU0E5SUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNtOXljeUE5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoY0luTjBjbWx1WjF3aUlEMDlQU0IwZVhCbGIyWWdhVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnYVc1d2RYUTdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnU1c1MllXeHBaRlI1Y0dWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2MzVndaWElvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5YzMwcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFSNWNHVldZV3hwWkdGMGIzSjlJR1p5YjIwZ1hDSXVMMVI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3VUdGeWMyVkZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2VUdGeWMyVkZjbkp2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRKYm5aaGJHbGtWSGx3WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVKUFQweEZRVTVmUkVWR1FWVk1WRjlXUVV4VlJTQTlJR1poYkhObE8xeHVZMjl1YzNRZ1FtOXZiR1ZoYmxSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFSlBUMHhGUVU1ZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1FrOVBURVZCVGw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y25NZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9hVzV3ZFhRZ2FXNXpkR0Z1WTJWdlppQkNiMjlzWldGdUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaU0E5SUdsdWNIVjBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0Z3aWMzUnlhVzVuWENJZ1BUMDlJSFI1Y0dWdlppQnBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDOTBjblZsTDJrdWRHVnpkQ2hwYm5CMWRDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0M5bVlXeHpaUzlwTG5SbGMzUW9hVzV3ZFhRcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkbUZzZFdVZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaWEp5YjNKekxuQjFjMmdvYm1WM0lGQmhjbk5sUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Z5Y205eWN5NXdkWE5vS0c1bGR5QkpiblpoYkdsa1ZIbHdaVVZ5Y205eUtHbHVjSFYwS1NrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaDdkbUZzZFdVc0lHUmxabUYxYkhSV1lXeDFaU3dnWlhKeWIzSnpmU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhWE5VY25WbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvS1NBOVBpQjBjblZsSUQwOVBTQjBhR2x6TG05eWFXZHBibHh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwYzBaaGJITmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb0tTQTlQaUJtWVd4elpTQTlQVDBnZEdocGN5NXZjbWxuYVc1Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEpiblJsWjJWeVZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2U1c1MFpXZGxjbFI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3VTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y24wZ1puSnZiU0JjSWk0dlUzUnlhVzVuVkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0RGIyeHZjbFI1Y0dWV1lXeHBaR0YwYjNKOUlHWnliMjBnWENJdUwwTnZiRzl5Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0Q2IyOXNaV0Z1Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZRbTl2YkdWaGJsUjVjR1ZXWVd4cFpHRjBiM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR0p2YjJ4bFlXNG9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZMjlzYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QkRiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSW9hVzV3ZFhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdsdWRHVm5aWElvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCSmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpaHBibkIxZENrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzNSeWFXNW5LR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnVTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc1OU8xeHVYRzVqYjI1emRDQldZV3hwWkdGMGIzSlRhVzVuYkdWMGIyNGdQU0J1WlhjZ1ZtRnNhV1JoZEc5eUtDazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWbUZzYVdSaGRHOXlVMmx1WjJ4bGRHOXVJR0Z6SUhaaGJHbGtZWFJsWEc1OU8xeHVJaXdpTHlvcVhHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGdzSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5OXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzMwZ1puSnZiU0JjSWk0dmJXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6TG1welhDSTdYRzVwYlhCdmNuUWdlM1poYkdsa1lYUmxmU0JtY205dElGd2lMaTkyWVd4cFpHRjBaUzkyWVd4cFpHRjBaUzVxYzF3aU8xeHVYRzVqYjI1emRDQlVRVWRmVGtGTlJTQTlJRndpZEc5d0xXUnBaVndpTzF4dVhHNWpiMjV6ZENCRFNWSkRURVZmUkVWSFVrVkZVeUE5SURNMk1Ec2dMeThnWkdWbmNtVmxjMXh1WTI5dWMzUWdUbFZOUWtWU1gwOUdYMUJKVUZNZ1BTQTJPeUF2THlCRVpXWmhkV3gwSUM4Z2NtVm5kV3hoY2lCemFYZ2djMmxrWldRZ1pHbGxJR2hoY3lBMklIQnBjSE1nYldGNGFXMTFiUzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZRMDlNVDFJZ1BTQmNJa2wyYjNKNVhDSTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxZ2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVpJRDBnTURzZ0x5OGdjSGhjYm1OdmJuTjBJRVJGUmtGVlRGUmZVazlVUVZSSlQwNGdQU0F3T3lBdkx5QmtaV2R5WldWelhHNWpiMjV6ZENCRVJVWkJWVXhVWDA5UVFVTkpWRmtnUFNBd0xqVTdYRzVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRWhGVEVSZlFsbGZRVlJVVWtsQ1ZWUkZJRDBnWENKb1pXeGtMV0o1WENJN1hHNWpiMjV6ZENCUVNWQlRYMEZVVkZKSlFsVlVSU0E5SUZ3aWNHbHdjMXdpTzF4dVkyOXVjM1FnVWs5VVFWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSnliM1JoZEdsdmJsd2lPMXh1WTI5dWMzUWdXRjlCVkZSU1NVSlZWRVVnUFNCY0luaGNJanRjYm1OdmJuTjBJRmxmUVZSVVVrbENWVlJGSUQwZ1hDSjVYQ0k3WEc1Y2JtTnZibk4wSUVKQlUwVmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUE5SURFMU95QXZMeUJ3ZUZ4dVkyOXVjM1FnUWtGVFJWOVRWRkpQUzBWZlYwbEVWRWdnUFNBeUxqVTdJQzh2SUhCNFhHNWpiMjV6ZENCTlNVNWZVMVJTVDB0RlgxZEpSRlJJSUQwZ01Uc2dMeThnY0hoY2JtTnZibk4wSUVoQlRFWWdQU0JDUVZORlgwUkpSVjlUU1ZwRklDOGdNanNnTHk4Z2NIaGNibU52Ym5OMElGUklTVkpFSUQwZ1FrRlRSVjlFU1VWZlUwbGFSU0F2SURNN0lDOHZJSEI0WEc1amIyNXpkQ0JRU1ZCZlUwbGFSU0E5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF4TlRzZ0x5OXdlRnh1WTI5dWMzUWdVRWxRWDBOUFRFOVNJRDBnWENKaWJHRmphMXdpTzF4dVhHNWpiMjV6ZENCa1pXY3ljbUZrSUQwZ0tHUmxaeWtnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUJrWldjZ0tpQW9UV0YwYUM1UVNTQXZJREU0TUNrN1hHNTlPMXh1WEc1amIyNXpkQ0JwYzFCcGNFNTFiV0psY2lBOUlHNGdQVDRnZTF4dUlDQWdJR052Ym5OMElHNTFiV0psY2lBOUlIQmhjbk5sU1c1MEtHNHNJREV3S1R0Y2JpQWdJQ0J5WlhSMWNtNGdUblZ0WW1WeUxtbHpTVzUwWldkbGNpaHVkVzFpWlhJcElDWW1JREVnUEQwZ2JuVnRZbVZ5SUNZbUlHNTFiV0psY2lBOFBTQk9WVTFDUlZKZlQwWmZVRWxRVXp0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUjJWdVpYSmhkR1VnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzltSUhCcGNITWdZbVYwZDJWbGJpQXhJR0Z1WkNCMGFHVWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UwNTFiV0psY24wZ1FTQnlZVzVrYjIwZ2JuVnRZbVZ5SUc0c0lERWc0b21rSUc0ZzRvbWtJRTVWVFVKRlVsOVBSbDlRU1ZCVExseHVJQ292WEc1amIyNXpkQ0J5WVc1a2IyMVFhWEJ6SUQwZ0tDa2dQVDRnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nVGxWTlFrVlNYMDlHWDFCSlVGTXBJQ3NnTVR0Y2JseHVZMjl1YzNRZ1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVeUE5SUZ0Y0l1S2FnRndpTEZ3aTRwcUJYQ0lzWENMaW1vSmNJaXhjSXVLYWcxd2lMRndpNHBxRVhDSXNYQ0xpbW9WY0lsMDdYRzVjYmk4cUtseHVJQ29nUTI5dWRtVnlkQ0JoSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR1JwWlNCbVlXTmxJSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3Y3lCdlpseHVJQ29nZEdoaGRDQnpZVzFsSUdScFpTNGdWR2hwY3lCbWRXNWpkR2x2YmlCcGN5QjBhR1VnY21WMlpYSnpaU0J2WmlCd2FYQnpWRzlWYm1samIyUmxMbHh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQjFJQzBnVkdobElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlIUnZJR052Ym5abGNuUWdkRzhnY0dsd2N5NWNiaUFxSUVCeVpYUjFjbTV6SUh0T2RXMWlaWEo4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaXdnYjNKY2JpQXFJSFZ1WkdWbWFXNWxaQ0JwWmlCMUlIZGhjeUJ1YjNRZ1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpQnlaWEJ5WlhObGJuUnBibWNnWVNCa2FXVXVYRzRnS2k5Y2JtTnZibk4wSUhWdWFXTnZaR1ZVYjFCcGNITWdQU0FvZFNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUdScFpVTm9ZWEpKYm1SbGVDQTlJRVJKUlY5VlRrbERUMFJGWDBOSVFWSkJRMVJGVWxNdWFXNWtaWGhQWmloMUtUdGNiaUFnSUNCeVpYUjFjbTRnTUNBOFBTQmthV1ZEYUdGeVNXNWtaWGdnUHlCa2FXVkRhR0Z5U1c1a1pYZ2dLeUF4SURvZ2RXNWtaV1pwYm1Wa08xeHVmVHRjYmx4dUx5b3FYRzRnS2lCRGIyNTJaWEowSUdFZ2JuVnRZbVZ5SUc5bUlIQnBjSE1zSURFZzRvbWtJSEJwY0hNZzRvbWtJRFlnZEc4Z1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNseHVJQ29nY21Wd2NtVnpaVzUwWVhScGIyNGdiMllnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnWkdsbElHWmhZMlV1SUZSb2FYTWdablZ1WTNScGIyNGdhWE1nZEdobElISmxkbVZ5YzJWY2JpQXFJRzltSUhWdWFXTnZaR1ZVYjFCcGNITXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlIQWdMU0JVYUdVZ2JuVnRZbVZ5SUc5bUlIQnBjSE1nZEc4Z1kyOXVkbVZ5ZENCMGJ5QmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlMbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UxTjBjbWx1WjN4MWJtUmxabWx1WldSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIVnVhV052WkdVZ1kyaGhjbUZqZEdWeWN5QnZjbHh1SUNvZ2RXNWtaV1pwYm1Wa0lHbG1JSEFnZDJGeklHNXZkQ0JpWlhSM1pXVnVJREVnWVc1a0lEWWdhVzVqYkhWemFYWmxMbHh1SUNvdlhHNWpiMjV6ZENCd2FYQnpWRzlWYm1samIyUmxJRDBnY0NBOVBpQnBjMUJwY0U1MWJXSmxjaWh3S1NBL0lFUkpSVjlWVGtsRFQwUkZYME5JUVZKQlExUkZVbE5iY0NBdElERmRJRG9nZFc1a1pXWnBibVZrTzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpJYjJ4a0lEMGdLR052Ym5SbGVIUXNJSGdzSUhrc0lIZHBaSFJvTENCamIyeHZjaWtnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRk5GVUVWU1FWUlBVaUE5SUhkcFpIUm9JQzhnTXpBN1hHNGdJQ0FnWTI5dWRHVjRkQzV6WVhabEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bmJHOWlZV3hCYkhCb1lTQTlJRVJGUmtGVlRGUmZUMUJCUTBsVVdUdGNiaUFnSUNCamIyNTBaWGgwTG1KbFoybHVVR0YwYUNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Wm1sc2JGTjBlV3hsSUQwZ1kyOXNiM0k3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vZUNBcklIZHBaSFJvTENCNUlDc2dkMmxrZEdnc0lIZHBaSFJvSUMwZ1UwVlFSVkpCVkU5U0xDQXdMQ0F5SUNvZ1RXRjBhQzVRU1N3Z1ptRnNjMlVwTzF4dUlDQWdJR052Ym5SbGVIUXVabWxzYkNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Y21WemRHOXlaU2dwTzF4dWZUdGNibHh1WTI5dWMzUWdjbVZ1WkdWeVJHbGxJRDBnS0dOdmJuUmxlSFFzSUhnc0lIa3NJSGRwWkhSb0xDQmpiMnh2Y2lrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUZORFFVeEZJRDBnS0hkcFpIUm9JQzhnU0VGTVJpazdYRzRnSUNBZ1kyOXVjM1FnU0VGTVJsOUpUazVGVWw5VFNWcEZJRDBnVFdGMGFDNXpjWEowS0hkcFpIUm9JQ29xSURJZ0x5QXlLVHRjYmlBZ0lDQmpiMjV6ZENCSlRrNUZVbDlUU1ZwRklEMGdNaUFxSUVoQlRFWmZTVTVPUlZKZlUwbGFSVHRjYmlBZ0lDQmpiMjV6ZENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdQU0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUFxSUZORFFVeEZPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBOUlFbE9Ua1ZTWDFOSldrVWdMU0F5SUNvZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRPMXh1SUNBZ0lHTnZibk4wSUZOVVVrOUxSVjlYU1VSVVNDQTlJRTFoZEdndWJXRjRLRTFKVGw5VFZGSlBTMFZmVjBsRVZFZ3NJRUpCVTBWZlUxUlNUMHRGWDFkSlJGUklJQ29nVTBOQlRFVXBPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJZSUQwZ2VDQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTzF4dUlDQWdJR052Ym5OMElITjBZWEowV1NBOUlIa2dLeUIzYVdSMGFDQXRJRWhCVEVaZlNVNU9SVkpmVTBsYVJUdGNibHh1SUNBZ0lHTnZiblJsZUhRdWMyRjJaU2dwTzF4dUlDQWdJR052Ym5SbGVIUXVZbVZuYVc1UVlYUm9LQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzVTNSNWJHVWdQU0JqYjJ4dmNqdGNiaUFnSUNCamIyNTBaWGgwTG5OMGNtOXJaVk4wZVd4bElEMGdYQ0ppYkdGamExd2lPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVmRwWkhSb0lEMGdVMVJTVDB0RlgxZEpSRlJJTzF4dUlDQWdJR052Ym5SbGVIUXViVzkyWlZSdktITjBZWEowV0N3Z2MzUmhjblJaS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUlDc2dTVTVPUlZKZlUwbGFSVjlTVDFWT1JFVkVMQ0J6ZEdGeWRGa2dLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnWkdWbk1uSmhaQ2d5TnpBcExDQmtaV2N5Y21Ga0tEQXBLVHRjYmlBZ0lDQmpiMjUwWlhoMExteHBibVZVYnloemRHRnlkRmdnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeWs3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFTENCemRHRnlkRmtnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3dLU3dnWkdWbk1uSmhaQ2c1TUNrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1YkdsdVpWUnZLSE4wWVhKMFdDd2djM1JoY25SWklDc2dTVTVPUlZKZlUwbGFSU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1pHVm5NbkpoWkNnNU1Da3NJR1JsWnpKeVlXUW9NVGd3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUlDMGdVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCemRHRnlkRmtnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDd2djM1JoY25SWklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJR1JsWnpKeVlXUW9NVGd3S1N3Z1pHVm5NbkpoWkNneU56QXBLVHRjYmx4dUlDQWdJR052Ym5SbGVIUXVjM1J5YjJ0bEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpRYVhBZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dwSUQwK0lIdGNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtSmxaMmx1VUdGMGFDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiRk4wZVd4bElEMGdVRWxRWDBOUFRFOVNPMXh1SUNBZ0lHTnZiblJsZUhRdWJXOTJaVlJ2S0hnc0lIa3BPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSGdzSUhrc0lIZHBaSFJvTENBd0xDQXlJQ29nVFdGMGFDNVFTU3dnWm1Gc2MyVXBPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiQ2dwTzF4dUlDQWdJR052Ym5SbGVIUXVjbVZ6ZEc5eVpTZ3BPMXh1ZlR0Y2JseHVYRzR2THlCUWNtbDJZWFJsSUhCeWIzQmxjblJwWlhOY2JtTnZibk4wSUY5aWIyRnlaQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJobGJHUkNlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjR2x3Y3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmY205MFlYUnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2dnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2tnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc0dktpcGNiaUFxSUZSdmNFUnBaU0JwY3lCMGFHVWdYQ0owYjNBdFpHbGxYQ0lnWTNWemRHOXRJRnRJVkUxTVhHNGdLaUJsYkdWdFpXNTBYU2hvZEhSd2N6b3ZMMlJsZG1Wc2IzQmxjaTV0YjNwcGJHeGhMbTl5Wnk5bGJpMVZVeTlrYjJOekwxZGxZaTlCVUVrdlNGUk5URVZzWlcxbGJuUXBJSEpsY0hKbGMyVnVkR2x1WnlCaElHUnBaVnh1SUNvZ2IyNGdkR2hsSUdScFkyVWdZbTloY21RdVhHNGdLbHh1SUNvZ1FHVjRkR1Z1WkhNZ1NGUk5URVZzWlcxbGJuUmNiaUFxSUVCdGFYaGxjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYmlBcUwxeHVZMjl1YzNRZ1ZHOXdSR2xsSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE1vU0ZSTlRFVnNaVzFsYm5RcElIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCVWIzQkVhV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdXMk52Ym1acFp5QTlJSHQ5WFNBdElGUm9aU0JwYm1sMGFXRnNJR052Ym1acFozVnlZWFJwYjI0Z2IyWWdkR2hsSUdScFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY254dWRXeHNmU0JiWTI5dVptbG5MbkJwY0hOZElDMGdWR2hsSUhCcGNITWdiMllnZEdobElHUnBaU0IwYnlCaFpHUXVYRzRnSUNBZ0lDb2dTV1lnYm04Z2NHbHdjeUJoY21VZ2MzQmxZMmxtYVdWa0lHOXlJSFJvWlNCd2FYQnpJR0Z5WlNCdWIzUWdZbVYwZDJWbGJpQXhJR0Z1WkNBMkxDQmhJSEpoYm1SdmJWeHVJQ0FnSUNBcUlHNTFiV0psY2lCaVpYUjNaV1Z1SURFZ1lXNWtJRFlnYVhNZ1oyVnVaWEpoZEdWa0lHbHVjM1JsWVdRdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUZ0amIyNW1hV2N1WTI5c2IzSmRJQzBnVkdobElHTnZiRzl5SUc5bUlIUm9aU0JrYVdVZ2RHOGdZV1JrTGlCRVpXWmhkV3gwWEc0Z0lDQWdJQ29nZEc4Z2RHaGxJR1JsWm1GMWJIUWdZMjlzYjNJdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUZ0amIyNW1hV2N1ZUYwZ0xTQlVhR1VnZUNCamIyOXlaR2x1WVhSbElHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWVWMGdMU0JVYUdVZ2VTQmpiMjl5WkdsdVlYUmxJRzltSUhSb1pTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjbTkwWVhScGIyNWRJQzBnVkdobElISnZkR0YwYVc5dUlHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJRnRqYjI1bWFXY3VhR1ZzWkVKNVhTQXRJRlJvWlNCd2JHRjVaWElnYUc5c1pHbHVaeUIwYUdVZ1pHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHR3YVhCekxDQmpiMnh2Y2l3Z2NtOTBZWFJwYjI0c0lIZ3NJSGtzSUdobGJHUkNlWDBnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEJwY0hOV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1sdWRHVm5aWElvY0dsd2N5QjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdVltVjBkMlZsYmlneExDQTJLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aHlZVzVrYjIxUWFYQnpLQ2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNWNiaUFnSUNBZ0lDQWdYM0JwY0hNdWMyVjBLSFJvYVhNc0lIQnBjSE5XWVd4MVpTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRkJKVUZOZlFWUlVVa2xDVlZSRkxDQndhWEJ6Vm1Gc2RXVXBPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZMjlzYjNJZ1BTQjJZV3hwWkdGMFpTNWpiMnh2Y2loamIyeHZjaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhFUlVaQlZVeFVYME5QVEU5U0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbTkwWVhScGIyNGdQU0IyWVd4cFpHRjBaUzVwYm5SbFoyVnlLSEp2ZEdGMGFXOXVJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0ZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WW1WMGQyVmxiaWd3TENBek5qQXBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVpHVm1ZWFZzZEZSdktFUkZSa0ZWVEZSZlVrOVVRVlJKVDA0cFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NTRJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWg0SUh4OElIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGaGZRVlJVVWtsQ1ZWUkZLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLRVJGUmtGVlRGUmZXQ2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG5rZ1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtIa2dmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvV1Y5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG14aGNtZGxjbFJvWVc0b01DbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1JFVkdRVlZNVkY5WktWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdkbUZzYVdSaGRHVXVjM1J5YVc1bktHaGxiR1JDZVNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaElSVXhFWDBKWlgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJtOTBSVzF3ZEhrb0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnlodWRXeHNLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE4wWVhScFl5Qm5aWFFnYjJKelpYSjJaV1JCZEhSeWFXSjFkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1NFVk1SRjlDV1Y5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JRU1ZCVFgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRmhmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdXVjlCVkZSU1NVSlZWRVZjYmlBZ0lDQWdJQ0FnWFR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0FnSUNBZ1gySnZZWEprTG5ObGRDaDBhR2x6TENCMGFHbHpMbkJoY21WdWRFNXZaR1VwTzF4dUlDQWdJQ0FnSUNCZlltOWhjbVF1WjJWMEtIUm9hWE1wTG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUVWMlpXNTBLRndpZEc5d0xXUnBaVHBoWkdSbFpGd2lLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR2x6WTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnSUNBZ0lGOWliMkZ5WkM1blpYUW9kR2hwY3lrdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQXRaR2xsT25KbGJXOTJaV1JjSWlrcE8xeHVJQ0FnSUNBZ0lDQmZZbTloY21RdWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnZEdocGN5QkVhV1VnZEc4Z2RHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2IyWWdZU0JrYVdVZ1ptRmpaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUdOdmNuSmxjM0J2Ym1ScGJtY2dkRzhnZEdobElHNTFiV0psY2lCdlpseHVJQ0FnSUNBcUlIQnBjSE1nYjJZZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnZEc5VmJtbGpiMlJsS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NHbHdjMVJ2Vlc1cFkyOWtaU2gwYUdsekxuQnBjSE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOeVpXRjBaU0JoSUhOMGNtbHVaeUJ5WlhCeVpYTmxibUYwYVc5dUlHWnZjaUIwYUdseklHUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnYzNsdFltOXNJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUc1MWJXSmxjaUJ2WmlCd2FYQnpYRzRnSUNBZ0lDb2diMllnZEdocGN5QmthV1V1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxuUnZWVzVwWTI5a1pTZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nYm5WdFltVnlJRzltSUhCcGNITXNJREVnNG9ta0lIQnBjSE1nNG9ta0lEWXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCd2FYQnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNCcGNITXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0JqYjJ4dmNpaHVaWGREYjJ4dmNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0E5UFQwZ2JtVjNRMjlzYjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFTlBURTlTWDBGVVZGSkpRbFZVUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmWTI5c2IzSXVjMlYwS0hSb2FYTXNJRVJGUmtGVlRGUmZRMDlNVDFJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJOdmJHOXlMbk5sZENoMGFHbHpMQ0J1WlhkRGIyeHZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVc0lHNWxkME52Ykc5eUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCMGFHRjBJR2x6SUdodmJHUnBibWNnZEdocGN5QkVhV1VzSUdsbUlHRnVlUzRnVG5Wc2JDQnZkR2hsY25kcGMyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeWZHNTFiR3g5SUZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXeGtRbmtvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmFHVnNaRUo1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUdobGJHUkNlU2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnWDJobGJHUkNlUzV6WlhRb2RHaHBjeXdnY0d4aGVXVnlLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlIQnNZWGxsY2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXNJSEJzWVhsbGNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmpiMjl5WkdsdVlYUmxjeUJ2WmlCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHREYjI5eVpHbHVZWFJsYzN4dWRXeHNmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjI5eVpHbHVZWFJsY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnUFQwOUlIUm9hWE11ZUNCOGZDQnVkV3hzSUQwOVBTQjBhR2x6TG5rZ1B5QnVkV3hzSURvZ2UzZzZJSFJvYVhNdWVDd2dlVG9nZEdocGN5NTVmVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJR052YjNKa2FXNWhkR1Z6S0dNcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUdNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVlQ0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JqTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1NElEMGdlRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZVNBOUlIazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJFYjJWeklIUm9hWE1nUkdsbElHaGhkbVVnWTI5dmNtUnBibUYwWlhNL1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0Q2IyOXNaV0Z1ZlNCVWNuVmxJSGRvWlc0Z2RHaGxJRVJwWlNCa2IyVnpJR2hoZG1VZ1kyOXZjbVJwYm1GMFpYTmNiaUFnSUNBZ0tpOWNiaUFnSUNCb1lYTkRiMjl5WkdsdVlYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dJVDA5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE03WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIZ2dZMjl2Y21ScGJtRjBaVnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2VDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjk0TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUhnb2JtVjNXQ2tnZTF4dUlDQWdJQ0FnSUNCZmVDNXpaWFFvZEdocGN5d2dibVYzV0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2llRndpTENCdVpYZFlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2VTQmpiMjl5WkdsdVlYUmxYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCNUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM2t1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnZVNodVpYZFpLU0I3WEc0Z0lDQWdJQ0FnSUY5NUxuTmxkQ2gwYUdsekxDQnVaWGRaS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSjVYQ0lzSUc1bGQxa3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCeWIzUmhkR2x2YmlCdlppQjBhR2x6SUVScFpTNGdNQ0RpaWFRZ2NtOTBZWFJwYjI0ZzRvbWtJRE0yTUM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjhiblZzYkgxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2NtOTBZWFJwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZjbTkwWVhScGIyNHVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCelpYUWdjbTkwWVhScGIyNG9ibVYzVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnYm1WM1Vpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9YQ0p5YjNSaGRHbHZibHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHNXZjbTFoYkdsNlpXUlNiM1JoZEdsdmJpQTlJRzVsZDFJZ0pTQkRTVkpEVEVWZlJFVkhVa1ZGVXp0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl5YjNSaGRHbHZiaTV6WlhRb2RHaHBjeXdnYm05eWJXRnNhWHBsWkZKdmRHRjBhVzl1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRndpY205MFlYUnBiMjVjSWl3Z2JtOXliV0ZzYVhwbFpGSnZkR0YwYVc5dUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvY205M0lIUm9hWE1nUkdsbExpQlVhR1VnYm5WdFltVnlJRzltSUhCcGNITWdkRzhnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzRzSURFZzRvbWtJRzRnNG9ta0lEWXVYRzRnSUNBZ0lDb2dUMjVzZVNCa2FXTmxJSFJvWVhRZ1lYSmxJRzV2ZENCaVpXbHVaeUJvWld4a0lHTmhiaUJpWlNCMGFISnZkMjR1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBWm1seVpYTWdYQ0owYjNBNmRHaHliM2N0WkdsbFhDSWdkMmwwYUNCd1lYSmhiV1YwWlhKeklIUm9hWE1nUkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhSb2NtOTNTWFFvS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doZEdocGN5NXBjMGhsYkdRb0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhKaGJtUnZiVkJwY0hNb0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoUVNWQlRYMEZVVkZKSlFsVlVSU3dnZEdocGN5NXdhWEJ6S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZkR2h5YjNjdFpHbGxYQ0lzSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa1pYUmhhV3c2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsT2lCMGFHbHpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCb2IyeGtjeUIwYUdseklFUnBaUzRnUVNCd2JHRjVaWElnWTJGdUlHOXViSGtnYUc5c1pDQmhJR1JwWlNCMGFHRjBJR2x6SUc1dmRGeHVJQ0FnSUNBcUlHSmxhVzVuSUdobGJHUWdZbmtnWVc1dmRHaGxjaUJ3YkdGNVpYSWdlV1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJR2h2YkdRZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbWh2YkdRdFpHbGxYQ0lnZDJsMGFDQndZWEpoYldWMFpYSnpJSFJvYVhNZ1JHbGxJR0Z1WkNCMGFHVWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdodmJHUkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDRjBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtaGxiR1JDZVNBOUlIQnNZWGxsY2p0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZhRzlzWkMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklIUm9hWE1nUkdsbElHSmxhVzVuSUdobGJHUWdZbmtnWVc1NUlIQnNZWGxsY2o5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBKdmIyeGxZVzU5SUZSeWRXVWdkMmhsYmlCMGFHbHpJRVJwWlNCcGN5QmlaV2x1WnlCb1pXeGtJR0o1SUdGdWVTQndiR0Y1WlhJc0lHWmhiSE5sSUc5MGFHVnlkMmx6WlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JwYzBobGJHUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lDRTlQU0IwYUdsekxtaGxiR1JDZVR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeUlISmxiR1ZoYzJWeklIUm9hWE1nUkdsbExpQkJJSEJzWVhsbGNpQmpZVzRnYjI1c2VTQnlaV3hsWVhObElHUnBZMlVnZEdoaGRDQnphR1VnYVhOY2JpQWdJQ0FnS2lCb2IyeGthVzVuTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJSEpsYkdWaGMyVWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb2dRR1pwY21WeklGd2lkRzl3T25KbGJHRnpaUzFrYVdWY0lpQjNhWFJvSUhCaGNtRnRaWFJsY25NZ2RHaHBjeUJFYVdVZ1lXNWtJSFJvWlNCd2JHRjVaWElnY21Wc1pXRnphVzVuSUdsMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhKbGJHVmhjMlZKZENod2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdWFYTklaV3hrS0NrZ0ppWWdkR2hwY3k1b1pXeGtRbmt1WlhGMVlXeHpLSEJzWVhsbGNpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YUdWc1pFSjVJRDBnYm5Wc2JEdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFaEZURVJmUWxsZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dRM1Z6ZEc5dFJYWmxiblFvWENKMGIzQTZjbVZzWldGelpTMWthV1ZjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklIUm9hWE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnNZWGxsY2x4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGSmxibVJsY2lCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3UTJGdWRtRnpVbVZ1WkdWeWFXNW5RMjl1ZEdWNGRESkVmU0JqYjI1MFpYaDBJQzBnVkdobElHTmhiblpoY3lCamIyNTBaWGgwSUhSdklHUnlZWGRjYmlBZ0lDQWdLaUJ2Ymx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JrYVdWVGFYcGxJQzBnVkdobElITnBlbVVnYjJZZ1lTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI5eVpHbHVZWFJsY3lBOUlIUm9hWE11WTI5dmNtUnBibUYwWlhOZElDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZYRzRnSUNBZ0lDb2daSEpoZHlCMGFHbHpJR1JwWlM0Z1Fua2daR1ZtWVhWc2RDd2dkR2hwY3lCa2FXVWdhWE1nWkhKaGQyNGdZWFFnYVhSeklHOTNiaUJqYjI5eVpHbHVZWFJsY3l4Y2JpQWdJQ0FnS2lCaWRYUWdlVzkxSUdOaGJpQmhiSE52SUdSeVlYY2dhWFFnWld4elpYZG9aWEpsSUdsbUlITnZJRzVsWldSbFpDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCeVpXNWtaWElvWTI5dWRHVjRkQ3dnWkdsbFUybDZaU3dnWTI5dmNtUnBibUYwWlhNZ1BTQjBhR2x6TG1OdmIzSmthVzVoZEdWektTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElITmpZV3hsSUQwZ1pHbGxVMmw2WlNBdklFSkJVMFZmUkVsRlgxTkpXa1U3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRk5JUVV4R0lEMGdTRUZNUmlBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVkVoSlVrUWdQU0JVU0VsU1JDQXFJSE5qWVd4bE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCVFVFbFFYMU5KV2tVZ1BTQlFTVkJmVTBsYVJTQXFJSE5qWVd4bE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaDBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSkliMnhrS0dOdmJuUmxlSFFzSUhnc0lIa3NJRk5JUVV4R0xDQjBhR2x6TG1obGJHUkNlUzVqYjJ4dmNpazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9NQ0FoUFQwZ2RHaHBjeTV5YjNSaGRHbHZiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNTBjbUZ1YzJ4aGRHVW9lQ0FySUZOSVFVeEdMQ0I1SUNzZ1UwaEJURVlwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXliM1JoZEdVb1pHVm5NbkpoWkNoMGFHbHpMbkp2ZEdGMGFXOXVLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuUnlZVzV6YkdGMFpTZ3RNU0FxSUNoNElDc2dVMGhCVEVZcExDQXRNU0FxSUNoNUlDc2dVMGhCVEVZcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGJtUmxja1JwWlNoamIyNTBaWGgwTENCNExDQjVMQ0JUU0VGTVJpd2dkR2hwY3k1amIyeHZjaWs3WEc1Y2JpQWdJQ0FnSUNBZ2MzZHBkR05vSUNoMGFHbHpMbkJwY0hNcElIdGNiaUFnSUNBZ0lDQWdZMkZ6WlNBeE9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURJNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdNem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQTBPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFNFRk1SaXdnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHTmhjMlVnTmpvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5JUVV4R0xDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1ZWFZzZERvZ0x5OGdUbThnYjNSb1pYSWdkbUZzZFdWeklHRnNiRzkzWldRZ0x5QndiM056YVdKc1pWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnWTI5dWRHVjRkRnh1SUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbk5sZEZSeVlXNXpabTl5YlNneExDQXdMQ0F3TENBeExDQXdMQ0F3S1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzUzYVc1a2IzY3VZM1Z6ZEc5dFJXeGxiV1Z1ZEhNdVpHVm1hVzVsS0ZSQlIxOU9RVTFGTENCVWIzQkVhV1VwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBaU3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdVc1hHNGdJQ0FnVkVGSFgwNUJUVVZjYm4wN1hHNGlMQ0l2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ3dnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHREYjI1bWFXZDFjbUYwYVc5dVJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdFNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJR1p5YjIwZ1hDSXVMMjFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5NXFjMXdpTzF4dWFXMXdiM0owSUh0MllXeHBaR0YwWlgwZ1puSnZiU0JjSWk0dmRtRnNhV1JoZEdVdmRtRnNhV1JoZEdVdWFuTmNJanRjYmx4dVkyOXVjM1FnVkVGSFgwNUJUVVVnUFNCY0luUnZjQzF3YkdGNVpYSmNJanRjYmx4dUx5OGdWR2hsSUc1aGJXVnpJRzltSUhSb1pTQW9iMkp6WlhKMlpXUXBJR0YwZEhKcFluVjBaWE1nYjJZZ2RHaGxJRlJ2Y0ZCc1lYbGxjaTVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRTVCVFVWZlFWUlVVa2xDVlZSRklEMGdYQ0p1WVcxbFhDSTdYRzVqYjI1emRDQlRRMDlTUlY5QlZGUlNTVUpWVkVVZ1BTQmNJbk5qYjNKbFhDSTdYRzVqYjI1emRDQklRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVWdQU0JjSW1oaGN5MTBkWEp1WENJN1hHNWNiaTh2SUZSb1pTQndjbWwyWVhSbElIQnliM0JsY25ScFpYTWdiMllnZEdobElGUnZjRkJzWVhsbGNpQmNibU52Ym5OMElGOWpiMnh2Y2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYm1GdFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmMyTnZjbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMmhoYzFSMWNtNGdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVYRzR2S2lwY2JpQXFJRUVnVUd4aGVXVnlJR2x1SUdFZ1pHbGpaU0JuWVcxbExseHVJQ3BjYmlBcUlFRWdjR3hoZVdWeUozTWdibUZ0WlNCemFHOTFiR1FnWW1VZ2RXNXBjWFZsSUdsdUlIUm9aU0JuWVcxbExpQlVkMjhnWkdsbVptVnlaVzUwWEc0Z0tpQlViM0JRYkdGNVpYSWdaV3hsYldWdWRITWdkMmwwYUNCMGFHVWdjMkZ0WlNCdVlXMWxJR0YwZEhKcFluVjBaU0JoY21VZ2RISmxZWFJsWkNCaGMxeHVJQ29nZEdobElITmhiV1VnY0d4aGVXVnlMbHh1SUNwY2JpQXFJRWx1SUdkbGJtVnlZV3dnYVhRZ2FYTWdjbVZqYjIxdFpXNWtaV1FnZEdoaGRDQnVieUIwZDI4Z2NHeGhlV1Z5Y3lCa2J5Qm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMRnh1SUNvZ1lXeDBhRzkxWjJnZ2FYUWdhWE1nYm05MElIVnVZMjl1WTJWcGRtRmliR1VnZEdoaGRDQmpaWEowWVdsdUlHUnBZMlVnWjJGdFpYTWdhR0YyWlNCd2JHRjVaWEp6SUhkdmNtdGNiaUFxSUdsdUlIUmxZVzF6SUhkb1pYSmxJR2wwSUhkdmRXeGtJRzFoYTJVZ2MyVnVjMlVnWm05eUlIUjNieUJ2Y2lCdGIzSmxJR1JwWm1abGNtVnVkQ0J3YkdGNVpYSnpJSFJ2WEc0Z0tpQm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMbHh1SUNwY2JpQXFJRlJvWlNCdVlXMWxJR0Z1WkNCamIyeHZjaUJoZEhSeWFXSjFkR1Z6SUdGeVpTQnlaWEYxYVhKbFpDNGdWR2hsSUhOamIzSmxJR0Z1WkNCb1lYTXRkSFZ5Ymx4dUlDb2dZWFIwY21saWRYUmxjeUJoY21VZ2JtOTBMbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpQkFiV2w0WlhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNGdLaTljYm1OdmJuTjBJRlJ2Y0ZCc1lYbGxjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpLRWhVVFV4RmJHVnRaVzUwS1NCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1VHeGhlV1Z5TENCdmNIUnBiMjVoYkd4NUlHSmhjMlZrSUc5dUlHRnVJR2x1ZEdsMGFXRnNYRzRnSUNBZ0lDb2dZMjl1Wm1sbmRYSmhkR2x2YmlCMmFXRWdZVzRnYjJKcVpXTjBJSEJoY21GdFpYUmxjaUJ2Y2lCa1pXTnNZWEpsWkNCaGRIUnlhV0oxZEdWeklHbHVJRWhVVFV3dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnVzJOdmJtWnBaMTBnTFNCQmJpQnBibWwwYVdGc0lHTnZibVpwWjNWeVlYUnBiMjRnWm05eUlIUm9aVnh1SUNBZ0lDQXFJSEJzWVhsbGNpQjBieUJqY21WaGRHVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHTnZibVpwWnk1amIyeHZjaUF0SUZSb2FYTWdjR3hoZVdWeUozTWdZMjlzYjNJZ2RYTmxaQ0JwYmlCMGFHVWdaMkZ0WlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnWTI5dVptbG5MbTVoYldVZ0xTQlVhR2x6SUhCc1lYbGxjaWR6SUc1aGJXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWMyTnZjbVZkSUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ6WTI5eVpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwSnZiMnhsWVc1OUlGdGpiMjVtYVdjdWFHRnpWSFZ5YmwwZ0xTQlVhR2x6SUhCc1lYbGxjaUJvWVhNZ1lTQjBkWEp1TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0h0amIyeHZjaXdnYm1GdFpTd2djMk52Y21Vc0lHaGhjMVIxY201OUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvS1R0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCamIyeHZjbFpoYkhWbElEMGdkbUZzYVdSaGRHVXVZMjlzYjNJb1kyOXNiM0lnZkh3Z2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1EwOU1UMUpmUVZSVVVrbENWVlJGS1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hqYjJ4dmNsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlqYjJ4dmNpNXpaWFFvZEdocGN5d2dZMjlzYjNKV1lXeDFaUzUyWVd4MVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUhSb2FYTXVZMjlzYjNJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loY0lrRWdVR3hoZVdWeUlHNWxaV1J6SUdFZ1kyOXNiM0lzSUhkb2FXTm9JR2x6SUdFZ1UzUnlhVzVuTGx3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzVoYldWV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG5OMGNtbHVaeWh1WVcxbElIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRTVCVFVWZlFWUlVVa2xDVlZSRktTazdYRzRnSUNBZ0lDQWdJR2xtSUNodVlXMWxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDI1aGJXVXVjMlYwS0hSb2FYTXNJRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVGtGTlJWOUJWRlJTU1VKVlZFVXNJSFJvYVhNdWJtRnRaU2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlLRndpUVNCUWJHRjVaWElnYm1WbFpITWdZU0J1WVcxbExDQjNhR2xqYUNCcGN5QmhJRk4wY21sdVp5NWNJaWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCelkyOXlaVlpoYkhWbElEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaHpZMjl5WlNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVcEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0hOamIzSmxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNOamIzSmxMbk5sZENoMGFHbHpMQ0J6WTI5eVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVjMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QydGhlUzRnUVNCd2JHRjVaWElnWkc5bGN5QnViM1FnYm1WbFpDQjBieUJvWVhabElHRWdjMk52Y21VdVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYzJOdmNtVXVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGhjMVIxY201V1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1KdmIyeGxZVzRvYUdGelZIVnliaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1selZISjFaU2dwTzF4dUlDQWdJQ0FnSUNCcFppQW9hR0Z6VkhWeWJsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlvWVhOVWRYSnVMbk5sZENoMGFHbHpMQ0JvWVhOVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTd2dhR0Z6VkhWeWJpazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBhMkY1TENCQklIQnNZWGxsY2lCa2IyVnpJRzV2ZENCaGJIZGhlWE1nYUdGMlpTQmhJSFIxY200dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnYm5Wc2JDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1JoZEdsaklHZGxkQ0J2WW5ObGNuWmxaRUYwZEhKcFluVjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYlhHNGdJQ0FnSUNBZ0lDQWdJQ0JEVDB4UFVsOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCT1FVMUZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGTkRUMUpGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSVnh1SUNBZ0lDQWdJQ0JkTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdocGN5QndiR0Y1WlhJbmN5QnVZVzFsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMU4wY21sdVozMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdibUZ0WlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXVZVzFsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJSEJzWVhsbGNpZHpJSE5qYjNKbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYzJOdmNtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lEMDlQU0JmYzJOdmNtVXVaMlYwS0hSb2FYTXBJRDhnTUNBNklGOXpZMjl5WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCelkyOXlaU2h1WlhkVFkyOXlaU2tnZTF4dUlDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1bGQxTmpiM0psS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDFOamIzSmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGTENCdVpYZFRZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRkR0Z5ZENCaElIUjFjbTRnWm05eUlIUm9hWE1nY0d4aGVXVnlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdWRzl3VUd4aGVXVnlmU0JVYUdVZ2NHeGhlV1Z5SUhkcGRHZ2dZU0IwZFhKdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnYzNSaGNuUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NXBjME52Ym01bFkzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1d1lYSmxiblJPYjJSbExtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFTjFjM1J2YlVWMlpXNTBLRndpZEc5d09uTjBZWEowTFhSMWNtNWNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhJNklIUm9hWE5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gyaGhjMVIxY200dWMyVjBLSFJvYVhNc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkZibVFnWVNCMGRYSnVJR1p2Y2lCMGFHbHpJSEJzWVhsbGNpNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbGJtUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2diblZzYkNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QjBhR2x6SUhCc1lYbGxjaUJvWVhabElHRWdkSFZ5Ymo5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWVhOVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpTQTlQVDBnWDJoaGMxUjFjbTR1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVFZ1UzUnlhVzVuSUhKbGNISmxjMlZ1ZEdGMGFXOXVJRzltSUhSb2FYTWdjR3hoZVdWeUxDQm9hWE1nYjNJZ2FHVnljeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdjR3hoZVdWeUozTWdibUZ0WlNCeVpYQnlaWE5sYm5SeklIUm9aU0J3YkdGNVpYSWdZWE1nWVNCemRISnBibWN1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJnSkh0MGFHbHpMbTVoYldWOVlEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkpjeUIwYUdseklIQnNZWGxsY2lCbGNYVmhiQ0JoYm05MGFHVnlJSEJzWVhsbGNqOWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRkJzWVhsbGNuMGdiM1JvWlhJZ0xTQlVhR1VnYjNSb1pYSWdjR3hoZVdWeUlIUnZJR052YlhCaGNtVWdkR2hwY3lCd2JHRjVaWElnZDJsMGFDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdENiMjlzWldGdWZTQlVjblZsSUhkb1pXNGdaV2wwYUdWeUlIUm9aU0J2WW1wbFkzUWdjbVZtWlhKbGJtTmxjeUJoY21VZ2RHaGxJSE5oYldWY2JpQWdJQ0FnS2lCdmNpQjNhR1Z1SUdKdmRHZ2dibUZ0WlNCaGJtUWdZMjlzYjNJZ1lYSmxJSFJvWlNCellXMWxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHVnhkV0ZzY3lodmRHaGxjaWtnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J1WVcxbElEMGdYQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUc5MGFHVnlJRDhnYjNSb1pYSWdPaUJ2ZEdobGNpNXVZVzFsTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYjNSb1pYSWdQVDA5SUhSb2FYTWdmSHdnYm1GdFpTQTlQVDBnZEdocGN5NXVZVzFsTzF4dUlDQWdJSDFjYm4wN1hHNWNibmRwYm1SdmR5NWpkWE4wYjIxRmJHVnRaVzUwY3k1a1pXWnBibVVvVkVGSFgwNUJUVVVzSUZSdmNGQnNZWGxsY2lrN1hHNWNiaThxS2x4dUlDb2dWR2hsSUdSbFptRjFiSFFnYzNsemRHVnRJSEJzWVhsbGNpNGdSR2xqWlNCaGNtVWdkR2h5YjNkdUlHSjVJR0VnY0d4aGVXVnlMaUJHYjNJZ2MybDBkV0YwYVc5dWMxeHVJQ29nZDJobGNtVWdlVzkxSUhkaGJuUWdkRzhnY21WdVpHVnlJR0VnWW5WdVkyZ2diMllnWkdsalpTQjNhWFJvYjNWMElHNWxaV1JwYm1jZ2RHaGxJR052Ym1ObGNIUWdiMllnVUd4aGVXVnljMXh1SUNvZ2RHaHBjeUJFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJZ1kyRnVJR0psSUdFZ2MzVmljM1JwZEhWMFpTNGdUMllnWTI5MWNuTmxMQ0JwWmlCNWIzVW5aQ0JzYVd0bElIUnZYRzRnS2lCamFHRnVaMlVnZEdobElHNWhiV1VnWVc1a0wyOXlJSFJvWlNCamIyeHZjaXdnWTNKbFlYUmxJR0Z1WkNCMWMyVWdlVzkxY2lCdmQyNGdYQ0p6ZVhOMFpXMGdjR3hoZVdWeVhDSXVYRzRnS2lCQVkyOXVjM1JjYmlBcUwxeHVZMjl1YzNRZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNJRDBnYm1WM0lGUnZjRkJzWVhsbGNpaDdZMjlzYjNJNklGd2ljbVZrWENJc0lHNWhiV1U2SUZ3aUtsd2lmU2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5TEZ4dUlDQWdJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWl4Y2JpQWdJQ0JVUVVkZlRrRk5SU3hjYmlBZ0lDQklRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklzSUZSQlIxOU9RVTFGSUdGeklGUlBVRjlRVEVGWlJWSjlJR1p5YjIwZ1hDSXVMMVJ2Y0ZCc1lYbGxjaTVxYzF3aU8xeHVYRzVqYjI1emRDQlVRVWRmVGtGTlJTQTlJRndpZEc5d0xYQnNZWGxsY2kxc2FYTjBYQ0k3WEc1Y2JpOHFLbHh1SUNvZ1ZHOXdVR3hoZVdWeVRHbHpkQ0IwYnlCa1pYTmpjbWxpWlNCMGFHVWdjR3hoZVdWeWN5QnBiaUIwYUdVZ1oyRnRaUzVjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb3ZYRzVqYjI1emRDQlViM0JRYkdGNVpYSk1hWE4wSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZENCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1VHeGhlV1Z5VEdsemRDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQajBnZEdocGN5NXdiR0Y1WlhKekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzl3T25OMFlYSjBMWFIxY201Y0lpd2dLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJQYm14NUlHOXVaU0J3YkdGNVpYSWdZMkZ1SUdoaGRtVWdZU0IwZFhKdUlHRjBJR0Z1ZVNCbmFYWmxiaUIwYVcxbExseHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXdiR0Y1WlhKelhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xtWnBiSFJsY2lod0lEMCtJQ0Z3TG1WeGRXRnNjeWhsZG1WdWRDNWtaWFJoYVd3dWNHeGhlV1Z5S1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdVptOXlSV0ZqYUNod0lEMCtJSEF1Wlc1a1ZIVnliaWdwS1R0Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY25NZ2FXNGdkR2hwY3lCc2FYTjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxUnZjRkJzWVhsbGNsdGRmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YkdGNVpYSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnV3k0dUxuUm9hWE11WjJWMFJXeGxiV1Z1ZEhOQ2VWUmhaMDVoYldVb1ZFOVFYMUJNUVZsRlVpbGRPMXh1SUNBZ0lIMWNibjA3WEc1Y2JuZHBibVJ2ZHk1amRYTjBiMjFGYkdWdFpXNTBjeTVrWldacGJtVW9WRUZIWDA1QlRVVXNJRlJ2Y0ZCc1lYbGxja3hwYzNRcE8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGUnZjRkJzWVhsbGNreHBjM1FzWEc0Z0lDQWdWRUZIWDA1QlRVVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVMeTlwYlhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwZHlhV1JNWVhsdmRYUjlJR1p5YjIwZ1hDSXVMMGR5YVdSTVlYbHZkWFF1YW5OY0lqdGNibWx0Y0c5eWRDQjdWRzl3UkdsbExDQlVRVWRmVGtGTlJTQmhjeUJVVDFCZlJFbEZmU0JtY205dElGd2lMaTlVYjNCRWFXVXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNMQ0JVYjNCUWJHRjVaWElzSUZSQlIxOU9RVTFGSUdGeklGUlBVRjlRVEVGWlJWSXNJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSWDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5TG1welhDSTdYRzVwYlhCdmNuUWdlMVJCUjE5T1FVMUZJR0Z6SUZSUFVGOVFURUZaUlZKZlRFbFRWSDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5VEdsemRDNXFjMXdpTzF4dWFXMXdiM0owSUh0MllXeHBaR0YwWlgwZ1puSnZiU0JjSWk0dmRtRnNhV1JoZEdVdmRtRnNhV1JoZEdVdWFuTmNJanRjYmx4dVkyOXVjM1FnVkVGSFgwNUJUVVVnUFNCY0luUnZjQzFrYVdObExXSnZZWEprWENJN1hHNWNibU52Ym5OMElFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVZ1BTQXhNREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwaFBURVJmUkZWU1FWUkpUMDRnUFNBek56VTdJQzh2SUcxelhHNWpiMjV6ZENCRVJVWkJWVXhVWDBSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUWdQU0JtWVd4elpUdGNibU52Ym5OMElFUkZSa0ZWVEZSZlNFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYmx4dVkyOXVjM1FnVWs5WFV5QTlJREV3TzF4dVkyOXVjM1FnUTA5TVV5QTlJREV3TzF4dVhHNWpiMjV6ZENCRVJVWkJWVXhVWDFkSlJGUklJRDBnUTA5TVV5QXFJRVJGUmtGVlRGUmZSRWxGWDFOSldrVTdJQzh2SUhCNFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBoRlNVZElWQ0E5SUZKUFYxTWdLaUJFUlVaQlZVeFVYMFJKUlY5VFNWcEZPeUF2THlCd2VGeHVZMjl1YzNRZ1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0lEMGdUV0YwYUM1bWJHOXZjaWhTVDFkVElDOGdNaWs3WEc1Y2JtTnZibk4wSUUxSlRsOUVSVXhVUVNBOUlETTdJQzh2Y0hoY2JseHVZMjl1YzNRZ1YwbEVWRWhmUVZSVVVrbENWVlJGSUQwZ1hDSjNhV1IwYUZ3aU8xeHVZMjl1YzNRZ1NFVkpSMGhVWDBGVVZGSkpRbFZVUlNBOUlGd2lhR1ZwWjJoMFhDSTdYRzVqYjI1emRDQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSU0E5SUZ3aVpHbHpjR1Z5YzJsdmJsd2lPMXh1WTI5dWMzUWdSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZJRDBnWENKa2FXVXRjMmw2WlZ3aU8xeHVZMjl1YzNRZ1JGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0ltUnlZV2RuYVc1bkxXUnBZMlV0WkdsellXSnNaV1JjSWp0Y2JtTnZibk4wSUVoUFRFUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW1odmJHUnBibWN0WkdsalpTMWthWE5oWW14bFpGd2lPMXh1WTI5dWMzUWdVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbkp2ZEdGMGFXNW5MV1JwWTJVdFpHbHpZV0pzWldSY0lqdGNibU52Ym5OMElFaFBURVJmUkZWU1FWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSm9iMnhrTFdSMWNtRjBhVzl1WENJN1hHNWNibU52Ym5OMElIQmhjbk5sVG5WdFltVnlJRDBnS0c1MWJXSmxjbE4wY21sdVp5d2daR1ZtWVhWc2RFNTFiV0psY2lBOUlEQXBJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQnVkVzFpWlhJZ1BTQndZWEp6WlVsdWRDaHVkVzFpWlhKVGRISnBibWNzSURFd0tUdGNiaUFnSUNCeVpYUjFjbTRnVG5WdFltVnlMbWx6VG1GT0tHNTFiV0psY2lrZ1B5QmtaV1poZFd4MFRuVnRZbVZ5SURvZ2JuVnRZbVZ5TzF4dWZUdGNibHh1WTI5dWMzUWdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSWdQU0FvYm5WdFltVnlVM1J5YVc1bkxDQmtaV1poZFd4MFZtRnNkV1VwSUQwK0lIdGNiaUFnSUNCeVpYUjFjbTRnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWh1ZFcxaVpYSlRkSEpwYm1jcFhHNGdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1pHVm1ZWFZzZEZaaGJIVmxLVnh1SUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzU5TzF4dVhHNWpiMjV6ZENCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNBOUlDaGxiR1Z0Wlc1MExDQnVZVzFsTENCa1pXWmhkV3gwVm1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0JwWmlBb1pXeGxiV1Z1ZEM1b1lYTkJkSFJ5YVdKMWRHVW9ibUZ0WlNrcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2RtRnNkV1ZUZEhKcGJtY2dQU0JsYkdWdFpXNTBMbWRsZEVGMGRISnBZblYwWlNodVlXMWxLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlLSFpoYkhWbFUzUnlhVzVuTENCa1pXWmhkV3gwVm1Gc2RXVXBPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnWkdWbVlYVnNkRlpoYkhWbE8xeHVmVHRjYmx4dVkyOXVjM1FnWjJWMFFtOXZiR1ZoYmlBOUlDaGliMjlzWldGdVUzUnlhVzVuTENCMGNuVmxWbUZzZFdVc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaDBjblZsVm1Gc2RXVWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY2dmSHdnWENKMGNuVmxYQ0lnUFQwOUlHSnZiMnhsWVc1VGRISnBibWNwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaGNJbVpoYkhObFhDSWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNGdJQ0FnZlZ4dWZUdGNibHh1WTI5dWMzUWdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU0E5SUNobGJHVnRaVzUwTENCdVlXMWxMQ0JrWldaaGRXeDBWbUZzZFdVcElEMCtJSHRjYmlBZ0lDQnBaaUFvWld4bGJXVnVkQzVvWVhOQmRIUnlhV0oxZEdVb2JtRnRaU2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2RXVlRkSEpwYm1jZ1BTQmxiR1Z0Wlc1MExtZGxkRUYwZEhKcFluVjBaU2h1WVcxbEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRUp2YjJ4bFlXNG9kbUZzZFdWVGRISnBibWNzSUZ0MllXeDFaVk4wY21sdVp5d2dYQ0owY25WbFhDSmRMQ0JiWENKbVlXeHpaVndpWFN3Z1pHVm1ZWFZzZEZaaGJIVmxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWFIxY200Z1pHVm1ZWFZzZEZaaGJIVmxPMXh1ZlR0Y2JseHVMeThnVUhKcGRtRjBaU0J3Y205d1pYSjBhV1Z6WEc1amIyNXpkQ0JmWTJGdWRtRnpJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXNZWGx2ZFhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOMWNuSmxiblJRYkdGNVpYSWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVZMjl1YzNRZ1kyOXVkR1Y0ZENBOUlDaGliMkZ5WkNrZ1BUNGdYMk5oYm5aaGN5NW5aWFFvWW05aGNtUXBMbWRsZEVOdmJuUmxlSFFvWENJeVpGd2lLVHRjYmx4dVkyOXVjM1FnWjJWMFVtVmhaSGxFYVdObElEMGdLR0p2WVhKa0tTQTlQaUI3WEc0Z0lDQWdhV1lnS0hWdVpHVm1hVzVsWkNBOVBUMGdYMjUxYldKbGNrOW1VbVZoWkhsRWFXTmxMbWRsZENoaWIyRnlaQ2twSUh0Y2JpQWdJQ0FnSUNBZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObExuTmxkQ2hpYjJGeVpDd2dNQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlGOXVkVzFpWlhKUFpsSmxZV1I1UkdsalpTNW5aWFFvWW05aGNtUXBPMXh1ZlR0Y2JseHVZMjl1YzNRZ2RYQmtZWFJsVW1WaFpIbEVhV05sSUQwZ0tHSnZZWEprTENCMWNHUmhkR1VwSUQwK0lIdGNiaUFnSUNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdWMyVjBLR0p2WVhKa0xDQm5aWFJTWldGa2VVUnBZMlVvWW05aGNtUXBJQ3NnZFhCa1lYUmxLVHRjYm4wN1hHNWNibU52Ym5OMElHbHpVbVZoWkhrZ1BTQW9ZbTloY21RcElEMCtJR2RsZEZKbFlXUjVSR2xqWlNoaWIyRnlaQ2tnUFQwOUlHSnZZWEprTG1ScFkyVXViR1Z1WjNSb08xeHVYRzVqYjI1emRDQjFjR1JoZEdWQ2IyRnlaQ0E5SUNoaWIyRnlaQ3dnWkdsalpTQTlJR0p2WVhKa0xtUnBZMlVwSUQwK0lIdGNiaUFnSUNCcFppQW9hWE5TWldGa2VTaGliMkZ5WkNrcElIdGNiaUFnSUNBZ0lDQWdZMjl1ZEdWNGRDaGliMkZ5WkNrdVkyeGxZWEpTWldOMEtEQXNJREFzSUdKdllYSmtMbmRwWkhSb0xDQmliMkZ5WkM1b1pXbG5hSFFwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdaR2xsSUc5bUlHUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlM1eVpXNWtaWElvWTI5dWRHVjRkQ2hpYjJGeVpDa3NJR0p2WVhKa0xtUnBaVk5wZW1VcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVmVHRjYmx4dVhHNHZMeUJKYm5SbGNtRmpkR2x2YmlCemRHRjBaWE5jYm1OdmJuTjBJRTVQVGtVZ1BTQlRlVzFpYjJ3b1hDSnViMTlwYm5SbGNtRmpkR2x2Ymx3aUtUdGNibU52Ym5OMElFaFBURVFnUFNCVGVXMWliMndvWENKb2IyeGtYQ0lwTzF4dVkyOXVjM1FnVFU5V1JTQTlJRk41YldKdmJDaGNJbTF2ZG1WY0lpazdYRzVqYjI1emRDQkpUa1JGVkVWU1RVbE9SVVFnUFNCVGVXMWliMndvWENKcGJtUmxkR1Z5YldsdVpXUmNJaWs3WEc1amIyNXpkQ0JFVWtGSFIwbE9SeUE5SUZONWJXSnZiQ2hjSW1SeVlXZG5hVzVuWENJcE8xeHVYRzR2THlCTlpYUm9iMlJ6SUhSdklHaGhibVJzWlNCcGJuUmxjbUZqZEdsdmJseHVZMjl1YzNRZ1kyOXVkbVZ5ZEZkcGJtUnZkME52YjNKa2FXNWhkR1Z6Vkc5RFlXNTJZWE1nUFNBb1kyRnVkbUZ6TENCNFYybHVaRzkzTENCNVYybHVaRzkzS1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnWTJGdWRtRnpRbTk0SUQwZ1kyRnVkbUZ6TG1kbGRFSnZkVzVrYVc1blEyeHBaVzUwVW1WamRDZ3BPMXh1WEc0Z0lDQWdZMjl1YzNRZ2VDQTlJSGhYYVc1a2IzY2dMU0JqWVc1MllYTkNiM2d1YkdWbWRDQXFJQ2hqWVc1MllYTXVkMmxrZEdnZ0x5QmpZVzUyWVhOQ2IzZ3VkMmxrZEdncE8xeHVJQ0FnSUdOdmJuTjBJSGtnUFNCNVYybHVaRzkzSUMwZ1kyRnVkbUZ6UW05NExuUnZjQ0FxSUNoallXNTJZWE11YUdWcFoyaDBJQzhnWTJGdWRtRnpRbTk0TG1obGFXZG9kQ2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdlM2dzSUhsOU8xeHVmVHRjYmx4dVkyOXVjM1FnYzJWMGRYQkpiblJsY21GamRHbHZiaUE5SUNoaWIyRnlaQ2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJR05oYm5aaGN5QTlJRjlqWVc1MllYTXVaMlYwS0dKdllYSmtLVHRjYmx4dUlDQWdJQzh2SUZObGRIVndJR2x1ZEdWeVlXTjBhVzl1WEc0Z0lDQWdiR1YwSUc5eWFXZHBiaUE5SUh0OU8xeHVJQ0FnSUd4bGRDQnpkR0YwWlNBOUlFNVBUa1U3WEc0Z0lDQWdiR1YwSUhOMFlYUnBZMEp2WVhKa0lEMGdiblZzYkR0Y2JpQWdJQ0JzWlhRZ1pHbGxWVzVrWlhKRGRYSnpiM0lnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JvYjJ4a1ZHbHRaVzkxZENBOUlHNTFiR3c3WEc1Y2JpQWdJQ0JqYjI1emRDQm9iMnhrUkdsbElEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvU0U5TVJDQTlQVDBnYzNSaGRHVWdmSHdnU1U1RVJWUkZVazFKVGtWRUlEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdkRzluWjJ4bElHaHZiR1FnTHlCeVpXeGxZWE5sWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCd2JHRjVaWEpYYVhSb1FWUjFjbTRnUFNCaWIyRnlaQzV4ZFdWeWVWTmxiR1ZqZEc5eUtHQWtlMVJQVUY5UVRFRlpSVkpmVEVsVFZIMGdKSHRVVDFCZlVFeEJXVVZTZlZza2UwaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJYMWRZQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvWkdsbFZXNWtaWEpEZFhKemIzSXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVmJtUmxja04xY25OdmNpNXlaV3hsWVhObFNYUW9jR3hoZVdWeVYybDBhRUZVZFhKdUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdsbFZXNWtaWEpEZFhKemIzSXVhRzlzWkVsMEtIQnNZWGxsY2xkcGRHaEJWSFZ5YmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQnpkR0YwWlNBOUlFNVBUa1U3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0dKdllYSmtLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHaHZiR1JVYVcxbGIzVjBJRDBnYm5Wc2JEdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyOXVjM1FnYzNSaGNuUkliMnhrYVc1bklEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQm9iMnhrVkdsdFpXOTFkQ0E5SUhkcGJtUnZkeTV6WlhSVWFXMWxiM1YwS0dodmJHUkVhV1VzSUdKdllYSmtMbWh2YkdSRWRYSmhkR2x2YmlrN1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE4wYjNCSWIyeGthVzVuSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCM2FXNWtiM2N1WTJ4bFlYSlVhVzFsYjNWMEtHaHZiR1JVYVcxbGIzVjBLVHRjYmlBZ0lDQWdJQ0FnYUc5c1pGUnBiV1Z2ZFhRZ1BTQnVkV3hzTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnpkR0Z5ZEVsdWRHVnlZV04wYVc5dUlEMGdLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaE9UMDVGSUQwOVBTQnpkR0YwWlNrZ2UxeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCdmNtbG5hVzRnUFNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2VEb2daWFpsYm5RdVkyeHBaVzUwV0N4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCNU9pQmxkbVZ1ZEM1amJHbGxiblJaWEc0Z0lDQWdJQ0FnSUNBZ0lDQjlPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2lBOUlHSnZZWEprTG14aGVXOTFkQzVuWlhSQmRDaGpiMjUyWlhKMFYybHVaRzkzUTI5dmNtUnBibUYwWlhOVWIwTmhiblpoY3loallXNTJZWE1zSUdWMlpXNTBMbU5zYVdWdWRGZ3NJR1YyWlc1MExtTnNhV1Z1ZEZrcEtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z0lUMDlJR1JwWlZWdVpHVnlRM1Z5YzI5eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVDI1c2VTQnBiblJsY21GamRHbHZiaUIzYVhSb0lIUm9aU0JpYjJGeVpDQjJhV0VnWVNCa2FXVmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVdKdllYSmtMbVJwYzJGaWJHVmtTRzlzWkdsdVowUnBZMlVnSmlZZ0lXSnZZWEprTG1ScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnU1U1RVJWUkZVazFKVGtWRU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGeWRFaHZiR1JwYm1jb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWFJsSUQwZ1NFOU1SRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MzUmhjblJJYjJ4a2FXNW5LQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNnaFltOWhjbVF1WkdsellXSnNaV1JFY21GbloybHVaMFJwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGRHVWdQU0JOVDFaRk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOb2IzZEpiblJsY21GamRHbHZiaUE5SUNobGRtVnVkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FXVlZibVJsY2tOMWNuTnZjaUE5SUdKdllYSmtMbXhoZVc5MWRDNW5aWFJCZENoamIyNTJaWEowVjJsdVpHOTNRMjl2Y21ScGJtRjBaWE5VYjBOaGJuWmhjeWhqWVc1MllYTXNJR1YyWlc1MExtTnNhV1Z1ZEZnc0lHVjJaVzUwTG1Oc2FXVnVkRmtwS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRVJTUVVkSFNVNUhJRDA5UFNCemRHRjBaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMkZ1ZG1GekxuTjBlV3hsTG1OMWNuTnZjaUE5SUZ3aVozSmhZbUpwYm1kY0lqdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2h1ZFd4c0lDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5OMGVXeGxMbU4xY25OdmNpQTlJRndpWjNKaFlsd2lPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5OMGVXeGxMbU4xY25OdmNpQTlJRndpWkdWbVlYVnNkRndpTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJRzF2ZG1VZ1BTQW9aWFpsYm5RcElEMCtJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFMVBWa1VnUFQwOUlITjBZWFJsSUh4OElFbE9SRVZVUlZKTlNVNUZSQ0E5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdSbGRHVnliV2x1WlNCcFppQmhJR1JwWlNCcGN5QjFibVJsY2lCMGFHVWdZM1Z5YzI5eVhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCSloyNXZjbVVnYzIxaGJHd2diVzkyWlcxbGJuUnpYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZUNBOUlFMWhkR2d1WVdKektHOXlhV2RwYmk1NElDMGdaWFpsYm5RdVkyeHBaVzUwV0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlU0E5SUUxaGRHZ3VZV0p6S0c5eWFXZHBiaTU1SUMwZ1pYWmxiblF1WTJ4cFpXNTBXU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoTlNVNWZSRVZNVkVFZ1BDQmtlQ0I4ZkNCTlNVNWZSRVZNVkVFZ1BDQmtlU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnUkZKQlIwZEpUa2M3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSdmNFaHZiR1JwYm1jb0tUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUnBZMlZYYVhSb2IzVjBSR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQmliMkZ5WkM1a2FXTmxMbVpwYkhSbGNpaGthV1VnUFQ0Z1pHbGxJQ0U5UFNCa2FXVlZibVJsY2tOMWNuTnZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZFhCa1lYUmxRbTloY21Rb1ltOWhjbVFzSUdScFkyVlhhWFJvYjNWMFJHbGxWVzVrWlhKRGRYSnpiM0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUnBZMEp2WVhKa0lEMGdZMjl1ZEdWNGRDaGliMkZ5WkNrdVoyVjBTVzFoWjJWRVlYUmhLREFzSURBc0lHTmhiblpoY3k1M2FXUjBhQ3dnWTJGdWRtRnpMbWhsYVdkb2RDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9SRkpCUjBkSlRrY2dQVDA5SUhOMFlYUmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VDQTlJRzl5YVdkcGJpNTRJQzBnWlhabGJuUXVZMnhwWlc1MFdEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1I1SUQwZ2IzSnBaMmx1TG5rZ0xTQmxkbVZ1ZEM1amJHbGxiblJaTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjdlQ3dnZVgwZ1BTQmthV1ZWYm1SbGNrTjFjbk52Y2k1amIyOXlaR2x1WVhSbGN6dGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1Y0hWMFNXMWhaMlZFWVhSaEtITjBZWFJwWTBKdllYSmtMQ0F3TENBd0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpWVnVaR1Z5UTNWeWMyOXlMbkpsYm1SbGNpaGpiMjUwWlhoMEtHSnZZWEprS1N3Z1ltOWhjbVF1WkdsbFUybDZaU3dnZTNnNklIZ2dMU0JrZUN3Z2VUb2dlU0F0SUdSNWZTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUnZjRWx1ZEdWeVlXTjBhVzl1SUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJQ0U5UFNCa2FXVlZibVJsY2tOMWNuTnZjaUFtSmlCRVVrRkhSMGxPUnlBOVBUMGdjM1JoZEdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1I0SUQwZ2IzSnBaMmx1TG5nZ0xTQmxkbVZ1ZEM1amJHbGxiblJZTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIa2dQU0J2Y21sbmFXNHVlU0F0SUdWMlpXNTBMbU5zYVdWdWRGazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdScFpWVnVaR1Z5UTNWeWMyOXlMbU52YjNKa2FXNWhkR1Z6TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnpibUZ3Vkc5RGIyOXlaSE1nUFNCaWIyRnlaQzVzWVhsdmRYUXVjMjVoY0ZSdktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUdScFpWVnVaR1Z5UTNWeWMyOXlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSGc2SUhnZ0xTQmtlQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I1T2lCNUlDMGdaSGtzWEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2JtVjNRMjl2Y21SeklEMGdiblZzYkNBaFBTQnpibUZ3Vkc5RGIyOXlaSE1nUHlCemJtRndWRzlEYjI5eVpITWdPaUI3ZUN3Z2VYMDdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHUnBaVlZ1WkdWeVEzVnljMjl5TG1OdmIzSmthVzVoZEdWeklEMGdibVYzUTI5dmNtUnpPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdRMnhsWVhJZ2MzUmhkR1ZjYmlBZ0lDQWdJQ0FnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQnpkR0YwWlNBOUlFNVBUa1U3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVbVZtY21WemFDQmliMkZ5WkRzZ1VtVnVaR1Z5SUdScFkyVmNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvWW05aGNtUXBPMXh1SUNBZ0lIMDdYRzVjYmx4dUlDQWdJQzh2SUZKbFoybHpkR1Z5SUhSb1pTQmhZM1IxWVd3Z1pYWmxiblFnYkdsemRHVnVaWEp6SUdSbFptbHVaV1FnWVdKdmRtVXVJRTFoY0NCMGIzVmphQ0JsZG1WdWRITWdkRzljYmlBZ0lDQXZMeUJsY1hWcGRtRnNaVzUwSUcxdmRYTmxJR1YyWlc1MGN5NGdRbVZqWVhWelpTQjBhR1VnWENKMGIzVmphR1Z1WkZ3aUlHVjJaVzUwSUdSdlpYTWdibTkwSUdoaGRtVWdZVnh1SUNBZ0lDOHZJR05zYVdWdWRGZ2dZVzVrSUdOc2FXVnVkRmtzSUhKbFkyOXlaQ0JoYm1RZ2RYTmxJSFJvWlNCc1lYTjBJRzl1WlhNZ1puSnZiU0IwYUdVZ1hDSjBiM1ZqYUcxdmRtVmNJbHh1SUNBZ0lDOHZJQ2h2Y2lCY0luUnZkV05vYzNSaGNuUmNJaWtnWlhabGJuUnpMbHh1WEc0Z0lDQWdiR1YwSUhSdmRXTm9RMjl2Y21ScGJtRjBaWE1nUFNCN1kyeHBaVzUwV0RvZ01Dd2dZMnhwWlc1MFdUb2dNSDA3WEc0Z0lDQWdZMjl1YzNRZ2RHOTFZMmd5Ylc5MWMyVkZkbVZ1ZENBOUlDaHRiM1Z6WlVWMlpXNTBUbUZ0WlNrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdLSFJ2ZFdOb1JYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBiM1ZqYUVWMlpXNTBJQ1ltSURBZ1BDQjBiM1ZqYUVWMlpXNTBMblJ2ZFdOb1pYTXViR1Z1WjNSb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2UyTnNhV1Z1ZEZnc0lHTnNhV1Z1ZEZsOUlEMGdkRzkxWTJoRmRtVnVkQzUwYjNWamFHVnpXekJkTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSdmRXTm9RMjl2Y21ScGJtRjBaWE1nUFNCN1kyeHBaVzUwV0N3Z1kyeHBaVzUwV1gwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpZVzUyWVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1RXOTFjMlZGZG1WdWRDaHRiM1Z6WlVWMlpXNTBUbUZ0WlN3Z2RHOTFZMmhEYjI5eVpHbHVZWFJsY3lrcE8xeHVJQ0FnSUNBZ0lDQjlPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpZVzUyWVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZkV05vYzNSaGNuUmNJaXdnZEc5MVkyZ3liVzkxYzJWRmRtVnVkQ2hjSW0xdmRYTmxaRzkzYmx3aUtTazdYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaV1J2ZDI1Y0lpd2djM1JoY25SSmJuUmxjbUZqZEdsdmJpazdYRzVjYmlBZ0lDQnBaaUFvSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lHTmhiblpoY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWRHOTFZMmh0YjNabFhDSXNJSFJ2ZFdOb01tMXZkWE5sUlhabGJuUW9YQ0p0YjNWelpXMXZkbVZjSWlrcE8xeHVJQ0FnSUNBZ0lDQmpZVzUyWVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0ltMXZkWE5sYlc5MlpWd2lMQ0J0YjNabEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxJSHg4SUNGaWIyRnlaQzVrYVhOaFlteGxaRWh2YkdScGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lHTmhiblpoY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWJXOTFjMlZ0YjNabFhDSXNJSE5vYjNkSmJuUmxjbUZqZEdsdmJpazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzVmphR1Z1WkZ3aUxDQjBiM1ZqYURKdGIzVnpaVVYyWlc1MEtGd2liVzkxYzJWMWNGd2lLU2s3WEc0Z0lDQWdZMkZ1ZG1GekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSnRiM1Z6WlhWd1hDSXNJSE4wYjNCSmJuUmxjbUZqZEdsdmJpazdYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaVzkxZEZ3aUxDQnpkRzl3U1c1MFpYSmhZM1JwYjI0cE8xeHVmVHRjYmx4dUx5b3FYRzRnS2lCVWIzQkVhV05sUW05aGNtUWdhWE1nWVNCamRYTjBiMjBnU0ZSTlRDQmxiR1Z0Wlc1MElIUnZJSEpsYm1SbGNpQmhibVFnWTI5dWRISnZiQ0JoWEc0Z0tpQmthV05sSUdKdllYSmtMaUJjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb3ZYRzVqYjI1emRDQlViM0JFYVdObFFtOWhjbVFnUFNCamJHRnpjeUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwSUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJVYjNCRWFXTmxRbTloY21RdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb0tTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMzUjViR1V1WkdsemNHeGhlU0E5SUZ3aWFXNXNhVzVsTFdKc2IyTnJYQ0k3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSE5vWVdSdmR5QTlJSFJvYVhNdVlYUjBZV05vVTJoaFpHOTNLSHR0YjJSbE9pQmNJbU5zYjNObFpGd2lmU2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR05oYm5aaGN5QTlJR1J2WTNWdFpXNTBMbU55WldGMFpVVnNaVzFsYm5Rb1hDSmpZVzUyWVhOY0lpazdYRzRnSUNBZ0lDQWdJSE5vWVdSdmR5NWhjSEJsYm1SRGFHbHNaQ2hqWVc1MllYTXBPMXh1WEc0Z0lDQWdJQ0FnSUY5allXNTJZWE11YzJWMEtIUm9hWE1zSUdOaGJuWmhjeWs3WEc0Z0lDQWdJQ0FnSUY5amRYSnlaVzUwVUd4aGVXVnlMbk5sZENoMGFHbHpMQ0JFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcE8xeHVJQ0FnSUNBZ0lDQmZiR0Y1YjNWMExuTmxkQ2gwYUdsekxDQnVaWGNnUjNKcFpFeGhlVzkxZENoN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IzYVdSMGFEb2dkR2hwY3k1M2FXUjBhQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHaGxhV2RvZERvZ2RHaHBjeTVvWldsbmFIUXNYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlRhWHBsT2lCMGFHbHpMbVJwWlZOcGVtVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FYTndaWEp6YVc5dU9pQjBhR2x6TG1ScGMzQmxjbk5wYjI1Y2JpQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0J6WlhSMWNFbHVkR1Z5WVdOMGFXOXVLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhOMFlYUnBZeUJuWlhRZ2IySnpaWEoyWldSQmRIUnlhV0oxZEdWektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdXMXh1SUNBZ0lDQWdJQ0FnSUNBZ1YwbEVWRWhmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdTRVZKUjBoVVgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVSSlUxQkZVbE5KVDA1ZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnUkVsRlgxTkpXa1ZmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JTVDFSQlZFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVoUFRFUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCSVQweEVYMFJWVWtGVVNVOU9YMEZVVkZKSlFsVlVSVnh1SUNBZ0lDQWdJQ0JkTzF4dUlDQWdJSDFjYmx4dUlDQWdJR0YwZEhKcFluVjBaVU5vWVc1blpXUkRZV3hzWW1GamF5aHVZVzFsTENCdmJHUldZV3gxWlN3Z2JtVjNWbUZzZFdVcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyRnVkbUZ6SUQwZ1gyTmhiblpoY3k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnSUNBZ0lITjNhWFJqYUNBb2JtRnRaU2tnZTF4dUlDQWdJQ0FnSUNCallYTmxJRmRKUkZSSVgwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZDJsa2RHZ2dQU0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxjaWh1WlhkV1lXeDFaU3dnY0dGeWMyVk9kVzFpWlhJb2IyeGtWbUZzZFdVcElIeDhJRVJGUmtGVlRGUmZWMGxFVkVncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXNZWGx2ZFhRdWQybGtkR2dnUFNCM2FXUjBhRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmhiblpoY3k1elpYUkJkSFJ5YVdKMWRHVW9WMGxFVkVoZlFWUlVVa2xDVlZSRkxDQjNhV1IwYUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqWVhObElFaEZTVWRJVkY5QlZGUlNTVUpWVkVVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2hsYVdkb2RDQTlJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlLRzVsZDFaaGJIVmxMQ0J3WVhKelpVNTFiV0psY2lodmJHUldZV3gxWlNrZ2ZId2dSRVZHUVZWTVZGOUlSVWxIU0ZRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXNZWGx2ZFhRdWFHVnBaMmgwSUQwZ2FHVnBaMmgwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMkZ1ZG1GekxuTmxkRUYwZEhKcFluVjBaU2hJUlVsSFNGUmZRVlJVVWtsQ1ZWUkZMQ0JvWldsbmFIUXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaR2x6Y0dWeWMybHZiaUE5SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5S0c1bGQxWmhiSFZsTENCd1lYSnpaVTUxYldKbGNpaHZiR1JXWVd4MVpTa2dmSHdnUkVWR1FWVk1WRjlFU1ZOUVJWSlRTVTlPS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWJHRjViM1YwTG1ScGMzQmxjbk5wYjI0Z1BTQmthWE53WlhKemFXOXVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JFU1VWZlUwbGFSVjlCVkZSU1NVSlZWRVU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUnBaVk5wZW1VZ1BTQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpaHVaWGRXWVd4MVpTd2djR0Z5YzJWT2RXMWlaWElvYjJ4a1ZtRnNkV1VwSUh4OElFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXNZWGx2ZFhRdVpHbGxVMmw2WlNBOUlHUnBaVk5wZW1VN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqWVhObElGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGT2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmthWE5oWW14bFpGSnZkR0YwYVc5dUlEMGdkbUZzYVdSaGRHVXVZbTl2YkdWaGJpaHVaWGRXWVd4MVpTd2daMlYwUW05dmJHVmhiaWh2YkdSV1lXeDFaU3dnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrcExuWmhiSFZsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1c1lYbHZkWFF1Y205MFlYUmxJRDBnSVdScGMyRmliR1ZrVW05MFlYUnBiMjQ3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmtaV1poZFd4ME9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlVhR1VnZG1Gc2RXVWdhWE1nWkdWMFpYSnRhVzVsWkNCM2FHVnVJSFZ6YVc1bklIUm9aU0JuWlhSMFpYSmNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmNDMWthV1U2WVdSa1pXUmNJaXdnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RYQmtZWFJsVW1WaFpIbEVhV05sS0hSb2FYTXNJREVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dselVtVmhaSGtvZEdocGN5a3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IxY0dSaGRHVkNiMkZ5WkNoMGFHbHpMQ0IwYUdsekxteGhlVzkxZEM1c1lYbHZkWFFvZEdocGN5NWthV05sS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwcE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZjQzFrYVdVNmNtVnRiM1psWkZ3aUxDQW9LU0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IxY0dSaGRHVkNiMkZ5WkNoMGFHbHpMQ0IwYUdsekxteGhlVzkxZEM1c1lYbHZkWFFvZEdocGN5NWthV05sS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVW9kR2hwY3l3Z0xURXBPMXh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JrYVhOamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNCOVhHNWNiaUFnSUNCaFpHOXdkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRWR5YVdSTVlYbHZkWFFnZFhObFpDQmllU0IwYUdseklFUnBZMlZDYjJGeVpDQjBieUJzWVhsdmRYUWdkR2hsSUdScFkyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1IzSnBaRXhoZVc5MWRIMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdiR0Y1YjNWMEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMnhoZVc5MWRDNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkM0Z1RtOTBaU3dnZEc4Z1lXTjBkV0ZzYkhrZ2RHaHliM2NnZEdobElHUnBZMlVnZFhObFhHNGdJQ0FnSUNvZ2UwQnNhVzVySUhSb2NtOTNSR2xqWlgwdUlGeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTFSdmNFUnBaVnRkZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnV3k0dUxuUm9hWE11WjJWMFJXeGxiV1Z1ZEhOQ2VWUmhaMDVoYldVb1ZFOVFYMFJKUlNsZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J0WVhocGJYVnRJRzUxYldKbGNpQnZaaUJrYVdObElIUm9ZWFFnWTJGdUlHSmxJSEIxZENCdmJpQjBhR2x6SUdKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZTQlVhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTd2dNQ0E4SUcxaGVHbHRkVzB1WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUcxaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG14aGVXOTFkQzV0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQjNhV1IwYUNCdlppQjBhR2x6SUdKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2QybGtkR2dvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JYU1VSVVNGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZWMGxFVkVncE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JvWldsbmFIUWdiMllnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWldsbmFIUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU2gwYUdsekxDQklSVWxIU0ZSZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwaEZTVWRJVkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR1JwYzNCbGNuTnBiMjRnYkdWMlpXd2diMllnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVhOd1pYSnphVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhKQmRIUnlhV0oxZEdVb2RHaHBjeXdnUkVsVFVFVlNVMGxQVGw5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRpazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhOcGVtVWdiMllnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2xsVTJsNlpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxLSFJvYVhNc0lFUkpSVjlUU1ZwRlgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUVTVVZmVTBsYVJTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMkZ1SUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkNCaVpTQmtjbUZuWjJWa1AxeHVJQ0FnSUNBcUlFQjBlWEJsSUh0Q2IyOXNaV0Z1ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FYTmhZbXhsWkVSeVlXZG5hVzVuUkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEVKdmIyeGxZVzVCZEhSeWFXSjFkR1VvZEdocGN5d2dSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlJGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTJGdUlHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDQmlaU0JvWld4a0lHSjVJR0VnVUd4aGVXVnlQMXh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmtGMGRISnBZblYwWlNoMGFHbHpMQ0JJVDB4RVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nU1hNZ2NtOTBZWFJwYm1jZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0lHUnBjMkZpYkdWa1AxeHVJQ0FnSUNBcUlFQjBlWEJsSUh0Q2IyOXNaV0Z1ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FYTmhZbXhsWkZKdmRHRjBhVzVuUkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEVKdmIyeGxZVzVCZEhSeWFXSjFkR1VvZEdocGN5d2dVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlVrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHUjFjbUYwYVc5dUlHbHVJRzF6SUhSdklIQnlaWE56SUhSb1pTQnRiM1Z6WlNBdklIUnZkV05vSUdFZ1pHbGxJR0psWm05eVpTQnBkQ0JpWld0dmJXVnpYRzRnSUNBZ0lDb2dhR1ZzWkNCaWVTQjBhR1VnVUd4aGVXVnlMaUJKZENCb1lYTWdiMjVzZVNCaGJpQmxabVpsWTNRZ2QyaGxiaUIwYUdsekxtaHZiR1JoWW14bFJHbGpaU0E5UFQxY2JpQWdJQ0FnS2lCMGNuVmxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2FHOXNaRVIxY21GMGFXOXVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFVHOXphWFJwZG1WT2RXMWlaWEpCZEhSeWFXSjFkR1VvZEdocGN5d2dTRTlNUkY5RVZWSkJWRWxQVGw5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlNFOU1SRjlFVlZKQlZFbFBUaWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElGUnZjRkJzWVhsbGNreHBjM1FnWld4bGJXVnVkQ0J2WmlCMGFHbHpJRlJ2Y0VScFkyVkNiMkZ5WkM0Z1NXWWdhWFFnWkc5bGN5QnViM1FnWlhocGMzUXNYRzRnSUNBZ0lDb2dhWFFnZDJsc2JDQmlaU0JqY21WaGRHVmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxUnZjRkJzWVhsbGNreHBjM1I5WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWDNCc1lYbGxja3hwYzNRb0tTQjdYRzRnSUNBZ0lDQWdJR3hsZENCd2JHRjVaWEpNYVhOMElEMGdkR2hwY3k1eGRXVnllVk5sYkdWamRHOXlLRlJQVUY5UVRFRlpSVkpmVEVsVFZDazdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJRDA5UFNCd2JHRjVaWEpNYVhOMEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2JHRjVaWEpNYVhOMElEMGdkR2hwY3k1aGNIQmxibVJEYUdsc1pDaFVUMUJmVUV4QldVVlNYMHhKVTFRcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSEJzWVhsbGNreHBjM1E3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY25NZ2NHeGhlV2x1WnlCdmJpQjBhR2x6SUdKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxUnZjRkJzWVhsbGNsdGRmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YkdGNVpYSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZjR3hoZVdWeVRHbHpkQzV3YkdGNVpYSnpPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRUZ6SUhCc1lYbGxjaXdnZEdoeWIzY2dkR2hsSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Vkc5d1VHeGhlV1Z5ZlNCYmNHeGhlV1Z5SUQwZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNYU0F0SUZSb1pWeHVJQ0FnSUNBcUlIQnNZWGxsY2lCMGFHRjBJR2x6SUhSb2NtOTNhVzVuSUhSb1pTQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFViM0JFYVdWYlhYMGdWR2hsSUhSb2NtOTNiaUJrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1SUZSb2FYTWdiR2x6ZENCdlppQmthV05sSUdseklIUm9aU0J6WVcxbElHRnpJSFJvYVhNZ1ZHOXdSR2xqWlVKdllYSmtKM01nZTBCelpXVWdaR2xqWlgwZ2NISnZjR1Z5ZEhsY2JpQWdJQ0FnS2k5Y2JpQWdJQ0IwYUhKdmQwUnBZMlVvY0d4aGVXVnlJRDBnUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNod2JHRjVaWElnSmlZZ0lYQnNZWGxsY2k1b1lYTlVkWEp1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3YkdGNVpYSXVjM1JoY25SVWRYSnVLQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVdObExtWnZja1ZoWTJnb1pHbGxJRDArSUdScFpTNTBhSEp2ZDBsMEtDa3BPMXh1SUNBZ0lDQWdJQ0IxY0dSaGRHVkNiMkZ5WkNoMGFHbHpMQ0IwYUdsekxteGhlVzkxZEM1c1lYbHZkWFFvZEdocGN5NWthV05sS1NrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbVJwWTJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1FXUmtJR0VnWkdsbElIUnZJSFJvYVhNZ1ZHOXdSR2xqWlVKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JFYVdWOFQySnFaV04wZlNCYlkyOXVabWxuSUQwZ2UzMWRJQzBnVkdobElHUnBaU0J2Y2lCaElHTnZibVpwWjNWeVlYUnBiMjRnYjJaY2JpQWdJQ0FnS2lCMGFHVWdaR2xsSUhSdklHRmtaQ0IwYnlCMGFHbHpJRlJ2Y0VScFkyVkNiMkZ5WkM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbnh1ZFd4c2ZTQmJZMjl1Wm1sbkxuQnBjSE5kSUMwZ1ZHaGxJSEJwY0hNZ2IyWWdkR2hsSUdScFpTQjBieUJoWkdRdVhHNGdJQ0FnSUNvZ1NXWWdibThnY0dsd2N5QmhjbVVnYzNCbFkybG1hV1ZrSUc5eUlIUm9aU0J3YVhCeklHRnlaU0J1YjNRZ1ltVjBkMlZsYmlBeElHRnVaQ0EyTENCaElISmhibVJ2YlZ4dUlDQWdJQ0FxSUc1MWJXSmxjaUJpWlhSM1pXVnVJREVnWVc1a0lEWWdhWE1nWjJWdVpYSmhkR1ZrSUdsdWMzUmxZV1F1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJRnRqYjI1bWFXY3VZMjlzYjNKZElDMGdWR2hsSUdOdmJHOXlJRzltSUhSb1pTQmthV1VnZEc4Z1lXUmtMaUJFWldaaGRXeDBYRzRnSUNBZ0lDb2dkRzhnZEdobElHUmxabUYxYkhRZ1kyOXNiM0l1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VlRjBnTFNCVWFHVWdlQ0JqYjI5eVpHbHVZWFJsSUc5bUlIUm9aU0JrYVdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUZ0amIyNW1hV2N1ZVYwZ0xTQlVhR1VnZVNCamIyOXlaR2x1WVhSbElHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWNtOTBZWFJwYjI1ZElDMGdWR2hsSUhKdmRHRjBhVzl1SUc5bUlIUm9aU0JrYVdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VWIzQlFiR0Y1WlhKOUlGdGpiMjVtYVdjdWFHVnNaRUo1WFNBdElGUm9aU0J3YkdGNVpYSWdhRzlzWkdsdVp5QjBhR1VnWkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdSR2xsZlNCVWFHVWdZV1JrWldRZ1pHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHRmtaRVJwWlNoamIyNW1hV2NnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1aGNIQmxibVJEYUdsc1pDaGpiMjVtYVdjZ2FXNXpkR0Z1WTJWdlppQlViM0JFYVdVZ1B5QmpiMjVtYVdjZ09pQnVaWGNnVkc5d1JHbGxLR052Ym1acFp5a3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRkpsYlc5MlpTQmthV1VnWm5KdmJTQjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdSR2xsZlNCa2FXVWdMU0JVYUdVZ1pHbGxJSFJ2SUhKbGJXOTJaU0JtY205dElIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2NtVnRiM1psUkdsbEtHUnBaU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9aR2xsTG5CaGNtVnVkRTV2WkdVZ0ppWWdaR2xsTG5CaGNtVnVkRTV2WkdVZ1BUMDlJSFJvYVhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFEyaHBiR1FvWkdsbEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRUZrWkNCaElIQnNZWGxsY2lCMGJ5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdVR3hoZVdWeWZFOWlhbVZqZEgwZ1kyOXVabWxuSUMwZ1ZHaGxJSEJzWVhsbGNpQnZjaUJoSUdOdmJtWnBaM1Z5WVhScGIyNGdiMllnWVZ4dUlDQWdJQ0FxSUhCc1lYbGxjaUIwYnlCaFpHUWdkRzhnZEdocGN5QlViM0JFYVdObFFtOWhjbVF1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJR052Ym1acFp5NWpiMnh2Y2lBdElGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSWdkWE5sWkNCcGJpQjBhR1VnWjJGdFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ1kyOXVabWxuTG01aGJXVWdMU0JVYUdseklIQnNZWGxsY2lkeklHNWhiV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjMk52Y21WZElDMGdWR2hwY3lCd2JHRjVaWEluY3lCelkyOXlaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMEp2YjJ4bFlXNTlJRnRqYjI1bWFXY3VhR0Z6VkhWeWJsMGdMU0JVYUdseklIQnNZWGxsY2lCb1lYTWdZU0IwZFhKdUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRmNuSnZjaUIzYUdWdUlIUm9aU0J3YkdGNVpYSWdkRzhnWVdSa0lHTnZibVpzYVdOMGN5QjNhWFJvSUdFZ2NISmxMV1Y0YVhOMGFXNW5YRzRnSUNBZ0lDb2djR3hoZVdWeUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdVR3hoZVdWeWZTQlVhR1VnWVdSa1pXUWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdGa1pGQnNZWGxsY2loamIyNW1hV2NnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZmNHeGhlV1Z5VEdsemRDNWhjSEJsYm1SRGFHbHNaQ2hqYjI1bWFXY2dhVzV6ZEdGdVkyVnZaaUJVYjNCUWJHRjVaWElnUHlCamIyNW1hV2NnT2lCdVpYY2dWRzl3VUd4aGVXVnlLR052Ym1acFp5a3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRkpsYlc5MlpTQndiR0Y1WlhJZ1puSnZiU0IwYUdseklGUnZjRVJwWTJWQ2IyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdWRzl3VUd4aGVXVnlmU0J3YkdGNVpYSWdMU0JVYUdVZ2NHeGhlV1Z5SUhSdklISmxiVzkyWlNCbWNtOXRJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdjbVZ0YjNabFVHeGhlV1Z5S0hCc1lYbGxjaWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9jR3hoZVdWeUxuQmhjbVZ1ZEU1dlpHVWdKaVlnY0d4aGVXVnlMbkJoY21WdWRFNXZaR1VnUFQwOUlIUm9hWE11WDNCc1lYbGxja3hwYzNRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVYM0JzWVhsbGNreHBjM1F1Y21WdGIzWmxRMmhwYkdRb2NHeGhlV1Z5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVmVHRjYmx4dWQybHVaRzkzTG1OMWMzUnZiVVZzWlcxbGJuUnpMbVJsWm1sdVpTaFVRVWRmVGtGTlJTd2dWRzl3UkdsalpVSnZZWEprS1R0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWIzQkVhV05sUW05aGNtUXNYRzRnSUNBZ1JFVkdRVlZNVkY5RVNVVmZVMGxhUlN4Y2JpQWdJQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0c1hHNGdJQ0FnUkVWR1FWVk1WRjlYU1VSVVNDeGNiaUFnSUNCRVJVWkJWVXhVWDBoRlNVZElWQ3hjYmlBZ0lDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNHNYRzRnSUNBZ1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVMRnh1SUNBZ0lGUkJSMTlPUVUxRlhHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnc0lESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaTljYm1sdGNHOXlkQ0I3Vkc5d1JHbGpaVUp2WVhKa2ZTQm1jbTl0SUZ3aUxpOVViM0JFYVdObFFtOWhjbVF1YW5OY0lqdGNibWx0Y0c5eWRDQjdWRzl3UkdsbGZTQm1jbTl0SUZ3aUxpOVViM0JFYVdVdWFuTmNJanRjYm1sdGNHOXlkQ0I3Vkc5d1VHeGhlV1Z5ZlNCbWNtOXRJRndpTGk5VWIzQlFiR0Y1WlhJdWFuTmNJanRjYm1sdGNHOXlkQ0I3Vkc5d1VHeGhlV1Z5VEdsemRIMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlUR2x6ZEM1cWMxd2lPMXh1WEc1M2FXNWtiM2N1ZEhkbGJuUjViMjVsY0dsd2N5QTlJSGRwYm1SdmR5NTBkMlZ1ZEhsdmJtVndhWEJ6SUh4OElFOWlhbVZqZEM1bWNtVmxlbVVvZTF4dUlDQWdJRlpGVWxOSlQwNDZJRndpTUM0d0xqRmNJaXhjYmlBZ0lDQk1TVU5GVGxORk9pQmNJa3hIVUV3dE15NHdYQ0lzWEc0Z0lDQWdWMFZDVTBsVVJUb2dYQ0pvZEhSd2N6b3ZMM1IzWlc1MGVXOXVaWEJwY0hNdWIzSm5YQ0lzWEc0Z0lDQWdWRzl3UkdsalpVSnZZWEprT2lCVWIzQkVhV05sUW05aGNtUXNYRzRnSUNBZ1ZHOXdSR2xsT2lCVWIzQkVhV1VzWEc0Z0lDQWdWRzl3VUd4aGVXVnlPaUJVYjNCUWJHRjVaWElzWEc0Z0lDQWdWRzl3VUd4aGVXVnlUR2x6ZERvZ1ZHOXdVR3hoZVdWeVRHbHpkRnh1ZlNrN1hHNGlYU3dpYm1GdFpYTWlPbHNpVkVGSFgwNUJUVVVpTENKMllXeHBaR0YwWlNJc0lrTlBURTlTWDBGVVZGSkpRbFZVUlNJc0lsOWpiMnh2Y2lJc0lsUlBVRjlRVEVGWlJWSWlMQ0pVVDFCZlVFeEJXVVZTWDB4SlUxUWlMQ0pVVDFCZlJFbEZJbDBzSW0xaGNIQnBibWR6SWpvaVFVRkJRVHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRWGxDUVN4TlFVRk5MR3RDUVVGclFpeEhRVUZITEdOQlFXTXNTMEZCU3l4RFFVRkRPenM3T3pzN096dEpRVkV6UXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhGUVVGRk8xRkJRMnBDTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRMUVVOc1FqdERRVU5LT3p0QlEzQkRSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVVZCTEUxQlFVMHNjMEpCUVhOQ0xFZEJRVWNzUjBGQlJ5eERRVUZET3p0QlFVVnVReXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3p0SlFVTXpRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0RFFVTnlSU3hEUVVGRE96czdRVUZIUml4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFJRVUZSTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNdlFpeE5RVUZOTEZkQlFWY3NSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRMnhETEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03T3pzN096czdPenM3T3pzN096czdRVUZuUWpsQ0xFMUJRVTBzVlVGQlZTeEhRVUZITEUxQlFVMDdPenM3T3pzN1NVRlBja0lzVjBGQlZ5eERRVUZETzFGQlExSXNTMEZCU3p0UlFVTk1MRTFCUVUwN1VVRkRUaXhWUVVGVk8xRkJRMVlzVDBGQlR6dExRVU5XTEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUTBvc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRjRUlzVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja0lzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03TzFGQlJYaENMRWxCUVVrc1EwRkJReXhWUVVGVkxFZEJRVWNzVlVGQlZTeERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzVDBGQlR5eERRVUZETzFGQlEzWkNMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEyNUNMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzB0QlEzaENPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETTBJN08wbEJSVVFzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTFRc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlExQXNUVUZCVFN4SlFVRkpMR3RDUVVGclFpeERRVUZETEVOQlFVTXNOa05CUVRaRExFVkJRVVVzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMFk3VVVGRFJDeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRMmhFT3pzN096czdPenRKUVZGRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6VkNPenRKUVVWRUxFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTldMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5RTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETERoRFFVRTRReXhGUVVGRkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoSE8xRkJRMFFzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNrSXNTVUZCU1N4RFFVRkRMR05CUVdNc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRMUVVOb1JEczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxHMUNRVUZ0UWl4SFFVRkhPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8wdEJRMnhET3pzN096czdPenM3TzBsQlZVUXNTVUZCU1N4VlFVRlZMRWRCUVVjN1VVRkRZaXhQUVVGUExGZEJRVmNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRhRU03TzBsQlJVUXNTVUZCU1N4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTFBc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc2EwUkJRV3RFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGNFYzdVVUZEUkN4UFFVRlBMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTI1RE96czdPenM3T3p0SlFWRkVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVDBGQlR5eFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRemRDT3p0SlFVVkVMRWxCUVVrc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdFJRVU5hTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1JVRkJSVHRaUVVOVUxFMUJRVTBzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExDdERRVUVyUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEyeEhPMUZCUTBRc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRka0lzU1VGQlNTeERRVUZETEdOQlFXTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTm9SRHM3U1VGRlJDeEpRVUZKTEUxQlFVMHNSMEZCUnp0UlFVTlVMRTFCUVUwc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkROVUlzVDBGQlR5eFRRVUZUTEV0QlFVc3NRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRGNrTTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlExWXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZUVJN096czdPenM3TzBsQlVVUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE1VSTdPenM3T3pzN08wbEJVVVFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4TlFVRk5MRWRCUVVjc1IwRkJSeXhsUVVGbExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGFFUXNUVUZCVFN4SFFVRkhMRWRCUVVjc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE96dFJRVVZvUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEzSkNPenM3T3pzN096czdPenM3U1VGWlJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUlVGQlJUdFpRVU40UXl4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl4NVEwRkJlVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU14U1RzN1VVRkZSQ3hOUVVGTkxHbENRVUZwUWl4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVNM1FpeE5RVUZOTEZsQlFWa3NSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSWGhDTEV0QlFVc3NUVUZCVFN4SFFVRkhMRWxCUVVrc1NVRkJTU3hGUVVGRk8xbEJRM0JDTEVsQlFVa3NSMEZCUnl4RFFVRkRMR05CUVdNc1JVRkJSU3hKUVVGSkxFZEJRVWNzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlRzN096dG5Ra0ZKZEVNc2FVSkJRV2xDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJReTlDTEUxQlFVMDdaMEpCUTBnc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0aFFVTXhRanRUUVVOS096dFJRVVZFTEUxQlFVMHNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hGUVVGRkxFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhEUVVGRE8xRkJRemxGTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWxCUVVrc1EwRkJReXh6UWtGQmMwSXNRMEZCUXl4SFFVRkhMRVZCUVVVc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXpzN1VVRkZNMFVzUzBGQlN5eE5RVUZOTEVkQlFVY3NTVUZCU1N4WlFVRlpMRVZCUVVVN1dVRkROVUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRM1JGTEUxQlFVMHNWVUZCVlN4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dFpRVU12UXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExGZEJRVmNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXpzN1dVRkZkRU1zUjBGQlJ5eERRVUZETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1dVRkRlRVFzUjBGQlJ5eERRVUZETEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExITkNRVUZ6UWl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRM1pHTEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTXZRanM3VVVGRlJDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hwUWtGQmFVSXNRMEZCUXl4RFFVRkRPenRSUVVWdVF5eFBRVUZQTEdsQ1FVRnBRaXhEUVVGRE8wdEJRelZDT3pzN096czdPenM3T3p0SlFWZEVMSE5DUVVGelFpeERRVUZETEVkQlFVY3NSVUZCUlN4cFFrRkJhVUlzUlVGQlJUdFJRVU16UXl4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlF6VkNMRWxCUVVrc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5rTEUxQlFVMHNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03TzFGQlJXeEVMRTlCUVU4c1UwRkJVeXhEUVVGRExFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NTMEZCU3l4SFFVRkhMRkZCUVZFc1JVRkJSVHRaUVVNM1F5eExRVUZMTEUxQlFVMHNTVUZCU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdaMEpCUXpGRExFbEJRVWtzVTBGQlV5eExRVUZMTEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUlVGQlJTeHBRa0ZCYVVJc1EwRkJReXhGUVVGRk8yOUNRVU5zUlN4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJsQ1FVTjJRanRoUVVOS096dFpRVVZFTEV0QlFVc3NSVUZCUlN4RFFVRkRPMU5CUTFnN08xRkJSVVFzVDBGQlR5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8wdEJRMmhET3pzN096czdPenM3T3pzN1NVRlpSQ3hoUVVGaExFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlEycENMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEZUVJc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXpzN1VVRkZOVUlzU1VGQlNTeERRVUZETEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUTJJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGVrTXNUVUZCVFR0WlFVTklMRXRCUVVzc1NVRkJTU3hIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRVZCUVVVc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU5xUlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU01UkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMnBGT3p0WlFVVkVMRXRCUVVzc1NVRkJTU3hIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRXRCUVVzc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGQlJUdG5Ra0ZEY0VVc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZET1VRc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5xUlR0VFFVTktPenRSUVVWRUxFOUJRVThzUzBGQlN5eERRVUZETzB0QlEyaENPenM3T3pzN096czdPenRKUVZkRUxGbEJRVmtzUTBGQlF5eEpRVUZKTEVWQlFVVXNhVUpCUVdsQ0xFVkJRVVU3VVVGRGJFTXNUMEZCVHl4VFFVRlRMRXRCUVVzc2FVSkJRV2xDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExFZEJRVWNzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpOSE96czdPenM3T3pzN1NVRlRSQ3hoUVVGaExFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEySXNUMEZCVHl4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UzBGRGFrVTdPenM3T3pzN096czdTVUZWUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdVVUZEZEVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVU3V1VGRE9VUXNUMEZCVHl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEhRVUZITEVOQlFVTTdVMEZEYWtNN1VVRkRSQ3hQUVVGUExGTkJRVk1zUTBGQlF6dExRVU53UWpzN096czdPenM3T3pzN1NVRlhSQ3h2UWtGQmIwSXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRjRUlzVDBGQlR5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTndSRHM3T3pzN096czdPenM3U1VGWFJDeHZRa0ZCYjBJc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRGVrSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrUXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3V1VGRGVFTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkRXanRSUVVORUxFOUJRVThzVTBGQlV5eERRVUZETzB0QlEzQkNPenM3T3pzN096czdPenM3T3p0SlFXTkVMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRM1pDTEUxQlFVMHNWVUZCVlN4SFFVRkhPMWxCUTJZc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGFrTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1UwRkRjRU1zUTBGQlF6czdVVUZGUml4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUXpsRExFMUJRVTBzVDBGQlR5eEhRVUZITEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZETlVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4UFFVRlBMRU5CUVVNN1VVRkRlRU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTTNReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRkZCUVZFc1EwRkJRenM3VVVGRk1VTXNUVUZCVFN4VFFVRlRMRWRCUVVjc1EwRkJRenRaUVVObUxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRlZCUVZVc1EwRkJRenRaUVVOcVF5eFJRVUZSTEVWQlFVVXNUMEZCVHl4SFFVRkhMRkZCUVZFN1UwRkRMMElzUlVGQlJUdFpRVU5ETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8yZENRVU5zUWl4SFFVRkhMRVZCUVVVc1ZVRkJWU3hEUVVGRExFZEJRVWM3WjBKQlEyNUNMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdZVUZETVVJc1EwRkJRenRaUVVOR0xGRkJRVkVzUlVGQlJTeFJRVUZSTEVkQlFVY3NVVUZCVVR0VFFVTm9ReXhGUVVGRk8xbEJRME1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNN1owSkJRMnhDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03WjBKQlEzWkNMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ6dGhRVU4wUWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxFOUJRVThzUjBGQlJ5eFRRVUZUTzFOQlEyaERMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGRrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dGhRVU14UWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxGRkJRVkVzUjBGQlJ5eFRRVUZUTzFOQlEycERMRU5CUVVNc1EwRkJRenM3VVVGRlNDeE5RVUZOTEUxQlFVMHNSMEZCUnl4VFFVRlRPenRoUVVWdVFpeE5RVUZOTEVOQlFVTXNRMEZCUXl4UlFVRlJMRXRCUVVzc1UwRkJVeXhMUVVGTExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdPMkZCUlRsRExFMUJRVTBzUTBGQlF5eERRVUZETEZGQlFWRXNTMEZCU3p0blFrRkRiRUlzU1VGQlNTeExRVUZMTEVkQlFVY3NTVUZCU1N4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJReXhMUVVGTExGRkJRVkVzUTBGQlF5eERRVUZETzIxQ1FVTjBSU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPenRoUVVWeVJDeE5RVUZOTzJkQ1FVTklMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUzBGQlN5eFJRVUZSTEVOQlFVTXNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzVVVGQlVTeEhRVUZITEVsQlFVazdaMEpCUTNaRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEZOQlFWTXNSVUZCUlN4UlFVRlJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGREwwSXNRMEZCUXpzN1VVRkZUaXhQUVVGUExGTkJRVk1zUzBGQlN5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzB0QlF6bEZPenM3T3pzN096czdTVUZUUkN4TFFVRkxMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRGVFSXNTMEZCU3l4TlFVRk5MRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMWxCUXk5Q0xFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExGZEJRVmNzUTBGQlF6czdXVUZGTDBJc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVONlJDeE5RVUZOTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVjZSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeEpRVUZKTEVWQlFVVTdaMEpCUTJRc1QwRkJUeXhIUVVGSExFTkJRVU03WVVGRFpEdFRRVU5LT3p0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3T3pzN096czdPenM3U1VGVlJDeGpRVUZqTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSVHRSUVVNeFFpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjBSRHM3T3pzN096czdPMGxCVTBRc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZPMUZCUTNSQ0xFOUJRVThzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03UzBGRGVrUTdPenM3T3pzN096dEpRVk5FTEdGQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5zUWl4UFFVRlBPMWxCUTBnc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGFrTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1UwRkRjRU1zUTBGQlF6dExRVU5NTzBOQlEwbzdPMEZEYUdaRU96czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCSzBKQkxFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1EwRkJReXhKUVVGSkxFdEJRVXM3U1VGRGFrTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRGVrTXNUMEZCVHl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNWMEZCVnl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wTkJRekZHTEVOQlFVTTdPenM3T3pzN08wRkJVVVlzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhEUVVGRExFZEJRVWM3T3pzN096czdPenM3T3pzN1NVRmhNMElzWTBGQll5eEhRVUZITEVOQlFVTTdPenM3T3pzN096czdPenM3T3pzN1VVRm5RbVFzZDBKQlFYZENMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUlVGQlJTeFJRVUZSTEVWQlFVVTdPenM3V1VGSkwwTXNUVUZCVFN4UlFVRlJMRWRCUVVjc2EwSkJRV3RDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRNVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRkZCUVZFc1MwRkJTeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSVHRuUWtGRGNFUXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRNME03VTBGRFNqdExRVU5LT3p0QlEyaEdURHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeE5RVUZOTEdWQlFXVXNSMEZCUnl4alFVRmpMRXRCUVVzc1EwRkJRenRKUVVONFF5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RlFVRkZPMUZCUTJJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEyUTdRMEZEU2pzN1FVTjJRa1E3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZGUVN4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1lVRkJZU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hQUVVGUExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXpzN1FVRkZPVUlzVFVGQlRTeGhRVUZoTEVkQlFVY3NUVUZCVFR0SlFVTjRRaXhYUVVGWExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJUdFJRVU0xUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0UlFVTjRRaXhoUVVGaExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4WlFVRlpMRU5CUVVNc1EwRkJRenRSUVVOMFF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dExRVU0zUWpzN1NVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN1NVRkZSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEdGQlFXRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGREwwUTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdPMGxCUlVRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF6dExRVU5zUXpzN1NVRkZSQ3hUUVVGVExFTkJRVU1zVlVGQlZTeEZRVUZGTzFGQlEyeENMR0ZCUVdFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUTNCRExFOUJRVThzU1VGQlNTeERRVUZETzB0QlEyWTdPMGxCUlVRc1RVRkJUU3hEUVVGRExFTkJRVU1zVTBGQlV5eEZRVUZGTEdGQlFXRXNSMEZCUnl4RlFVRkZMRVZCUVVVc1UwRkJVeXhIUVVGSExHVkJRV1VzUTBGQlF5eEZRVUZGTzFGQlEycEZMRTFCUVUwc1YwRkJWeXhIUVVGSExGTkJRVk1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE8xRkJRM3BFTEVsQlFVa3NRMEZCUXl4WFFVRlhMRVZCUVVVN1dVRkRaQ3hOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxHRkJRV0VzUTBGQlF5eERRVUZET3p0WlFVVjJSQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVNelFqczdVVUZGUkN4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVObU8wTkJRMG83TzBGREwwUkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUVzVFVGQlRTeFZRVUZWTEVkQlFVY3NZMEZCWXl4bFFVRmxMRU5CUVVNN1NVRkROME1zVjBGQlZ5eERRVUZETEVkQlFVY3NSVUZCUlR0UlFVTmlMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dExRVU5rTzBOQlEwbzdPMEZEZWtKRU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlJVRXNUVUZCVFN4blFrRkJaMElzUjBGQlJ5eGpRVUZqTEdWQlFXVXNRMEZCUXp0SlFVTnVSQ3hYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNqczdRVU42UWtRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGSlFTeE5RVUZOTEhGQ1FVRnhRaXhIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU5vUXl4TlFVRk5MRzlDUVVGdlFpeEhRVUZITEdOQlFXTXNZVUZCWVN4RFFVRkRPMGxCUTNKRUxGZEJRVmNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEWml4SlFVRkpMRXRCUVVzc1IwRkJSeXh4UWtGQmNVSXNRMEZCUXp0UlFVTnNReXhOUVVGTkxGbEJRVmtzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJRenRSUVVNelF5eE5RVUZOTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSV3hDTEVsQlFVa3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU42UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMHNTVUZCU1N4UlFVRlJMRXRCUVVzc1QwRkJUeXhMUVVGTExFVkJRVVU3V1VGRGJFTXNUVUZCVFN4WFFVRlhMRWRCUVVjc1VVRkJVU3hEUVVGRExFdEJRVXNzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNWMEZCVnl4RFFVRkRMRVZCUVVVN1owSkJReTlDTEV0QlFVc3NSMEZCUnl4WFFVRlhMRU5CUVVNN1lVRkRka0lzVFVGQlRUdG5Ra0ZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVlVGQlZTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRkRU03VTBGRFNpeE5RVUZOTzFsQlEwZ3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxHZENRVUZuUWl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE5VTTdPMUZCUlVRc1MwRkJTeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEZsQlFWa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM2hET3p0SlFVVkVMRlZCUVZVc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZpeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRaaXhUUVVGVExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRE8xbEJRMnhETEdGQlFXRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOeVFpeERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3hYUVVGWExFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlExZ3NUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF6dFpRVU5zUXl4aFFVRmhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGNrSXNRMEZCUXl4RFFVRkRPMHRCUTA0N08wbEJSVVFzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVN1VVRkRWaXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzWVVGQllTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVONFFpeERRVUZETEVOQlFVTTdTMEZEVGp0RFFVTktPenRCUTJ4RlJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVZEJMRTFCUVUwc2IwSkJRVzlDTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTJoRExFMUJRVTBzYlVKQlFXMUNMRWRCUVVjc1kwRkJZeXhoUVVGaExFTkJRVU03U1VGRGNFUXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVObUxFbEJRVWtzUzBGQlN5eEhRVUZITEc5Q1FVRnZRaXhEUVVGRE8xRkJRMnBETEUxQlFVMHNXVUZCV1N4SFFVRkhMRzlDUVVGdlFpeERRVUZETzFGQlF6RkRMRTFCUVUwc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6czdVVUZGYkVJc1NVRkJTU3hSUVVGUkxFdEJRVXNzVDBGQlR5eExRVUZMTEVWQlFVVTdXVUZETTBJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU5xUWl4TlFVRk5PMWxCUTBnc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdkQ1FVRm5RaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETlVNN08xRkJSVVFzUzBGQlN5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzaERPenRKUVVWRUxGRkJRVkVzUjBGQlJ6dFJRVU5RTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVObUxGTkJRVk1zUlVGQlJTeE5RVUZOTEVWQlFVVXNTMEZCU3l4SlFVRkpMRU5CUVVNc1RVRkJUVHRUUVVOMFF5eERRVUZETEVOQlFVTTdTMEZEVGp0RFFVTktPenRCUXpORFJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVTkJPMEZCUTBFc1FVRkZRU3hOUVVGTkxHMUNRVUZ0UWl4SFFVRkhMRTlCUVU4c1EwRkJRenRCUVVOd1F5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExHTkJRV01zWVVGQllTeERRVUZETzBsQlEyNUVMRmRCUVZjc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFppeEpRVUZKTEV0QlFVc3NSMEZCUnl4dFFrRkJiVUlzUTBGQlF6dFJRVU5vUXl4TlFVRk5MRmxCUVZrc1IwRkJSeXh0UWtGQmJVSXNRMEZCUXp0UlFVTjZReXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMUZCUld4Q0xFbEJRVWtzVVVGQlVTeExRVUZMTEU5QlFVOHNTMEZCU3l4RlFVRkZPMWxCUXpOQ0xFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTTdVMEZEYWtJc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4blFrRkJaMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpWRE96dFJRVVZFTEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3haUVVGWkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjRRenREUVVOS096dEJRM1JEUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVsQkxFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc1MwRkJTeXhEUVVGRE8wRkJRM0JETEUxQlFVMHNiMEpCUVc5Q0xFZEJRVWNzWTBGQll5eGhRVUZoTEVOQlFVTTdTVUZEY2tRc1YwRkJWeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5tTEVsQlFVa3NTMEZCU3l4SFFVRkhMSEZDUVVGeFFpeERRVUZETzFGQlEyeERMRTFCUVUwc1dVRkJXU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMUZCUXpORExFMUJRVTBzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZiRUlzU1VGQlNTeExRVUZMTEZsQlFWa3NUMEZCVHl4RlFVRkZPMWxCUXpGQ0xFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTTdVMEZEYWtJc1RVRkJUU3hKUVVGSkxGRkJRVkVzUzBGQlN5eFBRVUZQTEV0QlFVc3NSVUZCUlR0WlFVTnNReXhKUVVGSkxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1owSkJRM0pDTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN1lVRkRhRUlzVFVGQlRTeEpRVUZKTEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3WjBKQlF6ZENMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03WVVGRGFrSXNUVUZCVFR0blFrRkRTQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGRFTTdVMEZEU2l4TlFVRk5PMWxCUTBnc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdkQ1FVRm5RaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETlVNN08xRkJSVVFzUzBGQlN5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzaERPenRKUVVWRUxFMUJRVTBzUjBGQlJ6dFJRVU5NTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVObUxGTkJRVk1zUlVGQlJTeE5RVUZOTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1RVRkJUVHRUUVVONFF5eERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3hQUVVGUExFZEJRVWM3VVVGRFRpeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRaaXhUUVVGVExFVkJRVVVzVFVGQlRTeExRVUZMTEV0QlFVc3NTVUZCU1N4RFFVRkRMRTFCUVUwN1UwRkRla01zUTBGQlF5eERRVUZETzB0QlEwNDdRMEZEU2pzN1FVTXhSRVE3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZMUVN4TlFVRk5MRk5CUVZNc1IwRkJSeXhOUVVGTk8wbEJRM0JDTEZkQlFWY3NSMEZCUnp0TFFVTmlPenRKUVVWRUxFOUJRVThzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEV0N4UFFVRlBMRWxCUVVrc2IwSkJRVzlDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRNVU03TzBsQlJVUXNTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOVUxFOUJRVThzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU40UXpzN1NVRkZSQ3hQUVVGUExFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlExZ3NUMEZCVHl4SlFVRkpMRzlDUVVGdlFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUXpGRE96dEpRVVZFTEUxQlFVMHNRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRWaXhQUVVGUExFbEJRVWtzYlVKQlFXMUNMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UzBGRGVrTTdPME5CUlVvc1EwRkJRenM3UVVGRlJpeE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzVTBGQlV5eEZRVUZGT3p0QlF6bERNVU03T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFYRkNRU3hCUVVkQkxFMUJRVTFCTEZWQlFWRXNSMEZCUnl4VFFVRlRMRU5CUVVNN08wRkJSVE5DTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWRCUVVjc1EwRkJRenRCUVVNelFpeE5RVUZOTEdOQlFXTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRla0lzVFVGQlRTeGhRVUZoTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTndRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEY0VJc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRNMElzVFVGQlRTeGxRVUZsTEVkQlFVY3NSMEZCUnl4RFFVRkRPenRCUVVVMVFpeE5RVUZOTEdWQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHBRa0ZCYVVJc1IwRkJSeXhUUVVGVExFTkJRVU03UVVGRGNFTXNUVUZCVFN4alFVRmpMRWRCUVVjc1RVRkJUU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzVlVGQlZTeERRVUZETzBGQlEzUkRMRTFCUVUwc1YwRkJWeXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU40UWl4TlFVRk5MRmRCUVZjc1IwRkJSeXhIUVVGSExFTkJRVU03TzBGQlJYaENMRTFCUVUwc1lVRkJZU3hIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU14UWl4TlFVRk5MREJDUVVFd1FpeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTjBReXhOUVVGTkxHbENRVUZwUWl4SFFVRkhMRWRCUVVjc1EwRkJRenRCUVVNNVFpeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU16UWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhoUVVGaExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlF5OUNMRTFCUVUwc1MwRkJTeXhIUVVGSExHRkJRV0VzUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzWVVGQllTeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTndReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEVOQlFVTTdPMEZCUlRGQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxPMGxCUTNKQ0xFOUJRVThzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03UTBGRGFFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eERRVUZETEVsQlFVazdTVUZEY2tJc1RVRkJUU3hOUVVGTkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVNdlFpeFBRVUZQTEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNTVUZCU1N4TlFVRk5MRWxCUVVrc1kwRkJZeXhEUVVGRE8wTkJRemxGTEVOQlFVTTdPenM3T3pzN1FVRlBSaXhOUVVGTkxGVkJRVlVzUjBGQlJ5eE5RVUZOTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEdOQlFXTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenM3UVVGRmVFVXNUVUZCVFN4elFrRkJjMElzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08wRkJSWHBFTEVGQllVRTdPenM3T3pzN096dEJRVk5CTEUxQlFVMHNZVUZCWVN4SFFVRkhMRU5CUVVNc1NVRkJTU3hYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NjMEpCUVhOQ0xFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJRenM3UVVGRmRFWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhMUVVGTE8wbEJRMmhFTEUxQlFVMHNVMEZCVXl4SFFVRkhMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRE4wSXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4bFFVRmxMRU5CUVVNN1NVRkRkRU1zVDBGQlR5eERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMGxCUTNCQ0xFOUJRVThzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU3l4RFFVRkRPMGxCUXpGQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEV0QlFVc3NSMEZCUnl4VFFVRlRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRE8wbEJRelZGTEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVThzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0RFFVTnlRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNVMEZCVXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVNdlF5eE5RVUZOTEV0QlFVc3NTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRE4wSXNUVUZCVFN4bFFVRmxMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhFTEUxQlFVMHNWVUZCVlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRrTXNUVUZCVFN4eFFrRkJjVUlzUjBGQlJ5d3dRa0ZCTUVJc1IwRkJSeXhMUVVGTExFTkJRVU03U1VGRGFrVXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eFZRVUZWTEVkQlFVY3NRMEZCUXl4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyeEZMRTFCUVUwc1dVRkJXU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVVzYVVKQlFXbENMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03TzBsQlJUTkZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyNUZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4RFFVRkRPenRKUVVVelF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZETVVJc1QwRkJUeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFpRVUZaTEVOQlFVTTdTVUZEYWtNc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRMMElzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEhGQ1FVRnhRaXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU14U0N4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dEpRVU42U0N4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6bEpMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJRenRKUVVNMVF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6TklMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8wbEJReTlGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3h4UWtGQmNVSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN08wbEJSWFpITEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRKUVVOcVFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRMEZEY2tJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZOQlFWTXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NTMEZCU3p0SlFVTjRReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdTVUZEWml4UFFVRlBMRU5CUVVNc1UwRkJVeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNUMEZCVHl4RFFVRkRMRk5CUVZNc1IwRkJSeXhUUVVGVExFTkJRVU03U1VGRE9VSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEY2tJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGFFUXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPME5CUTNKQ0xFTkJRVU03T3pzN1FVRkpSaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRelZDTEUxQlFVMHNVMEZCVXl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGFFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU42UWl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZET3pzN096czdPenM3TzBGQlZYcENMRTFCUVUwc1RVRkJUU3hIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN096czdPenM3T3pzN096czdTVUZuUW5wRUxGZEJRVmNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1VVRkJVU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRM0JFTEV0QlFVc3NSVUZCUlN4RFFVRkRPenRSUVVWU0xFMUJRVTBzVTBGQlV5eEhRVUZIUXl4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF6dGhRVU40UlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dGhRVU5pTEZOQlFWTXNRMEZCUXl4VlFVRlZMRVZCUVVVc1EwRkJRenRoUVVOMlFpeExRVUZMTEVOQlFVTTdPMUZCUlZnc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03TzFGQlJUZERMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8yRkJRMjVGTEZOQlFWTXNRMEZCUXl4aFFVRmhMRU5CUVVNN1lVRkRlRUlzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGRkJRVkVzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTTdZVUZET1VVc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTTdZVUZEWml4VFFVRlRMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdZVUZETTBJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMkZCUTNwRUxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEWWl4VFFVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRE8yRkJRM0JDTEV0QlFVc3NRMEZCUXpzN1VVRkZXQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dGhRVU42UkN4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMklzVTBGQlV5eERRVUZETEZOQlFWTXNRMEZCUXp0aFFVTndRaXhMUVVGTExFTkJRVU03TzFGQlJWZ3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6dGhRVU40UlN4UlFVRlJMRVZCUVVVN1lVRkRWaXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETzJGQlEyWXNTMEZCU3l4RFFVRkRPMHRCUTJRN08wbEJSVVFzVjBGQlZ5eHJRa0ZCYTBJc1IwRkJSenRSUVVNMVFpeFBRVUZQTzFsQlEwZ3NaVUZCWlR0WlFVTm1MR2xDUVVGcFFqdFpRVU5xUWl4alFVRmpPMWxCUTJRc2EwSkJRV3RDTzFsQlEyeENMRmRCUVZjN1dVRkRXQ3hYUVVGWE8xTkJRMlFzUTBGQlF6dExRVU5NT3p0SlFVVkVMR2xDUVVGcFFpeEhRVUZITzFGQlEyaENMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRSUVVOc1F5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRemxFT3p0SlFVVkVMRzlDUVVGdlFpeEhRVUZITzFGQlEyNUNMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExHbENRVUZwUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNM1JDeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU14UWpzN096czdPenM3U1VGUlJDeFRRVUZUTEVkQlFVYzdVVUZEVWl4UFFVRlBMR0ZCUVdFc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZEYmtNN096czdPenM3TzBsQlVVUXNVVUZCVVN4SFFVRkhPMUZCUTFBc1QwRkJUeXhKUVVGSkxFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTMEZETTBJN096czdPenM3U1VGUFJDeEpRVUZKTEVsQlFVa3NSMEZCUnp0UlFVTlFMRTlCUVU4c1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXhRanM3T3pzN096dEpRVTlFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpOQ08wbEJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZPMUZCUTJoQ0xFbEJRVWtzU1VGQlNTeExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMWxCUTNSRExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE8xTkJRMjVETEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0WlFVTXpRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVOb1JEdExRVU5LT3pzN096czdPenRKUVZGRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6VkNPMGxCUTBRc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTzFGQlEyWXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVVUZETVVJc1NVRkJTU3hKUVVGSkxFdEJRVXNzVFVGQlRTeEZRVUZGTzFsQlEycENMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTTdVMEZEYmtNc1RVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNVMEZCVXl4RlFVRkZMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eERRVUZETzFOQlEyNUVPMHRCUTBvN096czdPenM3U1VGUFJDeEpRVUZKTEZkQlFWY3NSMEZCUnp0UlFVTmtMRTlCUVU4c1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVNM1JUdEpRVU5FTEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVObUxFbEJRVWtzU1VGQlNTeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTmFMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFsQlEyUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03VTBGRGFrSXNTMEZCU3p0WlFVTkdMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJwQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTFnc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVMEZEWkR0TFFVTktPenM3T3pzN08wbEJUMFFzWTBGQll5eEhRVUZITzFGQlEySXNUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF6dExRVU53UXpzN096czdPenRKUVU5RUxFbEJRVWtzUTBGQlF5eEhRVUZITzFGQlEwb3NUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEzWkNPMGxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlExSXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYmtJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRhRU03T3pzN096czdTVUZQUkN4SlFVRkpMRU5CUVVNc1IwRkJSenRSUVVOS0xFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVOMlFqdEpRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSVHRSUVVOU0xFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRMjVDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEyaERPenM3T3pzN08wbEJUMFFzU1VGQlNTeFJRVUZSTEVkQlFVYzdVVUZEV0N4UFFVRlBMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZET1VJN1NVRkRSQ3hKUVVGSkxGRkJRVkVzUTBGQlF5eEpRVUZKTEVWQlFVVTdVVUZEWml4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRFppeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8xTkJRM0JETEUxQlFVMDdXVUZEU0N4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVsQlFVa3NSMEZCUnl4alFVRmpMRU5CUVVNN1dVRkRha1FzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZWQlFWVXNSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzFOQlEzSkVPMHRCUTBvN096czdPenM3TzBsQlVVUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTm9RaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4VlFVRlZMRVZCUVVVc1EwRkJReXhEUVVGRE8xbEJRemxDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTTNReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMR1ZCUVdVc1JVRkJSVHRuUWtGRE1VTXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzJsQ1FVTmFPMkZCUTBvc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFVEdExRVU5LT3pzN096czdPenM3U1VGVFJDeE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTFnc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTm9RaXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0WlFVTnlRaXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMR05CUVdNc1JVRkJSVHRuUWtGRGVrTXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzI5Q1FVTlVMRTFCUVUwN2FVSkJRMVE3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3U1VGUFJDeE5RVUZOTEVkQlFVYzdVVUZEVEN4UFFVRlBMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzB0QlF5OUNPenM3T3pzN096czdTVUZUUkN4VFFVRlRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJRMlFzU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVN1dVRkROME1zU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRia0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVU3WjBKQlEyeEVMRTFCUVUwc1JVRkJSVHR2UWtGRFNpeEhRVUZITEVWQlFVVXNTVUZCU1R0dlFrRkRWQ3hOUVVGTk8ybENRVU5VTzJGQlEwb3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRVRHRMUVVOS096czdPenM3T3pzN096czdTVUZaUkN4TlFVRk5MRU5CUVVNc1QwRkJUeXhGUVVGRkxFOUJRVThzUlVGQlJTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRSUVVOeVJDeE5RVUZOTEV0QlFVc3NSMEZCUnl4UFFVRlBMRWRCUVVjc1lVRkJZU3hEUVVGRE8xRkJRM1JETEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRE0wSXNUVUZCVFN4TlFVRk5MRWRCUVVjc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVU0zUWl4TlFVRk5MRk5CUVZNc1IwRkJSeXhSUVVGUkxFZEJRVWNzUzBGQlN5eERRVUZET3p0UlFVVnVReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRmRCUVZjc1EwRkJRenM3VVVGRk0wSXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVU3V1VGRFppeFZRVUZWTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03VTBGRGRrUTdPMUZCUlVRc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlR0WlFVTnlRaXhQUVVGUExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETzFsQlEzaERMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1pETEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNwRU96dFJRVVZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE96dFJRVVUxUXl4UlFVRlJMRWxCUVVrc1EwRkJReXhKUVVGSk8xRkJRMnBDTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY0VRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY0VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNSRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bEVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTktMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzUkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTndSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRemxFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU55UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGVrUXNUVUZCVFR0VFFVTlVPMUZCUTBRc1VVRkJVVHRUUVVOUU96czdVVUZIUkN4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZETVVNN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRFJDeFZRVUZSTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN08wRkRjR2RDTDBNN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGSlFTeE5RVUZOUVN4VlFVRlJMRWRCUVVjc1dVRkJXU3hEUVVGRE96czdRVUZIT1VJc1RVRkJUVVVzYVVKQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeGpRVUZqTEVkQlFVY3NUVUZCVFN4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTm9ReXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRlZCUVZVc1EwRkJRenM3TzBGQlIzUkRMRTFCUVUxRExGRkJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEZGQlFWRXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE96czdPenM3T3pzN096czdPenM3T3pzN096dEJRVzlDTDBJc1RVRkJUU3hUUVVGVExFZEJRVWNzWTBGQll5eHJRa0ZCYTBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6czdPenM3T3pzN096czdPenRKUVdFMVJDeFhRVUZYTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeFBRVUZQTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVN1VVRkROVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdPMUZCUlZJc1RVRkJUU3hWUVVGVkxFZEJRVWRHTEd0Q1FVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRReXhwUWtGQlpTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZSU3hKUVVGSkxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVTdXVUZEY0VKRExGRkJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRFJDeHBRa0ZCWlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5PMWxCUTBnc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRFJEUVVFMFF5eERRVUZETEVOQlFVTTdVMEZET1VVN08xRkJSVVFzVFVGQlRTeFRRVUZUTEVkQlFVZEVMR3RDUVVGUkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETjBVc1NVRkJTU3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEyNUNMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RlFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFRRVU5vUkN4TlFVRk5PMWxCUTBnc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMREpEUVVFeVF5eERRVUZETEVOQlFVTTdVMEZETjBVN08xRkJSVVFzVFVGQlRTeFZRVUZWTEVkQlFVZEJMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtZc1NVRkJTU3hWUVVGVkxFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEzQkNMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUTNoQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5PenRaUVVWSUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU03VTBGRGVrTTdPMUZCUlVRc1RVRkJUU3haUVVGWkxFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFOUJRVThzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTTdZVUZEYkVZc1RVRkJUU3hGUVVGRkxFTkJRVU03VVVGRFpDeEpRVUZKTEZsQlFWa3NRMEZCUXl4UFFVRlBMRVZCUVVVN1dVRkRkRUlzVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1QwRkJUeXhEUVVGRExFTkJRVU03V1VGRE5VSXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhyUWtGQmEwSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJRenRUUVVOc1JDeE5RVUZOT3p0WlFVVklMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dFRRVU0xUXp0TFFVTktPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JUXl4cFFrRkJaVHRaUVVObUxHTkJRV003V1VGRFpDeGxRVUZsTzFsQlEyWXNhMEpCUVd0Q08xTkJRM0pDTEVOQlFVTTdTMEZEVERzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0TFFVTnVRanM3U1VGRlJDeHZRa0ZCYjBJc1IwRkJSenRMUVVOMFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlQwTXNVVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN096czdPenRKUVU5RUxFbEJRVWtzU1VGQlNTeEhRVUZITzFGQlExQXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpORU8wbEJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRek5DTEVsQlFVa3NTVUZCU1N4TFFVRkxMRkZCUVZFc1JVRkJSVHRaUVVOdVFpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8xTkJRM3BETEUxQlFVMDdXVUZEU0N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTm9SRHRMUVVOS096czdPenM3TzBsQlQwUXNVMEZCVXl4SFFVRkhPMUZCUTFJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFsQlEyeENMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMR2RDUVVGblFpeEZRVUZGTzJkQ1FVTTFSQ3hOUVVGTkxFVkJRVVU3YjBKQlEwb3NUVUZCVFN4RlFVRkZMRWxCUVVrN2FVSkJRMlk3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMUZCUTBRc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRla0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4clFrRkJhMElzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTTFReXhQUVVGUExFbEJRVWtzUTBGQlF6dExRVU5tT3pzN096dEpRVXRFTEU5QlFVOHNSMEZCUnp0UlFVTk9MRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dExRVU0xUXpzN096czdPenRKUVU5RUxFbEJRVWtzVDBGQlR5eEhRVUZITzFGQlExWXNUMEZCVHl4SlFVRkpMRXRCUVVzc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTjBRenM3T3pzN096dEpRVTlFTEZGQlFWRXNSMEZCUnp0UlFVTlFMRTlCUVU4c1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNwQ096czdPenM3T3pzN1NVRlRSQ3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlExWXNUVUZCVFN4SlFVRkpMRWRCUVVjc1VVRkJVU3hMUVVGTExFOUJRVThzUzBGQlN5eEhRVUZITEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRE8xRkJRelZFTEU5QlFVOHNTMEZCU3l4TFFVRkxMRWxCUVVrc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXp0TFFVTXZRenREUVVOS0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU5JTEZWQlFWRXNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenM3T3pzN096czdPMEZCVTJ4RUxFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc1NVRkJTU3hUUVVGVExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6czdRVU5xVDNSRk96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlJVRXNUVUZCVFVFc1ZVRkJVU3hIUVVGSExHbENRVUZwUWl4RFFVRkRPenM3T3pzN08wRkJUMjVETEUxQlFVMHNZVUZCWVN4SFFVRkhMR05CUVdNc1YwRkJWeXhEUVVGRE96czdPenRKUVVzMVF5eFhRVUZYTEVkQlFVYzdVVUZEVml4TFFVRkxMRVZCUVVVc1EwRkJRenRMUVVOWU96dEpRVVZFTEdsQ1FVRnBRaXhIUVVGSE8xRkJRMmhDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeEZRVUZGTzFsQlF6RkNMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zY1VKQlFYRkNMRU5CUVVNc1EwRkJRenRUUVVNelF6czdVVUZGUkN4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVVzUTBGQlF5eExRVUZMTEV0QlFVczdPMWxCUlM5RExFbEJRVWtzUTBGQlF5eFBRVUZQTzJsQ1FVTlFMRTFCUVUwc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdhVUpCUXpORExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFTkJRVU03VTBGRGJFTXNRMEZCUXl4RFFVRkRPMHRCUTA0N08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3T3pzN096czdTVUZQUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlEwa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOeVJEdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTktMRlZCUVZFc1JVRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF6czdRVU12UkhSRU96czdPenM3T3pzN096czdPenM3T3pzN096dEJRVzlDUVN4QlFVMUJMRTFCUVUxQkxGZEJRVkVzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenM3UVVGRmJFTXNUVUZCVFN4blFrRkJaMElzUjBGQlJ5eEhRVUZITEVOQlFVTTdRVUZETjBJc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRiRU1zVFVGQlRTdzRRa0ZCT0VJc1IwRkJSeXhMUVVGTExFTkJRVU03UVVGRE4wTXNUVUZCVFN3MlFrRkJOa0lzUjBGQlJ5eExRVUZMTEVOQlFVTTdRVUZETlVNc1RVRkJUU3c0UWtGQk9FSXNSMEZCUnl4TFFVRkxMRU5CUVVNN08wRkJSVGRETEUxQlFVMHNTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOb1FpeE5RVUZOTEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNN08wRkJSV2hDTEUxQlFVMHNZVUZCWVN4SFFVRkhMRWxCUVVrc1IwRkJSeXhuUWtGQlowSXNRMEZCUXp0QlFVTTVReXhOUVVGTkxHTkJRV01zUjBGQlJ5eEpRVUZKTEVkQlFVY3NaMEpCUVdkQ0xFTkJRVU03UVVGREwwTXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6czdRVUZGYUVRc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZET3p0QlFVVndRaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4UlFVRlJMRU5CUVVNN1FVRkRiRU1zVFVGQlRTeHZRa0ZCYjBJc1IwRkJSeXhaUVVGWkxFTkJRVU03UVVGRE1VTXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eFZRVUZWTEVOQlFVTTdRVUZEZEVNc1RVRkJUU3huUTBGQlowTXNSMEZCUnl4M1FrRkJkMElzUTBGQlF6dEJRVU5zUlN4TlFVRk5MQ3RDUVVFclFpeEhRVUZITEhWQ1FVRjFRaXhEUVVGRE8wRkJRMmhGTEUxQlFVMHNaME5CUVdkRExFZEJRVWNzZDBKQlFYZENMRU5CUVVNN1FVRkRiRVVzVFVGQlRTeDFRa0ZCZFVJc1IwRkJSeXhsUVVGbExFTkJRVU03TzBGQlJXaEVMRTFCUVUwc1YwRkJWeXhIUVVGSExFTkJRVU1zV1VGQldTeEZRVUZGTEdGQlFXRXNSMEZCUnl4RFFVRkRMRXRCUVVzN1NVRkRja1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRmxCUVZrc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU14UXl4UFFVRlBMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NZVUZCWVN4SFFVRkhMRTFCUVUwc1EwRkJRenREUVVONFJDeERRVUZET3p0QlFVVkdMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4WlFVRlpMRVZCUVVVc1dVRkJXU3hMUVVGTE8wbEJRM1JFTEU5QlFVOURMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXp0VFFVTm9ReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEySXNVMEZCVXl4RFFVRkRMRmxCUVZrc1EwRkJRenRUUVVOMlFpeExRVUZMTEVOQlFVTTdRMEZEWkN4RFFVRkRPenRCUVVWR0xFMUJRVTBzTUVKQlFUQkNMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTm9SU3hKUVVGSkxFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1VVRkROVUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NUMEZCVHl4RFFVRkRMRmxCUVZrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU12UXl4UFFVRlBMR2xDUVVGcFFpeERRVUZETEZkQlFWY3NSVUZCUlN4WlFVRlpMRU5CUVVNc1EwRkJRenRMUVVOMlJEdEpRVU5FTEU5QlFVOHNXVUZCV1N4RFFVRkRPME5CUTNaQ0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhoUVVGaExFVkJRVVVzVTBGQlV5eEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTXpSQ3hKUVVGSkxGTkJRVk1zUzBGQlN5eGhRVUZoTEVsQlFVa3NUVUZCVFN4TFFVRkxMR0ZCUVdFc1JVRkJSVHRSUVVONlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0TFFVTm1MRTFCUVUwc1NVRkJTU3hQUVVGUExFdEJRVXNzWVVGQllTeEZRVUZGTzFGQlEyeERMRTlCUVU4c1MwRkJTeXhEUVVGRE8wdEJRMmhDTEUxQlFVMDdVVUZEU0N4UFFVRlBMRmxCUVZrc1EwRkJRenRMUVVOMlFqdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3h0UWtGQmJVSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVVVzV1VGQldTeExRVUZMTzBsQlEzcEVMRWxCUVVrc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0UlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJReTlETEU5QlFVOHNWVUZCVlN4RFFVRkRMRmRCUVZjc1JVRkJSU3hEUVVGRExGZEJRVmNzUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxGbEJRVmtzUTBGQlF5eERRVUZETzB0QlEyeEdPenRKUVVWRUxFOUJRVThzV1VGQldTeERRVUZETzBOQlEzWkNMRU5CUVVNN096dEJRVWRHTEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU01UWl4TlFVRk5MR05CUVdNc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlEzSkRMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3UVVGRmVrTXNUVUZCVFN4UFFVRlBMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXNzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdPMEZCUlM5RUxFMUJRVTBzV1VGQldTeEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxPMGxCUXpWQ0xFbEJRVWtzVTBGQlV5eExRVUZMTEd0Q1FVRnJRaXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0UlFVTTNReXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkRPenRKUVVWRUxFOUJRVThzYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzBOQlEzaERMRU5CUVVNN08wRkJSVVlzVFVGQlRTeGxRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1RVRkJUU3hMUVVGTE8wbEJRM1pETEd0Q1FVRnJRaXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETzBOQlF5OUVMRU5CUVVNN08wRkJSVVlzVFVGQlRTeFBRVUZQTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzc1dVRkJXU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE96dEJRVVZ5UlN4TlFVRk5MRmRCUVZjc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1MwRkJTenRKUVVNNVF5eEpRVUZKTEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRSUVVOb1FpeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdPMUZCUlRGRUxFdEJRVXNzVFVGQlRTeEhRVUZITEVsQlFVa3NTVUZCU1N4RlFVRkZPMWxCUTNCQ0xFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0VFFVTTNRenRMUVVOS08wTkJRMG9zUTBGQlF6czdPenRCUVVsR0xFMUJRVTBzU1VGQlNTeEhRVUZITEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETzBGQlEzUkRMRTFCUVUwc1NVRkJTU3hIUVVGSExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFpRVUZaTEVkQlFVY3NUVUZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRE8wRkJRelZETEUxQlFVMHNVVUZCVVN4SFFVRkhMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6czdPMEZCUjNCRExFMUJRVTBzWjBOQlFXZERMRWRCUVVjc1EwRkJReXhOUVVGTkxFVkJRVVVzVDBGQlR5eEZRVUZGTEU5QlFVOHNTMEZCU3p0SlFVTnVSU3hOUVVGTkxGTkJRVk1zUjBGQlJ5eE5RVUZOTEVOQlFVTXNjVUpCUVhGQ0xFVkJRVVVzUTBGQlF6czdTVUZGYWtRc1RVRkJUU3hEUVVGRExFZEJRVWNzVDBGQlR5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1RVRkJUU3hEUVVGRExFdEJRVXNzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRkRVVzVFVGQlRTeERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRk5CUVZNc1EwRkJReXhIUVVGSExFbEJRVWtzVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03TzBsQlJYWkZMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdRMEZEYWtJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTzBsQlEyaERMRTFCUVUwc1RVRkJUU3hIUVVGSExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN096dEpRVWRzUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGFFSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRE8wbEJRMnBDTEVsQlFVa3NWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVOMlFpeEpRVUZKTEdOQlFXTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1NVRkRNVUlzU1VGQlNTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRPenRKUVVWMlFpeE5RVUZOTEU5QlFVOHNSMEZCUnl4TlFVRk5PMUZCUTJ4Q0xFbEJRVWtzU1VGQlNTeExRVUZMTEV0QlFVc3NTVUZCU1N4WlFVRlpMRXRCUVVzc1MwRkJTeXhGUVVGRk96dFpRVVV4UXl4TlFVRk5MR1ZCUVdVc1IwRkJSeXhMUVVGTExFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNSVUZCUlVrc1ZVRkJaU3hEUVVGRExFTkJRVU1zUlVGQlJVUXNWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1pITEVsQlFVa3NZMEZCWXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8yZENRVU42UWl4alFVRmpMRU5CUVVNc1UwRkJVeXhEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETzJGQlF6ZERMRTFCUVUwN1owSkJRMGdzWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRoUVVNeFF6dFpRVU5FTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN08xbEJSV0lzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUTNSQ096dFJRVVZFTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRkRUlzUTBGQlF6czdTVUZGUml4TlFVRk5MRmxCUVZrc1IwRkJSeXhOUVVGTk8xRkJRM1pDTEZkQlFWY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJTeExRVUZMTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNN1MwRkRhRVVzUTBGQlF6czdTVUZGUml4TlFVRk5MRmRCUVZjc1IwRkJSeXhOUVVGTk8xRkJRM1JDTEUxQlFVMHNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03VVVGRGFrTXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVOMFFpeERRVUZET3p0SlFVVkdMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRhRU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTMEZCU3l4RlFVRkZPenRaUVVWb1FpeE5RVUZOTEVkQlFVYzdaMEpCUTB3c1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTzJkQ1FVTm9RaXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVODdZVUZEYmtJc1EwRkJRenM3V1VGRlJpeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJUVkhMRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUczdaMEpCUlhwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiMEpCUVc5Q0xFVkJRVVU3YjBKQlF6TkVMRXRCUVVzc1IwRkJSeXhaUVVGWkxFTkJRVU03YjBKQlEzSkNMRmxCUVZrc1JVRkJSU3hEUVVGRE8ybENRVU5zUWl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN2IwSkJRMjVETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRMklzV1VGQldTeEZRVUZGTEVOQlFVTTdhVUpCUTJ4Q0xFMUJRVTBzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdHZRa0ZEY0VNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dHBRa0ZEYUVJN1lVRkRTanM3VTBGRlNqdExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hsUVVGbExFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZETDBJc1RVRkJUU3hqUVVGakxFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1owTkJRV2RETEVOQlFVTXNUVUZCVFN4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRWdzU1VGQlNTeFJRVUZSTEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUTNCQ0xFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJRenRUUVVOd1F5eE5RVUZOTEVsQlFVa3NTVUZCU1N4TFFVRkxMR05CUVdNc1JVRkJSVHRaUVVOb1F5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03VTBGRGFFTXNUVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEZOQlFWTXNRMEZCUXp0VFFVTnVRenRMUVVOS0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4SlFVRkpMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGNFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhKUVVGSkxGbEJRVmtzUzBGQlN5eExRVUZMTEVWQlFVVTdPenRaUVVjeFF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03TzFsQlJUbERMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzU1VGQlNTeFRRVUZUTEVkQlFVY3NSVUZCUlN4RlFVRkZPMmRDUVVOc1F5eExRVUZMTEVkQlFVY3NVVUZCVVN4RFFVRkRPMmRDUVVOcVFpeFhRVUZYTEVWQlFVVXNRMEZCUXpzN1owSkJSV1FzVFVGQlRTeDVRa0ZCZVVJc1IwRkJSeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhMUVVGTExHTkJRV01zUTBGQlF5eERRVUZETzJkQ1FVTnVSaXhYUVVGWExFTkJRVU1zUzBGQlN5eEZRVUZGTEhsQ1FVRjVRaXhEUVVGRExFTkJRVU03WjBKQlF6bERMRmRCUVZjc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03WVVGRGFFWTdVMEZEU2l4TlFVRk5MRWxCUVVrc1VVRkJVU3hMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRjRU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVndReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU03TzFsQlJURkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eFpRVUZaTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU12UXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08wdEJRMG9zUTBGQlF6czdTVUZGUml4TlFVRk5MR1ZCUVdVc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dFJRVU12UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhqUVVGakxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXZReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFMUJRVTBzV1VGQldTeEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8yZENRVU55UXl4SFFVRkhMRVZCUVVVc1kwRkJZenRuUWtGRGJrSXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRk8yZENRVU5VTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSVHRoUVVOYUxFTkJRVU1zUTBGQlF6czdXVUZGU0N4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFbEJRVWtzV1VGQldTeEhRVUZITEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6czdXVUZGTDBRc1kwRkJZeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFRRVUZUTEVOQlFVTTdVMEZETVVNN096dFJRVWRFTEdOQlFXTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRkRUlzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXpzN08xRkJSMklzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTNSQ0xFTkJRVU03T3pzN096czdPMGxCVVVZc1NVRkJTU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhqUVVGakxFdEJRVXM3VVVGRGVrTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1MwRkJTenRaUVVOdVFpeEpRVUZKTEZWQlFWVXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVTdaMEpCUXpkRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha1FzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdZVUZEZWtNN1dVRkRSQ3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMR05CUVdNc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRNVVVzUTBGQlF6dExRVU5NTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmxCUVZrc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM0pGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6czdTVUZGZGtRc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHZRa0ZCYjBJc1JVRkJSVHRSUVVNM1FpeE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VVc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmRCUVZjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UXpzN1NVRkZSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEc5Q1FVRnZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xRkJRek5FTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1MwRkRla1E3TzBsQlJVUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZWQlFWVXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRkxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhUUVVGVExFVkJRVVVzWlVGQlpTeERRVUZETEVOQlFVTTdTVUZEY0VRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3hsUVVGbExFTkJRVU1zUTBGQlF6dERRVU40UkN4RFFVRkRPenM3T3pzN096dEJRVkZHTEUxQlFVMHNXVUZCV1N4SFFVRkhMR05CUVdNc1YwRkJWeXhEUVVGRE96czdPenRKUVVzelF5eFhRVUZYTEVkQlFVYzdVVUZEVml4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVOU0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4SFFVRkhMR05CUVdNc1EwRkJRenRSUVVOd1F5eE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRia1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU5vUkN4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0UlFVVXpRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVNeFFpeGpRVUZqTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3h4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJoRUxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1ZVRkJWU3hEUVVGRE8xbEJRemRDTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTenRaUVVOcVFpeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwN1dVRkRia0lzVDBGQlR5eEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBPMWxCUTNKQ0xGVkJRVlVzUlVGQlJTeEpRVUZKTEVOQlFVTXNWVUZCVlR0VFFVTTVRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5LTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JTEdWQlFXVTdXVUZEWml4blFrRkJaMEk3V1VGRGFFSXNiMEpCUVc5Q08xbEJRM0JDTEd0Q1FVRnJRanRaUVVOc1FpeG5RMEZCWjBNN1dVRkRhRU1zWjBOQlFXZERPMWxCUTJoRExDdENRVUVyUWp0WlFVTXZRaXgxUWtGQmRVSTdVMEZETVVJc1EwRkJRenRMUVVOTU96dEpRVVZFTEhkQ1FVRjNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeFJRVUZSTEVWQlFVVXNVVUZCVVN4RlFVRkZPMUZCUXk5RExFMUJRVTBzVFVGQlRTeEhRVUZITEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGFrTXNVVUZCVVN4SlFVRkpPMUZCUTFvc1MwRkJTeXhsUVVGbExFVkJRVVU3V1VGRGJFSXNUVUZCVFN4TFFVRkxMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTXNVVUZCVVN4RlFVRkZMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeGhRVUZoTEVOQlFVTXNRMEZCUXp0WlFVTnNSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkRNVUlzVFVGQlRTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRE5VTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUWtGQlowSXNSVUZCUlR0WlFVTnVRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eHBRa0ZCYVVJc1EwRkJReXhSUVVGUkxFVkJRVVVzVjBGQlZ5eERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMR05CUVdNc1EwRkJReXhEUVVGRE8xbEJRM0JHTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF6dFpRVU0xUWl4TlFVRk5MRU5CUVVNc1dVRkJXU3hEUVVGRExHZENRVUZuUWl4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc2IwSkJRVzlDTEVWQlFVVTdXVUZEZGtJc1RVRkJUU3hWUVVGVkxFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlF6VkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeEhRVUZITEZWQlFWVXNRMEZCUXp0WlFVTndReXhOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEd0Q1FVRnJRaXhGUVVGRk8xbEJRM0pDTEUxQlFVMHNUMEZCVHl4SFFVRkhMR2xDUVVGcFFpeERRVUZETEZGQlFWRXNSVUZCUlN4WFFVRlhMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1EwRkJRenRaUVVOMlJpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1IwRkJSeXhQUVVGUExFTkJRVU03V1VGRE9VSXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUTBGQlowTXNSVUZCUlR0WlFVTnVReXhOUVVGTkxHZENRVUZuUWl4SFFVRkhTQ3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4UlFVRlJMRVZCUVVVc1ZVRkJWU3hEUVVGRExGRkJRVkVzUlVGQlJTeG5RMEZCWjBNc1JVRkJSU3c0UWtGQk9FSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRMnhLTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zWjBKQlFXZENMRU5CUVVNN1dVRkRka01zVFVGQlRUdFRRVU5VTzFGQlEwUXNVMEZCVXl4QlFVVlNPMU5CUTBFN08xRkJSVVFzVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNKQ096dEpRVVZFTEdsQ1FVRnBRaXhIUVVGSE8xRkJRMmhDTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eGxRVUZsTEVWQlFVVXNUVUZCVFR0WlFVTjZReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMmRDUVVObUxGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRjRVE3VTBGRFNpeERRVUZETEVOQlFVTTdPMUZCUlVnc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMDdXVUZETTBNc1YwRkJWeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSQ3hsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROMElzUTBGQlF5eERRVUZETzB0QlEwNDdPMGxCUlVRc2IwSkJRVzlDTEVkQlFVYzdTMEZEZEVJN08wbEJSVVFzWlVGQlpTeEhRVUZITzB0QlEycENPenM3T3pzN08wbEJUMFFzU1VGQlNTeE5RVUZOTEVkQlFVYzdVVUZEVkN4UFFVRlBMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETlVJN096czdPenM3TzBsQlVVUXNTVUZCU1N4SlFVRkpMRWRCUVVjN1VVRkRVQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU5MTEZWQlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRiRVE3T3pzN096czdTVUZQUkN4SlFVRkpMRzFDUVVGdFFpeEhRVUZITzFGQlEzUkNMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eHRRa0ZCYlVJc1EwRkJRenRMUVVNeFF6czdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlR5d3dRa0ZCTUVJc1EwRkJReXhKUVVGSkxFVkJRVVVzWlVGQlpTeEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkRPMHRCUXpORk96czdPenM3U1VGTlJDeEpRVUZKTEUxQlFVMHNSMEZCUnp0UlFVTlVMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR2RDUVVGblFpeEZRVUZGTEdOQlFXTXNRMEZCUXl4RFFVRkRPMHRCUXpkRk96czdPenM3U1VGTlJDeEpRVUZKTEZWQlFWVXNSMEZCUnp0UlFVTmlMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMRzlDUVVGdlFpeEZRVUZGTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03UzBGRGNrWTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEd0Q1FVRnJRaXhGUVVGRkxHZENRVUZuUWl4RFFVRkRMRU5CUVVNN1MwRkRha1k3T3pzN096dEpRVTFFTEVsQlFVa3NiMEpCUVc5Q0xFZEJRVWM3VVVGRGRrSXNUMEZCVHl4dFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNaME5CUVdkRExFVkJRVVVzT0VKQlFUaENMRU5CUVVNc1EwRkJRenRMUVVOMFJ6czdPenM3TzBsQlRVUXNTVUZCU1N4dFFrRkJiVUlzUjBGQlJ6dFJRVU4wUWl4UFFVRlBMRzFDUVVGdFFpeERRVUZETEVsQlFVa3NSVUZCUlN3clFrRkJLMElzUlVGQlJTdzJRa0ZCTmtJc1EwRkJReXhEUVVGRE8wdEJRM0JIT3pzN096czdTVUZOUkN4SlFVRkpMRzlDUVVGdlFpeEhRVUZITzFGQlEzWkNMRTlCUVU4c2JVSkJRVzFDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR2REUVVGblF5eEZRVUZGTERoQ1FVRTRRaXhEUVVGRExFTkJRVU03UzBGRGRFYzdPenM3T3pzN096dEpRVk5FTEVsQlFVa3NXVUZCV1N4SFFVRkhPMUZCUTJZc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc2RVSkJRWFZDTEVWQlFVVXNjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dExRVU16UmpzN096czdPenM3TzBsQlUwUXNTVUZCU1N4WFFVRlhMRWRCUVVjN1VVRkRaQ3hKUVVGSkxGVkJRVlVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRSQ3hWUVVGbExFTkJRVU1zUTBGQlF6dFJRVU55UkN4SlFVRkpMRWxCUVVrc1MwRkJTeXhWUVVGVkxFVkJRVVU3V1VGRGNrSXNWVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU5CTEZWQlFXVXNRMEZCUXl4RFFVRkRPMU5CUTJ4RU96dFJRVVZFTEU5QlFVOHNWVUZCVlN4RFFVRkRPMHRCUTNKQ096czdPenM3TzBsQlQwUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNUMEZCVHl4RFFVRkRPMHRCUTI1RE96czdPenM3T3pzN08wbEJWVVFzVTBGQlV5eERRVUZETEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUlVGQlJUdFJRVU4wUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVTdXVUZETTBJc1RVRkJUU3hEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzFOQlEzUkNPMUZCUTBRc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzaERMRmRCUVZjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzB0QlEzQkNPenM3T3pzN096czdPenM3T3pzN096czdPMGxCYlVKRUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUTJoQ0xFOUJRVThzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4TlFVRk5MRmxCUVZrc1RVRkJUU3hIUVVGSExFMUJRVTBzUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRMjVHT3pzN096czdPMGxCVDBRc1UwRkJVeXhEUVVGRExFZEJRVWNzUlVGQlJUdFJRVU5ZTEVsQlFVa3NSMEZCUnl4RFFVRkRMRlZCUVZVc1NVRkJTU3hIUVVGSExFTkJRVU1zVlVGQlZTeExRVUZMTEVsQlFVa3NSVUZCUlR0WlFVTXpReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMU5CUTNwQ08wdEJRMG83T3pzN096czdPenM3T3pzN096czdPMGxCYVVKRUxGTkJRVk1zUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUTI1Q0xFOUJRVThzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4WFFVRlhMRU5CUVVNc1RVRkJUU3haUVVGWkxGTkJRVk1zUjBGQlJ5eE5RVUZOTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU55UnpzN096czdPenRKUVU5RUxGbEJRVmtzUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEYWtJc1NVRkJTU3hOUVVGTkxFTkJRVU1zVlVGQlZTeEpRVUZKTEUxQlFVMHNRMEZCUXl4VlFVRlZMRXRCUVVzc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJUdFpRVU0zUkN4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExGZEJRVmNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0VFFVTjRRenRMUVVOS096dERRVVZLTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTk1MRmRCUVZFc1JVRkJSU3haUVVGWkxFTkJRVU1zUTBGQlF6czdRVU16YkVKeVJEczdPenM3T3pzN096czdPenM3T3pzN08wRkJhMEpCTEVGQlMwRXNUVUZCVFN4RFFVRkRMR0ZCUVdFc1IwRkJSeXhOUVVGTkxFTkJRVU1zWVVGQllTeEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRkRla1FzVDBGQlR5eEZRVUZGTEU5QlFVODdTVUZEYUVJc1QwRkJUeXhGUVVGRkxGVkJRVlU3U1VGRGJrSXNUMEZCVHl4RlFVRkZMREpDUVVFeVFqdEpRVU53UXl4WlFVRlpMRVZCUVVVc1dVRkJXVHRKUVVNeFFpeE5RVUZOTEVWQlFVVXNUVUZCVFR0SlFVTmtMRk5CUVZNc1JVRkJSU3hUUVVGVE8wbEJRM0JDTEdGQlFXRXNSVUZCUlN4aFFVRmhPME5CUXk5Q0xFTkJRVU1zUTBGQlF5SjkifQ==
