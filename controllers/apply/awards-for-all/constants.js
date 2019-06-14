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
    COLLEGE_OR_UNIVERSITY: 'college-or-university',
    STATUTORY_BODY: 'statutory-body'
};

const ORGANISATION_SUB_TYPES = {
    STATUTORY_BODY: {
        PARISH_COUNCIL: { key: 'parish-council' },
        TOWN_COUNCIL: { key: 'town-council' },
        LOCAL_AUTHORITY: { key: 'local-authority' },
        NHS_TRUST: { key: 'nhs-trust-health-authority' },
        PRISON_SERVICE: { key: 'prison-service', freeText: true },
        FIRE_SERVICE: { key: 'fire-service', freeText: true },
        POLICE_AUTHORITY: { key: 'police-authority', freeText: true }
    }
};

const BENEFICIARY_GROUPS = {
    ETHNIC_BACKGROUND: 'ethnic-background',
    GENDER: 'gender',
    AGE: 'age',
    DISABLED_PEOPLE: 'disabled-people',
    RELIGION: 'religion',
    LGBT: 'lgbt',
    CARING: 'caring-responsibilities'
};

const FILE_LIMITS = {
    SIZE: {
        label: '12MB',
        value: 12 * 1048576 // eg. 12mb in bytes
    },
    TYPES: [
        { mime: 'image/png', label: 'PNG' },
        { mime: 'image/jpeg', label: 'JPEG' },
        { mime: 'application/pdf', label: 'PDF' }
    ]
};

module.exports = {
    BENEFICIARY_GROUPS,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    ORGANISATION_TYPES,
    ORGANISATION_SUB_TYPES,
    FILE_LIMITS
};
