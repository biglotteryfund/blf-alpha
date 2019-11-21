/* eslint-env jest */
'use strict';

const { sanitiseRequestBody } = require('./sanitise');

describe('sanitiseRequestBody', () => {
    test('should sanitise nested request bodies', () => {
        const result = sanitiseRequestBody({
            stringValue: 'Test<script>alert(1)</script>',
            numberValue: 1000,
            objectValue: {
                a: 'this value is OK',
                b: 'this one is not OK<script>alert(1)</script>'
            },
            arrayValue: [
                'something',
                'this one is bad<script>alert(1)</script>'
            ],
            arrayOfObjects: [
                { a: 'good', b: 'bad<script>alert(1)</script>' },
                { a: 'good', b: '<script>alert(1)</script>' }
            ],
            nestedObject: {
                a: { x: 'good', y: 'bad<script>alert(1)</script>' }
            },
            stringWithAmpersands: "My favourite place in London is M&M's World"
        });

        expect(result).toEqual({
            stringValue: 'Test',
            numberValue: 1000,
            objectValue: { a: 'this value is OK', b: 'this one is not OK' },
            arrayValue: ['something', 'this one is bad'],
            arrayOfObjects: [
                { a: 'good', b: 'bad' },
                { a: 'good', b: '' }
            ],
            nestedObject: { a: { x: 'good', y: 'bad' } },
            stringWithAmpersands: "My favourite place in London is M&M's World"
        });
    });
});
