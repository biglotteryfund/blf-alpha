'use strict';

const EXPIRY_EMAIL_REMINDERS = [
    {
        emailType: 'STANDARD_ONE_MONTH',
        sendBeforeExpiry: {
            amount: 30,
            unit: 'days',
        },
    },
    {
        emailType: 'STANDARD_ONE_WEEK',
        sendBeforeExpiry: {
            amount: 7,
            unit: 'days',
        },
    },
    {
        emailType: 'STANDARD_ONE_DAY',
        sendBeforeExpiry: {
            amount: 1,
            unit: 'days',
        },
    },
];

const BENEFICIARY_GROUPS = {
    ETHNIC_BACKGROUND: 'ethnic-background',
    GENDER: 'gender',
    AGE: 'age',
    DISABLED_PEOPLE: 'disabled-people',
    RELIGION: 'religion',
    LGBT: 'lgbt',
    CARING: 'caring-responsibilities',
};

const ORG_MIN_AGE = {
    amount: 15,
    unit: 'months',
    label: { en: '15 months', cy: '15 mis' },
};

const ORGANISATION_TYPES = {
    UNREGISTERED_VCO: 'unregistered-vco',
    UNINCORPORATED_REGISTERED_CHARITY: 'unincorporated-registered-charity',
    CIO: 'charitable-incorporated-organisation',
    NOT_FOR_PROFIT_COMPANY: 'not-for-profit-company',
    CIC: 'community-interest-company',
    SCHOOL: 'school',
    COLLEGE_OR_UNIVERSITY: 'college-or-university',
    STATUTORY_BODY: 'statutory-body',
    FAITH_GROUP: 'faith-group',
};

const CONTACT_EXCLUDED_TYPES = [
    ORGANISATION_TYPES.SCHOOL,
    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
    ORGANISATION_TYPES.STATUTORY_BODY,
];

const COMPANY_NUMBER_TYPES = [
    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
    ORGANISATION_TYPES.CIC,
];

const CHARITY_NUMBER_TYPES = {
    required: [
        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
        ORGANISATION_TYPES.CIO,
    ],
    optional: [
        ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
        ORGANISATION_TYPES.FAITH_GROUP,
    ],
};

const EDUCATION_NUMBER_TYPES = [
    ORGANISATION_TYPES.SCHOOL,
    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
];

const FREE_TEXT_MAXLENGTH = {
    small: 40,
    medium: 80,
    large: 255,
};

module.exports = {
    EXPIRY_EMAIL_REMINDERS,
    BENEFICIARY_GROUPS,
    CONTACT_EXCLUDED_TYPES,
    ORGANISATION_TYPES,
    COMPANY_NUMBER_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES,
    FREE_TEXT_MAXLENGTH,
    ORG_MIN_AGE,
};
