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
 * @module
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
 * @module
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

    /**
     * Snap (x,y) to the closest cell in this Layout.
     *
     * @param {Object} diecoordinate - The coordinate to find the closest cell
     * for.
     * @param {Die} [diecoordinat.die = null] - The die to snap to.
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
     * @return {Die|null} The die under coordinates (x, y) or null if no die
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
 * Mixin {@link module:mixin/ReadOnlyAttributes~ReadOnlyAttributes} to a class.
 *
 * @param {*} Sup - The class to mix into.
 * @return {module:mixin/ReadOnlyAttributes~ReadOnlyAttributes} The mixed-in class
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
     * @alias module:mixin/ReadOnlyAttributes~ReadOnlyAttributes
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
/**
 * @module
 */
// The names of the (observed) attributes of the TopPlayerHTMLElement.
const COLOR_ATTRIBUTE = "color";
const NAME_ATTRIBUTE = "name";
const SCORE_ATTRIBUTE = "score";
const HAS_TURN_ATTRIBUTE = "has-turn";

// The private properties of the TopPlayerHTMLElement 
const _color = new WeakMap();
const _name = new WeakMap();
const _score = new WeakMap();
const _hasTurn = new WeakMap();

/**
 * A Player in a dice game.
 *
 * A player's name should be unique in the game. Two different
 * TopPlayerHTMLElement elements with the same name attribute are treated as
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
 * @mixes module:mixin/ReadOnlyAttributes~ReadOnlyAttributes
 */
const TopPlayerHTMLElement = class extends ReadOnlyAttributes(HTMLElement) {

    /**
     * Create a new TopPlayerHTMLElement, optionally based on an intitial
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

        const colorValue = ValidatorSingleton.color(color || this.getAttribute(COLOR_ATTRIBUTE));
        if (colorValue.isValid) {
            _color.set(this, colorValue.value);
            this.setAttribute(COLOR_ATTRIBUTE, this.color);
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
            COLOR_ATTRIBUTE,
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
        return _color.get(this);
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
     * @return {TopPlayerHTMLElement} The player with a turn
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
     * @param {module:TopPlayerHTMLElement~TopPlayerHTMLElement} other - The other player to compare this player with.
     * @return {Boolean} True when either the object references are the same
     * or when both name and color are the same.
     */
    equals(other) {
        const name = "string" === typeof other ? other : other.name;
        return other === this || name === this.name;
    }
};

window.customElements.define("top-player", TopPlayerHTMLElement);

/**
 * The default system player. Dice are thrown by a player. For situations
 * where you want to render a bunch of dice without needing the concept of Players
 * this DEFAULT_SYSTEM_PLAYER can be a substitute. Of course, if you'd like to
 * change the name and/or the color, create and use your own "system player".
 * @const
 */
const DEFAULT_SYSTEM_PLAYER = new TopPlayerHTMLElement({color: "red", name: "*"});

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
//import {ConfigurationError} from "./error/ConfigurationError.js";
/**
 * @module
 */

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
            const playerWithATurn = board.querySelector("top-player-list top-player[has-turn]");
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
 * TopDiceBoardHTMLElement is a custom HTML element to render and control a
 * dice board. 
 *
 * @extends HTMLElement
 */
const TopDiceBoardHTMLElement = class extends HTMLElement {

    /**
     * Create a new TopDiceBoardHTMLElement.
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

        // All dice boards do have a player list. If there isn't one yet,
        // create one.
        if (null === this.querySelector("top-player-list")) {
            this.appendChild(document.createElement("top-player-list"));
        }
    }

    disconnectedCallback() {
    }

    adoptedCallback() {
    }

    /**
     * The GridLayout used by this DiceBoard to layout the dice.
     *
     * @type {module:GridLayout~GridLayout}
     */
    get layout() {
        return _layout.get(this);
    }

    /**
     * The dice on this board. Note, to actually throw the dice use
     * {@link throwDice}. 
     *
     * @type {module:TopDieHTMLElement~TopDieHTMLElement[]}
     */
    get dice() {
        return [...this.getElementsByTagName("top-die")];
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
     * The players playing on this board.
     *
     * @type {module:TopPlayerHTMLElement~TopPlayerHTMLElement[]}
     */
    get players() {
        return this.querySelector("top-player-list").players;
    }

    /**
     * As player, throw the dice on this board.
     *
     * @param {module:TopPlayerHTMLElement~TopPlayerHTMLElement} [player = DEFAULT_SYSTEM_PLAYER] - The
     * player that is throwing the dice on this board.
     *
     * @return {module:TopDieHTMLElement~TopDieHTMLElement[]} The thrown dice on this board. This list of dice is the same as this TopDiceBoardHTMLElement's {@see dice} property
     */
    throwDice(player = DEFAULT_SYSTEM_PLAYER) {
        if (player && !player.hasTurn) {
            player.startTurn();
        }
        this.dice.forEach(die => die.throwIt());
        updateBoard(this, this.layout.layout(this.dice));
        return this.dice;
    }
};

window.customElements.define("top-dice-board", TopDiceBoardHTMLElement);

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
/**
 * @module
 */
const CIRCLE_DEGREES = 360; // degrees
const NUMBER_OF_PIPS = 6; // Default / regular six sided die has 6 pips maximum.
const DEFAULT_COLOR = "Ivory";
const DEFAULT_X = 0; // px
const DEFAULT_Y = 0; // px
const DEFAULT_ROTATION = 0; // degrees
const DEFAULT_OPACITY = 0.5;

const COLOR_ATTRIBUTE$1 = "color";
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
const _color$1 = new WeakMap();
const _heldBy = new WeakMap();
const _pips = new WeakMap();
const _rotation = new WeakMap();
const _x = new WeakMap();
const _y = new WeakMap();

/**
 * TopDieHTMLElement is the "top-die" custom [HTML
 * element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) representing a die
 * on the dice board.
 *
 * @extends HTMLElement
 * @mixes module:mixin/ReadOnlyAttributes~ReadOnlyAttributes
 */
const TopDieHTMLElement = class extends ReadOnlyAttributes(HTMLElement) {

    /**
     * Create a new TopDieHTMLElement.
     */
    constructor({pips, color, rotation, x, y, heldBy} = {}) {
        super();

        const pipsValue = ValidatorSingleton.integer(pips || this.getAttribute(PIPS_ATTRIBUTE))
            .between(1, 6)
            .defaultTo(randomPips())
            .value;

        _pips.set(this, pipsValue);
        this.setAttribute(PIPS_ATTRIBUTE, pipsValue);

        this.color = ValidatorSingleton.color(color || this.getAttribute(COLOR_ATTRIBUTE$1))
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
            COLOR_ATTRIBUTE$1,
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
        return _color$1.get(this);
    }
    set color(newColor) {
        if (null === newColor) {
            this.removeAttribute(COLOR_ATTRIBUTE$1);
            _color$1.set(this, DEFAULT_COLOR);
        } else {
            _color$1.set(this, newColor);
            this.setAttribute(COLOR_ATTRIBUTE$1, newColor);
        }
    }


    /**
     * The Player that is holding this Die, if any. Null otherwise.
     *
     * @type {Player|null} 
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
     * @param {module:Player~Player} player - The player who wants to hold this Die.
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
     * @param {module:Player~Player} player - The player who wants to release this Die.
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

window.customElements.define("top-die", TopDieHTMLElement);

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
 * TopPlayerListHTMLElement to describe the players in the game.
 *
 * @extends HTMLElement
 */
const TopPlayerListHTMLElement = class extends HTMLElement {

    /**
     * Create a new TopPlayerListHTMLElement.
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
     * @type {module:TopPlayerHTMLElement~TopPlayerHTMLElement[]}
     */
    get players() {
        return [...this.getElementsByTagName("top-player")];
    }
};

window.customElements.define("top-player-list", TopPlayerListHTMLElement);

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
 */
window.twentyonepips = window.twentyonepips || Object.freeze({
    VERSION: "0.0.1",
    LICENSE: "LGPL-3.0",
    WEBSITE: "https://twentyonepips.org",
    HTMLElements: {
        TopDiceBoardHTMLElement: TopDiceBoardHTMLElement,
        TopDieHTMLElement: TopDieHTMLElement,
        TopPlayerHTMLElement: TopPlayerHTMLElement,
        TopPlayerListHTMLElement: TopPlayerListHTMLElement
    },
    Die: TopDieHTMLElement,
    Player: TopPlayerHTMLElement,
    PlayerList: TopPlayerListHTMLElement,
    DiceBoard: TopDiceBoardHTMLElement
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcFBsYXllckhUTUxFbGVtZW50LmpzIiwiVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQuanMiLCJUb3BEaWVIVE1MRWxlbWVudC5qcyIsIlRvcFBsYXllckxpc3RIVE1MRWxlbWVudC5qcyIsInR3ZW50eS1vbmUtcGlwcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uRXJyb3JcbiAqXG4gKiBAZXh0ZW5kcyBFcnJvclxuICovXG5jb25zdCBDb25maWd1cmF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBDb25maWd1cmF0aW9uRXJyb3Igd2l0aCBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpc1xuICAgICAqIENvbmZpZ3VyYXRpb25FcnJvci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuXG5jb25zdCBGVUxMX0NJUkNMRV9JTl9ERUdSRUVTID0gMzYwO1xuXG5jb25zdCByYW5kb21pemVDZW50ZXIgPSAobikgPT4ge1xuICAgIHJldHVybiAoMC41IDw9IE1hdGgucmFuZG9tKCkgPyBNYXRoLmZsb29yIDogTWF0aC5jZWlsKS5jYWxsKDAsIG4pO1xufTtcblxuLy8gUHJpdmF0ZSBmaWVsZHNcbmNvbnN0IF93aWR0aCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGVpZ2h0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jb2xzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3dzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kaWNlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kaWVTaXplID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9kaXNwZXJzaW9uID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3RhdGUgPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyaWRMYXlvdXRDb25maWd1cmF0aW9uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLndpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGggb2YgdGhpc1xuICogR3JpZExheW91dCBpbiBwaXhlbHMuO1xuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5oZWlnaHRdIC0gVGhlIG1pbmltYWwgaGVpZ2h0IG9mXG4gKiB0aGlzIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLi5cbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuZGlzcGVyc2lvbiAtIFRoZSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlXG4gKiBsYXlvdXQgYSBkaWUgY2FuIGJlIGxheW91dC5cbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuZGllU2l6ZSAtIFRoZSBzaXplIG9mIGEgZGllLlxuICovXG5cbi8qKlxuICogR3JpZExheW91dCBoYW5kbGVzIGxheWluZyBvdXQgdGhlIGRpY2Ugb24gYSBEaWNlQm9hcmQuXG4gKi9cbmNvbnN0IEdyaWRMYXlvdXQgPSBjbGFzcyB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7R3JpZExheW91dENvbmZpZ3VyYXRpb259IGNvbmZpZyAtIFRoZSBjb25maWd1cmF0aW9uIG9mIHRoZSBHcmlkTGF5b3V0XG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICBkaXNwZXJzaW9uLFxuICAgICAgICBkaWVTaXplXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBbXSk7XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCAxKTtcbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCAwKTtcbiAgICAgICAgX2hlaWdodC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9yb3RhdGUuc2V0KHRoaXMsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgIHRoaXMuZGllU2l6ZSA9IGRpZVNpemU7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIGluIHBpeGVscyB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC5cbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIFdpZHRoID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfSBcbiAgICAgKi9cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiBfd2lkdGguZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCB3aWR0aCh3KSB7XG4gICAgICAgIGlmICgwID4gdykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgV2lkdGggc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHt3fScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBfd2lkdGguc2V0KHRoaXMsIHcpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVHcmlkKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaGVpZ2h0IGluIHBpeGVscyB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC4gXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBIZWlnaHQgPj0gMFxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gX2hlaWdodC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGhlaWdodChoKSB7XG4gICAgICAgIGlmICgwID4gaCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgSGVpZ2h0IHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7aH0nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2hlaWdodC5zZXQodGhpcywgaCk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIGxheW91dCBvbiB0aGlzIEdyaWRMYXlvdXQuIFRoaXNcbiAgICAgKiBudW1iZXIgaXMgPj0gMC4gUmVhZCBvbmx5LlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbHMgKiB0aGlzLl9yb3dzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBUaGUgZGlzcGVyc2lvbiBsZXZlbFxuICAgICAqIGluZGljYXRlcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIGRpY2UgY2FuIGJlIGxheW91dC4gVXNlIDEgZm9yIGFcbiAgICAgKiB0aWdodCBwYWNrZWQgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBEaXNwZXJzaW9uID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaXNwZXJzaW9uKCkge1xuICAgICAgICByZXR1cm4gX2Rpc3BlcnNpb24uZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaXNwZXJzaW9uKGQpIHtcbiAgICAgICAgaWYgKDAgPiBkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBEaXNwZXJzaW9uIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7ZH0nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLnNldCh0aGlzLCBkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgRGllU2l6ZSA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGllU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIF9kaWVTaXplLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGllU2l6ZShkcykge1xuICAgICAgICBpZiAoMCA+PSBkcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgZGllU2l6ZSBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMSwgZ290ICcke2RzfScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgZHMpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVHcmlkKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBnZXQgcm90YXRlKCkge1xuICAgICAgICBjb25zdCByID0gX3JvdGF0ZS5nZXQodGhpcyk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IHIgPyB0cnVlIDogcjtcbiAgICB9XG5cbiAgICBzZXQgcm90YXRlKHIpIHtcbiAgICAgICAgX3JvdGF0ZS5zZXQodGhpcywgcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiByb3dzIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiByb3dzLCAwIDwgcm93cy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfcm93cygpIHtcbiAgICAgICAgcmV0dXJuIF9yb3dzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIGNvbHVtbnMsIDAgPCBjb2x1bW5zLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jb2xzKCkge1xuICAgICAgICByZXR1cm4gX2NvbHMuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjZW50ZXIgY2VsbCBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjZW50ZXIgKHJvdywgY29sKS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfY2VudGVyKCkge1xuICAgICAgICBjb25zdCByb3cgPSByYW5kb21pemVDZW50ZXIodGhpcy5fcm93cyAvIDIpIC0gMTtcbiAgICAgICAgY29uc3QgY29sID0gcmFuZG9taXplQ2VudGVyKHRoaXMuX2NvbHMgLyAyKSAtIDE7XG5cbiAgICAgICAgcmV0dXJuIHtyb3csIGNvbH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGF5b3V0IGRpY2Ugb24gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHttb2R1bGU6RGllfkRpZVtdfSBkaWNlIC0gVGhlIGRpY2UgdG8gbGF5b3V0IG9uIHRoaXMgTGF5b3V0LlxuICAgICAqIEByZXR1cm4ge21vZHVsZTpEaWV+RGllW119IFRoZSBzYW1lIGxpc3Qgb2YgZGljZSwgYnV0IG5vdyBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIHttb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yfkNvbmZpZ3VyYXRpb25FcnJvcn0gVGhlIG51bWJlciBvZlxuICAgICAqIGRpY2Ugc2hvdWxkIG5vdCBleGNlZWQgdGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhpcyBMYXlvdXQgY2FuXG4gICAgICogbGF5b3V0LlxuICAgICAqL1xuICAgIGxheW91dChkaWNlKSB7XG4gICAgICAgIGlmIChkaWNlLmxlbmd0aCA+IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgVGhlIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIGxheW91dCBpcyAke3RoaXMubWF4aW11bU51bWJlck9mRGljZX0sIGdvdCAke2RpY2UubGVuZ2h0fSBkaWNlIGluc3RlYWQuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbHJlYWR5TGF5b3V0RGljZSA9IFtdO1xuICAgICAgICBjb25zdCBkaWNlVG9MYXlvdXQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBpZiAoZGllLmhhc0Nvb3JkaW5hdGVzKCkgJiYgZGllLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICAgICAgLy8gRGljZSB0aGF0IGFyZSBiZWluZyBoZWxkIGFuZCBoYXZlIGJlZW4gbGF5b3V0IGJlZm9yZSBzaG91bGRcbiAgICAgICAgICAgICAgICAvLyBrZWVwIHRoZWlyIGN1cnJlbnQgY29vcmRpbmF0ZXMgYW5kIHJvdGF0aW9uLiBJbiBvdGhlciB3b3JkcyxcbiAgICAgICAgICAgICAgICAvLyB0aGVzZSBkaWNlIGFyZSBza2lwcGVkLlxuICAgICAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGljZVRvTGF5b3V0LnB1c2goZGllKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWluKGRpY2UubGVuZ3RoICogdGhpcy5kaXNwZXJzaW9uLCB0aGlzLm1heGltdW1OdW1iZXJPZkRpY2UpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGVDZWxscyA9IHRoaXMuX2NvbXB1dGVBdmFpbGFibGVDZWxscyhtYXgsIGFscmVhZHlMYXlvdXREaWNlKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlVG9MYXlvdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXZhaWxhYmxlQ2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IHJhbmRvbUNlbGwgPSBhdmFpbGFibGVDZWxsc1tyYW5kb21JbmRleF07XG4gICAgICAgICAgICBhdmFpbGFibGVDZWxscy5zcGxpY2UocmFuZG9tSW5kZXgsIDEpO1xuXG4gICAgICAgICAgICBkaWUuY29vcmRpbmF0ZXMgPSB0aGlzLl9udW1iZXJUb0Nvb3JkaW5hdGVzKHJhbmRvbUNlbGwpO1xuICAgICAgICAgICAgZGllLnJvdGF0aW9uID0gdGhpcy5yb3RhdGUgPyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBGVUxMX0NJUkNMRV9JTl9ERUdSRUVTKSA6IG51bGw7XG4gICAgICAgICAgICBhbHJlYWR5TGF5b3V0RGljZS5wdXNoKGRpZSk7XG4gICAgICAgIH1cblxuICAgICAgICBfZGljZS5zZXQodGhpcywgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIHJldHVybiBhbHJlYWR5TGF5b3V0RGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIGEgbGlzdCB3aXRoIGF2YWlsYWJsZSBjZWxscyB0byBwbGFjZSBkaWNlIG9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG1heCAtIFRoZSBudW1iZXIgZW1wdHkgY2VsbHMgdG8gY29tcHV0ZS5cbiAgICAgKiBAcGFyYW0ge0RpZVtdfSBhbHJlYWR5TGF5b3V0RGljZSAtIEEgbGlzdCB3aXRoIGRpY2UgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBsYXlvdXQuXG4gICAgICogXG4gICAgICogQHJldHVybiB7TlVtYmVyW119IFRoZSBsaXN0IG9mIGF2YWlsYWJsZSBjZWxscyByZXByZXNlbnRlZCBieSB0aGVpciBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpIHtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gbmV3IFNldCgpO1xuICAgICAgICBsZXQgbGV2ZWwgPSAwO1xuICAgICAgICBjb25zdCBtYXhMZXZlbCA9IE1hdGgubWluKHRoaXMuX3Jvd3MsIHRoaXMuX2NvbHMpO1xuXG4gICAgICAgIHdoaWxlIChhdmFpbGFibGUuc2l6ZSA8IG1heCAmJiBsZXZlbCA8IG1heExldmVsKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNlbGwgb2YgdGhpcy5fY2VsbHNPbkxldmVsKGxldmVsKSkge1xuICAgICAgICAgICAgICAgIGlmICh1bmRlZmluZWQgIT09IGNlbGwgJiYgdGhpcy5fY2VsbElzRW1wdHkoY2VsbCwgYWxyZWFkeUxheW91dERpY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZS5hZGQoY2VsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXZlbCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20oYXZhaWxhYmxlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgYWxsIGNlbGxzIG9uIGxldmVsIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxldmVsIC0gVGhlIGxldmVsIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgbGF5b3V0LiAwXG4gICAgICogaW5kaWNhdGVzIHRoZSBjZW50ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTZXQ8TnVtYmVyPn0gdGhlIGNlbGxzIG9uIHRoZSBsZXZlbCBpbiB0aGlzIGxheW91dCByZXByZXNlbnRlZCBieVxuICAgICAqIHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jZWxsc09uTGV2ZWwobGV2ZWwpIHtcbiAgICAgICAgY29uc3QgY2VsbHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IGNlbnRlciA9IHRoaXMuX2NlbnRlcjtcblxuICAgICAgICBpZiAoMCA9PT0gbGV2ZWwpIHtcbiAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoY2VudGVyKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSBjZW50ZXIucm93IC0gbGV2ZWw7IHJvdyA8PSBjZW50ZXIucm93ICsgbGV2ZWw7IHJvdysrKSB7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93LCBjb2w6IGNlbnRlci5jb2wgLSBsZXZlbH0pKTtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCArIGxldmVsfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSBjZW50ZXIuY29sIC0gbGV2ZWwgKyAxOyBjb2wgPCBjZW50ZXIuY29sICsgbGV2ZWw7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93OiBjZW50ZXIucm93IC0gbGV2ZWwsIGNvbH0pKTtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgKyBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNlbGxzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgY2VsbCBjb250YWluIGEgY2VsbCBmcm9tIGFscmVhZHlMYXlvdXREaWNlP1xuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNlbGwgLSBBIGNlbGwgaW4gbGF5b3V0IHJlcHJlc2VudGVkIGJ5IGEgbnVtYmVyLlxuICAgICAqIEBwYXJhbSB7RGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IG9mIGRpY2UgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIGNlbGwgZG9lcyBub3QgY29udGFpbiBhIGRpZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkID09PSBhbHJlYWR5TGF5b3V0RGljZS5maW5kKGRpZSA9PiBjZWxsID09PSB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBudW1iZXIgdG8gYSBjZWxsIChyb3csIGNvbClcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJuIHRoZSBjZWxsICh7cm93LCBjb2x9KSBjb3JyZXNwb25kaW5nIG4uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9DZWxsKG4pIHtcbiAgICAgICAgcmV0dXJuIHtyb3c6IE1hdGgudHJ1bmMobiAvIHRoaXMuX2NvbHMpLCBjb2w6IG4gJSB0aGlzLl9jb2xzfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgY2VsbCB0byBhIG51bWJlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNlbGwgLSBUaGUgY2VsbCB0byBjb252ZXJ0IHRvIGl0cyBudW1iZXIuXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIG51bWJlciBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsLlxuICAgICAqIFJldHVybnMgdW5kZWZpbmVkIHdoZW4gdGhlIGNlbGwgaXMgbm90IG9uIHRoZSBsYXlvdXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jZWxsVG9OdW1iZXIoe3JvdywgY29sfSkge1xuICAgICAgICBpZiAoMCA8PSByb3cgJiYgcm93IDwgdGhpcy5fcm93cyAmJiAwIDw9IGNvbCAmJiBjb2wgPCB0aGlzLl9jb2xzKSB7XG4gICAgICAgICAgICByZXR1cm4gcm93ICogdGhpcy5fY29scyArIGNvbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHJlcHJlc2VudGVkIGJ5IGl0cyBudW1iZXIgdG8gdGhlaXIgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiAtIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIGEgY2VsbFxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY29vcmRpbmF0ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgY2VsbCByZXByZXNlbnRlZCBieVxuICAgICAqIHRoaXMgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX251bWJlclRvQ29vcmRpbmF0ZXMobikge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2VsbFRvQ29vcmRzKHRoaXMuX251bWJlclRvQ2VsbChuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIHBhaXIgb2YgY29vcmRpbmF0ZXMgdG8gYSBudW1iZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29vcmRzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcnx1bmRlZmluZWR9IFRoZSBjb29yZGluYXRlcyBjb252ZXJ0ZWQgdG8gYSBudW1iZXIuIElmXG4gICAgICogdGhlIGNvb3JkaW5hdGVzIGFyZSBub3Qgb24gdGhpcyBsYXlvdXQsIHRoZSBudW1iZXIgaXMgdW5kZWZpbmVkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3JkaW5hdGVzVG9OdW1iZXIoY29vcmRzKSB7XG4gICAgICAgIGNvbnN0IG4gPSB0aGlzLl9jZWxsVG9OdW1iZXIodGhpcy5fY29vcmRzVG9DZWxsKGNvb3JkcykpO1xuICAgICAgICBpZiAoMCA8PSBuICYmIG4gPCB0aGlzLm1heGltdW1OdW1iZXJPZkRpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU25hcCAoeCx5KSB0byB0aGUgY2xvc2VzdCBjZWxsIGluIHRoaXMgTGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRpZWNvb3JkaW5hdGUgLSBUaGUgY29vcmRpbmF0ZSB0byBmaW5kIHRoZSBjbG9zZXN0IGNlbGxcbiAgICAgKiBmb3IuXG4gICAgICogQHBhcmFtIHtEaWV9IFtkaWVjb29yZGluYXQuZGllID0gbnVsbF0gLSBUaGUgZGllIHRvIHNuYXAgdG8uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZWNvb3JkaW5hdGUueCAtIFRoZSB4LWNvb3JkaW5hdGUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZWNvb3JkaW5hdGUueSAtIFRoZSB5LWNvb3JkaW5hdGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R8bnVsbH0gVGhlIGNvb3JkaW5hdGUgb2YgdGhlIGNlbGwgY2xvc2VzdCB0byAoeCwgeSkuXG4gICAgICogTnVsbCB3aGVuIG5vIHN1aXRhYmxlIGNlbGwgaXMgbmVhciAoeCwgeSlcbiAgICAgKi9cbiAgICBzbmFwVG8oe2RpZSA9IG51bGwsIHgsIHl9KSB7XG4gICAgICAgIGNvbnN0IGNvcm5lckNlbGwgPSB7XG4gICAgICAgICAgICByb3c6IE1hdGgudHJ1bmMoeSAvIHRoaXMuZGllU2l6ZSksXG4gICAgICAgICAgICBjb2w6IE1hdGgudHJ1bmMoeCAvIHRoaXMuZGllU2l6ZSlcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjb3JuZXIgPSB0aGlzLl9jZWxsVG9Db29yZHMoY29ybmVyQ2VsbCk7XG4gICAgICAgIGNvbnN0IHdpZHRoSW4gPSBjb3JuZXIueCArIHRoaXMuZGllU2l6ZSAtIHg7XG4gICAgICAgIGNvbnN0IHdpZHRoT3V0ID0gdGhpcy5kaWVTaXplIC0gd2lkdGhJbjtcbiAgICAgICAgY29uc3QgaGVpZ2h0SW4gPSBjb3JuZXIueSArIHRoaXMuZGllU2l6ZSAtIHk7XG4gICAgICAgIGNvbnN0IGhlaWdodE91dCA9IHRoaXMuZGllU2l6ZSAtIGhlaWdodEluO1xuXG4gICAgICAgIGNvbnN0IHF1YWRyYW50cyA9IFt7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoY29ybmVyQ2VsbCksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyxcbiAgICAgICAgICAgICAgICBjb2w6IGNvcm5lckNlbGwuY29sICsgMVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhPdXQgKiBoZWlnaHRJblxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2xcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoSW4gKiBoZWlnaHRPdXRcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93ICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IGNvcm5lckNlbGwuY29sICsgMVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhPdXQgKiBoZWlnaHRPdXRcbiAgICAgICAgfV07XG5cbiAgICAgICAgY29uc3Qgc25hcFRvID0gcXVhZHJhbnRzXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBvbiB0aGUgbGF5b3V0XG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gdW5kZWZpbmVkICE9PSBxdWFkcmFudC5xKVxuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgbm90IGFscmVhZHkgdGFrZW4gZXhjZXB0IGJ5IGl0c2VsZlxuICAgICAgICAgICAgLmZpbHRlcigocXVhZHJhbnQpID0+IChcbiAgICAgICAgICAgICAgICBudWxsICE9PSBkaWUgJiYgdGhpcy5fY29vcmRpbmF0ZXNUb051bWJlcihkaWUuY29vcmRpbmF0ZXMpID09PSBxdWFkcmFudC5xKVxuICAgICAgICAgICAgICAgIHx8IHRoaXMuX2NlbGxJc0VtcHR5KHF1YWRyYW50LnEsIF9kaWNlLmdldCh0aGlzKSkpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBjb3ZlcmVkIGJ5IHRoZSBkaWUgdGhlIG1vc3RcbiAgICAgICAgICAgIC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgKG1heFEsIHF1YWRyYW50KSA9PiBxdWFkcmFudC5jb3ZlcmFnZSA+IG1heFEuY292ZXJhZ2UgPyBxdWFkcmFudCA6IG1heFEsXG4gICAgICAgICAgICAgICAge3E6IHVuZGVmaW5lZCwgY292ZXJhZ2U6IC0xfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkICE9PSBzbmFwVG8ucSA/IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMoc25hcFRvLnEpIDogbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGRpZSBhdCBwb2ludCAoeCwgeSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1BvaW50fSBwb2ludCAtIFRoZSBwb2ludCBpbiAoeCwgeSkgY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtEaWV8bnVsbH0gVGhlIGRpZSB1bmRlciBjb29yZGluYXRlcyAoeCwgeSkgb3IgbnVsbCBpZiBubyBkaWVcbiAgICAgKiBpcyBhdCB0aGUgcG9pbnQuXG4gICAgICovXG4gICAgZ2V0QXQocG9pbnQgPSB7eDogMCwgeTogMH0pIHtcbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgX2RpY2UuZ2V0KHRoaXMpKSB7XG4gICAgICAgICAgICBjb25zdCB7eCwgeX0gPSBkaWUuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHhGaXQgPSB4IDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB4ICsgdGhpcy5kaWVTaXplO1xuICAgICAgICAgICAgY29uc3QgeUZpdCA9IHkgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHkgKyB0aGlzLmRpZVNpemU7XG5cbiAgICAgICAgICAgIGlmICh4Rml0ICYmIHlGaXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGllO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIHRoZSBncmlkIHNpemUgZ2l2ZW4gd2lkdGggYW5kIGhlaWdodC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCAtIFRoZSBtaW5pbWFsIGhlaWdodFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2FsY3VsYXRlR3JpZCh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIF9jb2xzLnNldCh0aGlzLCBNYXRoLmZsb29yKHdpZHRoIC8gdGhpcy5kaWVTaXplKSk7XG4gICAgICAgIF9yb3dzLnNldCh0aGlzLCBNYXRoLmZsb29yKGhlaWdodCAvIHRoaXMuZGllU2l6ZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSAocm93LCBjb2wpIGNlbGwgdG8gKHgsIHkpIGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNlbGwgLSBUaGUgY2VsbCB0byBjb252ZXJ0IHRvIGNvb3JkaW5hdGVzXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY29ycmVzcG9uZGluZyBjb29yZGluYXRlcy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jZWxsVG9Db29yZHMoe3JvdywgY29sfSkge1xuICAgICAgICByZXR1cm4ge3g6IGNvbCAqIHRoaXMuZGllU2l6ZSwgeTogcm93ICogdGhpcy5kaWVTaXplfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0ICh4LCB5KSBjb29yZGluYXRlcyB0byBhIChyb3csIGNvbCkgY2VsbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZGluYXRlcyAtIFRoZSBjb29yZGluYXRlcyB0byBjb252ZXJ0IHRvIGEgY2VsbC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNlbGxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb29yZHNUb0NlbGwoe3gsIHl9KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb3c6IE1hdGgudHJ1bmMoeSAvIHRoaXMuZGllU2l6ZSksXG4gICAgICAgICAgICBjb2w6IE1hdGgudHJ1bmMoeCAvIHRoaXMuZGllU2l6ZSlcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5leHBvcnQge0dyaWRMYXlvdXR9O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuLyoqXG4gKiBAbW9kdWxlIG1peGluL1JlYWRPbmx5QXR0cmlidXRlc1xuICovXG5cbi8qXG4gKiBDb252ZXJ0IGFuIEhUTUwgYXR0cmlidXRlIHRvIGFuIGluc3RhbmNlJ3MgcHJvcGVydHkuIFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWVcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkncyBuYW1lLiBGb3IgZXhhbXBsZSwgXCJteS1hdHRyXCJcbiAqIHdpbGwgYmUgY29udmVydGVkIHRvIFwibXlBdHRyXCIsIGFuZCBcImRpc2FibGVkXCIgdG8gXCJkaXNhYmxlZFwiLlxuICovXG5jb25zdCBhdHRyaWJ1dGUycHJvcGVydHkgPSAobmFtZSkgPT4ge1xuICAgIGNvbnN0IFtmaXJzdCwgLi4ucmVzdF0gPSBuYW1lLnNwbGl0KFwiLVwiKTtcbiAgICByZXR1cm4gZmlyc3QgKyByZXN0Lm1hcCh3b3JkID0+IHdvcmQuc2xpY2UoMCwgMSkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkpLmpvaW4oKTtcbn07XG5cbi8qKlxuICogTWl4aW4ge0BsaW5rIG1vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzfSB0byBhIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7Kn0gU3VwIC0gVGhlIGNsYXNzIHRvIG1peCBpbnRvLlxuICogQHJldHVybiB7bW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXN9IFRoZSBtaXhlZC1pbiBjbGFzc1xuICovXG5jb25zdCBSZWFkT25seUF0dHJpYnV0ZXMgPSAoU3VwKSA9PlxuICAgIC8qKlxuICAgICAqIE1peGluIHRvIG1ha2UgYWxsIGF0dHJpYnV0ZXMgb24gYSBjdXN0b20gSFRNTEVsZW1lbnQgcmVhZC1vbmx5IGluIHRoZSBzZW5zZVxuICAgICAqIHRoYXQgd2hlbiB0aGUgYXR0cmlidXRlIGdldHMgYSBuZXcgdmFsdWUgdGhhdCBkaWZmZXJzIGZyb20gdGhlIHZhbHVlIG9mIHRoZVxuICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHksIGl0IGlzIHJlc2V0IHRvIHRoYXQgcHJvcGVydHkncyB2YWx1ZS4gVGhlXG4gICAgICogYXNzdW1wdGlvbiBpcyB0aGF0IGF0dHJpYnV0ZSBcIm15LWF0dHJpYnV0ZVwiIGNvcnJlc3BvbmRzIHdpdGggcHJvcGVydHkgXCJ0aGlzLm15QXR0cmlidXRlXCIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0NsYXNzfSBTdXAgLSBUaGUgY2xhc3MgdG8gbWl4aW4gdGhpcyBSZWFkT25seUF0dHJpYnV0ZXMuXG4gICAgICogQHJldHVybiB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQgaW4gY2xhc3MuXG4gICAgICpcbiAgICAgKiBAbWl4aW5cbiAgICAgKiBAYWxpYXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAgICAgKi9cbiAgICBjbGFzcyBleHRlbmRzIFN1cCB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHRoYXQgaXMgZXhlY3V0ZWQgd2hlbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUncyB2YWx1ZSBpc1xuICAgICAgICAgKiBjaGFuZ2VkLiBJZiB0aGUgSFRNTEVsZW1lbnQgaXMgY29ubmVjdGVkIHRvIHRoZSBET00sIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICogdmFsdWUgY2FuIG9ubHkgYmUgc2V0IHRvIHRoZSBjb3JyZXNwb25kaW5nIEhUTUxFbGVtZW50J3MgcHJvcGVydHkuXG4gICAgICAgICAqIEluIGVmZmVjdCwgdGhpcyBtYWtlcyB0aGlzIEhUTUxFbGVtZW50J3MgYXR0cmlidXRlcyByZWFkLW9ubHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlLCBpZiBhbiBIVE1MRWxlbWVudCBoYXMgYW4gYXR0cmlidXRlIFwieFwiIGFuZFxuICAgICAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5IFwieFwiLCB0aGVuIGNoYW5naW5nIHRoZSB2YWx1ZSBcInhcIiB0byBcIjVcIlxuICAgICAgICAgKiB3aWxsIG9ubHkgd29yayB3aGVuIGB0aGlzLnggPT09IDVgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkVmFsdWUgLSBUaGUgYXR0cmlidXRlJ3Mgb2xkIHZhbHVlLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3VmFsdWUgLSBUaGUgYXR0cmlidXRlJ3MgbmV3IHZhbHVlLlxuICAgICAgICAgKi9cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgLy8gQWxsIGF0dHJpYnV0ZXMgYXJlIG1hZGUgcmVhZC1vbmx5IHRvIHByZXZlbnQgY2hlYXRpbmcgYnkgY2hhbmdpbmdcbiAgICAgICAgICAgIC8vIHRoZSBhdHRyaWJ1dGUgdmFsdWVzLiBPZiBjb3Vyc2UsIHRoaXMgaXMgYnkgbm9cbiAgICAgICAgICAgIC8vIGd1YXJhbnRlZSB0aGF0IHVzZXJzIHdpbGwgbm90IGNoZWF0IGluIGEgZGlmZmVyZW50IHdheS5cbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gYXR0cmlidXRlMnByb3BlcnR5KG5hbWUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkICYmIG5ld1ZhbHVlICE9PSBgJHt0aGlzW3Byb3BlcnR5XX1gKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgdGhpc1twcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuZXhwb3J0IHtcbiAgICBSZWFkT25seUF0dHJpYnV0ZXNcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IFZhbGlkYXRpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZykge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgVmFsaWRhdGlvbkVycm9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1ZhbGlkYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzXCI7XG5cbmNvbnN0IF92YWx1ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGVmYXVsdFZhbHVlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9lcnJvcnMgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBUeXBlVmFsaWRhdG9yID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnMgPSBbXX0pIHtcbiAgICAgICAgX3ZhbHVlLnNldCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIF9kZWZhdWx0VmFsdWUuc2V0KHRoaXMsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIF9lcnJvcnMuc2V0KHRoaXMsIGVycm9ycyk7XG4gICAgfVxuXG4gICAgZ2V0IG9yaWdpbigpIHtcbiAgICAgICAgcmV0dXJuIF92YWx1ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy5vcmlnaW4gOiBfZGVmYXVsdFZhbHVlLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgZXJyb3JzKCkge1xuICAgICAgICByZXR1cm4gX2Vycm9ycy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgICAgIHJldHVybiAwID49IHRoaXMuZXJyb3JzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBkZWZhdWx0VG8obmV3RGVmYXVsdCkge1xuICAgICAgICBfZGVmYXVsdFZhbHVlLnNldCh0aGlzLCBuZXdEZWZhdWx0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgX2NoZWNrKHtwcmVkaWNhdGUsIGJpbmRWYXJpYWJsZXMgPSBbXSwgRXJyb3JUeXBlID0gVmFsaWRhdGlvbkVycm9yfSkge1xuICAgICAgICBjb25zdCBwcm9wb3NpdGlvbiA9IHByZWRpY2F0ZS5hcHBseSh0aGlzLCBiaW5kVmFyaWFibGVzKTtcbiAgICAgICAgaWYgKCFwcm9wb3NpdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3JUeXBlKHRoaXMudmFsdWUsIGJpbmRWYXJpYWJsZXMpO1xuICAgICAgICAgICAgLy9jb25zb2xlLndhcm4oZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtWYWxpZGF0aW9uRXJyb3J9IGZyb20gXCIuL1ZhbGlkYXRpb25FcnJvci5qc1wiO1xuXG5jb25zdCBQYXJzZUVycm9yID0gY2xhc3MgZXh0ZW5kcyBWYWxpZGF0aW9uRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZykge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgUGFyc2VFcnJvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtWYWxpZGF0aW9uRXJyb3J9IGZyb20gXCIuL1ZhbGlkYXRpb25FcnJvci5qc1wiO1xuXG5jb25zdCBJbnZhbGlkVHlwZUVycm9yID0gY2xhc3MgZXh0ZW5kcyBWYWxpZGF0aW9uRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZykge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgSW52YWxpZFR5cGVFcnJvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBJTlRFR0VSX0RFRkFVTFRfVkFMVUUgPSAwO1xuY29uc3QgSW50ZWdlclR5cGVWYWxpZGF0b3IgPSBjbGFzcyBleHRlbmRzIFR5cGVWYWxpZGF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IElOVEVHRVJfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gSU5URUdFUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRWYWx1ZSA9IHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihwYXJzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlZFZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgUGFyc2VFcnJvcihpbnB1dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG5cbiAgICBsYXJnZXJUaGFuKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4pID0+IHRoaXMub3JpZ2luID49IG4sXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbl1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc21hbGxlclRoYW4obikge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAobikgPT4gdGhpcy5vcmlnaW4gPD0gbixcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBiZXR3ZWVuKG4sIG0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4sIG0pID0+IHRoaXMubGFyZ2VyVGhhbihuKSAmJiB0aGlzLnNtYWxsZXJUaGFuKG0pLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW24sIG1dXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgSW50ZWdlclR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IFNUUklOR19ERUZBVUxUX1ZBTFVFID0gXCJcIjtcbmNvbnN0IFN0cmluZ1R5cGVWYWxpZGF0b3IgPSBjbGFzcyBleHRlbmRzIFR5cGVWYWxpZGF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IFNUUklOR19ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBTVFJJTkdfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgbm90RW1wdHkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6ICgpID0+IFwiXCIgIT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgU3RyaW5nVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG4vL2ltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSBcIi4vZXJyb3IvUGFyc2VFcnJvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IENPTE9SX0RFRkFVTFRfVkFMVUUgPSBcImJsYWNrXCI7XG5jb25zdCBDb2xvclR5cGVWYWxpZGF0b3IgPSBjbGFzcyBleHRlbmRzIFR5cGVWYWxpZGF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IENPTE9SX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IENPTE9SX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgQ29sb3JUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7UGFyc2VFcnJvcn0gZnJvbSBcIi4vZXJyb3IvUGFyc2VFcnJvci5qc1wiO1xuaW1wb3J0IHtJbnZhbGlkVHlwZUVycm9yfSBmcm9tIFwiLi9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzXCI7XG5cbmNvbnN0IEJPT0xFQU5fREVGQVVMVF9WQUxVRSA9IGZhbHNlO1xuY29uc3QgQm9vbGVhblR5cGVWYWxpZGF0b3IgPSBjbGFzcyBleHRlbmRzIFR5cGVWYWxpZGF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IEJPT0xFQU5fREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gQk9PTEVBTl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKC90cnVlL2kudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9mYWxzZS9pLnRlc3QoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgaXNUcnVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiB0cnVlID09PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpc0ZhbHNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiBmYWxzZSA9PT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtcbiAgICBCb29sZWFuVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtJbnRlZ2VyVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vSW50ZWdlclR5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7U3RyaW5nVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vU3RyaW5nVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtDb2xvclR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0NvbG9yVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtCb29sZWFuVHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vQm9vbGVhblR5cGVWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgVmFsaWRhdG9yID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cblxuICAgIGJvb2xlYW4oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCb29sZWFuVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG4gICAgY29sb3IoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvclR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIGludGVnZXIoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG4gICAgc3RyaW5nKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyaW5nVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxuXG59O1xuXG5jb25zdCBWYWxpZGF0b3JTaW5nbGV0b24gPSBuZXcgVmFsaWRhdG9yKCk7XG5cbmV4cG9ydCB7XG4gICAgVmFsaWRhdG9yU2luZ2xldG9uIGFzIHZhbGlkYXRlXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8qKlxuICogQG1vZHVsZVxuICovXG5pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG4vLyBUaGUgbmFtZXMgb2YgdGhlIChvYnNlcnZlZCkgYXR0cmlidXRlcyBvZiB0aGUgVG9wUGxheWVySFRNTEVsZW1lbnQuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBOQU1FX0FUVFJJQlVURSA9IFwibmFtZVwiO1xuY29uc3QgU0NPUkVfQVRUUklCVVRFID0gXCJzY29yZVwiO1xuY29uc3QgSEFTX1RVUk5fQVRUUklCVVRFID0gXCJoYXMtdHVyblwiO1xuXG4vLyBUaGUgcHJpdmF0ZSBwcm9wZXJ0aWVzIG9mIHRoZSBUb3BQbGF5ZXJIVE1MRWxlbWVudCBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXJIVE1MRWxlbWVudCBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG5hbWUgYXR0cmlidXRlIGFyZSB0cmVhdGVkIGFzXG4gKiB0aGUgc2FtZSBwbGF5ZXIuXG4gKlxuICogSW4gZ2VuZXJhbCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IG5vIHR3byBwbGF5ZXJzIGRvIGhhdmUgdGhlIHNhbWUgY29sb3IsXG4gKiBhbHRob3VnaCBpdCBpcyBub3QgdW5jb25jZWl2YWJsZSB0aGF0IGNlcnRhaW4gZGljZSBnYW1lcyBoYXZlIHBsYXllcnMgd29ya1xuICogaW4gdGVhbXMgd2hlcmUgaXQgd291bGQgbWFrZSBzZW5zZSBmb3IgdHdvIG9yIG1vcmUgZGlmZmVyZW50IHBsYXllcnMgdG9cbiAqIGhhdmUgdGhlIHNhbWUgY29sb3IuXG4gKlxuICogVGhlIG5hbWUgYW5kIGNvbG9yIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkLiBUaGUgc2NvcmUgYW5kIGhhcy10dXJuXG4gKiBhdHRyaWJ1dGVzIGFyZSBub3QuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc1xuICovXG5jb25zdCBUb3BQbGF5ZXJIVE1MRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgUmVhZE9ubHlBdHRyaWJ1dGVzKEhUTUxFbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVySFRNTEVsZW1lbnQsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJIVE1MRWxlbWVudH0gVGhlIHBsYXllciB3aXRoIGEgdHVyblxuICAgICAqL1xuICAgIHN0YXJ0VHVybigpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpzdGFydC10dXJuXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW5kIGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICovXG4gICAgZW5kVHVybigpIHtcbiAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIG51bGwpO1xuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBwbGF5ZXIgaGF2ZSBhIHR1cm4/XG4gICAgICpcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgaGFzVHVybigpIHtcbiAgICAgICAgcmV0dXJuIHRydWUgPT09IF9oYXNUdXJuLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHBsYXllciwgaGlzIG9yIGhlcnMgbmFtZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHBsYXllcidzIG5hbWUgcmVwcmVzZW50cyB0aGUgcGxheWVyIGFzIGEgc3RyaW5nLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5uYW1lfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBwbGF5ZXIgZXF1YWwgYW5vdGhlciBwbGF5ZXI/XG4gICAgICogXG4gICAgICogQHBhcmFtIHttb2R1bGU6VG9wUGxheWVySFRNTEVsZW1lbnR+VG9wUGxheWVySFRNTEVsZW1lbnR9IG90aGVyIC0gVGhlIG90aGVyIHBsYXllciB0byBjb21wYXJlIHRoaXMgcGxheWVyIHdpdGguXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIGVpdGhlciB0aGUgb2JqZWN0IHJlZmVyZW5jZXMgYXJlIHRoZSBzYW1lXG4gICAgICogb3Igd2hlbiBib3RoIG5hbWUgYW5kIGNvbG9yIGFyZSB0aGUgc2FtZS5cbiAgICAgKi9cbiAgICBlcXVhbHMob3RoZXIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IFwic3RyaW5nXCIgPT09IHR5cGVvZiBvdGhlciA/IG90aGVyIDogb3RoZXIubmFtZTtcbiAgICAgICAgcmV0dXJuIG90aGVyID09PSB0aGlzIHx8IG5hbWUgPT09IHRoaXMubmFtZTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLXBsYXllclwiLCBUb3BQbGF5ZXJIVE1MRWxlbWVudCk7XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgc3lzdGVtIHBsYXllci4gRGljZSBhcmUgdGhyb3duIGJ5IGEgcGxheWVyLiBGb3Igc2l0dWF0aW9uc1xuICogd2hlcmUgeW91IHdhbnQgdG8gcmVuZGVyIGEgYnVuY2ggb2YgZGljZSB3aXRob3V0IG5lZWRpbmcgdGhlIGNvbmNlcHQgb2YgUGxheWVyc1xuICogdGhpcyBERUZBVUxUX1NZU1RFTV9QTEFZRVIgY2FuIGJlIGEgc3Vic3RpdHV0ZS4gT2YgY291cnNlLCBpZiB5b3UnZCBsaWtlIHRvXG4gKiBjaGFuZ2UgdGhlIG5hbWUgYW5kL29yIHRoZSBjb2xvciwgY3JlYXRlIGFuZCB1c2UgeW91ciBvd24gXCJzeXN0ZW0gcGxheWVyXCIuXG4gKiBAY29uc3RcbiAqL1xuY29uc3QgREVGQVVMVF9TWVNURU1fUExBWUVSID0gbmV3IFRvcFBsYXllckhUTUxFbGVtZW50KHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXJIVE1MRWxlbWVudCxcbiAgICBERUZBVUxUX1NZU1RFTV9QTEFZRVJcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuLy9pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge0dyaWRMYXlvdXR9IGZyb20gXCIuL0dyaWRMYXlvdXQuanNcIjtcbmltcG9ydCB7REVGQVVMVF9TWVNURU1fUExBWUVSfSBmcm9tIFwiLi9Ub3BQbGF5ZXJIVE1MRWxlbWVudC5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuXG5jb25zdCBwYXJzZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHROdW1iZXIgPSAwKSA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW1iZXIpID8gZGVmYXVsdE51bWJlciA6IG51bWJlcjtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyID0gKG51bWJlclN0cmluZywgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgcmV0dXJuIHZhbGlkYXRlLmludGVnZXIobnVtYmVyU3RyaW5nKVxuICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAuZGVmYXVsdFRvKGRlZmF1bHRWYWx1ZSlcbiAgICAgICAgLnZhbHVlO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlcih2YWx1ZVN0cmluZywgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbmNvbnN0IGdldEJvb2xlYW4gPSAoYm9vbGVhblN0cmluZywgdHJ1ZVZhbHVlLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAodHJ1ZVZhbHVlID09PSBib29sZWFuU3RyaW5nIHx8IFwidHJ1ZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoXCJmYWxzZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IGdldEJvb2xlYW5BdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKHZhbHVlU3RyaW5nLCBbdmFsdWVTdHJpbmcsIFwidHJ1ZVwiXSwgW1wiZmFsc2VcIl0sIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2NhbnZhcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbGF5b3V0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jdXJyZW50UGxheWVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9udW1iZXJPZlJlYWR5RGljZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IGNvbnRleHQgPSAoYm9hcmQpID0+IF9jYW52YXMuZ2V0KGJvYXJkKS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbmNvbnN0IGdldFJlYWR5RGljZSA9IChib2FyZCkgPT4ge1xuICAgIGlmICh1bmRlZmluZWQgPT09IF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpKSB7XG4gICAgICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJlYWR5RGljZSA9IChib2FyZCwgdXBkYXRlKSA9PiB7XG4gICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgZ2V0UmVhZHlEaWNlKGJvYXJkKSArIHVwZGF0ZSk7XG59O1xuXG5jb25zdCBpc1JlYWR5ID0gKGJvYXJkKSA9PiBnZXRSZWFkeURpY2UoYm9hcmQpID09PSBib2FyZC5kaWNlLmxlbmd0aDtcblxuY29uc3QgdXBkYXRlQm9hcmQgPSAoYm9hcmQsIGRpY2UgPSBib2FyZC5kaWNlKSA9PiB7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIGNvbnRleHQoYm9hcmQpLmNsZWFyUmVjdCgwLCAwLCBib2FyZC53aWR0aCwgYm9hcmQuaGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBkaWUucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLy8gSW50ZXJhY3Rpb24gc3RhdGVzXG5jb25zdCBOT05FID0gU3ltYm9sKFwibm9faW50ZXJhY3Rpb25cIik7XG5jb25zdCBIT0xEID0gU3ltYm9sKFwiaG9sZFwiKTtcbmNvbnN0IE1PVkUgPSBTeW1ib2woXCJtb3ZlXCIpO1xuY29uc3QgSU5ERVRFUk1JTkVEID0gU3ltYm9sKFwiaW5kZXRlcm1pbmVkXCIpO1xuY29uc3QgRFJBR0dJTkcgPSBTeW1ib2woXCJkcmFnZ2luZ1wiKTtcblxuLy8gTWV0aG9kcyB0byBoYW5kbGUgaW50ZXJhY3Rpb25cbmNvbnN0IGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzID0gKGNhbnZhcywgeFdpbmRvdywgeVdpbmRvdykgPT4ge1xuICAgIGNvbnN0IGNhbnZhc0JveCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHggPSB4V2luZG93IC0gY2FudmFzQm94LmxlZnQgKiAoY2FudmFzLndpZHRoIC8gY2FudmFzQm94LndpZHRoKTtcbiAgICBjb25zdCB5ID0geVdpbmRvdyAtIGNhbnZhc0JveC50b3AgKiAoY2FudmFzLmhlaWdodCAvIGNhbnZhc0JveC5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIHt4LCB5fTtcbn07XG5cbmNvbnN0IHNldHVwSW50ZXJhY3Rpb24gPSAoYm9hcmQpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldChib2FyZCk7XG5cbiAgICAvLyBTZXR1cCBpbnRlcmFjdGlvblxuICAgIGxldCBvcmlnaW4gPSB7fTtcbiAgICBsZXQgc3RhdGUgPSBOT05FO1xuICAgIGxldCBzdGF0aWNCb2FyZCA9IG51bGw7XG4gICAgbGV0IGRpZVVuZGVyQ3Vyc29yID0gbnVsbDtcbiAgICBsZXQgaG9sZFRpbWVvdXQgPSBudWxsO1xuXG4gICAgY29uc3QgaG9sZERpZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKEhPTEQgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIHRvZ2dsZSBob2xkIC8gcmVsZWFzZVxuICAgICAgICAgICAgY29uc3QgcGxheWVyV2l0aEFUdXJuID0gYm9hcmQucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdCB0b3AtcGxheWVyW2hhcy10dXJuXVwiKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50IGlzIGEgY3VzdG9tIEhUTUwgZWxlbWVudCB0byByZW5kZXIgYW5kIGNvbnRyb2wgYVxuICogZGljZSBib2FyZC4gXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSB2YWxpZGF0ZS5ib29sZWFuKG5ld1ZhbHVlLCBnZXRCb29sZWFuKG9sZFZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKSkudmFsdWU7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5yb3RhdGUgPSAhZGlzYWJsZWRSb3RhdGlvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSBpcyBkZXRlcm1pbmVkIHdoZW4gdXNpbmcgdGhlIGdldHRlclxuICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTphZGRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgMSk7XG4gICAgICAgICAgICBpZiAoaXNSZWFkeSh0aGlzKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTpyZW1vdmVkXCIsICgpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIHVwZGF0ZVJlYWR5RGljZSh0aGlzLCAtMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFsbCBkaWNlIGJvYXJkcyBkbyBoYXZlIGEgcGxheWVyIGxpc3QuIElmIHRoZXJlIGlzbid0IG9uZSB5ZXQsXG4gICAgICAgIC8vIGNyZWF0ZSBvbmUuXG4gICAgICAgIGlmIChudWxsID09PSB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCJ0b3AtcGxheWVyLWxpc3RcIikpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRvcC1wbGF5ZXItbGlzdFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICBhZG9wdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIEdyaWRMYXlvdXQgdXNlZCBieSB0aGlzIERpY2VCb2FyZCB0byBsYXlvdXQgdGhlIGRpY2UuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bW9kdWxlOkdyaWRMYXlvdXR+R3JpZExheW91dH1cbiAgICAgKi9cbiAgICBnZXQgbGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gX2xheW91dC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpY2Ugb24gdGhpcyBib2FyZC4gTm90ZSwgdG8gYWN0dWFsbHkgdGhyb3cgdGhlIGRpY2UgdXNlXG4gICAgICoge0BsaW5rIHRocm93RGljZX0uIFxuICAgICAqXG4gICAgICogQHR5cGUge21vZHVsZTpUb3BEaWVIVE1MRWxlbWVudH5Ub3BEaWVIVE1MRWxlbWVudFtdfVxuICAgICAqL1xuICAgIGdldCBkaWNlKCkge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0b3AtZGllXCIpXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBwdXQgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UsIDAgPCBtYXhpbXVtLlxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQubWF4aW11bU51bWJlck9mRGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgV0lEVEhfQVRUUklCVVRFLCBERUZBVUxUX1dJRFRIKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgSEVJR0hUX0FUVFJJQlVURSwgREVGQVVMVF9IRUlHSFQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIERJU1BFUlNJT05fQVRUUklCVVRFLCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzaXplIG9mIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESUVfU0laRV9BVFRSSUJVVEUsIERFRkFVTFRfRElFX1NJWkUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgZHJhZ2dlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWREcmFnZ2luZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX0RSQUdHSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgaGVsZCBieSBhIFBsYXllcj9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRIb2xkaW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHJvdGF0aW5nIGRpY2Ugb24gdGhpcyBib2FyZCBkaXNhYmxlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRSb3RhdGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkdXJhdGlvbiBpbiBtcyB0byBwcmVzcyB0aGUgbW91c2UgLyB0b3VjaCBhIGRpZSBiZWZvcmUgaXQgYmVrb21lc1xuICAgICAqIGhlbGQgYnkgdGhlIFBsYXllci4gSXQgaGFzIG9ubHkgYW4gZWZmZWN0IHdoZW4gdGhpcy5ob2xkYWJsZURpY2UgPT09XG4gICAgICogdHJ1ZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhvbGREdXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhPTERfRFVSQVRJT05fQVRUUklCVVRFLCBERUZBVUxUX0hPTERfRFVSQVRJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIHBsYXlpbmcgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHttb2R1bGU6VG9wUGxheWVySFRNTEVsZW1lbnR+VG9wUGxheWVySFRNTEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdFwiKS5wbGF5ZXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzIHBsYXllciwgdGhyb3cgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50fSBbcGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSXSAtIFRoZVxuICAgICAqIHBsYXllciB0aGF0IGlzIHRocm93aW5nIHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6VG9wRGllSFRNTEVsZW1lbnR+VG9wRGllSFRNTEVsZW1lbnRbXX0gVGhlIHRocm93biBkaWNlIG9uIHRoaXMgYm9hcmQuIFRoaXMgbGlzdCBvZiBkaWNlIGlzIHRoZSBzYW1lIGFzIHRoaXMgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQncyB7QHNlZSBkaWNlfSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHRocm93RGljZShwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVIpIHtcbiAgICAgICAgaWYgKHBsYXllciAmJiAhcGxheWVyLmhhc1R1cm4pIHtcbiAgICAgICAgICAgIHBsYXllci5zdGFydFR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpY2UuZm9yRWFjaChkaWUgPT4gZGllLnRocm93SXQoKSk7XG4gICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGljZTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLWRpY2UtYm9hcmRcIiwgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQpO1xuXG5leHBvcnQge1xuICAgIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50LFxuICAgIERFRkFVTFRfRElFX1NJWkUsXG4gICAgREVGQVVMVF9IT0xEX0RVUkFUSU9OLFxuICAgIERFRkFVTFRfV0lEVEgsXG4gICAgREVGQVVMVF9IRUlHSFQsXG4gICAgREVGQVVMVF9ESVNQRVJTSU9OLFxuICAgIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRFxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cbmNvbnN0IENJUkNMRV9ERUdSRUVTID0gMzYwOyAvLyBkZWdyZWVzXG5jb25zdCBOVU1CRVJfT0ZfUElQUyA9IDY7IC8vIERlZmF1bHQgLyByZWd1bGFyIHNpeCBzaWRlZCBkaWUgaGFzIDYgcGlwcyBtYXhpbXVtLlxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFwiSXZvcnlcIjtcbmNvbnN0IERFRkFVTFRfWCA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1kgPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ST1RBVElPTiA9IDA7IC8vIGRlZ3JlZXNcbmNvbnN0IERFRkFVTFRfT1BBQ0lUWSA9IDAuNTtcblxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgSEVMRF9CWV9BVFRSSUJVVEUgPSBcImhlbGQtYnlcIjtcbmNvbnN0IFBJUFNfQVRUUklCVVRFID0gXCJwaXBzXCI7XG5jb25zdCBST1RBVElPTl9BVFRSSUJVVEUgPSBcInJvdGF0aW9uXCI7XG5jb25zdCBYX0FUVFJJQlVURSA9IFwieFwiO1xuY29uc3QgWV9BVFRSSUJVVEUgPSBcInlcIjtcblxuY29uc3QgQkFTRV9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTID0gMTU7IC8vIHB4XG5jb25zdCBCQVNFX1NUUk9LRV9XSURUSCA9IDIuNTsgLy8gcHhcbmNvbnN0IE1JTl9TVFJPS0VfV0lEVEggPSAxOyAvLyBweFxuY29uc3QgSEFMRiA9IEJBU0VfRElFX1NJWkUgLyAyOyAvLyBweFxuY29uc3QgVEhJUkQgPSBCQVNFX0RJRV9TSVpFIC8gMzsgLy8gcHhcbmNvbnN0IFBJUF9TSVpFID0gQkFTRV9ESUVfU0laRSAvIDE1OyAvL3B4XG5jb25zdCBQSVBfQ09MT1IgPSBcImJsYWNrXCI7XG5cbmNvbnN0IGRlZzJyYWQgPSAoZGVnKSA9PiB7XG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcbn07XG5cbmNvbnN0IGlzUGlwTnVtYmVyID0gbiA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobiwgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcikgJiYgMSA8PSBudW1iZXIgJiYgbnVtYmVyIDw9IE5VTUJFUl9PRl9QSVBTO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgb2YgcGlwcyBiZXR3ZWVuIDEgYW5kIHRoZSBOVU1CRVJfT0ZfUElQUy5cbiAqXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBBIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgTlVNQkVSX09GX1BJUFMuXG4gKi9cbmNvbnN0IHJhbmRvbVBpcHMgPSAoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOVU1CRVJfT0ZfUElQUykgKyAxO1xuXG5jb25zdCBESUVfVU5JQ09ERV9DSEFSQUNURVJTID0gW1wi4pqAXCIsXCLimoFcIixcIuKaglwiLFwi4pqDXCIsXCLimoRcIixcIuKahVwiXTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllIGZhY2UgdG8gdGhlIG51bWJlciBvZiBwaXBzIG9mXG4gKiB0aGF0IHNhbWUgZGllLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlIG9mIHBpcHNUb1VuaWNvZGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHUgLSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgdG8gY29udmVydCB0byBwaXBzLlxuICogQHJldHVybnMge051bWJlcnx1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2LCBvclxuICogdW5kZWZpbmVkIGlmIHUgd2FzIG5vdCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZS5cbiAqL1xuY29uc3QgdW5pY29kZVRvUGlwcyA9ICh1KSA9PiB7XG4gICAgY29uc3QgZGllQ2hhckluZGV4ID0gRElFX1VOSUNPREVfQ0hBUkFDVEVSUy5pbmRleE9mKHUpO1xuICAgIHJldHVybiAwIDw9IGRpZUNoYXJJbmRleCA/IGRpZUNoYXJJbmRleCArIDEgOiB1bmRlZmluZWQ7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiB0byBhIHVuaWNvZGUgY2hhcmFjdGVyXG4gKiByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29ycmVzcG9uZGluZyBkaWUgZmFjZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZVxuICogb2YgdW5pY29kZVRvUGlwcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcCAtIFRoZSBudW1iZXIgb2YgcGlwcyB0byBjb252ZXJ0IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgdW5pY29kZSBjaGFyYWN0ZXJzIG9yXG4gKiB1bmRlZmluZWQgaWYgcCB3YXMgbm90IGJldHdlZW4gMSBhbmQgNiBpbmNsdXNpdmUuXG4gKi9cbmNvbnN0IHBpcHNUb1VuaWNvZGUgPSBwID0+IGlzUGlwTnVtYmVyKHApID8gRElFX1VOSUNPREVfQ0hBUkFDVEVSU1twIC0gMV0gOiB1bmRlZmluZWQ7XG5cbmNvbnN0IHJlbmRlckhvbGQgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0VQRVJBVE9SID0gd2lkdGggLyAzMDtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gREVGQVVMVF9PUEFDSVRZO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LmFyYyh4ICsgd2lkdGgsIHkgKyB3aWR0aCwgd2lkdGggLSBTRVBFUkFUT1IsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJEaWUgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0NBTEUgPSAod2lkdGggLyBIQUxGKTtcbiAgICBjb25zdCBIQUxGX0lOTkVSX1NJWkUgPSBNYXRoLnNxcnQod2lkdGggKiogMiAvIDIpO1xuICAgIGNvbnN0IElOTkVSX1NJWkUgPSAyICogSEFMRl9JTk5FUl9TSVpFO1xuICAgIGNvbnN0IFJPVU5ERURfQ09STkVSX1JBRElVUyA9IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTICogU0NBTEU7XG4gICAgY29uc3QgSU5ORVJfU0laRV9ST1VOREVEID0gSU5ORVJfU0laRSAtIDIgKiBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3QgU1RST0tFX1dJRFRIID0gTWF0aC5tYXgoTUlOX1NUUk9LRV9XSURUSCwgQkFTRV9TVFJPS0VfV0lEVEggKiBTQ0FMRSk7XG5cbiAgICBjb25zdCBzdGFydFggPSB4ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkUgKyBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3Qgc3RhcnRZID0geSArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFO1xuXG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgY29udGV4dC5saW5lV2lkdGggPSBTVFJPS0VfV0lEVEg7XG4gICAgY29udGV4dC5tb3ZlVG8oc3RhcnRYLCBzdGFydFkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDI3MCksIGRlZzJyYWQoMCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDApLCBkZWcycmFkKDkwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDkwKSwgZGVnMnJhZCgxODApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggLSBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgxODApLCBkZWcycmFkKDI3MCkpO1xuXG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlclBpcCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCkgPT4ge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBQSVBfQ09MT1I7XG4gICAgY29udGV4dC5tb3ZlVG8oeCwgeSk7XG4gICAgY29udGV4dC5hcmMoeCwgeSwgd2lkdGgsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2JvYXJkID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGVsZEJ5ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9waXBzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3RhdGlvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogVG9wRGllSFRNTEVsZW1lbnQgaXMgdGhlIFwidG9wLWRpZVwiIGN1c3RvbSBbSFRNTFxuICogZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50KSByZXByZXNlbnRpbmcgYSBkaWVcbiAqIG9uIHRoZSBkaWNlIGJvYXJkLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllSFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIFJlYWRPbmx5QXR0cmlidXRlcyhIVE1MRWxlbWVudCkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpZUhUTUxFbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtwaXBzLCBjb2xvciwgcm90YXRpb24sIHgsIHksIGhlbGRCeX0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IHBpcHNWYWx1ZSA9IHZhbGlkYXRlLmludGVnZXIocGlwcyB8fCB0aGlzLmdldEF0dHJpYnV0ZShQSVBTX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuYmV0d2VlbigxLCA2KVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhyYW5kb21QaXBzKCkpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgX3BpcHMuc2V0KHRoaXMsIHBpcHNWYWx1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCBwaXBzVmFsdWUpO1xuXG4gICAgICAgIHRoaXMuY29sb3IgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX0NPTE9SKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMucm90YXRpb24gPSB2YWxpZGF0ZS5pbnRlZ2VyKHJvdGF0aW9uIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFJPVEFUSU9OX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuYmV0d2VlbigwLCAzNjApXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfUk9UQVRJT04pXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy54ID0gdmFsaWRhdGUuaW50ZWdlcih4IHx8IHRoaXMuZ2V0QXR0cmlidXRlKFhfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5sYXJnZXJUaGFuKDApXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfWClcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnkgPSB2YWxpZGF0ZS5pbnRlZ2VyKHkgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWV9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ZKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuaGVsZEJ5ID0gdmFsaWRhdGUuc3RyaW5nKGhlbGRCeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShIRUxEX0JZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubm90RW1wdHkoKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhudWxsKVxuICAgICAgICAgICAgLnZhbHVlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgQ09MT1JfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEVMRF9CWV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBQSVBTX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU9OX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFhfQVRUUklCVVRFLFxuICAgICAgICAgICAgWV9BVFRSSUJVVEVcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLnNldCh0aGlzLCB0aGlzLnBhcmVudE5vZGUpO1xuICAgICAgICBfYm9hcmQuZ2V0KHRoaXMpLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwidG9wLWRpZTphZGRlZFwiKSk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOnJlbW92ZWRcIikpO1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIG51bGwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdGhpcyBEaWUgdG8gdGhlIGNvcnJlc3BvbmRpbmcgdW5pY29kZSBjaGFyYWN0ZXIgb2YgYSBkaWUgZmFjZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHVuaWNvZGUgY2hhcmFjdGVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIG51bWJlciBvZlxuICAgICAqIHBpcHMgb2YgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdG9Vbmljb2RlKCkge1xuICAgICAgICByZXR1cm4gcGlwc1RvVW5pY29kZSh0aGlzLnBpcHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHN0cmluZyByZXByZXNlbmF0aW9uIGZvciB0aGlzIGRpZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHVuaWNvZGUgc3ltYm9sIGNvcnJlc3BvbmRpbmcgdG8gdGhlIG51bWJlciBvZiBwaXBzXG4gICAgICogb2YgdGhpcyBkaWUuXG4gICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvVW5pY29kZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgRGllJ3MgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBwaXBzKCkge1xuICAgICAgICByZXR1cm4gX3BpcHMuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgRGllJ3MgY29sb3IuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuIF9jb2xvci5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCBjb2xvcihuZXdDb2xvcikge1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3Q29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSk7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIERFRkFVTFRfQ09MT1IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBuZXdDb2xvcik7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUsIG5ld0NvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogVGhlIFBsYXllciB0aGF0IGlzIGhvbGRpbmcgdGhpcyBEaWUsIGlmIGFueS4gTnVsbCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7UGxheWVyfG51bGx9IFxuICAgICAqL1xuICAgIGdldCBoZWxkQnkoKSB7XG4gICAgICAgIHJldHVybiBfaGVsZEJ5LmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGhlbGRCeShwbGF5ZXIpIHtcbiAgICAgICAgX2hlbGRCeS5zZXQodGhpcywgcGxheWVyKTtcbiAgICAgICAgaWYgKG51bGwgPT09IHBsYXllcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJoZWxkLWJ5XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJoZWxkLWJ5XCIsIHBsYXllci50b1N0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjb29yZGluYXRlcyBvZiB0aGlzIERpZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtDb29yZGluYXRlc3xudWxsfVxuICAgICAqL1xuICAgIGdldCBjb29yZGluYXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IHRoaXMueCB8fCBudWxsID09PSB0aGlzLnkgPyBudWxsIDoge3g6IHRoaXMueCwgeTogdGhpcy55fTtcbiAgICB9XG4gICAgc2V0IGNvb3JkaW5hdGVzKGMpIHtcbiAgICAgICAgaWYgKG51bGwgPT09IGMpIHtcbiAgICAgICAgICAgIHRoaXMueCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnkgPSBudWxsO1xuICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICBjb25zdCB7eCwgeX0gPSBjO1xuICAgICAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgRGllIGhhdmUgY29vcmRpbmF0ZXM/XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIHdoZW4gdGhlIERpZSBkb2VzIGhhdmUgY29vcmRpbmF0ZXNcbiAgICAgKi9cbiAgICBoYXNDb29yZGluYXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuY29vcmRpbmF0ZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHggY29vcmRpbmF0ZVxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgeCgpIHtcbiAgICAgICAgcmV0dXJuIF94LmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHgobmV3WCkge1xuICAgICAgICBfeC5zZXQodGhpcywgbmV3WCk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwieFwiLCBuZXdYKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeSBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB5KCkge1xuICAgICAgICByZXR1cm4gX3kuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeShuZXdZKSB7XG4gICAgICAgIF95LnNldCh0aGlzLCBuZXdZKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5XCIsIG5ld1kpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSByb3RhdGlvbiBvZiB0aGlzIERpZS4gMCDiiaQgcm90YXRpb24g4omkIDM2MC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ8bnVsbH1cbiAgICAgKi9cbiAgICBnZXQgcm90YXRpb24oKSB7XG4gICAgICAgIHJldHVybiBfcm90YXRpb24uZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgcm90YXRpb24obmV3Uikge1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3Uikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJyb3RhdGlvblwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRSb3RhdGlvbiA9IG5ld1IgJSBDSVJDTEVfREVHUkVFUztcbiAgICAgICAgICAgIF9yb3RhdGlvbi5zZXQodGhpcywgbm9ybWFsaXplZFJvdGF0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwicm90YXRpb25cIiwgbm9ybWFsaXplZFJvdGF0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRocm93IHRoaXMgRGllLiBUaGUgbnVtYmVyIG9mIHBpcHMgdG8gYSByYW5kb20gbnVtYmVyIG4sIDEg4omkIG4g4omkIDYuXG4gICAgICogT25seSBkaWNlIHRoYXQgYXJlIG5vdCBiZWluZyBoZWxkIGNhbiBiZSB0aHJvd24uXG4gICAgICpcbiAgICAgKiBAZmlyZXMgXCJ0b3A6dGhyb3ctZGllXCIgd2l0aCBwYXJhbWV0ZXJzIHRoaXMgRGllLlxuICAgICAqL1xuICAgIHRocm93SXQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0hlbGQoKSkge1xuICAgICAgICAgICAgX3BpcHMuc2V0KHRoaXMsIHJhbmRvbVBpcHMoKSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShQSVBTX0FUVFJJQlVURSwgdGhpcy5waXBzKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3A6dGhyb3ctZGllXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgZGllOiB0aGlzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllciBob2xkcyB0aGlzIERpZS4gQSBwbGF5ZXIgY2FuIG9ubHkgaG9sZCBhIGRpZSB0aGF0IGlzIG5vdFxuICAgICAqIGJlaW5nIGhlbGQgYnkgYW5vdGhlciBwbGF5ZXIgeWV0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHttb2R1bGU6UGxheWVyflBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpQbGF5ZXJ+UGxheWVyfSBwbGF5ZXIgLSBUaGUgcGxheWVyIHdobyB3YW50cyB0byByZWxlYXNlIHRoaXMgRGllLlxuICAgICAqIEBmaXJlcyBcInRvcDpyZWxhc2UtZGllXCIgd2l0aCBwYXJhbWV0ZXJzIHRoaXMgRGllIGFuZCB0aGUgcGxheWVyIHJlbGVhc2luZyBpdC5cbiAgICAgKi9cbiAgICByZWxlYXNlSXQocGxheWVyKSB7XG4gICAgICAgIGlmICh0aGlzLmlzSGVsZCgpICYmIHRoaXMuaGVsZEJ5LmVxdWFscyhwbGF5ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmhlbGRCeSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShIRUxEX0JZX0FUVFJJQlVURSk7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnJlbGVhc2UtZGllXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgZGllOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGhpcyBEaWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dCAtIFRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3XG4gICAgICogb25cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllU2l6ZSAtIFRoZSBzaXplIG9mIGEgZGllLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbY29vcmRpbmF0ZXMgPSB0aGlzLmNvb3JkaW5hdGVzXSAtIFRoZSBjb29yZGluYXRlcyB0b1xuICAgICAqIGRyYXcgdGhpcyBkaWUuIEJ5IGRlZmF1bHQsIHRoaXMgZGllIGlzIGRyYXduIGF0IGl0cyBvd24gY29vcmRpbmF0ZXMsXG4gICAgICogYnV0IHlvdSBjYW4gYWxzbyBkcmF3IGl0IGVsc2V3aGVyZSBpZiBzbyBuZWVkZWQuXG4gICAgICovXG4gICAgcmVuZGVyKGNvbnRleHQsIGRpZVNpemUsIGNvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBzY2FsZSA9IGRpZVNpemUgLyBCQVNFX0RJRV9TSVpFO1xuICAgICAgICBjb25zdCBTSEFMRiA9IEhBTEYgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgU1RISVJEID0gVEhJUkQgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgU1BJUF9TSVpFID0gUElQX1NJWkUgKiBzY2FsZTtcblxuICAgICAgICBjb25zdCB7eCwgeX0gPSBjb29yZGluYXRlcztcblxuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSkge1xuICAgICAgICAgICAgcmVuZGVySG9sZChjb250ZXh0LCB4LCB5LCBTSEFMRiwgdGhpcy5oZWxkQnkuY29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKDAgIT09IHRoaXMucm90YXRpb24pIHtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKHggKyBTSEFMRiwgeSArIFNIQUxGKTtcbiAgICAgICAgICAgIGNvbnRleHQucm90YXRlKGRlZzJyYWQodGhpcy5yb3RhdGlvbikpO1xuICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoLTEgKiAoeCArIFNIQUxGKSwgLTEgKiAoeSArIFNIQUxGKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJEaWUoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuY29sb3IpO1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5waXBzKSB7XG4gICAgICAgIGNhc2UgMToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTSEFMRiwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAyOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDM6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTSEFMRiwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNDoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA1OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDY6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IC8vIE5vIG90aGVyIHZhbHVlcyBhbGxvd2VkIC8gcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWFyIGNvbnRleHRcbiAgICAgICAgY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1kaWVcIiwgVG9wRGllSFRNTEVsZW1lbnQpO1xuXG5leHBvcnQge1xuICAgIFRvcERpZUhUTUxFbGVtZW50LFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVySFRNTEVsZW1lbnQuanNcIjtcblxuLyoqXG4gKiBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQgdG8gZGVzY3JpYmUgdGhlIHBsYXllcnMgaW4gdGhlIGdhbWUuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBpZiAoMCA+PSB0aGlzLnBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3A6c3RhcnQtdHVyblwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgb25lIHBsYXllciBjYW4gaGF2ZSBhIHR1cm4gYXQgYW55IGdpdmVuIHRpbWUuXG4gICAgICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4gIXAuZXF1YWxzKGV2ZW50LmRldGFpbC5wbGF5ZXIpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHAgPT4gcC5lbmRUdXJuKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBpbiB0aGlzIGxpc3QuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50W119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRvcC1wbGF5ZXJcIildO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b3AtcGxheWVyLWxpc3RcIiwgVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnRcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuaW1wb3J0IHtUb3BEaWNlQm9hcmRIVE1MRWxlbWVudH0gZnJvbSBcIi4vVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VG9wRGllSFRNTEVsZW1lbnR9IGZyb20gXCIuL1RvcERpZUhUTUxFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RvcFBsYXllckhUTUxFbGVtZW50fSBmcm9tIFwiLi9Ub3BQbGF5ZXJIVE1MRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnR9IGZyb20gXCIuL1RvcFBsYXllckxpc3RIVE1MRWxlbWVudC5qc1wiO1xuXG53aW5kb3cudHdlbnR5b25lcGlwcyA9IHdpbmRvdy50d2VudHlvbmVwaXBzIHx8IE9iamVjdC5mcmVlemUoe1xuICAgIFZFUlNJT046IFwiMC4wLjFcIixcbiAgICBMSUNFTlNFOiBcIkxHUEwtMy4wXCIsXG4gICAgV0VCU0lURTogXCJodHRwczovL3R3ZW50eW9uZXBpcHMub3JnXCIsXG4gICAgSFRNTEVsZW1lbnRzOiB7XG4gICAgICAgIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50OiBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudCxcbiAgICAgICAgVG9wRGllSFRNTEVsZW1lbnQ6IFRvcERpZUhUTUxFbGVtZW50LFxuICAgICAgICBUb3BQbGF5ZXJIVE1MRWxlbWVudDogVG9wUGxheWVySFRNTEVsZW1lbnQsXG4gICAgICAgIFRvcFBsYXllckxpc3RIVE1MRWxlbWVudDogVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50XG4gICAgfSxcbiAgICBEaWU6IFRvcERpZUhUTUxFbGVtZW50LFxuICAgIFBsYXllcjogVG9wUGxheWVySFRNTEVsZW1lbnQsXG4gICAgUGxheWVyTGlzdDogVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50LFxuICAgIERpY2VCb2FyZDogVG9wRGljZUJvYXJkSFRNTEVsZW1lbnRcbn0pO1xuIl0sIm5hbWVzIjpbInZhbGlkYXRlIiwiQ09MT1JfQVRUUklCVVRFIiwiX2NvbG9yIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkEsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLEtBQUssQ0FBQzs7Ozs7Ozs7SUFRM0MsV0FBVyxDQUFDLE9BQU8sRUFBRTtRQUNqQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEI7Q0FDSjs7QUN4Q0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFFQTs7OztBQUlBLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDOztBQUVuQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsS0FBSztJQUMzQixPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztD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QUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELE1BQU07U0FDVDtRQUNELFFBQVE7U0FDUDs7O1FBR0QsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzFDO0NBQ0osQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7QUMxZjNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUE7Ozs7O0FBS0EsTUFBTSx3QkFBd0IsR0FBRyxjQUFjLFdBQVcsQ0FBQzs7Ozs7SUFLdkQsV0FBVyxHQUFHO1FBQ1YsS0FBSyxFQUFFLENBQUM7S0FDWDs7SUFFRCxpQkFBaUIsR0FBRztRQUNoQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDM0M7O1FBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLENBQUMsS0FBSyxLQUFLOztZQUUvQyxJQUFJLENBQUMsT0FBTztpQkFDUCxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUMzQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDLENBQUMsQ0FBQztLQUNOOztJQUVELG9CQUFvQixHQUFHO0tBQ3RCOzs7Ozs7O0lBT0QsSUFBSSxPQUFPLEdBQUc7UUFDVixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUN2RDtDQUNKLENBQUM7O0FBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQzs7QUM3RDFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFLQSxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6RCxPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsVUFBVTtJQUNuQixPQUFPLEVBQUUsMkJBQTJCO0lBQ3BDLFlBQVksRUFBRTtRQUNWLHVCQUF1QixFQUFFLHVCQUF1QjtRQUNoRCxpQkFBaUIsRUFBRSxpQkFBaUI7UUFDcEMsb0JBQW9CLEVBQUUsb0JBQW9CO1FBQzFDLHdCQUF3QixFQUFFLHdCQUF3QjtLQUNyRDtJQUNELEdBQUcsRUFBRSxpQkFBaUI7SUFDdEIsTUFBTSxFQUFFLG9CQUFvQjtJQUM1QixVQUFVLEVBQUUsd0JBQXdCO0lBQ3BDLFNBQVMsRUFBRSx1QkFBdUI7Q0FDckMsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MExtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwxUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNFUnBaVWhVVFV4RmJHVnRaVzUwTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNGQnNZWGxsY2t4cGMzUklWRTFNUld4bGJXVnVkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTkwZDJWdWRIa3RiMjVsTFhCcGNITXVhbk1pWFN3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaVnh1SUNvdlhHNWNiaThxS2x4dUlDb2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlYRzRnS2x4dUlDb2dRR1Y0ZEdWdVpITWdSWEp5YjNKY2JpQXFMMXh1WTI5dWMzUWdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QkZjbkp2Y2lCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUhkcGRHZ2diV1Z6YzJGblpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdFpYTnpZV2RsSUMwZ1ZHaGxJRzFsYzNOaFoyVWdZWE56YjJOcFlYUmxaQ0IzYVhSb0lIUm9hWE5jYmlBZ0lDQWdLaUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1WEc0Z0lDQWdJQ292WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYldWemMyRm5aU2tnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWh0WlhOellXZGxLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMDdYRzRpTENJdktpb2dYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNibWx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JseHVMeW9xWEc0Z0tpQkFiVzlrZFd4bFhHNGdLaTljYmx4dVkyOXVjM1FnUmxWTVRGOURTVkpEVEVWZlNVNWZSRVZIVWtWRlV5QTlJRE0yTUR0Y2JseHVZMjl1YzNRZ2NtRnVaRzl0YVhwbFEyVnVkR1Z5SUQwZ0tHNHBJRDArSUh0Y2JpQWdJQ0J5WlhSMWNtNGdLREF1TlNBOFBTQk5ZWFJvTG5KaGJtUnZiU2dwSUQ4Z1RXRjBhQzVtYkc5dmNpQTZJRTFoZEdndVkyVnBiQ2t1WTJGc2JDZ3dMQ0J1S1R0Y2JuMDdYRzVjYmk4dklGQnlhWFpoZEdVZ1ptbGxiR1J6WEc1amIyNXpkQ0JmZDJsa2RHZ2dQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyaGxhV2RvZENBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWTI5c2N5QTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmNtOTNjeUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZaR2xqWlNBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWkdsbFUybDZaU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZaR2x6Y0dWeWMybHZiaUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjbTkwWVhSbElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVMeW9xWEc0Z0tpQkFkSGx3WldSbFppQjdUMkpxWldOMGZTQkhjbWxrVEdGNWIzVjBRMjl1Wm1sbmRYSmhkR2x2Ymx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NTNhV1IwYUNBdElGUm9aU0J0YVc1cGJXRnNJSGRwWkhSb0lHOW1JSFJvYVhOY2JpQXFJRWR5YVdSTVlYbHZkWFFnYVc0Z2NHbDRaV3h6TGp0Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VhR1ZwWjJoMFhTQXRJRlJvWlNCdGFXNXBiV0ZzSUdobGFXZG9kQ0J2Wmx4dUlDb2dkR2hwY3lCSGNtbGtUR0Y1YjNWMElHbHVJSEJwZUdWc2N5NHVYRzRnS2lCQWNISnZjR1Z5ZEhrZ2UwNTFiV0psY24wZ1kyOXVabWxuTG1ScGMzQmxjbk5wYjI0Z0xTQlVhR1VnWkdsemRHRnVZMlVnWm5KdmJTQjBhR1VnWTJWdWRHVnlJRzltSUhSb1pWeHVJQ29nYkdGNWIzVjBJR0VnWkdsbElHTmhiaUJpWlNCc1lYbHZkWFF1WEc0Z0tpQkFjSEp2Y0dWeWRIa2dlMDUxYldKbGNuMGdZMjl1Wm1sbkxtUnBaVk5wZW1VZ0xTQlVhR1VnYzJsNlpTQnZaaUJoSUdScFpTNWNiaUFxTDF4dVhHNHZLaXBjYmlBcUlFZHlhV1JNWVhsdmRYUWdhR0Z1Wkd4bGN5QnNZWGxwYm1jZ2IzVjBJSFJvWlNCa2FXTmxJRzl1SUdFZ1JHbGpaVUp2WVhKa0xseHVJQ292WEc1amIyNXpkQ0JIY21sa1RHRjViM1YwSUQwZ1kyeGhjM01nZTF4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EzSmxZWFJsSUdFZ2JtVjNJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMGR5YVdSTVlYbHZkWFJEYjI1bWFXZDFjbUYwYVc5dWZTQmpiMjVtYVdjZ0xTQlVhR1VnWTI5dVptbG5kWEpoZEdsdmJpQnZaaUIwYUdVZ1IzSnBaRXhoZVc5MWRGeHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdGNiaUFnSUNBZ0lDQWdkMmxrZEdnc1hHNGdJQ0FnSUNBZ0lHaGxhV2RvZEN4Y2JpQWdJQ0FnSUNBZ1pHbHpjR1Z5YzJsdmJpeGNiaUFnSUNBZ0lDQWdaR2xsVTJsNlpWeHVJQ0FnSUgwZ1BTQjdmU2tnZTF4dUlDQWdJQ0FnSUNCZlpHbGpaUzV6WlhRb2RHaHBjeXdnVzEwcE8xeHVJQ0FnSUNBZ0lDQmZaR2xsVTJsNlpTNXpaWFFvZEdocGN5d2dNU2s3WEc0Z0lDQWdJQ0FnSUY5M2FXUjBhQzV6WlhRb2RHaHBjeXdnTUNrN1hHNGdJQ0FnSUNBZ0lGOW9aV2xuYUhRdWMyVjBLSFJvYVhNc0lEQXBPMXh1SUNBZ0lDQWdJQ0JmY205MFlYUmxMbk5sZENoMGFHbHpMQ0IwY25WbEtUdGNibHh1SUNBZ0lDQWdJQ0IwYUdsekxtUnBjM0JsY25OcGIyNGdQU0JrYVhOd1pYSnphVzl1TzF4dUlDQWdJQ0FnSUNCMGFHbHpMbVJwWlZOcGVtVWdQU0JrYVdWVGFYcGxPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHBaSFJvSUQwZ2QybGtkR2c3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhR1ZwWjJoMElEMGdhR1ZwWjJoME8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0IzYVdSMGFDQnBiaUJ3YVhobGJITWdkWE5sWkNCaWVTQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCdGIyUjFiR1U2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMa052Ym1acFozVnlZWFJwYjI1RmNuSnZjaUJYYVdSMGFDQStQU0F3WEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMGdYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSGRwWkhSb0tDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM2RwWkhSb0xtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCelpYUWdkMmxrZEdnb2R5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStJSGNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUZkcFpIUm9JSE5vYjNWc1pDQmlaU0JoSUc1MWJXSmxjaUJzWVhKblpYSWdkR2hoYmlBd0xDQm5iM1FnSnlSN2QzMG5JR2x1YzNSbFlXUXVZQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gzZHBaSFJvTG5ObGRDaDBhR2x6TENCM0tUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1ZlkyRnNZM1ZzWVhSbFIzSnBaQ2gwYUdsekxuZHBaSFJvTENCMGFHbHpMbWhsYVdkb2RDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdobGFXZG9kQ0JwYmlCd2FYaGxiSE1nZFhObFpDQmllU0IwYUdseklFZHlhV1JNWVhsdmRYUXVJRnh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdiVzlrZFd4bE9tVnljbTl5TDBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2k1RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1NHVnBaMmgwSUQ0OUlEQmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdobGFXZG9kQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5b1pXbG5hSFF1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCb1pXbG5hSFFvYUNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK0lHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUc1bGR5QkRiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSW9ZRWhsYVdkb2RDQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTUN3Z1oyOTBJQ2NrZTJoOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUY5b1pXbG5hSFF1YzJWMEtIUm9hWE1zSUdncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TGw5allXeGpkV3hoZEdWSGNtbGtLSFJvYVhNdWQybGtkR2dzSUhSb2FYTXVhR1ZwWjJoMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR0YwSUdOaGJpQmlaU0JzWVhsdmRYUWdiMjRnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJVYUdselhHNGdJQ0FnSUNvZ2JuVnRZbVZ5SUdseklENDlJREF1SUZKbFlXUWdiMjVzZVM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRzFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYjJ4eklDb2dkR2hwY3k1ZmNtOTNjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1pHbHpjR1Z5YzJsdmJpQnNaWFpsYkNCMWMyVmtJR0o1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnVkdobElHUnBjM0JsY25OcGIyNGdiR1YyWld4Y2JpQWdJQ0FnS2lCcGJtUnBZMkYwWlhNZ2RHaGxJR1JwYzNSaGJtTmxJR1p5YjIwZ2RHaGxJR05sYm5SbGNpQmthV05sSUdOaGJpQmlaU0JzWVhsdmRYUXVJRlZ6WlNBeElHWnZjaUJoWEc0Z0lDQWdJQ29nZEdsbmFIUWdjR0ZqYTJWa0lHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGFISnZkM01nYlc5a2RXeGxPbVZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpNURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSWdSR2x6Y0dWeWMybHZiaUErUFNBd1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsemNHVnljMmx2YmlncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOWthWE53WlhKemFXOXVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpaWFFnWkdsemNHVnljMmx2Ymloa0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lENGdaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhnUkdsemNHVnljMmx2YmlCemFHOTFiR1FnWW1VZ1lTQnVkVzFpWlhJZ2JHRnlaMlZ5SUhSb1lXNGdNQ3dnWjI5MElDY2tlMlI5SnlCcGJuTjBaV0ZrTG1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZaR2x6Y0dWeWMybHZiaTV6WlhRb2RHaHBjeXdnWkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJSE5wZW1VZ2IyWWdZU0JrYVdVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRHaHliM2R6SUcxdlpIVnNaVHBsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlJRVJwWlZOcGVtVWdQajBnTUZ4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR1JwWlZOcGVtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsbFUybDZaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUdScFpWTnBlbVVvWkhNcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BqMGdaSE1wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUdScFpWTnBlbVVnYzJodmRXeGtJR0psSUdFZ2JuVnRZbVZ5SUd4aGNtZGxjaUIwYUdGdUlERXNJR2R2ZENBbkpIdGtjMzBuSUdsdWMzUmxZV1F1WUNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdYMlJwWlZOcGVtVXVjMlYwS0hSb2FYTXNJR1J6S1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVmWTJGc1kzVnNZWFJsUjNKcFpDaDBhR2x6TG5kcFpIUm9MQ0IwYUdsekxtaGxhV2RvZENrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWjJWMElISnZkR0YwWlNncElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2NpQTlJRjl5YjNSaGRHVXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJRDA5UFNCeUlEOGdkSEoxWlNBNklISTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyVjBJSEp2ZEdGMFpTaHlLU0I3WEc0Z0lDQWdJQ0FnSUY5eWIzUmhkR1V1YzJWMEtIUm9hWE1zSUhJcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J1ZFcxaVpYSWdiMllnY205M2N5QnBiaUIwYUdseklFZHlhV1JNWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOUlGUm9aU0J1ZFcxaVpYSWdiMllnY205M2N5d2dNQ0E4SUhKdmQzTXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdYM0p2ZDNNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZjbTkzY3k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRzUxYldKbGNpQnZaaUJqYjJ4MWJXNXpJR2x1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDUxYldKbGNuMGdWR2hsSUc1MWJXSmxjaUJ2WmlCamIyeDFiVzV6TENBd0lEd2dZMjlzZFcxdWN5NWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmZZMjlzY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOWpiMnh6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdZMlZ1ZEdWeUlHTmxiR3dnYVc0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyVnVkR1Z5SUNoeWIzY3NJR052YkNrdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1gyTmxiblJsY2lncElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2NtOTNJRDBnY21GdVpHOXRhWHBsUTJWdWRHVnlLSFJvYVhNdVgzSnZkM01nTHlBeUtTQXRJREU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR052YkNBOUlISmhibVJ2YldsNlpVTmxiblJsY2loMGFHbHpMbDlqYjJ4eklDOGdNaWtnTFNBeE8xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjdjbTkzTENCamIyeDlPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRXhoZVc5MWRDQmthV05sSUc5dUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Ylc5a2RXeGxPa1JwWlg1RWFXVmJYWDBnWkdsalpTQXRJRlJvWlNCa2FXTmxJSFJ2SUd4aGVXOTFkQ0J2YmlCMGFHbHpJRXhoZVc5MWRDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdHRiMlIxYkdVNlJHbGxma1JwWlZ0ZGZTQlVhR1VnYzJGdFpTQnNhWE4wSUc5bUlHUnBZMlVzSUdKMWRDQnViM2NnYkdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFJvY205M2N5QjdiVzlrZFd4bE9tVnljbTl5TDBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y241RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNKOUlGUm9aU0J1ZFcxaVpYSWdiMlpjYmlBZ0lDQWdLaUJrYVdObElITm9iM1ZzWkNCdWIzUWdaWGhqWldWa0lIUm9aU0J0WVhocGJYVnRJRzUxYldKbGNpQnZaaUJrYVdObElIUm9hWE1nVEdGNWIzVjBJR05oYmx4dUlDQWdJQ0FxSUd4aGVXOTFkQzVjYmlBZ0lDQWdLaTljYmlBZ0lDQnNZWGx2ZFhRb1pHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9aR2xqWlM1c1pXNW5kR2dnUGlCMGFHbHpMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUZSb1pTQnVkVzFpWlhJZ2IyWWdaR2xqWlNCMGFHRjBJR05oYmlCaVpTQnNZWGx2ZFhRZ2FYTWdKSHQwYUdsekxtMWhlR2x0ZFcxT2RXMWlaWEpQWmtScFkyVjlMQ0JuYjNRZ0pIdGthV05sTG14bGJtZG9kSDBnWkdsalpTQnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVnUFNCYlhUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pHbGpaVlJ2VEdGNWIzVjBJRDBnVzEwN1hHNWNiaUFnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JrYVdVZ2IyWWdaR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUnBaUzVvWVhORGIyOXlaR2x1WVhSbGN5Z3BJQ1ltSUdScFpTNXBjMGhsYkdRb0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUVScFkyVWdkR2hoZENCaGNtVWdZbVZwYm1jZ2FHVnNaQ0JoYm1RZ2FHRjJaU0JpWldWdUlHeGhlVzkxZENCaVpXWnZjbVVnYzJodmRXeGtYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnYTJWbGNDQjBhR1ZwY2lCamRYSnlaVzUwSUdOdmIzSmthVzVoZEdWeklHRnVaQ0J5YjNSaGRHbHZiaTRnU1c0Z2IzUm9aWElnZDI5eVpITXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnZEdobGMyVWdaR2xqWlNCaGNtVWdjMnRwY0hCbFpDNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTNXdkWE5vS0dScFpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdScFkyVlViMHhoZVc5MWRDNXdkWE5vS0dScFpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnRZWGdnUFNCTllYUm9MbTFwYmloa2FXTmxMbXhsYm1kMGFDQXFJSFJvYVhNdVpHbHpjR1Z5YzJsdmJpd2dkR2hwY3k1dFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObEtUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1lYWmhhV3hoWW14bFEyVnNiSE1nUFNCMGFHbHpMbDlqYjIxd2RYUmxRWFpoYVd4aFlteGxRMlZzYkhNb2JXRjRMQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU2s3WEc1Y2JpQWdJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQmthV1VnYjJZZ1pHbGpaVlJ2VEdGNWIzVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVlXNWtiMjFKYm1SbGVDQTlJRTFoZEdndVpteHZiM0lvVFdGMGFDNXlZVzVrYjIwb0tTQXFJR0YyWVdsc1lXSnNaVU5sYkd4ekxteGxibWQwYUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlZVzVrYjIxRFpXeHNJRDBnWVhaaGFXeGhZbXhsUTJWc2JITmJjbUZ1Wkc5dFNXNWtaWGhkTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZWFpoYVd4aFlteGxRMlZzYkhNdWMzQnNhV05sS0hKaGJtUnZiVWx1WkdWNExDQXhLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsTG1OdmIzSmthVzVoZEdWeklEMGdkR2hwY3k1ZmJuVnRZbVZ5Vkc5RGIyOXlaR2x1WVhSbGN5aHlZVzVrYjIxRFpXeHNLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUnBaUzV5YjNSaGRHbHZiaUE5SUhSb2FYTXVjbTkwWVhSbElEOGdUV0YwYUM1eWIzVnVaQ2hOWVhSb0xuSmhibVJ2YlNncElDb2dSbFZNVEY5RFNWSkRURVZmU1U1ZlJFVkhVa1ZGVXlrZ09pQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZV3h5WldGa2VVeGhlVzkxZEVScFkyVXVjSFZ6YUNoa2FXVXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ1gyUnBZMlV1YzJWMEtIUm9hWE1zSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sS1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXRjSFYwWlNCaElHeHBjM1FnZDJsMGFDQmhkbUZwYkdGaWJHVWdZMlZzYkhNZ2RHOGdjR3hoWTJVZ1pHbGpaU0J2Ymk1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0J0WVhnZ0xTQlVhR1VnYm5WdFltVnlJR1Z0Y0hSNUlHTmxiR3h6SUhSdklHTnZiWEIxZEdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0RWFXVmJYWDBnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVnTFNCQklHeHBjM1FnZDJsMGFDQmthV05sSUhSb1lYUWdhR0YyWlNCaGJISmxZV1I1SUdKbFpXNGdiR0Y1YjNWMExseHVJQ0FnSUNBcUlGeHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNVZiV0psY2x0ZGZTQlVhR1VnYkdsemRDQnZaaUJoZG1GcGJHRmliR1VnWTJWc2JITWdjbVZ3Y21WelpXNTBaV1FnWW5rZ2RHaGxhWElnYm5WdFltVnlMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTnZiWEIxZEdWQmRtRnBiR0ZpYkdWRFpXeHNjeWh0WVhnc0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHRjJZV2xzWVdKc1pTQTlJRzVsZHlCVFpYUW9LVHRjYmlBZ0lDQWdJQ0FnYkdWMElHeGxkbVZzSUQwZ01EdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2JXRjRUR1YyWld3Z1BTQk5ZWFJvTG0xcGJpaDBhR2x6TGw5eWIzZHpMQ0IwYUdsekxsOWpiMnh6S1R0Y2JseHVJQ0FnSUNBZ0lDQjNhR2xzWlNBb1lYWmhhV3hoWW14bExuTnBlbVVnUENCdFlYZ2dKaVlnYkdWMlpXd2dQQ0J0WVhoTVpYWmxiQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JqWld4c0lHOW1JSFJvYVhNdVgyTmxiR3h6VDI1TVpYWmxiQ2hzWlhabGJDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RXNWtaV1pwYm1Wa0lDRTlQU0JqWld4c0lDWW1JSFJvYVhNdVgyTmxiR3hKYzBWdGNIUjVLR05sYkd3c0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGRtRnBiR0ZpYkdVdVlXUmtLR05sYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYkdWMlpXd3JLenRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCQmNuSmhlUzVtY205dEtHRjJZV2xzWVdKc1pTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMkZzWTNWc1lYUmxJR0ZzYkNCalpXeHNjeUJ2YmlCc1pYWmxiQ0JtY205dElIUm9aU0JqWlc1MFpYSWdiMllnZEdobElHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JzWlhabGJDQXRJRlJvWlNCc1pYWmxiQ0JtY205dElIUm9aU0JqWlc1MFpYSWdiMllnZEdobElHeGhlVzkxZEM0Z01GeHVJQ0FnSUNBcUlHbHVaR2xqWVhSbGN5QjBhR1VnWTJWdWRHVnlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdVMlYwUEU1MWJXSmxjajU5SUhSb1pTQmpaV3hzY3lCdmJpQjBhR1VnYkdWMlpXd2dhVzRnZEdocGN5QnNZWGx2ZFhRZ2NtVndjbVZ6Wlc1MFpXUWdZbmxjYmlBZ0lDQWdLaUIwYUdWcGNpQnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTJWc2JITlBia3hsZG1Wc0tHeGxkbVZzS1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdObGJHeHpJRDBnYm1WM0lGTmxkQ2dwTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqWlc1MFpYSWdQU0IwYUdsekxsOWpaVzUwWlhJN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJR3hsZG1Wc0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtHTmxiblJsY2lrcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlDaHNaWFFnY205M0lEMGdZMlZ1ZEdWeUxuSnZkeUF0SUd4bGRtVnNPeUJ5YjNjZ1BEMGdZMlZ1ZEdWeUxuSnZkeUFySUd4bGRtVnNPeUJ5YjNjckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR05sYkd4ekxtRmtaQ2gwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTNKdmR5d2dZMjlzT2lCalpXNTBaWEl1WTI5c0lDMGdiR1YyWld4OUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMlZzYkhNdVlXUmtLSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3Y205M0xDQmpiMnc2SUdObGJuUmxjaTVqYjJ3Z0t5QnNaWFpsYkgwcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlDaHNaWFFnWTI5c0lEMGdZMlZ1ZEdWeUxtTnZiQ0F0SUd4bGRtVnNJQ3NnTVRzZ1kyOXNJRHdnWTJWdWRHVnlMbU52YkNBcklHeGxkbVZzT3lCamIyd3JLeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkem9nWTJWdWRHVnlMbkp2ZHlBdElHeGxkbVZzTENCamIyeDlLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJWc2JITXVZV1JrS0hSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loN2NtOTNPaUJqWlc1MFpYSXVjbTkzSUNzZ2JHVjJaV3dzSUdOdmJIMHBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJqWld4c2N6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkViMlZ6SUdObGJHd2dZMjl1ZEdGcGJpQmhJR05sYkd3Z1puSnZiU0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaVDljYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmpaV3hzSUMwZ1FTQmpaV3hzSUdsdUlHeGhlVzkxZENCeVpYQnlaWE5sYm5SbFpDQmllU0JoSUc1MWJXSmxjaTVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMFJwWlZ0ZGZTQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTQXRJRUVnYkdsemRDQnZaaUJrYVdObElIUm9ZWFFnYUdGMlpTQmhiSEpsWVdSNUlHSmxaVzRnYkdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdRbTl2YkdWaGJuMGdWSEoxWlNCcFppQmpaV3hzSUdSdlpYTWdibTkwSUdOdmJuUmhhVzRnWVNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyVnNiRWx6Ulcxd2RIa29ZMlZzYkN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpDQTlQVDBnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlV1Wm1sdVpDaGthV1VnUFQ0Z1kyVnNiQ0E5UFQwZ2RHaHBjeTVmWTI5dmNtUnBibUYwWlhOVWIwNTFiV0psY2loa2FXVXVZMjl2Y21ScGJtRjBaWE1wS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUdFZ2JuVnRZbVZ5SUhSdklHRWdZMlZzYkNBb2NtOTNMQ0JqYjJ3cFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYmlBdElGUm9aU0J1ZFcxaVpYSWdjbVZ3Y21WelpXNTBhVzVuSUdFZ1kyVnNiRnh1SUNBZ0lDQXFJRUJ5WlhSMWNtNXpJSHRQWW1wbFkzUjlJRkpsZEhWeWJpQjBhR1VnWTJWc2JDQW9lM0p2ZHl3Z1kyOXNmU2tnWTI5eWNtVnpjRzl1WkdsdVp5QnVMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyNTFiV0psY2xSdlEyVnNiQ2h1S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCN2NtOTNPaUJOWVhSb0xuUnlkVzVqS0c0Z0x5QjBhR2x6TGw5amIyeHpLU3dnWTI5c09pQnVJQ1VnZEdocGN5NWZZMjlzYzMwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElHTmxiR3dnZEc4Z1lTQnVkVzFpWlhKY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JqWld4c0lDMGdWR2hsSUdObGJHd2dkRzhnWTI5dWRtVnlkQ0IwYnlCcGRITWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY254MWJtUmxabWx1WldSOUlGUm9aU0J1ZFcxaVpYSWdZMjl5Y21WemNHOXVaR2x1WnlCMGJ5QjBhR1VnWTJWc2JDNWNiaUFnSUNBZ0tpQlNaWFIxY201eklIVnVaR1ZtYVc1bFpDQjNhR1Z1SUhSb1pTQmpaV3hzSUdseklHNXZkQ0J2YmlCMGFHVWdiR0Y1YjNWMFhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2NzSUdOdmJIMHBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQRDBnY205M0lDWW1JSEp2ZHlBOElIUm9hWE11WDNKdmQzTWdKaVlnTUNBOFBTQmpiMndnSmlZZ1kyOXNJRHdnZEdocGN5NWZZMjlzY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEp2ZHlBcUlIUm9hWE11WDJOdmJITWdLeUJqYjJ3N1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdZMlZzYkNCeVpYQnlaWE5sYm5SbFpDQmllU0JwZEhNZ2JuVnRZbVZ5SUhSdklIUm9aV2x5SUdOdmIzSmthVzVoZEdWekxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUc0Z0xTQlVhR1VnYm5WdFltVnlJSEpsY0hKbGMyVnVkR2x1WnlCaElHTmxiR3hjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDlpYW1WamRIMGdWR2hsSUdOdmIzSmthVzVoZEdWeklHTnZjbkpsYzNCdmJtUnBibWNnZEc4Z2RHaGxJR05sYkd3Z2NtVndjbVZ6Wlc1MFpXUWdZbmxjYmlBZ0lDQWdLaUIwYUdseklHNTFiV0psY2k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjl1ZFcxaVpYSlViME52YjNKa2FXNWhkR1Z6S0c0cElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDJObGJHeFViME52YjNKa2N5aDBhR2x6TGw5dWRXMWlaWEpVYjBObGJHd29iaWtwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnWVNCd1lXbHlJRzltSUdOdmIzSmthVzVoZEdWeklIUnZJR0VnYm5WdFltVnlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFBZbXBsWTNSOUlHTnZiM0prY3lBdElGUm9aU0JqYjI5eVpHbHVZWFJsY3lCMGJ5QmpiMjUyWlhKMFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0T2RXMWlaWEo4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl2Y21ScGJtRjBaWE1nWTI5dWRtVnlkR1ZrSUhSdklHRWdiblZ0WW1WeUxpQkpabHh1SUNBZ0lDQXFJSFJvWlNCamIyOXlaR2x1WVhSbGN5QmhjbVVnYm05MElHOXVJSFJvYVhNZ2JHRjViM1YwTENCMGFHVWdiblZ0WW1WeUlHbHpJSFZ1WkdWbWFXNWxaQzVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpiMjl5WkdsdVlYUmxjMVJ2VG5WdFltVnlLR052YjNKa2N5a2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnVJRDBnZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0hSb2FYTXVYMk52YjNKa2MxUnZRMlZzYkNoamIyOXlaSE1wS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLREFnUEQwZ2JpQW1KaUJ1SUR3Z2RHaHBjeTV0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdianRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZOdVlYQWdLSGdzZVNrZ2RHOGdkR2hsSUdOc2IzTmxjM1FnWTJWc2JDQnBiaUIwYUdseklFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JrYVdWamIyOXlaR2x1WVhSbElDMGdWR2hsSUdOdmIzSmthVzVoZEdVZ2RHOGdabWx1WkNCMGFHVWdZMnh2YzJWemRDQmpaV3hzWEc0Z0lDQWdJQ29nWm05eUxseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1JHbGxmU0JiWkdsbFkyOXZjbVJwYm1GMExtUnBaU0E5SUc1MWJHeGRJQzBnVkdobElHUnBaU0IwYnlCemJtRndJSFJ2TGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JrYVdWamIyOXlaR2x1WVhSbExuZ2dMU0JVYUdVZ2VDMWpiMjl5WkdsdVlYUmxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmthV1ZqYjI5eVpHbHVZWFJsTG5rZ0xTQlVhR1VnZVMxamIyOXlaR2x1WVhSbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1QySnFaV04wZkc1MWJHeDlJRlJvWlNCamIyOXlaR2x1WVhSbElHOW1JSFJvWlNCalpXeHNJR05zYjNObGMzUWdkRzhnS0hnc0lIa3BMbHh1SUNBZ0lDQXFJRTUxYkd3Z2QyaGxiaUJ1YnlCemRXbDBZV0pzWlNCalpXeHNJR2x6SUc1bFlYSWdLSGdzSUhrcFhHNGdJQ0FnSUNvdlhHNGdJQ0FnYzI1aGNGUnZLSHRrYVdVZ1BTQnVkV3hzTENCNExDQjVmU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjNKdVpYSkRaV3hzSUQwZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQk5ZWFJvTG5SeWRXNWpLSGtnTHlCMGFHbHpMbVJwWlZOcGVtVXBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXNPaUJOWVhSb0xuUnlkVzVqS0hnZ0x5QjBhR2x6TG1ScFpWTnBlbVVwWEc0Z0lDQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyOXlibVZ5SUQwZ2RHaHBjeTVmWTJWc2JGUnZRMjl2Y21SektHTnZjbTVsY2tObGJHd3BPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQjNhV1IwYUVsdUlEMGdZMjl5Ym1WeUxuZ2dLeUIwYUdsekxtUnBaVk5wZW1VZ0xTQjRPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQjNhV1IwYUU5MWRDQTlJSFJvYVhNdVpHbGxVMmw2WlNBdElIZHBaSFJvU1c0N1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdobGFXZG9kRWx1SUQwZ1kyOXlibVZ5TG5rZ0t5QjBhR2x6TG1ScFpWTnBlbVVnTFNCNU8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCb1pXbG5hSFJQZFhRZ1BTQjBhR2x6TG1ScFpWTnBlbVVnTFNCb1pXbG5hSFJKYmp0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeGRXRmtjbUZ1ZEhNZ1BTQmJlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NUb2dkR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLR052Y201bGNrTmxiR3dwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZMjkyWlhKaFoyVTZJSGRwWkhSb1NXNGdLaUJvWldsbmFIUkpibHh1SUNBZ0lDQWdJQ0I5TENCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J4T2lCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISnZkem9nWTI5eWJtVnlRMlZzYkM1eWIzY3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlzT2lCamIzSnVaWEpEWld4c0xtTnZiQ0FySURGY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZMjkyWlhKaFoyVTZJSGRwWkhSb1QzVjBJQ29nYUdWcFoyaDBTVzVjYmlBZ0lDQWdJQ0FnZlN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY1RvZ2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUdOdmNtNWxja05sYkd3dWNtOTNJQ3NnTVN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIydzZJR052Y201bGNrTmxiR3d1WTI5c1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFbHVJQ29nYUdWcFoyaDBUM1YwWEc0Z0lDQWdJQ0FnSUgwc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhFNklIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCamIzSnVaWEpEWld4c0xuSnZkeUFySURFc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXNPaUJqYjNKdVpYSkRaV3hzTG1OdmJDQXJJREZjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOTJaWEpoWjJVNklIZHBaSFJvVDNWMElDb2dhR1ZwWjJoMFQzVjBYRzRnSUNBZ0lDQWdJSDFkTzF4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOdVlYQlVieUE5SUhGMVlXUnlZVzUwYzF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnWTJWc2JDQnphRzkxYkdRZ1ltVWdiMjRnZEdobElHeGhlVzkxZEZ4dUlDQWdJQ0FnSUNBZ0lDQWdMbVpwYkhSbGNpZ29jWFZoWkhKaGJuUXBJRDArSUhWdVpHVm1hVzVsWkNBaFBUMGdjWFZoWkhKaGJuUXVjU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJR05sYkd3Z2MyaHZkV3hrSUdKbElHNXZkQ0JoYkhKbFlXUjVJSFJoYTJWdUlHVjRZMlZ3ZENCaWVTQnBkSE5sYkdaY2JpQWdJQ0FnSUNBZ0lDQWdJQzVtYVd4MFpYSW9LSEYxWVdSeVlXNTBLU0E5UGlBb1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JuVnNiQ0FoUFQwZ1pHbGxJQ1ltSUhSb2FYTXVYMk52YjNKa2FXNWhkR1Z6Vkc5T2RXMWlaWElvWkdsbExtTnZiM0prYVc1aGRHVnpLU0E5UFQwZ2NYVmhaSEpoYm5RdWNTbGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjhmQ0IwYUdsekxsOWpaV3hzU1hORmJYQjBlU2h4ZFdGa2NtRnVkQzV4TENCZlpHbGpaUzVuWlhRb2RHaHBjeWtwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnWTJWc2JDQnphRzkxYkdRZ1ltVWdZMjkyWlhKbFpDQmllU0IwYUdVZ1pHbGxJSFJvWlNCdGIzTjBYRzRnSUNBZ0lDQWdJQ0FnSUNBdWNtVmtkV05sS0Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNodFlYaFJMQ0J4ZFdGa2NtRnVkQ2tnUFQ0Z2NYVmhaSEpoYm5RdVkyOTJaWEpoWjJVZ1BpQnRZWGhSTG1OdmRtVnlZV2RsSUQ4Z2NYVmhaSEpoYm5RZ09pQnRZWGhSTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUh0eE9pQjFibVJsWm1sdVpXUXNJR052ZG1WeVlXZGxPaUF0TVgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ2s3WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkNBaFBUMGdjMjVoY0ZSdkxuRWdQeUIwYUdsekxsOXVkVzFpWlhKVWIwTnZiM0prYVc1aGRHVnpLSE51WVhCVWJ5NXhLU0E2SUc1MWJHdzdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSMlYwSUhSb1pTQmthV1VnWVhRZ2NHOXBiblFnS0hnc0lIa3BPMXh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFFiMmx1ZEgwZ2NHOXBiblFnTFNCVWFHVWdjRzlwYm5RZ2FXNGdLSGdzSUhrcElHTnZiM0prYVc1aGRHVnpYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdSR2xsZkc1MWJHeDlJRlJvWlNCa2FXVWdkVzVrWlhJZ1kyOXZjbVJwYm1GMFpYTWdLSGdzSUhrcElHOXlJRzUxYkd3Z2FXWWdibThnWkdsbFhHNGdJQ0FnSUNvZ2FYTWdZWFFnZEdobElIQnZhVzUwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZEVGMEtIQnZhVzUwSUQwZ2UzZzZJREFzSUhrNklEQjlLU0I3WEc0Z0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1pHbGxJRzltSUY5a2FXTmxMbWRsZENoMGFHbHpLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2UzZ3NJSGw5SUQwZ1pHbGxMbU52YjNKa2FXNWhkR1Z6TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjRSbWwwSUQwZ2VDQThQU0J3YjJsdWRDNTRJQ1ltSUhCdmFXNTBMbmdnUEQwZ2VDQXJJSFJvYVhNdVpHbGxVMmw2WlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIbEdhWFFnUFNCNUlEdzlJSEJ2YVc1MExua2dKaVlnY0c5cGJuUXVlU0E4UFNCNUlDc2dkR2hwY3k1a2FXVlRhWHBsTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2VFWnBkQ0FtSmlCNVJtbDBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR1JwWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU5oYkdOMWJHRjBaU0IwYUdVZ1ozSnBaQ0J6YVhwbElHZHBkbVZ1SUhkcFpIUm9JR0Z1WkNCb1pXbG5hSFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdkMmxrZEdnZ0xTQlVhR1VnYldsdWFXMWhiQ0IzYVdSMGFGeHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCb1pXbG5hSFFnTFNCVWFHVWdiV2x1YVcxaGJDQm9aV2xuYUhSY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk5oYkdOMWJHRjBaVWR5YVdRb2QybGtkR2dzSUdobGFXZG9kQ2tnZTF4dUlDQWdJQ0FnSUNCZlkyOXNjeTV6WlhRb2RHaHBjeXdnVFdGMGFDNW1iRzl2Y2loM2FXUjBhQ0F2SUhSb2FYTXVaR2xsVTJsNlpTa3BPMXh1SUNBZ0lDQWdJQ0JmY205M2N5NXpaWFFvZEdocGN5d2dUV0YwYUM1bWJHOXZjaWhvWldsbmFIUWdMeUIwYUdsekxtUnBaVk5wZW1VcEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdLSEp2ZHl3Z1kyOXNLU0JqWld4c0lIUnZJQ2g0TENCNUtTQmpiMjl5WkdsdVlYUmxjeTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUMkpxWldOMGZTQmpaV3hzSUMwZ1ZHaGxJR05sYkd3Z2RHOGdZMjl1ZG1WeWRDQjBieUJqYjI5eVpHbHVZWFJsYzF4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA5aWFtVmpkSDBnVkdobElHTnZjbkpsYzNCdmJtUnBibWNnWTI5dmNtUnBibUYwWlhNdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTJWc2JGUnZRMjl2Y21SektIdHliM2NzSUdOdmJIMHBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSHQ0T2lCamIyd2dLaUIwYUdsekxtUnBaVk5wZW1Vc0lIazZJSEp2ZHlBcUlIUm9hWE11WkdsbFUybDZaWDA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTI5dWRtVnlkQ0FvZUN3Z2VTa2dZMjl2Y21ScGJtRjBaWE1nZEc4Z1lTQW9jbTkzTENCamIyd3BJR05sYkd3dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWTI5dmNtUnBibUYwWlhNZ0xTQlVhR1VnWTI5dmNtUnBibUYwWlhNZ2RHOGdZMjl1ZG1WeWRDQjBieUJoSUdObGJHd3VYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUMkpxWldOMGZTQlVhR1VnWTI5eWNtVnpjRzl1WkdsdVp5QmpaV3hzWEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMjl2Y21SelZHOURaV3hzS0h0NExDQjVmU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCTllYUm9MblJ5ZFc1aktIa2dMeUIwYUdsekxtUnBaVk5wZW1VcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5c09pQk5ZWFJvTG5SeWRXNWpLSGdnTHlCMGFHbHpMbVJwWlZOcGVtVXBYRzRnSUNBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdEhjbWxrVEdGNWIzVjBmVHRjYmlJc0lpOHFLbHh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaU0J0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTmNiaUFxTDF4dVhHNHZLbHh1SUNvZ1EyOXVkbVZ5ZENCaGJpQklWRTFNSUdGMGRISnBZblYwWlNCMGJ5QmhiaUJwYm5OMFlXNWpaU2R6SUhCeWIzQmxjblI1TGlCY2JpQXFYRzRnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnYm1GdFpTQXRJRlJvWlNCaGRIUnlhV0oxZEdVbmN5QnVZVzFsWEc0Z0tpQkFjbVYwZFhKdUlIdFRkSEpwYm1kOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIQnliM0JsY25SNUozTWdibUZ0WlM0Z1JtOXlJR1Y0WVcxd2JHVXNJRndpYlhrdFlYUjBjbHdpWEc0Z0tpQjNhV3hzSUdKbElHTnZiblpsY25SbFpDQjBieUJjSW0xNVFYUjBjbHdpTENCaGJtUWdYQ0prYVhOaFlteGxaRndpSUhSdklGd2laR2x6WVdKc1pXUmNJaTVjYmlBcUwxeHVZMjl1YzNRZ1lYUjBjbWxpZFhSbE1uQnliM0JsY25SNUlEMGdLRzVoYldVcElEMCtJSHRjYmlBZ0lDQmpiMjV6ZENCYlptbHljM1FzSUM0dUxuSmxjM1JkSUQwZ2JtRnRaUzV6Y0d4cGRDaGNJaTFjSWlrN1hHNGdJQ0FnY21WMGRYSnVJR1pwY25OMElDc2djbVZ6ZEM1dFlYQW9kMjl5WkNBOVBpQjNiM0prTG5Oc2FXTmxLREFzSURFcExuUnZWWEJ3WlhKRFlYTmxLQ2tnS3lCM2IzSmtMbk5zYVdObEtERXBLUzVxYjJsdUtDazdYRzU5TzF4dVhHNHZLaXBjYmlBcUlFMXBlR2x1SUh0QWJHbHVheUJ0YjJSMWJHVTZiV2w0YVc0dlVtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZsSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdkRzhnWVNCamJHRnpjeTVjYmlBcVhHNGdLaUJBY0dGeVlXMGdleXA5SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYZ2dhVzUwYnk1Y2JpQXFJRUJ5WlhSMWNtNGdlMjF2WkhWc1pUcHRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOK1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZTQlVhR1VnYldsNFpXUXRhVzRnWTJ4aGMzTmNiaUFxTDF4dVkyOXVjM1FnVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6SUQwZ0tGTjFjQ2tnUFQ1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCTmFYaHBiaUIwYnlCdFlXdGxJR0ZzYkNCaGRIUnlhV0oxZEdWeklHOXVJR0VnWTNWemRHOXRJRWhVVFV4RmJHVnRaVzUwSUhKbFlXUXRiMjVzZVNCcGJpQjBhR1VnYzJWdWMyVmNiaUFnSUNBZ0tpQjBhR0YwSUhkb1pXNGdkR2hsSUdGMGRISnBZblYwWlNCblpYUnpJR0VnYm1WM0lIWmhiSFZsSUhSb1lYUWdaR2xtWm1WeWN5Qm1jbTl0SUhSb1pTQjJZV3gxWlNCdlppQjBhR1ZjYmlBZ0lDQWdLaUJqYjNKeVpYTndiMjVrYVc1bklIQnliM0JsY25SNUxDQnBkQ0JwY3lCeVpYTmxkQ0IwYnlCMGFHRjBJSEJ5YjNCbGNuUjVKM01nZG1Gc2RXVXVJRlJvWlZ4dUlDQWdJQ0FxSUdGemMzVnRjSFJwYjI0Z2FYTWdkR2hoZENCaGRIUnlhV0oxZEdVZ1hDSnRlUzFoZEhSeWFXSjFkR1ZjSWlCamIzSnlaWE53YjI1a2N5QjNhWFJvSUhCeWIzQmxjblI1SUZ3aWRHaHBjeTV0ZVVGMGRISnBZblYwWlZ3aUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0RGJHRnpjMzBnVTNWd0lDMGdWR2hsSUdOc1lYTnpJSFJ2SUcxcGVHbHVJSFJvYVhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWekxseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdWR2hsSUcxcGVHVmtJR2x1SUdOc1lYTnpMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRRzFwZUdsdVhHNGdJQ0FnSUNvZ1FHRnNhV0Z6SUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyeGhjM01nWlhoMFpXNWtjeUJUZFhBZ2UxeHVYRzRnSUNBZ0lDQWdJQzhxS2x4dUlDQWdJQ0FnSUNBZ0tpQkRZV3hzWW1GamF5QjBhR0YwSUdseklHVjRaV04xZEdWa0lIZG9aVzRnWVc0Z2IySnpaWEoyWldRZ1lYUjBjbWxpZFhSbEozTWdkbUZzZFdVZ2FYTmNiaUFnSUNBZ0lDQWdJQ29nWTJoaGJtZGxaQzRnU1dZZ2RHaGxJRWhVVFV4RmJHVnRaVzUwSUdseklHTnZibTVsWTNSbFpDQjBieUIwYUdVZ1JFOU5MQ0IwYUdVZ1lYUjBjbWxpZFhSbFhHNGdJQ0FnSUNBZ0lDQXFJSFpoYkhWbElHTmhiaUJ2Ym14NUlHSmxJSE5sZENCMGJ5QjBhR1VnWTI5eWNtVnpjRzl1WkdsdVp5QklWRTFNUld4bGJXVnVkQ2R6SUhCeWIzQmxjblI1TGx4dUlDQWdJQ0FnSUNBZ0tpQkpiaUJsWm1abFkzUXNJSFJvYVhNZ2JXRnJaWE1nZEdocGN5QklWRTFNUld4bGJXVnVkQ2R6SUdGMGRISnBZblYwWlhNZ2NtVmhaQzF2Ym14NUxseHVJQ0FnSUNBZ0lDQWdLbHh1SUNBZ0lDQWdJQ0FnS2lCR2IzSWdaWGhoYlhCc1pTd2dhV1lnWVc0Z1NGUk5URVZzWlcxbGJuUWdhR0Z6SUdGdUlHRjBkSEpwWW5WMFpTQmNJbmhjSWlCaGJtUmNiaUFnSUNBZ0lDQWdJQ29nWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTQmNJbmhjSWl3Z2RHaGxiaUJqYUdGdVoybHVaeUIwYUdVZ2RtRnNkV1VnWENKNFhDSWdkRzhnWENJMVhDSmNiaUFnSUNBZ0lDQWdJQ29nZDJsc2JDQnZibXg1SUhkdmNtc2dkMmhsYmlCZ2RHaHBjeTU0SUQwOVBTQTFZQzVjYmlBZ0lDQWdJQ0FnSUNwY2JpQWdJQ0FnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHNWhiV1VnTFNCVWFHVWdZWFIwY21saWRYUmxKM01nYm1GdFpTNWNiaUFnSUNBZ0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJRzlzWkZaaGJIVmxJQzBnVkdobElHRjBkSEpwWW5WMFpTZHpJRzlzWkNCMllXeDFaUzVjYmlBZ0lDQWdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUc1bGQxWmhiSFZsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc1bGR5QjJZV3gxWlM1Y2JpQWdJQ0FnSUNBZ0lDb3ZYRzRnSUNBZ0lDQWdJR0YwZEhKcFluVjBaVU5vWVc1blpXUkRZV3hzWW1GamF5aHVZVzFsTENCdmJHUldZV3gxWlN3Z2JtVjNWbUZzZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklFRnNiQ0JoZEhSeWFXSjFkR1Z6SUdGeVpTQnRZV1JsSUhKbFlXUXRiMjVzZVNCMGJ5QndjbVYyWlc1MElHTm9aV0YwYVc1bklHSjVJR05vWVc1bmFXNW5YRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QjBhR1VnWVhSMGNtbGlkWFJsSUhaaGJIVmxjeTRnVDJZZ1kyOTFjbk5sTENCMGFHbHpJR2x6SUdKNUlHNXZYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5Qm5kV0Z5WVc1MFpXVWdkR2hoZENCMWMyVnljeUIzYVd4c0lHNXZkQ0JqYUdWaGRDQnBiaUJoSUdScFptWmxjbVZ1ZENCM1lYa3VYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J3Y205d1pYSjBlU0E5SUdGMGRISnBZblYwWlRKd2NtOXdaWEowZVNodVlXMWxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwYUdsekxtTnZibTVsWTNSbFpDQW1KaUJ1WlhkV1lXeDFaU0FoUFQwZ1lDUjdkR2hwYzF0d2NtOXdaWEowZVYxOVlDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRzVoYldVc0lIUm9hWE5iY0hKdmNHVnlkSGxkS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNWpiMjV6ZENCV1lXeHBaR0YwYVc5dVJYSnliM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRVZ5Y205eUlIdGNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaHRjMmNwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYlhObktUdGNiaUFnSUNCOVhHNTlPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRlpoYkdsa1lYUnBiMjVGY25KdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRXWVd4cFpHRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMlZ5Y205eUwxWmhiR2xrWVhScGIyNUZjbkp2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JmZG1Gc2RXVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyUmxabUYxYkhSV1lXeDFaU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZaWEp5YjNKeklEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVZMjl1YzNRZ1ZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJSHRjYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWg3ZG1Gc2RXVXNJR1JsWm1GMWJIUldZV3gxWlN3Z1pYSnliM0p6SUQwZ1cxMTlLU0I3WEc0Z0lDQWdJQ0FnSUY5MllXeDFaUzV6WlhRb2RHaHBjeXdnZG1Gc2RXVXBPMXh1SUNBZ0lDQWdJQ0JmWkdWbVlYVnNkRlpoYkhWbExuTmxkQ2gwYUdsekxDQmtaV1poZFd4MFZtRnNkV1VwTzF4dUlDQWdJQ0FnSUNCZlpYSnliM0p6TG5ObGRDaDBhR2x6TENCbGNuSnZjbk1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCdmNtbG5hVzRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmRtRnNkV1V1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCMllXeDFaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVhWE5XWVd4cFpDQS9JSFJvYVhNdWIzSnBaMmx1SURvZ1gyUmxabUYxYkhSV1lXeDFaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaMlYwSUdWeWNtOXljeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5bGNuSnZjbk11WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCcGMxWmhiR2xrS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z01DQStQU0IwYUdsekxtVnljbTl5Y3k1c1pXNW5kR2c3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR1ZtWVhWc2RGUnZLRzVsZDBSbFptRjFiSFFwSUh0Y2JpQWdJQ0FnSUNBZ1gyUmxabUYxYkhSV1lXeDFaUzV6WlhRb2RHaHBjeXdnYm1WM1JHVm1ZWFZzZENrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNBZ0lIMWNibHh1SUNBZ0lGOWphR1ZqYXloN2NISmxaR2xqWVhSbExDQmlhVzVrVm1GeWFXRmliR1Z6SUQwZ1cxMHNJRVZ5Y205eVZIbHdaU0E5SUZaaGJHbGtZWFJwYjI1RmNuSnZjbjBwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnY0hKdmNHOXphWFJwYjI0Z1BTQndjbVZrYVdOaGRHVXVZWEJ3Ykhrb2RHaHBjeXdnWW1sdVpGWmhjbWxoWW14bGN5azdYRzRnSUNBZ0lDQWdJR2xtSUNnaGNISnZjRzl6YVhScGIyNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNtOXlJRDBnYm1WM0lFVnljbTl5Vkhsd1pTaDBhR2x6TG5aaGJIVmxMQ0JpYVc1a1ZtRnlhV0ZpYkdWektUdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dlkyOXVjMjlzWlM1M1lYSnVLR1Z5Y205eUxuUnZVM1J5YVc1bktDa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVsY25KdmNuTXVjSFZ6YUNobGNuSnZjaWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSNWNHVldZV3hwWkdGMGIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vm1Gc2FXUmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlXWVd4cFpHRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1VHRnljMlZGY25KdmNpQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1ZtRnNhV1JoZEdsdmJrVnljbTl5SUh0Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2lodGMyY3BJSHRjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9iWE5uS1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGQmhjbk5sUlhKeWIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vm1Gc2FXUmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlXWVd4cFpHRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1NXNTJZV3hwWkZSNWNHVkZjbkp2Y2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nVm1Gc2FXUmhkR2x2YmtWeWNtOXlJSHRjYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWh0YzJjcElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb2JYTm5LVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUVsdWRtRnNhV1JVZVhCbFJYSnliM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0UVlYSnpaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5UVlYSnpaVVZ5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBsdWRtRnNhV1JVZVhCbFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1NVNVVSVWRGVWw5RVJVWkJWVXhVWDFaQlRGVkZJRDBnTUR0Y2JtTnZibk4wSUVsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUlEMGdZMnhoYzNNZ1pYaDBaVzVrY3lCVWVYQmxWbUZzYVdSaGRHOXlJSHRjYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWhwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0JzWlhRZ2RtRnNkV1VnUFNCSlRsUkZSMFZTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUmxabUYxYkhSV1lXeDFaU0E5SUVsT1ZFVkhSVkpmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYSnliM0p6SUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tFNTFiV0psY2k1cGMwbHVkR1ZuWlhJb2FXNXdkWFFwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJR2x1Y0hWME8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRndpYzNSeWFXNW5YQ0lnUFQwOUlIUjVjR1Z2WmlCcGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NHRnljMlZrVm1Gc2RXVWdQU0J3WVhKelpVbHVkQ2hwYm5CMWRDd2dNVEFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0U1MWJXSmxjaTVwYzBsdWRHVm5aWElvY0dGeWMyVmtWbUZzZFdVcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkbUZzZFdVZ1BTQndZWEp6WldSV1lXeDFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUZCaGNuTmxSWEp5YjNJb2FXNXdkWFFwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2JHRnlaMlZ5VkdoaGJpaHVLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxsOWphR1ZqYXloN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3Y21Wa2FXTmhkR1U2SUNodUtTQTlQaUIwYUdsekxtOXlhV2RwYmlBK1BTQnVMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1ltbHVaRlpoY21saFlteGxjem9nVzI1ZFhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITnRZV3hzWlhKVWFHRnVLRzRwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tHNHBJRDArSUhSb2FYTXViM0pwWjJsdUlEdzlJRzRzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmlhVzVrVm1GeWFXRmliR1Z6T2lCYmJsMWNiaUFnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZbVYwZDJWbGJpaHVMQ0J0S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDaHVMQ0J0S1NBOVBpQjBhR2x6TG14aGNtZGxjbFJvWVc0b2Jpa2dKaVlnZEdocGN5NXpiV0ZzYkdWeVZHaGhiaWh0S1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR0pwYm1SV1lYSnBZV0pzWlhNNklGdHVMQ0J0WFZ4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOVhHNTlPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRWx1ZEdWblpYSlVlWEJsVm1Gc2FXUmhkRzl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDFSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1NXNTJZV3hwWkZSNWNHVkZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2U1c1MllXeHBaRlI1Y0dWRmNuSnZjaTVxYzF3aU8xeHVYRzVqYjI1emRDQlRWRkpKVGtkZlJFVkdRVlZNVkY5V1FVeFZSU0E5SUZ3aVhDSTdYRzVqYjI1emRDQlRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QlVlWEJsVm1Gc2FXUmhkRzl5SUh0Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2locGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdVZ1BTQlRWRkpKVGtkZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1UxUlNTVTVIWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHVnljbTl5Y3lBOUlGdGRPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaGNJbk4wY21sdVoxd2lJRDA5UFNCMGVYQmxiMllnYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhiSFZsSUQwZ2FXNXdkWFE3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxjbkp2Y25NdWNIVnphQ2h1WlhjZ1NXNTJZV3hwWkZSNWNHVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjM1Z3WlhJb2UzWmhiSFZsTENCa1pXWmhkV3gwVm1Gc2RXVXNJR1Z5Y205eWMzMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHNXZkRVZ0Y0hSNUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvS1NBOVBpQmNJbHdpSUNFOVBTQjBhR2x6TG05eWFXZHBibHh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZWSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1THk5cGJYQnZjblFnZTFCaGNuTmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDFCaGNuTmxSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3U1c1MllXeHBaRlI1Y0dWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZTVzUyWVd4cFpGUjVjR1ZGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCRFQweFBVbDlFUlVaQlZVeFVYMVpCVEZWRklEMGdYQ0ppYkdGamExd2lPMXh1WTI5dWMzUWdRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QlVlWEJsVm1Gc2FXUmhkRzl5SUh0Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2locGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdVZ1BTQkRUMHhQVWw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmtaV1poZFd4MFZtRnNkV1VnUFNCRFQweFBVbDlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjbk1nUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb1hDSnpkSEpwYm1kY0lpQTlQVDBnZEhsd1pXOW1JR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaU0E5SUdsdWNIVjBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUVsdWRtRnNhV1JVZVhCbFJYSnliM0lvYVc1d2RYUXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lITjFjR1Z5S0h0MllXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbExDQmxjbkp2Y25OOUtUdGNiaUFnSUNCOVhHNTlPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRU52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjbHh1ZlR0Y2JpSXNJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dWFXMXdiM0owSUh0VWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlVZVhCbFZtRnNhV1JoZEc5eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFCaGNuTmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDFCaGNuTmxSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3U1c1MllXeHBaRlI1Y0dWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZTVzUyWVd4cFpGUjVjR1ZGY25KdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCQ1QwOU1SVUZPWDBSRlJrRlZURlJmVmtGTVZVVWdQU0JtWVd4elpUdGNibU52Ym5OMElFSnZiMnhsWVc1VWVYQmxWbUZzYVdSaGRHOXlJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QlVlWEJsVm1Gc2FXUmhkRzl5SUh0Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2locGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdVZ1BTQkNUMDlNUlVGT1gwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1JsWm1GMWJIUldZV3gxWlNBOUlFSlBUMHhGUVU1ZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaWEp5YjNKeklEMGdXMTA3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLR2x1Y0hWMElHbHVjM1JoYm1ObGIyWWdRbTl2YkdWaGJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNoY0luTjBjbWx1WjF3aUlEMDlQU0IwZVhCbGIyWWdhVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ3ZkSEoxWlM5cExuUmxjM1FvYVc1d2RYUXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc2RXVWdQU0IwY25WbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNndlptRnNjMlV2YVM1MFpYTjBLR2x1Y0hWMEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1Z5Y205eWN5NXdkWE5vS0c1bGR5QlFZWEp6WlVWeWNtOXlLR2x1Y0hWMEtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dTVzUyWVd4cFpGUjVjR1ZGY25KdmNpaHBibkIxZENrcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9lM1poYkhWbExDQmtaV1poZFd4MFZtRnNkV1VzSUdWeWNtOXljMzBwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2x6VkhKMVpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0NrZ1BUNGdkSEoxWlNBOVBUMGdkR2hwY3k1dmNtbG5hVzVjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVhOR1lXeHpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tDa2dQVDRnWm1Gc2MyVWdQVDA5SUhSb2FYTXViM0pwWjJsdVhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnUW05dmJHVmhibFI1Y0dWV1lXeHBaR0YwYjNKY2JuMDdYRzRpTENJdktpb2dYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRrZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNibWx0Y0c5eWRDQjdTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFOMGNtbHVaMVI1Y0dWV1lXeHBaR0YwYjNKOUlHWnliMjBnWENJdUwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1EyOXNiM0pVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOURiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1FtOXZiR1ZoYmxSNWNHVldZV3hwWkdGMGIzSjlJR1p5YjIwZ1hDSXVMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzVjYm1OdmJuTjBJRlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJSHRjYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JpYjI5c1pXRnVLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnUW05dmJHVmhibFI1Y0dWV1lXeHBaR0YwYjNJb2FXNXdkWFFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ykc5eUtHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlLR2x1Y0hWMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCcGJuUmxaMlZ5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1NXNTBaV2RsY2xSNWNHVldZV3hwWkdGMGIzSW9hVzV3ZFhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhOMGNtbHVaeWhwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUZOMGNtbHVaMVI1Y0dWV1lXeHBaR0YwYjNJb2FXNXdkWFFwTzF4dUlDQWdJSDFjYmx4dWZUdGNibHh1WTI5dWMzUWdWbUZzYVdSaGRHOXlVMmx1WjJ4bGRHOXVJRDBnYm1WM0lGWmhiR2xrWVhSdmNpZ3BPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRlpoYkdsa1lYUnZjbE5wYm1kc1pYUnZiaUJoY3lCMllXeHBaR0YwWlZ4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0TENBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc0dktpcGNiaUFxSUVCdGIyUjFiR1ZjYmlBcUwxeHVhVzF3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMlZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOOUlHWnliMjBnWENJdUwyMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3k1cWMxd2lPMXh1YVcxd2IzSjBJSHQyWVd4cFpHRjBaWDBnWm5KdmJTQmNJaTR2ZG1Gc2FXUmhkR1V2ZG1Gc2FXUmhkR1V1YW5OY0lqdGNibHh1THk4Z1ZHaGxJRzVoYldWeklHOW1JSFJvWlNBb2IySnpaWEoyWldRcElHRjBkSEpwWW5WMFpYTWdiMllnZEdobElGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBMbHh1WTI5dWMzUWdRMDlNVDFKZlFWUlVVa2xDVlZSRklEMGdYQ0pqYjJ4dmNsd2lPMXh1WTI5dWMzUWdUa0ZOUlY5QlZGUlNTVUpWVkVVZ1BTQmNJbTVoYldWY0lqdGNibU52Ym5OMElGTkRUMUpGWDBGVVZGSkpRbFZVUlNBOUlGd2ljMk52Y21WY0lqdGNibU52Ym5OMElFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTQTlJRndpYUdGekxYUjFjbTVjSWp0Y2JseHVMeThnVkdobElIQnlhWFpoZEdVZ2NISnZjR1Z5ZEdsbGN5QnZaaUIwYUdVZ1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUWdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDI1aGJXVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzTmpiM0psSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlvWVhOVWRYSnVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibHh1THlvcVhHNGdLaUJCSUZCc1lYbGxjaUJwYmlCaElHUnBZMlVnWjJGdFpTNWNiaUFxWEc0Z0tpQkJJSEJzWVhsbGNpZHpJRzVoYldVZ2MyaHZkV3hrSUdKbElIVnVhWEYxWlNCcGJpQjBhR1VnWjJGdFpTNGdWSGR2SUdScFptWmxjbVZ1ZEZ4dUlDb2dWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblFnWld4bGJXVnVkSE1nZDJsMGFDQjBhR1VnYzJGdFpTQnVZVzFsSUdGMGRISnBZblYwWlNCaGNtVWdkSEpsWVhSbFpDQmhjMXh1SUNvZ2RHaGxJSE5oYldVZ2NHeGhlV1Z5TGx4dUlDcGNiaUFxSUVsdUlHZGxibVZ5WVd3Z2FYUWdhWE1nY21WamIyMXRaVzVrWldRZ2RHaGhkQ0J1YnlCMGQyOGdjR3hoZVdWeWN5QmtieUJvWVhabElIUm9aU0J6WVcxbElHTnZiRzl5TEZ4dUlDb2dZV3gwYUc5MVoyZ2dhWFFnYVhNZ2JtOTBJSFZ1WTI5dVkyVnBkbUZpYkdVZ2RHaGhkQ0JqWlhKMFlXbHVJR1JwWTJVZ1oyRnRaWE1nYUdGMlpTQndiR0Y1WlhKeklIZHZjbXRjYmlBcUlHbHVJSFJsWVcxeklIZG9aWEpsSUdsMElIZHZkV3hrSUcxaGEyVWdjMlZ1YzJVZ1ptOXlJSFIzYnlCdmNpQnRiM0psSUdScFptWmxjbVZ1ZENCd2JHRjVaWEp6SUhSdlhHNGdLaUJvWVhabElIUm9aU0J6WVcxbElHTnZiRzl5TGx4dUlDcGNiaUFxSUZSb1pTQnVZVzFsSUdGdVpDQmpiMnh2Y2lCaGRIUnlhV0oxZEdWeklHRnlaU0J5WlhGMWFYSmxaQzRnVkdobElITmpiM0psSUdGdVpDQm9ZWE10ZEhWeWJseHVJQ29nWVhSMGNtbGlkWFJsY3lCaGNtVWdibTkwTGx4dUlDcGNiaUFxSUVCbGVIUmxibVJ6SUVoVVRVeEZiR1Z0Wlc1MFhHNGdLaUJBYldsNFpYTWdiVzlrZFd4bE9tMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzM1U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOY2JpQXFMMXh1WTI5dWMzUWdWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblFnUFNCamJHRnpjeUJsZUhSbGJtUnpJRkpsWVdSUGJteDVRWFIwY21saWRYUmxjeWhJVkUxTVJXeGxiV1Z1ZENrZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUZSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MExDQnZjSFJwYjI1aGJHeDVJR0poYzJWa0lHOXVJR0Z1SUdsdWRHbDBhV0ZzWEc0Z0lDQWdJQ29nWTI5dVptbG5kWEpoZEdsdmJpQjJhV0VnWVc0Z2IySnFaV04wSUhCaGNtRnRaWFJsY2lCdmNpQmtaV05zWVhKbFpDQmhkSFJ5YVdKMWRHVnpJR2x1SUVoVVRVd3VYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1cyTnZibVpwWjEwZ0xTQkJiaUJwYm1sMGFXRnNJR052Ym1acFozVnlZWFJwYjI0Z1ptOXlJSFJvWlZ4dUlDQWdJQ0FxSUhCc1lYbGxjaUIwYnlCamNtVmhkR1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJR052Ym1acFp5NWpiMnh2Y2lBdElGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSWdkWE5sWkNCcGJpQjBhR1VnWjJGdFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ1kyOXVabWxuTG01aGJXVWdMU0JVYUdseklIQnNZWGxsY2lkeklHNWhiV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjMk52Y21WZElDMGdWR2hwY3lCd2JHRjVaWEluY3lCelkyOXlaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMEp2YjJ4bFlXNTlJRnRqYjI1bWFXY3VhR0Z6VkhWeWJsMGdMU0JVYUdseklIQnNZWGxsY2lCb1lYTWdZU0IwZFhKdUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdGpiMnh2Y2l3Z2JtRnRaU3dnYzJOdmNtVXNJR2hoYzFSMWNtNTlJRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpiMnh2Y2xaaGJIVmxJRDBnZG1Gc2FXUmhkR1V1WTI5c2IzSW9ZMjlzYjNJZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9RMDlNVDFKZlFWUlVVa2xDVlZSRktTazdYRzRnSUNBZ0lDQWdJR2xtSUNoamIyeHZjbFpoYkhWbExtbHpWbUZzYVdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5amIyeHZjaTV6WlhRb2RHaHBjeXdnWTI5c2IzSldZV3gxWlM1MllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVc0lIUm9hWE11WTI5c2IzSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGNJa0VnVUd4aGVXVnlJRzVsWldSeklHRWdZMjlzYjNJc0lIZG9hV05vSUdseklHRWdVM1J5YVc1bkxsd2lLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUc1aGJXVldZV3gxWlNBOUlIWmhiR2xrWVhSbExuTjBjbWx1WnlodVlXMWxJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0U1QlRVVmZRVlJVVWtsQ1ZWUkZLU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVZVzFsVm1Gc2RXVXVhWE5XWVd4cFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gyNWhiV1V1YzJWMEtIUm9hWE1zSUc1aGJXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1RrRk5SVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVibUZ0WlNrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0Z3aVFTQlFiR0Y1WlhJZ2JtVmxaSE1nWVNCdVlXMWxMQ0IzYUdsamFDQnBjeUJoSUZOMGNtbHVaeTVjSWlrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnpZMjl5WlZaaGJIVmxJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWh6WTI5eVpTQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tITmpiM0psVm1Gc2RXVXVhWE5XWVd4cFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gzTmpiM0psTG5ObGRDaDBhR2x6TENCelkyOXlaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVc0lIUm9hWE11YzJOdmNtVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMnRoZVM0Z1FTQndiR0Y1WlhJZ1pHOWxjeUJ1YjNRZ2JtVmxaQ0IwYnlCb1lYWmxJR0VnYzJOdmNtVXVYRzRnSUNBZ0lDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1MWJHd3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2hoYzFSMWNtNVdZV3gxWlNBOUlIWmhiR2xrWVhSbExtSnZiMnhsWVc0b2FHRnpWSFZ5YmlCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtbHpWSEoxWlNncE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYUdGelZIVnlibFpoYkhWbExtbHpWbUZzYVdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCb1lYTlVkWEp1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU3dnYUdGelZIVnliaWs3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJQYTJGNUxDQkJJSEJzWVhsbGNpQmtiMlZ6SUc1dmRDQmhiSGRoZVhNZ2FHRjJaU0JoSUhSMWNtNHVYRzRnSUNBZ0lDQWdJQ0FnSUNCZmFHRnpWSFZ5Ymk1elpYUW9kR2hwY3l3Z2JuVnNiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzNSaGRHbGpJR2RsZENCdlluTmxjblpsWkVGMGRISnBZblYwWlhNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmJYRzRnSUNBZ0lDQWdJQ0FnSUNCRFQweFBVbDlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQk9RVTFGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRk5EVDFKRlgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlZ4dUlDQWdJQ0FnSUNCZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUdScGMyTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ2NHeGhlV1Z5SjNNZ1kyOXNiM0l1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdVM1J5YVc1bmZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmpiMnh2Y2lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOWpiMnh2Y2k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTFOMGNtbHVaMzFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYm1GdFpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjl1WVcxbExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR2x6SUhCc1lYbGxjaWR6SUhOamIzSmxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2MyTnZjbVVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNJRDA5UFNCZmMyTnZjbVV1WjJWMEtIUm9hWE1wSUQ4Z01DQTZJRjl6WTI5eVpTNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVJQ0FnSUhObGRDQnpZMjl5WlNodVpYZFRZMjl5WlNrZ2UxeHVJQ0FnSUNBZ0lDQmZjMk52Y21VdWMyVjBLSFJvYVhNc0lHNWxkMU5qYjNKbEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUc1bGQxTmpiM0psS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuSmxiVzkyWlVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRkxDQnVaWGRUWTI5eVpTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJUZEdGeWRDQmhJSFIxY200Z1ptOXlJSFJvYVhNZ2NHeGhlV1Z5TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3Vkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5SOUlGUm9aU0J3YkdGNVpYSWdkMmwwYUNCaElIUjFjbTVjYmlBZ0lDQWdLaTljYmlBZ0lDQnpkR0Z5ZEZSMWNtNG9LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaDBhR2x6TG1selEyOXVibVZqZEdWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkJoY21WdWRFNXZaR1V1WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUTNWemRHOXRSWFpsYm5Rb1hDSjBiM0E2YzNSaGNuUXRkSFZ5Ymx3aUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR1YwWVdsc09pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjam9nZEdocGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU3dnZEhKMVpTazdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVWdVpDQmhJSFIxY200Z1ptOXlJSFJvYVhNZ2NHeGhlV1Z5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR1Z1WkZSMWNtNG9LU0I3WEc0Z0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCdWRXeHNLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1NFRlRYMVJWVWs1ZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkViMlZ6SUhSb2FYTWdjR3hoZVdWeUlHaGhkbVVnWVNCMGRYSnVQMXh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwSnZiMnhsWVc1OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHaGhjMVIxY200b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBjblZsSUQwOVBTQmZhR0Z6VkhWeWJpNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRU0JUZEhKcGJtY2djbVZ3Y21WelpXNTBZWFJwYjI0Z2IyWWdkR2hwY3lCd2JHRjVaWElzSUdocGN5QnZjaUJvWlhKeklHNWhiV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRUZEhKcGJtZDlJRlJvWlNCd2JHRjVaWEluY3lCdVlXMWxJSEpsY0hKbGMyVnVkSE1nZEdobElIQnNZWGxsY2lCaGN5QmhJSE4wY21sdVp5NWNiaUFnSUNBZ0tpOWNiaUFnSUNCMGIxTjBjbWx1WnlncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHQWtlM1JvYVhNdWJtRnRaWDFnTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklIUm9hWE1nY0d4aGVXVnlJR1Z4ZFdGc0lHRnViM1JvWlhJZ2NHeGhlV1Z5UDF4dUlDQWdJQ0FxSUZ4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Ylc5a2RXeGxPbFJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwZmxSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MGZTQnZkR2hsY2lBdElGUm9aU0J2ZEdobGNpQndiR0Y1WlhJZ2RHOGdZMjl0Y0dGeVpTQjBhR2x6SUhCc1lYbGxjaUIzYVhSb0xseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwSnZiMnhsWVc1OUlGUnlkV1VnZDJobGJpQmxhWFJvWlhJZ2RHaGxJRzlpYW1WamRDQnlaV1psY21WdVkyVnpJR0Z5WlNCMGFHVWdjMkZ0WlZ4dUlDQWdJQ0FxSUc5eUlIZG9aVzRnWW05MGFDQnVZVzFsSUdGdVpDQmpiMnh2Y2lCaGNtVWdkR2hsSUhOaGJXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1pYRjFZV3h6S0c5MGFHVnlLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzVoYldVZ1BTQmNJbk4wY21sdVoxd2lJRDA5UFNCMGVYQmxiMllnYjNSb1pYSWdQeUJ2ZEdobGNpQTZJRzkwYUdWeUxtNWhiV1U3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ2ZEdobGNpQTlQVDBnZEdocGN5QjhmQ0J1WVcxbElEMDlQU0IwYUdsekxtNWhiV1U3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVkMmx1Wkc5M0xtTjFjM1J2YlVWc1pXMWxiblJ6TG1SbFptbHVaU2hjSW5SdmNDMXdiR0Y1WlhKY0lpd2dWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblFwTzF4dVhHNHZLaXBjYmlBcUlGUm9aU0JrWldaaGRXeDBJSE41YzNSbGJTQndiR0Y1WlhJdUlFUnBZMlVnWVhKbElIUm9jbTkzYmlCaWVTQmhJSEJzWVhsbGNpNGdSbTl5SUhOcGRIVmhkR2x2Ym5OY2JpQXFJSGRvWlhKbElIbHZkU0IzWVc1MElIUnZJSEpsYm1SbGNpQmhJR0oxYm1Ob0lHOW1JR1JwWTJVZ2QybDBhRzkxZENCdVpXVmthVzVuSUhSb1pTQmpiMjVqWlhCMElHOW1JRkJzWVhsbGNuTmNiaUFxSUhSb2FYTWdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTSUdOaGJpQmlaU0JoSUhOMVluTjBhWFIxZEdVdUlFOW1JR052ZFhKelpTd2dhV1lnZVc5MUoyUWdiR2xyWlNCMGIxeHVJQ29nWTJoaGJtZGxJSFJvWlNCdVlXMWxJR0Z1WkM5dmNpQjBhR1VnWTI5c2IzSXNJR055WldGMFpTQmhibVFnZFhObElIbHZkWElnYjNkdUlGd2ljM2x6ZEdWdElIQnNZWGxsY2x3aUxseHVJQ29nUUdOdmJuTjBYRzRnS2k5Y2JtTnZibk4wSUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVpQTlJRzVsZHlCVWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRDaDdZMjlzYjNJNklGd2ljbVZrWENJc0lHNWhiV1U2SUZ3aUtsd2lmU2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5Rc1hHNGdJQ0FnUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU1hHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNiaTh2YVcxd2IzSjBJSHREYjI1bWFXZDFjbUYwYVc5dVJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdEhjbWxrVEdGNWIzVjBmU0JtY205dElGd2lMaTlIY21sa1RHRjViM1YwTG1welhDSTdYRzVwYlhCdmNuUWdlMFJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVW4wZ1puSnZiU0JjSWk0dlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUXVhbk5jSWp0Y2JtbHRjRzl5ZENCN2RtRnNhV1JoZEdWOUlHWnliMjBnWENJdUwzWmhiR2xrWVhSbEwzWmhiR2xrWVhSbExtcHpYQ0k3WEc1Y2JpOHFLbHh1SUNvZ1FHMXZaSFZzWlZ4dUlDb3ZYRzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0Z1BTQXpOelU3SUM4dklHMXpYRzVqYjI1emRDQkVSVVpCVlV4VVgwUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYm1OdmJuTjBJRVJGUmtGVlRGUmZTRTlNUkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFSUQwZ1ptRnNjMlU3WEc1amIyNXpkQ0JFUlVaQlZVeFVYMUpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRZ1BTQm1ZV3h6WlR0Y2JseHVZMjl1YzNRZ1VrOVhVeUE5SURFd08xeHVZMjl1YzNRZ1EwOU1VeUE5SURFd08xeHVYRzVqYjI1emRDQkVSVVpCVlV4VVgxZEpSRlJJSUQwZ1EwOU1VeUFxSUVSRlJrRlZURlJmUkVsRlgxTkpXa1U3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwaEZTVWRJVkNBOUlGSlBWMU1nS2lCRVJVWkJWVXhVWDBSSlJWOVRTVnBGT3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOUVTVk5RUlZKVFNVOU9JRDBnVFdGMGFDNW1iRzl2Y2loU1QxZFRJQzhnTWlrN1hHNWNibU52Ym5OMElFMUpUbDlFUlV4VVFTQTlJRE03SUM4dmNIaGNibHh1WTI5dWMzUWdWMGxFVkVoZlFWUlVVa2xDVlZSRklEMGdYQ0ozYVdSMGFGd2lPMXh1WTI5dWMzUWdTRVZKUjBoVVgwRlVWRkpKUWxWVVJTQTlJRndpYUdWcFoyaDBYQ0k3WEc1amIyNXpkQ0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlNBOUlGd2laR2x6Y0dWeWMybHZibHdpTzF4dVkyOXVjM1FnUkVsRlgxTkpXa1ZmUVZSVVVrbENWVlJGSUQwZ1hDSmthV1V0YzJsNlpWd2lPMXh1WTI5dWMzUWdSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbVJ5WVdkbmFXNW5MV1JwWTJVdFpHbHpZV0pzWldSY0lqdGNibU52Ym5OMElFaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0ltaHZiR1JwYm1jdFpHbGpaUzFrYVhOaFlteGxaRndpTzF4dVkyOXVjM1FnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW5KdmRHRjBhVzVuTFdScFkyVXRaR2x6WVdKc1pXUmNJanRjYm1OdmJuTjBJRWhQVEVSZlJGVlNRVlJKVDA1ZlFWUlVVa2xDVlZSRklEMGdYQ0pvYjJ4a0xXUjFjbUYwYVc5dVhDSTdYRzVjYmx4dVkyOXVjM1FnY0dGeWMyVk9kVzFpWlhJZ1BTQW9iblZ0WW1WeVUzUnlhVzVuTENCa1pXWmhkV3gwVG5WdFltVnlJRDBnTUNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUc1MWJXSmxjaUE5SUhCaGNuTmxTVzUwS0c1MWJXSmxjbE4wY21sdVp5d2dNVEFwTzF4dUlDQWdJSEpsZEhWeWJpQk9kVzFpWlhJdWFYTk9ZVTRvYm5WdFltVnlLU0EvSUdSbFptRjFiSFJPZFcxaVpYSWdPaUJ1ZFcxaVpYSTdYRzU5TzF4dVhHNWpiMjV6ZENCblpYUlFiM05wZEdsMlpVNTFiV0psY2lBOUlDaHVkVzFpWlhKVGRISnBibWNzSUdSbFptRjFiSFJXWVd4MVpTa2dQVDRnZTF4dUlDQWdJSEpsZEhWeWJpQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtHNTFiV0psY2xOMGNtbHVaeWxjYmlBZ0lDQWdJQ0FnTG14aGNtZGxjbFJvWVc0b01DbGNiaUFnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhrWldaaGRXeDBWbUZzZFdVcFhHNGdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JuMDdYRzVjYm1OdmJuTjBJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxJRDBnS0dWc1pXMWxiblFzSUc1aGJXVXNJR1JsWm1GMWJIUldZV3gxWlNrZ1BUNGdlMXh1SUNBZ0lHbG1JQ2hsYkdWdFpXNTBMbWhoYzBGMGRISnBZblYwWlNodVlXMWxLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IyWVd4MVpWTjBjbWx1WnlBOUlHVnNaVzFsYm5RdVoyVjBRWFIwY21saWRYUmxLRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2RtRnNkV1ZUZEhKcGJtY3NJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQmtaV1poZFd4MFZtRnNkV1U3WEc1OU8xeHVYRzVqYjI1emRDQm5aWFJDYjI5c1pXRnVJRDBnS0dKdmIyeGxZVzVUZEhKcGJtY3NJSFJ5ZFdWV1lXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdhV1lnS0hSeWRXVldZV3gxWlNBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlCOGZDQmNJblJ5ZFdWY0lpQTlQVDBnWW05dmJHVmhibE4wY21sdVp5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0Z3aVptRnNjMlZjSWlBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHUmxabUYxYkhSV1lXeDFaVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWpiMjV6ZENCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbElEMGdLR1ZzWlcxbGJuUXNJRzVoYldVc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaGxiR1Z0Wlc1MExtaGhjMEYwZEhKcFluVjBaU2h1WVcxbEtTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQjJZV3gxWlZOMGNtbHVaeUE5SUdWc1pXMWxiblF1WjJWMFFYUjBjbWxpZFhSbEtHNWhiV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmloMllXeDFaVk4wY21sdVp5d2dXM1poYkhWbFUzUnlhVzVuTENCY0luUnlkV1ZjSWwwc0lGdGNJbVpoYkhObFhDSmRMQ0JrWldaaGRXeDBWbUZzZFdVcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElIQnliM0JsY25ScFpYTmNibU52Ym5OMElGOWpZVzUyWVhNZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJ4aGVXOTFkQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZM1Z5Y21WdWRGQnNZWGxsY2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc1amIyNXpkQ0JqYjI1MFpYaDBJRDBnS0dKdllYSmtLU0E5UGlCZlkyRnVkbUZ6TG1kbGRDaGliMkZ5WkNrdVoyVjBRMjl1ZEdWNGRDaGNJakprWENJcE8xeHVYRzVqYjI1emRDQm5aWFJTWldGa2VVUnBZMlVnUFNBb1ltOWhjbVFwSUQwK0lIdGNiaUFnSUNCcFppQW9kVzVrWldacGJtVmtJRDA5UFNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdVoyVjBLR0p2WVhKa0tTa2dlMXh1SUNBZ0lDQWdJQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1YzJWMEtHSnZZWEprTENBd0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sTG1kbGRDaGliMkZ5WkNrN1hHNTlPMXh1WEc1amIyNXpkQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVWdQU0FvWW05aGNtUXNJSFZ3WkdGMFpTa2dQVDRnZTF4dUlDQWdJRjl1ZFcxaVpYSlBabEpsWVdSNVJHbGpaUzV6WlhRb1ltOWhjbVFzSUdkbGRGSmxZV1I1UkdsalpTaGliMkZ5WkNrZ0t5QjFjR1JoZEdVcE8xeHVmVHRjYmx4dVkyOXVjM1FnYVhOU1pXRmtlU0E5SUNoaWIyRnlaQ2tnUFQ0Z1oyVjBVbVZoWkhsRWFXTmxLR0p2WVhKa0tTQTlQVDBnWW05aGNtUXVaR2xqWlM1c1pXNW5kR2c3WEc1Y2JtTnZibk4wSUhWd1pHRjBaVUp2WVhKa0lEMGdLR0p2WVhKa0xDQmthV05sSUQwZ1ltOWhjbVF1WkdsalpTa2dQVDRnZTF4dUlDQWdJR2xtSUNocGMxSmxZV1I1S0dKdllYSmtLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNTBaWGgwS0dKdllYSmtLUzVqYkdWaGNsSmxZM1FvTUN3Z01Dd2dZbTloY21RdWQybGtkR2dzSUdKdllYSmtMbWhsYVdkb2RDazdYRzVjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pHbGxMbkpsYm1SbGNpaGpiMjUwWlhoMEtHSnZZWEprS1N3Z1ltOWhjbVF1WkdsbFUybDZaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1OU8xeHVYRzVjYmk4dklFbHVkR1Z5WVdOMGFXOXVJSE4wWVhSbGMxeHVZMjl1YzNRZ1RrOU9SU0E5SUZONWJXSnZiQ2hjSW01dlgybHVkR1Z5WVdOMGFXOXVYQ0lwTzF4dVkyOXVjM1FnU0U5TVJDQTlJRk41YldKdmJDaGNJbWh2YkdSY0lpazdYRzVqYjI1emRDQk5UMVpGSUQwZ1UzbHRZbTlzS0Z3aWJXOTJaVndpS1R0Y2JtTnZibk4wSUVsT1JFVlVSVkpOU1U1RlJDQTlJRk41YldKdmJDaGNJbWx1WkdWMFpYSnRhVzVsWkZ3aUtUdGNibU52Ym5OMElFUlNRVWRIU1U1SElEMGdVM2x0WW05c0tGd2laSEpoWjJkcGJtZGNJaWs3WEc1Y2JpOHZJRTFsZEdodlpITWdkRzhnYUdGdVpHeGxJR2x1ZEdWeVlXTjBhVzl1WEc1amIyNXpkQ0JqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5QTlJQ2hqWVc1MllYTXNJSGhYYVc1a2IzY3NJSGxYYVc1a2IzY3BJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQmpZVzUyWVhOQ2IzZ2dQU0JqWVc1MllYTXVaMlYwUW05MWJtUnBibWREYkdsbGJuUlNaV04wS0NrN1hHNWNiaUFnSUNCamIyNXpkQ0I0SUQwZ2VGZHBibVJ2ZHlBdElHTmhiblpoYzBKdmVDNXNaV1owSUNvZ0tHTmhiblpoY3k1M2FXUjBhQ0F2SUdOaGJuWmhjMEp2ZUM1M2FXUjBhQ2s3WEc0Z0lDQWdZMjl1YzNRZ2VTQTlJSGxYYVc1a2IzY2dMU0JqWVc1MllYTkNiM2d1ZEc5d0lDb2dLR05oYm5aaGN5NW9aV2xuYUhRZ0x5QmpZVzUyWVhOQ2IzZ3VhR1ZwWjJoMEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCN2VDd2dlWDA3WEc1OU8xeHVYRzVqYjI1emRDQnpaWFIxY0VsdWRHVnlZV04wYVc5dUlEMGdLR0p2WVhKa0tTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1kyRnVkbUZ6SUQwZ1gyTmhiblpoY3k1blpYUW9ZbTloY21RcE8xeHVYRzRnSUNBZ0x5OGdVMlYwZFhBZ2FXNTBaWEpoWTNScGIyNWNiaUFnSUNCc1pYUWdiM0pwWjJsdUlEMGdlMzA3WEc0Z0lDQWdiR1YwSUhOMFlYUmxJRDBnVGs5T1JUdGNiaUFnSUNCc1pYUWdjM1JoZEdsalFtOWhjbVFnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJRzUxYkd3N1hHNGdJQ0FnYkdWMElHaHZiR1JVYVcxbGIzVjBJRDBnYm5Wc2JEdGNibHh1SUNBZ0lHTnZibk4wSUdodmJHUkVhV1VnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaElUMHhFSUQwOVBTQnpkR0YwWlNCOGZDQkpUa1JGVkVWU1RVbE9SVVFnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGIyZG5iR1VnYUc5c1pDQXZJSEpsYkdWaGMyVmNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJzWVhsbGNsZHBkR2hCVkhWeWJpQTlJR0p2WVhKa0xuRjFaWEo1VTJWc1pXTjBiM0lvWENKMGIzQXRjR3hoZVdWeUxXeHBjM1FnZEc5d0xYQnNZWGxsY2x0b1lYTXRkSFZ5YmwxY0lpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9aR2xsVlc1a1pYSkRkWEp6YjNJdWFYTklaV3hrS0NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2k1eVpXeGxZWE5sU1hRb2NHeGhlV1Z5VjJsMGFFRlVkWEp1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWFHOXNaRWwwS0hCc1lYbGxjbGRwZEdoQlZIVnliaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdodmJHUlVhVzFsYjNWMElEMGdiblZzYkR0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdjM1JoY25SSWIyeGthVzVuSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCb2IyeGtWR2x0Wlc5MWRDQTlJSGRwYm1SdmR5NXpaWFJVYVcxbGIzVjBLR2h2YkdSRWFXVXNJR0p2WVhKa0xtaHZiR1JFZFhKaGRHbHZiaWs3WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElITjBiM0JJYjJ4a2FXNW5JRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0IzYVc1a2IzY3VZMnhsWVhKVWFXMWxiM1YwS0dodmJHUlVhVzFsYjNWMEtUdGNiaUFnSUNBZ0lDQWdhRzlzWkZScGJXVnZkWFFnUFNCdWRXeHNPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRWx1ZEdWeVlXTjBhVzl1SUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoT1QwNUZJRDA5UFNCemRHRjBaU2tnZTF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J2Y21sbmFXNGdQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZURvZ1pYWmxiblF1WTJ4cFpXNTBXQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I1T2lCbGRtVnVkQzVqYkdsbGJuUlpYRzRnSUNBZ0lDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaUE5SUdKdllYSmtMbXhoZVc5MWRDNW5aWFJCZENoamIyNTJaWEowVjJsdVpHOTNRMjl2Y21ScGJtRjBaWE5VYjBOaGJuWmhjeWhqWVc1MllYTXNJR1YyWlc1MExtTnNhV1Z1ZEZnc0lHVjJaVzUwTG1Oc2FXVnVkRmtwS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnSVQwOUlHUnBaVlZ1WkdWeVEzVnljMjl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMjVzZVNCcGJuUmxjbUZqZEdsdmJpQjNhWFJvSUhSb1pTQmliMkZ5WkNCMmFXRWdZU0JrYVdWY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVWdKaVlnSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdTVTVFUlZSRlVrMUpUa1ZFTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0Z5ZEVodmJHUnBibWNvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVodmJHUnBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnU0U5TVJEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGNuUkliMnhrYVc1bktDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2doWW05aGNtUXVaR2x6WVdKc1pXUkVjbUZuWjJsdVowUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdVZ1BTQk5UMVpGTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE5vYjNkSmJuUmxjbUZqZEdsdmJpQTlJQ2hsZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJR0p2WVhKa0xteGhlVzkxZEM1blpYUkJkQ2hqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5aGpZVzUyWVhNc0lHVjJaVzUwTG1Oc2FXVnVkRmdzSUdWMlpXNTBMbU5zYVdWdWRGa3BLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFUlNRVWRIU1U1SElEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5OMGVXeGxMbU4xY25OdmNpQTlJRndpWjNKaFltSnBibWRjSWp0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laM0poWWx3aU8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laR1ZtWVhWc2RGd2lPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElHMXZkbVVnUFNBb1pYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0UxUFZrVWdQVDA5SUhOMFlYUmxJSHg4SUVsT1JFVlVSVkpOU1U1RlJDQTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJR1JsZEdWeWJXbHVaU0JwWmlCaElHUnBaU0JwY3lCMWJtUmxjaUIwYUdVZ1kzVnljMjl5WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJKWjI1dmNtVWdjMjFoYkd3Z2JXOTJaVzFsYm5SelhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUUxaGRHZ3VZV0p6S0c5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VTQTlJRTFoZEdndVlXSnpLRzl5YVdkcGJpNTVJQzBnWlhabGJuUXVZMnhwWlc1MFdTazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hOU1U1ZlJFVk1WRUVnUENCa2VDQjhmQ0JOU1U1ZlJFVk1WRUVnUENCa2VTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdSRkpCUjBkSlRrYzdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1J2Y0VodmJHUnBibWNvS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScFkyVlhhWFJvYjNWMFJHbGxWVzVrWlhKRGRYSnpiM0lnUFNCaWIyRnlaQzVrYVdObExtWnBiSFJsY2loa2FXVWdQVDRnWkdsbElDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvWW05aGNtUXNJR1JwWTJWWGFYUm9iM1YwUkdsbFZXNWtaWEpEZFhKemIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhScFkwSnZZWEprSUQwZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1WjJWMFNXMWhaMlZFWVhSaEtEQXNJREFzSUdOaGJuWmhjeTUzYVdSMGFDd2dZMkZ1ZG1GekxtaGxhV2RvZENrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1JGSkJSMGRKVGtjZ1BUMDlJSE4wWVhSbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZUNBOUlHOXlhV2RwYmk1NElDMGdaWFpsYm5RdVkyeHBaVzUwV0R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjVJRDBnYjNKcFoybHVMbmtnTFNCbGRtVnVkQzVqYkdsbGJuUlpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCa2FXVlZibVJsY2tOMWNuTnZjaTVqYjI5eVpHbHVZWFJsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQ2hpYjJGeVpDa3VjSFYwU1cxaFoyVkVZWFJoS0hOMFlYUnBZMEp2WVhKa0xDQXdMQ0F3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxuSmxibVJsY2loamIyNTBaWGgwS0dKdllYSmtLU3dnWW05aGNtUXVaR2xsVTJsNlpTd2dlM2c2SUhnZ0xTQmtlQ3dnZVRvZ2VTQXRJR1I1ZlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyOXVjM1FnYzNSdmNFbHVkR1Z5WVdOMGFXOXVJRDBnS0dWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpQW1KaUJFVWtGSFIwbE9SeUE5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjRJRDBnYjNKcFoybHVMbmdnTFNCbGRtVnVkQzVqYkdsbGJuUllPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhrZ1BTQnZjbWxuYVc0dWVTQXRJR1YyWlc1MExtTnNhV1Z1ZEZrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSHQ0TENCNWZTQTlJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCemJtRndWRzlEYjI5eVpITWdQU0JpYjJGeVpDNXNZWGx2ZFhRdWMyNWhjRlJ2S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVTZJR1JwWlZWdVpHVnlRM1Z5YzI5eUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIZzZJSGdnTFNCa2VDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjVPaUI1SUMwZ1pIa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYm1WM1EyOXZjbVJ6SUQwZ2JuVnNiQ0FoUFNCemJtRndWRzlEYjI5eVpITWdQeUJ6Ym1Gd1ZHOURiMjl5WkhNZ09pQjdlQ3dnZVgwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpWVnVaR1Z5UTNWeWMyOXlMbU52YjNKa2FXNWhkR1Z6SUQwZ2JtVjNRMjl2Y21Sek8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnYzNSaGRHVmNiaUFnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1VtVm1jbVZ6YUNCaWIyRnlaRHNnVW1WdVpHVnlJR1JwWTJWY2JpQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21RcE8xeHVJQ0FnSUgwN1hHNWNibHh1SUNBZ0lDOHZJRkpsWjJsemRHVnlJSFJvWlNCaFkzUjFZV3dnWlhabGJuUWdiR2x6ZEdWdVpYSnpJR1JsWm1sdVpXUWdZV0p2ZG1VdUlFMWhjQ0IwYjNWamFDQmxkbVZ1ZEhNZ2RHOWNiaUFnSUNBdkx5QmxjWFZwZG1Gc1pXNTBJRzF2ZFhObElHVjJaVzUwY3k0Z1FtVmpZWFZ6WlNCMGFHVWdYQ0owYjNWamFHVnVaRndpSUdWMlpXNTBJR1J2WlhNZ2JtOTBJR2hoZG1VZ1lWeHVJQ0FnSUM4dklHTnNhV1Z1ZEZnZ1lXNWtJR05zYVdWdWRGa3NJSEpsWTI5eVpDQmhibVFnZFhObElIUm9aU0JzWVhOMElHOXVaWE1nWm5KdmJTQjBhR1VnWENKMGIzVmphRzF2ZG1WY0lseHVJQ0FnSUM4dklDaHZjaUJjSW5SdmRXTm9jM1JoY25SY0lpa2daWFpsYm5SekxseHVYRzRnSUNBZ2JHVjBJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXRG9nTUN3Z1kyeHBaVzUwV1RvZ01IMDdYRzRnSUNBZ1kyOXVjM1FnZEc5MVkyZ3liVzkxYzJWRmRtVnVkQ0E5SUNodGIzVnpaVVYyWlc1MFRtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0tIUnZkV05vUlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGIzVmphRVYyWlc1MElDWW1JREFnUENCMGIzVmphRVYyWlc1MExuUnZkV05vWlhNdWJHVnVaM1JvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZTJOc2FXVnVkRmdzSUdOc2FXVnVkRmw5SUQwZ2RHOTFZMmhGZG1WdWRDNTBiM1ZqYUdWeld6QmRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXWDA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnVFc5MWMyVkZkbVZ1ZENodGIzVnpaVVYyWlc1MFRtRnRaU3dnZEc5MVkyaERiMjl5WkdsdVlYUmxjeWtwTzF4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmRXTm9jM1JoY25SY0lpd2dkRzkxWTJneWJXOTFjMlZGZG1WdWRDaGNJbTF2ZFhObFpHOTNibHdpS1NrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXUnZkMjVjSWl3Z2MzUmhjblJKYm5SbGNtRmpkR2x2YmlrN1hHNWNiaUFnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaHRiM1psWENJc0lIUnZkV05vTW0xdmRYTmxSWFpsYm5Rb1hDSnRiM1Z6WlcxdmRtVmNJaWtwTzF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxiVzkyWlZ3aUxDQnRiM1psS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObElIeDhJQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnRiM1psWENJc0lITm9iM2RKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNWamFHVnVaRndpTENCMGIzVmphREp0YjNWelpVVjJaVzUwS0Z3aWJXOTFjMlYxY0Z3aUtTazdYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaWFZ3WENJc0lITjBiM0JKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXOTFkRndpTENCemRHOXdTVzUwWlhKaFkzUnBiMjRwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJVYjNCRWFXTmxRbTloY21SSVZFMU1SV3hsYldWdWRDQnBjeUJoSUdOMWMzUnZiU0JJVkUxTUlHVnNaVzFsYm5RZ2RHOGdjbVZ1WkdWeUlHRnVaQ0JqYjI1MGNtOXNJR0ZjYmlBcUlHUnBZMlVnWW05aGNtUXVJRnh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpOWNibU52Ym5OMElGUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZENCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjM1I1YkdVdVpHbHpjR3hoZVNBOUlGd2lhVzVzYVc1bExXSnNiMk5yWENJN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOb1lXUnZkeUE5SUhSb2FYTXVZWFIwWVdOb1UyaGhaRzkzS0h0dGIyUmxPaUJjSW1Oc2IzTmxaRndpZlNrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOaGJuWmhjeUE5SUdSdlkzVnRaVzUwTG1OeVpXRjBaVVZzWlcxbGJuUW9YQ0pqWVc1MllYTmNJaWs3WEc0Z0lDQWdJQ0FnSUhOb1lXUnZkeTVoY0hCbGJtUkRhR2xzWkNoallXNTJZWE1wTzF4dVhHNGdJQ0FnSUNBZ0lGOWpZVzUyWVhNdWMyVjBLSFJvYVhNc0lHTmhiblpoY3lrN1hHNGdJQ0FnSUNBZ0lGOWpkWEp5Wlc1MFVHeGhlV1Z5TG5ObGRDaDBhR2x6TENCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSXBPMXh1SUNBZ0lDQWdJQ0JmYkdGNWIzVjBMbk5sZENoMGFHbHpMQ0J1WlhjZ1IzSnBaRXhoZVc5MWRDaDdYRzRnSUNBZ0lDQWdJQ0FnSUNCM2FXUjBhRG9nZEdocGN5NTNhV1IwYUN4Y2JpQWdJQ0FnSUNBZ0lDQWdJR2hsYVdkb2REb2dkR2hwY3k1b1pXbG5hSFFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1ZUYVhwbE9pQjBhR2x6TG1ScFpWTnBlbVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthWE53WlhKemFXOXVPaUIwYUdsekxtUnBjM0JsY25OcGIyNWNiaUFnSUNBZ0lDQWdmU2twTzF4dUlDQWdJQ0FnSUNCelpYUjFjRWx1ZEdWeVlXTjBhVzl1S0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdWMGxFVkVoZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0VWSlIwaFVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCU1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlZ4dUlDQWdJQ0FnSUNCZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdGMGRISnBZblYwWlVOb1lXNW5aV1JEWVd4c1ltRmpheWh1WVcxbExDQnZiR1JXWVd4MVpTd2dibVYzVm1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMkZ1ZG1GeklEMGdYMk5oYm5aaGN5NW5aWFFvZEdocGN5azdYRzRnSUNBZ0lDQWdJSE4zYVhSamFDQW9ibUZ0WlNrZ2UxeHVJQ0FnSUNBZ0lDQmpZWE5sSUZkSlJGUklYMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2QybGtkR2dnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmVjBsRVZFZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVkMmxrZEdnZ1BTQjNhV1IwYUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oYm5aaGN5NXpaWFJCZEhSeWFXSjFkR1VvVjBsRVZFaGZRVlJVVWtsQ1ZWUkZMQ0IzYVdSMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRWhGU1VkSVZGOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdobGFXZG9kQ0E5SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5S0c1bGQxWmhiSFZsTENCd1lYSnpaVTUxYldKbGNpaHZiR1JXWVd4MVpTa2dmSHdnUkVWR1FWVk1WRjlJUlVsSFNGUXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVhR1ZwWjJoMElEMGdhR1ZwWjJoME8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk5sZEVGMGRISnBZblYwWlNoSVJVbEhTRlJmUVZSVVVrbENWVlJGTENCb1pXbG5hSFFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNWTlFSVkpUU1U5T1gwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsemNHVnljMmx2YmlBOUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtHNWxkMVpoYkhWbExDQndZWEp6WlU1MWJXSmxjaWh2YkdSV1lXeDFaU2tnZkh3Z1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXViR0Y1YjNWMExtUnBjM0JsY25OcGIyNGdQU0JrYVhOd1pYSnphVzl1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNVVmZVMGxhUlY5QlZGUlNTVUpWVkVVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1JwWlZOcGVtVWdQU0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxjaWh1WlhkV1lXeDFaU3dnY0dGeWMyVk9kVzFpWlhJb2IyeGtWbUZzZFdVcElIeDhJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVaR2xsVTJsNlpTQTlJR1JwWlZOcGVtVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVhOaFlteGxaRkp2ZEdGMGFXOXVJRDBnZG1Gc2FXUmhkR1V1WW05dmJHVmhiaWh1WlhkV1lXeDFaU3dnWjJWMFFtOXZiR1ZoYmlodmJHUldZV3gxWlN3Z1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzSUVSRlJrRlZURlJmVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJDa3BMblpoYkhWbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXNZWGx2ZFhRdWNtOTBZWFJsSUQwZ0lXUnBjMkZpYkdWa1VtOTBZWFJwYjI0N1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JrWldaaGRXeDBPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJVYUdVZ2RtRnNkV1VnYVhNZ1pHVjBaWEp0YVc1bFpDQjNhR1Z1SUhWemFXNW5JSFJvWlNCblpYUjBaWEpjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZjQzFrYVdVNllXUmtaV1JjSWl3Z0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFVtVmhaSGxFYVdObEtIUm9hWE1zSURFcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHbHpVbVZoWkhrb2RHaHBjeWtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaDBhR2x6TENCMGFHbHpMbXhoZVc5MWRDNXNZWGx2ZFhRb2RHaHBjeTVrYVdObEtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2Y0Mxa2FXVTZjbVZ0YjNabFpGd2lMQ0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaDBhR2x6TENCMGFHbHpMbXhoZVc5MWRDNXNZWGx2ZFhRb2RHaHBjeTVrYVdObEtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMWNHUmhkR1ZTWldGa2VVUnBZMlVvZEdocGN5d2dMVEVwTzF4dUlDQWdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdJQ0F2THlCQmJHd2daR2xqWlNCaWIyRnlaSE1nWkc4Z2FHRjJaU0JoSUhCc1lYbGxjaUJzYVhOMExpQkpaaUIwYUdWeVpTQnBjMjRuZENCdmJtVWdlV1YwTEZ4dUlDQWdJQ0FnSUNBdkx5QmpjbVZoZEdVZ2IyNWxMbHh1SUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0E5UFQwZ2RHaHBjeTV4ZFdWeWVWTmxiR1ZqZEc5eUtGd2lkRzl3TFhCc1lYbGxjaTFzYVhOMFhDSXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1Gd2NHVnVaRU5vYVd4a0tHUnZZM1Z0Wlc1MExtTnlaV0YwWlVWc1pXMWxiblFvWENKMGIzQXRjR3hoZVdWeUxXeHBjM1JjSWlrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZV1J2Y0hSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCSGNtbGtUR0Y1YjNWMElIVnpaV1FnWW5rZ2RHaHBjeUJFYVdObFFtOWhjbVFnZEc4Z2JHRjViM1YwSUhSb1pTQmthV05sTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMjF2WkhWc1pUcEhjbWxrVEdGNWIzVjBma2R5YVdSTVlYbHZkWFI5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUd4aGVXOTFkQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5c1lYbHZkWFF1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUXVJRTV2ZEdVc0lIUnZJR0ZqZEhWaGJHeDVJSFJvY205M0lIUm9aU0JrYVdObElIVnpaVnh1SUNBZ0lDQXFJSHRBYkdsdWF5QjBhSEp2ZDBScFkyVjlMaUJjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdHRiMlIxYkdVNlZHOXdSR2xsU0ZSTlRFVnNaVzFsYm5SK1ZHOXdSR2xsU0ZSTlRFVnNaVzFsYm5SYlhYMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGc3VMaTUwYUdsekxtZGxkRVZzWlcxbGJuUnpRbmxVWVdkT1lXMWxLRndpZEc5d0xXUnBaVndpS1YwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRzFoZUdsdGRXMGdiblZ0WW1WeUlHOW1JR1JwWTJVZ2RHaGhkQ0JqWVc0Z1ltVWdjSFYwSUc5dUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOUlGUm9aU0J0WVhocGJYVnRJRzUxYldKbGNpQnZaaUJrYVdObExDQXdJRHdnYldGNGFXMTFiUzVjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YkdGNWIzVjBMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlU3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIZHBaSFJvSUc5bUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCM2FXUjBhQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRmRKUkZSSVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOVhTVVJVU0NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR2hsYVdkb2RDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR2hsYVdkb2RDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxLSFJvYVhNc0lFaEZTVWRJVkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlNFVkpSMGhVS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdaR2x6Y0dWeWMybHZiaUJzWlhabGJDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR1JwYzNCbGNuTnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYzJsNlpTQnZaaUJrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthV1ZUYVhwbEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwUkpSVjlUU1ZwRktUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRZVzRnWkdsalpTQnZiaUIwYUdseklHSnZZWEprSUdKbElHUnlZV2RuWldRL1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBKdmIyeGxZVzU5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU2gwYUdsekxDQkVVa0ZIUjBsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5RVVrRkhSMGxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVc0Z1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0lHSmxJR2hsYkdRZ1lua2dZU0JRYkdGNVpYSS9YRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwSnZiMnhsWVc1OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSQ2IyOXNaV0Z1UVhSMGNtbGlkWFJsS0hSb2FYTXNJRWhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlNFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJKY3lCeWIzUmhkR2x1WnlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RZ1pHbHpZV0pzWldRL1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBKdmIyeGxZVzU5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMyRmliR1ZrVW05MFlYUnBibWRFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwUW05dmJHVmhia0YwZEhKcFluVjBaU2gwYUdsekxDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1pIVnlZWFJwYjI0Z2FXNGdiWE1nZEc4Z2NISmxjM01nZEdobElHMXZkWE5sSUM4Z2RHOTFZMmdnWVNCa2FXVWdZbVZtYjNKbElHbDBJR0psYTI5dFpYTmNiaUFnSUNBZ0tpQm9aV3hrSUdKNUlIUm9aU0JRYkdGNVpYSXVJRWwwSUdoaGN5QnZibXg1SUdGdUlHVm1abVZqZENCM2FHVnVJSFJvYVhNdWFHOXNaR0ZpYkdWRWFXTmxJRDA5UFZ4dUlDQWdJQ0FxSUhSeWRXVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb2IyeGtSSFZ5WVhScGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU2gwYUdsekxDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5SVQweEVYMFJWVWtGVVNVOU9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5Y3lCd2JHRjVhVzVuSUc5dUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN2JXOWtkV3hsT2xSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MGZsUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBXMTE5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhCc1lYbGxjbk1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbkYxWlhKNVUyVnNaV04wYjNJb1hDSjBiM0F0Y0d4aGVXVnlMV3hwYzNSY0lpa3VjR3hoZVdWeWN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkJjeUJ3YkdGNVpYSXNJSFJvY205M0lIUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMjF2WkhWc1pUcFViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkSDVVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEgwZ1czQnNZWGxsY2lBOUlFUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVbDBnTFNCVWFHVmNiaUFnSUNBZ0tpQndiR0Y1WlhJZ2RHaGhkQ0JwY3lCMGFISnZkMmx1WnlCMGFHVWdaR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdiVzlrZFd4bE9sUnZjRVJwWlVoVVRVeEZiR1Z0Wlc1MGZsUnZjRVJwWlVoVVRVeEZiR1Z0Wlc1MFcxMTlJRlJvWlNCMGFISnZkMjRnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGlCVWFHbHpJR3hwYzNRZ2IyWWdaR2xqWlNCcGN5QjBhR1VnYzJGdFpTQmhjeUIwYUdseklGUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwSjNNZ2UwQnpaV1VnWkdsalpYMGdjSEp2Y0dWeWRIbGNiaUFnSUNBZ0tpOWNiaUFnSUNCMGFISnZkMFJwWTJVb2NHeGhlV1Z5SUQwZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHdiR0Y1WlhJZ0ppWWdJWEJzWVhsbGNpNW9ZWE5VZFhKdUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2JHRjVaWEl1YzNSaGNuUlVkWEp1S0NrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdkR2hwY3k1a2FXTmxMbVp2Y2tWaFkyZ29aR2xsSUQwK0lHUnBaUzUwYUhKdmQwbDBLQ2twTzF4dUlDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaDBhR2x6TENCMGFHbHpMbXhoZVc5MWRDNXNZWGx2ZFhRb2RHaHBjeTVrYVdObEtTazdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1ScFkyVTdYRzRnSUNBZ2ZWeHVmVHRjYmx4dWQybHVaRzkzTG1OMWMzUnZiVVZzWlcxbGJuUnpMbVJsWm1sdVpTaGNJblJ2Y0Mxa2FXTmxMV0p2WVhKa1hDSXNJRlJ2Y0VScFkyVkNiMkZ5WkVoVVRVeEZiR1Z0Wlc1MEtUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlViM0JFYVdObFFtOWhjbVJJVkUxTVJXeGxiV1Z1ZEN4Y2JpQWdJQ0JFUlVaQlZVeFVYMFJKUlY5VFNWcEZMRnh1SUNBZ0lFUkZSa0ZWVEZSZlNFOU1SRjlFVlZKQlZFbFBUaXhjYmlBZ0lDQkVSVVpCVlV4VVgxZEpSRlJJTEZ4dUlDQWdJRVJGUmtGVlRGUmZTRVZKUjBoVUxGeHVJQ0FnSUVSRlJrRlZURlJmUkVsVFVFVlNVMGxQVGl4Y2JpQWdJQ0JFUlVaQlZVeFVYMUpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0N3Z01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dVhHNHZMMmx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZTQm1jbTl0SUZ3aUxpOXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTmNJanRjYm1sdGNHOXlkQ0I3ZG1Gc2FXUmhkR1Y5SUdaeWIyMGdYQ0l1TDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1welhDSTdYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaVnh1SUNvdlhHNWpiMjV6ZENCRFNWSkRURVZmUkVWSFVrVkZVeUE5SURNMk1Ec2dMeThnWkdWbmNtVmxjMXh1WTI5dWMzUWdUbFZOUWtWU1gwOUdYMUJKVUZNZ1BTQTJPeUF2THlCRVpXWmhkV3gwSUM4Z2NtVm5kV3hoY2lCemFYZ2djMmxrWldRZ1pHbGxJR2hoY3lBMklIQnBjSE1nYldGNGFXMTFiUzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZRMDlNVDFJZ1BTQmNJa2wyYjNKNVhDSTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxZ2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVpJRDBnTURzZ0x5OGdjSGhjYm1OdmJuTjBJRVJGUmtGVlRGUmZVazlVUVZSSlQwNGdQU0F3T3lBdkx5QmtaV2R5WldWelhHNWpiMjV6ZENCRVJVWkJWVXhVWDA5UVFVTkpWRmtnUFNBd0xqVTdYRzVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRWhGVEVSZlFsbGZRVlJVVWtsQ1ZWUkZJRDBnWENKb1pXeGtMV0o1WENJN1hHNWpiMjV6ZENCUVNWQlRYMEZVVkZKSlFsVlVSU0E5SUZ3aWNHbHdjMXdpTzF4dVkyOXVjM1FnVWs5VVFWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSnliM1JoZEdsdmJsd2lPMXh1WTI5dWMzUWdXRjlCVkZSU1NVSlZWRVVnUFNCY0luaGNJanRjYm1OdmJuTjBJRmxmUVZSVVVrbENWVlJGSUQwZ1hDSjVYQ0k3WEc1Y2JtTnZibk4wSUVKQlUwVmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUE5SURFMU95QXZMeUJ3ZUZ4dVkyOXVjM1FnUWtGVFJWOVRWRkpQUzBWZlYwbEVWRWdnUFNBeUxqVTdJQzh2SUhCNFhHNWpiMjV6ZENCTlNVNWZVMVJTVDB0RlgxZEpSRlJJSUQwZ01Uc2dMeThnY0hoY2JtTnZibk4wSUVoQlRFWWdQU0JDUVZORlgwUkpSVjlUU1ZwRklDOGdNanNnTHk4Z2NIaGNibU52Ym5OMElGUklTVkpFSUQwZ1FrRlRSVjlFU1VWZlUwbGFSU0F2SURNN0lDOHZJSEI0WEc1amIyNXpkQ0JRU1ZCZlUwbGFSU0E5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF4TlRzZ0x5OXdlRnh1WTI5dWMzUWdVRWxRWDBOUFRFOVNJRDBnWENKaWJHRmphMXdpTzF4dVhHNWpiMjV6ZENCa1pXY3ljbUZrSUQwZ0tHUmxaeWtnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUJrWldjZ0tpQW9UV0YwYUM1UVNTQXZJREU0TUNrN1hHNTlPMXh1WEc1amIyNXpkQ0JwYzFCcGNFNTFiV0psY2lBOUlHNGdQVDRnZTF4dUlDQWdJR052Ym5OMElHNTFiV0psY2lBOUlIQmhjbk5sU1c1MEtHNHNJREV3S1R0Y2JpQWdJQ0J5WlhSMWNtNGdUblZ0WW1WeUxtbHpTVzUwWldkbGNpaHVkVzFpWlhJcElDWW1JREVnUEQwZ2JuVnRZbVZ5SUNZbUlHNTFiV0psY2lBOFBTQk9WVTFDUlZKZlQwWmZVRWxRVXp0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUjJWdVpYSmhkR1VnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzltSUhCcGNITWdZbVYwZDJWbGJpQXhJR0Z1WkNCMGFHVWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UwNTFiV0psY24wZ1FTQnlZVzVrYjIwZ2JuVnRZbVZ5SUc0c0lERWc0b21rSUc0ZzRvbWtJRTVWVFVKRlVsOVBSbDlRU1ZCVExseHVJQ292WEc1amIyNXpkQ0J5WVc1a2IyMVFhWEJ6SUQwZ0tDa2dQVDRnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nVGxWTlFrVlNYMDlHWDFCSlVGTXBJQ3NnTVR0Y2JseHVZMjl1YzNRZ1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVeUE5SUZ0Y0l1S2FnRndpTEZ3aTRwcUJYQ0lzWENMaW1vSmNJaXhjSXVLYWcxd2lMRndpNHBxRVhDSXNYQ0xpbW9WY0lsMDdYRzVjYmk4cUtseHVJQ29nUTI5dWRtVnlkQ0JoSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR1JwWlNCbVlXTmxJSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3Y3lCdlpseHVJQ29nZEdoaGRDQnpZVzFsSUdScFpTNGdWR2hwY3lCbWRXNWpkR2x2YmlCcGN5QjBhR1VnY21WMlpYSnpaU0J2WmlCd2FYQnpWRzlWYm1samIyUmxMbHh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQjFJQzBnVkdobElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlIUnZJR052Ym5abGNuUWdkRzhnY0dsd2N5NWNiaUFxSUVCeVpYUjFjbTV6SUh0T2RXMWlaWEo4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaXdnYjNKY2JpQXFJSFZ1WkdWbWFXNWxaQ0JwWmlCMUlIZGhjeUJ1YjNRZ1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpQnlaWEJ5WlhObGJuUnBibWNnWVNCa2FXVXVYRzRnS2k5Y2JtTnZibk4wSUhWdWFXTnZaR1ZVYjFCcGNITWdQU0FvZFNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUdScFpVTm9ZWEpKYm1SbGVDQTlJRVJKUlY5VlRrbERUMFJGWDBOSVFWSkJRMVJGVWxNdWFXNWtaWGhQWmloMUtUdGNiaUFnSUNCeVpYUjFjbTRnTUNBOFBTQmthV1ZEYUdGeVNXNWtaWGdnUHlCa2FXVkRhR0Z5U1c1a1pYZ2dLeUF4SURvZ2RXNWtaV1pwYm1Wa08xeHVmVHRjYmx4dUx5b3FYRzRnS2lCRGIyNTJaWEowSUdFZ2JuVnRZbVZ5SUc5bUlIQnBjSE1zSURFZzRvbWtJSEJwY0hNZzRvbWtJRFlnZEc4Z1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNseHVJQ29nY21Wd2NtVnpaVzUwWVhScGIyNGdiMllnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnWkdsbElHWmhZMlV1SUZSb2FYTWdablZ1WTNScGIyNGdhWE1nZEdobElISmxkbVZ5YzJWY2JpQXFJRzltSUhWdWFXTnZaR1ZVYjFCcGNITXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlIQWdMU0JVYUdVZ2JuVnRZbVZ5SUc5bUlIQnBjSE1nZEc4Z1kyOXVkbVZ5ZENCMGJ5QmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlMbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UxTjBjbWx1WjN4MWJtUmxabWx1WldSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIVnVhV052WkdVZ1kyaGhjbUZqZEdWeWN5QnZjbHh1SUNvZ2RXNWtaV1pwYm1Wa0lHbG1JSEFnZDJGeklHNXZkQ0JpWlhSM1pXVnVJREVnWVc1a0lEWWdhVzVqYkhWemFYWmxMbHh1SUNvdlhHNWpiMjV6ZENCd2FYQnpWRzlWYm1samIyUmxJRDBnY0NBOVBpQnBjMUJwY0U1MWJXSmxjaWh3S1NBL0lFUkpSVjlWVGtsRFQwUkZYME5JUVZKQlExUkZVbE5iY0NBdElERmRJRG9nZFc1a1pXWnBibVZrTzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpJYjJ4a0lEMGdLR052Ym5SbGVIUXNJSGdzSUhrc0lIZHBaSFJvTENCamIyeHZjaWtnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRk5GVUVWU1FWUlBVaUE5SUhkcFpIUm9JQzhnTXpBN1hHNGdJQ0FnWTI5dWRHVjRkQzV6WVhabEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bmJHOWlZV3hCYkhCb1lTQTlJRVJGUmtGVlRGUmZUMUJCUTBsVVdUdGNiaUFnSUNCamIyNTBaWGgwTG1KbFoybHVVR0YwYUNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Wm1sc2JGTjBlV3hsSUQwZ1kyOXNiM0k3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vZUNBcklIZHBaSFJvTENCNUlDc2dkMmxrZEdnc0lIZHBaSFJvSUMwZ1UwVlFSVkpCVkU5U0xDQXdMQ0F5SUNvZ1RXRjBhQzVRU1N3Z1ptRnNjMlVwTzF4dUlDQWdJR052Ym5SbGVIUXVabWxzYkNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Y21WemRHOXlaU2dwTzF4dWZUdGNibHh1WTI5dWMzUWdjbVZ1WkdWeVJHbGxJRDBnS0dOdmJuUmxlSFFzSUhnc0lIa3NJSGRwWkhSb0xDQmpiMnh2Y2lrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUZORFFVeEZJRDBnS0hkcFpIUm9JQzhnU0VGTVJpazdYRzRnSUNBZ1kyOXVjM1FnU0VGTVJsOUpUazVGVWw5VFNWcEZJRDBnVFdGMGFDNXpjWEowS0hkcFpIUm9JQ29xSURJZ0x5QXlLVHRjYmlBZ0lDQmpiMjV6ZENCSlRrNUZVbDlUU1ZwRklEMGdNaUFxSUVoQlRFWmZTVTVPUlZKZlUwbGFSVHRjYmlBZ0lDQmpiMjV6ZENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdQU0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUFxSUZORFFVeEZPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBOUlFbE9Ua1ZTWDFOSldrVWdMU0F5SUNvZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRPMXh1SUNBZ0lHTnZibk4wSUZOVVVrOUxSVjlYU1VSVVNDQTlJRTFoZEdndWJXRjRLRTFKVGw5VFZGSlBTMFZmVjBsRVZFZ3NJRUpCVTBWZlUxUlNUMHRGWDFkSlJGUklJQ29nVTBOQlRFVXBPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJZSUQwZ2VDQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTzF4dUlDQWdJR052Ym5OMElITjBZWEowV1NBOUlIa2dLeUIzYVdSMGFDQXRJRWhCVEVaZlNVNU9SVkpmVTBsYVJUdGNibHh1SUNBZ0lHTnZiblJsZUhRdWMyRjJaU2dwTzF4dUlDQWdJR052Ym5SbGVIUXVZbVZuYVc1UVlYUm9LQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzVTNSNWJHVWdQU0JqYjJ4dmNqdGNiaUFnSUNCamIyNTBaWGgwTG5OMGNtOXJaVk4wZVd4bElEMGdYQ0ppYkdGamExd2lPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVmRwWkhSb0lEMGdVMVJTVDB0RlgxZEpSRlJJTzF4dUlDQWdJR052Ym5SbGVIUXViVzkyWlZSdktITjBZWEowV0N3Z2MzUmhjblJaS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUlDc2dTVTVPUlZKZlUwbGFSVjlTVDFWT1JFVkVMQ0J6ZEdGeWRGa2dLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnWkdWbk1uSmhaQ2d5TnpBcExDQmtaV2N5Y21Ga0tEQXBLVHRjYmlBZ0lDQmpiMjUwWlhoMExteHBibVZVYnloemRHRnlkRmdnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeWs3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFTENCemRHRnlkRmtnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3dLU3dnWkdWbk1uSmhaQ2c1TUNrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1YkdsdVpWUnZLSE4wWVhKMFdDd2djM1JoY25SWklDc2dTVTVPUlZKZlUwbGFSU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1pHVm5NbkpoWkNnNU1Da3NJR1JsWnpKeVlXUW9NVGd3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUlDMGdVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCemRHRnlkRmtnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDd2djM1JoY25SWklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJR1JsWnpKeVlXUW9NVGd3S1N3Z1pHVm5NbkpoWkNneU56QXBLVHRjYmx4dUlDQWdJR052Ym5SbGVIUXVjM1J5YjJ0bEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpRYVhBZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dwSUQwK0lIdGNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtSmxaMmx1VUdGMGFDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiRk4wZVd4bElEMGdVRWxRWDBOUFRFOVNPMXh1SUNBZ0lHTnZiblJsZUhRdWJXOTJaVlJ2S0hnc0lIa3BPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSGdzSUhrc0lIZHBaSFJvTENBd0xDQXlJQ29nVFdGMGFDNVFTU3dnWm1Gc2MyVXBPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiQ2dwTzF4dUlDQWdJR052Ym5SbGVIUXVjbVZ6ZEc5eVpTZ3BPMXh1ZlR0Y2JseHVYRzR2THlCUWNtbDJZWFJsSUhCeWIzQmxjblJwWlhOY2JtTnZibk4wSUY5aWIyRnlaQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJobGJHUkNlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjR2x3Y3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmY205MFlYUnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2dnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2tnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc0dktpcGNiaUFxSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwSUdseklIUm9aU0JjSW5SdmNDMWthV1ZjSWlCamRYTjBiMjBnVzBoVVRVeGNiaUFxSUdWc1pXMWxiblJkS0doMGRIQnpPaTh2WkdWMlpXeHZjR1Z5TG0xdmVtbHNiR0V1YjNKbkwyVnVMVlZUTDJSdlkzTXZWMlZpTDBGUVNTOUlWRTFNUld4bGJXVnVkQ2tnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsWEc0Z0tpQnZiaUIwYUdVZ1pHbGpaU0JpYjJGeVpDNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvZ1FHMXBlR1Z6SUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JtTnZibk4wSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE1vU0ZSTlRFVnNaVzFsYm5RcElIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2loN2NHbHdjeXdnWTI5c2IzSXNJSEp2ZEdGMGFXOXVMQ0I0TENCNUxDQm9aV3hrUW5sOUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvS1R0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCd2FYQnpWbUZzZFdVZ1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtIQnBjSE1nZkh3Z2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1VFbFFVMTlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbUpsZEhkbFpXNG9NU3dnTmlsY2JpQWdJQ0FnSUNBZ0lDQWdJQzVrWldaaGRXeDBWRzhvY21GdVpHOXRVR2x3Y3lncEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUY5d2FYQnpMbk5sZENoMGFHbHpMQ0J3YVhCelZtRnNkV1VwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoUVNWQlRYMEZVVkZKSlFsVlVSU3dnY0dsd2MxWmhiSFZsS1R0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG1OdmJHOXlJRDBnZG1Gc2FXUmhkR1V1WTI5c2IzSW9ZMjlzYjNJZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9RMDlNVDFKZlFWUlVVa2xDVlZSRktTbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1JFVkdRVlZNVkY5RFQweFBVaWxjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG5KdmRHRjBhVzl1SUQwZ2RtRnNhV1JoZEdVdWFXNTBaV2RsY2loeWIzUmhkR2x2YmlCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFNUMVJCVkVsUFRsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtSmxkSGRsWlc0b01Dd2dNell3S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhFUlVaQlZVeFVYMUpQVkVGVVNVOU9LVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dVhHNGdJQ0FnSUNBZ0lIUm9hWE11ZUNBOUlIWmhiR2xrWVhSbExtbHVkR1ZuWlhJb2VDQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hZWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1YkdGeVoyVnlWR2hoYmlnd0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnloRVJVWkJWVXhVWDFncFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NTVJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWg1SUh4OElIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGbGZRVlJVVWtsQ1ZWUkZLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLRVJGUmtGVlRGUmZXU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG1obGJHUkNlU0E5SUhaaGJHbGtZWFJsTG5OMGNtbHVaeWhvWld4a1Fua2dmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbTV2ZEVWdGNIUjVLQ2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNWtaV1poZFd4MFZHOG9iblZzYkNsY2JpQWdJQ0FnSUNBZ0lDQWdJQzUyWVd4MVpUdGNiaUFnSUNCOVhHNWNiaUFnSUNCemRHRjBhV01nWjJWMElHOWljMlZ5ZG1Wa1FYUjBjbWxpZFhSbGN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRnRjYmlBZ0lDQWdJQ0FnSUNBZ0lFTlBURTlTWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhGVEVSZlFsbGZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1VFbFFVMTlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQlNUMVJCVkVsUFRsOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCWVgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZsZlFWUlVVa2xDVlZSRlhHNGdJQ0FnSUNBZ0lGMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ0lDQWdJRjlpYjJGeVpDNXpaWFFvZEdocGN5d2dkR2hwY3k1d1lYSmxiblJPYjJSbEtUdGNiaUFnSUNBZ0lDQWdYMkp2WVhKa0xtZGxkQ2gwYUdsektTNWthWE53WVhSamFFVjJaVzUwS0c1bGR5QkZkbVZ1ZENoY0luUnZjQzFrYVdVNllXUmtaV1JjSWlrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdScGMyTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lDQWdJQ0JmWW05aGNtUXVaMlYwS0hSb2FYTXBMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRVYyWlc1MEtGd2lkRzl3TFdScFpUcHlaVzF2ZG1Wa1hDSXBLVHRjYmlBZ0lDQWdJQ0FnWDJKdllYSmtMbk5sZENoMGFHbHpMQ0J1ZFd4c0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElIUm9hWE1nUkdsbElIUnZJSFJvWlNCamIzSnlaWE53YjI1a2FXNW5JSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlJRzltSUdFZ1pHbGxJR1poWTJVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VGRISnBibWQ5SUZSb1pTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpQmpiM0p5WlhOd2IyNWthVzVuSUhSdklIUm9aU0J1ZFcxaVpYSWdiMlpjYmlBZ0lDQWdLaUJ3YVhCeklHOW1JSFJvYVhNZ1JHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lIUnZWVzVwWTI5a1pTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSEJwY0hOVWIxVnVhV052WkdVb2RHaHBjeTV3YVhCektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnpkSEpwYm1jZ2NtVndjbVZ6Wlc1aGRHbHZiaUJtYjNJZ2RHaHBjeUJrYVdVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VGRISnBibWQ5SUZSb1pTQjFibWxqYjJSbElITjViV0p2YkNCamIzSnlaWE53YjI1a2FXNW5JSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3YzF4dUlDQWdJQ0FxSUc5bUlIUm9hWE1nWkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhSdlUzUnlhVzVuS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTUwYjFWdWFXTnZaR1VvS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJRVJwWlNkeklHNTFiV0psY2lCdlppQndhWEJ6TENBeElPS0pwQ0J3YVhCeklPS0pwQ0EyTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdjR2x3Y3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXdhWEJ6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJRVJwWlNkeklHTnZiRzl5TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMU4wY21sdVozMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdZMjlzYjNJb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZZMjlzYjNJdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ1kyOXNiM0lvYm1WM1EyOXNiM0lwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDBOdmJHOXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gyTnZiRzl5TG5ObGRDaDBhR2x6TENCRVJVWkJWVXhVWDBOUFRFOVNLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOWpiMnh2Y2k1elpYUW9kR2hwY3l3Z2JtVjNRMjlzYjNJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMQ0J1WlhkRGIyeHZjaWs3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JRYkdGNVpYSWdkR2hoZENCcGN5Qm9iMnhrYVc1bklIUm9hWE1nUkdsbExDQnBaaUJoYm5rdUlFNTFiR3dnYjNSb1pYSjNhWE5sTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMUJzWVhsbGNueHVkV3hzZlNCY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2FHVnNaRUo1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyaGxiR1JDZVM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCb1pXeGtRbmtvY0d4aGVXVnlLU0I3WEc0Z0lDQWdJQ0FnSUY5b1pXeGtRbmt1YzJWMEtIUm9hWE1zSUhCc1lYbGxjaWs3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUQwOVBTQndiR0Y1WlhJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtGd2lhR1ZzWkMxaWVWd2lLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2lhR1ZzWkMxaWVWd2lMQ0J3YkdGNVpYSXVkRzlUZEhKcGJtY29LU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdZMjl2Y21ScGJtRjBaWE1nYjJZZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3UTI5dmNtUnBibUYwWlhOOGJuVnNiSDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWTI5dmNtUnBibUYwWlhNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzSUQwOVBTQjBhR2x6TG5nZ2ZId2diblZzYkNBOVBUMGdkR2hwY3k1NUlEOGdiblZzYkNBNklIdDRPaUIwYUdsekxuZ3NJSGs2SUhSb2FYTXVlWDA3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0JqYjI5eVpHbHVZWFJsY3loaktTQjdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJRDA5UFNCaktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbmdnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTU1SUQwZ2JuVnNiRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZTNnc0lIbDlJRDBnWXp0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWVDQTlJSGc3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5rZ1BTQjVPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QjBhR2x6SUVScFpTQm9ZWFpsSUdOdmIzSmthVzVoZEdWelAxeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1FtOXZiR1ZoYm4wZ1ZISjFaU0IzYUdWdUlIUm9aU0JFYVdVZ1pHOWxjeUJvWVhabElHTnZiM0prYVc1aGRHVnpYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2FHRnpRMjl2Y21ScGJtRjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNJQ0U5UFNCMGFHbHpMbU52YjNKa2FXNWhkR1Z6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQjRJR052YjNKa2FXNWhkR1ZjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElIZ29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmZUM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCNEtHNWxkMWdwSUh0Y2JpQWdJQ0FnSUNBZ1gzZ3VjMlYwS0hSb2FYTXNJRzVsZDFncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaGNJbmhjSWl3Z2JtVjNXQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIa2dZMjl2Y21ScGJtRjBaVnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2VTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjk1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUhrb2JtVjNXU2tnZTF4dUlDQWdJQ0FnSUNCZmVTNXpaWFFvZEdocGN5d2dibVYzV1NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2llVndpTENCdVpYZFpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NtOTBZWFJwYjI0Z2IyWWdkR2hwY3lCRWFXVXVJREFnNG9ta0lISnZkR0YwYVc5dUlPS0pwQ0F6TmpBdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmRzUxYkd4OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElISnZkR0YwYVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM0p2ZEdGMGFXOXVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJSEp2ZEdGMGFXOXVLRzVsZDFJcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUc1bGQxSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRndpY205MFlYUnBiMjVjSWlrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnViM0p0WVd4cGVtVmtVbTkwWVhScGIyNGdQU0J1WlhkU0lDVWdRMGxTUTB4RlgwUkZSMUpGUlZNN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmY205MFlYUnBiMjR1YzJWMEtIUm9hWE1zSUc1dmNtMWhiR2w2WldSU2IzUmhkR2x2YmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hjSW5KdmRHRjBhVzl1WENJc0lHNXZjbTFoYkdsNlpXUlNiM1JoZEdsdmJpazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUhKdmR5QjBhR2x6SUVScFpTNGdWR2hsSUc1MWJXSmxjaUJ2WmlCd2FYQnpJSFJ2SUdFZ2NtRnVaRzl0SUc1MWJXSmxjaUJ1TENBeElPS0pwQ0J1SU9LSnBDQTJMbHh1SUNBZ0lDQXFJRTl1YkhrZ1pHbGpaU0IwYUdGMElHRnlaU0J1YjNRZ1ltVnBibWNnYUdWc1pDQmpZVzRnWW1VZ2RHaHliM2R1TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUdacGNtVnpJRndpZEc5d09uUm9jbTkzTFdScFpWd2lJSGRwZEdnZ2NHRnlZVzFsZEdWeWN5QjBhR2x6SUVScFpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCMGFISnZkMGwwS0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvSVhSb2FYTXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOXdhWEJ6TG5ObGRDaDBhR2x6TENCeVlXNWtiMjFRYVhCektDa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1VFbFFVMTlCVkZSU1NVSlZWRVVzSUhSb2FYTXVjR2x3Y3lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFVjJaVzUwS0Z3aWRHOXdPblJvY205M0xXUnBaVndpTENCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHVjBZV2xzT2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JwWlRvZ2RHaHBjMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQndiR0Y1WlhJZ2FHOXNaSE1nZEdocGN5QkVhV1V1SUVFZ2NHeGhlV1Z5SUdOaGJpQnZibXg1SUdodmJHUWdZU0JrYVdVZ2RHaGhkQ0JwY3lCdWIzUmNiaUFnSUNBZ0tpQmlaV2x1WnlCb1pXeGtJR0o1SUdGdWIzUm9aWElnY0d4aGVXVnlJSGxsZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Ylc5a2RXeGxPbEJzWVhsbGNuNVFiR0Y1WlhKOUlIQnNZWGxsY2lBdElGUm9aU0J3YkdGNVpYSWdkMmh2SUhkaGJuUnpJSFJ2SUdodmJHUWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb2dRR1pwY21WeklGd2lkRzl3T21odmJHUXRaR2xsWENJZ2QybDBhQ0J3WVhKaGJXVjBaWEp6SUhSb2FYTWdSR2xsSUdGdVpDQjBhR1VnY0d4aGVXVnlMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHaHZiR1JKZENod2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLQ0YwYUdsekxtbHpTR1ZzWkNncEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbWhsYkdSQ2VTQTlJSEJzWVhsbGNqdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dSWFpsYm5Rb1hDSjBiM0E2YUc5c1pDMWthV1ZjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklIUm9hWE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnNZWGxsY2x4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFbHpJSFJvYVhNZ1JHbGxJR0psYVc1bklHaGxiR1FnWW5rZ1lXNTVJSEJzWVhsbGNqOWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwSnZiMnhsWVc1OUlGUnlkV1VnZDJobGJpQjBhR2x6SUVScFpTQnBjeUJpWldsdVp5Qm9aV3hrSUdKNUlHRnVlU0J3YkdGNVpYSXNJR1poYkhObElHOTBhR1Z5ZDJselpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCcGMwaGxiR1FvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNJQ0U5UFNCMGFHbHpMbWhsYkdSQ2VUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnY0d4aGVXVnlJSEpsYkdWaGMyVnpJSFJvYVhNZ1JHbGxMaUJCSUhCc1lYbGxjaUJqWVc0Z2IyNXNlU0J5Wld4bFlYTmxJR1JwWTJVZ2RHaGhkQ0J6YUdVZ2FYTmNiaUFnSUNBZ0tpQm9iMnhrYVc1bkxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0dGIyUjFiR1U2VUd4aGVXVnlmbEJzWVhsbGNuMGdjR3hoZVdWeUlDMGdWR2hsSUhCc1lYbGxjaUIzYUc4Z2QyRnVkSE1nZEc4Z2NtVnNaV0Z6WlNCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2lCQVptbHlaWE1nWENKMGIzQTZjbVZzWVhObExXUnBaVndpSUhkcGRHZ2djR0Z5WVcxbGRHVnljeUIwYUdseklFUnBaU0JoYm1RZ2RHaGxJSEJzWVhsbGNpQnlaV3hsWVhOcGJtY2dhWFF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdjbVZzWldGelpVbDBLSEJzWVhsbGNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTVwYzBobGJHUW9LU0FtSmlCMGFHbHpMbWhsYkdSQ2VTNWxjWFZoYkhNb2NHeGhlV1Z5S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NW9aV3hrUW5rZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1a2FYTndZWFJqYUVWMlpXNTBLRzVsZHlCRGRYTjBiMjFGZG1WdWRDaGNJblJ2Y0RweVpXeGxZWE5sTFdScFpWd2lMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdWMFlXbHNPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBaVG9nZEdocGN5eGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0d4aGVXVnlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVW1WdVpHVnlJSFJvYVhNZ1JHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdERZVzUyWVhOU1pXNWtaWEpwYm1kRGIyNTBaWGgwTWtSOUlHTnZiblJsZUhRZ0xTQlVhR1VnWTJGdWRtRnpJR052Ym5SbGVIUWdkRzhnWkhKaGQxeHVJQ0FnSUNBcUlHOXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHUnBaVk5wZW1VZ0xTQlVhR1VnYzJsNlpTQnZaaUJoSUdScFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ1cyTnZiM0prYVc1aGRHVnpJRDBnZEdocGN5NWpiMjl5WkdsdVlYUmxjMTBnTFNCVWFHVWdZMjl2Y21ScGJtRjBaWE1nZEc5Y2JpQWdJQ0FnS2lCa2NtRjNJSFJvYVhNZ1pHbGxMaUJDZVNCa1pXWmhkV3gwTENCMGFHbHpJR1JwWlNCcGN5QmtjbUYzYmlCaGRDQnBkSE1nYjNkdUlHTnZiM0prYVc1aGRHVnpMRnh1SUNBZ0lDQXFJR0oxZENCNWIzVWdZMkZ1SUdGc2MyOGdaSEpoZHlCcGRDQmxiSE5sZDJobGNtVWdhV1lnYzI4Z2JtVmxaR1ZrTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSEpsYm1SbGNpaGpiMjUwWlhoMExDQmthV1ZUYVhwbExDQmpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYzJOaGJHVWdQU0JrYVdWVGFYcGxJQzhnUWtGVFJWOUVTVVZmVTBsYVJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1UwaEJURVlnUFNCSVFVeEdJQ29nYzJOaGJHVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTlVTRWxTUkNBOUlGUklTVkpFSUNvZ2MyTmhiR1U3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRk5RU1ZCZlUwbGFSU0E5SUZCSlVGOVRTVnBGSUNvZ2MyTmhiR1U3WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZTNnc0lIbDlJRDBnWTI5dmNtUnBibUYwWlhNN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSb2FYTXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2todmJHUW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z1UwaEJURVlzSUhSb2FYTXVhR1ZzWkVKNUxtTnZiRzl5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNnd0lDRTlQU0IwYUdsekxuSnZkR0YwYVc5dUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5SeVlXNXpiR0YwWlNoNElDc2dVMGhCVEVZc0lIa2dLeUJUU0VGTVJpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5KdmRHRjBaU2hrWldjeWNtRmtLSFJvYVhNdWNtOTBZWFJwYjI0cEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1ZEhKaGJuTnNZWFJsS0MweElDb2dLSGdnS3lCVFNFRk1SaWtzSUMweElDb2dLSGtnS3lCVFNFRk1SaWtwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVZ1WkdWeVJHbGxLR052Ym5SbGVIUXNJSGdzSUhrc0lGTklRVXhHTENCMGFHbHpMbU52Ykc5eUtUdGNibHh1SUNBZ0lDQWdJQ0J6ZDJsMFkyZ2dLSFJvYVhNdWNHbHdjeWtnZTF4dUlDQWdJQ0FnSUNCallYTmxJREU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UwaEJURVlzSUhrZ0t5QlRTRUZNUml3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdNam9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBek9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UwaEJURVlzSUhrZ0t5QlRTRUZNUml3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURRNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdOVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQTJPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ1UwaEJURVlzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JrWldaaGRXeDBPaUF2THlCT2J5QnZkR2hsY2lCMllXeDFaWE1nWVd4c2IzZGxaQ0F2SUhCdmMzTnBZbXhsWEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUJEYkdWaGNpQmpiMjUwWlhoMFhHNGdJQ0FnSUNBZ0lHTnZiblJsZUhRdWMyVjBWSEpoYm5ObWIzSnRLREVzSURBc0lEQXNJREVzSURBc0lEQXBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JuZHBibVJ2ZHk1amRYTjBiMjFGYkdWdFpXNTBjeTVrWldacGJtVW9YQ0owYjNBdFpHbGxYQ0lzSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwS1R0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZEN4Y2JpQWdJQ0IxYm1samIyUmxWRzlRYVhCekxGeHVJQ0FnSUhCcGNITlViMVZ1YVdOdlpHVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZKOUlHWnliMjBnWENJdUwxUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBMbXB6WENJN1hHNWNiaThxS2x4dUlDb2dWRzl3VUd4aGVXVnlUR2x6ZEVoVVRVeEZiR1Z0Wlc1MElIUnZJR1JsYzJOeWFXSmxJSFJvWlNCd2JHRjVaWEp6SUdsdUlIUm9aU0JuWVcxbExseHVJQ3BjYmlBcUlFQmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBYRzRnS2k5Y2JtTnZibk4wSUZSdmNGQnNZWGxsY2t4cGMzUklWRTFNUld4bGJXVnVkQ0E5SUdOc1lYTnpJR1Y0ZEdWdVpITWdTRlJOVEVWc1pXMWxiblFnZTF4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EzSmxZWFJsSUdFZ2JtVjNJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQajBnZEdocGN5NXdiR0Y1WlhKekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzl3T25OMFlYSjBMWFIxY201Y0lpd2dLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJQYm14NUlHOXVaU0J3YkdGNVpYSWdZMkZ1SUdoaGRtVWdZU0IwZFhKdUlHRjBJR0Z1ZVNCbmFYWmxiaUIwYVcxbExseHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXdiR0Y1WlhKelhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xtWnBiSFJsY2lod0lEMCtJQ0Z3TG1WeGRXRnNjeWhsZG1WdWRDNWtaWFJoYVd3dWNHeGhlV1Z5S1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdVptOXlSV0ZqYUNod0lEMCtJSEF1Wlc1a1ZIVnliaWdwS1R0Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY25NZ2FXNGdkR2hwY3lCc2FYTjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UyMXZaSFZzWlRwVWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRINVViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkRnRkZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCd2JHRjVaWEp6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1d5NHVMblJvYVhNdVoyVjBSV3hsYldWdWRITkNlVlJoWjA1aGJXVW9YQ0owYjNBdGNHeGhlV1Z5WENJcFhUdGNiaUFnSUNCOVhHNTlPMXh1WEc1M2FXNWtiM2N1WTNWemRHOXRSV3hsYldWdWRITXVaR1ZtYVc1bEtGd2lkRzl3TFhCc1lYbGxjaTFzYVhOMFhDSXNJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRDazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWRzl3VUd4aGVXVnlUR2x6ZEVoVVRVeEZiR1Z0Wlc1MFhHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZHOXdSR2xqWlVKdllYSmtTRlJOVEVWc1pXMWxiblI5SUdaeWIyMGdYQ0l1TDFSdmNFUnBZMlZDYjJGeVpFaFVUVXhGYkdWdFpXNTBMbXB6WENJN1hHNXBiWEJ2Y25RZ2UxUnZjRVJwWlVoVVRVeEZiR1Z0Wlc1MGZTQm1jbTl0SUZ3aUxpOVViM0JFYVdWSVZFMU1SV3hsYldWdWRDNXFjMXdpTzF4dWFXMXdiM0owSUh0VWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRIMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblF1YW5OY0lqdGNibWx0Y0c5eWRDQjdWRzl3VUd4aGVXVnlUR2x6ZEVoVVRVeEZiR1Z0Wlc1MGZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSk1hWE4wU0ZSTlRFVnNaVzFsYm5RdWFuTmNJanRjYmx4dWQybHVaRzkzTG5SM1pXNTBlVzl1WlhCcGNITWdQU0IzYVc1a2IzY3VkSGRsYm5SNWIyNWxjR2x3Y3lCOGZDQlBZbXBsWTNRdVpuSmxaWHBsS0h0Y2JpQWdJQ0JXUlZKVFNVOU9PaUJjSWpBdU1DNHhYQ0lzWEc0Z0lDQWdURWxEUlU1VFJUb2dYQ0pNUjFCTUxUTXVNRndpTEZ4dUlDQWdJRmRGUWxOSlZFVTZJRndpYUhSMGNITTZMeTkwZDJWdWRIbHZibVZ3YVhCekxtOXlaMXdpTEZ4dUlDQWdJRWhVVFV4RmJHVnRaVzUwY3pvZ2UxeHVJQ0FnSUNBZ0lDQlViM0JFYVdObFFtOWhjbVJJVkUxTVJXeGxiV1Z1ZERvZ1ZHOXdSR2xqWlVKdllYSmtTRlJOVEVWc1pXMWxiblFzWEc0Z0lDQWdJQ0FnSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwT2lCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZEN4Y2JpQWdJQ0FnSUNBZ1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUTZJRlJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwTEZ4dUlDQWdJQ0FnSUNCVWIzQlFiR0Y1WlhKTWFYTjBTRlJOVEVWc1pXMWxiblE2SUZSdmNGQnNZWGxsY2t4cGMzUklWRTFNUld4bGJXVnVkRnh1SUNBZ0lIMHNYRzRnSUNBZ1JHbGxPaUJVYjNCRWFXVklWRTFNUld4bGJXVnVkQ3hjYmlBZ0lDQlFiR0Y1WlhJNklGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBMRnh1SUNBZ0lGQnNZWGxsY2t4cGMzUTZJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRDeGNiaUFnSUNCRWFXTmxRbTloY21RNklGUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwWEc1OUtUdGNiaUpkTENKdVlXMWxjeUk2V3lKMllXeHBaR0YwWlNJc0lrTlBURTlTWDBGVVZGSkpRbFZVUlNJc0lsOWpiMnh2Y2lKZExDSnRZWEJ3YVc1bmN5STZJa0ZCUVVFN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJOa0pCTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzWTBGQll5eExRVUZMTEVOQlFVTTdPenM3T3pzN08wbEJVVE5ETEZkQlFWY3NRMEZCUXl4UFFVRlBMRVZCUVVVN1VVRkRha0lzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMHRCUTJ4Q08wTkJRMG83TzBGRGVFTkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUU3T3pzN1FVRkpRU3hOUVVGTkxITkNRVUZ6UWl4SFFVRkhMRWRCUVVjc1EwRkJRenM3UVVGRmJrTXNUVUZCVFN4bFFVRmxMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXM3U1VGRE0wSXNUMEZCVHl4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UTBGRGNrVXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE5VSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6VkNMRTFCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETDBJc1RVRkJUU3hYUVVGWExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTnNReXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenM3T3pzN096czdPenM3T3pzN08wRkJaMEk1UWl4TlFVRk5MRlZCUVZVc1IwRkJSeXhOUVVGTk96czdPenM3TzBsQlQzSkNMRmRCUVZjc1EwRkJRenRSUVVOU0xFdEJRVXM3VVVGRFRDeE5RVUZOTzFGQlEwNHNWVUZCVlR0UlFVTldMRTlCUVU4N1MwRkRWaXhIUVVGSExFVkJRVVVzUlVGQlJUdFJRVU5LTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzQkNMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPenRSUVVWNFFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRlZCUVZVc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJRenRSUVVOMlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVOdVFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRMUVVONFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlR5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRek5DT3p0SlFVVkVMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5VTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRaUVVOUUxFMUJRVTBzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExEWkRRVUUyUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUdPMUZCUTBRc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRUlzU1VGQlNTeERRVUZETEdOQlFXTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTm9SRHM3T3pzN096czdTVUZSUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNMVFqczdTVUZGUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRVQ3hOUVVGTkxFbEJRVWtzYTBKQlFXdENMRU5CUVVNc1EwRkJReXc0UTBGQk9FTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5vUnp0UlFVTkVMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdTMEZEYUVRN096czdPenM3TzBsQlVVUXNTVUZCU1N4dFFrRkJiVUlzUjBGQlJ6dFJRVU4wUWl4UFFVRlBMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0TFFVTnNRenM3T3pzN096czdPenRKUVZWRUxFbEJRVWtzVlVGQlZTeEhRVUZITzFGQlEySXNUMEZCVHl4WFFVRlhMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEyaERPenRKUVVWRUxFbEJRVWtzVlVGQlZTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTmtMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5RTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETEd0RVFVRnJSQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNCSE8xRkJRMFFzVDBGQlR5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU51UXpzN096czdPenM3U1VGUlJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTNRanM3U1VGRlJDeEpRVUZKTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1VVRkRXaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVWQlFVVTdXVUZEVkN4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl3clEwRkJLME1zUlVGQlJTeEZRVUZGTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOc1J6dFJRVU5FTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzWkNMRWxCUVVrc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UzBGRGFFUTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeE5RVUZOTEVOQlFVTXNSMEZCUnl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlF6VkNMRTlCUVU4c1UwRkJVeXhMUVVGTExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMHRCUTNKRE96dEpRVVZFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOV0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM2hDT3pzN096czdPenRKUVZGRUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN096dEpRVkZFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096czdPenM3T3p0SlFWRkVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVFVGQlRTeEhRVUZITEVkQlFVY3NaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJoRUxFMUJRVTBzUjBGQlJ5eEhRVUZITEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXpzN1VVRkZhRVFzVDBGQlR5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOeVFqczdPenM3T3pzN096czdPMGxCV1VRc1RVRkJUU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5VTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN1dVRkRlRU1zVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zZVVOQlFYbERMRVZCUVVVc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRTFCUVUwc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRNVWs3TzFGQlJVUXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETjBJc1RVRkJUU3haUVVGWkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVjRRaXhMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVsQlFVa3NSVUZCUlR0WlFVTndRaXhKUVVGSkxFZEJRVWNzUTBGQlF5eGpRVUZqTEVWQlFVVXNTVUZCU1N4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVU3T3pzN1owSkJTWFJETEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0aFFVTXZRaXhOUVVGTk8yZENRVU5JTEZsQlFWa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WVVGRE1VSTdVMEZEU2pzN1VVRkZSQ3hOUVVGTkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNSVUZCUlN4SlFVRkpMRU5CUVVNc2JVSkJRVzFDTEVOQlFVTXNRMEZCUXp0UlFVTTVSU3hOUVVGTkxHTkJRV01zUjBGQlJ5eEpRVUZKTEVOQlFVTXNjMEpCUVhOQ0xFTkJRVU1zUjBGQlJ5eEZRVUZGTEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03TzFGQlJUTkZMRXRCUVVzc1RVRkJUU3hIUVVGSExFbEJRVWtzV1VGQldTeEZRVUZGTzFsQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTjBSU3hOUVVGTkxGVkJRVlVzUjBGQlJ5eGpRVUZqTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNN1dVRkRMME1zWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJYUkRMRWRCUVVjc1EwRkJReXhYUVVGWExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFsQlEzaEVMRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4elFrRkJjMElzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTjJSaXhwUWtGQmFVSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VTBGREwwSTdPMUZCUlVRc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6czdVVUZGYmtNc1QwRkJUeXhwUWtGQmFVSXNRMEZCUXp0TFFVTTFRanM3T3pzN096czdPenM3U1VGWFJDeHpRa0ZCYzBJc1EwRkJReXhIUVVGSExFVkJRVVVzYVVKQlFXbENMRVZCUVVVN1VVRkRNME1zVFVGQlRTeFRRVUZUTEVkQlFVY3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVNMVFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRaQ3hOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPenRSUVVWc1JDeFBRVUZQTEZOQlFWTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFdEJRVXNzUjBGQlJ5eFJRVUZSTEVWQlFVVTdXVUZETjBNc1MwRkJTeXhOUVVGTkxFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8yZENRVU14UXl4SlFVRkpMRk5CUVZNc1MwRkJTeXhKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRVZCUVVVc2FVSkJRV2xDTEVOQlFVTXNSVUZCUlR0dlFrRkRiRVVzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRwUWtGRGRrSTdZVUZEU2pzN1dVRkZSQ3hMUVVGTExFVkJRVVVzUTBGQlF6dFRRVU5ZT3p0UlFVVkVMRTlCUVU4c1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096czdPenM3TzBsQldVUXNZVUZCWVN4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOcVFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM2hDTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03TzFGQlJUVkNMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU5pTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNwRExFMUJRVTA3V1VGRFNDeExRVUZMTEVsQlFVa3NSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NTVUZCU1N4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZCUlR0blFrRkRha1VzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRPVVFzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnFSVHM3V1VGRlJDeExRVUZMTEVsQlFVa3NSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUVVVN1owSkJRM0JGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRemxFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRha1U3VTBGRFNqczdVVUZGUkN4UFFVRlBMRXRCUVVzc1EwRkJRenRMUVVOb1FqczdPenM3T3pzN096czdTVUZYUkN4WlFVRlpMRU5CUVVNc1NVRkJTU3hGUVVGRkxHbENRVUZwUWl4RlFVRkZPMUZCUTJ4RExFOUJRVThzVTBGQlV5eExRVUZMTEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU16UnpzN096czdPenM3TzBsQlUwUXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOaUxFOUJRVThzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTJwRk96czdPenM3T3pzN08wbEJWVVFzWVVGQllTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1EwRkJReXhGUVVGRk8xRkJRM1JDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZPMWxCUXpsRUxFOUJRVThzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1IwRkJSeXhEUVVGRE8xTkJRMnBETzFGQlEwUXNUMEZCVHl4VFFVRlRMRU5CUVVNN1MwRkRjRUk3T3pzN096czdPenM3TzBsQlYwUXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEzQkNMRTlCUVU4c1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGNFUTdPenM3T3pzN096czdPMGxCVjBRc2IwSkJRVzlDTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTNwQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNwRUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RlFVRkZPMWxCUTNoRExFOUJRVThzUTBGQlF5eERRVUZETzFOQlExbzdVVUZEUkN4UFFVRlBMRk5CUVZNc1EwRkJRenRMUVVOd1FqczdPenM3T3pzN096czdPenM3U1VGalJDeE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1NVRkJTU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTjJRaXhOUVVGTkxGVkJRVlVzUjBGQlJ6dFpRVU5tTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTJwRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzQkRMRU5CUVVNN08xRkJSVVlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU01UXl4TlFVRk5MRTlCUVU4c1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRelZETEUxQlFVMHNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzVDBGQlR5eERRVUZETzFGQlEzaERMRTFCUVUwc1VVRkJVU3hIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRE4wTXNUVUZCVFN4VFFVRlRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eFJRVUZSTEVOQlFVTTdPMUZCUlRGRExFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTTdXVUZEWml4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eFZRVUZWTEVOQlFVTTdXVUZEYWtNc1VVRkJVU3hGUVVGRkxFOUJRVThzUjBGQlJ5eFJRVUZSTzFOQlF5OUNMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhPMmRDUVVOdVFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8yRkJRekZDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1VVRkJVU3hIUVVGSExGRkJRVkU3VTBGRGFFTXNSVUZCUlR0WlFVTkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzJkQ1FVTnNRaXhIUVVGSExFVkJRVVVzVlVGQlZTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMmRDUVVOMlFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjN1lVRkRkRUlzUTBGQlF6dFpRVU5HTEZGQlFWRXNSVUZCUlN4UFFVRlBMRWRCUVVjc1UwRkJVenRUUVVOb1F5eEZRVUZGTzFsQlEwTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU03WjBKQlEyeENMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdaMEpCUTNaQ0xFZEJRVWNzUlVGQlJTeFZRVUZWTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1lVRkRNVUlzUTBGQlF6dFpRVU5HTEZGQlFWRXNSVUZCUlN4UlFVRlJMRWRCUVVjc1UwRkJVenRUUVVOcVF5eERRVUZETEVOQlFVTTdPMUZCUlVnc1RVRkJUU3hOUVVGTkxFZEJRVWNzVTBGQlV6czdZVUZGYmtJc1RVRkJUU3hEUVVGRExFTkJRVU1zVVVGQlVTeExRVUZMTEZOQlFWTXNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRE96dGhRVVU1UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhSUVVGUkxFdEJRVXM3WjBKQlEyeENMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExFZEJRVWNzUTBGQlF5eFhRVUZYTEVOQlFVTXNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJRenR0UWtGRGRFVXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czdZVUZGY2tRc1RVRkJUVHRuUWtGRFNDeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRXRCUVVzc1VVRkJVU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhMRkZCUVZFc1IwRkJSeXhKUVVGSk8yZENRVU4yUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hUUVVGVExFVkJRVVVzVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUXk5Q0xFTkJRVU03TzFGQlJVNHNUMEZCVHl4VFFVRlRMRXRCUVVzc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVNNVJUczdPenM3T3pzN08wbEJVMFFzUzBGQlN5eERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTNoQ0xFdEJRVXNzVFVGQlRTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdFpRVU12UWl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSUzlDTEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEZWtRc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenM3V1VGRmVrUXNTVUZCU1N4SlFVRkpMRWxCUVVrc1NVRkJTU3hGUVVGRk8yZENRVU5rTEU5QlFVOHNSMEZCUnl4RFFVRkRPMkZCUTJRN1UwRkRTanM3VVVGRlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0TFFVTm1PenM3T3pzN096czdPMGxCVlVRc1kwRkJZeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVTdVVUZETVVJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGRFUTdPenM3T3pzN096dEpRVk5FTEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdFJRVU4wUWl4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMHRCUTNwRU96czdPenM3T3pzN1NVRlRSQ3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRiRUlzVDBGQlR6dFpRVU5JTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTJwRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzQkRMRU5CUVVNN1MwRkRURHREUVVOS096dEJRM0JtUkRzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRU3RDUVN4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVOQlFVTXNTVUZCU1N4TFFVRkxPMGxCUTJwRExFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTNwRExFOUJRVThzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExGZEJRVmNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0RFFVTXhSaXhEUVVGRE96czdPenM3T3p0QlFWRkdMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NRMEZCUXl4SFFVRkhPenM3T3pzN096czdPenM3TzBsQllUTkNMR05CUVdNc1IwRkJSeXhEUVVGRE96czdPenM3T3pzN096czdPenM3TzFGQlowSmtMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRVZCUVVVc1VVRkJVU3hGUVVGRk96czdPMWxCU1M5RExFMUJRVTBzVVVGQlVTeEhRVUZITEd0Q1FVRnJRaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6RkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeFJRVUZSTEV0QlFVc3NRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdaMEpCUTNCRUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlF6TkRPMU5CUTBvN1MwRkRTanM3UVVOb1JrdzdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1RVRkJUU3hsUVVGbExFZEJRVWNzWTBGQll5eExRVUZMTEVOQlFVTTdTVUZEZUVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUlVGQlJUdFJRVU5pTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOa08wTkJRMG83TzBGRGRrSkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUVzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEdGQlFXRXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRM0JETEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03TzBGQlJUbENMRTFCUVUwc1lVRkJZU3hIUVVGSExFMUJRVTA3U1VGRGVFSXNWMEZCVnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVN1VVRkROVU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGRGVFSXNZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzV1VGQldTeERRVUZETEVOQlFVTTdVVUZEZEVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1MwRkROMEk3TzBsQlJVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNMEk3TzBsQlJVUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhoUVVGaExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXk5RU96dEpRVVZFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ096dEpRVVZFTEVsQlFVa3NUMEZCVHl4SFFVRkhPMUZCUTFZc1QwRkJUeXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1MwRkRiRU03TzBsQlJVUXNVMEZCVXl4RFFVRkRMRlZCUVZVc1JVRkJSVHRSUVVOc1FpeGhRVUZoTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU53UXl4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVObU96dEpRVVZFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRk5CUVZNc1JVRkJSU3hoUVVGaExFZEJRVWNzUlVGQlJTeEZRVUZGTEZOQlFWTXNSMEZCUnl4bFFVRmxMRU5CUVVNc1JVRkJSVHRSUVVOcVJTeE5RVUZOTEZkQlFWY3NSMEZCUnl4VFFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUlVGQlJTeGhRVUZoTEVOQlFVTXNRMEZCUXp0UlFVTjZSQ3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFsQlEyUXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4aFFVRmhMRU5CUVVNc1EwRkJRenM3V1VGRmRrUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdVMEZETTBJN08xRkJSVVFzVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWmp0RFFVTktPenRCUXk5RVJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVVkJMRTFCUVUwc1ZVRkJWU3hIUVVGSExHTkJRV01zWlVGQlpTeERRVUZETzBsQlF6ZERMRmRCUVZjc1EwRkJReXhIUVVGSExFVkJRVVU3VVVGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRaRHREUVVOS096dEJRM3BDUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVWQkxFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1kwRkJZeXhsUVVGbExFTkJRVU03U1VGRGJrUXNWMEZCVnl4RFFVRkRMRWRCUVVjc1JVRkJSVHRSUVVOaUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0TFFVTmtPME5CUTBvN08wRkRla0pFT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCU1VFc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHZRa0ZCYjBJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU55UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03VVVGRGJFTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdVVUZETTBNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1dVRkRla0lzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTnFRaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEU5QlFVOHNTMEZCU3l4RlFVRkZPMWxCUTJ4RExFMUJRVTBzVjBGQlZ5eEhRVUZITEZGQlFWRXNRMEZCUXl4TFFVRkxMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRExGZEJRVmNzUTBGQlF5eEZRVUZGTzJkQ1FVTXZRaXhMUVVGTExFZEJRVWNzVjBGQlZ5eERRVUZETzJGQlEzWkNMRTFCUVUwN1owSkJRMGdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzUkRPMU5CUTBvc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4blFrRkJaMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpWRE96dFJRVVZFTEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3haUVVGWkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjRRenM3U1VGRlJDeFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTFZc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEyWXNVMEZCVXl4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXp0WlFVTnNReXhoUVVGaExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEY2tJc1EwRkJReXhEUVVGRE8wdEJRMDQ3TzBsQlJVUXNWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOWUxFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkRiRU1zWVVGQllTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNKQ0xFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlExWXNUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6bEVMR0ZCUVdFc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVMEZEZUVJc1EwRkJReXhEUVVGRE8wdEJRMDQ3UTBGRFNqczdRVU5zUlVRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGSFFTeE5RVUZOTEc5Q1FVRnZRaXhIUVVGSExFVkJRVVVzUTBGQlF6dEJRVU5vUXl4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEdOQlFXTXNZVUZCWVN4RFFVRkRPMGxCUTNCRUxGZEJRVmNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEWml4SlFVRkpMRXRCUVVzc1IwRkJSeXh2UWtGQmIwSXNRMEZCUXp0UlFVTnFReXhOUVVGTkxGbEJRVmtzUjBGQlJ5eHZRa0ZCYjBJc1EwRkJRenRSUVVNeFF5eE5RVUZOTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSV3hDTEVsQlFVa3NVVUZCVVN4TFFVRkxMRTlCUVU4c1MwRkJTeXhGUVVGRk8xbEJRek5DTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1UwRkRha0lzVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRelZET3p0UlFVVkVMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFF6czdTVUZGUkN4UlFVRlJMRWRCUVVjN1VVRkRVQ3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1RVRkJUU3hGUVVGRkxFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMDdVMEZEZEVNc1EwRkJReXhEUVVGRE8wdEJRMDQ3UTBGRFNqczdRVU16UTBRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRFFUdEJRVU5CTEVGQlJVRXNUVUZCVFN4dFFrRkJiVUlzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4alFVRmpMR0ZCUVdFc1EwRkJRenRKUVVOdVJDeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTJZc1NVRkJTU3hMUVVGTExFZEJRVWNzYlVKQlFXMUNMRU5CUVVNN1VVRkRhRU1zVFVGQlRTeFpRVUZaTEVkQlFVY3NiVUpCUVcxQ0xFTkJRVU03VVVGRGVrTXNUVUZCVFN4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE96dFJRVVZzUWl4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdRMEZEU2pzN1FVTjBRMFE3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZKUVN4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEV0QlFVc3NRMEZCUXp0QlFVTndReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMR05CUVdNc1lVRkJZU3hEUVVGRE8wbEJRM0pFTEZkQlFWY3NRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRaaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJRenRSUVVOc1F5eE5RVUZOTEZsQlFWa3NSMEZCUnl4eFFrRkJjVUlzUTBGQlF6dFJRVU16UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03TzFGQlJXeENMRWxCUVVrc1MwRkJTeXhaUVVGWkxFOUJRVThzUlVGQlJUdFpRVU14UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMHNTVUZCU1N4UlFVRlJMRXRCUVVzc1QwRkJUeXhMUVVGTExFVkJRVVU3V1VGRGJFTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzJkQ1FVTnlRaXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzJGQlEyaENMRTFCUVUwc1NVRkJTU3hSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMmRDUVVNM1FpeExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMkZCUTJwQ0xFMUJRVTA3WjBKQlEwZ3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGVkJRVlVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTNSRE8xTkJRMG9zVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRelZET3p0UlFVVkVMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFF6czdTVUZGUkN4TlFVRk5MRWRCUVVjN1VVRkRUQ3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1RVRkJUU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMDdVMEZEZUVNc1EwRkJReXhEUVVGRE8wdEJRMDQ3TzBsQlJVUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEyWXNVMEZCVXl4RlFVRkZMRTFCUVUwc1MwRkJTeXhMUVVGTExFbEJRVWtzUTBGQlF5eE5RVUZOTzFOQlEzcERMRU5CUVVNc1EwRkJRenRMUVVOT08wTkJRMG83TzBGRE1VUkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJTMEVzVFVGQlRTeFRRVUZUTEVkQlFVY3NUVUZCVFR0SlFVTndRaXhYUVVGWExFZEJRVWM3UzBGRFlqczdTVUZGUkN4UFFVRlBMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEc5Q1FVRnZRaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlF6RkRPenRKUVVWRUxFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVkN4UFFVRlBMRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRlRU03TzBsQlJVUXNUMEZCVHl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOWUxFOUJRVThzU1VGQlNTeHZRa0ZCYjBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU14UXpzN1NVRkZSQ3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlExWXNUMEZCVHl4SlFVRkpMRzFDUVVGdFFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTNwRE96dERRVVZLTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4SlFVRkpMRk5CUVZNc1JVRkJSVHM3UVVNNVF6RkRPenM3T3pzN096czdPenM3T3pzN096czdPenM3TzBGQmMwSkJMRUZCU1VFN1FVRkRRU3hOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hqUVVGakxFZEJRVWNzVFVGQlRTeERRVUZETzBGQlF6bENMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR3RDUVVGclFpeEhRVUZITEZWQlFWVXNRMEZCUXpzN08wRkJSM1JETEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYjBJdlFpeE5RVUZOTEc5Q1FVRnZRaXhIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN096czdPenM3T3pzN1NVRmhka1VzVjBGQlZ5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUXpWRExFdEJRVXNzUlVGQlJTeERRVUZET3p0UlFVVlNMRTFCUVUwc1ZVRkJWU3hIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJReTlGTEVsQlFVa3NWVUZCVlN4RFFVRkRMRTlCUVU4c1JVRkJSVHRaUVVOd1FpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hWUVVGVkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdXVUZEYmtNc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGxRVUZsTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRMnhFTEUxQlFVMDdXVUZEU0N4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNORU5CUVRSRExFTkJRVU1zUTBGQlF6dFRRVU01UlRzN1VVRkZSQ3hOUVVGTkxGTkJRVk1zUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUlN4SlFVRkpMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVU3V1VGRGJrSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZEVJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGpRVUZqTEVWQlFVVXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xTkJRMmhFTEUxQlFVMDdXVUZEU0N4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNNa05CUVRKRExFTkJRVU1zUTBGQlF6dFRRVU0zUlRzN1VVRkZSQ3hOUVVGTkxGVkJRVlVzUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5xUml4SlFVRkpMRlZCUVZVc1EwRkJReXhQUVVGUExFVkJRVVU3V1VGRGNFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZEZUVJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGxRVUZsTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRMnhFTEUxQlFVMDdPMWxCUlVnc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRka0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRUUVVONlF6czdVVUZGUkN4TlFVRk5MRmxCUVZrc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dGhRVU5zUml4TlFVRk5MRVZCUVVVc1EwRkJRenRSUVVOa0xFbEJRVWtzV1VGQldTeERRVUZETEU5QlFVOHNSVUZCUlR0WlFVTjBRaXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJRenRaUVVNMVFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMU5CUTJ4RUxFMUJRVTA3TzFsQlJVZ3NVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8xTkJRelZETzB0QlEwbzdPMGxCUlVRc1YwRkJWeXhyUWtGQmEwSXNSMEZCUnp0UlFVTTFRaXhQUVVGUE8xbEJRMGdzWlVGQlpUdFpRVU5tTEdOQlFXTTdXVUZEWkN4bFFVRmxPMWxCUTJZc2EwSkJRV3RDTzFOQlEzSkNMRU5CUVVNN1MwRkRURHM3U1VGRlJDeHBRa0ZCYVVJc1IwRkJSenRMUVVOdVFqczdTVUZGUkN4dlFrRkJiMElzUjBGQlJ6dExRVU4wUWpzN096czdPenRKUVU5RUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6TkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeEpRVUZKTEVkQlFVYzdVVUZEVUN4UFFVRlBMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETVVJN096czdPenM3U1VGUFJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c1NVRkJTU3hMUVVGTExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNMFE3U1VGRFJDeEpRVUZKTEV0QlFVc3NRMEZCUXl4UlFVRlJMRVZCUVVVN1VVRkRhRUlzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VVVGRE0wSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1VVRkJVU3hGUVVGRk8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU03VTBGRGVrTXNUVUZCVFR0WlFVTklMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMU5CUTJoRU8wdEJRMG83T3pzN096czdTVUZQUkN4VFFVRlRMRWRCUVVjN1VVRkRVaXhKUVVGSkxFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVTdXVUZEYkVJc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4WFFVRlhMRU5CUVVNc1owSkJRV2RDTEVWQlFVVTdaMEpCUXpWRUxFMUJRVTBzUlVGQlJUdHZRa0ZEU2l4TlFVRk5MRVZCUVVVc1NVRkJTVHRwUWtGRFpqdGhRVU5LTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTFBN1VVRkRSQ3hSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVONlFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpWRExFOUJRVThzU1VGQlNTeERRVUZETzB0QlEyWTdPenM3TzBsQlMwUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRla0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETzB0QlF6VkRPenM3T3pzN08wbEJUMFFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMRWxCUVVrc1MwRkJTeXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNSRE96czdPenM3TzBsQlQwUXNVVUZCVVN4SFFVRkhPMUZCUTFBc1QwRkJUeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRla0k3T3pzN096czdPenRKUVZORUxFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVml4TlFVRk5MRWxCUVVrc1IwRkJSeXhSUVVGUkxFdEJRVXNzVDBGQlR5eExRVUZMTEVkQlFVY3NTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU03VVVGRE5VUXNUMEZCVHl4TFFVRkxMRXRCUVVzc1NVRkJTU3hKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMHRCUXk5RE8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlF5eFpRVUZaTEVWQlFVVXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlF6czdPenM3T3pzN08wRkJVMnBGTEUxQlFVMHNjVUpCUVhGQ0xFZEJRVWNzU1VGQlNTeHZRa0ZCYjBJc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE96dEJRMnhQYWtZN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJiMEpCTEVGQlNVRTdPenM3UVVGSlFTeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU0zUWl4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTnNReXhOUVVGTkxEaENRVUU0UWl4SFFVRkhMRXRCUVVzc1EwRkJRenRCUVVNM1F5eE5RVUZOTERaQ1FVRTJRaXhIUVVGSExFdEJRVXNzUTBGQlF6dEJRVU0xUXl4TlFVRk5MRGhDUVVFNFFpeEhRVUZITEV0QlFVc3NRMEZCUXpzN1FVRkZOME1zVFVGQlRTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTJoQ0xFMUJRVTBzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1FVRkZhRUlzVFVGQlRTeGhRVUZoTEVkQlFVY3NTVUZCU1N4SFFVRkhMR2RDUVVGblFpeERRVUZETzBGQlF6bERMRTFCUVUwc1kwRkJZeXhIUVVGSExFbEJRVWtzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRCUVVNdlF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE96dEJRVVZvUkN4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYQkNMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEZGQlFWRXNRMEZCUXp0QlFVTnNReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMRmxCUVZrc1EwRkJRenRCUVVNeFF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUTBGQlF6dEJRVU4wUXl4TlFVRk5MR2REUVVGblF5eEhRVUZITEhkQ1FVRjNRaXhEUVVGRE8wRkJRMnhGTEUxQlFVMHNLMEpCUVN0Q0xFZEJRVWNzZFVKQlFYVkNMRU5CUVVNN1FVRkRhRVVzVFVGQlRTeG5RMEZCWjBNc1IwRkJSeXgzUWtGQmQwSXNRMEZCUXp0QlFVTnNSU3hOUVVGTkxIVkNRVUYxUWl4SFFVRkhMR1ZCUVdVc1EwRkJRenM3TzBGQlIyaEVMRTFCUVUwc1YwRkJWeXhIUVVGSExFTkJRVU1zV1VGQldTeEZRVUZGTEdGQlFXRXNSMEZCUnl4RFFVRkRMRXRCUVVzN1NVRkRja1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRmxCUVZrc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU14UXl4UFFVRlBMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NZVUZCWVN4SFFVRkhMRTFCUVUwc1EwRkJRenREUVVONFJDeERRVUZET3p0QlFVVkdMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4WlFVRlpMRVZCUVVVc1dVRkJXU3hMUVVGTE8wbEJRM1JFTEU5QlFVOUJMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXp0VFFVTm9ReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEySXNVMEZCVXl4RFFVRkRMRmxCUVZrc1EwRkJRenRUUVVOMlFpeExRVUZMTEVOQlFVTTdRMEZEWkN4RFFVRkRPenRCUVVWR0xFMUJRVTBzTUVKQlFUQkNMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTm9SU3hKUVVGSkxFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1VVRkROVUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NUMEZCVHl4RFFVRkRMRmxCUVZrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU12UXl4UFFVRlBMR2xDUVVGcFFpeERRVUZETEZkQlFWY3NSVUZCUlN4WlFVRlpMRU5CUVVNc1EwRkJRenRMUVVOMlJEdEpRVU5FTEU5QlFVOHNXVUZCV1N4RFFVRkRPME5CUTNaQ0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhoUVVGaExFVkJRVVVzVTBGQlV5eEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTXpSQ3hKUVVGSkxGTkJRVk1zUzBGQlN5eGhRVUZoTEVsQlFVa3NUVUZCVFN4TFFVRkxMR0ZCUVdFc1JVRkJSVHRSUVVONlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0TFFVTm1MRTFCUVUwc1NVRkJTU3hQUVVGUExFdEJRVXNzWVVGQllTeEZRVUZGTzFGQlEyeERMRTlCUVU4c1MwRkJTeXhEUVVGRE8wdEJRMmhDTEUxQlFVMDdVVUZEU0N4UFFVRlBMRmxCUVZrc1EwRkJRenRMUVVOMlFqdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3h0UWtGQmJVSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVVVzV1VGQldTeExRVUZMTzBsQlEzcEVMRWxCUVVrc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0UlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJReTlETEU5QlFVOHNWVUZCVlN4RFFVRkRMRmRCUVZjc1JVRkJSU3hEUVVGRExGZEJRVmNzUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxGbEJRVmtzUTBGQlF5eERRVUZETzB0QlEyeEdPenRKUVVWRUxFOUJRVThzV1VGQldTeERRVUZETzBOQlEzWkNMRU5CUVVNN096dEJRVWRHTEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU01UWl4TlFVRk5MR05CUVdNc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlEzSkRMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3UVVGRmVrTXNUVUZCVFN4UFFVRlBMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXNzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdPMEZCUlM5RUxFMUJRVTBzV1VGQldTeEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxPMGxCUXpWQ0xFbEJRVWtzVTBGQlV5eExRVUZMTEd0Q1FVRnJRaXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0UlFVTTNReXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkRPenRKUVVWRUxFOUJRVThzYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzBOQlEzaERMRU5CUVVNN08wRkJSVVlzVFVGQlRTeGxRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1RVRkJUU3hMUVVGTE8wbEJRM1pETEd0Q1FVRnJRaXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETzBOQlF5OUVMRU5CUVVNN08wRkJSVVlzVFVGQlRTeFBRVUZQTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzc1dVRkJXU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE96dEJRVVZ5UlN4TlFVRk5MRmRCUVZjc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1MwRkJTenRKUVVNNVF5eEpRVUZKTEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRSUVVOb1FpeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdPMUZCUlRGRUxFdEJRVXNzVFVGQlRTeEhRVUZITEVsQlFVa3NTVUZCU1N4RlFVRkZPMWxCUTNCQ0xFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0VFFVTTNRenRMUVVOS08wTkJRMG9zUTBGQlF6czdPenRCUVVsR0xFMUJRVTBzU1VGQlNTeEhRVUZITEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETzBGQlEzUkRMRTFCUVUwc1NVRkJTU3hIUVVGSExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFpRVUZaTEVkQlFVY3NUVUZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRE8wRkJRelZETEUxQlFVMHNVVUZCVVN4SFFVRkhMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6czdPMEZCUjNCRExFMUJRVTBzWjBOQlFXZERMRWRCUVVjc1EwRkJReXhOUVVGTkxFVkJRVVVzVDBGQlR5eEZRVUZGTEU5QlFVOHNTMEZCU3p0SlFVTnVSU3hOUVVGTkxGTkJRVk1zUjBGQlJ5eE5RVUZOTEVOQlFVTXNjVUpCUVhGQ0xFVkJRVVVzUTBGQlF6czdTVUZGYWtRc1RVRkJUU3hEUVVGRExFZEJRVWNzVDBGQlR5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1RVRkJUU3hEUVVGRExFdEJRVXNzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRkRVVzVFVGQlRTeERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRk5CUVZNc1EwRkJReXhIUVVGSExFbEJRVWtzVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03TzBsQlJYWkZMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdRMEZEYWtJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTzBsQlEyaERMRTFCUVUwc1RVRkJUU3hIUVVGSExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN096dEpRVWRzUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGFFSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRE8wbEJRMnBDTEVsQlFVa3NWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVOMlFpeEpRVUZKTEdOQlFXTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1NVRkRNVUlzU1VGQlNTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRPenRKUVVWMlFpeE5RVUZOTEU5QlFVOHNSMEZCUnl4TlFVRk5PMUZCUTJ4Q0xFbEJRVWtzU1VGQlNTeExRVUZMTEV0QlFVc3NTVUZCU1N4WlFVRlpMRXRCUVVzc1MwRkJTeXhGUVVGRk96dFpRVVV4UXl4TlFVRk5MR1ZCUVdVc1IwRkJSeXhMUVVGTExFTkJRVU1zWVVGQllTeERRVUZETEhORFFVRnpReXhEUVVGRExFTkJRVU03V1VGRGNFWXNTVUZCU1N4alFVRmpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVU3WjBKQlEzcENMR05CUVdNc1EwRkJReXhUUVVGVExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTTdZVUZETjBNc1RVRkJUVHRuUWtGRFNDeGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8yRkJRekZETzFsQlEwUXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenM3V1VGRllpeFhRVUZYTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1UwRkRkRUk3TzFGQlJVUXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVOMFFpeERRVUZET3p0SlFVVkdMRTFCUVUwc1dVRkJXU3hIUVVGSExFMUJRVTA3VVVGRGRrSXNWMEZCVnl4SFFVRkhMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zVDBGQlR5eEZRVUZGTEV0QlFVc3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJRenRMUVVOb1JTeERRVUZET3p0SlFVVkdMRTFCUVUwc1YwRkJWeXhIUVVGSExFMUJRVTA3VVVGRGRFSXNUVUZCVFN4RFFVRkRMRmxCUVZrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dFJRVU5xUXl4WFFVRlhMRWRCUVVjc1NVRkJTU3hEUVVGRE8wdEJRM1JDTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTenRSUVVOb1F5eEpRVUZKTEVsQlFVa3NTMEZCU3l4TFFVRkxMRVZCUVVVN08xbEJSV2hDTEUxQlFVMHNSMEZCUnp0blFrRkRUQ3hEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVODdaMEpCUTJoQ0xFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNUMEZCVHp0aFFVTnVRaXhEUVVGRE96dFpRVVZHTEdOQlFXTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eG5RMEZCWjBNc1EwRkJReXhOUVVGTkxFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVOHNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6czdXVUZGTlVjc1NVRkJTU3hKUVVGSkxFdEJRVXNzWTBGQll5eEZRVUZGT3p0blFrRkZla0lzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dFFrRkJiVUlzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdHZRa0ZETTBRc1MwRkJTeXhIUVVGSExGbEJRVmtzUTBGQlF6dHZRa0ZEY2tJc1dVRkJXU3hGUVVGRkxFTkJRVU03YVVKQlEyeENMRTFCUVUwc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSVHR2UWtGRGJrTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRFlpeFpRVUZaTEVWQlFVVXNRMEZCUXp0cFFrRkRiRUlzVFVGQlRTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzlDUVVGdlFpeEZRVUZGTzI5Q1FVTndReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzJsQ1FVTm9RanRoUVVOS096dFRRVVZLTzB0QlEwb3NRMEZCUXpzN1NVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0UlFVTXZRaXhOUVVGTkxHTkJRV01zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhuUTBGQlowTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUlVGQlJTeExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOc1NDeEpRVUZKTEZGQlFWRXNTMEZCU3l4TFFVRkxMRVZCUVVVN1dVRkRjRUlzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1ZVRkJWU3hEUVVGRE8xTkJRM0JETEUxQlFVMHNTVUZCU1N4SlFVRkpMRXRCUVVzc1kwRkJZeXhGUVVGRk8xbEJRMmhETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF6dFRRVU5vUXl4TlFVRk5PMWxCUTBnc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NVMEZCVXl4RFFVRkRPMU5CUTI1RE8wdEJRMG9zUTBGQlF6czdTVUZGUml4TlFVRk5MRWxCUVVrc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dFJRVU53UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhMUVVGTExFbEJRVWtzV1VGQldTeExRVUZMTEV0QlFVc3NSVUZCUlRzN08xbEJSekZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03V1VGRE9VTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6czdXVUZGT1VNc1NVRkJTU3hUUVVGVExFZEJRVWNzUlVGQlJTeEpRVUZKTEZOQlFWTXNSMEZCUnl4RlFVRkZMRVZCUVVVN1owSkJRMnhETEV0QlFVc3NSMEZCUnl4UlFVRlJMRU5CUVVNN1owSkJRMnBDTEZkQlFWY3NSVUZCUlN4RFFVRkRPenRuUWtGRlpDeE5RVUZOTEhsQ1FVRjVRaXhIUVVGSExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFdEJRVXNzWTBGQll5eERRVUZETEVOQlFVTTdaMEpCUTI1R0xGZEJRVmNzUTBGQlF5eExRVUZMTEVWQlFVVXNlVUpCUVhsQ0xFTkJRVU1zUTBGQlF6dG5Ra0ZET1VNc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dGhRVU5vUmp0VFFVTktMRTFCUVUwc1NVRkJTU3hSUVVGUkxFdEJRVXNzUzBGQlN5eEZRVUZGTzFsQlF6TkNMRTFCUVUwc1JVRkJSU3hIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVOd1F5eE5RVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTTdPMWxCUlhCRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1kwRkJZeXhEUVVGRExGZEJRVmNzUTBGQlF6czdXVUZGTVVNc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEZsQlFWa3NRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF5OURMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRhRVk3UzBGRFNpeERRVUZET3p0SlFVVkdMRTFCUVUwc1pVRkJaU3hIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTzFGQlF5OUNMRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zU1VGQlNTeFJRVUZSTEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUXk5RExFMUJRVTBzUlVGQlJTeEhRVUZITEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF6dFpRVU53UXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNN08xbEJSWEJETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzWTBGQll5eERRVUZETEZkQlFWY3NRMEZCUXpzN1dVRkZNVU1zVFVGQlRTeFpRVUZaTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03WjBKQlEzSkRMRWRCUVVjc1JVRkJSU3hqUVVGak8yZENRVU51UWl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFVkJRVVU3WjBKQlExUXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRk8yRkJRMW9zUTBGQlF5eERRVUZET3p0WlFVVklMRTFCUVUwc1UwRkJVeXhIUVVGSExFbEJRVWtzU1VGQlNTeFpRVUZaTEVkQlFVY3NXVUZCV1N4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZET3p0WlFVVXZSQ3hqUVVGakxFTkJRVU1zVjBGQlZ5eEhRVUZITEZOQlFWTXNRMEZCUXp0VFFVTXhRenM3TzFGQlIwUXNZMEZCWXl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOMFFpeExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRPenM3VVVGSFlpeFhRVUZYTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRkRUlzUTBGQlF6czdPenM3T3pzN1NVRlJSaXhKUVVGSkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRhRVFzVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExHTkJRV01zUzBGQlN6dFJRVU42UXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hMUVVGTE8xbEJRMjVDTEVsQlFVa3NWVUZCVlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhWUVVGVkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSVUZCUlR0blFrRkROME1zVFVGQlRTeERRVUZETEU5QlFVOHNSVUZCUlN4UFFVRlBMRU5CUVVNc1IwRkJSeXhWUVVGVkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVJDeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeFBRVUZQTEVOQlFVTXNRMEZCUXp0aFFVTjZRenRaUVVORUxFMUJRVTBzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1kwRkJZeXhGUVVGRkxHZENRVUZuUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNeFJTeERRVUZETzB0QlEwd3NRMEZCUXpzN1NVRkZSaXhOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1dVRkJXU3hGUVVGRkxHZENRVUZuUWl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGNrVXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZkQlFWY3NSVUZCUlN4blFrRkJaMElzUTBGQlF5eERRVUZET3p0SlFVVjJSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEc5Q1FVRnZRaXhGUVVGRk8xRkJRemRDTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndSU3hOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1YwRkJWeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6bERPenRKUVVWRUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiMEpCUVc5Q0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3VVVGRE0wUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZkQlFWY3NSVUZCUlN4bFFVRmxMRU5CUVVNc1EwRkJRenRMUVVONlJEczdTVUZGUkN4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNWVUZCVlN4RlFVRkZMR2RDUVVGblFpeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRha1VzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGTkJRVk1zUlVGQlJTeGxRVUZsTEVOQlFVTXNRMEZCUXp0SlFVTndSQ3hOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1ZVRkJWU3hGUVVGRkxHVkJRV1VzUTBGQlF5eERRVUZETzBOQlEzaEVMRU5CUVVNN096czdPenM3TzBGQlVVWXNUVUZCVFN4MVFrRkJkVUlzUjBGQlJ5eGpRVUZqTEZkQlFWY3NRMEZCUXpzN096czdTVUZMZEVRc1YwRkJWeXhIUVVGSE8xRkJRMVlzUzBGQlN5eEZRVUZGTEVOQlFVTTdVVUZEVWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUjBGQlJ5eGpRVUZqTEVOQlFVTTdVVUZEY0VNc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyNUVMRTFCUVUwc1RVRkJUU3hIUVVGSExGRkJRVkVzUTBGQlF5eGhRVUZoTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRhRVFzVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenM3VVVGRk0wSXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVVUZETVVJc1kwRkJZeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dFJRVU5vUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEZWQlFWVXNRMEZCUXp0WlFVTTNRaXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVczdXVUZEYWtJc1RVRkJUU3hGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTzFsQlEyNUNMRTlCUVU4c1JVRkJSU3hKUVVGSkxFTkJRVU1zVDBGQlR6dFpRVU55UWl4VlFVRlZMRVZCUVVVc1NVRkJTU3hEUVVGRExGVkJRVlU3VTBGRE9VSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRTaXhuUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNeFFqczdTVUZGUkN4WFFVRlhMR3RDUVVGclFpeEhRVUZITzFGQlF6VkNMRTlCUVU4N1dVRkRTQ3hsUVVGbE8xbEJRMllzWjBKQlFXZENPMWxCUTJoQ0xHOUNRVUZ2UWp0WlFVTndRaXhyUWtGQmEwSTdXVUZEYkVJc1owTkJRV2RETzFsQlEyaERMR2REUVVGblF6dFpRVU5vUXl3clFrRkJLMEk3V1VGREwwSXNkVUpCUVhWQ08xTkJRekZDTEVOQlFVTTdTMEZEVERzN1NVRkZSQ3gzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hGUVVGRkxGRkJRVkVzUlVGQlJUdFJRVU12UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTJwRExGRkJRVkVzU1VGQlNUdFJRVU5hTEV0QlFVc3NaVUZCWlN4RlFVRkZPMWxCUTJ4Q0xFMUJRVTBzUzBGQlN5eEhRVUZITEdsQ1FVRnBRaXhEUVVGRExGRkJRVkVzUlVGQlJTeFhRVUZYTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1lVRkJZU3hEUVVGRExFTkJRVU03V1VGRGJFWXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFsQlF6RkNMRTFCUVUwc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUXpWRExFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NaMEpCUVdkQ0xFVkJRVVU3V1VGRGJrSXNUVUZCVFN4TlFVRk5MRWRCUVVjc2FVSkJRV2xDTEVOQlFVTXNVVUZCVVN4RlFVRkZMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeGpRVUZqTEVOQlFVTXNRMEZCUXp0WlFVTndSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNN1dVRkROVUlzVFVGQlRTeERRVUZETEZsQlFWa3NRMEZCUXl4blFrRkJaMElzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTTVReXhOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEc5Q1FVRnZRaXhGUVVGRk8xbEJRM1pDTEUxQlFVMHNWVUZCVlN4SFFVRkhMR2xDUVVGcFFpeERRVUZETEZGQlFWRXNSVUZCUlN4WFFVRlhMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzYTBKQlFXdENMRU5CUVVNc1EwRkJRenRaUVVNMVJpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVZVc1IwRkJSeXhWUVVGVkxFTkJRVU03V1VGRGNFTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhyUWtGQmEwSXNSVUZCUlR0WlFVTnlRaXhOUVVGTkxFOUJRVThzUjBGQlJ5eHBRa0ZCYVVJc1EwRkJReXhSUVVGUkxFVkJRVVVzVjBGQlZ5eERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMR2RDUVVGblFpeERRVUZETEVOQlFVTTdXVUZEZGtZc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVkQlFVY3NUMEZCVHl4RFFVRkRPMWxCUXpsQ0xFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NaME5CUVdkRExFVkJRVVU3V1VGRGJrTXNUVUZCVFN4blFrRkJaMElzUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVVVGQlVTeEZRVUZGTEZWQlFWVXNRMEZCUXl4UlFVRlJMRVZCUVVVc1owTkJRV2RETEVWQlFVVXNPRUpCUVRoQ0xFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTnNTaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMR2RDUVVGblFpeERRVUZETzFsQlEzWkRMRTFCUVUwN1UwRkRWRHRSUVVORUxGTkJRVk1zUVVGRlVqdFRRVU5CT3p0UlFVVkVMRmRCUVZjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU55UWpzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1pVRkJaU3hGUVVGRkxFMUJRVTA3V1VGRGVrTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU42UWl4SlFVRkpMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdG5Ra0ZEWml4WFFVRlhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzQkVPMU5CUTBvc1EwRkJReXhEUVVGRE96dFJRVVZJTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSU3hOUVVGTk8xbEJRek5ETEZkQlFWY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFrUXNaVUZCWlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6ZENMRU5CUVVNc1EwRkJRenM3T3p0UlFVbElMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUlVGQlJUdFpRVU5vUkN4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExGRkJRVkVzUTBGQlF5eGhRVUZoTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUVPMHRCUTBvN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3TzBsQlJVUXNaVUZCWlN4SFFVRkhPMHRCUTJwQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hKUVVGSkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOd1JEczdPenM3T3p0SlFVOUVMRWxCUVVrc2JVSkJRVzFDTEVkQlFVYzdVVUZEZEVJc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEcxQ1FVRnRRaXhEUVVGRE8wdEJRekZET3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeGxRVUZsTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1MwRkRNMFU3T3pzN096dEpRVTFFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owSkJRV2RDTEVWQlFVVXNZMEZCWXl4RFFVRkRMRU5CUVVNN1MwRkROMFU3T3pzN096dEpRVTFFTEVsQlFVa3NWVUZCVlN4SFFVRkhPMUZCUTJJc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc2IwSkJRVzlDTEVWQlFVVXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dExRVU55UmpzN096czdPenRKUVU5RUxFbEJRVWtzVDBGQlR5eEhRVUZITzFGQlExWXNUMEZCVHl3d1FrRkJNRUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNhMEpCUVd0Q0xFVkJRVVVzWjBKQlFXZENMRU5CUVVNc1EwRkJRenRMUVVOcVJqczdPenM3TzBsQlRVUXNTVUZCU1N4dlFrRkJiMElzUjBGQlJ6dFJRVU4yUWl4UFFVRlBMRzFDUVVGdFFpeERRVUZETEVsQlFVa3NSVUZCUlN4blEwRkJaME1zUlVGQlJTdzRRa0ZCT0VJc1EwRkJReXhEUVVGRE8wdEJRM1JIT3pzN096czdTVUZOUkN4SlFVRkpMRzFDUVVGdFFpeEhRVUZITzFGQlEzUkNMRTlCUVU4c2JVSkJRVzFDTEVOQlFVTXNTVUZCU1N4RlFVRkZMQ3RDUVVFclFpeEZRVUZGTERaQ1FVRTJRaXhEUVVGRExFTkJRVU03UzBGRGNFYzdPenM3T3p0SlFVMUVMRWxCUVVrc2IwSkJRVzlDTEVkQlFVYzdVVUZEZGtJc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owTkJRV2RETEVWQlFVVXNPRUpCUVRoQ0xFTkJRVU1zUTBGQlF6dExRVU4wUnpzN096czdPenM3TzBsQlUwUXNTVUZCU1N4WlFVRlpMRWRCUVVjN1VVRkRaaXhQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3gxUWtGQmRVSXNSVUZCUlN4eFFrRkJjVUlzUTBGQlF5eERRVUZETzB0QlF6TkdPenM3T3pzN08wbEJUMFFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU03UzBGRGVFUTdPenM3T3pzN096czdTVUZWUkN4VFFVRlRMRU5CUVVNc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZPMUZCUTNSRExFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1JVRkJSVHRaUVVNelFpeE5RVUZOTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1UwRkRkRUk3VVVGRFJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRlRU1zVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOcVJDeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1MwRkRjRUk3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxIVkNRVUYxUWl4RFFVRkRMRU5CUVVNN08wRkRibWhDZUVVN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRWEZDUVN4QlFVZEJPenM3UVVGSFFTeE5RVUZOTEdOQlFXTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRNMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUTNwQ0xFMUJRVTBzWVVGQllTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEY0VJc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEzQkNMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXpOQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEVkQlFVY3NRMEZCUXpzN1FVRkZOVUlzVFVGQlRVTXNhVUpCUVdVc1IwRkJSeXhQUVVGUExFTkJRVU03UVVGRGFFTXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eFRRVUZUTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hqUVVGakxFZEJRVWNzVFVGQlRTeERRVUZETzBGQlF6bENMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NWVUZCVlN4RFFVRkRPMEZCUTNSRExFMUJRVTBzVjBGQlZ5eEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTjRRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eEhRVUZITEVOQlFVTTdPMEZCUlhoQ0xFMUJRVTBzWVVGQllTeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTXhRaXhOUVVGTkxEQkNRVUV3UWl4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOMFF5eE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU01UWl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTXpRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eGhRVUZoTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXk5Q0xFMUJRVTBzUzBGQlN5eEhRVUZITEdGQlFXRXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOd1F5eE5RVUZOTEZOQlFWTXNSMEZCUnl4UFFVRlBMRU5CUVVNN08wRkJSVEZDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1IwRkJSeXhMUVVGTE8wbEJRM0pDTEU5QlFVOHNSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdRMEZEYUVNc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZkQlFWY3NSMEZCUnl4RFFVRkRMRWxCUVVrN1NVRkRja0lzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU12UWl4UFFVRlBMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hOUVVGTkxFbEJRVWtzWTBGQll5eERRVUZETzBOQlF6bEZMRU5CUVVNN096czdPenM3UVVGUFJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMR05CUVdNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6czdRVUZGZUVVc1RVRkJUU3h6UWtGQmMwSXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYcEVMRUZCWVVFN096czdPenM3T3p0QlFWTkJMRTFCUVUwc1lVRkJZU3hIUVVGSExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc2MwSkJRWE5DTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF6czdRVUZGZEVZc1RVRkJUU3hWUVVGVkxFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUzBGQlN5eExRVUZMTzBsQlEyaEVMRTFCUVUwc1UwRkJVeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZETjBJc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRmRCUVZjc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRFTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8wbEJRM0JDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8wbEJRekZDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRXRCUVVzc1IwRkJSeXhUUVVGVExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBsQlF6VkZMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVOHNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenREUVVOeVFpeERRVUZET3p0QlFVVkdMRTFCUVUwc1UwRkJVeXhIUVVGSExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFdEJRVXNzUzBGQlN6dEpRVU12UXl4TlFVRk5MRXRCUVVzc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTTdTVUZETjBJc1RVRkJUU3hsUVVGbExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeEVMRTFCUVUwc1ZVRkJWU3hIUVVGSExFTkJRVU1zUjBGQlJ5eGxRVUZsTEVOQlFVTTdTVUZEZGtNc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl3d1FrRkJNRUlzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEYWtVc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTJ4RkxFMUJRVTBzV1VGQldTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNhVUpCUVdsQ0xFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTTdPMGxCUlRORkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTI1RkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hEUVVGRE96dEpRVVV6UXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRNVUlzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4UFFVRlBMRU5CUVVNN1NVRkRPVUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4WlFVRlpMRU5CUVVNN1NVRkRha01zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGREwwSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGRGNFUXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZMSEZDUVVGeFFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTXhTQ3hQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0SlFVTjZTQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpsSkxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1IwRkJSeXhWUVVGVkxFTkJRVU1zUTBGQlF6dEpRVU0xUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpOSUxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUTBGQlF5eERRVUZETzBsQlF5OUZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUlVGQlJTeHhRa0ZCY1VJc1JVRkJSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03TzBsQlJYWkhMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1EwRkRja0lzUTBGQlF6czdRVUZGUml4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVONFF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFRRVUZUTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRja0lzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdTVUZEYUVRc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wTkJRM0pDTEVOQlFVTTdPenM3UVVGSlJpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMURMRkZCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUTJoRExFMUJRVTBzUlVGQlJTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRla0lzVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenRCUVZWNlFpeE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN08wbEJTM0JGTEZkQlFWY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzVVVGQlVTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUlVGQlJTeEZRVUZGTzFGQlEzQkVMRXRCUVVzc1JVRkJSU3hEUVVGRE96dFJRVVZTTEUxQlFVMHNVMEZCVXl4SFFVRkhSaXhyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXp0aFFVTjRSU3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0aFFVTmlMRk5CUVZNc1EwRkJReXhWUVVGVkxFVkJRVVVzUTBGQlF6dGhRVU4yUWl4TFFVRkxMRU5CUVVNN08xRkJSVmdzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03VVVGRE0wSXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhqUVVGakxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdPMUZCUlRkRExFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVZEJMR3RDUVVGUkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRFF5eHBRa0ZCWlN4RFFVRkRMRU5CUVVNN1lVRkRia1VzVTBGQlV5eERRVUZETEdGQlFXRXNRMEZCUXp0aFFVTjRRaXhMUVVGTExFTkJRVU03TzFGQlJWZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSMFFzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1VVRkJVU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dGhRVU01UlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dGhRVU5tTEZOQlFWTXNRMEZCUXl4blFrRkJaMElzUTBGQlF6dGhRVU16UWl4TFFVRkxMRU5CUVVNN08xRkJSVmdzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUjBFc2EwSkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdZVUZEZWtRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5pTEZOQlFWTXNRMEZCUXl4VFFVRlRMRU5CUVVNN1lVRkRjRUlzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8yRkJRM3BFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVTBGQlV5eERRVUZETzJGQlEzQkNMRXRCUVVzc1EwRkJRenM3VVVGRldDeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhRU3hyUWtGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRE8yRkJRM2hGTEZGQlFWRXNSVUZCUlR0aFFVTldMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU03WVVGRFppeExRVUZMTEVOQlFVTTdTMEZEWkRzN1NVRkZSQ3hYUVVGWExHdENRVUZyUWl4SFFVRkhPMUZCUXpWQ0xFOUJRVTg3V1VGRFNFTXNhVUpCUVdVN1dVRkRaaXhwUWtGQmFVSTdXVUZEYWtJc1kwRkJZenRaUVVOa0xHdENRVUZyUWp0WlFVTnNRaXhYUVVGWE8xbEJRMWdzVjBGQlZ6dFRRVU5rTEVOQlFVTTdTMEZEVERzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0UlFVTm9RaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRGJFTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU01UkRzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0UlFVTnVRaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wUXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETVVJN096czdPenM3TzBsQlVVUXNVMEZCVXl4SFFVRkhPMUZCUTFJc1QwRkJUeXhoUVVGaExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTI1RE96czdPenM3T3p0SlFWRkVMRkZCUVZFc1IwRkJSenRSUVVOUUxFOUJRVThzU1VGQlNTeERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMHRCUXpOQ096czdPenM3TzBsQlQwUXNTVUZCU1N4SlFVRkpMRWRCUVVjN1VVRkRVQ3hQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVTlETEZGQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wSTdTVUZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhSUVVGUkxFVkJRVVU3VVVGRGFFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1VVRkJVU3hGUVVGRk8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVORUxHbENRVUZsTEVOQlFVTXNRMEZCUXp0WlFVTjBRME1zVVVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03VTBGRGJrTXNUVUZCVFR0WlFVTklRU3hSUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRaUVVNelFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRSQ3hwUWtGQlpTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMU5CUTJoRU8wdEJRMG83T3pzN096czdPMGxCVVVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdTVUZEUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRFppeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhOUVVGTkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFRRVU51UXl4TlFVRk5PMWxCUTBnc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFRRVUZUTEVWQlFVVXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU03VTBGRGJrUTdTMEZEU2pzN096czdPenRKUVU5RUxFbEJRVWtzVjBGQlZ5eEhRVUZITzFGQlEyUXNUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpkRk8wbEJRMFFzU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTJZc1NVRkJTU3hKUVVGSkxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlExb3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRFpDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOcVFpeExRVUZMTzFsQlEwWXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEV0N4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU5rTzB0QlEwbzdPenM3T3pzN1NVRlBSQ3hqUVVGakxFZEJRVWM3VVVGRFlpeFBRVUZQTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRE8wdEJRM0JET3pzN096czdPMGxCVDBRc1NVRkJTU3hEUVVGRExFZEJRVWM3VVVGRFNpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGRrSTdTVUZEUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVU3VVVGRFVpeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU51UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096dEpRVTlFTEVsQlFVa3NRMEZCUXl4SFFVRkhPMUZCUTBvc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNaQ08wbEJRMFFzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFJc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRia0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGFFTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxGRkJRVkVzUjBGQlJ6dFJRVU5ZTEU5QlFVOHNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UWp0SlFVTkVMRWxCUVVrc1VVRkJVU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5tTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVObUxFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1UwRkRjRU1zVFVGQlRUdFpRVU5JTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzU1VGQlNTeEhRVUZITEdOQlFXTXNRMEZCUXp0WlFVTnFSQ3hUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVlVGQlZTeEZRVUZGTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03VTBGRGNrUTdTMEZEU2pzN096czdPenM3U1VGUlJDeFBRVUZQTEVkQlFVYzdVVUZEVGl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFWVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRVZCUVVVc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6ZERMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNaVUZCWlN4RlFVRkZPMmRDUVVNeFF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YVVKQlExbzdZVUZEU2l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOUU8wdEJRMG83T3pzN096czdPenRKUVZORUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEV0N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFsQlEzSkNMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNZMEZCWXl4RlFVRkZPMmRDUVVONlF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YjBKQlExUXNUVUZCVFR0cFFrRkRWRHRoUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlExQTdTMEZEU2pzN096czdPenRKUVU5RUxFMUJRVTBzUjBGQlJ6dFJRVU5NTEU5QlFVOHNTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03UzBGREwwSTdPenM3T3pzN096dEpRVk5FTEZOQlFWTXNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRaQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlR0WlFVTTNReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSVHRuUWtGRGJFUXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzI5Q1FVTlVMRTFCUVUwN2FVSkJRMVE3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3T3pzN096dEpRVmxFTEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhGUVVGRkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZPMUZCUTNKRUxFMUJRVTBzUzBGQlN5eEhRVUZITEU5QlFVOHNSMEZCUnl4aFFVRmhMRU5CUVVNN1VVRkRkRU1zVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVNelFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRemRDTEUxQlFVMHNVMEZCVXl4SFFVRkhMRkZCUVZFc1IwRkJSeXhMUVVGTExFTkJRVU03TzFGQlJXNURMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPenRSUVVVelFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRaUVVObUxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVOMlJEczdVVUZGUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTzFsQlEzSkNMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGVFTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka01zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEZWtRN08xRkJSVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN08xRkJSVFZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRWxCUVVrN1VVRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEwb3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGRFUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzQkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRkRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM0pFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVONlJDeE5RVUZOTzFOQlExUTdVVUZEUkN4UlFVRlJPMU5CUTFBN096dFJRVWRFTEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU14UXp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1UwRkJVeXhGUVVGRkxHbENRVUZwUWl4RFFVRkRMRU5CUVVNN08wRkRNV1l6UkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVWQk96czdPenRCUVV0QkxFMUJRVTBzZDBKQlFYZENMRWRCUVVjc1kwRkJZeXhYUVVGWExFTkJRVU03T3pzN08wbEJTM1pFTEZkQlFWY3NSMEZCUnp0UlFVTldMRXRCUVVzc1JVRkJSU3hEUVVGRE8wdEJRMWc3TzBsQlJVUXNhVUpCUVdsQ0xFZEJRVWM3VVVGRGFFSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVTdXVUZETVVJc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8xTkJRek5ET3p0UlFVVkVMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4blFrRkJaMElzUlVGQlJTeERRVUZETEV0QlFVc3NTMEZCU3pzN1dVRkZMME1zU1VGQlNTeERRVUZETEU5QlFVODdhVUpCUTFBc1RVRkJUU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0cFFrRkRNME1zVDBGQlR5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF6dFRRVU5zUXl4RFFVRkRMRU5CUVVNN1MwRkRUanM3U1VGRlJDeHZRa0ZCYjBJc1IwRkJSenRMUVVOMFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVDBGQlR5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRka1E3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEdsQ1FVRnBRaXhGUVVGRkxIZENRVUYzUWl4RFFVRkRMRU5CUVVNN08wRkROMFF4UlRzN096czdPenM3T3pzN096czdPenM3TzBGQmEwSkJMRUZCUzBFc1RVRkJUU3hEUVVGRExHRkJRV0VzUjBGQlJ5eE5RVUZOTEVOQlFVTXNZVUZCWVN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGVrUXNUMEZCVHl4RlFVRkZMRTlCUVU4N1NVRkRhRUlzVDBGQlR5eEZRVUZGTEZWQlFWVTdTVUZEYmtJc1QwRkJUeXhGUVVGRkxESkNRVUV5UWp0SlFVTndReXhaUVVGWkxFVkJRVVU3VVVGRFZpeDFRa0ZCZFVJc1JVRkJSU3gxUWtGQmRVSTdVVUZEYUVRc2FVSkJRV2xDTEVWQlFVVXNhVUpCUVdsQ08xRkJRM0JETEc5Q1FVRnZRaXhGUVVGRkxHOUNRVUZ2UWp0UlFVTXhReXgzUWtGQmQwSXNSVUZCUlN4M1FrRkJkMEk3UzBGRGNrUTdTVUZEUkN4SFFVRkhMRVZCUVVVc2FVSkJRV2xDTzBsQlEzUkNMRTFCUVUwc1JVRkJSU3h2UWtGQmIwSTdTVUZETlVJc1ZVRkJWU3hGUVVGRkxIZENRVUYzUWp0SlFVTndReXhUUVVGVExFVkJRVVVzZFVKQlFYVkNPME5CUTNKRExFTkJRVU1zUTBGQlF5SjkifQ==
