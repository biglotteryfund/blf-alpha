'use strict';
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');
const flatMap = require('lodash/flatMap');

const Joi = require('../../lib/joi-extensions');
const {
    TextareaField,
    RadioField,
    CheckboxField,
} = require('../../lib/field-types');
const {
    BENEFICIARY_GROUPS,
    FREE_TEXT_MAXLENGTH,
    OTHER_GROUPS,
} = require('../constants');

function multiChoice(options) {
    return Joi.array()
        .items(Joi.string().valid(...options.map((option) => option.value)))
        .single();
}

function conditionalBeneficiaryChoice({ match, schema }) {
    return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
        is: 'yes',
        then: Joi.when(Joi.ref('beneficiariesGroups'), {
            is: Joi.array()
                .items(Joi.string().valid(match).required(), Joi.any())
                .required(),
            then: schema,
            otherwise: Joi.any().strip(),
        }),
        otherwise: Joi.any().strip(),
    });
}

function conditionalBeneficiaryLeadershipChoice({ match, schema }) {
    return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
        is: 'yes',
        then: Joi.when(Joi.ref('beneficiariesLeadershipGroups'), {
            is: Joi.array()
                .items(Joi.string().valid(match).required(), Joi.any())
                .required(),
            then: schema,
            otherwise: Joi.any().strip(),
        }),
        otherwise: Joi.any().strip(),
    });
}

function othersIdsToText(id, lang) {
    let list = '';

    if (id.includes(OTHER_GROUPS.OTHER_BLACK)) {
        list +=
            lang === 'en'
                ? '<li>Any other Black / African / Caribbean background</li>'
                : '';
    }
    if (id.includes(OTHER_GROUPS.OTHER_MIXED))
        list +=
            lang === 'en'
                ? '<li>Any other mixed / multiple ethnic background</li>'
                : '';
    if (id.includes(OTHER_GROUPS.OTHER_ASIAN))
        list += lang === 'en' ? '<li>Any other asian background</li>' : '';
    if (id.includes(OTHER_GROUPS.OTHER_ETHNICITY))
        list += lang === 'en' ? '<li>Any other ethnic background</li>' : '';
    if (id.includes(OTHER_GROUPS.OTHER_LGBT))
        list += lang === 'en' ? '<li>In another way</li>' : '';
    if (id.includes(OTHER_GROUPS.OTHER_MIGRANT))
        list += lang === 'en' ? '<li>Other migrants</li>' : '';
    if (id.includes(OTHER_GROUPS.OTHER_FAITH))
        list += lang === 'en' ? '<li>Other faiths and beliefs</li>' : '';
    if (id.includes(OTHER_GROUPS.OTHER_DISABILITY))
        list +=
            lang === 'en'
                ? '<li>Other type of disability or impairment</li>'
                : '';

    return list;
}

module.exports = {
    fieldBeneficiariesPreflightCheck: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesPreflightCheck',
            label: localise({
                en: `We will not use your answers in this section to assess your application. Check this box to show you understand.`,
                cy: ``,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({
                        en: `I understand`,
                        cy: ``,
                    }),
                },
            ],
            isRequired: true,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Check this box to show you understand',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsCheck: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project aimed at a specific group of people or open to everyone?`,
                cy: `A yw eich prosiect yn agored i bawb neu a yw’n targedu grŵp penodol o bobl?`,
            }),
            explanation: localise({
                en: `<p>What do we mean by projects for specific groups? We'd like to know if your project will mostly 
                      benefit people who might have a common characteristic.</p>
                    <p>
                      A wheelchair sports club is a place for disabled people to play wheelchair sport. 
                      So, this is a project that’s specifically for disabled people. 
                      Or a group that aims to empower African women in the community - 
                      this group is specifically for people from a particular ethnic background.
                    </p>
                    <p>
                        Even if a wider community participates in the project in some way, 
                        this project might still be for a specific group. For example, 
                        anyone can participate in International Women's Day, but the specific group it's for is women.
                    </p>
                    <p>If <strong>75% or more of the people supported or benefiting</strong> from your project come from 
                    <strong>one</strong> specific group of people, that means it's for that group. 
                    For example, if you're supporting 100 people, and around 75 or more are Deaf, 
                    this would qualify as benefiting a specific group - the Deaf community.</p>

                    <p>This figure of 75% was decided on after working with a wide range of groups.</p>`,
                cy: ``,
            }),
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
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroups: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroups',
            label: localise({
                en: `Does the project intend to benefit specific groups?`,
                cy: `Pa grwpiau penodol mae eich prosiect wedi’i anelu ar ei gyfer?`,
            }),
            explanation: localise({
                en: `<p>We'd like to find out if your project will help groups which can sometimes be under-represented 
                    in society.</p>
                    <p>Asking you these questions will help us: <br />
                    - better understand who's applying for funding <br />
                    - try to reach certain groups more.</p>
                    
                    <p>This information will not be used to assess your application for funding.</p>
                    <p>If <strong>75% or more of the people supported or benefiting</strong> from your project come 
                    from a specific group, we think of the project as being for that specific group. 
                    For example, if you're supporting 100 people, and around 75 or more are Deaf, 
                    this would qualify as benefiting a specific group - the Deaf community.</p>
                    
                    <p>Tell us which groups they are - you can choose more than one category. For example, you 
                    might want to choose: black + mental health, or young people + faith communities.</p>
                    
                    <p>If you select any categories, we may ask you next if your project will benefit any sub-groups 
                    within the categories.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en:
                            'Communities experiencing ethnic or racial inequity, discrimation or inequality',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Black, Mixed, Asian and Roma`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'Faith communities',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Catholic, Protestant, Muslim, Hindu, Jewish`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.MIGRANT,
                    label: localise({
                        en: 'Migrants',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: migrants, asylum seekers, refugees, 
                                    undocumented people, other migrants`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: having physical difficulties, 
                                    mental health conditions, cognitive difficulties, 
                                    neurodiversity, sensory impairments, chronic health conditions`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en:
                            'Older (65 and over) and younger (25 and under) people',
                        cy: '',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'Women and girls',
                        cy: '',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'LGBT+ people',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: bisexual men, lesbian/gay women, trans women`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.SOCIOECONOMIC,
                    label: localise({
                        en:
                            'People who are educationally or economically disadvantaged',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Example are people from a low-income and/or educationally disadvantaged background 
                        which might have a long-term impact on their life, and/or people experiencing 
                        financial difficulties just now`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.OTHER,
                    label: localise({
                        en: `Specific groups that are not included already`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: care experienced young people, 
                        people recovering from alcohol addiction, sex workers`,
                        cy: oneLine``,
                    }),
                },
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options).required(),
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
        });
    },
    fieldBeneficiariesEthnicBackground: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({
                en: `Communities experiencing ethnic or racial inequity`,
                cy: '',
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from communities who are experiencing 
                        ethnic or racial inequity.</p>
                        
                        <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            optgroups: [
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: 'Du / Affricanaidd / Caribiaidd / Du Brydeinig',
                    }),
                    options: [
                        {
                            value: 'mixed-black',
                            label: localise({
                                en: 'Mixed Black',
                                cy: '',
                            }),
                        },
                        {
                            value: 'black-british',
                            label: localise({
                                en: 'Black British',
                                cy: '',
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
                            value: 'caribbean',
                            label: localise({
                                en: 'Caribbean',
                                cy: 'Caribiaidd',
                            }),
                        },
                        {
                            value: 'other-black',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: `Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Mixed',
                        cy: '',
                    }),
                    options: [
                        {
                            value: 'mixed-groups',
                            label: localise({
                                en: 'Mixed Groups',
                                cy: '',
                            }),
                        },
                        {
                            value: 'white-black',
                            label: localise({
                                en: 'White and Black',
                                cy: '',
                            }),
                        },
                        {
                            value: 'white-asian',
                            label: localise({
                                en: 'White and Asian',
                                cy: '',
                            }),
                        },
                        {
                            value: 'other-mixed',
                            label: localise({
                                en:
                                    'Any other mixed / multiple ethnic background',
                                cy: '',
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
                            value: 'mixed-asian',
                            label: localise({
                                en: 'Mixed Asian / Asian British',
                                cy: '',
                            }),
                        },
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
                            value: 'other-asian',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: 'Unrhyw gefndir Asiaidd arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en:
                            'Other group experiencing ethnic or racial inequity',
                        cy: '',
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' }),
                        },

                        {
                            value: 'Jewish',
                            label: localise({ en: 'Jewish', cy: '' }),
                        },
                        {
                            value: 'gypsy-roma-traveller',
                            label: localise({
                                en: 'Gypsy, Roma and Traveller Communities',
                                cy: '',
                            }),
                        },
                        {
                            value: 'other-ethnicity',
                            label: localise({
                                en: 'Any other ethnic group',
                                cy: '',
                            }),
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
        });
    },
    fieldBeneficiariesGroupsLGBT: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsLGBT',
            label: localise({
                en: `LGBT+ people`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits LGBT+ people.</p>
                     <p>How would you describe the group or groups? You can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'bisexual-men',
                    label: localise({ en: 'Bisexual men', cy: '' }),
                },
                {
                    value: 'bisexual-women',
                    label: localise({ en: 'Bisexual women', cy: '' }),
                },
                {
                    value: 'gay-men',
                    label: localise({ en: 'Gay men', cy: '' }),
                },
                {
                    value: 'lesbian-women',
                    label: localise({ en: 'Lesbian / gay women', cy: '' }),
                },
                {
                    value: 'trans-men',
                    label: localise({ en: 'Trans men', cy: '' }),
                },
                {
                    value: 'trans-women',
                    label: localise({ en: 'Trans women', cy: '' }),
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary people', cy: '' }),
                },
                {
                    value: 'other-lgbt',
                    label: localise({ en: 'In another way', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.LGBT,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select an option`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsAge: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: `Oedran`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits older and younger people.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: '60+',
                    label: localise({ en: '60 and over', cy: '' }),
                },
                { value: '19-25', label: '19-25' },
                { value: '16-18', label: '16-18' },
                { value: '8-15', label: '8-15' },
                { value: '3-7', label: '3-7' },
                {
                    value: '0-2',
                    label: localise({ en: 'Under 2 years of age', cy: '' }),
                },
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
        });
    },
    fieldBeneficiariesGroupsDisabledPeople: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: 'Pobl anabl' }),
            explanation: localise({
                en: `<p>
                    You told us that your project mostly benefits disabled people.
                </p>
                <p>
                    Tell us who they are - you can choose more than one category.
                </p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'mental-health',
                    label: localise({
                        en: 'Mental health',
                        cy: '',
                    }),
                },
                {
                    value: 'health',
                    label: localise({
                        en: 'Health',
                        cy: '',
                    }),
                },
                {
                    value: 'mobility',
                    label: localise({
                        en: `Mobility impairments`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Like difficulty using your arms, or mobility issues which require you to 
                        use a wheelchair or crutches`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'visual',
                    label: localise({
                        en: 'Visual impairment / partial sight / sight loss',
                        cy: '',
                    }),
                },
                {
                    value: 'deaf',
                    label: localise({
                        en: 'Deaf / hard of hearing / hearing loss',
                        cy: '',
                    }),
                },
                {
                    value: 'speech',
                    label: localise({
                        en: 'Speech impairment',
                        cy: '',
                    }),
                },
                {
                    value: 'multiple-physical',
                    label: localise({
                        en: 'Multiple physical impairment',
                        cy: '',
                    }),
                },
                {
                    value: 'learning-disability',
                    label: localise({
                        en: `Learning disability`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`A reduced intellectual ability and difficulty with everyday activities which 
                        affects someone for their whole life, such as Down’s Syndrome`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'learning-difficulty',
                    label: localise({
                        en: `Learning difficulty`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Learning difficulties such as dyslexia and ADHD`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'neurodiverse',
                    label: localise({
                        en: `Neurodiverse`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Cognitive difference such as autistic spectrum disorder where individuals 
                        are impacted by the social environment`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'other-disability',
                    label: localise({
                        en: 'Other type of disability or impairment',
                        cy: '',
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
                        en: `Select the group(s) of people that will benefit from your project`,
                        cy: `Dewiswch y bobl anabl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsReligion: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Faith communities`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from faith communities.</p>
                    <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'catholic',
                    label: localise({ en: 'Catholic', cy: '' }),
                },
                {
                    value: 'protestant',
                    label: localise({ en: 'Protestant', cy: '' }),
                },
                {
                    value: 'other-christian',
                    label: localise({
                        en: 'Other Christian denominations',
                        cy: '',
                    }),
                },
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' }),
                },
                {
                    value: 'hindu',
                    label: localise({ en: 'Hindu', cy: '' }),
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddew' }),
                },
                {
                    value: 'muslim',
                    label: localise({ en: 'Muslim', cy: 'Mwslim' }),
                },
                {
                    value: 'sikh',
                    label: localise({ en: 'Sikh', cy: 'Sikh' }),
                },
                {
                    value: 'atheist',
                    label: localise({ en: 'Athiest', cy: '' }),
                },
                {
                    value: 'agnostic',
                    label: localise({ en: 'Agnostic', cy: '' }),
                },
                {
                    value: 'other-faith',
                    label: localise({ en: 'Other faiths and beliefs', cy: '' }),
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
        });
    },
    fieldBeneficiariesWelshLanguage: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: `Faint o’r bobl a fydd yn elwa o’ch prosiect sy’n siarad Cymraeg?`,
            }),
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
                        .valid(...this.options.map((option) => option.value))
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
        });
    },
    fieldBeneficiariesNorthernIrelandCommunity: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: `Pa gymuned mae’r bobl a fydd yn elwa o’ch prosiect yn perthyn iddi?`,
            }),
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
                        .valid(...this.options.map((option) => option.value))
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
        });
    },
    fieldBeneficiariesGroupsMigrant: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsMigrant',
            label: localise({
                en: `Migrants`,
                cy: `Rhyw`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits migrants.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'asylum-seeker',
                    label: localise({ en: 'Asylum Seekers', cy: '' }),
                },
                {
                    value: 'refugee',
                    label: localise({ en: 'Refugees', cy: '' }),
                },
                {
                    value: 'undocumented-people',
                    label: localise({ en: 'Undocumented people', cy: '' }),
                },
                {
                    value: 'other-migrant',
                    label: localise({ en: 'Other migrants', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.MIGRANT,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the group(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsOther: function (locale) {
        const localise = get(locale);
        return new TextareaField({
            locale: locale,
            name: 'beneficiariesGroupsOther',
            label: localise({
                en: `Specific groups that are not included already`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from specific 
                      groups that we had not listed.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>
                     <p>Examples include: men and boys, care-experienced young people, people recovering from alcohol 
                     addiction, people with experience of the criminal justice system, and sex workers.</p>`,
                cy: ``,
            }),
            minWords: 0,
            maxWords: 100,
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.OTHER,
                    schema: Joi.required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please tell us the people that will benefit from your project`,
                        cy: ``,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroups: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroups',
            label: localise({
                en: `Does the leadership of your organisation self-identify in any of these groups?`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>We'd like to know if most of the people who lead or make the key decisions in your 
                    organisation belong to <strong>one</strong> specific group. 
                    For example, <strong>75% or more</strong> of your board of trustees or management committee might 
                    be from a specific group. <strong>Or 50%</strong> or more of senior staff self-identify 
                    as from a specific community or having a characteristic.</p>
                    
                    <p>If they do, tell us who they are - you can choose more than one category. <br />
                    If they do not, you can choose 'No or prefer not to say'.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en:
                            'Communities experiencing ethnic or racial inequity, discrimation or inequality',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Black, Mixed, Asian and Roma`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'Faith communities',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Catholic, Protestant, Muslim, Hindu, Jewish`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.MIGRANT,
                    label: localise({
                        en: 'Migrants',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: migrants, asylum seekers, refugees, 
                                    undocumented people, other migrants`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: having physical difficulties, 
                                    mental health conditions, cognitive difficulties, 
                                    neurodiversity, sensory impairments, chronic health conditions`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en:
                            'Older (65 and over) and younger (25 and under) people',
                        cy: '',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'Women and girls',
                        cy: '',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'LGBT+ people',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: bisexual men, lesbian/gay women, trans women`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.SOCIOECONOMIC,
                    label: localise({
                        en:
                            'People who are educationally or economically disadvantaged',
                        cy: '',
                    }),
                    explanation: localise({
                        en: oneLine`Example are people from a low-income and/or educationally disadvantaged background 
                        which might have a long-term impact on their life, and/or people experiencing 
                        financial difficulties just now`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.OTHER,
                    label: localise({
                        en: `Specific groups that are not included already`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: care experienced young people, 
                        people recovering from alcohol addiction, sex workers`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'no-prefer-not-to-say',
                    label: localise({
                        en: 'No or prefer not to say',
                        cy: '',
                    }),
                    explanation: localise({
                        en:
                            'We understand that this could be an awkward question to answer, so you can choose not to say.',
                        cy: '',
                    }),
                },
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options).required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the specific group(s) of people your leadership identifies in`,
                        cy: ``,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroupsEthnicBackground: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsEthnicBackground',
            label: localise({
                en: `Communities experiencing ethnic or racial inequity`,
                cy: '',
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify coming from communities 
                    experiencing racial inequity.</p>
                    <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            optgroups: [
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: 'Du / Affricanaidd / Caribiaidd / Du Brydeinig',
                    }),
                    options: [
                        {
                            value: 'mixed-black',
                            label: localise({
                                en: 'Mixed Black',
                                cy: '',
                            }),
                        },
                        {
                            value: 'black-british',
                            label: localise({
                                en: 'Black British',
                                cy: '',
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
                            value: 'caribbean',
                            label: localise({
                                en: 'Caribbean',
                                cy: 'Caribiaidd',
                            }),
                        },
                        {
                            value: 'other-black',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: `Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Mixed',
                        cy: '',
                    }),
                    options: [
                        {
                            value: 'mixed-groups',
                            label: localise({
                                en: 'Mixed Groups',
                                cy: '',
                            }),
                        },
                        {
                            value: 'white-black',
                            label: localise({
                                en: 'White and Black',
                                cy: '',
                            }),
                        },
                        {
                            value: 'white-asian',
                            label: localise({
                                en: 'White and Asian',
                                cy: '',
                            }),
                        },
                        {
                            value: 'other-mixed',
                            label: localise({
                                en:
                                    'Any other mixed / multiple ethnic background',
                                cy: '',
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
                            value: 'mixed-asian',
                            label: localise({
                                en: 'Mixed Asian / Asian British',
                                cy: '',
                            }),
                        },
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
                            value: 'other-asian',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: 'Unrhyw gefndir Asiaidd arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en:
                            'Other group experiencing ethnic or racial inequity',
                        cy: '',
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' }),
                        },

                        {
                            value: 'Jewish',
                            label: localise({ en: 'Jewish', cy: '' }),
                        },
                        {
                            value: 'gypsy-roma-traveller',
                            label: localise({
                                en: 'Gypsy, Roma and Traveller Communities',
                                cy: '',
                            }),
                        },
                        {
                            value: 'other-ethnicity',
                            label: localise({
                                en: 'Any other ethnic group',
                                cy: '',
                            }),
                        },
                    ],
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
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
        });
    },
    fieldBeneficiariesLeadershipGroupsReligion: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsReligion',
            label: localise({
                en: `Faith communities`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify coming from
                      faith communities.</p>
                    <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'catholic',
                    label: localise({ en: 'Catholic', cy: '' }),
                },
                {
                    value: 'protestant',
                    label: localise({ en: 'Protestant', cy: '' }),
                },
                {
                    value: 'other-christian',
                    label: localise({
                        en: 'Other Christian denominations',
                        cy: '',
                    }),
                },
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' }),
                },
                {
                    value: 'hindu',
                    label: localise({ en: 'Hindu', cy: '' }),
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddew' }),
                },
                {
                    value: 'muslim',
                    label: localise({ en: 'Muslim', cy: 'Mwslim' }),
                },
                {
                    value: 'sikh',
                    label: localise({ en: 'Sikh', cy: 'Sikh' }),
                },
                {
                    value: 'atheist',
                    label: localise({ en: 'Athiest', cy: '' }),
                },
                {
                    value: 'agnostic',
                    label: localise({ en: 'Agnostic', cy: '' }),
                },
                {
                    value: 'other-faith',
                    label: localise({ en: 'Other faiths and beliefs', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
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
        });
    },
    fieldBeneficiariesLeadershipGroupsMigrant: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsMigrant',
            label: localise({
                en: `Migrants`,
                cy: `Rhyw`,
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify as migrants.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'asylum-seeker',
                    label: localise({ en: 'Asylum Seekers', cy: '' }),
                },
                {
                    value: 'refugee',
                    label: localise({ en: 'Refugees', cy: '' }),
                },
                {
                    value: 'undocumented-people',
                    label: localise({ en: 'Undocumented people', cy: '' }),
                },
                {
                    value: 'other-migrant',
                    label: localise({ en: 'Other migrants', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.MIGRANT,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the group(s) of the people that your leadership identify as.`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroupsDisabledPeople: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: 'Pobl anabl' }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify as disabled people.</p>
                <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'mental-health',
                    label: localise({
                        en: 'Mental health',
                        cy: '',
                    }),
                },
                {
                    value: 'health',
                    label: localise({
                        en: 'Health',
                        cy: '',
                    }),
                },
                {
                    value: 'mobility',
                    label: localise({
                        en: `Mobility impairments`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Like difficulty using your arms, or mobility issues which require you to 
                        use a wheelchair or crutches`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'visual',
                    label: localise({
                        en: 'Visual impairment / partial sight / sight loss',
                        cy: '',
                    }),
                },
                {
                    value: 'deaf',
                    label: localise({
                        en: 'Deaf / hard of hearing / hearing loss',
                        cy: '',
                    }),
                },
                {
                    value: 'speech',
                    label: localise({
                        en: 'Speech impairment',
                        cy: '',
                    }),
                },
                {
                    value: 'multiple-physical',
                    label: localise({
                        en: 'Multiple physical impairment',
                        cy: '',
                    }),
                },
                {
                    value: 'learning-disability',
                    label: localise({
                        en: `Learning disability`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`A reduced intellectual ability and difficulty with everyday activities which 
                        affects someone for their whole life, such as Down’s Syndrome`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'learning-difficulty',
                    label: localise({
                        en: `Learning difficulty`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Learning difficulties such as dyslexia and ADHD`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'neurodiverse',
                    label: localise({
                        en: `Neurodiverse`,
                        cy: ``,
                    }),
                    explanation: localise({
                        en: oneLine`Cognitive difference such as autistic spectrum disorder where individuals 
                        are impacted by the social environment`,
                        cy: oneLine``,
                    }),
                },
                {
                    value: 'other-disability',
                    label: localise({
                        en: 'Other type of disability or impairment',
                        cy: '',
                    }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the group(s) of people that your leadership identify as`,
                        cy: `Dewiswch y bobl anabl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroupsAge: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsAge',
            label: localise({
                en: `Age`,
                cy: `Oedran`,
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify 
                     as older and younger people.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: '60+',
                    label: localise({ en: '60 and over', cy: '' }),
                },
                { value: '19-25', label: '19-25' },
                { value: '16-18', label: '16-18' },
                { value: '8-15', label: '8-15' },
                { value: '3-7', label: '3-7' },
                {
                    value: '0-2',
                    label: localise({ en: 'Under 2 years of age', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the age group(s) of the people that your leadership identify as`,
                        cy: `Dewiswch y grŵp(iau) oedran o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroupsLGBT: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsLGBT',
            label: localise({
                en: `LGBT+ people`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify as LGBT+ people.</p>
                     <p>How would you describe the group or groups? You can choose more than one category.</p>`,
                cy: ``,
            }),
            options: [
                {
                    value: 'bisexual-men',
                    label: localise({ en: 'Bisexual men', cy: '' }),
                },
                {
                    value: 'bisexual-women',
                    label: localise({ en: 'Bisexual women', cy: '' }),
                },
                {
                    value: 'gay-men',
                    label: localise({ en: 'Gay men', cy: '' }),
                },
                {
                    value: 'lesbian-women',
                    label: localise({ en: 'Lesbian / gay women', cy: '' }),
                },
                {
                    value: 'trans-men',
                    label: localise({ en: 'Trans men', cy: '' }),
                },
                {
                    value: 'trans-women',
                    label: localise({ en: 'Trans women', cy: '' }),
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary people', cy: '' }),
                },
                {
                    value: 'other-lgbt',
                    label: localise({ en: 'In another way', cy: '' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.LGBT,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select an option.`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesLeadershipGroupsOther: function (locale) {
        const localise = get(locale);
        return new TextareaField({
            locale: locale,
            name: 'beneficiariesLeadershipGroupsOther',
            label: localise({
                en: `Specific groups that are not included already`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that the leadership of your organisation self-identify coming from specific groups 
                      that are not included already. Tell us which groups these are.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>
                     <p>Examples include: men and boys, care-experienced young people, people recovering from alcohol 
                     addiction, people with experience of the criminal justice system, and sex workers.</p>`,
                cy: ``,
            }),
            minWords: 0,
            maxWords: 100,
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.OTHER,
                    schema: Joi.required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please tell us the groups`,
                        cy: ``,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesAnyGroupsOther: function (locale, data) {
        const localise = get(locale);
        const beneficiariesGroupsEthnicBackground =
            get('beneficiariesGroupsEthnicBackground')(data) || [];
        const beneficiariesGroupsLGBT =
            get('beneficiariesGroupsLGBT')(data) || [];
        const beneficiariesGroupsDisabledPeople =
            get('beneficiariesGroupsDisabledPeople')(data) || [];
        const beneficiariesGroupsReligion =
            get('beneficiariesGroupsReligion')(data) || [];
        const beneficiariesGroupsMigrant =
            get('beneficiariesGroupsMigrant')(data) || [];

        return new TextareaField({
            locale: locale,
            name: 'beneficiariesAnyGroupsOther',
            label: localise({
                en: `Additional information`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that your project will benefit:</p>
                      <ul>${othersIdsToText(
                          beneficiariesGroupsEthnicBackground,
                          'en'
                      )} ${othersIdsToText(beneficiariesGroupsReligion, 'en')}
                      ${othersIdsToText(beneficiariesGroupsMigrant, 'en')}
                      ${othersIdsToText(
                          beneficiariesGroupsDisabledPeople,
                          'en'
                      )}
                      ${othersIdsToText(beneficiariesGroupsLGBT, 'en')}</ul>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            minWords: 0,
            maxWords: 100,
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.OTHER,
                    schema: Joi.required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please tell us the groups`,
                        cy: ``,
                    }),
                },
            ],
        });
    },

    fieldBeneficiariesLeadershipAnyGroupsOther: function (locale, data) {
        const localise = get(locale);
        const beneficiariesLeadershipGroupsEthnicBackground =
            get('beneficiariesLeadershipGroupsEthnicBackground')(data) || [];
        const beneficiariesLeadershipGroupsLGBT =
            get('beneficiariesLeadershipGroupsLGBT')(data) || [];
        const beneficiariesLeadershipGroupsDisabledPeople =
            get('beneficiariesLeadershipGroupsDisabledPeople')(data) || [];
        const beneficiariesLeadershipGroupsReligion =
            get('beneficiariesLeadershipGroupsReligion')(data) || [];
        const beneficiariesLeadershipGroupsMigrant =
            get('beneficiariesLeadershipGroupsMigrant')(data) || [];

        return new TextareaField({
            locale: locale,
            name: 'beneficiariesLeadershipAnyGroupsOther',
            label: localise({
                en: `Additional information`,
                cy: ``,
            }),
            explanation: localise({
                en: `<p>You told us that your project will benefit:</p>
                      <ul>${othersIdsToText(
                          beneficiariesLeadershipGroupsEthnicBackground,
                          'en'
                      )} ${othersIdsToText(
                    beneficiariesLeadershipGroupsReligion,
                    'en'
                )}
                      ${othersIdsToText(
                          beneficiariesLeadershipGroupsMigrant,
                          'en'
                      )}
                      ${othersIdsToText(
                          beneficiariesLeadershipGroupsDisabledPeople,
                          'en'
                      )}
                      ${othersIdsToText(
                          beneficiariesLeadershipGroupsLGBT,
                          'en'
                      )}</ul>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: ``,
            }),
            minWords: 0,
            maxWords: 100,
            get schema() {
                return conditionalBeneficiaryLeadershipChoice({
                    match: BENEFICIARY_GROUPS.OTHER,
                    schema: Joi.required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please tell us the groups`,
                        cy: ``,
                    }),
                },
            ],
        });
    },
};
