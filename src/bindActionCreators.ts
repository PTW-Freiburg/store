import { Action } from './action';
import { Dispatcher } from './createStore';


/**
 * An `ActionCreator` is a function that returns an action.
 * This is handy if you have async actions or actions that
 * dispatch mulitple actions.
 *
 * @template T Allowed arguments.
 * @template A Returned action.
 */
export interface ActionCreator<A> {
  (...args:any[]): A|Action;
}


/**
 * An objects whose keys are names of ActionsCreators and the
 * values hold the corresponding `ActionCreator` function.
 */
export interface ActionCreatorsMap {
  [name: string]: ActionCreator<any>;
}


/**
 * Interface signature for `bindActionCreators` function.
 */
export interface BindActionCreatorFactory {
    <C extends ActionCreator<any>>(action_creators:C, dispatch:Dispatcher<any>):C;
    <M extends ActionCreatorsMap>(action_creators:M, dispatch:Dispatcher<any>):M;
}


/**
 * Binds the first argument (`ActionCreator`)
 */
function bindActionCreator<A> ( action_creator:ActionCreator<A>, dispatch:Dispatcher<A> ):ActionCreator<A> {
  return (...args:any[]) => dispatch(action_creator(...args));
}


/**
 * Turns an object whose values are functions from type `ActionCreator`, into an object with
 * the same keys. Every function will be wrapped so that if they are called a `dispatch` to the
 * store will automatically be invoked.
 *
 * This is a convenience to bypass writing `store.dispatch(actions.doSomething())` all the time
 */
export const bindActionCreators:BindActionCreatorFactory =
    (action_creators:(ActionCreator<any>|ActionCreatorsMap), dispatch:Dispatcher<any>) => {
        if( typeof action_creators === 'function' ) {
            return bindActionCreator<any>(action_creators as ActionCreator<any>, dispatch);
        }

        return Object.keys(action_creators)
            .filter( key => typeof action_creators[key] === 'function' )
            .reduce( (bound_action_creators, key) => {
                bound_action_creators[key] = bindActionCreator(action_creators[key], dispatch);
                return bound_action_creators;
            }, {});
    };