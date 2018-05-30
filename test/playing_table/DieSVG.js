import "jsdom-global/register";
import {expect} from "chai";
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

    describe("create a new DieSVG", function () {
        it("should have created a g element with two use elements", function () {
            expect(svgDie.element.nodeName).to.equal("g");
            expect(svgDie.element.querySelectorAll("use").length).to.equal(2);
            expect(svgDie.die).to.equal(die);
        })
    });

    describe("render()", function () {
        it("should use the player's color when the die is held, none otherwise", function () {
            svgDie.render();
            expect(holdUse(svgDie).getAttribute("fill")).to.equal("none");
            die.holdIt(player);
            expect(holdUse(svgDie).getAttribute("fill")).to.equal(player.color);
            die.releaseIt(player);
            expect(holdUse(svgDie).getAttribute("fill")).to.equal("none");
        });

        it("should render the correct number of pips", function () {
            svgDie.render();
            expect(dieUse(svgDie).getAttribute("xlink:href")).to.equal(`#die_${die.pips}`);
        });

        it("should render the die with the die's color", function () {
            svgDie.render();
            expect(dieUse(svgDie).getAttribute("fill")).to.equal(die.color);
        });
    });
});
