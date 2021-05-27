'use strict';
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');
const flatMap = require('lodash/flatMap');

const Joi = require('../../lib/joi-extensions');
const { TextareaField, RadioField, CheckboxField } = require('../../lib/field-types');
const { BENEFICIARY_GROUPS, FREE_TEXT_MAXLENGTH, OTHER_GROUPS } = require('../constants');

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

function othersIdsToText(id, lang) {
    let list = '';

    if (id.includes(OTHER_GROUPS.OTHER_BLACK)) {
        list +=
            lang === 'en'
                ? '<li>Any other Black / African / Caribbean background</li>'
                : '<li>Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall</li>';
    }
    if (id.includes(OTHER_GROUPS.OTHER_MIXED))
        list +=
            lang === 'en'
                ? '<li>Any other mixed / multiple ethnic background</li>'
                : '<li>Unrhyw gefndir ethnig cymysg / lluosog arall</li>';
    if (id.includes(OTHER_GROUPS.OTHER_ASIAN))
        list += lang === 'en' ? '<li>Any other Asian background</li>' : '<li>Unrhyw gefndir Asiaidd arall</li>';
    if (id.includes(OTHER_GROUPS.OTHER_ETHNICITY))
        list += lang === 'en' ? '<li>Any other ethnic background</li>' : '<li>Unrhyw grŵp ethnig arall</li>';
    if (id.includes(OTHER_GROUPS.OTHER_LGBT))
        list += lang === 'en' ? '<li>LGBTQ+ people I\'d describe in another way</li>' : '<li>POBL LHDTQ+ y byddwn i\'n eu disgrifio mewn ffordd arall</li>';
    if (id.includes(OTHER_GROUPS.OTHER_MIGRANT))
        list += lang === 'en' ? '<li>Other migrants</li>' : '<li>Mudwyr eraill</li>';
    if (id.includes(OTHER_GROUPS.OTHER_FAITH))
        list += lang === 'en' ? '<li>Other faiths and beliefs</li>' : '<li>Crefyddau a chredoau eraill</li>';
    if (id.includes(OTHER_GROUPS.OTHER_DISABILITY))
        list +=
            lang === 'en'
                ? '<li>Other type of disability or impairment</li>'
                : '<li>Math arall o anabledd neu nam</li>';

    return list;
}

module.exports = {
    fieldBeneficiariesPreflightCheck: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesPreflightCheck',
            label: localise({
                en: `<strong>Check this box to show you understand.</strong>`,
                cy: `Gwiriwch y blwch hwn i ddangos eich bod yn deall.`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({
                        en: `Yes, I understand you will not use my answers in this section to assess my application`,
                        cy: `Ydw, rwy'n deall na fyddwch yn defnyddio fy atebion yn yr adran hon i asesu fy nghais`,
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
                en: `Is your project open to everyone or is it aimed at a specific group of people?`,
                cy: `A yw eich prosiect yn agored i bawb neu a yw wedi'i anelu at grŵp penodol o bobl?`,
            }),
            explanation: localise({
                en: `
                    <p>If <strong>75% or more of the people supported or benefitting</strong> from your project come from 
                    <strong>one</strong> specific group of people, that means it's for that group.</p>
                    
                    <p>Your specific group may share more than one characteristic. When you go through this form,
                    you can pick more than one. But 75% or more of the group should share these characteristics. </p>
                    
                    <p>For example, if the group you’re supporting is made up of at least 75% female refugees,
                    this would qualify as supporting a specific group - that specific group would be women who are refugees.
                    And they'd share two characteristics - women + refugees.</p>

                    <p>This figure of 75% - or 3 in 4 people - was decided on after working with a wide range of groups.</p>
                    
                    <p>We know this can only be an <strong>estimate</strong>. It’d be too difficult to work out exactly,
                    especially when you will not yet know exactly who’ll benefit.
                    </p>
                `,
                cy: `<p>Os daw <strong>75% neu fwy o'r bobl sy'n cefnogi neu'n elwa</strong> o'ch prosiect gan
                    <strong>un</strong> grŵp penodol o bobl, mae hynny'n golygu ei fod ar gyfer y grŵp hwnnw.</p>
                    
                    <p>Efallai y bydd eich grŵp penodol yn rhannu mwy nag un nodwedd. Pan fyddwch yn mynd drwy'r ffurflen hon,
                    gallwch ddewis mwy nag un. Ond dylai 75% neu fwy o'r grŵp rannu'r nodweddion hyn.</p>
                    
                    <p>Er enghraifft, os yw'r grŵp rydych chi'n ei gefnogi yn cynnwys o leiaf 75% o ffoaduriaid benywaidd,
                    byddai hyn yn gymwys i gefnogi grŵp penodol - y grŵp penodol hwnnw fyddai menywod sy'n ffoaduriaid.
                    A byddent yn rhannu dwy nodwedd - menywod + ffoaduriaid.</p>

                    <p>Penderfynwyd ar y ffigur hwn o 75% - neu 3 o bob 4 o bobl - ar ôl gweithio gydag ystod eang o grwpiau.</p>
                    
                    <p>Gwyddom mai <strong>amcangyfrif</strong> yn unig y gall hyn fod. Byddai'n rhy anodd gweithio allan yn union,
                    yn enwedig pan na fyddwch yn gwybod yn union pwy fydd yn elwa eto.
                    </p>`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({
                        en: `My project is aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect wedi’i anelu at grŵp penodol o bobl`,
                    }),
                },
                {
                    value: 'no',
                    label: localise({
                        en: `My project is open to everyone and is not aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect yn agored i bawb ac nid yw wedi’i anelu at grŵp penodol o bobl`,
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
                cy: `A yw'r prosiect yn bwriadu bod o fudd i grwpiau penodol?`,
            }),
            explanation: localise({
                en: `<p>We'd like to find out if your project will help groups which can sometimes be under-represented 
                    in society.</p>
                    <p>Asking you these questions will help us: <br />
                    - better understand who's applying for funding <br />
                    - try to reach certain groups more.</p>
                    
                    <p>This information will <strong>not</strong> be used to assess your application for funding.</p>
                    
                    <p>If <strong>75% or more of the people supported or benefitting</strong>
                    from your project come from <strong>one</strong> specific group of people, that means it's for that group.</p>
                    
                    <p>Your specific group may share more than one characteristic. When you go through this form, you can pick more than one.
                    But 75% or more of the group should share these characteristics.</p>
                    
                    <p>For example, if the group you’re supporting is made up of at least 75% female refugees,
                    this would qualify as supporting a specific group - that specific group would be women who are refugees.
                    And they would share two characteristics - women + refugees.</p>
         
                    <p>If you select any categories, we may ask you next if your project will benefit any sub-groups 
                    within the categories.</p>`,
                cy: `<p>Hoffem ddarganfod a fydd eich prosiect yn helpu grwpiau y gellir weithiau eu tangynrychioli mewn cymdeithas.</p>
                     <p>Bydd gofyn y cwestiynau hyn i chi yn ein helpu: <br />
                      - deall yn well pwy sy'n gwneud cais am grant <br />
                      - ceisio cyrraedd rhai grwpiau yn fwy.</p>
                    
                    <p><strong>Ni fydd</strong> y wybodaeth hon yn cael ei defnyddio i asesu eich cais am grant.</p>
                    
                    <p>Os daw <strong>75% neu fwy o'r bobl sy'n cefnogi neu'n elwa</strong> o'ch prosiect gan <strong>un</strong> grŵp penodol o bobl,
                    mae hynny'n golygu ei fod ar gyfer y grŵp hwnnw.</p>
                    
                    <p>Efallai y bydd eich grŵp penodol yn rhannu mwy nag un nodwedd.
                    Pan fyddwch yn mynd drwy'r ffurflen hon, gallwch ddewis mwy nag un.
                    Ond dylai 75% neu fwy o'r grŵp rannu'r nodweddion hyn.</p>
                    
                    <p>Er enghraifft, os yw'r grŵp rydych chi'n ei gefnogi yn cynnwys o leiaf 75% o ffoaduriaid benywaidd,
                    byddai hyn yn gymwys i gefnogi grŵp penodol - y grŵp penodol hwnnw fyddai menywod sy'n ffoaduriaid.
                    A byddent yn rhannu dwy nodwedd - menywod + ffoaduriaid.</p>
         
                    <p>Os byddwch yn dewis unrhyw gategorïau, efallai y byddwn yn gofyn i chi
                    nesaf a fydd eich prosiect o fudd i unrhyw is-grwpiau o fewn y categorïau.</p>`,
            }),
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en:
                            'Communities experiencing ethnic or racial inequity, discrimation or inequality',
                        cy: 'Cymunedau sy\'n profi annhegwch ethnig neu hiliol, ymwadiad neu anghydraddoldeb',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Black, Mixed, Asian and Roma`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: Du, Cymysg, Asiaidd a Roma`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'Faith communities',
                        cy: 'Cymunedau ffydd',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: Catholic, Protestant, Muslim, Hindu, Jewish`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: Catholig, Protestannaidd, Mwslimaidd, Hindŵaidd, Iddewon`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.MIGRANT,
                    label: localise({
                        en: 'Migrants',
                        cy: 'Mudwyr',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: migrants, asylum seekers, refugees, 
                                    undocumented people, other migrants`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: mudwyr, ceiswyr lloches, ffoaduriaid, pobl ddiamheuol, mudwyr eraill`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: having physical difficulties, 
                                    mental health conditions, cognitive difficulties, 
                                    neurodiversity, sensory impairments, chronic health conditions`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: cael anawsterau corfforol, cyflyrau iechyd meddwl,
                                    anawsterau gwybyddol, niwroamrywiaeth, namau synhwyraidd, cyflyrau iechyd cronig`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.OLDER_PEOPLE,
                    label: localise({
                        en:
                            'Older people (65 and over)',
                        cy: 'Pobl hŷn (65 oed a throsodd)',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en:
                            'Younger people (under 25)',
                        cy: 'Pobl iau (dan 25 oed)',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'Women and girls',
                        cy: 'Menywod a merched',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'LGBTQ+ people',
                        cy: 'Pobl LHDTQ+',
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: bisexual men, lesbian/gay women, trans women`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: dynion deurywiol, menywod lesbiaidd/hoyw, menywod traws`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.SOCIOECONOMIC,
                    label: localise({
                        en:
                            'People who are educationally or economically disadvantaged',
                        cy: 'Pobl sydd o dan anfantais addysgol neu economaidd',
                    }),
                    explanation: localise({
                        en: oneLine`Examples are people from a low-income and/or educationally disadvantaged background 
                        which might have a long-term impact on their life, and/or people experiencing 
                        financial difficulties just now`,
                        cy: oneLine`Enghreifftiau yw pobl o gefndir incwm isel a/neu dan anfantais addysgol a allai gael effaith hirdymor
                        ar eu bywyd, a/neu bobl sy'n cael anawsterau ariannol yn awr`,
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.OTHER,
                    label: localise({
                        en: `Specific groups that are not included already`,
                        cy: `Grwpiau penodol nad ydynt wedi'u cynnwys eisoes`,
                    }),
                    explanation: localise({
                        en: oneLine`Examples include: care experienced young people, carers,
                        people recovering from alcohol addiction, sex workers,
                        people whose first language is not English or who have problems reading`,
                        cy: oneLine`Mae enghreifftiau'n cynnwys: pobl ifanc profiadol o ofal,
                        gofalwyr, pobl sy'n gwella o gaethiwed alcohol, gweithwyr rhyw,
                        pobl nad Saesneg yw eu hiaith gyntaf neu sy'n cael problemau darllen`,
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
                cy: 'Cymunedau sy\'n profi annhegwch ethnig neu hiliol',
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from communities who are experiencing 
                        ethnic or racial inequity.</p>
                        
                        <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect yn bennaf o fudd i bobl o gymunedau sy'n profi annhegwch ethnig neu hiliol.</p>
                     <p>Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.</p>`,
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
                                cy: 'Du Cymysg',
                            }),
                        },
                        {
                            value: 'black-british',
                            label: localise({
                                en: 'Black British',
                                cy: 'Du Prydeinig',
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
                        cy: 'cymysg',
                    }),
                    options: [
                        {
                            value: 'mixed-groups',
                            label: localise({
                                en: 'Mixed groups',
                                cy: 'Grwpiau cymysg',
                            }),
                        },
                        {
                            value: 'white-black',
                            label: localise({
                                en: 'White and Black',
                                cy: 'Gwyn a Du',
                            }),
                        },
                        {
                            value: 'white-asian',
                            label: localise({
                                en: 'White and Asian',
                                cy: 'Gwyn ac Asiaidd',
                            }),
                        },
                        {
                            value: 'other-mixed',
                            label: localise({
                                en:
                                    'Any other mixed / multiple ethnic background',
                                cy: 'Unrhyw gefndir ethnig cymysg / lluosog arall',
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
                                en: 'Mixed Asian',
                                cy: 'Asiaidd Cymysg',
                            }),
                        },
                        {
                            value: 'asian-british',
                            label: localise({
                                en: 'Asian British',
                                cy: 'Asiaidd Prydeinig',
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
                        cy: 'Grŵp arall sy\'n profi annhegwch ethnig neu hiliol',
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' }),
                        },

                        {
                            value: 'jewish',
                            label: localise({ en: 'Jewish', cy: 'Iddewig' }),
                        },
                        {
                            value: 'gypsy-roma-traveller',
                            label: localise({
                                en: 'Gypsy, Roma and Traveller communities',
                                cy: 'Cymunedau Sipsiwn, Roma a Theithwyr',
                            }),
                        },
                        {
                            value: 'other-ethnicity',
                            label: localise({
                                en: 'Any other ethnic group',
                                cy: 'Unrhyw grŵp ethnig arall',
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
                en: `LGBTQ+ people`,
                cy: `Pobl LHDTQ+`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits LGBTQ+ people.</p>
                     <p>How would you describe the group or groups? You can choose more than one category.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect o fudd i bobl LHDTQ+ yn bennaf.</p>
                     <p>Sut fyddech chi'n disgrifio'r grŵp neu'r grwpiau? Gallwch ddewis mwy nag un categori.</p>`,
            }),
            options: [
                {
                    value: 'bisexual-men',
                    label: localise({ en: 'Bisexual men', cy: 'Dynion deurywiol' }),
                },
                {
                    value: 'bisexual-women',
                    label: localise({ en: 'Bisexual women', cy: 'Menywod deurywiol' }),
                },
                {
                    value: 'gay-men',
                    label: localise({ en: 'Gay men', cy: 'Dynion hoyw' }),
                },
                {
                    value: 'lesbian-women',
                    label: localise({ en: 'Lesbian / gay women', cy: 'Menywod lesbiaidd / hoyw' }),
                },
                {
                    value: 'trans-men',
                    label: localise({ en: 'Trans men', cy: 'Dynion traws' }),
                },
                {
                    value: 'trans-women',
                    label: localise({ en: 'Trans women', cy: 'Menywod traws' }),
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary people', cy: 'Pobl anneuaidd' }),
                },
                {
                    value: 'other-lgbt',
                    label: localise({ en: 'LGBTQ+ people I\'d describe in another way ', cy: 'POBL LHDTQ+ y byddwn i\'n eu disgrifio mewn ffordd arall' }),
                    explanation: localise({
                        en: oneLine`Examples: other LGBTQ+ people, including queer and intersex people`,
                        cy: oneLine`Enghreifftiau: Pobl LHDTQ+ eraill, gan gynnwys pobl queer a rhyngrywiol`,
                    }),
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
                en: `Younger people`,
                cy: `Pobl ifanc `,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits younger people.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect o fudd i bobl iau ar y cyfan.</p>
                     <p>Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.</p>`,
            }),
            options: [
                { value: '19-25', label: '19-25' },
                { value: '16-18', label: '16-18' },
                { value: '8-15', label: '8-15' },
                { value: '3-7', label: '3-7' },
                {
                    value: '0-2',
                    label: localise({ en: 'Under 2 years of age', cy: 'Dan 2 oed' }),
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
                cy: `<p>
                    Fe ddywedoch wrthym fod eich prosiect o fudd i bobl anabl yn bennaf.
                </p>
                <p>
                    Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.
                </p>`,
            }),
            options: [
                {
                    value: 'mental-health',
                    label: localise({
                        en: 'Mental health',
                        cy: 'Iechyd meddwl',
                    }),
                },
                {
                    value: 'health',
                    label: localise({
                        en: 'Long-standing illness or health condition',
                        cy: 'Salwch neu gyflwr iechyd hirsefydlog',
                    }),
                    explanation: localise({
                        en: oneLine`Examples are cancer, HIV, diabetes, chronic heart disease or epilepsy, or other rare conditions`,
                        cy: oneLine`Enghreifftiau yw canser, HIV, diabetes, clefyd cronig y galon neu epilepsi, neu gyflyrau prin eraill`,
                    }),
                },
                {
                    value: 'mobility',
                    label: localise({
                        en: `Mobility impairments`,
                        cy: `Namau symudedd`,
                    }),
                    explanation: localise({
                        en: oneLine`Like difficulty using your arms, or mobility issues which require you to 
                        use a wheelchair or crutches`,
                        cy: oneLine`Fel anhawster defnyddio eich breichiau, neu faterion symudedd sy'n gofyn i chi ddefnyddio cadair olwyn neu greulon`,
                    }),
                },
                {
                    value: 'visual',
                    label: localise({
                        en: 'Visual impairment / partial sight / sight loss',
                        cy: 'Nam ar y golwg / golwg rhannol / colli golwg',
                    }),
                },
                {
                    value: 'deaf',
                    label: localise({
                        en: 'Deaf / hard of hearing / hearing loss',
                        cy: 'Pobl fyddar / caled eu clyw / colli clyw',
                    }),
                },
                {
                    value: 'speech',
                    label: localise({
                        en: 'Speech impairment',
                        cy: 'Nam ar y lleferydd',
                    }),
                },
                {
                    value: 'multiple-physical',
                    label: localise({
                        en: 'Multiple physical impairment',
                        cy: 'Nam corfforol lluosog',
                    }),
                },
                {
                    value: 'learning-disability',
                    label: localise({
                        en: `Learning disability`,
                        cy: `Anabledd dysgu`,
                    }),
                    explanation: localise({
                        en: oneLine`A reduced intellectual ability and difficulty with everyday activities which affects someone for their whole life, such as Down’s Syndrome`,
                        cy: oneLine`Llai o allu deallusol ac anhawster gyda gweithgareddau bob dydd sy'n effeithio ar rywun am eu bywyd cyfan, fel Down’s Syndrome`,
                    }),
                },
                {
                    value: 'learning-difficulty',
                    label: localise({
                        en: `Learning difficulty`,
                        cy: `Anhawster dysgu`,
                    }),
                    explanation: localise({
                        en: oneLine`Learning difficulties such as dyslexia and ADHD`,
                        cy: oneLine`Anawsterau dysgu fel dyslecsia ac ADHD`,
                    }),
                },
                {
                    value: 'neurodiverse',
                    label: localise({
                        en: `Neurodiverse`,
                        cy: `Niwroamrywiaeth`,
                    }),
                    explanation: localise({
                        en: oneLine`Cognitive difference such as autistic spectrum disorder where individuals 
                        are impacted by the social environment`,
                        cy: oneLine`Gwahaniaeth gwybyddol fel anhwylder sbectrwm awtistig lle mae'r amgylchedd cymdeithasol yn effeithio ar unigolion`,
                    }),
                },
                {
                    value: 'other-disability',
                    label: localise({
                        en: 'Other type of disability or impairment',
                        cy: 'Math arall o anabledd neu nam',
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
                cy: `Cymunedau ffydd`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from faith communities.</p>
                    <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect o fudd i bobl o gymunedau ffydd yn bennaf.</p>
                     <p>Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.</p>`,
            }),
            options: [
                {
                    value: 'catholic',
                    label: localise({ en: 'Catholic', cy: 'Catholig' }),
                },
                {
                    value: 'protestant',
                    label: localise({ en: 'Protestant', cy: 'Protestannaidd' }),
                },
                {
                    value: 'other-christian',
                    label: localise({
                        en: 'Other Christian denominations',
                        cy: 'Enwadau Cristnogol eraill',
                    }),
                },
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' }),
                },
                {
                    value: 'hindu',
                    label: localise({ en: 'Hindu', cy: 'Hindŵaidd' }),
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddewig' }),
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
                    label: localise({ en: 'Atheist', cy: 'Anffyddiwr' }),
                },
                {
                    value: 'agnostic',
                    label: localise({ en: 'Agnostic', cy: 'Agnostig' }),
                },
                {
                    value: 'other-faith',
                    label: localise({ en: 'Other faiths and beliefs', cy: 'Crefyddau a chredoau eraill' }),
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
                cy: `Mudwyr`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits migrants.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect o fudd i fudwyr yn bennaf.</p>
                     <p>Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.</p>`,
            }),
            options: [
                {
                    value: 'asylum-seeker',
                    label: localise({ en: 'Asylum seekers', cy: 'Ceiswyr Lloches' }),
                },
                {
                    value: 'refugee',
                    label: localise({ en: 'Refugees', cy: 'Ffoaduriaid' }),
                },
                {
                    value: 'undocumented-people',
                    label: localise({ en: 'Undocumented people', cy: 'Pobl nad ydynt wedi’u cofnodi' }),
                },
                {
                    value: 'other-migrant',
                    label: localise({ en: 'Other migrants', cy: 'Mudwyr eraill' }),
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
                cy: `Grwpiau penodol nad ydynt wedi'u cynnwys eisoes`,
            }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits people from specific 
                      groups that we had not listed.</p>
                     <p>Tell us who they are - you can choose more than one category.</p>
                     <p>Examples include: men and boys, care-experienced young people, people recovering from alcohol 
                     addiction, people with experience of the criminal justice system, and sex workers.</p>`,
                cy: `<p>Fe ddywedoch wrthym fod eich prosiect yn bennaf o fudd i bobl o grwpiau penodol nad oeddem wedi'u rhestru.</p>
                     <p>Dywedwch wrthym pwy ydynt - gallwch ddewis mwy nag un categori.</p>
                     <p>Mae enghreifftiau'n cynnwys: dynion a bechgyn, pobl ifanc sydd â phrofiad o ofal,
                     pobl sy'n gwella o gaethiwed alcohol, pobl sydd â phrofiad o'r system cyfiawnder troseddol,
                     a gweithwyr rhyw.</p>`,
            }),
            minWords: 0,
            maxWords: 100,
            isRequired: false,
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
                cy: `Gwybodaeth ychwanegol`,
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
                     <p>Tell us more about who they are.</p>`,
                cy: `<p>Fe ddywedoch wrthym y bydd eich prosiect yn elwa:</p>
                      <ul>${othersIdsToText(
                    beneficiariesGroupsEthnicBackground,
                    'cy'
                )} ${othersIdsToText(beneficiariesGroupsReligion, 'cy')}
                      ${othersIdsToText(beneficiariesGroupsMigrant, 'cy')}
                      ${othersIdsToText(
                    beneficiariesGroupsDisabledPeople,
                    'cy'
                )}
                      ${othersIdsToText(beneficiariesGroupsLGBT, 'cy')}</ul>
                     <p>Dywedwch fwy wrthym am bwy ydyn nhw.</p>`,
            }),
            minWords: 0,
            maxWords: 100,
            isRequired: false,
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
