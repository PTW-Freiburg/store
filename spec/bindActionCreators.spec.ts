import { Action } from '../src/action';
import { Dispatcher } from '../src/createStore';
import {
    ON_ACTION,
    OFF_ACTION,
    turnOn,
    turnOff
} from './helpers/switch.helper';

import { bindActionCreators, ActionCreatorsMap } from '../src/bindActionCreators';

// We need this for intellisense ...
interface SwitchActionCreators extends ActionCreatorsMap {
    turnOn(): Action;
    turnOff(): Action;
}

describe('[bindActionCreators]', () => {
    const dispatcher:Dispatcher<string> = jasmine.createSpy('dispatch')
        .and.callFake(action => action);
    const actions_creators:SwitchActionCreators = { turnOn, turnOff };

    it('should wrap action creator map with dispatch', () => {
        const bound_action_creators = bindActionCreators(actions_creators, dispatcher);
        expect(Object.keys(bound_action_creators)).toEqual(Object.keys(bound_action_creators));

        bound_action_creators.turnOn();
        expect(dispatcher).toHaveBeenCalledWith(ON_ACTION);

        bound_action_creators.turnOff();
        expect(dispatcher).toHaveBeenCalledWith(OFF_ACTION);
    });

    it('should skip non function values in map', () => {
        const map = Object.assign(actions_creators, {
            foo: 'bar',
            a: false
        });
        const bound_action_creators = <any>bindActionCreators(map, dispatcher);

        expect(bound_action_creators.turnOff).toBeDefined();
        expect(bound_action_creators.turnOn).toBeDefined();
        expect(bound_action_creators.foo).toBeUndefined();
        expect(bound_action_creators.a).toBeUndefined();

    });

    it('should wrap a single action creator with dispatch', () => {
        const action = bindActionCreators(turnOff, dispatcher);
        expect(action).toEqual(jasmine.any(Function));

        action();
        expect(dispatcher).toHaveBeenCalledWith(OFF_ACTION);
    });
});