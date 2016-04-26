import { Action } from '../../src/action';
import { Reducer } from '../../src/reducer';

export const SWITCH_ON = 'SWITCH_ON';
export const SWITCH_OFF = 'SWITCH_OFF';

export const ON_ACTION:Action = { type: SWITCH_ON };
export const OFF_ACTION:Action = { type: SWITCH_OFF };

export const turnOn = () => ON_ACTION;
export const turnOff = () => OFF_ACTION;

export const asyncOn = () => dispatch => {
    setTimeout( () => dispatch(ON_ACTION) , 0);
};

export const switchReducer:Reducer<Boolean> = ( state = false, action ) => {
    switch (action.type) {
        case SWITCH_ON:
            return true;
        case SWITCH_OFF:
            return false;
        default:
            return state;
    }
};