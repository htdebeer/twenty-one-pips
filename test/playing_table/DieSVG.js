import {DieSVG} from "../../src/playing_table/DieSVG.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

const holdUse = (svgDie) => svgDie.element.querySelectorAll("use").item(0);
const dieUse = (svgDie) => svgDie.element.querySelectorAll("use").item(1);

describe("DieSVG", function () {
    const die = new Die(3);
    die.coordinates = {x: 100, y: 50};
    const player = new Player({name: "John", color: "navy"});
    const svgDie = new DieSVG(die);

    describe("Create a new DieSVG", function () {
        it("Should have created a g element with two use elements", function () {
            chai.expect(svgDie.element.nodeName).to.equal("g");
            chai.expect(svgDie.element.querySelectorAll("use").length).to.equal(2);
            chai.expect(svgDie.die).to.equal(die);
        })
    });

    describe("#render()", function () {
        it("Should use the player's color when the die is held, none otherwise", function () {
            svgDie.render();
            chai.expect(holdUse(svgDie).getAttribute("fill")).to.equal("none");
            die.holdIt(player);
            chai.expect(holdUse(svgDie).getAttribute("fill")).to.equal(player.color);
            die.releaseIt(player);
            chai.expect(holdUse(svgDie).getAttribute("fill")).to.equal("none");
        });

        it("Should render the correct number of pips", function () {
            svgDie.render();
            chai.expect(dieUse(svgDie).getAttribute("xlink:href")).to.equal(`#die_${die.pips}`);
        });

        it("Should render the die with the die's color", function () {
            svgDie.render();
            chai.expect(dieUse(svgDie).getAttribute("fill")).to.equal(die.color);
        });
    });
});
