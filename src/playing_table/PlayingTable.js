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
import template from "./dice_svg_template.js";
import {DieSVG} from "./DieSVG.js";
import {ConfigurationError} from "../error/ConfigurationError.js";
import {ViewController} from "../ViewController.js";
import {GridLayout} from "./GridLayout.js";
import {DEFAULT_SYSTEM_PLAYER} from "../Player.js";
import {Die} from "../Die.js";

/**
 * @module
 */

/**
 * @const
 * DIE_SIZE is the width and height of a dice with hold toggle activated.
 *
 * See dice_svg_template.js for the specification of the dice.
 */

const NATURAL_DIE_SIZE = 145; // px
const DEFAULT_DIE_SIZE = NATURAL_DIE_SIZE; // px
const DEFAULT_HOLD_DURATION = 375; // ms
const DEFAULT_BACKGROUND = "#FFFFAA";
const DEFAULT_ROTATE_DICE = true;
const DEFAULT_DRAGGABLE_DICE = true;
const DEFAULT_HOLDABLE_DICE = true;

const ROWS = 10;
const COLS = 10;

const DEFAULT_WIDTH = COLS * DEFAULT_DIE_SIZE; // px
const DEFAULT_HEIGHT = ROWS * DEFAULT_DIE_SIZE; // px
const DEFAULT_DISPERSION = 2;

// Private properties
const _view = new WeakMap();
const _layout = new WeakMap();
const _dice = new WeakMap();
const _svgRoot = new WeakMap();
const _renderedDice = new WeakMap();
const _dragHandler = new WeakMap();
const _dieSize = new WeakMap();
const _holdDuration = new WeakMap();
const _holdableDice = new WeakMap();
const _draggableDice = new WeakMap();
const _background = new WeakMap();

const makeDice = function (dice) {
    if (Number.isInteger(dice)) {
        return (new Array(dice)).fill(null).map(_ => new Die());
    } else if (Array.isArray(dice)) {
        return dice.map((die) => {
            if (Number.isInteger(die)) {
                return new Die({pips: die});
            } else if ("string" === typeof die) {
                return Die.fromUnicode(die);
            } else if (die instanceof Die) {
                return die;
            } else {
                throw new ConfigurationError(`Die specification '${die}' cannot be interpreted as a die.`);
            }
        });
    } else {
        throw new ConfigurationError(`Dice specification '${dice}' cannot be interpreted as dice or number of dice`);
    }
};

// Interaction states
const NONE = Symbol("no_interaction");
const INDETERMINED = Symbol("indetermined");
const DRAGGING = Symbol("dragging");

// Methods to handle interaction

let offset = {};
const startDragging = (playingTable, event, dieElement) => {
    let point = playingTable.svgRoot.createSVGPoint();
    point.x = event.clientX - document.body.scrollLeft;
    point.y = event.clientY - document.body.scrollTop;
    point = point.matrixTransform(dieElement.getScreenCTM().inverse());

    offset = {
        x: point.x,
        y: point.y
    };

    const transform = dieElement.ownerSVGElement.createSVGTransform();
    const transformList = dieElement.transform.baseVal;

    _dragHandler.set(playingTable, (event) => {
        // Move dieElement to the top of the SVG so it moves over the other dice
        // rather than below them. 
        playingTable.svgRoot.removeChild(dieElement);
        playingTable.svgRoot.appendChild(dieElement);

        // Get a point in svgport coordinates
        point = playingTable.svgRoot.createSVGPoint();
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

    playingTable.svgRoot.addEventListener("mousemove", _dragHandler.get(playingTable));
};

const stopDragging = (playingTable) => {
    playingTable.svgRoot.removeEventListener("mousemove", _dragHandler.get(playingTable));
};

const renderDie = (playingTable, {die, player}) => {
    const dieSVG = new DieSVG(die);

    // Setup interaction
    let state = NONE;
    let origin = {};
    let holdTimeout = null;

    const holdDie = () => {
        switch (state) {
        case INDETERMINED: {
            if (playingTable.holdableDice) {
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
        holdTimeout = window.setTimeout(holdDie, playingTable.holdDuration);
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
            if (playingTable.draggableDice && minDelta < dx || minDelta < dy) {
                event.stopPropagation();
                state = DRAGGING;
                dieSVG.element.setAttribute("cursor", "grabbing");
                startDragging(playingTable, event, dieSVG.element, die);
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
            const snapToCoords = _layout.get(playingTable).snapTo({
                die,
                x: x - dx,
                y: y - dy,
            });

            const newCoords = null != snapToCoords ? snapToCoords : {x, y};

            die.coordinates = newCoords;
            const scale = playingTable.dieSize / NATURAL_DIE_SIZE;
            dieSVG.element.setAttribute("transform", `translate(${newCoords.x},${newCoords.y})scale(${scale})`);

            stopDragging(playingTable);
            break;
        }
        default: // ignore other states
        }
        state = NONE;
    };

    dieSVG.element.addEventListener("mousedown", startInteraction);
    dieSVG.element.addEventListener("touchstart", startInteraction);

    if (playingTable.draggableDice) {
        dieSVG.element.addEventListener("mousemove", move);
        dieSVG.element.addEventListener("touchmove", move);
    }

    if (playingTable.draggableDice || playingTable.holdableDice) {
        dieSVG.element.addEventListener("mouseover", showInteraction);
        dieSVG.element.addEventListener("mouseout", hideInteraction);
    }

    dieSVG.element.addEventListener("mouseup", stopInteraction);
    dieSVG.element.addEventListener("touchend", stopInteraction);

    return dieSVG;
};

// Apparently, SVG definitions in a shadow DOM do not work (see
// https://github.com/w3c/webcomponents/issues/179). As a workaround, the SVG
// with the dice definitions is put on the BODY. As this SVG with definitions
// only contains definitions, nothing is shown on the screen. However, to make
// sure, it is hidden anyway.
const setupDiceSVG = () => {
    if (null === document.querySelector("svg.twenty-one-pips-dice")) {
        const parser = new window.DOMParser(); // Explicitly specified "window.DOMParser" to allow testing with jsdom
        const svgDocument = parser.parseFromString(template, "image/svg+xml");
        const diceSVG = document.body.appendChild(document.importNode(svgDocument.documentElement, true));
        diceSVG.style.display = "none";
    }
}

/**
 * PlayingTable is a component to render and control a playing table with dice
 * thrown upon it.
 *
 * @extends module:ViewController~ViewController
 */
const PlayingTable = class extends ViewController {

    static get observedAttributes() {
        return [
            "width",
            "height",
            "background",
            "die-size",
            "rotate-dice",
            "draggable-dice",
            "holdable-dice",
            "hold-duration",
            "dispersion",
            "dice"
        ]; 
    }

    /**
     * Create a new PlayingTable component.
     *
     */
    constructor() {
        super();
        setupDiceSVG();
        this.shadow.appendChild(document.createElementNS(SVGNS, "svg"));
        _dice.set(this, []);
        _renderedDice.set(this, new Map());
        _layout.set(this, new GridLayout({
            width: this.width,
            height: this.height,
            dieSize: this.dieSize,
            rotate: this.rotateDice,
            dispersion: this.dispersion
        }));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "dice": {
                const parsedNumber = parseInt(newValue, 10);
                if (newValue.includes(",")) {
                    this.dice = newValue.split(",").map(n => parseInt(n, 10));
                } else if (Number.isInteger(parsedNumber)) {
                    this.dice = parsedNumber;
                }
                break;
            }
            case "die-size": {
                _layout.get(this).dieSize = newValue;
                DieSVG.size = newValue;
                break;
            }
            case "width": {
                _layout.get(this).width = newValue;
                this.svgRoot.setAttribute("width", newValue);
                break;
            }
            case "height": {
                _layout.get(this).height = newValue;
                this.svgRoot.setAttribute("height", newValue);
                break;
            }
            case "dispersion": {
                _layout.get(this).dispersion = newValue;
                break;
            }
            case "rotate-dice": {
                _layout.get(this).rotate = newValue;
                break;
            }
            case "background": {
                this.svgRoot.style.background = newValue;
                break;
            }
        }
    }
    
    get svgRoot() {
        return this.shadow.querySelector("svg");
    }

    /**
     * The dice on this PlayingTable. Note, to actually throw the dice use
     * @see{throwDice}. 
     *
     * @type {module:Die~Die[]}
     */
    get dice() {
        return _dice.get(this);
    }
    set dice(dice) {
        // TODO: Complain if |dice| > this.maximumNumberOfDice
        _dice.set(this, makeDice(dice));
    }

    /**
     * The maximum number of dice that can be put on this PlayingTable.
     *
     * @return {Number} The maximum number of dice, 0 < maximum.
     */
    get maximumNumberOfDice() {
        return _layout.get(this).maximumNumberOfDice;
    }

    /**
     * The width of this PlayingTable.
     *
     * @type {Number}
     */
    get width() {
        return this.hasAttribute("width") ? this.getAttribute("width") : DEFAULT_WIDTH;
    }

    /**
     * The height of this PlayingTable.
     * @type {Number}
     */
    get height() {
        return this.hasAttribute("height") ? this.getAttribute("height") : DEFAULT_HEIGHT;
    }

    /**
     * The dispersion level of this PlayingTable.
     * @type {Number}
     */
    get dispersion() {
        return this.hasAttribute("dispersion") ? this.getAttribute("dispersion") : DEFAULT_DISPERSION;
    }

    /**
     * The background color of this PlayingTable.
     * @type {String}
     */
    get background() {
        return this.hasAttribute("background") ? this.getAttribute("background") : DEFAULT_BACKGROUND;
    }

    /**
     * The size of dice on this PlayingTable.
     *
     * @type {Number}
     */
    get dieSize() {
        return this.hasAttribute("die-size") ? this.getAttribute("die-size") : DEFAULT_DIE_SIZE;
    }

    /**
     * Should dice be rotated on this PlayingTable?
     * @type {Boolean}
     */
    get rotateDice() {
        return this.hasAttribute("rotate-dice") ? this.getAttribute("rotate-dice") : DEFAULT_ROTATE_DICE;
    }

    /**
     * Can dice on this PlayingTable be dragged?
     * @type {Boolean}
     */
    get draggableDice() {
        return this.hasAttribute("draggable-dice") ? this.getAttribute("draggable-dice") : DEFAULT_DRAGGABLE_DICE;
    }

    /**
     * Can dice on this PlayingTable be held by a Player?
     * @type {Boolean}
     */
    get holdableDice() {
        return this.hasAttribute("holdable-dice") ? this.getAttribute("holdable-dice") : DEFAULT_HOLDABLE_DICE;
    }

    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */
    get holdDuration() {
        return this.hasAttribute("hold-duration") ? this.getAttribute("hold-duration") : DEFAULT_HOLD_DURATION;
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

        _layout.get(this)
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

    /**
     * Throw the dice on this PlayingTable.
     *
     * @param {Object} config - the throw configuration.
     * @param {module:Player~Player} [config.player = DEFAULT_SYSTEM_PLAYER] - The throwing
     * player. Dice are always thrown by a
     * Player. If your application does not need Players, the
     * DEFAULT_SYSTEM_PLAYER is used as a Player.
     * @param {module:Die~Die[]|Number|null} [dice = null] - The dice to
     * throw. By default, the dice already on the PlayingTable are thrown.
     * However, as a shorthand you can specify the dice to throw.
     *
     * @return {module:Die~Die[]} The list with thrown dice.
     */
    throwDice({
        dice = null,
        player = DEFAULT_SYSTEM_PLAYER,
    } = {}) {
        if (null !== dice) {
            this.dice = dice;
        }
        this.dice.forEach(die => die.throwIt());
        this.renderDice({dice: this.dice, player});
        return this.dice;
    }

    /**
     * Place the dice on this PlayingTable. Temporary method used for
     * debugging. Might be moved in a sub class of PlayingTable later on for
     * explanatory purposes where putting a dice on a table makes sense.
     *
     * @param {Object} config - the throw configuration.
     * @param {module:Player~Player} [config.player = DEFAULT_SYSTEM_PLAYER] - The throwing
     * player. Dice are always thrown by a
     * Player. If your application does not need Players, the
     * DEFAULT_SYSTEM_PLAYER is used as a Player.
     * @param {module:Die~Die[]|Number|null} [dice = null] - The dice to
     * throw. By default, the dice already on the PlayingTable are thrown.
     * However, as a shorthand you can specify the dice to throw.
     *
     * @return {module:Die~Die[]} The list with thrown dice.
     * @private
     */
    placeDice({
        dice = null,
        player = DEFAULT_SYSTEM_PLAYER,
    } = {}) {
        if (null !== dice) {
            this.dice = dice;
        }
        this.renderDice({dice: this.dice, player});
        return this.dice;
    }

};

// Register PlayingTable as a custom element.
customElements.define("top-playing-table", PlayingTable, {extends: "div"});

export {
    PlayingTable,
    NATURAL_DIE_SIZE,
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION,
    DEFAULT_ROTATE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DEFAULT_DRAGGABLE_DICE
};
