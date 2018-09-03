/* eslint-env jest */
'use strict';
const { sample, sampleSize } = require('lodash');

const { PROJECT_LOCATIONS, determineInternalSendTo } = require('./helpers');

describe('determineInternalSendTo', () => {
    it('should return correct internal email for location', () => {
        const singleLocation = sample(PROJECT_LOCATIONS);
        const result = determineInternalSendTo(singleLocation.value);
        expect(result.address).toBe(singleLocation.email);
    });

    it('should return default email for multiple locations', () => {
        const multipleLocations = sampleSize(PROJECT_LOCATIONS, 3).map(_ => _.value);
        const result = determineInternalSendTo(multipleLocations);
        expect(result.address).toBe('englandteam@biglotteryfund.org.uk');
    });
});
