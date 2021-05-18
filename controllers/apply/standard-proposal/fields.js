'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const orderBy = require('lodash/orderBy');
const { oneLine } = require('common-tags');
const config = require('config');
const moment = require('moment');

const Joi = require('../lib/joi-extensions');

const {
    Field,
    AddressField,
    CheckboxField,
    CurrencyField,
    EmailField,
    NameField,
    PhoneField,
    RadioField,
    SelectField,
    TextareaField,
    DateField,
    UrlField,
    PercentageField,
} = require('../lib/field-types');

const {
    englandRegions,
    englandLocationOptions,
    northernIrelandLocationOptions,
} = require('./lib/locations');

const fieldProjectLocationPostcode = require('./fields/project-postcode');

const {
    fieldBeneficiariesPreflightCheck,
    fieldBeneficiariesGroups,
    fieldBeneficiariesGroupsAge,
    fieldBeneficiariesGroupsCheck,
    fieldBeneficiariesGroupsDisabledPeople,
    fieldBeneficiariesEthnicBackground,
    fieldBeneficiariesGroupsLGBT,
    fieldBeneficiariesGroupsReligion,
    fieldBeneficiariesNorthernIrelandCommunity,
    fieldBeneficiariesWelshLanguage,
    fieldBeneficiariesGroupsMigrant,
    fieldBeneficiariesGroupsOther,
    fieldBeneficiariesLeadershipGroups,
    fieldBeneficiariesLeadershipGroupsEthnicBackground,
    fieldBeneficiariesLeadershipGroupsReligion,
    fieldBeneficiariesLeadershipGroupsMigrant,
    fieldBeneficiariesLeadershipGroupsDisabledPeople,
    fieldBeneficiariesLeadershipGroupsAge,
    fieldBeneficiariesLeadershipGroupsLGBT,
    fieldBeneficiariesLeadershipGroupsOther,
    fieldBeneficiariesAnyGroupsOther,
    fieldBeneficiariesLeadershipAnyGroupsOther,
} = require('./fields/beneficiaries');

const {
    fieldAccountingYearDate,
    fieldTotalIncomeYear,
} = require('./fields/organisation-finances');

const {
    fieldTermsAgreement1,
    fieldTermsAgreement2,
    fieldTermsAgreement3,
    fieldTermsAgreement4,
    fieldTermsAgreement5,
    fieldTermsAgreement6,
    fieldTermsPersonName,
    fieldTermsPersonPosition,
} = require('./fields/terms');

const fieldContactAddressHistory = require('./fields/contact-address-history');

const fieldSeniorContactRole = require('./fields/senior-contact-role');
const fieldSMContactCommunicationNeeds = require('./fields/contact-communication-needs');

const { stripIfExcludedOrgType } = require('./fields/organisation-type');

const {
    CONTACT_EXCLUDED_TYPES,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const projectCountries = getOr([], 'projectCountries')(data);
    const projectTotalCost = get('projectTotalCost')(data);
    const mainContactPhone = get('mainContactPhone')(data);
    const seniorContactPhone = get('seniorContactPhone')(data);
    const beneficiariesGroupCheck = get('beneficiariesGroupsCheck')(data);

    function fieldProjectName() {
        const maxLength = 80;
        return new Field({
            locale: locale,
            name: 'projectName',
            label: localise({
                en: 'What is the name of your project?',
                cy: 'Beth yw enw eich prosiect?',
            }),
            explanation: localise({
                en: 'The project name should be simple and to the point',
                cy: 'Dylai enw’r prosiect fod yn syml ac eglur',
            }),
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a project name',
                        cy: 'Rhowch enw prosiect',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Project name must be ${maxLength} characters or less`,
                        cy: `Rhaid i enw’r prosiect fod yn llai na ${maxLength} nod`,
                    }),
                },
            ],
        });
    }

    function fieldProjectCountries() {
        const allowedCountries = config.get(
            'standardFundingProposal.allowedCountries'
        );

        function options() {
            function label(country) {
                let result = '';
                if (country === 'england') {
                    result = localise({
                        en: 'England',
                        cy: 'Lloegr',
                    });
                } else if (country === 'northern-ireland') {
                    result = localise({
                        en: 'Northern Ireland',
                        cy: 'Gogledd Iwerddon',
                    });
                }

                return result;
            }

            const options = ['england', 'northern-ireland'].map(function (
                country
            ) {
                const option = { value: country, label: label(country) };

                if (allowedCountries.includes(country) === false) {
                    option.attributes = { disabled: 'disabled' };
                }

                return option;
            });

            return orderBy(
                options,
                ['attributes.disabled', 'label'],
                ['desc', 'asc']
            );
        }

        return new RadioField({
            locale: locale,
            name: 'projectCountries',
            label: localise({
                en: `Confirm the country your project will be based in`,
                cy: ``,
            }),
            explanation: localise({
                en: oneLine`We work in different ways in each country, to meet local needs and rules.`,
                cy: oneLine`Rydym yn gweithredu ychydig yn wahanol, yn ddibynnol
                    ar pa wlad mae eich prosiect wedi’i leoli i ddiwallu
                    anghenion lleol a’r rheoliadau sy’n berthnasol yna.`,
            }),
            options: options(),
            /**
             * Treat single options as an array to account for
             * pending proposals that used checkbox selection.
             *
             * Multiple selection disabled until UK-portfolio is enabled.
             * Remove and switch back to checkbox when launching UK-portfolio
             * and change reference to "Which country" above
             */
            schema: Joi.array()
                .items(
                    Joi.string().valid(
                        ...options().map((option) => option.value)
                    )
                )
                .single()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a country',
                        cy: 'Dewiswch wlad',
                    }),
                },
            ],
        });
    }

    function fieldProjectRegions() {
        const options = englandRegions().map(function (item) {
            const locationOptions = englandLocationOptions().filter(
                (group) => group.id === item.value
            );

            const locationOptionsSummary = locationOptions
                .flatMap((group) => group.options.map((item) => item.label))
                .join(', ');

            item.explanation = locationOptionsSummary
                ? `Covering ${locationOptionsSummary}`
                : null;
            return item;
        });

        function schema() {
            const isEnglandSelected = Joi.array().items(
                Joi.string().valid('england').required(),
                Joi.any()
            );

            const validAllEngland = Joi.array()
                .items(
                    Joi.string().valid('all-england').required(),
                    Joi.any().strip()
                )
                .single()
                .required();

            const validRegionOptions = Joi.array()
                .items(
                    Joi.string().valid(...options.map((option) => option.value))
                )
                .single()
                .required();

            return Joi.when(Joi.ref('projectCountries'), {
                is: isEnglandSelected,
                then: Joi.alternatives([
                    validAllEngland,
                    validRegionOptions,
                ]).required(),
                otherwise: Joi.any().strip(),
            });
        }

        return new CheckboxField({
            locale: 'en',
            name: 'projectRegions',
            label: 'What areas will your project take place in?',
            explanation: 'You can tells us one (or more) areas',
            options: options,
            schema: schema(),
            messages: [{ type: 'base', message: 'Select one or more regions' }],
        });
    }

    function fieldProjectLocation() {
        function optgroups() {
            if (projectCountries.length > 1) {
                return [];
            } else if (projectCountries.includes('england')) {
                return englandLocationOptions(get('projectRegions')(data));
            } else if (projectCountries.includes('northern-ireland')) {
                return northernIrelandLocationOptions();
            } else {
                return [];
            }
        }

        return new SelectField({
            locale: locale,
            name: 'projectLocation',
            label: localise({
                en: `What area will most of the project take place in?`,
                cy: ``,
            }),
            explanation: localise({
                en: oneLine`If your project covers more than one area please
                tell us where most of it will take place.`,
                cy: oneLine`Os yw eich prosiect mewn mwy nag un ardal, dywedwch
                wrthym lle bydd y rhan fwyaf ohono yn cymryd lle.`,
            }),
            defaultOption: localise({
                en: 'Select a location',
                cy: 'Dewiswch leoliad',
            }),
            optgroups: optgroups(),
            schema: Joi.when('projectCountries', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
                otherwise: Joi.string()
                    .valid(
                        ...flatMap(optgroups(), (group) => group.options).map(
                            (option) => option.value
                        )
                    )
                    .required(),
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a location',
                        cy: 'Dewiswch leoliad',
                    }),
                },
            ],
        });
    }

    function fieldProjectLocationDescription() {
        const maxLength = 255;

        return new Field({
            locale: locale,
            name: 'projectLocationDescription',
            label: localise({
                en: 'Tell us all the locations the project will run in',
                cy: 'Lleoliad y prosiect',
            }),
            explanation: localise({
                en: oneLine`In your own words, describe all of the locations
                            that you’ll be running your project in. For example, ‘West
                            Yorkshire’, 'Salford' or ‘Antrim’.`,
                cy: ``,
            }),
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us all the locations that you'll be running your project in`,
                        cy: '',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Project locations must be ${maxLength} characters or less`,
                        cy: `Rhaid i leoliadau’r prosiect fod yn llai na ${maxLength} nod`,
                    }),
                },
            ],
        });
    }

    function fieldProjectTotalCost() {
        return new CurrencyField({
            locale: locale,
            name: 'projectTotalCost',
            label: localise({
                en: `What is the total cost of your project?`,
                cy: ``,
            }),
            get explanation() {
                return localise({
                    en: `<p>This is the cost of everything related to your project, even things you're not asking us to fund.</p>
                        <p>For example:
                            <ul>
                                <li>If you're asking us for £280,000 and you're getting £20,000 from another funder to cover additional costs, your total project cost is £300,000.</li>
                                <li>If you're asking us for £80,000 and there are no other costs, your total project cost is £80,000.</li>
                            </ul>
                        </p>
                        <p>We do not need to know where the rest of your funding's coming from right now.</p>`,
                    cy: ``,
                });
            },
            minAmount: 10001,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`Enter the total cost of your project`,
                        cy: '',
                    }),
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: `Total cost must be a whole number (eg. no decimal point)`,
                        cy: `Rhaid i’r cost fod yn rif cyflawn (e.e. dim pwynt degol)`,
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: oneLine`Total cost must be the same as or higher than the amount you’re asking us to fund.`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldProjectCosts() {
        function schema() {
            if (projectCountries.includes('england')) {
                if (projectTotalCost) {
                    return Joi.friendlyNumber()
                        .integer()
                        .min(10001)
                        .max(Joi.ref('projectTotalCost'));
                } else {
                    return Joi.friendlyNumber().integer().min(10001).max(0);
                }
            } else {
                return Joi.friendlyNumber()
                    .integer()
                    .min(10001)
                    .max(1000000000);
            }
        }
        function base() {
            if (projectCountries.includes('england')) {
                return {
                    type: 'base',
                    message: localise({
                        en:
                            'Enter an amount less than or equal to the total cost.',
                        cy: '',
                    }),
                };
            } else {
                return {
                    type: 'base',
                    message: localise({
                        en: 'Enter an amount.',
                        cy: '',
                    }),
                };
            }
        }

        return new CurrencyField({
            locale: locale,
            name: 'projectCosts',
            label: localise({
                en: `How much money do you want from us?`,
                cy: ``,
            }),
            get explanation() {
                return localise({
                    en: `This can be an estimate`,
                    cy: ``,
                });
            },
            schema: schema(),
            messages: [
                base(),
                {
                    type: 'number.integer',
                    message: localise({
                        en: `The amount you ask for must be a whole number (eg. no decimal point)`,
                        cy: `Rhaid i’r cost fod yn rif cyflawn (e.e. dim pwynt degol)`,
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: oneLine`The amount you ask for must be more than £10,000.
                            If you need less than this, 
                            <a href="/funding/under10k">you can apply for under £10,000 here</a>.`,
                        cy: ``,
                    }),
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: oneLine`The amount you ask us for cannot be more than the total cost of the project.`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldProjectSpend() {
        return new TextareaField({
            locale: locale,
            name: 'projectSpend',
            label: localise({
                en: 'What will you spend the money on?',
                cy: ``,
            }),
            explanation: localise({
                en: `<ul>
                        <li>Give us a list of budget headings (for example, salaries, running costs, training, travel, overheads and refurbishment costs).</li>
                        <li>We do not need any costs attached to these yet, or a detailed list of items.</li>
                     </ul>
                    <p>If we invite you to the next stage of the application process, we'll ask you for a more detailed project budget, including a year-by-year breakdown. But right now, we just want to check if these are things we can fund.</p>`,
            }),
            type: 'textarea',
            showWordCount: false,
            minWords: 0,
            maxWords: 300,
            maxRows: false,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us what you will spend the money on.`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldProjectStartDate() {
        function getLeadTimeWeeks(country) {
            const countryLeadTimes = {
                'england': 0,
                'northern-ireland': 12,
            };
            return countryLeadTimes[country];
        }

        const localise = get(locale);

        const projectCountry = get('projectCountries')(data);

        const minDate = moment().add(getLeadTimeWeeks(projectCountry), 'weeks');

        const maxDate = moment().add(10, 'years');

        const minDateExample = minDate
            .clone()
            .locale(locale)
            .format('DD MM YYYY');

        function schema() {
            /**
             * When projectStartDateCheck is asap
             * we don't show the project start date question
             * and instead pre-fill it with the current date
             * at the point of submission (see forSalesforce())
             */
            return Joi.when('projectStartDateCheck', {
                is: 'asap',
                then: Joi.any().strip(),
                otherwise: Joi.dateParts()
                    .minDate(minDate.format('YYYY-MM-DD'))
                    .maxDate(maxDate.format('YYYY-MM-DD'))
                    .required(),
            });
        }

        return new DateField({
            locale: locale,
            name: 'projectStartDate',
            label: localise({
                en: `When would you like the money, if you're awarded funding?`,
                cy: `Dywedwch wrthym pryd yr hoffech gael yr arian os dyfernir arian grant ichi?`,
            }),
            explanation: localise({
                en: oneLine`<p>Don't worry, this can be an estimate.</p>
                <p><strong>For example: ${minDateExample}</strong></p>`,
                cy: ``,
            }),
            settings: {
                minYear: minDate.format('YYYY'),
            },
            schema: schema(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a project start date`,
                        cy: `Cofnodwch ddyddiad dechrau i’ch prosiect`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: oneLine`The date you start the project must be on
                            or after ${minDateExample}`,
                        cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich
                            prosiect fod ar neu ar ôl ${minDateExample}`,
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: oneLine`The date you start the project must be less than 10 years in the future.`,
                        cy: oneLine``,
                    }),
                },
            ],
        });
    }

    function fieldProjectDurationYears() {
        return new RadioField({
            locale: locale,
            name: 'projectDurationYears',
            label: localise({
                en: `How long do you need the money for?`,
                cy: ``,
            }),
            explanation: localise({
                en: `We can fund projects for up to five years. If 
                your project is not an exact number of years, please 
                round up to the nearest year. For example, for an 18 
                month project, choose two years.`,
                cy: ``,
            }),
            options: [
                { label: localise({ en: 'Up to 1 year', cy: '' }), value: 1 },
                { label: localise({ en: '2 years', cy: '' }), value: 2 },
                { label: localise({ en: '3 years', cy: '' }), value: 3 },
                { label: localise({ en: '4 years', cy: '' }), value: 4 },
                { label: localise({ en: '5 years', cy: '' }), value: 5 },
            ],
            get schema() {
                return Joi.when('projectCountries', {
                    is: Joi.array().min(2),
                    then: Joi.any().strip(),
                    otherwise: Joi.number().integer().required().min(1).max(5),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a project length',
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldProjectWebsite() {
        const maxLength = 200;
        return new UrlField({
            locale: locale,
            name: 'projectWebsite',
            label: localise({
                en: 'Organisation website',
                cy: '',
            }),
            isRequired: false,
            maxLength: maxLength,
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Organisation website must be ${maxLength} characters or less`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldProjectOrganisation() {
        return new TextareaField({
            locale: locale,
            name: 'projectOrganisation',
            label: localise({
                en:
                    'Tell us why your organisation is the right one to manage this project',
                cy: '',
            }),
            explanation: localise({
                en: `
                <ul>
                    <li>Give us a brief description of your organisation and the work it does.</li>
                    <li>How does your organisation’s experience and connections mean it is best placed to run this project?</li>
                    <li>How would this project add value to the work you do?</li>
                    <li>To what extent is your organisation led by people with 'lived experience'? By this we mean people who have lived through the challenges the organisation is trying to address.</li>
                </ul>
                <p><strong>You can write up to 500 words for this section, but don't worry if you use less.</strong></p>`,
                cy: ``,
            }),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us why your organisation is the right one to manage this project`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldYourIdeaProject() {
        return new TextareaField({
            locale: locale,
            name: 'yourIdeaProject',
            label: localise({
                en: 'What would you like to do?',
                cy: `Beth yr hoffech ei wneud?`,
            }),
            explanation: localise({
                en: `<p>Tell us:</p>
                <ul>
                    <li>what you'd like to do</li>
                    <li>who will benefit from this project</li>
                    <li>what difference your project will make</li>
                    <li>if it's something new, or are you continuing
                        something that has worked well previously -
                        we want to fund both types of projects.</li>
                </ul>
                <p><strong>You can write up to 500 words for this section, but don't worry if you use less.</strong></p>`,
            }),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us what you would like to do`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldYourIdeaCommunity() {
        return new TextareaField({
            locale: locale,
            name: 'yourIdeaCommunity',
            label: localise({
                en: `How does your project involve your community?`,
                cy: `Sut mae eich prosiect yn cynnwys eich cymuned?`,
            }),
            explanation: localise({
                en: `<p>We believe that people understand what's needed in
                     their own communities better than anyone. Tell us how your 
                     community came up with the idea for your project. We want 
                     to know how many people you've spoken to, and how they'll 
                     be involved in the development and delivery of your project.
                </p>
                <p>What do we mean by community?</p>
                <p>A community can be made up of:</p>
                <ul>
                        <li>people living in the same area</li>
                        <li>people who have similar interests or life experiences,
                            but might not live in the same area</li>
                        <li>schools that also benefit the communities around them 
                            (even though schools can be at the heart of a community, 
                            we'll only fund projects that also benefit these communities).</li>
                    </ul>
                    <p><strong>You can write up to 500 words for this section, but don't worry if you use less.</strong></p>`,
                cy: ``,
            }),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project involves your community`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldYourIdeaActivities() {
        function explanation() {
            if (projectCountries.includes('england')) {
                return localise({
                    en: `<p>You might want to to tell us about:</p>
                <ul>
                    <li>any gaps in local services your work will fill</li>
                    <li>what other local activities your work will complement</li>
                    <li>what links you already have in the community that will help you deliver the project</li>
                    <li>if this project is being delivered in partnership, tell us the names of your partners and the background of you all working together.</li>
                </ul>
                <p><strong>You can write up to 500 words for this section, but don't worry if you use less.</strong></p>`,
                    cy: ``,
                });
            } else {
                return localise({
                    en: `<p>Tell us about how this project will fit in with other local activities.</p>
                <p>You might want to to tell us about:</p>
                <ul>
                    <li>what makes your organisation best placed to carry out the project</li>
                    <li>any gaps in local services your work will fill</li>
                    <li>what other local activities your work will complement</li>
                    <li>what links you already have in the community that will help you deliver the project</li>
                    <li>how you will work together with other organisations in your community.</li>
                </ul>
                <p><strong>You can write up to 500 words for this section, but don't worry if you use less.</strong></p>`,
                    cy: ``,
                });
            }
        }

        return new TextareaField({
            locale: locale,
            name: 'yourIdeaActivities',
            label: localise({
                en: 'How does your idea fit in with other local activities?',
                cy: '',
            }),
            explanation: explanation(),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your idea fits in with other local activities`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldOrganisationLegalName() {
        const maxLength = 255;
        return new Field({
            locale: locale,
            name: 'organisationLegalName',
            label: localise({
                en: 'What is the full legal name of your organisation?',
                cy: '',
            }),
            explanation: localise({
                en: `<p>This must be as shown on your governing document.
                    Your governing document could be called one of several things,
                    depending on the type of organisation you're applying
                    on behalf of. It may be called a constitution, trust deed,
                    memorandum and articles of association,
                    or something else entirely.</p> 
                    <p>You might find it on a registration website - for example, Companies House or a Charities Register.</p>`,
                cy: ``,
            }),
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: 'Rhowch enw cyfreithiol llawn eich sefydliad',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `The full legal name of organisation must be ${maxLength} characters or less`,
                        cy: `Rhaid i’r enw cyfreithiol llawn fod yn llai na ${maxLength} nod`,
                    }),
                },
            ],
        });
    }

    function fieldOrganisationDifferentName() {
        return new RadioField({
            locale: locale,
            name: 'organisationDifferentName',
            label: localise({
                en: `Does your organisation use a different name in your day-to-day work?`,
                cy: ``,
            }),
            explanation: localise({
                en: `This is how you might be known if you're not just known by your legal name (the legal name is on your governing document or registration website).`,
                cy: ``,
            }),
            options: [
                { label: localise({ en: 'Yes', cy: '' }), value: 'yes' },
                { label: localise({ en: 'No', cy: '' }), value: 'no' },
            ],
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select yes or no.',
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationTradingName() {
        const legalName = get('organisationLegalName')(data);
        function explanation() {
            if (legalName) {
                return localise({
                    en: oneLine`This is how you might be known if you're not just known 
                by your legal name, <strong>${legalName}</strong>.`,
                    cy: ``,
                });
            } else {
                return localise({
                    en: oneLine`This is how you might be known if you're not just known 
                by your legal name.`,
                    cy: ``,
                });
            }
        }
        const maxLength = 255;
        return new Field({
            locale: locale,
            name: 'organisationTradingName',
            label: localise({
                en:
                    'Tell us the name your organisation uses in your day-to-day work',
                cy: '',
            }),
            explanation: explanation(),
            schema: Joi.when('organisationDifferentName', {
                is: 'yes',
                then: Joi.string()
                    .max(maxLength)
                    .invalid(Joi.ref('organisationLegalName'))
                    .required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: "Enter your organisation's day-to-day name",
                        cy: '',
                    }),
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en:
                            "Organisation's day-to-day name must not be the same as its legal name",
                        cy: '',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Organisation's day-to-day name must be ${maxLength} characters or less`,
                        cy: `Rhaid i enw dydd i ddydd y sefydliad fod yn llai na ${maxLength} nod`,
                    }),
                },
            ],
        });
    }

    function fieldOrganisationAddress() {
        return new AddressField({
            locale: locale,
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`,
            }),
        });
    }

    function fieldOrganisationStartDate() {
        function getLeadTimeWeeks(country) {
            const countryLeadTimes = {
                'england': 0,
                'northern-ireland': 12,
            };
            return countryLeadTimes[country];
        }

        const localise = get(locale);

        const projectCountry = get('projectCountries')(data);

        const minDate = moment().subtract(1000, 'years');

        const date = moment().add(getLeadTimeWeeks(projectCountry), 'weeks');

        const dateExample = date.clone().locale(locale).format('DD MM YYYY');

        const maxDate = moment();

        function schema() {
            /**
             * When projectStartDateCheck is asap
             * we don't show the project start date question
             * and instead pre-fill it with the current date
             * at the point of submission (see forSalesforce())
             */

            return Joi.dateParts()
                .minDate(minDate.format('YYYY-MM-DD'))
                .maxDate(maxDate.format('YYYY-MM-DD'))
                .required();
        }

        return new DateField({
            locale: locale,
            name: 'organisationStartDate',
            label: localise({
                en: `When was your organisation set up?`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>This is the date your organisation took on its current legal status. 
                It should be on your governing document. If you do not know the exact date or 
                month, give us an approximate date.</p>
                <p><strong>For example: ${dateExample}</strong></p>`,
                cy: oneLine``,
            }),
            schema: schema(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter your organisation start date`,
                        cy: ``,
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: oneLine`Date you entered must be in the past.`,
                        cy: oneLine``,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: `Enter your organisation start date`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function fieldOrganisationSupport() {
        return new Field({
            locale: locale,
            name: 'organisationSupport',
            label: localise({
                en: `How many people in England does your whole organisation directly support in a typical year?`,
                cy: ``,
            }),
            explanation: localise({
                en: `We’re not looking for how many people your specific project will support 
                - we’ll ask for that at the end of the grant.`,
                cy: ``,
            }),
            schema: Joi.friendlyNumber()
                .integer()
                .min(0)
                .max(70000000)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: "Enter a number that's less than 70,000,000.",
                        cy: '',
                    }),
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: "Enter a number that's less than 70,000,000.",
                        cy: '',
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: 'Enter a number.',
                        cy: '',
                    }),
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: "Enter a number that's less than 70,000,000.",
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationVolunteers() {
        return new Field({
            locale: locale,
            name: 'organisationVolunteers',
            label: localise({
                en: `How many volunteers do you have in your whole organisation?`,
                cy: ``,
            }),
            explanation: localise({
                en: `We’re not looking for the number of volunteers you’ll work with 
                on this project specifically - we’ll ask for that at the end of the grant.`,
                cy: ``,
            }),
            schema: Joi.friendlyNumber().integer().min(0).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a number.',
                        cy: '',
                    }),
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: 'Use whole numbers only, eg. 12',
                        cy: '',
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: 'Enter a number.',
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationFullTimeStaff() {
        return new Field({
            locale: locale,
            name: 'organisationFullTimeStaff',
            label: localise({
                en: `How many full-time equivalent staff work for your whole organisation?`,
                cy: ``,
            }),
            explanation: localise({
                en: `To help you give us an idea, full-time hours are usually around 37 hours 
                per week. So, to find out how many full-time equivalent staff you have, you 
                need to divide the total number of hours worked by staff at your organisation by 37.`,
                cy: ``,
            }),
            schema: Joi.number().precision(2).min(0).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a number.',
                        cy: '',
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: 'Enter a number.',
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationLeadership() {
        return new PercentageField({
            locale: locale,
            name: 'organisationLeadership',
            label: localise({
                en: `What percentage of your leadership (for example, senior management team, board, 
                committee) have 'lived experience' of the issues you're trying to address?`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>When we say lived experience, we mean organisations led by people 
                        who have lived through challenges the organisation is trying to tackle.</p>
                      <p>For example:</p>
                      <ul>
                        <li>a charity working with care experienced people being led by people who have been in care</li>
                        <li>an organisation working with disabled people being led by disabled people</li>
                        <li>an organisation that works in or with particular Black, Asian or Minority Ethnic (BAME) communities having a leadership team that reflects those communities</li>
                        <li>an organisation that provides support to people affected by autism where someone from the organisation has a family member with autism.</li>
                      </ul>`,
                cy: ``,
            }),
            isRequired: false,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a number.`,
                        cy: ``,
                    }),
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: 'Number must be between 0 and 100.',
                        cy: '',
                    }),
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: 'Number must be between 0 and 100.',
                        cy: '',
                    }),
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: 'Use whole numbers only, eg. 12',
                        cy: '',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationType() {
        return new RadioField({
            locale: locale,
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: 'Pa fath o sefydliad ydych chi?',
            }),
            explanation: localise({
                en: `If you're both a charity and a company—just pick ‘Not-for-profit company’ below.`,
                cy: `Os ydych yn elusen ac yn gwmni—dewiswch ‘Cwmni di-elw’ isod.`,
            }),
            options: [
                {
                    value: 'unregistered-vco',
                    label: localise({
                        en: `Unregistered voluntary or community organisation`,
                        cy: `Sefydliad gwirfoddol neu gymunedol anghofrestredig`,
                    }),
                    explanation: localise({
                        en: oneLine`An organisation set up with a governing document
                            - like a constitution. But isn't a registered charity or company.`,
                        cy: oneLine`Sefydliad wedi’i sefydlu â dogfen lywodraethol
                            – fel cyfansoddiad. Ond nid yw’n elusen na chwmni cofrestredig.`,
                    }),
                },
                {
                    value: 'not-for-profit-company',
                    label: localise({
                        en: 'Not-for-profit company',
                        cy: 'Cwmni di-elw',
                    }),
                    explanation: localise({
                        en: oneLine`A company limited by guarantee - registered with Companies House. 
                            And might also be registered as a charity.`,
                        cy: oneLine`Cwmni sy’n gyfyngedig drwy warant – yn gofrestredig â Thŷ’r Cwmnïau. 
                            A gall hefyd fod wedi’i gofrestru fel elusen.`,
                    }),
                },
                {
                    value: 'unincorporated-registered-charity',
                    label: localise({
                        en: `Registered charity (unincorporated)`,
                        cy: `Elusen gofrestredig (anghorfforedig)`,
                    }),
                    explanation: localise({
                        en: oneLine`A voluntary or community organisation that's a registered charity. 
                            But isn't a company registered with Companies House.`,
                        cy: oneLine`Sefydliad gwirfoddol neu gymunedol sydd yn elusen gofrestredig. 
                            Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`,
                    }),
                },
                {
                    value: 'charitable-incorporated-organisation',
                    label: localise({
                        en: `Charitable Incorporated Organisation (CIO or SCIO)`,
                        cy: `Sefydliad corfforedig elusennol (CIO / SCIO)`,
                    }),
                    explanation: localise({
                        en: oneLine`A registered charity with limited liability. 
                            But isn't a company registered with Companies House.`,
                        cy: oneLine`Elusen gofrestredig gydag atebolrwydd cyfyngedig. 
                            Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`,
                    }),
                },
                {
                    value: 'community-interest-company',
                    label: localise({
                        en: 'Community Interest Company (CIC)',
                        cy: 'Cwmni Budd Cymunedol',
                    }),
                    explanation: localise({
                        en: oneLine`A company registered with Companies House. 
                    And the Community Interest Company (CIC) Regulator.`,
                        cy: oneLine`Cwmni cofrestredig â Thŷ’r Cwmnïau. A’r Rheolydd Cwmni Budd Cymunedol.`,
                    }),
                },
                {
                    value: 'school',
                    label: localise({
                        en: 'School',
                        cy: 'Ysgol',
                    }),
                },
                {
                    value: 'college-or-university',
                    label: localise({
                        en: 'College or University',
                        cy: 'Coleg neu brifysgol',
                    }),
                },
                {
                    value: 'statutory-body',
                    label: localise({
                        en: 'Statutory body',
                        cy: 'Corff statudol',
                    }),
                    explanation: localise({
                        en: oneLine`A public body - like a local authority or parish council. 
                            Or a police or health authority.`,
                        cy: oneLine`Corff cyhoeddus – fel awdurdod lleol neu gyngor plwyf. 
                            Neu awdurdod heddlu neu iechyd.`,
                    }),
                },
                {
                    value: 'faith-group',
                    label: localise({
                        en: 'Faith-based group',
                        cy: 'Grŵp yn seiliedig ar ffydd',
                    }),
                    explanation: localise({
                        en: `Like a church, mosque, temple or synagogue.`,
                        cy: `Fel eglwys, mosg, teml neu synagog.`,
                    }),
                },
            ],
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a type of organisation',
                        cy: 'Dewiswch fath o sefydliad',
                    }),
                },
            ],
        });
    }

    function fieldOrganisationSubType() {
        const options = [
            {
                value: 'parish-council',
                label: localise({
                    en: 'Parish Council',
                    cy: 'Cyngor plwyf',
                }),
            },
            {
                value: 'town-council',
                label: localise({
                    en: 'Town Council',
                    cy: 'Cyngor tref',
                }),
            },
            {
                value: 'local-authority',
                label: localise({
                    en: 'Local Authority',
                    cy: 'Awdurdod lleol',
                }),
            },
            {
                value: 'nhs-trust-health-authority',
                label: localise({
                    en: 'NHS Trust/Health Authority',
                    cy: 'Ymddiriedaeth GIG/Awdurdod Iechyd',
                }),
            },
            {
                value: 'prison-service',
                label: localise({
                    en: 'Prison Service',
                    cy: 'Gwasanaeth carchar',
                }),
            },
            {
                value: 'fire-service',
                label: localise({
                    en: 'Fire Service',
                    cy: 'Gwasanaeth tân',
                }),
            },
            {
                value: 'police-authority',
                label: localise({
                    en: 'Police Authority',
                    cy: 'Awdurdod heddlu',
                }),
            },
        ];

        return new RadioField({
            locale: locale,
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: 'Dywedwch wrthym pa fath o gorff statudol ydych',
            }),
            type: 'radio',
            options: options,
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: 'statutory-body',
                then: Joi.string()
                    .valid(...options.map((option) => option.value))
                    .required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us what type of statutory body you are',
                        cy: 'Dywedwch wrthym pa fath o gorff statudol ydych',
                    }),
                },
            ],
        });
    }

    function fieldContactName() {
        return new NameField({
            locale: locale,
            name: 'contactName',
            label: localise({
                en: 'Your name',
                cy: '',
            }),
        });
    }

    function fieldContactEmail() {
        return new EmailField({
            locale: locale,
            name: 'contactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`,
            }),
        });
    }

    function fieldContactPhone() {
        return new PhoneField({
            locale: locale,
            name: 'contactPhone',
            isRequired: false,
        });
    }

    function fieldContactLanguagePreference() {
        const options = [
            {
                label: localise({ en: `English`, cy: `Saesneg` }),
                value: 'english',
            },
            {
                label: localise({ en: `Welsh`, cy: `Cymraeg` }),
                value: 'welsh',
            },
        ];

        return new RadioField({
            locale: locale,
            name: 'contactLanguagePreference',
            label: localise({
                en: `What language should we use to contact you?`,
                cy: ``,
            }),
            options: options,
            schema: Joi.when('projectCountries', {
                is: Joi.array()
                    .items(Joi.string().valid('wales').required(), Joi.any())
                    .required(),
                then: Joi.string()
                    .valid(...options.map((option) => option.value))
                    .required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a language',
                        cy: 'Dewiswch iaith',
                    }),
                },
            ],
        });
    }

    function fieldContactCommunicationNeeds() {
        const maxLength = 255;
        return new Field({
            locale: locale,
            name: 'contactCommunicationNeeds',
            label: localise({
                en: `Communication needs`,
                cy: ``,
            }),
            explanation: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu penodol sydd gan y cyswllt hwn.`,
            }),
            isRequired: false,
            maxLength: maxLength,
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Particular communication needs must be ${maxLength} characters or less`,
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${maxLength} nod`,
                    }),
                },
            ],
        });
    }

    function dateOfBirthField(name, minAge) {
        const minDate = moment().subtract(120, 'years').format('YYYY-MM-DD');

        const maxDate = moment().subtract(minAge, 'years').format('YYYY-MM-DD');

        return new DateField({
            locale: locale,
            name: name,
            label: localise({ en: 'Date of birth', cy: 'Dyddad geni' }),
            explanation: localise({
                en: `<p>
                    We need their date of birth to help confirm who they are.
                    And we do check their date of birth.
                    So make sure you've entered it right.
                    If you don't, it could delay your application.
                </p>
                <p><strong>For example: 30 03 1980</strong></p>`,
                cy: `<p>
                    Rydym angen eu dyddiad geni i helpu cadarnhau pwy ydynt.
                    Rydym yn gwirio eu dyddiad geni.
                    Felly sicrhewch eich bod wedi ei roi yn gywir.
                    Os nad ydych, gall oedi eich cais.
                </p>
                <p><strong>Er enghraifft: 30 03 1980</strong></p>`,
            }),
            attributes: { max: maxDate },
            schema: stripIfExcludedOrgType(
                CONTACT_EXCLUDED_TYPES,
                Joi.dateParts().minDate(minDate).maxDate(maxDate).required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a date of birth',
                        cy: 'Rhowch ddyddiad geni',
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: `Rhaid bod yn o leiaf ${minAge} oed`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: oneLine`Birth year must be four digits, for example 1986`,
                        cy: oneLine`Nid yw’r dyddiad geni yn ddilys—defnyddiwch
                            bedwar digid, e.e. 1986`,
                    }),
                },
            ],
        });
    }

    function fieldMainContactPhone() {
        if (mainContactPhone) {
            if (
                mainContactPhone.toString().replace(/[^\d]/g, '') ===
                seniorContactPhone
            ) {
                return new Field({
                    locale: locale,
                    name: 'mainContactPhone',
                    label: 'Telephone number',
                    schema: Joi.number().max(0).precision(2),
                    messages: [
                        {
                            type: 'base',
                            message: localise({
                                en: `Main contact phone number must be different from the senior contact's phone number`,
                                cy: `Rhaid i'r prif rif ffôn cyswllt fod yn wahanol i rif ffôn yr uwch gyswllt`,
                            }),
                        },
                    ],
                });
            } else {
                return new PhoneField({
                    locale: locale,
                    name: 'mainContactPhone',
                    schema: Joi.string()
                        .required()
                        .phoneNumber()
                        .invalid(Joi.ref('seniorContactPhone')),
                });
            }
        } else {
            return new PhoneField({
                locale: locale,
                name: 'mainContactPhone',
                schema: Joi.string()
                    .required()
                    .phoneNumber()
                    .invalid(Joi.ref('seniorContactPhone')),
            });
        }
    }

    function allFields() {
        let fields = {};
        fields = {
            projectName: fieldProjectName(),
            projectCountries: fieldProjectCountries(),
            projectRegions: fieldProjectRegions(),
            projectLocation: fieldProjectLocation(),
            projectLocationDescription: fieldProjectLocationDescription(),
            projectLocationPostcode: fieldProjectLocationPostcode(
                locale
            ),
        };
        if (projectCountries.includes('england')) {
            Object.assign(fields, {
                projectTotalCost: fieldProjectTotalCost(),
                projectCosts: fieldProjectCosts(),
                projectSpend: fieldProjectSpend(),
                projectStartDate: fieldProjectStartDate(),
                projectDurationYears: fieldProjectDurationYears(),
                projectWebsite: fieldProjectWebsite(),
                projectOrganisation: fieldProjectOrganisation(),
            });
        } else {
            Object.assign(fields, {
                projectCosts: fieldProjectCosts(),
                projectDurationYears: fieldProjectDurationYears(),
                projectWebsite: fieldProjectWebsite(),
            });
        }
        Object.assign(fields, {
            yourIdeaProject: fieldYourIdeaProject(),
            yourIdeaCommunity: fieldYourIdeaCommunity(),
            yourIdeaActivities: fieldYourIdeaActivities(),
        });
        if (projectCountries.includes('england')) {
            Object.assign(fields, {
                beneficiariesPreflightCheck: fieldBeneficiariesPreflightCheck(
                    locale
                ),
                beneficiariesGroupsCheck: fieldBeneficiariesGroupsCheck(
                    locale
                ),
                beneficiariesGroups: fieldBeneficiariesGroups(locale),
                beneficiariesEthnicBackground: fieldBeneficiariesEthnicBackground(
                    locale
                ),
                beneficiariesGroupsLGBT: fieldBeneficiariesGroupsLGBT(
                    locale
                ),
                beneficiariesGroupsAge: fieldBeneficiariesGroupsAge(locale),
                beneficiariesGroupsDisabledPeople: fieldBeneficiariesGroupsDisabledPeople(
                    locale
                ),
                beneficiariesGroupsReligion: fieldBeneficiariesGroupsReligion(
                    locale
                ),
                beneficiariesWelshLanguage: fieldBeneficiariesWelshLanguage(
                    locale
                ),
                beneficiariesNorthernIrelandCommunity: fieldBeneficiariesNorthernIrelandCommunity(
                    locale
                ),
                beneficiariesGroupsMigrant: fieldBeneficiariesGroupsMigrant(
                    locale
                ),
            });
            if (beneficiariesGroupCheck === 'yes') {
                Object.assign(fields, {
                    beneficiariesGroupsOther: fieldBeneficiariesGroupsOther(
                        locale
                    ),
                });
            }
            Object.assign(fields, {
                beneficiariesAnyGroupsOther: fieldBeneficiariesAnyGroupsOther(
                    locale,
                    data
                ),
                beneficiariesLeadershipGroups: fieldBeneficiariesLeadershipGroups(
                    locale
                ),
                beneficiariesLeadershipGroupsEthnicBackground: fieldBeneficiariesLeadershipGroupsEthnicBackground(
                    locale
                ),
                beneficiariesLeadershipGroupsReligion: fieldBeneficiariesLeadershipGroupsReligion(
                    locale
                ),
                beneficiariesLeadershipGroupsMigrants: fieldBeneficiariesLeadershipGroupsMigrant(
                    locale
                ),
                beneficiariesLeadershipGroupsAge: fieldBeneficiariesLeadershipGroupsAge(
                    locale
                ),
                beneficiariesLeadershipGroupsDisabledPeople: fieldBeneficiariesLeadershipGroupsDisabledPeople(
                    locale
                ),
                beneficiariesLeadershipGroupsLGBT: fieldBeneficiariesLeadershipGroupsLGBT(
                    locale
                ),
            });
            if (beneficiariesGroupCheck === 'yes') {
                Object.assign(fields, {
                    beneficiariesLeadershipGroupsOther: fieldBeneficiariesLeadershipGroupsOther(
                        locale
                    ),
                });
            }
            Object.assign(fields, {
                beneficiariesLeadershipAnyGroupsOther: fieldBeneficiariesLeadershipAnyGroupsOther(
                    locale,
                    data
                ),
            });
        }
        Object.assign(fields, {
            organisationLegalName: fieldOrganisationLegalName(),
            organisationDifferentName: fieldOrganisationDifferentName(),
            organisationTradingName: fieldOrganisationTradingName(),
            organisationAddress: fieldOrganisationAddress(),
        });
        if (projectCountries.includes('england')) {
            Object.assign(fields, {
                organisationStartDate: fieldOrganisationStartDate(),
                organisationSupport: fieldOrganisationSupport(),
                organisationVolunteers: fieldOrganisationVolunteers(),
                organisationFullTimeStaff: fieldOrganisationFullTimeStaff(),
                organisationLeadership: fieldOrganisationLeadership(),
                organisationType: fieldOrganisationType(),
                organisationSubType: fieldOrganisationSubType(),
                accountingYearDate: fieldAccountingYearDate(locale, data),
                totalIncomeYear: fieldTotalIncomeYear(locale),
                mainContactName: new NameField({
                    locale: locale,
                    name: 'mainContactName',
                    label: localise({
                        en: 'Full name of main contact',
                        cy: 'Enw llawn y prif gyswllt',
                    }),
                    explanation: localise({
                        en: 'This person has to live in the UK.',
                        cy: 'Rhaid i’r person hwn fyw yn y Deyrnas Unedig.',
                    }),
                    get warnings() {
                        let result = [];

                        const seniorSurname = get(
                            'seniorContactName.lastName'
                        )(data);

                        const lastNamesMatch =
                            seniorSurname &&
                            seniorSurname ===
                            get('mainContactName.lastName')(data);

                        if (lastNamesMatch) {
                            result.push(
                                localise({
                                    en: `<span class="js-form-warning-surname">We've noticed that your main and senior contact
                                     have the same surname. Remember we can't fund projects
                                     where the two contacts are married or related by blood.</span>`,
                                    cy: `<span class="js-form-warning-surname">Rydym wedi sylwi bod gan eich uwch gyswllt a’ch
                                     prif gyswllt yr un cyfenw. Cofiwch ni allwn ariannu prosiectau
                                     lle mae’r ddau gyswllt yn briod neu’n perthyn drwy waed.</span>`,
                                })
                            );
                        }

                        return result;
                    },
                    schema(originalSchema) {
                        return originalSchema.compare(
                            Joi.ref('seniorContactName')
                        );
                    },
                    messages: [
                        {
                            type: 'object.isEqual',
                            message: localise({
                                en: `Main contact name must be different from the senior contact's name`,
                                cy: `Rhaid i enw’r prif gyswllt fod yn wahanol i enw’r uwch gyswllt.`,
                            }),
                        },
                    ],
                }),
                mainContactDateOfBirth: dateOfBirthField(
                    'mainContactDateOfBirth',
                    MIN_AGE_MAIN_CONTACT
                ),
                mainContactAddress: new AddressField({
                    locale: locale,
                    name: 'mainContactAddress',
                    label: localise({
                        en: 'Home address',
                        cy: 'Cyfeiriad cartref',
                    }),
                    explanation: localise({
                        en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                        cy: `Rydym angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio’r cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`,
                    }),
                    schema: stripIfExcludedOrgType(
                        CONTACT_EXCLUDED_TYPES,
                        Joi.ukAddress()
                            .required()
                            .compare(Joi.ref('seniorContactAddress'))
                    ),
                    messages: [
                        {
                            type: 'object.isEqual',
                            message: localise({
                                en: `Main contact address must be different from the senior contact's address`,
                                cy: `Rhaid i gyfeiriad y prif gyswllt fod yn wahanol i gyfeiriad yr uwch gyswllt`,
                            }),
                        },
                    ],
                }),
                mainContactAddressHistory: fieldContactAddressHistory(
                    locale,
                    {
                        name: 'mainContactAddressHistory',
                    }
                ),
                mainContactEmail: new EmailField({
                    locale: locale,
                    name: 'mainContactEmail',
                    explanation: localise({
                        en: `We’ll use this whenever we get in touch about the project`,
                        cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`,
                    }),
                    schema: Joi.string()
                        .required()
                        .email()
                        .lowercase()
                        .invalid(Joi.ref('seniorContactEmail')),
                    messages: [
                        {
                            type: 'any.invalid',
                            message: localise({
                                en: `Main contact email address must be different from the senior contact's email address`,
                                cy: `Rhaid i gyfeiriad e-bost y prif gyswllt fod yn wahanol i gyfeiriad e-bost yr uwch gyswllt`,
                            }),
                        },
                    ],
                }),
                mainContactPhone: fieldMainContactPhone(),
                mainContactLanguagePreference: fieldContactLanguagePreference(
                    locale,
                    {
                        name: 'mainContactLanguagePreference',
                    }
                ),
                mainContactCommunicationNeeds: fieldSMContactCommunicationNeeds(
                    locale,
                    {
                        name: 'mainContactCommunicationNeeds',
                    }
                ),
                seniorContactRole: fieldSeniorContactRole(locale, data),
                seniorContactName: new NameField({
                    locale: locale,
                    name: 'seniorContactName',
                    label: localise({
                        en: 'Full name of senior contact',
                        cy: 'Enw llawn yr uwch gyswllt',
                    }),
                    explanation: localise({
                        en: 'This person has to live in the UK.',
                        cy: 'Rhaid i’r person hwn fyw ym Mhrydain',
                    }),
                }),
                seniorContactDateOfBirth: dateOfBirthField(
                    'seniorContactDateOfBirth',
                    MIN_AGE_SENIOR_CONTACT
                ),
                seniorContactAddress: new AddressField({
                    locale: locale,
                    name: 'seniorContactAddress',
                    label: localise({
                        en: 'Home address',
                        cy: 'Cyfeiriad cartref',
                    }),
                    explanation: localise({
                        en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                        cy: `Byddwn angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio eu cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`,
                    }),
                    schema: stripIfExcludedOrgType(
                        CONTACT_EXCLUDED_TYPES,
                        Joi.ukAddress().required()
                    ),
                }),
                seniorContactAddressHistory: fieldContactAddressHistory(
                    locale,
                    {
                        name: 'seniorContactAddressHistory',
                    }
                ),
                seniorContactEmail: new EmailField({
                    locale: locale,
                    name: 'seniorContactEmail',
                    explanation: localise({
                        en: `We’ll use this whenever we get in touch about the project`,
                        cy: `Byddwn yn defnyddio hwn pan fyddwn yn cysylltu ynglŷn â’r prosiect`,
                    }),
                    schema: Joi.string().required().email().lowercase(),
                }),
                seniorContactLanguagePreference: fieldContactLanguagePreference(
                    locale,
                    {
                        name: 'seniorContactLanguagePreference',
                    }
                ),
                seniorContactCommunicationNeeds: fieldSMContactCommunicationNeeds(
                    locale,
                    {
                        name: 'seniorContactCommunicationNeeds',
                    }
                ),
                termsAgreement1: fieldTermsAgreement1(locale),
                termsAgreement2: fieldTermsAgreement2(locale),
                termsAgreement3: fieldTermsAgreement3(locale),
                termsAgreement4: fieldTermsAgreement4(locale),
                termsAgreement5: fieldTermsAgreement5(locale),
                termsAgreement6: fieldTermsAgreement6(locale),
                termsPersonName: fieldTermsPersonName(locale),
                termsPersonPosition: fieldTermsPersonPosition(locale),
                seniorContactPhone: new PhoneField({
                    locale: locale,
                    name: 'seniorContactPhone',
                    schema: Joi.string()
                        .required()
                        .phoneNumber()
                        .replace(/[^\d]/g, '')
                        .invalid(
                            Joi.ref('seniorContactLanguagePreference')
                        ),
                }),

            });
        } else {
            Object.assign(fields, {
                organisationType: fieldOrganisationType(),
                organisationSubType: fieldOrganisationSubType(),
                contactName: fieldContactName(),
                contactEmail: fieldContactEmail(),
                contactPhone: fieldContactPhone(),
                contactLanguagePreference: fieldContactLanguagePreference(),
                contactCommunicationNeeds: fieldContactCommunicationNeeds(),
                beneficiariesPreflightCheck: fieldBeneficiariesPreflightCheck(
                    locale
                ),
                beneficiariesGroupsCheck: fieldBeneficiariesGroupsCheck(
                    locale
                ),
                beneficiariesGroups: fieldBeneficiariesGroups(locale),
                beneficiariesEthnicBackground: fieldBeneficiariesEthnicBackground(
                    locale
                ),
                beneficiariesGroupsLGBT: fieldBeneficiariesGroupsLGBT(
                    locale
                ),
                beneficiariesGroupsAge: fieldBeneficiariesGroupsAge(locale),
                beneficiariesGroupsDisabledPeople: fieldBeneficiariesGroupsDisabledPeople(
                    locale
                ),
                beneficiariesGroupsReligion: fieldBeneficiariesGroupsReligion(
                    locale
                ),
                beneficiariesWelshLanguage: fieldBeneficiariesWelshLanguage(
                    locale
                ),
                beneficiariesNorthernIrelandCommunity: fieldBeneficiariesNorthernIrelandCommunity(
                    locale
                ),
                beneficiariesGroupsMigrant: fieldBeneficiariesGroupsMigrant(
                    locale
                ),
            });
            if (beneficiariesGroupCheck === 'yes') {
                Object.assign(fields, {
                    beneficiariesGroupsOther: fieldBeneficiariesGroupsOther(
                        locale
                    ),
                });
            }
            Object.assign(fields, {
                beneficiariesAnyGroupsOther: fieldBeneficiariesAnyGroupsOther(
                    locale,
                    data
                ),
                beneficiariesLeadershipGroups: fieldBeneficiariesLeadershipGroups(
                    locale
                ),
                beneficiariesLeadershipGroupsEthnicBackground: fieldBeneficiariesLeadershipGroupsEthnicBackground(
                    locale
                ),
                beneficiariesLeadershipGroupsReligion: fieldBeneficiariesLeadershipGroupsReligion(
                    locale
                ),
                beneficiariesLeadershipGroupsMigrants: fieldBeneficiariesLeadershipGroupsMigrant(
                    locale
                ),
                beneficiariesLeadershipGroupsAge: fieldBeneficiariesLeadershipGroupsAge(
                    locale
                ),
                beneficiariesLeadershipGroupsDisabledPeople: fieldBeneficiariesLeadershipGroupsDisabledPeople(
                    locale
                ),
                beneficiariesLeadershipGroupsLGBT: fieldBeneficiariesLeadershipGroupsLGBT(
                    locale
                ),
            });
            if (beneficiariesGroupCheck === 'yes') {
                Object.assign(fields, {
                    beneficiariesLeadershipGroupsOther: fieldBeneficiariesLeadershipGroupsOther(
                        locale
                    ),
                });
            }
            Object.assign(fields, {
                beneficiariesLeadershipAnyGroupsOther: fieldBeneficiariesLeadershipAnyGroupsOther(
                    locale,
                    data
                )
            });
        }
        return fields;
    }

    return allFields();
};
