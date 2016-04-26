import { Action } from './action';

/**
 * A `Reducer` is a function that may mutate the current state tree based
 * on current `state` and the dispatched `action`. It will return a new state
 * tree.
 *
 * **IMPORTANT: Reducers must be pure functions! So no side effects allowed!**
 *
 * @export
 * @template S state object type.
 */
export interface Reducer<S> {
    (state: S, action: Action): S;
}