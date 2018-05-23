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
import {ScoreCard} from "./ScoreCard.js";

/**
 * @module
 */

const _currentRound = new WeakMap();

/**
 * RoundBasedScoreCard
 *
 * @extends module:ScoreCards~ScoreCard
 */
const RoundBasedScoreCard = class extends ScoreCard {

    constructor({
        parent = null,
        players = []
    } = {}) {
        super({
            parent,
            players
        });
        this.element.classList.add("round-based-score-card");

        _currentRound.set(this, 0);
    }

    get currentRound() {
        return _currentRound.get(this);
    }

    setScore({
        player, 
        round = this.currentRound, 
        value
    }) {
        this.scores.get(player).set(round, value); // Can a round's value be reset?

        // if all players have set a value, go to the next round, but only
        // when playing the current round.
        if (this.currentRound === round) {
            const roundFinished = this.players.every(p => undefined !== this.scores.get(p).get(this.currentRound));
            if (roundFinished) {
                _currentRound.set(this, this.currentRound + 1);
            }
        }
    }

    getScore({
        player,
        round = this.currentRound
    }) {
        const playerScores = this.scores.get(player);
        if (playerScores.has(round)) {
            return playerScores.get(round);
        } else {
            return undefined;
        }
    }


    getTotal({
        player
    }) {
        return this.scores.get(player).reduce((sum, val) => sum += val, 0);
    }
};

export {
    RoundBasedScoreCard
};
