/**
 * Copyright (c) 2018, 2019 Huub de Beer
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
 */
import {TopDiceBoard} from "./TopDiceBoard.js";
import {TopDie} from "./TopDie.js";
import {TopPlayer} from "./TopPlayer.js";
import {TopPlayerList} from "./TopPlayerList.js";

window.twentyonepips = window.twentyonepips || Object.freeze({
    VERSION: "0.0.1",
    LICENSE: "LGPL-3.0",
    WEBSITE: "https://twentyonepips.org",
    TopDiceBoard: TopDiceBoard,
    TopDie: TopDie,
    TopPlayer: TopPlayer,
    TopPlayerList: TopPlayerList
});
