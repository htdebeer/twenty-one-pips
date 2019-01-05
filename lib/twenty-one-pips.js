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
    constructor({color, name, score, hasTurn}) {
        super();

        if (color && "" !== color) {
            _color.set(this, color);
            this.setAttribute(COLOR_ATTRIBUTE, this.color);
        } else if (this.hasAttribute(COLOR_ATTRIBUTE) && "" !== this.getAttribute(COLOR_ATTRIBUTE)) {
            _color.set(this, this.getAttribute(COLOR_ATTRIBUTE));
        } else {
            throw new ConfigurationError("A Player needs a color, which is a String.");
        }

        if (name && "" !== name) {
            _name.set(this, name);
            this.setAttribute(NAME_ATTRIBUTE, this.name);
        } else if (this.hasAttribute(NAME_ATTRIBUTE) && "" !== this.getAttribute(NAME_ATTRIBUTE)) {
            _name.set(this, this.getAttribute(NAME_ATTRIBUTE));
        } else {
            throw new ConfigurationError("A Player needs a name, which is a String.");
        }

        if (score) {
            _score.set(this, score);
            this.setAttribute(SCORE_ATTRIBUTE, this.score);
        } else if (this.hasAttribute(SCORE_ATTRIBUTE) && Number.isNaN(parseInt(this.getAttribute(SCORE_ATTRIBUTE), 10))) {
            _score.set(this, parseInt(this.getAttribute(SCORE_ATTRIBUTE), 10));
        } else {
            // Okay. A player does not need to have a score.
            _score.set(this, null);
        }

        if (true === hasTurn) {
            _hasTurn.set(this, hasTurn);
            this.setAttribute(HAS_TURN_ATTRIBUTE, hasTurn);
        } else if (this.hasAttribute(HAS_TURN_ATTRIBUTE)) {
            _hasTurn.set(this, true);
        } else {
            // Okay, A player does not always have a turn.
            _hasTurn.set(this, null);
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

const validatePositiveNumber = (number, maxNumber = Infinity) => {
    return 0 <= number && number < maxNumber;
};

const getPositiveNumber = (numberString, defaultValue) => {
    const value = parseNumber(numberString, defaultValue);
    return validatePositiveNumber(value) ? value : defaultValue;
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
            const disabledRotation = getBoolean(newValue, ROTATING_DICE_DISABLED_ATTRIBUTE, getBoolean(oldValue, ROTATING_DICE_DISABLED_ATTRIBUTE, DEFAULT_ROTATING_DICE_DISABLED));
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
    constructor() {
        super();

        // Ensure every die has a pips, 1 <= pips <= 6
        let pips = NaN;
        if (this.hasAttribute(PIPS_ATTRIBUTE)) {
            pips = parseInt(this.getAttribute(PIPS_ATTRIBUTE), 10);
        }

        if (Number.isNaN(pips) || 1 > pips || 6 < pips) {
            pips = randomPips();
        }

        _pips.set(this, pips);
        this.setAttribute(PIPS_ATTRIBUTE, pips);

        // Other attributes. TODO: add validation.
        if (this.hasAttribute(COLOR_ATTRIBUTE$1)) {
            this.color = this.getAttribute(COLOR_ATTRIBUTE$1);
        } else {
            this.color = DEFAULT_COLOR;
        }

        if (this.hasAttribute(ROTATION_ATTRIBUTE)) {
            this.rotation = parseInt(this.getAttribute(ROTATION_ATTRIBUTE), 10);
        } else {
            this.rotation = DEFAULT_ROTATION;
        }

        if (this.hasAttribute(X_ATTRIBUTE)) {
            this.x = parseInt(this.getAttribute(X_ATTRIBUTE), 10);
        } else {
            this.x = DEFAULT_X;
        }

        if (this.hasAttribute(Y_ATTRIBUTE)) {
            this.y = parseInt(this.getAttribute(Y_ATTRIBUTE), 10);
        } else {
            this.y = DEFAULT_Y;
        }

        if (this.hasAttribute(HELD_BY_ATTRIBUTE)) {
            this.heldBy = this.getAttribute(HELD_BY_ATTRIBUTE);
        } else {
            this.heldBy = null;
        }

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
    }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwiVG9wUGxheWVySFRNTEVsZW1lbnQuanMiLCJUb3BEaWNlQm9hcmRIVE1MRWxlbWVudC5qcyIsIlRvcERpZUhUTUxFbGVtZW50LmpzIiwiVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50LmpzIiwidHdlbnR5LW9uZS1waXBzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb25FcnJvclxuICpcbiAqIEBleHRlbmRzIEVycm9yXG4gKi9cbmNvbnN0IENvbmZpZ3VyYXRpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IENvbmZpZ3VyYXRpb25FcnJvciB3aXRoIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzXG4gICAgICogQ29uZmlndXJhdGlvbkVycm9yLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMgPSAzNjA7XG5cbmNvbnN0IHJhbmRvbWl6ZUNlbnRlciA9IChuKSA9PiB7XG4gICAgcmV0dXJuICgwLjUgPD0gTWF0aC5yYW5kb20oKSA/IE1hdGguZmxvb3IgOiBNYXRoLmNlaWwpLmNhbGwoMCwgbik7XG59O1xuXG4vLyBQcml2YXRlIGZpZWxkc1xuY29uc3QgX3dpZHRoID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWlnaHQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3Jvd3MgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpY2UgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpZVNpemUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Rpc3BlcnNpb24gPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0ZSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JpZExheW91dENvbmZpZ3VyYXRpb25cbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcud2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aCBvZiB0aGlzXG4gKiBHcmlkTGF5b3V0IGluIHBpeGVscy47XG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmhlaWdodF0gLSBUaGUgbWluaW1hbCBoZWlnaHQgb2ZcbiAqIHRoaXMgR3JpZExheW91dCBpbiBwaXhlbHMuLlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaXNwZXJzaW9uIC0gVGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBvZiB0aGVcbiAqIGxheW91dCBhIGRpZSBjYW4gYmUgbGF5b3V0LlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaWVTaXplIC0gVGhlIHNpemUgb2YgYSBkaWUuXG4gKi9cblxuLyoqXG4gKiBHcmlkTGF5b3V0IGhhbmRsZXMgbGF5aW5nIG91dCB0aGUgZGljZSBvbiBhIERpY2VCb2FyZC5cbiAqL1xuY29uc3QgR3JpZExheW91dCA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtHcmlkTGF5b3V0Q29uZmlndXJhdGlvbn0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIEdyaWRMYXlvdXRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGRpc3BlcnNpb24sXG4gICAgICAgIGRpZVNpemVcbiAgICB9ID0ge30pIHtcbiAgICAgICAgX2RpY2Uuc2V0KHRoaXMsIFtdKTtcbiAgICAgICAgX2RpZVNpemUuc2V0KHRoaXMsIDEpO1xuICAgICAgICBfd2lkdGguc2V0KHRoaXMsIDApO1xuICAgICAgICBfaGVpZ2h0LnNldCh0aGlzLCAwKTtcbiAgICAgICAgX3JvdGF0ZS5zZXQodGhpcywgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5kaXNwZXJzaW9uID0gZGlzcGVyc2lvbjtcbiAgICAgICAgdGhpcy5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgV2lkdGggPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9IFxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIF93aWR0aC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IHdpZHRoKHcpIHtcbiAgICAgICAgaWYgKDAgPiB3KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBXaWR0aCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke3d9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgdyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIEhlaWdodCA+PSAwXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBfaGVpZ2h0LmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgaGVpZ2h0KGgpIHtcbiAgICAgICAgaWYgKDAgPiBoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBIZWlnaHQgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHtofScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBfaGVpZ2h0LnNldCh0aGlzLCBoKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IG9uIHRoaXMgR3JpZExheW91dC4gVGhpc1xuICAgICAqIG51bWJlciBpcyA+PSAwLiBSZWFkIG9ubHkuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29scyAqIHRoaXMuX3Jvd3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BlcnNpb24gbGV2ZWwgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFRoZSBkaXNwZXJzaW9uIGxldmVsXG4gICAgICogaW5kaWNhdGVzIHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgZGljZSBjYW4gYmUgbGF5b3V0LiBVc2UgMSBmb3IgYVxuICAgICAqIHRpZ2h0IHBhY2tlZCBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIERpc3BlcnNpb24gPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpc3BlcnNpb24oZCkge1xuICAgICAgICBpZiAoMCA+IGQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYERpc3BlcnNpb24gc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHtkfScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2Rpc3BlcnNpb24uc2V0KHRoaXMsIGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzaXplIG9mIGEgZGllLlxuICAgICAqXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBEaWVTaXplID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gX2RpZVNpemUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaWVTaXplKGRzKSB7XG4gICAgICAgIGlmICgwID49IGRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBkaWVTaXplIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAxLCBnb3QgJyR7ZHN9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCBkcyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdldCByb3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBfcm90YXRlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gciA/IHRydWUgOiByO1xuICAgIH1cblxuICAgIHNldCByb3RhdGUocikge1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIHJvd3MsIDAgPCByb3dzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9yb3dzKCkge1xuICAgICAgICByZXR1cm4gX3Jvd3MuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2YgY29sdW1ucywgMCA8IGNvbHVtbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NvbHMoKSB7XG4gICAgICAgIHJldHVybiBfY29scy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNlbnRlciBjZWxsIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNlbnRlciAocm93LCBjb2wpLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9yb3dzIC8gMikgLSAxO1xuICAgICAgICBjb25zdCBjb2wgPSByYW5kb21pemVDZW50ZXIodGhpcy5fY29scyAvIDIpIC0gMTtcblxuICAgICAgICByZXR1cm4ge3JvdywgY29sfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXlvdXQgZGljZSBvbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpEaWV+RGllW119IGRpY2UgLSBUaGUgZGljZSB0byBsYXlvdXQgb24gdGhpcyBMYXlvdXQuXG4gICAgICogQHJldHVybiB7bW9kdWxlOkRpZX5EaWVbXX0gVGhlIHNhbWUgbGlzdCBvZiBkaWNlLCBidXQgbm93IGxheW91dC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3Mge21vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3J+Q29uZmlndXJhdGlvbkVycm9yfSBUaGUgbnVtYmVyIG9mXG4gICAgICogZGljZSBzaG91bGQgbm90IGV4Y2VlZCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGlzIExheW91dCBjYW5cbiAgICAgKiBsYXlvdXQuXG4gICAgICovXG4gICAgbGF5b3V0KGRpY2UpIHtcbiAgICAgICAgaWYgKGRpY2UubGVuZ3RoID4gdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBUaGUgbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IGlzICR7dGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlfSwgZ290ICR7ZGljZS5sZW5naHR9IGRpY2UgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlMYXlvdXREaWNlID0gW107XG4gICAgICAgIGNvbnN0IGRpY2VUb0xheW91dCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGlmIChkaWUuaGFzQ29vcmRpbmF0ZXMoKSAmJiBkaWUuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEaWNlIHRoYXQgYXJlIGJlaW5nIGhlbGQgYW5kIGhhdmUgYmVlbiBsYXlvdXQgYmVmb3JlIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIGtlZXAgdGhlaXIgY3VycmVudCBjb29yZGluYXRlcyBhbmQgcm90YXRpb24uIEluIG90aGVyIHdvcmRzLFxuICAgICAgICAgICAgICAgIC8vIHRoZXNlIGRpY2UgYXJlIHNraXBwZWQuXG4gICAgICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWNlVG9MYXlvdXQucHVzaChkaWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5taW4oZGljZS5sZW5ndGggKiB0aGlzLmRpc3BlcnNpb24sIHRoaXMubWF4aW11bU51bWJlck9mRGljZSk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzID0gdGhpcy5fY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2VUb0xheW91dCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhdmFpbGFibGVDZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tQ2VsbCA9IGF2YWlsYWJsZUNlbGxzW3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUNlbGxzLnNwbGljZShyYW5kb21JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGRpZS5jb29yZGluYXRlcyA9IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMocmFuZG9tQ2VsbCk7XG4gICAgICAgICAgICBkaWUucm90YXRpb24gPSB0aGlzLnJvdGF0ZSA/IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMpIDogbnVsbDtcbiAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgcmV0dXJuIGFscmVhZHlMYXlvdXREaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYSBsaXN0IHdpdGggYXZhaWxhYmxlIGNlbGxzIHRvIHBsYWNlIGRpY2Ugb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4IC0gVGhlIG51bWJlciBlbXB0eSBjZWxscyB0byBjb21wdXRlLlxuICAgICAqIEBwYXJhbSB7RGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IHdpdGggZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtOVW1iZXJbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGNlbGxzIHJlcHJlc2VudGVkIGJ5IHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBsZXZlbCA9IDA7XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gTWF0aC5taW4odGhpcy5fcm93cywgdGhpcy5fY29scyk7XG5cbiAgICAgICAgd2hpbGUgKGF2YWlsYWJsZS5zaXplIDwgbWF4ICYmIGxldmVsIDwgbWF4TGV2ZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsc09uTGV2ZWwobGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCAhPT0gY2VsbCAmJiB0aGlzLl9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlLmFkZChjZWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldmVsKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhdmFpbGFibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSBhbGwgY2VsbHMgb24gbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSBUaGUgbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuIDBcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGNlbnRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NldDxOdW1iZXI+fSB0aGUgY2VsbHMgb24gdGhlIGxldmVsIGluIHRoaXMgbGF5b3V0IHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxzT25MZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zdCBjZWxscyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5fY2VudGVyO1xuXG4gICAgICAgIGlmICgwID09PSBsZXZlbCkge1xuICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcihjZW50ZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IGNlbnRlci5yb3cgLSBsZXZlbDsgcm93IDw9IGNlbnRlci5yb3cgKyBsZXZlbDsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCAtIGxldmVsfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sICsgbGV2ZWx9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IGNlbnRlci5jb2wgLSBsZXZlbCArIDE7IGNvbCA8IGNlbnRlci5jb2wgKyBsZXZlbDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgLSBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyArIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyBjZWxsIGNvbnRhaW4gYSBjZWxsIGZyb20gYWxyZWFkeUxheW91dERpY2U/XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY2VsbCAtIEEgY2VsbCBpbiBsYXlvdXQgcmVwcmVzZW50ZWQgYnkgYSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgb2YgZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgY2VsbCBkb2VzIG5vdCBjb250YWluIGEgZGllLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IGFscmVhZHlMYXlvdXREaWNlLmZpbmQoZGllID0+IGNlbGwgPT09IHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIG51bWJlciB0byBhIGNlbGwgKHJvdywgY29sKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm4gdGhlIGNlbGwgKHtyb3csIGNvbH0pIGNvcnJlc3BvbmRpbmcgbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0NlbGwobikge1xuICAgICAgICByZXR1cm4ge3JvdzogTWF0aC50cnVuYyhuIC8gdGhpcy5fY29scyksIGNvbDogbiAlIHRoaXMuX2NvbHN9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHRvIGEgbnVtYmVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gaXRzIG51bWJlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwuXG4gICAgICogUmV0dXJucyB1bmRlZmluZWQgd2hlbiB0aGUgY2VsbCBpcyBub3Qgb24gdGhlIGxheW91dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb051bWJlcih7cm93LCBjb2x9KSB7XG4gICAgICAgIGlmICgwIDw9IHJvdyAmJiByb3cgPCB0aGlzLl9yb3dzICYmIDAgPD0gY29sICYmIGNvbCA8IHRoaXMuX2NvbHMpIHtcbiAgICAgICAgICAgIHJldHVybiByb3cgKiB0aGlzLl9jb2xzICsgY29sO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgcmVwcmVzZW50ZWQgYnkgaXRzIG51bWJlciB0byB0aGVpciBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb29yZGluYXRlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsIHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhpcyBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9Db29yZGluYXRlcyhuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jZWxsVG9Db29yZHModGhpcy5fbnVtYmVyVG9DZWxsKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgcGFpciBvZiBjb29yZGluYXRlcyB0byBhIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydFxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvb3JkaW5hdGVzIGNvbnZlcnRlZCB0byBhIG51bWJlci4gSWZcbiAgICAgKiB0aGUgY29vcmRpbmF0ZXMgYXJlIG5vdCBvbiB0aGlzIGxheW91dCwgdGhlIG51bWJlciBpcyB1bmRlZmluZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRpbmF0ZXNUb051bWJlcihjb29yZHMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuX2NlbGxUb051bWJlcih0aGlzLl9jb29yZHNUb0NlbGwoY29vcmRzKSk7XG4gICAgICAgIGlmICgwIDw9IG4gJiYgbiA8IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbmFwICh4LHkpIHRvIHRoZSBjbG9zZXN0IGNlbGwgaW4gdGhpcyBMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGllY29vcmRpbmF0ZSAtIFRoZSBjb29yZGluYXRlIHRvIGZpbmQgdGhlIGNsb3Nlc3QgY2VsbFxuICAgICAqIGZvci5cbiAgICAgKiBAcGFyYW0ge0RpZX0gW2RpZWNvb3JkaW5hdC5kaWUgPSBudWxsXSAtIFRoZSBkaWUgdG8gc25hcCB0by5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS54IC0gVGhlIHgtY29vcmRpbmF0ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS55IC0gVGhlIHktY29vcmRpbmF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudWxsfSBUaGUgY29vcmRpbmF0ZSBvZiB0aGUgY2VsbCBjbG9zZXN0IHRvICh4LCB5KS5cbiAgICAgKiBOdWxsIHdoZW4gbm8gc3VpdGFibGUgY2VsbCBpcyBuZWFyICh4LCB5KVxuICAgICAqL1xuICAgIHNuYXBUbyh7ZGllID0gbnVsbCwgeCwgeX0pIHtcbiAgICAgICAgY29uc3QgY29ybmVyQ2VsbCA9IHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvcm5lciA9IHRoaXMuX2NlbGxUb0Nvb3Jkcyhjb3JuZXJDZWxsKTtcbiAgICAgICAgY29uc3Qgd2lkdGhJbiA9IGNvcm5lci54ICsgdGhpcy5kaWVTaXplIC0geDtcbiAgICAgICAgY29uc3Qgd2lkdGhPdXQgPSB0aGlzLmRpZVNpemUgLSB3aWR0aEluO1xuICAgICAgICBjb25zdCBoZWlnaHRJbiA9IGNvcm5lci55ICsgdGhpcy5kaWVTaXplIC0geTtcbiAgICAgICAgY29uc3QgaGVpZ2h0T3V0ID0gdGhpcy5kaWVTaXplIC0gaGVpZ2h0SW47XG5cbiAgICAgICAgY29uc3QgcXVhZHJhbnRzID0gW3tcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcihjb3JuZXJDZWxsKSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93LFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodE91dFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodE91dFxuICAgICAgICB9XTtcblxuICAgICAgICBjb25zdCBzbmFwVG8gPSBxdWFkcmFudHNcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG9uIHRoZSBsYXlvdXRcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiB1bmRlZmluZWQgIT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBub3QgYWxyZWFkeSB0YWtlbiBleGNlcHQgYnkgaXRzZWxmXG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gKFxuICAgICAgICAgICAgICAgIG51bGwgIT09IGRpZSAmJiB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykgPT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5fY2VsbElzRW1wdHkocXVhZHJhbnQucSwgX2RpY2UuZ2V0KHRoaXMpKSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIGNvdmVyZWQgYnkgdGhlIGRpZSB0aGUgbW9zdFxuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAobWF4USwgcXVhZHJhbnQpID0+IHF1YWRyYW50LmNvdmVyYWdlID4gbWF4US5jb3ZlcmFnZSA/IHF1YWRyYW50IDogbWF4USxcbiAgICAgICAgICAgICAgICB7cTogdW5kZWZpbmVkLCBjb3ZlcmFnZTogLTF9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IHNuYXBUby5xID8gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhzbmFwVG8ucSkgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGllIGF0IHBvaW50ICh4LCB5KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50IC0gVGhlIHBvaW50IGluICh4LCB5KSBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge0RpZXxudWxsfSBUaGUgZGllIHVuZGVyIGNvb3JkaW5hdGVzICh4LCB5KSBvciBudWxsIGlmIG5vIGRpZVxuICAgICAqIGlzIGF0IHRoZSBwb2ludC5cbiAgICAgKi9cbiAgICBnZXRBdChwb2ludCA9IHt4OiAwLCB5OiAwfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBfZGljZS5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3QgeEZpdCA9IHggPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHggKyB0aGlzLmRpZVNpemU7XG4gICAgICAgICAgICBjb25zdCB5Rml0ID0geSA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0geSArIHRoaXMuZGllU2l6ZTtcblxuICAgICAgICAgICAgaWYgKHhGaXQgJiYgeUZpdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGdyaWQgc2l6ZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGhcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gVGhlIG1pbmltYWwgaGVpZ2h0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVHcmlkKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgX2NvbHMuc2V0KHRoaXMsIE1hdGguZmxvb3Iod2lkdGggLyB0aGlzLmRpZVNpemUpKTtcbiAgICAgICAgX3Jvd3Muc2V0KHRoaXMsIE1hdGguZmxvb3IoaGVpZ2h0IC8gdGhpcy5kaWVTaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIChyb3csIGNvbCkgY2VsbCB0byAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb0Nvb3Jkcyh7cm93LCBjb2x9KSB7XG4gICAgICAgIHJldHVybiB7eDogY29sICogdGhpcy5kaWVTaXplLCB5OiByb3cgKiB0aGlzLmRpZVNpemV9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgKHgsIHkpIGNvb3JkaW5hdGVzIHRvIGEgKHJvdywgY29sKSBjZWxsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkaW5hdGVzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnQgdG8gYSBjZWxsLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY2VsbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3Jkc1RvQ2VsbCh7eCwgeX0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7R3JpZExheW91dH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGUgbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cblxuLypcbiAqIENvbnZlcnQgYW4gSFRNTCBhdHRyaWJ1dGUgdG8gYW4gaW5zdGFuY2UncyBwcm9wZXJ0eS4gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSdzIG5hbWUuIEZvciBleGFtcGxlLCBcIm15LWF0dHJcIlxuICogd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJteUF0dHJcIiwgYW5kIFwiZGlzYWJsZWRcIiB0byBcImRpc2FibGVkXCIuXG4gKi9cbmNvbnN0IGF0dHJpYnV0ZTJwcm9wZXJ0eSA9IChuYW1lKSA9PiB7XG4gICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybiBmaXJzdCArIHJlc3QubWFwKHdvcmQgPT4gd29yZC5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKSkuam9pbigpO1xufTtcblxuLyoqXG4gKiBNaXhpbiB7QGxpbmsgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXN9IHRvIGEgY2xhc3MuXG4gKlxuICogQHBhcmFtIHsqfSBTdXAgLSBUaGUgY2xhc3MgdG8gbWl4IGludG8uXG4gKiBAcmV0dXJuIHttb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkLWluIGNsYXNzXG4gKi9cbmNvbnN0IFJlYWRPbmx5QXR0cmlidXRlcyA9IChTdXApID0+XG4gICAgLyoqXG4gICAgICogTWl4aW4gdG8gbWFrZSBhbGwgYXR0cmlidXRlcyBvbiBhIGN1c3RvbSBIVE1MRWxlbWVudCByZWFkLW9ubHkgaW4gdGhlIHNlbnNlXG4gICAgICogdGhhdCB3aGVuIHRoZSBhdHRyaWJ1dGUgZ2V0cyBhIG5ldyB2YWx1ZSB0aGF0IGRpZmZlcnMgZnJvbSB0aGUgdmFsdWUgb2YgdGhlXG4gICAgICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSwgaXQgaXMgcmVzZXQgdG8gdGhhdCBwcm9wZXJ0eSdzIHZhbHVlLiBUaGVcbiAgICAgKiBhc3N1bXB0aW9uIGlzIHRoYXQgYXR0cmlidXRlIFwibXktYXR0cmlidXRlXCIgY29ycmVzcG9uZHMgd2l0aCBwcm9wZXJ0eSBcInRoaXMubXlBdHRyaWJ1dGVcIi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q2xhc3N9IFN1cCAtIFRoZSBjbGFzcyB0byBtaXhpbiB0aGlzIFJlYWRPbmx5QXR0cmlidXRlcy5cbiAgICAgKiBAcmV0dXJuIHtSZWFkT25seUF0dHJpYnV0ZXN9IFRoZSBtaXhlZCBpbiBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBtaXhpblxuICAgICAqIEBhbGlhcyBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc1xuICAgICAqL1xuICAgIGNsYXNzIGV4dGVuZHMgU3VwIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdGhhdCBpcyBleGVjdXRlZCB3aGVuIGFuIG9ic2VydmVkIGF0dHJpYnV0ZSdzIHZhbHVlIGlzXG4gICAgICAgICAqIGNoYW5nZWQuIElmIHRoZSBIVE1MRWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIERPTSwgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiB2YWx1ZSBjYW4gb25seSBiZSBzZXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgSFRNTEVsZW1lbnQncyBwcm9wZXJ0eS5cbiAgICAgICAgICogSW4gZWZmZWN0LCB0aGlzIG1ha2VzIHRoaXMgSFRNTEVsZW1lbnQncyBhdHRyaWJ1dGVzIHJlYWQtb25seS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIGFuIEhUTUxFbGVtZW50IGhhcyBhbiBhdHRyaWJ1dGUgXCJ4XCIgYW5kXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgXCJ4XCIsIHRoZW4gY2hhbmdpbmcgdGhlIHZhbHVlIFwieFwiIHRvIFwiNVwiXG4gICAgICAgICAqIHdpbGwgb25seSB3b3JrIHdoZW4gYHRoaXMueCA9PT0gNWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBvbGQgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgICAgICAqL1xuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBBbGwgYXR0cmlidXRlcyBhcmUgbWFkZSByZWFkLW9ubHkgdG8gcHJldmVudCBjaGVhdGluZyBieSBjaGFuZ2luZ1xuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuIE9mIGNvdXJzZSwgdGhpcyBpcyBieSBub1xuICAgICAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdXNlcnMgd2lsbCBub3QgY2hlYXQgaW4gYSBkaWZmZXJlbnQgd2F5LlxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBhdHRyaWJ1dGUycHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQgJiYgbmV3VmFsdWUgIT09IGAke3RoaXNbcHJvcGVydHldfWApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB0aGlzW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQge1xuICAgIFJlYWRPbmx5QXR0cmlidXRlc1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuXG4vLyBUaGUgbmFtZXMgb2YgdGhlIChvYnNlcnZlZCkgYXR0cmlidXRlcyBvZiB0aGUgVG9wUGxheWVySFRNTEVsZW1lbnQuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBOQU1FX0FUVFJJQlVURSA9IFwibmFtZVwiO1xuY29uc3QgU0NPUkVfQVRUUklCVVRFID0gXCJzY29yZVwiO1xuY29uc3QgSEFTX1RVUk5fQVRUUklCVVRFID0gXCJoYXMtdHVyblwiO1xuXG4vLyBUaGUgcHJpdmF0ZSBwcm9wZXJ0aWVzIG9mIHRoZSBUb3BQbGF5ZXJIVE1MRWxlbWVudCBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXJIVE1MRWxlbWVudCBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG5hbWUgYXR0cmlidXRlIGFyZSB0cmVhdGVkIGFzXG4gKiB0aGUgc2FtZSBwbGF5ZXIuXG4gKlxuICogSW4gZ2VuZXJhbCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IG5vIHR3byBwbGF5ZXJzIGRvIGhhdmUgdGhlIHNhbWUgY29sb3IsXG4gKiBhbHRob3VnaCBpdCBpcyBub3QgdW5jb25jZWl2YWJsZSB0aGF0IGNlcnRhaW4gZGljZSBnYW1lcyBoYXZlIHBsYXllcnMgd29ya1xuICogaW4gdGVhbXMgd2hlcmUgaXQgd291bGQgbWFrZSBzZW5zZSBmb3IgdHdvIG9yIG1vcmUgZGlmZmVyZW50IHBsYXllcnMgdG9cbiAqIGhhdmUgdGhlIHNhbWUgY29sb3IuXG4gKlxuICogVGhlIG5hbWUgYW5kIGNvbG9yIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkLiBUaGUgc2NvcmUgYW5kIGhhcy10dXJuXG4gKiBhdHRyaWJ1dGVzIGFyZSBub3QuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc1xuICovXG5jb25zdCBUb3BQbGF5ZXJIVE1MRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgUmVhZE9ubHlBdHRyaWJ1dGVzKEhUTUxFbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVySFRNTEVsZW1lbnQsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0pIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoY29sb3IgJiYgXCJcIiAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgY29sb3IpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFLCB0aGlzLmNvbG9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpICYmIFwiXCIgIT09IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgdGhpcy5nZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgJiYgXCJcIiAhPT0gbmFtZSkge1xuICAgICAgICAgICAgX25hbWUuc2V0KHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUsIHRoaXMubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpICYmIFwiXCIgIT09IHRoaXMuZ2V0QXR0cmlidXRlKE5BTUVfQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgX25hbWUuc2V0KHRoaXMsIHRoaXMuZ2V0QXR0cmlidXRlKE5BTUVfQVRUUklCVVRFKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBuYW1lLCB3aGljaCBpcyBhIFN0cmluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcmUpIHtcbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgc2NvcmUpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoU0NPUkVfQVRUUklCVVRFLCB0aGlzLnNjb3JlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpICYmIE51bWJlci5pc05hTihwYXJzZUludCh0aGlzLmdldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpLCAxMCkpKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHBhcnNlSW50KHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSksIDEwKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJ1ZSA9PT0gaGFzVHVybikge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUpKSB7XG4gICAgICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LCBBIHBsYXllciBkb2VzIG5vdCBhbHdheXMgaGF2ZSBhIHR1cm4uXG4gICAgICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICovXG4gICAgc3RhcnRUdXJuKCkge1xuICAgICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnN0YXJ0LXR1cm5cIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUsIHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50fSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1wbGF5ZXJcIiwgVG9wUGxheWVySFRNTEVsZW1lbnQpO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN5c3RlbSBwbGF5ZXIuIERpY2UgYXJlIHRocm93biBieSBhIHBsYXllci4gRm9yIHNpdHVhdGlvbnNcbiAqIHdoZXJlIHlvdSB3YW50IHRvIHJlbmRlciBhIGJ1bmNoIG9mIGRpY2Ugd2l0aG91dCBuZWVkaW5nIHRoZSBjb25jZXB0IG9mIFBsYXllcnNcbiAqIHRoaXMgREVGQVVMVF9TWVNURU1fUExBWUVSIGNhbiBiZSBhIHN1YnN0aXR1dGUuIE9mIGNvdXJzZSwgaWYgeW91J2QgbGlrZSB0b1xuICogY2hhbmdlIHRoZSBuYW1lIGFuZC9vciB0aGUgY29sb3IsIGNyZWF0ZSBhbmQgdXNlIHlvdXIgb3duIFwic3lzdGVtIHBsYXllclwiLlxuICogQGNvbnN0XG4gKi9cbmNvbnN0IERFRkFVTFRfU1lTVEVNX1BMQVlFUiA9IG5ldyBUb3BQbGF5ZXJIVE1MRWxlbWVudCh7Y29sb3I6IFwicmVkXCIsIG5hbWU6IFwiKlwifSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVySFRNTEVsZW1lbnQsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtHcmlkTGF5b3V0fSBmcm9tIFwiLi9HcmlkTGF5b3V0LmpzXCI7XG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVySFRNTEVsZW1lbnQuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuXG5jb25zdCBwYXJzZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHROdW1iZXIgPSAwKSA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW1iZXIpID8gZGVmYXVsdE51bWJlciA6IG51bWJlcjtcbn07XG5cbmNvbnN0IHZhbGlkYXRlUG9zaXRpdmVOdW1iZXIgPSAobnVtYmVyLCBtYXhOdW1iZXIgPSBJbmZpbml0eSkgPT4ge1xuICAgIHJldHVybiAwIDw9IG51bWJlciAmJiBudW1iZXIgPCBtYXhOdW1iZXI7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gcGFyc2VOdW1iZXIobnVtYmVyU3RyaW5nLCBkZWZhdWx0VmFsdWUpO1xuICAgIHJldHVybiB2YWxpZGF0ZVBvc2l0aXZlTnVtYmVyKHZhbHVlKSA/IHZhbHVlIDogZGVmYXVsdFZhbHVlO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlcih2YWx1ZVN0cmluZywgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbmNvbnN0IGdldEJvb2xlYW4gPSAoYm9vbGVhblN0cmluZywgdHJ1ZVZhbHVlLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAodHJ1ZVZhbHVlID09PSBib29sZWFuU3RyaW5nIHx8IFwidHJ1ZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoXCJmYWxzZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IGdldEJvb2xlYW5BdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKHZhbHVlU3RyaW5nLCBbdmFsdWVTdHJpbmcsIFwidHJ1ZVwiXSwgW1wiZmFsc2VcIl0sIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2NhbnZhcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbGF5b3V0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jdXJyZW50UGxheWVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9udW1iZXJPZlJlYWR5RGljZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IGNvbnRleHQgPSAoYm9hcmQpID0+IF9jYW52YXMuZ2V0KGJvYXJkKS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbmNvbnN0IGdldFJlYWR5RGljZSA9IChib2FyZCkgPT4ge1xuICAgIGlmICh1bmRlZmluZWQgPT09IF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpKSB7XG4gICAgICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJlYWR5RGljZSA9IChib2FyZCwgdXBkYXRlKSA9PiB7XG4gICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgZ2V0UmVhZHlEaWNlKGJvYXJkKSArIHVwZGF0ZSk7XG59O1xuXG5jb25zdCBpc1JlYWR5ID0gKGJvYXJkKSA9PiBnZXRSZWFkeURpY2UoYm9hcmQpID09PSBib2FyZC5kaWNlLmxlbmd0aDtcblxuY29uc3QgdXBkYXRlQm9hcmQgPSAoYm9hcmQsIGRpY2UgPSBib2FyZC5kaWNlKSA9PiB7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIGNvbnRleHQoYm9hcmQpLmNsZWFyUmVjdCgwLCAwLCBib2FyZC53aWR0aCwgYm9hcmQuaGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBkaWUucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLy8gSW50ZXJhY3Rpb24gc3RhdGVzXG5jb25zdCBOT05FID0gU3ltYm9sKFwibm9faW50ZXJhY3Rpb25cIik7XG5jb25zdCBIT0xEID0gU3ltYm9sKFwiaG9sZFwiKTtcbmNvbnN0IE1PVkUgPSBTeW1ib2woXCJtb3ZlXCIpO1xuY29uc3QgSU5ERVRFUk1JTkVEID0gU3ltYm9sKFwiaW5kZXRlcm1pbmVkXCIpO1xuY29uc3QgRFJBR0dJTkcgPSBTeW1ib2woXCJkcmFnZ2luZ1wiKTtcblxuLy8gTWV0aG9kcyB0byBoYW5kbGUgaW50ZXJhY3Rpb25cbmNvbnN0IGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzID0gKGNhbnZhcywgeFdpbmRvdywgeVdpbmRvdykgPT4ge1xuICAgIGNvbnN0IGNhbnZhc0JveCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHggPSB4V2luZG93IC0gY2FudmFzQm94LmxlZnQgKiAoY2FudmFzLndpZHRoIC8gY2FudmFzQm94LndpZHRoKTtcbiAgICBjb25zdCB5ID0geVdpbmRvdyAtIGNhbnZhc0JveC50b3AgKiAoY2FudmFzLmhlaWdodCAvIGNhbnZhc0JveC5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIHt4LCB5fTtcbn07XG5cbmNvbnN0IHNldHVwSW50ZXJhY3Rpb24gPSAoYm9hcmQpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldChib2FyZCk7XG5cbiAgICAvLyBTZXR1cCBpbnRlcmFjdGlvblxuICAgIGxldCBvcmlnaW4gPSB7fTtcbiAgICBsZXQgc3RhdGUgPSBOT05FO1xuICAgIGxldCBzdGF0aWNCb2FyZCA9IG51bGw7XG4gICAgbGV0IGRpZVVuZGVyQ3Vyc29yID0gbnVsbDtcbiAgICBsZXQgaG9sZFRpbWVvdXQgPSBudWxsO1xuXG4gICAgY29uc3QgaG9sZERpZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKEhPTEQgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIHRvZ2dsZSBob2xkIC8gcmVsZWFzZVxuICAgICAgICAgICAgY29uc3QgcGxheWVyV2l0aEFUdXJuID0gYm9hcmQucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdCB0b3AtcGxheWVyW2hhcy10dXJuXVwiKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50IGlzIGEgY3VzdG9tIEhUTUwgZWxlbWVudCB0byByZW5kZXIgYW5kIGNvbnRyb2wgYVxuICogZGljZSBib2FyZC4gXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSBnZXRCb29sZWFuKG5ld1ZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgZ2V0Qm9vbGVhbihvbGRWYWx1ZSwgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCkpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQucm90YXRlID0gIWRpc2FibGVkUm90YXRpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAvLyBUaGUgdmFsdWUgaXMgZGV0ZXJtaW5lZCB3aGVuIHVzaW5nIHRoZSBnZXR0ZXJcbiAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQm9hcmQodGhpcyk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6YWRkZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlUmVhZHlEaWNlKHRoaXMsIDEpO1xuICAgICAgICAgICAgaWYgKGlzUmVhZHkodGhpcykpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6cmVtb3ZlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgLTEpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGwgZGljZSBib2FyZHMgZG8gaGF2ZSBhIHBsYXllciBsaXN0LiBJZiB0aGVyZSBpc24ndCBvbmUgeWV0LFxuICAgICAgICAvLyBjcmVhdGUgb25lLlxuICAgICAgICBpZiAobnVsbCA9PT0gdGhpcy5xdWVyeVNlbGVjdG9yKFwidG9wLXBsYXllci1saXN0XCIpKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0b3AtcGxheWVyLWxpc3RcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgYWRvcHRlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBHcmlkTGF5b3V0IHVzZWQgYnkgdGhpcyBEaWNlQm9hcmQgdG8gbGF5b3V0IHRoZSBkaWNlLlxuICAgICAqXG4gICAgICogQHR5cGUge21vZHVsZTpHcmlkTGF5b3V0fkdyaWRMYXlvdXR9XG4gICAgICovXG4gICAgZ2V0IGxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuIE5vdGUsIHRvIGFjdHVhbGx5IHRocm93IHRoZSBkaWNlIHVzZVxuICAgICAqIHtAbGluayB0aHJvd0RpY2V9LiBcbiAgICAgKlxuICAgICAqIEB0eXBlIHttb2R1bGU6VG9wRGllSFRNTEVsZW1lbnR+VG9wRGllSFRNTEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBnZXQgZGljZSgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidG9wLWRpZVwiKV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgcHV0IG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlLCAwIDwgbWF4aW11bS5cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0Lm1heGltdW1OdW1iZXJPZkRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIFdJRFRIX0FUVFJJQlVURSwgREVGQVVMVF9XSURUSCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhFSUdIVF9BVFRSSUJVVEUsIERFRkFVTFRfSEVJR0hUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESVNQRVJTSU9OX0FUVFJJQlVURSwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElFX1NJWkVfQVRUUklCVVRFLCBERUZBVUxUX0RJRV9TSVpFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGRyYWdnZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkRHJhZ2dpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGhlbGQgYnkgYSBQbGF5ZXI/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkSG9sZGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyByb3RhdGluZyBkaWNlIG9uIHRoaXMgYm9hcmQgZGlzYWJsZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkUm90YXRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZHVyYXRpb24gaW4gbXMgdG8gcHJlc3MgdGhlIG1vdXNlIC8gdG91Y2ggYSBkaWUgYmVmb3JlIGl0IGJla29tZXNcbiAgICAgKiBoZWxkIGJ5IHRoZSBQbGF5ZXIuIEl0IGhhcyBvbmx5IGFuIGVmZmVjdCB3aGVuIHRoaXMuaG9sZGFibGVEaWNlID09PVxuICAgICAqIHRydWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBob2xkRHVyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSwgREVGQVVMVF9IT0xEX0RVUkFUSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBwbGF5aW5nIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50W119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCJ0b3AtcGxheWVyLWxpc3RcIikucGxheWVycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcyBwbGF5ZXIsIHRocm93IHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpUb3BQbGF5ZXJIVE1MRWxlbWVudH5Ub3BQbGF5ZXJIVE1MRWxlbWVudH0gW3BsYXllciA9IERFRkFVTFRfU1lTVEVNX1BMQVlFUl0gLSBUaGVcbiAgICAgKiBwbGF5ZXIgdGhhdCBpcyB0aHJvd2luZyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7bW9kdWxlOlRvcERpZUhUTUxFbGVtZW50flRvcERpZUhUTUxFbGVtZW50W119IFRoZSB0aHJvd24gZGljZSBvbiB0aGlzIGJvYXJkLiBUaGlzIGxpc3Qgb2YgZGljZSBpcyB0aGUgc2FtZSBhcyB0aGlzIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50J3Mge0BzZWUgZGljZX0gcHJvcGVydHlcbiAgICAgKi9cbiAgICB0aHJvd0RpY2UocGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSKSB7XG4gICAgICAgIGlmIChwbGF5ZXIgJiYgIXBsYXllci5oYXNUdXJuKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3RhcnRUdXJuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaWNlLmZvckVhY2goZGllID0+IGRpZS50aHJvd0l0KCkpO1xuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRpY2U7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1kaWNlLWJvYXJkXCIsIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50KTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudCxcbiAgICBERUZBVUxUX0RJRV9TSVpFLFxuICAgIERFRkFVTFRfSE9MRF9EVVJBVElPTixcbiAgICBERUZBVUxUX1dJRFRILFxuICAgIERFRkFVTFRfSEVJR0hULFxuICAgIERFRkFVTFRfRElTUEVSU0lPTixcbiAgICBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRURcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vL2ltcG9ydCB7Q29uZmlndXJhdGlvbkVycm9yfSBmcm9tIFwiLi9lcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanNcIjtcbmltcG9ydCB7UmVhZE9ubHlBdHRyaWJ1dGVzfSBmcm9tIFwiLi9taXhpbi9SZWFkT25seUF0dHJpYnV0ZXMuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cbmNvbnN0IENJUkNMRV9ERUdSRUVTID0gMzYwOyAvLyBkZWdyZWVzXG5jb25zdCBOVU1CRVJfT0ZfUElQUyA9IDY7IC8vIERlZmF1bHQgLyByZWd1bGFyIHNpeCBzaWRlZCBkaWUgaGFzIDYgcGlwcyBtYXhpbXVtLlxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFwiSXZvcnlcIjtcbmNvbnN0IERFRkFVTFRfWCA9IDA7IC8vIHB4XG5jb25zdCBERUZBVUxUX1kgPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ST1RBVElPTiA9IDA7IC8vIGRlZ3JlZXNcbmNvbnN0IERFRkFVTFRfT1BBQ0lUWSA9IDAuNTtcblxuY29uc3QgQ09MT1JfQVRUUklCVVRFID0gXCJjb2xvclwiO1xuY29uc3QgSEVMRF9CWV9BVFRSSUJVVEUgPSBcImhlbGQtYnlcIjtcbmNvbnN0IFBJUFNfQVRUUklCVVRFID0gXCJwaXBzXCI7XG5jb25zdCBST1RBVElPTl9BVFRSSUJVVEUgPSBcInJvdGF0aW9uXCI7XG5jb25zdCBYX0FUVFJJQlVURSA9IFwieFwiO1xuY29uc3QgWV9BVFRSSUJVVEUgPSBcInlcIjtcblxuY29uc3QgQkFTRV9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTID0gMTU7IC8vIHB4XG5jb25zdCBCQVNFX1NUUk9LRV9XSURUSCA9IDIuNTsgLy8gcHhcbmNvbnN0IE1JTl9TVFJPS0VfV0lEVEggPSAxOyAvLyBweFxuY29uc3QgSEFMRiA9IEJBU0VfRElFX1NJWkUgLyAyOyAvLyBweFxuY29uc3QgVEhJUkQgPSBCQVNFX0RJRV9TSVpFIC8gMzsgLy8gcHhcbmNvbnN0IFBJUF9TSVpFID0gQkFTRV9ESUVfU0laRSAvIDE1OyAvL3B4XG5jb25zdCBQSVBfQ09MT1IgPSBcImJsYWNrXCI7XG5cbmNvbnN0IGRlZzJyYWQgPSAoZGVnKSA9PiB7XG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcbn07XG5cbmNvbnN0IGlzUGlwTnVtYmVyID0gbiA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobiwgMTApO1xuICAgIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcikgJiYgMSA8PSBudW1iZXIgJiYgbnVtYmVyIDw9IE5VTUJFUl9PRl9QSVBTO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgb2YgcGlwcyBiZXR3ZWVuIDEgYW5kIHRoZSBOVU1CRVJfT0ZfUElQUy5cbiAqXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBBIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgTlVNQkVSX09GX1BJUFMuXG4gKi9cbmNvbnN0IHJhbmRvbVBpcHMgPSAoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOVU1CRVJfT0ZfUElQUykgKyAxO1xuXG5jb25zdCBESUVfVU5JQ09ERV9DSEFSQUNURVJTID0gW1wi4pqAXCIsXCLimoFcIixcIuKaglwiLFwi4pqDXCIsXCLimoRcIixcIuKahVwiXTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgdW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50aW5nIGEgZGllIGZhY2UgdG8gdGhlIG51bWJlciBvZiBwaXBzIG9mXG4gKiB0aGF0IHNhbWUgZGllLiBUaGlzIGZ1bmN0aW9uIGlzIHRoZSByZXZlcnNlIG9mIHBpcHNUb1VuaWNvZGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHUgLSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgdG8gY29udmVydCB0byBwaXBzLlxuICogQHJldHVybnMge051bWJlcnx1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2LCBvclxuICogdW5kZWZpbmVkIGlmIHUgd2FzIG5vdCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZS5cbiAqL1xuY29uc3QgdW5pY29kZVRvUGlwcyA9ICh1KSA9PiB7XG4gICAgY29uc3QgZGllQ2hhckluZGV4ID0gRElFX1VOSUNPREVfQ0hBUkFDVEVSUy5pbmRleE9mKHUpO1xuICAgIHJldHVybiAwIDw9IGRpZUNoYXJJbmRleCA/IGRpZUNoYXJJbmRleCArIDEgOiB1bmRlZmluZWQ7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiB0byBhIHVuaWNvZGUgY2hhcmFjdGVyXG4gKiByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29ycmVzcG9uZGluZyBkaWUgZmFjZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZVxuICogb2YgdW5pY29kZVRvUGlwcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcCAtIFRoZSBudW1iZXIgb2YgcGlwcyB0byBjb252ZXJ0IHRvIGEgdW5pY29kZSBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfHVuZGVmaW5lZH0gVGhlIGNvcnJlc3BvbmRpbmcgdW5pY29kZSBjaGFyYWN0ZXJzIG9yXG4gKiB1bmRlZmluZWQgaWYgcCB3YXMgbm90IGJldHdlZW4gMSBhbmQgNiBpbmNsdXNpdmUuXG4gKi9cbmNvbnN0IHBpcHNUb1VuaWNvZGUgPSBwID0+IGlzUGlwTnVtYmVyKHApID8gRElFX1VOSUNPREVfQ0hBUkFDVEVSU1twIC0gMV0gOiB1bmRlZmluZWQ7XG5cbmNvbnN0IHJlbmRlckhvbGQgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0VQRVJBVE9SID0gd2lkdGggLyAzMDtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gREVGQVVMVF9PUEFDSVRZO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LmFyYyh4ICsgd2lkdGgsIHkgKyB3aWR0aCwgd2lkdGggLSBTRVBFUkFUT1IsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJEaWUgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgsIGNvbG9yKSA9PiB7XG4gICAgY29uc3QgU0NBTEUgPSAod2lkdGggLyBIQUxGKTtcbiAgICBjb25zdCBIQUxGX0lOTkVSX1NJWkUgPSBNYXRoLnNxcnQod2lkdGggKiogMiAvIDIpO1xuICAgIGNvbnN0IElOTkVSX1NJWkUgPSAyICogSEFMRl9JTk5FUl9TSVpFO1xuICAgIGNvbnN0IFJPVU5ERURfQ09STkVSX1JBRElVUyA9IEJBU0VfUk9VTkRFRF9DT1JORVJfUkFESVVTICogU0NBTEU7XG4gICAgY29uc3QgSU5ORVJfU0laRV9ST1VOREVEID0gSU5ORVJfU0laRSAtIDIgKiBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3QgU1RST0tFX1dJRFRIID0gTWF0aC5tYXgoTUlOX1NUUk9LRV9XSURUSCwgQkFTRV9TVFJPS0VfV0lEVEggKiBTQ0FMRSk7XG5cbiAgICBjb25zdCBzdGFydFggPSB4ICsgd2lkdGggLSBIQUxGX0lOTkVSX1NJWkUgKyBST1VOREVEX0NPUk5FUl9SQURJVVM7XG4gICAgY29uc3Qgc3RhcnRZID0geSArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFO1xuXG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgY29udGV4dC5saW5lV2lkdGggPSBTVFJPS0VfV0lEVEg7XG4gICAgY29udGV4dC5tb3ZlVG8oc3RhcnRYLCBzdGFydFkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDI3MCksIGRlZzJyYWQoMCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgc3RhcnRZICsgSU5ORVJfU0laRV9ST1VOREVEICsgUk9VTkRFRF9DT1JORVJfUkFESVVTKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDApLCBkZWcycmFkKDkwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFKTtcbiAgICBjb250ZXh0LmFyYyhzdGFydFgsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUywgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBkZWcycmFkKDkwKSwgZGVnMnJhZCgxODApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggLSBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgxODApLCBkZWcycmFkKDI3MCkpO1xuXG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbn07XG5cbmNvbnN0IHJlbmRlclBpcCA9IChjb250ZXh0LCB4LCB5LCB3aWR0aCkgPT4ge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBQSVBfQ09MT1I7XG4gICAgY29udGV4dC5tb3ZlVG8oeCwgeSk7XG4gICAgY29udGV4dC5hcmMoeCwgeSwgd2lkdGgsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2JvYXJkID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfaGVsZEJ5ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9waXBzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9yb3RhdGlvbiA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfeSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogVG9wRGllSFRNTEVsZW1lbnQgaXMgdGhlIFwidG9wLWRpZVwiIGN1c3RvbSBbSFRNTFxuICogZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50KSByZXByZXNlbnRpbmcgYSBkaWVcbiAqIG9uIHRoZSBkaWNlIGJvYXJkLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKiBAbWl4ZXMgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXNcbiAqL1xuY29uc3QgVG9wRGllSFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIFJlYWRPbmx5QXR0cmlidXRlcyhIVE1MRWxlbWVudCkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcERpZUhUTUxFbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEVuc3VyZSBldmVyeSBkaWUgaGFzIGEgcGlwcywgMSA8PSBwaXBzIDw9IDZcbiAgICAgICAgbGV0IHBpcHMgPSBOYU47XG4gICAgICAgIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShQSVBTX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgIHBpcHMgPSBwYXJzZUludCh0aGlzLmdldEF0dHJpYnV0ZShQSVBTX0FUVFJJQlVURSksIDEwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGlwcykgfHwgMSA+IHBpcHMgfHwgNiA8IHBpcHMpIHtcbiAgICAgICAgICAgIHBpcHMgPSByYW5kb21QaXBzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwcyk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCBwaXBzKTtcblxuICAgICAgICAvLyBPdGhlciBhdHRyaWJ1dGVzLiBUT0RPOiBhZGQgdmFsaWRhdGlvbi5cbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3IgPSB0aGlzLmdldEF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb2xvciA9IERFRkFVTFRfQ09MT1I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoUk9UQVRJT05fQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHBhcnNlSW50KHRoaXMuZ2V0QXR0cmlidXRlKFJPVEFUSU9OX0FUVFJJQlVURSksIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucm90YXRpb24gPSBERUZBVUxUX1JPVEFUSU9OO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKFhfQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgdGhpcy54ID0gcGFyc2VJbnQodGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnggPSBERUZBVUxUX1g7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoWV9BVFRSSUJVVEUpKSB7XG4gICAgICAgICAgICB0aGlzLnkgPSBwYXJzZUludCh0aGlzLmdldEF0dHJpYnV0ZShZX0FUVFJJQlVURSksIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMueSA9IERFRkFVTFRfWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShIRUxEX0JZX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gdGhpcy5nZXRBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhFTERfQllfQVRUUklCVVRFLFxuICAgICAgICAgICAgUElQU19BVFRSSUJVVEUsXG4gICAgICAgICAgICBST1RBVElPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBYX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFlfQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgdGhpcy5wYXJlbnROb2RlKTtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6YWRkZWRcIikpO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuZ2V0KHRoaXMpLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwidG9wLWRpZTpyZW1vdmVkXCIpKTtcbiAgICAgICAgX2JvYXJkLnNldCh0aGlzLCBudWxsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHRoaXMgRGllIHRvIHRoZSBjb3JyZXNwb25kaW5nIHVuaWNvZGUgY2hhcmFjdGVyIG9mIGEgZGllIGZhY2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB1bmljb2RlIGNoYXJhY3RlciBjb3JyZXNwb25kaW5nIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgKiBwaXBzIG9mIHRoaXMgRGllLlxuICAgICAqL1xuICAgIHRvVW5pY29kZSgpIHtcbiAgICAgICAgcmV0dXJuIHBpcHNUb1VuaWNvZGUodGhpcy5waXBzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBzdHJpbmcgcmVwcmVzZW5hdGlvbiBmb3IgdGhpcyBkaWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB1bmljb2RlIHN5bWJvbCBjb3JyZXNwb25kaW5nIHRvIHRoZSBudW1iZXIgb2YgcGlwc1xuICAgICAqIG9mIHRoaXMgZGllLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50b1VuaWNvZGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIERpZSdzIG51bWJlciBvZiBwaXBzLCAxIOKJpCBwaXBzIOKJpCA2LlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgcGlwcygpIHtcbiAgICAgICAgcmV0dXJuIF9waXBzLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIERpZSdzIGNvbG9yLlxuICAgICAqXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgY29sb3IoKSB7XG4gICAgICAgIHJldHVybiBfY29sb3IuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgY29sb3IobmV3Q29sb3IpIHtcbiAgICAgICAgaWYgKG51bGwgPT09IG5ld0NvbG9yKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgX2NvbG9yLnNldCh0aGlzLCBERUZBVUxUX0NPTE9SKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgbmV3Q29sb3IpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFLCBuZXdDb2xvcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFRoZSBQbGF5ZXIgdGhhdCBpcyBob2xkaW5nIHRoaXMgRGllLCBpZiBhbnkuIE51bGwgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQHR5cGUge1BsYXllcnxudWxsfSBcbiAgICAgKi9cbiAgICBnZXQgaGVsZEJ5KCkge1xuICAgICAgICByZXR1cm4gX2hlbGRCeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCBoZWxkQnkocGxheWVyKSB7XG4gICAgICAgIF9oZWxkQnkuc2V0KHRoaXMsIHBsYXllcik7XG4gICAgICAgIGlmIChudWxsID09PSBwbGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiaGVsZC1ieVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaGVsZC1ieVwiLCBwbGF5ZXIudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY29vcmRpbmF0ZXMgb2YgdGhpcyBEaWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Q29vcmRpbmF0ZXN8bnVsbH1cbiAgICAgKi9cbiAgICBnZXQgY29vcmRpbmF0ZXMoKSB7XG4gICAgICAgIHJldHVybiBudWxsID09PSB0aGlzLnggfHwgbnVsbCA9PT0gdGhpcy55ID8gbnVsbCA6IHt4OiB0aGlzLngsIHk6IHRoaXMueX07XG4gICAgfVxuICAgIHNldCBjb29yZGluYXRlcyhjKSB7XG4gICAgICAgIGlmIChudWxsID09PSBjKSB7XG4gICAgICAgICAgICB0aGlzLnggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy55ID0gbnVsbDtcbiAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gYztcbiAgICAgICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyB0aGlzIERpZSBoYXZlIGNvb3JkaW5hdGVzP1xuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSB3aGVuIHRoZSBEaWUgZG9lcyBoYXZlIGNvb3JkaW5hdGVzXG4gICAgICovXG4gICAgaGFzQ29vcmRpbmF0ZXMoKSB7XG4gICAgICAgIHJldHVybiBudWxsICE9PSB0aGlzLmNvb3JkaW5hdGVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB4IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHgoKSB7XG4gICAgICAgIHJldHVybiBfeC5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB4KG5ld1gpIHtcbiAgICAgICAgX3guc2V0KHRoaXMsIG5ld1gpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInhcIiwgbmV3WCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHkgY29vcmRpbmF0ZVxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgeSgpIHtcbiAgICAgICAgcmV0dXJuIF95LmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHkobmV3WSkge1xuICAgICAgICBfeS5zZXQodGhpcywgbmV3WSk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwieVwiLCBuZXdZKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcm90YXRpb24gb2YgdGhpcyBEaWUuIDAg4omkIHJvdGF0aW9uIOKJpCAzNjAuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfG51bGx9XG4gICAgICovXG4gICAgZ2V0IHJvdGF0aW9uKCkge1xuICAgICAgICByZXR1cm4gX3JvdGF0aW9uLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHJvdGF0aW9uKG5ld1IpIHtcbiAgICAgICAgaWYgKG51bGwgPT09IG5ld1IpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwicm90YXRpb25cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUm90YXRpb24gPSBuZXdSICUgQ0lSQ0xFX0RFR1JFRVM7XG4gICAgICAgICAgICBfcm90YXRpb24uc2V0KHRoaXMsIG5vcm1hbGl6ZWRSb3RhdGlvbik7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInJvdGF0aW9uXCIsIG5vcm1hbGl6ZWRSb3RhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaHJvdyB0aGlzIERpZS4gVGhlIG51bWJlciBvZiBwaXBzIHRvIGEgcmFuZG9tIG51bWJlciBuLCAxIOKJpCBuIOKJpCA2LlxuICAgICAqIE9ubHkgZGljZSB0aGF0IGFyZSBub3QgYmVpbmcgaGVsZCBjYW4gYmUgdGhyb3duLlxuICAgICAqXG4gICAgICogQGZpcmVzIFwidG9wOnRocm93LWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0aHJvd0l0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIF9waXBzLnNldCh0aGlzLCByYW5kb21QaXBzKCkpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoUElQU19BVFRSSUJVVEUsIHRoaXMucGlwcyk7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwidG9wOnRocm93LWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXIgaG9sZHMgdGhpcyBEaWUuIEEgcGxheWVyIGNhbiBvbmx5IGhvbGQgYSBkaWUgdGhhdCBpcyBub3RcbiAgICAgKiBiZWluZyBoZWxkIGJ5IGFub3RoZXIgcGxheWVyIHlldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOlBsYXllcn5QbGF5ZXJ9IHBsYXllciAtIFRoZSBwbGF5ZXIgd2hvIHdhbnRzIHRvIGhvbGQgdGhpcyBEaWUuXG4gICAgICogQGZpcmVzIFwidG9wOmhvbGQtZGllXCIgd2l0aCBwYXJhbWV0ZXJzIHRoaXMgRGllIGFuZCB0aGUgcGxheWVyLlxuICAgICAqL1xuICAgIGhvbGRJdChwbGF5ZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmhlbGRCeSA9IHBsYXllcjtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3A6aG9sZC1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHBsYXllclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgRGllIGJlaW5nIGhlbGQgYnkgYW55IHBsYXllcj9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGlzIERpZSBpcyBiZWluZyBoZWxkIGJ5IGFueSBwbGF5ZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBpc0hlbGQoKSB7XG4gICAgICAgIHJldHVybiBudWxsICE9PSB0aGlzLmhlbGRCeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIHJlbGVhc2VzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSByZWxlYXNlIGRpY2UgdGhhdCBzaGUgaXNcbiAgICAgKiBob2xkaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHttb2R1bGU6UGxheWVyflBsYXllcn0gcGxheWVyIC0gVGhlIHBsYXllciB3aG8gd2FudHMgdG8gcmVsZWFzZSB0aGlzIERpZS5cbiAgICAgKiBAZmlyZXMgXCJ0b3A6cmVsYXNlLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllciByZWxlYXNpbmcgaXQuXG4gICAgICovXG4gICAgcmVsZWFzZUl0KHBsYXllcikge1xuICAgICAgICBpZiAodGhpcy5pc0hlbGQoKSAmJiB0aGlzLmhlbGRCeS5lcXVhbHMocGxheWVyKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEVMRF9CWV9BVFRSSUJVVEUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInRvcDpyZWxlYXNlLWRpZVwiLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSBUaGUgY2FudmFzIGNvbnRleHQgdG8gZHJhd1xuICAgICAqIG9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRpZVNpemUgLSBUaGUgc2l6ZSBvZiBhIGRpZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Nvb3JkaW5hdGVzID0gdGhpcy5jb29yZGluYXRlc10gLSBUaGUgY29vcmRpbmF0ZXMgdG9cbiAgICAgKiBkcmF3IHRoaXMgZGllLiBCeSBkZWZhdWx0LCB0aGlzIGRpZSBpcyBkcmF3biBhdCBpdHMgb3duIGNvb3JkaW5hdGVzLFxuICAgICAqIGJ1dCB5b3UgY2FuIGFsc28gZHJhdyBpdCBlbHNld2hlcmUgaWYgc28gbmVlZGVkLlxuICAgICAqL1xuICAgIHJlbmRlcihjb250ZXh0LCBkaWVTaXplLCBjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkaWVTaXplIC8gQkFTRV9ESUVfU0laRTtcbiAgICAgICAgY29uc3QgU0hBTEYgPSBIQUxGICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNUSElSRCA9IFRISVJEICogc2NhbGU7XG4gICAgICAgIGNvbnN0IFNQSVBfU0laRSA9IFBJUF9TSVpFICogc2NhbGU7XG5cbiAgICAgICAgY29uc3Qge3gsIHl9ID0gY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgIHJlbmRlckhvbGQoY29udGV4dCwgeCwgeSwgU0hBTEYsIHRoaXMuaGVsZEJ5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgwICE9PSB0aGlzLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSh4ICsgU0hBTEYsIHkgKyBTSEFMRik7XG4gICAgICAgICAgICBjb250ZXh0LnJvdGF0ZShkZWcycmFkKHRoaXMucm90YXRpb24pKTtcbiAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC0xICogKHggKyBTSEFMRiksIC0xICogKHkgKyBTSEFMRikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRGllKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmNvbG9yKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMucGlwcykge1xuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU0hBTEYsIHkgKyBTSEFMRiwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiAvLyBObyBvdGhlciB2YWx1ZXMgYWxsb3dlZCAvIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBjb250ZXh0XG4gICAgICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuICAgIH1cbn07XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b3AtZGllXCIsIFRvcERpZUhUTUxFbGVtZW50KTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWVIVE1MRWxlbWVudCxcbiAgICB1bmljb2RlVG9QaXBzLFxuICAgIHBpcHNUb1VuaWNvZGVcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuaW1wb3J0IHtERUZBVUxUX1NZU1RFTV9QTEFZRVJ9IGZyb20gXCIuL1RvcFBsYXllckhUTUxFbGVtZW50LmpzXCI7XG5cbi8qKlxuICogVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50IHRvIGRlc2NyaWJlIHRoZSBwbGF5ZXJzIGluIHRoZSBnYW1lLlxuICpcbiAqIEBleHRlbmRzIEhUTUxFbGVtZW50XG4gKi9cbmNvbnN0IFRvcFBsYXllckxpc3RIVE1MRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFRvcFBsYXllckxpc3RIVE1MRWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKDAgPj0gdGhpcy5wbGF5ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChERUZBVUxUX1NZU1RFTV9QTEFZRVIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG9wOnN0YXJ0LXR1cm5cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAvLyBPbmx5IG9uZSBwbGF5ZXIgY2FuIGhhdmUgYSB0dXJuIGF0IGFueSBnaXZlbiB0aW1lLlxuICAgICAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihwID0+ICFwLmVxdWFscyhldmVudC5kZXRhaWwucGxheWVyKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChwID0+IHAuZW5kVHVybigpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllcnMgaW4gdGhpcyBsaXN0LlxuICAgICAqXG4gICAgICogQHR5cGUge21vZHVsZTpUb3BQbGF5ZXJIVE1MRWxlbWVudH5Ub3BQbGF5ZXJIVE1MRWxlbWVudFtdfVxuICAgICAqL1xuICAgIGdldCBwbGF5ZXJzKCkge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0b3AtcGxheWVyXCIpXTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLXBsYXllci1saXN0XCIsIFRvcFBsYXllckxpc3RIVE1MRWxlbWVudCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50XG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cbmltcG9ydCB7VG9wRGljZUJvYXJkSFRNTEVsZW1lbnR9IGZyb20gXCIuL1RvcERpY2VCb2FyZEhUTUxFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RvcERpZUhUTUxFbGVtZW50fSBmcm9tIFwiLi9Ub3BEaWVIVE1MRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUb3BQbGF5ZXJIVE1MRWxlbWVudH0gZnJvbSBcIi4vVG9wUGxheWVySFRNTEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VG9wUGxheWVyTGlzdEhUTUxFbGVtZW50fSBmcm9tIFwiLi9Ub3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQuanNcIjtcblxud2luZG93LnR3ZW50eW9uZXBpcHMgPSB3aW5kb3cudHdlbnR5b25lcGlwcyB8fCBPYmplY3QuZnJlZXplKHtcbiAgICBWRVJTSU9OOiBcIjAuMC4xXCIsXG4gICAgTElDRU5TRTogXCJMR1BMLTMuMFwiLFxuICAgIFdFQlNJVEU6IFwiaHR0cHM6Ly90d2VudHlvbmVwaXBzLm9yZ1wiLFxuICAgIEhUTUxFbGVtZW50czoge1xuICAgICAgICBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudDogVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQsXG4gICAgICAgIFRvcERpZUhUTUxFbGVtZW50OiBUb3BEaWVIVE1MRWxlbWVudCxcbiAgICAgICAgVG9wUGxheWVySFRNTEVsZW1lbnQ6IFRvcFBsYXllckhUTUxFbGVtZW50LFxuICAgICAgICBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQ6IFRvcFBsYXllckxpc3RIVE1MRWxlbWVudFxuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbIkNPTE9SX0FUVFJJQlVURSIsIl9jb2xvciJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxLQUFLLENBQUM7Ozs7Ozs7O0lBUTNDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xCO0NBQ0o7O0FDeENEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUE7Ozs7QUFJQSxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEtBQUs7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7O0FBR0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0I5QixNQUFNLFVBQVUsR0FBRyxNQUFNOzs7Ozs7O0lBT3JCLFdBQVcsQ0FBQztRQUNSLEtBQUs7UUFDTCxNQUFNO1FB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QUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxDQUFDLEVBQUU7WUFDSixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELE1BQU07U0FDVDtRQUNELFFBQVE7U0FDUDs7O1FBR0QsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzFDO0NBQ0osQ0FBQzs7QUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7QUN0Z0IzRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUVBOzs7OztBQUtBLE1BQU0sd0JBQXdCLEdBQUcsY0FBYyxXQUFXLENBQUM7Ozs7O0lBS3ZELFdBQVcsR0FBRztRQUNWLEtBQUssRUFBRSxDQUFDO0tBQ1g7O0lBRUQsaUJBQWlCLEdBQUc7UUFDaEIsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQzNDOztRQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssS0FBSzs7WUFFL0MsSUFBSSxDQUFDLE9BQU87aUJBQ1AsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNsQyxDQUFDLENBQUM7S0FDTjs7SUFFRCxvQkFBb0IsR0FBRztLQUN0Qjs7Ozs7OztJQU9ELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7S0FDdkQ7Q0FDSixDQUFDOztBQUVGLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLENBQUM7O0FDN0QxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBS0EsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDekQsT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsT0FBTyxFQUFFLDJCQUEyQjtJQUNwQyxZQUFZLEVBQUU7UUFDVix1QkFBdUIsRUFBRSx1QkFBdUI7UUFDaEQsaUJBQWlCLEVBQUUsaUJBQWlCO1FBQ3BDLG9CQUFvQixFQUFFLG9CQUFvQjtRQUMxQyx3QkFBd0IsRUFBRSx3QkFBd0I7S0FDckQ7Q0FDSixDQUFDLENBQUMiLCJwcmVFeGlzdGluZ0NvbW1lbnQiOiIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpwdWRXeHNMQ0p6YjNWeVkyVnpJanBiSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OWxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlIzSnBaRXhoZVc5MWRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZWRzl3UkdsalpVSnZZWEprU0ZSTlRFVnNaVzFsYm5RdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlZHOXdSR2xsU0ZSTlRFVnNaVzFsYm5RdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlZHOXdVR3hoZVdWeVRHbHpkRWhVVFV4RmJHVnRaVzUwTG1weklpd2lMMmh2YldVdmFIVjFZaTlRY205cVpXTjBjeTkwZDJWdWRIa3RiMjVsTFhCcGNITXZjM0pqTDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTVxY3lKZExDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5b3FYRzRnS2lCQWJXOWtkV3hsWEc0Z0tpOWNibHh1THlvcVhHNGdLaUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0pjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJGY25KdmNseHVJQ292WEc1amIyNXpkQ0JEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRVZ5Y205eUlIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJZ2QybDBhQ0J0WlhOellXZGxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHMWxjM05oWjJVZ0xTQlVhR1VnYldWemMyRm5aU0JoYzNOdlkybGhkR1ZrSUhkcGRHZ2dkR2hwYzF4dUlDQWdJQ0FxSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2k1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2lodFpYTnpZV2RsS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0cxbGMzTmhaMlVwTzF4dUlDQWdJSDFjYm4wN1hHNWNibVY0Y0c5eWRDQjdRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlmVHRjYmlJc0lpOHFLaUJjYmlBcUlFTnZjSGx5YVdkb2RDQW9ZeWtnTWpBeE9DQklkWFZpSUdSbElFSmxaWEpjYmlBcVhHNGdLaUJVYUdseklHWnBiR1VnYVhNZ2NHRnlkQ0J2WmlCMGQyVnVkSGt0YjI1bExYQnBjSE11WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdaeVpXVWdjMjltZEhkaGNtVTZJSGx2ZFNCallXNGdjbVZrYVhOMGNtbGlkWFJsSUdsMElHRnVaQzl2Y2lCdGIyUnBabmtnYVhSY2JpQXFJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sSUdGeklIQjFZbXhwYzJobFpDQmllVnh1SUNvZ2RHaGxJRVp5WldVZ1UyOW1kSGRoY21VZ1JtOTFibVJoZEdsdmJpd2daV2wwYUdWeUlIWmxjbk5wYjI0Z015QnZaaUIwYUdVZ1RHbGpaVzV6WlN3Z2IzSWdLR0YwSUhsdmRYSmNiaUFxSUc5d2RHbHZiaWtnWVc1NUlHeGhkR1Z5SUhabGNuTnBiMjR1WEc0Z0tseHVJQ29nVkhkbGJuUjVMVzl1WlMxd2FYQnpJR2x6SUdScGMzUnlhV0oxZEdWa0lHbHVJSFJvWlNCb2IzQmxJSFJvWVhRZ2FYUWdkMmxzYkNCaVpTQjFjMlZtZFd3c0lHSjFkRnh1SUNvZ1YwbFVTRTlWVkNCQlRsa2dWMEZTVWtGT1ZGazdJSGRwZEdodmRYUWdaWFpsYmlCMGFHVWdhVzF3YkdsbFpDQjNZWEp5WVc1MGVTQnZaaUJOUlZKRFNFRk9WRUZDU1V4SlZGbGNiaUFxSUc5eUlFWkpWRTVGVTFNZ1JrOVNJRUVnVUVGU1ZFbERWVXhCVWlCUVZWSlFUMU5GTGlBZ1UyVmxJSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqWEc0Z0tpQk1hV05sYm5ObElHWnZjaUJ0YjNKbElHUmxkR0ZwYkhNdVhHNGdLbHh1SUNvZ1dXOTFJSE5vYjNWc1pDQm9ZWFpsSUhKbFkyVnBkbVZrSUdFZ1kyOXdlU0J2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObFhHNGdLaUJoYkc5dVp5QjNhWFJvSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTRnSUVsbUlHNXZkQ3dnYzJWbElEeG9kSFJ3T2k4dmQzZDNMbWR1ZFM1dmNtY3ZiR2xqWlc1elpYTXZQaTVjYmlBcUlFQnBaMjV2Y21WY2JpQXFMMXh1YVcxd2IzSjBJSHREYjI1bWFXZDFjbUYwYVc5dVJYSnliM0o5SUdaeWIyMGdYQ0l1TDJWeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVxYzF3aU8xeHVYRzR2S2lwY2JpQXFJRUJ0YjJSMWJHVmNiaUFxTDF4dVhHNWpiMjV6ZENCR1ZVeE1YME5KVWtOTVJWOUpUbDlFUlVkU1JVVlRJRDBnTXpZd08xeHVYRzVqYjI1emRDQnlZVzVrYjIxcGVtVkRaVzUwWlhJZ1BTQW9iaWtnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUFvTUM0MUlEdzlJRTFoZEdndWNtRnVaRzl0S0NrZ1B5Qk5ZWFJvTG1ac2IyOXlJRG9nVFdGMGFDNWpaV2xzS1M1allXeHNLREFzSUc0cE8xeHVmVHRjYmx4dUx5OGdVSEpwZG1GMFpTQm1hV1ZzWkhOY2JtTnZibk4wSUY5M2FXUjBhQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZhR1ZwWjJoMElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5amIyeHpJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXliM2R6SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlrYVdObElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5a2FXVlRhWHBsSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjlrYVhOd1pYSnphVzl1SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl5YjNSaGRHVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVYRzR2S2lwY2JpQXFJRUIwZVhCbFpHVm1JSHRQWW1wbFkzUjlJRWR5YVdSTVlYbHZkWFJEYjI1bWFXZDFjbUYwYVc5dVhHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbmRwWkhSb0lDMGdWR2hsSUcxcGJtbHRZV3dnZDJsa2RHZ2diMllnZEdocGMxeHVJQ29nUjNKcFpFeGhlVzkxZENCcGJpQndhWGhsYkhNdU8xeHVJQ29nUUhCeWIzQmxjblI1SUh0T2RXMWlaWEo5SUdOdmJtWnBaeTVvWldsbmFIUmRJQzBnVkdobElHMXBibWx0WVd3Z2FHVnBaMmgwSUc5bVhHNGdLaUIwYUdseklFZHlhV1JNWVhsdmRYUWdhVzRnY0dsNFpXeHpMaTVjYmlBcUlFQndjbTl3WlhKMGVTQjdUblZ0WW1WeWZTQmpiMjVtYVdjdVpHbHpjR1Z5YzJsdmJpQXRJRlJvWlNCa2FYTjBZVzVqWlNCbWNtOXRJSFJvWlNCalpXNTBaWElnYjJZZ2RHaGxYRzRnS2lCc1lYbHZkWFFnWVNCa2FXVWdZMkZ1SUdKbElHeGhlVzkxZEM1Y2JpQXFJRUJ3Y205d1pYSjBlU0I3VG5WdFltVnlmU0JqYjI1bWFXY3VaR2xsVTJsNlpTQXRJRlJvWlNCemFYcGxJRzltSUdFZ1pHbGxMbHh1SUNvdlhHNWNiaThxS2x4dUlDb2dSM0pwWkV4aGVXOTFkQ0JvWVc1a2JHVnpJR3hoZVdsdVp5QnZkWFFnZEdobElHUnBZMlVnYjI0Z1lTQkVhV05sUW05aGNtUXVYRzRnS2k5Y2JtTnZibk4wSUVkeWFXUk1ZWGx2ZFhRZ1BTQmpiR0Z6Y3lCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3UjNKcFpFeGhlVzkxZEVOdmJtWnBaM1Z5WVhScGIyNTlJR052Ym1acFp5QXRJRlJvWlNCamIyNW1hV2QxY21GMGFXOXVJRzltSUhSb1pTQkhjbWxrVEdGNWIzVjBYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9lMXh1SUNBZ0lDQWdJQ0IzYVdSMGFDeGNiaUFnSUNBZ0lDQWdhR1ZwWjJoMExGeHVJQ0FnSUNBZ0lDQmthWE53WlhKemFXOXVMRnh1SUNBZ0lDQWdJQ0JrYVdWVGFYcGxYRzRnSUNBZ2ZTQTlJSHQ5S1NCN1hHNGdJQ0FnSUNBZ0lGOWthV05sTG5ObGRDaDBhR2x6TENCYlhTazdYRzRnSUNBZ0lDQWdJRjlrYVdWVGFYcGxMbk5sZENoMGFHbHpMQ0F4S1R0Y2JpQWdJQ0FnSUNBZ1gzZHBaSFJvTG5ObGRDaDBhR2x6TENBd0tUdGNiaUFnSUNBZ0lDQWdYMmhsYVdkb2RDNXpaWFFvZEdocGN5d2dNQ2s3WEc0Z0lDQWdJQ0FnSUY5eWIzUmhkR1V1YzJWMEtIUm9hWE1zSUhSeWRXVXBPMXh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR2x6Y0dWeWMybHZiaUE5SUdScGMzQmxjbk5wYjI0N1hHNGdJQ0FnSUNBZ0lIUm9hWE11WkdsbFUybDZaU0E5SUdScFpWTnBlbVU3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVkMmxrZEdnZ1BTQjNhV1IwYUR0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVvWldsbmFIUWdQU0JvWldsbmFIUTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhkcFpIUm9JR2x1SUhCcGVHVnNjeUIxYzJWa0lHSjVJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDNWNiaUFnSUNBZ0tpQkFkR2h5YjNkeklHMXZaSFZzWlRwbGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUZkcFpIUm9JRDQ5SURCY2JpQWdJQ0FnS2lCQWRIbHdaU0I3VG5WdFltVnlmU0JjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnZDJsa2RHZ29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmZDJsa2RHZ3VaMlYwS0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITmxkQ0IzYVdSMGFDaDNLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRDRnZHlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1YybGtkR2dnYzJodmRXeGtJR0psSUdFZ2JuVnRZbVZ5SUd4aGNtZGxjaUIwYUdGdUlEQXNJR2R2ZENBbkpIdDNmU2NnYVc1emRHVmhaQzVnS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmZkMmxrZEdndWMyVjBLSFJvYVhNc0lIY3BPMXh1SUNBZ0lDQWdJQ0IwYUdsekxsOWpZV3hqZFd4aGRHVkhjbWxrS0hSb2FYTXVkMmxrZEdnc0lIUm9hWE11YUdWcFoyaDBLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2FHVnBaMmgwSUdsdUlIQnBlR1ZzY3lCMWMyVmtJR0o1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzRnWEc0Z0lDQWdJQ29nUUhSb2NtOTNjeUJ0YjJSMWJHVTZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxrTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpQklaV2xuYUhRZ1BqMGdNRnh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2FHVnBaMmgwS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gyaGxhV2RvZEM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzJWMElHaGxhV2RvZENob0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnd0lENGdhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRU52Ym1acFozVnlZWFJwYjI1RmNuSnZjaWhnU0dWcFoyaDBJSE5vYjNWc1pDQmlaU0JoSUc1MWJXSmxjaUJzWVhKblpYSWdkR2hoYmlBd0xDQm5iM1FnSnlSN2FIMG5JR2x1YzNSbFlXUXVZQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1gyaGxhV2RvZEM1elpYUW9kR2hwY3l3Z2FDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyTmhiR04xYkdGMFpVZHlhV1FvZEdocGN5NTNhV1IwYUN3Z2RHaHBjeTVvWldsbmFIUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUd4aGVXOTFkQ0J2YmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1SUZSb2FYTmNiaUFnSUNBZ0tpQnVkVzFpWlhJZ2FYTWdQajBnTUM0Z1VtVmhaQ0J2Ym14NUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDJOdmJITWdLaUIwYUdsekxsOXliM2R6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQmthWE53WlhKemFXOXVJR3hsZG1Wc0lIVnpaV1FnWW5rZ2RHaHBjeUJIY21sa1RHRjViM1YwTGlCVWFHVWdaR2x6Y0dWeWMybHZiaUJzWlhabGJGeHVJQ0FnSUNBcUlHbHVaR2xqWVhSbGN5QjBhR1VnWkdsemRHRnVZMlVnWm5KdmJTQjBhR1VnWTJWdWRHVnlJR1JwWTJVZ1kyRnVJR0psSUd4aGVXOTFkQzRnVlhObElERWdabTl5SUdGY2JpQWdJQ0FnS2lCMGFXZG9kQ0J3WVdOclpXUWdiR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUm9jbTkzY3lCdGIyUjFiR1U2WlhKeWIzSXZRMjl1Wm1sbmRYSmhkR2x2YmtWeWNtOXlMa052Ym1acFozVnlZWFJwYjI1RmNuSnZjaUJFYVhOd1pYSnphVzl1SUQ0OUlEQmNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FYTndaWEp6YVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMlJwYzNCbGNuTnBiMjR1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSE5sZENCa2FYTndaWEp6YVc5dUtHUXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQaUJrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5S0dCRWFYTndaWEp6YVc5dUlITm9iM1ZzWkNCaVpTQmhJRzUxYldKbGNpQnNZWEpuWlhJZ2RHaGhiaUF3TENCbmIzUWdKeVI3WkgwbklHbHVjM1JsWVdRdVlDazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlrYVhOd1pYSnphVzl1TG5ObGRDaDBhR2x6TENCa0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYzJsNlpTQnZaaUJoSUdScFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ2JXOWtkV3hsT21WeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lnUkdsbFUybDZaU0ErUFNBd1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsbFUybDZaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5a2FXVlRhWHBsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WlhRZ1pHbGxVMmw2WlNoa2N5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStQU0JrY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1pHbGxVMmw2WlNCemFHOTFiR1FnWW1VZ1lTQnVkVzFpWlhJZ2JHRnlaMlZ5SUhSb1lXNGdNU3dnWjI5MElDY2tlMlJ6ZlNjZ2FXNXpkR1ZoWkM1Z0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JmWkdsbFUybDZaUzV6WlhRb2RHaHBjeXdnWkhNcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TGw5allXeGpkV3hoZEdWSGNtbGtLSFJvYVhNdWQybGtkR2dzSUhSb2FYTXVhR1ZwWjJoMEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCblpYUWdjbTkwWVhSbEtDa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnlJRDBnWDNKdmRHRjBaUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxYm1SbFptbHVaV1FnUFQwOUlISWdQeUIwY25WbElEb2djanRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpaWFFnY205MFlYUmxLSElwSUh0Y2JpQWdJQ0FnSUNBZ1gzSnZkR0YwWlM1elpYUW9kR2hwY3l3Z2NpazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUc1MWJXSmxjaUJ2WmlCeWIzZHpJR2x1SUhSb2FYTWdSM0pwWkV4aGVXOTFkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDUxYldKbGNuMGdWR2hsSUc1MWJXSmxjaUJ2WmlCeWIzZHpMQ0F3SUR3Z2NtOTNjeTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JmY205M2N5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjl5YjNkekxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnYm5WdFltVnlJRzltSUdOdmJIVnRibk1nYVc0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VG5WdFltVnlmU0JVYUdVZ2JuVnRZbVZ5SUc5bUlHTnZiSFZ0Ym5Nc0lEQWdQQ0JqYjJ4MWJXNXpMbHh1SUNBZ0lDQXFJRUJ3Y21sMllYUmxYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRjlqYjJ4ektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMk52YkhNdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JqWlc1MFpYSWdZMlZzYkNCcGJpQjBhR2x6SUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0UFltcGxZM1I5SUZSb1pTQmpaVzUwWlhJZ0tISnZkeXdnWTI5c0tTNWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmZZMlZ1ZEdWeUtDa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnliM2NnUFNCeVlXNWtiMjFwZW1WRFpXNTBaWElvZEdocGN5NWZjbTkzY3lBdklESXBJQzBnTVR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5c0lEMGdjbUZ1Wkc5dGFYcGxRMlZ1ZEdWeUtIUm9hWE11WDJOdmJITWdMeUF5S1NBdElERTdYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSHR5YjNjc0lHTnZiSDA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVEdGNWIzVjBJR1JwWTJVZ2IyNGdkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0dGIyUjFiR1U2UkdsbGZrUnBaVnRkZlNCa2FXTmxJQzBnVkdobElHUnBZMlVnZEc4Z2JHRjViM1YwSUc5dUlIUm9hWE1nVEdGNWIzVjBMbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMjF2WkhWc1pUcEVhV1YrUkdsbFcxMTlJRlJvWlNCellXMWxJR3hwYzNRZ2IyWWdaR2xqWlN3Z1luVjBJRzV2ZHlCc1lYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEdoeWIzZHpJSHR0YjJSMWJHVTZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eWZrTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdWR2hsSUc1MWJXSmxjaUJ2Wmx4dUlDQWdJQ0FxSUdScFkyVWdjMmh2ZFd4a0lHNXZkQ0JsZUdObFpXUWdkR2hsSUcxaGVHbHRkVzBnYm5WdFltVnlJRzltSUdScFkyVWdkR2hwY3lCTVlYbHZkWFFnWTJGdVhHNGdJQ0FnSUNvZ2JHRjViM1YwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR3hoZVc5MWRDaGthV05sS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hrYVdObExteGxibWQwYUNBK0lIUm9hWE11YldGNGFXMTFiVTUxYldKbGNrOW1SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1ZHaGxJRzUxYldKbGNpQnZaaUJrYVdObElIUm9ZWFFnWTJGdUlHSmxJR3hoZVc5MWRDQnBjeUFrZTNSb2FYTXViV0Y0YVcxMWJVNTFiV0psY2s5bVJHbGpaWDBzSUdkdmRDQWtlMlJwWTJVdWJHVnVaMmgwZlNCa2FXTmxJR2x1YzNSbFlXUXVZQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNBOUlGdGRPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmthV05sVkc5TVlYbHZkWFFnUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdScFpTQnZaaUJrYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9aR2xsTG1oaGMwTnZiM0prYVc1aGRHVnpLQ2tnSmlZZ1pHbGxMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1JHbGpaU0IwYUdGMElHRnlaU0JpWldsdVp5Qm9aV3hrSUdGdVpDQm9ZWFpsSUdKbFpXNGdiR0Y1YjNWMElHSmxabTl5WlNCemFHOTFiR1JjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCclpXVndJSFJvWldseUlHTjFjbkpsYm5RZ1kyOXZjbVJwYm1GMFpYTWdZVzVrSUhKdmRHRjBhVzl1TGlCSmJpQnZkR2hsY2lCM2IzSmtjeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGFHVnpaU0JrYVdObElHRnlaU0J6YTJsd2NHVmtMbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGpaVlJ2VEdGNWIzVjBMbkIxYzJnb1pHbGxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzFoZUNBOUlFMWhkR2d1YldsdUtHUnBZMlV1YkdWdVozUm9JQ29nZEdocGN5NWthWE53WlhKemFXOXVMQ0IwYUdsekxtMWhlR2x0ZFcxT2RXMWlaWEpQWmtScFkyVXBPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmhkbUZwYkdGaWJHVkRaV3hzY3lBOUlIUm9hWE11WDJOdmJYQjFkR1ZCZG1GcGJHRmliR1ZEWld4c2N5aHRZWGdzSUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sS1R0Y2JseHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR1JwWlNCdlppQmthV05sVkc5TVlYbHZkWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmhibVJ2YlVsdVpHVjRJRDBnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nWVhaaGFXeGhZbXhsUTJWc2JITXViR1Z1WjNSb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEpoYm1SdmJVTmxiR3dnUFNCaGRtRnBiR0ZpYkdWRFpXeHNjMXR5WVc1a2IyMUpibVJsZUYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JoZG1GcGJHRmliR1ZEWld4c2N5NXpjR3hwWTJVb2NtRnVaRzl0U1c1a1pYZ3NJREVwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdVdVkyOXZjbVJwYm1GMFpYTWdQU0IwYUdsekxsOXVkVzFpWlhKVWIwTnZiM0prYVc1aGRHVnpLSEpoYm1SdmJVTmxiR3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsTG5KdmRHRjBhVzl1SUQwZ2RHaHBjeTV5YjNSaGRHVWdQeUJOWVhSb0xuSnZkVzVrS0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJHVlV4TVgwTkpVa05NUlY5SlRsOUVSVWRTUlVWVEtTQTZJRzUxYkd3N1hHNGdJQ0FnSUNBZ0lDQWdJQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaUzV3ZFhOb0tHUnBaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQmZaR2xqWlM1elpYUW9kR2hwY3l3Z1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVcE8xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhiSEpsWVdSNVRHRjViM1YwUkdsalpUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjF3ZFhSbElHRWdiR2x6ZENCM2FYUm9JR0YyWVdsc1lXSnNaU0JqWld4c2N5QjBieUJ3YkdGalpTQmthV05sSUc5dUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUcxaGVDQXRJRlJvWlNCdWRXMWlaWElnWlcxd2RIa2dZMlZzYkhNZ2RHOGdZMjl0Y0hWMFpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwUnBaVnRkZlNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNBdElFRWdiR2x6ZENCM2FYUm9JR1JwWTJVZ2RHaGhkQ0JvWVhabElHRnNjbVZoWkhrZ1ltVmxiaUJzWVhsdmRYUXVYRzRnSUNBZ0lDb2dYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUbFZ0WW1WeVcxMTlJRlJvWlNCc2FYTjBJRzltSUdGMllXbHNZV0pzWlNCalpXeHNjeUJ5WlhCeVpYTmxiblJsWkNCaWVTQjBhR1ZwY2lCdWRXMWlaWEl1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMjl0Y0hWMFpVRjJZV2xzWVdKc1pVTmxiR3h6S0cxaGVDd2dZV3h5WldGa2VVeGhlVzkxZEVScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZWFpoYVd4aFlteGxJRDBnYm1WM0lGTmxkQ2dwTzF4dUlDQWdJQ0FnSUNCc1pYUWdiR1YyWld3Z1BTQXdPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnRZWGhNWlhabGJDQTlJRTFoZEdndWJXbHVLSFJvYVhNdVgzSnZkM01zSUhSb2FYTXVYMk52YkhNcE8xeHVYRzRnSUNBZ0lDQWdJSGRvYVd4bElDaGhkbUZwYkdGaWJHVXVjMmw2WlNBOElHMWhlQ0FtSmlCc1pYWmxiQ0E4SUcxaGVFeGxkbVZzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdObGJHd2diMllnZEdocGN5NWZZMlZzYkhOUGJreGxkbVZzS0d4bGRtVnNLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaDFibVJsWm1sdVpXUWdJVDA5SUdObGJHd2dKaVlnZEdocGN5NWZZMlZzYkVselJXMXdkSGtvWTJWc2JDd2dZV3h5WldGa2VVeGhlVzkxZEVScFkyVXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRjJZV2xzWVdKc1pTNWhaR1FvWTJWc2JDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCc1pYWmxiQ3NyTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlFRnljbUY1TG1aeWIyMG9ZWFpoYVd4aFlteGxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEWVd4amRXeGhkR1VnWVd4c0lHTmxiR3h6SUc5dUlHeGxkbVZzSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVWdiR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUd4bGRtVnNJQzBnVkdobElHeGxkbVZzSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJ2WmlCMGFHVWdiR0Y1YjNWMExpQXdYRzRnSUNBZ0lDb2dhVzVrYVdOaGRHVnpJSFJvWlNCalpXNTBaWEl1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRUWlhROFRuVnRZbVZ5UG4wZ2RHaGxJR05sYkd4eklHOXVJSFJvWlNCc1pYWmxiQ0JwYmlCMGFHbHpJR3hoZVc5MWRDQnlaWEJ5WlhObGJuUmxaQ0JpZVZ4dUlDQWdJQ0FxSUhSb1pXbHlJRzUxYldKbGNpNWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNjMDl1VEdWMlpXd29iR1YyWld3cElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyVnNiSE1nUFNCdVpYY2dVMlYwS0NrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdObGJuUmxjaUE5SUhSb2FYTXVYMk5sYm5SbGNqdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb01DQTlQVDBnYkdWMlpXd3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmxiR3h6TG1Ga1pDaDBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9ZMlZ1ZEdWeUtTazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdLR3hsZENCeWIzY2dQU0JqWlc1MFpYSXVjbTkzSUMwZ2JHVjJaV3c3SUhKdmR5QThQU0JqWlc1MFpYSXVjbTkzSUNzZ2JHVjJaV3c3SUhKdmR5c3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJWc2JITXVZV1JrS0hSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loN2NtOTNMQ0JqYjJ3NklHTmxiblJsY2k1amIyd2dMU0JzWlhabGJIMHBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWld4c2N5NWhaR1FvZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0h0eWIzY3NJR052YkRvZ1kyVnVkR1Z5TG1OdmJDQXJJR3hsZG1Wc2ZTa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdLR3hsZENCamIyd2dQU0JqWlc1MFpYSXVZMjlzSUMwZ2JHVjJaV3dnS3lBeE95QmpiMndnUENCalpXNTBaWEl1WTI5c0lDc2diR1YyWld3N0lHTnZiQ3NyS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyVnNiSE11WVdSa0tIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdjbTkzT2lCalpXNTBaWEl1Y205M0lDMGdiR1YyWld3c0lHTnZiSDBwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCalpXeHNjeTVoWkdRb2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIdHliM2M2SUdObGJuUmxjaTV5YjNjZ0t5QnNaWFpsYkN3Z1kyOXNmU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdObGJHeHpPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRVJ2WlhNZ1kyVnNiQ0JqYjI1MFlXbHVJR0VnWTJWc2JDQm1jbTl0SUdGc2NtVmhaSGxNWVhsdmRYUkVhV05sUDF4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR05sYkd3Z0xTQkJJR05sYkd3Z2FXNGdiR0Y1YjNWMElISmxjSEpsYzJWdWRHVmtJR0o1SUdFZ2JuVnRZbVZ5TGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3UkdsbFcxMTlJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxJQzBnUVNCc2FYTjBJRzltSUdScFkyVWdkR2hoZENCb1lYWmxJR0ZzY21WaFpIa2dZbVZsYmlCc1lYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElHbG1JR05sYkd3Z1pHOWxjeUJ1YjNRZ1kyOXVkR0ZwYmlCaElHUnBaUzVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lGOWpaV3hzU1hORmJYQjBlU2hqWld4c0xDQmhiSEpsWVdSNVRHRjViM1YwUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtJRDA5UFNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlM1bWFXNWtLR1JwWlNBOVBpQmpaV3hzSUQwOVBTQjBhR2x6TGw5amIyOXlaR2x1WVhSbGMxUnZUblZ0WW1WeUtHUnBaUzVqYjI5eVpHbHVZWFJsY3lrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQnVkVzFpWlhJZ2RHOGdZU0JqWld4c0lDaHliM2NzSUdOdmJDbGNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdUlDMGdWR2hsSUc1MWJXSmxjaUJ5WlhCeVpYTmxiblJwYm1jZ1lTQmpaV3hzWEc0Z0lDQWdJQ29nUUhKbGRIVnlibk1nZTA5aWFtVmpkSDBnVW1WMGRYSnVJSFJvWlNCalpXeHNJQ2g3Y205M0xDQmpiMng5S1NCamIzSnlaWE53YjI1a2FXNW5JRzR1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZiblZ0WW1WeVZHOURaV3hzS0c0cElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIdHliM2M2SUUxaGRHZ3VkSEoxYm1Nb2JpQXZJSFJvYVhNdVgyTnZiSE1wTENCamIydzZJRzRnSlNCMGFHbHpMbDlqYjJ4emZUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdZMlZzYkNCMGJ5QmhJRzUxYldKbGNseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdObGJHd2dMU0JVYUdVZ1kyVnNiQ0IwYnlCamIyNTJaWEowSUhSdklHbDBjeUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUblZ0WW1WeWZIVnVaR1ZtYVc1bFpIMGdWR2hsSUc1MWJXSmxjaUJqYjNKeVpYTndiMjVrYVc1bklIUnZJSFJvWlNCalpXeHNMbHh1SUNBZ0lDQXFJRkpsZEhWeWJuTWdkVzVrWldacGJtVmtJSGRvWlc0Z2RHaGxJR05sYkd3Z2FYTWdibTkwSUc5dUlIUm9aU0JzWVhsdmRYUmNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNWRzlPZFcxaVpYSW9lM0p2ZHl3Z1kyOXNmU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0E4UFNCeWIzY2dKaVlnY205M0lEd2dkR2hwY3k1ZmNtOTNjeUFtSmlBd0lEdzlJR052YkNBbUppQmpiMndnUENCMGFHbHpMbDlqYjJ4ektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY205M0lDb2dkR2hwY3k1ZlkyOXNjeUFySUdOdmJEdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdZU0JqWld4c0lISmxjSEpsYzJWdWRHVmtJR0o1SUdsMGN5QnVkVzFpWlhJZ2RHOGdkR2hsYVhJZ1kyOXZjbVJwYm1GMFpYTXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JpQXRJRlJvWlNCdWRXMWlaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdZMlZzYkZ4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdZMjl5Y21WemNHOXVaR2x1WnlCMGJ5QjBhR1VnWTJWc2JDQnlaWEJ5WlhObGJuUmxaQ0JpZVZ4dUlDQWdJQ0FxSUhSb2FYTWdiblZ0WW1WeUxseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDI1MWJXSmxjbFJ2UTI5dmNtUnBibUYwWlhNb2Jpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlkyVnNiRlJ2UTI5dmNtUnpLSFJvYVhNdVgyNTFiV0psY2xSdlEyVnNiQ2h1S1NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENCaElIQmhhWElnYjJZZ1kyOXZjbVJwYm1GMFpYTWdkRzhnWVNCdWRXMWlaWEl1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMDlpYW1WamRIMGdZMjl2Y21SeklDMGdWR2hsSUdOdmIzSmthVzVoZEdWeklIUnZJR052Ym5abGNuUmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwNTFiV0psY254MWJtUmxabWx1WldSOUlGUm9aU0JqYjI5eVpHbHVZWFJsY3lCamIyNTJaWEowWldRZ2RHOGdZU0J1ZFcxaVpYSXVJRWxtWEc0Z0lDQWdJQ29nZEdobElHTnZiM0prYVc1aGRHVnpJR0Z5WlNCdWIzUWdiMjRnZEdocGN5QnNZWGx2ZFhRc0lIUm9aU0J1ZFcxaVpYSWdhWE1nZFc1a1pXWnBibVZrTGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YjNKa2FXNWhkR1Z6Vkc5T2RXMWlaWElvWTI5dmNtUnpLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzRnUFNCMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2RHaHBjeTVmWTI5dmNtUnpWRzlEWld4c0tHTnZiM0prY3lrcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvTUNBOFBTQnVJQ1ltSUc0Z1BDQjBhR2x6TG0xaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1TzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1UyNWhjQ0FvZUN4NUtTQjBieUIwYUdVZ1kyeHZjMlZ6ZENCalpXeHNJR2x1SUhSb2FYTWdUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUdScFpXTnZiM0prYVc1aGRHVWdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpTQjBieUJtYVc1a0lIUm9aU0JqYkc5elpYTjBJR05sYkd4Y2JpQWdJQ0FnS2lCbWIzSXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdEVhV1Y5SUZ0a2FXVmpiMjl5WkdsdVlYUXVaR2xsSUQwZ2JuVnNiRjBnTFNCVWFHVWdaR2xsSUhSdklITnVZWEFnZEc4dVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdScFpXTnZiM0prYVc1aGRHVXVlQ0F0SUZSb1pTQjRMV052YjNKa2FXNWhkR1V1WEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRPZFcxaVpYSjlJR1JwWldOdmIzSmthVzVoZEdVdWVTQXRJRlJvWlNCNUxXTnZiM0prYVc1aGRHVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdFBZbXBsWTNSOGJuVnNiSDBnVkdobElHTnZiM0prYVc1aGRHVWdiMllnZEdobElHTmxiR3dnWTJ4dmMyVnpkQ0IwYnlBb2VDd2dlU2t1WEc0Z0lDQWdJQ29nVG5Wc2JDQjNhR1Z1SUc1dklITjFhWFJoWW14bElHTmxiR3dnYVhNZ2JtVmhjaUFvZUN3Z2VTbGNiaUFnSUNBZ0tpOWNiaUFnSUNCemJtRndWRzhvZTJScFpTQTlJRzUxYkd3c0lIZ3NJSGw5S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOdmNtNWxja05sYkd3Z1BTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeWIzYzZJRTFoZEdndWRISjFibU1vZVNBdklIUm9hWE11WkdsbFUybDZaU2tzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUUxaGRHZ3VkSEoxYm1Nb2VDQXZJSFJvYVhNdVpHbGxVMmw2WlNsY2JpQWdJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpiM0p1WlhJZ1BTQjBhR2x6TGw5alpXeHNWRzlEYjI5eVpITW9ZMjl5Ym1WeVEyVnNiQ2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSGRwWkhSb1NXNGdQU0JqYjNKdVpYSXVlQ0FySUhSb2FYTXVaR2xsVTJsNlpTQXRJSGc3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSGRwWkhSb1QzVjBJRDBnZEdocGN5NWthV1ZUYVhwbElDMGdkMmxrZEdoSmJqdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FHVnBaMmgwU1c0Z1BTQmpiM0p1WlhJdWVTQXJJSFJvYVhNdVpHbGxVMmw2WlNBdElIazdYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGxhV2RvZEU5MWRDQTlJSFJvYVhNdVpHbGxVMmw2WlNBdElHaGxhV2RvZEVsdU8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIRjFZV1J5WVc1MGN5QTlJRnQ3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnhPaUIwYUdsekxsOWpaV3hzVkc5T2RXMWlaWElvWTI5eWJtVnlRMlZzYkNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaEpiaUFxSUdobGFXZG9kRWx1WEc0Z0lDQWdJQ0FnSUgwc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhFNklIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkzT2lCamIzSnVaWEpEWld4c0xuSnZkeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjJ3NklHTnZjbTVsY2tObGJHd3VZMjlzSUNzZ01WeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNabGNtRm5aVG9nZDJsa2RHaFBkWFFnS2lCb1pXbG5hSFJKYmx4dUlDQWdJQ0FnSUNCOUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeE9pQjBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1kyOXlibVZ5UTJWc2JDNXliM2NnS3lBeExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiRG9nWTI5eWJtVnlRMlZzYkM1amIyeGNiaUFnSUNBZ0lDQWdJQ0FnSUgwcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5MlpYSmhaMlU2SUhkcFpIUm9TVzRnS2lCb1pXbG5hSFJQZFhSY2JpQWdJQ0FnSUNBZ2ZTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NUb2dkR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNjNklHTnZjbTVsY2tObGJHd3VjbTkzSUNzZ01TeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUdOdmNtNWxja05sYkd3dVkyOXNJQ3NnTVZ4dUlDQWdJQ0FnSUNBZ0lDQWdmU2tzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiM1psY21GblpUb2dkMmxrZEdoUGRYUWdLaUJvWldsbmFIUlBkWFJjYmlBZ0lDQWdJQ0FnZlYwN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2MyNWhjRlJ2SUQwZ2NYVmhaSEpoYm5SelhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCalpXeHNJSE5vYjNWc1pDQmlaU0J2YmlCMGFHVWdiR0Y1YjNWMFhHNGdJQ0FnSUNBZ0lDQWdJQ0F1Wm1sc2RHVnlLQ2h4ZFdGa2NtRnVkQ2tnUFQ0Z2RXNWtaV1pwYm1Wa0lDRTlQU0J4ZFdGa2NtRnVkQzV4S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnWTJWc2JDQnphRzkxYkdRZ1ltVWdibTkwSUdGc2NtVmhaSGtnZEdGclpXNGdaWGhqWlhCMElHSjVJR2wwYzJWc1pseHVJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWdvY1hWaFpISmhiblFwSUQwK0lDaGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnVkV3hzSUNFOVBTQmthV1VnSmlZZ2RHaHBjeTVmWTI5dmNtUnBibUYwWlhOVWIwNTFiV0psY2loa2FXVXVZMjl2Y21ScGJtRjBaWE1wSUQwOVBTQnhkV0ZrY21GdWRDNXhLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSHg4SUhSb2FYTXVYMk5sYkd4SmMwVnRjSFI1S0hGMVlXUnlZVzUwTG5Fc0lGOWthV05sTG1kbGRDaDBhR2x6S1NrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCalpXeHNJSE5vYjNWc1pDQmlaU0JqYjNabGNtVmtJR0o1SUhSb1pTQmthV1VnZEdobElHMXZjM1JjYmlBZ0lDQWdJQ0FnSUNBZ0lDNXlaV1IxWTJVb1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0tHMWhlRkVzSUhGMVlXUnlZVzUwS1NBOVBpQnhkV0ZrY21GdWRDNWpiM1psY21GblpTQStJRzFoZUZFdVkyOTJaWEpoWjJVZ1B5QnhkV0ZrY21GdWRDQTZJRzFoZUZFc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2UzRTZJSFZ1WkdWbWFXNWxaQ3dnWTI5MlpYSmhaMlU2SUMweGZWeHVJQ0FnSUNBZ0lDQWdJQ0FnS1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa0lDRTlQU0J6Ym1Gd1ZHOHVjU0EvSUhSb2FYTXVYMjUxYldKbGNsUnZRMjl2Y21ScGJtRjBaWE1vYzI1aGNGUnZMbkVwSURvZ2JuVnNiRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJIWlhRZ2RHaGxJR1JwWlNCaGRDQndiMmx1ZENBb2VDd2dlU2s3WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY0dGeVlXMGdlMUJ2YVc1MGZTQndiMmx1ZENBdElGUm9aU0J3YjJsdWRDQnBiaUFvZUN3Z2VTa2dZMjl2Y21ScGJtRjBaWE5jYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRFYVdWOGJuVnNiSDBnVkdobElHUnBaU0IxYm1SbGNpQmpiMjl5WkdsdVlYUmxjeUFvZUN3Z2VTa2diM0lnYm5Wc2JDQnBaaUJ1YnlCa2FXVmNiaUFnSUNBZ0tpQnBjeUJoZENCMGFHVWdjRzlwYm5RdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMFFYUW9jRzlwYm5RZ1BTQjdlRG9nTUN3Z2VUb2dNSDBwSUh0Y2JpQWdJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQmthV1VnYjJZZ1gyUnBZMlV1WjJWMEtIUm9hWE1wS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjdlQ3dnZVgwZ1BTQmthV1V1WTI5dmNtUnBibUYwWlhNN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSGhHYVhRZ1BTQjRJRHc5SUhCdmFXNTBMbmdnSmlZZ2NHOXBiblF1ZUNBOFBTQjRJQ3NnZEdocGN5NWthV1ZUYVhwbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlVVpwZENBOUlIa2dQRDBnY0c5cGJuUXVlU0FtSmlCd2IybHVkQzU1SUR3OUlIa2dLeUIwYUdsekxtUnBaVk5wZW1VN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDRSbWwwSUNZbUlIbEdhWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnWkdsbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3c3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTJGc1kzVnNZWFJsSUhSb1pTQm5jbWxrSUhOcGVtVWdaMmwyWlc0Z2QybGtkR2dnWVc1a0lHaGxhV2RvZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0IzYVdSMGFDQXRJRlJvWlNCdGFXNXBiV0ZzSUhkcFpIUm9YRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHaGxhV2RvZENBdElGUm9aU0J0YVc1cGJXRnNJR2hsYVdkb2RGeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTJGc1kzVnNZWFJsUjNKcFpDaDNhV1IwYUN3Z2FHVnBaMmgwS1NCN1hHNGdJQ0FnSUNBZ0lGOWpiMnh6TG5ObGRDaDBhR2x6TENCTllYUm9MbVpzYjI5eUtIZHBaSFJvSUM4Z2RHaHBjeTVrYVdWVGFYcGxLU2s3WEc0Z0lDQWdJQ0FnSUY5eWIzZHpMbk5sZENoMGFHbHpMQ0JOWVhSb0xtWnNiMjl5S0dobGFXZG9kQ0F2SUhSb2FYTXVaR2xsVTJsNlpTa3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU52Ym5abGNuUWdZU0FvY205M0xDQmpiMndwSUdObGJHd2dkRzhnS0hnc0lIa3BJR052YjNKa2FXNWhkR1Z6TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRQWW1wbFkzUjlJR05sYkd3Z0xTQlVhR1VnWTJWc2JDQjBieUJqYjI1MlpYSjBJSFJ2SUdOdmIzSmthVzVoZEdWelhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1QySnFaV04wZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCamIyOXlaR2x1WVhSbGN5NWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5alpXeHNWRzlEYjI5eVpITW9lM0p2ZHl3Z1kyOXNmU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZTNnNklHTnZiQ0FxSUhSb2FYTXVaR2xsVTJsNlpTd2dlVG9nY205M0lDb2dkR2hwY3k1a2FXVlRhWHBsZlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUNoNExDQjVLU0JqYjI5eVpHbHVZWFJsY3lCMGJ5QmhJQ2h5YjNjc0lHTnZiQ2tnWTJWc2JDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1QySnFaV04wZlNCamIyOXlaR2x1WVhSbGN5QXRJRlJvWlNCamIyOXlaR2x1WVhSbGN5QjBieUJqYjI1MlpYSjBJSFJ2SUdFZ1kyVnNiQzVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRQWW1wbFkzUjlJRlJvWlNCamIzSnlaWE53YjI1a2FXNW5JR05sYkd4Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqYjI5eVpITlViME5sYkd3b2UzZ3NJSGw5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5YjNjNklFMWhkR2d1ZEhKMWJtTW9lU0F2SUhSb2FYTXVaR2xsVTJsNlpTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCamIydzZJRTFoZEdndWRISjFibU1vZUNBdklIUm9hWE11WkdsbFUybDZaU2xjYmlBZ0lDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVsZUhCdmNuUWdlMGR5YVdSTVlYbHZkWFI5TzF4dUlpd2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5b3FYRzRnS2lCQWJXOWtkV3hsSUcxcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMXh1SUNvdlhHNWNiaThxWEc0Z0tpQkRiMjUyWlhKMElHRnVJRWhVVFV3Z1lYUjBjbWxpZFhSbElIUnZJR0Z1SUdsdWMzUmhibU5sSjNNZ2NISnZjR1Z5ZEhrdUlGeHVJQ3BjYmlBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdVlXMWxJQzBnVkdobElHRjBkSEpwWW5WMFpTZHpJRzVoYldWY2JpQXFJRUJ5WlhSMWNtNGdlMU4wY21sdVozMGdWR2hsSUdOdmNuSmxjM0J2Ym1ScGJtY2djSEp2Y0dWeWRIa25jeUJ1WVcxbExpQkdiM0lnWlhoaGJYQnNaU3dnWENKdGVTMWhkSFJ5WENKY2JpQXFJSGRwYkd3Z1ltVWdZMjl1ZG1WeWRHVmtJSFJ2SUZ3aWJYbEJkSFJ5WENJc0lHRnVaQ0JjSW1ScGMyRmliR1ZrWENJZ2RHOGdYQ0prYVhOaFlteGxaRndpTGx4dUlDb3ZYRzVqYjI1emRDQmhkSFJ5YVdKMWRHVXljSEp2Y0dWeWRIa2dQU0FvYm1GdFpTa2dQVDRnZTF4dUlDQWdJR052Ym5OMElGdG1hWEp6ZEN3Z0xpNHVjbVZ6ZEYwZ1BTQnVZVzFsTG5Od2JHbDBLRndpTFZ3aUtUdGNiaUFnSUNCeVpYUjFjbTRnWm1seWMzUWdLeUJ5WlhOMExtMWhjQ2gzYjNKa0lEMCtJSGR2Y21RdWMyeHBZMlVvTUN3Z01Ta3VkRzlWY0hCbGNrTmhjMlVvS1NBcklIZHZjbVF1YzJ4cFkyVW9NU2twTG1wdmFXNG9LVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dUV2w0YVc0Z2UwQnNhVzVySUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmU0IwYnlCaElHTnNZWE56TGx4dUlDcGNiaUFxSUVCd1lYSmhiU0I3S24wZ1UzVndJQzBnVkdobElHTnNZWE56SUhSdklHMXBlQ0JwYm5SdkxseHVJQ29nUUhKbGRIVnliaUI3Ylc5a2RXeGxPbTFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzNVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTjlJRlJvWlNCdGFYaGxaQzFwYmlCamJHRnpjMXh1SUNvdlhHNWpiMjV6ZENCU1pXRmtUMjVzZVVGMGRISnBZblYwWlhNZ1BTQW9VM1Z3S1NBOVBseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFMXBlR2x1SUhSdklHMWhhMlVnWVd4c0lHRjBkSEpwWW5WMFpYTWdiMjRnWVNCamRYTjBiMjBnU0ZSTlRFVnNaVzFsYm5RZ2NtVmhaQzF2Ym14NUlHbHVJSFJvWlNCelpXNXpaVnh1SUNBZ0lDQXFJSFJvWVhRZ2QyaGxiaUIwYUdVZ1lYUjBjbWxpZFhSbElHZGxkSE1nWVNCdVpYY2dkbUZzZFdVZ2RHaGhkQ0JrYVdabVpYSnpJR1p5YjIwZ2RHaGxJSFpoYkhWbElHOW1JSFJvWlZ4dUlDQWdJQ0FxSUdOdmNuSmxjM0J2Ym1ScGJtY2djSEp2Y0dWeWRIa3NJR2wwSUdseklISmxjMlYwSUhSdklIUm9ZWFFnY0hKdmNHVnlkSGtuY3lCMllXeDFaUzRnVkdobFhHNGdJQ0FnSUNvZ1lYTnpkVzF3ZEdsdmJpQnBjeUIwYUdGMElHRjBkSEpwWW5WMFpTQmNJbTE1TFdGMGRISnBZblYwWlZ3aUlHTnZjbkpsYzNCdmJtUnpJSGRwZEdnZ2NISnZjR1Z5ZEhrZ1hDSjBhR2x6TG0xNVFYUjBjbWxpZFhSbFhDSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwTnNZWE56ZlNCVGRYQWdMU0JVYUdVZ1kyeGhjM01nZEc4Z2JXbDRhVzRnZEdocGN5QlNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmU0JVYUdVZ2JXbDRaV1FnYVc0Z1kyeGhjM011WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBYldsNGFXNWNiaUFnSUNBZ0tpQkFZV3hwWVhNZ2JXOWtkV3hsT20xcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzVTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYmlBZ0lDQWdLaTljYmlBZ0lDQmpiR0Z6Y3lCbGVIUmxibVJ6SUZOMWNDQjdYRzVjYmlBZ0lDQWdJQ0FnTHlvcVhHNGdJQ0FnSUNBZ0lDQXFJRU5oYkd4aVlXTnJJSFJvWVhRZ2FYTWdaWGhsWTNWMFpXUWdkMmhsYmlCaGJpQnZZbk5sY25abFpDQmhkSFJ5YVdKMWRHVW5jeUIyWVd4MVpTQnBjMXh1SUNBZ0lDQWdJQ0FnS2lCamFHRnVaMlZrTGlCSlppQjBhR1VnU0ZSTlRFVnNaVzFsYm5RZ2FYTWdZMjl1Ym1WamRHVmtJSFJ2SUhSb1pTQkVUMDBzSUhSb1pTQmhkSFJ5YVdKMWRHVmNiaUFnSUNBZ0lDQWdJQ29nZG1Gc2RXVWdZMkZ1SUc5dWJIa2dZbVVnYzJWMElIUnZJSFJvWlNCamIzSnlaWE53YjI1a2FXNW5JRWhVVFV4RmJHVnRaVzUwSjNNZ2NISnZjR1Z5ZEhrdVhHNGdJQ0FnSUNBZ0lDQXFJRWx1SUdWbVptVmpkQ3dnZEdocGN5QnRZV3RsY3lCMGFHbHpJRWhVVFV4RmJHVnRaVzUwSjNNZ1lYUjBjbWxpZFhSbGN5QnlaV0ZrTFc5dWJIa3VYRzRnSUNBZ0lDQWdJQ0FxWEc0Z0lDQWdJQ0FnSUNBcUlFWnZjaUJsZUdGdGNHeGxMQ0JwWmlCaGJpQklWRTFNUld4bGJXVnVkQ0JvWVhNZ1lXNGdZWFIwY21saWRYUmxJRndpZUZ3aUlHRnVaRnh1SUNBZ0lDQWdJQ0FnS2lCamIzSnlaWE53YjI1a2FXNW5JSEJ5YjNCbGNuUjVJRndpZUZ3aUxDQjBhR1Z1SUdOb1lXNW5hVzVuSUhSb1pTQjJZV3gxWlNCY0luaGNJaUIwYnlCY0lqVmNJbHh1SUNBZ0lDQWdJQ0FnS2lCM2FXeHNJRzl1YkhrZ2QyOXlheUIzYUdWdUlHQjBhR2x6TG5nZ1BUMDlJRFZnTGx4dUlDQWdJQ0FnSUNBZ0tseHVJQ0FnSUNBZ0lDQWdLaUJBY0dGeVlXMGdlMU4wY21sdVozMGdibUZ0WlNBdElGUm9aU0JoZEhSeWFXSjFkR1VuY3lCdVlXMWxMbHh1SUNBZ0lDQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnYjJ4a1ZtRnNkV1VnTFNCVWFHVWdZWFIwY21saWRYUmxKM01nYjJ4a0lIWmhiSFZsTGx4dUlDQWdJQ0FnSUNBZ0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JtVjNWbUZzZFdVZ0xTQlVhR1VnWVhSMGNtbGlkWFJsSjNNZ2JtVjNJSFpoYkhWbExseHVJQ0FnSUNBZ0lDQWdLaTljYmlBZ0lDQWdJQ0FnWVhSMGNtbGlkWFJsUTJoaGJtZGxaRU5oYkd4aVlXTnJLRzVoYldVc0lHOXNaRlpoYkhWbExDQnVaWGRXWVd4MVpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdRV3hzSUdGMGRISnBZblYwWlhNZ1lYSmxJRzFoWkdVZ2NtVmhaQzF2Ym14NUlIUnZJSEJ5WlhabGJuUWdZMmhsWVhScGJtY2dZbmtnWTJoaGJtZHBibWRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJSFJvWlNCaGRIUnlhV0oxZEdVZ2RtRnNkV1Z6TGlCUFppQmpiM1Z5YzJVc0lIUm9hWE1nYVhNZ1lua2dibTljYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJR2QxWVhKaGJuUmxaU0IwYUdGMElIVnpaWEp6SUhkcGJHd2dibTkwSUdOb1pXRjBJR2x1SUdFZ1pHbG1abVZ5Wlc1MElIZGhlUzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhCeWIzQmxjblI1SUQwZ1lYUjBjbWxpZFhSbE1uQnliM0JsY25SNUtHNWhiV1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hSb2FYTXVZMjl1Ym1WamRHVmtJQ1ltSUc1bGQxWmhiSFZsSUNFOVBTQmdKSHQwYUdselczQnliM0JsY25SNVhYMWdLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvYm1GdFpTd2dkR2hwYzF0d2NtOXdaWEowZVYwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnSUNCU1pXRmtUMjVzZVVGMGRISnBZblYwWlhOY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVMeW9xWEc0Z0tpQkFiVzlrZFd4bFhHNGdLaTljYm1sdGNHOXlkQ0I3UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1YW5OY0lqdGNibWx0Y0c5eWRDQjdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmU0JtY205dElGd2lMaTl0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTXVhbk5jSWp0Y2JseHVMeThnVkdobElHNWhiV1Z6SUc5bUlIUm9aU0FvYjJKelpYSjJaV1FwSUdGMGRISnBZblYwWlhNZ2IyWWdkR2hsSUZSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MExseHVZMjl1YzNRZ1EwOU1UMUpmUVZSVVVrbENWVlJGSUQwZ1hDSmpiMnh2Y2x3aU8xeHVZMjl1YzNRZ1RrRk5SVjlCVkZSU1NVSlZWRVVnUFNCY0ltNWhiV1ZjSWp0Y2JtTnZibk4wSUZORFQxSkZYMEZVVkZKSlFsVlVSU0E5SUZ3aWMyTnZjbVZjSWp0Y2JtTnZibk4wSUVoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlNBOUlGd2lhR0Z6TFhSMWNtNWNJanRjYmx4dUx5OGdWR2hsSUhCeWFYWmhkR1VnY0hKdmNHVnlkR2xsY3lCdlppQjBhR1VnVkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5RZ1hHNWpiMjV6ZENCZlkyOXNiM0lnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMjVoYldVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDNOamIzSmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOW9ZWE5VZFhKdUlEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JseHVMeW9xWEc0Z0tpQkJJRkJzWVhsbGNpQnBiaUJoSUdScFkyVWdaMkZ0WlM1Y2JpQXFYRzRnS2lCQklIQnNZWGxsY2lkeklHNWhiV1VnYzJodmRXeGtJR0psSUhWdWFYRjFaU0JwYmlCMGFHVWdaMkZ0WlM0Z1ZIZHZJR1JwWm1abGNtVnVkRnh1SUNvZ1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUWdaV3hsYldWdWRITWdkMmwwYUNCMGFHVWdjMkZ0WlNCdVlXMWxJR0YwZEhKcFluVjBaU0JoY21VZ2RISmxZWFJsWkNCaGMxeHVJQ29nZEdobElITmhiV1VnY0d4aGVXVnlMbHh1SUNwY2JpQXFJRWx1SUdkbGJtVnlZV3dnYVhRZ2FYTWdjbVZqYjIxdFpXNWtaV1FnZEdoaGRDQnVieUIwZDI4Z2NHeGhlV1Z5Y3lCa2J5Qm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMRnh1SUNvZ1lXeDBhRzkxWjJnZ2FYUWdhWE1nYm05MElIVnVZMjl1WTJWcGRtRmliR1VnZEdoaGRDQmpaWEowWVdsdUlHUnBZMlVnWjJGdFpYTWdhR0YyWlNCd2JHRjVaWEp6SUhkdmNtdGNiaUFxSUdsdUlIUmxZVzF6SUhkb1pYSmxJR2wwSUhkdmRXeGtJRzFoYTJVZ2MyVnVjMlVnWm05eUlIUjNieUJ2Y2lCdGIzSmxJR1JwWm1abGNtVnVkQ0J3YkdGNVpYSnpJSFJ2WEc0Z0tpQm9ZWFpsSUhSb1pTQnpZVzFsSUdOdmJHOXlMbHh1SUNwY2JpQXFJRlJvWlNCdVlXMWxJR0Z1WkNCamIyeHZjaUJoZEhSeWFXSjFkR1Z6SUdGeVpTQnlaWEYxYVhKbFpDNGdWR2hsSUhOamIzSmxJR0Z1WkNCb1lYTXRkSFZ5Ymx4dUlDb2dZWFIwY21saWRYUmxjeUJoY21VZ2JtOTBMbHh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpQkFiV2w0WlhNZ2JXOWtkV3hsT20xcGVHbHVMMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzVTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYmlBcUwxeHVZMjl1YzNRZ1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUWdQU0JqYkdGemN5QmxlSFJsYm1SeklGSmxZV1JQYm14NVFYUjBjbWxpZFhSbGN5aElWRTFNUld4bGJXVnVkQ2tnZTF4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EzSmxZWFJsSUdFZ2JtVjNJRlJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwTENCdmNIUnBiMjVoYkd4NUlHSmhjMlZrSUc5dUlHRnVJR2x1ZEdsMGFXRnNYRzRnSUNBZ0lDb2dZMjl1Wm1sbmRYSmhkR2x2YmlCMmFXRWdZVzRnYjJKcVpXTjBJSEJoY21GdFpYUmxjaUJ2Y2lCa1pXTnNZWEpsWkNCaGRIUnlhV0oxZEdWeklHbHVJRWhVVFV3dVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA5aWFtVmpkSDBnVzJOdmJtWnBaMTBnTFNCQmJpQnBibWwwYVdGc0lHTnZibVpwWjNWeVlYUnBiMjRnWm05eUlIUm9aVnh1SUNBZ0lDQXFJSEJzWVhsbGNpQjBieUJqY21WaGRHVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHTnZibVpwWnk1amIyeHZjaUF0SUZSb2FYTWdjR3hoZVdWeUozTWdZMjlzYjNJZ2RYTmxaQ0JwYmlCMGFHVWdaMkZ0WlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTFOMGNtbHVaMzBnWTI5dVptbG5MbTVoYldVZ0xTQlVhR2x6SUhCc1lYbGxjaWR6SUc1aGJXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjVtYVdjdWMyTnZjbVZkSUMwZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ6WTI5eVpTNWNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwSnZiMnhsWVc1OUlGdGpiMjVtYVdjdWFHRnpWSFZ5YmwwZ0xTQlVhR2x6SUhCc1lYbGxjaUJvWVhNZ1lTQjBkWEp1TGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0h0amIyeHZjaXdnYm1GdFpTd2djMk52Y21Vc0lHaGhjMVIxY201OUtTQjdYRzRnSUNBZ0lDQWdJSE4xY0dWeUtDazdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tHTnZiRzl5SUNZbUlGd2lYQ0lnSVQwOUlHTnZiRzl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmWTI5c2IzSXVjMlYwS0hSb2FYTXNJR052Ykc5eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0VOUFRFOVNYMEZVVkZKSlFsVlVSU3dnZEdocGN5NWpiMnh2Y2lrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9kR2hwY3k1b1lYTkJkSFJ5YVdKMWRHVW9RMDlNVDFKZlFWUlVVa2xDVlZSRktTQW1KaUJjSWx3aUlDRTlQU0IwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZZMjlzYjNJdWMyVjBLSFJvYVhNc0lIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtFTlBURTlTWDBGVVZGSkpRbFZVUlNrcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loY0lrRWdVR3hoZVdWeUlHNWxaV1J6SUdFZ1kyOXNiM0lzSUhkb2FXTm9JR2x6SUdFZ1UzUnlhVzVuTGx3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHVZVzFsSUNZbUlGd2lYQ0lnSVQwOUlHNWhiV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl1WVcxbExuTmxkQ2gwYUdsekxDQnVZVzFsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRTVCVFVWZlFWUlVVa2xDVlZSRkxDQjBhR2x6TG01aGJXVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0hSb2FYTXVhR0Z6UVhSMGNtbGlkWFJsS0U1QlRVVmZRVlJVVWtsQ1ZWUkZLU0FtSmlCY0lsd2lJQ0U5UFNCMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoT1FVMUZYMEZVVkZKSlFsVlVSU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl1WVcxbExuTmxkQ2gwYUdsekxDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaE9RVTFGWDBGVVZGSkpRbFZVUlNrcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loY0lrRWdVR3hoZVdWeUlHNWxaV1J6SUdFZ2JtRnRaU3dnZDJocFkyZ2dhWE1nWVNCVGRISnBibWN1WENJcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tITmpiM0psS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmYzJOdmNtVXVjMlYwS0hSb2FYTXNJSE5qYjNKbEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0ZORFQxSkZYMEZVVkZKSlFsVlVSU3dnZEdocGN5NXpZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9kR2hwY3k1b1lYTkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRktTQW1KaUJPZFcxaVpYSXVhWE5PWVU0b2NHRnljMlZKYm5Rb2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGS1N3Z01UQXBLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYM05qYjNKbExuTmxkQ2gwYUdsekxDQndZWEp6WlVsdWRDaDBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaFRRMDlTUlY5QlZGUlNTVUpWVkVVcExDQXhNQ2twTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnVDJ0aGVTNGdRU0J3YkdGNVpYSWdaRzlsY3lCdWIzUWdibVZsWkNCMGJ5Qm9ZWFpsSUdFZ2MyTnZjbVV1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZjMk52Y21VdWMyVjBLSFJvYVhNc0lHNTFiR3dwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSeWRXVWdQVDA5SUdoaGMxUjFjbTRwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjlvWVhOVWRYSnVMbk5sZENoMGFHbHpMQ0JvWVhOVWRYSnVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtFaEJVMTlVVlZKT1gwRlVWRkpKUWxWVVJTd2dhR0Z6VkhWeWJpazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvZEdocGN5NW9ZWE5CZEhSeWFXSjFkR1VvU0VGVFgxUlZVazVmUVZSVVVrbENWVlJGS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJoaGMxUjFjbTR1YzJWMEtIUm9hWE1zSUhSeWRXVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMnRoZVN3Z1FTQndiR0Y1WlhJZ1pHOWxjeUJ1YjNRZ1lXeDNZWGx6SUdoaGRtVWdZU0IwZFhKdUxseHVJQ0FnSUNBZ0lDQWdJQ0FnWDJoaGMxUjFjbTR1YzJWMEtIUm9hWE1zSUc1MWJHd3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjM1JoZEdsaklHZGxkQ0J2WW5ObGNuWmxaRUYwZEhKcFluVjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYlhHNGdJQ0FnSUNBZ0lDQWdJQ0JEVDB4UFVsOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCT1FVMUZYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGTkRUMUpGWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSVnh1SUNBZ0lDQWdJQ0JkTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9hWE1nY0d4aGVXVnlKM01nWTI5c2IzSXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN1UzUnlhVzVuZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCamIyeHZjaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5amIyeHZjaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdocGN5QndiR0Y1WlhJbmN5QnVZVzFsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMU4wY21sdVozMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdibUZ0WlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOXVZVzFsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHbHpJSEJzWVhsbGNpZHpJSE5qYjNKbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYzJOdmNtVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lEMDlQU0JmYzJOdmNtVXVaMlYwS0hSb2FYTXBJRDhnTUNBNklGOXpZMjl5WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCelkyOXlaU2h1WlhkVFkyOXlaU2tnZTF4dUlDQWdJQ0FnSUNCZmMyTnZjbVV1YzJWMEtIUm9hWE1zSUc1bGQxTmpiM0psS1R0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDFOamIzSmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hUUTA5U1JWOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV6WlhSQmRIUnlhV0oxZEdVb1UwTlBVa1ZmUVZSVVVrbENWVlJGTENCdVpYZFRZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRkR0Z5ZENCaElIUjFjbTRnWm05eUlIUm9hWE1nY0d4aGVXVnlMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lITjBZWEowVkhWeWJpZ3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YVhORGIyNXVaV04wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjR0Z5Wlc1MFRtOWtaUzVrYVhOd1lYUmphRVYyWlc1MEtHNWxkeUJEZFhOMGIyMUZkbVZ1ZENoY0luUnZjRHB6ZEdGeWRDMTBkWEp1WENJc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmtaWFJoYVd3NklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0d4aGVXVnlPaUIwYUdselhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJRjlvWVhOVWRYSnVMbk5sZENoMGFHbHpMQ0IwY25WbEtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9TRUZUWDFSVlVrNWZRVlJVVWtsQ1ZWUkZMQ0IwY25WbEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkZibVFnWVNCMGRYSnVJR1p2Y2lCMGFHbHpJSEJzWVhsbGNpNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbGJtUlVkWEp1S0NrZ2UxeHVJQ0FnSUNBZ0lDQmZhR0Z6VkhWeWJpNXpaWFFvZEdocGN5d2diblZzYkNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WdGIzWmxRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUkc5bGN5QjBhR2x6SUhCc1lYbGxjaUJvWVhabElHRWdkSFZ5Ymo5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JvWVhOVWRYSnVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpTQTlQVDBnWDJoaGMxUjFjbTR1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVFZ1UzUnlhVzVuSUhKbGNISmxjMlZ1ZEdGMGFXOXVJRzltSUhSb2FYTWdjR3hoZVdWeUxDQm9hWE1nYjNJZ2FHVnljeUJ1WVcxbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdjR3hoZVdWeUozTWdibUZ0WlNCeVpYQnlaWE5sYm5SeklIUm9aU0J3YkdGNVpYSWdZWE1nWVNCemRISnBibWN1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkRzlUZEhKcGJtY29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJnSkh0MGFHbHpMbTVoYldWOVlEdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkpjeUIwYUdseklIQnNZWGxsY2lCbGNYVmhiQ0JoYm05MGFHVnlJSEJzWVhsbGNqOWNiaUFnSUNBZ0tpQmNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UyMXZaSFZzWlRwVWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRINVViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkSDBnYjNSb1pYSWdMU0JVYUdVZ2IzUm9aWElnY0d4aGVXVnlJSFJ2SUdOdmJYQmhjbVVnZEdocGN5QndiR0Y1WlhJZ2QybDBhQzVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRDYjI5c1pXRnVmU0JVY25WbElIZG9aVzRnWldsMGFHVnlJSFJvWlNCdlltcGxZM1FnY21WbVpYSmxibU5sY3lCaGNtVWdkR2hsSUhOaGJXVmNiaUFnSUNBZ0tpQnZjaUIzYUdWdUlHSnZkR2dnYm1GdFpTQmhibVFnWTI5c2IzSWdZWEpsSUhSb1pTQnpZVzFsTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR1Z4ZFdGc2N5aHZkR2hsY2lrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdVlXMWxJRDBnWENKemRISnBibWRjSWlBOVBUMGdkSGx3Wlc5bUlHOTBhR1Z5SUQ4Z2IzUm9aWElnT2lCdmRHaGxjaTV1WVcxbE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2IzUm9aWElnUFQwOUlIUm9hWE1nZkh3Z2JtRnRaU0E5UFQwZ2RHaHBjeTV1WVcxbE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm5kcGJtUnZkeTVqZFhOMGIyMUZiR1Z0Wlc1MGN5NWtaV1pwYm1Vb1hDSjBiM0F0Y0d4aGVXVnlYQ0lzSUZSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MEtUdGNibHh1THlvcVhHNGdLaUJVYUdVZ1pHVm1ZWFZzZENCemVYTjBaVzBnY0d4aGVXVnlMaUJFYVdObElHRnlaU0IwYUhKdmQyNGdZbmtnWVNCd2JHRjVaWEl1SUVadmNpQnphWFIxWVhScGIyNXpYRzRnS2lCM2FHVnlaU0I1YjNVZ2QyRnVkQ0IwYnlCeVpXNWtaWElnWVNCaWRXNWphQ0J2WmlCa2FXTmxJSGRwZEdodmRYUWdibVZsWkdsdVp5QjBhR1VnWTI5dVkyVndkQ0J2WmlCUWJHRjVaWEp6WEc0Z0tpQjBhR2x6SUVSRlJrRlZURlJmVTFsVFZFVk5YMUJNUVZsRlVpQmpZVzRnWW1VZ1lTQnpkV0p6ZEdsMGRYUmxMaUJQWmlCamIzVnljMlVzSUdsbUlIbHZkU2RrSUd4cGEyVWdkRzljYmlBcUlHTm9ZVzVuWlNCMGFHVWdibUZ0WlNCaGJtUXZiM0lnZEdobElHTnZiRzl5TENCamNtVmhkR1VnWVc1a0lIVnpaU0I1YjNWeUlHOTNiaUJjSW5ONWMzUmxiU0J3YkdGNVpYSmNJaTVjYmlBcUlFQmpiMjV6ZEZ4dUlDb3ZYRzVqYjI1emRDQkVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklnUFNCdVpYY2dWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblFvZTJOdmJHOXlPaUJjSW5KbFpGd2lMQ0J1WVcxbE9pQmNJaXBjSW4wcE8xeHVYRzVsZUhCdmNuUWdlMXh1SUNBZ0lGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBMRnh1SUNBZ0lFUkZSa0ZWVEZSZlUxbFRWRVZOWDFCTVFWbEZVbHh1ZlR0Y2JpSXNJaThxS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc0dkwybHRjRzl5ZENCN1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eWZTQm1jbTl0SUZ3aUxpOWxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdWFuTmNJanRjYm1sdGNHOXlkQ0I3UjNKcFpFeGhlVzkxZEgwZ1puSnZiU0JjSWk0dlIzSnBaRXhoZVc5MWRDNXFjMXdpTzF4dWFXMXdiM0owSUh0RVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSjlJR1p5YjIwZ1hDSXVMMVJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwTG1welhDSTdYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaVnh1SUNvdlhHNWNibU52Ym5OMElFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVZ1BTQXhNREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgwaFBURVJmUkZWU1FWUkpUMDRnUFNBek56VTdJQzh2SUcxelhHNWpiMjV6ZENCRVJVWkJWVXhVWDBSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUWdQU0JtWVd4elpUdGNibU52Ym5OMElFUkZSa0ZWVEZSZlNFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVFnUFNCbVlXeHpaVHRjYmx4dVkyOXVjM1FnVWs5WFV5QTlJREV3TzF4dVkyOXVjM1FnUTA5TVV5QTlJREV3TzF4dVhHNWpiMjV6ZENCRVJVWkJWVXhVWDFkSlJGUklJRDBnUTA5TVV5QXFJRVJGUmtGVlRGUmZSRWxGWDFOSldrVTdJQzh2SUhCNFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBoRlNVZElWQ0E5SUZKUFYxTWdLaUJFUlVaQlZVeFVYMFJKUlY5VFNWcEZPeUF2THlCd2VGeHVZMjl1YzNRZ1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0lEMGdUV0YwYUM1bWJHOXZjaWhTVDFkVElDOGdNaWs3WEc1Y2JtTnZibk4wSUUxSlRsOUVSVXhVUVNBOUlETTdJQzh2Y0hoY2JseHVZMjl1YzNRZ1YwbEVWRWhmUVZSVVVrbENWVlJGSUQwZ1hDSjNhV1IwYUZ3aU8xeHVZMjl1YzNRZ1NFVkpSMGhVWDBGVVZGSkpRbFZVUlNBOUlGd2lhR1ZwWjJoMFhDSTdYRzVqYjI1emRDQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSU0E5SUZ3aVpHbHpjR1Z5YzJsdmJsd2lPMXh1WTI5dWMzUWdSRWxGWDFOSldrVmZRVlJVVWtsQ1ZWUkZJRDBnWENKa2FXVXRjMmw2WlZ3aU8xeHVZMjl1YzNRZ1JGSkJSMGRKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVnUFNCY0ltUnlZV2RuYVc1bkxXUnBZMlV0WkdsellXSnNaV1JjSWp0Y2JtTnZibk4wSUVoUFRFUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVWdQU0JjSW1odmJHUnBibWN0WkdsalpTMWthWE5oWW14bFpGd2lPMXh1WTI5dWMzUWdVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkY5QlZGUlNTVUpWVkVVZ1BTQmNJbkp2ZEdGMGFXNW5MV1JwWTJVdFpHbHpZV0pzWldSY0lqdGNibU52Ym5OMElFaFBURVJmUkZWU1FWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSm9iMnhrTFdSMWNtRjBhVzl1WENJN1hHNWNibHh1WTI5dWMzUWdjR0Z5YzJWT2RXMWlaWElnUFNBb2JuVnRZbVZ5VTNSeWFXNW5MQ0JrWldaaGRXeDBUblZ0WW1WeUlEMGdNQ2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRzUxYldKbGNpQTlJSEJoY25ObFNXNTBLRzUxYldKbGNsTjBjbWx1Wnl3Z01UQXBPMXh1SUNBZ0lISmxkSFZ5YmlCT2RXMWlaWEl1YVhOT1lVNG9iblZ0WW1WeUtTQS9JR1JsWm1GMWJIUk9kVzFpWlhJZ09pQnVkVzFpWlhJN1hHNTlPMXh1WEc1amIyNXpkQ0IyWVd4cFpHRjBaVkJ2YzJsMGFYWmxUblZ0WW1WeUlEMGdLRzUxYldKbGNpd2diV0Y0VG5WdFltVnlJRDBnU1c1bWFXNXBkSGtwSUQwK0lIdGNiaUFnSUNCeVpYUjFjbTRnTUNBOFBTQnVkVzFpWlhJZ0ppWWdiblZ0WW1WeUlEd2diV0Y0VG5WdFltVnlPMXh1ZlR0Y2JseHVZMjl1YzNRZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJZ1BTQW9iblZ0WW1WeVUzUnlhVzVuTENCa1pXWmhkV3gwVm1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQjJZV3gxWlNBOUlIQmhjbk5sVG5WdFltVnlLRzUxYldKbGNsTjBjbWx1Wnl3Z1pHVm1ZWFZzZEZaaGJIVmxLVHRjYmlBZ0lDQnlaWFIxY200Z2RtRnNhV1JoZEdWUWIzTnBkR2wyWlU1MWJXSmxjaWgyWVd4MVpTa2dQeUIyWVd4MVpTQTZJR1JsWm1GMWJIUldZV3gxWlR0Y2JuMDdYRzVjYm1OdmJuTjBJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxJRDBnS0dWc1pXMWxiblFzSUc1aGJXVXNJR1JsWm1GMWJIUldZV3gxWlNrZ1BUNGdlMXh1SUNBZ0lHbG1JQ2hsYkdWdFpXNTBMbWhoYzBGMGRISnBZblYwWlNodVlXMWxLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IyWVd4MVpWTjBjbWx1WnlBOUlHVnNaVzFsYm5RdVoyVjBRWFIwY21saWRYUmxLRzVoYldVcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2RtRnNkV1ZUZEhKcGJtY3NJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQmtaV1poZFd4MFZtRnNkV1U3WEc1OU8xeHVYRzVqYjI1emRDQm5aWFJDYjI5c1pXRnVJRDBnS0dKdmIyeGxZVzVUZEhKcGJtY3NJSFJ5ZFdWV1lXeDFaU3dnWkdWbVlYVnNkRlpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdhV1lnS0hSeWRXVldZV3gxWlNBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlCOGZDQmNJblJ5ZFdWY0lpQTlQVDBnWW05dmJHVmhibE4wY21sdVp5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0Z3aVptRnNjMlZjSWlBOVBUMGdZbTl2YkdWaGJsTjBjbWx1WnlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHUmxabUYxYkhSV1lXeDFaVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWpiMjV6ZENCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbElEMGdLR1ZzWlcxbGJuUXNJRzVoYldVc0lHUmxabUYxYkhSV1lXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUdsbUlDaGxiR1Z0Wlc1MExtaGhjMEYwZEhKcFluVjBaU2h1WVcxbEtTa2dlMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQjJZV3gxWlZOMGNtbHVaeUE5SUdWc1pXMWxiblF1WjJWMFFYUjBjbWxpZFhSbEtHNWhiV1VwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWjJWMFFtOXZiR1ZoYmloMllXeDFaVk4wY21sdVp5d2dXM1poYkhWbFUzUnlhVzVuTENCY0luUnlkV1ZjSWwwc0lGdGNJbVpoYkhObFhDSmRMQ0JrWldaaGRXeDBWbUZzZFdVcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJrWldaaGRXeDBWbUZzZFdVN1hHNTlPMXh1WEc0dkx5QlFjbWwyWVhSbElIQnliM0JsY25ScFpYTmNibU52Ym5OMElGOWpZVzUyWVhNZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJ4aGVXOTFkQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZM1Z5Y21WdWRGQnNZWGxsY2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlVnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc1amIyNXpkQ0JqYjI1MFpYaDBJRDBnS0dKdllYSmtLU0E5UGlCZlkyRnVkbUZ6TG1kbGRDaGliMkZ5WkNrdVoyVjBRMjl1ZEdWNGRDaGNJakprWENJcE8xeHVYRzVqYjI1emRDQm5aWFJTWldGa2VVUnBZMlVnUFNBb1ltOWhjbVFwSUQwK0lIdGNiaUFnSUNCcFppQW9kVzVrWldacGJtVmtJRDA5UFNCZmJuVnRZbVZ5VDJaU1pXRmtlVVJwWTJVdVoyVjBLR0p2WVhKa0tTa2dlMXh1SUNBZ0lDQWdJQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1YzJWMEtHSnZZWEprTENBd0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sTG1kbGRDaGliMkZ5WkNrN1hHNTlPMXh1WEc1amIyNXpkQ0IxY0dSaGRHVlNaV0ZrZVVScFkyVWdQU0FvWW05aGNtUXNJSFZ3WkdGMFpTa2dQVDRnZTF4dUlDQWdJRjl1ZFcxaVpYSlBabEpsWVdSNVJHbGpaUzV6WlhRb1ltOWhjbVFzSUdkbGRGSmxZV1I1UkdsalpTaGliMkZ5WkNrZ0t5QjFjR1JoZEdVcE8xeHVmVHRjYmx4dVkyOXVjM1FnYVhOU1pXRmtlU0E5SUNoaWIyRnlaQ2tnUFQ0Z1oyVjBVbVZoWkhsRWFXTmxLR0p2WVhKa0tTQTlQVDBnWW05aGNtUXVaR2xqWlM1c1pXNW5kR2c3WEc1Y2JtTnZibk4wSUhWd1pHRjBaVUp2WVhKa0lEMGdLR0p2WVhKa0xDQmthV05sSUQwZ1ltOWhjbVF1WkdsalpTa2dQVDRnZTF4dUlDQWdJR2xtSUNocGMxSmxZV1I1S0dKdllYSmtLU2tnZTF4dUlDQWdJQ0FnSUNCamIyNTBaWGgwS0dKdllYSmtLUzVqYkdWaGNsSmxZM1FvTUN3Z01Dd2dZbTloY21RdWQybGtkR2dzSUdKdllYSmtMbWhsYVdkb2RDazdYRzVjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pHbGxMbkpsYm1SbGNpaGpiMjUwWlhoMEtHSnZZWEprS1N3Z1ltOWhjbVF1WkdsbFUybDZaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1OU8xeHVYRzVjYmk4dklFbHVkR1Z5WVdOMGFXOXVJSE4wWVhSbGMxeHVZMjl1YzNRZ1RrOU9SU0E5SUZONWJXSnZiQ2hjSW01dlgybHVkR1Z5WVdOMGFXOXVYQ0lwTzF4dVkyOXVjM1FnU0U5TVJDQTlJRk41YldKdmJDaGNJbWh2YkdSY0lpazdYRzVqYjI1emRDQk5UMVpGSUQwZ1UzbHRZbTlzS0Z3aWJXOTJaVndpS1R0Y2JtTnZibk4wSUVsT1JFVlVSVkpOU1U1RlJDQTlJRk41YldKdmJDaGNJbWx1WkdWMFpYSnRhVzVsWkZ3aUtUdGNibU52Ym5OMElFUlNRVWRIU1U1SElEMGdVM2x0WW05c0tGd2laSEpoWjJkcGJtZGNJaWs3WEc1Y2JpOHZJRTFsZEdodlpITWdkRzhnYUdGdVpHeGxJR2x1ZEdWeVlXTjBhVzl1WEc1amIyNXpkQ0JqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5QTlJQ2hqWVc1MllYTXNJSGhYYVc1a2IzY3NJSGxYYVc1a2IzY3BJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQmpZVzUyWVhOQ2IzZ2dQU0JqWVc1MllYTXVaMlYwUW05MWJtUnBibWREYkdsbGJuUlNaV04wS0NrN1hHNWNiaUFnSUNCamIyNXpkQ0I0SUQwZ2VGZHBibVJ2ZHlBdElHTmhiblpoYzBKdmVDNXNaV1owSUNvZ0tHTmhiblpoY3k1M2FXUjBhQ0F2SUdOaGJuWmhjMEp2ZUM1M2FXUjBhQ2s3WEc0Z0lDQWdZMjl1YzNRZ2VTQTlJSGxYYVc1a2IzY2dMU0JqWVc1MllYTkNiM2d1ZEc5d0lDb2dLR05oYm5aaGN5NW9aV2xuYUhRZ0x5QmpZVzUyWVhOQ2IzZ3VhR1ZwWjJoMEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCN2VDd2dlWDA3WEc1OU8xeHVYRzVqYjI1emRDQnpaWFIxY0VsdWRHVnlZV04wYVc5dUlEMGdLR0p2WVhKa0tTQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ1kyRnVkbUZ6SUQwZ1gyTmhiblpoY3k1blpYUW9ZbTloY21RcE8xeHVYRzRnSUNBZ0x5OGdVMlYwZFhBZ2FXNTBaWEpoWTNScGIyNWNiaUFnSUNCc1pYUWdiM0pwWjJsdUlEMGdlMzA3WEc0Z0lDQWdiR1YwSUhOMFlYUmxJRDBnVGs5T1JUdGNiaUFnSUNCc1pYUWdjM1JoZEdsalFtOWhjbVFnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJRzUxYkd3N1hHNGdJQ0FnYkdWMElHaHZiR1JVYVcxbGIzVjBJRDBnYm5Wc2JEdGNibHh1SUNBZ0lHTnZibk4wSUdodmJHUkVhV1VnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaElUMHhFSUQwOVBTQnpkR0YwWlNCOGZDQkpUa1JGVkVWU1RVbE9SVVFnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGIyZG5iR1VnYUc5c1pDQXZJSEpsYkdWaGMyVmNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSEJzWVhsbGNsZHBkR2hCVkhWeWJpQTlJR0p2WVhKa0xuRjFaWEo1VTJWc1pXTjBiM0lvWENKMGIzQXRjR3hoZVdWeUxXeHBjM1FnZEc5d0xYQnNZWGxsY2x0b1lYTXRkSFZ5YmwxY0lpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9aR2xsVlc1a1pYSkRkWEp6YjNJdWFYTklaV3hrS0NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1ZWYm1SbGNrTjFjbk52Y2k1eVpXeGxZWE5sU1hRb2NHeGhlV1Z5VjJsMGFFRlVkWEp1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWFHOXNaRWwwS0hCc1lYbGxjbGRwZEdoQlZIVnliaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdodmJHUlVhVzFsYjNWMElEMGdiblZzYkR0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdjM1JoY25SSWIyeGthVzVuSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCb2IyeGtWR2x0Wlc5MWRDQTlJSGRwYm1SdmR5NXpaWFJVYVcxbGIzVjBLR2h2YkdSRWFXVXNJR0p2WVhKa0xtaHZiR1JFZFhKaGRHbHZiaWs3WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElITjBiM0JJYjJ4a2FXNW5JRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0IzYVc1a2IzY3VZMnhsWVhKVWFXMWxiM1YwS0dodmJHUlVhVzFsYjNWMEtUdGNiaUFnSUNBZ0lDQWdhRzlzWkZScGJXVnZkWFFnUFNCdWRXeHNPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRWx1ZEdWeVlXTjBhVzl1SUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoT1QwNUZJRDA5UFNCemRHRjBaU2tnZTF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J2Y21sbmFXNGdQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZURvZ1pYWmxiblF1WTJ4cFpXNTBXQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I1T2lCbGRtVnVkQzVqYkdsbGJuUlpYRzRnSUNBZ0lDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaUE5SUdKdllYSmtMbXhoZVc5MWRDNW5aWFJCZENoamIyNTJaWEowVjJsdVpHOTNRMjl2Y21ScGJtRjBaWE5VYjBOaGJuWmhjeWhqWVc1MllYTXNJR1YyWlc1MExtTnNhV1Z1ZEZnc0lHVjJaVzUwTG1Oc2FXVnVkRmtwS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnSVQwOUlHUnBaVlZ1WkdWeVEzVnljMjl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdUMjVzZVNCcGJuUmxjbUZqZEdsdmJpQjNhWFJvSUhSb1pTQmliMkZ5WkNCMmFXRWdZU0JrYVdWY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1NHOXNaR2x1WjBScFkyVWdKaVlnSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdTVTVFUlZSRlVrMUpUa1ZFTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0Z5ZEVodmJHUnBibWNvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVodmJHUnBibWRFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUmxJRDBnU0U5TVJEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGNuUkliMnhrYVc1bktDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2doWW05aGNtUXVaR2x6WVdKc1pXUkVjbUZuWjJsdVowUnBZMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEdVZ1BTQk5UMVpGTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE5vYjNkSmJuUmxjbUZqZEdsdmJpQTlJQ2hsZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JrYVdWVmJtUmxja04xY25OdmNpQTlJR0p2WVhKa0xteGhlVzkxZEM1blpYUkJkQ2hqYjI1MlpYSjBWMmx1Wkc5M1EyOXZjbVJwYm1GMFpYTlViME5oYm5aaGN5aGpZVzUyWVhNc0lHVjJaVzUwTG1Oc2FXVnVkRmdzSUdWMlpXNTBMbU5zYVdWdWRGa3BLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tFUlNRVWRIU1U1SElEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG5OMGVXeGxMbU4xY25OdmNpQTlJRndpWjNKaFltSnBibWRjSWp0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laM0poWWx3aU8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk4wZVd4bExtTjFjbk52Y2lBOUlGd2laR1ZtWVhWc2RGd2lPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJR052Ym5OMElHMXZkbVVnUFNBb1pYWmxiblFwSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0UxUFZrVWdQVDA5SUhOMFlYUmxJSHg4SUVsT1JFVlVSVkpOU1U1RlJDQTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJR1JsZEdWeWJXbHVaU0JwWmlCaElHUnBaU0JwY3lCMWJtUmxjaUIwYUdVZ1kzVnljMjl5WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJKWjI1dmNtVWdjMjFoYkd3Z2JXOTJaVzFsYm5SelhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUUxaGRHZ3VZV0p6S0c5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2VTQTlJRTFoZEdndVlXSnpLRzl5YVdkcGJpNTVJQzBnWlhabGJuUXVZMnhwWlc1MFdTazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hOU1U1ZlJFVk1WRUVnUENCa2VDQjhmQ0JOU1U1ZlJFVk1WRUVnUENCa2VTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdSRkpCUjBkSlRrYzdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1J2Y0VodmJHUnBibWNvS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScFkyVlhhWFJvYjNWMFJHbGxWVzVrWlhKRGRYSnpiM0lnUFNCaWIyRnlaQzVrYVdObExtWnBiSFJsY2loa2FXVWdQVDRnWkdsbElDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvWW05aGNtUXNJR1JwWTJWWGFYUm9iM1YwUkdsbFZXNWtaWEpEZFhKemIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhScFkwSnZZWEprSUQwZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1WjJWMFNXMWhaMlZFWVhSaEtEQXNJREFzSUdOaGJuWmhjeTUzYVdSMGFDd2dZMkZ1ZG1GekxtaGxhV2RvZENrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb1JGSkJSMGRKVGtjZ1BUMDlJSE4wWVhSbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrZUNBOUlHOXlhV2RwYmk1NElDMGdaWFpsYm5RdVkyeHBaVzUwV0R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjVJRDBnYjNKcFoybHVMbmtnTFNCbGRtVnVkQzVqYkdsbGJuUlpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCN2VDd2dlWDBnUFNCa2FXVlZibVJsY2tOMWNuTnZjaTVqYjI5eVpHbHVZWFJsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQ2hpYjJGeVpDa3VjSFYwU1cxaFoyVkVZWFJoS0hOMFlYUnBZMEp2WVhKa0xDQXdMQ0F3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxuSmxibVJsY2loamIyNTBaWGgwS0dKdllYSmtLU3dnWW05aGNtUXVaR2xsVTJsNlpTd2dlM2c2SUhnZ0xTQmtlQ3dnZVRvZ2VTQXRJR1I1ZlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyOXVjM1FnYzNSdmNFbHVkR1Z5WVdOMGFXOXVJRDBnS0dWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lDRTlQU0JrYVdWVmJtUmxja04xY25OdmNpQW1KaUJFVWtGSFIwbE9SeUE5UFQwZ2MzUmhkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUjRJRDBnYjNKcFoybHVMbmdnTFNCbGRtVnVkQzVqYkdsbGJuUllPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhrZ1BTQnZjbWxuYVc0dWVTQXRJR1YyWlc1MExtTnNhV1Z1ZEZrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSHQ0TENCNWZTQTlJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtTnZiM0prYVc1aGRHVnpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCemJtRndWRzlEYjI5eVpITWdQU0JpYjJGeVpDNXNZWGx2ZFhRdWMyNWhjRlJ2S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2FXVTZJR1JwWlZWdVpHVnlRM1Z5YzI5eUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIZzZJSGdnTFNCa2VDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjVPaUI1SUMwZ1pIa3NYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYm1WM1EyOXZjbVJ6SUQwZ2JuVnNiQ0FoUFNCemJtRndWRzlEYjI5eVpITWdQeUJ6Ym1Gd1ZHOURiMjl5WkhNZ09pQjdlQ3dnZVgwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdScFpWVnVaR1Z5UTNWeWMyOXlMbU52YjNKa2FXNWhkR1Z6SUQwZ2JtVjNRMjl2Y21Sek8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1EyeGxZWElnYzNSaGRHVmNiaUFnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNCemRHRjBaU0E5SUU1UFRrVTdYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1VtVm1jbVZ6YUNCaWIyRnlaRHNnVW1WdVpHVnlJR1JwWTJWY2JpQWdJQ0FnSUNBZ2RYQmtZWFJsUW05aGNtUW9ZbTloY21RcE8xeHVJQ0FnSUgwN1hHNWNibHh1SUNBZ0lDOHZJRkpsWjJsemRHVnlJSFJvWlNCaFkzUjFZV3dnWlhabGJuUWdiR2x6ZEdWdVpYSnpJR1JsWm1sdVpXUWdZV0p2ZG1VdUlFMWhjQ0IwYjNWamFDQmxkbVZ1ZEhNZ2RHOWNiaUFnSUNBdkx5QmxjWFZwZG1Gc1pXNTBJRzF2ZFhObElHVjJaVzUwY3k0Z1FtVmpZWFZ6WlNCMGFHVWdYQ0owYjNWamFHVnVaRndpSUdWMlpXNTBJR1J2WlhNZ2JtOTBJR2hoZG1VZ1lWeHVJQ0FnSUM4dklHTnNhV1Z1ZEZnZ1lXNWtJR05zYVdWdWRGa3NJSEpsWTI5eVpDQmhibVFnZFhObElIUm9aU0JzWVhOMElHOXVaWE1nWm5KdmJTQjBhR1VnWENKMGIzVmphRzF2ZG1WY0lseHVJQ0FnSUM4dklDaHZjaUJjSW5SdmRXTm9jM1JoY25SY0lpa2daWFpsYm5SekxseHVYRzRnSUNBZ2JHVjBJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXRG9nTUN3Z1kyeHBaVzUwV1RvZ01IMDdYRzRnSUNBZ1kyOXVjM1FnZEc5MVkyZ3liVzkxYzJWRmRtVnVkQ0E5SUNodGIzVnpaVVYyWlc1MFRtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0tIUnZkV05vUlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGIzVmphRVYyWlc1MElDWW1JREFnUENCMGIzVmphRVYyWlc1MExuUnZkV05vWlhNdWJHVnVaM1JvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZTJOc2FXVnVkRmdzSUdOc2FXVnVkRmw5SUQwZ2RHOTFZMmhGZG1WdWRDNTBiM1ZqYUdWeld6QmRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ2ZFdOb1EyOXZjbVJwYm1GMFpYTWdQU0I3WTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXWDA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCallXNTJZWE11WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnVFc5MWMyVkZkbVZ1ZENodGIzVnpaVVYyWlc1MFRtRnRaU3dnZEc5MVkyaERiMjl5WkdsdVlYUmxjeWtwTzF4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmRXTm9jM1JoY25SY0lpd2dkRzkxWTJneWJXOTFjMlZGZG1WdWRDaGNJbTF2ZFhObFpHOTNibHdpS1NrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXUnZkMjVjSWl3Z2MzUmhjblJKYm5SbGNtRmpkR2x2YmlrN1hHNWNiaUFnSUNCcFppQW9JV0p2WVhKa0xtUnBjMkZpYkdWa1JISmhaMmRwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaHRiM1psWENJc0lIUnZkV05vTW0xdmRYTmxSWFpsYm5Rb1hDSnRiM1Z6WlcxdmRtVmNJaWtwTzF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxiVzkyWlZ3aUxDQnRiM1psS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb0lXSnZZWEprTG1ScGMyRmliR1ZrUkhKaFoyZHBibWRFYVdObElIeDhJQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnRiM1psWENJc0lITm9iM2RKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNWamFHVnVaRndpTENCMGIzVmphREp0YjNWelpVVjJaVzUwS0Z3aWJXOTFjMlYxY0Z3aUtTazdYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaWFZ3WENJc0lITjBiM0JKYm5SbGNtRmpkR2x2YmlrN1hHNGdJQ0FnWTJGdWRtRnpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0p0YjNWelpXOTFkRndpTENCemRHOXdTVzUwWlhKaFkzUnBiMjRwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJVYjNCRWFXTmxRbTloY21SSVZFMU1SV3hsYldWdWRDQnBjeUJoSUdOMWMzUnZiU0JJVkUxTUlHVnNaVzFsYm5RZ2RHOGdjbVZ1WkdWeUlHRnVaQ0JqYjI1MGNtOXNJR0ZjYmlBcUlHUnBZMlVnWW05aGNtUXVJRnh1SUNwY2JpQXFJRUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwWEc0Z0tpOWNibU52Ym5OMElGUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZENCN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRjbVZoZEdVZ1lTQnVaWGNnVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjM1I1YkdVdVpHbHpjR3hoZVNBOUlGd2lhVzVzYVc1bExXSnNiMk5yWENJN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOb1lXUnZkeUE5SUhSb2FYTXVZWFIwWVdOb1UyaGhaRzkzS0h0dGIyUmxPaUJjSW1Oc2IzTmxaRndpZlNrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOaGJuWmhjeUE5SUdSdlkzVnRaVzUwTG1OeVpXRjBaVVZzWlcxbGJuUW9YQ0pqWVc1MllYTmNJaWs3WEc0Z0lDQWdJQ0FnSUhOb1lXUnZkeTVoY0hCbGJtUkRhR2xzWkNoallXNTJZWE1wTzF4dVhHNGdJQ0FnSUNBZ0lGOWpZVzUyWVhNdWMyVjBLSFJvYVhNc0lHTmhiblpoY3lrN1hHNGdJQ0FnSUNBZ0lGOWpkWEp5Wlc1MFVHeGhlV1Z5TG5ObGRDaDBhR2x6TENCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSXBPMXh1SUNBZ0lDQWdJQ0JmYkdGNWIzVjBMbk5sZENoMGFHbHpMQ0J1WlhjZ1IzSnBaRXhoZVc5MWRDaDdYRzRnSUNBZ0lDQWdJQ0FnSUNCM2FXUjBhRG9nZEdocGN5NTNhV1IwYUN4Y2JpQWdJQ0FnSUNBZ0lDQWdJR2hsYVdkb2REb2dkR2hwY3k1b1pXbG5hSFFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthV1ZUYVhwbE9pQjBhR2x6TG1ScFpWTnBlbVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmthWE53WlhKemFXOXVPaUIwYUdsekxtUnBjM0JsY25OcGIyNWNiaUFnSUNBZ0lDQWdmU2twTzF4dUlDQWdJQ0FnSUNCelpYUjFjRWx1ZEdWeVlXTjBhVzl1S0hSb2FYTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lITjBZWFJwWXlCblpYUWdiMkp6WlhKMlpXUkJkSFJ5YVdKMWRHVnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzF4dUlDQWdJQ0FnSUNBZ0lDQWdWMGxFVkVoZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnU0VWSlIwaFVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCU1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlZ4dUlDQWdJQ0FnSUNCZE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdGMGRISnBZblYwWlVOb1lXNW5aV1JEWVd4c1ltRmpheWh1WVcxbExDQnZiR1JXWVd4MVpTd2dibVYzVm1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMkZ1ZG1GeklEMGdYMk5oYm5aaGN5NW5aWFFvZEdocGN5azdYRzRnSUNBZ0lDQWdJSE4zYVhSamFDQW9ibUZ0WlNrZ2UxeHVJQ0FnSUNBZ0lDQmpZWE5sSUZkSlJGUklYMEZVVkZKSlFsVlVSVG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2QybGtkR2dnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmVjBsRVZFZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVkMmxrZEdnZ1BTQjNhV1IwYUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oYm5aaGN5NXpaWFJCZEhSeWFXSjFkR1VvVjBsRVZFaGZRVlJVVWtsQ1ZWUkZMQ0IzYVdSMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRWhGU1VkSVZGOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdobGFXZG9kQ0E5SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5S0c1bGQxWmhiSFZsTENCd1lYSnpaVTUxYldKbGNpaHZiR1JXWVd4MVpTa2dmSHdnUkVWR1FWVk1WRjlJUlVsSFNGUXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVhR1ZwWjJoMElEMGdhR1ZwWjJoME8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTJGdWRtRnpMbk5sZEVGMGRISnBZblYwWlNoSVJVbEhTRlJmUVZSVVVrbENWVlJGTENCb1pXbG5hSFFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNWTlFSVkpUU1U5T1gwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsemNHVnljMmx2YmlBOUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtHNWxkMVpoYkhWbExDQndZWEp6WlU1MWJXSmxjaWh2YkdSV1lXeDFaU2tnZkh3Z1JFVkdRVlZNVkY5RVNWTlFSVkpUU1U5T0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXViR0Y1YjNWMExtUnBjM0JsY25OcGIyNGdQU0JrYVhOd1pYSnphVzl1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNCRVNVVmZVMGxhUlY5QlZGUlNTVUpWVkVVNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1JwWlZOcGVtVWdQU0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxjaWh1WlhkV1lXeDFaU3dnY0dGeWMyVk9kVzFpWlhJb2IyeGtWbUZzZFdVcElIeDhJRVJGUmtGVlRGUmZSRWxGWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVzWVhsdmRYUXVaR2xsVTJsNlpTQTlJR1JwWlZOcGVtVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVhOaFlteGxaRkp2ZEdGMGFXOXVJRDBnWjJWMFFtOXZiR1ZoYmlodVpYZFdZV3gxWlN3Z1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzSUdkbGRFSnZiMnhsWVc0b2IyeGtWbUZzZFdVc0lGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDFKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUXBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbkp2ZEdGMFpTQTlJQ0ZrYVhOaFlteGxaRkp2ZEdGMGFXOXVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1ZWFZzZERvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1ZHaGxJSFpoYkhWbElHbHpJR1JsZEdWeWJXbHVaV1FnZDJobGJpQjFjMmx1WnlCMGFHVWdaMlYwZEdWeVhHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhWd1pHRjBaVUp2WVhKa0tIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR052Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9YQ0owYjNBdFpHbGxPbUZrWkdWa1hDSXNJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhWd1pHRjBaVkpsWVdSNVJHbGpaU2gwYUdsekxDQXhLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hwYzFKbFlXUjVLSFJvYVhNcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ0lDQjBhR2x6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzQXRaR2xsT25KbGJXOTJaV1JjSWl3Z0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkWEJrWVhSbFVtVmhaSGxFYVdObEtIUm9hWE1zSUMweEtUdGNiaUFnSUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdRV3hzSUdScFkyVWdZbTloY21SeklHUnZJR2hoZG1VZ1lTQndiR0Y1WlhJZ2JHbHpkQzRnU1dZZ2RHaGxjbVVnYVhOdUozUWdiMjVsSUhsbGRDeGNiaUFnSUNBZ0lDQWdMeThnWTNKbFlYUmxJRzl1WlM1Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJSFJvYVhNdWNYVmxjbmxUWld4bFkzUnZjaWhjSW5SdmNDMXdiR0Y1WlhJdGJHbHpkRndpS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWhjSEJsYm1SRGFHbHNaQ2hrYjJOMWJXVnVkQzVqY21WaGRHVkZiR1Z0Wlc1MEtGd2lkRzl3TFhCc1lYbGxjaTFzYVhOMFhDSXBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUgxY2JseHVJQ0FnSUdGa2IzQjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdSM0pwWkV4aGVXOTFkQ0IxYzJWa0lHSjVJSFJvYVhNZ1JHbGpaVUp2WVhKa0lIUnZJR3hoZVc5MWRDQjBhR1VnWkdsalpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0dGIyUjFiR1U2UjNKcFpFeGhlVzkxZEg1SGNtbGtUR0Y1YjNWMGZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnNZWGx2ZFhRb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZiR0Y1YjNWMExtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnWkdsalpTQnZiaUIwYUdseklHSnZZWEprTGlCT2IzUmxMQ0IwYnlCaFkzUjFZV3hzZVNCMGFISnZkeUIwYUdVZ1pHbGpaU0IxYzJWY2JpQWdJQ0FnS2lCN1FHeHBibXNnZEdoeWIzZEVhV05sZlM0Z1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3Ylc5a2RXeGxPbFJ2Y0VScFpVaFVUVXhGYkdWdFpXNTBmbFJ2Y0VScFpVaFVUVXhGYkdWdFpXNTBXMTE5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiTGk0dWRHaHBjeTVuWlhSRmJHVnRaVzUwYzBKNVZHRm5UbUZ0WlNoY0luUnZjQzFrYVdWY0lpbGRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvWVhRZ1kyRnVJR0psSUhCMWRDQnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VG5WdFltVnlmU0JVYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pHbGpaU3dnTUNBOElHMWhlR2x0ZFcwdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHMWhlR2x0ZFcxT2RXMWlaWEpQWmtScFkyVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxteGhlVzkxZEM1dFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0IzYVdSMGFDQnZaaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdkMmxrZEdnb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNrRjBkSEpwWW5WMFpTaDBhR2x6TENCWFNVUlVTRjlCVkZSU1NVSlZWRVVzSUVSRlJrRlZURlJmVjBsRVZFZ3BPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCb1pXbG5hSFFnYjJZZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCb1pXbG5hSFFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JJUlVsSFNGUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMGhGU1VkSVZDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdScGMzQmxjbk5wYjI0Z2JHVjJaV3dnYjJZZ2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tpQkFkSGx3WlNCN1RuVnRZbVZ5ZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FYTndaWEp6YVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1JFbFRVRVZTVTBsUFRsOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZSRWxUVUVWU1UwbFBUaWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElITnBlbVVnYjJZZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsbFUybDZaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRGQnZjMmwwYVhabFRuVnRZbVZ5UVhSMGNtbGlkWFJsS0hSb2FYTXNJRVJKUlY5VFNWcEZYMEZVVkZKSlFsVlVSU3dnUkVWR1FWVk1WRjlFU1VWZlUwbGFSU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTJGdUlHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDQmlaU0JrY21GbloyVmtQMXh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVb2RHaHBjeXdnUkZKQlIwZEpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZSRkpCUjBkSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyRnVJR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQ0JpWlNCb1pXeGtJR0o1SUdFZ1VHeGhlV1Z5UDF4dUlDQWdJQ0FxSUVCMGVYQmxJSHRDYjI5c1pXRnVmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JrYVhOaFlteGxaRWh2YkdScGJtZEVhV05sS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBRbTl2YkdWaGJrRjBkSEpwWW5WMFpTaDBhR2x6TENCSVQweEVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMGhQVEVSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1NYTWdjbTkwWVhScGJtY2daR2xqWlNCdmJpQjBhR2x6SUdKdllYSmtJR1JwYzJGaWJHVmtQMXh1SUNBZ0lDQXFJRUIwZVhCbElIdENiMjlzWldGdWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQmthWE5oWW14bFpGSnZkR0YwYVc1blJHbGpaU2dwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc1QmRIUnlhV0oxZEdVb2RHaHBjeXdnVWs5VVFWUkpUa2RmUkVsRFJWOUVTVk5CUWt4RlJGOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZVazlVUVZSSlRrZGZSRWxEUlY5RVNWTkJRa3hGUkNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR1IxY21GMGFXOXVJR2x1SUcxeklIUnZJSEJ5WlhOeklIUm9aU0J0YjNWelpTQXZJSFJ2ZFdOb0lHRWdaR2xsSUdKbFptOXlaU0JwZENCaVpXdHZiV1Z6WEc0Z0lDQWdJQ29nYUdWc1pDQmllU0IwYUdVZ1VHeGhlV1Z5TGlCSmRDQm9ZWE1nYjI1c2VTQmhiaUJsWm1abFkzUWdkMmhsYmlCMGFHbHpMbWh2YkdSaFlteGxSR2xqWlNBOVBUMWNiaUFnSUNBZ0tpQjBjblZsTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMDUxYldKbGNuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdhRzlzWkVSMWNtRjBhVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhKQmRIUnlhV0oxZEdVb2RHaHBjeXdnU0U5TVJGOUVWVkpCVkVsUFRsOUJWRlJTU1VKVlZFVXNJRVJGUmtGVlRGUmZTRTlNUkY5RVZWSkJWRWxQVGlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJSEJzWVhsbGNuTWdjR3hoZVdsdVp5QnZiaUIwYUdseklHSnZZWEprTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSNWNHVWdlMjF2WkhWc1pUcFViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkSDVVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEZ0ZGZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQndiR0Y1WlhKektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1eGRXVnllVk5sYkdWamRHOXlLRndpZEc5d0xYQnNZWGxsY2kxc2FYTjBYQ0lwTG5Cc1lYbGxjbk03WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUVhNZ2NHeGhlV1Z5TENCMGFISnZkeUIwYUdVZ1pHbGpaU0J2YmlCMGFHbHpJR0p2WVhKa0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0dGIyUjFiR1U2Vkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5SK1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUjlJRnR3YkdGNVpYSWdQU0JFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZKZElDMGdWR2hsWEc0Z0lDQWdJQ29nY0d4aGVXVnlJSFJvWVhRZ2FYTWdkR2h5YjNkcGJtY2dkR2hsSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTIxdlpIVnNaVHBVYjNCRWFXVklWRTFNUld4bGJXVnVkSDVVYjNCRWFXVklWRTFNUld4bGJXVnVkRnRkZlNCVWFHVWdkR2h5YjNkdUlHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDNGdWR2hwY3lCc2FYTjBJRzltSUdScFkyVWdhWE1nZEdobElITmhiV1VnWVhNZ2RHaHBjeUJVYjNCRWFXTmxRbTloY21SSVZFMU1SV3hsYldWdWRDZHpJSHRBYzJWbElHUnBZMlY5SUhCeWIzQmxjblI1WEc0Z0lDQWdJQ292WEc0Z0lDQWdkR2h5YjNkRWFXTmxLSEJzWVhsbGNpQTlJRVJGUmtGVlRGUmZVMWxUVkVWTlgxQk1RVmxGVWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY0d4aGVXVnlJQ1ltSUNGd2JHRjVaWEl1YUdGelZIVnliaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjR3hoZVdWeUxuTjBZWEowVkhWeWJpZ3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR2xqWlM1bWIzSkZZV05vS0dScFpTQTlQaUJrYVdVdWRHaHliM2RKZENncEtUdGNiaUFnSUNBZ0lDQWdkWEJrWVhSbFFtOWhjbVFvZEdocGN5d2dkR2hwY3k1c1lYbHZkWFF1YkdGNWIzVjBLSFJvYVhNdVpHbGpaU2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWthV05sTzF4dUlDQWdJSDFjYm4wN1hHNWNibmRwYm1SdmR5NWpkWE4wYjIxRmJHVnRaVzUwY3k1a1pXWnBibVVvWENKMGIzQXRaR2xqWlMxaWIyRnlaRndpTENCVWIzQkVhV05sUW05aGNtUklWRTFNUld4bGJXVnVkQ2s3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJQ0FnVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUXNYRzRnSUNBZ1JFVkdRVlZNVkY5RVNVVmZVMGxhUlN4Y2JpQWdJQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0c1hHNGdJQ0FnUkVWR1FWVk1WRjlYU1VSVVNDeGNiaUFnSUNCRVJVWkJWVXhVWDBoRlNVZElWQ3hjYmlBZ0lDQkVSVVpCVlV4VVgwUkpVMUJGVWxOSlQwNHNYRzRnSUNBZ1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYRzU5TzF4dUlpd2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5OXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzMwZ1puSnZiU0JjSWk0dmJXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6TG1welhDSTdYRzVjYmk4cUtseHVJQ29nUUcxdlpIVnNaVnh1SUNvdlhHNWpiMjV6ZENCRFNWSkRURVZmUkVWSFVrVkZVeUE5SURNMk1Ec2dMeThnWkdWbmNtVmxjMXh1WTI5dWMzUWdUbFZOUWtWU1gwOUdYMUJKVUZNZ1BTQTJPeUF2THlCRVpXWmhkV3gwSUM4Z2NtVm5kV3hoY2lCemFYZ2djMmxrWldRZ1pHbGxJR2hoY3lBMklIQnBjSE1nYldGNGFXMTFiUzVjYm1OdmJuTjBJRVJGUmtGVlRGUmZRMDlNVDFJZ1BTQmNJa2wyYjNKNVhDSTdYRzVqYjI1emRDQkVSVVpCVlV4VVgxZ2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVpJRDBnTURzZ0x5OGdjSGhjYm1OdmJuTjBJRVJGUmtGVlRGUmZVazlVUVZSSlQwNGdQU0F3T3lBdkx5QmtaV2R5WldWelhHNWpiMjV6ZENCRVJVWkJWVXhVWDA5UVFVTkpWRmtnUFNBd0xqVTdYRzVjYm1OdmJuTjBJRU5QVEU5U1gwRlVWRkpKUWxWVVJTQTlJRndpWTI5c2IzSmNJanRjYm1OdmJuTjBJRWhGVEVSZlFsbGZRVlJVVWtsQ1ZWUkZJRDBnWENKb1pXeGtMV0o1WENJN1hHNWpiMjV6ZENCUVNWQlRYMEZVVkZKSlFsVlVSU0E5SUZ3aWNHbHdjMXdpTzF4dVkyOXVjM1FnVWs5VVFWUkpUMDVmUVZSVVVrbENWVlJGSUQwZ1hDSnliM1JoZEdsdmJsd2lPMXh1WTI5dWMzUWdXRjlCVkZSU1NVSlZWRVVnUFNCY0luaGNJanRjYm1OdmJuTjBJRmxmUVZSVVVrbENWVlJGSUQwZ1hDSjVYQ0k3WEc1Y2JtTnZibk4wSUVKQlUwVmZSRWxGWDFOSldrVWdQU0F4TURBN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUE5SURFMU95QXZMeUJ3ZUZ4dVkyOXVjM1FnUWtGVFJWOVRWRkpQUzBWZlYwbEVWRWdnUFNBeUxqVTdJQzh2SUhCNFhHNWpiMjV6ZENCTlNVNWZVMVJTVDB0RlgxZEpSRlJJSUQwZ01Uc2dMeThnY0hoY2JtTnZibk4wSUVoQlRFWWdQU0JDUVZORlgwUkpSVjlUU1ZwRklDOGdNanNnTHk4Z2NIaGNibU52Ym5OMElGUklTVkpFSUQwZ1FrRlRSVjlFU1VWZlUwbGFSU0F2SURNN0lDOHZJSEI0WEc1amIyNXpkQ0JRU1ZCZlUwbGFSU0E5SUVKQlUwVmZSRWxGWDFOSldrVWdMeUF4TlRzZ0x5OXdlRnh1WTI5dWMzUWdVRWxRWDBOUFRFOVNJRDBnWENKaWJHRmphMXdpTzF4dVhHNWpiMjV6ZENCa1pXY3ljbUZrSUQwZ0tHUmxaeWtnUFQ0Z2UxeHVJQ0FnSUhKbGRIVnliaUJrWldjZ0tpQW9UV0YwYUM1UVNTQXZJREU0TUNrN1hHNTlPMXh1WEc1amIyNXpkQ0JwYzFCcGNFNTFiV0psY2lBOUlHNGdQVDRnZTF4dUlDQWdJR052Ym5OMElHNTFiV0psY2lBOUlIQmhjbk5sU1c1MEtHNHNJREV3S1R0Y2JpQWdJQ0J5WlhSMWNtNGdUblZ0WW1WeUxtbHpTVzUwWldkbGNpaHVkVzFpWlhJcElDWW1JREVnUEQwZ2JuVnRZbVZ5SUNZbUlHNTFiV0psY2lBOFBTQk9WVTFDUlZKZlQwWmZVRWxRVXp0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUjJWdVpYSmhkR1VnWVNCeVlXNWtiMjBnYm5WdFltVnlJRzltSUhCcGNITWdZbVYwZDJWbGJpQXhJR0Z1WkNCMGFHVWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UwNTFiV0psY24wZ1FTQnlZVzVrYjIwZ2JuVnRZbVZ5SUc0c0lERWc0b21rSUc0ZzRvbWtJRTVWVFVKRlVsOVBSbDlRU1ZCVExseHVJQ292WEc1amIyNXpkQ0J5WVc1a2IyMVFhWEJ6SUQwZ0tDa2dQVDRnVFdGMGFDNW1iRzl2Y2loTllYUm9MbkpoYm1SdmJTZ3BJQ29nVGxWTlFrVlNYMDlHWDFCSlVGTXBJQ3NnTVR0Y2JseHVZMjl1YzNRZ1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVeUE5SUZ0Y0l1S2FnRndpTEZ3aTRwcUJYQ0lzWENMaW1vSmNJaXhjSXVLYWcxd2lMRndpNHBxRVhDSXNYQ0xpbW9WY0lsMDdYRzVjYmk4cUtseHVJQ29nUTI5dWRtVnlkQ0JoSUhWdWFXTnZaR1VnWTJoaGNtRmpkR1Z5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR1JwWlNCbVlXTmxJSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWWdjR2x3Y3lCdlpseHVJQ29nZEdoaGRDQnpZVzFsSUdScFpTNGdWR2hwY3lCbWRXNWpkR2x2YmlCcGN5QjBhR1VnY21WMlpYSnpaU0J2WmlCd2FYQnpWRzlWYm1samIyUmxMbHh1SUNwY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQjFJQzBnVkdobElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlIUnZJR052Ym5abGNuUWdkRzhnY0dsd2N5NWNiaUFxSUVCeVpYUjFjbTV6SUh0T2RXMWlaWEo4ZFc1a1pXWnBibVZrZlNCVWFHVWdZMjl5Y21WemNHOXVaR2x1WnlCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaXdnYjNKY2JpQXFJSFZ1WkdWbWFXNWxaQ0JwWmlCMUlIZGhjeUJ1YjNRZ1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNpQnlaWEJ5WlhObGJuUnBibWNnWVNCa2FXVXVYRzRnS2k5Y2JtTnZibk4wSUhWdWFXTnZaR1ZVYjFCcGNITWdQU0FvZFNrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUdScFpVTm9ZWEpKYm1SbGVDQTlJRVJKUlY5VlRrbERUMFJGWDBOSVFWSkJRMVJGVWxNdWFXNWtaWGhQWmloMUtUdGNiaUFnSUNCeVpYUjFjbTRnTUNBOFBTQmthV1ZEYUdGeVNXNWtaWGdnUHlCa2FXVkRhR0Z5U1c1a1pYZ2dLeUF4SURvZ2RXNWtaV1pwYm1Wa08xeHVmVHRjYmx4dUx5b3FYRzRnS2lCRGIyNTJaWEowSUdFZ2JuVnRZbVZ5SUc5bUlIQnBjSE1zSURFZzRvbWtJSEJwY0hNZzRvbWtJRFlnZEc4Z1lTQjFibWxqYjJSbElHTm9ZWEpoWTNSbGNseHVJQ29nY21Wd2NtVnpaVzUwWVhScGIyNGdiMllnZEdobElHTnZjbkpsYzNCdmJtUnBibWNnWkdsbElHWmhZMlV1SUZSb2FYTWdablZ1WTNScGIyNGdhWE1nZEdobElISmxkbVZ5YzJWY2JpQXFJRzltSUhWdWFXTnZaR1ZVYjFCcGNITXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlIQWdMU0JVYUdVZ2JuVnRZbVZ5SUc5bUlIQnBjSE1nZEc4Z1kyOXVkbVZ5ZENCMGJ5QmhJSFZ1YVdOdlpHVWdZMmhoY21GamRHVnlMbHh1SUNvZ1FISmxkSFZ5Ym5NZ2UxTjBjbWx1WjN4MWJtUmxabWx1WldSOUlGUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIVnVhV052WkdVZ1kyaGhjbUZqZEdWeWN5QnZjbHh1SUNvZ2RXNWtaV1pwYm1Wa0lHbG1JSEFnZDJGeklHNXZkQ0JpWlhSM1pXVnVJREVnWVc1a0lEWWdhVzVqYkhWemFYWmxMbHh1SUNvdlhHNWpiMjV6ZENCd2FYQnpWRzlWYm1samIyUmxJRDBnY0NBOVBpQnBjMUJwY0U1MWJXSmxjaWh3S1NBL0lFUkpSVjlWVGtsRFQwUkZYME5JUVZKQlExUkZVbE5iY0NBdElERmRJRG9nZFc1a1pXWnBibVZrTzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpJYjJ4a0lEMGdLR052Ym5SbGVIUXNJSGdzSUhrc0lIZHBaSFJvTENCamIyeHZjaWtnUFQ0Z2UxeHVJQ0FnSUdOdmJuTjBJRk5GVUVWU1FWUlBVaUE5SUhkcFpIUm9JQzhnTXpBN1hHNGdJQ0FnWTI5dWRHVjRkQzV6WVhabEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bmJHOWlZV3hCYkhCb1lTQTlJRVJGUmtGVlRGUmZUMUJCUTBsVVdUdGNiaUFnSUNCamIyNTBaWGgwTG1KbFoybHVVR0YwYUNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Wm1sc2JGTjBlV3hsSUQwZ1kyOXNiM0k3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vZUNBcklIZHBaSFJvTENCNUlDc2dkMmxrZEdnc0lIZHBaSFJvSUMwZ1UwVlFSVkpCVkU5U0xDQXdMQ0F5SUNvZ1RXRjBhQzVRU1N3Z1ptRnNjMlVwTzF4dUlDQWdJR052Ym5SbGVIUXVabWxzYkNncE8xeHVJQ0FnSUdOdmJuUmxlSFF1Y21WemRHOXlaU2dwTzF4dWZUdGNibHh1WTI5dWMzUWdjbVZ1WkdWeVJHbGxJRDBnS0dOdmJuUmxlSFFzSUhnc0lIa3NJSGRwWkhSb0xDQmpiMnh2Y2lrZ1BUNGdlMXh1SUNBZ0lHTnZibk4wSUZORFFVeEZJRDBnS0hkcFpIUm9JQzhnU0VGTVJpazdYRzRnSUNBZ1kyOXVjM1FnU0VGTVJsOUpUazVGVWw5VFNWcEZJRDBnVFdGMGFDNXpjWEowS0hkcFpIUm9JQ29xSURJZ0x5QXlLVHRjYmlBZ0lDQmpiMjV6ZENCSlRrNUZVbDlUU1ZwRklEMGdNaUFxSUVoQlRFWmZTVTVPUlZKZlUwbGFSVHRjYmlBZ0lDQmpiMjV6ZENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTWdQU0JDUVZORlgxSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeUFxSUZORFFVeEZPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBOUlFbE9Ua1ZTWDFOSldrVWdMU0F5SUNvZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRPMXh1SUNBZ0lHTnZibk4wSUZOVVVrOUxSVjlYU1VSVVNDQTlJRTFoZEdndWJXRjRLRTFKVGw5VFZGSlBTMFZmVjBsRVZFZ3NJRUpCVTBWZlUxUlNUMHRGWDFkSlJGUklJQ29nVTBOQlRFVXBPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJZSUQwZ2VDQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTzF4dUlDQWdJR052Ym5OMElITjBZWEowV1NBOUlIa2dLeUIzYVdSMGFDQXRJRWhCVEVaZlNVNU9SVkpmVTBsYVJUdGNibHh1SUNBZ0lHTnZiblJsZUhRdWMyRjJaU2dwTzF4dUlDQWdJR052Ym5SbGVIUXVZbVZuYVc1UVlYUm9LQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzVTNSNWJHVWdQU0JqYjJ4dmNqdGNiaUFnSUNCamIyNTBaWGgwTG5OMGNtOXJaVk4wZVd4bElEMGdYQ0ppYkdGamExd2lPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVmRwWkhSb0lEMGdVMVJTVDB0RlgxZEpSRlJJTzF4dUlDQWdJR052Ym5SbGVIUXViVzkyWlZSdktITjBZWEowV0N3Z2MzUmhjblJaS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUlDc2dTVTVPUlZKZlUwbGFSVjlTVDFWT1JFVkVMQ0J6ZEdGeWRGa2dLeUJTVDFWT1JFVkVYME5QVWs1RlVsOVNRVVJKVlZNc0lGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnWkdWbk1uSmhaQ2d5TnpBcExDQmtaV2N5Y21Ga0tEQXBLVHRjYmlBZ0lDQmpiMjUwWlhoMExteHBibVZVYnloemRHRnlkRmdnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeWs3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFTENCemRHRnlkRmtnS3lCSlRrNUZVbDlUU1ZwRlgxSlBWVTVFUlVRZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3dLU3dnWkdWbk1uSmhaQ2c1TUNrcE8xeHVJQ0FnSUdOdmJuUmxlSFF1YkdsdVpWUnZLSE4wWVhKMFdDd2djM1JoY25SWklDc2dTVTVPUlZKZlUwbGFSU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWhjbU1vYzNSaGNuUllMQ0J6ZEdGeWRGa2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1pHVm5NbkpoWkNnNU1Da3NJR1JsWnpKeVlXUW9NVGd3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUlDMGdVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCemRHRnlkRmtnS3lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXBPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSE4wWVhKMFdDd2djM1JoY25SWklDc2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTXNJR1JsWnpKeVlXUW9NVGd3S1N3Z1pHVm5NbkpoWkNneU56QXBLVHRjYmx4dUlDQWdJR052Ym5SbGVIUXVjM1J5YjJ0bEtDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWpiMjV6ZENCeVpXNWtaWEpRYVhBZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dwSUQwK0lIdGNiaUFnSUNCamIyNTBaWGgwTG5OaGRtVW9LVHRjYmlBZ0lDQmpiMjUwWlhoMExtSmxaMmx1VUdGMGFDZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiRk4wZVd4bElEMGdVRWxRWDBOUFRFOVNPMXh1SUNBZ0lHTnZiblJsZUhRdWJXOTJaVlJ2S0hnc0lIa3BPMXh1SUNBZ0lHTnZiblJsZUhRdVlYSmpLSGdzSUhrc0lIZHBaSFJvTENBd0xDQXlJQ29nVFdGMGFDNVFTU3dnWm1Gc2MyVXBPMXh1SUNBZ0lHTnZiblJsZUhRdVptbHNiQ2dwTzF4dUlDQWdJR052Ym5SbGVIUXVjbVZ6ZEc5eVpTZ3BPMXh1ZlR0Y2JseHVYRzR2THlCUWNtbDJZWFJsSUhCeWIzQmxjblJwWlhOY2JtTnZibk4wSUY5aWIyRnlaQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZZMjlzYjNJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDJobGJHUkNlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjR2x3Y3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmY205MFlYUnBiMjRnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2dnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYM2tnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WEc0dktpcGNiaUFxSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwSUdseklIUm9aU0JjSW5SdmNDMWthV1ZjSWlCamRYTjBiMjBnVzBoVVRVeGNiaUFxSUdWc1pXMWxiblJkS0doMGRIQnpPaTh2WkdWMlpXeHZjR1Z5TG0xdmVtbHNiR0V1YjNKbkwyVnVMVlZUTDJSdlkzTXZWMlZpTDBGUVNTOUlWRTFNUld4bGJXVnVkQ2tnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsWEc0Z0tpQnZiaUIwYUdVZ1pHbGpaU0JpYjJGeVpDNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvZ1FHMXBlR1Z6SUcxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpYRzRnS2k5Y2JtTnZibk4wSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwSUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJTWldGa1QyNXNlVUYwZEhKcFluVjBaWE1vU0ZSTlRFVnNaVzFsYm5RcElIdGNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRU55WldGMFpTQmhJRzVsZHlCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2lncElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNibHh1SUNBZ0lDQWdJQ0F2THlCRmJuTjFjbVVnWlhabGNua2daR2xsSUdoaGN5QmhJSEJwY0hNc0lERWdQRDBnY0dsd2N5QThQU0EyWEc0Z0lDQWdJQ0FnSUd4bGRDQndhWEJ6SUQwZ1RtRk9PMXh1SUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTVvWVhOQmRIUnlhV0oxZEdVb1VFbFFVMTlCVkZSU1NVSlZWRVVwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3YVhCeklEMGdjR0Z5YzJWSmJuUW9kR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9VRWxRVTE5QlZGUlNTVUpWVkVVcExDQXhNQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnBaaUFvVG5WdFltVnlMbWx6VG1GT0tIQnBjSE1wSUh4OElERWdQaUJ3YVhCeklIeDhJRFlnUENCd2FYQnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndhWEJ6SUQwZ2NtRnVaRzl0VUdsd2N5Z3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ1gzQnBjSE11YzJWMEtIUm9hWE1zSUhCcGNITXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hRU1ZCVFgwRlVWRkpKUWxWVVJTd2djR2x3Y3lrN1hHNWNiaUFnSUNBZ0lDQWdMeThnVDNSb1pYSWdZWFIwY21saWRYUmxjeTRnVkU5RVR6b2dZV1JrSUhaaGJHbGtZWFJwYjI0dVhHNGdJQ0FnSUNBZ0lHbG1JQ2gwYUdsekxtaGhjMEYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1OdmJHOXlJRDBnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WTI5c2IzSWdQU0JFUlVaQlZVeFVYME5QVEU5U08xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YUdGelFYUjBjbWxpZFhSbEtGSlBWRUZVU1U5T1gwRlVWRkpKUWxWVVJTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11Y205MFlYUnBiMjRnUFNCd1lYSnpaVWx1ZENoMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoU1QxUkJWRWxQVGw5QlZGUlNTVUpWVkVVcExDQXhNQ2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KdmRHRjBhVzl1SUQwZ1JFVkdRVlZNVkY5U1QxUkJWRWxQVGp0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGFHbHpMbWhoYzBGMGRISnBZblYwWlNoWVgwRlVWRkpKUWxWVVJTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZUNBOUlIQmhjbk5sU1c1MEtIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGaGZRVlJVVWtsQ1ZWUkZLU3dnTVRBcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NTRJRDBnUkVWR1FWVk1WRjlZTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSb2FYTXVhR0Z6UVhSMGNtbGlkWFJsS0ZsZlFWUlVVa2xDVlZSRktTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTU1SUQwZ2NHRnljMlZKYm5Rb2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1dWOUJWRlJTU1VKVlZFVXBMQ0F4TUNrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxua2dQU0JFUlVaQlZVeFVYMWs3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NW9ZWE5CZEhSeWFXSjFkR1VvU0VWTVJGOUNXVjlCVkZSU1NVSlZWRVVwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtaGxiR1JDZVNBOUlIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtFaEZURVJmUWxsZlFWUlVVa2xDVlZSRktUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MzUmhkR2xqSUdkbGRDQnZZbk5sY25abFpFRjBkSEpwWW5WMFpYTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJiWEc0Z0lDQWdJQ0FnSUNBZ0lDQkRUMHhQVWw5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JJUlV4RVgwSlpYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lGQkpVRk5mUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdVazlVUVZSSlQwNWZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1dGOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCWlgwRlVWRkpKUWxWVVJWeHVJQ0FnSUNBZ0lDQmRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHTnZibTVsWTNSbFpFTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lDQWdJQ0JmWW05aGNtUXVjMlYwS0hSb2FYTXNJSFJvYVhNdWNHRnlaVzUwVG05a1pTazdYRzRnSUNBZ0lDQWdJRjlpYjJGeVpDNW5aWFFvZEdocGN5a3VaR2x6Y0dGMFkyaEZkbVZ1ZENodVpYY2dSWFpsYm5Rb1hDSjBiM0F0WkdsbE9tRmtaR1ZrWENJcEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCa2FYTmpiMjV1WldOMFpXUkRZV3hzWW1GamF5Z3BJSHRjYmlBZ0lDQWdJQ0FnWDJKdllYSmtMbWRsZENoMGFHbHpLUzVrYVhOd1lYUmphRVYyWlc1MEtHNWxkeUJGZG1WdWRDaGNJblJ2Y0Mxa2FXVTZjbVZ0YjNabFpGd2lLU2s3WEc0Z0lDQWdJQ0FnSUY5aWIyRnlaQzV6WlhRb2RHaHBjeXdnYm5Wc2JDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQjBhR2x6SUVScFpTQjBieUIwYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUIxYm1samIyUmxJR05vWVhKaFkzUmxjaUJ2WmlCaElHUnBaU0JtWVdObExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSWdZMjl5Y21WemNHOXVaR2x1WnlCMGJ5QjBhR1VnYm5WdFltVnlJRzltWEc0Z0lDQWdJQ29nY0dsd2N5QnZaaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLaTljYmlBZ0lDQjBiMVZ1YVdOdlpHVW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ3YVhCelZHOVZibWxqYjJSbEtIUm9hWE11Y0dsd2N5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdjM1J5YVc1bklISmxjSEpsYzJWdVlYUnBiMjRnWm05eUlIUm9hWE1nWkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1UzUnlhVzVuZlNCVWFHVWdkVzVwWTI5a1pTQnplVzFpYjJ3Z1kyOXljbVZ6Y0c5dVpHbHVaeUIwYnlCMGFHVWdiblZ0WW1WeUlHOW1JSEJwY0hOY2JpQWdJQ0FnS2lCdlppQjBhR2x6SUdScFpTNWNiaUFnSUNBZ0tpOWNiaUFnSUNCMGIxTjBjbWx1WnlncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11ZEc5VmJtbGpiMlJsS0NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaHBjeUJFYVdVbmN5QnVkVzFpWlhJZ2IyWWdjR2x3Y3l3Z01TRGlpYVFnY0dsd2N5RGlpYVFnTmk1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSEJwY0hNb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZjR2x3Y3k1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaHBjeUJFYVdVbmN5QmpiMnh2Y2k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRUZEhKcGJtZDlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR052Ykc5eUtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMk52Ykc5eUxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNGdJQ0FnYzJWMElHTnZiRzl5S0c1bGQwTnZiRzl5S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lEMDlQU0J1WlhkRGIyeHZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOWpiMnh2Y2k1elpYUW9kR2hwY3l3Z1JFVkdRVlZNVkY5RFQweFBVaWs3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZZMjlzYjNJdWMyVjBLSFJvYVhNc0lHNWxkME52Ykc5eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0VOUFRFOVNYMEZVVkZKSlFsVlVSU3dnYm1WM1EyOXNiM0lwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnVUd4aGVXVnlJSFJvWVhRZ2FYTWdhRzlzWkdsdVp5QjBhR2x6SUVScFpTd2dhV1lnWVc1NUxpQk9kV3hzSUc5MGFHVnlkMmx6WlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRRYkdGNVpYSjhiblZzYkgwZ1hHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHaGxiR1JDZVNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOW9aV3hrUW5rdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2FHVnNaRUo1S0hCc1lYbGxjaWtnZTF4dUlDQWdJQ0FnSUNCZmFHVnNaRUo1TG5ObGRDaDBhR2x6TENCd2JHRjVaWElwTzF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBUMGdjR3hoZVdWeUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaGNJbWhsYkdRdFlubGNJaWs3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaGNJbWhsYkdRdFlubGNJaXdnY0d4aGVXVnlMblJ2VTNSeWFXNW5LQ2twTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUc5bUlIUm9hWE1nUkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTBOdmIzSmthVzVoZEdWemZHNTFiR3g5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdOdmIzSmthVzVoZEdWektDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiblZzYkNBOVBUMGdkR2hwY3k1NElIeDhJRzUxYkd3Z1BUMDlJSFJvYVhNdWVTQS9JRzUxYkd3Z09pQjdlRG9nZEdocGN5NTRMQ0I1T2lCMGFHbHpMbmw5TzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnWTI5dmNtUnBibUYwWlhNb1l5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2JuVnNiQ0E5UFQwZ1l5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTU0SUQwZ2JuVnNiRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZVNBOUlHNTFiR3c3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaWHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdNN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuZ2dQU0I0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1NUlEMGdlVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVSdlpYTWdkR2hwY3lCRWFXVWdhR0YyWlNCamIyOXlaR2x1WVhSbGN6OWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwSnZiMnhsWVc1OUlGUnlkV1VnZDJobGJpQjBhR1VnUkdsbElHUnZaWE1nYUdGMlpTQmpiMjl5WkdsdVlYUmxjMXh1SUNBZ0lDQXFMMXh1SUNBZ0lHaGhjME52YjNKa2FXNWhkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JuVnNiQ0FoUFQwZ2RHaHBjeTVqYjI5eVpHbHVZWFJsY3p0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdlQ0JqYjI5eVpHbHVZWFJsWEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQjRLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNndVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2VDaHVaWGRZS1NCN1hHNGdJQ0FnSUNBZ0lGOTRMbk5sZENoMGFHbHpMQ0J1WlhkWUtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9YQ0o0WENJc0lHNWxkMWdwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQjVJR052YjNKa2FXNWhkR1ZjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElIa29LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmZVM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dUlDQWdJSE5sZENCNUtHNWxkMWtwSUh0Y2JpQWdJQ0FnSUNBZ1gza3VjMlYwS0hSb2FYTXNJRzVsZDFrcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaGNJbmxjSWl3Z2JtVjNXU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElISnZkR0YwYVc5dUlHOW1JSFJvYVhNZ1JHbGxMaUF3SU9LSnBDQnliM1JoZEdsdmJpRGlpYVFnTXpZd0xseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbnh1ZFd4c2ZWeHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnliM1JoZEdsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjl5YjNSaGRHbHZiaTVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0J5YjNSaGRHbHZiaWh1WlhkU0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJRDA5UFNCdVpYZFNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hjSW5KdmRHRjBhVzl1WENJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdibTl5YldGc2FYcGxaRkp2ZEdGMGFXOXVJRDBnYm1WM1VpQWxJRU5KVWtOTVJWOUVSVWRTUlVWVE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNKdmRHRjBhVzl1TG5ObGRDaDBhR2x6TENCdWIzSnRZV3hwZW1Wa1VtOTBZWFJwYjI0cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvWENKeWIzUmhkR2x2Ymx3aUxDQnViM0p0WVd4cGVtVmtVbTkwWVhScGIyNHBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdoeWIzY2dkR2hwY3lCRWFXVXVJRlJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjeUIwYnlCaElISmhibVJ2YlNCdWRXMWlaWElnYml3Z01TRGlpYVFnYmlEaWlhUWdOaTVjYmlBZ0lDQWdLaUJQYm14NUlHUnBZMlVnZEdoaGRDQmhjbVVnYm05MElHSmxhVzVuSUdobGJHUWdZMkZ1SUdKbElIUm9jbTkzYmk1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCbWFYSmxjeUJjSW5SdmNEcDBhSEp2ZHkxa2FXVmNJaUIzYVhSb0lIQmhjbUZ0WlhSbGNuTWdkR2hwY3lCRWFXVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2RHaHliM2RKZENncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0NGMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZjR2x3Y3k1elpYUW9kR2hwY3l3Z2NtRnVaRzl0VUdsd2N5Z3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGQkpVRk5mUVZSVVVrbENWVlJGTENCMGFHbHpMbkJwY0hNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NWthWE53WVhSamFFVjJaVzUwS0c1bGR5QkZkbVZ1ZENoY0luUnZjRHAwYUhKdmR5MWthV1ZjSWl3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUmxkR0ZwYkRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYVdVNklIUm9hWE5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeUlHaHZiR1J6SUhSb2FYTWdSR2xsTGlCQklIQnNZWGxsY2lCallXNGdiMjVzZVNCb2IyeGtJR0VnWkdsbElIUm9ZWFFnYVhNZ2JtOTBYRzRnSUNBZ0lDb2dZbVZwYm1jZ2FHVnNaQ0JpZVNCaGJtOTBhR1Z5SUhCc1lYbGxjaUI1WlhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTIxdlpIVnNaVHBRYkdGNVpYSitVR3hoZVdWeWZTQndiR0Y1WlhJZ0xTQlVhR1VnY0d4aGVXVnlJSGRvYnlCM1lXNTBjeUIwYnlCb2IyeGtJSFJvYVhNZ1JHbGxMbHh1SUNBZ0lDQXFJRUJtYVhKbGN5QmNJblJ2Y0Rwb2IyeGtMV1JwWlZ3aUlIZHBkR2dnY0dGeVlXMWxkR1Z5Y3lCMGFHbHpJRVJwWlNCaGJtUWdkR2hsSUhCc1lYbGxjaTVjYmlBZ0lDQWdLaTljYmlBZ0lDQm9iMnhrU1hRb2NHeGhlV1Z5S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doZEdocGN5NXBjMGhsYkdRb0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVvWld4a1Fua2dQU0J3YkdGNVpYSTdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbVJwYzNCaGRHTm9SWFpsYm5Rb2JtVjNJRVYyWlc1MEtGd2lkRzl3T21odmJHUXRaR2xsWENJc0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmtaWFJoYVd3NklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdsbE9pQjBhR2x6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiR0Y1WlhKY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1NrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkpjeUIwYUdseklFUnBaU0JpWldsdVp5Qm9aV3hrSUdKNUlHRnVlU0J3YkdGNVpYSS9YRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdENiMjlzWldGdWZTQlVjblZsSUhkb1pXNGdkR2hwY3lCRWFXVWdhWE1nWW1WcGJtY2dhR1ZzWkNCaWVTQmhibmtnY0d4aGVXVnlMQ0JtWVd4elpTQnZkR2hsY25kcGMyVXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2FYTklaV3hrS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JuVnNiQ0FoUFQwZ2RHaHBjeTVvWld4a1FuazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjaUJ5Wld4bFlYTmxjeUIwYUdseklFUnBaUzRnUVNCd2JHRjVaWElnWTJGdUlHOXViSGtnY21Wc1pXRnpaU0JrYVdObElIUm9ZWFFnYzJobElHbHpYRzRnSUNBZ0lDb2dhRzlzWkdsdVp5NWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN2JXOWtkV3hsT2xCc1lYbGxjbjVRYkdGNVpYSjlJSEJzWVhsbGNpQXRJRlJvWlNCd2JHRjVaWElnZDJodklIZGhiblJ6SUhSdklISmxiR1ZoYzJVZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbkpsYkdGelpTMWthV1ZjSWlCM2FYUm9JSEJoY21GdFpYUmxjbk1nZEdocGN5QkVhV1VnWVc1a0lIUm9aU0J3YkdGNVpYSWdjbVZzWldGemFXNW5JR2wwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSEpsYkdWaGMyVkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YVhOSVpXeGtLQ2tnSmlZZ2RHaHBjeTVvWld4a1Fua3VaWEYxWVd4ektIQnNZWGxsY2lrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVhR1ZzWkVKNUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0VoRlRFUmZRbGxmUVZSVVVrbENWVlJGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1EzVnpkRzl0UlhabGJuUW9YQ0owYjNBNmNtVnNaV0Z6WlMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZKbGJtUmxjaUIwYUdseklFUnBaUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdRMkZ1ZG1GelVtVnVaR1Z5YVc1blEyOXVkR1Y0ZERKRWZTQmpiMjUwWlhoMElDMGdWR2hsSUdOaGJuWmhjeUJqYjI1MFpYaDBJSFJ2SUdSeVlYZGNiaUFnSUNBZ0tpQnZibHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmthV1ZUYVhwbElDMGdWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlGdGpiMjl5WkdsdVlYUmxjeUE5SUhSb2FYTXVZMjl2Y21ScGJtRjBaWE5kSUMwZ1ZHaGxJR052YjNKa2FXNWhkR1Z6SUhSdlhHNGdJQ0FnSUNvZ1pISmhkeUIwYUdseklHUnBaUzRnUW5rZ1pHVm1ZWFZzZEN3Z2RHaHBjeUJrYVdVZ2FYTWdaSEpoZDI0Z1lYUWdhWFJ6SUc5M2JpQmpiMjl5WkdsdVlYUmxjeXhjYmlBZ0lDQWdLaUJpZFhRZ2VXOTFJR05oYmlCaGJITnZJR1J5WVhjZ2FYUWdaV3h6Wlhkb1pYSmxJR2xtSUhOdklHNWxaV1JsWkM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0J5Wlc1a1pYSW9ZMjl1ZEdWNGRDd2daR2xsVTJsNlpTd2dZMjl2Y21ScGJtRjBaWE1nUFNCMGFHbHpMbU52YjNKa2FXNWhkR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhOallXeGxJRDBnWkdsbFUybDZaU0F2SUVKQlUwVmZSRWxGWDFOSldrVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTklRVXhHSUQwZ1NFRk1SaUFxSUhOallXeGxPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQlRWRWhKVWtRZ1BTQlVTRWxTUkNBcUlITmpZV3hsTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JUVUVsUVgxTkpXa1VnUFNCUVNWQmZVMGxhUlNBcUlITmpZV3hsTzF4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUh0NExDQjVmU0E5SUdOdmIzSmthVzVoZEdWek8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGFHbHpMbWx6U0dWc1pDZ3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaVzVrWlhKSWIyeGtLR052Ym5SbGVIUXNJSGdzSUhrc0lGTklRVXhHTENCMGFHbHpMbWhsYkdSQ2VTNWpiMnh2Y2lrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb01DQWhQVDBnZEdocGN5NXliM1JoZEdsdmJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1MGNtRnVjMnhoZEdVb2VDQXJJRk5JUVV4R0xDQjVJQ3NnVTBoQlRFWXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1eWIzUmhkR1VvWkdWbk1uSmhaQ2gwYUdsekxuSnZkR0YwYVc5dUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5SeVlXNXpiR0YwWlNndE1TQXFJQ2g0SUNzZ1UwaEJURVlwTENBdE1TQXFJQ2g1SUNzZ1UwaEJURVlwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsYm1SbGNrUnBaU2hqYjI1MFpYaDBMQ0I0TENCNUxDQlRTRUZNUml3Z2RHaHBjeTVqYjJ4dmNpazdYRzVjYmlBZ0lDQWdJQ0FnYzNkcGRHTm9JQ2gwYUdsekxuQnBjSE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyRnpaU0F4T2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJREk2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUF5SUNvZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ016b2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBME9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ01pQXFJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRFU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lBeUlDb2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUU0VGTVJpd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOaGMyVWdOam9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lCVFZFaEpVa1FzSUhrZ0t5QlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOSVFVeEdMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnTWlBcUlGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTlVTRWxTUkN3Z1UxQkpVRjlUU1ZwRktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxjbEJwY0NoamIyNTBaWGgwTENCNElDc2dNaUFxSUZOVVNFbFNSQ3dnZVNBcklGTklRVXhHTENCVFVFbFFYMU5KV2tVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWkdWbVlYVnNkRG9nTHk4Z1RtOGdiM1JvWlhJZ2RtRnNkV1Z6SUdGc2JHOTNaV1FnTHlCd2IzTnphV0pzWlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUTJ4bFlYSWdZMjl1ZEdWNGRGeHVJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuTmxkRlJ5WVc1elptOXliU2d4TENBd0xDQXdMQ0F4TENBd0xDQXdLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNTNhVzVrYjNjdVkzVnpkRzl0Uld4bGJXVnVkSE11WkdWbWFXNWxLRndpZEc5d0xXUnBaVndpTENCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZENrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZHOXdSR2xsU0ZSTlRFVnNaVzFsYm5Rc1hHNGdJQ0FnZFc1cFkyOWtaVlJ2VUdsd2N5eGNiaUFnSUNCd2FYQnpWRzlWYm1samIyUmxYRzU5TzF4dUlpd2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3UkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU2ZTQm1jbTl0SUZ3aUxpOVViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkQzVxYzF3aU8xeHVYRzR2S2lwY2JpQXFJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRDQjBieUJrWlhOamNtbGlaU0IwYUdVZ2NHeGhlV1Z5Y3lCcGJpQjBhR1VnWjJGdFpTNWNiaUFxWEc0Z0tpQkFaWGgwWlc1a2N5QklWRTFNUld4bGJXVnVkRnh1SUNvdlhHNWpiMjV6ZENCVWIzQlFiR0Y1WlhKTWFYTjBTRlJOVEVWc1pXMWxiblFnUFNCamJHRnpjeUJsZUhSbGJtUnpJRWhVVFV4RmJHVnRaVzUwSUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJVYjNCUWJHRjVaWEpNYVhOMFNGUk5URVZzWlcxbGJuUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9LU0I3WEc0Z0lDQWdJQ0FnSUhOMWNHVnlLQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdZMjl1Ym1WamRHVmtRMkZzYkdKaFkyc29LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRDQ5SUhSb2FYTXVjR3hoZVdWeWN5NXNaVzVuZEdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZWEJ3Wlc1a1EyaHBiR1FvUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZV1JrUlhabGJuUk1hWE4wWlc1bGNpaGNJblJ2Y0RwemRHRnlkQzEwZFhKdVhDSXNJQ2hsZG1WdWRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnVDI1c2VTQnZibVVnY0d4aGVXVnlJR05oYmlCb1lYWmxJR0VnZEhWeWJpQmhkQ0JoYm5rZ1oybDJaVzRnZEdsdFpTNWNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjR3hoZVdWeWMxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDNW1hV3gwWlhJb2NDQTlQaUFoY0M1bGNYVmhiSE1vWlhabGJuUXVaR1YwWVdsc0xuQnNZWGxsY2lrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xtWnZja1ZoWTJnb2NDQTlQaUJ3TG1WdVpGUjFjbTRvS1NrN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHUnBjMk52Ym01bFkzUmxaRU5oYkd4aVlXTnJLQ2tnZTF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQndiR0Y1WlhKeklHbHVJSFJvYVhNZ2JHbHpkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdHRiMlIxYkdVNlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUitWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblJiWFgxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2NHeGhlV1Z5Y3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGc3VMaTUwYUdsekxtZGxkRVZzWlcxbGJuUnpRbmxVWVdkT1lXMWxLRndpZEc5d0xYQnNZWGxsY2x3aUtWMDdYRzRnSUNBZ2ZWeHVmVHRjYmx4dWQybHVaRzkzTG1OMWMzUnZiVVZzWlcxbGJuUnpMbVJsWm1sdVpTaGNJblJ2Y0Mxd2JHRjVaWEl0YkdsemRGd2lMQ0JVYjNCUWJHRjVaWEpNYVhOMFNGUk5URVZzWlcxbGJuUXBPMXh1WEc1bGVIQnZjblFnZTF4dUlDQWdJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRGeHVmVHRjYmlJc0lpOHFLbHh1SUNvZ1EyOXdlWEpwWjJoMElDaGpLU0F5TURFNElFaDFkV0lnWkdVZ1FtVmxjbHh1SUNwY2JpQXFJRlJvYVhNZ1ptbHNaU0JwY3lCd1lYSjBJRzltSUhSM1pXNTBlUzF2Ym1VdGNHbHdjeTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWm5KbFpTQnpiMlowZDJGeVpUb2dlVzkxSUdOaGJpQnlaV1JwYzNSeWFXSjFkR1VnYVhRZ1lXNWtMMjl5SUcxdlpHbG1lU0JwZEZ4dUlDb2dkVzVrWlhJZ2RHaGxJSFJsY20xeklHOW1JSFJvWlNCSFRsVWdUR1Z6YzJWeUlFZGxibVZ5WVd3Z1VIVmliR2xqSUV4cFkyVnVjMlVnWVhNZ2NIVmliR2x6YUdWa0lHSjVYRzRnS2lCMGFHVWdSbkpsWlNCVGIyWjBkMkZ5WlNCR2IzVnVaR0YwYVc5dUxDQmxhWFJvWlhJZ2RtVnljMmx2YmlBeklHOW1JSFJvWlNCTWFXTmxibk5sTENCdmNpQW9ZWFFnZVc5MWNseHVJQ29nYjNCMGFXOXVLU0JoYm5rZ2JHRjBaWElnZG1WeWMybHZiaTVjYmlBcVhHNGdLaUJVZDJWdWRIa3RiMjVsTFhCcGNITWdhWE1nWkdsemRISnBZblYwWldRZ2FXNGdkR2hsSUdodmNHVWdkR2hoZENCcGRDQjNhV3hzSUdKbElIVnpaV1oxYkN3Z1luVjBYRzRnS2lCWFNWUklUMVZVSUVGT1dTQlhRVkpTUVU1VVdUc2dkMmwwYUc5MWRDQmxkbVZ1SUhSb1pTQnBiWEJzYVdWa0lIZGhjbkpoYm5SNUlHOW1JRTFGVWtOSVFVNVVRVUpKVEVsVVdWeHVJQ29nYjNJZ1JrbFVUa1ZUVXlCR1QxSWdRU0JRUVZKVVNVTlZURUZTSUZCVlVsQlBVMFV1SUNCVFpXVWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV05jYmlBcUlFeHBZMlZ1YzJVZ1ptOXlJRzF2Y21VZ1pHVjBZV2xzY3k1Y2JpQXFYRzRnS2lCWmIzVWdjMmh2ZFd4a0lHaGhkbVVnY21WalpXbDJaV1FnWVNCamIzQjVJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJWY2JpQXFJR0ZzYjI1bklIZHBkR2dnZEhkbGJuUjVMVzl1WlMxd2FYQnpMaUFnU1dZZ2JtOTBMQ0J6WldVZ1BHaDBkSEE2THk5M2QzY3VaMjUxTG05eVp5OXNhV05sYm5ObGN5OCtMbHh1SUNvdlhHNXBiWEJ2Y25RZ2UxUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwZlNCbWNtOXRJRndpTGk5VWIzQkVhV05sUW05aGNtUklWRTFNUld4bGJXVnVkQzVxYzF3aU8xeHVhVzF3YjNKMElIdFViM0JFYVdWSVZFMU1SV3hsYldWdWRIMGdabkp2YlNCY0lpNHZWRzl3UkdsbFNGUk5URVZzWlcxbGJuUXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUjlJR1p5YjIwZ1hDSXVMMVJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwTG1welhDSTdYRzVwYlhCdmNuUWdlMVJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRIMGdabkp2YlNCY0lpNHZWRzl3VUd4aGVXVnlUR2x6ZEVoVVRVeEZiR1Z0Wlc1MExtcHpYQ0k3WEc1Y2JuZHBibVJ2ZHk1MGQyVnVkSGx2Ym1Wd2FYQnpJRDBnZDJsdVpHOTNMblIzWlc1MGVXOXVaWEJwY0hNZ2ZId2dUMkpxWldOMExtWnlaV1Y2WlNoN1hHNGdJQ0FnVmtWU1UwbFBUam9nWENJd0xqQXVNVndpTEZ4dUlDQWdJRXhKUTBWT1UwVTZJRndpVEVkUVRDMHpMakJjSWl4Y2JpQWdJQ0JYUlVKVFNWUkZPaUJjSW1oMGRIQnpPaTh2ZEhkbGJuUjViMjVsY0dsd2N5NXZjbWRjSWl4Y2JpQWdJQ0JJVkUxTVJXeGxiV1Z1ZEhNNklIdGNiaUFnSUNBZ0lDQWdWRzl3UkdsalpVSnZZWEprU0ZSTlRFVnNaVzFsYm5RNklGUnZjRVJwWTJWQ2IyRnlaRWhVVFV4RmJHVnRaVzUwTEZ4dUlDQWdJQ0FnSUNCVWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZERvZ1ZHOXdSR2xsU0ZSTlRFVnNaVzFsYm5Rc1hHNGdJQ0FnSUNBZ0lGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBPaUJVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEN4Y2JpQWdJQ0FnSUNBZ1ZHOXdVR3hoZVdWeVRHbHpkRWhVVFV4RmJHVnRaVzUwT2lCVWIzQlFiR0Y1WlhKTWFYTjBTRlJOVEVWc1pXMWxiblJjYmlBZ0lDQjlYRzU5S1R0Y2JpSmRMQ0p1WVcxbGN5STZXeUpEVDB4UFVsOUJWRlJTU1VKVlZFVWlMQ0pmWTI5c2IzSWlYU3dpYldGd2NHbHVaM01pT2lKQlFVRkJPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenRCUVRaQ1FTeE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExHTkJRV01zUzBGQlN5eERRVUZET3pzN096czdPenRKUVZFelF5eFhRVUZYTEVOQlFVTXNUMEZCVHl4RlFVRkZPMUZCUTJwQ0xFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0TFFVTnNRanREUVVOS096dEJRM2hEUkRzN096czdPenM3T3pzN096czdPenM3T3p0QlFXMUNRU3hCUVVWQk96czdPMEZCU1VFc1RVRkJUU3h6UWtGQmMwSXNSMEZCUnl4SFFVRkhMRU5CUVVNN08wRkJSVzVETEUxQlFVMHNaVUZCWlN4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTE8wbEJRek5DTEU5QlFVOHNRMEZCUXl4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wTkJRM0pGTEVOQlFVTTdPenRCUVVkR0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRelZDTEUxQlFVMHNTMEZCU3l4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRE5VSXNUVUZCVFN4TFFVRkxMRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0xUWl4TlFVRk5MRkZCUVZFc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF5OUNMRTFCUVUwc1YwRkJWeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZEYkVNc1RVRkJUU3hQUVVGUExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXpzN096czdPenM3T3pzN096czdPenRCUVdkQ09VSXNUVUZCVFN4VlFVRlZMRWRCUVVjc1RVRkJUVHM3T3pzN096dEpRVTl5UWl4WFFVRlhMRU5CUVVNN1VVRkRVaXhMUVVGTE8xRkJRMHdzVFVGQlRUdFJRVU5PTEZWQlFWVTdVVUZEVml4UFFVRlBPMHRCUTFZc1IwRkJSeXhGUVVGRkxFVkJRVVU3VVVGRFNpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU53UWl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjBRaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1FpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXpzN1VVRkZlRUlzU1VGQlNTeERRVUZETEZWQlFWVXNSMEZCUnl4VlFVRlZMRU5CUVVNN1VVRkROMElzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4UFFVRlBMRU5CUVVNN1VVRkRka0lzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1VVRkRia0lzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4TlFVRk5MRU5CUVVNN1MwRkRlRUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNelFqczdTVUZGUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRFZDeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRVQ3hOUVVGTkxFbEJRVWtzYTBKQlFXdENMRU5CUVVNc1EwRkJReXcyUTBGQk5rTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU12Ump0UlFVTkVMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNCQ0xFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdTMEZEYUVRN096czdPenM3TzBsQlVVUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3TzBsQlJVUXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMVlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTFBc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc09FTkJRVGhETEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGFFYzdVVUZEUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzB0QlEyaEVPenM3T3pzN096dEpRVkZFTEVsQlFVa3NiVUpCUVcxQ0xFZEJRVWM3VVVGRGRFSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdTMEZEYkVNN096czdPenM3T3pzN1NVRlZSQ3hKUVVGSkxGVkJRVlVzUjBGQlJ6dFJRVU5pTEU5QlFVOHNWMEZCVnl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU5vUXpzN1NVRkZSQ3hKUVVGSkxGVkJRVlVzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEWkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3V1VGRFVDeE5RVUZOTEVsQlFVa3NhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eHJSRUZCYTBRc1JVRkJSU3hEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTndSenRSUVVORUxFOUJRVThzVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGJrTTdPenM3T3pzN08wbEJVVVFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETjBJN08wbEJSVVFzU1VGQlNTeFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZPMUZCUTFvc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTzFsQlExUXNUVUZCVFN4SlFVRkpMR3RDUVVGclFpeERRVUZETEVOQlFVTXNLME5CUVN0RExFVkJRVVVzUlVGQlJTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRiRWM3VVVGRFJDeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU4yUWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRMmhFT3p0SlFVVkVMRWxCUVVrc1RVRkJUU3hIUVVGSE8xRkJRMVFzVFVGQlRTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU0xUWl4UFFVRlBMRk5CUVZNc1MwRkJTeXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0TFFVTnlRenM3U1VGRlJDeEpRVUZKTEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRWaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFFqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU14UWpzN096czdPenM3U1VGUlJDeEpRVUZKTEV0QlFVc3NSMEZCUnp0UlFVTlNMRTlCUVU4c1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXhRanM3T3pzN096czdTVUZSUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFMUJRVTBzUjBGQlJ5eEhRVUZITEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFZEJRVWNzUjBGQlJ5eGxRVUZsTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdPMUZCUldoRUxFOUJRVThzUTBGQlF5eEhRVUZITEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRja0k3T3pzN096czdPenM3T3p0SlFWbEVMRTFCUVUwc1EwRkJReXhKUVVGSkxFVkJRVVU3VVVGRFZDeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RlFVRkZPMWxCUTNoRExFMUJRVTBzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExIbERRVUY1UXl4RlFVRkZMRWxCUVVrc1EwRkJReXh0UWtGQmJVSXNRMEZCUXl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpGSk96dFJRVVZFTEUxQlFVMHNhVUpCUVdsQ0xFZEJRVWNzUlVGQlJTeERRVUZETzFGQlF6ZENMRTFCUVUwc1dVRkJXU3hIUVVGSExFVkJRVVVzUTBGQlF6czdVVUZGZUVJc1MwRkJTeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVWQlFVVTdXVUZEY0VJc1NVRkJTU3hIUVVGSExFTkJRVU1zWTBGQll5eEZRVUZGTEVsQlFVa3NSMEZCUnl4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk96czdPMmRDUVVsMFF5eHBRa0ZCYVVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdZVUZETDBJc1RVRkJUVHRuUWtGRFNDeFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRekZDTzFOQlEwbzdPMUZCUlVRc1RVRkJUU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVXNTVUZCU1N4RFFVRkRMRzFDUVVGdFFpeERRVUZETEVOQlFVTTdVVUZET1VVc1RVRkJUU3hqUVVGakxFZEJRVWNzU1VGQlNTeERRVUZETEhOQ1FVRnpRaXhEUVVGRExFZEJRVWNzUlVGQlJTeHBRa0ZCYVVJc1EwRkJReXhEUVVGRE96dFJRVVV6UlN4TFFVRkxMRTFCUVUwc1IwRkJSeXhKUVVGSkxGbEJRVmtzUlVGQlJUdFpRVU0xUWl4TlFVRk5MRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdXVUZEZEVVc1RVRkJUU3hWUVVGVkxFZEJRVWNzWTBGQll5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMWxCUXk5RExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE96dFpRVVYwUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF5eHZRa0ZCYjBJc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFpRVU40UkN4SFFVRkhMRU5CUVVNc1VVRkJVU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NjMEpCUVhOQ0xFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdXVUZEZGtZc2FVSkJRV2xDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xTkJReTlDT3p0UlFVVkVMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03TzFGQlJXNURMRTlCUVU4c2FVSkJRV2xDTEVOQlFVTTdTMEZETlVJN096czdPenM3T3pzN08wbEJWMFFzYzBKQlFYTkNMRU5CUVVNc1IwRkJSeXhGUVVGRkxHbENRVUZwUWl4RlFVRkZPMUZCUXpORExFMUJRVTBzVTBGQlV5eEhRVUZITEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkROVUlzU1VGQlNTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJRc1RVRkJUU3hSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXpzN1VVRkZiRVFzVDBGQlR5eFRRVUZUTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hMUVVGTExFZEJRVWNzVVVGQlVTeEZRVUZGTzFsQlF6ZERMRXRCUVVzc1RVRkJUU3hKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRE1VTXNTVUZCU1N4VFFVRlRMRXRCUVVzc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RlFVRkZMR2xDUVVGcFFpeERRVUZETEVWQlFVVTdiMEpCUTJ4RkxGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN2FVSkJRM1pDTzJGQlEwbzdPMWxCUlVRc1MwRkJTeXhGUVVGRkxFTkJRVU03VTBGRFdEczdVVUZGUkN4UFFVRlBMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTTdTMEZEYUVNN096czdPenM3T3pzN096dEpRVmxFTEdGQlFXRXNRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRha0lzVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVONFFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFJRVVUxUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhMUVVGTExFVkJRVVU3V1VGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjZReXhOUVVGTk8xbEJRMGdzUzBGQlN5eEpRVUZKTEVkQlFVY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUlVGQlJTeEhRVUZITEVsQlFVa3NUVUZCVFN4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVWQlFVVTdaMEpCUTJwRkxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUXpsRUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYWtVN08xbEJSVVFzUzBGQlN5eEpRVUZKTEVkQlFVY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVRkZPMmRDUVVOd1JTeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNNVJDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNUVUZCVFN4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTJwRk8xTkJRMG83TzFGQlJVUXNUMEZCVHl4TFFVRkxMRU5CUVVNN1MwRkRhRUk3T3pzN096czdPenM3TzBsQlYwUXNXVUZCV1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hwUWtGQmFVSXNSVUZCUlR0UlFVTnNReXhQUVVGUExGTkJRVk1zUzBGQlN5eHBRa0ZCYVVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRE0wYzdPenM3T3pzN096dEpRVk5FTEdGQlFXRXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRZaXhQUVVGUExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0TFFVTnFSVHM3T3pzN096czdPenRKUVZWRUxHRkJRV0VzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSVHRSUVVOMFFpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlR0WlFVTTVSQ3hQUVVGUExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWRCUVVjc1EwRkJRenRUUVVOcVF6dFJRVU5FTEU5QlFVOHNVMEZCVXl4RFFVRkRPMHRCUTNCQ096czdPenM3T3pzN096dEpRVmRFTEc5Q1FVRnZRaXhEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU53UWl4UFFVRlBMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM0JFT3pzN096czdPenM3T3p0SlFWZEVMRzlDUVVGdlFpeERRVUZETEUxQlFVMHNSVUZCUlR0UlFVTjZRaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjZSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXh0UWtGQmJVSXNSVUZCUlR0WlFVTjRReXhQUVVGUExFTkJRVU1zUTBGQlF6dFRRVU5hTzFGQlEwUXNUMEZCVHl4VFFVRlRMRU5CUVVNN1MwRkRjRUk3T3pzN096czdPenM3T3pzN08wbEJZMFFzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEZGtJc1RVRkJUU3hWUVVGVkxFZEJRVWM3V1VGRFppeEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0WlFVTnFReXhIUVVGSExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dFRRVU53UXl4RFFVRkRPenRSUVVWR0xFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRE9VTXNUVUZCVFN4UFFVRlBMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNMVF5eE5RVUZOTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFOUJRVThzUTBGQlF6dFJRVU40UXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRemRETEUxQlFVMHNVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzVVVGQlVTeERRVUZET3p0UlFVVXhReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETzFsQlEyWXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zVlVGQlZTeERRVUZETzFsQlEycERMRkZCUVZFc1JVRkJSU3hQUVVGUExFZEJRVWNzVVVGQlVUdFRRVU12UWl4RlFVRkZPMWxCUTBNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTTdaMEpCUTJ4Q0xFZEJRVWNzUlVGQlJTeFZRVUZWTEVOQlFVTXNSMEZCUnp0blFrRkRia0lzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRoUVVNeFFpeERRVUZETzFsQlEwWXNVVUZCVVN4RlFVRkZMRkZCUVZFc1IwRkJSeXhSUVVGUk8xTkJRMmhETEVWQlFVVTdXVUZEUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF6dG5Ra0ZEYkVJc1IwRkJSeXhGUVVGRkxGVkJRVlVzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0blFrRkRka0lzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhPMkZCUTNSQ0xFTkJRVU03V1VGRFJpeFJRVUZSTEVWQlFVVXNUMEZCVHl4SFFVRkhMRk5CUVZNN1UwRkRhRU1zUlVGQlJUdFpRVU5ETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8yZENRVU5zUWl4SFFVRkhMRVZCUVVVc1ZVRkJWU3hEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETzJkQ1FVTjJRaXhIUVVGSExFVkJRVVVzVlVGQlZTeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRPMkZCUXpGQ0xFTkJRVU03V1VGRFJpeFJRVUZSTEVWQlFVVXNVVUZCVVN4SFFVRkhMRk5CUVZNN1UwRkRha01zUTBGQlF5eERRVUZET3p0UlFVVklMRTFCUVUwc1RVRkJUU3hIUVVGSExGTkJRVk03TzJGQlJXNUNMRTFCUVUwc1EwRkJReXhEUVVGRExGRkJRVkVzUzBGQlN5eFRRVUZUTEV0QlFVc3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenM3WVVGRk9VTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1VVRkJVU3hMUVVGTE8yZENRVU5zUWl4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFbEJRVWtzUTBGQlF5eHZRa0ZCYjBJc1EwRkJReXhIUVVGSExFTkJRVU1zVjBGQlZ5eERRVUZETEV0QlFVc3NVVUZCVVN4RFFVRkRMRU5CUVVNN2JVSkJRM1JGTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03TzJGQlJYSkVMRTFCUVUwN1owSkJRMGdzUTBGQlF5eEpRVUZKTEVWQlFVVXNVVUZCVVN4TFFVRkxMRkZCUVZFc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4UlFVRlJMRWRCUVVjc1NVRkJTVHRuUWtGRGRrVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1UwRkJVeXhGUVVGRkxGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTXZRaXhEUVVGRE96dFJRVVZPTEU5QlFVOHNVMEZCVXl4TFFVRkxMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRPVVU3T3pzN096czdPenRKUVZORUxFdEJRVXNzUTBGQlF5eExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTjRRaXhMUVVGTExFMUJRVTBzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVU3V1VGREwwSXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNWMEZCVnl4RFFVRkRPenRaUVVVdlFpeE5RVUZOTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFsQlEzcEVMRTFCUVUwc1NVRkJTU3hIUVVGSExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN08xbEJSWHBFTEVsQlFVa3NTVUZCU1N4SlFVRkpMRWxCUVVrc1JVRkJSVHRuUWtGRFpDeFBRVUZQTEVkQlFVY3NRMEZCUXp0aFFVTmtPMU5CUTBvN08xRkJSVVFzVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWmpzN096czdPenM3T3p0SlFWVkVMR05CUVdNc1EwRkJReXhMUVVGTExFVkJRVVVzVFVGQlRTeEZRVUZGTzFGQlF6RkNMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM1JFT3pzN096czdPenM3U1VGVFJDeGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVU3VVVGRGRFSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0TFFVTjZSRHM3T3pzN096czdPMGxCVTBRc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTJ4Q0xFOUJRVTg3V1VGRFNDeEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0WlFVTnFReXhIUVVGSExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dFRRVU53UXl4RFFVRkRPMHRCUTB3N1EwRkRTanM3UVVOd1prUTdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVFclFrRXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eERRVUZETEVsQlFVa3NTMEZCU3p0SlFVTnFReXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTjZReXhQUVVGUExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhYUVVGWExFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdRMEZETVVZc1EwRkJRenM3T3pzN096czdRVUZSUml4TlFVRk5MR3RDUVVGclFpeEhRVUZITEVOQlFVTXNSMEZCUnpzN096czdPenM3T3pzN096dEpRV0V6UWl4alFVRmpMRWRCUVVjc1EwRkJRenM3T3pzN096czdPenM3T3pzN096dFJRV2RDWkN4M1FrRkJkMElzUTBGQlF5eEpRVUZKTEVWQlFVVXNVVUZCVVN4RlFVRkZMRkZCUVZFc1JVRkJSVHM3T3p0WlFVa3ZReXhOUVVGTkxGRkJRVkVzUjBGQlJ5eHJRa0ZCYTBJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU14UXl4SlFVRkpMRWxCUVVrc1EwRkJReXhUUVVGVExFbEJRVWtzVVVGQlVTeExRVUZMTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTzJkQ1FVTndSQ3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU16UXp0VFFVTktPMHRCUTBvN08wRkRhRVpNT3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJjMEpCTEVGQlIwRTdRVUZEUVN4TlFVRk5MR1ZCUVdVc1IwRkJSeXhQUVVGUExFTkJRVU03UVVGRGFFTXNUVUZCVFN4alFVRmpMRWRCUVVjc1RVRkJUU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNaVUZCWlN4SFFVRkhMRTlCUVU4c1EwRkJRenRCUVVOb1F5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUTBGQlF6czdPMEZCUjNSRExFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROMElzVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNMVFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMHNVVUZCVVN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03T3pzN096czdPenM3T3pzN096czdPenM3TzBGQmIwSXZRaXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMR05CUVdNc2EwSkJRV3RDTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNN096czdPenM3T3pzN096czdTVUZoZGtVc1YwRkJWeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1QwRkJUeXhEUVVGRExFVkJRVVU3VVVGRGRrTXNTMEZCU3l4RlFVRkZMRU5CUVVNN08xRkJSVklzU1VGQlNTeExRVUZMTEVsQlFVa3NSVUZCUlN4TFFVRkxMRXRCUVVzc1JVRkJSVHRaUVVOMlFpeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU40UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1UwRkRiRVFzVFVGQlRTeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hEUVVGRExFbEJRVWtzUlVGQlJTeExRVUZMTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1pVRkJaU3hEUVVGRExFVkJRVVU3V1VGRGVFWXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRM2hFTEUxQlFVMDdXVUZEU0N4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNORU5CUVRSRExFTkJRVU1zUTBGQlF6dFRRVU01UlRzN1VVRkZSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeEZRVUZGTEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTNKQ0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM1JDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTm9SQ3hOUVVGTkxFbEJRVWtzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRU5CUVVNc1JVRkJSVHRaUVVOMFJpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRkRVFzVFVGQlRUdFpRVU5JTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5d3lRMEZCTWtNc1EwRkJReXhEUVVGRE8xTkJRemRGT3p0UlFVVkVMRWxCUVVrc1MwRkJTeXhGUVVGRk8xbEJRMUFzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMU5CUTJ4RUxFMUJRVTBzU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhKUVVGSkxFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSVHRaUVVNM1J5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzUkZMRTFCUVUwN08xbEJSVWdzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03VTBGRE1VSTdPMUZCUlVRc1NVRkJTU3hKUVVGSkxFdEJRVXNzVDBGQlR5eEZRVUZGTzFsQlEyeENMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMWxCUXpWQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdVMEZEYkVRc1RVRkJUU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUlVGQlJUdFpRVU01UXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTTFRaXhOUVVGTk96dFpRVVZJTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFOQlF6VkNPMHRCUTBvN08wbEJSVVFzVjBGQlZ5eHJRa0ZCYTBJc1IwRkJSenRSUVVNMVFpeFBRVUZQTzFsQlEwZ3NaVUZCWlR0WlFVTm1MR05CUVdNN1dVRkRaQ3hsUVVGbE8xbEJRMllzYTBKQlFXdENPMU5CUTNKQ0xFTkJRVU03UzBGRFREczdTVUZGUkN4cFFrRkJhVUlzUjBGQlJ6dExRVU51UWpzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0TFFVTjBRanM3T3pzN096dEpRVTlFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpOQ096czdPenM3TzBsQlQwUXNTVUZCU1N4SlFVRkpMRWRCUVVjN1VVRkRVQ3hQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVThzU1VGQlNTeExRVUZMTEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wUTdTVUZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhSUVVGUkxFVkJRVVU3VVVGRGFFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hKUVVGSkxFdEJRVXNzVVVGQlVTeEZRVUZGTzFsQlEyNUNMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTTdVMEZEZWtNc1RVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xTkJRMmhFTzB0QlEwbzdPenM3TzBsQlMwUXNVMEZCVXl4SFFVRkhPMUZCUTFJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTzFsQlEyeENMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zWVVGQllTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMR2RDUVVGblFpeEZRVUZGTzJkQ1FVTTFSQ3hOUVVGTkxFVkJRVVU3YjBKQlEwb3NUVUZCVFN4RlFVRkZMRWxCUVVrN2FVSkJRMlk3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMUZCUTBRc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRla0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4clFrRkJhMElzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXZRenM3T3pzN1NVRkxSQ3hQUVVGUExFZEJRVWM3VVVGRFRpeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU42UWl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1MwRkROVU03T3pzN096czdTVUZQUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzU1VGQlNTeExRVUZMTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGRFTTdPenM3T3pzN1NVRlBSQ3hSUVVGUkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU42UWpzN096czdPenM3TzBsQlUwUXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOV0xFMUJRVTBzU1VGQlNTeEhRVUZITEZGQlFWRXNTMEZCU3l4UFFVRlBMRXRCUVVzc1IwRkJSeXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXp0UlFVTTFSQ3hQUVVGUExFdEJRVXNzUzBGQlN5eEpRVUZKTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03UzBGREwwTTdRMEZEU2l4RFFVRkRPenRCUVVWR0xFMUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVTXNUVUZCVFN4RFFVRkRMRmxCUVZrc1JVRkJSU3h2UWtGQmIwSXNRMEZCUXl4RFFVRkRPenM3T3pzN096czdRVUZUYWtVc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl4SlFVRkpMRzlDUVVGdlFpeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTTdPMEZETDA1cVJqczdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ2UWtFc1FVRkhRVHM3T3p0QlFVbEJMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NSMEZCUnl4RFFVRkRPMEZCUXpkQ0xFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRMnhETEUxQlFVMHNPRUpCUVRoQ0xFZEJRVWNzUzBGQlN5eERRVUZETzBGQlF6ZERMRTFCUVUwc05rSkJRVFpDTEVkQlFVY3NTMEZCU3l4RFFVRkRPMEZCUXpWRExFMUJRVTBzT0VKQlFUaENMRWRCUVVjc1MwRkJTeXhEUVVGRE96dEJRVVUzUXl4TlFVRk5MRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03UVVGRGFFSXNUVUZCVFN4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE96dEJRVVZvUWl4TlFVRk5MR0ZCUVdFc1IwRkJSeXhKUVVGSkxFZEJRVWNzWjBKQlFXZENMRU5CUVVNN1FVRkRPVU1zVFVGQlRTeGpRVUZqTEVkQlFVY3NTVUZCU1N4SFFVRkhMR2RDUVVGblFpeERRVUZETzBGQlF5OURMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdPMEZCUldoRUxFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXpzN1FVRkZjRUlzVFVGQlRTeGxRVUZsTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTJoRExFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1VVRkJVU3hEUVVGRE8wRkJRMnhETEUxQlFVMHNiMEpCUVc5Q0xFZEJRVWNzV1VGQldTeERRVUZETzBGQlF6RkRMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NWVUZCVlN4RFFVRkRPMEZCUTNSRExFMUJRVTBzWjBOQlFXZERMRWRCUVVjc2QwSkJRWGRDTEVOQlFVTTdRVUZEYkVVc1RVRkJUU3dyUWtGQkswSXNSMEZCUnl4MVFrRkJkVUlzUTBGQlF6dEJRVU5vUlN4TlFVRk5MR2REUVVGblF5eEhRVUZITEhkQ1FVRjNRaXhEUVVGRE8wRkJRMnhGTEUxQlFVMHNkVUpCUVhWQ0xFZEJRVWNzWlVGQlpTeERRVUZET3pzN1FVRkhhRVFzVFVGQlRTeFhRVUZYTEVkQlFVY3NRMEZCUXl4WlFVRlpMRVZCUVVVc1lVRkJZU3hIUVVGSExFTkJRVU1zUzBGQlN6dEpRVU55UkN4TlFVRk5MRTFCUVUwc1IwRkJSeXhSUVVGUkxFTkJRVU1zV1VGQldTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUXpGRExFOUJRVThzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhoUVVGaExFZEJRVWNzVFVGQlRTeERRVUZETzBOQlEzaEVMRU5CUVVNN08wRkJSVVlzVFVGQlRTeHpRa0ZCYzBJc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeFRRVUZUTEVkQlFVY3NVVUZCVVN4TFFVRkxPMGxCUXpkRUxFOUJRVThzUTBGQlF5eEpRVUZKTEUxQlFVMHNTVUZCU1N4TlFVRk5MRWRCUVVjc1UwRkJVeXhEUVVGRE8wTkJRelZETEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hwUWtGQmFVSXNSMEZCUnl4RFFVRkRMRmxCUVZrc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRGRFUXNUVUZCVFN4TFFVRkxMRWRCUVVjc1YwRkJWeXhEUVVGRExGbEJRVmtzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXp0SlFVTjBSQ3hQUVVGUExITkNRVUZ6UWl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFdEJRVXNzUjBGQlJ5eFpRVUZaTEVOQlFVTTdRMEZETDBRc1EwRkJRenM3UVVGRlJpeE5RVUZOTERCQ1FVRXdRaXhIUVVGSExFTkJRVU1zVDBGQlR5eEZRVUZGTEVsQlFVa3NSVUZCUlN4WlFVRlpMRXRCUVVzN1NVRkRhRVVzU1VGQlNTeFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRk8xRkJRelZDTEUxQlFVMHNWMEZCVnl4SFFVRkhMRTlCUVU4c1EwRkJReXhaUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETDBNc1QwRkJUeXhwUWtGQmFVSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGRrUTdTVUZEUkN4UFFVRlBMRmxCUVZrc1EwRkJRenREUVVOMlFpeERRVUZET3p0QlFVVkdMRTFCUVUwc1ZVRkJWU3hIUVVGSExFTkJRVU1zWVVGQllTeEZRVUZGTEZOQlFWTXNSVUZCUlN4WlFVRlpMRXRCUVVzN1NVRkRNMFFzU1VGQlNTeFRRVUZUTEV0QlFVc3NZVUZCWVN4SlFVRkpMRTFCUVUwc1MwRkJTeXhoUVVGaExFVkJRVVU3VVVGRGVrUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1MwRkRaaXhOUVVGTkxFbEJRVWtzVDBGQlR5eExRVUZMTEdGQlFXRXNSVUZCUlR0UlFVTnNReXhQUVVGUExFdEJRVXNzUTBGQlF6dExRVU5vUWl4TlFVRk5PMUZCUTBnc1QwRkJUeXhaUVVGWkxFTkJRVU03UzBGRGRrSTdRMEZEU2l4RFFVRkRPenRCUVVWR0xFMUJRVTBzYlVKQlFXMUNMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeEZRVUZGTEZsQlFWa3NTMEZCU3p0SlFVTjZSQ3hKUVVGSkxFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1VVRkROVUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NUMEZCVHl4RFFVRkRMRmxCUVZrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU12UXl4UFFVRlBMRlZCUVZVc1EwRkJReXhYUVVGWExFVkJRVVVzUTBGQlF5eFhRVUZYTEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1EwRkJReXhQUVVGUExFTkJRVU1zUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXp0TFFVTnNSanM3U1VGRlJDeFBRVUZQTEZsQlFWa3NRMEZCUXp0RFFVTjJRaXhEUVVGRE96czdRVUZIUml4TlFVRk5MRTlCUVU4c1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6bENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hqUVVGakxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTnlReXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03TzBGQlJYcERMRTFCUVUwc1QwRkJUeXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPenRCUVVVdlJDeE5RVUZOTEZsQlFWa3NSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTenRKUVVNMVFpeEpRVUZKTEZOQlFWTXNTMEZCU3l4clFrRkJhMElzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVN1VVRkROME1zYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTndRenM3U1VGRlJDeFBRVUZQTEd0Q1FVRnJRaXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0RFFVTjRReXhEUVVGRE96dEJRVVZHTEUxQlFVMHNaVUZCWlN4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFMUJRVTBzUzBGQlN6dEpRVU4yUXl4clFrRkJhMElzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXp0RFFVTXZSQ3hEUVVGRE96dEJRVVZHTEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTExGbEJRVmtzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6czdRVUZGY2tVc1RVRkJUU3hYUVVGWExFZEJRVWNzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFdEJRVXM3U1VGRE9VTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVU3VVVGRGFFSXNUMEZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPenRSUVVVeFJDeExRVUZMTEUxQlFVMHNSMEZCUnl4SlFVRkpMRWxCUVVrc1JVRkJSVHRaUVVOd1FpeEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkROME03UzBGRFNqdERRVU5LTEVOQlFVTTdPenM3UVVGSlJpeE5RVUZOTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNRMEZCUXp0QlFVTjBReXhOUVVGTkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1FVRkROVUlzVFVGQlRTeEpRVUZKTEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wRkJRelZDTEUxQlFVMHNXVUZCV1N4SFFVRkhMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF6dEJRVU0xUXl4TlFVRk5MRkZCUVZFc1IwRkJSeXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdPenRCUVVkd1F5eE5RVUZOTEdkRFFVRm5ReXhIUVVGSExFTkJRVU1zVFVGQlRTeEZRVUZGTEU5QlFVOHNSVUZCUlN4UFFVRlBMRXRCUVVzN1NVRkRia1VzVFVGQlRTeFRRVUZUTEVkQlFVY3NUVUZCVFN4RFFVRkRMSEZDUVVGeFFpeEZRVUZGTEVOQlFVTTdPMGxCUldwRUxFMUJRVTBzUTBGQlF5eEhRVUZITEU5QlFVOHNSMEZCUnl4VFFVRlRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFMUJRVTBzUTBGQlF5eExRVUZMTEVkQlFVY3NVMEZCVXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wbEJRM1JGTEUxQlFVMHNRMEZCUXl4SFFVRkhMRTlCUVU4c1IwRkJSeXhUUVVGVExFTkJRVU1zUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1UwRkJVeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZET3p0SlFVVjJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPME5CUTJwQ0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4blFrRkJaMElzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0SlFVTm9ReXhOUVVGTkxFMUJRVTBzUjBGQlJ5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE96czdTVUZIYkVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyaENMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU5xUWl4SlFVRkpMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU03U1VGRGRrSXNTVUZCU1N4alFVRmpMRWRCUVVjc1NVRkJTU3hEUVVGRE8wbEJRekZDTEVsQlFVa3NWMEZCVnl4SFFVRkhMRWxCUVVrc1EwRkJRenM3U1VGRmRrSXNUVUZCVFN4UFFVRlBMRWRCUVVjc1RVRkJUVHRSUVVOc1FpeEpRVUZKTEVsQlFVa3NTMEZCU3l4TFFVRkxMRWxCUVVrc1dVRkJXU3hMUVVGTExFdEJRVXNzUlVGQlJUczdXVUZGTVVNc1RVRkJUU3hsUVVGbExFZEJRVWNzUzBGQlN5eERRVUZETEdGQlFXRXNRMEZCUXl4elEwRkJjME1zUTBGQlF5eERRVUZETzFsQlEzQkdMRWxCUVVrc1kwRkJZeXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzJkQ1FVTjZRaXhqUVVGakxFTkJRVU1zVTBGQlV5eERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMkZCUXpkRExFMUJRVTA3WjBKQlEwZ3NZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF6dGhRVU14UXp0WlFVTkVMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03TzFsQlJXSXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRM1JDT3p0UlFVVkVMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRGRFSXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGbEJRVmtzUjBGQlJ5eE5RVUZOTzFGQlEzWkNMRmRCUVZjc1IwRkJSeXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEU5QlFVOHNSVUZCUlN4TFFVRkxMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGFFVXNRMEZCUXpzN1NVRkZSaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eE5RVUZOTzFGQlEzUkNMRTFCUVUwc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdVVUZEYWtNc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dExRVU4wUWl4RFFVRkRPenRKUVVWR0xFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGRGFFTXNTVUZCU1N4SlFVRkpMRXRCUVVzc1MwRkJTeXhGUVVGRk96dFpRVVZvUWl4TlFVRk5MRWRCUVVjN1owSkJRMHdzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBPMmRDUVVOb1FpeERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4N1lVRkRia0lzUTBGQlF6czdXVUZGUml4alFVRmpMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNaME5CUVdkRExFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdPMWxCUlRWSExFbEJRVWtzU1VGQlNTeExRVUZMTEdOQlFXTXNSVUZCUlRzN1owSkJSWHBDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2JVSkJRVzFDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc2IwSkJRVzlDTEVWQlFVVTdiMEpCUXpORUxFdEJRVXNzUjBGQlJ5eFpRVUZaTEVOQlFVTTdiMEpCUTNKQ0xGbEJRVmtzUlVGQlJTeERRVUZETzJsQ1FVTnNRaXhOUVVGTkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3YjBKQlEyNURMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03YjBKQlEySXNXVUZCV1N4RlFVRkZMRU5CUVVNN2FVSkJRMnhDTEUxQlFVMHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0dlFrRkRjRU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0cFFrRkRhRUk3WVVGRFNqczdVMEZGU2p0TFFVTktMRU5CUVVNN08wbEJSVVlzVFVGQlRTeGxRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRXRCUVVzN1VVRkRMMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zWjBOQlFXZERMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFZ3NTVUZCU1N4UlFVRlJMRXRCUVVzc1MwRkJTeXhGUVVGRk8xbEJRM0JDTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExGVkJRVlVzUTBGQlF6dFRRVU53UXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hMUVVGTExHTkJRV01zUlVGQlJUdFpRVU5vUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTTdVMEZEYUVNc1RVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRk5CUVZNc1EwRkJRenRUUVVOdVF6dExRVU5LTEVOQlFVTTdPMGxCUlVZc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdVVUZEY0VJc1NVRkJTU3hKUVVGSkxFdEJRVXNzUzBGQlN5eEpRVUZKTEZsQlFWa3NTMEZCU3l4TFFVRkxMRVZCUVVVN096dFpRVWN4UXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdPMWxCUlRsRExFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU5zUXl4TFFVRkxMRWRCUVVjc1VVRkJVU3hEUVVGRE8yZENRVU5xUWl4WFFVRlhMRVZCUVVVc1EwRkJRenM3WjBKQlJXUXNUVUZCVFN4NVFrRkJlVUlzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eExRVUZMTEdOQlFXTXNRMEZCUXl4RFFVRkRPMmRDUVVOdVJpeFhRVUZYTEVOQlFVTXNTMEZCU3l4RlFVRkZMSGxDUVVGNVFpeERRVUZETEVOQlFVTTdaMEpCUXpsRExGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdZVUZEYUVZN1UwRkRTaXhOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTXpRaXhOUVVGTkxFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGNFTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPenRaUVVWd1F5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eFhRVUZYTEVOQlFVTTdPMWxCUlRGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMmhHTzB0QlEwb3NRMEZCUXpzN1NVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3p0UlFVTXZRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eGpRVUZqTEVsQlFVa3NVVUZCVVN4TFFVRkxMRXRCUVVzc1JVRkJSVHRaUVVNdlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTTdXVUZEY0VNc1RVRkJUU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRE96dFpRVVZ3UXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4WFFVRlhMRU5CUVVNN08xbEJSVEZETEUxQlFVMHNXVUZCV1N4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzJkQ1FVTnlReXhIUVVGSExFVkJRVVVzWTBGQll6dG5Ra0ZEYmtJc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTzJkQ1FVTlVMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJUdGhRVU5hTEVOQlFVTXNRMEZCUXpzN1dVRkZTQ3hOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NXVUZCV1N4SFFVRkhMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXpzN1dVRkZMMFFzWTBGQll5eERRVUZETEZkQlFWY3NSMEZCUnl4VFFVRlRMRU5CUVVNN1UwRkRNVU03T3p0UlFVZEVMR05CUVdNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGRFSXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenM3TzFGQlIySXNWMEZCVnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8wdEJRM1JDTEVOQlFVTTdPenM3T3pzN08wbEJVVVlzU1VGQlNTeG5Ra0ZCWjBJc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEUxQlFVMHNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eGpRVUZqTEV0QlFVczdVVUZEZWtNc1QwRkJUeXhEUVVGRExGVkJRVlVzUzBGQlN6dFpRVU51UWl4SlFVRkpMRlZCUVZVc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TlFVRk5MRVZCUVVVN1owSkJRemRETEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhEUVVGRExFZEJRVWNzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFrUXNaMEpCUVdkQ0xFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1lVRkRla003V1VGRFJDeE5RVUZOTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1ZVRkJWU3hEUVVGRExHTkJRV01zUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE1VVXNRMEZCUXp0TFFVTk1MRU5CUVVNN08wbEJSVVlzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGbEJRVmtzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzSkZMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1owSkJRV2RDTEVOQlFVTXNRMEZCUXpzN1NVRkZka1FzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4dlFrRkJiMElzUlVGQlJUdFJRVU0zUWl4TlFVRk5MRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNWMEZCVnl4RlFVRkZMR2RDUVVGblFpeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRVVzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTTVRenM3U1VGRlJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzlDUVVGdlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRzFDUVVGdFFpeEZRVUZGTzFGQlF6TkVMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1pVRkJaU3hEUVVGRExFTkJRVU03UzBGRGVrUTdPMGxCUlVRc1RVRkJUU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSU3huUWtGQlowSXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnBGTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFRRVUZUTEVWQlFVVXNaVUZCWlN4RFFVRkRMRU5CUVVNN1NVRkRjRVFzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUlVGQlJTeGxRVUZsTEVOQlFVTXNRMEZCUXp0RFFVTjRSQ3hEUVVGRE96czdPenM3T3p0QlFWRkdMRTFCUVUwc2RVSkJRWFZDTEVkQlFVY3NZMEZCWXl4WFFVRlhMRU5CUVVNN096czdPMGxCUzNSRUxGZEJRVmNzUjBGQlJ6dFJRVU5XTEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUTFJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFBRVUZQTEVkQlFVY3NZMEZCWXl4RFFVRkRPMUZCUTNCRExFMUJRVTBzVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hOUVVGTkxFMUJRVTBzUjBGQlJ5eFJRVUZSTEVOQlFVTXNZVUZCWVN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMmhFTEUxQlFVMHNRMEZCUXl4WFFVRlhMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03TzFGQlJUTkNMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUXpGQ0xHTkJRV01zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMSEZDUVVGeFFpeERRVUZETEVOQlFVTTdVVUZEYUVRc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4VlFVRlZMRU5CUVVNN1dVRkROMElzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxPMWxCUTJwQ0xFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFR0WlFVTnVRaXhQUVVGUExFVkJRVVVzU1VGQlNTeERRVUZETEU5QlFVODdXVUZEY2tJc1ZVRkJWU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFZRVUZWTzFOQlF6bENMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMG9zWjBKQlFXZENMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE1VSTdPMGxCUlVRc1YwRkJWeXhyUWtGQmEwSXNSMEZCUnp0UlFVTTFRaXhQUVVGUE8xbEJRMGdzWlVGQlpUdFpRVU5tTEdkQ1FVRm5RanRaUVVOb1FpeHZRa0ZCYjBJN1dVRkRjRUlzYTBKQlFXdENPMWxCUTJ4Q0xHZERRVUZuUXp0WlFVTm9ReXhuUTBGQlowTTdXVUZEYUVNc0swSkJRU3RDTzFsQlF5OUNMSFZDUVVGMVFqdFRRVU14UWl4RFFVRkRPMHRCUTB3N08wbEJSVVFzZDBKQlFYZENMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUlVGQlJTeFJRVUZSTEVWQlFVVTdVVUZETDBNc1RVRkJUU3hOUVVGTkxFZEJRVWNzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOcVF5eFJRVUZSTEVsQlFVazdVVUZEV2l4TFFVRkxMR1ZCUVdVc1JVRkJSVHRaUVVOc1FpeE5RVUZOTEV0QlFVc3NSMEZCUnl4cFFrRkJhVUlzUTBGQlF5eFJRVUZSTEVWQlFVVXNWMEZCVnl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxHRkJRV0VzUTBGQlF5eERRVUZETzFsQlEyeEdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0WlFVTXhRaXhOUVVGTkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVNMVF5eE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMR2RDUVVGblFpeEZRVUZGTzFsQlEyNUNMRTFCUVUwc1RVRkJUU3hIUVVGSExHbENRVUZwUWl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNN1dVRkRjRVlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRelZDTEUxQlFVMHNRMEZCUXl4WlFVRlpMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRPVU1zVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4dlFrRkJiMElzUlVGQlJUdFpRVU4yUWl4TlFVRk5MRlZCUVZVc1IwRkJSeXhwUWtGQmFVSXNRMEZCUXl4UlFVRlJMRVZCUVVVc1YwRkJWeXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03V1VGRE5VWXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFZEJRVWNzVlVGQlZTeERRVUZETzFsQlEzQkRMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzYTBKQlFXdENMRVZCUVVVN1dVRkRja0lzVFVGQlRTeFBRVUZQTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVU1zVVVGQlVTeEZRVUZGTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4RFFVRkRPMWxCUTNaR0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJRenRaUVVNNVFpeE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMR2REUVVGblF5eEZRVUZGTzFsQlEyNURMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NWVUZCVlN4RFFVRkRMRkZCUVZFc1JVRkJSU3huUTBGQlowTXNSVUZCUlN4VlFVRlZMRU5CUVVNc1VVRkJVU3hGUVVGRkxHZERRVUZuUXl4RlFVRkZMRGhDUVVFNFFpeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjRTeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMR2RDUVVGblFpeERRVUZETzFsQlEzWkRMRTFCUVUwN1UwRkRWRHRSUVVORUxGTkJRVk1zUVVGRlVqdFRRVU5CT3p0UlFVVkVMRmRCUVZjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU55UWpzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1pVRkJaU3hGUVVGRkxFMUJRVTA3V1VGRGVrTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU42UWl4SlFVRkpMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdG5Ra0ZEWml4WFFVRlhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzQkVPMU5CUTBvc1EwRkJReXhEUVVGRE96dFJRVVZJTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSU3hOUVVGTk8xbEJRek5ETEZkQlFWY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFrUXNaVUZCWlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6ZENMRU5CUVVNc1EwRkJRenM3T3p0UlFVbElMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUlVGQlJUdFpRVU5vUkN4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExGRkJRVkVzUTBGQlF5eGhRVUZoTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUVPMHRCUTBvN08wbEJSVVFzYjBKQlFXOUNMRWRCUVVjN1MwRkRkRUk3TzBsQlJVUXNaVUZCWlN4SFFVRkhPMHRCUTJwQ096czdPenM3TzBsQlQwUXNTVUZCU1N4TlFVRk5MRWRCUVVjN1VVRkRWQ3hQUVVGUExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkROVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hKUVVGSkxFZEJRVWM3VVVGRFVDeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOd1JEczdPenM3T3p0SlFVOUVMRWxCUVVrc2JVSkJRVzFDTEVkQlFVYzdVVUZEZEVJc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEcxQ1FVRnRRaXhEUVVGRE8wdEJRekZET3pzN096czdPMGxCVDBRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTERCQ1FVRXdRaXhEUVVGRExFbEJRVWtzUlVGQlJTeGxRVUZsTEVWQlFVVXNZVUZCWVN4RFFVRkRMRU5CUVVNN1MwRkRNMFU3T3pzN096dEpRVTFFTEVsQlFVa3NUVUZCVFN4SFFVRkhPMUZCUTFRc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owSkJRV2RDTEVWQlFVVXNZMEZCWXl4RFFVRkRMRU5CUVVNN1MwRkROMFU3T3pzN096dEpRVTFFTEVsQlFVa3NWVUZCVlN4SFFVRkhPMUZCUTJJc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc2IwSkJRVzlDTEVWQlFVVXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dExRVU55UmpzN096czdPenRKUVU5RUxFbEJRVWtzVDBGQlR5eEhRVUZITzFGQlExWXNUMEZCVHl3d1FrRkJNRUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNhMEpCUVd0Q0xFVkJRVVVzWjBKQlFXZENMRU5CUVVNc1EwRkJRenRMUVVOcVJqczdPenM3TzBsQlRVUXNTVUZCU1N4dlFrRkJiMElzUjBGQlJ6dFJRVU4yUWl4UFFVRlBMRzFDUVVGdFFpeERRVUZETEVsQlFVa3NSVUZCUlN4blEwRkJaME1zUlVGQlJTdzRRa0ZCT0VJc1EwRkJReXhEUVVGRE8wdEJRM1JIT3pzN096czdTVUZOUkN4SlFVRkpMRzFDUVVGdFFpeEhRVUZITzFGQlEzUkNMRTlCUVU4c2JVSkJRVzFDTEVOQlFVTXNTVUZCU1N4RlFVRkZMQ3RDUVVFclFpeEZRVUZGTERaQ1FVRTJRaXhEUVVGRExFTkJRVU03UzBGRGNFYzdPenM3T3p0SlFVMUVMRWxCUVVrc2IwSkJRVzlDTEVkQlFVYzdVVUZEZGtJc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1owTkJRV2RETEVWQlFVVXNPRUpCUVRoQ0xFTkJRVU1zUTBGQlF6dExRVU4wUnpzN096czdPenM3TzBsQlUwUXNTVUZCU1N4WlFVRlpMRWRCUVVjN1VVRkRaaXhQUVVGUExEQkNRVUV3UWl4RFFVRkRMRWxCUVVrc1JVRkJSU3gxUWtGQmRVSXNSVUZCUlN4eFFrRkJjVUlzUTBGQlF5eERRVUZETzB0QlF6TkdPenM3T3pzN08wbEJUMFFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU03UzBGRGVFUTdPenM3T3pzN096czdTVUZWUkN4VFFVRlRMRU5CUVVNc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZPMUZCUTNSRExFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1JVRkJSVHRaUVVNelFpeE5RVUZOTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1UwRkRkRUk3VVVGRFJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRlRU1zVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOcVJDeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1MwRkRjRUk3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxIVkNRVUYxUWl4RFFVRkRMRU5CUVVNN08wRkRjR2hDZUVVN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRWEZDUVN4QlFVVkJPenM3UVVGSFFTeE5RVUZOTEdOQlFXTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRNMElzVFVGQlRTeGpRVUZqTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUTNwQ0xFMUJRVTBzWVVGQllTeEhRVUZITEU5QlFVOHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEY0VJc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETzBGQlEzQkNMRTFCUVUwc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXpOQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEVkQlFVY3NRMEZCUXpzN1FVRkZOVUlzVFVGQlRVRXNhVUpCUVdVc1IwRkJSeXhQUVVGUExFTkJRVU03UVVGRGFFTXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eFRRVUZUTEVOQlFVTTdRVUZEY0VNc1RVRkJUU3hqUVVGakxFZEJRVWNzVFVGQlRTeERRVUZETzBGQlF6bENMRTFCUVUwc2EwSkJRV3RDTEVkQlFVY3NWVUZCVlN4RFFVRkRPMEZCUTNSRExFMUJRVTBzVjBGQlZ5eEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTjRRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eEhRVUZITEVOQlFVTTdPMEZCUlhoQ0xFMUJRVTBzWVVGQllTeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTXhRaXhOUVVGTkxEQkNRVUV3UWl4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOMFF5eE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU01UWl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTXpRaXhOUVVGTkxFbEJRVWtzUjBGQlJ5eGhRVUZoTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUXk5Q0xFMUJRVTBzUzBGQlN5eEhRVUZITEdGQlFXRXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SFFVRkhMRVZCUVVVc1EwRkJRenRCUVVOd1F5eE5RVUZOTEZOQlFWTXNSMEZCUnl4UFFVRlBMRU5CUVVNN08wRkJSVEZDTEUxQlFVMHNUMEZCVHl4SFFVRkhMRU5CUVVNc1IwRkJSeXhMUVVGTE8wbEJRM0pDTEU5QlFVOHNSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdRMEZEYUVNc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZkQlFWY3NSMEZCUnl4RFFVRkRMRWxCUVVrN1NVRkRja0lzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU12UWl4UFFVRlBMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hOUVVGTkxFbEJRVWtzWTBGQll5eERRVUZETzBOQlF6bEZMRU5CUVVNN096czdPenM3UVVGUFJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4TlFVRk5MRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMR05CUVdNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6czdRVUZGZUVVc1RVRkJUU3h6UWtGQmMwSXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYcEVMRUZCWVVFN096czdPenM3T3p0QlFWTkJMRTFCUVUwc1lVRkJZU3hIUVVGSExFTkJRVU1zU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc2MwSkJRWE5DTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF6czdRVUZGZEVZc1RVRkJUU3hWUVVGVkxFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUzBGQlN5eExRVUZMTzBsQlEyaEVMRTFCUVUwc1UwRkJVeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZETjBJc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRmRCUVZjc1IwRkJSeXhsUVVGbExFTkJRVU03U1VGRGRFTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8wbEJRM0JDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8wbEJRekZDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRXRCUVVzc1IwRkJSeXhUUVVGVExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBsQlF6VkZMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVOHNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenREUVVOeVFpeERRVUZET3p0QlFVVkdMRTFCUVUwc1UwRkJVeXhIUVVGSExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFdEJRVXNzUzBGQlN6dEpRVU12UXl4TlFVRk5MRXRCUVVzc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTTdTVUZETjBJc1RVRkJUU3hsUVVGbExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeEVMRTFCUVUwc1ZVRkJWU3hIUVVGSExFTkJRVU1zUjBGQlJ5eGxRVUZsTEVOQlFVTTdTVUZEZGtNc1RVRkJUU3h4UWtGQmNVSXNSMEZCUnl3d1FrRkJNRUlzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEYWtVc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTJ4RkxFMUJRVTBzV1VGQldTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNhVUpCUVdsQ0xFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTTdPMGxCUlRORkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hIUVVGSExIRkNRVUZ4UWl4RFFVRkRPMGxCUTI1RkxFMUJRVTBzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1pVRkJaU3hEUVVGRE96dEpRVVV6UXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRNVUlzVDBGQlR5eERRVUZETEZkQlFWY3NSMEZCUnl4UFFVRlBMRU5CUVVNN1NVRkRPVUlzVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4WlFVRlpMRU5CUVVNN1NVRkRha01zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGREwwSXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGRGNFUXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFZEJRVWNzYTBKQlFXdENMRVZCUVVVc1RVRkJUU3hIUVVGSExIRkNRVUZ4UWl4RlFVRkZMSEZDUVVGeFFpeEZRVUZGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTXhTQ3hQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3hOUVVGTkxFZEJRVWNzYTBKQlFXdENMRWRCUVVjc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0SlFVTjZTQ3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4clFrRkJhMElzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpsSkxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1IwRkJSeXhWUVVGVkxFTkJRVU1zUTBGQlF6dEpRVU0xUXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVkQlFVY3NhMEpCUVd0Q0xFZEJRVWNzY1VKQlFYRkNMRVZCUVVVc2NVSkJRWEZDTEVWQlFVVXNUMEZCVHl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpOSUxFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4SFFVRkhMSEZDUVVGeFFpeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUTBGQlF5eERRVUZETzBsQlF5OUZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUlVGQlJTeHhRa0ZCY1VJc1JVRkJSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03TzBsQlJYWkhMRTlCUVU4c1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4UFFVRlBMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03U1VGRFppeFBRVUZQTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1EwRkRja0lzUTBGQlF6czdRVUZGUml4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRXRCUVVzc1MwRkJTenRKUVVONFF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1NVRkRaaXhQUVVGUExFTkJRVU1zVTBGQlV5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFRRVUZUTEVOQlFVTTdTVUZET1VJc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRja0lzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdTVUZEYUVRc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wTkJRM0pDTEVOQlFVTTdPenM3UVVGSlJpeE5RVUZOTEUxQlFVMHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemRDTEUxQlFVMURMRkZCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUTJoRExFMUJRVTBzUlVGQlJTeEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRla0lzVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenM3T3pzN096czdPenRCUVZWNlFpeE5RVUZOTEdsQ1FVRnBRaXhIUVVGSExHTkJRV01zYTBKQlFXdENMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03T3pzN08wbEJTM0JGTEZkQlFWY3NSMEZCUnp0UlFVTldMRXRCUVVzc1JVRkJSU3hEUVVGRE96czdVVUZIVWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU03VVVGRFppeEpRVUZKTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFVkJRVVU3V1VGRGJrTXNTVUZCU1N4SFFVRkhMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xTkJRekZFT3p0UlFVVkVMRWxCUVVrc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVWQlFVVTdXVUZETlVNc1NVRkJTU3hIUVVGSExGVkJRVlVzUlVGQlJTeERRVUZETzFOQlEzWkNPenRSUVVWRUxFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRM1JDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZET3pzN1VVRkhlRU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRSQ3hwUWtGQlpTeERRVUZETEVWQlFVVTdXVUZEY0VNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRRU3hwUWtGQlpTeERRVUZETEVOQlFVTTdVMEZEYmtRc1RVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NZVUZCWVN4RFFVRkRPMU5CUXpsQ096dFJRVVZFTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RlFVRkZPMWxCUTNaRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVkQlFVY3NVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFRRVU4yUlN4TlFVRk5PMWxCUTBnc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRUUVVOd1F6czdVVUZGUkN4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVjBGQlZ5eERRVUZETEVWQlFVVTdXVUZEYUVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhYUVVGWExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0VFFVTjZSQ3hOUVVGTk8xbEJRMGdzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNN1UwRkRkRUk3TzFGQlJVUXNTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExGZEJRVmNzUTBGQlF5eEZRVUZGTzFsQlEyaERMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJWeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdVMEZEZWtRc1RVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NVMEZCVXl4RFFVRkRPMU5CUTNSQ096dFJRVVZFTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RlFVRkZPMWxCUTNSRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRPMU5CUTNSRUxFMUJRVTA3V1VGRFNDeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOMFFqczdTMEZGU2pzN1NVRkZSQ3hYUVVGWExHdENRVUZyUWl4SFFVRkhPMUZCUXpWQ0xFOUJRVTg3V1VGRFNFRXNhVUpCUVdVN1dVRkRaaXhwUWtGQmFVSTdXVUZEYWtJc1kwRkJZenRaUVVOa0xHdENRVUZyUWp0WlFVTnNRaXhYUVVGWE8xbEJRMWdzVjBGQlZ6dFRRVU5rTEVOQlFVTTdTMEZEVERzN1NVRkZSQ3hwUWtGQmFVSXNSMEZCUnp0UlFVTm9RaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRGJFTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4TFFVRkxMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU01UkRzN1NVRkZSQ3h2UWtGQmIwSXNSMEZCUnp0UlFVTnVRaXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wUXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETVVJN096czdPenM3TzBsQlVVUXNVMEZCVXl4SFFVRkhPMUZCUTFJc1QwRkJUeXhoUVVGaExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTI1RE96czdPenM3T3p0SlFWRkVMRkZCUVZFc1IwRkJSenRSUVVOUUxFOUJRVThzU1VGQlNTeERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMHRCUXpOQ096czdPenM3TzBsQlQwUXNTVUZCU1N4SlFVRkpMRWRCUVVjN1VVRkRVQ3hQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdTVUZQUkN4SlFVRkpMRXRCUVVzc1IwRkJSenRSUVVOU0xFOUJRVTlETEZGQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE0wSTdTVUZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhSUVVGUkxFVkJRVVU3VVVGRGFFSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1VVRkJVU3hGUVVGRk8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVORUxHbENRVUZsTEVOQlFVTXNRMEZCUXp0WlFVTjBRME1zVVVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03VTBGRGJrTXNUVUZCVFR0WlFVTklRU3hSUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRaUVVNelFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRSQ3hwUWtGQlpTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMU5CUTJoRU8wdEJRMG83T3pzN096czdPMGxCVVVRc1NVRkJTU3hOUVVGTkxFZEJRVWM3VVVGRFZDeFBRVUZQTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE5VSTdTVUZEUkN4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRFppeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhOUVVGTkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFRRVU51UXl4TlFVRk5PMWxCUTBnc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFRRVUZUTEVWQlFVVXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU03VTBGRGJrUTdTMEZEU2pzN096czdPenRKUVU5RUxFbEJRVWtzVjBGQlZ5eEhRVUZITzFGQlEyUXNUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpkRk8wbEJRMFFzU1VGQlNTeFhRVUZYTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTJZc1NVRkJTU3hKUVVGSkxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlExb3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRFpDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOcVFpeExRVUZMTzFsQlEwWXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEV0N4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU5rTzB0QlEwbzdPenM3T3pzN1NVRlBSQ3hqUVVGakxFZEJRVWM3VVVGRFlpeFBRVUZQTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRE8wdEJRM0JET3pzN096czdPMGxCVDBRc1NVRkJTU3hEUVVGRExFZEJRVWM3VVVGRFNpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGRrSTdTVUZEUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVU3VVVGRFVpeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU51UWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTm9RenM3T3pzN096dEpRVTlFTEVsQlFVa3NRMEZCUXl4SFFVRkhPMUZCUTBvc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNaQ08wbEJRMFFzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFJc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRia0lzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRGFFTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxGRkJRVkVzUjBGQlJ6dFJRVU5ZTEU5QlFVOHNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU01UWp0SlFVTkVMRWxCUVVrc1VVRkJVU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5tTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVObUxFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1UwRkRjRU1zVFVGQlRUdFpRVU5JTEUxQlFVMHNhMEpCUVd0Q0xFZEJRVWNzU1VGQlNTeEhRVUZITEdOQlFXTXNRMEZCUXp0WlFVTnFSQ3hUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4clFrRkJhMElzUTBGQlF5eERRVUZETzFsQlEzaERMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVlVGQlZTeEZRVUZGTEd0Q1FVRnJRaXhEUVVGRExFTkJRVU03VTBGRGNrUTdTMEZEU2pzN096czdPenM3U1VGUlJDeFBRVUZQTEVkQlFVYzdVVUZEVGl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFWVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRVZCUVVVc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlF6ZERMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNaVUZCWlN4RlFVRkZPMmRDUVVNeFF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YVVKQlExbzdZVUZEU2l4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOUU8wdEJRMG83T3pzN096czdPenRKUVZORUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVTdVVUZEV0N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTzFsQlEyaENMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFsQlEzSkNMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNZMEZCWXl4RlFVRkZPMmRDUVVONlF5eE5RVUZOTEVWQlFVVTdiMEpCUTBvc1IwRkJSeXhGUVVGRkxFbEJRVWs3YjBKQlExUXNUVUZCVFR0cFFrRkRWRHRoUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZETzFOQlExQTdTMEZEU2pzN096czdPenRKUVU5RUxFMUJRVTBzUjBGQlJ6dFJRVU5NTEU5QlFVOHNTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03UzBGREwwSTdPenM3T3pzN096dEpRVk5FTEZOQlFWTXNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRaQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlR0WlFVTTNReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03V1VGRGVFTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSVHRuUWtGRGJFUXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFZEJRVWNzUlVGQlJTeEpRVUZKTzI5Q1FVTlVMRTFCUVUwN2FVSkJRMVE3WVVGRFNpeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTlFPMHRCUTBvN096czdPenM3T3pzN096dEpRVmxFTEUxQlFVMHNRMEZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhGUVVGRkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZPMUZCUTNKRUxFMUJRVTBzUzBGQlN5eEhRVUZITEU5QlFVOHNSMEZCUnl4aFFVRmhMRU5CUVVNN1VVRkRkRU1zVFVGQlRTeExRVUZMTEVkQlFVY3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVNelFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRemRDTEUxQlFVMHNVMEZCVXl4SFFVRkhMRkZCUVZFc1IwRkJSeXhMUVVGTExFTkJRVU03TzFGQlJXNURMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPenRSUVVVelFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRaUVVObUxGVkJRVlVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVOMlJEczdVVUZGUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTzFsQlEzSkNMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGVFTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka01zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEZWtRN08xRkJSVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN08xRkJSVFZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRWxCUVVrN1VVRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4TlFVRk5PMU5CUTFRN1VVRkRSQ3hMUVVGTExFTkJRVU1zUlVGQlJUdFpRVU5LTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM1JFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU53UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpsRUxFMUJRVTA3VTBGRFZEdFJRVU5FTEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTBvc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEZEVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE9VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEwb3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGRFUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6RkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzQkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMG9zVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRkRVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRekZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM0pFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZET1VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpGRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVONlJDeE5RVUZOTzFOQlExUTdVVUZEUkN4UlFVRlJPMU5CUTFBN096dFJRVWRFTEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU14UXp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1UwRkJVeXhGUVVGRkxHbENRVUZwUWl4RFFVRkRMRU5CUVVNN08wRkRkR2RDTTBRN096czdPenM3T3pzN096czdPenM3T3pzN1FVRnRRa0VzUVVGRlFUczdPenM3UVVGTFFTeE5RVUZOTEhkQ1FVRjNRaXhIUVVGSExHTkJRV01zVjBGQlZ5eERRVUZET3pzN096dEpRVXQyUkN4WFFVRlhMRWRCUVVjN1VVRkRWaXhMUVVGTExFVkJRVVVzUTBGQlF6dExRVU5ZT3p0SlFVVkVMR2xDUVVGcFFpeEhRVUZITzFGQlEyaENMRWxCUVVrc1EwRkJReXhKUVVGSkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUVUZCVFN4RlFVRkZPMWxCUXpGQ0xFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNjVUpCUVhGQ0xFTkJRVU1zUTBGQlF6dFRRVU16UXpzN1VVRkZSQ3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNRMEZCUXl4TFFVRkxMRXRCUVVzN08xbEJSUzlETEVsQlFVa3NRMEZCUXl4UFFVRlBPMmxDUVVOUUxFMUJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN2FVSkJRek5ETEU5QlFVOHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVOQlFVTTdVMEZEYkVNc1EwRkJReXhEUVVGRE8wdEJRMDQ3TzBsQlJVUXNiMEpCUVc5Q0xFZEJRVWM3UzBGRGRFSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM1pFTzBOQlEwb3NRMEZCUXpzN1FVRkZSaXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEUxQlFVMHNRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeDNRa0ZCZDBJc1EwRkJReXhEUVVGRE96dEJRemRFTVVVN096czdPenM3T3pzN096czdPenM3T3p0QlFXdENRU3hCUVV0QkxFMUJRVTBzUTBGQlF5eGhRVUZoTEVkQlFVY3NUVUZCVFN4RFFVRkRMR0ZCUVdFc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzBsQlEzcEVMRTlCUVU4c1JVRkJSU3hQUVVGUE8wbEJRMmhDTEU5QlFVOHNSVUZCUlN4VlFVRlZPMGxCUTI1Q0xFOUJRVThzUlVGQlJTd3lRa0ZCTWtJN1NVRkRjRU1zV1VGQldTeEZRVUZGTzFGQlExWXNkVUpCUVhWQ0xFVkJRVVVzZFVKQlFYVkNPMUZCUTJoRUxHbENRVUZwUWl4RlFVRkZMR2xDUVVGcFFqdFJRVU53UXl4dlFrRkJiMElzUlVGQlJTeHZRa0ZCYjBJN1VVRkRNVU1zZDBKQlFYZENMRVZCUVVVc2QwSkJRWGRDTzB0QlEzSkVPME5CUTBvc1EwRkJReXhEUVVGREluMD0ifQ==
