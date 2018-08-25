import "jsdom-global/register";
import {expect} from "chai";
import {Die, THROW_DIE, HOLD_DIE, RELEASE_DIE} from "../src/Die.js";
import {Player} from "../src/Player.js";

describe("Die", function () {
    describe("create a new Die", function () {
        it("should create all 6 dice by number", function () {
            for (let pips = 1; pips <= 6; pips++) {
                const die = new Die({pips});
                expect(die.pips).to.equal(pips);
                expect(die.isHeld()).to.be.false;
                expect(die.color).to.equal("Ivory");
                expect(die.coordinates).to.be.null;
                expect(die.rotation).to.equal(0);
                expect(die.hasCoordinates()).to.be.false;
            }
        });
        
        it("should create all 6 dice by their unicode character; #toUnicode()", function () {
            const unicodeChars = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
            
            for (let index = 0; index < unicodeChars.length; index++) {
                const pips = index + 1;
                const unicodeChar = unicodeChars[index];
                const die = Die.fromUnicode(unicodeChar);
                expect(die.pips).to.equal(pips);
                expect(die.isHeld()).to.be.false;
                expect(die.color).to.equal("Ivory");
                expect(die.toUnicode()).to.equal(unicodeChar);
            }
        });

        it("should create a random die", function () {
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
        });

        it("should set color and holdBy when configured; getters color, pips, and heldBy", function () {
            let die = new Die({color: "red"});
            expect(die.color).to.equal("red");
            const player = new Player({name: "John", color: "Green"});
            die = new Die({heldBy: player});
            expect(die.heldBy.name).to.equal("John");
            die = new Die({heldBy: player, color: "purple"});
            expect(die.heldBy.name).to.equal("John");
            expect(die.color).to.equal("purple");
            die = Die.fromUnicode("⚂", {heldBy: player, color: "purple"});
            expect(die.heldBy.name).to.equal("John");
            expect(die.color).to.equal("purple");
        });
    });

    describe("#hasCoordinates()", function () {
        it("should be false if coordinates are null", function () {
            const die = new Die();
            expect(die.coordinates).to.be.null;
            expect(die.hasCoordinates()).to.be.false;
        });

        it("should be false if coordinates are set", function () {
            const die = new Die({coordinates: {x: 100, y: 300}});
            expect(die.coordinates.x).to.equal(100);
            expect(die.coordinates.y).to.equal(300);
            expect(die.hasCoordinates()).to.be.true;
        });
    });

    describe("#throwIt()", function () {
        // It is a bit difficult to test for random numbers, as they could
        // potentially be the same for a number of times. Therefore I use a
        // loop to throw a die until it is different or it has been thrown for
        // 100 times.
        it("should get a random number between 1 and 6", function () {
            let stopAt = 100;
            const die = new Die();
            const pips = die.pips;
            while (pips === die.pips && stopAt > 0) {
                die.throwIt();
                stopAt--;
            }

            expect(die.pips).to.not.equal(pips);
            expect(die.pips).to.be.above(0).and.to.be.below(7);
        });

        it("should fire THROW_DIE event", function () {
            let pips = -1;
            const die = new Die();
            die.on(THROW_DIE, (die) => pips = die.pips);
            die.throwIt();
            expect(pips).to.equal(die.pips);
        });

        it("should not throw when it is being held", function () {
            let check = false;
            const player = new Player({name: "John", color: "green"});
            const die = new Die({heldBy: player});
            die.on(THROW_DIE, () => check = true);
            die.throwIt();
            expect(check).to.be.false;
        });
    });

    describe("#holdIt(player); isHeld()", function () {
        it("should hold a die when it is not being held", function () {
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die();
            expect(die.isHeld()).to.be.false;
            die.holdIt(player);
            expect(die.isHeld()).to.be.true;
            expect(die.heldBy).to.equal(player);
        });

        it("should not hold a die when it is already being held by another player; the HOLD_DIE event will not be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const player2 = new Player({name: "Mary", color: "yellow"});
            const die = new Die({heldBy: player});
            die.on(HOLD_DIE, () => check = true);
            expect(die.isHeld()).to.be.true;
            die.holdIt(player2);
            expect(die.isHeld()).to.be.true;
            expect(die.heldBy).to.equal(player);
            expect(check).to.be.false;
        });

        it("should fire HOLD_DIE event", function () {
            let color = "";
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die();
            die.on(HOLD_DIE, (die, player) => color = player.color);
            expect(die.isHeld()).to.be.false;
            die.holdIt(player);
            expect(die.isHeld()).to.be.true;
            expect(die.heldBy).to.equal(player);
            expect(color).to.equal("gray");
        });
    });

    describe("#releaseIt(player); isHeld()", function () {
        it("should release a die when it is being held by the same player, RELEASE_DIE event will be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die({heldBy: player});
            expect(die.isHeld()).to.be.true;
            die.on(RELEASE_DIE, () => check = true);
            die.releaseIt(player);
            expect(die.isHeld()).to.be.false;
            expect(check).to.be.true;
        });

        it("should not release a die when it is already being held by another player; the HOLD_DIE event will not be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const player2 = new Player({name: "Mary", color: "yellow"});
            const die = new Die({heldBy: player});
            die.on(HOLD_DIE, () => check = true);
            expect(die.isHeld()).to.be.true;
            die.releaseIt(player2);
            expect(die.isHeld()).to.be.true;
            expect(die.heldBy).to.equal(player);
            expect(check).to.be.false;
        });

        it("should fire RELEASE_DIE event", function () {
            let color = "";
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die({heldBy: player});
            die.on(RELEASE_DIE, (die, player) => color = player.color);
            expect(die.isHeld()).to.be.true;
            die.releaseIt(player);
            expect(die.isHeld()).to.be.false;
            expect(color).to.equal("gray");
        });
    });
});
