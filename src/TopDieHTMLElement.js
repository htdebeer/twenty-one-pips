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

import {ConfigurationError} from "./error/ConfigurationError.js";

/**
 * @module
 */

const NUMBER_OF_PIPS = 6; // Default / regular six sided die has 6 pips maximum.
const DEFAULT_COLOR = "Ivory";
const DEFAULT_X = 0;
const DEFAULT_Y = 0;
const DEFAULT_ROTATION = 0;

// Private properties
const _heldBy = new WeakMap(); // Reference to the player that is holding a die.

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

const _board = new WeakMap();

/**
 * TopDieHTMLElement is the "top-die" custom HTML element representing a die
 * on the dice board.
 */
const TopDieHTMLElement = class extends HTMLElement {
    constructor() {
        super();
    }
    
    static get observedAttributes() {
        return ["x", "y", "rotation", "pips", "held-by"]
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    connectedCallback() {
        _board.set(this, this.parentNode);
        // Ensure every die has a pips, 1 <= pips <= 6
        if (!this.hasAttribute("pips")) {
            this.setAttribute("pips", randomPips());
        }

        _board.get(this).dispatchEvent(new Event("top-die:added"));
    }

    get ready() {
        return _ready.get(this);
    }

    disconnectedCallback() {
        _board.get(this).dispatchEvent(new Event("top-die:removed"));
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
     * This Die's number of pips, 1 ≤ pips ≤ 6.
     *
     * @type {Number}
     */
    get pips() {
        return parseInt(this.getAttribute("pips"), 10);
    }

    /**
     * This Die's color.
     *
     * @type {String}
     */
    get color() {
        return this.hasAttribute("color") ? this.getAttribute("color") : DEFAULT_COLOR;
    }

    /**
     * The Player that is holding this Die, if any. Null otherwise.
     *
     * @type {Player|null} 
     */
    get heldBy() {
        return this.hasAttribute("held-by") ? this.getAttribute("held-by") : null;
    }
    set heldBy(player) {
        this.setAttribute("held-by", player);
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

    get x() {
        return this.hasAttribute("x") ? parseInt(this.getAttribute("x"), 10) : DEFAULT_X;
    }
    set x(newX) {
        this.setAttribute("x", newX);
    }

    get y() {
        return this.hasAttribute("y") ? parseInt(this.getAttribute("y"), 10) : DEFAULT_Y;
    }
    set y(newY) {
        this.setAttribute("y", newY);
    }

    /**
     * The rotation of this Die.
     *
     * @type {Number} The rotation of this Die, 0 ≤ rotation ≤ 360.
     */
    get rotation() {
        return this.hasAttribute("rotation") ? parseInt(this.getAttribute("rotation"), 10) : DEFAULT_ROTATION;
    }
    set rotation(newR) {
        this.setAttribute("rotation", newR);
    }

    /**
     * Throw this Die. The number of pips to a random number n, 1 ≤ n ≤ 6.
     * Only dice that are not being held can be thrown.
     *
     * @fires "top:throw-die" with parameters this Die.
     */
    throwIt() {
        if (!this.isHeld()) {
            this.setAttribute("pips", randomPips());
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
            this.heldBy = player;
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
        return this.hasAttribute("held-by");
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

    render(context, dieSize, coordinates = this.coordinates) {
        const HALF = dieSize / 2;
        const QUARTER = HALF / 2;
        const {x, y} = coordinates;
        if (this.isHeld()) {
            // Render hold circle
            context.beginPath();
            context.fillStyle = this.heldBy.color;
            context.arc(x + HALF, y + HALF, HALF, 0, 2 * Math.PI, false);
            context.fill();
        }

        // Render die
        context.fillStyle = this.color;
        context.strokeStyle = "black";
        context.fillRect(x + QUARTER, y + QUARTER, HALF, HALF);
        context.strokeRect(x + QUARTER, y + QUARTER, HALF, HALF);
    }
};

window.customElements.define("top-die", TopDieHTMLElement);

export {
    TopDieHTMLElement
};
