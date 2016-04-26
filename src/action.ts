/**
 * An `Action` is a plain object that represents an intention to change
 * the state. Actions are the only way to send data to the store and emit
 * a state change.
 *
 * Actions must have a `type` field that indicates the type of action being
 * performed. Types can be defined as constants and imported from another
 * module. It’s better to use strings for `type` than Symbols because strings
 * are serializable.
 *
 * If you need additional data to process an action use the `payload` property.
 * Extend `Action` to specify the `payload` and have intellisense inside a
 * `Reducer`.
 *
 * @export
 */
export interface Action {
    type: string | symbol;
    payload?: any;
}

/**
 * Test whether an input is a plain action. This means it has to be an
 * object with a `type` property.
 *
 * @export
 * @param {*} action Thing under test.
 * @returns Whether the input is a plain action.
 */
export function isPlainAction ( action:any ) {
    return !!action && typeof action === 'object' && !!action.type;
}