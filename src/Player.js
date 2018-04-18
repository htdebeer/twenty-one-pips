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

const _name = new WeakMap();
const _color = new WeakMap();

/**
 * A Player of a dice game.
 *
 * A Player' name and color should be unique in a game. Two different Player
 * instances with the same name and same color are considered the same Player.
 *
 * @property {String} name - This Player's name.
 * @property {String} color - The color associated with this Player.
 * 
 * @extends module:Model~Model
 */
const Player = class extends Model {
    /**
     * Create a new Player given a name and a color.
     *
     * @param {Object} config - The initial configuration of this Player.
     * @param {String} config.name - This Player's name.
     * @param {String} config.color - The color associated with this Player.
     *
     * @throws {module:error/ConfigurationError~ConfigurationError} A Player must have a name and a
     * color.
     */
    constructor({name, color}) {
        super();
        if (undefined === name) {
            throw new ConfigurationError("A Player needs a name");
        }
        if (undefined === color) {
            throw new ConfigurationError("A Player needs a color");
        }

        _name.set(this, name);
        _color.set(this, color);
    }

    get name() {
        return _name.get(this);
    }

    get color() {
        return _color.get(this);
    }

    /**
     * Is this Player equat another player?
     * 
     * @param {Player} other - The other Player to compare this Player with.
     * @return {Boolean} True when either the object references are the same
     * or when both name and color are the same.
     */
    equals(other) {
        return other === this || other.name === this.name && other.color === this.color;
    }
};

const GAME_MASTER = new Player({name: "GameMaster", color: "red"});

export {
    Player,
    GAME_MASTER
};
