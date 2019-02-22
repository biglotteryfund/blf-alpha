/* eslint-env jest */
'use strict';

const { FIELDS, CONDITIONS, ORGANISATION_TYPES } = require('../form-model');

describe('form conditions', () => {
    it('should test condition for charity number', () => {
        expect(
            CONDITIONS.needsCharityNumber({
                [FIELDS.organisationType.name]: ORGANISATION_TYPES.unincorporatedRegisteredCharity.value
            })
        ).toBeTruthy();

        expect(
            CONDITIONS.needsCharityNumber({
                [FIELDS.organisationType.name]: 'invalid'
            })
        ).toBeFalsy();
    });
});
