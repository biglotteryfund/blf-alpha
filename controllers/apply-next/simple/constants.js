'use strict';

const MIN_AGE_MAIN_CONTACT = 16;
const MIN_AGE_SENIOR_CONTACT = 18;
const MAX_BUDGET_TOTAL_GBP = 10000;

const ORGANISATION_TYPES = {
    UNREGISTERED_VCO: 'unregistered-vco',
    UNINCORPORATED_REGISTERED_CHARITY: 'unincorporated-registered-charity',
    CIO: 'charitable-incorporated-organisation',
    NOT_FOR_PROFIT_COMPANY: 'not-for-profit-company',
    SCHOOL: 'school',
    STATUTORY_BODY: 'statutory-body'
};

const BENEFICIARY_GROUPS = {
    ETHNIC_BACKGROUND: 'ethnic-background',
    GENDER: 'gender',
    AGE: 'age',
    DISABILITY: 'disability',
    FAITH: 'faith',
    LGBTQ: 'lgbtq'
};

module.exports = {
    BENEFICIARY_GROUPS,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    ORGANISATION_TYPES
};
