import "jsdom-global/register";
import {expect} from "chai";
import {Player} from "../src/Player.js";

describe("Player", function () {
    describe("create a new Player", function () {
        it("should have a name and a color", function () {
            const p = new Player({name: "John", color: "red"});
            expect(p.name).to.equal("John");
            expect(p.color).to.equal("red");
        });

        it("should throw an error when a color or name is omitted", function () {
            expect(() => new Player()).to.throw();
            expect(() => new Player({})).to.throw();
            expect(() => new Player({color: "red"})).to.throw();
            expect(() => new Player({name: "sdfsd"})).to.throw();
        });
    });

    describe("#equals(other)", function () {
        it("should be true when other === player", function () {
            const p = new Player({name: "John", color: "red"});
            expect(p.equals(p)).to.be.true;
        });
        
        it("should be true when other !== player, but the name and color are the same", function () {
            const p = new Player({name: "John", color: "red"});
            const q = new Player({name: "John", color: "red"});
            expect(p.equals(q)).to.be.true;
        });
        
        it("should be false when other !== player and the name and color are not the same", function () {
            const p = new Player({name: "John", color: "red"});
            const q = new Player({name: "John", color: "crimson"});
            expect(p.equals(q)).to.be.false;
        });
    });
});
