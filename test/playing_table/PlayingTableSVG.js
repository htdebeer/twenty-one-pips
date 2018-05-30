import "jsdom-global/register";
import {expect} from "chai";
import {PlayingTableSVG} from "../../src/playing_table/PlayingTableSVG.js";
import {DieSVG} from "../../src/playing_table/DieSVG.js";
import {GridLayout} from "../../src/playing_table/GridLayout.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

const holdUse = (svgDie) => svgDie.element.querySelectorAll("use").item(0);
const dieUse = (svgDie) => svgDie.element.querySelectorAll("use").item(1);

describe("PlayingTableSVG", function () {
    const WIDTH = 500;
    const HEIGHT = 500;
    const parentDiv = document.createElement("div");
    const layout = new GridLayout({
        width: WIDTH,
        height: HEIGHT
    });
    const table = new PlayingTableSVG({
        parent: parentDiv,
        width: WIDTH,
        height: HEIGHT,
        layout,
        background: "purple"
    });
    const player = new Player({name: "John", color: "green"});
    const dice = [new Die(1), new Die(4), new Die(5)];

    describe("create a new PlayingTableSVG", function () {
        it("should have created a table SVG without any rendered dice with a purple background", function () {
            expect(table.element.querySelectorAll(".die").length).to.equal(0);
            expect(table.svgRoot.style.background).to.equal("purple");
        });
    });

    describe("renderDice({dice, player})", function () {
        it("should render all dice", function () {
            const numberOfDice = dice.length;
            table.renderDice({player, dice});
            expect(table.element.querySelectorAll(".die").length).to.equal(numberOfDice);
            dice.shift();
            table.renderDice({player, dice});
            expect(table.element.querySelectorAll(".die").length).to.equal(numberOfDice - 1);
        });
    });
});

