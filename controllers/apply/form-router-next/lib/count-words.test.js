/* eslint-env jest */
'use strict';

const faker = require('faker');
const countWords = require('./count-words');

test('should correctly count words', function() {
    expect(countWords('this is a test')).toBe(4);
    expect(countWords('this 📝 contains emoji ❤️')).toBe(5);
    expect(countWords(faker.lorem.words(100))).toBe(100);
});
