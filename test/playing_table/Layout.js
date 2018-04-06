import {expect} from "chai";
import {Layout} from "../../src/playing_table/Layout.js";

describe("Layout", function () {
    describe("create a new Layout", function () {
        it("should have properties width, height, dieSize, maximumNumberOfDice, and rotate", function () {
            let l = new Layout({
                maximumNumberOfDice: 4,
                dieSize: 10
            });
            expect(l.width).to.equal(600);
            expect(l.height).to.equal(400);
            expect(l.rotate).to.be.true;
            expect(l.dieSize).to.equal(10);
            expect(l.maximumNumberOfDice).to.equal(4);
            
            l = new Layout({
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
            expect(l.maximumNumberOfDice).to.equal(4);
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
    });
});
