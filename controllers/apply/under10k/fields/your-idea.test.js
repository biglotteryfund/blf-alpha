/* eslint-env jest */
'use strict';
const { fieldYourIdeaPriorities } = require('./your-idea');

test('show existing guidance text if enableNewCOVID19Flow is disabled', function () {
    const field = fieldYourIdeaPriorities(
        'en',
        {},
        { enableNewCOVID19Flow: false }
    );
    expect(field.explanation).toMatchSnapshot();
});

test('show COVID-19 guidance text in England', function () {
    const data = {
        projectCountry: 'england',
    };
    const field = fieldYourIdeaPriorities('en', data, {
        enableNewCOVID19Flow: true,
    });
    expect(field.explanation).toMatchSnapshot();
});

test('show COVID-19 guidance text outside England when project is responding to COVID-19', function () {
    const data = {
        projectCountry: 'scotland',
        supportingCOVID19: 'yes',
    };
    const field = fieldYourIdeaPriorities('en', data, {
        enableNewCOVID19Flow: true,
    });
    expect(field.explanation).toMatchSnapshot();
});

test('show regular guidance text outside England when project is not responding to COVID-19', function () {
    const data = {
        projectCountry: 'scotland',
        supportingCOVID19: 'no',
    };
    const field = fieldYourIdeaPriorities('en', data, {
        enableNewCOVID19Flow: true,
    });
    expect(field.explanation).toMatchSnapshot();
});

test('show combined guidance text as a fallback', function () {
    const field = fieldYourIdeaPriorities(
        'en',
        {},
        { enableNewCOVID19Flow: true }
    );
    expect(field.explanation).toMatchSnapshot();
});
