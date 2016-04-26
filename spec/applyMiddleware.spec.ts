// NOTE: We are using Redux's spec here to test if our implementation is conform with it.

import { switchReducer, ON_ACTION, OFF_ACTION, asyncOn } from './helpers/switch.helper';
import { thunkMiddleware as thunk } from './helpers/thunk.helper';

import { Action } from '../src/action';
import { createStore } from '../src/createStore';

import { applyMiddleware } from '../src/applyMiddleware';

type Thunky = Action|Function;

describe('[applyMiddleware]', () => {

    it('should wrap dispatch with middleware once', () => {
        function test (spy:jasmine.Spy) {
            return methods => {
                spy(methods);
                return next => action => next(action);
            };
        }

        const methods_spy = jasmine.createSpy('methods');
        const store = applyMiddleware<Boolean, Action>(test(methods_spy))(createStore)(switchReducer);

        store.dispatch(ON_ACTION);
        store.dispatch(OFF_ACTION);

        expect(methods_spy).toHaveBeenCalledTimes(1);
        expect(Object.keys(methods_spy.calls.first().args[0]))
            .toEqual([ 'getState', 'dispatch' ]);
        expect(store.getState()).toEqual(false);
    });

    it('passes recursive dispatches through the middleware chain', done => {
        function test (spy:jasmine.Spy) {
            return () => next => action => {
                spy(action);
                return next(action);
            };
        }

        const spy = jasmine.createSpy('middleware');
        const store = applyMiddleware<Boolean, Thunky>(test(spy), thunk)(createStore)(switchReducer);

        store.dispatch(asyncOn());
        setTimeout(() => {
            expect(spy.calls.count()).toEqual(2);
            done();
        }, 5);
    });
});