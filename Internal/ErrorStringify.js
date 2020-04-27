"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("weakset");
/*
 * Based on this code: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 */
var cyclicalReferenceReplacer = function () {
    var seen = new WeakSet();
    return function (_, value) {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Cyclical Reference]';
            }
            seen.add(value);
        }
        return value;
    };
};
exports.stringify = function (value) { return JSON.stringify(value, cyclicalReferenceReplacer()); };
//# sourceMappingURL=ErrorStringify.js.map