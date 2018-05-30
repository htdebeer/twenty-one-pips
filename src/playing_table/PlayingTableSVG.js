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
import {
    SVGNS,
    XLINKNS,
    SVGElementWrapper
} from "../SVGElementWrapper.js";
import {DEFAULT_HOLD_DURATION, DEFAULT_BACKGROUND, DEFAULT_DIE_SIZE, NATURAL_DIE_SIZE} from "./PlayingTable.js";
import template from "./dice_svg_template.js";
import {DieSVG} from "./DieSVG.js";

/**
 * @module
 */

// private properties
const _svgRoot = new WeakMap();
const _renderedDice = new WeakMap();
const _dragHandler = new WeakMap();
const _layout = new WeakMap();
const _dieSize = new WeakMap();
const _holdDuration = new WeakMap();
const _holdableDice = new WeakMap();
const _draggableDice = new WeakMap();
const _background = new WeakMap();

// Interaction states
const NONE = Symbol("no_interaction");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction

let offset = {};
const startDragging = (playingTableSVG, event, dieElement) => {
    let point = playingTableSVG.svgRoot.createSVGPoint();
    point.x = event.clientX - document.body.scrollLeft;
    point.y = event.clientY - document.body.scrollTop;
    point = point.matrixTransform(dieElement.getScreenCTM().inverse());

    offset = {
        x: point.x,
        y: point.y
    };

    const transform = dieElement.ownerSVGElement.createSVGTransform();
    const transformList = dieElement.transform.baseVal;

    _dragHandler.set(playingTableSVG, (event) => {
        // Move dieElement to the top of the SVG so it moves over the other dice
        // rather than below them. 
        playingTableSVG.svgRoot.removeChild(dieElement);
        playingTableSVG.svgRoot.appendChild(dieElement);

        // Get a point in svgport coordinates
        point = playingTableSVG.svgRoot.createSVGPoint();
        point.x = event.clientX - document.body.scrollLeft;
        point.y = event.clientY - document.body.scrollTop;

        // Transform them to user coordinates
        point = point.matrixTransform(dieElement.getScreenCTM().inverse());

        // Keep track of the offset so the dieElement that is being dragged stays
        // under the cursor rather than having a jerk after starting dragging.
        point.x -= offset.x;
        point.y -= offset.y;

        // Setup the transformation
        transform.setTranslate(point.x, point.y);
        transformList.appendItem(transform);
        transformList.consolidate();
    });

    playingTableSVG.svgRoot.addEventListener("mousemove", _dragHandler.get(playingTableSVG));
};

const stopDragging = (playingTableSVG) => {
    playingTableSVG.svgRoot.removeEventListener("mousemove", _dragHandler.get(playingTableSVG));
};

const renderDie = (playingTableSVG, {die, player}) => {
    const dieSVG = new DieSVG(die);

    // Setup interaction
    let state = NONE;
    let origin = {};
    let holdTimeout = null;

    const holdDie = () => {
        switch (state) {
        case INDETERMINED: {
            if (playingTableSVG.holdableDice) {
                // toggle hold / release
                if (die.isHeld()) {
                    die.releaseIt(player);
                } else {
                    die.holdIt(player);
                }
                state = NONE;
            }
            break;
        }
        default: // ignore other states
        }
        holdTimeout = null;
    };

    const startHolding = () => {
        holdTimeout = window.setTimeout(holdDie, playingTableSVG.holdDuration);
    };

    const stopHolding = () => {
        window.clearTimeout(holdTimeout);
        holdTimeout = null;
    };

    const startInteraction = (event) => {
        switch (state) {
        case NONE: {
            event.stopPropagation();
            startHolding();
            origin = {x: event.clientX, y: event.clientY};
            state = INDETERMINED;
            break;
        }
        default: // ignore other states
        }
    };

    const showInteraction = () => {
        dieSVG.element.setAttribute("cursor", "grab");
    };

    const hideInteraction = () => {
        dieSVG.element.setAttribute("cursor", "default");
    };

    /*
    const click = (event) => {
        if (INDETERMINED === state) {
            // do the click
        }
    };
    */

    const minDelta = 3; //px
    const move = (event) => {
        switch (state) {
        case INDETERMINED: {
            // Ignore small movements, otherwise move to MOVE state
            const dx = Math.abs(origin.x - event.clientX);
            const dy = Math.abs(origin.y - event.clientY);
            if (playingTableSVG.draggableDice && minDelta < dx || minDelta < dy) {
                event.stopPropagation();
                state = DRAGGING;
                dieSVG.element.setAttribute("cursor", "grabbing");
                startDragging(playingTableSVG, event, dieSVG.element, die);
            }
            break;
        }
        case DRAGGING: {
            stopHolding();
            break;
        }
        default: // ignore other states
        }
    };

    const stopInteraction = (event) => {
        switch(state) {
        case INDETERMINED: {
            // click
            break;
        }
        case DRAGGING: {
            const dx = origin.x - event.clientX;
            const dy = origin.y - event.clientY;

            const {x, y} = die.coordinates;
            const snapToCoords = playingTableSVG.layout.snapTo({
                die,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            die.coordinates = newCoords;
            const scale = _dieSize.get(playingTableSVG) / NATURAL_DIE_SIZE;
            dieSVG.element.setAttribute("transform", `translate(${newCoords.x},${newCoords.y})scale(${scale})`);

            stopDragging(playingTableSVG);
            break;
        }
        default: // ignore other states
        }
        state = NONE;
    };

    dieSVG.element.addEventListener("mousedown", startInteraction);
    dieSVG.element.addEventListener("touchstart", startInteraction);

    if (playingTableSVG.draggableDice) {
        dieSVG.element.addEventListener("mousemove", move);
        dieSVG.element.addEventListener("touchmove", move);
    }

    if (playingTableSVG.draggableDice || playingTableSVG.holdableDice) {
        dieSVG.element.addEventListener("mouseover", showInteraction);
        dieSVG.element.addEventListener("mouseout", hideInteraction);
    }

    dieSVG.element.addEventListener("mouseup", stopInteraction);
    dieSVG.element.addEventListener("touchend", stopInteraction);

    return dieSVG;
};

const importTemplate = () => {
    const parser = new window.DOMParser(); // Explicitly specified "window.DOMParser" to allow testing with jsdom
    const svgDocument = parser.parseFromString(template, "image/svg+xml");
    return document.importNode(svgDocument.documentElement, true);
}

/**
 * PlayingTableSVG renders the playing table and the dice upon it.
 * 
 * @property {SVGElement} svgRoot - the SVG root element of this SVG.
 * @property {Number} width - The width of this PlayingTableSVG.
 * @property {Number} height - The height of this PlayingTableSVG.
 * @property {Number} holdDuration - The time in milliseconds a user needs to
 * click and hold a die before it is hold/released.
 * @property {Number} dispersion - The spread distance of dice from the center
 * point.
 * @property {String} background - The background color of this svg.
 * @property {Number} maximumNumberOfDice - The maximum number of dice that
 * can be rendered by this svg.
 * @property {module:playing_table/GridLayout~GridLayout} layout - The layout
 * used when rendering dice in this svg.
 */
const PlayingTableSVG = class extends SVGElementWrapper {

    /**
     * Create a new PlayingTableSVG
     *
     * @property {Object} config
     * @property {Number} config.width - The width of this PlayingTableSVG.
     * @property {Number} config.height - The height of this PlayingTableSVG.
     * @property {module:playing_table/Layout~Layout} layout
     * The layout to use when rendering dice in this svg.
     * @property {Number} config.dieSize - The size of a die.
     * @property {Boolean} [config.draggableDice = true] - Are dice draggable?
     * Defaults to true.
     * @property {Boolean} [config.holdableDice = true] - Are dice holdable?
     * Defaults to true;
     * @property {Number} [config.holdDuration = DEFAULT_HOLD_DURATION] - The time 
     * in milliseconds a user needs to
     * click and hold a die before it is hold/released. Defaults to 375ms.
     * @property {String} [config.background = DEFAULT_BACKGROUND] - The background 
     * color of this svg. Defaults to #FFFFAA.
     * used when rendering dice in this svg.
     */
    constructor({
        parent,
        width,
        height,
        layout,
        background = DEFAULT_BACKGROUND,
        dieSize = DEFAULT_DIE_SIZE,
        draggableDice = true,
        holdableDice = true,
        holdDuration = DEFAULT_HOLD_DURATION
    }) {
        super(importTemplate())
        parent.appendChild(this.element);
        _renderedDice.set(this, new Map());

        // Setup properties.
        this.holdDuration = holdDuration;
        this.background = background;
        this.layout = layout;
        this.holdableDice = holdableDice;
        this.draggableDice = draggableDice;
        this.width = width;
        this.height = height;
        _dieSize.set(this, dieSize);
        DieSVG.size = dieSize;
    }

    get svgRoot() {
        return this.element;
    }

    get layout() {
        return _layout.get(this);
    }

    set layout(l) {
        _layout.set(this, l);
    }

    get width() {
        return this.svgRoot.getAttribute("width");
    }

    set width(w) {
        this.svgRoot.setAttribute("width", w);
    }

    get height() {
        return this.svgRoot.getAttribute("height");
    }

    set height(h) {
        this.svgRoot.setAttribute("height", h);
    }

    get draggableDice() {
        return _draggableDice.get(this);
    }

    set draggableDice(d) {
        _draggableDice.set(this, d);
    }

    get holdableDice() {
        return _holdableDice.get(this);
    }

    set holdableDice(h) {
        _holdableDice.set(this, h);
    }

    get holdDuration() {
        return _holdDuration.get(this);
    }

    set holdDuration(t) {
        _holdDuration.set(this, t);
    }

    get background() {
        return _background.get(this);
    }

    set background(b) {
        _background.set(this, b);
        this.svgRoot.style.background = b;
    }

    /**
     * Render dice for this player.
     *
     * @param {module:Die~Die[]} dice - The dice to render in this svg.
     * @param {module:Player~Player} player - The player for which this svg
     * is rendered.
     */
    renderDice({dice, player}) {
        const renderedDice = _renderedDice.get(this);

        // Remove all rendered dice that are not to be rendered again
        for (const die of renderedDice.keys()) {
            if (!dice.includes(die)) {
                const renderedDie = renderedDice.get(die);
                renderedDie.element.parentElement.removeChild(renderedDie.element);
                renderedDice.delete(die);
            }
        }

        this.layout
            .layout(dice)
            .forEach(die => {
                if (!renderedDice.has(die)) {
                    const renderedDie = renderDie(this, {die, player});
                    this.svgRoot.appendChild(renderedDie.element);
                    renderedDice.set(die, renderedDie);
                }

                renderedDice.get(die).render();
            });
    }

};

export {PlayingTableSVG};
