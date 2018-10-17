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
import {
    CanvasDiceBoard
} from "./CanvasDiceBoard.js";
import {DEFAULT_SYSTEM_PLAYER} from "../Player.js";


const _diceBoard = new WeakMap();
const OBSERVED_ATTRIBUTES = {
    "width": {
        convert: (v) => parseInt(v, 10)
    },
    "height": {
        convert: (v) => parseInt(v, 10)
    },
    "dispersion": {
        convert: (v) => parseInt(v, 10)
    },
    "draggable-dice": {
        convert: (v) => v
    },
    "holdable-dice": {
        convert: (v) => v
    },
    "hold-duration": {
        convert: (v) => v
    },
    "die-size": {
        convert: (v) => parseInt(v, 10)
    },
    "background": {
        convert: (v) => v
    }
};

const attributeNameToPropertyName = (name) => {
    return name.split("-").map((part, index) => {
        if (0 === index) {
            return part;
        } else {
            return part[0].toUpperCase() + part.slice(1);
        }
    }).join("");
};

const TopDiceBoardHTMLElement = class extends HTMLElement {

    constructor() {
        super();

        _diceBoard.set(this, new CanvasDiceBoard({
            parent: this.attachShadow({mode: "closed"})
        }));
    }

    static get observedAttributes() {
        return Object.keys(OBSERVED_ATTRIBUTES);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const attribute = OBSERVED_ATTRIBUTES[name];
        const board = _diceBoard.get(this);
        board[attributeNameToPropertyName(name)] = attribute.convert(newValue);
        board.redraw();
    }

    renderDice({dice, player}) {
        _diceBoard.get(this).renderDice({dice, player});
    }

    throwDice({
        dice = null,
        player = DEFAULT_SYSTEM_PLAYER,
    } = {}) {
        _diceBoard.get(this).throwDice({dice, player});
    }


};

window.customElements.define("top-dice-board", TopDiceBoardHTMLElement);

export {
    TopDiceBoardHTMLElement
};
