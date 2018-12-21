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
 * TopPlayerHTMLElement -- A Player of a dice game.
 *
 * A Player's name and color should be unique in a game. Two different Player
 * instances with the same name and same color are considered the same Player.
 *
 */
const TopPlayerHTMLElement = class extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    connectedCallback() {
        if ("string" !== typeof this.name || "" === this.name) {
            throw new ConfigurationError("A Player needs a name, which is a String.");
        }
        if ("string" !== typeof this.color || "" === this.color) {
            throw new ConfigurationError("A Player needs a color, which is a String.");
        }
    }

    disconnectedCallback() {
    }

    /**
     * This Player's name.
     *
     * @return {String} This Player's name.
     */
    get name() {
        return this.getAttribute("name");
    }

    /**
     * This Player's color.
     *
     * @return {String} This Player's color.
     */
    get color() {
        return this.getAttribute("color");
    }

    toString() {
        return `${this.name}`;
    }

    /**
     * Is this Player equat another player?
     * 
     * @param {Player} other - The other Player to compare this Player with.
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
const DEFAULT_SYSTEM_PLAYER = new TopPlayerHTMLElement();
DEFAULT_SYSTEM_PLAYER.setAttribute("name", "*");
DEFAULT_SYSTEM_PLAYER.setAttribute("color", "red");

export {
    TopPlayerHTMLElement,
    DEFAULT_SYSTEM_PLAYER
};
