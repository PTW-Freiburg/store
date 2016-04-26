# PTW-Store

A [RxJS](https://github.com/ReactiveX/rxjs) powered state management container heavily inspired by [Redux](https://github.com/reactjs/redux).

## Why!?

Because reactive by default is a good thing and Redux is too much tied to React!
Plus, we wanted to have som sensible defaults, like [FSA](https://github.com/acdlite/flux-standard-action) for actions.

## Features

- **Same API:** We tried to stay compatible with the [Redux API](http://redux.js.org/docs/api/), so existing middleware and other plugins will work as expected!
- **Observable State:** The store will also expose a `state$` stream, which is just a regular `Observable`. This means you can use all the sweet Rx operators!
- **Real State Change:** Redux will always call every listener, when an action is dispatched. Because of RxJS listener will only be notified if the state has actually changed.
- **Partial State Update:** Sometimes you're only interested in a subset of the state tree. `select()` is a helper method, exposed by the `store` to easily select state members, much like [@ngrx/store](https://github.com/ngrx/store).
- **Framkework Agnostic:** Use it whatever you want.
- **Intellisense:** Thanks to TypeScript.

## Install

```
$ npm install rxjs ptw-store --save
```

## Usage

```ts
import { Action, Reducer, createStore } from '@ptw/store';

/**
 * This may look familiar!
 * Reducers have a generic type, which helps to keep track of
 * the state a reducer mutates.
 */
const counter:Reducer<number> = ( state=0, action ) => {
    switch(action.type) {
        case 'INCREMENT':
            return state + 1
        case 'DECREMENT':
            return state - 1
        default:
            return state
    }
};

/**
 * Generics indicate the type of the state (=`number`) and the allowed
 * types of actions that can be dispatched to the store (=`Action`).
 */
const store = createStore<number, Action>(counter);


/**
 * Subscribe directly to the observable or do a regular subscription.
 * NOTE: Unlike Redux listeners will be called with the current `state`. But
 * you can always fall back to `getState()`.
 */
store.subscribe( state => console.log(state) );
store.state$.subscribe( state => console.log(state) );

/**
 * Dispatch as usual.
 */
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'DECREMENT' });
```

### Combine Reducers

```ts
import { Action, combineReducers, createStore } from '@ptw/store';

/**
 * Combining reducers works much like it does with Redux.
 */
interface Counter {
    counter?:number;
    stack?:string[];
}
const reducer = combineReducers<Counter>({
    counter: (state = 0, action) =>
        action.type === 'increment' ? state + 1 : state,
    stack: (state = [], action) =>
        action.type === 'push' ? [ ...state, action.payload ] : state
});

/**
 * In this case the reducers also define the store's state.
 */
const store = createStore<Counter, Action>(reducer);

/**
 * Yay, autocomplete!
 */
const current = store.getState();
```

### With Middleware

```ts
import { applyMiddleware, createStore } from './src/index';
import thunk from 'redux-thunk';
import reducer from './reducer';

/**
 * Aplly middleware like you're used to.
 */
const store = createStore(
    reducer,
    applyMiddleware(thunk)
);
```

## Scripts

- Build: `npm run build`
- Test: `npm run test`
- Develop: `npm run watch`


## ToDo

- Integrate ImmutableJS as state.