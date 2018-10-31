import {expect} from "chai";
import {EventAware} from "../src/EventAware.js";

const EVENT = Symbol("event_type");
const ANOTHER_EVENT = Symbol("another_event");

const AwareObject = class extends EventAware(null) {
    constructor(...events) {
        super();
        for (const event of events) {
            this.registerEvent(event);
        }
    }
};

describe("EventAware", function () {
    describe("#registerEvent(...events)", function () {
        it("should register one event type", function () {
            const ao = new AwareObject();
            ao.registerEvent(EVENT);
            expect(() => ao.unregisterEvent(EVENT)).to.not.throw();
        });

        it("should register multiple event types", function () {
            const ao = new AwareObject();
            ao.registerEvent(EVENT, ANOTHER_EVENT);
            expect(() => ao.unregisterEvent(EVENT)).to.not.throw();
            expect(() => ao.unregisterEvent(ANOTHER_EVENT)).to.not.throw();
        });
    });

    describe("#unregisterEvent(...events)", function () {
        it("should throw an error when trying to unregister an event type that is not registered", function () {
            const ao = new AwareObject();
            expect(() => ao.unregisterEvent(EVENT)).to.throw(); // Note that by using babel and polyfill, subclasses of Error are not accepted to test against as the error being thrown.
        });

        it("should not throw an error when trying to unregister an event type that has been registered", function () {
            const ao = new AwareObject();
            ao.registerEvent(EVENT);
            expect(() => ao.unregisterEvent(EVENT)).to.not.throw();
        });
    });

    describe("#on(event, function), #off(event, function|undefined), #emit(event, args)", function () {
        let check = false;
        let num = 0;
        const f = function () { check = true; };
        const g = function (n) { num = n; };
        const h = function (n, m) { num = n * m; };

        it("should throw an error when trying to install or uninstall a handler for an unregistered event type, or emit such an unregistered event type", function () {
            const ao = new AwareObject();
            expect(() => ao.on(EVENT, f)).to.throw();
            expect(() => ao.off(EVENT, f)).to.throw();
            expect(() => ao.off(EVENT)).to.throw();
            expect(() => ao.emit(EVENT, 3, 6)).to.throw();
        });

        it("should run function when event is emitted", function () {
            check = false;
            const ao = new AwareObject(EVENT);
            ao.on(EVENT, f);
            ao.emit(EVENT);
            expect(check).to.be.true;
        });
        
        it("should run function with parameters when event is emitted with those parameters", function () {
            num = 0;
            const ao = new AwareObject(EVENT);
            ao.on(EVENT, h);
            ao.emit(EVENT, 5, 6);
            expect(num).to.equal(30);
        });
        
        it("should run all installed handlers when event is emitted", function () {
            check = false;
            num = 0;
            const ao = new AwareObject(EVENT);
            ao.on(EVENT, f);
            ao.on(EVENT, g);
            ao.emit(EVENT, 4);
            expect(check).to.be.true;
            expect(num).to.equal(4);
        });
        
        it("should not run a handler when event is emitted after handler has been uninstalled", function () {
            check = false;
            num = 0;
            const ao = new AwareObject(EVENT);
            ao.on(EVENT, f);
            ao.on(EVENT, g);
            ao.off(EVENT, f);
            ao.emit(EVENT, 4);
            expect(check).to.be.false;
            expect(num).to.equal(4);
        });
        
        it("should not run any handler when event is emitted after all handlers have been uninstalled", function () {
            check = false;
            num = 0;
            const ao = new AwareObject(EVENT);
            ao.on(EVENT, g);
            ao.on(EVENT, f);
            ao.off(EVENT);
            ao.emit(EVENT, 4);
            expect(check).to.be.false;
            expect(num).to.equal(0);
        });
    });
});
