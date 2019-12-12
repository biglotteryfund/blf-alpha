/* eslint-env jest */
'use strict';
const rolesFor = require('./roles');

test('include all roles if no organisation type is provided', () => {
    const roles = rolesFor({ organisationType: null });
    expect(roles.map(o => o.value)).toMatchSnapshot();
});

test.each([
    'unregistered-vco',
    'unincorporated-registered-charity',
    'charitable-incorporated-organisation',
    'not-for-profit-company',
    'school',
    'college-or-university',
    'statutory-body',
    'faith-group'
])(`include expected roles for %p`, function(orgType) {
    const roles = rolesFor({ organisationType: orgType });
    expect(roles.map(o => o.value)).toMatchSnapshot();
});
