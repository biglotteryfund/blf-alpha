/* eslint-env jest */
// @ts-nocheck
'use strict';
const fs = require('fs');
const path = require('path');
const map = require('lodash/map');

const formBuilder = require('../form');

const docContents = fs.readFileSync(
    path.resolve(__dirname, './schema.md'),
    'utf8'
);

const form = formBuilder({ locale: 'en' });

test.each(map(form.allFields, 'name'))(
    '%s has documentation entry',
    fieldName => {
        const fieldNameRegexp = new RegExp(`### ${fieldName}`);
        const match = fieldNameRegexp.test(docContents);
        expect(match).toBeTruthy();
    }
);
