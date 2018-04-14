import {expect} from "chai";
import {GridLayout} from "../../src/playing_table/GridLayout.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

describe("GridLayout", function () {
    describe("create a new GridLayout", function () {
        it("should have properties width, height, maximumNumberOfDice, and rotate", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 4
            });
            expect(l.width).to.equal(725);
            expect(l.height).to.equal(725);
            expect(l.rotate).to.be.true;
            expect(l.maximumNumberOfDice).to.equal(100);
            
            l = new GridLayout({
                maximumNumberOfDice: 4,
                width: 100,
                height: 4000,
                rotate: false
            });
            expect(l.width).to.equal(145);
            expect(l.height).to.equal(4060);
            expect(l.rotate).to.be.false;
            expect(l.maximumNumberOfDice).to.equal(112);
        });

        it("should throw an error when height or width are <= 0", function () {
            expect(() => new Layout({
                maximumNumberOfDice: 4,
                width: -100,
                height: 0,
            })).to.throw();
        });

        it("should increase the width and height and possible the max if the max number of dice do not fit", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 50,
                width: 45,
                height: 30
            });
            expect(l.width).to.equal(652.5);
            expect(l.height).to.equal(435);
            expect(l.maximumNumberOfDice).to.equal(54);
        });
    });

    describe("#layout(dice)", function () {
        const dice = [new Die(), new Die(), new Die(), new Die(), new Die()];
        const grid = new GridLayout({maximumNumberOfDice: 6});

        it("should return an empty list when an empty list is supplied to layout", function () {
            expect(grid.layout([])).to.be.empty;
        });

        it("should layout all dice", function () {
            const layoutDice = grid.layout(dice);
            expect(layoutDice.length).to.equal(dice.length);
            for (const die of layoutDice) {
                expect(die.coordinates.x).to.be.above(-1).and.to.be.below(726);
                expect(die.coordinates.y).to.be.above(-1).and.to.be.below(726);
                expect(die.rotation).to.exist;
            }
        });
        
        it("should not re-layout dice that are being held", function () {
            const player = new Player({name: "John", color: "red"});
            const holdDie = new Die({heldBy: player});
            expect(holdDie.isHeld()).to.be.true;
            expect(holdDie.hasCoordinates()).to.be.false;

            grid.layout([holdDie]);
            expect(holdDie.isHeld()).to.be.true;
            expect(holdDie.hasCoordinates()).to.be.true;

            const firstCoordinates = holdDie.coordinates;
            const firstRotation = holdDie.rotation;
            
            expect(firstCoordinates.x).to.be.above(-1).and.to.be.below(601);
            expect(firstCoordinates.y).to.be.above(-1).and.to.be.below(601);
            expect(firstRotation).to.exist;
            
            grid.layout([holdDie]);
            const secondCoords = holdDie.coordinates;
            const secondRotation = holdDie.rotation;
            expect(firstCoordinates.x).to.equal(secondCoords.x);
            expect(firstCoordinates.y).to.equal(secondCoords.y);
            expect(firstRotation).to.equal(secondRotation);
        });


    });
    
    describe("#snapTo({x, y})", function () {
        // Not yet implemented.
    });
});
