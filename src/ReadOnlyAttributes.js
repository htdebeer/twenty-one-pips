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

/*
 * Convert an HTML attribute to an instance's property. 
 *
 * @param {String} name - The attribute's name
 * @return {String} The corresponding property's name. For example, "my-attr"
 * will be converted to "myAttr", and "disabled" to "disabled".
 */
const attribute2property = (name) => {
    const [first, ...rest] = name.split("-");
    return first + rest.map(word => word.slice(0, 1).toUpperCase() + word.slice(1)).join();
};

/**
 * Mixin to make all attributes on a custom HTMLElement read-only in the sense
 * that when the attribute gets a new value that differs from the value of the
 * corresponding property, it is reset to that property's value. The
 * assumption is that attribute "my-attribute" corresponds with property "this.myAttribute".
 *
 * @param {Class} Sup - The class to mixin this ReadOnlyAttributes.
 */
const ReadOnlyAttributes = (Sup) => class extends Sup {

    /**
     * Callback that is executed when an observed attribute's value is
     * changed.
     *
     * @param {String} name - The attribute's name
     * @param {String} oldValue - The attribute's value before the change
     * @param {String} newValue - The attribute's value with this change.
     */
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
