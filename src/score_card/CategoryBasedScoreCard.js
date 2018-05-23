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

const _categories = new WeakMap();


/**
 * CategoryBasedScoreCard
 *
 * @extends module:ScoreCard~ScoreCard
 */
const CategoryBasedScoreCard = class extends ScoreCard {

    constructor({
        parent = null,
        players = [],
        categories = []
    } = {}) {
        super({
            parent,
            players
        });
        this.element.classList.add("category-based-score-card");

        _categories.set(this, categories);
    }

    score({
        player, category, value
    }) {
        this.scores.get(player).set(category, value);
    }

};

export {
    CategoryBasedScoreCard
};
