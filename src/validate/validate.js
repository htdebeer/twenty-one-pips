/** 
 * Copyright (c) 2019 Huub de Beer
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
import {IntegerTypeValidator} from "./IntegerTypeValidator.js";
import {StringTypeValidator} from "./StringTypeValidator.js";
import {ColorTypeValidator} from "./ColorTypeValidator.js";
import {BooleanTypeValidator} from "./BooleanTypeValidator,js";

const Validator = class {
    constructor() {
    }

    static registerType(name, ValidatorClass) {
        Validator.typeValidators[name] = ValidatorClass;
        Validator[name] = function(input) {
            return new Validator.typeValidator[name](input);
        };
    }

    static isRegisteredType(name) {
        return Validator.typeValidators.hasOwnProperty(name);
    }
};

Validator.typeValidators = {};
Validator.registerType("integer", IntegerTypeValidator);
Validator.registerType("string", StringTypeValidator);
Validator.registerType("boolean", BooleanTypeValidator);
Validator.registerType("color", ColorTypeValidator);

const ValidatorSingleton = new Validator();

export {
    ValidatorSingleton as validate
};
