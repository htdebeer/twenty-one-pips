//import {expect} from "chai";
import {Model} from "../src/Model.js";

// For now, the Model class acts as an empty base class for model classes such
// as Die and Player: it does not have any functionality.

describe("Model", function () {
    describe("Create a new Model", function () {
        it("Should not throw an error", function () {
            chai.expect(() => new Model()).to.not.throw();
        });
    });
});
