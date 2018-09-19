import {
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION,
    NATURAL_DIE_SIZE,
    DEFAULT_DRAGGABLE_DICE,
    DEFAULT_HOLDABLE_DICE,
    DiceBoard
} from "../../src/dice_board/DiceBoard.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

describe("DiceBoard", function () {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const board = new DiceBoard({parent});

    const player = new Player({name: "Alisha", color: "gold"});

    describe("create a new DiceBoard", function () {
        it("should have default properties", function () {
            chai.expect(board.width).to.equal(DEFAULT_WIDTH);
            chai.expect(board.height).to.equal(DEFAULT_HEIGHT);
            chai.expect(board.background).to.equal(DEFAULT_BACKGROUND);
            chai.expect(board.holdDuration).to.equal(DEFAULT_HOLD_DURATION);
            chai.expect(board.dispersion).to.equal(DEFAULT_DISPERSION);
            chai.expect(board.dieSize).to.equal(DEFAULT_DIE_SIZE);
            chai.expect(board.draggableDice).to.equal(DEFAULT_DRAGGABLE_DICE);
            chai.expect(board.holdableDice).to.equal(DEFAULT_HOLDABLE_DICE);
        });
    });

    describe("#renderDice({dice, player})", function () {
        it("should not render dice when the dice = []", function () {
            const dice = [];
            board.renderDice({player, dice});
            let renderedDice = board.element.querySelectorAll("g.die");
            chai.expect(renderedDice.length).to.equal(0);
        });
        it("should render the dice when |dice| > 0", function () {
            const dice = [new Die(), new Die()];
            board.renderDice({player, dice});
            let renderedDice = board.element.querySelectorAll("g.die");
            chai.expect(renderedDice.length).to.equal(dice.length);
        });
    });

    describe("#throwDice({dice, player})", function () {
        it("should not throw any dice when dice = []", function () {
            const dice = [];
            const thrownDice = board.throwDice({dice, player});
            chai.expect(thrownDice).to.be.empty;
        });

        it("should throw dice when |dice| > 0", function () {
            let dice = [new Die(), new Die(), new Die()];
            let thrownDice = board.throwDice({player, dice});
            chai.expect(thrownDice.length).to.equal(dice.length);

            dice = [new Die(), new Die(), new Die(), new Die()];
            thrownDice = board.throwDice({player, dice});
            chai.expect(thrownDice.length).to.equal(dice.length);
        });

        it("should rethrow dice when dice = null", function () {
            const dice = [new Die(), new Die()];
            board.throwDice({dice, player});
            const thrownDice = board.throwDice({player});
            chai.expect(thrownDice.length).to.equal(dice.length);
        });
    });

    document.body.removeChild(parent);
});
