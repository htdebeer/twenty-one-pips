import "jsdom-global/register";
import {expect} from "chai";
import {ViewController} from "../src/ViewController.js";

describe("ViewController", function () {
    describe("create a new ViewController", function () {
        it("should have created a HTMLDivElement", function () {
            const v = new ViewController();
            expect(v.element).to.be.an.instanceof(HTMLDivElement);
        });
    });
});
