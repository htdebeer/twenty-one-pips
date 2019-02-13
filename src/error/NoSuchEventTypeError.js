/** 
 * Copyright (c) 2018, 2019 Huub de Beer
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
 * NoSuchEventTypeError is thrown when an {@link EventAware} object tries to 
 * set, unset, emit, or unregister an unregistered event type.
 *
 * @extends Error
 */
const NoSuchEventTypeError = class extends Error {

    /**
     * Create a new NoSuchEventTypeError with message.
     *
     * @param {String} message - The message associated with this
     * NoSuchEventTypeError.
     */
    constructor(message) {
        super(message);
    }
};

export {NoSuchEventTypeError};
