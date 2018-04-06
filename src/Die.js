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

/**
 * Event fired when a Die is thrown. 
 * @see {@link module:Die~Die#throwIt}
 * @event 
 */
const THROW_DIE = Symbol("event:throw-die");

/**
 * Event fired when a Player holds a Die.
 * @see {@link module:Die~Die#holdIt}
 * @event 
 */
const HOLD_DIE = Symbol("event:hold-die");

/**
 * Event fired when a Player releases a Die.
 * @see {@link module:Die~Die#releaseIt}
 * @event 
 */
const RELEASE_DIE = Symbol("event:release-die");

const _pips = new WeakMap();
const _heldBy = new WeakMap();
const _color = new WeakMap();

// Testing framework + babel results in instanceof not working correctly. So
// checking for compatibility instead in the meantime.
const isPlayer = p => null === p || (!!p.color && !!p.name);

const isPipNumber = n => {
    const number = parseInt(n, 10);
    return Number.isInteger(number) && 1 <= number && number <= NUMBER_OF_PIPS;
};

const randomPips = () => Math.floor(Math.random() * NUMBER_OF_PIPS) + 1;

const unicodeToPips = u => {
    switch (u) {
    case "⚀": return 1;
    case "⚁": return 2;
    case "⚂": return 3;
    case "⚃": return 4;
    case "⚄": return 5;
    case "⚅": return 6;
    default: return undefined;
    }
};

const pipsToUnicode = p => {
    switch (p) {
    case 1: return "⚀";
    case 2: return "⚁";
    case 3: return "⚂";
    case 4: return "⚃";
    case 5: return "⚄";
    case 6: return "⚅";
    default: return undefined;
    }
};

/**
 * A model of a regular six-sided Die with numbers 1 - 6.
 *
 * @property {Number} pips - The number of pips of this Die; 1 <= pips <= 6.
 * @property {String} color - The color of this Die. Defaults to "Ivory".
 * @property {module:Player~Player} heldBy - The player that is holding this Die, if any. If
 * no player is holding it, heldBy is null.
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
     */
    constructor({
        pips = -1,
        heldBy = null,
        color = DEFAULT_COLOR
    } = {}) {
        super();
        this.registerEvent(THROW_DIE, HOLD_DIE, RELEASE_DIE);

        if (!isPlayer(heldBy)) {
            throw new ConfigurationError(`A die must be hold by a Player or it is not hold at all. Got '${heldBy}' instead.`);
        }
        _heldBy.set(this, heldBy);
        _color.set(this, color);
        _pips.set(this, isPipNumber(pips) ? pips : randomPips());
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
        if (undefined === pips) {
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

    get pips() {
        return _pips.get(this);
    }

    get color() {
        return _color.get(this);
    }

    get heldBy() {
        return _heldBy.get(this);
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
            this.emit(THROW_DIE, this);
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
            this.emit(HOLD_DIE, this, player);
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
            this.emit(RELEASE_DIE, this, player);
        }
    }
};

export {
    Die,
    THROW_DIE,
    HOLD_DIE,
    RELEASE_DIE
};
