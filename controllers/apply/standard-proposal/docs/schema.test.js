/* eslint-env jest */
// @ts-nocheck
'use strict';
const fs = require('fs');
const path = require('path');

const formBuilder = require('../form');

const form = formBuilder();

const docContents = fs.readFileSync(
    path.resolve(__dirname, './schema.md'),
    'utf8'
);

test.each(Object.keys(form.schema.describe().children))(
    '%s has documentation entry',
    fieldName => {
        const fieldNameRegexp = new RegExp(`### ${fieldName}`);
        const match = fieldNameRegexp.test(docContents);
        expect(match).toBeTruthy();
    }
);
