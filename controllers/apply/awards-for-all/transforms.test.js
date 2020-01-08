/* eslint-env jest */
'use strict';

const { mockResponse } = require('./mocks');
const { transformProjectDateRange } = require('./transforms');

test('should transform project date range', function() {
    const startDate = { day: 27, month: 3, year: 2020 };
    const endDate = { day: 19, month: 6, year: 2020 };

    const original = mockResponse({
        projectDateRange: { startDate: startDate, endDate: endDate }
    });

    expect(original).toHaveProperty('projectDateRange');
    expect(original.projectDateRange.startDate).toEqual(startDate);
    expect(original.projectDateRange.endDate).toEqual(endDate);

    const result = transformProjectDateRange(
        mockResponse({
            projectDateRange: { startDate: startDate, endDate: endDate }
        })
    );

    expect(result.projectStartDate).toEqual(startDate);
    expect(result.projectEndDate).toEqual(endDate);
    expect(result).not.toHaveProperty('projectDateRange');
    expect(true).toBeTruthy();
});
