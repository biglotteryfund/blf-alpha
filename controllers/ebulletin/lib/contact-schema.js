'use strict';
const Joi = require('@hapi/joiNext');

function getTranslations(i18n) {
    return function (path, ...params) {
        return i18n && i18n.__(`toplevel.ebulletin.${path}`, ...params);
    };
}

function buildValidLocations (i18n) {
    const labelForLocale = getTranslations(i18n);
    return [
        {
            value: 'england',
            label: labelForLocale('locations.england'),
        },
        {
            value: 'northern-ireland',
            label: labelForLocale('locations.northernIreland'),
        },
        {
            value: 'scotland',
            label: labelForLocale('locations.scotland'),
        },
        {
            value: 'wales',
            label: labelForLocale('locations.wales'),
        },
    ];
}

module.exports = {
    buildValidLocations,
    newContact(i18n) {
        const messageForLocale = getTranslations(i18n);
        const locations = buildValidLocations(i18n);

        const email = Joi.string().email().required();
        const firstName = Joi.string().required();
        const lastName = Joi.string().required();
        const location = Joi.string().valid(...locations.map(_ => _.value)).required();
        const organisation = Joi.string().allow('').optional();

        return {
            schema: Joi.object({
                email,
                firstName,
                lastName,
                location,
                organisation
            }),
            messages: {
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
            },
        };
    }
};
