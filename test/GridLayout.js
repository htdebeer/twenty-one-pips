import {
    DEFAULT_DIE_SIZE,
    DEFAULT_HOLD_DURATION,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_DISPERSION
} from "../src/TopDiceBoard.js";
import {GridLayout} from "../src/GridLayout.js";
import {TopDie} from "../src/TopDie.js";
import {TopPlayer} from "../src/TopPlayer.js";

describe("GridLayout", function () {
    describe("create a new GridLayout", function () {
        it("should have properties width, height, maximumNumberOfDice", function () {
            let l = new GridLayout();
            chai.expect(l.width).to.equal(DEFAULT_WIDTH);
            chai.expect(l.height).to.equal(DEFAULT_HEIGHT);
            chai.expect(l.maximumNumberOfDice).to.equal(100);
            
            l = new GridLayout({
                width: 100,
                height: 4000
            });
            chai.expect(l.width).to.equal(100);
            chai.expect(l.height).to.equal(4000);
            chai.expect(l.maximumNumberOfDice).to.equal(40);

            l = new GridLayout({
                width: 200,
                height: 200
            });
            chai.expect(l.width).to.equal(200);
            chai.expect(l.height).to.equal(200);
            chai.expect(l.maximumNumberOfDice).to.equal(4);
        });

        it("should throw an error when height, width, disperion, or dieSize are <= 0 or not an integer", function () {
            chai.expect(() => new GridLayout({
                width: -100,
                height: 0,
            })).to.throw();

            chai.expect(() => new GridLayout({
                height: 5.4
            })).to.throw();

            chai.expect(() => new GridLayout({
                dispersion: "6"
            })).to.throw();
            
            chai.expect(() => new GridLayout({
                dieSize: -9.5
            })).to.throw();

            chai.expect(() => new GridLayout({
                width: false
            })).to.throw();
            
            chai.expect(() => new GridLayout({
                dieSize: false
            })).to.throw();
        });
    });

    describe("#layout(dice)", function () {
        const dice = [new TopDie(), new TopDie(), new TopDie(), new TopDie(), new TopDie()];
        const grid = new GridLayout();

        it("should return an empty list when an empty list is supplied to layout", function () {
            chai.expect(grid.layout([])).to.be.empty;
        });

        it("should layout all dice", function () {
            const layoutDice = grid.layout(dice);
            chai.expect(layoutDice.length).to.equal(dice.length);
            for (const die of layoutDice) {
                chai.expect(die.coordinates.x).to.be.above(-1).and.to.be.below(DEFAULT_WIDTH);
                chai.expect(die.coordinates.y).to.be.above(-1).and.to.be.below(DEFAULT_HEIGHT);
                chai.expect(die.rotation).to.exist;
            }
        });
        
        it("should re-layout dice that are being held", function () {
            const player = new TopPlayer({name: "John", color: "red"});
            const notHoldDie = new TopDie();
            chai.expect(notHoldDie.isHeld()).to.be.false;

            grid.layout([notHoldDie]);
            chai.expect(notHoldDie.isHeld()).to.be.false;

            const firstCoordinates = notHoldDie.coordinates;
            const firstRotation = notHoldDie.rotation;
            
            chai.expect(firstCoordinates.x).to.be.above(-1).and.to.be.below(DEFAULT_WIDTH);
            chai.expect(firstCoordinates.y).to.be.above(-1).and.to.be.below(DEFAULT_HEIGHT);
            chai.expect(firstRotation).to.exist;

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
            chai.expect(numberOfCoordinatesEqualToTheFirstCoordinates).not.to.equal(NUMBER_OF_SAMPLES);
        });
        
        it("should not re-layout dice that are being held", function () {
            const player = new TopPlayer({name: "John", color: "red"});
            const holdDie = new TopDie({heldBy: player});
            chai.expect(holdDie.isHeld()).to.be.true;

            grid.layout([holdDie]);
            chai.expect(holdDie.isHeld()).to.be.true;

            const firstCoordinates = holdDie.coordinates;
            const firstRotation = holdDie.rotation;
            
            chai.expect(firstCoordinates.x).to.be.above(-1).and.to.be.below(DEFAULT_WIDTH);
            chai.expect(firstCoordinates.y).to.be.above(-1).and.to.be.below(DEFAULT_HEIGHT);
            chai.expect(firstRotation).to.exist;
            
            grid.layout([holdDie]);
            const secondCoords = holdDie.coordinates;
            const secondRotation = holdDie.rotation;
            chai.expect(firstCoordinates.x).to.equal(secondCoords.x);
            chai.expect(firstCoordinates.y).to.equal(secondCoords.y);
            chai.expect(firstRotation).to.equal(secondRotation);
        });


    });
    
    describe("#snapTo({x, y})", function () {
        const grid = new GridLayout({width: 500, height: 500, dieSize: 100})
        let c;

        it("should snap to coordinates of the cell closest to it", function () {
            c = grid.snapTo({x: 0, y: 0});
            chai.expect(c.x).to.equal(0);
            chai.expect(c.y).to.equal(0);

            c = grid.snapTo({x: 30, y: 40});
            chai.expect(c.x).to.equal(0);
            chai.expect(c.y).to.equal(0);

            c = grid.snapTo({x: -70, y: -10});
            chai.expect(c.x).to.equal(0);
            chai.expect(c.y).to.equal(0);

            c = grid.snapTo({x: 70, y: 70});
            chai.expect(c.x).to.equal(100);
            chai.expect(c.y).to.equal(100);

            c = grid.snapTo({x:150, y:312});
            chai.expect(c.x).to.equal(100);
            chai.expect(c.y).to.equal(300);

            c = grid.snapTo({x:151, y:312});
            chai.expect(c.x).to.equal(200);
            chai.expect(c.y).to.equal(300);
        });

        it("should return null if there is no meaningful closest cell", function () {
            c = grid.snapTo({x: -300, y: -300});
            chai.expect(c).to.be.null;
        });

        it("should return the next bet fit if the closest cell is already taken", function () {
            const die = new TopDie();
            const player = new TopPlayer({name: "test", color: "red"});
            die.coordinates = {x: 100, y: 100};
            die.holdIt(player);

            c = grid.snapTo({x: 70, y: 75});
            chai.expect(c.x).to.equal(100);
            chai.expect(c.y).to.equal(100);

            grid.layout([die]);
            c = grid.snapTo({x: 70, y: 75});
            chai.expect(c.x).to.equal(0);
            chai.expect(c.y).to.equal(100);
        });

        it("should return the current coordinates if the current cell is the best fit", function () {
            const die = new TopDie();
            const player = new TopPlayer({name: "test", color: "red"});
            die.coordinates = {x: 100, y: 100};
            die.holdIt(player);

            grid.layout([die]);
            c = grid.snapTo({die, x: 70, y: 75});
            chai.expect(c.x).to.equal(100);
            chai.expect(c.y).to.equal(100);
        });
    });
});
