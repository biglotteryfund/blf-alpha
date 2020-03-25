/* eslint-env jest */
'use strict';

const { Step } = require('./step-model');

test('construct step model', function () {
    const minimalStep = new Step({
        title: 'Example step',
        fieldsets: [],
    });

    expect(minimalStep.noValidate).toBeTruthy();
    expect(minimalStep.isMultipart).toBeFalsy();

    const complexStep = new Step({
        title: 'Example step',
        fieldsets: [],
        noValidate: false,
        isMultipart: true,
    });

    expect(complexStep.noValidate).toBeFalsy();
    expect(complexStep.isMultipart).toBeTruthy();
});

test('default fieldset legend', function () {
    const exampleStep = new Step({
        title: 'Example step',
        fieldsets: [{ fields: [{ name: 'mock-field' }] }],
    });

    expect(exampleStep.fieldsets).toEqual([
        { legend: 'Example step', fields: [{ name: 'mock-field' }] },
    ]);
});

test('getCurrentFields', function () {
    const exampleStep = new Step({
        title: 'Example step',
        fieldsets: [
            {
                legend: 'Fieldset 1',
                fields: [{ name: 'field-a' }, { name: 'field-b' }],
            },
            { legend: 'Fieldset 2', fields: [{ name: 'field-c' }] },
        ],
    });

    const result = exampleStep.getCurrentFields();
    expect(result).toEqual([
        { name: 'field-a' },
        { name: 'field-b' },
        { name: 'field-c' },
    ]);
});

test('filterErrors', function () {
    const exampleStep = new Step({
        title: 'Example step',
        fieldsets: [
            { legend: 'Fieldset 1', fields: [{ name: 'field-a' }] },
            { legend: 'Fieldset 2', fields: [{ name: 'field-b' }] },
        ],
    });

    const mockErrorMessages = [
        { param: 'field-a', msg: 'Field A error', type: 'base' },
        { param: 'field-x', msg: 'Not in step', type: 'base' },
        { param: 'field-b', msg: 'Field B error', type: 'base' },
    ];

    const result = exampleStep.filterErrors(mockErrorMessages);

    expect(result.map((item) => item.msg)).toEqual([
        'Field A error',
        'Field B error',
    ]);
});
