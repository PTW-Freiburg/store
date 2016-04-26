// Note spec conforms almost the Redux's test suite.
import { Action } from '../src/action';
import { combineReducers } from '../src/combineReducers';

interface Counter {
    counter?:number;
    stack?:string[];
}

describe('[combineReducers]', () => {

    it('should be a function', () => {
        expect(combineReducers).toEqual(jasmine.any(Function));
    });

    it('should return a composite reducer that maps the state keys to given reducers ', () => {
        const reducer = combineReducers<Counter>({
            counter: (state = 0, action) =>
                action.type === 'increment' ? state + 1 : state,
            stack: (state = [], action) =>
                action.type === 'push' ? [ ...state, action.payload ] : state
        });

        const s1 = reducer({}, { type: 'increment' });
        expect(s1).toEqual({ counter: 1, stack: [] });

        const s2 = reducer(s1, { type: 'push', payload: 'a' });
        expect(s2).toEqual({ counter: 1, stack: [ 'a' ] });
    });

    it('should allow a symbol to be used as an action type', () => {
        const increment = Symbol('INCREMENT');

        const reducer = combineReducers<Counter>({
            counter(state:number = 0, action:Action) {
                switch (action.type) {
                    case increment:
                        return state + 1;
                    default:
                        return state;
                }
            }
        });

        expect(reducer({ counter: 0 }, { type: increment }).counter).toEqual(1);
    });

    it('should maintain referential equality if the reducers it is combining do', () => {
        const reducer = combineReducers<Counter>({
            child1(state:Object = {}) {
                return state;
            },
            child2(state:Object = {}) {
                return state;
            },
            child3(state:Object = {}) {
                return state;
            }
        });

        const initialState = reducer(undefined, { type: '@@INIT' });
        expect(reducer(initialState, { type: 'FOO' })).toBe(initialState);
    });

    it('should not have referential equality if one of the reducers changes something', () => {
        const reducer = combineReducers<Counter>({
            child1(state:any = {}) {
                return state;
            },
            child2(state:any = { count: 0 }, action:Action) {
                switch (action.type) {
                    case 'increment':
                        return { count: state.count + 1 };
                    default:
                        return state;
                }
            },
            child3(state:any = {}) {
                return state;
            }
        });

        const initialState = reducer(undefined, { type: '@@INIT' });
        expect(reducer(initialState, { type: 'increment' })).not.toBe(initialState);
    });

    it('should throw if passed reducer object has no keys', () => {
        expect(() => {
            combineReducers<Counter>({});
        }).toThrow();
    });
});