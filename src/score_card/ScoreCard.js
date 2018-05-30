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
import {ConfigurationError} from "../error/ConfigurationError.js";
import {ViewController} from "../ViewController.js";
import {DEFAULT_SYSTEM_PLAYER} from "../Player.js";

const SUM = dice => dice.reduce((sum, die) => sum += die.pips, 0);

/**
 * @module
 */
const _scores = new WeakMap();
const _totals = new WeakMap();

/**
 * ScoreCard is a component to render the scores per player in a game.
 *
 * @extends module:ViewController~ViewController
 */
const ScoreCard = class extends ViewController {

    /**
     * Create a new ScoreCard component.
     *
     * @param {Object} config - The initial configuration of the new ScoreCard
     */
    constructor({
        parent = null,
        players = []
    } = {}) {
        super({parent});
        this.element.classList.add("score-card");

        const playerScores = new Map();
        for (const player of players) {
            playerScores.set(player, new Map());
        }
        _scores.set(this, playerScores);
        _totals.set(this, new Map());
    }

   
    get scores() {
        return _scores.get(this);
    }

    get totals() {
        return _totals.get(this);
    }

    get players() {
        return Array.from(this.scores.keys());
    }

    total(player) {
    }

    score({
        player,
        key,
        dice,
        scoring = SUM
    }) {
        const value = scoring.apply(this, dice);
        this.scores.get(player).set(key, value);

        // update totals


        return value;
    }

    hasScore({
        player,
        key
    }) {
        return this.scores.get(player).has(key);
    }

    getScore({
        player,
        key
    }) {
        return this.scores.get(player).get(key);
    }

    getScores({
        player
    }) {
        return this.scores.get(player);
    }



};

export {
    ScoreCard
};
