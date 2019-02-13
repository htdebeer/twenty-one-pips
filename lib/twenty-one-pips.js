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
/**
 * @module
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

    /**
     * Add a player to this TopDiceBoard.
     *
     * @param {TopPlayer|Object} config - The player or a configuration of a
     * player to add to this TopDiceBoard.
     *
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcERpZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJUb3BEaWNlQm9hcmQuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgRlVMTF9DSVJDTEVfSU5fREVHUkVFUyA9IDM2MDtcblxuY29uc3QgcmFuZG9taXplQ2VudGVyID0gKG4pID0+IHtcbiAgICByZXR1cm4gKDAuNSA8PSBNYXRoLnJhbmRvbSgpID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbCkuY2FsbCgwLCBuKTtcbn07XG5cbi8vIFByaXZhdGUgZmllbGRzXG5jb25zdCBfd2lkdGggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlaWdodCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29scyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm93cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGljZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGllU2l6ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGlzcGVyc2lvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRlID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmlkTGF5b3V0Q29uZmlndXJhdGlvblxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy53aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoIG9mIHRoaXNcbiAqIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLjtcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuaGVpZ2h0XSAtIFRoZSBtaW5pbWFsIGhlaWdodCBvZlxuICogdGhpcyBHcmlkTGF5b3V0IGluIHBpeGVscy4uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpc3BlcnNpb24gLSBUaGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIG9mIHRoZVxuICogbGF5b3V0IGEgZGllIGNhbiBiZSBsYXlvdXQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAqL1xuXG4vKipcbiAqIEdyaWRMYXlvdXQgaGFuZGxlcyBsYXlpbmcgb3V0IHRoZSBkaWNlIG9uIGEgRGljZUJvYXJkLlxuICovXG5jb25zdCBHcmlkTGF5b3V0ID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0dyaWRMYXlvdXRDb25maWd1cmF0aW9ufSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgR3JpZExheW91dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgZGlzcGVyc2lvbixcbiAgICAgICAgZGllU2l6ZVxuICAgIH0gPSB7fSkge1xuICAgICAgICBfZGljZS5zZXQodGhpcywgW10pO1xuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgMSk7XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIDApO1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICB0aGlzLmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBXaWR0aCA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn0gXG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gX3dpZHRoLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgd2lkdGgodykge1xuICAgICAgICBpZiAoMCA+IHcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFdpZHRoIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7d30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCB3KTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgSGVpZ2h0ID49IDBcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWlnaHQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBoZWlnaHQoaCkge1xuICAgICAgICBpZiAoMCA+IGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYEhlaWdodCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2h9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIGgpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVHcmlkKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgb24gdGhpcyBHcmlkTGF5b3V0LiBUaGlzXG4gICAgICogbnVtYmVyIGlzID49IDAuIFJlYWQgb25seS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IG1heGltdW1OdW1iZXJPZkRpY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb2xzICogdGhpcy5fcm93cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC4gVGhlIGRpc3BlcnNpb24gbGV2ZWxcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBkaWNlIGNhbiBiZSBsYXlvdXQuIFVzZSAxIGZvciBhXG4gICAgICogdGlnaHQgcGFja2VkIGxheW91dC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgRGlzcGVyc2lvbiA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGlzcGVyc2lvbihkKSB7XG4gICAgICAgIGlmICgwID4gZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgRGlzcGVyc2lvbiBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2R9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5zZXQodGhpcywgZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIERpZVNpemUgPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBfZGllU2l6ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpZVNpemUoZHMpIHtcbiAgICAgICAgaWYgKDAgPj0gZHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYGRpZVNpemUgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDEsIGdvdCAnJHtkc30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2RpZVNpemUuc2V0KHRoaXMsIGRzKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgZ2V0IHJvdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgciA9IF9yb3RhdGUuZ2V0KHRoaXMpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkID09PSByID8gdHJ1ZSA6IHI7XG4gICAgfVxuXG4gICAgc2V0IHJvdGF0ZShyKSB7XG4gICAgICAgIF9yb3RhdGUuc2V0KHRoaXMsIHIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2Ygcm93cywgMCA8IHJvd3MuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX3Jvd3MoKSB7XG4gICAgICAgIHJldHVybiBfcm93cy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiBjb2x1bW5zIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiBjb2x1bW5zLCAwIDwgY29sdW1ucy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfY29scygpIHtcbiAgICAgICAgcmV0dXJuIF9jb2xzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2VudGVyIGNlbGwgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY2VudGVyIChyb3csIGNvbCkuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NlbnRlcigpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gcmFuZG9taXplQ2VudGVyKHRoaXMuX3Jvd3MgLyAyKSAtIDE7XG4gICAgICAgIGNvbnN0IGNvbCA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9jb2xzIC8gMikgLSAxO1xuXG4gICAgICAgIHJldHVybiB7cm93LCBjb2x9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExheW91dCBkaWNlIG9uIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOkRpZX5EaWVbXX0gZGljZSAtIFRoZSBkaWNlIHRvIGxheW91dCBvbiB0aGlzIExheW91dC5cbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6RGllfkRpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7bW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvcn5Db25maWd1cmF0aW9uRXJyb3J9IFRoZSBudW1iZXIgb2ZcbiAgICAgKiBkaWNlIHNob3VsZCBub3QgZXhjZWVkIHRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoaXMgTGF5b3V0IGNhblxuICAgICAqIGxheW91dC5cbiAgICAgKi9cbiAgICBsYXlvdXQoZGljZSkge1xuICAgICAgICBpZiAoZGljZS5sZW5ndGggPiB0aGlzLm1heGltdW1OdW1iZXJPZkRpY2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFRoZSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgaXMgJHt0aGlzLm1heGltdW1OdW1iZXJPZkRpY2V9LCBnb3QgJHtkaWNlLmxlbmdodH0gZGljZSBpbnN0ZWFkLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxyZWFkeUxheW91dERpY2UgPSBbXTtcbiAgICAgICAgY29uc3QgZGljZVRvTGF5b3V0ID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgaWYgKGRpZS5oYXNDb29yZGluYXRlcygpICYmIGRpZS5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIC8vIERpY2UgdGhhdCBhcmUgYmVpbmcgaGVsZCBhbmQgaGF2ZSBiZWVuIGxheW91dCBiZWZvcmUgc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0aGVpciBjdXJyZW50IGNvb3JkaW5hdGVzIGFuZCByb3RhdGlvbi4gSW4gb3RoZXIgd29yZHMsXG4gICAgICAgICAgICAgICAgLy8gdGhlc2UgZGljZSBhcmUgc2tpcHBlZC5cbiAgICAgICAgICAgICAgICBhbHJlYWR5TGF5b3V0RGljZS5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY2VUb0xheW91dC5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1pbihkaWNlLmxlbmd0aCAqIHRoaXMuZGlzcGVyc2lvbiwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlQ2VsbHMgPSB0aGlzLl9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZVRvTGF5b3V0KSB7XG4gICAgICAgICAgICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGF2YWlsYWJsZUNlbGxzLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCByYW5kb21DZWxsID0gYXZhaWxhYmxlQ2VsbHNbcmFuZG9tSW5kZXhdO1xuICAgICAgICAgICAgYXZhaWxhYmxlQ2VsbHMuc3BsaWNlKHJhbmRvbUluZGV4LCAxKTtcblxuICAgICAgICAgICAgZGllLmNvb3JkaW5hdGVzID0gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhyYW5kb21DZWxsKTtcbiAgICAgICAgICAgIGRpZS5yb3RhdGlvbiA9IHRoaXMucm90YXRlID8gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogRlVMTF9DSVJDTEVfSU5fREVHUkVFUykgOiBudWxsO1xuICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2RpY2Uuc2V0KHRoaXMsIGFscmVhZHlMYXlvdXREaWNlKTtcblxuICAgICAgICByZXR1cm4gYWxyZWFkeUxheW91dERpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSBhIGxpc3Qgd2l0aCBhdmFpbGFibGUgY2VsbHMgdG8gcGxhY2UgZGljZSBvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXggLSBUaGUgbnVtYmVyIGVtcHR5IGNlbGxzIHRvIGNvbXB1dGUuXG4gICAgICogQHBhcmFtIHtEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgd2l0aCBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge05VbWJlcltdfSBUaGUgbGlzdCBvZiBhdmFpbGFibGUgY2VsbHMgcmVwcmVzZW50ZWQgYnkgdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NvbXB1dGVBdmFpbGFibGVDZWxscyhtYXgsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgbGV0IGxldmVsID0gMDtcbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBNYXRoLm1pbih0aGlzLl9yb3dzLCB0aGlzLl9jb2xzKTtcblxuICAgICAgICB3aGlsZSAoYXZhaWxhYmxlLnNpemUgPCBtYXggJiYgbGV2ZWwgPCBtYXhMZXZlbCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjZWxsIG9mIHRoaXMuX2NlbGxzT25MZXZlbChsZXZlbCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodW5kZWZpbmVkICE9PSBjZWxsICYmIHRoaXMuX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGUuYWRkKGNlbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV2ZWwrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGF2YWlsYWJsZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIGFsbCBjZWxscyBvbiBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbCAtIFRoZSBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC4gMFxuICAgICAqIGluZGljYXRlcyB0aGUgY2VudGVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U2V0PE51bWJlcj59IHRoZSBjZWxscyBvbiB0aGUgbGV2ZWwgaW4gdGhpcyBsYXlvdXQgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGVpciBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbHNPbkxldmVsKGxldmVsKSB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gbmV3IFNldCgpO1xuICAgICAgICBjb25zdCBjZW50ZXIgPSB0aGlzLl9jZW50ZXI7XG5cbiAgICAgICAgaWYgKDAgPT09IGxldmVsKSB7XG4gICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKGNlbnRlcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gY2VudGVyLnJvdyAtIGxldmVsOyByb3cgPD0gY2VudGVyLnJvdyArIGxldmVsOyByb3crKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sIC0gbGV2ZWx9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93LCBjb2w6IGNlbnRlci5jb2wgKyBsZXZlbH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gY2VudGVyLmNvbCAtIGxldmVsICsgMTsgY29sIDwgY2VudGVyLmNvbCArIGxldmVsOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyAtIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93OiBjZW50ZXIucm93ICsgbGV2ZWwsIGNvbH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjZWxscztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIGNlbGwgY29udGFpbiBhIGNlbGwgZnJvbSBhbHJlYWR5TGF5b3V0RGljZT9cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjZWxsIC0gQSBjZWxsIGluIGxheW91dCByZXByZXNlbnRlZCBieSBhIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge0RpZVtdfSBhbHJlYWR5TGF5b3V0RGljZSAtIEEgbGlzdCBvZiBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBjZWxsIGRvZXMgbm90IGNvbnRhaW4gYSBkaWUuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbElzRW1wdHkoY2VsbCwgYWxyZWFkeUxheW91dERpY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gYWxyZWFkeUxheW91dERpY2UuZmluZChkaWUgPT4gY2VsbCA9PT0gdGhpcy5fY29vcmRpbmF0ZXNUb051bWJlcihkaWUuY29vcmRpbmF0ZXMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgbnVtYmVyIHRvIGEgY2VsbCAocm93LCBjb2wpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiAtIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIGEgY2VsbFxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybiB0aGUgY2VsbCAoe3JvdywgY29sfSkgY29ycmVzcG9uZGluZyBuLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX251bWJlclRvQ2VsbChuKSB7XG4gICAgICAgIHJldHVybiB7cm93OiBNYXRoLnRydW5jKG4gLyB0aGlzLl9jb2xzKSwgY29sOiBuICUgdGhpcy5fY29sc307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgdG8gYSBudW1iZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBpdHMgbnVtYmVyLlxuICAgICAqIEByZXR1cm4ge051bWJlcnx1bmRlZmluZWR9IFRoZSBudW1iZXIgY29ycmVzcG9uZGluZyB0byB0aGUgY2VsbC5cbiAgICAgKiBSZXR1cm5zIHVuZGVmaW5lZCB3aGVuIHRoZSBjZWxsIGlzIG5vdCBvbiB0aGUgbGF5b3V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvTnVtYmVyKHtyb3csIGNvbH0pIHtcbiAgICAgICAgaWYgKDAgPD0gcm93ICYmIHJvdyA8IHRoaXMuX3Jvd3MgJiYgMCA8PSBjb2wgJiYgY29sIDwgdGhpcy5fY29scykge1xuICAgICAgICAgICAgcmV0dXJuIHJvdyAqIHRoaXMuX2NvbHMgKyBjb2w7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgY2VsbCByZXByZXNlbnRlZCBieSBpdHMgbnVtYmVyIHRvIHRoZWlyIGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvb3JkaW5hdGVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGlzIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0Nvb3JkaW5hdGVzKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NlbGxUb0Nvb3Jkcyh0aGlzLl9udW1iZXJUb0NlbGwobikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBwYWlyIG9mIGNvb3JkaW5hdGVzIHRvIGEgbnVtYmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkcyAtIFRoZSBjb29yZGluYXRlcyB0byBjb252ZXJ0XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgY29vcmRpbmF0ZXMgY29udmVydGVkIHRvIGEgbnVtYmVyLiBJZlxuICAgICAqIHRoZSBjb29yZGluYXRlcyBhcmUgbm90IG9uIHRoaXMgbGF5b3V0LCB0aGUgbnVtYmVyIGlzIHVuZGVmaW5lZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb29yZGluYXRlc1RvTnVtYmVyKGNvb3Jkcykge1xuICAgICAgICBjb25zdCBuID0gdGhpcy5fY2VsbFRvTnVtYmVyKHRoaXMuX2Nvb3Jkc1RvQ2VsbChjb29yZHMpKTtcbiAgICAgICAgaWYgKDAgPD0gbiAmJiBuIDwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNuYXAgKHgseSkgdG8gdGhlIGNsb3Nlc3QgY2VsbCBpbiB0aGlzIExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkaWVjb29yZGluYXRlIC0gVGhlIGNvb3JkaW5hdGUgdG8gZmluZCB0aGUgY2xvc2VzdCBjZWxsXG4gICAgICogZm9yLlxuICAgICAqIEBwYXJhbSB7RGllfSBbZGllY29vcmRpbmF0LmRpZSA9IG51bGxdIC0gVGhlIGRpZSB0byBzbmFwIHRvLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnggLSBUaGUgeC1jb29yZGluYXRlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnkgLSBUaGUgeS1jb29yZGluYXRlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fG51bGx9IFRoZSBjb29yZGluYXRlIG9mIHRoZSBjZWxsIGNsb3Nlc3QgdG8gKHgsIHkpLlxuICAgICAqIE51bGwgd2hlbiBubyBzdWl0YWJsZSBjZWxsIGlzIG5lYXIgKHgsIHkpXG4gICAgICovXG4gICAgc25hcFRvKHtkaWUgPSBudWxsLCB4LCB5fSkge1xuICAgICAgICBjb25zdCBjb3JuZXJDZWxsID0ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29ybmVyID0gdGhpcy5fY2VsbFRvQ29vcmRzKGNvcm5lckNlbGwpO1xuICAgICAgICBjb25zdCB3aWR0aEluID0gY29ybmVyLnggKyB0aGlzLmRpZVNpemUgLSB4O1xuICAgICAgICBjb25zdCB3aWR0aE91dCA9IHRoaXMuZGllU2l6ZSAtIHdpZHRoSW47XG4gICAgICAgIGNvbnN0IGhlaWdodEluID0gY29ybmVyLnkgKyB0aGlzLmRpZVNpemUgLSB5O1xuICAgICAgICBjb25zdCBoZWlnaHRPdXQgPSB0aGlzLmRpZVNpemUgLSBoZWlnaHRJbjtcblxuICAgICAgICBjb25zdCBxdWFkcmFudHMgPSBbe1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKGNvcm5lckNlbGwpLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoSW4gKiBoZWlnaHRJblxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3csXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93ICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IGNvcm5lckNlbGwuY29sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0T3V0XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0T3V0XG4gICAgICAgIH1dO1xuXG4gICAgICAgIGNvbnN0IHNuYXBUbyA9IHF1YWRyYW50c1xuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgb24gdGhlIGxheW91dFxuICAgICAgICAgICAgLmZpbHRlcigocXVhZHJhbnQpID0+IHVuZGVmaW5lZCAhPT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG5vdCBhbHJlYWR5IHRha2VuIGV4Y2VwdCBieSBpdHNlbGZcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiAoXG4gICAgICAgICAgICAgICAgbnVsbCAhPT0gZGllICYmIHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSA9PT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgICAgICB8fCB0aGlzLl9jZWxsSXNFbXB0eShxdWFkcmFudC5xLCBfZGljZS5nZXQodGhpcykpKVxuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgY292ZXJlZCBieSB0aGUgZGllIHRoZSBtb3N0XG4gICAgICAgICAgICAucmVkdWNlKFxuICAgICAgICAgICAgICAgIChtYXhRLCBxdWFkcmFudCkgPT4gcXVhZHJhbnQuY292ZXJhZ2UgPiBtYXhRLmNvdmVyYWdlID8gcXVhZHJhbnQgOiBtYXhRLFxuICAgICAgICAgICAgICAgIHtxOiB1bmRlZmluZWQsIGNvdmVyYWdlOiAtMX1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCAhPT0gc25hcFRvLnEgPyB0aGlzLl9udW1iZXJUb0Nvb3JkaW5hdGVzKHNuYXBUby5xKSA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBkaWUgYXQgcG9pbnQgKHgsIHkpO1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQb2ludH0gcG9pbnQgLSBUaGUgcG9pbnQgaW4gKHgsIHkpIGNvb3JkaW5hdGVzXG4gICAgICogQHJldHVybiB7RGllfG51bGx9IFRoZSBkaWUgdW5kZXIgY29vcmRpbmF0ZXMgKHgsIHkpIG9yIG51bGwgaWYgbm8gZGllXG4gICAgICogaXMgYXQgdGhlIHBvaW50LlxuICAgICAqL1xuICAgIGdldEF0KHBvaW50ID0ge3g6IDAsIHk6IDB9KSB7XG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIF9kaWNlLmdldCh0aGlzKSkge1xuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb25zdCB4Rml0ID0geCA8PSBwb2ludC54ICYmIHBvaW50LnggPD0geCArIHRoaXMuZGllU2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IHlGaXQgPSB5IDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB5ICsgdGhpcy5kaWVTaXplO1xuXG4gICAgICAgICAgICBpZiAoeEZpdCAmJiB5Rml0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB0aGUgZ3JpZCBzaXplIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgLSBUaGUgbWluaW1hbCBoZWlnaHRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZUdyaWQod2lkdGgsIGhlaWdodCkge1xuICAgICAgICBfY29scy5zZXQodGhpcywgTWF0aC5mbG9vcih3aWR0aCAvIHRoaXMuZGllU2l6ZSkpO1xuICAgICAgICBfcm93cy5zZXQodGhpcywgTWF0aC5mbG9vcihoZWlnaHQgLyB0aGlzLmRpZVNpemUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgKHJvdywgY29sKSBjZWxsIHRvICh4LCB5KSBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY29vcmRpbmF0ZXMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvQ29vcmRzKHtyb3csIGNvbH0pIHtcbiAgICAgICAgcmV0dXJuIHt4OiBjb2wgKiB0aGlzLmRpZVNpemUsIHk6IHJvdyAqIHRoaXMuZGllU2l6ZX07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCAoeCwgeSkgY29vcmRpbmF0ZXMgdG8gYSAocm93LCBjb2wpIGNlbGwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29vcmRpbmF0ZXMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydCB0byBhIGNlbGwuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY29ycmVzcG9uZGluZyBjZWxsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRzVG9DZWxsKHt4LCB5fSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuZXhwb3J0IHtHcmlkTGF5b3V0fTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZSBtaXhpbi9SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuXG4vKlxuICogQ29udmVydCBhbiBIVE1MIGF0dHJpYnV0ZSB0byBhbiBpbnN0YW5jZSdzIHByb3BlcnR5LiBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBhdHRyaWJ1dGUncyBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5J3MgbmFtZS4gRm9yIGV4YW1wbGUsIFwibXktYXR0clwiXG4gKiB3aWxsIGJlIGNvbnZlcnRlZCB0byBcIm15QXR0clwiLCBhbmQgXCJkaXNhYmxlZFwiIHRvIFwiZGlzYWJsZWRcIi5cbiAqL1xuY29uc3QgYXR0cmlidXRlMnByb3BlcnR5ID0gKG5hbWUpID0+IHtcbiAgICBjb25zdCBbZmlyc3QsIC4uLnJlc3RdID0gbmFtZS5zcGxpdChcIi1cIik7XG4gICAgcmV0dXJuIGZpcnN0ICsgcmVzdC5tYXAod29yZCA9PiB3b3JkLnNsaWNlKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKS5qb2luKCk7XG59O1xuXG4vKipcbiAqIE1peGluIHtAbGluayBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc30gdG8gYSBjbGFzcy5cbiAqXG4gKiBAcGFyYW0geyp9IFN1cCAtIFRoZSBjbGFzcyB0byBtaXggaW50by5cbiAqIEByZXR1cm4ge21vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIG1vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzXG4gICAgICovXG4gICAgY2xhc3MgZXh0ZW5kcyBTdXAge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYW4gb2JzZXJ2ZWQgYXR0cmlidXRlJ3MgdmFsdWUgaXNcbiAgICAgICAgICogY2hhbmdlZC4gSWYgdGhlIEhUTUxFbGVtZW50IGlzIGNvbm5lY3RlZCB0byB0aGUgRE9NLCB0aGUgYXR0cmlidXRlXG4gICAgICAgICAqIHZhbHVlIGNhbiBvbmx5IGJlIHNldCB0byB0aGUgY29ycmVzcG9uZGluZyBIVE1MRWxlbWVudCdzIHByb3BlcnR5LlxuICAgICAgICAgKiBJbiBlZmZlY3QsIHRoaXMgbWFrZXMgdGhpcyBIVE1MRWxlbWVudCdzIGF0dHJpYnV0ZXMgcmVhZC1vbmx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgaWYgYW4gSFRNTEVsZW1lbnQgaGFzIGFuIGF0dHJpYnV0ZSBcInhcIiBhbmRcbiAgICAgICAgICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBcInhcIiwgdGhlbiBjaGFuZ2luZyB0aGUgdmFsdWUgXCJ4XCIgdG8gXCI1XCJcbiAgICAgICAgICogd2lsbCBvbmx5IHdvcmsgd2hlbiBgdGhpcy54ID09PSA1YC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG9sZFZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG9sZCB2YWx1ZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG5ldyB2YWx1ZS5cbiAgICAgICAgICovXG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIEFsbCBhdHRyaWJ1dGVzIGFyZSBtYWRlIHJlYWQtb25seSB0byBwcmV2ZW50IGNoZWF0aW5nIGJ5IGNoYW5naW5nXG4gICAgICAgICAgICAvLyB0aGUgYXR0cmlidXRlIHZhbHVlcy4gT2YgY291cnNlLCB0aGlzIGlzIGJ5IG5vXG4gICAgICAgICAgICAvLyBndWFyYW50ZWUgdGhhdCB1c2VycyB3aWxsIG5vdCBjaGVhdCBpbiBhIGRpZmZlcmVudCB3YXkuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IGF0dHJpYnV0ZTJwcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCAmJiBuZXdWYWx1ZSAhPT0gYCR7dGhpc1twcm9wZXJ0eV19YCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIHRoaXNbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbmV4cG9ydCB7XG4gICAgUmVhZE9ubHlBdHRyaWJ1dGVzXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5jb25zdCBWYWxpZGF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRpb25FcnJvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtWYWxpZGF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL1ZhbGlkYXRpb25FcnJvci5qc1wiO1xuXG5jb25zdCBfdmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RlZmF1bHRWYWx1ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZXJyb3JzID0gbmV3IFdlYWtNYXAoKTtcblxuY29uc3QgVHlwZVZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3Rvcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzID0gW119KSB7XG4gICAgICAgIF92YWx1ZS5zZXQodGhpcywgdmFsdWUpO1xuICAgICAgICBfZGVmYXVsdFZhbHVlLnNldCh0aGlzLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICBfZXJyb3JzLnNldCh0aGlzLCBlcnJvcnMpO1xuICAgIH1cblxuICAgIGdldCBvcmlnaW4oKSB7XG4gICAgICAgIHJldHVybiBfdmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMub3JpZ2luIDogX2RlZmF1bHRWYWx1ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IGVycm9ycygpIHtcbiAgICAgICAgcmV0dXJuIF9lcnJvcnMuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBpc1ZhbGlkKCkge1xuICAgICAgICByZXR1cm4gMCA+PSB0aGlzLmVycm9ycy5sZW5ndGg7XG4gICAgfVxuXG4gICAgZGVmYXVsdFRvKG5ld0RlZmF1bHQpIHtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgbmV3RGVmYXVsdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIF9jaGVjayh7cHJlZGljYXRlLCBiaW5kVmFyaWFibGVzID0gW10sIEVycm9yVHlwZSA9IFZhbGlkYXRpb25FcnJvcn0pIHtcbiAgICAgICAgY29uc3QgcHJvcG9zaXRpb24gPSBwcmVkaWNhdGUuYXBwbHkodGhpcywgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgIGlmICghcHJvcG9zaXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yVHlwZSh0aGlzLnZhbHVlLCBiaW5kVmFyaWFibGVzKTtcbiAgICAgICAgICAgIC8vY29uc29sZS53YXJuKGVycm9yLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgUGFyc2VFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFBhcnNlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgSW52YWxpZFR5cGVFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludmFsaWRUeXBlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgSU5URUdFUl9ERUZBVUxUX1ZBTFVFID0gMDtcbmNvbnN0IEludGVnZXJUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IElOVEVHRVJfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkVmFsdWUgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocGFyc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZWRWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgbGFyZ2VyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA+PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNtYWxsZXJUaGFuKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4pID0+IHRoaXMub3JpZ2luIDw9IG4sXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbl1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmV0d2VlbihuLCBtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuLCBtKSA9PiB0aGlzLmxhcmdlclRoYW4obikgJiYgdGhpcy5zbWFsbGVyVGhhbihtKSxcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuLCBtXVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludGVnZXJUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBTVFJJTkdfREVGQVVMVF9WQUxVRSA9IFwiXCI7XG5jb25zdCBTdHJpbmdUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTVFJJTkdfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIG5vdEVtcHR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiBcIlwiICE9PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFN0cmluZ1R5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuLy9pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBDT0xPUl9ERUZBVUxUX1ZBTFVFID0gXCJibGFja1wiO1xuY29uc3QgQ29sb3JUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIENvbG9yVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBCT09MRUFOX0RFRkFVTFRfVkFMVUUgPSBmYWxzZTtcbmNvbnN0IEJvb2xlYW5UeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IEJPT0xFQU5fREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgQm9vbGVhbikge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgvdHJ1ZS9pLnRlc3QoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvZmFsc2UvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGlzVHJ1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gdHJ1ZSA9PT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaXNGYWxzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gZmFsc2UgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgQm9vbGVhblR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7SW50ZWdlclR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0ludGVnZXJUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1N0cmluZ1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1N0cmluZ1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Q29sb3JUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Db2xvclR5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Qm9vbGVhblR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0Jvb2xlYW5UeXBlVmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IFZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBib29sZWFuKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQm9vbGVhblR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIGNvbG9yKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBpbnRlZ2VyKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlclR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIHN0cmluZyhpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmluZ1R5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxufTtcblxuY29uc3QgVmFsaWRhdG9yU2luZ2xldG9uID0gbmV3IFZhbGlkYXRvcigpO1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRvclNpbmdsZXRvbiBhcyB2YWxpZGF0ZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuY29uc3QgVEFHX05BTUUgPSBcInRvcC1kaWVcIjtcblxuY29uc3QgQ0lSQ0xFX0RFR1JFRVMgPSAzNjA7IC8vIGRlZ3JlZXNcbmNvbnN0IE5VTUJFUl9PRl9QSVBTID0gNjsgLy8gRGVmYXVsdCAvIHJlZ3VsYXIgc2l4IHNpZGVkIGRpZSBoYXMgNiBwaXBzIG1heGltdW0uXG5jb25zdCBERUZBVUxUX0NPTE9SID0gXCJJdm9yeVwiO1xuY29uc3QgREVGQVVMVF9YID0gMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfWSA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1JPVEFUSU9OID0gMDsgLy8gZGVncmVlc1xuY29uc3QgREVGQVVMVF9PUEFDSVRZID0gMC41O1xuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBIRUxEX0JZX0FUVFJJQlVURSA9IFwiaGVsZC1ieVwiO1xuY29uc3QgUElQU19BVFRSSUJVVEUgPSBcInBpcHNcIjtcbmNvbnN0IFJPVEFUSU9OX0FUVFJJQlVURSA9IFwicm90YXRpb25cIjtcbmNvbnN0IFhfQVRUUklCVVRFID0gXCJ4XCI7XG5jb25zdCBZX0FUVFJJQlVURSA9IFwieVwiO1xuXG5jb25zdCBCQVNFX0RJRV9TSVpFID0gMTAwOyAvLyBweFxuY29uc3QgQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgPSAxNTsgLy8gcHhcbmNvbnN0IEJBU0VfU1RST0tFX1dJRFRIID0gMi41OyAvLyBweFxuY29uc3QgTUlOX1NUUk9LRV9XSURUSCA9IDE7IC8vIHB4XG5jb25zdCBIQUxGID0gQkFTRV9ESUVfU0laRSAvIDI7IC8vIHB4XG5jb25zdCBUSElSRCA9IEJBU0VfRElFX1NJWkUgLyAzOyAvLyBweFxuY29uc3QgUElQX1NJWkUgPSBCQVNFX0RJRV9TSVpFIC8gMTU7IC8vcHhcbmNvbnN0IFBJUF9DT0xPUiA9IFwiYmxhY2tcIjtcblxuY29uc3QgZGVnMnJhZCA9IChkZWcpID0+IHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufTtcblxuY29uc3QgaXNQaXBOdW1iZXIgPSBuID0+IHtcbiAgICBjb25zdCBudW1iZXIgPSBwYXJzZUludChuLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIobnVtYmVyKSAmJiAxIDw9IG51bWJlciAmJiBudW1iZXIgPD0gTlVNQkVSX09GX1BJUFM7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBvZiBwaXBzIGJldHdlZW4gMSBhbmQgdGhlIE5VTUJFUl9PRl9QSVBTLlxuICpcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEEgcmFuZG9tIG51bWJlciBuLCAxIOKJpCBuIOKJpCBOVU1CRVJfT0ZfUElQUy5cbiAqL1xuY29uc3QgcmFuZG9tUGlwcyA9ICgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE5VTUJFUl9PRl9QSVBTKSArIDE7XG5cbmNvbnN0IERJRV9VTklDT0RFX0NIQVJBQ1RFUlMgPSBbXCLimoBcIixcIuKagVwiLFwi4pqCXCIsXCLimoNcIixcIuKahFwiLFwi4pqFXCJdO1xuXG4vKipcbiAqIENvbnZlcnQgYSB1bmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRpbmcgYSBkaWUgZmFjZSB0byB0aGUgbnVtYmVyIG9mIHBpcHMgb2ZcbiAqIHRoYXQgc2FtZSBkaWUuIFRoaXMgZnVuY3Rpb24gaXMgdGhlIHJldmVyc2Ugb2YgcGlwc1RvVW5pY29kZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdSAtIFRoZSB1bmljb2RlIGNoYXJhY3RlciB0byBjb252ZXJ0IHRvIHBpcHMuXG4gKiBAcmV0dXJucyB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYsIG9yXG4gKiB1bmRlZmluZWQgaWYgdSB3YXMgbm90IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllLlxuICovXG5jb25zdCB1bmljb2RlVG9QaXBzID0gKHUpID0+IHtcbiAgICBjb25zdCBkaWVDaGFySW5kZXggPSBESUVfVU5JQ09ERV9DSEFSQUNURVJTLmluZGV4T2YodSk7XG4gICAgcmV0dXJuIDAgPD0gZGllQ2hhckluZGV4ID8gZGllQ2hhckluZGV4ICsgMSA6IHVuZGVmaW5lZDtcbn07XG5cbi8qKlxuICogQ29udmVydCBhIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXJcbiAqIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb3JyZXNwb25kaW5nIGRpZSBmYWNlLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlXG4gKiBvZiB1bmljb2RlVG9QaXBzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwIC0gVGhlIG51bWJlciBvZiBwaXBzIHRvIGNvbnZlcnQgdG8gYSB1bmljb2RlIGNoYXJhY3Rlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBUaGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlcnMgb3JcbiAqIHVuZGVmaW5lZCBpZiBwIHdhcyBub3QgYmV0d2VlbiAxIGFuZCA2IGluY2x1c2l2ZS5cbiAqL1xuY29uc3QgcGlwc1RvVW5pY29kZSA9IHAgPT4gaXNQaXBOdW1iZXIocCkgPyBESUVfVU5JQ09ERV9DSEFSQUNURVJTW3AgLSAxXSA6IHVuZGVmaW5lZDtcblxuY29uc3QgcmVuZGVySG9sZCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTRVBFUkFUT1IgPSB3aWR0aCAvIDMwO1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuZ2xvYmFsQWxwaGEgPSBERUZBVUxUX09QQUNJVFk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuYXJjKHggKyB3aWR0aCwgeSArIHdpZHRoLCB3aWR0aCAtIFNFUEVSQVRPUiwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlckRpZSA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTQ0FMRSA9ICh3aWR0aCAvIEhBTEYpO1xuICAgIGNvbnN0IEhBTEZfSU5ORVJfU0laRSA9IE1hdGguc3FydCh3aWR0aCAqKiAyIC8gMik7XG4gICAgY29uc3QgSU5ORVJfU0laRSA9IDIgKiBIQUxGX0lOTkVSX1NJWkU7XG4gICAgY29uc3QgUk9VTkRFRF9DT1JORVJfUkFESVVTID0gQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgKiBTQ0FMRTtcbiAgICBjb25zdCBJTk5FUl9TSVpFX1JPVU5ERUQgPSBJTk5FUl9TSVpFIC0gMiAqIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBTVFJPS0VfV0lEVEggPSBNYXRoLm1heChNSU5fU1RST0tFX1dJRFRILCBCQVNFX1NUUk9LRV9XSURUSCAqIFNDQUxFKTtcblxuICAgIGNvbnN0IHN0YXJ0WCA9IHggKyB3aWR0aCAtIEhBTEZfSU5ORVJfU0laRSArIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBzdGFydFkgPSB5ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkU7XG5cbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICBjb250ZXh0LmxpbmVXaWR0aCA9IFNUUk9LRV9XSURUSDtcbiAgICBjb250ZXh0Lm1vdmVUbyhzdGFydFgsIHN0YXJ0WSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMjcwKSwgZGVnMnJhZCgwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMCksIGRlZzJyYWQoOTApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkUpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoOTApLCBkZWcycmFkKDE4MCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCAtIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDE4MCksIGRlZzJyYWQoMjcwKSk7XG5cbiAgICBjb250ZXh0LnN0cm9rZSgpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuY29uc3QgcmVuZGVyUGlwID0gKGNvbnRleHQsIHgsIHksIHdpZHRoKSA9PiB7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFBJUF9DT0xPUjtcbiAgICBjb250ZXh0Lm1vdmVUbyh4LCB5KTtcbiAgICBjb250ZXh0LmFyYyh4LCB5LCB3aWR0aCwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cblxuLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5jb25zdCBfYm9hcmQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbG9yID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWxkQnkgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3BpcHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0aW9uID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF94ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF95ID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBUb3BEaWUgaXMgdGhlIFwidG9wLWRpZVwiIGN1c3RvbSBbSFRNTFxuICogZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50KSByZXByZXNlbnRpbmcgYSBkaWVcbiAqIG9uIHRoZSBkaWNlIGJvYXJkLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWUuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe3BpcHMsIGNvbG9yLCByb3RhdGlvbiwgeCwgeSwgaGVsZEJ5fSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgY29uc3QgcGlwc1ZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihwaXBzIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwc1ZhbHVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHBpcHNWYWx1ZSk7XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHZhbGlkYXRlLmNvbG9yKGNvbG9yIHx8IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfQ09MT1IpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHZhbGlkYXRlLmludGVnZXIocm90YXRpb24gfHwgdGhpcy5nZXRBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDAsIDM2MClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ST1RBVElPTilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnggPSB2YWxpZGF0ZS5pbnRlZ2VyKHggfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLmludGVnZXIoeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1kpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5oZWxkQnkgPSB2YWxpZGF0ZS5zdHJpbmcoaGVsZEJ5IHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoVEFHX05BTUUsIFRvcERpZSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllLFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZSxcbiAgICBUQUdfTkFNRVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuY29uc3QgVEFHX05BTUUgPSBcInRvcC1wbGF5ZXJcIjtcblxuLy8gVGhlIG5hbWVzIG9mIHRoZSAob2JzZXJ2ZWQpIGF0dHJpYnV0ZXMgb2YgdGhlIFRvcFBsYXllci5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IE5BTUVfQVRUUklCVVRFID0gXCJuYW1lXCI7XG5jb25zdCBTQ09SRV9BVFRSSUJVVEUgPSBcInNjb3JlXCI7XG5jb25zdCBIQVNfVFVSTl9BVFRSSUJVVEUgPSBcImhhcy10dXJuXCI7XG5cbi8vIFRoZSBwcml2YXRlIHByb3BlcnRpZXMgb2YgdGhlIFRvcFBsYXllciBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXIgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBuYW1lIGF0dHJpYnV0ZSBhcmUgdHJlYXRlZCBhc1xuICogdGhlIHNhbWUgcGxheWVyLlxuICpcbiAqIEluIGdlbmVyYWwgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCBubyB0d28gcGxheWVycyBkbyBoYXZlIHRoZSBzYW1lIGNvbG9yLFxuICogYWx0aG91Z2ggaXQgaXMgbm90IHVuY29uY2VpdmFibGUgdGhhdCBjZXJ0YWluIGRpY2UgZ2FtZXMgaGF2ZSBwbGF5ZXJzIHdvcmtcbiAqIGluIHRlYW1zIHdoZXJlIGl0IHdvdWxkIG1ha2Ugc2Vuc2UgZm9yIHR3byBvciBtb3JlIGRpZmZlcmVudCBwbGF5ZXJzIHRvXG4gKiBoYXZlIHRoZSBzYW1lIGNvbG9yLlxuICpcbiAqIFRoZSBuYW1lIGFuZCBjb2xvciBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZC4gVGhlIHNjb3JlIGFuZCBoYXMtdHVyblxuICogYXR0cmlidXRlcyBhcmUgbm90LlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wUGxheWVyID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXIsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBwbGF5ZXIgd2l0aCBhIHR1cm5cbiAgICAgKi9cbiAgICBzdGFydFR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6c3RhcnQtdHVyblwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShUQUdfTkFNRSwgVG9wUGxheWVyKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzeXN0ZW0gcGxheWVyLiBEaWNlIGFyZSB0aHJvd24gYnkgYSBwbGF5ZXIuIEZvciBzaXR1YXRpb25zXG4gKiB3aGVyZSB5b3Ugd2FudCB0byByZW5kZXIgYSBidW5jaCBvZiBkaWNlIHdpdGhvdXQgbmVlZGluZyB0aGUgY29uY2VwdCBvZiBQbGF5ZXJzXG4gKiB0aGlzIERFRkFVTFRfU1lTVEVNX1BMQVlFUiBjYW4gYmUgYSBzdWJzdGl0dXRlLiBPZiBjb3Vyc2UsIGlmIHlvdSdkIGxpa2UgdG9cbiAqIGNoYW5nZSB0aGUgbmFtZSBhbmQvb3IgdGhlIGNvbG9yLCBjcmVhdGUgYW5kIHVzZSB5b3VyIG93biBcInN5c3RlbSBwbGF5ZXJcIi5cbiAqIEBjb25zdFxuICovXG5jb25zdCBERUZBVUxUX1NZU1RFTV9QTEFZRVIgPSBuZXcgVG9wUGxheWVyKHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXIsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSLFxuICAgIFRBR19OQU1FXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7REVGQVVMVF9TWVNURU1fUExBWUVSLCBUQUdfTkFNRSBhcyBUT1BfUExBWUVSfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcblxuY29uc3QgVEFHX05BTUUgPSBcInRvcC1wbGF5ZXItbGlzdFwiO1xuXG4vKipcbiAqIFRvcFBsYXllckxpc3QgdG8gZGVzY3JpYmUgdGhlIHBsYXllcnMgaW4gdGhlIGdhbWUuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wUGxheWVyTGlzdCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcFBsYXllckxpc3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICgwID49IHRoaXMucGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoREVGQVVMVF9TWVNURU1fUExBWUVSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcDpzdGFydC10dXJuXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgLy8gT25seSBvbmUgcGxheWVyIGNhbiBoYXZlIGEgdHVybiBhdCBhbnkgZ2l2ZW4gdGltZS5cbiAgICAgICAgICAgIHRoaXMucGxheWVyc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIocCA9PiAhcC5lcXVhbHMoZXZlbnQuZGV0YWlsLnBsYXllcikpXG4gICAgICAgICAgICAgICAgLmZvckVhY2gocCA9PiBwLmVuZFR1cm4oKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIGluIHRoaXMgbGlzdC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFRPUF9QTEFZRVIpXTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFRBR19OQU1FLCBUb3BQbGF5ZXJMaXN0KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXJMaXN0LFxuICAgIFRBR19OQU1FXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtHcmlkTGF5b3V0fSBmcm9tIFwiLi9HcmlkTGF5b3V0LmpzXCI7XG5pbXBvcnQge1RvcERpZX0gZnJvbSBcIi4vVG9wRGllLmpzXCI7XG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUiwgVG9wUGxheWVyfSBmcm9tIFwiLi9Ub3BQbGF5ZXIuanNcIjtcbmltcG9ydCB7VEFHX05BTUUgYXMgVE9QX1BMQVlFUl9MSVNUfSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG5jb25zdCBUQUdfTkFNRSA9IFwidG9wLWRpY2UtYm9hcmRcIjtcblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuY29uc3QgcGFyc2VOdW1iZXIgPSAobnVtYmVyU3RyaW5nLCBkZWZhdWx0TnVtYmVyID0gMCkgPT4ge1xuICAgIGNvbnN0IG51bWJlciA9IHBhcnNlSW50KG51bWJlclN0cmluZywgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNOYU4obnVtYmVyKSA/IGRlZmF1bHROdW1iZXIgOiBudW1iZXI7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIHJldHVybiB2YWxpZGF0ZS5pbnRlZ2VyKG51bWJlclN0cmluZylcbiAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgLmRlZmF1bHRUbyhkZWZhdWx0VmFsdWUpXG4gICAgICAgIC52YWx1ZTtcbn07XG5cbmNvbnN0IGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXIodmFsdWVTdHJpbmcsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG5jb25zdCBnZXRCb29sZWFuID0gKGJvb2xlYW5TdHJpbmcsIHRydWVWYWx1ZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKHRydWVWYWx1ZSA9PT0gYm9vbGVhblN0cmluZyB8fCBcInRydWVcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKFwiZmFsc2VcIiA9PT0gYm9vbGVhblN0cmluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG59O1xuXG5jb25zdCBnZXRCb29sZWFuQXR0cmlidXRlID0gKGVsZW1lbnQsIG5hbWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbih2YWx1ZVN0cmluZywgW3ZhbHVlU3RyaW5nLCBcInRydWVcIl0sIFtcImZhbHNlXCJdLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG59O1xuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbmNvbnN0IF9jYW52YXMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2xheW91dCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY3VycmVudFBsYXllciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbnVtYmVyT2ZSZWFkeURpY2UgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBjb250ZXh0ID0gKGJvYXJkKSA9PiBfY2FudmFzLmdldChib2FyZCkuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG5jb25zdCBnZXRSZWFkeURpY2UgPSAoYm9hcmQpID0+IHtcbiAgICBpZiAodW5kZWZpbmVkID09PSBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKSkge1xuICAgICAgICBfbnVtYmVyT2ZSZWFkeURpY2Uuc2V0KGJvYXJkLCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX251bWJlck9mUmVhZHlEaWNlLmdldChib2FyZCk7XG59O1xuXG5jb25zdCB1cGRhdGVSZWFkeURpY2UgPSAoYm9hcmQsIHVwZGF0ZSkgPT4ge1xuICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIGdldFJlYWR5RGljZShib2FyZCkgKyB1cGRhdGUpO1xufTtcblxuY29uc3QgaXNSZWFkeSA9IChib2FyZCkgPT4gZ2V0UmVhZHlEaWNlKGJvYXJkKSA9PT0gYm9hcmQuZGljZS5sZW5ndGg7XG5cbmNvbnN0IHVwZGF0ZUJvYXJkID0gKGJvYXJkLCBkaWNlID0gYm9hcmQuZGljZSkgPT4ge1xuICAgIGlmIChpc1JlYWR5KGJvYXJkKSkge1xuICAgICAgICBjb250ZXh0KGJvYXJkKS5jbGVhclJlY3QoMCwgMCwgYm9hcmQud2lkdGgsIGJvYXJkLmhlaWdodCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgZGllLnJlbmRlcihjb250ZXh0KGJvYXJkKSwgYm9hcmQuZGllU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbi8vIEludGVyYWN0aW9uIHN0YXRlc1xuY29uc3QgTk9ORSA9IFN5bWJvbChcIm5vX2ludGVyYWN0aW9uXCIpO1xuY29uc3QgSE9MRCA9IFN5bWJvbChcImhvbGRcIik7XG5jb25zdCBNT1ZFID0gU3ltYm9sKFwibW92ZVwiKTtcbmNvbnN0IElOREVURVJNSU5FRCA9IFN5bWJvbChcImluZGV0ZXJtaW5lZFwiKTtcbmNvbnN0IERSQUdHSU5HID0gU3ltYm9sKFwiZHJhZ2dpbmdcIik7XG5cbi8vIE1ldGhvZHMgdG8gaGFuZGxlIGludGVyYWN0aW9uXG5jb25zdCBjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyA9IChjYW52YXMsIHhXaW5kb3csIHlXaW5kb3cpID0+IHtcbiAgICBjb25zdCBjYW52YXNCb3ggPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB4ID0geFdpbmRvdyAtIGNhbnZhc0JveC5sZWZ0ICogKGNhbnZhcy53aWR0aCAvIGNhbnZhc0JveC53aWR0aCk7XG4gICAgY29uc3QgeSA9IHlXaW5kb3cgLSBjYW52YXNCb3gudG9wICogKGNhbnZhcy5oZWlnaHQgLyBjYW52YXNCb3guaGVpZ2h0KTtcblxuICAgIHJldHVybiB7eCwgeX07XG59O1xuXG5jb25zdCBzZXR1cEludGVyYWN0aW9uID0gKGJvYXJkKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gX2NhbnZhcy5nZXQoYm9hcmQpO1xuXG4gICAgLy8gU2V0dXAgaW50ZXJhY3Rpb25cbiAgICBsZXQgb3JpZ2luID0ge307XG4gICAgbGV0IHN0YXRlID0gTk9ORTtcbiAgICBsZXQgc3RhdGljQm9hcmQgPSBudWxsO1xuICAgIGxldCBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgbGV0IGhvbGRUaW1lb3V0ID0gbnVsbDtcblxuICAgIGNvbnN0IGhvbGREaWUgPSAoKSA9PiB7XG4gICAgICAgIGlmIChIT0xEID09PSBzdGF0ZSB8fCBJTkRFVEVSTUlORUQgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICAvLyB0b2dnbGUgaG9sZCAvIHJlbGVhc2VcbiAgICAgICAgICAgIGNvbnN0IHBsYXllcldpdGhBVHVybiA9IGJvYXJkLnF1ZXJ5U2VsZWN0b3IoXCJ0b3AtcGxheWVyLWxpc3QgdG9wLXBsYXllcltoYXMtdHVybl1cIik7XG4gICAgICAgICAgICBpZiAoZGllVW5kZXJDdXJzb3IuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5yZWxlYXNlSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuaG9sZEl0KHBsYXllcldpdGhBVHVybik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZSA9IE5PTkU7XG5cbiAgICAgICAgICAgIHVwZGF0ZUJvYXJkKGJvYXJkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhvbGRUaW1lb3V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RhcnRIb2xkaW5nID0gKCkgPT4ge1xuICAgICAgICBob2xkVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGhvbGREaWUsIGJvYXJkLmhvbGREdXJhdGlvbik7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0b3BIb2xkaW5nID0gKCkgPT4ge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGhvbGRUaW1lb3V0KTtcbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChOT05FID09PSBzdGF0ZSkge1xuXG4gICAgICAgICAgICBvcmlnaW4gPSB7XG4gICAgICAgICAgICAgICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICB5OiBldmVudC5jbGllbnRZXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkaWVVbmRlckN1cnNvciA9IGJvYXJkLmxheW91dC5nZXRBdChjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyhjYW52YXMsIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcblxuICAgICAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBpbnRlcmFjdGlvbiB3aXRoIHRoZSBib2FyZCB2aWEgYSBkaWVcbiAgICAgICAgICAgICAgICBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UgJiYgIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gSU5ERVRFUk1JTkVEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZEhvbGRpbmdEaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gSE9MRDtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRIb2xkaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBNT1ZFO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHNob3dJbnRlcmFjdGlvbiA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBkaWVVbmRlckN1cnNvciA9IGJvYXJkLmxheW91dC5nZXRBdChjb252ZXJ0V2luZG93Q29vcmRpbmF0ZXNUb0NhbnZhcyhjYW52YXMsIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcbiAgICAgICAgaWYgKERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZ3JhYmJpbmdcIjtcbiAgICAgICAgfSBlbHNlIGlmIChudWxsICE9PSBkaWVVbmRlckN1cnNvcikge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZ3JhYlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE1PVkUgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiBhIGRpZSBpcyB1bmRlciB0aGUgY3Vyc29yXG4gICAgICAgICAgICAvLyBJZ25vcmUgc21hbGwgbW92ZW1lbnRzXG4gICAgICAgICAgICBjb25zdCBkeCA9IE1hdGguYWJzKG9yaWdpbi54IC0gZXZlbnQuY2xpZW50WCk7XG4gICAgICAgICAgICBjb25zdCBkeSA9IE1hdGguYWJzKG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WSk7XG5cbiAgICAgICAgICAgIGlmIChNSU5fREVMVEEgPCBkeCB8fCBNSU5fREVMVEEgPCBkeSkge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gRFJBR0dJTkc7XG4gICAgICAgICAgICAgICAgc3RvcEhvbGRpbmcoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRpY2VXaXRob3V0RGllVW5kZXJDdXJzb3IgPSBib2FyZC5kaWNlLmZpbHRlcihkaWUgPT4gZGllICE9PSBkaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQsIGRpY2VXaXRob3V0RGllVW5kZXJDdXJzb3IpO1xuICAgICAgICAgICAgICAgIHN0YXRpY0JvYXJkID0gY29udGV4dChib2FyZCkuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjb25zdCBkeCA9IG9yaWdpbi54IC0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gb3JpZ2luLnkgLSBldmVudC5jbGllbnRZO1xuXG4gICAgICAgICAgICBjb25zdCB7eCwgeX0gPSBkaWVVbmRlckN1cnNvci5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29udGV4dChib2FyZCkucHV0SW1hZ2VEYXRhKHN0YXRpY0JvYXJkLCAwLCAwKTtcbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbmRlcihjb250ZXh0KGJvYXJkKSwgYm9hcmQuZGllU2l6ZSwge3g6IHggLSBkeCwgeTogeSAtIGR5fSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChudWxsICE9PSBkaWVVbmRlckN1cnNvciAmJiBEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb25zdCBzbmFwVG9Db29yZHMgPSBib2FyZC5sYXlvdXQuc25hcFRvKHtcbiAgICAgICAgICAgICAgICBkaWU6IGRpZVVuZGVyQ3Vyc29yLFxuICAgICAgICAgICAgICAgIHg6IHggLSBkeCxcbiAgICAgICAgICAgICAgICB5OiB5IC0gZHksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgbmV3Q29vcmRzID0gbnVsbCAhPSBzbmFwVG9Db29yZHMgPyBzbmFwVG9Db29yZHMgOiB7eCwgeX07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzID0gbmV3Q29vcmRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgc3RhdGVcbiAgICAgICAgZGllVW5kZXJDdXJzb3IgPSBudWxsO1xuICAgICAgICBzdGF0ZSA9IE5PTkU7XG5cbiAgICAgICAgLy8gUmVmcmVzaCBib2FyZDsgUmVuZGVyIGRpY2VcbiAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgIH07XG5cblxuICAgIC8vIFJlZ2lzdGVyIHRoZSBhY3R1YWwgZXZlbnQgbGlzdGVuZXJzIGRlZmluZWQgYWJvdmUuIE1hcCB0b3VjaCBldmVudHMgdG9cbiAgICAvLyBlcXVpdmFsZW50IG1vdXNlIGV2ZW50cy4gQmVjYXVzZSB0aGUgXCJ0b3VjaGVuZFwiIGV2ZW50IGRvZXMgbm90IGhhdmUgYVxuICAgIC8vIGNsaWVudFggYW5kIGNsaWVudFksIHJlY29yZCBhbmQgdXNlIHRoZSBsYXN0IG9uZXMgZnJvbSB0aGUgXCJ0b3VjaG1vdmVcIlxuICAgIC8vIChvciBcInRvdWNoc3RhcnRcIikgZXZlbnRzLlxuXG4gICAgbGV0IHRvdWNoQ29vcmRpbmF0ZXMgPSB7Y2xpZW50WDogMCwgY2xpZW50WTogMH07XG4gICAgY29uc3QgdG91Y2gybW91c2VFdmVudCA9IChtb3VzZUV2ZW50TmFtZSkgPT4ge1xuICAgICAgICByZXR1cm4gKHRvdWNoRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0b3VjaEV2ZW50ICYmIDAgPCB0b3VjaEV2ZW50LnRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qge2NsaWVudFgsIGNsaWVudFl9ID0gdG91Y2hFdmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgIHRvdWNoQ29vcmRpbmF0ZXMgPSB7Y2xpZW50WCwgY2xpZW50WX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYW52YXMuZGlzcGF0Y2hFdmVudChuZXcgTW91c2VFdmVudChtb3VzZUV2ZW50TmFtZSwgdG91Y2hDb29yZGluYXRlcykpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlZG93blwiKSk7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgc3RhcnRJbnRlcmFjdGlvbik7XG5cbiAgICBpZiAoIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlKSB7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZW1vdmVcIikpO1xuICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3ZlKTtcbiAgICB9XG5cbiAgICBpZiAoIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlIHx8ICFib2FyZC5kaXNhYmxlZEhvbGRpbmdEaWNlKSB7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHNob3dJbnRlcmFjdGlvbik7XG4gICAgfVxuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2V1cFwiKSk7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHN0b3BJbnRlcmFjdGlvbik7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCBzdG9wSW50ZXJhY3Rpb24pO1xufTtcblxuLyoqXG4gKiBUb3BEaWNlQm9hcmQgaXMgYSBjdXN0b20gSFRNTCBlbGVtZW50IHRvIHJlbmRlciBhbmQgY29udHJvbCBhXG4gKiBkaWNlIGJvYXJkLiBcbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICovXG5jb25zdCBUb3BEaWNlQm9hcmQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWNlQm9hcmQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiBcImNsb3NlZFwifSk7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgICAgIF9jYW52YXMuc2V0KHRoaXMsIGNhbnZhcyk7XG4gICAgICAgIF9jdXJyZW50UGxheWVyLnNldCh0aGlzLCBERUZBVUxUX1NZU1RFTV9QTEFZRVIpO1xuICAgICAgICBfbGF5b3V0LnNldCh0aGlzLCBuZXcgR3JpZExheW91dCh7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICBkaWVTaXplOiB0aGlzLmRpZVNpemUsXG4gICAgICAgICAgICBkaXNwZXJzaW9uOiB0aGlzLmRpc3BlcnNpb25cbiAgICAgICAgfSkpO1xuICAgICAgICBzZXR1cEludGVyYWN0aW9uKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgV0lEVEhfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEVJR0hUX0FUVFJJQlVURSxcbiAgICAgICAgICAgIERJU1BFUlNJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgRElFX1NJWkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgRFJBR0dJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gX2NhbnZhcy5nZXQodGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlIFdJRFRIX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfV0lEVEgpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoV0lEVEhfQVRUUklCVVRFLCB3aWR0aCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEhFSUdIVF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9IRUlHSFQpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShIRUlHSFRfQVRUUklCVVRFLCBoZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBESVNQRVJTSU9OX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGlzcGVyc2lvbiA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBESUVfU0laRV9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpZVNpemUgPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfRElFX1NJWkUpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGllU2l6ZSA9IGRpZVNpemU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNhYmxlZFJvdGF0aW9uID0gdmFsaWRhdGUuYm9vbGVhbihuZXdWYWx1ZSwgZ2V0Qm9vbGVhbihvbGRWYWx1ZSwgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCkpLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQucm90YXRlID0gIWRpc2FibGVkUm90YXRpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAvLyBUaGUgdmFsdWUgaXMgZGV0ZXJtaW5lZCB3aGVuIHVzaW5nIHRoZSBnZXR0ZXJcbiAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQm9hcmQodGhpcyk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6YWRkZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlUmVhZHlEaWNlKHRoaXMsIDEpO1xuICAgICAgICAgICAgaWYgKGlzUmVhZHkodGhpcykpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6cmVtb3ZlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgLTEpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGwgZGljZSBib2FyZHMgZG8gaGF2ZSBhIHBsYXllciBsaXN0LiBJZiB0aGVyZSBpc24ndCBvbmUgeWV0LFxuICAgICAgICAvLyBjcmVhdGUgb25lLlxuICAgICAgICBpZiAobnVsbCA9PT0gdGhpcy5xdWVyeVNlbGVjdG9yKFwidG9wLXBsYXllci1saXN0XCIpKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0b3AtcGxheWVyLWxpc3RcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgYWRvcHRlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBHcmlkTGF5b3V0IHVzZWQgYnkgdGhpcyBEaWNlQm9hcmQgdG8gbGF5b3V0IHRoZSBkaWNlLlxuICAgICAqXG4gICAgICogQHR5cGUge0dyaWRMYXlvdXR9XG4gICAgICovXG4gICAgZ2V0IGxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuIE5vdGUsIHRvIGFjdHVhbGx5IHRocm93IHRoZSBkaWNlIHVzZVxuICAgICAqIHtAbGluayB0aHJvd0RpY2V9LiBcbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BEaWVbXX1cbiAgICAgKi9cbiAgICBnZXQgZGljZSgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidG9wLWRpZVwiKV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgcHV0IG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlLCAwIDwgbWF4aW11bS5cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0Lm1heGltdW1OdW1iZXJPZkRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIFdJRFRIX0FUVFJJQlVURSwgREVGQVVMVF9XSURUSCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhFSUdIVF9BVFRSSUJVVEUsIERFRkFVTFRfSEVJR0hUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESVNQRVJTSU9OX0FUVFJJQlVURSwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElFX1NJWkVfQVRUUklCVVRFLCBERUZBVUxUX0RJRV9TSVpFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGRyYWdnZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkRHJhZ2dpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGhlbGQgYnkgYSBQbGF5ZXI/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkSG9sZGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyByb3RhdGluZyBkaWNlIG9uIHRoaXMgYm9hcmQgZGlzYWJsZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkUm90YXRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZHVyYXRpb24gaW4gbXMgdG8gcHJlc3MgdGhlIG1vdXNlIC8gdG91Y2ggYSBkaWUgYmVmb3JlIGl0IGJla29tZXNcbiAgICAgKiBoZWxkIGJ5IHRoZSBQbGF5ZXIuIEl0IGhhcyBvbmx5IGFuIGVmZmVjdCB3aGVuIHRoaXMuaG9sZGFibGVEaWNlID09PVxuICAgICAqIHRydWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBob2xkRHVyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSwgREVGQVVMVF9IT0xEX0RVUkFUSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgVG9wUGxheWVyTGlzdCBlbGVtZW50IG9mIHRoaXMgVG9wRGljZUJvYXJkLiBJZiBpdCBkb2VzIG5vdCBleGlzdCxcbiAgICAgKiBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyTGlzdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfcGxheWVyTGlzdCgpIHtcbiAgICAgICAgbGV0IHBsYXllckxpc3QgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoVE9QX1BMQVlFUl9MSVNUKTtcbiAgICAgICAgaWYgKG51bGwgPT09IHBsYXllckxpc3QpIHtcbiAgICAgICAgICAgIHBsYXllckxpc3QgPSB0aGlzLmFwcGVuZENoaWxkKFRPUF9QTEFZRVJfTElTVCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGxheWVyTGlzdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBwbGF5aW5nIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wUGxheWVyW119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wbGF5ZXJMaXN0LnBsYXllcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXMgcGxheWVyLCB0aHJvdyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVJdIC0gVGhlXG4gICAgICogcGxheWVyIHRoYXQgaXMgdGhyb3dpbmcgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgdGhyb3duIGRpY2Ugb24gdGhpcyBib2FyZC4gVGhpcyBsaXN0IG9mIGRpY2UgaXMgdGhlIHNhbWUgYXMgdGhpcyBUb3BEaWNlQm9hcmQncyB7QHNlZSBkaWNlfSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHRocm93RGljZShwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVIpIHtcbiAgICAgICAgaWYgKHBsYXllciAmJiAhcGxheWVyLmhhc1R1cm4pIHtcbiAgICAgICAgICAgIHBsYXllci5zdGFydFR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpY2UuZm9yRWFjaChkaWUgPT4gZGllLnRocm93SXQoKSk7XG4gICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGljZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaWUgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZXxPYmplY3R9IFtjb25maWcgPSB7fV0gLSBUaGUgZGllIG9yIGEgY29uZmlndXJhdGlvbiBvZlxuICAgICAqIHRoZSBkaWUgdG8gYWRkIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfG51bGx9IFtjb25maWcucGlwc10gLSBUaGUgcGlwcyBvZiB0aGUgZGllIHRvIGFkZC5cbiAgICAgKiBJZiBubyBwaXBzIGFyZSBzcGVjaWZpZWQgb3IgdGhlIHBpcHMgYXJlIG5vdCBiZXR3ZWVuIDEgYW5kIDYsIGEgcmFuZG9tXG4gICAgICogbnVtYmVyIGJldHdlZW4gMSBhbmQgNiBpcyBnZW5lcmF0ZWQgaW5zdGVhZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2NvbmZpZy5jb2xvcl0gLSBUaGUgY29sb3Igb2YgdGhlIGRpZSB0byBhZGQuIERlZmF1bHRcbiAgICAgKiB0byB0aGUgZGVmYXVsdCBjb2xvci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24gb2YgdGhlIGRpZS5cbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gW2hlbGRCeV0gLSBUaGUgcGxheWVyIGhvbGRpbmcgdGhlIGRpZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcERpZX0gVGhlIGFkZGVkIGRpZS5cbiAgICAgKi9cbiAgICBhZGREaWUoY29uZmlnID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kQ2hpbGQoY29uZmlnIGluc3RhbmNlb2YgVG9wRGllID8gY29uZmlnIDogbmV3IFRvcERpZShjb25maWcpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZGllIGZyb20gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcERpZX0gZGllIC0gVGhlIGRpZSB0byByZW1vdmUgZnJvbSB0aGlzIGJvYXJkLlxuICAgICAqL1xuICAgIHJlbW92ZURpZShkaWUpIHtcbiAgICAgICAgaWYgKGRpZS5wYXJlbnROb2RlICYmIGRpZS5wYXJlbnROb2RlID09PSB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGRpZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBwbGF5ZXIgdG8gdGhpcyBUb3BEaWNlQm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcnxPYmplY3R9IGNvbmZpZyAtIFRoZSBwbGF5ZXIgb3IgYSBjb25maWd1cmF0aW9uIG9mIGFcbiAgICAgKiBwbGF5ZXIgdG8gYWRkIHRvIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIEVycm9yIHdoZW4gdGhlIHBsYXllciB0byBhZGQgY29uZmxpY3RzIHdpdGggYSBwcmUtZXhpc3RpbmdcbiAgICAgKiBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBhZGRlZCBwbGF5ZXIuXG4gICAgICovXG4gICAgYWRkUGxheWVyKGNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wbGF5ZXJMaXN0LmFwcGVuZENoaWxkKGNvbmZpZyBpbnN0YW5jZW9mIFRvcFBsYXllciA/IGNvbmZpZyA6IG5ldyBUb3BQbGF5ZXIoY29uZmlnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYXllciBmcm9tIHRoaXMgVG9wRGljZUJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IHBsYXllciAtIFRoZSBwbGF5ZXIgdG8gcmVtb3ZlIGZyb20gdGhpcyBib2FyZC5cbiAgICAgKi9cbiAgICByZW1vdmVQbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIGlmIChwbGF5ZXIucGFyZW50Tm9kZSAmJiBwbGF5ZXIucGFyZW50Tm9kZSA9PT0gdGhpcy5fcGxheWVyTGlzdCkge1xuICAgICAgICAgICAgdGhpcy5fcGxheWVyTGlzdC5yZW1vdmVDaGlsZChwbGF5ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFRBR19OQU1FLCBUb3BEaWNlQm9hcmQpO1xuXG5leHBvcnQge1xuICAgIFRvcERpY2VCb2FyZCxcbiAgICBERUZBVUxUX0RJRV9TSVpFLFxuICAgIERFRkFVTFRfSE9MRF9EVVJBVElPTixcbiAgICBERUZBVUxUX1dJRFRILFxuICAgIERFRkFVTFRfSEVJR0hULFxuICAgIERFRkFVTFRfRElTUEVSU0lPTixcbiAgICBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQsXG4gICAgVEFHX05BTUVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuaW1wb3J0IHtUb3BEaWNlQm9hcmR9IGZyb20gXCIuL1RvcERpY2VCb2FyZC5qc1wiO1xuaW1wb3J0IHtUb3BEaWV9IGZyb20gXCIuL1RvcERpZS5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJ9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJMaXN0fSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5cbndpbmRvdy50d2VudHlvbmVwaXBzID0gd2luZG93LnR3ZW50eW9uZXBpcHMgfHwgT2JqZWN0LmZyZWV6ZSh7XG4gICAgVkVSU0lPTjogXCIwLjAuMVwiLFxuICAgIExJQ0VOU0U6IFwiTEdQTC0zLjBcIixcbiAgICBXRUJTSVRFOiBcImh0dHBzOi8vdHdlbnR5b25lcGlwcy5vcmdcIixcbiAgICBUb3BEaWNlQm9hcmQ6IFRvcERpY2VCb2FyZCxcbiAgICBUb3BEaWU6IFRvcERpZSxcbiAgICBUb3BQbGF5ZXI6IFRvcFBsYXllcixcbiAgICBUb3BQbGF5ZXJMaXN0OiBUb3BQbGF5ZXJMaXN0XG59KTtcbiJdLCJuYW1lcyI6WyJUQUdfTkFNRSIsInZhbGlkYXRlIiwiQ09MT1JfQVRUUklCVVRFIiwiX2NvbG9yIiwiVE9QX1BMQVlFUiIsIlRPUF9QTEFZRVJfTElTVCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxLQUFLLENBQUM7Ozs7Ozs7O0lBUTNDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xCO0NBQ0o7O0FDeENEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUE7Ozs7QUFJQSxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEtBQUs7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7O0FBR0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxP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QUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FB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LFlBQVksU0FBUyxHQUFHLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3JHOzs7Ozs7O0lBT0QsWUFBWSxDQUFDLE1BQU0sRUFBRTtRQUNqQixJQUFJLE1BQU0sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQzdELElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDO0tBQ0o7O0NBRUosQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQ0wsV0FBUSxFQUFFLFlBQVksQ0FBQyxDQUFDOztBQzlsQnJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFLQSxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6RCxPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsVUFBVTtJQUNuQixPQUFPLEVBQUUsMkJBQTJCO0lBQ3BDLFlBQVksRUFBRSxZQUFZO0lBQzFCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsYUFBYSxFQUFFLGFBQWE7Q0FDL0IsQ0FBQyxDQUFDIiwicHJlRXhpc3RpbmdDb21tZW50IjoiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqcHVkV3hzTENKemIzVnlZMlZ6SWpwYklpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZSM0pwWkV4aGVXOTFkQzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlZtRnNhV1JoZEdsdmJrVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OTJZV3hwWkdGMFpTOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZkbUZzYVdSaGRHVXZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDFSdmNFUnBaUzVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTlVYjNCUWJHRjVaWEl1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1VHeGhlV1Z5VEdsemRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OVViM0JFYVdObFFtOWhjbVF1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMbXB6SWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1WEc0dktpcGNiaUFxSUVCdGIyUjFiR1ZjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRVZ5Y205eVhHNGdLaTljYm1OdmJuTjBJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdSWEp5YjNJZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCM2FYUm9JRzFsYzNOaFoyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JXVnpjMkZuWlNBdElGUm9aU0J0WlhOellXZGxJR0Z6YzI5amFXRjBaV1FnZDJsMGFDQjBhR2x6WEc0Z0lDQWdJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0cxbGMzTmhaMlVwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYldWemMyRm5aU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNiaThxS2x4dUlDb2dRRzF2WkhWc1pWeHVJQ292WEc1Y2JtTnZibk4wSUVaVlRFeGZRMGxTUTB4RlgwbE9YMFJGUjFKRlJWTWdQU0F6TmpBN1hHNWNibU52Ym5OMElISmhibVJ2YldsNlpVTmxiblJsY2lBOUlDaHVLU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJQ2d3TGpVZ1BEMGdUV0YwYUM1eVlXNWtiMjBvS1NBL0lFMWhkR2d1Wm14dmIzSWdPaUJOWVhSb0xtTmxhV3dwTG1OaGJHd29NQ3dnYmlrN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElHWnBaV3hrYzF4dVkyOXVjM1FnWDNkcFpIUm9JRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9aV2xuYUhRZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJOdmJITWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzSnZkM01nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwWTJVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScFpWTnBlbVVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlJwYzNCbGNuTnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZEdGMFpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNiaThxS2x4dUlDb2dRSFI1Y0dWa1pXWWdlMDlpYW1WamRIMGdSM0pwWkV4aGVXOTFkRU52Ym1acFozVnlZWFJwYjI1Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VkMmxrZEdnZ0xTQlVhR1VnYldsdWFXMWhiQ0IzYVdSMGFDQnZaaUIwYUdselhHNGdLaUJIY21sa1RHRjViM1YwSUdsdUlIQnBlR1ZzY3k0N1hHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbWhsYVdkb2RGMGdMU0JVYUdVZ2JXbHVhVzFoYkNCb1pXbG5hSFFnYjJaY2JpQXFJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDQnBiaUJ3YVhobGJITXVMbHh1SUNvZ1FIQnliM0JsY25SNUlIdE9kVzFpWlhKOUlHTnZibVpwWnk1a2FYTndaWEp6YVc5dUlDMGdWR2hsSUdScGMzUmhibU5sSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVmNiaUFxSUd4aGVXOTFkQ0JoSUdScFpTQmpZVzRnWW1VZ2JHRjViM1YwTGx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NWthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnS2k5Y2JseHVMeW9xWEc0Z0tpQkhjbWxrVEdGNWIzVjBJR2hoYm1Sc1pYTWdiR0Y1YVc1bklHOTFkQ0IwYUdVZ1pHbGpaU0J2YmlCaElFUnBZMlZDYjJGeVpDNWNiaUFxTDF4dVkyOXVjM1FnUjNKcFpFeGhlVzkxZENBOUlHTnNZWE56SUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRIY21sa1RHRjViM1YwUTI5dVptbG5kWEpoZEdsdmJuMGdZMjl1Wm1sbklDMGdWR2hsSUdOdmJtWnBaM1Z5WVhScGIyNGdiMllnZEdobElFZHlhV1JNWVhsdmRYUmNiaUFnSUNBZ0tpOWNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaDdYRzRnSUNBZ0lDQWdJSGRwWkhSb0xGeHVJQ0FnSUNBZ0lDQm9aV2xuYUhRc1hHNGdJQ0FnSUNBZ0lHUnBjM0JsY25OcGIyNHNYRzRnSUNBZ0lDQWdJR1JwWlZOcGVtVmNiaUFnSUNCOUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ1gyUnBZMlV1YzJWMEtIUm9hWE1zSUZ0ZEtUdGNiaUFnSUNBZ0lDQWdYMlJwWlZOcGVtVXVjMlYwS0hSb2FYTXNJREVwTzF4dUlDQWdJQ0FnSUNCZmQybGtkR2d1YzJWMEtIUm9hWE1zSURBcE8xeHVJQ0FnSUNBZ0lDQmZhR1ZwWjJoMExuTmxkQ2gwYUdsekxDQXdLVHRjYmlBZ0lDQWdJQ0FnWDNKdmRHRjBaUzV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVdWVGFYcGxJRDBnWkdsbFUybDZaVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNhV1IwYUNBOUlIZHBaSFJvTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZDJsa2RHZ2dhVzRnY0dsNFpXeHpJSFZ6WldRZ1lua2dkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ2JXOWtkV3hsT21WeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lnVjJsa2RHZ2dQajBnTUZ4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlJRnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0IzYVdSMGFDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjkzYVdSMGFDNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyVjBJSGRwWkhSb0tIY3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQaUIzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCWGFXUjBhQ0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Dd2daMjkwSUNja2UzZDlKeUJwYm5OMFpXRmtMbUFwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lGOTNhV1IwYUM1elpYUW9kR2hwY3l3Z2R5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCb1pXbG5hSFFnYVc0Z2NHbDRaV3h6SUhWelpXUWdZbmtnZEdocGN5QkhjbWxrVEdGNWIzVjBMaUJjYmlBZ0lDQWdLaUJBZEdoeWIzZHpJRzF2WkhWc1pUcGxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdVEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUlFaGxhV2RvZENBK1BTQXdYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXbG5hSFFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmFHVnBaMmgwTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WlhRZ2FHVnBaMmgwS0dncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BpQm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlLR0JJWldsbmFIUWdjMmh2ZFd4a0lHSmxJR0VnYm5WdFltVnlJR3hoY21kbGNpQjBhR0Z1SURBc0lHZHZkQ0FuSkh0b2ZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCZmFHVnBaMmgwTG5ObGRDaDBhR2x6TENCb0tUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1ZlkyRnNZM1ZzWVhSbFIzSnBaQ2gwYUdsekxuZHBaSFJvTENCMGFHbHpMbWhsYVdkb2RDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVWdkR2hoZENCallXNGdZbVVnYkdGNWIzVjBJRzl1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnVkdocGMxeHVJQ0FnSUNBcUlHNTFiV0psY2lCcGN5QStQU0F3TGlCU1pXRmtJRzl1YkhrdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTI5c2N5QXFJSFJvYVhNdVgzSnZkM003WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHUnBjM0JsY25OcGIyNGdiR1YyWld3Z2RYTmxaQ0JpZVNCMGFHbHpJRWR5YVdSTVlYbHZkWFF1SUZSb1pTQmthWE53WlhKemFXOXVJR3hsZG1Wc1hHNGdJQ0FnSUNvZ2FXNWthV05oZEdWeklIUm9aU0JrYVhOMFlXNWpaU0JtY205dElIUm9aU0JqWlc1MFpYSWdaR2xqWlNCallXNGdZbVVnYkdGNWIzVjBMaUJWYzJVZ01TQm1iM0lnWVZ4dUlDQWdJQ0FxSUhScFoyaDBJSEJoWTJ0bFpDQnNZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRHaHliM2R6SUcxdlpIVnNaVHBsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlJRVJwYzNCbGNuTnBiMjRnUGowZ01GeHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScGMzQmxjbk5wYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZaR2x6Y0dWeWMybHZiaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUdScGMzQmxjbk5wYjI0b1pDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStJR1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUVScGMzQmxjbk5wYjI0Z2MyaHZkV3hrSUdKbElHRWdiblZ0WW1WeUlHeGhjbWRsY2lCMGFHRnVJREFzSUdkdmRDQW5KSHRrZlNjZ2FXNXpkR1ZoWkM1Z0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMlJwYzNCbGNuTnBiMjR1YzJWMEtIUm9hWE1zSUdRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J6YVhwbElHOW1JR0VnWkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCdGIyUjFiR1U2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMa052Ym1acFozVnlZWFJwYjI1RmNuSnZjaUJFYVdWVGFYcGxJRDQ5SURCY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVdWVGFYcGxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJScFpWTnBlbVV1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCa2FXVlRhWHBsS0dSektTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lENDlJR1J6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCa2FXVlRhWHBsSUhOb2IzVnNaQ0JpWlNCaElHNTFiV0psY2lCc1lYSm5aWElnZEdoaGJpQXhMQ0JuYjNRZ0p5UjdaSE45SnlCcGJuTjBaV0ZrTG1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJRjlrYVdWVGFYcGxMbk5sZENoMGFHbHpMQ0JrY3lrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WDJOaGJHTjFiR0YwWlVkeWFXUW9kR2hwY3k1M2FXUjBhQ3dnZEdocGN5NW9aV2xuYUhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdkbGRDQnliM1JoZEdVb0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElISWdQU0JmY205MFlYUmxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFZ1WkdWbWFXNWxaQ0E5UFQwZ2NpQS9JSFJ5ZFdVZ09pQnlPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITmxkQ0J5YjNSaGRHVW9jaWtnZTF4dUlDQWdJQ0FnSUNCZmNtOTBZWFJsTG5ObGRDaDBhR2x6TENCeUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYm5WdFltVnlJRzltSUhKdmQzTWdhVzRnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZTQlVhR1VnYm5WdFltVnlJRzltSUhKdmQzTXNJREFnUENCeWIzZHpMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRjl5YjNkektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM0p2ZDNNdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J1ZFcxaVpYSWdiMllnWTI5c2RXMXVjeUJwYmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPZFcxaVpYSjlJRlJvWlNCdWRXMWlaWElnYjJZZ1kyOXNkVzF1Y3l3Z01DQThJR052YkhWdGJuTXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdYMk52YkhNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZZMjlzY3k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR05sYm5SbGNpQmpaV3hzSUdsdUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA5aWFtVmpkSDBnVkdobElHTmxiblJsY2lBb2NtOTNMQ0JqYjJ3cExseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElGOWpaVzUwWlhJb0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElISnZkeUE5SUhKaGJtUnZiV2w2WlVObGJuUmxjaWgwYUdsekxsOXliM2R6SUM4Z01pa2dMU0F4TzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjJ3Z1BTQnlZVzVrYjIxcGVtVkRaVzUwWlhJb2RHaHBjeTVmWTI5c2N5QXZJRElwSUMwZ01UdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdlM0p2ZHl3Z1kyOXNmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJNWVhsdmRYUWdaR2xqWlNCdmJpQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTIxdlpIVnNaVHBFYVdWK1JHbGxXMTE5SUdScFkyVWdMU0JVYUdVZ1pHbGpaU0IwYnlCc1lYbHZkWFFnYjI0Z2RHaHBjeUJNWVhsdmRYUXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdiVzlrZFd4bE9rUnBaWDVFYVdWYlhYMGdWR2hsSUhOaGJXVWdiR2x6ZENCdlppQmthV05sTENCaWRYUWdibTkzSUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdlMjF2WkhWc1pUcGxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNKK1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eWZTQlVhR1VnYm5WdFltVnlJRzltWEc0Z0lDQWdJQ29nWkdsalpTQnphRzkxYkdRZ2JtOTBJR1Y0WTJWbFpDQjBhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR2x6SUV4aGVXOTFkQ0JqWVc1Y2JpQWdJQ0FnS2lCc1lYbHZkWFF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdiR0Y1YjNWMEtHUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLR1JwWTJVdWJHVnVaM1JvSUQ0Z2RHaHBjeTV0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCVWFHVWdiblZ0WW1WeUlHOW1JR1JwWTJVZ2RHaGhkQ0JqWVc0Z1ltVWdiR0Y1YjNWMElHbHpJQ1I3ZEdocGN5NXRZWGhwYlhWdFRuVnRZbVZ5VDJaRWFXTmxmU3dnWjI5MElDUjdaR2xqWlM1c1pXNW5hSFI5SUdScFkyVWdhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sSUQwZ1cxMDdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUnBZMlZVYjB4aGVXOTFkQ0E5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWkdsbElHOW1JR1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaGthV1V1YUdGelEyOXZjbVJwYm1GMFpYTW9LU0FtSmlCa2FXVXVhWE5JWld4a0tDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCRWFXTmxJSFJvWVhRZ1lYSmxJR0psYVc1bklHaGxiR1FnWVc1a0lHaGhkbVVnWW1WbGJpQnNZWGx2ZFhRZ1ltVm1iM0psSUhOb2IzVnNaRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUd0bFpYQWdkR2hsYVhJZ1kzVnljbVZ1ZENCamIyOXlaR2x1WVhSbGN5QmhibVFnY205MFlYUnBiMjR1SUVsdUlHOTBhR1Z5SUhkdmNtUnpMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUhSb1pYTmxJR1JwWTJVZ1lYSmxJSE5yYVhCd1pXUXVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZV3h5WldGa2VVeGhlVzkxZEVScFkyVXVjSFZ6YUNoa2FXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXTmxWRzlNWVhsdmRYUXVjSFZ6YUNoa2FXVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV0Y0SUQwZ1RXRjBhQzV0YVc0b1pHbGpaUzVzWlc1bmRHZ2dLaUIwYUdsekxtUnBjM0JsY25OcGIyNHNJSFJvYVhNdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpTazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHRjJZV2xzWVdKc1pVTmxiR3h6SUQwZ2RHaHBjeTVmWTI5dGNIVjBaVUYyWVdsc1lXSnNaVU5sYkd4ektHMWhlQ3dnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdaR2xsSUc5bUlHUnBZMlZVYjB4aGVXOTFkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtRnVaRzl0U1c1a1pYZ2dQU0JOWVhSb0xtWnNiMjl5S0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJoZG1GcGJHRmliR1ZEWld4c2N5NXNaVzVuZEdncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjbUZ1Wkc5dFEyVnNiQ0E5SUdGMllXbHNZV0pzWlVObGJHeHpXM0poYm1SdmJVbHVaR1Y0WFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0YyWVdsc1lXSnNaVU5sYkd4ekxuTndiR2xqWlNoeVlXNWtiMjFKYm1SbGVDd2dNU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlM1amIyOXlaR2x1WVhSbGN5QTlJSFJvYVhNdVgyNTFiV0psY2xSdlEyOXZjbVJwYm1GMFpYTW9jbUZ1Wkc5dFEyVnNiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1V1Y205MFlYUnBiMjRnUFNCMGFHbHpMbkp2ZEdGMFpTQS9JRTFoZEdndWNtOTFibVFvVFdGMGFDNXlZVzVrYjIwb0tTQXFJRVpWVEV4ZlEwbFNRMHhGWDBsT1gwUkZSMUpGUlZNcElEb2diblZzYkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lGOWthV05sTG5ObGRDaDBhR2x6TENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNrN1hHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHRnNjbVZoWkhsTVlYbHZkWFJFYVdObE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiWEIxZEdVZ1lTQnNhWE4wSUhkcGRHZ2dZWFpoYVd4aFlteGxJR05sYkd4eklIUnZJSEJzWVdObElHUnBZMlVnYjI0dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYldGNElDMGdWR2hsSUc1MWJXSmxjaUJsYlhCMGVTQmpaV3hzY3lCMGJ5QmpiMjF3ZFhSbExseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1JHbGxXMTE5SUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sSUMwZ1FTQnNhWE4wSUhkcGRHZ2daR2xqWlNCMGFHRjBJR2hoZG1VZ1lXeHlaV0ZrZVNCaVpXVnVJR3hoZVc5MWRDNWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9WVzFpWlhKYlhYMGdWR2hsSUd4cGMzUWdiMllnWVhaaGFXeGhZbXhsSUdObGJHeHpJSEpsY0hKbGMyVnVkR1ZrSUdKNUlIUm9aV2x5SUc1MWJXSmxjaTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpiMjF3ZFhSbFFYWmhhV3hoWW14bFEyVnNiSE1vYldGNExDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhkbUZwYkdGaWJHVWdQU0J1WlhjZ1UyVjBLQ2s3WEc0Z0lDQWdJQ0FnSUd4bGRDQnNaWFpsYkNBOUlEQTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHMWhlRXhsZG1Wc0lEMGdUV0YwYUM1dGFXNG9kR2hwY3k1ZmNtOTNjeXdnZEdocGN5NWZZMjlzY3lrN1hHNWNiaUFnSUNBZ0lDQWdkMmhwYkdVZ0tHRjJZV2xzWVdKc1pTNXphWHBsSUR3Z2JXRjRJQ1ltSUd4bGRtVnNJRHdnYldGNFRHVjJaV3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWTJWc2JDQnZaaUIwYUdsekxsOWpaV3hzYzA5dVRHVjJaV3dvYkdWMlpXd3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIVnVaR1ZtYVc1bFpDQWhQVDBnWTJWc2JDQW1KaUIwYUdsekxsOWpaV3hzU1hORmJYQjBlU2hqWld4c0xDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYWmhhV3hoWW14bExtRmtaQ2hqWld4c0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUd4bGRtVnNLeXM3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1FYSnlZWGt1Wm5KdmJTaGhkbUZwYkdGaWJHVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU5oYkdOMWJHRjBaU0JoYkd3Z1kyVnNiSE1nYjI0Z2JHVjJaV3dnWm5KdmJTQjBhR1VnWTJWdWRHVnlJRzltSUhSb1pTQnNZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnYkdWMlpXd2dMU0JVYUdVZ2JHVjJaV3dnWm5KdmJTQjBhR1VnWTJWdWRHVnlJRzltSUhSb1pTQnNZWGx2ZFhRdUlEQmNiaUFnSUNBZ0tpQnBibVJwWTJGMFpYTWdkR2hsSUdObGJuUmxjaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU5sZER4T2RXMWlaWEkrZlNCMGFHVWdZMlZzYkhNZ2IyNGdkR2hsSUd4bGRtVnNJR2x1SUhSb2FYTWdiR0Y1YjNWMElISmxjSEpsYzJWdWRHVmtJR0o1WEc0Z0lDQWdJQ29nZEdobGFYSWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeHpUMjVNWlhabGJDaHNaWFpsYkNrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCalpXeHNjeUE5SUc1bGR5QlRaWFFvS1R0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJWdWRHVnlJRDBnZEdocGN5NWZZMlZ1ZEdWeU8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNnd0lEMDlQU0JzWlhabGJDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyVnNiSE11WVdSa0tIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaGpaVzUwWlhJcEtUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUhKdmR5QTlJR05sYm5SbGNpNXliM2NnTFNCc1pYWmxiRHNnY205M0lEdzlJR05sYm5SbGNpNXliM2NnS3lCc1pYWmxiRHNnY205M0t5c3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWld4c2N5NWhaR1FvZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0eWIzY3NJR052YkRvZ1kyVnVkR1Z5TG1OdmJDQXRJR3hsZG1Wc2ZTa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR05sYkd4ekxtRmtaQ2gwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTNKdmR5d2dZMjlzT2lCalpXNTBaWEl1WTI5c0lDc2diR1YyWld4OUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUdOdmJDQTlJR05sYm5SbGNpNWpiMndnTFNCc1pYWmxiQ0FySURFN0lHTnZiQ0E4SUdObGJuUmxjaTVqYjJ3Z0t5QnNaWFpsYkRzZ1kyOXNLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2M2SUdObGJuUmxjaTV5YjNjZ0xTQnNaWFpsYkN3Z1kyOXNmU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkem9nWTJWdWRHVnlMbkp2ZHlBcklHeGxkbVZzTENCamIyeDlLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWTJWc2JITTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSRzlsY3lCalpXeHNJR052Ym5SaGFXNGdZU0JqWld4c0lHWnliMjBnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlUvWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdZMlZzYkNBdElFRWdZMlZzYkNCcGJpQnNZWGx2ZFhRZ2NtVndjbVZ6Wlc1MFpXUWdZbmtnWVNCdWRXMWlaWEl1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRFYVdWYlhYMGdZV3h5WldGa2VVeGhlVzkxZEVScFkyVWdMU0JCSUd4cGMzUWdiMllnWkdsalpTQjBhR0YwSUdoaGRtVWdZV3h5WldGa2VTQmlaV1Z1SUd4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMEp2YjJ4bFlXNTlJRlJ5ZFdVZ2FXWWdZMlZzYkNCa2IyVnpJRzV2ZENCamIyNTBZV2x1SUdFZ1pHbGxMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTmxiR3hKYzBWdGNIUjVLR05sYkd3c0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUWdQVDA5SUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sTG1acGJtUW9aR2xsSUQwK0lHTmxiR3dnUFQwOUlIUm9hWE11WDJOdmIzSmthVzVoZEdWelZHOU9kVzFpWlhJb1pHbGxMbU52YjNKa2FXNWhkR1Z6S1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElHNTFiV0psY2lCMGJ5QmhJR05sYkd3Z0tISnZkeXdnWTI5c0tWeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUc0Z0xTQlVhR1VnYm5WdFltVnlJSEpsY0hKbGMyVnVkR2x1WnlCaElHTmxiR3hjYmlBZ0lDQWdLaUJBY21WMGRYSnVjeUI3VDJKcVpXTjBmU0JTWlhSMWNtNGdkR2hsSUdObGJHd2dLSHR5YjNjc0lHTnZiSDBwSUdOdmNuSmxjM0J2Ym1ScGJtY2diaTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOXVkVzFpWlhKVWIwTmxiR3dvYmlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2UzSnZkem9nVFdGMGFDNTBjblZ1WXlodUlDOGdkR2hwY3k1ZlkyOXNjeWtzSUdOdmJEb2diaUFsSUhSb2FYTXVYMk52YkhOOU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQmpaV3hzSUhSdklHRWdiblZ0WW1WeVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWTJWc2JDQXRJRlJvWlNCalpXeHNJSFJ2SUdOdmJuWmxjblFnZEc4Z2FYUnpJRzUxYldKbGNpNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOGRXNWtaV1pwYm1Wa2ZTQlVhR1VnYm5WdFltVnlJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUdObGJHd3VYRzRnSUNBZ0lDb2dVbVYwZFhKdWN5QjFibVJsWm1sdVpXUWdkMmhsYmlCMGFHVWdZMlZzYkNCcGN5QnViM1FnYjI0Z2RHaGxJR3hoZVc5MWRGeHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeFViMDUxYldKbGNpaDdjbTkzTENCamIyeDlLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRHc5SUhKdmR5QW1KaUJ5YjNjZ1BDQjBhR2x6TGw5eWIzZHpJQ1ltSURBZ1BEMGdZMjlzSUNZbUlHTnZiQ0E4SUhSb2FYTXVYMk52YkhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5YjNjZ0tpQjBhR2x6TGw5amIyeHpJQ3NnWTI5c08xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJR05sYkd3Z2NtVndjbVZ6Wlc1MFpXUWdZbmtnYVhSeklHNTFiV0psY2lCMGJ5QjBhR1ZwY2lCamIyOXlaR2x1WVhSbGN5NWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdUlDMGdWR2hsSUc1MWJXSmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmpaV3hzWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjlJRlJvWlNCamIyOXlaR2x1WVhSbGN5QmpiM0p5WlhOd2IyNWthVzVuSUhSdklIUm9aU0JqWld4c0lISmxjSEpsYzJWdWRHVmtJR0o1WEc0Z0lDQWdJQ29nZEdocGN5QnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmYm5WdFltVnlWRzlEYjI5eVpHbHVZWFJsY3lodUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5alpXeHNWRzlEYjI5eVpITW9kR2hwY3k1ZmJuVnRZbVZ5Vkc5RFpXeHNLRzRwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUdFZ2NHRnBjaUJ2WmlCamIyOXlaR2x1WVhSbGN5QjBieUJoSUc1MWJXSmxjaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUMkpxWldOMGZTQmpiMjl5WkhNZ0xTQlVhR1VnWTI5dmNtUnBibUYwWlhNZ2RHOGdZMjl1ZG1WeWRGeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1RuVnRZbVZ5ZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUdOdmJuWmxjblJsWkNCMGJ5QmhJRzUxYldKbGNpNGdTV1pjYmlBZ0lDQWdLaUIwYUdVZ1kyOXZjbVJwYm1GMFpYTWdZWEpsSUc1dmRDQnZiaUIwYUdseklHeGhlVzkxZEN3Z2RHaGxJRzUxYldKbGNpQnBjeUIxYm1SbFptbHVaV1F1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMjl2Y21ScGJtRjBaWE5VYjA1MWJXSmxjaWhqYjI5eVpITXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiaUE5SUhSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loMGFHbHpMbDlqYjI5eVpITlViME5sYkd3b1kyOXZjbVJ6S1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUR3OUlHNGdKaVlnYmlBOElIUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRzQ3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVGJtRndJQ2g0TEhrcElIUnZJSFJvWlNCamJHOXpaWE4wSUdObGJHd2dhVzRnZEdocGN5Qk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWkdsbFkyOXZjbVJwYm1GMFpTQXRJRlJvWlNCamIyOXlaR2x1WVhSbElIUnZJR1pwYm1RZ2RHaGxJR05zYjNObGMzUWdZMlZzYkZ4dUlDQWdJQ0FxSUdadmNpNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwUnBaWDBnVzJScFpXTnZiM0prYVc1aGRDNWthV1VnUFNCdWRXeHNYU0F0SUZSb1pTQmthV1VnZEc4Z2MyNWhjQ0IwYnk1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnWkdsbFkyOXZjbVJwYm1GMFpTNTRJQzBnVkdobElIZ3RZMjl2Y21ScGJtRjBaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdaR2xsWTI5dmNtUnBibUYwWlM1NUlDMGdWR2hsSUhrdFkyOXZjbVJwYm1GMFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwOWlhbVZqZEh4dWRXeHNmU0JVYUdVZ1kyOXZjbVJwYm1GMFpTQnZaaUIwYUdVZ1kyVnNiQ0JqYkc5elpYTjBJSFJ2SUNoNExDQjVLUzVjYmlBZ0lDQWdLaUJPZFd4c0lIZG9aVzRnYm04Z2MzVnBkR0ZpYkdVZ1kyVnNiQ0JwY3lCdVpXRnlJQ2g0TENCNUtWeHVJQ0FnSUNBcUwxeHVJQ0FnSUhOdVlYQlVieWg3WkdsbElEMGdiblZzYkN3Z2VDd2dlWDBwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5eWJtVnlRMlZzYkNBOUlIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dUV0YwYUM1MGNuVnVZeWg1SUM4Z2RHaHBjeTVrYVdWVGFYcGxLU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nVFdGMGFDNTBjblZ1WXloNElDOGdkR2hwY3k1a2FXVlRhWHBsS1Z4dUlDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHTnZjbTVsY2lBOUlIUm9hWE11WDJObGJHeFViME52YjNKa2N5aGpiM0p1WlhKRFpXeHNLVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkMmxrZEdoSmJpQTlJR052Y201bGNpNTRJQ3NnZEdocGN5NWthV1ZUYVhwbElDMGdlRHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkMmxrZEdoUGRYUWdQU0IwYUdsekxtUnBaVk5wZW1VZ0xTQjNhV1IwYUVsdU8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCb1pXbG5hSFJKYmlBOUlHTnZjbTVsY2k1NUlDc2dkR2hwY3k1a2FXVlRhWHBsSUMwZ2VUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FHVnBaMmgwVDNWMElEMGdkR2hwY3k1a2FXVlRhWHBsSUMwZ2FHVnBaMmgwU1c0N1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2NYVmhaSEpoYm5SeklEMGdXM3RjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWhqYjNKdVpYSkRaV3hzS1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFbHVJQ29nYUdWcFoyaDBTVzVjYmlBZ0lDQWdJQ0FnZlN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY1RvZ2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnliM2M2SUdOdmNtNWxja05sYkd3dWNtOTNMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1kyOXlibVZ5UTJWc2JDNWpiMndnS3lBeFhHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFOTFkQ0FxSUdobGFXZG9kRWx1WEc0Z0lDQWdJQ0FnSUgwc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhFNklIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCamIzSnVaWEpEWld4c0xuSnZkeUFySURFc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXNPaUJqYjNKdVpYSkRaV3hzTG1OdmJGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaEpiaUFxSUdobGFXZG9kRTkxZEZ4dUlDQWdJQ0FnSUNCOUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeE9pQjBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1kyOXlibVZ5UTJWc2JDNXliM2NnS3lBeExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nWTI5eWJtVnlRMlZzYkM1amIyd2dLeUF4WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZkbVZ5WVdkbE9pQjNhV1IwYUU5MWRDQXFJR2hsYVdkb2RFOTFkRnh1SUNBZ0lDQWdJQ0I5WFR0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCemJtRndWRzhnUFNCeGRXRmtjbUZ1ZEhOY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdObGJHd2djMmh2ZFd4a0lHSmxJRzl1SUhSb1pTQnNZWGx2ZFhSY2JpQWdJQ0FnSUNBZ0lDQWdJQzVtYVd4MFpYSW9LSEYxWVdSeVlXNTBLU0E5UGlCMWJtUmxabWx1WldRZ0lUMDlJSEYxWVdSeVlXNTBMbkVwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJqWld4c0lITm9iM1ZzWkNCaVpTQnViM1FnWVd4eVpXRmtlU0IwWVd0bGJpQmxlR05sY0hRZ1lua2dhWFJ6Wld4bVhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Wm1sc2RHVnlLQ2h4ZFdGa2NtRnVkQ2tnUFQ0Z0tGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHNTFiR3dnSVQwOUlHUnBaU0FtSmlCMGFHbHpMbDlqYjI5eVpHbHVZWFJsYzFSdlRuVnRZbVZ5S0dScFpTNWpiMjl5WkdsdVlYUmxjeWtnUFQwOUlIRjFZV1J5WVc1MExuRXBYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmSHdnZEdocGN5NWZZMlZzYkVselJXMXdkSGtvY1hWaFpISmhiblF1Y1N3Z1gyUnBZMlV1WjJWMEtIUm9hWE1wS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdObGJHd2djMmh2ZFd4a0lHSmxJR052ZG1WeVpXUWdZbmtnZEdobElHUnBaU0IwYUdVZ2JXOXpkRnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuSmxaSFZqWlNoY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBb2JXRjRVU3dnY1hWaFpISmhiblFwSUQwK0lIRjFZV1J5WVc1MExtTnZkbVZ5WVdkbElENGdiV0Y0VVM1amIzWmxjbUZuWlNBL0lIRjFZV1J5WVc1MElEb2diV0Y0VVN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCN2NUb2dkVzVrWldacGJtVmtMQ0JqYjNabGNtRm5aVG9nTFRGOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRZ0lUMDlJSE51WVhCVWJ5NXhJRDhnZEdocGN5NWZiblZ0WW1WeVZHOURiMjl5WkdsdVlYUmxjeWh6Ym1Gd1ZHOHVjU2tnT2lCdWRXeHNPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRWRsZENCMGFHVWdaR2xsSUdGMElIQnZhVzUwSUNoNExDQjVLVHRjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVRzlwYm5SOUlIQnZhVzUwSUMwZ1ZHaGxJSEJ2YVc1MElHbHVJQ2g0TENCNUtTQmpiMjl5WkdsdVlYUmxjMXh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMFJwWlh4dWRXeHNmU0JVYUdVZ1pHbGxJSFZ1WkdWeUlHTnZiM0prYVc1aGRHVnpJQ2g0TENCNUtTQnZjaUJ1ZFd4c0lHbG1JRzV2SUdScFpWeHVJQ0FnSUNBcUlHbHpJR0YwSUhSb1pTQndiMmx1ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhSQmRDaHdiMmx1ZENBOUlIdDRPaUF3TENCNU9pQXdmU2tnZTF4dUlDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHUnBaU0J2WmlCZlpHbGpaUzVuWlhRb2RHaHBjeWtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHUnBaUzVqYjI5eVpHbHVZWFJsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlRVpwZENBOUlIZ2dQRDBnY0c5cGJuUXVlQ0FtSmlCd2IybHVkQzU0SUR3OUlIZ2dLeUIwYUdsekxtUnBaVk5wZW1VN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjVSbWwwSUQwZ2VTQThQU0J3YjJsdWRDNTVJQ1ltSUhCdmFXNTBMbmtnUEQwZ2VTQXJJSFJvYVhNdVpHbGxVMmw2WlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIaEdhWFFnSmlZZ2VVWnBkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJrYVdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JuVnNiRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVd4amRXeGhkR1VnZEdobElHZHlhV1FnYzJsNlpTQm5hWFpsYmlCM2FXUjBhQ0JoYm1RZ2FHVnBaMmgwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJSGRwWkhSb0lDMGdWR2hsSUcxcGJtbHRZV3dnZDJsa2RHaGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2FHVnBaMmgwSUMwZ1ZHaGxJRzFwYm1sdFlXd2dhR1ZwWjJoMFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqWVd4amRXeGhkR1ZIY21sa0tIZHBaSFJvTENCb1pXbG5hSFFwSUh0Y2JpQWdJQ0FnSUNBZ1gyTnZiSE11YzJWMEtIUm9hWE1zSUUxaGRHZ3VabXh2YjNJb2QybGtkR2dnTHlCMGFHbHpMbVJwWlZOcGVtVXBLVHRjYmlBZ0lDQWdJQ0FnWDNKdmQzTXVjMlYwS0hSb2FYTXNJRTFoZEdndVpteHZiM0lvYUdWcFoyaDBJQzhnZEdocGN5NWthV1ZUYVhwbEtTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJQ2h5YjNjc0lHTnZiQ2tnWTJWc2JDQjBieUFvZUN3Z2VTa2dZMjl2Y21ScGJtRjBaWE11WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdZMlZzYkNBdElGUm9aU0JqWld4c0lIUnZJR052Ym5abGNuUWdkRzhnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0UFltcGxZM1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUdOdmIzSmthVzVoZEdWekxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJObGJHeFViME52YjNKa2N5aDdjbTkzTENCamIyeDlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUI3ZURvZ1kyOXNJQ29nZEdocGN5NWthV1ZUYVhwbExDQjVPaUJ5YjNjZ0tpQjBhR2x6TG1ScFpWTnBlbVY5TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnS0hnc0lIa3BJR052YjNKa2FXNWhkR1Z6SUhSdklHRWdLSEp2ZHl3Z1kyOXNLU0JqWld4c0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdOdmIzSmthVzVoZEdWeklDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZJR052Ym5abGNuUWdkRzhnWVNCalpXeHNMbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDlpYW1WamRIMGdWR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dZMlZzYkZ4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YjNKa2MxUnZRMlZzYkNoN2VDd2dlWDBwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1RXRjBhQzUwY25WdVl5aDVJQzhnZEdocGN5NWthV1ZUYVhwbEtTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJEb2dUV0YwYUM1MGNuVnVZeWg0SUM4Z2RHaHBjeTVrYVdWVGFYcGxLVnh1SUNBZ0lDQWdJQ0I5TzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdSM0pwWkV4aGVXOTFkSDA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1WEc0dktpcGNiaUFxSUVCdGIyUjFiR1VnYldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JseHVMeXBjYmlBcUlFTnZiblpsY25RZ1lXNGdTRlJOVENCaGRIUnlhV0oxZEdVZ2RHOGdZVzRnYVc1emRHRnVZMlVuY3lCd2NtOXdaWEowZVM0Z1hHNGdLbHh1SUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUc1aGJXVWdMU0JVYUdVZ1lYUjBjbWxpZFhSbEozTWdibUZ0WlZ4dUlDb2dRSEpsZEhWeWJpQjdVM1J5YVc1bmZTQlVhR1VnWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTZHpJRzVoYldVdUlFWnZjaUJsZUdGdGNHeGxMQ0JjSW0xNUxXRjBkSEpjSWx4dUlDb2dkMmxzYkNCaVpTQmpiMjUyWlhKMFpXUWdkRzhnWENKdGVVRjBkSEpjSWl3Z1lXNWtJRndpWkdsellXSnNaV1JjSWlCMGJ5QmNJbVJwYzJGaWJHVmtYQ0l1WEc0Z0tpOWNibU52Ym5OMElHRjBkSEpwWW5WMFpUSndjbTl3WlhKMGVTQTlJQ2h1WVcxbEtTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1cyWnBjbk4wTENBdUxpNXlaWE4wWFNBOUlHNWhiV1V1YzNCc2FYUW9YQ0l0WENJcE8xeHVJQ0FnSUhKbGRIVnliaUJtYVhKemRDQXJJSEpsYzNRdWJXRndLSGR2Y21RZ1BUNGdkMjl5WkM1emJHbGpaU2d3TENBeEtTNTBiMVZ3Y0dWeVEyRnpaU2dwSUNzZ2QyOXlaQzV6YkdsalpTZ3hLU2t1YW05cGJpZ3BPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQk5hWGhwYmlCN1FHeHBibXNnYlc5a2RXeGxPbTFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzNVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJSFJ2SUdFZ1kyeGhjM011WEc0Z0tseHVJQ29nUUhCaGNtRnRJSHNxZlNCVGRYQWdMU0JVYUdVZ1kyeGhjM01nZEc4Z2JXbDRJR2x1ZEc4dVhHNGdLaUJBY21WMGRYSnVJSHR0YjJSMWJHVTZiV2w0YVc0dlVtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZsSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzMGdWR2hsSUcxcGVHVmtMV2x1SUdOc1lYTnpYRzRnS2k5Y2JtTnZibk4wSUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3lBOUlDaFRkWEFwSUQwK1hHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1RXbDRhVzRnZEc4Z2JXRnJaU0JoYkd3Z1lYUjBjbWxpZFhSbGN5QnZiaUJoSUdOMWMzUnZiU0JJVkUxTVJXeGxiV1Z1ZENCeVpXRmtMVzl1YkhrZ2FXNGdkR2hsSUhObGJuTmxYRzRnSUNBZ0lDb2dkR2hoZENCM2FHVnVJSFJvWlNCaGRIUnlhV0oxZEdVZ1oyVjBjeUJoSUc1bGR5QjJZV3gxWlNCMGFHRjBJR1JwWm1abGNuTWdabkp2YlNCMGFHVWdkbUZzZFdVZ2IyWWdkR2hsWEc0Z0lDQWdJQ29nWTI5eWNtVnpjRzl1WkdsdVp5QndjbTl3WlhKMGVTd2dhWFFnYVhNZ2NtVnpaWFFnZEc4Z2RHaGhkQ0J3Y205d1pYSjBlU2R6SUhaaGJIVmxMaUJVYUdWY2JpQWdJQ0FnS2lCaGMzTjFiWEIwYVc5dUlHbHpJSFJvWVhRZ1lYUjBjbWxpZFhSbElGd2liWGt0WVhSMGNtbGlkWFJsWENJZ1kyOXljbVZ6Y0c5dVpITWdkMmwwYUNCd2NtOXdaWEowZVNCY0luUm9hWE11YlhsQmRIUnlhV0oxZEdWY0lpNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1EyeGhjM045SUZOMWNDQXRJRlJvWlNCamJHRnpjeUIwYnlCdGFYaHBiaUIwYUdseklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5NWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJRlJvWlNCdGFYaGxaQ0JwYmlCamJHRnpjeTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ0YVhocGJseHVJQ0FnSUNBcUlFQmhiR2xoY3lCdGIyUjFiR1U2YldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmbEpsWVdSUGJteDVRWFIwY21saWRYUmxjMXh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnNZWE56SUdWNGRHVnVaSE1nVTNWd0lIdGNibHh1SUNBZ0lDQWdJQ0F2S2lwY2JpQWdJQ0FnSUNBZ0lDb2dRMkZzYkdKaFkyc2dkR2hoZENCcGN5QmxlR1ZqZFhSbFpDQjNhR1Z1SUdGdUlHOWljMlZ5ZG1Wa0lHRjBkSEpwWW5WMFpTZHpJSFpoYkhWbElHbHpYRzRnSUNBZ0lDQWdJQ0FxSUdOb1lXNW5aV1F1SUVsbUlIUm9aU0JJVkUxTVJXeGxiV1Z1ZENCcGN5QmpiMjV1WldOMFpXUWdkRzhnZEdobElFUlBUU3dnZEdobElHRjBkSEpwWW5WMFpWeHVJQ0FnSUNBZ0lDQWdLaUIyWVd4MVpTQmpZVzRnYjI1c2VTQmlaU0J6WlhRZ2RHOGdkR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dTRlJOVEVWc1pXMWxiblFuY3lCd2NtOXdaWEowZVM1Y2JpQWdJQ0FnSUNBZ0lDb2dTVzRnWldabVpXTjBMQ0IwYUdseklHMWhhMlZ6SUhSb2FYTWdTRlJOVEVWc1pXMWxiblFuY3lCaGRIUnlhV0oxZEdWeklISmxZV1F0YjI1c2VTNWNiaUFnSUNBZ0lDQWdJQ3BjYmlBZ0lDQWdJQ0FnSUNvZ1JtOXlJR1Y0WVcxd2JHVXNJR2xtSUdGdUlFaFVUVXhGYkdWdFpXNTBJR2hoY3lCaGJpQmhkSFJ5YVdKMWRHVWdYQ0o0WENJZ1lXNWtYRzRnSUNBZ0lDQWdJQ0FxSUdOdmNuSmxjM0J2Ym1ScGJtY2djSEp2Y0dWeWRIa2dYQ0o0WENJc0lIUm9aVzRnWTJoaGJtZHBibWNnZEdobElIWmhiSFZsSUZ3aWVGd2lJSFJ2SUZ3aU5Wd2lYRzRnSUNBZ0lDQWdJQ0FxSUhkcGJHd2diMjVzZVNCM2IzSnJJSGRvWlc0Z1lIUm9hWE11ZUNBOVBUMGdOV0F1WEc0Z0lDQWdJQ0FnSUNBcVhHNGdJQ0FnSUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVZVzFsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc1aGJXVXVYRzRnSUNBZ0lDQWdJQ0FxSUVCd1lYSmhiU0I3VTNSeWFXNW5mU0J2YkdSV1lXeDFaU0F0SUZSb1pTQmhkSFJ5YVdKMWRHVW5jeUJ2YkdRZ2RtRnNkV1V1WEc0Z0lDQWdJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdVpYZFdZV3gxWlNBdElGUm9aU0JoZEhSeWFXSjFkR1VuY3lCdVpYY2dkbUZzZFdVdVhHNGdJQ0FnSUNBZ0lDQXFMMXh1SUNBZ0lDQWdJQ0JoZEhSeWFXSjFkR1ZEYUdGdVoyVmtRMkZzYkdKaFkyc29ibUZ0WlN3Z2IyeGtWbUZzZFdVc0lHNWxkMVpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QkJiR3dnWVhSMGNtbGlkWFJsY3lCaGNtVWdiV0ZrWlNCeVpXRmtMVzl1YkhrZ2RHOGdjSEpsZG1WdWRDQmphR1ZoZEdsdVp5QmllU0JqYUdGdVoybHVaMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdkR2hsSUdGMGRISnBZblYwWlNCMllXeDFaWE11SUU5bUlHTnZkWEp6WlN3Z2RHaHBjeUJwY3lCaWVTQnViMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdaM1ZoY21GdWRHVmxJSFJvWVhRZ2RYTmxjbk1nZDJsc2JDQnViM1FnWTJobFlYUWdhVzRnWVNCa2FXWm1aWEpsYm5RZ2QyRjVMbHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY0hKdmNHVnlkSGtnUFNCaGRIUnlhV0oxZEdVeWNISnZjR1Z5ZEhrb2JtRnRaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NWpiMjV1WldOMFpXUWdKaVlnYm1WM1ZtRnNkV1VnSVQwOUlHQWtlM1JvYVhOYmNISnZjR1Z5ZEhsZGZXQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2h1WVcxbExDQjBhR2x6VzNCeWIzQmxjblI1WFNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVZMjl1YzNRZ1ZtRnNhV1JoZEdsdmJrVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJGY25KdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9iWE5uS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0cxelp5azdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JXWVd4cFpHRjBhVzl1UlhKeWIzSmNibjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01Ua2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3Vm1Gc2FXUmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOVdZV3hwWkdGMGFXOXVSWEp5YjNJdWFuTmNJanRjYmx4dVkyOXVjM1FnWDNaaGJIVmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWtaV1poZFd4MFZtRnNkV1VnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlZ5Y205eWN5QTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNibU52Ym5OMElGUjVjR1ZXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5Y3lBOUlGdGRmU2tnZTF4dUlDQWdJQ0FnSUNCZmRtRnNkV1V1YzJWMEtIUm9hWE1zSUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnWDJSbFptRjFiSFJXWVd4MVpTNXpaWFFvZEdocGN5d2daR1ZtWVhWc2RGWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ1gyVnljbTl5Y3k1elpYUW9kR2hwY3l3Z1pYSnliM0p6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2IzSnBaMmx1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gzWmhiSFZsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2RtRnNkV1VvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbWx6Vm1Gc2FXUWdQeUIwYUdsekxtOXlhV2RwYmlBNklGOWtaV1poZFd4MFZtRnNkV1V1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCbGNuSnZjbk1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlpYSnliM0p6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2FYTldZV3hwWkNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlEQWdQajBnZEdocGN5NWxjbkp2Y25NdWJHVnVaM1JvTzF4dUlDQWdJSDFjYmx4dUlDQWdJR1JsWm1GMWJIUlVieWh1WlhkRVpXWmhkV3gwS1NCN1hHNGdJQ0FnSUNBZ0lGOWtaV1poZFd4MFZtRnNkV1V1YzJWMEtIUm9hWE1zSUc1bGQwUmxabUYxYkhRcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmZZMmhsWTJzb2UzQnlaV1JwWTJGMFpTd2dZbWx1WkZaaGNtbGhZbXhsY3lBOUlGdGRMQ0JGY25KdmNsUjVjR1VnUFNCV1lXeHBaR0YwYVc5dVJYSnliM0o5S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhCeWIzQnZjMmwwYVc5dUlEMGdjSEpsWkdsallYUmxMbUZ3Y0d4NUtIUm9hWE1zSUdKcGJtUldZWEpwWVdKc1pYTXBPMXh1SUNBZ0lDQWdJQ0JwWmlBb0lYQnliM0J2YzJsMGFXOXVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjaUE5SUc1bGR5QkZjbkp2Y2xSNWNHVW9kR2hwY3k1MllXeDFaU3dnWW1sdVpGWmhjbWxoWW14bGN5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkwyTnZibk52YkdVdWQyRnliaWhsY25KdmNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WlhKeWIzSnpMbkIxYzJnb1pYSnliM0lwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE03WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFaaGJHbGtZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2Vm1Gc2FXUmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElGQmhjbk5sUlhKeWIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGWmhiR2xrWVhScGIyNUZjbkp2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2JYTm5LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLRzF6WnlrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlFZWEp6WlVWeWNtOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFaaGJHbGtZWFJwYjI1RmNuSnZjbjBnWm5KdmJTQmNJaTR2Vm1Gc2FXUmhkR2x2YmtWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElFbHVkbUZzYVdSVWVYQmxSWEp5YjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZaaGJHbGtZWFJwYjI1RmNuSnZjaUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYlhObktTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtHMXpaeWs3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCSmJuWmhiR2xrVkhsd1pVVnljbTl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDFSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VHRnljMlZGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlVHRnljMlZGY25KdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0SmJuWmhiR2xrVkhsd1pVVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlKYm5aaGJHbGtWSGx3WlVWeWNtOXlMbXB6WENJN1hHNWNibU52Ym5OMElFbE9WRVZIUlZKZlJFVkdRVlZNVkY5V1FVeFZSU0E5SURBN1hHNWpiMjV6ZENCSmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1ZIbHdaVlpoYkdsa1lYUnZjaUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnYkdWMElIWmhiSFZsSUQwZ1NVNVVSVWRGVWw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmtaV1poZFd4MFZtRnNkV1VnUFNCSlRsUkZSMFZTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHVnljbTl5Y3lBOUlGdGRPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaE9kVzFpWlhJdWFYTkpiblJsWjJWeUtHbHVjSFYwS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc2RXVWdQU0JwYm5CMWREdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2hjSW5OMGNtbHVaMXdpSUQwOVBTQjBlWEJsYjJZZ2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIQmhjbk5sWkZaaGJIVmxJRDBnY0dGeWMyVkpiblFvYVc1d2RYUXNJREV3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoT2RXMWlaWEl1YVhOSmJuUmxaMlZ5S0hCaGNuTmxaRlpoYkhWbEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdjR0Z5YzJWa1ZtRnNkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCUVlYSnpaVVZ5Y205eUtHbHVjSFYwS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxjbkp2Y25NdWNIVnphQ2h1WlhjZ1NXNTJZV3hwWkZSNWNHVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjM1Z3WlhJb2UzWmhiSFZsTENCa1pXWmhkV3gwVm1Gc2RXVXNJR1Z5Y205eWMzMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHeGhjbWRsY2xSb1lXNG9iaWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWZZMmhsWTJzb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0hKbFpHbGpZWFJsT2lBb2Jpa2dQVDRnZEdocGN5NXZjbWxuYVc0Z1BqMGdiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnBibVJXWVhKcFlXSnNaWE02SUZ0dVhWeHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpiV0ZzYkdWeVZHaGhiaWh1S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDaHVLU0E5UGlCMGFHbHpMbTl5YVdkcGJpQThQU0J1TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZbWx1WkZaaGNtbGhZbXhsY3pvZ1cyNWRYRzRnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR0psZEhkbFpXNG9iaXdnYlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJobFkyc29lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NISmxaR2xqWVhSbE9pQW9iaXdnYlNrZ1BUNGdkR2hwY3k1c1lYSm5aWEpVYUdGdUtHNHBJQ1ltSUhSb2FYTXVjMjFoYkd4bGNsUm9ZVzRvYlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpYVc1a1ZtRnlhV0ZpYkdWek9pQmJiaXdnYlYxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JKYm5SbFoyVnlWSGx3WlZaaGJHbGtZWFJ2Y2x4dWZUdGNiaUlzSWk4cUtpQmNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdFVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5VWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwbHVkbUZzYVdSVWVYQmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDBsdWRtRnNhV1JVZVhCbFJYSnliM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdVMVJTU1U1SFgwUkZSa0ZWVEZSZlZrRk1WVVVnUFNCY0lsd2lPMXh1WTI5dWMzUWdVM1J5YVc1blZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdVMVJTU1U1SFgwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1JsWm1GMWJIUldZV3gxWlNBOUlGTlVVa2xPUjE5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y25NZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9YQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUdsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjJZV3gxWlNBOUlHbHVjSFYwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWEp5YjNKekxuQjFjMmdvYm1WM0lFbHVkbUZzYVdSVWVYQmxSWEp5YjNJb2FXNXdkWFFwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSE4xY0dWeUtIdDJZV3gxWlN3Z1pHVm1ZWFZzZEZaaGJIVmxMQ0JsY25KdmNuTjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnViM1JGYlhCMGVTZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTm9aV05yS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5WldScFkyRjBaVG9nS0NrZ1BUNGdYQ0pjSWlBaFBUMGdkR2hwY3k1dmNtbG5hVzVjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTFSNWNHVldZV3hwWkdGMGIzSjlJR1p5YjIwZ1hDSXVMMVI1Y0dWV1lXeHBaR0YwYjNJdWFuTmNJanRjYmk4dmFXMXdiM0owSUh0UVlYSnpaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5UVlYSnpaVVZ5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBsdWRtRnNhV1JVZVhCbFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1EwOU1UMUpmUkVWR1FWVk1WRjlXUVV4VlJTQTlJRndpWW14aFkydGNJanRjYm1OdmJuTjBJRU52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdRMDlNVDFKZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1EwOU1UMUpmUkVWR1FWVk1WRjlXUVV4VlJUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYSnliM0p6SUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2ljM1J5YVc1blhDSWdQVDA5SUhSNWNHVnZaaUJwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnljbTl5Y3k1d2RYTm9LRzVsZHlCSmJuWmhiR2xrVkhsd1pVVnljbTl5S0dsdWNIVjBLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnpkWEJsY2loN2RtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTd2daWEp5YjNKemZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JEYjJ4dmNsUjVjR1ZXWVd4cFpHRjBiM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0UVlYSnpaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5UVlYSnpaVVZ5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBsdWRtRnNhV1JVZVhCbFJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1FrOVBURVZCVGw5RVJVWkJWVXhVWDFaQlRGVkZJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkNiMjlzWldGdVZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdRazlQVEVWQlRsOUVSVVpCVlV4VVgxWkJURlZGTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrWldaaGRXeDBWbUZzZFdVZ1BTQkNUMDlNUlVGT1gwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1Z5Y205eWN5QTlJRnRkTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2hwYm5CMWRDQnBibk4wWVc1alpXOW1JRUp2YjJ4bFlXNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhiSFZsSUQwZ2FXNXdkWFE3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1hDSnpkSEpwYm1kY0lpQTlQVDBnZEhsd1pXOW1JR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9MM1J5ZFdVdmFTNTBaWE4wS0dsdWNIVjBLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnZEhKMVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb0wyWmhiSE5sTDJrdWRHVnpkQ2hwYm5CMWRDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dVR0Z5YzJWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhKeWIzSnpMbkIxYzJnb2JtVjNJRWx1ZG1Gc2FXUlVlWEJsUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk45S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwYzFSeWRXVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxsOWphR1ZqYXloN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3Y21Wa2FXTmhkR1U2SUNncElEMCtJSFJ5ZFdVZ1BUMDlJSFJvYVhNdWIzSnBaMmx1WEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdselJtRnNjMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDZ3BJRDArSUdaaGJITmxJRDA5UFNCMGFHbHpMbTl5YVdkcGJseHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUVKdmIyeGxZVzVVZVhCbFZtRnNhV1JoZEc5eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMGx1ZEdWblpYSlVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5SmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0VGRISnBibWRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwTnZiRzl5Vkhsd1pWWmhiR2xrWVhSdmNuMGdabkp2YlNCY0lpNHZRMjlzYjNKVWVYQmxWbUZzYVdSaGRHOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwSnZiMnhsWVc1VWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2k1cWMxd2lPMXh1WEc1amIyNXpkQ0JXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWW05dmJHVmhiaWhwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVKdmIyeGxZVzVVZVhCbFZtRnNhV1JoZEc5eUtHbHVjSFYwS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjJ4dmNpaHBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRU52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjaWhwYm5CMWRDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2FXNTBaV2RsY2locGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lFbHVkR1ZuWlhKVWVYQmxWbUZzYVdSaGRHOXlLR2x1Y0hWMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCemRISnBibWNvYVc1d2RYUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCVGRISnBibWRVZVhCbFZtRnNhV1JoZEc5eUtHbHVjSFYwS1R0Y2JpQWdJQ0I5WEc1Y2JuMDdYRzVjYm1OdmJuTjBJRlpoYkdsa1lYUnZjbE5wYm1kc1pYUnZiaUE5SUc1bGR5QldZV3hwWkdGMGIzSW9LVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JXWVd4cFpHRjBiM0pUYVc1bmJHVjBiMjRnWVhNZ2RtRnNhV1JoZEdWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0N3Z01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dVhHNHZMMmx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWemZTQm1jbTl0SUZ3aUxpOXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTmNJanRjYm1sdGNHOXlkQ0I3ZG1Gc2FXUmhkR1Y5SUdaeWIyMGdYQ0l1TDNaaGJHbGtZWFJsTDNaaGJHbGtZWFJsTG1welhDSTdYRzVjYm1OdmJuTjBJRlJCUjE5T1FVMUZJRDBnWENKMGIzQXRaR2xsWENJN1hHNWNibU52Ym5OMElFTkpVa05NUlY5RVJVZFNSVVZUSUQwZ016WXdPeUF2THlCa1pXZHlaV1Z6WEc1amIyNXpkQ0JPVlUxQ1JWSmZUMFpmVUVsUVV5QTlJRFk3SUM4dklFUmxabUYxYkhRZ0x5QnlaV2QxYkdGeUlITnBlQ0J6YVdSbFpDQmthV1VnYUdGeklEWWdjR2x3Y3lCdFlYaHBiWFZ0TGx4dVkyOXVjM1FnUkVWR1FWVk1WRjlEVDB4UFVpQTlJRndpU1hadmNubGNJanRjYm1OdmJuTjBJRVJGUmtGVlRGUmZXQ0E5SURBN0lDOHZJSEI0WEc1amIyNXpkQ0JFUlVaQlZVeFVYMWtnUFNBd095QXZMeUJ3ZUZ4dVkyOXVjM1FnUkVWR1FWVk1WRjlTVDFSQlZFbFBUaUE5SURBN0lDOHZJR1JsWjNKbFpYTmNibU52Ym5OMElFUkZSa0ZWVEZSZlQxQkJRMGxVV1NBOUlEQXVOVHRjYmx4dVkyOXVjM1FnUTA5TVQxSmZRVlJVVWtsQ1ZWUkZJRDBnWENKamIyeHZjbHdpTzF4dVkyOXVjM1FnU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVnUFNCY0ltaGxiR1F0WW5sY0lqdGNibU52Ym5OMElGQkpVRk5mUVZSVVVrbENWVlJGSUQwZ1hDSndhWEJ6WENJN1hHNWpiMjV6ZENCU1QxUkJWRWxQVGw5QlZGUlNTVUpWVkVVZ1BTQmNJbkp2ZEdGMGFXOXVYQ0k3WEc1amIyNXpkQ0JZWDBGVVZGSkpRbFZVUlNBOUlGd2llRndpTzF4dVkyOXVjM1FnV1Y5QlZGUlNTVUpWVkVVZ1BTQmNJbmxjSWp0Y2JseHVZMjl1YzNRZ1FrRlRSVjlFU1VWZlUwbGFSU0E5SURFd01Ec2dMeThnY0hoY2JtTnZibk4wSUVKQlUwVmZVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUSUQwZ01UVTdJQzh2SUhCNFhHNWpiMjV6ZENCQ1FWTkZYMU5VVWs5TFJWOVhTVVJVU0NBOUlESXVOVHNnTHk4Z2NIaGNibU52Ym5OMElFMUpUbDlUVkZKUFMwVmZWMGxFVkVnZ1BTQXhPeUF2THlCd2VGeHVZMjl1YzNRZ1NFRk1SaUE5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF5T3lBdkx5QndlRnh1WTI5dWMzUWdWRWhKVWtRZ1BTQkNRVk5GWDBSSlJWOVRTVnBGSUM4Z016c2dMeThnY0hoY2JtTnZibk4wSUZCSlVGOVRTVnBGSUQwZ1FrRlRSVjlFU1VWZlUwbGFSU0F2SURFMU95QXZMM0I0WEc1amIyNXpkQ0JRU1ZCZlEwOU1UMUlnUFNCY0ltSnNZV05yWENJN1hHNWNibU52Ym5OMElHUmxaekp5WVdRZ1BTQW9aR1ZuS1NBOVBpQjdYRzRnSUNBZ2NtVjBkWEp1SUdSbFp5QXFJQ2hOWVhSb0xsQkpJQzhnTVRnd0tUdGNibjA3WEc1Y2JtTnZibk4wSUdselVHbHdUblZ0WW1WeUlEMGdiaUE5UGlCN1hHNGdJQ0FnWTI5dWMzUWdiblZ0WW1WeUlEMGdjR0Z5YzJWSmJuUW9iaXdnTVRBcE8xeHVJQ0FnSUhKbGRIVnliaUJPZFcxaVpYSXVhWE5KYm5SbFoyVnlLRzUxYldKbGNpa2dKaVlnTVNBOFBTQnVkVzFpWlhJZ0ppWWdiblZ0WW1WeUlEdzlJRTVWVFVKRlVsOVBSbDlRU1ZCVE8xeHVmVHRjYmx4dUx5b3FYRzRnS2lCSFpXNWxjbUYwWlNCaElISmhibVJ2YlNCdWRXMWlaWElnYjJZZ2NHbHdjeUJpWlhSM1pXVnVJREVnWVc1a0lIUm9aU0JPVlUxQ1JWSmZUMFpmVUVsUVV5NWNiaUFxWEc0Z0tpQkFjbVYwZFhKdWN5QjdUblZ0WW1WeWZTQkJJSEpoYm1SdmJTQnVkVzFpWlhJZ2Jpd2dNU0RpaWFRZ2JpRGlpYVFnVGxWTlFrVlNYMDlHWDFCSlVGTXVYRzRnS2k5Y2JtTnZibk4wSUhKaGJtUnZiVkJwY0hNZ1BTQW9LU0E5UGlCTllYUm9MbVpzYjI5eUtFMWhkR2d1Y21GdVpHOXRLQ2tnS2lCT1ZVMUNSVkpmVDBaZlVFbFFVeWtnS3lBeE8xeHVYRzVqYjI1emRDQkVTVVZmVlU1SlEwOUVSVjlEU0VGU1FVTlVSVkpUSUQwZ1cxd2k0cHFBWENJc1hDTGltb0ZjSWl4Y0l1S2FnbHdpTEZ3aTRwcURYQ0lzWENMaW1vUmNJaXhjSXVLYWhWd2lYVHRjYmx4dUx5b3FYRzRnS2lCRGIyNTJaWEowSUdFZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2NtVndjbVZ6Wlc1MGFXNW5JR0VnWkdsbElHWmhZMlVnZEc4Z2RHaGxJRzUxYldKbGNpQnZaaUJ3YVhCeklHOW1YRzRnS2lCMGFHRjBJSE5oYldVZ1pHbGxMaUJVYUdseklHWjFibU4wYVc5dUlHbHpJSFJvWlNCeVpYWmxjbk5sSUc5bUlIQnBjSE5VYjFWdWFXTnZaR1V1WEc0Z0tseHVJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJSFVnTFNCVWFHVWdkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSWdkRzhnWTI5dWRtVnlkQ0IwYnlCd2FYQnpMbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UwNTFiV0psY254MWJtUmxabWx1WldSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklHNTFiV0psY2lCdlppQndhWEJ6TENBeElPS0pwQ0J3YVhCeklPS0pwQ0EyTENCdmNseHVJQ29nZFc1a1pXWnBibVZrSUdsbUlIVWdkMkZ6SUc1dmRDQmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlJSEpsY0hKbGMyVnVkR2x1WnlCaElHUnBaUzVjYmlBcUwxeHVZMjl1YzNRZ2RXNXBZMjlrWlZSdlVHbHdjeUE5SUNoMUtTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1pHbGxRMmhoY2tsdVpHVjRJRDBnUkVsRlgxVk9TVU5QUkVWZlEwaEJVa0ZEVkVWU1V5NXBibVJsZUU5bUtIVXBPMXh1SUNBZ0lISmxkSFZ5YmlBd0lEdzlJR1JwWlVOb1lYSkpibVJsZUNBL0lHUnBaVU5vWVhKSmJtUmxlQ0FySURFZ09pQjFibVJsWm1sdVpXUTdYRzU5TzF4dVhHNHZLaXBjYmlBcUlFTnZiblpsY25RZ1lTQnVkVzFpWlhJZ2IyWWdjR2x3Y3l3Z01TRGlpYVFnY0dsd2N5RGlpYVFnTmlCMGJ5QmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlYRzRnS2lCeVpYQnlaWE5sYm5SaGRHbHZiaUJ2WmlCMGFHVWdZMjl5Y21WemNHOXVaR2x1WnlCa2FXVWdabUZqWlM0Z1ZHaHBjeUJtZFc1amRHbHZiaUJwY3lCMGFHVWdjbVYyWlhKelpWeHVJQ29nYjJZZ2RXNXBZMjlrWlZSdlVHbHdjeTVjYmlBcVhHNGdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdjQ0F0SUZSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3Y3lCMGJ5QmpiMjUyWlhKMElIUnZJR0VnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWEl1WEc0Z0tpQkFjbVYwZFhKdWN5QjdVM1J5YVc1bmZIVnVaR1ZtYVc1bFpIMGdWR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2dkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSnpJRzl5WEc0Z0tpQjFibVJsWm1sdVpXUWdhV1lnY0NCM1lYTWdibTkwSUdKbGRIZGxaVzRnTVNCaGJtUWdOaUJwYm1Oc2RYTnBkbVV1WEc0Z0tpOWNibU52Ym5OMElIQnBjSE5VYjFWdWFXTnZaR1VnUFNCd0lEMCtJR2x6VUdsd1RuVnRZbVZ5S0hBcElEOGdSRWxGWDFWT1NVTlBSRVZmUTBoQlVrRkRWRVZTVTF0d0lDMGdNVjBnT2lCMWJtUmxabWx1WldRN1hHNWNibU52Ym5OMElISmxibVJsY2todmJHUWdQU0FvWTI5dWRHVjRkQ3dnZUN3Z2VTd2dkMmxrZEdnc0lHTnZiRzl5S1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnVTBWUVJWSkJWRTlTSUQwZ2QybGtkR2dnTHlBek1EdGNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtZHNiMkpoYkVGc2NHaGhJRDBnUkVWR1FWVk1WRjlQVUVGRFNWUlpPMXh1SUNBZ0lHTnZiblJsZUhRdVltVm5hVzVRWVhSb0tDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNVM1I1YkdVZ1BTQmpiMnh2Y2p0Y2JpQWdJQ0JqYjI1MFpYaDBMbUZ5WXloNElDc2dkMmxrZEdnc0lIa2dLeUIzYVdSMGFDd2dkMmxrZEdnZ0xTQlRSVkJGVWtGVVQxSXNJREFzSURJZ0tpQk5ZWFJvTGxCSkxDQm1ZV3h6WlNrN1hHNGdJQ0FnWTI5dWRHVjRkQzVtYVd4c0tDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1eVpYTjBiM0psS0NrN1hHNTlPMXh1WEc1amIyNXpkQ0J5Wlc1a1pYSkVhV1VnUFNBb1kyOXVkR1Y0ZEN3Z2VDd2dlU3dnZDJsa2RHZ3NJR052Ykc5eUtTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1UwTkJURVVnUFNBb2QybGtkR2dnTHlCSVFVeEdLVHRjYmlBZ0lDQmpiMjV6ZENCSVFVeEdYMGxPVGtWU1gxTkpXa1VnUFNCTllYUm9Mbk54Y25Rb2QybGtkR2dnS2lvZ01pQXZJRElwTzF4dUlDQWdJR052Ym5OMElFbE9Ua1ZTWDFOSldrVWdQU0F5SUNvZ1NFRk1SbDlKVGs1RlVsOVRTVnBGTzF4dUlDQWdJR052Ym5OMElGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUE5SUVKQlUwVmZVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUSUNvZ1UwTkJURVU3WEc0Z0lDQWdZMjl1YzNRZ1NVNU9SVkpmVTBsYVJWOVNUMVZPUkVWRUlEMGdTVTVPUlZKZlUwbGFSU0F0SURJZ0tpQlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk03WEc0Z0lDQWdZMjl1YzNRZ1UxUlNUMHRGWDFkSlJGUklJRDBnVFdGMGFDNXRZWGdvVFVsT1gxTlVVazlMUlY5WFNVUlVTQ3dnUWtGVFJWOVRWRkpQUzBWZlYwbEVWRWdnS2lCVFEwRk1SU2s3WEc1Y2JpQWdJQ0JqYjI1emRDQnpkR0Z5ZEZnZ1BTQjRJQ3NnZDJsa2RHZ2dMU0JJUVV4R1gwbE9Ua1ZTWDFOSldrVWdLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNN1hHNGdJQ0FnWTI5dWMzUWdjM1JoY25SWklEMGdlU0FySUhkcFpIUm9JQzBnU0VGTVJsOUpUazVGVWw5VFNWcEZPMXh1WEc0Z0lDQWdZMjl1ZEdWNGRDNXpZWFpsS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVpWldkcGJsQmhkR2dvS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbVpwYkd4VGRIbHNaU0E5SUdOdmJHOXlPMXh1SUNBZ0lHTnZiblJsZUhRdWMzUnliMnRsVTNSNWJHVWdQU0JjSW1Kc1lXTnJYQ0k3WEc0Z0lDQWdZMjl1ZEdWNGRDNXNhVzVsVjJsa2RHZ2dQU0JUVkZKUFMwVmZWMGxFVkVnN1hHNGdJQ0FnWTI5dWRHVjRkQzV0YjNabFZHOG9jM1JoY25SWUxDQnpkR0Z5ZEZrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1YkdsdVpWUnZLSE4wWVhKMFdDQXJJRWxPVGtWU1gxTkpXa1ZmVWs5VlRrUkZSQ3dnYzNSaGNuUlpLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFzSUhOMFlYSjBXU0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCa1pXY3ljbUZrS0RJM01Da3NJR1JsWnpKeVlXUW9NQ2twTzF4dUlDQWdJR052Ym5SbGVIUXViR2x1WlZSdktITjBZWEowV0NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDQXJJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z2MzUmhjblJaSUNzZ1NVNU9SVkpmVTBsYVJWOVNUMVZPUkVWRUlDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbUZ5WXloemRHRnlkRmdnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRc0lITjBZWEowV1NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDQXJJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0JrWldjeWNtRmtLREFwTENCa1pXY3ljbUZrS0Rrd0tTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1c2FXNWxWRzhvYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbUZ5WXloemRHRnlkRmdzSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQmtaV2N5Y21Ga0tEa3dLU3dnWkdWbk1uSmhaQ2d4T0RBcEtUdGNiaUFnSUNCamIyNTBaWGgwTG14cGJtVlVieWh6ZEdGeWRGZ2dMU0JTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lITjBZWEowV1NBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeWs3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnWkdWbk1uSmhaQ2d4T0RBcExDQmtaV2N5Y21Ga0tESTNNQ2twTzF4dVhHNGdJQ0FnWTI5dWRHVjRkQzV6ZEhKdmEyVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtWnBiR3dvS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbkpsYzNSdmNtVW9LVHRjYm4wN1hHNWNibU52Ym5OMElISmxibVJsY2xCcGNDQTlJQ2hqYjI1MFpYaDBMQ0I0TENCNUxDQjNhV1IwYUNrZ1BUNGdlMXh1SUNBZ0lHTnZiblJsZUhRdWMyRjJaU2dwTzF4dUlDQWdJR052Ym5SbGVIUXVZbVZuYVc1UVlYUm9LQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzVTNSNWJHVWdQU0JRU1ZCZlEwOU1UMUk3WEc0Z0lDQWdZMjl1ZEdWNGRDNXRiM1psVkc4b2VDd2dlU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vZUN3Z2VTd2dkMmxrZEdnc0lEQXNJRElnS2lCTllYUm9MbEJKTENCbVlXeHpaU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzV5WlhOMGIzSmxLQ2s3WEc1OU8xeHVYRzVjYmk4dklGQnlhWFpoZEdVZ2NISnZjR1Z5ZEdsbGMxeHVZMjl1YzNRZ1gySnZZWEprSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlqYjJ4dmNpQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZmFHVnNaRUo1SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl3YVhCeklEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5eWIzUmhkR2x2YmlBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmZUNBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmZVNBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1Y2JpOHFLbHh1SUNvZ1ZHOXdSR2xsSUdseklIUm9aU0JjSW5SdmNDMWthV1ZjSWlCamRYTjBiMjBnVzBoVVRVeGNiaUFxSUdWc1pXMWxiblJkS0doMGRIQnpPaTh2WkdWMlpXeHZjR1Z5TG0xdmVtbHNiR0V1YjNKbkwyVnVMVlZUTDJSdlkzTXZWMlZpTDBGUVNTOUlWRTFNUld4bGJXVnVkQ2tnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsWEc0Z0tpQnZiaUIwYUdVZ1pHbGpaU0JpYjJGeVpDNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvZ1FHMXBlR1Z6SUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JtTnZibk4wSUZSdmNFUnBaU0E5SUdOc1lYTnpJR1Y0ZEdWdVpITWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpLRWhVVFV4RmJHVnRaVzUwS1NCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1JHbGxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHR3YVhCekxDQmpiMnh2Y2l3Z2NtOTBZWFJwYjI0c0lIZ3NJSGtzSUdobGJHUkNlWDBnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEJwY0hOV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1sdWRHVm5aWElvY0dsd2N5QjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdVltVjBkMlZsYmlneExDQTJLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aHlZVzVrYjIxUWFYQnpLQ2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNWNiaUFnSUNBZ0lDQWdYM0JwY0hNdWMyVjBLSFJvYVhNc0lIQnBjSE5XWVd4MVpTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRkJKVUZOZlFWUlVVa2xDVlZSRkxDQndhWEJ6Vm1Gc2RXVXBPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZMjlzYjNJZ1BTQjJZV3hwWkdGMFpTNWpiMnh2Y2loamIyeHZjaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWhFUlVaQlZVeFVYME5QVEU5U0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbTkwWVhScGIyNGdQU0IyWVd4cFpHRjBaUzVwYm5SbFoyVnlLSEp2ZEdGMGFXOXVJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0ZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WW1WMGQyVmxiaWd3TENBek5qQXBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVpHVm1ZWFZzZEZSdktFUkZSa0ZWVEZSZlVrOVVRVlJKVDA0cFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1ZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NTRJRDBnZG1Gc2FXUmhkR1V1YVc1MFpXZGxjaWg0SUh4OElIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGaGZRVlJVVWtsQ1ZWUkZLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXNZWEpuWlhKVWFHRnVLREFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLRVJGUmtGVlRGUmZXQ2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG5rZ1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtIa2dmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvV1Y5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG14aGNtZGxjbFJvWVc0b01DbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b1JFVkdRVlZNVkY5WktWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdkbUZzYVdSaGRHVXVjM1J5YVc1bktHaGxiR1JDZVNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaElSVXhFWDBKWlgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJtOTBSVzF3ZEhrb0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnlodWRXeHNLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE4wWVhScFl5Qm5aWFFnYjJKelpYSjJaV1JCZEhSeWFXSjFkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1NFVk1SRjlDV1Y5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JRU1ZCVFgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZKUFZFRlVTVTlPWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRmhmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdXVjlCVkZSU1NVSlZWRVZjYmlBZ0lDQWdJQ0FnWFR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0FnSUNBZ1gySnZZWEprTG5ObGRDaDBhR2x6TENCMGFHbHpMbkJoY21WdWRFNXZaR1VwTzF4dUlDQWdJQ0FnSUNCZlltOWhjbVF1WjJWMEtIUm9hWE1wTG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUVWMlpXNTBLRndpZEc5d0xXUnBaVHBoWkdSbFpGd2lLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR2x6WTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnSUNBZ0lGOWliMkZ5WkM1blpYUW9kR2hwY3lrdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQXRaR2xsT25KbGJXOTJaV1JjSWlrcE8xeHVJQ0FnSUNBZ0lDQmZZbTloY21RdWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOdmJuWmxjblFnZEdocGN5QkVhV1VnZEc4Z2RHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2IyWWdZU0JrYVdVZ1ptRmpaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUdOdmNuSmxjM0J2Ym1ScGJtY2dkRzhnZEdobElHNTFiV0psY2lCdlpseHVJQ0FnSUNBcUlIQnBjSE1nYjJZZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnZEc5VmJtbGpiMlJsS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NHbHdjMVJ2Vlc1cFkyOWtaU2gwYUdsekxuQnBjSE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOeVpXRjBaU0JoSUhOMGNtbHVaeUJ5WlhCeVpYTmxibUYwYVc5dUlHWnZjaUIwYUdseklHUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUhWdWFXTnZaR1VnYzNsdFltOXNJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUc1MWJXSmxjaUJ2WmlCd2FYQnpYRzRnSUNBZ0lDb2diMllnZEdocGN5QmthV1V1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxuUnZWVzVwWTI5a1pTZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nYm5WdFltVnlJRzltSUhCcGNITXNJREVnNG9ta0lIQnBjSE1nNG9ta0lEWXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCd2FYQnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNCcGNITXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvYVhNZ1JHbGxKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0JqYjJ4dmNpaHVaWGREYjJ4dmNpa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0E5UFQwZ2JtVjNRMjlzYjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFTlBURTlTWDBGVVZGSkpRbFZVUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmWTI5c2IzSXVjMlYwS0hSb2FYTXNJRVJGUmtGVlRGUmZRMDlNVDFJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJOdmJHOXlMbk5sZENoMGFHbHpMQ0J1WlhkRGIyeHZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVc0lHNWxkME52Ykc5eUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCMGFHRjBJR2x6SUdodmJHUnBibWNnZEdocGN5QkVhV1VzSUdsbUlHRnVlUzRnVG5Wc2JDQnZkR2hsY25kcGMyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1ZHOXdVR3hoZVdWeWZHNTFiR3g5SUZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXeGtRbmtvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmFHVnNaRUo1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUdobGJHUkNlU2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnWDJobGJHUkNlUzV6WlhRb2RHaHBjeXdnY0d4aGVXVnlLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlIQnNZWGxsY2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSm9aV3hrTFdKNVhDSXNJSEJzWVhsbGNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmpiMjl5WkdsdVlYUmxjeUJ2WmlCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHREYjI5eVpHbHVZWFJsYzN4dWRXeHNmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjI5eVpHbHVZWFJsY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnUFQwOUlIUm9hWE11ZUNCOGZDQnVkV3hzSUQwOVBTQjBhR2x6TG5rZ1B5QnVkV3hzSURvZ2UzZzZJSFJvYVhNdWVDd2dlVG9nZEdocGN5NTVmVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJR052YjNKa2FXNWhkR1Z6S0dNcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUdNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVlQ0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JqTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1NElEMGdlRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZVNBOUlIazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJFYjJWeklIUm9hWE1nUkdsbElHaGhkbVVnWTI5dmNtUnBibUYwWlhNL1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0Q2IyOXNaV0Z1ZlNCVWNuVmxJSGRvWlc0Z2RHaGxJRVJwWlNCa2IyVnpJR2hoZG1VZ1kyOXZjbVJwYm1GMFpYTmNiaUFnSUNBZ0tpOWNiaUFnSUNCb1lYTkRiMjl5WkdsdVlYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dJVDA5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE03WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIZ2dZMjl2Y21ScGJtRjBaVnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2VDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjk0TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjMlYwSUhnb2JtVjNXQ2tnZTF4dUlDQWdJQ0FnSUNCZmVDNXpaWFFvZEdocGN5d2dibVYzV0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2llRndpTENCdVpYZFlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2VTQmpiMjl5WkdsdVlYUmxYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCNUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM2t1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnZVNodVpYZFpLU0I3WEc0Z0lDQWdJQ0FnSUY5NUxuTmxkQ2gwYUdsekxDQnVaWGRaS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1hDSjVYQ0lzSUc1bGQxa3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCeWIzUmhkR2x2YmlCdlppQjBhR2x6SUVScFpTNGdNQ0RpaWFRZ2NtOTBZWFJwYjI0ZzRvbWtJRE0yTUM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjhiblZzYkgxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2NtOTBZWFJwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZjbTkwWVhScGIyNHVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCelpYUWdjbTkwWVhScGIyNG9ibVYzVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnYm1WM1Vpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9YQ0p5YjNSaGRHbHZibHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHNXZjbTFoYkdsNlpXUlNiM1JoZEdsdmJpQTlJRzVsZDFJZ0pTQkRTVkpEVEVWZlJFVkhVa1ZGVXp0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl5YjNSaGRHbHZiaTV6WlhRb2RHaHBjeXdnYm05eWJXRnNhWHBsWkZKdmRHRjBhVzl1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRndpY205MFlYUnBiMjVjSWl3Z2JtOXliV0ZzYVhwbFpGSnZkR0YwYVc5dUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvY205M0lIUm9hWE1nUkdsbExpQlVhR1VnYm5WdFltVnlJRzltSUhCcGNITWdkRzhnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzRzSURFZzRvbWtJRzRnNG9ta0lEWXVYRzRnSUNBZ0lDb2dUMjVzZVNCa2FXTmxJSFJvWVhRZ1lYSmxJRzV2ZENCaVpXbHVaeUJvWld4a0lHTmhiaUJpWlNCMGFISnZkMjR1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBWm1seVpYTWdYQ0owYjNBNmRHaHliM2N0WkdsbFhDSWdkMmwwYUNCd1lYSmhiV1YwWlhKeklIUm9hWE1nUkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhSb2NtOTNTWFFvS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doZEdocGN5NXBjMGhsYkdRb0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhKaGJtUnZiVkJwY0hNb0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoUVNWQlRYMEZVVkZKSlFsVlVSU3dnZEdocGN5NXdhWEJ6S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZkR2h5YjNjdFpHbGxYQ0lzSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa1pYUmhhV3c2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsT2lCMGFHbHpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElIQnNZWGxsY2lCb2IyeGtjeUIwYUdseklFUnBaUzRnUVNCd2JHRjVaWElnWTJGdUlHOXViSGtnYUc5c1pDQmhJR1JwWlNCMGFHRjBJR2x6SUc1dmRGeHVJQ0FnSUNBcUlHSmxhVzVuSUdobGJHUWdZbmtnWVc1dmRHaGxjaUJ3YkdGNVpYSWdlV1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJR2h2YkdRZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbWh2YkdRdFpHbGxYQ0lnZDJsMGFDQndZWEpoYldWMFpYSnpJSFJvYVhNZ1JHbGxJR0Z1WkNCMGFHVWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdodmJHUkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDRjBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtaGxiR1JDZVNBOUlIQnNZWGxsY2p0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZhRzlzWkMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklIUm9hWE1nUkdsbElHSmxhVzVuSUdobGJHUWdZbmtnWVc1NUlIQnNZWGxsY2o5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBKdmIyeGxZVzU5SUZSeWRXVWdkMmhsYmlCMGFHbHpJRVJwWlNCcGN5QmlaV2x1WnlCb1pXeGtJR0o1SUdGdWVTQndiR0Y1WlhJc0lHWmhiSE5sSUc5MGFHVnlkMmx6WlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JwYzBobGJHUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lDRTlQU0IwYUdsekxtaGxiR1JDZVR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeUlISmxiR1ZoYzJWeklIUm9hWE1nUkdsbExpQkJJSEJzWVhsbGNpQmpZVzRnYjI1c2VTQnlaV3hsWVhObElHUnBZMlVnZEdoaGRDQnphR1VnYVhOY2JpQWdJQ0FnS2lCb2IyeGthVzVuTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJSEpsYkdWaGMyVWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb2dRR1pwY21WeklGd2lkRzl3T25KbGJHRnpaUzFrYVdWY0lpQjNhWFJvSUhCaGNtRnRaWFJsY25NZ2RHaHBjeUJFYVdVZ1lXNWtJSFJvWlNCd2JHRjVaWElnY21Wc1pXRnphVzVuSUdsMExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhKbGJHVmhjMlZKZENod2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdWFYTklaV3hrS0NrZ0ppWWdkR2hwY3k1b1pXeGtRbmt1WlhGMVlXeHpLSEJzWVhsbGNpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YUdWc1pFSjVJRDBnYm5Wc2JEdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFaEZURVJmUWxsZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dRM1Z6ZEc5dFJYWmxiblFvWENKMGIzQTZjbVZzWldGelpTMWthV1ZjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklIUm9hWE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnNZWGxsY2x4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGSmxibVJsY2lCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3UTJGdWRtRnpVbVZ1WkdWeWFXNW5RMjl1ZEdWNGRESkVmU0JqYjI1MFpYaDBJQzBnVkdobElHTmhiblpoY3lCamIyNTBaWGgwSUhSdklHUnlZWGRjYmlBZ0lDQWdLaUJ2Ymx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JrYVdWVGFYcGxJQzBnVkdobElITnBlbVVnYjJZZ1lTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI5eVpHbHVZWFJsY3lBOUlIUm9hWE11WTI5dmNtUnBibUYwWlhOZElDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZYRzRnSUNBZ0lDb2daSEpoZHlCMGFHbHpJR1JwWlM0Z1Fua2daR1ZtWVhWc2RDd2dkR2hwY3lCa2FXVWdhWE1nWkhKaGQyNGdZWFFnYVhSeklHOTNiaUJqYjI5eVpHbHVZWFJsY3l4Y2JpQWdJQ0FnS2lCaWRYUWdlVzkxSUdOaGJpQmhiSE52SUdSeVlYY2dhWFFnWld4elpYZG9aWEpsSUdsbUlITnZJRzVsWldSbFpDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCeVpXNWtaWElvWTI5dWRHVjRkQ3dnWkdsbFUybDZaU3dnWTI5dmNtUnBibUYwWlhNZ1BTQjBhR2x6TG1OdmIzSmthVzVoZEdWektTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElITmpZV3hsSUQwZ1pHbGxVMmw2WlNBdklFSkJVMFZmUkVsRlgxTkpXa1U3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRk5JUVV4R0lEMGdTRUZNUmlBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVkVoSlVrUWdQU0JVU0VsU1JDQXFJSE5qWVd4bE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCVFVFbFFYMU5KV2tVZ1BTQlFTVkJmVTBsYVJTQXFJSE5qWVd4bE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIdDRMQ0I1ZlNBOUlHTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaDBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSkliMnhrS0dOdmJuUmxlSFFzSUhnc0lIa3NJRk5JUVV4R0xDQjBhR2x6TG1obGJHUkNlUzVqYjJ4dmNpazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9NQ0FoUFQwZ2RHaHBjeTV5YjNSaGRHbHZiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNTBjbUZ1YzJ4aGRHVW9lQ0FySUZOSVFVeEdMQ0I1SUNzZ1UwaEJURVlwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXliM1JoZEdVb1pHVm5NbkpoWkNoMGFHbHpMbkp2ZEdGMGFXOXVLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuUnlZVzV6YkdGMFpTZ3RNU0FxSUNoNElDc2dVMGhCVEVZcExDQXRNU0FxSUNoNUlDc2dVMGhCVEVZcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGJtUmxja1JwWlNoamIyNTBaWGgwTENCNExDQjVMQ0JUU0VGTVJpd2dkR2hwY3k1amIyeHZjaWs3WEc1Y2JpQWdJQ0FnSUNBZ2MzZHBkR05vSUNoMGFHbHpMbkJwY0hNcElIdGNiaUFnSUNBZ0lDQWdZMkZ6WlNBeE9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURJNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdNem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUF5SUNvZ1UxUklTVkpFTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWTJGelpTQTBPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySURJZ0tpQlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpZWE5sSURVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFNFRk1SaXdnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHTmhjMlVnTmpvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QlRWRWhKVWtRc0lIa2dLeUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklESWdLaUJUVkVoSlVrUXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKUWFYQW9ZMjl1ZEdWNGRDd2dlQ0FySUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WdVpHVnlVR2x3S0dOdmJuUmxlSFFzSUhnZ0t5QXlJQ29nVTFSSVNWSkVMQ0I1SUNzZ01pQXFJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnTWlBcUlGTlVTRWxTUkN3Z2VTQXJJRk5JUVV4R0xDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1ZWFZzZERvZ0x5OGdUbThnYjNSb1pYSWdkbUZzZFdWeklHRnNiRzkzWldRZ0x5QndiM056YVdKc1pWeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnWTI5dWRHVjRkRnh1SUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbk5sZEZSeVlXNXpabTl5YlNneExDQXdMQ0F3TENBeExDQXdMQ0F3S1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzUzYVc1a2IzY3VZM1Z6ZEc5dFJXeGxiV1Z1ZEhNdVpHVm1hVzVsS0ZSQlIxOU9RVTFGTENCVWIzQkVhV1VwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBaU3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdVc1hHNGdJQ0FnVkVGSFgwNUJUVVZjYm4wN1hHNGlMQ0l2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ3dnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1THlvcVhHNGdLaUJBYlc5a2RXeGxYRzRnS2k5Y2JtbHRjRzl5ZENCN1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6ZlNCbWNtOXRJRndpTGk5dGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE11YW5OY0lqdGNibWx0Y0c5eWRDQjdkbUZzYVdSaGRHVjlJR1p5YjIwZ1hDSXVMM1poYkdsa1lYUmxMM1poYkdsa1lYUmxMbXB6WENJN1hHNWNibU52Ym5OMElGUkJSMTlPUVUxRklEMGdYQ0owYjNBdGNHeGhlV1Z5WENJN1hHNWNiaTh2SUZSb1pTQnVZVzFsY3lCdlppQjBhR1VnS0c5aWMyVnlkbVZrS1NCaGRIUnlhV0oxZEdWeklHOW1JSFJvWlNCVWIzQlFiR0Y1WlhJdVhHNWpiMjV6ZENCRFQweFBVbDlCVkZSU1NVSlZWRVVnUFNCY0ltTnZiRzl5WENJN1hHNWpiMjV6ZENCT1FVMUZYMEZVVkZKSlFsVlVSU0E5SUZ3aWJtRnRaVndpTzF4dVkyOXVjM1FnVTBOUFVrVmZRVlJVVWtsQ1ZWUkZJRDBnWENKelkyOXlaVndpTzF4dVkyOXVjM1FnU0VGVFgxUlZVazVmUVZSVVVrbENWVlJGSUQwZ1hDSm9ZWE10ZEhWeWJsd2lPMXh1WEc0dkx5QlVhR1VnY0hKcGRtRjBaU0J3Y205d1pYSjBhV1Z6SUc5bUlIUm9aU0JVYjNCUWJHRjVaWElnWEc1amIyNXpkQ0JmWTI5c2IzSWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyNWhiV1VnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM05qYjNKbElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5b1lYTlVkWEp1SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYmx4dUx5b3FYRzRnS2lCQklGQnNZWGxsY2lCcGJpQmhJR1JwWTJVZ1oyRnRaUzVjYmlBcVhHNGdLaUJCSUhCc1lYbGxjaWR6SUc1aGJXVWdjMmh2ZFd4a0lHSmxJSFZ1YVhGMVpTQnBiaUIwYUdVZ1oyRnRaUzRnVkhkdklHUnBabVpsY21WdWRGeHVJQ29nVkc5d1VHeGhlV1Z5SUdWc1pXMWxiblJ6SUhkcGRHZ2dkR2hsSUhOaGJXVWdibUZ0WlNCaGRIUnlhV0oxZEdVZ1lYSmxJSFJ5WldGMFpXUWdZWE5jYmlBcUlIUm9aU0J6WVcxbElIQnNZWGxsY2k1Y2JpQXFYRzRnS2lCSmJpQm5aVzVsY21Gc0lHbDBJR2x6SUhKbFkyOXRiV1Z1WkdWa0lIUm9ZWFFnYm04Z2RIZHZJSEJzWVhsbGNuTWdaRzhnYUdGMlpTQjBhR1VnYzJGdFpTQmpiMnh2Y2l4Y2JpQXFJR0ZzZEdodmRXZG9JR2wwSUdseklHNXZkQ0IxYm1OdmJtTmxhWFpoWW14bElIUm9ZWFFnWTJWeWRHRnBiaUJrYVdObElHZGhiV1Z6SUdoaGRtVWdjR3hoZVdWeWN5QjNiM0pyWEc0Z0tpQnBiaUIwWldGdGN5QjNhR1Z5WlNCcGRDQjNiM1ZzWkNCdFlXdGxJSE5sYm5ObElHWnZjaUIwZDI4Z2IzSWdiVzl5WlNCa2FXWm1aWEpsYm5RZ2NHeGhlV1Z5Y3lCMGIxeHVJQ29nYUdGMlpTQjBhR1VnYzJGdFpTQmpiMnh2Y2k1Y2JpQXFYRzRnS2lCVWFHVWdibUZ0WlNCaGJtUWdZMjlzYjNJZ1lYUjBjbWxpZFhSbGN5QmhjbVVnY21WeGRXbHlaV1F1SUZSb1pTQnpZMjl5WlNCaGJtUWdhR0Z6TFhSMWNtNWNiaUFxSUdGMGRISnBZblYwWlhNZ1lYSmxJRzV2ZEM1Y2JpQXFYRzRnS2lCQVpYaDBaVzVrY3lCSVZFMU1SV3hsYldWdWRGeHVJQ29nUUcxcGVHVnpJRzF2WkhWc1pUcHRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOK1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNGdLaTljYm1OdmJuTjBJRlJ2Y0ZCc1lYbGxjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpLRWhVVFV4RmJHVnRaVzUwS1NCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1VHeGhlV1Z5TENCdmNIUnBiMjVoYkd4NUlHSmhjMlZrSUc5dUlHRnVJR2x1ZEdsMGFXRnNYRzRnSUNBZ0lDb2dZMjl1Wm1sbmRYSmhkR2x2YmlCMmFXRWdZVzRnYjJKcVpXTjBJSEJoY21GdFpYUmxjaUJ2Y2lCa1pXTnNZWEpsWkNCaGRIUnlhV0oxZEdWeklHbHVJRWhVVFV3dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnVzJOdmJtWnBaMTBnTFNCQmJpQnBibWwwYVdGc0lHTnZibVpwWjNWeVlYUnBiMjRnWm05eUlIUm9aVnh1SUNBZ0lDQXFJSEJzWVhsbGNpQjBieUJqY21WaGRHVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHTnZibVpwWnk1amIyeHZjaUF0SUZSb2FYTWdjR3hoZVdWeUozTWdZMjlzYjNJZ2RYTmxaQ0JwYmlCMGFHVWdaMkZ0WlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnWTI5dVptbG5MbTVoYldVZ0xTQlVhR2x6SUhCc1lYbGxjaWR6SUc1aGJXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWMyTnZjbVZkSUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ6WTI5eVpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwSnZiMnhsWVc1OUlGdGpiMjVtYVdjdWFHRnpWSFZ5YmwwZ0xTQlVhR2x6SUhCc1lYbGxjaUJvWVhNZ1lTQjBkWEp1TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0h0amIyeHZjaXdnYm1GdFpTd2djMk52Y21Vc0lHaGhjMVIxY201OUlEMGdlMzBwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvS1R0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCamIyeHZjbFpoYkhWbElEMGdkbUZzYVdSaGRHVXVZMjlzYjNJb1kyOXNiM0lnZkh3Z2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1EwOU1UMUpmUVZSVVVrbENWVlJGS1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hqYjJ4dmNsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlqYjJ4dmNpNXpaWFFvZEdocGN5d2dZMjlzYjNKV1lXeDFaUzUyWVd4MVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUhSb2FYTXVZMjlzYjNJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loY0lrRWdVR3hoZVdWeUlHNWxaV1J6SUdFZ1kyOXNiM0lzSUhkb2FXTm9JR2x6SUdFZ1UzUnlhVzVuTGx3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzVoYldWV1lXeDFaU0E5SUhaaGJHbGtZWFJsTG5OMGNtbHVaeWh1WVcxbElIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRTVCVFVWZlFWUlVVa2xDVlZSRktTazdYRzRnSUNBZ0lDQWdJR2xtSUNodVlXMWxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDI1aGJXVXVjMlYwS0hSb2FYTXNJRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVGtGTlJWOUJWRlJTU1VKVlZFVXNJSFJvYVhNdWJtRnRaU2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlLRndpUVNCUWJHRjVaWElnYm1WbFpITWdZU0J1WVcxbExDQjNhR2xqYUNCcGN5QmhJRk4wY21sdVp5NWNJaWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCelkyOXlaVlpoYkhWbElEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaHpZMjl5WlNCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVcEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0hOamIzSmxWbUZzZFdVdWFYTldZV3hwWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNOamIzSmxMbk5sZENoMGFHbHpMQ0J6WTI5eVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVjMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QydGhlUzRnUVNCd2JHRjVaWElnWkc5bGN5QnViM1FnYm1WbFpDQjBieUJvWVhabElHRWdjMk52Y21VdVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYzJOdmNtVXVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGhjMVIxY201V1lXeDFaU0E5SUhaaGJHbGtZWFJsTG1KdmIyeGxZVzRvYUdGelZIVnliaUI4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1selZISjFaU2dwTzF4dUlDQWdJQ0FnSUNCcFppQW9hR0Z6VkhWeWJsWmhiSFZsTG1selZtRnNhV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlvWVhOVWRYSnVMbk5sZENoMGFHbHpMQ0JvWVhOVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTd2dhR0Z6VkhWeWJpazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBhMkY1TENCQklIQnNZWGxsY2lCa2IyVnpJRzV2ZENCaGJIZGhlWE1nYUdGMlpTQmhJSFIxY200dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnYm5Wc2JDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1JoZEdsaklHZGxkQ0J2WW5ObGNuWmxaRUYwZEhKcFluVjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYlhHNGdJQ0FnSUNBZ0lDQWdJQ0JEVDB4UFVsOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCT1FVMUZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGTkRUMUpGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSVnh1SUNBZ0lDQWdJQ0JkTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdocGN5QndiR0Y1WlhJbmN5QnVZVzFsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMU4wY21sdVozMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdibUZ0WlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXVZVzFsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJSEJzWVhsbGNpZHpJSE5qYjNKbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYzJOdmNtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lEMDlQU0JmYzJOdmNtVXVaMlYwS0hSb2FYTXBJRDhnTUNBNklGOXpZMjl5WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCelkyOXlaU2h1WlhkVFkyOXlaU2tnZTF4dUlDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1bGQxTmpiM0psS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDFOamIzSmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGTENCdVpYZFRZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRkR0Z5ZENCaElIUjFjbTRnWm05eUlIUm9hWE1nY0d4aGVXVnlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdWRzl3VUd4aGVXVnlmU0JVYUdVZ2NHeGhlV1Z5SUhkcGRHZ2dZU0IwZFhKdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnYzNSaGNuUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NXBjME52Ym01bFkzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1d1lYSmxiblJPYjJSbExtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFTjFjM1J2YlVWMlpXNTBLRndpZEc5d09uTjBZWEowTFhSMWNtNWNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhJNklIUm9hWE5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gyaGhjMVIxY200dWMyVjBLSFJvYVhNc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkZibVFnWVNCMGRYSnVJR1p2Y2lCMGFHbHpJSEJzWVhsbGNpNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbGJtUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2diblZzYkNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QjBhR2x6SUhCc1lYbGxjaUJvWVhabElHRWdkSFZ5Ymo5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWVhOVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpTQTlQVDBnWDJoaGMxUjFjbTR1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVFZ1UzUnlhVzVuSUhKbGNISmxjMlZ1ZEdGMGFXOXVJRzltSUhSb2FYTWdjR3hoZVdWeUxDQm9hWE1nYjNJZ2FHVnljeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdjR3hoZVdWeUozTWdibUZ0WlNCeVpYQnlaWE5sYm5SeklIUm9aU0J3YkdGNVpYSWdZWE1nWVNCemRISnBibWN1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJnSkh0MGFHbHpMbTVoYldWOVlEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkpjeUIwYUdseklIQnNZWGxsY2lCbGNYVmhiQ0JoYm05MGFHVnlJSEJzWVhsbGNqOWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UxUnZjRkJzWVhsbGNuMGdiM1JvWlhJZ0xTQlVhR1VnYjNSb1pYSWdjR3hoZVdWeUlIUnZJR052YlhCaGNtVWdkR2hwY3lCd2JHRjVaWElnZDJsMGFDNWNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdENiMjlzWldGdWZTQlVjblZsSUhkb1pXNGdaV2wwYUdWeUlIUm9aU0J2WW1wbFkzUWdjbVZtWlhKbGJtTmxjeUJoY21VZ2RHaGxJSE5oYldWY2JpQWdJQ0FnS2lCdmNpQjNhR1Z1SUdKdmRHZ2dibUZ0WlNCaGJtUWdZMjlzYjNJZ1lYSmxJSFJvWlNCellXMWxMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHVnhkV0ZzY3lodmRHaGxjaWtnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J1WVcxbElEMGdYQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUc5MGFHVnlJRDhnYjNSb1pYSWdPaUJ2ZEdobGNpNXVZVzFsTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYjNSb1pYSWdQVDA5SUhSb2FYTWdmSHdnYm1GdFpTQTlQVDBnZEdocGN5NXVZVzFsTzF4dUlDQWdJSDFjYm4wN1hHNWNibmRwYm1SdmR5NWpkWE4wYjIxRmJHVnRaVzUwY3k1a1pXWnBibVVvVkVGSFgwNUJUVVVzSUZSdmNGQnNZWGxsY2lrN1hHNWNiaThxS2x4dUlDb2dWR2hsSUdSbFptRjFiSFFnYzNsemRHVnRJSEJzWVhsbGNpNGdSR2xqWlNCaGNtVWdkR2h5YjNkdUlHSjVJR0VnY0d4aGVXVnlMaUJHYjNJZ2MybDBkV0YwYVc5dWMxeHVJQ29nZDJobGNtVWdlVzkxSUhkaGJuUWdkRzhnY21WdVpHVnlJR0VnWW5WdVkyZ2diMllnWkdsalpTQjNhWFJvYjNWMElHNWxaV1JwYm1jZ2RHaGxJR052Ym1ObGNIUWdiMllnVUd4aGVXVnljMXh1SUNvZ2RHaHBjeUJFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJZ1kyRnVJR0psSUdFZ2MzVmljM1JwZEhWMFpTNGdUMllnWTI5MWNuTmxMQ0JwWmlCNWIzVW5aQ0JzYVd0bElIUnZYRzRnS2lCamFHRnVaMlVnZEdobElHNWhiV1VnWVc1a0wyOXlJSFJvWlNCamIyeHZjaXdnWTNKbFlYUmxJR0Z1WkNCMWMyVWdlVzkxY2lCdmQyNGdYQ0p6ZVhOMFpXMGdjR3hoZVdWeVhDSXVYRzRnS2lCQVkyOXVjM1JjYmlBcUwxeHVZMjl1YzNRZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNJRDBnYm1WM0lGUnZjRkJzWVhsbGNpaDdZMjlzYjNJNklGd2ljbVZrWENJc0lHNWhiV1U2SUZ3aUtsd2lmU2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5TEZ4dUlDQWdJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWl4Y2JpQWdJQ0JVUVVkZlRrRk5SVnh1ZlR0Y2JpSXNJaThxS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTBSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVpd2dWRUZIWDA1QlRVVWdZWE1nVkU5UVgxQk1RVmxGVW4wZ1puSnZiU0JjSWk0dlZHOXdVR3hoZVdWeUxtcHpYQ0k3WEc1Y2JtTnZibk4wSUZSQlIxOU9RVTFGSUQwZ1hDSjBiM0F0Y0d4aGVXVnlMV3hwYzNSY0lqdGNibHh1THlvcVhHNGdLaUJVYjNCUWJHRjVaWEpNYVhOMElIUnZJR1JsYzJOeWFXSmxJSFJvWlNCd2JHRjVaWEp6SUdsdUlIUm9aU0JuWVcxbExseHVJQ3BjYmlBcUlFQmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBYRzRnS2k5Y2JtTnZibk4wSUZSdmNGQnNZWGxsY2t4cGMzUWdQU0JqYkdGemN5QmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBJSHRjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOeVpXRjBaU0JoSUc1bGR5QlViM0JRYkdGNVpYSk1hWE4wTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0NrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lncE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBK1BTQjBhR2x6TG5Cc1lYbGxjbk11YkdWdVozUm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1Gd2NHVnVaRU5vYVd4a0tFUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVaWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzQTZjM1JoY25RdGRIVnlibHdpTENBb1pYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklFOXViSGtnYjI1bElIQnNZWGxsY2lCallXNGdhR0YyWlNCaElIUjFjbTRnWVhRZ1lXNTVJR2RwZG1WdUlIUnBiV1V1WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5Cc1lYbGxjbk5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F1Wm1sc2RHVnlLSEFnUFQ0Z0lYQXVaWEYxWVd4ektHVjJaVzUwTG1SbGRHRnBiQzV3YkdGNVpYSXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzVtYjNKRllXTm9LSEFnUFQ0Z2NDNWxibVJVZFhKdUtDa3BPMXh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JrYVhOamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnY0d4aGVXVnljeUJwYmlCMGFHbHpJR3hwYzNRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Vkc5d1VHeGhlV1Z5VzExOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElIQnNZWGxsY25Nb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmJMaTR1ZEdocGN5NW5aWFJGYkdWdFpXNTBjMEo1VkdGblRtRnRaU2hVVDFCZlVFeEJXVVZTS1YwN1hHNGdJQ0FnZlZ4dWZUdGNibHh1ZDJsdVpHOTNMbU4xYzNSdmJVVnNaVzFsYm5SekxtUmxabWx1WlNoVVFVZGZUa0ZOUlN3Z1ZHOXdVR3hoZVdWeVRHbHpkQ2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1VHeGhlV1Z5VEdsemRDeGNiaUFnSUNCVVFVZGZUa0ZOUlZ4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNHZMMmx0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1IzSnBaRXhoZVc5MWRIMGdabkp2YlNCY0lpNHZSM0pwWkV4aGVXOTFkQzVxYzF3aU8xeHVhVzF3YjNKMElIdFViM0JFYVdWOUlHWnliMjBnWENJdUwxUnZjRVJwWlM1cWMxd2lPMXh1YVcxd2IzSjBJSHRFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJc0lGUnZjRkJzWVhsbGNuMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UxUkJSMTlPUVUxRklHRnpJRlJQVUY5UVRFRlpSVkpmVEVsVFZIMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlUR2x6ZEM1cWMxd2lPMXh1YVcxd2IzSjBJSHQyWVd4cFpHRjBaWDBnWm5KdmJTQmNJaTR2ZG1Gc2FXUmhkR1V2ZG1Gc2FXUmhkR1V1YW5OY0lqdGNibHh1WTI5dWMzUWdWRUZIWDA1QlRVVWdQU0JjSW5SdmNDMWthV05sTFdKdllYSmtYQ0k3WEc1Y2JtTnZibk4wSUVSRlJrRlZURlJmUkVsRlgxTkpXa1VnUFNBeE1EQTdJQzh2SUhCNFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBoUFRFUmZSRlZTUVZSSlQwNGdQU0F6TnpVN0lDOHZJRzF6WEc1amIyNXpkQ0JFUlVaQlZVeFVYMFJTUVVkSFNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRZ1BTQm1ZV3h6WlR0Y2JtTnZibk4wSUVSRlJrRlZURlJmU0U5TVJFbE9SMTlFU1VORlgwUkpVMEZDVEVWRUlEMGdabUZzYzJVN1hHNWpiMjV6ZENCRVJVWkJWVXhVWDFKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUWdQU0JtWVd4elpUdGNibHh1WTI5dWMzUWdVazlYVXlBOUlERXdPMXh1WTI5dWMzUWdRMDlNVXlBOUlERXdPMXh1WEc1amIyNXpkQ0JFUlVaQlZVeFVYMWRKUkZSSUlEMGdRMDlNVXlBcUlFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVN0lDOHZJSEI0WEc1amIyNXpkQ0JFUlVaQlZVeFVYMGhGU1VkSVZDQTlJRkpQVjFNZ0tpQkVSVVpCVlV4VVgwUkpSVjlUU1ZwRk95QXZMeUJ3ZUZ4dVkyOXVjM1FnUkVWR1FWVk1WRjlFU1ZOUVJWSlRTVTlPSUQwZ1RXRjBhQzVtYkc5dmNpaFNUMWRUSUM4Z01pazdYRzVjYm1OdmJuTjBJRTFKVGw5RVJVeFVRU0E5SURNN0lDOHZjSGhjYmx4dVkyOXVjM1FnVjBsRVZFaGZRVlJVVWtsQ1ZWUkZJRDBnWENKM2FXUjBhRndpTzF4dVkyOXVjM1FnU0VWSlIwaFVYMEZVVkZKSlFsVlVSU0E5SUZ3aWFHVnBaMmgwWENJN1hHNWpiMjV6ZENCRVNWTlFSVkpUU1U5T1gwRlVWRkpKUWxWVVJTQTlJRndpWkdsemNHVnljMmx2Ymx3aU8xeHVZMjl1YzNRZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRklEMGdYQ0prYVdVdGMybDZaVndpTzF4dVkyOXVjM1FnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW1SeVlXZG5hVzVuTFdScFkyVXRaR2x6WVdKc1pXUmNJanRjYm1OdmJuTjBJRWhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbWh2YkdScGJtY3RaR2xqWlMxa2FYTmhZbXhsWkZ3aU8xeHVZMjl1YzNRZ1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0luSnZkR0YwYVc1bkxXUnBZMlV0WkdsellXSnNaV1JjSWp0Y2JtTnZibk4wSUVoUFRFUmZSRlZTUVZSSlQwNWZRVlJVVWtsQ1ZWUkZJRDBnWENKb2IyeGtMV1IxY21GMGFXOXVYQ0k3WEc1Y2JtTnZibk4wSUhCaGNuTmxUblZ0WW1WeUlEMGdLRzUxYldKbGNsTjBjbWx1Wnl3Z1pHVm1ZWFZzZEU1MWJXSmxjaUE5SURBcElEMCtJSHRjYmlBZ0lDQmpiMjV6ZENCdWRXMWlaWElnUFNCd1lYSnpaVWx1ZENodWRXMWlaWEpUZEhKcGJtY3NJREV3S1R0Y2JpQWdJQ0J5WlhSMWNtNGdUblZ0WW1WeUxtbHpUbUZPS0c1MWJXSmxjaWtnUHlCa1pXWmhkV3gwVG5WdFltVnlJRG9nYm5WdFltVnlPMXh1ZlR0Y2JseHVZMjl1YzNRZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJZ1BTQW9iblZ0WW1WeVUzUnlhVzVuTENCa1pXWmhkV3gwVm1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaHVkVzFpWlhKVGRISnBibWNwWEc0Z0lDQWdJQ0FnSUM1c1lYSm5aWEpVYUdGdUtEQXBYRzRnSUNBZ0lDQWdJQzVrWldaaGRXeDBWRzhvWkdWbVlYVnNkRlpoYkhWbEtWeHVJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNTlPMXh1WEc1amIyNXpkQ0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU0E5SUNobGJHVnRaVzUwTENCdVlXMWxMQ0JrWldaaGRXeDBWbUZzZFdVcElEMCtJSHRjYmlBZ0lDQnBaaUFvWld4bGJXVnVkQzVvWVhOQmRIUnlhV0oxZEdVb2JtRnRaU2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2RXVlRkSEpwYm1jZ1BTQmxiR1Z0Wlc1MExtZGxkRUYwZEhKcFluVjBaU2h1WVcxbEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtIWmhiSFZsVTNSeWFXNW5MQ0JrWldaaGRXeDBWbUZzZFdVcE8xeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dWZUdGNibHh1WTI5dWMzUWdaMlYwUW05dmJHVmhiaUE5SUNoaWIyOXNaV0Z1VTNSeWFXNW5MQ0IwY25WbFZtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTa2dQVDRnZTF4dUlDQWdJR2xtSUNoMGNuVmxWbUZzZFdVZ1BUMDlJR0p2YjJ4bFlXNVRkSEpwYm1jZ2ZId2dYQ0owY25WbFhDSWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlNCbGJITmxJR2xtSUNoY0ltWmhiSE5sWENJZ1BUMDlJR0p2YjJ4bFlXNVRkSEpwYm1jcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmtaV1poZFd4MFZtRnNkV1U3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVZMjl1YzNRZ1oyVjBRbTl2YkdWaGJrRjBkSEpwWW5WMFpTQTlJQ2hsYkdWdFpXNTBMQ0J1WVcxbExDQmtaV1poZFd4MFZtRnNkV1VwSUQwK0lIdGNiaUFnSUNCcFppQW9aV3hsYldWdWRDNW9ZWE5CZEhSeWFXSjFkR1VvYm1GdFpTa3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkbUZzZFdWVGRISnBibWNnUFNCbGJHVnRaVzUwTG1kbGRFRjBkSEpwWW5WMFpTaHVZVzFsS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc0b2RtRnNkV1ZUZEhKcGJtY3NJRnQyWVd4MVpWTjBjbWx1Wnl3Z1hDSjBjblZsWENKZExDQmJYQ0ptWVd4elpWd2lYU3dnWkdWbVlYVnNkRlpoYkhWbEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnWkdWbVlYVnNkRlpoYkhWbE8xeHVmVHRjYmx4dUx5OGdVSEpwZG1GMFpTQndjbTl3WlhKMGFXVnpYRzVqYjI1emRDQmZZMkZ1ZG1GeklEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5c1lYbHZkWFFnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMk4xY25KbGJuUlFiR0Y1WlhJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYmx4dVkyOXVjM1FnWTI5dWRHVjRkQ0E5SUNoaWIyRnlaQ2tnUFQ0Z1gyTmhiblpoY3k1blpYUW9ZbTloY21RcExtZGxkRU52Ym5SbGVIUW9YQ0l5WkZ3aUtUdGNibHh1WTI5dWMzUWdaMlYwVW1WaFpIbEVhV05sSUQwZ0tHSnZZWEprS1NBOVBpQjdYRzRnSUNBZ2FXWWdLSFZ1WkdWbWFXNWxaQ0E5UFQwZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObExtZGxkQ2hpYjJGeVpDa3BJSHRjYmlBZ0lDQWdJQ0FnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sTG5ObGRDaGliMkZ5WkN3Z01DazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2NtVjBkWEp1SUY5dWRXMWlaWEpQWmxKbFlXUjVSR2xqWlM1blpYUW9ZbTloY21RcE8xeHVmVHRjYmx4dVkyOXVjM1FnZFhCa1lYUmxVbVZoWkhsRWFXTmxJRDBnS0dKdllYSmtMQ0IxY0dSaGRHVXBJRDArSUh0Y2JpQWdJQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1YzJWMEtHSnZZWEprTENCblpYUlNaV0ZrZVVScFkyVW9ZbTloY21RcElDc2dkWEJrWVhSbEtUdGNibjA3WEc1Y2JtTnZibk4wSUdselVtVmhaSGtnUFNBb1ltOWhjbVFwSUQwK0lHZGxkRkpsWVdSNVJHbGpaU2hpYjJGeVpDa2dQVDA5SUdKdllYSmtMbVJwWTJVdWJHVnVaM1JvTzF4dVhHNWpiMjV6ZENCMWNHUmhkR1ZDYjJGeVpDQTlJQ2hpYjJGeVpDd2daR2xqWlNBOUlHSnZZWEprTG1ScFkyVXBJRDArSUh0Y2JpQWdJQ0JwWmlBb2FYTlNaV0ZrZVNoaWIyRnlaQ2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1WTJ4bFlYSlNaV04wS0RBc0lEQXNJR0p2WVhKa0xuZHBaSFJvTENCaWIyRnlaQzVvWldsbmFIUXBPMXh1WEc0Z0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1pHbGxJRzltSUdScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUnBaUzV5Wlc1a1pYSW9ZMjl1ZEdWNGRDaGliMkZ5WkNrc0lHSnZZWEprTG1ScFpWTnBlbVVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dWZUdGNibHh1WEc0dkx5QkpiblJsY21GamRHbHZiaUJ6ZEdGMFpYTmNibU52Ym5OMElFNVBUa1VnUFNCVGVXMWliMndvWENKdWIxOXBiblJsY21GamRHbHZibHdpS1R0Y2JtTnZibk4wSUVoUFRFUWdQU0JUZVcxaWIyd29YQ0pvYjJ4a1hDSXBPMXh1WTI5dWMzUWdUVTlXUlNBOUlGTjViV0p2YkNoY0ltMXZkbVZjSWlrN1hHNWpiMjV6ZENCSlRrUkZWRVZTVFVsT1JVUWdQU0JUZVcxaWIyd29YQ0pwYm1SbGRHVnliV2x1WldSY0lpazdYRzVqYjI1emRDQkVVa0ZIUjBsT1J5QTlJRk41YldKdmJDaGNJbVJ5WVdkbmFXNW5YQ0lwTzF4dVhHNHZMeUJOWlhSb2IyUnpJSFJ2SUdoaGJtUnNaU0JwYm5SbGNtRmpkR2x2Ymx4dVkyOXVjM1FnWTI5dWRtVnlkRmRwYm1SdmQwTnZiM0prYVc1aGRHVnpWRzlEWVc1MllYTWdQU0FvWTJGdWRtRnpMQ0I0VjJsdVpHOTNMQ0I1VjJsdVpHOTNLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdZMkZ1ZG1GelFtOTRJRDBnWTJGdWRtRnpMbWRsZEVKdmRXNWthVzVuUTJ4cFpXNTBVbVZqZENncE8xeHVYRzRnSUNBZ1kyOXVjM1FnZUNBOUlIaFhhVzVrYjNjZ0xTQmpZVzUyWVhOQ2IzZ3ViR1ZtZENBcUlDaGpZVzUyWVhNdWQybGtkR2dnTHlCallXNTJZWE5DYjNndWQybGtkR2dwTzF4dUlDQWdJR052Ym5OMElIa2dQU0I1VjJsdVpHOTNJQzBnWTJGdWRtRnpRbTk0TG5SdmNDQXFJQ2hqWVc1MllYTXVhR1ZwWjJoMElDOGdZMkZ1ZG1GelFtOTRMbWhsYVdkb2RDazdYRzVjYmlBZ0lDQnlaWFIxY200Z2UzZ3NJSGw5TzF4dWZUdGNibHh1WTI5dWMzUWdjMlYwZFhCSmJuUmxjbUZqZEdsdmJpQTlJQ2hpYjJGeVpDa2dQVDRnZTF4dUlDQWdJR052Ym5OMElHTmhiblpoY3lBOUlGOWpZVzUyWVhNdVoyVjBLR0p2WVhKa0tUdGNibHh1SUNBZ0lDOHZJRk5sZEhWd0lHbHVkR1Z5WVdOMGFXOXVYRzRnSUNBZ2JHVjBJRzl5YVdkcGJpQTlJSHQ5TzF4dUlDQWdJR3hsZENCemRHRjBaU0E5SUU1UFRrVTdYRzRnSUNBZ2JHVjBJSE4wWVhScFkwSnZZWEprSUQwZ2JuVnNiRHRjYmlBZ0lDQnNaWFFnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0J1ZFd4c08xeHVJQ0FnSUd4bGRDQm9iMnhrVkdsdFpXOTFkQ0E5SUc1MWJHdzdYRzVjYmlBZ0lDQmpiMjV6ZENCb2IyeGtSR2xsSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9TRTlNUkNBOVBUMGdjM1JoZEdVZ2ZId2dTVTVFUlZSRlVrMUpUa1ZFSUQwOVBTQnpkR0YwWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2RHOW5aMnhsSUdodmJHUWdMeUJ5Wld4bFlYTmxYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J3YkdGNVpYSlhhWFJvUVZSMWNtNGdQU0JpYjJGeVpDNXhkV1Z5ZVZObGJHVmpkRzl5S0Z3aWRHOXdMWEJzWVhsbGNpMXNhWE4wSUhSdmNDMXdiR0Y1WlhKYmFHRnpMWFIxY201ZFhDSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1JwWlZWdVpHVnlRM1Z5YzI5eUxtbHpTR1ZzWkNncEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWNtVnNaV0Z6WlVsMEtIQnNZWGxsY2xkcGRHaEJWSFZ5YmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtaHZiR1JKZENod2JHRjVaWEpYYVhSb1FWUjFjbTRwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2MzUmhkR1VnUFNCT1QwNUZPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2hpYjJGeVpDazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCb2IyeGtWR2x0Wlc5MWRDQTlJRzUxYkd3N1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE4wWVhKMFNHOXNaR2x1WnlBOUlDZ3BJRDArSUh0Y2JpQWdJQ0FnSUNBZ2FHOXNaRlJwYldWdmRYUWdQU0IzYVc1a2IzY3VjMlYwVkdsdFpXOTFkQ2hvYjJ4a1JHbGxMQ0JpYjJGeVpDNW9iMnhrUkhWeVlYUnBiMjRwTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnpkRzl3U0c5c1pHbHVaeUE5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnZDJsdVpHOTNMbU5zWldGeVZHbHRaVzkxZENob2IyeGtWR2x0Wlc5MWRDazdYRzRnSUNBZ0lDQWdJR2h2YkdSVWFXMWxiM1YwSUQwZ2JuVnNiRHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJKYm5SbGNtRmpkR2x2YmlBOUlDaGxkbVZ1ZENrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JwWmlBb1RrOU9SU0E5UFQwZ2MzUmhkR1VwSUh0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYjNKcFoybHVJRDBnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhnNklHVjJaVzUwTG1Oc2FXVnVkRmdzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZVRvZ1pYWmxiblF1WTJ4cFpXNTBXVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1pHbGxWVzVrWlhKRGRYSnpiM0lnUFNCaWIyRnlaQzVzWVhsdmRYUXVaMlYwUVhRb1kyOXVkbVZ5ZEZkcGJtUnZkME52YjNKa2FXNWhkR1Z6Vkc5RFlXNTJZWE1vWTJGdWRtRnpMQ0JsZG1WdWRDNWpiR2xsYm5SWUxDQmxkbVZ1ZEM1amJHbGxiblJaS1NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRTl1YkhrZ2FXNTBaWEpoWTNScGIyNGdkMmwwYUNCMGFHVWdZbTloY21RZ2RtbGhJR0VnWkdsbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxJQ1ltSUNGaWIyRnlaQzVrYVhOaFlteGxaRVJ5WVdkbmFXNW5SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRWxPUkVWVVJWSk5TVTVGUkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoY25SSWIyeGthVzVuS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDZ2hZbTloY21RdVpHbHpZV0pzWldSSWIyeGthVzVuUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRHRjBaU0E5SUVoUFRFUTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYSjBTRzlzWkdsdVp5Z3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdUVTlXUlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0J6YUc5M1NXNTBaWEpoWTNScGIyNGdQU0FvWlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0JpYjJGeVpDNXNZWGx2ZFhRdVoyVjBRWFFvWTI5dWRtVnlkRmRwYm1SdmQwTnZiM0prYVc1aGRHVnpWRzlEWVc1MllYTW9ZMkZ1ZG1GekxDQmxkbVZ1ZEM1amJHbGxiblJZTENCbGRtVnVkQzVqYkdsbGJuUlpLU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaEVVa0ZIUjBsT1J5QTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmhiblpoY3k1emRIbHNaUzVqZFhKemIzSWdQU0JjSW1keVlXSmlhVzVuWENJN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9iblZzYkNBaFBUMGdaR2xsVlc1a1pYSkRkWEp6YjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6ZEhsc1pTNWpkWEp6YjNJZ1BTQmNJbWR5WVdKY0lqdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6ZEhsc1pTNWpkWEp6YjNJZ1BTQmNJbVJsWm1GMWJIUmNJanRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnRiM1psSUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoTlQxWkZJRDA5UFNCemRHRjBaU0I4ZkNCSlRrUkZWRVZTVFVsT1JVUWdQVDA5SUhOMFlYUmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJrWlhSbGNtMXBibVVnYVdZZ1lTQmthV1VnYVhNZ2RXNWtaWElnZEdobElHTjFjbk52Y2x4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnU1dkdWIzSmxJSE50WVd4c0lHMXZkbVZ0Wlc1MGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaSGdnUFNCTllYUm9MbUZpY3lodmNtbG5hVzR1ZUNBdElHVjJaVzUwTG1Oc2FXVnVkRmdwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIa2dQU0JOWVhSb0xtRmljeWh2Y21sbmFXNHVlU0F0SUdWMlpXNTBMbU5zYVdWdWRGa3BPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvVFVsT1gwUkZURlJCSUR3Z1pIZ2dmSHdnVFVsT1gwUkZURlJCSUR3Z1pIa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRVJTUVVkSFNVNUhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wYjNCSWIyeGthVzVuS0NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FXTmxWMmwwYUc5MWRFUnBaVlZ1WkdWeVEzVnljMjl5SUQwZ1ltOWhjbVF1WkdsalpTNW1hV3gwWlhJb1pHbGxJRDArSUdScFpTQWhQVDBnWkdsbFZXNWtaWEpEZFhKemIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0dKdllYSmtMQ0JrYVdObFYybDBhRzkxZEVScFpWVnVaR1Z5UTNWeWMyOXlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMGFXTkNiMkZ5WkNBOUlHTnZiblJsZUhRb1ltOWhjbVFwTG1kbGRFbHRZV2RsUkdGMFlTZ3dMQ0F3TENCallXNTJZWE11ZDJsa2RHZ3NJR05oYm5aaGN5NW9aV2xuYUhRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tFUlNRVWRIU1U1SElEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhnZ1BTQnZjbWxuYVc0dWVDQXRJR1YyWlc1MExtTnNhV1Z1ZEZnN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlU0E5SUc5eWFXZHBiaTU1SUMwZ1pYWmxiblF1WTJ4cFpXNTBXVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2UzZ3NJSGw5SUQwZ1pHbGxWVzVrWlhKRGRYSnpiM0l1WTI5dmNtUnBibUYwWlhNN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFFvWW05aGNtUXBMbkIxZEVsdFlXZGxSR0YwWVNoemRHRjBhV05DYjJGeVpDd2dNQ3dnTUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVmJtUmxja04xY25OdmNpNXlaVzVrWlhJb1kyOXVkR1Y0ZENoaWIyRnlaQ2tzSUdKdllYSmtMbVJwWlZOcGVtVXNJSHQ0T2lCNElDMGdaSGdzSUhrNklIa2dMU0JrZVgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOMGIzQkpiblJsY21GamRHbHZiaUE5SUNobGRtVnVkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQWhQVDBnWkdsbFZXNWtaWEpEZFhKemIzSWdKaVlnUkZKQlIwZEpUa2NnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUc5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSNUlEMGdiM0pwWjJsdUxua2dMU0JsZG1WdWRDNWpiR2xsYm5SWk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JrYVdWVmJtUmxja04xY25OdmNpNWpiMjl5WkdsdVlYUmxjenRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2MyNWhjRlJ2UTI5dmNtUnpJRDBnWW05aGNtUXViR0Y1YjNWMExuTnVZWEJVYnloN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxPaUJrYVdWVmJtUmxja04xY25OdmNpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjRPaUI0SUMwZ1pIZ3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlVG9nZVNBdElHUjVMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUc1bGQwTnZiM0prY3lBOUlHNTFiR3dnSVQwZ2MyNWhjRlJ2UTI5dmNtUnpJRDhnYzI1aGNGUnZRMjl2Y21SeklEb2dlM2dzSUhsOU8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaTVqYjI5eVpHbHVZWFJsY3lBOUlHNWxkME52YjNKa2N6dGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUM4dklFTnNaV0Z5SUhOMFlYUmxYRzRnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ2MzUmhkR1VnUFNCT1QwNUZPMXh1WEc0Z0lDQWdJQ0FnSUM4dklGSmxabkpsYzJnZ1ltOWhjbVE3SUZKbGJtUmxjaUJrYVdObFhHNGdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0tUdGNiaUFnSUNCOU8xeHVYRzVjYmlBZ0lDQXZMeUJTWldkcGMzUmxjaUIwYUdVZ1lXTjBkV0ZzSUdWMlpXNTBJR3hwYzNSbGJtVnljeUJrWldacGJtVmtJR0ZpYjNabExpQk5ZWEFnZEc5MVkyZ2daWFpsYm5SeklIUnZYRzRnSUNBZ0x5OGdaWEYxYVhaaGJHVnVkQ0J0YjNWelpTQmxkbVZ1ZEhNdUlFSmxZMkYxYzJVZ2RHaGxJRndpZEc5MVkyaGxibVJjSWlCbGRtVnVkQ0JrYjJWeklHNXZkQ0JvWVhabElHRmNiaUFnSUNBdkx5QmpiR2xsYm5SWUlHRnVaQ0JqYkdsbGJuUlpMQ0J5WldOdmNtUWdZVzVrSUhWelpTQjBhR1VnYkdGemRDQnZibVZ6SUdaeWIyMGdkR2hsSUZ3aWRHOTFZMmh0YjNabFhDSmNiaUFnSUNBdkx5QW9iM0lnWENKMGIzVmphSE4wWVhKMFhDSXBJR1YyWlc1MGN5NWNibHh1SUNBZ0lHeGxkQ0IwYjNWamFFTnZiM0prYVc1aGRHVnpJRDBnZTJOc2FXVnVkRmc2SURBc0lHTnNhV1Z1ZEZrNklEQjlPMXh1SUNBZ0lHTnZibk4wSUhSdmRXTm9NbTF2ZFhObFJYWmxiblFnUFNBb2JXOTFjMlZGZG1WdWRFNWhiV1VwSUQwK0lIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDaDBiM1ZqYUVWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHOTFZMmhGZG1WdWRDQW1KaUF3SUR3Z2RHOTFZMmhGZG1WdWRDNTBiM1ZqYUdWekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUh0amJHbGxiblJZTENCamJHbGxiblJaZlNBOUlIUnZkV05vUlhabGJuUXVkRzkxWTJobGMxc3dYVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYjNWamFFTnZiM0prYVc1aGRHVnpJRDBnZTJOc2FXVnVkRmdzSUdOc2FXVnVkRmw5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUUxdmRYTmxSWFpsYm5Rb2JXOTFjMlZGZG1WdWRFNWhiV1VzSUhSdmRXTm9RMjl2Y21ScGJtRjBaWE1wS1R0Y2JpQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzVmphSE4wWVhKMFhDSXNJSFJ2ZFdOb01tMXZkWE5sUlhabGJuUW9YQ0p0YjNWelpXUnZkMjVjSWlrcE8xeHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVmtiM2R1WENJc0lITjBZWEowU1c1MFpYSmhZM1JwYjI0cE8xeHVYRzRnSUNBZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmRXTm9iVzkyWlZ3aUxDQjBiM1ZqYURKdGIzVnpaVVYyWlc1MEtGd2liVzkxYzJWdGIzWmxYQ0lwS1R0Y2JpQWdJQ0FnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaVzF2ZG1WY0lpd2diVzkyWlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVSeVlXZG5hVzVuUkdsalpTQjhmQ0FoWW05aGNtUXVaR2x6WVdKc1pXUkliMnhrYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxiVzkyWlZ3aUxDQnphRzkzU1c1MFpYSmhZM1JwYjI0cE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaGxibVJjSWl3Z2RHOTFZMmd5Ylc5MWMyVkZkbVZ1ZENoY0ltMXZkWE5sZFhCY0lpa3BPMXh1SUNBZ0lHTmhiblpoY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWJXOTFjMlYxY0Z3aUxDQnpkRzl3U1c1MFpYSmhZM1JwYjI0cE8xeHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnZkWFJjSWl3Z2MzUnZjRWx1ZEdWeVlXTjBhVzl1S1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVkc5d1JHbGpaVUp2WVhKa0lHbHpJR0VnWTNWemRHOXRJRWhVVFV3Z1pXeGxiV1Z1ZENCMGJ5QnlaVzVrWlhJZ1lXNWtJR052Ym5SeWIyd2dZVnh1SUNvZ1pHbGpaU0JpYjJGeVpDNGdYRzRnS2x4dUlDb2dRR1Y0ZEdWdVpITWdTRlJOVEVWc1pXMWxiblJjYmlBcUwxeHVZMjl1YzNRZ1ZHOXdSR2xqWlVKdllYSmtJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkQ0I3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dWRzl3UkdsalpVSnZZWEprTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0NrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5OMGVXeGxMbVJwYzNCc1lYa2dQU0JjSW1sdWJHbHVaUzFpYkc5amExd2lPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnphR0ZrYjNjZ1BTQjBhR2x6TG1GMGRHRmphRk5vWVdSdmR5aDdiVzlrWlRvZ1hDSmpiRzl6WldSY0luMHBPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpZVzUyWVhNZ1BTQmtiMk4xYldWdWRDNWpjbVZoZEdWRmJHVnRaVzUwS0Z3aVkyRnVkbUZ6WENJcE8xeHVJQ0FnSUNBZ0lDQnphR0ZrYjNjdVlYQndaVzVrUTJocGJHUW9ZMkZ1ZG1GektUdGNibHh1SUNBZ0lDQWdJQ0JmWTJGdWRtRnpMbk5sZENoMGFHbHpMQ0JqWVc1MllYTXBPMXh1SUNBZ0lDQWdJQ0JmWTNWeWNtVnVkRkJzWVhsbGNpNXpaWFFvZEdocGN5d2dSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTS1R0Y2JpQWdJQ0FnSUNBZ1gyeGhlVzkxZEM1elpYUW9kR2hwY3l3Z2JtVjNJRWR5YVdSTVlYbHZkWFFvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkMmxrZEdnNklIUm9hWE11ZDJsa2RHZ3NYRzRnSUNBZ0lDQWdJQ0FnSUNCb1pXbG5hSFE2SUhSb2FYTXVhR1ZwWjJoMExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbFUybDZaVG9nZEdocGN5NWthV1ZUYVhwbExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsemNHVnljMmx2YmpvZ2RHaHBjeTVrYVhOd1pYSnphVzl1WEc0Z0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdjMlYwZFhCSmJuUmxjbUZqZEdsdmJpaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6ZEdGMGFXTWdaMlYwSUc5aWMyVnlkbVZrUVhSMGNtbGlkWFJsY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGdGNiaUFnSUNBZ0lDQWdJQ0FnSUZkSlJGUklYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaEZTVWRJVkY5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JFU1ZOUVJWSlRTVTlPWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRVJKUlY5VFNWcEZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JJVDB4RVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0U5TVJGOUVWVkpCVkVsUFRsOUJWRlJTU1VKVlZFVmNiaUFnSUNBZ0lDQWdYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmhkSFJ5YVdKMWRHVkRhR0Z1WjJWa1EyRnNiR0poWTJzb2JtRnRaU3dnYjJ4a1ZtRnNkV1VzSUc1bGQxWmhiSFZsS1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOaGJuWmhjeUE5SUY5allXNTJZWE11WjJWMEtIUm9hWE1wTzF4dUlDQWdJQ0FnSUNCemQybDBZMmdnS0c1aGJXVXBJSHRjYmlBZ0lDQWdJQ0FnWTJGelpTQlhTVVJVU0Y5QlZGUlNTVUpWVkVVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSGRwWkhSb0lEMGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSW9ibVYzVm1Gc2RXVXNJSEJoY25ObFRuVnRZbVZ5S0c5c1pGWmhiSFZsS1NCOGZDQkVSVVpCVlV4VVgxZEpSRlJJS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWJHRjViM1YwTG5kcFpIUm9JRDBnZDJsa2RHZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11YzJWMFFYUjBjbWxpZFhSbEtGZEpSRlJJWDBGVVZGSkpRbFZVUlN3Z2QybGtkR2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCSVJVbEhTRlJmUVZSVVVrbENWVlJGT2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQm9aV2xuYUhRZ1BTQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpaHVaWGRXWVd4MVpTd2djR0Z5YzJWT2RXMWlaWElvYjJ4a1ZtRnNkV1VwSUh4OElFUkZSa0ZWVEZSZlNFVkpSMGhVS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWJHRjViM1YwTG1obGFXZG9kQ0E5SUdobGFXZG9kRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmhiblpoY3k1elpYUkJkSFJ5YVdKMWRHVW9TRVZKUjBoVVgwRlVWRkpKUWxWVVJTd2dhR1ZwWjJoMEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdSRWxUVUVWU1UwbFBUbDlCVkZSU1NVSlZWRVU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUnBjM0JsY25OcGIyNGdQU0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxjaWh1WlhkV1lXeDFaU3dnY0dGeWMyVk9kVzFpWlhJb2IyeGtWbUZzZFdVcElIeDhJRVJGUmtGVlRGUmZSRWxUVUVWU1UwbFBUaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG14aGVXOTFkQzVrYVhOd1pYSnphVzl1SUQwZ1pHbHpjR1Z5YzJsdmJqdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FXVlRhWHBsSUQwZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2JtVjNWbUZzZFdVc0lIQmhjbk5sVG5WdFltVnlLRzlzWkZaaGJIVmxLU0I4ZkNCRVJVWkJWVXhVWDBSSlJWOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWJHRjViM1YwTG1ScFpWTnBlbVVnUFNCa2FXVlRhWHBsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCU1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pHbHpZV0pzWldSU2IzUmhkR2x2YmlBOUlIWmhiR2xrWVhSbExtSnZiMnhsWVc0b2JtVjNWbUZzZFdVc0lHZGxkRUp2YjJ4bFlXNG9iMnhrVm1Gc2RXVXNJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgxSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFwS1M1MllXeDFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbkp2ZEdGMFpTQTlJQ0ZrYVhOaFlteGxaRkp2ZEdGMGFXOXVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1ZWFZzZERvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1ZHaGxJSFpoYkhWbElHbHpJR1JsZEdWeWJXbHVaV1FnZDJobGJpQjFjMmx1WnlCMGFHVWdaMlYwZEdWeVhHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhWd1pHRjBaVUp2WVhKa0tIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNBdFpHbGxPbUZrWkdWa1hDSXNJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhWd1pHRjBaVkpsWVdSNVJHbGpaU2gwYUdsekxDQXhLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hwYzFKbFlXUjVLSFJvYVhNcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzQXRaR2xsT25KbGJXOTJaV1JjSWl3Z0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFVtVmhaSGxFYVdObEtIUm9hWE1zSUMweEtUdGNiaUFnSUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdRV3hzSUdScFkyVWdZbTloY21SeklHUnZJR2hoZG1VZ1lTQndiR0Y1WlhJZ2JHbHpkQzRnU1dZZ2RHaGxjbVVnYVhOdUozUWdiMjVsSUhsbGRDeGNiaUFnSUNBZ0lDQWdMeThnWTNKbFlYUmxJRzl1WlM1Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJSFJvYVhNdWNYVmxjbmxUWld4bFkzUnZjaWhjSW5SdmNDMXdiR0Y1WlhJdGJHbHpkRndpS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hrYjJOMWJXVnVkQzVqY21WaGRHVkZiR1Z0Wlc1MEtGd2lkRzl3TFhCc1lYbGxjaTFzYVhOMFhDSXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUdGa2IzQjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdSM0pwWkV4aGVXOTFkQ0IxYzJWa0lHSjVJSFJvYVhNZ1JHbGpaVUp2WVhKa0lIUnZJR3hoZVc5MWRDQjBhR1VnWkdsalpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0SGNtbGtUR0Y1YjNWMGZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnNZWGx2ZFhRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZiR0Y1YjNWMExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGlCT2IzUmxMQ0IwYnlCaFkzUjFZV3hzZVNCMGFISnZkeUIwYUdVZ1pHbGpaU0IxYzJWY2JpQWdJQ0FnS2lCN1FHeHBibXNnZEdoeWIzZEVhV05sZlM0Z1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Vkc5d1JHbGxXMTE5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiTGk0dWRHaHBjeTVuWlhSRmJHVnRaVzUwYzBKNVZHRm5UbUZ0WlNoY0luUnZjQzFrYVdWY0lpbGRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUhCMWRDQnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VG5WdFltVnlmU0JVYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pHbGpaU3dnTUNBOElHMWhlR2x0ZFcwdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHMWhlR2x0ZFcxT2RXMWlaWEpQWmtScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxteGhlVzkxZEM1dFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0IzYVdSMGFDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdkMmxrZEdnb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNrRjBkSEpwWW5WMFpTaDBhR2x6TENCWFNVUlVTRjlCVkZSU1NVSlZWRVVzSUVSRlJrRlZURlJmVjBsRVZFZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCb1pXbG5hSFFnYjJZZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXbG5hSFFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JJUlVsSFNGUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMGhGU1VkSVZDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdScGMzQmxjbk5wYjI0Z2JHVjJaV3dnYjJZZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FYTndaWEp6YVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1JFbFRVRVZTVTBsUFRsOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZSRWxUVUVWU1UwbFBUaWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElITnBlbVVnYjJZZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsbFUybDZaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRVJKUlY5VFNWcEZYMEZVVkZKSlFsVlVSU3dnUkVWR1FWVk1WRjlFU1VWZlUwbGFSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTJGdUlHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDQmlaU0JrY21GbloyVmtQMXh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVb2RHaHBjeXdnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyRnVJR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQ0JpWlNCb1pXeGtJR0o1SUdFZ1VHeGhlV1Z5UDF4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVhOaFlteGxaRWh2YkdScGJtZEVhV05sS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBRbTl2YkdWaGJrRjBkSEpwWW5WMFpTaDBhR2x6TENCSVQweEVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMGhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1NYTWdjbTkwWVhScGJtY2daR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtJR1JwYzJGaWJHVmtQMXh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthWE5oWW14bFpGSnZkR0YwYVc1blJHbGpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVb2RHaHBjeXdnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR1IxY21GMGFXOXVJR2x1SUcxeklIUnZJSEJ5WlhOeklIUm9aU0J0YjNWelpTQXZJSFJ2ZFdOb0lHRWdaR2xsSUdKbFptOXlaU0JwZENCaVpXdHZiV1Z6WEc0Z0lDQWdJQ29nYUdWc1pDQmllU0IwYUdVZ1VHeGhlV1Z5TGlCSmRDQm9ZWE1nYjI1c2VTQmhiaUJsWm1abFkzUWdkMmhsYmlCMGFHbHpMbWh2YkdSaFlteGxSR2xqWlNBOVBUMWNiaUFnSUNBZ0tpQjBjblZsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdhRzlzWkVSMWNtRjBhVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhKQmRIUnlhV0oxZEdVb2RHaHBjeXdnU0U5TVJGOUVWVkpCVkVsUFRsOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZTRTlNUkY5RVZWSkJWRWxQVGlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRlJ2Y0ZCc1lYbGxja3hwYzNRZ1pXeGxiV1Z1ZENCdlppQjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNGdTV1lnYVhRZ1pHOWxjeUJ1YjNRZ1pYaHBjM1FzWEc0Z0lDQWdJQ29nYVhRZ2QybHNiQ0JpWlNCamNtVmhkR1ZrTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMVJ2Y0ZCc1lYbGxja3hwYzNSOVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1gzQnNZWGxsY2t4cGMzUW9LU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQndiR0Y1WlhKTWFYTjBJRDBnZEdocGN5NXhkV1Z5ZVZObGJHVmpkRzl5S0ZSUFVGOVFURUZaUlZKZlRFbFRWQ2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUQwOVBTQndiR0Y1WlhKTWFYTjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhKTWFYTjBJRDBnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hVVDFCZlVFeEJXVVZTWDB4SlUxUXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhCc1lYbGxja3hwYzNRN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJSEJzWVhsbGNuTWdjR3hoZVdsdVp5QnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMVJ2Y0ZCc1lYbGxjbHRkZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCd2JHRjVaWEp6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmY0d4aGVXVnlUR2x6ZEM1d2JHRjVaWEp6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVGeklIQnNZWGxsY2l3Z2RHaHliM2NnZEdobElHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1ZHOXdVR3hoZVdWeWZTQmJjR3hoZVdWeUlEMGdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTWFNBdElGUm9aVnh1SUNBZ0lDQXFJSEJzWVhsbGNpQjBhR0YwSUdseklIUm9jbTkzYVc1bklIUm9aU0JrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRVYjNCRWFXVmJYWDBnVkdobElIUm9jbTkzYmlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RdUlGUm9hWE1nYkdsemRDQnZaaUJrYVdObElHbHpJSFJvWlNCellXMWxJR0Z6SUhSb2FYTWdWRzl3UkdsalpVSnZZWEprSjNNZ2UwQnpaV1VnWkdsalpYMGdjSEp2Y0dWeWRIbGNiaUFnSUNBZ0tpOWNiaUFnSUNCMGFISnZkMFJwWTJVb2NHeGhlV1Z5SUQwZ1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHdiR0Y1WlhJZ0ppWWdJWEJzWVhsbGNpNW9ZWE5VZFhKdUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2JHRjVaWEl1YzNSaGNuUlVkWEp1S0NrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdkR2hwY3k1a2FXTmxMbVp2Y2tWaFkyZ29aR2xsSUQwK0lHUnBaUzUwYUhKdmQwbDBLQ2twTzF4dUlDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaDBhR2x6TENCMGFHbHpMbXhoZVc5MWRDNXNZWGx2ZFhRb2RHaHBjeTVrYVdObEtTazdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1ScFkyVTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRV1JrSUdFZ1pHbGxJSFJ2SUhSb2FYTWdWRzl3UkdsalpVSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCRWFXVjhUMkpxWldOMGZTQmJZMjl1Wm1sbklEMGdlMzFkSUMwZ1ZHaGxJR1JwWlNCdmNpQmhJR052Ym1acFozVnlZWFJwYjI0Z2IyWmNiaUFnSUNBZ0tpQjBhR1VnWkdsbElIUnZJR0ZrWkNCMGJ5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY254dWRXeHNmU0JiWTI5dVptbG5MbkJwY0hOZElDMGdWR2hsSUhCcGNITWdiMllnZEdobElHUnBaU0IwYnlCaFpHUXVYRzRnSUNBZ0lDb2dTV1lnYm04Z2NHbHdjeUJoY21VZ2MzQmxZMmxtYVdWa0lHOXlJSFJvWlNCd2FYQnpJR0Z5WlNCdWIzUWdZbVYwZDJWbGJpQXhJR0Z1WkNBMkxDQmhJSEpoYm1SdmJWeHVJQ0FnSUNBcUlHNTFiV0psY2lCaVpYUjNaV1Z1SURFZ1lXNWtJRFlnYVhNZ1oyVnVaWEpoZEdWa0lHbHVjM1JsWVdRdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUZ0amIyNW1hV2N1WTI5c2IzSmRJQzBnVkdobElHTnZiRzl5SUc5bUlIUm9aU0JrYVdVZ2RHOGdZV1JrTGlCRVpXWmhkV3gwWEc0Z0lDQWdJQ29nZEc4Z2RHaGxJR1JsWm1GMWJIUWdZMjlzYjNJdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUZ0amIyNW1hV2N1ZUYwZ0xTQlVhR1VnZUNCamIyOXlaR2x1WVhSbElHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWVWMGdMU0JVYUdVZ2VTQmpiMjl5WkdsdVlYUmxJRzltSUhSb1pTQmthV1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJRnRqYjI1bWFXY3VjbTkwWVhScGIyNWRJQzBnVkdobElISnZkR0YwYVc5dUlHOW1JSFJvWlNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJRnRvWld4a1FubGRJQzBnVkdobElIQnNZWGxsY2lCb2IyeGthVzVuSUhSb1pTQmthV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRVYjNCRWFXVjlJRlJvWlNCaFpHUmxaQ0JrYVdVdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWVdSa1JHbGxLR052Ym1acFp5QTlJSHQ5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbUZ3Y0dWdVpFTm9hV3hrS0dOdmJtWnBaeUJwYm5OMFlXNWpaVzltSUZSdmNFUnBaU0EvSUdOdmJtWnBaeUE2SUc1bGR5QlViM0JFYVdVb1kyOXVabWxuS1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1VtVnRiM1psSUdScFpTQm1jbTl0SUhSb2FYTWdWRzl3UkdsalpVSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCRWFXVjlJR1JwWlNBdElGUm9aU0JrYVdVZ2RHOGdjbVZ0YjNabElHWnliMjBnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0J5WlcxdmRtVkVhV1VvWkdsbEtTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoa2FXVXVjR0Z5Wlc1MFRtOWtaU0FtSmlCa2FXVXVjR0Z5Wlc1MFRtOWtaU0E5UFQwZ2RHaHBjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZEYUdsc1pDaGthV1VwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1FXUmtJR0VnY0d4aGVXVnlJSFJ2SUhSb2FYTWdWRzl3UkdsalpVSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRVYjNCUWJHRjVaWEo4VDJKcVpXTjBmU0JqYjI1bWFXY2dMU0JVYUdVZ2NHeGhlV1Z5SUc5eUlHRWdZMjl1Wm1sbmRYSmhkR2x2YmlCdlppQmhYRzRnSUNBZ0lDb2djR3hoZVdWeUlIUnZJR0ZrWkNCMGJ5QjBhR2x6SUZSdmNFUnBZMlZDYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCRmNuSnZjaUIzYUdWdUlIUm9aU0J3YkdGNVpYSWdkRzhnWVdSa0lHTnZibVpzYVdOMGN5QjNhWFJvSUdFZ2NISmxMV1Y0YVhOMGFXNW5YRzRnSUNBZ0lDb2djR3hoZVdWeUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdVR3hoZVdWeWZTQlVhR1VnWVdSa1pXUWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdGa1pGQnNZWGxsY2loamIyNW1hV2NnUFNCN2ZTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZmNHeGhlV1Z5VEdsemRDNWhjSEJsYm1SRGFHbHNaQ2hqYjI1bWFXY2dhVzV6ZEdGdVkyVnZaaUJVYjNCUWJHRjVaWElnUHlCamIyNW1hV2NnT2lCdVpYY2dWRzl3VUd4aGVXVnlLR052Ym1acFp5a3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRkpsYlc5MlpTQndiR0Y1WlhJZ1puSnZiU0IwYUdseklGUnZjRVJwWTJWQ2IyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdWRzl3VUd4aGVXVnlmU0J3YkdGNVpYSWdMU0JVYUdVZ2NHeGhlV1Z5SUhSdklISmxiVzkyWlNCbWNtOXRJSFJvYVhNZ1ltOWhjbVF1WEc0Z0lDQWdJQ292WEc0Z0lDQWdjbVZ0YjNabFVHeGhlV1Z5S0hCc1lYbGxjaWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9jR3hoZVdWeUxuQmhjbVZ1ZEU1dlpHVWdKaVlnY0d4aGVXVnlMbkJoY21WdWRFNXZaR1VnUFQwOUlIUm9hWE11WDNCc1lYbGxja3hwYzNRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVYM0JzWVhsbGNreHBjM1F1Y21WdGIzWmxRMmhwYkdRb2NHeGhlV1Z5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVmVHRjYmx4dWQybHVaRzkzTG1OMWMzUnZiVVZzWlcxbGJuUnpMbVJsWm1sdVpTaFVRVWRmVGtGTlJTd2dWRzl3UkdsalpVSnZZWEprS1R0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCVWIzQkVhV05sUW05aGNtUXNYRzRnSUNBZ1JFVkdRVlZNVkY5RVNVVmZVMGxhUlN4Y2JpQWdJQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0c1hHNGdJQ0FnUkVWR1FWVk1WRjlYU1VSVVNDeGNiaUFnSUNCRVJVWkJWVXhVWDBoRlNVZElWQ3hjYmlBZ0lDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNHNYRzRnSUNBZ1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVMRnh1SUNBZ0lGUkJSMTlPUVUxRlhHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZHOXdSR2xqWlVKdllYSmtmU0JtY205dElGd2lMaTlVYjNCRWFXTmxRbTloY21RdWFuTmNJanRjYm1sdGNHOXlkQ0I3Vkc5d1JHbGxmU0JtY205dElGd2lMaTlVYjNCRWFXVXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeWZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeVRHbHpkSDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5VEdsemRDNXFjMXdpTzF4dVhHNTNhVzVrYjNjdWRIZGxiblI1YjI1bGNHbHdjeUE5SUhkcGJtUnZkeTUwZDJWdWRIbHZibVZ3YVhCeklIeDhJRTlpYW1WamRDNW1jbVZsZW1Vb2UxeHVJQ0FnSUZaRlVsTkpUMDQ2SUZ3aU1DNHdMakZjSWl4Y2JpQWdJQ0JNU1VORlRsTkZPaUJjSWt4SFVFd3RNeTR3WENJc1hHNGdJQ0FnVjBWQ1UwbFVSVG9nWENKb2RIUndjem92TDNSM1pXNTBlVzl1WlhCcGNITXViM0puWENJc1hHNGdJQ0FnVkc5d1JHbGpaVUp2WVhKa09pQlViM0JFYVdObFFtOWhjbVFzWEc0Z0lDQWdWRzl3UkdsbE9pQlViM0JFYVdVc1hHNGdJQ0FnVkc5d1VHeGhlV1Z5T2lCVWIzQlFiR0Y1WlhJc1hHNGdJQ0FnVkc5d1VHeGhlV1Z5VEdsemREb2dWRzl3VUd4aGVXVnlUR2x6ZEZ4dWZTazdYRzRpWFN3aWJtRnRaWE1pT2xzaVZFRkhYMDVCVFVVaUxDSjJZV3hwWkdGMFpTSXNJa05QVEU5U1gwRlVWRkpKUWxWVVJTSXNJbDlqYjJ4dmNpSXNJbFJQVUY5UVRFRlpSVklpTENKVVQxQmZVRXhCV1VWU1gweEpVMVFpWFN3aWJXRndjR2x1WjNNaU9pSkJRVUZCT3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFUWkNRU3hOUVVGTkxHdENRVUZyUWl4SFFVRkhMR05CUVdNc1MwRkJTeXhEUVVGRE96czdPenM3T3p0SlFWRXpReXhYUVVGWExFTkJRVU1zVDBGQlR5eEZRVUZGTzFGQlEycENMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dExRVU5zUWp0RFFVTktPenRCUTNoRFJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVVkJPenM3TzBGQlNVRXNUVUZCVFN4elFrRkJjMElzUjBGQlJ5eEhRVUZITEVOQlFVTTdPMEZCUlc1RExFMUJRVTBzWlVGQlpTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxPMGxCUXpOQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPME5CUTNKRkxFTkJRVU03T3p0QlFVZEdMRTFCUVUwc1RVRkJUU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETjBJc1RVRkJUU3hQUVVGUExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTVRaXhOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNMVFpeE5RVUZOTEZGQlFWRXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJReTlDTEUxQlFVMHNWMEZCVnl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGJFTXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6czdPenM3T3pzN096czdPenM3T3p0QlFXZENPVUlzVFVGQlRTeFZRVUZWTEVkQlFVY3NUVUZCVFRzN096czdPenRKUVU5eVFpeFhRVUZYTEVOQlFVTTdVVUZEVWl4TFFVRkxPMUZCUTB3c1RVRkJUVHRSUVVOT0xGVkJRVlU3VVVGRFZpeFBRVUZQTzB0QlExWXNSMEZCUnl4RlFVRkZMRVZCUVVVN1VVRkRTaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVOd1FpeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4wUWl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOeVFpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6czdVVUZGZUVJc1NVRkJTU3hEUVVGRExGVkJRVlVzUjBGQlJ5eFZRVUZWTEVOQlFVTTdVVUZETjBJc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eFBRVUZQTEVOQlFVTTdVVUZEZGtJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTTdVVUZEYmtJc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTTdTMEZEZUVJN096czdPenM3U1VGUFJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXpRanM3U1VGRlJDeEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRWQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZEVUN4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl3MlEwRkJOa01zUlVGQlJTeERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNdlJqdFJRVU5FTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMRWxCUVVrc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UzBGRGFFUTdPenM3T3pzN08wbEJVVVFzU1VGQlNTeE5RVUZOTEVkQlFVYzdVVUZEVkN4UFFVRlBMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETlVJN08wbEJSVVFzU1VGQlNTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTFZc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlExQXNUVUZCVFN4SlFVRkpMR3RDUVVGclFpeERRVUZETEVOQlFVTXNPRU5CUVRoRExFVkJRVVVzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRhRWM3VVVGRFJDeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRMmhFT3pzN096czdPenRKUVZGRUxFbEJRVWtzYlVKQlFXMUNMRWRCUVVjN1VVRkRkRUlzVDBGQlR5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03UzBGRGJFTTdPenM3T3pzN096czdTVUZWUkN4SlFVRkpMRlZCUVZVc1IwRkJSenRSUVVOaUxFOUJRVThzVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVOb1F6czdTVUZGUkN4SlFVRkpMRlZCUVZVc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFpDeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRVQ3hOUVVGTkxFbEJRVWtzYTBKQlFXdENMRU5CUVVNc1EwRkJReXhyUkVGQmEwUXNSVUZCUlN4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU53Unp0UlFVTkVMRTlCUVU4c1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRia003T3pzN096czdPMGxCVVVRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE4wSTdPMGxCUlVRc1NVRkJTU3hQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTzFGQlExb3NTVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hGUVVGRk8xbEJRMVFzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zSzBOQlFTdERMRVZCUVVVc1JVRkJSU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEYkVjN1VVRkRSQ3hSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVOMlFpeEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMHRCUTJoRU96dEpRVVZFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1RVRkJUU3hEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVNMVFpeFBRVUZQTEZOQlFWTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dExRVU55UXpzN1NVRkZSQ3hKUVVGSkxFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEVml4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjRRanM3T3pzN096czdTVUZSUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNeFFqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU14UWpzN096czdPenM3U1VGUlJDeEpRVUZKTEU5QlFVOHNSMEZCUnp0UlFVTldMRTFCUVUwc1IwRkJSeXhIUVVGSExHVkJRV1VzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5vUkN4TlFVRk5MRWRCUVVjc1IwRkJSeXhsUVVGbExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03TzFGQlJXaEVMRTlCUVU4c1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTTdTMEZEY2tJN096czdPenM3T3pzN096dEpRVmxFTEUxQlFVMHNRMEZCUXl4SlFVRkpMRVZCUVVVN1VVRkRWQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRzFDUVVGdFFpeEZRVUZGTzFsQlEzaERMRTFCUVUwc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRMSGxEUVVGNVF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6RkpPenRSUVVWRUxFMUJRVTBzYVVKQlFXbENMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRemRDTEUxQlFVMHNXVUZCV1N4SFFVRkhMRVZCUVVVc1EwRkJRenM3VVVGRmVFSXNTMEZCU3l4TlFVRk5MRWRCUVVjc1NVRkJTU3hKUVVGSkxFVkJRVVU3V1VGRGNFSXNTVUZCU1N4SFFVRkhMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZPenM3TzJkQ1FVbDBReXhwUWtGQmFVSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WVVGREwwSXNUVUZCVFR0blFrRkRTQ3haUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUXpGQ08xTkJRMG83TzFGQlJVUXNUVUZCVFN4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFVkJRVVVzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhEUVVGRExFTkJRVU03VVVGRE9VVXNUVUZCVFN4alFVRmpMRWRCUVVjc1NVRkJTU3hEUVVGRExITkNRVUZ6UWl4RFFVRkRMRWRCUVVjc1JVRkJSU3hwUWtGQmFVSXNRMEZCUXl4RFFVRkRPenRSUVVVelJTeExRVUZMTEUxQlFVMHNSMEZCUnl4SlFVRkpMRmxCUVZrc1JVRkJSVHRaUVVNMVFpeE5RVUZOTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03V1VGRGRFVXNUVUZCVFN4VlFVRlZMRWRCUVVjc1kwRkJZeXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETzFsQlF5OURMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPenRaUVVWMFF5eEhRVUZITEVOQlFVTXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRaUVVONFJDeEhRVUZITEVOQlFVTXNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFZEJRVWNzYzBKQlFYTkNMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRGRrWXNhVUpCUVdsQ0xFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMU5CUXk5Q096dFJRVVZFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxHbENRVUZwUWl4RFFVRkRMRU5CUVVNN08xRkJSVzVETEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU03UzBGRE5VSTdPenM3T3pzN096czdPMGxCVjBRc2MwSkJRWE5DTEVOQlFVTXNSMEZCUnl4RlFVRkZMR2xDUVVGcFFpeEZRVUZGTzFGQlF6TkRMRTFCUVUwc1UwRkJVeXhIUVVGSExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETlVJc1NVRkJTU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEyUXNUVUZCVFN4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6czdVVUZGYkVRc1QwRkJUeXhUUVVGVExFTkJRVU1zU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N4TFFVRkxMRWRCUVVjc1VVRkJVU3hGUVVGRk8xbEJRemRETEV0QlFVc3NUVUZCVFN4SlFVRkpMRWxCUVVrc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0blFrRkRNVU1zU1VGQlNTeFRRVUZUTEV0QlFVc3NTVUZCU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zU1VGQlNTeEZRVUZGTEdsQ1FVRnBRaXhEUVVGRExFVkJRVVU3YjBKQlEyeEZMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdhVUpCUTNaQ08yRkJRMG83TzFsQlJVUXNTMEZCU3l4RlFVRkZMRU5CUVVNN1UwRkRXRHM3VVVGRlJDeFBRVUZQTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03UzBGRGFFTTdPenM3T3pzN096czdPenRKUVZsRUxHRkJRV0VzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEYWtJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTjRRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRSUVVVMVFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4TFFVRkxMRVZCUVVVN1dVRkRZaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU42UXl4TlFVRk5PMWxCUTBnc1MwRkJTeXhKUVVGSkxFZEJRVWNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRXRCUVVzc1JVRkJSU3hIUVVGSExFbEJRVWtzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRVZCUVVVc1IwRkJSeXhGUVVGRkxFVkJRVVU3WjBKQlEycEZMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlF6bEVMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGFrVTdPMWxCUlVRc1MwRkJTeXhKUVVGSkxFZEJRVWNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRXRCUVVzc1IwRkJSeXhEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEUxQlFVMHNRMEZCUXl4SFFVRkhMRWRCUVVjc1MwRkJTeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEZRVUZGTzJkQ1FVTndSU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTTVSQ3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEycEZPMU5CUTBvN08xRkJSVVFzVDBGQlR5eExRVUZMTEVOQlFVTTdTMEZEYUVJN096czdPenM3T3pzN08wbEJWMFFzV1VGQldTeERRVUZETEVsQlFVa3NSVUZCUlN4cFFrRkJhVUlzUlVGQlJUdFJRVU5zUXl4UFFVRlBMRk5CUVZNc1MwRkJTeXhwUWtGQmFVSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zUjBGQlJ5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRNMGM3T3pzN096czdPenRKUVZORUxHRkJRV0VzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEWWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU5xUlRzN096czdPenM3T3p0SlFWVkVMR0ZCUVdFc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVOQlFVTXNSVUZCUlR0UlFVTjBRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJUdFpRVU01UkN4UFFVRlBMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVkQlFVY3NRMEZCUXp0VFFVTnFRenRSUVVORUxFOUJRVThzVTBGQlV5eERRVUZETzB0QlEzQkNPenM3T3pzN096czdPenRKUVZkRUxHOUNRVUZ2UWl4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOd1FpeFBRVUZQTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNCRU96czdPenM3T3pzN096dEpRVmRFTEc5Q1FVRnZRaXhEUVVGRExFMUJRVTBzUlVGQlJUdFJRVU42UWl4TlFVRk5MRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU42UkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUlVGQlJUdFpRVU40UXl4UFFVRlBMRU5CUVVNc1EwRkJRenRUUVVOYU8xRkJRMFFzVDBGQlR5eFRRVUZUTEVOQlFVTTdTMEZEY0VJN096czdPenM3T3pzN096czdPMGxCWTBRc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRGRrSXNUVUZCVFN4VlFVRlZMRWRCUVVjN1dVRkRaaXhIUVVGSExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dFpRVU5xUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRUUVVOd1F5eERRVUZET3p0UlFVVkdMRTFCUVUwc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRPVU1zVFVGQlRTeFBRVUZQTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTTFReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJRenRSUVVONFF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUXpkRExFMUJRVTBzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1VVRkJVU3hEUVVGRE96dFJRVVV4UXl4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRE8xbEJRMllzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRMnBETEZGQlFWRXNSVUZCUlN4UFFVRlBMRWRCUVVjc1VVRkJVVHRUUVVNdlFpeEZRVUZGTzFsQlEwTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU03WjBKQlEyeENMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ6dG5Ra0ZEYmtJc1IwRkJSeXhGUVVGRkxGVkJRVlVzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0aFFVTXhRaXhEUVVGRE8xbEJRMFlzVVVGQlVTeEZRVUZGTEZGQlFWRXNSMEZCUnl4UlFVRlJPMU5CUTJoRExFVkJRVVU3V1VGRFF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJRenRuUWtGRGJFSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dG5Ra0ZEZGtJc1IwRkJSeXhGUVVGRkxGVkJRVlVzUTBGQlF5eEhRVUZITzJGQlEzUkNMRU5CUVVNN1dVRkRSaXhSUVVGUkxFVkJRVVVzVDBGQlR5eEhRVUZITEZOQlFWTTdVMEZEYUVNc1JVRkJSVHRaUVVORExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRPMmRDUVVOc1FpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8yZENRVU4yUWl4SFFVRkhMRVZCUVVVc1ZVRkJWU3hEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETzJGQlF6RkNMRU5CUVVNN1dVRkRSaXhSUVVGUkxFVkJRVVVzVVVGQlVTeEhRVUZITEZOQlFWTTdVMEZEYWtNc1EwRkJReXhEUVVGRE96dFJRVVZJTEUxQlFVMHNUVUZCVFN4SFFVRkhMRk5CUVZNN08yRkJSVzVDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRkZCUVZFc1MwRkJTeXhUUVVGVExFdEJRVXNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXpzN1lVRkZPVU1zVFVGQlRTeERRVUZETEVOQlFVTXNVVUZCVVN4TFFVRkxPMmRDUVVOc1FpeEpRVUZKTEV0QlFVc3NSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFdEJRVXNzVVVGQlVTeERRVUZETEVOQlFVTTdiVUpCUTNSRkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN08yRkJSWEpFTEUxQlFVMDdaMEpCUTBnc1EwRkJReXhKUVVGSkxFVkJRVVVzVVVGQlVTeExRVUZMTEZGQlFWRXNRMEZCUXl4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eFJRVUZSTEVkQlFVY3NTVUZCU1R0blFrRkRka1VzUTBGQlF5eERRVUZETEVWQlFVVXNVMEZCVXl4RlFVRkZMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU12UWl4RFFVRkRPenRSUVVWT0xFOUJRVThzVTBGQlV5eExRVUZMTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdTMEZET1VVN096czdPenM3T3p0SlFWTkVMRXRCUVVzc1EwRkJReXhMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU40UWl4TFFVRkxMRTFCUVUwc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1dVRkRMMElzVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zVjBGQlZ5eERRVUZET3p0WlFVVXZRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRE8xbEJRM3BFTEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTTdPMWxCUlhwRUxFbEJRVWtzU1VGQlNTeEpRVUZKTEVsQlFVa3NSVUZCUlR0blFrRkRaQ3hQUVVGUExFZEJRVWNzUTBGQlF6dGhRVU5rTzFOQlEwbzdPMUZCUlVRc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFpqczdPenM3T3pzN096dEpRVlZFTEdOQlFXTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1RVRkJUU3hGUVVGRk8xRkJRekZDTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNSRU96czdPenM3T3pzN1NVRlRSQ3hoUVVGaExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVN1VVRkRkRUlzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dExRVU42UkRzN096czdPenM3TzBsQlUwUXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEyeENMRTlCUVU4N1dVRkRTQ3hIUVVGSExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dFpRVU5xUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRUUVVOd1F5eERRVUZETzB0QlEwdzdRMEZEU2pzN1FVTndaa1E3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN1FVRXJRa0VzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhEUVVGRExFbEJRVWtzUzBGQlN6dEpRVU5xUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU42UXl4UFFVRlBMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4WFFVRlhMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03UTBGRE1VWXNRMEZCUXpzN096czdPenM3UVVGUlJpeE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFTkJRVU1zUjBGQlJ6czdPenM3T3pzN096czdPenRKUVdFelFpeGpRVUZqTEVkQlFVY3NRMEZCUXpzN096czdPenM3T3pzN096czdPenRSUVdkQ1pDeDNRa0ZCZDBJc1EwRkJReXhKUVVGSkxFVkJRVVVzVVVGQlVTeEZRVUZGTEZGQlFWRXNSVUZCUlRzN096dFpRVWt2UXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhyUWtGQmEwSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVNeFF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4VFFVRlRMRWxCUVVrc1VVRkJVU3hMUVVGTExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk8yZENRVU53UkN4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVNelF6dFRRVU5LTzB0QlEwbzdPMEZEYUVaTU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEUxQlFVMHNaVUZCWlN4SFFVRkhMR05CUVdNc1MwRkJTeXhEUVVGRE8wbEJRM2hETEZkQlFWY3NRMEZCUXl4SFFVRkhMRVZCUVVVN1VVRkRZaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdTMEZEWkR0RFFVTktPenRCUTNaQ1JEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVVkJMRTFCUVUwc1RVRkJUU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETjBJc1RVRkJUU3hoUVVGaExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTndReXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenRCUVVVNVFpeE5RVUZOTEdGQlFXRXNSMEZCUnl4TlFVRk5PMGxCUTNoQ0xGZEJRVmNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4WlFVRlpMRVZCUVVVc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlF6VkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNoQ0xHRkJRV0VzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRmxCUVZrc1EwRkJReXhEUVVGRE8xRkJRM1JETEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzB0QlF6ZENPenRKUVVWRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6TkNPenRKUVVWRUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU12UkRzN1NVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU0xUWpzN1NVRkZSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzB0QlEyeERPenRKUVVWRUxGTkJRVk1zUTBGQlF5eFZRVUZWTEVWQlFVVTdVVUZEYkVJc1lVRkJZU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRjRU1zVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWmpzN1NVRkZSQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eFRRVUZUTEVWQlFVVXNZVUZCWVN4SFFVRkhMRVZCUVVVc1JVRkJSU3hUUVVGVExFZEJRVWNzWlVGQlpTeERRVUZETEVWQlFVVTdVVUZEYWtVc1RVRkJUU3hYUVVGWExFZEJRVWNzVTBGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03VVVGRGVrUXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRaUVVOa0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzWVVGQllTeERRVUZETEVOQlFVTTdPMWxCUlhaRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRek5DT3p0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3UTBGRFNqczdRVU12UkVRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOTEZWQlFWVXNSMEZCUnl4alFVRmpMR1ZCUVdVc1EwRkJRenRKUVVNM1F5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RlFVRkZPMUZCUTJJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEyUTdRMEZEU2pzN1FVTjZRa1E3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZGUVN4TlFVRk5MR2RDUVVGblFpeEhRVUZITEdOQlFXTXNaVUZCWlN4RFFVRkRPMGxCUTI1RUxGZEJRVmNzUTBGQlF5eEhRVUZITEVWQlFVVTdVVUZEWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRFpEdERRVU5LT3p0QlEzcENSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVWxCTEUxQlFVMHNjVUpCUVhGQ0xFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEyaERMRTFCUVUwc2IwSkJRVzlDTEVkQlFVY3NZMEZCWXl4aFFVRmhMRU5CUVVNN1NVRkRja1FzVjBGQlZ5eERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTm1MRWxCUVVrc1MwRkJTeXhIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMUZCUTJ4RExFMUJRVTBzV1VGQldTeEhRVUZITEhGQ1FVRnhRaXhEUVVGRE8xRkJRek5ETEUxQlFVMHNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenM3VVVGRmJFSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEzcENMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VTBGRGFrSXNUVUZCVFN4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU5zUXl4TlFVRk5MRmRCUVZjc1IwRkJSeXhSUVVGUkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUTNoRExFbEJRVWtzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1JVRkJSVHRuUWtGREwwSXNTMEZCU3l4SFFVRkhMRmRCUVZjc1EwRkJRenRoUVVOMlFpeE5RVUZOTzJkQ1FVTklMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeFZRVUZWTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOMFF6dFRRVU5LTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdPMGxCUlVRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5XTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVObUxGTkJRVk1zUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU03V1VGRGJFTXNZVUZCWVN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRM0pDTEVOQlFVTXNRMEZCUXp0TFFVTk9PenRKUVVWRUxGZEJRVmNzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEV0N4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRFppeFRRVUZUTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFMUJRVTBzU1VGQlNTeERRVUZETzFsQlEyeERMR0ZCUVdFc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU55UWl4RFFVRkRMRU5CUVVNN1MwRkRUanM3U1VGRlJDeFBRVUZQTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSVHRSUVVOV0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeGhRVUZoTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xTkJRM2hDTEVOQlFVTXNRMEZCUXp0TFFVTk9PME5CUTBvN08wRkRiRVZFT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCUjBFc1RVRkJUU3h2UWtGQmIwSXNSMEZCUnl4RlFVRkZMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHRRa0ZCYlVJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU53UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NiMEpCUVc5Q0xFTkJRVU03VVVGRGFrTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2IwSkJRVzlDTEVOQlFVTTdVVUZETVVNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxGRkJRVkVzUzBGQlN5eFBRVUZQTEV0QlFVc3NSVUZCUlR0WlFVTXpRaXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFOQlEycENMRTFCUVUwN1dVRkRTQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTFRenM3VVVGRlJDeExRVUZMTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1dVRkJXU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZUVNN08wbEJSVVFzVVVGQlVTeEhRVUZITzFGQlExQXNUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEUxQlFVMHNSVUZCUlN4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTk8xTkJRM1JETEVOQlFVTXNRMEZCUXp0TFFVTk9PME5CUTBvN08wRkRNME5FT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCUTBFN1FVRkRRU3hCUVVWQkxFMUJRVTBzYlVKQlFXMUNMRWRCUVVjc1QwRkJUeXhEUVVGRE8wRkJRM0JETEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzWTBGQll5eGhRVUZoTEVOQlFVTTdTVUZEYmtRc1YwRkJWeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5tTEVsQlFVa3NTMEZCU3l4SFFVRkhMRzFDUVVGdFFpeERRVUZETzFGQlEyaERMRTFCUVUwc1dVRkJXU3hIUVVGSExHMUNRVUZ0UWl4RFFVRkRPMUZCUTNwRExFMUJRVTBzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZiRUlzU1VGQlNTeFJRVUZSTEV0QlFVc3NUMEZCVHl4TFFVRkxMRVZCUVVVN1dVRkRNMElzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTnFRaXhOUVVGTk8xbEJRMGdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2RDUVVGblFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROVU03TzFGQlJVUXNTMEZCU3l4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNoRE8wTkJRMG83TzBGRGRFTkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJTVUVzVFVGQlRTeHhRa0ZCY1VJc1IwRkJSeXhMUVVGTExFTkJRVU03UVVGRGNFTXNUVUZCVFN4dlFrRkJiMElzUjBGQlJ5eGpRVUZqTEdGQlFXRXNRMEZCUXp0SlFVTnlSQ3hYUVVGWExFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlEyWXNTVUZCU1N4TFFVRkxMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdVVUZEYkVNc1RVRkJUU3haUVVGWkxFZEJRVWNzY1VKQlFYRkNMRU5CUVVNN1VVRkRNME1zVFVGQlRTeE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRPenRSUVVWc1FpeEpRVUZKTEV0QlFVc3NXVUZCV1N4UFFVRlBMRVZCUVVVN1dVRkRNVUlzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTnFRaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEU5QlFVOHNTMEZCU3l4RlFVRkZPMWxCUTJ4RExFbEJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRGNrSXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRoUVVOb1FpeE5RVUZOTEVsQlFVa3NVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJUdG5Ra0ZETjBJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dGhRVU5xUWl4TlFVRk5PMmRDUVVOSUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU4wUXp0VFFVTktMRTFCUVUwN1dVRkRTQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTFRenM3VVVGRlJDeExRVUZMTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1dVRkJXU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZUVNN08wbEJSVVFzVFVGQlRTeEhRVUZITzFGQlEwd3NUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEUxQlFVMHNTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTk8xTkJRM2hETEVOQlFVTXNRMEZCUXp0TFFVTk9PenRKUVVWRUxFOUJRVThzUjBGQlJ6dFJRVU5PTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVObUxGTkJRVk1zUlVGQlJTeE5RVUZOTEV0QlFVc3NTMEZCU3l4SlFVRkpMRU5CUVVNc1RVRkJUVHRUUVVONlF5eERRVUZETEVOQlFVTTdTMEZEVGp0RFFVTktPenRCUXpGRVJEczdPenM3T3pzN096czdPenM3T3pzN096dEJRVzFDUVN4QlFVdEJMRTFCUVUwc1UwRkJVeXhIUVVGSExFMUJRVTA3U1VGRGNFSXNWMEZCVnl4SFFVRkhPMHRCUTJJN08wbEJSVVFzVDBGQlR5eERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTllMRTlCUVU4c1NVRkJTU3h2UWtGQmIwSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVNeFF6czdTVUZGUkN4TFFVRkxMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMVFzVDBGQlR5eEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlEzaERPenRKUVVWRUxFOUJRVThzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEV0N4UFFVRlBMRWxCUVVrc2IwSkJRVzlDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRNVU03TzBsQlJVUXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOV0xFOUJRVThzU1VGQlNTeHRRa0ZCYlVJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU42UXpzN1EwRkZTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzU1VGQlNTeFRRVUZUTEVWQlFVVTdPMEZET1VNeFF6czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCY1VKQkxFRkJSMEVzVFVGQlRVRXNWVUZCVVN4SFFVRkhMRk5CUVZNc1EwRkJRenM3UVVGRk0wSXNUVUZCVFN4alFVRmpMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRek5DTEUxQlFVMHNZMEZCWXl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVONlFpeE5RVUZOTEdGQlFXRXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRPVUlzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUTNCQ0xFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTndRaXhOUVVGTkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVNelFpeE5RVUZOTEdWQlFXVXNSMEZCUnl4SFFVRkhMRU5CUVVNN08wRkJSVFZDTEUxQlFVMHNaVUZCWlN4SFFVRkhMRTlCUVU4c1EwRkJRenRCUVVOb1F5eE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExGTkJRVk1zUTBGQlF6dEJRVU53UXl4TlFVRk5MR05CUVdNc1IwRkJSeXhOUVVGTkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eFZRVUZWTEVOQlFVTTdRVUZEZEVNc1RVRkJUU3hYUVVGWExFZEJRVWNzUjBGQlJ5eERRVUZETzBGQlEzaENMRTFCUVUwc1YwRkJWeXhIUVVGSExFZEJRVWNzUTBGQlF6czdRVUZGZUVJc1RVRkJUU3hoUVVGaExFZEJRVWNzUjBGQlJ5eERRVUZETzBGQlF6RkNMRTFCUVUwc01FSkJRVEJDTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTNSRExFMUJRVTBzYVVKQlFXbENMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRemxDTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eERRVUZETzBGQlF6TkNMRTFCUVUwc1NVRkJTU3hIUVVGSExHRkJRV0VzUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZETDBJc1RVRkJUU3hMUVVGTExFZEJRVWNzWVVGQllTeEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTm9ReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eGhRVUZoTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTNCRExFMUJRVTBzVTBGQlV5eEhRVUZITEU5QlFVOHNRMEZCUXpzN1FVRkZNVUlzVFVGQlRTeFBRVUZQTEVkQlFVY3NRMEZCUXl4SFFVRkhMRXRCUVVzN1NVRkRja0lzVDBGQlR5eEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF6dERRVU5vUXl4RFFVRkRPenRCUVVWR0xFMUJRVTBzVjBGQlZ5eEhRVUZITEVOQlFVTXNTVUZCU1R0SlFVTnlRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJReTlDTEU5QlFVOHNUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SlFVRkpMRTFCUVUwc1NVRkJTU3hqUVVGakxFTkJRVU03UTBGRE9VVXNRMEZCUXpzN096czdPenRCUVU5R0xFMUJRVTBzVlVGQlZTeEhRVUZITEUxQlFVMHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NZMEZCWXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE96dEJRVVY0UlN4TlFVRk5MSE5DUVVGelFpeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenM3UVVGRmVrUXNRVUZoUVRzN096czdPenM3TzBGQlUwRXNUVUZCVFN4aFFVRmhMRWRCUVVjc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4elFrRkJjMElzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1UwRkJVeXhEUVVGRE96dEJRVVYwUml4TlFVRk5MRlZCUVZVc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1JVRkJSU3hMUVVGTExFdEJRVXM3U1VGRGFFUXNUVUZCVFN4VFFVRlRMRWRCUVVjc1MwRkJTeXhIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU0zUWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNWMEZCVnl4SFFVRkhMR1ZCUVdVc1EwRkJRenRKUVVOMFF5eFBRVUZQTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRNVUlzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNTMEZCU3l4SFFVRkhMRk5CUVZNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRE5VVXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRPME5CUTNKQ0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4VFFVRlRMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhMUVVGTE8wbEJReTlETEUxQlFVMHNTMEZCU3l4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF6dEpRVU0zUWl4TlFVRk5MR1ZCUVdVc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJFUXNUVUZCVFN4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExHVkJRV1VzUTBGQlF6dEpRVU4yUXl4TlFVRk5MSEZDUVVGeFFpeEhRVUZITERCQ1FVRXdRaXhIUVVGSExFdEJRVXNzUTBGQlF6dEpRVU5xUlN4TlFVRk5MR3RDUVVGclFpeEhRVUZITEZWQlFWVXNSMEZCUnl4RFFVRkRMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdTVUZEYkVVc1RVRkJUU3haUVVGWkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUlVGQlJTeHBRa0ZCYVVJc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF6czdTVUZGTTBVc1RVRkJUU3hOUVVGTkxFZEJRVWNzUTBGQlF5eEhRVUZITEV0QlFVc3NSMEZCUnl4bFFVRmxMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdTVUZEYmtVc1RVRkJUU3hOUVVGTkxFZEJRVWNzUTBGQlF5eEhRVUZITEV0QlFVc3NSMEZCUnl4bFFVRmxMRU5CUVVNN08wbEJSVE5ETEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVThzUTBGQlF5eFRRVUZUTEVWQlFVVXNRMEZCUXp0SlFVTndRaXhQUVVGUExFTkJRVU1zVTBGQlV5eEhRVUZITEV0QlFVc3NRMEZCUXp0SlFVTXhRaXhQUVVGUExFTkJRVU1zVjBGQlZ5eEhRVUZITEU5QlFVOHNRMEZCUXp0SlFVTTVRaXhQUVVGUExFTkJRVU1zVTBGQlV5eEhRVUZITEZsQlFWa3NRMEZCUXp0SlFVTnFReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVNdlFpeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1IwRkJSeXhyUWtGQmEwSXNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOd1JDeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1IwRkJSeXhyUWtGQmEwSXNSVUZCUlN4TlFVRk5MRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6RklMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEd0Q1FVRnJRaXhIUVVGSExIRkNRVUZ4UWl4RlFVRkZMRTFCUVUwc1IwRkJSeXhyUWtGQmEwSXNSMEZCUnl4eFFrRkJjVUlzUTBGQlF5eERRVUZETzBsQlEzcElMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeEhRVUZITEd0Q1FVRnJRaXhGUVVGRkxFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4eFFrRkJjVUlzUlVGQlJTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1QwRkJUeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZET1Vrc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8wbEJRelZETEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUjBGQlJ5eHJRa0ZCYTBJc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4eFFrRkJjVUlzUlVGQlJTeFBRVUZQTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZETTBnc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVkQlFVY3NjVUpCUVhGQ0xFVkJRVVVzVFVGQlRTeEhRVUZITEhGQ1FVRnhRaXhEUVVGRExFTkJRVU03U1VGREwwVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFVkJRVVVzVFVGQlRTeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxIRkNRVUZ4UWl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenM3U1VGRmRrY3NUMEZCVHl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRE8wbEJRMnBDTEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVThzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0RFFVTnlRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNVMEZCVXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4TFFVRkxPMGxCUTNoRExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTm1MRTlCUVU4c1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dEpRVU53UWl4UFFVRlBMRU5CUVVNc1UwRkJVeXhIUVVGSExGTkJRVk1zUTBGQlF6dEpRVU01UWl4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnlRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dEpRVU5vUkN4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1EwRkRja0lzUTBGQlF6czdPenRCUVVsR0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeE5RVUZOTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNM1FpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE5VSXNUVUZCVFN4VFFVRlRMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU5vUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlEzcENMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdPenM3T3pzN096czdRVUZWZWtJc1RVRkJUU3hOUVVGTkxFZEJRVWNzWTBGQll5eHJRa0ZCYTBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6czdPenM3U1VGTGVrUXNWMEZCVnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeFJRVUZSTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVTdVVUZEY0VRc1MwRkJTeXhGUVVGRkxFTkJRVU03TzFGQlJWSXNUVUZCVFN4VFFVRlRMRWRCUVVkRExHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRPMkZCUTNoRkxFOUJRVThzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMkZCUTJJc1UwRkJVeXhEUVVGRExGVkJRVlVzUlVGQlJTeERRVUZETzJGQlEzWkNMRXRCUVVzc1EwRkJRenM3VVVGRldDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXpzN1VVRkZOME1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUjBFc2EwSkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTTdZVUZEYmtVc1UwRkJVeXhEUVVGRExHRkJRV0VzUTBGQlF6dGhRVU40UWl4TFFVRkxMRU5CUVVNN08xRkJSVmdzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUjBFc2EwSkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNVVUZCVVN4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1EwRkJRenRoUVVNNVJTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJRenRoUVVObUxGTkJRVk1zUTBGQlF5eG5Ra0ZCWjBJc1EwRkJRenRoUVVNelFpeExRVUZMTEVOQlFVTTdPMUZCUlZnc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03WVVGRGVrUXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOaUxGTkJRVk1zUTBGQlF5eFRRVUZUTEVOQlFVTTdZVUZEY0VJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMkZCUTNwRUxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEWWl4VFFVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRE8yRkJRM0JDTEV0QlFVc3NRMEZCUXpzN1VVRkZXQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZIUVN4clFrRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRPMkZCUTNoRkxGRkJRVkVzUlVGQlJUdGhRVU5XTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRaaXhMUVVGTExFTkJRVU03UzBGRFpEczdTVUZGUkN4WFFVRlhMR3RDUVVGclFpeEhRVUZITzFGQlF6VkNMRTlCUVU4N1dVRkRTQ3hsUVVGbE8xbEJRMllzYVVKQlFXbENPMWxCUTJwQ0xHTkJRV003V1VGRFpDeHJRa0ZCYTBJN1dVRkRiRUlzVjBGQlZ6dFpRVU5ZTEZkQlFWYzdVMEZEWkN4RFFVRkRPMHRCUTB3N08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1VVRkRhRUlzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEyeERMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZET1VRN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1VVRkRia0lzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZEVMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096czdPenM3T3p0SlFWRkVMRk5CUVZNc1IwRkJSenRSUVVOU0xFOUJRVThzWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVOdVF6czdPenM3T3pzN1NVRlJSQ3hSUVVGUkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVsQlFVa3NRMEZCUXl4VFFVRlRMRVZCUVVVc1EwRkJRenRMUVVNelFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1NVRkJTU3hIUVVGSE8xRkJRMUFzVDBGQlR5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wSTdTVUZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhSUVVGUkxFVkJRVVU3VVVGRGFFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1VVRkJVU3hGUVVGRk8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU03V1VGRGRFTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzWVVGQllTeERRVUZETEVOQlFVTTdVMEZEYmtNc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xbEJRek5DTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFOQlEyaEVPMHRCUTBvN096czdPenM3TzBsQlVVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3U1VGRFJDeEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRaaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVNeFFpeEpRVUZKTEVsQlFVa3NTMEZCU3l4TlFVRk5MRVZCUVVVN1dVRkRha0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJRenRUUVVOdVF5eE5RVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhUUVVGVExFVkJRVVVzVFVGQlRTeERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNN1UwRkRia1E3UzBGRFNqczdPenM3T3p0SlFVOUVMRWxCUVVrc1YwRkJWeXhIUVVGSE8xRkJRMlFzVDBGQlR5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6ZEZPMGxCUTBRc1NVRkJTU3hYUVVGWExFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEyWXNTVUZCU1N4SlFVRkpMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMW9zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0VFFVTnFRaXhMUVVGTE8xbEJRMFlzVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGFrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFdDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRUUVVOa08wdEJRMG83T3pzN096czdTVUZQUkN4alFVRmpMRWRCUVVjN1VVRkRZaXhQUVVGUExFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRPMHRCUTNCRE96czdPenM3TzBsQlQwUXNTVUZCU1N4RFFVRkRMRWRCUVVjN1VVRkRTaXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRka0k3U1VGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVN1VVRkRVaXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOdVFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU5vUXpzN096czdPenRKUVU5RUxFbEJRVWtzUTBGQlF5eEhRVUZITzFGQlEwb3NUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlEzWkNPMGxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlExSXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYmtJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRhRU03T3pzN096czdTVUZQUkN4SlFVRkpMRkZCUVZFc1IwRkJSenRSUVVOWUxFOUJRVThzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNNVFqdEpRVU5FTEVsQlFVa3NVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSVHRSUVVObUxFbEJRVWtzU1VGQlNTeExRVUZMTEVsQlFVa3NSVUZCUlR0WlFVTm1MRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVMEZEY0VNc1RVRkJUVHRaUVVOSUxFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1NVRkJTU3hIUVVGSExHTkJRV01zUTBGQlF6dFpRVU5xUkN4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8xbEJRM2hETEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1ZVRkJWU3hGUVVGRkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1UwRkRja1E3UzBGRFNqczdPenM3T3pzN1NVRlJSQ3hQUVVGUExFZEJRVWM3VVVGRFRpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8xbEJRMmhDTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxGVkJRVlVzUlVGQlJTeERRVUZETEVOQlFVTTdXVUZET1VJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGpRVUZqTEVWQlFVVXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRemRETEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zWlVGQlpTeEZRVUZGTzJkQ1FVTXhReXhOUVVGTkxFVkJRVVU3YjBKQlEwb3NSMEZCUnl4RlFVRkZMRWxCUVVrN2FVSkJRMW83WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3T3p0SlFWTkVMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRFdDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8xbEJRMmhDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRM0pDTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zWTBGQll5eEZRVUZGTzJkQ1FVTjZReXhOUVVGTkxFVkJRVVU3YjBKQlEwb3NSMEZCUnl4RlFVRkZMRWxCUVVrN2IwSkJRMVFzVFVGQlRUdHBRa0ZEVkR0aFFVTktMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMUE3UzBGRFNqczdPenM3T3p0SlFVOUVMRTFCUVUwc1IwRkJSenRSUVVOTUxFOUJRVThzU1VGQlNTeExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1MwRkRMMEk3T3pzN096czdPenRKUVZORUxGTkJRVk1zUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEWkN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJUdFpRVU0zUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU51UWl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExHbENRVUZwUWl4RFFVRkRMRU5CUVVNN1dVRkRlRU1zU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhwUWtGQmFVSXNSVUZCUlR0blFrRkRiRVFzVFVGQlRTeEZRVUZGTzI5Q1FVTktMRWRCUVVjc1JVRkJSU3hKUVVGSk8yOUNRVU5VTEUxQlFVMDdhVUpCUTFRN1lVRkRTaXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5RTzB0QlEwbzdPenM3T3pzN096czdPenRKUVZsRUxFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RlFVRkZMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFGQlEzSkVMRTFCUVUwc1MwRkJTeXhIUVVGSExFOUJRVThzUjBGQlJ5eGhRVUZoTEVOQlFVTTdVVUZEZEVNc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTXpRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUXpkQ0xFMUJRVTBzVTBGQlV5eEhRVUZITEZGQlFWRXNSMEZCUnl4TFFVRkxMRU5CUVVNN08xRkJSVzVETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZET3p0UlFVVXpRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTm1MRlZCUVZVc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTjJSRHM3VVVGRlJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRk8xbEJRM0pDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRlRU1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtNc1QwRkJUeXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGVrUTdPMUZCUlVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdPMUZCUlRWRExGRkJRVkVzU1VGQlNTeERRVUZETEVsQlFVazdVVUZEYWtJc1MwRkJTeXhEUVVGRExFVkJRVVU3V1VGRFNpeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOd1JDeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNSRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhEUVVGRExFVkJRVVU3V1VGRFNpeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOMFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOd1JDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bEVMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEwb3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGRFUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRkRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM0JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNKRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTjZSQ3hOUVVGTk8xTkJRMVE3VVVGRFJDeFJRVUZSTzFOQlExQTdPenRSUVVkRUxFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVNeFF6dERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTkVMRlZCUVZFc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6czdRVU42Wmk5RE96czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYzBKQkxFRkJTVUVzVFVGQlRVRXNWVUZCVVN4SFFVRkhMRmxCUVZrc1EwRkJRenM3TzBGQlJ6bENMRTFCUVUxRkxHbENRVUZsTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTJoRExFMUJRVTBzWTBGQll5eEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRU5CUVVNN096dEJRVWQwUXl4TlFVRk5ReXhSUVVGTkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTNRaXhOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeFJRVUZSTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdlFpOUNMRTFCUVUwc1UwRkJVeXhIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN096czdPenM3T3pzN1NVRmhOVVFzVjBGQlZ5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUXpWRExFdEJRVXNzUlVGQlJTeERRVUZET3p0UlFVVlNMRTFCUVUwc1ZVRkJWU3hIUVVGSFJpeHJRa0ZCVVN4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUTBNc2FVSkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETDBVc1NVRkJTU3hWUVVGVkxFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEzQkNReXhSUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4VlFVRlZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGJrTXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJRMFFzYVVKQlFXVXNSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03VTBGRGJFUXNUVUZCVFR0WlFVTklMRTFCUVUwc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl3MFEwRkJORU1zUTBGQlF5eERRVUZETzFOQlF6bEZPenRSUVVWRUxFMUJRVTBzVTBGQlV5eEhRVUZIUkN4clFrRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZEZMRWxCUVVrc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJUdFpRVU51UWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VTBGRGFFUXNUVUZCVFR0WlFVTklMRTFCUVUwc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl3eVEwRkJNa01zUTBGQlF5eERRVUZETzFOQlF6ZEZPenRSUVVWRUxFMUJRVTBzVlVGQlZTeEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEycEdMRWxCUVVrc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJUdFpRVU53UWl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTjRRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03VTBGRGJFUXNUVUZCVFRzN1dVRkZTQ3hOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8xTkJRM3BET3p0UlFVVkVMRTFCUVUwc1dVRkJXU3hIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1EwRkJReXhQUVVGUExFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETzJGQlEyeEdMRTFCUVUwc1JVRkJSU3hEUVVGRE8xRkJRMlFzU1VGQlNTeFpRVUZaTEVOQlFVTXNUMEZCVHl4RlFVRkZPMWxCUTNSQ0xGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRE8xbEJRelZDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc2EwSkJRV3RDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkRiRVFzVFVGQlRUczdXVUZGU0N4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03VTBGRE5VTTdTMEZEU2pzN1NVRkZSQ3hYUVVGWExHdENRVUZyUWl4SFFVRkhPMUZCUXpWQ0xFOUJRVTg3V1VGRFNFTXNhVUpCUVdVN1dVRkRaaXhqUVVGak8xbEJRMlFzWlVGQlpUdFpRVU5tTEd0Q1FVRnJRanRUUVVOeVFpeERRVUZETzB0QlEwdzdPMGxCUlVRc2FVSkJRV2xDTEVkQlFVYzdTMEZEYmtJN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVTlETEZGQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ6dFJRVU5RTEU5QlFVOHNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU14UWpzN096czdPenRKUVU5RUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4SlFVRkpMRXRCUVVzc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXpSRHRKUVVORUxFbEJRVWtzUzBGQlN5eERRVUZETEZGQlFWRXNSVUZCUlR0UlFVTm9RaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEVsQlFVa3NTMEZCU3l4UlFVRlJMRVZCUVVVN1dVRkRia0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRUUVVONlF5eE5RVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVMEZEYUVRN1MwRkRTanM3T3pzN096dEpRVTlFTEZOQlFWTXNSMEZCUnp0UlFVTlNMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJUdFpRVU5zUWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEZkQlFWY3NRMEZCUXl4blFrRkJaMElzUlVGQlJUdG5Ra0ZETlVRc1RVRkJUU3hGUVVGRk8yOUNRVU5LTEUxQlFVMHNSVUZCUlN4SlFVRkpPMmxDUVVObU8yRkJRMG9zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVUR0UlFVTkVMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETlVNc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFpqczdPenM3U1VGTFJDeFBRVUZQTEVkQlFVYzdVVUZEVGl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03UzBGRE5VTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNTVUZCU1N4TFFVRkxMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZEZEVNN096czdPenM3U1VGUFJDeFJRVUZSTEVkQlFVYzdVVUZEVUN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjZRanM3T3pzN096czdPMGxCVTBRc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5XTEUxQlFVMHNTVUZCU1N4SFFVRkhMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUjBGQlJ5eExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJRenRSUVVNMVJDeFBRVUZQTEV0QlFVc3NTMEZCU3l4SlFVRkpMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdTMEZETDBNN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRFNDeFZRVUZSTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN096czdPenM3T3p0QlFWTnNSQ3hOUVVGTkxIRkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEV0QlFVc3NSVUZCUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGRGNFOTBSVHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVVZCTEUxQlFVMUJMRlZCUVZFc1IwRkJSeXhwUWtGQmFVSXNRMEZCUXpzN096czdPenRCUVU5dVF5eE5RVUZOTEdGQlFXRXNSMEZCUnl4alFVRmpMRmRCUVZjc1EwRkJRenM3T3pzN1NVRkxOVU1zVjBGQlZ5eEhRVUZITzFGQlExWXNTMEZCU3l4RlFVRkZMRU5CUVVNN1MwRkRXRHM3U1VGRlJDeHBRa0ZCYVVJc1IwRkJSenRSUVVOb1FpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFMUJRVTBzUlVGQlJUdFpRVU14UWl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExIRkNRVUZ4UWl4RFFVRkRMRU5CUVVNN1UwRkRNME03TzFGQlJVUXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFTkJRVU1zUzBGQlN5eExRVUZMT3p0WlFVVXZReXhKUVVGSkxFTkJRVU1zVDBGQlR6dHBRa0ZEVUN4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzJsQ1FVTXpReXhQUVVGUExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhEUVVGRE8xTkJRMnhETEVOQlFVTXNRMEZCUXp0TFFVTk9PenRKUVVWRUxHOUNRVUZ2UWl4SFFVRkhPMHRCUTNSQ096czdPenM3TzBsQlQwUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU5KTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRja1E3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZEU2l4VlFVRlJMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03TzBGREwwUjBSRHM3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdlFrRXNRVUZOUVN4TlFVRk5RU3hYUVVGUkxFZEJRVWNzWjBKQlFXZENMRU5CUVVNN08wRkJSV3hETEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUjBGQlJ5eERRVUZETzBGQlF6ZENMRTFCUVUwc2NVSkJRWEZDTEVkQlFVY3NSMEZCUnl4RFFVRkRPMEZCUTJ4RExFMUJRVTBzT0VKQlFUaENMRWRCUVVjc1MwRkJTeXhEUVVGRE8wRkJRemRETEUxQlFVMHNOa0pCUVRaQ0xFZEJRVWNzUzBGQlN5eERRVUZETzBGQlF6VkRMRTFCUVUwc09FSkJRVGhDTEVkQlFVY3NTMEZCU3l4RFFVRkRPenRCUVVVM1F5eE5RVUZOTEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNN1FVRkRhRUlzVFVGQlRTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPenRCUVVWb1FpeE5RVUZOTEdGQlFXRXNSMEZCUnl4SlFVRkpMRWRCUVVjc1owSkJRV2RDTEVOQlFVTTdRVUZET1VNc1RVRkJUU3hqUVVGakxFZEJRVWNzU1VGQlNTeEhRVUZITEdkQ1FVRm5RaXhEUVVGRE8wRkJReTlETEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03TzBGQlJXaEVMRTFCUVUwc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF6czdRVUZGY0VJc1RVRkJUU3hsUVVGbExFZEJRVWNzVDBGQlR5eERRVUZETzBGQlEyaERMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NVVUZCVVN4RFFVRkRPMEZCUTJ4RExFMUJRVTBzYjBKQlFXOUNMRWRCUVVjc1dVRkJXU3hEUVVGRE8wRkJRekZETEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzVlVGQlZTeERRVUZETzBGQlEzUkRMRTFCUVUwc1owTkJRV2RETEVkQlFVY3NkMEpCUVhkQ0xFTkJRVU03UVVGRGJFVXNUVUZCVFN3clFrRkJLMElzUjBGQlJ5eDFRa0ZCZFVJc1EwRkJRenRCUVVOb1JTeE5RVUZOTEdkRFFVRm5ReXhIUVVGSExIZENRVUYzUWl4RFFVRkRPMEZCUTJ4RkxFMUJRVTBzZFVKQlFYVkNMRWRCUVVjc1pVRkJaU3hEUVVGRE96dEJRVVZvUkN4TlFVRk5MRmRCUVZjc1IwRkJSeXhEUVVGRExGbEJRVmtzUlVGQlJTeGhRVUZoTEVkQlFVY3NRMEZCUXl4TFFVRkxPMGxCUTNKRUxFMUJRVTBzVFVGQlRTeEhRVUZITEZGQlFWRXNRMEZCUXl4WlFVRlpMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE1VTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEdGQlFXRXNSMEZCUnl4TlFVRk5MRU5CUVVNN1EwRkRlRVFzUTBGQlF6czdRVUZGUml4TlFVRk5MR2xDUVVGcFFpeEhRVUZITEVOQlFVTXNXVUZCV1N4RlFVRkZMRmxCUVZrc1MwRkJTenRKUVVOMFJDeFBRVUZQUXl4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTTdVMEZEYUVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5pTEZOQlFWTXNRMEZCUXl4WlFVRlpMRU5CUVVNN1UwRkRka0lzUzBGQlN5eERRVUZETzBOQlEyUXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxEQkNRVUV3UWl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFbEJRVWtzUlVGQlJTeFpRVUZaTEV0QlFVczdTVUZEYUVVc1NVRkJTU3hQUVVGUExFTkJRVU1zV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMUZCUXpWQ0xFMUJRVTBzVjBGQlZ5eEhRVUZITEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGREwwTXNUMEZCVHl4cFFrRkJhVUlzUTBGQlF5eFhRVUZYTEVWQlFVVXNXVUZCV1N4RFFVRkRMRU5CUVVNN1MwRkRka1E3U1VGRFJDeFBRVUZQTEZsQlFWa3NRMEZCUXp0RFFVTjJRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNWVUZCVlN4SFFVRkhMRU5CUVVNc1lVRkJZU3hGUVVGRkxGTkJRVk1zUlVGQlJTeFpRVUZaTEV0QlFVczdTVUZETTBRc1NVRkJTU3hUUVVGVExFdEJRVXNzWVVGQllTeEpRVUZKTEUxQlFVMHNTMEZCU3l4aFFVRmhMRVZCUVVVN1VVRkRla1FzVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWml4TlFVRk5MRWxCUVVrc1QwRkJUeXhMUVVGTExHRkJRV0VzUlVGQlJUdFJRVU5zUXl4UFFVRlBMRXRCUVVzc1EwRkJRenRMUVVOb1FpeE5RVUZOTzFGQlEwZ3NUMEZCVHl4WlFVRlpMRU5CUVVNN1MwRkRka0k3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc2JVSkJRVzFDTEVkQlFVY3NRMEZCUXl4UFFVRlBMRVZCUVVVc1NVRkJTU3hGUVVGRkxGbEJRVmtzUzBGQlN6dEpRVU42UkN4SlFVRkpMRTlCUVU4c1EwRkJReXhaUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdVVUZETlVJc1RVRkJUU3hYUVVGWExFZEJRVWNzVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVNdlF5eFBRVUZQTEZWQlFWVXNRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhYUVVGWExFVkJRVVVzVFVGQlRTeERRVUZETEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3haUVVGWkxFTkJRVU1zUTBGQlF6dExRVU5zUmpzN1NVRkZSQ3hQUVVGUExGbEJRVmtzUTBGQlF6dERRVU4yUWl4RFFVRkRPenM3UVVGSFJpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4alFVRmpMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU55UXl4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN08wRkJSWHBETEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZET3p0QlFVVXZSQ3hOUVVGTkxGbEJRVmtzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0SlFVTTFRaXhKUVVGSkxGTkJRVk1zUzBGQlN5eHJRa0ZCYTBJc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdVVUZETjBNc2EwSkJRV3RDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU53UXpzN1NVRkZSQ3hQUVVGUExHdENRVUZyUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dERRVU40UXl4RFFVRkRPenRCUVVWR0xFMUJRVTBzWlVGQlpTeEhRVUZITEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1MwRkJTenRKUVVOMlF5eHJRa0ZCYTBJc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eEZRVUZGTEZsQlFWa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF6dERRVU12UkN4RFFVRkRPenRCUVVWR0xFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRmxCUVZrc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenM3UVVGRmNrVXNUVUZCVFN4WFFVRlhMRWRCUVVjc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXl4SlFVRkpMRXRCUVVzN1NVRkRPVU1zU1VGQlNTeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1VVRkRhRUlzVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0UlFVVXhSQ3hMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVsQlFVa3NSVUZCUlR0WlFVTndRaXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdVMEZETjBNN1MwRkRTanREUVVOS0xFTkJRVU03T3pzN1FVRkpSaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6dEJRVU4wUXl4TlFVRk5MRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdRVUZETlVJc1RVRkJUU3hKUVVGSkxFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzV1VGQldTeEhRVUZITEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJRenRCUVVNMVF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03T3p0QlFVZHdReXhOUVVGTkxHZERRVUZuUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFOUJRVThzUlVGQlJTeFBRVUZQTEV0QlFVczdTVUZEYmtVc1RVRkJUU3hUUVVGVExFZEJRVWNzVFVGQlRTeERRVUZETEhGQ1FVRnhRaXhGUVVGRkxFTkJRVU03TzBsQlJXcEVMRTFCUVUwc1EwRkJReXhIUVVGSExFOUJRVThzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4SlFVRkpMRTFCUVUwc1EwRkJReXhMUVVGTExFZEJRVWNzVTBGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMGxCUTNSRkxFMUJRVTBzUTBGQlF5eEhRVUZITEU5QlFVOHNSMEZCUnl4VFFVRlRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eE5RVUZOTEVkQlFVY3NVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE96dEpRVVYyUlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBOQlEycENMRU5CUVVNN08wRkJSVVlzVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dEpRVU5vUXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPenM3U1VGSGJFTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRMmhDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVOcVFpeEpRVUZKTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1NVRkRka0lzU1VGQlNTeGpRVUZqTEVkQlFVY3NTVUZCU1N4RFFVRkRPMGxCUXpGQ0xFbEJRVWtzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXpzN1NVRkZka0lzVFVGQlRTeFBRVUZQTEVkQlFVY3NUVUZCVFR0UlFVTnNRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eExRVUZMTEVsQlFVa3NXVUZCV1N4TFFVRkxMRXRCUVVzc1JVRkJSVHM3V1VGRk1VTXNUVUZCVFN4bFFVRmxMRWRCUVVjc1MwRkJTeXhEUVVGRExHRkJRV0VzUTBGQlF5eHpRMEZCYzBNc1EwRkJReXhEUVVGRE8xbEJRM0JHTEVsQlFVa3NZMEZCWXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8yZENRVU42UWl4alFVRmpMRU5CUVVNc1UwRkJVeXhEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETzJGQlF6ZERMRTFCUVUwN1owSkJRMGdzWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRoUVVNeFF6dFpRVU5FTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN08xbEJSV0lzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUTNSQ096dFJRVVZFTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRkRUlzUTBGQlF6czdTVUZGUml4TlFVRk5MRmxCUVZrc1IwRkJSeXhOUVVGTk8xRkJRM1pDTEZkQlFWY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJTeExRVUZMTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNN1MwRkRhRVVzUTBGQlF6czdTVUZGUml4TlFVRk5MRmRCUVZjc1IwRkJSeXhOUVVGTk8xRkJRM1JDTEUxQlFVMHNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03VVVGRGFrTXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVOMFFpeERRVUZET3p0SlFVVkdMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRhRU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTMEZCU3l4RlFVRkZPenRaUVVWb1FpeE5RVUZOTEVkQlFVYzdaMEpCUTB3c1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTzJkQ1FVTm9RaXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVODdZVUZEYmtJc1EwRkJRenM3V1VGRlJpeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJUVkhMRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUczdaMEpCUlhwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiMEpCUVc5Q0xFVkJRVVU3YjBKQlF6TkVMRXRCUVVzc1IwRkJSeXhaUVVGWkxFTkJRVU03YjBKQlEzSkNMRmxCUVZrc1JVRkJSU3hEUVVGRE8ybENRVU5zUWl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN2IwSkJRMjVETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRMklzV1VGQldTeEZRVUZGTEVOQlFVTTdhVUpCUTJ4Q0xFMUJRVTBzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdHZRa0ZEY0VNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dHBRa0ZEYUVJN1lVRkRTanM3VTBGRlNqdExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hsUVVGbExFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZETDBJc1RVRkJUU3hqUVVGakxFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1owTkJRV2RETEVOQlFVTXNUVUZCVFN4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRWdzU1VGQlNTeFJRVUZSTEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUTNCQ0xFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJRenRUUVVOd1F5eE5RVUZOTEVsQlFVa3NTVUZCU1N4TFFVRkxMR05CUVdNc1JVRkJSVHRaUVVOb1F5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03VTBGRGFFTXNUVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEZOQlFWTXNRMEZCUXp0VFFVTnVRenRMUVVOS0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4SlFVRkpMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGNFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhKUVVGSkxGbEJRVmtzUzBGQlN5eExRVUZMTEVWQlFVVTdPenRaUVVjeFF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03TzFsQlJUbERMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzU1VGQlNTeFRRVUZUTEVkQlFVY3NSVUZCUlN4RlFVRkZPMmRDUVVOc1F5eExRVUZMTEVkQlFVY3NVVUZCVVN4RFFVRkRPMmRDUVVOcVFpeFhRVUZYTEVWQlFVVXNRMEZCUXpzN1owSkJSV1FzVFVGQlRTeDVRa0ZCZVVJc1IwRkJSeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhMUVVGTExHTkJRV01zUTBGQlF5eERRVUZETzJkQ1FVTnVSaXhYUVVGWExFTkJRVU1zUzBGQlN5eEZRVUZGTEhsQ1FVRjVRaXhEUVVGRExFTkJRVU03WjBKQlF6bERMRmRCUVZjc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03WVVGRGFFWTdVMEZEU2l4TlFVRk5MRWxCUVVrc1VVRkJVU3hMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRjRU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVndReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU03TzFsQlJURkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eFpRVUZaTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU12UXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08wdEJRMG9zUTBGQlF6czdTVUZGUml4TlFVRk5MR1ZCUVdVc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dFJRVU12UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhqUVVGakxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXZReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFMUJRVTBzV1VGQldTeEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8yZENRVU55UXl4SFFVRkhMRVZCUVVVc1kwRkJZenRuUWtGRGJrSXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRk8yZENRVU5VTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSVHRoUVVOYUxFTkJRVU1zUTBGQlF6czdXVUZGU0N4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFbEJRVWtzV1VGQldTeEhRVUZITEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6czdXVUZGTDBRc1kwRkJZeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFRRVUZUTEVOQlFVTTdVMEZETVVNN096dFJRVWRFTEdOQlFXTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRkRUlzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXpzN08xRkJSMklzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTNSQ0xFTkJRVU03T3pzN096czdPMGxCVVVZc1NVRkJTU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhqUVVGakxFdEJRVXM3VVVGRGVrTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1MwRkJTenRaUVVOdVFpeEpRVUZKTEZWQlFWVXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVTdaMEpCUXpkRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha1FzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdZVUZEZWtNN1dVRkRSQ3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMR05CUVdNc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRNVVVzUTBGQlF6dExRVU5NTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmxCUVZrc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM0pGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6czdTVUZGZGtRc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHZRa0ZCYjBJc1JVRkJSVHRSUVVNM1FpeE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VVc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmRCUVZjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UXpzN1NVRkZSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEc5Q1FVRnZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xRkJRek5FTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1MwRkRla1E3TzBsQlJVUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZWQlFWVXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRkxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhUUVVGVExFVkJRVVVzWlVGQlpTeERRVUZETEVOQlFVTTdTVUZEY0VRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3hsUVVGbExFTkJRVU1zUTBGQlF6dERRVU40UkN4RFFVRkRPenM3T3pzN096dEJRVkZHTEUxQlFVMHNXVUZCV1N4SFFVRkhMR05CUVdNc1YwRkJWeXhEUVVGRE96czdPenRKUVVzelF5eFhRVUZYTEVkQlFVYzdVVUZEVml4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVOU0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4SFFVRkhMR05CUVdNc1EwRkJRenRSUVVOd1F5eE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRia1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU5vUkN4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0UlFVVXpRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVNeFFpeGpRVUZqTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3h4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJoRUxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1ZVRkJWU3hEUVVGRE8xbEJRemRDTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTenRaUVVOcVFpeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwN1dVRkRia0lzVDBGQlR5eEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBPMWxCUTNKQ0xGVkJRVlVzUlVGQlJTeEpRVUZKTEVOQlFVTXNWVUZCVlR0VFFVTTVRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5LTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JTEdWQlFXVTdXVUZEWml4blFrRkJaMEk3V1VGRGFFSXNiMEpCUVc5Q08xbEJRM0JDTEd0Q1FVRnJRanRaUVVOc1FpeG5RMEZCWjBNN1dVRkRhRU1zWjBOQlFXZERPMWxCUTJoRExDdENRVUVyUWp0WlFVTXZRaXgxUWtGQmRVSTdVMEZETVVJc1EwRkJRenRMUVVOTU96dEpRVVZFTEhkQ1FVRjNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeFJRVUZSTEVWQlFVVXNVVUZCVVN4RlFVRkZPMUZCUXk5RExFMUJRVTBzVFVGQlRTeEhRVUZITEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGFrTXNVVUZCVVN4SlFVRkpPMUZCUTFvc1MwRkJTeXhsUVVGbExFVkJRVVU3V1VGRGJFSXNUVUZCVFN4TFFVRkxMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTXNVVUZCVVN4RlFVRkZMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeGhRVUZoTEVOQlFVTXNRMEZCUXp0WlFVTnNSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkRNVUlzVFVGQlRTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRE5VTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUWtGQlowSXNSVUZCUlR0WlFVTnVRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eHBRa0ZCYVVJc1EwRkJReXhSUVVGUkxFVkJRVVVzVjBGQlZ5eERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMR05CUVdNc1EwRkJReXhEUVVGRE8xbEJRM0JHTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF6dFpRVU0xUWl4TlFVRk5MRU5CUVVNc1dVRkJXU3hEUVVGRExHZENRVUZuUWl4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc2IwSkJRVzlDTEVWQlFVVTdXVUZEZGtJc1RVRkJUU3hWUVVGVkxFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlF6VkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeEhRVUZITEZWQlFWVXNRMEZCUXp0WlFVTndReXhOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEd0Q1FVRnJRaXhGUVVGRk8xbEJRM0pDTEUxQlFVMHNUMEZCVHl4SFFVRkhMR2xDUVVGcFFpeERRVUZETEZGQlFWRXNSVUZCUlN4WFFVRlhMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1EwRkJRenRaUVVOMlJpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1IwRkJSeXhQUVVGUExFTkJRVU03V1VGRE9VSXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUTBGQlowTXNSVUZCUlR0WlFVTnVReXhOUVVGTkxHZENRVUZuUWl4SFFVRkhRU3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4UlFVRlJMRVZCUVVVc1ZVRkJWU3hEUVVGRExGRkJRVkVzUlVGQlJTeG5RMEZCWjBNc1JVRkJSU3c0UWtGQk9FSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRMnhLTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zWjBKQlFXZENMRU5CUVVNN1dVRkRka01zVFVGQlRUdFRRVU5VTzFGQlEwUXNVMEZCVXl4QlFVVlNPMU5CUTBFN08xRkJSVVFzVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNKQ096dEpRVVZFTEdsQ1FVRnBRaXhIUVVGSE8xRkJRMmhDTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eGxRVUZsTEVWQlFVVXNUVUZCVFR0WlFVTjZReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMmRDUVVObUxGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRjRVE3VTBGRFNpeERRVUZETEVOQlFVTTdPMUZCUlVnc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMDdXVUZETTBNc1YwRkJWeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSQ3hsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROMElzUTBGQlF5eERRVUZET3pzN08xRkJTVWdzU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RlFVRkZPMWxCUTJoRUxFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMFE3UzBGRFNqczdTVUZGUkN4dlFrRkJiMElzUjBGQlJ6dExRVU4wUWpzN1NVRkZSQ3hsUVVGbExFZEJRVWM3UzBGRGFrSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU0xUWpzN096czdPenM3U1VGUlJDeEpRVUZKTEVsQlFVa3NSMEZCUnp0UlFVTlFMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eHZRa0ZCYjBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkVPenM3T3pzN08wbEJUMFFzU1VGQlNTeHRRa0ZCYlVJc1IwRkJSenRSUVVOMFFpeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc2JVSkJRVzFDTEVOQlFVTTdTMEZETVVNN096czdPenM3U1VGUFJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR1ZCUVdVc1JVRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF6dExRVU16UlRzN096czdPMGxCVFVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeG5Ra0ZCWjBJc1JVRkJSU3hqUVVGakxFTkJRVU1zUTBGQlF6dExRVU0zUlRzN096czdPMGxCVFVRc1NVRkJTU3hWUVVGVkxFZEJRVWM3VVVGRFlpeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeHZRa0ZCYjBJc1JVRkJSU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMHRCUTNKR096czdPenM3TzBsQlQwUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hyUWtGQmEwSXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eERRVUZETzB0QlEycEdPenM3T3pzN1NVRk5SQ3hKUVVGSkxHOUNRVUZ2UWl4SFFVRkhPMUZCUTNaQ0xFOUJRVThzYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZERRVUZuUXl4RlFVRkZMRGhDUVVFNFFpeERRVUZETEVOQlFVTTdTMEZEZEVjN096czdPenRKUVUxRUxFbEJRVWtzYlVKQlFXMUNMRWRCUVVjN1VVRkRkRUlzVDBGQlR5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFVkJRVVVzSzBKQlFTdENMRVZCUVVVc05rSkJRVFpDTEVOQlFVTXNRMEZCUXp0TFFVTndSenM3T3pzN08wbEJUVVFzU1VGQlNTeHZRa0ZCYjBJc1IwRkJSenRSUVVOMlFpeFBRVUZQTEcxQ1FVRnRRaXhEUVVGRExFbEJRVWtzUlVGQlJTeG5RMEZCWjBNc1JVRkJSU3c0UWtGQk9FSXNRMEZCUXl4RFFVRkRPMHRCUTNSSE96czdPenM3T3pzN1NVRlRSQ3hKUVVGSkxGbEJRVmtzUjBGQlJ6dFJRVU5tTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEhWQ1FVRjFRaXhGUVVGRkxIRkNRVUZ4UWl4RFFVRkRMRU5CUVVNN1MwRkRNMFk3T3pzN096czdPenRKUVZORUxFbEJRVWtzVjBGQlZ5eEhRVUZITzFGQlEyUXNTVUZCU1N4VlFVRlZMRWRCUVVjc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlEwa3NWVUZCWlN4RFFVRkRMRU5CUVVNN1VVRkRja1FzU1VGQlNTeEpRVUZKTEV0QlFVc3NWVUZCVlN4RlFVRkZPMWxCUTNKQ0xGVkJRVlVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRRU3hWUVVGbExFTkJRVU1zUTBGQlF6dFRRVU5zUkRzN1VVRkZSQ3hQUVVGUExGVkJRVlVzUTBGQlF6dExRVU55UWpzN096czdPenRKUVU5RUxFbEJRVWtzVDBGQlR5eEhRVUZITzFGQlExWXNUMEZCVHl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFOUJRVThzUTBGQlF6dExRVU51UXpzN096czdPenM3T3p0SlFWVkVMRk5CUVZNc1EwRkJReXhOUVVGTkxFZEJRVWNzY1VKQlFYRkNMRVZCUVVVN1VVRkRkRU1zU1VGQlNTeE5RVUZOTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhGUVVGRk8xbEJRek5DTEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUVVVc1EwRkJRenRUUVVOMFFqdFJRVU5FTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVONFF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnBFTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRMUVVOd1FqczdPenM3T3pzN096czdPenM3T3pzN096dEpRVzFDUkN4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFVkJRVVVzUlVGQlJUdFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zVFVGQlRTeFpRVUZaTEUxQlFVMHNSMEZCUnl4TlFVRk5MRWRCUVVjc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTnVSanM3T3pzN096dEpRVTlFTEZOQlFWTXNRMEZCUXl4SFFVRkhMRVZCUVVVN1VVRkRXQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eFZRVUZWTEVsQlFVa3NSMEZCUnl4RFFVRkRMRlZCUVZVc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRE0wTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU42UWp0TFFVTktPenM3T3pzN096czdPenM3T3p0SlFXTkVMRk5CUVZNc1EwRkJReXhOUVVGTkxFZEJRVWNzUlVGQlJTeEZRVUZGTzFGQlEyNUNMRTlCUVU4c1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eFhRVUZYTEVOQlFVTXNUVUZCVFN4WlFVRlpMRk5CUVZNc1IwRkJSeXhOUVVGTkxFZEJRVWNzU1VGQlNTeFRRVUZUTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOeVJ6czdPenM3T3p0SlFVOUVMRmxCUVZrc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRGFrSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1ZVRkJWU3hKUVVGSkxFMUJRVTBzUTBGQlF5eFZRVUZWTEV0QlFVc3NTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRaUVVNM1JDeEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRmRCUVZjc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFRRVU40UXp0TFFVTktPenREUVVWS0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU5NTEZkQlFWRXNSVUZCUlN4WlFVRlpMRU5CUVVNc1EwRkJRenM3UVVNNWJFSnlSRHM3T3pzN096czdPenM3T3pzN096czdPMEZCYTBKQkxFRkJTMEVzVFVGQlRTeERRVUZETEdGQlFXRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1lVRkJZU3hKUVVGSkxFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZEZWtRc1QwRkJUeXhGUVVGRkxFOUJRVTg3U1VGRGFFSXNUMEZCVHl4RlFVRkZMRlZCUVZVN1NVRkRia0lzVDBGQlR5eEZRVUZGTERKQ1FVRXlRanRKUVVOd1F5eFpRVUZaTEVWQlFVVXNXVUZCV1R0SlFVTXhRaXhOUVVGTkxFVkJRVVVzVFVGQlRUdEpRVU5rTEZOQlFWTXNSVUZCUlN4VFFVRlRPMGxCUTNCQ0xHRkJRV0VzUlVGQlJTeGhRVUZoTzBOQlF5OUNMRU5CUVVNc1EwRkJReUo5In0=
