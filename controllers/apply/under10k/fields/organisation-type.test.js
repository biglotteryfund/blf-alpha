/* eslint-env jest */
'use strict';
const { fieldOrganisationType } = require('./organisation-type');

test('exclude statutory groups in england with enableEnableGovCOVIDUpdates flow', function () {
    const mapLabels = (options) => options.map((option) => option.label);

    const dataEngland = {
        projectCountry: 'england',
    };

    const dataScotland = {
        projectCountry: 'scotland',
    };

    const resultAll = [
        'Unregistered voluntary or community organisation',
        'Not-for-profit company',
        'Registered charity (unincorporated)',
        'Charitable Incorporated Organisation (CIO or SCIO)',
        'Community Interest Company (CIC)',
        'School',
        'College or University',
        'Statutory body',
        'Faith-based group',
    ];

    const resultReduced = [
        'Unregistered voluntary or community organisation',
        'Not-for-profit company',
        'Registered charity (unincorporated)',
        'Charitable Incorporated Organisation (CIO or SCIO)',
        'Community Interest Company (CIC)',
        'Faith-based group',
    ];

    const resultFlagOff = fieldOrganisationType('en', dataEngland, {
        enableEnableGovCOVIDUpdates: false,
    });

    expect(mapLabels(resultFlagOff.options)).toEqual(resultAll);

    const resultFlagOn = fieldOrganisationType('en', dataEngland, {
        enableEnableGovCOVIDUpdates: true,
    });

    expect(mapLabels(resultFlagOn.options)).toEqual(resultReduced);

    const resultFlagOnScotland = fieldOrganisationType('en', dataScotland, {
        enableEnableGovCOVIDUpdates: true,
    });

    expect(mapLabels(resultFlagOnScotland.options)).toEqual(resultAll);
});
