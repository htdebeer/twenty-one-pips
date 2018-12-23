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
import {ReadOnlyAttributes} from "./ReadOnlyAttributes.js";

const COLOR_ATTRIBUTE = "color";
const NAME_ATTRIBUTE = "name";

// Private properties
const _color = new WeakMap();
const _name = new WeakMap();

/**
 * TopPlayerHTMLElement -- A Player of a dice game.
 *
 * A Player's name and color should be unique in a game. Two different Player
 * instances with the same name and same color are considered the same Player.
 *
 */
const TopPlayerHTMLElement = class extends ReadOnlyAttributes(HTMLElement) {

    constructor({color, name} = {}) {
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
    }

    static get observedAttributes() {
        return [
            COLOR_ATTRIBUTE,
            NAME_ATTRIBUTE
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // All attributes are made read-only to prevent cheating by changing
        // the player's properties via the DOM.
        if (newValue !== `${this[name]}`) {
            this.setAttribute(name, this[name]);
        }
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    /**
     * This Player's name.
     *
     * @return {String} This Player's name.
     */
    get name() {
        return _name.get(this);
    }

    /**
     * This Player's color.
     *
     * @return {String} This Player's color.
     */
    get color() {
        return _color.get(this);
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
const DEFAULT_SYSTEM_PLAYER = new TopPlayerHTMLElement({color: "red", name: "*"});

export {
    TopPlayerHTMLElement,
    DEFAULT_SYSTEM_PLAYER
};
