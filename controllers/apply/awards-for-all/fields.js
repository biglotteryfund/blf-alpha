'use strict';
const config = require('config');
const moment = require('moment');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const has = require('lodash/has');
const { oneLine } = require('common-tags');

const Joi = require('../form-router-next/joi-extensions');
const {
    BENEFICIARY_GROUPS,
    COMPANY_NUMBER_TYPES,
    CONTACT_EXCLUDED_TYPES,
    FILE_LIMITS,
    MAX_BUDGET_TOTAL_GBP,
    MAX_PROJECT_DURATION,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MIN_BUDGET_TOTAL_GBP,
    MIN_START_DATE,
    ORG_MIN_AGE,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES
} = require('./constants');

const showContactConfirmationQuestion = config.get(
    'awardsForAll.showContactConfirmationQuestion'
);

const countriesFor = require('./lib/countries');
const locationsFor = require('./lib/locations');
const rolesFor = require('./lib/roles');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const currentOrganisationType = get('organisationType')(data);
    const currentOrganisationSubType = get('organisationSubType')(data);

    function multiChoice(options) {
        return Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();
    }

    function conditionalBeneficiaryChoice({ match, schema }) {
        return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
            is: 'yes',
            then: Joi.when(Joi.ref('beneficiariesGroups'), {
                is: Joi.array()
                    .items(
                        Joi.string()
                            .only(match)
                            .required(),
                        Joi.any()
                    )
                    .required(),
                then: schema,
                otherwise: Joi.any().strip()
            }),
            otherwise: Joi.any().strip()
        });
    }

    function stripIfExcludedOrgType(schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
            then: Joi.any().strip(),
            otherwise: schema
        });
    }

    function stripUnlessOrgTypes(types, schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(types),
            then: schema,
            otherwise: Joi.any().strip()
        });
    }

    function emailField(props, additionalMessages = []) {
        const defaultProps = {
            label: localise({ en: 'Email', cy: '' }),
            type: 'email',
            attributes: { autocomplete: 'email' },
            isRequired: true,
            schema: Joi.string()
                .email()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter an email address',
                        cy: ''
                    })
                },
                {
                    type: 'string.email',
                    message: localise({
                        en: `Email address must be in the correct format, like name@example.com`,
                        cy: ``
                    })
                }
            ].concat(additionalMessages)
        };

        return { ...defaultProps, ...props };
    }

    function phoneField(props) {
        const defaultProps = {
            type: 'tel',
            attributes: { size: 30, autocomplete: 'tel' },
            isRequired: true,
            schema: Joi.string()
                .phoneNumber()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a UK telephone number',
                        cy: ''
                    })
                },
                {
                    type: 'string.phonenumber',
                    message: localise({
                        en: 'Enter a real UK telephone number',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function addressField(props, additionalMessages = []) {
        const defaultProps = {
            type: 'address',
            isRequired: true,
            schema: Joi.ukAddress().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a full UK address',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({
                        en: 'Enter a town or city',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({ en: 'Enter a postcode', cy: '' })
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a real postcode',
                        cy: ''
                    })
                }
            ].concat(additionalMessages)
        };

        return { ...defaultProps, ...props };
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
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.required',
                    key: 'currentAddressMeetsMinimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({ en: 'Enter a town or city', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({ en: 'Enter a county', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({ en: 'Enter a postcode', cy: '' })
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function nameField(props, additionalMessages = []) {
        const defaultProps = {
            type: 'full-name',
            isRequired: true,
            schema: Joi.fullName().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter first and last name',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'firstName',
                    message: localise({
                        en: 'Enter first name',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'lastName',
                    message: localise({
                        en: 'Enter last name',
                        cy: ''
                    })
                }
            ].concat(additionalMessages)
        };

        return { ...defaultProps, ...props };
    }

    function dateOfBirthField(minAge, props) {
        const defaultProps = {
            explanation: localise({
                en: `We need their date of birth to help confirm who they are. And we do check their date of birth. So make sure you've entered it right. If you don't, it could delay your application.`,
                cy: ''
            }),
            type: 'date',
            attributes: {
                max: moment()
                    .subtract(minAge, 'years')
                    .format('YYYY-MM-DD')
            },
            isRequired: true,
            schema: stripIfExcludedOrgType(
                Joi.dateParts()
                    .dob(minAge)
                    .required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a date of birth', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({ en: 'Enter a real date', cy: '' })
                },
                {
                    type: 'dateParts.dob',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: ''
                    })
                },
                {
                    type: 'dateParts.dob.tooOld',
                    message: localise({
                        en: `Their birth date is not valid - please use four digits, eg. 1986`,
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function fieldProjectDateRange() {
        const minDate = moment().add(
            MIN_START_DATE.amount,
            MIN_START_DATE.unit
        );
        const minDateAfter = minDate.subtract(1, 'days');

        return {
            name: 'projectDateRange',
            label: localise({
                en: `When would you like to start and end your project?`,
                cy: ``
            }),
            settings: {
                minYear: minDate.format('YYYY')
            },
            explanation: localise({
                en: `<p>
                    If you don't know exactly, your dates can be estimates.
                    But you need to start your project after
                    ${minDate.format('DD/MM/YYYY')}.
                </p>
                <p>
                    We usually only fund projects that last
                    ${localise(MAX_PROJECT_DURATION.label)} or less.
                    So, the end date can't be more than
                    ${localise(
                        MAX_PROJECT_DURATION.label
                    )} after the start date.    
                </p>
                <p><strong>If your project is a one-off event</strong></p>
                <p>
                    Just let us know the date you plan to hold the event
                    in the start and end date boxes below.
                </p>`,
                cy: ''
            }),
            type: 'date-range',
            isRequired: true,
            schema: Joi.dateRange()
                .minDate(minDate.format('YYYY-MM-DD'))
                .endDateLimit(
                    MAX_PROJECT_DURATION.amount,
                    MAX_PROJECT_DURATION.unit
                ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a project start and end date',
                        cy: ''
                    })
                },
                {
                    type: 'dateRange.both.invalid',
                    message: localise({
                        en: `Project start and end dates must be real dates`,
                        cy: ''
                    })
                },
                {
                    type: 'datesRange.startDate.invalid',
                    message: localise({
                        en: `Date you start the project must be a real date`,
                        cy: ''
                    })
                },
                {
                    type: 'dateRange.endDate.invalid',
                    message: localise({
                        en: 'Date you end the project must be a real date',
                        cy: ''
                    })
                },
                {
                    type: 'dateRange.minDate.invalid',
                    message: localise({
                        en: oneLine`Date you start the project must be after
                            ${minDateAfter.format('D MMMM YYYY')}`,
                        cy: ''
                    })
                },
                {
                    type: 'dateRange.endDate.outsideLimit',
                    message: localise({
                        en: oneLine`Date you end the project must be within
                            ${localise(
                                MAX_PROJECT_DURATION.label
                            )} of the start date.`,
                        cy: ''
                    })
                },
                {
                    type: 'dateRange.endDate.beforeStartDate',
                    message: localise({
                        en: `Date you end the project must be after the start date`,
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldProjectCountry() {
        return {
            name: 'projectCountry',
            label: localise({
                en: 'What country will your project be based in?',
                cy: ''
            }),
            explanation: localise({
                en: oneLine`We work slightly differently depending on which
                    country your project is based in, to meet local needs
                    and the regulations that apply there.`,
                cy: ''
            }),
            type: 'radio',
            options: countriesFor({
                locale: locale,
                allowedCountries: config.get('awardsForAll.allowedCountries')
            }),
            isRequired: true,
            get schema() {
                const allowedOptions = this.options.filter(function(option) {
                    return has(option, 'attributes.disabled') === false;
                });
                return Joi.string()
                    .valid(allowedOptions.map(option => option.value))
                    .required();
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Select a country', cy: '' })
                }
            ]
        };
    }

    function fieldYourIdeaProject() {
        const minWords = 50;
        const maxWords = 300;

        return {
            name: 'yourIdeaProject',
            label: localise({
                en: 'What would you like to do?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>
                    Here are some ideas of what to tell us about your project:
                </strong></p>
                <ul>
                    <li>What you would like to do</li>
                    <li>What difference your project will make</li>
                    <li>Who will benefit from it</li>
                    <li>How long you expect to run it for. This can be an estimate</li>
                    <li>How you'll make sure people know about it</li>
                    <li>How you plan to learn from it and use this
                        learning to shape future projects</li>
                    <li>Is it something new, or are you continuing something that
                        has worked well previously? We want to fund both types of projects</li>
                </ul>
                <p><strong>
                    You can write up to ${maxWords} words for this section,
                    but don't worry if you use less.
                </strong></p>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: minWords,
                maxWords: maxWords
            },
            attributes: { rows: 20 },
            isRequired: true,
            schema: Joi.string()
                .minWords(minWords)
                .maxWords(maxWords)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us about your project',
                        cy: ''
                    })
                },
                {
                    type: 'string.minWords',
                    message: localise({
                        en: `Answer must be at least ${minWords} words`,
                        cy: ''
                    })
                },
                {
                    type: 'string.maxWords',
                    message: localise({
                        en: `Answer must be no more than ${maxWords} words`,
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldYourIdeaPriorities() {
        const minWords = 50;
        const maxWords = 150;

        return {
            name: 'yourIdeaPriorities',
            label: localise({
                en: `How does your project meet at least one of our funding priorities?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>
                    National Lottery Awards for All has three funding priorities, 
                    please tell us how your project will
                    <strong>meet at least one of these:</strong>
                </p>
                <ol>
                    <li>Bring people together and build strong
                        relationships in and across communities</li>
                    <li>Improve the places and spaces that matter to communities</li>
                    <li>Help more people to reach their potential,
                        by supporting them at the earliest possible stage</li>
                </ol>
                <p>You can tell us if your project meets more than one priority,
                   but don't worry if it doesn't.</p>
                <p><strong>
                    You can write up to ${maxWords} words for this section,
                    but don't worry if you use less.
                </strong></p>`,
                cy: ``
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: minWords,
                maxWords: maxWords
            },
            attributes: {
                rows: 12
            },
            isRequired: true,
            schema: Joi.string()
                .minWords(minWords)
                .maxWords(maxWords)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project meets at least one of our funding priorities`,
                        cy: ``
                    })
                },
                {
                    type: 'string.minWords',
                    message: localise({
                        en: `Answer must be at least ${minWords} words`,
                        cy: ''
                    })
                },
                {
                    type: 'string.maxWords',
                    message: localise({
                        en: `Answer must be no more than ${maxWords} words`,
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldYourIdeaCommunity() {
        const minWords = 50;
        const maxWords = 200;

        return {
            name: 'yourIdeaCommunity',
            label: localise({
                en: 'How does your project involve your community?',
                cy: ''
            }),
            explanation: localise({
                en: `
                <details class="o-details u-margin-bottom-s">
                    <summary class="o-details__summary">What do we mean by community?</summary>
                    <div class="o-details__content">
                        <ol>
                            <li>People living in the same area</li>
                            <li>People who have similar interests or life experiences,
                                but might not live in the same area</li>
                            <li>Even though schools can be at the heart of a
                                community—we'll only fund schools that also
                                benefit the communities around them.</li>
                        </ol>
                    <div>
                </details>
                <p>
                    We believe that people understand what's needed in their
                    communities better than anyone. Tell us how your community 
                    came up with the idea for your project. We want to know how
                    many people you've spoken to, and how they'll be involved
                    in the development and delivery of the project.
                </p>
                <p><strong>Here are some examples of how you could be involving your community:</strong></p>
                <ul>
                    <li>Having regular chats with community members, in person or on social media</li>
                    <li>Including community members on your board or committee</li>
                    <li>Regular surveys</li>
                    <li>Setting up steering groups</li>
                    <li>Running open days</li>
                </ul>
                <p><strong>
                    You can write up to ${maxWords} words for this section,
                    but don't worry if you use less.
                </strong></p>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: minWords,
                maxWords: maxWords
            },
            attributes: { rows: 15 },
            isRequired: true,
            schema: Joi.string()
                .minWords(minWords)
                .maxWords(maxWords)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project involves your community`,
                        cy: ``
                    })
                },
                {
                    type: 'string.minWords',
                    message: localise({
                        en: `Answer must be at least ${minWords} words`,
                        cy: ''
                    })
                },
                {
                    type: 'string.maxWords',
                    message: localise({
                        en: `Answer must be no more than ${maxWords} words`,
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldOrganisationType() {
        const options = [
            {
                value: ORGANISATION_TYPES.UNREGISTERED_VCO,
                label: localise({
                    en: 'Unregistered voluntary or community organisation',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation has been set up with a governing document, like a constitution, but it's not a charity or a company. Some examples of these sorts of groups would be a sports club, community club or residents association.</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                label: localise({
                    en: 'Registered charity (unincorporated)',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a voluntary or community organisation and is a registered charity, but <strong>is not</strong> a company registered with Companies House</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.CIO,
                label: localise({
                    en: 'Charitable incorporated organisation (CIO)',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a registered charity with limited liability, but <strong>is not</strong> a company registered with Companies House</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                label: localise({ en: 'Not-for-profit company', cy: '' }),
                explanation: localise({
                    en: `<p>My organisation is a not-for-profit company registered with Companies House, and <strong>may also</strong> be registered as a charity</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.SCHOOL,
                label: localise({
                    en: 'School',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a school</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
                label: localise({
                    en: 'College or University',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a college, university, or other registered educational establishment</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.STATUTORY_BODY,
                label: localise({ en: 'Statutory body', cy: '' }),
                explanation: localise({
                    en: `<p>My organisation is a public body, such as a local authority, parish council, or police or health authority</p>`,
                    cy: ''
                })
            },
            {
                value: ORGANISATION_TYPES.FAITH_GROUP,
                label: localise({ en: 'Faith-based group', cy: '' }),
                explanation: localise({
                    en: `<p>My organisation is a church, mosque, temple, synagogue etc.</p>`,
                    cy: ''
                })
            }
        ];

        return {
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: ''
            }),
            explanation: localise({
                en: `If you're both a charity and a company - just pick 'Registered charity' below.`,
                cy: ''
            }),
            type: 'radio',
            options: options,
            isRequired: true,
            schema: Joi.string()
                .valid(options.map(option => option.value))
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a type of organisation',
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldCompanyNumber() {
        return {
            name: 'companyNumber',
            label: localise({ en: 'Companies House number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: stripUnlessOrgTypes(
                COMPANY_NUMBER_TYPES,
                Joi.string().required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s Companies House number',
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldCharityNumber() {
        /**
         * Charity number fields schema
         * If organisation type is in required list then this field is required
         * Or, if organisation type is in the optional list then this field is optional
         * Otherwise, strip the value from the resulting data
         * Note: .optional doesn't allow null so needs to also allow null
         */
        const schema = Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CHARITY_NUMBER_TYPES.required),
            then: Joi.string().required()
        }).when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CHARITY_NUMBER_TYPES.optional),
            then: [Joi.string().optional(), Joi.allow(null)],
            otherwise: Joi.any().strip()
        });

        return {
            name: 'charityNumber',
            label: localise({ en: 'Charity registration number', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: CHARITY_NUMBER_TYPES.required.includes(
                currentOrganisationType
            ),
            schema: schema,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s charity number',
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldEducationNumber() {
        return {
            name: 'educationNumber',
            label: localise({ en: 'Department for Education number', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: stripUnlessOrgTypes(
                EDUCATION_NUMBER_TYPES,
                Joi.string().required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter your organisation’s Department for Education number`,
                        cy: ''
                    })
                }
            ]
        };
    }

    function fieldSeniorContactRole() {
        /**
         * Statutory bodies require a sub-type,
         * some of which allow free text input for roles.
         */
        function isFreeText() {
            return (
                currentOrganisationType === ORGANISATION_TYPES.STATUTORY_BODY &&
                [
                    STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    STATUTORY_BODY_TYPES.POLICE_AUTHORITY
                ].includes(currentOrganisationSubType)
            );
        }

        return {
            name: 'seniorContactRole',
            label: localise({ en: 'Role', cy: '' }),
            explanation: localise({
                en: `<p>
                    You told us what sort of organisation you are earlier.
                    ${
                        isFreeText()
                            ? `So the senior contact role should be someone in a position of authority in your organisation.`
                            : `So the senior contact role options we're giving you now are based on your 
                               organisation type. The options given to you for selection are based on this.`
                    }
                </p>`,
                cy: ''
            }),
            get warnings() {
                let result = [];

                const projectCountry = get('projectCountry')(data);

                const isCharityOrCompany = [
                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    ORGANISATION_TYPES.CIO,
                    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                ].includes(currentOrganisationType);

                /**
                 * Scotland doesn't include trustees in their charity commission
                 * data, so don't show this message in Scotland.
                 */
                if (isCharityOrCompany && projectCountry !== 'scotland') {
                    result.push(
                        localise({
                            en: `Your senior contact must be listed as a member of your organisation's
                                 board or committee with the Charity Commission/Companies House.`,
                            cy: ``
                        })
                    );
                }

                if (currentOrganisationType === ORGANISATION_TYPES.CIO) {
                    result.push(
                        localise({
                            en: `As a charity, your senior contact can be one of your organisation's trustees.
                         This can include trustees taking on the role of Chair, Vice Chair or Treasurer.`,
                            cy: ``
                        })
                    );
                }

                if (
                    currentOrganisationType ===
                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY
                ) {
                    result.push(
                        localise({
                            en: `As a registered charity, your senior contact must be one of your organisation's trustees. 
                                 This can include trustees taking on the role of Chair, Vice Chair or Treasurer.`,
                            cy: ``
                        })
                    );
                }

                if (currentOrganisationType === ORGANISATION_TYPES.SCHOOL) {
                    result.push(
                        localise({
                            en: `As a school, your senior contact must be the headteacher`,
                            cy: ``
                        })
                    );
                }

                return result;
            },
            type: isFreeText() ? 'text' : 'radio',
            options: rolesFor({
                locale: locale,
                organisationType: currentOrganisationType,
                organisationSubType: currentOrganisationSubType
            }),
            isRequired: true,
            get schema() {
                if (isFreeText()) {
                    return Joi.string().required();
                } else {
                    return Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required();
                }
            },
            messages: [
                {
                    type: 'base',
                    message: isFreeText()
                        ? localise({ en: 'Enter a role', cy: '' })
                        : localise({ en: 'Choose a role', cy: '' })
                },
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: 'Senior contact role is not valid',
                        cy: ''
                    })
                }
            ]
        };
    }

    let allFields = {
        projectName: {
            name: 'projectName',
            label: localise({
                en: 'What is the name of your project?',
                cy: ''
            }),
            explanation: localise({
                en: 'The project name should be simple and to the point',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a project name', cy: '' })
                }
            ]
        },
        projectDateRange: fieldProjectDateRange(),
        projectCountry: fieldProjectCountry(),
        projectLocation: {
            name: 'projectLocation',
            label: localise({
                en: 'Where will your project take place?',
                cy: ''
            }),
            explanation: localise({
                en: `If your project covers more than one area please tell us where most of it will take place`,
                cy: ''
            }),
            type: 'select',
            defaultOption: localise({ en: 'Select a location', cy: '' }),
            get optgroups() {
                const country = get('projectCountry')(data);
                return locationsFor(country);
            },
            isRequired: true,
            get schema() {
                const options = flatMap(this.optgroups, group => group.options);
                return Joi.when('projectCountry', {
                    is: Joi.exist(),
                    then: Joi.string()
                        .valid(options.map(option => option.value))
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Select a location', cy: '' })
                }
            ]
        },
        projectLocationDescription: {
            name: 'projectLocationDescription',
            label: localise({
                en: `Tell us the towns or villages where people who will benefit from your project live`,
                cy: ``
            }),
            type: 'text',
            attributes: {
                size: 60
            },
            isRequired: true,
            schema: Joi.when('projectCountry', {
                is: Joi.exist(),
                then: Joi.string().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us the towns, villages or wards your beneficiaries live in`,
                        cy: ''
                    })
                }
            ]
        },
        projectPostcode: {
            name: 'projectPostcode',
            label: localise({
                en: `What is the postcode of where your project will take place?`,
                cy: ``
            }),
            explanation: localise({
                en: `If your project will take place across different locations, please use the postcode where most of the project will take place.`,
                cy: ``
            }),
            type: 'text',
            attributes: {
                size: 10,
                autocomplete: 'postal-code'
            },
            isRequired: true,
            schema: Joi.when('projectCountry', {
                is: Joi.exist(),
                then: Joi.string()
                    .postcode()
                    .required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        },
        yourIdeaProject: fieldYourIdeaProject(),
        yourIdeaPriorities: fieldYourIdeaPriorities(),
        yourIdeaCommunity: fieldYourIdeaCommunity(),
        projectBudget: {
            name: 'projectBudget',
            label: localise({
                en: 'List the costs you would like us to fund',
                cy: ''
            }),
            explanation: localise({
                en: `<p>You should use budget headings, rather than a detailed list of items. For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine. Please enter whole numbers only.</p>
                <p>Please note you can only have a maximum of 10 rows.</p>`,
                cy: ''
            }),
            type: 'budget',
            attributes: {
                min: MIN_BUDGET_TOTAL_GBP,
                max: MAX_BUDGET_TOTAL_GBP,
                rowLimit: 10
            },
            isRequired: true,
            get schema() {
                return Joi.budgetItems()
                    .max(this.attributes.rowLimit)
                    .validBudgetRange(
                        MIN_BUDGET_TOTAL_GBP,
                        MAX_BUDGET_TOTAL_GBP
                    )
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Enter a project budget',
                            cy: ''
                        })
                    },
                    {
                        type: 'any.empty',
                        key: 'item',
                        message: localise({
                            en: 'Enter an item or activity',
                            cy: ''
                        })
                    },
                    {
                        type: 'number.base',
                        key: 'cost',
                        message: localise({ en: 'Enter an amount', cy: '' })
                    },
                    {
                        type: 'array.min',
                        message: localise({
                            en: 'Enter at least one item',
                            cy: ''
                        })
                    },
                    {
                        type: 'array.max',
                        message: localise({
                            en: `Enter no more than ${this.attributes.rowLimit} items`,
                            cy: ''
                        })
                    },
                    {
                        type: 'budgetItems.overBudget',
                        message: localise({
                            en: `Costs you would like us to fund must be less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                            cy: ``
                        })
                    },
                    {
                        type: 'budgetItems.underBudget',
                        message: localise({
                            en: `Costs you would like us to fund must be greater than £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`,
                            cy: ``
                        })
                    }
                ];
            }
        },
        projectTotalCosts: {
            name: 'projectTotalCosts',
            label: localise({
                en: 'Tell us the total cost of your project',
                cy: '(WELSH) Tell us the total cost of your project'
            }),
            explanation: localise({
                en: `<p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

                <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>`,
                cy: ``
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.budgetTotalCosts().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total cost for your project',
                        cy: ''
                    })
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en:
                            'Total cost must be a whole number (eg. no decimal point)',
                        cy: ''
                    })
                },
                {
                    type: 'budgetTotalCosts.underBudget',
                    message: localise({
                        en: `Total cost must be the same as or higher than the amount you’re asking us to fund`,
                        cy: ``
                    })
                }
            ]
        },
        beneficiariesGroupsCheck: {
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project open to everyone or is it aimed at a specific group of people?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>What do we mean by projects for specific groups?</p>
                    <p>
                      A wheelchair sports club is a place for disabled people to play wheelchair sport.
                      So, this is a project that’s specifically for disabled people.
                      Or a group that aims to empower African women in the community—this group is
                      specifically for people from a particular ethnic background.
                    </p>
                    <p>Check the one that applies:</p>`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'no',
                    label: localise({
                        en: `My project is open to everyone and isn’t aimed at a specific group of people`,
                        cy: ''
                    })
                },
                {
                    value: 'yes',
                    label: localise({
                        en: `My project is aimed at a specific group of people`,
                        cy: ''
                    })
                }
            ],
            isRequired: true,
            schema: Joi.string()
                .valid(['yes', 'no'])
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Select yes or no', cy: '' })
                }
            ]
        },
        beneficiariesGroups: {
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups is your project aimed at?`,
                cy: ``
            }),
            explanation: localise({
                en: `Check the boxes that apply:`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({ en: 'Disabled people', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: ``
                    })
                }
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options)
                        .required()
                        .when('beneficiariesGroupsOther', {
                            is: Joi.string().required(),
                            then: Joi.optional()
                        }),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the specific group(s) of people your project is aimed at`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsOther: {
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: '' }),
            explanation: localise({
                en: `If your project's for a specific group that's not mentioned above, tell us about it here:`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.when('beneficiariesGroupsCheck', {
                is: 'yes',
                then: Joi.string()
                    .allow('')
                    .optional(),
                otherwise: Joi.any().strip()
            }),
            messages: []
        },
        beneficiariesEthnicBackground: {
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({ en: `Ethnic background`, cy: '' }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from a particular ethnic background. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: ''
                            })
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: '' })
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: ''
                            })
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: ''
                            }),
                            explanation: localise({
                                en: `this refers to people whose parents are of a different ethnic background to each other`,
                                cy: ``
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: '' })
                        },
                        {
                            value: 'pakistani',
                            label: localise({ en: 'Pakistani', cy: '' })
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({ en: 'Bangladeshi', cy: '' })
                        },
                        {
                            value: 'chinese',
                            label: localise({ en: 'Chinese', cy: '' })
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({ en: 'Caribbean', cy: '' })
                        },
                        {
                            value: 'african',
                            label: localise({ en: 'African', cy: '' })
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: '' })
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: '' })
                        }
                    ]
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    schema: multiChoice(
                        flatMap(this.optgroups, o => o.options)
                    ).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the ethnic background(s) of the people that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsGender: {
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people of a particular gender. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: '' }) },
                { value: 'female', label: localise({ en: 'Female', cy: '' }) },
                { value: 'trans', label: localise({ en: 'Trans', cy: '' }) },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: '' })
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.GENDER,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the gender(s) of the people that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsAge: {
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from particular age groups. Please tell us which one(s).`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: '0-12' },
                { value: '13-24', label: '13-24' },
                { value: '25-64', label: '25-64' },
                { value: '65+', label: '65+' }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the age group(s) of the people that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsDisabledPeople: {
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: '' }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits disabled people. Please tell us which one(s).</p>
                <p>We use the definition from the Equality Act 2010, which defines a disabled person as someone who has a mental or physical impairment that has a substantial and long-term adverse effect on their ability to carry out normal day to day activity.</p>`,
                cy: ``
            }),

            type: 'checkbox',
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: ''
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: ''
                    })
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: ``
                    }),
                    explanation: localise({
                        en: `e.g. neuromotor impairments, such as epilepsy and cerebral palsy, or muscular/skeletal conditions, such as missing limbs and arthritis`,
                        cy: ''
                    })
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: ''
                    }),
                    explanation: localise({
                        en: `e.g. reduced intellectual ability and difficulty with everyday activities or conditions such as autism`,
                        cy: ''
                    })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the disabled people that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsReligion: {
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: ``
            }),
            explanation: localise({
                en: `You have indicated that your project mostly benefits people of a particular religion or belief, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: '' })
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: '' })
                },
                { value: 'jewish', label: localise({ en: 'Jewish', cy: '' }) },
                { value: 'muslim', label: localise({ en: 'Muslim', cy: '' }) },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: '' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.RELIGION,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the religion(s) or belief(s) of the people that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsReligionOther: {
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        beneficiariesWelshLanguage: {
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'all',
                    label: localise({ en: 'All', cy: '' })
                },
                {
                    value: 'more-than-half',
                    label: localise({ en: 'More than half', cy: '' })
                },
                {
                    value: 'less-than-half',
                    label: localise({ en: 'Less than half', cy: '' })
                },
                {
                    value: 'none',
                    label: localise({ en: 'None', cy: '' })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'wales',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the amount of people who speak Welsh that will benefit from your project`,
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesNorthernIrelandCommunity: {
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'both-catholic-and-protestant',
                    label: localise({
                        en: 'Both Catholic and Protestant',
                        cy: ''
                    })
                },
                {
                    value: 'mainly-protestant',
                    label: localise({
                        en: `Mainly Protestant (more than 60 per cent)`,
                        cy: ''
                    })
                },
                {
                    value: 'mainly-catholic',
                    label: localise({
                        en: 'Mainly Catholic (more than 60 per cent)',
                        cy: ''
                    })
                },
                {
                    value: 'neither-catholic-or-protestant',
                    label: localise({
                        en: 'Neither Catholic or Protestant',
                        cy: ''
                    })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'northern-ireland',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the community that the people who will benefit from your project belong to`,
                        cy: ''
                    })
                }
            ]
        },
        organisationLegalName: {
            name: 'organisationLegalName',
            label: localise({
                en: `What is the full legal name of your organisation?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: ''
                    })
                }
            ]
        },
        organisationTradingName: {
            name: 'organisationTradingName',
            label: localise({
                en: `If your organisation uses a different name in your day-to-day work, tell us it here`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationStartDate: {
            name: 'organisationStartDate',
            type: 'month-year',
            label: localise({
                en: `When was your organisation set up?`,
                cy: ''
            }),
            explanation: localise({
                en: `<p>Please tell us the month and year.</p>
                     <p><strong>For example: 11 2017</strong></p>`,
                cy: ''
            }),
            isRequired: true,
            schema: Joi.monthYear()
                .pastDate()
                .minTimeAgo(ORG_MIN_AGE.amount, ORG_MIN_AGE.unit)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a day and month', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: ''
                    })
                },
                {
                    type: 'monthYear.pastDate',
                    message: localise({
                        en: 'Date you enter must be in the past',
                        cy: ''
                    })
                }
            ]
        },
        organisationAddress: addressField({
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>Enter the postcode and search for the address, or enter it manually below.</p>`,
                cy: ``
            })
        }),
        organisationType: fieldOrganisationType(),
        organisationSubTypeStatutoryBody: {
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: ''
            }),
            type: 'radio',
            options: [
                {
                    value: STATUTORY_BODY_TYPES.PARISH_COUNCIL,
                    label: localise({ en: 'Parish Council', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.TOWN_COUNCIL,
                    label: localise({ en: 'Town Council', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.LOCAL_AUTHORITY,
                    label: localise({ en: 'Local Authority', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.NHS_TRUST,
                    label: localise({
                        en: 'NHS Trust/Health Authority',
                        cy: ''
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    label: localise({ en: 'Prison Service', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    label: localise({ en: 'Fire Service', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.POLICE_AUTHORITY,
                    label: localise({ en: 'Police Authority', cy: '' })
                }
            ],
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.STATUTORY_BODY,
                then: Joi.string().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us what type of statutory body you are',
                        cy: ''
                    })
                }
            ]
        },
        companyNumber: fieldCompanyNumber(),
        charityNumber: fieldCharityNumber(),
        educationNumber: fieldEducationNumber(),
        accountingYearDate: {
            name: 'accountingYearDate',
            label: localise({
                en: 'What is your accounting year end date?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>For example: 31 03</strong></p>`,
                cy: ''
            }),
            type: 'day-month',
            isRequired: true,
            schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
                is: true,
                then: Joi.dayMonth().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a day and month', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: ''
                    })
                }
            ]
        },
        totalIncomeYear: {
            name: 'totalIncomeYear',
            label: localise({
                en: 'What is your total income for the year?',
                cy: ''
            }),
            explanation: localise({
                en: 'Use whole numbers only, eg. 12000',
                cy: ''
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
                is: true,
                then: Joi.number()
                    .integer()
                    .required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en:
                            'Enter a total income for the year (eg. a whole number with no commas or decimal points)',
                        cy: ''
                    })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Total income must be a real number',
                        cy: ''
                    })
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en:
                            'Total income must be a whole number (eg. no decimal point)',
                        cy: ''
                    })
                }
            ]
        },
        mainContactName: nameField(
            {
                name: 'mainContactName',
                label: localise({ en: 'Full name of main contact', cy: '' }),
                explanation: localise({
                    en: 'This person has to live in the UK.',
                    cy: ''
                }),
                get warnings() {
                    let result = [];

                    const seniorSurname = get('seniorContactName.lastName')(
                        data
                    );

                    const lastNamesMatch =
                        seniorSurname &&
                        seniorSurname === get('mainContactName.lastName')(data);

                    if (lastNamesMatch) {
                        result.push(
                            localise({
                                en: `<span class="js-form-warning-surname">We've noticed that your main and senior contact
                                     have the same surname. Remember we can't fund projects
                                     where the two contacts are married or related by blood.</span>`,
                                cy: ``
                            })
                        );
                    }

                    return result;
                },
                schema: Joi.fullName()
                    .mainContact()
                    .required()
            },
            [
                {
                    type: 'name.matchesOther',
                    message: localise({
                        en: `Main contact name must be different from the senior contact's name`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactDateOfBirth: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
            name: 'mainContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        mainContactAddress: addressField(
            {
                name: 'mainContactAddress',
                label: localise({ en: 'Home address', cy: '' }),
                explanation: localise({
                    en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy: ''
                }),
                schema: stripIfExcludedOrgType(Joi.ukAddress().mainContact())
            },
            [
                {
                    type: 'address.matchesOther',
                    message: localise({
                        en: `Main contact address must be different from the senior contact's address`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactAddressHistory: addressHistoryField({
            name: 'mainContactAddressHistory',
            label: localise({
                en:
                    'Have they lived at their home address for the last three years?',
                cy: ''
            })
        }),
        mainContactEmail: emailField(
            {
                name: 'mainContactEmail',
                label: localise({ en: 'Email', cy: '' }),
                explanation: localise({
                    en:
                        'We’ll use this whenever we get in touch about the project',
                    cy: ''
                }),
                schema: Joi.string()
                    .email()
                    .invalid(Joi.ref('seniorContactEmail'))
            },
            [
                {
                    type: 'any.invalid',
                    message: localise({
                        en: `Main contact email address must be different from the senior contact's email address`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactPhone: phoneField({
            name: 'mainContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        mainContactCommunicationNeeds: {
            name: 'mainContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        seniorContactRole: fieldSeniorContactRole(),
        seniorContactName: nameField(
            {
                name: 'seniorContactName',
                label: localise({ en: 'Full name of senior contact', cy: '' }),
                explanation: localise({
                    en: 'This person has to live in the UK.',
                    cy: ''
                }),
                schema: Joi.fullName()
                    .seniorContact()
                    .required()
            },
            [
                {
                    type: 'name.matchesOther',
                    message: localise({
                        en: `Senior contact name must be different from the main contact's name`,
                        cy: ``
                    })
                }
            ]
        ),
        seniorContactDateOfBirth: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'seniorContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        seniorContactAddress: addressField(
            {
                name: 'seniorContactAddress',
                label: localise({ en: 'Home address', cy: '' }),
                explanation: localise({
                    en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy: ''
                }),
                schema: stripIfExcludedOrgType(Joi.ukAddress().seniorContact())
            },
            [
                {
                    type: 'address.matchesOther',
                    message: localise({
                        en: `Senior contact address must be different from the main contact's address`,
                        cy: ``
                    })
                }
            ]
        ),
        seniorContactAddressHistory: addressHistoryField({
            name: 'seniorContactAddressHistory',
            label: localise({
                en: `Have they lived at their home address for the last three years?`,
                cy: ``
            })
        }),
        seniorContactEmail: emailField({
            name: 'seniorContactEmail',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        seniorContactPhone: phoneField({
            name: 'seniorContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        seniorContactCommunicationNeeds: {
            name: 'seniorContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        bankAccountName: {
            name: 'bankAccountName',
            label: localise({
                en: `Tell us the name of your organisation - as it appears on the bank statement`,
                cy: ''
            }),
            explanation: localise({
                en: `Not the name of your bank`,
                cy: ``
            }),
            type: 'text',
            attributes: { autocomplete: 'off' },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the name of your organisation, as it appears on your bank statement`,
                        cy: ''
                    })
                }
            ]
        },
        bankSortCode: {
            name: 'bankSortCode',
            label: localise({ en: 'Sort code', cy: '' }),
            explanation: localise({ en: 'eg. 123456', cy: '' }),
            type: 'text',
            attributes: { size: 20, autocomplete: 'off' },
            isRequired: true,
            schema: Joi.string()
                .replace(/\D/g, '')
                .length(6)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a sort code', cy: '' })
                },
                {
                    type: 'string.length',
                    message: localise({
                        en: 'Sort code must be six digits long',
                        cy: ''
                    })
                }
            ]
        },
        bankAccountNumber: {
            name: 'bankAccountNumber',
            label: localise({ en: 'Account number', cy: '' }),
            explanation: localise({ en: 'eg. 12345678', cy: '' }),
            type: 'text',
            attributes: { autocomplete: 'off' },
            isRequired: true,
            schema: Joi.string()
                .replace(/\D/g, '')
                .min(6)
                .max(11)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter an account number', cy: '' })
                },
                {
                    type: 'string.min',
                    message: localise({
                        en: 'Enter a valid length account number',
                        cy: ''
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: 'Enter a valid length account number',
                        cy: ''
                    })
                }
            ]
        },
        buildingSocietyNumber: {
            name: 'buildingSocietyNumber',
            label: localise({
                en: 'Building society number',
                cy: ''
            }),
            type: 'text',
            attributes: { autocomplete: 'off' },
            explanation: localise({
                en: `You only need to fill this in if your organisation's account is with a building society.`,
                cy: ``
            }),
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .empty(),
            messages: []
        },
        bankStatement: {
            name: 'bankStatement',
            label: localise({ en: 'Upload a bank statement', cy: '' }),
            // Used when editing an existing bank statement
            labelExisting: localise({
                en: 'Upload a new bank statement',
                cy: ''
            }),
            type: 'file',
            attributes: {
                accept: FILE_LIMITS.TYPES.map(type => type.mime).join(',')
            },
            isRequired: true,
            schema: Joi.object({
                filename: Joi.string().required(),
                size: Joi.number()
                    .max(FILE_LIMITS.SIZE.value)
                    .required(),
                type: Joi.string()
                    .valid(FILE_LIMITS.TYPES.map(type => type.mime))
                    .required()
            }).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Provide a bank statement',
                        cy: ''
                    })
                },
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: `Please upload a file in one of these formats: ${FILE_LIMITS.TYPES.map(
                            type => type.label
                        ).join(', ')}`,
                        cy: ''
                    })
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: `Please upload a file below ${FILE_LIMITS.SIZE.label}`,
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement1: {
            name: 'termsAgreement1',
            type: 'checkbox',
            label: localise({
                en: `You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string('yes').required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you're authorised to submit this application`,
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement2: {
            name: 'termsAgreement2',
            type: 'checkbox',
            label: localise({
                en: `All the information you have provided in your application is accurate and complete; and you will notify us of any changes.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that the information you've provided in this application is accurate`,
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement3: {
            name: 'termsAgreement3',
            type: 'checkbox',
            label: localise({
                en: `You understand that we will use any personal information you have provided for the purposes described under the <a href="/about/customer-service/data-protection">Data Protection Statement</a>.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you understand how we'll use any personal information you've provided`,
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement4: {
            name: 'termsAgreement4',
            type: 'checkbox',
            label: localise({
                en: `If information about this application is requested under the Freedom of Information Act, we will release it in line with our <a href="/about/customer-service/freedom-of-information">Freedom of Information policy.</a>`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you understand your application is subject to our Freedom of Information policy`,
                        cy: ''
                    })
                }
            ]
        },
        termsPersonName: {
            name: 'termsPersonName',
            label: localise({
                en: 'Full name of person completing this form',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the full name of the person completing this form`,
                        cy: ''
                    })
                }
            ],
            attributes: { autocomplete: 'name' }
        },
        termsPersonPosition: {
            name: 'termsPersonPosition',
            label: localise({ en: 'Position in organisation', cy: '' }),
            type: 'text',
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the position of the person completing this form`,
                        cy: ''
                    })
                }
            ],
            isRequired: true
        }
    };

    if (showContactConfirmationQuestion) {
        allFields.mainContactIsValid = {
            name: 'mainContactIsValid',
            label: localise({
                en: `I confirm that the main and senior contacts aren't married or in a long-term relationship with each other, living together at the same address, or related by blood`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'yes',
                    label: localise({
                        en: 'Yes',
                        cy: ''
                    })
                }
            ],
            isRequired: true,
            get schema() {
                return multiChoice(this.options).required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: `Main and senior contact can't be married or in a long-term relationship with each other, living together at the same address, or related by blood `,
                            cy: ''
                        })
                    }
                ];
            }
        };
    }
    return allFields;
};
