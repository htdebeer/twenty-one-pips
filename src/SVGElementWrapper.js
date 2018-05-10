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

/**
 * @module
 */

/**
 * The SVG namespace.
 *
 * @type {String}
 */
const SVGNS = "http://www.w3.org/2000/svg";

/**
 * The xlink namespace.
 *
 * @type {String}
 */
const XLINKNS = "http://www.w3.org/1999/xlink";

const _element = new WeakMap();

/**
 * Wrap a SVG element
 */
const SVGElementWrapper = class {
    /**
     * Create a new SVGElementWrapper for the SVGElement
     *
     * @param {SVGElement} svgElement - The SVGElement to wrap.
     */
    constructor(svgElement) {
        _element.set(this, svgElement);
    }

    /**
     * The wrapped SVGElement.
     *
     * @type {SVGElement}
     */
    get element() {
        return _element.get(this);
    }
};

export {
    SVGNS,
    XLINKNS,
    SVGElementWrapper
};
