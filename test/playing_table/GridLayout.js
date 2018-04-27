import {expect} from "chai";
import {
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_BACKGROUND,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
} from "../../src/playing_table/PlayingTable.js";
import {GridLayout} from "../../src/playing_table/GridLayout.js";
import {Die} from "../../src/Die.js";
import {Player} from "../../src/Player.js";

describe("GridLayout", function () {
    describe("create a new GridLayout", function () {
        it("should have properties width, height, maximumNumberOfDice, and rotate", function () {
            let l = new GridLayout();
            expect(l.width).to.equal(DEFAULT_WIDTH);
            expect(l.height).to.equal(DEFAULT_HEIGHT);
            expect(l.rotate).to.be.true;
            expect(l.maximumNumberOfDice).to.equal(100);
            
            l = new GridLayout({
                width: 100,
                height: 4000,
                rotate: false
            });
            expect(l.width).to.equal(100);
            expect(l.height).to.equal(4000);
            expect(l.rotate).to.be.false;
            expect(l.maximumNumberOfDice).to.equal(55);
        });

        it("should throw an error when height or width are <= 0", function () {
            expect(() => new GridLayout({
                width: -100,
                height: 0,
            })).to.throw();
        });
    });

    describe("#layout(dice)", function () {
        const dice = [new Die(), new Die(), new Die(), new Die(), new Die()];
        const grid = new GridLayout();

        it("should return an empty list when an empty list is supplied to layout", function () {
            expect(grid.layout([])).to.be.empty;
        });

        it("should layout all dice", function () {
            const layoutDice = grid.layout(dice);
            expect(layoutDice.length).to.equal(dice.length);
            for (const die of layoutDice) {
                expect(die.coordinates.x).to.be.above(-1).and.to.be.below(726);
                expect(die.coordinates.y).to.be.above(-1).and.to.be.below(726);
                expect(die.rotation).to.exist;
            }
        });
        
        it("should re-layout dice that are being held", function () {
            const player = new Player({name: "John", color: "red"});
            const notHoldDie = new Die();
            expect(notHoldDie.isHeld()).to.be.false;
            expect(notHoldDie.hasCoordinates()).to.be.false;

            grid.layout([notHoldDie]);
            expect(notHoldDie.isHeld()).to.be.false;
            expect(notHoldDie.hasCoordinates()).to.be.true;

            const firstCoordinates = notHoldDie.coordinates;
            const firstRotation = notHoldDie.rotation;
            
            expect(firstCoordinates.x).to.be.above(-1).and.to.be.below(601);
            expect(firstCoordinates.y).to.be.above(-1).and.to.be.below(601);
            expect(firstRotation).to.exist;

            const NUMBER_OF_SAMPLES = 10;
            const coordinates = [];
            for (let i = 0; i < NUMBER_OF_SAMPLES; i++) {
                grid.layout([notHoldDie]);
                coordinates.push(notHoldDie.coordinates);
            }
          
            // Test randomness is tricky as potentially random() could get the
            // same value twice. To decrease that possibility, the die is
            // layout 10 times. It should be quite unlikely that the random()
            // method generates the same number 10 times. If it does, and
            // repeatedly, it is probably a sign the randomness is not
            // working.
            const numberOfCoordinatesEqualToTheFirstCoordinates = coordinates
                .filter(c => c.x === firstCoordinates.x || c.y === firstCoordinates.y)
                .length;
            expect(numberOfCoordinatesEqualToTheFirstCoordinates).not.to.equal(NUMBER_OF_SAMPLES);
        });
        
        it("should not re-layout dice that are being held", function () {
            const player = new Player({name: "John", color: "red"});
            const holdDie = new Die({heldBy: player});
            expect(holdDie.isHeld()).to.be.true;
            expect(holdDie.hasCoordinates()).to.be.false;

            grid.layout([holdDie]);
            expect(holdDie.isHeld()).to.be.true;
            expect(holdDie.hasCoordinates()).to.be.true;

            const firstCoordinates = holdDie.coordinates;
            const firstRotation = holdDie.rotation;
            
            expect(firstCoordinates.x).to.be.above(-1).and.to.be.below(601);
            expect(firstCoordinates.y).to.be.above(-1).and.to.be.below(601);
            expect(firstRotation).to.exist;
            
            grid.layout([holdDie]);
            const secondCoords = holdDie.coordinates;
            const secondRotation = holdDie.rotation;
            expect(firstCoordinates.x).to.equal(secondCoords.x);
            expect(firstCoordinates.y).to.equal(secondCoords.y);
            expect(firstRotation).to.equal(secondRotation);
        });


    });
    
    describe("#snapTo({x, y})", function () {
        // Not yet implemented.
    });
});
