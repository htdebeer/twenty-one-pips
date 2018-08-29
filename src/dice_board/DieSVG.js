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
import {SVGNS, XLINKNS} from "./svg.js";
import {NATURAL_DIE_SIZE} from "./DiceBoard.js";

// Event handlers to react to a die model's events
const HOLD_IT_HANDLER = (holdUse) => (event) => {
    holdUse.setAttribute("fill", event.detail.player.color);
};
const RELEASE_IT_HANDLER = (holdUse) => () => holdUse.setAttribute("fill", "none");

const _element = new WeakMap();
const _die = new WeakMap();
const _holdElement = new WeakMap();
const _dieElement = new WeakMap();

/**
 * A view of a Die in SVG elements.
 */
const DieSVG = class {
    /**
     * Create a new DieSVG for a Die
     *
     * @param {Die} die - The Die to create a DieSVG for.
     */
    constructor(die) {
        _element.set(this, document.createElementNS(SVGNS, "g"));
        this.element.classList.add("die");

        const holdUse = document.createElementNS(SVGNS, "use");
        holdUse.setAttributeNS(XLINKNS, "xlink:href", "#hold");
        this.element.appendChild(holdUse);
        _holdElement.set(this, holdUse);

        const dieUse = document.createElementNS(SVGNS, "use");
        this.element.appendChild(dieUse);
        _dieElement.set(this, dieUse);
        _die.set(this, die);

        this.die.removeEventListener("top:hold-die", HOLD_IT_HANDLER());
        this.die.addEventListener("top:hold-die", HOLD_IT_HANDLER(_holdElement.get(this)));

        this.die.removeEventListener("top:release-die", RELEASE_IT_HANDLER());
        this.die.addEventListener("top:release-die", RELEASE_IT_HANDLER(_holdElement.get(this)));
    }

    get element() {
        return _element.get(this);
    }

    /**
     * The Die that is being rendered by this DieSVG
     *
     * @type {Die}
     */
    get die() {
        return _die.get(this);
    }

    /**
     * The size of a rendered die.
     *
     * @type {Number}
     */
    static get size() {
        return DieSVG._size;
    }

    static set size(s) {
        DieSVG._size = s;
    }

    /**
     * The scale of a die with respect to its natural size.
     *
     * @type {Number}
     */
    static get scale() {
        return DieSVG.size / NATURAL_DIE_SIZE;
    }

    /**
     * The center coordinates of a rendered die relative to its top left
     * corner.
     * 
     * @type {Object}
     */
    static get center() {
        const CENTER = NATURAL_DIE_SIZE / 2;
        return {
            x: CENTER,
            y: CENTER
        };
    }

    /**
     * Render this DieSVG element.
     */
    render() {
        // Update hold
        _holdElement.get(this).setAttribute(
            "fill",
            this.die.isHeld() ? this.die.heldBy.color : "none"
        );

        // Update pips
        _dieElement.get(this).setAttributeNS(XLINKNS, "xlink:href", `#die_${this.die.pips}`);
        _dieElement.get(this).setAttribute("fill", this.die.color);

        // Update rotation
        if (0 !== this.die.rotation) {
            _dieElement.get(this).setAttribute(
                "transform",
                `rotate(${this.die.rotation}, ${DieSVG.center.x}, ${DieSVG.center.y})`
            );
        }

        // Update position
        const {x, y} = this.die.coordinates;
        this.element.setAttribute("transform", `translate(${x},${y})scale(${DieSVG.scale})`);
    }
};

export {
    DieSVG
};
