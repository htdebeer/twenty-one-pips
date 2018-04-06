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

import {NoSuchEventTypeError} from "./error/NoSuchEventTypeError.js";

/**
 * @module
 */

const _eventHandlers = new WeakMap();

/**
 * EventAware is a mixin to add event handling. 
 *
 * @mixin
 */
const EventAware = (Sup) => class extends Sup {

    /**
     * Get the event handlers associated with the event type.
     *
     * @param {Symbol} event - The event type to get the associated event
     * handlers for.
     *
     * @return {Function[]} A list of with the event type associated event
     * handlers.
     *
     * @throws {module:error/NoSuchEventTypeError~NoSuchEventTypError} The event type needs to be registered
     * to get its associated event handlers.
     *
     * @private
     */
    _handlersFor(event) {
        const handlers = _eventHandlers.get(this) || {};
        if (undefined === handlers[event]) {
            throw new NoSuchEventTypeError(`'${event.toString()}' is not a registered event on object of type '${this.constructor.name}'.`);
        }
        return handlers[event];
    }

    /**
     * Register an event type. A event type will only be
     * registered once.
     *
     * @param {...Symbol} event - The event types to register.
     */
    registerEvent(...events) {
        if (undefined === _eventHandlers.get(this)) {
            _eventHandlers.set(this, {});
        }
        
        for (const event of events) {
            _eventHandlers.get(this)[event] = 
                _eventHandlers.get(this)[event] || [];
        }
    }

    /**
     * Unregister an event type.
     *
     * @param {...Symbol} event - The event types to unregister.
     *
     * @throws {module:error/NoSuchEventTypeError~NoSuchEventTypeError} The event type needs to be registered
     * for it to be unregistered.
     */
    unregisterEvent(...events) {
        for (const event of events) {
            if (undefined !== this._handlersFor(event)) {
                _eventHandlers.get(this)[event] = undefined;
            }
        }
    }

    /**
     * Install a handler for an event.
     *
     * @param {Symbol} event - The event type to install handler for.
     * @param {Function} handler - The event handler to install for event
     * type.
     *
     * @throws {module:error/NoSuchEventTypeError~NoSuchTypeError} The event type needs to be registered
     * for this object.
     */
    on(event, handler) {
        this._handlersFor(event).push(handler);
    }

    /**
     * Uninstall one or all handlers for an event.
     *
     * @param {Symbol} event - The event type to uninstall a handler for.
     * @param {undefined|Function} [handler = undefined] - The event handler
     * to uninstall. If undefined, all associated handlers for this
     * event type will be uninstalled. Defaults to undefined.
     *
     * @throws {module:error/NoSuchEventTypeError~NoSuchTypeError} The event type needs to be registered
     * for this object.
     */
    off(event, handler = undefined) {
        const eventHandlers = this._handlersFor(event);
        if (undefined === handler) {
            eventHandlers.splice(0, eventHandlers.length);
        } else {
            eventHandlers.splice(eventHandlers.indexOf(handler), 1);
        }
    }

    /**
     * Emit an event and send parameters to all associated event handlers.
     *
     * @param {Symbol} event - The event type to emit.
     * @param {...*} parameters - The parameters to send to all
     * associated event handlers.
     *
     * @throws {module:error/NoSuchEventTypeError~NoSuchTypeError} The event type needs to be registered
     * for this object.
     */
    emit(event, ...parameters) {
        this._handlersFor(event)
            .forEach(handler => handler.call(this, ...parameters));
    }
};

export {EventAware};
