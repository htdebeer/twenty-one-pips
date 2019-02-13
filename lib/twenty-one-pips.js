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

const addDie = (board) => {
    updateReadyDice(board, 1);
    if (isReady(board)) {
        updateBoard(board, board.layout.layout(board.dice));
    }
};

const removeDie = (board) => {
    updateBoard(board, board.layout.layout(board.dice));
    updateReadyDice(board, -1);
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
        this.addEventListener("top-die:added", () => addDie(this));
        this.addEventListener("top-die:removed", () => removeDie(this));

        // Add dice that are already in the DOM
        this.dice.forEach(() => addDie(this));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcERpZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJUb3BEaWNlQm9hcmQuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgRlVMTF9DSVJDTEVfSU5fREVHUkVFUyA9IDM2MDtcblxuY29uc3QgcmFuZG9taXplQ2VudGVyID0gKG4pID0+IHtcbiAgICByZXR1cm4gKDAuNSA8PSBNYXRoLnJhbmRvbSgpID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbCkuY2FsbCgwLCBuKTtcbn07XG5cbi8vIFByaXZhdGUgZmllbGRzXG5jb25zdCBfd2lkdGggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlaWdodCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29scyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm93cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGljZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGllU2l6ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGlzcGVyc2lvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRlID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmlkTGF5b3V0Q29uZmlndXJhdGlvblxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy53aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoIG9mIHRoaXNcbiAqIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLjtcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuaGVpZ2h0XSAtIFRoZSBtaW5pbWFsIGhlaWdodCBvZlxuICogdGhpcyBHcmlkTGF5b3V0IGluIHBpeGVscy4uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpc3BlcnNpb24gLSBUaGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIG9mIHRoZVxuICogbGF5b3V0IGEgZGllIGNhbiBiZSBsYXlvdXQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAqL1xuXG4vKipcbiAqIEdyaWRMYXlvdXQgaGFuZGxlcyBsYXlpbmcgb3V0IHRoZSBkaWNlIG9uIGEgRGljZUJvYXJkLlxuICovXG5jb25zdCBHcmlkTGF5b3V0ID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0dyaWRMYXlvdXRDb25maWd1cmF0aW9ufSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgR3JpZExheW91dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgZGlzcGVyc2lvbixcbiAgICAgICAgZGllU2l6ZVxuICAgIH0gPSB7fSkge1xuICAgICAgICBfZGljZS5zZXQodGhpcywgW10pO1xuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgMSk7XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIDApO1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICB0aGlzLmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICogQHRocm93cyBDb25maWd1cmF0aW9uRXJyb3IgV2lkdGggPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9IFxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIF93aWR0aC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IHdpZHRoKHcpIHtcbiAgICAgICAgaWYgKDAgPiB3KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBXaWR0aCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke3d9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgdyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBcbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBIZWlnaHQgPj0gMFxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gX2hlaWdodC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGhlaWdodChoKSB7XG4gICAgICAgIGlmICgwID4gaCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgSGVpZ2h0IHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7aH0nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2hlaWdodC5zZXQodGhpcywgaCk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIGxheW91dCBvbiB0aGlzIEdyaWRMYXlvdXQuIFRoaXNcbiAgICAgKiBudW1iZXIgaXMgPj0gMC4gUmVhZCBvbmx5LlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbHMgKiB0aGlzLl9yb3dzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBUaGUgZGlzcGVyc2lvbiBsZXZlbFxuICAgICAqIGluZGljYXRlcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIGRpY2UgY2FuIGJlIGxheW91dC4gVXNlIDEgZm9yIGFcbiAgICAgKiB0aWdodCBwYWNrZWQgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyBDb25maWd1cmF0aW9uRXJyb3IgRGlzcGVyc2lvbiA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGlzcGVyc2lvbihkKSB7XG4gICAgICAgIGlmICgwID4gZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgRGlzcGVyc2lvbiBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2R9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5zZXQodGhpcywgZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBEaWVTaXplID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gX2RpZVNpemUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaWVTaXplKGRzKSB7XG4gICAgICAgIGlmICgwID49IGRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBkaWVTaXplIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAxLCBnb3QgJyR7ZHN9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCBkcyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdldCByb3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBfcm90YXRlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gciA/IHRydWUgOiByO1xuICAgIH1cblxuICAgIHNldCByb3RhdGUocikge1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIHJvd3MsIDAgPCByb3dzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9yb3dzKCkge1xuICAgICAgICByZXR1cm4gX3Jvd3MuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2YgY29sdW1ucywgMCA8IGNvbHVtbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NvbHMoKSB7XG4gICAgICAgIHJldHVybiBfY29scy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNlbnRlciBjZWxsIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNlbnRlciAocm93LCBjb2wpLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9yb3dzIC8gMikgLSAxO1xuICAgICAgICBjb25zdCBjb2wgPSByYW5kb21pemVDZW50ZXIodGhpcy5fY29scyAvIDIpIC0gMTtcblxuICAgICAgICByZXR1cm4ge3JvdywgY29sfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXlvdXQgZGljZSBvbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZVtdfSBkaWNlIC0gVGhlIGRpY2UgdG8gbGF5b3V0IG9uIHRoaXMgTGF5b3V0LlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7Q29uZmlndXJhdGlvbkVycm9yfSBUaGUgbnVtYmVyIG9mXG4gICAgICogZGljZSBzaG91bGQgbm90IGV4Y2VlZCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGlzIExheW91dCBjYW5cbiAgICAgKiBsYXlvdXQuXG4gICAgICovXG4gICAgbGF5b3V0KGRpY2UpIHtcbiAgICAgICAgaWYgKGRpY2UubGVuZ3RoID4gdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBUaGUgbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IGlzICR7dGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlfSwgZ290ICR7ZGljZS5sZW5naHR9IGRpY2UgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlMYXlvdXREaWNlID0gW107XG4gICAgICAgIGNvbnN0IGRpY2VUb0xheW91dCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGlmIChkaWUuaGFzQ29vcmRpbmF0ZXMoKSAmJiBkaWUuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEaWNlIHRoYXQgYXJlIGJlaW5nIGhlbGQgYW5kIGhhdmUgYmVlbiBsYXlvdXQgYmVmb3JlIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIGtlZXAgdGhlaXIgY3VycmVudCBjb29yZGluYXRlcyBhbmQgcm90YXRpb24uIEluIG90aGVyIHdvcmRzLFxuICAgICAgICAgICAgICAgIC8vIHRoZXNlIGRpY2UgYXJlIHNraXBwZWQuXG4gICAgICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWNlVG9MYXlvdXQucHVzaChkaWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5taW4oZGljZS5sZW5ndGggKiB0aGlzLmRpc3BlcnNpb24sIHRoaXMubWF4aW11bU51bWJlck9mRGljZSk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzID0gdGhpcy5fY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2VUb0xheW91dCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhdmFpbGFibGVDZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tQ2VsbCA9IGF2YWlsYWJsZUNlbGxzW3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUNlbGxzLnNwbGljZShyYW5kb21JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGRpZS5jb29yZGluYXRlcyA9IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMocmFuZG9tQ2VsbCk7XG4gICAgICAgICAgICBkaWUucm90YXRpb24gPSB0aGlzLnJvdGF0ZSA/IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMpIDogbnVsbDtcbiAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgcmV0dXJuIGFscmVhZHlMYXlvdXREaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYSBsaXN0IHdpdGggYXZhaWxhYmxlIGNlbGxzIHRvIHBsYWNlIGRpY2Ugb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4IC0gVGhlIG51bWJlciBlbXB0eSBjZWxscyB0byBjb21wdXRlLlxuICAgICAqIEBwYXJhbSB7VG9wRGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IHdpdGggZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGNlbGxzIHJlcHJlc2VudGVkIGJ5IHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBsZXZlbCA9IDA7XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gTWF0aC5taW4odGhpcy5fcm93cywgdGhpcy5fY29scyk7XG5cbiAgICAgICAgd2hpbGUgKGF2YWlsYWJsZS5zaXplIDwgbWF4ICYmIGxldmVsIDwgbWF4TGV2ZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsc09uTGV2ZWwobGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCAhPT0gY2VsbCAmJiB0aGlzLl9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlLmFkZChjZWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldmVsKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhdmFpbGFibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSBhbGwgY2VsbHMgb24gbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSBUaGUgbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuIDBcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGNlbnRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NldDxOdW1iZXI+fSB0aGUgY2VsbHMgb24gdGhlIGxldmVsIGluIHRoaXMgbGF5b3V0IHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxzT25MZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zdCBjZWxscyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5fY2VudGVyO1xuXG4gICAgICAgIGlmICgwID09PSBsZXZlbCkge1xuICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcihjZW50ZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IGNlbnRlci5yb3cgLSBsZXZlbDsgcm93IDw9IGNlbnRlci5yb3cgKyBsZXZlbDsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCAtIGxldmVsfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sICsgbGV2ZWx9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IGNlbnRlci5jb2wgLSBsZXZlbCArIDE7IGNvbCA8IGNlbnRlci5jb2wgKyBsZXZlbDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgLSBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyArIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyBjZWxsIGNvbnRhaW4gYSBjZWxsIGZyb20gYWxyZWFkeUxheW91dERpY2U/XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY2VsbCAtIEEgY2VsbCBpbiBsYXlvdXQgcmVwcmVzZW50ZWQgYnkgYSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtUb3BEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgb2YgZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgY2VsbCBkb2VzIG5vdCBjb250YWluIGEgZGllLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IGFscmVhZHlMYXlvdXREaWNlLmZpbmQoZGllID0+IGNlbGwgPT09IHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIG51bWJlciB0byBhIGNlbGwgKHJvdywgY29sKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm4gdGhlIGNlbGwgKHtyb3csIGNvbH0pIGNvcnJlc3BvbmRpbmcgbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0NlbGwobikge1xuICAgICAgICByZXR1cm4ge3JvdzogTWF0aC50cnVuYyhuIC8gdGhpcy5fY29scyksIGNvbDogbiAlIHRoaXMuX2NvbHN9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHRvIGEgbnVtYmVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gaXRzIG51bWJlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwuXG4gICAgICogUmV0dXJucyB1bmRlZmluZWQgd2hlbiB0aGUgY2VsbCBpcyBub3Qgb24gdGhlIGxheW91dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb051bWJlcih7cm93LCBjb2x9KSB7XG4gICAgICAgIGlmICgwIDw9IHJvdyAmJiByb3cgPCB0aGlzLl9yb3dzICYmIDAgPD0gY29sICYmIGNvbCA8IHRoaXMuX2NvbHMpIHtcbiAgICAgICAgICAgIHJldHVybiByb3cgKiB0aGlzLl9jb2xzICsgY29sO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgcmVwcmVzZW50ZWQgYnkgaXRzIG51bWJlciB0byB0aGVpciBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb29yZGluYXRlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsIHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhpcyBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9Db29yZGluYXRlcyhuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jZWxsVG9Db29yZHModGhpcy5fbnVtYmVyVG9DZWxsKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgcGFpciBvZiBjb29yZGluYXRlcyB0byBhIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydFxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvb3JkaW5hdGVzIGNvbnZlcnRlZCB0byBhIG51bWJlci4gSWZcbiAgICAgKiB0aGUgY29vcmRpbmF0ZXMgYXJlIG5vdCBvbiB0aGlzIGxheW91dCwgdGhlIG51bWJlciBpcyB1bmRlZmluZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRpbmF0ZXNUb051bWJlcihjb29yZHMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuX2NlbGxUb051bWJlcih0aGlzLl9jb29yZHNUb0NlbGwoY29vcmRzKSk7XG4gICAgICAgIGlmICgwIDw9IG4gJiYgbiA8IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbmFwICh4LHkpIHRvIHRoZSBjbG9zZXN0IGNlbGwgaW4gdGhpcyBMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGllY29vcmRpbmF0ZSAtIFRoZSBjb29yZGluYXRlIHRvIGZpbmQgdGhlIGNsb3Nlc3QgY2VsbFxuICAgICAqIGZvci5cbiAgICAgKiBAcGFyYW0ge1RvcERpZX0gW2RpZWNvb3JkaW5hdC5kaWUgPSBudWxsXSAtIFRoZSBkaWUgdG8gc25hcCB0by5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS54IC0gVGhlIHgtY29vcmRpbmF0ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS55IC0gVGhlIHktY29vcmRpbmF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudWxsfSBUaGUgY29vcmRpbmF0ZSBvZiB0aGUgY2VsbCBjbG9zZXN0IHRvICh4LCB5KS5cbiAgICAgKiBOdWxsIHdoZW4gbm8gc3VpdGFibGUgY2VsbCBpcyBuZWFyICh4LCB5KVxuICAgICAqL1xuICAgIHNuYXBUbyh7ZGllID0gbnVsbCwgeCwgeX0pIHtcbiAgICAgICAgY29uc3QgY29ybmVyQ2VsbCA9IHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvcm5lciA9IHRoaXMuX2NlbGxUb0Nvb3Jkcyhjb3JuZXJDZWxsKTtcbiAgICAgICAgY29uc3Qgd2lkdGhJbiA9IGNvcm5lci54ICsgdGhpcy5kaWVTaXplIC0geDtcbiAgICAgICAgY29uc3Qgd2lkdGhPdXQgPSB0aGlzLmRpZVNpemUgLSB3aWR0aEluO1xuICAgICAgICBjb25zdCBoZWlnaHRJbiA9IGNvcm5lci55ICsgdGhpcy5kaWVTaXplIC0geTtcbiAgICAgICAgY29uc3QgaGVpZ2h0T3V0ID0gdGhpcy5kaWVTaXplIC0gaGVpZ2h0SW47XG5cbiAgICAgICAgY29uc3QgcXVhZHJhbnRzID0gW3tcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcihjb3JuZXJDZWxsKSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93LFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodE91dFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodE91dFxuICAgICAgICB9XTtcblxuICAgICAgICBjb25zdCBzbmFwVG8gPSBxdWFkcmFudHNcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG9uIHRoZSBsYXlvdXRcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiB1bmRlZmluZWQgIT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBub3QgYWxyZWFkeSB0YWtlbiBleGNlcHQgYnkgaXRzZWxmXG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gKFxuICAgICAgICAgICAgICAgIG51bGwgIT09IGRpZSAmJiB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykgPT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5fY2VsbElzRW1wdHkocXVhZHJhbnQucSwgX2RpY2UuZ2V0KHRoaXMpKSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIGNvdmVyZWQgYnkgdGhlIGRpZSB0aGUgbW9zdFxuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAobWF4USwgcXVhZHJhbnQpID0+IHF1YWRyYW50LmNvdmVyYWdlID4gbWF4US5jb3ZlcmFnZSA/IHF1YWRyYW50IDogbWF4USxcbiAgICAgICAgICAgICAgICB7cTogdW5kZWZpbmVkLCBjb3ZlcmFnZTogLTF9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IHNuYXBUby5xID8gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhzbmFwVG8ucSkgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGllIGF0IHBvaW50ICh4LCB5KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50IC0gVGhlIHBvaW50IGluICh4LCB5KSBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge1RvcERpZXxudWxsfSBUaGUgZGllIHVuZGVyIGNvb3JkaW5hdGVzICh4LCB5KSBvciBudWxsIGlmIG5vIGRpZVxuICAgICAqIGlzIGF0IHRoZSBwb2ludC5cbiAgICAgKi9cbiAgICBnZXRBdChwb2ludCA9IHt4OiAwLCB5OiAwfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBfZGljZS5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3QgeEZpdCA9IHggPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHggKyB0aGlzLmRpZVNpemU7XG4gICAgICAgICAgICBjb25zdCB5Rml0ID0geSA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0geSArIHRoaXMuZGllU2l6ZTtcblxuICAgICAgICAgICAgaWYgKHhGaXQgJiYgeUZpdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGdyaWQgc2l6ZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGhcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gVGhlIG1pbmltYWwgaGVpZ2h0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVHcmlkKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgX2NvbHMuc2V0KHRoaXMsIE1hdGguZmxvb3Iod2lkdGggLyB0aGlzLmRpZVNpemUpKTtcbiAgICAgICAgX3Jvd3Muc2V0KHRoaXMsIE1hdGguZmxvb3IoaGVpZ2h0IC8gdGhpcy5kaWVTaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIChyb3csIGNvbCkgY2VsbCB0byAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb0Nvb3Jkcyh7cm93LCBjb2x9KSB7XG4gICAgICAgIHJldHVybiB7eDogY29sICogdGhpcy5kaWVTaXplLCB5OiByb3cgKiB0aGlzLmRpZVNpemV9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgKHgsIHkpIGNvb3JkaW5hdGVzIHRvIGEgKHJvdywgY29sKSBjZWxsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkaW5hdGVzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnQgdG8gYSBjZWxsLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY2VsbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3Jkc1RvQ2VsbCh7eCwgeX0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7R3JpZExheW91dH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGUgbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cblxuLypcbiAqIENvbnZlcnQgYW4gSFRNTCBhdHRyaWJ1dGUgdG8gYW4gaW5zdGFuY2UncyBwcm9wZXJ0eS4gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSdzIG5hbWUuIEZvciBleGFtcGxlLCBcIm15LWF0dHJcIlxuICogd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJteUF0dHJcIiwgYW5kIFwiZGlzYWJsZWRcIiB0byBcImRpc2FibGVkXCIuXG4gKi9cbmNvbnN0IGF0dHJpYnV0ZTJwcm9wZXJ0eSA9IChuYW1lKSA9PiB7XG4gICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybiBmaXJzdCArIHJlc3QubWFwKHdvcmQgPT4gd29yZC5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKSkuam9pbigpO1xufTtcblxuLyoqXG4gKiBNaXhpbiB7QGxpbmsgUmVhZE9ubHlBdHRyaWJ1dGVzfSB0byBhIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7Kn0gU3VwIC0gVGhlIGNsYXNzIHRvIG1peCBpbnRvLlxuICogQHJldHVybiB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIFJlYWRPbmx5QXR0cmlidXRlc1xuICAgICAqL1xuICAgIGNsYXNzIGV4dGVuZHMgU3VwIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdGhhdCBpcyBleGVjdXRlZCB3aGVuIGFuIG9ic2VydmVkIGF0dHJpYnV0ZSdzIHZhbHVlIGlzXG4gICAgICAgICAqIGNoYW5nZWQuIElmIHRoZSBIVE1MRWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIERPTSwgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiB2YWx1ZSBjYW4gb25seSBiZSBzZXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgSFRNTEVsZW1lbnQncyBwcm9wZXJ0eS5cbiAgICAgICAgICogSW4gZWZmZWN0LCB0aGlzIG1ha2VzIHRoaXMgSFRNTEVsZW1lbnQncyBhdHRyaWJ1dGVzIHJlYWQtb25seS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIGFuIEhUTUxFbGVtZW50IGhhcyBhbiBhdHRyaWJ1dGUgXCJ4XCIgYW5kXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgXCJ4XCIsIHRoZW4gY2hhbmdpbmcgdGhlIHZhbHVlIFwieFwiIHRvIFwiNVwiXG4gICAgICAgICAqIHdpbGwgb25seSB3b3JrIHdoZW4gYHRoaXMueCA9PT0gNWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBvbGQgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgICAgICAqL1xuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBBbGwgYXR0cmlidXRlcyBhcmUgbWFkZSByZWFkLW9ubHkgdG8gcHJldmVudCBjaGVhdGluZyBieSBjaGFuZ2luZ1xuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuIE9mIGNvdXJzZSwgdGhpcyBpcyBieSBub1xuICAgICAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdXNlcnMgd2lsbCBub3QgY2hlYXQgaW4gYSBkaWZmZXJlbnQgd2F5LlxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBhdHRyaWJ1dGUycHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQgJiYgbmV3VmFsdWUgIT09IGAke3RoaXNbcHJvcGVydHldfWApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB0aGlzW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQge1xuICAgIFJlYWRPbmx5QXR0cmlidXRlc1xufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgVmFsaWRhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0aW9uRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgX3ZhbHVlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kZWZhdWx0VmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Vycm9ycyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IFR5cGVWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Ioe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9ycyA9IFtdfSkge1xuICAgICAgICBfdmFsdWUuc2V0KHRoaXMsIHZhbHVlKTtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgX2Vycm9ycy5zZXQodGhpcywgZXJyb3JzKTtcbiAgICB9XG5cbiAgICBnZXQgb3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gX3ZhbHVlLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLm9yaWdpbiA6IF9kZWZhdWx0VmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBlcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiBfZXJyb3JzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgaXNWYWxpZCgpIHtcbiAgICAgICAgcmV0dXJuIDAgPj0gdGhpcy5lcnJvcnMubGVuZ3RoO1xuICAgIH1cblxuICAgIGRlZmF1bHRUbyhuZXdEZWZhdWx0KSB7XG4gICAgICAgIF9kZWZhdWx0VmFsdWUuc2V0KHRoaXMsIG5ld0RlZmF1bHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfY2hlY2soe3ByZWRpY2F0ZSwgYmluZFZhcmlhYmxlcyA9IFtdLCBFcnJvclR5cGUgPSBWYWxpZGF0aW9uRXJyb3J9KSB7XG4gICAgICAgIGNvbnN0IHByb3Bvc2l0aW9uID0gcHJlZGljYXRlLmFwcGx5KHRoaXMsIGJpbmRWYXJpYWJsZXMpO1xuICAgICAgICBpZiAoIXByb3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvclR5cGUodGhpcy52YWx1ZSwgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUud2FybihlcnJvci50b1N0cmluZygpKTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IFBhcnNlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBQYXJzZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IEludmFsaWRUeXBlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnZhbGlkVHlwZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSBcIi4vZXJyb3IvUGFyc2VFcnJvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IElOVEVHRVJfREVGQVVMVF9WQUxVRSA9IDA7XG5jb25zdCBJbnRlZ2VyVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gSU5URUdFUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGlucHV0KSkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZhbHVlID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VkVmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGxhcmdlclRoYW4obikge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobikgPT4gdGhpcy5vcmlnaW4gPj0gbixcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzbWFsbGVyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA8PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGJldHdlZW4obiwgbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobiwgbSkgPT4gdGhpcy5sYXJnZXJUaGFuKG4pICYmIHRoaXMuc21hbGxlclRoYW4obSksXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbiwgbV1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnRlZ2VyVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgU1RSSU5HX0RFRkFVTFRfVkFMVUUgPSBcIlwiO1xuY29uc3QgU3RyaW5nVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IFNUUklOR19ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBub3RFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gXCJcIiAhPT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBTdHJpbmdUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbi8vaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQ09MT1JfREVGQVVMVF9WQUxVRSA9IFwiYmxhY2tcIjtcbmNvbnN0IENvbG9yVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBDb2xvclR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQk9PTEVBTl9ERUZBVUxUX1ZBTFVFID0gZmFsc2U7XG5jb25zdCBCb29sZWFuVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQk9PTEVBTl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoL3RydWUvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL2ZhbHNlL2kudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgUGFyc2VFcnJvcihpbnB1dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBpc1RydWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IHRydWUgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlzRmFsc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IGZhbHNlID09PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEJvb2xlYW5UeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0ludGVnZXJUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9JbnRlZ2VyVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtTdHJpbmdUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0NvbG9yVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vQ29sb3JUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0Jvb2xlYW5UeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Cb29sZWFuVHlwZVZhbGlkYXRvci5qc1wiO1xuXG5jb25zdCBWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgfVxuXG4gICAgYm9vbGVhbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEJvb2xlYW5UeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBjb2xvcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG4gICAgaW50ZWdlcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXJUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBzdHJpbmcoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbn07XG5cbmNvbnN0IFZhbGlkYXRvclNpbmdsZXRvbiA9IG5ldyBWYWxpZGF0b3IoKTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0b3JTaW5nbGV0b24gYXMgdmFsaWRhdGVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBmcm9tIFwiLi9taXhpbi9SZWFkT25seUF0dHJpYnV0ZXMuanNcIjtcbmltcG9ydCB7dmFsaWRhdGV9IGZyb20gXCIuL3ZhbGlkYXRlL3ZhbGlkYXRlLmpzXCI7XG5cbmNvbnN0IFRBR19OQU1FID0gXCJ0b3AtZGllXCI7XG5cbmNvbnN0IENJUkNMRV9ERUdSRUVTID0gMzYwOyAvLyBkZWdyZWVzXG5jb25zdCBOVU1CRVJfT0ZfUElQUyA9IDY7IC8vIERlZmF1bHQgLyByZWd1bGFyIHNpeCBzaWRlZCBkaWUgaGFzIDYgcGlwcyBtYXhpbXVtLlxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFwiSXZvcnlcIjtcbmNvbnN0IERFRkFVTFRfWCA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1kgPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ST1RBVElPTiA9IDA7IC8vIGRlZ3JlZXNcbmNvbnN0IERFRkFVTFRfT1BBQ0lUWSA9IDAuNTtcblxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgSEVMRF9CWV9BVFRSSUJVVEUgPSBcImhlbGQtYnlcIjtcbmNvbnN0IFBJUFNfQVRUUklCVVRFID0gXCJwaXBzXCI7XG5jb25zdCBST1RBVElPTl9BVFRSSUJVVEUgPSBcInJvdGF0aW9uXCI7XG5jb25zdCBYX0FUVFJJQlVURSA9IFwieFwiO1xuY29uc3QgWV9BVFRSSUJVVEUgPSBcInlcIjtcblxuY29uc3QgQkFTRV9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTID0gMTU7IC8vIHB4XG5jb25zdCBCQVNFX1NUUk9LRV9XSURUSCA9IDIuNTsgLy8gcHhcbmNvbnN0IE1JTl9TVFJPS0VfV0lEVEggPSAxOyAvLyBweFxuY29uc3QgSEFMRiA9IEJBU0VfRElFX1NJWkUgLyAyOyAvLyBweFxuY29uc3QgVEhJUkQgPSBCQVNFX0RJRV9TSVpFIC8gMzsgLy8gcHhcbmNvbnN0IFBJUF9TSVpFID0gQkFTRV9ESUVfU0laRSAvIDE1OyAvL3B4XG5jb25zdCBQSVBfQ09MT1IgPSBcImJsYWNrXCI7XG5cbmNvbnN0IGRlZzJyYWQgPSAoZGVnKSA9PiB7XG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcbn07XG5cbmNvbnN0IGlzUGlwTnVtYmVyID0gbiA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobiwgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcikgJiYgMSA8PSBudW1iZXIgJiYgbnVtYmVyIDw9IE5VTUJFUl9PRl9QSVBTO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgb2YgcGlwcyBiZXR3ZWVuIDEgYW5kIHRoZSBOVU1CRVJfT0ZfUElQUy5cbiAqXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBBIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgTlVNQkVSX09GX1BJUFMuXG4gKi9cbmNvbnN0IHJhbmRvbVBpcHMgPSAoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOVU1CRVJfT0ZfUElQUykgKyAxO1xuXG5jb25zdCBESUVfVU5JQ09ERV9DSEFSQUNURVJTID0gW1wi4pqAXCIsXCLimoFcIixcIuKaglwiLFwi4pqDXCIsXCLimoRcIixcIuKahVwiXTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllIGZhY2UgdG8gdGhlIG51bWJlciBvZiBwaXBzIG9mXG4gKiB0aGF0IHNhbWUgZGllLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlIG9mIHBpcHNUb1VuaWNvZGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHUgLSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgdG8gY29udmVydCB0byBwaXBzLlxuICogQHJldHVybnMge051bWJlcnx1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2LCBvclxuICogdW5kZWZpbmVkIGlmIHUgd2FzIG5vdCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZS5cbiAqL1xuY29uc3QgdW5pY29kZVRvUGlwcyA9ICh1KSA9PiB7XG4gICAgY29uc3QgZGllQ2hhckluZGV4ID0gRElFX1VOSUNPREVfQ0hBUkFDVEVSUy5pbmRleE9mKHUpO1xuICAgIHJldHVybiAwIDw9IGRpZUNoYXJJbmRleCA/IGRpZUNoYXJJbmRleCArIDEgOiB1bmRlZmluZWQ7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiB0byBhIHVuaWNvZGUgY2hhcmFjdGVyXG4gKiByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29ycmVzcG9uZGluZyBkaWUgZmFjZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZVxuICogb2YgdW5pY29kZVRvUGlwcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcCAtIFRoZSBudW1iZXIgb2YgcGlwcyB0byBjb252ZXJ0IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgdW5pY29kZSBjaGFyYWN0ZXJzIG9yXG4gKiB1bmRlZmluZWQgaWYgcCB3YXMgbm90IGJldHdlZW4gMSBhbmQgNiBpbmNsdXNpdmUuXG4gKi9cbmNvbnN0IHBpcHNUb1VuaWNvZGUgPSBwID0+IGlzUGlwTnVtYmVyKHApID8gRElFX1VOSUNPREVfQ0hBUkFDVEVSU1twIC0gMV0gOiB1bmRlZmluZWQ7XG5cbmNvbnN0IHJlbmRlckhvbGQgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0VQRVJBVE9SID0gd2lkdGggLyAzMDtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gREVGQVVMVF9PUEFDSVRZO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LmFyYyh4ICsgd2lkdGgsIHkgKyB3aWR0aCwgd2lkdGggLSBTRVBFUkFUT1IsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJEaWUgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0NBTEUgPSAod2lkdGggLyBIQUxGKTtcbiAgICBjb25zdCBIQUxGX0lOTkVSX1NJWkUgPSBNYXRoLnNxcnQod2lkdGggKiogMiAvIDIpO1xuICAgIGNvbnN0IElOTkVSX1NJWkUgPSAyICogSEFMRl9JTk5FUl9TSVpFO1xuICAgIGNvbnN0IFJPVU5ERURfQ09STkVSX1JBRElVUyA9IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTICogU0NBTEU7XG4gICAgY29uc3QgSU5ORVJfU0laRV9ST1VOREVEID0gSU5ORVJfU0laRSAtIDIgKiBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3QgU1RST0tFX1dJRFRIID0gTWF0aC5tYXgoTUlOX1NUUk9LRV9XSURUSCwgQkFTRV9TVFJPS0VfV0lEVEggKiBTQ0FMRSk7XG5cbiAgICBjb25zdCBzdGFydFggPSB4ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkUgKyBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3Qgc3RhcnRZID0geSArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFO1xuXG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgY29udGV4dC5saW5lV2lkdGggPSBTVFJPS0VfV0lEVEg7XG4gICAgY29udGV4dC5tb3ZlVG8oc3RhcnRYLCBzdGFydFkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDI3MCksIGRlZzJyYWQoMCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDApLCBkZWcycmFkKDkwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDkwKSwgZGVnMnJhZCgxODApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggLSBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgxODApLCBkZWcycmFkKDI3MCkpO1xuXG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlclBpcCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCkgPT4ge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBQSVBfQ09MT1I7XG4gICAgY29udGV4dC5tb3ZlVG8oeCwgeSk7XG4gICAgY29udGV4dC5hcmMoeCwgeSwgd2lkdGgsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2JvYXJkID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGVsZEJ5ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9waXBzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3RhdGlvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogVG9wRGllIGlzIHRoZSBcInRvcC1kaWVcIiBjdXN0b20gW0hUTUxcbiAqIGVsZW1lbnRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudCkgcmVwcmVzZW50aW5nIGEgZGllXG4gKiBvbiB0aGUgZGljZSBib2FyZC5cbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICogQG1peGVzIFJlYWRPbmx5QXR0cmlidXRlc1xuICovXG5jb25zdCBUb3BEaWUgPSBjbGFzcyBleHRlbmRzIFJlYWRPbmx5QXR0cmlidXRlcyhIVE1MRWxlbWVudCkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnID0ge31dIC0gVGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvZiB0aGUgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfG51bGx9IFtjb25maWcucGlwc10gLSBUaGUgcGlwcyBvZiB0aGUgZGllIHRvIGFkZC5cbiAgICAgKiBJZiBubyBwaXBzIGFyZSBzcGVjaWZpZWQgb3IgdGhlIHBpcHMgYXJlIG5vdCBiZXR3ZWVuIDEgYW5kIDYsIGEgcmFuZG9tXG4gICAgICogbnVtYmVyIGJldHdlZW4gMSBhbmQgNiBpcyBnZW5lcmF0ZWQgaW5zdGVhZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2NvbmZpZy5jb2xvcl0gLSBUaGUgY29sb3Igb2YgdGhlIGRpZSB0byBhZGQuIERlZmF1bHRcbiAgICAgKiB0byB0aGUgZGVmYXVsdCBjb2xvci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24gb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gW2NvbmZpZy5oZWxkQnldIC0gVGhlIHBsYXllciBob2xkaW5nIHRoZSBkaWUuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe3BpcHMsIGNvbG9yLCByb3RhdGlvbiwgeCwgeSwgaGVsZEJ5fSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgY29uc3QgcGlwc1ZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihwaXBzIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwc1ZhbHVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHBpcHNWYWx1ZSk7XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHZhbGlkYXRlLmNvbG9yKGNvbG9yIHx8IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfQ09MT1IpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHZhbGlkYXRlLmludGVnZXIocm90YXRpb24gfHwgdGhpcy5nZXRBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDAsIDM2MClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ST1RBVElPTilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnggPSB2YWxpZGF0ZS5pbnRlZ2VyKHggfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLmludGVnZXIoeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1kpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5oZWxkQnkgPSB2YWxpZGF0ZS5zdHJpbmcoaGVsZEJ5IHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoVEFHX05BTUUsIFRvcERpZSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllLFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZSxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLXBsYXllclwiO1xuXG4vLyBUaGUgbmFtZXMgb2YgdGhlIChvYnNlcnZlZCkgYXR0cmlidXRlcyBvZiB0aGUgVG9wUGxheWVyLlxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgTkFNRV9BVFRSSUJVVEUgPSBcIm5hbWVcIjtcbmNvbnN0IFNDT1JFX0FUVFJJQlVURSA9IFwic2NvcmVcIjtcbmNvbnN0IEhBU19UVVJOX0FUVFJJQlVURSA9IFwiaGFzLXR1cm5cIjtcblxuLy8gVGhlIHByaXZhdGUgcHJvcGVydGllcyBvZiB0aGUgVG9wUGxheWVyIFxuY29uc3QgX2NvbG9yID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9uYW1lID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9zY29yZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGFzVHVybiA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogQSBQbGF5ZXIgaW4gYSBkaWNlIGdhbWUuXG4gKlxuICogQSBwbGF5ZXIncyBuYW1lIHNob3VsZCBiZSB1bmlxdWUgaW4gdGhlIGdhbWUuIFR3byBkaWZmZXJlbnRcbiAqIFRvcFBsYXllciBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG5hbWUgYXR0cmlidXRlIGFyZSB0cmVhdGVkIGFzXG4gKiB0aGUgc2FtZSBwbGF5ZXIuXG4gKlxuICogSW4gZ2VuZXJhbCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IG5vIHR3byBwbGF5ZXJzIGRvIGhhdmUgdGhlIHNhbWUgY29sb3IsXG4gKiBhbHRob3VnaCBpdCBpcyBub3QgdW5jb25jZWl2YWJsZSB0aGF0IGNlcnRhaW4gZGljZSBnYW1lcyBoYXZlIHBsYXllcnMgd29ya1xuICogaW4gdGVhbXMgd2hlcmUgaXQgd291bGQgbWFrZSBzZW5zZSBmb3IgdHdvIG9yIG1vcmUgZGlmZmVyZW50IHBsYXllcnMgdG9cbiAqIGhhdmUgdGhlIHNhbWUgY29sb3IuXG4gKlxuICogVGhlIG5hbWUgYW5kIGNvbG9yIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkLiBUaGUgc2NvcmUgYW5kIGhhcy10dXJuXG4gKiBhdHRyaWJ1dGVzIGFyZSBub3QuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBSZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wUGxheWVyID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXIsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBwbGF5ZXIgd2l0aCBhIHR1cm5cbiAgICAgKi9cbiAgICBzdGFydFR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6c3RhcnQtdHVyblwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wUGxheWVyKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzeXN0ZW0gcGxheWVyLiBEaWNlIGFyZSB0aHJvd24gYnkgYSBwbGF5ZXIuIEZvciBzaXR1YXRpb25zXG4gKiB3aGVyZSB5b3Ugd2FudCB0byByZW5kZXIgYSBidW5jaCBvZiBkaWNlIHdpdGhvdXQgbmVlZGluZyB0aGUgY29uY2VwdCBvZiBQbGF5ZXJzXG4gKiB0aGlzIERFRkFVTFRfU1lTVEVNX1BMQVlFUiBjYW4gYmUgYSBzdWJzdGl0dXRlLiBPZiBjb3Vyc2UsIGlmIHlvdSdkIGxpa2UgdG9cbiAqIGNoYW5nZSB0aGUgbmFtZSBhbmQvb3IgdGhlIGNvbG9yLCBjcmVhdGUgYW5kIHVzZSB5b3VyIG93biBcInN5c3RlbSBwbGF5ZXJcIi5cbiAqIEBjb25zdFxuICovXG5jb25zdCBERUZBVUxUX1NZU1RFTV9QTEFZRVIgPSBuZXcgVG9wUGxheWVyKHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXIsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSLFxuICAgIFRBR19OQU1FLFxuICAgIEhBU19UVVJOX0FUVFJJQlVURVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUiwgVEFHX05BTUUgYXMgVE9QX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5cbmNvbnN0IFRBR19OQU1FID0gXCJ0b3AtcGxheWVyLWxpc3RcIjtcblxuLyoqXG4gKiBUb3BQbGF5ZXJMaXN0IHRvIGRlc2NyaWJlIHRoZSBwbGF5ZXJzIGluIHRoZSBnYW1lLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcFBsYXllckxpc3QgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXJMaXN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBpZiAoMCA+PSB0aGlzLnBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3A6c3RhcnQtdHVyblwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgb25lIHBsYXllciBjYW4gaGF2ZSBhIHR1cm4gYXQgYW55IGdpdmVuIHRpbWUuXG4gICAgICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4gIXAuZXF1YWxzKGV2ZW50LmRldGFpbC5wbGF5ZXIpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHAgPT4gcC5lbmRUdXJuKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBpbiB0aGlzIGxpc3QuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyW119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShUT1BfUExBWUVSKV07XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wUGxheWVyTGlzdCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVyTGlzdCxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7R3JpZExheW91dH0gZnJvbSBcIi4vR3JpZExheW91dC5qc1wiO1xuaW1wb3J0IHtUb3BEaWUsIFRBR19OQU1FIGFzIFRPUF9ESUV9IGZyb20gXCIuL1RvcERpZS5qc1wiO1xuaW1wb3J0IHtERUZBVUxUX1NZU1RFTV9QTEFZRVIsIFRvcFBsYXllciwgVEFHX05BTUUgYXMgVE9QX1BMQVlFUiwgSEFTX1RVUk5fQVRUUklCVVRFfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcbmltcG9ydCB7VEFHX05BTUUgYXMgVE9QX1BMQVlFUl9MSVNUfSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLWRpY2UtYm9hcmRcIjtcblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuY29uc3QgcGFyc2VOdW1iZXIgPSAobnVtYmVyU3RyaW5nLCBkZWZhdWx0TnVtYmVyID0gMCkgPT4ge1xuICAgIGNvbnN0IG51bWJlciA9IHBhcnNlSW50KG51bWJlclN0cmluZywgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNOYU4obnVtYmVyKSA/IGRlZmF1bHROdW1iZXIgOiBudW1iZXI7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIHJldHVybiB2YWxpZGF0ZS5pbnRlZ2VyKG51bWJlclN0cmluZylcbiAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgLmRlZmF1bHRUbyhkZWZhdWx0VmFsdWUpXG4gICAgICAgIC52YWx1ZTtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXIodmFsdWVTdHJpbmcsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG5jb25zdCBnZXRCb29sZWFuID0gKGJvb2xlYW5TdHJpbmcsIHRydWVWYWx1ZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKHRydWVWYWx1ZSA9PT0gYm9vbGVhblN0cmluZyB8fCBcInRydWVcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKFwiZmFsc2VcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG59O1xuXG5jb25zdCBnZXRCb29sZWFuQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbih2YWx1ZVN0cmluZywgW3ZhbHVlU3RyaW5nLCBcInRydWVcIl0sIFtcImZhbHNlXCJdLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbmNvbnN0IF9jYW52YXMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2xheW91dCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY3VycmVudFBsYXllciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbnVtYmVyT2ZSZWFkeURpY2UgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBjb250ZXh0ID0gKGJvYXJkKSA9PiBfY2FudmFzLmdldChib2FyZCkuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG5jb25zdCBnZXRSZWFkeURpY2UgPSAoYm9hcmQpID0+IHtcbiAgICBpZiAodW5kZWZpbmVkID09PSBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKSkge1xuICAgICAgICBfbnVtYmVyT2ZSZWFkeURpY2Uuc2V0KGJvYXJkLCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX251bWJlck9mUmVhZHlEaWNlLmdldChib2FyZCk7XG59O1xuXG5jb25zdCB1cGRhdGVSZWFkeURpY2UgPSAoYm9hcmQsIHVwZGF0ZSkgPT4ge1xuICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIGdldFJlYWR5RGljZShib2FyZCkgKyB1cGRhdGUpO1xufTtcblxuY29uc3QgaXNSZWFkeSA9IChib2FyZCkgPT4gZ2V0UmVhZHlEaWNlKGJvYXJkKSA9PT0gYm9hcmQuZGljZS5sZW5ndGg7XG5cbmNvbnN0IHVwZGF0ZUJvYXJkID0gKGJvYXJkLCBkaWNlID0gYm9hcmQuZGljZSkgPT4ge1xuICAgIGlmIChpc1JlYWR5KGJvYXJkKSkge1xuICAgICAgICBjb250ZXh0KGJvYXJkKS5jbGVhclJlY3QoMCwgMCwgYm9hcmQud2lkdGgsIGJvYXJkLmhlaWdodCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgZGllLnJlbmRlcihjb250ZXh0KGJvYXJkKSwgYm9hcmQuZGllU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBhZGREaWUgPSAoYm9hcmQpID0+IHtcbiAgICB1cGRhdGVSZWFkeURpY2UoYm9hcmQsIDEpO1xuICAgIGlmIChpc1JlYWR5KGJvYXJkKSkge1xuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgYm9hcmQubGF5b3V0LmxheW91dChib2FyZC5kaWNlKSk7XG4gICAgfVxufTtcblxuY29uc3QgcmVtb3ZlRGllID0gKGJvYXJkKSA9PiB7XG4gICAgdXBkYXRlQm9hcmQoYm9hcmQsIGJvYXJkLmxheW91dC5sYXlvdXQoYm9hcmQuZGljZSkpO1xuICAgIHVwZGF0ZVJlYWR5RGljZShib2FyZCwgLTEpO1xufTtcblxuXG4vLyBJbnRlcmFjdGlvbiBzdGF0ZXNcbmNvbnN0IE5PTkUgPSBTeW1ib2woXCJub19pbnRlcmFjdGlvblwiKTtcbmNvbnN0IEhPTEQgPSBTeW1ib2woXCJob2xkXCIpO1xuY29uc3QgTU9WRSA9IFN5bWJvbChcIm1vdmVcIik7XG5jb25zdCBJTkRFVEVSTUlORUQgPSBTeW1ib2woXCJpbmRldGVybWluZWRcIik7XG5jb25zdCBEUkFHR0lORyA9IFN5bWJvbChcImRyYWdnaW5nXCIpO1xuXG4vLyBNZXRob2RzIHRvIGhhbmRsZSBpbnRlcmFjdGlvblxuY29uc3QgY29udmVydFdpbmRvd0Nvb3JkaW5hdGVzVG9DYW52YXMgPSAoY2FudmFzLCB4V2luZG93LCB5V2luZG93KSA9PiB7XG4gICAgY29uc3QgY2FudmFzQm94ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgY29uc3QgeCA9IHhXaW5kb3cgLSBjYW52YXNCb3gubGVmdCAqIChjYW52YXMud2lkdGggLyBjYW52YXNCb3gud2lkdGgpO1xuICAgIGNvbnN0IHkgPSB5V2luZG93IC0gY2FudmFzQm94LnRvcCAqIChjYW52YXMuaGVpZ2h0IC8gY2FudmFzQm94LmhlaWdodCk7XG5cbiAgICByZXR1cm4ge3gsIHl9O1xufTtcblxuY29uc3Qgc2V0dXBJbnRlcmFjdGlvbiA9IChib2FyZCkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IF9jYW52YXMuZ2V0KGJvYXJkKTtcblxuICAgIC8vIFNldHVwIGludGVyYWN0aW9uXG4gICAgbGV0IG9yaWdpbiA9IHt9O1xuICAgIGxldCBzdGF0ZSA9IE5PTkU7XG4gICAgbGV0IHN0YXRpY0JvYXJkID0gbnVsbDtcbiAgICBsZXQgZGllVW5kZXJDdXJzb3IgPSBudWxsO1xuICAgIGxldCBob2xkVGltZW91dCA9IG51bGw7XG5cbiAgICBjb25zdCBob2xkRGllID0gKCkgPT4ge1xuICAgICAgICBpZiAoSE9MRCA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gdG9nZ2xlIGhvbGQgLyByZWxlYXNlXG4gICAgICAgICAgICBjb25zdCBwbGF5ZXJXaXRoQVR1cm4gPSBib2FyZC5xdWVyeVNlbGVjdG9yKGAke1RPUF9QTEFZRVJfTElTVH0gJHtUT1BfUExBWUVSfVske0hBU19UVVJOX0FUVFJJQlVURX1dYCk7XG4gICAgICAgICAgICBpZiAoZGllVW5kZXJDdXJzb3IuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5yZWxlYXNlSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuaG9sZEl0KHBsYXllcldpdGhBVHVybik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IE5PTkU7XG5cbiAgICAgICAgICAgIHVwZGF0ZUJvYXJkKGJvYXJkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhvbGRUaW1lb3V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RhcnRIb2xkaW5nID0gKCkgPT4ge1xuICAgICAgICBob2xkVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGhvbGREaWUsIGJvYXJkLmhvbGREdXJhdGlvbik7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0b3BIb2xkaW5nID0gKCkgPT4ge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGhvbGRUaW1lb3V0KTtcbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChOT05FID09PSBzdGF0ZSkge1xuXG4gICAgICAgICAgICBvcmlnaW4gPSB7XG4gICAgICAgICAgICAgICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICB5OiBldmVudC5jbGllbnRZXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkaWVVbmRlckN1cnNvciA9IGJvYXJkLmxheW91dC5nZXRBdChjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyhjYW52YXMsIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcblxuICAgICAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBpbnRlcmFjdGlvbiB3aXRoIHRoZSBib2FyZCB2aWEgYSBkaWVcbiAgICAgICAgICAgICAgICBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UgJiYgIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gSU5ERVRFUk1JTkVEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZEhvbGRpbmdEaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gSE9MRDtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRIb2xkaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBNT1ZFO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHNob3dJbnRlcmFjdGlvbiA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBkaWVVbmRlckN1cnNvciA9IGJvYXJkLmxheW91dC5nZXRBdChjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyhjYW52YXMsIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcbiAgICAgICAgaWYgKERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZ3JhYmJpbmdcIjtcbiAgICAgICAgfSBlbHNlIGlmIChudWxsICE9PSBkaWVVbmRlckN1cnNvcikge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZ3JhYlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE1PVkUgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiBhIGRpZSBpcyB1bmRlciB0aGUgY3Vyc29yXG4gICAgICAgICAgICAvLyBJZ25vcmUgc21hbGwgbW92ZW1lbnRzXG4gICAgICAgICAgICBjb25zdCBkeCA9IE1hdGguYWJzKG9yaWdpbi54IC0gZXZlbnQuY2xpZW50WCk7XG4gICAgICAgICAgICBjb25zdCBkeSA9IE1hdGguYWJzKG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WSk7XG5cbiAgICAgICAgICAgIGlmIChNSU5fREVMVEEgPCBkeCB8fCBNSU5fREVMVEEgPCBkeSkge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gRFJBR0dJTkc7XG4gICAgICAgICAgICAgICAgc3RvcEhvbGRpbmcoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRpY2VXaXRob3V0RGllVW5kZXJDdXJzb3IgPSBib2FyZC5kaWNlLmZpbHRlcihkaWUgPT4gZGllICE9PSBkaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQsIGRpY2VXaXRob3V0RGllVW5kZXJDdXJzb3IpO1xuICAgICAgICAgICAgICAgIHN0YXRpY0JvYXJkID0gY29udGV4dChib2FyZCkuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjb25zdCBkeCA9IG9yaWdpbi54IC0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gb3JpZ2luLnkgLSBldmVudC5jbGllbnRZO1xuXG4gICAgICAgICAgICBjb25zdCB7eCwgeX0gPSBkaWVVbmRlckN1cnNvci5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29udGV4dChib2FyZCkucHV0SW1hZ2VEYXRhKHN0YXRpY0JvYXJkLCAwLCAwKTtcbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbmRlcihjb250ZXh0KGJvYXJkKSwgYm9hcmQuZGllU2l6ZSwge3g6IHggLSBkeCwgeTogeSAtIGR5fSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChudWxsICE9PSBkaWVVbmRlckN1cnNvciAmJiBEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb25zdCBzbmFwVG9Db29yZHMgPSBib2FyZC5sYXlvdXQuc25hcFRvKHtcbiAgICAgICAgICAgICAgICBkaWU6IGRpZVVuZGVyQ3Vyc29yLFxuICAgICAgICAgICAgICAgIHg6IHggLSBkeCxcbiAgICAgICAgICAgICAgICB5OiB5IC0gZHksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgbmV3Q29vcmRzID0gbnVsbCAhPSBzbmFwVG9Db29yZHMgPyBzbmFwVG9Db29yZHMgOiB7eCwgeX07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzID0gbmV3Q29vcmRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgc3RhdGVcbiAgICAgICAgZGllVW5kZXJDdXJzb3IgPSBudWxsO1xuICAgICAgICBzdGF0ZSA9IE5PTkU7XG5cbiAgICAgICAgLy8gUmVmcmVzaCBib2FyZDsgUmVuZGVyIGRpY2VcbiAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgIH07XG5cblxuICAgIC8vIFJlZ2lzdGVyIHRoZSBhY3R1YWwgZXZlbnQgbGlzdGVuZXJzIGRlZmluZWQgYWJvdmUuIE1hcCB0b3VjaCBldmVudHMgdG9cbiAgICAvLyBlcXVpdmFsZW50IG1vdXNlIGV2ZW50cy4gQmVjYXVzZSB0aGUgXCJ0b3VjaGVuZFwiIGV2ZW50IGRvZXMgbm90IGhhdmUgYVxuICAgIC8vIGNsaWVudFggYW5kIGNsaWVudFksIHJlY29yZCBhbmQgdXNlIHRoZSBsYXN0IG9uZXMgZnJvbSB0aGUgXCJ0b3VjaG1vdmVcIlxuICAgIC8vIChvciBcInRvdWNoc3RhcnRcIikgZXZlbnRzLlxuXG4gICAgbGV0IHRvdWNoQ29vcmRpbmF0ZXMgPSB7Y2xpZW50WDogMCwgY2xpZW50WTogMH07XG4gICAgY29uc3QgdG91Y2gybW91c2VFdmVudCA9IChtb3VzZUV2ZW50TmFtZSkgPT4ge1xuICAgICAgICByZXR1cm4gKHRvdWNoRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0b3VjaEV2ZW50ICYmIDAgPCB0b3VjaEV2ZW50LnRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qge2NsaWVudFgsIGNsaWVudFl9ID0gdG91Y2hFdmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgIHRvdWNoQ29vcmRpbmF0ZXMgPSB7Y2xpZW50WCwgY2xpZW50WX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYW52YXMuZGlzcGF0Y2hFdmVudChuZXcgTW91c2VFdmVudChtb3VzZUV2ZW50TmFtZSwgdG91Y2hDb29yZGluYXRlcykpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlZG93blwiKSk7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgc3RhcnRJbnRlcmFjdGlvbik7XG5cbiAgICBpZiAoIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlKSB7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZW1vdmVcIikpO1xuICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3ZlKTtcbiAgICB9XG5cbiAgICBpZiAoIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlIHx8ICFib2FyZC5kaXNhYmxlZEhvbGRpbmdEaWNlKSB7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHNob3dJbnRlcmFjdGlvbik7XG4gICAgfVxuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2V1cFwiKSk7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHN0b3BJbnRlcmFjdGlvbik7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCBzdG9wSW50ZXJhY3Rpb24pO1xufTtcblxuLyoqXG4gKiBUb3BEaWNlQm9hcmQgaXMgYSBjdXN0b20gSFRNTCBlbGVtZW50IHRvIHJlbmRlciBhbmQgY29udHJvbCBhXG4gKiBkaWNlIGJvYXJkLiBcbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICovXG5jb25zdCBUb3BEaWNlQm9hcmQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWNlQm9hcmQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiBcImNsb3NlZFwifSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgICAgIF9jYW52YXMuc2V0KHRoaXMsIGNhbnZhcyk7XG4gICAgICAgIF9jdXJyZW50UGxheWVyLnNldCh0aGlzLCBERUZBVUxUX1NZU1RFTV9QTEFZRVIpO1xuICAgICAgICBfbGF5b3V0LnNldCh0aGlzLCBuZXcgR3JpZExheW91dCh7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICBkaWVTaXplOiB0aGlzLmRpZVNpemUsXG4gICAgICAgICAgICBkaXNwZXJzaW9uOiB0aGlzLmRpc3BlcnNpb25cbiAgICAgICAgfSkpO1xuICAgICAgICBzZXR1cEludGVyYWN0aW9uKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgV0lEVEhfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEVJR0hUX0FUVFJJQlVURSxcbiAgICAgICAgICAgIERJU1BFUlNJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgRElFX1NJWkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgRFJBR0dJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gX2NhbnZhcy5nZXQodGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlIFdJRFRIX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfV0lEVEgpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoV0lEVEhfQVRUUklCVVRFLCB3aWR0aCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEhFSUdIVF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9IRUlHSFQpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShIRUlHSFRfQVRUUklCVVRFLCBoZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBESVNQRVJTSU9OX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGlzcGVyc2lvbiA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBESUVfU0laRV9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpZVNpemUgPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfRElFX1NJWkUpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGllU2l6ZSA9IGRpZVNpemU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNhYmxlZFJvdGF0aW9uID0gdmFsaWRhdGUuYm9vbGVhbihuZXdWYWx1ZSwgZ2V0Qm9vbGVhbihvbGRWYWx1ZSwgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCkpLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQucm90YXRlID0gIWRpc2FibGVkUm90YXRpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAvLyBUaGUgdmFsdWUgaXMgZGV0ZXJtaW5lZCB3aGVuIHVzaW5nIHRoZSBnZXR0ZXJcbiAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQm9hcmQodGhpcyk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6YWRkZWRcIiwgKCkgPT4gYWRkRGllKHRoaXMpKTtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTpyZW1vdmVkXCIsICgpID0+IHJlbW92ZURpZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gQWRkIGRpY2UgdGhhdCBhcmUgYWxyZWFkeSBpbiB0aGUgRE9NXG4gICAgICAgIHRoaXMuZGljZS5mb3JFYWNoKCgpID0+IGFkZERpZSh0aGlzKSk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgYWRvcHRlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBHcmlkTGF5b3V0IHVzZWQgYnkgdGhpcyBEaWNlQm9hcmQgdG8gbGF5b3V0IHRoZSBkaWNlLlxuICAgICAqXG4gICAgICogQHR5cGUge0dyaWRMYXlvdXR9XG4gICAgICovXG4gICAgZ2V0IGxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuIE5vdGUsIHRvIGFjdHVhbGx5IHRocm93IHRoZSBkaWNlIHVzZVxuICAgICAqIHtAbGluayB0aHJvd0RpY2V9LiBcbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BEaWVbXX1cbiAgICAgKi9cbiAgICBnZXQgZGljZSgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFRPUF9ESUUpXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBwdXQgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UsIDAgPCBtYXhpbXVtLlxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQubWF4aW11bU51bWJlck9mRGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgV0lEVEhfQVRUUklCVVRFLCBERUZBVUxUX1dJRFRIKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgSEVJR0hUX0FUVFJJQlVURSwgREVGQVVMVF9IRUlHSFQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIERJU1BFUlNJT05fQVRUUklCVVRFLCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzaXplIG9mIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESUVfU0laRV9BVFRSSUJVVEUsIERFRkFVTFRfRElFX1NJWkUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgZHJhZ2dlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWREcmFnZ2luZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX0RSQUdHSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgaGVsZCBieSBhIFBsYXllcj9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRIb2xkaW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHJvdGF0aW5nIGRpY2Ugb24gdGhpcyBib2FyZCBkaXNhYmxlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRSb3RhdGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkdXJhdGlvbiBpbiBtcyB0byBwcmVzcyB0aGUgbW91c2UgLyB0b3VjaCBhIGRpZSBiZWZvcmUgaXQgYmVrb21lc1xuICAgICAqIGhlbGQgYnkgdGhlIFBsYXllci4gSXQgaGFzIG9ubHkgYW4gZWZmZWN0IHdoZW4gdGhpcy5ob2xkYWJsZURpY2UgPT09XG4gICAgICogdHJ1ZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhvbGREdXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhPTERfRFVSQVRJT05fQVRUUklCVVRFLCBERUZBVUxUX0hPTERfRFVSQVRJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBUb3BQbGF5ZXJMaXN0IGVsZW1lbnQgb2YgdGhpcyBUb3BEaWNlQm9hcmQuIElmIGl0IGRvZXMgbm90IGV4aXN0LFxuICAgICAqIGl0IHdpbGwgYmUgY3JlYXRlZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJMaXN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9wbGF5ZXJMaXN0KCkge1xuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IHRoaXMucXVlcnlTZWxlY3RvcihUT1BfUExBWUVSX0xJU1QpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyTGlzdCkge1xuICAgICAgICAgICAgcGxheWVyTGlzdCA9IHRoaXMuYXBwZW5kQ2hpbGQoVE9QX1BMQVlFUl9MSVNUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwbGF5ZXJMaXN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIHBsYXlpbmcgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BsYXllckxpc3QucGxheWVycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcyBwbGF5ZXIsIHRocm93IHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gW3BsYXllciA9IERFRkFVTFRfU1lTVEVNX1BMQVlFUl0gLSBUaGVcbiAgICAgKiBwbGF5ZXIgdGhhdCBpcyB0aHJvd2luZyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7VG9wRGllW119IFRoZSB0aHJvd24gZGljZSBvbiB0aGlzIGJvYXJkLiBUaGlzIGxpc3Qgb2YgZGljZSBpcyB0aGUgc2FtZSBhcyB0aGlzIFRvcERpY2VCb2FyZCdzIHtAc2VlIGRpY2V9IHByb3BlcnR5XG4gICAgICovXG4gICAgdGhyb3dEaWNlKHBsYXllciA9IERFRkFVTFRfU1lTVEVNX1BMQVlFUikge1xuICAgICAgICBpZiAocGxheWVyICYmICFwbGF5ZXIuaGFzVHVybikge1xuICAgICAgICAgICAgcGxheWVyLnN0YXJ0VHVybigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGljZS5mb3JFYWNoKGRpZSA9PiBkaWUudGhyb3dJdCgpKTtcbiAgICAgICAgdXBkYXRlQm9hcmQodGhpcywgdGhpcy5sYXlvdXQubGF5b3V0KHRoaXMuZGljZSkpO1xuICAgICAgICByZXR1cm4gdGhpcy5kaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpZSB0byB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wRGllfE9iamVjdH0gW2NvbmZpZyA9IHt9XSAtIFRoZSBkaWUgb3IgYSBjb25maWd1cmF0aW9uIG9mXG4gICAgICogdGhlIGRpZSB0byBhZGQgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ8bnVsbH0gW2NvbmZpZy5waXBzXSAtIFRoZSBwaXBzIG9mIHRoZSBkaWUgdG8gYWRkLlxuICAgICAqIElmIG5vIHBpcHMgYXJlIHNwZWNpZmllZCBvciB0aGUgcGlwcyBhcmUgbm90IGJldHdlZW4gMSBhbmQgNiwgYSByYW5kb21cbiAgICAgKiBudW1iZXIgYmV0d2VlbiAxIGFuZCA2IGlzIGdlbmVyYXRlZCBpbnN0ZWFkLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbY29uZmlnLmNvbG9yXSAtIFRoZSBjb2xvciBvZiB0aGUgZGllIHRvIGFkZC4gRGVmYXVsdFxuICAgICAqIHRvIHRoZSBkZWZhdWx0IGNvbG9yLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29uZmlnLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvZiB0aGUgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29uZmlnLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29uZmlnLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbiBvZiB0aGUgZGllLlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBbY29uZmlnLmhlbGRCeV0gLSBUaGUgcGxheWVyIGhvbGRpbmcgdGhlIGRpZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcERpZX0gVGhlIGFkZGVkIGRpZS5cbiAgICAgKi9cbiAgICBhZGREaWUoY29uZmlnID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kQ2hpbGQoY29uZmlnIGluc3RhbmNlb2YgVG9wRGllID8gY29uZmlnIDogbmV3IFRvcERpZShjb25maWcpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZGllIGZyb20gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZX0gZGllIC0gVGhlIGRpZSB0byByZW1vdmUgZnJvbSB0aGlzIGJvYXJkLlxuICAgICAqL1xuICAgIHJlbW92ZURpZShkaWUpIHtcbiAgICAgICAgaWYgKGRpZS5wYXJlbnROb2RlICYmIGRpZS5wYXJlbnROb2RlID09PSB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGRpZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBwbGF5ZXIgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcnxPYmplY3R9IGNvbmZpZyAtIFRoZSBwbGF5ZXIgb3IgYSBjb25maWd1cmF0aW9uIG9mIGFcbiAgICAgKiBwbGF5ZXIgdG8gYWRkIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcuY29sb3IgLSBUaGlzIHBsYXllcidzIGNvbG9yIHVzZWQgaW4gdGhlIGdhbWUuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5uYW1lIC0gVGhpcyBwbGF5ZXIncyBuYW1lLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29uZmlnLnNjb3JlXSAtIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBbY29uZmlnLmhhc1R1cm5dIC0gVGhpcyBwbGF5ZXIgaGFzIGEgdHVybi5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgRXJyb3Igd2hlbiB0aGUgcGxheWVyIHRvIGFkZCBjb25mbGljdHMgd2l0aCBhIHByZS1leGlzdGluZ1xuICAgICAqIHBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcFBsYXllcn0gVGhlIGFkZGVkIHBsYXllci5cbiAgICAgKi9cbiAgICBhZGRQbGF5ZXIoY29uZmlnID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BsYXllckxpc3QuYXBwZW5kQ2hpbGQoY29uZmlnIGluc3RhbmNlb2YgVG9wUGxheWVyID8gY29uZmlnIDogbmV3IFRvcFBsYXllcihjb25maWcpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcGxheWVyIGZyb20gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB0byByZW1vdmUgZnJvbSB0aGlzIGJvYXJkLlxuICAgICAqL1xuICAgIHJlbW92ZVBsYXllcihwbGF5ZXIpIHtcbiAgICAgICAgaWYgKHBsYXllci5wYXJlbnROb2RlICYmIHBsYXllci5wYXJlbnROb2RlID09PSB0aGlzLl9wbGF5ZXJMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJMaXN0LnJlbW92ZUNoaWxkKHBsYXllcik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoVEFHX05BTUUsIFRvcERpY2VCb2FyZCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGljZUJvYXJkLFxuICAgIERFRkFVTFRfRElFX1NJWkUsXG4gICAgREVGQVVMVF9IT0xEX0RVUkFUSU9OLFxuICAgIERFRkFVTFRfV0lEVEgsXG4gICAgREVGQVVMVF9IRUlHSFQsXG4gICAgREVGQVVMVF9ESVNQRVJTSU9OLFxuICAgIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5pbXBvcnQge1RvcERpY2VCb2FyZH0gZnJvbSBcIi4vVG9wRGljZUJvYXJkLmpzXCI7XG5pbXBvcnQge1RvcERpZX0gZnJvbSBcIi4vVG9wRGllLmpzXCI7XG5pbXBvcnQge1RvcFBsYXllcn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5pbXBvcnQge1RvcFBsYXllckxpc3R9IGZyb20gXCIuL1RvcFBsYXllckxpc3QuanNcIjtcblxud2luZG93LnR3ZW50eW9uZXBpcHMgPSB3aW5kb3cudHdlbnR5b25lcGlwcyB8fCBPYmplY3QuZnJlZXplKHtcbiAgICBWRVJTSU9OOiBcIjAuMC4xXCIsXG4gICAgTElDRU5TRTogXCJMR1BMLTMuMFwiLFxuICAgIFdFQlNJVEU6IFwiaHR0cHM6Ly90d2VudHlvbmVwaXBzLm9yZ1wiLFxuICAgIFRvcERpY2VCb2FyZDogVG9wRGljZUJvYXJkLFxuICAgIFRvcERpZTogVG9wRGllLFxuICAgIFRvcFBsYXllcjogVG9wUGxheWVyLFxuICAgIFRvcFBsYXllckxpc3Q6IFRvcFBsYXllckxpc3Rcbn0pO1xuIl0sIm5hbWVzIjpbIlRBR19OQU1FIiwidmFsaWRhdGUiLCJDT0xPUl9BVFRSSUJVVEUiLCJfY29sb3IiLCJUT1BfUExBWUVSIiwiVE9QX1BMQVlFUl9MSVNUIiwiVE9QX0RJRSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLEtBQUssQ0FBQzs7Ozs7Ozs7SUFRM0MsV0FBVyxDQUFDLE9BQU8sRUFBRTtRQUNqQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEI7Q0FDSjs7QUNwQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFFQSxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEtBQUs7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7O0FBR0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0I5QixNQUFNLFVBQVUsR0FBRyxN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QUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxT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V0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDO0tBQ0o7O0NBRUosQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQ0wsV0FBUSxFQUFFLFlBQVksQ0FBQyxDQUFDOztBQ2ptQnJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFLQSxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6RCxPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsVUFBVTtJQUNuQixPQUFPLEVBQUUsMkJBQTJCO0lBQ3BDLFlBQVksRUFBRSxZQUFZO0lBQzFCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsYUFBYSxFQUFFLGFBQWE7Q0FDL0IsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNFUnBaUzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlVYjNCUWJHRjVaWEl1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1VHeGhlV1Z5VEdsemRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OVViM0JFYVdObFFtOWhjbVF1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMbXB6SWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRVZ5Y205eVhHNGdLaTljYm1OdmJuTjBJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCM2FYUm9JRzFsYzNOaFoyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JXVnpjMkZuWlNBdElGUm9aU0J0WlhOellXZGxJR0Z6YzI5amFXRjBaV1FnZDJsMGFDQjBhR2x6WEc0Z0lDQWdJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxbGMzTmhaMlVwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYldWemMyRm5aU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNExDQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVaVlRFeGZRMGxTUTB4RlgwbE9YMFJGUjFKRlJWTWdQU0F6TmpBN1hHNWNibU52Ym5OMElISmhibVJ2YldsNlpVTmxiblJsY2lBOUlDaHVLU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJQ2d3TGpVZ1BEMGdUV0YwYUM1eVlXNWtiMjBvS1NBL0lFMWhkR2d1Wm14dmIzSWdPaUJOWVhSb0xtTmxhV3dwTG1OaGJHd29NQ3dnYmlrN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElHWnBaV3hrYzF4dVkyOXVjM1FnWDNkcFpIUm9JRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9aV2xuYUhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOdmJITWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzSnZkM01nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwWTJVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScFpWTnBlbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwYzNCbGNuTnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZEdGMFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNiaThxS2x4dUlDb2dRSFI1Y0dWa1pXWWdlMDlpYW1WamRIMGdSM0pwWkV4aGVXOTFkRU52Ym1acFozVnlZWFJwYjI1Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VkMmxrZEdnZ0xTQlVhR1VnYldsdWFXMWhiQ0IzYVdSMGFDQnZaaUIwYUdselhHNGdLaUJIY21sa1RHRjViM1YwSUdsdUlIQnBlR1ZzY3k0N1hHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbWhsYVdkb2RGMGdMU0JVYUdVZ2JXbHVhVzFoYkNCb1pXbG5hSFFnYjJaY2JpQXFJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDQnBiaUJ3YVhobGJITXVMbHh1SUNvZ1FIQnliM0JsY25SNUlIdE9kVzFpWlhKOUlHTnZibVpwWnk1a2FYTndaWEp6YVc5dUlDMGdWR2hsSUdScGMzUmhibU5sSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVmNiaUFxSUd4aGVXOTFkQ0JoSUdScFpTQmpZVzRnWW1VZ2JHRjViM1YwTGx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NWthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkhjbWxrVEdGNWIzVjBJR2hoYm1Sc1pYTWdiR0Y1YVc1bklHOTFkQ0IwYUdVZ1pHbGpaU0J2YmlCaElFUnBZMlZDYjJGeVpDNWNiaUFxTDF4dVkyOXVjM1FnUjNKcFpFeGhlVzkxZENBOUlHTnNZWE56SUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRIY21sa1RHRjViM1YwUTI5dVptbG5kWEpoZEdsdmJuMGdZMjl1Wm1sbklDMGdWR2hsSUdOdmJtWnBaM1Z5WVhScGIyNGdiMllnZEdobElFZHlhV1JNWVhsdmRYUmNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaDdYRzRnSUNBZ0lDQWdJSGRwWkhSb0xGeHVJQ0FnSUNBZ0lDQm9aV2xuYUhRc1hHNGdJQ0FnSUNBZ0lHUnBjM0JsY25OcGIyNHNYRzRnSUNBZ0lDQWdJR1JwWlZOcGVtVmNiaUFnSUNCOUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ1gyUnBZMlV1YzJWMEtIUm9hWE1zSUZ0ZEtUdGNiaUFnSUNBZ0lDQWdYMlJwWlZOcGVtVXVjMlYwS0hSb2FYTXNJREVwTzF4dUlDQWdJQ0FnSUNCZmQybGtkR2d1YzJWMEtIUm9hWE1zSURBcE8xeHVJQ0FnSUNBZ0lDQmZhR1ZwWjJoMExuTmxkQ2gwYUdsekxDQXdLVHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVdWVGFYcGxJRDBnWkdsbFUybDZaVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNhV1IwYUNBOUlIZHBaSFJvTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZDJsa2RHZ2dhVzRnY0dsNFpXeHpJSFZ6WldRZ1lua2dkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUlGZHBaSFJvSUQ0OUlEQmNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlNCY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2QybGtkR2dvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmQybGtkR2d1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCM2FXUjBhQ2gzS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUQ0Z2R5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGdWMmxrZEdnZ2MyaHZkV3hrSUdKbElHRWdiblZ0WW1WeUlHeGhjbWRsY2lCMGFHRnVJREFzSUdkdmRDQW5KSHQzZlNjZ2FXNXpkR1ZoWkM1Z0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JmZDJsa2RHZ3VjMlYwS0hSb2FYTXNJSGNwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbDlqWVd4amRXeGhkR1ZIY21sa0tIUm9hWE11ZDJsa2RHZ3NJSFJvYVhNdWFHVnBaMmgwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdhR1ZwWjJoMElHbHVJSEJwZUdWc2N5QjFjMlZrSUdKNUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM0Z1hHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1NHVnBaMmgwSUQ0OUlEQmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdobGFXZG9kQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5b1pXbG5hSFF1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCb1pXbG5hSFFvYUNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK0lHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUc1bGR5QkRiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSW9ZRWhsYVdkb2RDQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTUN3Z1oyOTBJQ2NrZTJoOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUY5b1pXbG5hSFF1YzJWMEtIUm9hWE1zSUdncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TGw5allXeGpkV3hoZEdWSGNtbGtLSFJvYVhNdWQybGtkR2dzSUhSb2FYTXVhR1ZwWjJoMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR0YwSUdOaGJpQmlaU0JzWVhsdmRYUWdiMjRnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJVYUdselhHNGdJQ0FnSUNvZ2JuVnRZbVZ5SUdseklENDlJREF1SUZKbFlXUWdiMjVzZVM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRzFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYjJ4eklDb2dkR2hwY3k1ZmNtOTNjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1pHbHpjR1Z5YzJsdmJpQnNaWFpsYkNCMWMyVmtJR0o1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnVkdobElHUnBjM0JsY25OcGIyNGdiR1YyWld4Y2JpQWdJQ0FnS2lCcGJtUnBZMkYwWlhNZ2RHaGxJR1JwYzNSaGJtTmxJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQmthV05sSUdOaGJpQmlaU0JzWVhsdmRYUXVJRlZ6WlNBeElHWnZjaUJoWEc0Z0lDQWdJQ29nZEdsbmFIUWdjR0ZqYTJWa0lHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGFISnZkM01nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUVScGMzQmxjbk5wYjI0Z1BqMGdNRnh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjM0JsY25OcGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsemNHVnljMmx2Ymk1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzJWMElHUnBjM0JsY25OcGIyNG9aQ2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0ErSUdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lFUnBjM0JsY25OcGIyNGdjMmh2ZFd4a0lHSmxJR0VnYm5WdFltVnlJR3hoY21kbGNpQjBhR0Z1SURBc0lHZHZkQ0FuSkh0a2ZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJScGMzQmxjbk5wYjI0dWMyVjBLSFJvYVhNc0lHUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCemFYcGxJRzltSUdFZ1pHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFJvY205M2N5QkRiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSWdSR2xsVTJsNlpTQStQU0F3WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2xsVTJsNlpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlrYVdWVGFYcGxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpaWFFnWkdsbFUybDZaU2hrY3lrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK1BTQmtjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhnWkdsbFUybDZaU0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Td2daMjkwSUNja2UyUnpmU2NnYVc1emRHVmhaQzVnS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmZaR2xsVTJsNlpTNXpaWFFvZEdocGN5d2daSE1wTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbDlqWVd4amRXeGhkR1ZIY21sa0tIUm9hWE11ZDJsa2RHZ3NJSFJvYVhNdWFHVnBaMmgwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2NtOTBZWFJsS0NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeUlEMGdYM0p2ZEdGMFpTNW5aWFFvZEdocGN5azdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUWdQVDA5SUhJZ1B5QjBjblZsSURvZ2NqdGNiaUFnSUNCOVhHNWNiaUFnSUNCelpYUWdjbTkwWVhSbEtISXBJSHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnY2lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRzUxYldKbGNpQnZaaUJ5YjNkeklHbHVJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY24wZ1ZHaGxJRzUxYldKbGNpQnZaaUJ5YjNkekxDQXdJRHdnY205M2N5NWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmZjbTkzY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXliM2R6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdiblZ0WW1WeUlHOW1JR052YkhWdGJuTWdhVzRnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZTQlVhR1VnYm5WdFltVnlJRzltSUdOdmJIVnRibk1zSURBZ1BDQmpiMngxYlc1ekxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElGOWpiMnh6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyTnZiSE11WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmpaVzUwWlhJZ1kyVnNiQ0JwYmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjlJRlJvWlNCalpXNTBaWElnS0hKdmR5d2dZMjlzS1M1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCZlkyVnVkR1Z5S0NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeWIzY2dQU0J5WVc1a2IyMXBlbVZEWlc1MFpYSW9kR2hwY3k1ZmNtOTNjeUF2SURJcElDMGdNVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMjlzSUQwZ2NtRnVaRzl0YVhwbFEyVnVkR1Z5S0hSb2FYTXVYMk52YkhNZ0x5QXlLU0F0SURFN1hHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdHliM2NzSUdOdmJIMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dUR0Y1YjNWMElHUnBZMlVnYjI0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCRWFXVmJYWDBnWkdsalpTQXRJRlJvWlNCa2FXTmxJSFJ2SUd4aGVXOTFkQ0J2YmlCMGFHbHpJRXhoZVc5MWRDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFViM0JFYVdWYlhYMGdWR2hsSUhOaGJXVWdiR2x6ZENCdlppQmthV05sTENCaWRYUWdibTkzSUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnVkdobElHNTFiV0psY2lCdlpseHVJQ0FnSUNBcUlHUnBZMlVnYzJodmRXeGtJRzV2ZENCbGVHTmxaV1FnZEdobElHMWhlR2x0ZFcwZ2JuVnRZbVZ5SUc5bUlHUnBZMlVnZEdocGN5Qk1ZWGx2ZFhRZ1kyRnVYRzRnSUNBZ0lDb2diR0Y1YjNWMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUd4aGVXOTFkQ2hrYVdObEtTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoa2FXTmxMbXhsYm1kMGFDQStJSFJvYVhNdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGdWR2hsSUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUd4aGVXOTFkQ0JwY3lBa2UzUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlgwc0lHZHZkQ0FrZTJScFkyVXViR1Z1WjJoMGZTQmthV05sSUdsdWMzUmxZV1F1WUNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTQTlJRnRkTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrYVdObFZHOU1ZWGx2ZFhRZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHUnBaU0J2WmlCa2FXTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvWkdsbExtaGhjME52YjNKa2FXNWhkR1Z6S0NrZ0ppWWdaR2xsTG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdSR2xqWlNCMGFHRjBJR0Z5WlNCaVpXbHVaeUJvWld4a0lHRnVaQ0JvWVhabElHSmxaVzRnYkdGNWIzVjBJR0psWm05eVpTQnphRzkxYkdSY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QnJaV1Z3SUhSb1pXbHlJR04xY25KbGJuUWdZMjl2Y21ScGJtRjBaWE1nWVc1a0lISnZkR0YwYVc5dUxpQkpiaUJ2ZEdobGNpQjNiM0prY3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QjBhR1Z6WlNCa2FXTmxJR0Z5WlNCemEybHdjR1ZrTGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sTG5CMWMyZ29aR2xsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xqWlZSdlRHRjViM1YwTG5CMWMyZ29aR2xsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUcxaGVDQTlJRTFoZEdndWJXbHVLR1JwWTJVdWJHVnVaM1JvSUNvZ2RHaHBjeTVrYVhOd1pYSnphVzl1TENCMGFHbHpMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVwTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JoZG1GcGJHRmliR1ZEWld4c2N5QTlJSFJvYVhNdVgyTnZiWEIxZEdWQmRtRnBiR0ZpYkdWRFpXeHNjeWh0WVhnc0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtUdGNibHh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdScFpTQnZaaUJrYVdObFZHOU1ZWGx2ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEpoYm1SdmJVbHVaR1Y0SUQwZ1RXRjBhQzVtYkc5dmNpaE5ZWFJvTG5KaGJtUnZiU2dwSUNvZ1lYWmhhV3hoWW14bFEyVnNiSE11YkdWdVozUm9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhKaGJtUnZiVU5sYkd3Z1BTQmhkbUZwYkdGaWJHVkRaV3hzYzF0eVlXNWtiMjFKYm1SbGVGMDdYRzRnSUNBZ0lDQWdJQ0FnSUNCaGRtRnBiR0ZpYkdWRFpXeHNjeTV6Y0d4cFkyVW9jbUZ1Wkc5dFNXNWtaWGdzSURFcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVXVZMjl2Y21ScGJtRjBaWE1nUFNCMGFHbHpMbDl1ZFcxaVpYSlViME52YjNKa2FXNWhkR1Z6S0hKaGJtUnZiVU5sYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbExuSnZkR0YwYVc5dUlEMGdkR2hwY3k1eWIzUmhkR1VnUHlCTllYUm9Mbkp2ZFc1a0tFMWhkR2d1Y21GdVpHOXRLQ2tnS2lCR1ZVeE1YME5KVWtOTVJWOUpUbDlFUlVkU1JVVlRLU0E2SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnSUNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlM1d2RYTm9LR1JwWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JmWkdsalpTNXpaWFFvZEdocGN5d2dZV3h5WldGa2VVeGhlVzkxZEVScFkyVXBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjIxd2RYUmxJR0VnYkdsemRDQjNhWFJvSUdGMllXbHNZV0pzWlNCalpXeHNjeUIwYnlCd2JHRmpaU0JrYVdObElHOXVMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHMWhlQ0F0SUZSb1pTQnVkVzFpWlhJZ1pXMXdkSGtnWTJWc2JITWdkRzhnWTI5dGNIVjBaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0VScFpWdGRmU0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU0F0SUVFZ2JHbHpkQ0IzYVhSb0lHUnBZMlVnZEdoaGRDQm9ZWFpsSUdGc2NtVmhaSGtnWW1WbGJpQnNZWGx2ZFhRdVhHNGdJQ0FnSUNvZ1hHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5VzExOUlGUm9aU0JzYVhOMElHOW1JR0YyWVdsc1lXSnNaU0JqWld4c2N5QnlaWEJ5WlhObGJuUmxaQ0JpZVNCMGFHVnBjaUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyOXRjSFYwWlVGMllXbHNZV0pzWlVObGJHeHpLRzFoZUN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1lYWmhhV3hoWW14bElEMGdibVYzSUZObGRDZ3BPMXh1SUNBZ0lDQWdJQ0JzWlhRZ2JHVjJaV3dnUFNBd08xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdFlYaE1aWFpsYkNBOUlFMWhkR2d1YldsdUtIUm9hWE11WDNKdmQzTXNJSFJvYVhNdVgyTnZiSE1wTzF4dVhHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoaGRtRnBiR0ZpYkdVdWMybDZaU0E4SUcxaGVDQW1KaUJzWlhabGJDQThJRzFoZUV4bGRtVnNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR05sYkd3Z2IyWWdkR2hwY3k1ZlkyVnNiSE5QYmt4bGRtVnNLR3hsZG1Wc0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMWJtUmxabWx1WldRZ0lUMDlJR05sYkd3Z0ppWWdkR2hwY3k1ZlkyVnNiRWx6Ulcxd2RIa29ZMlZzYkN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGMllXbHNZV0pzWlM1aFpHUW9ZMlZzYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JzWlhabGJDc3JPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUVGeWNtRjVMbVp5YjIwb1lYWmhhV3hoWW14bEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRZV3hqZFd4aGRHVWdZV3hzSUdObGJHeHpJRzl1SUd4bGRtVnNJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQnZaaUIwYUdVZ2JHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR3hsZG1Wc0lDMGdWR2hsSUd4bGRtVnNJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQnZaaUIwYUdVZ2JHRjViM1YwTGlBd1hHNGdJQ0FnSUNvZ2FXNWthV05oZEdWeklIUm9aU0JqWlc1MFpYSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFRaWFE4VG5WdFltVnlQbjBnZEdobElHTmxiR3h6SUc5dUlIUm9aU0JzWlhabGJDQnBiaUIwYUdseklHeGhlVzkxZENCeVpYQnlaWE5sYm5SbFpDQmllVnh1SUNBZ0lDQXFJSFJvWldseUlHNTFiV0psY2k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWld4c2MwOXVUR1YyWld3b2JHVjJaV3dwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJWc2JITWdQU0J1WlhjZ1UyVjBLQ2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR05sYm5SbGNpQTlJSFJvYVhNdVgyTmxiblJsY2p0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvTUNBOVBUMGdiR1YyWld3cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb1kyVnVkR1Z5S1NrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0J5YjNjZ1BTQmpaVzUwWlhJdWNtOTNJQzBnYkdWMlpXdzdJSEp2ZHlBOFBTQmpaVzUwWlhJdWNtOTNJQ3NnYkdWMlpXdzdJSEp2ZHlzcktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMlZzYkhNdVlXUmtLSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3Y205M0xDQmpiMnc2SUdObGJuUmxjaTVqYjJ3Z0xTQnNaWFpsYkgwcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpaV3hzY3k1aFpHUW9kR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHR5YjNjc0lHTnZiRG9nWTJWdWRHVnlMbU52YkNBcklHeGxkbVZzZlNrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0JqYjJ3Z1BTQmpaVzUwWlhJdVkyOXNJQzBnYkdWMlpXd2dLeUF4T3lCamIyd2dQQ0JqWlc1MFpYSXVZMjlzSUNzZ2JHVjJaV3c3SUdOdmJDc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJWc2JITXVZV1JrS0hSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loN2NtOTNPaUJqWlc1MFpYSXVjbTkzSUMwZ2JHVjJaV3dzSUdOdmJIMHBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWld4c2N5NWhaR1FvZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0eWIzYzZJR05sYm5SbGNpNXliM2NnS3lCc1pYWmxiQ3dnWTI5c2ZTa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR05sYkd4ek8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFUnZaWE1nWTJWc2JDQmpiMjUwWVdsdUlHRWdZMlZzYkNCbWNtOXRJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxQMXh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHTmxiR3dnTFNCQklHTmxiR3dnYVc0Z2JHRjViM1YwSUhKbGNISmxjMlZ1ZEdWa0lHSjVJR0VnYm5WdFltVnlMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdWRzl3UkdsbFcxMTlJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxJQzBnUVNCc2FYTjBJRzltSUdScFkyVWdkR2hoZENCb1lYWmxJR0ZzY21WaFpIa2dZbVZsYmlCc1lYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElHbG1JR05sYkd3Z1pHOWxjeUJ1YjNRZ1kyOXVkR0ZwYmlCaElHUnBaUzVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpaV3hzU1hORmJYQjBlU2hqWld4c0xDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJRDA5UFNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlM1bWFXNWtLR1JwWlNBOVBpQmpaV3hzSUQwOVBTQjBhR2x6TGw5amIyOXlaR2x1WVhSbGMxUnZUblZ0WW1WeUtHUnBaUzVqYjI5eVpHbHVZWFJsY3lrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQnVkVzFpWlhJZ2RHOGdZU0JqWld4c0lDaHliM2NzSUdOdmJDbGNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdUlDMGdWR2hsSUc1MWJXSmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmpaV3hzWEc0Z0lDQWdJQ29nUUhKbGRIVnlibk1nZTA5aWFtVmpkSDBnVW1WMGRYSnVJSFJvWlNCalpXeHNJQ2g3Y205M0xDQmpiMng5S1NCamIzSnlaWE53YjI1a2FXNW5JRzR1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZiblZ0WW1WeVZHOURaV3hzS0c0cElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdHliM2M2SUUxaGRHZ3VkSEoxYm1Nb2JpQXZJSFJvYVhNdVgyTnZiSE1wTENCamIydzZJRzRnSlNCMGFHbHpMbDlqYjJ4emZUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdZMlZzYkNCMGJ5QmhJRzUxYldKbGNseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdObGJHd2dMU0JVYUdVZ1kyVnNiQ0IwYnlCamIyNTJaWEowSUhSdklHbDBjeUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZIVnVaR1ZtYVc1bFpIMGdWR2hsSUc1MWJXSmxjaUJqYjNKeVpYTndiMjVrYVc1bklIUnZJSFJvWlNCalpXeHNMbHh1SUNBZ0lDQXFJRkpsZEhWeWJuTWdkVzVrWldacGJtVmtJSGRvWlc0Z2RHaGxJR05sYkd3Z2FYTWdibTkwSUc5dUlIUm9aU0JzWVhsdmRYUmNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNWRzlPZFcxaVpYSW9lM0p2ZHl3Z1kyOXNmU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0E4UFNCeWIzY2dKaVlnY205M0lEd2dkR2hwY3k1ZmNtOTNjeUFtSmlBd0lEdzlJR052YkNBbUppQmpiMndnUENCMGFHbHpMbDlqYjJ4ektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY205M0lDb2dkR2hwY3k1ZlkyOXNjeUFySUdOdmJEdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdZU0JqWld4c0lISmxjSEpsYzJWdWRHVmtJR0o1SUdsMGN5QnVkVzFpWlhJZ2RHOGdkR2hsYVhJZ1kyOXZjbVJwYm1GMFpYTXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JpQXRJRlJvWlNCdWRXMWlaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdZMlZzYkZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdZMjl5Y21WemNHOXVaR2x1WnlCMGJ5QjBhR1VnWTJWc2JDQnlaWEJ5WlhObGJuUmxaQ0JpZVZ4dUlDQWdJQ0FxSUhSb2FYTWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDI1MWJXSmxjbFJ2UTI5dmNtUnBibUYwWlhNb2Jpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyVnNiRlJ2UTI5dmNtUnpLSFJvYVhNdVgyNTFiV0psY2xSdlEyVnNiQ2h1S1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElIQmhhWElnYjJZZ1kyOXZjbVJwYm1GMFpYTWdkRzhnWVNCdWRXMWlaWEl1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdZMjl2Y21SeklDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZJR052Ym5abGNuUmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY254MWJtUmxabWx1WldSOUlGUm9aU0JqYjI5eVpHbHVZWFJsY3lCamIyNTJaWEowWldRZ2RHOGdZU0J1ZFcxaVpYSXVJRWxtWEc0Z0lDQWdJQ29nZEdobElHTnZiM0prYVc1aGRHVnpJR0Z5WlNCdWIzUWdiMjRnZEdocGN5QnNZWGx2ZFhRc0lIUm9aU0J1ZFcxaVpYSWdhWE1nZFc1a1pXWnBibVZrTGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YjNKa2FXNWhkR1Z6Vkc5T2RXMWlaWElvWTI5dmNtUnpLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzRnUFNCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2RHaHBjeTVmWTI5dmNtUnpWRzlEWld4c0tHTnZiM0prY3lrcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBOFBTQnVJQ1ltSUc0Z1BDQjBhR2x6TG0xaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1TzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1UyNWhjQ0FvZUN4NUtTQjBieUIwYUdVZ1kyeHZjMlZ6ZENCalpXeHNJR2x1SUhSb2FYTWdUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdScFpXTnZiM0prYVc1aGRHVWdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpTQjBieUJtYVc1a0lIUm9aU0JqYkc5elpYTjBJR05sYkd4Y2JpQWdJQ0FnS2lCbWIzSXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JFYVdWOUlGdGthV1ZqYjI5eVpHbHVZWFF1WkdsbElEMGdiblZzYkYwZ0xTQlVhR1VnWkdsbElIUnZJSE51WVhBZ2RHOHVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHUnBaV052YjNKa2FXNWhkR1V1ZUNBdElGUm9aU0I0TFdOdmIzSmthVzVoZEdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdScFpXTnZiM0prYVc1aGRHVXVlU0F0SUZSb1pTQjVMV052YjNKa2FXNWhkR1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjhiblZzYkgwZ1ZHaGxJR052YjNKa2FXNWhkR1VnYjJZZ2RHaGxJR05sYkd3Z1kyeHZjMlZ6ZENCMGJ5QW9lQ3dnZVNrdVhHNGdJQ0FnSUNvZ1RuVnNiQ0IzYUdWdUlHNXZJSE4xYVhSaFlteGxJR05sYkd3Z2FYTWdibVZoY2lBb2VDd2dlU2xjYmlBZ0lDQWdLaTljYmlBZ0lDQnpibUZ3Vkc4b2UyUnBaU0E5SUc1MWJHd3NJSGdzSUhsOUtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHTnZjbTVsY2tObGJHd2dQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUUxaGRHZ3VkSEoxYm1Nb2VTQXZJSFJvYVhNdVpHbGxVMmw2WlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklFMWhkR2d1ZEhKMWJtTW9lQ0F2SUhSb2FYTXVaR2xsVTJsNlpTbGNiaUFnSUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjNKdVpYSWdQU0IwYUdsekxsOWpaV3hzVkc5RGIyOXlaSE1vWTI5eWJtVnlRMlZzYkNrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhkcFpIUm9TVzRnUFNCamIzSnVaWEl1ZUNBcklIUm9hWE11WkdsbFUybDZaU0F0SUhnN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhkcFpIUm9UM1YwSUQwZ2RHaHBjeTVrYVdWVGFYcGxJQzBnZDJsa2RHaEpianRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhR1ZwWjJoMFNXNGdQU0JqYjNKdVpYSXVlU0FySUhSb2FYTXVaR2xsVTJsNlpTQXRJSGs3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2hsYVdkb2RFOTFkQ0E5SUhSb2FYTXVaR2xsVTJsNlpTQXRJR2hsYVdkb2RFbHVPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEYxWVdSeVlXNTBjeUE5SUZ0N1hHNGdJQ0FnSUNBZ0lDQWdJQ0J4T2lCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb1kyOXlibVZ5UTJWc2JDa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIzWmxjbUZuWlRvZ2QybGtkR2hKYmlBcUlHaGxhV2RvZEVsdVhHNGdJQ0FnSUNBZ0lIMHNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQmpiM0p1WlhKRFpXeHNMbkp2ZHl4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIydzZJR052Y201bGNrTmxiR3d1WTI5c0lDc2dNVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIzWmxjbUZuWlRvZ2QybGtkR2hQZFhRZ0tpQm9aV2xuYUhSSmJseHVJQ0FnSUNBZ0lDQjlMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnhPaUIwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dZMjl5Ym1WeVEyVnNiQzV5YjNjZ0t5QXhMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1kyOXlibVZ5UTJWc2JDNWpiMnhjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOTJaWEpoWjJVNklIZHBaSFJvU1c0Z0tpQm9aV2xuYUhSUGRYUmNiaUFnSUNBZ0lDQWdmU3dnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjVG9nZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeWIzYzZJR052Y201bGNrTmxiR3d1Y205M0lDc2dNU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklHTnZjbTVsY2tObGJHd3VZMjlzSUNzZ01WeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaFBkWFFnS2lCb1pXbG5hSFJQZFhSY2JpQWdJQ0FnSUNBZ2ZWMDdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjMjVoY0ZSdklEMGdjWFZoWkhKaGJuUnpYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmpaV3hzSUhOb2IzVnNaQ0JpWlNCdmJpQjBhR1VnYkdGNWIzVjBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVptbHNkR1Z5S0NoeGRXRmtjbUZ1ZENrZ1BUNGdkVzVrWldacGJtVmtJQ0U5UFNCeGRXRmtjbUZ1ZEM1eEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1kyVnNiQ0J6YUc5MWJHUWdZbVVnYm05MElHRnNjbVZoWkhrZ2RHRnJaVzRnWlhoalpYQjBJR0o1SUdsMGMyVnNabHh1SUNBZ0lDQWdJQ0FnSUNBZ0xtWnBiSFJsY2lnb2NYVmhaSEpoYm5RcElEMCtJQ2hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J1ZFd4c0lDRTlQU0JrYVdVZ0ppWWdkR2hwY3k1ZlkyOXZjbVJwYm1GMFpYTlViMDUxYldKbGNpaGthV1V1WTI5dmNtUnBibUYwWlhNcElEMDlQU0J4ZFdGa2NtRnVkQzV4S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUh4OElIUm9hWE11WDJObGJHeEpjMFZ0Y0hSNUtIRjFZV1J5WVc1MExuRXNJRjlrYVdObExtZGxkQ2gwYUdsektTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmpaV3hzSUhOb2IzVnNaQ0JpWlNCamIzWmxjbVZrSUdKNUlIUm9aU0JrYVdVZ2RHaGxJRzF2YzNSY2JpQWdJQ0FnSUNBZ0lDQWdJQzV5WldSMVkyVW9YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdLRzFoZUZFc0lIRjFZV1J5WVc1MEtTQTlQaUJ4ZFdGa2NtRnVkQzVqYjNabGNtRm5aU0ErSUcxaGVGRXVZMjkyWlhKaFoyVWdQeUJ4ZFdGa2NtRnVkQ0E2SUcxaGVGRXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlM0U2SUhWdVpHVm1hVzVsWkN3Z1kyOTJaWEpoWjJVNklDMHhmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0tUdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJQ0U5UFNCemJtRndWRzh1Y1NBL0lIUm9hWE11WDI1MWJXSmxjbFJ2UTI5dmNtUnBibUYwWlhNb2MyNWhjRlJ2TG5FcElEb2diblZzYkR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCSFpYUWdkR2hsSUdScFpTQmhkQ0J3YjJsdWRDQW9lQ3dnZVNrN1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFCdmFXNTBmU0J3YjJsdWRDQXRJRlJvWlNCd2IybHVkQ0JwYmlBb2VDd2dlU2tnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQkVhV1Y4Ym5Wc2JIMGdWR2hsSUdScFpTQjFibVJsY2lCamIyOXlaR2x1WVhSbGN5QW9lQ3dnZVNrZ2IzSWdiblZzYkNCcFppQnVieUJrYVdWY2JpQWdJQ0FnS2lCcGN5QmhkQ0IwYUdVZ2NHOXBiblF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwUVhRb2NHOXBiblFnUFNCN2VEb2dNQ3dnZVRvZ01IMHBJSHRjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWDJScFkyVXVaMlYwS0hSb2FYTXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCa2FXVXVZMjl2Y21ScGJtRjBaWE03WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIaEdhWFFnUFNCNElEdzlJSEJ2YVc1MExuZ2dKaVlnY0c5cGJuUXVlQ0E4UFNCNElDc2dkR2hwY3k1a2FXVlRhWHBsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2VVWnBkQ0E5SUhrZ1BEMGdjRzlwYm5RdWVTQW1KaUJ3YjJsdWRDNTVJRHc5SUhrZ0t5QjBhR2x6TG1ScFpWTnBlbVU3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoNFJtbDBJQ1ltSUhsR2FYUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdaR2xsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHdzdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMkZzWTNWc1lYUmxJSFJvWlNCbmNtbGtJSE5wZW1VZ1oybDJaVzRnZDJsa2RHZ2dZVzVrSUdobGFXZG9kQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQjNhV1IwYUNBdElGUm9aU0J0YVc1cGJXRnNJSGRwWkhSb1hHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdobGFXZG9kQ0F0SUZSb1pTQnRhVzVwYldGc0lHaGxhV2RvZEZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMkZzWTNWc1lYUmxSM0pwWkNoM2FXUjBhQ3dnYUdWcFoyaDBLU0I3WEc0Z0lDQWdJQ0FnSUY5amIyeHpMbk5sZENoMGFHbHpMQ0JOWVhSb0xtWnNiMjl5S0hkcFpIUm9JQzhnZEdocGN5NWthV1ZUYVhwbEtTazdYRzRnSUNBZ0lDQWdJRjl5YjNkekxuTmxkQ2gwYUdsekxDQk5ZWFJvTG1ac2IyOXlLR2hsYVdkb2RDQXZJSFJvYVhNdVpHbGxVMmw2WlNrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQW9jbTkzTENCamIyd3BJR05sYkd3Z2RHOGdLSGdzSUhrcElHTnZiM0prYVc1aGRHVnpMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFBZbXBsWTNSOUlHTmxiR3dnTFNCVWFHVWdZMlZzYkNCMGJ5QmpiMjUyWlhKMElIUnZJR052YjNKa2FXNWhkR1Z6WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJqYjI5eVpHbHVZWFJsY3k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWld4c1ZHOURiMjl5WkhNb2UzSnZkeXdnWTI5c2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdlM2c2SUdOdmJDQXFJSFJvYVhNdVpHbGxVMmw2WlN3Z2VUb2djbTkzSUNvZ2RHaHBjeTVrYVdWVGFYcGxmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjI1MlpYSjBJQ2g0TENCNUtTQmpiMjl5WkdsdVlYUmxjeUIwYnlCaElDaHliM2NzSUdOdmJDa2dZMlZzYkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JqYjI5eVpHbHVZWFJsY3lBdElGUm9aU0JqYjI5eVpHbHVZWFJsY3lCMGJ5QmpiMjUyWlhKMElIUnZJR0VnWTJWc2JDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklHTmxiR3hjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpiMjl5WkhOVWIwTmxiR3dvZTNnc0lIbDlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUUxaGRHZ3VkSEoxYm1Nb2VTQXZJSFJvYVhNdVpHbGxVMmw2WlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklFMWhkR2d1ZEhKMWJtTW9lQ0F2SUhSb2FYTXVaR2xsVTJsNlpTbGNiaUFnSUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UwZHlhV1JNWVhsdmRYUjlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnc0lESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkFiVzlrZFd4bElHMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dUlDb3ZYRzVjYmk4cVhHNGdLaUJEYjI1MlpYSjBJR0Z1SUVoVVRVd2dZWFIwY21saWRYUmxJSFJ2SUdGdUlHbHVjM1JoYm1ObEozTWdjSEp2Y0dWeWRIa3VJRnh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVZVzFsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc1aGJXVmNiaUFxSUVCeVpYUjFjbTRnZTFOMGNtbHVaMzBnVkdobElHTnZjbkpsYzNCdmJtUnBibWNnY0hKdmNHVnlkSGtuY3lCdVlXMWxMaUJHYjNJZ1pYaGhiWEJzWlN3Z1hDSnRlUzFoZEhSeVhDSmNiaUFxSUhkcGJHd2dZbVVnWTI5dWRtVnlkR1ZrSUhSdklGd2liWGxCZEhSeVhDSXNJR0Z1WkNCY0ltUnBjMkZpYkdWa1hDSWdkRzhnWENKa2FYTmhZbXhsWkZ3aUxseHVJQ292WEc1amIyNXpkQ0JoZEhSeWFXSjFkR1V5Y0hKdmNHVnlkSGtnUFNBb2JtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRnRtYVhKemRDd2dMaTR1Y21WemRGMGdQU0J1WVcxbExuTndiR2wwS0Z3aUxWd2lLVHRjYmlBZ0lDQnlaWFIxY200Z1ptbHljM1FnS3lCeVpYTjBMbTFoY0NoM2IzSmtJRDArSUhkdmNtUXVjMnhwWTJVb01Dd2dNU2t1ZEc5VmNIQmxja05oYzJVb0tTQXJJSGR2Y21RdWMyeHBZMlVvTVNrcExtcHZhVzRvS1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVFdsNGFXNGdlMEJzYVc1cklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdkRzhnWVNCamJHRnpjeTVjYmlBcVhHNGdLaUJBY0dGeVlXMGdleXA5SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYZ2dhVzUwYnk1Y2JpQXFJRUJ5WlhSMWNtNGdlMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnVkdobElHMXBlR1ZrTFdsdUlHTnNZWE56WEc0Z0tpOWNibU52Ym5OMElGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5QTlJQ2hUZFhBcElEMCtYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dUV2w0YVc0Z2RHOGdiV0ZyWlNCaGJHd2dZWFIwY21saWRYUmxjeUJ2YmlCaElHTjFjM1J2YlNCSVZFMU1SV3hsYldWdWRDQnlaV0ZrTFc5dWJIa2dhVzRnZEdobElITmxibk5sWEc0Z0lDQWdJQ29nZEdoaGRDQjNhR1Z1SUhSb1pTQmhkSFJ5YVdKMWRHVWdaMlYwY3lCaElHNWxkeUIyWVd4MVpTQjBhR0YwSUdScFptWmxjbk1nWm5KdmJTQjBhR1VnZG1Gc2RXVWdiMllnZEdobFhHNGdJQ0FnSUNvZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ3Y205d1pYSjBlU3dnYVhRZ2FYTWdjbVZ6WlhRZ2RHOGdkR2hoZENCd2NtOXdaWEowZVNkeklIWmhiSFZsTGlCVWFHVmNiaUFnSUNBZ0tpQmhjM04xYlhCMGFXOXVJR2x6SUhSb1lYUWdZWFIwY21saWRYUmxJRndpYlhrdFlYUjBjbWxpZFhSbFhDSWdZMjl5Y21WemNHOXVaSE1nZDJsMGFDQndjbTl3WlhKMGVTQmNJblJvYVhNdWJYbEJkSFJ5YVdKMWRHVmNJaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMnhoYzNOOUlGTjFjQ0F0SUZSb1pTQmpiR0Z6Y3lCMGJ5QnRhWGhwYmlCMGFHbHpJRkpsWVdSUGJteDVRWFIwY21saWRYUmxjeTVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRTWldGa1QyNXNlVUYwZEhKcFluVjBaWE45SUZSb1pTQnRhWGhsWkNCcGJpQmpiR0Z6Y3k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCdGFYaHBibHh1SUNBZ0lDQXFJRUJoYkdsaGN5QlNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTmNiaUFnSUNBZ0tpOWNiaUFnSUNCamJHRnpjeUJsZUhSbGJtUnpJRk4xY0NCN1hHNWNiaUFnSUNBZ0lDQWdMeW9xWEc0Z0lDQWdJQ0FnSUNBcUlFTmhiR3hpWVdOcklIUm9ZWFFnYVhNZ1pYaGxZM1YwWldRZ2QyaGxiaUJoYmlCdlluTmxjblpsWkNCaGRIUnlhV0oxZEdVbmN5QjJZV3gxWlNCcGMxeHVJQ0FnSUNBZ0lDQWdLaUJqYUdGdVoyVmtMaUJKWmlCMGFHVWdTRlJOVEVWc1pXMWxiblFnYVhNZ1kyOXVibVZqZEdWa0lIUnZJSFJvWlNCRVQwMHNJSFJvWlNCaGRIUnlhV0oxZEdWY2JpQWdJQ0FnSUNBZ0lDb2dkbUZzZFdVZ1kyRnVJRzl1YkhrZ1ltVWdjMlYwSUhSdklIUm9aU0JqYjNKeVpYTndiMjVrYVc1bklFaFVUVXhGYkdWdFpXNTBKM01nY0hKdmNHVnlkSGt1WEc0Z0lDQWdJQ0FnSUNBcUlFbHVJR1ZtWm1WamRDd2dkR2hwY3lCdFlXdGxjeUIwYUdseklFaFVUVXhGYkdWdFpXNTBKM01nWVhSMGNtbGlkWFJsY3lCeVpXRmtMVzl1YkhrdVhHNGdJQ0FnSUNBZ0lDQXFYRzRnSUNBZ0lDQWdJQ0FxSUVadmNpQmxlR0Z0Y0d4bExDQnBaaUJoYmlCSVZFMU1SV3hsYldWdWRDQm9ZWE1nWVc0Z1lYUjBjbWxpZFhSbElGd2llRndpSUdGdVpGeHVJQ0FnSUNBZ0lDQWdLaUJqYjNKeVpYTndiMjVrYVc1bklIQnliM0JsY25SNUlGd2llRndpTENCMGFHVnVJR05vWVc1bmFXNW5JSFJvWlNCMllXeDFaU0JjSW5oY0lpQjBieUJjSWpWY0lseHVJQ0FnSUNBZ0lDQWdLaUIzYVd4c0lHOXViSGtnZDI5eWF5QjNhR1Z1SUdCMGFHbHpMbmdnUFQwOUlEVmdMbHh1SUNBZ0lDQWdJQ0FnS2x4dUlDQWdJQ0FnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JtRnRaU0F0SUZSb1pTQmhkSFJ5YVdKMWRHVW5jeUJ1WVcxbExseHVJQ0FnSUNBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdiMnhrVm1Gc2RXVWdMU0JVYUdVZ1lYUjBjbWxpZFhSbEozTWdiMnhrSUhaaGJIVmxMbHh1SUNBZ0lDQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnYm1WM1ZtRnNkV1VnTFNCVWFHVWdZWFIwY21saWRYUmxKM01nYm1WM0lIWmhiSFZsTGx4dUlDQWdJQ0FnSUNBZ0tpOWNiaUFnSUNBZ0lDQWdZWFIwY21saWRYUmxRMmhoYm1kbFpFTmhiR3hpWVdOcktHNWhiV1VzSUc5c1pGWmhiSFZsTENCdVpYZFdZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1FXeHNJR0YwZEhKcFluVjBaWE1nWVhKbElHMWhaR1VnY21WaFpDMXZibXg1SUhSdklIQnlaWFpsYm5RZ1kyaGxZWFJwYm1jZ1lua2dZMmhoYm1kcGJtZGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklIUm9aU0JoZEhSeWFXSjFkR1VnZG1Gc2RXVnpMaUJQWmlCamIzVnljMlVzSUhSb2FYTWdhWE1nWW5rZ2JtOWNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHZDFZWEpoYm5SbFpTQjBhR0YwSUhWelpYSnpJSGRwYkd3Z2JtOTBJR05vWldGMElHbHVJR0VnWkdsbVptVnlaVzUwSUhkaGVTNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJ5YjNCbGNuUjVJRDBnWVhSMGNtbGlkWFJsTW5CeWIzQmxjblI1S0c1aGJXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdVkyOXVibVZqZEdWa0lDWW1JRzVsZDFaaGJIVmxJQ0U5UFNCZ0pIdDBhR2x6VzNCeWIzQmxjblI1WFgxZ0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9ibUZ0WlN3Z2RHaHBjMXR3Y205d1pYSjBlVjBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtTnZibk4wSUZaaGJHbGtZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtHMXpaeWtnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWh0YzJjcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWbUZzYVdSaGRHbHZia1Z5Y205eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMVpoYkdsa1lYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRjkyWVd4MVpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZlpHVm1ZWFZzZEZaaGJIVmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWxjbkp2Y25NZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNWpiMjV6ZENCVWVYQmxWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk1nUFNCYlhYMHBJSHRjYmlBZ0lDQWdJQ0FnWDNaaGJIVmxMbk5sZENoMGFHbHpMQ0IyWVd4MVpTazdYRzRnSUNBZ0lDQWdJRjlrWldaaGRXeDBWbUZzZFdVdWMyVjBLSFJvYVhNc0lHUmxabUYxYkhSV1lXeDFaU2s3WEc0Z0lDQWdJQ0FnSUY5bGNuSnZjbk11YzJWMEtIUm9hWE1zSUdWeWNtOXljeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUc5eWFXZHBiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5MllXeDFaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUhaaGJIVmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXBjMVpoYkdsa0lEOGdkR2hwY3k1dmNtbG5hVzRnT2lCZlpHVm1ZWFZzZEZaaGJIVmxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQm5aWFFnWlhKeWIzSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJWeWNtOXljeTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUdselZtRnNhV1FvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBd0lENDlJSFJvYVhNdVpYSnliM0p6TG14bGJtZDBhRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmtaV1poZFd4MFZHOG9ibVYzUkdWbVlYVnNkQ2tnZTF4dUlDQWdJQ0FnSUNCZlpHVm1ZWFZzZEZaaGJIVmxMbk5sZENoMGFHbHpMQ0J1WlhkRVpXWmhkV3gwS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1gyTm9aV05yS0h0d2NtVmthV05oZEdVc0lHSnBibVJXWVhKcFlXSnNaWE1nUFNCYlhTd2dSWEp5YjNKVWVYQmxJRDBnVm1Gc2FXUmhkR2x2YmtWeWNtOXlmU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J3Y205d2IzTnBkR2x2YmlBOUlIQnlaV1JwWTJGMFpTNWhjSEJzZVNoMGFHbHpMQ0JpYVc1a1ZtRnlhV0ZpYkdWektUdGNiaUFnSUNBZ0lDQWdhV1lnS0NGd2NtOXdiM05wZEdsdmJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWlhKeWIzSWdQU0J1WlhjZ1JYSnliM0pVZVhCbEtIUm9hWE11ZG1Gc2RXVXNJR0pwYm1SV1lYSnBZV0pzWlhNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk5amIyNXpiMnhsTG5kaGNtNG9aWEp5YjNJdWRHOVRkSEpwYm1jb0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbVZ5Y205eWN5NXdkWE5vS0dWeWNtOXlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkhsd1pWWmhiR2xrWVhSdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRXWVd4cFpHRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMVpoYkdsa1lYUnBiMjVGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCUVlYSnpaVVZ5Y205eUlEMGdZMnhoYzNNZ1pYaDBaVzVrY3lCV1lXeHBaR0YwYVc5dVJYSnliM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxelp5a2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaHRjMmNwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1VHRnljMlZGY25KdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRXWVd4cFpHRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMVpoYkdsa1lYUnBiMjVGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCSmJuWmhiR2xrVkhsd1pVVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJXWVd4cFpHRjBhVzl1UlhKeWIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLRzF6WnlrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lodGMyY3BPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnU1c1MllXeHBaRlI1Y0dWRmNuSnZjbHh1ZlR0Y2JpSXNJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dWFXMXdiM0owSUh0VWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlVZVhCbFZtRnNhV1JoZEc5eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFCaGNuTmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDFCaGNuTmxSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3U1c1MllXeHBaRlI1Y0dWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZTVzUyWVd4cFpGUjVjR1ZGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCSlRsUkZSMFZTWDBSRlJrRlZURlJmVmtGTVZVVWdQU0F3TzF4dVkyOXVjM1FnU1c1MFpXZGxjbFI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUVsT1ZFVkhSVkpmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pHVm1ZWFZzZEZaaGJIVmxJRDBnU1U1VVJVZEZVbDlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjbk1nUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb1RuVnRZbVZ5TG1selNXNTBaV2RsY2locGJuQjFkQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdhVzV3ZFhRN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9YQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUdsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCd1lYSnpaV1JXWVd4MVpTQTlJSEJoY25ObFNXNTBLR2x1Y0hWMExDQXhNQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvVG5WdFltVnlMbWx6U1c1MFpXZGxjaWh3WVhKelpXUldZV3gxWlNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjJZV3gxWlNBOUlIQmhjbk5sWkZaaGJIVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnVUdGeWMyVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUVsdWRtRnNhV1JVZVhCbFJYSnliM0lvYVc1d2RYUXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lITjFjR1Z5S0h0MllXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbExDQmxjbkp2Y25OOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCc1lYSm5aWEpVYUdGdUtHNHBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0c0cElEMCtJSFJvYVhNdWIzSnBaMmx1SUQ0OUlHNHNYRzRnSUNBZ0lDQWdJQ0FnSUNCaWFXNWtWbUZ5YVdGaWJHVnpPaUJiYmwxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyMWhiR3hsY2xSb1lXNG9iaWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb2Jpa2dQVDRnZEdocGN5NXZjbWxuYVc0Z1BEMGdiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnBibVJXWVhKcFlXSnNaWE02SUZ0dVhWeHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmlaWFIzWldWdUtHNHNJRzBwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tHNHNJRzBwSUQwK0lIUm9hWE11YkdGeVoyVnlWR2hoYmlodUtTQW1KaUIwYUdsekxuTnRZV3hzWlhKVWFHRnVLRzBwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZbWx1WkZaaGNtbGhZbXhsY3pvZ1cyNHNJRzFkWEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0SmJuWmhiR2xrVkhsd1pVVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlKYm5aaGJHbGtWSGx3WlVWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZJRDBnWENKY0lqdGNibU52Ym5OMElGTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmtaV1poZFd4MFZtRnNkV1VnUFNCVFZGSkpUa2RmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYSnliM0p6SUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2ljM1J5YVc1blhDSWdQVDA5SUhSNWNHVnZaaUJwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2JtOTBSVzF3ZEhrb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5amFHVmpheWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndjbVZrYVdOaGRHVTZJQ2dwSUQwK0lGd2lYQ0lnSVQwOUlIUm9hWE11YjNKcFoybHVYRzRnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1UzUnlhVzVuVkhsd1pWWmhiR2xrWVhSdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzR2TDJsdGNHOXlkQ0I3VUdGeWMyVkZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2VUdGeWMyVkZjbkp2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRKYm5aaGJHbGtWSGx3WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVZ1BTQmNJbUpzWVdOclhDSTdYRzVqYjI1emRDQkRiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFTlBURTlTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUmxabUYxYkhSV1lXeDFaU0E5SUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNtOXljeUE5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoY0luTjBjbWx1WjF3aUlEMDlQU0IwZVhCbGIyWWdhVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnYVc1d2RYUTdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnU1c1MllXeHBaRlI1Y0dWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2MzVndaWElvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5YzMwcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFSNWNHVldZV3hwWkdGMGIzSjlJR1p5YjIwZ1hDSXVMMVI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3VUdGeWMyVkZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2VUdGeWMyVkZjbkp2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRKYm5aaGJHbGtWSGx3WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUVKUFQweEZRVTVmUkVWR1FWVk1WRjlXUVV4VlJTQTlJR1poYkhObE8xeHVZMjl1YzNRZ1FtOXZiR1ZoYmxSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFSlBUMHhGUVU1ZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1FrOVBURVZCVGw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y25NZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9hVzV3ZFhRZ2FXNXpkR0Z1WTJWdlppQkNiMjlzWldGdUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaU0E5SUdsdWNIVjBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0Z3aWMzUnlhVzVuWENJZ1BUMDlJSFI1Y0dWdlppQnBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDOTBjblZsTDJrdWRHVnpkQ2hwYm5CMWRDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0M5bVlXeHpaUzlwTG5SbGMzUW9hVzV3ZFhRcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkbUZzZFdVZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaWEp5YjNKekxuQjFjMmdvYm1WM0lGQmhjbk5sUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Z5Y205eWN5NXdkWE5vS0c1bGR5QkpiblpoYkdsa1ZIbHdaVVZ5Y205eUtHbHVjSFYwS1NrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaDdkbUZzZFdVc0lHUmxabUYxYkhSV1lXeDFaU3dnWlhKeWIzSnpmU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhWE5VY25WbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvS1NBOVBpQjBjblZsSUQwOVBTQjBhR2x6TG05eWFXZHBibHh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwYzBaaGJITmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb0tTQTlQaUJtWVd4elpTQTlQVDBnZEdocGN5NXZjbWxuYVc1Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEpiblJsWjJWeVZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2U1c1MFpXZGxjbFI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3VTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y24wZ1puSnZiU0JjSWk0dlUzUnlhVzVuVkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0RGIyeHZjbFI1Y0dWV1lXeHBaR0YwYjNKOUlHWnliMjBnWENJdUwwTnZiRzl5Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0Q2IyOXNaV0Z1Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZRbTl2YkdWaGJsUjVjR1ZXWVd4cFpHRjBiM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR0p2YjJ4bFlXNG9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZMjlzYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QkRiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSW9hVzV3ZFhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdsdWRHVm5aWElvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCSmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpaHBibkIxZENrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzNSeWFXNW5LR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnVTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc1OU8xeHVYRzVqYjI1emRDQldZV3hwWkdGMGIzSlRhVzVuYkdWMGIyNGdQU0J1WlhjZ1ZtRnNhV1JoZEc5eUtDazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWbUZzYVdSaGRHOXlVMmx1WjJ4bGRHOXVJR0Z6SUhaaGJHbGtZWFJsWEc1OU8xeHVJaXdpTHlvcVhHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGdzSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5OXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzMwZ1puSnZiU0JjSWk0dmJXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6TG1welhDSTdYRzVwYlhCdmNuUWdlM1poYkdsa1lYUmxmU0JtY205dElGd2lMaTkyWVd4cFpHRjBaUzkyWVd4cFpHRjBaUzVxYzF3aU8xeHVYRzVqYjI1emRDQlVRVWRmVGtGTlJTQTlJRndpZEc5d0xXUnBaVndpTzF4dVhHNWpiMjV6ZENCRFNWSkRURVZmUkVWSFVrVkZVeUE5SURNMk1Ec2dMeThnWkdWbmNtVmxjMXh1WTI5dWMzUWdUbFZOUWtWU1gwOUdYMUJKVUZNZ1BTQTJPeUF2THlCRVpXWmhkV3gwSUM4Z2NtVm5kV3hoY2lCemFYZ2djMmxrWldRZ1pHbGxJR2hoY3lBMklIQnBjSE1nYldGNGFXMTFiUzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZRMDlNVDFJZ1BTQmNJa2wyYjNKNVhDSTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxZ2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVpJRDBnTURzZ0x5OGdjSGhjYm1OdmJuTjBJRVJGUmtGVlRGUmZVazlVUVZSSlQwNGdQU0F3T3lBdkx5QmtaV2R5WldWelhHNWpiMjV6ZENCRVJVWkJWVXhVWDA5UVFVTkpWRmtnUFNBd0xqVTdYRzVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRWhGVEVSZlFsbGZRVlJVVWtsQ1ZWUkZJRDBnWENKb1pXeGtMV0o1WENJN1hHNWpiMjV6ZENCUVNWQlRYMEZVVkZKSlFsVlVSU0E5SUZ3aWNHbHdjMXdpTzF4dVkyOXVjM1FnVWs5VVFWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSnliM1JoZEdsdmJsd2lPMXh1WTI5dWMzUWdXRjlCVkZSU1NVSlZWRVVnUFNCY0luaGNJanRjYm1OdmJuTjBJRmxmUVZSVVVrbENWVlJGSUQwZ1hDSjVYQ0k3WEc1Y2JtTnZibk4wSUVKQlUwVmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUE5SURFMU95QXZMeUJ3ZUZ4dVkyOXVjM1FnUWtGVFJWOVRWRkpQUzBWZlYwbEVWRWdnUFNBeUxqVTdJQzh2SUhCNFhHNWpiMjV6ZENCTlNVNWZVMVJTVDB0RlgxZEpSRlJJSUQwZ01Uc2dMeThnY0hoY2JtTnZibk4wSUVoQlRFWWdQU0JDUVZORlgwUkpSVjlUU1ZwRklDOGdNanNnTHk4Z2NIaGNibU52Ym5OMElGUklTVkpFSUQwZ1FrRlRSVjlFU1VWZlUwbGFSU0F2SURNN0lDOHZJSEI0WEc1amIyNXpkQ0JRU1ZCZlUwbGFSU0E5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF4TlRzZ0x5OXdlRnh1WTI5dWMzUWdVRWxRWDBOUFRFOVNJRDBnWENKaWJHRmphMXdpTzF4dVhHNWpiMjV6ZENCa1pXY3ljbUZrSUQwZ0tHUmxaeWtnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUJrWldjZ0tpQW9UV0YwYUM1UVNTQXZJREU0TUNrN1hHNTlPMXh1WEc1amIyNXpkQ0JwYzFCcGNFNTFiV0psY2lBOUlHNGdQVDRnZTF4dUlDQWdJR052Ym5OMElHNTFiV0psY2lBOUlIQmhjbk5sU1c1MEtHNHNJREV3S1R0Y2JpQWdJQ0J5WlhSMWNtNGdUblZ0WW1WeUxtbHpTVzUwWldkbGNpaHVkVzFpWlhJcElDWW1JREVnUEQwZ2JuVnRZbVZ5SUNZbUlHNTFiV0psY2lBOFBTQk9WVTFDUlZKZlQwWmZVRWxRVXp0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUjJWdVpYSmhkR1VnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzltSUhCcGNITWdZbVYwZDJWbGJpQXhJR0Z1WkNCMGFHVWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UwNTFiV0psY24wZ1FTQnlZVzVrYjIwZ2JuVnRZbVZ5SUc0c0lERWc0b21rSUc0ZzRvbWtJRTVWVFVKRlVsOVBSbDlRU1ZCVExseHVJQ292WEc1amIyNXpkQ0J5WVc1a2IyMVFhWEJ6SUQwZ0tDa2dQVDRnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nVGxWTlFrVlNYMDlHWDFCSlVGTXBJQ3NnTVR0Y2JseHVZMjl1YzNRZ1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVeUE5SUZ0Y0l1S2FnRndpTEZ3aTRwcUJYQ0lzWENMaW1vSmNJaXhjSXVLYWcxd2lMRndpNHBxRVhDSXNYQ0xpbW9WY0lsMDdYRzVjYmk4cUtseHVJQ29nUTI5dWRtVnlkQ0JoSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR1JwWlNCbVlXTmxJSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3Y3lCdlpseHVJQ29nZEdoaGRDQnpZVzFsSUdScFpTNGdWR2hwY3lCbWRXNWpkR2x2YmlCcGN5QjBhR1VnY21WMlpYSnpaU0J2WmlCd2FYQnpWRzlWYm1samIyUmxMbHh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQjFJQzBnVkdobElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlIUnZJR052Ym5abGNuUWdkRzhnY0dsd2N5NWNiaUFxSUVCeVpYUjFjbTV6SUh0T2RXMWlaWEo4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaXdnYjNKY2JpQXFJSFZ1WkdWbWFXNWxaQ0JwWmlCMUlIZGhjeUJ1YjNRZ1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpQnlaWEJ5WlhObGJuUnBibWNnWVNCa2FXVXVYRzRnS2k5Y2JtTnZibk4wSUhWdWFXTnZaR1ZVYjFCcGNITWdQU0FvZFNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUdScFpVTm9ZWEpKYm1SbGVDQTlJRVJKUlY5VlRrbERUMFJGWDBOSVFWSkJRMVJGVWxNdWFXNWtaWGhQWmloMUtUdGNiaUFnSUNCeVpYUjFjbTRnTUNBOFBTQmthV1ZEYUdGeVNXNWtaWGdnUHlCa2FXVkRhR0Z5U1c1a1pYZ2dLeUF4SURvZ2RXNWtaV1pwYm1Wa08xeHVmVHRjYmx4dUx5b3FYRzRnS2lCRGIyNTJaWEowSUdFZ2JuVnRZbVZ5SUc5bUlIQnBjSE1zSURFZzRvbWtJSEJwY0hNZzRvbWtJRFlnZEc4Z1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNseHVJQ29nY21Wd2NtVnpaVzUwWVhScGIyNGdiMllnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnWkdsbElHWmhZMlV1SUZSb2FYTWdablZ1WTNScGIyNGdhWE1nZEdobElISmxkbVZ5YzJWY2JpQXFJRzltSUhWdWFXTnZaR1ZVYjFCcGNITXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlIQWdMU0JVYUdVZ2JuVnRZbVZ5SUc5bUlIQnBjSE1nZEc4Z1kyOXVkbVZ5ZENCMGJ5QmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlMbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UxTjBjbWx1WjN4MWJtUmxabWx1WldSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIVnVhV052WkdVZ1kyaGhjbUZqZEdWeWN5QnZjbHh1SUNvZ2RXNWtaV1pwYm1Wa0lHbG1JSEFnZDJGeklHNXZkQ0JpWlhSM1pXVnVJREVnWVc1a0lEWWdhVzVqYkhWemFYWmxMbHh1SUNvdlhHNWpiMjV6ZENCd2FYQnpWRzlWYm1samIyUmxJRDBnY0NBOVBpQnBjMUJwY0U1MWJXSmxjaWh3S1NBL0lFUkpSVjlWVGtsRFQwUkZYME5JUVZKQlExUkZVbE5iY0NBdElERmRJRG9nZFc1a1pXWnBibVZrTzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpJYjJ4a0lEMGdLR052Ym5SbGVIUXNJSGdzSUhrc0lIZHBaSFJvTENCamIyeHZjaWtnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRk5GVUVWU1FWUlBVaUE5SUhkcFpIUm9JQzhnTXpBN1hHNGdJQ0FnWTI5dWRHVjRkQzV6WVhabEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bmJHOWlZV3hCYkhCb1lTQTlJRVJGUmtGVlRGUmZUMUJCUTBsVVdUdGNiaUFnSUNCamIyNTBaWGgwTG1KbFoybHVVR0YwYUNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Wm1sc2JGTjBlV3hsSUQwZ1kyOXNiM0k3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vZUNBcklIZHBaSFJvTENCNUlDc2dkMmxrZEdnc0lIZHBaSFJvSUMwZ1UwVlFSVkpCVkU5U0xDQXdMQ0F5SUNvZ1RXRjBhQzVRU1N3Z1ptRnNjMlVwTzF4dUlDQWdJR052Ym5SbGVIUXVabWxzYkNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Y21WemRHOXlaU2dwTzF4dWZUdGNibHh1WTI5dWMzUWdjbVZ1WkdWeVJHbGxJRDBnS0dOdmJuUmxlSFFzSUhnc0lIa3NJSGRwWkhSb0xDQmpiMnh2Y2lrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUZORFFVeEZJRDBnS0hkcFpIUm9JQzhnU0VGTVJpazdYRzRnSUNBZ1kyOXVjM1FnU0VGTVJsOUpUazVGVWw5VFNWcEZJRDBnVFdGMGFDNXpjWEowS0hkcFpIUm9JQ29xSURJZ0x5QXlLVHRjYmlBZ0lDQmpiMjV6ZENCSlRrNUZVbDlUU1ZwRklEMGdNaUFxSUVoQlRFWmZTVTVPUlZKZlUwbGFSVHRjYmlBZ0lDQmpiMjV6ZENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdQU0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUFxSUZORFFVeEZPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBOUlFbE9Ua1ZTWDFOSldrVWdMU0F5SUNvZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRPMXh1SUNBZ0lHTnZibk4wSUZOVVVrOUxSVjlYU1VSVVNDQTlJRTFoZEdndWJXRjRLRTFKVGw5VFZGSlBTMFZmVjBsRVZFZ3NJRUpCVTBWZlUxUlNUMHRGWDFkSlJGUklJQ29nVTBOQlRFVXBPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJZSUQwZ2VDQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTzF4dUlDQWdJR052Ym5OMElITjBZWEowV1NBOUlIa2dLeUIzYVdSMGFDQXRJRWhCVEVaZlNVNU9SVkpmVTBsYVJUdGNibHh1SUNBZ0lHTnZiblJsZUhRdWMyRjJaU2dwTzF4dUlDQWdJR052Ym5SbGVIUXVZbVZuYVc1UVlYUm9LQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzVTNSNWJHVWdQU0JqYjJ4dmNqdGNiaUFnSUNCamIyNTBaWGgwTG5OMGNtOXJaVk4wZVd4bElEMGdYQ0ppYkdGamExd2lPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVmRwWkhSb0lEMGdVMVJTVDB0RlgxZEpSRlJJTzF4dUlDQWdJR052Ym5SbGVIUXViVzkyWlZSdktITjBZWEowV0N3Z2MzUmhjblJaS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUlDc2dTVTVPUlZKZlUwbGFSVjlTVDFWT1JFVkVMQ0J6ZEdGeWRGa2dLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnWkdWbk1uSmhaQ2d5TnpBcExDQmtaV2N5Y21Ga0tEQXBLVHRjYmlBZ0lDQmpiMjUwWlhoMExteHBibVZVYnloemRHRnlkRmdnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeWs3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFTENCemRHRnlkRmtnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3dLU3dnWkdWbk1uSmhaQ2c1TUNrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1YkdsdVpWUnZLSE4wWVhKMFdDd2djM1JoY25SWklDc2dTVTVPUlZKZlUwbGFSU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1pHVm5NbkpoWkNnNU1Da3NJR1JsWnpKeVlXUW9NVGd3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUlDMGdVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCemRHRnlkRmtnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDd2djM1JoY25SWklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJR1JsWnpKeVlXUW9NVGd3S1N3Z1pHVm5NbkpoWkNneU56QXBLVHRjYmx4dUlDQWdJR052Ym5SbGVIUXVjM1J5YjJ0bEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpRYVhBZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dwSUQwK0lIdGNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtSmxaMmx1VUdGMGFDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiRk4wZVd4bElEMGdVRWxRWDBOUFRFOVNPMXh1SUNBZ0lHTnZiblJsZUhRdWJXOTJaVlJ2S0hnc0lIa3BPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSGdzSUhrc0lIZHBaSFJvTENBd0xDQXlJQ29nVFdGMGFDNVFTU3dnWm1Gc2MyVXBPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiQ2dwTzF4dUlDQWdJR052Ym5SbGVIUXVjbVZ6ZEc5eVpTZ3BPMXh1ZlR0Y2JseHVYRzR2THlCUWNtbDJZWFJsSUhCeWIzQmxjblJwWlhOY2JtTnZibk4wSUY5aWIyRnlaQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJobGJHUkNlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjR2x3Y3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmY205MFlYUnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2dnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2tnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc0dktpcGNiaUFxSUZSdmNFUnBaU0JwY3lCMGFHVWdYQ0owYjNBdFpHbGxYQ0lnWTNWemRHOXRJRnRJVkUxTVhHNGdLaUJsYkdWdFpXNTBYU2hvZEhSd2N6b3ZMMlJsZG1Wc2IzQmxjaTV0YjNwcGJHeGhMbTl5Wnk5bGJpMVZVeTlrYjJOekwxZGxZaTlCVUVrdlNGUk5URVZzWlcxbGJuUXBJSEpsY0hKbGMyVnVkR2x1WnlCaElHUnBaVnh1SUNvZ2IyNGdkR2hsSUdScFkyVWdZbTloY21RdVhHNGdLbHh1SUNvZ1FHVjRkR1Z1WkhNZ1NGUk5URVZzWlcxbGJuUmNiaUFxSUVCdGFYaGxjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYmlBcUwxeHVZMjl1YzNRZ1ZHOXdSR2xsSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE1vU0ZSTlRFVnNaVzFsYm5RcElIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCVWIzQkVhV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdXMk52Ym1acFp5QTlJSHQ5WFNBdElGUm9aU0JwYm1sMGFXRnNJR052Ym1acFozVnlZWFJwYjI0Z2IyWWdkR2hsSUdScFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY254dWRXeHNmU0JiWTI5dVptbG5MbkJwY0hOZElDMGdWR2hsSUhCcGNITWdiMllnZEdobElHUnBaU0IwYnlCaFpHUXVYRzRnSUNBZ0lDb2dTV1lnYm04Z2NHbHdjeUJoY21VZ2MzQmxZMmxtYVdWa0lHOXlJSFJvWlNCd2FYQnpJR0Z5WlNCdWIzUWdZbVYwZDJWbGJpQXhJR0Z1WkNBMkxDQmhJSEpoYm1SdmJWeHVJQ0FnSUNBcUlHNTFiV0psY2lCaVpYUjNaV1Z1SURFZ1lXNWtJRFlnYVhNZ1oyVnVaWEpoZEdWa0lHbHVjM1JsWVdRdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUZ0amIyNW1hV2N1WTI5c2IzSmRJQzBnVkdobElHTnZiRzl5SUc5bUlIUm9aU0JrYVdVZ2RHOGdZV1JrTGlCRVpXWmhkV3gwWEc0Z0lDQWdJQ29nZEc4Z2RHaGxJR1JsWm1GMWJIUWdZMjlzYjNJdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUZ0amIyNW1hV2N1ZUYwZ0xTQlVhR1VnZUNCamIyOXlaR2x1WVhSbElHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWVWMGdMU0JVYUdVZ2VTQmpiMjl5WkdsdVlYUmxJRzltSUhSb1pTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjbTkwWVhScGIyNWRJQzBnVkdobElISnZkR0YwYVc5dUlHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJRnRqYjI1bWFXY3VhR1ZzWkVKNVhTQXRJRlJvWlNCd2JHRjVaWElnYUc5c1pHbHVaeUIwYUdVZ1pHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHR3YVhCekxDQmpiMnh2Y2l3Z2NtOTBZWFJwYjI0c0lIZ3NJSGtzSUdobGJHUkNlWDBnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEJwY0hOV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1sdWRHVm5aWElvY0dsd2N5QjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdVltVjBkMlZsYmlneExDQTJLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aHlZVzVrYjIxUWFYQnpLQ2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNWNiaUFnSUNBZ0lDQWdYM0JwY0hNdWMyVjBLSFJvYVhNc0lIQnBjSE5XWVd4MVpTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRkJKVUZOZlFWUlVVa2xDVlZSRkxDQndhWEJ6Vm1Gc2RXVXBPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZMjlzYjNJZ1BTQjJZV3hwWkdGMFpTNWpiMnh2Y2loamIyeHZjaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhFUlVaQlZVeFVYME5QVEU5U0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbTkwWVhScGIyNGdQU0IyWVd4cFpHRjBaUzVwYm5SbFoyVnlLSEp2ZEdGMGFXOXVJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0ZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WW1WMGQyVmxiaWd3TENBek5qQXBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVpHVm1ZWFZzZEZSdktFUkZSa0ZWVEZSZlVrOVVRVlJKVDA0cFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NTRJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWg0SUh4OElIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGaGZRVlJVVWtsQ1ZWUkZLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLRVJGUmtGVlRGUmZXQ2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG5rZ1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtIa2dmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvV1Y5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG14aGNtZGxjbFJvWVc0b01DbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1JFVkdRVlZNVkY5WktWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdkbUZzYVdSaGRHVXVjM1J5YVc1bktHaGxiR1JDZVNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaElSVXhFWDBKWlgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJtOTBSVzF3ZEhrb0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnlodWRXeHNLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE4wWVhScFl5Qm5aWFFnYjJKelpYSjJaV1JCZEhSeWFXSjFkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1NFVk1SRjlDV1Y5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JRU1ZCVFgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRmhmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdXVjlCVkZSU1NVSlZWRVZjYmlBZ0lDQWdJQ0FnWFR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0FnSUNBZ1gySnZZWEprTG5ObGRDaDBhR2x6TENCMGFHbHpMbkJoY21WdWRFNXZaR1VwTzF4dUlDQWdJQ0FnSUNCZlltOWhjbVF1WjJWMEtIUm9hWE1wTG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUVWMlpXNTBLRndpZEc5d0xXUnBaVHBoWkdSbFpGd2lLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR2x6WTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnSUNBZ0lGOWliMkZ5WkM1blpYUW9kR2hwY3lrdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQXRaR2xsT25KbGJXOTJaV1JjSWlrcE8xeHVJQ0FnSUNBZ0lDQmZZbTloY21RdWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnZEdocGN5QkVhV1VnZEc4Z2RHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2IyWWdZU0JrYVdVZ1ptRmpaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUdOdmNuSmxjM0J2Ym1ScGJtY2dkRzhnZEdobElHNTFiV0psY2lCdlpseHVJQ0FnSUNBcUlIQnBjSE1nYjJZZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnZEc5VmJtbGpiMlJsS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NHbHdjMVJ2Vlc1cFkyOWtaU2gwYUdsekxuQnBjSE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOeVpXRjBaU0JoSUhOMGNtbHVaeUJ5WlhCeVpYTmxibUYwYVc5dUlHWnZjaUIwYUdseklHUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnYzNsdFltOXNJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUc1MWJXSmxjaUJ2WmlCd2FYQnpYRzRnSUNBZ0lDb2diMllnZEdocGN5QmthV1V1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxuUnZWVzVwWTI5a1pTZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nYm5WdFltVnlJRzltSUhCcGNITXNJREVnNG9ta0lIQnBjSE1nNG9ta0lEWXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCd2FYQnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNCcGNITXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0JqYjJ4dmNpaHVaWGREYjJ4dmNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0E5UFQwZ2JtVjNRMjlzYjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFTlBURTlTWDBGVVZGSkpRbFZVUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmWTI5c2IzSXVjMlYwS0hSb2FYTXNJRVJGUmtGVlRGUmZRMDlNVDFJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJOdmJHOXlMbk5sZENoMGFHbHpMQ0J1WlhkRGIyeHZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVc0lHNWxkME52Ykc5eUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCMGFHRjBJR2x6SUdodmJHUnBibWNnZEdocGN5QkVhV1VzSUdsbUlHRnVlUzRnVG5Wc2JDQnZkR2hsY25kcGMyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeWZHNTFiR3g5SUZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXeGtRbmtvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmFHVnNaRUo1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUdobGJHUkNlU2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnWDJobGJHUkNlUzV6WlhRb2RHaHBjeXdnY0d4aGVXVnlLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlIQnNZWGxsY2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXNJSEJzWVhsbGNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmpiMjl5WkdsdVlYUmxjeUJ2WmlCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHREYjI5eVpHbHVZWFJsYzN4dWRXeHNmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjI5eVpHbHVZWFJsY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnUFQwOUlIUm9hWE11ZUNCOGZDQnVkV3hzSUQwOVBTQjBhR2x6TG5rZ1B5QnVkV3hzSURvZ2UzZzZJSFJvYVhNdWVDd2dlVG9nZEdocGN5NTVmVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJR052YjNKa2FXNWhkR1Z6S0dNcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUdNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVlQ0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JqTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1NElEMGdlRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZVNBOUlIazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJFYjJWeklIUm9hWE1nUkdsbElHaGhkbVVnWTI5dmNtUnBibUYwWlhNL1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0Q2IyOXNaV0Z1ZlNCVWNuVmxJSGRvWlc0Z2RHaGxJRVJwWlNCa2IyVnpJR2hoZG1VZ1kyOXZjbVJwYm1GMFpYTmNiaUFnSUNBZ0tpOWNiaUFnSUNCb1lYTkRiMjl5WkdsdVlYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dJVDA5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE03WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIZ2dZMjl2Y21ScGJtRjBaVnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2VDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjk0TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUhnb2JtVjNXQ2tnZTF4dUlDQWdJQ0FnSUNCZmVDNXpaWFFvZEdocGN5d2dibVYzV0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2llRndpTENCdVpYZFlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2VTQmpiMjl5WkdsdVlYUmxYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCNUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM2t1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnZVNodVpYZFpLU0I3WEc0Z0lDQWdJQ0FnSUY5NUxuTmxkQ2gwYUdsekxDQnVaWGRaS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSjVYQ0lzSUc1bGQxa3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCeWIzUmhkR2x2YmlCdlppQjBhR2x6SUVScFpTNGdNQ0RpaWFRZ2NtOTBZWFJwYjI0ZzRvbWtJRE0yTUM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjhiblZzYkgxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2NtOTBZWFJwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZjbTkwWVhScGIyNHVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCelpYUWdjbTkwWVhScGIyNG9ibVYzVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnYm1WM1Vpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9YQ0p5YjNSaGRHbHZibHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHNXZjbTFoYkdsNlpXUlNiM1JoZEdsdmJpQTlJRzVsZDFJZ0pTQkRTVkpEVEVWZlJFVkhVa1ZGVXp0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl5YjNSaGRHbHZiaTV6WlhRb2RHaHBjeXdnYm05eWJXRnNhWHBsWkZKdmRHRjBhVzl1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRndpY205MFlYUnBiMjVjSWl3Z2JtOXliV0ZzYVhwbFpGSnZkR0YwYVc5dUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvY205M0lIUm9hWE1nUkdsbExpQlVhR1VnYm5WdFltVnlJRzltSUhCcGNITWdkRzhnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzRzSURFZzRvbWtJRzRnNG9ta0lEWXVYRzRnSUNBZ0lDb2dUMjVzZVNCa2FXTmxJSFJvWVhRZ1lYSmxJRzV2ZENCaVpXbHVaeUJvWld4a0lHTmhiaUJpWlNCMGFISnZkMjR1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBWm1seVpYTWdYQ0owYjNBNmRHaHliM2N0WkdsbFhDSWdkMmwwYUNCd1lYSmhiV1YwWlhKeklIUm9hWE1nUkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhSb2NtOTNTWFFvS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doZEdocGN5NXBjMGhsYkdRb0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhKaGJtUnZiVkJwY0hNb0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoUVNWQlRYMEZVVkZKSlFsVlVSU3dnZEdocGN5NXdhWEJ6S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZkR2h5YjNjdFpHbGxYQ0lzSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa1pYUmhhV3c2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsT2lCMGFHbHpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCb2IyeGtjeUIwYUdseklFUnBaUzRnUVNCd2JHRjVaWElnWTJGdUlHOXViSGtnYUc5c1pDQmhJR1JwWlNCMGFHRjBJR2x6SUc1dmRGeHVJQ0FnSUNBcUlHSmxhVzVuSUdobGJHUWdZbmtnWVc1dmRHaGxjaUJ3YkdGNVpYSWdlV1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJR2h2YkdRZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbWh2YkdRdFpHbGxYQ0lnZDJsMGFDQndZWEpoYldWMFpYSnpJSFJvYVhNZ1JHbGxJR0Z1WkNCMGFHVWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdodmJHUkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDRjBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtaGxiR1JDZVNBOUlIQnNZWGxsY2p0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZhRzlzWkMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklIUm9hWE1nUkdsbElHSmxhVzVuSUdobGJHUWdZbmtnWVc1NUlIQnNZWGxsY2o5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBKdmIyeGxZVzU5SUZSeWRXVWdkMmhsYmlCMGFHbHpJRVJwWlNCcGN5QmlaV2x1WnlCb1pXeGtJR0o1SUdGdWVTQndiR0Y1WlhJc0lHWmhiSE5sSUc5MGFHVnlkMmx6WlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JwYzBobGJHUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lDRTlQU0IwYUdsekxtaGxiR1JDZVR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeUlISmxiR1ZoYzJWeklIUm9hWE1nUkdsbExpQkJJSEJzWVhsbGNpQmpZVzRnYjI1c2VTQnlaV3hsWVhObElHUnBZMlVnZEdoaGRDQnphR1VnYVhOY2JpQWdJQ0FnS2lCb2IyeGthVzVuTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJSEpsYkdWaGMyVWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb2dRR1pwY21WeklGd2lkRzl3T25KbGJHRnpaUzFrYVdWY0lpQjNhWFJvSUhCaGNtRnRaWFJsY25NZ2RHaHBjeUJFYVdVZ1lXNWtJSFJvWlNCd2JHRjVaWElnY21Wc1pXRnphVzVuSUdsMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhKbGJHVmhjMlZKZENod2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdWFYTklaV3hrS0NrZ0ppWWdkR2hwY3k1b1pXeGtRbmt1WlhGMVlXeHpLSEJzWVhsbGNpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YUdWc1pFSjVJRDBnYm5Wc2JEdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFaEZURVJmUWxsZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dRM1Z6ZEc5dFJYWmxiblFvWENKMGIzQTZjbVZzWldGelpTMWthV1ZjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklIUm9hWE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnNZWGxsY2x4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGSmxibVJsY2lCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3UTJGdWRtRnpVbVZ1WkdWeWFXNW5RMjl1ZEdWNGRESkVmU0JqYjI1MFpYaDBJQzBnVkdobElHTmhiblpoY3lCamIyNTBaWGgwSUhSdklHUnlZWGRjYmlBZ0lDQWdLaUJ2Ymx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JrYVdWVGFYcGxJQzBnVkdobElITnBlbVVnYjJZZ1lTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI5eVpHbHVZWFJsY3lBOUlIUm9hWE11WTI5dmNtUnBibUYwWlhOZElDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZYRzRnSUNBZ0lDb2daSEpoZHlCMGFHbHpJR1JwWlM0Z1Fua2daR1ZtWVhWc2RDd2dkR2hwY3lCa2FXVWdhWE1nWkhKaGQyNGdZWFFnYVhSeklHOTNiaUJqYjI5eVpHbHVZWFJsY3l4Y2JpQWdJQ0FnS2lCaWRYUWdlVzkxSUdOaGJpQmhiSE52SUdSeVlYY2dhWFFnWld4elpYZG9aWEpsSUdsbUlITnZJRzVsWldSbFpDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCeVpXNWtaWElvWTI5dWRHVjRkQ3dnWkdsbFUybDZaU3dnWTI5dmNtUnBibUYwWlhNZ1BTQjBhR2x6TG1OdmIzSmthVzVoZEdWektTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElITmpZV3hsSUQwZ1pHbGxVMmw2WlNBdklFSkJVMFZmUkVsRlgxTkpXa1U3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRk5JUVV4R0lEMGdTRUZNUmlBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVkVoSlVrUWdQU0JVU0VsU1JDQXFJSE5qWVd4bE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCVFVFbFFYMU5KV2tVZ1BTQlFTVkJmVTBsYVJTQXFJSE5qWVd4bE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaDBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSkliMnhrS0dOdmJuUmxlSFFzSUhnc0lIa3NJRk5JUVV4R0xDQjBhR2x6TG1obGJHUkNlUzVqYjJ4dmNpazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9NQ0FoUFQwZ2RHaHBjeTV5YjNSaGRHbHZiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNTBjbUZ1YzJ4aGRHVW9lQ0FySUZOSVFVeEdMQ0I1SUNzZ1UwaEJURVlwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXliM1JoZEdVb1pHVm5NbkpoWkNoMGFHbHpMbkp2ZEdGMGFXOXVLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuUnlZVzV6YkdGMFpTZ3RNU0FxSUNoNElDc2dVMGhCVEVZcExDQXRNU0FxSUNoNUlDc2dVMGhCVEVZcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGJtUmxja1JwWlNoamIyNTBaWGgwTENCNExDQjVMQ0JUU0VGTVJpd2dkR2hwY3k1amIyeHZjaWs3WEc1Y2JpQWdJQ0FnSUNBZ2MzZHBkR05vSUNoMGFHbHpMbkJwY0hNcElIdGNiaUFnSUNBZ0lDQWdZMkZ6WlNBeE9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURJNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdNem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQTBPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFNFRk1SaXdnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHTmhjMlVnTmpvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5JUVV4R0xDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1ZWFZzZERvZ0x5OGdUbThnYjNSb1pYSWdkbUZzZFdWeklHRnNiRzkzWldRZ0x5QndiM056YVdKc1pWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnWTI5dWRHVjRkRnh1SUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbk5sZEZSeVlXNXpabTl5YlNneExDQXdMQ0F3TENBeExDQXdMQ0F3S1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzUzYVc1a2IzY3VZM1Z6ZEc5dFJXeGxiV1Z1ZEhNdVpHVm1hVzVsS0ZSQlIxOU9RVTFGTENCVWIzQkVhV1VwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBaU3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdVc1hHNGdJQ0FnVkVGSFgwNUJUVVZjYm4wN1hHNGlMQ0l2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ3dnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHREYjI1bWFXZDFjbUYwYVc5dVJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdFNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJR1p5YjIwZ1hDSXVMMjFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5NXFjMXdpTzF4dWFXMXdiM0owSUh0MllXeHBaR0YwWlgwZ1puSnZiU0JjSWk0dmRtRnNhV1JoZEdVdmRtRnNhV1JoZEdVdWFuTmNJanRjYmx4dVkyOXVjM1FnVkVGSFgwNUJUVVVnUFNCY0luUnZjQzF3YkdGNVpYSmNJanRjYmx4dUx5OGdWR2hsSUc1aGJXVnpJRzltSUhSb1pTQW9iMkp6WlhKMlpXUXBJR0YwZEhKcFluVjBaWE1nYjJZZ2RHaGxJRlJ2Y0ZCc1lYbGxjaTVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRTVCVFVWZlFWUlVVa2xDVlZSRklEMGdYQ0p1WVcxbFhDSTdYRzVqYjI1emRDQlRRMDlTUlY5QlZGUlNTVUpWVkVVZ1BTQmNJbk5qYjNKbFhDSTdYRzVqYjI1emRDQklRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVWdQU0JjSW1oaGN5MTBkWEp1WENJN1hHNWNiaTh2SUZSb1pTQndjbWwyWVhSbElIQnliM0JsY25ScFpYTWdiMllnZEdobElGUnZjRkJzWVhsbGNpQmNibU52Ym5OMElGOWpiMnh2Y2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYm1GdFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmMyTnZjbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMmhoYzFSMWNtNGdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVYRzR2S2lwY2JpQXFJRUVnVUd4aGVXVnlJR2x1SUdFZ1pHbGpaU0JuWVcxbExseHVJQ3BjYmlBcUlFRWdjR3hoZVdWeUozTWdibUZ0WlNCemFHOTFiR1FnWW1VZ2RXNXBjWFZsSUdsdUlIUm9aU0JuWVcxbExpQlVkMjhnWkdsbVptVnlaVzUwWEc0Z0tpQlViM0JRYkdGNVpYSWdaV3hsYldWdWRITWdkMmwwYUNCMGFHVWdjMkZ0WlNCdVlXMWxJR0YwZEhKcFluVjBaU0JoY21VZ2RISmxZWFJsWkNCaGMxeHVJQ29nZEdobElITmhiV1VnY0d4aGVXVnlMbHh1SUNwY2JpQXFJRWx1SUdkbGJtVnlZV3dnYVhRZ2FYTWdjbVZqYjIxdFpXNWtaV1FnZEdoaGRDQnVieUIwZDI4Z2NHeGhlV1Z5Y3lCa2J5Qm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMRnh1SUNvZ1lXeDBhRzkxWjJnZ2FYUWdhWE1nYm05MElIVnVZMjl1WTJWcGRtRmliR1VnZEdoaGRDQmpaWEowWVdsdUlHUnBZMlVnWjJGdFpYTWdhR0YyWlNCd2JHRjVaWEp6SUhkdmNtdGNiaUFxSUdsdUlIUmxZVzF6SUhkb1pYSmxJR2wwSUhkdmRXeGtJRzFoYTJVZ2MyVnVjMlVnWm05eUlIUjNieUJ2Y2lCdGIzSmxJR1JwWm1abGNtVnVkQ0J3YkdGNVpYSnpJSFJ2WEc0Z0tpQm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMbHh1SUNwY2JpQXFJRlJvWlNCdVlXMWxJR0Z1WkNCamIyeHZjaUJoZEhSeWFXSjFkR1Z6SUdGeVpTQnlaWEYxYVhKbFpDNGdWR2hsSUhOamIzSmxJR0Z1WkNCb1lYTXRkSFZ5Ymx4dUlDb2dZWFIwY21saWRYUmxjeUJoY21VZ2JtOTBMbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpQkFiV2w0WlhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNGdLaTljYm1OdmJuTjBJRlJ2Y0ZCc1lYbGxjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpLRWhVVFV4RmJHVnRaVzUwS1NCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1VHeGhlV1Z5TENCdmNIUnBiMjVoYkd4NUlHSmhjMlZrSUc5dUlHRnVJR2x1ZEdsMGFXRnNYRzRnSUNBZ0lDb2dZMjl1Wm1sbmRYSmhkR2x2YmlCMmFXRWdZVzRnYjJKcVpXTjBJSEJoY21GdFpYUmxjaUJ2Y2lCa1pXTnNZWEpsWkNCaGRIUnlhV0oxZEdWeklHbHVJRWhVVFV3dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnVzJOdmJtWnBaMTBnTFNCQmJpQnBibWwwYVdGc0lHTnZibVpwWjNWeVlYUnBiMjRnWm05eUlIUm9aVnh1SUNBZ0lDQXFJSEJzWVhsbGNpQjBieUJqY21WaGRHVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHTnZibVpwWnk1amIyeHZjaUF0SUZSb2FYTWdjR3hoZVdWeUozTWdZMjlzYjNJZ2RYTmxaQ0JwYmlCMGFHVWdaMkZ0WlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnWTI5dVptbG5MbTVoYldVZ0xTQlVhR2x6SUhCc1lYbGxjaWR6SUc1aGJXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWMyTnZjbVZkSUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ6WTI5eVpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwSnZiMnhsWVc1OUlGdGpiMjVtYVdjdWFHRnpWSFZ5YmwwZ0xTQlVhR2x6SUhCc1lYbGxjaUJvWVhNZ1lTQjBkWEp1TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0h0amIyeHZjaXdnYm1GdFpTd2djMk52Y21Vc0lHaGhjMVIxY201OUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvS1R0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCamIyeHZjbFpoYkhWbElEMGdkbUZzYVdSaGRHVXVZMjlzYjNJb1kyOXNiM0lnZkh3Z2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1EwOU1UMUpmUVZSVVVrbENWVlJGS1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hqYjJ4dmNsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlqYjJ4dmNpNXpaWFFvZEdocGN5d2dZMjlzYjNKV1lXeDFaUzUyWVd4MVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUhSb2FYTXVZMjlzYjNJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loY0lrRWdVR3hoZVdWeUlHNWxaV1J6SUdFZ1kyOXNiM0lzSUhkb2FXTm9JR2x6SUdFZ1UzUnlhVzVuTGx3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzVoYldWV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG5OMGNtbHVaeWh1WVcxbElIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRTVCVFVWZlFWUlVVa2xDVlZSRktTazdYRzRnSUNBZ0lDQWdJR2xtSUNodVlXMWxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDI1aGJXVXVjMlYwS0hSb2FYTXNJRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVGtGTlJWOUJWRlJTU1VKVlZFVXNJSFJvYVhNdWJtRnRaU2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlLRndpUVNCUWJHRjVaWElnYm1WbFpITWdZU0J1WVcxbExDQjNhR2xqYUNCcGN5QmhJRk4wY21sdVp5NWNJaWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCelkyOXlaVlpoYkhWbElEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaHpZMjl5WlNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVcEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0hOamIzSmxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNOamIzSmxMbk5sZENoMGFHbHpMQ0J6WTI5eVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVjMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QydGhlUzRnUVNCd2JHRjVaWElnWkc5bGN5QnViM1FnYm1WbFpDQjBieUJvWVhabElHRWdjMk52Y21VdVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYzJOdmNtVXVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGhjMVIxY201V1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1KdmIyeGxZVzRvYUdGelZIVnliaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1selZISjFaU2dwTzF4dUlDQWdJQ0FnSUNCcFppQW9hR0Z6VkhWeWJsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlvWVhOVWRYSnVMbk5sZENoMGFHbHpMQ0JvWVhOVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTd2dhR0Z6VkhWeWJpazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBhMkY1TENCQklIQnNZWGxsY2lCa2IyVnpJRzV2ZENCaGJIZGhlWE1nYUdGMlpTQmhJSFIxY200dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnYm5Wc2JDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1JoZEdsaklHZGxkQ0J2WW5ObGNuWmxaRUYwZEhKcFluVjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYlhHNGdJQ0FnSUNBZ0lDQWdJQ0JEVDB4UFVsOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCT1FVMUZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGTkRUMUpGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSVnh1SUNBZ0lDQWdJQ0JkTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdocGN5QndiR0Y1WlhJbmN5QnVZVzFsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMU4wY21sdVozMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdibUZ0WlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXVZVzFsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJSEJzWVhsbGNpZHpJSE5qYjNKbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYzJOdmNtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lEMDlQU0JmYzJOdmNtVXVaMlYwS0hSb2FYTXBJRDhnTUNBNklGOXpZMjl5WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCelkyOXlaU2h1WlhkVFkyOXlaU2tnZTF4dUlDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1bGQxTmpiM0psS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDFOamIzSmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGTENCdVpYZFRZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRkR0Z5ZENCaElIUjFjbTRnWm05eUlIUm9hWE1nY0d4aGVXVnlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdWRzl3VUd4aGVXVnlmU0JVYUdVZ2NHeGhlV1Z5SUhkcGRHZ2dZU0IwZFhKdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnYzNSaGNuUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NXBjME52Ym01bFkzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1d1lYSmxiblJPYjJSbExtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFTjFjM1J2YlVWMlpXNTBLRndpZEc5d09uTjBZWEowTFhSMWNtNWNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhJNklIUm9hWE5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gyaGhjMVIxY200dWMyVjBLSFJvYVhNc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkZibVFnWVNCMGRYSnVJR1p2Y2lCMGFHbHpJSEJzWVhsbGNpNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbGJtUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2diblZzYkNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QjBhR2x6SUhCc1lYbGxjaUJvWVhabElHRWdkSFZ5Ymo5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWVhOVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpTQTlQVDBnWDJoaGMxUjFjbTR1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVFZ1UzUnlhVzVuSUhKbGNISmxjMlZ1ZEdGMGFXOXVJRzltSUhSb2FYTWdjR3hoZVdWeUxDQm9hWE1nYjNJZ2FHVnljeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdjR3hoZVdWeUozTWdibUZ0WlNCeVpYQnlaWE5sYm5SeklIUm9aU0J3YkdGNVpYSWdZWE1nWVNCemRISnBibWN1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJnSkh0MGFHbHpMbTVoYldWOVlEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkpjeUIwYUdseklIQnNZWGxsY2lCbGNYVmhiQ0JoYm05MGFHVnlJSEJzWVhsbGNqOWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRkJzWVhsbGNuMGdiM1JvWlhJZ0xTQlVhR1VnYjNSb1pYSWdjR3hoZVdWeUlIUnZJR052YlhCaGNtVWdkR2hwY3lCd2JHRjVaWElnZDJsMGFDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdENiMjlzWldGdWZTQlVjblZsSUhkb1pXNGdaV2wwYUdWeUlIUm9aU0J2WW1wbFkzUWdjbVZtWlhKbGJtTmxjeUJoY21VZ2RHaGxJSE5oYldWY2JpQWdJQ0FnS2lCdmNpQjNhR1Z1SUdKdmRHZ2dibUZ0WlNCaGJtUWdZMjlzYjNJZ1lYSmxJSFJvWlNCellXMWxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHVnhkV0ZzY3lodmRHaGxjaWtnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J1WVcxbElEMGdYQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUc5MGFHVnlJRDhnYjNSb1pYSWdPaUJ2ZEdobGNpNXVZVzFsTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYjNSb1pYSWdQVDA5SUhSb2FYTWdmSHdnYm1GdFpTQTlQVDBnZEdocGN5NXVZVzFsTzF4dUlDQWdJSDFjYm4wN1hHNWNibmRwYm1SdmR5NWpkWE4wYjIxRmJHVnRaVzUwY3k1a1pXWnBibVVvVkVGSFgwNUJUVVVzSUZSdmNGQnNZWGxsY2lrN1hHNWNiaThxS2x4dUlDb2dWR2hsSUdSbFptRjFiSFFnYzNsemRHVnRJSEJzWVhsbGNpNGdSR2xqWlNCaGNtVWdkR2h5YjNkdUlHSjVJR0VnY0d4aGVXVnlMaUJHYjNJZ2MybDBkV0YwYVc5dWMxeHVJQ29nZDJobGNtVWdlVzkxSUhkaGJuUWdkRzhnY21WdVpHVnlJR0VnWW5WdVkyZ2diMllnWkdsalpTQjNhWFJvYjNWMElHNWxaV1JwYm1jZ2RHaGxJR052Ym1ObGNIUWdiMllnVUd4aGVXVnljMXh1SUNvZ2RHaHBjeUJFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJZ1kyRnVJR0psSUdFZ2MzVmljM1JwZEhWMFpTNGdUMllnWTI5MWNuTmxMQ0JwWmlCNWIzVW5aQ0JzYVd0bElIUnZYRzRnS2lCamFHRnVaMlVnZEdobElHNWhiV1VnWVc1a0wyOXlJSFJvWlNCamIyeHZjaXdnWTNKbFlYUmxJR0Z1WkNCMWMyVWdlVzkxY2lCdmQyNGdYQ0p6ZVhOMFpXMGdjR3hoZVdWeVhDSXVYRzRnS2lCQVkyOXVjM1JjYmlBcUwxeHVZMjl1YzNRZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNJRDBnYm1WM0lGUnZjRkJzWVhsbGNpaDdZMjlzYjNJNklGd2ljbVZrWENJc0lHNWhiV1U2SUZ3aUtsd2lmU2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5TEZ4dUlDQWdJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWl4Y2JpQWdJQ0JVUVVkZlRrRk5SU3hjYmlBZ0lDQklRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklzSUZSQlIxOU9RVTFGSUdGeklGUlBVRjlRVEVGWlJWSjlJR1p5YjIwZ1hDSXVMMVJ2Y0ZCc1lYbGxjaTVxYzF3aU8xeHVYRzVqYjI1emRDQlVRVWRmVGtGTlJTQTlJRndpZEc5d0xYQnNZWGxsY2kxc2FYTjBYQ0k3WEc1Y2JpOHFLbHh1SUNvZ1ZHOXdVR3hoZVdWeVRHbHpkQ0IwYnlCa1pYTmpjbWxpWlNCMGFHVWdjR3hoZVdWeWN5QnBiaUIwYUdVZ1oyRnRaUzVjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb3ZYRzVqYjI1emRDQlViM0JRYkdGNVpYSk1hWE4wSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZENCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1VHeGhlV1Z5VEdsemRDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQajBnZEdocGN5NXdiR0Y1WlhKekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzl3T25OMFlYSjBMWFIxY201Y0lpd2dLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJQYm14NUlHOXVaU0J3YkdGNVpYSWdZMkZ1SUdoaGRtVWdZU0IwZFhKdUlHRjBJR0Z1ZVNCbmFYWmxiaUIwYVcxbExseHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXdiR0Y1WlhKelhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xtWnBiSFJsY2lod0lEMCtJQ0Z3TG1WeGRXRnNjeWhsZG1WdWRDNWtaWFJoYVd3dWNHeGhlV1Z5S1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdVptOXlSV0ZqYUNod0lEMCtJSEF1Wlc1a1ZIVnliaWdwS1R0Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY25NZ2FXNGdkR2hwY3lCc2FYTjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxUnZjRkJzWVhsbGNsdGRmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YkdGNVpYSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnV3k0dUxuUm9hWE11WjJWMFJXeGxiV1Z1ZEhOQ2VWUmhaMDVoYldVb1ZFOVFYMUJNUVZsRlVpbGRPMXh1SUNBZ0lIMWNibjA3WEc1Y2JuZHBibVJ2ZHk1amRYTjBiMjFGYkdWdFpXNTBjeTVrWldacGJtVW9WRUZIWDA1QlRVVXNJRlJ2Y0ZCc1lYbGxja3hwYzNRcE8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGUnZjRkJzWVhsbGNreHBjM1FzWEc0Z0lDQWdWRUZIWDA1QlRVVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVMeTlwYlhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwZHlhV1JNWVhsdmRYUjlJR1p5YjIwZ1hDSXVMMGR5YVdSTVlYbHZkWFF1YW5OY0lqdGNibWx0Y0c5eWRDQjdWRzl3UkdsbExDQlVRVWRmVGtGTlJTQmhjeUJVVDFCZlJFbEZmU0JtY205dElGd2lMaTlVYjNCRWFXVXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNMQ0JVYjNCUWJHRjVaWElzSUZSQlIxOU9RVTFGSUdGeklGUlBVRjlRVEVGWlJWSXNJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSWDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5TG1welhDSTdYRzVwYlhCdmNuUWdlMVJCUjE5T1FVMUZJR0Z6SUZSUFVGOVFURUZaUlZKZlRFbFRWSDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5VEdsemRDNXFjMXdpTzF4dWFXMXdiM0owSUh0MllXeHBaR0YwWlgwZ1puSnZiU0JjSWk0dmRtRnNhV1JoZEdVdmRtRnNhV1JoZEdVdWFuTmNJanRjYmx4dVkyOXVjM1FnVkVGSFgwNUJUVVVnUFNCY0luUnZjQzFrYVdObExXSnZZWEprWENJN1hHNWNibU52Ym5OMElFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVZ1BTQXhNREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwaFBURVJmUkZWU1FWUkpUMDRnUFNBek56VTdJQzh2SUcxelhHNWpiMjV6ZENCRVJVWkJWVXhVWDBSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUWdQU0JtWVd4elpUdGNibU52Ym5OMElFUkZSa0ZWVEZSZlNFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYmx4dVkyOXVjM1FnVWs5WFV5QTlJREV3TzF4dVkyOXVjM1FnUTA5TVV5QTlJREV3TzF4dVhHNWpiMjV6ZENCRVJVWkJWVXhVWDFkSlJGUklJRDBnUTA5TVV5QXFJRVJGUmtGVlRGUmZSRWxGWDFOSldrVTdJQzh2SUhCNFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBoRlNVZElWQ0E5SUZKUFYxTWdLaUJFUlVaQlZVeFVYMFJKUlY5VFNWcEZPeUF2THlCd2VGeHVZMjl1YzNRZ1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0lEMGdUV0YwYUM1bWJHOXZjaWhTVDFkVElDOGdNaWs3WEc1Y2JtTnZibk4wSUUxSlRsOUVSVXhVUVNBOUlETTdJQzh2Y0hoY2JseHVZMjl1YzNRZ1YwbEVWRWhmUVZSVVVrbENWVlJGSUQwZ1hDSjNhV1IwYUZ3aU8xeHVZMjl1YzNRZ1NFVkpSMGhVWDBGVVZGSkpRbFZVUlNBOUlGd2lhR1ZwWjJoMFhDSTdYRzVqYjI1emRDQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSU0E5SUZ3aVpHbHpjR1Z5YzJsdmJsd2lPMXh1WTI5dWMzUWdSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZJRDBnWENKa2FXVXRjMmw2WlZ3aU8xeHVZMjl1YzNRZ1JGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0ltUnlZV2RuYVc1bkxXUnBZMlV0WkdsellXSnNaV1JjSWp0Y2JtTnZibk4wSUVoUFRFUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW1odmJHUnBibWN0WkdsalpTMWthWE5oWW14bFpGd2lPMXh1WTI5dWMzUWdVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbkp2ZEdGMGFXNW5MV1JwWTJVdFpHbHpZV0pzWldSY0lqdGNibU52Ym5OMElFaFBURVJmUkZWU1FWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSm9iMnhrTFdSMWNtRjBhVzl1WENJN1hHNWNibU52Ym5OMElIQmhjbk5sVG5WdFltVnlJRDBnS0c1MWJXSmxjbE4wY21sdVp5d2daR1ZtWVhWc2RFNTFiV0psY2lBOUlEQXBJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQnVkVzFpWlhJZ1BTQndZWEp6WlVsdWRDaHVkVzFpWlhKVGRISnBibWNzSURFd0tUdGNiaUFnSUNCeVpYUjFjbTRnVG5WdFltVnlMbWx6VG1GT0tHNTFiV0psY2lrZ1B5QmtaV1poZFd4MFRuVnRZbVZ5SURvZ2JuVnRZbVZ5TzF4dWZUdGNibHh1WTI5dWMzUWdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSWdQU0FvYm5WdFltVnlVM1J5YVc1bkxDQmtaV1poZFd4MFZtRnNkV1VwSUQwK0lIdGNiaUFnSUNCeVpYUjFjbTRnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWh1ZFcxaVpYSlRkSEpwYm1jcFhHNGdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1pHVm1ZWFZzZEZaaGJIVmxLVnh1SUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzU5TzF4dVhHNWpiMjV6ZENCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNBOUlDaGxiR1Z0Wlc1MExDQnVZVzFsTENCa1pXWmhkV3gwVm1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0JwWmlBb1pXeGxiV1Z1ZEM1b1lYTkJkSFJ5YVdKMWRHVW9ibUZ0WlNrcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2RtRnNkV1ZUZEhKcGJtY2dQU0JsYkdWdFpXNTBMbWRsZEVGMGRISnBZblYwWlNodVlXMWxLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlLSFpoYkhWbFUzUnlhVzVuTENCa1pXWmhkV3gwVm1Gc2RXVXBPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnWkdWbVlYVnNkRlpoYkhWbE8xeHVmVHRjYmx4dVkyOXVjM1FnWjJWMFFtOXZiR1ZoYmlBOUlDaGliMjlzWldGdVUzUnlhVzVuTENCMGNuVmxWbUZzZFdVc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaDBjblZsVm1Gc2RXVWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY2dmSHdnWENKMGNuVmxYQ0lnUFQwOUlHSnZiMnhsWVc1VGRISnBibWNwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaGNJbVpoYkhObFhDSWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNGdJQ0FnZlZ4dWZUdGNibHh1WTI5dWMzUWdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU0E5SUNobGJHVnRaVzUwTENCdVlXMWxMQ0JrWldaaGRXeDBWbUZzZFdVcElEMCtJSHRjYmlBZ0lDQnBaaUFvWld4bGJXVnVkQzVvWVhOQmRIUnlhV0oxZEdVb2JtRnRaU2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2RXVlRkSEpwYm1jZ1BTQmxiR1Z0Wlc1MExtZGxkRUYwZEhKcFluVjBaU2h1WVcxbEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRUp2YjJ4bFlXNG9kbUZzZFdWVGRISnBibWNzSUZ0MllXeDFaVk4wY21sdVp5d2dYQ0owY25WbFhDSmRMQ0JiWENKbVlXeHpaVndpWFN3Z1pHVm1ZWFZzZEZaaGJIVmxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWFIxY200Z1pHVm1ZWFZzZEZaaGJIVmxPMXh1ZlR0Y2JseHVMeThnVUhKcGRtRjBaU0J3Y205d1pYSjBhV1Z6WEc1amIyNXpkQ0JmWTJGdWRtRnpJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXNZWGx2ZFhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOMWNuSmxiblJRYkdGNVpYSWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVZMjl1YzNRZ1kyOXVkR1Y0ZENBOUlDaGliMkZ5WkNrZ1BUNGdYMk5oYm5aaGN5NW5aWFFvWW05aGNtUXBMbWRsZEVOdmJuUmxlSFFvWENJeVpGd2lLVHRjYmx4dVkyOXVjM1FnWjJWMFVtVmhaSGxFYVdObElEMGdLR0p2WVhKa0tTQTlQaUI3WEc0Z0lDQWdhV1lnS0hWdVpHVm1hVzVsWkNBOVBUMGdYMjUxYldKbGNrOW1VbVZoWkhsRWFXTmxMbWRsZENoaWIyRnlaQ2twSUh0Y2JpQWdJQ0FnSUNBZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObExuTmxkQ2hpYjJGeVpDd2dNQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlGOXVkVzFpWlhKUFpsSmxZV1I1UkdsalpTNW5aWFFvWW05aGNtUXBPMXh1ZlR0Y2JseHVZMjl1YzNRZ2RYQmtZWFJsVW1WaFpIbEVhV05sSUQwZ0tHSnZZWEprTENCMWNHUmhkR1VwSUQwK0lIdGNiaUFnSUNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdWMyVjBLR0p2WVhKa0xDQm5aWFJTWldGa2VVUnBZMlVvWW05aGNtUXBJQ3NnZFhCa1lYUmxLVHRjYm4wN1hHNWNibU52Ym5OMElHbHpVbVZoWkhrZ1BTQW9ZbTloY21RcElEMCtJR2RsZEZKbFlXUjVSR2xqWlNoaWIyRnlaQ2tnUFQwOUlHSnZZWEprTG1ScFkyVXViR1Z1WjNSb08xeHVYRzVqYjI1emRDQjFjR1JoZEdWQ2IyRnlaQ0E5SUNoaWIyRnlaQ3dnWkdsalpTQTlJR0p2WVhKa0xtUnBZMlVwSUQwK0lIdGNiaUFnSUNCcFppQW9hWE5TWldGa2VTaGliMkZ5WkNrcElIdGNiaUFnSUNBZ0lDQWdZMjl1ZEdWNGRDaGliMkZ5WkNrdVkyeGxZWEpTWldOMEtEQXNJREFzSUdKdllYSmtMbmRwWkhSb0xDQmliMkZ5WkM1b1pXbG5hSFFwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdaR2xsSUc5bUlHUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlM1eVpXNWtaWElvWTI5dWRHVjRkQ2hpYjJGeVpDa3NJR0p2WVhKa0xtUnBaVk5wZW1VcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVmVHRjYmx4dVkyOXVjM1FnWVdSa1JHbGxJRDBnS0dKdllYSmtLU0E5UGlCN1hHNGdJQ0FnZFhCa1lYUmxVbVZoWkhsRWFXTmxLR0p2WVhKa0xDQXhLVHRjYmlBZ0lDQnBaaUFvYVhOU1pXRmtlU2hpYjJGeVpDa3BJSHRjYmlBZ0lDQWdJQ0FnZFhCa1lYUmxRbTloY21Rb1ltOWhjbVFzSUdKdllYSmtMbXhoZVc5MWRDNXNZWGx2ZFhRb1ltOWhjbVF1WkdsalpTa3BPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtTnZibk4wSUhKbGJXOTJaVVJwWlNBOUlDaGliMkZ5WkNrZ1BUNGdlMXh1SUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0xDQmliMkZ5WkM1c1lYbHZkWFF1YkdGNWIzVjBLR0p2WVhKa0xtUnBZMlVwS1R0Y2JpQWdJQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVW9ZbTloY21Rc0lDMHhLVHRjYm4wN1hHNWNibHh1THk4Z1NXNTBaWEpoWTNScGIyNGdjM1JoZEdWelhHNWpiMjV6ZENCT1QwNUZJRDBnVTNsdFltOXNLRndpYm05ZmFXNTBaWEpoWTNScGIyNWNJaWs3WEc1amIyNXpkQ0JJVDB4RUlEMGdVM2x0WW05c0tGd2lhRzlzWkZ3aUtUdGNibU52Ym5OMElFMVBWa1VnUFNCVGVXMWliMndvWENKdGIzWmxYQ0lwTzF4dVkyOXVjM1FnU1U1RVJWUkZVazFKVGtWRUlEMGdVM2x0WW05c0tGd2lhVzVrWlhSbGNtMXBibVZrWENJcE8xeHVZMjl1YzNRZ1JGSkJSMGRKVGtjZ1BTQlRlVzFpYjJ3b1hDSmtjbUZuWjJsdVoxd2lLVHRjYmx4dUx5OGdUV1YwYUc5a2N5QjBieUJvWVc1a2JHVWdhVzUwWlhKaFkzUnBiMjVjYm1OdmJuTjBJR052Ym5abGNuUlhhVzVrYjNkRGIyOXlaR2x1WVhSbGMxUnZRMkZ1ZG1GeklEMGdLR05oYm5aaGN5d2dlRmRwYm1SdmR5d2dlVmRwYm1SdmR5a2dQVDRnZTF4dUlDQWdJR052Ym5OMElHTmhiblpoYzBKdmVDQTlJR05oYm5aaGN5NW5aWFJDYjNWdVpHbHVaME5zYVdWdWRGSmxZM1FvS1R0Y2JseHVJQ0FnSUdOdmJuTjBJSGdnUFNCNFYybHVaRzkzSUMwZ1kyRnVkbUZ6UW05NExteGxablFnS2lBb1kyRnVkbUZ6TG5kcFpIUm9JQzhnWTJGdWRtRnpRbTk0TG5kcFpIUm9LVHRjYmlBZ0lDQmpiMjV6ZENCNUlEMGdlVmRwYm1SdmR5QXRJR05oYm5aaGMwSnZlQzUwYjNBZ0tpQW9ZMkZ1ZG1GekxtaGxhV2RvZENBdklHTmhiblpoYzBKdmVDNW9aV2xuYUhRcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUh0NExDQjVmVHRjYm4wN1hHNWNibU52Ym5OMElITmxkSFZ3U1c1MFpYSmhZM1JwYjI0Z1BTQW9ZbTloY21RcElEMCtJSHRjYmlBZ0lDQmpiMjV6ZENCallXNTJZWE1nUFNCZlkyRnVkbUZ6TG1kbGRDaGliMkZ5WkNrN1hHNWNiaUFnSUNBdkx5QlRaWFIxY0NCcGJuUmxjbUZqZEdsdmJseHVJQ0FnSUd4bGRDQnZjbWxuYVc0Z1BTQjdmVHRjYmlBZ0lDQnNaWFFnYzNSaGRHVWdQU0JPVDA1Rk8xeHVJQ0FnSUd4bGRDQnpkR0YwYVdOQ2IyRnlaQ0E5SUc1MWJHdzdYRzRnSUNBZ2JHVjBJR1JwWlZWdVpHVnlRM1Z5YzI5eUlEMGdiblZzYkR0Y2JpQWdJQ0JzWlhRZ2FHOXNaRlJwYldWdmRYUWdQU0J1ZFd4c08xeHVYRzRnSUNBZ1kyOXVjM1FnYUc5c1pFUnBaU0E5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFaFBURVFnUFQwOUlITjBZWFJsSUh4OElFbE9SRVZVUlZKTlNVNUZSQ0E5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUhSdloyZHNaU0JvYjJ4a0lDOGdjbVZzWldGelpWeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjR3hoZVdWeVYybDBhRUZVZFhKdUlEMGdZbTloY21RdWNYVmxjbmxUWld4bFkzUnZjaWhnSkh0VVQxQmZVRXhCV1VWU1gweEpVMVI5SUNSN1ZFOVFYMUJNUVZsRlVuMWJKSHRJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVY5WFdBcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUnBaVlZ1WkdWeVEzVnljMjl5TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxWVzVrWlhKRGRYSnpiM0l1Y21Wc1pXRnpaVWwwS0hCc1lYbGxjbGRwZEdoQlZIVnliaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBaVlZ1WkdWeVEzVnljMjl5TG1odmJHUkpkQ2h3YkdGNVpYSlhhWFJvUVZSMWNtNHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGRHVWdQU0JPVDA1Rk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaGliMkZ5WkNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JvYjJ4a1ZHbHRaVzkxZENBOUlHNTFiR3c3WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElITjBZWEowU0c5c1pHbHVaeUE5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnYUc5c1pGUnBiV1Z2ZFhRZ1BTQjNhVzVrYjNjdWMyVjBWR2x0Wlc5MWRDaG9iMnhrUkdsbExDQmliMkZ5WkM1b2IyeGtSSFZ5WVhScGIyNHBPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHOXdTRzlzWkdsdVp5QTlJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdkMmx1Wkc5M0xtTnNaV0Z5VkdsdFpXOTFkQ2hvYjJ4a1ZHbHRaVzkxZENrN1hHNGdJQ0FnSUNBZ0lHaHZiR1JVYVcxbGIzVjBJRDBnYm5Wc2JEdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyOXVjM1FnYzNSaGNuUkpiblJsY21GamRHbHZiaUE5SUNobGRtVnVkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvVGs5T1JTQTlQVDBnYzNSaGRHVXBJSHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdiM0pwWjJsdUlEMGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSGc2SUdWMlpXNTBMbU5zYVdWdWRGZ3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlVG9nWlhabGJuUXVZMnhwWlc1MFdWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0JpYjJGeVpDNXNZWGx2ZFhRdVoyVjBRWFFvWTI5dWRtVnlkRmRwYm1SdmQwTnZiM0prYVc1aGRHVnpWRzlEWVc1MllYTW9ZMkZ1ZG1GekxDQmxkbVZ1ZEM1amJHbGxiblJZTENCbGRtVnVkQzVqYkdsbGJuUlpLU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodWRXeHNJQ0U5UFNCa2FXVlZibVJsY2tOMWNuTnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFOXViSGtnYVc1MFpYSmhZM1JwYjI0Z2QybDBhQ0IwYUdVZ1ltOWhjbVFnZG1saElHRWdaR2xsWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVodmJHUnBibWRFYVdObElDWW1JQ0ZpYjJGeVpDNWthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0YwWlNBOUlFbE9SRVZVUlZKTlNVNUZSRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MzUmhjblJJYjJ4a2FXNW5LQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNnaFltOWhjbVF1WkdsellXSnNaV1JJYjJ4a2FXNW5SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRWhQVEVRN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhKMFNHOXNaR2x1WnlncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWFJsSUQwZ1RVOVdSVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnphRzkzU1c1MFpYSmhZM1JwYjI0Z1BTQW9aWFpsYm5RcElEMCtJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQmliMkZ5WkM1c1lYbHZkWFF1WjJWMFFYUW9ZMjl1ZG1WeWRGZHBibVJ2ZDBOdmIzSmthVzVoZEdWelZHOURZVzUyWVhNb1kyRnVkbUZ6TENCbGRtVnVkQzVqYkdsbGJuUllMQ0JsZG1WdWRDNWpiR2xsYm5SWktTazdYRzRnSUNBZ0lDQWdJR2xtSUNoRVVrRkhSMGxPUnlBOVBUMGdjM1JoZEdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6ZEhsc1pTNWpkWEp6YjNJZ1BTQmNJbWR5WVdKaWFXNW5YQ0k3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb2JuVnNiQ0FoUFQwZ1pHbGxWVzVrWlhKRGRYSnpiM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oYm5aaGN5NXpkSGxzWlM1amRYSnpiM0lnUFNCY0ltZHlZV0pjSWp0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oYm5aaGN5NXpkSGxzWlM1amRYSnpiM0lnUFNCY0ltUmxabUYxYkhSY0lqdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpiMjV6ZENCdGIzWmxJRDBnS0dWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hOVDFaRklEMDlQU0J6ZEdGMFpTQjhmQ0JKVGtSRlZFVlNUVWxPUlVRZ1BUMDlJSE4wWVhSbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmtaWFJsY20xcGJtVWdhV1lnWVNCa2FXVWdhWE1nZFc1a1pYSWdkR2hsSUdOMWNuTnZjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdTV2R1YjNKbElITnRZV3hzSUcxdmRtVnRaVzUwYzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIZ2dQU0JOWVhSb0xtRmljeWh2Y21sbmFXNHVlQ0F0SUdWMlpXNTBMbU5zYVdWdWRGZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhrZ1BTQk5ZWFJvTG1GaWN5aHZjbWxuYVc0dWVTQXRJR1YyWlc1MExtTnNhV1Z1ZEZrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9UVWxPWDBSRlRGUkJJRHdnWkhnZ2ZId2dUVWxPWDBSRlRGUkJJRHdnWkhrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0YwWlNBOUlFUlNRVWRIU1U1SE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBiM0JJYjJ4a2FXNW5LQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVdObFYybDBhRzkxZEVScFpWVnVaR1Z5UTNWeWMyOXlJRDBnWW05aGNtUXVaR2xqWlM1bWFXeDBaWElvWkdsbElEMCtJR1JwWlNBaFBUMGdaR2xsVlc1a1pYSkRkWEp6YjNJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0xDQmthV05sVjJsMGFHOTFkRVJwWlZWdVpHVnlRM1Z5YzI5eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0YwYVdOQ2IyRnlaQ0E5SUdOdmJuUmxlSFFvWW05aGNtUXBMbWRsZEVsdFlXZGxSR0YwWVNnd0xDQXdMQ0JqWVc1MllYTXVkMmxrZEdnc0lHTmhiblpoY3k1b1pXbG5hSFFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0VSU1FVZEhTVTVISUQwOVBTQnpkR0YwWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaSGdnUFNCdmNtbG5hVzR1ZUNBdElHVjJaVzUwTG1Oc2FXVnVkRmc3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VTQTlJRzl5YVdkcGJpNTVJQzBnWlhabGJuUXVZMnhwWlc1MFdUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZTNnc0lIbDlJRDBnWkdsbFZXNWtaWEpEZFhKemIzSXVZMjl2Y21ScGJtRjBaWE03WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUW9ZbTloY21RcExuQjFkRWx0WVdkbFJHRjBZU2h6ZEdGMGFXTkNiMkZ5WkN3Z01Dd2dNQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2k1eVpXNWtaWElvWTI5dWRHVjRkQ2hpYjJGeVpDa3NJR0p2WVhKa0xtUnBaVk5wZW1Vc0lIdDRPaUI0SUMwZ1pIZ3NJSGs2SUhrZ0xTQmtlWDBwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE4wYjNCSmJuUmxjbUZqZEdsdmJpQTlJQ2hsZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBaFBUMGdaR2xsVlc1a1pYSkRkWEp6YjNJZ0ppWWdSRkpCUjBkSlRrY2dQVDA5SUhOMFlYUmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VDQTlJRzl5YVdkcGJpNTRJQzBnWlhabGJuUXVZMnhwWlc1MFdEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1I1SUQwZ2IzSnBaMmx1TG5rZ0xTQmxkbVZ1ZEM1amJHbGxiblJaTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjdlQ3dnZVgwZ1BTQmthV1ZWYm1SbGNrTjFjbk52Y2k1amIyOXlaR2x1WVhSbGN6dGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYzI1aGNGUnZRMjl2Y21SeklEMGdZbTloY21RdWJHRjViM1YwTG5OdVlYQlVieWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdsbE9pQmthV1ZWYm1SbGNrTjFjbk52Y2l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCNE9pQjRJQzBnWkhnc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2VUb2dlU0F0SUdSNUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJRzVsZDBOdmIzSmtjeUE5SUc1MWJHd2dJVDBnYzI1aGNGUnZRMjl2Y21SeklEOGdjMjVoY0ZSdlEyOXZjbVJ6SURvZ2UzZ3NJSGw5TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVmJtUmxja04xY25OdmNpNWpiMjl5WkdsdVlYUmxjeUE5SUc1bGQwTnZiM0prY3p0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQzh2SUVOc1pXRnlJSE4wWVhSbFhHNGdJQ0FnSUNBZ0lHUnBaVlZ1WkdWeVEzVnljMjl5SUQwZ2JuVnNiRHRjYmlBZ0lDQWdJQ0FnYzNSaGRHVWdQU0JPVDA1Rk8xeHVYRzRnSUNBZ0lDQWdJQzh2SUZKbFpuSmxjMmdnWW05aGNtUTdJRkpsYm1SbGNpQmthV05sWEc0Z0lDQWdJQ0FnSUhWd1pHRjBaVUp2WVhKa0tHSnZZWEprS1R0Y2JpQWdJQ0I5TzF4dVhHNWNiaUFnSUNBdkx5QlNaV2RwYzNSbGNpQjBhR1VnWVdOMGRXRnNJR1YyWlc1MElHeHBjM1JsYm1WeWN5QmtaV1pwYm1Wa0lHRmliM1psTGlCTllYQWdkRzkxWTJnZ1pYWmxiblJ6SUhSdlhHNGdJQ0FnTHk4Z1pYRjFhWFpoYkdWdWRDQnRiM1Z6WlNCbGRtVnVkSE11SUVKbFkyRjFjMlVnZEdobElGd2lkRzkxWTJobGJtUmNJaUJsZG1WdWRDQmtiMlZ6SUc1dmRDQm9ZWFpsSUdGY2JpQWdJQ0F2THlCamJHbGxiblJZSUdGdVpDQmpiR2xsYm5SWkxDQnlaV052Y21RZ1lXNWtJSFZ6WlNCMGFHVWdiR0Z6ZENCdmJtVnpJR1p5YjIwZ2RHaGxJRndpZEc5MVkyaHRiM1psWENKY2JpQWdJQ0F2THlBb2IzSWdYQ0owYjNWamFITjBZWEowWENJcElHVjJaVzUwY3k1Y2JseHVJQ0FnSUd4bGRDQjBiM1ZqYUVOdmIzSmthVzVoZEdWeklEMGdlMk5zYVdWdWRGZzZJREFzSUdOc2FXVnVkRms2SURCOU8xeHVJQ0FnSUdOdmJuTjBJSFJ2ZFdOb01tMXZkWE5sUlhabGJuUWdQU0FvYlc5MWMyVkZkbVZ1ZEU1aGJXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNoMGIzVmphRVYyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEc5MVkyaEZkbVZ1ZENBbUppQXdJRHdnZEc5MVkyaEZkbVZ1ZEM1MGIzVmphR1Z6TG14bGJtZDBhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSHRqYkdsbGJuUllMQ0JqYkdsbGJuUlpmU0E5SUhSdmRXTm9SWFpsYm5RdWRHOTFZMmhsYzFzd1hUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBiM1ZqYUVOdmIzSmthVzVoZEdWeklEMGdlMk5zYVdWdWRGZ3NJR05zYVdWdWRGbDlPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRTF2ZFhObFJYWmxiblFvYlc5MWMyVkZkbVZ1ZEU1aGJXVXNJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTXBLVHRjYmlBZ0lDQWdJQ0FnZlR0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNWamFITjBZWEowWENJc0lIUnZkV05vTW0xdmRYTmxSWFpsYm5Rb1hDSnRiM1Z6WldSdmQyNWNJaWtwTzF4dUlDQWdJR05oYm5aaGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2liVzkxYzJWa2IzZHVYQ0lzSUhOMFlYSjBTVzUwWlhKaFkzUnBiMjRwTzF4dVhHNGdJQ0FnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVSeVlXZG5hVzVuUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2ZFdOb2JXOTJaVndpTENCMGIzVmphREp0YjNWelpVVjJaVzUwS0Z3aWJXOTFjMlZ0YjNabFhDSXBLVHRjYmlBZ0lDQWdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXMXZkbVZjSWl3Z2JXOTJaU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhV1lnS0NGaWIyRnlaQzVrYVhOaFlteGxaRVJ5WVdkbmFXNW5SR2xqWlNCOGZDQWhZbTloY21RdVpHbHpZV0pzWldSSWIyeGthVzVuUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJbTF2ZFhObGJXOTJaVndpTENCemFHOTNTVzUwWlhKaFkzUnBiMjRwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR05oYm5aaGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzkxWTJobGJtUmNJaXdnZEc5MVkyZ3liVzkxYzJWRmRtVnVkQ2hjSW0xdmRYTmxkWEJjSWlrcE8xeHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVjFjRndpTENCemRHOXdTVzUwWlhKaFkzUnBiMjRwTzF4dUlDQWdJR05oYm5aaGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2liVzkxYzJWdmRYUmNJaXdnYzNSdmNFbHVkR1Z5WVdOMGFXOXVLVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dWRzl3UkdsalpVSnZZWEprSUdseklHRWdZM1Z6ZEc5dElFaFVUVXdnWld4bGJXVnVkQ0IwYnlCeVpXNWtaWElnWVc1a0lHTnZiblJ5YjJ3Z1lWeHVJQ29nWkdsalpTQmliMkZ5WkM0Z1hHNGdLbHh1SUNvZ1FHVjRkR1Z1WkhNZ1NGUk5URVZzWlcxbGJuUmNiaUFxTDF4dVkyOXVjM1FnVkc5d1JHbGpaVUp2WVhKa0lEMGdZMnhoYzNNZ1pYaDBaVzVrY3lCSVZFMU1SV3hsYldWdWRDQjdYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEY21WaGRHVWdZU0J1WlhjZ1ZHOXdSR2xqWlVKdllYSmtMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWdwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk4wZVd4bExtUnBjM0JzWVhrZ1BTQmNJbWx1YkdsdVpTMWliRzlqYTF3aU8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCemFHRmtiM2NnUFNCMGFHbHpMbUYwZEdGamFGTm9ZV1J2ZHloN2JXOWtaVG9nWENKamJHOXpaV1JjSW4wcE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCallXNTJZWE1nUFNCa2IyTjFiV1Z1ZEM1amNtVmhkR1ZGYkdWdFpXNTBLRndpWTJGdWRtRnpYQ0lwTzF4dUlDQWdJQ0FnSUNCemFHRmtiM2N1WVhCd1pXNWtRMmhwYkdRb1kyRnVkbUZ6S1R0Y2JseHVJQ0FnSUNBZ0lDQmZZMkZ1ZG1GekxuTmxkQ2gwYUdsekxDQmpZVzUyWVhNcE8xeHVJQ0FnSUNBZ0lDQmZZM1Z5Y21WdWRGQnNZWGxsY2k1elpYUW9kR2hwY3l3Z1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNLVHRjYmlBZ0lDQWdJQ0FnWDJ4aGVXOTFkQzV6WlhRb2RHaHBjeXdnYm1WM0lFZHlhV1JNWVhsdmRYUW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2QybGtkR2c2SUhSb2FYTXVkMmxrZEdnc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JvWldsbmFIUTZJSFJvYVhNdWFHVnBaMmgwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsVTJsNlpUb2dkR2hwY3k1a2FXVlRhWHBsTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdaR2x6Y0dWeWMybHZiam9nZEdocGN5NWthWE53WlhKemFXOXVYRzRnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2MyVjBkWEJKYm5SbGNtRmpkR2x2YmloMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpkR0YwYVdNZ1oyVjBJRzlpYzJWeWRtVmtRWFIwY21saWRYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUZ0Y2JpQWdJQ0FnSUNBZ0lDQWdJRmRKUkZSSVgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVoRlNVZElWRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUkpSVjlUU1ZwRlgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklUMHhFU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdTRTlNUkY5RVZWSkJWRWxQVGw5QlZGUlNTVUpWVkVWY2JpQWdJQ0FnSUNBZ1hUdGNiaUFnSUNCOVhHNWNiaUFnSUNCaGRIUnlhV0oxZEdWRGFHRnVaMlZrUTJGc2JHSmhZMnNvYm1GdFpTd2diMnhrVm1Gc2RXVXNJRzVsZDFaaGJIVmxLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR05oYm5aaGN5QTlJRjlqWVc1MllYTXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lDQWdJQ0J6ZDJsMFkyZ2dLRzVoYldVcElIdGNiaUFnSUNBZ0lDQWdZMkZ6WlNCWFNVUlVTRjlCVkZSU1NVSlZWRVU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIZHBaSFJvSUQwZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2JtVjNWbUZzZFdVc0lIQmhjbk5sVG5WdFltVnlLRzlzWkZaaGJIVmxLU0I4ZkNCRVJVWkJWVXhVWDFkSlJGUklLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbmRwWkhSb0lEMGdkMmxrZEdnN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVc1MllYTXVjMlYwUVhSMGNtbGlkWFJsS0ZkSlJGUklYMEZVVkZKSlFsVlVSU3dnZDJsa2RHZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JJUlVsSFNGUmZRVlJVVWtsQ1ZWUkZPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCb1pXbG5hSFFnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmU0VWSlIwaFVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6WlhSQmRIUnlhV0oxZEdVb1NFVkpSMGhVWDBGVVZGSkpRbFZVUlN3Z2FHVnBaMmgwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ1JFbFRVRVZTVTBsUFRsOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScGMzQmxjbk5wYjI0Z1BTQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpaHVaWGRXWVd4MVpTd2djR0Z5YzJWT2RXMWlaWElvYjJ4a1ZtRnNkV1VwSUh4OElFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbXhoZVc5MWRDNWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVdWVGFYcGxJRDBnWjJWMFVHOXphWFJwZG1WT2RXMWlaWElvYm1WM1ZtRnNkV1VzSUhCaGNuTmxUblZ0WW1WeUtHOXNaRlpoYkhWbEtTQjhmQ0JFUlVaQlZVeFVYMFJKUlY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbVJwWlZOcGVtVWdQU0JrYVdWVGFYcGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JTVDFSQlZFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsellXSnNaV1JTYjNSaGRHbHZiaUE5SUhaaGJHbGtZWFJsTG1KdmIyeGxZVzRvYm1WM1ZtRnNkV1VzSUdkbGRFSnZiMnhsWVc0b2IyeGtWbUZzZFdVc0lGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDFKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXBLUzUyWVd4MVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXViR0Y1YjNWMExuSnZkR0YwWlNBOUlDRmthWE5oWW14bFpGSnZkR0YwYVc5dU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWkdWbVlYVnNkRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnVkdobElIWmhiSFZsSUdseklHUmxkR1Z5YldsdVpXUWdkMmhsYmlCMWMybHVaeUIwYUdVZ1oyVjBkR1Z5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSjBiM0F0WkdsbE9tRmtaR1ZrWENJc0lDZ3BJRDArSUdGa1pFUnBaU2gwYUdsektTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZjQzFrYVdVNmNtVnRiM1psWkZ3aUxDQW9LU0E5UGlCeVpXMXZkbVZFYVdVb2RHaHBjeWtwTzF4dVhHNGdJQ0FnSUNBZ0lDOHZJRUZrWkNCa2FXTmxJSFJvWVhRZ1lYSmxJR0ZzY21WaFpIa2dhVzRnZEdobElFUlBUVnh1SUNBZ0lDQWdJQ0IwYUdsekxtUnBZMlV1Wm05eVJXRmphQ2dvS1NBOVBpQmhaR1JFYVdVb2RHaHBjeWtwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUdGa2IzQjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdSM0pwWkV4aGVXOTFkQ0IxYzJWa0lHSjVJSFJvYVhNZ1JHbGpaVUp2WVhKa0lIUnZJR3hoZVc5MWRDQjBhR1VnWkdsalpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0SGNtbGtUR0Y1YjNWMGZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnNZWGx2ZFhRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZiR0Y1YjNWMExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGlCT2IzUmxMQ0IwYnlCaFkzUjFZV3hzZVNCMGFISnZkeUIwYUdVZ1pHbGpaU0IxYzJWY2JpQWdJQ0FnS2lCN1FHeHBibXNnZEdoeWIzZEVhV05sZlM0Z1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Vkc5d1JHbGxXMTE5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiTGk0dWRHaHBjeTVuWlhSRmJHVnRaVzUwYzBKNVZHRm5UbUZ0WlNoVVQxQmZSRWxGS1YwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRzFoZUdsdGRXMGdiblZ0WW1WeUlHOW1JR1JwWTJVZ2RHaGhkQ0JqWVc0Z1ltVWdjSFYwSUc5dUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOUlGUm9aU0J0WVhocGJYVnRJRzUxYldKbGNpQnZaaUJrYVdObExDQXdJRHdnYldGNGFXMTFiUzVjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YkdGNWIzVjBMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlU3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIZHBaSFJvSUc5bUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCM2FXUjBhQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRmRKUkZSSVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOVhTVVJVU0NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR2hsYVdkb2RDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR2hsYVdkb2RDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxLSFJvYVhNc0lFaEZTVWRJVkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlNFVkpSMGhVS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdaR2x6Y0dWeWMybHZiaUJzWlhabGJDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR1JwYzNCbGNuTnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYzJsNlpTQnZaaUJrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthV1ZUYVhwbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwUkpSVjlUU1ZwRktUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRZVzRnWkdsalpTQnZiaUIwYUdseklHSnZZWEprSUdKbElHUnlZV2RuWldRL1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBKdmIyeGxZVzU5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU2gwYUdsekxDQkVVa0ZIUjBsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5RVVrRkhSMGxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVc0Z1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0lHSmxJR2hsYkdRZ1lua2dZU0JRYkdGNVpYSS9YRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwSnZiMnhsWVc1OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSQ2IyOXNaV0Z1UVhSMGNtbGlkWFJsS0hSb2FYTXNJRWhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlNFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJKY3lCeWIzUmhkR2x1WnlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RZ1pHbHpZV0pzWldRL1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBKdmIyeGxZVzU5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMyRmliR1ZrVW05MFlYUnBibWRFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU2gwYUdsekxDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1pIVnlZWFJwYjI0Z2FXNGdiWE1nZEc4Z2NISmxjM01nZEdobElHMXZkWE5sSUM4Z2RHOTFZMmdnWVNCa2FXVWdZbVZtYjNKbElHbDBJR0psYTI5dFpYTmNiaUFnSUNBZ0tpQm9aV3hrSUdKNUlIUm9aU0JRYkdGNVpYSXVJRWwwSUdoaGN5QnZibXg1SUdGdUlHVm1abVZqZENCM2FHVnVJSFJvYVhNdWFHOXNaR0ZpYkdWRWFXTmxJRDA5UFZ4dUlDQWdJQ0FxSUhSeWRXVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb2IyeGtSSFZ5WVhScGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU2gwYUdsekxDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5SVQweEVYMFJWVWtGVVNVOU9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1ZHOXdVR3hoZVdWeVRHbHpkQ0JsYkdWdFpXNTBJRzltSUhSb2FYTWdWRzl3UkdsalpVSnZZWEprTGlCSlppQnBkQ0JrYjJWeklHNXZkQ0JsZUdsemRDeGNiaUFnSUNBZ0tpQnBkQ0IzYVd4c0lHSmxJR055WldGMFpXUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeVRHbHpkSDFjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JmY0d4aGVXVnlUR2x6ZENncElIdGNiaUFnSUNBZ0lDQWdiR1YwSUhCc1lYbGxja3hwYzNRZ1BTQjBhR2x6TG5GMVpYSjVVMlZzWldOMGIzSW9WRTlRWDFCTVFWbEZVbDlNU1ZOVUtUdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUhCc1lYbGxja3hwYzNRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxja3hwYzNRZ1BTQjBhR2x6TG1Gd2NHVnVaRU5vYVd4a0tGUlBVRjlRVEVGWlJWSmZURWxUVkNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjR3hoZVdWeVRHbHpkRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5Y3lCd2JHRjVhVzVuSUc5dUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeVcxMTlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSEJzWVhsbGNuTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxsOXdiR0Y1WlhKTWFYTjBMbkJzWVhsbGNuTTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRWE1nY0d4aGVXVnlMQ0IwYUhKdmR5QjBhR1VnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUZ0d2JHRjVaWElnUFNCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSmRJQzBnVkdobFhHNGdJQ0FnSUNvZ2NHeGhlV1Z5SUhSb1lYUWdhWE1nZEdoeWIzZHBibWNnZEdobElHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxUnZjRVJwWlZ0ZGZTQlVhR1VnZEdoeWIzZHVJR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQzRnVkdocGN5QnNhWE4wSUc5bUlHUnBZMlVnYVhNZ2RHaGxJSE5oYldVZ1lYTWdkR2hwY3lCVWIzQkVhV05sUW05aGNtUW5jeUI3UUhObFpTQmthV05sZlNCd2NtOXdaWEowZVZ4dUlDQWdJQ0FxTDF4dUlDQWdJSFJvY205M1JHbGpaU2h3YkdGNVpYSWdQU0JFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hCc1lYbGxjaUFtSmlBaGNHeGhlV1Z5TG1oaGMxUjFjbTRwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJzWVhsbGNpNXpkR0Z5ZEZSMWNtNG9LVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCMGFHbHpMbVJwWTJVdVptOXlSV0ZqYUNoa2FXVWdQVDRnWkdsbExuUm9jbTkzU1hRb0tTazdYRzRnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0hSb2FYTXNJSFJvYVhNdWJHRjViM1YwTG14aGVXOTFkQ2gwYUdsekxtUnBZMlVwS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVaR2xqWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCQlpHUWdZU0JrYVdVZ2RHOGdkR2hwY3lCVWIzQkVhV05sUW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRVJwWlh4UFltcGxZM1I5SUZ0amIyNW1hV2NnUFNCN2ZWMGdMU0JVYUdVZ1pHbGxJRzl5SUdFZ1kyOXVabWxuZFhKaGRHbHZiaUJ2Wmx4dUlDQWdJQ0FxSUhSb1pTQmthV1VnZEc4Z1lXUmtJSFJ2SUhSb2FYTWdWRzl3UkdsalpVSnZZWEprTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmRzUxYkd4OUlGdGpiMjVtYVdjdWNHbHdjMTBnTFNCVWFHVWdjR2x3Y3lCdlppQjBhR1VnWkdsbElIUnZJR0ZrWkM1Y2JpQWdJQ0FnS2lCSlppQnVieUJ3YVhCeklHRnlaU0J6Y0dWamFXWnBaV1FnYjNJZ2RHaGxJSEJwY0hNZ1lYSmxJRzV2ZENCaVpYUjNaV1Z1SURFZ1lXNWtJRFlzSUdFZ2NtRnVaRzl0WEc0Z0lDQWdJQ29nYm5WdFltVnlJR0psZEhkbFpXNGdNU0JoYm1RZ05pQnBjeUJuWlc1bGNtRjBaV1FnYVc1emRHVmhaQzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdXMk52Ym1acFp5NWpiMnh2Y2wwZ0xTQlVhR1VnWTI5c2IzSWdiMllnZEdobElHUnBaU0IwYnlCaFpHUXVJRVJsWm1GMWJIUmNiaUFnSUNBZ0tpQjBieUIwYUdVZ1pHVm1ZWFZzZENCamIyeHZjaTVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdXMk52Ym1acFp5NTRYU0F0SUZSb1pTQjRJR052YjNKa2FXNWhkR1VnYjJZZ2RHaGxJR1JwWlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnVzJOdmJtWnBaeTU1WFNBdElGUm9aU0I1SUdOdmIzSmthVzVoZEdVZ2IyWWdkR2hsSUdScFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ1cyTnZibVpwWnk1eWIzUmhkR2x2YmwwZ0xTQlVhR1VnY205MFlYUnBiMjRnYjJZZ2RHaGxJR1JwWlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFSdmNGQnNZWGxsY24wZ1cyTnZibVpwWnk1b1pXeGtRbmxkSUMwZ1ZHaGxJSEJzWVhsbGNpQm9iMnhrYVc1bklIUm9aU0JrYVdVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQkVhV1Y5SUZSb1pTQmhaR1JsWkNCa2FXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1lXUmtSR2xsS0dOdmJtWnBaeUE5SUh0OUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1Gd2NHVnVaRU5vYVd4a0tHTnZibVpwWnlCcGJuTjBZVzVqWlc5bUlGUnZjRVJwWlNBL0lHTnZibVpwWnlBNklHNWxkeUJVYjNCRWFXVW9ZMjl1Wm1sbktTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dVbVZ0YjNabElHUnBaU0JtY205dElIUm9hWE1nVkc5d1JHbGpaVUp2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VWIzQkVhV1Y5SUdScFpTQXRJRlJvWlNCa2FXVWdkRzhnY21WdGIzWmxJR1p5YjIwZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCeVpXMXZkbVZFYVdVb1pHbGxLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaGthV1V1Y0dGeVpXNTBUbTlrWlNBbUppQmthV1V1Y0dGeVpXNTBUbTlrWlNBOVBUMGdkR2hwY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WRGFHbHNaQ2hrYVdVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRV1JrSUdFZ2NHeGhlV1Z5SUhSdklIUm9hWE1nVkc5d1JHbGpaVUp2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VWIzQlFiR0Y1WlhKOFQySnFaV04wZlNCamIyNW1hV2NnTFNCVWFHVWdjR3hoZVdWeUlHOXlJR0VnWTI5dVptbG5kWEpoZEdsdmJpQnZaaUJoWEc0Z0lDQWdJQ29nY0d4aGVXVnlJSFJ2SUdGa1pDQjBieUIwYUdseklGUnZjRVJwWTJWQ2IyRnlaQzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdZMjl1Wm1sbkxtTnZiRzl5SUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJqYjJ4dmNpQjFjMlZrSUdsdUlIUm9aU0JuWVcxbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCamIyNW1hV2N1Ym1GdFpTQXRJRlJvYVhNZ2NHeGhlV1Z5SjNNZ2JtRnRaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdXMk52Ym1acFp5NXpZMjl5WlYwZ0xTQlVhR2x6SUhCc1lYbGxjaWR6SUhOamIzSmxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRbTl2YkdWaGJuMGdXMk52Ym1acFp5NW9ZWE5VZFhKdVhTQXRJRlJvYVhNZ2NHeGhlV1Z5SUdoaGN5QmhJSFIxY200dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRHaHliM2R6SUVWeWNtOXlJSGRvWlc0Z2RHaGxJSEJzWVhsbGNpQjBieUJoWkdRZ1kyOXVabXhwWTNSeklIZHBkR2dnWVNCd2NtVXRaWGhwYzNScGJtZGNiaUFnSUNBZ0tpQndiR0Y1WlhJdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQlFiR0Y1WlhKOUlGUm9aU0JoWkdSbFpDQndiR0Y1WlhJdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWVdSa1VHeGhlV1Z5S0dOdmJtWnBaeUE5SUh0OUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5d2JHRjVaWEpNYVhOMExtRndjR1Z1WkVOb2FXeGtLR052Ym1acFp5QnBibk4wWVc1alpXOW1JRlJ2Y0ZCc1lYbGxjaUEvSUdOdmJtWnBaeUE2SUc1bGR5QlViM0JRYkdGNVpYSW9ZMjl1Wm1sbktTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dVbVZ0YjNabElIQnNZWGxsY2lCbWNtOXRJSFJvYVhNZ1ZHOXdSR2xqWlVKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZEc4Z2NtVnRiM1psSUdaeWIyMGdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLaTljYmlBZ0lDQnlaVzF2ZG1WUWJHRjVaWElvY0d4aGVXVnlLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHdiR0Y1WlhJdWNHRnlaVzUwVG05a1pTQW1KaUJ3YkdGNVpYSXVjR0Z5Wlc1MFRtOWtaU0E5UFQwZ2RHaHBjeTVmY0d4aGVXVnlUR2x6ZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWZjR3hoZVdWeVRHbHpkQzV5WlcxdmRtVkRhR2xzWkNod2JHRjVaWElwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNTlPMXh1WEc1M2FXNWtiM2N1WTNWemRHOXRSV3hsYldWdWRITXVaR1ZtYVc1bEtGUkJSMTlPUVUxRkxDQlViM0JFYVdObFFtOWhjbVFwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBZMlZDYjJGeVpDeGNiaUFnSUNCRVJVWkJWVXhVWDBSSlJWOVRTVnBGTEZ4dUlDQWdJRVJGUmtGVlRGUmZTRTlNUkY5RVZWSkJWRWxQVGl4Y2JpQWdJQ0JFUlVaQlZVeFVYMWRKUkZSSUxGeHVJQ0FnSUVSRlJrRlZURlJmU0VWSlIwaFVMRnh1SUNBZ0lFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRpeGNiaUFnSUNCRVJVWkJWVXhVWDFKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXNYRzRnSUNBZ1ZFRkhYMDVCVFVWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0N3Z01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFMMXh1YVcxd2IzSjBJSHRVYjNCRWFXTmxRbTloY21SOUlHWnliMjBnWENJdUwxUnZjRVJwWTJWQ2IyRnlaQzVxYzF3aU8xeHVhVzF3YjNKMElIdFViM0JFYVdWOUlHWnliMjBnWENJdUwxUnZjRVJwWlM1cWMxd2lPMXh1YVcxd2IzSjBJSHRVYjNCUWJHRjVaWEo5SUdaeWIyMGdYQ0l1TDFSdmNGQnNZWGxsY2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRVYjNCUWJHRjVaWEpNYVhOMGZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSk1hWE4wTG1welhDSTdYRzVjYm5kcGJtUnZkeTUwZDJWdWRIbHZibVZ3YVhCeklEMGdkMmx1Wkc5M0xuUjNaVzUwZVc5dVpYQnBjSE1nZkh3Z1QySnFaV04wTG1aeVpXVjZaU2g3WEc0Z0lDQWdWa1ZTVTBsUFRqb2dYQ0l3TGpBdU1Wd2lMRnh1SUNBZ0lFeEpRMFZPVTBVNklGd2lURWRRVEMwekxqQmNJaXhjYmlBZ0lDQlhSVUpUU1ZSRk9pQmNJbWgwZEhCek9pOHZkSGRsYm5SNWIyNWxjR2x3Y3k1dmNtZGNJaXhjYmlBZ0lDQlViM0JFYVdObFFtOWhjbVE2SUZSdmNFUnBZMlZDYjJGeVpDeGNiaUFnSUNCVWIzQkVhV1U2SUZSdmNFUnBaU3hjYmlBZ0lDQlViM0JRYkdGNVpYSTZJRlJ2Y0ZCc1lYbGxjaXhjYmlBZ0lDQlViM0JRYkdGNVpYSk1hWE4wT2lCVWIzQlFiR0Y1WlhKTWFYTjBYRzU5S1R0Y2JpSmRMQ0p1WVcxbGN5STZXeUpVUVVkZlRrRk5SU0lzSW5aaGJHbGtZWFJsSWl3aVEwOU1UMUpmUVZSVVVrbENWVlJGSWl3aVgyTnZiRzl5SWl3aVZFOVFYMUJNUVZsRlVpSXNJbFJQVUY5UVRFRlpSVkpmVEVsVFZDSXNJbFJQVUY5RVNVVWlYU3dpYldGd2NHbHVaM01pT2lKQlFVRkJPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJlVUpCTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzWTBGQll5eExRVUZMTEVOQlFVTTdPenM3T3pzN08wbEJVVE5ETEZkQlFWY3NRMEZCUXl4UFFVRlBMRVZCUVVVN1VVRkRha0lzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMHRCUTJ4Q08wTkJRMG83TzBGRGNFTkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUVzVFVGQlRTeHpRa0ZCYzBJc1IwRkJSeXhIUVVGSExFTkJRVU03TzBGQlJXNURMRTFCUVUwc1pVRkJaU3hIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTzBsQlF6TkNMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBOQlEzSkZMRU5CUVVNN096dEJRVWRHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU01UWl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6VkNMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETlVJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXk5Q0xFMUJRVTBzVjBGQlZ5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRiRU1zVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenM3T3pzN096dEJRV2RDT1VJc1RVRkJUU3hWUVVGVkxFZEJRVWNzVFVGQlRUczdPenM3T3p0SlFVOXlRaXhYUVVGWExFTkJRVU03VVVGRFVpeExRVUZMTzFGQlEwd3NUVUZCVFR0UlFVTk9MRlZCUVZVN1VVRkRWaXhQUVVGUE8wdEJRMVlzUjBGQlJ5eEZRVUZGTEVWQlFVVTdVVUZEU2l4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTndRaXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenM3VVVGRmVFSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1IwRkJSeXhWUVVGVkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhQUVVGUExFTkJRVU03VVVGRGRrSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRGJrSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03UzBGRGVFSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN1NVRkZSQ3hKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEVkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3V1VGRFVDeE5RVUZOTEVsQlFVa3NhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5dzJRMEZCTmtNc1JVRkJSU3hEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTXZSanRSUVVORUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1MwRkRhRVE3T3pzN096czdPMGxCVVVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlExWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8xbEJRMUFzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zT0VOQlFUaERMRVZCUVVVc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEYUVjN1VVRkRSQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOeVFpeEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMHRCUTJoRU96czdPenM3T3p0SlFWRkVMRWxCUVVrc2JVSkJRVzFDTEVkQlFVYzdVVUZEZEVJc1QwRkJUeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1MwRkRiRU03T3pzN096czdPenM3U1VGVlJDeEpRVUZKTEZWQlFWVXNSMEZCUnp0UlFVTmlMRTlCUVU4c1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3U1VGRlJDeEpRVUZKTEZWQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRaQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZEVUN4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl4clJFRkJhMFFzUlVGQlJTeERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOd1J6dFJRVU5FTEU5QlFVOHNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEYmtNN096czdPenM3TzBsQlVVUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROMEk3TzBsQlJVUXNTVUZCU1N4UFFVRlBMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRMW9zU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRkZPMWxCUTFRc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc0swTkJRU3RETEVWQlFVVXNSVUZCUlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGJFYzdVVUZEUkN4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzB0QlEyaEVPenRKUVVWRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUVUZCVFN4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhQUVVGUExGTkJRVk1zUzBGQlN5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOeVF6czdTVUZGUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU40UWpzN096czdPenM3U1VGUlJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXhRanM3T3pzN096czdTVUZSUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNeFFqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEUxQlFVMHNSMEZCUnl4SFFVRkhMR1ZCUVdVc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOb1JDeE5RVUZOTEVkQlFVY3NSMEZCUnl4bFFVRmxMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08xRkJSV2hFTEU5QlFVOHNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRGNrSTdPenM3T3pzN096czdPenRKUVZsRUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVTdVVUZEVkN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xbEJRM2hETEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETEhsRFFVRjVReXhGUVVGRkxFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRekZKT3p0UlFVVkVMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUXpkQ0xFMUJRVTBzV1VGQldTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZlRUlzUzBGQlN5eE5RVUZOTEVkQlFVY3NTVUZCU1N4SlFVRkpMRVZCUVVVN1dVRkRjRUlzU1VGQlNTeEhRVUZITEVOQlFVTXNZMEZCWXl4RlFVRkZMRWxCUVVrc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGT3pzN08yZENRVWwwUXl4cFFrRkJhVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1lVRkRMMElzVFVGQlRUdG5Ra0ZEU0N4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJGQlF6RkNPMU5CUTBvN08xRkJSVVFzVFVGQlRTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRVZCUVVVc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRU5CUVVNN1VVRkRPVVVzVFVGQlRTeGpRVUZqTEVkQlFVY3NTVUZCU1N4RFFVRkRMSE5DUVVGelFpeERRVUZETEVkQlFVY3NSVUZCUlN4cFFrRkJhVUlzUTBGQlF5eERRVUZET3p0UlFVVXpSU3hMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEZsQlFWa3NSVUZCUlR0WlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRkRVVzVFVGQlRTeFZRVUZWTEVkQlFVY3NZMEZCWXl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8xbEJReTlETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1YwRkJWeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZET3p0WlFVVjBReXhIUVVGSExFTkJRVU1zVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXp0WlFVTjRSQ3hIUVVGSExFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWRCUVVjc2MwSkJRWE5DTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRka1lzYVVKQlFXbENMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFOQlF5OUNPenRSUVVWRUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMR2xDUVVGcFFpeERRVUZETEVOQlFVTTdPMUZCUlc1RExFOUJRVThzYVVKQlFXbENMRU5CUVVNN1MwRkROVUk3T3pzN096czdPenM3TzBsQlYwUXNjMEpCUVhOQ0xFTkJRVU1zUjBGQlJ5eEZRVUZGTEdsQ1FVRnBRaXhGUVVGRk8xRkJRek5ETEUxQlFVMHNVMEZCVXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzVFVGQlRTeFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenM3VVVGRmJFUXNUMEZCVHl4VFFVRlRMRU5CUVVNc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeExRVUZMTEVkQlFVY3NVVUZCVVN4RlFVRkZPMWxCUXpkRExFdEJRVXNzVFVGQlRTeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJUdG5Ra0ZETVVNc1NVRkJTU3hUUVVGVExFdEJRVXNzU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1NVRkJTU3hGUVVGRkxHbENRVUZwUWl4RFFVRkRMRVZCUVVVN2IwSkJRMnhGTEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YVVKQlEzWkNPMkZCUTBvN08xbEJSVVFzUzBGQlN5eEZRVUZGTEVOQlFVTTdVMEZEV0RzN1VVRkZSQ3hQUVVGUExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1MwRkRhRU03T3pzN096czdPenM3T3p0SlFWbEVMR0ZCUVdFc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRGFrSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU40UWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZET3p0UlFVVTFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eExRVUZMTEVWQlFVVTdXVUZEWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVONlF5eE5RVUZOTzFsQlEwZ3NTMEZCU3l4SlFVRkpMRWRCUVVjc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NSVUZCUlN4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUVVVN1owSkJRMnBGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRemxFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRha1U3TzFsQlJVUXNTMEZCU3l4SlFVRkpMRWRCUVVjc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU53UlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU01UkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMnBGTzFOQlEwbzdPMUZCUlVRc1QwRkJUeXhMUVVGTExFTkJRVU03UzBGRGFFSTdPenM3T3pzN096czdPMGxCVjBRc1dVRkJXU3hEUVVGRExFbEJRVWtzUlVGQlJTeHBRa0ZCYVVJc1JVRkJSVHRSUVVOc1F5eFBRVUZQTEZOQlFWTXNTMEZCU3l4cFFrRkJhVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1IwRkJSeXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZETTBjN096czdPenM3T3p0SlFWTkVMR0ZCUVdFc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFlpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVOcVJUczdPenM3T3pzN096dEpRVlZFTEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdFJRVU4wUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSVHRaUVVNNVJDeFBRVUZQTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFZEJRVWNzUTBGQlF6dFRRVU5xUXp0UlFVTkVMRTlCUVU4c1UwRkJVeXhEUVVGRE8wdEJRM0JDT3pzN096czdPenM3T3p0SlFWZEVMRzlDUVVGdlFpeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTndRaXhQUVVGUExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkVPenM3T3pzN096czdPenRKUVZkRUxHOUNRVUZ2UWl4RFFVRkRMRTFCUVUwc1JVRkJSVHRSUVVONlFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSVHRaUVVONFF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0VFFVTmFPMUZCUTBRc1QwRkJUeXhUUVVGVExFTkJRVU03UzBGRGNFSTdPenM3T3pzN096czdPenM3TzBsQlkwUXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRka0lzVFVGQlRTeFZRVUZWTEVkQlFVYzdXVUZEWml4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVOcVF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTndReXhEUVVGRE96dFJRVVZHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVVUZET1VNc1RVRkJUU3hQUVVGUExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU0xUXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEU5QlFVOHNRMEZCUXp0UlFVTjRReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlF6ZERMRTFCUVUwc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NVVUZCVVN4RFFVRkRPenRSUVVVeFF5eE5RVUZOTEZOQlFWTXNSMEZCUnl4RFFVRkRPMWxCUTJZc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNWVUZCVlN4RFFVRkRPMWxCUTJwRExGRkJRVkVzUlVGQlJTeFBRVUZQTEVkQlFVY3NVVUZCVVR0VFFVTXZRaXhGUVVGRk8xbEJRME1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNN1owSkJRMnhDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSenRuUWtGRGJrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dGhRVU14UWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxGRkJRVkVzUjBGQlJ5eFJRVUZSTzFOQlEyaERMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGRrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSE8yRkJRM1JDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1QwRkJUeXhIUVVGSExGTkJRVk03VTBGRGFFTXNSVUZCUlR0WlFVTkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzJkQ1FVTnNRaXhIUVVGSExFVkJRVVVzVlVGQlZTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMmRDUVVOMlFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8yRkJRekZDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1VVRkJVU3hIUVVGSExGTkJRVk03VTBGRGFrTXNRMEZCUXl4RFFVRkRPenRSUVVWSUxFMUJRVTBzVFVGQlRTeEhRVUZITEZOQlFWTTdPMkZCUlc1Q0xFMUJRVTBzUTBGQlF5eERRVUZETEZGQlFWRXNTMEZCU3l4VFFVRlRMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6czdZVUZGT1VNc1RVRkJUU3hEUVVGRExFTkJRVU1zVVVGQlVTeExRVUZMTzJkQ1FVTnNRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlF5eEhRVUZITEVOQlFVTXNWMEZCVnl4RFFVRkRMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU03YlVKQlEzUkZMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdPMkZCUlhKRUxFMUJRVTA3WjBKQlEwZ3NRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hMUVVGTExGRkJRVkVzUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhSUVVGUkxFZEJRVWNzU1VGQlNUdG5Ra0ZEZGtVc1EwRkJReXhEUVVGRExFVkJRVVVzVTBGQlV5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVNdlFpeERRVUZET3p0UlFVVk9MRTlCUVU4c1UwRkJVeXhMUVVGTExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRE9VVTdPenM3T3pzN096dEpRVk5FTEV0QlFVc3NRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVONFFpeExRVUZMTEUxQlFVMHNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdXVUZETDBJc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRE96dFpRVVV2UWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTNwRUxFMUJRVTBzU1VGQlNTeEhRVUZITEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03TzFsQlJYcEVMRWxCUVVrc1NVRkJTU3hKUVVGSkxFbEJRVWtzUlVGQlJUdG5Ra0ZEWkN4UFFVRlBMRWRCUVVjc1EwRkJRenRoUVVOa08xTkJRMG83TzFGQlJVUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1MwRkRaanM3T3pzN096czdPenRKUVZWRUxHTkJRV01zUTBGQlF5eExRVUZMTEVWQlFVVXNUVUZCVFN4RlFVRkZPMUZCUXpGQ0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzUkVPenM3T3pzN096czdTVUZUUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdVVUZEZEVJc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRMUVVONlJEczdPenM3T3pzN08wbEJVMFFzWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMnhDTEU5QlFVODdXVUZEU0N4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVOcVF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTndReXhEUVVGRE8wdEJRMHc3UTBGRFNqczdRVU5vWmtRN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdRVUVyUWtFc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4RFFVRkRMRWxCUVVrc1MwRkJTenRKUVVOcVF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVONlF5eFBRVUZQTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFhRVUZYTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1EwRkRNVVlzUTBGQlF6czdPenM3T3pzN1FVRlJSaXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRU5CUVVNc1IwRkJSenM3T3pzN096czdPenM3T3p0SlFXRXpRaXhqUVVGakxFZEJRVWNzUTBGQlF6czdPenM3T3pzN096czdPenM3T3p0UlFXZENaQ3gzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hGUVVGRkxGRkJRVkVzUlVGQlJUczdPenRaUVVrdlF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4clFrRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTXhReXhKUVVGSkxFbEJRVWtzUTBGQlF5eFRRVUZUTEVsQlFVa3NVVUZCVVN4TFFVRkxMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZPMmRDUVVOd1JDeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTXpRenRUUVVOS08wdEJRMG83TzBGRGFFWk1PenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFMUJRVTBzWlVGQlpTeEhRVUZITEdOQlFXTXNTMEZCU3l4RFFVRkRPMGxCUTNoRExGZEJRVmNzUTBGQlF5eEhRVUZITEVWQlFVVTdVVUZEWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRFpEdERRVU5LT3p0QlEzWkNSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVVZCTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4aFFVRmhMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU53UXl4TlFVRk5MRTlCUVU4c1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZET3p0QlFVVTVRaXhOUVVGTkxHRkJRV0VzUjBGQlJ5eE5RVUZOTzBsQlEzaENMRmRCUVZjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhGUVVGRk8xRkJRelZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzaENMR0ZCUVdFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRPMUZCUTNSRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRemRDT3p0SlFVVkVMRWxCUVVrc1RVRkJUU3hIUVVGSE8xRkJRMVFzVDBGQlR5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRek5DT3p0SlFVVkVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlR5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNdlJEczdTVUZGUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNMVFqczdTVUZGUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8wdEJRMnhET3p0SlFVVkVMRk5CUVZNc1EwRkJReXhWUVVGVkxFVkJRVVU3VVVGRGJFSXNZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTTdVVUZEY0VNc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFpqczdTVUZGUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhUUVVGVExFVkJRVVVzWVVGQllTeEhRVUZITEVWQlFVVXNSVUZCUlN4VFFVRlRMRWRCUVVjc1pVRkJaU3hEUVVGRExFVkJRVVU3VVVGRGFrVXNUVUZCVFN4WFFVRlhMRWRCUVVjc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1VVRkRla1FzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlR0WlFVTmtMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03TzFsQlJYWkVMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUXpOQ096dFJRVVZFTEU5QlFVOHNTVUZCU1N4RFFVRkRPMHRCUTJZN1EwRkRTanM3UVVNdlJFUTdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1FVRkZRU3hOUVVGTkxGVkJRVlVzUjBGQlJ5eGpRVUZqTEdWQlFXVXNRMEZCUXp0SlFVTTNReXhYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNqczdRVU42UWtRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExHTkJRV01zWlVGQlpTeERRVUZETzBsQlEyNUVMRmRCUVZjc1EwRkJReXhIUVVGSExFVkJRVVU3VVVGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRaRHREUVVOS096dEJRM3BDUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVsQkxFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc1EwRkJReXhEUVVGRE8wRkJRMmhETEUxQlFVMHNiMEpCUVc5Q0xFZEJRVWNzWTBGQll5eGhRVUZoTEVOQlFVTTdTVUZEY2tRc1YwRkJWeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5tTEVsQlFVa3NTMEZCU3l4SFFVRkhMSEZDUVVGeFFpeERRVUZETzFGQlEyeERMRTFCUVUwc1dVRkJXU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMUZCUXpORExFMUJRVTBzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZiRUlzU1VGQlNTeE5RVUZOTEVOQlFVTXNVMEZCVXl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRM3BDTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1UwRkRha0lzVFVGQlRTeEpRVUZKTEZGQlFWRXNTMEZCU3l4UFFVRlBMRXRCUVVzc1JVRkJSVHRaUVVOc1F5eE5RVUZOTEZkQlFWY3NSMEZCUnl4UlFVRlJMRU5CUVVNc1MwRkJTeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1RVRkJUU3hEUVVGRExGTkJRVk1zUTBGQlF5eFhRVUZYTEVOQlFVTXNSVUZCUlR0blFrRkRMMElzUzBGQlN5eEhRVUZITEZkQlFWY3NRMEZCUXp0aFFVTjJRaXhOUVVGTk8yZENRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hWUVVGVkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTjBRenRUUVVOS0xFMUJRVTA3V1VGRFNDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1owSkJRV2RDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNMVF6czdVVUZGUkN4TFFVRkxMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzV1VGQldTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRlRU03TzBsQlJVUXNWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOV0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkRiRU1zWVVGQllTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNKQ0xFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRmRCUVZjc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFdDeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRaaXhUUVVGVExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRE8xbEJRMnhETEdGQlFXRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOeVFpeERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlR0UlFVTldMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFpRVU5tTEZOQlFWTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTTVSQ3hoUVVGaExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUTNoQ0xFTkJRVU1zUTBGQlF6dExRVU5PTzBOQlEwbzdPMEZEYkVWRU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlIwRXNUVUZCVFN4dlFrRkJiMElzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3h0UWtGQmJVSXNSMEZCUnl4alFVRmpMR0ZCUVdFc1EwRkJRenRKUVVOd1JDeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTJZc1NVRkJTU3hMUVVGTExFZEJRVWNzYjBKQlFXOUNMRU5CUVVNN1VVRkRha01zVFVGQlRTeFpRVUZaTEVkQlFVY3NiMEpCUVc5Q0xFTkJRVU03VVVGRE1VTXNUVUZCVFN4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE96dFJRVVZzUWl4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdPMGxCUlVRc1VVRkJVU3hIUVVGSE8xRkJRMUFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlJTeExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5PMU5CUTNSRExFTkJRVU1zUTBGQlF6dExRVU5PTzBOQlEwbzdPMEZETTBORU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlEwRTdRVUZEUVN4QlFVVkJMRTFCUVUwc2JVSkJRVzFDTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTNCRExFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1kwRkJZeXhoUVVGaExFTkJRVU03U1VGRGJrUXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVObUxFbEJRVWtzUzBGQlN5eEhRVUZITEcxQ1FVRnRRaXhEUVVGRE8xRkJRMmhETEUxQlFVMHNXVUZCV1N4SFFVRkhMRzFDUVVGdFFpeERRVUZETzFGQlEzcERMRTFCUVUwc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6czdVVUZGYkVJc1NVRkJTU3hSUVVGUkxFdEJRVXNzVDBGQlR5eExRVUZMTEVWQlFVVTdXVUZETTBJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU5xUWl4TlFVRk5PMWxCUTBnc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdkQ1FVRm5RaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETlVNN08xRkJSVVFzUzBGQlN5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzaERPME5CUTBvN08wRkRkRU5FT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCU1VFc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4TFFVRkxMRU5CUVVNN1FVRkRjRU1zVFVGQlRTeHZRa0ZCYjBJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU55UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03VVVGRGJFTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdVVUZETTBNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxFdEJRVXNzV1VGQldTeFBRVUZQTEVWQlFVVTdXVUZETVVJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU5xUWl4TlFVRk5MRWxCUVVrc1VVRkJVU3hMUVVGTExFOUJRVThzUzBGQlN5eEZRVUZGTzFsQlEyeERMRWxCUVVrc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0blFrRkRja0lzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0aFFVTm9RaXhOUVVGTkxFbEJRVWtzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRE4wSXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJRenRoUVVOcVFpeE5RVUZOTzJkQ1FVTklMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeFZRVUZWTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOMFF6dFRRVU5LTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdPMGxCUlVRc1RVRkJUU3hIUVVGSE8xRkJRMHdzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFMUJRVTBzU1VGQlNTeExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5PMU5CUTNoRExFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRTlCUVU4c1IwRkJSenRSUVVOT0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hOUVVGTkxFdEJRVXNzUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFR0VFFVTjZReXhEUVVGRExFTkJRVU03UzBGRFRqdERRVU5LT3p0QlF6RkVSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVXRCTEUxQlFVMHNVMEZCVXl4SFFVRkhMRTFCUVUwN1NVRkRjRUlzVjBGQlZ5eEhRVUZITzB0QlEySTdPMGxCUlVRc1QwRkJUeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5ZTEU5QlFVOHNTVUZCU1N4dlFrRkJiMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0TFFVTXhRenM3U1VGRlJDeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTFRc1QwRkJUeXhKUVVGSkxHdENRVUZyUWl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wdEJRM2hET3p0SlFVVkVMRTlCUVU4c1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFdDeFBRVUZQTEVsQlFVa3NiMEpCUVc5Q0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdTMEZETVVNN08wbEJSVVFzVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTldMRTlCUVU4c1NVRkJTU3h0UWtGQmJVSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVONlF6czdRMEZGU2l4RFFVRkRPenRCUVVWR0xFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1NVRkJTU3hUUVVGVExFVkJRVVU3TzBGRE9VTXhRenM3T3pzN096czdPenM3T3pzN096czdPenM3TzBGQmNVSkJMRUZCUjBFc1RVRkJUVUVzVlVGQlVTeEhRVUZITEZOQlFWTXNRMEZCUXpzN1FVRkZNMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NSMEZCUnl4RFFVRkRPMEZCUXpOQ0xFMUJRVTBzWTBGQll5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTjZRaXhOUVVGTkxHRkJRV0VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEzQkNMRTFCUVUwc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU53UWl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTXpRaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eEhRVUZITEVOQlFVTTdPMEZCUlRWQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTm9ReXhOUVVGTkxHbENRVUZwUWl4SFFVRkhMRk5CUVZNc1EwRkJRenRCUVVOd1F5eE5RVUZOTEdOQlFXTXNSMEZCUnl4TlFVRk5MRU5CUVVNN1FVRkRPVUlzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhWUVVGVkxFTkJRVU03UVVGRGRFTXNUVUZCVFN4WFFVRlhMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRM2hDTEUxQlFVMHNWMEZCVnl4SFFVRkhMRWRCUVVjc1EwRkJRenM3UVVGRmVFSXNUVUZCVFN4aFFVRmhMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRekZDTEUxQlFVMHNNRUpCUVRCQ0xFZEJRVWNzUlVGQlJTeERRVUZETzBGQlEzUkRMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NSMEZCUnl4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhEUVVGRE8wRkJRek5DTEUxQlFVMHNTVUZCU1N4SFFVRkhMR0ZCUVdFc1IwRkJSeXhEUVVGRExFTkJRVU03UVVGREwwSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1lVRkJZU3hIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU5vUXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhoUVVGaExFZEJRVWNzUlVGQlJTeERRVUZETzBGQlEzQkRMRTFCUVUwc1UwRkJVeXhIUVVGSExFOUJRVThzUTBGQlF6czdRVUZGTVVJc1RVRkJUU3hQUVVGUExFZEJRVWNzUTBGQlF5eEhRVUZITEV0QlFVczdTVUZEY2tJc1QwRkJUeXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJRenREUVVOb1F5eERRVUZET3p0QlFVVkdMRTFCUVUwc1YwRkJWeXhIUVVGSExFTkJRVU1zU1VGQlNUdEpRVU55UWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhSUVVGUkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUXk5Q0xFOUJRVThzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEpRVUZKTEUxQlFVMHNTVUZCU1N4alFVRmpMRU5CUVVNN1EwRkRPVVVzUTBGQlF6czdPenM3T3p0QlFVOUdMRTFCUVUwc1ZVRkJWU3hIUVVGSExFMUJRVTBzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFZEJRVWNzWTBGQll5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPenRCUVVWNFJTeE5RVUZOTEhOQ1FVRnpRaXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXpzN1FVRkZla1FzUVVGaFFUczdPenM3T3pzN08wRkJVMEVzVFVGQlRTeGhRVUZoTEVkQlFVY3NRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eHpRa0ZCYzBJc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NVMEZCVXl4RFFVRkRPenRCUVVWMFJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NSVUZCUlN4TFFVRkxMRXRCUVVzN1NVRkRhRVFzVFVGQlRTeFRRVUZUTEVkQlFVY3NTMEZCU3l4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVNM1FpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVjBGQlZ5eEhRVUZITEdWQlFXVXNRMEZCUXp0SlFVTjBReXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZETVVJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzUzBGQlN5eEhRVUZITEZOQlFWTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkROVVVzVDBGQlR5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMGxCUTJZc1QwRkJUeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETzBOQlEzSkNMRU5CUVVNN08wRkJSVVlzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNTMEZCU3l4TFFVRkxPMGxCUXk5RExFMUJRVTBzUzBGQlN5eEpRVUZKTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJRenRKUVVNM1FpeE5RVUZOTEdWQlFXVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRVFzVFVGQlRTeFZRVUZWTEVkQlFVY3NRMEZCUXl4SFFVRkhMR1ZCUVdVc1EwRkJRenRKUVVOMlF5eE5RVUZOTEhGQ1FVRnhRaXhIUVVGSExEQkNRVUV3UWl4SFFVRkhMRXRCUVVzc1EwRkJRenRKUVVOcVJTeE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUjBGQlJ5eERRVUZETEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03U1VGRGJFVXNUVUZCVFN4WlFVRlpMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3hwUWtGQmFVSXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJRenM3U1VGRk0wVXNUVUZCVFN4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFdEJRVXNzUjBGQlJ5eGxRVUZsTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03U1VGRGJrVXNUVUZCVFN4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFdEJRVXNzUjBGQlJ5eGxRVUZsTEVOQlFVTTdPMGxCUlRORExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTm1MRTlCUVU4c1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dEpRVU53UWl4UFFVRlBMRU5CUVVNc1UwRkJVeXhIUVVGSExFdEJRVXNzUTBGQlF6dEpRVU14UWl4UFFVRlBMRU5CUVVNc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF6dEpRVU01UWl4UFFVRlBMRU5CUVVNc1UwRkJVeXhIUVVGSExGbEJRVmtzUTBGQlF6dEpRVU5xUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0SlFVTXZRaXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0SlFVTndSQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUlVGQlJTeE5RVUZOTEVkQlFVY3NjVUpCUVhGQ0xFVkJRVVVzY1VKQlFYRkNMRVZCUVVVc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRekZJTEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExHdENRVUZyUWl4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8wbEJRM3BJTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hIUVVGSExHdENRVUZyUWl4RlFVRkZMRTFCUVUwc1IwRkJSeXhyUWtGQmEwSXNSMEZCUnl4eFFrRkJjVUlzUlVGQlJTeHhRa0ZCY1VJc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNUMEZCVHl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE9Va3NUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVVzVFVGQlRTeEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPMGxCUXpWRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1IwRkJSeXhyUWtGQmEwSXNSMEZCUnl4eFFrRkJjVUlzUlVGQlJTeHhRa0ZCY1VJc1JVRkJSU3hQUVVGUExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE0wZ3NUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRMRU5CUVVNN1NVRkRMMFVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZMSEZDUVVGeFFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXpzN1NVRkZka2NzVDBGQlR5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRPMGxCUTJwQ0xFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTm1MRTlCUVU4c1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dERRVU55UWl4RFFVRkRPenRCUVVWR0xFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUzBGQlN5eExRVUZMTzBsQlEzaERMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVOHNRMEZCUXl4VFFVRlRMRVZCUVVVc1EwRkJRenRKUVVOd1FpeFBRVUZQTEVOQlFVTXNVMEZCVXl4SFFVRkhMRk5CUVZNc1EwRkJRenRKUVVNNVFpeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU55UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRKUVVOb1JDeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRMEZEY2tJc1EwRkJRenM3T3p0QlFVbEdMRTFCUVUwc1RVRkJUU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETjBJc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTNRaXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFRRVUZUTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVOb1F5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRM3BDTEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03T3pzN096czdPenM3UVVGVmVrSXNUVUZCVFN4TlFVRk5MRWRCUVVjc1kwRkJZeXhyUWtGQmEwSXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJRenM3T3pzN096czdPenM3T3pzN096dEpRV2RDZWtRc1YwRkJWeXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NSVUZCUlN4UlFVRlJMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVN1VVRkRjRVFzUzBGQlN5eEZRVUZGTEVOQlFVTTdPMUZCUlZJc1RVRkJUU3hUUVVGVExFZEJRVWRETEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRE8yRkJRM2hGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yRkJRMklzVTBGQlV5eERRVUZETEZWQlFWVXNSVUZCUlN4RFFVRkRPMkZCUTNaQ0xFdEJRVXNzUTBGQlF6czdVVUZGV0N4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenM3VVVGRk4wTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1lVRkRia1VzVTBGQlV5eERRVUZETEdGQlFXRXNRMEZCUXp0aFFVTjRRaXhMUVVGTExFTkJRVU03TzFGQlJWZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1VVRkJVU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dGhRVU01UlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dGhRVU5tTEZOQlFWTXNRMEZCUXl4blFrRkJaMElzUTBGQlF6dGhRVU16UWl4TFFVRkxMRU5CUVVNN08xRkJSVmdzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUjBFc2EwSkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdZVUZEZWtRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5pTEZOQlFWTXNRMEZCUXl4VFFVRlRMRU5CUVVNN1lVRkRjRUlzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8yRkJRM3BFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVTBGQlV5eERRVUZETzJGQlEzQkNMRXRCUVVzc1EwRkJRenM3VVVGRldDeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhRU3hyUWtGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRE8yRkJRM2hGTEZGQlFWRXNSVUZCUlR0aFFVTldMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU03WVVGRFppeExRVUZMTEVOQlFVTTdTMEZEWkRzN1NVRkZSQ3hYUVVGWExHdENRVUZyUWl4SFFVRkhPMUZCUXpWQ0xFOUJRVTg3V1VGRFNDeGxRVUZsTzFsQlEyWXNhVUpCUVdsQ08xbEJRMnBDTEdOQlFXTTdXVUZEWkN4clFrRkJhMEk3V1VGRGJFSXNWMEZCVnp0WlFVTllMRmRCUVZjN1UwRkRaQ3hEUVVGRE8wdEJRMHc3TzBsQlJVUXNhVUpCUVdsQ0xFZEJRVWM3VVVGRGFFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRPVVE3TzBsQlJVUXNiMEpCUVc5Q0xFZEJRVWM3VVVGRGJrSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpkRUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3pzN096czdPenRKUVZGRUxGTkJRVk1zUjBGQlJ6dFJRVU5TTEU5QlFVOHNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU51UXpzN096czdPenM3U1VGUlJDeFJRVUZSTEVkQlFVYzdVVUZEVUN4UFFVRlBMRWxCUVVrc1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dExRVU16UWpzN096czdPenRKUVU5RUxFbEJRVWtzU1VGQlNTeEhRVUZITzFGQlExQXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETTBJN1NVRkRSQ3hKUVVGSkxFdEJRVXNzUTBGQlF5eFJRVUZSTEVWQlFVVTdVVUZEYUVJc1NVRkJTU3hKUVVGSkxFdEJRVXNzVVVGQlVTeEZRVUZGTzFsQlEyNUNMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTTdXVUZEZEVNc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1UwRkRia01zVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFsQlF6TkNMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMU5CUTJoRU8wdEJRMG83T3pzN096czdPMGxCVVVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdTVUZEUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRFppeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhOUVVGTkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFRRVU51UXl4TlFVRk5PMWxCUTBnc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFRRVUZUTEVWQlFVVXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU03VTBGRGJrUTdTMEZEU2pzN096czdPenRKUVU5RUxFbEJRVWtzVjBGQlZ5eEhRVUZITzFGQlEyUXNUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpkRk8wbEJRMFFzU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTJZc1NVRkJTU3hKUVVGSkxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlExb3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRFpDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOcVFpeExRVUZMTzFsQlEwWXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEV0N4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU5rTzB0QlEwbzdPenM3T3pzN1NVRlBSQ3hqUVVGakxFZEJRVWM3VVVGRFlpeFBRVUZQTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRE8wdEJRM0JET3pzN096czdPMGxCVDBRc1NVRkJTU3hEUVVGRExFZEJRVWM3VVVGRFNpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGRrSTdTVUZEUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVU3VVVGRFVpeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU51UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096dEpRVTlFTEVsQlFVa3NRMEZCUXl4SFFVRkhPMUZCUTBvc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNaQ08wbEJRMFFzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFJc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRia0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGFFTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxGRkJRVkVzUjBGQlJ6dFJRVU5ZTEU5QlFVOHNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UWp0SlFVTkVMRWxCUVVrc1VVRkJVU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5tTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVObUxFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1UwRkRjRU1zVFVGQlRUdFpRVU5JTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzU1VGQlNTeEhRVUZITEdOQlFXTXNRMEZCUXp0WlFVTnFSQ3hUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVlVGQlZTeEZRVUZGTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03VTBGRGNrUTdTMEZEU2pzN096czdPenM3U1VGUlJDeFBRVUZQTEVkQlFVYzdVVUZEVGl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFWVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRVZCUVVVc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6ZERMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNaVUZCWlN4RlFVRkZPMmRDUVVNeFF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YVVKQlExbzdZVUZEU2l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOUU8wdEJRMG83T3pzN096czdPenRKUVZORUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEV0N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFsQlEzSkNMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNZMEZCWXl4RlFVRkZPMmRDUVVONlF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YjBKQlExUXNUVUZCVFR0cFFrRkRWRHRoUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlExQTdTMEZEU2pzN096czdPenRKUVU5RUxFMUJRVTBzUjBGQlJ6dFJRVU5NTEU5QlFVOHNTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03UzBGREwwSTdPenM3T3pzN096dEpRVk5FTEZOQlFWTXNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRaQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlR0WlFVTTNReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSVHRuUWtGRGJFUXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzI5Q1FVTlVMRTFCUVUwN2FVSkJRMVE3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3T3pzN096dEpRVmxFTEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhGUVVGRkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZPMUZCUTNKRUxFMUJRVTBzUzBGQlN5eEhRVUZITEU5QlFVOHNSMEZCUnl4aFFVRmhMRU5CUVVNN1VVRkRkRU1zVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVNelFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRemRDTEUxQlFVMHNVMEZCVXl4SFFVRkhMRkZCUVZFc1IwRkJSeXhMUVVGTExFTkJRVU03TzFGQlJXNURMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPenRSUVVVelFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRaUVVObUxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVOMlJEczdVVUZGUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTzFsQlEzSkNMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGVFTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka01zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEZWtRN08xRkJSVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN08xRkJSVFZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRWxCUVVrN1VVRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEwb3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGRFUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzQkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRkRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM0pFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVONlJDeE5RVUZOTzFOQlExUTdVVUZEUkN4UlFVRlJPMU5CUTFBN096dFJRVWRFTEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU14UXp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVORUxGVkJRVkVzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXpzN1FVTndaMEl2UXpzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVsQkxFMUJRVTFCTEZWQlFWRXNSMEZCUnl4WlFVRlpMRU5CUVVNN096dEJRVWM1UWl4TlFVRk5SU3hwUWtGQlpTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTm9ReXhOUVVGTkxHTkJRV01zUjBGQlJ5eE5RVUZOTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hsUVVGbExFZEJRVWNzVDBGQlR5eERRVUZETzBGQlEyaERMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NWVUZCVlN4RFFVRkRPenM3UVVGSGRFTXNUVUZCVFVNc1VVRkJUU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETjBJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzVVVGQlVTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJiMEl2UWl4TlFVRk5MRk5CUVZNc1IwRkJSeXhqUVVGakxHdENRVUZyUWl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE96czdPenM3T3pzN096czdPMGxCWVRWRUxGZEJRVmNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlR0UlFVTTFReXhMUVVGTExFVkJRVVVzUTBGQlF6czdVVUZGVWl4TlFVRk5MRlZCUVZVc1IwRkJSMFlzYTBKQlFWRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTkRMR2xDUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF5OUZMRWxCUVVrc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJUdFpRVU53UWtNc1VVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCVlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xbEJRMjVETEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVORUxHbENRVUZsTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRMnhFTEUxQlFVMDdXVUZEU0N4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNORU5CUVRSRExFTkJRVU1zUTBGQlF6dFRRVU01UlRzN1VVRkZSQ3hOUVVGTkxGTkJRVk1zUjBGQlIwUXNhMEpCUVZFc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUlN4SlFVRkpMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVU3V1VGRGJrSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZEVJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGpRVUZqTEVWQlFVVXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xTkJRMmhFTEUxQlFVMDdXVUZEU0N4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNNa05CUVRKRExFTkJRVU1zUTBGQlF6dFRRVU0zUlRzN1VVRkZSQ3hOUVVGTkxGVkJRVlVzUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5xUml4SlFVRkpMRlZCUVZVc1EwRkJReXhQUVVGUExFVkJRVVU3V1VGRGNFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZEZUVJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGxRVUZsTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRMnhFTEUxQlFVMDdPMWxCUlVnc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRka0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRUUVVONlF6czdVVUZGUkN4TlFVRk5MRmxCUVZrc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dGhRVU5zUml4TlFVRk5MRVZCUVVVc1EwRkJRenRSUVVOa0xFbEJRVWtzV1VGQldTeERRVUZETEU5QlFVOHNSVUZCUlR0WlFVTjBRaXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJRenRaUVVNMVFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMU5CUTJ4RUxFMUJRVTA3TzFsQlJVZ3NVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8xTkJRelZETzB0QlEwbzdPMGxCUlVRc1YwRkJWeXhyUWtGQmEwSXNSMEZCUnp0UlFVTTFRaXhQUVVGUE8xbEJRMGhETEdsQ1FVRmxPMWxCUTJZc1kwRkJZenRaUVVOa0xHVkJRV1U3V1VGRFppeHJRa0ZCYTBJN1UwRkRja0lzUTBGQlF6dExRVU5NT3p0SlFVVkVMR2xDUVVGcFFpeEhRVUZITzB0QlEyNUNPenRKUVVWRUxHOUNRVUZ2UWl4SFFVRkhPMHRCUTNSQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUFF5eFJRVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRek5DT3pzN096czdPMGxCVDBRc1NVRkJTU3hKUVVGSkxFZEJRVWM3VVVGRFVDeFBRVUZQTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE1VSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNTVUZCU1N4TFFVRkxMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETTBRN1NVRkRSQ3hKUVVGSkxFdEJRVXNzUTBGQlF5eFJRVUZSTEVWQlFVVTdVVUZEYUVJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeEpRVUZKTEV0QlFVc3NVVUZCVVN4RlFVRkZPMWxCUTI1Q0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1UwRkRla01zVFVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFOQlEyaEVPMHRCUTBvN096czdPenM3U1VGUFJDeFRRVUZUTEVkQlFVYzdVVUZEVWl4SlFVRkpMRWxCUVVrc1EwRkJReXhYUVVGWExFVkJRVVU3V1VGRGJFSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVU3WjBKQlF6VkVMRTFCUVUwc1JVRkJSVHR2UWtGRFNpeE5RVUZOTEVWQlFVVXNTVUZCU1R0cFFrRkRaanRoUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlExQTdVVUZEUkN4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEd0Q1FVRnJRaXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlF6VkRMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3T3pzN08wbEJTMFFzVDBGQlR5eEhRVUZITzFGQlEwNHNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEZWtJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8wdEJRelZET3pzN096czdPMGxCVDBRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVsQlFVa3NTMEZCU3l4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEzUkRPenM3T3pzN08wbEJUMFFzVVVGQlVTeEhRVUZITzFGQlExQXNUMEZCVHl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZWtJN096czdPenM3T3p0SlFWTkVMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFZpeE5RVUZOTEVsQlFVa3NSMEZCUnl4UlFVRlJMRXRCUVVzc1QwRkJUeXhMUVVGTExFZEJRVWNzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkROVVFzVDBGQlR5eExRVUZMTEV0QlFVc3NTVUZCU1N4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzB0QlF5OURPME5CUTBvc1EwRkJRenM3UVVGRlJpeE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJRMGdzVlVGQlVTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPenM3T3pzN096czdRVUZUYkVRc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4SlFVRkpMRk5CUVZNc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE96dEJRMnBQZEVVN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOUVN4VlFVRlJMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTTdPenM3T3pzN1FVRlBia01zVFVGQlRTeGhRVUZoTEVkQlFVY3NZMEZCWXl4WFFVRlhMRU5CUVVNN096czdPMGxCU3pWRExGZEJRVmNzUjBGQlJ6dFJRVU5XTEV0QlFVc3NSVUZCUlN4RFFVRkRPMHRCUTFnN08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1VVRkRhRUlzU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVU3V1VGRE1VSXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXh4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMU5CUXpORE96dFJRVVZFTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3hEUVVGRExFdEJRVXNzUzBGQlN6czdXVUZGTDBNc1NVRkJTU3hEUVVGRExFOUJRVTg3YVVKQlExQXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dHBRa0ZETTBNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVOc1F5eERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0TFFVTjBRanM3T3pzN096dEpRVTlFTEVsQlFVa3NUMEZCVHl4SFFVRkhPMUZCUTFZc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRFNTeFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNKRU8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlEwb3NWVUZCVVN4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE96dEJReTlFZEVRN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJiMEpCTEVGQlRVRXNUVUZCVFVFc1YwRkJVU3hIUVVGSExHZENRVUZuUWl4RFFVRkRPenRCUVVWc1F5eE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU0zUWl4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTnNReXhOUVVGTkxEaENRVUU0UWl4SFFVRkhMRXRCUVVzc1EwRkJRenRCUVVNM1F5eE5RVUZOTERaQ1FVRTJRaXhIUVVGSExFdEJRVXNzUTBGQlF6dEJRVU0xUXl4TlFVRk5MRGhDUVVFNFFpeEhRVUZITEV0QlFVc3NRMEZCUXpzN1FVRkZOME1zVFVGQlRTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTJoQ0xFMUJRVTBzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1FVRkZhRUlzVFVGQlRTeGhRVUZoTEVkQlFVY3NTVUZCU1N4SFFVRkhMR2RDUVVGblFpeERRVUZETzBGQlF6bERMRTFCUVUwc1kwRkJZeXhIUVVGSExFbEJRVWtzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRCUVVNdlF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE96dEJRVVZvUkN4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYQkNMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEZGQlFWRXNRMEZCUXp0QlFVTnNReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMRmxCUVZrc1EwRkJRenRCUVVNeFF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUTBGQlF6dEJRVU4wUXl4TlFVRk5MR2REUVVGblF5eEhRVUZITEhkQ1FVRjNRaXhEUVVGRE8wRkJRMnhGTEUxQlFVMHNLMEpCUVN0Q0xFZEJRVWNzZFVKQlFYVkNMRU5CUVVNN1FVRkRhRVVzVFVGQlRTeG5RMEZCWjBNc1IwRkJSeXgzUWtGQmQwSXNRMEZCUXp0QlFVTnNSU3hOUVVGTkxIVkNRVUYxUWl4SFFVRkhMR1ZCUVdVc1EwRkJRenM3UVVGRmFFUXNUVUZCVFN4WFFVRlhMRWRCUVVjc1EwRkJReXhaUVVGWkxFVkJRVVVzWVVGQllTeEhRVUZITEVOQlFVTXNTMEZCU3p0SlFVTnlSQ3hOUVVGTkxFMUJRVTBzUjBGQlJ5eFJRVUZSTEVOQlFVTXNXVUZCV1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRekZETEU5QlFVOHNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eGhRVUZoTEVkQlFVY3NUVUZCVFN4RFFVRkRPME5CUTNoRUxFTkJRVU03TzBGQlJVWXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eERRVUZETEZsQlFWa3NSVUZCUlN4WlFVRlpMRXRCUVVzN1NVRkRkRVFzVDBGQlQwTXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zV1VGQldTeERRVUZETzFOQlEyaERMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFlpeFRRVUZUTEVOQlFVTXNXVUZCV1N4RFFVRkRPMU5CUTNaQ0xFdEJRVXNzUTBGQlF6dERRVU5rTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3d3UWtGQk1FSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVVVzV1VGQldTeExRVUZMTzBsQlEyaEZMRWxCUVVrc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0UlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJReTlETEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRPMHRCUTNaRU8wbEJRMFFzVDBGQlR5eFpRVUZaTEVOQlFVTTdRMEZEZGtJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4RFFVRkRMR0ZCUVdFc1JVRkJSU3hUUVVGVExFVkJRVVVzV1VGQldTeExRVUZMTzBsQlF6TkVMRWxCUVVrc1UwRkJVeXhMUVVGTExHRkJRV0VzU1VGQlNTeE5RVUZOTEV0QlFVc3NZVUZCWVN4RlFVRkZPMUZCUTNwRUxFOUJRVThzU1VGQlNTeERRVUZETzB0QlEyWXNUVUZCVFN4SlFVRkpMRTlCUVU4c1MwRkJTeXhoUVVGaExFVkJRVVU3VVVGRGJFTXNUMEZCVHl4TFFVRkxMRU5CUVVNN1MwRkRhRUlzVFVGQlRUdFJRVU5JTEU5QlFVOHNXVUZCV1N4RFFVRkRPMHRCUTNaQ08wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRGVrUXNTVUZCU1N4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzFGQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eFZRVUZWTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1YwRkJWeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGJFWTdPMGxCUlVRc1QwRkJUeXhaUVVGWkxFTkJRVU03UTBGRGRrSXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGNrTXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenRCUVVWNlF5eE5RVUZOTEU5QlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6czdRVUZGTDBRc1RVRkJUU3haUVVGWkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdTVUZETlVJc1NVRkJTU3hUUVVGVExFdEJRVXNzYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzFGQlF6ZERMR3RDUVVGclFpeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGNFTTdPMGxCUlVRc1QwRkJUeXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UTBGRGVFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRXRCUVVzN1NVRkRka01zYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU03UTBGREwwUXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxFOUJRVThzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3l4WlFVRlpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN08wRkJSWEpGTEUxQlFVMHNWMEZCVnl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4TFFVRkxPMGxCUXpsRExFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMUZCUTJoQ0xFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6czdVVUZGTVVRc1MwRkJTeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVWQlFVVTdXVUZEY0VJc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFOQlF6ZERPMHRCUTBvN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTE8wbEJRM1JDTEdWQlFXVXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE1VSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3VVVGRGFFSXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU4yUkR0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1NVRkRla0lzVjBGQlZ5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOd1JDeGxRVUZsTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UTBGRE9VSXNRMEZCUXpzN096dEJRVWxHTEUxQlFVMHNTVUZCU1N4SFFVRkhMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRPMEZCUTNSRExFMUJRVTBzU1VGQlNTeEhRVUZITEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRCUVVNMVFpeE5RVUZOTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UVVGRE5VSXNUVUZCVFN4WlFVRlpMRWRCUVVjc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eERRVUZETzBGQlF6VkRMRTFCUVUwc1VVRkJVU3hIUVVGSExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXpzN08wRkJSM0JETEUxQlFVMHNaME5CUVdkRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVWQlFVVXNUMEZCVHl4RlFVRkZMRTlCUVU4c1MwRkJTenRKUVVOdVJTeE5RVUZOTEZOQlFWTXNSMEZCUnl4TlFVRk5MRU5CUVVNc2NVSkJRWEZDTEVWQlFVVXNRMEZCUXpzN1NVRkZha1FzVFVGQlRTeERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRk5CUVZNc1EwRkJReXhKUVVGSkxFbEJRVWtzVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4VFFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGRFVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1QwRkJUeXhIUVVGSExGTkJRVk1zUTBGQlF5eEhRVUZITEVsQlFVa3NUVUZCVFN4RFFVRkRMRTFCUVUwc1IwRkJSeXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdPMGxCUlhaRkxFOUJRVThzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1EwRkRha0lzUTBGQlF6czdRVUZGUml4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxPMGxCUTJoRExFMUJRVTBzVFVGQlRTeEhRVUZITEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03T3p0SlFVZHNReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEYUVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzBsQlEycENMRWxCUVVrc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU4yUWl4SlFVRkpMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU03U1VGRE1VSXNTVUZCU1N4WFFVRlhMRWRCUVVjc1NVRkJTU3hEUVVGRE96dEpRVVYyUWl4TlFVRk5MRTlCUVU4c1IwRkJSeXhOUVVGTk8xRkJRMnhDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRXRCUVVzc1NVRkJTU3haUVVGWkxFdEJRVXNzUzBGQlN5eEZRVUZGT3p0WlFVVXhReXhOUVVGTkxHVkJRV1VzUjBGQlJ5eExRVUZMTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSVWtzVlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlVRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzWkhMRWxCUVVrc1kwRkJZeXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzJkQ1FVTjZRaXhqUVVGakxFTkJRVU1zVTBGQlV5eERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMkZCUXpkRExFMUJRVTA3WjBKQlEwZ3NZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF6dGhRVU14UXp0WlFVTkVMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03TzFsQlJXSXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRM1JDT3p0UlFVVkVMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRGRFSXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGbEJRVmtzUjBGQlJ5eE5RVUZOTzFGQlEzWkNMRmRCUVZjc1IwRkJSeXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEU5QlFVOHNSVUZCUlN4TFFVRkxMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGFFVXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eE5RVUZOTzFGQlEzUkNMRTFCUVUwc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdVVUZEYWtNc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dExRVU4wUWl4RFFVRkRPenRKUVVWR0xFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGFFTXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhGUVVGRk96dFpRVVZvUWl4TlFVRk5MRWRCUVVjN1owSkJRMHdzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBPMmRDUVVOb1FpeERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4N1lVRkRia0lzUTBGQlF6czdXVUZGUml4alFVRmpMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNaME5CUVdkRExFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdPMWxCUlRWSExFbEJRVWtzU1VGQlNTeExRVUZMTEdOQlFXTXNSVUZCUlRzN1owSkJSWHBDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2JVSkJRVzFDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2IwSkJRVzlDTEVWQlFVVTdiMEpCUXpORUxFdEJRVXNzUjBGQlJ5eFpRVUZaTEVOQlFVTTdiMEpCUTNKQ0xGbEJRVmtzUlVGQlJTeERRVUZETzJsQ1FVTnNRaXhOUVVGTkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3YjBKQlEyNURMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03YjBKQlEySXNXVUZCV1N4RlFVRkZMRU5CUVVNN2FVSkJRMnhDTEUxQlFVMHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0dlFrRkRjRU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0cFFrRkRhRUk3WVVGRFNqczdVMEZGU2p0TFFVTktMRU5CUVVNN08wbEJSVVlzVFVGQlRTeGxRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRMMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFZ3NTVUZCU1N4UlFVRlJMRXRCUVVzc1MwRkJTeXhGUVVGRk8xbEJRM0JDTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExGVkJRVlVzUTBGQlF6dFRRVU53UXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUdFpRVU5vUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTTdVMEZEYUVNc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRk5CUVZNc1EwRkJRenRUUVVOdVF6dExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZEY0VJc1NVRkJTU3hKUVVGSkxFdEJRVXNzUzBGQlN5eEpRVUZKTEZsQlFWa3NTMEZCU3l4TFFVRkxMRVZCUVVVN096dFpRVWN4UXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdPMWxCUlRsRExFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU5zUXl4TFFVRkxMRWRCUVVjc1VVRkJVU3hEUVVGRE8yZENRVU5xUWl4WFFVRlhMRVZCUVVVc1EwRkJRenM3WjBKQlJXUXNUVUZCVFN4NVFrRkJlVUlzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eExRVUZMTEdOQlFXTXNRMEZCUXl4RFFVRkRPMmRDUVVOdVJpeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZMSGxDUVVGNVFpeERRVUZETEVOQlFVTTdaMEpCUXpsRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdZVUZEYUVZN1UwRkRTaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXpRaXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMmhHTzB0QlEwb3NRMEZCUXpzN1NVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0UlFVTXZRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eGpRVUZqTEVsQlFVa3NVVUZCVVN4TFFVRkxMRXRCUVVzc1JVRkJSVHRaUVVNdlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEY0VNc1RVRkJUU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFpRVVZ3UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSVEZETEUxQlFVMHNXVUZCV1N4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzJkQ1FVTnlReXhIUVVGSExFVkJRVVVzWTBGQll6dG5Ra0ZEYmtJc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTzJkQ1FVTlVMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJUdGhRVU5hTEVOQlFVTXNRMEZCUXpzN1dVRkZTQ3hOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NXVUZCV1N4SFFVRkhMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXpzN1dVRkZMMFFzWTBGQll5eERRVUZETEZkQlFWY3NSMEZCUnl4VFFVRlRMRU5CUVVNN1UwRkRNVU03T3p0UlFVZEVMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGRFSXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenM3TzFGQlIySXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wdEJRM1JDTEVOQlFVTTdPenM3T3pzN08wbEJVVVlzU1VGQlNTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eGpRVUZqTEV0QlFVczdVVUZEZWtNc1QwRkJUeXhEUVVGRExGVkJRVlVzUzBGQlN6dFpRVU51UWl4SlFVRkpMRlZCUVZVc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVN1owSkJRemRETEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFrUXNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1lVRkRla003V1VGRFJDeE5RVUZOTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1ZVRkJWU3hEUVVGRExHTkJRV01zUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE1VVXNRMEZCUXp0TFFVTk1MRU5CUVVNN08wbEJSVVlzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGbEJRVmtzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzSkZMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1owSkJRV2RDTEVOQlFVTXNRMEZCUXpzN1NVRkZka1FzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdFJRVU0zUWl4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNWMEZCVnl4RlFVRkZMR2RDUVVGblFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRVVzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTVRenM3U1VGRlJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzlDUVVGdlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzFDUVVGdFFpeEZRVUZGTzFGQlF6TkVMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1pVRkJaU3hEUVVGRExFTkJRVU03UzBGRGVrUTdPMGxCUlVRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnBGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUlVGQlJTeGxRVUZsTEVOQlFVTXNRMEZCUXp0RFFVTjRSQ3hEUVVGRE96czdPenM3T3p0QlFWRkdMRTFCUVUwc1dVRkJXU3hIUVVGSExHTkJRV01zVjBGQlZ5eERRVUZET3pzN096dEpRVXN6UXl4WFFVRlhMRWRCUVVjN1VVRkRWaXhMUVVGTExFVkJRVVVzUTBGQlF6dFJRVU5TTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhIUVVGSExHTkJRV01zUTBGQlF6dFJRVU53UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJrUXNUVUZCVFN4TlFVRk5MRWRCUVVjc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPenRSUVVVelFpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4alFVRmpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8xRkJRMmhFTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzVlVGQlZTeERRVUZETzFsQlF6ZENMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN6dFpRVU5xUWl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTA3V1VGRGJrSXNUMEZCVHl4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUE8xbEJRM0pDTEZWQlFWVXNSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWVHRUUVVNNVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTktMR2RDUVVGblFpeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096dEpRVVZFTEZkQlFWY3NhMEpCUVd0Q0xFZEJRVWM3VVVGRE5VSXNUMEZCVHp0WlFVTklMR1ZCUVdVN1dVRkRaaXhuUWtGQlowSTdXVUZEYUVJc2IwSkJRVzlDTzFsQlEzQkNMR3RDUVVGclFqdFpRVU5zUWl4blEwRkJaME03V1VGRGFFTXNaME5CUVdkRE8xbEJRMmhETEN0Q1FVRXJRanRaUVVNdlFpeDFRa0ZCZFVJN1UwRkRNVUlzUTBGQlF6dExRVU5NT3p0SlFVVkVMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRVZCUVVVc1VVRkJVU3hGUVVGRk8xRkJReTlETEUxQlFVMHNUVUZCVFN4SFFVRkhMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYWtNc1VVRkJVU3hKUVVGSk8xRkJRMW9zUzBGQlN5eGxRVUZsTEVWQlFVVTdXVUZEYkVJc1RVRkJUU3hMUVVGTExFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJRenRaUVVOc1JpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03V1VGRE1VSXNUVUZCVFN4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETlVNc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5Ra0ZCWjBJc1JVRkJSVHRaUVVOdVFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4cFFrRkJhVUlzUTBGQlF5eFJRVUZSTEVWQlFVVXNWMEZCVnl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxHTkJRV01zUTBGQlF5eERRVUZETzFsQlEzQkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0WlFVTTFRaXhOUVVGTkxFTkJRVU1zV1VGQldTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzYjBKQlFXOUNMRVZCUVVVN1dVRkRka0lzVFVGQlRTeFZRVUZWTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVU1zVVVGQlVTeEZRVUZGTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMWxCUXpWR0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4SFFVRkhMRlZCUVZVc1EwRkJRenRaUVVOd1F5eE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMR3RDUVVGclFpeEZRVUZGTzFsQlEzSkNMRTFCUVUwc1QwRkJUeXhIUVVGSExHbENRVUZwUWl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6dFpRVU4yUml4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUjBGQlJ5eFBRVUZQTEVOQlFVTTdXVUZET1VJc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5RMEZCWjBNc1JVRkJSVHRaUVVOdVF5eE5RVUZOTEdkQ1FVRm5RaXhIUVVGSFNDeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1EwRkJReXhSUVVGUkxFVkJRVVVzVlVGQlZTeERRVUZETEZGQlFWRXNSVUZCUlN4blEwRkJaME1zUlVGQlJTdzRRa0ZCT0VJc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyeEtMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU03V1VGRGRrTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1UwRkJVeXhCUVVWU08xTkJRMEU3TzFGQlJVUXNWMEZCVnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRM0pDT3p0SlFVVkVMR2xDUVVGcFFpeEhRVUZITzFGQlEyaENMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4bFFVRmxMRVZCUVVVc1RVRkJUU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpSQ3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNUVUZCVFN4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czdPMUZCUjJoRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZWtNN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3TzBsQlJVUXNaVUZCWlN4SFFVRkhPMHRCUTJwQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hKUVVGSkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTkxMRlZCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGJFUTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxHMUNRVUZ0UWl4SFFVRkhPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4dFFrRkJiVUlzUTBGQlF6dExRVU14UXpzN096czdPenRKUVU5RUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl3d1FrRkJNRUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNaVUZCWlN4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE8wdEJRek5GT3pzN096czdTVUZOUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZENRVUZuUWl4RlFVRkZMR05CUVdNc1EwRkJReXhEUVVGRE8wdEJRemRGT3pzN096czdTVUZOUkN4SlFVRkpMRlZCUVZVc1IwRkJSenRSUVVOaUxFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHOUNRVUZ2UWl4RlFVRkZMR3RDUVVGclFpeERRVUZETEVOQlFVTTdTMEZEY2tZN096czdPenM3U1VGUFJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR3RDUVVGclFpeEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03UzBGRGFrWTdPenM3T3p0SlFVMUVMRWxCUVVrc2IwSkJRVzlDTEVkQlFVYzdVVUZEZGtJc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owTkJRV2RETEVWQlFVVXNPRUpCUVRoQ0xFTkJRVU1zUTBGQlF6dExRVU4wUnpzN096czdPMGxCVFVRc1NVRkJTU3h0UWtGQmJVSXNSMEZCUnp0UlFVTjBRaXhQUVVGUExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3dyUWtGQkswSXNSVUZCUlN3MlFrRkJOa0lzUTBGQlF5eERRVUZETzB0QlEzQkhPenM3T3pzN1NVRk5SQ3hKUVVGSkxHOUNRVUZ2UWl4SFFVRkhPMUZCUTNaQ0xFOUJRVThzYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZERRVUZuUXl4RlFVRkZMRGhDUVVFNFFpeERRVUZETEVOQlFVTTdTMEZEZEVjN096czdPenM3T3p0SlFWTkVMRWxCUVVrc1dVRkJXU3hIUVVGSE8xRkJRMllzVDBGQlR5d3dRa0ZCTUVJc1EwRkJReXhKUVVGSkxFVkJRVVVzZFVKQlFYVkNMRVZCUVVVc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0TFFVTXpSanM3T3pzN096czdPMGxCVTBRc1NVRkJTU3hYUVVGWExFZEJRVWM3VVVGRFpDeEpRVUZKTEZWQlFWVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRFJDeFZRVUZsTEVOQlFVTXNRMEZCUXp0UlFVTnlSQ3hKUVVGSkxFbEJRVWtzUzBGQlN5eFZRVUZWTEVWQlFVVTdXVUZEY2tJc1ZVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTkJMRlZCUVdVc1EwRkJReXhEUVVGRE8xTkJRMnhFT3p0UlFVVkVMRTlCUVU4c1ZVRkJWU3hEUVVGRE8wdEJRM0pDT3pzN096czdPMGxCVDBRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhEUVVGRE8wdEJRMjVET3pzN096czdPenM3TzBsQlZVUXNVMEZCVXl4RFFVRkRMRTFCUVUwc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlR0UlFVTjBReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVN1dVRkRNMElzVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMU5CUTNSQ08xRkJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNoRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMHRCUTNCQ096czdPenM3T3pzN096czdPenM3T3pzN08wbEJiVUpFTEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRMmhDTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhOUVVGTkxGbEJRVmtzVFVGQlRTeEhRVUZITEUxQlFVMHNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEyNUdPenM3T3pzN08wbEJUMFFzVTBGQlV5eERRVUZETEVkQlFVY3NSVUZCUlR0UlFVTllMRWxCUVVrc1IwRkJSeXhEUVVGRExGVkJRVlVzU1VGQlNTeEhRVUZITEVOQlFVTXNWVUZCVlN4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVNelF5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xTkJRM3BDTzB0QlEwbzdPenM3T3pzN096czdPenM3T3pzN08wbEJhVUpFTEZOQlFWTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRMjVDTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhYUVVGWExFTkJRVU1zVFVGQlRTeFpRVUZaTEZOQlFWTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1NVRkJTU3hUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTnlSenM3T3pzN096dEpRVTlFTEZsQlFWa3NRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRha0lzU1VGQlNTeE5RVUZOTEVOQlFVTXNWVUZCVlN4SlFVRkpMRTFCUVUwc1EwRkJReXhWUVVGVkxFdEJRVXNzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlR0WlFVTTNSQ3hKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZkQlFWY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRUUVVONFF6dExRVU5LT3p0RFFVVktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVOTUxGZEJRVkVzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXpzN1FVTnFiVUp5UkRzN096czdPenM3T3pzN096czdPenM3TzBGQmEwSkJMRUZCUzBFc1RVRkJUU3hEUVVGRExHRkJRV0VzUjBGQlJ5eE5RVUZOTEVOQlFVTXNZVUZCWVN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGVrUXNUMEZCVHl4RlFVRkZMRTlCUVU4N1NVRkRhRUlzVDBGQlR5eEZRVUZGTEZWQlFWVTdTVUZEYmtJc1QwRkJUeXhGUVVGRkxESkNRVUV5UWp0SlFVTndReXhaUVVGWkxFVkJRVVVzV1VGQldUdEpRVU14UWl4TlFVRk5MRVZCUVVVc1RVRkJUVHRKUVVOa0xGTkJRVk1zUlVGQlJTeFRRVUZUTzBsQlEzQkNMR0ZCUVdFc1JVRkJSU3hoUVVGaE8wTkJReTlDTEVOQlFVTXNRMEZCUXlKOSJ9
