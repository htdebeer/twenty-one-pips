import {expect} from "chai";
import {GridLayout} from "../../src/playing_table/GridLayout.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

describe("GridLayout", function () {
    describe("create a new GridLayout", function () {
        it("should have properties width, height, dieSize, maximumNumberOfDice, and rotate", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 4,
                dieSize: 10
            });
            expect(l.width).to.equal(600);
            expect(l.height).to.equal(400);
            expect(l.rotate).to.be.true;
            expect(l.dieSize).to.equal(10);
            expect(l.maximumNumberOfDice).to.equal(2400);
            
            l = new GridLayout({
                maximumNumberOfDice: 4,
                dieSize: 10,
                width: 100,
                height: 4000,
                rotate: false
            });
            expect(l.width).to.equal(100);
            expect(l.height).to.equal(4000);
            expect(l.rotate).to.be.false;
            expect(l.dieSize).to.equal(10);
            expect(l.maximumNumberOfDice).to.equal(4000);
        });

        it("should throw an error when height or width are <= 0", function () {
            expect(() => new Layout({
                maximumNumberOfDice: 4,
                dieSize: 10,
                width: -100,
                height: 0,
            })).to.throw();
        });

        it("should throw an error when the dieSize is not an Integer > 0", function () {
            expect(() => new Layout({
                maximumNumberOfDice: 4,
                dieSize: -3,
            })).to.throw();
            expect(() => new Layout({
                maximumNumberOfDice: 4,
                dieSize: 51.45,
            })).to.throw();
        });

        it("should increase the width and height until they are multiples of dieSize", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 4,
                dieSize: 10,
                width: 355.6
            });
            expect(l.width).to.equal(360);
            expect(l.height).to.equal(400);
            expect(l.maximumNumberOfDice).to.equal(1440);
            
            l = new GridLayout({
                maximumNumberOfDice: 4,
                dieSize: 10,
                width: 100.1,
                height: 786
            });
            expect(l.width).to.equal(110);
            expect(l.height).to.equal(790);
            expect(l.maximumNumberOfDice).to.equal(869);
        });

        it("should increase the width and height and possible the max if the max number of dice do not fit", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 50,
                dieSize: 10,
                width: 45,
                height: 30
            });
            expect(l.width).to.equal(90);
            expect(l.height).to.equal(60);
            expect(l.maximumNumberOfDice).to.equal(54);
        });
    });

    describe("#layout(dice)", function () {
        const dice = [new Die(), new Die(), new Die(), new Die(), new Die()];
        const grid = new GridLayout({maximumNumberOfDice: 6, dieSize: 10});

        it("should return an empty list when an empty list is supplied to layout", function () {
            expect(grid.layout([])).to.be.empty;
        });

        it("should layout all dice", function () {
            const layoutDice = grid.layout(dice);
            expect(layoutDice.length).to.equal(dice.length);
            for (const coords of layoutDice) {
                expect(coords.x).to.be.above(-1).and.to.be.below(601);
                expect(coords.y).to.be.above(-1).and.to.be.below(601);
                expect(coords.rotation).to.exist;
            }
        });
        
        it("should not re-layout dice that are being held", function () {
            const player = new Player({name: "John", color: "red"});
            const holdDie = new Die({holdBy: player});
            
            const firstCoords = grid.layout([holdDie])[0];
            expect(firstCoords.x).to.be.above(-1).and.to.be.below(601);
            expect(firstCoords.y).to.be.above(-1).and.to.be.below(601);
            expect(firstCoords.rotation).to.exist;
            
            const secondCoords = grid.layout([holdDie])[0];
            expect(firstCoords.x).to.equal(secondCoords.x);
            expect(firstCoords.y).to.equal(secondCoords.y);
            expect(firstCoords.rotation).to.equal(secondCoords.rotation);
        });


    });
    
    describe("#snapTo({x, y})", function () {
        // Not yet implemented.
    });
});
