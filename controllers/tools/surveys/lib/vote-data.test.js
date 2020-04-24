/* eslint-env jest */
'use strict';
const moment = require('moment');
const voteDataFor = require('./vote-data');

test('voteDataFor', function () {
    function mockResponses(dateString, yesCount, noCount) {
        const date = moment(dateString).toDate();
        return [
            ...Array(yesCount).fill({
                choice: 'yes',
                path: '/',
                createdAt: date,
            }),
            ...Array(noCount).fill({
                choice: 'no',
                path: '/',
                createdAt: date,
            }),
        ];
    }

    const responses = [
        ...mockResponses('2020-01-01', 45, 5),
        ...mockResponses('2020-01-02', 100, 5),
        ...mockResponses('2020-01-03', 50, 2),
        ...mockResponses('2020-01-04', 25, 0),
        ...mockResponses('2020-01-05', 200, 140),
        ...mockResponses('2020-01-06', 0, 12),
        ...mockResponses('2020-01-07', 450, 57),
    ];

    expect(voteDataFor(responses)).toEqual([
        { x: '2020-01-01', y: 90 },
        { x: '2020-01-02', y: 95 },
        { x: '2020-01-03', y: 96 },
        { x: '2020-01-04', y: 100 },
        { x: '2020-01-05', y: 59 },
        { x: '2020-01-06', y: 0 },
        { x: '2020-01-07', y: 89 },
    ]);
});
