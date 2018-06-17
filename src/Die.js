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

const NUMBER_OF_PIPS = 6;
const DEFAULT_COLOR = "Ivory";

// Private properties
const _pips = new WeakMap();
const _heldBy = new WeakMap();
const _color = new WeakMap();
const _x = new WeakMap();
const _y = new WeakMap();
const _rotation = new WeakMap();

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

const randomPips = () => Math.floor(Math.random() * NUMBER_OF_PIPS) + 1;

const DIE_UNICODE_CHARACTERS = ["⚀","⚁","⚂","⚃","⚄","⚅"];
const unicodeToPips = u => DIE_UNICODE_CHARACTERS.indexOf(u) + 1;
const pipsToUnicode = p => isPipNumber(p) ? DIE_UNICODE_CHARACTERS[p - 1] : undefined;

/**
 * A model of a regular six-sided Die with numbers 1 - 6.
 *
 * @property {Number} pips - The number of pips of this Die; 1 <= pips <= 6.
 * @property {String} color - The color of this Die. Defaults to "Ivory".
 * @property {module:Player~Player} heldBy - The player that is holding this Die, if any. If
 * no player is holding it, heldBy is null.
 * @property {Coordinate} coordinate - The coordinate at which this Die has
 * been rendered, null otherwise.
 * @property {Number} rotation - The rotation of this Die if it has been
 * rendered, null otherwise.
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
     * @param {Coordinate} [coordinates = null] - The coordinates of this Die.
     * Defaults to null.
     * @param {Number} [coordinates.x] - The x coordinate
     * @param {Number} [coordinates.y] - The y coordinate
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
     * This Die's number of pips.
     *
     * @return {Number} This Die's number of pips.
     */
    get pips() {
        return _pips.get(this);
    }

    /**
     * This Die's color.
     *
     * @return {String} This Die's color.
     */
    get color() {
        return _color.get(this);
    }

    /**
     * The Player that is holding this Die, if any. Null otherwise.
     *
     * @return {Player|null} The player that is holding this Die, if any. Null
     * otherwise.
     */
    get heldBy() {
        return _heldBy.get(this);
    }

    /**
     * The coordinates of this Die.
     *
     * @return {Object|null} The coordinates of this Die.
     */
    get coordinates() {
        const x = _x.get(this);
        const y = _y.get(this);

        return null === x || null === y ? null : {x, y};
    }

    /**
     * Set the coordinates of this Die.
     *
     * @param {Object} c - The coordinates to place this Die.
     */
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
     * @return {Number} The rotation of this Die, 0 <= rotation <= 360.
     */
    get rotation() {
        return _rotation.get(this);
    }

    /**
     * Set the rotation of this Die.
     *
     * @param {Number} newR - The angle to rotate this Die with, 0 <=
     * angle <= 360.
     */
    set rotation(newR) {
        _rotation.set(this, newR);
    }

    /**
     * Throw this Die: set the number of pips to a random number between 1 and
     * 6. Only dice that are not being held can be thrown.
     *
     * @fires THROW_DIE with parameters this Die.
     */
    throwIt() {
        if (!this.isHeld()) {
            _pips.set(this, randomPips());
            this.dispatchEvent(new CustomEvent("throw-die", {detail: {
                die: this
            }}));
        }
    }

    /**
     * The player holds this Die. A player can only hold a die that is not
     * being held yet.
     *
     * @param {module:Player~Player} player - The player who wants to hold this Die.
     * @fires HOLD_DIE with parameters this Die and the player.
     */
    holdIt(player) {
        if (!this.isHeld()) {
            _heldBy.set(this, player);
            this.dispatchEvent(new CustomEvent("hold-die", {detail: {
                die: this,
                player
            }}));
        }
    }

    /**
     * Is this Die being held?
     *
     * @return {Boolean} True when this Die is being held, false otherwise.
     */
    isHeld() {
        return null !== _heldBy.get(this);
    }

    /**
     * The player releases this Die. A player can only release dice she is
     * holding.
     *
     * @param {module:Player~Player} player - The player who wants to release this Die.
     * @fires RELEASE_DIE with parameters this Die and the player.
     */
    releaseIt(player) {
        if (this.isHeld() && this.heldBy.equals(player)) {
            _heldBy.set(this, null);
            this.dispatchEvent(new CustomEvent("release-die", {detail: {
                die: this,
                player
            }}));
        }
    }
};

export {
    Die
};
