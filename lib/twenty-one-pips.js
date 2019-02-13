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
};

window.customElements.define("top-dice-board", TopDiceBoard);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwidmFsaWRhdGUvZXJyb3IvVmFsaWRhdGlvbkVycm9yLmpzIiwidmFsaWRhdGUvVHlwZVZhbGlkYXRvci5qcyIsInZhbGlkYXRlL2Vycm9yL1BhcnNlRXJyb3IuanMiLCJ2YWxpZGF0ZS9lcnJvci9JbnZhbGlkVHlwZUVycm9yLmpzIiwidmFsaWRhdGUvSW50ZWdlclR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS9TdHJpbmdUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQ29sb3JUeXBlVmFsaWRhdG9yLmpzIiwidmFsaWRhdGUvQm9vbGVhblR5cGVWYWxpZGF0b3IuanMiLCJ2YWxpZGF0ZS92YWxpZGF0ZS5qcyIsIlRvcFBsYXllci5qcyIsIlRvcERpY2VCb2FyZC5qcyIsIlRvcERpZS5qcyIsIlRvcFBsYXllckxpc3QuanMiLCJ0d2VudHktb25lLXBpcHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbkVycm9yXG4gKlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuY29uc3QgQ29uZmlndXJhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlndXJhdGlvbkVycm9yIHdpdGggbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXNcbiAgICAgKiBDb25maWd1cmF0aW9uRXJyb3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG5leHBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgRlVMTF9DSVJDTEVfSU5fREVHUkVFUyA9IDM2MDtcblxuY29uc3QgcmFuZG9taXplQ2VudGVyID0gKG4pID0+IHtcbiAgICByZXR1cm4gKDAuNSA8PSBNYXRoLnJhbmRvbSgpID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbCkuY2FsbCgwLCBuKTtcbn07XG5cbi8vIFByaXZhdGUgZmllbGRzXG5jb25zdCBfd2lkdGggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlaWdodCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29scyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm93cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGljZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGllU2l6ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGlzcGVyc2lvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRlID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmlkTGF5b3V0Q29uZmlndXJhdGlvblxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy53aWR0aCAtIFRoZSBtaW5pbWFsIHdpZHRoIG9mIHRoaXNcbiAqIEdyaWRMYXlvdXQgaW4gcGl4ZWxzLjtcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcuaGVpZ2h0XSAtIFRoZSBtaW5pbWFsIGhlaWdodCBvZlxuICogdGhpcyBHcmlkTGF5b3V0IGluIHBpeGVscy4uXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpc3BlcnNpb24gLSBUaGUgZGlzdGFuY2UgZnJvbSB0aGUgY2VudGVyIG9mIHRoZVxuICogbGF5b3V0IGEgZGllIGNhbiBiZSBsYXlvdXQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAqL1xuXG4vKipcbiAqIEdyaWRMYXlvdXQgaGFuZGxlcyBsYXlpbmcgb3V0IHRoZSBkaWNlIG9uIGEgRGljZUJvYXJkLlxuICovXG5jb25zdCBHcmlkTGF5b3V0ID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0dyaWRMYXlvdXRDb25maWd1cmF0aW9ufSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgR3JpZExheW91dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgZGlzcGVyc2lvbixcbiAgICAgICAgZGllU2l6ZVxuICAgIH0gPSB7fSkge1xuICAgICAgICBfZGljZS5zZXQodGhpcywgW10pO1xuICAgICAgICBfZGllU2l6ZS5zZXQodGhpcywgMSk7XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgMCk7XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIDApO1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmRpc3BlcnNpb24gPSBkaXNwZXJzaW9uO1xuICAgICAgICB0aGlzLmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBXaWR0aCA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn0gXG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gX3dpZHRoLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgd2lkdGgodykge1xuICAgICAgICBpZiAoMCA+IHcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFdpZHRoIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAwLCBnb3QgJyR7d30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX3dpZHRoLnNldCh0aGlzLCB3KTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBpbiBwaXhlbHMgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgSGVpZ2h0ID49IDBcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWlnaHQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBoZWlnaHQoaCkge1xuICAgICAgICBpZiAoMCA+IGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYEhlaWdodCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2h9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9oZWlnaHQuc2V0KHRoaXMsIGgpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVHcmlkKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgb24gdGhpcyBHcmlkTGF5b3V0LiBUaGlzXG4gICAgICogbnVtYmVyIGlzID49IDAuIFJlYWQgb25seS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IG1heGltdW1OdW1iZXJPZkRpY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb2xzICogdGhpcy5fcm93cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCB1c2VkIGJ5IHRoaXMgR3JpZExheW91dC4gVGhlIGRpc3BlcnNpb24gbGV2ZWxcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBkaWNlIGNhbiBiZSBsYXlvdXQuIFVzZSAxIGZvciBhXG4gICAgICogdGlnaHQgcGFja2VkIGxheW91dC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgRGlzcGVyc2lvbiA+PSAwXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGlzcGVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIF9kaXNwZXJzaW9uLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgZGlzcGVyc2lvbihkKSB7XG4gICAgICAgIGlmICgwID4gZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcihgRGlzcGVyc2lvbiBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke2R9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5zZXQodGhpcywgZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIERpZVNpemUgPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpZVNpemUoKSB7XG4gICAgICAgIHJldHVybiBfZGllU2l6ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpZVNpemUoZHMpIHtcbiAgICAgICAgaWYgKDAgPj0gZHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYGRpZVNpemUgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDEsIGdvdCAnJHtkc30nIGluc3RlYWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgX2RpZVNpemUuc2V0KHRoaXMsIGRzKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgZ2V0IHJvdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgciA9IF9yb3RhdGUuZ2V0KHRoaXMpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkID09PSByID8gdHJ1ZSA6IHI7XG4gICAgfVxuXG4gICAgc2V0IHJvdGF0ZShyKSB7XG4gICAgICAgIF9yb3RhdGUuc2V0KHRoaXMsIHIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2Ygcm93cywgMCA8IHJvd3MuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX3Jvd3MoKSB7XG4gICAgICAgIHJldHVybiBfcm93cy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiBjb2x1bW5zIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiBjb2x1bW5zLCAwIDwgY29sdW1ucy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldCBfY29scygpIHtcbiAgICAgICAgcmV0dXJuIF9jb2xzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2VudGVyIGNlbGwgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY2VudGVyIChyb3csIGNvbCkuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NlbnRlcigpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gcmFuZG9taXplQ2VudGVyKHRoaXMuX3Jvd3MgLyAyKSAtIDE7XG4gICAgICAgIGNvbnN0IGNvbCA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9jb2xzIC8gMikgLSAxO1xuXG4gICAgICAgIHJldHVybiB7cm93LCBjb2x9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExheW91dCBkaWNlIG9uIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOkRpZX5EaWVbXX0gZGljZSAtIFRoZSBkaWNlIHRvIGxheW91dCBvbiB0aGlzIExheW91dC5cbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6RGllfkRpZVtdfSBUaGUgc2FtZSBsaXN0IG9mIGRpY2UsIGJ1dCBub3cgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHRocm93cyB7bW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvcn5Db25maWd1cmF0aW9uRXJyb3J9IFRoZSBudW1iZXIgb2ZcbiAgICAgKiBkaWNlIHNob3VsZCBub3QgZXhjZWVkIHRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoaXMgTGF5b3V0IGNhblxuICAgICAqIGxheW91dC5cbiAgICAgKi9cbiAgICBsYXlvdXQoZGljZSkge1xuICAgICAgICBpZiAoZGljZS5sZW5ndGggPiB0aGlzLm1heGltdW1OdW1iZXJPZkRpY2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYFRoZSBudW1iZXIgb2YgZGljZSB0aGF0IGNhbiBiZSBsYXlvdXQgaXMgJHt0aGlzLm1heGltdW1OdW1iZXJPZkRpY2V9LCBnb3QgJHtkaWNlLmxlbmdodH0gZGljZSBpbnN0ZWFkLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxyZWFkeUxheW91dERpY2UgPSBbXTtcbiAgICAgICAgY29uc3QgZGljZVRvTGF5b3V0ID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZSkge1xuICAgICAgICAgICAgaWYgKGRpZS5oYXNDb29yZGluYXRlcygpICYmIGRpZS5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIC8vIERpY2UgdGhhdCBhcmUgYmVpbmcgaGVsZCBhbmQgaGF2ZSBiZWVuIGxheW91dCBiZWZvcmUgc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0aGVpciBjdXJyZW50IGNvb3JkaW5hdGVzIGFuZCByb3RhdGlvbi4gSW4gb3RoZXIgd29yZHMsXG4gICAgICAgICAgICAgICAgLy8gdGhlc2UgZGljZSBhcmUgc2tpcHBlZC5cbiAgICAgICAgICAgICAgICBhbHJlYWR5TGF5b3V0RGljZS5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY2VUb0xheW91dC5wdXNoKGRpZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1pbihkaWNlLmxlbmd0aCAqIHRoaXMuZGlzcGVyc2lvbiwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlQ2VsbHMgPSB0aGlzLl9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaWUgb2YgZGljZVRvTGF5b3V0KSB7XG4gICAgICAgICAgICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGF2YWlsYWJsZUNlbGxzLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCByYW5kb21DZWxsID0gYXZhaWxhYmxlQ2VsbHNbcmFuZG9tSW5kZXhdO1xuICAgICAgICAgICAgYXZhaWxhYmxlQ2VsbHMuc3BsaWNlKHJhbmRvbUluZGV4LCAxKTtcblxuICAgICAgICAgICAgZGllLmNvb3JkaW5hdGVzID0gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhyYW5kb21DZWxsKTtcbiAgICAgICAgICAgIGRpZS5yb3RhdGlvbiA9IHRoaXMucm90YXRlID8gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogRlVMTF9DSVJDTEVfSU5fREVHUkVFUykgOiBudWxsO1xuICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2RpY2Uuc2V0KHRoaXMsIGFscmVhZHlMYXlvdXREaWNlKTtcblxuICAgICAgICByZXR1cm4gYWxyZWFkeUxheW91dERpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSBhIGxpc3Qgd2l0aCBhdmFpbGFibGUgY2VsbHMgdG8gcGxhY2UgZGljZSBvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXggLSBUaGUgbnVtYmVyIGVtcHR5IGNlbGxzIHRvIGNvbXB1dGUuXG4gICAgICogQHBhcmFtIHtEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgd2l0aCBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge05VbWJlcltdfSBUaGUgbGlzdCBvZiBhdmFpbGFibGUgY2VsbHMgcmVwcmVzZW50ZWQgYnkgdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NvbXB1dGVBdmFpbGFibGVDZWxscyhtYXgsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgbGV0IGxldmVsID0gMDtcbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBNYXRoLm1pbih0aGlzLl9yb3dzLCB0aGlzLl9jb2xzKTtcblxuICAgICAgICB3aGlsZSAoYXZhaWxhYmxlLnNpemUgPCBtYXggJiYgbGV2ZWwgPCBtYXhMZXZlbCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjZWxsIG9mIHRoaXMuX2NlbGxzT25MZXZlbChsZXZlbCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodW5kZWZpbmVkICE9PSBjZWxsICYmIHRoaXMuX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGUuYWRkKGNlbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV2ZWwrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGF2YWlsYWJsZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIGFsbCBjZWxscyBvbiBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbCAtIFRoZSBsZXZlbCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxheW91dC4gMFxuICAgICAqIGluZGljYXRlcyB0aGUgY2VudGVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U2V0PE51bWJlcj59IHRoZSBjZWxscyBvbiB0aGUgbGV2ZWwgaW4gdGhpcyBsYXlvdXQgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGVpciBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbHNPbkxldmVsKGxldmVsKSB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gbmV3IFNldCgpO1xuICAgICAgICBjb25zdCBjZW50ZXIgPSB0aGlzLl9jZW50ZXI7XG5cbiAgICAgICAgaWYgKDAgPT09IGxldmVsKSB7XG4gICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKGNlbnRlcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gY2VudGVyLnJvdyAtIGxldmVsOyByb3cgPD0gY2VudGVyLnJvdyArIGxldmVsOyByb3crKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sIC0gbGV2ZWx9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93LCBjb2w6IGNlbnRlci5jb2wgKyBsZXZlbH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gY2VudGVyLmNvbCAtIGxldmVsICsgMTsgY29sIDwgY2VudGVyLmNvbCArIGxldmVsOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyAtIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcih7cm93OiBjZW50ZXIucm93ICsgbGV2ZWwsIGNvbH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjZWxscztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIGNlbGwgY29udGFpbiBhIGNlbGwgZnJvbSBhbHJlYWR5TGF5b3V0RGljZT9cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjZWxsIC0gQSBjZWxsIGluIGxheW91dCByZXByZXNlbnRlZCBieSBhIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge0RpZVtdfSBhbHJlYWR5TGF5b3V0RGljZSAtIEEgbGlzdCBvZiBkaWNlIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gbGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBjZWxsIGRvZXMgbm90IGNvbnRhaW4gYSBkaWUuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbElzRW1wdHkoY2VsbCwgYWxyZWFkeUxheW91dERpY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gYWxyZWFkeUxheW91dERpY2UuZmluZChkaWUgPT4gY2VsbCA9PT0gdGhpcy5fY29vcmRpbmF0ZXNUb051bWJlcihkaWUuY29vcmRpbmF0ZXMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgbnVtYmVyIHRvIGEgY2VsbCAocm93LCBjb2wpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiAtIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIGEgY2VsbFxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybiB0aGUgY2VsbCAoe3JvdywgY29sfSkgY29ycmVzcG9uZGluZyBuLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX251bWJlclRvQ2VsbChuKSB7XG4gICAgICAgIHJldHVybiB7cm93OiBNYXRoLnRydW5jKG4gLyB0aGlzLl9jb2xzKSwgY29sOiBuICUgdGhpcy5fY29sc307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgdG8gYSBudW1iZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBpdHMgbnVtYmVyLlxuICAgICAqIEByZXR1cm4ge051bWJlcnx1bmRlZmluZWR9IFRoZSBudW1iZXIgY29ycmVzcG9uZGluZyB0byB0aGUgY2VsbC5cbiAgICAgKiBSZXR1cm5zIHVuZGVmaW5lZCB3aGVuIHRoZSBjZWxsIGlzIG5vdCBvbiB0aGUgbGF5b3V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvTnVtYmVyKHtyb3csIGNvbH0pIHtcbiAgICAgICAgaWYgKDAgPD0gcm93ICYmIHJvdyA8IHRoaXMuX3Jvd3MgJiYgMCA8PSBjb2wgJiYgY29sIDwgdGhpcy5fY29scykge1xuICAgICAgICAgICAgcmV0dXJuIHJvdyAqIHRoaXMuX2NvbHMgKyBjb2w7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgY2VsbCByZXByZXNlbnRlZCBieSBpdHMgbnVtYmVyIHRvIHRoZWlyIGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvb3JkaW5hdGVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwgcmVwcmVzZW50ZWQgYnlcbiAgICAgKiB0aGlzIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0Nvb3JkaW5hdGVzKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NlbGxUb0Nvb3Jkcyh0aGlzLl9udW1iZXJUb0NlbGwobikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBwYWlyIG9mIGNvb3JkaW5hdGVzIHRvIGEgbnVtYmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkcyAtIFRoZSBjb29yZGluYXRlcyB0byBjb252ZXJ0XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgY29vcmRpbmF0ZXMgY29udmVydGVkIHRvIGEgbnVtYmVyLiBJZlxuICAgICAqIHRoZSBjb29yZGluYXRlcyBhcmUgbm90IG9uIHRoaXMgbGF5b3V0LCB0aGUgbnVtYmVyIGlzIHVuZGVmaW5lZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb29yZGluYXRlc1RvTnVtYmVyKGNvb3Jkcykge1xuICAgICAgICBjb25zdCBuID0gdGhpcy5fY2VsbFRvTnVtYmVyKHRoaXMuX2Nvb3Jkc1RvQ2VsbChjb29yZHMpKTtcbiAgICAgICAgaWYgKDAgPD0gbiAmJiBuIDwgdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNuYXAgKHgseSkgdG8gdGhlIGNsb3Nlc3QgY2VsbCBpbiB0aGlzIExheW91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkaWVjb29yZGluYXRlIC0gVGhlIGNvb3JkaW5hdGUgdG8gZmluZCB0aGUgY2xvc2VzdCBjZWxsXG4gICAgICogZm9yLlxuICAgICAqIEBwYXJhbSB7RGllfSBbZGllY29vcmRpbmF0LmRpZSA9IG51bGxdIC0gVGhlIGRpZSB0byBzbmFwIHRvLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnggLSBUaGUgeC1jb29yZGluYXRlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVjb29yZGluYXRlLnkgLSBUaGUgeS1jb29yZGluYXRlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fG51bGx9IFRoZSBjb29yZGluYXRlIG9mIHRoZSBjZWxsIGNsb3Nlc3QgdG8gKHgsIHkpLlxuICAgICAqIE51bGwgd2hlbiBubyBzdWl0YWJsZSBjZWxsIGlzIG5lYXIgKHgsIHkpXG4gICAgICovXG4gICAgc25hcFRvKHtkaWUgPSBudWxsLCB4LCB5fSkge1xuICAgICAgICBjb25zdCBjb3JuZXJDZWxsID0ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29ybmVyID0gdGhpcy5fY2VsbFRvQ29vcmRzKGNvcm5lckNlbGwpO1xuICAgICAgICBjb25zdCB3aWR0aEluID0gY29ybmVyLnggKyB0aGlzLmRpZVNpemUgLSB4O1xuICAgICAgICBjb25zdCB3aWR0aE91dCA9IHRoaXMuZGllU2l6ZSAtIHdpZHRoSW47XG4gICAgICAgIGNvbnN0IGhlaWdodEluID0gY29ybmVyLnkgKyB0aGlzLmRpZVNpemUgLSB5O1xuICAgICAgICBjb25zdCBoZWlnaHRPdXQgPSB0aGlzLmRpZVNpemUgLSBoZWlnaHRJbjtcblxuICAgICAgICBjb25zdCBxdWFkcmFudHMgPSBbe1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKGNvcm5lckNlbGwpLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoSW4gKiBoZWlnaHRJblxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3csXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93ICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IGNvcm5lckNlbGwuY29sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0T3V0XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbCArIDFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY292ZXJhZ2U6IHdpZHRoT3V0ICogaGVpZ2h0T3V0XG4gICAgICAgIH1dO1xuXG4gICAgICAgIGNvbnN0IHNuYXBUbyA9IHF1YWRyYW50c1xuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgb24gdGhlIGxheW91dFxuICAgICAgICAgICAgLmZpbHRlcigocXVhZHJhbnQpID0+IHVuZGVmaW5lZCAhPT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG5vdCBhbHJlYWR5IHRha2VuIGV4Y2VwdCBieSBpdHNlbGZcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiAoXG4gICAgICAgICAgICAgICAgbnVsbCAhPT0gZGllICYmIHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSA9PT0gcXVhZHJhbnQucSlcbiAgICAgICAgICAgICAgICB8fCB0aGlzLl9jZWxsSXNFbXB0eShxdWFkcmFudC5xLCBfZGljZS5nZXQodGhpcykpKVxuICAgICAgICAgICAgLy8gY2VsbCBzaG91bGQgYmUgY292ZXJlZCBieSB0aGUgZGllIHRoZSBtb3N0XG4gICAgICAgICAgICAucmVkdWNlKFxuICAgICAgICAgICAgICAgIChtYXhRLCBxdWFkcmFudCkgPT4gcXVhZHJhbnQuY292ZXJhZ2UgPiBtYXhRLmNvdmVyYWdlID8gcXVhZHJhbnQgOiBtYXhRLFxuICAgICAgICAgICAgICAgIHtxOiB1bmRlZmluZWQsIGNvdmVyYWdlOiAtMX1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCAhPT0gc25hcFRvLnEgPyB0aGlzLl9udW1iZXJUb0Nvb3JkaW5hdGVzKHNuYXBUby5xKSA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBkaWUgYXQgcG9pbnQgKHgsIHkpO1xuICAgICAqXG4gICAgICogQHBhcmFtIHtQb2ludH0gcG9pbnQgLSBUaGUgcG9pbnQgaW4gKHgsIHkpIGNvb3JkaW5hdGVzXG4gICAgICogQHJldHVybiB7RGllfG51bGx9IFRoZSBkaWUgdW5kZXIgY29vcmRpbmF0ZXMgKHgsIHkpIG9yIG51bGwgaWYgbm8gZGllXG4gICAgICogaXMgYXQgdGhlIHBvaW50LlxuICAgICAqL1xuICAgIGdldEF0KHBvaW50ID0ge3g6IDAsIHk6IDB9KSB7XG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIF9kaWNlLmdldCh0aGlzKSkge1xuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb25zdCB4Rml0ID0geCA8PSBwb2ludC54ICYmIHBvaW50LnggPD0geCArIHRoaXMuZGllU2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IHlGaXQgPSB5IDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB5ICsgdGhpcy5kaWVTaXplO1xuXG4gICAgICAgICAgICBpZiAoeEZpdCAmJiB5Rml0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB0aGUgZ3JpZCBzaXplIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgLSBUaGUgbWluaW1hbCBoZWlnaHRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NhbGN1bGF0ZUdyaWQod2lkdGgsIGhlaWdodCkge1xuICAgICAgICBfY29scy5zZXQodGhpcywgTWF0aC5mbG9vcih3aWR0aCAvIHRoaXMuZGllU2l6ZSkpO1xuICAgICAgICBfcm93cy5zZXQodGhpcywgTWF0aC5mbG9vcihoZWlnaHQgLyB0aGlzLmRpZVNpemUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgKHJvdywgY29sKSBjZWxsIHRvICh4LCB5KSBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZWxsIC0gVGhlIGNlbGwgdG8gY29udmVydCB0byBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY29vcmRpbmF0ZXMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2VsbFRvQ29vcmRzKHtyb3csIGNvbH0pIHtcbiAgICAgICAgcmV0dXJuIHt4OiBjb2wgKiB0aGlzLmRpZVNpemUsIHk6IHJvdyAqIHRoaXMuZGllU2l6ZX07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCAoeCwgeSkgY29vcmRpbmF0ZXMgdG8gYSAocm93LCBjb2wpIGNlbGwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29vcmRpbmF0ZXMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydCB0byBhIGNlbGwuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY29ycmVzcG9uZGluZyBjZWxsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRzVG9DZWxsKHt4LCB5fSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm93OiBNYXRoLnRydW5jKHkgLyB0aGlzLmRpZVNpemUpLFxuICAgICAgICAgICAgY29sOiBNYXRoLnRydW5jKHggLyB0aGlzLmRpZVNpemUpXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuZXhwb3J0IHtHcmlkTGF5b3V0fTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8qKlxuICogQG1vZHVsZSBtaXhpbi9SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuXG4vKlxuICogQ29udmVydCBhbiBIVE1MIGF0dHJpYnV0ZSB0byBhbiBpbnN0YW5jZSdzIHByb3BlcnR5LiBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBhdHRyaWJ1dGUncyBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5J3MgbmFtZS4gRm9yIGV4YW1wbGUsIFwibXktYXR0clwiXG4gKiB3aWxsIGJlIGNvbnZlcnRlZCB0byBcIm15QXR0clwiLCBhbmQgXCJkaXNhYmxlZFwiIHRvIFwiZGlzYWJsZWRcIi5cbiAqL1xuY29uc3QgYXR0cmlidXRlMnByb3BlcnR5ID0gKG5hbWUpID0+IHtcbiAgICBjb25zdCBbZmlyc3QsIC4uLnJlc3RdID0gbmFtZS5zcGxpdChcIi1cIik7XG4gICAgcmV0dXJuIGZpcnN0ICsgcmVzdC5tYXAod29yZCA9PiB3b3JkLnNsaWNlKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKS5qb2luKCk7XG59O1xuXG4vKipcbiAqIE1peGluIHtAbGluayBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc30gdG8gYSBjbGFzcy5cbiAqXG4gKiBAcGFyYW0geyp9IFN1cCAtIFRoZSBjbGFzcyB0byBtaXggaW50by5cbiAqIEByZXR1cm4ge21vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzfSBUaGUgbWl4ZWQtaW4gY2xhc3NcbiAqL1xuY29uc3QgUmVhZE9ubHlBdHRyaWJ1dGVzID0gKFN1cCkgPT5cbiAgICAvKipcbiAgICAgKiBNaXhpbiB0byBtYWtlIGFsbCBhdHRyaWJ1dGVzIG9uIGEgY3VzdG9tIEhUTUxFbGVtZW50IHJlYWQtb25seSBpbiB0aGUgc2Vuc2VcbiAgICAgKiB0aGF0IHdoZW4gdGhlIGF0dHJpYnV0ZSBnZXRzIGEgbmV3IHZhbHVlIHRoYXQgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBvZiB0aGVcbiAgICAgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5LCBpdCBpcyByZXNldCB0byB0aGF0IHByb3BlcnR5J3MgdmFsdWUuIFRoZVxuICAgICAqIGFzc3VtcHRpb24gaXMgdGhhdCBhdHRyaWJ1dGUgXCJteS1hdHRyaWJ1dGVcIiBjb3JyZXNwb25kcyB3aXRoIHByb3BlcnR5IFwidGhpcy5teUF0dHJpYnV0ZVwiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDbGFzc30gU3VwIC0gVGhlIGNsYXNzIHRvIG1peGluIHRoaXMgUmVhZE9ubHlBdHRyaWJ1dGVzLlxuICAgICAqIEByZXR1cm4ge1JlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkIGluIGNsYXNzLlxuICAgICAqXG4gICAgICogQG1peGluXG4gICAgICogQGFsaWFzIG1vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzXG4gICAgICovXG4gICAgY2xhc3MgZXh0ZW5kcyBTdXAge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYW4gb2JzZXJ2ZWQgYXR0cmlidXRlJ3MgdmFsdWUgaXNcbiAgICAgICAgICogY2hhbmdlZC4gSWYgdGhlIEhUTUxFbGVtZW50IGlzIGNvbm5lY3RlZCB0byB0aGUgRE9NLCB0aGUgYXR0cmlidXRlXG4gICAgICAgICAqIHZhbHVlIGNhbiBvbmx5IGJlIHNldCB0byB0aGUgY29ycmVzcG9uZGluZyBIVE1MRWxlbWVudCdzIHByb3BlcnR5LlxuICAgICAgICAgKiBJbiBlZmZlY3QsIHRoaXMgbWFrZXMgdGhpcyBIVE1MRWxlbWVudCdzIGF0dHJpYnV0ZXMgcmVhZC1vbmx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgaWYgYW4gSFRNTEVsZW1lbnQgaGFzIGFuIGF0dHJpYnV0ZSBcInhcIiBhbmRcbiAgICAgICAgICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBcInhcIiwgdGhlbiBjaGFuZ2luZyB0aGUgdmFsdWUgXCJ4XCIgdG8gXCI1XCJcbiAgICAgICAgICogd2lsbCBvbmx5IHdvcmsgd2hlbiBgdGhpcy54ID09PSA1YC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG9sZFZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG9sZCB2YWx1ZS5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlIC0gVGhlIGF0dHJpYnV0ZSdzIG5ldyB2YWx1ZS5cbiAgICAgICAgICovXG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIEFsbCBhdHRyaWJ1dGVzIGFyZSBtYWRlIHJlYWQtb25seSB0byBwcmV2ZW50IGNoZWF0aW5nIGJ5IGNoYW5naW5nXG4gICAgICAgICAgICAvLyB0aGUgYXR0cmlidXRlIHZhbHVlcy4gT2YgY291cnNlLCB0aGlzIGlzIGJ5IG5vXG4gICAgICAgICAgICAvLyBndWFyYW50ZWUgdGhhdCB1c2VycyB3aWxsIG5vdCBjaGVhdCBpbiBhIGRpZmZlcmVudCB3YXkuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IGF0dHJpYnV0ZTJwcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCAmJiBuZXdWYWx1ZSAhPT0gYCR7dGhpc1twcm9wZXJ0eV19YCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIHRoaXNbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbmV4cG9ydCB7XG4gICAgUmVhZE9ubHlBdHRyaWJ1dGVzXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5jb25zdCBWYWxpZGF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRpb25FcnJvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtWYWxpZGF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL1ZhbGlkYXRpb25FcnJvci5qc1wiO1xuXG5jb25zdCBfdmFsdWUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RlZmF1bHRWYWx1ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZXJyb3JzID0gbmV3IFdlYWtNYXAoKTtcblxuY29uc3QgVHlwZVZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3Rvcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzID0gW119KSB7XG4gICAgICAgIF92YWx1ZS5zZXQodGhpcywgdmFsdWUpO1xuICAgICAgICBfZGVmYXVsdFZhbHVlLnNldCh0aGlzLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICBfZXJyb3JzLnNldCh0aGlzLCBlcnJvcnMpO1xuICAgIH1cblxuICAgIGdldCBvcmlnaW4oKSB7XG4gICAgICAgIHJldHVybiBfdmFsdWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMub3JpZ2luIDogX2RlZmF1bHRWYWx1ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IGVycm9ycygpIHtcbiAgICAgICAgcmV0dXJuIF9lcnJvcnMuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBpc1ZhbGlkKCkge1xuICAgICAgICByZXR1cm4gMCA+PSB0aGlzLmVycm9ycy5sZW5ndGg7XG4gICAgfVxuXG4gICAgZGVmYXVsdFRvKG5ld0RlZmF1bHQpIHtcbiAgICAgICAgX2RlZmF1bHRWYWx1ZS5zZXQodGhpcywgbmV3RGVmYXVsdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIF9jaGVjayh7cHJlZGljYXRlLCBiaW5kVmFyaWFibGVzID0gW10sIEVycm9yVHlwZSA9IFZhbGlkYXRpb25FcnJvcn0pIHtcbiAgICAgICAgY29uc3QgcHJvcG9zaXRpb24gPSBwcmVkaWNhdGUuYXBwbHkodGhpcywgYmluZFZhcmlhYmxlcyk7XG4gICAgICAgIGlmICghcHJvcG9zaXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yVHlwZSh0aGlzLnZhbHVlLCBiaW5kVmFyaWFibGVzKTtcbiAgICAgICAgICAgIC8vY29uc29sZS53YXJuKGVycm9yLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgUGFyc2VFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFBhcnNlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VmFsaWRhdGlvbkVycm9yfSBmcm9tIFwiLi9WYWxpZGF0aW9uRXJyb3IuanNcIjtcblxuY29uc3QgSW52YWxpZFR5cGVFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludmFsaWRUeXBlRXJyb3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHtQYXJzZUVycm9yfSBmcm9tIFwiLi9lcnJvci9QYXJzZUVycm9yLmpzXCI7XG5pbXBvcnQge0ludmFsaWRUeXBlRXJyb3J9IGZyb20gXCIuL2Vycm9yL0ludmFsaWRUeXBlRXJyb3IuanNcIjtcblxuY29uc3QgSU5URUdFUl9ERUZBVUxUX1ZBTFVFID0gMDtcbmNvbnN0IEludGVnZXJUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IElOVEVHRVJfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkVmFsdWUgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocGFyc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZWRWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgbGFyZ2VyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA+PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNtYWxsZXJUaGFuKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4pID0+IHRoaXMub3JpZ2luIDw9IG4sXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbl1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmV0d2VlbihuLCBtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuLCBtKSA9PiB0aGlzLmxhcmdlclRoYW4obikgJiYgdGhpcy5zbWFsbGVyVGhhbihtKSxcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuLCBtXVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIEludGVnZXJUeXBlVmFsaWRhdG9yXG59O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBTVFJJTkdfREVGQVVMVF9WQUxVRSA9IFwiXCI7XG5jb25zdCBTdHJpbmdUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTVFJJTkdfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIG5vdEVtcHR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiBcIlwiICE9PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIFN0cmluZ1R5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7VHlwZVZhbGlkYXRvcn0gZnJvbSBcIi4vVHlwZVZhbGlkYXRvci5qc1wiO1xuLy9pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBDT0xPUl9ERUZBVUxUX1ZBTFVFID0gXCJibGFja1wiO1xuY29uc3QgQ29sb3JUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG59O1xuXG5leHBvcnQge1xuICAgIENvbG9yVHlwZVZhbGlkYXRvclxufTtcbiIsIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOSBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9UeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1BhcnNlRXJyb3J9IGZyb20gXCIuL2Vycm9yL1BhcnNlRXJyb3IuanNcIjtcbmltcG9ydCB7SW52YWxpZFR5cGVFcnJvcn0gZnJvbSBcIi4vZXJyb3IvSW52YWxpZFR5cGVFcnJvci5qc1wiO1xuXG5jb25zdCBCT09MRUFOX0RFRkFVTFRfVkFMVUUgPSBmYWxzZTtcbmNvbnN0IEJvb2xlYW5UeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBCT09MRUFOX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IEJPT0xFQU5fREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgQm9vbGVhbikge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgvdHJ1ZS9pLnRlc3QoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvZmFsc2UvaS50ZXN0KGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBQYXJzZUVycm9yKGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIGlzVHJ1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gdHJ1ZSA9PT0gdGhpcy5vcmlnaW5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaXNGYWxzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKCkgPT4gZmFsc2UgPT09IHRoaXMub3JpZ2luXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7XG4gICAgQm9vbGVhblR5cGVWYWxpZGF0b3Jcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7SW50ZWdlclR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0ludGVnZXJUeXBlVmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQge1N0cmluZ1R5cGVWYWxpZGF0b3J9IGZyb20gXCIuL1N0cmluZ1R5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Q29sb3JUeXBlVmFsaWRhdG9yfSBmcm9tIFwiLi9Db2xvclR5cGVWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7Qm9vbGVhblR5cGVWYWxpZGF0b3J9IGZyb20gXCIuL0Jvb2xlYW5UeXBlVmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IFZhbGlkYXRvciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBib29sZWFuKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQm9vbGVhblR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIGNvbG9yKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBpbnRlZ2VyKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlclR5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxuICAgIHN0cmluZyhpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmluZ1R5cGVWYWxpZGF0b3IoaW5wdXQpO1xuICAgIH1cblxufTtcblxuY29uc3QgVmFsaWRhdG9yU2luZ2xldG9uID0gbmV3IFZhbGlkYXRvcigpO1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRvclNpbmdsZXRvbiBhcyB2YWxpZGF0ZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4LCAyMDE5IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vdmFsaWRhdGUvdmFsaWRhdGUuanNcIjtcblxuLy8gVGhlIG5hbWVzIG9mIHRoZSAob2JzZXJ2ZWQpIGF0dHJpYnV0ZXMgb2YgdGhlIFRvcFBsYXllci5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IE5BTUVfQVRUUklCVVRFID0gXCJuYW1lXCI7XG5jb25zdCBTQ09SRV9BVFRSSUJVVEUgPSBcInNjb3JlXCI7XG5jb25zdCBIQVNfVFVSTl9BVFRSSUJVVEUgPSBcImhhcy10dXJuXCI7XG5cbi8vIFRoZSBwcml2YXRlIHByb3BlcnRpZXMgb2YgdGhlIFRvcFBsYXllciBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXIgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBuYW1lIGF0dHJpYnV0ZSBhcmUgdHJlYXRlZCBhc1xuICogdGhlIHNhbWUgcGxheWVyLlxuICpcbiAqIEluIGdlbmVyYWwgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCBubyB0d28gcGxheWVycyBkbyBoYXZlIHRoZSBzYW1lIGNvbG9yLFxuICogYWx0aG91Z2ggaXQgaXMgbm90IHVuY29uY2VpdmFibGUgdGhhdCBjZXJ0YWluIGRpY2UgZ2FtZXMgaGF2ZSBwbGF5ZXJzIHdvcmtcbiAqIGluIHRlYW1zIHdoZXJlIGl0IHdvdWxkIG1ha2Ugc2Vuc2UgZm9yIHR3byBvciBtb3JlIGRpZmZlcmVudCBwbGF5ZXJzIHRvXG4gKiBoYXZlIHRoZSBzYW1lIGNvbG9yLlxuICpcbiAqIFRoZSBuYW1lIGFuZCBjb2xvciBhdHRyaWJ1dGVzIGFyZSByZXF1aXJlZC4gVGhlIHNjb3JlIGFuZCBoYXMtdHVyblxuICogYXR0cmlidXRlcyBhcmUgbm90LlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wUGxheWVyID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXIsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB2YWxpZGF0ZS5jb2xvcihjb2xvciB8fCB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKGNvbG9yVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBjb2xvclZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgdGhpcy5jb2xvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZVZhbHVlID0gdmFsaWRhdGUuc3RyaW5nKG5hbWUgfHwgdGhpcy5nZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpKTtcbiAgICAgICAgaWYgKG5hbWVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfbmFtZS5zZXQodGhpcywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShOQU1FX0FUVFJJQlVURSwgdGhpcy5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoXCJBIFBsYXllciBuZWVkcyBhIG5hbWUsIHdoaWNoIGlzIGEgU3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlVmFsdWUgPSB2YWxpZGF0ZS5pbnRlZ2VyKHNjb3JlIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSkpO1xuICAgICAgICBpZiAoc2NvcmVWYWx1ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHNjb3JlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSwgdGhpcy5zY29yZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzVHVyblZhbHVlID0gdmFsaWRhdGUuYm9vbGVhbihoYXNUdXJuIHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuaXNUcnVlKCk7XG4gICAgICAgIGlmIChoYXNUdXJuVmFsdWUuaXNWYWxpZCkge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9rYXksIEEgcGxheWVyIGRvZXMgbm90IGFsd2F5cyBoYXZlIGEgdHVybi5cbiAgICAgICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtUb3BQbGF5ZXJ9IFRoZSBwbGF5ZXIgd2l0aCBhIHR1cm5cbiAgICAgKi9cbiAgICBzdGFydFR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6c3RhcnQtdHVyblwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhBU19UVVJOX0FUVFJJQlVURSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VG9wUGxheWVyfSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1wbGF5ZXJcIiwgVG9wUGxheWVyKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzeXN0ZW0gcGxheWVyLiBEaWNlIGFyZSB0aHJvd24gYnkgYSBwbGF5ZXIuIEZvciBzaXR1YXRpb25zXG4gKiB3aGVyZSB5b3Ugd2FudCB0byByZW5kZXIgYSBidW5jaCBvZiBkaWNlIHdpdGhvdXQgbmVlZGluZyB0aGUgY29uY2VwdCBvZiBQbGF5ZXJzXG4gKiB0aGlzIERFRkFVTFRfU1lTVEVNX1BMQVlFUiBjYW4gYmUgYSBzdWJzdGl0dXRlLiBPZiBjb3Vyc2UsIGlmIHlvdSdkIGxpa2UgdG9cbiAqIGNoYW5nZSB0aGUgbmFtZSBhbmQvb3IgdGhlIGNvbG9yLCBjcmVhdGUgYW5kIHVzZSB5b3VyIG93biBcInN5c3RlbSBwbGF5ZXJcIi5cbiAqIEBjb25zdFxuICovXG5jb25zdCBERUZBVUxUX1NZU1RFTV9QTEFZRVIgPSBuZXcgVG9wUGxheWVyKHtjb2xvcjogXCJyZWRcIiwgbmFtZTogXCIqXCJ9KTtcblxuZXhwb3J0IHtcbiAgICBUb3BQbGF5ZXIsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtHcmlkTGF5b3V0fSBmcm9tIFwiLi9HcmlkTGF5b3V0LmpzXCI7XG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuXG5jb25zdCBERUZBVUxUX0RJRV9TSVpFID0gMTAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9IT0xEX0RVUkFUSU9OID0gMzc1OyAvLyBtc1xuY29uc3QgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEID0gZmFsc2U7XG5jb25zdCBERUZBVUxUX0hPTERJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEID0gZmFsc2U7XG5cbmNvbnN0IFJPV1MgPSAxMDtcbmNvbnN0IENPTFMgPSAxMDtcblxuY29uc3QgREVGQVVMVF9XSURUSCA9IENPTFMgKiBERUZBVUxUX0RJRV9TSVpFOyAvLyBweFxuY29uc3QgREVGQVVMVF9IRUlHSFQgPSBST1dTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfRElTUEVSU0lPTiA9IE1hdGguZmxvb3IoUk9XUyAvIDIpO1xuXG5jb25zdCBNSU5fREVMVEEgPSAzOyAvL3B4XG5cbmNvbnN0IFdJRFRIX0FUVFJJQlVURSA9IFwid2lkdGhcIjtcbmNvbnN0IEhFSUdIVF9BVFRSSUJVVEUgPSBcImhlaWdodFwiO1xuY29uc3QgRElTUEVSU0lPTl9BVFRSSUJVVEUgPSBcImRpc3BlcnNpb25cIjtcbmNvbnN0IERJRV9TSVpFX0FUVFJJQlVURSA9IFwiZGllLXNpemVcIjtcbmNvbnN0IERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJkcmFnZ2luZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBIT0xESU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJob2xkaW5nLWRpY2UtZGlzYWJsZWRcIjtcbmNvbnN0IFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFID0gXCJyb3RhdGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSA9IFwiaG9sZC1kdXJhdGlvblwiO1xuXG5cbmNvbnN0IHBhcnNlTnVtYmVyID0gKG51bWJlclN0cmluZywgZGVmYXVsdE51bWJlciA9IDApID0+IHtcbiAgICBjb25zdCBudW1iZXIgPSBwYXJzZUludChudW1iZXJTdHJpbmcsIDEwKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzTmFOKG51bWJlcikgPyBkZWZhdWx0TnVtYmVyIDogbnVtYmVyO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXIgPSAobnVtYmVyU3RyaW5nLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICByZXR1cm4gdmFsaWRhdGUuaW50ZWdlcihudW1iZXJTdHJpbmcpXG4gICAgICAgIC5sYXJnZXJUaGFuKDApXG4gICAgICAgIC5kZWZhdWx0VG8oZGVmYXVsdFZhbHVlKVxuICAgICAgICAudmFsdWU7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSA9IChlbGVtZW50LCBuYW1lLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgY29uc3QgdmFsdWVTdHJpbmcgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyKHZhbHVlU3RyaW5nLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcblxuY29uc3QgZ2V0Qm9vbGVhbiA9IChib29sZWFuU3RyaW5nLCB0cnVlVmFsdWUsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGlmICh0cnVlVmFsdWUgPT09IGJvb2xlYW5TdHJpbmcgfHwgXCJ0cnVlXCIgPT09IGJvb2xlYW5TdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChcImZhbHNlXCIgPT09IGJvb2xlYW5TdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxufTtcblxuY29uc3QgZ2V0Qm9vbGVhbkF0dHJpYnV0ZSA9IChlbGVtZW50LCBuYW1lLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgY29uc3QgdmFsdWVTdHJpbmcgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW4odmFsdWVTdHJpbmcsIFt2YWx1ZVN0cmluZywgXCJ0cnVlXCJdLCBbXCJmYWxzZVwiXSwgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTtcblxuLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5jb25zdCBfY2FudmFzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9sYXlvdXQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2N1cnJlbnRQbGF5ZXIgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX251bWJlck9mUmVhZHlEaWNlID0gbmV3IFdlYWtNYXAoKTtcblxuY29uc3QgY29udGV4dCA9IChib2FyZCkgPT4gX2NhbnZhcy5nZXQoYm9hcmQpLmdldENvbnRleHQoXCIyZFwiKTtcblxuY29uc3QgZ2V0UmVhZHlEaWNlID0gKGJvYXJkKSA9PiB7XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gX251bWJlck9mUmVhZHlEaWNlLmdldChib2FyZCkpIHtcbiAgICAgICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpO1xufTtcblxuY29uc3QgdXBkYXRlUmVhZHlEaWNlID0gKGJvYXJkLCB1cGRhdGUpID0+IHtcbiAgICBfbnVtYmVyT2ZSZWFkeURpY2Uuc2V0KGJvYXJkLCBnZXRSZWFkeURpY2UoYm9hcmQpICsgdXBkYXRlKTtcbn07XG5cbmNvbnN0IGlzUmVhZHkgPSAoYm9hcmQpID0+IGdldFJlYWR5RGljZShib2FyZCkgPT09IGJvYXJkLmRpY2UubGVuZ3RoO1xuXG5jb25zdCB1cGRhdGVCb2FyZCA9IChib2FyZCwgZGljZSA9IGJvYXJkLmRpY2UpID0+IHtcbiAgICBpZiAoaXNSZWFkeShib2FyZCkpIHtcbiAgICAgICAgY29udGV4dChib2FyZCkuY2xlYXJSZWN0KDAsIDAsIGJvYXJkLndpZHRoLCBib2FyZC5oZWlnaHQpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGRpZS5yZW5kZXIoY29udGV4dChib2FyZCksIGJvYXJkLmRpZVNpemUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG4vLyBJbnRlcmFjdGlvbiBzdGF0ZXNcbmNvbnN0IE5PTkUgPSBTeW1ib2woXCJub19pbnRlcmFjdGlvblwiKTtcbmNvbnN0IEhPTEQgPSBTeW1ib2woXCJob2xkXCIpO1xuY29uc3QgTU9WRSA9IFN5bWJvbChcIm1vdmVcIik7XG5jb25zdCBJTkRFVEVSTUlORUQgPSBTeW1ib2woXCJpbmRldGVybWluZWRcIik7XG5jb25zdCBEUkFHR0lORyA9IFN5bWJvbChcImRyYWdnaW5nXCIpO1xuXG4vLyBNZXRob2RzIHRvIGhhbmRsZSBpbnRlcmFjdGlvblxuY29uc3QgY29udmVydFdpbmRvd0Nvb3JkaW5hdGVzVG9DYW52YXMgPSAoY2FudmFzLCB4V2luZG93LCB5V2luZG93KSA9PiB7XG4gICAgY29uc3QgY2FudmFzQm94ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgY29uc3QgeCA9IHhXaW5kb3cgLSBjYW52YXNCb3gubGVmdCAqIChjYW52YXMud2lkdGggLyBjYW52YXNCb3gud2lkdGgpO1xuICAgIGNvbnN0IHkgPSB5V2luZG93IC0gY2FudmFzQm94LnRvcCAqIChjYW52YXMuaGVpZ2h0IC8gY2FudmFzQm94LmhlaWdodCk7XG5cbiAgICByZXR1cm4ge3gsIHl9O1xufTtcblxuY29uc3Qgc2V0dXBJbnRlcmFjdGlvbiA9IChib2FyZCkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IF9jYW52YXMuZ2V0KGJvYXJkKTtcblxuICAgIC8vIFNldHVwIGludGVyYWN0aW9uXG4gICAgbGV0IG9yaWdpbiA9IHt9O1xuICAgIGxldCBzdGF0ZSA9IE5PTkU7XG4gICAgbGV0IHN0YXRpY0JvYXJkID0gbnVsbDtcbiAgICBsZXQgZGllVW5kZXJDdXJzb3IgPSBudWxsO1xuICAgIGxldCBob2xkVGltZW91dCA9IG51bGw7XG5cbiAgICBjb25zdCBob2xkRGllID0gKCkgPT4ge1xuICAgICAgICBpZiAoSE9MRCA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gdG9nZ2xlIGhvbGQgLyByZWxlYXNlXG4gICAgICAgICAgICBjb25zdCBwbGF5ZXJXaXRoQVR1cm4gPSBib2FyZC5xdWVyeVNlbGVjdG9yKFwidG9wLXBsYXllci1saXN0IHRvcC1wbGF5ZXJbaGFzLXR1cm5dXCIpO1xuICAgICAgICAgICAgaWYgKGRpZVVuZGVyQ3Vyc29yLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVsZWFzZUl0KHBsYXllcldpdGhBVHVybik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLmhvbGRJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUgPSBOT05FO1xuXG4gICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgICAgIH1cblxuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SG9sZGluZyA9ICgpID0+IHtcbiAgICAgICAgaG9sZFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChob2xkRGllLCBib2FyZC5ob2xkRHVyYXRpb24pO1xuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSG9sZGluZyA9ICgpID0+IHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChob2xkVGltZW91dCk7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RhcnRJbnRlcmFjdGlvbiA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTk9ORSA9PT0gc3RhdGUpIHtcblxuICAgICAgICAgICAgb3JpZ2luID0ge1xuICAgICAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICAgICAgeTogZXZlbnQuY2xpZW50WVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IgPSBib2FyZC5sYXlvdXQuZ2V0QXQoY29udmVydFdpbmRvd0Nvb3JkaW5hdGVzVG9DYW52YXMoY2FudmFzLCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKSk7XG5cbiAgICAgICAgICAgIGlmIChudWxsICE9PSBkaWVVbmRlckN1cnNvcikge1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgaW50ZXJhY3Rpb24gd2l0aCB0aGUgYm9hcmQgdmlhIGEgZGllXG4gICAgICAgICAgICAgICAgaWYgKCFib2FyZC5kaXNhYmxlZEhvbGRpbmdEaWNlICYmICFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IElOREVURVJNSU5FRDtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRIb2xkaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IEhPTEQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkRHJhZ2dpbmdEaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gTU9WRTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzaG93SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgZGllVW5kZXJDdXJzb3IgPSBib2FyZC5sYXlvdXQuZ2V0QXQoY29udmVydFdpbmRvd0Nvb3JkaW5hdGVzVG9DYW52YXMoY2FudmFzLCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKSk7XG4gICAgICAgIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS5jdXJzb3IgPSBcImdyYWJiaW5nXCI7XG4gICAgICAgIH0gZWxzZSBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS5jdXJzb3IgPSBcImdyYWJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBtb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChNT1ZFID09PSBzdGF0ZSB8fCBJTkRFVEVSTUlORUQgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICAvLyBkZXRlcm1pbmUgaWYgYSBkaWUgaXMgdW5kZXIgdGhlIGN1cnNvclxuICAgICAgICAgICAgLy8gSWdub3JlIHNtYWxsIG1vdmVtZW50c1xuICAgICAgICAgICAgY29uc3QgZHggPSBNYXRoLmFicyhvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFgpO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBNYXRoLmFicyhvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFkpO1xuXG4gICAgICAgICAgICBpZiAoTUlOX0RFTFRBIDwgZHggfHwgTUlOX0RFTFRBIDwgZHkpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IERSQUdHSU5HO1xuICAgICAgICAgICAgICAgIHN0b3BIb2xkaW5nKCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkaWNlV2l0aG91dERpZVVuZGVyQ3Vyc29yID0gYm9hcmQuZGljZS5maWx0ZXIoZGllID0+IGRpZSAhPT0gZGllVW5kZXJDdXJzb3IpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUJvYXJkKGJvYXJkLCBkaWNlV2l0aG91dERpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICBzdGF0aWNCb2FyZCA9IGNvbnRleHQoYm9hcmQpLmdldEltYWdlRGF0YSgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnRleHQoYm9hcmQpLnB1dEltYWdlRGF0YShzdGF0aWNCb2FyZCwgMCwgMCk7XG4gICAgICAgICAgICBkaWVVbmRlckN1cnNvci5yZW5kZXIoY29udGV4dChib2FyZCksIGJvYXJkLmRpZVNpemUsIHt4OiB4IC0gZHgsIHk6IHkgLSBkeX0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHN0b3BJbnRlcmFjdGlvbiA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IgJiYgRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjb25zdCBkeCA9IG9yaWdpbi54IC0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gb3JpZ2luLnkgLSBldmVudC5jbGllbnRZO1xuXG4gICAgICAgICAgICBjb25zdCB7eCwgeX0gPSBkaWVVbmRlckN1cnNvci5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3Qgc25hcFRvQ29vcmRzID0gYm9hcmQubGF5b3V0LnNuYXBUbyh7XG4gICAgICAgICAgICAgICAgZGllOiBkaWVVbmRlckN1cnNvcixcbiAgICAgICAgICAgICAgICB4OiB4IC0gZHgsXG4gICAgICAgICAgICAgICAgeTogeSAtIGR5LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5ld0Nvb3JkcyA9IG51bGwgIT0gc25hcFRvQ29vcmRzID8gc25hcFRvQ29vcmRzIDoge3gsIHl9O1xuXG4gICAgICAgICAgICBkaWVVbmRlckN1cnNvci5jb29yZGluYXRlcyA9IG5ld0Nvb3JkcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWFyIHN0YXRlXG4gICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgc3RhdGUgPSBOT05FO1xuXG4gICAgICAgIC8vIFJlZnJlc2ggYm9hcmQ7IFJlbmRlciBkaWNlXG4gICAgICAgIHVwZGF0ZUJvYXJkKGJvYXJkKTtcbiAgICB9O1xuXG5cbiAgICAvLyBSZWdpc3RlciB0aGUgYWN0dWFsIGV2ZW50IGxpc3RlbmVycyBkZWZpbmVkIGFib3ZlLiBNYXAgdG91Y2ggZXZlbnRzIHRvXG4gICAgLy8gZXF1aXZhbGVudCBtb3VzZSBldmVudHMuIEJlY2F1c2UgdGhlIFwidG91Y2hlbmRcIiBldmVudCBkb2VzIG5vdCBoYXZlIGFcbiAgICAvLyBjbGllbnRYIGFuZCBjbGllbnRZLCByZWNvcmQgYW5kIHVzZSB0aGUgbGFzdCBvbmVzIGZyb20gdGhlIFwidG91Y2htb3ZlXCJcbiAgICAvLyAob3IgXCJ0b3VjaHN0YXJ0XCIpIGV2ZW50cy5cblxuICAgIGxldCB0b3VjaENvb3JkaW5hdGVzID0ge2NsaWVudFg6IDAsIGNsaWVudFk6IDB9O1xuICAgIGNvbnN0IHRvdWNoMm1vdXNlRXZlbnQgPSAobW91c2VFdmVudE5hbWUpID0+IHtcbiAgICAgICAgcmV0dXJuICh0b3VjaEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodG91Y2hFdmVudCAmJiAwIDwgdG91Y2hFdmVudC50b3VjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHtjbGllbnRYLCBjbGllbnRZfSA9IHRvdWNoRXZlbnQudG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICB0b3VjaENvb3JkaW5hdGVzID0ge2NsaWVudFgsIGNsaWVudFl9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FudmFzLmRpc3BhdGNoRXZlbnQobmV3IE1vdXNlRXZlbnQobW91c2VFdmVudE5hbWUsIHRvdWNoQ29vcmRpbmF0ZXMpKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZWRvd25cIikpO1xuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHN0YXJ0SW50ZXJhY3Rpb24pO1xuXG4gICAgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vtb3ZlXCIpKTtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW92ZSk7XG4gICAgfVxuXG4gICAgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSB8fCAhYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSkge1xuICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBzaG93SW50ZXJhY3Rpb24pO1xuICAgIH1cblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNldXBcIikpO1xuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBzdG9wSW50ZXJhY3Rpb24pO1xuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgc3RvcEludGVyYWN0aW9uKTtcbn07XG5cbi8qKlxuICogVG9wRGljZUJvYXJkIGlzIGEgY3VzdG9tIEhUTUwgZWxlbWVudCB0byByZW5kZXIgYW5kIGNvbnRyb2wgYVxuICogZGljZSBib2FyZC4gXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wRGljZUJvYXJkID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wRGljZUJvYXJkLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogXCJjbG9zZWRcIn0pO1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgICAgICBfY2FudmFzLnNldCh0aGlzLCBjYW52YXMpO1xuICAgICAgICBfY3VycmVudFBsYXllci5zZXQodGhpcywgREVGQVVMVF9TWVNURU1fUExBWUVSKTtcbiAgICAgICAgX2xheW91dC5zZXQodGhpcywgbmV3IEdyaWRMYXlvdXQoe1xuICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgZGllU2l6ZTogdGhpcy5kaWVTaXplLFxuICAgICAgICAgICAgZGlzcGVyc2lvbjogdGhpcy5kaXNwZXJzaW9uXG4gICAgICAgIH0pKTtcbiAgICAgICAgc2V0dXBJbnRlcmFjdGlvbih0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIFdJRFRIX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhFSUdIVF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESVNQRVJTSU9OX0FUVFJJQlVURSxcbiAgICAgICAgICAgIERJRV9TSVpFX0FUVFJJQlVURSxcbiAgICAgICAgICAgIERSQUdHSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIT0xESU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEVcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IF9jYW52YXMuZ2V0KHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSBXSURUSF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX1dJRFRIKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKFdJRFRIX0FUVFJJQlVURSwgd2lkdGgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBIRUlHSFRfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfSEVJR0hUKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoSEVJR0hUX0FUVFJJQlVURSwgaGVpZ2h0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgRElTUEVSU0lPTl9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BlcnNpb24gPSBnZXRQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSwgcGFyc2VOdW1iZXIob2xkVmFsdWUpIHx8IERFRkFVTFRfRElTUEVSU0lPTik7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaXNwZXJzaW9uID0gZGlzcGVyc2lvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgRElFX1NJWkVfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaWVTaXplID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJRV9TSVpFKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LmRpZVNpemUgPSBkaWVTaXplO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRSb3RhdGlvbiA9IHZhbGlkYXRlLmJvb2xlYW4obmV3VmFsdWUsIGdldEJvb2xlYW4ob2xkVmFsdWUsIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRUQpKS52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LnJvdGF0ZSA9ICFkaXNhYmxlZFJvdGF0aW9uO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgLy8gVGhlIHZhbHVlIGlzIGRldGVybWluZWQgd2hlbiB1c2luZyB0aGUgZ2V0dGVyXG4gICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3AtZGllOmFkZGVkXCIsICgpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZVJlYWR5RGljZSh0aGlzLCAxKTtcbiAgICAgICAgICAgIGlmIChpc1JlYWR5KHRoaXMpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlQm9hcmQodGhpcywgdGhpcy5sYXlvdXQubGF5b3V0KHRoaXMuZGljZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3AtZGllOnJlbW92ZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlQm9hcmQodGhpcywgdGhpcy5sYXlvdXQubGF5b3V0KHRoaXMuZGljZSkpO1xuICAgICAgICAgICAgdXBkYXRlUmVhZHlEaWNlKHRoaXMsIC0xKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWxsIGRpY2UgYm9hcmRzIGRvIGhhdmUgYSBwbGF5ZXIgbGlzdC4gSWYgdGhlcmUgaXNuJ3Qgb25lIHlldCxcbiAgICAgICAgLy8gY3JlYXRlIG9uZS5cbiAgICAgICAgaWYgKG51bGwgPT09IHRoaXMucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdFwiKSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidG9wLXBsYXllci1saXN0XCIpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIGFkb3B0ZWRDYWxsYmFjaygpIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgR3JpZExheW91dCB1c2VkIGJ5IHRoaXMgRGljZUJvYXJkIHRvIGxheW91dCB0aGUgZGljZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtHcmlkTGF5b3V0fVxuICAgICAqL1xuICAgIGdldCBsYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiBfbGF5b3V0LmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGljZSBvbiB0aGlzIGJvYXJkLiBOb3RlLCB0byBhY3R1YWxseSB0aHJvdyB0aGUgZGljZSB1c2VcbiAgICAgKiB7QGxpbmsgdGhyb3dEaWNlfS4gXG4gICAgICpcbiAgICAgKiBAdHlwZSB7VG9wRGllW119XG4gICAgICovXG4gICAgZ2V0IGRpY2UoKSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRvcC1kaWVcIildO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlIHRoYXQgY2FuIGJlIHB1dCBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSwgMCA8IG1heGltdW0uXG4gICAgICovXG4gICAgZ2V0IG1heGltdW1OdW1iZXJPZkRpY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5tYXhpbXVtTnVtYmVyT2ZEaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBXSURUSF9BVFRSSUJVVEUsIERFRkFVTFRfV0lEVEgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhpcyBib2FyZC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIRUlHSFRfQVRUUklCVVRFLCBERUZBVUxUX0hFSUdIVCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BlcnNpb24gbGV2ZWwgb2YgdGhpcyBib2FyZC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaXNwZXJzaW9uKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElTUEVSU0lPTl9BVFRSSUJVVEUsIERFRkFVTFRfRElTUEVSU0lPTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNpemUgb2YgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgZGllU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIERJRV9TSVpFX0FUVFJJQlVURSwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuIGRpY2Ugb24gdGhpcyBib2FyZCBiZSBkcmFnZ2VkP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZERyYWdnaW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgRFJBR0dJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuIGRpY2Ugb24gdGhpcyBib2FyZCBiZSBoZWxkIGJ5IGEgUGxheWVyP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZEhvbGRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBIT0xESU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLCBERUZBVUxUX0hPTERJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgcm90YXRpbmcgZGljZSBvbiB0aGlzIGJvYXJkIGRpc2FibGVkP1xuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBkaXNhYmxlZFJvdGF0aW5nRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2xlYW5BdHRyaWJ1dGUodGhpcywgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGR1cmF0aW9uIGluIG1zIHRvIHByZXNzIHRoZSBtb3VzZSAvIHRvdWNoIGEgZGllIGJlZm9yZSBpdCBiZWtvbWVzXG4gICAgICogaGVsZCBieSB0aGUgUGxheWVyLiBJdCBoYXMgb25seSBhbiBlZmZlY3Qgd2hlbiB0aGlzLmhvbGRhYmxlRGljZSA9PT1cbiAgICAgKiB0cnVlLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgaG9sZER1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRF9EVVJBVElPTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllcnMgcGxheWluZyBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHR5cGUge1RvcFBsYXllcltdfVxuICAgICAqL1xuICAgIGdldCBwbGF5ZXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKFwidG9wLXBsYXllci1saXN0XCIpLnBsYXllcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXMgcGxheWVyLCB0aHJvdyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUb3BQbGF5ZXJ9IFtwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVJdIC0gVGhlXG4gICAgICogcGxheWVyIHRoYXQgaXMgdGhyb3dpbmcgdGhlIGRpY2Ugb24gdGhpcyBib2FyZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1RvcERpZVtdfSBUaGUgdGhyb3duIGRpY2Ugb24gdGhpcyBib2FyZC4gVGhpcyBsaXN0IG9mIGRpY2UgaXMgdGhlIHNhbWUgYXMgdGhpcyBUb3BEaWNlQm9hcmQncyB7QHNlZSBkaWNlfSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHRocm93RGljZShwbGF5ZXIgPSBERUZBVUxUX1NZU1RFTV9QTEFZRVIpIHtcbiAgICAgICAgaWYgKHBsYXllciAmJiAhcGxheWVyLmhhc1R1cm4pIHtcbiAgICAgICAgICAgIHBsYXllci5zdGFydFR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpY2UuZm9yRWFjaChkaWUgPT4gZGllLnRocm93SXQoKSk7XG4gICAgICAgIHVwZGF0ZUJvYXJkKHRoaXMsIHRoaXMubGF5b3V0LmxheW91dCh0aGlzLmRpY2UpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGljZTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLWRpY2UtYm9hcmRcIiwgVG9wRGljZUJvYXJkKTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWNlQm9hcmQsXG4gICAgREVGQVVMVF9ESUVfU0laRSxcbiAgICBERUZBVUxUX0hPTERfRFVSQVRJT04sXG4gICAgREVGQVVMVF9XSURUSCxcbiAgICBERUZBVUxUX0hFSUdIVCxcbiAgICBERUZBVUxUX0RJU1BFUlNJT04sXG4gICAgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgsIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuLy9pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5pbXBvcnQge1JlYWRPbmx5QXR0cmlidXRlc30gZnJvbSBcIi4vbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzXCI7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi92YWxpZGF0ZS92YWxpZGF0ZS5qc1wiO1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuY29uc3QgQ0lSQ0xFX0RFR1JFRVMgPSAzNjA7IC8vIGRlZ3JlZXNcbmNvbnN0IE5VTUJFUl9PRl9QSVBTID0gNjsgLy8gRGVmYXVsdCAvIHJlZ3VsYXIgc2l4IHNpZGVkIGRpZSBoYXMgNiBwaXBzIG1heGltdW0uXG5jb25zdCBERUZBVUxUX0NPTE9SID0gXCJJdm9yeVwiO1xuY29uc3QgREVGQVVMVF9YID0gMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfWSA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1JPVEFUSU9OID0gMDsgLy8gZGVncmVlc1xuY29uc3QgREVGQVVMVF9PUEFDSVRZID0gMC41O1xuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBIRUxEX0JZX0FUVFJJQlVURSA9IFwiaGVsZC1ieVwiO1xuY29uc3QgUElQU19BVFRSSUJVVEUgPSBcInBpcHNcIjtcbmNvbnN0IFJPVEFUSU9OX0FUVFJJQlVURSA9IFwicm90YXRpb25cIjtcbmNvbnN0IFhfQVRUUklCVVRFID0gXCJ4XCI7XG5jb25zdCBZX0FUVFJJQlVURSA9IFwieVwiO1xuXG5jb25zdCBCQVNFX0RJRV9TSVpFID0gMTAwOyAvLyBweFxuY29uc3QgQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgPSAxNTsgLy8gcHhcbmNvbnN0IEJBU0VfU1RST0tFX1dJRFRIID0gMi41OyAvLyBweFxuY29uc3QgTUlOX1NUUk9LRV9XSURUSCA9IDE7IC8vIHB4XG5jb25zdCBIQUxGID0gQkFTRV9ESUVfU0laRSAvIDI7IC8vIHB4XG5jb25zdCBUSElSRCA9IEJBU0VfRElFX1NJWkUgLyAzOyAvLyBweFxuY29uc3QgUElQX1NJWkUgPSBCQVNFX0RJRV9TSVpFIC8gMTU7IC8vcHhcbmNvbnN0IFBJUF9DT0xPUiA9IFwiYmxhY2tcIjtcblxuY29uc3QgZGVnMnJhZCA9IChkZWcpID0+IHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufTtcblxuY29uc3QgaXNQaXBOdW1iZXIgPSBuID0+IHtcbiAgICBjb25zdCBudW1iZXIgPSBwYXJzZUludChuLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIobnVtYmVyKSAmJiAxIDw9IG51bWJlciAmJiBudW1iZXIgPD0gTlVNQkVSX09GX1BJUFM7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBvZiBwaXBzIGJldHdlZW4gMSBhbmQgdGhlIE5VTUJFUl9PRl9QSVBTLlxuICpcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEEgcmFuZG9tIG51bWJlciBuLCAxIOKJpCBuIOKJpCBOVU1CRVJfT0ZfUElQUy5cbiAqL1xuY29uc3QgcmFuZG9tUGlwcyA9ICgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE5VTUJFUl9PRl9QSVBTKSArIDE7XG5cbmNvbnN0IERJRV9VTklDT0RFX0NIQVJBQ1RFUlMgPSBbXCLimoBcIixcIuKagVwiLFwi4pqCXCIsXCLimoNcIixcIuKahFwiLFwi4pqFXCJdO1xuXG4vKipcbiAqIENvbnZlcnQgYSB1bmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRpbmcgYSBkaWUgZmFjZSB0byB0aGUgbnVtYmVyIG9mIHBpcHMgb2ZcbiAqIHRoYXQgc2FtZSBkaWUuIFRoaXMgZnVuY3Rpb24gaXMgdGhlIHJldmVyc2Ugb2YgcGlwc1RvVW5pY29kZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdSAtIFRoZSB1bmljb2RlIGNoYXJhY3RlciB0byBjb252ZXJ0IHRvIHBpcHMuXG4gKiBAcmV0dXJucyB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYsIG9yXG4gKiB1bmRlZmluZWQgaWYgdSB3YXMgbm90IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllLlxuICovXG5jb25zdCB1bmljb2RlVG9QaXBzID0gKHUpID0+IHtcbiAgICBjb25zdCBkaWVDaGFySW5kZXggPSBESUVfVU5JQ09ERV9DSEFSQUNURVJTLmluZGV4T2YodSk7XG4gICAgcmV0dXJuIDAgPD0gZGllQ2hhckluZGV4ID8gZGllQ2hhckluZGV4ICsgMSA6IHVuZGVmaW5lZDtcbn07XG5cbi8qKlxuICogQ29udmVydCBhIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXJcbiAqIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb3JyZXNwb25kaW5nIGRpZSBmYWNlLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlXG4gKiBvZiB1bmljb2RlVG9QaXBzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwIC0gVGhlIG51bWJlciBvZiBwaXBzIHRvIGNvbnZlcnQgdG8gYSB1bmljb2RlIGNoYXJhY3Rlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBUaGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlcnMgb3JcbiAqIHVuZGVmaW5lZCBpZiBwIHdhcyBub3QgYmV0d2VlbiAxIGFuZCA2IGluY2x1c2l2ZS5cbiAqL1xuY29uc3QgcGlwc1RvVW5pY29kZSA9IHAgPT4gaXNQaXBOdW1iZXIocCkgPyBESUVfVU5JQ09ERV9DSEFSQUNURVJTW3AgLSAxXSA6IHVuZGVmaW5lZDtcblxuY29uc3QgcmVuZGVySG9sZCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTRVBFUkFUT1IgPSB3aWR0aCAvIDMwO1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuZ2xvYmFsQWxwaGEgPSBERUZBVUxUX09QQUNJVFk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuYXJjKHggKyB3aWR0aCwgeSArIHdpZHRoLCB3aWR0aCAtIFNFUEVSQVRPUiwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlckRpZSA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCwgY29sb3IpID0+IHtcbiAgICBjb25zdCBTQ0FMRSA9ICh3aWR0aCAvIEhBTEYpO1xuICAgIGNvbnN0IEhBTEZfSU5ORVJfU0laRSA9IE1hdGguc3FydCh3aWR0aCAqKiAyIC8gMik7XG4gICAgY29uc3QgSU5ORVJfU0laRSA9IDIgKiBIQUxGX0lOTkVSX1NJWkU7XG4gICAgY29uc3QgUk9VTkRFRF9DT1JORVJfUkFESVVTID0gQkFTRV9ST1VOREVEX0NPUk5FUl9SQURJVVMgKiBTQ0FMRTtcbiAgICBjb25zdCBJTk5FUl9TSVpFX1JPVU5ERUQgPSBJTk5FUl9TSVpFIC0gMiAqIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBTVFJPS0VfV0lEVEggPSBNYXRoLm1heChNSU5fU1RST0tFX1dJRFRILCBCQVNFX1NUUk9LRV9XSURUSCAqIFNDQUxFKTtcblxuICAgIGNvbnN0IHN0YXJ0WCA9IHggKyB3aWR0aCAtIEhBTEZfSU5ORVJfU0laRSArIFJPVU5ERURfQ09STkVSX1JBRElVUztcbiAgICBjb25zdCBzdGFydFkgPSB5ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkU7XG5cbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICBjb250ZXh0LmxpbmVXaWR0aCA9IFNUUk9LRV9XSURUSDtcbiAgICBjb250ZXh0Lm1vdmVUbyhzdGFydFgsIHN0YXJ0WSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMjcwKSwgZGVnMnJhZCgwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMCksIGRlZzJyYWQoOTApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkUpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoOTApLCBkZWcycmFkKDE4MCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCAtIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDE4MCksIGRlZzJyYWQoMjcwKSk7XG5cbiAgICBjb250ZXh0LnN0cm9rZSgpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuY29uc3QgcmVuZGVyUGlwID0gKGNvbnRleHQsIHgsIHksIHdpZHRoKSA9PiB7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFBJUF9DT0xPUjtcbiAgICBjb250ZXh0Lm1vdmVUbyh4LCB5KTtcbiAgICBjb250ZXh0LmFyYyh4LCB5LCB3aWR0aCwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cblxuLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5jb25zdCBfYm9hcmQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbG9yID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWxkQnkgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3BpcHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0aW9uID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF94ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF95ID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBUb3BEaWUgaXMgdGhlIFwidG9wLWRpZVwiIGN1c3RvbSBbSFRNTFxuICogZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50KSByZXByZXNlbnRpbmcgYSBkaWVcbiAqIG9uIHRoZSBkaWNlIGJvYXJkLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWUuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe3BpcHMsIGNvbG9yLCByb3RhdGlvbiwgeCwgeSwgaGVsZEJ5fSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgY29uc3QgcGlwc1ZhbHVlID0gdmFsaWRhdGUuaW50ZWdlcihwaXBzIHx8IHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwc1ZhbHVlKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHBpcHNWYWx1ZSk7XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHZhbGlkYXRlLmNvbG9yKGNvbG9yIHx8IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKERFRkFVTFRfQ09MT1IpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHZhbGlkYXRlLmludGVnZXIocm90YXRpb24gfHwgdGhpcy5nZXRBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDAsIDM2MClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ST1RBVElPTilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnggPSB2YWxpZGF0ZS5pbnRlZ2VyKHggfHwgdGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLmludGVnZXIoeSB8fCB0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSkpXG4gICAgICAgICAgICAubGFyZ2VyVGhhbigwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1kpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgdGhpcy5oZWxkQnkgPSB2YWxpZGF0ZS5zdHJpbmcoaGVsZEJ5IHx8IHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtUb3BQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gaG9sZCB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6aG9sZC1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIuXG4gICAgICovXG4gICAgaG9sZEl0KHBsYXllcikge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gcGxheWVyO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDpob2xkLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBEaWUgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoaXMgRGllIGlzIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGlzSGVsZCgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgIT09IHRoaXMuaGVsZEJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgcmVsZWFzZXMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IHJlbGVhc2UgZGljZSB0aGF0IHNoZSBpc1xuICAgICAqIGhvbGRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RvcFBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b3AtZGllXCIsIFRvcERpZSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllLFxuICAgIHVuaWNvZGVUb1BpcHMsXG4gICAgcGlwc1RvVW5pY29kZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVyLmpzXCI7XG5cbi8qKlxuICogVG9wUGxheWVyTGlzdCB0byBkZXNjcmliZSB0aGUgcGxheWVycyBpbiB0aGUgZ2FtZS5cbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICovXG5jb25zdCBUb3BQbGF5ZXJMaXN0ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVyTGlzdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKDAgPj0gdGhpcy5wbGF5ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChERUZBVUxUX1NZU1RFTV9QTEFZRVIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wOnN0YXJ0LXR1cm5cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAvLyBPbmx5IG9uZSBwbGF5ZXIgY2FuIGhhdmUgYSB0dXJuIGF0IGFueSBnaXZlbiB0aW1lLlxuICAgICAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihwID0+ICFwLmVxdWFscyhldmVudC5kZXRhaWwucGxheWVyKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChwID0+IHAuZW5kVHVybigpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllcnMgaW4gdGhpcyBsaXN0LlxuICAgICAqXG4gICAgICogQHR5cGUge1RvcFBsYXllcltdfVxuICAgICAqL1xuICAgIGdldCBwbGF5ZXJzKCkge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0b3AtcGxheWVyXCIpXTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLXBsYXllci1saXN0XCIsIFRvcFBsYXllckxpc3QpO1xuXG5leHBvcnQge1xuICAgIFRvcFBsYXllckxpc3Rcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuaW1wb3J0IHtUb3BEaWNlQm9hcmR9IGZyb20gXCIuL1RvcERpY2VCb2FyZC5qc1wiO1xuaW1wb3J0IHtUb3BEaWV9IGZyb20gXCIuL1RvcERpZS5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJ9IGZyb20gXCIuL1RvcFBsYXllci5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJMaXN0fSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0LmpzXCI7XG5cbndpbmRvdy50d2VudHlvbmVwaXBzID0gd2luZG93LnR3ZW50eW9uZXBpcHMgfHwgT2JqZWN0LmZyZWV6ZSh7XG4gICAgVkVSU0lPTjogXCIwLjAuMVwiLFxuICAgIExJQ0VOU0U6IFwiTEdQTC0zLjBcIixcbiAgICBXRUJTSVRFOiBcImh0dHBzOi8vdHdlbnR5b25lcGlwcy5vcmdcIixcbiAgICBUb3BEaWNlQm9hcmQ6IFRvcERpY2VCb2FyZCxcbiAgICBUb3BEaWU6IFRvcERpZSxcbiAgICBUb3BQbGF5ZXI6IFRvcFBsYXllcixcbiAgICBUb3BQbGF5ZXJMaXN0OiBUb3BQbGF5ZXJMaXN0XG59KTtcbiJdLCJuYW1lcyI6WyJ2YWxpZGF0ZSIsIkNPTE9SX0FUVFJJQlVURSIsIl9jb2xvciJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxLQUFLLENBQUM7Ozs7Ozs7O0lBUTNDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xCO0NBQ0o7O0FDeENEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUE7Ozs7QUFJQSxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEtBQUs7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7O0FBR0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0I5QixNQUFNLFVBQVUsR0FBRyxNQUFNOzs7Ozs7O0lBT3JCLFdBQVcsQ0FBQztRQUNSLEtBQUs7UUFDTCxNQUFNO1FBQ04sVUFBVTtRQUNWLE9BQU87S0FDVixHQUFHLEVBQUUsRUFBRTtRQUNKLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BCLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDOztRQUV4QixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztLQUN4Qjs7Ozs7OztJQU9ELElBQUksS0FBSyxHQUFHO1FBQ1IsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzNCOztJQUVELElBQUksS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNULElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLDZDQUE2QyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQy9GO1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNoRDs7Ozs7Ozs7SUFRRCxJQUFJLE1BQU0sR0FBRztRQUNULE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1Qjs7SUFFRCxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDUCxNQUFNLElBQUksa0JBQWtCLENBQUMsQ0FBQyw4Q0FBOEMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUNoRztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDaEQ7Ozs7Ozs7O0lBUUQsSUFBSSxtQkFBbUIsR0FBRztRQUN0QixPQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNsQzs7Ozs7Ozs7OztJQVVELElBQUksVUFBVSxHQUFHO1FBQ2IsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hDOztJQUVELElBQUksVUFBVSxDQUFDLENBQUMsRUFBRTtRQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLGtEQUFrRCxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ3BHO1FBQ0QsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNuQzs7Ozs7Ozs7SUFRRCxJQUFJLE9BQU8sR0FBRztRQUNWLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM3Qjs7SUFFRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUU7UUFDWixJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDVCxNQUFNLElBQUksa0JBQWtCLENBQUMsQ0FBQywrQ0FBK0MsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUNsRztRQUNELFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDaEQ7O0lBRUQsSUFBSSxNQUFNLEdBQUc7UUFDVCxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLE9BQU8sU0FBUyxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0tBQ3JDOztJQUVELElBQUksTUFBTSxDQUFDLENBQUMsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3hCOzs7Ozs7OztJQVFELElBQUksS0FBSyxHQUFHO1FBQ1IsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCOzs7Ozs7OztJQVFELElBQUksS0FBSyxHQUFHO1FBQ1IsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCOzs7Ozs7OztJQVFELElBQUksT0FBTyxHQUFHO1FBQ1YsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7UUFFaEQsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNyQjs7Ozs7Ozs7Ozs7O0lBWUQsTUFBTSxDQUFDLElBQUksRUFBRTtRQUNULElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDeEMsTUFBTSxJQUFJLGtCQUFrQixDQUFDLENBQUMseUNBQXlDLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7U0FDMUk7O1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDOztRQUV4QixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRTtZQUNwQixJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7Ozs7Z0JBSXRDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMvQixNQUFNO2dCQUNILFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDMUI7U0FDSjs7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUM5RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7O1FBRTNFLEtBQUssTUFBTSxHQUFHLElBQUksWUFBWSxFQUFFO1lBQzVCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RSxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0MsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7O1lBRXRDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hELEdBQUcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxzQkFBc0IsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUN2RixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0I7O1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7UUFFbkMsT0FBTyxpQkFBaUIsQ0FBQztLQUM1Qjs7Ozs7Ozs7Ozs7SUFXRCxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7UUFDM0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUVsRCxPQUFPLFNBQVMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssR0FBRyxRQUFRLEVBQUU7WUFDN0MsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMxQyxJQUFJLFNBQVMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtvQkFDbEUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDdkI7YUFDSjs7WUFFRCxLQUFLLEVBQUUsQ0FBQztTQUNYOztRQUVELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNoQzs7Ozs7Ozs7Ozs7O0lBWUQsYUFBYSxDQUFDLEtBQUssRUFBRTtRQUNqQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7O1FBRTVCLElBQUksQ0FBQyxLQUFLLEtBQUssRUFBRTtZQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ3pDLE1BQU07WUFDSCxLQUFLLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDakUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNqRTs7WUFFRCxLQUFLLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ3BFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDakU7U0FDSjs7UUFFRCxPQUFPLEtBQUssQ0FBQztLQUNoQjs7Ozs7Ozs7Ozs7SUFXRCxZQUFZLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQ2xDLE9BQU8sU0FBUyxLQUFLLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztLQUMzRzs7Ozs7Ozs7O0lBU0QsYUFBYSxDQUFDLENBQUMsRUFBRTtRQUNiLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2pFOzs7Ozs7Ozs7O0lBVUQsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQzlELE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxTQUFTLENBQUM7S0FDcEI7Ozs7Ozs7Ozs7O0lBV0Qsb0JBQW9CLENBQUMsQ0FBQyxFQUFFO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDcEQ7Ozs7Ozs7Ozs7O0lBV0Qsb0JBQW9CLENBQUMsTUFBTSxFQUFFO1FBQ3pCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3hDLE9BQU8sQ0FBQyxDQUFDO1NBQ1o7UUFDRCxPQUFPLFNBQVMsQ0FBQztLQUNwQjs7Ozs7Ozs7Ozs7Ozs7SUFjRCxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtRQUN2QixNQUFNLFVBQVUsR0FBRztZQUNmLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3BDLENBQUM7O1FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3hDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDN0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7O1FBRTFDLE1BQU0sU0FBUyxHQUFHLENBQUM7WUFDZixDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUM7WUFDakMsUUFBUSxFQUFFLE9BQU8sR0FBRyxRQUFRO1NBQy9CLEVBQUU7WUFDQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQztnQkFDbEIsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHO2dCQUNuQixHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDO2FBQzFCLENBQUM7WUFDRixRQUFRLEVBQUUsUUFBUSxHQUFHLFFBQVE7U0FDaEMsRUFBRTtZQUNDLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUNsQixHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUN2QixHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDdEIsQ0FBQztZQUNGLFFBQVEsRUFBRSxPQUFPLEdBQUcsU0FBUztTQUNoQyxFQUFFO1lBQ0MsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUM7Z0JBQ2xCLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQ3ZCLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUIsQ0FBQztZQUNGLFFBQVEsRUFBRSxRQUFRLEdBQUcsU0FBUztTQUNqQyxDQUFDLENBQUM7O1FBRUgsTUFBTSxNQUFNLEdBQUcsU0FBUzs7YUFFbkIsTUFBTSxDQUFDLENBQUMsUUFBUSxLQUFLLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDOzthQUU5QyxNQUFNLENBQUMsQ0FBQyxRQUFRLEtBQUs7Z0JBQ2xCLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQzttQkFDdEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7YUFFckQsTUFBTTtnQkFDSCxDQUFDLElBQUksRUFBRSxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxJQUFJO2dCQUN2RSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQy9CLENBQUM7O1FBRU4sT0FBTyxTQUFTLEtBQUssTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUM5RTs7Ozs7Ozs7O0lBU0QsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ3hCLEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUM7O1lBRS9CLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDekQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7WUFFekQsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO2dCQUNkLE9BQU8sR0FBRyxDQUFDO2FBQ2Q7U0FDSjs7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNmOzs7Ozs7Ozs7O0lBVUQsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7UUFDMUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDdEQ7Ozs7Ozs7OztJQVNELGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUN0QixPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pEOzs7Ozs7Ozs7SUFTRCxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDbEIsT0FBTztZQUNILEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3BDLENBQUM7S0FDTDtDQUNKOztBQ3BmRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStCQSxNQUFNLGtCQUFrQixHQUFHLENBQUMsSUFBSSxLQUFLO0lBQ2pDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUMxRixDQUFDOzs7Ozs7OztBQVFGLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUFHOzs7Ozs7Ozs7Ozs7O0lBYTNCLGNBQWMsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O1FBZ0JkLHdCQUF3QixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFOzs7O1lBSS9DLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQzNDO1NBQ0o7S0FDSjs7QUNoRkw7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsTUFBTSxlQUFlLEdBQUcsY0FBYyxLQUFLLENBQUM7SUFDeEMsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNkO0NBQ0o7O0FDdkJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUEsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLGFBQWEsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ3BDLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7O0FBRTlCLE1BQU0sYUFBYSxHQUFHLE1BQU07SUFDeEIsV0FBVyxDQUFDLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUU7UUFDNUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDN0I7O0lBRUQsSUFBSSxNQUFNLEdBQUc7UUFDVCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0I7O0lBRUQsSUFBSSxLQUFLLEdBQUc7UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQy9EOztJQUVELElBQUksTUFBTSxHQUFHO1FBQ1QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzVCOztJQUVELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7S0FDbEM7O0lBRUQsU0FBUyxDQUFDLFVBQVUsRUFBRTtRQUNsQixhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNwQyxPQUFPLElBQUksQ0FBQztLQUNmOztJQUVELE1BQU0sQ0FBQyxDQUFDLFNBQVMsRUFBRSxhQUFhLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRTtRQUNqRSxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2QsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQzs7WUFFdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDM0I7O1FBRUQsT0FBTyxJQUFJLENBQUM7S0FDZjtDQUNKOztBQy9ERDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUVBLE1BQU0sVUFBVSxHQUFHLGNBQWMsZUFBZSxDQUFDO0lBQzdDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7UUFDYixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDZDtDQUNKOztBQ3pCRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUVBLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxlQUFlLENBQUM7SUFDbkQsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNkO0NBQ0o7O0FDekJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBSUEsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7QUFDaEMsTUFBTSxvQkFBb0IsR0FBRyxjQUFjLGFBQWEsQ0FBQztJQUNyRCxXQUFXLENBQUMsS0FBSyxFQUFFO1FBQ2YsSUFBSSxLQUFLLEdBQUcscUJBQXFCLENBQUM7UUFDbEMsTUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDOztRQUVsQixJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDekIsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNqQixNQUFNLElBQUksUUFBUSxLQUFLLE9BQU8sS0FBSyxFQUFFO1lBQ2xDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUMvQixLQUFLLEdBQUcsV0FBVyxDQUFDO2FBQ3ZCLE1BQU07Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0osTUFBTTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVDOztRQUVELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUN4Qzs7SUFFRCxVQUFVLENBQUMsQ0FBQyxFQUFFO1FBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2YsU0FBUyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNsQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDckIsQ0FBQyxDQUFDO0tBQ047O0lBRUQsV0FBVyxDQUFDLENBQUMsRUFBRTtRQUNYLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNmLFNBQVMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDbEMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3JCLENBQUMsQ0FBQztLQUNOOztJQUVELE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2YsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzlELGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDeEIsQ0FBQyxDQUFDO0tBQ047Q0FDSjs7QUNsRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFHQSxNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztBQUNoQyxNQUFNLG1CQUFtQixHQUFHLGNBQWMsYUFBYSxDQUFDO0lBQ3BELFdBQVcsQ0FBQyxLQUFLLEVBQUU7UUFDZixJQUFJLEtBQUssR0FBRyxvQkFBb0IsQ0FBQztRQUNqQyxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQztRQUMxQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7O1FBRWxCLElBQUksUUFBUSxLQUFLLE9BQU8sS0FBSyxFQUFFO1lBQzNCLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDakIsTUFBTTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVDOztRQUVELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUN4Qzs7SUFFRCxRQUFRLEdBQUc7UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDZixTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLE1BQU07U0FDdEMsQ0FBQyxDQUFDO0tBQ047Q0FDSjs7QUMzQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFDQTtBQUNBLEFBRUEsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUM7QUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLGFBQWEsQ0FBQztJQUNuRCxXQUFXLENBQUMsS0FBSyxFQUFFO1FBQ2YsSUFBSSxLQUFLLEdBQUcsbUJBQW1CLENBQUM7UUFDaEMsTUFBTSxZQUFZLEdBQUcsbUJBQW1CLENBQUM7UUFDekMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDOztRQUVsQixJQUFJLFFBQVEsS0FBSyxPQUFPLEtBQUssRUFBRTtZQUMzQixLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ2pCLE1BQU07WUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUM1Qzs7UUFFRCxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDeEM7Q0FDSjs7QUN0Q0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFJQSxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQztBQUNwQyxNQUFNLG9CQUFvQixHQUFHLGNBQWMsYUFBYSxDQUFDO0lBQ3JELFdBQVcsQ0FBQyxLQUFLLEVBQUU7UUFDZixJQUFJLEtBQUssR0FBRyxxQkFBcUIsQ0FBQztRQUNsQyxNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztRQUMzQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7O1FBRWxCLElBQUksS0FBSyxZQUFZLE9BQU8sRUFBRTtZQUMxQixLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ2pCLE1BQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxLQUFLLEVBQUU7WUFDbEMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyQixLQUFLLEdBQUcsSUFBSSxDQUFDO2FBQ2hCLE1BQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM3QixLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ2pCLE1BQU07Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0osTUFBTTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVDOztRQUVELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUN4Qzs7SUFFRCxNQUFNLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDZixTQUFTLEVBQUUsTUFBTSxJQUFJLEtBQUssSUFBSSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO0tBQ047O0lBRUQsT0FBTyxHQUFHO1FBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2YsU0FBUyxFQUFFLE1BQU0sS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNO1NBQ3pDLENBQUMsQ0FBQztLQUNOO0NBQ0o7O0FDMUREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBS0EsTUFBTSxTQUFTLEdBQUcsTUFBTTtJQUNwQixXQUFXLEdBQUc7S0FDYjs7SUFFRCxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ1gsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFDOztJQUVELEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDVCxPQUFPLElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEM7O0lBRUQsT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNYLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMxQzs7SUFFRCxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ1YsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3pDOztDQUVKLENBQUM7O0FBRUYsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFNBQVMsRUFBRTs7QUM5QzFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLEFBSUE7QUFDQSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUM7QUFDaEMsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0FBQzlCLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQyxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQzs7O0FBR3RDLE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzdCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0IvQixNQUFNLFNBQVMsR0FBRyxjQUFjLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7O0lBYTVELFdBQVcsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUM1QyxLQUFLLEVBQUUsQ0FBQzs7UUFFUixNQUFNLFVBQVUsR0FBR0Esa0JBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUMvRSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsRCxNQUFNO1lBQ0gsTUFBTSxJQUFJLGtCQUFrQixDQUFDLDRDQUE0QyxDQUFDLENBQUM7U0FDOUU7O1FBRUQsTUFBTSxTQUFTLEdBQUdBLGtCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ25CLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRCxNQUFNO1lBQ0gsTUFBTSxJQUFJLGtCQUFrQixDQUFDLDJDQUEyQyxDQUFDLENBQUM7U0FDN0U7O1FBRUQsTUFBTSxVQUFVLEdBQUdBLGtCQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ3BCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsRCxNQUFNOztZQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDekM7O1FBRUQsTUFBTSxZQUFZLEdBQUdBLGtCQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7YUFDbEYsTUFBTSxFQUFFLENBQUM7UUFDZCxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUU7WUFDdEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNsRCxNQUFNOztZQUVILFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUM1QztLQUNKOztJQUVELFdBQVcsa0JBQWtCLEdBQUc7UUFDNUIsT0FBTztZQUNILGVBQWU7WUFDZixjQUFjO1lBQ2QsZUFBZTtZQUNmLGtCQUFrQjtTQUNyQixDQUFDO0tBQ0w7O0lBRUQsaUJBQWlCLEdBQUc7S0FDbkI7O0lBRUQsb0JBQW9CLEdBQUc7S0FDdEI7Ozs7Ozs7SUFPRCxJQUFJLEtBQUssR0FBRztRQUNSLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMzQjs7Ozs7OztJQU9ELElBQUksSUFBSSxHQUFHO1FBQ1AsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCOzs7Ozs7O0lBT0QsSUFBSSxLQUFLLEdBQUc7UUFDUixPQUFPLElBQUksS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFO1FBQ2hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ3pDLE1BQU07WUFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNoRDtLQUNKOzs7Ozs7O0lBT0QsU0FBUyxHQUFHO1FBQ1IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksV0FBVyxDQUFDLGdCQUFnQixFQUFFO2dCQUM1RCxNQUFNLEVBQUU7b0JBQ0osTUFBTSxFQUFFLElBQUk7aUJBQ2Y7YUFDSixDQUFDLENBQUMsQ0FBQztTQUNQO1FBQ0QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQztLQUNmOzs7OztJQUtELE9BQU8sR0FBRztRQUNOLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM1Qzs7Ozs7OztJQU9ELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxJQUFJLEtBQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN0Qzs7Ozs7OztJQU9ELFFBQVEsR0FBRztRQUNQLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3pCOzs7Ozs7Ozs7SUFTRCxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ1YsTUFBTSxJQUFJLEdBQUcsUUFBUSxLQUFLLE9BQU8sS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQzVELE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQztLQUMvQztDQUNKLENBQUM7O0FBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTdEQsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDOztBQ2xPdEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLEFBSUE7Ozs7QUFJQSxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztBQUM3QixNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztBQUNsQyxNQUFNLDhCQUE4QixHQUFHLEtBQUssQ0FBQztBQUM3QyxNQUFNLDZCQUE2QixHQUFHLEtBQUssQ0FBQztBQUM1QyxNQUFNLDhCQUE4QixHQUFHLEtBQUssQ0FBQzs7QUFFN0MsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQzs7QUFFaEIsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLGdCQUFnQixDQUFDO0FBQzlDLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxnQkFBZ0IsQ0FBQztBQUMvQyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUVoRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7O0FBRXBCLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQyxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztBQUNsQyxNQUFNLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUMxQyxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQztBQUN0QyxNQUFNLGdDQUFnQyxHQUFHLHdCQUF3QixDQUFDO0FBQ2xFLE1BQU0sK0JBQStCLEdBQUcsdUJBQXVCLENBQUM7QUFDaEUsTUFBTSxnQ0FBZ0MsR0FBRyx3QkFBd0IsQ0FBQztBQUNsRSxNQUFNLHVCQUF1QixHQUFHLGVBQWUsQ0FBQzs7O0FBR2hELE1BQU0sV0FBVyxHQUFHLENBQUMsWUFBWSxFQUFFLGFBQWEsR0FBRyxDQUFDLEtBQUs7SUFDckQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMxQyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBQztDQUN4RCxDQUFDOztBQUVGLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxLQUFLO0lBQ3RELE9BQU9BLGtCQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztTQUNoQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQ2IsU0FBUyxDQUFDLFlBQVksQ0FBQztTQUN2QixLQUFLLENBQUM7Q0FDZCxDQUFDOztBQUVGLE1BQU0sMEJBQTBCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksS0FBSztJQUNoRSxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDNUIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxPQUFPLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztLQUN2RDtJQUNELE9BQU8sWUFBWSxDQUFDO0NBQ3ZCLENBQUM7O0FBRUYsTUFBTSxVQUFVLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFlBQVksS0FBSztJQUMzRCxJQUFJLFNBQVMsS0FBSyxhQUFhLElBQUksTUFBTSxLQUFLLGFBQWEsRUFBRTtRQUN6RCxPQUFPLElBQUksQ0FBQztLQUNmLE1BQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO1FBQ2xDLE9BQU8sS0FBSyxDQUFDO0tBQ2hCLE1BQU07UUFDSCxPQUFPLFlBQVksQ0FBQztLQUN2QjtDQUNKLENBQUM7O0FBRUYsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxLQUFLO0lBQ3pELElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9DLE9BQU8sVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ2xGOztJQUVELE9BQU8sWUFBWSxDQUFDO0NBQ3ZCLENBQUM7OztBQUdGLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDOUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM5QixNQUFNLGNBQWMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ3JDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQzs7QUFFekMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRS9ELE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBSyxLQUFLO0lBQzVCLElBQUksU0FBUyxLQUFLLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM3QyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3BDOztJQUVELE9BQU8sa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3hDLENBQUM7O0FBRUYsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxLQUFLO0lBQ3ZDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0NBQy9ELENBQUM7O0FBRUYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDOztBQUVyRSxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksS0FBSztJQUM5QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7O1FBRTFELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM3QztLQUNKO0NBQ0osQ0FBQzs7OztBQUlGLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7O0FBR3BDLE1BQU0sZ0NBQWdDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sS0FBSztJQUNuRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQzs7SUFFakQsTUFBTSxDQUFDLEdBQUcsT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEUsTUFBTSxDQUFDLEdBQUcsT0FBTyxHQUFHLFNBQVMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBRXZFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakIsQ0FBQzs7QUFFRixNQUFNLGdCQUFnQixHQUFHLENBQUMsS0FBSyxLQUFLO0lBQ2hDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7OztJQUdsQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztJQUN2QixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDMUIsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDOztJQUV2QixNQUFNLE9BQU8sR0FBRyxNQUFNO1FBQ2xCLElBQUksSUFBSSxLQUFLLEtBQUssSUFBSSxZQUFZLEtBQUssS0FBSyxFQUFFOztZQUUxQyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDcEYsSUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3pCLGNBQWMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDN0MsTUFBTTtnQkFDSCxjQUFjLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQzFDO1lBQ0QsS0FBSyxHQUFHLElBQUksQ0FBQzs7WUFFYixXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdEI7O1FBRUQsV0FBVyxHQUFHLElBQUksQ0FBQztLQUN0QixDQUFDOztJQUVGLE1BQU0sWUFBWSxHQUFHLE1BQU07UUFDdkIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNoRSxDQUFDOztJQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU07UUFDdEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0tBQ3RCLENBQUM7O0lBRUYsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssS0FBSztRQUNoQyxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7O1lBRWhCLE1BQU0sR0FBRztnQkFDTCxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ2hCLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTzthQUNuQixDQUFDOztZQUVGLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs7WUFFNUcsSUFBSSxJQUFJLEtBQUssY0FBYyxFQUFFOztnQkFFekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRTtvQkFDM0QsS0FBSyxHQUFHLFlBQVksQ0FBQztvQkFDckIsWUFBWSxFQUFFLENBQUM7aUJBQ2xCLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRTtvQkFDbkMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDYixZQUFZLEVBQUUsQ0FBQztpQkFDbEIsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFO29CQUNwQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2lCQUNoQjthQUNKOztTQUVKO0tBQ0osQ0FBQzs7SUFFRixNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQUssS0FBSztRQUMvQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsSCxJQUFJLFFBQVEsS0FBSyxLQUFLLEVBQUU7WUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO1NBQ3BDLE1BQU0sSUFBSSxJQUFJLEtBQUssY0FBYyxFQUFFO1lBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztTQUNoQyxNQUFNO1lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1NBQ25DO0tBQ0osQ0FBQzs7SUFFRixNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSztRQUNwQixJQUFJLElBQUksS0FBSyxLQUFLLElBQUksWUFBWSxLQUFLLEtBQUssRUFBRTs7O1lBRzFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7WUFFOUMsSUFBSSxTQUFTLEdBQUcsRUFBRSxJQUFJLFNBQVMsR0FBRyxFQUFFLEVBQUU7Z0JBQ2xDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ2pCLFdBQVcsRUFBRSxDQUFDOztnQkFFZCxNQUFNLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLEtBQUssY0FBYyxDQUFDLENBQUM7Z0JBQ25GLFdBQVcsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDOUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNoRjtTQUNKLE1BQU0sSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQzNCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7O1lBRXBDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQzs7WUFFMUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDaEY7S0FDSixDQUFDOztJQUVGLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBSyxLQUFLO1FBQy9CLElBQUksSUFBSSxLQUFLLGNBQWMsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQy9DLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7O1lBRXBDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQzs7WUFFMUMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ3JDLEdBQUcsRUFBRSxjQUFjO2dCQUNuQixDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO2FBQ1osQ0FBQyxDQUFDOztZQUVILE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztZQUUvRCxjQUFjLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztTQUMxQzs7O1FBR0QsY0FBYyxHQUFHLElBQUksQ0FBQztRQUN0QixLQUFLLEdBQUcsSUFBSSxDQUFDOzs7UUFHYixXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdEIsQ0FBQzs7Ozs7Ozs7SUFRRixJQUFJLGdCQUFnQixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDaEQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLGNBQWMsS0FBSztRQUN6QyxPQUFPLENBQUMsVUFBVSxLQUFLO1lBQ25CLElBQUksVUFBVSxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtnQkFDN0MsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxnQkFBZ0IsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzthQUN6QztZQUNELE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztTQUMxRSxDQUFDO0tBQ0wsQ0FBQzs7SUFFRixNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDckUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDOztJQUV2RCxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFO1FBQzdCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNwRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlDOztJQUVELElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7UUFDM0QsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztLQUN6RDs7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDakUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNwRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0NBQ3hELENBQUM7Ozs7Ozs7O0FBUUYsTUFBTSxZQUFZLEdBQUcsY0FBYyxXQUFXLENBQUM7Ozs7O0lBSzNDLFdBQVcsR0FBRztRQUNWLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7O1FBRTNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxVQUFVLENBQUM7WUFDN0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0osZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7O0lBRUQsV0FBVyxrQkFBa0IsR0FBRztRQUM1QixPQUFPO1lBQ0gsZUFBZTtZQUNmLGdCQUFnQjtZQUNoQixvQkFBb0I7WUFDcEIsa0JBQWtCO1lBQ2xCLGdDQUFnQztZQUNoQyxnQ0FBZ0M7WUFDaEMsK0JBQStCO1lBQy9CLHVCQUF1QjtTQUMxQixDQUFDO0tBQ0w7O0lBRUQsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7UUFDL0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxRQUFRLElBQUk7UUFDWixLQUFLLGVBQWUsRUFBRTtZQUNsQixNQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUMxQixNQUFNLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxNQUFNO1NBQ1Q7UUFDRCxLQUFLLGdCQUFnQixFQUFFO1lBQ25CLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksY0FBYyxDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUMsTUFBTTtTQUNUO1FBQ0QsS0FBSyxvQkFBb0IsRUFBRTtZQUN2QixNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLENBQUM7WUFDNUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQ3BDLE1BQU07U0FDVDtRQUNELEtBQUssa0JBQWtCLEVBQUU7WUFDckIsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUM5QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLGdDQUFnQyxFQUFFO1lBQ25DLE1BQU0sZ0JBQWdCLEdBQUdBLGtCQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLGdDQUFnQyxFQUFFLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDbEosSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN2QyxNQUFNO1NBQ1Q7UUFDRCxTQUFTLEFBRVI7U0FDQTs7UUFFRCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDckI7O0lBRUQsaUJBQWlCLEdBQUc7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxNQUFNO1lBQ3pDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2YsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNwRDtTQUNKLENBQUMsQ0FBQzs7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsTUFBTTtZQUMzQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pELGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3QixDQUFDLENBQUM7Ozs7UUFJSCxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7WUFDaEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztTQUMvRDtLQUNKOztJQUVELG9CQUFvQixHQUFHO0tBQ3RCOztJQUVELGVBQWUsR0FBRztLQUNqQjs7Ozs7OztJQU9ELElBQUksTUFBTSxHQUFHO1FBQ1QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzVCOzs7Ozs7OztJQVFELElBQUksSUFBSSxHQUFHO1FBQ1AsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDcEQ7Ozs7Ozs7SUFPRCxJQUFJLG1CQUFtQixHQUFHO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztLQUMxQzs7Ozs7OztJQU9ELElBQUksS0FBSyxHQUFHO1FBQ1IsT0FBTywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQzNFOzs7Ozs7SUFNRCxJQUFJLE1BQU0sR0FBRztRQUNULE9BQU8sMEJBQTBCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQzdFOzs7Ozs7SUFNRCxJQUFJLFVBQVUsR0FBRztRQUNiLE9BQU8sMEJBQTBCLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDLENBQUM7S0FDckY7Ozs7Ozs7SUFPRCxJQUFJLE9BQU8sR0FBRztRQUNWLE9BQU8sMEJBQTBCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLENBQUM7S0FDakY7Ozs7OztJQU1ELElBQUksb0JBQW9CLEdBQUc7UUFDdkIsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztLQUN0Rzs7Ozs7O0lBTUQsSUFBSSxtQkFBbUIsR0FBRztRQUN0QixPQUFPLG1CQUFtQixDQUFDLElBQUksRUFBRSwrQkFBK0IsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0tBQ3BHOzs7Ozs7SUFNRCxJQUFJLG9CQUFvQixHQUFHO1FBQ3ZCLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxFQUFFLGdDQUFnQyxFQUFFLDhCQUE4QixDQUFDLENBQUM7S0FDdEc7Ozs7Ozs7OztJQVNELElBQUksWUFBWSxHQUFHO1FBQ2YsT0FBTywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUUscUJBQXFCLENBQUMsQ0FBQztLQUMzRjs7Ozs7OztJQU9ELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ3hEOzs7Ozs7Ozs7O0lBVUQsU0FBUyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsRUFBRTtRQUN0QyxJQUFJLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDM0IsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ3RCO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQ3BCO0NBQ0osQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQzs7QUNuaEI3RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLEFBR0E7OztBQUdBLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMzQixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDekIsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQzlCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNwQixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDM0IsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDOztBQUU1QixNQUFNQyxpQkFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQyxNQUFNLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztBQUNwQyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7QUFDOUIsTUFBTSxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDdEMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ3hCLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQzs7QUFFeEIsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDO0FBQzFCLE1BQU0sMEJBQTBCLEdBQUcsRUFBRSxDQUFDO0FBQ3RDLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0FBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLE1BQU0sSUFBSSxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUNoQyxNQUFNLFFBQVEsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQzs7QUFFMUIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUs7SUFDckIsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztDQUNoQyxDQUFDOztBQUVGLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSTtJQUNyQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSSxjQUFjLENBQUM7Q0FDOUUsQ0FBQzs7Ozs7OztBQU9GLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV4RSxNQUFNLHNCQUFzQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFekQsQUFhQTs7Ozs7Ozs7O0FBU0EsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDOztBQUV0RixNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEtBQUs7SUFDaEQsTUFBTSxTQUFTLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUM3QixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQztJQUN0QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDcEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsS0FBSyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2YsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0NBQ3JCLENBQUM7O0FBRUYsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxLQUFLO0lBQy9DLE1BQU0sS0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQztJQUN2QyxNQUFNLHFCQUFxQixHQUFHLDBCQUEwQixHQUFHLEtBQUssQ0FBQztJQUNqRSxNQUFNLGtCQUFrQixHQUFHLFVBQVUsR0FBRyxDQUFDLEdBQUcscUJBQXFCLENBQUM7SUFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsQ0FBQzs7SUFFM0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxlQUFlLEdBQUcscUJBQXFCLENBQUM7SUFDbkUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxlQUFlLENBQUM7O0lBRTNDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNwQixPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUMxQixPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztJQUM5QixPQUFPLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztJQUNqQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsRUFBRSxNQUFNLEdBQUcscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFILE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLGtCQUFrQixHQUFHLHFCQUFxQixFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3pILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLGtCQUFrQixFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDM0gsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcscUJBQXFCLEVBQUUsTUFBTSxHQUFHLHFCQUFxQixDQUFDLENBQUM7SUFDL0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7SUFFdkcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztDQUNyQixDQUFDOztBQUVGLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxLQUFLO0lBQ3hDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNwQixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM5QixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Q0FDckIsQ0FBQzs7OztBQUlGLE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTUMsUUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDaEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUN6QixNQUFNLEVBQUUsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7Ozs7Ozs7O0FBVXpCLE1BQU0sTUFBTSxHQUFHLGNBQWMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7O0lBS3pELFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3BELEtBQUssRUFBRSxDQUFDOztRQUVSLE1BQU0sU0FBUyxHQUFHRixrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUN4RSxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNiLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUN2QixLQUFLLENBQUM7O1FBRVgsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7O1FBRTdDLElBQUksQ0FBQyxLQUFLLEdBQUdBLGtCQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDQyxpQkFBZSxDQUFDLENBQUM7YUFDbkUsU0FBUyxDQUFDLGFBQWEsQ0FBQzthQUN4QixLQUFLLENBQUM7O1FBRVgsSUFBSSxDQUFDLFFBQVEsR0FBR0Qsa0JBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUM5RSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNmLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQzthQUMzQixLQUFLLENBQUM7O1FBRVgsSUFBSSxDQUFDLENBQUMsR0FBR0Esa0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDekQsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUNiLFNBQVMsQ0FBQyxTQUFTLENBQUM7YUFDcEIsS0FBSyxDQUFDOztRQUVYLElBQUksQ0FBQyxDQUFDLEdBQUdBLGtCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ3pELFVBQVUsQ0FBQyxDQUFDLENBQUM7YUFDYixTQUFTLENBQUMsU0FBUyxDQUFDO2FBQ3BCLEtBQUssQ0FBQzs7UUFFWCxJQUFJLENBQUMsTUFBTSxHQUFHQSxrQkFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3hFLFFBQVEsRUFBRTthQUNWLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFDZixLQUFLLENBQUM7S0FDZDs7SUFFRCxXQUFXLGtCQUFrQixHQUFHO1FBQzVCLE9BQU87WUFDSEMsaUJBQWU7WUFDZixpQkFBaUI7WUFDakIsY0FBYztZQUNkLGtCQUFrQjtZQUNsQixXQUFXO1lBQ1gsV0FBVztTQUNkLENBQUM7S0FDTDs7SUFFRCxpQkFBaUIsR0FBRztRQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztLQUM5RDs7SUFFRCxvQkFBb0IsR0FBRztRQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7O0lBUUQsU0FBUyxHQUFHO1FBQ1IsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ25DOzs7Ozs7OztJQVFELFFBQVEsR0FBRztRQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0tBQzNCOzs7Ozs7O0lBT0QsSUFBSSxJQUFJLEdBQUc7UUFDUCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7SUFPRCxJQUFJLEtBQUssR0FBRztRQUNSLE9BQU9DLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0I7SUFDRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDaEIsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ25CLElBQUksQ0FBQyxlQUFlLENBQUNELGlCQUFlLENBQUMsQ0FBQztZQUN0Q0MsUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDbkMsTUFBTTtZQUNIQSxRQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDRCxpQkFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2hEO0tBQ0o7Ozs7Ozs7O0lBUUQsSUFBSSxNQUFNLEdBQUc7UUFDVCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7SUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7WUFDakIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQyxNQUFNO1lBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDbkQ7S0FDSjs7Ozs7OztJQU9ELElBQUksV0FBVyxHQUFHO1FBQ2QsT0FBTyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzdFO0lBQ0QsSUFBSSxXQUFXLENBQUMsQ0FBQyxFQUFFO1FBQ2YsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ1osSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDZCxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNqQixLQUFLO1lBQ0YsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNkO0tBQ0o7Ozs7Ozs7SUFPRCxjQUFjLEdBQUc7UUFDYixPQUFPLElBQUksS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDO0tBQ3BDOzs7Ozs7O0lBT0QsSUFBSSxDQUFDLEdBQUc7UUFDSixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFDUixFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNoQzs7Ozs7OztJQU9ELElBQUksQ0FBQyxHQUFHO1FBQ0osT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZCO0lBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFO1FBQ1IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDaEM7Ozs7Ozs7SUFPRCxJQUFJLFFBQVEsR0FBRztRQUNYLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtJQUNELElBQUksUUFBUSxDQUFDLElBQUksRUFBRTtRQUNmLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNmLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDcEMsTUFBTTtZQUNILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLGNBQWMsQ0FBQztZQUNqRCxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7U0FDckQ7S0FDSjs7Ozs7Ozs7SUFRRCxPQUFPLEdBQUc7UUFDTixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2hCLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO2dCQUMxQyxNQUFNLEVBQUU7b0JBQ0osR0FBRyxFQUFFLElBQUk7aUJBQ1o7YUFDSixDQUFDLENBQUMsQ0FBQztTQUNQO0tBQ0o7Ozs7Ozs7OztJQVNELE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFO2dCQUN6QyxNQUFNLEVBQUU7b0JBQ0osR0FBRyxFQUFFLElBQUk7b0JBQ1QsTUFBTTtpQkFDVDthQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ1A7S0FDSjs7Ozs7OztJQU9ELE1BQU0sR0FBRztRQUNMLE9BQU8sSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDL0I7Ozs7Ozs7OztJQVNELFNBQVMsQ0FBQyxNQUFNLEVBQUU7UUFDZCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDbEQsTUFBTSxFQUFFO29CQUNKLEdBQUcsRUFBRSxJQUFJO29CQUNULE1BQU07aUJBQ1Q7YUFDSixDQUFDLENBQUMsQ0FBQztTQUNQO0tBQ0o7Ozs7Ozs7Ozs7OztJQVlELE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ3JELE1BQU0sS0FBSyxHQUFHLE9BQU8sR0FBRyxhQUFhLENBQUM7UUFDdEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUMzQixNQUFNLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUM7O1FBRW5DLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDOztRQUUzQixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNmLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN2RDs7UUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDeEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDekQ7O1FBRUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBRTVDLFFBQVEsSUFBSSxDQUFDLElBQUk7UUFDakIsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsRUFBRTtZQUNKLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNO1NBQ1Q7UUFDRCxRQUFRO1NBQ1A7OztRQUdELE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUMxQztDQUNKLENBQUM7O0FBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQzFmaEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFFQTs7Ozs7QUFLQSxNQUFNLGFBQWEsR0FBRyxjQUFjLFdBQVcsQ0FBQzs7Ozs7SUFLNUMsV0FBVyxHQUFHO1FBQ1YsS0FBSyxFQUFFLENBQUM7S0FDWDs7SUFFRCxpQkFBaUIsR0FBRztRQUNoQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDM0M7O1FBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLENBQUMsS0FBSyxLQUFLOztZQUUvQyxJQUFJLENBQUMsT0FBTztpQkFDUCxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUMzQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDLENBQUMsQ0FBQztLQUNOOztJQUVELG9CQUFvQixHQUFHO0tBQ3RCOzs7Ozs7O0lBT0QsSUFBSSxPQUFPLEdBQUc7UUFDVixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUN2RDtDQUNKLENBQUM7O0FBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLENBQUM7O0FDN0QvRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBS0EsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDekQsT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsT0FBTyxFQUFFLDJCQUEyQjtJQUNwQyxZQUFZLEVBQUUsWUFBWTtJQUMxQixNQUFNLEVBQUUsTUFBTTtJQUNkLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLGFBQWEsRUFBRSxhQUFhO0NBQy9CLENBQUMsQ0FBQyIsInByZUV4aXN0aW5nQ29tbWVudCI6Ii8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJanB1ZFd4c0xDSnpiM1Z5WTJWeklqcGJJaTlvYjIxbEwyaDFkV0l2VUhKdmFtVmpkSE12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMM055WXk5bGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12UjNKcFpFeGhlVzkxZEM1cWN5SXNJaTlvYjIxbEwyaDFkV0l2VUhKdmFtVmpkSE12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMM055WXk5dGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE11YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZG1Gc2FXUmhkR1V2WlhKeWIzSXZWbUZzYVdSaGRHbHZia1Z5Y205eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwxUjVjR1ZXWVd4cFpHRjBiM0l1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZG1Gc2FXUmhkR1V2WlhKeWIzSXZVR0Z5YzJWRmNuSnZjaTVxY3lJc0lpOW9iMjFsTDJoMWRXSXZVSEp2YW1WamRITXZkSGRsYm5SNUxXOXVaUzF3YVhCekwzTnlZeTkyWVd4cFpHRjBaUzlsY25KdmNpOUpiblpoYkdsa1ZIbHdaVVZ5Y205eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwwbHVkR1ZuWlhKVWVYQmxWbUZzYVdSaGRHOXlMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMM1poYkdsa1lYUmxMMU4wY21sdVoxUjVjR1ZXWVd4cFpHRjBiM0l1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12ZG1Gc2FXUmhkR1V2UTI5c2IzSlVlWEJsVm1Gc2FXUmhkRzl5TG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNaaGJHbGtZWFJsTDBKdmIyeGxZVzVVZVhCbFZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwzWmhiR2xrWVhSbEwzWmhiR2xrWVhSbExtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwxUnZjRkJzWVhsbGNpNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OVViM0JFYVdObFFtOWhjbVF1YW5NaUxDSXZhRzl0WlM5b2RYVmlMMUJ5YjJwbFkzUnpMM1IzWlc1MGVTMXZibVV0Y0dsd2N5OXpjbU12Vkc5d1JHbGxMbXB6SWl3aUwyaHZiV1V2YUhWMVlpOVFjbTlxWldOMGN5OTBkMlZ1ZEhrdGIyNWxMWEJwY0hNdmMzSmpMMVJ2Y0ZCc1lYbGxja3hwYzNRdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdmRIZGxiblI1TFc5dVpTMXdhWEJ6TG1weklsMHNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dVhHNHZLaXBjYmlBcUlFQnRiMlIxYkdWY2JpQXFMMXh1WEc0dktpcGNiaUFxSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2x4dUlDcGNiaUFxSUVCbGVIUmxibVJ6SUVWeWNtOXlYRzRnS2k5Y2JtTnZibk4wSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nUlhKeWIzSWdlMXh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTNKbFlYUmxJR0VnYm1WM0lFTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpQjNhWFJvSUcxbGMzTmhaMlV1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdiV1Z6YzJGblpTQXRJRlJvWlNCdFpYTnpZV2RsSUdGemMyOWphV0YwWldRZ2QybDBhQ0IwYUdselhHNGdJQ0FnSUNvZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtHMWxjM05oWjJVcElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb2JXVnpjMkZuWlNrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHREYjI1bWFXZDFjbUYwYVc5dVJYSnliM0o5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TG1welhDSTdYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaVnh1SUNvdlhHNWNibU52Ym5OMElFWlZURXhmUTBsU1EweEZYMGxPWDBSRlIxSkZSVk1nUFNBek5qQTdYRzVjYm1OdmJuTjBJSEpoYm1SdmJXbDZaVU5sYm5SbGNpQTlJQ2h1S1NBOVBpQjdYRzRnSUNBZ2NtVjBkWEp1SUNnd0xqVWdQRDBnVFdGMGFDNXlZVzVrYjIwb0tTQS9JRTFoZEdndVpteHZiM0lnT2lCTllYUm9MbU5sYVd3cExtTmhiR3dvTUN3Z2JpazdYRzU5TzF4dVhHNHZMeUJRY21sMllYUmxJR1pwWld4a2MxeHVZMjl1YzNRZ1gzZHBaSFJvSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlvWldsbmFIUWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyTnZiSE1nUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM0p2ZDNNZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScFkyVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gyUnBaVk5wZW1VZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJScGMzQmxjbk5wYjI0Z1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDNKdmRHRjBaU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYmk4cUtseHVJQ29nUUhSNWNHVmtaV1lnZTA5aWFtVmpkSDBnUjNKcFpFeGhlVzkxZEVOdmJtWnBaM1Z5WVhScGIyNWNiaUFxSUVCd2NtOXdaWEowZVNCN1RuVnRZbVZ5ZlNCamIyNW1hV2N1ZDJsa2RHZ2dMU0JVYUdVZ2JXbHVhVzFoYkNCM2FXUjBhQ0J2WmlCMGFHbHpYRzRnS2lCSGNtbGtUR0Y1YjNWMElHbHVJSEJwZUdWc2N5NDdYRzRnS2lCQWNISnZjR1Z5ZEhrZ2UwNTFiV0psY24wZ1kyOXVabWxuTG1obGFXZG9kRjBnTFNCVWFHVWdiV2x1YVcxaGJDQm9aV2xuYUhRZ2IyWmNiaUFxSUhSb2FYTWdSM0pwWkV4aGVXOTFkQ0JwYmlCd2FYaGxiSE11TGx4dUlDb2dRSEJ5YjNCbGNuUjVJSHRPZFcxaVpYSjlJR052Ym1acFp5NWthWE53WlhKemFXOXVJQzBnVkdobElHUnBjM1JoYm1ObElHWnliMjBnZEdobElHTmxiblJsY2lCdlppQjBhR1ZjYmlBcUlHeGhlVzkxZENCaElHUnBaU0JqWVc0Z1ltVWdiR0Y1YjNWMExseHVJQ29nUUhCeWIzQmxjblI1SUh0T2RXMWlaWEo5SUdOdmJtWnBaeTVrYVdWVGFYcGxJQzBnVkdobElITnBlbVVnYjJZZ1lTQmthV1V1WEc0Z0tpOWNibHh1THlvcVhHNGdLaUJIY21sa1RHRjViM1YwSUdoaGJtUnNaWE1nYkdGNWFXNW5JRzkxZENCMGFHVWdaR2xqWlNCdmJpQmhJRVJwWTJWQ2IyRnlaQzVjYmlBcUwxeHVZMjl1YzNRZ1IzSnBaRXhoZVc5MWRDQTlJR05zWVhOeklIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0SGNtbGtUR0Y1YjNWMFEyOXVabWxuZFhKaGRHbHZibjBnWTI5dVptbG5JQzBnVkdobElHTnZibVpwWjNWeVlYUnBiMjRnYjJZZ2RHaGxJRWR5YVdSTVlYbHZkWFJjYmlBZ0lDQWdLaTljYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWg3WEc0Z0lDQWdJQ0FnSUhkcFpIUm9MRnh1SUNBZ0lDQWdJQ0JvWldsbmFIUXNYRzRnSUNBZ0lDQWdJR1JwYzNCbGNuTnBiMjRzWEc0Z0lDQWdJQ0FnSUdScFpWTnBlbVZjYmlBZ0lDQjlJRDBnZTMwcElIdGNiaUFnSUNBZ0lDQWdYMlJwWTJVdWMyVjBLSFJvYVhNc0lGdGRLVHRjYmlBZ0lDQWdJQ0FnWDJScFpWTnBlbVV1YzJWMEtIUm9hWE1zSURFcE8xeHVJQ0FnSUNBZ0lDQmZkMmxrZEdndWMyVjBLSFJvYVhNc0lEQXBPMXh1SUNBZ0lDQWdJQ0JmYUdWcFoyaDBMbk5sZENoMGFHbHpMQ0F3S1R0Y2JpQWdJQ0FnSUNBZ1gzSnZkR0YwWlM1elpYUW9kR2hwY3l3Z2RISjFaU2s3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVhOd1pYSnphVzl1SUQwZ1pHbHpjR1Z5YzJsdmJqdGNiaUFnSUNBZ0lDQWdkR2hwY3k1a2FXVlRhWHBsSUQwZ1pHbGxVMmw2WlR0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTUzYVdSMGFDQTlJSGRwWkhSb08xeHVJQ0FnSUNBZ0lDQjBhR2x6TG1obGFXZG9kQ0E5SUdobGFXZG9kRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2QybGtkR2dnYVc0Z2NHbDRaV3h6SUhWelpXUWdZbmtnZEdocGN5QkhjbWxrVEdGNWIzVjBMbHh1SUNBZ0lDQXFJRUIwYUhKdmQzTWdiVzlrZFd4bE9tVnljbTl5TDBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2k1RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ1YybGtkR2dnUGowZ01GeHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5SUZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCM2FXUjBhQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5M2FXUjBhQzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUhkcFpIUm9LSGNwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLREFnUGlCM0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUtHQlhhV1IwYUNCemFHOTFiR1FnWW1VZ1lTQnVkVzFpWlhJZ2JHRnlaMlZ5SUhSb1lXNGdNQ3dnWjI5MElDY2tlM2Q5SnlCcGJuTjBaV0ZrTG1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJRjkzYVdSMGFDNXpaWFFvZEdocGN5d2dkeWs3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVYMk5oYkdOMWJHRjBaVWR5YVdRb2RHaHBjeTUzYVdSMGFDd2dkR2hwY3k1b1pXbG5hSFFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQm9aV2xuYUhRZ2FXNGdjR2w0Wld4eklIVnpaV1FnWW5rZ2RHaHBjeUJIY21sa1RHRjViM1YwTGlCY2JpQWdJQ0FnS2lCQWRHaHliM2R6SUcxdlpIVnNaVHBsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSXVRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlJRWhsYVdkb2RDQStQU0F3WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQm9aV2xuYUhRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZhR1ZwWjJoMExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCelpYUWdhR1ZwWjJoMEtHZ3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQaUJvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCSVpXbG5hSFFnYzJodmRXeGtJR0psSUdFZ2JuVnRZbVZ5SUd4aGNtZGxjaUIwYUdGdUlEQXNJR2R2ZENBbkpIdG9mU2NnYVc1emRHVmhaQzVnS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmZhR1ZwWjJoMExuTmxkQ2gwYUdsekxDQm9LVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWZZMkZzWTNWc1lYUmxSM0pwWkNoMGFHbHpMbmRwWkhSb0xDQjBhR2x6TG1obGFXZG9kQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHMWhlR2x0ZFcwZ2JuVnRZbVZ5SUc5bUlHUnBZMlVnZEdoaGRDQmpZVzRnWW1VZ2JHRjViM1YwSUc5dUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM0Z1ZHaHBjMXh1SUNBZ0lDQXFJRzUxYldKbGNpQnBjeUErUFNBd0xpQlNaV0ZrSUc5dWJIa3VYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCdFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyOXNjeUFxSUhSb2FYTXVYM0p2ZDNNN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR1JwYzNCbGNuTnBiMjRnYkdWMlpXd2dkWE5sWkNCaWVTQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdUlGUm9aU0JrYVhOd1pYSnphVzl1SUd4bGRtVnNYRzRnSUNBZ0lDb2dhVzVrYVdOaGRHVnpJSFJvWlNCa2FYTjBZVzVqWlNCbWNtOXRJSFJvWlNCalpXNTBaWElnWkdsalpTQmpZVzRnWW1VZ2JHRjViM1YwTGlCVmMyVWdNU0JtYjNJZ1lWeHVJQ0FnSUNBcUlIUnBaMmgwSUhCaFkydGxaQ0JzWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkR2h5YjNkeklHMXZaSFZzWlRwbGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUVScGMzQmxjbk5wYjI0Z1BqMGdNRnh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHUnBjM0JsY25OcGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsemNHVnljMmx2Ymk1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzJWMElHUnBjM0JsY25OcGIyNG9aQ2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0ErSUdRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lFUnBjM0JsY25OcGIyNGdjMmh2ZFd4a0lHSmxJR0VnYm5WdFltVnlJR3hoY21kbGNpQjBhR0Z1SURBc0lHZHZkQ0FuSkh0a2ZTY2dhVzV6ZEdWaFpDNWdLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJScGMzQmxjbk5wYjI0dWMyVjBLSFJvYVhNc0lHUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCemFYcGxJRzltSUdFZ1pHbGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFJvY205M2N5QnRiMlIxYkdVNlpYSnliM0l2UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGtOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCRWFXVlRhWHBsSUQ0OUlEQmNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FXVlRhWHBsS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyUnBaVk5wZW1VdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhObGRDQmthV1ZUYVhwbEtHUnpLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRDQ5SUdSektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUtHQmthV1ZUYVhwbElITm9iM1ZzWkNCaVpTQmhJRzUxYldKbGNpQnNZWEpuWlhJZ2RHaGhiaUF4TENCbmIzUWdKeVI3WkhOOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUY5a2FXVlRhWHBsTG5ObGRDaDBhR2x6TENCa2N5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHZGxkQ0J5YjNSaGRHVW9LU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSElnUFNCZmNtOTBZWFJsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkNBOVBUMGdjaUEvSUhSeWRXVWdPaUJ5TzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCeWIzUmhkR1VvY2lrZ2UxeHVJQ0FnSUNBZ0lDQmZjbTkwWVhSbExuTmxkQ2gwYUdsekxDQnlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2JuVnRZbVZ5SUc5bUlISnZkM01nYVc0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VG5WdFltVnlmU0JVYUdVZ2JuVnRZbVZ5SUc5bUlISnZkM01zSURBZ1BDQnliM2R6TGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUY5eWIzZHpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNKdmQzTXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdWRXMWlaWElnYjJZZ1kyOXNkVzF1Y3lCcGJpQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0T2RXMWlaWEo5SUZSb1pTQnVkVzFpWlhJZ2IyWWdZMjlzZFcxdWN5d2dNQ0E4SUdOdmJIVnRibk11WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWDJOdmJITW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWTI5c2N5NW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdObGJuUmxjaUJqWld4c0lHbHVJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwOWlhbVZqZEgwZ1ZHaGxJR05sYm5SbGNpQW9jbTkzTENCamIyd3BMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRjlqWlc1MFpYSW9LU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEp2ZHlBOUlISmhibVJ2YldsNlpVTmxiblJsY2loMGFHbHpMbDl5YjNkeklDOGdNaWtnTFNBeE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCamIyd2dQU0J5WVc1a2IyMXBlbVZEWlc1MFpYSW9kR2hwY3k1ZlkyOXNjeUF2SURJcElDMGdNVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZTNKdmR5d2dZMjlzZlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCTVlYbHZkWFFnWkdsalpTQnZiaUIwYUdseklFZHlhV1JNWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UyMXZaSFZzWlRwRWFXVitSR2xsVzExOUlHUnBZMlVnTFNCVWFHVWdaR2xqWlNCMGJ5QnNZWGx2ZFhRZ2IyNGdkR2hwY3lCTVlYbHZkWFF1WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3Ylc5a2RXeGxPa1JwWlg1RWFXVmJYWDBnVkdobElITmhiV1VnYkdsemRDQnZaaUJrYVdObExDQmlkWFFnYm05M0lHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGFISnZkM01nZTIxdlpIVnNaVHBsY25KdmNpOURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSitRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmU0JVYUdVZ2JuVnRZbVZ5SUc5bVhHNGdJQ0FnSUNvZ1pHbGpaU0J6YUc5MWJHUWdibTkwSUdWNFkyVmxaQ0IwYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pHbGpaU0IwYUdseklFeGhlVzkxZENCallXNWNiaUFnSUNBZ0tpQnNZWGx2ZFhRdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnYkdGNWIzVjBLR1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0dScFkyVXViR1Z1WjNSb0lENGdkR2hwY3k1dFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUtHQlVhR1VnYm5WdFltVnlJRzltSUdScFkyVWdkR2hoZENCallXNGdZbVVnYkdGNWIzVjBJR2x6SUNSN2RHaHBjeTV0WVhocGJYVnRUblZ0WW1WeVQyWkVhV05sZlN3Z1oyOTBJQ1I3WkdsalpTNXNaVzVuYUhSOUlHUnBZMlVnYVc1emRHVmhaQzVnS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHRnNjbVZoWkhsTVlYbHZkWFJFYVdObElEMGdXMTA3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1JwWTJWVWIweGhlVzkxZENBOUlGdGRPMXh1WEc0Z0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1pHbGxJRzltSUdScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hrYVdVdWFHRnpRMjl2Y21ScGJtRjBaWE1vS1NBbUppQmthV1V1YVhOSVpXeGtLQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkVhV05sSUhSb1lYUWdZWEpsSUdKbGFXNW5JR2hsYkdRZ1lXNWtJR2hoZG1VZ1ltVmxiaUJzWVhsdmRYUWdZbVZtYjNKbElITm9iM1ZzWkZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklHdGxaWEFnZEdobGFYSWdZM1Z5Y21WdWRDQmpiMjl5WkdsdVlYUmxjeUJoYm1RZ2NtOTBZWFJwYjI0dUlFbHVJRzkwYUdWeUlIZHZjbVJ6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklIUm9aWE5sSUdScFkyVWdZWEpsSUhOcmFYQndaV1F1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlV1Y0hWemFDaGthV1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV05sVkc5TVlYbHZkWFF1Y0hWemFDaGthV1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYldGNElEMGdUV0YwYUM1dGFXNG9aR2xqWlM1c1pXNW5kR2dnS2lCMGFHbHpMbVJwYzNCbGNuTnBiMjRzSUhSb2FYTXViV0Y0YVcxMWJVNTFiV0psY2s5bVJHbGpaU2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR0YyWVdsc1lXSnNaVU5sYkd4eklEMGdkR2hwY3k1ZlkyOXRjSFYwWlVGMllXbHNZV0pzWlVObGJHeHpLRzFoZUN3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcE8xeHVYRzRnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWkdsbElHOW1JR1JwWTJWVWIweGhlVzkxZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjbUZ1Wkc5dFNXNWtaWGdnUFNCTllYUm9MbVpzYjI5eUtFMWhkR2d1Y21GdVpHOXRLQ2tnS2lCaGRtRnBiR0ZpYkdWRFpXeHNjeTVzWlc1bmRHZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY21GdVpHOXRRMlZzYkNBOUlHRjJZV2xzWVdKc1pVTmxiR3h6VzNKaGJtUnZiVWx1WkdWNFhUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdGMllXbHNZV0pzWlVObGJHeHpMbk53YkdsalpTaHlZVzVrYjIxSmJtUmxlQ3dnTVNrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpTNWpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVYMjUxYldKbGNsUnZRMjl2Y21ScGJtRjBaWE1vY21GdVpHOXRRMlZzYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdVdWNtOTBZWFJwYjI0Z1BTQjBhR2x6TG5KdmRHRjBaU0EvSUUxaGRHZ3VjbTkxYm1Rb1RXRjBhQzV5WVc1a2IyMG9LU0FxSUVaVlRFeGZRMGxTUTB4RlgwbE9YMFJGUjFKRlJWTXBJRG9nYm5Wc2JEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sTG5CMWMyZ29aR2xsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJRjlrYVdObExuTmxkQ2gwYUdsekxDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTazdYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52YlhCMWRHVWdZU0JzYVhOMElIZHBkR2dnWVhaaGFXeGhZbXhsSUdObGJHeHpJSFJ2SUhCc1lXTmxJR1JwWTJVZ2IyNHVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JXRjRJQzBnVkdobElHNTFiV0psY2lCbGJYQjBlU0JqWld4c2N5QjBieUJqYjIxd2RYUmxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdSR2xsVzExOUlHRnNjbVZoWkhsTVlYbHZkWFJFYVdObElDMGdRU0JzYVhOMElIZHBkR2dnWkdsalpTQjBhR0YwSUdoaGRtVWdZV3h5WldGa2VTQmlaV1Z1SUd4aGVXOTFkQzVjYmlBZ0lDQWdLaUJjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPVlcxaVpYSmJYWDBnVkdobElHeHBjM1FnYjJZZ1lYWmhhV3hoWW14bElHTmxiR3h6SUhKbGNISmxjMlZ1ZEdWa0lHSjVJSFJvWldseUlHNTFiV0psY2k1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqYjIxd2RYUmxRWFpoYVd4aFlteGxRMlZzYkhNb2JXRjRMQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JoZG1GcGJHRmliR1VnUFNCdVpYY2dVMlYwS0NrN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JzWlhabGJDQTlJREE3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzFoZUV4bGRtVnNJRDBnVFdGMGFDNXRhVzRvZEdocGN5NWZjbTkzY3l3Z2RHaHBjeTVmWTI5c2N5azdYRzVjYmlBZ0lDQWdJQ0FnZDJocGJHVWdLR0YyWVdsc1lXSnNaUzV6YVhwbElEd2diV0Y0SUNZbUlHeGxkbVZzSUR3Z2JXRjRUR1YyWld3cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1kyVnNiQ0J2WmlCMGFHbHpMbDlqWld4c2MwOXVUR1YyWld3b2JHVjJaV3dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFZ1WkdWbWFXNWxaQ0FoUFQwZ1kyVnNiQ0FtSmlCMGFHbHpMbDlqWld4c1NYTkZiWEIwZVNoalpXeHNMQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWFpoYVd4aFlteGxMbUZrWkNoalpXeHNLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHeGxkbVZzS3lzN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdRWEp5WVhrdVpuSnZiU2hoZG1GcGJHRmliR1VwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOaGJHTjFiR0YwWlNCaGJHd2dZMlZzYkhNZ2IyNGdiR1YyWld3Z1puSnZiU0IwYUdVZ1kyVnVkR1Z5SUc5bUlIUm9aU0JzWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JHVjJaV3dnTFNCVWFHVWdiR1YyWld3Z1puSnZiU0IwYUdVZ1kyVnVkR1Z5SUc5bUlIUm9aU0JzWVhsdmRYUXVJREJjYmlBZ0lDQWdLaUJwYm1ScFkyRjBaWE1nZEdobElHTmxiblJsY2k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTFObGREeE9kVzFpWlhJK2ZTQjBhR1VnWTJWc2JITWdiMjRnZEdobElHeGxkbVZzSUdsdUlIUm9hWE1nYkdGNWIzVjBJSEpsY0hKbGMyVnVkR1ZrSUdKNVhHNGdJQ0FnSUNvZ2RHaGxhWElnYm5WdFltVnlMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTmxiR3h6VDI1TVpYWmxiQ2hzWlhabGJDa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpaV3hzY3lBOUlHNWxkeUJUWlhRb0tUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyVnVkR1Z5SUQwZ2RHaHBjeTVmWTJWdWRHVnlPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRDA5UFNCc1pYWmxiQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMlZzYkhNdVlXUmtLSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWhqWlc1MFpYSXBLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElISnZkeUE5SUdObGJuUmxjaTV5YjNjZ0xTQnNaWFpsYkRzZ2NtOTNJRHc5SUdObGJuUmxjaTV5YjNjZ0t5QnNaWFpsYkRzZ2NtOTNLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2NzSUdOdmJEb2dZMlZ1ZEdWeUxtTnZiQ0F0SUd4bGRtVnNmU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkeXdnWTI5c09pQmpaVzUwWlhJdVkyOXNJQ3NnYkdWMlpXeDlLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElHTnZiQ0E5SUdObGJuUmxjaTVqYjJ3Z0xTQnNaWFpsYkNBcklERTdJR052YkNBOElHTmxiblJsY2k1amIyd2dLeUJzWlhabGJEc2dZMjlzS3lzcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpaV3hzY3k1aFpHUW9kR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHR5YjNjNklHTmxiblJsY2k1eWIzY2dMU0JzWlhabGJDd2dZMjlzZlNrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTmxiR3h6TG1Ga1pDaDBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lM0p2ZHpvZ1kyVnVkR1Z5TG5KdmR5QXJJR3hsZG1Wc0xDQmpiMng5S1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1kyVnNiSE03WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QmpaV3hzSUdOdmJuUmhhVzRnWVNCalpXeHNJR1p5YjIwZ1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVL1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnWTJWc2JDQXRJRUVnWTJWc2JDQnBiaUJzWVhsdmRYUWdjbVZ3Y21WelpXNTBaV1FnWW5rZ1lTQnVkVzFpWlhJdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0RWFXVmJYWDBnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlVnTFNCQklHeHBjM1FnYjJZZ1pHbGpaU0IwYUdGMElHaGhkbVVnWVd4eVpXRmtlU0JpWldWdUlHeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBKdmIyeGxZVzU5SUZSeWRXVWdhV1lnWTJWc2JDQmtiMlZ6SUc1dmRDQmpiMjUwWVdsdUlHRWdaR2xsTGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk5sYkd4SmMwVnRjSFI1S0dObGJHd3NJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxYm1SbFptbHVaV1FnUFQwOUlHRnNjbVZoWkhsTVlYbHZkWFJFYVdObExtWnBibVFvWkdsbElEMCtJR05sYkd3Z1BUMDlJSFJvYVhNdVgyTnZiM0prYVc1aGRHVnpWRzlPZFcxaVpYSW9aR2xsTG1OdmIzSmthVzVoZEdWektTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJRzUxYldKbGNpQjBieUJoSUdObGJHd2dLSEp2ZHl3Z1kyOXNLVnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHNGdMU0JVYUdVZ2JuVnRZbVZ5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR05sYkd4Y2JpQWdJQ0FnS2lCQWNtVjBkWEp1Y3lCN1QySnFaV04wZlNCU1pYUjFjbTRnZEdobElHTmxiR3dnS0h0eWIzY3NJR052YkgwcElHTnZjbkpsYzNCdmJtUnBibWNnYmk1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjl1ZFcxaVpYSlViME5sYkd3b2Jpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdlM0p2ZHpvZ1RXRjBhQzUwY25WdVl5aHVJQzhnZEdocGN5NWZZMjlzY3lrc0lHTnZiRG9nYmlBbElIUm9hWE11WDJOdmJITjlPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdZU0JqWld4c0lIUnZJR0VnYm5WdFltVnlYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1kyVnNiQ0F0SUZSb1pTQmpaV3hzSUhSdklHTnZiblpsY25RZ2RHOGdhWFJ6SUc1MWJXSmxjaTVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPZFcxaVpYSjhkVzVrWldacGJtVmtmU0JVYUdVZ2JuVnRZbVZ5SUdOdmNuSmxjM0J2Ym1ScGJtY2dkRzhnZEdobElHTmxiR3d1WEc0Z0lDQWdJQ29nVW1WMGRYSnVjeUIxYm1SbFptbHVaV1FnZDJobGJpQjBhR1VnWTJWc2JDQnBjeUJ1YjNRZ2IyNGdkR2hsSUd4aGVXOTFkRnh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTmxiR3hVYjA1MWJXSmxjaWg3Y205M0xDQmpiMng5S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUR3OUlISnZkeUFtSmlCeWIzY2dQQ0IwYUdsekxsOXliM2R6SUNZbUlEQWdQRDBnWTI5c0lDWW1JR052YkNBOElIUm9hWE11WDJOdmJITXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCeWIzY2dLaUIwYUdsekxsOWpiMnh6SUNzZ1kyOXNPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxYm1SbFptbHVaV1E3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTI5dWRtVnlkQ0JoSUdObGJHd2djbVZ3Y21WelpXNTBaV1FnWW5rZ2FYUnpJRzUxYldKbGNpQjBieUIwYUdWcGNpQmpiMjl5WkdsdVlYUmxjeTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQnVJQzBnVkdobElHNTFiV0psY2lCeVpYQnlaWE5sYm5ScGJtY2dZU0JqWld4c1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0UFltcGxZM1I5SUZSb1pTQmpiMjl5WkdsdVlYUmxjeUJqYjNKeVpYTndiMjVrYVc1bklIUnZJSFJvWlNCalpXeHNJSEpsY0hKbGMyVnVkR1ZrSUdKNVhHNGdJQ0FnSUNvZ2RHaHBjeUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZmJuVnRZbVZ5Vkc5RGIyOXlaR2x1WVhSbGN5aHVLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxsOWpaV3hzVkc5RGIyOXlaSE1vZEdocGN5NWZiblZ0WW1WeVZHOURaV3hzS0c0cEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdjR0ZwY2lCdlppQmpiMjl5WkdsdVlYUmxjeUIwYnlCaElHNTFiV0psY2k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JqYjI5eVpITWdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdkRzhnWTI5dWRtVnlkRnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZIVnVaR1ZtYVc1bFpIMGdWR2hsSUdOdmIzSmthVzVoZEdWeklHTnZiblpsY25SbFpDQjBieUJoSUc1MWJXSmxjaTRnU1daY2JpQWdJQ0FnS2lCMGFHVWdZMjl2Y21ScGJtRjBaWE1nWVhKbElHNXZkQ0J2YmlCMGFHbHpJR3hoZVc5MWRDd2dkR2hsSUc1MWJXSmxjaUJwY3lCMWJtUmxabWx1WldRdVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTI5dmNtUnBibUYwWlhOVWIwNTFiV0psY2loamIyOXlaSE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYmlBOUlIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDBhR2x6TGw5amIyOXlaSE5VYjBObGJHd29ZMjl2Y21SektTazdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lEdzlJRzRnSmlZZ2JpQThJSFJvYVhNdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc0N1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRibUZ3SUNoNExIa3BJSFJ2SUhSb1pTQmpiRzl6WlhOMElHTmxiR3dnYVc0Z2RHaHBjeUJNWVhsdmRYUXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1pHbGxZMjl2Y21ScGJtRjBaU0F0SUZSb1pTQmpiMjl5WkdsdVlYUmxJSFJ2SUdacGJtUWdkR2hsSUdOc2IzTmxjM1FnWTJWc2JGeHVJQ0FnSUNBcUlHWnZjaTVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMFJwWlgwZ1cyUnBaV052YjNKa2FXNWhkQzVrYVdVZ1BTQnVkV3hzWFNBdElGUm9aU0JrYVdVZ2RHOGdjMjVoY0NCMGJ5NWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ1pHbGxZMjl2Y21ScGJtRjBaUzU0SUMwZ1ZHaGxJSGd0WTI5dmNtUnBibUYwWlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnWkdsbFkyOXZjbVJwYm1GMFpTNTVJQzBnVkdobElIa3RZMjl2Y21ScGJtRjBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDlpYW1WamRIeHVkV3hzZlNCVWFHVWdZMjl2Y21ScGJtRjBaU0J2WmlCMGFHVWdZMlZzYkNCamJHOXpaWE4wSUhSdklDaDRMQ0I1S1M1Y2JpQWdJQ0FnS2lCT2RXeHNJSGRvWlc0Z2JtOGdjM1ZwZEdGaWJHVWdZMlZzYkNCcGN5QnVaV0Z5SUNoNExDQjVLVnh1SUNBZ0lDQXFMMXh1SUNBZ0lITnVZWEJVYnloN1pHbGxJRDBnYm5Wc2JDd2dlQ3dnZVgwcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyOXlibVZ5UTJWc2JDQTlJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISnZkem9nVFdGMGFDNTBjblZ1WXloNUlDOGdkR2hwY3k1a2FXVlRhWHBsS1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1RXRjBhQzUwY25WdVl5aDRJQzhnZEdocGN5NWthV1ZUYVhwbEtWeHVJQ0FnSUNBZ0lDQjlPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR052Y201bGNpQTlJSFJvYVhNdVgyTmxiR3hVYjBOdmIzSmtjeWhqYjNKdVpYSkRaV3hzS1R0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZDJsa2RHaEpiaUE5SUdOdmNtNWxjaTU0SUNzZ2RHaHBjeTVrYVdWVGFYcGxJQzBnZUR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZDJsa2RHaFBkWFFnUFNCMGFHbHpMbVJwWlZOcGVtVWdMU0IzYVdSMGFFbHVPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQm9aV2xuYUhSSmJpQTlJR052Y201bGNpNTVJQ3NnZEdocGN5NWthV1ZUYVhwbElDMGdlVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhR1ZwWjJoMFQzVjBJRDBnZEdocGN5NWthV1ZUYVhwbElDMGdhR1ZwWjJoMFNXNDdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjWFZoWkhKaGJuUnpJRDBnVzN0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEU2SUhSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loamIzSnVaWEpEWld4c0tTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmRtVnlZV2RsT2lCM2FXUjBhRWx1SUNvZ2FHVnBaMmgwU1c1Y2JpQWdJQ0FnSUNBZ2ZTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NUb2dkR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNjNklHTnZjbTVsY2tObGJHd3VjbTkzTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJEb2dZMjl5Ym1WeVEyVnNiQzVqYjJ3Z0t5QXhYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmRtVnlZV2RsT2lCM2FXUjBhRTkxZENBcUlHaGxhV2RvZEVsdVhHNGdJQ0FnSUNBZ0lIMHNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQmpiM0p1WlhKRFpXeHNMbkp2ZHlBcklERXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlzT2lCamIzSnVaWEpEWld4c0xtTnZiRnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIzWmxjbUZuWlRvZ2QybGtkR2hKYmlBcUlHaGxhV2RvZEU5MWRGeHVJQ0FnSUNBZ0lDQjlMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnhPaUIwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dZMjl5Ym1WeVEyVnNiQzV5YjNjZ0t5QXhMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052YkRvZ1kyOXlibVZ5UTJWc2JDNWpiMndnS3lBeFhHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZG1WeVlXZGxPaUIzYVdSMGFFOTFkQ0FxSUdobGFXZG9kRTkxZEZ4dUlDQWdJQ0FnSUNCOVhUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnpibUZ3Vkc4Z1BTQnhkV0ZrY21GdWRITmNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHTmxiR3dnYzJodmRXeGtJR0psSUc5dUlIUm9aU0JzWVhsdmRYUmNiaUFnSUNBZ0lDQWdJQ0FnSUM1bWFXeDBaWElvS0hGMVlXUnlZVzUwS1NBOVBpQjFibVJsWm1sdVpXUWdJVDA5SUhGMVlXUnlZVzUwTG5FcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCalpXeHNJSE5vYjNWc1pDQmlaU0J1YjNRZ1lXeHlaV0ZrZVNCMFlXdGxiaUJsZUdObGNIUWdZbmtnYVhSelpXeG1YRzRnSUNBZ0lDQWdJQ0FnSUNBdVptbHNkR1Z5S0NoeGRXRmtjbUZ1ZENrZ1BUNGdLRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRzUxYkd3Z0lUMDlJR1JwWlNBbUppQjBhR2x6TGw5amIyOXlaR2x1WVhSbGMxUnZUblZ0WW1WeUtHUnBaUzVqYjI5eVpHbHVZWFJsY3lrZ1BUMDlJSEYxWVdSeVlXNTBMbkVwWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZkh3Z2RHaHBjeTVmWTJWc2JFbHpSVzF3ZEhrb2NYVmhaSEpoYm5RdWNTd2dYMlJwWTJVdVoyVjBLSFJvYVhNcEtTbGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHTmxiR3dnYzJodmRXeGtJR0psSUdOdmRtVnlaV1FnWW5rZ2RHaGxJR1JwWlNCMGFHVWdiVzl6ZEZ4dUlDQWdJQ0FnSUNBZ0lDQWdMbkpsWkhWalpTaGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQW9iV0Y0VVN3Z2NYVmhaSEpoYm5RcElEMCtJSEYxWVdSeVlXNTBMbU52ZG1WeVlXZGxJRDRnYldGNFVTNWpiM1psY21GblpTQS9JSEYxWVdSeVlXNTBJRG9nYldGNFVTeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjdjVG9nZFc1a1pXWnBibVZrTENCamIzWmxjbUZuWlRvZ0xURjlYRzRnSUNBZ0lDQWdJQ0FnSUNBcE8xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUWdJVDA5SUhOdVlYQlVieTV4SUQ4Z2RHaHBjeTVmYm5WdFltVnlWRzlEYjI5eVpHbHVZWFJsY3loemJtRndWRzh1Y1NrZ09pQnVkV3hzTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVkbGRDQjBhR1VnWkdsbElHRjBJSEJ2YVc1MElDaDRMQ0I1S1R0Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VUc5cGJuUjlJSEJ2YVc1MElDMGdWR2hsSUhCdmFXNTBJR2x1SUNoNExDQjVLU0JqYjI5eVpHbHVZWFJsYzF4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBScFpYeHVkV3hzZlNCVWFHVWdaR2xsSUhWdVpHVnlJR052YjNKa2FXNWhkR1Z6SUNoNExDQjVLU0J2Y2lCdWRXeHNJR2xtSUc1dklHUnBaVnh1SUNBZ0lDQXFJR2x6SUdGMElIUm9aU0J3YjJsdWRDNWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUkJkQ2h3YjJsdWRDQTlJSHQ0T2lBd0xDQjVPaUF3ZlNrZ2UxeHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR1JwWlNCdlppQmZaR2xqWlM1blpYUW9kR2hwY3lrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSHQ0TENCNWZTQTlJR1JwWlM1amIyOXlaR2x1WVhSbGN6dGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZUVacGRDQTlJSGdnUEQwZ2NHOXBiblF1ZUNBbUppQndiMmx1ZEM1NElEdzlJSGdnS3lCMGFHbHpMbVJwWlZOcGVtVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I1Um1sMElEMGdlU0E4UFNCd2IybHVkQzU1SUNZbUlIQnZhVzUwTG5rZ1BEMGdlU0FySUhSb2FYTXVaR2xsVTJsNlpUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSGhHYVhRZ0ppWWdlVVpwZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCa2FXVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiblZzYkR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRFlXeGpkV3hoZEdVZ2RHaGxJR2R5YVdRZ2MybDZaU0JuYVhabGJpQjNhV1IwYUNCaGJtUWdhR1ZwWjJoMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUhkcFpIUm9JQzBnVkdobElHMXBibWx0WVd3Z2QybGtkR2hjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDUxYldKbGNuMGdhR1ZwWjJoMElDMGdWR2hsSUcxcGJtbHRZV3dnYUdWcFoyaDBYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5allXeGpkV3hoZEdWSGNtbGtLSGRwWkhSb0xDQm9aV2xuYUhRcElIdGNiaUFnSUNBZ0lDQWdYMk52YkhNdWMyVjBLSFJvYVhNc0lFMWhkR2d1Wm14dmIzSW9kMmxrZEdnZ0x5QjBhR2x6TG1ScFpWTnBlbVVwS1R0Y2JpQWdJQ0FnSUNBZ1gzSnZkM011YzJWMEtIUm9hWE1zSUUxaGRHZ3VabXh2YjNJb2FHVnBaMmgwSUM4Z2RHaHBjeTVrYVdWVGFYcGxLU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTI5dWRtVnlkQ0JoSUNoeWIzY3NJR052YkNrZ1kyVnNiQ0IwYnlBb2VDd2dlU2tnWTI5dmNtUnBibUYwWlhNdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnWTJWc2JDQXRJRlJvWlNCalpXeHNJSFJ2SUdOdmJuWmxjblFnZEc4Z1kyOXZjbVJwYm1GMFpYTmNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklHTnZiM0prYVc1aGRHVnpMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1gyTmxiR3hVYjBOdmIzSmtjeWg3Y205M0xDQmpiMng5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCN2VEb2dZMjlzSUNvZ2RHaHBjeTVrYVdWVGFYcGxMQ0I1T2lCeWIzY2dLaUIwYUdsekxtUnBaVk5wZW1WOU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ0tIZ3NJSGtwSUdOdmIzSmthVzVoZEdWeklIUnZJR0VnS0hKdmR5d2dZMjlzS1NCalpXeHNMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFBZbXBsWTNSOUlHTnZiM0prYVc1aGRHVnpJQzBnVkdobElHTnZiM0prYVc1aGRHVnpJSFJ2SUdOdmJuWmxjblFnZEc4Z1lTQmpaV3hzTGx4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA5aWFtVmpkSDBnVkdobElHTnZjbkpsYzNCdmJtUnBibWNnWTJWc2JGeHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJOdmIzSmtjMVJ2UTJWc2JDaDdlQ3dnZVgwcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKdmR6b2dUV0YwYUM1MGNuVnVZeWg1SUM4Z2RHaHBjeTVrYVdWVGFYcGxLU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nVFdGMGFDNTBjblZ1WXloNElDOGdkR2hwY3k1a2FXVlRhWHBsS1Z4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1WNGNHOXlkQ0I3UjNKcFpFeGhlVzkxZEgwN1hHNGlMQ0l2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dVhHNHZLaXBjYmlBcUlFQnRiMlIxYkdVZ2JXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6WEc0Z0tpOWNibHh1THlwY2JpQXFJRU52Ym5abGNuUWdZVzRnU0ZSTlRDQmhkSFJ5YVdKMWRHVWdkRzhnWVc0Z2FXNXpkR0Z1WTJVbmN5QndjbTl3WlhKMGVTNGdYRzRnS2x4dUlDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHNWhiV1VnTFNCVWFHVWdZWFIwY21saWRYUmxKM01nYm1GdFpWeHVJQ29nUUhKbGRIVnliaUI3VTNSeWFXNW5mU0JVYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ3Y205d1pYSjBlU2R6SUc1aGJXVXVJRVp2Y2lCbGVHRnRjR3hsTENCY0ltMTVMV0YwZEhKY0lseHVJQ29nZDJsc2JDQmlaU0JqYjI1MlpYSjBaV1FnZEc4Z1hDSnRlVUYwZEhKY0lpd2dZVzVrSUZ3aVpHbHpZV0pzWldSY0lpQjBieUJjSW1ScGMyRmliR1ZrWENJdVhHNGdLaTljYm1OdmJuTjBJR0YwZEhKcFluVjBaVEp3Y205d1pYSjBlU0E5SUNodVlXMWxLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdXMlpwY25OMExDQXVMaTV5WlhOMFhTQTlJRzVoYldVdWMzQnNhWFFvWENJdFhDSXBPMXh1SUNBZ0lISmxkSFZ5YmlCbWFYSnpkQ0FySUhKbGMzUXViV0Z3S0hkdmNtUWdQVDRnZDI5eVpDNXpiR2xqWlNnd0xDQXhLUzUwYjFWd2NHVnlRMkZ6WlNncElDc2dkMjl5WkM1emJHbGpaU2d4S1NrdWFtOXBiaWdwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJOYVhocGJpQjdRR3hwYm1zZ2JXOWtkV3hsT20xcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzVTWldGa1QyNXNlVUYwZEhKcFluVjBaWE45SUhSdklHRWdZMnhoYzNNdVhHNGdLbHh1SUNvZ1FIQmhjbUZ0SUhzcWZTQlRkWEFnTFNCVWFHVWdZMnhoYzNNZ2RHOGdiV2w0SUdsdWRHOHVYRzRnS2lCQWNtVjBkWEp1SUh0dGIyUjFiR1U2YldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmbEpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnVkdobElHMXBlR1ZrTFdsdUlHTnNZWE56WEc0Z0tpOWNibU52Ym5OMElGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5QTlJQ2hUZFhBcElEMCtYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dUV2w0YVc0Z2RHOGdiV0ZyWlNCaGJHd2dZWFIwY21saWRYUmxjeUJ2YmlCaElHTjFjM1J2YlNCSVZFMU1SV3hsYldWdWRDQnlaV0ZrTFc5dWJIa2dhVzRnZEdobElITmxibk5sWEc0Z0lDQWdJQ29nZEdoaGRDQjNhR1Z1SUhSb1pTQmhkSFJ5YVdKMWRHVWdaMlYwY3lCaElHNWxkeUIyWVd4MVpTQjBhR0YwSUdScFptWmxjbk1nWm5KdmJTQjBhR1VnZG1Gc2RXVWdiMllnZEdobFhHNGdJQ0FnSUNvZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ3Y205d1pYSjBlU3dnYVhRZ2FYTWdjbVZ6WlhRZ2RHOGdkR2hoZENCd2NtOXdaWEowZVNkeklIWmhiSFZsTGlCVWFHVmNiaUFnSUNBZ0tpQmhjM04xYlhCMGFXOXVJR2x6SUhSb1lYUWdZWFIwY21saWRYUmxJRndpYlhrdFlYUjBjbWxpZFhSbFhDSWdZMjl5Y21WemNHOXVaSE1nZDJsMGFDQndjbTl3WlhKMGVTQmNJblJvYVhNdWJYbEJkSFJ5YVdKMWRHVmNJaTVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMnhoYzNOOUlGTjFjQ0F0SUZSb1pTQmpiR0Z6Y3lCMGJ5QnRhWGhwYmlCMGFHbHpJRkpsWVdSUGJteDVRWFIwY21saWRYUmxjeTVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRTWldGa1QyNXNlVUYwZEhKcFluVjBaWE45SUZSb1pTQnRhWGhsWkNCcGJpQmpiR0Z6Y3k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCdGFYaHBibHh1SUNBZ0lDQXFJRUJoYkdsaGN5QnRiMlIxYkdVNmJXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6ZmxKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzF4dUlDQWdJQ0FxTDF4dUlDQWdJR05zWVhOeklHVjRkR1Z1WkhNZ1UzVndJSHRjYmx4dUlDQWdJQ0FnSUNBdktpcGNiaUFnSUNBZ0lDQWdJQ29nUTJGc2JHSmhZMnNnZEdoaGRDQnBjeUJsZUdWamRYUmxaQ0IzYUdWdUlHRnVJRzlpYzJWeWRtVmtJR0YwZEhKcFluVjBaU2R6SUhaaGJIVmxJR2x6WEc0Z0lDQWdJQ0FnSUNBcUlHTm9ZVzVuWldRdUlFbG1JSFJvWlNCSVZFMU1SV3hsYldWdWRDQnBjeUJqYjI1dVpXTjBaV1FnZEc4Z2RHaGxJRVJQVFN3Z2RHaGxJR0YwZEhKcFluVjBaVnh1SUNBZ0lDQWdJQ0FnS2lCMllXeDFaU0JqWVc0Z2IyNXNlU0JpWlNCelpYUWdkRzhnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnU0ZSTlRFVnNaVzFsYm5RbmN5QndjbTl3WlhKMGVTNWNiaUFnSUNBZ0lDQWdJQ29nU1c0Z1pXWm1aV04wTENCMGFHbHpJRzFoYTJWeklIUm9hWE1nU0ZSTlRFVnNaVzFsYm5RbmN5QmhkSFJ5YVdKMWRHVnpJSEpsWVdRdGIyNXNlUzVjYmlBZ0lDQWdJQ0FnSUNwY2JpQWdJQ0FnSUNBZ0lDb2dSbTl5SUdWNFlXMXdiR1VzSUdsbUlHRnVJRWhVVFV4RmJHVnRaVzUwSUdoaGN5QmhiaUJoZEhSeWFXSjFkR1VnWENKNFhDSWdZVzVrWEc0Z0lDQWdJQ0FnSUNBcUlHTnZjbkpsYzNCdmJtUnBibWNnY0hKdmNHVnlkSGtnWENKNFhDSXNJSFJvWlc0Z1kyaGhibWRwYm1jZ2RHaGxJSFpoYkhWbElGd2llRndpSUhSdklGd2lOVndpWEc0Z0lDQWdJQ0FnSUNBcUlIZHBiR3dnYjI1c2VTQjNiM0pySUhkb1pXNGdZSFJvYVhNdWVDQTlQVDBnTldBdVhHNGdJQ0FnSUNBZ0lDQXFYRzRnSUNBZ0lDQWdJQ0FxSUVCd1lYSmhiU0I3VTNSeWFXNW5mU0J1WVcxbElDMGdWR2hsSUdGMGRISnBZblYwWlNkeklHNWhiV1V1WEc0Z0lDQWdJQ0FnSUNBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdmJHUldZV3gxWlNBdElGUm9aU0JoZEhSeWFXSjFkR1VuY3lCdmJHUWdkbUZzZFdVdVhHNGdJQ0FnSUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVaWGRXWVd4MVpTQXRJRlJvWlNCaGRIUnlhV0oxZEdVbmN5QnVaWGNnZG1Gc2RXVXVYRzRnSUNBZ0lDQWdJQ0FxTDF4dUlDQWdJQ0FnSUNCaGRIUnlhV0oxZEdWRGFHRnVaMlZrUTJGc2JHSmhZMnNvYm1GdFpTd2diMnhrVm1Gc2RXVXNJRzVsZDFaaGJIVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJCYkd3Z1lYUjBjbWxpZFhSbGN5QmhjbVVnYldGa1pTQnlaV0ZrTFc5dWJIa2dkRzhnY0hKbGRtVnVkQ0JqYUdWaGRHbHVaeUJpZVNCamFHRnVaMmx1WjF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnZEdobElHRjBkSEpwWW5WMFpTQjJZV3gxWlhNdUlFOW1JR052ZFhKelpTd2dkR2hwY3lCcGN5QmllU0J1YjF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnWjNWaGNtRnVkR1ZsSUhSb1lYUWdkWE5sY25NZ2QybHNiQ0J1YjNRZ1kyaGxZWFFnYVc0Z1lTQmthV1ptWlhKbGJuUWdkMkY1TGx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NISnZjR1Z5ZEhrZ1BTQmhkSFJ5YVdKMWRHVXljSEp2Y0dWeWRIa29ibUZ0WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTVqYjI1dVpXTjBaV1FnSmlZZ2JtVjNWbUZzZFdVZ0lUMDlJR0FrZTNSb2FYTmJjSEp2Y0dWeWRIbGRmV0FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNodVlXMWxMQ0IwYUdselczQnliM0JsY25SNVhTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOU8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMxeHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1WTI5dWMzUWdWbUZzYVdSaGRHbHZia1Z5Y205eUlEMGdZMnhoYzNNZ1pYaDBaVzVrY3lCRmNuSnZjaUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYlhObktTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtHMXpaeWs3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCV1lXeHBaR0YwYVc5dVJYSnliM0pjYm4wN1hHNGlMQ0l2S2lvZ1hHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGtnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaUJBYVdkdWIzSmxYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZtRnNhV1JoZEdsdmJrVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlXWVd4cFpHRjBhVzl1UlhKeWIzSXVhbk5jSWp0Y2JseHVZMjl1YzNRZ1gzWmhiSFZsSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlrWldaaGRXeDBWbUZzZFdVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJWeWNtOXljeUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYm1OdmJuTjBJRlI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2UzWmhiSFZsTENCa1pXWmhkV3gwVm1Gc2RXVXNJR1Z5Y205eWN5QTlJRnRkZlNrZ2UxeHVJQ0FnSUNBZ0lDQmZkbUZzZFdVdWMyVjBLSFJvYVhNc0lIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ1gyUmxabUYxYkhSV1lXeDFaUzV6WlhRb2RHaHBjeXdnWkdWbVlYVnNkRlpoYkhWbEtUdGNiaUFnSUNBZ0lDQWdYMlZ5Y205eWN5NXpaWFFvZEdocGN5d2daWEp5YjNKektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCblpYUWdiM0pwWjJsdUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM1poYkhWbExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCblpYUWdkbUZzZFdVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1selZtRnNhV1FnUHlCMGFHbHpMbTl5YVdkcGJpQTZJRjlrWldaaGRXeDBWbUZzZFdVdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdkbGRDQmxjbkp2Y25Nb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZaWEp5YjNKekxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCblpYUWdhWE5XWVd4cFpDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJREFnUGowZ2RHaHBjeTVsY25KdmNuTXViR1Z1WjNSb08xeHVJQ0FnSUgxY2JseHVJQ0FnSUdSbFptRjFiSFJVYnlodVpYZEVaV1poZFd4MEtTQjdYRzRnSUNBZ0lDQWdJRjlrWldaaGRXeDBWbUZzZFdVdWMyVjBLSFJvYVhNc0lHNWxkMFJsWm1GMWJIUXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JmWTJobFkyc29lM0J5WldScFkyRjBaU3dnWW1sdVpGWmhjbWxoWW14bGN5QTlJRnRkTENCRmNuSnZjbFI1Y0dVZ1BTQldZV3hwWkdGMGFXOXVSWEp5YjNKOUtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElIQnliM0J2YzJsMGFXOXVJRDBnY0hKbFpHbGpZWFJsTG1Gd2NHeDVLSFJvYVhNc0lHSnBibVJXWVhKcFlXSnNaWE1wTzF4dUlDQWdJQ0FnSUNCcFppQW9JWEJ5YjNCdmMybDBhVzl1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y2lBOUlHNWxkeUJGY25KdmNsUjVjR1VvZEdocGN5NTJZV3gxWlN3Z1ltbHVaRlpoY21saFlteGxjeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMMk52Ym5OdmJHVXVkMkZ5YmlobGNuSnZjaTUwYjFOMGNtbHVaeWdwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpYSnliM0p6TG5CMWMyZ29aWEp5YjNJcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlVlWEJsVm1Gc2FXUmhkRzl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxWmhiR2xrWVhScGIyNUZjbkp2Y24wZ1puSnZiU0JjSWk0dlZtRnNhV1JoZEdsdmJrVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRkJoY25ObFJYSnliM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRlpoYkdsa1lYUnBiMjVGY25KdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9iWE5uS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0cxelp5azdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JRWVhKelpVVnljbTl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxWmhiR2xrWVhScGIyNUZjbkp2Y24wZ1puSnZiU0JjSWk0dlZtRnNhV1JoZEdsdmJrVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRWx1ZG1Gc2FXUlVlWEJsUlhKeWIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGWmhiR2xrWVhScGIyNUZjbkp2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2JYTm5LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLRzF6WnlrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQkpiblpoYkdsa1ZIbHdaVVZ5Y205eVhHNTlPMXh1SWl3aUx5b3FJRnh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNUlFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzVwYlhCdmNuUWdlMVI1Y0dWV1lXeHBaR0YwYjNKOUlHWnliMjBnWENJdUwxUjVjR1ZXWVd4cFpHRjBiM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdVR0Z5YzJWRmNuSnZjbjBnWm5KdmJTQmNJaTR2WlhKeWIzSXZVR0Z5YzJWRmNuSnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdEpiblpoYkdsa1ZIbHdaVVZ5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5SmJuWmhiR2xrVkhsd1pVVnljbTl5TG1welhDSTdYRzVjYm1OdmJuTjBJRWxPVkVWSFJWSmZSRVZHUVZWTVZGOVdRVXhWUlNBOUlEQTdYRzVqYjI1emRDQkpiblJsWjJWeVZIbHdaVlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJR1Y0ZEdWdVpITWdWSGx3WlZaaGJHbGtZWFJ2Y2lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdTVTVVUlVkRlVsOUVSVVpCVlV4VVgxWkJURlZGTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrWldaaGRXeDBWbUZzZFdVZ1BTQkpUbFJGUjBWU1gwUkZSa0ZWVEZSZlZrRk1WVVU3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1Z5Y205eWN5QTlJRnRkTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2hPZFcxaVpYSXVhWE5KYm5SbFoyVnlLR2x1Y0hWMEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RtRnNkV1VnUFNCcGJuQjFkRHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNoY0luTjBjbWx1WjF3aUlEMDlQU0IwZVhCbGIyWWdhVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJoY25ObFpGWmhiSFZsSUQwZ2NHRnljMlZKYm5Rb2FXNXdkWFFzSURFd0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaE9kVzFpWlhJdWFYTkpiblJsWjJWeUtIQmhjbk5sWkZaaGJIVmxLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnY0dGeWMyVmtWbUZzZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1Z5Y205eWN5NXdkWE5vS0c1bGR5QlFZWEp6WlVWeWNtOXlLR2x1Y0hWMEtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JsY25KdmNuTXVjSFZ6YUNodVpYY2dTVzUyWVd4cFpGUjVjR1ZGY25KdmNpaHBibkIxZENrcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9lM1poYkhWbExDQmtaV1poZFd4MFZtRnNkV1VzSUdWeWNtOXljMzBwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR3hoY21kbGNsUm9ZVzRvYmlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJobFkyc29lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NISmxaR2xqWVhSbE9pQW9iaWtnUFQ0Z2RHaHBjeTV2Y21sbmFXNGdQajBnYml4Y2JpQWdJQ0FnSUNBZ0lDQWdJR0pwYm1SV1lYSnBZV0pzWlhNNklGdHVYVnh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6YldGc2JHVnlWR2hoYmlodUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5amFHVmpheWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndjbVZrYVdOaGRHVTZJQ2h1S1NBOVBpQjBhR2x6TG05eWFXZHBiaUE4UFNCdUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnWW1sdVpGWmhjbWxoWW14bGN6b2dXMjVkWEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdKbGRIZGxaVzRvYml3Z2JTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyaGxZMnNvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjSEpsWkdsallYUmxPaUFvYml3Z2JTa2dQVDRnZEdocGN5NXNZWEpuWlhKVWFHRnVLRzRwSUNZbUlIUm9hWE11YzIxaGJHeGxjbFJvWVc0b2JTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCaWFXNWtWbUZ5YVdGaWJHVnpPaUJiYml3Z2JWMWNiaUFnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCSmJuUmxaMlZ5Vkhsd1pWWmhiR2xrWVhSdmNseHVmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9TQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHRVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOVVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzVwYlhCdmNuUWdlMGx1ZG1Gc2FXUlVlWEJsUlhKeWIzSjlJR1p5YjIwZ1hDSXVMMlZ5Y205eUwwbHVkbUZzYVdSVWVYQmxSWEp5YjNJdWFuTmNJanRjYmx4dVkyOXVjM1FnVTFSU1NVNUhYMFJGUmtGVlRGUmZWa0ZNVlVVZ1BTQmNJbHdpTzF4dVkyOXVjM1FnVTNSeWFXNW5WSGx3WlZaaGJHbGtZWFJ2Y2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nVkhsd1pWWmhiR2xrWVhSdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnVTFSU1NVNUhYMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdSbFptRjFiSFJXWVd4MVpTQTlJRk5VVWtsT1IxOUVSVVpCVlV4VVgxWkJURlZGTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JsY25KdmNuTWdQU0JiWFR0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvWENKemRISnBibWRjSWlBOVBUMGdkSGx3Wlc5bUlHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJR2x1Y0hWME8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhKeWIzSnpMbkIxYzJnb2JtVjNJRWx1ZG1Gc2FXUlVlWEJsUlhKeWIzSW9hVzV3ZFhRcEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLSHQyWVd4MVpTd2daR1ZtWVhWc2RGWmhiSFZsTENCbGNuSnZjbk45S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J1YjNSRmJYQjBlU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tDa2dQVDRnWENKY0lpQWhQVDBnZEdocGN5NXZjbWxuYVc1Y2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JUZEhKcGJtZFVlWEJsVm1Gc2FXUmhkRzl5WEc1OU8xeHVJaXdpTHlvcUlGeHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU1SUVoMWRXSWdaR1VnUW1WbGNseHVJQ3BjYmlBcUlGUm9hWE1nWm1sc1pTQnBjeUJ3WVhKMElHOW1JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdabkpsWlNCemIyWjBkMkZ5WlRvZ2VXOTFJR05oYmlCeVpXUnBjM1J5YVdKMWRHVWdhWFFnWVc1a0wyOXlJRzF2WkdsbWVTQnBkRnh1SUNvZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVWdZWE1nY0hWaWJHbHphR1ZrSUdKNVhHNGdLaUIwYUdVZ1JuSmxaU0JUYjJaMGQyRnlaU0JHYjNWdVpHRjBhVzl1TENCbGFYUm9aWElnZG1WeWMybHZiaUF6SUc5bUlIUm9aU0JNYVdObGJuTmxMQ0J2Y2lBb1lYUWdlVzkxY2x4dUlDb2diM0IwYVc5dUtTQmhibmtnYkdGMFpYSWdkbVZ5YzJsdmJpNWNiaUFxWEc0Z0tpQlVkMlZ1ZEhrdGIyNWxMWEJwY0hNZ2FYTWdaR2x6ZEhKcFluVjBaV1FnYVc0Z2RHaGxJR2h2Y0dVZ2RHaGhkQ0JwZENCM2FXeHNJR0psSUhWelpXWjFiQ3dnWW5WMFhHNGdLaUJYU1ZSSVQxVlVJRUZPV1NCWFFWSlNRVTVVV1RzZ2QybDBhRzkxZENCbGRtVnVJSFJvWlNCcGJYQnNhV1ZrSUhkaGNuSmhiblI1SUc5bUlFMUZVa05JUVU1VVFVSkpURWxVV1Z4dUlDb2diM0lnUmtsVVRrVlRVeUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVXVJQ0JUWldVZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTmNiaUFxSUV4cFkyVnVjMlVnWm05eUlHMXZjbVVnWkdWMFlXbHNjeTVjYmlBcVhHNGdLaUJaYjNVZ2MyaHZkV3hrSUdoaGRtVWdjbVZqWldsMlpXUWdZU0JqYjNCNUlHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlZjYmlBcUlHRnNiMjVuSUhkcGRHZ2dkSGRsYm5SNUxXOXVaUzF3YVhCekxpQWdTV1lnYm05MExDQnpaV1VnUEdoMGRIQTZMeTkzZDNjdVoyNTFMbTl5Wnk5c2FXTmxibk5sY3k4K0xseHVJQ29nUUdsbmJtOXlaVnh1SUNvdlhHNXBiWEJ2Y25RZ2UxUjVjR1ZXWVd4cFpHRjBiM0o5SUdaeWIyMGdYQ0l1TDFSNWNHVldZV3hwWkdGMGIzSXVhbk5jSWp0Y2JpOHZhVzF3YjNKMElIdFFZWEp6WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOVFZWEp6WlVWeWNtOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwbHVkbUZzYVdSVWVYQmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDBsdWRtRnNhV1JVZVhCbFJYSnliM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdRMDlNVDFKZlJFVkdRVlZNVkY5V1FVeFZSU0E5SUZ3aVlteGhZMnRjSWp0Y2JtTnZibk4wSUVOdmJHOXlWSGx3WlZaaGJHbGtZWFJ2Y2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nVkhsd1pWWmhiR2xrWVhSdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnUTA5TVQxSmZSRVZHUVZWTVZGOVdRVXhWUlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWkdWbVlYVnNkRlpoYkhWbElEMGdRMDlNVDFKZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaWEp5YjNKeklEMGdXMTA3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLRndpYzNSeWFXNW5YQ0lnUFQwOUlIUjVjR1Z2WmlCcGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkbUZzZFdVZ1BTQnBibkIxZER0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Z5Y205eWN5NXdkWE5vS0c1bGR5QkpiblpoYkdsa1ZIbHdaVVZ5Y205eUtHbHVjSFYwS1NrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J6ZFhCbGNpaDdkbUZzZFdVc0lHUmxabUYxYkhSV1lXeDFaU3dnWlhKeWIzSnpmU2s3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCRGIyeHZjbFI1Y0dWV1lXeHBaR0YwYjNKY2JuMDdYRzRpTENJdktpb2dYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRrZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNibWx0Y0c5eWRDQjdWSGx3WlZaaGJHbGtZWFJ2Y24wZ1puSnZiU0JjSWk0dlZIbHdaVlpoYkdsa1lYUnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdFFZWEp6WlVWeWNtOXlmU0JtY205dElGd2lMaTlsY25KdmNpOVFZWEp6WlVWeWNtOXlMbXB6WENJN1hHNXBiWEJ2Y25RZ2UwbHVkbUZzYVdSVWVYQmxSWEp5YjNKOUlHWnliMjBnWENJdUwyVnljbTl5TDBsdWRtRnNhV1JVZVhCbFJYSnliM0l1YW5OY0lqdGNibHh1WTI5dWMzUWdRazlQVEVWQlRsOUVSVVpCVlV4VVgxWkJURlZGSUQwZ1ptRnNjMlU3WEc1amIyNXpkQ0JDYjI5c1pXRnVWSGx3WlZaaGJHbGtZWFJ2Y2lBOUlHTnNZWE56SUdWNGRHVnVaSE1nVkhsd1pWWmhiR2xrWVhSdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9hVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnUWs5UFRFVkJUbDlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa1pXWmhkV3gwVm1Gc2RXVWdQU0JDVDA5TVJVRk9YMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNtOXljeUE5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNocGJuQjFkQ0JwYm5OMFlXNWpaVzltSUVKdmIyeGxZVzRwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFpoYkhWbElEMGdhVzV3ZFhRN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9YQ0p6ZEhKcGJtZGNJaUE5UFQwZ2RIbHdaVzltSUdsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvTDNSeWRXVXZhUzUwWlhOMEtHbHVjSFYwS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIWmhiSFZsSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9MMlpoYkhObEwya3VkR1Z6ZENocGJuQjFkQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaU0E5SUdaaGJITmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnVUdGeWMyVkZjbkp2Y2locGJuQjFkQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0p6TG5CMWMyZ29ibVYzSUVsdWRtRnNhV1JVZVhCbFJYSnliM0lvYVc1d2RYUXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lITjFjR1Z5S0h0MllXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbExDQmxjbkp2Y25OOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCcGMxUnlkV1VvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDZ3BJRDArSUhSeWRXVWdQVDA5SUhSb2FYTXViM0pwWjJsdVhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbHpSbUZzYzJVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5amFHVmpheWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndjbVZrYVdOaGRHVTZJQ2dwSUQwK0lHWmhiSE5sSUQwOVBTQjBhR2x6TG05eWFXZHBibHh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lFSnZiMnhsWVc1VWVYQmxWbUZzYVdSaGRHOXlYRzU5TzF4dUlpd2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1cGJYQnZjblFnZTBsdWRHVm5aWEpVZVhCbFZtRnNhV1JoZEc5eWZTQm1jbTl0SUZ3aUxpOUpiblJsWjJWeVZIbHdaVlpoYkdsa1lYUnZjaTVxYzF3aU8xeHVhVzF3YjNKMElIdFRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlmU0JtY205dElGd2lMaTlUZEhKcGJtZFVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzVwYlhCdmNuUWdlME52Ykc5eVZIbHdaVlpoYkdsa1lYUnZjbjBnWm5KdmJTQmNJaTR2UTI5c2IzSlVlWEJsVm1Gc2FXUmhkRzl5TG1welhDSTdYRzVwYlhCdmNuUWdlMEp2YjJ4bFlXNVVlWEJsVm1Gc2FXUmhkRzl5ZlNCbWNtOXRJRndpTGk5Q2IyOXNaV0Z1Vkhsd1pWWmhiR2xrWVhSdmNpNXFjMXdpTzF4dVhHNWpiMjV6ZENCV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCN1hHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb0tTQjdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1ltOXZiR1ZoYmlocGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lFSnZiMnhsWVc1VWVYQmxWbUZzYVdSaGRHOXlLR2x1Y0hWMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCamIyeHZjaWhwYm5CMWRDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVOdmJHOXlWSGx3WlZaaGJHbGtZWFJ2Y2locGJuQjFkQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhVzUwWldkbGNpaHBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRWx1ZEdWblpYSlVlWEJsVm1Gc2FXUmhkRzl5S0dsdWNIVjBLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpkSEpwYm1jb2FXNXdkWFFwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlRkSEpwYm1kVWVYQmxWbUZzYVdSaGRHOXlLR2x1Y0hWMEtUdGNiaUFnSUNCOVhHNWNibjA3WEc1Y2JtTnZibk4wSUZaaGJHbGtZWFJ2Y2xOcGJtZHNaWFJ2YmlBOUlHNWxkeUJXWVd4cFpHRjBiM0lvS1R0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCV1lXeHBaR0YwYjNKVGFXNW5iR1YwYjI0Z1lYTWdkbUZzYVdSaGRHVmNibjA3WEc0aUxDSXZLaXBjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9Dd2dNakF4T1NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVMeW9xWEc0Z0tpQkFiVzlrZFd4bFhHNGdLaTljYm1sdGNHOXlkQ0I3UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmU0JtY205dElGd2lMaTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk5jSWp0Y2JtbHRjRzl5ZENCN2RtRnNhV1JoZEdWOUlHWnliMjBnWENJdUwzWmhiR2xrWVhSbEwzWmhiR2xrWVhSbExtcHpYQ0k3WEc1Y2JpOHZJRlJvWlNCdVlXMWxjeUJ2WmlCMGFHVWdLRzlpYzJWeWRtVmtLU0JoZEhSeWFXSjFkR1Z6SUc5bUlIUm9aU0JVYjNCUWJHRjVaWEl1WEc1amIyNXpkQ0JEVDB4UFVsOUJWRlJTU1VKVlZFVWdQU0JjSW1OdmJHOXlYQ0k3WEc1amIyNXpkQ0JPUVUxRlgwRlVWRkpKUWxWVVJTQTlJRndpYm1GdFpWd2lPMXh1WTI5dWMzUWdVME5QVWtWZlFWUlVVa2xDVlZSRklEMGdYQ0p6WTI5eVpWd2lPMXh1WTI5dWMzUWdTRUZUWDFSVlVrNWZRVlJVVWtsQ1ZWUkZJRDBnWENKb1lYTXRkSFZ5Ymx3aU8xeHVYRzR2THlCVWFHVWdjSEpwZG1GMFpTQndjbTl3WlhKMGFXVnpJRzltSUhSb1pTQlViM0JRYkdGNVpYSWdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDI1aGJXVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVZMjl1YzNRZ1gzTmpiM0psSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlvWVhOVWRYSnVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibHh1THlvcVhHNGdLaUJCSUZCc1lYbGxjaUJwYmlCaElHUnBZMlVnWjJGdFpTNWNiaUFxWEc0Z0tpQkJJSEJzWVhsbGNpZHpJRzVoYldVZ2MyaHZkV3hrSUdKbElIVnVhWEYxWlNCcGJpQjBhR1VnWjJGdFpTNGdWSGR2SUdScFptWmxjbVZ1ZEZ4dUlDb2dWRzl3VUd4aGVXVnlJR1ZzWlcxbGJuUnpJSGRwZEdnZ2RHaGxJSE5oYldVZ2JtRnRaU0JoZEhSeWFXSjFkR1VnWVhKbElIUnlaV0YwWldRZ1lYTmNiaUFxSUhSb1pTQnpZVzFsSUhCc1lYbGxjaTVjYmlBcVhHNGdLaUJKYmlCblpXNWxjbUZzSUdsMElHbHpJSEpsWTI5dGJXVnVaR1ZrSUhSb1lYUWdibThnZEhkdklIQnNZWGxsY25NZ1pHOGdhR0YyWlNCMGFHVWdjMkZ0WlNCamIyeHZjaXhjYmlBcUlHRnNkR2h2ZFdkb0lHbDBJR2x6SUc1dmRDQjFibU52Ym1ObGFYWmhZbXhsSUhSb1lYUWdZMlZ5ZEdGcGJpQmthV05sSUdkaGJXVnpJR2hoZG1VZ2NHeGhlV1Z5Y3lCM2IzSnJYRzRnS2lCcGJpQjBaV0Z0Y3lCM2FHVnlaU0JwZENCM2IzVnNaQ0J0WVd0bElITmxibk5sSUdadmNpQjBkMjhnYjNJZ2JXOXlaU0JrYVdabVpYSmxiblFnY0d4aGVXVnljeUIwYjF4dUlDb2dhR0YyWlNCMGFHVWdjMkZ0WlNCamIyeHZjaTVjYmlBcVhHNGdLaUJVYUdVZ2JtRnRaU0JoYm1RZ1kyOXNiM0lnWVhSMGNtbGlkWFJsY3lCaGNtVWdjbVZ4ZFdseVpXUXVJRlJvWlNCelkyOXlaU0JoYm1RZ2FHRnpMWFIxY201Y2JpQXFJR0YwZEhKcFluVjBaWE1nWVhKbElHNXZkQzVjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb2dRRzFwZUdWeklHMXZaSFZzWlRwdGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE4rVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6WEc0Z0tpOWNibU52Ym5OMElGUnZjRkJzWVhsbGNpQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWektFaFVUVXhGYkdWdFpXNTBLU0I3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dWRzl3VUd4aGVXVnlMQ0J2Y0hScGIyNWhiR3g1SUdKaGMyVmtJRzl1SUdGdUlHbHVkR2wwYVdGc1hHNGdJQ0FnSUNvZ1kyOXVabWxuZFhKaGRHbHZiaUIyYVdFZ1lXNGdiMkpxWldOMElIQmhjbUZ0WlhSbGNpQnZjaUJrWldOc1lYSmxaQ0JoZEhSeWFXSjFkR1Z6SUdsdUlFaFVUVXd1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdXMk52Ym1acFoxMGdMU0JCYmlCcGJtbDBhV0ZzSUdOdmJtWnBaM1Z5WVhScGIyNGdabTl5SUhSb1pWeHVJQ0FnSUNBcUlIQnNZWGxsY2lCMGJ5QmpjbVZoZEdVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUdOdmJtWnBaeTVqYjJ4dmNpQXRJRlJvYVhNZ2NHeGhlV1Z5SjNNZ1kyOXNiM0lnZFhObFpDQnBiaUIwYUdVZ1oyRnRaUzVjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdZMjl1Wm1sbkxtNWhiV1VnTFNCVWFHbHpJSEJzWVhsbGNpZHpJRzVoYldVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUZ0amIyNW1hV2N1YzJOdmNtVmRJQzBnVkdocGN5QndiR0Y1WlhJbmN5QnpZMjl5WlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTBKdmIyeGxZVzU5SUZ0amIyNW1hV2N1YUdGelZIVnlibDBnTFNCVWFHbHpJSEJzWVhsbGNpQm9ZWE1nWVNCMGRYSnVMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHRqYjJ4dmNpd2dibUZ0WlN3Z2MyTnZjbVVzSUdoaGMxUjFjbTU5SUQwZ2UzMHBJSHRjYmlBZ0lDQWdJQ0FnYzNWd1pYSW9LVHRjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjJ4dmNsWmhiSFZsSUQwZ2RtRnNhV1JoZEdVdVkyOXNiM0lvWTI5c2IzSWdmSHdnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZLU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaGpiMnh2Y2xaaGJIVmxMbWx6Vm1Gc2FXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOWpiMnh2Y2k1elpYUW9kR2hwY3l3Z1kyOXNiM0pXWVd4MVpTNTJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXNJSFJvYVhNdVkyOXNiM0lwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhjSWtFZ1VHeGhlV1Z5SUc1bFpXUnpJR0VnWTI5c2IzSXNJSGRvYVdOb0lHbHpJR0VnVTNSeWFXNW5MbHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHNWhiV1ZXWVd4MVpTQTlJSFpoYkdsa1lYUmxMbk4wY21sdVp5aHVZVzFsSUh4OElIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtFNUJUVVZmUVZSVVVrbENWVlJGS1NrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1WVcxbFZtRnNkV1V1YVhOV1lXeHBaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYMjVoYldVdWMyVjBLSFJvYVhNc0lHNWhiV1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9Ua0ZOUlY5QlZGUlNTVUpWVkVVc0lIUm9hWE11Ym1GdFpTazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUtGd2lRU0JRYkdGNVpYSWdibVZsWkhNZ1lTQnVZVzFsTENCM2FHbGphQ0JwY3lCaElGTjBjbWx1Wnk1Y0lpazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0J6WTI5eVpWWmhiSFZsSUQwZ2RtRnNhV1JoZEdVdWFXNTBaV2RsY2loelkyOXlaU0I4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVwS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLSE5qYjNKbFZtRnNkV1V1YVhOV1lXeHBaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYM05qYjNKbExuTmxkQ2gwYUdsekxDQnpZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXNJSFJvYVhNdWMyTnZjbVVwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnVDJ0aGVTNGdRU0J3YkdGNVpYSWdaRzlsY3lCdWIzUWdibVZsWkNCMGJ5Qm9ZWFpsSUdFZ2MyTnZjbVV1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZjMk52Y21VdWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvVTBOUFVrVmZRVlJVVWtsQ1ZWUkZLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUdoaGMxUjFjbTVXWVd4MVpTQTlJSFpoYkdsa1lYUmxMbUp2YjJ4bFlXNG9hR0Z6VkhWeWJpQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbWx6VkhKMVpTZ3BPMXh1SUNBZ0lDQWdJQ0JwWmlBb2FHRnpWSFZ5YmxaaGJIVmxMbWx6Vm1Gc2FXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOW9ZWE5VZFhKdUxuTmxkQ2gwYUdsekxDQm9ZWE5VZFhKdUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0VoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlN3Z2FHRnpWSFZ5YmlrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCUGEyRjVMQ0JCSUhCc1lYbGxjaUJrYjJWeklHNXZkQ0JoYkhkaGVYTWdhR0YyWlNCaElIUjFjbTR1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2diblZzYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuSmxiVzkyWlVGMGRISnBZblYwWlNoSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MzUmhkR2xqSUdkbGRDQnZZbk5sY25abFpFRjBkSEpwWW5WMFpYTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiWEc0Z0lDQWdJQ0FnSUNBZ0lDQkRUMHhQVWw5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JPUVUxRlgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUZORFQxSkZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJWeHVJQ0FnSUNBZ0lDQmRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lHUnBjMk52Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb2FYTWdjR3hoZVdWeUozTWdZMjlzYjNJdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VTNSeWFXNW5mVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjJ4dmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlqYjJ4dmNpNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hwY3lCd2JHRjVaWEluY3lCdVlXMWxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxTjBjbWx1WjMxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2JtRnRaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5dVlXMWxMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdseklIQnNZWGxsY2lkeklITmpiM0psTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdjMk52Y21Vb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzSUQwOVBTQmZjMk52Y21VdVoyVjBLSFJvYVhNcElEOGdNQ0E2SUY5elkyOXlaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0J6WTI5eVpTaHVaWGRUWTI5eVpTa2dlMXh1SUNBZ0lDQWdJQ0JmYzJOdmNtVXVjMlYwS0hSb2FYTXNJRzVsZDFOamIzSmxLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlHNWxkMU5qYjNKbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVTBOUFVrVmZRVlJVVWtsQ1ZWUkZMQ0J1WlhkVFkyOXlaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVGRHRnlkQ0JoSUhSMWNtNGdabTl5SUhSb2FYTWdjR3hoZVdWeUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1ZHOXdVR3hoZVdWeWZTQlVhR1VnY0d4aGVXVnlJSGRwZEdnZ1lTQjBkWEp1WEc0Z0lDQWdJQ292WEc0Z0lDQWdjM1JoY25SVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9kR2hwY3k1cGMwTnZibTVsWTNSbFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV3WVhKbGJuUk9iMlJsTG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUVOMWMzUnZiVVYyWlc1MEtGd2lkRzl3T25OMFlYSjBMWFIxY201Y0lpd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JsZEdGcGJEb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd2JHRjVaWEk2SUhSb2FYTmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWDJoaGMxUjFjbTR1YzJWMEtIUm9hWE1zSUhSeWRXVXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVVzSUhSeWRXVXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRmJtUWdZU0IwZFhKdUlHWnZjaUIwYUdseklIQnNZWGxsY2k1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JsYm1SVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCZmFHRnpWSFZ5Ymk1elpYUW9kR2hwY3l3Z2JuVnNiQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSRzlsY3lCMGFHbHpJSEJzWVhsbGNpQm9ZWFpsSUdFZ2RIVnliajljYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQm9ZWE5VZFhKdUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlNBOVBUMGdYMmhoYzFSMWNtNHVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRUVnVTNSeWFXNW5JSEpsY0hKbGMyVnVkR0YwYVc5dUlHOW1JSFJvYVhNZ2NHeGhlV1Z5TENCb2FYTWdiM0lnYUdWeWN5QnVZVzFsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VTNSeWFXNW5mU0JVYUdVZ2NHeGhlV1Z5SjNNZ2JtRnRaU0J5WlhCeVpYTmxiblJ6SUhSb1pTQndiR0Y1WlhJZ1lYTWdZU0J6ZEhKcGJtY3VYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHOVRkSEpwYm1jb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmdKSHQwYUdsekxtNWhiV1Y5WUR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCSmN5QjBhR2x6SUhCc1lYbGxjaUJsY1hWaGJDQmhibTkwYUdWeUlIQnNZWGxsY2o5Y2JpQWdJQ0FnS2lCY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFSdmNGQnNZWGxsY24wZ2IzUm9aWElnTFNCVWFHVWdiM1JvWlhJZ2NHeGhlV1Z5SUhSdklHTnZiWEJoY21VZ2RHaHBjeUJ3YkdGNVpYSWdkMmwwYUM1Y2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0Q2IyOXNaV0Z1ZlNCVWNuVmxJSGRvWlc0Z1pXbDBhR1Z5SUhSb1pTQnZZbXBsWTNRZ2NtVm1aWEpsYm1ObGN5QmhjbVVnZEdobElITmhiV1ZjYmlBZ0lDQWdLaUJ2Y2lCM2FHVnVJR0p2ZEdnZ2JtRnRaU0JoYm1RZ1kyOXNiM0lnWVhKbElIUm9aU0J6WVcxbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdWeGRXRnNjeWh2ZEdobGNpa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnVZVzFsSUQwZ1hDSnpkSEpwYm1kY0lpQTlQVDBnZEhsd1pXOW1JRzkwYUdWeUlEOGdiM1JvWlhJZ09pQnZkR2hsY2k1dVlXMWxPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiM1JvWlhJZ1BUMDlJSFJvYVhNZ2ZId2dibUZ0WlNBOVBUMGdkR2hwY3k1dVlXMWxPMXh1SUNBZ0lIMWNibjA3WEc1Y2JuZHBibVJ2ZHk1amRYTjBiMjFGYkdWdFpXNTBjeTVrWldacGJtVW9YQ0owYjNBdGNHeGhlV1Z5WENJc0lGUnZjRkJzWVhsbGNpazdYRzVjYmk4cUtseHVJQ29nVkdobElHUmxabUYxYkhRZ2MzbHpkR1Z0SUhCc1lYbGxjaTRnUkdsalpTQmhjbVVnZEdoeWIzZHVJR0o1SUdFZ2NHeGhlV1Z5TGlCR2IzSWdjMmwwZFdGMGFXOXVjMXh1SUNvZ2QyaGxjbVVnZVc5MUlIZGhiblFnZEc4Z2NtVnVaR1Z5SUdFZ1luVnVZMmdnYjJZZ1pHbGpaU0IzYVhSb2IzVjBJRzVsWldScGJtY2dkR2hsSUdOdmJtTmxjSFFnYjJZZ1VHeGhlV1Z5YzF4dUlDb2dkR2hwY3lCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSWdZMkZ1SUdKbElHRWdjM1ZpYzNScGRIVjBaUzRnVDJZZ1kyOTFjbk5sTENCcFppQjViM1VuWkNCc2FXdGxJSFJ2WEc0Z0tpQmphR0Z1WjJVZ2RHaGxJRzVoYldVZ1lXNWtMMjl5SUhSb1pTQmpiMnh2Y2l3Z1kzSmxZWFJsSUdGdVpDQjFjMlVnZVc5MWNpQnZkMjRnWENKemVYTjBaVzBnY0d4aGVXVnlYQ0l1WEc0Z0tpQkFZMjl1YzNSY2JpQXFMMXh1WTI5dWMzUWdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTSUQwZ2JtVjNJRlJ2Y0ZCc1lYbGxjaWg3WTI5c2IzSTZJRndpY21Wa1hDSXNJRzVoYldVNklGd2lLbHdpZlNrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZHOXdVR3hoZVdWeUxGeHVJQ0FnSUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVseHVmVHRjYmlJc0lpOHFLbHh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvZ1FHbG5ibTl5WlZ4dUlDb3ZYRzR2TDJsdGNHOXlkQ0I3UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdSM0pwWkV4aGVXOTFkSDBnWm5KdmJTQmNJaTR2UjNKcFpFeGhlVzkxZEM1cWMxd2lPMXh1YVcxd2IzSjBJSHRFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZKOUlHWnliMjBnWENJdUwxUnZjRkJzWVhsbGNpNXFjMXdpTzF4dWFXMXdiM0owSUh0MllXeHBaR0YwWlgwZ1puSnZiU0JjSWk0dmRtRnNhV1JoZEdVdmRtRnNhV1JoZEdVdWFuTmNJanRjYmx4dUx5b3FYRzRnS2lCQWJXOWtkV3hsWEc0Z0tpOWNibHh1WTI5dWMzUWdSRVZHUVZWTVZGOUVTVVZmVTBsYVJTQTlJREV3TURzZ0x5OGdjSGhjYm1OdmJuTjBJRVJGUmtGVlRGUmZTRTlNUkY5RVZWSkJWRWxQVGlBOUlETTNOVHNnTHk4Z2JYTmNibU52Ym5OMElFUkZSa0ZWVEZSZlJGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ0E5SUdaaGJITmxPMXh1WTI5dWMzUWdSRVZHUVZWTVZGOUlUMHhFU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYm1OdmJuTjBJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNBOUlHWmhiSE5sTzF4dVhHNWpiMjV6ZENCU1QxZFRJRDBnTVRBN1hHNWpiMjV6ZENCRFQweFRJRDBnTVRBN1hHNWNibU52Ym5OMElFUkZSa0ZWVEZSZlYwbEVWRWdnUFNCRFQweFRJQ29nUkVWR1FWVk1WRjlFU1VWZlUwbGFSVHNnTHk4Z2NIaGNibU52Ym5OMElFUkZSa0ZWVEZSZlNFVkpSMGhVSUQwZ1VrOVhVeUFxSUVSRlJrRlZURlJmUkVsRlgxTkpXa1U3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNGdQU0JOWVhSb0xtWnNiMjl5S0ZKUFYxTWdMeUF5S1R0Y2JseHVZMjl1YzNRZ1RVbE9YMFJGVEZSQklEMGdNenNnTHk5d2VGeHVYRzVqYjI1emRDQlhTVVJVU0Y5QlZGUlNTVUpWVkVVZ1BTQmNJbmRwWkhSb1hDSTdYRzVqYjI1emRDQklSVWxIU0ZSZlFWUlVVa2xDVlZSRklEMGdYQ0pvWldsbmFIUmNJanRjYm1OdmJuTjBJRVJKVTFCRlVsTkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSmthWE53WlhKemFXOXVYQ0k3WEc1amIyNXpkQ0JFU1VWZlUwbGFSVjlCVkZSU1NVSlZWRVVnUFNCY0ltUnBaUzF6YVhwbFhDSTdYRzVqYjI1emRDQkVVa0ZIUjBsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlNBOUlGd2laSEpoWjJkcGJtY3RaR2xqWlMxa2FYTmhZbXhsWkZ3aU8xeHVZMjl1YzNRZ1NFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU0E5SUZ3aWFHOXNaR2x1Wnkxa2FXTmxMV1JwYzJGaWJHVmtYQ0k3WEc1amIyNXpkQ0JTVDFSQlZFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTQTlJRndpY205MFlYUnBibWN0WkdsalpTMWthWE5oWW14bFpGd2lPMXh1WTI5dWMzUWdTRTlNUkY5RVZWSkJWRWxQVGw5QlZGUlNTVUpWVkVVZ1BTQmNJbWh2YkdRdFpIVnlZWFJwYjI1Y0lqdGNibHh1WEc1amIyNXpkQ0J3WVhKelpVNTFiV0psY2lBOUlDaHVkVzFpWlhKVGRISnBibWNzSUdSbFptRjFiSFJPZFcxaVpYSWdQU0F3S1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnYm5WdFltVnlJRDBnY0dGeWMyVkpiblFvYm5WdFltVnlVM1J5YVc1bkxDQXhNQ2s3WEc0Z0lDQWdjbVYwZFhKdUlFNTFiV0psY2k1cGMwNWhUaWh1ZFcxaVpYSXBJRDhnWkdWbVlYVnNkRTUxYldKbGNpQTZJRzUxYldKbGNqdGNibjA3WEc1Y2JtTnZibk4wSUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5SUQwZ0tHNTFiV0psY2xOMGNtbHVaeXdnWkdWbVlYVnNkRlpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdjbVYwZFhKdUlIWmhiR2xrWVhSbExtbHVkR1ZuWlhJb2JuVnRZbVZ5VTNSeWFXNW5LVnh1SUNBZ0lDQWdJQ0F1YkdGeVoyVnlWR2hoYmlnd0tWeHVJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLR1JsWm1GMWJIUldZV3gxWlNsY2JpQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dWZUdGNibHh1WTI5dWMzUWdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVWdQU0FvWld4bGJXVnVkQ3dnYm1GdFpTd2daR1ZtWVhWc2RGWmhiSFZsS1NBOVBpQjdYRzRnSUNBZ2FXWWdLR1ZzWlcxbGJuUXVhR0Z6UVhSMGNtbGlkWFJsS0c1aGJXVXBLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSFpoYkhWbFUzUnlhVzVuSUQwZ1pXeGxiV1Z1ZEM1blpYUkJkSFJ5YVdKMWRHVW9ibUZ0WlNrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2loMllXeDFaVk4wY21sdVp5d2daR1ZtWVhWc2RGWmhiSFZsS1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjbVYwZFhKdUlHUmxabUYxYkhSV1lXeDFaVHRjYm4wN1hHNWNibU52Ym5OMElHZGxkRUp2YjJ4bFlXNGdQU0FvWW05dmJHVmhibE4wY21sdVp5d2dkSEoxWlZaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVcElEMCtJSHRjYmlBZ0lDQnBaaUFvZEhKMVpWWmhiSFZsSUQwOVBTQmliMjlzWldGdVUzUnlhVzVuSUh4OElGd2lkSEoxWlZ3aUlEMDlQU0JpYjI5c1pXRnVVM1J5YVc1bktTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJSDBnWld4elpTQnBaaUFvWENKbVlXeHpaVndpSUQwOVBTQmliMjlzWldGdVUzUnlhVzVuS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1pHVm1ZWFZzZEZaaGJIVmxPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtTnZibk4wSUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVZ1BTQW9aV3hsYldWdWRDd2dibUZ0WlN3Z1pHVm1ZWFZzZEZaaGJIVmxLU0E5UGlCN1hHNGdJQ0FnYVdZZ0tHVnNaVzFsYm5RdWFHRnpRWFIwY21saWRYUmxLRzVoYldVcEtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElIWmhiSFZsVTNSeWFXNW5JRDBnWld4bGJXVnVkQzVuWlhSQmRIUnlhV0oxZEdVb2JtRnRaU2s3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSQ2IyOXNaV0Z1S0haaGJIVmxVM1J5YVc1bkxDQmJkbUZzZFdWVGRISnBibWNzSUZ3aWRISjFaVndpWFN3Z1cxd2labUZzYzJWY0lsMHNJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJR1JsWm1GMWJIUldZV3gxWlR0Y2JuMDdYRzVjYmk4dklGQnlhWFpoZEdVZ2NISnZjR1Z5ZEdsbGMxeHVZMjl1YzNRZ1gyTmhiblpoY3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYkdGNWIzVjBJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWpkWEp5Wlc1MFVHeGhlV1Z5SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl1ZFcxaVpYSlBabEpsWVdSNVJHbGpaU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYm1OdmJuTjBJR052Ym5SbGVIUWdQU0FvWW05aGNtUXBJRDArSUY5allXNTJZWE11WjJWMEtHSnZZWEprS1M1blpYUkRiMjUwWlhoMEtGd2lNbVJjSWlrN1hHNWNibU52Ym5OMElHZGxkRkpsWVdSNVJHbGpaU0E5SUNoaWIyRnlaQ2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaDFibVJsWm1sdVpXUWdQVDA5SUY5dWRXMWlaWEpQWmxKbFlXUjVSR2xqWlM1blpYUW9ZbTloY21RcEtTQjdYRzRnSUNBZ0lDQWdJRjl1ZFcxaVpYSlBabEpsWVdSNVJHbGpaUzV6WlhRb1ltOWhjbVFzSURBcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1WjJWMEtHSnZZWEprS1R0Y2JuMDdYRzVjYm1OdmJuTjBJSFZ3WkdGMFpWSmxZV1I1UkdsalpTQTlJQ2hpYjJGeVpDd2dkWEJrWVhSbEtTQTlQaUI3WEc0Z0lDQWdYMjUxYldKbGNrOW1VbVZoWkhsRWFXTmxMbk5sZENoaWIyRnlaQ3dnWjJWMFVtVmhaSGxFYVdObEtHSnZZWEprS1NBcklIVndaR0YwWlNrN1hHNTlPMXh1WEc1amIyNXpkQ0JwYzFKbFlXUjVJRDBnS0dKdllYSmtLU0E5UGlCblpYUlNaV0ZrZVVScFkyVW9ZbTloY21RcElEMDlQU0JpYjJGeVpDNWthV05sTG14bGJtZDBhRHRjYmx4dVkyOXVjM1FnZFhCa1lYUmxRbTloY21RZ1BTQW9ZbTloY21Rc0lHUnBZMlVnUFNCaWIyRnlaQzVrYVdObEtTQTlQaUI3WEc0Z0lDQWdhV1lnS0dselVtVmhaSGtvWW05aGNtUXBLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuUmxlSFFvWW05aGNtUXBMbU5zWldGeVVtVmpkQ2d3TENBd0xDQmliMkZ5WkM1M2FXUjBhQ3dnWW05aGNtUXVhR1ZwWjJoMEtUdGNibHh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdScFpTQnZaaUJrYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVXVjbVZ1WkdWeUtHTnZiblJsZUhRb1ltOWhjbVFwTENCaWIyRnlaQzVrYVdWVGFYcGxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYm4wN1hHNWNibHh1THk4Z1NXNTBaWEpoWTNScGIyNGdjM1JoZEdWelhHNWpiMjV6ZENCT1QwNUZJRDBnVTNsdFltOXNLRndpYm05ZmFXNTBaWEpoWTNScGIyNWNJaWs3WEc1amIyNXpkQ0JJVDB4RUlEMGdVM2x0WW05c0tGd2lhRzlzWkZ3aUtUdGNibU52Ym5OMElFMVBWa1VnUFNCVGVXMWliMndvWENKdGIzWmxYQ0lwTzF4dVkyOXVjM1FnU1U1RVJWUkZVazFKVGtWRUlEMGdVM2x0WW05c0tGd2lhVzVrWlhSbGNtMXBibVZrWENJcE8xeHVZMjl1YzNRZ1JGSkJSMGRKVGtjZ1BTQlRlVzFpYjJ3b1hDSmtjbUZuWjJsdVoxd2lLVHRjYmx4dUx5OGdUV1YwYUc5a2N5QjBieUJvWVc1a2JHVWdhVzUwWlhKaFkzUnBiMjVjYm1OdmJuTjBJR052Ym5abGNuUlhhVzVrYjNkRGIyOXlaR2x1WVhSbGMxUnZRMkZ1ZG1GeklEMGdLR05oYm5aaGN5d2dlRmRwYm1SdmR5d2dlVmRwYm1SdmR5a2dQVDRnZTF4dUlDQWdJR052Ym5OMElHTmhiblpoYzBKdmVDQTlJR05oYm5aaGN5NW5aWFJDYjNWdVpHbHVaME5zYVdWdWRGSmxZM1FvS1R0Y2JseHVJQ0FnSUdOdmJuTjBJSGdnUFNCNFYybHVaRzkzSUMwZ1kyRnVkbUZ6UW05NExteGxablFnS2lBb1kyRnVkbUZ6TG5kcFpIUm9JQzhnWTJGdWRtRnpRbTk0TG5kcFpIUm9LVHRjYmlBZ0lDQmpiMjV6ZENCNUlEMGdlVmRwYm1SdmR5QXRJR05oYm5aaGMwSnZlQzUwYjNBZ0tpQW9ZMkZ1ZG1GekxtaGxhV2RvZENBdklHTmhiblpoYzBKdmVDNW9aV2xuYUhRcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUh0NExDQjVmVHRjYm4wN1hHNWNibU52Ym5OMElITmxkSFZ3U1c1MFpYSmhZM1JwYjI0Z1BTQW9ZbTloY21RcElEMCtJSHRjYmlBZ0lDQmpiMjV6ZENCallXNTJZWE1nUFNCZlkyRnVkbUZ6TG1kbGRDaGliMkZ5WkNrN1hHNWNiaUFnSUNBdkx5QlRaWFIxY0NCcGJuUmxjbUZqZEdsdmJseHVJQ0FnSUd4bGRDQnZjbWxuYVc0Z1BTQjdmVHRjYmlBZ0lDQnNaWFFnYzNSaGRHVWdQU0JPVDA1Rk8xeHVJQ0FnSUd4bGRDQnpkR0YwYVdOQ2IyRnlaQ0E5SUc1MWJHdzdYRzRnSUNBZ2JHVjBJR1JwWlZWdVpHVnlRM1Z5YzI5eUlEMGdiblZzYkR0Y2JpQWdJQ0JzWlhRZ2FHOXNaRlJwYldWdmRYUWdQU0J1ZFd4c08xeHVYRzRnSUNBZ1kyOXVjM1FnYUc5c1pFUnBaU0E5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFaFBURVFnUFQwOUlITjBZWFJsSUh4OElFbE9SRVZVUlZKTlNVNUZSQ0E5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUhSdloyZHNaU0JvYjJ4a0lDOGdjbVZzWldGelpWeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjR3hoZVdWeVYybDBhRUZVZFhKdUlEMGdZbTloY21RdWNYVmxjbmxUWld4bFkzUnZjaWhjSW5SdmNDMXdiR0Y1WlhJdGJHbHpkQ0IwYjNBdGNHeGhlV1Z5VzJoaGN5MTBkWEp1WFZ3aUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaGthV1ZWYm1SbGNrTjFjbk52Y2k1cGMwaGxiR1FvS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBaVlZ1WkdWeVEzVnljMjl5TG5KbGJHVmhjMlZKZENod2JHRjVaWEpYYVhSb1FWUjFjbTRwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2k1b2IyeGtTWFFvY0d4aGVXVnlWMmwwYUVGVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnVGs5T1JUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21RcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYUc5c1pGUnBiV1Z2ZFhRZ1BTQnVkV3hzTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnpkR0Z5ZEVodmJHUnBibWNnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdodmJHUlVhVzFsYjNWMElEMGdkMmx1Wkc5M0xuTmxkRlJwYldWdmRYUW9hRzlzWkVScFpTd2dZbTloY21RdWFHOXNaRVIxY21GMGFXOXVLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUnZjRWh2YkdScGJtY2dQU0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJSGRwYm1SdmR5NWpiR1ZoY2xScGJXVnZkWFFvYUc5c1pGUnBiV1Z2ZFhRcE8xeHVJQ0FnSUNBZ0lDQm9iMnhrVkdsdFpXOTFkQ0E5SUc1MWJHdzdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOMFlYSjBTVzUwWlhKaFkzUnBiMjRnUFNBb1pYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0U1UFRrVWdQVDA5SUhOMFlYUmxLU0I3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJRzl5YVdkcGJpQTlJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I0T2lCbGRtVnVkQzVqYkdsbGJuUllMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSGs2SUdWMlpXNTBMbU5zYVdWdWRGbGNiaUFnSUNBZ0lDQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpWVnVaR1Z5UTNWeWMyOXlJRDBnWW05aGNtUXViR0Y1YjNWMExtZGxkRUYwS0dOdmJuWmxjblJYYVc1a2IzZERiMjl5WkdsdVlYUmxjMVJ2UTJGdWRtRnpLR05oYm5aaGN5d2daWFpsYm5RdVkyeHBaVzUwV0N3Z1pYWmxiblF1WTJ4cFpXNTBXU2twTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0FoUFQwZ1pHbGxWVzVrWlhKRGRYSnpiM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBibXg1SUdsdWRHVnlZV04wYVc5dUlIZHBkR2dnZEdobElHSnZZWEprSUhacFlTQmhJR1JwWlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hZbTloY21RdVpHbHpZV0pzWldSSWIyeGthVzVuUkdsalpTQW1KaUFoWW05aGNtUXVaR2x6WVdKc1pXUkVjbUZuWjJsdVowUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdVZ1BTQkpUa1JGVkVWU1RVbE9SVVE3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBZWEowU0c5c1pHbHVaeWdwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrU0c5c1pHbHVaMFJwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGRHVWdQU0JJVDB4RU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGeWRFaHZiR1JwYm1jb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0YwWlNBOUlFMVBWa1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdjMmh2ZDBsdWRHVnlZV04wYVc5dUlEMGdLR1YyWlc1MEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1JwWlZWdVpHVnlRM1Z5YzI5eUlEMGdZbTloY21RdWJHRjViM1YwTG1kbGRFRjBLR052Ym5abGNuUlhhVzVrYjNkRGIyOXlaR2x1WVhSbGMxUnZRMkZ1ZG1GektHTmhiblpoY3l3Z1pYWmxiblF1WTJ4cFpXNTBXQ3dnWlhabGJuUXVZMnhwWlc1MFdTa3BPMXh1SUNBZ0lDQWdJQ0JwWmlBb1JGSkJSMGRKVGtjZ1BUMDlJSE4wWVhSbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11YzNSNWJHVXVZM1Z5YzI5eUlEMGdYQ0puY21GaVltbHVaMXdpTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tHNTFiR3dnSVQwOUlHUnBaVlZ1WkdWeVEzVnljMjl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVc1MllYTXVjM1I1YkdVdVkzVnljMjl5SUQwZ1hDSm5jbUZpWENJN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVc1MllYTXVjM1I1YkdVdVkzVnljMjl5SUQwZ1hDSmtaV1poZFd4MFhDSTdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2JXOTJaU0E5SUNobGRtVnVkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvVFU5V1JTQTlQVDBnYzNSaGRHVWdmSHdnU1U1RVJWUkZVazFKVGtWRUlEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdaR1YwWlhKdGFXNWxJR2xtSUdFZ1pHbGxJR2x6SUhWdVpHVnlJSFJvWlNCamRYSnpiM0pjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRWxuYm05eVpTQnpiV0ZzYkNCdGIzWmxiV1Z1ZEhOY2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjRJRDBnVFdGMGFDNWhZbk1vYjNKcFoybHVMbmdnTFNCbGRtVnVkQzVqYkdsbGJuUllLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSNUlEMGdUV0YwYUM1aFluTW9iM0pwWjJsdUxua2dMU0JsZG1WdWRDNWpiR2xsYm5SWktUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLRTFKVGw5RVJVeFVRU0E4SUdSNElIeDhJRTFKVGw5RVJVeFVRU0E4SUdSNUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdVZ1BTQkVVa0ZIUjBsT1J6dGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkRzl3U0c5c1pHbHVaeWdwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsalpWZHBkR2h2ZFhSRWFXVlZibVJsY2tOMWNuTnZjaUE5SUdKdllYSmtMbVJwWTJVdVptbHNkR1Z5S0dScFpTQTlQaUJrYVdVZ0lUMDlJR1JwWlZWdVpHVnlRM1Z5YzI5eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2hpYjJGeVpDd2daR2xqWlZkcGRHaHZkWFJFYVdWVmJtUmxja04xY25OdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdsalFtOWhjbVFnUFNCamIyNTBaWGgwS0dKdllYSmtLUzVuWlhSSmJXRm5aVVJoZEdFb01Dd2dNQ3dnWTJGdWRtRnpMbmRwWkhSb0xDQmpZVzUyWVhNdWFHVnBaMmgwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNoRVVrRkhSMGxPUnlBOVBUMGdjM1JoZEdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1I0SUQwZ2IzSnBaMmx1TG5nZ0xTQmxkbVZ1ZEM1amJHbGxiblJZTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIa2dQU0J2Y21sbmFXNHVlU0F0SUdWMlpXNTBMbU5zYVdWdWRGazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdScFpWVnVaR1Z5UTNWeWMyOXlMbU52YjNKa2FXNWhkR1Z6TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBLR0p2WVhKa0tTNXdkWFJKYldGblpVUmhkR0VvYzNSaGRHbGpRbTloY21Rc0lEQXNJREFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWNtVnVaR1Z5S0dOdmJuUmxlSFFvWW05aGNtUXBMQ0JpYjJGeVpDNWthV1ZUYVhwbExDQjdlRG9nZUNBdElHUjRMQ0I1T2lCNUlDMGdaSGw5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0J6ZEc5d1NXNTBaWEpoWTNScGIyNGdQU0FvWlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z0lUMDlJR1JwWlZWdVpHVnlRM1Z5YzI5eUlDWW1JRVJTUVVkSFNVNUhJRDA5UFNCemRHRjBaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIZ2dQU0J2Y21sbmFXNHVlQ0F0SUdWMlpXNTBMbU5zYVdWdWRGZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZVNBOUlHOXlhV2RwYmk1NUlDMGdaWFpsYm5RdVkyeHBaVzUwV1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlM2dzSUhsOUlEMGdaR2xsVlc1a1pYSkRkWEp6YjNJdVkyOXZjbVJwYm1GMFpYTTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhOdVlYQlViME52YjNKa2N5QTlJR0p2WVhKa0xteGhlVzkxZEM1emJtRndWRzhvZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdScFpUb2daR2xsVlc1a1pYSkRkWEp6YjNJc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2VEb2dlQ0F0SUdSNExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIazZJSGtnTFNCa2VTeGNiaUFnSUNBZ0lDQWdJQ0FnSUgwcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J1WlhkRGIyOXlaSE1nUFNCdWRXeHNJQ0U5SUhOdVlYQlViME52YjNKa2N5QS9JSE51WVhCVWIwTnZiM0prY3lBNklIdDRMQ0I1ZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbFZXNWtaWEpEZFhKemIzSXVZMjl2Y21ScGJtRjBaWE1nUFNCdVpYZERiMjl5WkhNN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCRGJHVmhjaUJ6ZEdGMFpWeHVJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2lBOUlHNTFiR3c3WEc0Z0lDQWdJQ0FnSUhOMFlYUmxJRDBnVGs5T1JUdGNibHh1SUNBZ0lDQWdJQ0F2THlCU1pXWnlaWE5vSUdKdllYSmtPeUJTWlc1a1pYSWdaR2xqWlZ4dUlDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaGliMkZ5WkNrN1hHNGdJQ0FnZlR0Y2JseHVYRzRnSUNBZ0x5OGdVbVZuYVhOMFpYSWdkR2hsSUdGamRIVmhiQ0JsZG1WdWRDQnNhWE4wWlc1bGNuTWdaR1ZtYVc1bFpDQmhZbTkyWlM0Z1RXRndJSFJ2ZFdOb0lHVjJaVzUwY3lCMGIxeHVJQ0FnSUM4dklHVnhkV2wyWVd4bGJuUWdiVzkxYzJVZ1pYWmxiblJ6TGlCQ1pXTmhkWE5sSUhSb1pTQmNJblJ2ZFdOb1pXNWtYQ0lnWlhabGJuUWdaRzlsY3lCdWIzUWdhR0YyWlNCaFhHNGdJQ0FnTHk4Z1kyeHBaVzUwV0NCaGJtUWdZMnhwWlc1MFdTd2djbVZqYjNKa0lHRnVaQ0IxYzJVZ2RHaGxJR3hoYzNRZ2IyNWxjeUJtY205dElIUm9aU0JjSW5SdmRXTm9iVzkyWlZ3aVhHNGdJQ0FnTHk4Z0tHOXlJRndpZEc5MVkyaHpkR0Z5ZEZ3aUtTQmxkbVZ1ZEhNdVhHNWNiaUFnSUNCc1pYUWdkRzkxWTJoRGIyOXlaR2x1WVhSbGN5QTlJSHRqYkdsbGJuUllPaUF3TENCamJHbGxiblJaT2lBd2ZUdGNiaUFnSUNCamIyNXpkQ0IwYjNWamFESnRiM1Z6WlVWMlpXNTBJRDBnS0cxdmRYTmxSWFpsYm5ST1lXMWxLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBb2RHOTFZMmhGZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hSdmRXTm9SWFpsYm5RZ0ppWWdNQ0E4SUhSdmRXTm9SWFpsYm5RdWRHOTFZMmhsY3k1c1pXNW5kR2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3WTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXWDBnUFNCMGIzVmphRVYyWlc1MExuUnZkV05vWlhOYk1GMDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkRzkxWTJoRGIyOXlaR2x1WVhSbGN5QTlJSHRqYkdsbGJuUllMQ0JqYkdsbGJuUlpmVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTVrYVhOd1lYUmphRVYyWlc1MEtHNWxkeUJOYjNWelpVVjJaVzUwS0cxdmRYTmxSWFpsYm5ST1lXMWxMQ0IwYjNWamFFTnZiM0prYVc1aGRHVnpLU2s3WEc0Z0lDQWdJQ0FnSUgwN1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaHpkR0Z5ZEZ3aUxDQjBiM1ZqYURKdGIzVnpaVVYyWlc1MEtGd2liVzkxYzJWa2IzZHVYQ0lwS1R0Y2JpQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJbTF2ZFhObFpHOTNibHdpTENCemRHRnlkRWx1ZEdWeVlXTjBhVzl1S1R0Y2JseHVJQ0FnSUdsbUlDZ2hZbTloY21RdVpHbHpZV0pzWldSRWNtRm5aMmx1WjBScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNWamFHMXZkbVZjSWl3Z2RHOTFZMmd5Ylc5MWMyVkZkbVZ1ZENoY0ltMXZkWE5sYlc5MlpWd2lLU2s3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnRiM1psWENJc0lHMXZkbVVwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNnaFltOWhjbVF1WkdsellXSnNaV1JFY21GbloybHVaMFJwWTJVZ2ZId2dJV0p2WVhKa0xtUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXMXZkbVZjSWl3Z2MyaHZkMGx1ZEdWeVlXTjBhVzl1S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2ZFdOb1pXNWtYQ0lzSUhSdmRXTm9NbTF2ZFhObFJYWmxiblFvWENKdGIzVnpaWFZ3WENJcEtUdGNiaUFnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxkWEJjSWl3Z2MzUnZjRWx1ZEdWeVlXTjBhVzl1S1R0Y2JpQWdJQ0JqWVc1MllYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJbTF2ZFhObGIzVjBYQ0lzSUhOMGIzQkpiblJsY21GamRHbHZiaWs3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRlJ2Y0VScFkyVkNiMkZ5WkNCcGN5QmhJR04xYzNSdmJTQklWRTFNSUdWc1pXMWxiblFnZEc4Z2NtVnVaR1Z5SUdGdVpDQmpiMjUwY205c0lHRmNiaUFxSUdScFkyVWdZbTloY21RdUlGeHVJQ3BjYmlBcUlFQmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBYRzRnS2k5Y2JtTnZibk4wSUZSdmNFUnBZMlZDYjJGeVpDQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1NGUk5URVZzWlcxbGJuUWdlMXh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTNKbFlYUmxJR0VnYm1WM0lGUnZjRVJwWTJWQ2IyRnlaQzVjYmlBZ0lDQWdLaTljYmlBZ0lDQmpiMjV6ZEhKMVkzUnZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV6ZEhsc1pTNWthWE53YkdGNUlEMGdYQ0pwYm14cGJtVXRZbXh2WTJ0Y0lqdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2MyaGhaRzkzSUQwZ2RHaHBjeTVoZEhSaFkyaFRhR0ZrYjNjb2UyMXZaR1U2SUZ3aVkyeHZjMlZrWENKOUtUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyRnVkbUZ6SUQwZ1pHOWpkVzFsYm5RdVkzSmxZWFJsUld4bGJXVnVkQ2hjSW1OaGJuWmhjMXdpS1R0Y2JpQWdJQ0FnSUNBZ2MyaGhaRzkzTG1Gd2NHVnVaRU5vYVd4a0tHTmhiblpoY3lrN1hHNWNiaUFnSUNBZ0lDQWdYMk5oYm5aaGN5NXpaWFFvZEdocGN5d2dZMkZ1ZG1GektUdGNiaUFnSUNBZ0lDQWdYMk4xY25KbGJuUlFiR0Y1WlhJdWMyVjBLSFJvYVhNc0lFUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVaWs3WEc0Z0lDQWdJQ0FnSUY5c1lYbHZkWFF1YzJWMEtIUm9hWE1zSUc1bGR5QkhjbWxrVEdGNWIzVjBLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIZHBaSFJvT2lCMGFHbHpMbmRwWkhSb0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnYUdWcFoyaDBPaUIwYUdsekxtaGxhV2RvZEN4Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlZOcGVtVTZJSFJvYVhNdVpHbGxVMmw2WlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwYzNCbGNuTnBiMjQ2SUhSb2FYTXVaR2x6Y0dWeWMybHZibHh1SUNBZ0lDQWdJQ0I5S1NrN1hHNGdJQ0FnSUNBZ0lITmxkSFZ3U1c1MFpYSmhZM1JwYjI0b2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1JoZEdsaklHZGxkQ0J2WW5ObGNuWmxaRUYwZEhKcFluVjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYlhHNGdJQ0FnSUNBZ0lDQWdJQ0JYU1VSVVNGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCSVJVbEhTRlJmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdSRWxUVUVWU1UwbFBUbDlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQkVTVVZmVTBsYVJWOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCRVVrRkhSMGxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdTRTlNUkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhQVEVSZlJGVlNRVlJKVDA1ZlFWUlVVa2xDVlZSRlhHNGdJQ0FnSUNBZ0lGMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1lYUjBjbWxpZFhSbFEyaGhibWRsWkVOaGJHeGlZV05yS0c1aGJXVXNJRzlzWkZaaGJIVmxMQ0J1WlhkV1lXeDFaU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqWVc1MllYTWdQU0JmWTJGdWRtRnpMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQWdJQ0FnYzNkcGRHTm9JQ2h1WVcxbEtTQjdYRzRnSUNBZ0lDQWdJR05oYzJVZ1YwbEVWRWhmUVZSVVVrbENWVlJGT2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjNhV1IwYUNBOUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtHNWxkMVpoYkhWbExDQndZWEp6WlU1MWJXSmxjaWh2YkdSV1lXeDFaU2tnZkh3Z1JFVkdRVlZNVkY5WFNVUlVTQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG14aGVXOTFkQzUzYVdSMGFDQTlJSGRwWkhSb08xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk5sZEVGMGRISnBZblYwWlNoWFNVUlVTRjlCVkZSU1NVSlZWRVVzSUhkcFpIUm9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHTmhjMlVnU0VWSlIwaFVYMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2FHVnBaMmgwSUQwZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2JtVjNWbUZzZFdVc0lIQmhjbk5sVG5WdFltVnlLRzlzWkZaaGJIVmxLU0I4ZkNCRVJVWkJWVXhVWDBoRlNVZElWQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG14aGVXOTFkQzVvWldsbmFIUWdQU0JvWldsbmFIUTdYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11YzJWMFFYUjBjbWxpZFhSbEtFaEZTVWRJVkY5QlZGUlNTVUpWVkVVc0lHaGxhV2RvZENrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqWVhObElFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FYTndaWEp6YVc5dUlEMGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSW9ibVYzVm1Gc2RXVXNJSEJoY25ObFRuVnRZbVZ5S0c5c1pGWmhiSFZsS1NCOGZDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVaR2x6Y0dWeWMybHZiaUE5SUdScGMzQmxjbk5wYjI0N1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqWVhObElFUkpSVjlUU1ZwRlgwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsbFUybDZaU0E5SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5S0c1bGQxWmhiSFZsTENCd1lYSnpaVTUxYldKbGNpaHZiR1JXWVd4MVpTa2dmSHdnUkVWR1FWVk1WRjlFU1VWZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG14aGVXOTFkQzVrYVdWVGFYcGxJRDBnWkdsbFUybDZaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHTmhjMlVnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScGMyRmliR1ZrVW05MFlYUnBiMjRnUFNCMllXeHBaR0YwWlM1aWIyOXNaV0Z1S0c1bGQxWmhiSFZsTENCblpYUkNiMjlzWldGdUtHOXNaRlpoYkhWbExDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLU2t1ZG1Gc2RXVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbXhoZVc5MWRDNXliM1JoZEdVZ1BTQWhaR2x6WVdKc1pXUlNiM1JoZEdsdmJqdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdSbFptRjFiSFE2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZSb1pTQjJZV3gxWlNCcGN5QmtaWFJsY20xcGJtVmtJSGRvWlc0Z2RYTnBibWNnZEdobElHZGxkSFJsY2x4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0IxY0dSaGRHVkNiMkZ5WkNoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtGd2lkRzl3TFdScFpUcGhaR1JsWkZ3aUxDQW9LU0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVW9kR2hwY3l3Z01TazdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9hWE5TWldGa2VTaDBhR2x6S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLSFJvYVhNc0lIUm9hWE11YkdGNWIzVjBMbXhoZVc5MWRDaDBhR2x6TG1ScFkyVXBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5d0xXUnBaVHB5WlcxdmRtVmtYQ0lzSUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLSFJvYVhNc0lIUm9hWE11YkdGNWIzVjBMbXhoZVc5MWRDaDBhR2x6TG1ScFkyVXBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlZKbFlXUjVSR2xqWlNoMGFHbHpMQ0F0TVNrN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUM4dklFRnNiQ0JrYVdObElHSnZZWEprY3lCa2J5Qm9ZWFpsSUdFZ2NHeGhlV1Z5SUd4cGMzUXVJRWxtSUhSb1pYSmxJR2x6YmlkMElHOXVaU0I1WlhRc1hHNGdJQ0FnSUNBZ0lDOHZJR055WldGMFpTQnZibVV1WEc0Z0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUQwOVBTQjBhR2x6TG5GMVpYSjVVMlZzWldOMGIzSW9YQ0owYjNBdGNHeGhlV1Z5TFd4cGMzUmNJaWtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVlYQndaVzVrUTJocGJHUW9aRzlqZFcxbGJuUXVZM0psWVhSbFJXeGxiV1Z1ZENoY0luUnZjQzF3YkdGNVpYSXRiR2x6ZEZ3aUtTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQmthWE5qYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JoWkc5d2RHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElFZHlhV1JNWVhsdmRYUWdkWE5sWkNCaWVTQjBhR2x6SUVScFkyVkNiMkZ5WkNCMGJ5QnNZWGx2ZFhRZ2RHaGxJR1JwWTJVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3UjNKcFpFeGhlVzkxZEgxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2JHRjViM1YwS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyeGhlVzkxZEM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQzRnVG05MFpTd2dkRzhnWVdOMGRXRnNiSGtnZEdoeWIzY2dkR2hsSUdScFkyVWdkWE5sWEc0Z0lDQWdJQ29nZTBCc2FXNXJJSFJvY205M1JHbGpaWDB1SUZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMVJ2Y0VScFpWdGRmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdXeTR1TG5Sb2FYTXVaMlYwUld4bGJXVnVkSE5DZVZSaFowNWhiV1VvWENKMGIzQXRaR2xsWENJcFhUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYldGNGFXMTFiU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR0YwSUdOaGJpQmlaU0J3ZFhRZ2IyNGdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDUxYldKbGNuMGdWR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVXNJREFnUENCdFlYaHBiWFZ0TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCdFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1c1lYbHZkWFF1YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdkMmxrZEdnZ2IyWWdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElIZHBaSFJvS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhKQmRIUnlhV0oxZEdVb2RHaHBjeXdnVjBsRVZFaGZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMWRKUkZSSUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYUdWcFoyaDBJRzltSUhSb2FYTWdZbTloY21RdVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYUdWcFoyaDBLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFVHOXphWFJwZG1WT2RXMWlaWEpCZEhSeWFXSjFkR1VvZEdocGN5d2dTRVZKUjBoVVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUlSVWxIU0ZRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JrYVhOd1pYSnphVzl1SUd4bGRtVnNJRzltSUhSb2FYTWdZbTloY21RdVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsemNHVnljMmx2YmlncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeVFYUjBjbWxpZFhSbEtIUm9hWE1zSUVSSlUxQkZVbE5KVDA1ZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCemFYcGxJRzltSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR1JwWlZOcGVtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU2gwYUdsekxDQkVTVVZmVTBsYVJWOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU5oYmlCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RZ1ltVWdaSEpoWjJkbFpEOWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1FtOXZiR1ZoYm4xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1pHbHpZV0pzWldSRWNtRm5aMmx1WjBScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSQ2IyOXNaV0Z1UVhSMGNtbGlkWFJsS0hSb2FYTXNJRVJTUVVkSFNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOaGJpQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUWdZbVVnYUdWc1pDQmllU0JoSUZCc1lYbGxjajljYmlBZ0lDQWdLaUJBZEhsd1pTQjdRbTl2YkdWaGJuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2x6WVdKc1pXUkliMnhrYVc1blJHbGpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVb2RHaHBjeXdnU0U5TVJFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJTd2dSRVZHUVZWTVZGOUlUMHhFU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklISnZkR0YwYVc1bklHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDQmthWE5oWW14bFpEOWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1FtOXZiR1ZoYm4xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1pHbHpZV0pzWldSU2IzUmhkR2x1WjBScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJuWlhSQ2IyOXNaV0Z1UVhSMGNtbGlkWFJsS0hSb2FYTXNJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgxSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmtkWEpoZEdsdmJpQnBiaUJ0Y3lCMGJ5QndjbVZ6Y3lCMGFHVWdiVzkxYzJVZ0x5QjBiM1ZqYUNCaElHUnBaU0JpWldadmNtVWdhWFFnWW1WcmIyMWxjMXh1SUNBZ0lDQXFJR2hsYkdRZ1lua2dkR2hsSUZCc1lYbGxjaTRnU1hRZ2FHRnpJRzl1YkhrZ1lXNGdaV1ptWldOMElIZG9aVzRnZEdocGN5NW9iMnhrWVdKc1pVUnBZMlVnUFQwOVhHNGdJQ0FnSUNvZ2RISjFaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHaHZiR1JFZFhKaGRHbHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRWhQVEVSZlJGVlNRVlJKVDA1ZlFWUlVVa2xDVlZSRkxDQkVSVVpCVlV4VVgwaFBURVJmUkZWU1FWUkpUMDRwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQndiR0Y1WlhKeklIQnNZWGxwYm1jZ2IyNGdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdFViM0JRYkdGNVpYSmJYWDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnY0d4aGVXVnljeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVjWFZsY25sVFpXeGxZM1J2Y2loY0luUnZjQzF3YkdGNVpYSXRiR2x6ZEZ3aUtTNXdiR0Y1WlhKek8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFRnpJSEJzWVhsbGNpd2dkR2h5YjNjZ2RHaGxJR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdWRzl3VUd4aGVXVnlmU0JiY0d4aGVXVnlJRDBnUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU1hTQXRJRlJvWlZ4dUlDQWdJQ0FxSUhCc1lYbGxjaUIwYUdGMElHbHpJSFJvY205M2FXNW5JSFJvWlNCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0VWIzQkVhV1ZiWFgwZ1ZHaGxJSFJvY205M2JpQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUXVJRlJvYVhNZ2JHbHpkQ0J2WmlCa2FXTmxJR2x6SUhSb1pTQnpZVzFsSUdGeklIUm9hWE1nVkc5d1JHbGpaVUp2WVhKa0ozTWdlMEJ6WldVZ1pHbGpaWDBnY0hKdmNHVnlkSGxjYmlBZ0lDQWdLaTljYmlBZ0lDQjBhSEp2ZDBScFkyVW9jR3hoZVdWeUlEMGdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h3YkdGNVpYSWdKaVlnSVhCc1lYbGxjaTVvWVhOVWRYSnVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhJdWMzUmhjblJVZFhKdUtDazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZEdocGN5NWthV05sTG1admNrVmhZMmdvWkdsbElEMCtJR1JwWlM1MGFISnZkMGwwS0NrcE8xeHVJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2gwYUdsekxDQjBhR2x6TG14aGVXOTFkQzVzWVhsdmRYUW9kR2hwY3k1a2FXTmxLU2s3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtUnBZMlU3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVkMmx1Wkc5M0xtTjFjM1J2YlVWc1pXMWxiblJ6TG1SbFptbHVaU2hjSW5SdmNDMWthV05sTFdKdllYSmtYQ0lzSUZSdmNFUnBZMlZDYjJGeVpDazdYRzVjYm1WNGNHOXlkQ0I3WEc0Z0lDQWdWRzl3UkdsalpVSnZZWEprTEZ4dUlDQWdJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXNYRzRnSUNBZ1JFVkdRVlZNVkY5SVQweEVYMFJWVWtGVVNVOU9MRnh1SUNBZ0lFUkZSa0ZWVEZSZlYwbEVWRWdzWEc0Z0lDQWdSRVZHUVZWTVZGOUlSVWxIU0ZRc1hHNGdJQ0FnUkVWR1FWVk1WRjlFU1ZOUVJWSlRTVTlPTEZ4dUlDQWdJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkZ4dWZUdGNiaUlzSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSUNoaktTQXlNREU0TENBeU1ERTVJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1Y2JpOHZhVzF3YjNKMElIdERiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlJR1p5YjIwZ1hDSXVMMlZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpNXFjMXdpTzF4dWFXMXdiM0owSUh0U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOOUlHWnliMjBnWENJdUwyMXBlR2x1TDFKbFlXUlBibXg1UVhSMGNtbGlkWFJsY3k1cWMxd2lPMXh1YVcxd2IzSjBJSHQyWVd4cFpHRjBaWDBnWm5KdmJTQmNJaTR2ZG1Gc2FXUmhkR1V2ZG1Gc2FXUmhkR1V1YW5OY0lqdGNibHh1THlvcVhHNGdLaUJBYlc5a2RXeGxYRzRnS2k5Y2JtTnZibk4wSUVOSlVrTk1SVjlFUlVkU1JVVlRJRDBnTXpZd095QXZMeUJrWldkeVpXVnpYRzVqYjI1emRDQk9WVTFDUlZKZlQwWmZVRWxRVXlBOUlEWTdJQzh2SUVSbFptRjFiSFFnTHlCeVpXZDFiR0Z5SUhOcGVDQnphV1JsWkNCa2FXVWdhR0Z6SURZZ2NHbHdjeUJ0WVhocGJYVnRMbHh1WTI5dWMzUWdSRVZHUVZWTVZGOURUMHhQVWlBOUlGd2lTWFp2Y25sY0lqdGNibU52Ym5OMElFUkZSa0ZWVEZSZldDQTlJREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgxa2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVNUMVJCVkVsUFRpQTlJREE3SUM4dklHUmxaM0psWlhOY2JtTnZibk4wSUVSRlJrRlZURlJmVDFCQlEwbFVXU0E5SURBdU5UdGNibHh1WTI5dWMzUWdRMDlNVDFKZlFWUlVVa2xDVlZSRklEMGdYQ0pqYjJ4dmNsd2lPMXh1WTI5dWMzUWdTRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVWdQU0JjSW1obGJHUXRZbmxjSWp0Y2JtTnZibk4wSUZCSlVGTmZRVlJVVWtsQ1ZWUkZJRDBnWENKd2FYQnpYQ0k3WEc1amIyNXpkQ0JTVDFSQlZFbFBUbDlCVkZSU1NVSlZWRVVnUFNCY0luSnZkR0YwYVc5dVhDSTdYRzVqYjI1emRDQllYMEZVVkZKSlFsVlVSU0E5SUZ3aWVGd2lPMXh1WTI5dWMzUWdXVjlCVkZSU1NVSlZWRVVnUFNCY0lubGNJanRjYmx4dVkyOXVjM1FnUWtGVFJWOUVTVVZmVTBsYVJTQTlJREV3TURzZ0x5OGdjSGhjYm1OdmJuTjBJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJRDBnTVRVN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxTlVVazlMUlY5WFNVUlVTQ0E5SURJdU5Uc2dMeThnY0hoY2JtTnZibk4wSUUxSlRsOVRWRkpQUzBWZlYwbEVWRWdnUFNBeE95QXZMeUJ3ZUZ4dVkyOXVjM1FnU0VGTVJpQTlJRUpCVTBWZlJFbEZYMU5KV2tVZ0x5QXlPeUF2THlCd2VGeHVZMjl1YzNRZ1ZFaEpVa1FnUFNCQ1FWTkZYMFJKUlY5VFNWcEZJQzhnTXpzZ0x5OGdjSGhjYm1OdmJuTjBJRkJKVUY5VFNWcEZJRDBnUWtGVFJWOUVTVVZmVTBsYVJTQXZJREUxT3lBdkwzQjRYRzVqYjI1emRDQlFTVkJmUTA5TVQxSWdQU0JjSW1Kc1lXTnJYQ0k3WEc1Y2JtTnZibk4wSUdSbFp6SnlZV1FnUFNBb1pHVm5LU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJR1JsWnlBcUlDaE5ZWFJvTGxCSklDOGdNVGd3S1R0Y2JuMDdYRzVjYm1OdmJuTjBJR2x6VUdsd1RuVnRZbVZ5SUQwZ2JpQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ2JuVnRZbVZ5SUQwZ2NHRnljMlZKYm5Rb2Jpd2dNVEFwTzF4dUlDQWdJSEpsZEhWeWJpQk9kVzFpWlhJdWFYTkpiblJsWjJWeUtHNTFiV0psY2lrZ0ppWWdNU0E4UFNCdWRXMWlaWElnSmlZZ2JuVnRZbVZ5SUR3OUlFNVZUVUpGVWw5UFJsOVFTVkJUTzF4dWZUdGNibHh1THlvcVhHNGdLaUJIWlc1bGNtRjBaU0JoSUhKaGJtUnZiU0J1ZFcxaVpYSWdiMllnY0dsd2N5QmlaWFIzWldWdUlERWdZVzVrSUhSb1pTQk9WVTFDUlZKZlQwWmZVRWxRVXk1Y2JpQXFYRzRnS2lCQWNtVjBkWEp1Y3lCN1RuVnRZbVZ5ZlNCQklISmhibVJ2YlNCdWRXMWlaWElnYml3Z01TRGlpYVFnYmlEaWlhUWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLaTljYm1OdmJuTjBJSEpoYm1SdmJWQnBjSE1nUFNBb0tTQTlQaUJOWVhSb0xtWnNiMjl5S0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJPVlUxQ1JWSmZUMFpmVUVsUVV5a2dLeUF4TzF4dVhHNWpiMjV6ZENCRVNVVmZWVTVKUTA5RVJWOURTRUZTUVVOVVJWSlRJRDBnVzF3aTRwcUFYQ0lzWENMaW1vRmNJaXhjSXVLYWdsd2lMRndpNHBxRFhDSXNYQ0xpbW9SY0lpeGNJdUthaFZ3aVhUdGNibHh1THlvcVhHNGdLaUJEYjI1MlpYSjBJR0VnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsSUdaaFkyVWdkRzhnZEdobElHNTFiV0psY2lCdlppQndhWEJ6SUc5bVhHNGdLaUIwYUdGMElITmhiV1VnWkdsbExpQlVhR2x6SUdaMWJtTjBhVzl1SUdseklIUm9aU0J5WlhabGNuTmxJRzltSUhCcGNITlViMVZ1YVdOdlpHVXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlIVWdMU0JVYUdVZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2RHOGdZMjl1ZG1WeWRDQjBieUJ3YVhCekxseHVJQ29nUUhKbGRIVnlibk1nZTA1MWJXSmxjbngxYm1SbFptbHVaV1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUc1MWJXSmxjaUJ2WmlCd2FYQnpMQ0F4SU9LSnBDQndhWEJ6SU9LSnBDQTJMQ0J2Y2x4dUlDb2dkVzVrWldacGJtVmtJR2xtSUhVZ2QyRnpJRzV2ZENCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlISmxjSEpsYzJWdWRHbHVaeUJoSUdScFpTNWNiaUFxTDF4dVkyOXVjM1FnZFc1cFkyOWtaVlJ2VUdsd2N5QTlJQ2gxS1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnWkdsbFEyaGhja2x1WkdWNElEMGdSRWxGWDFWT1NVTlBSRVZmUTBoQlVrRkRWRVZTVXk1cGJtUmxlRTltS0hVcE8xeHVJQ0FnSUhKbGRIVnliaUF3SUR3OUlHUnBaVU5vWVhKSmJtUmxlQ0EvSUdScFpVTm9ZWEpKYm1SbGVDQXJJREVnT2lCMWJtUmxabWx1WldRN1hHNTlPMXh1WEc0dktpcGNiaUFxSUVOdmJuWmxjblFnWVNCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaUIwYnlCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeVhHNGdLaUJ5WlhCeVpYTmxiblJoZEdsdmJpQnZaaUIwYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJrYVdVZ1ptRmpaUzRnVkdocGN5Qm1kVzVqZEdsdmJpQnBjeUIwYUdVZ2NtVjJaWEp6WlZ4dUlDb2diMllnZFc1cFkyOWtaVlJ2VUdsd2N5NWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2NDQXRJRlJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjeUIwYnlCamIyNTJaWEowSUhSdklHRWdkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSXVYRzRnS2lCQWNtVjBkWEp1Y3lCN1UzUnlhVzVuZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhKeklHOXlYRzRnS2lCMWJtUmxabWx1WldRZ2FXWWdjQ0IzWVhNZ2JtOTBJR0psZEhkbFpXNGdNU0JoYm1RZ05pQnBibU5zZFhOcGRtVXVYRzRnS2k5Y2JtTnZibk4wSUhCcGNITlViMVZ1YVdOdlpHVWdQU0J3SUQwK0lHbHpVR2x3VG5WdFltVnlLSEFwSUQ4Z1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVMXR3SUMwZ01WMGdPaUIxYm1SbFptbHVaV1E3WEc1Y2JtTnZibk4wSUhKbGJtUmxja2h2YkdRZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dzSUdOdmJHOXlLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdVMFZRUlZKQlZFOVNJRDBnZDJsa2RHZ2dMeUF6TUR0Y2JpQWdJQ0JqYjI1MFpYaDBMbk5oZG1Vb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1kc2IySmhiRUZzY0doaElEMGdSRVZHUVZWTVZGOVBVRUZEU1ZSWk8xeHVJQ0FnSUdOdmJuUmxlSFF1WW1WbmFXNVFZWFJvS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVtYVd4c1UzUjViR1VnUFNCamIyeHZjanRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWg0SUNzZ2QybGtkR2dzSUhrZ0t5QjNhV1IwYUN3Z2QybGtkR2dnTFNCVFJWQkZVa0ZVVDFJc0lEQXNJRElnS2lCTllYUm9MbEJKTENCbVlXeHpaU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzV5WlhOMGIzSmxLQ2s3WEc1OU8xeHVYRzVqYjI1emRDQnlaVzVrWlhKRWFXVWdQU0FvWTI5dWRHVjRkQ3dnZUN3Z2VTd2dkMmxrZEdnc0lHTnZiRzl5S1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnVTBOQlRFVWdQU0FvZDJsa2RHZ2dMeUJJUVV4R0tUdGNiaUFnSUNCamIyNXpkQ0JJUVV4R1gwbE9Ua1ZTWDFOSldrVWdQU0JOWVhSb0xuTnhjblFvZDJsa2RHZ2dLaW9nTWlBdklESXBPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tVZ1BTQXlJQ29nU0VGTVJsOUpUazVGVWw5VFNWcEZPMXh1SUNBZ0lHTnZibk4wSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5QTlJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJQ29nVTBOQlRFVTdYRzRnSUNBZ1kyOXVjM1FnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUQwZ1NVNU9SVkpmVTBsYVJTQXRJRElnS2lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTTdYRzRnSUNBZ1kyOXVjM1FnVTFSU1QwdEZYMWRKUkZSSUlEMGdUV0YwYUM1dFlYZ29UVWxPWDFOVVVrOUxSVjlYU1VSVVNDd2dRa0ZUUlY5VFZGSlBTMFZmVjBsRVZFZ2dLaUJUUTBGTVJTazdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRmdnUFNCNElDc2dkMmxrZEdnZ0xTQklRVXhHWDBsT1RrVlNYMU5KV2tVZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk03WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJaSUQwZ2VTQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRk8xeHVYRzRnSUNBZ1kyOXVkR1Y0ZEM1ellYWmxLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWlaV2RwYmxCaGRHZ29LVHRjYmlBZ0lDQmpiMjUwWlhoMExtWnBiR3hUZEhsc1pTQTlJR052Ykc5eU8xeHVJQ0FnSUdOdmJuUmxlSFF1YzNSeWIydGxVM1I1YkdVZ1BTQmNJbUpzWVdOclhDSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1c2FXNWxWMmxrZEdnZ1BTQlRWRkpQUzBWZlYwbEVWRWc3WEc0Z0lDQWdZMjl1ZEdWNGRDNXRiM1psVkc4b2MzUmhjblJZTENCemRHRnlkRmtwTzF4dUlDQWdJR052Ym5SbGVIUXViR2x1WlZSdktITjBZWEowV0NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDd2djM1JoY25SWktUdGNiaUFnSUNCamIyNTBaWGgwTG1GeVl5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTQXJJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0JrWldjeWNtRmtLREkzTUNrc0lHUmxaekp5WVdRb01Da3BPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVlJ2S0hOMFlYSjBXQ0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnYzNSaGNuUlpJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUNzZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFzSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQmtaV2N5Y21Ga0tEQXBMQ0JrWldjeWNtRmtLRGt3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QkpUazVGVWw5VFNWcEZLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ3NJSE4wWVhKMFdTQXJJRWxPVGtWU1gxTkpXa1ZmVWs5VlRrUkZSQ0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCa1pXY3ljbUZrS0Rrd0tTd2daR1ZuTW5KaFpDZ3hPREFwS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0xTQlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5azdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3hPREFwTENCa1pXY3ljbUZrS0RJM01Da3BPMXh1WEc0Z0lDQWdZMjl1ZEdWNGRDNXpkSEp2YTJVb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1acGJHd29LVHRjYmlBZ0lDQmpiMjUwWlhoMExuSmxjM1J2Y21Vb0tUdGNibjA3WEc1Y2JtTnZibk4wSUhKbGJtUmxjbEJwY0NBOUlDaGpiMjUwWlhoMExDQjRMQ0I1TENCM2FXUjBhQ2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuUmxlSFF1YzJGMlpTZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVltVm5hVzVRWVhSb0tDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNVM1I1YkdVZ1BTQlFTVkJmUTA5TVQxSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1dGIzWmxWRzhvZUN3Z2VTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9lQ3dnZVN3Z2QybGtkR2dzSURBc0lESWdLaUJOWVhSb0xsQkpMQ0JtWVd4elpTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWNiaTh2SUZCeWFYWmhkR1VnY0hKdmNHVnlkR2xsYzF4dVkyOXVjM1FnWDJKdllYSmtJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWpiMnh2Y2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYUdWc1pFSjVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXdhWEJ6SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl5YjNSaGRHbHZiaUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYmk4cUtseHVJQ29nVkc5d1JHbGxJR2x6SUhSb1pTQmNJblJ2Y0Mxa2FXVmNJaUJqZFhOMGIyMGdXMGhVVFV4Y2JpQXFJR1ZzWlcxbGJuUmRLR2gwZEhCek9pOHZaR1YyWld4dmNHVnlMbTF2ZW1sc2JHRXViM0puTDJWdUxWVlRMMlJ2WTNNdlYyVmlMMEZRU1M5SVZFMU1SV3hsYldWdWRDa2djbVZ3Y21WelpXNTBhVzVuSUdFZ1pHbGxYRzRnS2lCdmJpQjBhR1VnWkdsalpTQmliMkZ5WkM1Y2JpQXFYRzRnS2lCQVpYaDBaVzVrY3lCSVZFMU1SV3hsYldWdWRGeHVJQ29nUUcxcGVHVnpJRzF2WkhWc1pUcHRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhOK1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNGdLaTljYm1OdmJuTjBJRlJ2Y0VScFpTQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWektFaFVUVXhGYkdWdFpXNTBLU0I3WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCdVpYY2dWRzl3UkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtIdHdhWEJ6TENCamIyeHZjaXdnY205MFlYUnBiMjRzSUhnc0lIa3NJR2hsYkdSQ2VYMGdQU0I3ZlNrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lncE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIQnBjSE5XWVd4MVpTQTlJSFpoYkdsa1lYUmxMbWx1ZEdWblpYSW9jR2x3Y3lCOGZDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFFTVkJUWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WW1WMGQyVmxiaWd4TENBMktWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1SbFptRjFiSFJVYnloeVlXNWtiMjFRYVhCektDa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhCcGNITldZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGQkpVRk5mUVZSVVVrbENWVlJGTENCd2FYQnpWbUZzZFdVcE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdVkyOXNiM0lnUFNCMllXeHBaR0YwWlM1amIyeHZjaWhqYjJ4dmNpQjhmQ0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgwTlBURTlTS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtOTBZWFJwYjI0Z1BTQjJZV3hwWkdGMFpTNXBiblJsWjJWeUtISnZkR0YwYVc5dUlIeDhJSFJvYVhNdVoyVjBRWFIwY21saWRYUmxLRkpQVkVGVVNVOU9YMEZVVkZKSlFsVlVSU2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVZbVYwZDJWbGJpZ3dMQ0F6TmpBcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1WkdWbVlYVnNkRlJ2S0VSRlJrRlZURlJmVWs5VVFWUkpUMDRwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVkbUZzZFdVN1hHNWNiaUFnSUNBZ0lDQWdkR2hwY3k1NElEMGdkbUZzYVdSaGRHVXVhVzUwWldkbGNpaDRJSHg4SUhSb2FYTXVaMlYwUVhSMGNtbGlkWFJsS0ZoZlFWUlVVa2xDVlZSRktTbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1c1lYSm5aWEpVYUdGdUtEQXBYRzRnSUNBZ0lDQWdJQ0FnSUNBdVpHVm1ZWFZzZEZSdktFUkZSa0ZWVEZSZldDbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1MllXeDFaVHRjYmx4dUlDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCMllXeHBaR0YwWlM1cGJuUmxaMlZ5S0hrZ2ZId2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9XVjlCVkZSU1NVSlZWRVVwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbXhoY21kbGNsUm9ZVzRvTUNsY2JpQWdJQ0FnSUNBZ0lDQWdJQzVrWldaaGRXeDBWRzhvUkVWR1FWVk1WRjlaS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWFHVnNaRUo1SUQwZ2RtRnNhV1JoZEdVdWMzUnlhVzVuS0dobGJHUkNlU0I4ZkNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoSVJVeEVYMEpaWDBGVVZGSkpRbFZVUlNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Ym05MFJXMXdkSGtvS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVJsWm1GMWJIUlVieWh1ZFd4c0tWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5aaGJIVmxPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdRMDlNVDFKZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQlFTVkJUWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRkpQVkVGVVNVOU9YMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGaGZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1dWOUJWRlJTU1VKVlZFVmNiaUFnSUNBZ0lDQWdYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnWDJKdllYSmtMbk5sZENoMGFHbHpMQ0IwYUdsekxuQmhjbVZ1ZEU1dlpHVXBPMXh1SUNBZ0lDQWdJQ0JmWW05aGNtUXVaMlYwS0hSb2FYTXBMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRVYyWlc1MEtGd2lkRzl3TFdScFpUcGhaR1JsWkZ3aUtTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1pHbHpZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdJQ0FnSUY5aWIyRnlaQzVuWlhRb2RHaHBjeWt1WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBdFpHbGxPbkpsYlc5MlpXUmNJaWtwTzF4dUlDQWdJQ0FnSUNCZlltOWhjbVF1YzJWMEtIUm9hWE1zSUc1MWJHd3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdkR2hwY3lCRWFXVWdkRzhnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWElnYjJZZ1lTQmthV1VnWm1GalpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxTjBjbWx1WjMwZ1ZHaGxJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUc1MWJXSmxjaUJ2Wmx4dUlDQWdJQ0FxSUhCcGNITWdiMllnZEdocGN5QkVhV1V1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlWYm1samIyUmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY0dsd2MxUnZWVzVwWTI5a1pTaDBhR2x6TG5CcGNITXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJSE4wY21sdVp5QnlaWEJ5WlhObGJtRjBhVzl1SUdadmNpQjBhR2x6SUdScFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxTjBjbWx1WjMwZ1ZHaGxJSFZ1YVdOdlpHVWdjM2x0WW05c0lHTnZjbkpsYzNCdmJtUnBibWNnZEc4Z2RHaGxJRzUxYldKbGNpQnZaaUJ3YVhCelhHNGdJQ0FnSUNvZ2IyWWdkR2hwY3lCa2FXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHOVRkSEpwYm1jb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG5SdlZXNXBZMjlrWlNncE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nUkdsbEozTWdiblZ0WW1WeUlHOW1JSEJwY0hNc0lERWc0b21rSUhCcGNITWc0b21rSURZdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YVhCektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYM0JwY0hNdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nUkdsbEozTWdZMjlzYjNJdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VTNSeWFXNW5mVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JqYjJ4dmNpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlqYjJ4dmNpNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVJQ0FnSUhObGRDQmpiMnh2Y2lodVpYZERiMnh2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQVDBnYm1WM1EyOXNiM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VOUFRFOVNYMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZZMjlzYjNJdWMyVjBLSFJvYVhNc0lFUkZSa0ZWVEZSZlEwOU1UMUlwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYMk52Ykc5eUxuTmxkQ2gwYUdsekxDQnVaWGREYjJ4dmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUc1bGQwTnZiRzl5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjaUIwYUdGMElHbHpJR2h2YkdScGJtY2dkR2hwY3lCRWFXVXNJR2xtSUdGdWVTNGdUblZzYkNCdmRHaGxjbmRwYzJVdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Vkc5d1VHeGhlV1Z5Zkc1MWJHeDlJRnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWld4a1Fua29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmYUdWc1pFSjVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJR2hsYkdSQ2VTaHdiR0Y1WlhJcElIdGNiaUFnSUNBZ0lDQWdYMmhsYkdSQ2VTNXpaWFFvZEdocGN5d2djR3hoZVdWeUtUdGNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDA5SUhCc1lYbGxjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvWENKb1pXeGtMV0o1WENJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKb1pXeGtMV0o1WENJc0lIQnNZWGxsY2k1MGIxTjBjbWx1WnlncEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCamIyOXlaR2x1WVhSbGN5QnZaaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdERiMjl5WkdsdVlYUmxjM3h1ZFd4c2ZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmpiMjl5WkdsdVlYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dQVDA5SUhSb2FYTXVlQ0I4ZkNCdWRXeHNJRDA5UFNCMGFHbHpMbmtnUHlCdWRXeHNJRG9nZTNnNklIUm9hWE11ZUN3Z2VUb2dkR2hwY3k1NWZUdGNiaUFnSUNCOVhHNGdJQ0FnYzJWMElHTnZiM0prYVc1aGRHVnpLR01wSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJR01wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWVDQTlJRzUxYkd3N1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxua2dQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJWN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjdlQ3dnZVgwZ1BTQmpPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTU0SUQwZ2VEdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVlU0E5SUhrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkViMlZ6SUhSb2FYTWdSR2xsSUdoaGRtVWdZMjl2Y21ScGJtRjBaWE0vWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElIZG9aVzRnZEdobElFUnBaU0JrYjJWeklHaGhkbVVnWTI5dmNtUnBibUYwWlhOY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JvWVhORGIyOXlaR2x1WVhSbGN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzUxYkd3Z0lUMDlJSFJvYVhNdVkyOXZjbVJwYm1GMFpYTTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhnZ1kyOXZjbVJwYm1GMFpWeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnZUNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOTRMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJSGdvYm1WM1dDa2dlMXh1SUNBZ0lDQWdJQ0JmZUM1elpYUW9kR2hwY3l3Z2JtVjNXQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0Z3aWVGd2lMQ0J1WlhkWUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZVNCamIyOXlaR2x1WVhSbFhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0I1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gza3VaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCelpYUWdlU2h1WlhkWktTQjdYRzRnSUNBZ0lDQWdJRjk1TG5ObGRDaDBhR2x6TENCdVpYZFpLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKNVhDSXNJRzVsZDFrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J5YjNSaGRHbHZiaUJ2WmlCMGFHbHpJRVJwWlM0Z01DRGlpYVFnY205MFlYUnBiMjRnNG9ta0lETTJNQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOGJuVnNiSDFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnY205MFlYUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZmNtOTBZWFJwYjI0dVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2NtOTBZWFJwYjI0b2JtVjNVaWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBUMGdibVYzVWlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaVzF2ZG1WQmRIUnlhV0oxZEdVb1hDSnliM1JoZEdsdmJsd2lLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUc1dmNtMWhiR2w2WldSU2IzUmhkR2x2YmlBOUlHNWxkMUlnSlNCRFNWSkRURVZmUkVWSFVrVkZVenRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOXliM1JoZEdsdmJpNXpaWFFvZEdocGN5d2dibTl5YldGc2FYcGxaRkp2ZEdGMGFXOXVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGd2ljbTkwWVhScGIyNWNJaXdnYm05eWJXRnNhWHBsWkZKdmRHRjBhVzl1S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9jbTkzSUhSb2FYTWdSR2xsTGlCVWFHVWdiblZ0WW1WeUlHOW1JSEJwY0hNZ2RHOGdZU0J5WVc1a2IyMGdiblZ0WW1WeUlHNHNJREVnNG9ta0lHNGc0b21rSURZdVhHNGdJQ0FnSUNvZ1QyNXNlU0JrYVdObElIUm9ZWFFnWVhKbElHNXZkQ0JpWldsdVp5Qm9aV3hrSUdOaGJpQmlaU0IwYUhKdmQyNHVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFabWx5WlhNZ1hDSjBiM0E2ZEdoeWIzY3RaR2xsWENJZ2QybDBhQ0J3WVhKaGJXVjBaWEp6SUhSb2FYTWdSR2xsTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSFJvY205M1NYUW9LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hkR2hwY3k1cGMwaGxiR1FvS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNCcGNITXVjMlYwS0hSb2FYTXNJSEpoYm1SdmJWQnBjSE1vS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTd2dkR2hwY3k1d2FYQnpLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBNmRHaHliM2N0WkdsbFhDSXNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrWlhSaGFXdzZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxPaUIwYUdselhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjaUJvYjJ4a2N5QjBhR2x6SUVScFpTNGdRU0J3YkdGNVpYSWdZMkZ1SUc5dWJIa2dhRzlzWkNCaElHUnBaU0IwYUdGMElHbHpJRzV2ZEZ4dUlDQWdJQ0FxSUdKbGFXNW5JR2hsYkdRZ1lua2dZVzV2ZEdobGNpQndiR0Y1WlhJZ2VXVjBMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZDJodklIZGhiblJ6SUhSdklHaHZiR1FnZEdocGN5QkVhV1V1WEc0Z0lDQWdJQ29nUUdacGNtVnpJRndpZEc5d09taHZiR1F0WkdsbFhDSWdkMmwwYUNCd1lYSmhiV1YwWlhKeklIUm9hWE1nUkdsbElHRnVaQ0IwYUdVZ2NHeGhlV1Z5TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR2h2YkdSSmRDaHdiR0Y1WlhJcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0NGMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1obGJHUkNlU0E5SUhCc1lYbGxjanRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUlhabGJuUW9YQ0owYjNBNmFHOXNaQzFrYVdWY0lpd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JsZEdGcGJEb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVTZJSFJvYVhNc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJzWVhsbGNseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRWx6SUhSb2FYTWdSR2xsSUdKbGFXNW5JR2hsYkdRZ1lua2dZVzU1SUhCc1lYbGxjajljYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMEp2YjJ4bFlXNTlJRlJ5ZFdVZ2QyaGxiaUIwYUdseklFUnBaU0JwY3lCaVpXbHVaeUJvWld4a0lHSjVJR0Z1ZVNCd2JHRjVaWElzSUdaaGJITmxJRzkwYUdWeWQybHpaUzVjYmlBZ0lDQWdLaTljYmlBZ0lDQnBjMGhsYkdRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzSUNFOVBTQjBhR2x6TG1obGJHUkNlVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2NHeGhlV1Z5SUhKbGJHVmhjMlZ6SUhSb2FYTWdSR2xsTGlCQklIQnNZWGxsY2lCallXNGdiMjVzZVNCeVpXeGxZWE5sSUdScFkyVWdkR2hoZENCemFHVWdhWE5jYmlBZ0lDQWdLaUJvYjJ4a2FXNW5MbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFViM0JRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZDJodklIZGhiblJ6SUhSdklISmxiR1ZoYzJVZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbkpsYkdGelpTMWthV1ZjSWlCM2FYUm9JSEJoY21GdFpYUmxjbk1nZEdocGN5QkVhV1VnWVc1a0lIUm9aU0J3YkdGNVpYSWdjbVZzWldGemFXNW5JR2wwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSEpsYkdWaGMyVkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YVhOSVpXeGtLQ2tnSmlZZ2RHaHBjeTVvWld4a1Fua3VaWEYxWVd4ektIQnNZWGxsY2lrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VoRlRFUmZRbGxmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1EzVnpkRzl0UlhabGJuUW9YQ0owYjNBNmNtVnNaV0Z6WlMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZKbGJtUmxjaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMkZ1ZG1GelVtVnVaR1Z5YVc1blEyOXVkR1Y0ZERKRWZTQmpiMjUwWlhoMElDMGdWR2hsSUdOaGJuWmhjeUJqYjI1MFpYaDBJSFJ2SUdSeVlYZGNiaUFnSUNBZ0tpQnZibHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE5kSUMwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUhSdlhHNGdJQ0FnSUNvZ1pISmhkeUIwYUdseklHUnBaUzRnUW5rZ1pHVm1ZWFZzZEN3Z2RHaHBjeUJrYVdVZ2FYTWdaSEpoZDI0Z1lYUWdhWFJ6SUc5M2JpQmpiMjl5WkdsdVlYUmxjeXhjYmlBZ0lDQWdLaUJpZFhRZ2VXOTFJR05oYmlCaGJITnZJR1J5WVhjZ2FYUWdaV3h6Wlhkb1pYSmxJR2xtSUhOdklHNWxaV1JsWkM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0J5Wlc1a1pYSW9ZMjl1ZEdWNGRDd2daR2xsVTJsNlpTd2dZMjl2Y21ScGJtRjBaWE1nUFNCMGFHbHpMbU52YjNKa2FXNWhkR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOallXeGxJRDBnWkdsbFUybDZaU0F2SUVKQlUwVmZSRWxGWDFOSldrVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTklRVXhHSUQwZ1NFRk1SaUFxSUhOallXeGxPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQlRWRWhKVWtRZ1BTQlVTRWxTUkNBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVUVsUVgxTkpXa1VnUFNCUVNWQmZVMGxhUlNBcUlITmpZV3hsTzF4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdOdmIzSmthVzVoZEdWek8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKSWIyeGtLR052Ym5SbGVIUXNJSGdzSUhrc0lGTklRVXhHTENCMGFHbHpMbWhsYkdSQ2VTNWpiMnh2Y2lrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb01DQWhQVDBnZEdocGN5NXliM1JoZEdsdmJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1MGNtRnVjMnhoZEdVb2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1eWIzUmhkR1VvWkdWbk1uSmhaQ2gwYUdsekxuSnZkR0YwYVc5dUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5SeVlXNXpiR0YwWlNndE1TQXFJQ2g0SUNzZ1UwaEJURVlwTENBdE1TQXFJQ2g1SUNzZ1UwaEJURVlwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsYm1SbGNrUnBaU2hqYjI1MFpYaDBMQ0I0TENCNUxDQlRTRUZNUml3Z2RHaHBjeTVqYjJ4dmNpazdYRzVjYmlBZ0lDQWdJQ0FnYzNkcGRHTm9JQ2gwYUdsekxuQnBjSE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyRnpaU0F4T2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJREk2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUF5SUNvZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ016b2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBME9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ01pQXFJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRFU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lBeUlDb2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUU0VGTVJpd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdOam9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWkdWbVlYVnNkRG9nTHk4Z1RtOGdiM1JvWlhJZ2RtRnNkV1Z6SUdGc2JHOTNaV1FnTHlCd2IzTnphV0pzWlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUTJ4bFlYSWdZMjl1ZEdWNGRGeHVJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuTmxkRlJ5WVc1elptOXliU2d4TENBd0xDQXdMQ0F4TENBd0xDQXdLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNTNhVzVrYjNjdVkzVnpkRzl0Uld4bGJXVnVkSE11WkdWbWFXNWxLRndpZEc5d0xXUnBaVndpTENCVWIzQkVhV1VwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBaU3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVko5SUdaeWIyMGdYQ0l1TDFSdmNGQnNZWGxsY2k1cWMxd2lPMXh1WEc0dktpcGNiaUFxSUZSdmNGQnNZWGxsY2t4cGMzUWdkRzhnWkdWelkzSnBZbVVnZEdobElIQnNZWGxsY25NZ2FXNGdkR2hsSUdkaGJXVXVYRzRnS2x4dUlDb2dRR1Y0ZEdWdVpITWdTRlJOVEVWc1pXMWxiblJjYmlBcUwxeHVZMjl1YzNRZ1ZHOXdVR3hoZVdWeVRHbHpkQ0E5SUdOc1lYTnpJR1Y0ZEdWdVpITWdTRlJOVEVWc1pXMWxiblFnZTF4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EzSmxZWFJsSUdFZ2JtVjNJRlJ2Y0ZCc1lYbGxja3hwYzNRdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb0tTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1kyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lENDlJSFJvYVhNdWNHeGhlV1Z5Y3k1c1pXNW5kR2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVlYQndaVzVrUTJocGJHUW9SRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdVlXUmtSWFpsYm5STWFYTjBaVzVsY2loY0luUnZjRHB6ZEdGeWRDMTBkWEp1WENJc0lDaGxkbVZ1ZENrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMjVzZVNCdmJtVWdjR3hoZVdWeUlHTmhiaUJvWVhabElHRWdkSFZ5YmlCaGRDQmhibmtnWjJsMlpXNGdkR2x0WlM1Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNHeGhlV1Z5YzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM1bWFXeDBaWElvY0NBOVBpQWhjQzVsY1hWaGJITW9aWFpsYm5RdVpHVjBZV2xzTG5Cc1lYbGxjaWtwWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTG1admNrVmhZMmdvY0NBOVBpQndMbVZ1WkZSMWNtNG9LU2s3WEc0Z0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdScGMyTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCd2JHRjVaWEp6SUdsdUlIUm9hWE1nYkdsemRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0VWIzQlFiR0Y1WlhKYlhYMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdjR3hoZVdWeWN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRnN1TGk1MGFHbHpMbWRsZEVWc1pXMWxiblJ6UW5sVVlXZE9ZVzFsS0Z3aWRHOXdMWEJzWVhsbGNsd2lLVjA3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVkMmx1Wkc5M0xtTjFjM1J2YlVWc1pXMWxiblJ6TG1SbFptbHVaU2hjSW5SdmNDMXdiR0Y1WlhJdGJHbHpkRndpTENCVWIzQlFiR0Y1WlhKTWFYTjBLVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JVYjNCUWJHRjVaWEpNYVhOMFhHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2k5Y2JtbHRjRzl5ZENCN1ZHOXdSR2xqWlVKdllYSmtmU0JtY205dElGd2lMaTlVYjNCRWFXTmxRbTloY21RdWFuTmNJanRjYm1sdGNHOXlkQ0I3Vkc5d1JHbGxmU0JtY205dElGd2lMaTlVYjNCRWFXVXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeWZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeVRHbHpkSDBnWm5KdmJTQmNJaTR2Vkc5d1VHeGhlV1Z5VEdsemRDNXFjMXdpTzF4dVhHNTNhVzVrYjNjdWRIZGxiblI1YjI1bGNHbHdjeUE5SUhkcGJtUnZkeTUwZDJWdWRIbHZibVZ3YVhCeklIeDhJRTlpYW1WamRDNW1jbVZsZW1Vb2UxeHVJQ0FnSUZaRlVsTkpUMDQ2SUZ3aU1DNHdMakZjSWl4Y2JpQWdJQ0JNU1VORlRsTkZPaUJjSWt4SFVFd3RNeTR3WENJc1hHNGdJQ0FnVjBWQ1UwbFVSVG9nWENKb2RIUndjem92TDNSM1pXNTBlVzl1WlhCcGNITXViM0puWENJc1hHNGdJQ0FnVkc5d1JHbGpaVUp2WVhKa09pQlViM0JFYVdObFFtOWhjbVFzWEc0Z0lDQWdWRzl3UkdsbE9pQlViM0JFYVdVc1hHNGdJQ0FnVkc5d1VHeGhlV1Z5T2lCVWIzQlFiR0Y1WlhJc1hHNGdJQ0FnVkc5d1VHeGhlV1Z5VEdsemREb2dWRzl3VUd4aGVXVnlUR2x6ZEZ4dWZTazdYRzRpWFN3aWJtRnRaWE1pT2xzaWRtRnNhV1JoZEdVaUxDSkRUMHhQVWw5QlZGUlNTVUpWVkVVaUxDSmZZMjlzYjNJaVhTd2liV0Z3Y0dsdVozTWlPaUpCUVVGQk96czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRVFpDUVN4TlFVRk5MR3RDUVVGclFpeEhRVUZITEdOQlFXTXNTMEZCU3l4RFFVRkRPenM3T3pzN096dEpRVkV6UXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhGUVVGRk8xRkJRMnBDTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRMUVVOc1FqdERRVU5LT3p0QlEzaERSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVVZCT3pzN08wRkJTVUVzVFVGQlRTeHpRa0ZCYzBJc1IwRkJSeXhIUVVGSExFTkJRVU03TzBGQlJXNURMRTFCUVUwc1pVRkJaU3hIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTzBsQlF6TkNMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBOQlEzSkZMRU5CUVVNN096dEJRVWRHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4UFFVRlBMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU01UWl4TlFVRk5MRXRCUVVzc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6VkNMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETlVJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXk5Q0xFMUJRVTBzVjBGQlZ5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRiRU1zVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenM3T3pzN096dEJRV2RDT1VJc1RVRkJUU3hWUVVGVkxFZEJRVWNzVFVGQlRUczdPenM3T3p0SlFVOXlRaXhYUVVGWExFTkJRVU03VVVGRFVpeExRVUZMTzFGQlEwd3NUVUZCVFR0UlFVTk9MRlZCUVZVN1VVRkRWaXhQUVVGUE8wdEJRMVlzUjBGQlJ5eEZRVUZGTEVWQlFVVTdVVUZEU2l4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTndRaXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenM3VVVGRmVFSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1IwRkJSeXhWUVVGVkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhQUVVGUExFTkJRVU03VVVGRGRrSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRGJrSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03UzBGRGVFSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN1NVRkZSQ3hKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEVkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3V1VGRFVDeE5RVUZOTEVsQlFVa3NhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5dzJRMEZCTmtNc1JVRkJSU3hEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTXZSanRSUVVORUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1MwRkRhRVE3T3pzN096czdPMGxCVVVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlExWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8xbEJRMUFzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zT0VOQlFUaERMRVZCUVVVc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEYUVjN1VVRkRSQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOeVFpeEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMHRCUTJoRU96czdPenM3T3p0SlFWRkVMRWxCUVVrc2JVSkJRVzFDTEVkQlFVYzdVVUZEZEVJc1QwRkJUeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1MwRkRiRU03T3pzN096czdPenM3U1VGVlJDeEpRVUZKTEZWQlFWVXNSMEZCUnp0UlFVTmlMRTlCUVU4c1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3U1VGRlJDeEpRVUZKTEZWQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRaQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZEVUN4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl4clJFRkJhMFFzUlVGQlJTeERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOd1J6dFJRVU5FTEU5QlFVOHNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEYmtNN096czdPenM3TzBsQlVVUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROMEk3TzBsQlJVUXNTVUZCU1N4UFFVRlBMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRMW9zU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRkZPMWxCUTFRc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc0swTkJRU3RETEVWQlFVVXNSVUZCUlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGJFYzdVVUZEUkN4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzB0QlEyaEVPenRKUVVWRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUVUZCVFN4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhQUVVGUExGTkJRVk1zUzBGQlN5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOeVF6czdTVUZGUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU40UWpzN096czdPenM3U1VGUlJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXhRanM3T3pzN096czdTVUZSUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNeFFqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEUxQlFVMHNSMEZCUnl4SFFVRkhMR1ZCUVdVc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOb1JDeE5RVUZOTEVkQlFVY3NSMEZCUnl4bFFVRmxMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08xRkJSV2hFTEU5QlFVOHNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRGNrSTdPenM3T3pzN096czdPenRKUVZsRUxFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVTdVVUZEVkN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xbEJRM2hETEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETEhsRFFVRjVReXhGUVVGRkxFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRekZKT3p0UlFVVkVMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUXpkQ0xFMUJRVTBzV1VGQldTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZlRUlzUzBGQlN5eE5RVUZOTEVkQlFVY3NTVUZCU1N4SlFVRkpMRVZCUVVVN1dVRkRjRUlzU1VGQlNTeEhRVUZITEVOQlFVTXNZMEZCWXl4RlFVRkZMRWxCUVVrc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGT3pzN08yZENRVWwwUXl4cFFrRkJhVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1lVRkRMMElzVFVGQlRUdG5Ra0ZEU0N4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJGQlF6RkNPMU5CUTBvN08xRkJSVVFzVFVGQlRTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRVZCUVVVc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRU5CUVVNN1VVRkRPVVVzVFVGQlRTeGpRVUZqTEVkQlFVY3NTVUZCU1N4RFFVRkRMSE5DUVVGelFpeERRVUZETEVkQlFVY3NSVUZCUlN4cFFrRkJhVUlzUTBGQlF5eERRVUZET3p0UlFVVXpSU3hMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEZsQlFWa3NSVUZCUlR0WlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRkRVVzVFVGQlRTeFZRVUZWTEVkQlFVY3NZMEZCWXl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8xbEJReTlETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1YwRkJWeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZET3p0WlFVVjBReXhIUVVGSExFTkJRVU1zVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXp0WlFVTjRSQ3hIUVVGSExFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWRCUVVjc2MwSkJRWE5DTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRka1lzYVVKQlFXbENMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFOQlF5OUNPenRSUVVWRUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMR2xDUVVGcFFpeERRVUZETEVOQlFVTTdPMUZCUlc1RExFOUJRVThzYVVKQlFXbENMRU5CUVVNN1MwRkROVUk3T3pzN096czdPenM3TzBsQlYwUXNjMEpCUVhOQ0xFTkJRVU1zUjBGQlJ5eEZRVUZGTEdsQ1FVRnBRaXhGUVVGRk8xRkJRek5ETEUxQlFVMHNVMEZCVXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzVFVGQlRTeFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenM3VVVGRmJFUXNUMEZCVHl4VFFVRlRMRU5CUVVNc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeExRVUZMTEVkQlFVY3NVVUZCVVN4RlFVRkZPMWxCUXpkRExFdEJRVXNzVFVGQlRTeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJUdG5Ra0ZETVVNc1NVRkJTU3hUUVVGVExFdEJRVXNzU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1NVRkJTU3hGUVVGRkxHbENRVUZwUWl4RFFVRkRMRVZCUVVVN2IwSkJRMnhGTEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YVVKQlEzWkNPMkZCUTBvN08xbEJSVVFzUzBGQlN5eEZRVUZGTEVOQlFVTTdVMEZEV0RzN1VVRkZSQ3hQUVVGUExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1MwRkRhRU03T3pzN096czdPenM3T3p0SlFWbEVMR0ZCUVdFc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRGFrSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU40UWl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZET3p0UlFVVTFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eExRVUZMTEVWQlFVVTdXVUZEWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVONlF5eE5RVUZOTzFsQlEwZ3NTMEZCU3l4SlFVRkpMRWRCUVVjc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NSVUZCUlN4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRVZCUVVVN1owSkJRMnBGTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRemxFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRha1U3TzFsQlJVUXNTMEZCU3l4SlFVRkpMRWRCUVVjc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU53UlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU01UkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMnBGTzFOQlEwbzdPMUZCUlVRc1QwRkJUeXhMUVVGTExFTkJRVU03UzBGRGFFSTdPenM3T3pzN096czdPMGxCVjBRc1dVRkJXU3hEUVVGRExFbEJRVWtzUlVGQlJTeHBRa0ZCYVVJc1JVRkJSVHRSUVVOc1F5eFBRVUZQTEZOQlFWTXNTMEZCU3l4cFFrRkJhVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1IwRkJSeXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZETTBjN096czdPenM3T3p0SlFWTkVMR0ZCUVdFc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFlpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVOcVJUczdPenM3T3pzN096dEpRVlZFTEdGQlFXRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdFJRVU4wUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSVHRaUVVNNVJDeFBRVUZQTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFZEJRVWNzUTBGQlF6dFRRVU5xUXp0UlFVTkVMRTlCUVU4c1UwRkJVeXhEUVVGRE8wdEJRM0JDT3pzN096czdPenM3T3p0SlFWZEVMRzlDUVVGdlFpeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTndRaXhQUVVGUExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkVPenM3T3pzN096czdPenRKUVZkRUxHOUNRVUZ2UWl4RFFVRkRMRTFCUVUwc1JVRkJSVHRSUVVONlFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSVHRaUVVONFF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0VFFVTmFPMUZCUTBRc1QwRkJUeXhUUVVGVExFTkJRVU03UzBGRGNFSTdPenM3T3pzN096czdPenM3TzBsQlkwUXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRka0lzVFVGQlRTeFZRVUZWTEVkQlFVYzdXVUZEWml4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVOcVF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTndReXhEUVVGRE96dFJRVVZHTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVVUZET1VNc1RVRkJUU3hQUVVGUExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU0xUXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEU5QlFVOHNRMEZCUXp0UlFVTjRReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlF6ZERMRTFCUVUwc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NVVUZCVVN4RFFVRkRPenRSUVVVeFF5eE5RVUZOTEZOQlFWTXNSMEZCUnl4RFFVRkRPMWxCUTJZc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNWVUZCVlN4RFFVRkRPMWxCUTJwRExGRkJRVkVzUlVGQlJTeFBRVUZQTEVkQlFVY3NVVUZCVVR0VFFVTXZRaXhGUVVGRk8xbEJRME1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNN1owSkJRMnhDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSenRuUWtGRGJrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dGhRVU14UWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxGRkJRVkVzUjBGQlJ5eFJRVUZSTzFOQlEyaERMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGRrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSE8yRkJRM1JDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1QwRkJUeXhIUVVGSExGTkJRVk03VTBGRGFFTXNSVUZCUlR0WlFVTkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzJkQ1FVTnNRaXhIUVVGSExFVkJRVVVzVlVGQlZTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMmRDUVVOMlFpeEhRVUZITEVWQlFVVXNWVUZCVlN4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8yRkJRekZDTEVOQlFVTTdXVUZEUml4UlFVRlJMRVZCUVVVc1VVRkJVU3hIUVVGSExGTkJRVk03VTBGRGFrTXNRMEZCUXl4RFFVRkRPenRSUVVWSUxFMUJRVTBzVFVGQlRTeEhRVUZITEZOQlFWTTdPMkZCUlc1Q0xFMUJRVTBzUTBGQlF5eERRVUZETEZGQlFWRXNTMEZCU3l4VFFVRlRMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6czdZVUZGT1VNc1RVRkJUU3hEUVVGRExFTkJRVU1zVVVGQlVTeExRVUZMTzJkQ1FVTnNRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4dlFrRkJiMElzUTBGQlF5eEhRVUZITEVOQlFVTXNWMEZCVnl4RFFVRkRMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU03YlVKQlEzUkZMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdPMkZCUlhKRUxFMUJRVTA3WjBKQlEwZ3NRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hMUVVGTExGRkJRVkVzUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhSUVVGUkxFZEJRVWNzU1VGQlNUdG5Ra0ZEZGtVc1EwRkJReXhEUVVGRExFVkJRVVVzVTBGQlV5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVNdlFpeERRVUZET3p0UlFVVk9MRTlCUVU4c1UwRkJVeXhMUVVGTExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRE9VVTdPenM3T3pzN096dEpRVk5FTEV0QlFVc3NRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVONFFpeExRVUZMTEUxQlFVMHNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdXVUZETDBJc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRE96dFpRVVV2UWl4TlFVRk5MRWxCUVVrc1IwRkJSeXhEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTNwRUxFMUJRVTBzU1VGQlNTeEhRVUZITEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03TzFsQlJYcEVMRWxCUVVrc1NVRkJTU3hKUVVGSkxFbEJRVWtzUlVGQlJUdG5Ra0ZEWkN4UFFVRlBMRWRCUVVjc1EwRkJRenRoUVVOa08xTkJRMG83TzFGQlJVUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1MwRkRaanM3T3pzN096czdPenRKUVZWRUxHTkJRV01zUTBGQlF5eExRVUZMTEVWQlFVVXNUVUZCVFN4RlFVRkZPMUZCUXpGQ0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzUkVPenM3T3pzN096czdTVUZUUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdVVUZEZEVJc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRMUVVONlJEczdPenM3T3pzN08wbEJVMFFzWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMnhDTEU5QlFVODdXVUZEU0N4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVOcVF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTndReXhEUVVGRE8wdEJRMHc3UTBGRFNqczdRVU53WmtRN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdRVUVyUWtFc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4RFFVRkRMRWxCUVVrc1MwRkJTenRKUVVOcVF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVONlF5eFBRVUZQTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFhRVUZYTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1EwRkRNVVlzUTBGQlF6czdPenM3T3pzN1FVRlJSaXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRU5CUVVNc1IwRkJSenM3T3pzN096czdPenM3T3p0SlFXRXpRaXhqUVVGakxFZEJRVWNzUTBGQlF6czdPenM3T3pzN096czdPenM3T3p0UlFXZENaQ3gzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hGUVVGRkxGRkJRVkVzUlVGQlJUczdPenRaUVVrdlF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4clFrRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTXhReXhKUVVGSkxFbEJRVWtzUTBGQlF5eFRRVUZUTEVsQlFVa3NVVUZCVVN4TFFVRkxMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZPMmRDUVVOd1JDeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTXpRenRUUVVOS08wdEJRMG83TzBGRGFFWk1PenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFMUJRVTBzWlVGQlpTeEhRVUZITEdOQlFXTXNTMEZCU3l4RFFVRkRPMGxCUTNoRExGZEJRVmNzUTBGQlF5eEhRVUZITEVWQlFVVTdVVUZEWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRFpEdERRVU5LT3p0QlEzWkNSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVVZCTEUxQlFVMHNUVUZCVFN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE4wSXNUVUZCVFN4aFFVRmhMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU53UXl4TlFVRk5MRTlCUVU4c1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZET3p0QlFVVTVRaXhOUVVGTkxHRkJRV0VzUjBGQlJ5eE5RVUZOTzBsQlEzaENMRmRCUVZjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhGUVVGRk8xRkJRelZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzaENMR0ZCUVdFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRPMUZCUTNSRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRemRDT3p0SlFVVkVMRWxCUVVrc1RVRkJUU3hIUVVGSE8xRkJRMVFzVDBGQlR5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRek5DT3p0SlFVVkVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlR5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNdlJEczdTVUZGUkN4SlFVRkpMRTFCUVUwc1IwRkJSenRSUVVOVUxFOUJRVThzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNMVFqczdTVUZGUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8wdEJRMnhET3p0SlFVVkVMRk5CUVZNc1EwRkJReXhWUVVGVkxFVkJRVVU3VVVGRGJFSXNZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTTdVVUZEY0VNc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFpqczdTVUZGUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhUUVVGVExFVkJRVVVzWVVGQllTeEhRVUZITEVWQlFVVXNSVUZCUlN4VFFVRlRMRWRCUVVjc1pVRkJaU3hEUVVGRExFVkJRVVU3VVVGRGFrVXNUVUZCVFN4WFFVRlhMRWRCUVVjc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1VVRkRla1FzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlR0WlFVTmtMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03TzFsQlJYWkVMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUXpOQ096dFJRVVZFTEU5QlFVOHNTVUZCU1N4RFFVRkRPMHRCUTJZN1EwRkRTanM3UVVNdlJFUTdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ0UWtFc1FVRkZRU3hOUVVGTkxGVkJRVlVzUjBGQlJ5eGpRVUZqTEdWQlFXVXNRMEZCUXp0SlFVTTNReXhYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNqczdRVU42UWtRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFTeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExHTkJRV01zWlVGQlpTeERRVUZETzBsQlEyNUVMRmRCUVZjc1EwRkJReXhIUVVGSExFVkJRVVU3VVVGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRaRHREUVVOS096dEJRM3BDUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVsQkxFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc1EwRkJReXhEUVVGRE8wRkJRMmhETEUxQlFVMHNiMEpCUVc5Q0xFZEJRVWNzWTBGQll5eGhRVUZoTEVOQlFVTTdTVUZEY2tRc1YwRkJWeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5tTEVsQlFVa3NTMEZCU3l4SFFVRkhMSEZDUVVGeFFpeERRVUZETzFGQlEyeERMRTFCUVUwc1dVRkJXU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMUZCUXpORExFMUJRVTBzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1VVRkZiRUlzU1VGQlNTeE5RVUZOTEVOQlFVTXNVMEZCVXl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRM3BDTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1UwRkRha0lzVFVGQlRTeEpRVUZKTEZGQlFWRXNTMEZCU3l4UFFVRlBMRXRCUVVzc1JVRkJSVHRaUVVOc1F5eE5RVUZOTEZkQlFWY3NSMEZCUnl4UlFVRlJMRU5CUVVNc1MwRkJTeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1RVRkJUU3hEUVVGRExGTkJRVk1zUTBGQlF5eFhRVUZYTEVOQlFVTXNSVUZCUlR0blFrRkRMMElzUzBGQlN5eEhRVUZITEZkQlFWY3NRMEZCUXp0aFFVTjJRaXhOUVVGTk8yZENRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hWUVVGVkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTjBRenRUUVVOS0xFMUJRVTA3V1VGRFNDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1owSkJRV2RDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNMVF6czdVVUZGUkN4TFFVRkxMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzV1VGQldTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRlRU03TzBsQlJVUXNWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRSUVVOV0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkRiRU1zWVVGQllTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNKQ0xFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRmRCUVZjc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFdDeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRaaXhUUVVGVExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRE8xbEJRMnhETEdGQlFXRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOeVFpeERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlR0UlFVTldMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFpRVU5tTEZOQlFWTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTTVSQ3hoUVVGaExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUTNoQ0xFTkJRVU1zUTBGQlF6dExRVU5PTzBOQlEwbzdPMEZEYkVWRU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlIwRXNUVUZCVFN4dlFrRkJiMElzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3h0UWtGQmJVSXNSMEZCUnl4alFVRmpMR0ZCUVdFc1EwRkJRenRKUVVOd1JDeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTJZc1NVRkJTU3hMUVVGTExFZEJRVWNzYjBKQlFXOUNMRU5CUVVNN1VVRkRha01zVFVGQlRTeFpRVUZaTEVkQlFVY3NiMEpCUVc5Q0xFTkJRVU03VVVGRE1VTXNUVUZCVFN4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE96dFJRVVZzUWl4SlFVRkpMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xTkJRMnBDTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdPMGxCUlVRc1VVRkJVU3hIUVVGSE8xRkJRMUFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlJTeExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5PMU5CUTNSRExFTkJRVU1zUTBGQlF6dExRVU5PTzBOQlEwbzdPMEZETTBORU96czdPenM3T3pzN096czdPenM3T3pzN08wRkJiVUpCTEVGQlEwRTdRVUZEUVN4QlFVVkJMRTFCUVUwc2JVSkJRVzFDTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTNCRExFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1kwRkJZeXhoUVVGaExFTkJRVU03U1VGRGJrUXNWMEZCVnl4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVObUxFbEJRVWtzUzBGQlN5eEhRVUZITEcxQ1FVRnRRaXhEUVVGRE8xRkJRMmhETEUxQlFVMHNXVUZCV1N4SFFVRkhMRzFDUVVGdFFpeERRVUZETzFGQlEzcERMRTFCUVUwc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6czdVVUZGYkVJc1NVRkJTU3hSUVVGUkxFdEJRVXNzVDBGQlR5eExRVUZMTEVWQlFVVTdXVUZETTBJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU5xUWl4TlFVRk5PMWxCUTBnc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdkQ1FVRm5RaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETlVNN08xRkJSVVFzUzBGQlN5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzaERPME5CUTBvN08wRkRkRU5FT3pzN096czdPenM3T3pzN096czdPenM3TzBGQmJVSkJMRUZCU1VFc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4TFFVRkxMRU5CUVVNN1FVRkRjRU1zVFVGQlRTeHZRa0ZCYjBJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU55UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NjVUpCUVhGQ0xFTkJRVU03VVVGRGJFTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTTdVVUZETTBNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxFdEJRVXNzV1VGQldTeFBRVUZQTEVWQlFVVTdXVUZETVVJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU5xUWl4TlFVRk5MRWxCUVVrc1VVRkJVU3hMUVVGTExFOUJRVThzUzBGQlN5eEZRVUZGTzFsQlEyeERMRWxCUVVrc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0blFrRkRja0lzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0aFFVTm9RaXhOUVVGTkxFbEJRVWtzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRE4wSXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJRenRoUVVOcVFpeE5RVUZOTzJkQ1FVTklMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeFZRVUZWTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOMFF6dFRRVU5LTEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0xUXpzN1VVRkZSQ3hMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNXVUZCV1N4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGVFTTdPMGxCUlVRc1RVRkJUU3hIUVVGSE8xRkJRMHdzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFMUJRVTBzU1VGQlNTeExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5PMU5CUTNoRExFTkJRVU1zUTBGQlF6dExRVU5PT3p0SlFVVkVMRTlCUVU4c1IwRkJSenRSUVVOT0xFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTm1MRk5CUVZNc1JVRkJSU3hOUVVGTkxFdEJRVXNzUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFR0VFFVTjZReXhEUVVGRExFTkJRVU03UzBGRFRqdERRVU5LT3p0QlF6RkVSRHM3T3pzN096czdPenM3T3pzN096czdPenRCUVcxQ1FTeEJRVXRCTEUxQlFVMHNVMEZCVXl4SFFVRkhMRTFCUVUwN1NVRkRjRUlzVjBGQlZ5eEhRVUZITzB0QlEySTdPMGxCUlVRc1QwRkJUeXhEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5ZTEU5QlFVOHNTVUZCU1N4dlFrRkJiMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0TFFVTXhRenM3U1VGRlJDeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZPMUZCUTFRc1QwRkJUeXhKUVVGSkxHdENRVUZyUWl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wdEJRM2hET3p0SlFVVkVMRTlCUVU4c1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFdDeFBRVUZQTEVsQlFVa3NiMEpCUVc5Q0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdTMEZETVVNN08wbEJSVVFzVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlR0UlFVTldMRTlCUVU4c1NVRkJTU3h0UWtGQmJVSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRMUVVONlF6czdRMEZGU2l4RFFVRkRPenRCUVVWR0xFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1NVRkJTU3hUUVVGVExFVkJRVVU3TzBGRE9VTXhRenM3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFYTkNRU3hCUVVsQk8wRkJRMEVzVFVGQlRTeGxRVUZsTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTJoRExFMUJRVTBzWTBGQll5eEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRU5CUVVNN096dEJRVWQwUXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETlVJc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTNRaXhOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenM3T3pzN096czdPenM3T3pzN096czdPenRCUVc5Q0wwSXNUVUZCVFN4VFFVRlRMRWRCUVVjc1kwRkJZeXhyUWtGQmEwSXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJRenM3T3pzN096czdPenM3T3p0SlFXRTFSQ3hYUVVGWExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVTdVVUZETlVNc1MwRkJTeXhGUVVGRkxFTkJRVU03TzFGQlJWSXNUVUZCVFN4VlFVRlZMRWRCUVVkQkxHdENRVUZSTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRMMFVzU1VGQlNTeFZRVUZWTEVOQlFVTXNUMEZCVHl4RlFVRkZPMWxCUTNCQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1UwRkRiRVFzVFVGQlRUdFpRVU5JTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5dzBRMEZCTkVNc1EwRkJReXhEUVVGRE8xTkJRemxGT3p0UlFVVkVMRTFCUVUwc1UwRkJVeXhIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemRGTEVsQlFVa3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSVHRaUVVOdVFpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU4wUWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHTkJRV01zUlVGQlJTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1UwRkRhRVFzVFVGQlRUdFpRVU5JTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5d3lRMEZCTWtNc1EwRkJReXhEUVVGRE8xTkJRemRGT3p0UlFVVkVMRTFCUVUwc1ZVRkJWU3hIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnBHTEVsQlFVa3NWVUZCVlN4RFFVRkRMRTlCUVU4c1JVRkJSVHRaUVVOd1FpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU40UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1UwRkRiRVFzVFVGQlRUczdXVUZGU0N4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMU5CUTNwRE96dFJRVVZFTEUxQlFVMHNXVUZCV1N4SFFVRkhRU3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4UFFVRlBMRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8yRkJRMnhHTEUxQlFVMHNSVUZCUlN4RFFVRkRPMUZCUTJRc1NVRkJTU3haUVVGWkxFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlEzUkNMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMWxCUXpWQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdVMEZEYkVRc1RVRkJUVHM3V1VGRlNDeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU42UWl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1UwRkROVU03UzBGRFNqczdTVUZGUkN4WFFVRlhMR3RDUVVGclFpeEhRVUZITzFGQlF6VkNMRTlCUVU4N1dVRkRTQ3hsUVVGbE8xbEJRMllzWTBGQll6dFpRVU5rTEdWQlFXVTdXVUZEWml4clFrRkJhMEk3VTBGRGNrSXNRMEZCUXp0TFFVTk1PenRKUVVWRUxHbENRVUZwUWl4SFFVRkhPMHRCUTI1Q096dEpRVVZFTEc5Q1FVRnZRaXhIUVVGSE8wdEJRM1JDT3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ6dFJRVU5RTEU5QlFVOHNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU14UWpzN096czdPenRKUVU5RUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4SlFVRkpMRXRCUVVzc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXpSRHRKUVVORUxFbEJRVWtzUzBGQlN5eERRVUZETEZGQlFWRXNSVUZCUlR0UlFVTm9RaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEVsQlFVa3NTMEZCU3l4UlFVRlJMRVZCUVVVN1dVRkRia0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRUUVVONlF5eE5RVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVMEZEYUVRN1MwRkRTanM3T3pzN096dEpRVTlFTEZOQlFWTXNSMEZCUnp0UlFVTlNMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJUdFpRVU5zUWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEZkQlFWY3NRMEZCUXl4blFrRkJaMElzUlVGQlJUdG5Ra0ZETlVRc1RVRkJUU3hGUVVGRk8yOUNRVU5LTEUxQlFVMHNSVUZCUlN4SlFVRkpPMmxDUVVObU8yRkJRMG9zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVUR0UlFVTkVMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETlVNc1QwRkJUeXhKUVVGSkxFTkJRVU03UzBGRFpqczdPenM3U1VGTFJDeFBRVUZQTEVkQlFVYzdVVUZEVGl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03UzBGRE5VTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNTVUZCU1N4TFFVRkxMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZEZEVNN096czdPenM3U1VGUFJDeFJRVUZSTEVkQlFVYzdVVUZEVUN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjZRanM3T3pzN096czdPMGxCVTBRc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJUdFJRVU5XTEUxQlFVMHNTVUZCU1N4SFFVRkhMRkZCUVZFc1MwRkJTeXhQUVVGUExFdEJRVXNzUjBGQlJ5eExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJRenRSUVVNMVJDeFBRVUZQTEV0QlFVc3NTMEZCU3l4SlFVRkpMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdTMEZETDBNN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExGbEJRVmtzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXpzN096czdPenM3TzBGQlUzUkVMRTFCUVUwc2NVSkJRWEZDTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenM3UVVOc1QzUkZPenM3T3pzN096czdPenM3T3pzN096czdPenRCUVc5Q1FTeEJRVWxCT3pzN08wRkJTVUVzVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhIUVVGSExFTkJRVU03UVVGRE4wSXNUVUZCVFN4eFFrRkJjVUlzUjBGQlJ5eEhRVUZITEVOQlFVTTdRVUZEYkVNc1RVRkJUU3c0UWtGQk9FSXNSMEZCUnl4TFFVRkxMRU5CUVVNN1FVRkROME1zVFVGQlRTdzJRa0ZCTmtJc1IwRkJSeXhMUVVGTExFTkJRVU03UVVGRE5VTXNUVUZCVFN3NFFrRkJPRUlzUjBGQlJ5eExRVUZMTEVOQlFVTTdPMEZCUlRkRExFMUJRVTBzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTm9RaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMEZCUldoQ0xFMUJRVTBzWVVGQllTeEhRVUZITEVsQlFVa3NSMEZCUnl4blFrRkJaMElzUTBGQlF6dEJRVU01UXl4TlFVRk5MR05CUVdNc1IwRkJSeXhKUVVGSkxFZEJRVWNzWjBKQlFXZENMRU5CUVVNN1FVRkRMME1zVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenM3UVVGRmFFUXNUVUZCVFN4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRE96dEJRVVZ3UWl4TlFVRk5MR1ZCUVdVc1IwRkJSeXhQUVVGUExFTkJRVU03UVVGRGFFTXNUVUZCVFN4blFrRkJaMElzUjBGQlJ5eFJRVUZSTEVOQlFVTTdRVUZEYkVNc1RVRkJUU3h2UWtGQmIwSXNSMEZCUnl4WlFVRlpMRU5CUVVNN1FVRkRNVU1zVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhWUVVGVkxFTkJRVU03UVVGRGRFTXNUVUZCVFN4blEwRkJaME1zUjBGQlJ5eDNRa0ZCZDBJc1EwRkJRenRCUVVOc1JTeE5RVUZOTEN0Q1FVRXJRaXhIUVVGSExIVkNRVUYxUWl4RFFVRkRPMEZCUTJoRkxFMUJRVTBzWjBOQlFXZERMRWRCUVVjc2QwSkJRWGRDTEVOQlFVTTdRVUZEYkVVc1RVRkJUU3gxUWtGQmRVSXNSMEZCUnl4bFFVRmxMRU5CUVVNN096dEJRVWRvUkN4TlFVRk5MRmRCUVZjc1IwRkJSeXhEUVVGRExGbEJRVmtzUlVGQlJTeGhRVUZoTEVkQlFVY3NRMEZCUXl4TFFVRkxPMGxCUTNKRUxFMUJRVTBzVFVGQlRTeEhRVUZITEZGQlFWRXNRMEZCUXl4WlFVRlpMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE1VTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEdGQlFXRXNSMEZCUnl4TlFVRk5MRU5CUVVNN1EwRkRlRVFzUTBGQlF6czdRVUZGUml4TlFVRk5MR2xDUVVGcFFpeEhRVUZITEVOQlFVTXNXVUZCV1N4RlFVRkZMRmxCUVZrc1MwRkJTenRKUVVOMFJDeFBRVUZQUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTTdVMEZEYUVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5pTEZOQlFWTXNRMEZCUXl4WlFVRlpMRU5CUVVNN1UwRkRka0lzUzBGQlN5eERRVUZETzBOQlEyUXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxEQkNRVUV3UWl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFbEJRVWtzUlVGQlJTeFpRVUZaTEV0QlFVczdTVUZEYUVVc1NVRkJTU3hQUVVGUExFTkJRVU1zV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMUZCUXpWQ0xFMUJRVTBzVjBGQlZ5eEhRVUZITEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGREwwTXNUMEZCVHl4cFFrRkJhVUlzUTBGQlF5eFhRVUZYTEVWQlFVVXNXVUZCV1N4RFFVRkRMRU5CUVVNN1MwRkRka1E3U1VGRFJDeFBRVUZQTEZsQlFWa3NRMEZCUXp0RFFVTjJRaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNWVUZCVlN4SFFVRkhMRU5CUVVNc1lVRkJZU3hGUVVGRkxGTkJRVk1zUlVGQlJTeFpRVUZaTEV0QlFVczdTVUZETTBRc1NVRkJTU3hUUVVGVExFdEJRVXNzWVVGQllTeEpRVUZKTEUxQlFVMHNTMEZCU3l4aFFVRmhMRVZCUVVVN1VVRkRla1FzVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWml4TlFVRk5MRWxCUVVrc1QwRkJUeXhMUVVGTExHRkJRV0VzUlVGQlJUdFJRVU5zUXl4UFFVRlBMRXRCUVVzc1EwRkJRenRMUVVOb1FpeE5RVUZOTzFGQlEwZ3NUMEZCVHl4WlFVRlpMRU5CUVVNN1MwRkRka0k3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc2JVSkJRVzFDTEVkQlFVY3NRMEZCUXl4UFFVRlBMRVZCUVVVc1NVRkJTU3hGUVVGRkxGbEJRVmtzUzBGQlN6dEpRVU42UkN4SlFVRkpMRTlCUVU4c1EwRkJReXhaUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdVVUZETlVJc1RVRkJUU3hYUVVGWExFZEJRVWNzVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVNdlF5eFBRVUZQTEZWQlFWVXNRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhYUVVGWExFVkJRVVVzVFVGQlRTeERRVUZETEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3haUVVGWkxFTkJRVU1zUTBGQlF6dExRVU5zUmpzN1NVRkZSQ3hQUVVGUExGbEJRVmtzUTBGQlF6dERRVU4yUWl4RFFVRkRPenM3UVVGSFJpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE9VSXNUVUZCVFN4alFVRmpMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU55UXl4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN08wRkJSWHBETEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZET3p0QlFVVXZSQ3hOUVVGTkxGbEJRVmtzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0SlFVTTFRaXhKUVVGSkxGTkJRVk1zUzBGQlN5eHJRa0ZCYTBJc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdVVUZETjBNc2EwSkJRV3RDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU53UXpzN1NVRkZSQ3hQUVVGUExHdENRVUZyUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dERRVU40UXl4RFFVRkRPenRCUVVWR0xFMUJRVTBzWlVGQlpTeEhRVUZITEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1MwRkJTenRKUVVOMlF5eHJRa0ZCYTBJc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eEZRVUZGTEZsQlFWa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF6dERRVU12UkN4RFFVRkRPenRCUVVWR0xFMUJRVTBzVDBGQlR5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRmxCUVZrc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenM3UVVGRmNrVXNUVUZCVFN4WFFVRlhMRWRCUVVjc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXl4SlFVRkpMRXRCUVVzN1NVRkRPVU1zU1VGQlNTeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1VVRkRhRUlzVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0UlFVVXhSQ3hMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVsQlFVa3NSVUZCUlR0WlFVTndRaXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdVMEZETjBNN1MwRkRTanREUVVOS0xFTkJRVU03T3pzN1FVRkpSaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6dEJRVU4wUXl4TlFVRk5MRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdRVUZETlVJc1RVRkJUU3hKUVVGSkxFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzV1VGQldTeEhRVUZITEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJRenRCUVVNMVF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03T3p0QlFVZHdReXhOUVVGTkxHZERRVUZuUXl4SFFVRkhMRU5CUVVNc1RVRkJUU3hGUVVGRkxFOUJRVThzUlVGQlJTeFBRVUZQTEV0QlFVczdTVUZEYmtVc1RVRkJUU3hUUVVGVExFZEJRVWNzVFVGQlRTeERRVUZETEhGQ1FVRnhRaXhGUVVGRkxFTkJRVU03TzBsQlJXcEVMRTFCUVUwc1EwRkJReXhIUVVGSExFOUJRVThzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4SlFVRkpMRTFCUVUwc1EwRkJReXhMUVVGTExFZEJRVWNzVTBGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMGxCUTNSRkxFMUJRVTBzUTBGQlF5eEhRVUZITEU5QlFVOHNSMEZCUnl4VFFVRlRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eE5RVUZOTEVkQlFVY3NVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE96dEpRVVYyUlN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBOQlEycENMRU5CUVVNN08wRkJSVVlzVFVGQlRTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dEpRVU5vUXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPenM3U1VGSGJFTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRMmhDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVOcVFpeEpRVUZKTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1NVRkRka0lzU1VGQlNTeGpRVUZqTEVkQlFVY3NTVUZCU1N4RFFVRkRPMGxCUXpGQ0xFbEJRVWtzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXpzN1NVRkZka0lzVFVGQlRTeFBRVUZQTEVkQlFVY3NUVUZCVFR0UlFVTnNRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eExRVUZMTEVsQlFVa3NXVUZCV1N4TFFVRkxMRXRCUVVzc1JVRkJSVHM3V1VGRk1VTXNUVUZCVFN4bFFVRmxMRWRCUVVjc1MwRkJTeXhEUVVGRExHRkJRV0VzUTBGQlF5eHpRMEZCYzBNc1EwRkJReXhEUVVGRE8xbEJRM0JHTEVsQlFVa3NZMEZCWXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8yZENRVU42UWl4alFVRmpMRU5CUVVNc1UwRkJVeXhEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETzJGQlF6ZERMRTFCUVUwN1owSkJRMGdzWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJRenRoUVVNeFF6dFpRVU5FTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN08xbEJSV0lzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUTNSQ096dFJRVVZFTEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRkRUlzUTBGQlF6czdTVUZGUml4TlFVRk5MRmxCUVZrc1IwRkJSeXhOUVVGTk8xRkJRM1pDTEZkQlFWY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJTeExRVUZMTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNN1MwRkRhRVVzUTBGQlF6czdTVUZGUml4TlFVRk5MRmRCUVZjc1IwRkJSeXhOUVVGTk8xRkJRM1JDTEUxQlFVMHNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03VVVGRGFrTXNWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVOMFFpeERRVUZET3p0SlFVVkdMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRhRU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTMEZCU3l4RlFVRkZPenRaUVVWb1FpeE5RVUZOTEVkQlFVYzdaMEpCUTB3c1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTzJkQ1FVTm9RaXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVODdZVUZEYmtJc1EwRkJRenM3V1VGRlJpeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJUVkhMRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUczdaMEpCUlhwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiMEpCUVc5Q0xFVkJRVVU3YjBKQlF6TkVMRXRCUVVzc1IwRkJSeXhaUVVGWkxFTkJRVU03YjBKQlEzSkNMRmxCUVZrc1JVRkJSU3hEUVVGRE8ybENRVU5zUWl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN2IwSkJRMjVETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRMklzV1VGQldTeEZRVUZGTEVOQlFVTTdhVUpCUTJ4Q0xFMUJRVTBzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdHZRa0ZEY0VNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dHBRa0ZEYUVJN1lVRkRTanM3VTBGRlNqdExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hsUVVGbExFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZETDBJc1RVRkJUU3hqUVVGakxFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1owTkJRV2RETEVOQlFVTXNUVUZCVFN4RlFVRkZMRXRCUVVzc1EwRkJReXhQUVVGUExFVkJRVVVzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRWdzU1VGQlNTeFJRVUZSTEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUTNCQ0xFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJRenRUUVVOd1F5eE5RVUZOTEVsQlFVa3NTVUZCU1N4TFFVRkxMR05CUVdNc1JVRkJSVHRaUVVOb1F5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhOUVVGTkxFTkJRVU03VTBGRGFFTXNUVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEZOQlFWTXNRMEZCUXp0VFFVTnVRenRMUVVOS0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4SlFVRkpMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGNFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhKUVVGSkxGbEJRVmtzUzBGQlN5eExRVUZMTEVWQlFVVTdPenRaUVVjeFF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03TzFsQlJUbERMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzU1VGQlNTeFRRVUZUTEVkQlFVY3NSVUZCUlN4RlFVRkZPMmRDUVVOc1F5eExRVUZMTEVkQlFVY3NVVUZCVVN4RFFVRkRPMmRDUVVOcVFpeFhRVUZYTEVWQlFVVXNRMEZCUXpzN1owSkJSV1FzVFVGQlRTeDVRa0ZCZVVJc1IwRkJSeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhMUVVGTExHTkJRV01zUTBGQlF5eERRVUZETzJkQ1FVTnVSaXhYUVVGWExFTkJRVU1zUzBGQlN5eEZRVUZGTEhsQ1FVRjVRaXhEUVVGRExFTkJRVU03WjBKQlF6bERMRmRCUVZjc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03WVVGRGFFWTdVMEZEU2l4TlFVRk5MRWxCUVVrc1VVRkJVU3hMUVVGTExFdEJRVXNzUlVGQlJUdFpRVU16UWl4TlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNN1dVRkRjRU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVndReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU03TzFsQlJURkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eFpRVUZaTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU12UXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08wdEJRMG9zUTBGQlF6czdTVUZGUml4TlFVRk5MR1ZCUVdVc1IwRkJSeXhEUVVGRExFdEJRVXNzUzBGQlN6dFJRVU12UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhqUVVGakxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXZReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFMUJRVTBzV1VGQldTeEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8yZENRVU55UXl4SFFVRkhMRVZCUVVVc1kwRkJZenRuUWtGRGJrSXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRk8yZENRVU5VTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSVHRoUVVOYUxFTkJRVU1zUTBGQlF6czdXVUZGU0N4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFbEJRVWtzV1VGQldTeEhRVUZITEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6czdXVUZGTDBRc1kwRkJZeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFRRVUZUTEVOQlFVTTdVMEZETVVNN096dFJRVWRFTEdOQlFXTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRkRUlzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXpzN08xRkJSMklzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMHRCUTNSQ0xFTkJRVU03T3pzN096czdPMGxCVVVZc1NVRkJTU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFVkJRVVVzVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhqUVVGakxFdEJRVXM3VVVGRGVrTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1MwRkJTenRaUVVOdVFpeEpRVUZKTEZWQlFWVXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVTdaMEpCUXpkRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha1FzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdZVUZEZWtNN1dVRkRSQ3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWVUZCVlN4RFFVRkRMR05CUVdNc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRNVVVzUTBGQlF6dExRVU5NTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmxCUVZrc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM0pGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6czdTVUZGZGtRc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHZRa0ZCYjBJc1JVRkJSVHRSUVVNM1FpeE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VVc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRmRCUVZjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UXpzN1NVRkZSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEc5Q1FVRnZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xRkJRek5FTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFhRVUZYTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1MwRkRla1E3TzBsQlJVUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZWQlFWVXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRkxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhUUVVGVExFVkJRVVVzWlVGQlpTeERRVUZETEVOQlFVTTdTVUZEY0VRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3hsUVVGbExFTkJRVU1zUTBGQlF6dERRVU40UkN4RFFVRkRPenM3T3pzN096dEJRVkZHTEUxQlFVMHNXVUZCV1N4SFFVRkhMR05CUVdNc1YwRkJWeXhEUVVGRE96czdPenRKUVVzelF5eFhRVUZYTEVkQlFVYzdVVUZEVml4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVOU0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4SFFVRkhMR05CUVdNc1EwRkJRenRSUVVOd1F5eE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRia1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU5vUkN4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0UlFVVXpRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVNeFFpeGpRVUZqTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3h4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJoRUxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1ZVRkJWU3hEUVVGRE8xbEJRemRDTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTenRaUVVOcVFpeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwN1dVRkRia0lzVDBGQlR5eEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBPMWxCUTNKQ0xGVkJRVlVzUlVGQlJTeEpRVUZKTEVOQlFVTXNWVUZCVlR0VFFVTTVRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5LTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JTEdWQlFXVTdXVUZEWml4blFrRkJaMEk3V1VGRGFFSXNiMEpCUVc5Q08xbEJRM0JDTEd0Q1FVRnJRanRaUVVOc1FpeG5RMEZCWjBNN1dVRkRhRU1zWjBOQlFXZERPMWxCUTJoRExDdENRVUVyUWp0WlFVTXZRaXgxUWtGQmRVSTdVMEZETVVJc1EwRkJRenRMUVVOTU96dEpRVVZFTEhkQ1FVRjNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeFJRVUZSTEVWQlFVVXNVVUZCVVN4RlFVRkZPMUZCUXk5RExFMUJRVTBzVFVGQlRTeEhRVUZITEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGFrTXNVVUZCVVN4SlFVRkpPMUZCUTFvc1MwRkJTeXhsUVVGbExFVkJRVVU3V1VGRGJFSXNUVUZCVFN4TFFVRkxMRWRCUVVjc2FVSkJRV2xDTEVOQlFVTXNVVUZCVVN4RlFVRkZMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeGhRVUZoTEVOQlFVTXNRMEZCUXp0WlFVTnNSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkRNVUlzVFVGQlRTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRE5VTXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUWtGQlowSXNSVUZCUlR0WlFVTnVRaXhOUVVGTkxFMUJRVTBzUjBGQlJ5eHBRa0ZCYVVJc1EwRkJReXhSUVVGUkxFVkJRVVVzVjBGQlZ5eERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMR05CUVdNc1EwRkJReXhEUVVGRE8xbEJRM0JHTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF6dFpRVU0xUWl4TlFVRk5MRU5CUVVNc1dVRkJXU3hEUVVGRExHZENRVUZuUWl4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRemxETEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc2IwSkJRVzlDTEVWQlFVVTdXVUZEZGtJc1RVRkJUU3hWUVVGVkxFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlF6VkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeEhRVUZITEZWQlFWVXNRMEZCUXp0WlFVTndReXhOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEd0Q1FVRnJRaXhGUVVGRk8xbEJRM0pDTEUxQlFVMHNUMEZCVHl4SFFVRkhMR2xDUVVGcFFpeERRVUZETEZGQlFWRXNSVUZCUlN4WFFVRlhMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzWjBKQlFXZENMRU5CUVVNc1EwRkJRenRaUVVOMlJpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1IwRkJSeXhQUVVGUExFTkJRVU03V1VGRE9VSXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhuUTBGQlowTXNSVUZCUlR0WlFVTnVReXhOUVVGTkxHZENRVUZuUWl4SFFVRkhRU3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4UlFVRlJMRVZCUVVVc1ZVRkJWU3hEUVVGRExGRkJRVkVzUlVGQlJTeG5RMEZCWjBNc1JVRkJSU3c0UWtGQk9FSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRMnhLTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zWjBKQlFXZENMRU5CUVVNN1dVRkRka01zVFVGQlRUdFRRVU5VTzFGQlEwUXNVMEZCVXl4QlFVVlNPMU5CUTBFN08xRkJSVVFzVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNKQ096dEpRVVZFTEdsQ1FVRnBRaXhIUVVGSE8xRkJRMmhDTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eGxRVUZsTEVWQlFVVXNUVUZCVFR0WlFVTjZReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMmRDUVVObUxGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRjRVE3VTBGRFNpeERRVUZETEVOQlFVTTdPMUZCUlVnc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMDdXVUZETTBNc1YwRkJWeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSQ3hsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROMElzUTBGQlF5eERRVUZET3pzN08xRkJTVWdzU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RlFVRkZPMWxCUTJoRUxFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMFE3UzBGRFNqczdTVUZGUkN4dlFrRkJiMElzUjBGQlJ6dExRVU4wUWpzN1NVRkZSQ3hsUVVGbExFZEJRVWM3UzBGRGFrSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU0xUWpzN096czdPenM3U1VGUlJDeEpRVUZKTEVsQlFVa3NSMEZCUnp0UlFVTlFMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eHZRa0ZCYjBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzQkVPenM3T3pzN08wbEJUMFFzU1VGQlNTeHRRa0ZCYlVJc1IwRkJSenRSUVVOMFFpeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc2JVSkJRVzFDTEVOQlFVTTdTMEZETVVNN096czdPenM3U1VGUFJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c01FSkJRVEJDTEVOQlFVTXNTVUZCU1N4RlFVRkZMR1ZCUVdVc1JVRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF6dExRVU16UlRzN096czdPMGxCVFVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeG5Ra0ZCWjBJc1JVRkJSU3hqUVVGakxFTkJRVU1zUTBGQlF6dExRVU0zUlRzN096czdPMGxCVFVRc1NVRkJTU3hWUVVGVkxFZEJRVWM3VVVGRFlpeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeHZRa0ZCYjBJc1JVRkJSU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMHRCUTNKR096czdPenM3TzBsQlQwUXNTVUZCU1N4UFFVRlBMRWRCUVVjN1VVRkRWaXhQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hyUWtGQmEwSXNSVUZCUlN4blFrRkJaMElzUTBGQlF5eERRVUZETzB0QlEycEdPenM3T3pzN1NVRk5SQ3hKUVVGSkxHOUNRVUZ2UWl4SFFVRkhPMUZCUTNaQ0xFOUJRVThzYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHZERRVUZuUXl4RlFVRkZMRGhDUVVFNFFpeERRVUZETEVOQlFVTTdTMEZEZEVjN096czdPenRKUVUxRUxFbEJRVWtzYlVKQlFXMUNMRWRCUVVjN1VVRkRkRUlzVDBGQlR5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFVkJRVVVzSzBKQlFTdENMRVZCUVVVc05rSkJRVFpDTEVOQlFVTXNRMEZCUXp0TFFVTndSenM3T3pzN08wbEJUVVFzU1VGQlNTeHZRa0ZCYjBJc1IwRkJSenRSUVVOMlFpeFBRVUZQTEcxQ1FVRnRRaXhEUVVGRExFbEJRVWtzUlVGQlJTeG5RMEZCWjBNc1JVRkJSU3c0UWtGQk9FSXNRMEZCUXl4RFFVRkRPMHRCUTNSSE96czdPenM3T3pzN1NVRlRSQ3hKUVVGSkxGbEJRVmtzUjBGQlJ6dFJRVU5tTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEhWQ1FVRjFRaXhGUVVGRkxIRkNRVUZ4UWl4RFFVRkRMRU5CUVVNN1MwRkRNMFk3T3pzN096czdTVUZQUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXp0TFFVTjRSRHM3T3pzN096czdPenRKUVZWRUxGTkJRVk1zUTBGQlF5eE5RVUZOTEVkQlFVY3NjVUpCUVhGQ0xFVkJRVVU3VVVGRGRFTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eEZRVUZGTzFsQlF6TkNMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dFRRVU4wUWp0UlFVTkVMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU40UXl4WFFVRlhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEycEVMRTlCUVU4c1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dExRVU53UWp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNXVUZCV1N4RFFVRkRMRU5CUVVNN08wRkRibWhDTjBRN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRWEZDUVN4QlFVZEJPenM3UVVGSFFTeE5RVUZOTEdOQlFXTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRNMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUTNwQ0xFMUJRVTBzWVVGQllTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEY0VJc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEzQkNMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXpOQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEVkQlFVY3NRMEZCUXpzN1FVRkZOVUlzVFVGQlRVTXNhVUpCUVdVc1IwRkJSeXhQUVVGUExFTkJRVU03UVVGRGFFTXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eFRRVUZUTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hqUVVGakxFZEJRVWNzVFVGQlRTeERRVUZETzBGQlF6bENMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NWVUZCVlN4RFFVRkRPMEZCUTNSRExFMUJRVTBzVjBGQlZ5eEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTjRRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eEhRVUZITEVOQlFVTTdPMEZCUlhoQ0xFMUJRVTBzWVVGQllTeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTXhRaXhOUVVGTkxEQkNRVUV3UWl4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOMFF5eE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU01UWl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTXpRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eGhRVUZoTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXk5Q0xFMUJRVTBzUzBGQlN5eEhRVUZITEdGQlFXRXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOd1F5eE5RVUZOTEZOQlFWTXNSMEZCUnl4UFFVRlBMRU5CUVVNN08wRkJSVEZDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1IwRkJSeXhMUVVGTE8wbEJRM0pDTEU5QlFVOHNSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdRMEZEYUVNc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZkQlFWY3NSMEZCUnl4RFFVRkRMRWxCUVVrN1NVRkRja0lzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU12UWl4UFFVRlBMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hOUVVGTkxFbEJRVWtzWTBGQll5eERRVUZETzBOQlF6bEZMRU5CUVVNN096czdPenM3UVVGUFJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMR05CUVdNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6czdRVUZGZUVVc1RVRkJUU3h6UWtGQmMwSXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYcEVMRUZCWVVFN096czdPenM3T3p0QlFWTkJMRTFCUVUwc1lVRkJZU3hIUVVGSExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc2MwSkJRWE5DTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF6czdRVUZGZEVZc1RVRkJUU3hWUVVGVkxFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUzBGQlN5eExRVUZMTzBsQlEyaEVMRTFCUVUwc1UwRkJVeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZETjBJc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRmRCUVZjc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRFTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8wbEJRM0JDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8wbEJRekZDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRXRCUVVzc1IwRkJSeXhUUVVGVExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBsQlF6VkZMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVOHNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenREUVVOeVFpeERRVUZET3p0QlFVVkdMRTFCUVUwc1UwRkJVeXhIUVVGSExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFdEJRVXNzUzBGQlN6dEpRVU12UXl4TlFVRk5MRXRCUVVzc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTTdTVUZETjBJc1RVRkJUU3hsUVVGbExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeEVMRTFCUVUwc1ZVRkJWU3hIUVVGSExFTkJRVU1zUjBGQlJ5eGxRVUZsTEVOQlFVTTdTVUZEZGtNc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl3d1FrRkJNRUlzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEYWtVc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTJ4RkxFMUJRVTBzV1VGQldTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNhVUpCUVdsQ0xFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTTdPMGxCUlRORkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTI1RkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hEUVVGRE96dEpRVVV6UXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRNVUlzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4UFFVRlBMRU5CUVVNN1NVRkRPVUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4WlFVRlpMRU5CUVVNN1NVRkRha01zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGREwwSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGRGNFUXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZMSEZDUVVGeFFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTXhTQ3hQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0SlFVTjZTQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpsSkxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1IwRkJSeXhWUVVGVkxFTkJRVU1zUTBGQlF6dEpRVU0xUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpOSUxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUTBGQlF5eERRVUZETzBsQlF5OUZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUlVGQlJTeHhRa0ZCY1VJc1JVRkJSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03TzBsQlJYWkhMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1EwRkRja0lzUTBGQlF6czdRVUZGUml4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVONFF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFRRVUZUTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRja0lzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdTVUZEYUVRc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wTkJRM0pDTEVOQlFVTTdPenM3UVVGSlJpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMURMRkZCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUTJoRExFMUJRVTBzUlVGQlJTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRla0lzVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenRCUVZWNlFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4alFVRmpMR3RDUVVGclFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPenM3T3p0SlFVdDZSQ3hYUVVGWExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRkZCUVZFc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSVHRSUVVOd1JDeExRVUZMTEVWQlFVVXNRMEZCUXpzN1VVRkZVaXhOUVVGTkxGTkJRVk1zUjBGQlIwWXNhMEpCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU03WVVGRGVFVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WVVGRFlpeFRRVUZUTEVOQlFVTXNWVUZCVlN4RlFVRkZMRU5CUVVNN1lVRkRka0lzUzBGQlN5eERRVUZET3p0UlFVVllMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE96dFJRVVUzUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUTBNc2FVSkJRV1VzUTBGQlF5eERRVUZETzJGQlEyNUZMRk5CUVZNc1EwRkJReXhoUVVGaExFTkJRVU03WVVGRGVFSXNTMEZCU3l4RFFVRkRPenRSUVVWWUxFbEJRVWtzUTBGQlF5eFJRVUZSTEVkQlFVZEVMR3RDUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZGQlFWRXNTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1lVRkRPVVVzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNN1lVRkRaaXhUUVVGVExFTkJRVU1zWjBKQlFXZENMRU5CUVVNN1lVRkRNMElzUzBGQlN5eERRVUZET3p0UlFVVllMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWRCTEd0Q1FVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8yRkJRM3BFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVTBGQlV5eERRVUZETzJGQlEzQkNMRXRCUVVzc1EwRkJRenM3VVVGRldDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhRU3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXp0aFFVTjZSQ3hWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEySXNVMEZCVXl4RFFVRkRMRk5CUVZNc1EwRkJRenRoUVVOd1FpeExRVUZMTEVOQlFVTTdPMUZCUlZnc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlIwRXNhMEpCUVZFc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXp0aFFVTjRSU3hSUVVGUkxFVkJRVVU3WVVGRFZpeFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRPMkZCUTJZc1MwRkJTeXhEUVVGRE8wdEJRMlE3TzBsQlJVUXNWMEZCVnl4clFrRkJhMElzUjBGQlJ6dFJRVU0xUWl4UFFVRlBPMWxCUTBoRExHbENRVUZsTzFsQlEyWXNhVUpCUVdsQ08xbEJRMnBDTEdOQlFXTTdXVUZEWkN4clFrRkJhMEk3V1VGRGJFSXNWMEZCVnp0WlFVTllMRmRCUVZjN1UwRkRaQ3hEUVVGRE8wdEJRMHc3TzBsQlJVUXNhVUpCUVdsQ0xFZEJRVWM3VVVGRGFFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRPVVE3TzBsQlJVUXNiMEpCUVc5Q0xFZEJRVWM3VVVGRGJrSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpkRUxFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRekZDT3pzN096czdPenRKUVZGRUxGTkJRVk1zUjBGQlJ6dFJRVU5TTEU5QlFVOHNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU51UXpzN096czdPenM3U1VGUlJDeFJRVUZSTEVkQlFVYzdVVUZEVUN4UFFVRlBMRWxCUVVrc1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dExRVU16UWpzN096czdPenRKUVU5RUxFbEJRVWtzU1VGQlNTeEhRVUZITzFGQlExQXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBReXhSUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpOQ08wbEJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZPMUZCUTJoQ0xFbEJRVWtzU1VGQlNTeExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZEUkN4cFFrRkJaU3hEUVVGRExFTkJRVU03V1VGRGRFTkRMRkZCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkRPMU5CUTI1RExFMUJRVTA3V1VGRFNFRXNVVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlEwUXNhVUpCUVdVc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU5vUkR0TFFVTktPenM3T3pzN096dEpRVkZFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ08wbEJRMFFzU1VGQlNTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTJZc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeEpRVUZKTEV0QlFVc3NUVUZCVFN4RlFVRkZPMWxCUTJwQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1UwRkRia01zVFVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1UwRkJVeXhGUVVGRkxFMUJRVTBzUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUTI1RU8wdEJRMG83T3pzN096czdTVUZQUkN4SlFVRkpMRmRCUVZjc1IwRkJSenRSUVVOa0xFOUJRVThzU1VGQlNTeExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU0zUlR0SlFVTkVMRWxCUVVrc1YwRkJWeXhEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5tTEVsQlFVa3NTVUZCU1N4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOYUxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdVMEZEYWtJc1MwRkJTenRaUVVOR0xFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRMnBDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRMWdzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1UwRkRaRHRMUVVOS096czdPenM3TzBsQlQwUXNZMEZCWXl4SFFVRkhPMUZCUTJJc1QwRkJUeXhKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXp0TFFVTndRenM3T3pzN096dEpRVTlFTEVsQlFVa3NRMEZCUXl4SFFVRkhPMUZCUTBvc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNaQ08wbEJRMFFzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFJc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRia0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGFFTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ6dFJRVU5LTEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU4yUWp0SlFVTkVMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5TTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEyNUNMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTJoRE96czdPenM3TzBsQlQwUXNTVUZCU1N4UlFVRlJMRWRCUVVjN1VVRkRXQ3hQUVVGUExGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRPVUk3U1VGRFJDeEpRVUZKTEZGQlFWRXNRMEZCUXl4SlFVRkpMRVZCUVVVN1VVRkRaaXhKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZEWml4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFOQlEzQkRMRTFCUVUwN1dVRkRTQ3hOUVVGTkxHdENRVUZyUWl4SFFVRkhMRWxCUVVrc1IwRkJSeXhqUVVGakxFTkJRVU03V1VGRGFrUXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzYTBKQlFXdENMRU5CUVVNc1EwRkJRenRaUVVONFF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRlZCUVZVc1JVRkJSU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMU5CUTNKRU8wdEJRMG83T3pzN096czdPMGxCVVVRc1QwRkJUeXhIUVVGSE8xRkJRMDRzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRaUVVOb1FpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hWUVVGVkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlF6bENMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWTBGQll5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVNM1F5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExHVkJRV1VzUlVGQlJUdG5Ra0ZETVVNc1RVRkJUU3hGUVVGRk8yOUNRVU5LTEVkQlFVY3NSVUZCUlN4SlFVRkpPMmxDUVVOYU8yRkJRMG9zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVUR0TFFVTktPenM3T3pzN096czdTVUZUUkN4TlFVRk5MRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJRMWdzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRaUVVOb1FpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRaUVVOeVFpeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExHTkJRV01zUlVGQlJUdG5Ra0ZEZWtNc1RVRkJUU3hGUVVGRk8yOUNRVU5LTEVkQlFVY3NSVUZCUlN4SlFVRkpPMjlDUVVOVUxFMUJRVTA3YVVKQlExUTdZVUZEU2l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOUU8wdEJRMG83T3pzN096czdTVUZQUkN4TlFVRk5MRWRCUVVjN1VVRkRUQ3hQUVVGUExFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMHRCUXk5Q096czdPenM3T3pzN1NVRlRSQ3hUUVVGVExFTkJRVU1zVFVGQlRTeEZRVUZGTzFGQlEyUXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFVkJRVVU3V1VGRE4wTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRGJrSXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRPMWxCUTNoRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4WFFVRlhMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVTdaMEpCUTJ4RUxFMUJRVTBzUlVGQlJUdHZRa0ZEU2l4SFFVRkhMRVZCUVVVc1NVRkJTVHR2UWtGRFZDeE5RVUZOTzJsQ1FVTlVPMkZCUTBvc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFVEdExRVU5LT3pzN096czdPenM3T3pzN1NVRlpSQ3hOUVVGTkxFTkJRVU1zVDBGQlR5eEZRVUZGTEU5QlFVOHNSVUZCUlN4WFFVRlhMRWRCUVVjc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJUdFJRVU55UkN4TlFVRk5MRXRCUVVzc1IwRkJSeXhQUVVGUExFZEJRVWNzWVVGQllTeERRVUZETzFGQlEzUkRMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTTdVVUZETTBJc1RVRkJUU3hOUVVGTkxFZEJRVWNzUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTTNRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eFJRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPenRSUVVWdVF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExGZEJRVmNzUTBGQlF6czdVVUZGTTBJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFVVTdXVUZEWml4VlFVRlZMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdVMEZEZGtRN08xRkJSVVFzU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSVHRaUVVOeVFpeFBRVUZQTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUTNoRExFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzWkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRM3BFT3p0UlFVVkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZET3p0UlFVVTFReXhSUVVGUkxFbEJRVWtzUTBGQlF5eEpRVUZKTzFGQlEycENMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRjRVFzVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4RFFVRkRMRVZCUVVVN1dVRkRTaXhUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTjBSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRemxFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRkRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRjRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU01UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOS0xGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUTNSRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNeFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOd1JDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bEVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTktMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzUkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTXhSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTnlSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRemxFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU14UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZWtRc1RVRkJUVHRUUVVOVU8xRkJRMFFzVVVGQlVUdFRRVU5RT3pzN1VVRkhSQ3hQUVVGUExFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRNVU03UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenM3UVVNeFptaEVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUU3T3pzN08wRkJTMEVzVFVGQlRTeGhRVUZoTEVkQlFVY3NZMEZCWXl4WFFVRlhMRU5CUVVNN096czdPMGxCU3pWRExGZEJRVmNzUjBGQlJ6dFJRVU5XTEV0QlFVc3NSVUZCUlN4RFFVRkRPMHRCUTFnN08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1VVRkRhRUlzU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVU3V1VGRE1VSXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXh4UWtGQmNVSXNRMEZCUXl4RFFVRkRPMU5CUXpORE96dFJRVVZFTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3hEUVVGRExFdEJRVXNzUzBGQlN6czdXVUZGTDBNc1NVRkJTU3hEUVVGRExFOUJRVTg3YVVKQlExQXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dHBRa0ZETTBNc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVOc1F5eERRVUZETEVOQlFVTTdTMEZEVGpzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0TFFVTjBRanM3T3pzN096dEpRVTlFTEVsQlFVa3NUMEZCVHl4SFFVRkhPMUZCUTFZc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZGtRN1EwRkRTaXhEUVVGRE96dEJRVVZHTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExHbENRVUZwUWl4RlFVRkZMR0ZCUVdFc1EwRkJReXhEUVVGRE96dEJRemRFTDBRN096czdPenM3T3pzN096czdPenM3T3p0QlFXdENRU3hCUVV0QkxFMUJRVTBzUTBGQlF5eGhRVUZoTEVkQlFVY3NUVUZCVFN4RFFVRkRMR0ZCUVdFc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzBsQlEzcEVMRTlCUVU4c1JVRkJSU3hQUVVGUE8wbEJRMmhDTEU5QlFVOHNSVUZCUlN4VlFVRlZPMGxCUTI1Q0xFOUJRVThzUlVGQlJTd3lRa0ZCTWtJN1NVRkRjRU1zV1VGQldTeEZRVUZGTEZsQlFWazdTVUZETVVJc1RVRkJUU3hGUVVGRkxFMUJRVTA3U1VGRFpDeFRRVUZUTEVWQlFVVXNVMEZCVXp0SlFVTndRaXhoUVVGaExFVkJRVVVzWVVGQllUdERRVU12UWl4RFFVRkRMRU5CUVVNaWZRPT0ifQ==
