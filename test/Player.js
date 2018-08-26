import {Player} from "../src/Player.js";

describe("Player", function () {
    describe("Create a new Player", function () {
        it("Should have a name and a color", function () {
            const p = new Player({name: "John", color: "red"});
            chai.expect(p.name).to.equal("John");
            chai.expect(p.color).to.equal("red");
        });

        it("Should throw an error when a color or name is omitted", function () {
            chai.expect(() => new Player()).to.throw();
            chai.expect(() => new Player({})).to.throw();
            chai.expect(() => new Player({color: "red"})).to.throw();
            chai.expect(() => new Player({name: "sdfsd"})).to.throw();
        });
    });

    describe("#equals(other)", function () {
        it("Should be true when other === player", function () {
            const p = new Player({name: "John", color: "red"});
            chai.expect(p.equals(p)).to.be.true;
        });
        
        it("Should be true when other !== player, but the name and color are the same", function () {
            const p = new Player({name: "John", color: "red"});
            const q = new Player({name: "John", color: "red"});
            chai.expect(p.equals(q)).to.be.true;
        });
        
        it("Should be false when other !== player and the name and color are not the same", function () {
            const p = new Player({name: "John", color: "red"});
            const q = new Player({name: "John", color: "crimson"});
            chai.expect(p.equals(q)).to.be.false;
        });
    });
});
