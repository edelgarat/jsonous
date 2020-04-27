"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var maybeasy_1 = require("maybeasy");
var resulty_1 = require("resulty");
var ErrorStringify_1 = require("./Internal/ErrorStringify");
/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
var Decoder = /** @class */ (function () {
    function Decoder(fn) {
        var _this = this;
        this.fn = fn;
        /**
         * Lifts any function up to operate on the value in the Decoder context.
         */
        this.map = function (f) {
            return new Decoder(function (value) {
                return _this.fn(value).map(f);
            });
        };
        /**
         * Chains decoders together. Can be used when the value from a decoder is
         * needed to decode the rest of the data. For example, if you have a versioned
         * api, you can check the version number and then select an appropriate decoder
         * for the rest of the data.
         *
         * Also, chaining decoders is one way to build new types from decoded objects.
         */
        this.andThen = function (f) {
            return new Decoder(function (value) {
                return _this.fn(value).andThen(function (v) { return f(v).decodeAny(value); });
            });
        };
        /**
         * This is a special case of chaining. Like `andThen`, `assign` allows you
         * to combine several decoders. With `assign`, we build up an object (or scope)
         * internally. THe benefit is that is allows you to avoid and the nesting
         * and callback hell typically associated with using `andThen` to build objects.
         *
         * The idea for assign came from this blog:
         * https://medium.com/@dhruvrajvanshi/simulating-haskells-do-notation-in-typescript-e48a9501751c
         */
        this.assign = function (k, other) {
            return _this.andThen(function (a) {
                var decoder = other instanceof Decoder ? other : other(a);
                return decoder.map(function (b) {
                    var _a;
                    return (__assign({}, Object(a), (_a = {}, _a[k.toString()] = b, _a)));
                });
            });
        };
        /**
         * Inject a side-effectual operation in the middle of a Decoder chain.
         * This is a convenient mechanism for debugging decoders using console logging.
         * I don't reccomend using this mechanusm for making API calls, or anything complex
         * like that.
         */
        this.do = function (fn) {
            return _this.map(function (v) {
                fn(v);
                return v;
            });
        };
        /**
         * If a decoder fails, map over the failure message.
         */
        this.mapError = function (f) {
            return new Decoder(function (value) {
                return _this.fn(value).mapError(f);
            });
        };
        /**
         * If a decoder fails, use an alternative decoder.
         */
        this.orElse = function (f) {
            return new Decoder(function (value) {
                return _this.fn(value).orElse(function (e) { return f(e).decodeAny(value); });
            });
        };
        /**
         * If a decoder fails, do something side-effectual
         */
        this.elseDo = function (f) {
            return new Decoder(function (value) {
                return _this.fn(value).elseDo(f);
            });
        };
        /**
         * Run the current decoder on any value
         */
        this.decodeAny = function (value) { return _this.fn(value); };
        /**
         * Parse the json string and run the current decoder on the resulting
         * value. Parse errors are returned in an Result.Err, as with any decoder
         * error.
         */
        this.decodeJson = function (json) {
            try {
                var value = JSON.parse(json);
                return _this.decodeAny(value);
            }
            catch (e) {
                return resulty_1.err(e.message);
            }
        };
        /**
         * Returns a function that runs this docoder over any value when called.
         * This is a convenient way to convert a decoder into a callback.
         */
        this.toAnyFn = function () {
            return function (value) { return _this.decodeAny(value); };
        };
        /**
         * Returns a function that runs this decoder over a JSON string when called.
         * This is a convenient way to convert a decoder into a callback.
         */
        this.toJsonFn = function () {
            return function (json) { return _this.decodeJson(json); };
        };
    }
    return Decoder;
}());
exports.default = Decoder;
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
exports.succeed = function (value) { return new Decoder(function (_) { return resulty_1.ok(value); }); };
/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
exports.fail = function (message) {
    return new Decoder(function (_) { return resulty_1.err(message); });
};
/**
 * String decoder
 */
// tslint:disable-next-line:variable-name
exports.string = new Decoder(function (value) {
    if (typeof value !== 'string') {
        var stringified = ErrorStringify_1.stringify(value);
        var errorMsg = "I expected to find a string but instead I found " + stringified;
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Number decoder
 */
// tslint:disable-next-line:variable-name
exports.number = new Decoder(function (value) {
    if (typeof value !== 'number') {
        var errorMsg = "I expected to find a number but instead I found " + ErrorStringify_1.stringify(value);
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Boolean decoder
 */
// tslint:disable-next-line:variable-name
exports.boolean = new Decoder(function (value) {
    if (typeof value !== 'boolean') {
        var errorMsg = "I expected to find a boolean but instead found " + ErrorStringify_1.stringify(value);
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Date decoder.
 *
 * Date decoder expects a value that is a number or a string. It will then try
 * to construct a JavaScript date object from the value.
 */
exports.date = new Decoder(function (value) {
    var errMsg = function (v) {
        return "I expected a date but instead I found " + ErrorStringify_1.stringify(v);
    };
    return resulty_1.ok(value)
        .andThen(function (s) { return exports.string.map(function (v) { return new Date(v); }).decodeAny(s); })
        .orElse(function (n) { return exports.number.map(function (v) { return new Date(v); }).decodeAny(n); })
        .andThen(function (d) { return (isNaN(d.getTime()) ? resulty_1.err(value) : resulty_1.ok(d)); })
        .mapError(function () { return errMsg(value); });
});
/**
 * Applies the `decoder` to all of the elements of an array.
 */
exports.array = function (decoder) {
    return new Decoder(function (value) {
        if (!(value instanceof Array)) {
            var errorMsg = "I expected an array but instead I found " + ErrorStringify_1.stringify(value);
            return resulty_1.err(errorMsg);
        }
        var result = resulty_1.ok([]);
        var _loop_1 = function (idx) {
            result = decoder
                .decodeAny(value[idx])
                .andThen(function (v) { return result.map(function (vs) { return vs.concat([v]); }); })
                .mapError(function (e) { return "I found an error in the array at [" + idx + "]: " + e; });
            if (result instanceof resulty_1.Err) {
                return "break";
            }
        };
        for (var idx = 0; idx < value.length; idx++) {
            var state_1 = _loop_1(idx);
            if (state_1 === "break")
                break;
        }
        return result;
    });
};
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
exports.field = function (name, decoder) {
    return new Decoder(function (value) {
        var errorMsg = function () {
            var stringified = ErrorStringify_1.stringify(value);
            var msg = "I expected to find an object with key '" + name + "' but instead I found " + stringified;
            return resulty_1.err(msg);
        };
        if (value == null) {
            return errorMsg();
        }
        if (!value.hasOwnProperty(name)) {
            return errorMsg();
        }
        var v = value[name];
        return decoder
            .decodeAny(v)
            .mapError(function (e) {
            return "I found an error in the field named '" + name + "' of " + ErrorStringify_1.stringify(value) + ": " + e;
        });
    });
};
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
exports.at = function (path, decoder) {
    return new Decoder(function (value) {
        if (value == null) {
            return resulty_1.err("I found an error. Could not apply 'at' path to an undefined or null value.");
        }
        var val = value;
        var idx = 0;
        while (idx < path.length) {
            val = val[path[idx]];
            if (val == null) {
                var pathStr = ErrorStringify_1.stringify(path.slice(0, idx + 1));
                var valueStr = ErrorStringify_1.stringify(value);
                return resulty_1.err("I found an error in the 'at' path. I could not find path '" + pathStr + "' in " + valueStr);
            }
            idx += 1;
        }
        return decoder.decodeAny(val);
    });
};
/**
 * Makes any decoder optional. Be aware that this can mask a failing
 * decoder because it makes any failed decoder result a nothing.
 */
exports.maybe = function (decoder) {
    return new Decoder(function (value) {
        return decoder.decodeAny(value).cata({
            Err: function (e) { return resulty_1.ok(maybeasy_1.nothing()); },
            Ok: function (v) { return resulty_1.ok(maybeasy_1.just(v)); },
        });
    });
};
/**
 * Decodes possibly null or undefined values into types.
 * There is overlap between `nullable` and `maybe` decoders.
 * The difference is that `maybe` will always succeed, even if
 * there is an error in the decoder.
 *
 * Maybe example:
 *
 *     maybe(string).decodeAny('foo') // => Ok('foo')
 *     maybe(string).decodeAny(null)  // => Ok(Nothing)
 *     maybe(string).decodeAny(42)    // => Ok(Nothing)
 *
 * Nullable example:
 *
 *     nullable(string).decodeAny('foo') // => Ok('foo')
 *     nullable(string).decodeAny(null)  // => Ok(Nothing)
 *     nullable(string).decodeAny(42)    // => Err...
 */
exports.nullable = function (decoder) {
    return new Decoder(function (value) {
        if (value == null) {
            return resulty_1.ok(maybeasy_1.nothing());
        }
        return decoder.decodeAny(value).map(maybeasy_1.just);
    });
};
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
exports.oneOf = function (decoders) {
    return new Decoder(function (value) {
        if (decoders.length === 0) {
            return resulty_1.err('No decoders specified.');
        }
        var result = decoders.reduce(function (memo, decoder) {
            return memo.orElse(function (err1) {
                return decoder.decodeAny(value).mapError(function (err2) { return err1 + "\n" + err2; });
            });
        }, resulty_1.err(''));
        return result.mapError(function (m) { return "I found the following problems:\n" + m; });
    });
};
/**
 * Converts a JSON object to an array of key value pairs ((string, A)[]). The
 * passed in decoder is applied to the object value. The key will always be
 * converted to a string.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
exports.keyValuePairs = function (decoder) {
    return new Decoder(function (value) {
        if (typeof value !== 'object' || value === null || value instanceof Array) {
            return resulty_1.err("Expected to find an object and instead found '" + ErrorStringify_1.stringify(value) + "'");
        }
        return Object.keys(value).reduce(function (memo, key) {
            return memo.andThen(function (pairs) {
                return decoder
                    .decodeAny(value[key])
                    .mapError(function (err) { return "Key '" + key + "' failed to decode: " + err; })
                    .map(function (v) { return pairs.concat([[key, v]]); });
            });
        }, resulty_1.ok([]));
    });
};
/**
 * Converts a JSON object to a Map<string, A>.
 *
 * I would reccomend using this as a decoder of last resort. For correctness, you are
 * probably better off using field decoders and explicitly declaring the shape of the
 * objects you are expecting.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
exports.dict = function (decoder) {
    return exports.keyValuePairs(decoder).map(function (pairs) {
        return pairs.reduce(function (memo, _a) {
            var key = _a[0], value = _a[1];
            memo.set(key, value);
            return memo;
        }, new Map());
    });
};
//# sourceMappingURL=Decoder.js.map