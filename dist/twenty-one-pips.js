"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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
 * ConfigurationError
 *
 * @extends Error
 */
var ConfigurationError =
/*#__PURE__*/
function (_Error) {
  _inherits(ConfigurationError, _Error);

  /**
   * Create a new ConfigurationError with message.
   *
   * @param {String} message - The message associated with this
   * ConfigurationError.
   */
  function ConfigurationError(message) {
    _classCallCheck(this, ConfigurationError);

    return _possibleConstructorReturn(this, _getPrototypeOf(ConfigurationError).call(this, message));
  }

  return ConfigurationError;
}(_wrapNativeSuper(Error));
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


var FULL_CIRCLE_IN_DEGREES = 360;

var randomizeCenter = function randomizeCenter(n) {
  return (0.5 <= Math.random() ? Math.floor : Math.ceil).call(0, n);
}; // Private fields


var _width = new WeakMap();

var _height = new WeakMap();

var _cols = new WeakMap();

var _rows = new WeakMap();

var _dice = new WeakMap();

var _dieSize = new WeakMap();

var _dispersion = new WeakMap();

var _rotate = new WeakMap();
/**
 * @typedef {Object} GridLayoutConfiguration
 * @property {Number} config.width - The minimal width of this
 * GridLayout in pixels.;
 * @property {Number} config.height] - The minimal height of
 * this GridLayout in pixels..
 * @property {Number} config.dispersion - The distance from the center of the
 * layout a die can be layout.
 * @property {Number} config.dieSize - The size of a die.
 */

/**
 * GridLayout handles laying out the dice on a DiceBoard.
 */


var GridLayout =
/*#__PURE__*/
function () {
  /**
   * Create a new GridLayout.
   *
   * @param {GridLayoutConfiguration} config - The configuration of the GridLayout
   */
  function GridLayout() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        width = _ref.width,
        height = _ref.height,
        dispersion = _ref.dispersion,
        dieSize = _ref.dieSize;

    _classCallCheck(this, GridLayout);

    _dice.set(this, []);

    _dieSize.set(this, 1);

    _width.set(this, 0);

    _height.set(this, 0);

    _rotate.set(this, true);

    this.dispersion = dispersion;
    this.dieSize = dieSize;
    this.width = width;
    this.height = height;
  }
  /**
   * The width in pixels used by this GridLayout.
   * @throws module:error/ConfigurationError.ConfigurationError Width >= 0
   * @type {Number} 
   */


  _createClass(GridLayout, [{
    key: "layout",

    /**
     * Layout dice on this GridLayout.
     *
     * @param {module:Die~Die[]} dice - The dice to layout on this Layout.
     * @return {module:Die~Die[]} The same list of dice, but now layout.
     *
     * @throws {module:error/ConfigurationError~ConfigurationError} The number of
     * dice should not exceed the maximum number of dice this Layout can
     * layout.
     */
    value: function layout(dice) {
      if (dice.length > this.maximumNumberOfDice) {
        throw new ConfigurationError("The number of dice that can be layout is ".concat(this.maximumNumberOfDice, ", got ").concat(dice.lenght, " dice instead."));
      }

      var alreadyLayoutDice = [];
      var diceToLayout = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = dice[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var die = _step.value;

          if (die.hasCoordinates() && die.isHeld()) {
            // Dice that are being held and have been layout before should
            // keep their current coordinates and rotation. In other words,
            // these dice are skipped.
            alreadyLayoutDice.push(die);
          } else {
            diceToLayout.push(die);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var max = Math.min(dice.length * this.dispersion, this.maximumNumberOfDice);

      var availableCells = this._computeAvailableCells(max, alreadyLayoutDice);

      for (var _i = 0; _i < diceToLayout.length; _i++) {
        var _die = diceToLayout[_i];
        var randomIndex = Math.floor(Math.random() * availableCells.length);
        var randomCell = availableCells[randomIndex];
        availableCells.splice(randomIndex, 1);
        _die.coordinates = this._numberToCoordinates(randomCell);
        _die.rotation = this.rotate ? Math.round(Math.random() * FULL_CIRCLE_IN_DEGREES) : null;
        alreadyLayoutDice.push(_die);
      }

      _dice.set(this, alreadyLayoutDice);

      return alreadyLayoutDice;
    }
    /**
     * Compute a list with available cells to place dice on.
     *
     * @param {Number} max - The number empty cells to compute.
     * @param {Die[]} alreadyLayoutDice - A list with dice that have already been layout.
     * 
     * @return {NUmber[]} The list of available cells represented by their number.
     * @private
     */

  }, {
    key: "_computeAvailableCells",
    value: function _computeAvailableCells(max, alreadyLayoutDice) {
      var available = new Set();
      var level = 0;
      var maxLevel = Math.min(this._rows, this._cols);

      while (available.size < max && level < maxLevel) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this._cellsOnLevel(level)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var cell = _step2.value;

            if (undefined !== cell && this._cellIsEmpty(cell, alreadyLayoutDice)) {
              available.add(cell);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        level++;
      }

      return Array.from(available);
    }
    /**
     * Calculate all cells on level from the center of the layout.
     *
     * @param {Number} level - The level from the center of the layout. 0
     * indicates the center.
     *
     * @return {Set<Number>} the cells on the level in this layout represented by
     * their number.
     * @private
     */

  }, {
    key: "_cellsOnLevel",
    value: function _cellsOnLevel(level) {
      var cells = new Set();
      var center = this._center;

      if (0 === level) {
        cells.add(this._cellToNumber(center));
      } else {
        for (var row = center.row - level; row <= center.row + level; row++) {
          cells.add(this._cellToNumber({
            row: row,
            col: center.col - level
          }));
          cells.add(this._cellToNumber({
            row: row,
            col: center.col + level
          }));
        }

        for (var col = center.col - level + 1; col < center.col + level; col++) {
          cells.add(this._cellToNumber({
            row: center.row - level,
            col: col
          }));
          cells.add(this._cellToNumber({
            row: center.row + level,
            col: col
          }));
        }
      }

      return cells;
    }
    /**
     * Does cell contain a cell from alreadyLayoutDice?
     *
     * @param {Number} cell - A cell in layout represented by a number.
     * @param {Die[]} alreadyLayoutDice - A list of dice that have already been layout.
     *
     * @return {Boolean} True if cell does not contain a die.
     * @private
     */

  }, {
    key: "_cellIsEmpty",
    value: function _cellIsEmpty(cell, alreadyLayoutDice) {
      var _this = this;

      return undefined === alreadyLayoutDice.find(function (die) {
        return cell === _this._coordinatesToNumber(die.coordinates);
      });
    }
    /**
     * Convert a number to a cell (row, col)
     *
     * @param {Number} n - The number representing a cell
     * @returns {Object} Return the cell ({row, col}) corresponding n.
     * @private
     */

  }, {
    key: "_numberToCell",
    value: function _numberToCell(n) {
      return {
        row: Math.trunc(n / this._cols),
        col: n % this._cols
      };
    }
    /**
     * Convert a cell to a number
     *
     * @param {Object} cell - The cell to convert to its number.
     * @return {Number|undefined} The number corresponding to the cell.
     * Returns undefined when the cell is not on the layout
     * @private
     */

  }, {
    key: "_cellToNumber",
    value: function _cellToNumber(_ref2) {
      var row = _ref2.row,
          col = _ref2.col;

      if (0 <= row && row < this._rows && 0 <= col && col < this._cols) {
        return row * this._cols + col;
      }

      return undefined;
    }
    /**
     * Convert a cell represented by its number to their coordinates.
     *
     * @param {Number} n - The number representing a cell
     *
     * @return {Object} The coordinates corresponding to the cell represented by
     * this number.
     * @private
     */

  }, {
    key: "_numberToCoordinates",
    value: function _numberToCoordinates(n) {
      return this._cellToCoords(this._numberToCell(n));
    }
    /**
     * Convert a pair of coordinates to a number.
     *
     * @param {Object} coords - The coordinates to convert
     *
     * @return {Number|undefined} The coordinates converted to a number. If
     * the coordinates are not on this layout, the number is undefined.
     * @private
     */

  }, {
    key: "_coordinatesToNumber",
    value: function _coordinatesToNumber(coords) {
      var n = this._cellToNumber(this._coordsToCell(coords));

      if (0 <= n && n < this.maximumNumberOfDice) {
        return n;
      }

      return undefined;
    }
    /**
     * Snap (x,y) to the closest cell in this Layout.
     *
     * @param {Object} diecoordinate - The coordinate to find the closest cell
     * for.
     * @param {Die} [diecoordinat.die = null] - The die to snap to.
     * @param {Number} diecoordinate.x - The x-coordinate.
     * @param {Number} diecoordinate.y - The y-coordinate.
     *
     * @return {Object|null} The coordinate of the cell closest to (x, y).
     * Null when no suitable cell is near (x, y)
     */

  }, {
    key: "snapTo",
    value: function snapTo(_ref3) {
      var _this2 = this;

      var _ref3$die = _ref3.die,
          die = _ref3$die === void 0 ? null : _ref3$die,
          x = _ref3.x,
          y = _ref3.y;
      var cornerCell = {
        row: Math.trunc(y / this.dieSize),
        col: Math.trunc(x / this.dieSize)
      };

      var corner = this._cellToCoords(cornerCell);

      var widthIn = corner.x + this.dieSize - x;
      var widthOut = this.dieSize - widthIn;
      var heightIn = corner.y + this.dieSize - y;
      var heightOut = this.dieSize - heightIn;
      var quadrants = [{
        q: this._cellToNumber(cornerCell),
        coverage: widthIn * heightIn
      }, {
        q: this._cellToNumber({
          row: cornerCell.row,
          col: cornerCell.col + 1
        }),
        coverage: widthOut * heightIn
      }, {
        q: this._cellToNumber({
          row: cornerCell.row + 1,
          col: cornerCell.col
        }),
        coverage: widthIn * heightOut
      }, {
        q: this._cellToNumber({
          row: cornerCell.row + 1,
          col: cornerCell.col + 1
        }),
        coverage: widthOut * heightOut
      }];
      var snapTo = quadrants // cell should be on the layout
      .filter(function (quadrant) {
        return undefined !== quadrant.q;
      }) // cell should be not already taken except by itself
      .filter(function (quadrant) {
        return null !== die && _this2._coordinatesToNumber(die.coordinates) === quadrant.q || _this2._cellIsEmpty(quadrant.q, _dice.get(_this2));
      }) // cell should be covered by the die the most
      .reduce(function (maxQ, quadrant) {
        return quadrant.coverage > maxQ.coverage ? quadrant : maxQ;
      }, {
        q: undefined,
        coverage: -1
      });
      return undefined !== snapTo.q ? this._numberToCoordinates(snapTo.q) : null;
    }
    /**
     * Get the die at point (x, y);
     *
     * @param {Point} point - The point in (x, y) coordinates
     * @return {Die|null} The die under coordinates (x, y) or null if no die
     * is at the point.
     */

  }, {
    key: "getAt",
    value: function getAt() {
      var point = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        x: 0,
        y: 0
      };
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = _dice.get(this)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var die = _step3.value;
          var _die$coordinates = die.coordinates,
              x = _die$coordinates.x,
              y = _die$coordinates.y;
          var xFit = x <= point.x && point.x <= x + this.dieSize;
          var yFit = y <= point.y && point.y <= y + this.dieSize;

          if (xFit && yFit) {
            return die;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return null;
    }
    /**
     * Calculate the grid size given width and height.
     *
     * @param {Number} width - The minimal width
     * @param {Number} height - The minimal height
     *
     * @private
     */

  }, {
    key: "_calculateGrid",
    value: function _calculateGrid(width, height) {
      _cols.set(this, Math.floor(width / this.dieSize));

      _rows.set(this, Math.floor(height / this.dieSize));
    }
    /**
     * Convert a (row, col) cell to (x, y) coordinates.
     *
     * @param {Object} cell - The cell to convert to coordinates
     * @return {Object} The corresponding coordinates.
     * @private
     */

  }, {
    key: "_cellToCoords",
    value: function _cellToCoords(_ref4) {
      var row = _ref4.row,
          col = _ref4.col;
      return {
        x: col * this.dieSize,
        y: row * this.dieSize
      };
    }
    /**
     * Convert (x, y) coordinates to a (row, col) cell.
     *
     * @param {Object} coordinates - The coordinates to convert to a cell.
     * @return {Object} The corresponding cell
     * @private
     */

  }, {
    key: "_coordsToCell",
    value: function _coordsToCell(_ref5) {
      var x = _ref5.x,
          y = _ref5.y;
      return {
        row: Math.trunc(y / this.dieSize),
        col: Math.trunc(x / this.dieSize)
      };
    }
  }, {
    key: "width",
    get: function get() {
      return _width.get(this);
    },
    set: function set(w) {
      if (0 > w) {
        throw new ConfigurationError("Width should be a number larger than 0, got '".concat(w, "' instead."));
      }

      _width.set(this, w);

      this._calculateGrid(this.width, this.height);
    }
    /**
     * The height in pixels used by this GridLayout. 
     * @throws module:error/ConfigurationError.ConfigurationError Height >= 0
     *
     * @type {Number}
     */

  }, {
    key: "height",
    get: function get() {
      return _height.get(this);
    },
    set: function set(h) {
      if (0 > h) {
        throw new ConfigurationError("Height should be a number larger than 0, got '".concat(h, "' instead."));
      }

      _height.set(this, h);

      this._calculateGrid(this.width, this.height);
    }
    /**
     * The maximum number of dice that can be layout on this GridLayout. This
     * number is >= 0. Read only.
     *
     * @type {Number}
     */

  }, {
    key: "maximumNumberOfDice",
    get: function get() {
      return this._cols * this._rows;
    }
    /**
     * The dispersion level used by this GridLayout. The dispersion level
     * indicates the distance from the center dice can be layout. Use 1 for a
     * tight packed layout.
     *
     * @throws module:error/ConfigurationError.ConfigurationError Dispersion >= 0
     * @type {Number}
     */

  }, {
    key: "dispersion",
    get: function get() {
      return _dispersion.get(this);
    },
    set: function set(d) {
      if (0 > d) {
        throw new ConfigurationError("Dispersion should be a number larger than 0, got '".concat(d, "' instead."));
      }

      return _dispersion.set(this, d);
    }
    /**
     * The size of a die.
     *
     * @throws module:error/ConfigurationError.ConfigurationError DieSize >= 0
     * @type {Number}
     */

  }, {
    key: "dieSize",
    get: function get() {
      return _dieSize.get(this);
    },
    set: function set(ds) {
      if (0 >= ds) {
        throw new ConfigurationError("dieSize should be a number larger than 1, got '".concat(ds, "' instead."));
      }

      _dieSize.set(this, ds);

      this._calculateGrid(this.width, this.height);
    }
  }, {
    key: "rotate",
    get: function get() {
      var r = _rotate.get(this);

      return undefined === r ? true : r;
    },
    set: function set(r) {
      _rotate.set(this, r);
    }
    /**
     * The number of rows in this GridLayout.
     *
     * @return {Number} The number of rows, 0 < rows.
     * @private
     */

  }, {
    key: "_rows",
    get: function get() {
      return _rows.get(this);
    }
    /**
     * The number of columns in this GridLayout.
     *
     * @return {Number} The number of columns, 0 < columns.
     * @private
     */

  }, {
    key: "_cols",
    get: function get() {
      return _cols.get(this);
    }
    /**
     * The center cell in this GridLayout.
     *
     * @return {Object} The center (row, col).
     * @private
     */

  }, {
    key: "_center",
    get: function get() {
      var row = randomizeCenter(this._rows / 2) - 1;
      var col = randomizeCenter(this._cols / 2) - 1;
      return {
        row: row,
        col: col
      };
    }
  }]);

  return GridLayout;
}();
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
 * TopPlayerHTMLElement -- A Player of a dice game.
 *
 * A Player's name and color should be unique in a game. Two different Player
 * instances with the same name and same color are considered the same Player.
 *
 */


var TopPlayerHTMLElement =
/*#__PURE__*/
function (_HTMLElement) {
  _inherits(TopPlayerHTMLElement, _HTMLElement);

  function TopPlayerHTMLElement() {
    _classCallCheck(this, TopPlayerHTMLElement);

    return _possibleConstructorReturn(this, _getPrototypeOf(TopPlayerHTMLElement).call(this));
  }

  _createClass(TopPlayerHTMLElement, [{
    key: "attributeChangedCallback",
    value: function attributeChangedCallback(name, oldValue, newValue) {}
  }, {
    key: "connectedCallback",
    value: function connectedCallback() {
      if ("string" !== typeof this.name || "" === this.name) {
        throw new ConfigurationError("A Player needs a name, which is a String.");
      }

      if ("string" !== typeof this.color || "" === this.color) {
        throw new ConfigurationError("A Player needs a color, which is a String.");
      }
    }
  }, {
    key: "disconnectedCallback",
    value: function disconnectedCallback() {}
    /**
     * This Player's name.
     *
     * @return {String} This Player's name.
     */

  }, {
    key: "toString",
    value: function toString() {
      return "".concat(this.name);
    }
    /**
     * Is this Player equat another player?
     * 
     * @param {Player} other - The other Player to compare this Player with.
     * @return {Boolean} True when either the object references are the same
     * or when both name and color are the same.
     */

  }, {
    key: "equals",
    value: function equals(other) {
      var name = "string" === typeof other ? other : other.name;
      return other === this || name === this.name;
    }
  }, {
    key: "name",
    get: function get() {
      return this.getAttribute("name");
    }
    /**
     * This Player's color.
     *
     * @return {String} This Player's color.
     */

  }, {
    key: "color",
    get: function get() {
      return this.getAttribute("color");
    }
  }], [{
    key: "observedAttributes",
    get: function get() {
      return [];
    }
  }]);

  return TopPlayerHTMLElement;
}(_wrapNativeSuper(HTMLElement));

window.customElements.define("top-player", TopPlayerHTMLElement);
/**
 * The default system player. Dice are thrown by a player. For situations
 * where you want to render a bunch of dice without needing the concept of Players
 * this DEFAULT_SYSTEM_PLAYER can be a substitute. Of course, if you'd like to
 * change the name and/or the color, create and use your own "system player".
 * @const
 */

var DEFAULT_SYSTEM_PLAYER = new TopPlayerHTMLElement();
DEFAULT_SYSTEM_PLAYER.setAttribute("name", "*");
DEFAULT_SYSTEM_PLAYER.setAttribute("color", "red");
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
//import {ConfigurationError} from "./error/ConfigurationError.js";

/**
 * @module
 */

var DEFAULT_DIE_SIZE = 100; // px

var DEFAULT_HOLD_DURATION = 375; // ms

var DEFAULT_DRAGGING_DICE_DISABLED = false;
var DEFAULT_HOLDING_DICE_DISABLED = false;
var DEFAULT_ROTATING_DICE_DISABLED = false;
var ROWS = 10;
var COLS = 10;
var DEFAULT_WIDTH = COLS * DEFAULT_DIE_SIZE; // px

var DEFAULT_HEIGHT = ROWS * DEFAULT_DIE_SIZE; // px

var DEFAULT_DISPERSION = Math.floor(ROWS / 2);
var MIN_DELTA = 3; //px

var WIDTH_ATTRIBUTE = "width";
var HEIGHT_ATTRIBUTE = "height";
var DISPERSION_ATTRIBUTE = "dispersion";
var DIE_SIZE_ATTRIBUTE = "die-size";
var DRAGGING_DICE_DISABLED_ATTRIBUTE = "dragging-dice-disabled";
var HOLDING_DICE_DISABLED_ATTRIBUTE = "holding-dice-disabled";
var ROTATING_DICE_DISABLED_ATTRIBUTE = "rotating-dice-disabled";
var HOLD_DURATION_ATTRIBUTE = "hold-duration";

var parseNumber = function parseNumber(numberString) {
  var defaultNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var number = parseInt(numberString, 10);
  return Number.isNaN(number) ? defaultNumber : number;
};

var validatePositiveNumber = function validatePositiveNumber(number) {
  var maxNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;
  return 0 <= number && number < maxNumber;
};

var getPositiveNumber = function getPositiveNumber(numberString, defaultValue) {
  var value = parseNumber(numberString, defaultValue);
  return validatePositiveNumber(value) ? value : defaultValue;
};

var getPositiveNumberAttribute = function getPositiveNumberAttribute(element, name, defaultValue) {
  if (element.hasAttribute(name)) {
    var valueString = element.getAttribute(name);
    return getPositiveNumber(valueString, defaultValue);
  }

  return defaultValue;
};

var getBoolean = function getBoolean(booleanString, trueValue, defaultValue) {
  if (trueValue === booleanString || "true" === booleanString) {
    return true;
  } else if ("false" === booleanString) {
    return false;
  } else {
    return defaultValue;
  }
};

var getBooleanAttribute = function getBooleanAttribute(element, name, defaultValue) {
  if (element.hasAttribute(name)) {
    var valueString = element.getAttribute(name);
    return getBoolean(valueString, [valueString, "true"], ["false"], defaultValue);
  }

  return defaultValue;
}; // Private properties


var _canvas = new WeakMap();

var _layout = new WeakMap();

var _currentPlayer = new WeakMap();

var _numberOfReadyDice = new WeakMap();

var getReadyDice = function getReadyDice(board) {
  if (undefined === _numberOfReadyDice.get(board)) {
    _numberOfReadyDice.set(board, 0);
  }

  return _numberOfReadyDice.get(board);
};

var updateReadyDice = function updateReadyDice(board, update) {
  _numberOfReadyDice.set(board, getReadyDice(board) + update);
}; // Interaction states


var NONE = Symbol("no_interaction");
var HOLD = Symbol("hold");
var MOVE = Symbol("move");
var INDETERMINED = Symbol("indetermined");
var DRAGGING = Symbol("dragging"); // Methods to handle interaction

var convertWindowCoordinatesToCanvas = function convertWindowCoordinatesToCanvas(canvas, xWindow, yWindow) {
  var canvasBox = canvas.getBoundingClientRect();
  var x = xWindow - canvasBox.left * (canvas.width / canvasBox.width);
  var y = yWindow - canvasBox.top * (canvas.height / canvasBox.height);
  return {
    x: x,
    y: y
  };
};

var setupInteraction = function setupInteraction(board) {
  var canvas = _canvas.get(board); // Setup interaction


  var origin = {};
  var state = NONE;
  var staticBoard = null;
  var dieUnderCursor = null;
  var holdTimeout = null;

  var holdDie = function holdDie() {
    if (HOLD === state || INDETERMINED === state) {
      // toggle hold / release
      if (dieUnderCursor.isHeld()) {
        dieUnderCursor.releaseIt(board.currentPlayer);
      } else {
        dieUnderCursor.holdIt(board.currentPlayer);
      }

      state = NONE;

      board._update();
    }

    holdTimeout = null;
  };

  var startHolding = function startHolding() {
    holdTimeout = window.setTimeout(holdDie, board.holdDuration);
  };

  var stopHolding = function stopHolding() {
    window.clearTimeout(holdTimeout);
    holdTimeout = null;
  };

  var startInteraction = function startInteraction(event) {
    if (NONE === state) {
      origin = {
        x: event.clientX,
        y: event.clientY
      };
      dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));

      if (null !== dieUnderCursor) {
        // Only interaction with the board via a die
        if (!board.disabledHoldingDice && !board.disabledDraggingDice) {
          state = INDETERMINED;
          startHolding();
        } else if (!board.disabledHoldingDice) {
          state = HOLD;
          startHolding();
        } else if (!board.disabledDraggingDice) {
          state = MOVE;
        }
      }
    }
  };

  var showInteraction = function showInteraction(event) {
    var dieUnderCursor = board.layout.getAt(convertWindowCoordinatesToCanvas(canvas, event.clientX, event.clientY));

    if (DRAGGING === state) {
      canvas.style.cursor = "grabbing";
    } else if (null !== dieUnderCursor) {
      canvas.style.cursor = "grab";
    } else {
      canvas.style.cursor = "default";
    }
  };

  var move = function move(event) {
    if (MOVE === state || INDETERMINED === state) {
      // determine if a die is under the cursor
      // Ignore small movements
      var dx = Math.abs(origin.x - event.clientX);
      var dy = Math.abs(origin.y - event.clientY);

      if (MIN_DELTA < dx || MIN_DELTA < dy) {
        state = DRAGGING;
        stopHolding();
        var diceWithoutDieUnderCursor = board.dice.filter(function (die) {
          return die !== dieUnderCursor;
        });

        board._update(diceWithoutDieUnderCursor);

        staticBoard = board.context.getImageData(0, 0, canvas.width, canvas.height);
      }
    } else if (DRAGGING === state) {
      var _dx = origin.x - event.clientX;

      var _dy = origin.y - event.clientY;

      var _dieUnderCursor$coord = dieUnderCursor.coordinates,
          x = _dieUnderCursor$coord.x,
          y = _dieUnderCursor$coord.y;
      board.context.putImageData(staticBoard, 0, 0);
      dieUnderCursor.render(board.context, board.dieSize, {
        x: x - _dx,
        y: y - _dy
      });
    }
  };

  var stopInteraction = function stopInteraction(event) {
    if (null !== dieUnderCursor && DRAGGING === state) {
      var dx = origin.x - event.clientX;
      var dy = origin.y - event.clientY;
      var _dieUnderCursor$coord2 = dieUnderCursor.coordinates,
          x = _dieUnderCursor$coord2.x,
          y = _dieUnderCursor$coord2.y;
      var snapToCoords = board.layout.snapTo({
        die: dieUnderCursor,
        x: x - dx,
        y: y - dy
      });
      var newCoords = null != snapToCoords ? snapToCoords : {
        x: x,
        y: y
      };
      dieUnderCursor.coordinates = newCoords;
    } // Clear state


    dieUnderCursor = null;
    state = NONE; // Refresh board; Render dice

    board._update();
  }; // Register the actual event listeners defined above. Map touch events to
  // equivalent mouse events. Because the "touchend" event does not have a
  // clientX and clientY, record and use the last ones from the "touchmove"
  // (or "touchstart") events.


  var touchCoordinates = {
    clientX: 0,
    clientY: 0
  };

  var touch2mouseEvent = function touch2mouseEvent(mouseEventName) {
    return function (touchEvent) {
      if (touchEvent && 0 < touchEvent.touches.length) {
        var _touchEvent$touches$ = touchEvent.touches[0],
            clientX = _touchEvent$touches$.clientX,
            clientY = _touchEvent$touches$.clientY;
        touchCoordinates = {
          clientX: clientX,
          clientY: clientY
        };
      }

      canvas.dispatchEvent(new MouseEvent(mouseEventName, touchCoordinates));
    };
  };

  canvas.addEventListener("touchstart", touch2mouseEvent("mousedown"));
  canvas.addEventListener("mousedown", startInteraction);

  if (!board.disabledDraggingDice) {
    canvas.addEventListener("touchmove", touch2mouseEvent("mousemove"));
    canvas.addEventListener("mousemove", move);
  }

  if (!board.disabledDraggingDice || !board.disabledHoldingDice) {
    canvas.addEventListener("mousemove", showInteraction);
  }

  canvas.addEventListener("touchend", touch2mouseEvent("mouseup"));
  canvas.addEventListener("mouseup", stopInteraction);
  canvas.addEventListener("mouseout", stopInteraction);
};
/**
 * TopDiceBoardHTMLElement is the "top-dice-board" custom HTML element.
 *
 */


var TopDiceBoardHTMLElement =
/*#__PURE__*/
function (_HTMLElement2) {
  _inherits(TopDiceBoardHTMLElement, _HTMLElement2);

  /**
   * Create a new TopDiceBoardHTMLElement.
   */
  function TopDiceBoardHTMLElement() {
    var _this3;

    _classCallCheck(this, TopDiceBoardHTMLElement);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(TopDiceBoardHTMLElement).call(this));
    _this3.style.display = "inline-block";

    var shadow = _this3.attachShadow({
      mode: "closed"
    });

    var canvas = document.createElement("canvas");
    shadow.appendChild(canvas);

    _canvas.set(_assertThisInitialized(_assertThisInitialized(_this3)), canvas);

    _currentPlayer.set(_assertThisInitialized(_assertThisInitialized(_this3)), DEFAULT_SYSTEM_PLAYER);

    _layout.set(_assertThisInitialized(_assertThisInitialized(_this3)), new GridLayout({
      width: _this3.width,
      height: _this3.height,
      dieSize: _this3.dieSize,
      dispersion: _this3.dispersion
    }));

    setupInteraction(_assertThisInitialized(_assertThisInitialized(_this3)));
    return _this3;
  }

  _createClass(TopDiceBoardHTMLElement, [{
    key: "attributeChangedCallback",
    value: function attributeChangedCallback(name, oldValue, newValue) {
      var canvas = _canvas.get(this);

      switch (name) {
        case WIDTH_ATTRIBUTE:
          {
            var width = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_WIDTH);
            this.layout.width = width;
            canvas.setAttribute(WIDTH_ATTRIBUTE, width);
            break;
          }

        case HEIGHT_ATTRIBUTE:
          {
            var height = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_HEIGHT);
            this.layout.height = height;
            canvas.setAttribute(HEIGHT_ATTRIBUTE, height);
            break;
          }

        case DISPERSION_ATTRIBUTE:
          {
            var dispersion = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_DISPERSION);
            this.layout.dispersion = dispersion;
            break;
          }

        case DIE_SIZE_ATTRIBUTE:
          {
            var dieSize = getPositiveNumber(newValue, parseNumber(oldValue) || DEFAULT_DIE_SIZE);
            this.layout.dieSize = dieSize;
            break;
          }

        case ROTATING_DICE_DISABLED_ATTRIBUTE:
          {
            var disabledRotation = getBoolean(newValue, ROTATING_DICE_DISABLED_ATTRIBUTE, getBoolean(oldValue, ROTATING_DICE_DISABLED_ATTRIBUTE, DEFAULT_ROTATING_DICE_DISABLED));
            this.layout.rotate = !disabledRotation;
            break;
          }

        default:
      }

      this._update();
    }
  }, {
    key: "connectedCallback",
    value: function connectedCallback() {
      var _this4 = this;

      this.addEventListener("top-die:added", function () {
        updateReadyDice(_this4, 1);

        if (_this4._isReady()) {
          _this4._update(_this4.layout.layout(_this4.dice));
        }
      });
      this.addEventListener("top-die:removed", function () {
        _this4._update(_this4.layout.layout(_this4.dice));

        updateReadyDice(_this4, -1);
      }); // All dice boards do have a player list. If there isn't one yet,
      // create one.

      if (null === this.querySelector("top-player-list")) {
        this.appendChild(document.createElement("top-player-list"));
      }
    }
  }, {
    key: "disconnectedCallback",
    value: function disconnectedCallback() {}
  }, {
    key: "adoptedCallback",
    value: function adoptedCallback() {}
  }, {
    key: "getPlayer",
    value: function getPlayer(playerName) {
      var playerList = this.querySelector("top-player-list");
      return null === playerList ? null : playerList.find(playerName);
    }
  }, {
    key: "throwDice",
    value: function throwDice() {
      var player = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_SYSTEM_PLAYER;
      this.dice.forEach(function (die) {
        return die.throwIt();
      });
      this.currentPlayer = player;

      this._update(this.layout.layout(this.dice));

      return this.dice;
    }
  }, {
    key: "_isReady",
    value: function _isReady() {
      return getReadyDice(this) === this.dice.length;
    }
  }, {
    key: "_update",
    value: function _update() {
      var dice = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.dice;

      if (this._isReady()) {
        this.context.clearRect(0, 0, this.width, this.height);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = dice[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var die = _step4.value;
            die.render(this.context, this.dieSize);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }
    }
  }, {
    key: "context",
    get: function get() {
      return _canvas.get(this).getContext("2d");
    }
    /**
     * The GridLayout used by this DiceBoard to layout the dice.
     *
     * @type {GridLayout}
     */

  }, {
    key: "layout",
    get: function get() {
      return _layout.get(this);
    }
    /**
     * The dice on this board. Note, to actually throw the dice use
     * @see{throwDice}. 
     *
     * @type {module:Die~Die[]}
     */

  }, {
    key: "dice",
    get: function get() {
      return _toConsumableArray(this.getElementsByTagName("top-die"));
    }
    /**
     * The maximum number of dice that can be put on this board.
     *
     * @return {Number} The maximum number of dice, 0 < maximum.
     */

  }, {
    key: "maximumNumberOfDice",
    get: function get() {
      return this.layout.maximumNumberOfDice;
    }
    /**
     * The width of this board.
     *
     * @type {Number}
     */

  }, {
    key: "width",
    get: function get() {
      return getPositiveNumberAttribute(this, WIDTH_ATTRIBUTE, DEFAULT_WIDTH);
    }
    /**
     * The height of this board.
     * @type {Number}
     */

  }, {
    key: "height",
    get: function get() {
      return getPositiveNumberAttribute(this, HEIGHT_ATTRIBUTE, DEFAULT_HEIGHT);
    }
    /**
     * The dispersion level of this board.
     * @type {Number}
     */

  }, {
    key: "dispersion",
    get: function get() {
      return getPositiveNumberAttribute(this, DISPERSION_ATTRIBUTE, DEFAULT_DISPERSION);
    }
    /**
     * The size of dice on this board.
     *
     * @type {Number}
     */

  }, {
    key: "dieSize",
    get: function get() {
      return getPositiveNumberAttribute(this, DIE_SIZE_ATTRIBUTE, DEFAULT_DIE_SIZE);
    }
    /**
     * Can dice on this board be dragged?
     * @type {Boolean}
     */

  }, {
    key: "disabledDraggingDice",
    get: function get() {
      return getBooleanAttribute(this, DRAGGING_DICE_DISABLED_ATTRIBUTE, DEFAULT_DRAGGING_DICE_DISABLED);
    }
    /**
     * Can dice on this board be held by a Player?
     * @type {Boolean}
     */

  }, {
    key: "disabledHoldingDice",
    get: function get() {
      return getBooleanAttribute(this, HOLDING_DICE_DISABLED_ATTRIBUTE, DEFAULT_HOLDING_DICE_DISABLED);
    }
    /**
     * Is rotating dice on this board disabled?
     * @type {Boolean}
     */

  }, {
    key: "disabledRotatingDice",
    get: function get() {
      return getBooleanAttribute(this, ROTATING_DICE_DISABLED_ATTRIBUTE, DEFAULT_ROTATING_DICE_DISABLED);
    }
    /**
     * The duration in ms to press the mouse / touch a die before it bekomes
     * held by the Player. It has only an effect when this.holdableDice ===
     * true.
     *
     * @type {Number}
     */

  }, {
    key: "holdDuration",
    get: function get() {
      return getPositiveNumberAttribute(this, HOLD_DURATION_ATTRIBUTE, DEFAULT_HOLD_DURATION);
    }
  }, {
    key: "currentPlayer",
    set: function set(newPlayer) {
      _currentPlayer.set(this, newPlayer);
    },
    get: function get() {
      return _currentPlayer.get(this);
    }
  }], [{
    key: "observedAttributes",
    get: function get() {
      return [WIDTH_ATTRIBUTE, HEIGHT_ATTRIBUTE, DISPERSION_ATTRIBUTE, DIE_SIZE_ATTRIBUTE, DRAGGING_DICE_DISABLED_ATTRIBUTE, ROTATING_DICE_DISABLED_ATTRIBUTE, HOLDING_DICE_DISABLED_ATTRIBUTE, HOLD_DURATION_ATTRIBUTE];
    }
  }]);

  return TopDiceBoardHTMLElement;
}(_wrapNativeSuper(HTMLElement));

window.customElements.define("top-dice-board", TopDiceBoardHTMLElement);
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
//import {ConfigurationError} from "./error/ConfigurationError.js";

/**
 * @module
 */

var NUMBER_OF_PIPS = 6; // Default / regular six sided die has 6 pips maximum.

var DEFAULT_COLOR = "Ivory";
var DEFAULT_X = 0; // px

var DEFAULT_Y = 0; // px

var DEFAULT_ROTATION = 0; // degrees

var DEFAULT_OPACITY = 0.5;
var BASE_DIE_SIZE = 100; // px

var BASE_ROUNDED_CORNER_RADIUS = 15; // px

var BASE_STROKE_WIDTH = 2.5; // px

var MIN_STROKE_WIDTH = 1; // px

var HALF = BASE_DIE_SIZE / 2; // px

var THIRD = BASE_DIE_SIZE / 3; // px

var PIP_SIZE = BASE_DIE_SIZE / 15; //px

var PIP_COLOR = "black";

var deg2rad = function deg2rad(deg) {
  return deg * (Math.PI / 180);
};

var isPipNumber = function isPipNumber(n) {
  var number = parseInt(n, 10);
  return Number.isInteger(number) && 1 <= number && number <= NUMBER_OF_PIPS;
};
/**
 * Generate a random number of pips between 1 and the NUMBER_OF_PIPS.
 *
 * @returns {Number} A random number n, 1 ≤ n ≤ NUMBER_OF_PIPS.
 */


var randomPips = function randomPips() {
  return Math.floor(Math.random() * NUMBER_OF_PIPS) + 1;
};

var DIE_UNICODE_CHARACTERS = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
/**
 * Convert a number of pips, 1 ≤ pips ≤ 6 to a unicode character
 * representation of the corresponding die face. This function is the reverse
 * of unicodeToPips.
 *
 * @param {Number} p - The number of pips to convert to a unicode character.
 * @returns {String|undefined} The corresponding unicode characters or
 * undefined if p was not between 1 and 6 inclusive.
 */

var pipsToUnicode = function pipsToUnicode(p) {
  return isPipNumber(p) ? DIE_UNICODE_CHARACTERS[p - 1] : undefined;
};

var renderHold = function renderHold(context, x, y, width, color) {
  var SEPERATOR = width / 30;
  context.save();
  context.globalAlpha = DEFAULT_OPACITY;
  context.beginPath();
  context.fillStyle = color;
  context.arc(x + width, y + width, width - SEPERATOR, 0, 2 * Math.PI, false);
  context.fill();
  context.restore();
};

var renderDie = function renderDie(context, x, y, width, color) {
  var SCALE = width / HALF;
  var HALF_INNER_SIZE = Math.sqrt(Math.pow(width, 2) / 2);
  var INNER_SIZE = 2 * HALF_INNER_SIZE;
  var ROUNDED_CORNER_RADIUS = BASE_ROUNDED_CORNER_RADIUS * SCALE;
  var INNER_SIZE_ROUNDED = INNER_SIZE - 2 * ROUNDED_CORNER_RADIUS;
  var STROKE_WIDTH = Math.max(MIN_STROKE_WIDTH, BASE_STROKE_WIDTH * SCALE);
  var startX = x + width - HALF_INNER_SIZE + ROUNDED_CORNER_RADIUS;
  var startY = y + width - HALF_INNER_SIZE;
  context.save();
  context.beginPath();
  context.fillStyle = color;
  context.strokeStyle = "black";
  context.lineWidth = STROKE_WIDTH;
  context.moveTo(startX, startY);
  context.lineTo(startX + INNER_SIZE_ROUNDED, startY);
  context.arc(startX + INNER_SIZE_ROUNDED, startY + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(270), deg2rad(0));
  context.lineTo(startX + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS);
  context.arc(startX + INNER_SIZE_ROUNDED, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(0), deg2rad(90));
  context.lineTo(startX, startY + INNER_SIZE);
  context.arc(startX, startY + INNER_SIZE_ROUNDED + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(90), deg2rad(180));
  context.lineTo(startX - ROUNDED_CORNER_RADIUS, startY + ROUNDED_CORNER_RADIUS);
  context.arc(startX, startY + ROUNDED_CORNER_RADIUS, ROUNDED_CORNER_RADIUS, deg2rad(180), deg2rad(270));
  context.stroke();
  context.fill();
  context.restore();
};

var renderPip = function renderPip(context, x, y, width) {
  context.save();
  context.beginPath();
  context.fillStyle = PIP_COLOR;
  context.moveTo(x, y);
  context.arc(x, y, width, 0, 2 * Math.PI, false);
  context.fill();
  context.restore();
};

var _board = new WeakMap();

var _pips = new WeakMap();

var _x = new WeakMap();

var _y = new WeakMap();

var _rotation = new WeakMap();

var _heldBy = new WeakMap();
/**
 * TopDieHTMLElement is the "top-die" custom HTML element representing a die
 * on the dice board.
 */


var TopDieHTMLElement =
/*#__PURE__*/
function (_HTMLElement3) {
  _inherits(TopDieHTMLElement, _HTMLElement3);

  function TopDieHTMLElement() {
    var _this5;

    _classCallCheck(this, TopDieHTMLElement);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(TopDieHTMLElement).call(this));

    _pips.set(_assertThisInitialized(_assertThisInitialized(_this5)), 0);

    _x.set(_assertThisInitialized(_assertThisInitialized(_this5)), 0);

    _y.set(_assertThisInitialized(_assertThisInitialized(_this5)), 0);

    _rotation.set(_assertThisInitialized(_assertThisInitialized(_this5)), 0);

    _heldBy.set(_assertThisInitialized(_assertThisInitialized(_this5)), null);

    return _this5;
  }

  _createClass(TopDieHTMLElement, [{
    key: "attributeChangedCallback",
    value: function attributeChangedCallback(name, oldValue, newValue) {}
  }, {
    key: "connectedCallback",
    value: function connectedCallback() {
      _board.set(this, this.parentNode); // Ensure every die has a pips, 1 <= pips <= 6


      var pips = NaN;

      if (this.hasAttribute("pips")) {
        pips = parseInt(this.getAttribute("pips"), 10);
      }

      if (Number.isNaN(pips) || 1 > pips || 6 < pips) {
        pips = randomPips();
        this.setAttribute("pips", pips);
      }

      _pips.set(this, pips);

      _board.get(this).dispatchEvent(new Event("top-die:added"));
    }
  }, {
    key: "disconnectedCallback",
    value: function disconnectedCallback() {
      _board.get(this).dispatchEvent(new Event("top-die:removed"));
    }
    /**
     * Convert this Die to the corresponding unicode character of a die face.
     *
     * @return {String} The unicode character corresponding to the number of
     * pips of this Die.
     */

  }, {
    key: "toUnicode",
    value: function toUnicode() {
      return pipsToUnicode(this.pips);
    }
    /**
     * This Die's number of pips, 1 ≤ pips ≤ 6.
     *
     * @type {Number}
     */

  }, {
    key: "hasCoordinates",

    /**
     * Does this Die have coordinates?
     *
     * @return {Boolean} True when the Die does have coordinates
     */
    value: function hasCoordinates() {
      return null !== this.coordinates;
    }
  }, {
    key: "throwIt",

    /**
     * Throw this Die. The number of pips to a random number n, 1 ≤ n ≤ 6.
     * Only dice that are not being held can be thrown.
     *
     * @fires "top:throw-die" with parameters this Die.
     */
    value: function throwIt() {
      if (!this.isHeld()) {
        this.setAttribute("pips", randomPips());
        this.dispatchEvent(new CustomEvent("top:throw-die", {
          detail: {
            die: this
          }
        }));
      }
    }
    /**
     * The player holds this Die. A player can only hold a die that is not
     * being held by another player yet.
     *
     * @param {module:Player~Player} player - The player who wants to hold this Die.
     * @fires "top:hold-die" with parameters this Die and the player.
     */

  }, {
    key: "holdIt",
    value: function holdIt(player) {
      if (!this.isHeld()) {
        this.heldBy = player;
        this.dispatchEvent(new CustomEvent("top:hold-die", {
          detail: {
            die: this,
            player: player
          }
        }));
      }
    }
    /**
     * Is this Die being held by any player?
     *
     * @return {Boolean} True when this Die is being held by any player, false otherwise.
     */

  }, {
    key: "isHeld",
    value: function isHeld() {
      return this.hasAttribute("held-by");
    }
    /**
     * The player releases this Die. A player can only release dice that she is
     * holding.
     *
     * @param {module:Player~Player} player - The player who wants to release this Die.
     * @fires "top:relase-die" with parameters this Die and the player releasing it.
     */

  }, {
    key: "releaseIt",
    value: function releaseIt(player) {
      if (this.isHeld() && this.heldBy.equals(player)) {
        this.heldBy = null;
        this.dispatchEvent(new CustomEvent("top:release-die", {
          detail: {
            die: this,
            player: player
          }
        }));
      }
    }
  }, {
    key: "render",
    value: function render(context, dieSize) {
      var coordinates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.coordinates;
      var scale = dieSize / BASE_DIE_SIZE;
      var SHALF = HALF * scale;
      var STHIRD = THIRD * scale;
      var SPIP_SIZE = PIP_SIZE * scale;
      var x = coordinates.x,
          y = coordinates.y;

      if (this.isHeld()) {
        renderHold(context, x, y, SHALF, this.heldBy.color);
      }

      if (0 !== this.rotation) {
        context.translate(x + SHALF, y + SHALF);
        context.rotate(deg2rad(this.rotation));
        context.translate(-1 * (x + SHALF), -1 * (y + SHALF));
      }

      renderDie(context, x, y, SHALF, this.color);

      switch (this.pips) {
        case 1:
          {
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            break;
          }

        case 2:
          {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            break;
          }

        case 3:
          {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            break;
          }

        case 4:
          {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            break;
          }

        case 5:
          {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + SHALF, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            break;
          }

        case 6:
          {
            renderPip(context, x + STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + STHIRD, y + SHALF, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + 2 * STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + STHIRD, SPIP_SIZE);
            renderPip(context, x + 2 * STHIRD, y + SHALF, SPIP_SIZE);
            break;
          }

        default: // No other values allowed / possible

      } // Clear context


      context.setTransform(1, 0, 0, 1, 0, 0);
    }
  }, {
    key: "pips",
    get: function get() {
      return parseInt(this.getAttribute("pips"), 10);
    }
    /**
     * This Die's color.
     *
     * @type {String}
     */

  }, {
    key: "color",
    get: function get() {
      return this.hasAttribute("color") ? this.getAttribute("color") : DEFAULT_COLOR;
    }
    /**
     * The Player that is holding this Die, if any. Null otherwise.
     *
     * @type {Player|null} 
     */

  }, {
    key: "heldBy",
    get: function get() {
      var playerName = this.hasAttribute("held-by") ? this.getAttribute("held-by") : null;
      return _board.get(this).getPlayer(playerName);
    },
    set: function set(player) {
      if (null === player) {
        this.removeAttribute("held-by");
      } else {
        this.setAttribute("held-by", player.toString());
      }
    }
    /**
     * The coordinates of this Die.
     *
     * @type {Coordinates|null}
     */

  }, {
    key: "coordinates",
    get: function get() {
      return null === this.x || null === this.y ? null : {
        x: this.x,
        y: this.y
      };
    },
    set: function set(c) {
      if (null === c) {
        this.x = null;
        this.y = null;
      } else {
        var x = c.x,
            y = c.y;
        this.x = x;
        this.y = y;
      }
    }
  }, {
    key: "x",
    get: function get() {
      return this.hasAttribute("x") ? parseInt(this.getAttribute("x"), 10) : DEFAULT_X;
    },
    set: function set(newX) {
      this.setAttribute("x", newX);
    }
  }, {
    key: "y",
    get: function get() {
      return this.hasAttribute("y") ? parseInt(this.getAttribute("y"), 10) : DEFAULT_Y;
    },
    set: function set(newY) {
      this.setAttribute("y", newY);
    }
    /**
     * The rotation of this Die.
     *
     * @type {Number} The rotation of this Die, 0 ≤ rotation ≤ 360.
     */

  }, {
    key: "rotation",
    get: function get() {
      return this.hasAttribute("rotation") ? parseInt(this.getAttribute("rotation"), 10) : DEFAULT_ROTATION;
    },
    set: function set(newR) {
      if (null === newR) {
        this.removeAttribute("rotation");
      } else {
        this.setAttribute("rotation", newR);
      }
    }
  }], [{
    key: "observedAttributes",
    get: function get() {
      return ["x", "y", "rotation"];
    }
  }]);

  return TopDieHTMLElement;
}(_wrapNativeSuper(HTMLElement));

window.customElements.define("top-die", TopDieHTMLElement);
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
 * TopPlayerListHTMLElement to describe the players in the game
 */

var TopPlayerListHTMLElement =
/*#__PURE__*/
function (_HTMLElement4) {
  _inherits(TopPlayerListHTMLElement, _HTMLElement4);

  function TopPlayerListHTMLElement() {
    _classCallCheck(this, TopPlayerListHTMLElement);

    return _possibleConstructorReturn(this, _getPrototypeOf(TopPlayerListHTMLElement).call(this));
  }

  _createClass(TopPlayerListHTMLElement, [{
    key: "attributeChangedCallback",
    value: function attributeChangedCallback(name, oldValue, newValue) {}
  }, {
    key: "connectedCallback",
    value: function connectedCallback() {
      this.appendChild(DEFAULT_SYSTEM_PLAYER);
    }
  }, {
    key: "disconnectedCallback",
    value: function disconnectedCallback() {}
  }, {
    key: "contains",
    value: function contains(player) {
      return this.players.filter(function (p) {
        return p.equals(player);
      });
    }
  }, {
    key: "find",
    value: function find(player) {
      var foundPlayers = this.players.filter(function (p) {
        return p.equals(player);
      });
      return 0 === foundPlayers.length ? null : foundPlayers[0];
    }
  }, {
    key: "players",
    get: function get() {
      return _toConsumableArray(this.getElementsByTagName("top-player"));
    }
  }], [{
    key: "observedAttributes",
    get: function get() {
      return [];
    }
  }]);

  return TopPlayerListHTMLElement;
}(_wrapNativeSuper(HTMLElement));

window.customElements.define("top-player-list", TopPlayerListHTMLElement);
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

window.twentyonepips = {
  version: "0.0.1",
  TopDiceBoard: TopDiceBoardHTMLElement,
  TopDie: TopDieHTMLElement,
  TopPlayer: TopPlayerHTMLElement,
  TopPlayerList: TopPlayerListHTMLElement
};
//# sourceMappingURL=twenty-one-pips.js.map
