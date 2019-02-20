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
import {ConfigurationError} from "./error/ConfigurationError.js";
import {ReadOnlyAttributes} from "./mixin/ReadOnlyAttributes.js";
import {validate} from "./validate/validate.js";

const TAG_NAME = "top-player";

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

        const colorValue = validate.color(color || this.getAttribute(COLOR_ATTRIBUTE));
        if (colorValue.isValid) {
            _color.set(this, colorValue.value);
            this.setAttribute(COLOR_ATTRIBUTE, this.color);
        } else {
            throw new ConfigurationError("A Player needs a color, which is a String.");
        }

        const nameValue = validate.string(name || this.getAttribute(NAME_ATTRIBUTE));
        if (nameValue.isValid) {
            _name.set(this, name);
            this.setAttribute(NAME_ATTRIBUTE, this.name);
        } else {
            throw new ConfigurationError("A Player needs a name, which is a String.");
        }

        const scoreValue = validate.integer(score || this.getAttribute(SCORE_ATTRIBUTE));
        if (scoreValue.isValid) {
            _score.set(this, score);
            this.setAttribute(SCORE_ATTRIBUTE, this.score);
        } else {
            // Okay. A player does not need to have a score.
            _score.set(this, null);
            this.removeAttribute(SCORE_ATTRIBUTE);
        }

        const hasTurnValue = validate.boolean(hasTurn || this.getAttribute(HAS_TURN_ATTRIBUTE))
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
        const sameName = other.name === this.name;
        const sameColor = other.color === this.color;
        return other === this || (sameName && sameColor);
    }
};

window.customElements.define(TAG_NAME, TopPlayer);

/**
 * The default system player. Dice are thrown by a player. For situations
 * where you want to render a bunch of dice without needing the concept of Players
 * this DEFAULT_SYSTEM_PLAYER can be a substitute. Of course, if you'd like to
 * change the name and/or the color, create and use your own "system player".
 * @const
 */
const DEFAULT_SYSTEM_PLAYER = new TopPlayer({color: "red", name: "*"});

export {
    TopPlayer,
    DEFAULT_SYSTEM_PLAYER,
    TAG_NAME,
    HAS_TURN_ATTRIBUTE
};
