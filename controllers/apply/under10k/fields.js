'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const Field = require('../lib/field-types/field');
const EmailField = require('../lib/field-types/email');
const DateField = require('../lib/field-types/date');
const PhoneField = require('../lib/field-types/phone');
const NameField = require('../lib/field-types/name');
const RadioField = require('../lib/field-types/radio');
const AddressField = require('../lib/field-types/address');

const fieldBankAccountName = require('./fields/bank-account-name');
const fieldBankAccountNumber = require('./fields/bank-account-number');
const fieldBankSortCode = require('./fields/bank-sort-code');
const fieldBankStatement = require('./fields/bank-statement');
const fieldBuildingSocietyNumber = require('./fields/building-society-number');
const fieldCharityNumber = require('./fields/charity-number');
const fieldCompanyNumber = require('./fields/company-number');
const fieldContactLanguagePreference = require('./fields/contact-language-preference');
const fieldEducationNumber = require('./fields/education-number');
const fieldOrganisationStartDate = require('./fields/organisation-start-date');
const fieldOrganisationType = require('./fields/organisation-type');
const fieldProjectCountry = require('./fields/project-country');
const fieldProjectLocation = require('./fields/project-location');
const fieldProjectLocationDescription = require('./fields/project-location-description');
const fieldProjectName = require('./fields/project-name');
const fieldProjectPostcode = require('./fields/project-postcode');
const fieldProjectTotalCosts = require('./fields/project-total-costs');
const fieldSeniorContactRole = require('./fields/senior-contact-role');
const fieldTotalIncomeYear = require('./fields/total-income-year');

const { fieldSupportingCOVID19 } = require('./fields/covid-19');

const {
    fieldProjectStartDate,
    fieldProjectEndDate,
} = require('./fields/project-dates');

const {
    fieldProjectStartDateCheck,
    fieldProjectStartDate: fieldProjectStartDateNext,
    fieldProjectEndDate: fieldProjectEndDateNext,
} = require('./fields/project-dates-next');

const {
    fieldYourIdeaProject,
    fieldYourIdeaPriorities,
    fieldYourIdeaCommunity,
} = require('./fields/your-idea');

const {
    fieldTermsAgreement1,
    fieldTermsAgreement2,
    fieldTermsAgreement3,
    fieldTermsAgreement4,
    fieldTermsPersonName,
    fieldTermsPersonPosition,
} = require('./fields/terms');

const isNewOrganisation = require('./lib/new-organisation');
const {
    BENEFICIARY_GROUPS,
    CONTACT_EXCLUDED_TYPES,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MIN_BUDGET_TOTAL_GBP,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    FREE_TEXT_MAXLENGTH,
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {}, flags = {} }) {
    const localise = get(locale);

    function multiChoice(options) {
        return Joi.array()
            .items(Joi.string().valid(options.map((option) => option.value)))
            .single();
    }

    function conditionalBeneficiaryChoice({ match, schema }) {
        return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
            is: 'yes',
            then: Joi.when(Joi.ref('beneficiariesGroups'), {
                is: Joi.array()
                    .items(Joi.string().only(match).required(), Joi.any())
                    .required(),
                then: schema,
                otherwise: Joi.any().strip(),
            }),
            otherwise: Joi.any().strip(),
        });
    }

    function stripIfExcludedOrgType(schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
            then: Joi.any().strip(),
            otherwise: schema,
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
                            otherwise: Joi.any().strip(),
                        }
                    ),
                }).required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a full UK address',
                        cy: 'Rhowch gyfeiriad Prydeining llawn',
                    }),
                },
                {
                    type: 'any.required',
                    key: 'currentAddressMeetsMinimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: 'Dewiswch o un o’r opsiynau a ddarperir',
                    }),
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: 'Rhowch adeilad a stryd',
                    }),
                },
                {
                    type: 'string.max',
                    key: 'line1',
                    message: localise({
                        en: `Building and street must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r adeilad a’r stryd fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
                {
                    type: 'string.max',
                    key: 'line2',
                    message: localise({
                        en: `Address line must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r llinell cyfeiriad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({
                        en: 'Enter a town or city',
                        cy: 'Rhowch dref neu ddinas',
                    }),
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({
                        en: 'Enter a county',
                        cy: 'Rhowch sir',
                    }),
                },
                {
                    type: 'string.max',
                    key: 'townCity',
                    message: localise({
                        en: `Town or city must be ${FREE_TEXT_MAXLENGTH.small} characters or less`,
                        cy: `Rhaid i’r dref neu ddinas fod yn llai na ${FREE_TEXT_MAXLENGTH.small} nod`,
                    }),
                },
                {
                    type: 'string.max',
                    key: 'county',
                    message: localise({
                        en: `County must be ${FREE_TEXT_MAXLENGTH.medium} characters or less`,
                        cy: `Rhaid i’r sir fod yn llai na ${FREE_TEXT_MAXLENGTH.medium} nod`,
                    }),
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a postcode',
                        cy: 'Rhowch gôd post',
                    }),
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a real postcode',
                        cy: 'Rhowch gôd post go iawn',
                    }),
                },
            ],
        };

        return { ...defaultProps, ...props };
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
                        en: oneLine`Their birth date is not valid—please
                            use four digits, eg. 1986`,
                        cy: oneLine`Nid yw’r dyddiad geni yn ddilys—defnyddiwch
                            bedwar digid, e.e. 1986`,
                    }),
                },
            ],
        });
    }

    const allFields = {
        projectName: fieldProjectName(locale),
        projectCountry: fieldProjectCountry(locale),
        projectLocation: fieldProjectLocation(locale, data),
        projectLocationDescription: fieldProjectLocationDescription(locale),
        projectPostcode: fieldProjectPostcode(locale),
        yourIdeaProject: fieldYourIdeaProject(locale),
        yourIdeaPriorities: fieldYourIdeaPriorities(locale, data, flags),
        yourIdeaCommunity: fieldYourIdeaCommunity(locale),
        projectBudget: {
            name: 'projectBudget',
            label: localise({
                en: 'List the costs you would like us to fund',
                cy: 'Rhestrwch y costau hoffech i ni eu hariannu',
            }),
            explanation: localise({
                en: `<p>
                    You should use budget headings, rather than a detailed list
                    of items. For example, if you're applying for pens, pencils,
                    paper and envelopes, using 'office supplies' is fine.
                    Please enter whole numbers only.
                </p>
                <p>Please note you can only have a maximum of 10 rows.</p>`,
                cy: `<p>
                    Dylech ddefnyddio penawdau llai, yn hytrach na rhestr hir
                    o eitemau. Er enghraifft, os ydych yn ymgeisio am feiros,
                    pensiliau, papur ac amlenni, byddai defnyddio
                    ‘offer swyddfa’ yn iawn. Rhowch y rhifau cyfan yn unig. 
                </p>
                <p>Sylwch mai dim ond uchafswm o 10 rhes gallwch ei gael.</p>`,
            }),
            type: 'budget',
            attributes: {
                min: MIN_BUDGET_TOTAL_GBP,
                max: MAX_BUDGET_TOTAL_GBP,
                rowLimit: 10,
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
                            cy: 'Rhowch gyllideb prosiect',
                        }),
                    },
                    {
                        type: 'any.empty',
                        key: 'item',
                        message: localise({
                            en: 'Enter an item or activity',
                            cy: 'Rhowch eitem neu weithgaredd',
                        }),
                    },
                    {
                        type: 'string.max',
                        key: 'item',
                        message: localise({
                            en: `Item or activity must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                            cy: `Rhaid i’r eitem neu weithgaredd fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                        }),
                    },
                    {
                        type: 'number.base',
                        key: 'cost',
                        message: localise({
                            en: 'Enter an amount',
                            cy: 'Rhowch nifer',
                        }),
                    },
                    {
                        type: 'number.integer',
                        key: 'cost',
                        message: localise({
                            en: 'Use whole numbers only, eg. 360',
                            cy: 'Defnyddiwch rifau cyflawn yn unig, e.e. 360',
                        }),
                    },
                    {
                        type: 'number.min',
                        message: localise({
                            en: 'Amount must be £1 or more',
                            cy: `Rhaid i'r eitemau gostio £1 neu fwy`,
                        }),
                    },
                    {
                        type: 'array.min',
                        message: localise({
                            en: 'Enter at least one item',
                            cy: 'Rhowch o leiaf un eitem',
                        }),
                    },
                    {
                        type: 'array.max',
                        message: localise({
                            en: `Enter no more than ${this.attributes.rowLimit} items`,
                            cy: `Rhowch dim mwy na ${this.attributes.rowLimit} eitem`,
                        }),
                    },
                    {
                        type: 'budgetItems.overBudget',
                        message: localise({
                            en: oneLine`Costs you would like us to fund must be
                                less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                            cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                                fod yn llai na £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        }),
                    },
                    {
                        type: 'budgetItems.underBudget',
                        message: localise({
                            en: oneLine`Costs you would like us to fund must be
                                greater than £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`,
                            cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                                fod yn fwy na £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        }),
                    },
                ];
            },
        },
        projectTotalCosts: fieldProjectTotalCosts(locale, data),
        beneficiariesGroupsCheck: {
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project open to everyone or is it aimed at a specific group of people?`,
                cy: `A yw eich prosiect yn agored i bawb neu a yw’n targedu grŵp penodol o bobl?`,
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
                cy: `<p>Beth ydym yn ei olygu gan brosiectau i grwpiau penodol?</p>
                    <p>
                      Mae clwb chwaraeon cadair olwyn yn le i bobl anabl gymryd
                      rhan mewn chwaraeon cadair olwyn. Felly, mae hwn yn brosiect
                      sydd wedi ei ddylunio’n arbennig i bobl anabl. Neu grŵp
                      sydd wedi’i gynllunio i awdurdodi menywod Affricanaidd
                      yn y gymuned – mae’r grŵp hwn yn benodol i bobl o
                      gefndir ethnig arbennig. 
                    </p>
                    <p>Dewiswch y rhai sy’n berthnasol:</p>`,
            }),
            type: 'radio',
            options: [
                {
                    value: 'no',
                    label: localise({
                        en: `My project is open to everyone and isn’t aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect yn agored i bawb ac nid yw wedi’i anelu at grŵp penodol o bobl`,
                    }),
                },
                {
                    value: 'yes',
                    label: localise({
                        en: `My project is aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect wedi’i anelu at grŵp penodol o bobl`,
                    }),
                },
            ],
            isRequired: true,
            schema: Joi.string().valid(['yes', 'no']).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        },
        beneficiariesGroups: {
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups is your project aimed at?`,
                cy: `Pa grwpiau penodol mae eich prosiect wedi’i anelu ar ei gyfer?`,
            }),
            explanation: localise({
                en: `Check the boxes that apply:`,
                cy: `Ticiwch y bocsys sy’n berthnasol:`,
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: 'Pobl o gefndir ethnig penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: 'Pobl o ryw penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: 'Pobl o oedran penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: 'Pobl â chred grefyddol penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: 'Pobl lesbiaid, hoyw neu ddeurywiol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: `Pobl â chyfrifoldebau gofal`,
                    }),
                },
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options)
                        .required()
                        .when('beneficiariesGroupsOther', {
                            is: Joi.string().required(),
                            then: Joi.optional(),
                        }),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the specific group(s) of people your project is aimed at`,
                        cy: `Dewiswch y grŵp(iau) o bobl mae eich prosiect wedi'i anelu ar eu cyfer`,
                    }),
                },
            ],
        },
        beneficiariesGroupsOther: {
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
            explanation: localise({
                en: `If your project's for a specific group that's not mentioned above, tell us about it here:`,
                cy: `Os yw eich prosiect ar gyfer grŵp penodol sydd heb ei grybwyll uchod, dywedwch wrthym yma:`,
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.when('beneficiariesGroupsCheck', {
                is: 'yes',
                then: Joi.string()
                    .allow('')
                    .max(FREE_TEXT_MAXLENGTH.large)
                    .optional(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Other specific groups must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i grwpiau penodol eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        },
        beneficiariesEthnicBackground: {
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({
                en: `Ethnic background`,
                cy: 'Cefndir ethnig',
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    from a particular ethnic background. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf o
                    fudd i bobl o gefndir ethnig penodol. Dywedwch wrthym pa un:`,
            }),
            type: 'checkbox',
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: 'Gwyn',
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: `Saesneg / Cymraeg / Albanaidd / Gogledd Iwerddon / Prydeinig`,
                            }),
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: `Gwyddeleg` }),
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: 'Sipsi neu deithiwr Gwyddeleg',
                            }),
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: 'Unrhyw gefndir gwyn arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: 'Grwpiau ethnig cymysg / lluosog',
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: 'Cefndir ethnig cymysg',
                            }),
                            explanation: localise({
                                en: oneLine`this refers to people whose parents
                                    are of a different ethnic background to each other`,
                                cy: oneLine`mae hyn yn cyfeirio at bobl sydd o
                                    gefndir ethnig gwahanol i’w gilydd`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: 'Asiaidd / Asiaidd Brydeinig',
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: 'Indiaidd' }),
                        },
                        {
                            value: 'pakistani',
                            label: localise({
                                en: 'Pakistani',
                                cy: 'Pacistanaidd',
                            }),
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({
                                en: 'Bangladeshi',
                                cy: 'Bangladeshi',
                            }),
                        },
                        {
                            value: 'chinese',
                            label: localise({
                                en: 'Chinese',
                                cy: 'Tsieniaidd',
                            }),
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: 'Unrhyw gefndir Asiaidd arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: 'Du / Affricanaidd / Caribiaidd / Du Brydeinig',
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({
                                en: 'Caribbean',
                                cy: 'Caribiaidd',
                            }),
                        },
                        {
                            value: 'african',
                            label: localise({
                                en: 'African',
                                cy: 'Affricanaidd',
                            }),
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: `Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: 'Grŵp ethnig arall',
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' }),
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: 'Arall' }),
                        },
                    ],
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    schema: multiChoice(
                        flatMap(this.optgroups, (o) => o.options)
                    ).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`Select the ethnic background(s) of the
                            people that will benefit from your project`,
                        cy: oneLine`Dewiswch y cefndir(oedd) ethnig o’r bobl
                            fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesGroupsGender: {
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: `Rhyw`,
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    of a particular gender. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym fod eich prosiect o fudd i bobl 
                    o ryw arbennig. Dywedwch wrthym pa rai. `,
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: 'Gwryw' }) },
                {
                    value: 'female',
                    label: localise({ en: 'Female', cy: 'Benyw' }),
                },
                {
                    value: 'trans',
                    label: localise({ en: 'Trans', cy: 'Traws' }),
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: 'Di-ddeuaidd' }),
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: 'Rhyngrywiol' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.GENDER,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the gender(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesGroupsAge: {
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: `Oedran`,
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    from particular age groups. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf yn
                    elwa pobl o grwpiau oedran penodol. Dywedwch wrthym pa rai.`,
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: '0-12' },
                { value: '13-24', label: '13-24' },
                { value: '25-64', label: '25-64' },
                { value: '65+', label: '65+' },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the age group(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y grŵp(iau) oedran o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesGroupsDisabledPeople: {
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: 'Pobl anabl' }),
            explanation: localise({
                en: `<p>
                    You told us that your project mostly benefits disabled people.
                    Please tell us which one(s).
                </p>
                <p>
                    We use the definition from the Equality Act 2010,
                    which defines a disabled person as someone who has a
                    mental or physical impairment that has a substantial
                    and long-term adverse effect on their ability to carry
                    out normal day to day activity.
                </p>`,
                cy: `<p>
                    Fe ddywedoch wrthym bod eich prosiect yn bennaf yn
                    elwa pobl anabl. Dywedwch wrthym pa rai. 
                </p>
                <p>
                    Rydym yn defnyddio’r diffiniad o’r Ddeddf Cydraddoldeb 2010,
                    sy’n diffinio person anabl fel rhywun sydd â nam meddyliol
                    neu gorfforol lle mae hynny’n cael effaith niweidiol
                    sylweddol a hirdymor ar eu gallu i gynnal gweithgaredd
                    arferol o ddydd i ddydd. 
                </p>`,
            }),

            type: 'checkbox',
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: 'Pobl anabl â namau synhwyraidd',
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: 'e.e. namau ar y golwg a’r clyw',
                    }),
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: `Pobl anabl â namau corfforol`,
                    }),
                    explanation: localise({
                        en: oneLine`e.g. neuromotor impairments, such as epilepsy
                            and cerebral palsy, or muscular/skeletal conditions,
                            such as missing limbs and arthritis`,
                        cy: oneLine`e.e. namau niwromotor, fel epilepsi a pharlys
                            yr ymennydd, neu chyflyrau cyhyrog/ysgerbydol,
                            fel aelodau ar goll ac arthritis `,
                    }),
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: `Pobl anabl ag anawsterau dysgu neu feddyliol`,
                    }),
                    explanation: localise({
                        en: oneLine`e.g. reduced intellectual ability and difficulty
                            with everyday activities or conditions such as autism`,
                        cy: oneLine`e.e. llai o allu deallusol ac anhawster gyda
                            gweithgareddau dydd i ddydd neu gyflyrau fel awtistiaeth`,
                    }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the disabled people that will benefit from your project`,
                        cy: `Dewiswch y bobl anabl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesGroupsReligion: {
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: `Crefydd neu gred`,
            }),
            explanation: localise({
                en: oneLine`You have indicated that your project mostly benefits
                    people of a particular religion or belief, please select from the following`,
                cy: oneLine`Rydych wedi datgan bod eich prosiect yn bennaf yn elwa
                    pobl o grefydd neu gred penodol, dewiswch o’r canlynol`,
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' }),
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: 'Cristion' }),
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddew' }),
                },
                {
                    value: 'muslim',
                    label: localise({ en: 'Muslim', cy: 'Mwslim' }),
                },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: 'Sikh' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: 'Dim crefydd' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.RELIGION,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the religion(s) or belief(s) of the people that will benefit from your project`,
                        cy: `Dewiswch grefydd(au) neu gred(oau) y bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesGroupsReligionOther: {
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
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
                        en: `Other religions or beliefs must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i grefyddau neu gredoau eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        },
        beneficiariesWelshLanguage: {
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: `Faint o’r bobl a fydd yn elwa o’ch prosiect sy’n siarad Cymraeg?`,
            }),
            type: 'radio',
            options: [
                {
                    value: 'all',
                    label: localise({ en: 'All', cy: 'Pawb' }),
                },
                {
                    value: 'more-than-half',
                    label: localise({
                        en: 'More than half',
                        cy: 'Dros hanner',
                    }),
                },
                {
                    value: 'less-than-half',
                    label: localise({
                        en: 'Less than half',
                        cy: 'Llai na hanner',
                    }),
                },
                {
                    value: 'none',
                    label: localise({ en: 'None', cy: 'Neb' }),
                },
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'wales',
                    then: Joi.string()
                        .valid(this.options.map((option) => option.value))
                        .max(FREE_TEXT_MAXLENGTH.large)
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the amount of people who speak Welsh that will benefit from your project`,
                        cy: `Dewiswch y nifer o bobl sy’n siarad Cymraeg a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        },
        beneficiariesNorthernIrelandCommunity: {
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: `Pa gymuned mae’r bobl a fydd yn elwa o’ch prosiect yn perthyn iddi?`,
            }),
            type: 'radio',
            options: [
                {
                    value: 'both-catholic-and-protestant',
                    label: localise({
                        en: 'Both Catholic and Protestant',
                        cy: 'Catholig a phrotestanaidd',
                    }),
                },
                {
                    value: 'mainly-protestant',
                    label: localise({
                        en: `Mainly Protestant (more than 60 per cent)`,
                        cy: `Protestanaidd yn bennaf (dros 60 y cant)`,
                    }),
                },
                {
                    value: 'mainly-catholic',
                    label: localise({
                        en: `Mainly Catholic (more than 60 per cent)`,
                        cy: `Catholig yn bennaf (dros 60 y cant)`,
                    }),
                },
                {
                    value: 'neither-catholic-or-protestant',
                    label: localise({
                        en: `Neither Catholic or Protestant`,
                        cy: `Ddim yn Gathloig nac yn Brotestanaidd`,
                    }),
                },
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'northern-ireland',
                    then: Joi.string()
                        .valid(this.options.map((option) => option.value))
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the community that the people who will benefit from your project belong to`,
                        cy: `Dewiswch y gymuned mae’r pobl a fydd yn elwa o’r prosiect yn byw ynddi`,
                    }),
                },
            ],
        },
        organisationHasDifferentTradingName: new RadioField({
            locale: locale,
            name: 'organisationHasDifferentTradingName',
            label: localise({
                en: `Does your organisation use a different name in your day-to-day work?`,
                cy: `A yw eich mudiad yn defnyddio enw gwahanol yn eich gwaith dydd i ddydd?`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: `Yes`, cy: `Ydi` }),
                },
                {
                    value: 'no',
                    label: localise({ en: `No`, cy: `Nac ydi` }),
                },
            ],
            isRequired: true,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        }),
        organisationLegalName: {
            name: 'organisationLegalName',
            label: localise({
                en: `What is the full legal name of your organisation?`,
                cy: `Beth yw enw cyfreithiol llawn eich sefydliad?`,
            }),
            explanation: localise({
                en: `<p>
                    This must be as shown on your <strong>governing document</strong>.
                    Your governing document could be called one of several things,
                    depending on the type of organisation you're applying on behalf of.
                    It may be called a constitution, trust deed, memorandum and
                    articles of association, or something else entirely.
                </p>`,

                cy: `<p>
                    Rhaid i hwn fod fel y dangosir ar eich <strong>dogfen lywodraethol</strong>.
                    Gall eich dogfen lywodraethol gael ei alw yn un o amryw o bethau,
                    gan ddibynnu ar y math o sefydliad rydych yn ymgeisio ar ei rhan.
                    Gall gael ei alw’n gyfansoddiad, gweithred ymddiriedaeth,
                    memorandwm ac erthyglau cymdeithas, neu rywbeth gwbl wahanol. 
                </p>`,
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().max(FREE_TEXT_MAXLENGTH.large).required(),
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
                        en: `Full legal name of organisation must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r enw cyfreithiol llawn fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        },
        organisationTradingName: new Field({
            locale: locale,
            name: 'organisationTradingName',
            label: localise({
                en: `Tell us the name your organisation uses in your day-to-day work`,
                cy: `Dywedwch wrthym yr enw mae eich mudiad yn ei ddefnyddio yn eich gwaith dydd i ddydd`,
            }),
            get explanation() {
                const organisationLegalName = get('organisationLegalName')(
                    data
                );
                const nameMessage = organisationLegalName
                    ? `, <strong>${organisationLegalName}</strong>`
                    : '';
                return localise({
                    en: `<p>This must be different from your organisation's legal name${nameMessage}.</p>`,
                    cy: `<p>Rhaid i hwn fod yn wahanol i enw cyfreithiol eich mudiad${nameMessage}.</p>`,
                });
            },
            get schema() {
                return Joi.when('organisationHasDifferentTradingName', {
                    is: 'yes',
                    then: Joi.string()
                        .max(FREE_TEXT_MAXLENGTH.large)
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please provide your organisation's trading name`,
                        cy: `Darparwch enw masnachu eich mudiad`,
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Organisation's day-to-day name must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i enw dydd i ddydd y sefydliad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        }),
        organisationStartDate: fieldOrganisationStartDate(locale),
        organisationAddress: new AddressField({
            locale: locale,
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`,
            }),
            explanation: localise({
                en: `<p>Enter the postcode and search for the address, or enter it manually below.`,
                cy: `Rhowch y cod post a chwiliwch am y cyfeiriad, neu ei deipio isod.`,
            }),
        }),
        organisationType: fieldOrganisationType(locale),
        organisationSubTypeStatutoryBody: {
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: 'Dywedwch wrthym pa fath o gorff statudol ydych',
            }),
            type: 'radio',
            options: [
                {
                    value: STATUTORY_BODY_TYPES.PARISH_COUNCIL,
                    label: localise({
                        en: 'Parish Council',
                        cy: 'Cyngor plwyf',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.TOWN_COUNCIL,
                    label: localise({
                        en: 'Town Council',
                        cy: 'Cyngor tref',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.LOCAL_AUTHORITY,
                    label: localise({
                        en: 'Local Authority',
                        cy: 'Awdurdod lleol',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.NHS_TRUST,
                    label: localise({
                        en: 'NHS Trust/Health Authority',
                        cy: 'Ymddiriedaeth GIG/Awdurdod Iechyd',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    label: localise({
                        en: 'Prison Service',
                        cy: 'Gwasanaeth carchar',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    label: localise({
                        en: 'Fire Service',
                        cy: 'Gwasanaeth tân',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.POLICE_AUTHORITY,
                    label: localise({
                        en: 'Police Authority',
                        cy: 'Awdurdod heddlu',
                    }),
                },
            ],
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.STATUTORY_BODY,
                then: Joi.string().required(),
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
        },
        companyNumber: fieldCompanyNumber(locale),
        charityNumber: fieldCharityNumber(locale, data),
        educationNumber: fieldEducationNumber(locale),
        accountingYearDate: {
            name: 'accountingYearDate',
            label: localise({
                en: 'What is your accounting year end date?',
                cy: 'Beth yw eich dyddiad gorffen blwyddyn ariannol?',
            }),
            explanation: localise({
                en: `<p><strong>For example: 31 03</strong></p>`,
                cy: '<p><strong>Er enghraifft: 31 03</strong></p>',
            }),
            type: 'day-month',
            isRequired: true,
            schema: isNewOrganisation(get('organisationStartDate')(data))
                ? Joi.any().strip()
                : Joi.dayMonth().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a day and month',
                        cy: 'Rhowch ddiwrnod a mis',
                    }),
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: 'Rhowch ddiwrnod a mis go iawn',
                    }),
                },
            ],
        },
        totalIncomeYear: fieldTotalIncomeYear(locale, data),
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
                                     lle mae’r ddau gyswllt yn briod neu’n perthyn drwy waed.</span>`,
                        })
                    );
                }

                return result;
            },
            schema(originalSchema) {
                return originalSchema.compare(Joi.ref('seniorContactName'));
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
        mainContactAddressHistory: addressHistoryField({
            name: 'mainContactAddressHistory',
            label: localise({
                en:
                    'Have they lived at their home address for the last three years?',
                cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`,
            }),
        }),
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
        mainContactPhone: new PhoneField({
            locale: locale,
            name: 'mainContactPhone',
        }),
        mainContactLanguagePreference: fieldContactLanguagePreference(locale, {
            name: 'mainContactLanguagePreference',
        }),
        mainContactCommunicationNeeds: {
            name: 'mainContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu penodol sydd gan y cyswllt hwn.`,
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
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        },
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
            schema(originalSchema) {
                return originalSchema.compare(Joi.ref('mainContactName'));
            },
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Senior contact name must be different from the main contact's name`,
                        cy: `Rhaid i enw’r uwch gyswllt fod yn wahanol i enw’r prif gyswllt`,
                    }),
                },
            ],
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
                Joi.ukAddress()
                    .required()
                    .compare(Joi.ref('mainContactAddress'))
            ),
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Senior contact address must be different from the main contact's address`,
                        cy: `Rhaid i gyfeiriad e-bost yr uwch gyswllt fod yn wahanol i gyfeiriad e-bost y prif gyswllt.`,
                    }),
                },
            ],
        }),
        seniorContactAddressHistory: addressHistoryField({
            name: 'seniorContactAddressHistory',
            label: localise({
                en: `Have they lived at their home address for the last three years?`,
                cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`,
            }),
        }),
        seniorContactEmail: new EmailField({
            locale: locale,
            name: 'seniorContactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Byddwn yn defnyddio hwn pan fyddwn yn cysylltu ynglŷn â’r prosiect`,
            }),
            schema: Joi.string().required().email().lowercase(),
        }),
        seniorContactPhone: new PhoneField({
            locale: locale,
            name: 'seniorContactPhone',
        }),
        seniorContactLanguagePreference: fieldContactLanguagePreference(
            locale,
            {
                name: 'seniorContactLanguagePreference',
            }
        ),
        seniorContactCommunicationNeeds: {
            name: 'seniorContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu sydd gan y cyswllt hwn.`,
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
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        },
        bankAccountName: fieldBankAccountName(locale),
        bankSortCode: fieldBankSortCode(locale),
        bankAccountNumber: fieldBankAccountNumber(locale),
        buildingSocietyNumber: fieldBuildingSocietyNumber(locale),
        bankStatement: fieldBankStatement(locale),
        termsAgreement1: fieldTermsAgreement1(locale),
        termsAgreement2: fieldTermsAgreement2(locale),
        termsAgreement3: fieldTermsAgreement3(locale),
        termsAgreement4: fieldTermsAgreement4(locale),
        termsPersonName: fieldTermsPersonName(locale),
        termsPersonPosition: fieldTermsPersonPosition(locale),
    };

    if (flags.enableNewCOVID19Flow) {
        allFields.supportingCOVID19 = fieldSupportingCOVID19(locale);
        allFields.projectStartDateCheck = fieldProjectStartDateCheck(
            locale,
            data
        );
        allFields.projectStartDate = fieldProjectStartDateNext(locale, data);
        allFields.projectEndDate = fieldProjectEndDateNext(locale, data);
    } else {
        allFields.projectStartDate = fieldProjectStartDate(locale, data);
        allFields.projectEndDate = fieldProjectEndDate(locale);
    }

    return allFields;
};
