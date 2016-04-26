import { MiddlewareAPI, Middleware } from '../../src/applyMiddleware';

export const thunkMiddleware:Middleware =
    ({ dispatch, getState }:MiddlewareAPI<any>) => {
        return next => action => {
            if ( typeof action === 'function' ) {
                return action(dispatch, getState);
            }

            return next(action);
        };
    };