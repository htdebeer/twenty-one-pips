import {Die} from "../src/Die.js";
import {Player} from "../src/Player.js";

describe("Die", function () {
    describe("Create a new Die", function () {
        it("Should create all 6 dice by number", function () {
            for (let pips = 1; pips <= 6; pips++) {
                const die = new Die({pips});
                chai.expect(die.pips).to.equal(pips);
                chai.expect(die.isHeld()).to.be.false;
                chai.expect(die.color).to.equal("Ivory");
                chai.expect(die.coordinates).to.be.null;
                chai.expect(die.rotation).to.equal(0);
                chai.expect(die.hasCoordinates()).to.be.false;
            }
        });
        
        it("Should create all 6 dice by their unicode character", function () {
            const unicodeChars = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
            
            for (let index = 0; index < unicodeChars.length; index++) {
                const pips = index + 1;
                const unicodeChar = unicodeChars[index];
                const die = Die.fromUnicode(unicodeChar);
                chai.expect(die.pips).to.equal(pips);
                chai.expect(die.isHeld()).to.be.false;
                chai.expect(die.color).to.equal("Ivory");
                chai.expect(die.toUnicode()).to.equal(unicodeChar);
            }
        });

        it("Should create a random die", function () {
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
            chai.expect((new Die()).pips).to.be.above(0).and.to.be.below(7);
        });

        it("Should set color and holdBy when configured; getters color, pips, and heldBy do work as expected", function () {
            let die = new Die({color: "red"});
            chai.expect(die.color).to.equal("red");
            const player = new Player({name: "John", color: "Green"});
            die = new Die({heldBy: player});
            chai.expect(die.heldBy.name).to.equal("John");
            die = new Die({heldBy: player, color: "purple"});
            chai.expect(die.heldBy.name).to.equal("John");
            chai.expect(die.color).to.equal("purple");
            die = Die.fromUnicode("⚂", {heldBy: player, color: "purple"});
            chai.expect(die.heldBy.name).to.equal("John");
            chai.expect(die.color).to.equal("purple");
        });
    });

    describe("#hasCoordinates()", function () {
        it("Should be false if coordinates are null", function () {
            const die = new Die();
            chai.expect(die.coordinates).to.be.null;
            chai.expect(die.hasCoordinates()).to.be.false;
        });

        it("Should be true if coordinates are set", function () {
            const die = new Die({coordinates: {x: 100, y: 300}});
            chai.expect(die.coordinates.x).to.equal(100);
            chai.expect(die.coordinates.y).to.equal(300);
            chai.expect(die.hasCoordinates()).to.be.true;
        });
    });

    describe("#throwIt()", function () {
        // It is a bit difficult to test for random numbers, as they could
        // potentially be the same for a number of times. Therefore I use a
        // loop to throw a die until it is different or it has been thrown for
        // 100 times.
        it("Should get a random number between 1 and 6", function () {
            let stopAt = 100;
            const die = new Die();
            const pips = die.pips;
            while (pips === die.pips && stopAt > 0) {
                die.throwIt();
                stopAt--;
            }

            chai.expect(die.pips).to.not.equal(pips);
            chai.expect(die.pips).to.be.above(0).and.to.be.below(7);
        });

        it("Should fire 'top:throw-die' event", function () {
            let pips = -1;
            const die = new Die();
            die.addEventListener("top:throw-die", (e) => {
                const die = e.detail.die;
                pips = die.pips
            });
            die.throwIt();
            chai.expect(pips).to.equal(die.pips);
        });

        it("should not throw when it is being held", function () {
            let check = false;
            const player = new Player({name: "John", color: "green"});
            const die = new Die({heldBy: player});
            die.addEventListener("top:throw-die", () => check = true);
            die.throwIt();
            chai.expect(check).to.be.false;
        });
    });

    describe("#holdIt(player); #isHeld()", function () {
        it("should hold a die when it is not being held", function () {
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die();
            chai.expect(die.isHeld()).to.be.false;
            die.holdIt(player);
            chai.expect(die.isHeld()).to.be.true;
            chai.expect(die.heldBy).to.equal(player);
        });

        it("should not hold a die when it is already being held by another player; the top:hold-die event will not be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const player2 = new Player({name: "Mary", color: "yellow"});
            const die = new Die({heldBy: player});
            die.addEventListener("top:hold-die", () => check = true);
            chai.expect(die.isHeld()).to.be.true;
            die.holdIt(player2);
            chai.expect(die.isHeld()).to.be.true;
            chai.expect(die.heldBy).to.equal(player);
            chai.expect(check).to.be.false;
        });

        it("should fire top:hold-die event", function () {
            let color = "";
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die();
            die.addEventListener("top:hold-die", (e) => {
                const {die, player} = e.detail;
                color = player.color;
            });
            chai.expect(die.isHeld()).to.be.false;
            die.holdIt(player);
            chai.expect(die.isHeld()).to.be.true;
            chai.expect(die.heldBy).to.equal(player);
            chai.expect(color).to.equal("gray");
        });
    });

    describe("#releaseIt(player); #isHeld()", function () {
        it("should release a die when it is being held by the same player, top:release-die event will be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die({heldBy: player});
            chai.expect(die.isHeld()).to.be.true;
            die.addEventListener("top:release-die", () => check = true);
            die.releaseIt(player);
            chai.expect(die.isHeld()).to.be.false;
            chai.expect(check).to.be.true;
        });

        it("should not release a die when it is already being held by another player; the top:hold-die event will not be fired", function () {
            let check = false;
            const player = new Player({name: "Ho", color: "gray"});
            const player2 = new Player({name: "Mary", color: "yellow"});
            const die = new Die({heldBy: player});
            die.addEventListener("top:hold-die", () => check = true);
            chai.expect(die.isHeld()).to.be.true;
            die.releaseIt(player2);
            chai.expect(die.isHeld()).to.be.true;
            chai.expect(die.heldBy).to.equal(player);
            chai.expect(check).to.be.false;
        });

        it("should fire top:release-die event", function () {
            let color = "";
            const player = new Player({name: "Ho", color: "gray"});
            const die = new Die({heldBy: player});
            die.addEventListener("top:release-die", (e) => {
                const {die, player} = e.detail;
                color = player.color;
            });
            chai.expect(die.isHeld()).to.be.true;
            die.releaseIt(player);
            chai.expect(die.isHeld()).to.be.false;
            chai.expect(color).to.equal("gray");
        });
    });
});
