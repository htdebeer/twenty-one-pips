import {expect} from "chai";
import {GridLayout} from "../../src/playing_table/GridLayout.js";

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

        it("should increase the width and height if the max number of dice do not fit", function () {
            let l = new GridLayout({
                maximumNumberOfDice: 50,
                dieSize: 10,
                width: 45,
                height: 30
            });
            expect(l.width).to.equal(50);
            expect(l.height).to.equal(30);
            expect(l.maximumNumberOfDice).to.equal(50);
        });
    });
});
