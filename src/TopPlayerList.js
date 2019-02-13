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
import {DEFAULT_SYSTEM_PLAYER, TAG_NAME as TOP_PLAYER} from "./TopPlayer.js";

const TAG_NAME = "top-player-list";

/**
 * TopPlayerList to describe the players in the game.
 *
 * @extends HTMLElement
 */
const TopPlayerList = class extends HTMLElement {

    /**
     * Create a new TopPlayerList.
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
     * @type {TopPlayer[]}
     */
    get players() {
        return [...this.getElementsByTagName(TOP_PLAYER)];
    }
};

window.customElements.define(TAG_NAME, TopPlayerList);

export {
    TopPlayerList,
    TAG_NAME
};
