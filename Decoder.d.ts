import { Maybe } from 'maybeasy';
import { Result } from 'resulty';
/**
 * A decoder function takes an object of any type and returns a Result
 */
export declare type DecoderFn<A> = (thing: any) => Result<string, A>;
/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
export default class Decoder<A> {
    private fn;
    constructor(fn: DecoderFn<A>);
    /**
     * Lifts any function up to operate on the value in the Decoder context.
     */
    map: <B>(f: (a: A) => B) => Decoder<B>;
    /**
     * Chains decoders together. Can be used when the value from a decoder is
     * needed to decode the rest of the data. For example, if you have a versioned
     * api, you can check the version number and then select an appropriate decoder
     * for the rest of the data.
     *
     * Also, chaining decoders is one way to build new types from decoded objects.
     */
    andThen: <B>(f: (a: A) => Decoder<B>) => Decoder<B>;
    /**
     * This is a special case of chaining. Like `andThen`, `assign` allows you
     * to combine several decoders. With `assign`, we build up an object (or scope)
     * internally. THe benefit is that is allows you to avoid and the nesting
     * and callback hell typically associated with using `andThen` to build objects.
     *
     * The idea for assign came from this blog:
     * https://medium.com/@dhruvrajvanshi/simulating-haskells-do-notation-in-typescript-e48a9501751c
     */
    assign: <K extends string, B>(k: K, other: Decoder<B> | ((a: A) => Decoder<B>)) => Decoder<A & { [k in K]: B; }>;
    /**
     * Inject a side-effectual operation in the middle of a Decoder chain.
     * This is a convenient mechanism for debugging decoders using console logging.
     * I don't reccomend using this mechanusm for making API calls, or anything complex
     * like that.
     */
    do: (fn: (a: A) => void) => Decoder<A>;
    /**
     * If a decoder fails, map over the failure message.
     */
    mapError: (f: (e: string) => string) => Decoder<A>;
    /**
     * If a decoder fails, use an alternative decoder.
     */
    orElse: (f: (e: string) => Decoder<A>) => Decoder<A>;
    /**
     * If a decoder fails, do something side-effectual
     */
    elseDo: (f: (e: string) => void) => Decoder<A>;
    /**
     * Run the current decoder on any value
     */
    decodeAny: (value: any) => Result<string, A>;
    /**
     * Parse the json string and run the current decoder on the resulting
     * value. Parse errors are returned in an Result.Err, as with any decoder
     * error.
     */
    decodeJson: (json: string) => Result<string, A>;
    /**
     * Returns a function that runs this docoder over any value when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    toAnyFn: () => (value: any) => Result<string, A>;
    /**
     * Returns a function that runs this decoder over a JSON string when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    toJsonFn: () => (json: string) => Result<string, A>;
}
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
export declare const succeed: <A>(value: A) => Decoder<A>;
/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
export declare const fail: <A>(message: string) => Decoder<A>;
/**
 * String decoder
 */
export declare const string: Decoder<string>;
/**
 * Number decoder
 */
export declare const number: Decoder<number>;
/**
 * Boolean decoder
 */
export declare const boolean: Decoder<boolean>;
/**
 * Date decoder.
 *
 * Date decoder expects a value that is a number or a string. It will then try
 * to construct a JavaScript date object from the value.
 */
export declare const date: Decoder<Date>;
/**
 * Applies the `decoder` to all of the elements of an array.
 */
export declare const array: <A>(decoder: Decoder<A>) => Decoder<A[]>;
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
export declare const field: <A>(name: string, decoder: Decoder<A>) => Decoder<A>;
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
export declare const at: <A>(path: (string | number)[], decoder: Decoder<A>) => Decoder<A>;
/**
 * Makes any decoder optional. Be aware that this can mask a failing
 * decoder because it makes any failed decoder result a nothing.
 */
export declare const maybe: <A>(decoder: Decoder<A>) => Decoder<Maybe<A>>;
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
export declare const nullable: <A>(decoder: Decoder<A>) => Decoder<Maybe<A>>;
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
export declare const oneOf: <A>(decoders: Decoder<A>[]) => Decoder<A>;
/**
 * Converts a JSON object to an array of key value pairs ((string, A)[]). The
 * passed in decoder is applied to the object value. The key will always be
 * converted to a string.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
export declare const keyValuePairs: <A>(decoder: Decoder<A>) => Decoder<[string, A][]>;
/**
 * Converts a JSON object to a Map<string, A>.
 *
 * I would reccomend using this as a decoder of last resort. For correctness, you are
 * probably better off using field decoders and explicitly declaring the shape of the
 * objects you are expecting.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
export declare const dict: <A>(decoder: Decoder<A>) => Decoder<Map<string, A>>;
