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
 * TopPlayerListHTMLElement to describe the players in the game
 */
const TopPlayerListHTMLElement = class extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    get players() {
        return [...this.getElementsByTagName("top-player")];
    }

    contains(player) {
        return this.players.filter(p => p.equals(player));
    }

    find(player) {
        const foundPlayers = this.players.filter(p => p.equals(player));
        return 0 === foundPlayers.length ? null : foundPlayers[0];
    }


};

window.customElements.define("top-player-list", TopPlayerListHTMLElement);

export {
    TopPlayerListHTMLElement
};
