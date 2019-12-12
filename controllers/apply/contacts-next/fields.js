'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const EmailField = require('../lib/field-types/email');
const DateField = require('../lib/field-types/date');
const PhoneField = require('../lib/field-types/phone');
const NameField = require('../lib/field-types/name');
const fieldContactLanguagePreference = require('./fields/contact-language-preference');
const fieldSeniorContactRole = require('./fields/senior-contact-role');
const fieldAddress = require('./fields/address');

const {
    CONTACT_EXCLUDED_TYPES,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    FREE_TEXT_MAXLENGTH
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const seniorContactName = [
        get('seniorContactName.firstName')(data),
        get('seniorContactName.lastName')(data)
    ]
        .join(' ')
        .trim();

    const mainContactName = [
        get('mainContactName.firstName')(data),
        get('mainContactName.lastName')(data)
    ]
        .join(' ')
        .trim();

    function stripIfExcludedOrgType(schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
            then: Joi.any().strip(),
            otherwise: schema
        });
    }

    function addressHistoryField(props) {
        const defaultProps = {
            type: 'address-history',
            isRequired: true,
            schema: stripIfExcludedOrgType(
                Joi.object({
                    currentAddressMeetsMinimum: Joi.string()
                        .valid(['yes', 'no'])
                        .required(),
                    previousAddress: Joi.when(
                        Joi.ref('currentAddressMeetsMinimum'),
                        {
                            is: 'no',
                            then: Joi.ukAddress().required(),
                            otherwise: Joi.any().strip()
                        }
                    )
                }).required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a full UK address',
                        cy: 'Rhowch gyfeiriad Prydeining llawn'
                    })
                },
                {
                    type: 'any.required',
                    key: 'currentAddressMeetsMinimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: 'Dewiswch o un o’r opsiynau a ddarperir'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: 'Rhowch adeilad a stryd'
                    })
                },
                {
                    type: 'string.max',
                    key: 'line1',
                    message: localise({
                        en: `Building and street must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r adeilad a’r stryd fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                },
                {
                    type: 'string.max',
                    key: 'line2',
                    message: localise({
                        en: `Address line must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r llinell cyfeiriad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({
                        en: 'Enter a town or city',
                        cy: 'Rhowch dref neu ddinas'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({
                        en: 'Enter a county',
                        cy: 'Rhowch sir'
                    })
                },
                {
                    type: 'string.max',
                    key: 'townCity',
                    message: localise({
                        en: `Town or city must be ${FREE_TEXT_MAXLENGTH.small} characters or less`,
                        cy: `Rhaid i’r dref neu ddinas fod yn llai na ${FREE_TEXT_MAXLENGTH.small} nod`
                    })
                },
                {
                    type: 'string.max',
                    key: 'county',
                    message: localise({
                        en: `County must be ${FREE_TEXT_MAXLENGTH.medium} characters or less`,
                        cy: `Rhaid i’r sir fod yn llai na ${FREE_TEXT_MAXLENGTH.medium} nod`
                    })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a postcode',
                        cy: 'Rhowch gôd post'
                    })
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a real postcode',
                        cy: 'Rhowch gôd post go iawn'
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function dateOfBirthField(name, minAge, contactName) {
        const minDate = moment()
            .subtract(120, 'years')
            .format('YYYY-MM-DD');

        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');

        return new DateField({
            locale: locale,
            name: name,
            label: localise({ en: 'Date of birth', cy: 'Dyddad geni' }),
            get explanation() {
                return localise({
                    en: `<p>
                        We need the date of birth${
                            contactName && contactName !== ''
                                ? ` for <strong>${contactName}</strong>`
                                : ''
                        } 
                        to help confirm who they are.
                        And we do check their date of birth.
                        So make sure you've entered it right.
                        If you don't, it could delay your application.
                    </p>
                    <p><strong>For example: 30 03 1980</strong></p>`,
                    cy: `<p>
                        @TODO i18n
                        Rydym angen eu dyddiad geni i helpu cadarnhau pwy ydynt.
                        Rydym yn gwirio eu dyddiad geni.
                        Felly sicrhewch eich bod wedi ei roi yn gywir.
                        Os nad ydych, gall oedi eich cais.
                    </p>
                    <p><strong>Er enghraifft: 30 03 1980</strong></p>`
                });
            },
            attributes: { max: maxDate },
            schema: stripIfExcludedOrgType(
                Joi.dateParts()
                    .minDate(minDate)
                    .maxDate(maxDate)
                    .required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a date of birth',
                        cy: 'Rhowch ddyddiad geni'
                    })
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: `Rhaid bod yn o leiaf ${minAge} oed`
                    })
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: oneLine`Their birth date is not valid—please
                            use four digits, eg. 1986`,
                        cy: oneLine`Nid yw’r dyddiad geni yn ddilys—defnyddiwch
                            bedwar digid, e.e. 1986`
                    })
                }
            ]
        });
    }

    const allFields = {
        mainContactName: new NameField({
            locale: locale,
            name: 'mainContactName',
            label: localise({
                en: 'Full name of main contact',
                cy: 'Enw llawn y prif gyswllt'
            }),
            explanation: localise({
                en: 'This person has to live in the UK.',
                cy: 'Rhaid i’r person hwn fyw yn y Deyrnas Unedig.'
            }),
            get warnings() {
                let result = [];

                const seniorSurname = get('seniorContactName.lastName')(data);

                const lastNamesMatch =
                    seniorSurname &&
                    seniorSurname === get('mainContactName.lastName')(data);

                if (lastNamesMatch) {
                    result.push(
                        localise({
                            en: `<span class="js-form-warning-surname">We've noticed that your main and senior contact
                                     have the same surname. Remember we can't fund projects
                                     where the two contacts are married or related by blood.</span>`,
                            cy: `<span class="js-form-warning-surname">Rydym wedi sylwi bod gan eich uwch gyswllt a’ch
                                     prif gyswllt yr un cyfenw. Cofiwch ni allwn ariannu prosiectau
                                     lle mae’r ddau gyswllt yn briod neu’n perthyn drwy waed.</span>`
                        })
                    );
                }

                return result;
            },
            schema: Joi.fullName()
                .compare(Joi.ref('seniorContactName'))
                .required(),
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Main contact name must be different from the senior contact's name`,
                        cy: `Rhaid i enw’r prif gyswllt fod yn wahanol i enw’r uwch gyswllt.`
                    })
                }
            ]
        }),
        mainContactDateOfBirth: dateOfBirthField(
            'mainContactDateOfBirth',
            MIN_AGE_MAIN_CONTACT,
            mainContactName
        ),
        mainContactAddress: fieldAddress(
            locale,
            {
                name: 'mainContactAddress',
                label: localise({
                    en: 'Home address',
                    cy: 'Cyfeiriad cartref'
                }),
                explanation: localise({
                    en: `We need the home address${
                        mainContactName && mainContactName !== ''
                            ? ` for <strong>${mainContactName}</strong>`
                            : ''
                    } to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy:
                        'Rydym angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio’r cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.'
                }),
                schema: stripIfExcludedOrgType(
                    Joi.ukAddress()
                        .required()
                        .compare(Joi.ref('seniorContactAddress'))
                )
            },
            [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Main contact address must be different from the senior contact's address`,
                        cy: `Rhaid i gyfeiriad y prif gyswllt fod yn wahanol i gyfeiriad yr uwch gyswllt`
                    })
                }
            ]
        ),
        mainContactAddressHistory: addressHistoryField({
            name: 'mainContactAddressHistory',
            label: localise({
                en:
                    'Have they lived at their home address for the last three years?',
                cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`
            })
        }),
        mainContactEmail: new EmailField({
            locale: locale,
            name: 'mainContactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`
            }),
            schema: Joi.string()
                .email()
                .lowercase()
                .invalid(Joi.ref('seniorContactEmail')),
            messages: [
                {
                    type: 'any.invalid',
                    message: localise({
                        en: `Main contact email address must be different from the senior contact's email address`,
                        cy: `Rhaid i gyfeiriad e-bost y prif gyswllt fod yn wahanol i gyfeiriad e-bost yr uwch gyswllt`
                    })
                }
            ]
        }),
        mainContactPhone: new PhoneField({
            locale: locale,
            name: 'mainContactPhone'
        }),
        mainContactLanguagePreference: fieldContactLanguagePreference(locale, {
            name: 'mainContactLanguagePreference'
        }),
        mainContactCommunicationNeeds: {
            name: 'mainContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu penodol sydd gan y cyswllt hwn.`
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .max(FREE_TEXT_MAXLENGTH.large)
                .optional(),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Particular communication needs must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ]
        },
        seniorContactRole: fieldSeniorContactRole(locale, data),
        seniorContactName: new NameField({
            locale: locale,
            name: 'seniorContactName',
            label: localise({
                en: 'Full name of senior contact',
                cy: 'Enw llawn yr uwch gyswllt'
            }),
            explanation: localise({
                en: 'This person has to live in the UK.',
                cy: 'Rhaid i’r person hwn fyw ym Mhrydain'
            }),
            schema: Joi.fullName()
                .compare(Joi.ref('mainContactName'))
                .required(),
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Senior contact name must be different from the main contact's name`,
                        cy: `Rhaid i enw’r uwch gyswllt fod yn wahanol i enw’r prif gyswllt`
                    })
                }
            ]
        }),
        seniorContactDateOfBirth: dateOfBirthField(
            'seniorContactDateOfBirth',
            MIN_AGE_SENIOR_CONTACT,
            seniorContactName
        ),
        seniorContactAddress: fieldAddress(
            locale,
            {
                name: 'seniorContactAddress',
                label: localise({
                    en: 'Home address',
                    cy: 'Cyfeiriad cartref'
                }),
                explanation: localise({
                    en: `We need the home address${
                        seniorContactName && seniorContactName !== ''
                            ? ` for <strong>${seniorContactName}</strong>`
                            : ''
                    } to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy: `Byddwn angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio eu cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`
                }),
                schema: stripIfExcludedOrgType(
                    Joi.ukAddress()
                        .required()
                        .compare(Joi.ref('mainContactAddress'))
                )
            },
            [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Senior contact address must be different from the main contact's address`,
                        cy: `Rhaid i gyfeiriad e-bost yr uwch gyswllt fod yn wahanol i gyfeiriad e-bost y prif gyswllt.`
                    })
                }
            ]
        ),
        seniorContactAddressHistory: addressHistoryField({
            name: 'seniorContactAddressHistory',
            label: localise({
                en: `Have they lived at their home address for the last three years?`,
                cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`
            })
        }),
        seniorContactEmail: new EmailField({
            locale: locale,
            name: 'seniorContactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Byddwn yn defnyddio hwn pan fyddwn yn cysylltu ynglŷn â’r prosiect`
            })
        }),
        seniorContactPhone: new PhoneField({
            locale: locale,
            name: 'seniorContactPhone'
        }),
        seniorContactLanguagePreference: fieldContactLanguagePreference(
            locale,
            {
                name: 'seniorContactLanguagePreference'
            }
        ),
        seniorContactCommunicationNeeds: {
            name: 'seniorContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu sydd gan y cyswllt hwn.`
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .max(FREE_TEXT_MAXLENGTH.large)
                .optional(),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Particular communication needs must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ]
        }
    };

    return allFields;
};
