//import "jsdom-global/register";
import * as shim from "event-target-shim";
import {expect} from "chai";

global.EventTarget = window.EventTarget = shim.EventTarget;
