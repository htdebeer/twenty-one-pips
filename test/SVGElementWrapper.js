import "jsdom-global/register";
import {expect} from "chai";
import {SVGNS, SVGElementWrapper} from "../src/SVGElementWrapper.js";

describe("SVGElementWrapper", function () {
    describe("create a new SVGElementWrapper around a G element", function () {
        it("should have wrapped a G element", function () {
            const svgElt = document.createElementNS(SVGNS, "g");
            const wrappedSvgElt = new SVGElementWrapper(svgElt);
            expect(wrappedSvgElt.element.nodeName).to.equal("g");
        });
    });
});

