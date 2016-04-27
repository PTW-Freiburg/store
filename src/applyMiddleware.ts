import { Store, Dispatcher } from './createStore';
import { Reducer } from './reducer';
import { Action } from './action';
import { compose, FunctionComposition } from './compose';


/**
 * A store enhancer is a higher-order function that composes a store creator
 * to return a new, enhanced store creator. This is similar to middleware in
 * that it allows you to alter the store interface in a composable way.
 */
export interface StoreEnhancer<S, A> {
    (next: StoreEnhancerFactory<S, A>): StoreEnhancerFactory<S, A>;
}
export interface StoreEnhancerFactory<S, A> {
    (reducer: Reducer<S>, initialState?: S): Store<S, A>;
}


/**
 * In order to have *smart* middlewares `dispatch()` and `getState()` is always
 * exposed to them.
 */
export interface MiddlewareAPI<S> {
    dispatch:Dispatcher<any>;
    getState(): S
}


/**
 * A middleware is a higher-order function that composes a dispatch function
 * to return a new dispatch function. It often turns async actions into
 * actions.
 *
 * Middleware is composable using function composition. It is useful for
 * logging actions, performing side effects like routing, or turning an
 * asynchronous API call into a series of synchronous actions.
 */
export interface Middleware {
    <S, A>(api: MiddlewareAPI<S>): (next: Dispatcher<A>) => Dispatcher<A>;
}


/**
 * Creates a store enhancer that applies middleware to the store's dispatch method.
 * This is handy for a variety of tasks, such as expressing asynchronous actions in
 * a concise manner, or logging every action payload.
 *
 * If you want to use asynchronous actions the middleware that handles those actions
 * should be the first store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState`
 * functions as named arguments.
 *
 * @param middlewares The middleware chain to be applied.
 *
 * @returns A store enhancer applying the middleware.
 */
export function applyMiddleware<S, A> ( ...middlewares:Middleware[] ):StoreEnhancer<S, A> {
    return (createStore) => ( reducer:Reducer<S>, initialState?:S ) => {
        const store = createStore(reducer, initialState);
        let dispatch = store.dispatch;
        const api:MiddlewareAPI<S> = {
            getState: store.getState,
            dispatch: (action) => dispatch(action)
        };

        const chain = middlewares.map(middleware => middleware(api));
        dispatch = compose(...chain)(store.dispatch);

        return Object.assign( store, { dispatch } );
    };
}