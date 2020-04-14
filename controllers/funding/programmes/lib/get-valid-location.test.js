/* eslint-env jest */
'use strict';
const getValidLocation = require('./get-valid-location');
const mockProgrammes = require('./mock-programmes.json');

test('should only return valid regions', () => {
    expect(getValidLocation(mockProgrammes, 'northernIreland')).toBe(
        'northernIreland'
    );
    expect(getValidLocation(mockProgrammes, 'england')).toBe('england');
    expect(getValidLocation(mockProgrammes, 'nowhere')).toBeUndefined();
});
