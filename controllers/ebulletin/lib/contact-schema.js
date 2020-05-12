'use strict';
const Joi = require('@hapi/joiNext');

function getTranslations(i18n) {
    return function (path, ...params) {
        return i18n && i18n.__(`toplevel.ebulletin.${path}`, ...params);
    };
}

const COUNTRIES = {
    ENGLAND: 'england',
    NORTHERN_IRELAND: 'northern-ireland',
    SCOTLAND: 'scotland',
    WALES: 'wales',
};

const SECTORS = {
    ARMS_LENGTH_BODY: 'arms-length-body',
    FUNDING_BODY: 'funding-body',
    CIVIL_SERVICE: 'civil-service',
    LOCAL_GOV: 'local-government',
    CHARITY: 'charity',
    COMMUNITY_GROUP: 'community-group',
    SOCIAL_ENTERPRISE: 'social-enterprise',
    NHS: 'nhs',
    PRIVATE_SECTOR: 'private-sector',
    OTHER: 'other',
};

function buildValidLocations(i18n) {
    const labelForLocale = getTranslations(i18n);
    return [
        {
            value: COUNTRIES.ENGLAND,
            label: labelForLocale('locations.england'),
        },
        {
            value: COUNTRIES.NORTHERN_IRELAND,
            label: labelForLocale('locations.northernIreland'),
        },
        {
            value: COUNTRIES.SCOTLAND,
            label: labelForLocale('locations.scotland'),
        },
        {
            value: COUNTRIES.WALES,
            label: labelForLocale('locations.wales'),
        },
    ];
}

function buildValidSectors(i18n) {
    const labelForLocale = getTranslations(i18n);
    return [
        {
            value: SECTORS.ARMS_LENGTH_BODY,
            label: labelForLocale('sectors.armsLengthBody'),
        },
        {
            value: SECTORS.FUNDING_BODY,
            label: labelForLocale('sectors.fundingBody'),
        },
        {
            value: SECTORS.CIVIL_SERVICE,
            label: labelForLocale('sectors.civilService'),
        },
        {
            value: SECTORS.LOCAL_GOV,
            label: labelForLocale('sectors.localGovernment'),
        },
        {
            value: SECTORS.CHARITY,
            label: labelForLocale('sectors.charity'),
        },
        {
            value: SECTORS.COMMUNITY_GROUP,
            label: labelForLocale('sectors.communityGroup'),
        },
        {
            value: SECTORS.SOCIAL_ENTERPRISE,
            label: labelForLocale('sectors.socialEnterprise'),
        },
        {
            value: SECTORS.NHS,
            label: labelForLocale('sectors.nhs'),
        },
        {
            value: SECTORS.PRIVATE_SECTOR,
            label: labelForLocale('sectors.privateSector'),
        },
        {
            value: SECTORS.OTHER,
            label: labelForLocale('sectors.other'),
        },
    ];
}

const baseSchema = {
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    location: Joi.string()
        .valid(...Object.values(COUNTRIES))
        .required(),
    organisation: Joi.string().allow('').optional(),
};

function getBaseMessages(i18n) {
    const messageForLocale = getTranslations(i18n);
    return {
        email: [
            {
                type: 'base',
                message: messageForLocale('errors.emailMissing'),
            },
            {
                type: 'string.email',
                message: messageForLocale('errors.emailInvalid'),
            },
        ],
        firstName: [
            {
                type: 'base',
                message: messageForLocale('errors.firstName'),
            },
        ],
        lastName: [
            {
                type: 'base',
                message: messageForLocale('errors.lastName'),
            },
        ],
        location: [
            {
                type: 'base',
                message: messageForLocale('errors.location'),
            },
        ],
    };
}

module.exports = {
    buildValidLocations,
    buildValidSectors,
    newStakeholder(i18n) {
        const stakeholderSchema = Object.assign(baseSchema, {
            jobTitle: Joi.string().required(),
            sector: Joi.string()
                .valid(...Object.values(SECTORS))
                .required(),
        });

        const messageForLocale = getTranslations(i18n);

        const additionalMessages = {
            jobTitle: [
                {
                    type: 'base',
                    message: messageForLocale('errors.jobTitleMissing'),
                },
            ],
            sector: [
                {
                    type: 'base',
                    message: messageForLocale('errors.sectorMissing'),
                },
            ],
        };

        const messages = Object.assign(
            getBaseMessages(i18n),
            additionalMessages
        );

        return {
            schema: Joi.object(stakeholderSchema),
            messages: messages,
        };
    },
    newContact(i18n) {
        return {
            schema: Joi.object(baseSchema),
            messages: getBaseMessages(i18n),
        };
    },
};
