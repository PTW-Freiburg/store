/**
 * A function obtained by composing the argument functions from right to left.
 */
export type FunctionComposition = (...args:any[]) => any;

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * **For example, `compose(f, g, h)` is identical to doing
 * `(...args) => f(g(h(...args)))`.**
 */
export function compose(...funcs:Function[]) {
    return (...args):FunctionComposition => {
        if (funcs.length === 0) {
            return args[0];
        }

        const last = funcs[funcs.length - 1];
        const rest = funcs.slice(0, -1);
        return rest.reduceRight((composed, f) => f(composed), last(...args));
    };
}