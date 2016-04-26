import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/multicast';

import { isPlainAction, Action } from './action';
import { Reducer } from './reducer';
import { applyMiddleware, Middleware, MiddlewareAPI, StoreEnhancer } from './applyMiddleware';


/**
 * A `Dispatcher` is a function that accepts and action
 * from type `A|Action`. The action will be dispatched to
 * the store.
 *
 * @returns The same action object dispatched.
 */
export interface Dispatcher<A> {
    (action:A|Action): A|Action;
};


/**
 * A `StoreListener` is a function that is called with
 * the store's current state tree.
 */
export interface StoreListener<S> {
    (state:S): any
};


/**
 * A function to deregister the listener from the store.
 */
export interface Unsubscribe {
    (): void;
}


/**
 * A `Store` is an object that holds the application’s state tree.
 * There should only be a single store in any app, as the composition
 * happens on the reducer level.
 *
 * @template S State object type.
 *
 * @template A Action type(s).
 */
export interface Store<S, A> {
    /**
     * Public `Obsercable` that represents the store's state tree.
     * Use it
     *
     * - if you're only interested in certrain branches of the state tree,
     * - if you want to do additional transformation before usind the `Obserable` or
     * - if you just want to `subscribe()` to state changes.
     */
    state$: ConnectableObservable<S>;

    /**
     * Get the state tree managed by the store. Note that
     * the state is immutable. You only will get a copy of the
     * managed state.
     *
     * @returns The current state tree.
     */
    getState(): S;

    /**
     * Dispatches an action. This is the only way to mutate the store's state.
     *
     * The `reducer` function (specified when creating the sotre) will be called
     * and may mutate the current state tree based on `state` and the given
     * `action`. The reulst will be the *next* state tree.
     *
     * Wihtout any `Middleware` only plain action objects are supported. If you want
     * to dispatch a Promise, an Observable, a thunk, or something else, you
     * need to apply additional middleware to the store.
     */
    dispatch:Dispatcher<A|Action>;

    /**
     * Adds a change listener to the store that is invoked whenever the state tree has changed.
     * This is the short form for `store.state$.subscribe()`.
     *
     * Note that you will not get the `Subscription` but rather the `unsubscribe()` returned
     * from using subscribe. If you want to do something with the subscritpion use the `state$`
     * directly.
     *
     * @param listener Change listener, invoked every time the state tree changed.
     * @returns A function to deregister the listener.
     */
    subscribe(listener:StoreListener<S>): Unsubscribe;

    /**
     * Replaces the currently used reducer with a new one.
     *
     * @param new_reducer The newreducer the store needs to use.
     */
    replaceReducer(new_reducer:Reducer<S>): void;

    /**
     * Selects a partial branch of the state tree, specified by the fiven input. This is a handy
     * method if you are only interested in section of the state tree and do not to manually
     * transform the `store.state$`.
     *
     * Allowed arguments include `string`, `symbol` or `number`. You will get the respective
     * branch of the state tree. If you want more than one branch pass in an `array` that contains
     * the branch names. It you want to execute a complexer filter operation, pass in a `function`.
     */
    select<T>( selector:string|symbol|number|(string|symbol|number)[]|((state:S)=>T) ): Observable<T>;
}


/**
 * Action dispatch when a store is initialized.
 * **Do not use this to reset the store.**
 */
export const INIT_ACTION:Action = { type: '@@ptw/store/INIT' };


/**
 * Test if given argument is a plain action. Throw an `Error` if
 * it isn't.
 *
 * @param action The thing to test.
 *
 * @returns Whether the given argument is a plain action.
 */
function validatePlainAction ( action:any ) {
    const isPlain:boolean = isPlainAction(action);
    if( !isPlain ) {
        throw new Error(`[ptw/store] Expected "action" to be an Object with a "type" property, got ${action}.`);
    }
    return isPlain;
}


/**
 * Creates a `Store` without any middleware/enchancers applied to it.
 */
function createPlainStore<S,A> ( reducer:Reducer<S>, initialState:S ) {
    const _state$ = new BehaviorSubject<S>(initialState);
    const dispatcher$ = new Subject<any>();
    let current_reducer = reducer;

    // Create a `$state` stream that will be exposed as part of the store.
    //
    // - will apply `current_reducer` to emited values
    // - will ignore non-plain actions and throw an error
    const state$ = dispatcher$
        .filter((action:any) => validatePlainAction(action))
        .map((action:Action) => current_reducer(getState(), action))
        .distinctUntilChanged()
        .multicast(_state$);

    function getState () {
        return _state$.value;
    }

    function replaceReducer ( new_reducer:Reducer<S> ) {
        current_reducer = new_reducer;
        dispatch(INIT_ACTION);
    }

    function dispatch ( action:A|Action ) {
        dispatcher$.next(action);
        return action;
    }

    function subscribe ( listener:StoreListener<S> ) {
        const subscriber = state$.subscribe( listener );
        return () => subscriber.unsubscribe();
    }

    function select<T> ( selector:string|symbol|number|(string|symbol|number)[]|((state:S)=>T) ) {
        let selectFn:(state:S)=>T;

        // Array ?
        if ( Array.isArray(selector) ) {
            selectFn = state => selector.reduce((o, key) => {
                o[key] = state[key];
                return o;
            }, {}) as T;
        }

        // Function ?
        else if ( typeof selector === 'function' ) {
            selectFn = selector;
        }

        // Its a string|symbol|number.
        else {
            selectFn = state => state[selector];
        }

        return state$
            .map(selectFn)
            .distinctUntilChanged();
    }

    // Start listening to the `dispatcher$` stream.
    state$.connect();

    return {
        state$,
        getState,
        replaceReducer,
        dispatch,
        subscribe,
        select
    };
}


/**
 * Create a new `store` that holds the state tree.
 *
 * There should only be one store in an application. To specify how different
 * parts of the state tree respond to actions, combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param reducer A function that returns the next state tree, given the
 *   current state tree and the action to handle.
 *
 * @param [initialState] The initial state. You may optionally specify it to
 *   hydrate the state from the server in universal apps, or to restore a
 *   previously serialized user session. If you use `combineReducers` to
 *   produce the root reducer function, this must be an object with the same
 *   shape as `combineReducers` keys.
 *
 * @param [enhancer] The store enhancer. You may optionally specify it to
 *   enhance the store with third-party capabilities such as middleware, time
 *   travel, persistence, etc.
 *
 * @template S The state tree.
 *
 * @template S Allowed action types.
 */
export function createStore<S, A> ( reducer:Reducer<S>, initialState?:S ):Store<S, A>;
export function createStore<S, A> ( reducer:Reducer<S>, initialState?:StoreEnhancer<S, A> ):Store<S, A>;
export function createStore<S, A> ( reducer:Reducer<S>, initialState:S, enhancer?:StoreEnhancer<S, A> ):Store<S, A>;
export function createStore<S, A> ( reducer:Reducer<S>, initialState?:(S|StoreEnhancer<S, A>), enhancer?:StoreEnhancer<S, A> ):Store<S, A> {
    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
        enhancer = initialState as StoreEnhancer<S, A>;
        initialState = undefined;
    }

    const factory = enhancer ? enhancer(createPlainStore) : createPlainStore;
    const store = factory<S, A>(reducer, <S>initialState);

    // Initialize the store after all middleware is applied.
    // This will populate the initial state tree, b/c `reducer` will mutate
    // the current state or if no `initialState` is set, build it by using the
    // default value of the `reducer`.
    store.dispatch(INIT_ACTION);

    return store;
}