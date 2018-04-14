import {expect} from "chai";
import {Layout} from "../../src/playing_table/Layout.js";

describe("Layout", function () {
    describe("create a new Layout", function () {
        it("should have properties width, height, maximumNumberOfDice, and rotate", function () {
            let l = new Layout({
                maximumNumberOfDice: 4
            });
            expect(l.width).to.equal(725);
            expect(l.height).to.equal(725);
            expect(l.rotate).to.be.true;
            expect(l.maximumNumberOfDice).to.equal(4);
            
            l = new Layout({
                maximumNumberOfDice: 4,
                width: 100,
                height: 4000,
                rotate: false
            });
            expect(l.width).to.equal(100);
            expect(l.height).to.equal(4000);
            expect(l.rotate).to.be.false;
            expect(l.maximumNumberOfDice).to.equal(4);
        });

        it("should throw an error when height or width are <= 0", function () {
            expect(() => new Layout({
                maximumNumberOfDice: 4,
                width: -100,
                height: 0,
            })).to.throw();
        });

    });
});
