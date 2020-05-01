/* eslint-env jest */
'use strict';
const { fieldProjectStartDateCheck } = require('./project-dates-next');

test('fieldProjectStartDateCheck both options enabled by default', function () {
    const field = fieldProjectStartDateCheck('en');
    expect(field.options).toStrictEqual([
        { label: expect.any(String), value: 'asap' },
        { label: expect.any(String), value: 'exact-date' },
    ]);
});

test.todo('fieldProjectStartDateCheck exact date disabled in England');

test.todo(
    'fieldProjectStartDateCheck exact date disabled outside England when project is responding to COVID-19'
);
