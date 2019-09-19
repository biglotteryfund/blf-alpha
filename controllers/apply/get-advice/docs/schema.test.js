/* eslint-env jest */
// @ts-nocheck
'use strict';
const fs = require('fs');
const path = require('path');

const schema = require('../schema');

const docContents = fs.readFileSync(
    path.resolve(__dirname, './schema.md'),
    'utf8'
);

test.each(Object.keys(schema.describe().children))(
    '%s has documentation entry',
    fieldName => {
        const fieldNameRegexp = new RegExp(`### ${fieldName}`);
        const match = fieldNameRegexp.test(docContents);
        expect(match).toBeTruthy();
    }
);
