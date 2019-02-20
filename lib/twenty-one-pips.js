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
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        dieSize = DEFAULT_DIE_SIZE,
        dispersion = DEFAULT_DISPERSION
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
        if (!Number.isInteger(w) || 0 > w) {
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
        if (!Number.isInteger(h) || 0 > h) {
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
        if (!Number.isInteger(d) || 0 > d) {
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
        if (!Number.isInteger(ds) || 0 >= ds) {
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
            if (die.isHeld()) {
                // Dice that are being held should keep their current coordinates and rotation. In other words,
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
        const sameName = other.name === this.name;
        const sameColor = other.color === this.color;
        return other === this || (sameName && sameColor);
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

        // Todo: validate that TopPlayer is on the same board as Die?
        this.heldBy = heldBy instanceof TopPlayer ? heldBy : document.querySelector(this.getAttribute(HELD_BY_ATTRIBUTE));
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
            this.dispatchEvent(new CustomEvent("top:throw-die", {
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
            this.dispatchEvent(new CustomEvent("top:hold-die", {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcERpZS5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJUb3BEaWNlQm9hcmQuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7REVGQVVMVF9ESUVfU0laRSwgREVGQVVMVF9ESVNQRVJTSU9OLCBERUZBVUxUX1dJRFRILCBERUZBVUxUX0hFSUdIVH0gZnJvbSBcIi4vVG9wRGljZUJvYXJkLmpzXCI7XG5cbmNvbnN0IEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMgPSAzNjA7XG5cbmNvbnN0IHJhbmRvbWl6ZUNlbnRlciA9IChuKSA9PiB7XG4gICAgcmV0dXJuICgwLjUgPD0gTWF0aC5yYW5kb20oKSA/IE1hdGguZmxvb3IgOiBNYXRoLmNlaWwpLmNhbGwoMCwgbik7XG59O1xuXG4vLyBQcml2YXRlIGZpZWxkc1xuY29uc3QgX3dpZHRoID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWlnaHQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3Jvd3MgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpY2UgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpZVNpemUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Rpc3BlcnNpb24gPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0ZSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JpZExheW91dENvbmZpZ3VyYXRpb25cbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcud2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aCBvZiB0aGlzXG4gKiBHcmlkTGF5b3V0IGluIHBpeGVscy47XG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmhlaWdodF0gLSBUaGUgbWluaW1hbCBoZWlnaHQgb2ZcbiAqIHRoaXMgR3JpZExheW91dCBpbiBwaXhlbHMuLlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaXNwZXJzaW9uIC0gVGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBvZiB0aGVcbiAqIGxheW91dCBhIGRpZSBjYW4gYmUgbGF5b3V0LlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaWVTaXplIC0gVGhlIHNpemUgb2YgYSBkaWUuXG4gKi9cblxuLyoqXG4gKiBHcmlkTGF5b3V0IGhhbmRsZXMgbGF5aW5nIG91dCB0aGUgZGljZSBvbiBhIERpY2VCb2FyZC5cbiAqL1xuY29uc3QgR3JpZExheW91dCA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtHcmlkTGF5b3V0Q29uZmlndXJhdGlvbn0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIEdyaWRMYXlvdXRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICAgIHdpZHRoID0gREVGQVVMVF9XSURUSCxcbiAgICAgICAgaGVpZ2h0ID0gREVGQVVMVF9IRUlHSFQsXG4gICAgICAgIGRpZVNpemUgPSBERUZBVUxUX0RJRV9TSVpFLFxuICAgICAgICBkaXNwZXJzaW9uID0gREVGQVVMVF9ESVNQRVJTSU9OXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBbXSk7XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCAxKTtcbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCAwKTtcbiAgICAgICAgX2hlaWdodC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9yb3RhdGUuc2V0KHRoaXMsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgIHRoaXMuZGllU2l6ZSA9IGRpZVNpemU7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIGluIHBpeGVscyB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC5cbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBXaWR0aCA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn0gXG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gX3dpZHRoLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgd2lkdGgodykge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIodykgfHwgMCA+IHcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFdpZHRoIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7d30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCB3KTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFxuICAgICAqIEB0aHJvd3MgQ29uZmlndXJhdGlvbkVycm9yIEhlaWdodCA+PSAwXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBfaGVpZ2h0LmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgaGVpZ2h0KGgpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGgpIHx8IDAgPiBoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBIZWlnaHQgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHtofScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBfaGVpZ2h0LnNldCh0aGlzLCBoKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IG9uIHRoaXMgR3JpZExheW91dC4gVGhpc1xuICAgICAqIG51bWJlciBpcyA+PSAwLiBSZWFkIG9ubHkuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29scyAqIHRoaXMuX3Jvd3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BlcnNpb24gbGV2ZWwgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFRoZSBkaXNwZXJzaW9uIGxldmVsXG4gICAgICogaW5kaWNhdGVzIHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgZGljZSBjYW4gYmUgbGF5b3V0LiBVc2UgMSBmb3IgYVxuICAgICAqIHRpZ2h0IHBhY2tlZCBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIENvbmZpZ3VyYXRpb25FcnJvciBEaXNwZXJzaW9uID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaXNwZXJzaW9uKCkge1xuICAgICAgICByZXR1cm4gX2Rpc3BlcnNpb24uZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaXNwZXJzaW9uKGQpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGQpIHx8IDAgPiBkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBEaXNwZXJzaW9uIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7ZH0nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLnNldCh0aGlzLCBkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgQ29uZmlndXJhdGlvbkVycm9yIERpZVNpemUgPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBfZGllU2l6ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpZVNpemUoZHMpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGRzKSB8fCAwID49IGRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBkaWVTaXplIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAxLCBnb3QgJyR7ZHN9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCBkcyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdldCByb3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBfcm90YXRlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gciA/IHRydWUgOiByO1xuICAgIH1cblxuICAgIHNldCByb3RhdGUocikge1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIHJvd3MsIDAgPCByb3dzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9yb3dzKCkge1xuICAgICAgICByZXR1cm4gX3Jvd3MuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2YgY29sdW1ucywgMCA8IGNvbHVtbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NvbHMoKSB7XG4gICAgICAgIHJldHVybiBfY29scy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNlbnRlciBjZWxsIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNlbnRlciAocm93LCBjb2wpLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9yb3dzIC8gMikgLSAxO1xuICAgICAgICBjb25zdCBjb2wgPSByYW5kb21pemVDZW50ZXIodGhpcy5fY29scyAvIDIpIC0gMTtcblxuICAgICAgICByZXR1cm4ge3JvdywgY29sfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXlvdXQgZGljZSBvbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZVtdfSBkaWNlIC0gVGhlIGRpY2UgdG8gbGF5b3V0IG9uIHRoaXMgTGF5b3V0LlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7Q29uZmlndXJhdGlvbkVycm9yfSBUaGUgbnVtYmVyIG9mXG4gICAgICogZGljZSBzaG91bGQgbm90IGV4Y2VlZCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGlzIExheW91dCBjYW5cbiAgICAgKiBsYXlvdXQuXG4gICAgICovXG4gICAgbGF5b3V0KGRpY2UpIHtcbiAgICAgICAgaWYgKGRpY2UubGVuZ3RoID4gdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBUaGUgbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IGlzICR7dGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlfSwgZ290ICR7ZGljZS5sZW5naHR9IGRpY2UgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlMYXlvdXREaWNlID0gW107XG4gICAgICAgIGNvbnN0IGRpY2VUb0xheW91dCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGlmIChkaWUuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEaWNlIHRoYXQgYXJlIGJlaW5nIGhlbGQgc2hvdWxkIGtlZXAgdGhlaXIgY3VycmVudCBjb29yZGluYXRlcyBhbmQgcm90YXRpb24uIEluIG90aGVyIHdvcmRzLFxuICAgICAgICAgICAgICAgIC8vIHRoZXNlIGRpY2UgYXJlIHNraXBwZWQuXG4gICAgICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWNlVG9MYXlvdXQucHVzaChkaWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5taW4oZGljZS5sZW5ndGggKiB0aGlzLmRpc3BlcnNpb24sIHRoaXMubWF4aW11bU51bWJlck9mRGljZSk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzID0gdGhpcy5fY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2VUb0xheW91dCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhdmFpbGFibGVDZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tQ2VsbCA9IGF2YWlsYWJsZUNlbGxzW3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUNlbGxzLnNwbGljZShyYW5kb21JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGRpZS5jb29yZGluYXRlcyA9IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMocmFuZG9tQ2VsbCk7XG4gICAgICAgICAgICBkaWUucm90YXRpb24gPSB0aGlzLnJvdGF0ZSA/IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMpIDogbnVsbDtcbiAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgcmV0dXJuIGFscmVhZHlMYXlvdXREaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYSBsaXN0IHdpdGggYXZhaWxhYmxlIGNlbGxzIHRvIHBsYWNlIGRpY2Ugb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4IC0gVGhlIG51bWJlciBlbXB0eSBjZWxscyB0byBjb21wdXRlLlxuICAgICAqIEBwYXJhbSB7VG9wRGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IHdpdGggZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGNlbGxzIHJlcHJlc2VudGVkIGJ5IHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBsZXZlbCA9IDA7XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gTWF0aC5taW4odGhpcy5fcm93cywgdGhpcy5fY29scyk7XG5cbiAgICAgICAgd2hpbGUgKGF2YWlsYWJsZS5zaXplIDwgbWF4ICYmIGxldmVsIDwgbWF4TGV2ZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsc09uTGV2ZWwobGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCAhPT0gY2VsbCAmJiB0aGlzLl9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlLmFkZChjZWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldmVsKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhdmFpbGFibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSBhbGwgY2VsbHMgb24gbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSBUaGUgbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuIDBcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGNlbnRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NldDxOdW1iZXI+fSB0aGUgY2VsbHMgb24gdGhlIGxldmVsIGluIHRoaXMgbGF5b3V0IHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxzT25MZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zdCBjZWxscyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5fY2VudGVyO1xuXG4gICAgICAgIGlmICgwID09PSBsZXZlbCkge1xuICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcihjZW50ZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IGNlbnRlci5yb3cgLSBsZXZlbDsgcm93IDw9IGNlbnRlci5yb3cgKyBsZXZlbDsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCAtIGxldmVsfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sICsgbGV2ZWx9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IGNlbnRlci5jb2wgLSBsZXZlbCArIDE7IGNvbCA8IGNlbnRlci5jb2wgKyBsZXZlbDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgLSBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyArIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyBjZWxsIGNvbnRhaW4gYSBjZWxsIGZyb20gYWxyZWFkeUxheW91dERpY2U/XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY2VsbCAtIEEgY2VsbCBpbiBsYXlvdXQgcmVwcmVzZW50ZWQgYnkgYSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtUb3BEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgb2YgZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgY2VsbCBkb2VzIG5vdCBjb250YWluIGEgZGllLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IGFscmVhZHlMYXlvdXREaWNlLmZpbmQoZGllID0+IGNlbGwgPT09IHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIG51bWJlciB0byBhIGNlbGwgKHJvdywgY29sKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm4gdGhlIGNlbGwgKHtyb3csIGNvbH0pIGNvcnJlc3BvbmRpbmcgbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0NlbGwobikge1xuICAgICAgICByZXR1cm4ge3JvdzogTWF0aC50cnVuYyhuIC8gdGhpcy5fY29scyksIGNvbDogbiAlIHRoaXMuX2NvbHN9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHRvIGEgbnVtYmVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gaXRzIG51bWJlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwuXG4gICAgICogUmV0dXJucyB1bmRlZmluZWQgd2hlbiB0aGUgY2VsbCBpcyBub3Qgb24gdGhlIGxheW91dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb051bWJlcih7cm93LCBjb2x9KSB7XG4gICAgICAgIGlmICgwIDw9IHJvdyAmJiByb3cgPCB0aGlzLl9yb3dzICYmIDAgPD0gY29sICYmIGNvbCA8IHRoaXMuX2NvbHMpIHtcbiAgICAgICAgICAgIHJldHVybiByb3cgKiB0aGlzLl9jb2xzICsgY29sO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgcmVwcmVzZW50ZWQgYnkgaXRzIG51bWJlciB0byB0aGVpciBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb29yZGluYXRlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsIHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhpcyBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9Db29yZGluYXRlcyhuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jZWxsVG9Db29yZHModGhpcy5fbnVtYmVyVG9DZWxsKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgcGFpciBvZiBjb29yZGluYXRlcyB0byBhIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydFxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvb3JkaW5hdGVzIGNvbnZlcnRlZCB0byBhIG51bWJlci4gSWZcbiAgICAgKiB0aGUgY29vcmRpbmF0ZXMgYXJlIG5vdCBvbiB0aGlzIGxheW91dCwgdGhlIG51bWJlciBpcyB1bmRlZmluZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRpbmF0ZXNUb051bWJlcihjb29yZHMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuX2NlbGxUb051bWJlcih0aGlzLl9jb29yZHNUb0NlbGwoY29vcmRzKSk7XG4gICAgICAgIGlmICgwIDw9IG4gJiYgbiA8IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbmFwICh4LHkpIHRvIHRoZSBjbG9zZXN0IGNlbGwgaW4gdGhpcyBMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGllY29vcmRpbmF0ZSAtIFRoZSBjb29yZGluYXRlIHRvIGZpbmQgdGhlIGNsb3Nlc3QgY2VsbFxuICAgICAqIGZvci5cbiAgICAgKiBAcGFyYW0ge1RvcERpZX0gW2RpZWNvb3JkaW5hdC5kaWUgPSBudWxsXSAtIFRoZSBkaWUgdG8gc25hcCB0by5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS54IC0gVGhlIHgtY29vcmRpbmF0ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS55IC0gVGhlIHktY29vcmRpbmF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudWxsfSBUaGUgY29vcmRpbmF0ZSBvZiB0aGUgY2VsbCBjbG9zZXN0IHRvICh4LCB5KS5cbiAgICAgKiBOdWxsIHdoZW4gbm8gc3VpdGFibGUgY2VsbCBpcyBuZWFyICh4LCB5KVxuICAgICAqL1xuICAgIHNuYXBUbyh7ZGllID0gbnVsbCwgeCwgeX0pIHtcbiAgICAgICAgY29uc3QgY29ybmVyQ2VsbCA9IHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvcm5lciA9IHRoaXMuX2NlbGxUb0Nvb3Jkcyhjb3JuZXJDZWxsKTtcbiAgICAgICAgY29uc3Qgd2lkdGhJbiA9IGNvcm5lci54ICsgdGhpcy5kaWVTaXplIC0geDtcbiAgICAgICAgY29uc3Qgd2lkdGhPdXQgPSB0aGlzLmRpZVNpemUgLSB3aWR0aEluO1xuICAgICAgICBjb25zdCBoZWlnaHRJbiA9IGNvcm5lci55ICsgdGhpcy5kaWVTaXplIC0geTtcbiAgICAgICAgY29uc3QgaGVpZ2h0T3V0ID0gdGhpcy5kaWVTaXplIC0gaGVpZ2h0SW47XG5cbiAgICAgICAgY29uc3QgcXVhZHJhbnRzID0gW3tcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcihjb3JuZXJDZWxsKSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93LFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodE91dFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodE91dFxuICAgICAgICB9XTtcblxuICAgICAgICBjb25zdCBzbmFwVG8gPSBxdWFkcmFudHNcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG9uIHRoZSBsYXlvdXRcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiB1bmRlZmluZWQgIT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBub3QgYWxyZWFkeSB0YWtlbiBleGNlcHQgYnkgaXRzZWxmXG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gKFxuICAgICAgICAgICAgICAgIG51bGwgIT09IGRpZSAmJiB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykgPT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5fY2VsbElzRW1wdHkocXVhZHJhbnQucSwgX2RpY2UuZ2V0KHRoaXMpKSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIGNvdmVyZWQgYnkgdGhlIGRpZSB0aGUgbW9zdFxuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAobWF4USwgcXVhZHJhbnQpID0+IHF1YWRyYW50LmNvdmVyYWdlID4gbWF4US5jb3ZlcmFnZSA/IHF1YWRyYW50IDogbWF4USxcbiAgICAgICAgICAgICAgICB7cTogdW5kZWZpbmVkLCBjb3ZlcmFnZTogLTF9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IHNuYXBUby5xID8gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhzbmFwVG8ucSkgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGllIGF0IHBvaW50ICh4LCB5KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50IC0gVGhlIHBvaW50IGluICh4LCB5KSBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge1RvcERpZXxudWxsfSBUaGUgZGllIHVuZGVyIGNvb3JkaW5hdGVzICh4LCB5KSBvciBudWxsIGlmIG5vIGRpZVxuICAgICAqIGlzIGF0IHRoZSBwb2ludC5cbiAgICAgKi9cbiAgICBnZXRBdChwb2ludCA9IHt4OiAwLCB5OiAwfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBfZGljZS5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3QgeEZpdCA9IHggPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHggKyB0aGlzLmRpZVNpemU7XG4gICAgICAgICAgICBjb25zdCB5Rml0ID0geSA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0geSArIHRoaXMuZGllU2l6ZTtcblxuICAgICAgICAgICAgaWYgKHhGaXQgJiYgeUZpdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGdyaWQgc2l6ZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGhcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gVGhlIG1pbmltYWwgaGVpZ2h0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVHcmlkKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgX2NvbHMuc2V0KHRoaXMsIE1hdGguZmxvb3Iod2lkdGggLyB0aGlzLmRpZVNpemUpKTtcbiAgICAgICAgX3Jvd3Muc2V0KHRoaXMsIE1hdGguZmxvb3IoaGVpZ2h0IC8gdGhpcy5kaWVTaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIChyb3csIGNvbCkgY2VsbCB0byAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb0Nvb3Jkcyh7cm93LCBjb2x9KSB7XG4gICAgICAgIHJldHVybiB7eDogY29sICogdGhpcy5kaWVTaXplLCB5OiByb3cgKiB0aGlzLmRpZVNpemV9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgKHgsIHkpIGNvb3JkaW5hdGVzIHRvIGEgKHJvdywgY29sKSBjZWxsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkaW5hdGVzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnQgdG8gYSBjZWxsLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY2VsbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3Jkc1RvQ2VsbCh7eCwgeX0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7R3JpZExheW91dH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGUgbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cblxuLypcbiAqIENvbnZlcnQgYW4gSFRNTCBhdHRyaWJ1dGUgdG8gYW4gaW5zdGFuY2UncyBwcm9wZXJ0eS4gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSdzIG5hbWUuIEZvciBleGFtcGxlLCBcIm15LWF0dHJcIlxuICogd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJteUF0dHJcIiwgYW5kIFwiZGlzYWJsZWRcIiB0byBcImRpc2FibGVkXCIuXG4gKi9cbmNvbnN0IGF0dHJpYnV0ZTJwcm9wZXJ0eSA9IChuYW1lKSA9PiB7XG4gICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybiBmaXJzdCArIHJlc3QubWFwKHdvcmQgPT4gd29yZC5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKSkuam9pbigpO1xufTtcblxuLyoqXG4gKiBNaXhpbiB7QGxpbmsgUmVhZE9ubHlBdHRyaWJ1dGVzfSB0byBhIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7Kn0gU3VwIC0gVGhlIGNsYXNzIHRvIG1peCBpbnRvLlxuICogQHJldHVybiB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIFJlYWRPbmx5QXR0cmlidXRlc1xuICAgICAqL1xuICAgIGNsYXNzIGV4dGVuZHMgU3VwIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdGhhdCBpcyBleGVjdXRlZCB3aGVuIGFuIG9ic2VydmVkIGF0dHJpYnV0ZSdzIHZhbHVlIGlzXG4gICAgICAgICAqIGNoYW5nZWQuIElmIHRoZSBIVE1MRWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIERPTSwgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiB2YWx1ZSBjYW4gb25seSBiZSBzZXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgSFRNTEVsZW1lbnQncyBwcm9wZXJ0eS5cbiAgICAgICAgICogSW4gZWZmZWN0LCB0aGlzIG1ha2VzIHRoaXMgSFRNTEVsZW1lbnQncyBhdHRyaWJ1dGVzIHJlYWQtb25seS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIGFuIEhUTUxFbGVtZW50IGhhcyBhbiBhdHRyaWJ1dGUgXCJ4XCIgYW5kXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgXCJ4XCIsIHRoZW4gY2hhbmdpbmcgdGhlIHZhbHVlIFwieFwiIHRvIFwiNVwiXG4gICAgICAgICAqIHdpbGwgb25seSB3b3JrIHdoZW4gYHRoaXMueCA9PT0gNWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBvbGQgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgICAgICAqL1xuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBBbGwgYXR0cmlidXRlcyBhcmUgbWFkZSByZWFkLW9ubHkgdG8gcHJldmVudCBjaGVhdGluZyBieSBjaGFuZ2luZ1xuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuIE9mIGNvdXJzZSwgdGhpcyBpcyBieSBub1xuICAgICAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdXNlcnMgd2lsbCBub3QgY2hlYXQgaW4gYSBkaWZmZXJlbnQgd2F5LlxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBhdHRyaWJ1dGUycHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQgJiYgbmV3VmFsdWUgIT09IGAke3RoaXNbcHJvcGVydHldfWApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB0aGlzW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQge1xuICAgIFJlYWRPbmx5QXR0cmlidXRlc1xufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgVmFsaWRhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0aW9uRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgX3ZhbHVlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kZWZhdWx0VmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Vycm9ycyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IFR5cGVWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Ioe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9ycyA9IFtdfSkge1xuICAgICAgICBfdmFsdWUuc2V0KHRoaXMsIHZhbHVlKTtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgX2Vycm9ycy5zZXQodGhpcywgZXJyb3JzKTtcbiAgICB9XG5cbiAgICBnZXQgb3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gX3ZhbHVlLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLm9yaWdpbiA6IF9kZWZhdWx0VmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBlcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiBfZXJyb3JzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgaXNWYWxpZCgpIHtcbiAgICAgICAgcmV0dXJuIDAgPj0gdGhpcy5lcnJvcnMubGVuZ3RoO1xuICAgIH1cblxuICAgIGRlZmF1bHRUbyhuZXdEZWZhdWx0KSB7XG4gICAgICAgIF9kZWZhdWx0VmFsdWUuc2V0KHRoaXMsIG5ld0RlZmF1bHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfY2hlY2soe3ByZWRpY2F0ZSwgYmluZFZhcmlhYmxlcyA9IFtdLCBFcnJvclR5cGUgPSBWYWxpZGF0aW9uRXJyb3J9KSB7XG4gICAgICAgIGNvbnN0IHByb3Bvc2l0aW9uID0gcHJlZGljYXRlLmFwcGx5KHRoaXMsIGJpbmRWYXJpYWJsZXMpO1xuICAgICAgICBpZiAoIXByb3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvclR5cGUodGhpcy52YWx1ZSwgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUud2FybihlcnJvci50b1N0cmluZygpKTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IFBhcnNlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBQYXJzZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IEludmFsaWRUeXBlRXJyb3IgPSBjbGFzcyBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnZhbGlkVHlwZUVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSBcIi4vZXJyb3IvUGFyc2VFcnJvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IElOVEVHRVJfREVGQVVMVF9WQUxVRSA9IDA7XG5jb25zdCBJbnRlZ2VyVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gSU5URUdFUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGlucHV0KSkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZhbHVlID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VkVmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGxhcmdlclRoYW4obikge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobikgPT4gdGhpcy5vcmlnaW4gPj0gbixcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzbWFsbGVyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA8PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGJldHdlZW4obiwgbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobiwgbSkgPT4gdGhpcy5sYXJnZXJUaGFuKG4pICYmIHRoaXMuc21hbGxlclRoYW4obSksXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbiwgbV1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBJbnRlZ2VyVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgU1RSSU5HX0RFRkFVTFRfVkFMVUUgPSBcIlwiO1xuY29uc3QgU3RyaW5nVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IFNUUklOR19ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBub3RFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gXCJcIiAhPT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBTdHJpbmdUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbi8vaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQ09MT1JfREVGQVVMVF9WQUxVRSA9IFwiYmxhY2tcIjtcbmNvbnN0IENvbG9yVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gQ09MT1JfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBDb2xvclR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgQk9PTEVBTl9ERUZBVUxUX1ZBTFVFID0gZmFsc2U7XG5jb25zdCBCb29sZWFuVHlwZVZhbGlkYXRvciA9IGNsYXNzIGV4dGVuZHMgVHlwZVZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gQk9PTEVBTl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoL3RydWUvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL2ZhbHNlL2kudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgUGFyc2VFcnJvcihpbnB1dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBpc1RydWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IHRydWUgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlzRmFsc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IGZhbHNlID09PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEJvb2xlYW5UeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0ludGVnZXJUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9JbnRlZ2VyVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtTdHJpbmdUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0NvbG9yVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vQ29sb3JUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge0Jvb2xlYW5UeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Cb29sZWFuVHlwZVZhbGlkYXRvci5qc1wiO1xuXG5jb25zdCBWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgfVxuXG4gICAgYm9vbGVhbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEJvb2xlYW5UeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBjb2xvcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG4gICAgaW50ZWdlcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXJUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBzdHJpbmcoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbn07XG5cbmNvbnN0IFZhbGlkYXRvclNpbmdsZXRvbiA9IG5ldyBWYWxpZGF0b3IoKTtcblxuZXhwb3J0IHtcbiAgICBWYWxpZGF0b3JTaW5nbGV0b24gYXMgdmFsaWRhdGVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCwgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuY29uc3QgVEFHX05BTUUgPSBcInRvcC1wbGF5ZXJcIjtcblxuLy8gVGhlIG5hbWVzIG9mIHRoZSAob2JzZXJ2ZWQpIGF0dHJpYnV0ZXMgb2YgdGhlIFRvcFBsYXllci5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IE5BTUVfQVRUUklCVVRFID0gXCJuYW1lXCI7XG5jb25zdCBTQ09SRV9BVFRSSUJVVEUgPSBcInNjb3JlXCI7XG5jb25zdCBIQVNfVFVSTl9BVFRSSUJVVEUgPSBcImhhcy10dXJuXCI7XG5cbi8vIFRoZSBwcml2YXRlIHByb3BlcnRpZXMgb2YgdGhlIFRvcFBsYXllciBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXIgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBuYW1lIGF0dHJpYnV0ZSBhcmUgdHJlYXRlZCBhc1xuICogdGhlIHNhbWUgcGxheWVyLlxuICpcbiAqIEluIGdlbmVyYWwgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCBubyB0d28gcGxheWVycyBkbyBoYXZlIHRoZSBzYW1lIGNvbG9yLFxuICogYWx0aG91Z2ggaXQgaXMgbm90IHVuY29uY2VpdmFibGUgdGhhdCBjZXJ0YWluIGRpY2UgZ2FtZXMgaGF2ZSBwbGF5ZXJzIHdvcmtcbiAqIGluIHRlYW1zIHdoZXJlIGl0IHdvdWxkIG1ha2Ugc2Vuc2UgZm9yIHR3byBvciBtb3JlIGRpZmZlcmVudCBwbGF5ZXJzIHRvXG4gKiBoYXZlIHRoZSBzYW1lIGNvbG9yLlxuICpcbiAqIFRoZSBuYW1lIGFuZCBjb2xvciBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZC4gVGhlIHNjb3JlIGFuZCBoYXMtdHVyblxuICogYXR0cmlidXRlcyBhcmUgbm90LlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cbmNvbnN0IFRvcFBsYXllciA9IGNsYXNzIGV4dGVuZHMgUmVhZE9ubHlBdHRyaWJ1dGVzKEhUTUxFbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVyLCBvcHRpb25hbGx5IGJhc2VkIG9uIGFuIGludGl0aWFsXG4gICAgICogY29uZmlndXJhdGlvbiB2aWEgYW4gb2JqZWN0IHBhcmFtZXRlciBvciBkZWNsYXJlZCBhdHRyaWJ1dGVzIGluIEhUTUwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZ10gLSBBbiBpbml0aWFsIGNvbmZpZ3VyYXRpb24gZm9yIHRoZVxuICAgICAqIHBsYXllciB0byBjcmVhdGUuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5jb2xvciAtIFRoaXMgcGxheWVyJ3MgY29sb3IgdXNlZCBpbiB0aGUgZ2FtZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLm5hbWUgLSBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcuc2NvcmVdIC0gVGhpcyBwbGF5ZXIncyBzY29yZS5cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtjb25maWcuaGFzVHVybl0gLSBUaGlzIHBsYXllciBoYXMgYSB0dXJuLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtjb2xvciwgbmFtZSwgc2NvcmUsIGhhc1R1cm59ID0ge30pIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBjb25zdCBjb2xvclZhbHVlID0gdmFsaWRhdGUuY29sb3IoY29sb3IgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKSk7XG4gICAgICAgIGlmIChjb2xvclZhbHVlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgY29sb3JWYWx1ZS52YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUsIHRoaXMuY29sb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihcIkEgUGxheWVyIG5lZWRzIGEgY29sb3IsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5hbWVWYWx1ZSA9IHZhbGlkYXRlLnN0cmluZyhuYW1lIHx8IHRoaXMuZ2V0QXR0cmlidXRlKE5BTUVfQVRUUklCVVRFKSk7XG4gICAgICAgIGlmIChuYW1lVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX25hbWUuc2V0KHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUsIHRoaXMubmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBuYW1lLCB3aGljaCBpcyBhIFN0cmluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY29yZVZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihzY29yZSB8fCB0aGlzLmdldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKHNjb3JlVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX3Njb3JlLnNldCh0aGlzLCBzY29yZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIHRoaXMuc2NvcmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT2theS4gQSBwbGF5ZXIgZG9lcyBub3QgbmVlZCB0byBoYXZlIGEgc2NvcmUuXG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIG51bGwpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoU0NPUkVfQVRUUklCVVRFKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc1R1cm5WYWx1ZSA9IHZhbGlkYXRlLmJvb2xlYW4oaGFzVHVybiB8fCB0aGlzLmdldEF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmlzVHJ1ZSgpO1xuICAgICAgICBpZiAoaGFzVHVyblZhbHVlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBoYXNUdXJuKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgaGFzVHVybik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LCBBIHBsYXllciBkb2VzIG5vdCBhbHdheXMgaGF2ZSBhIHR1cm4uXG4gICAgICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBOQU1FX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFNDT1JFX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhBU19UVVJOX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3MgY29sb3IuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuIF9jb2xvci5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBuYW1lLlxuICAgICAqXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIF9uYW1lLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgc2NvcmUoKSB7XG4gICAgICAgIHJldHVybiBudWxsID09PSBfc2NvcmUuZ2V0KHRoaXMpID8gMCA6IF9zY29yZS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCBzY29yZShuZXdTY29yZSkge1xuICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIG5ld1Njb3JlKTtcbiAgICAgICAgaWYgKG51bGwgPT09IG5ld1Njb3JlKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoU0NPUkVfQVRUUklCVVRFLCBuZXdTY29yZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7VG9wUGxheWVyfSBUaGUgcGxheWVyIHdpdGggYSB0dXJuXG4gICAgICovXG4gICAgc3RhcnRUdXJuKCkge1xuICAgICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnN0YXJ0LXR1cm5cIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUsIHRydWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmQgYSB0dXJuIGZvciB0aGlzIHBsYXllci5cbiAgICAgKi9cbiAgICBlbmRUdXJuKCkge1xuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyB0aGlzIHBsYXllciBoYXZlIGEgdHVybj9cbiAgICAgKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBoYXNUdXJuKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZSA9PT0gX2hhc1R1cm4uZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgcGxheWVyLCBoaXMgb3IgaGVycyBuYW1lLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgcGxheWVyJ3MgbmFtZSByZXByZXNlbnRzIHRoZSBwbGF5ZXIgYXMgYSBzdHJpbmcuXG4gICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIHBsYXllciBlcXVhbCBhbm90aGVyIHBsYXllcj9cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gb3RoZXIgLSBUaGUgb3RoZXIgcGxheWVyIHRvIGNvbXBhcmUgdGhpcyBwbGF5ZXIgd2l0aC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIHdoZW4gZWl0aGVyIHRoZSBvYmplY3QgcmVmZXJlbmNlcyBhcmUgdGhlIHNhbWVcbiAgICAgKiBvciB3aGVuIGJvdGggbmFtZSBhbmQgY29sb3IgYXJlIHRoZSBzYW1lLlxuICAgICAqL1xuICAgIGVxdWFscyhvdGhlcikge1xuICAgICAgICBjb25zdCBzYW1lTmFtZSA9IG90aGVyLm5hbWUgPT09IHRoaXMubmFtZTtcbiAgICAgICAgY29uc3Qgc2FtZUNvbG9yID0gb3RoZXIuY29sb3IgPT09IHRoaXMuY29sb3I7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCAoc2FtZU5hbWUgJiYgc2FtZUNvbG9yKTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFRBR19OQU1FLCBUb3BQbGF5ZXIpO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN5c3RlbSBwbGF5ZXIuIERpY2UgYXJlIHRocm93biBieSBhIHBsYXllci4gRm9yIHNpdHVhdGlvbnNcbiAqIHdoZXJlIHlvdSB3YW50IHRvIHJlbmRlciBhIGJ1bmNoIG9mIGRpY2Ugd2l0aG91dCBuZWVkaW5nIHRoZSBjb25jZXB0IG9mIFBsYXllcnNcbiAqIHRoaXMgREVGQVVMVF9TWVNURU1fUExBWUVSIGNhbiBiZSBhIHN1YnN0aXR1dGUuIE9mIGNvdXJzZSwgaWYgeW91J2QgbGlrZSB0b1xuICogY2hhbmdlIHRoZSBuYW1lIGFuZC9vciB0aGUgY29sb3IsIGNyZWF0ZSBhbmQgdXNlIHlvdXIgb3duIFwic3lzdGVtIHBsYXllclwiLlxuICogQGNvbnN0XG4gKi9cbmNvbnN0IERFRkFVTFRfU1lTVEVNX1BMQVlFUiA9IG5ldyBUb3BQbGF5ZXIoe2NvbG9yOiBcInJlZFwiLCBuYW1lOiBcIipcIn0pO1xuXG5leHBvcnQge1xuICAgIFRvcFBsYXllcixcbiAgICBERUZBVUxUX1NZU1RFTV9QTEFZRVIsXG4gICAgVEFHX05BTUUsXG4gICAgSEFTX1RVUk5fQVRUUklCVVRFXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuLy9pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJ9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLWRpZVwiO1xuXG5jb25zdCBDSVJDTEVfREVHUkVFUyA9IDM2MDsgLy8gZGVncmVlc1xuY29uc3QgTlVNQkVSX09GX1BJUFMgPSA2OyAvLyBEZWZhdWx0IC8gcmVndWxhciBzaXggc2lkZWQgZGllIGhhcyA2IHBpcHMgbWF4aW11bS5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBcIkl2b3J5XCI7XG5jb25zdCBERUZBVUxUX1ggPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ZID0gMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfUk9UQVRJT04gPSAwOyAvLyBkZWdyZWVzXG5jb25zdCBERUZBVUxUX09QQUNJVFkgPSAwLjU7XG5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IEhFTERfQllfQVRUUklCVVRFID0gXCJoZWxkLWJ5XCI7XG5jb25zdCBQSVBTX0FUVFJJQlVURSA9IFwicGlwc1wiO1xuY29uc3QgUk9UQVRJT05fQVRUUklCVVRFID0gXCJyb3RhdGlvblwiO1xuY29uc3QgWF9BVFRSSUJVVEUgPSBcInhcIjtcbmNvbnN0IFlfQVRUUklCVVRFID0gXCJ5XCI7XG5cbmNvbnN0IEJBU0VfRElFX1NJWkUgPSAxMDA7IC8vIHB4XG5jb25zdCBCQVNFX1JPVU5ERURfQ09STkVSX1JBRElVUyA9IDE1OyAvLyBweFxuY29uc3QgQkFTRV9TVFJPS0VfV0lEVEggPSAyLjU7IC8vIHB4XG5jb25zdCBNSU5fU1RST0tFX1dJRFRIID0gMTsgLy8gcHhcbmNvbnN0IEhBTEYgPSBCQVNFX0RJRV9TSVpFIC8gMjsgLy8gcHhcbmNvbnN0IFRISVJEID0gQkFTRV9ESUVfU0laRSAvIDM7IC8vIHB4XG5jb25zdCBQSVBfU0laRSA9IEJBU0VfRElFX1NJWkUgLyAxNTsgLy9weFxuY29uc3QgUElQX0NPTE9SID0gXCJibGFja1wiO1xuXG5jb25zdCBkZWcycmFkID0gKGRlZykgPT4ge1xuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XG59O1xuXG5jb25zdCBpc1BpcE51bWJlciA9IG4gPT4ge1xuICAgIGNvbnN0IG51bWJlciA9IHBhcnNlSW50KG4sIDEwKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihudW1iZXIpICYmIDEgPD0gbnVtYmVyICYmIG51bWJlciA8PSBOVU1CRVJfT0ZfUElQUztcbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIG9mIHBpcHMgYmV0d2VlbiAxIGFuZCB0aGUgTlVNQkVSX09GX1BJUFMuXG4gKlxuICogQHJldHVybnMge051bWJlcn0gQSByYW5kb20gbnVtYmVyIG4sIDEg4omkIG4g4omkIE5VTUJFUl9PRl9QSVBTLlxuICovXG5jb25zdCByYW5kb21QaXBzID0gKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTlVNQkVSX09GX1BJUFMpICsgMTtcblxuY29uc3QgRElFX1VOSUNPREVfQ0hBUkFDVEVSUyA9IFtcIuKagFwiLFwi4pqBXCIsXCLimoJcIixcIuKag1wiLFwi4pqEXCIsXCLimoVcIl07XG5cbi8qKlxuICogQ29udmVydCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZSBmYWNlIHRvIHRoZSBudW1iZXIgb2YgcGlwcyBvZlxuICogdGhhdCBzYW1lIGRpZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZSBvZiBwaXBzVG9Vbmljb2RlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1IC0gVGhlIHVuaWNvZGUgY2hhcmFjdGVyIHRvIGNvbnZlcnQgdG8gcGlwcy5cbiAqIEByZXR1cm5zIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgY29ycmVzcG9uZGluZyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiwgb3JcbiAqIHVuZGVmaW5lZCBpZiB1IHdhcyBub3QgYSB1bmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRpbmcgYSBkaWUuXG4gKi9cbmNvbnN0IHVuaWNvZGVUb1BpcHMgPSAodSkgPT4ge1xuICAgIGNvbnN0IGRpZUNoYXJJbmRleCA9IERJRV9VTklDT0RFX0NIQVJBQ1RFUlMuaW5kZXhPZih1KTtcbiAgICByZXR1cm4gMCA8PSBkaWVDaGFySW5kZXggPyBkaWVDaGFySW5kZXggKyAxIDogdW5kZWZpbmVkO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYgdG8gYSB1bmljb2RlIGNoYXJhY3RlclxuICogcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvcnJlc3BvbmRpbmcgZGllIGZhY2UuIFRoaXMgZnVuY3Rpb24gaXMgdGhlIHJldmVyc2VcbiAqIG9mIHVuaWNvZGVUb1BpcHMuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHAgLSBUaGUgbnVtYmVyIG9mIHBpcHMgdG8gY29udmVydCB0byBhIHVuaWNvZGUgY2hhcmFjdGVyLlxuICogQHJldHVybnMge1N0cmluZ3x1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIHVuaWNvZGUgY2hhcmFjdGVycyBvclxuICogdW5kZWZpbmVkIGlmIHAgd2FzIG5vdCBiZXR3ZWVuIDEgYW5kIDYgaW5jbHVzaXZlLlxuICovXG5jb25zdCBwaXBzVG9Vbmljb2RlID0gcCA9PiBpc1BpcE51bWJlcihwKSA/IERJRV9VTklDT0RFX0NIQVJBQ1RFUlNbcCAtIDFdIDogdW5kZWZpbmVkO1xuXG5jb25zdCByZW5kZXJIb2xkID0gKGNvbnRleHQsIHgsIHksIHdpZHRoLCBjb2xvcikgPT4ge1xuICAgIGNvbnN0IFNFUEVSQVRPUiA9IHdpZHRoIC8gMzA7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IERFRkFVTFRfT1BBQ0lUWTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY29udGV4dC5hcmMoeCArIHdpZHRoLCB5ICsgd2lkdGgsIHdpZHRoIC0gU0VQRVJBVE9SLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuY29uc3QgcmVuZGVyRGllID0gKGNvbnRleHQsIHgsIHksIHdpZHRoLCBjb2xvcikgPT4ge1xuICAgIGNvbnN0IFNDQUxFID0gKHdpZHRoIC8gSEFMRik7XG4gICAgY29uc3QgSEFMRl9JTk5FUl9TSVpFID0gTWF0aC5zcXJ0KHdpZHRoICoqIDIgLyAyKTtcbiAgICBjb25zdCBJTk5FUl9TSVpFID0gMiAqIEhBTEZfSU5ORVJfU0laRTtcbiAgICBjb25zdCBST1VOREVEX0NPUk5FUl9SQURJVVMgPSBCQVNFX1JPVU5ERURfQ09STkVSX1JBRElVUyAqIFNDQUxFO1xuICAgIGNvbnN0IElOTkVSX1NJWkVfUk9VTkRFRCA9IElOTkVSX1NJWkUgLSAyICogUk9VTkRFRF9DT1JORVJfUkFESVVTO1xuICAgIGNvbnN0IFNUUk9LRV9XSURUSCA9IE1hdGgubWF4KE1JTl9TVFJPS0VfV0lEVEgsIEJBU0VfU1RST0tFX1dJRFRIICogU0NBTEUpO1xuXG4gICAgY29uc3Qgc3RhcnRYID0geCArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFICsgUk9VTkRFRF9DT1JORVJfUkFESVVTO1xuICAgIGNvbnN0IHN0YXJ0WSA9IHkgKyB3aWR0aCAtIEhBTEZfSU5ORVJfU0laRTtcblxuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xuICAgIGNvbnRleHQubGluZVdpZHRoID0gU1RST0tFX1dJRFRIO1xuICAgIGNvbnRleHQubW92ZVRvKHN0YXJ0WCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgyNzApLCBkZWcycmFkKDApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgwKSwgZGVnMnJhZCg5MCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCwgc3RhcnRZICsgSU5ORVJfU0laRSk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCg5MCksIGRlZzJyYWQoMTgwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYIC0gUk9VTkRFRF9DT1JORVJfUkFESVVTLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMTgwKSwgZGVnMnJhZCgyNzApKTtcblxuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJQaXAgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgpID0+IHtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gUElQX0NPTE9SO1xuICAgIGNvbnRleHQubW92ZVRvKHgsIHkpO1xuICAgIGNvbnRleHQuYXJjKHgsIHksIHdpZHRoLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbmNvbnN0IF9ib2FyZCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29sb3IgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlbGRCeSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcGlwcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRpb24gPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3ggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3kgPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIFRvcERpZSBpcyB0aGUgXCJ0b3AtZGllXCIgY3VzdG9tIFtIVE1MXG4gKiBlbGVtZW50XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQpIHJlcHJlc2VudGluZyBhIGRpZVxuICogb24gdGhlIGRpY2UgYm9hcmQuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBSZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZyA9IHt9XSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcnxudWxsfSBbY29uZmlnLnBpcHNdIC0gVGhlIHBpcHMgb2YgdGhlIGRpZSB0byBhZGQuXG4gICAgICogSWYgbm8gcGlwcyBhcmUgc3BlY2lmaWVkIG9yIHRoZSBwaXBzIGFyZSBub3QgYmV0d2VlbiAxIGFuZCA2LCBhIHJhbmRvbVxuICAgICAqIG51bWJlciBiZXR3ZWVuIDEgYW5kIDYgaXMgZ2VuZXJhdGVkIGluc3RlYWQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFtjb25maWcuY29sb3JdIC0gVGhlIGNvbG9yIG9mIHRoZSBkaWUgdG8gYWRkLiBEZWZhdWx0XG4gICAgICogdG8gdGhlIGRlZmF1bHQgY29sb3IuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueF0gLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueV0gLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcucm90YXRpb25dIC0gVGhlIHJvdGF0aW9uIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtjb25maWcuaGVsZEJ5XSAtIFRoZSBwbGF5ZXIgaG9sZGluZyB0aGUgZGllLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtwaXBzLCBjb2xvciwgcm90YXRpb24sIHgsIHksIGhlbGRCeX0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IHBpcHNWYWx1ZSA9IHZhbGlkYXRlLmludGVnZXIocGlwcyB8fCB0aGlzLmdldEF0dHJpYnV0ZShQSVBTX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuYmV0d2VlbigxLCA2KVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhyYW5kb21QaXBzKCkpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgX3BpcHMuc2V0KHRoaXMsIHBpcHNWYWx1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCBwaXBzVmFsdWUpO1xuXG4gICAgICAgIHRoaXMuY29sb3IgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX0NPTE9SKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMucm90YXRpb24gPSB2YWxpZGF0ZS5pbnRlZ2VyKHJvdGF0aW9uIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFJPVEFUSU9OX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuYmV0d2VlbigwLCAzNjApXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfUk9UQVRJT04pXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy54ID0gdmFsaWRhdGUuaW50ZWdlcih4IHx8IHRoaXMuZ2V0QXR0cmlidXRlKFhfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5sYXJnZXJUaGFuKDApXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfWClcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnkgPSB2YWxpZGF0ZS5pbnRlZ2VyKHkgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWV9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ZKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIC8vIFRvZG86IHZhbGlkYXRlIHRoYXQgVG9wUGxheWVyIGlzIG9uIHRoZSBzYW1lIGJvYXJkIGFzIERpZT9cbiAgICAgICAgdGhpcy5oZWxkQnkgPSBoZWxkQnkgaW5zdGFuY2VvZiBUb3BQbGF5ZXIgPyBoZWxkQnkgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB4IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHgoKSB7XG4gICAgICAgIHJldHVybiBfeC5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB4KG5ld1gpIHtcbiAgICAgICAgX3guc2V0KHRoaXMsIG5ld1gpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInhcIiwgbmV3WCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHkgY29vcmRpbmF0ZVxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgeSgpIHtcbiAgICAgICAgcmV0dXJuIF95LmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHkobmV3WSkge1xuICAgICAgICBfeS5zZXQodGhpcywgbmV3WSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwieVwiLCBuZXdZKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcm90YXRpb24gb2YgdGhpcyBEaWUuIDAg4omkIHJvdGF0aW9uIOKJpCAzNjAuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfG51bGx9XG4gICAgICovXG4gICAgZ2V0IHJvdGF0aW9uKCkge1xuICAgICAgICByZXR1cm4gX3JvdGF0aW9uLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHJvdGF0aW9uKG5ld1IpIHtcbiAgICAgICAgaWYgKG51bGwgPT09IG5ld1IpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwicm90YXRpb25cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUm90YXRpb24gPSBuZXdSICUgQ0lSQ0xFX0RFR1JFRVM7XG4gICAgICAgICAgICBfcm90YXRpb24uc2V0KHRoaXMsIG5vcm1hbGl6ZWRSb3RhdGlvbik7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInJvdGF0aW9uXCIsIG5vcm1hbGl6ZWRSb3RhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaHJvdyB0aGlzIERpZS4gVGhlIG51bWJlciBvZiBwaXBzIHRvIGEgcmFuZG9tIG51bWJlciBuLCAxIOKJpCBuIOKJpCA2LlxuICAgICAqIE9ubHkgZGljZSB0aGF0IGFyZSBub3QgYmVpbmcgaGVsZCBjYW4gYmUgdGhyb3duLlxuICAgICAqXG4gICAgICogQGZpcmVzIFwidG9wOnRocm93LWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0aHJvd0l0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIF9waXBzLnNldCh0aGlzLCByYW5kb21QaXBzKCkpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHRoaXMucGlwcyk7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnRocm93LWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgaG9sZHMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IGhvbGQgYSBkaWUgdGhhdCBpcyBub3RcbiAgICAgKiBiZWluZyBoZWxkIGJ5IGFub3RoZXIgcGxheWVyIHlldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBwbGF5ZXIgLSBUaGUgcGxheWVyIHdobyB3YW50cyB0byBob2xkIHRoaXMgRGllLlxuICAgICAqIEBmaXJlcyBcInRvcDpob2xkLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllci5cbiAgICAgKi9cbiAgICBob2xkSXQocGxheWVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0hlbGQoKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBwbGF5ZXI7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOmhvbGQtZGllXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgZGllOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIERpZSBiZWluZyBoZWxkIGJ5IGFueSBwbGF5ZXI/XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIHdoZW4gdGhpcyBEaWUgaXMgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNIZWxkKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5oZWxkQnk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllciByZWxlYXNlcyB0aGlzIERpZS4gQSBwbGF5ZXIgY2FuIG9ubHkgcmVsZWFzZSBkaWNlIHRoYXQgc2hlIGlzXG4gICAgICogaG9sZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBwbGF5ZXIgLSBUaGUgcGxheWVyIHdobyB3YW50cyB0byByZWxlYXNlIHRoaXMgRGllLlxuICAgICAqIEBmaXJlcyBcInRvcDpyZWxhc2UtZGllXCIgd2l0aCBwYXJhbWV0ZXJzIHRoaXMgRGllIGFuZCB0aGUgcGxheWVyIHJlbGVhc2luZyBpdC5cbiAgICAgKi9cbiAgICByZWxlYXNlSXQocGxheWVyKSB7XG4gICAgICAgIGlmICh0aGlzLmlzSGVsZCgpICYmIHRoaXMuaGVsZEJ5LmVxdWFscyhwbGF5ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmhlbGRCeSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShIRUxEX0JZX0FUVFJJQlVURSk7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnJlbGVhc2UtZGllXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgZGllOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGhpcyBEaWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dCAtIFRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3XG4gICAgICogb25cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllU2l6ZSAtIFRoZSBzaXplIG9mIGEgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29vcmRpbmF0ZXMgPSB0aGlzLmNvb3JkaW5hdGVzXSAtIFRoZSBjb29yZGluYXRlcyB0b1xuICAgICAqIGRyYXcgdGhpcyBkaWUuIEJ5IGRlZmF1bHQsIHRoaXMgZGllIGlzIGRyYXduIGF0IGl0cyBvd24gY29vcmRpbmF0ZXMsXG4gICAgICogYnV0IHlvdSBjYW4gYWxzbyBkcmF3IGl0IGVsc2V3aGVyZSBpZiBzbyBuZWVkZWQuXG4gICAgICovXG4gICAgcmVuZGVyKGNvbnRleHQsIGRpZVNpemUsIGNvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBzY2FsZSA9IGRpZVNpemUgLyBCQVNFX0RJRV9TSVpFO1xuICAgICAgICBjb25zdCBTSEFMRiA9IEhBTEYgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgU1RISVJEID0gVEhJUkQgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgU1BJUF9TSVpFID0gUElQX1NJWkUgKiBzY2FsZTtcblxuICAgICAgICBjb25zdCB7eCwgeX0gPSBjb29yZGluYXRlcztcblxuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSkge1xuICAgICAgICAgICAgcmVuZGVySG9sZChjb250ZXh0LCB4LCB5LCBTSEFMRiwgdGhpcy5oZWxkQnkuY29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKDAgIT09IHRoaXMucm90YXRpb24pIHtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKHggKyBTSEFMRiwgeSArIFNIQUxGKTtcbiAgICAgICAgICAgIGNvbnRleHQucm90YXRlKGRlZzJyYWQodGhpcy5yb3RhdGlvbikpO1xuICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoLTEgKiAoeCArIFNIQUxGKSwgLTEgKiAoeSArIFNIQUxGKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJEaWUoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuY29sb3IpO1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5waXBzKSB7XG4gICAgICAgIGNhc2UgMToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTSEFMRiwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAyOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDM6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTSEFMRiwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNDoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA1OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDY6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IC8vIE5vIG90aGVyIHZhbHVlcyBhbGxvd2VkIC8gcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWFyIGNvbnRleHRcbiAgICAgICAgY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wRGllKTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWUsXG4gICAgdW5pY29kZVRvUGlwcyxcbiAgICBwaXBzVG9Vbmljb2RlLFxuICAgIFRBR19OQU1FXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7REVGQVVMVF9TWVNURU1fUExBWUVSLCBUQUdfTkFNRSBhcyBUT1BfUExBWUVSfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcblxuY29uc3QgVEFHX05BTUUgPSBcInRvcC1wbGF5ZXItbGlzdFwiO1xuXG4vKipcbiAqIFRvcFBsYXllckxpc3QgdG8gZGVzY3JpYmUgdGhlIHBsYXllcnMgaW4gdGhlIGdhbWUuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wUGxheWVyTGlzdCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcFBsYXllckxpc3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICgwID49IHRoaXMucGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoREVGQVVMVF9TWVNURU1fUExBWUVSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcDpzdGFydC10dXJuXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgLy8gT25seSBvbmUgcGxheWVyIGNhbiBoYXZlIGEgdHVybiBhdCBhbnkgZ2l2ZW4gdGltZS5cbiAgICAgICAgICAgIHRoaXMucGxheWVyc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIocCA9PiAhcC5lcXVhbHMoZXZlbnQuZGV0YWlsLnBsYXllcikpXG4gICAgICAgICAgICAgICAgLmZvckVhY2gocCA9PiBwLmVuZFR1cm4oKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIGluIHRoaXMgbGlzdC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFRPUF9QTEFZRVIpXTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFRBR19OQU1FLCBUb3BQbGF5ZXJMaXN0KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXJMaXN0LFxuICAgIFRBR19OQU1FXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtHcmlkTGF5b3V0fSBmcm9tIFwiLi9HcmlkTGF5b3V0LmpzXCI7XG5pbXBvcnQge1RvcERpZSwgVEFHX05BTUUgYXMgVE9QX0RJRX0gZnJvbSBcIi4vVG9wRGllLmpzXCI7XG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUiwgVG9wUGxheWVyLCBUQUdfTkFNRSBhcyBUT1BfUExBWUVSLCBIQVNfVFVSTl9BVFRSSUJVVEV9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuaW1wb3J0IHtUQUdfTkFNRSBhcyBUT1BfUExBWUVSX0xJU1R9IGZyb20gXCIuL1RvcFBsYXllckxpc3QuanNcIjtcbmltcG9ydCB7dmFsaWRhdGV9IGZyb20gXCIuL3ZhbGlkYXRlL3ZhbGlkYXRlLmpzXCI7XG5cbmNvbnN0IFRBR19OQU1FID0gXCJ0b3AtZGljZS1ib2FyZFwiO1xuXG5jb25zdCBERUZBVUxUX0RJRV9TSVpFID0gMTAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9IT0xEX0RVUkFUSU9OID0gMzc1OyAvLyBtc1xuY29uc3QgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEID0gZmFsc2U7XG5jb25zdCBERUZBVUxUX0hPTERJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEID0gZmFsc2U7XG5cbmNvbnN0IFJPV1MgPSAxMDtcbmNvbnN0IENPTFMgPSAxMDtcblxuY29uc3QgREVGQVVMVF9XSURUSCA9IENPTFMgKiBERUZBVUxUX0RJRV9TSVpFOyAvLyBweFxuY29uc3QgREVGQVVMVF9IRUlHSFQgPSBST1dTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfRElTUEVSU0lPTiA9IE1hdGguZmxvb3IoUk9XUyAvIDIpO1xuXG5jb25zdCBNSU5fREVMVEEgPSAzOyAvL3B4XG5cbmNvbnN0IFdJRFRIX0FUVFJJQlVURSA9IFwid2lkdGhcIjtcbmNvbnN0IEhFSUdIVF9BVFRSSUJVVEUgPSBcImhlaWdodFwiO1xuY29uc3QgRElTUEVSU0lPTl9BVFRSSUJVVEUgPSBcImRpc3BlcnNpb25cIjtcbmNvbnN0IERJRV9TSVpFX0FUVFJJQlVURSA9IFwiZGllLXNpemVcIjtcbmNvbnN0IERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJkcmFnZ2luZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBIT0xESU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJob2xkaW5nLWRpY2UtZGlzYWJsZWRcIjtcbmNvbnN0IFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJyb3RhdGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSA9IFwiaG9sZC1kdXJhdGlvblwiO1xuXG5jb25zdCBwYXJzZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHROdW1iZXIgPSAwKSA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW1iZXIpID8gZGVmYXVsdE51bWJlciA6IG51bWJlcjtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyID0gKG51bWJlclN0cmluZywgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgcmV0dXJuIHZhbGlkYXRlLmludGVnZXIobnVtYmVyU3RyaW5nKVxuICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAuZGVmYXVsdFRvKGRlZmF1bHRWYWx1ZSlcbiAgICAgICAgLnZhbHVlO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlcih2YWx1ZVN0cmluZywgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbmNvbnN0IGdldEJvb2xlYW4gPSAoYm9vbGVhblN0cmluZywgdHJ1ZVZhbHVlLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAodHJ1ZVZhbHVlID09PSBib29sZWFuU3RyaW5nIHx8IFwidHJ1ZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoXCJmYWxzZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IGdldEJvb2xlYW5BdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKHZhbHVlU3RyaW5nLCBbdmFsdWVTdHJpbmcsIFwidHJ1ZVwiXSwgW1wiZmFsc2VcIl0sIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2NhbnZhcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbGF5b3V0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jdXJyZW50UGxheWVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9udW1iZXJPZlJlYWR5RGljZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IGNvbnRleHQgPSAoYm9hcmQpID0+IF9jYW52YXMuZ2V0KGJvYXJkKS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbmNvbnN0IGdldFJlYWR5RGljZSA9IChib2FyZCkgPT4ge1xuICAgIGlmICh1bmRlZmluZWQgPT09IF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpKSB7XG4gICAgICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJlYWR5RGljZSA9IChib2FyZCwgdXBkYXRlKSA9PiB7XG4gICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgZ2V0UmVhZHlEaWNlKGJvYXJkKSArIHVwZGF0ZSk7XG59O1xuXG5jb25zdCBpc1JlYWR5ID0gKGJvYXJkKSA9PiBnZXRSZWFkeURpY2UoYm9hcmQpID09PSBib2FyZC5kaWNlLmxlbmd0aDtcblxuY29uc3QgdXBkYXRlQm9hcmQgPSAoYm9hcmQsIGRpY2UgPSBib2FyZC5kaWNlKSA9PiB7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIGNvbnRleHQoYm9hcmQpLmNsZWFyUmVjdCgwLCAwLCBib2FyZC53aWR0aCwgYm9hcmQuaGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBkaWUucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmNvbnN0IGFkZERpZSA9IChib2FyZCkgPT4ge1xuICAgIHVwZGF0ZVJlYWR5RGljZShib2FyZCwgMSk7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIHVwZGF0ZUJvYXJkKGJvYXJkLCBib2FyZC5sYXlvdXQubGF5b3V0KGJvYXJkLmRpY2UpKTtcbiAgICB9XG59O1xuXG5jb25zdCByZW1vdmVEaWUgPSAoYm9hcmQpID0+IHtcbiAgICB1cGRhdGVCb2FyZChib2FyZCwgYm9hcmQubGF5b3V0LmxheW91dChib2FyZC5kaWNlKSk7XG4gICAgdXBkYXRlUmVhZHlEaWNlKGJvYXJkLCAtMSk7XG59O1xuXG5cbi8vIEludGVyYWN0aW9uIHN0YXRlc1xuY29uc3QgTk9ORSA9IFN5bWJvbChcIm5vX2ludGVyYWN0aW9uXCIpO1xuY29uc3QgSE9MRCA9IFN5bWJvbChcImhvbGRcIik7XG5jb25zdCBNT1ZFID0gU3ltYm9sKFwibW92ZVwiKTtcbmNvbnN0IElOREVURVJNSU5FRCA9IFN5bWJvbChcImluZGV0ZXJtaW5lZFwiKTtcbmNvbnN0IERSQUdHSU5HID0gU3ltYm9sKFwiZHJhZ2dpbmdcIik7XG5cbi8vIE1ldGhvZHMgdG8gaGFuZGxlIGludGVyYWN0aW9uXG5jb25zdCBjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyA9IChjYW52YXMsIHhXaW5kb3csIHlXaW5kb3cpID0+IHtcbiAgICBjb25zdCBjYW52YXNCb3ggPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB4ID0geFdpbmRvdyAtIGNhbnZhc0JveC5sZWZ0ICogKGNhbnZhcy53aWR0aCAvIGNhbnZhc0JveC53aWR0aCk7XG4gICAgY29uc3QgeSA9IHlXaW5kb3cgLSBjYW52YXNCb3gudG9wICogKGNhbnZhcy5oZWlnaHQgLyBjYW52YXNCb3guaGVpZ2h0KTtcblxuICAgIHJldHVybiB7eCwgeX07XG59O1xuXG5jb25zdCBzZXR1cEludGVyYWN0aW9uID0gKGJvYXJkKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gX2NhbnZhcy5nZXQoYm9hcmQpO1xuXG4gICAgLy8gU2V0dXAgaW50ZXJhY3Rpb25cbiAgICBsZXQgb3JpZ2luID0ge307XG4gICAgbGV0IHN0YXRlID0gTk9ORTtcbiAgICBsZXQgc3RhdGljQm9hcmQgPSBudWxsO1xuICAgIGxldCBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgbGV0IGhvbGRUaW1lb3V0ID0gbnVsbDtcblxuICAgIGNvbnN0IGhvbGREaWUgPSAoKSA9PiB7XG4gICAgICAgIGlmIChIT0xEID09PSBzdGF0ZSB8fCBJTkRFVEVSTUlORUQgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICAvLyB0b2dnbGUgaG9sZCAvIHJlbGVhc2VcbiAgICAgICAgICAgIGNvbnN0IHBsYXllcldpdGhBVHVybiA9IGJvYXJkLnF1ZXJ5U2VsZWN0b3IoYCR7VE9QX1BMQVlFUl9MSVNUfSAke1RPUF9QTEFZRVJ9WyR7SEFTX1RVUk5fQVRUUklCVVRFfV1gKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZCBpcyBhIGN1c3RvbSBIVE1MIGVsZW1lbnQgdG8gcmVuZGVyIGFuZCBjb250cm9sIGFcbiAqIGRpY2UgYm9hcmQuIFxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcERpY2VCb2FyZCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpY2VCb2FyZC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSB2YWxpZGF0ZS5ib29sZWFuKG5ld1ZhbHVlLCBnZXRCb29sZWFuKG9sZFZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKSkudmFsdWU7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5yb3RhdGUgPSAhZGlzYWJsZWRSb3RhdGlvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSBpcyBkZXRlcm1pbmVkIHdoZW4gdXNpbmcgdGhlIGdldHRlclxuICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTphZGRlZFwiLCAoKSA9PiBhZGREaWUodGhpcykpO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3AtZGllOnJlbW92ZWRcIiwgKCkgPT4gcmVtb3ZlRGllKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgZGljZSB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSBET01cbiAgICAgICAgdGhpcy5kaWNlLmZvckVhY2goKCkgPT4gYWRkRGllKHRoaXMpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICBhZG9wdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIEdyaWRMYXlvdXQgdXNlZCBieSB0aGlzIERpY2VCb2FyZCB0byBsYXlvdXQgdGhlIGRpY2UuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7R3JpZExheW91dH1cbiAgICAgKi9cbiAgICBnZXQgbGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gX2xheW91dC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpY2Ugb24gdGhpcyBib2FyZC4gTm90ZSwgdG8gYWN0dWFsbHkgdGhyb3cgdGhlIGRpY2UgdXNlXG4gICAgICoge0BsaW5rIHRocm93RGljZX0uIFxuICAgICAqXG4gICAgICogQHR5cGUge1RvcERpZVtdfVxuICAgICAqL1xuICAgIGdldCBkaWNlKCkge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoVE9QX0RJRSldO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIHB1dCBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSwgMCA8IG1heGltdW0uXG4gICAgICovXG4gICAgZ2V0IG1heGltdW1OdW1iZXJPZkRpY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5tYXhpbXVtTnVtYmVyT2ZEaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBXSURUSF9BVFRSSUJVVEUsIERFRkFVTFRfV0lEVEgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhpcyBib2FyZC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIRUlHSFRfQVRUUklCVVRFLCBERUZBVUxUX0hFSUdIVCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BlcnNpb24gbGV2ZWwgb2YgdGhpcyBib2FyZC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaXNwZXJzaW9uKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElTUEVSU0lPTl9BVFRSSUJVVEUsIERFRkFVTFRfRElTUEVSU0lPTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGllU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIERJRV9TSVpFX0FUVFJJQlVURSwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuIGRpY2Ugb24gdGhpcyBib2FyZCBiZSBkcmFnZ2VkP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZERyYWdnaW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgRFJBR0dJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuIGRpY2Ugb24gdGhpcyBib2FyZCBiZSBoZWxkIGJ5IGEgUGxheWVyP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZEhvbGRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBIT0xESU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX0hPTERJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgcm90YXRpbmcgZGljZSBvbiB0aGlzIGJvYXJkIGRpc2FibGVkP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZFJvdGF0aW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGR1cmF0aW9uIGluIG1zIHRvIHByZXNzIHRoZSBtb3VzZSAvIHRvdWNoIGEgZGllIGJlZm9yZSBpdCBiZWtvbWVzXG4gICAgICogaGVsZCBieSB0aGUgUGxheWVyLiBJdCBoYXMgb25seSBhbiBlZmZlY3Qgd2hlbiB0aGlzLmhvbGRhYmxlRGljZSA9PT1cbiAgICAgKiB0cnVlLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaG9sZER1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRF9EVVJBVElPTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIFRvcFBsYXllckxpc3QgZWxlbWVudCBvZiB0aGlzIFRvcERpY2VCb2FyZC4gSWYgaXQgZG9lcyBub3QgZXhpc3QsXG4gICAgICogaXQgd2lsbCBiZSBjcmVhdGVkLlxuICAgICAqXG4gICAgICogQHR5cGUge1RvcFBsYXllckxpc3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX3BsYXllckxpc3QoKSB7XG4gICAgICAgIGxldCBwbGF5ZXJMaXN0ID0gdGhpcy5xdWVyeVNlbGVjdG9yKFRPUF9QTEFZRVJfTElTVCk7XG4gICAgICAgIGlmIChudWxsID09PSBwbGF5ZXJMaXN0KSB7XG4gICAgICAgICAgICBwbGF5ZXJMaXN0ID0gdGhpcy5hcHBlbmRDaGlsZChUT1BfUExBWUVSX0xJU1QpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBsYXllckxpc3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllcnMgcGxheWluZyBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge1RvcFBsYXllcltdfVxuICAgICAqL1xuICAgIGdldCBwbGF5ZXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGxheWVyTGlzdC5wbGF5ZXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzIHBsYXllciwgdGhyb3cgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBbcGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSXSAtIFRoZVxuICAgICAqIHBsYXllciB0aGF0IGlzIHRocm93aW5nIHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BEaWVbXX0gVGhlIHRocm93biBkaWNlIG9uIHRoaXMgYm9hcmQuIFRoaXMgbGlzdCBvZiBkaWNlIGlzIHRoZSBzYW1lIGFzIHRoaXMgVG9wRGljZUJvYXJkJ3Mge0BzZWUgZGljZX0gcHJvcGVydHlcbiAgICAgKi9cbiAgICB0aHJvd0RpY2UocGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSKSB7XG4gICAgICAgIGlmIChwbGF5ZXIgJiYgIXBsYXllci5oYXNUdXJuKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3RhcnRUdXJuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaWNlLmZvckVhY2goZGllID0+IGRpZS50aHJvd0l0KCkpO1xuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGllIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BEaWV8T2JqZWN0fSBbY29uZmlnID0ge31dIC0gVGhlIGRpZSBvciBhIGNvbmZpZ3VyYXRpb24gb2ZcbiAgICAgKiB0aGUgZGllIHRvIGFkZCB0byB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKiBAcGFyYW0ge051bWJlcnxudWxsfSBbY29uZmlnLnBpcHNdIC0gVGhlIHBpcHMgb2YgdGhlIGRpZSB0byBhZGQuXG4gICAgICogSWYgbm8gcGlwcyBhcmUgc3BlY2lmaWVkIG9yIHRoZSBwaXBzIGFyZSBub3QgYmV0d2VlbiAxIGFuZCA2LCBhIHJhbmRvbVxuICAgICAqIG51bWJlciBiZXR3ZWVuIDEgYW5kIDYgaXMgZ2VuZXJhdGVkIGluc3RlYWQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFtjb25maWcuY29sb3JdIC0gVGhlIGNvbG9yIG9mIHRoZSBkaWUgdG8gYWRkLiBEZWZhdWx0XG4gICAgICogdG8gdGhlIGRlZmF1bHQgY29sb3IuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueF0gLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueV0gLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcucm90YXRpb25dIC0gVGhlIHJvdGF0aW9uIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtjb25maWcuaGVsZEJ5XSAtIFRoZSBwbGF5ZXIgaG9sZGluZyB0aGUgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7VG9wRGllfSBUaGUgYWRkZWQgZGllLlxuICAgICAqL1xuICAgIGFkZERpZShjb25maWcgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmRDaGlsZChjb25maWcgaW5zdGFuY2VvZiBUb3BEaWUgPyBjb25maWcgOiBuZXcgVG9wRGllKGNvbmZpZykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkaWUgZnJvbSB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wRGllfSBkaWUgLSBUaGUgZGllIHRvIHJlbW92ZSBmcm9tIHRoaXMgYm9hcmQuXG4gICAgICovXG4gICAgcmVtb3ZlRGllKGRpZSkge1xuICAgICAgICBpZiAoZGllLnBhcmVudE5vZGUgJiYgZGllLnBhcmVudE5vZGUgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoZGllKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHBsYXllciB0byB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfE9iamVjdH0gY29uZmlnIC0gVGhlIHBsYXllciBvciBhIGNvbmZpZ3VyYXRpb24gb2YgYVxuICAgICAqIHBsYXllciB0byBhZGQgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5jb2xvciAtIFRoaXMgcGxheWVyJ3MgY29sb3IgdXNlZCBpbiB0aGUgZ2FtZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLm5hbWUgLSBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcuc2NvcmVdIC0gVGhpcyBwbGF5ZXIncyBzY29yZS5cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtjb25maWcuaGFzVHVybl0gLSBUaGlzIHBsYXllciBoYXMgYSB0dXJuLlxuICAgICAqXG4gICAgICogQHRocm93cyBFcnJvciB3aGVuIHRoZSBwbGF5ZXIgdG8gYWRkIGNvbmZsaWN0cyB3aXRoIGEgcHJlLWV4aXN0aW5nXG4gICAgICogcGxheWVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7VG9wUGxheWVyfSBUaGUgYWRkZWQgcGxheWVyLlxuICAgICAqL1xuICAgIGFkZFBsYXllcihjb25maWcgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGxheWVyTGlzdC5hcHBlbmRDaGlsZChjb25maWcgaW5zdGFuY2VvZiBUb3BQbGF5ZXIgPyBjb25maWcgOiBuZXcgVG9wUGxheWVyKGNvbmZpZykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGF5ZXIgZnJvbSB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBwbGF5ZXIgLSBUaGUgcGxheWVyIHRvIHJlbW92ZSBmcm9tIHRoaXMgYm9hcmQuXG4gICAgICovXG4gICAgcmVtb3ZlUGxheWVyKHBsYXllcikge1xuICAgICAgICBpZiAocGxheWVyLnBhcmVudE5vZGUgJiYgcGxheWVyLnBhcmVudE5vZGUgPT09IHRoaXMuX3BsYXllckxpc3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckxpc3QucmVtb3ZlQ2hpbGQocGxheWVyKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wRGljZUJvYXJkKTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWNlQm9hcmQsXG4gICAgREVGQVVMVF9ESUVfU0laRSxcbiAgICBERUZBVUxUX0hPTERfRFVSQVRJT04sXG4gICAgREVGQVVMVF9XSURUSCxcbiAgICBERUZBVUxUX0hFSUdIVCxcbiAgICBERUZBVUxUX0RJU1BFUlNJT04sXG4gICAgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVELFxuICAgIFRBR19OQU1FXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cbmltcG9ydCB7VG9wRGljZUJvYXJkfSBmcm9tIFwiLi9Ub3BEaWNlQm9hcmQuanNcIjtcbmltcG9ydCB7VG9wRGllfSBmcm9tIFwiLi9Ub3BEaWUuanNcIjtcbmltcG9ydCB7VG9wUGxheWVyfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcbmltcG9ydCB7VG9wUGxheWVyTGlzdH0gZnJvbSBcIi4vVG9wUGxheWVyTGlzdC5qc1wiO1xuXG53aW5kb3cudHdlbnR5b25lcGlwcyA9IHdpbmRvdy50d2VudHlvbmVwaXBzIHx8IE9iamVjdC5mcmVlemUoe1xuICAgIFZFUlNJT046IFwiMC4wLjFcIixcbiAgICBMSUNFTlNFOiBcIkxHUEwtMy4wXCIsXG4gICAgV0VCU0lURTogXCJodHRwczovL3R3ZW50eW9uZXBpcHMub3JnXCIsXG4gICAgVG9wRGljZUJvYXJkOiBUb3BEaWNlQm9hcmQsXG4gICAgVG9wRGllOiBUb3BEaWUsXG4gICAgVG9wUGxheWVyOiBUb3BQbGF5ZXIsXG4gICAgVG9wUGxheWVyTGlzdDogVG9wUGxheWVyTGlzdFxufSk7XG4iXSwibmFtZXMiOlsiVEFHX05BTUUiLCJDT0xPUl9BVFRSSUJVVEUiLCJfY29sb3IiLCJ2YWxpZGF0ZSIsIlRPUF9QTEFZRVIiLCJUT1BfUExBWUVSX0xJU1QiLCJUT1BfRElFIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlCQSxNQUFNLGtCQUFrQixHQUFHLGNBQWMsS0FBSyxDQUFDOzs7Ozs7OztJQVEzQyxXQUFXLENBQUMsT0FBTyxFQUFFO1FBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNsQjtDQUNKOztBQ3BDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUdBLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDOztBQUVuQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsS0FBSztJQUMzQixPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNyRSxDQUFDOzs7QUFHRixNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQUUs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QUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNyRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekQsTUFBTTtTQUNUO1FBQ0QsUUFBUTtTQUNQOzs7UUFHRCxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDMUM7Q0FDSixDQUFDOztBQUVG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RyxFQUFFLEVBQUU7UUFDbkIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLFlBQVksU0FBUyxHQUFHLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3JHOzs7Ozs7O0lBT0QsWUFBWSxDQUFDLE1BQU0sRUFBRTtRQUNqQixJQUFJLE1BQU0sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQzdELElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDO0tBQ0o7O0NBRUosQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQ0wsV0FBUSxFQUFFLFlBQVksQ0FBQyxDQUFDOztBQ2ptQnJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFLQSxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6RCxPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsVUFBVTtJQUNuQixPQUFPLEVBQUUsMkJBQTJCO0lBQ3BDLFlBQVksRUFBRSxZQUFZO0lBQzFCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsYUFBYSxFQUFFLGFBQWE7Q0FDL0IsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNGQnNZWGxsY2k1cWN5SXNJaTlvYjIxbEwyaDFkV0l2VUhKdmFtVmpkSE12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMM055WXk5VWIzQkVhV1V1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1VHeGhlV1Z5VEdsemRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OVViM0JFYVdObFFtOWhjbVF1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMbXB6SWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRVZ5Y205eVhHNGdLaTljYm1OdmJuTjBJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCM2FYUm9JRzFsYzNOaFoyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JXVnpjMkZuWlNBdElGUm9aU0J0WlhOellXZGxJR0Z6YzI5amFXRjBaV1FnZDJsMGFDQjBhR2x6WEc0Z0lDQWdJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxbGMzTmhaMlVwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYldWemMyRm5aU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNExDQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBSRlJrRlZURlJmUkVsRlgxTkpXa1VzSUVSRlJrRlZURlJmUkVsVFVFVlNVMGxQVGl3Z1JFVkdRVlZNVkY5WFNVUlVTQ3dnUkVWR1FWVk1WRjlJUlVsSFNGUjlJR1p5YjIwZ1hDSXVMMVJ2Y0VScFkyVkNiMkZ5WkM1cWMxd2lPMXh1WEc1amIyNXpkQ0JHVlV4TVgwTkpVa05NUlY5SlRsOUVSVWRTUlVWVElEMGdNell3TzF4dVhHNWpiMjV6ZENCeVlXNWtiMjFwZW1WRFpXNTBaWElnUFNBb2Jpa2dQVDRnZTF4dUlDQWdJSEpsZEhWeWJpQW9NQzQxSUR3OUlFMWhkR2d1Y21GdVpHOXRLQ2tnUHlCTllYUm9MbVpzYjI5eUlEb2dUV0YwYUM1alpXbHNLUzVqWVd4c0tEQXNJRzRwTzF4dWZUdGNibHh1THk4Z1VISnBkbUYwWlNCbWFXVnNaSE5jYm1OdmJuTjBJRjkzYVdSMGFDQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmFHVnBaMmgwSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlqYjJ4eklEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5eWIzZHpJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWthV05sSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlrYVdWVGFYcGxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWthWE53WlhKemFXOXVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXliM1JoZEdVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNHZLaXBjYmlBcUlFQjBlWEJsWkdWbUlIdFBZbXBsWTNSOUlFZHlhV1JNWVhsdmRYUkRiMjVtYVdkMWNtRjBhVzl1WEc0Z0tpQkFjSEp2Y0dWeWRIa2dlMDUxYldKbGNuMGdZMjl1Wm1sbkxuZHBaSFJvSUMwZ1ZHaGxJRzFwYm1sdFlXd2dkMmxrZEdnZ2IyWWdkR2hwYzF4dUlDb2dSM0pwWkV4aGVXOTFkQ0JwYmlCd2FYaGxiSE11TzF4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NW9aV2xuYUhSZElDMGdWR2hsSUcxcGJtbHRZV3dnYUdWcFoyaDBJRzltWEc0Z0tpQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRZ2FXNGdjR2w0Wld4ekxpNWNiaUFxSUVCd2NtOXdaWEowZVNCN1RuVnRZbVZ5ZlNCamIyNW1hV2N1WkdsemNHVnljMmx2YmlBdElGUm9aU0JrYVhOMFlXNWpaU0JtY205dElIUm9aU0JqWlc1MFpYSWdiMllnZEdobFhHNGdLaUJzWVhsdmRYUWdZU0JrYVdVZ1kyRnVJR0psSUd4aGVXOTFkQzVjYmlBcUlFQndjbTl3WlhKMGVTQjdUblZ0WW1WeWZTQmpiMjVtYVdjdVpHbGxVMmw2WlNBdElGUm9aU0J6YVhwbElHOW1JR0VnWkdsbExseHVJQ292WEc1Y2JpOHFLbHh1SUNvZ1IzSnBaRXhoZVc5MWRDQm9ZVzVrYkdWeklHeGhlV2x1WnlCdmRYUWdkR2hsSUdScFkyVWdiMjRnWVNCRWFXTmxRbTloY21RdVhHNGdLaTljYm1OdmJuTjBJRWR5YVdSTVlYbHZkWFFnUFNCamJHRnpjeUI3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dSM0pwWkV4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdSM0pwWkV4aGVXOTFkRU52Ym1acFozVnlZWFJwYjI1OUlHTnZibVpwWnlBdElGUm9aU0JqYjI1bWFXZDFjbUYwYVc5dUlHOW1JSFJvWlNCSGNtbGtUR0Y1YjNWMFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2UxeHVJQ0FnSUNBZ0lDQjNhV1IwYUNBOUlFUkZSa0ZWVEZSZlYwbEVWRWdzWEc0Z0lDQWdJQ0FnSUdobGFXZG9kQ0E5SUVSRlJrRlZURlJmU0VWSlIwaFVMRnh1SUNBZ0lDQWdJQ0JrYVdWVGFYcGxJRDBnUkVWR1FWVk1WRjlFU1VWZlUwbGFSU3hjYmlBZ0lDQWdJQ0FnWkdsemNHVnljMmx2YmlBOUlFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRseHVJQ0FnSUgwZ1BTQjdmU2tnZTF4dUlDQWdJQ0FnSUNCZlpHbGpaUzV6WlhRb2RHaHBjeXdnVzEwcE8xeHVJQ0FnSUNBZ0lDQmZaR2xsVTJsNlpTNXpaWFFvZEdocGN5d2dNU2s3WEc0Z0lDQWdJQ0FnSUY5M2FXUjBhQzV6WlhRb2RHaHBjeXdnTUNrN1hHNGdJQ0FnSUNBZ0lGOW9aV2xuYUhRdWMyVjBLSFJvYVhNc0lEQXBPMXh1SUNBZ0lDQWdJQ0JmY205MFlYUmxMbk5sZENoMGFHbHpMQ0IwY25WbEtUdGNibHh1SUNBZ0lDQWdJQ0IwYUdsekxtUnBjM0JsY25OcGIyNGdQU0JrYVhOd1pYSnphVzl1TzF4dUlDQWdJQ0FnSUNCMGFHbHpMbVJwWlZOcGVtVWdQU0JrYVdWVGFYcGxPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHBaSFJvSUQwZ2QybGtkR2c3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhR1ZwWjJoMElEMGdhR1ZwWjJoME8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0IzYVdSMGFDQnBiaUJ3YVhobGJITWdkWE5sWkNCaWVTQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1YybGtkR2dnUGowZ01GeHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5SUZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCM2FXUjBhQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5M2FXUjBhQzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUhkcFpIUm9LSGNwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLQ0ZPZFcxaVpYSXVhWE5KYm5SbFoyVnlLSGNwSUh4OElEQWdQaUIzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCWGFXUjBhQ0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Dd2daMjkwSUNja2UzZDlKeUJwYm5OMFpXRmtMbUFwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lGOTNhV1IwYUM1elpYUW9kR2hwY3l3Z2R5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCb1pXbG5hSFFnYVc0Z2NHbDRaV3h6SUhWelpXUWdZbmtnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJjYmlBZ0lDQWdLaUJBZEdoeWIzZHpJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUJJWldsbmFIUWdQajBnTUZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdhR1ZwWjJoMEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMmhsYVdkb2RDNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyVjBJR2hsYVdkb2RDaG9LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hUblZ0WW1WeUxtbHpTVzUwWldkbGNpaG9LU0I4ZkNBd0lENGdhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhnU0dWcFoyaDBJSE5vYjNWc1pDQmlaU0JoSUc1MWJXSmxjaUJzWVhKblpYSWdkR2hoYmlBd0xDQm5iM1FnSnlSN2FIMG5JR2x1YzNSbFlXUXVZQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gyaGxhV2RvZEM1elpYUW9kR2hwY3l3Z2FDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUd4aGVXOTFkQ0J2YmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1SUZSb2FYTmNiaUFnSUNBZ0tpQnVkVzFpWlhJZ2FYTWdQajBnTUM0Z1VtVmhaQ0J2Ym14NUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDJOdmJITWdLaUIwYUdsekxsOXliM2R6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmthWE53WlhKemFXOXVJR3hsZG1Wc0lIVnpaV1FnWW5rZ2RHaHBjeUJIY21sa1RHRjViM1YwTGlCVWFHVWdaR2x6Y0dWeWMybHZiaUJzWlhabGJGeHVJQ0FnSUNBcUlHbHVaR2xqWVhSbGN5QjBhR1VnWkdsemRHRnVZMlVnWm5KdmJTQjBhR1VnWTJWdWRHVnlJR1JwWTJVZ1kyRnVJR0psSUd4aGVXOTFkQzRnVlhObElERWdabTl5SUdGY2JpQWdJQ0FnS2lCMGFXZG9kQ0J3WVdOclpXUWdiR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1JHbHpjR1Z5YzJsdmJpQStQU0F3WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2x6Y0dWeWMybHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5a2FYTndaWEp6YVc5dUxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCelpYUWdaR2x6Y0dWeWMybHZiaWhrS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doVG5WdFltVnlMbWx6U1c1MFpXZGxjaWhrS1NCOGZDQXdJRDRnWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1JHbHpjR1Z5YzJsdmJpQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTUN3Z1oyOTBJQ2NrZTJSOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsemNHVnljMmx2Ymk1elpYUW9kR2hwY3l3Z1pDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkR2h5YjNkeklFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpQkVhV1ZUYVhwbElENDlJREJjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthV1ZUYVhwbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMlJwWlZOcGVtVXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITmxkQ0JrYVdWVGFYcGxLR1J6S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doVG5WdFltVnlMbWx6U1c1MFpXZGxjaWhrY3lrZ2ZId2dNQ0ErUFNCa2N5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGdaR2xsVTJsNlpTQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTVN3Z1oyOTBJQ2NrZTJSemZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCZlpHbGxVMmw2WlM1elpYUW9kR2hwY3l3Z1pITXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxsOWpZV3hqZFd4aGRHVkhjbWxrS0hSb2FYTXVkMmxrZEdnc0lIUm9hWE11YUdWcFoyaDBLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQm5aWFFnY205MFlYUmxLQ2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J5SUQwZ1gzSnZkR0YwWlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRZ1BUMDlJSElnUHlCMGNuVmxJRG9nY2p0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WlhRZ2NtOTBZWFJsS0hJcElIdGNiaUFnSUNBZ0lDQWdYM0p2ZEdGMFpTNXpaWFFvZEdocGN5d2djaWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHNTFiV0psY2lCdlppQnliM2R6SUdsdUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA1MWJXSmxjbjBnVkdobElHNTFiV0psY2lCdlppQnliM2R6TENBd0lEd2djbTkzY3k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCZmNtOTNjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5eWIzZHpMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2JuVnRZbVZ5SUc5bUlHTnZiSFZ0Ym5NZ2FXNGdkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5ZlNCVWFHVWdiblZ0WW1WeUlHOW1JR052YkhWdGJuTXNJREFnUENCamIyeDFiVzV6TGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUY5amIyeHpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJOdmJITXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCalpXNTBaWElnWTJWc2JDQnBiaUIwYUdseklFZHlhV1JNWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOUlGUm9aU0JqWlc1MFpYSWdLSEp2ZHl3Z1kyOXNLUzVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JmWTJWdWRHVnlLQ2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J5YjNjZ1BTQnlZVzVrYjIxcGVtVkRaVzUwWlhJb2RHaHBjeTVmY205M2N5QXZJRElwSUMwZ01UdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyOXNJRDBnY21GdVpHOXRhWHBsUTJWdWRHVnlLSFJvYVhNdVgyTnZiSE1nTHlBeUtTQXRJREU3WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUh0eWIzY3NJR052YkgwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1RHRjViM1YwSUdScFkyVWdiMjRnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JFYVdWYlhYMGdaR2xqWlNBdElGUm9aU0JrYVdObElIUnZJR3hoZVc5MWRDQnZiaUIwYUdseklFeGhlVzkxZEM1Y2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQkVhV1ZiWFgwZ1ZHaGxJSE5oYldVZ2JHbHpkQ0J2WmlCa2FXTmxMQ0JpZFhRZ2JtOTNJR3hoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdWR2hsSUc1MWJXSmxjaUJ2Wmx4dUlDQWdJQ0FxSUdScFkyVWdjMmh2ZFd4a0lHNXZkQ0JsZUdObFpXUWdkR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVWdkR2hwY3lCTVlYbHZkWFFnWTJGdVhHNGdJQ0FnSUNvZ2JHRjViM1YwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR3hoZVc5MWRDaGthV05sS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hrYVdObExteGxibWQwYUNBK0lIUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1ZHaGxJRzUxYldKbGNpQnZaaUJrYVdObElIUm9ZWFFnWTJGdUlHSmxJR3hoZVc5MWRDQnBjeUFrZTNSb2FYTXViV0Y0YVcxMWJVNTFiV0psY2s5bVJHbGpaWDBzSUdkdmRDQWtlMlJwWTJVdWJHVnVaMmgwZlNCa2FXTmxJR2x1YzNSbFlXUXVZQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNBOUlGdGRPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmthV05sVkc5TVlYbHZkWFFnUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdScFpTQnZaaUJrYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9aR2xsTG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdSR2xqWlNCMGFHRjBJR0Z5WlNCaVpXbHVaeUJvWld4a0lITm9iM1ZzWkNCclpXVndJSFJvWldseUlHTjFjbkpsYm5RZ1kyOXZjbVJwYm1GMFpYTWdZVzVrSUhKdmRHRjBhVzl1TGlCSmJpQnZkR2hsY2lCM2IzSmtjeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGFHVnpaU0JrYVdObElHRnlaU0J6YTJsd2NHVmtMbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGpaVlJ2VEdGNWIzVjBMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzFoZUNBOUlFMWhkR2d1YldsdUtHUnBZMlV1YkdWdVozUm9JQ29nZEdocGN5NWthWE53WlhKemFXOXVMQ0IwYUdsekxtMWhlR2x0ZFcxT2RXMWlaWEpQWmtScFkyVXBPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhkbUZwYkdGaWJHVkRaV3hzY3lBOUlIUm9hWE11WDJOdmJYQjFkR1ZCZG1GcGJHRmliR1ZEWld4c2N5aHRZWGdzSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sS1R0Y2JseHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR1JwWlNCdlppQmthV05sVkc5TVlYbHZkWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmhibVJ2YlVsdVpHVjRJRDBnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nWVhaaGFXeGhZbXhsUTJWc2JITXViR1Z1WjNSb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEpoYm1SdmJVTmxiR3dnUFNCaGRtRnBiR0ZpYkdWRFpXeHNjMXR5WVc1a2IyMUpibVJsZUYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JoZG1GcGJHRmliR1ZEWld4c2N5NXpjR3hwWTJVb2NtRnVaRzl0U1c1a1pYZ3NJREVwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdVdVkyOXZjbVJwYm1GMFpYTWdQU0IwYUdsekxsOXVkVzFpWlhKVWIwTnZiM0prYVc1aGRHVnpLSEpoYm1SdmJVTmxiR3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsTG5KdmRHRjBhVzl1SUQwZ2RHaHBjeTV5YjNSaGRHVWdQeUJOWVhSb0xuSnZkVzVrS0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJHVlV4TVgwTkpVa05NUlY5SlRsOUVSVWRTUlVWVEtTQTZJRzUxYkd3N1hHNGdJQ0FnSUNBZ0lDQWdJQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaUzV3ZFhOb0tHUnBaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmZaR2xqWlM1elpYUW9kR2hwY3l3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcE8xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhiSEpsWVdSNVRHRjViM1YwUkdsalpUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjF3ZFhSbElHRWdiR2x6ZENCM2FYUm9JR0YyWVdsc1lXSnNaU0JqWld4c2N5QjBieUJ3YkdGalpTQmthV05sSUc5dUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUcxaGVDQXRJRlJvWlNCdWRXMWlaWElnWlcxd2RIa2dZMlZzYkhNZ2RHOGdZMjl0Y0hWMFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRVJwWlZ0ZGZTQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTQXRJRUVnYkdsemRDQjNhWFJvSUdScFkyVWdkR2hoZENCb1lYWmxJR0ZzY21WaFpIa2dZbVZsYmlCc1lYbHZkWFF1WEc0Z0lDQWdJQ29nWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VG5WdFltVnlXMTE5SUZSb1pTQnNhWE4wSUc5bUlHRjJZV2xzWVdKc1pTQmpaV3hzY3lCeVpYQnlaWE5sYm5SbFpDQmllU0IwYUdWcGNpQnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTI5dGNIVjBaVUYyWVdsc1lXSnNaVU5sYkd4ektHMWhlQ3dnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWVhaaGFXeGhZbXhsSUQwZ2JtVjNJRk5sZENncE8xeHVJQ0FnSUNBZ0lDQnNaWFFnYkdWMlpXd2dQU0F3TzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J0WVhoTVpYWmxiQ0E5SUUxaGRHZ3ViV2x1S0hSb2FYTXVYM0p2ZDNNc0lIUm9hWE11WDJOdmJITXBPMXh1WEc0Z0lDQWdJQ0FnSUhkb2FXeGxJQ2hoZG1GcGJHRmliR1V1YzJsNlpTQThJRzFoZUNBbUppQnNaWFpsYkNBOElHMWhlRXhsZG1Wc0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHTmxiR3dnYjJZZ2RHaHBjeTVmWTJWc2JITlBia3hsZG1Wc0tHeGxkbVZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gxYm1SbFptbHVaV1FnSVQwOUlHTmxiR3dnSmlZZ2RHaHBjeTVmWTJWc2JFbHpSVzF3ZEhrb1kyVnNiQ3dnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YyWVdsc1lXSnNaUzVoWkdRb1kyVnNiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnNaWFpsYkNzck8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRUZ5Y21GNUxtWnliMjBvWVhaaGFXeGhZbXhsS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRFlXeGpkV3hoZEdVZ1lXeHNJR05sYkd4eklHOXVJR3hsZG1Wc0lHWnliMjBnZEdobElHTmxiblJsY2lCdlppQjBhR1VnYkdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHeGxkbVZzSUMwZ1ZHaGxJR3hsZG1Wc0lHWnliMjBnZEdobElHTmxiblJsY2lCdlppQjBhR1VnYkdGNWIzVjBMaUF3WEc0Z0lDQWdJQ29nYVc1a2FXTmhkR1Z6SUhSb1pTQmpaVzUwWlhJdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VFpYUThUblZ0WW1WeVBuMGdkR2hsSUdObGJHeHpJRzl1SUhSb1pTQnNaWFpsYkNCcGJpQjBhR2x6SUd4aGVXOTFkQ0J5WlhCeVpYTmxiblJsWkNCaWVWeHVJQ0FnSUNBcUlIUm9aV2x5SUc1MWJXSmxjaTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpaV3hzYzA5dVRHVjJaV3dvYkdWMlpXd3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMlZzYkhNZ1BTQnVaWGNnVTJWMEtDazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHTmxiblJsY2lBOUlIUm9hWE11WDJObGJuUmxjanRjYmx4dUlDQWdJQ0FnSUNCcFppQW9NQ0E5UFQwZ2JHVjJaV3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05sYkd4ekxtRmtaQ2gwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvWTJWdWRHVnlLU2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0d4bGRDQnliM2NnUFNCalpXNTBaWEl1Y205M0lDMGdiR1YyWld3N0lISnZkeUE4UFNCalpXNTBaWEl1Y205M0lDc2diR1YyWld3N0lISnZkeXNyS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyVnNiSE11WVdSa0tIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdjbTkzTENCamIydzZJR05sYm5SbGNpNWpiMndnTFNCc1pYWmxiSDBwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2NzSUdOdmJEb2dZMlZ1ZEdWeUxtTnZiQ0FySUd4bGRtVnNmU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0d4bGRDQmpiMndnUFNCalpXNTBaWEl1WTI5c0lDMGdiR1YyWld3Z0t5QXhPeUJqYjJ3Z1BDQmpaVzUwWlhJdVkyOXNJQ3NnYkdWMlpXdzdJR052YkNzcktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMlZzYkhNdVlXUmtLSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3Y205M09pQmpaVzUwWlhJdWNtOTNJQzBnYkdWMlpXd3NJR052YkgwcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpaV3hzY3k1aFpHUW9kR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHR5YjNjNklHTmxiblJsY2k1eWIzY2dLeUJzWlhabGJDd2dZMjlzZlNrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHTmxiR3h6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVSdlpYTWdZMlZzYkNCamIyNTBZV2x1SUdFZ1kyVnNiQ0JtY205dElHRnNjbVZoWkhsTVlYbHZkWFJFYVdObFAxeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdObGJHd2dMU0JCSUdObGJHd2dhVzRnYkdGNWIzVjBJSEpsY0hKbGMyVnVkR1ZrSUdKNUlHRWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdSR2xsVzExOUlHRnNjbVZoWkhsTVlYbHZkWFJFYVdObElDMGdRU0JzYVhOMElHOW1JR1JwWTJVZ2RHaGhkQ0JvWVhabElHRnNjbVZoWkhrZ1ltVmxiaUJzWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdENiMjlzWldGdWZTQlVjblZsSUdsbUlHTmxiR3dnWkc5bGN5QnViM1FnWTI5dWRHRnBiaUJoSUdScFpTNWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNTWE5GYlhCMGVTaGpaV3hzTENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa0lEMDlQU0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaUzVtYVc1a0tHUnBaU0E5UGlCalpXeHNJRDA5UFNCMGFHbHpMbDlqYjI5eVpHbHVZWFJsYzFSdlRuVnRZbVZ5S0dScFpTNWpiMjl5WkdsdVlYUmxjeWtwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnWVNCdWRXMWlaWElnZEc4Z1lTQmpaV3hzSUNoeWIzY3NJR052YkNsY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0J1SUMwZ1ZHaGxJRzUxYldKbGNpQnlaWEJ5WlhObGJuUnBibWNnWVNCalpXeHNYRzRnSUNBZ0lDb2dRSEpsZEhWeWJuTWdlMDlpYW1WamRIMGdVbVYwZFhKdUlIUm9aU0JqWld4c0lDaDdjbTkzTENCamIyeDlLU0JqYjNKeVpYTndiMjVrYVc1bklHNHVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZmJuVnRZbVZ5Vkc5RFpXeHNLRzRwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUh0eWIzYzZJRTFoZEdndWRISjFibU1vYmlBdklIUm9hWE11WDJOdmJITXBMQ0JqYjJ3NklHNGdKU0IwYUdsekxsOWpiMnh6ZlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUdFZ1kyVnNiQ0IwYnlCaElHNTFiV0psY2x4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRQWW1wbFkzUjlJR05sYkd3Z0xTQlVhR1VnWTJWc2JDQjBieUJqYjI1MlpYSjBJSFJ2SUdsMGN5QnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5ZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJRzUxYldKbGNpQmpiM0p5WlhOd2IyNWthVzVuSUhSdklIUm9aU0JqWld4c0xseHVJQ0FnSUNBcUlGSmxkSFZ5Ym5NZ2RXNWtaV1pwYm1Wa0lIZG9aVzRnZEdobElHTmxiR3dnYVhNZ2JtOTBJRzl1SUhSb1pTQnNZWGx2ZFhSY2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkeXdnWTI5c2ZTa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQThQU0J5YjNjZ0ppWWdjbTkzSUR3Z2RHaHBjeTVmY205M2N5QW1KaUF3SUR3OUlHTnZiQ0FtSmlCamIyd2dQQ0IwYUdsekxsOWpiMnh6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbTkzSUNvZ2RHaHBjeTVmWTI5c2N5QXJJR052YkR0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQmpaV3hzSUhKbGNISmxjMlZ1ZEdWa0lHSjVJR2wwY3lCdWRXMWlaWElnZEc4Z2RHaGxhWElnWTI5dmNtUnBibUYwWlhNdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYmlBdElGUm9aU0J1ZFcxaVpYSWdjbVZ3Y21WelpXNTBhVzVuSUdFZ1kyVnNiRnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUMkpxWldOMGZTQlVhR1VnWTI5dmNtUnBibUYwWlhNZ1kyOXljbVZ6Y0c5dVpHbHVaeUIwYnlCMGFHVWdZMlZzYkNCeVpYQnlaWE5sYm5SbFpDQmllVnh1SUNBZ0lDQXFJSFJvYVhNZ2JuVnRZbVZ5TGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMjUxYldKbGNsUnZRMjl2Y21ScGJtRjBaWE1vYmlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJWc2JGUnZRMjl2Y21SektIUm9hWE11WDI1MWJXSmxjbFJ2UTJWc2JDaHVLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTI5dWRtVnlkQ0JoSUhCaGFYSWdiMllnWTI5dmNtUnBibUYwWlhNZ2RHOGdZU0J1ZFcxaVpYSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1kyOXZjbVJ6SUMwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUhSdklHTnZiblpsY25SY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA1MWJXSmxjbngxYm1SbFptbHVaV1I5SUZSb1pTQmpiMjl5WkdsdVlYUmxjeUJqYjI1MlpYSjBaV1FnZEc4Z1lTQnVkVzFpWlhJdUlFbG1YRzRnSUNBZ0lDb2dkR2hsSUdOdmIzSmthVzVoZEdWeklHRnlaU0J1YjNRZ2IyNGdkR2hwY3lCc1lYbHZkWFFzSUhSb1pTQnVkVzFpWlhJZ2FYTWdkVzVrWldacGJtVmtMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTnZiM0prYVc1aGRHVnpWRzlPZFcxaVpYSW9ZMjl2Y21SektTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHNGdQU0IwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZEdocGN5NWZZMjl2Y21SelZHOURaV3hzS0dOdmIzSmtjeWtwTzF4dUlDQWdJQ0FnSUNCcFppQW9NQ0E4UFNCdUlDWW1JRzRnUENCMGFHbHpMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnVPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxYm1SbFptbHVaV1E3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVTI1aGNDQW9lQ3g1S1NCMGJ5QjBhR1VnWTJ4dmMyVnpkQ0JqWld4c0lHbHVJSFJvYVhNZ1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRQWW1wbFkzUjlJR1JwWldOdmIzSmthVzVoZEdVZ0xTQlVhR1VnWTI5dmNtUnBibUYwWlNCMGJ5Qm1hVzVrSUhSb1pTQmpiRzl6WlhOMElHTmxiR3hjYmlBZ0lDQWdLaUJtYjNJdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VWIzQkVhV1Y5SUZ0a2FXVmpiMjl5WkdsdVlYUXVaR2xsSUQwZ2JuVnNiRjBnTFNCVWFHVWdaR2xsSUhSdklITnVZWEFnZEc4dVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdScFpXTnZiM0prYVc1aGRHVXVlQ0F0SUZSb1pTQjRMV052YjNKa2FXNWhkR1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR1JwWldOdmIzSmthVzVoZEdVdWVTQXRJRlJvWlNCNUxXTnZiM0prYVc1aGRHVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOGJuVnNiSDBnVkdobElHTnZiM0prYVc1aGRHVWdiMllnZEdobElHTmxiR3dnWTJ4dmMyVnpkQ0IwYnlBb2VDd2dlU2t1WEc0Z0lDQWdJQ29nVG5Wc2JDQjNhR1Z1SUc1dklITjFhWFJoWW14bElHTmxiR3dnYVhNZ2JtVmhjaUFvZUN3Z2VTbGNiaUFnSUNBZ0tpOWNiaUFnSUNCemJtRndWRzhvZTJScFpTQTlJRzUxYkd3c0lIZ3NJSGw5S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOdmNtNWxja05sYkd3Z1BTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeWIzYzZJRTFoZEdndWRISjFibU1vZVNBdklIUm9hWE11WkdsbFUybDZaU2tzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUUxaGRHZ3VkSEoxYm1Nb2VDQXZJSFJvYVhNdVpHbGxVMmw2WlNsY2JpQWdJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpiM0p1WlhJZ1BTQjBhR2x6TGw5alpXeHNWRzlEYjI5eVpITW9ZMjl5Ym1WeVEyVnNiQ2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSGRwWkhSb1NXNGdQU0JqYjNKdVpYSXVlQ0FySUhSb2FYTXVaR2xsVTJsNlpTQXRJSGc3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSGRwWkhSb1QzVjBJRDBnZEdocGN5NWthV1ZUYVhwbElDMGdkMmxrZEdoSmJqdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FHVnBaMmgwU1c0Z1BTQmpiM0p1WlhJdWVTQXJJSFJvYVhNdVpHbGxVMmw2WlNBdElIazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGxhV2RvZEU5MWRDQTlJSFJvYVhNdVpHbGxVMmw2WlNBdElHaGxhV2RvZEVsdU8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIRjFZV1J5WVc1MGN5QTlJRnQ3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnhPaUIwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvWTI5eWJtVnlRMlZzYkNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaEpiaUFxSUdobGFXZG9kRWx1WEc0Z0lDQWdJQ0FnSUgwc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhFNklIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCamIzSnVaWEpEWld4c0xuSnZkeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklHTnZjbTVsY2tObGJHd3VZMjlzSUNzZ01WeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaFBkWFFnS2lCb1pXbG5hSFJKYmx4dUlDQWdJQ0FnSUNCOUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeE9pQjBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1kyOXlibVZ5UTJWc2JDNXliM2NnS3lBeExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nWTI5eWJtVnlRMlZzYkM1amIyeGNiaUFnSUNBZ0lDQWdJQ0FnSUgwcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5MlpYSmhaMlU2SUhkcFpIUm9TVzRnS2lCb1pXbG5hSFJQZFhSY2JpQWdJQ0FnSUNBZ2ZTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NUb2dkR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNjNklHTnZjbTVsY2tObGJHd3VjbTkzSUNzZ01TeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUdOdmNtNWxja05sYkd3dVkyOXNJQ3NnTVZ4dUlDQWdJQ0FnSUNBZ0lDQWdmU2tzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiM1psY21GblpUb2dkMmxrZEdoUGRYUWdLaUJvWldsbmFIUlBkWFJjYmlBZ0lDQWdJQ0FnZlYwN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2MyNWhjRlJ2SUQwZ2NYVmhaSEpoYm5SelhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCalpXeHNJSE5vYjNWc1pDQmlaU0J2YmlCMGFHVWdiR0Y1YjNWMFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Wm1sc2RHVnlLQ2h4ZFdGa2NtRnVkQ2tnUFQ0Z2RXNWtaV1pwYm1Wa0lDRTlQU0J4ZFdGa2NtRnVkQzV4S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnWTJWc2JDQnphRzkxYkdRZ1ltVWdibTkwSUdGc2NtVmhaSGtnZEdGclpXNGdaWGhqWlhCMElHSjVJR2wwYzJWc1pseHVJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWdvY1hWaFpISmhiblFwSUQwK0lDaGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnVkV3hzSUNFOVBTQmthV1VnSmlZZ2RHaHBjeTVmWTI5dmNtUnBibUYwWlhOVWIwNTFiV0psY2loa2FXVXVZMjl2Y21ScGJtRjBaWE1wSUQwOVBTQnhkV0ZrY21GdWRDNXhLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSHg4SUhSb2FYTXVYMk5sYkd4SmMwVnRjSFI1S0hGMVlXUnlZVzUwTG5Fc0lGOWthV05sTG1kbGRDaDBhR2x6S1NrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCalpXeHNJSE5vYjNWc1pDQmlaU0JqYjNabGNtVmtJR0o1SUhSb1pTQmthV1VnZEdobElHMXZjM1JjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXlaV1IxWTJVb1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0tHMWhlRkVzSUhGMVlXUnlZVzUwS1NBOVBpQnhkV0ZrY21GdWRDNWpiM1psY21GblpTQStJRzFoZUZFdVkyOTJaWEpoWjJVZ1B5QnhkV0ZrY21GdWRDQTZJRzFoZUZFc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2UzRTZJSFZ1WkdWbWFXNWxaQ3dnWTI5MlpYSmhaMlU2SUMweGZWeHVJQ0FnSUNBZ0lDQWdJQ0FnS1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa0lDRTlQU0J6Ym1Gd1ZHOHVjU0EvSUhSb2FYTXVYMjUxYldKbGNsUnZRMjl2Y21ScGJtRjBaWE1vYzI1aGNGUnZMbkVwSURvZ2JuVnNiRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJIWlhRZ2RHaGxJR1JwWlNCaGRDQndiMmx1ZENBb2VDd2dlU2s3WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMUJ2YVc1MGZTQndiMmx1ZENBdElGUm9aU0J3YjJsdWRDQnBiaUFvZUN3Z2VTa2dZMjl2Y21ScGJtRjBaWE5jYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRVYjNCRWFXVjhiblZzYkgwZ1ZHaGxJR1JwWlNCMWJtUmxjaUJqYjI5eVpHbHVZWFJsY3lBb2VDd2dlU2tnYjNJZ2JuVnNiQ0JwWmlCdWJ5QmthV1ZjYmlBZ0lDQWdLaUJwY3lCaGRDQjBhR1VnY0c5cGJuUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBRWFFvY0c5cGJuUWdQU0I3ZURvZ01Dd2dlVG9nTUgwcElIdGNiaUFnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JrYVdVZ2IyWWdYMlJwWTJVdVoyVjBLSFJvYVhNcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JrYVdVdVkyOXZjbVJwYm1GMFpYTTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhoR2FYUWdQU0I0SUR3OUlIQnZhVzUwTG5nZ0ppWWdjRzlwYm5RdWVDQThQU0I0SUNzZ2RHaHBjeTVrYVdWVGFYcGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZVVacGRDQTlJSGtnUEQwZ2NHOXBiblF1ZVNBbUppQndiMmx1ZEM1NUlEdzlJSGtnS3lCMGFHbHpMbVJwWlZOcGVtVTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2g0Um1sMElDWW1JSGxHYVhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1pHbGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzUxYkd3N1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyRnNZM1ZzWVhSbElIUm9aU0JuY21sa0lITnBlbVVnWjJsMlpXNGdkMmxrZEdnZ1lXNWtJR2hsYVdkb2RDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCM2FXUjBhQ0F0SUZSb1pTQnRhVzVwYldGc0lIZHBaSFJvWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR2hsYVdkb2RDQXRJRlJvWlNCdGFXNXBiV0ZzSUdobGFXZG9kRnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyRnNZM1ZzWVhSbFIzSnBaQ2gzYVdSMGFDd2dhR1ZwWjJoMEtTQjdYRzRnSUNBZ0lDQWdJRjlqYjJ4ekxuTmxkQ2gwYUdsekxDQk5ZWFJvTG1ac2IyOXlLSGRwWkhSb0lDOGdkR2hwY3k1a2FXVlRhWHBsS1NrN1hHNGdJQ0FnSUNBZ0lGOXliM2R6TG5ObGRDaDBhR2x6TENCTllYUm9MbVpzYjI5eUtHaGxhV2RvZENBdklIUm9hWE11WkdsbFUybDZaU2twTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnWVNBb2NtOTNMQ0JqYjJ3cElHTmxiR3dnZEc4Z0tIZ3NJSGtwSUdOdmIzSmthVzVoZEdWekxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdObGJHd2dMU0JVYUdVZ1kyVnNiQ0IwYnlCamIyNTJaWEowSUhSdklHTnZiM0prYVc1aGRHVnpYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUMkpxWldOMGZTQlVhR1VnWTI5eWNtVnpjRzl1WkdsdVp5QmpiMjl5WkdsdVlYUmxjeTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpaV3hzVkc5RGIyOXlaSE1vZTNKdmR5d2dZMjlzZlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2UzZzZJR052YkNBcUlIUm9hWE11WkdsbFUybDZaU3dnZVRvZ2NtOTNJQ29nZEdocGN5NWthV1ZUYVhwbGZUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElDaDRMQ0I1S1NCamIyOXlaR2x1WVhSbGN5QjBieUJoSUNoeWIzY3NJR052YkNrZ1kyVnNiQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUMkpxWldOMGZTQmpiMjl5WkdsdVlYUmxjeUF0SUZSb1pTQmpiMjl5WkdsdVlYUmxjeUIwYnlCamIyNTJaWEowSUhSdklHRWdZMlZzYkM1Y2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0UFltcGxZM1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUdObGJHeGNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5amIyOXlaSE5VYjBObGJHd29lM2dzSUhsOUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeWIzYzZJRTFoZEdndWRISjFibU1vZVNBdklIUm9hWE11WkdsbFUybDZaU2tzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUUxaGRHZ3VkSEoxYm1Nb2VDQXZJSFJvYVhNdVpHbGxVMmw2WlNsY2JpQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNTlPMXh1WEc1bGVIQnZjblFnZTBkeWFXUk1ZWGx2ZFhSOU8xeHVJaXdpTHlvcVhHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGdzSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5b3FYRzRnS2lCQWJXOWtkV3hsSUcxcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMXh1SUNvdlhHNWNiaThxWEc0Z0tpQkRiMjUyWlhKMElHRnVJRWhVVFV3Z1lYUjBjbWxpZFhSbElIUnZJR0Z1SUdsdWMzUmhibU5sSjNNZ2NISnZjR1Z5ZEhrdUlGeHVJQ3BjYmlBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdVlXMWxJQzBnVkdobElHRjBkSEpwWW5WMFpTZHpJRzVoYldWY2JpQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2djSEp2Y0dWeWRIa25jeUJ1WVcxbExpQkdiM0lnWlhoaGJYQnNaU3dnWENKdGVTMWhkSFJ5WENKY2JpQXFJSGRwYkd3Z1ltVWdZMjl1ZG1WeWRHVmtJSFJ2SUZ3aWJYbEJkSFJ5WENJc0lHRnVaQ0JjSW1ScGMyRmliR1ZrWENJZ2RHOGdYQ0prYVhOaFlteGxaRndpTGx4dUlDb3ZYRzVqYjI1emRDQmhkSFJ5YVdKMWRHVXljSEp2Y0dWeWRIa2dQU0FvYm1GdFpTa2dQVDRnZTF4dUlDQWdJR052Ym5OMElGdG1hWEp6ZEN3Z0xpNHVjbVZ6ZEYwZ1BTQnVZVzFsTG5Od2JHbDBLRndpTFZ3aUtUdGNiaUFnSUNCeVpYUjFjbTRnWm1seWMzUWdLeUJ5WlhOMExtMWhjQ2gzYjNKa0lEMCtJSGR2Y21RdWMyeHBZMlVvTUN3Z01Ta3VkRzlWY0hCbGNrTmhjMlVvS1NBcklIZHZjbVF1YzJ4cFkyVW9NU2twTG1wdmFXNG9LVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dUV2w0YVc0Z2UwQnNhVzVySUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzMwZ2RHOGdZU0JqYkdGemN5NWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2V5cDlJRk4xY0NBdElGUm9aU0JqYkdGemN5QjBieUJ0YVhnZ2FXNTBieTVjYmlBcUlFQnlaWFIxY200Z2UxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdWR2hsSUcxcGVHVmtMV2x1SUdOc1lYTnpYRzRnS2k5Y2JtTnZibk4wSUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3lBOUlDaFRkWEFwSUQwK1hHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1RXbDRhVzRnZEc4Z2JXRnJaU0JoYkd3Z1lYUjBjbWxpZFhSbGN5QnZiaUJoSUdOMWMzUnZiU0JJVkUxTVJXeGxiV1Z1ZENCeVpXRmtMVzl1YkhrZ2FXNGdkR2hsSUhObGJuTmxYRzRnSUNBZ0lDb2dkR2hoZENCM2FHVnVJSFJvWlNCaGRIUnlhV0oxZEdVZ1oyVjBjeUJoSUc1bGR5QjJZV3gxWlNCMGFHRjBJR1JwWm1abGNuTWdabkp2YlNCMGFHVWdkbUZzZFdVZ2IyWWdkR2hsWEc0Z0lDQWdJQ29nWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTd2dhWFFnYVhNZ2NtVnpaWFFnZEc4Z2RHaGhkQ0J3Y205d1pYSjBlU2R6SUhaaGJIVmxMaUJVYUdWY2JpQWdJQ0FnS2lCaGMzTjFiWEIwYVc5dUlHbHpJSFJvWVhRZ1lYUjBjbWxpZFhSbElGd2liWGt0WVhSMGNtbGlkWFJsWENJZ1kyOXljbVZ6Y0c5dVpITWdkMmwwYUNCd2NtOXdaWEowZVNCY0luUm9hWE11YlhsQmRIUnlhV0oxZEdWY0lpNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1EyeGhjM045SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYaHBiaUIwYUdseklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5NWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJRlJvWlNCdGFYaGxaQ0JwYmlCamJHRnpjeTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ0YVhocGJseHVJQ0FnSUNBcUlFQmhiR2xoY3lCU1pXRmtUMjVzZVVGMGRISnBZblYwWlhOY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYkdGemN5QmxlSFJsYm1SeklGTjFjQ0I3WEc1Y2JpQWdJQ0FnSUNBZ0x5b3FYRzRnSUNBZ0lDQWdJQ0FxSUVOaGJHeGlZV05ySUhSb1lYUWdhWE1nWlhobFkzVjBaV1FnZDJobGJpQmhiaUJ2WW5ObGNuWmxaQ0JoZEhSeWFXSjFkR1VuY3lCMllXeDFaU0JwYzF4dUlDQWdJQ0FnSUNBZ0tpQmphR0Z1WjJWa0xpQkpaaUIwYUdVZ1NGUk5URVZzWlcxbGJuUWdhWE1nWTI5dWJtVmpkR1ZrSUhSdklIUm9aU0JFVDAwc0lIUm9aU0JoZEhSeWFXSjFkR1ZjYmlBZ0lDQWdJQ0FnSUNvZ2RtRnNkV1VnWTJGdUlHOXViSGtnWW1VZ2MyVjBJSFJ2SUhSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUVoVVRVeEZiR1Z0Wlc1MEozTWdjSEp2Y0dWeWRIa3VYRzRnSUNBZ0lDQWdJQ0FxSUVsdUlHVm1abVZqZEN3Z2RHaHBjeUJ0WVd0bGN5QjBhR2x6SUVoVVRVeEZiR1Z0Wlc1MEozTWdZWFIwY21saWRYUmxjeUJ5WldGa0xXOXViSGt1WEc0Z0lDQWdJQ0FnSUNBcVhHNGdJQ0FnSUNBZ0lDQXFJRVp2Y2lCbGVHRnRjR3hsTENCcFppQmhiaUJJVkUxTVJXeGxiV1Z1ZENCb1lYTWdZVzRnWVhSMGNtbGlkWFJsSUZ3aWVGd2lJR0Z1WkZ4dUlDQWdJQ0FnSUNBZ0tpQmpiM0p5WlhOd2IyNWthVzVuSUhCeWIzQmxjblI1SUZ3aWVGd2lMQ0IwYUdWdUlHTm9ZVzVuYVc1bklIUm9aU0IyWVd4MVpTQmNJbmhjSWlCMGJ5QmNJalZjSWx4dUlDQWdJQ0FnSUNBZ0tpQjNhV3hzSUc5dWJIa2dkMjl5YXlCM2FHVnVJR0IwYUdsekxuZ2dQVDA5SURWZ0xseHVJQ0FnSUNBZ0lDQWdLbHh1SUNBZ0lDQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnYm1GdFpTQXRJRlJvWlNCaGRIUnlhV0oxZEdVbmN5QnVZVzFsTGx4dUlDQWdJQ0FnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2IyeGtWbUZzZFdVZ0xTQlVhR1VnWVhSMGNtbGlkWFJsSjNNZ2IyeGtJSFpoYkhWbExseHVJQ0FnSUNBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdibVYzVm1Gc2RXVWdMU0JVYUdVZ1lYUjBjbWxpZFhSbEozTWdibVYzSUhaaGJIVmxMbHh1SUNBZ0lDQWdJQ0FnS2k5Y2JpQWdJQ0FnSUNBZ1lYUjBjbWxpZFhSbFEyaGhibWRsWkVOaGJHeGlZV05yS0c1aGJXVXNJRzlzWkZaaGJIVmxMQ0J1WlhkV1lXeDFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnUVd4c0lHRjBkSEpwWW5WMFpYTWdZWEpsSUcxaFpHVWdjbVZoWkMxdmJteDVJSFJ2SUhCeVpYWmxiblFnWTJobFlYUnBibWNnWW5rZ1kyaGhibWRwYm1kY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUhSb1pTQmhkSFJ5YVdKMWRHVWdkbUZzZFdWekxpQlBaaUJqYjNWeWMyVXNJSFJvYVhNZ2FYTWdZbmtnYm05Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdkMVlYSmhiblJsWlNCMGFHRjBJSFZ6WlhKeklIZHBiR3dnYm05MElHTm9aV0YwSUdsdUlHRWdaR2xtWm1WeVpXNTBJSGRoZVM1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIQnliM0JsY25SNUlEMGdZWFIwY21saWRYUmxNbkJ5YjNCbGNuUjVLRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11WTI5dWJtVmpkR1ZrSUNZbUlHNWxkMVpoYkhWbElDRTlQU0JnSkh0MGFHbHpXM0J5YjNCbGNuUjVYWDFnS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb2JtRnRaU3dnZEdocGMxdHdjbTl3WlhKMGVWMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1OdmJuTjBJRlpoYkdsa1lYUnBiMjVGY25KdmNpQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1JYSnliM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxelp5a2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaHRjMmNwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZtRnNhV1JoZEdsdmJrVnljbTl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxWmhiR2xrWVhScGIyNUZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2Vm1Gc2FXUmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElGOTJZV3gxWlNBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWkdWbVlYVnNkRlpoYkhWbElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5bGNuSnZjbk1nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc1amIyNXpkQ0JVZVhCbFZtRnNhV1JoZEc5eUlEMGdZMnhoYzNNZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdDJZV3gxWlN3Z1pHVm1ZWFZzZEZaaGJIVmxMQ0JsY25KdmNuTWdQU0JiWFgwcElIdGNiaUFnSUNBZ0lDQWdYM1poYkhWbExuTmxkQ2gwYUdsekxDQjJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lGOWtaV1poZFd4MFZtRnNkV1V1YzJWMEtIUm9hWE1zSUdSbFptRjFiSFJXWVd4MVpTazdYRzRnSUNBZ0lDQWdJRjlsY25KdmNuTXVjMlYwS0hSb2FYTXNJR1Z5Y205eWN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1oyVjBJRzl5YVdkcGJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjkyWVd4MVpTNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1oyVjBJSFpoYkhWbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1cGMxWmhiR2xrSUQ4Z2RHaHBjeTV2Y21sbmFXNGdPaUJmWkdWbVlYVnNkRlpoYkhWbExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCblpYUWdaWEp5YjNKektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMlZ5Y205eWN5NW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1oyVjBJR2x6Vm1Gc2FXUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUF3SUQ0OUlIUm9hWE11WlhKeWIzSnpMbXhsYm1kMGFEdGNiaUFnSUNCOVhHNWNiaUFnSUNCa1pXWmhkV3gwVkc4b2JtVjNSR1ZtWVhWc2RDa2dlMXh1SUNBZ0lDQWdJQ0JmWkdWbVlYVnNkRlpoYkhWbExuTmxkQ2gwYUdsekxDQnVaWGRFWldaaGRXeDBLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWDJOb1pXTnJLSHR3Y21Wa2FXTmhkR1VzSUdKcGJtUldZWEpwWVdKc1pYTWdQU0JiWFN3Z1JYSnliM0pVZVhCbElEMGdWbUZzYVdSaGRHbHZia1Z5Y205eWZTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQndjbTl3YjNOcGRHbHZiaUE5SUhCeVpXUnBZMkYwWlM1aGNIQnNlU2gwYUdsekxDQmlhVzVrVm1GeWFXRmliR1Z6S1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLQ0Z3Y205d2IzTnBkR2x2YmlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaWEp5YjNJZ1BTQnVaWGNnUlhKeWIzSlVlWEJsS0hSb2FYTXVkbUZzZFdVc0lHSnBibVJXWVhKcFlXSnNaWE1wTzF4dUlDQWdJQ0FnSUNBZ0lDQWdMeTlqYjI1emIyeGxMbmRoY200b1pYSnliM0l1ZEc5VGRISnBibWNvS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtVnljbTl5Y3k1d2RYTm9LR1Z5Y205eUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdFdZV3hwWkdGMGFXOXVSWEp5YjNKOUlHWnliMjBnWENJdUwxWmhiR2xrWVhScGIyNUZjbkp2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JRWVhKelpVVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJXWVd4cFpHRjBhVzl1UlhKeWIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLRzF6WnlrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lodGMyY3BPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVUdGeWMyVkZjbkp2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdFdZV3hwWkdGMGFXOXVSWEp5YjNKOUlHWnliMjBnWENJdUwxWmhiR2xrWVhScGIyNUZjbkp2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JKYm5aaGJHbGtWSGx3WlVWeWNtOXlJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QldZV3hwWkdGMGFXOXVSWEp5YjNJZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtHMXpaeWtnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWh0YzJjcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdTVzUyWVd4cFpGUjVjR1ZGY25KdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzVwYlhCdmNuUWdlMUJoY25ObFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMUJoY25ObFJYSnliM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdTVzUyWVd4cFpGUjVjR1ZGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlNXNTJZV3hwWkZSNWNHVkZjbkp2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JKVGxSRlIwVlNYMFJGUmtGVlRGUmZWa0ZNVlVVZ1BTQXdPMXh1WTI5dWMzUWdTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRlI1Y0dWV1lXeHBaR0YwYjNJZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0IyWVd4MVpTQTlJRWxPVkVWSFJWSmZSRVZHUVZWTVZGOVdRVXhWUlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWkdWbVlYVnNkRlpoYkhWbElEMGdTVTVVUlVkRlVsOUVSVVpCVlV4VVgxWkJURlZGTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JsY25KdmNuTWdQU0JiWFR0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvVG5WdFltVnlMbWx6U1c1MFpXZGxjaWhwYm5CMWRDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhiSFZsSUQwZ2FXNXdkWFE3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1hDSnpkSEpwYm1kY0lpQTlQVDBnZEhsd1pXOW1JR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J3WVhKelpXUldZV3gxWlNBOUlIQmhjbk5sU1c1MEtHbHVjSFYwTENBeE1DazdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9UblZ0WW1WeUxtbHpTVzUwWldkbGNpaHdZWEp6WldSV1lXeDFaU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaU0E5SUhCaGNuTmxaRlpoYkhWbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dVR0Z5YzJWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhKeWIzSnpMbkIxYzJnb2JtVjNJRWx1ZG1Gc2FXUlVlWEJsUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk45S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JzWVhKblpYSlVhR0Z1S0c0cElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDJOb1pXTnJLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIQnlaV1JwWTJGMFpUb2dLRzRwSUQwK0lIUm9hWE11YjNKcFoybHVJRDQ5SUc0c1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpYVc1a1ZtRnlhV0ZpYkdWek9pQmJibDFjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzIxaGJHeGxjbFJvWVc0b2Jpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvYmlrZ1BUNGdkR2hwY3k1dmNtbG5hVzRnUEQwZ2JpeGNiaUFnSUNBZ0lDQWdJQ0FnSUdKcGJtUldZWEpwWVdKc1pYTTZJRnR1WFZ4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCaVpYUjNaV1Z1S0c0c0lHMHBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0c0c0lHMHBJRDArSUhSb2FYTXViR0Z5WjJWeVZHaGhiaWh1S1NBbUppQjBhR2x6TG5OdFlXeHNaWEpVYUdGdUtHMHBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1ltbHVaRlpoY21saFlteGxjem9nVzI0c0lHMWRYRzRnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1NXNTBaV2RsY2xSNWNHVldZV3hwWkdGMGIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZWSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRKYm5aaGJHbGtWSGx3WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUZOVVVrbE9SMTlFUlVaQlZVeFVYMVpCVEZWRklEMGdYQ0pjSWp0Y2JtTnZibk4wSUZOMGNtbHVaMVI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUZOVVVrbE9SMTlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa1pXWmhkV3gwVm1Gc2RXVWdQU0JUVkZKSlRrZGZSRVZHUVZWTVZGOVdRVXhWUlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWlhKeWIzSnpJRDBnVzEwN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0Z3aWMzUnlhVzVuWENJZ1BUMDlJSFI1Y0dWdlppQnBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc2RXVWdQU0JwYm5CMWREdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdWeWNtOXljeTV3ZFhOb0tHNWxkeUJKYm5aaGJHbGtWSGx3WlVWeWNtOXlLR2x1Y0hWMEtTazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCemRYQmxjaWg3ZG1Gc2RXVXNJR1JsWm1GMWJIUldZV3gxWlN3Z1pYSnliM0p6ZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYm05MFJXMXdkSGtvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDZ3BJRDArSUZ3aVhDSWdJVDA5SUhSb2FYTXViM0pwWjJsdVhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdFVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5VWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNHZMMmx0Y0c5eWRDQjdVR0Z5YzJWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZVR0Z5YzJWRmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdEpiblpoYkdsa1ZIbHdaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRU5QVEU5U1gwUkZSa0ZWVEZSZlZrRk1WVVVnUFNCY0ltSnNZV05yWENJN1hHNWpiMjV6ZENCRGIyeHZjbFI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdSbFptRjFiSFJXWVd4MVpTQTlJRU5QVEU5U1gwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1Z5Y205eWN5QTlJRnRkTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2hjSW5OMGNtbHVaMXdpSUQwOVBTQjBlWEJsYjJZZ2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdhVzV3ZFhRN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dTVzUyWVd4cFpGUjVjR1ZGY25KdmNpaHBibkIxZENrcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9lM1poYkhWbExDQmtaV1poZFd4MFZtRnNkV1VzSUdWeWNtOXljMzBwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1EyOXNiM0pVZVhCbFZtRnNhV1JoZEc5eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMVI1Y0dWV1lXeHBaR0YwYjNKOUlHWnliMjBnWENJdUwxUjVjR1ZXWVd4cFpHRjBiM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdVR0Z5YzJWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZVR0Z5YzJWRmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdEpiblpoYkdsa1ZIbHdaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRUpQVDB4RlFVNWZSRVZHUVZWTVZGOVdRVXhWUlNBOUlHWmhiSE5sTzF4dVkyOXVjM1FnUW05dmJHVmhibFI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUVKUFQweEZRVTVmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pHVm1ZWFZzZEZaaGJIVmxJRDBnUWs5UFRFVkJUbDlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjbk1nUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb2FXNXdkWFFnYVc1emRHRnVZMlZ2WmlCQ2IyOXNaV0Z1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJR2x1Y0hWME8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRndpYzNSeWFXNW5YQ0lnUFQwOUlIUjVjR1Z2WmlCcGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0M5MGNuVmxMMmt1ZEdWemRDaHBibkIxZENrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjJZV3gxWlNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLQzltWVd4elpTOXBMblJsYzNRb2FXNXdkWFFwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCbVlXeHpaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUZCaGNuTmxSWEp5YjNJb2FXNXdkWFFwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2FYTlVjblZsS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJobFkyc29lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NISmxaR2xqWVhSbE9pQW9LU0E5UGlCMGNuVmxJRDA5UFNCMGFHbHpMbTl5YVdkcGJseHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnBjMFpoYkhObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvS1NBOVBpQm1ZV3h6WlNBOVBUMGdkR2hwY3k1dmNtbG5hVzVjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQkNiMjlzWldGdVZIbHdaVlpoYkdsa1lYUnZjbHh1ZlR0Y2JpSXNJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dWFXMXdiM0owSUh0SmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdVM1J5YVc1blZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2VTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHREYjJ4dmNsUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDBOdmJHOXlWSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y24wZ1puSnZiU0JjSWk0dlFtOXZiR1ZoYmxSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1ZtRnNhV1JoZEc5eUlEMGdZMnhoYzNNZ2UxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lHSnZiMnhsWVc0b2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QkNiMjlzWldGdVZIbHdaVlpoYkdsa1lYUnZjaWhwYm5CMWRDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyOXNiM0lvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCRGIyeHZjbFI1Y0dWV1lXeHBaR0YwYjNJb2FXNXdkWFFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2x1ZEdWblpYSW9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJKYm5SbFoyVnlWSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1J5YVc1bktHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dVM1J5YVc1blZIbHdaVlpoYkdsa1lYUnZjaWhwYm5CMWRDazdYRzRnSUNBZ2ZWeHVYRzU5TzF4dVhHNWpiMjV6ZENCV1lXeHBaR0YwYjNKVGFXNW5iR1YwYjI0Z1BTQnVaWGNnVm1Gc2FXUmhkRzl5S0NrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZtRnNhV1JoZEc5eVUybHVaMnhsZEc5dUlHRnpJSFpoYkdsa1lYUmxYRzU5TzF4dUlpd2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ3NJREl3TVRrZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNibWx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZTQm1jbTl0SUZ3aUxpOXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTmNJanRjYm1sdGNHOXlkQ0I3ZG1Gc2FXUmhkR1Y5SUdaeWIyMGdYQ0l1TDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1welhDSTdYRzVjYm1OdmJuTjBJRlJCUjE5T1FVMUZJRDBnWENKMGIzQXRjR3hoZVdWeVhDSTdYRzVjYmk4dklGUm9aU0J1WVcxbGN5QnZaaUIwYUdVZ0tHOWljMlZ5ZG1Wa0tTQmhkSFJ5YVdKMWRHVnpJRzltSUhSb1pTQlViM0JRYkdGNVpYSXVYRzVqYjI1emRDQkRUMHhQVWw5QlZGUlNTVUpWVkVVZ1BTQmNJbU52Ykc5eVhDSTdYRzVqYjI1emRDQk9RVTFGWDBGVVZGSkpRbFZVUlNBOUlGd2libUZ0WlZ3aU8xeHVZMjl1YzNRZ1UwTlBVa1ZmUVZSVVVrbENWVlJGSUQwZ1hDSnpZMjl5WlZ3aU8xeHVZMjl1YzNRZ1NFRlRYMVJWVWs1ZlFWUlVVa2xDVlZSRklEMGdYQ0pvWVhNdGRIVnlibHdpTzF4dVhHNHZMeUJVYUdVZ2NISnBkbUYwWlNCd2NtOXdaWEowYVdWeklHOW1JSFJvWlNCVWIzQlFiR0Y1WlhJZ1hHNWpiMjV6ZENCZlkyOXNiM0lnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMjVoYldVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDNOamIzSmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9ZWE5VZFhKdUlEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVMeW9xWEc0Z0tpQkJJRkJzWVhsbGNpQnBiaUJoSUdScFkyVWdaMkZ0WlM1Y2JpQXFYRzRnS2lCQklIQnNZWGxsY2lkeklHNWhiV1VnYzJodmRXeGtJR0psSUhWdWFYRjFaU0JwYmlCMGFHVWdaMkZ0WlM0Z1ZIZHZJR1JwWm1abGNtVnVkRnh1SUNvZ1ZHOXdVR3hoZVdWeUlHVnNaVzFsYm5SeklIZHBkR2dnZEdobElITmhiV1VnYm1GdFpTQmhkSFJ5YVdKMWRHVWdZWEpsSUhSeVpXRjBaV1FnWVhOY2JpQXFJSFJvWlNCellXMWxJSEJzWVhsbGNpNWNiaUFxWEc0Z0tpQkpiaUJuWlc1bGNtRnNJR2wwSUdseklISmxZMjl0YldWdVpHVmtJSFJvWVhRZ2JtOGdkSGR2SUhCc1lYbGxjbk1nWkc4Z2FHRjJaU0IwYUdVZ2MyRnRaU0JqYjJ4dmNpeGNiaUFxSUdGc2RHaHZkV2RvSUdsMElHbHpJRzV2ZENCMWJtTnZibU5sYVhaaFlteGxJSFJvWVhRZ1kyVnlkR0ZwYmlCa2FXTmxJR2RoYldWeklHaGhkbVVnY0d4aGVXVnljeUIzYjNKclhHNGdLaUJwYmlCMFpXRnRjeUIzYUdWeVpTQnBkQ0IzYjNWc1pDQnRZV3RsSUhObGJuTmxJR1p2Y2lCMGQyOGdiM0lnYlc5eVpTQmthV1ptWlhKbGJuUWdjR3hoZVdWeWN5QjBiMXh1SUNvZ2FHRjJaU0IwYUdVZ2MyRnRaU0JqYjJ4dmNpNWNiaUFxWEc0Z0tpQlVhR1VnYm1GdFpTQmhibVFnWTI5c2IzSWdZWFIwY21saWRYUmxjeUJoY21VZ2NtVnhkV2x5WldRdUlGUm9aU0J6WTI5eVpTQmhibVFnYUdGekxYUjFjbTVjYmlBcUlHRjBkSEpwWW5WMFpYTWdZWEpsSUc1dmRDNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvZ1FHMXBlR1Z6SUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dUlDb3ZYRzVqYjI1emRDQlViM0JRYkdGNVpYSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5aElWRTFNUld4bGJXVnVkQ2tnZTF4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EzSmxZWFJsSUdFZ2JtVjNJRlJ2Y0ZCc1lYbGxjaXdnYjNCMGFXOXVZV3hzZVNCaVlYTmxaQ0J2YmlCaGJpQnBiblJwZEdsaGJGeHVJQ0FnSUNBcUlHTnZibVpwWjNWeVlYUnBiMjRnZG1saElHRnVJRzlpYW1WamRDQndZWEpoYldWMFpYSWdiM0lnWkdWamJHRnlaV1FnWVhSMGNtbGlkWFJsY3lCcGJpQklWRTFNTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRQWW1wbFkzUjlJRnRqYjI1bWFXZGRJQzBnUVc0Z2FXNXBkR2xoYkNCamIyNW1hV2QxY21GMGFXOXVJR1p2Y2lCMGFHVmNiaUFnSUNBZ0tpQndiR0Y1WlhJZ2RHOGdZM0psWVhSbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCamIyNW1hV2N1WTI5c2IzSWdMU0JVYUdseklIQnNZWGxsY2lkeklHTnZiRzl5SUhWelpXUWdhVzRnZEdobElHZGhiV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJR052Ym1acFp5NXVZVzFsSUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ1WVcxbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCYlkyOXVabWxuTG5OamIzSmxYU0F0SUZSb2FYTWdjR3hoZVdWeUozTWdjMk52Y21VdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0Q2IyOXNaV0Z1ZlNCYlkyOXVabWxuTG1oaGMxUjFjbTVkSUMwZ1ZHaHBjeUJ3YkdGNVpYSWdhR0Z6SUdFZ2RIVnliaTVjYmlBZ0lDQWdLaTljYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWg3WTI5c2IzSXNJRzVoYldVc0lITmpiM0psTENCb1lYTlVkWEp1ZlNBOUlIdDlLU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLQ2s3WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5c2IzSldZV3gxWlNBOUlIWmhiR2xrWVhSbExtTnZiRzl5S0dOdmJHOXlJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0VOUFRFOVNYMEZVVkZKSlFsVlVSU2twTzF4dUlDQWdJQ0FnSUNCcFppQW9ZMjlzYjNKV1lXeDFaUzVwYzFaaGJHbGtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZZMjlzYjNJdWMyVjBLSFJvYVhNc0lHTnZiRzl5Vm1Gc2RXVXVkbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMQ0IwYUdsekxtTnZiRzl5S1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWENKQklGQnNZWGxsY2lCdVpXVmtjeUJoSUdOdmJHOXlMQ0IzYUdsamFDQnBjeUJoSUZOMGNtbHVaeTVjSWlrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnVZVzFsVm1Gc2RXVWdQU0IyWVd4cFpHRjBaUzV6ZEhKcGJtY29ibUZ0WlNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaE9RVTFGWDBGVVZGSkpRbFZVUlNrcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYm1GdFpWWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl1WVcxbExuTmxkQ2gwYUdsekxDQnVZVzFsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRTVCVFVWZlFWUlVVa2xDVlZSRkxDQjBhR2x6TG01aGJXVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGNJa0VnVUd4aGVXVnlJRzVsWldSeklHRWdibUZ0WlN3Z2QyaHBZMmdnYVhNZ1lTQlRkSEpwYm1jdVhDSXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYzJOdmNtVldZV3gxWlNBOUlIWmhiR2xrWVhSbExtbHVkR1ZuWlhJb2MyTnZjbVVnZkh3Z2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGS1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h6WTI5eVpWWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl6WTI5eVpTNXpaWFFvZEdocGN5d2djMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVTBOUFVrVmZRVlJVVWtsQ1ZWUkZMQ0IwYUdsekxuTmpiM0psS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUU5cllYa3VJRUVnY0d4aGVXVnlJR1J2WlhNZ2JtOTBJRzVsWldRZ2RHOGdhR0YyWlNCaElITmpiM0psTGx4dUlDQWdJQ0FnSUNBZ0lDQWdYM05qYjNKbExuTmxkQ2gwYUdsekxDQnVkV3hzS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0ZORFQxSkZYMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCb1lYTlVkWEp1Vm1Gc2RXVWdQU0IyWVd4cFpHRjBaUzVpYjI5c1pXRnVLR2hoYzFSMWNtNGdmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvU0VGVFgxUlZVazVmUVZSVVVrbENWVlJGS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzVwYzFSeWRXVW9LVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHaGhjMVIxY201V1lXeDFaUzVwYzFaaGJHbGtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2dhR0Z6VkhWeWJpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVc0lHaGhjMVIxY200cE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QydGhlU3dnUVNCd2JHRjVaWElnWkc5bGN5QnViM1FnWVd4M1lYbHpJR2hoZG1VZ1lTQjBkWEp1TGx4dUlDQWdJQ0FnSUNBZ0lDQWdYMmhoYzFSMWNtNHVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1NFRlRYMVJWVWs1ZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdRMDlNVDFKZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnVGtGTlJWOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCVFEwOVNSVjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVmNiaUFnSUNBZ0lDQWdYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmthWE5qYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJSEJzWVhsbGNpZHpJR052Ykc5eUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTFOMGNtbHVaMzFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWTI5c2IzSW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWTI5c2IzSXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ2NHeGhlV1Z5SjNNZ2JtRnRaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdFRkSEpwYm1kOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHNWhiV1VvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmJtRnRaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdocGN5QndiR0Y1WlhJbmN5QnpZMjl5WlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSE5qYjNKbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiblZzYkNBOVBUMGdYM05qYjNKbExtZGxkQ2gwYUdsektTQS9JREFnT2lCZmMyTnZjbVV1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnYzJOdmNtVW9ibVYzVTJOdmNtVXBJSHRjYmlBZ0lDQWdJQ0FnWDNOamIzSmxMbk5sZENoMGFHbHpMQ0J1WlhkVFkyOXlaU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUQwOVBTQnVaWGRUWTI5eVpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0ZORFQxSkZYMEZVVkZKSlFsVlVSU3dnYm1WM1UyTnZjbVVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1UzUmhjblFnWVNCMGRYSnVJR1p2Y2lCMGFHbHpJSEJzWVhsbGNpNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxUnZjRkJzWVhsbGNuMGdWR2hsSUhCc1lYbGxjaUIzYVhSb0lHRWdkSFZ5Ymx4dUlDQWdJQ0FxTDF4dUlDQWdJSE4wWVhKMFZIVnliaWdwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdWFYTkRiMjV1WldOMFpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11Y0dGeVpXNTBUbTlrWlM1a2FYTndZWFJqYUVWMlpXNTBLRzVsZHlCRGRYTjBiMjFGZG1WdWRDaGNJblJ2Y0RwemRHRnlkQzEwZFhKdVhDSXNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrWlhSaGFXdzZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHeGhlV1Z5T2lCMGFHbHpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvU0VGVFgxUlZVazVmUVZSVVVrbENWVlJGTENCMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1JXNWtJR0VnZEhWeWJpQm1iM0lnZEdocGN5QndiR0Y1WlhJdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWlc1a1ZIVnliaWdwSUh0Y2JpQWdJQ0FnSUNBZ1gyaGhjMVIxY200dWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRVJ2WlhNZ2RHaHBjeUJ3YkdGNVpYSWdhR0YyWlNCaElIUjFjbTQvWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdRbTl2YkdWaGJuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdhR0Z6VkhWeWJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVZ1BUMDlJRjlvWVhOVWRYSnVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJCSUZOMGNtbHVaeUJ5WlhCeVpYTmxiblJoZEdsdmJpQnZaaUIwYUdseklIQnNZWGxsY2l3Z2FHbHpJRzl5SUdobGNuTWdibUZ0WlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFOMGNtbHVaMzBnVkdobElIQnNZWGxsY2lkeklHNWhiV1VnY21Wd2NtVnpaVzUwY3lCMGFHVWdjR3hoZVdWeUlHRnpJR0VnYzNSeWFXNW5MbHh1SUNBZ0lDQXFMMXh1SUNBZ0lIUnZVM1J5YVc1bktDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZQ1I3ZEdocGN5NXVZVzFsZldBN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1NYTWdkR2hwY3lCd2JHRjVaWElnWlhGMVlXd2dZVzV2ZEdobGNpQndiR0Y1WlhJL1hHNGdJQ0FnSUNvZ1hHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VWIzQlFiR0Y1WlhKOUlHOTBhR1Z5SUMwZ1ZHaGxJRzkwYUdWeUlIQnNZWGxsY2lCMGJ5QmpiMjF3WVhKbElIUm9hWE1nY0d4aGVXVnlJSGRwZEdndVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1FtOXZiR1ZoYm4wZ1ZISjFaU0IzYUdWdUlHVnBkR2hsY2lCMGFHVWdiMkpxWldOMElISmxabVZ5Wlc1alpYTWdZWEpsSUhSb1pTQnpZVzFsWEc0Z0lDQWdJQ29nYjNJZ2QyaGxiaUJpYjNSb0lHNWhiV1VnWVc1a0lHTnZiRzl5SUdGeVpTQjBhR1VnYzJGdFpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbGNYVmhiSE1vYjNSb1pYSXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjMkZ0WlU1aGJXVWdQU0J2ZEdobGNpNXVZVzFsSUQwOVBTQjBhR2x6TG01aGJXVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElITmhiV1ZEYjJ4dmNpQTlJRzkwYUdWeUxtTnZiRzl5SUQwOVBTQjBhR2x6TG1OdmJHOXlPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiM1JvWlhJZ1BUMDlJSFJvYVhNZ2ZId2dLSE5oYldWT1lXMWxJQ1ltSUhOaGJXVkRiMnh2Y2lrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1ZDJsdVpHOTNMbU4xYzNSdmJVVnNaVzFsYm5SekxtUmxabWx1WlNoVVFVZGZUa0ZOUlN3Z1ZHOXdVR3hoZVdWeUtUdGNibHh1THlvcVhHNGdLaUJVYUdVZ1pHVm1ZWFZzZENCemVYTjBaVzBnY0d4aGVXVnlMaUJFYVdObElHRnlaU0IwYUhKdmQyNGdZbmtnWVNCd2JHRjVaWEl1SUVadmNpQnphWFIxWVhScGIyNXpYRzRnS2lCM2FHVnlaU0I1YjNVZ2QyRnVkQ0IwYnlCeVpXNWtaWElnWVNCaWRXNWphQ0J2WmlCa2FXTmxJSGRwZEdodmRYUWdibVZsWkdsdVp5QjBhR1VnWTI5dVkyVndkQ0J2WmlCUWJHRjVaWEp6WEc0Z0tpQjBhR2x6SUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVpQmpZVzRnWW1VZ1lTQnpkV0p6ZEdsMGRYUmxMaUJQWmlCamIzVnljMlVzSUdsbUlIbHZkU2RrSUd4cGEyVWdkRzljYmlBcUlHTm9ZVzVuWlNCMGFHVWdibUZ0WlNCaGJtUXZiM0lnZEdobElHTnZiRzl5TENCamNtVmhkR1VnWVc1a0lIVnpaU0I1YjNWeUlHOTNiaUJjSW5ONWMzUmxiU0J3YkdGNVpYSmNJaTVjYmlBcUlFQmpiMjV6ZEZ4dUlDb3ZYRzVqYjI1emRDQkVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklnUFNCdVpYY2dWRzl3VUd4aGVXVnlLSHRqYjJ4dmNqb2dYQ0p5WldSY0lpd2dibUZ0WlRvZ1hDSXFYQ0o5S1R0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWIzQlFiR0Y1WlhJc1hHNGdJQ0FnUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU0xGeHVJQ0FnSUZSQlIxOU9RVTFGTEZ4dUlDQWdJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSVnh1ZlR0Y2JpSXNJaThxS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRMQ0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVjYmk4dmFXMXdiM0owSUh0RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2k1cWMxd2lPMXh1YVcxd2IzSjBJSHRTWldGa1QyNXNlVUYwZEhKcFluVjBaWE45SUdaeWIyMGdYQ0l1TDIxcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjeTVxYzF3aU8xeHVhVzF3YjNKMElIdDJZV3hwWkdGMFpYMGdabkp2YlNCY0lpNHZkbUZzYVdSaGRHVXZkbUZzYVdSaGRHVXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeWZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1ZFRkhYMDVCVFVVZ1BTQmNJblJ2Y0Mxa2FXVmNJanRjYmx4dVkyOXVjM1FnUTBsU1EweEZYMFJGUjFKRlJWTWdQU0F6TmpBN0lDOHZJR1JsWjNKbFpYTmNibU52Ym5OMElFNVZUVUpGVWw5UFJsOVFTVkJUSUQwZ05qc2dMeThnUkdWbVlYVnNkQ0F2SUhKbFozVnNZWElnYzJsNElITnBaR1ZrSUdScFpTQm9ZWE1nTmlCd2FYQnpJRzFoZUdsdGRXMHVYRzVqYjI1emRDQkVSVVpCVlV4VVgwTlBURTlTSUQwZ1hDSkpkbTl5ZVZ3aU8xeHVZMjl1YzNRZ1JFVkdRVlZNVkY5WUlEMGdNRHNnTHk4Z2NIaGNibU52Ym5OMElFUkZSa0ZWVEZSZldTQTlJREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgxSlBWRUZVU1U5T0lEMGdNRHNnTHk4Z1pHVm5jbVZsYzF4dVkyOXVjM1FnUkVWR1FWVk1WRjlQVUVGRFNWUlpJRDBnTUM0MU8xeHVYRzVqYjI1emRDQkRUMHhQVWw5QlZGUlNTVUpWVkVVZ1BTQmNJbU52Ykc5eVhDSTdYRzVqYjI1emRDQklSVXhFWDBKWlgwRlVWRkpKUWxWVVJTQTlJRndpYUdWc1pDMWllVndpTzF4dVkyOXVjM1FnVUVsUVUxOUJWRlJTU1VKVlZFVWdQU0JjSW5CcGNITmNJanRjYm1OdmJuTjBJRkpQVkVGVVNVOU9YMEZVVkZKSlFsVlVSU0E5SUZ3aWNtOTBZWFJwYjI1Y0lqdGNibU52Ym5OMElGaGZRVlJVVWtsQ1ZWUkZJRDBnWENKNFhDSTdYRzVqYjI1emRDQlpYMEZVVkZKSlFsVlVSU0E5SUZ3aWVWd2lPMXh1WEc1amIyNXpkQ0JDUVZORlgwUkpSVjlUU1ZwRklEMGdNVEF3T3lBdkx5QndlRnh1WTI5dWMzUWdRa0ZUUlY5U1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdQU0F4TlRzZ0x5OGdjSGhjYm1OdmJuTjBJRUpCVTBWZlUxUlNUMHRGWDFkSlJGUklJRDBnTWk0MU95QXZMeUJ3ZUZ4dVkyOXVjM1FnVFVsT1gxTlVVazlMUlY5WFNVUlVTQ0E5SURFN0lDOHZJSEI0WEc1amIyNXpkQ0JJUVV4R0lEMGdRa0ZUUlY5RVNVVmZVMGxhUlNBdklESTdJQzh2SUhCNFhHNWpiMjV6ZENCVVNFbFNSQ0E5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF6T3lBdkx5QndlRnh1WTI5dWMzUWdVRWxRWDFOSldrVWdQU0JDUVZORlgwUkpSVjlUU1ZwRklDOGdNVFU3SUM4dmNIaGNibU52Ym5OMElGQkpVRjlEVDB4UFVpQTlJRndpWW14aFkydGNJanRjYmx4dVkyOXVjM1FnWkdWbk1uSmhaQ0E5SUNoa1pXY3BJRDArSUh0Y2JpQWdJQ0J5WlhSMWNtNGdaR1ZuSUNvZ0tFMWhkR2d1VUVrZ0x5QXhPREFwTzF4dWZUdGNibHh1WTI5dWMzUWdhWE5RYVhCT2RXMWlaWElnUFNCdUlEMCtJSHRjYmlBZ0lDQmpiMjV6ZENCdWRXMWlaWElnUFNCd1lYSnpaVWx1ZENodUxDQXhNQ2s3WEc0Z0lDQWdjbVYwZFhKdUlFNTFiV0psY2k1cGMwbHVkR1ZuWlhJb2JuVnRZbVZ5S1NBbUppQXhJRHc5SUc1MWJXSmxjaUFtSmlCdWRXMWlaWElnUEQwZ1RsVk5Ra1ZTWDA5R1gxQkpVRk03WEc1OU8xeHVYRzR2S2lwY2JpQXFJRWRsYm1WeVlYUmxJR0VnY21GdVpHOXRJRzUxYldKbGNpQnZaaUJ3YVhCeklHSmxkSGRsWlc0Z01TQmhibVFnZEdobElFNVZUVUpGVWw5UFJsOVFTVkJUTGx4dUlDcGNiaUFxSUVCeVpYUjFjbTV6SUh0T2RXMWlaWEo5SUVFZ2NtRnVaRzl0SUc1MWJXSmxjaUJ1TENBeElPS0pwQ0J1SU9LSnBDQk9WVTFDUlZKZlQwWmZVRWxRVXk1Y2JpQXFMMXh1WTI5dWMzUWdjbUZ1Wkc5dFVHbHdjeUE5SUNncElEMCtJRTFoZEdndVpteHZiM0lvVFdGMGFDNXlZVzVrYjIwb0tTQXFJRTVWVFVKRlVsOVBSbDlRU1ZCVEtTQXJJREU3WEc1Y2JtTnZibk4wSUVSSlJWOVZUa2xEVDBSRlgwTklRVkpCUTFSRlVsTWdQU0JiWENMaW1vQmNJaXhjSXVLYWdWd2lMRndpNHBxQ1hDSXNYQ0xpbW9OY0lpeGNJdUthaEZ3aUxGd2k0cHFGWENKZE8xeHVYRzR2S2lwY2JpQXFJRU52Ym5abGNuUWdZU0IxYm1samIyUmxJR05vWVhKaFkzUmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmthV1VnWm1GalpTQjBieUIwYUdVZ2JuVnRZbVZ5SUc5bUlIQnBjSE1nYjJaY2JpQXFJSFJvWVhRZ2MyRnRaU0JrYVdVdUlGUm9hWE1nWm5WdVkzUnBiMjRnYVhNZ2RHaGxJSEpsZG1WeWMyVWdiMllnY0dsd2MxUnZWVzVwWTI5a1pTNWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2RTQXRJRlJvWlNCMWJtbGpiMlJsSUdOb1lYSmhZM1JsY2lCMGJ5QmpiMjUyWlhKMElIUnZJSEJwY0hNdVhHNGdLaUJBY21WMGRYSnVjeUI3VG5WdFltVnlmSFZ1WkdWbWFXNWxaSDBnVkdobElHTnZjbkpsYzNCdmJtUnBibWNnYm5WdFltVnlJRzltSUhCcGNITXNJREVnNG9ta0lIQnBjSE1nNG9ta0lEWXNJRzl5WEc0Z0tpQjFibVJsWm1sdVpXUWdhV1lnZFNCM1lYTWdibTkwSUdFZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2NtVndjbVZ6Wlc1MGFXNW5JR0VnWkdsbExseHVJQ292WEc1amIyNXpkQ0IxYm1samIyUmxWRzlRYVhCeklEMGdLSFVwSUQwK0lIdGNiaUFnSUNCamIyNXpkQ0JrYVdWRGFHRnlTVzVrWlhnZ1BTQkVTVVZmVlU1SlEwOUVSVjlEU0VGU1FVTlVSVkpUTG1sdVpHVjRUMllvZFNrN1hHNGdJQ0FnY21WMGRYSnVJREFnUEQwZ1pHbGxRMmhoY2tsdVpHVjRJRDhnWkdsbFEyaGhja2x1WkdWNElDc2dNU0E2SUhWdVpHVm1hVzVsWkR0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUTI5dWRtVnlkQ0JoSUc1MWJXSmxjaUJ2WmlCd2FYQnpMQ0F4SU9LSnBDQndhWEJ6SU9LSnBDQTJJSFJ2SUdFZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhKY2JpQXFJSEpsY0hKbGMyVnVkR0YwYVc5dUlHOW1JSFJvWlNCamIzSnlaWE53YjI1a2FXNW5JR1JwWlNCbVlXTmxMaUJVYUdseklHWjFibU4wYVc5dUlHbHpJSFJvWlNCeVpYWmxjbk5sWEc0Z0tpQnZaaUIxYm1samIyUmxWRzlRYVhCekxseHVJQ3BjYmlBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCd0lDMGdWR2hsSUc1MWJXSmxjaUJ2WmlCd2FYQnpJSFJ2SUdOdmJuWmxjblFnZEc4Z1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpNWNiaUFxSUVCeVpYUjFjbTV6SUh0VGRISnBibWQ4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCMWJtbGpiMlJsSUdOb1lYSmhZM1JsY25NZ2IzSmNiaUFxSUhWdVpHVm1hVzVsWkNCcFppQndJSGRoY3lCdWIzUWdZbVYwZDJWbGJpQXhJR0Z1WkNBMklHbHVZMngxYzJsMlpTNWNiaUFxTDF4dVkyOXVjM1FnY0dsd2MxUnZWVzVwWTI5a1pTQTlJSEFnUFQ0Z2FYTlFhWEJPZFcxaVpYSW9jQ2tnUHlCRVNVVmZWVTVKUTA5RVJWOURTRUZTUVVOVVJWSlRXM0FnTFNBeFhTQTZJSFZ1WkdWbWFXNWxaRHRjYmx4dVkyOXVjM1FnY21WdVpHVnlTRzlzWkNBOUlDaGpiMjUwWlhoMExDQjRMQ0I1TENCM2FXUjBhQ3dnWTI5c2IzSXBJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQlRSVkJGVWtGVVQxSWdQU0IzYVdSMGFDQXZJRE13TzF4dUlDQWdJR052Ym5SbGVIUXVjMkYyWlNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1WjJ4dlltRnNRV3h3YUdFZ1BTQkVSVVpCVlV4VVgwOVFRVU5KVkZrN1hHNGdJQ0FnWTI5dWRHVjRkQzVpWldkcGJsQmhkR2dvS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbVpwYkd4VGRIbHNaU0E5SUdOdmJHOXlPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSGdnS3lCM2FXUjBhQ3dnZVNBcklIZHBaSFJvTENCM2FXUjBhQ0F0SUZORlVFVlNRVlJQVWl3Z01Dd2dNaUFxSUUxaGRHZ3VVRWtzSUdaaGJITmxLVHRjYmlBZ0lDQmpiMjUwWlhoMExtWnBiR3dvS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbkpsYzNSdmNtVW9LVHRjYm4wN1hHNWNibU52Ym5OMElISmxibVJsY2tScFpTQTlJQ2hqYjI1MFpYaDBMQ0I0TENCNUxDQjNhV1IwYUN3Z1kyOXNiM0lwSUQwK0lIdGNiaUFnSUNCamIyNXpkQ0JUUTBGTVJTQTlJQ2gzYVdSMGFDQXZJRWhCVEVZcE8xeHVJQ0FnSUdOdmJuTjBJRWhCVEVaZlNVNU9SVkpmVTBsYVJTQTlJRTFoZEdndWMzRnlkQ2gzYVdSMGFDQXFLaUF5SUM4Z01pazdYRzRnSUNBZ1kyOXVjM1FnU1U1T1JWSmZVMGxhUlNBOUlESWdLaUJJUVV4R1gwbE9Ua1ZTWDFOSldrVTdYRzRnSUNBZ1kyOXVjM1FnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVElEMGdRa0ZUUlY5U1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdLaUJUUTBGTVJUdGNiaUFnSUNCamIyNXpkQ0JKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnUFNCSlRrNUZVbDlUU1ZwRklDMGdNaUFxSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV6dGNiaUFnSUNCamIyNXpkQ0JUVkZKUFMwVmZWMGxFVkVnZ1BTQk5ZWFJvTG0xaGVDaE5TVTVmVTFSU1QwdEZYMWRKUkZSSUxDQkNRVk5GWDFOVVVrOUxSVjlYU1VSVVNDQXFJRk5EUVV4RktUdGNibHh1SUNBZ0lHTnZibk4wSUhOMFlYSjBXQ0E5SUhnZ0t5QjNhV1IwYUNBdElFaEJURVpmU1U1T1JWSmZVMGxhUlNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVenRjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRmtnUFNCNUlDc2dkMmxrZEdnZ0xTQklRVXhHWDBsT1RrVlNYMU5KV2tVN1hHNWNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtSmxaMmx1VUdGMGFDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiRk4wZVd4bElEMGdZMjlzYjNJN1hHNGdJQ0FnWTI5dWRHVjRkQzV6ZEhKdmEyVlRkSGxzWlNBOUlGd2lZbXhoWTJ0Y0lqdGNiaUFnSUNCamIyNTBaWGgwTG14cGJtVlhhV1IwYUNBOUlGTlVVazlMUlY5WFNVUlVTRHRjYmlBZ0lDQmpiMjUwWlhoMExtMXZkbVZVYnloemRHRnlkRmdzSUhOMFlYSjBXU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXNhVzVsVkc4b2MzUmhjblJZSUNzZ1NVNU9SVkpmVTBsYVJWOVNUMVZPUkVWRUxDQnpkR0Z5ZEZrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1WVhKaktITjBZWEowV0NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDd2djM1JoY25SWklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJR1JsWnpKeVlXUW9NamN3S1N3Z1pHVm5NbkpoWkNnd0tTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1c2FXNWxWRzhvYzNSaGNuUllJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUNzZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDQXJJRWxPVGtWU1gxTkpXa1ZmVWs5VlRrUkZSQ3dnYzNSaGNuUlpJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUNzZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0JTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lHUmxaekp5WVdRb01Da3NJR1JsWnpKeVlXUW9PVEFwS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnc0lITjBZWEowV1NBcklFbE9Ua1ZTWDFOSldrVXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDd2djM1JoY25SWklDc2dTVTVPUlZKZlUwbGFSVjlTVDFWT1JFVkVJQ3NnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUdSbFp6SnlZV1FvT1RBcExDQmtaV2N5Y21Ga0tERTRNQ2twTzF4dUlDQWdJR052Ym5SbGVIUXViR2x1WlZSdktITjBZWEowV0NBdElGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnYzNSaGNuUlpJQ3NnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVEtUdGNiaUFnSUNCamIyNTBaWGgwTG1GeVl5aHpkR0Z5ZEZnc0lITjBZWEowV1NBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQmtaV2N5Y21Ga0tERTRNQ2tzSUdSbFp6SnlZV1FvTWpjd0tTazdYRzVjYmlBZ0lDQmpiMjUwWlhoMExuTjBjbTlyWlNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Wm1sc2JDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdWNtVnpkRzl5WlNncE8xeHVmVHRjYmx4dVkyOXVjM1FnY21WdVpHVnlVR2x3SUQwZ0tHTnZiblJsZUhRc0lIZ3NJSGtzSUhkcFpIUm9LU0E5UGlCN1hHNGdJQ0FnWTI5dWRHVjRkQzV6WVhabEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aVpXZHBibEJoZEdnb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1acGJHeFRkSGxzWlNBOUlGQkpVRjlEVDB4UFVqdGNiaUFnSUNCamIyNTBaWGgwTG0xdmRtVlVieWg0TENCNUtUdGNiaUFnSUNCamIyNTBaWGgwTG1GeVl5aDRMQ0I1TENCM2FXUjBhQ3dnTUN3Z01pQXFJRTFoZEdndVVFa3NJR1poYkhObEtUdGNiaUFnSUNCamIyNTBaWGgwTG1acGJHd29LVHRjYmlBZ0lDQmpiMjUwWlhoMExuSmxjM1J2Y21Vb0tUdGNibjA3WEc1Y2JseHVMeThnVUhKcGRtRjBaU0J3Y205d1pYSjBhV1Z6WEc1amIyNXpkQ0JmWW05aGNtUWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyTnZiRzl5SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlvWld4a1Fua2dQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzQnBjSE1nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZEdGMGFXOXVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOTRJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOTVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibHh1THlvcVhHNGdLaUJVYjNCRWFXVWdhWE1nZEdobElGd2lkRzl3TFdScFpWd2lJR04xYzNSdmJTQmJTRlJOVEZ4dUlDb2daV3hsYldWdWRGMG9hSFIwY0hNNkx5OWtaWFpsYkc5d1pYSXViVzk2YVd4c1lTNXZjbWN2Wlc0dFZWTXZaRzlqY3k5WFpXSXZRVkJKTDBoVVRVeEZiR1Z0Wlc1MEtTQnlaWEJ5WlhObGJuUnBibWNnWVNCa2FXVmNiaUFxSUc5dUlIUm9aU0JrYVdObElHSnZZWEprTGx4dUlDcGNiaUFxSUVCbGVIUmxibVJ6SUVoVVRVeEZiR1Z0Wlc1MFhHNGdLaUJBYldsNFpYTWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JtTnZibk4wSUZSdmNFUnBaU0E5SUdOc1lYTnpJR1Y0ZEdWdVpITWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpLRWhVVFV4RmJHVnRaVzUwS1NCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1JHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFBZbXBsWTNSOUlGdGpiMjVtYVdjZ1BTQjdmVjBnTFNCVWFHVWdhVzVwZEdsaGJDQmpiMjVtYVdkMWNtRjBhVzl1SUc5bUlIUm9aU0JrYVdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo4Ym5Wc2JIMGdXMk52Ym1acFp5NXdhWEJ6WFNBdElGUm9aU0J3YVhCeklHOW1JSFJvWlNCa2FXVWdkRzhnWVdSa0xseHVJQ0FnSUNBcUlFbG1JRzV2SUhCcGNITWdZWEpsSUhOd1pXTnBabWxsWkNCdmNpQjBhR1VnY0dsd2N5QmhjbVVnYm05MElHSmxkSGRsWlc0Z01TQmhibVFnTml3Z1lTQnlZVzVrYjIxY2JpQWdJQ0FnS2lCdWRXMWlaWElnWW1WMGQyVmxiaUF4SUdGdVpDQTJJR2x6SUdkbGJtVnlZWFJsWkNCcGJuTjBaV0ZrTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VTNSeWFXNW5mU0JiWTI5dVptbG5MbU52Ykc5eVhTQXRJRlJvWlNCamIyeHZjaUJ2WmlCMGFHVWdaR2xsSUhSdklHRmtaQzRnUkdWbVlYVnNkRnh1SUNBZ0lDQXFJSFJ2SUhSb1pTQmtaV1poZFd4MElHTnZiRzl5TGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JiWTI5dVptbG5MbmhkSUMwZ1ZHaGxJSGdnWTI5dmNtUnBibUYwWlNCdlppQjBhR1VnWkdsbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCYlkyOXVabWxuTG5sZElDMGdWR2hsSUhrZ1kyOXZjbVJwYm1GMFpTQnZaaUIwYUdVZ1pHbGxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmJZMjl1Wm1sbkxuSnZkR0YwYVc5dVhTQXRJRlJvWlNCeWIzUmhkR2x2YmlCdlppQjBhR1VnWkdsbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdVR3hoZVdWeWZTQmJZMjl1Wm1sbkxtaGxiR1JDZVYwZ0xTQlVhR1VnY0d4aGVXVnlJR2h2YkdScGJtY2dkR2hsSUdScFpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaDdjR2x3Y3l3Z1kyOXNiM0lzSUhKdmRHRjBhVzl1TENCNExDQjVMQ0JvWld4a1FubDlJRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQndhWEJ6Vm1Gc2RXVWdQU0IyWVd4cFpHRjBaUzVwYm5SbFoyVnlLSEJwY0hNZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9VRWxRVTE5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1KbGRIZGxaVzRvTVN3Z05pbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b2NtRnVaRzl0VUdsd2N5Z3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dVhHNGdJQ0FnSUNBZ0lGOXdhWEJ6TG5ObGRDaDBhR2x6TENCd2FYQnpWbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaFFTVkJUWDBGVVZGSkpRbFZVUlN3Z2NHbHdjMVpoYkhWbEtUdGNibHh1SUNBZ0lDQWdJQ0IwYUdsekxtTnZiRzl5SUQwZ2RtRnNhV1JoZEdVdVkyOXNiM0lvWTI5c2IzSWdmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNWtaV1poZFd4MFZHOG9SRVZHUVZWTVZGOURUMHhQVWlsY2JpQWdJQ0FnSUNBZ0lDQWdJQzUyWVd4MVpUdGNibHh1SUNBZ0lDQWdJQ0IwYUdsekxuSnZkR0YwYVc5dUlEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaHliM1JoZEdsdmJpQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hTVDFSQlZFbFBUbDlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbUpsZEhkbFpXNG9NQ3dnTXpZd0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnloRVJVWkJWVXhVWDFKUFZFRlVTVTlPS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWVDQTlJSFpoYkdsa1lYUmxMbWx1ZEdWblpYSW9lQ0I4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoWVgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJHRnlaMlZ5VkdoaGJpZ3dLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgxZ3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTU1SUQwZ2RtRnNhV1JoZEdVdWFXNTBaV2RsY2loNUlIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRmxmUVZSVVVrbENWVlJGS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzVzWVhKblpYSlVhR0Z1S0RBcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WkdWbVlYVnNkRlJ2S0VSRlJrRlZURlJmV1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzUyWVd4MVpUdGNibHh1SUNBZ0lDQWdJQ0F2THlCVWIyUnZPaUIyWVd4cFpHRjBaU0IwYUdGMElGUnZjRkJzWVhsbGNpQnBjeUJ2YmlCMGFHVWdjMkZ0WlNCaWIyRnlaQ0JoY3lCRWFXVS9YRzRnSUNBZ0lDQWdJSFJvYVhNdWFHVnNaRUo1SUQwZ2FHVnNaRUo1SUdsdWMzUmhibU5sYjJZZ1ZHOXdVR3hoZVdWeUlEOGdhR1ZzWkVKNUlEb2daRzlqZFcxbGJuUXVjWFZsY25sVFpXeGxZM1J2Y2loMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVJVeEVYMEpaWDBGVVZGSkpRbFZVUlNrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhOMFlYUnBZeUJuWlhRZ2IySnpaWEoyWldSQmRIUnlhV0oxZEdWektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdXMXh1SUNBZ0lDQWdJQ0FnSUNBZ1EwOU1UMUpmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdTRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCUVNWQlRYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGSlBWRUZVU1U5T1gwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZoZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnV1Y5QlZGUlNTVUpWVkVWY2JpQWdJQ0FnSUNBZ1hUdGNiaUFnSUNCOVhHNWNiaUFnSUNCamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNBZ0lDQWdYMkp2WVhKa0xuTmxkQ2gwYUdsekxDQjBhR2x6TG5CaGNtVnVkRTV2WkdVcE8xeHVJQ0FnSUNBZ0lDQmZZbTloY21RdVoyVjBLSFJvYVhNcExtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFVjJaVzUwS0Z3aWRHOXdMV1JwWlRwaFpHUmxaRndpS1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWkdselkyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ0lDQWdJRjlpYjJGeVpDNW5aWFFvZEdocGN5a3VaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dSWFpsYm5Rb1hDSjBiM0F0WkdsbE9uSmxiVzkyWldSY0lpa3BPMXh1SUNBZ0lDQWdJQ0JmWW05aGNtUXVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ2RHaHBjeUJFYVdVZ2RHOGdkR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSWdiMllnWVNCa2FXVWdabUZqWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFOMGNtbHVaMzBnVkdobElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlHTnZjbkpsYzNCdmJtUnBibWNnZEc4Z2RHaGxJRzUxYldKbGNpQnZabHh1SUNBZ0lDQXFJSEJwY0hNZ2IyWWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHOVZibWxqYjJSbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjR2x3YzFSdlZXNXBZMjlrWlNoMGFHbHpMbkJwY0hNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElITjBjbWx1WnlCeVpYQnlaWE5sYm1GMGFXOXVJR1p2Y2lCMGFHbHpJR1JwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFOMGNtbHVaMzBnVkdobElIVnVhV052WkdVZ2MzbHRZbTlzSUdOdmNuSmxjM0J2Ym1ScGJtY2dkRzhnZEdobElHNTFiV0psY2lCdlppQndhWEJ6WEc0Z0lDQWdJQ29nYjJZZ2RHaHBjeUJrYVdVdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnZEc5VGRISnBibWNvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMblJ2Vlc1cFkyOWtaU2dwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb2FYTWdSR2xsSjNNZ2JuVnRZbVZ5SUc5bUlIQnBjSE1zSURFZzRvbWtJSEJwY0hNZzRvbWtJRFl1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQndhWEJ6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gzQnBjSE11WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb2FYTWdSR2xsSjNNZ1kyOXNiM0l1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdVM1J5YVc1bmZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmpiMnh2Y2lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOWpiMnh2Y2k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCamIyeHZjaWh1WlhkRGIyeHZjaWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBUMGdibVYzUTI5c2IzSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRU5QVEU5U1gwRlVWRkpKUWxWVVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCZlkyOXNiM0l1YzJWMEtIUm9hWE1zSUVSRlJrRlZURlJmUTA5TVQxSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gyTnZiRzl5TG5ObGRDaDBhR2x6TENCdVpYZERiMnh2Y2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXNJRzVsZDBOdmJHOXlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJSEJzWVhsbGNpQjBhR0YwSUdseklHaHZiR1JwYm1jZ2RHaHBjeUJFYVdVc0lHbG1JR0Z1ZVM0Z1RuVnNiQ0J2ZEdobGNuZHBjMlV1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdWRzl3VUd4aGVXVnlmRzUxYkd4OUlGeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQm9aV3hrUW5rb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZhR1ZzWkVKNUxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNGdJQ0FnYzJWMElHaGxiR1JDZVNod2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ1gyaGxiR1JDZVM1elpYUW9kR2hwY3l3Z2NHeGhlV1Z5S1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJSEJzWVhsbGNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9YQ0pvWld4a0xXSjVYQ0lwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9YQ0pvWld4a0xXSjVYQ0lzSUhCc1lYbGxjaTUwYjFOMGNtbHVaeWdwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JqYjI5eVpHbHVZWFJsY3lCdlppQjBhR2x6SUVScFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0RGIyOXlaR2x1WVhSbGMzeHVkV3hzZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyOXlaR2x1WVhSbGN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzUxYkd3Z1BUMDlJSFJvYVhNdWVDQjhmQ0J1ZFd4c0lEMDlQU0IwYUdsekxua2dQeUJ1ZFd4c0lEb2dlM2c2SUhSb2FYTXVlQ3dnZVRvZ2RHaHBjeTU1ZlR0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUdOdmIzSmthVzVoZEdWektHTXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlHTXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZUNBOUlHNTFiR3c3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5rZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlY3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCak8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NTRJRDBnZUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWVTQTlJSGs3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdlQ0JqYjI5eVpHbHVZWFJsWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQjRLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNndVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2VDaHVaWGRZS1NCN1hHNGdJQ0FnSUNBZ0lGOTRMbk5sZENoMGFHbHpMQ0J1WlhkWUtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9YQ0o0WENJc0lHNWxkMWdwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQjVJR052YjNKa2FXNWhkR1ZjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElIa29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmZVM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCNUtHNWxkMWtwSUh0Y2JpQWdJQ0FnSUNBZ1gza3VjMlYwS0hSb2FYTXNJRzVsZDFrcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaGNJbmxjSWl3Z2JtVjNXU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElISnZkR0YwYVc5dUlHOW1JSFJvYVhNZ1JHbGxMaUF3SU9LSnBDQnliM1JoZEdsdmJpRGlpYVFnTXpZd0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbnh1ZFd4c2ZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnliM1JoZEdsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjl5YjNSaGRHbHZiaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0J5YjNSaGRHbHZiaWh1WlhkU0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJRDA5UFNCdVpYZFNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hjSW5KdmRHRjBhVzl1WENJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdibTl5YldGc2FYcGxaRkp2ZEdGMGFXOXVJRDBnYm1WM1VpQWxJRU5KVWtOTVJWOUVSVWRTUlVWVE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNKdmRHRjBhVzl1TG5ObGRDaDBhR2x6TENCdWIzSnRZV3hwZW1Wa1VtOTBZWFJwYjI0cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKeWIzUmhkR2x2Ymx3aUxDQnViM0p0WVd4cGVtVmtVbTkwWVhScGIyNHBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdoeWIzY2dkR2hwY3lCRWFXVXVJRlJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjeUIwYnlCaElISmhibVJ2YlNCdWRXMWlaWElnYml3Z01TRGlpYVFnYmlEaWlhUWdOaTVjYmlBZ0lDQWdLaUJQYm14NUlHUnBZMlVnZEdoaGRDQmhjbVVnYm05MElHSmxhVzVuSUdobGJHUWdZMkZ1SUdKbElIUm9jbTkzYmk1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCbWFYSmxjeUJjSW5SdmNEcDBhSEp2ZHkxa2FXVmNJaUIzYVhSb0lIQmhjbUZ0WlhSbGNuTWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHaHliM2RKZENncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0NGMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZjR2x3Y3k1elpYUW9kR2hwY3l3Z2NtRnVaRzl0VUdsd2N5Z3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGQkpVRk5mUVZSVVVrbENWVlJGTENCMGFHbHpMbkJwY0hNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWthWE53WVhSamFFVjJaVzUwS0c1bGR5QkRkWE4wYjIxRmRtVnVkQ2hjSW5SdmNEcDBhSEp2ZHkxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5SUdodmJHUnpJSFJvYVhNZ1JHbGxMaUJCSUhCc1lYbGxjaUJqWVc0Z2IyNXNlU0JvYjJ4a0lHRWdaR2xsSUhSb1lYUWdhWE1nYm05MFhHNGdJQ0FnSUNvZ1ltVnBibWNnYUdWc1pDQmllU0JoYm05MGFHVnlJSEJzWVhsbGNpQjVaWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0ZCc1lYbGxjbjBnY0d4aGVXVnlJQzBnVkdobElIQnNZWGxsY2lCM2FHOGdkMkZ1ZEhNZ2RHOGdhRzlzWkNCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2lCQVptbHlaWE1nWENKMGIzQTZhRzlzWkMxa2FXVmNJaUIzYVhSb0lIQmhjbUZ0WlhSbGNuTWdkR2hwY3lCRWFXVWdZVzVrSUhSb1pTQndiR0Y1WlhJdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnYUc5c1pFbDBLSEJzWVhsbGNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb0lYUm9hWE11YVhOSVpXeGtLQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWFHVnNaRUo1SUQwZ2NHeGhlV1Z5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1a2FYTndZWFJqYUVWMlpXNTBLRzVsZHlCRGRYTjBiMjFGZG1WdWRDaGNJblJ2Y0Rwb2IyeGtMV1JwWlZ3aUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR1YwWVdsc09pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdScFpUb2dkR2hwY3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR3hoZVdWeVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dTWE1nZEdocGN5QkVhV1VnWW1WcGJtY2dhR1ZzWkNCaWVTQmhibmtnY0d4aGVXVnlQMXh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdRbTl2YkdWaGJuMGdWSEoxWlNCM2FHVnVJSFJvYVhNZ1JHbGxJR2x6SUdKbGFXNW5JR2hsYkdRZ1lua2dZVzU1SUhCc1lYbGxjaXdnWm1Gc2MyVWdiM1JvWlhKM2FYTmxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHbHpTR1ZzWkNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnSVQwOUlIUm9hWE11YUdWc1pFSjVPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCd2JHRjVaWElnY21Wc1pXRnpaWE1nZEdocGN5QkVhV1V1SUVFZ2NHeGhlV1Z5SUdOaGJpQnZibXg1SUhKbGJHVmhjMlVnWkdsalpTQjBhR0YwSUhOb1pTQnBjMXh1SUNBZ0lDQXFJR2h2YkdScGJtY3VYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRkJzWVhsbGNuMGdjR3hoZVdWeUlDMGdWR2hsSUhCc1lYbGxjaUIzYUc4Z2QyRnVkSE1nZEc4Z2NtVnNaV0Z6WlNCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2lCQVptbHlaWE1nWENKMGIzQTZjbVZzWVhObExXUnBaVndpSUhkcGRHZ2djR0Z5WVcxbGRHVnljeUIwYUdseklFUnBaU0JoYm1RZ2RHaGxJSEJzWVhsbGNpQnlaV3hsWVhOcGJtY2dhWFF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdjbVZzWldGelpVbDBLSEJzWVhsbGNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTVwYzBobGJHUW9LU0FtSmlCMGFHbHpMbWhsYkdSQ2VTNWxjWFZoYkhNb2NHeGhlV1Z5S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NW9aV3hrUW5rZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1a2FYTndZWFJqYUVWMlpXNTBLRzVsZHlCRGRYTjBiMjFGZG1WdWRDaGNJblJ2Y0RweVpXeGxZWE5sTFdScFpWd2lMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdWMFlXbHNPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBaVG9nZEdocGN5eGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0d4aGVXVnlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVW1WdVpHVnlJSFJvYVhNZ1JHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdERZVzUyWVhOU1pXNWtaWEpwYm1kRGIyNTBaWGgwTWtSOUlHTnZiblJsZUhRZ0xTQlVhR1VnWTJGdWRtRnpJR052Ym5SbGVIUWdkRzhnWkhKaGQxeHVJQ0FnSUNBcUlHOXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHUnBaVk5wZW1VZ0xTQlVhR1VnYzJsNlpTQnZaaUJoSUdScFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ1cyTnZiM0prYVc1aGRHVnpJRDBnZEdocGN5NWpiMjl5WkdsdVlYUmxjMTBnTFNCVWFHVWdZMjl2Y21ScGJtRjBaWE1nZEc5Y2JpQWdJQ0FnS2lCa2NtRjNJSFJvYVhNZ1pHbGxMaUJDZVNCa1pXWmhkV3gwTENCMGFHbHpJR1JwWlNCcGN5QmtjbUYzYmlCaGRDQnBkSE1nYjNkdUlHTnZiM0prYVc1aGRHVnpMRnh1SUNBZ0lDQXFJR0oxZENCNWIzVWdZMkZ1SUdGc2MyOGdaSEpoZHlCcGRDQmxiSE5sZDJobGNtVWdhV1lnYzI4Z2JtVmxaR1ZrTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSEpsYm1SbGNpaGpiMjUwWlhoMExDQmthV1ZUYVhwbExDQmpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYzJOaGJHVWdQU0JrYVdWVGFYcGxJQzhnUWtGVFJWOUVTVVZmVTBsYVJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1UwaEJURVlnUFNCSVFVeEdJQ29nYzJOaGJHVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTlVTRWxTUkNBOUlGUklTVkpFSUNvZ2MyTmhiR1U3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRk5RU1ZCZlUwbGFSU0E5SUZCSlVGOVRTVnBGSUNvZ2MyTmhiR1U3WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZTNnc0lIbDlJRDBnWTI5dmNtUnBibUYwWlhNN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSb2FYTXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2todmJHUW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z1UwaEJURVlzSUhSb2FYTXVhR1ZzWkVKNUxtTnZiRzl5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNnd0lDRTlQU0IwYUdsekxuSnZkR0YwYVc5dUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5SeVlXNXpiR0YwWlNoNElDc2dVMGhCVEVZc0lIa2dLeUJUU0VGTVJpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5KdmRHRjBaU2hrWldjeWNtRmtLSFJvYVhNdWNtOTBZWFJwYjI0cEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1ZEhKaGJuTnNZWFJsS0MweElDb2dLSGdnS3lCVFNFRk1SaWtzSUMweElDb2dLSGtnS3lCVFNFRk1SaWtwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVZ1WkdWeVJHbGxLR052Ym5SbGVIUXNJSGdzSUhrc0lGTklRVXhHTENCMGFHbHpMbU52Ykc5eUtUdGNibHh1SUNBZ0lDQWdJQ0J6ZDJsMFkyZ2dLSFJvYVhNdWNHbHdjeWtnZTF4dUlDQWdJQ0FnSUNCallYTmxJREU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UwaEJURVlzSUhrZ0t5QlRTRUZNUml3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdNam9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBek9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UwaEJURVlzSUhrZ0t5QlRTRUZNUml3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURRNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdOVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQTJPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UwaEJURVlzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JrWldaaGRXeDBPaUF2THlCT2J5QnZkR2hsY2lCMllXeDFaWE1nWVd4c2IzZGxaQ0F2SUhCdmMzTnBZbXhsWEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUJEYkdWaGNpQmpiMjUwWlhoMFhHNGdJQ0FnSUNBZ0lHTnZiblJsZUhRdWMyVjBWSEpoYm5ObWIzSnRLREVzSURBc0lEQXNJREVzSURBc0lEQXBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JuZHBibVJ2ZHk1amRYTjBiMjFGYkdWdFpXNTBjeTVrWldacGJtVW9WRUZIWDA1QlRVVXNJRlJ2Y0VScFpTazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWRzl3UkdsbExGeHVJQ0FnSUhWdWFXTnZaR1ZVYjFCcGNITXNYRzRnSUNBZ2NHbHdjMVJ2Vlc1cFkyOWtaU3hjYmlBZ0lDQlVRVWRmVGtGTlJWeHVmVHRjYmlJc0lpOHFLbHh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNExDQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UwUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVaXdnVkVGSFgwNUJUVVVnWVhNZ1ZFOVFYMUJNUVZsRlVuMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlMbXB6WENJN1hHNWNibU52Ym5OMElGUkJSMTlPUVUxRklEMGdYQ0owYjNBdGNHeGhlV1Z5TFd4cGMzUmNJanRjYmx4dUx5b3FYRzRnS2lCVWIzQlFiR0Y1WlhKTWFYTjBJSFJ2SUdSbGMyTnlhV0psSUhSb1pTQndiR0Y1WlhKeklHbHVJSFJvWlNCbllXMWxMbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpOWNibU52Ym5OMElGUnZjRkJzWVhsbGNreHBjM1FnUFNCamJHRnpjeUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwSUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJVYjNCUWJHRjVaWEpNYVhOMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtDa2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStQU0IwYUdsekxuQnNZWGxsY25NdWJHVnVaM1JvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtRndjR1Z1WkVOb2FXeGtLRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWlrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0IwYUdsekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSjBiM0E2YzNSaGNuUXRkSFZ5Ymx3aUxDQW9aWFpsYm5RcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRTl1YkhrZ2IyNWxJSEJzWVhsbGNpQmpZVzRnYUdGMlpTQmhJSFIxY200Z1lYUWdZVzU1SUdkcGRtVnVJSFJwYldVdVhHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuQnNZWGxsY25OY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdVptbHNkR1Z5S0hBZ1BUNGdJWEF1WlhGMVlXeHpLR1YyWlc1MExtUmxkR0ZwYkM1d2JHRjVaWElwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM1bWIzSkZZV05vS0hBZ1BUNGdjQzVsYm1SVWRYSnVLQ2twTzF4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCa2FYTmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5Y3lCcGJpQjBhR2x6SUd4cGMzUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeVcxMTlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSEJzWVhsbGNuTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiTGk0dWRHaHBjeTVuWlhSRmJHVnRaVzUwYzBKNVZHRm5UbUZ0WlNoVVQxQmZVRXhCV1VWU0tWMDdYRzRnSUNBZ2ZWeHVmVHRjYmx4dWQybHVaRzkzTG1OMWMzUnZiVVZzWlcxbGJuUnpMbVJsWm1sdVpTaFVRVWRmVGtGTlJTd2dWRzl3VUd4aGVXVnlUR2x6ZENrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZHOXdVR3hoZVdWeVRHbHpkQ3hjYmlBZ0lDQlVRVWRmVGtGTlJWeHVmVHRjYmlJc0lpOHFLbHh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNExDQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNHZMMmx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1IzSnBaRXhoZVc5MWRIMGdabkp2YlNCY0lpNHZSM0pwWkV4aGVXOTFkQzVxYzF3aU8xeHVhVzF3YjNKMElIdFViM0JFYVdVc0lGUkJSMTlPUVUxRklHRnpJRlJQVUY5RVNVVjlJR1p5YjIwZ1hDSXVMMVJ2Y0VScFpTNXFjMXdpTzF4dWFXMXdiM0owSUh0RVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSXNJRlJ2Y0ZCc1lYbGxjaXdnVkVGSFgwNUJUVVVnWVhNZ1ZFOVFYMUJNUVZsRlVpd2dTRUZUWDFSVlVrNWZRVlJVVWtsQ1ZWUkZmU0JtY205dElGd2lMaTlVYjNCUWJHRjVaWEl1YW5OY0lqdGNibWx0Y0c5eWRDQjdWRUZIWDA1QlRVVWdZWE1nVkU5UVgxQk1RVmxGVWw5TVNWTlVmU0JtY205dElGd2lMaTlVYjNCUWJHRjVaWEpNYVhOMExtcHpYQ0k3WEc1cGJYQnZjblFnZTNaaGJHbGtZWFJsZlNCbWNtOXRJRndpTGk5MllXeHBaR0YwWlM5MllXeHBaR0YwWlM1cWMxd2lPMXh1WEc1amIyNXpkQ0JVUVVkZlRrRk5SU0E5SUZ3aWRHOXdMV1JwWTJVdFltOWhjbVJjSWp0Y2JseHVZMjl1YzNRZ1JFVkdRVlZNVkY5RVNVVmZVMGxhUlNBOUlERXdNRHNnTHk4Z2NIaGNibU52Ym5OMElFUkZSa0ZWVEZSZlNFOU1SRjlFVlZKQlZFbFBUaUE5SURNM05Uc2dMeThnYlhOY2JtTnZibk4wSUVSRlJrRlZURlJmUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJDQTlJR1poYkhObE8xeHVZMjl1YzNRZ1JFVkdRVlZNVkY5SVQweEVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUWdQU0JtWVd4elpUdGNibU52Ym5OMElFUkZSa0ZWVEZSZlVrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ0E5SUdaaGJITmxPMXh1WEc1amIyNXpkQ0JTVDFkVElEMGdNVEE3WEc1amIyNXpkQ0JEVDB4VElEMGdNVEE3WEc1Y2JtTnZibk4wSUVSRlJrRlZURlJmVjBsRVZFZ2dQU0JEVDB4VElDb2dSRVZHUVZWTVZGOUVTVVZmVTBsYVJUc2dMeThnY0hoY2JtTnZibk4wSUVSRlJrRlZURlJmU0VWSlIwaFVJRDBnVWs5WFV5QXFJRVJGUmtGVlRGUmZSRWxGWDFOSldrVTdJQzh2SUhCNFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBSSlUxQkZVbE5KVDA0Z1BTQk5ZWFJvTG1ac2IyOXlLRkpQVjFNZ0x5QXlLVHRjYmx4dVkyOXVjM1FnVFVsT1gwUkZURlJCSUQwZ016c2dMeTl3ZUZ4dVhHNWpiMjV6ZENCWFNVUlVTRjlCVkZSU1NVSlZWRVVnUFNCY0luZHBaSFJvWENJN1hHNWpiMjV6ZENCSVJVbEhTRlJmUVZSVVVrbENWVlJGSUQwZ1hDSm9aV2xuYUhSY0lqdGNibU52Ym5OMElFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZJRDBnWENKa2FYTndaWEp6YVc5dVhDSTdYRzVqYjI1emRDQkVTVVZmVTBsYVJWOUJWRlJTU1VKVlZFVWdQU0JjSW1ScFpTMXphWHBsWENJN1hHNWpiMjV6ZENCRVVrRkhSMGxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU0E5SUZ3aVpISmhaMmRwYm1jdFpHbGpaUzFrYVhOaFlteGxaRndpTzF4dVkyOXVjM1FnU0U5TVJFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTQTlJRndpYUc5c1pHbHVaeTFrYVdObExXUnBjMkZpYkdWa1hDSTdYRzVqYjI1emRDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlNBOUlGd2ljbTkwWVhScGJtY3RaR2xqWlMxa2FYTmhZbXhsWkZ3aU8xeHVZMjl1YzNRZ1NFOU1SRjlFVlZKQlZFbFBUbDlCVkZSU1NVSlZWRVVnUFNCY0ltaHZiR1F0WkhWeVlYUnBiMjVjSWp0Y2JseHVZMjl1YzNRZ2NHRnljMlZPZFcxaVpYSWdQU0FvYm5WdFltVnlVM1J5YVc1bkxDQmtaV1poZFd4MFRuVnRZbVZ5SUQwZ01Da2dQVDRnZTF4dUlDQWdJR052Ym5OMElHNTFiV0psY2lBOUlIQmhjbk5sU1c1MEtHNTFiV0psY2xOMGNtbHVaeXdnTVRBcE8xeHVJQ0FnSUhKbGRIVnliaUJPZFcxaVpYSXVhWE5PWVU0b2JuVnRZbVZ5S1NBL0lHUmxabUYxYkhST2RXMWlaWElnT2lCdWRXMWlaWEk3WEc1OU8xeHVYRzVqYjI1emRDQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpQTlJQ2h1ZFcxaVpYSlRkSEpwYm1jc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUIyWVd4cFpHRjBaUzVwYm5SbFoyVnlLRzUxYldKbGNsTjBjbWx1WnlsY2JpQWdJQ0FnSUNBZ0xteGhjbWRsY2xSb1lXNG9NQ2xjYmlBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnloa1pXWmhkV3gwVm1Gc2RXVXBYRzRnSUNBZ0lDQWdJQzUyWVd4MVpUdGNibjA3WEc1Y2JtTnZibk4wSUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsSUQwZ0tHVnNaVzFsYm5Rc0lHNWhiV1VzSUdSbFptRjFiSFJXWVd4MVpTa2dQVDRnZTF4dUlDQWdJR2xtSUNobGJHVnRaVzUwTG1oaGMwRjBkSEpwWW5WMFpTaHVZVzFsS1NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCMllXeDFaVk4wY21sdVp5QTlJR1ZzWlcxbGJuUXVaMlYwUVhSMGNtbGlkWFJsS0c1aGJXVXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSW9kbUZzZFdWVGRISnBibWNzSUdSbFptRjFiSFJXWVd4MVpTazdYRzRnSUNBZ2ZWeHVJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNTlPMXh1WEc1amIyNXpkQ0JuWlhSQ2IyOXNaV0Z1SUQwZ0tHSnZiMnhsWVc1VGRISnBibWNzSUhSeWRXVldZV3gxWlN3Z1pHVm1ZWFZzZEZaaGJIVmxLU0E5UGlCN1hHNGdJQ0FnYVdZZ0tIUnlkV1ZXWVd4MVpTQTlQVDBnWW05dmJHVmhibE4wY21sdVp5QjhmQ0JjSW5SeWRXVmNJaUE5UFQwZ1ltOXZiR1ZoYmxOMGNtbHVaeWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tGd2labUZzYzJWY0lpQTlQVDBnWW05dmJHVmhibE4wY21sdVp5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1JsWm1GMWJIUldZV3gxWlR0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVqYjI1emRDQm5aWFJDYjI5c1pXRnVRWFIwY21saWRYUmxJRDBnS0dWc1pXMWxiblFzSUc1aGJXVXNJR1JsWm1GMWJIUldZV3gxWlNrZ1BUNGdlMXh1SUNBZ0lHbG1JQ2hsYkdWdFpXNTBMbWhoYzBGMGRISnBZblYwWlNodVlXMWxLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IyWVd4MVpWTjBjbWx1WnlBOUlHVnNaVzFsYm5RdVoyVjBRWFIwY21saWRYUmxLRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBRbTl2YkdWaGJpaDJZV3gxWlZOMGNtbHVaeXdnVzNaaGJIVmxVM1J5YVc1bkxDQmNJblJ5ZFdWY0lsMHNJRnRjSW1aaGJITmxYQ0pkTENCa1pXWmhkV3gwVm1Gc2RXVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxkSFZ5YmlCa1pXWmhkV3gwVm1Gc2RXVTdYRzU5TzF4dVhHNHZMeUJRY21sMllYUmxJSEJ5YjNCbGNuUnBaWE5jYm1OdmJuTjBJRjlqWVc1MllYTWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyeGhlVzkxZENBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWTNWeWNtVnVkRkJzWVhsbGNpQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNWpiMjV6ZENCamIyNTBaWGgwSUQwZ0tHSnZZWEprS1NBOVBpQmZZMkZ1ZG1GekxtZGxkQ2hpYjJGeVpDa3VaMlYwUTI5dWRHVjRkQ2hjSWpKa1hDSXBPMXh1WEc1amIyNXpkQ0JuWlhSU1pXRmtlVVJwWTJVZ1BTQW9ZbTloY21RcElEMCtJSHRjYmlBZ0lDQnBaaUFvZFc1a1pXWnBibVZrSUQwOVBTQmZiblZ0WW1WeVQyWlNaV0ZrZVVScFkyVXVaMlYwS0dKdllYSmtLU2tnZTF4dUlDQWdJQ0FnSUNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdWMyVjBLR0p2WVhKa0xDQXdLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWFIxY200Z1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObExtZGxkQ2hpYjJGeVpDazdYRzU5TzF4dVhHNWpiMjV6ZENCMWNHUmhkR1ZTWldGa2VVUnBZMlVnUFNBb1ltOWhjbVFzSUhWd1pHRjBaU2tnUFQ0Z2UxeHVJQ0FnSUY5dWRXMWlaWEpQWmxKbFlXUjVSR2xqWlM1elpYUW9ZbTloY21Rc0lHZGxkRkpsWVdSNVJHbGpaU2hpYjJGeVpDa2dLeUIxY0dSaGRHVXBPMXh1ZlR0Y2JseHVZMjl1YzNRZ2FYTlNaV0ZrZVNBOUlDaGliMkZ5WkNrZ1BUNGdaMlYwVW1WaFpIbEVhV05sS0dKdllYSmtLU0E5UFQwZ1ltOWhjbVF1WkdsalpTNXNaVzVuZEdnN1hHNWNibU52Ym5OMElIVndaR0YwWlVKdllYSmtJRDBnS0dKdllYSmtMQ0JrYVdObElEMGdZbTloY21RdVpHbGpaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaHBjMUpsWVdSNUtHSnZZWEprS1NrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjUwWlhoMEtHSnZZWEprS1M1amJHVmhjbEpsWTNRb01Dd2dNQ3dnWW05aGNtUXVkMmxrZEdnc0lHSnZZWEprTG1obGFXZG9kQ2s3WEc1Y2JpQWdJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQmthV1VnYjJZZ1pHbGpaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsTG5KbGJtUmxjaWhqYjI1MFpYaDBLR0p2WVhKa0tTd2dZbTloY21RdVpHbGxVMmw2WlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNTlPMXh1WEc1amIyNXpkQ0JoWkdSRWFXVWdQU0FvWW05aGNtUXBJRDArSUh0Y2JpQWdJQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVW9ZbTloY21Rc0lERXBPMXh1SUNBZ0lHbG1JQ2hwYzFKbFlXUjVLR0p2WVhKa0tTa2dlMXh1SUNBZ0lDQWdJQ0IxY0dSaGRHVkNiMkZ5WkNoaWIyRnlaQ3dnWW05aGNtUXViR0Y1YjNWMExteGhlVzkxZENoaWIyRnlaQzVrYVdObEtTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVkyOXVjM1FnY21WdGIzWmxSR2xsSUQwZ0tHSnZZWEprS1NBOVBpQjdYRzRnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21Rc0lHSnZZWEprTG14aGVXOTFkQzVzWVhsdmRYUW9ZbTloY21RdVpHbGpaU2twTzF4dUlDQWdJSFZ3WkdGMFpWSmxZV1I1UkdsalpTaGliMkZ5WkN3Z0xURXBPMXh1ZlR0Y2JseHVYRzR2THlCSmJuUmxjbUZqZEdsdmJpQnpkR0YwWlhOY2JtTnZibk4wSUU1UFRrVWdQU0JUZVcxaWIyd29YQ0p1YjE5cGJuUmxjbUZqZEdsdmJsd2lLVHRjYm1OdmJuTjBJRWhQVEVRZ1BTQlRlVzFpYjJ3b1hDSm9iMnhrWENJcE8xeHVZMjl1YzNRZ1RVOVdSU0E5SUZONWJXSnZiQ2hjSW0xdmRtVmNJaWs3WEc1amIyNXpkQ0JKVGtSRlZFVlNUVWxPUlVRZ1BTQlRlVzFpYjJ3b1hDSnBibVJsZEdWeWJXbHVaV1JjSWlrN1hHNWpiMjV6ZENCRVVrRkhSMGxPUnlBOUlGTjViV0p2YkNoY0ltUnlZV2RuYVc1blhDSXBPMXh1WEc0dkx5Qk5aWFJvYjJSeklIUnZJR2hoYm1Sc1pTQnBiblJsY21GamRHbHZibHh1WTI5dWMzUWdZMjl1ZG1WeWRGZHBibVJ2ZDBOdmIzSmthVzVoZEdWelZHOURZVzUyWVhNZ1BTQW9ZMkZ1ZG1GekxDQjRWMmx1Wkc5M0xDQjVWMmx1Wkc5M0tTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1kyRnVkbUZ6UW05NElEMGdZMkZ1ZG1GekxtZGxkRUp2ZFc1a2FXNW5RMnhwWlc1MFVtVmpkQ2dwTzF4dVhHNGdJQ0FnWTI5dWMzUWdlQ0E5SUhoWGFXNWtiM2NnTFNCallXNTJZWE5DYjNndWJHVm1kQ0FxSUNoallXNTJZWE11ZDJsa2RHZ2dMeUJqWVc1MllYTkNiM2d1ZDJsa2RHZ3BPMXh1SUNBZ0lHTnZibk4wSUhrZ1BTQjVWMmx1Wkc5M0lDMGdZMkZ1ZG1GelFtOTRMblJ2Y0NBcUlDaGpZVzUyWVhNdWFHVnBaMmgwSUM4Z1kyRnVkbUZ6UW05NExtaGxhV2RvZENrN1hHNWNiaUFnSUNCeVpYUjFjbTRnZTNnc0lIbDlPMXh1ZlR0Y2JseHVZMjl1YzNRZ2MyVjBkWEJKYm5SbGNtRmpkR2x2YmlBOUlDaGliMkZ5WkNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUdOaGJuWmhjeUE5SUY5allXNTJZWE11WjJWMEtHSnZZWEprS1R0Y2JseHVJQ0FnSUM4dklGTmxkSFZ3SUdsdWRHVnlZV04wYVc5dVhHNGdJQ0FnYkdWMElHOXlhV2RwYmlBOUlIdDlPMXh1SUNBZ0lHeGxkQ0J6ZEdGMFpTQTlJRTVQVGtVN1hHNGdJQ0FnYkdWMElITjBZWFJwWTBKdllYSmtJRDBnYm5Wc2JEdGNiaUFnSUNCc1pYUWdaR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQnVkV3hzTzF4dUlDQWdJR3hsZENCb2IyeGtWR2x0Wlc5MWRDQTlJRzUxYkd3N1hHNWNiaUFnSUNCamIyNXpkQ0JvYjJ4a1JHbGxJRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JwWmlBb1NFOU1SQ0E5UFQwZ2MzUmhkR1VnZkh3Z1NVNUVSVlJGVWsxSlRrVkVJRDA5UFNCemRHRjBaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnZEc5bloyeGxJR2h2YkdRZ0x5QnlaV3hsWVhObFhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQndiR0Y1WlhKWGFYUm9RVlIxY200Z1BTQmliMkZ5WkM1eGRXVnllVk5sYkdWamRHOXlLR0FrZTFSUFVGOVFURUZaUlZKZlRFbFRWSDBnSkh0VVQxQmZVRXhCV1VWU2ZWc2tlMGhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSWDFkWUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1pHbGxWVzVrWlhKRGRYSnpiM0l1YVhOSVpXeGtLQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaTV5Wld4bFlYTmxTWFFvY0d4aGVXVnlWMmwwYUVGVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxWVzVrWlhKRGRYSnpiM0l1YUc5c1pFbDBLSEJzWVhsbGNsZHBkR2hCVkhWeWJpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRTVQVGtVN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUhWd1pHRjBaVUp2WVhKa0tHSnZZWEprS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2h2YkdSVWFXMWxiM1YwSUQwZ2JuVnNiRHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJJYjJ4a2FXNW5JRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JvYjJ4a1ZHbHRaVzkxZENBOUlIZHBibVJ2ZHk1elpYUlVhVzFsYjNWMEtHaHZiR1JFYVdVc0lHSnZZWEprTG1odmJHUkVkWEpoZEdsdmJpazdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOMGIzQkliMnhrYVc1bklEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQjNhVzVrYjNjdVkyeGxZWEpVYVcxbGIzVjBLR2h2YkdSVWFXMWxiM1YwS1R0Y2JpQWdJQ0FnSUNBZ2FHOXNaRlJwYldWdmRYUWdQU0J1ZFd4c08xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0J6ZEdGeWRFbHVkR1Z5WVdOMGFXOXVJRDBnS0dWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hPVDA1RklEMDlQU0J6ZEdGMFpTa2dlMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnZjbWxuYVc0Z1BTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlRG9nWlhabGJuUXVZMnhwWlc1MFdDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjVPaUJsZG1WdWRDNWpiR2xsYm5SWlhHNGdJQ0FnSUNBZ0lDQWdJQ0I5TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJR0p2WVhKa0xteGhlVzkxZEM1blpYUkJkQ2hqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5aGpZVzUyWVhNc0lHVjJaVzUwTG1Oc2FXVnVkRmdzSUdWMlpXNTBMbU5zYVdWdWRGa3BLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0c1MWJHd2dJVDA5SUdScFpWVnVaR1Z5UTNWeWMyOXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QyNXNlU0JwYm5SbGNtRmpkR2x2YmlCM2FYUm9JSFJvWlNCaWIyRnlaQ0IyYVdFZ1lTQmthV1ZjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrU0c5c1pHbHVaMFJwWTJVZ0ppWWdJV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWFJsSUQwZ1NVNUVSVlJGVWsxSlRrVkVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRHRnlkRWh2YkdScGJtY29LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0NGaWIyRnlaQzVrYVhOaFlteGxaRWh2YkdScGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdTRTlNUkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoY25SSWIyeGthVzVuS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDZ2hZbTloY21RdVpHbHpZV0pzWldSRWNtRm5aMmx1WjBScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MzUmhkR1VnUFNCTlQxWkZPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElITm9iM2RKYm5SbGNtRmpkR2x2YmlBOUlDaGxkbVZ1ZENrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmthV1ZWYm1SbGNrTjFjbk52Y2lBOUlHSnZZWEprTG14aGVXOTFkQzVuWlhSQmRDaGpiMjUyWlhKMFYybHVaRzkzUTI5dmNtUnBibUYwWlhOVWIwTmhiblpoY3loallXNTJZWE1zSUdWMlpXNTBMbU5zYVdWdWRGZ3NJR1YyWlc1MExtTnNhV1Z1ZEZrcEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0VSU1FVZEhTVTVISUQwOVBTQnpkR0YwWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laM0poWW1KcGJtZGNJanRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNodWRXeHNJQ0U5UFNCa2FXVlZibVJsY2tOMWNuTnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMkZ1ZG1GekxuTjBlV3hsTG1OMWNuTnZjaUE5SUZ3aVozSmhZbHdpTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMkZ1ZG1GekxuTjBlV3hsTG1OMWNuTnZjaUE5SUZ3aVpHVm1ZWFZzZEZ3aU8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUcxdmRtVWdQU0FvWlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRTFQVmtVZ1BUMDlJSE4wWVhSbElIeDhJRWxPUkVWVVJWSk5TVTVGUkNBOVBUMGdjM1JoZEdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHUmxkR1Z5YldsdVpTQnBaaUJoSUdScFpTQnBjeUIxYm1SbGNpQjBhR1VnWTNWeWMyOXlYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QkpaMjV2Y21VZ2MyMWhiR3dnYlc5MlpXMWxiblJ6WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VDQTlJRTFoZEdndVlXSnpLRzl5YVdkcGJpNTRJQzBnWlhabGJuUXVZMnhwWlc1MFdDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZVNBOUlFMWhkR2d1WVdKektHOXlhV2RwYmk1NUlDMGdaWFpsYm5RdVkyeHBaVzUwV1NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaE5TVTVmUkVWTVZFRWdQQ0JrZUNCOGZDQk5TVTVmUkVWTVZFRWdQQ0JrZVNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWFJsSUQwZ1JGSkJSMGRKVGtjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MzUnZjRWh2YkdScGJtY29LVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1JwWTJWWGFYUm9iM1YwUkdsbFZXNWtaWEpEZFhKemIzSWdQU0JpYjJGeVpDNWthV05sTG1acGJIUmxjaWhrYVdVZ1BUNGdaR2xsSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21Rc0lHUnBZMlZYYVhSb2IzVjBSR2xsVlc1a1pYSkRkWEp6YjNJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWFJwWTBKdllYSmtJRDBnWTI5dWRHVjRkQ2hpYjJGeVpDa3VaMlYwU1cxaFoyVkVZWFJoS0RBc0lEQXNJR05oYm5aaGN5NTNhV1IwYUN3Z1kyRnVkbUZ6TG1obGFXZG9kQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvUkZKQlIwZEpUa2NnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUc5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSNUlEMGdiM0pwWjJsdUxua2dMU0JsZG1WdWRDNWpiR2xsYm5SWk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JrYVdWVmJtUmxja04xY25OdmNpNWpiMjl5WkdsdVlYUmxjenRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDaGliMkZ5WkNrdWNIVjBTVzFoWjJWRVlYUmhLSE4wWVhScFkwSnZZWEprTENBd0xDQXdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUnBaVlZ1WkdWeVEzVnljMjl5TG5KbGJtUmxjaWhqYjI1MFpYaDBLR0p2WVhKa0tTd2dZbTloY21RdVpHbGxVMmw2WlN3Z2UzZzZJSGdnTFNCa2VDd2dlVG9nZVNBdElHUjVmU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdjM1J2Y0VsdWRHVnlZV04wYVc5dUlEMGdLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lBbUppQkVVa0ZIUjBsT1J5QTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSNElEMGdiM0pwWjJsdUxuZ2dMU0JsZG1WdWRDNWpiR2xsYm5SWU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaSGtnUFNCdmNtbG5hVzR1ZVNBdElHVjJaVzUwTG1Oc2FXVnVkRms3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHUnBaVlZ1WkdWeVEzVnljMjl5TG1OdmIzSmthVzVoZEdWek8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J6Ym1Gd1ZHOURiMjl5WkhNZ1BTQmliMkZ5WkM1c1lYbHZkWFF1YzI1aGNGUnZLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklHUnBaVlZ1WkdWeVEzVnljMjl5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhnNklIZ2dMU0JrZUN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCNU9pQjVJQzBnWkhrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdibVYzUTI5dmNtUnpJRDBnYm5Wc2JDQWhQU0J6Ym1Gd1ZHOURiMjl5WkhNZ1B5QnpibUZ3Vkc5RGIyOXlaSE1nT2lCN2VDd2dlWDA3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtTnZiM0prYVc1aGRHVnpJRDBnYm1WM1EyOXZjbVJ6TzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUTJ4bFlYSWdjM1JoZEdWY2JpQWdJQ0FnSUNBZ1pHbGxWVzVrWlhKRGRYSnpiM0lnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRTVQVGtVN1hHNWNiaUFnSUNBZ0lDQWdMeThnVW1WbWNtVnphQ0JpYjJGeVpEc2dVbVZ1WkdWeUlHUnBZMlZjYmlBZ0lDQWdJQ0FnZFhCa1lYUmxRbTloY21Rb1ltOWhjbVFwTzF4dUlDQWdJSDA3WEc1Y2JseHVJQ0FnSUM4dklGSmxaMmx6ZEdWeUlIUm9aU0JoWTNSMVlXd2daWFpsYm5RZ2JHbHpkR1Z1WlhKeklHUmxabWx1WldRZ1lXSnZkbVV1SUUxaGNDQjBiM1ZqYUNCbGRtVnVkSE1nZEc5Y2JpQWdJQ0F2THlCbGNYVnBkbUZzWlc1MElHMXZkWE5sSUdWMlpXNTBjeTRnUW1WallYVnpaU0IwYUdVZ1hDSjBiM1ZqYUdWdVpGd2lJR1YyWlc1MElHUnZaWE1nYm05MElHaGhkbVVnWVZ4dUlDQWdJQzh2SUdOc2FXVnVkRmdnWVc1a0lHTnNhV1Z1ZEZrc0lISmxZMjl5WkNCaGJtUWdkWE5sSUhSb1pTQnNZWE4wSUc5dVpYTWdabkp2YlNCMGFHVWdYQ0owYjNWamFHMXZkbVZjSWx4dUlDQWdJQzh2SUNodmNpQmNJblJ2ZFdOb2MzUmhjblJjSWlrZ1pYWmxiblJ6TGx4dVhHNGdJQ0FnYkdWMElIUnZkV05vUTI5dmNtUnBibUYwWlhNZ1BTQjdZMnhwWlc1MFdEb2dNQ3dnWTJ4cFpXNTBXVG9nTUgwN1hHNGdJQ0FnWTI5dWMzUWdkRzkxWTJneWJXOTFjMlZGZG1WdWRDQTlJQ2h0YjNWelpVVjJaVzUwVG1GdFpTa2dQVDRnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnS0hSdmRXTm9SWFpsYm5RcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwYjNWamFFVjJaVzUwSUNZbUlEQWdQQ0IwYjNWamFFVjJaVzUwTG5SdmRXTm9aWE11YkdWdVozUm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlMk5zYVdWdWRGZ3NJR05zYVdWdWRGbDlJRDBnZEc5MVkyaEZkbVZ1ZEM1MGIzVmphR1Z6V3pCZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnZkV05vUTI5dmNtUnBibUYwWlhNZ1BTQjdZMnhwWlc1MFdDd2dZMnhwWlc1MFdYMDdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVc1MllYTXVaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dUVzkxYzJWRmRtVnVkQ2h0YjNWelpVVjJaVzUwVG1GdFpTd2dkRzkxWTJoRGIyOXlaR2x1WVhSbGN5a3BPMXh1SUNBZ0lDQWdJQ0I5TzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2ZFdOb2MzUmhjblJjSWl3Z2RHOTFZMmd5Ylc5MWMyVkZkbVZ1ZENoY0ltMXZkWE5sWkc5M2Jsd2lLU2s3WEc0Z0lDQWdZMkZ1ZG1GekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSnRiM1Z6WldSdmQyNWNJaXdnYzNSaGNuUkpiblJsY21GamRHbHZiaWs3WEc1Y2JpQWdJQ0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJR05oYm5aaGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzkxWTJodGIzWmxYQ0lzSUhSdmRXTm9NbTF2ZFhObFJYWmxiblFvWENKdGIzVnpaVzF2ZG1WY0lpa3BPMXh1SUNBZ0lDQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJbTF2ZFhObGJXOTJaVndpTENCdGIzWmxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnBaaUFvSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sSUh4OElDRmliMkZ5WkM1a2FYTmhZbXhsWkVodmJHUnBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJR05oYm5aaGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2liVzkxYzJWdGIzWmxYQ0lzSUhOb2IzZEpiblJsY21GamRHbHZiaWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZMkZ1ZG1GekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSjBiM1ZqYUdWdVpGd2lMQ0IwYjNWamFESnRiM1Z6WlVWMlpXNTBLRndpYlc5MWMyVjFjRndpS1NrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpYVndYQ0lzSUhOMGIzQkpiblJsY21GamRHbHZiaWs3WEc0Z0lDQWdZMkZ1ZG1GekxtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb1hDSnRiM1Z6Wlc5MWRGd2lMQ0J6ZEc5d1NXNTBaWEpoWTNScGIyNHBPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQlViM0JFYVdObFFtOWhjbVFnYVhNZ1lTQmpkWE4wYjIwZ1NGUk5UQ0JsYkdWdFpXNTBJSFJ2SUhKbGJtUmxjaUJoYm1RZ1kyOXVkSEp2YkNCaFhHNGdLaUJrYVdObElHSnZZWEprTGlCY2JpQXFYRzRnS2lCQVpYaDBaVzVrY3lCSVZFMU1SV3hsYldWdWRGeHVJQ292WEc1amIyNXpkQ0JVYjNCRWFXTmxRbTloY21RZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUVoVVRVeEZiR1Z0Wlc1MElIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCVWIzQkVhV05sUW05aGNtUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjM1I1YkdVdVpHbHpjR3hoZVNBOUlGd2lhVzVzYVc1bExXSnNiMk5yWENJN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOb1lXUnZkeUE5SUhSb2FYTXVZWFIwWVdOb1UyaGhaRzkzS0h0dGIyUmxPaUJjSW1Oc2IzTmxaRndpZlNrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOaGJuWmhjeUE5SUdSdlkzVnRaVzUwTG1OeVpXRjBaVVZzWlcxbGJuUW9YQ0pqWVc1MllYTmNJaWs3WEc0Z0lDQWdJQ0FnSUhOb1lXUnZkeTVoY0hCbGJtUkRhR2xzWkNoallXNTJZWE1wTzF4dVhHNGdJQ0FnSUNBZ0lGOWpZVzUyWVhNdWMyVjBLSFJvYVhNc0lHTmhiblpoY3lrN1hHNGdJQ0FnSUNBZ0lGOWpkWEp5Wlc1MFVHeGhlV1Z5TG5ObGRDaDBhR2x6TENCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSXBPMXh1SUNBZ0lDQWdJQ0JmYkdGNWIzVjBMbk5sZENoMGFHbHpMQ0J1WlhjZ1IzSnBaRXhoZVc5MWRDaDdYRzRnSUNBZ0lDQWdJQ0FnSUNCM2FXUjBhRG9nZEdocGN5NTNhV1IwYUN4Y2JpQWdJQ0FnSUNBZ0lDQWdJR2hsYVdkb2REb2dkR2hwY3k1b1pXbG5hSFFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1ZUYVhwbE9pQjBhR2x6TG1ScFpWTnBlbVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthWE53WlhKemFXOXVPaUIwYUdsekxtUnBjM0JsY25OcGIyNWNiaUFnSUNBZ0lDQWdmU2twTzF4dUlDQWdJQ0FnSUNCelpYUjFjRWx1ZEdWeVlXTjBhVzl1S0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdWMGxFVkVoZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0VWSlIwaFVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCU1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlZ4dUlDQWdJQ0FnSUNCZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdGMGRISnBZblYwWlVOb1lXNW5aV1JEWVd4c1ltRmpheWh1WVcxbExDQnZiR1JXWVd4MVpTd2dibVYzVm1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMkZ1ZG1GeklEMGdYMk5oYm5aaGN5NW5aWFFvZEdocGN5azdYRzRnSUNBZ0lDQWdJSE4zYVhSamFDQW9ibUZ0WlNrZ2UxeHVJQ0FnSUNBZ0lDQmpZWE5sSUZkSlJGUklYMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2QybGtkR2dnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmVjBsRVZFZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVkMmxrZEdnZ1BTQjNhV1IwYUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oYm5aaGN5NXpaWFJCZEhSeWFXSjFkR1VvVjBsRVZFaGZRVlJVVWtsQ1ZWUkZMQ0IzYVdSMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRWhGU1VkSVZGOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdobGFXZG9kQ0E5SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5S0c1bGQxWmhiSFZsTENCd1lYSnpaVTUxYldKbGNpaHZiR1JXWVd4MVpTa2dmSHdnUkVWR1FWVk1WRjlJUlVsSFNGUXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVhR1ZwWjJoMElEMGdhR1ZwWjJoME8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk5sZEVGMGRISnBZblYwWlNoSVJVbEhTRlJmUVZSVVVrbENWVlJGTENCb1pXbG5hSFFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNWTlFSVkpUU1U5T1gwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsemNHVnljMmx2YmlBOUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtHNWxkMVpoYkhWbExDQndZWEp6WlU1MWJXSmxjaWh2YkdSV1lXeDFaU2tnZkh3Z1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXViR0Y1YjNWMExtUnBjM0JsY25OcGIyNGdQU0JrYVhOd1pYSnphVzl1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNVVmZVMGxhUlY5QlZGUlNTVUpWVkVVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1JwWlZOcGVtVWdQU0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxjaWh1WlhkV1lXeDFaU3dnY0dGeWMyVk9kVzFpWlhJb2IyeGtWbUZzZFdVcElIeDhJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVaR2xsVTJsNlpTQTlJR1JwWlZOcGVtVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVhOaFlteGxaRkp2ZEdGMGFXOXVJRDBnZG1Gc2FXUmhkR1V1WW05dmJHVmhiaWh1WlhkV1lXeDFaU3dnWjJWMFFtOXZiR1ZoYmlodmJHUldZV3gxWlN3Z1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzSUVSRlJrRlZURlJmVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJDa3BMblpoYkhWbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXNZWGx2ZFhRdWNtOTBZWFJsSUQwZ0lXUnBjMkZpYkdWa1VtOTBZWFJwYjI0N1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JrWldaaGRXeDBPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJVYUdVZ2RtRnNkV1VnYVhNZ1pHVjBaWEp0YVc1bFpDQjNhR1Z1SUhWemFXNW5JSFJvWlNCblpYUjBaWEpjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZjQzFrYVdVNllXUmtaV1JjSWl3Z0tDa2dQVDRnWVdSa1JHbGxLSFJvYVhNcEtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWRHOXdMV1JwWlRweVpXMXZkbVZrWENJc0lDZ3BJRDArSUhKbGJXOTJaVVJwWlNoMGFHbHpLU2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdRV1JrSUdScFkyVWdkR2hoZENCaGNtVWdZV3h5WldGa2VTQnBiaUIwYUdVZ1JFOU5YRzRnSUNBZ0lDQWdJSFJvYVhNdVpHbGpaUzVtYjNKRllXTm9LQ2dwSUQwK0lHRmtaRVJwWlNoMGFHbHpLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR2x6WTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWVdSdmNIUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQkhjbWxrVEdGNWIzVjBJSFZ6WldRZ1lua2dkR2hwY3lCRWFXTmxRbTloY21RZ2RHOGdiR0Y1YjNWMElIUm9aU0JrYVdObExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBkeWFXUk1ZWGx2ZFhSOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHeGhlVzkxZENncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXNZWGx2ZFhRdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1SUU1dmRHVXNJSFJ2SUdGamRIVmhiR3g1SUhSb2NtOTNJSFJvWlNCa2FXTmxJSFZ6WlZ4dUlDQWdJQ0FxSUh0QWJHbHVheUIwYUhKdmQwUnBZMlY5TGlCY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRVYjNCRWFXVmJYWDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRnN1TGk1MGFHbHpMbWRsZEVWc1pXMWxiblJ6UW5sVVlXZE9ZVzFsS0ZSUFVGOUVTVVVwWFR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdiV0Y0YVcxMWJTQnVkVzFpWlhJZ2IyWWdaR2xqWlNCMGFHRjBJR05oYmlCaVpTQndkWFFnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY24wZ1ZHaGxJRzFoZUdsdGRXMGdiblZ0WW1WeUlHOW1JR1JwWTJVc0lEQWdQQ0J0WVhocGJYVnRMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVzWVhsdmRYUXViV0Y0YVcxMWJVNTFiV0psY2s5bVJHbGpaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2QybGtkR2dnYjJZZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhkcFpIUm9LQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFVHOXphWFJwZG1WT2RXMWlaWEpCZEhSeWFXSjFkR1VvZEdocGN5d2dWMGxFVkVoZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgxZEpSRlJJS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdhR1ZwWjJoMElHOW1JSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdhR1ZwWjJoMEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1NFVkpSMGhVWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5SVJVbEhTRlFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmthWE53WlhKemFXOXVJR3hsZG1Wc0lHOW1JSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2x6Y0dWeWMybHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRVJKVTFCRlVsTkpUMDVmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDBSSlUxQkZVbE5KVDA0cE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J6YVhwbElHOW1JR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBaVk5wZW1Vb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNrRjBkSEpwWW5WMFpTaDBhR2x6TENCRVNVVmZVMGxhUlY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTmhiaUJrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVFnWW1VZ1pISmhaMmRsWkQ5Y2JpQWdJQ0FnS2lCQWRIbHdaU0I3UW05dmJHVmhibjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsellXSnNaV1JFY21GbloybHVaMFJwWTJVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJDYjI5c1pXRnVRWFIwY21saWRYUmxLSFJvYVhNc0lFUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDBSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU5oYmlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RZ1ltVWdhR1ZzWkNCaWVTQmhJRkJzWVhsbGNqOWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1FtOXZiR1ZoYm4xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1pHbHpZV0pzWldSSWIyeGthVzVuUkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEVKdmIyeGxZVzVCZEhSeWFXSjFkR1VvZEdocGN5d2dTRTlNUkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5SVQweEVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRWx6SUhKdmRHRjBhVzVuSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkNCa2FYTmhZbXhsWkQ5Y2JpQWdJQ0FnS2lCQWRIbHdaU0I3UW05dmJHVmhibjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsellXSnNaV1JTYjNSaGRHbHVaMFJwWTJVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJDYjI5c1pXRnVRWFIwY21saWRYUmxLSFJvYVhNc0lGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDFKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCa2RYSmhkR2x2YmlCcGJpQnRjeUIwYnlCd2NtVnpjeUIwYUdVZ2JXOTFjMlVnTHlCMGIzVmphQ0JoSUdScFpTQmlaV1p2Y21VZ2FYUWdZbVZyYjIxbGMxeHVJQ0FnSUNBcUlHaGxiR1FnWW5rZ2RHaGxJRkJzWVhsbGNpNGdTWFFnYUdGeklHOXViSGtnWVc0Z1pXWm1aV04wSUhkb1pXNGdkR2hwY3k1b2IyeGtZV0pzWlVScFkyVWdQVDA5WEc0Z0lDQWdJQ29nZEhKMVpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdodmJHUkVkWEpoZEdsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxLSFJvYVhNc0lFaFBURVJmUkZWU1FWUkpUMDVmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDBoUFRFUmZSRlZTUVZSSlQwNHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCVWIzQlFiR0Y1WlhKTWFYTjBJR1ZzWlcxbGJuUWdiMllnZEdocGN5QlViM0JFYVdObFFtOWhjbVF1SUVsbUlHbDBJR1J2WlhNZ2JtOTBJR1Y0YVhOMExGeHVJQ0FnSUNBcUlHbDBJSGRwYkd3Z1ltVWdZM0psWVhSbFpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0VWIzQlFiR0Y1WlhKTWFYTjBmVnh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRjl3YkdGNVpYSk1hWE4wS0NrZ2UxeHVJQ0FnSUNBZ0lDQnNaWFFnY0d4aGVXVnlUR2x6ZENBOUlIUm9hWE11Y1hWbGNubFRaV3hsWTNSdmNpaFVUMUJmVUV4QldVVlNYMHhKVTFRcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnY0d4aGVXVnlUR2x6ZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0d4aGVXVnlUR2x6ZENBOUlIUm9hWE11WVhCd1pXNWtRMmhwYkdRb1ZFOVFYMUJNUVZsRlVsOU1TVk5VS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQndiR0Y1WlhKTWFYTjBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCd2JHRjVaWEp6SUhCc1lYbHBibWNnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0VWIzQlFiR0Y1WlhKYlhYMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdjR3hoZVdWeWN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgzQnNZWGxsY2t4cGMzUXVjR3hoZVdWeWN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkJjeUJ3YkdGNVpYSXNJSFJvY205M0lIUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0ZCc1lYbGxjbjBnVzNCc1lYbGxjaUE5SUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVsMGdMU0JVYUdWY2JpQWdJQ0FnS2lCd2JHRjVaWElnZEdoaGRDQnBjeUIwYUhKdmQybHVaeUIwYUdVZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdSR2xsVzExOUlGUm9aU0IwYUhKdmQyNGdaR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtMaUJVYUdseklHeHBjM1FnYjJZZ1pHbGpaU0JwY3lCMGFHVWdjMkZ0WlNCaGN5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDZHpJSHRBYzJWbElHUnBZMlY5SUhCeWIzQmxjblI1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkR2h5YjNkRWFXTmxLSEJzWVhsbGNpQTlJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY0d4aGVXVnlJQ1ltSUNGd2JHRjVaWEl1YUdGelZIVnliaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjR3hoZVdWeUxuTjBZWEowVkhWeWJpZ3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR2xqWlM1bWIzSkZZV05vS0dScFpTQTlQaUJrYVdVdWRHaHliM2RKZENncEtUdGNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWthV05sTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVGa1pDQmhJR1JwWlNCMGJ5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdSR2xsZkU5aWFtVmpkSDBnVzJOdmJtWnBaeUE5SUh0OVhTQXRJRlJvWlNCa2FXVWdiM0lnWVNCamIyNW1hV2QxY21GMGFXOXVJRzltWEc0Z0lDQWdJQ29nZEdobElHUnBaU0IwYnlCaFpHUWdkRzhnZEdocGN5QlViM0JFYVdObFFtOWhjbVF1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjhiblZzYkgwZ1cyTnZibVpwWnk1d2FYQnpYU0F0SUZSb1pTQndhWEJ6SUc5bUlIUm9aU0JrYVdVZ2RHOGdZV1JrTGx4dUlDQWdJQ0FxSUVsbUlHNXZJSEJwY0hNZ1lYSmxJSE53WldOcFptbGxaQ0J2Y2lCMGFHVWdjR2x3Y3lCaGNtVWdibTkwSUdKbGRIZGxaVzRnTVNCaGJtUWdOaXdnWVNCeVlXNWtiMjFjYmlBZ0lDQWdLaUJ1ZFcxaVpYSWdZbVYwZDJWbGJpQXhJR0Z1WkNBMklHbHpJR2RsYm1WeVlYUmxaQ0JwYm5OMFpXRmtMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQmJZMjl1Wm1sbkxtTnZiRzl5WFNBdElGUm9aU0JqYjJ4dmNpQnZaaUIwYUdVZ1pHbGxJSFJ2SUdGa1pDNGdSR1ZtWVhWc2RGeHVJQ0FnSUNBcUlIUnZJSFJvWlNCa1pXWmhkV3gwSUdOdmJHOXlMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmJZMjl1Wm1sbkxuaGRJQzBnVkdobElIZ2dZMjl2Y21ScGJtRjBaU0J2WmlCMGFHVWdaR2xsTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JiWTI5dVptbG5MbmxkSUMwZ1ZHaGxJSGtnWTI5dmNtUnBibUYwWlNCdlppQjBhR1VnWkdsbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCYlkyOXVabWxuTG5KdmRHRjBhVzl1WFNBdElGUm9aU0J5YjNSaGRHbHZiaUJ2WmlCMGFHVWdaR2xsTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Vkc5d1VHeGhlV1Z5ZlNCYlkyOXVabWxuTG1obGJHUkNlVjBnTFNCVWFHVWdjR3hoZVdWeUlHaHZiR1JwYm1jZ2RHaGxJR1JwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFSdmNFUnBaWDBnVkdobElHRmtaR1ZrSUdScFpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCaFpHUkVhV1VvWTI5dVptbG5JRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WVhCd1pXNWtRMmhwYkdRb1kyOXVabWxuSUdsdWMzUmhibU5sYjJZZ1ZHOXdSR2xsSUQ4Z1kyOXVabWxuSURvZ2JtVjNJRlJ2Y0VScFpTaGpiMjVtYVdjcEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlNaVzF2ZG1VZ1pHbGxJR1p5YjIwZ2RHaHBjeUJVYjNCRWFXTmxRbTloY21RdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFSdmNFUnBaWDBnWkdsbElDMGdWR2hsSUdScFpTQjBieUJ5WlcxdmRtVWdabkp2YlNCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcUwxeHVJQ0FnSUhKbGJXOTJaVVJwWlNoa2FXVXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHUnBaUzV3WVhKbGJuUk9iMlJsSUNZbUlHUnBaUzV3WVhKbGJuUk9iMlJsSUQwOVBTQjBhR2x6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuSmxiVzkyWlVOb2FXeGtLR1JwWlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkJaR1FnWVNCd2JHRjVaWElnZEc4Z2RHaHBjeUJVYjNCRWFXTmxRbTloY21RdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFSdmNGQnNZWGxsY254UFltcGxZM1I5SUdOdmJtWnBaeUF0SUZSb1pTQndiR0Y1WlhJZ2IzSWdZU0JqYjI1bWFXZDFjbUYwYVc5dUlHOW1JR0ZjYmlBZ0lDQWdLaUJ3YkdGNVpYSWdkRzhnWVdSa0lIUnZJSFJvYVhNZ1ZHOXdSR2xqWlVKdllYSmtMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQmpiMjVtYVdjdVkyOXNiM0lnTFNCVWFHbHpJSEJzWVhsbGNpZHpJR052Ykc5eUlIVnpaV1FnYVc0Z2RHaGxJR2RoYldVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUdOdmJtWnBaeTV1WVcxbElDMGdWR2hwY3lCd2JHRjVaWEluY3lCdVlXMWxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmJZMjl1Wm1sbkxuTmpiM0psWFNBdElGUm9hWE1nY0d4aGVXVnlKM01nYzJOdmNtVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdENiMjlzWldGdWZTQmJZMjl1Wm1sbkxtaGhjMVIxY201ZElDMGdWR2hwY3lCd2JHRjVaWElnYUdGeklHRWdkSFZ5Ymk1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGFISnZkM01nUlhKeWIzSWdkMmhsYmlCMGFHVWdjR3hoZVdWeUlIUnZJR0ZrWkNCamIyNW1iR2xqZEhNZ2QybDBhQ0JoSUhCeVpTMWxlR2x6ZEdsdVoxeHVJQ0FnSUNBcUlIQnNZWGxsY2k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFSdmNGQnNZWGxsY24wZ1ZHaGxJR0ZrWkdWa0lIQnNZWGxsY2k1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JoWkdSUWJHRjVaWElvWTI5dVptbG5JRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDNCc1lYbGxja3hwYzNRdVlYQndaVzVrUTJocGJHUW9ZMjl1Wm1sbklHbHVjM1JoYm1ObGIyWWdWRzl3VUd4aGVXVnlJRDhnWTI5dVptbG5JRG9nYm1WM0lGUnZjRkJzWVhsbGNpaGpiMjVtYVdjcEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlNaVzF2ZG1VZ2NHeGhlV1Z5SUdaeWIyMGdkR2hwY3lCVWIzQkVhV05sUW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRkJzWVhsbGNuMGdjR3hoZVdWeUlDMGdWR2hsSUhCc1lYbGxjaUIwYnlCeVpXMXZkbVVnWm5KdmJTQjBhR2x6SUdKdllYSmtMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lISmxiVzkyWlZCc1lYbGxjaWh3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIQnNZWGxsY2k1d1lYSmxiblJPYjJSbElDWW1JSEJzWVhsbGNpNXdZWEpsYm5ST2IyUmxJRDA5UFNCMGFHbHpMbDl3YkdGNVpYSk1hWE4wS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxsOXdiR0Y1WlhKTWFYTjBMbkpsYlc5MlpVTm9hV3hrS0hCc1lYbGxjaWs3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JuMDdYRzVjYm5kcGJtUnZkeTVqZFhOMGIyMUZiR1Z0Wlc1MGN5NWtaV1pwYm1Vb1ZFRkhYMDVCVFVVc0lGUnZjRVJwWTJWQ2IyRnlaQ2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1JHbGpaVUp2WVhKa0xGeHVJQ0FnSUVSRlJrRlZURlJmUkVsRlgxTkpXa1VzWEc0Z0lDQWdSRVZHUVZWTVZGOUlUMHhFWDBSVlVrRlVTVTlPTEZ4dUlDQWdJRVJGUmtGVlRGUmZWMGxFVkVnc1hHNGdJQ0FnUkVWR1FWVk1WRjlJUlVsSFNGUXNYRzRnSUNBZ1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0xGeHVJQ0FnSUVSRlJrRlZURlJmVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJDeGNiaUFnSUNCVVFVZGZUa0ZOUlZ4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0TENBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb3ZYRzVwYlhCdmNuUWdlMVJ2Y0VScFkyVkNiMkZ5WkgwZ1puSnZiU0JjSWk0dlZHOXdSR2xqWlVKdllYSmtMbXB6WENJN1hHNXBiWEJ2Y25RZ2UxUnZjRVJwWlgwZ1puSnZiU0JjSWk0dlZHOXdSR2xsTG1welhDSTdYRzVwYlhCdmNuUWdlMVJ2Y0ZCc1lYbGxjbjBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5TG1welhDSTdYRzVwYlhCdmNuUWdlMVJ2Y0ZCc1lYbGxja3hwYzNSOUlHWnliMjBnWENJdUwxUnZjRkJzWVhsbGNreHBjM1F1YW5OY0lqdGNibHh1ZDJsdVpHOTNMblIzWlc1MGVXOXVaWEJwY0hNZ1BTQjNhVzVrYjNjdWRIZGxiblI1YjI1bGNHbHdjeUI4ZkNCUFltcGxZM1F1Wm5KbFpYcGxLSHRjYmlBZ0lDQldSVkpUU1U5T09pQmNJakF1TUM0eFhDSXNYRzRnSUNBZ1RFbERSVTVUUlRvZ1hDSk1SMUJNTFRNdU1Gd2lMRnh1SUNBZ0lGZEZRbE5KVkVVNklGd2lhSFIwY0hNNkx5OTBkMlZ1ZEhsdmJtVndhWEJ6TG05eVoxd2lMRnh1SUNBZ0lGUnZjRVJwWTJWQ2IyRnlaRG9nVkc5d1JHbGpaVUp2WVhKa0xGeHVJQ0FnSUZSdmNFUnBaVG9nVkc5d1JHbGxMRnh1SUNBZ0lGUnZjRkJzWVhsbGNqb2dWRzl3VUd4aGVXVnlMRnh1SUNBZ0lGUnZjRkJzWVhsbGNreHBjM1E2SUZSdmNGQnNZWGxsY2t4cGMzUmNibjBwTzF4dUlsMHNJbTVoYldWeklqcGJJbFJCUjE5T1FVMUZJaXdpUTA5TVQxSmZRVlJVVWtsQ1ZWUkZJaXdpWDJOdmJHOXlJaXdpZG1Gc2FXUmhkR1VpTENKVVQxQmZVRXhCV1VWU0lpd2lWRTlRWDFCTVFWbEZVbDlNU1ZOVUlpd2lWRTlRWDBSSlJTSmRMQ0p0WVhCd2FXNW5jeUk2SWtGQlFVRTdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN1FVRjVRa0VzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhqUVVGakxFdEJRVXNzUTBGQlF6czdPenM3T3pzN1NVRlJNME1zVjBGQlZ5eERRVUZETEU5QlFVOHNSVUZCUlR0UlFVTnFRaXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdTMEZEYkVJN1EwRkRTanM3UVVOd1EwUTdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1FVRkhRU3hOUVVGTkxITkNRVUZ6UWl4SFFVRkhMRWRCUVVjc1EwRkJRenM3UVVGRmJrTXNUVUZCVFN4bFFVRmxMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXM3U1VGRE0wSXNUMEZCVHl4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UTBGRGNrVXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE5VSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6VkNMRTFCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETDBJc1RVRkJUU3hYUVVGWExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTnNReXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenM3T3pzN096czdPenM3T3pzN08wRkJaMEk1UWl4TlFVRk5MRlZCUVZVc1IwRkJSeXhOUVVGTk96czdPenM3TzBsQlQzSkNMRmRCUVZjc1EwRkJRenRSUVVOU0xFdEJRVXNzUjBGQlJ5eGhRVUZoTzFGQlEzSkNMRTFCUVUwc1IwRkJSeXhqUVVGak8xRkJRM1pDTEU5QlFVOHNSMEZCUnl4blFrRkJaMEk3VVVGRE1VSXNWVUZCVlN4SFFVRkhMR3RDUVVGclFqdExRVU5zUXl4SFFVRkhMRVZCUVVVc1JVRkJSVHRSUVVOS0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0JDTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzUkNMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNCQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZET3p0UlFVVjRRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEZWQlFWVXNRMEZCUXp0UlFVTTNRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEU5QlFVOHNRMEZCUXp0UlFVTjJRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTnVRaXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0TFFVTjRRanM3T3pzN096dEpRVTlFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpOQ096dEpRVVZFTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOVUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZETDBJc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc05rTkJRVFpETEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGREwwWTdVVUZEUkN4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzB0QlEyaEVPenM3T3pzN096dEpRVkZFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ096dEpRVVZFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOV0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZETDBJc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc09FTkJRVGhETEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGFFYzdVVUZEUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzB0QlEyaEVPenM3T3pzN096dEpRVkZFTEVsQlFVa3NiVUpCUVcxQ0xFZEJRVWM3VVVGRGRFSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdTMEZEYkVNN096czdPenM3T3pzN1NVRlZSQ3hKUVVGSkxGVkJRVlVzUjBGQlJ6dFJRVU5pTEU5QlFVOHNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU5vUXpzN1NVRkZSQ3hKUVVGSkxGVkJRVlVzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEWkN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8xbEJReTlDTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETEd0RVFVRnJSQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNCSE8xRkJRMFFzVDBGQlR5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU51UXpzN096czdPenM3U1VGUlJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTNRanM3U1VGRlJDeEpRVUZKTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1VVRkRXaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTzFsQlEyeERMRTFCUVUwc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRMQ3REUVVFclF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMnhITzFGQlEwUXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEZGtJc1NVRkJTU3hEUVVGRExHTkJRV01zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dExRVU5vUkRzN1NVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEUxQlFVMHNRMEZCUXl4SFFVRkhMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETlVJc1QwRkJUeXhUUVVGVExFdEJRVXNzUTBGQlF5eEhRVUZITEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRja003TzBsQlJVUXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMVlzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFSTdPenM3T3pzN08wbEJVVVFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETVVJN096czdPenM3TzBsQlVVUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeE5RVUZOTEVkQlFVY3NSMEZCUnl4bFFVRmxMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRhRVFzVFVGQlRTeEhRVUZITEVkQlFVY3NaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPenRSUVVWb1JDeFBRVUZQTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRM0pDT3pzN096czdPenM3T3pzN1NVRlpSQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlExUXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSVHRaUVVONFF5eE5RVUZOTEVsQlFVa3NhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eDVRMEZCZVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1RVRkJUU3hGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNeFNUczdVVUZGUkN4TlFVRk5MR2xDUVVGcFFpeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTTNRaXhOUVVGTkxGbEJRVmtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMUZCUlhoQ0xFdEJRVXNzVFVGQlRTeEhRVUZITEVsQlFVa3NTVUZCU1N4RlFVRkZPMWxCUTNCQ0xFbEJRVWtzUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZPenM3WjBKQlIyUXNhVUpCUVdsQ0xFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUXk5Q0xFMUJRVTA3WjBKQlEwZ3NXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dGhRVU14UWp0VFFVTktPenRSUVVWRUxFMUJRVTBzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RlFVRkZMRWxCUVVrc1EwRkJReXh0UWtGQmJVSXNRMEZCUXl4RFFVRkRPMUZCUXpsRkxFMUJRVTBzWTBGQll5eEhRVUZITEVsQlFVa3NRMEZCUXl4elFrRkJjMElzUTBGQlF5eEhRVUZITEVWQlFVVXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6czdVVUZGTTBVc1MwRkJTeXhOUVVGTkxFZEJRVWNzU1VGQlNTeFpRVUZaTEVWQlFVVTdXVUZETlVJc1RVRkJUU3hYUVVGWExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFZEJRVWNzWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMWxCUTNSRkxFMUJRVTBzVlVGQlZTeEhRVUZITEdOQlFXTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJRenRaUVVNdlF5eGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMRmRCUVZjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6czdXVUZGZEVNc1IwRkJSeXhEUVVGRExGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdXVUZEZUVRc1IwRkJSeXhEUVVGRExGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMSE5DUVVGelFpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRPMWxCUTNaR0xHbENRVUZwUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU12UWpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4cFFrRkJhVUlzUTBGQlF5eERRVUZET3p0UlFVVnVReXhQUVVGUExHbENRVUZwUWl4RFFVRkRPMHRCUXpWQ096czdPenM3T3pzN096dEpRVmRFTEhOQ1FVRnpRaXhEUVVGRExFZEJRVWNzUlVGQlJTeHBRa0ZCYVVJc1JVRkJSVHRSUVVNelF5eE5RVUZOTEZOQlFWTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRelZDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOa0xFMUJRVTBzVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN08xRkJSV3hFTEU5QlFVOHNVMEZCVXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUzBGQlN5eEhRVUZITEZGQlFWRXNSVUZCUlR0WlFVTTNReXhMUVVGTExFMUJRVTBzU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3WjBKQlF6RkRMRWxCUVVrc1UwRkJVeXhMUVVGTExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hwUWtGQmFVSXNRMEZCUXl4RlFVRkZPMjlDUVVOc1JTeFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8ybENRVU4yUWp0aFFVTktPenRaUVVWRUxFdEJRVXNzUlVGQlJTeERRVUZETzFOQlExZzdPMUZCUlVRc1QwRkJUeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMHRCUTJoRE96czdPenM3T3pzN096czdTVUZaUkN4aFFVRmhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMnBDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRGVFSXNUVUZCVFN4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6czdVVUZGTlVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUzBGQlN5eEZRVUZGTzFsQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRla01zVFVGQlRUdFpRVU5JTEV0QlFVc3NTVUZCU1N4SFFVRkhMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVRkZPMmRDUVVOcVJTeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNNVJDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTJwRk96dFpRVVZFTEV0QlFVc3NTVUZCU1N4SFFVRkhMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NSVUZCUlN4SFFVRkhMRVZCUVVVc1JVRkJSVHRuUWtGRGNFVXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE9VUXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOcVJUdFRRVU5LT3p0UlFVVkVMRTlCUVU4c1MwRkJTeXhEUVVGRE8wdEJRMmhDT3pzN096czdPenM3T3p0SlFWZEVMRmxCUVZrc1EwRkJReXhKUVVGSkxFVkJRVVVzYVVKQlFXbENMRVZCUVVVN1VVRkRiRU1zVDBGQlR5eFRRVUZUTEV0QlFVc3NhVUpCUVdsQ0xFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RFFVRkRMRWRCUVVjc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6TkhPenM3T3pzN096czdTVUZUUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMklzVDBGQlR5eERRVUZETEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRha1U3T3pzN096czdPenM3U1VGVlJDeGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVU3VVVGRGRFSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRPVVFzVDBGQlR5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhIUVVGSExFTkJRVU03VTBGRGFrTTdVVUZEUkN4UFFVRlBMRk5CUVZNc1EwRkJRenRMUVVOd1FqczdPenM3T3pzN096czdTVUZYUkN4dlFrRkJiMElzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEY0VJc1QwRkJUeXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU53UkRzN096czdPenM3T3pzN1NVRlhSQ3h2UWtGQmIwSXNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRla0lzVFVGQlRTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla1FzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN1dVRkRlRU1zVDBGQlR5eERRVUZETEVOQlFVTTdVMEZEV2p0UlFVTkVMRTlCUVU4c1UwRkJVeXhEUVVGRE8wdEJRM0JDT3pzN096czdPenM3T3pzN096dEpRV05FTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhKUVVGSkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTNaQ0xFMUJRVTBzVlVGQlZTeEhRVUZITzFsQlEyWXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRha01zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTTdVMEZEY0VNc1EwRkJRenM3VVVGRlJpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFGQlF6bERMRTFCUVUwc1QwRkJUeXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRE5VTXNUVUZCVFN4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eFBRVUZQTEVOQlFVTTdVVUZEZUVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU0zUXl4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEZGQlFWRXNRMEZCUXpzN1VVRkZNVU1zVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXp0WlFVTm1MRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEZWQlFWVXNRMEZCUXp0WlFVTnFReXhSUVVGUkxFVkJRVVVzVDBGQlR5eEhRVUZITEZGQlFWRTdVMEZETDBJc1JVRkJSVHRaUVVORExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRPMmRDUVVOc1FpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjN1owSkJRMjVDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03WVVGRE1VSXNRMEZCUXp0WlFVTkdMRkZCUVZFc1JVRkJSU3hSUVVGUkxFZEJRVWNzVVVGQlVUdFRRVU5vUXl4RlFVRkZPMWxCUTBNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTTdaMEpCUTJ4Q0xFZEJRVWNzUlVGQlJTeFZRVUZWTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1owSkJRM1pDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSenRoUVVOMFFpeERRVUZETzFsQlEwWXNVVUZCVVN4RlFVRkZMRTlCUVU4c1IwRkJSeXhUUVVGVE8xTkJRMmhETEVWQlFVVTdXVUZEUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF6dG5Ra0ZEYkVJc1IwRkJSeXhGUVVGRkxGVkJRVlVzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0blFrRkRka0lzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRoUVVNeFFpeERRVUZETzFsQlEwWXNVVUZCVVN4RlFVRkZMRkZCUVZFc1IwRkJSeXhUUVVGVE8xTkJRMnBETEVOQlFVTXNRMEZCUXpzN1VVRkZTQ3hOUVVGTkxFMUJRVTBzUjBGQlJ5eFRRVUZUT3p0aFFVVnVRaXhOUVVGTkxFTkJRVU1zUTBGQlF5eFJRVUZSTEV0QlFVc3NVMEZCVXl4TFFVRkxMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03TzJGQlJUbERMRTFCUVUwc1EwRkJReXhEUVVGRExGRkJRVkVzUzBGQlN6dG5Ra0ZEYkVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zUjBGQlJ5eERRVUZETEZkQlFWY3NRMEZCUXl4TFFVRkxMRkZCUVZFc1EwRkJReXhEUVVGRE8yMUNRVU4wUlN4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZET3p0aFFVVnlSQ3hOUVVGTk8yZENRVU5JTEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1MwRkJTeXhSUVVGUkxFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRWRCUVVjc1VVRkJVU3hIUVVGSExFbEJRVWs3WjBKQlEzWkZMRU5CUVVNc1EwRkJReXhGUVVGRkxGTkJRVk1zUlVGQlJTeFJRVUZSTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRMMElzUTBGQlF6czdVVUZGVGl4UFFVRlBMRk5CUVZNc1MwRkJTeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8wdEJRemxGT3pzN096czdPenM3U1VGVFJDeExRVUZMTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRlRUlzUzBGQlN5eE5RVUZOTEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzFsQlF5OUNMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJRenM3V1VGRkwwSXNUVUZCVFN4SlFVRkpMRWRCUVVjc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0WlFVTjZSQ3hOUVVGTkxFbEJRVWtzUjBGQlJ5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFpRVVY2UkN4SlFVRkpMRWxCUVVrc1NVRkJTU3hKUVVGSkxFVkJRVVU3WjBKQlEyUXNUMEZCVHl4SFFVRkhMRU5CUVVNN1lVRkRaRHRUUVVOS096dFJRVVZFTEU5QlFVOHNTVUZCU1N4RFFVRkRPMHRCUTJZN096czdPenM3T3pzN1NVRlZSQ3hqUVVGakxFTkJRVU1zUzBGQlN5eEZRVUZGTEUxQlFVMHNSVUZCUlR0UlFVTXhRaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOc1JDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU4wUkRzN096czdPenM3TzBsQlUwUXNZVUZCWVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTzFGQlEzUkNMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1MwRkRla1E3T3pzN096czdPenRKUVZORUxHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOc1FpeFBRVUZQTzFsQlEwZ3NSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRha01zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTTdVMEZEY0VNc1EwRkJRenRMUVVOTU8wTkJRMG83TzBGRGFHWkVPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3TzBGQkswSkJMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NRMEZCUXl4SlFVRkpMRXRCUVVzN1NVRkRha01zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRla01zVDBGQlR5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVjBGQlZ5eEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPME5CUXpGR0xFTkJRVU03T3pzN096czdPMEZCVVVZc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4RFFVRkRMRWRCUVVjN096czdPenM3T3pzN096czdTVUZoTTBJc1kwRkJZeXhIUVVGSExFTkJRVU03T3pzN096czdPenM3T3pzN096czdVVUZuUW1Rc2QwSkJRWGRDTEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1JVRkJSU3hSUVVGUkxFVkJRVVU3T3pzN1dVRkpMME1zVFVGQlRTeFJRVUZSTEVkQlFVY3NhMEpCUVd0Q0xFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEZGQlFWRXNTMEZCU3l4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlR0blFrRkRjRVFzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZETTBNN1UwRkRTanRMUVVOS096dEJRMmhHVERzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hOUVVGTkxHVkJRV1VzUjBGQlJ5eGpRVUZqTEV0QlFVc3NRMEZCUXp0SlFVTjRReXhYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNqczdRVU4yUWtRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMHNZVUZCWVN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGNFTXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6czdRVUZGT1VJc1RVRkJUU3hoUVVGaExFZEJRVWNzVFVGQlRUdEpRVU40UWl4WFFVRlhMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzV1VGQldTeEZRVUZGTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1JVRkJSVHRSUVVNMVF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFJRVU40UWl4aFFVRmhMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXp0UlFVTjBReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRMUVVNM1FqczdTVUZGUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNelFqczdTVUZGUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExHRkJRV0VzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRMMFE3TzBsQlJVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3TzBsQlJVUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRMUVVOc1F6czdTVUZGUkN4VFFVRlRMRU5CUVVNc1ZVRkJWU3hGUVVGRk8xRkJRMnhDTEdGQlFXRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEzQkRMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3TzBsQlJVUXNUVUZCVFN4RFFVRkRMRU5CUVVNc1UwRkJVeXhGUVVGRkxHRkJRV0VzUjBGQlJ5eEZRVUZGTEVWQlFVVXNVMEZCVXl4SFFVRkhMR1ZCUVdVc1EwRkJReXhGUVVGRk8xRkJRMnBGTEUxQlFVMHNWMEZCVnl4SFFVRkhMRk5CUVZNc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkRPMUZCUTNwRUxFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVTdXVUZEWkN4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE96dFpRVVYyUkN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTXpRanM3VVVGRlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0TFFVTm1PME5CUTBvN08wRkRMMFJFT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCUlVFc1RVRkJUU3hWUVVGVkxFZEJRVWNzWTBGQll5eGxRVUZsTEVOQlFVTTdTVUZETjBNc1YwRkJWeXhEUVVGRExFZEJRVWNzUlVGQlJUdFJRVU5pTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOa08wTkJRMG83TzBGRGVrSkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUVzVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhqUVVGakxHVkJRV1VzUTBGQlF6dEpRVU51UkN4WFFVRlhMRU5CUVVNc1IwRkJSeXhGUVVGRk8xRkJRMklzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMHRCUTJRN1EwRkRTanM3UVVONlFrUTdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1FVRkpRU3hOUVVGTkxIRkNRVUZ4UWl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVOb1F5eE5RVUZOTEc5Q1FVRnZRaXhIUVVGSExHTkJRV01zWVVGQllTeERRVUZETzBsQlEzSkVMRmRCUVZjc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFppeEpRVUZKTEV0QlFVc3NSMEZCUnl4eFFrRkJjVUlzUTBGQlF6dFJRVU5zUXl4TlFVRk5MRmxCUVZrc1IwRkJSeXh4UWtGQmNVSXNRMEZCUXp0UlFVTXpReXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMUZCUld4Q0xFbEJRVWtzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVONlFpeExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMU5CUTJwQ0xFMUJRVTBzU1VGQlNTeFJRVUZSTEV0QlFVc3NUMEZCVHl4TFFVRkxMRVZCUVVVN1dVRkRiRU1zVFVGQlRTeFhRVUZYTEVkQlFVY3NVVUZCVVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU40UXl4SlFVRkpMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zVjBGQlZ5eERRVUZETEVWQlFVVTdaMEpCUXk5Q0xFdEJRVXNzUjBGQlJ5eFhRVUZYTEVOQlFVTTdZVUZEZGtJc1RVRkJUVHRuUWtGRFNDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1ZVRkJWU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEZEVNN1UwRkRTaXhOUVVGTk8xbEJRMGdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2RDUVVGblFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROVU03TzFGQlJVUXNTMEZCU3l4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNoRE96dEpRVVZFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRWaXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMHNTVUZCU1N4RFFVRkRPMWxCUTJ4RExHRkJRV0VzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnlRaXhEUVVGRExFTkJRVU03UzBGRFRqczdTVUZGUkN4WFFVRlhMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJRenRaUVVOc1F5eGhRVUZoTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRja0lzUTBGQlF5eERRVUZETzB0QlEwNDdPMGxCUlVRc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVTdVVUZEVml4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRFppeFRRVUZUTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZET1VRc1lVRkJZU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0VFFVTjRRaXhEUVVGRExFTkJRVU03UzBGRFRqdERRVU5LT3p0QlEyeEZSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVWRCTEUxQlFVMHNiMEpCUVc5Q0xFZEJRVWNzUlVGQlJTeERRVUZETzBGQlEyaERMRTFCUVUwc2JVSkJRVzFDTEVkQlFVY3NZMEZCWXl4aFFVRmhMRU5CUVVNN1NVRkRjRVFzVjBGQlZ5eERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTm1MRWxCUVVrc1MwRkJTeXhIUVVGSExHOUNRVUZ2UWl4RFFVRkRPMUZCUTJwRExFMUJRVTBzV1VGQldTeEhRVUZITEc5Q1FVRnZRaXhEUVVGRE8xRkJRekZETEUxQlFVMHNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenM3VVVGRmJFSXNTVUZCU1N4UlFVRlJMRXRCUVVzc1QwRkJUeXhMUVVGTExFVkJRVVU3V1VGRE0wSXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJRenRUUVVOcVFpeE5RVUZOTzFsQlEwZ3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxHZENRVUZuUWl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE5VTTdPMUZCUlVRc1MwRkJTeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEZsQlFWa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM2hET3p0SlFVVkVMRkZCUVZFc1IwRkJSenRSUVVOUUxFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hOUVVGTkxFVkJRVVVzUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFR0VFFVTjBReXhEUVVGRExFTkJRVU03UzBGRFRqdERRVU5LT3p0QlF6TkRSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVU5CTzBGQlEwRXNRVUZGUVN4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTndReXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMR05CUVdNc1lVRkJZU3hEUVVGRE8wbEJRMjVFTEZkQlFWY3NRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRaaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eHRRa0ZCYlVJc1EwRkJRenRSUVVOb1F5eE5RVUZOTEZsQlFWa3NSMEZCUnl4dFFrRkJiVUlzUTBGQlF6dFJRVU42UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03TzFGQlJXeENMRWxCUVVrc1VVRkJVU3hMUVVGTExFOUJRVThzUzBGQlN5eEZRVUZGTzFsQlF6TkNMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VTBGRGFrSXNUVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeG5Ra0ZCWjBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6VkRPenRSUVVWRUxFdEJRVXNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4WlFVRlpMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU40UXp0RFFVTktPenRCUTNSRFJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVbEJMRTFCUVUwc2NVSkJRWEZDTEVkQlFVY3NTMEZCU3l4RFFVRkRPMEZCUTNCRExFMUJRVTBzYjBKQlFXOUNMRWRCUVVjc1kwRkJZeXhoUVVGaExFTkJRVU03U1VGRGNrUXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVObUxFbEJRVWtzUzBGQlN5eEhRVUZITEhGQ1FVRnhRaXhEUVVGRE8xRkJRMnhETEUxQlFVMHNXVUZCV1N4SFFVRkhMSEZDUVVGeFFpeERRVUZETzFGQlF6TkRMRTFCUVUwc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6czdVVUZGYkVJc1NVRkJTU3hMUVVGTExGbEJRVmtzVDBGQlR5eEZRVUZGTzFsQlF6RkNMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VTBGRGFrSXNUVUZCVFN4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU5zUXl4SlFVRkpMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdaMEpCUTNKQ0xFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdZVUZEYUVJc1RVRkJUU3hKUVVGSkxGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1owSkJRemRDTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1lVRkRha0lzVFVGQlRUdG5Ra0ZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVlVGQlZTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRkRU03VTBGRFNpeE5RVUZOTzFsQlEwZ3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxHZENRVUZuUWl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE5VTTdPMUZCUlVRc1MwRkJTeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEZsQlFWa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM2hET3p0SlFVVkVMRTFCUVUwc1IwRkJSenRSUVVOTUxFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hOUVVGTkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFR0VFFVTjRReXhEUVVGRExFTkJRVU03UzBGRFRqczdTVUZGUkN4UFFVRlBMRWRCUVVjN1VVRkRUaXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1RVRkJUU3hMUVVGTExFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMDdVMEZEZWtNc1EwRkJReXhEUVVGRE8wdEJRMDQ3UTBGRFNqczdRVU14UkVRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGTFFTeE5RVUZOTEZOQlFWTXNSMEZCUnl4TlFVRk5PMGxCUTNCQ0xGZEJRVmNzUjBGQlJ6dExRVU5pT3p0SlFVVkVMRTlCUVU4c1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFdDeFBRVUZQTEVsQlFVa3NiMEpCUVc5Q0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdTMEZETVVNN08wbEJSVVFzUzBGQlN5eERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTlVMRTlCUVU4c1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVONFF6czdTVUZGUkN4UFFVRlBMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEc5Q1FVRnZRaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlF6RkRPenRKUVVWRUxFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVml4UFFVRlBMRWxCUVVrc2JVSkJRVzFDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRla003TzBOQlJVb3NRMEZCUXpzN1FVRkZSaXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRWxCUVVrc1UwRkJVeXhGUVVGRk96dEJRemxETVVNN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGSlFTeE5RVUZOUVN4VlFVRlJMRWRCUVVjc1dVRkJXU3hEUVVGRE96czdRVUZIT1VJc1RVRkJUVU1zYVVKQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeGpRVUZqTEVkQlFVY3NUVUZCVFN4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTm9ReXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRlZCUVZVc1EwRkJRenM3TzBGQlIzUkRMRTFCUVUxRExGRkJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEZGQlFWRXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE96czdPenM3T3pzN096czdPenM3T3pzN096dEJRVzlDTDBJc1RVRkJUU3hUUVVGVExFZEJRVWNzWTBGQll5eHJRa0ZCYTBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6czdPenM3T3pzN096czdPenRKUVdFMVJDeFhRVUZYTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeFBRVUZQTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVN1VVRkROVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdPMUZCUlZJc1RVRkJUU3hWUVVGVkxFZEJRVWRETEd0Q1FVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRSaXhwUWtGQlpTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZSU3hKUVVGSkxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVTdXVUZEY0VKRExGRkJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRFJDeHBRa0ZCWlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5PMWxCUTBnc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRFJEUVVFMFF5eERRVUZETEVOQlFVTTdVMEZET1VVN08xRkJSVVFzVFVGQlRTeFRRVUZUTEVkQlFVZEZMR3RDUVVGUkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETjBVc1NVRkJTU3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEyNUNMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RlFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFRRVU5vUkN4TlFVRk5PMWxCUTBnc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMREpEUVVFeVF5eERRVUZETEVOQlFVTTdVMEZETjBVN08xRkJSVVFzVFVGQlRTeFZRVUZWTEVkQlFVZEJMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtZc1NVRkJTU3hWUVVGVkxFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEzQkNMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUTNoQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5PenRaUVVWSUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU03VTBGRGVrTTdPMUZCUlVRc1RVRkJUU3haUVVGWkxFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFOUJRVThzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTTdZVUZEYkVZc1RVRkJUU3hGUVVGRkxFTkJRVU03VVVGRFpDeEpRVUZKTEZsQlFWa3NRMEZCUXl4UFFVRlBMRVZCUVVVN1dVRkRkRUlzVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1QwRkJUeXhEUVVGRExFTkJRVU03V1VGRE5VSXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhyUWtGQmEwSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJRenRUUVVOc1JDeE5RVUZOT3p0WlFVVklMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dFRRVU0xUXp0TFFVTktPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JUml4cFFrRkJaVHRaUVVObUxHTkJRV003V1VGRFpDeGxRVUZsTzFsQlEyWXNhMEpCUVd0Q08xTkJRM0pDTEVOQlFVTTdTMEZEVERzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0TFFVTnVRanM3U1VGRlJDeHZRa0ZCYjBJc1IwRkJSenRMUVVOMFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlQwTXNVVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN096czdPenRKUVU5RUxFbEJRVWtzU1VGQlNTeEhRVUZITzFGQlExQXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpORU8wbEJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRek5DTEVsQlFVa3NTVUZCU1N4TFFVRkxMRkZCUVZFc1JVRkJSVHRaUVVOdVFpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8xTkJRM3BETEUxQlFVMDdXVUZEU0N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTm9SRHRMUVVOS096czdPenM3TzBsQlQwUXNVMEZCVXl4SFFVRkhPMUZCUTFJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFsQlEyeENMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMR2RDUVVGblFpeEZRVUZGTzJkQ1FVTTFSQ3hOUVVGTkxFVkJRVVU3YjBKQlEwb3NUVUZCVFN4RlFVRkZMRWxCUVVrN2FVSkJRMlk3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMUZCUTBRc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRla0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4clFrRkJhMElzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTTFReXhQUVVGUExFbEJRVWtzUTBGQlF6dExRVU5tT3pzN096dEpRVXRFTEU5QlFVOHNSMEZCUnp0UlFVTk9MRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dExRVU0xUXpzN096czdPenRKUVU5RUxFbEJRVWtzVDBGQlR5eEhRVUZITzFGQlExWXNUMEZCVHl4SlFVRkpMRXRCUVVzc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTjBRenM3T3pzN096dEpRVTlFTEZGQlFWRXNSMEZCUnp0UlFVTlFMRTlCUVU4c1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNwQ096czdPenM3T3pzN1NVRlRSQ3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlExWXNUVUZCVFN4UlFVRlJMRWRCUVVjc1MwRkJTeXhEUVVGRExFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpGRExFMUJRVTBzVTBGQlV5eEhRVUZITEV0QlFVc3NRMEZCUXl4TFFVRkxMRXRCUVVzc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU0zUXl4UFFVRlBMRXRCUVVzc1MwRkJTeXhKUVVGSkxFdEJRVXNzVVVGQlVTeEpRVUZKTEZOQlFWTXNRMEZCUXl4RFFVRkRPMHRCUTNCRU8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlEwWXNWVUZCVVN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE96czdPenM3T3pzN1FVRlRiRVFzVFVGQlRTeHhRa0ZCY1VJc1IwRkJSeXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZET3p0QlEyeFBkRVU3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFYRkNRU3hCUVVsQkxFMUJRVTFCTEZWQlFWRXNSMEZCUnl4VFFVRlRMRU5CUVVNN08wRkJSVE5DTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWRCUVVjc1EwRkJRenRCUVVNelFpeE5RVUZOTEdOQlFXTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRla0lzVFVGQlRTeGhRVUZoTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTndRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEY0VJc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRNMElzVFVGQlRTeGxRVUZsTEVkQlFVY3NSMEZCUnl4RFFVRkRPenRCUVVVMVFpeE5RVUZOTEdWQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHBRa0ZCYVVJc1IwRkJSeXhUUVVGVExFTkJRVU03UVVGRGNFTXNUVUZCVFN4alFVRmpMRWRCUVVjc1RVRkJUU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzVlVGQlZTeERRVUZETzBGQlEzUkRMRTFCUVUwc1YwRkJWeXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU40UWl4TlFVRk5MRmRCUVZjc1IwRkJSeXhIUVVGSExFTkJRVU03TzBGQlJYaENMRTFCUVUwc1lVRkJZU3hIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU14UWl4TlFVRk5MREJDUVVFd1FpeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTjBReXhOUVVGTkxHbENRVUZwUWl4SFFVRkhMRWRCUVVjc1EwRkJRenRCUVVNNVFpeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU16UWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhoUVVGaExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlF5OUNMRTFCUVUwc1MwRkJTeXhIUVVGSExHRkJRV0VzUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzWVVGQllTeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTndReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEVOQlFVTTdPMEZCUlRGQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxPMGxCUTNKQ0xFOUJRVThzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03UTBGRGFFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eERRVUZETEVsQlFVazdTVUZEY2tJc1RVRkJUU3hOUVVGTkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVNdlFpeFBRVUZQTEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNTVUZCU1N4TlFVRk5MRWxCUVVrc1kwRkJZeXhEUVVGRE8wTkJRemxGTEVOQlFVTTdPenM3T3pzN1FVRlBSaXhOUVVGTkxGVkJRVlVzUjBGQlJ5eE5RVUZOTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEdOQlFXTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenM3UVVGRmVFVXNUVUZCVFN4elFrRkJjMElzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08wRkJSWHBFTEVGQllVRTdPenM3T3pzN096dEJRVk5CTEUxQlFVMHNZVUZCWVN4SFFVRkhMRU5CUVVNc1NVRkJTU3hYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NjMEpCUVhOQ0xFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJRenM3UVVGRmRFWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhMUVVGTE8wbEJRMmhFTEUxQlFVMHNVMEZCVXl4SFFVRkhMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRE4wSXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4bFFVRmxMRU5CUVVNN1NVRkRkRU1zVDBGQlR5eERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMGxCUTNCQ0xFOUJRVThzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU3l4RFFVRkRPMGxCUXpGQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEV0QlFVc3NSMEZCUnl4VFFVRlRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRE8wbEJRelZGTEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVThzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0RFFVTnlRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNVMEZCVXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVNdlF5eE5RVUZOTEV0QlFVc3NTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRE4wSXNUVUZCVFN4bFFVRmxMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhFTEUxQlFVMHNWVUZCVlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRrTXNUVUZCVFN4eFFrRkJjVUlzUjBGQlJ5d3dRa0ZCTUVJc1IwRkJSeXhMUVVGTExFTkJRVU03U1VGRGFrVXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eFZRVUZWTEVkQlFVY3NRMEZCUXl4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyeEZMRTFCUVUwc1dVRkJXU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVVzYVVKQlFXbENMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03TzBsQlJUTkZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyNUZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4RFFVRkRPenRKUVVVelF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZETVVJc1QwRkJUeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFpRVUZaTEVOQlFVTTdTVUZEYWtNc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRMMElzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEhGQ1FVRnhRaXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU14U0N4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dEpRVU42U0N4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6bEpMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJRenRKUVVNMVF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6TklMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8wbEJReTlGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3h4UWtGQmNVSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN08wbEJSWFpITEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRKUVVOcVFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRMEZEY2tJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZOQlFWTXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NTMEZCU3p0SlFVTjRReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdTVUZEWml4UFFVRlBMRU5CUVVNc1UwRkJVeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNUMEZCVHl4RFFVRkRMRk5CUVZNc1IwRkJSeXhUUVVGVExFTkJRVU03U1VGRE9VSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEY2tJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGFFUXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPME5CUTNKQ0xFTkJRVU03T3pzN1FVRkpSaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRelZDTEUxQlFVMHNVMEZCVXl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGFFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU42UWl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZET3pzN096czdPenM3TzBGQlZYcENMRTFCUVUwc1RVRkJUU3hIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN096czdPenM3T3pzN096czdTVUZuUW5wRUxGZEJRVmNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1VVRkJVU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRM0JFTEV0QlFVc3NSVUZCUlN4RFFVRkRPenRSUVVWU0xFMUJRVTBzVTBGQlV5eEhRVUZIUnl4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF6dGhRVU40UlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dGhRVU5pTEZOQlFWTXNRMEZCUXl4VlFVRlZMRVZCUVVVc1EwRkJRenRoUVVOMlFpeExRVUZMTEVOQlFVTTdPMUZCUlZnc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03TzFGQlJUZERMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8yRkJRMjVGTEZOQlFWTXNRMEZCUXl4aFFVRmhMRU5CUVVNN1lVRkRlRUlzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGRkJRVkVzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTTdZVUZET1VVc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTTdZVUZEWml4VFFVRlRMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdZVUZETTBJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMkZCUTNwRUxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEWWl4VFFVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRE8yRkJRM0JDTEV0QlFVc3NRMEZCUXpzN1VVRkZXQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dGhRVU42UkN4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMklzVTBGQlV5eERRVUZETEZOQlFWTXNRMEZCUXp0aFFVTndRaXhMUVVGTExFTkJRVU03T3p0UlFVZFlMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeFpRVUZaTEZOQlFWTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTnlTRHM3U1VGRlJDeFhRVUZYTEd0Q1FVRnJRaXhIUVVGSE8xRkJRelZDTEU5QlFVODdXVUZEU0N4bFFVRmxPMWxCUTJZc2FVSkJRV2xDTzFsQlEycENMR05CUVdNN1dVRkRaQ3hyUWtGQmEwSTdXVUZEYkVJc1YwRkJWenRaUVVOWUxGZEJRVmM3VTBGRFpDeERRVUZETzB0QlEwdzdPMGxCUlVRc2FVSkJRV2xDTEVkQlFVYzdVVUZEYUVJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRMnhETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRE9VUTdPMGxCUlVRc2IwSkJRVzlDTEVkQlFVYzdVVUZEYmtJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemRFTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN096dEpRVkZFTEZOQlFWTXNSMEZCUnp0UlFVTlNMRTlCUVU4c1lVRkJZU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTnVRenM3T3pzN096czdTVUZSUkN4UlFVRlJMRWRCUVVjN1VVRkRVQ3hQUVVGUExFbEJRVWtzUTBGQlF5eFRRVUZUTEVWQlFVVXNRMEZCUXp0TFFVTXpRanM3T3pzN096dEpRVTlFTEVsQlFVa3NTVUZCU1N4SFFVRkhPMUZCUTFBc1QwRkJUeXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNMEk3U1VGRFJDeEpRVUZKTEV0QlFVc3NRMEZCUXl4UlFVRlJMRVZCUVVVN1VVRkRhRUlzU1VGQlNTeEpRVUZKTEV0QlFVc3NVVUZCVVN4RlFVRkZPMWxCUTI1Q0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1dVRkRkRU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03VTBGRGJrTXNUVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMWxCUXpOQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xTkJRMmhFTzB0QlEwbzdPenM3T3pzN08wbEJVVVFzU1VGQlNTeE5RVUZOTEVkQlFVYzdVVUZEVkN4UFFVRlBMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETlVJN1NVRkRSQ3hKUVVGSkxFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEWml4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTXhRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eE5RVUZOTEVWQlFVVTdXVUZEYWtJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0VFFVTnVReXhOUVVGTk8xbEJRMGdzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4VFFVRlRMRVZCUVVVc1RVRkJUU3hEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTTdVMEZEYmtRN1MwRkRTanM3T3pzN096dEpRVTlFTEVsQlFVa3NWMEZCVnl4SFFVRkhPMUZCUTJRc1QwRkJUeXhKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRemRGTzBsQlEwUXNTVUZCU1N4WFFVRlhMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMllzU1VGQlNTeEpRVUZKTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTFvc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdXVUZEWkN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF6dFRRVU5xUWl4TFFVRkxPMWxCUTBZc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRha0lzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRXQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMHRCUTBvN096czdPenM3U1VGUFJDeEpRVUZKTEVOQlFVTXNSMEZCUnp0UlFVTktMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTjJRanRKUVVORUxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0UlFVTlNMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTI1Q0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRMmhET3pzN096czdPMGxCVDBRc1NVRkJTU3hEUVVGRExFZEJRVWM3VVVGRFNpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGRrSTdTVUZEUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVU3VVVGRFVpeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU51UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096dEpRVTlFTEVsQlFVa3NVVUZCVVN4SFFVRkhPMUZCUTFnc1QwRkJUeXhUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpsQ08wbEJRMFFzU1VGQlNTeFJRVUZSTEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTJZc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEyWXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFRRVU53UXl4TlFVRk5PMWxCUTBnc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4SlFVRkpMRWRCUVVjc1kwRkJZeXhEUVVGRE8xbEJRMnBFTEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1dVRkRlRU1zU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4VlFVRlZMRVZCUVVVc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXp0VFFVTnlSRHRMUVVOS096czdPenM3T3p0SlFWRkVMRTlCUVU4c1IwRkJSenRSUVVOT0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVN1dVRkRhRUlzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU01UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUlVGQlJTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkROME1zU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhsUVVGbExFVkJRVVU3WjBKQlEyaEVMRTFCUVUwc1JVRkJSVHR2UWtGRFNpeEhRVUZITEVWQlFVVXNTVUZCU1R0cFFrRkRXanRoUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlExQTdTMEZEU2pzN096czdPenM3TzBsQlUwUXNUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSVHRSUVVOWUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVN1dVRkRhRUlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNN1dVRkRja0lzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhqUVVGakxFVkJRVVU3WjBKQlF5OURMRTFCUVUwc1JVRkJSVHR2UWtGRFNpeEhRVUZITEVWQlFVVXNTVUZCU1R0dlFrRkRWQ3hOUVVGTk8ybENRVU5VTzJGQlEwb3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRVRHRMUVVOS096czdPenM3TzBsQlQwUXNUVUZCVFN4SFFVRkhPMUZCUTB3c1QwRkJUeXhKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0TFFVTXZRanM3T3pzN096czdPMGxCVTBRc1UwRkJVeXhEUVVGRExFMUJRVTBzUlVGQlJUdFJRVU5rTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRk8xbEJRemRETEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTzJkQ1FVTnNSQ3hOUVVGTkxFVkJRVVU3YjBKQlEwb3NSMEZCUnl4RlFVRkZMRWxCUVVrN2IwSkJRMVFzVFVGQlRUdHBRa0ZEVkR0aFFVTktMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMUE3UzBGRFNqczdPenM3T3pzN096czdPMGxCV1VRc1RVRkJUU3hEUVVGRExFOUJRVThzUlVGQlJTeFBRVUZQTEVWQlFVVXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFVkJRVVU3VVVGRGNrUXNUVUZCVFN4TFFVRkxMRWRCUVVjc1QwRkJUeXhIUVVGSExHRkJRV0VzUTBGQlF6dFJRVU4wUXl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlF6TkNMRTFCUVUwc1RVRkJUU3hIUVVGSExFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTTdVVUZETjBJc1RVRkJUU3hUUVVGVExFZEJRVWNzVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXpzN1VVRkZia01zVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhYUVVGWExFTkJRVU03TzFGQlJUTkNMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyWXNWVUZCVlN4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFOQlEzWkVPenRSUVVWRUxFbEJRVWtzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4UlFVRlJMRVZCUVVVN1dVRkRja0lzVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTjRReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU4yUXl4UFFVRlBMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVONlJEczdVVUZGUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6czdVVUZGTlVNc1VVRkJVU3hKUVVGSkxFTkJRVU1zU1VGQlNUdFJRVU5xUWl4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNCRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNSRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNCRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhEUVVGRExFVkJRVVU3V1VGRFNpeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOMFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE1VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTTVSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4RFFVRkRMRVZCUVVVN1dVRkRTaXhUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTjBSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRjRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU01UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZETVVRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZETVVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY2tRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE1VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzcEVMRTFCUVUwN1UwRkRWRHRSUVVORUxGRkJRVkU3VTBGRFVEczdPMUZCUjBRc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpGRE8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlEwZ3NWVUZCVVN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE96dEJRekZtTDBNN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOUVN4VlFVRlJMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTTdPenM3T3pzN1FVRlBia01zVFVGQlRTeGhRVUZoTEVkQlFVY3NZMEZCWXl4WFFVRlhMRU5CUVVNN096czdPMGxCU3pWRExGZEJRVmNzUjBGQlJ6dFJRVU5XTEV0QlFVc3NSVUZCUlN4RFFVRkRPMHRCUTFnN08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1VVRkRhRUlzU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVU3V1VGRE1VSXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXh4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMU5CUXpORE96dFJRVVZFTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3hEUVVGRExFdEJRVXNzUzBGQlN6czdXVUZGTDBNc1NVRkJTU3hEUVVGRExFOUJRVTg3YVVKQlExQXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dHBRa0ZETTBNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVOc1F5eERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0TFFVTjBRanM3T3pzN096dEpRVTlFTEVsQlFVa3NUMEZCVHl4SFFVRkhPMUZCUTFZc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRFNTeFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNKRU8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlEwb3NWVUZCVVN4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE96dEJReTlFZEVRN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJiMEpCTEVGQlRVRXNUVUZCVFVFc1YwRkJVU3hIUVVGSExHZENRVUZuUWl4RFFVRkRPenRCUVVWc1F5eE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU0zUWl4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTnNReXhOUVVGTkxEaENRVUU0UWl4SFFVRkhMRXRCUVVzc1EwRkJRenRCUVVNM1F5eE5RVUZOTERaQ1FVRTJRaXhIUVVGSExFdEJRVXNzUTBGQlF6dEJRVU0xUXl4TlFVRk5MRGhDUVVFNFFpeEhRVUZITEV0QlFVc3NRMEZCUXpzN1FVRkZOME1zVFVGQlRTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTJoQ0xFMUJRVTBzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1FVRkZhRUlzVFVGQlRTeGhRVUZoTEVkQlFVY3NTVUZCU1N4SFFVRkhMR2RDUVVGblFpeERRVUZETzBGQlF6bERMRTFCUVUwc1kwRkJZeXhIUVVGSExFbEJRVWtzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRCUVVNdlF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE96dEJRVVZvUkN4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYQkNMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEZGQlFWRXNRMEZCUXp0QlFVTnNReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMRmxCUVZrc1EwRkJRenRCUVVNeFF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUTBGQlF6dEJRVU4wUXl4TlFVRk5MR2REUVVGblF5eEhRVUZITEhkQ1FVRjNRaXhEUVVGRE8wRkJRMnhGTEUxQlFVMHNLMEpCUVN0Q0xFZEJRVWNzZFVKQlFYVkNMRU5CUVVNN1FVRkRhRVVzVFVGQlRTeG5RMEZCWjBNc1IwRkJSeXgzUWtGQmQwSXNRMEZCUXp0QlFVTnNSU3hOUVVGTkxIVkNRVUYxUWl4SFFVRkhMR1ZCUVdVc1EwRkJRenM3UVVGRmFFUXNUVUZCVFN4WFFVRlhMRWRCUVVjc1EwRkJReXhaUVVGWkxFVkJRVVVzWVVGQllTeEhRVUZITEVOQlFVTXNTMEZCU3p0SlFVTnlSQ3hOUVVGTkxFMUJRVTBzUjBGQlJ5eFJRVUZSTEVOQlFVTXNXVUZCV1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRekZETEU5QlFVOHNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eGhRVUZoTEVkQlFVY3NUVUZCVFN4RFFVRkRPME5CUTNoRUxFTkJRVU03TzBGQlJVWXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eERRVUZETEZsQlFWa3NSVUZCUlN4WlFVRlpMRXRCUVVzN1NVRkRkRVFzVDBGQlQwY3NhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zV1VGQldTeERRVUZETzFOQlEyaERMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFlpeFRRVUZUTEVOQlFVTXNXVUZCV1N4RFFVRkRPMU5CUTNaQ0xFdEJRVXNzUTBGQlF6dERRVU5rTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3d3UWtGQk1FSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVVVzV1VGQldTeExRVUZMTzBsQlEyaEZMRWxCUVVrc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0UlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJReTlETEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRPMHRCUTNaRU8wbEJRMFFzVDBGQlR5eFpRVUZaTEVOQlFVTTdRMEZEZGtJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4RFFVRkRMR0ZCUVdFc1JVRkJSU3hUUVVGVExFVkJRVVVzV1VGQldTeExRVUZMTzBsQlF6TkVMRWxCUVVrc1UwRkJVeXhMUVVGTExHRkJRV0VzU1VGQlNTeE5RVUZOTEV0QlFVc3NZVUZCWVN4RlFVRkZPMUZCUTNwRUxFOUJRVThzU1VGQlNTeERRVUZETzB0QlEyWXNUVUZCVFN4SlFVRkpMRTlCUVU4c1MwRkJTeXhoUVVGaExFVkJRVVU3VVVGRGJFTXNUMEZCVHl4TFFVRkxMRU5CUVVNN1MwRkRhRUlzVFVGQlRUdFJRVU5JTEU5QlFVOHNXVUZCV1N4RFFVRkRPMHRCUTNaQ08wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRGVrUXNTVUZCU1N4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzFGQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eFZRVUZWTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1YwRkJWeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGJFWTdPMGxCUlVRc1QwRkJUeXhaUVVGWkxFTkJRVU03UTBGRGRrSXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGNrTXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenRCUVVWNlF5eE5RVUZOTEU5QlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6czdRVUZGTDBRc1RVRkJUU3haUVVGWkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdTVUZETlVJc1NVRkJTU3hUUVVGVExFdEJRVXNzYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzFGQlF6ZERMR3RDUVVGclFpeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGNFTTdPMGxCUlVRc1QwRkJUeXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UTBGRGVFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRXRCUVVzN1NVRkRka01zYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU03UTBGREwwUXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxFOUJRVThzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3l4WlFVRlpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN08wRkJSWEpGTEUxQlFVMHNWMEZCVnl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4TFFVRkxPMGxCUXpsRExFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMUZCUTJoQ0xFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6czdVVUZGTVVRc1MwRkJTeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVWQlFVVTdXVUZEY0VJc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFOQlF6ZERPMHRCUTBvN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTE8wbEJRM1JDTEdWQlFXVXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE1VSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3VVVGRGFFSXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU4yUkR0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1NVRkRla0lzVjBGQlZ5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOd1JDeGxRVUZsTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UTBGRE9VSXNRMEZCUXpzN096dEJRVWxHTEUxQlFVMHNTVUZCU1N4SFFVRkhMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRPMEZCUTNSRExFMUJRVTBzU1VGQlNTeEhRVUZITEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRCUVVNMVFpeE5RVUZOTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UVVGRE5VSXNUVUZCVFN4WlFVRlpMRWRCUVVjc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eERRVUZETzBGQlF6VkRMRTFCUVUwc1VVRkJVU3hIUVVGSExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXpzN08wRkJSM0JETEUxQlFVMHNaME5CUVdkRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVWQlFVVXNUMEZCVHl4RlFVRkZMRTlCUVU4c1MwRkJTenRKUVVOdVJTeE5RVUZOTEZOQlFWTXNSMEZCUnl4TlFVRk5MRU5CUVVNc2NVSkJRWEZDTEVWQlFVVXNRMEZCUXpzN1NVRkZha1FzVFVGQlRTeERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRk5CUVZNc1EwRkJReXhKUVVGSkxFbEJRVWtzVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4VFFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGRFVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1QwRkJUeXhIUVVGSExGTkJRVk1zUTBGQlF5eEhRVUZITEVsQlFVa3NUVUZCVFN4RFFVRkRMRTFCUVUwc1IwRkJSeXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdPMGxCUlhaRkxFOUJRVThzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1EwRkRha0lzUTBGQlF6czdRVUZGUml4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxPMGxCUTJoRExFMUJRVTBzVFVGQlRTeEhRVUZITEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03T3p0SlFVZHNReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEYUVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzBsQlEycENMRWxCUVVrc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU4yUWl4SlFVRkpMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU03U1VGRE1VSXNTVUZCU1N4WFFVRlhMRWRCUVVjc1NVRkJTU3hEUVVGRE96dEpRVVYyUWl4TlFVRk5MRTlCUVU4c1IwRkJSeXhOUVVGTk8xRkJRMnhDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRXRCUVVzc1NVRkJTU3haUVVGWkxFdEJRVXNzUzBGQlN5eEZRVUZGT3p0WlFVVXhReXhOUVVGTkxHVkJRV1VzUjBGQlJ5eExRVUZMTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSVVVzVlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlVRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzWkhMRWxCUVVrc1kwRkJZeXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzJkQ1FVTjZRaXhqUVVGakxFTkJRVU1zVTBGQlV5eERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMkZCUXpkRExFMUJRVTA3WjBKQlEwZ3NZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF6dGhRVU14UXp0WlFVTkVMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03TzFsQlJXSXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRM1JDT3p0UlFVVkVMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRGRFSXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGbEJRVmtzUjBGQlJ5eE5RVUZOTzFGQlEzWkNMRmRCUVZjc1IwRkJSeXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEU5QlFVOHNSVUZCUlN4TFFVRkxMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGFFVXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eE5RVUZOTzFGQlEzUkNMRTFCUVUwc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdVVUZEYWtNc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dExRVU4wUWl4RFFVRkRPenRKUVVWR0xFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGFFTXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhGUVVGRk96dFpRVVZvUWl4TlFVRk5MRWRCUVVjN1owSkJRMHdzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBPMmRDUVVOb1FpeERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4N1lVRkRia0lzUTBGQlF6czdXVUZGUml4alFVRmpMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNaME5CUVdkRExFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdPMWxCUlRWSExFbEJRVWtzU1VGQlNTeExRVUZMTEdOQlFXTXNSVUZCUlRzN1owSkJSWHBDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2JVSkJRVzFDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2IwSkJRVzlDTEVWQlFVVTdiMEpCUXpORUxFdEJRVXNzUjBGQlJ5eFpRVUZaTEVOQlFVTTdiMEpCUTNKQ0xGbEJRVmtzUlVGQlJTeERRVUZETzJsQ1FVTnNRaXhOUVVGTkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3YjBKQlEyNURMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03YjBKQlEySXNXVUZCV1N4RlFVRkZMRU5CUVVNN2FVSkJRMnhDTEUxQlFVMHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0dlFrRkRjRU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0cFFrRkRhRUk3WVVGRFNqczdVMEZGU2p0TFFVTktMRU5CUVVNN08wbEJSVVlzVFVGQlRTeGxRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRMMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFZ3NTVUZCU1N4UlFVRlJMRXRCUVVzc1MwRkJTeXhGUVVGRk8xbEJRM0JDTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExGVkJRVlVzUTBGQlF6dFRRVU53UXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUdFpRVU5vUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTTdVMEZEYUVNc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRk5CUVZNc1EwRkJRenRUUVVOdVF6dExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZEY0VJc1NVRkJTU3hKUVVGSkxFdEJRVXNzUzBGQlN5eEpRVUZKTEZsQlFWa3NTMEZCU3l4TFFVRkxMRVZCUVVVN096dFpRVWN4UXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdPMWxCUlRsRExFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU5zUXl4TFFVRkxMRWRCUVVjc1VVRkJVU3hEUVVGRE8yZENRVU5xUWl4WFFVRlhMRVZCUVVVc1EwRkJRenM3WjBKQlJXUXNUVUZCVFN4NVFrRkJlVUlzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eExRVUZMTEdOQlFXTXNRMEZCUXl4RFFVRkRPMmRDUVVOdVJpeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZMSGxDUVVGNVFpeERRVUZETEVOQlFVTTdaMEpCUXpsRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdZVUZEYUVZN1UwRkRTaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXpRaXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMmhHTzB0QlEwb3NRMEZCUXpzN1NVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0UlFVTXZRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eGpRVUZqTEVsQlFVa3NVVUZCVVN4TFFVRkxMRXRCUVVzc1JVRkJSVHRaUVVNdlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEY0VNc1RVRkJUU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFpRVVZ3UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSVEZETEUxQlFVMHNXVUZCV1N4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzJkQ1FVTnlReXhIUVVGSExFVkJRVVVzWTBGQll6dG5Ra0ZEYmtJc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTzJkQ1FVTlVMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJUdGhRVU5hTEVOQlFVTXNRMEZCUXpzN1dVRkZTQ3hOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NXVUZCV1N4SFFVRkhMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXpzN1dVRkZMMFFzWTBGQll5eERRVUZETEZkQlFWY3NSMEZCUnl4VFFVRlRMRU5CUVVNN1UwRkRNVU03T3p0UlFVZEVMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGRFSXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenM3TzFGQlIySXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wdEJRM1JDTEVOQlFVTTdPenM3T3pzN08wbEJVVVlzU1VGQlNTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eGpRVUZqTEV0QlFVczdVVUZEZWtNc1QwRkJUeXhEUVVGRExGVkJRVlVzUzBGQlN6dFpRVU51UWl4SlFVRkpMRlZCUVZVc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVN1owSkJRemRETEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFrUXNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1lVRkRla003V1VGRFJDeE5RVUZOTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1ZVRkJWU3hEUVVGRExHTkJRV01zUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE1VVXNRMEZCUXp0TFFVTk1MRU5CUVVNN08wbEJSVVlzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGbEJRVmtzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzSkZMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1owSkJRV2RDTEVOQlFVTXNRMEZCUXpzN1NVRkZka1FzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdFJRVU0zUWl4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNWMEZCVnl4RlFVRkZMR2RDUVVGblFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRVVzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTVRenM3U1VGRlJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzlDUVVGdlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzFDUVVGdFFpeEZRVUZGTzFGQlF6TkVMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1pVRkJaU3hEUVVGRExFTkJRVU03UzBGRGVrUTdPMGxCUlVRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnBGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUlVGQlJTeGxRVUZsTEVOQlFVTXNRMEZCUXp0RFFVTjRSQ3hEUVVGRE96czdPenM3T3p0QlFWRkdMRTFCUVUwc1dVRkJXU3hIUVVGSExHTkJRV01zVjBGQlZ5eERRVUZET3pzN096dEpRVXN6UXl4WFFVRlhMRWRCUVVjN1VVRkRWaXhMUVVGTExFVkJRVVVzUTBGQlF6dFJRVU5TTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhIUVVGSExHTkJRV01zUTBGQlF6dFJRVU53UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJrUXNUVUZCVFN4TlFVRk5MRWRCUVVjc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPenRSUVVVelFpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4alFVRmpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8xRkJRMmhFTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzVlVGQlZTeERRVUZETzFsQlF6ZENMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN6dFpRVU5xUWl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTA3V1VGRGJrSXNUMEZCVHl4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUE8xbEJRM0pDTEZWQlFWVXNSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWVHRUUVVNNVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTktMR2RDUVVGblFpeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096dEpRVVZFTEZkQlFWY3NhMEpCUVd0Q0xFZEJRVWM3VVVGRE5VSXNUMEZCVHp0WlFVTklMR1ZCUVdVN1dVRkRaaXhuUWtGQlowSTdXVUZEYUVJc2IwSkJRVzlDTzFsQlEzQkNMR3RDUVVGclFqdFpRVU5zUWl4blEwRkJaME03V1VGRGFFTXNaME5CUVdkRE8xbEJRMmhETEN0Q1FVRXJRanRaUVVNdlFpeDFRa0ZCZFVJN1UwRkRNVUlzUTBGQlF6dExRVU5NT3p0SlFVVkVMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRVZCUVVVc1VVRkJVU3hGUVVGRk8xRkJReTlETEUxQlFVMHNUVUZCVFN4SFFVRkhMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYWtNc1VVRkJVU3hKUVVGSk8xRkJRMW9zUzBGQlN5eGxRVUZsTEVWQlFVVTdXVUZEYkVJc1RVRkJUU3hMUVVGTExFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJRenRaUVVOc1JpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03V1VGRE1VSXNUVUZCVFN4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETlVNc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5Ra0ZCWjBJc1JVRkJSVHRaUVVOdVFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4cFFrRkJhVUlzUTBGQlF5eFJRVUZSTEVWQlFVVXNWMEZCVnl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxHTkJRV01zUTBGQlF5eERRVUZETzFsQlEzQkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0WlFVTTFRaXhOUVVGTkxFTkJRVU1zV1VGQldTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzYjBKQlFXOUNMRVZCUVVVN1dVRkRka0lzVFVGQlRTeFZRVUZWTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVU1zVVVGQlVTeEZRVUZGTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMWxCUXpWR0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4SFFVRkhMRlZCUVZVc1EwRkJRenRaUVVOd1F5eE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMR3RDUVVGclFpeEZRVUZGTzFsQlEzSkNMRTFCUVUwc1QwRkJUeXhIUVVGSExHbENRVUZwUWl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6dFpRVU4yUml4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUjBGQlJ5eFBRVUZQTEVOQlFVTTdXVUZET1VJc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5RMEZCWjBNc1JVRkJSVHRaUVVOdVF5eE5RVUZOTEdkQ1FVRm5RaXhIUVVGSFJDeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1EwRkJReXhSUVVGUkxFVkJRVVVzVlVGQlZTeERRVUZETEZGQlFWRXNSVUZCUlN4blEwRkJaME1zUlVGQlJTdzRRa0ZCT0VJc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyeEtMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU03V1VGRGRrTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1UwRkJVeXhCUVVWU08xTkJRMEU3TzFGQlJVUXNWMEZCVnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRM0pDT3p0SlFVVkVMR2xDUVVGcFFpeEhRVUZITzFGQlEyaENMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4bFFVRmxMRVZCUVVVc1RVRkJUU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpSQ3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNUVUZCVFN4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czdPMUZCUjJoRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZWtNN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3TzBsQlJVUXNaVUZCWlN4SFFVRkhPMHRCUTJwQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hKUVVGSkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTkhMRlZCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGJFUTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxHMUNRVUZ0UWl4SFFVRkhPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4dFFrRkJiVUlzUTBGQlF6dExRVU14UXpzN096czdPenRKUVU5RUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl3d1FrRkJNRUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNaVUZCWlN4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE8wdEJRek5GT3pzN096czdTVUZOUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZENRVUZuUWl4RlFVRkZMR05CUVdNc1EwRkJReXhEUVVGRE8wdEJRemRGT3pzN096czdTVUZOUkN4SlFVRkpMRlZCUVZVc1IwRkJSenRSUVVOaUxFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHOUNRVUZ2UWl4RlFVRkZMR3RDUVVGclFpeERRVUZETEVOQlFVTTdTMEZEY2tZN096czdPenM3U1VGUFJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR3RDUVVGclFpeEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03UzBGRGFrWTdPenM3T3p0SlFVMUVMRWxCUVVrc2IwSkJRVzlDTEVkQlFVYzdVVUZEZGtJc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owTkJRV2RETEVWQlFVVXNPRUpCUVRoQ0xFTkJRVU1zUTBGQlF6dExRVU4wUnpzN096czdPMGxCVFVRc1NVRkJTU3h0UWtGQmJVSXNSMEZCUnp0UlFVTjBRaXhQUVVGUExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3dyUWtGQkswSXNSVUZCUlN3MlFrRkJOa0lzUTBGQlF5eERRVUZETzB0QlEzQkhPenM3T3pzN1NVRk5SQ3hKUVVGSkxHOUNRVUZ2UWl4SFFVRkhPMUZCUTNaQ0xFOUJRVThzYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZERRVUZuUXl4RlFVRkZMRGhDUVVFNFFpeERRVUZETEVOQlFVTTdTMEZEZEVjN096czdPenM3T3p0SlFWTkVMRWxCUVVrc1dVRkJXU3hIUVVGSE8xRkJRMllzVDBGQlR5d3dRa0ZCTUVJc1EwRkJReXhKUVVGSkxFVkJRVVVzZFVKQlFYVkNMRVZCUVVVc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0TFFVTXpSanM3T3pzN096czdPMGxCVTBRc1NVRkJTU3hYUVVGWExFZEJRVWM3VVVGRFpDeEpRVUZKTEZWQlFWVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRFJDeFZRVUZsTEVOQlFVTXNRMEZCUXp0UlFVTnlSQ3hKUVVGSkxFbEJRVWtzUzBGQlN5eFZRVUZWTEVWQlFVVTdXVUZEY2tJc1ZVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTkJMRlZCUVdVc1EwRkJReXhEUVVGRE8xTkJRMnhFT3p0UlFVVkVMRTlCUVU4c1ZVRkJWU3hEUVVGRE8wdEJRM0pDT3pzN096czdPMGxCVDBRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhEUVVGRE8wdEJRMjVET3pzN096czdPenM3TzBsQlZVUXNVMEZCVXl4RFFVRkRMRTFCUVUwc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlR0UlFVTjBReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVN1dVRkRNMElzVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMU5CUTNSQ08xRkJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNoRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMHRCUTNCQ096czdPenM3T3pzN096czdPenM3T3pzN08wbEJiVUpFTEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRMmhDTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhOUVVGTkxGbEJRVmtzVFVGQlRTeEhRVUZITEUxQlFVMHNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEyNUdPenM3T3pzN08wbEJUMFFzVTBGQlV5eERRVUZETEVkQlFVY3NSVUZCUlR0UlFVTllMRWxCUVVrc1IwRkJSeXhEUVVGRExGVkJRVlVzU1VGQlNTeEhRVUZITEVOQlFVTXNWVUZCVlN4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVNelF5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xTkJRM3BDTzB0QlEwbzdPenM3T3pzN096czdPenM3T3pzN08wbEJhVUpFTEZOQlFWTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hGUVVGRk8xRkJRMjVDTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhYUVVGWExFTkJRVU1zVFVGQlRTeFpRVUZaTEZOQlFWTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1NVRkJTU3hUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTnlSenM3T3pzN096dEpRVTlFTEZsQlFWa3NRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRha0lzU1VGQlNTeE5RVUZOTEVOQlFVTXNWVUZCVlN4SlFVRkpMRTFCUVUwc1EwRkJReXhWUVVGVkxFdEJRVXNzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlR0WlFVTTNSQ3hKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZkQlFWY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRUUVVONFF6dExRVU5LT3p0RFFVVktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVOTUxGZEJRVkVzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXpzN1FVTnFiVUp5UkRzN096czdPenM3T3pzN096czdPenM3TzBGQmEwSkJMRUZCUzBFc1RVRkJUU3hEUVVGRExHRkJRV0VzUjBGQlJ5eE5RVUZOTEVOQlFVTXNZVUZCWVN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGVrUXNUMEZCVHl4RlFVRkZMRTlCUVU4N1NVRkRhRUlzVDBGQlR5eEZRVUZGTEZWQlFWVTdTVUZEYmtJc1QwRkJUeXhGUVVGRkxESkNRVUV5UWp0SlFVTndReXhaUVVGWkxFVkJRVVVzV1VGQldUdEpRVU14UWl4TlFVRk5MRVZCUVVVc1RVRkJUVHRKUVVOa0xGTkJRVk1zUlVGQlJTeFRRVUZUTzBsQlEzQkNMR0ZCUVdFc1JVRkJSU3hoUVVGaE8wTkJReTlDTEVOQlFVTXNRMEZCUXlKOSJ9
