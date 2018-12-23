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

const attribute2property = (name) => {
    const [first, ...rest] = name.split("-");
    return first + rest.map(word => word.slice(0, 1).toUpperCase() + word.slice(1)).join();
};

const ReadOnlyAttributes = (Sup) => class extends Sup {
    attributeChangedCallback(name, oldValue, newValue) {
        // All attributes are made read-only to prevent cheating by changing
        // the attribute values. Of course, this is by no
        // guarantee that users will not cheat in a different way.
        const property = attribute2property(name);
        if (newValue !== `${this[property]}`) {
            this.setAttribute(name, this[property]);
        }
    }
};

export {
    ReadOnlyAttributes
};
