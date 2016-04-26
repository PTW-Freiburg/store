import { isPlainAction } from '../src/action';

describe('[Action]', () => {
    it('should be a function', () => {
        expect(isPlainAction).toEqual(jasmine.any(Function));
    });

    it('should return true if argument is a plain action', () => {
        expect(isPlainAction({ type: 'INCREMENT' })).toBeTruthy();
        expect(isPlainAction({ type: 'INIT_USERS', payload: [] })).toBeTruthy();
    });

    it('should return false if argument is not a plain action', () => {
        expect(isPlainAction('INCREMENT')).toBeFalsy();
        expect(isPlainAction({ payload: [] })).toBeFalsy();
        expect(isPlainAction(null)).toBeFalsy();
        expect(isPlainAction(undefined)).toBeFalsy();
    });
});