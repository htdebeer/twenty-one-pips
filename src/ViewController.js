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

import {EventAware} from "./EventAware.js";

/**
 * @module
 */

const _element = new WeakMap();

/**
 * Base class for view components.
 *
 * @property {HTMLDivElement} element - The main HTMLDivElement for this View controller.
 *
 * @mixes module:EventAware~EventAware
 */
const ViewController = class extends EventAware(null) {

    /**
     * Create a new ViewController.
     *
     * @param {Object} config - The configuration of this ViewController.
     * @param {HTMLElement|null} [config.parent = nul] - The parent element
     * the newly created ViewController is a child of.
     */
    constructor({
        parent = null
    } = {}) {
        super();

        _element.set(this, document.createElement("div"));

        if (null !== parent) {
            parent.appendChild(this.element);
        }
    }

    /**
     * This ViewController's DIV element
     *
     * @return {HTMLDIVElement} This ViewController's DIV element.
     */
    get element() {
        return _element.get(this);
    }
};

export {ViewController};
