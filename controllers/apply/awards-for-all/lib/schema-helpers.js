'use strict';

const Joi = require('../../lib/joi-extensions');
const { ORGANISATION_TYPES } = require('../constants');

/**
 * Define which organisation types should
 * exclude contact details.
 */
const CONTACT_EXCLUDED_TYPES = [
    ORGANISATION_TYPES.SCHOOL,
    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
    ORGANISATION_TYPES.STATUTORY_BODY
];

/**
 * Determine if we should ask for address and date of birth information.
 * For data protection reasons we should not request address information
 * for the organisation types listed here.
 */
function includeAddressAndDob(currentOrganisationType) {
    return CONTACT_EXCLUDED_TYPES.includes(currentOrganisationType) === false;
}

function stripIfExcludedOrgType(schema) {
    return Joi.when(Joi.ref('organisationType'), {
        is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
        then: Joi.any().strip(),
        otherwise: schema
    });
}

module.exports = {
    includeAddressAndDob,
    stripIfExcludedOrgType
};
