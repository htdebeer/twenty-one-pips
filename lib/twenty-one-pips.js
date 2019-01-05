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

const ParseError = class extends ValidationError {
    constructor(msg) {
        super(msg);
    }
};

const InvalidTypeError = class extends ValidationError {
    constructor(msg) {
        super(msg);
    }
};

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

const Validator = class {
    Integer(input) {
        return new IntegerTypeValidator(input);
    }

    String(input) {
        return new StringTypeValidator(input);
    }

    Color(input) {
        return new ColorTypeValidator(input);
    }
};

const ValidatorSingleton = new Validator();

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

        const pips = ValidatorSingleton
            .Integer(this.getAttribute(PIPS_ATTRIBUTE))
            .between(1, 6)
            .defaultTo(randomPips())
            .value;

        _pips.set(this, pips);
        this.setAttribute(PIPS_ATTRIBUTE, pips);

        this.color = ValidatorSingleton.Color(this.getAttribute(COLOR_ATTRIBUTE$1))
            .defaultTo(DEFAULT_COLOR)
            .value;

        this.rotation = ValidatorSingleton.Integer(this.getAttribute(ROTATION_ATTRIBUTE))
            .between(0, 360)
            .defaultTo(DEFAULT_ROTATION)
            .value;

        this.x = ValidatorSingleton.Integer(this.getAttribute(X_ATTRIBUTE))
            .largerThan(0)
            .defaultTo(DEFAULT_X)
            .value;

        this.y = ValidatorSingleton.Integer(this.getAttribute(Y_ATTRIBUTE))
            .largerThan(0)
            .defaultTo(DEFAULT_Y)
            .value;

        this.heldBy = ValidatorSingleton.String(this.getAttribute(HELD_BY_ATTRIBUTE))
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
    }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdlbnR5LW9uZS1waXBzLmpzIiwic291cmNlcyI6WyJlcnJvci9Db25maWd1cmF0aW9uRXJyb3IuanMiLCJHcmlkTGF5b3V0LmpzIiwibWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzLmpzIiwiVG9wUGxheWVySFRNTEVsZW1lbnQuanMiLCJUb3BEaWNlQm9hcmRIVE1MRWxlbWVudC5qcyIsIlZhbGlkYXRvci5qcyIsIlRvcERpZUhUTUxFbGVtZW50LmpzIiwiVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50LmpzIiwidHdlbnR5LW9uZS1waXBzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb25FcnJvclxuICpcbiAqIEBleHRlbmRzIEVycm9yXG4gKi9cbmNvbnN0IENvbmZpZ3VyYXRpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IENvbmZpZ3VyYXRpb25FcnJvciB3aXRoIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzXG4gICAgICogQ29uZmlndXJhdGlvbkVycm9yLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9O1xuIiwiLyoqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5pbXBvcnQge0NvbmZpZ3VyYXRpb25FcnJvcn0gZnJvbSBcIi4vZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLmpzXCI7XG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMgPSAzNjA7XG5cbmNvbnN0IHJhbmRvbWl6ZUNlbnRlciA9IChuKSA9PiB7XG4gICAgcmV0dXJuICgwLjUgPD0gTWF0aC5yYW5kb20oKSA/IE1hdGguZmxvb3IgOiBNYXRoLmNlaWwpLmNhbGwoMCwgbik7XG59O1xuXG4vLyBQcml2YXRlIGZpZWxkc1xuY29uc3QgX3dpZHRoID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9oZWlnaHQgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2NvbHMgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3Jvd3MgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpY2UgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2RpZVNpemUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2Rpc3BlcnNpb24gPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3JvdGF0ZSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JpZExheW91dENvbmZpZ3VyYXRpb25cbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBjb25maWcud2lkdGggLSBUaGUgbWluaW1hbCB3aWR0aCBvZiB0aGlzXG4gKiBHcmlkTGF5b3V0IGluIHBpeGVscy47XG4gKiBAcHJvcGVydHkge051bWJlcn0gY29uZmlnLmhlaWdodF0gLSBUaGUgbWluaW1hbCBoZWlnaHQgb2ZcbiAqIHRoaXMgR3JpZExheW91dCBpbiBwaXhlbHMuLlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaXNwZXJzaW9uIC0gVGhlIGRpc3RhbmNlIGZyb20gdGhlIGNlbnRlciBvZiB0aGVcbiAqIGxheW91dCBhIGRpZSBjYW4gYmUgbGF5b3V0LlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGNvbmZpZy5kaWVTaXplIC0gVGhlIHNpemUgb2YgYSBkaWUuXG4gKi9cblxuLyoqXG4gKiBHcmlkTGF5b3V0IGhhbmRsZXMgbGF5aW5nIG91dCB0aGUgZGljZSBvbiBhIERpY2VCb2FyZC5cbiAqL1xuY29uc3QgR3JpZExheW91dCA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtHcmlkTGF5b3V0Q29uZmlndXJhdGlvbn0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIEdyaWRMYXlvdXRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGRpc3BlcnNpb24sXG4gICAgICAgIGRpZVNpemVcbiAgICB9ID0ge30pIHtcbiAgICAgICAgX2RpY2Uuc2V0KHRoaXMsIFtdKTtcbiAgICAgICAgX2RpZVNpemUuc2V0KHRoaXMsIDEpO1xuICAgICAgICBfd2lkdGguc2V0KHRoaXMsIDApO1xuICAgICAgICBfaGVpZ2h0LnNldCh0aGlzLCAwKTtcbiAgICAgICAgX3JvdGF0ZS5zZXQodGhpcywgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5kaXNwZXJzaW9uID0gZGlzcGVyc2lvbjtcbiAgICAgICAgdGhpcy5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqIEB0aHJvd3MgbW9kdWxlOmVycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5Db25maWd1cmF0aW9uRXJyb3IgV2lkdGggPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9IFxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIF93aWR0aC5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IHdpZHRoKHcpIHtcbiAgICAgICAgaWYgKDAgPiB3KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBXaWR0aCBzaG91bGQgYmUgYSBudW1iZXIgbGFyZ2VyIHRoYW4gMCwgZ290ICcke3d9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF93aWR0aC5zZXQodGhpcywgdyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgaW4gcGl4ZWxzIHVzZWQgYnkgdGhpcyBHcmlkTGF5b3V0LiBcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIEhlaWdodCA+PSAwXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBfaGVpZ2h0LmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBzZXQgaGVpZ2h0KGgpIHtcbiAgICAgICAgaWYgKDAgPiBoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBIZWlnaHQgc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHtofScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBfaGVpZ2h0LnNldCh0aGlzLCBoKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlR3JpZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IG9uIHRoaXMgR3JpZExheW91dC4gVGhpc1xuICAgICAqIG51bWJlciBpcyA+PSAwLiBSZWFkIG9ubHkuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBtYXhpbXVtTnVtYmVyT2ZEaWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29scyAqIHRoaXMuX3Jvd3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BlcnNpb24gbGV2ZWwgdXNlZCBieSB0aGlzIEdyaWRMYXlvdXQuIFRoZSBkaXNwZXJzaW9uIGxldmVsXG4gICAgICogaW5kaWNhdGVzIHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgZGljZSBjYW4gYmUgbGF5b3V0LiBVc2UgMSBmb3IgYVxuICAgICAqIHRpZ2h0IHBhY2tlZCBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIG1vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3IuQ29uZmlndXJhdGlvbkVycm9yIERpc3BlcnNpb24gPj0gMFxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBfZGlzcGVyc2lvbi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0IGRpc3BlcnNpb24oZCkge1xuICAgICAgICBpZiAoMCA+IGQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDb25maWd1cmF0aW9uRXJyb3IoYERpc3BlcnNpb24gc2hvdWxkIGJlIGEgbnVtYmVyIGxhcmdlciB0aGFuIDAsIGdvdCAnJHtkfScgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2Rpc3BlcnNpb24uc2V0KHRoaXMsIGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzaXplIG9mIGEgZGllLlxuICAgICAqXG4gICAgICogQHRocm93cyBtb2R1bGU6ZXJyb3IvQ29uZmlndXJhdGlvbkVycm9yLkNvbmZpZ3VyYXRpb25FcnJvciBEaWVTaXplID49IDBcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gX2RpZVNpemUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIHNldCBkaWVTaXplKGRzKSB7XG4gICAgICAgIGlmICgwID49IGRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBkaWVTaXplIHNob3VsZCBiZSBhIG51bWJlciBsYXJnZXIgdGhhbiAxLCBnb3QgJyR7ZHN9JyBpbnN0ZWFkLmApO1xuICAgICAgICB9XG4gICAgICAgIF9kaWVTaXplLnNldCh0aGlzLCBkcyk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUdyaWQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdldCByb3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBfcm90YXRlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCA9PT0gciA/IHRydWUgOiByO1xuICAgIH1cblxuICAgIHNldCByb3RhdGUocikge1xuICAgICAgICBfcm90YXRlLnNldCh0aGlzLCByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgaW4gdGhpcyBHcmlkTGF5b3V0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIHJvd3MsIDAgPCByb3dzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9yb3dzKCkge1xuICAgICAgICByZXR1cm4gX3Jvd3MuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBudW1iZXIgb2YgY29sdW1ucywgMCA8IGNvbHVtbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXQgX2NvbHMoKSB7XG4gICAgICAgIHJldHVybiBfY29scy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNlbnRlciBjZWxsIGluIHRoaXMgR3JpZExheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNlbnRlciAocm93LCBjb2wpLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0IF9jZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJhbmRvbWl6ZUNlbnRlcih0aGlzLl9yb3dzIC8gMikgLSAxO1xuICAgICAgICBjb25zdCBjb2wgPSByYW5kb21pemVDZW50ZXIodGhpcy5fY29scyAvIDIpIC0gMTtcblxuICAgICAgICByZXR1cm4ge3JvdywgY29sfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXlvdXQgZGljZSBvbiB0aGlzIEdyaWRMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpEaWV+RGllW119IGRpY2UgLSBUaGUgZGljZSB0byBsYXlvdXQgb24gdGhpcyBMYXlvdXQuXG4gICAgICogQHJldHVybiB7bW9kdWxlOkRpZX5EaWVbXX0gVGhlIHNhbWUgbGlzdCBvZiBkaWNlLCBidXQgbm93IGxheW91dC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3Mge21vZHVsZTplcnJvci9Db25maWd1cmF0aW9uRXJyb3J+Q29uZmlndXJhdGlvbkVycm9yfSBUaGUgbnVtYmVyIG9mXG4gICAgICogZGljZSBzaG91bGQgbm90IGV4Y2VlZCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZGljZSB0aGlzIExheW91dCBjYW5cbiAgICAgKiBsYXlvdXQuXG4gICAgICovXG4gICAgbGF5b3V0KGRpY2UpIHtcbiAgICAgICAgaWYgKGRpY2UubGVuZ3RoID4gdGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKGBUaGUgbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgbGF5b3V0IGlzICR7dGhpcy5tYXhpbXVtTnVtYmVyT2ZEaWNlfSwgZ290ICR7ZGljZS5sZW5naHR9IGRpY2UgaW5zdGVhZC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlMYXlvdXREaWNlID0gW107XG4gICAgICAgIGNvbnN0IGRpY2VUb0xheW91dCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2UpIHtcbiAgICAgICAgICAgIGlmIChkaWUuaGFzQ29vcmRpbmF0ZXMoKSAmJiBkaWUuaXNIZWxkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEaWNlIHRoYXQgYXJlIGJlaW5nIGhlbGQgYW5kIGhhdmUgYmVlbiBsYXlvdXQgYmVmb3JlIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIGtlZXAgdGhlaXIgY3VycmVudCBjb29yZGluYXRlcyBhbmQgcm90YXRpb24uIEluIG90aGVyIHdvcmRzLFxuICAgICAgICAgICAgICAgIC8vIHRoZXNlIGRpY2UgYXJlIHNraXBwZWQuXG4gICAgICAgICAgICAgICAgYWxyZWFkeUxheW91dERpY2UucHVzaChkaWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWNlVG9MYXlvdXQucHVzaChkaWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5taW4oZGljZS5sZW5ndGggKiB0aGlzLmRpc3BlcnNpb24sIHRoaXMubWF4aW11bU51bWJlck9mRGljZSk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzID0gdGhpcy5fY29tcHV0ZUF2YWlsYWJsZUNlbGxzKG1heCwgYWxyZWFkeUxheW91dERpY2UpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGllIG9mIGRpY2VUb0xheW91dCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhdmFpbGFibGVDZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tQ2VsbCA9IGF2YWlsYWJsZUNlbGxzW3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUNlbGxzLnNwbGljZShyYW5kb21JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGRpZS5jb29yZGluYXRlcyA9IHRoaXMuX251bWJlclRvQ29vcmRpbmF0ZXMocmFuZG9tQ2VsbCk7XG4gICAgICAgICAgICBkaWUucm90YXRpb24gPSB0aGlzLnJvdGF0ZSA/IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEZVTExfQ0lSQ0xFX0lOX0RFR1JFRVMpIDogbnVsbDtcbiAgICAgICAgICAgIGFscmVhZHlMYXlvdXREaWNlLnB1c2goZGllKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9kaWNlLnNldCh0aGlzLCBhbHJlYWR5TGF5b3V0RGljZSk7XG5cbiAgICAgICAgcmV0dXJuIGFscmVhZHlMYXlvdXREaWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYSBsaXN0IHdpdGggYXZhaWxhYmxlIGNlbGxzIHRvIHBsYWNlIGRpY2Ugb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4IC0gVGhlIG51bWJlciBlbXB0eSBjZWxscyB0byBjb21wdXRlLlxuICAgICAqIEBwYXJhbSB7RGllW119IGFscmVhZHlMYXlvdXREaWNlIC0gQSBsaXN0IHdpdGggZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtOVW1iZXJbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGNlbGxzIHJlcHJlc2VudGVkIGJ5IHRoZWlyIG51bWJlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jb21wdXRlQXZhaWxhYmxlQ2VsbHMobWF4LCBhbHJlYWR5TGF5b3V0RGljZSkge1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBsZXZlbCA9IDA7XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gTWF0aC5taW4odGhpcy5fcm93cywgdGhpcy5fY29scyk7XG5cbiAgICAgICAgd2hpbGUgKGF2YWlsYWJsZS5zaXplIDwgbWF4ICYmIGxldmVsIDwgbWF4TGV2ZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsc09uTGV2ZWwobGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCAhPT0gY2VsbCAmJiB0aGlzLl9jZWxsSXNFbXB0eShjZWxsLCBhbHJlYWR5TGF5b3V0RGljZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlLmFkZChjZWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldmVsKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhdmFpbGFibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSBhbGwgY2VsbHMgb24gbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSBUaGUgbGV2ZWwgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsYXlvdXQuIDBcbiAgICAgKiBpbmRpY2F0ZXMgdGhlIGNlbnRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NldDxOdW1iZXI+fSB0aGUgY2VsbHMgb24gdGhlIGxldmVsIGluIHRoaXMgbGF5b3V0IHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhlaXIgbnVtYmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxzT25MZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zdCBjZWxscyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5fY2VudGVyO1xuXG4gICAgICAgIGlmICgwID09PSBsZXZlbCkge1xuICAgICAgICAgICAgY2VsbHMuYWRkKHRoaXMuX2NlbGxUb051bWJlcihjZW50ZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IGNlbnRlci5yb3cgLSBsZXZlbDsgcm93IDw9IGNlbnRlci5yb3cgKyBsZXZlbDsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3csIGNvbDogY2VudGVyLmNvbCAtIGxldmVsfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdywgY29sOiBjZW50ZXIuY29sICsgbGV2ZWx9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IGNlbnRlci5jb2wgLSBsZXZlbCArIDE7IGNvbCA8IGNlbnRlci5jb2wgKyBsZXZlbDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBjZWxscy5hZGQodGhpcy5fY2VsbFRvTnVtYmVyKHtyb3c6IGNlbnRlci5yb3cgLSBsZXZlbCwgY29sfSkpO1xuICAgICAgICAgICAgICAgIGNlbGxzLmFkZCh0aGlzLl9jZWxsVG9OdW1iZXIoe3JvdzogY2VudGVyLnJvdyArIGxldmVsLCBjb2x9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyBjZWxsIGNvbnRhaW4gYSBjZWxsIGZyb20gYWxyZWFkeUxheW91dERpY2U/XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY2VsbCAtIEEgY2VsbCBpbiBsYXlvdXQgcmVwcmVzZW50ZWQgYnkgYSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtEaWVbXX0gYWxyZWFkeUxheW91dERpY2UgLSBBIGxpc3Qgb2YgZGljZSB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGxheW91dC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgY2VsbCBkb2VzIG5vdCBjb250YWluIGEgZGllLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxJc0VtcHR5KGNlbGwsIGFscmVhZHlMYXlvdXREaWNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgPT09IGFscmVhZHlMYXlvdXREaWNlLmZpbmQoZGllID0+IGNlbGwgPT09IHRoaXMuX2Nvb3JkaW5hdGVzVG9OdW1iZXIoZGllLmNvb3JkaW5hdGVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIG51bWJlciB0byBhIGNlbGwgKHJvdywgY29sKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBhIGNlbGxcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm4gdGhlIGNlbGwgKHtyb3csIGNvbH0pIGNvcnJlc3BvbmRpbmcgbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9udW1iZXJUb0NlbGwobikge1xuICAgICAgICByZXR1cm4ge3JvdzogTWF0aC50cnVuYyhuIC8gdGhpcy5fY29scyksIGNvbDogbiAlIHRoaXMuX2NvbHN9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYSBjZWxsIHRvIGEgbnVtYmVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gaXRzIG51bWJlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNlbGwuXG4gICAgICogUmV0dXJucyB1bmRlZmluZWQgd2hlbiB0aGUgY2VsbCBpcyBub3Qgb24gdGhlIGxheW91dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb051bWJlcih7cm93LCBjb2x9KSB7XG4gICAgICAgIGlmICgwIDw9IHJvdyAmJiByb3cgPCB0aGlzLl9yb3dzICYmIDAgPD0gY29sICYmIGNvbCA8IHRoaXMuX2NvbHMpIHtcbiAgICAgICAgICAgIHJldHVybiByb3cgKiB0aGlzLl9jb2xzICsgY29sO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIGNlbGwgcmVwcmVzZW50ZWQgYnkgaXRzIG51bWJlciB0byB0aGVpciBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIC0gVGhlIG51bWJlciByZXByZXNlbnRpbmcgYSBjZWxsXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb29yZGluYXRlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjZWxsIHJlcHJlc2VudGVkIGJ5XG4gICAgICogdGhpcyBudW1iZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbnVtYmVyVG9Db29yZGluYXRlcyhuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jZWxsVG9Db29yZHModGhpcy5fbnVtYmVyVG9DZWxsKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgcGFpciBvZiBjb29yZGluYXRlcyB0byBhIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHMgLSBUaGUgY29vcmRpbmF0ZXMgdG8gY29udmVydFxuICAgICAqXG4gICAgICogQHJldHVybiB7TnVtYmVyfHVuZGVmaW5lZH0gVGhlIGNvb3JkaW5hdGVzIGNvbnZlcnRlZCB0byBhIG51bWJlci4gSWZcbiAgICAgKiB0aGUgY29vcmRpbmF0ZXMgYXJlIG5vdCBvbiB0aGlzIGxheW91dCwgdGhlIG51bWJlciBpcyB1bmRlZmluZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29vcmRpbmF0ZXNUb051bWJlcihjb29yZHMpIHtcbiAgICAgICAgY29uc3QgbiA9IHRoaXMuX2NlbGxUb051bWJlcih0aGlzLl9jb29yZHNUb0NlbGwoY29vcmRzKSk7XG4gICAgICAgIGlmICgwIDw9IG4gJiYgbiA8IHRoaXMubWF4aW11bU51bWJlck9mRGljZSkge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbmFwICh4LHkpIHRvIHRoZSBjbG9zZXN0IGNlbGwgaW4gdGhpcyBMYXlvdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGllY29vcmRpbmF0ZSAtIFRoZSBjb29yZGluYXRlIHRvIGZpbmQgdGhlIGNsb3Nlc3QgY2VsbFxuICAgICAqIGZvci5cbiAgICAgKiBAcGFyYW0ge0RpZX0gW2RpZWNvb3JkaW5hdC5kaWUgPSBudWxsXSAtIFRoZSBkaWUgdG8gc25hcCB0by5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS54IC0gVGhlIHgtY29vcmRpbmF0ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGllY29vcmRpbmF0ZS55IC0gVGhlIHktY29vcmRpbmF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudWxsfSBUaGUgY29vcmRpbmF0ZSBvZiB0aGUgY2VsbCBjbG9zZXN0IHRvICh4LCB5KS5cbiAgICAgKiBOdWxsIHdoZW4gbm8gc3VpdGFibGUgY2VsbCBpcyBuZWFyICh4LCB5KVxuICAgICAqL1xuICAgIHNuYXBUbyh7ZGllID0gbnVsbCwgeCwgeX0pIHtcbiAgICAgICAgY29uc3QgY29ybmVyQ2VsbCA9IHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvcm5lciA9IHRoaXMuX2NlbGxUb0Nvb3Jkcyhjb3JuZXJDZWxsKTtcbiAgICAgICAgY29uc3Qgd2lkdGhJbiA9IGNvcm5lci54ICsgdGhpcy5kaWVTaXplIC0geDtcbiAgICAgICAgY29uc3Qgd2lkdGhPdXQgPSB0aGlzLmRpZVNpemUgLSB3aWR0aEluO1xuICAgICAgICBjb25zdCBoZWlnaHRJbiA9IGNvcm5lci55ICsgdGhpcy5kaWVTaXplIC0geTtcbiAgICAgICAgY29uc3QgaGVpZ2h0T3V0ID0gdGhpcy5kaWVTaXplIC0gaGVpZ2h0SW47XG5cbiAgICAgICAgY29uc3QgcXVhZHJhbnRzID0gW3tcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcihjb3JuZXJDZWxsKSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aEluICogaGVpZ2h0SW5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcTogdGhpcy5fY2VsbFRvTnVtYmVyKHtcbiAgICAgICAgICAgICAgICByb3c6IGNvcm5lckNlbGwucm93LFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodEluXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHE6IHRoaXMuX2NlbGxUb051bWJlcih7XG4gICAgICAgICAgICAgICAgcm93OiBjb3JuZXJDZWxsLnJvdyArIDEsXG4gICAgICAgICAgICAgICAgY29sOiBjb3JuZXJDZWxsLmNvbFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb3ZlcmFnZTogd2lkdGhJbiAqIGhlaWdodE91dFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBxOiB0aGlzLl9jZWxsVG9OdW1iZXIoe1xuICAgICAgICAgICAgICAgIHJvdzogY29ybmVyQ2VsbC5yb3cgKyAxLFxuICAgICAgICAgICAgICAgIGNvbDogY29ybmVyQ2VsbC5jb2wgKyAxXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvdmVyYWdlOiB3aWR0aE91dCAqIGhlaWdodE91dFxuICAgICAgICB9XTtcblxuICAgICAgICBjb25zdCBzbmFwVG8gPSBxdWFkcmFudHNcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIG9uIHRoZSBsYXlvdXRcbiAgICAgICAgICAgIC5maWx0ZXIoKHF1YWRyYW50KSA9PiB1bmRlZmluZWQgIT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAvLyBjZWxsIHNob3VsZCBiZSBub3QgYWxyZWFkeSB0YWtlbiBleGNlcHQgYnkgaXRzZWxmXG4gICAgICAgICAgICAuZmlsdGVyKChxdWFkcmFudCkgPT4gKFxuICAgICAgICAgICAgICAgIG51bGwgIT09IGRpZSAmJiB0aGlzLl9jb29yZGluYXRlc1RvTnVtYmVyKGRpZS5jb29yZGluYXRlcykgPT09IHF1YWRyYW50LnEpXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5fY2VsbElzRW1wdHkocXVhZHJhbnQucSwgX2RpY2UuZ2V0KHRoaXMpKSlcbiAgICAgICAgICAgIC8vIGNlbGwgc2hvdWxkIGJlIGNvdmVyZWQgYnkgdGhlIGRpZSB0aGUgbW9zdFxuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAobWF4USwgcXVhZHJhbnQpID0+IHF1YWRyYW50LmNvdmVyYWdlID4gbWF4US5jb3ZlcmFnZSA/IHF1YWRyYW50IDogbWF4USxcbiAgICAgICAgICAgICAgICB7cTogdW5kZWZpbmVkLCBjb3ZlcmFnZTogLTF9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQgIT09IHNuYXBUby5xID8gdGhpcy5fbnVtYmVyVG9Db29yZGluYXRlcyhzbmFwVG8ucSkgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGllIGF0IHBvaW50ICh4LCB5KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50IC0gVGhlIHBvaW50IGluICh4LCB5KSBjb29yZGluYXRlc1xuICAgICAqIEByZXR1cm4ge0RpZXxudWxsfSBUaGUgZGllIHVuZGVyIGNvb3JkaW5hdGVzICh4LCB5KSBvciBudWxsIGlmIG5vIGRpZVxuICAgICAqIGlzIGF0IHRoZSBwb2ludC5cbiAgICAgKi9cbiAgICBnZXRBdChwb2ludCA9IHt4OiAwLCB5OiAwfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBfZGljZS5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgY29uc3QgeEZpdCA9IHggPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHggKyB0aGlzLmRpZVNpemU7XG4gICAgICAgICAgICBjb25zdCB5Rml0ID0geSA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0geSArIHRoaXMuZGllU2l6ZTtcblxuICAgICAgICAgICAgaWYgKHhGaXQgJiYgeUZpdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGdyaWQgc2l6ZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gVGhlIG1pbmltYWwgd2lkdGhcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gVGhlIG1pbmltYWwgaGVpZ2h0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jYWxjdWxhdGVHcmlkKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgX2NvbHMuc2V0KHRoaXMsIE1hdGguZmxvb3Iod2lkdGggLyB0aGlzLmRpZVNpemUpKTtcbiAgICAgICAgX3Jvd3Muc2V0KHRoaXMsIE1hdGguZmxvb3IoaGVpZ2h0IC8gdGhpcy5kaWVTaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhIChyb3csIGNvbCkgY2VsbCB0byAoeCwgeSkgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2VsbCAtIFRoZSBjZWxsIHRvIGNvbnZlcnQgdG8gY29vcmRpbmF0ZXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjb3JyZXNwb25kaW5nIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NlbGxUb0Nvb3Jkcyh7cm93LCBjb2x9KSB7XG4gICAgICAgIHJldHVybiB7eDogY29sICogdGhpcy5kaWVTaXplLCB5OiByb3cgKiB0aGlzLmRpZVNpemV9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgKHgsIHkpIGNvb3JkaW5hdGVzIHRvIGEgKHJvdywgY29sKSBjZWxsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvb3JkaW5hdGVzIC0gVGhlIGNvb3JkaW5hdGVzIHRvIGNvbnZlcnQgdG8gYSBjZWxsLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNvcnJlc3BvbmRpbmcgY2VsbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvb3Jkc1RvQ2VsbCh7eCwgeX0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvdzogTWF0aC50cnVuYyh5IC8gdGhpcy5kaWVTaXplKSxcbiAgICAgICAgICAgIGNvbDogTWF0aC50cnVuYyh4IC8gdGhpcy5kaWVTaXplKVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7R3JpZExheW91dH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxOCBIdXViIGRlIEJlZXJcbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiB0d2VudHktb25lLXBpcHMuXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXRcbiAqIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXJcbiAqIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVHdlbnR5LW9uZS1waXBzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuICogV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFlcbiAqIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHR3ZW50eS1vbmUtcGlwcy4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqIEBpZ25vcmVcbiAqL1xuXG4vKipcbiAqIEBtb2R1bGUgbWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cblxuLypcbiAqIENvbnZlcnQgYW4gSFRNTCBhdHRyaWJ1dGUgdG8gYW4gaW5zdGFuY2UncyBwcm9wZXJ0eS4gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgYXR0cmlidXRlJ3MgbmFtZVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSdzIG5hbWUuIEZvciBleGFtcGxlLCBcIm15LWF0dHJcIlxuICogd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJteUF0dHJcIiwgYW5kIFwiZGlzYWJsZWRcIiB0byBcImRpc2FibGVkXCIuXG4gKi9cbmNvbnN0IGF0dHJpYnV0ZTJwcm9wZXJ0eSA9IChuYW1lKSA9PiB7XG4gICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybiBmaXJzdCArIHJlc3QubWFwKHdvcmQgPT4gd29yZC5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKSkuam9pbigpO1xufTtcblxuLyoqXG4gKiBNaXhpbiB7QGxpbmsgbW9kdWxlOm1peGluL1JlYWRPbmx5QXR0cmlidXRlc35SZWFkT25seUF0dHJpYnV0ZXN9IHRvIGEgY2xhc3MuXG4gKlxuICogQHBhcmFtIHsqfSBTdXAgLSBUaGUgY2xhc3MgdG8gbWl4IGludG8uXG4gKiBAcmV0dXJuIHttb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc30gVGhlIG1peGVkLWluIGNsYXNzXG4gKi9cbmNvbnN0IFJlYWRPbmx5QXR0cmlidXRlcyA9IChTdXApID0+XG4gICAgLyoqXG4gICAgICogTWl4aW4gdG8gbWFrZSBhbGwgYXR0cmlidXRlcyBvbiBhIGN1c3RvbSBIVE1MRWxlbWVudCByZWFkLW9ubHkgaW4gdGhlIHNlbnNlXG4gICAgICogdGhhdCB3aGVuIHRoZSBhdHRyaWJ1dGUgZ2V0cyBhIG5ldyB2YWx1ZSB0aGF0IGRpZmZlcnMgZnJvbSB0aGUgdmFsdWUgb2YgdGhlXG4gICAgICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSwgaXQgaXMgcmVzZXQgdG8gdGhhdCBwcm9wZXJ0eSdzIHZhbHVlLiBUaGVcbiAgICAgKiBhc3N1bXB0aW9uIGlzIHRoYXQgYXR0cmlidXRlIFwibXktYXR0cmlidXRlXCIgY29ycmVzcG9uZHMgd2l0aCBwcm9wZXJ0eSBcInRoaXMubXlBdHRyaWJ1dGVcIi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q2xhc3N9IFN1cCAtIFRoZSBjbGFzcyB0byBtaXhpbiB0aGlzIFJlYWRPbmx5QXR0cmlidXRlcy5cbiAgICAgKiBAcmV0dXJuIHtSZWFkT25seUF0dHJpYnV0ZXN9IFRoZSBtaXhlZCBpbiBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBtaXhpblxuICAgICAqIEBhbGlhcyBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc1xuICAgICAqL1xuICAgIGNsYXNzIGV4dGVuZHMgU3VwIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdGhhdCBpcyBleGVjdXRlZCB3aGVuIGFuIG9ic2VydmVkIGF0dHJpYnV0ZSdzIHZhbHVlIGlzXG4gICAgICAgICAqIGNoYW5nZWQuIElmIHRoZSBIVE1MRWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIERPTSwgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiB2YWx1ZSBjYW4gb25seSBiZSBzZXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgSFRNTEVsZW1lbnQncyBwcm9wZXJ0eS5cbiAgICAgICAgICogSW4gZWZmZWN0LCB0aGlzIG1ha2VzIHRoaXMgSFRNTEVsZW1lbnQncyBhdHRyaWJ1dGVzIHJlYWQtb25seS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIGFuIEhUTUxFbGVtZW50IGhhcyBhbiBhdHRyaWJ1dGUgXCJ4XCIgYW5kXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgXCJ4XCIsIHRoZW4gY2hhbmdpbmcgdGhlIHZhbHVlIFwieFwiIHRvIFwiNVwiXG4gICAgICAgICAqIHdpbGwgb25seSB3b3JrIHdoZW4gYHRoaXMueCA9PT0gNWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBvbGQgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgICAgICAqL1xuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBBbGwgYXR0cmlidXRlcyBhcmUgbWFkZSByZWFkLW9ubHkgdG8gcHJldmVudCBjaGVhdGluZyBieSBjaGFuZ2luZ1xuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuIE9mIGNvdXJzZSwgdGhpcyBpcyBieSBub1xuICAgICAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdXNlcnMgd2lsbCBub3QgY2hlYXQgaW4gYSBkaWZmZXJlbnQgd2F5LlxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBhdHRyaWJ1dGUycHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQgJiYgbmV3VmFsdWUgIT09IGAke3RoaXNbcHJvcGVydHldfWApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB0aGlzW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQge1xuICAgIFJlYWRPbmx5QXR0cmlidXRlc1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG4vKipcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuXG4vLyBUaGUgbmFtZXMgb2YgdGhlIChvYnNlcnZlZCkgYXR0cmlidXRlcyBvZiB0aGUgVG9wUGxheWVySFRNTEVsZW1lbnQuXG5jb25zdCBDT0xPUl9BVFRSSUJVVEUgPSBcImNvbG9yXCI7XG5jb25zdCBOQU1FX0FUVFJJQlVURSA9IFwibmFtZVwiO1xuY29uc3QgU0NPUkVfQVRUUklCVVRFID0gXCJzY29yZVwiO1xuY29uc3QgSEFTX1RVUk5fQVRUUklCVVRFID0gXCJoYXMtdHVyblwiO1xuXG4vLyBUaGUgcHJpdmF0ZSBwcm9wZXJ0aWVzIG9mIHRoZSBUb3BQbGF5ZXJIVE1MRWxlbWVudCBcbmNvbnN0IF9jb2xvciA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbmFtZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfc2NvcmUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hhc1R1cm4gPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEEgUGxheWVyIGluIGEgZGljZSBnYW1lLlxuICpcbiAqIEEgcGxheWVyJ3MgbmFtZSBzaG91bGQgYmUgdW5pcXVlIGluIHRoZSBnYW1lLiBUd28gZGlmZmVyZW50XG4gKiBUb3BQbGF5ZXJIVE1MRWxlbWVudCBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIG5hbWUgYXR0cmlidXRlIGFyZSB0cmVhdGVkIGFzXG4gKiB0aGUgc2FtZSBwbGF5ZXIuXG4gKlxuICogSW4gZ2VuZXJhbCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IG5vIHR3byBwbGF5ZXJzIGRvIGhhdmUgdGhlIHNhbWUgY29sb3IsXG4gKiBhbHRob3VnaCBpdCBpcyBub3QgdW5jb25jZWl2YWJsZSB0aGF0IGNlcnRhaW4gZGljZSBnYW1lcyBoYXZlIHBsYXllcnMgd29ya1xuICogaW4gdGVhbXMgd2hlcmUgaXQgd291bGQgbWFrZSBzZW5zZSBmb3IgdHdvIG9yIG1vcmUgZGlmZmVyZW50IHBsYXllcnMgdG9cbiAqIGhhdmUgdGhlIHNhbWUgY29sb3IuXG4gKlxuICogVGhlIG5hbWUgYW5kIGNvbG9yIGF0dHJpYnV0ZXMgYXJlIHJlcXVpcmVkLiBUaGUgc2NvcmUgYW5kIGhhcy10dXJuXG4gKiBhdHRyaWJ1dGVzIGFyZSBub3QuXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqIEBtaXhlcyBtb2R1bGU6bWl4aW4vUmVhZE9ubHlBdHRyaWJ1dGVzflJlYWRPbmx5QXR0cmlidXRlc1xuICovXG5jb25zdCBUb3BQbGF5ZXJIVE1MRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgUmVhZE9ubHlBdHRyaWJ1dGVzKEhUTUxFbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVG9wUGxheWVySFRNTEVsZW1lbnQsIG9wdGlvbmFsbHkgYmFzZWQgb24gYW4gaW50aXRpYWxcbiAgICAgKiBjb25maWd1cmF0aW9uIHZpYSBhbiBvYmplY3QgcGFyYW1ldGVyIG9yIGRlY2xhcmVkIGF0dHJpYnV0ZXMgaW4gSFRNTC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSAtIEFuIGluaXRpYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlXG4gICAgICogcGxheWVyIHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLmNvbG9yIC0gVGhpcyBwbGF5ZXIncyBjb2xvciB1c2VkIGluIHRoZSBnYW1lLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSAtIFRoaXMgcGxheWVyJ3MgbmFtZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2NvbmZpZy5zY29yZV0gLSBUaGlzIHBsYXllcidzIHNjb3JlLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2NvbmZpZy5oYXNUdXJuXSAtIFRoaXMgcGxheWVyIGhhcyBhIHR1cm4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioe2NvbG9yLCBuYW1lLCBzY29yZSwgaGFzVHVybn0pIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoY29sb3IgJiYgXCJcIiAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgY29sb3IpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFLCB0aGlzLmNvbG9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShDT0xPUl9BVFRSSUJVVEUpICYmIFwiXCIgIT09IHRoaXMuZ2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgdGhpcy5nZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBjb2xvciwgd2hpY2ggaXMgYSBTdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgJiYgXCJcIiAhPT0gbmFtZSkge1xuICAgICAgICAgICAgX25hbWUuc2V0KHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUsIHRoaXMubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoTkFNRV9BVFRSSUJVVEUpICYmIFwiXCIgIT09IHRoaXMuZ2V0QXR0cmlidXRlKE5BTUVfQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgX25hbWUuc2V0KHRoaXMsIHRoaXMuZ2V0QXR0cmlidXRlKE5BTUVfQVRUUklCVVRFKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKFwiQSBQbGF5ZXIgbmVlZHMgYSBuYW1lLCB3aGljaCBpcyBhIFN0cmluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcmUpIHtcbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgc2NvcmUpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoU0NPUkVfQVRUUklCVVRFLCB0aGlzLnNjb3JlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpICYmIE51bWJlci5pc05hTihwYXJzZUludCh0aGlzLmdldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUpLCAxMCkpKSB7XG4gICAgICAgICAgICBfc2NvcmUuc2V0KHRoaXMsIHBhcnNlSW50KHRoaXMuZ2V0QXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSksIDEwKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LiBBIHBsYXllciBkb2VzIG5vdCBuZWVkIHRvIGhhdmUgYSBzY29yZS5cbiAgICAgICAgICAgIF9zY29yZS5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJ1ZSA9PT0gaGFzVHVybikge1xuICAgICAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIGhhc1R1cm4pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFLCBoYXNUdXJuKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUpKSB7XG4gICAgICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPa2F5LCBBIHBsYXllciBkb2VzIG5vdCBhbHdheXMgaGF2ZSBhIHR1cm4uXG4gICAgICAgICAgICBfaGFzVHVybi5zZXQodGhpcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIENPTE9SX0FUVFJJQlVURSxcbiAgICAgICAgICAgIE5BTUVfQVRUUklCVVRFLFxuICAgICAgICAgICAgU0NPUkVfQVRUUklCVVRFLFxuICAgICAgICAgICAgSEFTX1RVUk5fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwbGF5ZXIncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHBsYXllcidzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gX25hbWUuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgcGxheWVyJ3Mgc2NvcmUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGwgPT09IF9zY29yZS5nZXQodGhpcykgPyAwIDogX3Njb3JlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IHNjb3JlKG5ld1Njb3JlKSB7XG4gICAgICAgIF9zY29yZS5zZXQodGhpcywgbmV3U2NvcmUpO1xuICAgICAgICBpZiAobnVsbCA9PT0gbmV3U2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFNDT1JFX0FUVFJJQlVURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShTQ09SRV9BVFRSSUJVVEUsIG5ld1Njb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGEgdHVybiBmb3IgdGhpcyBwbGF5ZXIuXG4gICAgICovXG4gICAgc3RhcnRUdXJuKCkge1xuICAgICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidG9wOnN0YXJ0LXR1cm5cIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgX2hhc1R1cm4uc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShIQVNfVFVSTl9BVFRSSUJVVEUsIHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZCBhIHR1cm4gZm9yIHRoaXMgcGxheWVyLlxuICAgICAqL1xuICAgIGVuZFR1cm4oKSB7XG4gICAgICAgIF9oYXNUdXJuLnNldCh0aGlzLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoSEFTX1RVUk5fQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2VzIHRoaXMgcGxheWVyIGhhdmUgYSB0dXJuP1xuICAgICAqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGhhc1R1cm4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlID09PSBfaGFzVHVybi5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBwbGF5ZXIsIGhpcyBvciBoZXJzIG5hbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwbGF5ZXIncyBuYW1lIHJlcHJlc2VudHMgdGhlIHBsYXllciBhcyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgcGxheWVyIGVxdWFsIGFub3RoZXIgcGxheWVyP1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50fSBvdGhlciAtIFRoZSBvdGhlciBwbGF5ZXIgdG8gY29tcGFyZSB0aGlzIHBsYXllciB3aXRoLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiBlaXRoZXIgdGhlIG9iamVjdCByZWZlcmVuY2VzIGFyZSB0aGUgc2FtZVxuICAgICAqIG9yIHdoZW4gYm90aCBuYW1lIGFuZCBjb2xvciBhcmUgdGhlIHNhbWUuXG4gICAgICovXG4gICAgZXF1YWxzKG90aGVyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBcInN0cmluZ1wiID09PSB0eXBlb2Ygb3RoZXIgPyBvdGhlciA6IG90aGVyLm5hbWU7XG4gICAgICAgIHJldHVybiBvdGhlciA9PT0gdGhpcyB8fCBuYW1lID09PSB0aGlzLm5hbWU7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1wbGF5ZXJcIiwgVG9wUGxheWVySFRNTEVsZW1lbnQpO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN5c3RlbSBwbGF5ZXIuIERpY2UgYXJlIHRocm93biBieSBhIHBsYXllci4gRm9yIHNpdHVhdGlvbnNcbiAqIHdoZXJlIHlvdSB3YW50IHRvIHJlbmRlciBhIGJ1bmNoIG9mIGRpY2Ugd2l0aG91dCBuZWVkaW5nIHRoZSBjb25jZXB0IG9mIFBsYXllcnNcbiAqIHRoaXMgREVGQVVMVF9TWVNURU1fUExBWUVSIGNhbiBiZSBhIHN1YnN0aXR1dGUuIE9mIGNvdXJzZSwgaWYgeW91J2QgbGlrZSB0b1xuICogY2hhbmdlIHRoZSBuYW1lIGFuZC9vciB0aGUgY29sb3IsIGNyZWF0ZSBhbmQgdXNlIHlvdXIgb3duIFwic3lzdGVtIHBsYXllclwiLlxuICogQGNvbnN0XG4gKi9cbmNvbnN0IERFRkFVTFRfU1lTVEVNX1BMQVlFUiA9IG5ldyBUb3BQbGF5ZXJIVE1MRWxlbWVudCh7Y29sb3I6IFwicmVkXCIsIG5hbWU6IFwiKlwifSk7XG5cbmV4cG9ydCB7XG4gICAgVG9wUGxheWVySFRNTEVsZW1lbnQsXG4gICAgREVGQVVMVF9TWVNURU1fUExBWUVSXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtHcmlkTGF5b3V0fSBmcm9tIFwiLi9HcmlkTGF5b3V0LmpzXCI7XG5pbXBvcnQge0RFRkFVTFRfU1lTVEVNX1BMQVlFUn0gZnJvbSBcIi4vVG9wUGxheWVySFRNTEVsZW1lbnQuanNcIjtcblxuLyoqXG4gKiBAbW9kdWxlXG4gKi9cblxuY29uc3QgREVGQVVMVF9ESUVfU0laRSA9IDEwMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSE9MRF9EVVJBVElPTiA9IDM3NTsgLy8gbXNcbmNvbnN0IERFRkFVTFRfRFJBR0dJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuY29uc3QgREVGQVVMVF9IT0xESU5HX0RJQ0VfRElTQUJMRUQgPSBmYWxzZTtcbmNvbnN0IERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCA9IGZhbHNlO1xuXG5jb25zdCBST1dTID0gMTA7XG5jb25zdCBDT0xTID0gMTA7XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSBDT0xTICogREVGQVVMVF9ESUVfU0laRTsgLy8gcHhcbmNvbnN0IERFRkFVTFRfSEVJR0hUID0gUk9XUyAqIERFRkFVTFRfRElFX1NJWkU7IC8vIHB4XG5jb25zdCBERUZBVUxUX0RJU1BFUlNJT04gPSBNYXRoLmZsb29yKFJPV1MgLyAyKTtcblxuY29uc3QgTUlOX0RFTFRBID0gMzsgLy9weFxuXG5jb25zdCBXSURUSF9BVFRSSUJVVEUgPSBcIndpZHRoXCI7XG5jb25zdCBIRUlHSFRfQVRUUklCVVRFID0gXCJoZWlnaHRcIjtcbmNvbnN0IERJU1BFUlNJT05fQVRUUklCVVRFID0gXCJkaXNwZXJzaW9uXCI7XG5jb25zdCBESUVfU0laRV9BVFRSSUJVVEUgPSBcImRpZS1zaXplXCI7XG5jb25zdCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiZHJhZ2dpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwiaG9sZGluZy1kaWNlLWRpc2FibGVkXCI7XG5jb25zdCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSA9IFwicm90YXRpbmctZGljZS1kaXNhYmxlZFwiO1xuY29uc3QgSE9MRF9EVVJBVElPTl9BVFRSSUJVVEUgPSBcImhvbGQtZHVyYXRpb25cIjtcblxuXG5jb25zdCBwYXJzZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHROdW1iZXIgPSAwKSA9PiB7XG4gICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCk7XG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW1iZXIpID8gZGVmYXVsdE51bWJlciA6IG51bWJlcjtcbn07XG5cbmNvbnN0IHZhbGlkYXRlUG9zaXRpdmVOdW1iZXIgPSAobnVtYmVyLCBtYXhOdW1iZXIgPSBJbmZpbml0eSkgPT4ge1xuICAgIHJldHVybiAwIDw9IG51bWJlciAmJiBudW1iZXIgPCBtYXhOdW1iZXI7XG59O1xuXG5jb25zdCBnZXRQb3NpdGl2ZU51bWJlciA9IChudW1iZXJTdHJpbmcsIGRlZmF1bHRWYWx1ZSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gcGFyc2VOdW1iZXIobnVtYmVyU3RyaW5nLCBkZWZhdWx0VmFsdWUpO1xuICAgIHJldHVybiB2YWxpZGF0ZVBvc2l0aXZlTnVtYmVyKHZhbHVlKSA/IHZhbHVlIDogZGVmYXVsdFZhbHVlO1xufTtcblxuY29uc3QgZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlcih2YWx1ZVN0cmluZywgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbmNvbnN0IGdldEJvb2xlYW4gPSAoYm9vbGVhblN0cmluZywgdHJ1ZVZhbHVlLCBkZWZhdWx0VmFsdWUpID0+IHtcbiAgICBpZiAodHJ1ZVZhbHVlID09PSBib29sZWFuU3RyaW5nIHx8IFwidHJ1ZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoXCJmYWxzZVwiID09PSBib29sZWFuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IGdldEJvb2xlYW5BdHRyaWJ1dGUgPSAoZWxlbWVudCwgbmFtZSwgZGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKHZhbHVlU3RyaW5nLCBbdmFsdWVTdHJpbmcsIFwidHJ1ZVwiXSwgW1wiZmFsc2VcIl0sIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG5cbi8vIFByaXZhdGUgcHJvcGVydGllc1xuY29uc3QgX2NhbnZhcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfbGF5b3V0ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9jdXJyZW50UGxheWVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9udW1iZXJPZlJlYWR5RGljZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IGNvbnRleHQgPSAoYm9hcmQpID0+IF9jYW52YXMuZ2V0KGJvYXJkKS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbmNvbnN0IGdldFJlYWR5RGljZSA9IChib2FyZCkgPT4ge1xuICAgIGlmICh1bmRlZmluZWQgPT09IF9udW1iZXJPZlJlYWR5RGljZS5nZXQoYm9hcmQpKSB7XG4gICAgICAgIF9udW1iZXJPZlJlYWR5RGljZS5zZXQoYm9hcmQsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfbnVtYmVyT2ZSZWFkeURpY2UuZ2V0KGJvYXJkKTtcbn07XG5cbmNvbnN0IHVwZGF0ZVJlYWR5RGljZSA9IChib2FyZCwgdXBkYXRlKSA9PiB7XG4gICAgX251bWJlck9mUmVhZHlEaWNlLnNldChib2FyZCwgZ2V0UmVhZHlEaWNlKGJvYXJkKSArIHVwZGF0ZSk7XG59O1xuXG5jb25zdCBpc1JlYWR5ID0gKGJvYXJkKSA9PiBnZXRSZWFkeURpY2UoYm9hcmQpID09PSBib2FyZC5kaWNlLmxlbmd0aDtcblxuY29uc3QgdXBkYXRlQm9hcmQgPSAoYm9hcmQsIGRpY2UgPSBib2FyZC5kaWNlKSA9PiB7XG4gICAgaWYgKGlzUmVhZHkoYm9hcmQpKSB7XG4gICAgICAgIGNvbnRleHQoYm9hcmQpLmNsZWFyUmVjdCgwLCAwLCBib2FyZC53aWR0aCwgYm9hcmQuaGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpZSBvZiBkaWNlKSB7XG4gICAgICAgICAgICBkaWUucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLy8gSW50ZXJhY3Rpb24gc3RhdGVzXG5jb25zdCBOT05FID0gU3ltYm9sKFwibm9faW50ZXJhY3Rpb25cIik7XG5jb25zdCBIT0xEID0gU3ltYm9sKFwiaG9sZFwiKTtcbmNvbnN0IE1PVkUgPSBTeW1ib2woXCJtb3ZlXCIpO1xuY29uc3QgSU5ERVRFUk1JTkVEID0gU3ltYm9sKFwiaW5kZXRlcm1pbmVkXCIpO1xuY29uc3QgRFJBR0dJTkcgPSBTeW1ib2woXCJkcmFnZ2luZ1wiKTtcblxuLy8gTWV0aG9kcyB0byBoYW5kbGUgaW50ZXJhY3Rpb25cbmNvbnN0IGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzID0gKGNhbnZhcywgeFdpbmRvdywgeVdpbmRvdykgPT4ge1xuICAgIGNvbnN0IGNhbnZhc0JveCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHggPSB4V2luZG93IC0gY2FudmFzQm94LmxlZnQgKiAoY2FudmFzLndpZHRoIC8gY2FudmFzQm94LndpZHRoKTtcbiAgICBjb25zdCB5ID0geVdpbmRvdyAtIGNhbnZhc0JveC50b3AgKiAoY2FudmFzLmhlaWdodCAvIGNhbnZhc0JveC5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIHt4LCB5fTtcbn07XG5cbmNvbnN0IHNldHVwSW50ZXJhY3Rpb24gPSAoYm9hcmQpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldChib2FyZCk7XG5cbiAgICAvLyBTZXR1cCBpbnRlcmFjdGlvblxuICAgIGxldCBvcmlnaW4gPSB7fTtcbiAgICBsZXQgc3RhdGUgPSBOT05FO1xuICAgIGxldCBzdGF0aWNCb2FyZCA9IG51bGw7XG4gICAgbGV0IGRpZVVuZGVyQ3Vyc29yID0gbnVsbDtcbiAgICBsZXQgaG9sZFRpbWVvdXQgPSBudWxsO1xuXG4gICAgY29uc3QgaG9sZERpZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKEhPTEQgPT09IHN0YXRlIHx8IElOREVURVJNSU5FRCA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIHRvZ2dsZSBob2xkIC8gcmVsZWFzZVxuICAgICAgICAgICAgY29uc3QgcGxheWVyV2l0aEFUdXJuID0gYm9hcmQucXVlcnlTZWxlY3RvcihcInRvcC1wbGF5ZXItbGlzdCB0b3AtcGxheWVyW2hhcy10dXJuXVwiKTtcbiAgICAgICAgICAgIGlmIChkaWVVbmRlckN1cnNvci5pc0hlbGQoKSkge1xuICAgICAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yLnJlbGVhc2VJdChwbGF5ZXJXaXRoQVR1cm4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWVVbmRlckN1cnNvci5ob2xkSXQocGxheWVyV2l0aEFUdXJuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAgICAgdXBkYXRlQm9hcmQoYm9hcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaG9sZFRpbWVvdXQgPSBudWxsO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGhvbGRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoaG9sZERpZSwgYm9hcmQuaG9sZER1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RvcEhvbGRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaG9sZFRpbWVvdXQpO1xuICAgICAgICBob2xkVGltZW91dCA9IG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXJ0SW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKE5PTkUgPT09IHN0YXRlKSB7XG5cbiAgICAgICAgICAgIG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuXG4gICAgICAgICAgICBpZiAobnVsbCAhPT0gZGllVW5kZXJDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGludGVyYWN0aW9uIHdpdGggdGhlIGJvYXJkIHZpYSBhIGRpZVxuICAgICAgICAgICAgICAgIGlmICghYm9hcmQuZGlzYWJsZWRIb2xkaW5nRGljZSAmJiAhYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBJTkRFVEVSTUlORUQ7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SG9sZGluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBIT0xEO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEhvbGRpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFib2FyZC5kaXNhYmxlZERyYWdnaW5nRGljZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IE1PVkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2hvd0ludGVyYWN0aW9uID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRpZVVuZGVyQ3Vyc29yID0gYm9hcmQubGF5b3V0LmdldEF0KGNvbnZlcnRXaW5kb3dDb29yZGluYXRlc1RvQ2FudmFzKGNhbnZhcywgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICBpZiAoRFJBR0dJTkcgPT09IHN0YXRlKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiYmluZ1wiO1xuICAgICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJncmFiXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoTU9WRSA9PT0gc3RhdGUgfHwgSU5ERVRFUk1JTkVEID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIGEgZGllIGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgICAgICAgIC8vIElnbm9yZSBzbWFsbCBtb3ZlbWVudHNcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMob3JpZ2luLnggLSBldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMob3JpZ2luLnkgLSBldmVudC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKE1JTl9ERUxUQSA8IGR4IHx8IE1JTl9ERUxUQSA8IGR5KSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBEUkFHR0lORztcbiAgICAgICAgICAgICAgICBzdG9wSG9sZGluZygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvciA9IGJvYXJkLmRpY2UuZmlsdGVyKGRpZSA9PiBkaWUgIT09IGRpZVVuZGVyQ3Vyc29yKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZChib2FyZCwgZGljZVdpdGhvdXREaWVVbmRlckN1cnNvcik7XG4gICAgICAgICAgICAgICAgc3RhdGljQm9hcmQgPSBjb250ZXh0KGJvYXJkKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChEUkFHR0lORyA9PT0gc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gb3JpZ2luLnggLSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgZHkgPSBvcmlnaW4ueSAtIGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGRpZVVuZGVyQ3Vyc29yLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICBjb250ZXh0KGJvYXJkKS5wdXRJbWFnZURhdGEoc3RhdGljQm9hcmQsIDAsIDApO1xuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IucmVuZGVyKGNvbnRleHQoYm9hcmQpLCBib2FyZC5kaWVTaXplLCB7eDogeCAtIGR4LCB5OiB5IC0gZHl9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdG9wSW50ZXJhY3Rpb24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKG51bGwgIT09IGRpZVVuZGVyQ3Vyc29yICYmIERSQUdHSU5HID09PSBzdGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgZHggPSBvcmlnaW4ueCAtIGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICBjb25zdCBkeSA9IG9yaWdpbi55IC0gZXZlbnQuY2xpZW50WTtcblxuICAgICAgICAgICAgY29uc3Qge3gsIHl9ID0gZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBUb0Nvb3JkcyA9IGJvYXJkLmxheW91dC5zbmFwVG8oe1xuICAgICAgICAgICAgICAgIGRpZTogZGllVW5kZXJDdXJzb3IsXG4gICAgICAgICAgICAgICAgeDogeCAtIGR4LFxuICAgICAgICAgICAgICAgIHk6IHkgLSBkeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZHMgPSBudWxsICE9IHNuYXBUb0Nvb3JkcyA/IHNuYXBUb0Nvb3JkcyA6IHt4LCB5fTtcblxuICAgICAgICAgICAgZGllVW5kZXJDdXJzb3IuY29vcmRpbmF0ZXMgPSBuZXdDb29yZHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhciBzdGF0ZVxuICAgICAgICBkaWVVbmRlckN1cnNvciA9IG51bGw7XG4gICAgICAgIHN0YXRlID0gTk9ORTtcblxuICAgICAgICAvLyBSZWZyZXNoIGJvYXJkOyBSZW5kZXIgZGljZVxuICAgICAgICB1cGRhdGVCb2FyZChib2FyZCk7XG4gICAgfTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGFjdHVhbCBldmVudCBsaXN0ZW5lcnMgZGVmaW5lZCBhYm92ZS4gTWFwIHRvdWNoIGV2ZW50cyB0b1xuICAgIC8vIGVxdWl2YWxlbnQgbW91c2UgZXZlbnRzLiBCZWNhdXNlIHRoZSBcInRvdWNoZW5kXCIgZXZlbnQgZG9lcyBub3QgaGF2ZSBhXG4gICAgLy8gY2xpZW50WCBhbmQgY2xpZW50WSwgcmVjb3JkIGFuZCB1c2UgdGhlIGxhc3Qgb25lcyBmcm9tIHRoZSBcInRvdWNobW92ZVwiXG4gICAgLy8gKG9yIFwidG91Y2hzdGFydFwiKSBldmVudHMuXG5cbiAgICBsZXQgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYOiAwLCBjbGllbnRZOiAwfTtcbiAgICBjb25zdCB0b3VjaDJtb3VzZUV2ZW50ID0gKG1vdXNlRXZlbnROYW1lKSA9PiB7XG4gICAgICAgIHJldHVybiAodG91Y2hFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvdWNoRXZlbnQgJiYgMCA8IHRvdWNoRXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7Y2xpZW50WCwgY2xpZW50WX0gPSB0b3VjaEV2ZW50LnRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgdG91Y2hDb29yZGluYXRlcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KG1vdXNlRXZlbnROYW1lLCB0b3VjaENvb3JkaW5hdGVzKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0b3VjaDJtb3VzZUV2ZW50KFwibW91c2Vkb3duXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydEludGVyYWN0aW9uKTtcblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdG91Y2gybW91c2VFdmVudChcIm1vdXNlbW92ZVwiKSk7XG4gICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgIH1cblxuICAgIGlmICghYm9hcmQuZGlzYWJsZWREcmFnZ2luZ0RpY2UgfHwgIWJvYXJkLmRpc2FibGVkSG9sZGluZ0RpY2UpIHtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgc2hvd0ludGVyYWN0aW9uKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoMm1vdXNlRXZlbnQoXCJtb3VzZXVwXCIpKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgc3RvcEludGVyYWN0aW9uKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIHN0b3BJbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50IGlzIGEgY3VzdG9tIEhUTUwgZWxlbWVudCB0byByZW5kZXIgYW5kIGNvbnRyb2wgYVxuICogZGljZSBib2FyZC4gXG4gKlxuICogQGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAqL1xuY29uc3QgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwiY2xvc2VkXCJ9KTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgICAgX2NhbnZhcy5zZXQodGhpcywgY2FudmFzKTtcbiAgICAgICAgX2N1cnJlbnRQbGF5ZXIuc2V0KHRoaXMsIERFRkFVTFRfU1lTVEVNX1BMQVlFUik7XG4gICAgICAgIF9sYXlvdXQuc2V0KHRoaXMsIG5ldyBHcmlkTGF5b3V0KHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIGRpZVNpemU6IHRoaXMuZGllU2l6ZSxcbiAgICAgICAgICAgIGRpc3BlcnNpb246IHRoaXMuZGlzcGVyc2lvblxuICAgICAgICB9KSk7XG4gICAgICAgIHNldHVwSW50ZXJhY3Rpb24odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBXSURUSF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUlHSFRfQVRUUklCVVRFLFxuICAgICAgICAgICAgRElTUEVSU0lPTl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBESUVfU0laRV9BVFRSSUJVVEUsXG4gICAgICAgICAgICBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFJPVEFUSU5HX0RJQ0VfRElTQUJMRURfQVRUUklCVVRFLFxuICAgICAgICAgICAgSE9MRElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSxcbiAgICAgICAgICAgIEhPTERfRFVSQVRJT05fQVRUUklCVVRFXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBfY2FudmFzLmdldCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgV0lEVEhfQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9XSURUSCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZShXSURUSF9BVFRSSUJVVEUsIHdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSEVJR0hUX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0hFSUdIVCk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjYW52YXMuc2V0QXR0cmlidXRlKEhFSUdIVF9BVFRSSUJVVEUsIGhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJU1BFUlNJT05fQVRUUklCVVRFOiB7XG4gICAgICAgICAgICBjb25zdCBkaXNwZXJzaW9uID0gZ2V0UG9zaXRpdmVOdW1iZXIobmV3VmFsdWUsIHBhcnNlTnVtYmVyKG9sZFZhbHVlKSB8fCBERUZBVUxUX0RJU1BFUlNJT04pO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQuZGlzcGVyc2lvbiA9IGRpc3BlcnNpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERJRV9TSVpFX0FUVFJJQlVURToge1xuICAgICAgICAgICAgY29uc3QgZGllU2l6ZSA9IGdldFBvc2l0aXZlTnVtYmVyKG5ld1ZhbHVlLCBwYXJzZU51bWJlcihvbGRWYWx1ZSkgfHwgREVGQVVMVF9ESUVfU0laRSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dC5kaWVTaXplID0gZGllU2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkUm90YXRpb24gPSBnZXRCb29sZWFuKG5ld1ZhbHVlLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgZ2V0Qm9vbGVhbihvbGRWYWx1ZSwgUk9UQVRJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfUk9UQVRJTkdfRElDRV9ESVNBQkxFRCkpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQucm90YXRlID0gIWRpc2FibGVkUm90YXRpb247XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAvLyBUaGUgdmFsdWUgaXMgZGV0ZXJtaW5lZCB3aGVuIHVzaW5nIHRoZSBnZXR0ZXJcbiAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQm9hcmQodGhpcyk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6YWRkZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlUmVhZHlEaWNlKHRoaXMsIDEpO1xuICAgICAgICAgICAgaWYgKGlzUmVhZHkodGhpcykpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcC1kaWU6cmVtb3ZlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgICAgICB1cGRhdGVSZWFkeURpY2UodGhpcywgLTEpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGwgZGljZSBib2FyZHMgZG8gaGF2ZSBhIHBsYXllciBsaXN0LiBJZiB0aGVyZSBpc24ndCBvbmUgeWV0LFxuICAgICAgICAvLyBjcmVhdGUgb25lLlxuICAgICAgICBpZiAobnVsbCA9PT0gdGhpcy5xdWVyeVNlbGVjdG9yKFwidG9wLXBsYXllci1saXN0XCIpKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0b3AtcGxheWVyLWxpc3RcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgfVxuXG4gICAgYWRvcHRlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBHcmlkTGF5b3V0IHVzZWQgYnkgdGhpcyBEaWNlQm9hcmQgdG8gbGF5b3V0IHRoZSBkaWNlLlxuICAgICAqXG4gICAgICogQHR5cGUge21vZHVsZTpHcmlkTGF5b3V0fkdyaWRMYXlvdXR9XG4gICAgICovXG4gICAgZ2V0IGxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuIE5vdGUsIHRvIGFjdHVhbGx5IHRocm93IHRoZSBkaWNlIHVzZVxuICAgICAqIHtAbGluayB0aHJvd0RpY2V9LiBcbiAgICAgKlxuICAgICAqIEB0eXBlIHttb2R1bGU6VG9wRGllSFRNTEVsZW1lbnR+VG9wRGllSFRNTEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBnZXQgZGljZSgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidG9wLWRpZVwiKV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRpY2UgdGhhdCBjYW4gYmUgcHV0IG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBtYXhpbXVtIG51bWJlciBvZiBkaWNlLCAwIDwgbWF4aW11bS5cbiAgICAgKi9cbiAgICBnZXQgbWF4aW11bU51bWJlck9mRGljZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0Lm1heGltdW1OdW1iZXJPZkRpY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIFdJRFRIX0FUVFJJQlVURSwgREVGQVVMVF9XSURUSCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aXZlTnVtYmVyQXR0cmlidXRlKHRoaXMsIEhFSUdIVF9BVFRSSUJVVEUsIERFRkFVTFRfSEVJR0hUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzcGVyc2lvbiBsZXZlbCBvZiB0aGlzIGJvYXJkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGRpc3BlcnNpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBESVNQRVJTSU9OX0FUVFJJQlVURSwgREVGQVVMVF9ESVNQRVJTSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2l6ZSBvZiBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBkaWVTaXplKCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpdmVOdW1iZXJBdHRyaWJ1dGUodGhpcywgRElFX1NJWkVfQVRUUklCVVRFLCBERUZBVUxUX0RJRV9TSVpFKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGRyYWdnZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkRHJhZ2dpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBEUkFHR0lOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9EUkFHR0lOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW4gZGljZSBvbiB0aGlzIGJvYXJkIGJlIGhlbGQgYnkgYSBQbGF5ZXI/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkSG9sZGluZ0RpY2UoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuQXR0cmlidXRlKHRoaXMsIEhPTERJTkdfRElDRV9ESVNBQkxFRF9BVFRSSUJVVEUsIERFRkFVTFRfSE9MRElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyByb3RhdGluZyBkaWNlIG9uIHRoaXMgYm9hcmQgZGlzYWJsZWQ/XG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpc2FibGVkUm90YXRpbmdEaWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbGVhbkF0dHJpYnV0ZSh0aGlzLCBST1RBVElOR19ESUNFX0RJU0FCTEVEX0FUVFJJQlVURSwgREVGQVVMVF9ST1RBVElOR19ESUNFX0RJU0FCTEVEKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZHVyYXRpb24gaW4gbXMgdG8gcHJlc3MgdGhlIG1vdXNlIC8gdG91Y2ggYSBkaWUgYmVmb3JlIGl0IGJla29tZXNcbiAgICAgKiBoZWxkIGJ5IHRoZSBQbGF5ZXIuIEl0IGhhcyBvbmx5IGFuIGVmZmVjdCB3aGVuIHRoaXMuaG9sZGFibGVEaWNlID09PVxuICAgICAqIHRydWUuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBob2xkRHVyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQb3NpdGl2ZU51bWJlckF0dHJpYnV0ZSh0aGlzLCBIT0xEX0RVUkFUSU9OX0FUVFJJQlVURSwgREVGQVVMVF9IT0xEX0RVUkFUSU9OKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVycyBwbGF5aW5nIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bW9kdWxlOlRvcFBsYXllckhUTUxFbGVtZW50flRvcFBsYXllckhUTUxFbGVtZW50W119XG4gICAgICovXG4gICAgZ2V0IHBsYXllcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCJ0b3AtcGxheWVyLWxpc3RcIikucGxheWVycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcyBwbGF5ZXIsIHRocm93IHRoZSBkaWNlIG9uIHRoaXMgYm9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpUb3BQbGF5ZXJIVE1MRWxlbWVudH5Ub3BQbGF5ZXJIVE1MRWxlbWVudH0gW3BsYXllciA9IERFRkFVTFRfU1lTVEVNX1BMQVlFUl0gLSBUaGVcbiAgICAgKiBwbGF5ZXIgdGhhdCBpcyB0aHJvd2luZyB0aGUgZGljZSBvbiB0aGlzIGJvYXJkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7bW9kdWxlOlRvcERpZUhUTUxFbGVtZW50flRvcERpZUhUTUxFbGVtZW50W119IFRoZSB0aHJvd24gZGljZSBvbiB0aGlzIGJvYXJkLiBUaGlzIGxpc3Qgb2YgZGljZSBpcyB0aGUgc2FtZSBhcyB0aGlzIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50J3Mge0BzZWUgZGljZX0gcHJvcGVydHlcbiAgICAgKi9cbiAgICB0aHJvd0RpY2UocGxheWVyID0gREVGQVVMVF9TWVNURU1fUExBWUVSKSB7XG4gICAgICAgIGlmIChwbGF5ZXIgJiYgIXBsYXllci5oYXNUdXJuKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3RhcnRUdXJuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaWNlLmZvckVhY2goZGllID0+IGRpZS50aHJvd0l0KCkpO1xuICAgICAgICB1cGRhdGVCb2FyZCh0aGlzLCB0aGlzLmxheW91dC5sYXlvdXQodGhpcy5kaWNlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRpY2U7XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1kaWNlLWJvYXJkXCIsIFRvcERpY2VCb2FyZEhUTUxFbGVtZW50KTtcblxuZXhwb3J0IHtcbiAgICBUb3BEaWNlQm9hcmRIVE1MRWxlbWVudCxcbiAgICBERUZBVUxUX0RJRV9TSVpFLFxuICAgIERFRkFVTFRfSE9MRF9EVVJBVElPTixcbiAgICBERUZBVUxUX1dJRFRILFxuICAgIERFRkFVTFRfSEVJR0hULFxuICAgIERFRkFVTFRfRElTUEVSU0lPTixcbiAgICBERUZBVUxUX1JPVEFUSU5HX0RJQ0VfRElTQUJMRURcbn07XG4iLCIvKiogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTkgSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cblxuY29uc3QgVmFsaWRhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgfVxufTtcblxuY29uc3QgUGFyc2VFcnJvciA9IGNsYXNzIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICB9XG59O1xuXG5jb25zdCBJbnZhbGlkVHlwZUVycm9yID0gY2xhc3MgZXh0ZW5kcyBWYWxpZGF0aW9uRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZykge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgIH1cbn07XG5cbmNvbnN0IF92YWx1ZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfZGVmYXVsdFZhbHVlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IF9lcnJvcnMgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBUeXBlVmFsaWRhdG9yID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnMgPSBbXX0pIHtcbiAgICAgICAgX3ZhbHVlLnNldCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIF9kZWZhdWx0VmFsdWUuc2V0KHRoaXMsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIF9lcnJvcnMuc2V0KHRoaXMsIGVycm9ycyk7XG4gICAgfVxuXG4gICAgZ2V0IG9yaWdpbigpIHtcbiAgICAgICAgcmV0dXJuIF92YWx1ZS5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy5vcmlnaW4gOiBfZGVmYXVsdFZhbHVlLmdldCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgZXJyb3JzKCkge1xuICAgICAgICByZXR1cm4gX2Vycm9ycy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgICAgIHJldHVybiAwID49IHRoaXMuZXJyb3JzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBkZWZhdWx0VG8obmV3RGVmYXVsdCkge1xuICAgICAgICBfZGVmYXVsdFZhbHVlLnNldCh0aGlzLCBuZXdEZWZhdWx0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgX2NoZWNrKHtwcmVkaWNhdGUsIGJpbmRWYXJpYWJsZXMgPSBbXSwgRXJyb3JUeXBlID0gVmFsaWRhdGlvbkVycm9yfSkge1xuICAgICAgICBjb25zdCBwcm9wb3NpdGlvbiA9IHByZWRpY2F0ZS5hcHBseSh0aGlzLCBiaW5kVmFyaWFibGVzKTtcbiAgICAgICAgaWYgKCFwcm9wb3NpdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3JUeXBlKHRoaXMudmFsdWUsIGJpbmRWYXJpYWJsZXMpO1xuICAgICAgICAgICAgLy9jb25zb2xlLndhcm4oZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cblxuY29uc3QgSU5URUdFUl9ERUZBVUxUX1ZBTFVFID0gMDtcbmNvbnN0IEludGVnZXJUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBJTlRFR0VSX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IElOVEVHRVJfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dCkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkVmFsdWUgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocGFyc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZWRWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFBhcnNlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBJbnZhbGlkVHlwZUVycm9yKGlucHV0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlcih7dmFsdWUsIGRlZmF1bHRWYWx1ZSwgZXJyb3JzfSk7XG4gICAgfVxuXG4gICAgbGFyZ2VyVGhhbihuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuKSA9PiB0aGlzLm9yaWdpbiA+PSBuLFxuICAgICAgICAgICAgYmluZFZhcmlhYmxlczogW25dXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNtYWxsZXJUaGFuKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrKHtcbiAgICAgICAgICAgIHByZWRpY2F0ZTogKG4pID0+IHRoaXMub3JpZ2luIDw9IG4sXG4gICAgICAgICAgICBiaW5kVmFyaWFibGVzOiBbbl1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmV0d2VlbihuLCBtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVjayh7XG4gICAgICAgICAgICBwcmVkaWNhdGU6IChuLCBtKSA9PiB0aGlzLmxhcmdlclRoYW4obikgJiYgdGhpcy5zbWFsbGVyVGhhbihtKSxcbiAgICAgICAgICAgIGJpbmRWYXJpYWJsZXM6IFtuLCBtXVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5jb25zdCBTVFJJTkdfREVGQVVMVF9WQUxVRSA9IFwiXCI7XG5jb25zdCBTdHJpbmdUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTVFJJTkdfREVGQVVMVF9WQUxVRTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gU1RSSU5HX0RFRkFVTFRfVkFMVUU7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgICAgIGlmIChcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgSW52YWxpZFR5cGVFcnJvcihpbnB1dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoe3ZhbHVlLCBkZWZhdWx0VmFsdWUsIGVycm9yc30pO1xuICAgIH1cblxuICAgIG5vdEVtcHR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2soe1xuICAgICAgICAgICAgcHJlZGljYXRlOiAoKSA9PiBcIlwiICE9PSB0aGlzLm9yaWdpblxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5jb25zdCBDT0xPUl9ERUZBVUxUX1ZBTFVFID0gXCJibGFja1wiO1xuY29uc3QgQ29sb3JUeXBlVmFsaWRhdG9yID0gY2xhc3MgZXh0ZW5kcyBUeXBlVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBDT0xPUl9ERUZBVUxUX1ZBTFVFO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0KSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IEludmFsaWRUeXBlRXJyb3IoaW5wdXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHt2YWx1ZSwgZGVmYXVsdFZhbHVlLCBlcnJvcnN9KTtcbiAgICB9XG59O1xuXG5jb25zdCBWYWxpZGF0b3IgPSBjbGFzcyB7XG4gICAgSW50ZWdlcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXJUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBTdHJpbmcoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdUeXBlVmFsaWRhdG9yKGlucHV0KTtcbiAgICB9XG5cbiAgICBDb2xvcihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yVHlwZVZhbGlkYXRvcihpbnB1dCk7XG4gICAgfVxufTtcblxuY29uc3QgVmFsaWRhdG9yU2luZ2xldG9uID0gbmV3IFZhbGlkYXRvcigpO1xuXG5leHBvcnQge1xuICAgIFZhbGlkYXRvclNpbmdsZXRvbiBhcyB2YWxpZGF0ZVxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICogQGlnbm9yZVxuICovXG5cbi8vaW1wb3J0IHtDb25maWd1cmF0aW9uRXJyb3J9IGZyb20gXCIuL2Vycm9yL0NvbmZpZ3VyYXRpb25FcnJvci5qc1wiO1xuaW1wb3J0IHtSZWFkT25seUF0dHJpYnV0ZXN9IGZyb20gXCIuL21peGluL1JlYWRPbmx5QXR0cmlidXRlcy5qc1wiO1xuaW1wb3J0IHt2YWxpZGF0ZX0gZnJvbSBcIi4vVmFsaWRhdG9yLmpzXCI7XG5cbi8qKlxuICogQG1vZHVsZVxuICovXG5jb25zdCBDSVJDTEVfREVHUkVFUyA9IDM2MDsgLy8gZGVncmVlc1xuY29uc3QgTlVNQkVSX09GX1BJUFMgPSA2OyAvLyBEZWZhdWx0IC8gcmVndWxhciBzaXggc2lkZWQgZGllIGhhcyA2IHBpcHMgbWF4aW11bS5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBcIkl2b3J5XCI7XG5jb25zdCBERUZBVUxUX1ggPSAwOyAvLyBweFxuY29uc3QgREVGQVVMVF9ZID0gMDsgLy8gcHhcbmNvbnN0IERFRkFVTFRfUk9UQVRJT04gPSAwOyAvLyBkZWdyZWVzXG5jb25zdCBERUZBVUxUX09QQUNJVFkgPSAwLjU7XG5cbmNvbnN0IENPTE9SX0FUVFJJQlVURSA9IFwiY29sb3JcIjtcbmNvbnN0IEhFTERfQllfQVRUUklCVVRFID0gXCJoZWxkLWJ5XCI7XG5jb25zdCBQSVBTX0FUVFJJQlVURSA9IFwicGlwc1wiO1xuY29uc3QgUk9UQVRJT05fQVRUUklCVVRFID0gXCJyb3RhdGlvblwiO1xuY29uc3QgWF9BVFRSSUJVVEUgPSBcInhcIjtcbmNvbnN0IFlfQVRUUklCVVRFID0gXCJ5XCI7XG5cbmNvbnN0IEJBU0VfRElFX1NJWkUgPSAxMDA7IC8vIHB4XG5jb25zdCBCQVNFX1JPVU5ERURfQ09STkVSX1JBRElVUyA9IDE1OyAvLyBweFxuY29uc3QgQkFTRV9TVFJPS0VfV0lEVEggPSAyLjU7IC8vIHB4XG5jb25zdCBNSU5fU1RST0tFX1dJRFRIID0gMTsgLy8gcHhcbmNvbnN0IEhBTEYgPSBCQVNFX0RJRV9TSVpFIC8gMjsgLy8gcHhcbmNvbnN0IFRISVJEID0gQkFTRV9ESUVfU0laRSAvIDM7IC8vIHB4XG5jb25zdCBQSVBfU0laRSA9IEJBU0VfRElFX1NJWkUgLyAxNTsgLy9weFxuY29uc3QgUElQX0NPTE9SID0gXCJibGFja1wiO1xuXG5jb25zdCBkZWcycmFkID0gKGRlZykgPT4ge1xuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XG59O1xuXG5jb25zdCBpc1BpcE51bWJlciA9IG4gPT4ge1xuICAgIGNvbnN0IG51bWJlciA9IHBhcnNlSW50KG4sIDEwKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihudW1iZXIpICYmIDEgPD0gbnVtYmVyICYmIG51bWJlciA8PSBOVU1CRVJfT0ZfUElQUztcbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIG9mIHBpcHMgYmV0d2VlbiAxIGFuZCB0aGUgTlVNQkVSX09GX1BJUFMuXG4gKlxuICogQHJldHVybnMge051bWJlcn0gQSByYW5kb20gbnVtYmVyIG4sIDEg4omkIG4g4omkIE5VTUJFUl9PRl9QSVBTLlxuICovXG5jb25zdCByYW5kb21QaXBzID0gKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTlVNQkVSX09GX1BJUFMpICsgMTtcblxuY29uc3QgRElFX1VOSUNPREVfQ0hBUkFDVEVSUyA9IFtcIuKagFwiLFwi4pqBXCIsXCLimoJcIixcIuKag1wiLFwi4pqEXCIsXCLimoVcIl07XG5cbi8qKlxuICogQ29udmVydCBhIHVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudGluZyBhIGRpZSBmYWNlIHRvIHRoZSBudW1iZXIgb2YgcGlwcyBvZlxuICogdGhhdCBzYW1lIGRpZS4gVGhpcyBmdW5jdGlvbiBpcyB0aGUgcmV2ZXJzZSBvZiBwaXBzVG9Vbmljb2RlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1IC0gVGhlIHVuaWNvZGUgY2hhcmFjdGVyIHRvIGNvbnZlcnQgdG8gcGlwcy5cbiAqIEByZXR1cm5zIHtOdW1iZXJ8dW5kZWZpbmVkfSBUaGUgY29ycmVzcG9uZGluZyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNiwgb3JcbiAqIHVuZGVmaW5lZCBpZiB1IHdhcyBub3QgYSB1bmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRpbmcgYSBkaWUuXG4gKi9cbmNvbnN0IHVuaWNvZGVUb1BpcHMgPSAodSkgPT4ge1xuICAgIGNvbnN0IGRpZUNoYXJJbmRleCA9IERJRV9VTklDT0RFX0NIQVJBQ1RFUlMuaW5kZXhPZih1KTtcbiAgICByZXR1cm4gMCA8PSBkaWVDaGFySW5kZXggPyBkaWVDaGFySW5kZXggKyAxIDogdW5kZWZpbmVkO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtYmVyIG9mIHBpcHMsIDEg4omkIHBpcHMg4omkIDYgdG8gYSB1bmljb2RlIGNoYXJhY3RlclxuICogcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvcnJlc3BvbmRpbmcgZGllIGZhY2UuIFRoaXMgZnVuY3Rpb24gaXMgdGhlIHJldmVyc2VcbiAqIG9mIHVuaWNvZGVUb1BpcHMuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHAgLSBUaGUgbnVtYmVyIG9mIHBpcHMgdG8gY29udmVydCB0byBhIHVuaWNvZGUgY2hhcmFjdGVyLlxuICogQHJldHVybnMge1N0cmluZ3x1bmRlZmluZWR9IFRoZSBjb3JyZXNwb25kaW5nIHVuaWNvZGUgY2hhcmFjdGVycyBvclxuICogdW5kZWZpbmVkIGlmIHAgd2FzIG5vdCBiZXR3ZWVuIDEgYW5kIDYgaW5jbHVzaXZlLlxuICovXG5jb25zdCBwaXBzVG9Vbmljb2RlID0gcCA9PiBpc1BpcE51bWJlcihwKSA/IERJRV9VTklDT0RFX0NIQVJBQ1RFUlNbcCAtIDFdIDogdW5kZWZpbmVkO1xuXG5jb25zdCByZW5kZXJIb2xkID0gKGNvbnRleHQsIHgsIHksIHdpZHRoLCBjb2xvcikgPT4ge1xuICAgIGNvbnN0IFNFUEVSQVRPUiA9IHdpZHRoIC8gMzA7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IERFRkFVTFRfT1BBQ0lUWTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY29udGV4dC5hcmMoeCArIHdpZHRoLCB5ICsgd2lkdGgsIHdpZHRoIC0gU0VQRVJBVE9SLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuY29uc3QgcmVuZGVyRGllID0gKGNvbnRleHQsIHgsIHksIHdpZHRoLCBjb2xvcikgPT4ge1xuICAgIGNvbnN0IFNDQUxFID0gKHdpZHRoIC8gSEFMRik7XG4gICAgY29uc3QgSEFMRl9JTk5FUl9TSVpFID0gTWF0aC5zcXJ0KHdpZHRoICoqIDIgLyAyKTtcbiAgICBjb25zdCBJTk5FUl9TSVpFID0gMiAqIEhBTEZfSU5ORVJfU0laRTtcbiAgICBjb25zdCBST1VOREVEX0NPUk5FUl9SQURJVVMgPSBCQVNFX1JPVU5ERURfQ09STkVSX1JBRElVUyAqIFNDQUxFO1xuICAgIGNvbnN0IElOTkVSX1NJWkVfUk9VTkRFRCA9IElOTkVSX1NJWkUgLSAyICogUk9VTkRFRF9DT1JORVJfUkFESVVTO1xuICAgIGNvbnN0IFNUUk9LRV9XSURUSCA9IE1hdGgubWF4KE1JTl9TVFJPS0VfV0lEVEgsIEJBU0VfU1RST0tFX1dJRFRIICogU0NBTEUpO1xuXG4gICAgY29uc3Qgc3RhcnRYID0geCArIHdpZHRoIC0gSEFMRl9JTk5FUl9TSVpFICsgUk9VTkRFRF9DT1JORVJfUkFESVVTO1xuICAgIGNvbnN0IHN0YXJ0WSA9IHkgKyB3aWR0aCAtIEhBTEZfSU5ORVJfU0laRTtcblxuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xuICAgIGNvbnRleHQubGluZVdpZHRoID0gU1RST0tFX1dJRFRIO1xuICAgIGNvbnRleHQubW92ZVRvKHN0YXJ0WCwgc3RhcnRZKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQsIHN0YXJ0WSk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgyNzApLCBkZWcycmFkKDApKTtcbiAgICBjb250ZXh0LmxpbmVUbyhzdGFydFggKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIHN0YXJ0WSArIElOTkVSX1NJWkVfUk9VTkRFRCArIFJPVU5ERURfQ09STkVSX1JBRElVUyk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYICsgSU5ORVJfU0laRV9ST1VOREVELCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCgwKSwgZGVnMnJhZCg5MCkpO1xuICAgIGNvbnRleHQubGluZVRvKHN0YXJ0WCwgc3RhcnRZICsgSU5ORVJfU0laRSk7XG4gICAgY29udGV4dC5hcmMoc3RhcnRYLCBzdGFydFkgKyBJTk5FUl9TSVpFX1JPVU5ERUQgKyBST1VOREVEX0NPUk5FUl9SQURJVVMsIFJPVU5ERURfQ09STkVSX1JBRElVUywgZGVnMnJhZCg5MCksIGRlZzJyYWQoMTgwKSk7XG4gICAgY29udGV4dC5saW5lVG8oc3RhcnRYIC0gUk9VTkRFRF9DT1JORVJfUkFESVVTLCBzdGFydFkgKyBST1VOREVEX0NPUk5FUl9SQURJVVMpO1xuICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZICsgUk9VTkRFRF9DT1JORVJfUkFESVVTLCBST1VOREVEX0NPUk5FUl9SQURJVVMsIGRlZzJyYWQoMTgwKSwgZGVnMnJhZCgyNzApKTtcblxuICAgIGNvbnRleHQuc3Ryb2tlKCk7XG4gICAgY29udGV4dC5maWxsKCk7XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG59O1xuXG5jb25zdCByZW5kZXJQaXAgPSAoY29udGV4dCwgeCwgeSwgd2lkdGgpID0+IHtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gUElQX0NPTE9SO1xuICAgIGNvbnRleHQubW92ZVRvKHgsIHkpO1xuICAgIGNvbnRleHQuYXJjKHgsIHksIHdpZHRoLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbmNvbnN0IF9ib2FyZCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfY29sb3IgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX2hlbGRCeSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcGlwcyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBfcm90YXRpb24gPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3ggPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgX3kgPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIFRvcERpZUhUTUxFbGVtZW50IGlzIHRoZSBcInRvcC1kaWVcIiBjdXN0b20gW0hUTUxcbiAqIGVsZW1lbnRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudCkgcmVwcmVzZW50aW5nIGEgZGllXG4gKiBvbiB0aGUgZGljZSBib2FyZC5cbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICogQG1peGVzIG1vZHVsZTptaXhpbi9SZWFkT25seUF0dHJpYnV0ZXN+UmVhZE9ubHlBdHRyaWJ1dGVzXG4gKi9cbmNvbnN0IFRvcERpZUhUTUxFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBSZWFkT25seUF0dHJpYnV0ZXMoSFRNTEVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BEaWVIVE1MRWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBjb25zdCBwaXBzID0gdmFsaWRhdGVcbiAgICAgICAgICAgIC5JbnRlZ2VyKHRoaXMuZ2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5iZXR3ZWVuKDEsIDYpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKHJhbmRvbVBpcHMoKSlcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICBfcGlwcy5zZXQodGhpcywgcGlwcyk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCBwaXBzKTtcblxuICAgICAgICB0aGlzLmNvbG9yID0gdmFsaWRhdGUuQ29sb3IodGhpcy5nZXRBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9DT0xPUilcbiAgICAgICAgICAgIC52YWx1ZTtcblxuICAgICAgICB0aGlzLnJvdGF0aW9uID0gdmFsaWRhdGUuSW50ZWdlcih0aGlzLmdldEF0dHJpYnV0ZShST1RBVElPTl9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmJldHdlZW4oMCwgMzYwKVxuICAgICAgICAgICAgLmRlZmF1bHRUbyhERUZBVUxUX1JPVEFUSU9OKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueCA9IHZhbGlkYXRlLkludGVnZXIodGhpcy5nZXRBdHRyaWJ1dGUoWF9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9YKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMueSA9IHZhbGlkYXRlLkludGVnZXIodGhpcy5nZXRBdHRyaWJ1dGUoWV9BVFRSSUJVVEUpKVxuICAgICAgICAgICAgLmxhcmdlclRoYW4oMClcbiAgICAgICAgICAgIC5kZWZhdWx0VG8oREVGQVVMVF9ZKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuaGVsZEJ5ID0gdmFsaWRhdGUuU3RyaW5nKHRoaXMuZ2V0QXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKSlcbiAgICAgICAgICAgIC5ub3RFbXB0eSgpXG4gICAgICAgICAgICAuZGVmYXVsdFRvKG51bGwpXG4gICAgICAgICAgICAudmFsdWU7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBDT0xPUl9BVFRSSUJVVEUsXG4gICAgICAgICAgICBIRUxEX0JZX0FUVFJJQlVURSxcbiAgICAgICAgICAgIFBJUFNfQVRUUklCVVRFLFxuICAgICAgICAgICAgUk9UQVRJT05fQVRUUklCVVRFLFxuICAgICAgICAgICAgWF9BVFRSSUJVVEUsXG4gICAgICAgICAgICBZX0FUVFJJQlVURVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBfYm9hcmQuc2V0KHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICAgIF9ib2FyZC5nZXQodGhpcykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJ0b3AtZGllOmFkZGVkXCIpKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgX2JvYXJkLmdldCh0aGlzKS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcC1kaWU6cmVtb3ZlZFwiKSk7XG4gICAgICAgIF9ib2FyZC5zZXQodGhpcywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCB0aGlzIERpZSB0byB0aGUgY29ycmVzcG9uZGluZyB1bmljb2RlIGNoYXJhY3RlciBvZiBhIGRpZSBmYWNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBjaGFyYWN0ZXIgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlwcyBvZiB0aGlzIERpZS5cbiAgICAgKi9cbiAgICB0b1VuaWNvZGUoKSB7XG4gICAgICAgIHJldHVybiBwaXBzVG9Vbmljb2RlKHRoaXMucGlwcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VuYXRpb24gZm9yIHRoaXMgZGllLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdW5pY29kZSBzeW1ib2wgY29ycmVzcG9uZGluZyB0byB0aGUgbnVtYmVyIG9mIHBpcHNcbiAgICAgKiBvZiB0aGlzIGRpZS5cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9Vbmljb2RlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBudW1iZXIgb2YgcGlwcywgMSDiiaQgcGlwcyDiiaQgNi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHBpcHMoKSB7XG4gICAgICAgIHJldHVybiBfcGlwcy5nZXQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBEaWUncyBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gX2NvbG9yLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0IGNvbG9yKG5ld0NvbG9yKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoQ09MT1JfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIF9jb2xvci5zZXQodGhpcywgREVGQVVMVF9DT0xPUik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY29sb3Iuc2V0KHRoaXMsIG5ld0NvbG9yKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKENPTE9SX0FUVFJJQlVURSwgbmV3Q29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgUGxheWVyIHRoYXQgaXMgaG9sZGluZyB0aGlzIERpZSwgaWYgYW55LiBOdWxsIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtQbGF5ZXJ8bnVsbH0gXG4gICAgICovXG4gICAgZ2V0IGhlbGRCeSgpIHtcbiAgICAgICAgcmV0dXJuIF9oZWxkQnkuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgaGVsZEJ5KHBsYXllcikge1xuICAgICAgICBfaGVsZEJ5LnNldCh0aGlzLCBwbGF5ZXIpO1xuICAgICAgICBpZiAobnVsbCA9PT0gcGxheWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhlbGQtYnlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhlbGQtYnlcIiwgcGxheWVyLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvb3JkaW5hdGVzIG9mIHRoaXMgRGllLlxuICAgICAqXG4gICAgICogQHR5cGUge0Nvb3JkaW5hdGVzfG51bGx9XG4gICAgICovXG4gICAgZ2V0IGNvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCA9PT0gdGhpcy54IHx8IG51bGwgPT09IHRoaXMueSA/IG51bGwgOiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xuICAgIH1cbiAgICBzZXQgY29vcmRpbmF0ZXMoYykge1xuICAgICAgICBpZiAobnVsbCA9PT0gYykge1xuICAgICAgICAgICAgdGhpcy54ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMueSA9IG51bGw7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IHt4LCB5fSA9IGM7XG4gICAgICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvZXMgdGhpcyBEaWUgaGF2ZSBjb29yZGluYXRlcz9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgd2hlbiB0aGUgRGllIGRvZXMgaGF2ZSBjb29yZGluYXRlc1xuICAgICAqL1xuICAgIGhhc0Nvb3JkaW5hdGVzKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5jb29yZGluYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIGdldCB4KCkge1xuICAgICAgICByZXR1cm4gX3guZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgeChuZXdYKSB7XG4gICAgICAgIF94LnNldCh0aGlzLCBuZXdYKTtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG5ld1gpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB5IGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHkoKSB7XG4gICAgICAgIHJldHVybiBfeS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCB5KG5ld1kpIHtcbiAgICAgICAgX3kuc2V0KHRoaXMsIG5ld1kpO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgbmV3WSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJvdGF0aW9uIG9mIHRoaXMgRGllLiAwIOKJpCByb3RhdGlvbiDiiaQgMzYwLlxuICAgICAqXG4gICAgICogQHR5cGUge051bWJlcnxudWxsfVxuICAgICAqL1xuICAgIGdldCByb3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9yb3RhdGlvbi5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCByb3RhdGlvbihuZXdSKSB7XG4gICAgICAgIGlmIChudWxsID09PSBuZXdSKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInJvdGF0aW9uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uID0gbmV3UiAlIENJUkNMRV9ERUdSRUVTO1xuICAgICAgICAgICAgX3JvdGF0aW9uLnNldCh0aGlzLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJyb3RhdGlvblwiLCBub3JtYWxpemVkUm90YXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhyb3cgdGhpcyBEaWUuIFRoZSBudW1iZXIgb2YgcGlwcyB0byBhIHJhbmRvbSBudW1iZXIgbiwgMSDiiaQgbiDiiaQgNi5cbiAgICAgKiBPbmx5IGRpY2UgdGhhdCBhcmUgbm90IGJlaW5nIGhlbGQgY2FuIGJlIHRocm93bi5cbiAgICAgKlxuICAgICAqIEBmaXJlcyBcInRvcDp0aHJvdy1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUuXG4gICAgICovXG4gICAgdGhyb3dJdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICBfcGlwcy5zZXQodGhpcywgcmFuZG9tUGlwcygpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFBJUFNfQVRUUklCVVRFLCB0aGlzLnBpcHMpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInRvcDp0aHJvdy1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIGhvbGRzIHRoaXMgRGllLiBBIHBsYXllciBjYW4gb25seSBob2xkIGEgZGllIHRoYXQgaXMgbm90XG4gICAgICogYmVpbmcgaGVsZCBieSBhbm90aGVyIHBsYXllciB5ZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge21vZHVsZTpQbGF5ZXJ+UGxheWVyfSBwbGF5ZXIgLSBUaGUgcGxheWVyIHdobyB3YW50cyB0byBob2xkIHRoaXMgRGllLlxuICAgICAqIEBmaXJlcyBcInRvcDpob2xkLWRpZVwiIHdpdGggcGFyYW1ldGVycyB0aGlzIERpZSBhbmQgdGhlIHBsYXllci5cbiAgICAgKi9cbiAgICBob2xkSXQocGxheWVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0hlbGQoKSkge1xuICAgICAgICAgICAgdGhpcy5oZWxkQnkgPSBwbGF5ZXI7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwidG9wOmhvbGQtZGllXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgZGllOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIERpZSBiZWluZyBoZWxkIGJ5IGFueSBwbGF5ZXI/XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIHdoZW4gdGhpcyBEaWUgaXMgYmVpbmcgaGVsZCBieSBhbnkgcGxheWVyLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNIZWxkKCkge1xuICAgICAgICByZXR1cm4gbnVsbCAhPT0gdGhpcy5oZWxkQnk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllciByZWxlYXNlcyB0aGlzIERpZS4gQSBwbGF5ZXIgY2FuIG9ubHkgcmVsZWFzZSBkaWNlIHRoYXQgc2hlIGlzXG4gICAgICogaG9sZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bW9kdWxlOlBsYXllcn5QbGF5ZXJ9IHBsYXllciAtIFRoZSBwbGF5ZXIgd2hvIHdhbnRzIHRvIHJlbGVhc2UgdGhpcyBEaWUuXG4gICAgICogQGZpcmVzIFwidG9wOnJlbGFzZS1kaWVcIiB3aXRoIHBhcmFtZXRlcnMgdGhpcyBEaWUgYW5kIHRoZSBwbGF5ZXIgcmVsZWFzaW5nIGl0LlxuICAgICAqL1xuICAgIHJlbGVhc2VJdChwbGF5ZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWxkKCkgJiYgdGhpcy5oZWxkQnkuZXF1YWxzKHBsYXllcikpIHtcbiAgICAgICAgICAgIHRoaXMuaGVsZEJ5ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhFTERfQllfQVRUUklCVVRFKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0b3A6cmVsZWFzZS1kaWVcIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBkaWU6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHBsYXllclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbmRlciB0aGlzIERpZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0IC0gVGhlIGNhbnZhcyBjb250ZXh0IHRvIGRyYXdcbiAgICAgKiBvblxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkaWVTaXplIC0gVGhlIHNpemUgb2YgYSBkaWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjb29yZGluYXRlcyA9IHRoaXMuY29vcmRpbmF0ZXNdIC0gVGhlIGNvb3JkaW5hdGVzIHRvXG4gICAgICogZHJhdyB0aGlzIGRpZS4gQnkgZGVmYXVsdCwgdGhpcyBkaWUgaXMgZHJhd24gYXQgaXRzIG93biBjb29yZGluYXRlcyxcbiAgICAgKiBidXQgeW91IGNhbiBhbHNvIGRyYXcgaXQgZWxzZXdoZXJlIGlmIHNvIG5lZWRlZC5cbiAgICAgKi9cbiAgICByZW5kZXIoY29udGV4dCwgZGllU2l6ZSwgY29vcmRpbmF0ZXMgPSB0aGlzLmNvb3JkaW5hdGVzKSB7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gZGllU2l6ZSAvIEJBU0VfRElFX1NJWkU7XG4gICAgICAgIGNvbnN0IFNIQUxGID0gSEFMRiAqIHNjYWxlO1xuICAgICAgICBjb25zdCBTVEhJUkQgPSBUSElSRCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBTUElQX1NJWkUgPSBQSVBfU0laRSAqIHNjYWxlO1xuXG4gICAgICAgIGNvbnN0IHt4LCB5fSA9IGNvb3JkaW5hdGVzO1xuXG4gICAgICAgIGlmICh0aGlzLmlzSGVsZCgpKSB7XG4gICAgICAgICAgICByZW5kZXJIb2xkKGNvbnRleHQsIHgsIHksIFNIQUxGLCB0aGlzLmhlbGRCeS5jb2xvcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoMCAhPT0gdGhpcy5yb3RhdGlvbikge1xuICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoeCArIFNIQUxGLCB5ICsgU0hBTEYpO1xuICAgICAgICAgICAgY29udGV4dC5yb3RhdGUoZGVnMnJhZCh0aGlzLnJvdGF0aW9uKSk7XG4gICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSgtMSAqICh4ICsgU0hBTEYpLCAtMSAqICh5ICsgU0hBTEYpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbmRlckRpZShjb250ZXh0LCB4LCB5LCBTSEFMRiwgdGhpcy5jb2xvcik7XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnBpcHMpIHtcbiAgICAgICAgY2FzZSAxOiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDI6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMzoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNIQUxGLCB5ICsgU0hBTEYsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA0OiB7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIDIgKiBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDU6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgU1RISVJELCB5ICsgU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyAyICogU1RISVJELCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTSEFMRiwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNjoge1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyBTVEhJUkQsIHkgKyBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIDIgKiBTVEhJUkQsIFNQSVBfU0laRSk7XG4gICAgICAgICAgICByZW5kZXJQaXAoY29udGV4dCwgeCArIFNUSElSRCwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgcmVuZGVyUGlwKGNvbnRleHQsIHggKyAyICogU1RISVJELCB5ICsgMiAqIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNUSElSRCwgU1BJUF9TSVpFKTtcbiAgICAgICAgICAgIHJlbmRlclBpcChjb250ZXh0LCB4ICsgMiAqIFNUSElSRCwgeSArIFNIQUxGLCBTUElQX1NJWkUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDogLy8gTm8gb3RoZXIgdmFsdWVzIGFsbG93ZWQgLyBwb3NzaWJsZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgY29udGV4dFxuICAgICAgICBjb250ZXh0LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcbiAgICB9XG59O1xuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9wLWRpZVwiLCBUb3BEaWVIVE1MRWxlbWVudCk7XG5cbmV4cG9ydCB7XG4gICAgVG9wRGllSFRNTEVsZW1lbnQsXG4gICAgdW5pY29kZVRvUGlwcyxcbiAgICBwaXBzVG9Vbmljb2RlXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSHV1YiBkZSBCZWVyXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdHdlbnR5LW9uZS1waXBzLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0XG4gKiB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyXG4gKiBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFR3ZW50eS1vbmUtcGlwcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXRcbiAqIFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZXG4gKiBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0d2VudHktb25lLXBpcHMuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKiBAaWdub3JlXG4gKi9cbmltcG9ydCB7REVGQVVMVF9TWVNURU1fUExBWUVSfSBmcm9tIFwiLi9Ub3BQbGF5ZXJIVE1MRWxlbWVudC5qc1wiO1xuXG4vKipcbiAqIFRvcFBsYXllckxpc3RIVE1MRWxlbWVudCB0byBkZXNjcmliZSB0aGUgcGxheWVycyBpbiB0aGUgZ2FtZS5cbiAqXG4gKiBAZXh0ZW5kcyBIVE1MRWxlbWVudFxuICovXG5jb25zdCBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICgwID49IHRoaXMucGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoREVGQVVMVF9TWVNURU1fUExBWUVSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvcDpzdGFydC10dXJuXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgLy8gT25seSBvbmUgcGxheWVyIGNhbiBoYXZlIGEgdHVybiBhdCBhbnkgZ2l2ZW4gdGltZS5cbiAgICAgICAgICAgIHRoaXMucGxheWVyc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIocCA9PiAhcC5lcXVhbHMoZXZlbnQuZGV0YWlsLnBsYXllcikpXG4gICAgICAgICAgICAgICAgLmZvckVhY2gocCA9PiBwLmVuZFR1cm4oKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBwbGF5ZXJzIGluIHRoaXMgbGlzdC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHttb2R1bGU6VG9wUGxheWVySFRNTEVsZW1lbnR+VG9wUGxheWVySFRNTEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBnZXQgcGxheWVycygpIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidG9wLXBsYXllclwiKV07XG4gICAgfVxufTtcblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvcC1wbGF5ZXItbGlzdFwiLCBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnQpO1xuXG5leHBvcnQge1xuICAgIFRvcFBsYXllckxpc3RIVE1MRWxlbWVudFxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IEh1dWIgZGUgQmVlclxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIHR3ZW50eS1vbmUtcGlwcy5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdFxuICogdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91clxuICogb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUd2VudHktb25lLXBpcHMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0XG4gKiBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWVxuICogb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggdHdlbnR5LW9uZS1waXBzLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5pbXBvcnQge1RvcERpY2VCb2FyZEhUTUxFbGVtZW50fSBmcm9tIFwiLi9Ub3BEaWNlQm9hcmRIVE1MRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUb3BEaWVIVE1MRWxlbWVudH0gZnJvbSBcIi4vVG9wRGllSFRNTEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VG9wUGxheWVySFRNTEVsZW1lbnR9IGZyb20gXCIuL1RvcFBsYXllckhUTUxFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RvcFBsYXllckxpc3RIVE1MRWxlbWVudH0gZnJvbSBcIi4vVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50LmpzXCI7XG5cbndpbmRvdy50d2VudHlvbmVwaXBzID0gd2luZG93LnR3ZW50eW9uZXBpcHMgfHwgT2JqZWN0LmZyZWV6ZSh7XG4gICAgVkVSU0lPTjogXCIwLjAuMVwiLFxuICAgIExJQ0VOU0U6IFwiTEdQTC0zLjBcIixcbiAgICBXRUJTSVRFOiBcImh0dHBzOi8vdHdlbnR5b25lcGlwcy5vcmdcIixcbiAgICBIVE1MRWxlbWVudHM6IHtcbiAgICAgICAgVG9wRGljZUJvYXJkSFRNTEVsZW1lbnQ6IFRvcERpY2VCb2FyZEhUTUxFbGVtZW50LFxuICAgICAgICBUb3BEaWVIVE1MRWxlbWVudDogVG9wRGllSFRNTEVsZW1lbnQsXG4gICAgICAgIFRvcFBsYXllckhUTUxFbGVtZW50OiBUb3BQbGF5ZXJIVE1MRWxlbWVudCxcbiAgICAgICAgVG9wUGxheWVyTGlzdEhUTUxFbGVtZW50OiBUb3BQbGF5ZXJMaXN0SFRNTEVsZW1lbnRcbiAgICB9XG59KTtcbiJdLCJuYW1lcyI6WyJDT0xPUl9BVFRSSUJVVEUiLCJfY29sb3IiLCJ2YWxpZGF0ZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxLQUFLLENBQUM7Ozs7Ozs7O0lBUTNDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xCO0NBQ0o7O0FDeENEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUE7Ozs7QUFJQSxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEtBQUs7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7O0FBR0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDOzs7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QUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxFQUFFO1lBQ0osU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNO1NBQ1Q7UUFDRCxRQUFRO1NBQ1A7OztRQUdELE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUMxQztDQUNKLENBQUM7O0FBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUM7O0FDM2YzRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUVBOzs7OztBQUtBLE1BQU0sd0JBQXdCLEdBQUcsY0FBYyxXQUFXLENBQUM7Ozs7O0lBS3ZELFdBQVcsR0FBRztRQUNWLEtBQUssRUFBRSxDQUFDO0tBQ1g7O0lBRUQsaUJBQWlCLEdBQUc7UUFDaEIsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQzNDOztRQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssS0FBSzs7WUFFL0MsSUFBSSxDQUFDLE9BQU87aUJBQ1AsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNsQyxDQUFDLENBQUM7S0FDTjs7SUFFRCxvQkFBb0IsR0FBRztLQUN0Qjs7Ozs7OztJQU9ELElBQUksT0FBTyxHQUFHO1FBQ1YsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7S0FDdkQ7Q0FDSixDQUFDOztBQUVGLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLENBQUM7O0FDN0QxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBS0EsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDekQsT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsT0FBTyxFQUFFLDJCQUEyQjtJQUNwQyxZQUFZLEVBQUU7UUFDVix1QkFBdUIsRUFBRSx1QkFBdUI7UUFDaEQsaUJBQWlCLEVBQUUsaUJBQWlCO1FBQ3BDLG9CQUFvQixFQUFFLG9CQUFvQjtRQUMxQyx3QkFBd0IsRUFBRSx3QkFBd0I7S0FDckQ7Q0FDSixDQUFDLENBQUMiLCJwcmVFeGlzdGluZ0NvbW1lbnQiOiIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpwdWRXeHNMQ0p6YjNWeVkyVnpJanBiSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OWxjbkp2Y2k5RGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlIzSnBaRXhoZVc5MWRDNXFjeUlzSWk5b2IyMWxMMmgxZFdJdlVISnZhbVZqZEhNdmRIZGxiblI1TFc5dVpTMXdhWEJ6TDNOeVl5OXRhWGhwYmk5U1pXRmtUMjVzZVVGMGRISnBZblYwWlhNdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUXVhbk1pTENJdmFHOXRaUzlvZFhWaUwxQnliMnBsWTNSekwzUjNaVzUwZVMxdmJtVXRjR2x3Y3k5emNtTXZWRzl3UkdsalpVSnZZWEprU0ZSTlRFVnNaVzFsYm5RdWFuTWlMQ0l2YUc5dFpTOW9kWFZpTDFCeWIycGxZM1J6TDNSM1pXNTBlUzF2Ym1VdGNHbHdjeTl6Y21NdlZtRnNhV1JoZEc5eUxtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwxUnZjRVJwWlVoVVRVeEZiR1Z0Wlc1MExtcHpJaXdpTDJodmJXVXZhSFYxWWk5UWNtOXFaV04wY3k5MGQyVnVkSGt0YjI1bExYQnBjSE12YzNKakwxUnZjRkJzWVhsbGNreHBjM1JJVkUxTVJXeGxiV1Z1ZEM1cWN5SXNJaTlvYjIxbEwyaDFkV0l2VUhKdmFtVmpkSE12ZEhkbGJuUjVMVzl1WlMxd2FYQnpMM055WXk5MGQyVnVkSGt0YjI1bExYQnBjSE11YW5NaVhTd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lMeW9xSUZ4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1Y2JpOHFLbHh1SUNvZ1FHMXZaSFZzWlZ4dUlDb3ZYRzVjYmk4cUtseHVJQ29nUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5WEc0Z0tseHVJQ29nUUdWNGRHVnVaSE1nUlhKeWIzSmNiaUFxTDF4dVkyOXVjM1FnUTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJGY25KdmNpQjdYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEY21WaGRHVWdZU0J1WlhjZ1EyOXVabWxuZFhKaGRHbHZia1Z5Y205eUlIZHBkR2dnYldWemMyRm5aUzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnRaWE56WVdkbElDMGdWR2hsSUcxbGMzTmhaMlVnWVhOemIyTnBZWFJsWkNCM2FYUm9JSFJvYVhOY2JpQWdJQ0FnS2lCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJdVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWTI5dWMzUnlkV04wYjNJb2JXVnpjMkZuWlNrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lodFpYTnpZV2RsS1R0Y2JpQWdJQ0I5WEc1OU8xeHVYRzVsZUhCdmNuUWdlME52Ym1acFozVnlZWFJwYjI1RmNuSnZjbjA3WEc0aUxDSXZLaW9nWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYm1sdGNHOXlkQ0I3UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5ZlNCbWNtOXRJRndpTGk5bGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1YW5OY0lqdGNibHh1THlvcVhHNGdLaUJBYlc5a2RXeGxYRzRnS2k5Y2JseHVZMjl1YzNRZ1JsVk1URjlEU1ZKRFRFVmZTVTVmUkVWSFVrVkZVeUE5SURNMk1EdGNibHh1WTI5dWMzUWdjbUZ1Wkc5dGFYcGxRMlZ1ZEdWeUlEMGdLRzRwSUQwK0lIdGNiaUFnSUNCeVpYUjFjbTRnS0RBdU5TQThQU0JOWVhSb0xuSmhibVJ2YlNncElEOGdUV0YwYUM1bWJHOXZjaUE2SUUxaGRHZ3VZMlZwYkNrdVkyRnNiQ2d3TENCdUtUdGNibjA3WEc1Y2JpOHZJRkJ5YVhaaGRHVWdabWxsYkdSelhHNWpiMjV6ZENCZmQybGtkR2dnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMmhsYVdkb2RDQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZlkyOXNjeUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZjbTkzY3lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWkdsalpTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWpiMjV6ZENCZlpHbGxVMmw2WlNBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmWkdsemNHVnljMmx2YmlBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmY205MFlYUmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibHh1THlvcVhHNGdLaUJBZEhsd1pXUmxaaUI3VDJKcVpXTjBmU0JIY21sa1RHRjViM1YwUTI5dVptbG5kWEpoZEdsdmJseHVJQ29nUUhCeWIzQmxjblI1SUh0T2RXMWlaWEo5SUdOdmJtWnBaeTUzYVdSMGFDQXRJRlJvWlNCdGFXNXBiV0ZzSUhkcFpIUm9JRzltSUhSb2FYTmNiaUFxSUVkeWFXUk1ZWGx2ZFhRZ2FXNGdjR2w0Wld4ekxqdGNiaUFxSUVCd2NtOXdaWEowZVNCN1RuVnRZbVZ5ZlNCamIyNW1hV2N1YUdWcFoyaDBYU0F0SUZSb1pTQnRhVzVwYldGc0lHaGxhV2RvZENCdlpseHVJQ29nZEdocGN5QkhjbWxrVEdGNWIzVjBJR2x1SUhCcGVHVnNjeTR1WEc0Z0tpQkFjSEp2Y0dWeWRIa2dlMDUxYldKbGNuMGdZMjl1Wm1sbkxtUnBjM0JsY25OcGIyNGdMU0JVYUdVZ1pHbHpkR0Z1WTJVZ1puSnZiU0IwYUdVZ1kyVnVkR1Z5SUc5bUlIUm9aVnh1SUNvZ2JHRjViM1YwSUdFZ1pHbGxJR05oYmlCaVpTQnNZWGx2ZFhRdVhHNGdLaUJBY0hKdmNHVnlkSGtnZTA1MWJXSmxjbjBnWTI5dVptbG5MbVJwWlZOcGVtVWdMU0JVYUdVZ2MybDZaU0J2WmlCaElHUnBaUzVjYmlBcUwxeHVYRzR2S2lwY2JpQXFJRWR5YVdSTVlYbHZkWFFnYUdGdVpHeGxjeUJzWVhscGJtY2diM1YwSUhSb1pTQmthV05sSUc5dUlHRWdSR2xqWlVKdllYSmtMbHh1SUNvdlhHNWpiMjV6ZENCSGNtbGtUR0Y1YjNWMElEMGdZMnhoYzNNZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUVkeWFXUk1ZWGx2ZFhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTBkeWFXUk1ZWGx2ZFhSRGIyNW1hV2QxY21GMGFXOXVmU0JqYjI1bWFXY2dMU0JVYUdVZ1kyOXVabWxuZFhKaGRHbHZiaUJ2WmlCMGFHVWdSM0pwWkV4aGVXOTFkRnh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLSHRjYmlBZ0lDQWdJQ0FnZDJsa2RHZ3NYRzRnSUNBZ0lDQWdJR2hsYVdkb2RDeGNiaUFnSUNBZ0lDQWdaR2x6Y0dWeWMybHZiaXhjYmlBZ0lDQWdJQ0FnWkdsbFUybDZaVnh1SUNBZ0lIMGdQU0I3ZlNrZ2UxeHVJQ0FnSUNBZ0lDQmZaR2xqWlM1elpYUW9kR2hwY3l3Z1cxMHBPMXh1SUNBZ0lDQWdJQ0JmWkdsbFUybDZaUzV6WlhRb2RHaHBjeXdnTVNrN1hHNGdJQ0FnSUNBZ0lGOTNhV1IwYUM1elpYUW9kR2hwY3l3Z01DazdYRzRnSUNBZ0lDQWdJRjlvWldsbmFIUXVjMlYwS0hSb2FYTXNJREFwTzF4dUlDQWdJQ0FnSUNCZmNtOTBZWFJsTG5ObGRDaDBhR2x6TENCMGNuVmxLVHRjYmx4dUlDQWdJQ0FnSUNCMGFHbHpMbVJwYzNCbGNuTnBiMjRnUFNCa2FYTndaWEp6YVc5dU8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG1ScFpWTnBlbVVnUFNCa2FXVlRhWHBsTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbmRwWkhSb0lEMGdkMmxrZEdnN1hHNGdJQ0FnSUNBZ0lIUm9hWE11YUdWcFoyaDBJRDBnYUdWcFoyaDBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCM2FXUjBhQ0JwYmlCd2FYaGxiSE1nZFhObFpDQmllU0IwYUdseklFZHlhV1JNWVhsdmRYUXVYRzRnSUNBZ0lDb2dRSFJvY205M2N5QnRiMlIxYkdVNlpYSnliM0l2UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TGtOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2lCWGFXUjBhQ0ErUFNBd1hHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjBnWEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhkcFpIUm9LQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDNkcFpIUm9MbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpaWFFnZDJsa2RHZ29keWtnZTF4dUlDQWdJQ0FnSUNCcFppQW9NQ0ErSUhjcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lGZHBaSFJvSUhOb2IzVnNaQ0JpWlNCaElHNTFiV0psY2lCc1lYSm5aWElnZEdoaGJpQXdMQ0JuYjNRZ0p5UjdkMzBuSUdsdWMzUmxZV1F1WUNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdYM2RwWkhSb0xuTmxkQ2gwYUdsekxDQjNLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWZZMkZzWTNWc1lYUmxSM0pwWkNoMGFHbHpMbmRwWkhSb0xDQjBhR2x6TG1obGFXZG9kQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nVkdobElHaGxhV2RvZENCcGJpQndhWGhsYkhNZ2RYTmxaQ0JpZVNCMGFHbHpJRWR5YVdSTVlYbHZkWFF1SUZ4dUlDQWdJQ0FxSUVCMGFISnZkM01nYlc5a2RXeGxPbVZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNpNURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSWdTR1ZwWjJoMElENDlJREJjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUIwZVhCbElIdE9kVzFpWlhKOVhHNGdJQ0FnSUNvdlhHNGdJQ0FnWjJWMElHaGxhV2RvZENncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOW9aV2xuYUhRdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhObGRDQm9aV2xuYUhRb2FDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb01DQStJR2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lvWUVobGFXZG9kQ0J6YUc5MWJHUWdZbVVnWVNCdWRXMWlaWElnYkdGeVoyVnlJSFJvWVc0Z01Dd2daMjkwSUNja2UyaDlKeUJwYm5OMFpXRmtMbUFwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lGOW9aV2xuYUhRdWMyVjBLSFJvYVhNc0lHZ3BPMXh1SUNBZ0lDQWdJQ0IwYUdsekxsOWpZV3hqZFd4aGRHVkhjbWxrS0hSb2FYTXVkMmxrZEdnc0lIUm9hWE11YUdWcFoyaDBLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pHbGpaU0IwYUdGMElHTmhiaUJpWlNCc1lYbHZkWFFnYjI0Z2RHaHBjeUJIY21sa1RHRjViM1YwTGlCVWFHbHpYRzRnSUNBZ0lDb2diblZ0WW1WeUlHbHpJRDQ5SURBdUlGSmxZV1FnYjI1c2VTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUcxaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TGw5amIyeHpJQ29nZEdocGN5NWZjbTkzY3p0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdaR2x6Y0dWeWMybHZiaUJzWlhabGJDQjFjMlZrSUdKNUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM0Z1ZHaGxJR1JwYzNCbGNuTnBiMjRnYkdWMlpXeGNiaUFnSUNBZ0tpQnBibVJwWTJGMFpYTWdkR2hsSUdScGMzUmhibU5sSUdaeWIyMGdkR2hsSUdObGJuUmxjaUJrYVdObElHTmhiaUJpWlNCc1lYbHZkWFF1SUZWelpTQXhJR1p2Y2lCaFhHNGdJQ0FnSUNvZ2RHbG5hSFFnY0dGamEyVmtJR3hoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBhSEp2ZDNNZ2JXOWtkV3hsT21WeWNtOXlMME52Ym1acFozVnlZWFJwYjI1RmNuSnZjaTVEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0lnUkdsemNHVnljMmx2YmlBK1BTQXdYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1pHbHpjR1Z5YzJsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlrYVhOd1pYSnphVzl1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WlhRZ1pHbHpjR1Z5YzJsdmJpaGtLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ3dJRDRnWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y2loZ1JHbHpjR1Z5YzJsdmJpQnphRzkxYkdRZ1ltVWdZU0J1ZFcxaVpYSWdiR0Z5WjJWeUlIUm9ZVzRnTUN3Z1oyOTBJQ2NrZTJSOUp5QnBibk4wWldGa0xtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmWkdsemNHVnljMmx2Ymk1elpYUW9kR2hwY3l3Z1pDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhOcGVtVWdiMllnWVNCa2FXVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkR2h5YjNkeklHMXZaSFZzWlRwbGNuSnZjaTlEYjI1bWFXZDFjbUYwYVc5dVJYSnliM0l1UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5SUVScFpWTnBlbVVnUGowZ01GeHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScFpWTnBlbVVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlpHbGxVMmw2WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYzJWMElHUnBaVk5wZW1Vb1pITXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQajBnWkhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lHUnBaVk5wZW1VZ2MyaHZkV3hrSUdKbElHRWdiblZ0WW1WeUlHeGhjbWRsY2lCMGFHRnVJREVzSUdkdmRDQW5KSHRrYzMwbklHbHVjM1JsWVdRdVlDazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWDJScFpWTnBlbVV1YzJWMEtIUm9hWE1zSUdSektUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1ZlkyRnNZM1ZzWVhSbFIzSnBaQ2gwYUdsekxuZHBaSFJvTENCMGFHbHpMbWhsYVdkb2RDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1oyVjBJSEp2ZEdGMFpTZ3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjaUE5SUY5eWIzUmhkR1V1WjJWMEtIUm9hWE1wTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrSUQwOVBTQnlJRDhnZEhKMVpTQTZJSEk3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMlYwSUhKdmRHRjBaU2h5S1NCN1hHNGdJQ0FnSUNBZ0lGOXliM1JoZEdVdWMyVjBLSFJvYVhNc0lISXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCdWRXMWlaWElnYjJZZ2NtOTNjeUJwYmlCMGFHbHpJRWR5YVdSTVlYbHZkWFF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRPZFcxaVpYSjlJRlJvWlNCdWRXMWlaWElnYjJZZ2NtOTNjeXdnTUNBOElISnZkM011WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWDNKdmQzTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJmY205M2N5NW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUc1MWJXSmxjaUJ2WmlCamIyeDFiVzV6SUdsdUlIUm9hWE1nUjNKcFpFeGhlVzkxZEM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA1MWJXSmxjbjBnVkdobElHNTFiV0psY2lCdlppQmpiMngxYlc1ekxDQXdJRHdnWTI5c2RXMXVjeTVjYmlBZ0lDQWdLaUJBY0hKcGRtRjBaVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0JmWTI5c2N5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRjlqYjJ4ekxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnWTJWdWRHVnlJR05sYkd3Z2FXNGdkR2hwY3lCSGNtbGtUR0Y1YjNWMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FISmxkSFZ5YmlCN1QySnFaV04wZlNCVWFHVWdZMlZ1ZEdWeUlDaHliM2NzSUdOdmJDa3VYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdYMk5sYm5SbGNpZ3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjbTkzSUQwZ2NtRnVaRzl0YVhwbFEyVnVkR1Z5S0hSb2FYTXVYM0p2ZDNNZ0x5QXlLU0F0SURFN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdOdmJDQTlJSEpoYm1SdmJXbDZaVU5sYm5SbGNpaDBhR2x6TGw5amIyeHpJQzhnTWlrZ0xTQXhPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUI3Y205M0xDQmpiMng5TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUV4aGVXOTFkQ0JrYVdObElHOXVJSFJvYVhNZ1IzSnBaRXhoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN2JXOWtkV3hsT2tScFpYNUVhV1ZiWFgwZ1pHbGpaU0F0SUZSb1pTQmthV05sSUhSdklHeGhlVzkxZENCdmJpQjBhR2x6SUV4aGVXOTFkQzVjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHR0YjJSMWJHVTZSR2xsZmtScFpWdGRmU0JVYUdVZ2MyRnRaU0JzYVhOMElHOW1JR1JwWTJVc0lHSjFkQ0J1YjNjZ2JHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhSb2NtOTNjeUI3Ylc5a2RXeGxPbVZ5Y205eUwwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuNURiMjVtYVdkMWNtRjBhVzl1UlhKeWIzSjlJRlJvWlNCdWRXMWlaWElnYjJaY2JpQWdJQ0FnS2lCa2FXTmxJSE5vYjNWc1pDQnViM1FnWlhoalpXVmtJSFJvWlNCdFlYaHBiWFZ0SUc1MWJXSmxjaUJ2WmlCa2FXTmxJSFJvYVhNZ1RHRjViM1YwSUdOaGJseHVJQ0FnSUNBcUlHeGhlVzkxZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JzWVhsdmRYUW9aR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvWkdsalpTNXNaVzVuZEdnZ1BpQjBhR2x6TG0xaGVHbHRkVzFPZFcxaVpYSlBaa1JwWTJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1lGUm9aU0J1ZFcxaVpYSWdiMllnWkdsalpTQjBhR0YwSUdOaGJpQmlaU0JzWVhsdmRYUWdhWE1nSkh0MGFHbHpMbTFoZUdsdGRXMU9kVzFpWlhKUFprUnBZMlY5TENCbmIzUWdKSHRrYVdObExteGxibWRvZEgwZ1pHbGpaU0JwYm5OMFpXRmtMbUFwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVZ1BTQmJYVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR2xqWlZSdlRHRjViM1YwSUQwZ1cxMDdYRzVjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCa2FXVWdiMllnWkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1JwWlM1b1lYTkRiMjl5WkdsdVlYUmxjeWdwSUNZbUlHUnBaUzVwYzBobGJHUW9LU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFUnBZMlVnZEdoaGRDQmhjbVVnWW1WcGJtY2dhR1ZzWkNCaGJtUWdhR0YyWlNCaVpXVnVJR3hoZVc5MWRDQmlaV1p2Y21VZ2MyaHZkV3hrWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2EyVmxjQ0IwYUdWcGNpQmpkWEp5Wlc1MElHTnZiM0prYVc1aGRHVnpJR0Z1WkNCeWIzUmhkR2x2Ymk0Z1NXNGdiM1JvWlhJZ2QyOXlaSE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2RHaGxjMlVnWkdsalpTQmhjbVVnYzJ0cGNIQmxaQzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaUzV3ZFhOb0tHUnBaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBZMlZVYjB4aGVXOTFkQzV3ZFhOb0tHUnBaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0J0WVhnZ1BTQk5ZWFJvTG0xcGJpaGthV05sTG14bGJtZDBhQ0FxSUhSb2FYTXVaR2x6Y0dWeWMybHZiaXdnZEdocGN5NXRZWGhwYlhWdFRuVnRZbVZ5VDJaRWFXTmxLVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZWFpoYVd4aFlteGxRMlZzYkhNZ1BTQjBhR2x6TGw5amIyMXdkWFJsUVhaaGFXeGhZbXhsUTJWc2JITW9iV0Y0TENCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlNrN1hHNWNiaUFnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JrYVdVZ2IyWWdaR2xqWlZSdlRHRjViM1YwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlZVzVrYjIxSmJtUmxlQ0E5SUUxaGRHZ3VabXh2YjNJb1RXRjBhQzV5WVc1a2IyMG9LU0FxSUdGMllXbHNZV0pzWlVObGJHeHpMbXhsYm1kMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J5WVc1a2IyMURaV3hzSUQwZ1lYWmhhV3hoWW14bFEyVnNiSE5iY21GdVpHOXRTVzVrWlhoZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWVhaaGFXeGhZbXhsUTJWc2JITXVjM0JzYVdObEtISmhibVJ2YlVsdVpHVjRMQ0F4S1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWkdsbExtTnZiM0prYVc1aGRHVnpJRDBnZEdocGN5NWZiblZ0WW1WeVZHOURiMjl5WkdsdVlYUmxjeWh5WVc1a2IyMURaV3hzS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JwWlM1eWIzUmhkR2x2YmlBOUlIUm9hWE11Y205MFlYUmxJRDhnVFdGMGFDNXliM1Z1WkNoTllYUm9MbkpoYm1SdmJTZ3BJQ29nUmxWTVRGOURTVkpEVEVWZlNVNWZSRVZIVWtWRlV5a2dPaUJ1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnWVd4eVpXRmtlVXhoZVc5MWRFUnBZMlV1Y0hWemFDaGthV1VwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdYMlJwWTJVdWMyVjBLSFJvYVhNc0lHRnNjbVZoWkhsTVlYbHZkWFJFYVdObEtUdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZV3h5WldGa2VVeGhlVzkxZEVScFkyVTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl0Y0hWMFpTQmhJR3hwYzNRZ2QybDBhQ0JoZG1GcGJHRmliR1VnWTJWc2JITWdkRzhnY0d4aFkyVWdaR2xqWlNCdmJpNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCdFlYZ2dMU0JVYUdVZ2JuVnRZbVZ5SUdWdGNIUjVJR05sYkd4eklIUnZJR052YlhCMWRHVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdEVhV1ZiWFgwZ1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVZ0xTQkJJR3hwYzNRZ2QybDBhQ0JrYVdObElIUm9ZWFFnYUdGMlpTQmhiSEpsWVdSNUlHSmxaVzRnYkdGNWIzVjBMbHh1SUNBZ0lDQXFJRnh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDVWYldKbGNsdGRmU0JVYUdVZ2JHbHpkQ0J2WmlCaGRtRnBiR0ZpYkdVZ1kyVnNiSE1nY21Wd2NtVnpaVzUwWldRZ1lua2dkR2hsYVhJZ2JuVnRZbVZ5TGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMk52YlhCMWRHVkJkbUZwYkdGaWJHVkRaV3hzY3lodFlYZ3NJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR0YyWVdsc1lXSnNaU0E5SUc1bGR5QlRaWFFvS1R0Y2JpQWdJQ0FnSUNBZ2JHVjBJR3hsZG1Wc0lEMGdNRHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV0Y0VEdWMlpXd2dQU0JOWVhSb0xtMXBiaWgwYUdsekxsOXliM2R6TENCMGFHbHpMbDlqYjJ4ektUdGNibHh1SUNBZ0lDQWdJQ0IzYUdsc1pTQW9ZWFpoYVd4aFlteGxMbk5wZW1VZ1BDQnRZWGdnSmlZZ2JHVjJaV3dnUENCdFlYaE1aWFpsYkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCalpXeHNJRzltSUhSb2FYTXVYMk5sYkd4elQyNU1aWFpsYkNoc1pYWmxiQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kVzVrWldacGJtVmtJQ0U5UFNCalpXeHNJQ1ltSUhSb2FYTXVYMk5sYkd4SmMwVnRjSFI1S0dObGJHd3NJR0ZzY21WaFpIbE1ZWGx2ZFhSRWFXTmxLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkbUZwYkdGaWJHVXVZV1JrS0dObGJHd3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2JHVjJaV3dyS3p0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQkJjbkpoZVM1bWNtOXRLR0YyWVdsc1lXSnNaU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTJGc1kzVnNZWFJsSUdGc2JDQmpaV3hzY3lCdmJpQnNaWFpsYkNCbWNtOXRJSFJvWlNCalpXNTBaWElnYjJZZ2RHaGxJR3hoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCc1pYWmxiQ0F0SUZSb1pTQnNaWFpsYkNCbWNtOXRJSFJvWlNCalpXNTBaWElnYjJZZ2RHaGxJR3hoZVc5MWRDNGdNRnh1SUNBZ0lDQXFJR2x1WkdsallYUmxjeUIwYUdVZ1kyVnVkR1Z5TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VTJWMFBFNTFiV0psY2o1OUlIUm9aU0JqWld4c2N5QnZiaUIwYUdVZ2JHVjJaV3dnYVc0Z2RHaHBjeUJzWVhsdmRYUWdjbVZ3Y21WelpXNTBaV1FnWW5sY2JpQWdJQ0FnS2lCMGFHVnBjaUJ1ZFcxaVpYSXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyVnNiSE5QYmt4bGRtVnNLR3hsZG1Wc0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHTmxiR3h6SUQwZ2JtVjNJRk5sZENncE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCalpXNTBaWElnUFNCMGFHbHpMbDlqWlc1MFpYSTdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQVDA5SUd4bGRtVnNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpaV3hzY3k1aFpHUW9kR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLR05sYm5SbGNpa3BPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ2NtOTNJRDBnWTJWdWRHVnlMbkp2ZHlBdElHeGxkbVZzT3lCeWIzY2dQRDBnWTJWdWRHVnlMbkp2ZHlBcklHeGxkbVZzT3lCeWIzY3JLeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdObGJHeHpMbUZrWkNoMGFHbHpMbDlqWld4c1ZHOU9kVzFpWlhJb2UzSnZkeXdnWTI5c09pQmpaVzUwWlhJdVkyOXNJQzBnYkdWMlpXeDlLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJWc2JITXVZV1JrS0hSb2FYTXVYMk5sYkd4VWIwNTFiV0psY2loN2NtOTNMQ0JqYjJ3NklHTmxiblJsY2k1amIyd2dLeUJzWlhabGJIMHBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ1kyOXNJRDBnWTJWdWRHVnlMbU52YkNBdElHeGxkbVZzSUNzZ01Uc2dZMjlzSUR3Z1kyVnVkR1Z5TG1OdmJDQXJJR3hsZG1Wc095QmpiMndyS3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTmxiR3h6TG1Ga1pDaDBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lM0p2ZHpvZ1kyVnVkR1Z5TG5KdmR5QXRJR3hsZG1Wc0xDQmpiMng5S1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyVnNiSE11WVdSa0tIUm9hWE11WDJObGJHeFViMDUxYldKbGNpaDdjbTkzT2lCalpXNTBaWEl1Y205M0lDc2diR1YyWld3c0lHTnZiSDBwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCalpXeHNjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJFYjJWeklHTmxiR3dnWTI5dWRHRnBiaUJoSUdObGJHd2dabkp2YlNCaGJISmxZV1I1VEdGNWIzVjBSR2xqWlQ5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JqWld4c0lDMGdRU0JqWld4c0lHbHVJR3hoZVc5MWRDQnlaWEJ5WlhObGJuUmxaQ0JpZVNCaElHNTFiV0psY2k1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTBScFpWdGRmU0JoYkhKbFlXUjVUR0Y1YjNWMFJHbGpaU0F0SUVFZ2JHbHpkQ0J2WmlCa2FXTmxJSFJvWVhRZ2FHRjJaU0JoYkhKbFlXUjVJR0psWlc0Z2JHRjViM1YwTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3UW05dmJHVmhibjBnVkhKMVpTQnBaaUJqWld4c0lHUnZaWE1nYm05MElHTnZiblJoYVc0Z1lTQmthV1V1WEc0Z0lDQWdJQ29nUUhCeWFYWmhkR1ZjYmlBZ0lDQWdLaTljYmlBZ0lDQmZZMlZzYkVselJXMXdkSGtvWTJWc2JDd2dZV3h5WldGa2VVeGhlVzkxZEVScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFZ1WkdWbWFXNWxaQ0E5UFQwZ1lXeHlaV0ZrZVV4aGVXOTFkRVJwWTJVdVptbHVaQ2hrYVdVZ1BUNGdZMlZzYkNBOVBUMGdkR2hwY3k1ZlkyOXZjbVJwYm1GMFpYTlViMDUxYldKbGNpaGthV1V1WTI5dmNtUnBibUYwWlhNcEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQkRiMjUyWlhKMElHRWdiblZ0WW1WeUlIUnZJR0VnWTJWc2JDQW9jbTkzTENCamIyd3BYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JpQXRJRlJvWlNCdWRXMWlaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdZMlZzYkZ4dUlDQWdJQ0FxSUVCeVpYUjFjbTV6SUh0UFltcGxZM1I5SUZKbGRIVnliaUIwYUdVZ1kyVnNiQ0FvZTNKdmR5d2dZMjlzZlNrZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ1TGx4dUlDQWdJQ0FxSUVCd2NtbDJZWFJsWEc0Z0lDQWdJQ292WEc0Z0lDQWdYMjUxYldKbGNsUnZRMlZzYkNodUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjdjbTkzT2lCTllYUm9MblJ5ZFc1aktHNGdMeUIwYUdsekxsOWpiMnh6S1N3Z1kyOXNPaUJ1SUNVZ2RHaHBjeTVmWTI5c2MzMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRMjl1ZG1WeWRDQmhJR05sYkd3Z2RHOGdZU0J1ZFcxaVpYSmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1QySnFaV04wZlNCalpXeHNJQzBnVkdobElHTmxiR3dnZEc4Z1kyOXVkbVZ5ZENCMGJ5QnBkSE1nYm5WdFltVnlMbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMDUxYldKbGNueDFibVJsWm1sdVpXUjlJRlJvWlNCdWRXMWlaWElnWTI5eWNtVnpjRzl1WkdsdVp5QjBieUIwYUdVZ1kyVnNiQzVjYmlBZ0lDQWdLaUJTWlhSMWNtNXpJSFZ1WkdWbWFXNWxaQ0IzYUdWdUlIUm9aU0JqWld4c0lHbHpJRzV2ZENCdmJpQjBhR1VnYkdGNWIzVjBYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyVnNiRlJ2VG5WdFltVnlLSHR5YjNjc0lHTnZiSDBwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLREFnUEQwZ2NtOTNJQ1ltSUhKdmR5QThJSFJvYVhNdVgzSnZkM01nSmlZZ01DQThQU0JqYjJ3Z0ppWWdZMjlzSUR3Z2RHaHBjeTVmWTI5c2N5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhKdmR5QXFJSFJvYVhNdVgyTnZiSE1nS3lCamIydzdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFZ1WkdWbWFXNWxaRHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjI1MlpYSjBJR0VnWTJWc2JDQnlaWEJ5WlhObGJuUmxaQ0JpZVNCcGRITWdiblZ0WW1WeUlIUnZJSFJvWldseUlHTnZiM0prYVc1aGRHVnpMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdE9kVzFpWlhKOUlHNGdMU0JVYUdVZ2JuVnRZbVZ5SUhKbGNISmxjMlZ1ZEdsdVp5QmhJR05sYkd4Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA5aWFtVmpkSDBnVkdobElHTnZiM0prYVc1aGRHVnpJR052Y25KbGMzQnZibVJwYm1jZ2RHOGdkR2hsSUdObGJHd2djbVZ3Y21WelpXNTBaV1FnWW5sY2JpQWdJQ0FnS2lCMGFHbHpJRzUxYldKbGNpNWNiaUFnSUNBZ0tpQkFjSEpwZG1GMFpWeHVJQ0FnSUNBcUwxeHVJQ0FnSUY5dWRXMWlaWEpVYjBOdmIzSmthVzVoZEdWektHNHBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVgyTmxiR3hVYjBOdmIzSmtjeWgwYUdsekxsOXVkVzFpWlhKVWIwTmxiR3dvYmlrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnZiblpsY25RZ1lTQndZV2x5SUc5bUlHTnZiM0prYVc1aGRHVnpJSFJ2SUdFZ2JuVnRZbVZ5TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRQWW1wbFkzUjlJR052YjNKa2N5QXRJRlJvWlNCamIyOXlaR2x1WVhSbGN5QjBieUJqYjI1MlpYSjBYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjbVYwZFhKdUlIdE9kVzFpWlhKOGRXNWtaV1pwYm1Wa2ZTQlVhR1VnWTI5dmNtUnBibUYwWlhNZ1kyOXVkbVZ5ZEdWa0lIUnZJR0VnYm5WdFltVnlMaUJKWmx4dUlDQWdJQ0FxSUhSb1pTQmpiMjl5WkdsdVlYUmxjeUJoY21VZ2JtOTBJRzl1SUhSb2FYTWdiR0Y1YjNWMExDQjBhR1VnYm5WdFltVnlJR2x6SUhWdVpHVm1hVzVsWkM1Y2JpQWdJQ0FnS2lCQWNISnBkbUYwWlZ4dUlDQWdJQ0FxTDF4dUlDQWdJRjlqYjI5eVpHbHVZWFJsYzFSdlRuVnRZbVZ5S0dOdmIzSmtjeWtnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J1SUQwZ2RHaHBjeTVmWTJWc2JGUnZUblZ0WW1WeUtIUm9hWE11WDJOdmIzSmtjMVJ2UTJWc2JDaGpiMjl5WkhNcEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BEMGdiaUFtSmlCdUlEd2dkR2hwY3k1dFlYaHBiWFZ0VG5WdFltVnlUMlpFYVdObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYmp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGTnVZWEFnS0hnc2VTa2dkRzhnZEdobElHTnNiM05sYzNRZ1kyVnNiQ0JwYmlCMGFHbHpJRXhoZVc5MWRDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1QySnFaV04wZlNCa2FXVmpiMjl5WkdsdVlYUmxJQzBnVkdobElHTnZiM0prYVc1aGRHVWdkRzhnWm1sdVpDQjBhR1VnWTJ4dmMyVnpkQ0JqWld4c1hHNGdJQ0FnSUNvZ1ptOXlMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdSR2xsZlNCYlpHbGxZMjl2Y21ScGJtRjBMbVJwWlNBOUlHNTFiR3hkSUMwZ1ZHaGxJR1JwWlNCMGJ5QnpibUZ3SUhSdkxseHVJQ0FnSUNBcUlFQndZWEpoYlNCN1RuVnRZbVZ5ZlNCa2FXVmpiMjl5WkdsdVlYUmxMbmdnTFNCVWFHVWdlQzFqYjI5eVpHbHVZWFJsTGx4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VG5WdFltVnlmU0JrYVdWamIyOXlaR2x1WVhSbExua2dMU0JVYUdVZ2VTMWpiMjl5WkdsdVlYUmxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEpsZEhWeWJpQjdUMkpxWldOMGZHNTFiR3g5SUZSb1pTQmpiMjl5WkdsdVlYUmxJRzltSUhSb1pTQmpaV3hzSUdOc2IzTmxjM1FnZEc4Z0tIZ3NJSGtwTGx4dUlDQWdJQ0FxSUU1MWJHd2dkMmhsYmlCdWJ5QnpkV2wwWVdKc1pTQmpaV3hzSUdseklHNWxZWElnS0hnc0lIa3BYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2MyNWhjRlJ2S0h0a2FXVWdQU0J1ZFd4c0xDQjRMQ0I1ZlNrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCamIzSnVaWEpEWld4c0lEMGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtOTNPaUJOWVhSb0xuUnlkVzVqS0hrZ0x5QjBhR2x6TG1ScFpWTnBlbVVwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZMjlzT2lCTllYUm9MblJ5ZFc1aktIZ2dMeUIwYUdsekxtUnBaVk5wZW1VcFhHNGdJQ0FnSUNBZ0lIMDdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMjl5Ym1WeUlEMGdkR2hwY3k1ZlkyVnNiRlJ2UTI5dmNtUnpLR052Y201bGNrTmxiR3dwTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IzYVdSMGFFbHVJRDBnWTI5eWJtVnlMbmdnS3lCMGFHbHpMbVJwWlZOcGVtVWdMU0I0TzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IzYVdSMGFFOTFkQ0E5SUhSb2FYTXVaR2xsVTJsNlpTQXRJSGRwWkhSb1NXNDdYRzRnSUNBZ0lDQWdJR052Ym5OMElHaGxhV2RvZEVsdUlEMGdZMjl5Ym1WeUxua2dLeUIwYUdsekxtUnBaVk5wZW1VZ0xTQjVPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQm9aV2xuYUhSUGRYUWdQU0IwYUdsekxtUnBaVk5wZW1VZ0xTQm9aV2xuYUhSSmJqdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnhkV0ZrY21GdWRITWdQU0JiZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjVG9nZEdocGN5NWZZMlZzYkZSdlRuVnRZbVZ5S0dOdmNtNWxja05sYkd3cExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5MlpYSmhaMlU2SUhkcFpIUm9TVzRnS2lCb1pXbG5hSFJKYmx4dUlDQWdJQ0FnSUNCOUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeE9pQjBhR2x6TGw5alpXeHNWRzlPZFcxaVpYSW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZHpvZ1kyOXlibVZ5UTJWc2JDNXliM2NzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5c09pQmpiM0p1WlhKRFpXeHNMbU52YkNBcklERmNiaUFnSUNBZ0lDQWdJQ0FnSUgwcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5MlpYSmhaMlU2SUhkcFpIUm9UM1YwSUNvZ2FHVnBaMmgwU1c1Y2JpQWdJQ0FnSUNBZ2ZTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NUb2dkR2hwY3k1ZlkyVnNiRlJ2VG5WdFltVnlLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNjNklHTnZjbTVsY2tObGJHd3VjbTkzSUNzZ01TeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMnc2SUdOdmNtNWxja05sYkd3dVkyOXNYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmRtVnlZV2RsT2lCM2FXUjBhRWx1SUNvZ2FHVnBaMmgwVDNWMFhHNGdJQ0FnSUNBZ0lIMHNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIRTZJSFJvYVhNdVgyTmxiR3hVYjA1MWJXSmxjaWg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQmpiM0p1WlhKRFpXeHNMbkp2ZHlBcklERXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlzT2lCamIzSnVaWEpEWld4c0xtTnZiQ0FySURGY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdZMjkyWlhKaFoyVTZJSGRwWkhSb1QzVjBJQ29nYUdWcFoyaDBUM1YwWEc0Z0lDQWdJQ0FnSUgxZE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElITnVZWEJVYnlBOUlIRjFZV1J5WVc1MGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1kyVnNiQ0J6YUc5MWJHUWdZbVVnYjI0Z2RHaGxJR3hoZVc5MWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWdvY1hWaFpISmhiblFwSUQwK0lIVnVaR1ZtYVc1bFpDQWhQVDBnY1hWaFpISmhiblF1Y1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUdObGJHd2djMmh2ZFd4a0lHSmxJRzV2ZENCaGJISmxZV1I1SUhSaGEyVnVJR1Y0WTJWd2RDQmllU0JwZEhObGJHWmNiaUFnSUNBZ0lDQWdJQ0FnSUM1bWFXeDBaWElvS0hGMVlXUnlZVzUwS1NBOVBpQW9YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdiblZzYkNBaFBUMGdaR2xsSUNZbUlIUm9hWE11WDJOdmIzSmthVzVoZEdWelZHOU9kVzFpWlhJb1pHbGxMbU52YjNKa2FXNWhkR1Z6S1NBOVBUMGdjWFZoWkhKaGJuUXVjU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I4ZkNCMGFHbHpMbDlqWld4c1NYTkZiWEIwZVNoeGRXRmtjbUZ1ZEM1eExDQmZaR2xqWlM1blpYUW9kR2hwY3lrcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1kyVnNiQ0J6YUc5MWJHUWdZbVVnWTI5MlpYSmxaQ0JpZVNCMGFHVWdaR2xsSUhSb1pTQnRiM04wWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVjbVZrZFdObEtGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDaHRZWGhSTENCeGRXRmtjbUZ1ZENrZ1BUNGdjWFZoWkhKaGJuUXVZMjkyWlhKaFoyVWdQaUJ0WVhoUkxtTnZkbVZ5WVdkbElEOGdjWFZoWkhKaGJuUWdPaUJ0WVhoUkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIdHhPaUIxYm1SbFptbHVaV1FzSUdOdmRtVnlZV2RsT2lBdE1YMWNiaUFnSUNBZ0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpDQWhQVDBnYzI1aGNGUnZMbkVnUHlCMGFHbHpMbDl1ZFcxaVpYSlViME52YjNKa2FXNWhkR1Z6S0hOdVlYQlVieTV4S1NBNklHNTFiR3c3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUjJWMElIUm9aU0JrYVdVZ1lYUWdjRzlwYm5RZ0tIZ3NJSGtwTzF4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHRRYjJsdWRIMGdjRzlwYm5RZ0xTQlVhR1VnY0c5cGJuUWdhVzRnS0hnc0lIa3BJR052YjNKa2FXNWhkR1Z6WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3UkdsbGZHNTFiR3g5SUZSb1pTQmthV1VnZFc1a1pYSWdZMjl2Y21ScGJtRjBaWE1nS0hnc0lIa3BJRzl5SUc1MWJHd2dhV1lnYm04Z1pHbGxYRzRnSUNBZ0lDb2dhWE1nWVhRZ2RHaGxJSEJ2YVc1MExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRFRjBLSEJ2YVc1MElEMGdlM2c2SURBc0lIazZJREI5S1NCN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdaR2xsSUc5bUlGOWthV05sTG1kbGRDaDBhR2x6S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlM2dzSUhsOUlEMGdaR2xsTG1OdmIzSmthVzVoZEdWek8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I0Um1sMElEMGdlQ0E4UFNCd2IybHVkQzU0SUNZbUlIQnZhVzUwTG5nZ1BEMGdlQ0FySUhSb2FYTXVaR2xsVTJsNlpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSGxHYVhRZ1BTQjVJRHc5SUhCdmFXNTBMbmtnSmlZZ2NHOXBiblF1ZVNBOFBTQjVJQ3NnZEdocGN5NWthV1ZUYVhwbE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9lRVpwZENBbUppQjVSbWwwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdScFpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOaGJHTjFiR0YwWlNCMGFHVWdaM0pwWkNCemFYcGxJR2RwZG1WdUlIZHBaSFJvSUdGdVpDQm9aV2xuYUhRdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnZDJsa2RHZ2dMU0JVYUdVZ2JXbHVhVzFoYkNCM2FXUjBhRnh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQm9aV2xuYUhRZ0xTQlVhR1VnYldsdWFXMWhiQ0JvWldsbmFIUmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndjbWwyWVhSbFhHNGdJQ0FnSUNvdlhHNGdJQ0FnWDJOaGJHTjFiR0YwWlVkeWFXUW9kMmxrZEdnc0lHaGxhV2RvZENrZ2UxeHVJQ0FnSUNBZ0lDQmZZMjlzY3k1elpYUW9kR2hwY3l3Z1RXRjBhQzVtYkc5dmNpaDNhV1IwYUNBdklIUm9hWE11WkdsbFUybDZaU2twTzF4dUlDQWdJQ0FnSUNCZmNtOTNjeTV6WlhRb2RHaHBjeXdnVFdGMGFDNW1iRzl2Y2lob1pXbG5hSFFnTHlCMGFHbHpMbVJwWlZOcGVtVXBLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJEYjI1MlpYSjBJR0VnS0hKdmR5d2dZMjlzS1NCalpXeHNJSFJ2SUNoNExDQjVLU0JqYjI5eVpHbHVZWFJsY3k1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCd1lYSmhiU0I3VDJKcVpXTjBmU0JqWld4c0lDMGdWR2hsSUdObGJHd2dkRzhnWTI5dWRtVnlkQ0IwYnlCamIyOXlaR2x1WVhSbGMxeHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UwOWlhbVZqZEgwZ1ZHaGxJR052Y25KbGMzQnZibVJwYm1jZ1kyOXZjbVJwYm1GMFpYTXVYRzRnSUNBZ0lDb2dRSEJ5YVhaaGRHVmNiaUFnSUNBZ0tpOWNiaUFnSUNCZlkyVnNiRlJ2UTI5dmNtUnpLSHR5YjNjc0lHTnZiSDBwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUh0NE9pQmpiMndnS2lCMGFHbHpMbVJwWlZOcGVtVXNJSGs2SUhKdmR5QXFJSFJvYVhNdVpHbGxVMmw2WlgwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1EyOXVkbVZ5ZENBb2VDd2dlU2tnWTI5dmNtUnBibUYwWlhNZ2RHOGdZU0FvY205M0xDQmpiMndwSUdObGJHd3VYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFjR0Z5WVcwZ2UwOWlhbVZqZEgwZ1kyOXZjbVJwYm1GMFpYTWdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdkRzhnWTI5dWRtVnlkQ0IwYnlCaElHTmxiR3d1WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3VDJKcVpXTjBmU0JVYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJqWld4c1hHNGdJQ0FnSUNvZ1FIQnlhWFpoZEdWY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JmWTI5dmNtUnpWRzlEWld4c0tIdDRMQ0I1ZlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY205M09pQk5ZWFJvTG5SeWRXNWpLSGtnTHlCMGFHbHpMbVJwWlZOcGVtVXBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXNPaUJOWVhSb0xuUnlkVzVqS0hnZ0x5QjBhR2x6TG1ScFpWTnBlbVVwWEc0Z0lDQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wlhod2IzSjBJSHRIY21sa1RHRjViM1YwZlR0Y2JpSXNJaThxS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERTRJRWgxZFdJZ1pHVWdRbVZsY2x4dUlDcGNiaUFxSUZSb2FYTWdabWxzWlNCcGN5QndZWEowSUc5bUlIUjNaVzUwZVMxdmJtVXRjR2x3Y3k1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1puSmxaU0J6YjJaMGQyRnlaVG9nZVc5MUlHTmhiaUJ5WldScGMzUnlhV0oxZEdVZ2FYUWdZVzVrTDI5eUlHMXZaR2xtZVNCcGRGeHVJQ29nZFc1a1pYSWdkR2hsSUhSbGNtMXpJRzltSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsaklFeHBZMlZ1YzJVZ1lYTWdjSFZpYkdsemFHVmtJR0o1WEc0Z0tpQjBhR1VnUm5KbFpTQlRiMlowZDJGeVpTQkdiM1Z1WkdGMGFXOXVMQ0JsYVhSb1pYSWdkbVZ5YzJsdmJpQXpJRzltSUhSb1pTQk1hV05sYm5ObExDQnZjaUFvWVhRZ2VXOTFjbHh1SUNvZ2IzQjBhVzl1S1NCaGJua2diR0YwWlhJZ2RtVnljMmx2Ymk1Y2JpQXFYRzRnS2lCVWQyVnVkSGt0YjI1bExYQnBjSE1nYVhNZ1pHbHpkSEpwWW5WMFpXUWdhVzRnZEdobElHaHZjR1VnZEdoaGRDQnBkQ0IzYVd4c0lHSmxJSFZ6WldaMWJDd2dZblYwWEc0Z0tpQlhTVlJJVDFWVUlFRk9XU0JYUVZKU1FVNVVXVHNnZDJsMGFHOTFkQ0JsZG1WdUlIUm9aU0JwYlhCc2FXVmtJSGRoY25KaGJuUjVJRzltSUUxRlVrTklRVTVVUVVKSlRFbFVXVnh1SUNvZ2IzSWdSa2xVVGtWVFV5QkdUMUlnUVNCUVFWSlVTVU5WVEVGU0lGQlZVbEJQVTBVdUlDQlRaV1VnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdOY2JpQXFJRXhwWTJWdWMyVWdabTl5SUcxdmNtVWdaR1YwWVdsc2N5NWNiaUFxWEc0Z0tpQlpiM1VnYzJodmRXeGtJR2hoZG1VZ2NtVmpaV2wyWldRZ1lTQmpiM0I1SUc5bUlIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpJRXhwWTJWdWMyVmNiaUFxSUdGc2IyNW5JSGRwZEdnZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGlBZ1NXWWdibTkwTENCelpXVWdQR2gwZEhBNkx5OTNkM2N1WjI1MUxtOXlaeTlzYVdObGJuTmxjeTgrTGx4dUlDb2dRR2xuYm05eVpWeHVJQ292WEc1Y2JpOHFLbHh1SUNvZ1FHMXZaSFZzWlNCdGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE5jYmlBcUwxeHVYRzR2S2x4dUlDb2dRMjl1ZG1WeWRDQmhiaUJJVkUxTUlHRjBkSEpwWW5WMFpTQjBieUJoYmlCcGJuTjBZVzVqWlNkeklIQnliM0JsY25SNUxpQmNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2UxTjBjbWx1WjMwZ2JtRnRaU0F0SUZSb1pTQmhkSFJ5YVdKMWRHVW5jeUJ1WVcxbFhHNGdLaUJBY21WMGRYSnVJSHRUZEhKcGJtZDlJRlJvWlNCamIzSnlaWE53YjI1a2FXNW5JSEJ5YjNCbGNuUjVKM01nYm1GdFpTNGdSbTl5SUdWNFlXMXdiR1VzSUZ3aWJYa3RZWFIwY2x3aVhHNGdLaUIzYVd4c0lHSmxJR052Ym5abGNuUmxaQ0IwYnlCY0ltMTVRWFIwY2x3aUxDQmhibVFnWENKa2FYTmhZbXhsWkZ3aUlIUnZJRndpWkdsellXSnNaV1JjSWk1Y2JpQXFMMXh1WTI5dWMzUWdZWFIwY21saWRYUmxNbkJ5YjNCbGNuUjVJRDBnS0c1aGJXVXBJRDArSUh0Y2JpQWdJQ0JqYjI1emRDQmJabWx5YzNRc0lDNHVMbkpsYzNSZElEMGdibUZ0WlM1emNHeHBkQ2hjSWkxY0lpazdYRzRnSUNBZ2NtVjBkWEp1SUdacGNuTjBJQ3NnY21WemRDNXRZWEFvZDI5eVpDQTlQaUIzYjNKa0xuTnNhV05sS0RBc0lERXBMblJ2VlhCd1pYSkRZWE5sS0NrZ0t5QjNiM0prTG5Oc2FXTmxLREVwS1M1cWIybHVLQ2s3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRTFwZUdsdUlIdEFiR2x1YXlCdGIyUjFiR1U2YldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmbEpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnZEc4Z1lTQmpiR0Z6Y3k1Y2JpQXFYRzRnS2lCQWNHRnlZVzBnZXlwOUlGTjFjQ0F0SUZSb1pTQmpiR0Z6Y3lCMGJ5QnRhWGdnYVc1MGJ5NWNiaUFxSUVCeVpYUjFjbTRnZTIxdlpIVnNaVHB0YVhocGJpOVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTitVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpmU0JVYUdVZ2JXbDRaV1F0YVc0Z1kyeGhjM05jYmlBcUwxeHVZMjl1YzNRZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWeklEMGdLRk4xY0NrZ1BUNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQk5hWGhwYmlCMGJ5QnRZV3RsSUdGc2JDQmhkSFJ5YVdKMWRHVnpJRzl1SUdFZ1kzVnpkRzl0SUVoVVRVeEZiR1Z0Wlc1MElISmxZV1F0YjI1c2VTQnBiaUIwYUdVZ2MyVnVjMlZjYmlBZ0lDQWdLaUIwYUdGMElIZG9aVzRnZEdobElHRjBkSEpwWW5WMFpTQm5aWFJ6SUdFZ2JtVjNJSFpoYkhWbElIUm9ZWFFnWkdsbVptVnljeUJtY205dElIUm9aU0IyWVd4MVpTQnZaaUIwYUdWY2JpQWdJQ0FnS2lCamIzSnlaWE53YjI1a2FXNW5JSEJ5YjNCbGNuUjVMQ0JwZENCcGN5QnlaWE5sZENCMGJ5QjBhR0YwSUhCeWIzQmxjblI1SjNNZ2RtRnNkV1V1SUZSb1pWeHVJQ0FnSUNBcUlHRnpjM1Z0Y0hScGIyNGdhWE1nZEdoaGRDQmhkSFJ5YVdKMWRHVWdYQ0p0ZVMxaGRIUnlhV0oxZEdWY0lpQmpiM0p5WlhOd2IyNWtjeUIzYVhSb0lIQnliM0JsY25SNUlGd2lkR2hwY3k1dGVVRjBkSEpwWW5WMFpWd2lMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSEJoY21GdElIdERiR0Z6YzMwZ1UzVndJQzBnVkdobElHTnNZWE56SUhSdklHMXBlR2x1SUhSb2FYTWdVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpMbHh1SUNBZ0lDQXFJRUJ5WlhSMWNtNGdlMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnVkdobElHMXBlR1ZrSUdsdUlHTnNZWE56TGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUcxcGVHbHVYRzRnSUNBZ0lDb2dRR0ZzYVdGeklHMXZaSFZzWlRwdGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE4rVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6WEc0Z0lDQWdJQ292WEc0Z0lDQWdZMnhoYzNNZ1pYaDBaVzVrY3lCVGRYQWdlMXh1WEc0Z0lDQWdJQ0FnSUM4cUtseHVJQ0FnSUNBZ0lDQWdLaUJEWVd4c1ltRmpheUIwYUdGMElHbHpJR1Y0WldOMWRHVmtJSGRvWlc0Z1lXNGdiMkp6WlhKMlpXUWdZWFIwY21saWRYUmxKM01nZG1Gc2RXVWdhWE5jYmlBZ0lDQWdJQ0FnSUNvZ1kyaGhibWRsWkM0Z1NXWWdkR2hsSUVoVVRVeEZiR1Z0Wlc1MElHbHpJR052Ym01bFkzUmxaQ0IwYnlCMGFHVWdSRTlOTENCMGFHVWdZWFIwY21saWRYUmxYRzRnSUNBZ0lDQWdJQ0FxSUhaaGJIVmxJR05oYmlCdmJteDVJR0psSUhObGRDQjBieUIwYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJJVkUxTVJXeGxiV1Z1ZENkeklIQnliM0JsY25SNUxseHVJQ0FnSUNBZ0lDQWdLaUJKYmlCbFptWmxZM1FzSUhSb2FYTWdiV0ZyWlhNZ2RHaHBjeUJJVkUxTVJXeGxiV1Z1ZENkeklHRjBkSEpwWW5WMFpYTWdjbVZoWkMxdmJteDVMbHh1SUNBZ0lDQWdJQ0FnS2x4dUlDQWdJQ0FnSUNBZ0tpQkdiM0lnWlhoaGJYQnNaU3dnYVdZZ1lXNGdTRlJOVEVWc1pXMWxiblFnYUdGeklHRnVJR0YwZEhKcFluVjBaU0JjSW5oY0lpQmhibVJjYmlBZ0lDQWdJQ0FnSUNvZ1kyOXljbVZ6Y0c5dVpHbHVaeUJ3Y205d1pYSjBlU0JjSW5oY0lpd2dkR2hsYmlCamFHRnVaMmx1WnlCMGFHVWdkbUZzZFdVZ1hDSjRYQ0lnZEc4Z1hDSTFYQ0pjYmlBZ0lDQWdJQ0FnSUNvZ2QybHNiQ0J2Ym14NUlIZHZjbXNnZDJobGJpQmdkR2hwY3k1NElEMDlQU0ExWUM1Y2JpQWdJQ0FnSUNBZ0lDcGNiaUFnSUNBZ0lDQWdJQ29nUUhCaGNtRnRJSHRUZEhKcGJtZDlJRzVoYldVZ0xTQlVhR1VnWVhSMGNtbGlkWFJsSjNNZ2JtRnRaUzVjYmlBZ0lDQWdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUc5c1pGWmhiSFZsSUMwZ1ZHaGxJR0YwZEhKcFluVjBaU2R6SUc5c1pDQjJZV3gxWlM1Y2JpQWdJQ0FnSUNBZ0lDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlHNWxkMVpoYkhWbElDMGdWR2hsSUdGMGRISnBZblYwWlNkeklHNWxkeUIyWVd4MVpTNWNiaUFnSUNBZ0lDQWdJQ292WEc0Z0lDQWdJQ0FnSUdGMGRISnBZblYwWlVOb1lXNW5aV1JEWVd4c1ltRmpheWh1WVcxbExDQnZiR1JXWVd4MVpTd2dibVYzVm1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRUZzYkNCaGRIUnlhV0oxZEdWeklHRnlaU0J0WVdSbElISmxZV1F0YjI1c2VTQjBieUJ3Y21WMlpXNTBJR05vWldGMGFXNW5JR0o1SUdOb1lXNW5hVzVuWEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUIwYUdVZ1lYUjBjbWxpZFhSbElIWmhiSFZsY3k0Z1QyWWdZMjkxY25ObExDQjBhR2x6SUdseklHSjVJRzV2WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJuZFdGeVlXNTBaV1VnZEdoaGRDQjFjMlZ5Y3lCM2FXeHNJRzV2ZENCamFHVmhkQ0JwYmlCaElHUnBabVpsY21WdWRDQjNZWGt1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCd2NtOXdaWEowZVNBOUlHRjBkSEpwWW5WMFpUSndjbTl3WlhKMGVTaHVZVzFsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGFHbHpMbU52Ym01bFkzUmxaQ0FtSmlCdVpYZFdZV3gxWlNBaFBUMGdZQ1I3ZEdocGMxdHdjbTl3WlhKMGVWMTlZQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0c1aGJXVXNJSFJvYVhOYmNISnZjR1Z5ZEhsZEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgwN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1VtVmhaRTl1YkhsQmRIUnlhV0oxZEdWelhHNTlPMXh1SWl3aUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ0tHTXBJREl3TVRnZ1NIVjFZaUJrWlNCQ1pXVnlYRzRnS2x4dUlDb2dWR2hwY3lCbWFXeGxJR2x6SUhCaGNuUWdiMllnZEhkbGJuUjVMVzl1WlMxd2FYQnpMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJtY21WbElITnZablIzWVhKbE9pQjViM1VnWTJGdUlISmxaR2x6ZEhKcFluVjBaU0JwZENCaGJtUXZiM0lnYlc5a2FXWjVJR2wwWEc0Z0tpQjFibVJsY2lCMGFHVWdkR1Z5YlhNZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaU0JoY3lCd2RXSnNhWE5vWldRZ1lubGNiaUFxSUhSb1pTQkdjbVZsSUZOdlpuUjNZWEpsSUVadmRXNWtZWFJwYjI0c0lHVnBkR2hsY2lCMlpYSnphVzl1SURNZ2IyWWdkR2hsSUV4cFkyVnVjMlVzSUc5eUlDaGhkQ0I1YjNWeVhHNGdLaUJ2Y0hScGIyNHBJR0Z1ZVNCc1lYUmxjaUIyWlhKemFXOXVMbHh1SUNwY2JpQXFJRlIzWlc1MGVTMXZibVV0Y0dsd2N5QnBjeUJrYVhOMGNtbGlkWFJsWkNCcGJpQjBhR1VnYUc5d1pTQjBhR0YwSUdsMElIZHBiR3dnWW1VZ2RYTmxablZzTENCaWRYUmNiaUFxSUZkSlZFaFBWVlFnUVU1WklGZEJVbEpCVGxSWk95QjNhWFJvYjNWMElHVjJaVzRnZEdobElHbHRjR3hwWldRZ2QyRnljbUZ1ZEhrZ2IyWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWlhHNGdLaUJ2Y2lCR1NWUk9SVk5USUVaUFVpQkJJRkJCVWxSSlExVk1RVklnVUZWU1VFOVRSUzRnSUZObFpTQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZMXh1SUNvZ1RHbGpaVzV6WlNCbWIzSWdiVzl5WlNCa1pYUmhhV3h6TGx4dUlDcGNiaUFxSUZsdmRTQnphRzkxYkdRZ2FHRjJaU0J5WldObGFYWmxaQ0JoSUdOdmNIa2diMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlZ4dUlDb2dZV3h2Ym1jZ2QybDBhQ0IwZDJWdWRIa3RiMjVsTFhCcGNITXVJQ0JKWmlCdWIzUXNJSE5sWlNBOGFIUjBjRG92TDNkM2R5NW5iblV1YjNKbkwyeHBZMlZ1YzJWekx6NHVYRzRnS2lCQWFXZHViM0psWEc0Z0tpOWNiaThxS2x4dUlDb2dRRzF2WkhWc1pWeHVJQ292WEc1cGJYQnZjblFnZTBOdmJtWnBaM1Z5WVhScGIyNUZjbkp2Y24wZ1puSnZiU0JjSWk0dlpYSnliM0l2UTI5dVptbG5kWEpoZEdsdmJrVnljbTl5TG1welhDSTdYRzVwYlhCdmNuUWdlMUpsWVdSUGJteDVRWFIwY21saWRYUmxjMzBnWm5KdmJTQmNJaTR2YldsNGFXNHZVbVZoWkU5dWJIbEJkSFJ5YVdKMWRHVnpMbXB6WENJN1hHNWNiaTh2SUZSb1pTQnVZVzFsY3lCdlppQjBhR1VnS0c5aWMyVnlkbVZrS1NCaGRIUnlhV0oxZEdWeklHOW1JSFJvWlNCVWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRDNWNibU52Ym5OMElFTlBURTlTWDBGVVZGSkpRbFZVUlNBOUlGd2lZMjlzYjNKY0lqdGNibU52Ym5OMElFNUJUVVZmUVZSVVVrbENWVlJGSUQwZ1hDSnVZVzFsWENJN1hHNWpiMjV6ZENCVFEwOVNSVjlCVkZSU1NVSlZWRVVnUFNCY0luTmpiM0psWENJN1hHNWpiMjV6ZENCSVFWTmZWRlZTVGw5QlZGUlNTVUpWVkVVZ1BTQmNJbWhoY3kxMGRYSnVYQ0k3WEc1Y2JpOHZJRlJvWlNCd2NtbDJZWFJsSUhCeWIzQmxjblJwWlhNZ2IyWWdkR2hsSUZSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MElGeHVZMjl1YzNRZ1gyTnZiRzl5SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl1WVcxbElEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5elkyOXlaU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZhR0Z6VkhWeWJpQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNiaThxS2x4dUlDb2dRU0JRYkdGNVpYSWdhVzRnWVNCa2FXTmxJR2RoYldVdVhHNGdLbHh1SUNvZ1FTQndiR0Y1WlhJbmN5QnVZVzFsSUhOb2IzVnNaQ0JpWlNCMWJtbHhkV1VnYVc0Z2RHaGxJR2RoYldVdUlGUjNieUJrYVdabVpYSmxiblJjYmlBcUlGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBJR1ZzWlcxbGJuUnpJSGRwZEdnZ2RHaGxJSE5oYldVZ2JtRnRaU0JoZEhSeWFXSjFkR1VnWVhKbElIUnlaV0YwWldRZ1lYTmNiaUFxSUhSb1pTQnpZVzFsSUhCc1lYbGxjaTVjYmlBcVhHNGdLaUJKYmlCblpXNWxjbUZzSUdsMElHbHpJSEpsWTI5dGJXVnVaR1ZrSUhSb1lYUWdibThnZEhkdklIQnNZWGxsY25NZ1pHOGdhR0YyWlNCMGFHVWdjMkZ0WlNCamIyeHZjaXhjYmlBcUlHRnNkR2h2ZFdkb0lHbDBJR2x6SUc1dmRDQjFibU52Ym1ObGFYWmhZbXhsSUhSb1lYUWdZMlZ5ZEdGcGJpQmthV05sSUdkaGJXVnpJR2hoZG1VZ2NHeGhlV1Z5Y3lCM2IzSnJYRzRnS2lCcGJpQjBaV0Z0Y3lCM2FHVnlaU0JwZENCM2IzVnNaQ0J0WVd0bElITmxibk5sSUdadmNpQjBkMjhnYjNJZ2JXOXlaU0JrYVdabVpYSmxiblFnY0d4aGVXVnljeUIwYjF4dUlDb2dhR0YyWlNCMGFHVWdjMkZ0WlNCamIyeHZjaTVjYmlBcVhHNGdLaUJVYUdVZ2JtRnRaU0JoYm1RZ1kyOXNiM0lnWVhSMGNtbGlkWFJsY3lCaGNtVWdjbVZ4ZFdseVpXUXVJRlJvWlNCelkyOXlaU0JoYm1RZ2FHRnpMWFIxY201Y2JpQXFJR0YwZEhKcFluVjBaWE1nWVhKbElHNXZkQzVjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb2dRRzFwZUdWeklHMXZaSFZzWlRwdGFYaHBiaTlTWldGa1QyNXNlVUYwZEhKcFluVjBaWE4rVW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6WEc0Z0tpOWNibU52Ym5OMElGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBJRDBnWTJ4aGMzTWdaWGgwWlc1a2N5QlNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTW9TRlJOVEVWc1pXMWxiblFwSUh0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCaElHNWxkeUJVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEN3Z2IzQjBhVzl1WVd4c2VTQmlZWE5sWkNCdmJpQmhiaUJwYm5ScGRHbGhiRnh1SUNBZ0lDQXFJR052Ym1acFozVnlZWFJwYjI0Z2RtbGhJR0Z1SUc5aWFtVmpkQ0J3WVhKaGJXVjBaWElnYjNJZ1pHVmpiR0Z5WldRZ1lYUjBjbWxpZFhSbGN5QnBiaUJJVkUxTUxseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0UFltcGxZM1I5SUZ0amIyNW1hV2RkSUMwZ1FXNGdhVzVwZEdsaGJDQmpiMjVtYVdkMWNtRjBhVzl1SUdadmNpQjBhR1ZjYmlBZ0lDQWdLaUJ3YkdGNVpYSWdkRzhnWTNKbFlYUmxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQmpiMjVtYVdjdVkyOXNiM0lnTFNCVWFHbHpJSEJzWVhsbGNpZHpJR052Ykc5eUlIVnpaV1FnYVc0Z2RHaGxJR2RoYldVdVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0VGRISnBibWQ5SUdOdmJtWnBaeTV1WVcxbElDMGdWR2hwY3lCd2JHRjVaWEluY3lCdVlXMWxMbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdUblZ0WW1WeWZTQmJZMjl1Wm1sbkxuTmpiM0psWFNBdElGUm9hWE1nY0d4aGVXVnlKM01nYzJOdmNtVXVYRzRnSUNBZ0lDb2dRSEJoY21GdElIdENiMjlzWldGdWZTQmJZMjl1Wm1sbkxtaGhjMVIxY201ZElDMGdWR2hwY3lCd2JHRjVaWElnYUdGeklHRWdkSFZ5Ymk1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2loN1kyOXNiM0lzSUc1aGJXVXNJSE5qYjNKbExDQm9ZWE5VZFhKdWZTa2dlMXh1SUNBZ0lDQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaGpiMnh2Y2lBbUppQmNJbHdpSUNFOVBTQmpiMnh2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJOdmJHOXlMbk5sZENoMGFHbHpMQ0JqYjJ4dmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoRFQweFBVbDlCVkZSU1NVSlZWRVVzSUhSb2FYTXVZMjlzYjNJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFJvYVhNdWFHRnpRWFIwY21saWRYUmxLRU5QVEU5U1gwRlVWRkpKUWxWVVJTa2dKaVlnWENKY0lpQWhQVDBnZEdocGN5NW5aWFJCZEhSeWFXSjFkR1VvUTA5TVQxSmZRVlJVVWtsQ1ZWUkZLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdYMk52Ykc5eUxuTmxkQ2gwYUdsekxDQjBhR2x6TG1kbGRFRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVcEtUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1hDSkJJRkJzWVhsbGNpQnVaV1ZrY3lCaElHTnZiRzl5TENCM2FHbGphQ0JwY3lCaElGTjBjbWx1Wnk1Y0lpazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9ibUZ0WlNBbUppQmNJbHdpSUNFOVBTQnVZVzFsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmYm1GdFpTNXpaWFFvZEdocGN5d2dibUZ0WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmxkRUYwZEhKcFluVjBaU2hPUVUxRlgwRlVWRkpKUWxWVVJTd2dkR2hwY3k1dVlXMWxLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNoMGFHbHpMbWhoYzBGMGRISnBZblYwWlNoT1FVMUZYMEZVVkZKSlFsVlVSU2tnSmlZZ1hDSmNJaUFoUFQwZ2RHaHBjeTVuWlhSQmRIUnlhV0oxZEdVb1RrRk5SVjlCVkZSU1NVSlZWRVVwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmYm1GdFpTNXpaWFFvZEdocGN5d2dkR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9Ua0ZOUlY5QlZGUlNTVUpWVkVVcEtUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRGIyNW1hV2QxY21GMGFXOXVSWEp5YjNJb1hDSkJJRkJzWVhsbGNpQnVaV1ZrY3lCaElHNWhiV1VzSUhkb2FXTm9JR2x6SUdFZ1UzUnlhVzVuTGx3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHpZMjl5WlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWDNOamIzSmxMbk5sZENoMGFHbHpMQ0J6WTI5eVpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoVFEwOVNSVjlCVkZSU1NVSlZWRVVzSUhSb2FYTXVjMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFJvYVhNdWFHRnpRWFIwY21saWRYUmxLRk5EVDFKRlgwRlVWRkpKUWxWVVJTa2dKaVlnVG5WdFltVnlMbWx6VG1GT0tIQmhjbk5sU1c1MEtIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGTkRUMUpGWDBGVVZGSkpRbFZVUlNrc0lERXdLU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRjl6WTI5eVpTNXpaWFFvZEdocGN5d2djR0Z5YzJWSmJuUW9kR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9VME5QVWtWZlFWUlVVa2xDVlZSRktTd2dNVEFwS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUU5cllYa3VJRUVnY0d4aGVXVnlJR1J2WlhNZ2JtOTBJRzVsWldRZ2RHOGdhR0YyWlNCaElITmpiM0psTGx4dUlDQWdJQ0FnSUNBZ0lDQWdYM05qYjNKbExuTmxkQ2gwYUdsekxDQnVkV3hzS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGNuVmxJRDA5UFNCb1lYTlVkWEp1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnYUdGelZIVnliaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaElRVk5mVkZWU1RsOUJWRlJTU1VKVlZFVXNJR2hoYzFSMWNtNHBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0hSb2FYTXVhR0Z6UVhSMGNtbGlkWFJsS0VoQlUxOVVWVkpPWDBGVVZGSkpRbFZVUlNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRTlyWVhrc0lFRWdjR3hoZVdWeUlHUnZaWE1nYm05MElHRnNkMkY1Y3lCb1lYWmxJR0VnZEhWeWJpNWNiaUFnSUNBZ0lDQWdJQ0FnSUY5b1lYTlVkWEp1TG5ObGRDaDBhR2x6TENCdWRXeHNLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJSE4wWVhScFl5Qm5aWFFnYjJKelpYSjJaV1JCZEhSeWFXSjFkR1Z6S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnUTA5TVQxSmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1RrRk5SVjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQlRRMDlTUlY5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVZjYmlBZ0lDQWdJQ0FnWFR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JrYVhOamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR2x6SUhCc1lYbGxjaWR6SUdOdmJHOXlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxTjBjbWx1WjMxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1kyOXNiM0lvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlkyOXNiM0l1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb2FYTWdjR3hoZVdWeUozTWdibUZ0WlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRUZEhKcGJtZDlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJRzVoYldVb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZibUZ0WlM1blpYUW9kR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaHBjeUJ3YkdGNVpYSW5jeUJ6WTI5eVpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhOamIzSmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYm5Wc2JDQTlQVDBnWDNOamIzSmxMbWRsZENoMGFHbHpLU0EvSURBZ09pQmZjMk52Y21VdVoyVjBLSFJvYVhNcE8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhRZ2MyTnZjbVVvYm1WM1UyTnZjbVVwSUh0Y2JpQWdJQ0FnSUNBZ1gzTmpiM0psTG5ObGRDaDBhR2x6TENCdVpYZFRZMjl5WlNrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lEMDlQU0J1WlhkVFkyOXlaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1eVpXMXZkbVZCZEhSeWFXSjFkR1VvVTBOUFVrVmZRVlJVVWtsQ1ZWUkZLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YzJWMFFYUjBjbWxpZFhSbEtGTkRUMUpGWDBGVVZGSkpRbFZVUlN3Z2JtVjNVMk52Y21VcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dVM1JoY25RZ1lTQjBkWEp1SUdadmNpQjBhR2x6SUhCc1lYbGxjaTVjYmlBZ0lDQWdLaTljYmlBZ0lDQnpkR0Z5ZEZSMWNtNG9LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaDBhR2x6TG1selEyOXVibVZqZEdWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkJoY21WdWRFNXZaR1V1WkdsemNHRjBZMmhGZG1WdWRDaHVaWGNnUTNWemRHOXRSWFpsYm5Rb1hDSjBiM0E2YzNSaGNuUXRkSFZ5Ymx3aUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR1YwWVdsc09pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjam9nZEdocGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JmYUdGelZIVnliaTV6WlhRb2RHaHBjeXdnZEhKMVpTazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWMyVjBRWFIwY21saWRYUmxLRWhCVTE5VVZWSk9YMEZVVkZKSlFsVlVSU3dnZEhKMVpTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSVzVrSUdFZ2RIVnliaUJtYjNJZ2RHaHBjeUJ3YkdGNVpYSXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1pXNWtWSFZ5YmlncElIdGNiaUFnSUNBZ0lDQWdYMmhoYzFSMWNtNHVjMlYwS0hSb2FYTXNJRzUxYkd3cE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJXOTJaVUYwZEhKcFluVjBaU2hJUVZOZlZGVlNUbDlCVkZSU1NVSlZWRVVwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVSdlpYTWdkR2hwY3lCd2JHRjVaWElnYUdGMlpTQmhJSFIxY200L1hHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWRIbHdaU0I3UW05dmJHVmhibjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYUdGelZIVnliaWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVWdQVDA5SUY5b1lYTlVkWEp1TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCQklGTjBjbWx1WnlCeVpYQnlaWE5sYm5SaGRHbHZiaUJ2WmlCMGFHbHpJSEJzWVhsbGNpd2dhR2x6SUc5eUlHaGxjbk1nYm1GdFpTNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQnlaWFIxY200Z2UxTjBjbWx1WjMwZ1ZHaGxJSEJzWVhsbGNpZHpJRzVoYldVZ2NtVndjbVZ6Wlc1MGN5QjBhR1VnY0d4aGVXVnlJR0Z6SUdFZ2MzUnlhVzVuTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSFJ2VTNSeWFXNW5LQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWUNSN2RHaHBjeTV1WVcxbGZXQTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dTWE1nZEdocGN5QndiR0Y1WlhJZ1pYRjFZV3dnWVc1dmRHaGxjaUJ3YkdGNVpYSS9YRzRnSUNBZ0lDb2dYRzRnSUNBZ0lDb2dRSEJoY21GdElIdHRiMlIxYkdVNlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUitWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblI5SUc5MGFHVnlJQzBnVkdobElHOTBhR1Z5SUhCc1lYbGxjaUIwYnlCamIyMXdZWEpsSUhSb2FYTWdjR3hoZVdWeUlIZHBkR2d1WEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3UW05dmJHVmhibjBnVkhKMVpTQjNhR1Z1SUdWcGRHaGxjaUIwYUdVZ2IySnFaV04wSUhKbFptVnlaVzVqWlhNZ1lYSmxJSFJvWlNCellXMWxYRzRnSUNBZ0lDb2diM0lnZDJobGJpQmliM1JvSUc1aGJXVWdZVzVrSUdOdmJHOXlJR0Z5WlNCMGFHVWdjMkZ0WlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JsY1hWaGJITW9iM1JvWlhJcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2JtRnRaU0E5SUZ3aWMzUnlhVzVuWENJZ1BUMDlJSFI1Y0dWdlppQnZkR2hsY2lBL0lHOTBhR1Z5SURvZ2IzUm9aWEl1Ym1GdFpUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHOTBhR1Z5SUQwOVBTQjBhR2x6SUh4OElHNWhiV1VnUFQwOUlIUm9hWE11Ym1GdFpUdGNiaUFnSUNCOVhHNTlPMXh1WEc1M2FXNWtiM2N1WTNWemRHOXRSV3hsYldWdWRITXVaR1ZtYVc1bEtGd2lkRzl3TFhCc1lYbGxjbHdpTENCVWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRDazdYRzVjYmk4cUtseHVJQ29nVkdobElHUmxabUYxYkhRZ2MzbHpkR1Z0SUhCc1lYbGxjaTRnUkdsalpTQmhjbVVnZEdoeWIzZHVJR0o1SUdFZ2NHeGhlV1Z5TGlCR2IzSWdjMmwwZFdGMGFXOXVjMXh1SUNvZ2QyaGxjbVVnZVc5MUlIZGhiblFnZEc4Z2NtVnVaR1Z5SUdFZ1luVnVZMmdnYjJZZ1pHbGpaU0IzYVhSb2IzVjBJRzVsWldScGJtY2dkR2hsSUdOdmJtTmxjSFFnYjJZZ1VHeGhlV1Z5YzF4dUlDb2dkR2hwY3lCRVJVWkJWVXhVWDFOWlUxUkZUVjlRVEVGWlJWSWdZMkZ1SUdKbElHRWdjM1ZpYzNScGRIVjBaUzRnVDJZZ1kyOTFjbk5sTENCcFppQjViM1VuWkNCc2FXdGxJSFJ2WEc0Z0tpQmphR0Z1WjJVZ2RHaGxJRzVoYldVZ1lXNWtMMjl5SUhSb1pTQmpiMnh2Y2l3Z1kzSmxZWFJsSUdGdVpDQjFjMlVnZVc5MWNpQnZkMjRnWENKemVYTjBaVzBnY0d4aGVXVnlYQ0l1WEc0Z0tpQkFZMjl1YzNSY2JpQXFMMXh1WTI5dWMzUWdSRVZHUVZWTVZGOVRXVk5VUlUxZlVFeEJXVVZTSUQwZ2JtVjNJRlJ2Y0ZCc1lYbGxja2hVVFV4RmJHVnRaVzUwS0h0amIyeHZjam9nWENKeVpXUmNJaXdnYm1GdFpUb2dYQ0lxWENKOUtUdGNibHh1Wlhod2IzSjBJSHRjYmlBZ0lDQlViM0JRYkdGNVpYSklWRTFNUld4bGJXVnVkQ3hjYmlBZ0lDQkVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVkpjYm4wN1hHNGlMQ0l2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPQ0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dUx5OXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTBkeWFXUk1ZWGx2ZFhSOUlHWnliMjBnWENJdUwwZHlhV1JNWVhsdmRYUXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNmU0JtY205dElGd2lMaTlVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEM1cWMxd2lPMXh1WEc0dktpcGNiaUFxSUVCdGIyUjFiR1ZjYmlBcUwxeHVYRzVqYjI1emRDQkVSVVpCVlV4VVgwUkpSVjlUU1ZwRklEMGdNVEF3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOUlUMHhFWDBSVlVrRlVTVTlPSUQwZ016YzFPeUF2THlCdGMxeHVZMjl1YzNRZ1JFVkdRVlZNVkY5RVVrRkhSMGxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVJRDBnWm1Gc2MyVTdYRzVqYjI1emRDQkVSVVpCVlV4VVgwaFBURVJKVGtkZlJFbERSVjlFU1ZOQlFreEZSQ0E5SUdaaGJITmxPMXh1WTI5dWMzUWdSRVZHUVZWTVZGOVNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFSUQwZ1ptRnNjMlU3WEc1Y2JtTnZibk4wSUZKUFYxTWdQU0F4TUR0Y2JtTnZibk4wSUVOUFRGTWdQU0F4TUR0Y2JseHVZMjl1YzNRZ1JFVkdRVlZNVkY5WFNVUlVTQ0E5SUVOUFRGTWdLaUJFUlVaQlZVeFVYMFJKUlY5VFNWcEZPeUF2THlCd2VGeHVZMjl1YzNRZ1JFVkdRVlZNVkY5SVJVbEhTRlFnUFNCU1QxZFRJQ29nUkVWR1FWVk1WRjlFU1VWZlUwbGFSVHNnTHk4Z2NIaGNibU52Ym5OMElFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRpQTlJRTFoZEdndVpteHZiM0lvVWs5WFV5QXZJRElwTzF4dVhHNWpiMjV6ZENCTlNVNWZSRVZNVkVFZ1BTQXpPeUF2TDNCNFhHNWNibU52Ym5OMElGZEpSRlJJWDBGVVZGSkpRbFZVUlNBOUlGd2lkMmxrZEdoY0lqdGNibU52Ym5OMElFaEZTVWRJVkY5QlZGUlNTVUpWVkVVZ1BTQmNJbWhsYVdkb2RGd2lPMXh1WTI5dWMzUWdSRWxUVUVWU1UwbFBUbDlCVkZSU1NVSlZWRVVnUFNCY0ltUnBjM0JsY25OcGIyNWNJanRjYm1OdmJuTjBJRVJKUlY5VFNWcEZYMEZVVkZKSlFsVlVSU0E5SUZ3aVpHbGxMWE5wZW1WY0lqdGNibU52Ym5OMElFUlNRVWRIU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGSUQwZ1hDSmtjbUZuWjJsdVp5MWthV05sTFdScGMyRmliR1ZrWENJN1hHNWpiMjV6ZENCSVQweEVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZJRDBnWENKb2IyeGthVzVuTFdScFkyVXRaR2x6WVdKc1pXUmNJanRjYm1OdmJuTjBJRkpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVSZlFWUlVVa2xDVlZSRklEMGdYQ0p5YjNSaGRHbHVaeTFrYVdObExXUnBjMkZpYkdWa1hDSTdYRzVqYjI1emRDQklUMHhFWDBSVlVrRlVTVTlPWDBGVVZGSkpRbFZVUlNBOUlGd2lhRzlzWkMxa2RYSmhkR2x2Ymx3aU8xeHVYRzVjYm1OdmJuTjBJSEJoY25ObFRuVnRZbVZ5SUQwZ0tHNTFiV0psY2xOMGNtbHVaeXdnWkdWbVlYVnNkRTUxYldKbGNpQTlJREFwSUQwK0lIdGNiaUFnSUNCamIyNXpkQ0J1ZFcxaVpYSWdQU0J3WVhKelpVbHVkQ2h1ZFcxaVpYSlRkSEpwYm1jc0lERXdLVHRjYmlBZ0lDQnlaWFIxY200Z1RuVnRZbVZ5TG1selRtRk9LRzUxYldKbGNpa2dQeUJrWldaaGRXeDBUblZ0WW1WeUlEb2diblZ0WW1WeU8xeHVmVHRjYmx4dVkyOXVjM1FnZG1Gc2FXUmhkR1ZRYjNOcGRHbDJaVTUxYldKbGNpQTlJQ2h1ZFcxaVpYSXNJRzFoZUU1MWJXSmxjaUE5SUVsdVptbHVhWFI1S1NBOVBpQjdYRzRnSUNBZ2NtVjBkWEp1SURBZ1BEMGdiblZ0WW1WeUlDWW1JRzUxYldKbGNpQThJRzFoZUU1MWJXSmxjanRjYm4wN1hHNWNibU52Ym5OMElHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUlEMGdLRzUxYldKbGNsTjBjbWx1Wnl3Z1pHVm1ZWFZzZEZaaGJIVmxLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdkbUZzZFdVZ1BTQndZWEp6WlU1MWJXSmxjaWh1ZFcxaVpYSlRkSEpwYm1jc0lHUmxabUYxYkhSV1lXeDFaU2s3WEc0Z0lDQWdjbVYwZFhKdUlIWmhiR2xrWVhSbFVHOXphWFJwZG1WT2RXMWlaWElvZG1Gc2RXVXBJRDhnZG1Gc2RXVWdPaUJrWldaaGRXeDBWbUZzZFdVN1hHNTlPMXh1WEc1amIyNXpkQ0JuWlhSUWIzTnBkR2wyWlU1MWJXSmxja0YwZEhKcFluVjBaU0E5SUNobGJHVnRaVzUwTENCdVlXMWxMQ0JrWldaaGRXeDBWbUZzZFdVcElEMCtJSHRjYmlBZ0lDQnBaaUFvWld4bGJXVnVkQzVvWVhOQmRIUnlhV0oxZEdVb2JtRnRaU2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2RXVlRkSEpwYm1jZ1BTQmxiR1Z0Wlc1MExtZGxkRUYwZEhKcFluVjBaU2h1WVcxbEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeUtIWmhiSFZsVTNSeWFXNW5MQ0JrWldaaGRXeDBWbUZzZFdVcE8xeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dWZUdGNibHh1WTI5dWMzUWdaMlYwUW05dmJHVmhiaUE5SUNoaWIyOXNaV0Z1VTNSeWFXNW5MQ0IwY25WbFZtRnNkV1VzSUdSbFptRjFiSFJXWVd4MVpTa2dQVDRnZTF4dUlDQWdJR2xtSUNoMGNuVmxWbUZzZFdVZ1BUMDlJR0p2YjJ4bFlXNVRkSEpwYm1jZ2ZId2dYQ0owY25WbFhDSWdQVDA5SUdKdmIyeGxZVzVUZEhKcGJtY3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlNCbGJITmxJR2xtSUNoY0ltWmhiSE5sWENJZ1BUMDlJR0p2YjJ4bFlXNVRkSEpwYm1jcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmtaV1poZFd4MFZtRnNkV1U3WEc0Z0lDQWdmVnh1ZlR0Y2JseHVZMjl1YzNRZ1oyVjBRbTl2YkdWaGJrRjBkSEpwWW5WMFpTQTlJQ2hsYkdWdFpXNTBMQ0J1WVcxbExDQmtaV1poZFd4MFZtRnNkV1VwSUQwK0lIdGNiaUFnSUNCcFppQW9aV3hsYldWdWRDNW9ZWE5CZEhSeWFXSjFkR1VvYm1GdFpTa3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkbUZzZFdWVGRISnBibWNnUFNCbGJHVnRaVzUwTG1kbGRFRjBkSEpwWW5WMFpTaHVZVzFsS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdkbGRFSnZiMnhsWVc0b2RtRnNkV1ZUZEhKcGJtY3NJRnQyWVd4MVpWTjBjbWx1Wnl3Z1hDSjBjblZsWENKZExDQmJYQ0ptWVd4elpWd2lYU3dnWkdWbVlYVnNkRlpoYkhWbEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnWkdWbVlYVnNkRlpoYkhWbE8xeHVmVHRjYmx4dUx5OGdVSEpwZG1GMFpTQndjbTl3WlhKMGFXVnpYRzVqYjI1emRDQmZZMkZ1ZG1GeklEMGdibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUY5c1lYbHZkWFFnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMk4xY25KbGJuUlFiR0Y1WlhJZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVkyOXVjM1FnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYmx4dVkyOXVjM1FnWTI5dWRHVjRkQ0E5SUNoaWIyRnlaQ2tnUFQ0Z1gyTmhiblpoY3k1blpYUW9ZbTloY21RcExtZGxkRU52Ym5SbGVIUW9YQ0l5WkZ3aUtUdGNibHh1WTI5dWMzUWdaMlYwVW1WaFpIbEVhV05sSUQwZ0tHSnZZWEprS1NBOVBpQjdYRzRnSUNBZ2FXWWdLSFZ1WkdWbWFXNWxaQ0E5UFQwZ1gyNTFiV0psY2s5bVVtVmhaSGxFYVdObExtZGxkQ2hpYjJGeVpDa3BJSHRjYmlBZ0lDQWdJQ0FnWDI1MWJXSmxjazltVW1WaFpIbEVhV05sTG5ObGRDaGliMkZ5WkN3Z01DazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2NtVjBkWEp1SUY5dWRXMWlaWEpQWmxKbFlXUjVSR2xqWlM1blpYUW9ZbTloY21RcE8xeHVmVHRjYmx4dVkyOXVjM1FnZFhCa1lYUmxVbVZoWkhsRWFXTmxJRDBnS0dKdllYSmtMQ0IxY0dSaGRHVXBJRDArSUh0Y2JpQWdJQ0JmYm5WdFltVnlUMlpTWldGa2VVUnBZMlV1YzJWMEtHSnZZWEprTENCblpYUlNaV0ZrZVVScFkyVW9ZbTloY21RcElDc2dkWEJrWVhSbEtUdGNibjA3WEc1Y2JtTnZibk4wSUdselVtVmhaSGtnUFNBb1ltOWhjbVFwSUQwK0lHZGxkRkpsWVdSNVJHbGpaU2hpYjJGeVpDa2dQVDA5SUdKdllYSmtMbVJwWTJVdWJHVnVaM1JvTzF4dVhHNWpiMjV6ZENCMWNHUmhkR1ZDYjJGeVpDQTlJQ2hpYjJGeVpDd2daR2xqWlNBOUlHSnZZWEprTG1ScFkyVXBJRDArSUh0Y2JpQWdJQ0JwWmlBb2FYTlNaV0ZrZVNoaWIyRnlaQ2twSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVkR1Y0ZENoaWIyRnlaQ2t1WTJ4bFlYSlNaV04wS0RBc0lEQXNJR0p2WVhKa0xuZHBaSFJvTENCaWIyRnlaQzVvWldsbmFIUXBPMXh1WEc0Z0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1pHbGxJRzltSUdScFkyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUnBaUzV5Wlc1a1pYSW9ZMjl1ZEdWNGRDaGliMkZ5WkNrc0lHSnZZWEprTG1ScFpWTnBlbVVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dWZUdGNibHh1WEc0dkx5QkpiblJsY21GamRHbHZiaUJ6ZEdGMFpYTmNibU52Ym5OMElFNVBUa1VnUFNCVGVXMWliMndvWENKdWIxOXBiblJsY21GamRHbHZibHdpS1R0Y2JtTnZibk4wSUVoUFRFUWdQU0JUZVcxaWIyd29YQ0pvYjJ4a1hDSXBPMXh1WTI5dWMzUWdUVTlXUlNBOUlGTjViV0p2YkNoY0ltMXZkbVZjSWlrN1hHNWpiMjV6ZENCSlRrUkZWRVZTVFVsT1JVUWdQU0JUZVcxaWIyd29YQ0pwYm1SbGRHVnliV2x1WldSY0lpazdYRzVqYjI1emRDQkVVa0ZIUjBsT1J5QTlJRk41YldKdmJDaGNJbVJ5WVdkbmFXNW5YQ0lwTzF4dVhHNHZMeUJOWlhSb2IyUnpJSFJ2SUdoaGJtUnNaU0JwYm5SbGNtRmpkR2x2Ymx4dVkyOXVjM1FnWTI5dWRtVnlkRmRwYm1SdmQwTnZiM0prYVc1aGRHVnpWRzlEWVc1MllYTWdQU0FvWTJGdWRtRnpMQ0I0VjJsdVpHOTNMQ0I1VjJsdVpHOTNLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdZMkZ1ZG1GelFtOTRJRDBnWTJGdWRtRnpMbWRsZEVKdmRXNWthVzVuUTJ4cFpXNTBVbVZqZENncE8xeHVYRzRnSUNBZ1kyOXVjM1FnZUNBOUlIaFhhVzVrYjNjZ0xTQmpZVzUyWVhOQ2IzZ3ViR1ZtZENBcUlDaGpZVzUyWVhNdWQybGtkR2dnTHlCallXNTJZWE5DYjNndWQybGtkR2dwTzF4dUlDQWdJR052Ym5OMElIa2dQU0I1VjJsdVpHOTNJQzBnWTJGdWRtRnpRbTk0TG5SdmNDQXFJQ2hqWVc1MllYTXVhR1ZwWjJoMElDOGdZMkZ1ZG1GelFtOTRMbWhsYVdkb2RDazdYRzVjYmlBZ0lDQnlaWFIxY200Z2UzZ3NJSGw5TzF4dWZUdGNibHh1WTI5dWMzUWdjMlYwZFhCSmJuUmxjbUZqZEdsdmJpQTlJQ2hpYjJGeVpDa2dQVDRnZTF4dUlDQWdJR052Ym5OMElHTmhiblpoY3lBOUlGOWpZVzUyWVhNdVoyVjBLR0p2WVhKa0tUdGNibHh1SUNBZ0lDOHZJRk5sZEhWd0lHbHVkR1Z5WVdOMGFXOXVYRzRnSUNBZ2JHVjBJRzl5YVdkcGJpQTlJSHQ5TzF4dUlDQWdJR3hsZENCemRHRjBaU0E5SUU1UFRrVTdYRzRnSUNBZ2JHVjBJSE4wWVhScFkwSnZZWEprSUQwZ2JuVnNiRHRjYmlBZ0lDQnNaWFFnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0J1ZFd4c08xeHVJQ0FnSUd4bGRDQm9iMnhrVkdsdFpXOTFkQ0E5SUc1MWJHdzdYRzVjYmlBZ0lDQmpiMjV6ZENCb2IyeGtSR2xsSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9TRTlNUkNBOVBUMGdjM1JoZEdVZ2ZId2dTVTVFUlZSRlVrMUpUa1ZFSUQwOVBTQnpkR0YwWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2RHOW5aMnhsSUdodmJHUWdMeUJ5Wld4bFlYTmxYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J3YkdGNVpYSlhhWFJvUVZSMWNtNGdQU0JpYjJGeVpDNXhkV1Z5ZVZObGJHVmpkRzl5S0Z3aWRHOXdMWEJzWVhsbGNpMXNhWE4wSUhSdmNDMXdiR0Y1WlhKYmFHRnpMWFIxY201ZFhDSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1JwWlZWdVpHVnlRM1Z5YzI5eUxtbHpTR1ZzWkNncEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR2xsVlc1a1pYSkRkWEp6YjNJdWNtVnNaV0Z6WlVsMEtIQnNZWGxsY2xkcGRHaEJWSFZ5YmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUxtaHZiR1JKZENod2JHRjVaWEpYYVhSb1FWUjFjbTRwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2MzUmhkR1VnUFNCT1QwNUZPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFjR1JoZEdWQ2IyRnlaQ2hpYjJGeVpDazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCb2IyeGtWR2x0Wlc5MWRDQTlJRzUxYkd3N1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE4wWVhKMFNHOXNaR2x1WnlBOUlDZ3BJRDArSUh0Y2JpQWdJQ0FnSUNBZ2FHOXNaRlJwYldWdmRYUWdQU0IzYVc1a2IzY3VjMlYwVkdsdFpXOTFkQ2hvYjJ4a1JHbGxMQ0JpYjJGeVpDNW9iMnhrUkhWeVlYUnBiMjRwTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnpkRzl3U0c5c1pHbHVaeUE5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnZDJsdVpHOTNMbU5zWldGeVZHbHRaVzkxZENob2IyeGtWR2x0Wlc5MWRDazdYRzRnSUNBZ0lDQWdJR2h2YkdSVWFXMWxiM1YwSUQwZ2JuVnNiRHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJKYm5SbGNtRmpkR2x2YmlBOUlDaGxkbVZ1ZENrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JwWmlBb1RrOU9SU0E5UFQwZ2MzUmhkR1VwSUh0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYjNKcFoybHVJRDBnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhnNklHVjJaVzUwTG1Oc2FXVnVkRmdzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZVRvZ1pYWmxiblF1WTJ4cFpXNTBXVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1pHbGxWVzVrWlhKRGRYSnpiM0lnUFNCaWIyRnlaQzVzWVhsdmRYUXVaMlYwUVhRb1kyOXVkbVZ5ZEZkcGJtUnZkME52YjNKa2FXNWhkR1Z6Vkc5RFlXNTJZWE1vWTJGdWRtRnpMQ0JsZG1WdWRDNWpiR2xsYm5SWUxDQmxkbVZ1ZEM1amJHbGxiblJaS1NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHVkV3hzSUNFOVBTQmthV1ZWYm1SbGNrTjFjbk52Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRTl1YkhrZ2FXNTBaWEpoWTNScGIyNGdkMmwwYUNCMGFHVWdZbTloY21RZ2RtbGhJR0VnWkdsbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFaHZiR1JwYm1kRWFXTmxJQ1ltSUNGaWIyRnlaQzVrYVhOaFlteGxaRVJ5WVdkbmFXNW5SR2xqWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRWxPUkVWVVJWSk5TVTVGUkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoY25SSWIyeGthVzVuS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDZ2hZbTloY21RdVpHbHpZV0pzWldSSWIyeGthVzVuUkdsalpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRHRjBaU0E5SUVoUFRFUTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYSjBTRzlzWkdsdVp5Z3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvSVdKdllYSmtMbVJwYzJGaWJHVmtSSEpoWjJkcGJtZEVhV05sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSbElEMGdUVTlXUlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0J6YUc5M1NXNTBaWEpoWTNScGIyNGdQU0FvWlhabGJuUXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsbFZXNWtaWEpEZFhKemIzSWdQU0JpYjJGeVpDNXNZWGx2ZFhRdVoyVjBRWFFvWTI5dWRtVnlkRmRwYm1SdmQwTnZiM0prYVc1aGRHVnpWRzlEWVc1MllYTW9ZMkZ1ZG1GekxDQmxkbVZ1ZEM1amJHbGxiblJZTENCbGRtVnVkQzVqYkdsbGJuUlpLU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaEVVa0ZIUjBsT1J5QTlQVDBnYzNSaGRHVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmhiblpoY3k1emRIbHNaUzVqZFhKemIzSWdQU0JjSW1keVlXSmlhVzVuWENJN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9iblZzYkNBaFBUMGdaR2xsVlc1a1pYSkRkWEp6YjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6ZEhsc1pTNWpkWEp6YjNJZ1BTQmNJbWR5WVdKY0lqdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6ZEhsc1pTNWpkWEp6YjNJZ1BTQmNJbVJsWm1GMWJIUmNJanRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQnRiM1psSUQwZ0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoTlQxWkZJRDA5UFNCemRHRjBaU0I4ZkNCSlRrUkZWRVZTVFVsT1JVUWdQVDA5SUhOMFlYUmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJrWlhSbGNtMXBibVVnYVdZZ1lTQmthV1VnYVhNZ2RXNWtaWElnZEdobElHTjFjbk52Y2x4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnU1dkdWIzSmxJSE50WVd4c0lHMXZkbVZ0Wlc1MGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaSGdnUFNCTllYUm9MbUZpY3lodmNtbG5hVzR1ZUNBdElHVjJaVzUwTG1Oc2FXVnVkRmdwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pIa2dQU0JOWVhSb0xtRmljeWh2Y21sbmFXNHVlU0F0SUdWMlpXNTBMbU5zYVdWdWRGa3BPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvVFVsT1gwUkZURlJCSUR3Z1pIZ2dmSHdnVFVsT1gwUkZURlJCSUR3Z1pIa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMFpTQTlJRVJTUVVkSFNVNUhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wYjNCSWIyeGthVzVuS0NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCa2FXTmxWMmwwYUc5MWRFUnBaVlZ1WkdWeVEzVnljMjl5SUQwZ1ltOWhjbVF1WkdsalpTNW1hV3gwWlhJb1pHbGxJRDArSUdScFpTQWhQVDBnWkdsbFZXNWtaWEpEZFhKemIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0dKdllYSmtMQ0JrYVdObFYybDBhRzkxZEVScFpWVnVaR1Z5UTNWeWMyOXlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMGFXTkNiMkZ5WkNBOUlHTnZiblJsZUhRb1ltOWhjbVFwTG1kbGRFbHRZV2RsUkdGMFlTZ3dMQ0F3TENCallXNTJZWE11ZDJsa2RHZ3NJR05oYm5aaGN5NW9aV2xuYUhRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tFUlNRVWRIU1U1SElEMDlQU0J6ZEdGMFpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkhnZ1BTQnZjbWxuYVc0dWVDQXRJR1YyWlc1MExtTnNhV1Z1ZEZnN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlU0E5SUc5eWFXZHBiaTU1SUMwZ1pYWmxiblF1WTJ4cFpXNTBXVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2UzZ3NJSGw5SUQwZ1pHbGxWVzVrWlhKRGRYSnpiM0l1WTI5dmNtUnBibUYwWlhNN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFFvWW05aGNtUXBMbkIxZEVsdFlXZGxSR0YwWVNoemRHRjBhV05DYjJGeVpDd2dNQ3dnTUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrYVdWVmJtUmxja04xY25OdmNpNXlaVzVrWlhJb1kyOXVkR1Y0ZENoaWIyRnlaQ2tzSUdKdllYSmtMbVJwWlZOcGVtVXNJSHQ0T2lCNElDMGdaSGdzSUhrNklIa2dMU0JrZVgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOMGIzQkpiblJsY21GamRHbHZiaUE5SUNobGRtVnVkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQWhQVDBnWkdsbFZXNWtaWEpEZFhKemIzSWdKaVlnUkZKQlIwZEpUa2NnUFQwOUlITjBZWFJsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmtlQ0E5SUc5eWFXZHBiaTU0SUMwZ1pYWmxiblF1WTJ4cFpXNTBXRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSNUlEMGdiM0pwWjJsdUxua2dMU0JsZG1WdWRDNWpiR2xsYm5SWk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0I3ZUN3Z2VYMGdQU0JrYVdWVmJtUmxja04xY25OdmNpNWpiMjl5WkdsdVlYUmxjenRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2MyNWhjRlJ2UTI5dmNtUnpJRDBnWW05aGNtUXViR0Y1YjNWMExuTnVZWEJVYnloN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHbGxPaUJrYVdWVmJtUmxja04xY25OdmNpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjRPaUI0SUMwZ1pIZ3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdlVG9nZVNBdElHUjVMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTazdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUc1bGQwTnZiM0prY3lBOUlHNTFiR3dnSVQwZ2MyNWhjRlJ2UTI5dmNtUnpJRDhnYzI1aGNGUnZRMjl2Y21SeklEb2dlM2dzSUhsOU8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2FXVlZibVJsY2tOMWNuTnZjaTVqYjI5eVpHbHVZWFJsY3lBOUlHNWxkME52YjNKa2N6dGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUM4dklFTnNaV0Z5SUhOMFlYUmxYRzRnSUNBZ0lDQWdJR1JwWlZWdVpHVnlRM1Z5YzI5eUlEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ2MzUmhkR1VnUFNCT1QwNUZPMXh1WEc0Z0lDQWdJQ0FnSUM4dklGSmxabkpsYzJnZ1ltOWhjbVE3SUZKbGJtUmxjaUJrYVdObFhHNGdJQ0FnSUNBZ0lIVndaR0YwWlVKdllYSmtLR0p2WVhKa0tUdGNiaUFnSUNCOU8xeHVYRzVjYmlBZ0lDQXZMeUJTWldkcGMzUmxjaUIwYUdVZ1lXTjBkV0ZzSUdWMlpXNTBJR3hwYzNSbGJtVnljeUJrWldacGJtVmtJR0ZpYjNabExpQk5ZWEFnZEc5MVkyZ2daWFpsYm5SeklIUnZYRzRnSUNBZ0x5OGdaWEYxYVhaaGJHVnVkQ0J0YjNWelpTQmxkbVZ1ZEhNdUlFSmxZMkYxYzJVZ2RHaGxJRndpZEc5MVkyaGxibVJjSWlCbGRtVnVkQ0JrYjJWeklHNXZkQ0JvWVhabElHRmNiaUFnSUNBdkx5QmpiR2xsYm5SWUlHRnVaQ0JqYkdsbGJuUlpMQ0J5WldOdmNtUWdZVzVrSUhWelpTQjBhR1VnYkdGemRDQnZibVZ6SUdaeWIyMGdkR2hsSUZ3aWRHOTFZMmh0YjNabFhDSmNiaUFnSUNBdkx5QW9iM0lnWENKMGIzVmphSE4wWVhKMFhDSXBJR1YyWlc1MGN5NWNibHh1SUNBZ0lHeGxkQ0IwYjNWamFFTnZiM0prYVc1aGRHVnpJRDBnZTJOc2FXVnVkRmc2SURBc0lHTnNhV1Z1ZEZrNklEQjlPMXh1SUNBZ0lHTnZibk4wSUhSdmRXTm9NbTF2ZFhObFJYWmxiblFnUFNBb2JXOTFjMlZGZG1WdWRFNWhiV1VwSUQwK0lIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDaDBiM1ZqYUVWMlpXNTBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHOTFZMmhGZG1WdWRDQW1KaUF3SUR3Z2RHOTFZMmhGZG1WdWRDNTBiM1ZqYUdWekxteGxibWQwYUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUh0amJHbGxiblJZTENCamJHbGxiblJaZlNBOUlIUnZkV05vUlhabGJuUXVkRzkxWTJobGMxc3dYVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYjNWamFFTnZiM0prYVc1aGRHVnpJRDBnZTJOc2FXVnVkRmdzSUdOc2FXVnVkRmw5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnVkbUZ6TG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUUxdmRYTmxSWFpsYm5Rb2JXOTFjMlZGZG1WdWRFNWhiV1VzSUhSdmRXTm9RMjl2Y21ScGJtRjBaWE1wS1R0Y2JpQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKMGIzVmphSE4wWVhKMFhDSXNJSFJ2ZFdOb01tMXZkWE5sUlhabGJuUW9YQ0p0YjNWelpXUnZkMjVjSWlrcE8xeHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVmtiM2R1WENJc0lITjBZWEowU1c1MFpYSmhZM1JwYjI0cE8xeHVYRzRnSUNBZ2FXWWdLQ0ZpYjJGeVpDNWthWE5oWW14bFpFUnlZV2RuYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW5SdmRXTm9iVzkyWlZ3aUxDQjBiM1ZqYURKdGIzVnpaVVYyWlc1MEtGd2liVzkxYzJWdGIzWmxYQ0lwS1R0Y2JpQWdJQ0FnSUNBZ1kyRnVkbUZ6TG1Ga1pFVjJaVzUwVEdsemRHVnVaWElvWENKdGIzVnpaVzF2ZG1WY0lpd2diVzkyWlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tDRmliMkZ5WkM1a2FYTmhZbXhsWkVSeVlXZG5hVzVuUkdsalpTQjhmQ0FoWW05aGNtUXVaR2x6WVdKc1pXUkliMnhrYVc1blJHbGpaU2tnZTF4dUlDQWdJQ0FnSUNCallXNTJZWE11WVdSa1JYWmxiblJNYVhOMFpXNWxjaWhjSW0xdmRYTmxiVzkyWlZ3aUxDQnphRzkzU1c1MFpYSmhZM1JwYjI0cE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5MVkyaGxibVJjSWl3Z2RHOTFZMmd5Ylc5MWMyVkZkbVZ1ZENoY0ltMXZkWE5sZFhCY0lpa3BPMXh1SUNBZ0lHTmhiblpoY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWJXOTFjMlYxY0Z3aUxDQnpkRzl3U1c1MFpYSmhZM1JwYjI0cE8xeHVJQ0FnSUdOaGJuWmhjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpYlc5MWMyVnZkWFJjSWl3Z2MzUnZjRWx1ZEdWeVlXTjBhVzl1S1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUWdhWE1nWVNCamRYTjBiMjBnU0ZSTlRDQmxiR1Z0Wlc1MElIUnZJSEpsYm1SbGNpQmhibVFnWTI5dWRISnZiQ0JoWEc0Z0tpQmthV05sSUdKdllYSmtMaUJjYmlBcVhHNGdLaUJBWlhoMFpXNWtjeUJJVkUxTVJXeGxiV1Z1ZEZ4dUlDb3ZYRzVqYjI1emRDQlViM0JFYVdObFFtOWhjbVJJVkUxTVJXeGxiV1Z1ZENBOUlHTnNZWE56SUdWNGRHVnVaSE1nU0ZSTlRFVnNaVzFsYm5RZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUZSdmNFUnBZMlZDYjJGeVpFaFVUVXhGYkdWdFpXNTBMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJQ0FnSUNCemRYQmxjaWdwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk4wZVd4bExtUnBjM0JzWVhrZ1BTQmNJbWx1YkdsdVpTMWliRzlqYTF3aU8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCemFHRmtiM2NnUFNCMGFHbHpMbUYwZEdGamFGTm9ZV1J2ZHloN2JXOWtaVG9nWENKamJHOXpaV1JjSW4wcE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCallXNTJZWE1nUFNCa2IyTjFiV1Z1ZEM1amNtVmhkR1ZGYkdWdFpXNTBLRndpWTJGdWRtRnpYQ0lwTzF4dUlDQWdJQ0FnSUNCemFHRmtiM2N1WVhCd1pXNWtRMmhwYkdRb1kyRnVkbUZ6S1R0Y2JseHVJQ0FnSUNBZ0lDQmZZMkZ1ZG1GekxuTmxkQ2gwYUdsekxDQmpZVzUyWVhNcE8xeHVJQ0FnSUNBZ0lDQmZZM1Z5Y21WdWRGQnNZWGxsY2k1elpYUW9kR2hwY3l3Z1JFVkdRVlZNVkY5VFdWTlVSVTFmVUV4QldVVlNLVHRjYmlBZ0lDQWdJQ0FnWDJ4aGVXOTFkQzV6WlhRb2RHaHBjeXdnYm1WM0lFZHlhV1JNWVhsdmRYUW9lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2QybGtkR2c2SUhSb2FYTXVkMmxrZEdnc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JvWldsbmFIUTZJSFJvYVhNdWFHVnBaMmgwTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdaR2xsVTJsNlpUb2dkR2hwY3k1a2FXVlRhWHBsTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdaR2x6Y0dWeWMybHZiam9nZEdocGN5NWthWE53WlhKemFXOXVYRzRnSUNBZ0lDQWdJSDBwS1R0Y2JpQWdJQ0FnSUNBZ2MyVjBkWEJKYm5SbGNtRmpkR2x2YmloMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpkR0YwYVdNZ1oyVjBJRzlpYzJWeWRtVmtRWFIwY21saWRYUmxjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUZ0Y2JpQWdJQ0FnSUNBZ0lDQWdJRmRKUkZSSVgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVoRlNVZElWRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQkVTVk5RUlZKVFNVOU9YMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFUkpSVjlUU1ZwRlgwRlVWRkpKUWxWVVJTeGNiaUFnSUNBZ0lDQWdJQ0FnSUVSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMRnh1SUNBZ0lDQWdJQ0FnSUNBZ1VrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRjlCVkZSU1NVSlZWRVVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQklUMHhFU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdTRTlNUkY5RVZWSkJWRWxQVGw5QlZGUlNTVUpWVkVWY2JpQWdJQ0FnSUNBZ1hUdGNiaUFnSUNCOVhHNWNiaUFnSUNCaGRIUnlhV0oxZEdWRGFHRnVaMlZrUTJGc2JHSmhZMnNvYm1GdFpTd2diMnhrVm1Gc2RXVXNJRzVsZDFaaGJIVmxLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR05oYm5aaGN5QTlJRjlqWVc1MllYTXVaMlYwS0hSb2FYTXBPMXh1SUNBZ0lDQWdJQ0J6ZDJsMFkyZ2dLRzVoYldVcElIdGNiaUFnSUNBZ0lDQWdZMkZ6WlNCWFNVUlVTRjlCVkZSU1NVSlZWRVU2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIZHBaSFJvSUQwZ1oyVjBVRzl6YVhScGRtVk9kVzFpWlhJb2JtVjNWbUZzZFdVc0lIQmhjbk5sVG5WdFltVnlLRzlzWkZaaGJIVmxLU0I4ZkNCRVJVWkJWVXhVWDFkSlJGUklLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbmRwWkhSb0lEMGdkMmxrZEdnN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVc1MllYTXVjMlYwUVhSMGNtbGlkWFJsS0ZkSlJGUklYMEZVVkZKSlFsVlVSU3dnZDJsa2RHZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JJUlVsSFNGUmZRVlJVVWtsQ1ZWUkZPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCb1pXbG5hSFFnUFNCblpYUlFiM05wZEdsMlpVNTFiV0psY2lodVpYZFdZV3gxWlN3Z2NHRnljMlZPZFcxaVpYSW9iMnhrVm1Gc2RXVXBJSHg4SUVSRlJrRlZURlJmU0VWSlIwaFVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbWhsYVdkb2RDQTlJR2hsYVdkb2REdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaGJuWmhjeTV6WlhSQmRIUnlhV0oxZEdVb1NFVkpSMGhVWDBGVVZGSkpRbFZVUlN3Z2FHVnBaMmgwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ1JFbFRVRVZTVTBsUFRsOUJWRlJTU1VKVlZFVTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdScGMzQmxjbk5wYjI0Z1BTQm5aWFJRYjNOcGRHbDJaVTUxYldKbGNpaHVaWGRXWVd4MVpTd2djR0Z5YzJWT2RXMWlaWElvYjJ4a1ZtRnNkV1VwSUh4OElFUkZSa0ZWVEZSZlJFbFRVRVZTVTBsUFRpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbXhoZVc5MWRDNWthWE53WlhKemFXOXVJRDBnWkdsemNHVnljMmx2Ymp0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ1JFbEZYMU5KV2tWZlFWUlVVa2xDVlZSRk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JrYVdWVGFYcGxJRDBnWjJWMFVHOXphWFJwZG1WT2RXMWlaWElvYm1WM1ZtRnNkV1VzSUhCaGNuTmxUblZ0WW1WeUtHOXNaRlpoYkhWbEtTQjhmQ0JFUlVaQlZVeFVYMFJKUlY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11YkdGNWIzVjBMbVJwWlZOcGVtVWdQU0JrYVdWVGFYcGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0JTVDFSQlZFbE9SMTlFU1VORlgwUkpVMEZDVEVWRVgwRlVWRkpKUWxWVVJUb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdsellXSnNaV1JTYjNSaGRHbHZiaUE5SUdkbGRFSnZiMnhsWVc0b2JtVjNWbUZzZFdVc0lGSlBWRUZVU1U1SFgwUkpRMFZmUkVsVFFVSk1SVVJmUVZSVVVrbENWVlJGTENCblpYUkNiMjlzWldGdUtHOXNaRlpoYkhWbExDQlNUMVJCVkVsT1IxOUVTVU5GWDBSSlUwRkNURVZFWDBGVVZGSkpRbFZVUlN3Z1JFVkdRVlZNVkY5U1QxUkJWRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG14aGVXOTFkQzV5YjNSaGRHVWdQU0FoWkdsellXSnNaV1JTYjNSaGRHbHZianRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHUmxabUYxYkhRNklIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklGUm9aU0IyWVd4MVpTQnBjeUJrWlhSbGNtMXBibVZrSUhkb1pXNGdkWE5wYm1jZ2RHaGxJR2RsZEhSbGNseHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCMWNHUmhkR1ZDYjJGeVpDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JqYjI1dVpXTjBaV1JEWVd4c1ltRmpheWdwSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLRndpZEc5d0xXUnBaVHBoWkdSbFpGd2lMQ0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMWNHUmhkR1ZTWldGa2VVUnBZMlVvZEdocGN5d2dNU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYVhOU1pXRmtlU2gwYUdsektTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0hSb2FYTXNJSFJvYVhNdWJHRjViM1YwTG14aGVXOTFkQ2gwYUdsekxtUnBZMlVwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNrN1hHNWNiaUFnSUNBZ0lDQWdkR2hwY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWRHOXdMV1JwWlRweVpXMXZkbVZrWENJc0lDZ3BJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0hSb2FYTXNJSFJvYVhNdWJHRjViM1YwTG14aGVXOTFkQ2gwYUdsekxtUnBZMlVwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFZ3WkdGMFpWSmxZV1I1UkdsalpTaDBhR2x6TENBdE1TazdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lDOHZJRUZzYkNCa2FXTmxJR0p2WVhKa2N5QmtieUJvWVhabElHRWdjR3hoZVdWeUlHeHBjM1F1SUVsbUlIUm9aWEpsSUdsemJpZDBJRzl1WlNCNVpYUXNYRzRnSUNBZ0lDQWdJQzh2SUdOeVpXRjBaU0J2Ym1VdVhHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lEMDlQU0IwYUdsekxuRjFaWEo1VTJWc1pXTjBiM0lvWENKMGIzQXRjR3hoZVdWeUxXeHBjM1JjSWlrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZWEJ3Wlc1a1EyaHBiR1FvWkc5amRXMWxiblF1WTNKbFlYUmxSV3hsYldWdWRDaGNJblJ2Y0Mxd2JHRjVaWEl0YkdsemRGd2lLU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0JrYVhOamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNCOVhHNWNiaUFnSUNCaFpHOXdkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHlvcVhHNGdJQ0FnSUNvZ1ZHaGxJRWR5YVdSTVlYbHZkWFFnZFhObFpDQmllU0IwYUdseklFUnBZMlZDYjJGeVpDQjBieUJzWVhsdmRYUWdkR2hsSUdScFkyVXVYRzRnSUNBZ0lDcGNiaUFnSUNBZ0tpQkFkSGx3WlNCN2JXOWtkV3hsT2tkeWFXUk1ZWGx2ZFhSK1IzSnBaRXhoZVc5MWRIMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdiR0Y1YjNWMEtDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdYMnhoZVc5MWRDNW5aWFFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUdScFkyVWdiMjRnZEdocGN5QmliMkZ5WkM0Z1RtOTBaU3dnZEc4Z1lXTjBkV0ZzYkhrZ2RHaHliM2NnZEdobElHUnBZMlVnZFhObFhHNGdJQ0FnSUNvZ2UwQnNhVzVySUhSb2NtOTNSR2xqWlgwdUlGeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTIxdlpIVnNaVHBVYjNCRWFXVklWRTFNUld4bGJXVnVkSDVVYjNCRWFXVklWRTFNUld4bGJXVnVkRnRkZlZ4dUlDQWdJQ0FxTDF4dUlDQWdJR2RsZENCa2FXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnV3k0dUxuUm9hWE11WjJWMFJXeGxiV1Z1ZEhOQ2VWUmhaMDVoYldVb1hDSjBiM0F0WkdsbFhDSXBYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pHbGpaU0IwYUdGMElHTmhiaUJpWlNCd2RYUWdiMjRnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTA1MWJXSmxjbjBnVkdobElHMWhlR2x0ZFcwZ2JuVnRZbVZ5SUc5bUlHUnBZMlVzSURBZ1BDQnRZWGhwYlhWdExseHVJQ0FnSUNBcUwxeHVJQ0FnSUdkbGRDQnRZWGhwYlhWdFRuVnRZbVZ5VDJaRWFXTmxLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXNZWGx2ZFhRdWJXRjRhVzExYlU1MWJXSmxjazltUkdsalpUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnZDJsa2RHZ2diMllnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJSGRwWkhSb0tDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaMlYwVUc5emFYUnBkbVZPZFcxaVpYSkJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1YwbEVWRWhmUVZSVVVrbENWVlJGTENCRVJVWkJWVXhVWDFkSlJGUklLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ2FHVnBaMmgwSUc5bUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2FHVnBaMmgwS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1oyVjBVRzl6YVhScGRtVk9kVzFpWlhKQmRIUnlhV0oxZEdVb2RHaHBjeXdnU0VWSlIwaFVYMEZVVkZKSlFsVlVSU3dnUkVWR1FWVk1WRjlJUlVsSFNGUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCa2FYTndaWEp6YVc5dUlHeGxkbVZzSUc5bUlIUm9hWE1nWW05aGNtUXVYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1pHbHpjR1Z5YzJsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR2RsZEZCdmMybDBhWFpsVG5WdFltVnlRWFIwY21saWRYUmxLSFJvYVhNc0lFUkpVMUJGVWxOSlQwNWZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMFJKVTFCRlVsTkpUMDRwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQnphWHBsSUc5bUlHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUdScFpWTnBlbVVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUlFiM05wZEdsMlpVNTFiV0psY2tGMGRISnBZblYwWlNoMGFHbHpMQ0JFU1VWZlUwbGFSVjlCVkZSU1NVSlZWRVVzSUVSRlJrRlZURlJmUkVsRlgxTkpXa1VwTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVOaGJpQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUWdZbVVnWkhKaFoyZGxaRDljYmlBZ0lDQWdLaUJBZEhsd1pTQjdRbTl2YkdWaGJuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2x6WVdKc1pXUkVjbUZuWjJsdVowUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbEtIUm9hWE1zSUVSU1FVZEhTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMFJTUVVkSFNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTmhiaUJrYVdObElHOXVJSFJvYVhNZ1ltOWhjbVFnWW1VZ2FHVnNaQ0JpZVNCaElGQnNZWGxsY2o5Y2JpQWdJQ0FnS2lCQWRIbHdaU0I3UW05dmJHVmhibjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnWkdsellXSnNaV1JJYjJ4a2FXNW5SR2xqWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRUp2YjJ4bFlXNUJkSFJ5YVdKMWRHVW9kR2hwY3l3Z1NFOU1SRWxPUjE5RVNVTkZYMFJKVTBGQ1RFVkVYMEZVVkZKSlFsVlVSU3dnUkVWR1FWVk1WRjlJVDB4RVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFbHpJSEp2ZEdGMGFXNW5JR1JwWTJVZ2IyNGdkR2hwY3lCaWIyRnlaQ0JrYVhOaFlteGxaRDljYmlBZ0lDQWdLaUJBZEhsd1pTQjdRbTl2YkdWaGJuMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdaR2x6WVdKc1pXUlNiM1JoZEdsdVowUnBZMlVvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCblpYUkNiMjlzWldGdVFYUjBjbWxpZFhSbEtIUm9hWE1zSUZKUFZFRlVTVTVIWDBSSlEwVmZSRWxUUVVKTVJVUmZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMUpQVkVGVVNVNUhYMFJKUTBWZlJFbFRRVUpNUlVRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0JrZFhKaGRHbHZiaUJwYmlCdGN5QjBieUJ3Y21WemN5QjBhR1VnYlc5MWMyVWdMeUIwYjNWamFDQmhJR1JwWlNCaVpXWnZjbVVnYVhRZ1ltVnJiMjFsYzF4dUlDQWdJQ0FxSUdobGJHUWdZbmtnZEdobElGQnNZWGxsY2k0Z1NYUWdhR0Z6SUc5dWJIa2dZVzRnWldabVpXTjBJSGRvWlc0Z2RHaHBjeTVvYjJ4a1lXSnNaVVJwWTJVZ1BUMDlYRzRnSUNBZ0lDb2dkSEoxWlM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHRPZFcxaVpYSjlYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1oyVjBJR2h2YkdSRWRYSmhkR2x2YmlncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHZGxkRkJ2YzJsMGFYWmxUblZ0WW1WeVFYUjBjbWxpZFhSbEtIUm9hWE1zSUVoUFRFUmZSRlZTUVZSSlQwNWZRVlJVVWtsQ1ZWUkZMQ0JFUlVaQlZVeFVYMGhQVEVSZlJGVlNRVlJKVDA0cE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGUm9aU0J3YkdGNVpYSnpJSEJzWVhscGJtY2diMjRnZEdocGN5QmliMkZ5WkM1Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCMGVYQmxJSHR0YjJSMWJHVTZWRzl3VUd4aGVXVnlTRlJOVEVWc1pXMWxiblIrVkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5SYlhYMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdjR3hoZVdWeWN5Z3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWNYVmxjbmxUWld4bFkzUnZjaWhjSW5SdmNDMXdiR0Y1WlhJdGJHbHpkRndpS1M1d2JHRjVaWEp6TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVGeklIQnNZWGxsY2l3Z2RHaHliM2NnZEdobElHUnBZMlVnYjI0Z2RHaHBjeUJpYjJGeVpDNWNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQndZWEpoYlNCN2JXOWtkV3hsT2xSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MGZsUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBmU0JiY0d4aGVXVnlJRDBnUkVWR1FWVk1WRjlUV1ZOVVJVMWZVRXhCV1VWU1hTQXRJRlJvWlZ4dUlDQWdJQ0FxSUhCc1lYbGxjaUIwYUdGMElHbHpJSFJvY205M2FXNW5JSFJvWlNCa2FXTmxJRzl1SUhSb2FYTWdZbTloY21RdVhHNGdJQ0FnSUNwY2JpQWdJQ0FnS2lCQWNtVjBkWEp1SUh0dGIyUjFiR1U2Vkc5d1JHbGxTRlJOVEVWc1pXMWxiblIrVkc5d1JHbGxTRlJOVEVWc1pXMWxiblJiWFgwZ1ZHaGxJSFJvY205M2JpQmthV05sSUc5dUlIUm9hWE1nWW05aGNtUXVJRlJvYVhNZ2JHbHpkQ0J2WmlCa2FXTmxJR2x6SUhSb1pTQnpZVzFsSUdGeklIUm9hWE1nVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUW5jeUI3UUhObFpTQmthV05sZlNCd2NtOXdaWEowZVZ4dUlDQWdJQ0FxTDF4dUlDQWdJSFJvY205M1JHbGpaU2h3YkdGNVpYSWdQU0JFUlVaQlZVeFVYMU5aVTFSRlRWOVFURUZaUlZJcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hCc1lYbGxjaUFtSmlBaGNHeGhlV1Z5TG1oaGMxUjFjbTRwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJzWVhsbGNpNXpkR0Z5ZEZSMWNtNG9LVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCMGFHbHpMbVJwWTJVdVptOXlSV0ZqYUNoa2FXVWdQVDRnWkdsbExuUm9jbTkzU1hRb0tTazdYRzRnSUNBZ0lDQWdJSFZ3WkdGMFpVSnZZWEprS0hSb2FYTXNJSFJvYVhNdWJHRjViM1YwTG14aGVXOTFkQ2gwYUdsekxtUnBZMlVwS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVaR2xqWlR0Y2JpQWdJQ0I5WEc1OU8xeHVYRzUzYVc1a2IzY3VZM1Z6ZEc5dFJXeGxiV1Z1ZEhNdVpHVm1hVzVsS0Z3aWRHOXdMV1JwWTJVdFltOWhjbVJjSWl3Z1ZHOXdSR2xqWlVKdllYSmtTRlJOVEVWc1pXMWxiblFwTzF4dVhHNWxlSEJ2Y25RZ2UxeHVJQ0FnSUZSdmNFUnBZMlZDYjJGeVpFaFVUVXhGYkdWdFpXNTBMRnh1SUNBZ0lFUkZSa0ZWVEZSZlJFbEZYMU5KV2tVc1hHNGdJQ0FnUkVWR1FWVk1WRjlJVDB4RVgwUlZVa0ZVU1U5T0xGeHVJQ0FnSUVSRlJrRlZURlJmVjBsRVZFZ3NYRzRnSUNBZ1JFVkdRVlZNVkY5SVJVbEhTRlFzWEc0Z0lDQWdSRVZHUVZWTVZGOUVTVk5RUlZKVFNVOU9MRnh1SUNBZ0lFUkZSa0ZWVEZSZlVrOVVRVlJKVGtkZlJFbERSVjlFU1ZOQlFreEZSRnh1ZlR0Y2JpSXNJaThxS2lCY2JpQXFJRU52Y0hseWFXZG9kQ0FvWXlrZ01qQXhPU0JJZFhWaUlHUmxJRUpsWlhKY2JpQXFYRzRnS2lCVWFHbHpJR1pwYkdVZ2FYTWdjR0Z5ZENCdlppQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHWnlaV1VnYzI5bWRIZGhjbVU2SUhsdmRTQmpZVzRnY21Wa2FYTjBjbWxpZFhSbElHbDBJR0Z1WkM5dmNpQnRiMlJwWm5rZ2FYUmNiaUFxSUhWdVpHVnlJSFJvWlNCMFpYSnRjeUJ2WmlCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFl5Qk1hV05sYm5ObElHRnpJSEIxWW14cGMyaGxaQ0JpZVZ4dUlDb2dkR2hsSUVaeVpXVWdVMjltZEhkaGNtVWdSbTkxYm1SaGRHbHZiaXdnWldsMGFHVnlJSFpsY25OcGIyNGdNeUJ2WmlCMGFHVWdUR2xqWlc1elpTd2diM0lnS0dGMElIbHZkWEpjYmlBcUlHOXdkR2x2YmlrZ1lXNTVJR3hoZEdWeUlIWmxjbk5wYjI0dVhHNGdLbHh1SUNvZ1ZIZGxiblI1TFc5dVpTMXdhWEJ6SUdseklHUnBjM1J5YVdKMWRHVmtJR2x1SUhSb1pTQm9iM0JsSUhSb1lYUWdhWFFnZDJsc2JDQmlaU0IxYzJWbWRXd3NJR0oxZEZ4dUlDb2dWMGxVU0U5VlZDQkJUbGtnVjBGU1VrRk9WRms3SUhkcGRHaHZkWFFnWlhabGJpQjBhR1VnYVcxd2JHbGxaQ0IzWVhKeVlXNTBlU0J2WmlCTlJWSkRTRUZPVkVGQ1NVeEpWRmxjYmlBcUlHOXlJRVpKVkU1RlUxTWdSazlTSUVFZ1VFRlNWRWxEVlV4QlVpQlFWVkpRVDFORkxpQWdVMlZsSUhSb1pTQkhUbFVnVEdWemMyVnlJRWRsYm1WeVlXd2dVSFZpYkdsalhHNGdLaUJNYVdObGJuTmxJR1p2Y2lCdGIzSmxJR1JsZEdGcGJITXVYRzRnS2x4dUlDb2dXVzkxSUhOb2IzVnNaQ0JvWVhabElISmxZMlZwZG1Wa0lHRWdZMjl3ZVNCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxYRzRnS2lCaGJHOXVaeUIzYVhSb0lIUjNaVzUwZVMxdmJtVXRjR2x3Y3k0Z0lFbG1JRzV2ZEN3Z2MyVmxJRHhvZEhSd09pOHZkM2QzTG1kdWRTNXZjbWN2YkdsalpXNXpaWE12UGk1Y2JpQXFJRUJwWjI1dmNtVmNiaUFxTDF4dVhHNWpiMjV6ZENCV1lXeHBaR0YwYVc5dVJYSnliM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRVZ5Y205eUlIdGNiaUFnSUNCamIyNXpkSEoxWTNSdmNpaHRjMmNwSUh0Y2JpQWdJQ0FnSUNBZ2MzVndaWElvYlhObktUdGNiaUFnSUNCOVhHNTlPMXh1WEc1amIyNXpkQ0JRWVhKelpVVnljbTl5SUQwZ1kyeGhjM01nWlhoMFpXNWtjeUJXWVd4cFpHRjBhVzl1UlhKeWIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLRzF6WnlrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lodGMyY3BPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtTnZibk4wSUVsdWRtRnNhV1JVZVhCbFJYSnliM0lnUFNCamJHRnpjeUJsZUhSbGJtUnpJRlpoYkdsa1lYUnBiMjVGY25KdmNpQjdYRzRnSUNBZ1kyOXVjM1J5ZFdOMGIzSW9iWE5uS1NCN1hHNGdJQ0FnSUNBZ0lITjFjR1Z5S0cxelp5azdYRzRnSUNBZ2ZWeHVmVHRjYmx4dVkyOXVjM1FnWDNaaGJIVmxJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWtaV1poZFd4MFZtRnNkV1VnUFNCdVpYY2dWMlZoYTAxaGNDZ3BPMXh1WTI5dWMzUWdYMlZ5Y205eWN5QTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNibU52Ym5OMElGUjVjR1ZXWVd4cFpHRjBiM0lnUFNCamJHRnpjeUI3WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5Y3lBOUlGdGRmU2tnZTF4dUlDQWdJQ0FnSUNCZmRtRnNkV1V1YzJWMEtIUm9hWE1zSUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnWDJSbFptRjFiSFJXWVd4MVpTNXpaWFFvZEdocGN5d2daR1ZtWVhWc2RGWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ1gyVnljbTl5Y3k1elpYUW9kR2hwY3l3Z1pYSnliM0p6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2IzSnBaMmx1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gzWmhiSFZsTG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2RtRnNkV1VvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbWx6Vm1Gc2FXUWdQeUIwYUdsekxtOXlhV2RwYmlBNklGOWtaV1poZFd4MFZtRnNkV1V1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZENCbGNuSnZjbk1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlpYSnliM0p6TG1kbGRDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JuWlhRZ2FYTldZV3hwWkNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlEQWdQajBnZEdocGN5NWxjbkp2Y25NdWJHVnVaM1JvTzF4dUlDQWdJSDFjYmx4dUlDQWdJR1JsWm1GMWJIUlVieWh1WlhkRVpXWmhkV3gwS1NCN1hHNGdJQ0FnSUNBZ0lGOWtaV1poZFd4MFZtRnNkV1V1YzJWMEtIUm9hWE1zSUc1bGQwUmxabUYxYkhRcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmZZMmhsWTJzb2UzQnlaV1JwWTJGMFpTd2dZbWx1WkZaaGNtbGhZbXhsY3lBOUlGdGRMQ0JGY25KdmNsUjVjR1VnUFNCV1lXeHBaR0YwYVc5dVJYSnliM0o5S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhCeWIzQnZjMmwwYVc5dUlEMGdjSEpsWkdsallYUmxMbUZ3Y0d4NUtIUm9hWE1zSUdKcGJtUldZWEpwWVdKc1pYTXBPMXh1SUNBZ0lDQWdJQ0JwWmlBb0lYQnliM0J2YzJsMGFXOXVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSnZjaUE5SUc1bGR5QkZjbkp2Y2xSNWNHVW9kR2hwY3k1MllXeDFaU3dnWW1sdVpGWmhjbWxoWW14bGN5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkwyTnZibk52YkdVdWQyRnliaWhsY25KdmNpNTBiMU4wY21sdVp5Z3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11WlhKeWIzSnpMbkIxYzJnb1pYSnliM0lwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE03WEc0Z0lDQWdmVnh1ZlR0Y2JseHVYRzVqYjI1emRDQkpUbFJGUjBWU1gwUkZSa0ZWVEZSZlZrRk1WVVVnUFNBd08xeHVZMjl1YzNRZ1NXNTBaV2RsY2xSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFbE9WRVZIUlZKZlJFVkdRVlZNVkY5V1FVeFZSVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaR1ZtWVhWc2RGWmhiSFZsSUQwZ1NVNVVSVWRGVWw5RVJVWkJWVXhVWDFaQlRGVkZPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkp2Y25NZ1BTQmJYVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9UblZ0WW1WeUxtbHpTVzUwWldkbGNpaHBibkIxZENrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnYVc1d2RYUTdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvWENKemRISnBibWRjSWlBOVBUMGdkSGx3Wlc5bUlHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQndZWEp6WldSV1lXeDFaU0E5SUhCaGNuTmxTVzUwS0dsdWNIVjBMQ0F4TUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1RuVnRZbVZ5TG1selNXNTBaV2RsY2lod1lYSnpaV1JXWVd4MVpTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpTQTlJSEJoY25ObFpGWmhiSFZsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmxjbkp2Y25NdWNIVnphQ2h1WlhjZ1VHRnljMlZGY25KdmNpaHBibkIxZENrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWEp5YjNKekxuQjFjMmdvYm1WM0lFbHVkbUZzYVdSVWVYQmxSWEp5YjNJb2FXNXdkWFFwS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSE4xY0dWeUtIdDJZV3gxWlN3Z1pHVm1ZWFZzZEZaaGJIVmxMQ0JsY25KdmNuTjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnNZWEpuWlhKVWFHRnVLRzRwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVYMk5vWldOcktIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCeVpXUnBZMkYwWlRvZ0tHNHBJRDArSUhSb2FYTXViM0pwWjJsdUlENDlJRzRzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmlhVzVrVm1GeWFXRmliR1Z6T2lCYmJsMWNiaUFnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjMjFoYkd4bGNsUm9ZVzRvYmlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWTJobFkyc29lMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NISmxaR2xqWVhSbE9pQW9iaWtnUFQ0Z2RHaHBjeTV2Y21sbmFXNGdQRDBnYml4Y2JpQWdJQ0FnSUNBZ0lDQWdJR0pwYm1SV1lYSnBZV0pzWlhNNklGdHVYVnh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JpWlhSM1pXVnVLRzRzSUcwcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11WDJOb1pXTnJLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIQnlaV1JwWTJGMFpUb2dLRzRzSUcwcElEMCtJSFJvYVhNdWJHRnlaMlZ5VkdoaGJpaHVLU0FtSmlCMGFHbHpMbk50WVd4c1pYSlVhR0Z1S0cwcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnWW1sdVpGWmhjbWxoWW14bGN6b2dXMjRzSUcxZFhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtTnZibk4wSUZOVVVrbE9SMTlFUlVaQlZVeFVYMVpCVEZWRklEMGdYQ0pjSWp0Y2JtTnZibk4wSUZOMGNtbHVaMVI1Y0dWV1lXeHBaR0YwYjNJZ1BTQmpiR0Z6Y3lCbGVIUmxibVJ6SUZSNWNHVldZV3hwWkdGMGIzSWdlMXh1SUNBZ0lHTnZibk4wY25WamRHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaU0E5SUZOVVVrbE9SMTlFUlVaQlZVeFVYMVpCVEZWRk8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa1pXWmhkV3gwVm1Gc2RXVWdQU0JUVkZKSlRrZGZSRVZHUVZWTVZGOVdRVXhWUlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWlhKeWIzSnpJRDBnVzEwN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0Z3aWMzUnlhVzVuWENJZ1BUMDlJSFI1Y0dWdlppQnBibkIxZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc2RXVWdQU0JwYm5CMWREdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdWeWNtOXljeTV3ZFhOb0tHNWxkeUJKYm5aaGJHbGtWSGx3WlVWeWNtOXlLR2x1Y0hWMEtTazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCemRYQmxjaWg3ZG1Gc2RXVXNJR1JsWm1GMWJIUldZV3gxWlN3Z1pYSnliM0p6ZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYm05MFJXMXdkSGtvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDlqYUdWamF5aDdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVmthV05oZEdVNklDZ3BJRDArSUZ3aVhDSWdJVDA5SUhSb2FYTXViM0pwWjJsdVhHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibjA3WEc1Y2JtTnZibk4wSUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVZ1BTQmNJbUpzWVdOclhDSTdYRzVqYjI1emRDQkRiMnh2Y2xSNWNHVldZV3hwWkdGMGIzSWdQU0JqYkdGemN5QmxlSFJsYm1SeklGUjVjR1ZXWVd4cFpHRjBiM0lnZTF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0dsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlFTlBURTlTWDBSRlJrRlZURlJmVmtGTVZVVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUmxabUYxYkhSV1lXeDFaU0E5SUVOUFRFOVNYMFJGUmtGVlRGUmZWa0ZNVlVVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNtOXljeUE5SUZ0ZE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoY0luTjBjbWx1WjF3aUlEMDlQU0IwZVhCbGIyWWdhVzV3ZFhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGJIVmxJRDBnYVc1d2RYUTdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCbGNuSnZjbk11Y0hWemFDaHVaWGNnU1c1MllXeHBaRlI1Y0dWRmNuSnZjaWhwYm5CMWRDa3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2MzVndaWElvZTNaaGJIVmxMQ0JrWldaaGRXeDBWbUZzZFdVc0lHVnljbTl5YzMwcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm1OdmJuTjBJRlpoYkdsa1lYUnZjaUE5SUdOc1lYTnpJSHRjYmlBZ0lDQkpiblJsWjJWeUtHbHVjSFYwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dTVzUwWldkbGNsUjVjR1ZXWVd4cFpHRjBiM0lvYVc1d2RYUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lGTjBjbWx1WnlocGJuQjFkQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lGTjBjbWx1WjFSNWNHVldZV3hwWkdGMGIzSW9hVzV3ZFhRcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUVOdmJHOXlLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnUTI5c2IzSlVlWEJsVm1Gc2FXUmhkRzl5S0dsdWNIVjBLVHRjYmlBZ0lDQjlYRzU5TzF4dVhHNWpiMjV6ZENCV1lXeHBaR0YwYjNKVGFXNW5iR1YwYjI0Z1BTQnVaWGNnVm1Gc2FXUmhkRzl5S0NrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZtRnNhV1JoZEc5eVUybHVaMnhsZEc5dUlHRnpJSFpoYkdsa1lYUmxYRzU5TzF4dUlpd2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdLR01wSURJd01UZ2dTSFYxWWlCa1pTQkNaV1Z5WEc0Z0tseHVJQ29nVkdocGN5Qm1hV3hsSUdseklIQmhjblFnYjJZZ2RIZGxiblI1TFc5dVpTMXdhWEJ6TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCbWNtVmxJSE52Wm5SM1lYSmxPaUI1YjNVZ1kyRnVJSEpsWkdsemRISnBZblYwWlNCcGRDQmhibVF2YjNJZ2JXOWthV1o1SUdsMFhHNGdLaUIxYm1SbGNpQjBhR1VnZEdWeWJYTWdiMllnZEdobElFZE9WU0JNWlhOelpYSWdSMlZ1WlhKaGJDQlFkV0pzYVdNZ1RHbGpaVzV6WlNCaGN5QndkV0pzYVhOb1pXUWdZbmxjYmlBcUlIUm9aU0JHY21WbElGTnZablIzWVhKbElFWnZkVzVrWVhScGIyNHNJR1ZwZEdobGNpQjJaWEp6YVc5dUlETWdiMllnZEdobElFeHBZMlZ1YzJVc0lHOXlJQ2hoZENCNWIzVnlYRzRnS2lCdmNIUnBiMjRwSUdGdWVTQnNZWFJsY2lCMlpYSnphVzl1TGx4dUlDcGNiaUFxSUZSM1pXNTBlUzF2Ym1VdGNHbHdjeUJwY3lCa2FYTjBjbWxpZFhSbFpDQnBiaUIwYUdVZ2FHOXdaU0IwYUdGMElHbDBJSGRwYkd3Z1ltVWdkWE5sWm5Wc0xDQmlkWFJjYmlBcUlGZEpWRWhQVlZRZ1FVNVpJRmRCVWxKQlRsUlpPeUIzYVhSb2IzVjBJR1YyWlc0Z2RHaGxJR2x0Y0d4cFpXUWdkMkZ5Y21GdWRIa2diMllnVFVWU1EwaEJUbFJCUWtsTVNWUlpYRzRnS2lCdmNpQkdTVlJPUlZOVElFWlBVaUJCSUZCQlVsUkpRMVZNUVZJZ1VGVlNVRTlUUlM0Z0lGTmxaU0IwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWTF4dUlDb2dUR2xqWlc1elpTQm1iM0lnYlc5eVpTQmtaWFJoYVd4ekxseHVJQ3BjYmlBcUlGbHZkU0J6YUc5MWJHUWdhR0YyWlNCeVpXTmxhWFpsWkNCaElHTnZjSGtnYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpWeHVJQ29nWVd4dmJtY2dkMmwwYUNCMGQyVnVkSGt0YjI1bExYQnBjSE11SUNCSlppQnViM1FzSUhObFpTQThhSFIwY0RvdkwzZDNkeTVuYm5VdWIzSm5MMnhwWTJWdWMyVnpMejR1WEc0Z0tpQkFhV2R1YjNKbFhHNGdLaTljYmx4dUx5OXBiWEJ2Y25RZ2UwTnZibVpwWjNWeVlYUnBiMjVGY25KdmNuMGdabkp2YlNCY0lpNHZaWEp5YjNJdlEyOXVabWxuZFhKaGRHbHZia1Z5Y205eUxtcHpYQ0k3WEc1cGJYQnZjblFnZTFKbFlXUlBibXg1UVhSMGNtbGlkWFJsYzMwZ1puSnZiU0JjSWk0dmJXbDRhVzR2VW1WaFpFOXViSGxCZEhSeWFXSjFkR1Z6TG1welhDSTdYRzVwYlhCdmNuUWdlM1poYkdsa1lYUmxmU0JtY205dElGd2lMaTlXWVd4cFpHRjBiM0l1YW5OY0lqdGNibHh1THlvcVhHNGdLaUJBYlc5a2RXeGxYRzRnS2k5Y2JtTnZibk4wSUVOSlVrTk1SVjlFUlVkU1JVVlRJRDBnTXpZd095QXZMeUJrWldkeVpXVnpYRzVqYjI1emRDQk9WVTFDUlZKZlQwWmZVRWxRVXlBOUlEWTdJQzh2SUVSbFptRjFiSFFnTHlCeVpXZDFiR0Z5SUhOcGVDQnphV1JsWkNCa2FXVWdhR0Z6SURZZ2NHbHdjeUJ0WVhocGJYVnRMbHh1WTI5dWMzUWdSRVZHUVZWTVZGOURUMHhQVWlBOUlGd2lTWFp2Y25sY0lqdGNibU52Ym5OMElFUkZSa0ZWVEZSZldDQTlJREE3SUM4dklIQjRYRzVqYjI1emRDQkVSVVpCVlV4VVgxa2dQU0F3T3lBdkx5QndlRnh1WTI5dWMzUWdSRVZHUVZWTVZGOVNUMVJCVkVsUFRpQTlJREE3SUM4dklHUmxaM0psWlhOY2JtTnZibk4wSUVSRlJrRlZURlJmVDFCQlEwbFVXU0E5SURBdU5UdGNibHh1WTI5dWMzUWdRMDlNVDFKZlFWUlVVa2xDVlZSRklEMGdYQ0pqYjJ4dmNsd2lPMXh1WTI5dWMzUWdTRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVWdQU0JjSW1obGJHUXRZbmxjSWp0Y2JtTnZibk4wSUZCSlVGTmZRVlJVVWtsQ1ZWUkZJRDBnWENKd2FYQnpYQ0k3WEc1amIyNXpkQ0JTVDFSQlZFbFBUbDlCVkZSU1NVSlZWRVVnUFNCY0luSnZkR0YwYVc5dVhDSTdYRzVqYjI1emRDQllYMEZVVkZKSlFsVlVSU0E5SUZ3aWVGd2lPMXh1WTI5dWMzUWdXVjlCVkZSU1NVSlZWRVVnUFNCY0lubGNJanRjYmx4dVkyOXVjM1FnUWtGVFJWOUVTVVZmVTBsYVJTQTlJREV3TURzZ0x5OGdjSGhjYm1OdmJuTjBJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJRDBnTVRVN0lDOHZJSEI0WEc1amIyNXpkQ0JDUVZORlgxTlVVazlMUlY5WFNVUlVTQ0E5SURJdU5Uc2dMeThnY0hoY2JtTnZibk4wSUUxSlRsOVRWRkpQUzBWZlYwbEVWRWdnUFNBeE95QXZMeUJ3ZUZ4dVkyOXVjM1FnU0VGTVJpQTlJRUpCVTBWZlJFbEZYMU5KV2tVZ0x5QXlPeUF2THlCd2VGeHVZMjl1YzNRZ1ZFaEpVa1FnUFNCQ1FWTkZYMFJKUlY5VFNWcEZJQzhnTXpzZ0x5OGdjSGhjYm1OdmJuTjBJRkJKVUY5VFNWcEZJRDBnUWtGVFJWOUVTVVZmVTBsYVJTQXZJREUxT3lBdkwzQjRYRzVqYjI1emRDQlFTVkJmUTA5TVQxSWdQU0JjSW1Kc1lXTnJYQ0k3WEc1Y2JtTnZibk4wSUdSbFp6SnlZV1FnUFNBb1pHVm5LU0E5UGlCN1hHNGdJQ0FnY21WMGRYSnVJR1JsWnlBcUlDaE5ZWFJvTGxCSklDOGdNVGd3S1R0Y2JuMDdYRzVjYm1OdmJuTjBJR2x6VUdsd1RuVnRZbVZ5SUQwZ2JpQTlQaUI3WEc0Z0lDQWdZMjl1YzNRZ2JuVnRZbVZ5SUQwZ2NHRnljMlZKYm5Rb2Jpd2dNVEFwTzF4dUlDQWdJSEpsZEhWeWJpQk9kVzFpWlhJdWFYTkpiblJsWjJWeUtHNTFiV0psY2lrZ0ppWWdNU0E4UFNCdWRXMWlaWElnSmlZZ2JuVnRZbVZ5SUR3OUlFNVZUVUpGVWw5UFJsOVFTVkJUTzF4dWZUdGNibHh1THlvcVhHNGdLaUJIWlc1bGNtRjBaU0JoSUhKaGJtUnZiU0J1ZFcxaVpYSWdiMllnY0dsd2N5QmlaWFIzWldWdUlERWdZVzVrSUhSb1pTQk9WVTFDUlZKZlQwWmZVRWxRVXk1Y2JpQXFYRzRnS2lCQWNtVjBkWEp1Y3lCN1RuVnRZbVZ5ZlNCQklISmhibVJ2YlNCdWRXMWlaWElnYml3Z01TRGlpYVFnYmlEaWlhUWdUbFZOUWtWU1gwOUdYMUJKVUZNdVhHNGdLaTljYm1OdmJuTjBJSEpoYm1SdmJWQnBjSE1nUFNBb0tTQTlQaUJOWVhSb0xtWnNiMjl5S0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUJPVlUxQ1JWSmZUMFpmVUVsUVV5a2dLeUF4TzF4dVhHNWpiMjV6ZENCRVNVVmZWVTVKUTA5RVJWOURTRUZTUVVOVVJWSlRJRDBnVzF3aTRwcUFYQ0lzWENMaW1vRmNJaXhjSXVLYWdsd2lMRndpNHBxRFhDSXNYQ0xpbW9SY0lpeGNJdUthaFZ3aVhUdGNibHh1THlvcVhHNGdLaUJEYjI1MlpYSjBJR0VnZFc1cFkyOWtaU0JqYUdGeVlXTjBaWElnY21Wd2NtVnpaVzUwYVc1bklHRWdaR2xsSUdaaFkyVWdkRzhnZEdobElHNTFiV0psY2lCdlppQndhWEJ6SUc5bVhHNGdLaUIwYUdGMElITmhiV1VnWkdsbExpQlVhR2x6SUdaMWJtTjBhVzl1SUdseklIUm9aU0J5WlhabGNuTmxJRzltSUhCcGNITlViMVZ1YVdOdlpHVXVYRzRnS2x4dUlDb2dRSEJoY21GdElIdFRkSEpwYm1kOUlIVWdMU0JVYUdVZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhJZ2RHOGdZMjl1ZG1WeWRDQjBieUJ3YVhCekxseHVJQ29nUUhKbGRIVnlibk1nZTA1MWJXSmxjbngxYm1SbFptbHVaV1I5SUZSb1pTQmpiM0p5WlhOd2IyNWthVzVuSUc1MWJXSmxjaUJ2WmlCd2FYQnpMQ0F4SU9LSnBDQndhWEJ6SU9LSnBDQTJMQ0J2Y2x4dUlDb2dkVzVrWldacGJtVmtJR2xtSUhVZ2QyRnpJRzV2ZENCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlISmxjSEpsYzJWdWRHbHVaeUJoSUdScFpTNWNiaUFxTDF4dVkyOXVjM1FnZFc1cFkyOWtaVlJ2VUdsd2N5QTlJQ2gxS1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnWkdsbFEyaGhja2x1WkdWNElEMGdSRWxGWDFWT1NVTlBSRVZmUTBoQlVrRkRWRVZTVXk1cGJtUmxlRTltS0hVcE8xeHVJQ0FnSUhKbGRIVnliaUF3SUR3OUlHUnBaVU5vWVhKSmJtUmxlQ0EvSUdScFpVTm9ZWEpKYm1SbGVDQXJJREVnT2lCMWJtUmxabWx1WldRN1hHNTlPMXh1WEc0dktpcGNiaUFxSUVOdmJuWmxjblFnWVNCdWRXMWlaWElnYjJZZ2NHbHdjeXdnTVNEaWlhUWdjR2x3Y3lEaWlhUWdOaUIwYnlCaElIVnVhV052WkdVZ1kyaGhjbUZqZEdWeVhHNGdLaUJ5WlhCeVpYTmxiblJoZEdsdmJpQnZaaUIwYUdVZ1kyOXljbVZ6Y0c5dVpHbHVaeUJrYVdVZ1ptRmpaUzRnVkdocGN5Qm1kVzVqZEdsdmJpQnBjeUIwYUdVZ2NtVjJaWEp6WlZ4dUlDb2diMllnZFc1cFkyOWtaVlJ2VUdsd2N5NWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2NDQXRJRlJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjeUIwYnlCamIyNTJaWEowSUhSdklHRWdkVzVwWTI5a1pTQmphR0Z5WVdOMFpYSXVYRzRnS2lCQWNtVjBkWEp1Y3lCN1UzUnlhVzVuZkhWdVpHVm1hVzVsWkgwZ1ZHaGxJR052Y25KbGMzQnZibVJwYm1jZ2RXNXBZMjlrWlNCamFHRnlZV04wWlhKeklHOXlYRzRnS2lCMWJtUmxabWx1WldRZ2FXWWdjQ0IzWVhNZ2JtOTBJR0psZEhkbFpXNGdNU0JoYm1RZ05pQnBibU5zZFhOcGRtVXVYRzRnS2k5Y2JtTnZibk4wSUhCcGNITlViMVZ1YVdOdlpHVWdQU0J3SUQwK0lHbHpVR2x3VG5WdFltVnlLSEFwSUQ4Z1JFbEZYMVZPU1VOUFJFVmZRMGhCVWtGRFZFVlNVMXR3SUMwZ01WMGdPaUIxYm1SbFptbHVaV1E3WEc1Y2JtTnZibk4wSUhKbGJtUmxja2h2YkdRZ1BTQW9ZMjl1ZEdWNGRDd2dlQ3dnZVN3Z2QybGtkR2dzSUdOdmJHOXlLU0E5UGlCN1hHNGdJQ0FnWTI5dWMzUWdVMFZRUlZKQlZFOVNJRDBnZDJsa2RHZ2dMeUF6TUR0Y2JpQWdJQ0JqYjI1MFpYaDBMbk5oZG1Vb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1kc2IySmhiRUZzY0doaElEMGdSRVZHUVZWTVZGOVBVRUZEU1ZSWk8xeHVJQ0FnSUdOdmJuUmxlSFF1WW1WbmFXNVFZWFJvS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVtYVd4c1UzUjViR1VnUFNCamIyeHZjanRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWg0SUNzZ2QybGtkR2dzSUhrZ0t5QjNhV1IwYUN3Z2QybGtkR2dnTFNCVFJWQkZVa0ZVVDFJc0lEQXNJRElnS2lCTllYUm9MbEJKTENCbVlXeHpaU2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNW1hV3hzS0NrN1hHNGdJQ0FnWTI5dWRHVjRkQzV5WlhOMGIzSmxLQ2s3WEc1OU8xeHVYRzVqYjI1emRDQnlaVzVrWlhKRWFXVWdQU0FvWTI5dWRHVjRkQ3dnZUN3Z2VTd2dkMmxrZEdnc0lHTnZiRzl5S1NBOVBpQjdYRzRnSUNBZ1kyOXVjM1FnVTBOQlRFVWdQU0FvZDJsa2RHZ2dMeUJJUVV4R0tUdGNiaUFnSUNCamIyNXpkQ0JJUVV4R1gwbE9Ua1ZTWDFOSldrVWdQU0JOWVhSb0xuTnhjblFvZDJsa2RHZ2dLaW9nTWlBdklESXBPMXh1SUNBZ0lHTnZibk4wSUVsT1RrVlNYMU5KV2tVZ1BTQXlJQ29nU0VGTVJsOUpUazVGVWw5VFNWcEZPMXh1SUNBZ0lHTnZibk4wSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5QTlJRUpCVTBWZlVrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRJQ29nVTBOQlRFVTdYRzRnSUNBZ1kyOXVjM1FnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUQwZ1NVNU9SVkpmVTBsYVJTQXRJRElnS2lCU1QxVk9SRVZFWDBOUFVrNUZVbDlTUVVSSlZWTTdYRzRnSUNBZ1kyOXVjM1FnVTFSU1QwdEZYMWRKUkZSSUlEMGdUV0YwYUM1dFlYZ29UVWxPWDFOVVVrOUxSVjlYU1VSVVNDd2dRa0ZUUlY5VFZGSlBTMFZmVjBsRVZFZ2dLaUJUUTBGTVJTazdYRzVjYmlBZ0lDQmpiMjV6ZENCemRHRnlkRmdnUFNCNElDc2dkMmxrZEdnZ0xTQklRVXhHWDBsT1RrVlNYMU5KV2tVZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk03WEc0Z0lDQWdZMjl1YzNRZ2MzUmhjblJaSUQwZ2VTQXJJSGRwWkhSb0lDMGdTRUZNUmw5SlRrNUZVbDlUU1ZwRk8xeHVYRzRnSUNBZ1kyOXVkR1Y0ZEM1ellYWmxLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNWlaV2RwYmxCaGRHZ29LVHRjYmlBZ0lDQmpiMjUwWlhoMExtWnBiR3hUZEhsc1pTQTlJR052Ykc5eU8xeHVJQ0FnSUdOdmJuUmxlSFF1YzNSeWIydGxVM1I1YkdVZ1BTQmNJbUpzWVdOclhDSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1c2FXNWxWMmxrZEdnZ1BTQlRWRkpQUzBWZlYwbEVWRWc3WEc0Z0lDQWdZMjl1ZEdWNGRDNXRiM1psVkc4b2MzUmhjblJZTENCemRHRnlkRmtwTzF4dUlDQWdJR052Ym5SbGVIUXViR2x1WlZSdktITjBZWEowV0NBcklFbE9Ua1ZTWDFOSldrVmZVazlWVGtSRlJDd2djM1JoY25SWktUdGNiaUFnSUNCamIyNTBaWGgwTG1GeVl5aHpkR0Z5ZEZnZ0t5QkpUazVGVWw5VFNWcEZYMUpQVlU1RVJVUXNJSE4wWVhKMFdTQXJJRkpQVlU1RVJVUmZRMDlTVGtWU1gxSkJSRWxWVXl3Z1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRMQ0JrWldjeWNtRmtLREkzTUNrc0lHUmxaekp5WVdRb01Da3BPMXh1SUNBZ0lHTnZiblJsZUhRdWJHbHVaVlJ2S0hOMFlYSjBXQ0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnYzNSaGNuUlpJQ3NnU1U1T1JWSmZVMGxhUlY5U1QxVk9SRVZFSUNzZ1VrOVZUa1JGUkY5RFQxSk9SVkpmVWtGRVNWVlRLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ2dLeUJKVGs1RlVsOVRTVnBGWDFKUFZVNUVSVVFzSUhOMFlYSjBXU0FySUVsT1RrVlNYMU5KV2tWZlVrOVZUa1JGUkNBcklGSlBWVTVFUlVSZlEwOVNUa1ZTWDFKQlJFbFZVeXdnVWs5VlRrUkZSRjlEVDFKT1JWSmZVa0ZFU1ZWVExDQmtaV2N5Y21Ga0tEQXBMQ0JrWldjeWNtRmtLRGt3S1NrN1hHNGdJQ0FnWTI5dWRHVjRkQzVzYVc1bFZHOG9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QkpUazVGVWw5VFNWcEZLVHRjYmlBZ0lDQmpiMjUwWlhoMExtRnlZeWh6ZEdGeWRGZ3NJSE4wWVhKMFdTQXJJRWxPVGtWU1gxTkpXa1ZmVWs5VlRrUkZSQ0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2dVazlWVGtSRlJGOURUMUpPUlZKZlVrRkVTVlZUTENCa1pXY3ljbUZrS0Rrd0tTd2daR1ZuTW5KaFpDZ3hPREFwS1R0Y2JpQWdJQ0JqYjI1MFpYaDBMbXhwYm1WVWJ5aHpkR0Z5ZEZnZ0xTQlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUhOMFlYSjBXU0FySUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5azdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9jM1JoY25SWUxDQnpkR0Z5ZEZrZ0t5QlNUMVZPUkVWRVgwTlBVazVGVWw5U1FVUkpWVk1zSUZKUFZVNUVSVVJmUTA5U1RrVlNYMUpCUkVsVlV5d2daR1ZuTW5KaFpDZ3hPREFwTENCa1pXY3ljbUZrS0RJM01Da3BPMXh1WEc0Z0lDQWdZMjl1ZEdWNGRDNXpkSEp2YTJVb0tUdGNiaUFnSUNCamIyNTBaWGgwTG1acGJHd29LVHRjYmlBZ0lDQmpiMjUwWlhoMExuSmxjM1J2Y21Vb0tUdGNibjA3WEc1Y2JtTnZibk4wSUhKbGJtUmxjbEJwY0NBOUlDaGpiMjUwWlhoMExDQjRMQ0I1TENCM2FXUjBhQ2tnUFQ0Z2UxeHVJQ0FnSUdOdmJuUmxlSFF1YzJGMlpTZ3BPMXh1SUNBZ0lHTnZiblJsZUhRdVltVm5hVzVRWVhSb0tDazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNVM1I1YkdVZ1BTQlFTVkJmUTA5TVQxSTdYRzRnSUNBZ1kyOXVkR1Y0ZEM1dGIzWmxWRzhvZUN3Z2VTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1aGNtTW9lQ3dnZVN3Z2QybGtkR2dzSURBc0lESWdLaUJOWVhSb0xsQkpMQ0JtWVd4elpTazdYRzRnSUNBZ1kyOXVkR1Y0ZEM1bWFXeHNLQ2s3WEc0Z0lDQWdZMjl1ZEdWNGRDNXlaWE4wYjNKbEtDazdYRzU5TzF4dVhHNWNiaTh2SUZCeWFYWmhkR1VnY0hKdmNHVnlkR2xsYzF4dVkyOXVjM1FnWDJKdllYSmtJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOWpiMnh2Y2lBOUlHNWxkeUJYWldGclRXRndLQ2s3WEc1amIyNXpkQ0JmYUdWc1pFSjVJRDBnYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElGOXdhWEJ6SUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJRjl5YjNSaGRHbHZiaUE5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlQ0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQmZlU0E5SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVjYmk4cUtseHVJQ29nVkc5d1JHbGxTRlJOVEVWc1pXMWxiblFnYVhNZ2RHaGxJRndpZEc5d0xXUnBaVndpSUdOMWMzUnZiU0JiU0ZSTlRGeHVJQ29nWld4bGJXVnVkRjBvYUhSMGNITTZMeTlrWlhabGJHOXdaWEl1Ylc5NmFXeHNZUzV2Y21jdlpXNHRWVk12Wkc5amN5OVhaV0l2UVZCSkwwaFVUVXhGYkdWdFpXNTBLU0J5WlhCeVpYTmxiblJwYm1jZ1lTQmthV1ZjYmlBcUlHOXVJSFJvWlNCa2FXTmxJR0p2WVhKa0xseHVJQ3BjYmlBcUlFQmxlSFJsYm1SeklFaFVUVXhGYkdWdFpXNTBYRzRnS2lCQWJXbDRaWE1nYlc5a2RXeGxPbTFwZUdsdUwxSmxZV1JQYm14NVFYUjBjbWxpZFhSbGMzNVNaV0ZrVDI1c2VVRjBkSEpwWW5WMFpYTmNiaUFxTDF4dVkyOXVjM1FnVkc5d1JHbGxTRlJOVEVWc1pXMWxiblFnUFNCamJHRnpjeUJsZUhSbGJtUnpJRkpsWVdSUGJteDVRWFIwY21saWRYUmxjeWhJVkUxTVJXeGxiV1Z1ZENrZ2UxeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dRM0psWVhSbElHRWdibVYzSUZSdmNFUnBaVWhVVFV4RmJHVnRaVzUwTGx4dUlDQWdJQ0FxTDF4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0NrZ2UxeHVJQ0FnSUNBZ0lDQnpkWEJsY2lncE8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElIQnBjSE1nUFNCMllXeHBaR0YwWlZ4dUlDQWdJQ0FnSUNBZ0lDQWdMa2x1ZEdWblpYSW9kR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9VRWxRVTE5QlZGUlNTVUpWVkVVcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1KbGRIZGxaVzRvTVN3Z05pbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b2NtRnVaRzl0VUdsd2N5Z3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xuWmhiSFZsTzF4dVhHNGdJQ0FnSUNBZ0lGOXdhWEJ6TG5ObGRDaDBhR2x6TENCd2FYQnpLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVUVsUVUxOUJWRlJTU1VKVlZFVXNJSEJwY0hNcE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdVkyOXNiM0lnUFNCMllXeHBaR0YwWlM1RGIyeHZjaWgwYUdsekxtZGxkRUYwZEhKcFluVjBaU2hEVDB4UFVsOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgwTlBURTlTS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMblpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtOTBZWFJwYjI0Z1BTQjJZV3hwWkdGMFpTNUpiblJsWjJWeUtIUm9hWE11WjJWMFFYUjBjbWxpZFhSbEtGSlBWRUZVU1U5T1gwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdVltVjBkMlZsYmlnd0xDQXpOakFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQXVaR1ZtWVhWc2RGUnZLRVJGUmtGVlRGUmZVazlVUVZSSlQwNHBYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTU0SUQwZ2RtRnNhV1JoZEdVdVNXNTBaV2RsY2loMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoWVgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJHRnlaMlZ5VkdoaGJpZ3dLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgxZ3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTU1SUQwZ2RtRnNhV1JoZEdVdVNXNTBaV2RsY2loMGFHbHpMbWRsZEVGMGRISnBZblYwWlNoWlgwRlVWRkpKUWxWVVJTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWJHRnlaMlZ5VkdoaGJpZ3dLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtUmxabUYxYkhSVWJ5aEVSVVpCVlV4VVgxa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBdWRtRnNkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVvWld4a1Fua2dQU0IyWVd4cFpHRjBaUzVUZEhKcGJtY29kR2hwY3k1blpYUkJkSFJ5YVdKMWRHVW9TRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ0xtNXZkRVZ0Y0hSNUtDbGNiaUFnSUNBZ0lDQWdJQ0FnSUM1a1pXWmhkV3gwVkc4b2JuVnNiQ2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDNTJZV3gxWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6ZEdGMGFXTWdaMlYwSUc5aWMyVnlkbVZrUVhSMGNtbGlkWFJsY3lncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGdGNiaUFnSUNBZ0lDQWdJQ0FnSUVOUFRFOVNYMEZVVkZKSlFsVlVSU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lFaEZURVJmUWxsZlFWUlVVa2xDVlZSRkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnVUVsUVUxOUJWRlJTU1VKVlZFVXNYRzRnSUNBZ0lDQWdJQ0FnSUNCU1QxUkJWRWxQVGw5QlZGUlNTVUpWVkVVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JZWDBGVVZGSkpRbFZVUlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJRmxmUVZSVVVrbENWVlJGWEc0Z0lDQWdJQ0FnSUYwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWTI5dWJtVmpkR1ZrUTJGc2JHSmhZMnNvS1NCN1hHNGdJQ0FnSUNBZ0lGOWliMkZ5WkM1elpYUW9kR2hwY3l3Z2RHaHBjeTV3WVhKbGJuUk9iMlJsS1R0Y2JpQWdJQ0FnSUNBZ1gySnZZWEprTG1kbGRDaDBhR2x6S1M1a2FYTndZWFJqYUVWMlpXNTBLRzVsZHlCRmRtVnVkQ2hjSW5SdmNDMWthV1U2WVdSa1pXUmNJaWtwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR1JwYzJOdmJtNWxZM1JsWkVOaGJHeGlZV05yS0NrZ2UxeHVJQ0FnSUNBZ0lDQmZZbTloY21RdVoyVjBLSFJvYVhNcExtUnBjM0JoZEdOb1JYWmxiblFvYm1WM0lFVjJaVzUwS0Z3aWRHOXdMV1JwWlRweVpXMXZkbVZrWENJcEtUdGNiaUFnSUNBZ0lDQWdYMkp2WVhKa0xuTmxkQ2gwYUdsekxDQnVkV3hzS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGIyNTJaWEowSUhSb2FYTWdSR2xsSUhSdklIUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIVnVhV052WkdVZ1kyaGhjbUZqZEdWeUlHOW1JR0VnWkdsbElHWmhZMlV1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRUZEhKcGJtZDlJRlJvWlNCMWJtbGpiMlJsSUdOb1lYSmhZM1JsY2lCamIzSnlaWE53YjI1a2FXNW5JSFJ2SUhSb1pTQnVkVzFpWlhJZ2IyWmNiaUFnSUNBZ0tpQndhWEJ6SUc5bUlIUm9hWE1nUkdsbExseHVJQ0FnSUNBcUwxeHVJQ0FnSUhSdlZXNXBZMjlrWlNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIQnBjSE5VYjFWdWFXTnZaR1VvZEdocGN5NXdhWEJ6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCRGNtVmhkR1VnWVNCemRISnBibWNnY21Wd2NtVnpaVzVoZEdsdmJpQm1iM0lnZEdocGN5QmthV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBY21WMGRYSnVJSHRUZEhKcGJtZDlJRlJvWlNCMWJtbGpiMlJsSUhONWJXSnZiQ0JqYjNKeVpYTndiMjVrYVc1bklIUnZJSFJvWlNCdWRXMWlaWElnYjJZZ2NHbHdjMXh1SUNBZ0lDQXFJRzltSUhSb2FYTWdaR2xsTGx4dUlDQWdJQ0FxTDF4dUlDQWdJSFJ2VTNSeWFXNW5LQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NTBiMVZ1YVdOdlpHVW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdseklFUnBaU2R6SUc1MWJXSmxjaUJ2WmlCd2FYQnpMQ0F4SU9LSnBDQndhWEJ6SU9LSnBDQTJMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UwNTFiV0psY24xY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ2NHbHdjeWdwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5d2FYQnpMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdseklFUnBaU2R6SUdOdmJHOXlMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxTjBjbWx1WjMxY2JpQWdJQ0FnS2k5Y2JpQWdJQ0JuWlhRZ1kyOXNiM0lvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCZlkyOXNiM0l1WjJWMEtIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnpaWFFnWTI5c2IzSW9ibVYzUTI5c2IzSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHNTFiR3dnUFQwOUlHNWxkME52Ykc5eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYlc5MlpVRjBkSEpwWW5WMFpTaERUMHhQVWw5QlZGUlNTVUpWVkVVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWDJOdmJHOXlMbk5sZENoMGFHbHpMQ0JFUlVaQlZVeFVYME5QVEU5U0tUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5amIyeHZjaTV6WlhRb2RHaHBjeXdnYm1WM1EyOXNiM0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1elpYUkJkSFJ5YVdKMWRHVW9RMDlNVDFKZlFWUlVVa2xDVlZSRkxDQnVaWGREYjJ4dmNpazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUZSb1pTQlFiR0Y1WlhJZ2RHaGhkQ0JwY3lCb2IyeGthVzVuSUhSb2FYTWdSR2xsTENCcFppQmhibmt1SUU1MWJHd2diM1JvWlhKM2FYTmxMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRSFI1Y0dVZ2UxQnNZWGxsY254dWRXeHNmU0JjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnYUdWc1pFSjVLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWDJobGJHUkNlUzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0JvWld4a1Fua29jR3hoZVdWeUtTQjdYRzRnSUNBZ0lDQWdJRjlvWld4a1Fua3VjMlYwS0hSb2FYTXNJSEJzWVhsbGNpazdYRzRnSUNBZ0lDQWdJR2xtSUNodWRXeHNJRDA5UFNCd2JHRjVaWElwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnRiM1psUVhSMGNtbGlkWFJsS0Z3aWFHVnNaQzFpZVZ3aUtUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0Z3aWFHVnNaQzFpZVZ3aUxDQndiR0Y1WlhJdWRHOVRkSEpwYm1jb0tTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZLaXBjYmlBZ0lDQWdLaUJVYUdVZ1kyOXZjbVJwYm1GMFpYTWdiMllnZEdocGN5QkVhV1V1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdRMjl2Y21ScGJtRjBaWE44Ym5Wc2JIMWNiaUFnSUNBZ0tpOWNiaUFnSUNCblpYUWdZMjl2Y21ScGJtRjBaWE1vS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCdWRXeHNJRDA5UFNCMGFHbHpMbmdnZkh3Z2JuVnNiQ0E5UFQwZ2RHaHBjeTU1SUQ4Z2JuVnNiQ0E2SUh0NE9pQjBhR2x6TG5nc0lIazZJSFJvYVhNdWVYMDdYRzRnSUNBZ2ZWeHVJQ0FnSUhObGRDQmpiMjl5WkdsdVlYUmxjeWhqS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h1ZFd4c0lEMDlQU0JqS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuZ2dQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NTVJRDBnYm5Wc2JEdGNiaUFnSUNBZ0lDQWdmU0JsYkhObGUxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdlM2dzSUhsOUlEMGdZenRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11ZUNBOUlIZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbmtnUFNCNU8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dSRzlsY3lCMGFHbHpJRVJwWlNCb1lYWmxJR052YjNKa2FXNWhkR1Z6UDF4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhKbGRIVnliaUI3UW05dmJHVmhibjBnVkhKMVpTQjNhR1Z1SUhSb1pTQkVhV1VnWkc5bGN5Qm9ZWFpsSUdOdmIzSmthVzVoZEdWelhHNGdJQ0FnSUNvdlhHNGdJQ0FnYUdGelEyOXZjbVJwYm1GMFpYTW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lDRTlQU0IwYUdsekxtTnZiM0prYVc1aGRHVnpPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCNElHTnZiM0prYVc1aGRHVmNiaUFnSUNBZ0tseHVJQ0FnSUNBcUlFQjBlWEJsSUh0T2RXMWlaWEo5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhnb0tTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmZlQzVuWlhRb2RHaHBjeWs3WEc0Z0lDQWdmVnh1SUNBZ0lITmxkQ0I0S0c1bGQxZ3BJSHRjYmlBZ0lDQWdJQ0FnWDNndWMyVjBLSFJvYVhNc0lHNWxkMWdwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbk5sZEVGMGRISnBZblYwWlNoY0luaGNJaXdnYm1WM1dDazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhrZ1kyOXZjbVJwYm1GMFpWeHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTA1MWJXSmxjbjFjYmlBZ0lDQWdLaTljYmlBZ0lDQm5aWFFnZVNncElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlGOTVMbWRsZENoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2MyVjBJSGtvYm1WM1dTa2dlMXh1SUNBZ0lDQWdJQ0JmZVM1elpYUW9kR2hwY3l3Z2JtVjNXU2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjMlYwUVhSMGNtbGlkWFJsS0Z3aWVWd2lMQ0J1WlhkWktUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhR1VnY205MFlYUnBiMjRnYjJZZ2RHaHBjeUJFYVdVdUlEQWc0b21rSUhKdmRHRjBhVzl1SU9LSnBDQXpOakF1WEc0Z0lDQWdJQ3BjYmlBZ0lDQWdLaUJBZEhsd1pTQjdUblZ0WW1WeWZHNTFiR3g5WEc0Z0lDQWdJQ292WEc0Z0lDQWdaMlYwSUhKdmRHRjBhVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1gzSnZkR0YwYVc5dUxtZGxkQ2gwYUdsektUdGNiaUFnSUNCOVhHNGdJQ0FnYzJWMElISnZkR0YwYVc5dUtHNWxkMUlwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMDlJRzVsZDFJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ0YjNabFFYUjBjbWxpZFhSbEtGd2ljbTkwWVhScGIyNWNJaWs3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCdWIzSnRZV3hwZW1Wa1VtOTBZWFJwYjI0Z1BTQnVaWGRTSUNVZ1EwbFNRMHhGWDBSRlIxSkZSVk03WEc0Z0lDQWdJQ0FnSUNBZ0lDQmZjbTkwWVhScGIyNHVjMlYwS0hSb2FYTXNJRzV2Y20xaGJHbDZaV1JTYjNSaGRHbHZiaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5ObGRFRjBkSEpwWW5WMFpTaGNJbkp2ZEdGMGFXOXVYQ0lzSUc1dmNtMWhiR2w2WldSU2IzUmhkR2x2YmlrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlVhSEp2ZHlCMGFHbHpJRVJwWlM0Z1ZHaGxJRzUxYldKbGNpQnZaaUJ3YVhCeklIUnZJR0VnY21GdVpHOXRJRzUxYldKbGNpQnVMQ0F4SU9LSnBDQnVJT0tKcENBMkxseHVJQ0FnSUNBcUlFOXViSGtnWkdsalpTQjBhR0YwSUdGeVpTQnViM1FnWW1WcGJtY2dhR1ZzWkNCallXNGdZbVVnZEdoeWIzZHVMbHh1SUNBZ0lDQXFYRzRnSUNBZ0lDb2dRR1pwY21WeklGd2lkRzl3T25Sb2NtOTNMV1JwWlZ3aUlIZHBkR2dnY0dGeVlXMWxkR1Z5Y3lCMGFHbHpJRVJwWlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0IwYUhKdmQwbDBLQ2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9JWFJvYVhNdWFYTklaV3hrS0NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5d2FYQnpMbk5sZENoMGFHbHpMQ0J5WVc1a2IyMVFhWEJ6S0NrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXpaWFJCZEhSeWFXSjFkR1VvVUVsUVUxOUJWRlJTU1VKVlZFVXNJSFJvYVhNdWNHbHdjeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1ScGMzQmhkR05vUlhabGJuUW9ibVYzSUVWMlpXNTBLRndpZEc5d09uUm9jbTkzTFdScFpWd2lMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdWMFlXbHNPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHUnBaVG9nZEdocGMxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRlJvWlNCd2JHRjVaWElnYUc5c1pITWdkR2hwY3lCRWFXVXVJRUVnY0d4aGVXVnlJR05oYmlCdmJteDVJR2h2YkdRZ1lTQmthV1VnZEdoaGRDQnBjeUJ1YjNSY2JpQWdJQ0FnS2lCaVpXbHVaeUJvWld4a0lHSjVJR0Z1YjNSb1pYSWdjR3hoZVdWeUlIbGxkQzVjYmlBZ0lDQWdLbHh1SUNBZ0lDQXFJRUJ3WVhKaGJTQjdiVzlrZFd4bE9sQnNZWGxsY241UWJHRjVaWEo5SUhCc1lYbGxjaUF0SUZSb1pTQndiR0Y1WlhJZ2QyaHZJSGRoYm5SeklIUnZJR2h2YkdRZ2RHaHBjeUJFYVdVdVhHNGdJQ0FnSUNvZ1FHWnBjbVZ6SUZ3aWRHOXdPbWh2YkdRdFpHbGxYQ0lnZDJsMGFDQndZWEpoYldWMFpYSnpJSFJvYVhNZ1JHbGxJR0Z1WkNCMGFHVWdjR3hoZVdWeUxseHVJQ0FnSUNBcUwxeHVJQ0FnSUdodmJHUkpkQ2h3YkdGNVpYSXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDRjBhR2x6TG1selNHVnNaQ2dwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtaGxiR1JDZVNBOUlIQnNZWGxsY2p0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVpHbHpjR0YwWTJoRmRtVnVkQ2h1WlhjZ1JYWmxiblFvWENKMGIzQTZhRzlzWkMxa2FXVmNJaXdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbGRHRnBiRG9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthV1U2SUhSb2FYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCc1lYbGxjbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJQzhxS2x4dUlDQWdJQ0FxSUVseklIUm9hWE1nUkdsbElHSmxhVzVuSUdobGJHUWdZbmtnWVc1NUlIQnNZWGxsY2o5Y2JpQWdJQ0FnS2x4dUlDQWdJQ0FxSUVCeVpYUjFjbTRnZTBKdmIyeGxZVzU5SUZSeWRXVWdkMmhsYmlCMGFHbHpJRVJwWlNCcGN5QmlaV2x1WnlCb1pXeGtJR0o1SUdGdWVTQndiR0Y1WlhJc0lHWmhiSE5sSUc5MGFHVnlkMmx6WlM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JwYzBobGJHUW9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c0lDRTlQU0IwYUdsekxtaGxiR1JDZVR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2S2lwY2JpQWdJQ0FnS2lCVWFHVWdjR3hoZVdWeUlISmxiR1ZoYzJWeklIUm9hWE1nUkdsbExpQkJJSEJzWVhsbGNpQmpZVzRnYjI1c2VTQnlaV3hsWVhObElHUnBZMlVnZEdoaGRDQnphR1VnYVhOY2JpQWdJQ0FnS2lCb2IyeGthVzVuTGx4dUlDQWdJQ0FxWEc0Z0lDQWdJQ29nUUhCaGNtRnRJSHR0YjJSMWJHVTZVR3hoZVdWeWZsQnNZWGxsY24wZ2NHeGhlV1Z5SUMwZ1ZHaGxJSEJzWVhsbGNpQjNhRzhnZDJGdWRITWdkRzhnY21Wc1pXRnpaU0IwYUdseklFUnBaUzVjYmlBZ0lDQWdLaUJBWm1seVpYTWdYQ0owYjNBNmNtVnNZWE5sTFdScFpWd2lJSGRwZEdnZ2NHRnlZVzFsZEdWeWN5QjBhR2x6SUVScFpTQmhibVFnZEdobElIQnNZWGxsY2lCeVpXeGxZWE5wYm1jZ2FYUXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ2NtVnNaV0Z6WlVsMEtIQnNZWGxsY2lrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvZEdocGN5NXBjMGhsYkdRb0tTQW1KaUIwYUdsekxtaGxiR1JDZVM1bGNYVmhiSE1vY0d4aGVXVnlLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1b1pXeGtRbmtnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9TRVZNUkY5Q1dWOUJWRlJTU1VKVlZFVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVrYVhOd1lYUmphRVYyWlc1MEtHNWxkeUJEZFhOMGIyMUZkbVZ1ZENoY0luUnZjRHB5Wld4bFlYTmxMV1JwWlZ3aUxDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR1YwWVdsc09pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdScFpUb2dkR2hwY3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR3hoZVdWeVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dVbVZ1WkdWeUlIUm9hWE1nUkdsbExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0RFlXNTJZWE5TWlc1a1pYSnBibWREYjI1MFpYaDBNa1I5SUdOdmJuUmxlSFFnTFNCVWFHVWdZMkZ1ZG1GeklHTnZiblJsZUhRZ2RHOGdaSEpoZDF4dUlDQWdJQ0FxSUc5dVhHNGdJQ0FnSUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUdScFpWTnBlbVVnTFNCVWFHVWdjMmw2WlNCdlppQmhJR1JwWlM1Y2JpQWdJQ0FnS2lCQWNHRnlZVzBnZTA1MWJXSmxjbjBnVzJOdmIzSmthVzVoZEdWeklEMGdkR2hwY3k1amIyOXlaR2x1WVhSbGMxMGdMU0JVYUdVZ1kyOXZjbVJwYm1GMFpYTWdkRzljYmlBZ0lDQWdLaUJrY21GM0lIUm9hWE1nWkdsbExpQkNlU0JrWldaaGRXeDBMQ0IwYUdseklHUnBaU0JwY3lCa2NtRjNiaUJoZENCcGRITWdiM2R1SUdOdmIzSmthVzVoZEdWekxGeHVJQ0FnSUNBcUlHSjFkQ0I1YjNVZ1kyRnVJR0ZzYzI4Z1pISmhkeUJwZENCbGJITmxkMmhsY21VZ2FXWWdjMjhnYm1WbFpHVmtMbHh1SUNBZ0lDQXFMMXh1SUNBZ0lISmxibVJsY2loamIyNTBaWGgwTENCa2FXVlRhWHBsTENCamIyOXlaR2x1WVhSbGN5QTlJSFJvYVhNdVkyOXZjbVJwYm1GMFpYTXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjMk5oYkdVZ1BTQmthV1ZUYVhwbElDOGdRa0ZUUlY5RVNVVmZVMGxhUlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnVTBoQlRFWWdQU0JJUVV4R0lDb2djMk5oYkdVN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUZOVVNFbFNSQ0E5SUZSSVNWSkVJQ29nYzJOaGJHVTdYRzRnSUNBZ0lDQWdJR052Ym5OMElGTlFTVkJmVTBsYVJTQTlJRkJKVUY5VFNWcEZJQ29nYzJOaGJHVTdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdlM2dzSUhsOUlEMGdZMjl2Y21ScGJtRjBaWE03WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJvYVhNdWFYTklaV3hrS0NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGJtUmxja2h2YkdRb1kyOXVkR1Y0ZEN3Z2VDd2dlU3dnVTBoQlRFWXNJSFJvYVhNdWFHVnNaRUo1TG1OdmJHOXlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2d3SUNFOVBTQjBhR2x6TG5KdmRHRjBhVzl1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMblJ5WVc1emJHRjBaU2g0SUNzZ1UwaEJURVlzSUhrZ0t5QlRTRUZNUmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbkp2ZEdGMFpTaGtaV2N5Y21Ga0tIUm9hWE11Y205MFlYUnBiMjRwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVkSEpoYm5Oc1lYUmxLQzB4SUNvZ0tIZ2dLeUJUU0VGTVJpa3NJQzB4SUNvZ0tIa2dLeUJUU0VGTVJpa3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVnVaR1Z5UkdsbEtHTnZiblJsZUhRc0lIZ3NJSGtzSUZOSVFVeEdMQ0IwYUdsekxtTnZiRzl5S1R0Y2JseHVJQ0FnSUNBZ0lDQnpkMmwwWTJnZ0tIUm9hWE11Y0dsd2N5a2dlMXh1SUNBZ0lDQWdJQ0JqWVhObElERTZJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnVTBoQlRFWXNJSGtnS3lCVFNFRk1SaXdnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ01qb2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklESWdLaUJUVkVoSlVrUXNJSGtnS3lBeUlDb2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1kyRnpaU0F6T2lCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTlVTRWxTUkN3Z2VTQXJJRk5VU0VsU1JDd2dVMUJKVUY5VFNWcEZLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxibVJsY2xCcGNDaGpiMjUwWlhoMExDQjRJQ3NnVTBoQlRFWXNJSGtnS3lCVFNFRk1SaXdnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ01pQXFJRk5VU0VsU1JDd2dlU0FySURJZ0tpQlRWRWhKVWtRc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCallYTmxJRFE2SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lBeUlDb2dVMVJJU1ZKRUxDQlRVRWxRWDFOSldrVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUF5SUNvZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ01pQXFJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR05oYzJVZ05Ub2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnVaR1Z5VUdsd0tHTnZiblJsZUhRc0lIZ2dLeUJUVkVoSlVrUXNJSGtnS3lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTlVTRWxTUkN3Z2VTQXJJRElnS2lCVFZFaEpVa1FzSUZOUVNWQmZVMGxhUlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5Wlc1a1pYSlFhWEFvWTI5dWRHVjRkQ3dnZUNBcklGTklRVXhHTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdZMkZ6WlNBMk9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRk5VU0VsU1JDd2dlU0FySUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dNaUFxSUZOVVNFbFNSQ3dnVTFCSlVGOVRTVnBGS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYm1SbGNsQnBjQ2hqYjI1MFpYaDBMQ0I0SUNzZ1UxUklTVkpFTENCNUlDc2dVMGhCVEVZc0lGTlFTVkJmVTBsYVJTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpXNWtaWEpRYVhBb1kyOXVkR1Y0ZEN3Z2VDQXJJRElnS2lCVFZFaEpVa1FzSUhrZ0t5QXlJQ29nVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnVTFSSVNWSkVMQ0JUVUVsUVgxTkpXa1VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ1WkdWeVVHbHdLR052Ym5SbGVIUXNJSGdnS3lBeUlDb2dVMVJJU1ZKRUxDQjVJQ3NnVTBoQlRFWXNJRk5RU1ZCZlUwbGFSU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmtaV1poZFd4ME9pQXZMeUJPYnlCdmRHaGxjaUIyWVd4MVpYTWdZV3hzYjNkbFpDQXZJSEJ2YzNOcFlteGxYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBdkx5QkRiR1ZoY2lCamIyNTBaWGgwWEc0Z0lDQWdJQ0FnSUdOdmJuUmxlSFF1YzJWMFZISmhibk5tYjNKdEtERXNJREFzSURBc0lERXNJREFzSURBcE8xeHVJQ0FnSUgxY2JuMDdYRzVjYm5kcGJtUnZkeTVqZFhOMGIyMUZiR1Z0Wlc1MGN5NWtaV1pwYm1Vb1hDSjBiM0F0WkdsbFhDSXNJRlJ2Y0VScFpVaFVUVXhGYkdWdFpXNTBLVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdJQ0JVYjNCRWFXVklWRTFNUld4bGJXVnVkQ3hjYmlBZ0lDQjFibWxqYjJSbFZHOVFhWEJ6TEZ4dUlDQWdJSEJwY0hOVWIxVnVhV052WkdWY2JuMDdYRzRpTENJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBb1l5a2dNakF4T0NCSWRYVmlJR1JsSUVKbFpYSmNiaUFxWEc0Z0tpQlVhR2x6SUdacGJHVWdhWE1nY0dGeWRDQnZaaUIwZDJWdWRIa3RiMjVsTFhCcGNITXVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1p5WldVZ2MyOW1kSGRoY21VNklIbHZkU0JqWVc0Z2NtVmthWE4wY21saWRYUmxJR2wwSUdGdVpDOXZjaUJ0YjJScFpua2dhWFJjYmlBcUlIVnVaR1Z5SUhSb1pTQjBaWEp0Y3lCdlppQjBhR1VnUjA1VklFeGxjM05sY2lCSFpXNWxjbUZzSUZCMVlteHBZeUJNYVdObGJuTmxJR0Z6SUhCMVlteHBjMmhsWkNCaWVWeHVJQ29nZEdobElFWnlaV1VnVTI5bWRIZGhjbVVnUm05MWJtUmhkR2x2Yml3Z1pXbDBhR1Z5SUhabGNuTnBiMjRnTXlCdlppQjBhR1VnVEdsalpXNXpaU3dnYjNJZ0tHRjBJSGx2ZFhKY2JpQXFJRzl3ZEdsdmJpa2dZVzU1SUd4aGRHVnlJSFpsY25OcGIyNHVYRzRnS2x4dUlDb2dWSGRsYm5SNUxXOXVaUzF3YVhCeklHbHpJR1JwYzNSeWFXSjFkR1ZrSUdsdUlIUm9aU0JvYjNCbElIUm9ZWFFnYVhRZ2QybHNiQ0JpWlNCMWMyVm1kV3dzSUdKMWRGeHVJQ29nVjBsVVNFOVZWQ0JCVGxrZ1YwRlNVa0ZPVkZrN0lIZHBkR2h2ZFhRZ1pYWmxiaUIwYUdVZ2FXMXdiR2xsWkNCM1lYSnlZVzUwZVNCdlppQk5SVkpEU0VGT1ZFRkNTVXhKVkZsY2JpQXFJRzl5SUVaSlZFNUZVMU1nUms5U0lFRWdVRUZTVkVsRFZVeEJVaUJRVlZKUVQxTkZMaUFnVTJWbElIUm9aU0JIVGxVZ1RHVnpjMlZ5SUVkbGJtVnlZV3dnVUhWaWJHbGpYRzRnS2lCTWFXTmxibk5sSUdadmNpQnRiM0psSUdSbGRHRnBiSE11WEc0Z0tseHVJQ29nV1c5MUlITm9iM1ZzWkNCb1lYWmxJSEpsWTJWcGRtVmtJR0VnWTI5d2VTQnZaaUIwYUdVZ1IwNVZJRXhsYzNObGNpQkhaVzVsY21Gc0lGQjFZbXhwWXlCTWFXTmxibk5sWEc0Z0tpQmhiRzl1WnlCM2FYUm9JSFIzWlc1MGVTMXZibVV0Y0dsd2N5NGdJRWxtSUc1dmRDd2djMlZsSUR4b2RIUndPaTh2ZDNkM0xtZHVkUzV2Y21jdmJHbGpaVzV6WlhNdlBpNWNiaUFxSUVCcFoyNXZjbVZjYmlBcUwxeHVhVzF3YjNKMElIdEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVko5SUdaeWIyMGdYQ0l1TDFSdmNGQnNZWGxsY2toVVRVeEZiR1Z0Wlc1MExtcHpYQ0k3WEc1Y2JpOHFLbHh1SUNvZ1ZHOXdVR3hoZVdWeVRHbHpkRWhVVFV4RmJHVnRaVzUwSUhSdklHUmxjMk55YVdKbElIUm9aU0J3YkdGNVpYSnpJR2x1SUhSb1pTQm5ZVzFsTGx4dUlDcGNiaUFxSUVCbGVIUmxibVJ6SUVoVVRVeEZiR1Z0Wlc1MFhHNGdLaTljYm1OdmJuTjBJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRDQTlJR05zWVhOeklHVjRkR1Z1WkhNZ1NGUk5URVZzWlcxbGJuUWdlMXh1WEc0Z0lDQWdMeW9xWEc0Z0lDQWdJQ29nUTNKbFlYUmxJR0VnYm1WM0lGUnZjRkJzWVhsbGNreHBjM1JJVkUxTVJXeGxiV1Z1ZEM1Y2JpQWdJQ0FnS2k5Y2JpQWdJQ0JqYjI1emRISjFZM1J2Y2lncElIdGNiaUFnSUNBZ0lDQWdjM1Z3WlhJb0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCamIyNXVaV04wWldSRFlXeHNZbUZqYXlncElIdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BqMGdkR2hwY3k1d2JHRjVaWEp6TG14bGJtZDBhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1aGNIQmxibVJEYUdsc1pDaEVSVVpCVlV4VVgxTlpVMVJGVFY5UVRFRlpSVklwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdkR2hwY3k1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Z3aWRHOXdPbk4wWVhKMExYUjFjbTVjSWl3Z0tHVjJaVzUwS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlBibXg1SUc5dVpTQndiR0Y1WlhJZ1kyRnVJR2hoZG1VZ1lTQjBkWEp1SUdGMElHRnVlU0JuYVhabGJpQjBhVzFsTGx4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1d2JHRjVaWEp6WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWh3SUQwK0lDRndMbVZ4ZFdGc2N5aGxkbVZ1ZEM1a1pYUmhhV3d1Y0d4aGVXVnlLU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F1Wm05eVJXRmphQ2h3SUQwK0lIQXVaVzVrVkhWeWJpZ3BLVHRjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWkdselkyOXVibVZqZEdWa1EyRnNiR0poWTJzb0tTQjdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0x5b3FYRzRnSUNBZ0lDb2dWR2hsSUhCc1lYbGxjbk1nYVc0Z2RHaHBjeUJzYVhOMExseHVJQ0FnSUNBcVhHNGdJQ0FnSUNvZ1FIUjVjR1VnZTIxdlpIVnNaVHBVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEg1VWIzQlFiR0Y1WlhKSVZFMU1SV3hsYldWdWRGdGRmVnh1SUNBZ0lDQXFMMXh1SUNBZ0lHZGxkQ0J3YkdGNVpYSnpLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnV3k0dUxuUm9hWE11WjJWMFJXeGxiV1Z1ZEhOQ2VWUmhaMDVoYldVb1hDSjBiM0F0Y0d4aGVXVnlYQ0lwWFR0Y2JpQWdJQ0I5WEc1OU8xeHVYRzUzYVc1a2IzY3VZM1Z6ZEc5dFJXeGxiV1Z1ZEhNdVpHVm1hVzVsS0Z3aWRHOXdMWEJzWVhsbGNpMXNhWE4wWENJc0lGUnZjRkJzWVhsbGNreHBjM1JJVkUxTVJXeGxiV1Z1ZENrN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUNBZ1ZHOXdVR3hoZVdWeVRHbHpkRWhVVFV4RmJHVnRaVzUwWEc1OU8xeHVJaXdpTHlvcVhHNGdLaUJEYjNCNWNtbG5hSFFnS0dNcElESXdNVGdnU0hWMVlpQmtaU0JDWldWeVhHNGdLbHh1SUNvZ1ZHaHBjeUJtYVd4bElHbHpJSEJoY25RZ2IyWWdkSGRsYm5SNUxXOXVaUzF3YVhCekxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5Qm1jbVZsSUhOdlpuUjNZWEpsT2lCNWIzVWdZMkZ1SUhKbFpHbHpkSEpwWW5WMFpTQnBkQ0JoYm1RdmIzSWdiVzlrYVdaNUlHbDBYRzRnS2lCMWJtUmxjaUIwYUdVZ2RHVnliWE1nYjJZZ2RHaGxJRWRPVlNCTVpYTnpaWElnUjJWdVpYSmhiQ0JRZFdKc2FXTWdUR2xqWlc1elpTQmhjeUJ3ZFdKc2FYTm9aV1FnWW5sY2JpQXFJSFJvWlNCR2NtVmxJRk52Wm5SM1lYSmxJRVp2ZFc1a1lYUnBiMjRzSUdWcGRHaGxjaUIyWlhKemFXOXVJRE1nYjJZZ2RHaGxJRXhwWTJWdWMyVXNJRzl5SUNoaGRDQjViM1Z5WEc0Z0tpQnZjSFJwYjI0cElHRnVlU0JzWVhSbGNpQjJaWEp6YVc5dUxseHVJQ3BjYmlBcUlGUjNaVzUwZVMxdmJtVXRjR2x3Y3lCcGN5QmthWE4wY21saWRYUmxaQ0JwYmlCMGFHVWdhRzl3WlNCMGFHRjBJR2wwSUhkcGJHd2dZbVVnZFhObFpuVnNMQ0JpZFhSY2JpQXFJRmRKVkVoUFZWUWdRVTVaSUZkQlVsSkJUbFJaT3lCM2FYUm9iM1YwSUdWMlpXNGdkR2hsSUdsdGNHeHBaV1FnZDJGeWNtRnVkSGtnYjJZZ1RVVlNRMGhCVGxSQlFrbE1TVlJaWEc0Z0tpQnZjaUJHU1ZST1JWTlRJRVpQVWlCQklGQkJVbFJKUTFWTVFWSWdVRlZTVUU5VFJTNGdJRk5sWlNCMGFHVWdSMDVWSUV4bGMzTmxjaUJIWlc1bGNtRnNJRkIxWW14cFkxeHVJQ29nVEdsalpXNXpaU0JtYjNJZ2JXOXlaU0JrWlhSaGFXeHpMbHh1SUNwY2JpQXFJRmx2ZFNCemFHOTFiR1FnYUdGMlpTQnlaV05sYVhabFpDQmhJR052Y0hrZ2IyWWdkR2hsSUVkT1ZTQk1aWE56WlhJZ1IyVnVaWEpoYkNCUWRXSnNhV01nVEdsalpXNXpaVnh1SUNvZ1lXeHZibWNnZDJsMGFDQjBkMlZ1ZEhrdGIyNWxMWEJwY0hNdUlDQkpaaUJ1YjNRc0lITmxaU0E4YUhSMGNEb3ZMM2QzZHk1bmJuVXViM0puTDJ4cFkyVnVjMlZ6THo0dVhHNGdLaTljYm1sdGNHOXlkQ0I3Vkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUjlJR1p5YjIwZ1hDSXVMMVJ2Y0VScFkyVkNiMkZ5WkVoVVRVeEZiR1Z0Wlc1MExtcHpYQ0k3WEc1cGJYQnZjblFnZTFSdmNFUnBaVWhVVFV4RmJHVnRaVzUwZlNCbWNtOXRJRndpTGk5VWIzQkVhV1ZJVkUxTVJXeGxiV1Z1ZEM1cWMxd2lPMXh1YVcxd2IzSjBJSHRVYjNCUWJHRjVaWEpJVkUxTVJXeGxiV1Z1ZEgwZ1puSnZiU0JjSWk0dlZHOXdVR3hoZVdWeVNGUk5URVZzWlcxbGJuUXVhbk5jSWp0Y2JtbHRjRzl5ZENCN1ZHOXdVR3hoZVdWeVRHbHpkRWhVVFV4RmJHVnRaVzUwZlNCbWNtOXRJRndpTGk5VWIzQlFiR0Y1WlhKTWFYTjBTRlJOVEVWc1pXMWxiblF1YW5OY0lqdGNibHh1ZDJsdVpHOTNMblIzWlc1MGVXOXVaWEJwY0hNZ1BTQjNhVzVrYjNjdWRIZGxiblI1YjI1bGNHbHdjeUI4ZkNCUFltcGxZM1F1Wm5KbFpYcGxLSHRjYmlBZ0lDQldSVkpUU1U5T09pQmNJakF1TUM0eFhDSXNYRzRnSUNBZ1RFbERSVTVUUlRvZ1hDSk1SMUJNTFRNdU1Gd2lMRnh1SUNBZ0lGZEZRbE5KVkVVNklGd2lhSFIwY0hNNkx5OTBkMlZ1ZEhsdmJtVndhWEJ6TG05eVoxd2lMRnh1SUNBZ0lFaFVUVXhGYkdWdFpXNTBjem9nZTF4dUlDQWdJQ0FnSUNCVWIzQkVhV05sUW05aGNtUklWRTFNUld4bGJXVnVkRG9nVkc5d1JHbGpaVUp2WVhKa1NGUk5URVZzWlcxbGJuUXNYRzRnSUNBZ0lDQWdJRlJ2Y0VScFpVaFVUVXhGYkdWdFpXNTBPaUJVYjNCRWFXVklWRTFNUld4bGJXVnVkQ3hjYmlBZ0lDQWdJQ0FnVkc5d1VHeGhlV1Z5U0ZSTlRFVnNaVzFsYm5RNklGUnZjRkJzWVhsbGNraFVUVXhGYkdWdFpXNTBMRnh1SUNBZ0lDQWdJQ0JVYjNCUWJHRjVaWEpNYVhOMFNGUk5URVZzWlcxbGJuUTZJRlJ2Y0ZCc1lYbGxja3hwYzNSSVZFMU1SV3hsYldWdWRGeHVJQ0FnSUgxY2JuMHBPMXh1SWwwc0ltNWhiV1Z6SWpwYklrTlBURTlTWDBGVVZGSkpRbFZVUlNJc0lsOWpiMnh2Y2lJc0luWmhiR2xrWVhSbElsMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFUczdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdRVUUyUWtFc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4alFVRmpMRXRCUVVzc1EwRkJRenM3T3pzN096czdTVUZSTTBNc1YwRkJWeXhEUVVGRExFOUJRVThzUlVGQlJUdFJRVU5xUWl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03UzBGRGJFSTdRMEZEU2pzN1FVTjRRMFE3T3pzN096czdPenM3T3pzN096czdPenM3UVVGdFFrRXNRVUZGUVRzN096dEJRVWxCTEUxQlFVMHNjMEpCUVhOQ0xFZEJRVWNzUjBGQlJ5eERRVUZET3p0QlFVVnVReXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3p0SlFVTXpRaXhQUVVGUExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0RFFVTnlSU3hEUVVGRE96czdRVUZIUml4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1QwRkJUeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZET1VJc1RVRkJUU3hMUVVGTExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpWQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFJRVUZSTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNdlFpeE5RVUZOTEZkQlFWY3NSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRMnhETEUxQlFVMHNUMEZCVHl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03T3pzN096czdPenM3T3pzN096czdRVUZuUWpsQ0xFMUJRVTBzVlVGQlZTeEhRVUZITEUxQlFVMDdPenM3T3pzN1NVRlBja0lzVjBGQlZ5eERRVUZETzFGQlExSXNTMEZCU3p0UlFVTk1MRTFCUVUwN1VVRkRUaXhWUVVGVk8xRkJRMVlzVDBGQlR6dExRVU5XTEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUTBvc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRjRUlzVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRFSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja0lzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03TzFGQlJYaENMRWxCUVVrc1EwRkJReXhWUVVGVkxFZEJRVWNzVlVGQlZTeERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzVDBGQlR5eERRVUZETzFGQlEzWkNMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEyNUNMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzB0QlEzaENPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTMEZETTBJN08wbEJSVVFzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZPMUZCUTFRc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlExQXNUVUZCVFN4SlFVRkpMR3RDUVVGclFpeERRVUZETEVOQlFVTXNOa05CUVRaRExFVkJRVVVzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMFk3VVVGRFJDeE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8wdEJRMmhFT3pzN096czdPenRKUVZGRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6VkNPenRKUVVWRUxFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlR0UlFVTldMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5RTEUxQlFVMHNTVUZCU1N4clFrRkJhMElzUTBGQlF5eERRVUZETERoRFFVRTRReXhGUVVGRkxFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoSE8xRkJRMFFzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNrSXNTVUZCU1N4RFFVRkRMR05CUVdNc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRMUVVOb1JEczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxHMUNRVUZ0UWl4SFFVRkhPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8wdEJRMnhET3pzN096czdPenM3TzBsQlZVUXNTVUZCU1N4VlFVRlZMRWRCUVVjN1VVRkRZaXhQUVVGUExGZEJRVmNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRhRU03TzBsQlJVUXNTVUZCU1N4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTFBc1RVRkJUU3hKUVVGSkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNc2EwUkJRV3RFTEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGNFYzdVVUZEUkN4UFFVRlBMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTI1RE96czdPenM3T3p0SlFWRkVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVDBGQlR5eFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRemRDT3p0SlFVVkVMRWxCUVVrc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdFJRVU5hTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1JVRkJSVHRaUVVOVUxFMUJRVTBzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhEUVVGRExDdERRVUVyUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEyeEhPMUZCUTBRc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRka0lzU1VGQlNTeERRVUZETEdOQlFXTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTm9SRHM3U1VGRlJDeEpRVUZKTEUxQlFVMHNSMEZCUnp0UlFVTlVMRTFCUVUwc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkROVUlzVDBGQlR5eFRRVUZUTEV0QlFVc3NRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU03UzBGRGNrTTdPMGxCUlVRc1NVRkJTU3hOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlExWXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZUVJN096czdPenM3TzBsQlVVUXNTVUZCU1N4TFFVRkxMRWRCUVVjN1VVRkRVaXhQUVVGUExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRNVUk3T3pzN096czdPMGxCVVVRc1NVRkJTU3hMUVVGTExFZEJRVWM3VVVGRFVpeFBRVUZQTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE1VSTdPenM3T3pzN08wbEJVVVFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4TlFVRk5MRWRCUVVjc1IwRkJSeXhsUVVGbExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGFFUXNUVUZCVFN4SFFVRkhMRWRCUVVjc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE96dFJRVVZvUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEzSkNPenM3T3pzN096czdPenM3U1VGWlJDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUlVGQlJUdFpRVU40UXl4TlFVRk5MRWxCUVVrc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXl4NVEwRkJlVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU14U1RzN1VVRkZSQ3hOUVVGTkxHbENRVUZwUWl4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVNM1FpeE5RVUZOTEZsQlFWa3NSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSWGhDTEV0QlFVc3NUVUZCVFN4SFFVRkhMRWxCUVVrc1NVRkJTU3hGUVVGRk8xbEJRM0JDTEVsQlFVa3NSMEZCUnl4RFFVRkRMR05CUVdNc1JVRkJSU3hKUVVGSkxFZEJRVWNzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlRzN096dG5Ra0ZKZEVNc2FVSkJRV2xDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJReTlDTEUxQlFVMDdaMEpCUTBnc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0aFFVTXhRanRUUVVOS096dFJRVVZFTEUxQlFVMHNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hGUVVGRkxFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhEUVVGRE8xRkJRemxGTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWxCUVVrc1EwRkJReXh6UWtGQmMwSXNRMEZCUXl4SFFVRkhMRVZCUVVVc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXpzN1VVRkZNMFVzUzBGQlN5eE5RVUZOTEVkQlFVY3NTVUZCU1N4WlFVRlpMRVZCUVVVN1dVRkROVUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRM1JGTEUxQlFVMHNWVUZCVlN4SFFVRkhMR05CUVdNc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dFpRVU12UXl4alFVRmpMRU5CUVVNc1RVRkJUU3hEUVVGRExGZEJRVmNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXpzN1dVRkZkRU1zUjBGQlJ5eERRVUZETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1dVRkRlRVFzUjBGQlJ5eERRVUZETEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExITkNRVUZ6UWl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xbEJRM1pHTEdsQ1FVRnBRaXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTXZRanM3VVVGRlJDeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hwUWtGQmFVSXNRMEZCUXl4RFFVRkRPenRSUVVWdVF5eFBRVUZQTEdsQ1FVRnBRaXhEUVVGRE8wdEJRelZDT3pzN096czdPenM3T3p0SlFWZEVMSE5DUVVGelFpeERRVUZETEVkQlFVY3NSVUZCUlN4cFFrRkJhVUlzUlVGQlJUdFJRVU16UXl4TlFVRk5MRk5CUVZNc1IwRkJSeXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlF6VkNMRWxCUVVrc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5rTEUxQlFVMHNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03TzFGQlJXeEVMRTlCUVU4c1UwRkJVeXhEUVVGRExFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NTMEZCU3l4SFFVRkhMRkZCUVZFc1JVRkJSVHRaUVVNM1F5eExRVUZMTEUxQlFVMHNTVUZCU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVTdaMEpCUXpGRExFbEJRVWtzVTBGQlV5eExRVUZMTEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUlVGQlJTeHBRa0ZCYVVJc1EwRkJReXhGUVVGRk8yOUNRVU5zUlN4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJsQ1FVTjJRanRoUVVOS096dFpRVVZFTEV0QlFVc3NSVUZCUlN4RFFVRkRPMU5CUTFnN08xRkJSVVFzVDBGQlR5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8wdEJRMmhET3pzN096czdPenM3T3pzN1NVRlpSQ3hoUVVGaExFTkJRVU1zUzBGQlN5eEZRVUZGTzFGQlEycENMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEZUVJc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXpzN1VVRkZOVUlzU1VGQlNTeERRVUZETEV0QlFVc3NTMEZCU3l4RlFVRkZPMWxCUTJJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGVrTXNUVUZCVFR0WlFVTklMRXRCUVVzc1NVRkJTU3hIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRVZCUVVVc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRk8yZENRVU5xUlN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU01UkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMnBGT3p0WlFVVkVMRXRCUVVzc1NVRkJTU3hIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRXRCUVVzc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGQlJUdG5Ra0ZEY0VVc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZET1VRc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5xUlR0VFFVTktPenRSUVVWRUxFOUJRVThzUzBGQlN5eERRVUZETzB0QlEyaENPenM3T3pzN096czdPenRKUVZkRUxGbEJRVmtzUTBGQlF5eEpRVUZKTEVWQlFVVXNhVUpCUVdsQ0xFVkJRVVU3VVVGRGJFTXNUMEZCVHl4VFFVRlRMRXRCUVVzc2FVSkJRV2xDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hKUVVGSkxFdEJRVXNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExFZEJRVWNzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpOSE96czdPenM3T3pzN1NVRlRSQ3hoUVVGaExFTkJRVU1zUTBGQlF5eEZRVUZGTzFGQlEySXNUMEZCVHl4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UzBGRGFrVTdPenM3T3pzN096czdTVUZWUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdVVUZEZEVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVU3V1VGRE9VUXNUMEZCVHl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEhRVUZITEVOQlFVTTdVMEZEYWtNN1VVRkRSQ3hQUVVGUExGTkJRVk1zUTBGQlF6dExRVU53UWpzN096czdPenM3T3pzN1NVRlhSQ3h2UWtGQmIwSXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRjRUlzVDBGQlR5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTndSRHM3T3pzN096czdPenM3U1VGWFJDeHZRa0ZCYjBJc1EwRkJReXhOUVVGTkxFVkJRVVU3VVVGRGVrSXNUVUZCVFN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrUXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVU3V1VGRGVFTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkRXanRSUVVORUxFOUJRVThzVTBGQlV5eERRVUZETzB0QlEzQkNPenM3T3pzN096czdPenM3T3p0SlFXTkVMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRM1pDTEUxQlFVMHNWVUZCVlN4SFFVRkhPMWxCUTJZc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGFrTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1UwRkRjRU1zUTBGQlF6czdVVUZGUml4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUXpsRExFMUJRVTBzVDBGQlR5eEhRVUZITEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZETlVNc1RVRkJUU3hSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4UFFVRlBMRU5CUVVNN1VVRkRlRU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTTNReXhOUVVGTkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRkZCUVZFc1EwRkJRenM3VVVGRk1VTXNUVUZCVFN4VFFVRlRMRWRCUVVjc1EwRkJRenRaUVVObUxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRlZCUVZVc1EwRkJRenRaUVVOcVF5eFJRVUZSTEVWQlFVVXNUMEZCVHl4SFFVRkhMRkZCUVZFN1UwRkRMMElzUlVGQlJUdFpRVU5ETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8yZENRVU5zUWl4SFFVRkhMRVZCUVVVc1ZVRkJWU3hEUVVGRExFZEJRVWM3WjBKQlEyNUNMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdZVUZETVVJc1EwRkJRenRaUVVOR0xGRkJRVkVzUlVGQlJTeFJRVUZSTEVkQlFVY3NVVUZCVVR0VFFVTm9ReXhGUVVGRk8xbEJRME1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNN1owSkJRMnhDTEVkQlFVY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03WjBKQlEzWkNMRWRCUVVjc1JVRkJSU3hWUVVGVkxFTkJRVU1zUjBGQlJ6dGhRVU4wUWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxFOUJRVThzUjBGQlJ5eFRRVUZUTzFOQlEyaERMRVZCUVVVN1dVRkRReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGRrSXNSMEZCUnl4RlFVRkZMRlZCUVZVc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dGhRVU14UWl4RFFVRkRPMWxCUTBZc1VVRkJVU3hGUVVGRkxGRkJRVkVzUjBGQlJ5eFRRVUZUTzFOQlEycERMRU5CUVVNc1EwRkJRenM3VVVGRlNDeE5RVUZOTEUxQlFVMHNSMEZCUnl4VFFVRlRPenRoUVVWdVFpeE5RVUZOTEVOQlFVTXNRMEZCUXl4UlFVRlJMRXRCUVVzc1UwRkJVeXhMUVVGTExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdPMkZCUlRsRExFMUJRVTBzUTBGQlF5eERRVUZETEZGQlFWRXNTMEZCU3p0blFrRkRiRUlzU1VGQlNTeExRVUZMTEVkQlFVY3NTVUZCU1N4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJReXhMUVVGTExGRkJRVkVzUTBGQlF5eERRVUZETzIxQ1FVTjBSU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPenRoUVVWeVJDeE5RVUZOTzJkQ1FVTklMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUzBGQlN5eFJRVUZSTEVOQlFVTXNVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzVVVGQlVTeEhRVUZITEVsQlFVazdaMEpCUTNaRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEZOQlFWTXNSVUZCUlN4UlFVRlJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGREwwSXNRMEZCUXpzN1VVRkZUaXhQUVVGUExGTkJRVk1zUzBGQlN5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzB0QlF6bEZPenM3T3pzN096czdTVUZUUkN4TFFVRkxMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVU3VVVGRGVFSXNTMEZCU3l4TlFVRk5MRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMWxCUXk5Q0xFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExGZEJRVmNzUTBGQlF6czdXVUZGTDBJc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRaUVVONlJDeE5RVUZOTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZET3p0WlFVVjZSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeEpRVUZKTEVWQlFVVTdaMEpCUTJRc1QwRkJUeXhIUVVGSExFTkJRVU03WVVGRFpEdFRRVU5LT3p0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3T3pzN096czdPenM3U1VGVlJDeGpRVUZqTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSVHRSUVVNeFFpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTjBSRHM3T3pzN096czdPMGxCVTBRc1lVRkJZU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZPMUZCUTNSQ0xFOUJRVThzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03UzBGRGVrUTdPenM3T3pzN096dEpRVk5FTEdGQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJUdFJRVU5zUWl4UFFVRlBPMWxCUTBnc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU03V1VGRGFrTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNN1UwRkRjRU1zUTBGQlF6dExRVU5NTzBOQlEwbzdPMEZEY0daRU96czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZCSzBKQkxFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1EwRkJReXhKUVVGSkxFdEJRVXM3U1VGRGFrTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRGVrTXNUMEZCVHl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNWMEZCVnl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wTkJRekZHTEVOQlFVTTdPenM3T3pzN08wRkJVVVlzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhEUVVGRExFZEJRVWM3T3pzN096czdPenM3T3pzN1NVRmhNMElzWTBGQll5eEhRVUZITEVOQlFVTTdPenM3T3pzN096czdPenM3T3pzN1VVRm5RbVFzZDBKQlFYZENMRU5CUVVNc1NVRkJTU3hGUVVGRkxGRkJRVkVzUlVGQlJTeFJRVUZSTEVWQlFVVTdPenM3V1VGSkwwTXNUVUZCVFN4UlFVRlJMRWRCUVVjc2EwSkJRV3RDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRNVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRkZCUVZFc1MwRkJTeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSVHRuUWtGRGNFUXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRNME03VTBGRFNqdExRVU5LT3p0QlEyaEdURHM3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFYTkNRU3hCUVVkQk8wRkJRMEVzVFVGQlRTeGxRVUZsTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTJoRExFMUJRVTBzWTBGQll5eEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eFBRVUZQTEVOQlFVTTdRVUZEYUVNc1RVRkJUU3hyUWtGQmEwSXNSMEZCUnl4VlFVRlZMRU5CUVVNN096dEJRVWQwUXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzBGQlF6ZENMRTFCUVUwc1MwRkJTeXhIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETlVJc1RVRkJUU3hOUVVGTkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTNRaXhOUVVGTkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenM3T3pzN096czdPenM3T3pzN096czdPenRCUVc5Q0wwSXNUVUZCVFN4dlFrRkJiMElzUjBGQlJ5eGpRVUZqTEd0Q1FVRnJRaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZET3pzN096czdPenM3T3pzN08wbEJZWFpGTEZkQlFWY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RlFVRkZPMUZCUTNaRExFdEJRVXNzUlVGQlJTeERRVUZET3p0UlFVVlNMRWxCUVVrc1MwRkJTeXhKUVVGSkxFVkJRVVVzUzBGQlN5eExRVUZMTEVWQlFVVTdXVUZEZGtJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRlRUlzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4bFFVRmxMRVZCUVVVc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFOQlEyeEVMRTFCUVUwc1NVRkJTU3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdWQlFXVXNRMEZCUXl4RlFVRkZPMWxCUTNoR0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjRSQ3hOUVVGTk8xbEJRMGdzVFVGQlRTeEpRVUZKTEd0Q1FVRnJRaXhEUVVGRExEUkRRVUUwUXl4RFFVRkRMRU5CUVVNN1UwRkRPVVU3TzFGQlJVUXNTVUZCU1N4SlFVRkpMRWxCUVVrc1JVRkJSU3hMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU55UWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdOQlFXTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VTBGRGFFUXNUVUZCVFN4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWTBGQll5eERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWTBGQll5eERRVUZETEVWQlFVVTdXVUZEZEVZc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzUkVMRTFCUVUwN1dVRkRTQ3hOUVVGTkxFbEJRVWtzYTBKQlFXdENMRU5CUVVNc01rTkJRVEpETEVOQlFVTXNRMEZCUXp0VFFVTTNSVHM3VVVGRlJDeEpRVUZKTEV0QlFVc3NSVUZCUlR0WlFVTlFMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUTNoQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNaVUZCWlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU5zUkN4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eGxRVUZsTEVOQlFVTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVTdXVUZETjBjc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWlVGQlpTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOMFJTeE5RVUZOT3p0WlFVVklMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMU5CUXpGQ096dFJRVVZFTEVsQlFVa3NTVUZCU1N4TFFVRkxMRTlCUVU4c1JVRkJSVHRaUVVOc1FpeFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hQUVVGUExFTkJRVU1zUTBGQlF6dFpRVU0xUWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHdENRVUZyUWl4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRE8xTkJRMnhFTEUxQlFVMHNTVUZCU1N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRVZCUVVVN1dVRkRPVU1zVVVGQlVTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03VTBGRE5VSXNUVUZCVFRzN1dVRkZTQ3hSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVNMVFqdExRVU5LT3p0SlFVVkVMRmRCUVZjc2EwSkJRV3RDTEVkQlFVYzdVVUZETlVJc1QwRkJUenRaUVVOSUxHVkJRV1U3V1VGRFppeGpRVUZqTzFsQlEyUXNaVUZCWlR0WlFVTm1MR3RDUVVGclFqdFRRVU55UWl4RFFVRkRPMHRCUTB3N08wbEJSVVFzYVVKQlFXbENMRWRCUVVjN1MwRkRia0k3TzBsQlJVUXNiMEpCUVc5Q0xFZEJRVWM3UzBGRGRFSTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ6dFJRVU5TTEU5QlFVOHNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWpzN096czdPenRKUVU5RUxFbEJRVWtzU1VGQlNTeEhRVUZITzFGQlExQXNUMEZCVHl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6RkNPenM3T3pzN08wbEJUMFFzU1VGQlNTeExRVUZMTEVkQlFVYzdVVUZEVWl4UFFVRlBMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpORU8wbEJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNVVUZCVVN4RlFVRkZPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRek5DTEVsQlFVa3NTVUZCU1N4TFFVRkxMRkZCUVZFc1JVRkJSVHRaUVVOdVFpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8xTkJRM3BETEUxQlFVMDdXVUZEU0N4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExHVkJRV1VzUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTm9SRHRMUVVOS096czdPenRKUVV0RUxGTkJRVk1zUjBGQlJ6dFJRVU5TTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRaUVVOc1FpeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSVHRuUWtGRE5VUXNUVUZCVFN4RlFVRkZPMjlDUVVOS0xFMUJRVTBzUlVGQlJTeEpRVUZKTzJsQ1FVTm1PMkZCUTBvc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFVEdFJRVU5FTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEzcENMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zYTBKQlFXdENMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGREwwTTdPenM3TzBsQlMwUXNUMEZCVHl4SFFVRkhPMUZCUTA0c1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRla0lzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETzB0QlF6VkRPenM3T3pzN08wbEJUMFFzU1VGQlNTeFBRVUZQTEVkQlFVYzdVVUZEVml4UFFVRlBMRWxCUVVrc1MwRkJTeXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTNSRE96czdPenM3TzBsQlQwUXNVVUZCVVN4SFFVRkhPMUZCUTFBc1QwRkJUeXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRla0k3T3pzN096czdPenRKUVZORUxFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVml4TlFVRk5MRWxCUVVrc1IwRkJSeXhSUVVGUkxFdEJRVXNzVDBGQlR5eExRVUZMTEVkQlFVY3NTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU03VVVGRE5VUXNUMEZCVHl4TFFVRkxMRXRCUVVzc1NVRkJTU3hKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMHRCUXk5RE8wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFMUJRVTBzUTBGQlF5eFpRVUZaTEVWQlFVVXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlF6czdPenM3T3pzN08wRkJVMnBGTEUxQlFVMHNjVUpCUVhGQ0xFZEJRVWNzU1VGQlNTeHZRa0ZCYjBJc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE96dEJReTlPYWtZN096czdPenM3T3pzN096czdPenM3T3pzN08wRkJiMEpCTEVGQlIwRTdPenM3UVVGSlFTeE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExFZEJRVWNzUTBGQlF6dEJRVU0zUWl4TlFVRk5MSEZDUVVGeFFpeEhRVUZITEVkQlFVY3NRMEZCUXp0QlFVTnNReXhOUVVGTkxEaENRVUU0UWl4SFFVRkhMRXRCUVVzc1EwRkJRenRCUVVNM1F5eE5RVUZOTERaQ1FVRTJRaXhIUVVGSExFdEJRVXNzUTBGQlF6dEJRVU0xUXl4TlFVRk5MRGhDUVVFNFFpeEhRVUZITEV0QlFVc3NRMEZCUXpzN1FVRkZOME1zVFVGQlRTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMEZCUTJoQ0xFMUJRVTBzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXpzN1FVRkZhRUlzVFVGQlRTeGhRVUZoTEVkQlFVY3NTVUZCU1N4SFFVRkhMR2RDUVVGblFpeERRVUZETzBGQlF6bERMRTFCUVUwc1kwRkJZeXhIUVVGSExFbEJRVWtzUjBGQlJ5eG5Ra0ZCWjBJc1EwRkJRenRCUVVNdlF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE96dEJRVVZvUkN4TlFVRk5MRk5CUVZNc1IwRkJSeXhEUVVGRExFTkJRVU03TzBGQlJYQkNMRTFCUVUwc1pVRkJaU3hIUVVGSExFOUJRVThzUTBGQlF6dEJRVU5vUXl4TlFVRk5MR2RDUVVGblFpeEhRVUZITEZGQlFWRXNRMEZCUXp0QlFVTnNReXhOUVVGTkxHOUNRVUZ2UWl4SFFVRkhMRmxCUVZrc1EwRkJRenRCUVVNeFF5eE5RVUZOTEd0Q1FVRnJRaXhIUVVGSExGVkJRVlVzUTBGQlF6dEJRVU4wUXl4TlFVRk5MR2REUVVGblF5eEhRVUZITEhkQ1FVRjNRaXhEUVVGRE8wRkJRMnhGTEUxQlFVMHNLMEpCUVN0Q0xFZEJRVWNzZFVKQlFYVkNMRU5CUVVNN1FVRkRhRVVzVFVGQlRTeG5RMEZCWjBNc1IwRkJSeXgzUWtGQmQwSXNRMEZCUXp0QlFVTnNSU3hOUVVGTkxIVkNRVUYxUWl4SFFVRkhMR1ZCUVdVc1EwRkJRenM3TzBGQlIyaEVMRTFCUVUwc1YwRkJWeXhIUVVGSExFTkJRVU1zV1VGQldTeEZRVUZGTEdGQlFXRXNSMEZCUnl4RFFVRkRMRXRCUVVzN1NVRkRja1FzVFVGQlRTeE5RVUZOTEVkQlFVY3NVVUZCVVN4RFFVRkRMRmxCUVZrc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU14UXl4UFFVRlBMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NZVUZCWVN4SFFVRkhMRTFCUVUwc1EwRkJRenREUVVONFJDeERRVUZET3p0QlFVVkdMRTFCUVUwc2MwSkJRWE5DTEVkQlFVY3NRMEZCUXl4TlFVRk5MRVZCUVVVc1UwRkJVeXhIUVVGSExGRkJRVkVzUzBGQlN6dEpRVU0zUkN4UFFVRlBMRU5CUVVNc1NVRkJTU3hOUVVGTkxFbEJRVWtzVFVGQlRTeEhRVUZITEZOQlFWTXNRMEZCUXp0RFFVTTFReXhEUVVGRE96dEJRVVZHTEUxQlFVMHNhVUpCUVdsQ0xFZEJRVWNzUTBGQlF5eFpRVUZaTEVWQlFVVXNXVUZCV1N4TFFVRkxPMGxCUTNSRUxFMUJRVTBzUzBGQlN5eEhRVUZITEZkQlFWY3NRMEZCUXl4WlFVRlpMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03U1VGRGRFUXNUMEZCVHl4elFrRkJjMElzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRE8wTkJReTlFTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3d3UWtGQk1FSXNSMEZCUnl4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVVVzV1VGQldTeExRVUZMTzBsQlEyaEZMRWxCUVVrc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0UlFVTTFRaXhOUVVGTkxGZEJRVmNzUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJReTlETEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRPMHRCUTNaRU8wbEJRMFFzVDBGQlR5eFpRVUZaTEVOQlFVTTdRMEZEZGtJc1EwRkJRenM3UVVGRlJpeE5RVUZOTEZWQlFWVXNSMEZCUnl4RFFVRkRMR0ZCUVdFc1JVRkJSU3hUUVVGVExFVkJRVVVzV1VGQldTeExRVUZMTzBsQlF6TkVMRWxCUVVrc1UwRkJVeXhMUVVGTExHRkJRV0VzU1VGQlNTeE5RVUZOTEV0QlFVc3NZVUZCWVN4RlFVRkZPMUZCUTNwRUxFOUJRVThzU1VGQlNTeERRVUZETzB0QlEyWXNUVUZCVFN4SlFVRkpMRTlCUVU4c1MwRkJTeXhoUVVGaExFVkJRVVU3VVVGRGJFTXNUMEZCVHl4TFFVRkxMRU5CUVVNN1MwRkRhRUlzVFVGQlRUdFJRVU5JTEU5QlFVOHNXVUZCV1N4RFFVRkRPMHRCUTNaQ08wTkJRMG9zUTBGQlF6czdRVUZGUml4TlFVRk5MRzFDUVVGdFFpeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1JVRkJSU3haUVVGWkxFdEJRVXM3U1VGRGVrUXNTVUZCU1N4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzFGQlF6VkNMRTFCUVUwc1YwRkJWeXhIUVVGSExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eFZRVUZWTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1YwRkJWeXhGUVVGRkxFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1dVRkJXU3hEUVVGRExFTkJRVU03UzBGRGJFWTdPMGxCUlVRc1QwRkJUeXhaUVVGWkxFTkJRVU03UTBGRGRrSXNRMEZCUXpzN08wRkJSMFlzVFVGQlRTeFBRVUZQTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVNNVFpeE5RVUZOTEU5QlFVOHNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRemxDTEUxQlFVMHNZMEZCWXl4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRGNrTXNUVUZCVFN4clFrRkJhMElzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenRCUVVWNlF5eE5RVUZOTEU5QlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTeXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6czdRVUZGTDBRc1RVRkJUU3haUVVGWkxFZEJRVWNzUTBGQlF5eExRVUZMTEV0QlFVczdTVUZETlVJc1NVRkJTU3hUUVVGVExFdEJRVXNzYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzFGQlF6ZERMR3RDUVVGclFpeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGNFTTdPMGxCUlVRc1QwRkJUeXhyUWtGQmEwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03UTBGRGVFTXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxHVkJRV1VzUjBGQlJ5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRXRCUVVzN1NVRkRka01zYTBKQlFXdENMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU03UTBGREwwUXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxFOUJRVThzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3l4WlFVRlpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN08wRkJSWEpGTEUxQlFVMHNWMEZCVnl4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4TFFVRkxPMGxCUXpsRExFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMUZCUTJoQ0xFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6czdVVUZGTVVRc1MwRkJTeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVWQlFVVTdXVUZEY0VJc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFOQlF6ZERPMHRCUTBvN1EwRkRTaXhEUVVGRE96czdPMEZCU1VZc1RVRkJUU3hKUVVGSkxFZEJRVWNzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03UVVGRGRFTXNUVUZCVFN4SlFVRkpMRWRCUVVjc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzBGQlF6VkNMRTFCUVUwc1NVRkJTU3hIUVVGSExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0QlFVTTFRaXhOUVVGTkxGbEJRVmtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNN1FVRkROVU1zVFVGQlRTeFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE96czdRVUZIY0VNc1RVRkJUU3huUTBGQlowTXNSMEZCUnl4RFFVRkRMRTFCUVUwc1JVRkJSU3hQUVVGUExFVkJRVVVzVDBGQlR5eExRVUZMTzBsQlEyNUZMRTFCUVUwc1UwRkJVeXhIUVVGSExFMUJRVTBzUTBGQlF5eHhRa0ZCY1VJc1JVRkJSU3hEUVVGRE96dEpRVVZxUkN4TlFVRk5MRU5CUVVNc1IwRkJSeXhQUVVGUExFZEJRVWNzVTBGQlV5eERRVUZETEVsQlFVa3NTVUZCU1N4TlFVRk5MRU5CUVVNc1MwRkJTeXhIUVVGSExGTkJRVk1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTjBSU3hOUVVGTkxFTkJRVU1zUjBGQlJ5eFBRVUZQTEVkQlFVY3NVMEZCVXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEZOQlFWTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenM3U1VGRmRrVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dERRVU5xUWl4RFFVRkRPenRCUVVWR0xFMUJRVTBzWjBKQlFXZENMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3U1VGRGFFTXNUVUZCVFN4TlFVRk5MRWRCUVVjc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXpzN08wbEJSMnhETEVsQlFVa3NUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVOb1FpeEpRVUZKTEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN1NVRkRha0lzU1VGQlNTeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRPMGxCUTNaQ0xFbEJRVWtzWTBGQll5eEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTXhRaXhKUVVGSkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdPMGxCUlhaQ0xFMUJRVTBzVDBGQlR5eEhRVUZITEUxQlFVMDdVVUZEYkVJc1NVRkJTU3hKUVVGSkxFdEJRVXNzUzBGQlN5eEpRVUZKTEZsQlFWa3NTMEZCU3l4TFFVRkxMRVZCUVVVN08xbEJSVEZETEUxQlFVMHNaVUZCWlN4SFFVRkhMRXRCUVVzc1EwRkJReXhoUVVGaExFTkJRVU1zYzBOQlFYTkRMRU5CUVVNc1EwRkJRenRaUVVOd1JpeEpRVUZKTEdOQlFXTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJSVHRuUWtGRGVrSXNZMEZCWXl4RFFVRkRMRk5CUVZNc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF6dGhRVU0zUXl4TlFVRk5PMmRDUVVOSUxHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1lVRkRNVU03V1VGRFJDeExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRPenRaUVVWaUxGZEJRVmNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTjBRanM3VVVGRlJDeFhRVUZYTEVkQlFVY3NTVUZCU1N4RFFVRkRPMHRCUTNSQ0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4WlFVRlpMRWRCUVVjc1RVRkJUVHRSUVVOMlFpeFhRVUZYTEVkQlFVY3NUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhQUVVGUExFVkJRVVVzUzBGQlN5eERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRPMHRCUTJoRkxFTkJRVU03TzBsQlJVWXNUVUZCVFN4WFFVRlhMRWRCUVVjc1RVRkJUVHRSUVVOMFFpeE5RVUZOTEVOQlFVTXNXVUZCV1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8xRkJRMnBETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRkRUlzUTBGQlF6czdTVUZGUml4TlFVRk5MR2RDUVVGblFpeEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxPMUZCUTJoRExFbEJRVWtzU1VGQlNTeExRVUZMTEV0QlFVc3NSVUZCUlRzN1dVRkZhRUlzVFVGQlRTeEhRVUZITzJkQ1FVTk1MRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR6dG5Ra0ZEYUVJc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTzJGQlEyNUNMRU5CUVVNN08xbEJSVVlzWTBGQll5eEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExHZERRVUZuUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hMUVVGTExFTkJRVU1zVDBGQlR5eEZRVUZGTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRE96dFpRVVUxUnl4SlFVRkpMRWxCUVVrc1MwRkJTeXhqUVVGakxFVkJRVVU3TzJkQ1FVVjZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEcxQ1FVRnRRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEc5Q1FVRnZRaXhGUVVGRk8yOUNRVU16UkN4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRE8yOUNRVU55UWl4WlFVRlpMRVZCUVVVc1EwRkJRenRwUWtGRGJFSXNUVUZCVFN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExHMUNRVUZ0UWl4RlFVRkZPMjlDUVVOdVF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRPMjlDUVVOaUxGbEJRVmtzUlVGQlJTeERRVUZETzJsQ1FVTnNRaXhOUVVGTkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNiMEpCUVc5Q0xFVkJRVVU3YjBKQlEzQkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03YVVKQlEyaENPMkZCUTBvN08xTkJSVW83UzBGRFNpeERRVUZET3p0SlFVVkdMRTFCUVUwc1pVRkJaU3hIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTzFGQlF5OUNMRTFCUVUwc1kwRkJZeXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMR2REUVVGblF5eERRVUZETEUxQlFVMHNSVUZCUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhGUVVGRkxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4SUxFbEJRVWtzVVVGQlVTeExRVUZMTEV0QlFVc3NSVUZCUlR0WlFVTndRaXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4VlFVRlZMRU5CUVVNN1UwRkRjRU1zVFVGQlRTeEpRVUZKTEVsQlFVa3NTMEZCU3l4alFVRmpMRVZCUVVVN1dVRkRhRU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xTkJRMmhETEUxQlFVMDdXVUZEU0N4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eFRRVUZUTEVOQlFVTTdVMEZEYmtNN1MwRkRTaXhEUVVGRE96dEpRVVZHTEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1MwRkJTeXhMUVVGTE8xRkJRM0JDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRXRCUVVzc1NVRkJTU3haUVVGWkxFdEJRVXNzUzBGQlN5eEZRVUZGT3pzN1dVRkhNVU1zVFVGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRaUVVNNVF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE96dFpRVVU1UXl4SlFVRkpMRk5CUVZNc1IwRkJSeXhGUVVGRkxFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNSVUZCUlR0blFrRkRiRU1zUzBGQlN5eEhRVUZITEZGQlFWRXNRMEZCUXp0blFrRkRha0lzVjBGQlZ5eEZRVUZGTEVOQlFVTTdPMmRDUVVWa0xFMUJRVTBzZVVKQlFYbENMRWRCUVVjc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1MwRkJTeXhqUVVGakxFTkJRVU1zUTBGQlF6dG5Ra0ZEYmtZc1YwRkJWeXhEUVVGRExFdEJRVXNzUlVGQlJTeDVRa0ZCZVVJc1EwRkJReXhEUVVGRE8yZENRVU01UXl4WFFVRlhMRWRCUVVjc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8yRkJRMmhHTzFOQlEwb3NUVUZCVFN4SlFVRkpMRkZCUVZFc1MwRkJTeXhMUVVGTExFVkJRVVU3V1VGRE0wSXNUVUZCVFN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUTNCRExFMUJRVTBzUlVGQlJTeEhRVUZITEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF6czdXVUZGY0VNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4alFVRmpMRU5CUVVNc1YwRkJWeXhEUVVGRE96dFpRVVV4UXl4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zV1VGQldTeERRVUZETEZkQlFWY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03V1VGREwwTXNZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTm9SanRMUVVOS0xFTkJRVU03TzBsQlJVWXNUVUZCVFN4bFFVRmxMRWRCUVVjc1EwRkJReXhMUVVGTExFdEJRVXM3VVVGREwwSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1kwRkJZeXhKUVVGSkxGRkJRVkVzUzBGQlN5eExRVUZMTEVWQlFVVTdXVUZETDBNc1RVRkJUU3hGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRE8xbEJRM0JETEUxQlFVMHNSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXpzN1dVRkZjRU1zVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhqUVVGakxFTkJRVU1zVjBGQlZ5eERRVUZET3p0WlFVVXhReXhOUVVGTkxGbEJRVmtzUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRuUWtGRGNrTXNSMEZCUnl4RlFVRkZMR05CUVdNN1owSkJRMjVDTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSVHRuUWtGRFZDeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVN1lVRkRXaXhEUVVGRExFTkJRVU03TzFsQlJVZ3NUVUZCVFN4VFFVRlRMRWRCUVVjc1NVRkJTU3hKUVVGSkxGbEJRVmtzUjBGQlJ5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03TzFsQlJTOUVMR05CUVdNc1EwRkJReXhYUVVGWExFZEJRVWNzVTBGQlV5eERRVUZETzFOQlF6RkRPenM3VVVGSFJDeGpRVUZqTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTNSQ0xFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdPenRSUVVkaUxGZEJRVmNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0TFFVTjBRaXhEUVVGRE96czdPenM3T3p0SlFWRkdMRWxCUVVrc1owSkJRV2RDTEVkQlFVY3NRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFOUJRVThzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTm9SQ3hOUVVGTkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1kwRkJZeXhMUVVGTE8xRkJRM3BETEU5QlFVOHNRMEZCUXl4VlFVRlZMRXRCUVVzN1dVRkRia0lzU1VGQlNTeFZRVUZWTEVsQlFVa3NRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeEZRVUZGTzJkQ1FVTTNReXhOUVVGTkxFTkJRVU1zVDBGQlR5eEZRVUZGTEU5QlFVOHNRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJwRUxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1QwRkJUeXhGUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzJGQlEzcERPMWxCUTBRc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEZWQlFWVXNRMEZCUXl4alFVRmpMRVZCUVVVc1owSkJRV2RDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpGRkxFTkJRVU03UzBGRFRDeERRVUZET3p0SlFVVkdMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WlFVRlpMRVZCUVVVc1owSkJRV2RDTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOeVJTeE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03TzBsQlJYWkVMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zYjBKQlFXOUNMRVZCUVVVN1VVRkROMElzVFVGQlRTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExGZEJRVmNzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkZMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4WFFVRlhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UzBGRE9VTTdPMGxCUlVRc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHZRa0ZCYjBJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSVHRSUVVNelJDeE5RVUZOTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVjBGQlZ5eEZRVUZGTEdWQlFXVXNRMEZCUXl4RFFVRkRPMHRCUTNwRU96dEpRVVZFTEUxQlFVMHNRMEZCUXl4blFrRkJaMElzUTBGQlF5eFZRVUZWTEVWQlFVVXNaMEpCUVdkQ0xFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnFSU3hOUVVGTkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1UwRkJVeXhGUVVGRkxHVkJRV1VzUTBGQlF5eERRVUZETzBsQlEzQkVMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4VlFVRlZMRVZCUVVVc1pVRkJaU3hEUVVGRExFTkJRVU03UTBGRGVFUXNRMEZCUXpzN096czdPenM3UVVGUlJpeE5RVUZOTEhWQ1FVRjFRaXhIUVVGSExHTkJRV01zVjBGQlZ5eERRVUZET3pzN096dEpRVXQwUkN4WFFVRlhMRWRCUVVjN1VVRkRWaXhMUVVGTExFVkJRVVVzUTBGQlF6dFJRVU5TTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhIUVVGSExHTkJRV01zUTBGQlF6dFJRVU53UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJrUXNUVUZCVFN4TlFVRk5MRWRCUVVjc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPenRSUVVVelFpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU14UWl4alFVRmpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeHhRa0ZCY1VJc1EwRkJReXhEUVVGRE8xRkJRMmhFTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzVlVGQlZTeERRVUZETzFsQlF6ZENMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN6dFpRVU5xUWl4TlFVRk5MRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTA3V1VGRGJrSXNUMEZCVHl4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUE8xbEJRM0pDTEZWQlFWVXNSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWVHRUUVVNNVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTktMR2RDUVVGblFpeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpGQ096dEpRVVZFTEZkQlFWY3NhMEpCUVd0Q0xFZEJRVWM3VVVGRE5VSXNUMEZCVHp0WlFVTklMR1ZCUVdVN1dVRkRaaXhuUWtGQlowSTdXVUZEYUVJc2IwSkJRVzlDTzFsQlEzQkNMR3RDUVVGclFqdFpRVU5zUWl4blEwRkJaME03V1VGRGFFTXNaME5CUVdkRE8xbEJRMmhETEN0Q1FVRXJRanRaUVVNdlFpeDFRa0ZCZFVJN1UwRkRNVUlzUTBGQlF6dExRVU5NT3p0SlFVVkVMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4UlFVRlJMRVZCUVVVc1VVRkJVU3hGUVVGRk8xRkJReTlETEUxQlFVMHNUVUZCVFN4SFFVRkhMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYWtNc1VVRkJVU3hKUVVGSk8xRkJRMW9zUzBGQlN5eGxRVUZsTEVWQlFVVTdXVUZEYkVJc1RVRkJUU3hMUVVGTExFZEJRVWNzYVVKQlFXbENMRU5CUVVNc1VVRkJVU3hGUVVGRkxGZEJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJRenRaUVVOc1JpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03V1VGRE1VSXNUVUZCVFN4RFFVRkRMRmxCUVZrc1EwRkJReXhsUVVGbExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETlVNc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5Ra0ZCWjBJc1JVRkJSVHRaUVVOdVFpeE5RVUZOTEUxQlFVMHNSMEZCUnl4cFFrRkJhVUlzUTBGQlF5eFJRVUZSTEVWQlFVVXNWMEZCVnl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxHTkJRV01zUTBGQlF5eERRVUZETzFsQlEzQkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0WlFVTTFRaXhOUVVGTkxFTkJRVU1zV1VGQldTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6bERMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzYjBKQlFXOUNMRVZCUVVVN1dVRkRka0lzVFVGQlRTeFZRVUZWTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVU1zVVVGQlVTeEZRVUZGTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMWxCUXpWR0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4SFFVRkhMRlZCUVZVc1EwRkJRenRaUVVOd1F5eE5RVUZOTzFOQlExUTdVVUZEUkN4TFFVRkxMR3RDUVVGclFpeEZRVUZGTzFsQlEzSkNMRTFCUVUwc1QwRkJUeXhIUVVGSExHbENRVUZwUWl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUTBGQlF6dFpRVU4yUml4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUjBGQlJ5eFBRVUZQTEVOQlFVTTdXVUZET1VJc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eG5RMEZCWjBNc1JVRkJSVHRaUVVOdVF5eE5RVUZOTEdkQ1FVRm5RaXhIUVVGSExGVkJRVlVzUTBGQlF5eFJRVUZSTEVWQlFVVXNaME5CUVdkRExFVkJRVVVzVlVGQlZTeERRVUZETEZGQlFWRXNSVUZCUlN4blEwRkJaME1zUlVGQlJTdzRRa0ZCT0VJc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFc3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJRenRaUVVOMlF5eE5RVUZOTzFOQlExUTdVVUZEUkN4VFFVRlRMRUZCUlZJN1UwRkRRVHM3VVVGRlJDeFhRVUZYTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRja0k3TzBsQlJVUXNhVUpCUVdsQ0xFZEJRVWM3VVVGRGFFSXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEdWQlFXVXNSVUZCUlN4TlFVRk5PMWxCUTNwRExHVkJRV1VzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzU1VGQlNTeFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1owSkJRMllzVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOd1JEdFRRVU5LTEVOQlFVTXNRMEZCUXpzN1VVRkZTQ3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNUVUZCVFR0WlFVTXpReXhYUVVGWExFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJwRUxHVkJRV1VzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNM1FpeERRVUZETEVOQlFVTTdPenM3VVVGSlNDeEpRVUZKTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExHbENRVUZwUWl4RFFVRkRMRVZCUVVVN1dVRkRhRVFzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1lVRkJZU3hEUVVGRExHbENRVUZwUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNdlJEdExRVU5LT3p0SlFVVkVMRzlDUVVGdlFpeEhRVUZITzB0QlEzUkNPenRKUVVWRUxHVkJRV1VzUjBGQlJ6dExRVU5xUWpzN096czdPenRKUVU5RUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6VkNPenM3T3pzN096dEpRVkZFTEVsQlFVa3NTVUZCU1N4SFFVRkhPMUZCUTFBc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEY0VRN096czdPenM3U1VGUFJDeEpRVUZKTEcxQ1FVRnRRaXhIUVVGSE8xRkJRM1JDTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXh0UWtGQmJVSXNRMEZCUXp0TFFVTXhRenM3T3pzN096dEpRVTlFTEVsQlFVa3NTMEZCU3l4SFFVRkhPMUZCUTFJc1QwRkJUeXd3UWtGQk1FSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1pVRkJaU3hGUVVGRkxHRkJRV0VzUTBGQlF5eERRVUZETzB0QlF6TkZPenM3T3pzN1NVRk5SQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEdkQ1FVRm5RaXhGUVVGRkxHTkJRV01zUTBGQlF5eERRVUZETzB0QlF6ZEZPenM3T3pzN1NVRk5SQ3hKUVVGSkxGVkJRVlVzUjBGQlJ6dFJRVU5pTEU5QlFVOHNNRUpCUVRCQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEc5Q1FVRnZRaXhGUVVGRkxHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1MwRkRja1k3T3pzN096czdTVUZQUkN4SlFVRkpMRTlCUVU4c1IwRkJSenRSUVVOV0xFOUJRVThzTUVKQlFUQkNMRU5CUVVNc1NVRkJTU3hGUVVGRkxHdENRVUZyUWl4RlFVRkZMR2RDUVVGblFpeERRVUZETEVOQlFVTTdTMEZEYWtZN096czdPenRKUVUxRUxFbEJRVWtzYjBKQlFXOUNMRWRCUVVjN1VVRkRka0lzVDBGQlR5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFVkJRVVVzWjBOQlFXZERMRVZCUVVVc09FSkJRVGhDTEVOQlFVTXNRMEZCUXp0TFFVTjBSenM3T3pzN08wbEJUVVFzU1VGQlNTeHRRa0ZCYlVJc1IwRkJSenRSUVVOMFFpeFBRVUZQTEcxQ1FVRnRRaXhEUVVGRExFbEJRVWtzUlVGQlJTd3JRa0ZCSzBJc1JVRkJSU3cyUWtGQk5rSXNRMEZCUXl4RFFVRkRPMHRCUTNCSE96czdPenM3U1VGTlJDeEpRVUZKTEc5Q1FVRnZRaXhIUVVGSE8xRkJRM1pDTEU5QlFVOHNiVUpCUVcxQ0xFTkJRVU1zU1VGQlNTeEZRVUZGTEdkRFFVRm5ReXhGUVVGRkxEaENRVUU0UWl4RFFVRkRMRU5CUVVNN1MwRkRkRWM3T3pzN096czdPenRKUVZORUxFbEJRVWtzV1VGQldTeEhRVUZITzFGQlEyWXNUMEZCVHl3d1FrRkJNRUlzUTBGQlF5eEpRVUZKTEVWQlFVVXNkVUpCUVhWQ0xFVkJRVVVzY1VKQlFYRkNMRU5CUVVNc1EwRkJRenRMUVVNelJqczdPenM3T3p0SlFVOUVMRWxCUVVrc1QwRkJUeXhIUVVGSE8xRkJRMVlzVDBGQlR5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRPMHRCUTNoRU96czdPenM3T3pzN08wbEJWVVFzVTBGQlV5eERRVUZETEUxQlFVMHNSMEZCUnl4eFFrRkJjVUlzUlVGQlJUdFJRVU4wUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVTdXVUZETTBJc1RVRkJUU3hEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzFOQlEzUkNPMUZCUTBRc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEzaERMRmRCUVZjc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzB0QlEzQkNPME5CUTBvc1EwRkJRenM3UVVGRlJpeE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhuUWtGQlowSXNSVUZCUlN4MVFrRkJkVUlzUTBGQlF5eERRVUZET3p0QlEzQm9RbmhGT3pzN096czdPenM3T3pzN096czdPenM3T3p0QlFXOUNRU3hOUVVGTkxHVkJRV1VzUjBGQlJ5eGpRVUZqTEV0QlFVc3NRMEZCUXp0SlFVTjRReXhYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1ZVRkJWU3hIUVVGSExHTkJRV01zWlVGQlpTeERRVUZETzBsQlF6ZERMRmRCUVZjc1EwRkJReXhIUVVGSExFVkJRVVU3VVVGRFlpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRaRHREUVVOS0xFTkJRVU03TzBGQlJVWXNUVUZCVFN4blFrRkJaMElzUjBGQlJ5eGpRVUZqTEdWQlFXVXNRMEZCUXp0SlFVTnVSQ3hYUVVGWExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEySXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMlE3UTBGRFNpeERRVUZET3p0QlFVVkdMRTFCUVUwc1RVRkJUU3hIUVVGSExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZETjBJc1RVRkJUU3hoUVVGaExFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTndReXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPenRCUVVVNVFpeE5RVUZOTEdGQlFXRXNSMEZCUnl4TlFVRk5PMGxCUTNoQ0xGZEJRVmNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4WlFVRlpMRVZCUVVVc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlF6VkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNoQ0xHRkJRV0VzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRmxCUVZrc1EwRkJReXhEUVVGRE8xRkJRM1JETEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzB0QlF6ZENPenRKUVVWRUxFbEJRVWtzVFVGQlRTeEhRVUZITzFGQlExUXNUMEZCVHl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6TkNPenRKUVVWRUxFbEJRVWtzUzBGQlN5eEhRVUZITzFGQlExSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NZVUZCWVN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU12UkRzN1NVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU0xUWpzN1NVRkZSQ3hKUVVGSkxFOUJRVThzUjBGQlJ6dFJRVU5XTEU5QlFVOHNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzB0QlEyeERPenRKUVVWRUxGTkJRVk1zUTBGQlF5eFZRVUZWTEVWQlFVVTdVVUZEYkVJc1lVRkJZU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkRjRU1zVDBGQlR5eEpRVUZKTEVOQlFVTTdTMEZEWmpzN1NVRkZSQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eFRRVUZUTEVWQlFVVXNZVUZCWVN4SFFVRkhMRVZCUVVVc1JVRkJSU3hUUVVGVExFZEJRVWNzWlVGQlpTeERRVUZETEVWQlFVVTdVVUZEYWtVc1RVRkJUU3hYUVVGWExFZEJRVWNzVTBGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRVZCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU03VVVGRGVrUXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSVHRaUVVOa0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzWVVGQllTeERRVUZETEVOQlFVTTdPMWxCUlhaRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRek5DT3p0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wdEJRMlk3UTBGRFNpeERRVUZET3pzN1FVRkhSaXhOUVVGTkxIRkNRVUZ4UWl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVOb1F5eE5RVUZOTEc5Q1FVRnZRaXhIUVVGSExHTkJRV01zWVVGQllTeERRVUZETzBsQlEzSkVMRmRCUVZjc1EwRkJReXhMUVVGTExFVkJRVVU3VVVGRFppeEpRVUZKTEV0QlFVc3NSMEZCUnl4eFFrRkJjVUlzUTBGQlF6dFJRVU5zUXl4TlFVRk5MRmxCUVZrc1IwRkJSeXh4UWtGQmNVSXNRMEZCUXp0UlFVTXpReXhOUVVGTkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMUZCUld4Q0xFbEJRVWtzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVONlFpeExRVUZMTEVkQlFVY3NTMEZCU3l4RFFVRkRPMU5CUTJwQ0xFMUJRVTBzU1VGQlNTeFJRVUZSTEV0QlFVc3NUMEZCVHl4TFFVRkxMRVZCUVVVN1dVRkRiRU1zVFVGQlRTeFhRVUZYTEVkQlFVY3NVVUZCVVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU40UXl4SlFVRkpMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zVjBGQlZ5eERRVUZETEVWQlFVVTdaMEpCUXk5Q0xFdEJRVXNzUjBGQlJ5eFhRVUZYTEVOQlFVTTdZVUZEZGtJc1RVRkJUVHRuUWtGRFNDeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1ZVRkJWU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEZEVNN1UwRkRTaXhOUVVGTk8xbEJRMGdzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2RDUVVGblFpeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROVU03TzFGQlJVUXNTMEZCU3l4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNoRE96dEpRVVZFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRWaXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEWml4VFFVRlRMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEUxQlFVMHNTVUZCU1N4RFFVRkRPMWxCUTJ4RExHRkJRV0VzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnlRaXhEUVVGRExFTkJRVU03UzBGRFRqczdTVUZGUkN4WFFVRlhMRU5CUVVNc1EwRkJReXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTJZc1UwRkJVeXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJRenRaUVVOc1F5eGhRVUZoTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRja0lzUTBGQlF5eERRVUZETzB0QlEwNDdPMGxCUlVRc1QwRkJUeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVTdVVUZEVml4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRFppeFRRVUZUTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZET1VRc1lVRkJZU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0VFFVTjRRaXhEUVVGRExFTkJRVU03UzBGRFRqdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3h2UWtGQmIwSXNSMEZCUnl4RlFVRkZMRU5CUVVNN1FVRkRhRU1zVFVGQlRTeHRRa0ZCYlVJc1IwRkJSeXhqUVVGakxHRkJRV0VzUTBGQlF6dEpRVU53UkN4WFFVRlhMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMllzU1VGQlNTeExRVUZMTEVkQlFVY3NiMEpCUVc5Q0xFTkJRVU03VVVGRGFrTXNUVUZCVFN4WlFVRlpMRWRCUVVjc2IwSkJRVzlDTEVOQlFVTTdVVUZETVVNc1RVRkJUU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZET3p0UlFVVnNRaXhKUVVGSkxGRkJRVkVzUzBGQlN5eFBRVUZQTEV0QlFVc3NSVUZCUlR0WlFVTXpRaXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFOQlEycENMRTFCUVUwN1dVRkRTQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NaMEpCUVdkQ0xFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTFRenM3VVVGRlJDeExRVUZMTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1dVRkJXU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEZUVNN08wbEJSVVFzVVVGQlVTeEhRVUZITzFGQlExQXNUMEZCVHl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRMllzVTBGQlV5eEZRVUZGTEUxQlFVMHNSVUZCUlN4TFFVRkxMRWxCUVVrc1EwRkJReXhOUVVGTk8xTkJRM1JETEVOQlFVTXNRMEZCUXp0TFFVTk9PME5CUTBvc1EwRkJRenM3UVVGRlJpeE5RVUZOTEcxQ1FVRnRRaXhIUVVGSExFOUJRVThzUTBGQlF6dEJRVU53UXl4TlFVRk5MR3RDUVVGclFpeEhRVUZITEdOQlFXTXNZVUZCWVN4RFFVRkRPMGxCUTI1RUxGZEJRVmNzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEWml4SlFVRkpMRXRCUVVzc1IwRkJSeXh0UWtGQmJVSXNRMEZCUXp0UlFVTm9ReXhOUVVGTkxGbEJRVmtzUjBGQlJ5eHRRa0ZCYlVJc1EwRkJRenRSUVVONlF5eE5RVUZOTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN08xRkJSV3hDTEVsQlFVa3NVVUZCVVN4TFFVRkxMRTlCUVU4c1MwRkJTeXhGUVVGRk8xbEJRek5DTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1UwRkRha0lzVFVGQlRUdFpRVU5JTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3huUWtGQlowSXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRelZET3p0UlFVVkVMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeFpRVUZaTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVONFF6dERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hUUVVGVExFZEJRVWNzVFVGQlRUdEpRVU53UWl4UFFVRlBMRU5CUVVNc1MwRkJTeXhGUVVGRk8xRkJRMWdzVDBGQlR5eEpRVUZKTEc5Q1FVRnZRaXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzB0QlF6RkRPenRKUVVWRUxFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVTdVVUZEVml4UFFVRlBMRWxCUVVrc2JVSkJRVzFDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1MwRkRla003TzBsQlJVUXNTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSVHRSUVVOVUxFOUJRVThzU1VGQlNTeHJRa0ZCYTBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dExRVU40UXp0RFFVTktMRU5CUVVNN08wRkJSVVlzVFVGQlRTeHJRa0ZCYTBJc1IwRkJSeXhKUVVGSkxGTkJRVk1zUlVGQlJUczdRVU4wVERGRE96czdPenM3T3pzN096czdPenM3T3pzN096czdRVUZ4UWtFc1FVRkhRVHM3TzBGQlIwRXNUVUZCVFN4alFVRmpMRWRCUVVjc1IwRkJSeXhEUVVGRE8wRkJRek5DTEUxQlFVMHNZMEZCWXl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVONlFpeE5RVUZOTEdGQlFXRXNSMEZCUnl4UFFVRlBMRU5CUVVNN1FVRkRPVUlzVFVGQlRTeFRRVUZUTEVkQlFVY3NRMEZCUXl4RFFVRkRPMEZCUTNCQ0xFMUJRVTBzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTndRaXhOUVVGTkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVNelFpeE5RVUZOTEdWQlFXVXNSMEZCUnl4SFFVRkhMRU5CUVVNN08wRkJSVFZDTEUxQlFVMUJMR2xDUVVGbExFZEJRVWNzVDBGQlR5eERRVUZETzBGQlEyaERMRTFCUVUwc2FVSkJRV2xDTEVkQlFVY3NVMEZCVXl4RFFVRkRPMEZCUTNCRExFMUJRVTBzWTBGQll5eEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVTTVRaXhOUVVGTkxHdENRVUZyUWl4SFFVRkhMRlZCUVZVc1EwRkJRenRCUVVOMFF5eE5RVUZOTEZkQlFWY3NSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRlRUlzVFVGQlRTeFhRVUZYTEVkQlFVY3NSMEZCUnl4RFFVRkRPenRCUVVWNFFpeE5RVUZOTEdGQlFXRXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkRNVUlzVFVGQlRTd3dRa0ZCTUVJc1IwRkJSeXhGUVVGRkxFTkJRVU03UVVGRGRFTXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eEhRVUZITEVOQlFVTTdRVUZET1VJc1RVRkJUU3huUWtGQlowSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRNMElzVFVGQlRTeEpRVUZKTEVkQlFVY3NZVUZCWVN4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVNdlFpeE5RVUZOTEV0QlFVc3NSMEZCUnl4aFFVRmhMRWRCUVVjc1EwRkJReXhEUVVGRE8wRkJRMmhETEUxQlFVMHNVVUZCVVN4SFFVRkhMR0ZCUVdFc1IwRkJSeXhGUVVGRkxFTkJRVU03UVVGRGNFTXNUVUZCVFN4VFFVRlRMRWRCUVVjc1QwRkJUeXhEUVVGRE96dEJRVVV4UWl4TlFVRk5MRTlCUVU4c1IwRkJSeXhEUVVGRExFZEJRVWNzUzBGQlN6dEpRVU55UWl4UFFVRlBMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPME5CUTJoRExFTkJRVU03TzBGQlJVWXNUVUZCVFN4WFFVRlhMRWRCUVVjc1EwRkJReXhKUVVGSk8wbEJRM0pDTEUxQlFVMHNUVUZCVFN4SFFVRkhMRkZCUVZFc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdTVUZETDBJc1QwRkJUeXhOUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hOUVVGTkxFbEJRVWtzVFVGQlRTeEpRVUZKTEdOQlFXTXNRMEZCUXp0RFFVTTVSU3hEUVVGRE96czdPenM3TzBGQlQwWXNUVUZCVFN4VlFVRlZMRWRCUVVjc1RVRkJUU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhqUVVGakxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdPMEZCUlhoRkxFMUJRVTBzYzBKQlFYTkNMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZET3p0QlFVVjZSQ3hCUVdGQk96czdPenM3T3pzN1FVRlRRU3hOUVVGTkxHRkJRV0VzUjBGQlJ5eERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExITkNRVUZ6UWl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTTdPMEZCUlhSR0xFMUJRVTBzVlVGQlZTeEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEV0QlFVc3NTMEZCU3p0SlFVTm9SQ3hOUVVGTkxGTkJRVk1zUjBGQlJ5eExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTm1MRTlCUVU4c1EwRkJReXhYUVVGWExFZEJRVWNzWlVGQlpTeERRVUZETzBsQlEzUkRMRTlCUVU4c1EwRkJReXhUUVVGVExFVkJRVVVzUTBGQlF6dEpRVU53UWl4UFFVRlBMRU5CUVVNc1UwRkJVeXhIUVVGSExFdEJRVXNzUTBGQlF6dEpRVU14UWl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1JVRkJSU3hMUVVGTExFZEJRVWNzVTBGQlV5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTTFSU3hQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdTVUZEWml4UFFVRlBMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03UTBGRGNrSXNRMEZCUXpzN1FVRkZSaXhOUVVGTkxGTkJRVk1zUjBGQlJ5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeExRVUZMTEV0QlFVczdTVUZETDBNc1RVRkJUU3hMUVVGTExFbEJRVWtzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRPMGxCUXpkQ0xFMUJRVTBzWlVGQlpTeEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnNSQ3hOUVVGTkxGVkJRVlVzUjBGQlJ5eERRVUZETEVkQlFVY3NaVUZCWlN4RFFVRkRPMGxCUTNaRExFMUJRVTBzY1VKQlFYRkNMRWRCUVVjc01FSkJRVEJDTEVkQlFVY3NTMEZCU3l4RFFVRkRPMGxCUTJwRkxFMUJRVTBzYTBKQlFXdENMRWRCUVVjc1ZVRkJWU3hIUVVGSExFTkJRVU1zUjBGQlJ5eHhRa0ZCY1VJc1EwRkJRenRKUVVOc1JTeE5RVUZOTEZsQlFWa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExHZENRVUZuUWl4RlFVRkZMR2xDUVVGcFFpeEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRPenRKUVVVelJTeE5RVUZOTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWRCUVVjc1MwRkJTeXhIUVVGSExHVkJRV1VzUjBGQlJ5eHhRa0ZCY1VJc1EwRkJRenRKUVVOdVJTeE5RVUZOTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWRCUVVjc1MwRkJTeXhIUVVGSExHVkJRV1VzUTBGQlF6czdTVUZGTTBNc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8wbEJRM0JDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8wbEJRekZDTEU5QlFVOHNRMEZCUXl4WFFVRlhMRWRCUVVjc1QwRkJUeXhEUVVGRE8wbEJRemxDTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWRCUVVjc1dVRkJXU3hEUVVGRE8wbEJRMnBETEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBsQlF5OUNMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEhRVUZITEd0Q1FVRnJRaXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBsQlEzQkVMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVFVGQlRTeEhRVUZITEd0Q1FVRnJRaXhGUVVGRkxFMUJRVTBzUjBGQlJ5eHhRa0ZCY1VJc1JVRkJSU3h4UWtGQmNVSXNSVUZCUlN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRNVWdzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVkQlFVY3NjVUpCUVhGQ0xFVkJRVVVzVFVGQlRTeEhRVUZITEd0Q1FVRnJRaXhIUVVGSExIRkNRVUZ4UWl4RFFVRkRMRU5CUVVNN1NVRkRla2dzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc2EwSkJRV3RDTEVWQlFVVXNUVUZCVFN4SFFVRkhMR3RDUVVGclFpeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxIRkNRVUZ4UWl4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeFBRVUZQTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNNVNTeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzVlVGQlZTeERRVUZETEVOQlFVTTdTVUZETlVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVWQlFVVXNUVUZCVFN4SFFVRkhMR3RDUVVGclFpeEhRVUZITEhGQ1FVRnhRaXhGUVVGRkxIRkNRVUZ4UWl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNelNDeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1IwRkJSeXh4UWtGQmNVSXNSVUZCUlN4TlFVRk5MRWRCUVVjc2NVSkJRWEZDTEVOQlFVTXNRMEZCUXp0SlFVTXZSU3hQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRWRCUVVjc2NVSkJRWEZDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZET3p0SlFVVjJSeXhQUVVGUExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTTdTVUZEYWtJc1QwRkJUeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEyWXNUMEZCVHl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wTkJRM0pDTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hUUVVGVExFZEJRVWNzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hMUVVGTExFdEJRVXM3U1VGRGVFTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8wbEJRMllzVDBGQlR5eERRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMGxCUTNCQ0xFOUJRVThzUTBGQlF5eFRRVUZUTEVkQlFVY3NVMEZCVXl4RFFVRkRPMGxCUXpsQ0xFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRM0pDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMGxCUTJoRUxFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTm1MRTlCUVU4c1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dERRVU55UWl4RFFVRkRPenM3TzBGQlNVWXNUVUZCVFN4TlFVRk5MRWRCUVVjc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dEJRVU0zUWl4TlFVRk5ReXhSUVVGTkxFZEJRVWNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0QlFVTTNRaXhOUVVGTkxFOUJRVThzUjBGQlJ5eEpRVUZKTEU5QlFVOHNSVUZCUlN4RFFVRkRPMEZCUXpsQ0xFMUJRVTBzUzBGQlN5eEhRVUZITEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkROVUlzVFVGQlRTeFRRVUZUTEVkQlFVY3NTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVOb1F5eE5RVUZOTEVWQlFVVXNSMEZCUnl4SlFVRkpMRTlCUVU4c1JVRkJSU3hEUVVGRE8wRkJRM3BDTEUxQlFVMHNSVUZCUlN4SFFVRkhMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03T3pzN096czdPenM3UVVGVmVrSXNUVUZCVFN4cFFrRkJhVUlzUjBGQlJ5eGpRVUZqTEd0Q1FVRnJRaXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZET3pzN096dEpRVXR3UlN4WFFVRlhMRWRCUVVjN1VVRkRWaXhMUVVGTExFVkJRVVVzUTBGQlF6czdVVUZGVWl4TlFVRk5MRWxCUVVrc1IwRkJSME1zYTBKQlFWRTdZVUZEYUVJc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNN1lVRkRNVU1zVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVlVGQlZTeEZRVUZGTEVOQlFVTTdZVUZEZGtJc1MwRkJTeXhEUVVGRE96dFJRVVZZTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEzUkNMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zWTBGQll5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPenRSUVVWNFF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhRU3hyUWtGQlVTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRFJpeHBRa0ZCWlN4RFFVRkRMRU5CUVVNN1lVRkRNVVFzVTBGQlV5eERRVUZETEdGQlFXRXNRMEZCUXp0aFFVTjRRaXhMUVVGTExFTkJRVU03TzFGQlJWZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSMFVzYTBKQlFWRXNRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRE8yRkJRMnhGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRE8yRkJRMllzVTBGQlV5eERRVUZETEdkQ1FVRm5RaXhEUVVGRE8yRkJRek5DTEV0QlFVc3NRMEZCUXpzN1VVRkZXQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZIUVN4clFrRkJVU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8yRkJRM0JFTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRZaXhUUVVGVExFTkJRVU1zVTBGQlV5eERRVUZETzJGQlEzQkNMRXRCUVVzc1EwRkJRenM3VVVGRldDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhRU3hyUWtGQlVTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETzJGQlEzQkVMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRFlpeFRRVUZUTEVOQlFVTXNVMEZCVXl4RFFVRkRPMkZCUTNCQ0xFdEJRVXNzUTBGQlF6czdVVUZGV0N4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSFFTeHJRa0ZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU03WVVGRE9VUXNVVUZCVVN4RlFVRkZPMkZCUTFZc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF6dGhRVU5tTEV0QlFVc3NRMEZCUXp0TFFVTmtPenRKUVVWRUxGZEJRVmNzYTBKQlFXdENMRWRCUVVjN1VVRkROVUlzVDBGQlR6dFpRVU5JUml4cFFrRkJaVHRaUVVObUxHbENRVUZwUWp0WlFVTnFRaXhqUVVGak8xbEJRMlFzYTBKQlFXdENPMWxCUTJ4Q0xGZEJRVmM3V1VGRFdDeFhRVUZYTzFOQlEyUXNRMEZCUXp0TFFVTk1PenRKUVVWRUxHbENRVUZwUWl4SFFVRkhPMUZCUTJoQ0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFJRVU5zUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6bEVPenRKUVVWRUxHOUNRVUZ2UWl4SFFVRkhPMUZCUTI1Q0xFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEdsQ1FVRnBRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUkN4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0TFFVTXhRanM3T3pzN096czdTVUZSUkN4VFFVRlRMRWRCUVVjN1VVRkRVaXhQUVVGUExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRia003T3pzN096czdPMGxCVVVRc1VVRkJVU3hIUVVGSE8xRkJRMUFzVDBGQlR5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNN1MwRkRNMEk3T3pzN096czdTVUZQUkN4SlFVRkpMRWxCUVVrc1IwRkJSenRSUVVOUUxFOUJRVThzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRMUVVNeFFqczdPenM3T3p0SlFVOUVMRWxCUVVrc1MwRkJTeXhIUVVGSE8xRkJRMUlzVDBGQlQwTXNVVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU16UWp0SlFVTkVMRWxCUVVrc1MwRkJTeXhEUVVGRExGRkJRVkVzUlVGQlJUdFJRVU5vUWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhSUVVGUkxFVkJRVVU3V1VGRGJrSXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJRMFFzYVVKQlFXVXNRMEZCUXl4RFFVRkRPMWxCUTNSRFF5eFJRVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF6dFRRVU51UXl4TlFVRk5PMWxCUTBoQkxGRkJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xbEJRek5DTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVORUxHbENRVUZsTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1UwRkRhRVE3UzBGRFNqczdPenM3T3pzN1NVRlJSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dFJRVU5VTEU5QlFVOHNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU0xUWp0SlFVTkVMRWxCUVVrc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJUdFJRVU5tTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzFGQlF6RkNMRWxCUVVrc1NVRkJTU3hMUVVGTExFMUJRVTBzUlVGQlJUdFpRVU5xUWl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFOQlEyNURMRTFCUVUwN1dVRkRTQ3hKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEZOQlFWTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFRRVU51UkR0TFFVTktPenM3T3pzN08wbEJUMFFzU1VGQlNTeFhRVUZYTEVkQlFVYzdVVUZEWkN4UFFVRlBMRWxCUVVrc1MwRkJTeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkROMFU3U1VGRFJDeEpRVUZKTEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRaaXhKUVVGSkxFbEJRVWtzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEV2l4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5rTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xTkJRMnBDTEV0QlFVczdXVUZEUml4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTnFRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTllMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFOQlEyUTdTMEZEU2pzN096czdPenRKUVU5RUxHTkJRV01zUjBGQlJ6dFJRVU5pTEU5QlFVOHNTVUZCU1N4TFFVRkxMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU03UzBGRGNFTTdPenM3T3pzN1NVRlBSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ6dFJRVU5LTEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU4yUWp0SlFVTkVMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU5TTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlEyNUNMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUTJoRE96czdPenM3TzBsQlQwUXNTVUZCU1N4RFFVRkRMRWRCUVVjN1VVRkRTaXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRka0k3U1VGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVN1VVRkRVaXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOdVFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dExRVU5vUXpzN096czdPenRKUVU5RUxFbEJRVWtzVVVGQlVTeEhRVUZITzFGQlExZ3NUMEZCVHl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzB0QlF6bENPMGxCUTBRc1NVRkJTU3hSUVVGUkxFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlEyWXNTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJRMllzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRUUVVOd1F5eE5RVUZOTzFsQlEwZ3NUVUZCVFN4clFrRkJhMElzUjBGQlJ5eEpRVUZKTEVkQlFVY3NZMEZCWXl4RFFVRkRPMWxCUTJwRUxGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMR3RDUVVGclFpeERRVUZETEVOQlFVTTdXVUZEZUVNc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eFZRVUZWTEVWQlFVVXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF6dFRRVU55UkR0TFFVTktPenM3T3pzN096dEpRVkZFTEU5QlFVOHNSMEZCUnp0UlFVTk9MRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFVVTdXVUZEYUVJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCVlN4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVNNVFpeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMR05CUVdNc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETjBNc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4bFFVRmxMRVZCUVVVN1owSkJRekZETEUxQlFVMHNSVUZCUlR0dlFrRkRTaXhIUVVGSExFVkJRVVVzU1VGQlNUdHBRa0ZEV2p0aFFVTktMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMUE3UzBGRFNqczdPenM3T3pzN08wbEJVMFFzVFVGQlRTeERRVUZETEUxQlFVMHNSVUZCUlR0UlFVTllMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFVVTdXVUZEYUVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eE5RVUZOTEVOQlFVTTdXVUZEY2tJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4alFVRmpMRVZCUVVVN1owSkJRM3BETEUxQlFVMHNSVUZCUlR0dlFrRkRTaXhIUVVGSExFVkJRVVVzU1VGQlNUdHZRa0ZEVkN4TlFVRk5PMmxDUVVOVU8yRkJRMG9zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVUR0TFFVTktPenM3T3pzN08wbEJUMFFzVFVGQlRTeEhRVUZITzFGQlEwd3NUMEZCVHl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dExRVU12UWpzN096czdPenM3TzBsQlUwUXNVMEZCVXl4RFFVRkRMRTFCUVUwc1JVRkJSVHRSUVVOa0xFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZPMWxCUXpkRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRPMWxCUTI1Q0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6dFpRVU40UXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzVjBGQlZ5eERRVUZETEdsQ1FVRnBRaXhGUVVGRk8yZENRVU5zUkN4TlFVRk5MRVZCUVVVN2IwSkJRMG9zUjBGQlJ5eEZRVUZGTEVsQlFVazdiMEpCUTFRc1RVRkJUVHRwUWtGRFZEdGhRVU5LTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTFBN1MwRkRTanM3T3pzN096czdPenM3TzBsQldVUXNUVUZCVFN4RFFVRkRMRTlCUVU4c1JVRkJSU3hQUVVGUExFVkJRVVVzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRVZCUVVVN1VVRkRja1FzVFVGQlRTeExRVUZMTEVkQlFVY3NUMEZCVHl4SFFVRkhMR0ZCUVdFc1EwRkJRenRSUVVOMFF5eE5RVUZOTEV0QlFVc3NSMEZCUnl4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRek5DTEUxQlFVMHNUVUZCVFN4SFFVRkhMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRE4wSXNUVUZCVFN4VFFVRlRMRWRCUVVjc1VVRkJVU3hIUVVGSExFdEJRVXNzUTBGQlF6czdVVUZGYmtNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4WFFVRlhMRU5CUVVNN08xRkJSVE5DTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRk8xbEJRMllzVlVGQlZTeERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xTkJRM1pFT3p0UlFVVkVMRWxCUVVrc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eFJRVUZSTEVWQlFVVTdXVUZEY2tJc1QwRkJUeXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU40UXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOMlF5eFBRVUZQTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjZSRHM3VVVGRlJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenM3VVVGRk5VTXNVVUZCVVN4SlFVRkpMRU5CUVVNc1NVRkJTVHRSUVVOcVFpeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTktMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzQkVMRTFCUVUwN1UwRkRWRHRSUVVORUxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlEwb3NVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGRFUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTTVSQ3hOUVVGTk8xTkJRMVE3VVVGRFJDeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTktMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzUkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzQkVMRk5CUVZNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRPVVFzVFVGQlRUdFRRVU5VTzFGQlEwUXNTMEZCU3l4RFFVRkRMRVZCUVVVN1dVRkRTaXhUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTjBSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU01UkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZETVVRc1RVRkJUVHRUUVVOVU8xRkJRMFFzUzBGQlN5eERRVUZETEVWQlFVVTdXVUZEU2l4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU4wUkN4VFFVRlRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZETVVRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRVVVzVTBGQlV5eERRVUZETEVOQlFVTTdXVUZEY0VRc1UwRkJVeXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVNNVJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE1VUXNUVUZCVFR0VFFVTlVPMUZCUTBRc1MwRkJTeXhEUVVGRExFVkJRVVU3V1VGRFNpeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOMFJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE1VUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRGNrUXNVMEZCVXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVTTVSQ3hUUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1RVRkJUU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eE5RVUZOTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzVTBGQlV5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRM3BFTEUxQlFVMDdVMEZEVkR0UlFVTkVMRkZCUVZFN1UwRkRVRHM3TzFGQlIwUXNUMEZCVHl4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6RkRPME5CUTBvc1EwRkJRenM3UVVGRlJpeE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkRMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRVVVzYVVKQlFXbENMRU5CUVVNc1EwRkJRenM3UVVNelpqTkVPenM3T3pzN096czdPenM3T3pzN096czdPMEZCYlVKQkxFRkJSVUU3T3pzN08wRkJTMEVzVFVGQlRTeDNRa0ZCZDBJc1IwRkJSeXhqUVVGakxGZEJRVmNzUTBGQlF6czdPenM3U1VGTGRrUXNWMEZCVnl4SFFVRkhPMUZCUTFZc1MwRkJTeXhGUVVGRkxFTkJRVU03UzBGRFdEczdTVUZGUkN4cFFrRkJhVUlzUjBGQlJ6dFJRVU5vUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSVUZCUlR0WlFVTXhRaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEhGQ1FVRnhRaXhEUVVGRExFTkJRVU03VTBGRE0wTTdPMUZCUlVRc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEVOQlFVTXNTMEZCU3l4TFFVRkxPenRaUVVVdlF5eEpRVUZKTEVOQlFVTXNUMEZCVHp0cFFrRkRVQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMmxDUVVNelF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETzFOQlEyeERMRU5CUVVNc1EwRkJRenRMUVVOT096dEpRVVZFTEc5Q1FVRnZRaXhIUVVGSE8wdEJRM1JDT3pzN096czdPMGxCVDBRc1NVRkJTU3hQUVVGUExFZEJRVWM3VVVGRFZpeFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOMlJEdERRVU5LTEVOQlFVTTdPMEZCUlVZc1RVRkJUU3hEUVVGRExHTkJRV01zUTBGQlF5eE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVVzZDBKQlFYZENMRU5CUVVNc1EwRkJRenM3UVVNM1JERkZPenM3T3pzN096czdPenM3T3pzN096czdRVUZyUWtFc1FVRkxRU3hOUVVGTkxFTkJRVU1zWVVGQllTeEhRVUZITEUxQlFVMHNRMEZCUXl4aFFVRmhMRWxCUVVrc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF6dEpRVU42UkN4UFFVRlBMRVZCUVVVc1QwRkJUenRKUVVOb1FpeFBRVUZQTEVWQlFVVXNWVUZCVlR0SlFVTnVRaXhQUVVGUExFVkJRVVVzTWtKQlFUSkNPMGxCUTNCRExGbEJRVmtzUlVGQlJUdFJRVU5XTEhWQ1FVRjFRaXhGUVVGRkxIVkNRVUYxUWp0UlFVTm9SQ3hwUWtGQmFVSXNSVUZCUlN4cFFrRkJhVUk3VVVGRGNFTXNiMEpCUVc5Q0xFVkJRVVVzYjBKQlFXOUNPMUZCUXpGRExIZENRVUYzUWl4RlFVRkZMSGRDUVVGM1FqdExRVU55UkR0RFFVTktMRU5CUVVNc1EwRkJReUo5In0=
