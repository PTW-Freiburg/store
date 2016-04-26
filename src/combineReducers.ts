/*!
 * Note this is almost a copy/paste of Redux's `combineReducers` method.
 * Redux makes sure that a reducer does not returns `undefined`.
 */
import { Reducer } from './reducer';

/**
 * A `ReducerMap` is a plain object that has `Reducer` methods as values.
 * Object keys represent independent parts of the state. The reducer will
 * be applied to the corresponding part.
 */
export interface ReducerMap {
    [name:string]:Reducer<any>
}


/**
 * The `combineReducers` helper function turns an object whose values are different
 * reducing functions (`Reducer`) into a single reducing function you can use to create
 * a store.
 *
 * The resulting `Reducer` calls every child reducer, and gathers their results into a
 * single state object. The shape of the state object matches the keys of the passed reducers.
 */
export function combineReducers<S extends Object> ( reducers:ReducerMap ):Reducer<S> {
    const reducer_keys = Object.keys(reducers);
    const final_reducers = {};

    if( !reducer_keys.length ) {
        throw new Error(`[ptw/store/combineReducers] Reducer object must have at least one key, got ${reducers}.`);
    }

    // Ignore keys that are not functions
    for (let i = 0; i < reducer_keys.length; i++) {
        const key = reducer_keys[i];
        if (typeof reducers[key] === 'function') {
            final_reducers[key] = reducers[key];
        }
    }

    const final_reducer_keys = Object.keys(final_reducers);

    return function combination ( state = <S>{}, action ):S {
        let has_changed = false;
        const next_state = {};

        for (let i = 0; i < final_reducer_keys.length; i++) {
            const key = final_reducer_keys[i];
            const reducer = final_reducers[key];
            const previous_state_for_key = state[key];
            const next_state_for_key = reducer(previous_state_for_key, action);

            next_state[key] = next_state_for_key;
            has_changed = has_changed || next_state_for_key !== previous_state_for_key;
        }

        return <S>(has_changed ? next_state : state);
    };
}