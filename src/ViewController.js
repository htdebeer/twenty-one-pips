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
import {Base} from "./Base.js";
import {EventAware} from "./EventAware.js";

/**
 * @module
 */

const _shadow = new WeakMap();

/**
 * Base class for view components.
 *
 * @property {HTMLDivElement} element - The main HTMLDivElement for this View controller.
 *
 * @mixes module:EventAware~EventAware
 */
const ViewController = class extends EventAware(HTMLDivElement) {

    /**
     * Create a new ViewController.
     *
     * @param {Object} config - The configuration of this ViewController.
     * @param {HTMLElement|null} [config.parent = nul] - The parent element
     * the newly created ViewController is a child of.
     */
    constructor({
        parent = null,
        properties
    } = {}) {
        super();
        _shadow.set(this, this.attachShadow({mode: "open"}));

        if (null !== parent) {
            parent.appendChild(this);
        }
    }

    /**
     * This ViewController's shadow dom
     *
        * @return {ShadowRoot} This ViewController's shadow dowm.
     */
    get shadow() {
        return _shadow.get(this);
    }
};

export {ViewController};
