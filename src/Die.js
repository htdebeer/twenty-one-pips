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
import {Model} from "./Model.js";
import {ConfigurationError} from "./error/ConfigurationError.js";

/**
 * @module
 */

const NUMBER_OF_PIPS = 6; // Default / regular six sided die has 6 pips maximum.
const DEFAULT_COLOR = "Ivory";

// Private properties
const _pips = new WeakMap(); // The number of pips of a die.
const _heldBy = new WeakMap(); // Reference to the player that is holding a die.
const _color = new WeakMap(); // The color of a die.
const _x = new WeakMap(); // The x-coordinate of a die on the table.
const _y = new WeakMap(); // The y-coordinate of a die on the table.
const _rotation = new WeakMap(); // The rotation in degrees of a die on the table.

/**
 * Is p a Player?
 *
 * Testing framework + babel results in instanceof not working correctly. So
 * checking for compatibility instead in the meantime.
 *
 * @param {*} p - The thing to check.
 * @return {Boolean} True is p is a Player.
 */
const isPlayer = p => null === p || (Boolean(p.color) && Boolean(p.name));

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
 * Convert a unicode character representing a die face to the number of pips of
 * that same die. This function is the reverse of pipsToUnicode.
 *
 * @param {String} u - The unicode character to convert to pips.
 * @returns {Number|undefined} The corresponding number of pips, 1 ≤ pips ≤ 6, or
 * undefined if u was not a unicode character representing a die.
 */
const unicodeToPips = (u) => {
    const dieCharIndex = DIE_UNICODE_CHARACTERS.indexOf(u);
    return 0 <= dieCharIndex ? dieCharIndex + 1 : undefined;
};


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


/**
 * @typedef {Object} Coordinates
 * @property {Number} x - The x coordinate.
 * @property {Number} y - The y coordinate.
 */

/**
 * A model of a regular six-sided Die.
 *
 * @extends module:Model~Model
 */
const Die = class extends Model {

    /**
     * Create a new Die.
     *
     * @param {Object} config - The initial configuration of this Die.
     * @param {Number} [config.pips = -1] - The number of pips for this Die. This 
     * number should be between 1 and 6 inclusive. Any other value is ignored 
     * and a random number between 1 and 6 is used instead.
     * @param {String} [config.color = DEFAULT_COLOR] - The background color of
     * this Die.
     * @param {module:Player~Player|null} [config.heldBy = null] - The player that is holding
     * this Die. Defaults to null, indicating that no player is holding this
     * Die.
     * @param {Coordinates} [coordinates = null] - The coordinates of this Die.
     * Defaults to null.
     * @param {Number} [rotation = 0] - The rotation of this
     * Die. Defaults to 0.
     */
    constructor({
        pips = -1,
        heldBy = null,
        color = DEFAULT_COLOR,
        coordinates = null,
        rotation = 0
    } = {}) {
        super();

        if (!isPlayer(heldBy)) {
            throw new ConfigurationError(`A die must be hold by a Player or it is not hold at all. Got '${heldBy}' instead.`);
        }
        _heldBy.set(this, heldBy);
        _color.set(this, color);
        _pips.set(this, isPipNumber(pips) ? pips : randomPips());
        this.coordinates = coordinates;
        this.rotation = rotation;
    }

    /**
     * Create a new Die based on a unicode character of a die.
     *
     * @param {String} unicodeChar - The unicode character representing a die.
     * @param {Object} config - The initial configuration of this Die.
     * @param {String} [config.color = DEFAULT_COLOR] - The background color of
     * this Die.
     * @param {module:Player~Player|null} [config.heldBy = null] - The player that is holding
     * this Die. Defaults to null, indicating that no player is holding this
     * Die.
     *
     * @return {Die} The Die corresponding to the unicodeChar.
     * @throws {module:error/ConfigurationError~ConfigurationError} The unicodeChar should be one of six
     * unicode characters representing a die.
     */
    static fromUnicode(unicodeChar, {
        heldBy = null,
        color = DEFAULT_COLOR
    } = {}) {
        const pips = unicodeToPips(unicodeChar);
        if (!isPipNumber(pips)) {
            throw new ConfigurationError(`The String '${unicodeChar}' is not a unicode character representing a die.`);
        }
        return new Die({pips, heldBy, color});
    }

    /**
     * Convert this Die to the corresponding unicode character of a die.
     *
     * @return {String} The unicode character corresponding to the number of
     * pips of this Die.
     */
    toUnicode() {
        return pipsToUnicode(this.pips);
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

    /**
     * The Player that is holding this Die, if any. Null otherwise.
     *
     * @type {Player|null} 
     */
    get heldBy() {
        return _heldBy.get(this);
    }

    /**
     * The coordinates of this Die.
     *
     * @type {Coordinates|null}
     */
    get coordinates() {
        const x = _x.get(this);
        const y = _y.get(this);

        return null === x || null === y ? null : {x, y};
    }
    set coordinates(c) {
        if (null === c) {
            _x.set(this, null);
            _y.set(this, null);
        } else{
            const {x, y} = c;
            _x.set(this, x);
            _y.set(this, y);
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
     * The rotation of this Die.
     *
     * @type {Number} The rotation of this Die, 0 ≤ rotation ≤ 360.
     */
    get rotation() {
        return _rotation.get(this);
    }
    set rotation(newR) {
        _rotation.set(this, newR);
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
            this.dispatchEvent(new CustomEvent("top:throw-die", {detail: {
                die: this
            }}));
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
            _heldBy.set(this, player);
            this.dispatchEvent(new CustomEvent("top:hold-die", {detail: {
                die: this,
                player
            }}));
        }
    }

    /**
     * Is this Die being held by any player?
     *
     * @return {Boolean} True when this Die is being held by any player, false otherwise.
     */
    isHeld() {
        return null !== _heldBy.get(this);
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
            _heldBy.set(this, null);
            this.dispatchEvent(new CustomEvent("top:release-die", {detail: {
                die: this,
                player
            }}));
        }
    }
};

export {
    Die
};
