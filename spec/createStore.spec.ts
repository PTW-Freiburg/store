import * as Rx from 'rxjs';

import { ON_ACTION, OFF_ACTION, switchReducer } from './helpers/switch.helper';
import { thunkMiddleware as thunk } from './helpers/thunk.helper';

import { Action } from '../src/action';
import { Reducer } from '../src/reducer';
import { combineReducers } from '../src/combineReducers';
import { applyMiddleware, Middleware, MiddlewareAPI } from '../src/applyMiddleware';
import { createStore, Store, INIT_ACTION } from '../src/createStore';


describe('[createStore]', () => {
    let boolReducer:Reducer<boolean>;

    beforeEach(() => {
        boolReducer = jasmine.createSpy('boolReducer', switchReducer).and.callThrough();
    });


    // Class
    // ---------------
    describe('Class', () => {
        let store:Store<boolean, Action>;

        beforeEach(() => {
            store = createStore<boolean, Action>(boolReducer);
        });

        it('should be a factory function', () => {
            expect(createStore).toEqual(jasmine.any(Function));
        });

        it('shoulbd be possible to create new store', () => {
            expect(store instanceof Object).toBeTruthy();
        });

        it('should be possible to create store with a custom initial state', () => {
            store = createStore<boolean, Action>(boolReducer, true);
            expect(store.getState()).toEqual(true);
        });
    });


    // Dispatch
    // ---------------
    describe('Dispatch', () => {
        let store:Store<boolean, Action>;

        beforeEach(() => {
            store = createStore<boolean, Action>(boolReducer, false);
        });

        it('should invoke all reducers once with an init action', () => {
            expect(boolReducer).toHaveBeenCalledTimes(1);
            expect(boolReducer).toHaveBeenCalledWith( false, INIT_ACTION );
        });

        it('should expose a method to dispatch actions', () => {
            expect(store.dispatch).toEqual(jasmine.any(Function));
        });

        it('should invoke reducer when dispatching actions', () => {
            store.dispatch(ON_ACTION);
            expect(boolReducer).toHaveBeenCalledWith( false, ON_ACTION );
        });
    });


    // State
    // ---------------
    describe('State', () => {
        let store:Store<boolean, Action>;

        beforeEach(() => {
            store = createStore<boolean, Action>(boolReducer, false);
        });

        it('should expose a method to get current state', () => {
            expect(store.getState).toEqual(jasmine.any(Function));
        });

        it('should start with initial state', () => {
            expect(store.getState()).toEqual(false);
        });

        it('should start with initial state from reducers if no initial state was specified', () => {
            store = createStore<boolean, Action>(boolReducer);
            expect(boolReducer).toHaveBeenCalledWith(undefined, INIT_ACTION);
            expect(store.getState()).toEqual(false);
        });

        it('should always return current state', () => {
            const old_state = store.getState();
            store.dispatch(ON_ACTION);
            expect(store.getState()).toEqual(true);
            expect(store.getState()).not.toEqual(old_state);
        });

        it('should expose an obserable state stream', () => {
            expect(store.state$).toBeDefined();
            expect(store.state$ instanceof Rx.Observable).toBeTruthy();
            expect(store.state$ instanceof Rx.Subject).not.toBeTruthy();
        });

        it('should pass last/current state to new subscribers', () => {
            let subscription_1 = jasmine.createSpy('subscription_1');
            let subscription_2 = jasmine.createSpy('subscription_2');

            store.state$.subscribe(subscription_1);
            expect(subscription_1).toHaveBeenCalledWith(false);

            store.dispatch(ON_ACTION);
            store.state$.subscribe(subscription_2);

            expect(subscription_2).toHaveBeenCalledWith(true);
            expect(subscription_2).not.toHaveBeenCalledWith(false);
        });

        it('should broadcast state updates to all subscribers', () => {
            let subscription_1 = jasmine.createSpy('subscription_1');
            let subscription_2 = jasmine.createSpy('subscription_2');

            store.state$.subscribe(subscription_1);
            store.state$.subscribe(subscription_2);

            store.dispatch(ON_ACTION);
            expect(subscription_1).toHaveBeenCalledWith(true);
            expect(subscription_2).toHaveBeenCalledWith(true);
        });

        it('should not push new state if state hasn\'t changed', () => {
            let subscription = jasmine.createSpy('subscription');

            store.state$.subscribe(subscription);
            subscription.calls.reset();
            store.dispatch(OFF_ACTION);

            expect(subscription).not.toHaveBeenCalled();
        });
    });


    // Combine Reducers
    // ---------------
    describe('Combine Reducers', () => {
        interface AppState {
            counter:number;
            stack:string[];
        }

        let store:Store<AppState, Action>;
        const reducer = combineReducers<AppState>({
            counter: (state:number = 0, action:Action) =>
                action.type === 'increment' ? state + 1 : state,
            stack: (state:string[] = [], action:Action) =>
                action.type === 'push' ? [ ...state, action.payload ] : state
        });

        beforeEach(() => {
            store = createStore<AppState, Action>(reducer);
        });

        it('should initialize an object \w the reducer defaults', () => {
            expect(store.getState()).toEqual({ counter: 0, stack: [] });
        });

        it('should be possible to initialize with an initial state', () => {
            store = createStore<AppState, Action>(reducer, { counter: 10, stack: ['a'] });
            expect(store.getState()).toEqual({ counter: 10, stack: ['a'] });
        });

        it('should correctly update partial state', () => {
            store.dispatch({ type: 'increment' });
            expect(store.getState()).toEqual({ counter: 1, stack: [] });

            store.dispatch({ type: 'push', payload: 'foo' });
            expect(store.getState()).toEqual({ counter: 1, stack: ['foo'] });
        });

        it('should emit the complete application sate', () => {
            const subscriber = jasmine.createSpy('subscriber');
            store.state$.subscribe(subscriber);
            store.dispatch({ type: 'increment' });

            expect(subscriber).toHaveBeenCalledWith({ counter: 1, stack: [] });
        });
    });


    // Subscribe
    // ---------------
    describe('Subscribe', () => {
        let store:Store<boolean, Action>;

        beforeEach(() => {
            store = createStore<boolean, Action>(boolReducer, false);
        });

        it('should expose a method to subscribe', () => {
            expect(store.subscribe).toEqual(jasmine.any(Function));
        });

        it('should invoke listener whenever state tree changed', () => {
            const listener = jasmine.createSpy('listener');
            store.subscribe(listener);
            listener.calls.reset();

            store.dispatch(ON_ACTION);
            store.dispatch(OFF_ACTION);
            store.dispatch(OFF_ACTION);

            expect(listener.calls.allArgs()).toEqual([[true], [false]]);
        });

        it('should be a convenience method for "store.state$.subscribe"', () => {
            const listener = state => state;
            spyOn( store.state$, 'subscribe').and.callThrough();
            store.subscribe(listener);

            expect(store.state$.subscribe).toHaveBeenCalledTimes(1);
            expect(store.state$.subscribe).toHaveBeenCalledWith(listener);
        });

        it('should return an function to unsubscribe', () => {
            const listener = jasmine.createSpy('listener');
            const unsubscribe = store.subscribe(listener);
            listener.calls.reset();

            store.dispatch(ON_ACTION);
            expect(listener.calls.allArgs()).toEqual([[true]]);

            unsubscribe();
            store.dispatch(OFF_ACTION);
            expect(listener.calls.allArgs()).toEqual([[true]]);
        });
    });


    // Replace Reducer
    // ---------------
    describe('Replace Reducer', () => {
        let store:Store<string[], Action>;

        const pusher = jasmine.createSpy('pusher')
            .and.callFake(( state = [], action ) => {
                if ( action.type === 'ADD' ) {
                    return [...state, action.payload];
                }
                return state;
            });

        const shifter = jasmine.createSpy('shifter')
            .and.callFake(( state = [], action ) => {
                if ( action.type === 'ADD' ) {
                    return [action.payload, ...state];
                }
                return state;
            });

        beforeEach(() => {
            store = createStore<string[], Action>(pusher as Reducer<string[]>);
            pusher.calls.reset();
            shifter.calls.reset();
        });

        it('should expose a method to replace current reducer with a new one', () => {
            expect(store.replaceReducer).toEqual(jasmine.any(Function));
        });

        it('should be possible to replace a reducer with a new one', () => {
            store.dispatch({ type: 'ADD', payload: 'a' });
            store.dispatch({ type: 'ADD', payload: 'b' });

            store.replaceReducer(shifter);
            store.dispatch({ type: 'ADD', payload: 'c' });

            expect(pusher).toHaveBeenCalledWith([], { type: 'ADD', payload: 'a' });
            expect(pusher).toHaveBeenCalledWith(['a'], { type: 'ADD', payload: 'b' });

            expect(shifter).toHaveBeenCalledWith(['a', 'b'], { type: 'ADD', payload: 'c' });
            expect(store.getState()).toEqual(['c', 'a', 'b']);
        });
    });


    // Select
    // ---------------
    describe('Select', () => {
        interface Route {
            name: string;
            length: number;
            poi: string[];
        }

        // Reducer
        const name:Reducer<string> = ( state = 'Route', action ) => {
            if ( action.type === 'CHANGE_NAME' ) {
                return action.payload;
            }
            return state;
        };
        const length:Reducer<number> = ( state = 0, action ) => {
            if ( action.type === 'SET_LENGTH' ) {
                return action.payload;
            }
            return state;
        };
        const poi:Reducer<string[]> = ( state = [], action ) => {
            if ( action.type === 'ADD_POI' ) {
                return [...state, action.payload];
            }
            return state;
        };

        // Store
        const reducer = combineReducers<Route>({ name, length, poi });
        let store:Store<Route, Action>;
        let spy:jasmine.Spy;

        beforeEach(() => {
            store = createStore<Route, Action>(reducer);
            spy = jasmine.createSpy('listener');
        });

        it('should expose a method to select a branch of the state stree', () => {
            expect(store.select).toEqual(jasmine.any(Function));
        });

        it('should be possible to select branch by key', () => {
            store.select('name').subscribe(spy);
            expect(spy).toHaveBeenCalledWith('Route');

            spy.calls.reset();
            store.dispatch({ type: 'CHANGE_NAME', payload: 'My Trip to Honolulu'});
            expect(spy).toHaveBeenCalledWith('My Trip to Honolulu');
        });

        it('should be possible to select branch by key array', () => {
            store.select(['name', 'length']).subscribe(spy);
            expect(spy).toHaveBeenCalledWith({ name:'Route', length: 0 });

            spy.calls.reset();
            store.dispatch({ type: 'SET_LENGTH', payload: 10000 });
            expect(spy).toHaveBeenCalledWith({ name:'Route', length: 10000 });

            spy.calls.reset();
            store.dispatch({ type: 'CHANGE_NAME', payload: 'My Trip to Honolulu'});
            expect(spy).toHaveBeenCalledWith({ name:'My Trip to Honolulu', length: 10000 });
        });

        it('should be possible to select branch by custom function', () => {
            store.select((state:Route) => state.poi[state.poi.length - 1]).subscribe(spy);
            expect(spy).toHaveBeenCalledWith(undefined);

            spy.calls.reset();
            store.dispatch({ type: 'ADD_POI', payload: 'Waikīkī' });
            expect(spy).toHaveBeenCalledWith('Waikīkī');

            spy.calls.reset();
            store.dispatch({ type: 'ADD_POI', payload: 'ʻIolani Palace' });
            expect(spy).toHaveBeenCalledWith('ʻIolani Palace');
        });

        it('should not pass new value to "select stream" if value didn\'t change', () => {
            store.select('name').subscribe(spy);

            spy.calls.reset();
            store.dispatch({ type: 'CHANGE_NAME', payload: 'Route'});
            expect(spy).not.toHaveBeenCalled();
        });
    });


    // Middleware
    // ---------------
    describe('Middleware', () => {
        type Thunky = Action | Function;
        let store:Store<number, Thunky>;
        const async_spy = jasmine.createSpy('async');
        const action_spy = jasmine.createSpy('action');
        const state_spy = jasmine.createSpy('current_state');

        // Actions
        const INCREMENT_COUNTER = 'INCREMENT_COUNTER';

        function increment() {
            return {
                type: INCREMENT_COUNTER
            };
        }

        function incrementAsync() {
            return dispatch => {
                async_spy();
                setTimeout(() => {
                    dispatch(increment());
                }, 10);
            };
        }

        // Reducer
        function counter (state:number = 0, action:Action) {
            if ( action.type === INCREMENT_COUNTER ) {
                return state + 1;
            }
            return state;
        }

        // Middlware
        const logger:Middleware =
            function logger ({ getState }:MiddlewareAPI<number>)  {
                return next => action => {
                    action_spy(action);
                    state_spy('BEFORE', getState());
                    let result = next(action);
                    state_spy('AFTER', getState());
                    return result;
                };
            };

        beforeEach(() => {
            store = createStore<number, Thunky>(counter, 0, applyMiddleware<number, Thunky>(thunk, logger));
        });

        afterEach(() => {
            action_spy.calls.reset();
            state_spy.calls.reset();
        });


        it('should initialize store after middleware is applied', () => {
            expect(action_spy).toHaveBeenCalledWith(INIT_ACTION);
        });


        it('should work with async middleware (aka thunk)', done => {
            store = createStore<number, Thunky>(counter, 0, applyMiddleware<number, Thunky>(thunk));
            store.dispatch(incrementAsync());
            setTimeout( () => {
                expect(async_spy).toHaveBeenCalledTimes(1);
                done();
            }, 50);
        });


        it('should correctly dispatch actions to middleware', done => {
            store.dispatch(increment());
            store.dispatch(incrementAsync());
            setTimeout( () => {
                expect(state_spy.calls.allArgs())
                    .toEqual([
                        // INIT
                        ['BEFORE', 0],
                        ['AFTER', 0],

                        // INCREMENT
                        ['BEFORE', 0],
                        ['AFTER', 1],

                        // INCREMENT ASYNC
                        ['BEFORE', 1],
                        ['AFTER', 2]
                    ]);
                expect(action_spy.calls.allArgs())
                    .toEqual([
                        [INIT_ACTION],
                        [increment()],
                        [increment()]
                    ]);

                done();
            }, 50);
        });

    });
});