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
// The names of the (observed) attributes of the TopPlayer.
const COLOR_ATTRIBUTE = "color";
const NAME_ATTRIBUTE = "name";
const SCORE_ATTRIBUTE = "score";
const HAS_TURN_ATTRIBUTE = "has-turn";

// The private properties of the TopPlayer 
const _color = new WeakMap();
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
 * @mixes module:mixin/ReadOnlyAttributes~ReadOnlyAttributes
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

window.customElements.define("top-player", TopPlayer);

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
 * TopDie is the "top-die" custom [HTML
 * element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) representing a die
 * on the dice board.
 *
 * @extends HTMLElement
 * @mixes module:mixin/ReadOnlyAttributes~ReadOnlyAttributes
 */
const TopDie = class extends ReadOnlyAttributes(HTMLElement) {

    /**
     * Create a new TopDie.
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

window.customElements.define("top-die", TopDie);

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
     * @type {TopPlayer[]}
     */
    get players() {
        return this.querySelector("top-player-list").players;
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
     * @param {TopPlayer} [heldBy] - The player holding the die.
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

};

window.customElements.define("top-dice-board", TopDiceBoard);

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
        return [...this.getElementsByTagName("top-player")];
    }
};

window.customElements.define("top-player-list", TopPlayerList);

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
    TopDiceBoard: TopDiceBoard,
    TopDie: TopDie,
    TopPlayer: TopPlayer,
    TopPlayerList: TopPlayerList
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcERpZS5qcyIsIlRvcERpY2VCb2FyZC5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgRlVMTF9DSVJDTEVfSU5fREVHUkVFUyA9IDM2MDtcblxuY29uc3QgcmFuZG9taXplQ2VudGVyID0gKG4pID0+IHtcbiAgICByZXR1cm4gKDAuNSA8PSBNYXRoLnJhbmRvbSgpID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbCkuY2FsbCgwLCBuKTtcbn07XG5cbi8vIFByaXZhdGUgZmllbGRzXG5jb25zdCBfd2lkdGggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlaWdodCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29scyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm93cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGljZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGllU2l6ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGlzcGVyc2lvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRlID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmlkTGF5b3V0Q29uZmlndXJhdGlvblxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy53aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoIG9mIHRoaXNcbiAqIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLjtcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuaGVpZ2h0XSAtIFRoZSBtaW5pbWFsIGhlaWdodCBvZlxuICogdGhpcyBHcmlkTGF5b3V0IGluIHBpeGVscy4uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpc3BlcnNpb24gLSBUaGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIG9mIHRoZVxuICogbGF5b3V0IGEgZGllIGNhbiBiZSBsYXlvdXQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAqL1xuXG4vKipcbiAqIEdyaWRMYXlvdXQgaGFuZGxlcyBsYXlpbmcgb3V0IHRoZSBkaWNlIG9uIGEgRGljZUJvYXJkLlxuICovXG5jb25zdCBHcmlkTGF5b3V0ID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0dyaWRMYXlvdXRDb25maWd1cmF0aW9ufSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgR3JpZExheW91dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgZGlzcGVyc2lvbixcbiAgICAgICAgZGllU2l6ZVxuICAgIH0gPSB7fSkge1xuICAgICAgICBfZGljZS5zZXQodGhpcywgW10pO1xuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgMSk7XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIDApO1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICB0aGlzLmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBXaWR0aCA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn0gXG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gX3dpZHRoLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgd2lkdGgodykge1xuICAgICAgICBpZiAoMCA+IHcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFdpZHRoIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7d30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCB3KTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgSGVpZ2h0ID49IDBcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWlnaHQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBoZWlnaHQoaCkge1xuICAgICAgICBpZiAoMCA+IGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYEhlaWdodCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2h9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIGgpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVHcmlkKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgb24gdGhpcyBHcmlkTGF5b3V0LiBUaGlzXG4gICAgICogbnVtYmVyIGlzID49IDAuIFJlYWQgb25seS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IG1heGltdW1OdW1iZXJPZkRpY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb2xzICogdGhpcy5fcm93cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC4gVGhlIGRpc3BlcnNpb24gbGV2ZWxcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBkaWNlIGNhbiBiZSBsYXlvdXQuIFVzZSAxIGZvciBhXG4gICAgICogdGlnaHQgcGFja2VkIGxheW91dC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgRGlzcGVyc2lvbiA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGlzcGVyc2lvbihkKSB7XG4gICAgICAgIGlmICgwID4gZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgRGlzcGVyc2lvbiBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2R9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5zZXQodGhpcywgZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIERpZVNpemUgPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBfZGllU2l6ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpZVNpemUoZHMpIHtcbiAgICAgICAgaWYgKDAgPj0gZHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYGRpZVNpemUgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDEsIGdvdCAnJHtkc30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2RpZVNpemUuc2V0KHRoaXMsIGRzKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgZ2V0IHJvdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgciA9IF9yb3RhdGUuZ2V0KHRoaXMpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkID09PSByID8gdHJ1ZSA6IHI7XG4gICAgfVxuXG4gICAgc2V0IHJvdGF0ZShyKSB7XG4gICAgICAgIF9yb3RhdGUuc2V0KHRoaXMsIHIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2Ygcm93cywgMCA8IHJvd3MuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX3Jvd3MoKSB7XG4gICAgICAgIHJldHVybiBfcm93cy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiBjb2x1bW5zIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiBjb2x1bW5zLCAwIDwgY29sdW1ucy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfY29scygpIHtcbiAgICAgICAgcmV0dXJuIF9jb2xzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2VudGVyIGNlbGwgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY2VudGVyIChyb3csIGNvbCkuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NlbnRlcigpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gcmFuZG9taXplQ2VudGVyKHRoaXMuX3Jvd3MgLyAyKSAtIDE7XG4gICAgICAgIGNvbnN0IGNvbCA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9jb2xzIC8gMikgLSAxO1xuXG4gICAgICAgIHJldHVybiB7cm93LCBjb2x9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExheW91dCBkaWNlIG9uIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOkRpZX5EaWVbXX0gZGljZSAtIFRoZSBkaWNlIHRvIGxheW91dCBvbiB0aGlzIExheW91dC5cbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6RGllfkRpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7bW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvcn5Db25maWd1cmF0aW9uRXJyb3J9IFRoZSBudW1iZXIgb2ZcbiAgICAgKiBkaWNlIHNob3VsZCBub3QgZXhjZWVkIHRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoaXMgTGF5b3V0IGNhblxuICAgICAqIGxheW91dC5cbiAgICAgKi9cbiAgICBsYXlvdXQoZGljZSkge1xuICAgICAgICBpZiAoZGljZS5sZW5ndGggPiB0aGlzLm1heGltdW1OdW1iZXJPZkRpY2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFRoZSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgaXMgJHt0aGlzLm1heGltdW1OdW1iZXJPZkRpY2V9LCBnb3QgJHtkaWNlLmxlbmdodH0gZGljZSBpbnN0ZWFkLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxyZWFkeUxheW91dERpY2UgPSBbXTtcbiAgICAgICAgY29uc3QgZGljZVRvTGF5b3V0ID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgaWYgKGRpZS5oYXNDb29yZGluYXRlcygpICYmIGRpZS5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIC8vIERpY2UgdGhhdCBhcmUgYmVpbmcgaGVsZCBhbmQgaGF2ZSBiZWVuIGxheW91dCBiZWZvcmUgc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0aGVpciBjdXJyZW50IGNvb3JkaW5hdGVzIGFuZCByb3RhdGlvbi4gSW4gb3RoZXIgd29yZHMsXG4gICAgICAgICAgICAgICAgLy8gdGhlc2UgZGljZSBhcmUgc2tpcHBlZC5cbiAgICAgICAgICAgICAgICBhbHJlYWR5TGF5b3V0RGljZS5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY2VUb0xheW91dC5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1pbihkaWNlLmxlbmd0aCAqIHRoaXMuZGlzcGVyc2lvbiwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlQ2VsbHMgPSB0aGlzLl9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZVRvTGF5b3V0KSB7XG4gICAgICAgICAgICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGF2YWlsYWJsZUNlbGxzLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCByYW5kb21DZWxsID0gYXZhaWxhYmxlQ2VsbHNbcmFuZG9tSW5kZXhdO1xuICAgICAgICAgICAgYXZhaWxhYmxlQ2VsbHMuc3BsaWNlKHJhbmRvbUluZGV4LCAxKTtcblxuICAgICAgICAgICAgZGllLmNvb3JkaW5hdGVzID0gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhyYW5kb21DZWxsKTtcbiAgICAgICAgICAgIGRpZS5yb3RhdGlvbiA9IHRoaXMucm90YXRlID8gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogRlVMTF9DSVJDTEVfSU5fREVHUkVFUykgOiBudWxsO1xuICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2RpY2Uuc2V0KHRoaXMsIGFscmVhZHlMYXlvdXREaWNlKTtcblxuICAgICAgICByZXR1cm4gYWxyZWFkeUxheW91dERpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSBhIGxpc3Qgd2l0aCBhdmFpbGFibGUgY2VsbHMgdG8gcGxhY2UgZGljZSBvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXggLSBUaGUgbnVtYmVyIGVtcHR5IGNlbGxzIHRvIGNvbXB1dGUuXG4gICAgICogQHBhcmFtIHtEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgd2l0aCBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge05VbWJlcltdfSBUaGUgbGlzdCBvZiBhdmFpbGFibGUgY2VsbHMgcmVwcmVzZW50ZWQgYnkgdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NvbXB1dGVBdmFpbGFibGVDZWxscyhtYXgsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgbGV0IGxldmVsID0gMDtcbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBNYXRoLm1pbih0aGlzLl9yb3dzLCB0aGlzLl9jb2xzKTtcblxuICAgICAgICB3aGlsZSAoYXZhaWxhYmxlLnNpemUgPCBtYXggJiYgbGV2ZWwgPCBtYXhMZXZlbCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjZWxsIG9mIHRoaXMuX2NlbGxzT25MZXZlbChsZXZlbCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodW5kZWZpbmVkICE9PSBjZWxsICYmIHRoaXMuX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGUuYWRkKGNlbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV2ZWwrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGF2YWlsYWJsZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIGFsbCBjZWxscyBvbiBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbCAtIFRoZSBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC4gMFxuICAgICAqIGluZGljYXRlcyB0aGUgY2VudGVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U2V0PE51bWJlcj59IHRoZSBjZWxscyBvbiB0aGUgbGV2ZWwgaW4gdGhpcyBsYXlvdXQgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGVpciBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbHNPbkxldmVsKGxldmVsKSB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gbmV3IFNldCgpO1xuICAgICAgICBjb25zdCBjZW50ZXIgPSB0aGlzLl9jZW50ZXI7XG5cbiAgICAgICAgaWYgKDAgPT09IGxldmVsKSB7XG4gICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKGNlbnRlcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gY2VudGVyLnJvdyAtIGxldmVsOyByb3cgPD0gY2VudGVyLnJvdyArIGxldmVsOyByb3crKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sIC0gbGV2ZWx9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93LCBjb2w6IGNlbnRlci5jb2wgKyBsZXZlbH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gY2VudGVyLmNvbCAtIGxldmVsICsgMTsgY29sIDwgY2VudGVyLmNvbCArIGxldmVsOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyAtIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93OiBjZW50ZXIucm93ICsgbGV2ZWwsIGNvbH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjZWxscztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIGNlbGwgY29udGFpbiBhIGNlbGwgZnJvbSBhbHJlYWR5TGF5b3V0RGljZT9cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjZWxsIC0gQSBjZWxsIGluIGxheW91dCByZXByZXNlbnRlZCBieSBhIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge0RpZVtdfSBhbHJlYWR5TGF5b3V0RGljZSAtIEEgbGlzdCBvZiBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBjZWxsIGRvZXMgbm90IGNvbnRhaW4gYSBkaWUuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbElzRW1wdHkoY2VsbCwgYWxyZWFkeUxheW91dERpY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gYWxyZWFkeUxheW91dERpY2UuZmluZChkaWUgPT4gY2VsbCA9PT0gdGhpcy5fY29vcmRpbmF0ZXNUb051bWJlcihkaWUuY29vcmRpbmF0ZXMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgbnVtYmVyIHRvIGEgY2VsbCAocm93LCBjb2wpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiAtIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIGEgY2VsbFxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybiB0aGUgY2VsbCAoe3JvdywgY29sfSkgY29ycmVzcG9uZGluZyBuLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX251bWJlclRvQ2VsbChuKSB7XG4gICAgICAgIHJldHVybiB7cm93OiBNYXRoLnRydW5jKG4gLyB0aGlzLl9jb2xzKSwgY29sOiBuICUgdGhpcy5fY29sc307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgdG8gYSBudW1iZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBpdHMgbnVtYmVyLlxuICAgICAqIEByZXR1cm4ge051bWJlcnx1bmRlZmluZWR9IFRoZSBudW1iZXIgY29ycmVzcG9uZGluZyB0byB0aGUgY2VsbC5cbiAgICAgKiBSZXR1cm5zIHVuZGVmaW5lZCB3aGVuIHRoZSBjZWxsIGlzIG5vdCBvbiB0aGUgbGF5b3V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvTnVtYmVyKHtyb3csIGNvbH0pIHtcbiAgICAgICAgaWYgKDAgPD0gcm93ICYmIHJvdyA8IHRoaXMuX3Jvd3MgJiYgMCA8PSBjb2wgJiYgY29sIDwgdGhpcy5fY29scykge1xuICAgICAgICAgICAgcmV0dXJuIHJvdyAqIHRoaXMuX2NvbHMgKyBjb2w7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgY2VsbCByZXByZXNlbnRlZCBieSBpdHMgbnVtYmVyIHRvIHRoZWlyIGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvb3JkaW5hdGVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGlzIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0Nvb3JkaW5hdGVzKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NlbGxUb0Nvb3Jkcyh0aGlzLl9udW1iZXJUb0NlbGwobikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBwYWlyIG9mIGNvb3JkaW5hdGVzIHRvIGEgbnVtYmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkcyAtIFRoZSBjb29yZGluYXRlcyB0byBjb252ZXJ0XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgY29vcmRpbmF0ZXMgY29udmVydGVkIHRvIGEgbnVtYmVyLiBJZlxuICAgICAqIHRoZSBjb29yZGluYXRlcyBhcmUgbm90IG9uIHRoaXMgbGF5b3V0LCB0aGUgbnVtYmVyIGlzIHVuZGVmaW5lZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb29yZGluYXRlc1RvTnVtYmVyKGNvb3Jkcykge1xuICAgICAgICBjb25zdCBuID0gdGhpcy5fY2VsbFRvTnVtYmVyKHRoaXMuX2Nvb3Jkc1RvQ2VsbChjb29yZHMpKTtcbiAgICAgICAgaWYgKDAgPD0gbiAmJiBuIDwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNuYXAgKHgseSkgdG8gdGhlIGNsb3Nlc3QgY2VsbCBpbiB0aGlzIExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkaWVjb29yZGluYXRlIC0gVGhlIGNvb3JkaW5hdGUgdG8gZmluZCB0aGUgY2xvc2VzdCBjZWxsXG4gICAgICogZm9yLlxuICAgICAqIEBwYXJhbSB7RGllfSBbZGllY29vcmRpbmF0LmRpZSA9IG51bGxdIC0gVGhlIGRpZSB0byBzbmFwIHRvLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnggLSBUaGUgeC1jb29yZGluYXRlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnkgLSBUaGUgeS1jb29yZGluYXRlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fG51bGx9IFRoZSBjb29yZGluYXRlIG9mIHRoZSBjZWxsIGNsb3Nlc3QgdG8gKHgsIHkpLlxuICAgICAqIE51bGwgd2hlbiBubyBzdWl0YWJsZSBjZWxsIGlzIG5lYXIgKHgsIHkpXG4gICAgICovXG4gICAgc25hcFRvKHtkaWUgPSBudWxsLCB4LCB5fSkge1xuICAgICAgICBjb25zdCBjb3JuZXJDZWxsID0ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29ybmVyID0gdGhpcy5fY2VsbFRvQ29vcmRzKGNvcm5lckNlbGwpO1xuICAgICAgICBjb25zdCB3aWR0aEluID0gY29ybmVyLnggKyB0aGlzLmRpZVNpemUgLSB4O1xuICAgICAgICBjb25zdCB3aWR0aE91dCA9IHRoaXMuZGllU2l6ZSAtIHdpZHRoSW47XG4gICAgICAgIGNvbnN0IGhlaWdodEluID0gY29ybmVyLnkgKyB0aGlzLmRpZVNpemUgLSB5O1xuICAgICAgICBjb25zdCBoZWlnaHRPdXQgPSB0aGlzLmRpZVNpemUgLSBoZWlnaHRJbjtcblxuICAgICAgICBjb25zdCBxdWFkcmFudHMgPSBbe1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKGNvcm5lckNlbGwpLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoSW4gKiBoZWlnaHRJblxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3csXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93ICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IGNvcm5lckNlbGwuY29sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0T3V0XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0T3V0XG4gICAgICAgIH1dO1xuXG4gICAgICAgIGNvbnN0IHNuYXBUbyA9IHF1YWRyYW50c1xuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgb24gdGhlIGxheW91dFxuICAgICAgICAgICAgLmZpbHRlcigocXVhZHJhbnQpID0+IHVuZGVmaW5lZCAhPT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG5vdCBhbHJlYWR5IHRha2VuIGV4Y2VwdCBieSBpdHNlbGZcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiAoXG4gICAgICAgICAgICAgICAgbnVsbCAhPT0gZGllICYmIHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSA9PT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgICAgICB8fCB0aGlzLl9jZWxsSXNFbXB0eShxdWFkcmFudC5xLCBfZGljZS5nZXQodGhpcykpKVxuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgY292ZXJlZCBieSB0aGUgZGllIHRoZSBtb3N0XG4gICAgICAgICAgICAucmVkdWNlKFxuICAgICAgICAgICAgICAgIChtYXhRLCBxdWFkcmFudCkgPT4gcXVhZHJhbnQuY292ZXJhZ2UgPiBtYXhRLmNvdmVyYWdlID8gcXVhZHJhbnQgOiBtYXhRLFxuICAgICAgICAgICAgICAgIHtxOiB1bmRlZmluZWQsIGNvdmVyYWdlOiAtMX1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCAhPT0gc25hcFRvLnEgPyB0aGlzLl9udW1iZXJUb0Nvb3JkaW5hdGVzKHNuYXBUby5xKSA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBkaWUgYXQgcG9pbnQgKHgsIHkpO1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQb2ludH0gcG9pbnQgLSBUaGUgcG9pbnQgaW4gKHgsIHkpIGNvb3JkaW5hdGVzXG4gICAgICogQHJldHVybiB7RGllfG51bGx9IFRoZSBkaWUgdW5kZXIgY29vcmRpbmF0ZXMgKHgsIHkpIG9yIG51bGwgaWYgbm8gZGllXG4gICAgICogaXMgYXQgdGhlIHBvaW50LlxuICAgICAqL1xuICAgIGdldEF0KHBvaW50ID0ge3g6IDAsIHk6IDB9KSB7XG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIF9kaWNlLmdldCh0aGlzKSkge1xuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb25zdCB4Rml0ID0geCA8PSBwb2ludC54ICYmIHBvaW50LnggPD0geCArIHRoaXMuZGllU2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IHlGaXQgPSB5IDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB5ICsgdGhpcy5kaWVTaXplO1xuXG4gICAgICAgICAgICBpZiAoeEZpdCAmJiB5Rml0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB0aGUgZ3JpZCBzaXplIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgLSBUaGUgbWluaW1hbCBoZWlnaHRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZUdyaWQod2lkdGgsIGhlaWdodCkge1xuICAgICAgICBfY29scy5zZXQodGhpcywgTWF0aC5mbG9vcih3aWR0aCAvIHRoaXMuZGllU2l6ZSkpO1xuICAgICAgICBfcm93cy5zZXQodGhpcywgTWF0aC5mbG9vcihoZWlnaHQgLyB0aGlzLmRpZVNpemUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgKHJvdywgY29sKSBjZWxsIHRvICh4LCB5KSBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY29vcmRpbmF0ZXMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvQ29vcmRzKHtyb3csIGNvbH0pIHtcbiAgICAgICAgcmV0dXJuIHt4OiBjb2wgKiB0aGlzLmRpZVNpemUsIHk6IHJvdyAqIHRoaXMuZGllU2l6ZX07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCAoeCwgeSkgY29vcmRpbmF0ZXMgdG8gYSAocm93LCBjb2wpIGNlbGwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29vcmRpbmF0ZXMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydCB0byBhIGNlbGwuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY29ycmVzcG9uZGluZyBjZWxsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRzVG9DZWxsKHt4LCB5fSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuZXhwb3J0IHtHcmlkTGF5b3V0fTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZSBtaXhpbi9SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuXG4vKlxuICogQ29udmVydCBhbiBIVE1MIGF0dHJpYnV0ZSB0byBhbiBpbnN0YW5jZSdzIHByb3BlcnR5LiBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBhdHRyaWJ1dGUncyBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5J3MgbmFtZS4gRm9yIGV4YW1wbGUsIFwibXktYXR0clwiXG4gKiB3aWxsIGJlIGNvbnZlcnRlZCB0byBcIm15QXR0clwiLCBhbmQgXCJkaXNhYmxlZFwiIHRvIFwiZGlzYWJsZWRcIi5cbiAqL1xuY29uc3QgYXR0cmlidXRlMnByb3BlcnR5ID0gKG5hbWUpID0+IHtcbiAgICBjb25zdCBbZmlyc3QsIC4uLnJlc3RdID0gbmFtZS5zcGxpdChcIi1cIik7XG4gICAgcmV0dXJuIGZpcnN0ICsgcmVzdC5tYXAod29yZCA9PiB3b3JkLnNsaWNlKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKS5qb2luKCk7XG59O1xuXG4vKipcbiAqIE1peGluIHtAbGluayBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc30gdG8gYSBjbGFzcy5cbiAqXG4gKiBAcGFyYW0geyp9IFN1cCAtIFRoZSBjbGFzcyB0byBtaXggaW50by5cbiAqIEByZXR1cm4ge21vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIG1vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzXG4gICAgICovXG4gICAgY2xhc3MgZXh0ZW5kcyBTdXAge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYW4gb2JzZXJ2ZWQgYXR0cmlidXRlJ3MgdmFsdWUgaXNcbiAgICAgICAgICogY2hhbmdlZC4gSWYgdGhlIEhUTUxFbGVtZW50IGlzIGNvbm5lY3RlZCB0byB0aGUgRE9NLCB0aGUgYXR0cmlidXRlXG4gICAgICAgICAqIHZhbHVlIGNhbiBvbmx5IGJlIHNldCB0byB0aGUgY29ycmVzcG9uZGluZyBIVE1MRWxlbWVudCdzIHByb3BlcnR5LlxuICAgICAgICAgKiBJbiBlZmZlY3QsIHRoaXMgbWFrZXMgdGhpcyBIVE1MRWxlbWVudCdzIGF0dHJpYnV0ZXMgcmVhZC1vbmx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgaWYgYW4gSFRNTEVsZW1lbnQgaGFzIGFuIGF0dHJpYnV0ZSBcInhcIiBhbmRcbiAgICAgICAgICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBcInhcIiwgdGhlbiBjaGFuZ2luZyB0aGUgdmFsdWUgXCJ4XCIgdG8gXCI1XCJcbiAgICAgICAgICogd2lsbCBvbmx5IHdvcmsgd2hlbiBgdGhpcy54ID09PSA1YC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG9sZFZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG9sZCB2YWx1ZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG5ldyB2YWx1ZS5cbiAgICAgICAgICovXG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIEFsbCBhdHRyaWJ1dGVzIGFyZSBtYWRlIHJlYWQtb25seSB0byBwcmV2ZW50IGNoZWF0aW5nIGJ5IGNoYW5naW5nXG4gICAgICAgICAgICAvLyB0aGUgYXR0cmlidXRlIHZhbHVlcy4gT2YgY291cnNlLCB0aGlzIGlzIGJ5IG5vXG4gICAgICAgICAgICAvLyBndWFyYW50ZWUgdGhhdCB1c2VycyB3aWxsIG5vdCBjaGVhdCBpbiBhIGRpZmZlcmVudCB3YXkuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IGF0dHJpYnV0ZTJwcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCAmJiBuZXdWYWx1ZSAhPT0gYCR7dGhpc1twcm9wZXJ0eV19YCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIHRoaXNbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbmV4cG9ydCB7XG4gICAgUmVhZE9ubHlBdHRyaWJ1dGVzXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5jb25zdCBWYWxpZGF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRpb25FcnJvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtWYWxpZGF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL1ZhbGlkYXRpb25FcnJvci5qc1wiO1xuXG5jb25zdCBfdmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RlZmF1bHRWYWx1ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZXJyb3JzID0gbmV3IFdlYWtNYXAoKTtcblxuY29uc3QgVHlwZVZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3Rvcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzID0gW119KSB7XG4gICAgICAgIF92YWx1ZS5zZXQodGhpcywgdmFsdWUpO1xuICAgICAgICBfZGVmYXVsdFZhbHVlLnNldCh0aGlzLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICBfZXJyb3JzLnNldCh0aGlzLCBlcnJvcnMpO1xuICAgIH1cblxuICAgIGdldCBvcmlnaW4oKSB7XG4gICAgICAgIHJldHVybiBfdmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMub3JpZ2luIDogX2RlZmF1bHRWYWx1ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IGVycm9ycygpIHtcbiAgICAgICAgcmV0dXJuIF9lcnJvcnMuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBpc1ZhbGlkKCkge1xuICAgICAgICByZXR1cm4gMCA+PSB0aGlzLmVycm9ycy5sZW5ndGg7XG4gICAgfVxuXG4gICAgZGVmYXVsdFRvKG5ld0RlZmF1bHQpIHtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgbmV3RGVmYXVsdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIF9jaGVjayh7cHJlZGljYXRlLCBiaW5kVmFyaWFibGVzID0gW10sIEVycm9yVHlwZSA9IFZhbGlkYXRpb25FcnJvcn0pIHtcbiAgICAgICAgY29uc3QgcHJvcG9zaXRpb24gPSBwcmVkaWNhdGUuYXBwbHkodGhpcywgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgIGlmICghcHJvcG9zaXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yVHlwZSh0aGlzLnZhbHVlLCBiaW5kVmFyaWFibGVzKTtcbiAgICAgICAgICAgIC8vY29uc29sZS53YXJuKGVycm9yLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgUGFyc2VFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFBhcnNlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgSW52YWxpZFR5cGVFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludmFsaWRUeXBlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgSU5URUdFUl9ERUZBVUxUX1ZBTFVFID0gMDtcbmNvbnN0IEludGVnZXJUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IElOVEVHRVJfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkVmFsdWUgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocGFyc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZWRWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgbGFyZ2VyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA+PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNtYWxsZXJUaGFuKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4pID0+IHRoaXMub3JpZ2luIDw9IG4sXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbl1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmV0d2VlbihuLCBtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuLCBtKSA9PiB0aGlzLmxhcmdlclRoYW4obikgJiYgdGhpcy5zbWFsbGVyVGhhbihtKSxcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuLCBtXVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludGVnZXJUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBTVFJJTkdfREVGQVVMVF9WQUxVRSA9IFwiXCI7XG5jb25zdCBTdHJpbmdUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTVFJJTkdfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIG5vdEVtcHR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiBcIlwiICE9PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFN0cmluZ1R5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuLy9pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBDT0xPUl9ERUZBVUxUX1ZBTFVFID0gXCJibGFja1wiO1xuY29uc3QgQ29sb3JUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIENvbG9yVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBCT09MRUFOX0RFRkFVTFRfVkFMVUUgPSBmYWxzZTtcbmNvbnN0IEJvb2xlYW5UeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IEJPT0xFQU5fREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgQm9vbGVhbikge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgvdHJ1ZS9pLnRlc3QoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvZmFsc2UvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGlzVHJ1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gdHJ1ZSA9PT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaXNGYWxzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gZmFsc2UgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgQm9vbGVhblR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7SW50ZWdlclR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0ludGVnZXJUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1N0cmluZ1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1N0cmluZ1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Q29sb3JUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Db2xvclR5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Qm9vbGVhblR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0Jvb2xlYW5UeXBlVmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IFZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBib29sZWFuKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQm9vbGVhblR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIGNvbG9yKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBpbnRlZ2VyKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlclR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIHN0cmluZyhpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmluZ1R5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxufTtcblxuY29uc3QgVmFsaWRhdG9yU2luZ2xldG9uID0gbmV3IFZhbGlkYXRvcigpO1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRvclNpbmdsZXRvbiBhcyB2YWxpZGF0ZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuLy8gVGhlIG5hbWVzIG9mIHRoZSAob2JzZXJ2ZWQpIGF0dHJpYnV0ZXMgb2YgdGhlIFRvcFBsYXllci5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IE5BTUVfQVRUUklCVVRFID0gXCJuYW1lXCI7XG5jb25zdCBTQ09SRV9BVFRSSUJVVEUgPSBcInNjb3JlXCI7XG5jb25zdCBIQVNfVFVSTl9BVFRSSUJVVEUgPSBcImhhcy10dXJuXCI7XG5cbi8vIFRoZSBwcml2YXRlIHByb3BlcnRpZXMgb2YgdGhlIFRvcFBsYXllciBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXIgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBuYW1lIGF0dHJpYnV0ZSBhcmUgdHJlYXRlZCBhc1xuICogdGhlIHNhbWUgcGxheWVyLlxuICpcbiAqIEluIGdlbmVyYWwgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCBubyB0d28gcGxheWVycyBkbyBoYXZlIHRoZSBzYW1lIGNvbG9yLFxuICogYWx0aG91Z2ggaXQgaXMgbm90IHVuY29uY2VpdmFibGUgdGhhdCBjZXJ0YWluIGRpY2UgZ2FtZXMgaGF2ZSBwbGF5ZXJzIHdvcmtcbiAqIGluIHRlYW1zIHdoZXJlIGl0IHdvdWxkIG1ha2Ugc2Vuc2UgZm9yIHR3byBvciBtb3JlIGRpZmZlcmVudCBwbGF5ZXJzIHRvXG4gKiBoYXZlIHRoZSBzYW1lIGNvbG9yLlxuICpcbiAqIFRoZSBuYW1lIGFuZCBjb2xvciBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZC4gVGhlIHNjb3JlIGFuZCBoYXMtdHVyblxuICogYXR0cmlidXRlcyBhcmUgbm90LlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wUGxheWVyID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXIsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBwbGF5ZXIgd2l0aCBhIHR1cm5cbiAgICAgKi9cbiAgICBzdGFydFR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6c3RhcnQtdHVyblwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1wbGF5ZXJcIiwgVG9wUGxheWVyKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzeXN0ZW0gcGxheWVyLiBEaWNlIGFyZSB0aHJvd24gYnkgYSBwbGF5ZXIuIEZvciBzaXR1YXRpb25zXG4gKiB3aGVyZSB5b3Ugd2FudCB0byByZW5kZXIgYSBidW5jaCBvZiBkaWNlIHdpdGhvdXQgbmVlZGluZyB0aGUgY29uY2VwdCBvZiBQbGF5ZXJzXG4gKiB0aGlzIERFRkFVTFRfU1lTVEVNX1BMQVlFUiBjYW4gYmUgYSBzdWJzdGl0dXRlLiBPZiBjb3Vyc2UsIGlmIHlvdSdkIGxpa2UgdG9cbiAqIGNoYW5nZSB0aGUgbmFtZSBhbmQvb3IgdGhlIGNvbG9yLCBjcmVhdGUgYW5kIHVzZSB5b3VyIG93biBcInN5c3RlbSBwbGF5ZXJcIi5cbiAqIEBjb25zdFxuICovXG5jb25zdCBERUZBVUxUX1NZU1RFTV9QTEFZRVIgPSBuZXcgVG9wUGxheWVyKHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXIsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuLy9pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuY29uc3QgQ0lSQ0xFX0RFR1JFRVMgPSAzNjA7IC8vIGRlZ3JlZXNcbmNvbnN0IE5VTUJFUl9PRl9QSVBTID0gNjsgLy8gRGVmYXVsdCAvIHJlZ3VsYXIgc2l4IHNpZGVkIGRpZSBoYXMgNiBwaXBzIG1heGltdW0uXG5jb25zdCBERUZBVUxUX0NPTE9SID0gXCJJdm9yeVwiO1xuY29uc3QgREVGQVVMVF9YID0gMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfWSA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1JPVEFUSU9OID0gMDsgLy8gZGVncmVlc1xuY29uc3QgREVGQVVMVF9PUEFDSVRZID0gMC41O1xuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBIRUxEX0JZX0FUVFJJQlVURSA9IFwiaGVsZC1ieVwiO1xuY29uc3QgUElQU19BVFRSSUJVVEUgPSBcInBpcHNcIjtcbmNvbnN0IFJPVEFUSU9OX0FUVFJJQlVURSA9IFwicm90YXRpb25cIjtcbmNvbnN0IFhfQVRUUklCVVRFID0gXCJ4XCI7XG5jb25zdCBZX0FUVFJJQlVURSA9IFwieVwiO1xuXG5jb25zdCBCQVNFX0RJRV9TSVpFID0gMTAwOyAvLyBweFxuY29uc3QgQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgPSAxNTsgLy8gcHhcbmNvbnN0IEJBU0VfU1RST0tFX1dJRFRIID0gMi41OyAvLyBweFxuY29uc3QgTUlOX1NUUk9LRV9XSURUSCA9IDE7IC8vIHB4XG5jb25zdCBIQUxGID0gQkFTRV9ESUVfU0laRSAvIDI7IC8vIHB4XG5jb25zdCBUSElSRCA9IEJBU0VfRElFX1NJWkUgLyAzOyAvLyBweFxuY29uc3QgUElQX1NJWkUgPSBCQVNFX0RJRV9TSVpFIC8gMTU7IC8vcHhcbmNvbnN0IFBJUF9DT0xPUiA9IFwiYmxhY2tcIjtcblxuY29uc3QgZGVnMnJhZCA9IChkZWcpID0+IHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufTtcblxuY29uc3QgaXNQaXBOdW1iZXIgPSBuID0+IHtcbiAgICBjb25zdCBudW1iZXIgPSBwYXJzZUludChuLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIobnVtYmVyKSAmJiAxIDw9IG51bWJlciAmJiBudW1iZXIgPD0gTlVNQkVSX09GX1BJUFM7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBvZiBwaXBzIGJldHdlZW4gMSBhbmQgdGhlIE5VTUJFUl9PRl9QSVBTLlxuICpcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEEgcmFuZG9tIG51bWJlciBuLCAxIOKJpCBuIOKJpCBOVU1CRVJfT0ZfUElQUy5cbiAqL1xuY29uc3QgcmFuZG9tUGlwcyA9ICgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE5VTUJFUl9PRl9QSVBTKSArIDE7XG5cbmNvbnN0IERJRV9VTklDT0RFX0NIQVJBQ1RFUlMgPSBbXCLimoBcIixcIuKagVwiLFwi4pqCXCIsXCLimoNcIixcIuKahFwiLFwi4pqFXCJdO1xuXG4vKipcbiAqIENvbnZlcnQgYSB1bmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRpbmcgYSBkaWUgZmFjZSB0byB0aGUgbnVtYmVyIG9mIHBpcHMgb2ZcbiAqIHRoYXQgc2FtZSBkaWUuIFRoaXMgZnVuY3Rpb24gaXMgdGhlIHJldmVyc2Ugb2YgcGlwc1RvVW5pY29kZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdSAtIFRoZSB1bmljb2RlIGNoYXJhY3RlciB0byBjb252ZXJ0IHRvIHBpcHMuXG4gKiBAcmV0dXJucyB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYsIG9yXG4gKiB1bmRlZmluZWQgaWYgdSB3YXMgbm90IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllLlxuICovXG5jb25zdCB1bmljb2RlVG9QaXBzID0gKHUpID0+IHtcbiAgICBjb25zdCBkaWVDaGFySW5kZXggPSBESUVfVU5JQ09ERV9DSEFSQUNURVJTLmluZGV4T2YodSk7XG4gICAgcmV0dXJuIDAgPD0gZGllQ2hhckluZGV4ID8gZGllQ2hhckluZGV4ICsgMSA6IHVuZGVmaW5lZDtcbn07XG5cbi8qKlxuICogQ29udmVydCBhIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXJcbiAqIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb3JyZXNwb25kaW5nIGRpZSBmYWNlLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlXG4gKiBvZiB1bmljb2RlVG9QaXBzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwIC0gVGhlIG51bWJlciBvZiBwaXBzIHRvIGNvbnZlcnQgdG8gYSB1bmljb2RlIGNoYXJhY3Rlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBUaGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlcnMgb3JcbiAqIHVuZGVmaW5lZCBpZiBwIHdhcyBub3QgYmV0d2VlbiAxIGFuZCA2IGluY2x1c2l2ZS5cbiAqL1xuY29uc3QgcGlwc1RvVW5pY29kZSA9IHAgPT4gaXNQaXBOdW1iZXIocCkgPyBESUVfVU5JQ09ERV9DSEFSQUNURVJTW3AgLSAxXSA6IHVuZGVmaW5lZDtcblxuY29uc3QgcmVuZGVySG9sZCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTRVBFUkFUT1IgPSB3aWR0aCAvIDMwO1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuZ2xvYmFsQWxwaGEgPSBERUZBVUxUX09QQUNJVFk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuYXJjKHggKyB3aWR0aCwgeSArIHdpZHRoLCB3aWR0aCAtIFNFUEVSQVRPUiwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlckRpZSA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTQ0FMRSA9ICh3aWR0aCAvIEhBTEYpO1xuICAgIGNvbnN0IEhBTEZfSU5ORVJfU0laRSA9IE1hdGguc3FydCh3aWR0aCAqKiAyIC8gMik7XG4gICAgY29uc3QgSU5ORVJfU0laRSA9IDIgKiBIQUxGX0lOTkVSX1NJWkU7XG4gICAgY29uc3QgUk9VTkRFRF9DT1JORVJfUkFESVVTID0gQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgKiBTQ0FMRTtcbiAgICBjb25zdCBJTk5FUl9TSVpFX1JPVU5ERUQgPSBJTk5FUl9TSVpFIC0gMiAqIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBTVFJPS0VfV0lEVEggPSBNYXRoLm1heChNSU5fU1RST0tFX1dJRFRILCBCQVNFX1NUUk9LRV9XSURUSCAqIFNDQUxFKTtcblxuICAgIGNvbnN0IHN0YXJ0WCA9IHggKyB3aWR0aCAtIEhBTEZfSU5ORVJfU0laRSArIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBzdGFydFkgPSB5ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkU7XG5cbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICBjb250ZXh0LmxpbmVXaWR0aCA9IFNUUk9LRV9XSURUSDtcbiAgICBjb250ZXh0Lm1vdmVUbyhzdGFydFgsIHN0YXJ0WSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMjcwKSwgZGVnMnJhZCgwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMCksIGRlZzJyYWQoOTApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkUpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoOTApLCBkZWcycmFkKDE4MCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCAtIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDE4MCksIGRlZzJyYWQoMjcwKSk7XG5cbiAgICBjb250ZXh0LnN0cm9rZSgpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuY29uc3QgcmVuZGVyUGlwID0gKGNvbnRleHQsIHgsIHksIHdpZHRoKSA9PiB7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFBJUF9DT0xPUjtcbiAgICBjb250ZXh0Lm1vdmVUbyh4LCB5KTtcbiAgICBjb250ZXh0LmFyYyh4LCB5LCB3aWR0aCwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cblxuLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5jb25zdCBfYm9hcmQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbG9yID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWxkQnkgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3BpcHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0aW9uID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF94ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF95ID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBUb3BEaWUgaXMgdGhlIFwidG9wLWRpZVwiIGN1c3RvbSBbSFRNTFxuICogZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50KSByZXByZXNlbnRpbmcgYSBkaWVcbiAqIG9uIHRoZSBkaWNlIGJvYXJkLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWUuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe3BpcHMsIGNvbG9yLCByb3RhdGlvbiwgeCwgeSwgaGVsZEJ5fSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgY29uc3QgcGlwc1ZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihwaXBzIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwc1ZhbHVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHBpcHNWYWx1ZSk7XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHZhbGlkYXRlLmNvbG9yKGNvbG9yIHx8IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfQ09MT1IpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHZhbGlkYXRlLmludGVnZXIocm90YXRpb24gfHwgdGhpcy5nZXRBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDAsIDM2MClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ST1RBVElPTilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnggPSB2YWxpZGF0ZS5pbnRlZ2VyKHggfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLmludGVnZXIoeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1kpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5oZWxkQnkgPSB2YWxpZGF0ZS5zdHJpbmcoaGVsZEJ5IHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b3AtZGllXCIsIFRvcERpZSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllLFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7R3JpZExheW91dH0gZnJvbSBcIi4vR3JpZExheW91dC5qc1wiO1xuaW1wb3J0IHtERUZBVUxUX1NZU1RFTV9QTEFZRVJ9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcbmltcG9ydCB7VG9wRGllfSBmcm9tIFwiLi9Ub3BEaWUuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuXG5jb25zdCBwYXJzZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHROdW1iZXIgPSAwKSA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW1iZXIpID8gZGVmYXVsdE51bWJlciA6IG51bWJlcjtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyID0gKG51bWJlclN0cmluZywgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgcmV0dXJuIHZhbGlkYXRlLmludGVnZXIobnVtYmVyU3RyaW5nKVxuICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAuZGVmYXVsdFRvKGRlZmF1bHRWYWx1ZSlcbiAgICAgICAgLnZhbHVlO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlcih2YWx1ZVN0cmluZywgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbmNvbnN0IGdldEJvb2xlYW4gPSAoYm9vbGVhblN0cmluZywgdHJ1ZVZhbHVlLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAodHJ1ZVZhbHVlID09PSBib29sZWFuU3RyaW5nIHx8IFwidHJ1ZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoXCJmYWxzZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IGdldEJvb2xlYW5BdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKHZhbHVlU3RyaW5nLCBbdmFsdWVTdHJpbmcsIFwidHJ1ZVwiXSwgW1wiZmFsc2VcIl0sIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2NhbnZhcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbGF5b3V0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jdXJyZW50UGxheWVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9udW1iZXJPZlJlYWR5RGljZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IGNvbnRleHQgPSAoYm9hcmQpID0+IF9jYW52YXMuZ2V0KGJvYXJkKS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbmNvbnN0IGdldFJlYWR5RGljZSA9IChib2FyZCkgPT4ge1xuICAgIGlmICh1bmRlZmluZWQgPT09IF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpKSB7XG4gICAgICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJlYWR5RGljZSA9IChib2FyZCwgdXBkYXRlKSA9PiB7XG4gICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgZ2V0UmVhZHlEaWNlKGJvYXJkKSArIHVwZGF0ZSk7XG59O1xuXG5jb25zdCBpc1JlYWR5ID0gKGJvYXJkKSA9PiBnZXRSZWFkeURpY2UoYm9hcmQpID09PSBib2FyZC5kaWNlLmxlbmd0aDtcblxuY29uc3QgdXBkYXRlQm9hcmQgPSAoYm9hcmQsIGRpY2UgPSBib2FyZC5kaWNlKSA9PiB7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIGNvbnRleHQoYm9hcmQpLmNsZWFyUmVjdCgwLCAwLCBib2FyZC53aWR0aCwgYm9hcmQuaGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBkaWUucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLy8gSW50ZXJhY3Rpb24gc3RhdGVzXG5jb25zdCBOT05FID0gU3ltYm9sKFwibm9faW50ZXJhY3Rpb25cIik7XG5jb25zdCBIT0xEID0gU3ltYm9sKFwiaG9sZFwiKTtcbmNvbnN0IE1PVkUgPSBTeW1ib2woXCJtb3ZlXCIpO1xuY29uc3QgSU5ERVRFUk1JTkVEID0gU3ltYm9sKFwiaW5kZXRlcm1pbmVkXCIpO1xuY29uc3QgRFJBR0dJTkcgPSBTeW1ib2woXCJkcmFnZ2luZ1wiKTtcblxuLy8gTWV0aG9kcyB0byBoYW5kbGUgaW50ZXJhY3Rpb25cbmNvbnN0IGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzID0gKGNhbnZhcywgeFdpbmRvdywgeVdpbmRvdykgPT4ge1xuICAgIGNvbnN0IGNhbnZhc0JveCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHggPSB4V2luZG93IC0gY2FudmFzQm94LmxlZnQgKiAoY2FudmFzLndpZHRoIC8gY2FudmFzQm94LndpZHRoKTtcbiAgICBjb25zdCB5ID0geVdpbmRvdyAtIGNhbnZhc0JveC50b3AgKiAoY2FudmFzLmhlaWdodCAvIGNhbnZhc0JveC5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIHt4LCB5fTtcbn07XG5cbmNvbnN0IHNldHVwSW50ZXJhY3Rpb24gPSAoYm9hcmQpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldChib2FyZCk7XG5cbiAgICAvLyBTZXR1cCBpbnRlcmFjdGlvblxuICAgIGxldCBvcmlnaW4gPSB7fTtcbiAgICBsZXQgc3RhdGUgPSBOT05FO1xuICAgIGxldCBzdGF0aWNCb2FyZCA9IG51bGw7XG4gICAgbGV0IGRpZVVuZGVyQ3Vyc29yID0gbnVsbDtcbiAgICBsZXQgaG9sZFRpbWVvdXQgPSBudWxsO1xuXG4gICAgY29uc3QgaG9sZERpZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKEhPTEQgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIHRvZ2dsZSBob2xkIC8gcmVsZWFzZVxuICAgICAgICAgICAgY29uc3QgcGxheWVyV2l0aEFUdXJuID0gYm9hcmQucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdCB0b3AtcGxheWVyW2hhcy10dXJuXVwiKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZCBpcyBhIGN1c3RvbSBIVE1MIGVsZW1lbnQgdG8gcmVuZGVyIGFuZCBjb250cm9sIGFcbiAqIGRpY2UgYm9hcmQuIFxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcERpY2VCb2FyZCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpY2VCb2FyZC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSB2YWxpZGF0ZS5ib29sZWFuKG5ld1ZhbHVlLCBnZXRCb29sZWFuKG9sZFZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKSkudmFsdWU7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5yb3RhdGUgPSAhZGlzYWJsZWRSb3RhdGlvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSBpcyBkZXRlcm1pbmVkIHdoZW4gdXNpbmcgdGhlIGdldHRlclxuICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTphZGRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgMSk7XG4gICAgICAgICAgICBpZiAoaXNSZWFkeSh0aGlzKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wLWRpZTpyZW1vdmVkXCIsICgpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgICAgIHVwZGF0ZVJlYWR5RGljZSh0aGlzLCAtMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFsbCBkaWNlIGJvYXJkcyBkbyBoYXZlIGEgcGxheWVyIGxpc3QuIElmIHRoZXJlIGlzbid0IG9uZSB5ZXQsXG4gICAgICAgIC8vIGNyZWF0ZSBvbmUuXG4gICAgICAgIGlmIChudWxsID09PSB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCJ0b3AtcGxheWVyLWxpc3RcIikpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRvcC1wbGF5ZXItbGlzdFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICBhZG9wdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIEdyaWRMYXlvdXQgdXNlZCBieSB0aGlzIERpY2VCb2FyZCB0byBsYXlvdXQgdGhlIGRpY2UuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7R3JpZExheW91dH1cbiAgICAgKi9cbiAgICBnZXQgbGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gX2xheW91dC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpY2Ugb24gdGhpcyBib2FyZC4gTm90ZSwgdG8gYWN0dWFsbHkgdGhyb3cgdGhlIGRpY2UgdXNlXG4gICAgICoge0BsaW5rIHRocm93RGljZX0uIFxuICAgICAqXG4gICAgICogQHR5cGUge1RvcERpZVtdfVxuICAgICAqL1xuICAgIGdldCBkaWNlKCkge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0b3AtZGllXCIpXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBwdXQgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UsIDAgPCBtYXhpbXVtLlxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQubWF4aW11bU51bWJlck9mRGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgV0lEVEhfQVRUUklCVVRFLCBERUZBVUxUX1dJRFRIKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgSEVJR0hUX0FUVFJJQlVURSwgREVGQVVMVF9IRUlHSFQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXNwZXJzaW9uIGxldmVsIG9mIHRoaXMgYm9hcmQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIERJU1BFUlNJT05fQVRUUklCVVRFLCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzaXplIG9mIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESUVfU0laRV9BVFRSSUJVVEUsIERFRkFVTFRfRElFX1NJWkUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgZHJhZ2dlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWREcmFnZ2luZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX0RSQUdHSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbiBkaWNlIG9uIHRoaXMgYm9hcmQgYmUgaGVsZCBieSBhIFBsYXllcj9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRIb2xkaW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHJvdGF0aW5nIGRpY2Ugb24gdGhpcyBib2FyZCBkaXNhYmxlZD9cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgZGlzYWJsZWRSb3RhdGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkdXJhdGlvbiBpbiBtcyB0byBwcmVzcyB0aGUgbW91c2UgLyB0b3VjaCBhIGRpZSBiZWZvcmUgaXQgYmVrb21lc1xuICAgICAqIGhlbGQgYnkgdGhlIFBsYXllci4gSXQgaGFzIG9ubHkgYW4gZWZmZWN0IHdoZW4gdGhpcy5ob2xkYWJsZURpY2UgPT09XG4gICAgICogdHJ1ZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhvbGREdXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhPTERfRFVSQVRJT05fQVRUUklCVVRFLCBERUZBVUxUX0hPTERfRFVSQVRJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIHBsYXlpbmcgb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdFwiKS5wbGF5ZXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzIHBsYXllciwgdGhyb3cgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBbcGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSXSAtIFRoZVxuICAgICAqIHBsYXllciB0aGF0IGlzIHRocm93aW5nIHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BEaWVbXX0gVGhlIHRocm93biBkaWNlIG9uIHRoaXMgYm9hcmQuIFRoaXMgbGlzdCBvZiBkaWNlIGlzIHRoZSBzYW1lIGFzIHRoaXMgVG9wRGljZUJvYXJkJ3Mge0BzZWUgZGljZX0gcHJvcGVydHlcbiAgICAgKi9cbiAgICB0aHJvd0RpY2UocGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSKSB7XG4gICAgICAgIGlmIChwbGF5ZXIgJiYgIXBsYXllci5oYXNUdXJuKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3RhcnRUdXJuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaWNlLmZvckVhY2goZGllID0+IGRpZS50aHJvd0l0KCkpO1xuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGllIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BEaWV8T2JqZWN0fSBbY29uZmlnID0ge31dIC0gVGhlIGRpZSBvciBhIGNvbmZpZ3VyYXRpb24gb2ZcbiAgICAgKiB0aGUgZGllIHRvIGFkZCB0byB0aGlzIFRvcERpY2VCb2FyZC5cbiAgICAgKiBAcGFyYW0ge051bWJlcnxudWxsfSBbY29uZmlnLnBpcHNdIC0gVGhlIHBpcHMgb2YgdGhlIGRpZSB0byBhZGQuXG4gICAgICogSWYgbm8gcGlwcyBhcmUgc3BlY2lmaWVkIG9yIHRoZSBwaXBzIGFyZSBub3QgYmV0d2VlbiAxIGFuZCA2LCBhIHJhbmRvbVxuICAgICAqIG51bWJlciBiZXR3ZWVuIDEgYW5kIDYgaXMgZ2VuZXJhdGVkIGluc3RlYWQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFtjb25maWcuY29sb3JdIC0gVGhlIGNvbG9yIG9mIHRoZSBkaWUgdG8gYWRkLiBEZWZhdWx0XG4gICAgICogdG8gdGhlIGRlZmF1bHQgY29sb3IuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueF0gLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcueV0gLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb25maWcucm90YXRpb25dIC0gVGhlIHJvdGF0aW9uIG9mIHRoZSBkaWUuXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtoZWxkQnldIC0gVGhlIHBsYXllciBob2xkaW5nIHRoZSBkaWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BEaWV9IFRoZSBhZGRlZCBkaWUuXG4gICAgICovXG4gICAgYWRkRGllKGNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcGVuZENoaWxkKGNvbmZpZyBpbnN0YW5jZW9mIFRvcERpZSA/IGNvbmZpZyA6IG5ldyBUb3BEaWUoY29uZmlnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGRpZSBmcm9tIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BEaWV9IGRpZSAtIFRoZSBkaWUgdG8gcmVtb3ZlIGZyb20gdGhpcyBib2FyZC5cbiAgICAgKi9cbiAgICByZW1vdmVEaWUoZGllKSB7XG4gICAgICAgIGlmIChkaWUucGFyZW50Tm9kZSAmJiBkaWUucGFyZW50Tm9kZSA9PT0gdGhpcykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChkaWUpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLWRpY2UtYm9hcmRcIiwgVG9wRGljZUJvYXJkKTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWNlQm9hcmQsXG4gICAgREVGQVVMVF9ESUVfU0laRSxcbiAgICBERUZBVUxUX0hPTERfRFVSQVRJT04sXG4gICAgREVGQVVMVF9XSURUSCxcbiAgICBERUZBVUxUX0hFSUdIVCxcbiAgICBERUZBVUxUX0RJU1BFUlNJT04sXG4gICAgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7REVGQVVMVF9TWVNURU1fUExBWUVSfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcblxuLyoqXG4gKiBUb3BQbGF5ZXJMaXN0IHRvIGRlc2NyaWJlIHRoZSBwbGF5ZXJzIGluIHRoZSBnYW1lLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcFBsYXllckxpc3QgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXJMaXN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBpZiAoMCA+PSB0aGlzLnBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3A6c3RhcnQtdHVyblwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgb25lIHBsYXllciBjYW4gaGF2ZSBhIHR1cm4gYXQgYW55IGdpdmVuIHRpbWUuXG4gICAgICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4gIXAuZXF1YWxzKGV2ZW50LmRldGFpbC5wbGF5ZXIpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHAgPT4gcC5lbmRUdXJuKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBpbiB0aGlzIGxpc3QuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyW119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRvcC1wbGF5ZXJcIildO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b3AtcGxheWVyLWxpc3RcIiwgVG9wUGxheWVyTGlzdCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVyTGlzdFxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5pbXBvcnQge1RvcERpY2VCb2FyZH0gZnJvbSBcIi4vVG9wRGljZUJvYXJkLmpzXCI7XG5pbXBvcnQge1RvcERpZX0gZnJvbSBcIi4vVG9wRGllLmpzXCI7XG5pbXBvcnQge1RvcFBsYXllcn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5pbXBvcnQge1RvcFBsYXllckxpc3R9IGZyb20gXCIuL1RvcFBsYXllckxpc3QuanNcIjtcblxud2luZG93LnR3ZW50eW9uZXBpcHMgPSB3aW5kb3cudHdlbnR5b25lcGlwcyB8fCBPYmplY3QuZnJlZXplKHtcbiAgICBWRVJTSU9OOiBcIjAuMC4xXCIsXG4gICAgTElDRU5TRTogXCJMR1BMLTMuMFwiLFxuICAgIFdFQlNJVEU6IFwiaHR0cHM6Ly90d2VudHlvbmVwaXBzLm9yZ1wiLFxuICAgIFRvcERpY2VCb2FyZDogVG9wRGljZUJvYXJkLFxuICAgIFRvcERpZTogVG9wRGllLFxuICAgIFRvcFBsYXllcjogVG9wUGxheWVyLFxuICAgIFRvcFBsYXllckxpc3Q6IFRvcFBsYXllckxpc3Rcbn0pO1xuIl0sIm5hbWVzIjpbInZhbGlkYXRlIiwiQ09MT1JfQVRUUklCVVRFIiwiX2NvbG9yIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkEsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLEtBQUssQ0FBQzs7Ozs7Ozs7SUFRM0MsV0FBVyxDQUFDLE9BQU8sRUFBRTtRQUNqQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEI7Q0FDSjs7QUN4Q0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFFQTs7OztBQUlBLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDOztBQUVuQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsS0FBSztJQUMzQixPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNyRSxDQUFDOzs7QUFHRixNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ2xDLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQjlCLE1BQU0sVUFBVSxHQUFHLE1BQU07Ozs7Ozs7SUFPckIsV0FBVyxDQUFDO1FBQ1IsS0FBSztRQUNMLE1BQU07UUFDTixVQUFVO1FBQ1YsT0FBTztLQUNWLEdBQUcsRUFBRSxFQUFFO1FBQ0osS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7O1FBRXhCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3hCOzs7Ozs7O0lBT0QsSUFBSSxLQUFLLEdBQUc7UUFDUixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0I7O0lBRUQsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1AsTUFBTSxJQUFJLGtCQUFrQixDQUFDLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDL0Y7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ2hEOzs7Ozs7OztJQVFELElBQUksTUFBTSxHQUFHO1FBQ1QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzVCOztJQUVELElBQUksTUFBTSxDQUFDLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLDhDQUE4QyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ2hHO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNoRDs7Ozs7Ozs7SUFRRCxJQUFJLG1CQUFtQixHQUFHO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQ2xDOzs7Ozs7Ozs7O0lBVUQsSUFBSSxVQUFVLEdBQUc7UUFDYixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEM7O0lBRUQsSUFBSSxVQUFVLENBQUMsQ0FBQyxFQUFFO1FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1AsTUFBTSxJQUFJLGtCQUFrQixDQUFDLENBQUMsa0RBQWtELEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDcEc7UUFDRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ25DOzs7Ozs7OztJQVFELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzdCOztJQUVELElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRTtRQUNaLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNULE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLCtDQUErQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ2xHO1FBQ0QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNoRDs7SUFFRCxJQUFJLE1BQU0sR0FBRztRQUNULE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxTQUFTLEtBQUssQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7S0FDckM7O0lBRUQsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDeEI7Ozs7Ozs7O0lBUUQsSUFBSSxLQUFLLEdBQUc7UUFDUixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7O0lBUUQsSUFBSSxLQUFLLEdBQUc7UUFDUixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7O0lBUUQsSUFBSSxPQUFPLEdBQUc7UUFDVixNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztRQUVoRCxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3JCOzs7Ozs7Ozs7Ozs7SUFZRCxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ1QsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN4QyxNQUFNLElBQUksa0JBQWtCLENBQUMsQ0FBQyx5Q0FBeUMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztTQUMxSTs7UUFFRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLFlBQVksR0FBRyxFQUFFLENBQUM7O1FBRXhCLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3BCLElBQUksR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRTs7OztnQkFJdEMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQy9CLE1BQU07Z0JBQ0gsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMxQjtTQUNKOztRQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7UUFFM0UsS0FBSyxNQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUU7WUFDNUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQzs7WUFFdEMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEQsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLHNCQUFzQixDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3ZGLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMvQjs7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDOztRQUVuQyxPQUFPLGlCQUFpQixDQUFDO0tBQzVCOzs7Ozs7Ozs7OztJQVdELHNCQUFzQixDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTtRQUMzQyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNkLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBRWxELE9BQU8sU0FBUyxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksS0FBSyxHQUFHLFFBQVEsRUFBRTtZQUM3QyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzFDLElBQUksU0FBUyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO29CQUNsRSxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN2QjthQUNKOztZQUVELEtBQUssRUFBRSxDQUFDO1NBQ1g7O1FBRUQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ2hDOzs7Ozs7Ozs7Ozs7SUFZRCxhQUFhLENBQUMsS0FBSyxFQUFFO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7UUFFNUIsSUFBSSxDQUFDLEtBQUssS0FBSyxFQUFFO1lBQ2IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDekMsTUFBTTtZQUNILEtBQUssSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUNqRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2pFOztZQUVELEtBQUssSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDcEUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNqRTtTQUNKOztRQUVELE9BQU8sS0FBSyxDQUFDO0tBQ2hCOzs7Ozs7Ozs7OztJQVdELFlBQVksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7UUFDbEMsT0FBTyxTQUFTLEtBQUssaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0tBQzNHOzs7Ozs7Ozs7SUFTRCxhQUFhLENBQUMsQ0FBQyxFQUFFO1FBQ2IsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakU7Ozs7Ozs7Ozs7SUFVRCxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDOUQsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7U0FDakM7UUFDRCxPQUFPLFNBQVMsQ0FBQztLQUNwQjs7Ozs7Ozs7Ozs7SUFXRCxvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7UUFDcEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwRDs7Ozs7Ozs7Ozs7SUFXRCxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7UUFDekIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDeEMsT0FBTyxDQUFDLENBQUM7U0FDWjtRQUNELE9BQU8sU0FBUyxDQUFDO0tBQ3BCOzs7Ozs7Ozs7Ozs7OztJQWNELE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ3ZCLE1BQU0sVUFBVSxHQUFHO1lBQ2YsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDakMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDcEMsQ0FBQzs7UUFFRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUM3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQzs7UUFFMUMsTUFBTSxTQUFTLEdBQUcsQ0FBQztZQUNmLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQztZQUNqQyxRQUFRLEVBQUUsT0FBTyxHQUFHLFFBQVE7U0FDL0IsRUFBRTtZQUNDLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUNsQixHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUc7Z0JBQ25CLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUIsQ0FBQztZQUNGLFFBQVEsRUFBRSxRQUFRLEdBQUcsUUFBUTtTQUNoQyxFQUFFO1lBQ0MsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUM7Z0JBQ2xCLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQ3ZCLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRzthQUN0QixDQUFDO1lBQ0YsUUFBUSxFQUFFLE9BQU8sR0FBRyxTQUFTO1NBQ2hDLEVBQUU7WUFDQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQztnQkFDbEIsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztnQkFDdkIsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQzthQUMxQixDQUFDO1lBQ0YsUUFBUSxFQUFFLFFBQVEsR0FBRyxTQUFTO1NBQ2pDLENBQUMsQ0FBQzs7UUFFSCxNQUFNLE1BQU0sR0FBRyxTQUFTOzthQUVuQixNQUFNLENBQUMsQ0FBQyxRQUFRLEtBQUssU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7O2FBRTlDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsS0FBSztnQkFDbEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO21CQUN0RSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzthQUVyRCxNQUFNO2dCQUNILENBQUMsSUFBSSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxHQUFHLElBQUk7Z0JBQ3ZFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDL0IsQ0FBQzs7UUFFTixPQUFPLFNBQVMsS0FBSyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzlFOzs7Ozs7Ozs7SUFTRCxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDeEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQzs7WUFFL0IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUN6RCxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztZQUV6RCxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQ2QsT0FBTyxHQUFHLENBQUM7YUFDZDtTQUNKOztRQUVELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7Ozs7Ozs7Ozs7SUFVRCxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtRQUMxQixLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsRCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUN0RDs7Ozs7Ozs7O0lBU0QsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDekQ7Ozs7Ozs7OztJQVNELGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNsQixPQUFPO1lBQ0gsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDakMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDcEMsQ0FBQztLQUNMO0NBQ0o7O0FDcGZEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0JBLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLEtBQUs7SUFDakMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsT0FBTyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0NBQzFGLENBQUM7Ozs7Ozs7O0FBUUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7SUFhM0IsY0FBYyxHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7UUFnQmQsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7Ozs7WUFJL0MsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDM0M7U0FDSjtLQUNKOztBQ2hGTDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxNQUFNLGVBQWUsR0FBRyxjQUFjLEtBQUssQ0FBQztJQUN4QyxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ2IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2Q7Q0FDSjs7QUN2QkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFFQSxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzdCLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQzs7QUFFOUIsTUFBTSxhQUFhLEdBQUcsTUFBTTtJQUN4QixXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRTtRQUM1QyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QixhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztLQUM3Qjs7SUFFRCxJQUFJLE1BQU0sR0FBRztRQUNULE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMzQjs7SUFFRCxJQUFJLEtBQUssR0FBRztRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDL0Q7O0lBRUQsSUFBSSxNQUFNLEdBQUc7UUFDVCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7O0lBRUQsSUFBSSxPQUFPLEdBQUc7UUFDVixPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztLQUNsQzs7SUFFRCxTQUFTLENBQUMsVUFBVSxFQUFFO1FBQ2xCLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7O0lBRUQsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLGFBQWEsR0FBRyxFQUFFLEVBQUUsU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFO1FBQ2pFLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDZCxNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDOztZQUV2RCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMzQjs7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNmO0NBQ0o7O0FDL0REOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUEsTUFBTSxVQUFVLEdBQUcsY0FBYyxlQUFlLENBQUM7SUFDN0MsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNkO0NBQ0o7O0FDekJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUEsTUFBTSxnQkFBZ0IsR0FBRyxjQUFjLGVBQWUsQ0FBQztJQUNuRCxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ2IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2Q7Q0FDSjs7QUN6QkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFJQSxNQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLGNBQWMsYUFBYSxDQUFDO0lBQ3JELFdBQVcsQ0FBQyxLQUFLLEVBQUU7UUFDZixJQUFJLEtBQUssR0FBRyxxQkFBcUIsQ0FBQztRQUNsQyxNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztRQUMzQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7O1FBRWxCLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN6QixLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ2pCLE1BQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxLQUFLLEVBQUU7WUFDbEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLEtBQUssR0FBRyxXQUFXLENBQUM7YUFDdkIsTUFBTTtnQkFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDdEM7U0FDSixNQUFNO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDNUM7O1FBRUQsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3hDOztJQUVELFVBQVUsQ0FBQyxDQUFDLEVBQUU7UUFDVixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDZixTQUFTLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ2xDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNyQixDQUFDLENBQUM7S0FDTjs7SUFFRCxXQUFXLENBQUMsQ0FBQyxFQUFFO1FBQ1gsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2YsU0FBUyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNsQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDckIsQ0FBQyxDQUFDO0tBQ047O0lBRUQsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDVixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDZixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDOUQsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN4QixDQUFDLENBQUM7S0FDTjtDQUNKOztBQ2xFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUdBLE1BQU0sb0JBQW9CLEdBQUcsRUFBRSxDQUFDO0FBQ2hDLE1BQU0sbUJBQW1CLEdBQUcsY0FBYyxhQUFhLENBQUM7SUFDcEQsV0FBVyxDQUFDLEtBQUssRUFBRTtRQUNmLElBQUksS0FBSyxHQUFHLG9CQUFvQixDQUFDO1FBQ2pDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQzs7UUFFbEIsSUFBSSxRQUFRLEtBQUssT0FBTyxLQUFLLEVBQUU7WUFDM0IsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNqQixNQUFNO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDNUM7O1FBRUQsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3hDOztJQUVELFFBQVEsR0FBRztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNmLFNBQVMsRUFBRSxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsTUFBTTtTQUN0QyxDQUFDLENBQUM7S0FDTjtDQUNKOztBQzNDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUNBO0FBQ0EsQUFFQSxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQztBQUNwQyxNQUFNLGtCQUFrQixHQUFHLGNBQWMsYUFBYSxDQUFDO0lBQ25ELFdBQVcsQ0FBQyxLQUFLLEVBQUU7UUFDZixJQUFJLEtBQUssR0FBRyxtQkFBbUIsQ0FBQztRQUNoQyxNQUFNLFlBQVksR0FBRyxtQkFBbUIsQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7O1FBRWxCLElBQUksUUFBUSxLQUFLLE9BQU8sS0FBSyxFQUFFO1lBQzNCLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDakIsTUFBTTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVDOztRQUVELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUN4QztDQUNKOztBQ3RDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUlBLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxDQUFDO0FBQ3BDLE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxhQUFhLENBQUM7SUFDckQsV0FBVyxDQUFDLEtBQUssRUFBRTtRQUNmLElBQUksS0FBSyxHQUFHLHFCQUFxQixDQUFDO1FBQ2xDLE1BQU0sWUFBWSxHQUFHLHFCQUFxQixDQUFDO1FBQzNDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQzs7UUFFbEIsSUFBSSxLQUFLLFlBQVksT0FBTyxFQUFFO1lBQzFCLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDakIsTUFBTSxJQUFJLFFBQVEsS0FBSyxPQUFPLEtBQUssRUFBRTtZQUNsQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3JCLEtBQUssR0FBRyxJQUFJLENBQUM7YUFDaEIsTUFBTSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLEtBQUssR0FBRyxLQUFLLENBQUM7YUFDakIsTUFBTTtnQkFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDdEM7U0FDSixNQUFNO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDNUM7O1FBRUQsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3hDOztJQUVELE1BQU0sR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNmLFNBQVMsRUFBRSxNQUFNLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTTtTQUN4QyxDQUFDLENBQUM7S0FDTjs7SUFFRCxPQUFPLEdBQUc7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDZixTQUFTLEVBQUUsTUFBTSxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU07U0FDekMsQ0FBQyxDQUFDO0tBQ047Q0FDSjs7QUMxREQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFLQSxNQUFNLFNBQVMsR0FBRyxNQUFNO0lBQ3BCLFdBQVcsR0FBRztLQUNiOztJQUVELE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDWCxPQUFPLElBQUksb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDMUM7O0lBRUQsS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNULE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4Qzs7SUFFRCxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ1gsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFDOztJQUVELE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDVixPQUFPLElBQUksbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDekM7O0NBRUosQ0FBQzs7QUFFRixNQUFNLGtCQUFrQixHQUFHLElBQUksU0FBUyxFQUFFOztBQzlDMUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsQUFJQTtBQUNBLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7QUFDOUIsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDO0FBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxDQUFDOzs7QUFHdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQi9CLE1BQU0sU0FBUyxHQUFHLGNBQWMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7SUFhNUQsV0FBVyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQzVDLEtBQUssRUFBRSxDQUFDOztRQUVSLE1BQU0sVUFBVSxHQUFHQSxrQkFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUNwQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xELE1BQU07WUFDSCxNQUFNLElBQUksa0JBQWtCLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUM5RTs7UUFFRCxNQUFNLFNBQVMsR0FBR0Esa0JBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUM3RSxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUU7WUFDbkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hELE1BQU07WUFDSCxNQUFNLElBQUksa0JBQWtCLENBQUMsMkNBQTJDLENBQUMsQ0FBQztTQUM3RTs7UUFFRCxNQUFNLFVBQVUsR0FBR0Esa0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xELE1BQU07O1lBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUN6Qzs7UUFFRCxNQUFNLFlBQVksR0FBR0Esa0JBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUNsRixNQUFNLEVBQUUsQ0FBQztRQUNkLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRTtZQUN0QixRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2xELE1BQU07O1lBRUgsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzVDO0tBQ0o7O0lBRUQsV0FBVyxrQkFBa0IsR0FBRztRQUM1QixPQUFPO1lBQ0gsZUFBZTtZQUNmLGNBQWM7WUFDZCxlQUFlO1lBQ2Ysa0JBQWtCO1NBQ3JCLENBQUM7S0FDTDs7SUFFRCxpQkFBaUIsR0FBRztLQUNuQjs7SUFFRCxvQkFBb0IsR0FBRztLQUN0Qjs7Ozs7OztJQU9ELElBQUksS0FBSyxHQUFHO1FBQ1IsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzNCOzs7Ozs7O0lBT0QsSUFBSSxJQUFJLEdBQUc7UUFDUCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7SUFPRCxJQUFJLEtBQUssR0FBRztRQUNSLE9BQU8sSUFBSSxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0Q7SUFDRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDaEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0IsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ25CLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDekMsTUFBTTtZQUNILElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2hEO0tBQ0o7Ozs7Ozs7SUFPRCxTQUFTLEdBQUc7UUFDUixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzVELE1BQU0sRUFBRTtvQkFDSixNQUFNLEVBQUUsSUFBSTtpQkFDZjthQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ1A7UUFDRCxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7Ozs7O0lBS0QsT0FBTyxHQUFHO1FBQ04sUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQzVDOzs7Ozs7O0lBT0QsSUFBSSxPQUFPLEdBQUc7UUFDVixPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3RDOzs7Ozs7O0lBT0QsUUFBUSxHQUFHO1FBQ1AsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDekI7Ozs7Ozs7OztJQVNELE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksR0FBRyxRQUFRLEtBQUssT0FBTyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDNUQsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQy9DO0NBQ0osQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7Ozs7Ozs7OztBQVN0RCxNQUFNLHFCQUFxQixHQUFHLElBQUksU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FDbE90RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLEFBR0E7OztBQUdBLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMzQixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDekIsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQzlCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNwQixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDM0IsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDOztBQUU1QixNQUFNQyxpQkFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQyxNQUFNLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztBQUNwQyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7QUFDOUIsTUFBTSxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDdEMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ3hCLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQzs7QUFFeEIsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDO0FBQzFCLE1BQU0sMEJBQTBCLEdBQUcsRUFBRSxDQUFDO0FBQ3RDLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0FBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLE1BQU0sSUFBSSxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUNoQyxNQUFNLFFBQVEsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQzs7QUFFMUIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUs7SUFDckIsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztDQUNoQyxDQUFDOztBQUVGLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSTtJQUNyQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSSxjQUFjLENBQUM7Q0FDOUUsQ0FBQzs7Ozs7OztBQU9GLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV4RSxNQUFNLHNCQUFzQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFekQsQUFhQTs7Ozs7Ozs7O0FBU0EsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDOztBQUV0RixNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEtBQUs7SUFDaEQsTUFBTSxTQUFTLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUM3QixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQztJQUN0QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDcEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsS0FBSyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2YsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0NBQ3JCLENBQUM7O0FBRUYsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxLQUFLO0lBQy9DLE1BQU0sS0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQztJQUN2QyxNQUFNLHFCQUFxQixHQUFHLDBCQUEwQixHQUFHLEtBQUssQ0FBQztJQUNqRSxNQUFNLGtCQUFrQixHQUFHLFVBQVUsR0FBRyxDQUFDLEdBQUcscUJBQXFCLENBQUM7SUFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsQ0FBQzs7SUFFM0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxlQUFlLEdBQUcscUJBQXFCLENBQUM7SUFDbkUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxlQUFlLENBQUM7O0lBRTNDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNwQixPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUMxQixPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztJQUM5QixPQUFPLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztJQUNqQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsRUFBRSxNQUFNLEdBQUcscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFILE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLGtCQUFrQixHQUFHLHFCQUFxQixFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3pILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLGtCQUFrQixFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDM0gsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcscUJBQXFCLEVBQUUsTUFBTSxHQUFHLHFCQUFxQixDQUFDLENBQUM7SUFDL0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7SUFFdkcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztDQUNyQixDQUFDOztBQUVGLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxLQUFLO0lBQ3hDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNwQixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM5QixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Q0FDckIsQ0FBQzs7OztBQUlGLE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTUMsUUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDaEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUN6QixNQUFNLEVBQUUsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7Ozs7Ozs7O0FBVXpCLE1BQU0sTUFBTSxHQUFHLGNBQWMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7O0lBS3pELFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3BELEtBQUssRUFBRSxDQUFDOztRQUVSLE1BQU0sU0FBUyxHQUFHRixrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUN4RSxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNiLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUN2QixLQUFLLENBQUM7O1FBRVgsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7O1FBRTdDLElBQUksQ0FBQyxLQUFLLEdBQUdBLGtCQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDQyxpQkFBZSxDQUFDLENBQUM7YUFDbkUsU0FBUyxDQUFDLGFBQWEsQ0FBQzthQUN4QixLQUFLLENBQUM7O1FBRVgsSUFBSSxDQUFDLFFBQVEsR0FBR0Qsa0JBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUM5RSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNmLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQzthQUMzQixLQUFLLENBQUM7O1FBRVgsSUFBSSxDQUFDLENBQUMsR0FBR0Esa0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDekQsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUNiLFNBQVMsQ0FBQyxTQUFTLENBQUM7YUFDcEIsS0FBSyxDQUFDOztRQUVYLElBQUksQ0FBQyxDQUFDLEdBQUdBLGtCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ3pELFVBQVUsQ0FBQyxDQUFDLENBQUM7YUFDYixTQUFTLENBQUMsU0FBUyxDQUFDO2FBQ3BCLEtBQUssQ0FBQzs7UUFFWCxJQUFJLENBQUMsTUFBTSxHQUFHQSxrQkFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3hFLFFBQVEsRUFBRTthQUNWLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFDZixLQUFLLENBQUM7S0FDZDs7SUFFRCxXQUFXLGtCQUFrQixHQUFHO1FBQzVCLE9BQU87WUFDSEMsaUJBQWU7WUFDZixpQkFBaUI7WUFDakIsY0FBYztZQUNkLGtCQUFrQjtZQUNsQixXQUFXO1lBQ1gsV0FBVztTQUNkLENBQUM7S0FDTDs7SUFFRCxpQkFBaUIsR0FBRztRQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztLQUM5RDs7SUFFRCxvQkFBb0IsR0FBRztRQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7O0lBUUQsU0FBUyxHQUFHO1FBQ1IsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ25DOzs7Ozs7OztJQVFELFFBQVEsR0FBRztRQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0tBQzNCOzs7Ozs7O0lBT0QsSUFBSSxJQUFJLEdBQUc7UUFDUCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7SUFPRCxJQUFJLEtBQUssR0FBRztRQUNSLE9BQU9DLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0I7SUFDRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDaEIsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ25CLElBQUksQ0FBQyxlQUFlLENBQUNELGlCQUFlLENBQUMsQ0FBQztZQUN0Q0MsUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDbkMsTUFBTTtZQUNIQSxRQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDRCxpQkFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2hEO0tBQ0o7Ozs7Ozs7O0lBUUQsSUFBSSxNQUFNLEdBQUc7UUFDVCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7SUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7WUFDakIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQyxNQUFNO1lBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDbkQ7S0FDSjs7Ozs7OztJQU9ELElBQUksV0FBVyxHQUFHO1FBQ2QsT0FBTyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzdFO0lBQ0QsSUFBSSxXQUFXLENBQUMsQ0FBQyxFQUFFO1FBQ2YsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ1osSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDZCxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNqQixLQUFLO1lBQ0YsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNkO0tBQ0o7Ozs7Ozs7SUFPRCxjQUFjLEdBQUc7UUFDYixPQUFPLElBQUksS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDO0tBQ3BDOzs7Ozs7O0lBT0QsSUFBSSxDQUFDLEdBQUc7UUFDSixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFDUixFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNoQzs7Ozs7OztJQU9ELElBQUksQ0FBQyxHQUFHO1FBQ0osT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZCO0lBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFO1FBQ1IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDaEM7Ozs7Ozs7SUFPRCxJQUFJLFFBQVEsR0FBRztRQUNYLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtJQUNELElBQUksUUFBUSxDQUFDLElBQUksRUFBRTtRQUNmLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNmLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDcEMsTUFBTTtZQUNILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLGNBQWMsQ0FBQztZQUNqRCxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7U0FDckQ7S0FDSjs7Ozs7Ozs7SUFRRCxPQUFPLEdBQUc7UUFDTixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2hCLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO2dCQUMxQyxNQUFNLEVBQUU7b0JBQ0osR0FBRyxFQUFFLElBQUk7aUJBQ1o7YUFDSixDQUFDLENBQUMsQ0FBQztTQUNQO0tBQ0o7Ozs7Ozs7OztJQVNELE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFO2dCQUN6QyxNQUFNLEVBQUU7b0JBQ0osR0FBRyxFQUFFLElBQUk7b0JBQ1QsTUFBTTtpQkFDVDthQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ1A7S0FDSjs7Ozs7OztJQU9ELE1BQU0sR0FBRztRQUNMLE9BQU8sSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDL0I7Ozs7Ozs7OztJQVNELFNBQVMsQ0FBQyxNQUFNLEVBQUU7UUFDZCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDbEQsTUFBTSxFQUFFO29CQUNKLEdBQUcsRUFBRSxJQUFJO29CQUNULE1BQU07aUJBQ1Q7YUFDSixDQUFDLENBQUMsQ0FBQztTQUNQO0tBQ0o7Ozs7Ozs7Ozs7OztJQVlELE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ3JELE1BQU0sS0FBSyxHQUFHLE9BQU8sR0FBRyxhQUFhLENBQUM7UUFDdEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUMzQixNQUFNLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUM7O1FBRW5DLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDOztRQUUzQixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNmLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN2RDs7UUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDeEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDekQ7O1FBRUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBRTVDLFFBQVEsSUFBSSxDQUFDLElBQUk7UUFDakIsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUs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Q0FBQzs7QUM3RC9EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFLQSxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6RCxPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsVUFBVTtJQUNuQixPQUFPLEVBQUUsMkJBQTJCO0lBQ3BDLFlBQVksRUFBRSxZQUFZO0lBQzFCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsYUFBYSxFQUFFLGFBQWE7Q0FDL0IsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNGQnNZWGxsY2k1cWN5SXNJaTlvYjIxbEwyaDFkV0l2VUhKdmFtVmpkSE12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMM055WXk5VWIzQkVhV1V1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1JHbGpaVUp2WVhKa0xtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwxUnZjRkJzWVhsbGNreHBjM1F1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMbXB6SWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1WEc0dktpcGNiaUFxSUVCdGIyUjFiR1ZjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRVZ5Y205eVhHNGdLaTljYm1OdmJuTjBJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCM2FYUm9JRzFsYzNOaFoyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JXVnpjMkZuWlNBdElGUm9aU0J0WlhOellXZGxJR0Z6YzI5amFXRjBaV1FnZDJsMGFDQjBhR2x6WEc0Z0lDQWdJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxbGMzTmhaMlVwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYldWemMyRm5aU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNiaThxS2x4dUlDb2dRRzF2WkhWc1pWeHVJQ292WEc1Y2JtTnZibk4wSUVaVlRFeGZRMGxTUTB4RlgwbE9YMFJGUjFKRlJWTWdQU0F6TmpBN1hHNWNibU52Ym5OMElISmhibVJ2YldsNlpVTmxiblJsY2lBOUlDaHVLU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJQ2d3TGpVZ1BEMGdUV0YwYUM1eVlXNWtiMjBvS1NBL0lFMWhkR2d1Wm14dmIzSWdPaUJOWVhSb0xtTmxhV3dwTG1OaGJHd29NQ3dnYmlrN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElHWnBaV3hrYzF4dVkyOXVjM1FnWDNkcFpIUm9JRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9aV2xuYUhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOdmJITWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzSnZkM01nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwWTJVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScFpWTnBlbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwYzNCbGNuTnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZEdGMFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNiaThxS2x4dUlDb2dRSFI1Y0dWa1pXWWdlMDlpYW1WamRIMGdSM0pwWkV4aGVXOTFkRU52Ym1acFozVnlZWFJwYjI1Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VkMmxrZEdnZ0xTQlVhR1VnYldsdWFXMWhiQ0IzYVdSMGFDQnZaaUIwYUdselhHNGdLaUJIY21sa1RHRjViM1YwSUdsdUlIQnBlR1ZzY3k0N1hHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbWhsYVdkb2RGMGdMU0JVYUdVZ2JXbHVhVzFoYkNCb1pXbG5hSFFnYjJaY2JpQXFJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDQnBiaUJ3YVhobGJITXVMbHh1SUNvZ1FIQnliM0JsY25SNUlIdE9kVzFpWlhKOUlHTnZibVpwWnk1a2FYTndaWEp6YVc5dUlDMGdWR2hsSUdScGMzUmhibU5sSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVmNiaUFxSUd4aGVXOTFkQ0JoSUdScFpTQmpZVzRnWW1VZ2JHRjViM1YwTGx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NWthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkhjbWxrVEdGNWIzVjBJR2hoYm1Sc1pYTWdiR0Y1YVc1bklHOTFkQ0IwYUdVZ1pHbGpaU0J2YmlCaElFUnBZMlZDYjJGeVpDNWNiaUFxTDF4dVkyOXVjM1FnUjNKcFpFeGhlVzkxZENBOUlHTnNZWE56SUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRIY21sa1RHRjViM1YwUTI5dVptbG5kWEpoZEdsdmJuMGdZMjl1Wm1sbklDMGdWR2hsSUdOdmJtWnBaM1Z5WVhScGIyNGdiMllnZEdobElFZHlhV1JNWVhsdmRYUmNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaDdYRzRnSUNBZ0lDQWdJSGRwWkhSb0xGeHVJQ0FnSUNBZ0lDQm9aV2xuYUhRc1hHNGdJQ0FnSUNBZ0lHUnBjM0JsY25OcGIyNHNYRzRnSUNBZ0lDQWdJR1JwWlZOcGVtVmNiaUFnSUNCOUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ1gyUnBZMlV1YzJWMEtIUm9hWE1zSUZ0ZEtUdGNiaUFnSUNBZ0lDQWdYMlJwWlZOcGVtVXVjMlYwS0hSb2FYTXNJREVwTzF4dUlDQWdJQ0FnSUNCZmQybGtkR2d1YzJWMEtIUm9hWE1zSURBcE8xeHVJQ0FnSUNBZ0lDQmZhR1ZwWjJoMExuTmxkQ2gwYUdsekxDQXdLVHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVdWVGFYcGxJRDBnWkdsbFUybDZaVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNhV1IwYUNBOUlIZHBaSFJvTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZDJsa2RHZ2dhVzRnY0dsNFpXeHpJSFZ6WldRZ1lua2dkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ2JXOWtkV3hsT21WeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lnVjJsa2RHZ2dQajBnTUZ4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlJRnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0IzYVdSMGFDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjkzYVdSMGFDNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyVjBJSGRwWkhSb0tIY3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQaUIzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCWGFXUjBhQ0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Dd2daMjkwSUNja2UzZDlKeUJwYm5OMFpXRmtMbUFwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lGOTNhV1IwYUM1elpYUW9kR2hwY3l3Z2R5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCb1pXbG5hSFFnYVc0Z2NHbDRaV3h6SUhWelpXUWdZbmtnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJjYmlBZ0lDQWdLaUJBZEdoeWIzZHpJRzF2WkhWc1pUcGxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdVEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUlFaGxhV2RvZENBK1BTQXdYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXbG5hSFFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmFHVnBaMmgwTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WlhRZ2FHVnBaMmgwS0dncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BpQm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlLR0JJWldsbmFIUWdjMmh2ZFd4a0lHSmxJR0VnYm5WdFltVnlJR3hoY21kbGNpQjBhR0Z1SURBc0lHZHZkQ0FuSkh0b2ZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCZmFHVnBaMmgwTG5ObGRDaDBhR2x6TENCb0tUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1ZlkyRnNZM1ZzWVhSbFIzSnBaQ2gwYUdsekxuZHBaSFJvTENCMGFHbHpMbWhsYVdkb2RDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVWdkR2hoZENCallXNGdZbVVnYkdGNWIzVjBJRzl1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnVkdocGMxeHVJQ0FnSUNBcUlHNTFiV0psY2lCcGN5QStQU0F3TGlCU1pXRmtJRzl1YkhrdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTI5c2N5QXFJSFJvYVhNdVgzSnZkM003WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHUnBjM0JsY25OcGIyNGdiR1YyWld3Z2RYTmxaQ0JpZVNCMGFHbHpJRWR5YVdSTVlYbHZkWFF1SUZSb1pTQmthWE53WlhKemFXOXVJR3hsZG1Wc1hHNGdJQ0FnSUNvZ2FXNWthV05oZEdWeklIUm9aU0JrYVhOMFlXNWpaU0JtY205dElIUm9aU0JqWlc1MFpYSWdaR2xqWlNCallXNGdZbVVnYkdGNWIzVjBMaUJWYzJVZ01TQm1iM0lnWVZ4dUlDQWdJQ0FxSUhScFoyaDBJSEJoWTJ0bFpDQnNZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRHaHliM2R6SUcxdlpIVnNaVHBsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlJRVJwYzNCbGNuTnBiMjRnUGowZ01GeHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMzQmxjbk5wYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZaR2x6Y0dWeWMybHZiaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUdScGMzQmxjbk5wYjI0b1pDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStJR1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUVScGMzQmxjbk5wYjI0Z2MyaHZkV3hrSUdKbElHRWdiblZ0WW1WeUlHeGhjbWRsY2lCMGFHRnVJREFzSUdkdmRDQW5KSHRrZlNjZ2FXNXpkR1ZoWkM1Z0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMlJwYzNCbGNuTnBiMjR1YzJWMEtIUm9hWE1zSUdRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J6YVhwbElHOW1JR0VnWkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCdGIyUjFiR1U2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMa052Ym1acFozVnlZWFJwYjI1RmNuSnZjaUJFYVdWVGFYcGxJRDQ5SURCY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVdWVGFYcGxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJScFpWTnBlbVV1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCa2FXVlRhWHBsS0dSektTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lENDlJR1J6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCa2FXVlRhWHBsSUhOb2IzVnNaQ0JpWlNCaElHNTFiV0psY2lCc1lYSm5aWElnZEdoaGJpQXhMQ0JuYjNRZ0p5UjdaSE45SnlCcGJuTjBaV0ZrTG1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJRjlrYVdWVGFYcGxMbk5sZENoMGFHbHpMQ0JrY3lrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WDJOaGJHTjFiR0YwWlVkeWFXUW9kR2hwY3k1M2FXUjBhQ3dnZEdocGN5NW9aV2xuYUhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdkbGRDQnliM1JoZEdVb0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElISWdQU0JmY205MFlYUmxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFZ1WkdWbWFXNWxaQ0E5UFQwZ2NpQS9JSFJ5ZFdVZ09pQnlPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITmxkQ0J5YjNSaGRHVW9jaWtnZTF4dUlDQWdJQ0FnSUNCZmNtOTBZWFJsTG5ObGRDaDBhR2x6TENCeUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYm5WdFltVnlJRzltSUhKdmQzTWdhVzRnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZTQlVhR1VnYm5WdFltVnlJRzltSUhKdmQzTXNJREFnUENCeWIzZHpMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRjl5YjNkektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM0p2ZDNNdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J1ZFcxaVpYSWdiMllnWTI5c2RXMXVjeUJwYmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPZFcxaVpYSjlJRlJvWlNCdWRXMWlaWElnYjJZZ1kyOXNkVzF1Y3l3Z01DQThJR052YkhWdGJuTXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdYMk52YkhNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZZMjlzY3k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR05sYm5SbGNpQmpaV3hzSUdsdUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA5aWFtVmpkSDBnVkdobElHTmxiblJsY2lBb2NtOTNMQ0JqYjJ3cExseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElGOWpaVzUwWlhJb0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElISnZkeUE5SUhKaGJtUnZiV2w2WlVObGJuUmxjaWgwYUdsekxsOXliM2R6SUM4Z01pa2dMU0F4TzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjJ3Z1BTQnlZVzVrYjIxcGVtVkRaVzUwWlhJb2RHaHBjeTVmWTI5c2N5QXZJRElwSUMwZ01UdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdlM0p2ZHl3Z1kyOXNmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJNWVhsdmRYUWdaR2xqWlNCdmJpQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTIxdlpIVnNaVHBFYVdWK1JHbGxXMTE5SUdScFkyVWdMU0JVYUdVZ1pHbGpaU0IwYnlCc1lYbHZkWFFnYjI0Z2RHaHBjeUJNWVhsdmRYUXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdiVzlrZFd4bE9rUnBaWDVFYVdWYlhYMGdWR2hsSUhOaGJXVWdiR2x6ZENCdlppQmthV05sTENCaWRYUWdibTkzSUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdlMjF2WkhWc1pUcGxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNKK1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eWZTQlVhR1VnYm5WdFltVnlJRzltWEc0Z0lDQWdJQ29nWkdsalpTQnphRzkxYkdRZ2JtOTBJR1Y0WTJWbFpDQjBhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR2x6SUV4aGVXOTFkQ0JqWVc1Y2JpQWdJQ0FnS2lCc1lYbHZkWFF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdiR0Y1YjNWMEtHUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLR1JwWTJVdWJHVnVaM1JvSUQ0Z2RHaHBjeTV0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCVWFHVWdiblZ0WW1WeUlHOW1JR1JwWTJVZ2RHaGhkQ0JqWVc0Z1ltVWdiR0Y1YjNWMElHbHpJQ1I3ZEdocGN5NXRZWGhwYlhWdFRuVnRZbVZ5VDJaRWFXTmxmU3dnWjI5MElDUjdaR2xqWlM1c1pXNW5hSFI5SUdScFkyVWdhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sSUQwZ1cxMDdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUnBZMlZVYjB4aGVXOTFkQ0E5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWkdsbElHOW1JR1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaGthV1V1YUdGelEyOXZjbVJwYm1GMFpYTW9LU0FtSmlCa2FXVXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCRWFXTmxJSFJvWVhRZ1lYSmxJR0psYVc1bklHaGxiR1FnWVc1a0lHaGhkbVVnWW1WbGJpQnNZWGx2ZFhRZ1ltVm1iM0psSUhOb2IzVnNaRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUd0bFpYQWdkR2hsYVhJZ1kzVnljbVZ1ZENCamIyOXlaR2x1WVhSbGN5QmhibVFnY205MFlYUnBiMjR1SUVsdUlHOTBhR1Z5SUhkdmNtUnpMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUhSb1pYTmxJR1JwWTJVZ1lYSmxJSE5yYVhCd1pXUXVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZV3h5WldGa2VVeGhlVzkxZEVScFkyVXVjSFZ6YUNoa2FXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXTmxWRzlNWVhsdmRYUXVjSFZ6YUNoa2FXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV0Y0SUQwZ1RXRjBhQzV0YVc0b1pHbGpaUzVzWlc1bmRHZ2dLaUIwYUdsekxtUnBjM0JsY25OcGIyNHNJSFJvYVhNdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpTazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHRjJZV2xzWVdKc1pVTmxiR3h6SUQwZ2RHaHBjeTVmWTI5dGNIVjBaVUYyWVdsc1lXSnNaVU5sYkd4ektHMWhlQ3dnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdaR2xsSUc5bUlHUnBZMlZVYjB4aGVXOTFkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtRnVaRzl0U1c1a1pYZ2dQU0JOWVhSb0xtWnNiMjl5S0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJoZG1GcGJHRmliR1ZEWld4c2N5NXNaVzVuZEdncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjbUZ1Wkc5dFEyVnNiQ0E5SUdGMllXbHNZV0pzWlVObGJHeHpXM0poYm1SdmJVbHVaR1Y0WFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0YyWVdsc1lXSnNaVU5sYkd4ekxuTndiR2xqWlNoeVlXNWtiMjFKYm1SbGVDd2dNU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlM1amIyOXlaR2x1WVhSbGN5QTlJSFJvYVhNdVgyNTFiV0psY2xSdlEyOXZjbVJwYm1GMFpYTW9jbUZ1Wkc5dFEyVnNiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1V1Y205MFlYUnBiMjRnUFNCMGFHbHpMbkp2ZEdGMFpTQS9JRTFoZEdndWNtOTFibVFvVFdGMGFDNXlZVzVrYjIwb0tTQXFJRVpWVEV4ZlEwbFNRMHhGWDBsT1gwUkZSMUpGUlZNcElEb2diblZzYkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lGOWthV05sTG5ObGRDaDBhR2x6TENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNrN1hHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHRnNjbVZoWkhsTVlYbHZkWFJFYVdObE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiWEIxZEdVZ1lTQnNhWE4wSUhkcGRHZ2dZWFpoYVd4aFlteGxJR05sYkd4eklIUnZJSEJzWVdObElHUnBZMlVnYjI0dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYldGNElDMGdWR2hsSUc1MWJXSmxjaUJsYlhCMGVTQmpaV3hzY3lCMGJ5QmpiMjF3ZFhSbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1JHbGxXMTE5SUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sSUMwZ1FTQnNhWE4wSUhkcGRHZ2daR2xqWlNCMGFHRjBJR2hoZG1VZ1lXeHlaV0ZrZVNCaVpXVnVJR3hoZVc5MWRDNWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9WVzFpWlhKYlhYMGdWR2hsSUd4cGMzUWdiMllnWVhaaGFXeGhZbXhsSUdObGJHeHpJSEpsY0hKbGMyVnVkR1ZrSUdKNUlIUm9aV2x5SUc1MWJXSmxjaTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpiMjF3ZFhSbFFYWmhhV3hoWW14bFEyVnNiSE1vYldGNExDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhkbUZwYkdGaWJHVWdQU0J1WlhjZ1UyVjBLQ2s3WEc0Z0lDQWdJQ0FnSUd4bGRDQnNaWFpsYkNBOUlEQTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHMWhlRXhsZG1Wc0lEMGdUV0YwYUM1dGFXNG9kR2hwY3k1ZmNtOTNjeXdnZEdocGN5NWZZMjlzY3lrN1hHNWNiaUFnSUNBZ0lDQWdkMmhwYkdVZ0tHRjJZV2xzWVdKc1pTNXphWHBsSUR3Z2JXRjRJQ1ltSUd4bGRtVnNJRHdnYldGNFRHVjJaV3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWTJWc2JDQnZaaUIwYUdsekxsOWpaV3hzYzA5dVRHVjJaV3dvYkdWMlpXd3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIVnVaR1ZtYVc1bFpDQWhQVDBnWTJWc2JDQW1KaUIwYUdsekxsOWpaV3hzU1hORmJYQjBlU2hqWld4c0xDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYWmhhV3hoWW14bExtRmtaQ2hqWld4c0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUd4bGRtVnNLeXM3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1FYSnlZWGt1Wm5KdmJTaGhkbUZwYkdGaWJHVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU5oYkdOMWJHRjBaU0JoYkd3Z1kyVnNiSE1nYjI0Z2JHVjJaV3dnWm5KdmJTQjBhR1VnWTJWdWRHVnlJRzltSUhSb1pTQnNZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYkdWMlpXd2dMU0JVYUdVZ2JHVjJaV3dnWm5KdmJTQjBhR1VnWTJWdWRHVnlJRzltSUhSb1pTQnNZWGx2ZFhRdUlEQmNiaUFnSUNBZ0tpQnBibVJwWTJGMFpYTWdkR2hsSUdObGJuUmxjaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU5sZER4T2RXMWlaWEkrZlNCMGFHVWdZMlZzYkhNZ2IyNGdkR2hsSUd4bGRtVnNJR2x1SUhSb2FYTWdiR0Y1YjNWMElISmxjSEpsYzJWdWRHVmtJR0o1WEc0Z0lDQWdJQ29nZEdobGFYSWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeHpUMjVNWlhabGJDaHNaWFpsYkNrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCalpXeHNjeUE5SUc1bGR5QlRaWFFvS1R0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJWdWRHVnlJRDBnZEdocGN5NWZZMlZ1ZEdWeU8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNnd0lEMDlQU0JzWlhabGJDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyVnNiSE11WVdSa0tIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaGpaVzUwWlhJcEtUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUhKdmR5QTlJR05sYm5SbGNpNXliM2NnTFNCc1pYWmxiRHNnY205M0lEdzlJR05sYm5SbGNpNXliM2NnS3lCc1pYWmxiRHNnY205M0t5c3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWld4c2N5NWhaR1FvZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0eWIzY3NJR052YkRvZ1kyVnVkR1Z5TG1OdmJDQXRJR3hsZG1Wc2ZTa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR05sYkd4ekxtRmtaQ2gwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTNKdmR5d2dZMjlzT2lCalpXNTBaWEl1WTI5c0lDc2diR1YyWld4OUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUdOdmJDQTlJR05sYm5SbGNpNWpiMndnTFNCc1pYWmxiQ0FySURFN0lHTnZiQ0E4SUdObGJuUmxjaTVqYjJ3Z0t5QnNaWFpsYkRzZ1kyOXNLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2M2SUdObGJuUmxjaTV5YjNjZ0xTQnNaWFpsYkN3Z1kyOXNmU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkem9nWTJWdWRHVnlMbkp2ZHlBcklHeGxkbVZzTENCamIyeDlLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWTJWc2JITTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSRzlsY3lCalpXeHNJR052Ym5SaGFXNGdZU0JqWld4c0lHWnliMjBnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlUvWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdZMlZzYkNBdElFRWdZMlZzYkNCcGJpQnNZWGx2ZFhRZ2NtVndjbVZ6Wlc1MFpXUWdZbmtnWVNCdWRXMWlaWEl1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRFYVdWYlhYMGdZV3h5WldGa2VVeGhlVzkxZEVScFkyVWdMU0JCSUd4cGMzUWdiMllnWkdsalpTQjBhR0YwSUdoaGRtVWdZV3h5WldGa2VTQmlaV1Z1SUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMEp2YjJ4bFlXNTlJRlJ5ZFdVZ2FXWWdZMlZzYkNCa2IyVnpJRzV2ZENCamIyNTBZV2x1SUdFZ1pHbGxMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTmxiR3hKYzBWdGNIUjVLR05sYkd3c0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUWdQVDA5SUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sTG1acGJtUW9aR2xsSUQwK0lHTmxiR3dnUFQwOUlIUm9hWE11WDJOdmIzSmthVzVoZEdWelZHOU9kVzFpWlhJb1pHbGxMbU52YjNKa2FXNWhkR1Z6S1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElHNTFiV0psY2lCMGJ5QmhJR05sYkd3Z0tISnZkeXdnWTI5c0tWeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUc0Z0xTQlVhR1VnYm5WdFltVnlJSEpsY0hKbGMyVnVkR2x1WnlCaElHTmxiR3hjYmlBZ0lDQWdLaUJBY21WMGRYSnVjeUI3VDJKcVpXTjBmU0JTWlhSMWNtNGdkR2hsSUdObGJHd2dLSHR5YjNjc0lHTnZiSDBwSUdOdmNuSmxjM0J2Ym1ScGJtY2diaTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOXVkVzFpWlhKVWIwTmxiR3dvYmlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2UzSnZkem9nVFdGMGFDNTBjblZ1WXlodUlDOGdkR2hwY3k1ZlkyOXNjeWtzSUdOdmJEb2diaUFsSUhSb2FYTXVYMk52YkhOOU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQmpaV3hzSUhSdklHRWdiblZ0WW1WeVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWTJWc2JDQXRJRlJvWlNCalpXeHNJSFJ2SUdOdmJuWmxjblFnZEc4Z2FYUnpJRzUxYldKbGNpNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOGRXNWtaV1pwYm1Wa2ZTQlVhR1VnYm5WdFltVnlJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUdObGJHd3VYRzRnSUNBZ0lDb2dVbVYwZFhKdWN5QjFibVJsWm1sdVpXUWdkMmhsYmlCMGFHVWdZMlZzYkNCcGN5QnViM1FnYjI0Z2RHaGxJR3hoZVc5MWRGeHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeFViMDUxYldKbGNpaDdjbTkzTENCamIyeDlLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRHc5SUhKdmR5QW1KaUJ5YjNjZ1BDQjBhR2x6TGw5eWIzZHpJQ1ltSURBZ1BEMGdZMjlzSUNZbUlHTnZiQ0E4SUhSb2FYTXVYMk52YkhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5YjNjZ0tpQjBhR2x6TGw5amIyeHpJQ3NnWTI5c08xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJR05sYkd3Z2NtVndjbVZ6Wlc1MFpXUWdZbmtnYVhSeklHNTFiV0psY2lCMGJ5QjBhR1ZwY2lCamIyOXlaR2x1WVhSbGN5NWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdUlDMGdWR2hsSUc1MWJXSmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmpaV3hzWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjlJRlJvWlNCamIyOXlaR2x1WVhSbGN5QmpiM0p5WlhOd2IyNWthVzVuSUhSdklIUm9aU0JqWld4c0lISmxjSEpsYzJWdWRHVmtJR0o1WEc0Z0lDQWdJQ29nZEdocGN5QnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmYm5WdFltVnlWRzlEYjI5eVpHbHVZWFJsY3lodUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5alpXeHNWRzlEYjI5eVpITW9kR2hwY3k1ZmJuVnRZbVZ5Vkc5RFpXeHNLRzRwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUdFZ2NHRnBjaUJ2WmlCamIyOXlaR2x1WVhSbGN5QjBieUJoSUc1MWJXSmxjaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUMkpxWldOMGZTQmpiMjl5WkhNZ0xTQlVhR1VnWTI5dmNtUnBibUYwWlhNZ2RHOGdZMjl1ZG1WeWRGeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5ZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUdOdmJuWmxjblJsWkNCMGJ5QmhJRzUxYldKbGNpNGdTV1pjYmlBZ0lDQWdLaUIwYUdVZ1kyOXZjbVJwYm1GMFpYTWdZWEpsSUc1dmRDQnZiaUIwYUdseklHeGhlVzkxZEN3Z2RHaGxJRzUxYldKbGNpQnBjeUIxYm1SbFptbHVaV1F1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMjl2Y21ScGJtRjBaWE5VYjA1MWJXSmxjaWhqYjI5eVpITXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiaUE5SUhSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loMGFHbHpMbDlqYjI5eVpITlViME5sYkd3b1kyOXZjbVJ6S1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUR3OUlHNGdKaVlnYmlBOElIUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRzQ3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVGJtRndJQ2g0TEhrcElIUnZJSFJvWlNCamJHOXpaWE4wSUdObGJHd2dhVzRnZEdocGN5Qk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWkdsbFkyOXZjbVJwYm1GMFpTQXRJRlJvWlNCamIyOXlaR2x1WVhSbElIUnZJR1pwYm1RZ2RHaGxJR05zYjNObGMzUWdZMlZzYkZ4dUlDQWdJQ0FxSUdadmNpNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwUnBaWDBnVzJScFpXTnZiM0prYVc1aGRDNWthV1VnUFNCdWRXeHNYU0F0SUZSb1pTQmthV1VnZEc4Z2MyNWhjQ0IwYnk1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnWkdsbFkyOXZjbVJwYm1GMFpTNTRJQzBnVkdobElIZ3RZMjl2Y21ScGJtRjBaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdaR2xsWTI5dmNtUnBibUYwWlM1NUlDMGdWR2hsSUhrdFkyOXZjbVJwYm1GMFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwOWlhbVZqZEh4dWRXeHNmU0JVYUdVZ1kyOXZjbVJwYm1GMFpTQnZaaUIwYUdVZ1kyVnNiQ0JqYkc5elpYTjBJSFJ2SUNoNExDQjVLUzVjYmlBZ0lDQWdLaUJPZFd4c0lIZG9aVzRnYm04Z2MzVnBkR0ZpYkdVZ1kyVnNiQ0JwY3lCdVpXRnlJQ2g0TENCNUtWeHVJQ0FnSUNBcUwxeHVJQ0FnSUhOdVlYQlVieWg3WkdsbElEMGdiblZzYkN3Z2VDd2dlWDBwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5eWJtVnlRMlZzYkNBOUlIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dUV0YwYUM1MGNuVnVZeWg1SUM4Z2RHaHBjeTVrYVdWVGFYcGxLU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nVFdGMGFDNTBjblZ1WXloNElDOGdkR2hwY3k1a2FXVlRhWHBsS1Z4dUlDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHTnZjbTVsY2lBOUlIUm9hWE11WDJObGJHeFViME52YjNKa2N5aGpiM0p1WlhKRFpXeHNLVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkMmxrZEdoSmJpQTlJR052Y201bGNpNTRJQ3NnZEdocGN5NWthV1ZUYVhwbElDMGdlRHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkMmxrZEdoUGRYUWdQU0IwYUdsekxtUnBaVk5wZW1VZ0xTQjNhV1IwYUVsdU8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCb1pXbG5hSFJKYmlBOUlHTnZjbTVsY2k1NUlDc2dkR2hwY3k1a2FXVlRhWHBsSUMwZ2VUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FHVnBaMmgwVDNWMElEMGdkR2hwY3k1a2FXVlRhWHBsSUMwZ2FHVnBaMmgwU1c0N1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2NYVmhaSEpoYm5SeklEMGdXM3RjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWhqYjNKdVpYSkRaV3hzS1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFbHVJQ29nYUdWcFoyaDBTVzVjYmlBZ0lDQWdJQ0FnZlN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY1RvZ2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUdOdmNtNWxja05sYkd3dWNtOTNMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1kyOXlibVZ5UTJWc2JDNWpiMndnS3lBeFhHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFOTFkQ0FxSUdobGFXZG9kRWx1WEc0Z0lDQWdJQ0FnSUgwc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhFNklIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCamIzSnVaWEpEWld4c0xuSnZkeUFySURFc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXNPaUJqYjNKdVpYSkRaV3hzTG1OdmJGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaEpiaUFxSUdobGFXZG9kRTkxZEZ4dUlDQWdJQ0FnSUNCOUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeE9pQjBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1kyOXlibVZ5UTJWc2JDNXliM2NnS3lBeExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nWTI5eWJtVnlRMlZzYkM1amIyd2dLeUF4WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZkbVZ5WVdkbE9pQjNhV1IwYUU5MWRDQXFJR2hsYVdkb2RFOTFkRnh1SUNBZ0lDQWdJQ0I5WFR0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCemJtRndWRzhnUFNCeGRXRmtjbUZ1ZEhOY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdObGJHd2djMmh2ZFd4a0lHSmxJRzl1SUhSb1pTQnNZWGx2ZFhSY2JpQWdJQ0FnSUNBZ0lDQWdJQzVtYVd4MFpYSW9LSEYxWVdSeVlXNTBLU0E5UGlCMWJtUmxabWx1WldRZ0lUMDlJSEYxWVdSeVlXNTBMbkVwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJqWld4c0lITm9iM1ZzWkNCaVpTQnViM1FnWVd4eVpXRmtlU0IwWVd0bGJpQmxlR05sY0hRZ1lua2dhWFJ6Wld4bVhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Wm1sc2RHVnlLQ2h4ZFdGa2NtRnVkQ2tnUFQ0Z0tGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHNTFiR3dnSVQwOUlHUnBaU0FtSmlCMGFHbHpMbDlqYjI5eVpHbHVZWFJsYzFSdlRuVnRZbVZ5S0dScFpTNWpiMjl5WkdsdVlYUmxjeWtnUFQwOUlIRjFZV1J5WVc1MExuRXBYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmSHdnZEdocGN5NWZZMlZzYkVselJXMXdkSGtvY1hWaFpISmhiblF1Y1N3Z1gyUnBZMlV1WjJWMEtIUm9hWE1wS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdObGJHd2djMmh2ZFd4a0lHSmxJR052ZG1WeVpXUWdZbmtnZEdobElHUnBaU0IwYUdVZ2JXOXpkRnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuSmxaSFZqWlNoY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBb2JXRjRVU3dnY1hWaFpISmhiblFwSUQwK0lIRjFZV1J5WVc1MExtTnZkbVZ5WVdkbElENGdiV0Y0VVM1amIzWmxjbUZuWlNBL0lIRjFZV1J5WVc1MElEb2diV0Y0VVN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCN2NUb2dkVzVrWldacGJtVmtMQ0JqYjNabGNtRm5aVG9nTFRGOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRZ0lUMDlJSE51WVhCVWJ5NXhJRDhnZEdocGN5NWZiblZ0WW1WeVZHOURiMjl5WkdsdVlYUmxjeWh6Ym1Gd1ZHOHVjU2tnT2lCdWRXeHNPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRWRsZENCMGFHVWdaR2xsSUdGMElIQnZhVzUwSUNoNExDQjVLVHRjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVRzlwYm5SOUlIQnZhVzUwSUMwZ1ZHaGxJSEJ2YVc1MElHbHVJQ2g0TENCNUtTQmpiMjl5WkdsdVlYUmxjMXh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMFJwWlh4dWRXeHNmU0JVYUdVZ1pHbGxJSFZ1WkdWeUlHTnZiM0prYVc1aGRHVnpJQ2g0TENCNUtTQnZjaUJ1ZFd4c0lHbG1JRzV2SUdScFpWeHVJQ0FnSUNBcUlHbHpJR0YwSUhSb1pTQndiMmx1ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhSQmRDaHdiMmx1ZENBOUlIdDRPaUF3TENCNU9pQXdmU2tnZTF4dUlDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHUnBaU0J2WmlCZlpHbGpaUzVuWlhRb2RHaHBjeWtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHUnBaUzVqYjI5eVpHbHVZWFJsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlRVpwZENBOUlIZ2dQRDBnY0c5cGJuUXVlQ0FtSmlCd2IybHVkQzU0SUR3OUlIZ2dLeUIwYUdsekxtUnBaVk5wZW1VN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjVSbWwwSUQwZ2VTQThQU0J3YjJsdWRDNTVJQ1ltSUhCdmFXNTBMbmtnUEQwZ2VTQXJJSFJvYVhNdVpHbGxVMmw2WlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIaEdhWFFnSmlZZ2VVWnBkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJrYVdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JuVnNiRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVd4amRXeGhkR1VnZEdobElHZHlhV1FnYzJsNlpTQm5hWFpsYmlCM2FXUjBhQ0JoYm1RZ2FHVnBaMmgwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJSGRwWkhSb0lDMGdWR2hsSUcxcGJtbHRZV3dnZDJsa2RHaGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2FHVnBaMmgwSUMwZ1ZHaGxJRzFwYm1sdFlXd2dhR1ZwWjJoMFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWVd4amRXeGhkR1ZIY21sa0tIZHBaSFJvTENCb1pXbG5hSFFwSUh0Y2JpQWdJQ0FnSUNBZ1gyTnZiSE11YzJWMEtIUm9hWE1zSUUxaGRHZ3VabXh2YjNJb2QybGtkR2dnTHlCMGFHbHpMbVJwWlZOcGVtVXBLVHRjYmlBZ0lDQWdJQ0FnWDNKdmQzTXVjMlYwS0hSb2FYTXNJRTFoZEdndVpteHZiM0lvYUdWcFoyaDBJQzhnZEdocGN5NWthV1ZUYVhwbEtTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJQ2h5YjNjc0lHTnZiQ2tnWTJWc2JDQjBieUFvZUN3Z2VTa2dZMjl2Y21ScGJtRjBaWE11WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdZMlZzYkNBdElGUm9aU0JqWld4c0lIUnZJR052Ym5abGNuUWdkRzhnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0UFltcGxZM1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUdOdmIzSmthVzVoZEdWekxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeFViME52YjNKa2N5aDdjbTkzTENCamIyeDlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUI3ZURvZ1kyOXNJQ29nZEdocGN5NWthV1ZUYVhwbExDQjVPaUJ5YjNjZ0tpQjBhR2x6TG1ScFpWTnBlbVY5TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnS0hnc0lIa3BJR052YjNKa2FXNWhkR1Z6SUhSdklHRWdLSEp2ZHl3Z1kyOXNLU0JqWld4c0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdOdmIzSmthVzVoZEdWeklDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZJR052Ym5abGNuUWdkRzhnWVNCalpXeHNMbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDlpYW1WamRIMGdWR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dZMlZzYkZ4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YjNKa2MxUnZRMlZzYkNoN2VDd2dlWDBwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1RXRjBhQzUwY25WdVl5aDVJQzhnZEdocGN5NWthV1ZUYVhwbEtTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJEb2dUV0YwYUM1MGNuVnVZeWg0SUM4Z2RHaHBjeTVrYVdWVGFYcGxLVnh1SUNBZ0lDQWdJQ0I5TzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdSM0pwWkV4aGVXOTFkSDA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1WEc0dktpcGNiaUFxSUVCdGIyUjFiR1VnYldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JseHVMeXBjYmlBcUlFTnZiblpsY25RZ1lXNGdTRlJOVENCaGRIUnlhV0oxZEdVZ2RHOGdZVzRnYVc1emRHRnVZMlVuY3lCd2NtOXdaWEowZVM0Z1hHNGdLbHh1SUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUc1aGJXVWdMU0JVYUdVZ1lYUjBjbWxpZFhSbEozTWdibUZ0WlZ4dUlDb2dRSEpsZEhWeWJpQjdVM1J5YVc1bmZTQlVhR1VnWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTZHpJRzVoYldVdUlFWnZjaUJsZUdGdGNHeGxMQ0JjSW0xNUxXRjBkSEpjSWx4dUlDb2dkMmxzYkNCaVpTQmpiMjUyWlhKMFpXUWdkRzhnWENKdGVVRjBkSEpjSWl3Z1lXNWtJRndpWkdsellXSnNaV1JjSWlCMGJ5QmNJbVJwYzJGaWJHVmtYQ0l1WEc0Z0tpOWNibU52Ym5OMElHRjBkSEpwWW5WMFpUSndjbTl3WlhKMGVTQTlJQ2h1WVcxbEtTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1cyWnBjbk4wTENBdUxpNXlaWE4wWFNBOUlHNWhiV1V1YzNCc2FYUW9YQ0l0WENJcE8xeHVJQ0FnSUhKbGRIVnliaUJtYVhKemRDQXJJSEpsYzNRdWJXRndLSGR2Y21RZ1BUNGdkMjl5WkM1emJHbGpaU2d3TENBeEtTNTBiMVZ3Y0dWeVEyRnpaU2dwSUNzZ2QyOXlaQzV6YkdsalpTZ3hLU2t1YW05cGJpZ3BPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQk5hWGhwYmlCN1FHeHBibXNnYlc5a2RXeGxPbTFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzNVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJSFJ2SUdFZ1kyeGhjM011WEc0Z0tseHVJQ29nUUhCaGNtRnRJSHNxZlNCVGRYQWdMU0JVYUdVZ1kyeGhjM01nZEc4Z2JXbDRJR2x1ZEc4dVhHNGdLaUJBY21WMGRYSnVJSHR0YjJSMWJHVTZiV2w0YVc0dlVtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZsSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdWR2hsSUcxcGVHVmtMV2x1SUdOc1lYTnpYRzRnS2k5Y2JtTnZibk4wSUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3lBOUlDaFRkWEFwSUQwK1hHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1RXbDRhVzRnZEc4Z2JXRnJaU0JoYkd3Z1lYUjBjbWxpZFhSbGN5QnZiaUJoSUdOMWMzUnZiU0JJVkUxTVJXeGxiV1Z1ZENCeVpXRmtMVzl1YkhrZ2FXNGdkR2hsSUhObGJuTmxYRzRnSUNBZ0lDb2dkR2hoZENCM2FHVnVJSFJvWlNCaGRIUnlhV0oxZEdVZ1oyVjBjeUJoSUc1bGR5QjJZV3gxWlNCMGFHRjBJR1JwWm1abGNuTWdabkp2YlNCMGFHVWdkbUZzZFdVZ2IyWWdkR2hsWEc0Z0lDQWdJQ29nWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTd2dhWFFnYVhNZ2NtVnpaWFFnZEc4Z2RHaGhkQ0J3Y205d1pYSjBlU2R6SUhaaGJIVmxMaUJVYUdWY2JpQWdJQ0FnS2lCaGMzTjFiWEIwYVc5dUlHbHpJSFJvWVhRZ1lYUjBjbWxpZFhSbElGd2liWGt0WVhSMGNtbGlkWFJsWENJZ1kyOXljbVZ6Y0c5dVpITWdkMmwwYUNCd2NtOXdaWEowZVNCY0luUm9hWE11YlhsQmRIUnlhV0oxZEdWY0lpNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1EyeGhjM045SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYaHBiaUIwYUdseklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5NWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJRlJvWlNCdGFYaGxaQ0JwYmlCamJHRnpjeTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ0YVhocGJseHVJQ0FnSUNBcUlFQmhiR2xoY3lCdGIyUjFiR1U2YldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmbEpsWVdSUGJteDVRWFIwY21saWRYUmxjMXh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnNZWE56SUdWNGRHVnVaSE1nVTNWd0lIdGNibHh1SUNBZ0lDQWdJQ0F2S2lwY2JpQWdJQ0FnSUNBZ0lDb2dRMkZzYkdKaFkyc2dkR2hoZENCcGN5QmxlR1ZqZFhSbFpDQjNhR1Z1SUdGdUlHOWljMlZ5ZG1Wa0lHRjBkSEpwWW5WMFpTZHpJSFpoYkhWbElHbHpYRzRnSUNBZ0lDQWdJQ0FxSUdOb1lXNW5aV1F1SUVsbUlIUm9aU0JJVkUxTVJXeGxiV1Z1ZENCcGN5QmpiMjV1WldOMFpXUWdkRzhnZEdobElFUlBUU3dnZEdobElHRjBkSEpwWW5WMFpWeHVJQ0FnSUNBZ0lDQWdLaUIyWVd4MVpTQmpZVzRnYjI1c2VTQmlaU0J6WlhRZ2RHOGdkR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dTRlJOVEVWc1pXMWxiblFuY3lCd2NtOXdaWEowZVM1Y2JpQWdJQ0FnSUNBZ0lDb2dTVzRnWldabVpXTjBMQ0IwYUdseklHMWhhMlZ6SUhSb2FYTWdTRlJOVEVWc1pXMWxiblFuY3lCaGRIUnlhV0oxZEdWeklISmxZV1F0YjI1c2VTNWNiaUFnSUNBZ0lDQWdJQ3BjYmlBZ0lDQWdJQ0FnSUNvZ1JtOXlJR1Y0WVcxd2JHVXNJR2xtSUdGdUlFaFVUVXhGYkdWdFpXNTBJR2hoY3lCaGJpQmhkSFJ5YVdKMWRHVWdYQ0o0WENJZ1lXNWtYRzRnSUNBZ0lDQWdJQ0FxSUdOdmNuSmxjM0J2Ym1ScGJtY2djSEp2Y0dWeWRIa2dYQ0o0WENJc0lIUm9aVzRnWTJoaGJtZHBibWNnZEdobElIWmhiSFZsSUZ3aWVGd2lJSFJ2SUZ3aU5Wd2lYRzRnSUNBZ0lDQWdJQ0FxSUhkcGJHd2diMjVzZVNCM2IzSnJJSGRvWlc0Z1lIUm9hWE11ZUNBOVBUMGdOV0F1WEc0Z0lDQWdJQ0FnSUNBcVhHNGdJQ0FnSUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVZVzFsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc1aGJXVXVYRzRnSUNBZ0lDQWdJQ0FxSUVCd1lYSmhiU0I3VTNSeWFXNW5mU0J2YkdSV1lXeDFaU0F0SUZSb1pTQmhkSFJ5YVdKMWRHVW5jeUJ2YkdRZ2RtRnNkV1V1WEc0Z0lDQWdJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdVpYZFdZV3gxWlNBdElGUm9aU0JoZEhSeWFXSjFkR1VuY3lCdVpYY2dkbUZzZFdVdVhHNGdJQ0FnSUNBZ0lDQXFMMXh1SUNBZ0lDQWdJQ0JoZEhSeWFXSjFkR1ZEYUdGdVoyVmtRMkZzYkdKaFkyc29ibUZ0WlN3Z2IyeGtWbUZzZFdVc0lHNWxkMVpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QkJiR3dnWVhSMGNtbGlkWFJsY3lCaGNtVWdiV0ZrWlNCeVpXRmtMVzl1YkhrZ2RHOGdjSEpsZG1WdWRDQmphR1ZoZEdsdVp5QmllU0JqYUdGdVoybHVaMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdkR2hsSUdGMGRISnBZblYwWlNCMllXeDFaWE11SUU5bUlHTnZkWEp6WlN3Z2RHaHBjeUJwY3lCaWVTQnViMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdaM1ZoY21GdWRHVmxJSFJvWVhRZ2RYTmxjbk1nZDJsc2JDQnViM1FnWTJobFlYUWdhVzRnWVNCa2FXWm1aWEpsYm5RZ2QyRjVMbHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY0hKdmNHVnlkSGtnUFNCaGRIUnlhV0oxZEdVeWNISnZjR1Z5ZEhrb2JtRnRaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NWpiMjV1WldOMFpXUWdKaVlnYm1WM1ZtRnNkV1VnSVQwOUlHQWtlM1JvYVhOYmNISnZjR1Z5ZEhsZGZXQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2h1WVcxbExDQjBhR2x6VzNCeWIzQmxjblI1WFNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVZMjl1YzNRZ1ZtRnNhV1JoZEdsdmJrVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJGY25KdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9iWE5uS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0cxelp5azdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JXWVd4cFpHRjBhVzl1UlhKeWIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vm1Gc2FXUmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOVdZV3hwWkdGMGFXOXVSWEp5YjNJdWFuTmNJanRjYmx4dVkyOXVjM1FnWDNaaGJIVmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWtaV1poZFd4MFZtRnNkV1VnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlZ5Y205eWN5QTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNibU52Ym5OMElGUjVjR1ZXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5Y3lBOUlGdGRmU2tnZTF4dUlDQWdJQ0FnSUNCZmRtRnNkV1V1YzJWMEtIUm9hWE1zSUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnWDJSbFptRjFiSFJXWVd4MVpTNXpaWFFvZEdocGN5d2daR1ZtWVhWc2RGWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ1gyVnljbTl5Y3k1elpYUW9kR2hwY3l3Z1pYSnliM0p6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2IzSnBaMmx1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gzWmhiSFZsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2RtRnNkV1VvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbWx6Vm1Gc2FXUWdQeUIwYUdsekxtOXlhV2RwYmlBNklGOWtaV1poZFd4MFZtRnNkV1V1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCbGNuSnZjbk1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlpYSnliM0p6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2FYTldZV3hwWkNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlEQWdQajBnZEdocGN5NWxjbkp2Y25NdWJHVnVaM1JvTzF4dUlDQWdJSDFjYmx4dUlDQWdJR1JsWm1GMWJIUlVieWh1WlhkRVpXWmhkV3gwS1NCN1hHNGdJQ0FnSUNBZ0lGOWtaV1poZFd4MFZtRnNkV1V1YzJWMEtIUm9hWE1zSUc1bGQwUmxabUYxYkhRcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmZZMmhsWTJzb2UzQnlaV1JwWTJGMFpTd2dZbWx1WkZaaGNtbGhZbXhsY3lBOUlGdGRMQ0JGY25KdmNsUjVjR1VnUFNCV1lXeHBaR0YwYVc5dVJYSnliM0o5S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhCeWIzQnZjMmwwYVc5dUlEMGdjSEpsWkdsallYUmxMbUZ3Y0d4NUtIUm9hWE1zSUdKcGJtUldZWEpwWVdKc1pYTXBPMXh1SUNBZ0lDQWdJQ0JwWmlBb0lYQnliM0J2YzJsMGFXOXVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjaUE5SUc1bGR5QkZjbkp2Y2xSNWNHVW9kR2hwY3k1MllXeDFaU3dnWW1sdVpGWmhjbWxoWW14bGN5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkwyTnZibk52YkdVdWQyRnliaWhsY25KdmNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WlhKeWIzSnpMbkIxYzJnb1pYSnliM0lwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE03WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFaaGJHbGtZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2Vm1Gc2FXUmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElGQmhjbk5sUlhKeWIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGWmhiR2xrWVhScGIyNUZjbkp2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2JYTm5LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLRzF6WnlrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlFZWEp6WlVWeWNtOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFaaGJHbGtZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2Vm1Gc2FXUmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElFbHVkbUZzYVdSVWVYQmxSWEp5YjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZaaGJHbGtZWFJwYjI1RmNuSnZjaUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYlhObktTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtHMXpaeWs3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCSmJuWmhiR2xrVkhsd1pVVnljbTl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDFSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VHRnljMlZGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0SmJuWmhiR2xrVkhsd1pVVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlKYm5aaGJHbGtWSGx3WlVWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElFbE9WRVZIUlZKZlJFVkdRVlZNVkY5V1FVeFZSU0E5SURBN1hHNWpiMjV6ZENCSmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1ZIbHdaVlpoYkdsa1lYUnZjaUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnYkdWMElIWmhiSFZsSUQwZ1NVNVVSVWRGVWw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmtaV1poZFd4MFZtRnNkV1VnUFNCSlRsUkZSMFZTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHVnljbTl5Y3lBOUlGdGRPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaE9kVzFpWlhJdWFYTkpiblJsWjJWeUtHbHVjSFYwS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc2RXVWdQU0JwYm5CMWREdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2hjSW5OMGNtbHVaMXdpSUQwOVBTQjBlWEJsYjJZZ2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIQmhjbk5sWkZaaGJIVmxJRDBnY0dGeWMyVkpiblFvYVc1d2RYUXNJREV3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoT2RXMWlaWEl1YVhOSmJuUmxaMlZ5S0hCaGNuTmxaRlpoYkhWbEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdjR0Z5YzJWa1ZtRnNkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCUVlYSnpaVVZ5Y205eUtHbHVjSFYwS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxjbkp2Y25NdWNIVnphQ2h1WlhjZ1NXNTJZV3hwWkZSNWNHVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjM1Z3WlhJb2UzWmhiSFZsTENCa1pXWmhkV3gwVm1Gc2RXVXNJR1Z5Y205eWMzMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHeGhjbWRsY2xSb1lXNG9iaWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb2Jpa2dQVDRnZEdocGN5NXZjbWxuYVc0Z1BqMGdiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnBibVJXWVhKcFlXSnNaWE02SUZ0dVhWeHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpiV0ZzYkdWeVZHaGhiaWh1S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDaHVLU0E5UGlCMGFHbHpMbTl5YVdkcGJpQThQU0J1TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZbWx1WkZaaGNtbGhZbXhsY3pvZ1cyNWRYRzRnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR0psZEhkbFpXNG9iaXdnYlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJobFkyc29lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NISmxaR2xqWVhSbE9pQW9iaXdnYlNrZ1BUNGdkR2hwY3k1c1lYSm5aWEpVYUdGdUtHNHBJQ1ltSUhSb2FYTXVjMjFoYkd4bGNsUm9ZVzRvYlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpYVc1a1ZtRnlhV0ZpYkdWek9pQmJiaXdnYlYxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JKYm5SbFoyVnlWSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdFVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5VWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwbHVkbUZzYVdSVWVYQmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDBsdWRtRnNhV1JVZVhCbFJYSnliM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdVMVJTU1U1SFgwUkZSa0ZWVEZSZlZrRk1WVVVnUFNCY0lsd2lPMXh1WTI5dWMzUWdVM1J5YVc1blZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdVMVJTU1U1SFgwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1JsWm1GMWJIUldZV3gxWlNBOUlGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y25NZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9YQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUdsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjJZV3gxWlNBOUlHbHVjSFYwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWEp5YjNKekxuQjFjMmdvYm1WM0lFbHVkbUZzYVdSVWVYQmxSWEp5YjNJb2FXNXdkWFFwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSE4xY0dWeUtIdDJZV3gxWlN3Z1pHVm1ZWFZzZEZaaGJIVmxMQ0JsY25KdmNuTjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnViM1JGYlhCMGVTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0NrZ1BUNGdYQ0pjSWlBaFBUMGdkR2hwY3k1dmNtbG5hVzVjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFSNWNHVldZV3hwWkdGMGIzSjlJR1p5YjIwZ1hDSXVMMVI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYmk4dmFXMXdiM0owSUh0UVlYSnpaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5UVlYSnpaVVZ5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBsdWRtRnNhV1JVZVhCbFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1EwOU1UMUpmUkVWR1FWVk1WRjlXUVV4VlJTQTlJRndpWW14aFkydGNJanRjYm1OdmJuTjBJRU52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdRMDlNVDFKZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1EwOU1UMUpmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYSnliM0p6SUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2ljM1J5YVc1blhDSWdQVDA5SUhSNWNHVnZaaUJwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JEYjJ4dmNsUjVjR1ZXWVd4cFpHRjBiM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0UVlYSnpaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5UVlYSnpaVVZ5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBsdWRtRnNhV1JVZVhCbFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1FrOVBURVZCVGw5RVJVWkJWVXhVWDFaQlRGVkZJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkNiMjlzWldGdVZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdRazlQVEVWQlRsOUVSVVpCVlV4VVgxWkJURlZGTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrWldaaGRXeDBWbUZzZFdVZ1BTQkNUMDlNUlVGT1gwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1Z5Y205eWN5QTlJRnRkTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2hwYm5CMWRDQnBibk4wWVc1alpXOW1JRUp2YjJ4bFlXNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhiSFZsSUQwZ2FXNXdkWFE3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1hDSnpkSEpwYm1kY0lpQTlQVDBnZEhsd1pXOW1JR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9MM1J5ZFdVdmFTNTBaWE4wS0dsdWNIVjBLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnZEhKMVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb0wyWmhiSE5sTDJrdWRHVnpkQ2hwYm5CMWRDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dVR0Z5YzJWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhKeWIzSnpMbkIxYzJnb2JtVjNJRWx1ZG1Gc2FXUlVlWEJsUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk45S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwYzFSeWRXVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxsOWphR1ZqYXloN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3Y21Wa2FXTmhkR1U2SUNncElEMCtJSFJ5ZFdVZ1BUMDlJSFJvYVhNdWIzSnBaMmx1WEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdselJtRnNjMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDZ3BJRDArSUdaaGJITmxJRDA5UFNCMGFHbHpMbTl5YVdkcGJseHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUVKdmIyeGxZVzVVZVhCbFZtRnNhV1JoZEc5eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMGx1ZEdWblpYSlVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5SmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0VGRISnBibWRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwTnZiRzl5Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwSnZiMnhsWVc1VWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWW05dmJHVmhiaWhwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVKdmIyeGxZVzVVZVhCbFZtRnNhV1JoZEc5eUtHbHVjSFYwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjJ4dmNpaHBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRU52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjaWhwYm5CMWRDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2FXNTBaV2RsY2locGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lFbHVkR1ZuWlhKVWVYQmxWbUZzYVdSaGRHOXlLR2x1Y0hWMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCemRISnBibWNvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCVGRISnBibWRVZVhCbFZtRnNhV1JoZEc5eUtHbHVjSFYwS1R0Y2JpQWdJQ0I5WEc1Y2JuMDdYRzVjYm1OdmJuTjBJRlpoYkdsa1lYUnZjbE5wYm1kc1pYUnZiaUE5SUc1bGR5QldZV3hwWkdGMGIzSW9LVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JXWVd4cFpHRjBiM0pUYVc1bmJHVjBiMjRnWVhNZ2RtRnNhV1JoZEdWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0N3Z01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dUx5b3FYRzRnS2lCQWJXOWtkV3hsWEc0Z0tpOWNibWx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZTQm1jbTl0SUZ3aUxpOXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTmNJanRjYm1sdGNHOXlkQ0I3ZG1Gc2FXUmhkR1Y5SUdaeWIyMGdYQ0l1TDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1welhDSTdYRzVjYmk4dklGUm9aU0J1WVcxbGN5QnZaaUIwYUdVZ0tHOWljMlZ5ZG1Wa0tTQmhkSFJ5YVdKMWRHVnpJRzltSUhSb1pTQlViM0JRYkdGNVpYSXVYRzVqYjI1emRDQkRUMHhQVWw5QlZGUlNTVUpWVkVVZ1BTQmNJbU52Ykc5eVhDSTdYRzVqYjI1emRDQk9RVTFGWDBGVVZGSkpRbFZVUlNBOUlGd2libUZ0WlZ3aU8xeHVZMjl1YzNRZ1UwTlBVa1ZmUVZSVVVrbENWVlJGSUQwZ1hDSnpZMjl5WlZ3aU8xeHVZMjl1YzNRZ1NFRlRYMVJWVWs1ZlFWUlVVa2xDVlZSRklEMGdYQ0pvWVhNdGRIVnlibHdpTzF4dVhHNHZMeUJVYUdVZ2NISnBkbUYwWlNCd2NtOXdaWEowYVdWeklHOW1JSFJvWlNCVWIzQlFiR0Y1WlhJZ1hHNWpiMjV6ZENCZlkyOXNiM0lnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMjVoYldVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDNOamIzSmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9ZWE5VZFhKdUlEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVMeW9xWEc0Z0tpQkJJRkJzWVhsbGNpQnBiaUJoSUdScFkyVWdaMkZ0WlM1Y2JpQXFYRzRnS2lCQklIQnNZWGxsY2lkeklHNWhiV1VnYzJodmRXeGtJR0psSUhWdWFYRjFaU0JwYmlCMGFHVWdaMkZ0WlM0Z1ZIZHZJR1JwWm1abGNtVnVkRnh1SUNvZ1ZHOXdVR3hoZVdWeUlHVnNaVzFsYm5SeklIZHBkR2dnZEdobElITmhiV1VnYm1GdFpTQmhkSFJ5YVdKMWRHVWdZWEpsSUhSeVpXRjBaV1FnWVhOY2JpQXFJSFJvWlNCellXMWxJSEJzWVhsbGNpNWNiaUFxWEc0Z0tpQkpiaUJuWlc1bGNtRnNJR2wwSUdseklISmxZMjl0YldWdVpHVmtJSFJvWVhRZ2JtOGdkSGR2SUhCc1lYbGxjbk1nWkc4Z2FHRjJaU0IwYUdVZ2MyRnRaU0JqYjJ4dmNpeGNiaUFxSUdGc2RHaHZkV2RvSUdsMElHbHpJRzV2ZENCMWJtTnZibU5sYVhaaFlteGxJSFJvWVhRZ1kyVnlkR0ZwYmlCa2FXTmxJR2RoYldWeklHaGhkbVVnY0d4aGVXVnljeUIzYjNKclhHNGdLaUJwYmlCMFpXRnRjeUIzYUdWeVpTQnBkQ0IzYjNWc1pDQnRZV3RsSUhObGJuTmxJR1p2Y2lCMGQyOGdiM0lnYlc5eVpTQmthV1ptWlhKbGJuUWdjR3hoZVdWeWN5QjBiMXh1SUNvZ2FHRjJaU0IwYUdVZ2MyRnRaU0JqYjJ4dmNpNWNiaUFxWEc0Z0tpQlVhR1VnYm1GdFpTQmhibVFnWTI5c2IzSWdZWFIwY21saWRYUmxjeUJoY21VZ2NtVnhkV2x5WldRdUlGUm9aU0J6WTI5eVpTQmhibVFnYUdGekxYUjFjbTVjYmlBcUlHRjBkSEpwWW5WMFpYTWdZWEpsSUc1dmRDNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvZ1FHMXBlR1Z6SUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JtTnZibk4wSUZSdmNGQnNZWGxsY2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6S0VoVVRVeEZiR1Z0Wlc1MEtTQjdYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEY21WaGRHVWdZU0J1WlhjZ1ZHOXdVR3hoZVdWeUxDQnZjSFJwYjI1aGJHeDVJR0poYzJWa0lHOXVJR0Z1SUdsdWRHbDBhV0ZzWEc0Z0lDQWdJQ29nWTI5dVptbG5kWEpoZEdsdmJpQjJhV0VnWVc0Z2IySnFaV04wSUhCaGNtRnRaWFJsY2lCdmNpQmtaV05zWVhKbFpDQmhkSFJ5YVdKMWRHVnpJR2x1SUVoVVRVd3VYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1cyTnZibVpwWjEwZ0xTQkJiaUJwYm1sMGFXRnNJR052Ym1acFozVnlZWFJwYjI0Z1ptOXlJSFJvWlZ4dUlDQWdJQ0FxSUhCc1lYbGxjaUIwYnlCamNtVmhkR1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJR052Ym1acFp5NWpiMnh2Y2lBdElGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSWdkWE5sWkNCcGJpQjBhR1VnWjJGdFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ1kyOXVabWxuTG01aGJXVWdMU0JVYUdseklIQnNZWGxsY2lkeklHNWhiV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjMk52Y21WZElDMGdWR2hwY3lCd2JHRjVaWEluY3lCelkyOXlaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMEp2YjJ4bFlXNTlJRnRqYjI1bWFXY3VhR0Z6VkhWeWJsMGdMU0JVYUdseklIQnNZWGxsY2lCb1lYTWdZU0IwZFhKdUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdGpiMnh2Y2l3Z2JtRnRaU3dnYzJOdmNtVXNJR2hoYzFSMWNtNTlJRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpiMnh2Y2xaaGJIVmxJRDBnZG1Gc2FXUmhkR1V1WTI5c2IzSW9ZMjlzYjNJZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9RMDlNVDFKZlFWUlVVa2xDVlZSRktTazdYRzRnSUNBZ0lDQWdJR2xtSUNoamIyeHZjbFpoYkhWbExtbHpWbUZzYVdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5amIyeHZjaTV6WlhRb2RHaHBjeXdnWTI5c2IzSldZV3gxWlM1MllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVc0lIUm9hWE11WTI5c2IzSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHliM2NnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpaGNJa0VnVUd4aGVXVnlJRzVsWldSeklHRWdZMjlzYjNJc0lIZG9hV05vSUdseklHRWdVM1J5YVc1bkxsd2lLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUc1aGJXVldZV3gxWlNBOUlIWmhiR2xrWVhSbExuTjBjbWx1WnlodVlXMWxJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0U1QlRVVmZRVlJVVWtsQ1ZWUkZLU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVZVzFsVm1Gc2RXVXVhWE5XWVd4cFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gyNWhiV1V1YzJWMEtIUm9hWE1zSUc1aGJXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1RrRk5SVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVibUZ0WlNrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0Z3aVFTQlFiR0Y1WlhJZ2JtVmxaSE1nWVNCdVlXMWxMQ0IzYUdsamFDQnBjeUJoSUZOMGNtbHVaeTVjSWlrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnpZMjl5WlZaaGJIVmxJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWh6WTI5eVpTQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tITmpiM0psVm1Gc2RXVXVhWE5XWVd4cFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gzTmpiM0psTG5ObGRDaDBhR2x6TENCelkyOXlaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVc0lIUm9hWE11YzJOdmNtVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMnRoZVM0Z1FTQndiR0Y1WlhJZ1pHOWxjeUJ1YjNRZ2JtVmxaQ0IwYnlCb1lYWmxJR0VnYzJOdmNtVXVYRzRnSUNBZ0lDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1MWJHd3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2hoYzFSMWNtNVdZV3gxWlNBOUlIWmhiR2xrWVhSbExtSnZiMnhsWVc0b2FHRnpWSFZ5YmlCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtbHpWSEoxWlNncE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYUdGelZIVnlibFpoYkhWbExtbHpWbUZzYVdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCb1lYTlVkWEp1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU3dnYUdGelZIVnliaWs3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJQYTJGNUxDQkJJSEJzWVhsbGNpQmtiMlZ6SUc1dmRDQmhiSGRoZVhNZ2FHRjJaU0JoSUhSMWNtNHVYRzRnSUNBZ0lDQWdJQ0FnSUNCZmFHRnpWSFZ5Ymk1elpYUW9kR2hwY3l3Z2JuVnNiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzNSaGRHbGpJR2RsZENCdlluTmxjblpsWkVGMGRISnBZblYwWlhNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmJYRzRnSUNBZ0lDQWdJQ0FnSUNCRFQweFBVbDlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQk9RVTFGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRk5EVDFKRlgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlZ4dUlDQWdJQ0FnSUNCZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUdScGMyTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ2NHeGhlV1Z5SjNNZ1kyOXNiM0l1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdVM1J5YVc1bmZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmpiMnh2Y2lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOWpiMnh2Y2k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTFOMGNtbHVaMzFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYm1GdFpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjl1WVcxbExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR2x6SUhCc1lYbGxjaWR6SUhOamIzSmxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2MyTnZjbVVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNJRDA5UFNCZmMyTnZjbVV1WjJWMEtIUm9hWE1wSUQ4Z01DQTZJRjl6WTI5eVpTNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVJQ0FnSUhObGRDQnpZMjl5WlNodVpYZFRZMjl5WlNrZ2UxeHVJQ0FnSUNBZ0lDQmZjMk52Y21VdWMyVjBLSFJvYVhNc0lHNWxkMU5qYjNKbEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUc1bGQxTmpiM0psS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuSmxiVzkyWlVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRkxDQnVaWGRUWTI5eVpTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJUZEdGeWRDQmhJSFIxY200Z1ptOXlJSFJvYVhNZ2NHeGhlV1Z5TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3Vkc5d1VHeGhlV1Z5ZlNCVWFHVWdjR3hoZVdWeUlIZHBkR2dnWVNCMGRYSnVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2MzUmhjblJVZFhKdUtDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTVwYzBOdmJtNWxZM1JsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXdZWEpsYm5ST2IyUmxMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRU4xYzNSdmJVVjJaVzUwS0Z3aWRHOXdPbk4wWVhKMExYUjFjbTVjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3YkdGNVpYSTZJSFJvYVhOY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1NrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdYMmhoYzFSMWNtNHVjMlYwS0hSb2FYTXNJSFJ5ZFdVcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXNJSFJ5ZFdVcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJGYm1RZ1lTQjBkWEp1SUdadmNpQjBhR2x6SUhCc1lYbGxjaTVjYmlBZ0lDQWdLaTljYmlBZ0lDQmxibVJVZFhKdUtDa2dlMXh1SUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnYm5Wc2JDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1JHOWxjeUIwYUdseklIQnNZWGxsY2lCb1lYWmxJR0VnZEhWeWJqOWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0Q2IyOXNaV0Z1ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1lYTlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaU0E5UFQwZ1gyaGhjMVIxY200dVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFRWdVM1J5YVc1bklISmxjSEpsYzJWdWRHRjBhVzl1SUc5bUlIUm9hWE1nY0d4aGVXVnlMQ0JvYVhNZ2IzSWdhR1Z5Y3lCdVlXMWxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdVM1J5YVc1bmZTQlVhR1VnY0d4aGVXVnlKM01nYm1GdFpTQnlaWEJ5WlhObGJuUnpJSFJvWlNCd2JHRjVaWElnWVhNZ1lTQnpkSEpwYm1jdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnZEc5VGRISnBibWNvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZ0pIdDBhR2x6TG01aGJXVjlZRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJKY3lCMGFHbHpJSEJzWVhsbGNpQmxjWFZoYkNCaGJtOTBhR1Z5SUhCc1lYbGxjajljYmlBZ0lDQWdLaUJjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0ZCc1lYbGxjbjBnYjNSb1pYSWdMU0JVYUdVZ2IzUm9aWElnY0d4aGVXVnlJSFJ2SUdOdmJYQmhjbVVnZEdocGN5QndiR0Y1WlhJZ2QybDBhQzVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElIZG9aVzRnWldsMGFHVnlJSFJvWlNCdlltcGxZM1FnY21WbVpYSmxibU5sY3lCaGNtVWdkR2hsSUhOaGJXVmNiaUFnSUNBZ0tpQnZjaUIzYUdWdUlHSnZkR2dnYm1GdFpTQmhibVFnWTI5c2IzSWdZWEpsSUhSb1pTQnpZVzFsTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR1Z4ZFdGc2N5aHZkR2hsY2lrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdVlXMWxJRDBnWENKemRISnBibWRjSWlBOVBUMGdkSGx3Wlc5bUlHOTBhR1Z5SUQ4Z2IzUm9aWElnT2lCdmRHaGxjaTV1WVcxbE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2IzUm9aWElnUFQwOUlIUm9hWE1nZkh3Z2JtRnRaU0E5UFQwZ2RHaHBjeTV1WVcxbE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm5kcGJtUnZkeTVqZFhOMGIyMUZiR1Z0Wlc1MGN5NWtaV1pwYm1Vb1hDSjBiM0F0Y0d4aGVXVnlYQ0lzSUZSdmNGQnNZWGxsY2lrN1hHNWNiaThxS2x4dUlDb2dWR2hsSUdSbFptRjFiSFFnYzNsemRHVnRJSEJzWVhsbGNpNGdSR2xqWlNCaGNtVWdkR2h5YjNkdUlHSjVJR0VnY0d4aGVXVnlMaUJHYjNJZ2MybDBkV0YwYVc5dWMxeHVJQ29nZDJobGNtVWdlVzkxSUhkaGJuUWdkRzhnY21WdVpHVnlJR0VnWW5WdVkyZ2diMllnWkdsalpTQjNhWFJvYjNWMElHNWxaV1JwYm1jZ2RHaGxJR052Ym1ObGNIUWdiMllnVUd4aGVXVnljMXh1SUNvZ2RHaHBjeUJFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJZ1kyRnVJR0psSUdFZ2MzVmljM1JwZEhWMFpTNGdUMllnWTI5MWNuTmxMQ0JwWmlCNWIzVW5aQ0JzYVd0bElIUnZYRzRnS2lCamFHRnVaMlVnZEdobElHNWhiV1VnWVc1a0wyOXlJSFJvWlNCamIyeHZjaXdnWTNKbFlYUmxJR0Z1WkNCMWMyVWdlVzkxY2lCdmQyNGdYQ0p6ZVhOMFpXMGdjR3hoZVdWeVhDSXVYRzRnS2lCQVkyOXVjM1JjYmlBcUwxeHVZMjl1YzNRZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNJRDBnYm1WM0lGUnZjRkJzWVhsbGNpaDdZMjlzYjNJNklGd2ljbVZrWENJc0lHNWhiV1U2SUZ3aUtsd2lmU2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5TEZ4dUlDQWdJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWx4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0TENBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1Y2JpOHZhVzF3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMlZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOOUlHWnliMjBnWENJdUwyMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3k1cWMxd2lPMXh1YVcxd2IzSjBJSHQyWVd4cFpHRjBaWDBnWm5KdmJTQmNJaTR2ZG1Gc2FXUmhkR1V2ZG1Gc2FXUmhkR1V1YW5OY0lqdGNibHh1THlvcVhHNGdLaUJBYlc5a2RXeGxYRzRnS2k5Y2JtTnZibk4wSUVOSlVrTk1SVjlFUlVkU1JVVlRJRDBnTXpZd095QXZMeUJrWldkeVpXVnpYRzVqYjI1emRDQk9WVTFDUlZKZlQwWmZVRWxRVXlBOUlEWTdJQzh2SUVSbFptRjFiSFFnTHlCeVpXZDFiR0Z5SUhOcGVDQnphV1JsWkNCa2FXVWdhR0Z6SURZZ2NHbHdjeUJ0WVhocGJYVnRMbHh1WTI5dWMzUWdSRVZHUVZWTVZGOURUMHhQVWlBOUlGd2lTWFp2Y25sY0lqdGNibU52Ym5OMElFUkZSa0ZWVEZSZldDQTlJREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgxa2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVNUMVJCVkVsUFRpQTlJREE3SUM4dklHUmxaM0psWlhOY2JtTnZibk4wSUVSRlJrRlZURlJmVDFCQlEwbFVXU0E5SURBdU5UdGNibHh1WTI5dWMzUWdRMDlNVDFKZlFWUlVVa2xDVlZSRklEMGdYQ0pqYjJ4dmNsd2lPMXh1WTI5dWMzUWdTRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVWdQU0JjSW1obGJHUXRZbmxjSWp0Y2JtTnZibk4wSUZCSlVGTmZRVlJVVWtsQ1ZWUkZJRDBnWENKd2FYQnpYQ0k3WEc1amIyNXpkQ0JTVDFSQlZFbFBUbDlCVkZSU1NVSlZWRVVnUFNCY0luSnZkR0YwYVc5dVhDSTdYRzVqYjI1emRDQllYMEZVVkZKSlFsVlVSU0E5SUZ3aWVGd2lPMXh1WTI5dWMzUWdXVjlCVkZSU1NVSlZWRVVnUFNCY0lubGNJanRjYmx4dVkyOXVjM1FnUWtGVFJWOUVTVVZmVTBsYVJTQTlJREV3TURzZ0x5OGdjSGhjYm1OdmJuTjBJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJRDBnTVRVN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxTlVVazlMUlY5WFNVUlVTQ0E5SURJdU5Uc2dMeThnY0hoY2JtTnZibk4wSUUxSlRsOVRWRkpQUzBWZlYwbEVWRWdnUFNBeE95QXZMeUJ3ZUZ4dVkyOXVjM1FnU0VGTVJpQTlJRUpCVTBWZlJFbEZYMU5KV2tVZ0x5QXlPeUF2THlCd2VGeHVZMjl1YzNRZ1ZFaEpVa1FnUFNCQ1FWTkZYMFJKUlY5VFNWcEZJQzhnTXpzZ0x5OGdjSGhjYm1OdmJuTjBJRkJKVUY5VFNWcEZJRDBnUWtGVFJWOUVTVVZmVTBsYVJTQXZJREUxT3lBdkwzQjRYRzVqYjI1emRDQlFTVkJmUTA5TVQxSWdQU0JjSW1Kc1lXTnJYQ0k3WEc1Y2JtTnZibk4wSUdSbFp6SnlZV1FnUFNBb1pHVm5LU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJR1JsWnlBcUlDaE5ZWFJvTGxCSklDOGdNVGd3S1R0Y2JuMDdYRzVjYm1OdmJuTjBJR2x6VUdsd1RuVnRZbVZ5SUQwZ2JpQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ2JuVnRZbVZ5SUQwZ2NHRnljMlZKYm5Rb2Jpd2dNVEFwTzF4dUlDQWdJSEpsZEhWeWJpQk9kVzFpWlhJdWFYTkpiblJsWjJWeUtHNTFiV0psY2lrZ0ppWWdNU0E4UFNCdWRXMWlaWElnSmlZZ2JuVnRZbVZ5SUR3OUlFNVZUVUpGVWw5UFJsOVFTVkJUTzF4dWZUdGNibHh1THlvcVhHNGdLaUJIWlc1bGNtRjBaU0JoSUhKaGJtUnZiU0J1ZFcxaVpYSWdiMllnY0dsd2N5QmlaWFIzWldWdUlERWdZVzVrSUhSb1pTQk9WVTFDUlZKZlQwWmZVRWxRVXk1Y2JpQXFYRzRnS2lCQWNtVjBkWEp1Y3lCN1RuVnRZbVZ5ZlNCQklISmhibVJ2YlNCdWRXMWlaWElnYml3Z01TRGlpYVFnYmlEaWlhUWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLaTljYm1OdmJuTjBJSEpoYm1SdmJWQnBjSE1nUFNBb0tTQTlQaUJOWVhSb0xtWnNiMjl5S0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJPVlUxQ1JWSmZUMFpmVUVsUVV5a2dLeUF4TzF4dVhHNWpiMjV6ZENCRVNVVmZWVTVKUTA5RVJWOURTRUZTUVVOVVJWSlRJRDBnVzF3aTRwcUFYQ0lzWENMaW1vRmNJaXhjSXVLYWdsd2lMRndpNHBxRFhDSXNYQ0xpbW9SY0lpeGNJdUthaFZ3aVhUdGNibHh1THlvcVhHNGdLaUJEYjI1MlpYSjBJR0VnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsSUdaaFkyVWdkRzhnZEdobElHNTFiV0psY2lCdlppQndhWEJ6SUc5bVhHNGdLaUIwYUdGMElITmhiV1VnWkdsbExpQlVhR2x6SUdaMWJtTjBhVzl1SUdseklIUm9aU0J5WlhabGNuTmxJRzltSUhCcGNITlViMVZ1YVdOdlpHVXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlIVWdMU0JVYUdVZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2RHOGdZMjl1ZG1WeWRDQjBieUJ3YVhCekxseHVJQ29nUUhKbGRIVnlibk1nZTA1MWJXSmxjbngxYm1SbFptbHVaV1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUc1MWJXSmxjaUJ2WmlCd2FYQnpMQ0F4SU9LSnBDQndhWEJ6SU9LSnBDQTJMQ0J2Y2x4dUlDb2dkVzVrWldacGJtVmtJR2xtSUhVZ2QyRnpJRzV2ZENCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlISmxjSEpsYzJWdWRHbHVaeUJoSUdScFpTNWNiaUFxTDF4dVkyOXVjM1FnZFc1cFkyOWtaVlJ2VUdsd2N5QTlJQ2gxS1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnWkdsbFEyaGhja2x1WkdWNElEMGdSRWxGWDFWT1NVTlBSRVZmUTBoQlVrRkRWRVZTVXk1cGJtUmxlRTltS0hVcE8xeHVJQ0FnSUhKbGRIVnliaUF3SUR3OUlHUnBaVU5vWVhKSmJtUmxlQ0EvSUdScFpVTm9ZWEpKYm1SbGVDQXJJREVnT2lCMWJtUmxabWx1WldRN1hHNTlPMXh1WEc0dktpcGNiaUFxSUVOdmJuWmxjblFnWVNCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaUIwYnlCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeVhHNGdLaUJ5WlhCeVpYTmxiblJoZEdsdmJpQnZaaUIwYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJrYVdVZ1ptRmpaUzRnVkdocGN5Qm1kVzVqZEdsdmJpQnBjeUIwYUdVZ2NtVjJaWEp6WlZ4dUlDb2diMllnZFc1cFkyOWtaVlJ2VUdsd2N5NWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2NDQXRJRlJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjeUIwYnlCamIyNTJaWEowSUhSdklHRWdkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSXVYRzRnS2lCQWNtVjBkWEp1Y3lCN1UzUnlhVzVuZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhKeklHOXlYRzRnS2lCMWJtUmxabWx1WldRZ2FXWWdjQ0IzWVhNZ2JtOTBJR0psZEhkbFpXNGdNU0JoYm1RZ05pQnBibU5zZFhOcGRtVXVYRzRnS2k5Y2JtTnZibk4wSUhCcGNITlViMVZ1YVdOdlpHVWdQU0J3SUQwK0lHbHpVR2x3VG5WdFltVnlLSEFwSUQ4Z1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVMXR3SUMwZ01WMGdPaUIxYm1SbFptbHVaV1E3WEc1Y2JtTnZibk4wSUhKbGJtUmxja2h2YkdRZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dzSUdOdmJHOXlLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdVMFZRUlZKQlZFOVNJRDBnZDJsa2RHZ2dMeUF6TUR0Y2JpQWdJQ0JqYjI1MFpYaDBMbk5oZG1Vb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1kc2IySmhiRUZzY0doaElEMGdSRVZHUVZWTVZGOVBVRUZEU1ZSWk8xeHVJQ0FnSUdOdmJuUmxlSFF1WW1WbmFXNVFZWFJvS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVtYVd4c1UzUjViR1VnUFNCamIyeHZjanRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWg0SUNzZ2QybGtkR2dzSUhrZ0t5QjNhV1IwYUN3Z2QybGtkR2dnTFNCVFJWQkZVa0ZVVDFJc0lEQXNJRElnS2lCTllYUm9MbEJKTENCbVlXeHpaU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzV5WlhOMGIzSmxLQ2s3WEc1OU8xeHVYRzVqYjI1emRDQnlaVzVrWlhKRWFXVWdQU0FvWTI5dWRHVjRkQ3dnZUN3Z2VTd2dkMmxrZEdnc0lHTnZiRzl5S1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnVTBOQlRFVWdQU0FvZDJsa2RHZ2dMeUJJUVV4R0tUdGNiaUFnSUNCamIyNXpkQ0JJUVV4R1gwbE9Ua1ZTWDFOSldrVWdQU0JOWVhSb0xuTnhjblFvZDJsa2RHZ2dLaW9nTWlBdklESXBPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tVZ1BTQXlJQ29nU0VGTVJsOUpUazVGVWw5VFNWcEZPMXh1SUNBZ0lHTnZibk4wSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5QTlJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJQ29nVTBOQlRFVTdYRzRnSUNBZ1kyOXVjM1FnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUQwZ1NVNU9SVkpmVTBsYVJTQXRJRElnS2lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTTdYRzRnSUNBZ1kyOXVjM1FnVTFSU1QwdEZYMWRKUkZSSUlEMGdUV0YwYUM1dFlYZ29UVWxPWDFOVVVrOUxSVjlYU1VSVVNDd2dRa0ZUUlY5VFZGSlBTMFZmVjBsRVZFZ2dLaUJUUTBGTVJTazdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRmdnUFNCNElDc2dkMmxrZEdnZ0xTQklRVXhHWDBsT1RrVlNYMU5KV2tVZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk03WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJaSUQwZ2VTQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRk8xeHVYRzRnSUNBZ1kyOXVkR1Y0ZEM1ellYWmxLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWlaV2RwYmxCaGRHZ29LVHRjYmlBZ0lDQmpiMjUwWlhoMExtWnBiR3hUZEhsc1pTQTlJR052Ykc5eU8xeHVJQ0FnSUdOdmJuUmxlSFF1YzNSeWIydGxVM1I1YkdVZ1BTQmNJbUpzWVdOclhDSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1c2FXNWxWMmxrZEdnZ1BTQlRWRkpQUzBWZlYwbEVWRWc3WEc0Z0lDQWdZMjl1ZEdWNGRDNXRiM1psVkc4b2MzUmhjblJZTENCemRHRnlkRmtwTzF4dUlDQWdJR052Ym5SbGVIUXViR2x1WlZSdktITjBZWEowV0NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDd2djM1JoY25SWktUdGNiaUFnSUNCamIyNTBaWGgwTG1GeVl5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTQXJJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0JrWldjeWNtRmtLREkzTUNrc0lHUmxaekp5WVdRb01Da3BPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVlJ2S0hOMFlYSjBXQ0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnYzNSaGNuUlpJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUNzZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFzSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQmtaV2N5Y21Ga0tEQXBMQ0JrWldjeWNtRmtLRGt3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QkpUazVGVWw5VFNWcEZLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ3NJSE4wWVhKMFdTQXJJRWxPVGtWU1gxTkpXa1ZmVWs5VlRrUkZSQ0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCa1pXY3ljbUZrS0Rrd0tTd2daR1ZuTW5KaFpDZ3hPREFwS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0xTQlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5azdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3hPREFwTENCa1pXY3ljbUZrS0RJM01Da3BPMXh1WEc0Z0lDQWdZMjl1ZEdWNGRDNXpkSEp2YTJVb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1acGJHd29LVHRjYmlBZ0lDQmpiMjUwWlhoMExuSmxjM1J2Y21Vb0tUdGNibjA3WEc1Y2JtTnZibk4wSUhKbGJtUmxjbEJwY0NBOUlDaGpiMjUwWlhoMExDQjRMQ0I1TENCM2FXUjBhQ2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuUmxlSFF1YzJGMlpTZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVltVm5hVzVRWVhSb0tDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNVM1I1YkdVZ1BTQlFTVkJmUTA5TVQxSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1dGIzWmxWRzhvZUN3Z2VTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9lQ3dnZVN3Z2QybGtkR2dzSURBc0lESWdLaUJOWVhSb0xsQkpMQ0JtWVd4elpTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWNiaTh2SUZCeWFYWmhkR1VnY0hKdmNHVnlkR2xsYzF4dVkyOXVjM1FnWDJKdllYSmtJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWpiMnh2Y2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYUdWc1pFSjVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXdhWEJ6SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl5YjNSaGRHbHZiaUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYmk4cUtseHVJQ29nVkc5d1JHbGxJR2x6SUhSb1pTQmNJblJ2Y0Mxa2FXVmNJaUJqZFhOMGIyMGdXMGhVVFV4Y2JpQXFJR1ZzWlcxbGJuUmRLR2gwZEhCek9pOHZaR1YyWld4dmNHVnlMbTF2ZW1sc2JHRXViM0puTDJWdUxWVlRMMlJ2WTNNdlYyVmlMMEZRU1M5SVZFMU1SV3hsYldWdWRDa2djbVZ3Y21WelpXNTBhVzVuSUdFZ1pHbGxYRzRnS2lCdmJpQjBhR1VnWkdsalpTQmliMkZ5WkM1Y2JpQXFYRzRnS2lCQVpYaDBaVzVrY3lCSVZFMU1SV3hsYldWdWRGeHVJQ29nUUcxcGVHVnpJRzF2WkhWc1pUcHRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOK1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNGdLaTljYm1OdmJuTjBJRlJ2Y0VScFpTQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWektFaFVUVXhGYkdWdFpXNTBLU0I3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dWRzl3UkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdHdhWEJ6TENCamIyeHZjaXdnY205MFlYUnBiMjRzSUhnc0lIa3NJR2hsYkdSQ2VYMGdQU0I3ZlNrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lncE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIQnBjSE5XWVd4MVpTQTlJSFpoYkdsa1lYUmxMbWx1ZEdWblpYSW9jR2x3Y3lCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFFTVkJUWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WW1WMGQyVmxiaWd4TENBMktWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnloeVlXNWtiMjFRYVhCektDa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhCcGNITldZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGQkpVRk5mUVZSVVVrbENWVlJGTENCd2FYQnpWbUZzZFdVcE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdVkyOXNiM0lnUFNCMllXeHBaR0YwWlM1amIyeHZjaWhqYjJ4dmNpQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgwTlBURTlTS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtOTBZWFJwYjI0Z1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtISnZkR0YwYVc5dUlIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRkpQVkVGVVNVOU9YMEZVVkZKSlFsVlVSU2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVZbVYwZDJWbGJpZ3dMQ0F6TmpBcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WkdWbVlYVnNkRlJ2S0VSRlJrRlZURlJmVWs5VVFWUkpUMDRwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNWNiaUFnSUNBZ0lDQWdkR2hwY3k1NElEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaDRJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0ZoZlFWUlVVa2xDVlZSRktTbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1c1lYSm5aWEpVYUdGdUtEQXBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVpHVm1ZWFZzZEZSdktFUkZSa0ZWVEZSZldDbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1MllXeDFaVHRjYmx4dUlDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCMllXeHBaR0YwWlM1cGJuUmxaMlZ5S0hrZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9XVjlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbXhoY21kbGNsUm9ZVzRvTUNsY2JpQWdJQ0FnSUNBZ0lDQWdJQzVrWldaaGRXeDBWRzhvUkVWR1FWVk1WRjlaS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWFHVnNaRUo1SUQwZ2RtRnNhV1JoZEdVdWMzUnlhVzVuS0dobGJHUkNlU0I4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVJVeEVYMEpaWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Ym05MFJXMXdkSGtvS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWh1ZFd4c0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdRMDlNVDFKZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQlFTVkJUWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRkpQVkVGVVNVOU9YMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGaGZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1dWOUJWRlJTU1VKVlZFVmNiaUFnSUNBZ0lDQWdYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnWDJKdllYSmtMbk5sZENoMGFHbHpMQ0IwYUdsekxuQmhjbVZ1ZEU1dlpHVXBPMXh1SUNBZ0lDQWdJQ0JmWW05aGNtUXVaMlYwS0hSb2FYTXBMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRVYyWlc1MEtGd2lkRzl3TFdScFpUcGhaR1JsWkZ3aUtTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdJQ0FnSUY5aWIyRnlaQzVuWlhRb2RHaHBjeWt1WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBdFpHbGxPbkpsYlc5MlpXUmNJaWtwTzF4dUlDQWdJQ0FnSUNCZlltOWhjbVF1YzJWMEtIUm9hWE1zSUc1MWJHd3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdkR2hwY3lCRWFXVWdkRzhnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWElnYjJZZ1lTQmthV1VnWm1GalpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxTjBjbWx1WjMwZ1ZHaGxJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUc1MWJXSmxjaUJ2Wmx4dUlDQWdJQ0FxSUhCcGNITWdiMllnZEdocGN5QkVhV1V1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlWYm1samIyUmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY0dsd2MxUnZWVzVwWTI5a1pTaDBhR2x6TG5CcGNITXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJSE4wY21sdVp5QnlaWEJ5WlhObGJtRjBhVzl1SUdadmNpQjBhR2x6SUdScFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxTjBjbWx1WjMwZ1ZHaGxJSFZ1YVdOdlpHVWdjM2x0WW05c0lHTnZjbkpsYzNCdmJtUnBibWNnZEc4Z2RHaGxJRzUxYldKbGNpQnZaaUJ3YVhCelhHNGdJQ0FnSUNvZ2IyWWdkR2hwY3lCa2FXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHOVRkSEpwYm1jb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG5SdlZXNXBZMjlrWlNncE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nUkdsbEozTWdiblZ0WW1WeUlHOW1JSEJwY0hNc0lERWc0b21rSUhCcGNITWc0b21rSURZdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YVhCektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM0JwY0hNdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nUkdsbEozTWdZMjlzYjNJdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VTNSeWFXNW5mVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjJ4dmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlqYjJ4dmNpNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVJQ0FnSUhObGRDQmpiMnh2Y2lodVpYZERiMnh2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnYm1WM1EyOXNiM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VOUFRFOVNYMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZZMjlzYjNJdWMyVjBLSFJvYVhNc0lFUkZSa0ZWVEZSZlEwOU1UMUlwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYMk52Ykc5eUxuTmxkQ2gwYUdsekxDQnVaWGREYjJ4dmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUc1bGQwTnZiRzl5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjaUIwYUdGMElHbHpJR2h2YkdScGJtY2dkR2hwY3lCRWFXVXNJR2xtSUdGdWVTNGdUblZzYkNCdmRHaGxjbmRwYzJVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Vkc5d1VHeGhlV1Z5Zkc1MWJHeDlJRnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWld4a1Fua29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmYUdWc1pFSjVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJR2hsYkdSQ2VTaHdiR0Y1WlhJcElIdGNiaUFnSUNBZ0lDQWdYMmhsYkdSQ2VTNXpaWFFvZEdocGN5d2djR3hoZVdWeUtUdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUhCc1lYbGxjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvWENKb1pXeGtMV0o1WENJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKb1pXeGtMV0o1WENJc0lIQnNZWGxsY2k1MGIxTjBjbWx1WnlncEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCamIyOXlaR2x1WVhSbGN5QnZaaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdERiMjl5WkdsdVlYUmxjM3h1ZFd4c2ZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmpiMjl5WkdsdVlYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dQVDA5SUhSb2FYTXVlQ0I4ZkNCdWRXeHNJRDA5UFNCMGFHbHpMbmtnUHlCdWRXeHNJRG9nZTNnNklIUm9hWE11ZUN3Z2VUb2dkR2hwY3k1NWZUdGNiaUFnSUNCOVhHNGdJQ0FnYzJWMElHTnZiM0prYVc1aGRHVnpLR01wSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJR01wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWVDQTlJRzUxYkd3N1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxua2dQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJWN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjdlQ3dnZVgwZ1BTQmpPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTU0SUQwZ2VEdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVlU0E5SUhrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkViMlZ6SUhSb2FYTWdSR2xsSUdoaGRtVWdZMjl2Y21ScGJtRjBaWE0vWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElIZG9aVzRnZEdobElFUnBaU0JrYjJWeklHaGhkbVVnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JvWVhORGIyOXlaR2x1WVhSbGN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzUxYkd3Z0lUMDlJSFJvYVhNdVkyOXZjbVJwYm1GMFpYTTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhnZ1kyOXZjbVJwYm1GMFpWeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnZUNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOTRMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJSGdvYm1WM1dDa2dlMXh1SUNBZ0lDQWdJQ0JmZUM1elpYUW9kR2hwY3l3Z2JtVjNXQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0Z3aWVGd2lMQ0J1WlhkWUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZVNCamIyOXlaR2x1WVhSbFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0I1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gza3VaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCelpYUWdlU2h1WlhkWktTQjdYRzRnSUNBZ0lDQWdJRjk1TG5ObGRDaDBhR2x6TENCdVpYZFpLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKNVhDSXNJRzVsZDFrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J5YjNSaGRHbHZiaUJ2WmlCMGFHbHpJRVJwWlM0Z01DRGlpYVFnY205MFlYUnBiMjRnNG9ta0lETTJNQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOGJuVnNiSDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnY205MFlYUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmNtOTBZWFJwYjI0dVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2NtOTBZWFJwYjI0b2JtVjNVaWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBUMGdibVYzVWlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1hDSnliM1JoZEdsdmJsd2lLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUc1dmNtMWhiR2w2WldSU2IzUmhkR2x2YmlBOUlHNWxkMUlnSlNCRFNWSkRURVZmUkVWSFVrVkZVenRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOXliM1JoZEdsdmJpNXpaWFFvZEdocGN5d2dibTl5YldGc2FYcGxaRkp2ZEdGMGFXOXVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2ljbTkwWVhScGIyNWNJaXdnYm05eWJXRnNhWHBsWkZKdmRHRjBhVzl1S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9jbTkzSUhSb2FYTWdSR2xsTGlCVWFHVWdiblZ0WW1WeUlHOW1JSEJwY0hNZ2RHOGdZU0J5WVc1a2IyMGdiblZ0WW1WeUlHNHNJREVnNG9ta0lHNGc0b21rSURZdVhHNGdJQ0FnSUNvZ1QyNXNlU0JrYVdObElIUm9ZWFFnWVhKbElHNXZkQ0JpWldsdVp5Qm9aV3hrSUdOaGJpQmlaU0IwYUhKdmQyNHVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFabWx5WlhNZ1hDSjBiM0E2ZEdoeWIzY3RaR2xsWENJZ2QybDBhQ0J3WVhKaGJXVjBaWEp6SUhSb2FYTWdSR2xsTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSFJvY205M1NYUW9LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hkR2hwY3k1cGMwaGxiR1FvS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNCcGNITXVjMlYwS0hSb2FYTXNJSEpoYm1SdmJWQnBjSE1vS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTd2dkR2hwY3k1d2FYQnpLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBNmRHaHliM2N0WkdsbFhDSXNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrWlhSaGFXdzZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxPaUIwYUdselhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjaUJvYjJ4a2N5QjBhR2x6SUVScFpTNGdRU0J3YkdGNVpYSWdZMkZ1SUc5dWJIa2dhRzlzWkNCaElHUnBaU0IwYUdGMElHbHpJRzV2ZEZ4dUlDQWdJQ0FxSUdKbGFXNW5JR2hsYkdRZ1lua2dZVzV2ZEdobGNpQndiR0Y1WlhJZ2VXVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZDJodklIZGhiblJ6SUhSdklHaHZiR1FnZEdocGN5QkVhV1V1WEc0Z0lDQWdJQ29nUUdacGNtVnpJRndpZEc5d09taHZiR1F0WkdsbFhDSWdkMmwwYUNCd1lYSmhiV1YwWlhKeklIUm9hWE1nUkdsbElHRnVaQ0IwYUdVZ2NHeGhlV1Z5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR2h2YkdSSmRDaHdiR0Y1WlhJcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0NGMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1obGJHUkNlU0E5SUhCc1lYbGxjanRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBNmFHOXNaQzFrYVdWY0lpd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JsZEdGcGJEb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVTZJSFJvYVhNc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJzWVhsbGNseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRWx6SUhSb2FYTWdSR2xsSUdKbGFXNW5JR2hsYkdRZ1lua2dZVzU1SUhCc1lYbGxjajljYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMEp2YjJ4bFlXNTlJRlJ5ZFdVZ2QyaGxiaUIwYUdseklFUnBaU0JwY3lCaVpXbHVaeUJvWld4a0lHSjVJR0Z1ZVNCd2JHRjVaWElzSUdaaGJITmxJRzkwYUdWeWQybHpaUzVjYmlBZ0lDQWdLaTljYmlBZ0lDQnBjMGhsYkdRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzSUNFOVBTQjBhR2x6TG1obGJHUkNlVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5SUhKbGJHVmhjMlZ6SUhSb2FYTWdSR2xsTGlCQklIQnNZWGxsY2lCallXNGdiMjVzZVNCeVpXeGxZWE5sSUdScFkyVWdkR2hoZENCemFHVWdhWE5jYmlBZ0lDQWdLaUJvYjJ4a2FXNW5MbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZDJodklIZGhiblJ6SUhSdklISmxiR1ZoYzJVZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbkpsYkdGelpTMWthV1ZjSWlCM2FYUm9JSEJoY21GdFpYUmxjbk1nZEdocGN5QkVhV1VnWVc1a0lIUm9aU0J3YkdGNVpYSWdjbVZzWldGemFXNW5JR2wwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSEpsYkdWaGMyVkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YVhOSVpXeGtLQ2tnSmlZZ2RHaHBjeTVvWld4a1Fua3VaWEYxWVd4ektIQnNZWGxsY2lrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VoRlRFUmZRbGxmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1EzVnpkRzl0UlhabGJuUW9YQ0owYjNBNmNtVnNaV0Z6WlMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZKbGJtUmxjaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMkZ1ZG1GelVtVnVaR1Z5YVc1blEyOXVkR1Y0ZERKRWZTQmpiMjUwWlhoMElDMGdWR2hsSUdOaGJuWmhjeUJqYjI1MFpYaDBJSFJ2SUdSeVlYZGNiaUFnSUNBZ0tpQnZibHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE5kSUMwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUhSdlhHNGdJQ0FnSUNvZ1pISmhkeUIwYUdseklHUnBaUzRnUW5rZ1pHVm1ZWFZzZEN3Z2RHaHBjeUJrYVdVZ2FYTWdaSEpoZDI0Z1lYUWdhWFJ6SUc5M2JpQmpiMjl5WkdsdVlYUmxjeXhjYmlBZ0lDQWdLaUJpZFhRZ2VXOTFJR05oYmlCaGJITnZJR1J5WVhjZ2FYUWdaV3h6Wlhkb1pYSmxJR2xtSUhOdklHNWxaV1JsWkM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0J5Wlc1a1pYSW9ZMjl1ZEdWNGRDd2daR2xsVTJsNlpTd2dZMjl2Y21ScGJtRjBaWE1nUFNCMGFHbHpMbU52YjNKa2FXNWhkR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOallXeGxJRDBnWkdsbFUybDZaU0F2SUVKQlUwVmZSRWxGWDFOSldrVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTklRVXhHSUQwZ1NFRk1SaUFxSUhOallXeGxPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQlRWRWhKVWtRZ1BTQlVTRWxTUkNBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVUVsUVgxTkpXa1VnUFNCUVNWQmZVMGxhUlNBcUlITmpZV3hsTzF4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdOdmIzSmthVzVoZEdWek8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKSWIyeGtLR052Ym5SbGVIUXNJSGdzSUhrc0lGTklRVXhHTENCMGFHbHpMbWhsYkdSQ2VTNWpiMnh2Y2lrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb01DQWhQVDBnZEdocGN5NXliM1JoZEdsdmJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1MGNtRnVjMnhoZEdVb2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1eWIzUmhkR1VvWkdWbk1uSmhaQ2gwYUdsekxuSnZkR0YwYVc5dUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5SeVlXNXpiR0YwWlNndE1TQXFJQ2g0SUNzZ1UwaEJURVlwTENBdE1TQXFJQ2g1SUNzZ1UwaEJURVlwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsYm1SbGNrUnBaU2hqYjI1MFpYaDBMQ0I0TENCNUxDQlRTRUZNUml3Z2RHaHBjeTVqYjJ4dmNpazdYRzVjYmlBZ0lDQWdJQ0FnYzNkcGRHTm9JQ2gwYUdsekxuQnBjSE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyRnpaU0F4T2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJREk2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUF5SUNvZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ016b2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBME9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ01pQXFJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRFU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lBeUlDb2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUU0VGTVJpd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdOam9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWkdWbVlYVnNkRG9nTHk4Z1RtOGdiM1JvWlhJZ2RtRnNkV1Z6SUdGc2JHOTNaV1FnTHlCd2IzTnphV0pzWlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUTJ4bFlYSWdZMjl1ZEdWNGRGeHVJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuTmxkRlJ5WVc1elptOXliU2d4TENBd0xDQXdMQ0F4TENBd0xDQXdLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNTNhVzVrYjNjdVkzVnpkRzl0Uld4bGJXVnVkSE11WkdWbWFXNWxLRndpZEc5d0xXUnBaVndpTENCVWIzQkVhV1VwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBaU3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVMeTlwYlhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwZHlhV1JNWVhsdmRYUjlJR1p5YjIwZ1hDSXVMMGR5YVdSTVlYbHZkWFF1YW5OY0lqdGNibWx0Y0c5eWRDQjdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTZlNCbWNtOXRJRndpTGk5VWIzQlFiR0Y1WlhJdWFuTmNJanRjYm1sdGNHOXlkQ0I3ZG1Gc2FXUmhkR1Y5SUdaeWIyMGdYQ0l1TDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1welhDSTdYRzVwYlhCdmNuUWdlMVJ2Y0VScFpYMGdabkp2YlNCY0lpNHZWRzl3UkdsbExtcHpYQ0k3WEc1Y2JpOHFLbHh1SUNvZ1FHMXZaSFZzWlZ4dUlDb3ZYRzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0Z1BTQXpOelU3SUM4dklHMXpYRzVqYjI1emRDQkVSVVpCVlV4VVgwUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYm1OdmJuTjBJRVJGUmtGVlRGUmZTRTlNUkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFSUQwZ1ptRnNjMlU3WEc1amIyNXpkQ0JFUlVaQlZVeFVYMUpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRZ1BTQm1ZV3h6WlR0Y2JseHVZMjl1YzNRZ1VrOVhVeUE5SURFd08xeHVZMjl1YzNRZ1EwOU1VeUE5SURFd08xeHVYRzVqYjI1emRDQkVSVVpCVlV4VVgxZEpSRlJJSUQwZ1EwOU1VeUFxSUVSRlJrRlZURlJmUkVsRlgxTkpXa1U3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwaEZTVWRJVkNBOUlGSlBWMU1nS2lCRVJVWkJWVXhVWDBSSlJWOVRTVnBGT3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOUVTVk5RUlZKVFNVOU9JRDBnVFdGMGFDNW1iRzl2Y2loU1QxZFRJQzhnTWlrN1hHNWNibU52Ym5OMElFMUpUbDlFUlV4VVFTQTlJRE03SUM4dmNIaGNibHh1WTI5dWMzUWdWMGxFVkVoZlFWUlVVa2xDVlZSRklEMGdYQ0ozYVdSMGFGd2lPMXh1WTI5dWMzUWdTRVZKUjBoVVgwRlVWRkpKUWxWVVJTQTlJRndpYUdWcFoyaDBYQ0k3WEc1amIyNXpkQ0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlNBOUlGd2laR2x6Y0dWeWMybHZibHdpTzF4dVkyOXVjM1FnUkVsRlgxTkpXa1ZmUVZSVVVrbENWVlJGSUQwZ1hDSmthV1V0YzJsNlpWd2lPMXh1WTI5dWMzUWdSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbVJ5WVdkbmFXNW5MV1JwWTJVdFpHbHpZV0pzWldSY0lqdGNibU52Ym5OMElFaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0ltaHZiR1JwYm1jdFpHbGpaUzFrYVhOaFlteGxaRndpTzF4dVkyOXVjM1FnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW5KdmRHRjBhVzVuTFdScFkyVXRaR2x6WVdKc1pXUmNJanRjYm1OdmJuTjBJRWhQVEVSZlJGVlNRVlJKVDA1ZlFWUlVVa2xDVlZSRklEMGdYQ0pvYjJ4a0xXUjFjbUYwYVc5dVhDSTdYRzVjYmx4dVkyOXVjM1FnY0dGeWMyVk9kVzFpWlhJZ1BTQW9iblZ0WW1WeVUzUnlhVzVuTENCa1pXWmhkV3gwVG5WdFltVnlJRDBnTUNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUc1MWJXSmxjaUE5SUhCaGNuTmxTVzUwS0c1MWJXSmxjbE4wY21sdVp5d2dNVEFwTzF4dUlDQWdJSEpsZEhWeWJpQk9kVzFpWlhJdWFYTk9ZVTRvYm5WdFltVnlLU0EvSUdSbFptRjFiSFJPZFcxaVpYSWdPaUJ1ZFcxaVpYSTdYRzU5TzF4dVhHNWpiMjV6ZENCblpYUlFiM05wZEdsMlpVNTFiV0psY2lBOUlDaHVkVzFpWlhKVGRISnBibWNzSUdSbFptRjFiSFJXWVd4MVpTa2dQVDRnZTF4dUlDQWdJSEpsZEhWeWJpQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtHNTFiV0psY2xOMGNtbHVaeWxjYmlBZ0lDQWdJQ0FnTG14aGNtZGxjbFJvWVc0b01DbGNiaUFnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhrWldaaGRXeDBWbUZzZFdVcFhHNGdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JuMDdYRzVjYm1OdmJuTjBJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxJRDBnS0dWc1pXMWxiblFzSUc1aGJXVXNJR1JsWm1GMWJIUldZV3gxWlNrZ1BUNGdlMXh1SUNBZ0lHbG1JQ2hsYkdWdFpXNTBMbWhoYzBGMGRISnBZblYwWlNodVlXMWxLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IyWVd4MVpWTjBjbWx1WnlBOUlHVnNaVzFsYm5RdVoyVjBRWFIwY21saWRYUmxLRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2RtRnNkV1ZUZEhKcGJtY3NJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQmtaV1poZFd4MFZtRnNkV1U3WEc1OU8xeHVYRzVqYjI1emRDQm5aWFJDYjI5c1pXRnVJRDBnS0dKdmIyeGxZVzVUZEhKcGJtY3NJSFJ5ZFdWV1lXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdhV1lnS0hSeWRXVldZV3gxWlNBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlCOGZDQmNJblJ5ZFdWY0lpQTlQVDBnWW05dmJHVmhibE4wY21sdVp5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0Z3aVptRnNjMlZjSWlBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHUmxabUYxYkhSV1lXeDFaVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWpiMjV6ZENCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbElEMGdLR1ZzWlcxbGJuUXNJRzVoYldVc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaGxiR1Z0Wlc1MExtaGhjMEYwZEhKcFluVjBaU2h1WVcxbEtTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQjJZV3gxWlZOMGNtbHVaeUE5SUdWc1pXMWxiblF1WjJWMFFYUjBjbWxpZFhSbEtHNWhiV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmloMllXeDFaVk4wY21sdVp5d2dXM1poYkhWbFUzUnlhVzVuTENCY0luUnlkV1ZjSWwwc0lGdGNJbVpoYkhObFhDSmRMQ0JrWldaaGRXeDBWbUZzZFdVcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElIQnliM0JsY25ScFpYTmNibU52Ym5OMElGOWpZVzUyWVhNZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJ4aGVXOTFkQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZM1Z5Y21WdWRGQnNZWGxsY2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc1amIyNXpkQ0JqYjI1MFpYaDBJRDBnS0dKdllYSmtLU0E5UGlCZlkyRnVkbUZ6TG1kbGRDaGliMkZ5WkNrdVoyVjBRMjl1ZEdWNGRDaGNJakprWENJcE8xeHVYRzVqYjI1emRDQm5aWFJTWldGa2VVUnBZMlVnUFNBb1ltOWhjbVFwSUQwK0lIdGNiaUFnSUNCcFppQW9kVzVrWldacGJtVmtJRDA5UFNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdVoyVjBLR0p2WVhKa0tTa2dlMXh1SUNBZ0lDQWdJQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1YzJWMEtHSnZZWEprTENBd0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sTG1kbGRDaGliMkZ5WkNrN1hHNTlPMXh1WEc1amIyNXpkQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVWdQU0FvWW05aGNtUXNJSFZ3WkdGMFpTa2dQVDRnZTF4dUlDQWdJRjl1ZFcxaVpYSlBabEpsWVdSNVJHbGpaUzV6WlhRb1ltOWhjbVFzSUdkbGRGSmxZV1I1UkdsalpTaGliMkZ5WkNrZ0t5QjFjR1JoZEdVcE8xeHVmVHRjYmx4dVkyOXVjM1FnYVhOU1pXRmtlU0E5SUNoaWIyRnlaQ2tnUFQ0Z1oyVjBVbVZoWkhsRWFXTmxLR0p2WVhKa0tTQTlQVDBnWW05aGNtUXVaR2xqWlM1c1pXNW5kR2c3WEc1Y2JtTnZibk4wSUhWd1pHRjBaVUp2WVhKa0lEMGdLR0p2WVhKa0xDQmthV05sSUQwZ1ltOWhjbVF1WkdsalpTa2dQVDRnZTF4dUlDQWdJR2xtSUNocGMxSmxZV1I1S0dKdllYSmtLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNTBaWGgwS0dKdllYSmtLUzVqYkdWaGNsSmxZM1FvTUN3Z01Dd2dZbTloY21RdWQybGtkR2dzSUdKdllYSmtMbWhsYVdkb2RDazdYRzVjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pHbGxMbkpsYm1SbGNpaGpiMjUwWlhoMEtHSnZZWEprS1N3Z1ltOWhjbVF1WkdsbFUybDZaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1OU8xeHVYRzVjYmk4dklFbHVkR1Z5WVdOMGFXOXVJSE4wWVhSbGMxeHVZMjl1YzNRZ1RrOU9SU0E5SUZONWJXSnZiQ2hjSW01dlgybHVkR1Z5WVdOMGFXOXVYQ0lwTzF4dVkyOXVjM1FnU0U5TVJDQTlJRk41YldKdmJDaGNJbWh2YkdSY0lpazdYRzVqYjI1emRDQk5UMVpGSUQwZ1UzbHRZbTlzS0Z3aWJXOTJaVndpS1R0Y2JtTnZibk4wSUVsT1JFVlVSVkpOU1U1RlJDQTlJRk41YldKdmJDaGNJbWx1WkdWMFpYSnRhVzVsWkZ3aUtUdGNibU52Ym5OMElFUlNRVWRIU1U1SElEMGdVM2x0WW05c0tGd2laSEpoWjJkcGJtZGNJaWs3WEc1Y2JpOHZJRTFsZEdodlpITWdkRzhnYUdGdVpHeGxJR2x1ZEdWeVlXTjBhVzl1WEc1amIyNXpkQ0JqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5QTlJQ2hqWVc1MllYTXNJSGhYYVc1a2IzY3NJSGxYYVc1a2IzY3BJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQmpZVzUyWVhOQ2IzZ2dQU0JqWVc1MllYTXVaMlYwUW05MWJtUnBibWREYkdsbGJuUlNaV04wS0NrN1hHNWNiaUFnSUNCamIyNXpkQ0I0SUQwZ2VGZHBibVJ2ZHlBdElHTmhiblpoYzBKdmVDNXNaV1owSUNvZ0tHTmhiblpoY3k1M2FXUjBhQ0F2SUdOaGJuWmhjMEp2ZUM1M2FXUjBhQ2s3WEc0Z0lDQWdZMjl1YzNRZ2VTQTlJSGxYYVc1a2IzY2dMU0JqWVc1MllYTkNiM2d1ZEc5d0lDb2dLR05oYm5aaGN5NW9aV2xuYUhRZ0x5QmpZVzUyWVhOQ2IzZ3VhR1ZwWjJoMEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCN2VDd2dlWDA3WEc1OU8xeHVYRzVqYjI1emRDQnpaWFIxY0VsdWRHVnlZV04wYVc5dUlEMGdLR0p2WVhKa0tTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1kyRnVkbUZ6SUQwZ1gyTmhiblpoY3k1blpYUW9ZbTloY21RcE8xeHVYRzRnSUNBZ0x5OGdVMlYwZFhBZ2FXNTBaWEpoWTNScGIyNWNiaUFnSUNCc1pYUWdiM0pwWjJsdUlEMGdlMzA3WEc0Z0lDQWdiR1YwSUhOMFlYUmxJRDBnVGs5T1JUdGNiaUFnSUNCc1pYUWdjM1JoZEdsalFtOWhjbVFnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJRzUxYkd3N1hHNGdJQ0FnYkdWMElHaHZiR1JVYVcxbGIzVjBJRDBnYm5Wc2JEdGNibHh1SUNBZ0lHTnZibk4wSUdodmJHUkVhV1VnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaElUMHhFSUQwOVBTQnpkR0YwWlNCOGZDQkpUa1JGVkVWU1RVbE9SVVFnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGIyZG5iR1VnYUc5c1pDQXZJSEpsYkdWaGMyVmNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJzWVhsbGNsZHBkR2hCVkhWeWJpQTlJR0p2WVhKa0xuRjFaWEo1VTJWc1pXTjBiM0lvWENKMGIzQXRjR3hoZVdWeUxXeHBjM1FnZEc5d0xYQnNZWGxsY2x0b1lYTXRkSFZ5YmwxY0lpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9aR2xsVlc1a1pYSkRkWEp6YjNJdWFYTklaV3hrS0NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2k1eVpXeGxZWE5sU1hRb2NHeGhlV1Z5VjJsMGFFRlVkWEp1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWFHOXNaRWwwS0hCc1lYbGxjbGRwZEdoQlZIVnliaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdodmJHUlVhVzFsYjNWMElEMGdiblZzYkR0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdjM1JoY25SSWIyeGthVzVuSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCb2IyeGtWR2x0Wlc5MWRDQTlJSGRwYm1SdmR5NXpaWFJVYVcxbGIzVjBLR2h2YkdSRWFXVXNJR0p2WVhKa0xtaHZiR1JFZFhKaGRHbHZiaWs3WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElITjBiM0JJYjJ4a2FXNW5JRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0IzYVc1a2IzY3VZMnhsWVhKVWFXMWxiM1YwS0dodmJHUlVhVzFsYjNWMEtUdGNiaUFnSUNBZ0lDQWdhRzlzWkZScGJXVnZkWFFnUFNCdWRXeHNPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRWx1ZEdWeVlXTjBhVzl1SUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoT1QwNUZJRDA5UFNCemRHRjBaU2tnZTF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J2Y21sbmFXNGdQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZURvZ1pYWmxiblF1WTJ4cFpXNTBXQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I1T2lCbGRtVnVkQzVqYkdsbGJuUlpYRzRnSUNBZ0lDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaUE5SUdKdllYSmtMbXhoZVc5MWRDNW5aWFJCZENoamIyNTJaWEowVjJsdVpHOTNRMjl2Y21ScGJtRjBaWE5VYjBOaGJuWmhjeWhqWVc1MllYTXNJR1YyWlc1MExtTnNhV1Z1ZEZnc0lHVjJaVzUwTG1Oc2FXVnVkRmtwS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnSVQwOUlHUnBaVlZ1WkdWeVEzVnljMjl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMjVzZVNCcGJuUmxjbUZqZEdsdmJpQjNhWFJvSUhSb1pTQmliMkZ5WkNCMmFXRWdZU0JrYVdWY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVWdKaVlnSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdTVTVFUlZSRlVrMUpUa1ZFTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0Z5ZEVodmJHUnBibWNvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVodmJHUnBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnU0U5TVJEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGNuUkliMnhrYVc1bktDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2doWW05aGNtUXVaR2x6WVdKc1pXUkVjbUZuWjJsdVowUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdVZ1BTQk5UMVpGTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE5vYjNkSmJuUmxjbUZqZEdsdmJpQTlJQ2hsZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJR0p2WVhKa0xteGhlVzkxZEM1blpYUkJkQ2hqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5aGpZVzUyWVhNc0lHVjJaVzUwTG1Oc2FXVnVkRmdzSUdWMlpXNTBMbU5zYVdWdWRGa3BLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFUlNRVWRIU1U1SElEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5OMGVXeGxMbU4xY25OdmNpQTlJRndpWjNKaFltSnBibWRjSWp0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laM0poWWx3aU8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laR1ZtWVhWc2RGd2lPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElHMXZkbVVnUFNBb1pYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0UxUFZrVWdQVDA5SUhOMFlYUmxJSHg4SUVsT1JFVlVSVkpOU1U1RlJDQTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJR1JsZEdWeWJXbHVaU0JwWmlCaElHUnBaU0JwY3lCMWJtUmxjaUIwYUdVZ1kzVnljMjl5WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJKWjI1dmNtVWdjMjFoYkd3Z2JXOTJaVzFsYm5SelhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUUxaGRHZ3VZV0p6S0c5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VTQTlJRTFoZEdndVlXSnpLRzl5YVdkcGJpNTVJQzBnWlhabGJuUXVZMnhwWlc1MFdTazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hOU1U1ZlJFVk1WRUVnUENCa2VDQjhmQ0JOU1U1ZlJFVk1WRUVnUENCa2VTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdSRkpCUjBkSlRrYzdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1J2Y0VodmJHUnBibWNvS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScFkyVlhhWFJvYjNWMFJHbGxWVzVrWlhKRGRYSnpiM0lnUFNCaWIyRnlaQzVrYVdObExtWnBiSFJsY2loa2FXVWdQVDRnWkdsbElDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvWW05aGNtUXNJR1JwWTJWWGFYUm9iM1YwUkdsbFZXNWtaWEpEZFhKemIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhScFkwSnZZWEprSUQwZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1WjJWMFNXMWhaMlZFWVhSaEtEQXNJREFzSUdOaGJuWmhjeTUzYVdSMGFDd2dZMkZ1ZG1GekxtaGxhV2RvZENrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1JGSkJSMGRKVGtjZ1BUMDlJSE4wWVhSbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZUNBOUlHOXlhV2RwYmk1NElDMGdaWFpsYm5RdVkyeHBaVzUwV0R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjVJRDBnYjNKcFoybHVMbmtnTFNCbGRtVnVkQzVqYkdsbGJuUlpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCa2FXVlZibVJsY2tOMWNuTnZjaTVqYjI5eVpHbHVZWFJsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQ2hpYjJGeVpDa3VjSFYwU1cxaFoyVkVZWFJoS0hOMFlYUnBZMEp2WVhKa0xDQXdMQ0F3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxuSmxibVJsY2loamIyNTBaWGgwS0dKdllYSmtLU3dnWW05aGNtUXVaR2xsVTJsNlpTd2dlM2c2SUhnZ0xTQmtlQ3dnZVRvZ2VTQXRJR1I1ZlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyOXVjM1FnYzNSdmNFbHVkR1Z5WVdOMGFXOXVJRDBnS0dWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpQW1KaUJFVWtGSFIwbE9SeUE5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjRJRDBnYjNKcFoybHVMbmdnTFNCbGRtVnVkQzVqYkdsbGJuUllPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhrZ1BTQnZjbWxuYVc0dWVTQXRJR1YyWlc1MExtTnNhV1Z1ZEZrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSHQ0TENCNWZTQTlJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCemJtRndWRzlEYjI5eVpITWdQU0JpYjJGeVpDNXNZWGx2ZFhRdWMyNWhjRlJ2S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVTZJR1JwWlZWdVpHVnlRM1Z5YzI5eUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIZzZJSGdnTFNCa2VDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjVPaUI1SUMwZ1pIa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYm1WM1EyOXZjbVJ6SUQwZ2JuVnNiQ0FoUFNCemJtRndWRzlEYjI5eVpITWdQeUJ6Ym1Gd1ZHOURiMjl5WkhNZ09pQjdlQ3dnZVgwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpWVnVaR1Z5UTNWeWMyOXlMbU52YjNKa2FXNWhkR1Z6SUQwZ2JtVjNRMjl2Y21Sek8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnYzNSaGRHVmNiaUFnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1VtVm1jbVZ6YUNCaWIyRnlaRHNnVW1WdVpHVnlJR1JwWTJWY2JpQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21RcE8xeHVJQ0FnSUgwN1hHNWNibHh1SUNBZ0lDOHZJRkpsWjJsemRHVnlJSFJvWlNCaFkzUjFZV3dnWlhabGJuUWdiR2x6ZEdWdVpYSnpJR1JsWm1sdVpXUWdZV0p2ZG1VdUlFMWhjQ0IwYjNWamFDQmxkbVZ1ZEhNZ2RHOWNiaUFnSUNBdkx5QmxjWFZwZG1Gc1pXNTBJRzF2ZFhObElHVjJaVzUwY3k0Z1FtVmpZWFZ6WlNCMGFHVWdYQ0owYjNWamFHVnVaRndpSUdWMlpXNTBJR1J2WlhNZ2JtOTBJR2hoZG1VZ1lWeHVJQ0FnSUM4dklHTnNhV1Z1ZEZnZ1lXNWtJR05zYVdWdWRGa3NJSEpsWTI5eVpDQmhibVFnZFhObElIUm9aU0JzWVhOMElHOXVaWE1nWm5KdmJTQjBhR1VnWENKMGIzVmphRzF2ZG1WY0lseHVJQ0FnSUM4dklDaHZjaUJjSW5SdmRXTm9jM1JoY25SY0lpa2daWFpsYm5SekxseHVYRzRnSUNBZ2JHVjBJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXRG9nTUN3Z1kyeHBaVzUwV1RvZ01IMDdYRzRnSUNBZ1kyOXVjM1FnZEc5MVkyZ3liVzkxYzJWRmRtVnVkQ0E5SUNodGIzVnpaVVYyWlc1MFRtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0tIUnZkV05vUlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGIzVmphRVYyWlc1MElDWW1JREFnUENCMGIzVmphRVYyWlc1MExuUnZkV05vWlhNdWJHVnVaM1JvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZTJOc2FXVnVkRmdzSUdOc2FXVnVkRmw5SUQwZ2RHOTFZMmhGZG1WdWRDNTBiM1ZqYUdWeld6QmRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXWDA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnVFc5MWMyVkZkbVZ1ZENodGIzVnpaVVYyWlc1MFRtRnRaU3dnZEc5MVkyaERiMjl5WkdsdVlYUmxjeWtwTzF4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmRXTm9jM1JoY25SY0lpd2dkRzkxWTJneWJXOTFjMlZGZG1WdWRDaGNJbTF2ZFhObFpHOTNibHdpS1NrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXUnZkMjVjSWl3Z2MzUmhjblJKYm5SbGNtRmpkR2x2YmlrN1hHNWNiaUFnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaHRiM1psWENJc0lIUnZkV05vTW0xdmRYTmxSWFpsYm5Rb1hDSnRiM1Z6WlcxdmRtVmNJaWtwTzF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxiVzkyWlZ3aUxDQnRiM1psS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObElIeDhJQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnRiM1psWENJc0lITm9iM2RKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNWamFHVnVaRndpTENCMGIzVmphREp0YjNWelpVVjJaVzUwS0Z3aWJXOTFjMlYxY0Z3aUtTazdYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaWFZ3WENJc0lITjBiM0JKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXOTFkRndpTENCemRHOXdTVzUwWlhKaFkzUnBiMjRwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJVYjNCRWFXTmxRbTloY21RZ2FYTWdZU0JqZFhOMGIyMGdTRlJOVENCbGJHVnRaVzUwSUhSdklISmxibVJsY2lCaGJtUWdZMjl1ZEhKdmJDQmhYRzRnS2lCa2FXTmxJR0p2WVhKa0xpQmNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvdlhHNWpiMjV6ZENCVWIzQkVhV05sUW05aGNtUWdQU0JqYkdGemN5QmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBJSHRjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOeVpXRjBaU0JoSUc1bGR5QlViM0JFYVdObFFtOWhjbVF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzNSNWJHVXVaR2x6Y0d4aGVTQTlJRndpYVc1c2FXNWxMV0pzYjJOclhDSTdYRzRnSUNBZ0lDQWdJR052Ym5OMElITm9ZV1J2ZHlBOUlIUm9hWE11WVhSMFlXTm9VMmhoWkc5M0tIdHRiMlJsT2lCY0ltTnNiM05sWkZ3aWZTazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHTmhiblpoY3lBOUlHUnZZM1Z0Wlc1MExtTnlaV0YwWlVWc1pXMWxiblFvWENKallXNTJZWE5jSWlrN1hHNGdJQ0FnSUNBZ0lITm9ZV1J2ZHk1aGNIQmxibVJEYUdsc1pDaGpZVzUyWVhNcE8xeHVYRzRnSUNBZ0lDQWdJRjlqWVc1MllYTXVjMlYwS0hSb2FYTXNJR05oYm5aaGN5azdYRzRnSUNBZ0lDQWdJRjlqZFhKeVpXNTBVR3hoZVdWeUxuTmxkQ2gwYUdsekxDQkVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklwTzF4dUlDQWdJQ0FnSUNCZmJHRjViM1YwTG5ObGRDaDBhR2x6TENCdVpYY2dSM0pwWkV4aGVXOTFkQ2g3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjNhV1IwYURvZ2RHaHBjeTUzYVdSMGFDeGNiaUFnSUNBZ0lDQWdJQ0FnSUdobGFXZG9kRG9nZEdocGN5NW9aV2xuYUhRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVGFYcGxPaUIwYUdsekxtUnBaVk5wZW1Vc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVhOd1pYSnphVzl1T2lCMGFHbHpMbVJwYzNCbGNuTnBiMjVjYmlBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQnpaWFIxY0VsdWRHVnlZV04wYVc5dUtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE4wWVhScFl5Qm5aWFFnYjJKelpYSjJaV1JCZEhSeWFXSjFkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnVjBsRVZFaGZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1NFVkpSMGhVWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRVJKVTFCRlVsTkpUMDVmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1JGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JJVDB4RVgwUlZVa0ZVU1U5T1gwRlVWRkpKUWxWVVJWeHVJQ0FnSUNBZ0lDQmRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHRjBkSEpwWW5WMFpVTm9ZVzVuWldSRFlXeHNZbUZqYXlodVlXMWxMQ0J2YkdSV1lXeDFaU3dnYm1WM1ZtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJGdWRtRnpJRDBnWDJOaGJuWmhjeTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdJQ0FnSUhOM2FYUmphQ0FvYm1GdFpTa2dlMXh1SUNBZ0lDQWdJQ0JqWVhObElGZEpSRlJJWDBGVVZGSkpRbFZVUlRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdkMmxrZEdnZ1BTQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpaHVaWGRXWVd4MVpTd2djR0Z5YzJWT2RXMWlaWElvYjJ4a1ZtRnNkV1VwSUh4OElFUkZSa0ZWVEZSZlYwbEVWRWdwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1c1lYbHZkWFF1ZDJsa2RHZ2dQU0IzYVdSMGFEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6WlhSQmRIUnlhV0oxZEdVb1YwbEVWRWhmUVZSVVVrbENWVlJGTENCM2FXUjBhQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSUVoRlNVZElWRjlCVkZSU1NVSlZWRVU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHaGxhV2RvZENBOUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtHNWxkMVpoYkhWbExDQndZWEp6WlU1MWJXSmxjaWh2YkdSV1lXeDFaU2tnZkh3Z1JFVkdRVlZNVkY5SVJVbEhTRlFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1c1lYbHZkWFF1YUdWcFoyaDBJRDBnYUdWcFoyaDBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5ObGRFRjBkSEpwWW5WMFpTaElSVWxIU0ZSZlFWUlVVa2xDVlZSRkxDQm9aV2xuYUhRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pHbHpjR1Z5YzJsdmJpQTlJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlLRzVsZDFaaGJIVmxMQ0J3WVhKelpVNTFiV0psY2lodmJHUldZV3gxWlNrZ2ZId2dSRVZHUVZWTVZGOUVTVk5RUlZKVFNVOU9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbVJwYzNCbGNuTnBiMjRnUFNCa2FYTndaWEp6YVc5dU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQkVTVVZmVTBsYVJWOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScFpWTnBlbVVnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmUkVsRlgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1c1lYbHZkWFF1WkdsbFUybDZaU0E5SUdScFpWTnBlbVU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSUZKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FYTmhZbXhsWkZKdmRHRjBhVzl1SUQwZ2RtRnNhV1JoZEdVdVltOXZiR1ZoYmlodVpYZFdZV3gxWlN3Z1oyVjBRbTl2YkdWaGJpaHZiR1JXWVd4MVpTd2dVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc0lFUkZSa0ZWVEZSZlVrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ2twTG5aaGJIVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVjbTkwWVhSbElEMGdJV1JwYzJGaWJHVmtVbTkwWVhScGIyNDdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCa1pXWmhkV3gwT2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCVWFHVWdkbUZzZFdVZ2FYTWdaR1YwWlhKdGFXNWxaQ0IzYUdWdUlIVnphVzVuSUhSb1pTQm5aWFIwWlhKY2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZFhCa1lYUmxRbTloY21Rb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2Y0Mxa2FXVTZZV1JrWldSY0lpd2dLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZFhCa1lYUmxVbVZoWkhsRWFXTmxLSFJvYVhNc0lERXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR2x6VW1WaFpIa29kR2hwY3lrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2gwYUdsekxDQjBhR2x6TG14aGVXOTFkQzVzWVhsdmRYUW9kR2hwY3k1a2FXTmxLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lIUm9hWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmNDMWthV1U2Y21WdGIzWmxaRndpTENBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2gwYUdsekxDQjBhR2x6TG14aGVXOTFkQzVzWVhsdmRYUW9kR2hwY3k1a2FXTmxLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWU1pXRmtlVVJwWTJVb2RHaHBjeXdnTFRFcE8xeHVJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNBdkx5QkJiR3dnWkdsalpTQmliMkZ5WkhNZ1pHOGdhR0YyWlNCaElIQnNZWGxsY2lCc2FYTjBMaUJKWmlCMGFHVnlaU0JwYzI0bmRDQnZibVVnZVdWMExGeHVJQ0FnSUNBZ0lDQXZMeUJqY21WaGRHVWdiMjVsTGx4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBUMGdkR2hwY3k1eGRXVnllVk5sYkdWamRHOXlLRndpZEc5d0xYQnNZWGxsY2kxc2FYTjBYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtRndjR1Z1WkVOb2FXeGtLR1J2WTNWdFpXNTBMbU55WldGMFpVVnNaVzFsYm5Rb1hDSjBiM0F0Y0d4aGVXVnlMV3hwYzNSY0lpa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR2x6WTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWVdSdmNIUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQkhjbWxrVEdGNWIzVjBJSFZ6WldRZ1lua2dkR2hwY3lCRWFXTmxRbTloY21RZ2RHOGdiR0Y1YjNWMElIUm9aU0JrYVdObExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBkeWFXUk1ZWGx2ZFhSOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHeGhlVzkxZENncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXNZWGx2ZFhRdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1SUU1dmRHVXNJSFJ2SUdGamRIVmhiR3g1SUhSb2NtOTNJSFJvWlNCa2FXTmxJSFZ6WlZ4dUlDQWdJQ0FxSUh0QWJHbHVheUIwYUhKdmQwUnBZMlY5TGlCY2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRVYjNCRWFXVmJYWDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRnN1TGk1MGFHbHpMbWRsZEVWc1pXMWxiblJ6UW5sVVlXZE9ZVzFsS0Z3aWRHOXdMV1JwWlZ3aUtWMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVWdkR2hoZENCallXNGdZbVVnY0hWMElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPZFcxaVpYSjlJRlJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxMQ0F3SUR3Z2JXRjRhVzExYlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2JXRjRhVzExYlU1MWJXSmxjazltUkdsalpTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJHRjViM1YwTG0xaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJSGRwWkhSb0lHOW1JSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQjNhV1IwYUNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeVFYUjBjbWxpZFhSbEtIUm9hWE1zSUZkSlJGUklYMEZVVkZKSlFsVlVSU3dnUkVWR1FWVk1WRjlYU1VSVVNDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdobGFXZG9kQ0J2WmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdobGFXZG9kQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRWhGU1VkSVZGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZTRVZKUjBoVUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnWkdsemNHVnljMmx2YmlCc1pYWmxiQ0J2WmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMzQmxjbk5wYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNrRjBkSEpwWW5WMFpTaDBhR2x6TENCRVNWTlFSVkpUU1U5T1gwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUVTVk5RUlZKVFNVOU9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2MybDZaU0J2WmlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVdWVGFYcGxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFVHOXphWFJwZG1WT2RXMWlaWEpCZEhSeWFXSjFkR1VvZEdocGN5d2dSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMFJKUlY5VFNWcEZLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVc0Z1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0lHSmxJR1J5WVdkblpXUS9YRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwSnZiMnhsWVc1OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmtGMGRISnBZblYwWlNoMGFHbHpMQ0JFVWtGSFIwbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUVVa0ZIUjBsT1IxOUVTVU5GWDBSSlUwRkNURVZFS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRFlXNGdaR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtJR0psSUdobGJHUWdZbmtnWVNCUWJHRjVaWEkvWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMEp2YjJ4bFlXNTlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR1JwYzJGaWJHVmtTRzlzWkdsdVowUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbEtIUm9hWE1zSUVoUFRFUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZTRTlNUkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCSmN5QnliM1JoZEdsdVp5QmthV05sSUc5dUlIUm9hWE1nWW05aGNtUWdaR2x6WVdKc1pXUS9YRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwSnZiMnhsWVc1OVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjMkZpYkdWa1VtOTBZWFJwYm1kRWFXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmtGMGRISnBZblYwWlNoMGFHbHpMQ0JTVDFSQlZFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOVNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdaSFZ5WVhScGIyNGdhVzRnYlhNZ2RHOGdjSEpsYzNNZ2RHaGxJRzF2ZFhObElDOGdkRzkxWTJnZ1lTQmthV1VnWW1WbWIzSmxJR2wwSUdKbGEyOXRaWE5jYmlBZ0lDQWdLaUJvWld4a0lHSjVJSFJvWlNCUWJHRjVaWEl1SUVsMElHaGhjeUJ2Ym14NUlHRnVJR1ZtWm1WamRDQjNhR1Z1SUhSb2FYTXVhRzlzWkdGaWJHVkVhV05sSUQwOVBWeHVJQ0FnSUNBcUlIUnlkV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQm9iMnhrUkhWeVlYUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JJVDB4RVgwUlZVa0ZVU1U5T1gwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUlUMHhFWDBSVlVrRlVTVTlPS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeWN5QndiR0Y1YVc1bklHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdWRzl3VUd4aGVXVnlXMTE5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhCc1lYbGxjbk1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbkYxWlhKNVUyVnNaV04wYjNJb1hDSjBiM0F0Y0d4aGVXVnlMV3hwYzNSY0lpa3VjR3hoZVdWeWN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkJjeUJ3YkdGNVpYSXNJSFJvY205M0lIUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMVJ2Y0ZCc1lYbGxjbjBnVzNCc1lYbGxjaUE5SUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVsMGdMU0JVYUdWY2JpQWdJQ0FnS2lCd2JHRjVaWElnZEdoaGRDQnBjeUIwYUhKdmQybHVaeUIwYUdVZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdSR2xsVzExOUlGUm9aU0IwYUhKdmQyNGdaR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtMaUJVYUdseklHeHBjM1FnYjJZZ1pHbGpaU0JwY3lCMGFHVWdjMkZ0WlNCaGN5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDZHpJSHRBYzJWbElHUnBZMlY5SUhCeWIzQmxjblI1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkR2h5YjNkRWFXTmxLSEJzWVhsbGNpQTlJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY0d4aGVXVnlJQ1ltSUNGd2JHRjVaWEl1YUdGelZIVnliaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjR3hoZVdWeUxuTjBZWEowVkhWeWJpZ3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR2xqWlM1bWIzSkZZV05vS0dScFpTQTlQaUJrYVdVdWRHaHliM2RKZENncEtUdGNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWthV05sTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVGa1pDQmhJR1JwWlNCMGJ5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdSR2xsZkU5aWFtVmpkSDBnVzJOdmJtWnBaeUE5SUh0OVhTQXRJRlJvWlNCa2FXVWdiM0lnWVNCamIyNW1hV2QxY21GMGFXOXVJRzltWEc0Z0lDQWdJQ29nZEdobElHUnBaU0IwYnlCaFpHUWdkRzhnZEdocGN5QlViM0JFYVdObFFtOWhjbVF1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjhiblZzYkgwZ1cyTnZibVpwWnk1d2FYQnpYU0F0SUZSb1pTQndhWEJ6SUc5bUlIUm9aU0JrYVdVZ2RHOGdZV1JrTGx4dUlDQWdJQ0FxSUVsbUlHNXZJSEJwY0hNZ1lYSmxJSE53WldOcFptbGxaQ0J2Y2lCMGFHVWdjR2x3Y3lCaGNtVWdibTkwSUdKbGRIZGxaVzRnTVNCaGJtUWdOaXdnWVNCeVlXNWtiMjFjYmlBZ0lDQWdLaUJ1ZFcxaVpYSWdZbVYwZDJWbGJpQXhJR0Z1WkNBMklHbHpJR2RsYm1WeVlYUmxaQ0JwYm5OMFpXRmtMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQmJZMjl1Wm1sbkxtTnZiRzl5WFNBdElGUm9aU0JqYjJ4dmNpQnZaaUIwYUdVZ1pHbGxJSFJ2SUdGa1pDNGdSR1ZtWVhWc2RGeHVJQ0FnSUNBcUlIUnZJSFJvWlNCa1pXWmhkV3gwSUdOdmJHOXlMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmJZMjl1Wm1sbkxuaGRJQzBnVkdobElIZ2dZMjl2Y21ScGJtRjBaU0J2WmlCMGFHVWdaR2xsTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JiWTI5dVptbG5MbmxkSUMwZ1ZHaGxJSGtnWTI5dmNtUnBibUYwWlNCdlppQjBhR1VnWkdsbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCYlkyOXVabWxuTG5KdmRHRjBhVzl1WFNBdElGUm9aU0J5YjNSaGRHbHZiaUJ2WmlCMGFHVWdaR2xsTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3Vkc5d1VHeGhlV1Z5ZlNCYmFHVnNaRUo1WFNBdElGUm9aU0J3YkdGNVpYSWdhRzlzWkdsdVp5QjBhR1VnWkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdSR2xsZlNCVWFHVWdZV1JrWldRZ1pHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHRmtaRVJwWlNoamIyNW1hV2NnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1aGNIQmxibVJEYUdsc1pDaGpiMjVtYVdjZ2FXNXpkR0Z1WTJWdlppQlViM0JFYVdVZ1B5QmpiMjVtYVdjZ09pQnVaWGNnVkc5d1JHbGxLR052Ym1acFp5a3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRkpsYlc5MlpTQmthV1VnWm5KdmJTQjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdSR2xsZlNCa2FXVWdMU0JVYUdVZ1pHbGxJSFJ2SUhKbGJXOTJaU0JtY205dElIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2NtVnRiM1psUkdsbEtHUnBaU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9aR2xsTG5CaGNtVnVkRTV2WkdVZ0ppWWdaR2xsTG5CaGNtVnVkRTV2WkdVZ1BUMDlJSFJvYVhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFEyaHBiR1FvWkdsbEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1ZlR0Y2JseHVkMmx1Wkc5M0xtTjFjM1J2YlVWc1pXMWxiblJ6TG1SbFptbHVaU2hjSW5SdmNDMWthV05sTFdKdllYSmtYQ0lzSUZSdmNFUnBZMlZDYjJGeVpDazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWRzl3UkdsalpVSnZZWEprTEZ4dUlDQWdJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXNYRzRnSUNBZ1JFVkdRVlZNVkY5SVQweEVYMFJWVWtGVVNVOU9MRnh1SUNBZ0lFUkZSa0ZWVEZSZlYwbEVWRWdzWEc0Z0lDQWdSRVZHUVZWTVZGOUlSVWxIU0ZRc1hHNGdJQ0FnUkVWR1FWVk1WRjlFU1ZOUVJWSlRTVTlPTEZ4dUlDQWdJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkZ4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UwUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVbjBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5TG1welhDSTdYRzVjYmk4cUtseHVJQ29nVkc5d1VHeGhlV1Z5VEdsemRDQjBieUJrWlhOamNtbGlaU0IwYUdVZ2NHeGhlV1Z5Y3lCcGJpQjBhR1VnWjJGdFpTNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvdlhHNWpiMjV6ZENCVWIzQlFiR0Y1WlhKTWFYTjBJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkQ0I3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dWRzl3VUd4aGVXVnlUR2x6ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2lncElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BqMGdkR2hwY3k1d2JHRjVaWEp6TG14bGJtZDBhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1aGNIQmxibVJEYUdsc1pDaEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdkR2hwY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWRHOXdPbk4wWVhKMExYUjFjbTVjSWl3Z0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBibXg1SUc5dVpTQndiR0Y1WlhJZ1kyRnVJR2hoZG1VZ1lTQjBkWEp1SUdGMElHRnVlU0JuYVhabGJpQjBhVzFsTGx4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1d2JHRjVaWEp6WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWh3SUQwK0lDRndMbVZ4ZFdGc2N5aGxkbVZ1ZEM1a1pYUmhhV3d1Y0d4aGVXVnlLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F1Wm05eVJXRmphQ2h3SUQwK0lIQXVaVzVrVkhWeWJpZ3BLVHRjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWkdselkyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjbk1nYVc0Z2RHaHBjeUJzYVhOMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTFSdmNGQnNZWGxsY2x0ZGZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQndiR0Y1WlhKektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdXeTR1TG5Sb2FYTXVaMlYwUld4bGJXVnVkSE5DZVZSaFowNWhiV1VvWENKMGIzQXRjR3hoZVdWeVhDSXBYVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNTNhVzVrYjNjdVkzVnpkRzl0Uld4bGJXVnVkSE11WkdWbWFXNWxLRndpZEc5d0xYQnNZWGxsY2kxc2FYTjBYQ0lzSUZSdmNGQnNZWGxsY2t4cGMzUXBPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRlJ2Y0ZCc1lYbGxja3hwYzNSY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxTDF4dWFXMXdiM0owSUh0VWIzQkVhV05sUW05aGNtUjlJR1p5YjIwZ1hDSXVMMVJ2Y0VScFkyVkNiMkZ5WkM1cWMxd2lPMXh1YVcxd2IzSjBJSHRVYjNCRWFXVjlJR1p5YjIwZ1hDSXVMMVJ2Y0VScFpTNXFjMXdpTzF4dWFXMXdiM0owSUh0VWIzQlFiR0Y1WlhKOUlHWnliMjBnWENJdUwxUnZjRkJzWVhsbGNpNXFjMXdpTzF4dWFXMXdiM0owSUh0VWIzQlFiR0Y1WlhKTWFYTjBmU0JtY205dElGd2lMaTlVYjNCUWJHRjVaWEpNYVhOMExtcHpYQ0k3WEc1Y2JuZHBibVJ2ZHk1MGQyVnVkSGx2Ym1Wd2FYQnpJRDBnZDJsdVpHOTNMblIzWlc1MGVXOXVaWEJwY0hNZ2ZId2dUMkpxWldOMExtWnlaV1Y2WlNoN1hHNGdJQ0FnVmtWU1UwbFBUam9nWENJd0xqQXVNVndpTEZ4dUlDQWdJRXhKUTBWT1UwVTZJRndpVEVkUVRDMHpMakJjSWl4Y2JpQWdJQ0JYUlVKVFNWUkZPaUJjSW1oMGRIQnpPaTh2ZEhkbGJuUjViMjVsY0dsd2N5NXZjbWRjSWl4Y2JpQWdJQ0JVYjNCRWFXTmxRbTloY21RNklGUnZjRVJwWTJWQ2IyRnlaQ3hjYmlBZ0lDQlViM0JFYVdVNklGUnZjRVJwWlN4Y2JpQWdJQ0JVYjNCUWJHRjVaWEk2SUZSdmNGQnNZWGxsY2l4Y2JpQWdJQ0JVYjNCUWJHRjVaWEpNYVhOME9pQlViM0JRYkdGNVpYSk1hWE4wWEc1OUtUdGNiaUpkTENKdVlXMWxjeUk2V3lKMllXeHBaR0YwWlNJc0lrTlBURTlTWDBGVVZGSkpRbFZVUlNJc0lsOWpiMnh2Y2lKZExDSnRZWEJ3YVc1bmN5STZJa0ZCUVVFN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJOa0pCTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzWTBGQll5eExRVUZMTEVOQlFVTTdPenM3T3pzN08wbEJVVE5ETEZkQlFWY3NRMEZCUXl4UFFVRlBMRVZCUVVVN1VVRkRha0lzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMHRCUTJ4Q08wTkJRMG83TzBGRGVFTkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUU3T3pzN1FVRkpRU3hOUVVGTkxITkNRVUZ6UWl4SFFVRkhMRWRCUVVjc1EwRkJRenM3UVVGRmJrTXNUVUZCVFN4bFFVRmxMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXM3U1VGRE0wSXNUMEZCVHl4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UTBGRGNrVXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE5VSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6VkNMRTFCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETDBJc1RVRkJUU3hYUVVGWExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTnNReXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenM3T3pzN096czdPenM3T3pzN08wRkJaMEk1UWl4TlFVRk5MRlZCUVZVc1IwRkJSeXhOUVVGTk96czdPenM3TzBsQlQzSkNMRmRCUVZjc1EwRkJRenRSUVVOU0xFdEJRVXM3VVVGRFRDeE5RVUZOTzFGQlEwNHNWVUZCVlR0UlFVTldMRTlCUVU4N1MwRkRWaXhIUVVGSExFVkJRVVVzUlVGQlJUdFJRVU5LTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzQkNMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPenRSUVVWNFFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRlZCUVZVc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJRenRSUVVOMlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVOdVFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRMUVVONFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlR5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRek5DT3p0SlFVVkVMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5VTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRaUVVOUUxFMUJRVTBzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExEWkRRVUUyUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUdPMUZCUTBRc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRUlzU1VGQlNTeERRVUZETEdOQlFXTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTm9SRHM3T3pzN096czdTVUZSUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNMVFqczdTVUZGUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRVQ3hOUVVGTkxFbEJRVWtzYTBKQlFXdENMRU5CUVVNc1EwRkJReXc0UTBGQk9FTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5vUnp0UlFVTkVMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdTMEZEYUVRN096czdPenM3TzBsQlVVUXNTVUZCU1N4dFFrRkJiVUlzUjBGQlJ6dFJRVU4wUWl4UFFVRlBMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0TFFVTnNRenM3T3pzN096czdPenRKUVZWRUxFbEJRVWtzVlVGQlZTeEhRVUZITzFGQlEySXNUMEZCVHl4WFFVRlhMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEyaERPenRKUVVWRUxFbEJRVWtzVlVGQlZTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTmtMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5RTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETEd0RVFVRnJSQ3hGUVVGRkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNCSE8xRkJRMFFzVDBGQlR5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU51UXpzN096czdPenM3U1VGUlJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTNRanM3U1VGRlJDeEpRVUZKTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1VVRkRXaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVWQlFVVTdXVUZEVkN4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl3clEwRkJLME1zUlVGQlJTeEZRVUZGTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOc1J6dFJRVU5FTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzWkNMRWxCUVVrc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UzBGRGFFUTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeE5RVUZOTEVOQlFVTXNSMEZCUnl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlF6VkNMRTlCUVU4c1UwRkJVeXhMUVVGTExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMHRCUTNKRE96dEpRVVZFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOV0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM2hDT3pzN096czdPenRKUVZGRUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN096dEpRVkZFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096czdPenM3T3p0SlFWRkVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVFVGQlRTeEhRVUZITEVkQlFVY3NaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJoRUxFMUJRVTBzUjBGQlJ5eEhRVUZITEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXpzN1VVRkZhRVFzVDBGQlR5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOeVFqczdPenM3T3pzN096czdPMGxCV1VRc1RVRkJUU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5VTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN1dVRkRlRU1zVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zZVVOQlFYbERMRVZCUVVVc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRTFCUVUwc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRNVWs3TzFGQlJVUXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETjBJc1RVRkJUU3haUVVGWkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVjRRaXhMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVsQlFVa3NSVUZCUlR0WlFVTndRaXhKUVVGSkxFZEJRVWNzUTBGQlF5eGpRVUZqTEVWQlFVVXNTVUZCU1N4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVU3T3pzN1owSkJTWFJETEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0aFFVTXZRaXhOUVVGTk8yZENRVU5JTEZsQlFWa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WVVGRE1VSTdVMEZEU2pzN1VVRkZSQ3hOUVVGTkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNSVUZCUlN4SlFVRkpMRU5CUVVNc2JVSkJRVzFDTEVOQlFVTXNRMEZCUXp0UlFVTTVSU3hOUVVGTkxHTkJRV01zUjBGQlJ5eEpRVUZKTEVOQlFVTXNjMEpCUVhOQ0xFTkJRVU1zUjBGQlJ5eEZRVUZGTEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03TzFGQlJUTkZMRXRCUVVzc1RVRkJUU3hIUVVGSExFbEJRVWtzV1VGQldTeEZRVUZGTzFsQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTjBSU3hOUVVGTkxGVkJRVlVzUjBGQlJ5eGpRVUZqTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNN1dVRkRMME1zWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJYUkRMRWRCUVVjc1EwRkJReXhYUVVGWExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFsQlEzaEVMRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4elFrRkJjMElzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTjJSaXhwUWtGQmFVSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VTBGREwwSTdPMUZCUlVRc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6czdVVUZGYmtNc1QwRkJUeXhwUWtGQmFVSXNRMEZCUXp0TFFVTTFRanM3T3pzN096czdPenM3U1VGWFJDeHpRa0ZCYzBJc1EwRkJReXhIUVVGSExFVkJRVVVzYVVKQlFXbENMRVZCUVVVN1VVRkRNME1zVFVGQlRTeFRRVUZUTEVkQlFVY3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVNMVFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRaQ3hOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPenRSUVVWc1JDeFBRVUZQTEZOQlFWTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFdEJRVXNzUjBGQlJ5eFJRVUZSTEVWQlFVVTdXVUZETjBNc1MwRkJTeXhOUVVGTkxFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8yZENRVU14UXl4SlFVRkpMRk5CUVZNc1MwRkJTeXhKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRVZCUVVVc2FVSkJRV2xDTEVOQlFVTXNSVUZCUlR0dlFrRkRiRVVzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRwUWtGRGRrSTdZVUZEU2pzN1dVRkZSQ3hMUVVGTExFVkJRVVVzUTBGQlF6dFRRVU5ZT3p0UlFVVkVMRTlCUVU4c1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096czdPenM3TzBsQldVUXNZVUZCWVN4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOcVFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM2hDTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03TzFGQlJUVkNMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU5pTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNwRExFMUJRVTA3V1VGRFNDeExRVUZMTEVsQlFVa3NSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NTVUZCU1N4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZCUlR0blFrRkRha1VzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRPVVFzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnFSVHM3V1VGRlJDeExRVUZMTEVsQlFVa3NSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUVVVN1owSkJRM0JGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRemxFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRha1U3VTBGRFNqczdVVUZGUkN4UFFVRlBMRXRCUVVzc1EwRkJRenRMUVVOb1FqczdPenM3T3pzN096czdTVUZYUkN4WlFVRlpMRU5CUVVNc1NVRkJTU3hGUVVGRkxHbENRVUZwUWl4RlFVRkZPMUZCUTJ4RExFOUJRVThzVTBGQlV5eExRVUZMTEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU16UnpzN096czdPenM3TzBsQlUwUXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOaUxFOUJRVThzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTJwRk96czdPenM3T3pzN08wbEJWVVFzWVVGQllTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1EwRkJReXhGUVVGRk8xRkJRM1JDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZPMWxCUXpsRUxFOUJRVThzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1IwRkJSeXhEUVVGRE8xTkJRMnBETzFGQlEwUXNUMEZCVHl4VFFVRlRMRU5CUVVNN1MwRkRjRUk3T3pzN096czdPenM3TzBsQlYwUXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEzQkNMRTlCUVU4c1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGNFUTdPenM3T3pzN096czdPMGxCVjBRc2IwSkJRVzlDTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTNwQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNwRUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RlFVRkZPMWxCUTNoRExFOUJRVThzUTBGQlF5eERRVUZETzFOQlExbzdVVUZEUkN4UFFVRlBMRk5CUVZNc1EwRkJRenRMUVVOd1FqczdPenM3T3pzN096czdPenM3U1VGalJDeE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1NVRkJTU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTjJRaXhOUVVGTkxGVkJRVlVzUjBGQlJ6dFpRVU5tTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTJwRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzQkRMRU5CUVVNN08xRkJSVVlzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU01UXl4TlFVRk5MRTlCUVU4c1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRelZETEUxQlFVMHNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzVDBGQlR5eERRVUZETzFGQlEzaERMRTFCUVUwc1VVRkJVU3hIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRE4wTXNUVUZCVFN4VFFVRlRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eFJRVUZSTEVOQlFVTTdPMUZCUlRGRExFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTTdXVUZEWml4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eFZRVUZWTEVOQlFVTTdXVUZEYWtNc1VVRkJVU3hGUVVGRkxFOUJRVThzUjBGQlJ5eFJRVUZSTzFOQlF5OUNMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhPMmRDUVVOdVFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8yRkJRekZDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1VVRkJVU3hIUVVGSExGRkJRVkU3VTBGRGFFTXNSVUZCUlR0WlFVTkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzJkQ1FVTnNRaXhIUVVGSExFVkJRVVVzVlVGQlZTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMmRDUVVOMlFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjN1lVRkRkRUlzUTBGQlF6dFpRVU5HTEZGQlFWRXNSVUZCUlN4UFFVRlBMRWRCUVVjc1UwRkJVenRUUVVOb1F5eEZRVUZGTzFsQlEwTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU03WjBKQlEyeENMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdaMEpCUTNaQ0xFZEJRVWNzUlVGQlJTeFZRVUZWTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1lVRkRNVUlzUTBGQlF6dFpRVU5HTEZGQlFWRXNSVUZCUlN4UlFVRlJMRWRCUVVjc1UwRkJVenRUUVVOcVF5eERRVUZETEVOQlFVTTdPMUZCUlVnc1RVRkJUU3hOUVVGTkxFZEJRVWNzVTBGQlV6czdZVUZGYmtJc1RVRkJUU3hEUVVGRExFTkJRVU1zVVVGQlVTeExRVUZMTEZOQlFWTXNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRE96dGhRVVU1UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhSUVVGUkxFdEJRVXM3WjBKQlEyeENMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExFZEJRVWNzUTBGQlF5eFhRVUZYTEVOQlFVTXNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJRenR0UWtGRGRFVXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czdZVUZGY2tRc1RVRkJUVHRuUWtGRFNDeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRXRCUVVzc1VVRkJVU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhMRkZCUVZFc1IwRkJSeXhKUVVGSk8yZENRVU4yUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hUUVVGVExFVkJRVVVzVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUXk5Q0xFTkJRVU03TzFGQlJVNHNUMEZCVHl4VFFVRlRMRXRCUVVzc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVNNVJUczdPenM3T3pzN08wbEJVMFFzUzBGQlN5eERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTNoQ0xFdEJRVXNzVFVGQlRTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdFpRVU12UWl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSUzlDTEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEZWtRc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenM3V1VGRmVrUXNTVUZCU1N4SlFVRkpMRWxCUVVrc1NVRkJTU3hGUVVGRk8yZENRVU5rTEU5QlFVOHNSMEZCUnl4RFFVRkRPMkZCUTJRN1UwRkRTanM3VVVGRlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0TFFVTm1PenM3T3pzN096czdPMGxCVlVRc1kwRkJZeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVTdVVUZETVVJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGRFUTdPenM3T3pzN096dEpRVk5FTEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdFJRVU4wUWl4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMHRCUTNwRU96czdPenM3T3pzN1NVRlRSQ3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRiRUlzVDBGQlR6dFpRVU5JTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTJwRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzQkRMRU5CUVVNN1MwRkRURHREUVVOS096dEJRM0JtUkRzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRU3RDUVN4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVOQlFVTXNTVUZCU1N4TFFVRkxPMGxCUTJwRExFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTNwRExFOUJRVThzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExGZEJRVmNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0RFFVTXhSaXhEUVVGRE96czdPenM3T3p0QlFWRkdMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NRMEZCUXl4SFFVRkhPenM3T3pzN096czdPenM3TzBsQllUTkNMR05CUVdNc1IwRkJSeXhEUVVGRE96czdPenM3T3pzN096czdPenM3TzFGQlowSmtMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRVZCUVVVc1VVRkJVU3hGUVVGRk96czdPMWxCU1M5RExFMUJRVTBzVVVGQlVTeEhRVUZITEd0Q1FVRnJRaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6RkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeFJRVUZSTEV0QlFVc3NRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdaMEpCUTNCRUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlF6TkRPMU5CUTBvN1MwRkRTanM3UVVOb1JrdzdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1RVRkJUU3hsUVVGbExFZEJRVWNzWTBGQll5eExRVUZMTEVOQlFVTTdTVUZEZUVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUlVGQlJUdFJRVU5pTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOa08wTkJRMG83TzBGRGRrSkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUVzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEdGQlFXRXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRM0JETEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03TzBGQlJUbENMRTFCUVUwc1lVRkJZU3hIUVVGSExFMUJRVTA3U1VGRGVFSXNWMEZCVnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVN1VVRkROVU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGRGVFSXNZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzV1VGQldTeERRVUZETEVOQlFVTTdVVUZEZEVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1MwRkROMEk3TzBsQlJVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNMEk3TzBsQlJVUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhoUVVGaExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXk5RU96dEpRVVZFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ096dEpRVVZFTEVsQlFVa3NUMEZCVHl4SFFVRkhPMUZCUTFZc1QwRkJUeXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1MwRkRiRU03TzBsQlJVUXNVMEZCVXl4RFFVRkRMRlZCUVZVc1JVRkJSVHRSUVVOc1FpeGhRVUZoTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU53UXl4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVObU96dEpRVVZFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRk5CUVZNc1JVRkJSU3hoUVVGaExFZEJRVWNzUlVGQlJTeEZRVUZGTEZOQlFWTXNSMEZCUnl4bFFVRmxMRU5CUVVNc1JVRkJSVHRSUVVOcVJTeE5RVUZOTEZkQlFWY3NSMEZCUnl4VFFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUlVGQlJTeGhRVUZoTEVOQlFVTXNRMEZCUXp0UlFVTjZSQ3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFsQlEyUXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4aFFVRmhMRU5CUVVNc1EwRkJRenM3V1VGRmRrUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdVMEZETTBJN08xRkJSVVFzVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWmp0RFFVTktPenRCUXk5RVJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVVkJMRTFCUVUwc1ZVRkJWU3hIUVVGSExHTkJRV01zWlVGQlpTeERRVUZETzBsQlF6ZERMRmRCUVZjc1EwRkJReXhIUVVGSExFVkJRVVU3VVVGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRaRHREUVVOS096dEJRM3BDUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVWQkxFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1kwRkJZeXhsUVVGbExFTkJRVU03U1VGRGJrUXNWMEZCVnl4RFFVRkRMRWRCUVVjc1JVRkJSVHRSUVVOaUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0TFFVTmtPME5CUTBvN08wRkRla0pFT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCU1VFc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHZRa0ZCYjBJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU55UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03VVVGRGJFTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdVVUZETTBNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1dVRkRla0lzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTnFRaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEU5QlFVOHNTMEZCU3l4RlFVRkZPMWxCUTJ4RExFMUJRVTBzVjBGQlZ5eEhRVUZITEZGQlFWRXNRMEZCUXl4TFFVRkxMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRExGZEJRVmNzUTBGQlF5eEZRVUZGTzJkQ1FVTXZRaXhMUVVGTExFZEJRVWNzVjBGQlZ5eERRVUZETzJGQlEzWkNMRTFCUVUwN1owSkJRMGdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzUkRPMU5CUTBvc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4blFrRkJaMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpWRE96dFJRVVZFTEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3haUVVGWkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjRRenM3U1VGRlJDeFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTFZc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEyWXNVMEZCVXl4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXp0WlFVTnNReXhoUVVGaExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEY2tJc1EwRkJReXhEUVVGRE8wdEJRMDQ3TzBsQlJVUXNWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOWUxFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkRiRU1zWVVGQllTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNKQ0xFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRTlCUVU4c1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlExWXNUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6bEVMR0ZCUVdFc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVMEZEZUVJc1EwRkJReXhEUVVGRE8wdEJRMDQ3UTBGRFNqczdRVU5zUlVRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGSFFTeE5RVUZOTEc5Q1FVRnZRaXhIUVVGSExFVkJRVVVzUTBGQlF6dEJRVU5vUXl4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEdOQlFXTXNZVUZCWVN4RFFVRkRPMGxCUTNCRUxGZEJRVmNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEWml4SlFVRkpMRXRCUVVzc1IwRkJSeXh2UWtGQmIwSXNRMEZCUXp0UlFVTnFReXhOUVVGTkxGbEJRVmtzUjBGQlJ5eHZRa0ZCYjBJc1EwRkJRenRSUVVNeFF5eE5RVUZOTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSV3hDTEVsQlFVa3NVVUZCVVN4TFFVRkxMRTlCUVU4c1MwRkJTeXhGUVVGRk8xbEJRek5DTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1UwRkRha0lzVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRelZET3p0UlFVVkVMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFF6czdTVUZGUkN4UlFVRlJMRWRCUVVjN1VVRkRVQ3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1RVRkJUU3hGUVVGRkxFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMDdVMEZEZEVNc1EwRkJReXhEUVVGRE8wdEJRMDQ3UTBGRFNqczdRVU16UTBRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRFFUdEJRVU5CTEVGQlJVRXNUVUZCVFN4dFFrRkJiVUlzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4alFVRmpMR0ZCUVdFc1EwRkJRenRKUVVOdVJDeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTJZc1NVRkJTU3hMUVVGTExFZEJRVWNzYlVKQlFXMUNMRU5CUVVNN1VVRkRhRU1zVFVGQlRTeFpRVUZaTEVkQlFVY3NiVUpCUVcxQ0xFTkJRVU03VVVGRGVrTXNUVUZCVFN4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE96dFJRVVZzUWl4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdRMEZEU2pzN1FVTjBRMFE3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZKUVN4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEV0QlFVc3NRMEZCUXp0QlFVTndReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMR05CUVdNc1lVRkJZU3hEUVVGRE8wbEJRM0pFTEZkQlFWY3NRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRaaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJRenRSUVVOc1F5eE5RVUZOTEZsQlFWa3NSMEZCUnl4eFFrRkJjVUlzUTBGQlF6dFJRVU16UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03TzFGQlJXeENMRWxCUVVrc1MwRkJTeXhaUVVGWkxFOUJRVThzUlVGQlJUdFpRVU14UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMHNTVUZCU1N4UlFVRlJMRXRCUVVzc1QwRkJUeXhMUVVGTExFVkJRVVU3V1VGRGJFTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzJkQ1FVTnlRaXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzJGQlEyaENMRTFCUVUwc1NVRkJTU3hSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMmRDUVVNM1FpeExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMkZCUTJwQ0xFMUJRVTA3WjBKQlEwZ3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGVkJRVlVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTNSRE8xTkJRMG9zVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRelZET3p0UlFVVkVMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFF6czdTVUZGUkN4TlFVRk5MRWRCUVVjN1VVRkRUQ3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1RVRkJUU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMDdVMEZEZUVNc1EwRkJReXhEUVVGRE8wdEJRMDQ3TzBsQlJVUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEyWXNVMEZCVXl4RlFVRkZMRTFCUVUwc1MwRkJTeXhMUVVGTExFbEJRVWtzUTBGQlF5eE5RVUZOTzFOQlEzcERMRU5CUVVNc1EwRkJRenRMUVVOT08wTkJRMG83TzBGRE1VUkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJTMEVzVFVGQlRTeFRRVUZUTEVkQlFVY3NUVUZCVFR0SlFVTndRaXhYUVVGWExFZEJRVWM3UzBGRFlqczdTVUZGUkN4UFFVRlBMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEc5Q1FVRnZRaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlF6RkRPenRKUVVWRUxFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVkN4UFFVRlBMRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRlRU03TzBsQlJVUXNUMEZCVHl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOWUxFOUJRVThzU1VGQlNTeHZRa0ZCYjBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU14UXpzN1NVRkZSQ3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlExWXNUMEZCVHl4SlFVRkpMRzFDUVVGdFFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTNwRE96dERRVVZLTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4SlFVRkpMRk5CUVZNc1JVRkJSVHM3UVVNNVF6RkRPenM3T3pzN096czdPenM3T3pzN096czdPenM3TzBGQmMwSkJMRUZCU1VFN1FVRkRRU3hOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hqUVVGakxFZEJRVWNzVFVGQlRTeERRVUZETzBGQlF6bENMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR3RDUVVGclFpeEhRVUZITEZWQlFWVXNRMEZCUXpzN08wRkJSM1JETEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYjBJdlFpeE5RVUZOTEZOQlFWTXNSMEZCUnl4alFVRmpMR3RDUVVGclFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPenM3T3pzN096czdPenM3TzBsQllUVkVMRmRCUVZjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFVkJRVVVzUlVGQlJUdFJRVU0xUXl4TFFVRkxMRVZCUVVVc1EwRkJRenM3VVVGRlVpeE5RVUZOTEZWQlFWVXNSMEZCUjBFc2EwSkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZSU3hKUVVGSkxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVTdXVUZEY0VJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCVlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xbEJRMjVETEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTnNSQ3hOUVVGTk8xbEJRMGdzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExEUkRRVUUwUXl4RFFVRkRMRU5CUVVNN1UwRkRPVVU3TzFGQlJVUXNUVUZCVFN4VFFVRlRMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROMFVzU1VGQlNTeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZPMWxCUTI1Q0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM1JDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTm9SQ3hOUVVGTk8xbEJRMGdzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExESkRRVUV5UXl4RFFVRkRMRU5CUVVNN1UwRkROMFU3TzFGQlJVUXNUVUZCVFN4VlFVRlZMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVzc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1lzU1VGQlNTeFZRVUZWTEVOQlFVTXNUMEZCVHl4RlFVRkZPMWxCUTNCQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRE8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTnNSQ3hOUVVGTk96dFpRVVZJTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEzWkNMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTTdVMEZEZWtNN08xRkJSVVFzVFVGQlRTeFpRVUZaTEVkQlFVZEJMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEU5QlFVOHNTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1lVRkRiRVlzVFVGQlRTeEZRVUZGTEVOQlFVTTdVVUZEWkN4SlFVRkpMRmxCUVZrc1EwRkJReXhQUVVGUExFVkJRVVU3V1VGRGRFSXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdXVUZETlVJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHJRa0ZCYTBJc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5PenRaUVVWSUxGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXp0VFFVTTFRenRMUVVOS096dEpRVVZFTEZkQlFWY3NhMEpCUVd0Q0xFZEJRVWM3VVVGRE5VSXNUMEZCVHp0WlFVTklMR1ZCUVdVN1dVRkRaaXhqUVVGak8xbEJRMlFzWlVGQlpUdFpRVU5tTEd0Q1FVRnJRanRUUVVOeVFpeERRVUZETzB0QlEwdzdPMGxCUlVRc2FVSkJRV2xDTEVkQlFVYzdTMEZEYmtJN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNelFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1NVRkJTU3hIUVVGSE8xRkJRMUFzVDBGQlR5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTEVsQlFVa3NTMEZCU3l4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6TkVPMGxCUTBRc1NVRkJTU3hMUVVGTExFTkJRVU1zVVVGQlVTeEZRVUZGTzFGQlEyaENMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFbEJRVWtzU1VGQlNTeExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMU5CUTNwRExFMUJRVTA3V1VGRFNDeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR1ZCUVdVc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU5vUkR0TFFVTktPenM3T3pzN08wbEJUMFFzVTBGQlV5eEhRVUZITzFGQlExSXNTVUZCU1N4SlFVRkpMRU5CUVVNc1YwRkJWeXhGUVVGRk8xbEJRMnhDTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzVjBGQlZ5eERRVUZETEdkQ1FVRm5RaXhGUVVGRk8yZENRVU0xUkN4TlFVRk5MRVZCUVVVN2IwSkJRMG9zVFVGQlRTeEZRVUZGTEVsQlFVazdhVUpCUTJZN1lVRkRTaXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5RTzFGQlEwUXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEZWtJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHJRa0ZCYTBJc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU0xUXl4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVObU96czdPenRKUVV0RUxFOUJRVThzUjBGQlJ6dFJRVU5PTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEzcENMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1EwRkJRenRMUVVNMVF6czdPenM3T3p0SlFVOUVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVDBGQlR5eEpRVUZKTEV0QlFVc3NVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU4wUXpzN096czdPenRKUVU5RUxGRkJRVkVzUjBGQlJ6dFJRVU5RTEU5QlFVOHNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzcENPenM3T3pzN096czdTVUZUUkN4TlFVRk5MRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMVlzVFVGQlRTeEpRVUZKTEVkQlFVY3NVVUZCVVN4TFFVRkxMRTlCUVU4c1MwRkJTeXhIUVVGSExFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpWRUxFOUJRVThzUzBGQlN5eExRVUZMTEVsQlFVa3NTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dExRVU12UXp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1dVRkJXU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZET3pzN096czdPenM3UVVGVGRFUXNUVUZCVFN4eFFrRkJjVUlzUjBGQlJ5eEpRVUZKTEZOQlFWTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPenRCUTJ4UGRFVTdPenM3T3pzN096czdPenM3T3pzN096czdPenRCUVhGQ1FTeEJRVWRCT3pzN1FVRkhRU3hOUVVGTkxHTkJRV01zUjBGQlJ5eEhRVUZITEVOQlFVTTdRVUZETTBJc1RVRkJUU3hqUVVGakxFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEzcENMRTFCUVUwc1lVRkJZU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU01UWl4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03UVVGRGNFSXNUVUZCVFN4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRE8wRkJRM0JDTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eERRVUZETzBGQlF6TkNMRTFCUVUwc1pVRkJaU3hIUVVGSExFZEJRVWNzUTBGQlF6czdRVUZGTlVJc1RVRkJUVU1zYVVKQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHBRa0ZCYVVJc1IwRkJSeXhUUVVGVExFTkJRVU03UVVGRGNFTXNUVUZCVFN4alFVRmpMRWRCUVVjc1RVRkJUU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzVlVGQlZTeERRVUZETzBGQlEzUkRMRTFCUVUwc1YwRkJWeXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU40UWl4TlFVRk5MRmRCUVZjc1IwRkJSeXhIUVVGSExFTkJRVU03TzBGQlJYaENMRTFCUVUwc1lVRkJZU3hIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU14UWl4TlFVRk5MREJDUVVFd1FpeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTjBReXhOUVVGTkxHbENRVUZwUWl4SFFVRkhMRWRCUVVjc1EwRkJRenRCUVVNNVFpeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUTBGQlF6dEJRVU16UWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhoUVVGaExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlF5OUNMRTFCUVUwc1MwRkJTeXhIUVVGSExHRkJRV0VzUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzWVVGQllTeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTndReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEVOQlFVTTdPMEZCUlRGQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxPMGxCUTNKQ0xFOUJRVThzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03UTBGRGFFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eERRVUZETEVsQlFVazdTVUZEY2tJc1RVRkJUU3hOUVVGTkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVNdlFpeFBRVUZQTEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNTVUZCU1N4TlFVRk5MRWxCUVVrc1kwRkJZeXhEUVVGRE8wTkJRemxGTEVOQlFVTTdPenM3T3pzN1FVRlBSaXhOUVVGTkxGVkJRVlVzUjBGQlJ5eE5RVUZOTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEdOQlFXTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenM3UVVGRmVFVXNUVUZCVFN4elFrRkJjMElzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08wRkJSWHBFTEVGQllVRTdPenM3T3pzN096dEJRVk5CTEUxQlFVMHNZVUZCWVN4SFFVRkhMRU5CUVVNc1NVRkJTU3hYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NjMEpCUVhOQ0xFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJRenM3UVVGRmRFWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhMUVVGTE8wbEJRMmhFTEUxQlFVMHNVMEZCVXl4SFFVRkhMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRE4wSXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4bFFVRmxMRU5CUVVNN1NVRkRkRU1zVDBGQlR5eERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMGxCUTNCQ0xFOUJRVThzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU3l4RFFVRkRPMGxCUXpGQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEV0QlFVc3NSMEZCUnl4VFFVRlRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRE8wbEJRelZGTEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVThzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0RFFVTnlRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNVMEZCVXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVNdlF5eE5RVUZOTEV0QlFVc3NTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRE4wSXNUVUZCVFN4bFFVRmxMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhFTEUxQlFVMHNWVUZCVlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRrTXNUVUZCVFN4eFFrRkJjVUlzUjBGQlJ5d3dRa0ZCTUVJc1IwRkJSeXhMUVVGTExFTkJRVU03U1VGRGFrVXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eFZRVUZWTEVkQlFVY3NRMEZCUXl4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyeEZMRTFCUVUwc1dVRkJXU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVVzYVVKQlFXbENMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03TzBsQlJUTkZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4SFFVRkhMSEZDUVVGeFFpeERRVUZETzBsQlEyNUZMRTFCUVUwc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVkQlFVY3NaVUZCWlN4RFFVRkRPenRKUVVVelF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZETVVJc1QwRkJUeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFpRVUZaTEVOQlFVTTdTVUZEYWtNc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRMMElzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEhGQ1FVRnhRaXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU14U0N4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dEpRVU42U0N4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6bEpMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJRenRKUVVNMVF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6TklMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8wbEJReTlGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3h4UWtGQmNVSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN08wbEJSWFpITEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRKUVVOcVFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRMEZEY2tJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZOQlFWTXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NTMEZCU3p0SlFVTjRReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdTVUZEWml4UFFVRlBMRU5CUVVNc1UwRkJVeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNUMEZCVHl4RFFVRkRMRk5CUVZNc1IwRkJSeXhUUVVGVExFTkJRVU03U1VGRE9VSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEY2tJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGFFUXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPME5CUTNKQ0xFTkJRVU03T3pzN1FVRkpSaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpkQ0xFMUJRVTFETEZGQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlEyaERMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZEZWtJc1RVRkJUU3hGUVVGRkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXpzN096czdPenM3T3p0QlFWVjZRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eGpRVUZqTEd0Q1FVRnJRaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZET3pzN096dEpRVXQ2UkN4WFFVRlhMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlR0UlFVTndSQ3hMUVVGTExFVkJRVVVzUTBGQlF6czdVVUZGVWl4TlFVRk5MRk5CUVZNc1IwRkJSMFlzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNN1lVRkRlRVVzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVlVGQlZTeEZRVUZGTEVOQlFVTTdZVUZEZGtJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFGQlF6TkNMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWTBGQll5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPenRSUVVVM1F5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhRU3hyUWtGQlVTeERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkxMRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlEwTXNhVUpCUVdVc1EwRkJReXhEUVVGRE8yRkJRMjVGTEZOQlFWTXNRMEZCUXl4aFFVRmhMRU5CUVVNN1lVRkRlRUlzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWRFTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGRkJRVkVzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR3RDUVVGclFpeERRVUZETEVOQlFVTTdZVUZET1VVc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTTdZVUZEWml4VFFVRlRMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdZVUZETTBJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMkZCUTNwRUxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEWWl4VFFVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRE8yRkJRM0JDTEV0QlFVc3NRMEZCUXpzN1VVRkZXQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dGhRVU42UkN4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMklzVTBGQlV5eERRVUZETEZOQlFWTXNRMEZCUXp0aFFVTndRaXhMUVVGTExFTkJRVU03TzFGQlJWZ3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSMEVzYTBKQlFWRXNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6dGhRVU40UlN4UlFVRlJMRVZCUVVVN1lVRkRWaXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETzJGQlEyWXNTMEZCU3l4RFFVRkRPMHRCUTJRN08wbEJSVVFzVjBGQlZ5eHJRa0ZCYTBJc1IwRkJSenRSUVVNMVFpeFBRVUZQTzFsQlEwaERMR2xDUVVGbE8xbEJRMllzYVVKQlFXbENPMWxCUTJwQ0xHTkJRV003V1VGRFpDeHJRa0ZCYTBJN1dVRkRiRUlzVjBGQlZ6dFpRVU5ZTEZkQlFWYzdVMEZEWkN4RFFVRkRPMHRCUTB3N08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1VVRkRhRUlzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEyeERMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZET1VRN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1VVRkRia0lzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZEVMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096czdPenM3T3p0SlFWRkVMRk5CUVZNc1IwRkJSenRSUVVOU0xFOUJRVThzWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVOdVF6czdPenM3T3pzN1NVRlJSQ3hSUVVGUkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVsQlFVa3NRMEZCUXl4VFFVRlRMRVZCUVVVc1EwRkJRenRMUVVNelFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1NVRkJTU3hIUVVGSE8xRkJRMUFzVDBGQlR5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQUXl4UlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6TkNPMGxCUTBRc1NVRkJTU3hMUVVGTExFTkJRVU1zVVVGQlVTeEZRVUZGTzFGQlEyaENMRWxCUVVrc1NVRkJTU3hMUVVGTExGRkJRVkVzUlVGQlJUdFpRVU51UWl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRFJDeHBRa0ZCWlN4RFFVRkRMRU5CUVVNN1dVRkRkRU5ETEZGQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxHRkJRV0VzUTBGQlF5eERRVUZETzFOQlEyNURMRTFCUVUwN1dVRkRTRUVzVVVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03V1VGRE0wSXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJRMFFzYVVKQlFXVXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVOb1JEdExRVU5LT3pzN096czdPenRKUVZGRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6VkNPMGxCUTBRc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTzFGQlEyWXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVVUZETVVJc1NVRkJTU3hKUVVGSkxFdEJRVXNzVFVGQlRTeEZRVUZGTzFsQlEycENMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTTdVMEZEYmtNc1RVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNVMEZCVXl4RlFVRkZMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eERRVUZETzFOQlEyNUVPMHRCUTBvN096czdPenM3U1VGUFJDeEpRVUZKTEZkQlFWY3NSMEZCUnp0UlFVTmtMRTlCUVU4c1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVNM1JUdEpRVU5FTEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVObUxFbEJRVWtzU1VGQlNTeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTmFMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFsQlEyUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03VTBGRGFrSXNTMEZCU3p0WlFVTkdMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJwQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTFnc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVMEZEWkR0TFFVTktPenM3T3pzN08wbEJUMFFzWTBGQll5eEhRVUZITzFGQlEySXNUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF6dExRVU53UXpzN096czdPenRKUVU5RUxFbEJRVWtzUTBGQlF5eEhRVUZITzFGQlEwb3NUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEzWkNPMGxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlExSXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYmtJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRhRU03T3pzN096czdTVUZQUkN4SlFVRkpMRU5CUVVNc1IwRkJSenRSUVVOS0xFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVOMlFqdEpRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSVHRSUVVOU0xFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRMjVDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEyaERPenM3T3pzN08wbEJUMFFzU1VGQlNTeFJRVUZSTEVkQlFVYzdVVUZEV0N4UFFVRlBMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZET1VJN1NVRkRSQ3hKUVVGSkxGRkJRVkVzUTBGQlF5eEpRVUZKTEVWQlFVVTdVVUZEWml4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRFppeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8xTkJRM0JETEUxQlFVMDdXVUZEU0N4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVsQlFVa3NSMEZCUnl4alFVRmpMRU5CUVVNN1dVRkRha1FzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZWQlFWVXNSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzFOQlEzSkVPMHRCUTBvN096czdPenM3TzBsQlVVUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTm9RaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4VlFVRlZMRVZCUVVVc1EwRkJReXhEUVVGRE8xbEJRemxDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTTNReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMR1ZCUVdVc1JVRkJSVHRuUWtGRE1VTXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzJsQ1FVTmFPMkZCUTBvc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFVEdExRVU5LT3pzN096czdPenM3U1VGVFJDeE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTFnc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTm9RaXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0WlFVTnlRaXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMR05CUVdNc1JVRkJSVHRuUWtGRGVrTXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzI5Q1FVTlVMRTFCUVUwN2FVSkJRMVE3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3U1VGUFJDeE5RVUZOTEVkQlFVYzdVVUZEVEN4UFFVRlBMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETzB0QlF5OUNPenM3T3pzN096czdTVUZUUkN4VFFVRlRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJRMlFzU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVN1dVRkROME1zU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRia0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVU3WjBKQlEyeEVMRTFCUVUwc1JVRkJSVHR2UWtGRFNpeEhRVUZITEVWQlFVVXNTVUZCU1R0dlFrRkRWQ3hOUVVGTk8ybENRVU5VTzJGQlEwb3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRVRHRMUVVOS096czdPenM3T3pzN096czdTVUZaUkN4TlFVRk5MRU5CUVVNc1QwRkJUeXhGUVVGRkxFOUJRVThzUlVGQlJTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRSUVVOeVJDeE5RVUZOTEV0QlFVc3NSMEZCUnl4UFFVRlBMRWRCUVVjc1lVRkJZU3hEUVVGRE8xRkJRM1JETEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRE0wSXNUVUZCVFN4TlFVRk5MRWRCUVVjc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVU0zUWl4TlFVRk5MRk5CUVZNc1IwRkJSeXhSUVVGUkxFZEJRVWNzUzBGQlN5eERRVUZET3p0UlFVVnVReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRmRCUVZjc1EwRkJRenM3VVVGRk0wSXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVVU3V1VGRFppeFZRVUZWTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03VTBGRGRrUTdPMUZCUlVRc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlR0WlFVTnlRaXhQUVVGUExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETzFsQlEzaERMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1pETEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNwRU96dFJRVVZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE96dFJRVVUxUXl4UlFVRlJMRWxCUVVrc1EwRkJReXhKUVVGSk8xRkJRMnBDTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY0VRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY0VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNSRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bEVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTktMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzUkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTndSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRemxFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU55UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGVrUXNUVUZCVFR0VFFVTlVPMUZCUTBRc1VVRkJVVHRUUVVOUU96czdVVUZIUkN4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZETVVNN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExGTkJRVk1zUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXpzN1FVTXhabWhFT3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFXOUNRU3hCUVV0Qk96czdPMEZCU1VFc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkROMElzVFVGQlRTeHhRa0ZCY1VJc1IwRkJSeXhIUVVGSExFTkJRVU03UVVGRGJFTXNUVUZCVFN3NFFrRkJPRUlzUjBGQlJ5eExRVUZMTEVOQlFVTTdRVUZETjBNc1RVRkJUU3cyUWtGQk5rSXNSMEZCUnl4TFFVRkxMRU5CUVVNN1FVRkROVU1zVFVGQlRTdzRRa0ZCT0VJc1IwRkJSeXhMUVVGTExFTkJRVU03TzBGQlJUZERMRTFCUVUwc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dEJRVU5vUWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03TzBGQlJXaENMRTFCUVUwc1lVRkJZU3hIUVVGSExFbEJRVWtzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRCUVVNNVF5eE5RVUZOTEdOQlFXTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1owSkJRV2RDTEVOQlFVTTdRVUZETDBNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXpzN1FVRkZhRVFzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4RFFVRkRPenRCUVVWd1FpeE5RVUZOTEdWQlFXVXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhSUVVGUkxFTkJRVU03UVVGRGJFTXNUVUZCVFN4dlFrRkJiMElzUjBGQlJ5eFpRVUZaTEVOQlFVTTdRVUZETVVNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRU5CUVVNN1FVRkRkRU1zVFVGQlRTeG5RMEZCWjBNc1IwRkJSeXgzUWtGQmQwSXNRMEZCUXp0QlFVTnNSU3hOUVVGTkxDdENRVUVyUWl4SFFVRkhMSFZDUVVGMVFpeERRVUZETzBGQlEyaEZMRTFCUVUwc1owTkJRV2RETEVkQlFVY3NkMEpCUVhkQ0xFTkJRVU03UVVGRGJFVXNUVUZCVFN4MVFrRkJkVUlzUjBGQlJ5eGxRVUZsTEVOQlFVTTdPenRCUVVkb1JDeE5RVUZOTEZkQlFWY3NSMEZCUnl4RFFVRkRMRmxCUVZrc1JVRkJSU3hoUVVGaExFZEJRVWNzUTBGQlF5eExRVUZMTzBsQlEzSkVMRTFCUVUwc1RVRkJUU3hIUVVGSExGRkJRVkVzUTBGQlF5eFpRVUZaTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRNVU1zVDBGQlR5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExHRkJRV0VzUjBGQlJ5eE5RVUZOTEVOQlFVTTdRMEZEZUVRc1EwRkJRenM3UVVGRlJpeE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExFTkJRVU1zV1VGQldTeEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTjBSQ3hQUVVGUFJDeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1EwRkJReXhaUVVGWkxFTkJRVU03VTBGRGFFTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOaUxGTkJRVk1zUTBGQlF5eFpRVUZaTEVOQlFVTTdVMEZEZGtJc1MwRkJTeXhEUVVGRE8wTkJRMlFzUTBGQlF6czdRVUZGUml4TlFVRk5MREJDUVVFd1FpeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRGFFVXNTVUZCU1N4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzFGQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eHBRa0ZCYVVJc1EwRkJReXhYUVVGWExFVkJRVVVzV1VGQldTeERRVUZETEVOQlFVTTdTMEZEZGtRN1NVRkRSQ3hQUVVGUExGbEJRVmtzUTBGQlF6dERRVU4yUWl4RFFVRkRPenRCUVVWR0xFMUJRVTBzVlVGQlZTeEhRVUZITEVOQlFVTXNZVUZCWVN4RlFVRkZMRk5CUVZNc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRE0wUXNTVUZCU1N4VFFVRlRMRXRCUVVzc1lVRkJZU3hKUVVGSkxFMUJRVTBzUzBGQlN5eGhRVUZoTEVWQlFVVTdVVUZEZWtRc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFppeE5RVUZOTEVsQlFVa3NUMEZCVHl4TFFVRkxMR0ZCUVdFc1JVRkJSVHRSUVVOc1F5eFBRVUZQTEV0QlFVc3NRMEZCUXp0TFFVTm9RaXhOUVVGTk8xRkJRMGdzVDBGQlR5eFpRVUZaTEVOQlFVTTdTMEZEZGtJN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNiVUpCUVcxQ0xFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTVUZCU1N4RlFVRkZMRmxCUVZrc1MwRkJTenRKUVVONlJDeEpRVUZKTEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVU3VVVGRE5VSXNUVUZCVFN4WFFVRlhMRWRCUVVjc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTXZReXhQUVVGUExGVkJRVlVzUTBGQlF5eFhRVUZYTEVWQlFVVXNRMEZCUXl4WFFVRlhMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4WlFVRlpMRU5CUVVNc1EwRkJRenRMUVVOc1JqczdTVUZGUkN4UFFVRlBMRmxCUVZrc1EwRkJRenREUVVOMlFpeERRVUZET3pzN1FVRkhSaXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRPVUlzVFVGQlRTeGpRVUZqTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVOeVF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdPMEZCUlhwRExFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE96dEJRVVV2UkN4TlFVRk5MRmxCUVZrc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dEpRVU0xUWl4SlFVRkpMRk5CUVZNc1MwRkJTeXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3VVVGRE4wTXNhMEpCUVd0Q0xFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOd1F6czdTVUZGUkN4UFFVRlBMR3RDUVVGclFpeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenREUVVONFF5eERRVUZET3p0QlFVVkdMRTFCUVUwc1pVRkJaU3hIUVVGSExFTkJRVU1zUzBGQlN5eEZRVUZGTEUxQlFVMHNTMEZCU3p0SlFVTjJReXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJRenREUVVNdlJDeERRVUZET3p0QlFVVkdMRTFCUVUwc1QwRkJUeXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTEZsQlFWa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXpzN1FVRkZja1VzVFVGQlRTeFhRVUZYTEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF5eEpRVUZKTEV0QlFVczdTVUZET1VNc1NVRkJTU3hQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdVVUZEYUVJc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE96dFJRVVV4UkN4TFFVRkxMRTFCUVUwc1IwRkJSeXhKUVVGSkxFbEJRVWtzUlVGQlJUdFpRVU53UWl4SFFVRkhMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03VTBGRE4wTTdTMEZEU2p0RFFVTktMRU5CUVVNN096czdRVUZKUml4TlFVRk5MRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJRenRCUVVOMFF5eE5RVUZOTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UVVGRE5VSXNUVUZCVFN4SlFVRkpMRWRCUVVjc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzBGQlF6VkNMRTFCUVUwc1dVRkJXU3hIUVVGSExFMUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXp0QlFVTTFReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN096dEJRVWR3UXl4TlFVRk5MR2REUVVGblF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RlFVRkZMRTlCUVU4c1JVRkJSU3hQUVVGUExFdEJRVXM3U1VGRGJrVXNUVUZCVFN4VFFVRlRMRWRCUVVjc1RVRkJUU3hEUVVGRExIRkNRVUZ4UWl4RlFVRkZMRU5CUVVNN08wbEJSV3BFTEUxQlFVMHNRMEZCUXl4SFFVRkhMRTlCUVU4c1IwRkJSeXhUUVVGVExFTkJRVU1zU1VGQlNTeEpRVUZKTEUxQlFVMHNRMEZCUXl4TFFVRkxMRWRCUVVjc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzBsQlEzUkZMRTFCUVUwc1EwRkJReXhIUVVGSExFOUJRVThzUjBGQlJ5eFRRVUZUTEVOQlFVTXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPenRKUVVWMlJTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wTkJRMnBDTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTenRKUVVOb1F5eE5RVUZOTEUxQlFVMHNSMEZCUnl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZET3pzN1NVRkhiRU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJoQ0xFbEJRVWtzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTnFRaXhKUVVGSkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdTVUZEZGtJc1NVRkJTU3hqUVVGakxFZEJRVWNzU1VGQlNTeERRVUZETzBsQlF6RkNMRWxCUVVrc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6czdTVUZGZGtJc1RVRkJUU3hQUVVGUExFZEJRVWNzVFVGQlRUdFJRVU5zUWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhMUVVGTExFbEJRVWtzV1VGQldTeExRVUZMTEV0QlFVc3NSVUZCUlRzN1dVRkZNVU1zVFVGQlRTeGxRVUZsTEVkQlFVY3NTMEZCU3l4RFFVRkRMR0ZCUVdFc1EwRkJReXh6UTBGQmMwTXNRMEZCUXl4RFFVRkRPMWxCUTNCR0xFbEJRVWtzWTBGQll5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZPMmRDUVVONlFpeGpRVUZqTEVOQlFVTXNVMEZCVXl4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8yRkJRemRETEUxQlFVMDdaMEpCUTBnc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXp0aFFVTXhRenRaUVVORUxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdPMWxCUldJc1YwRkJWeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFOQlEzUkNPenRSUVVWRUxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdTMEZEZEVJc1EwRkJRenM3U1VGRlJpeE5RVUZOTEZsQlFWa3NSMEZCUnl4TlFVRk5PMUZCUTNaQ0xGZEJRVmNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRTlCUVU4c1JVRkJSU3hMUVVGTExFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTTdTMEZEYUVVc1EwRkJRenM3U1VGRlJpeE5RVUZOTEZkQlFWY3NSMEZCUnl4TlFVRk5PMUZCUTNSQ0xFMUJRVTBzUTBGQlF5eFpRVUZaTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNN1VVRkRha01zVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXp0TFFVTjBRaXhEUVVGRE96dEpRVVZHTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZEYUVNc1NVRkJTU3hKUVVGSkxFdEJRVXNzUzBGQlN5eEZRVUZGT3p0WlFVVm9RaXhOUVVGTkxFZEJRVWM3WjBKQlEwd3NRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUE8yZENRVU5vUWl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVTg3WVVGRGJrSXNRMEZCUXpzN1dVRkZSaXhqUVVGakxFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1owTkJRV2RETEVOQlFVTXNUVUZCVFN4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN08xbEJSVFZITEVsQlFVa3NTVUZCU1N4TFFVRkxMR05CUVdNc1JVRkJSVHM3WjBKQlJYcENMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYlVKQlFXMUNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYjBKQlFXOUNMRVZCUVVVN2IwSkJRek5FTEV0QlFVc3NSMEZCUnl4WlFVRlpMRU5CUVVNN2IwSkJRM0pDTEZsQlFWa3NSVUZCUlN4RFFVRkRPMmxDUVVOc1FpeE5RVUZOTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2JVSkJRVzFDTEVWQlFVVTdiMEpCUTI1RExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdiMEpCUTJJc1dVRkJXU3hGUVVGRkxFTkJRVU03YVVKQlEyeENMRTFCUVUwc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHZRa0ZCYjBJc1JVRkJSVHR2UWtGRGNFTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRwUWtGRGFFSTdZVUZEU2pzN1UwRkZTanRMUVVOS0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4bFFVRmxMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGREwwSXNUVUZCVFN4alFVRmpMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNaME5CUVdkRExFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYkVnc1NVRkJTU3hSUVVGUkxFdEJRVXNzUzBGQlN5eEZRVUZGTzFsQlEzQkNMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEZWQlFWVXNRMEZCUXp0VFFVTndReXhOUVVGTkxFbEJRVWtzU1VGQlNTeExRVUZMTEdOQlFXTXNSVUZCUlR0WlFVTm9ReXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNN1UwRkRhRU1zVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExGTkJRVk1zUTBGQlF6dFRRVU51UXp0TFFVTktMRU5CUVVNN08wbEJSVVlzVFVGQlRTeEpRVUZKTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRjRUlzU1VGQlNTeEpRVUZKTEV0QlFVc3NTMEZCU3l4SlFVRkpMRmxCUVZrc1MwRkJTeXhMUVVGTExFVkJRVVU3T3p0WlFVY3hReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMWxCUXpsRExFMUJRVTBzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNN08xbEJSVGxETEVsQlFVa3NVMEZCVXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hUUVVGVExFZEJRVWNzUlVGQlJTeEZRVUZGTzJkQ1FVTnNReXhMUVVGTExFZEJRVWNzVVVGQlVTeERRVUZETzJkQ1FVTnFRaXhYUVVGWExFVkJRVVVzUTBGQlF6czdaMEpCUldRc1RVRkJUU3g1UWtGQmVVSXNSMEZCUnl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVsQlFVa3NSMEZCUnl4TFFVRkxMR05CUVdNc1EwRkJReXhEUVVGRE8yZENRVU51Uml4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRkxIbENRVUY1UWl4RFFVRkRMRU5CUVVNN1owSkJRemxETEZkQlFWY3NSMEZCUnl4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1lVRkRhRVk3VTBGRFNpeE5RVUZOTEVsQlFVa3NVVUZCVVN4TFFVRkxMRXRCUVVzc1JVRkJSVHRaUVVNelFpeE5RVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEY0VNc1RVRkJUU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFpRVVZ3UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSVEZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNdlF5eGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEyaEdPMHRCUTBvc1EwRkJRenM3U1VGRlJpeE5RVUZOTEdWQlFXVXNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTenRSUVVNdlFpeEpRVUZKTEVsQlFVa3NTMEZCU3l4alFVRmpMRWxCUVVrc1VVRkJVU3hMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU12UXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRjRU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVndReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU03TzFsQlJURkRMRTFCUVUwc1dVRkJXU3hIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRPMmRDUVVOeVF5eEhRVUZITEVWQlFVVXNZMEZCWXp0blFrRkRia0lzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZPMmRDUVVOVUxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlR0aFFVTmFMRU5CUVVNc1EwRkJRenM3V1VGRlNDeE5RVUZOTEZOQlFWTXNSMEZCUnl4SlFVRkpMRWxCUVVrc1dVRkJXU3hIUVVGSExGbEJRVmtzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenM3V1VGRkwwUXNZMEZCWXl4RFFVRkRMRmRCUVZjc1IwRkJSeXhUUVVGVExFTkJRVU03VTBGRE1VTTdPenRSUVVkRUxHTkJRV01zUjBGQlJ5eEpRVUZKTEVOQlFVTTdVVUZEZEVJc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6czdPMUZCUjJJc1YwRkJWeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlEzUkNMRU5CUVVNN096czdPenM3TzBsQlVVWXNTVUZCU1N4blFrRkJaMElzUjBGQlJ5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyaEVMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4alFVRmpMRXRCUVVzN1VVRkRla01zVDBGQlR5eERRVUZETEZWQlFWVXNTMEZCU3p0WlFVTnVRaXhKUVVGSkxGVkJRVlVzU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVU3WjBKQlF6ZERMRTFCUVUwc1EwRkJReXhQUVVGUExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEYWtRc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhEUVVGRExFTkJRVU03WVVGRGVrTTdXVUZEUkN4TlFVRk5MRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzVlVGQlZTeERRVUZETEdOQlFXTXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETVVVc1EwRkJRenRMUVVOTUxFTkJRVU03TzBsQlJVWXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZsQlFWa3NSVUZCUlN4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTNKRkxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFVkJRVVVzWjBKQlFXZENMRU5CUVVNc1EwRkJRenM3U1VGRmRrUXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0UlFVTTNRaXhOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1YwRkJWeXhGUVVGRkxHZENRVUZuUWl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFVXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZkQlFWY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNNVF6czdTVUZGUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExHOUNRVUZ2UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExHMUNRVUZ0UWl4RlFVRkZPMUZCUXpORUxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFVkJRVVVzWlVGQlpTeERRVUZETEVOQlFVTTdTMEZEZWtRN08wbEJSVVFzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEycEZMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4VFFVRlRMRVZCUVVVc1pVRkJaU3hEUVVGRExFTkJRVU03U1VGRGNFUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZWQlFWVXNSVUZCUlN4bFFVRmxMRU5CUVVNc1EwRkJRenREUVVONFJDeERRVUZET3pzN096czdPenRCUVZGR0xFMUJRVTBzV1VGQldTeEhRVUZITEdOQlFXTXNWMEZCVnl4RFFVRkRPenM3T3p0SlFVc3pReXhYUVVGWExFZEJRVWM3VVVGRFZpeExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTlNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eEhRVUZITEdOQlFXTXNRMEZCUXp0UlFVTndReXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYmtRc1RVRkJUU3hOUVVGTkxFZEJRVWNzVVVGQlVTeERRVUZETEdGQlFXRXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVOb1JDeE5RVUZOTEVOQlFVTXNWMEZCVnl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE96dFJRVVV6UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTXhRaXhqUVVGakxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4eFFrRkJjVUlzUTBGQlF5eERRVUZETzFGQlEyaEVMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NWVUZCVlN4RFFVRkRPMWxCUXpkQ0xFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3p0WlFVTnFRaXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMDdXVUZEYmtJc1QwRkJUeXhGUVVGRkxFbEJRVWtzUTBGQlF5eFBRVUZQTzFsQlEzSkNMRlZCUVZVc1JVRkJSU3hKUVVGSkxFTkJRVU1zVlVGQlZUdFRRVU01UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOS0xHZENRVUZuUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3p0SlFVVkVMRmRCUVZjc2EwSkJRV3RDTEVkQlFVYzdVVUZETlVJc1QwRkJUenRaUVVOSUxHVkJRV1U3V1VGRFppeG5Ra0ZCWjBJN1dVRkRhRUlzYjBKQlFXOUNPMWxCUTNCQ0xHdENRVUZyUWp0WlFVTnNRaXhuUTBGQlowTTdXVUZEYUVNc1owTkJRV2RETzFsQlEyaERMQ3RDUVVFclFqdFpRVU12UWl4MVFrRkJkVUk3VTBGRE1VSXNRMEZCUXp0TFFVTk1PenRKUVVWRUxIZENRVUYzUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hSUVVGUkxFVkJRVVVzVVVGQlVTeEZRVUZGTzFGQlF5OURMRTFCUVUwc1RVRkJUU3hIUVVGSExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRha01zVVVGQlVTeEpRVUZKTzFGQlExb3NTMEZCU3l4bFFVRmxMRVZCUVVVN1dVRkRiRUlzVFVGQlRTeExRVUZMTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVU1zVVVGQlVTeEZRVUZGTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hoUVVGaExFTkJRVU1zUTBGQlF6dFpRVU5zUml4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZETVVJc1RVRkJUU3hEUVVGRExGbEJRVmtzUTBGQlF5eGxRVUZsTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkROVU1zVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4blFrRkJaMElzUlVGQlJUdFpRVU51UWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhwUWtGQmFVSXNRMEZCUXl4UlFVRlJMRVZCUVVVc1YwRkJWeXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEdOQlFXTXNRMEZCUXl4RFFVRkRPMWxCUTNCR0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRaUVVNMVFpeE5RVUZOTEVOQlFVTXNXVUZCV1N4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMWxCUXpsRExFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NiMEpCUVc5Q0xFVkJRVVU3V1VGRGRrSXNUVUZCVFN4VlFVRlZMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTXNVVUZCVVN4RlFVRkZMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8xbEJRelZHTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hIUVVGSExGVkJRVlVzUTBGQlF6dFpRVU53UXl4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExHdENRVUZyUWl4RlFVRkZPMWxCUTNKQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEdsQ1FVRnBRaXhEUVVGRExGRkJRVkVzUlVGQlJTeFhRVUZYTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1owSkJRV2RDTEVOQlFVTXNRMEZCUXp0WlFVTjJSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNSMEZCUnl4UFFVRlBMRU5CUVVNN1dVRkRPVUlzVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4blEwRkJaME1zUlVGQlJUdFpRVU51UXl4TlFVRk5MR2RDUVVGblFpeEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eFJRVUZSTEVWQlFVVXNWVUZCVlN4RFFVRkRMRkZCUVZFc1JVRkJSU3huUTBGQlowTXNSVUZCUlN3NFFrRkJPRUlzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUTJ4S0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdXVUZEZGtNc1RVRkJUVHRUUVVOVU8xRkJRMFFzVTBGQlV5eEJRVVZTTzFOQlEwRTdPMUZCUlVRc1YwRkJWeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEzSkNPenRKUVVWRUxHbENRVUZwUWl4SFFVRkhPMUZCUTJoQ0xFbEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhsUVVGbExFVkJRVVVzVFVGQlRUdFpRVU42UXl4bFFVRmxMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzcENMRWxCUVVrc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzJkQ1FVTm1MRmRCUVZjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEY0VRN1UwRkRTaXhEUVVGRExFTkJRVU03TzFGQlJVZ3NTVUZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEdsQ1FVRnBRaXhGUVVGRkxFMUJRVTA3V1VGRE0wTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5xUkN4bFFVRmxMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETjBJc1EwRkJReXhEUVVGRE96czdPMUZCU1Vnc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eEZRVUZGTzFsQlEyaEVMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zVVVGQlVTeERRVUZETEdGQlFXRXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETDBRN1MwRkRTanM3U1VGRlJDeHZRa0ZCYjBJc1IwRkJSenRMUVVOMFFqczdTVUZGUkN4bFFVRmxMRWRCUVVjN1MwRkRha0k3T3pzN096czdTVUZQUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNMVFqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ6dFJRVU5RTEU5QlFVOHNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM0JFT3pzN096czdPMGxCVDBRc1NVRkJTU3h0UWtGQmJVSXNSMEZCUnp0UlFVTjBRaXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU03UzBGRE1VTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEdWQlFXVXNSVUZCUlN4aFFVRmhMRU5CUVVNc1EwRkJRenRMUVVNelJUczdPenM3TzBsQlRVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3huUWtGQlowSXNSVUZCUlN4alFVRmpMRU5CUVVNc1EwRkJRenRMUVVNM1JUczdPenM3TzBsQlRVUXNTVUZCU1N4VlFVRlZMRWRCUVVjN1VVRkRZaXhQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3h2UWtGQmIwSXNSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzB0QlEzSkdPenM3T3pzN08wbEJUMFFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMREJDUVVFd1FpeERRVUZETEVsQlFVa3NSVUZCUlN4clFrRkJhMElzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhEUVVGRE8wdEJRMnBHT3pzN096czdTVUZOUkN4SlFVRkpMRzlDUVVGdlFpeEhRVUZITzFGQlEzWkNMRTlCUVU4c2JVSkJRVzFDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR2REUVVGblF5eEZRVUZGTERoQ1FVRTRRaXhEUVVGRExFTkJRVU03UzBGRGRFYzdPenM3T3p0SlFVMUVMRWxCUVVrc2JVSkJRVzFDTEVkQlFVYzdVVUZEZEVJc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRVZCUVVVc0swSkJRU3RDTEVWQlFVVXNOa0pCUVRaQ0xFTkJRVU1zUTBGQlF6dExRVU53UnpzN096czdPMGxCVFVRc1NVRkJTU3h2UWtGQmIwSXNSMEZCUnp0UlFVTjJRaXhQUVVGUExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3huUTBGQlowTXNSVUZCUlN3NFFrRkJPRUlzUTBGQlF5eERRVUZETzB0QlEzUkhPenM3T3pzN096czdTVUZUUkN4SlFVRkpMRmxCUVZrc1IwRkJSenRSUVVObUxFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxIVkNRVUYxUWl4RlFVRkZMSEZDUVVGeFFpeERRVUZETEVOQlFVTTdTMEZETTBZN096czdPenM3U1VGUFJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTlCUVU4c1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF6dExRVU40UkRzN096czdPenM3T3p0SlFWVkVMRk5CUVZNc1EwRkJReXhOUVVGTkxFZEJRVWNzY1VKQlFYRkNMRVZCUVVVN1VVRkRkRU1zU1VGQlNTeE5RVUZOTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhGUVVGRk8xbEJRek5DTEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUVVVc1EwRkJRenRUUVVOMFFqdFJRVU5FTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVONFF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnBFTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRMUVVOd1FqczdPenM3T3pzN096czdPenM3T3pzN096dEpRVzFDUkN4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFVkJRVVVzUlVGQlJUdFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zVFVGQlRTeFpRVUZaTEUxQlFVMHNSMEZCUnl4TlFVRk5MRWRCUVVjc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTnVSanM3T3pzN096dEpRVTlFTEZOQlFWTXNRMEZCUXl4SFFVRkhMRVZCUVVVN1VVRkRXQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eFZRVUZWTEVsQlFVa3NSMEZCUnl4RFFVRkRMRlZCUVZVc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRE0wTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU42UWp0TFFVTktPenREUVVWS0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03TzBGRGNtcENOMFE3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZGUVRzN096czdRVUZMUVN4TlFVRk5MR0ZCUVdFc1IwRkJSeXhqUVVGakxGZEJRVmNzUTBGQlF6czdPenM3U1VGTE5VTXNWMEZCVnl4SFFVRkhPMUZCUTFZc1MwRkJTeXhGUVVGRkxFTkJRVU03UzBGRFdEczdTVUZGUkN4cFFrRkJhVUlzUjBGQlJ6dFJRVU5vUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSVUZCUlR0WlFVTXhRaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEhGQ1FVRnhRaXhEUVVGRExFTkJRVU03VTBGRE0wTTdPMUZCUlVRc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEVOQlFVTXNTMEZCU3l4TFFVRkxPenRaUVVVdlF5eEpRVUZKTEVOQlFVTXNUMEZCVHp0cFFrRkRVQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMmxDUVVNelF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETzFOQlEyeERMRU5CUVVNc1EwRkJRenRMUVVOT096dEpRVVZFTEc5Q1FVRnZRaXhIUVVGSE8wdEJRM1JDT3pzN096czdPMGxCVDBRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOMlJEdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVVzWVVGQllTeERRVUZETEVOQlFVTTdPMEZETjBRdlJEczdPenM3T3pzN096czdPenM3T3pzN08wRkJhMEpCTEVGQlMwRXNUVUZCVFN4RFFVRkRMR0ZCUVdFc1IwRkJSeXhOUVVGTkxFTkJRVU1zWVVGQllTeEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRkRla1FzVDBGQlR5eEZRVUZGTEU5QlFVODdTVUZEYUVJc1QwRkJUeXhGUVVGRkxGVkJRVlU3U1VGRGJrSXNUMEZCVHl4RlFVRkZMREpDUVVFeVFqdEpRVU53UXl4WlFVRlpMRVZCUVVVc1dVRkJXVHRKUVVNeFFpeE5RVUZOTEVWQlFVVXNUVUZCVFR0SlFVTmtMRk5CUVZNc1JVRkJSU3hUUVVGVE8wbEJRM0JDTEdGQlFXRXNSVUZCUlN4aFFVRmhPME5CUXk5Q0xFTkJRVU1zUTBGQlF5SjkifQ==
