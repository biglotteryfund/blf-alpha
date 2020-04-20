/* eslint-env jest */
'use strict';
const isNewOrganisation = require('./new-organisation');

test('check if this is a recent organisation based on start date', () => {
    const now = new Date();
    expect(
        isNewOrganisation({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        })
    ).toBeTruthy();

    expect(
        isNewOrganisation({
            month: now.getMonth() + 1,
            year: now.getFullYear() - 2,
        })
    ).toBeFalsy();
});
