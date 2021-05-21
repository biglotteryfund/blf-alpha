'use strict';
const config = require('config');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');
const { safeHtml, oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const { Step } = require('../lib/step-model');
const { getContactFullName } = require('./lib/contacts');
const { BENEFICIARY_GROUPS, CONTACT_EXCLUDED_TYPES } = require('./constants');

const terms = require('./terms');
const fieldsFor = require('./fields');

module.exports = function ({
    locale = 'en',
    data = {},
    metadata = {},
    showAllFields = false,
    flags = config.get('standardFundingProposal'),
} = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({ locale, data, flags });

    const projectCountries = getOr([], 'projectCountries')(data);

    const currentOrganisationType = get('organisationType')(data);

    const beneficiariesGroupCheck = get('beneficiariesGroupsCheck')(data);

    const beneficiariesGroups = get('beneficiariesGroups')(data);
    const beneficiariesLeadershipGroups = get('beneficiariesLeadershipGroups')(data);

    const conditionalFields = (fields, filteredFields) => {
        const filteredFieldNames = filteredFields.map((_) => _.name);
        const allFields = compact(
            fields.map((f) => {
                if (filteredFieldNames.indexOf(f.name) === -1) {
                    f.isConditional = true;
                }
                return f;
            })
        );

        return showAllFields ? allFields : filteredFields;
    };

    function stepProjectName() {
        return new Step({
            title: localise({
                en: 'Project name',
                cy: 'Enw eich prosiect',
            }),
            fieldsets: [{ fields: [allFields.projectName] }],
        });
    }

    function stepProjectCountries() {
        const footer = localise({
            en: `<p>
                  For projects in Scotland or Wales, or right across the UK, you'll need to <a href="/funding/over10k">read our programme pages for funding over £10,000</a> to find out how to apply.
            </p>`,
            cy: ``,
        });

        return new Step({
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect',
            }),
            fieldsets: [
                { fields: [allFields.projectCountries], footer: footer },
            ],
        });
    }

    function stepProjectRegions() {
        return new Step({
            title: localise({
                en: 'Project area',
                cy: 'ardal y prosiect',
            }),
            fieldsets: [
                {
                    fields: projectCountries.includes('england')
                        ? [allFields.projectRegions]
                        : [],
                },
            ],
        });
    }

    function stepProjectLocation() {
        function fields() {
            if (projectCountries.length > 1) {
                return [allFields.projectLocationDescription];
            } else if (projectCountries.length > 0) {
                return [
                    allFields.projectLocation,
                    allFields.projectLocationDescription,
                    allFields.projectLocationPostcode,
                ];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepProjectCosts() {
        function fields() {
            if (projectCountries.includes('england')) {
                return [
                    allFields.projectTotalCost,
                    allFields.projectCosts,
                    allFields.projectSpend,
                ];
            } else {
                return [allFields.projectCosts];
            }
        }

        return new Step({
            title: localise({
                en: 'Project costs',
                cy: 'Costau’r prosiect',
            }),
            fieldsets: [
                {
                    fields: fields(),
                    introduction: localise({
                        en: `We understand that your costs can change. We just need some estimates at this stage.`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function stepProjectDuration() {
        function fields() {
            if (projectCountries.length < 2) {
                return [allFields.projectDurationYears];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({ en: 'Project duration', cy: '' }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepProjectDates() {
        return new Step({
            title: localise({ en: 'Project start date', cy: '' }),
            fieldsets: [{ fields: [allFields.projectStartDate] }],
        });
    }

    function stepYourIdea() {
        return new Step({
            title: localise({
                en: 'Your idea',
                cy: 'Eich syniad',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.yourIdeaProject,
                        allFields.yourIdeaCommunity,
                        allFields.yourIdeaActivities,
                    ],
                },
            ],
        });
    }

    function stepYourOrganisation() {
        return new Step({
            title: localise({
                en: 'Your organisation',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.projectWebsite,
                        allFields.projectOrganisation,
                    ],
                },
            ],
        });
    }

    function stepBeneficairiesPreflightCheck() {
        return new Step({
            title: localise({
                en: `What is Equity, Diversity and Inclusion (EDI)?`,
                cy: `Beth yw Tegwch, Amrywiaeth a Chynhwysiant?`,
            }),
            fieldsets: [
                {
                    introduction: localise({
                        en: `<p>
                            You may have heard of ‘EDI’ before as meaning ‘<strong>equality</strong>, diversity and inclusion’. We believe ‘equity’ is better. 
                            </p>

                            <p>We know people have different starting points and we want to tailor our funding to avoid
                             any ‘disparity’ - that is, any lack of fairness.</p>

                            <p>‘Equality’ is about treating people in the same way. But ‘<strong>equity</strong>’ is about <strong>fairness</strong>.
                            If we treat everyone in the same way, funding programmes will not reach people in an equal or fair way.</p>
                             
                            <p>‘Diversity’ is about including various aspects of the differences between people. 
                            These differences include: 
                            <ul>
                                <li>race and ethnicity</li>
                                <li>faith</li>
                                <li>sexual orientation</li>
                                <li>disability</li>
                                <li>age</li>
                                <li>gender.</li>
                            </ul>
                            </p>
                             
                            <p>‘Inclusion’ is about helping people feel valued. It’s also about making sure they can take part
                             in decision-making processes.</p>

                            <h3>Why we're asking these questions</h3>
                            
                            <p>We want to get better at equity, diversity and inclusion.</p>
                            
                            <p>Our aim is to help creating an open culture, where all opinions are taken into account.
                            This includes the opinions of the communities we’re trying to reach. This will make our communities
                            and our society stronger.</p>
                            
                            <p>We need to find out who you’re trying to help, and who’s making the decisions,
                            so we can understand who our funding reaches. It’ll help us to shape our funding to be fairer. </p>
                            
                            <h3>How we'll use your information</h3>
                            
                            <p>The information in this section is only to find out if we’re reaching all the people we’re trying to.
                            We will not use your answers to decide if we award you a grant.</p> 

                            <p>We may use these answers in information we publish about grants awarded, including on other websites
                            like <a href='http://grantnav.threesixtygiving.org/'>360 Giving GrantNav</a>.</p>
                            
                            <p>If it’s difficult to answer the questions in the leadership part, we’ll give you the chance
                            to opt out of answering them.</p>
                            
                            <p>You must complete the other parts.</p>

                            <h3>Assessing your application</h3>
                            
                            <p>We will <strong>not</strong> use your answers in this EDI section to assess your 
                            application.</p>`,
                        cy: `<p>
                            Efallai eich bod wedi clywed am 'EDI' o'r blaen yn golygu '<strong>cydraddoldeb</strong>, amrywiaeth a chynhwysiant'. Credwn fod 'tegwch' yn well.
                            </p>

                            <p>Gwyddom fod gan bobl fannau cychwyn gwahanol ac rydym am deilwra ein grantiau i osgoi unrhyw 'wahaniaeth' - hynny yw, unrhyw ddiffyg tegwch.</p>

                            <p>Mae 'cydraddoldeb' yn ymwneud â thrin pobl yn yr un ffordd. Ond mae '<strong>tegwch</strong>' yn ymwneud â bod <strong>yn deg</strong>.
                            Os ydym yn trin pawb yn yr un ffordd, ni fydd rhaglenni ariannu yn cyrraedd pobl mewn ffordd gyfartal neu deg.</p>
                             
                            <p>Mae 'amrywiaeth' yn ymwneud â chynnwys gwahanol agweddau ar y gwahaniaethau rhwng pobl.
                            Mae'r gwahaniaethau hyn yn cynnwys: 
                            <ul>
                                <li>hil ac ethnigrwydd</li>
                                <li>ffydd</li>
                                <li>cyfeiriadedd rhywiol</li>
                                <li>anabledd</li>
                                <li>oedran</li>
                                <li>rhyw.</li>
                            </ul>
                            </p>
                             
                            <p>Mae 'cynhwysiant' yn ymwneud â helpu pobl i deimlo eu bod yn cael eu gwerthfawrogi.
                            Mae hefyd yn ymwneud â sicrhau y gallant gymryd rhan mewn prosesau gwneud penderfyniadau.</p>

                            <h3>Pam ein bod yn gofyn y cwestiynau hyn i chi</h3>
                            
                            <p>Rydym am wella o ran tegwch, amrywiaeth a chynhwysiant.</p>
                            
                            <p>Ein nod yw helpu i greu diwylliant agored, lle mae pob barn yn cael ei hystyried.
                            Mae hyn yn cynnwys barn y cymunedau rydym yn ceisio'u cyrraedd. Bydd hyn yn gwneud ein cymunedau
                            a'n cymdeithas yn gryfach. </p>
                            
                            <p>Mae angen i ni ddarganfod pwy rydych chi'n ceisio'u helpu, a phwy sy'n gwneud y penderfyniadau,
                            fel y gallwn ddeall pwy mae ein grantiau yn ei gyrraedd. Bydd yn ein helpu i lunio ein grantiau i fod yn decach.</p>
                            
                            <h3>Sut y byddwn yn defnyddio eich gwybodaeth</h3>
                            
                            <p>Dim ond os ydym yn cyrraedd yr holl bobl rydym yn ceisio gwneud hynny y dylid darganfod y wybodaeth yn yr adran hon.
                            Ni fyddwn yn defnyddio eich atebion i benderfynu a ydym yn dyfarnu grant i chi.</p>

                            <p>Efallai y byddwn yn defnyddio'r atebion hyn mewn gwybodaeth a gyhoeddir gennym am grantiau a ddyfarnwyd,
                            gan gynnwys ar wefannau eraill fel <a href='http://grantnav.threesixtygiving.org/'>360 Giving GrantNav</a>.</p>
                            
                            <p>Os yw'n anodd ateb y cwestiynau yn y rhan arweinyddiaeth, byddwn yn rhoi cyfle i chi optio allan o'u hateb.</p>
                            
                            <p>Rhaid i chi gwblhau'r rhannau eraill.</p>

                            <h3>Asesu eich cais</h3>
                            
                            <p><strong>Ni fyddwn</strong> yn defnyddio eich atebion yn yr adran hon i asesu eich cais.</p>`,
                    }),
                    fields: [allFields.beneficiariesPreflightCheck],
                },
            ],
        });
    }

    function stepBeneficiariesCheck() {
        return new Step({
            title: localise({
                en: `Specific groups of people`,
                cy: `Grwpiau penodol o bobl`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Specific groups of people`,
                        cy: `Grwpiau penodol o bobl`,
                    }),
                    introduction: localise({
                        en: `<p>
                            We want to hear more about the people who will benefit from your project.
                        </p>
                        <p>
                            It's important to be as accurate as possible in your answers.
                            We'll use this information to make better decisions about how
                            our funding supports people and communities to thrive.
                            We'll also use it to tell people about the impact of
                            our funding and who it is reaching.
                        </p>
                        <p>
                            However, the information you provide here is <strong>not assessed</strong>
                            and <strong>will not</strong> be used to decide whether you will be
                            awarded funding for your project .
                        </p>  `,
                        cy: `<p>
                            Rydym eisiau clywed mwy am y bobl a fydd yn elwa o’ch prosiect.
                        </p>
                        <p>
                            Mae’n bwysig bod mor gywir â phosibl gyda’ch atebion. 
                            Byddwn yn defnyddio’r wybodaeth hyn i wneud gwell benderfyniadau am 
                            sut mae ein hariannu yn cefnogi pobl a chymunedau i ffynnu. 
                            Byddwn hefyd yn ei ddefnyddio i ddweud wrth bobl am effaith 
                            ein hariannu a phwy mae’n ei gyrraedd.
                        </p>
                        <p>
                            Fodd bynnag, <strong>nid yw'r</strong> wybodaeth a roddwch yma yn cael ei hasesu ac <strong>ni chaiff</strong>
                            ei defnyddio i benderfynu a fyddwch yn cael grant ar gyfer eich prosiect.
                        </p>`,
                    }),
                    fields: [allFields.beneficiariesGroupsCheck],
                },
            ],
        });
    }

    function stepBeneficiariesGroups() {
        const groupsCheck = get('beneficiariesGroupsCheck')(data);
        return new Step({
            title: localise({
                en: 'Benefitting specific groups',
                cy: 'Grwpiau penodol o bobl',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Benefitting specific groups',
                        cy: 'Grwpiau penodol o bobl',
                    }),
                    get fields() {
                        const beneficiariesFields = [
                            allFields.beneficiariesGroups,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            compact([
                                groupsCheck === 'yes' &&
                                    allFields.beneficiariesGroups,
                            ])
                        );
                    },
                },
            ],
        });
    }

    /**
     * Include fields based on the beneficiary groups selected.
     * Used to conditionally render fields for age, gender etc.
     */
    function includeIfBeneficiaryType(type, fields) {
        const groupChoices = get('beneficiariesGroups')(data) || [];
        return groupChoices.includes(type) ? fields : [];
    }

    function includeIfAnyBeneficiaryType(fields) {
        const groupsEthnicBackground =
            get('beneficiariesGroupsEthnicBackground')(data) || [];
        const groupsLGBT = get('beneficiariesGroupsLGBT')(data) || [];
        const groupsDisabledPeople =
            get('beneficiariesGroupsDisabledPeople')(data) || [];
        const groupsReligion = get('beneficiariesGroupsReligion')(data) || [];
        const groupsMigrant = get('beneficiariesGroupsMigrant')(data) || [];

        const list = [
            groupsEthnicBackground,
            groupsLGBT,
            groupsDisabledPeople,
            groupsReligion,
            groupsMigrant,
        ];

        return list.toString().includes('other-') ? fields : [];
    }

    function includeIfAnyLeadershipBeneficiaryType(fields) {
        const groupsEthnicBackground =
            get('beneficiariesLeadershipGroupsEthnicBackground')(data) || [];
        const groupsLGBT = get('beneficiariesLeadershipGroupsLGBT')(data) || [];
        const groupsDisabledPeople =
            get('beneficiariesLeadershipGroupsDisabledPeople')(data) || [];
        const groupsReligion =
            get('beneficiariesLeadershipGroupsReligion')(data) || [];
        const groupsMigrant =
            get('beneficiariesLeadershipGroupsMigrant')(data) || [];

        const list = [
            groupsEthnicBackground,
            groupsLGBT,
            groupsDisabledPeople,
            groupsReligion,
            groupsMigrant,
        ];

        return list.toString().includes('other-') ? fields : [];
    }

    function includeIfLeadershipBeneficiaryType(type, fields) {
        const groupChoices = get('beneficiariesLeadershipGroups')(data) || [];
        return groupChoices.includes(type) ? fields : [];
    }

    function includeIfDifferentName(fields) {
        return get('organisationDifferentName')(data) === 'yes' ? fields : [];
    }

    function stepEthnicBackground() {
        return new Step({
            title: localise({
                en: 'Communities experiencing ethnic or racial inequity',
                cy: 'Cymunedau sy\'n profi annhegwch ethnig neu hiliol, ymwadiad neu anghydraddoldeb',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en:
                            'Communities experiencing ethnic or racial inequity',
                        cy: 'Cymunedau sy\'n profi annhegwch ethnig neu hiliol, ymwadiad neu anghydraddoldeb',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesEthnicBackground],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                            [allFields.beneficiariesEthnicBackground]
                        )
                    ),
                },
            ],
        });
    }

    function stepMigrants() {
        return new Step({
            title: localise({ en: 'Migrants', cy: 'Mudwyr' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Migrants',
                        cy: 'Mudwyr',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsMigrant],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.MIGRANT, [
                            allFields.beneficiariesGroupsMigrant,
                        ])
                    ),
                },
            ],
        });
    }

    function stepLGBT() {
        return new Step({
            title: localise({ en: 'LGBTQ+ people', cy: 'Pobl LHDTQ+' }),
            fieldsets: [
                {
                    legend: localise({ en: 'LGBTQ+ people', cy: 'Pobl LHDTQ+' }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsLGBT],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.LGBT, [
                            allFields.beneficiariesGroupsLGBT,
                        ])
                    ),
                },
            ],
        });
    }

    function stepAge() {
        return new Step({
            title: localise({ en: 'Young people', cy: 'Pobl iau' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Age', cy: 'Oedran' }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsAge],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.AGE, [
                            allFields.beneficiariesGroupsAge,
                        ])
                    ),
                },
            ],
        });
    }

    function stepDisabledPeople() {
        return new Step({
            title: localise({ en: 'Disabled people', cy: 'Pobl anabl' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsDisabledPeople],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                            [allFields.beneficiariesGroupsDisabledPeople]
                        )
                    ),
                },
            ],
        });
    }

    function stepOtherBeneficiaryGroups() {
        return new Step({
            title: localise({
                en: 'Specific groups that are not included already',
                cy: 'Grwpiau penodol nad ydynt wedi\'u cynnwys eisoes',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Specific groups that are not included already',
                        cy: 'Grwpiau penodol nad ydynt wedi\'u cynnwys eisoes',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsOther],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.OTHER, [
                            allFields.beneficiariesGroupsOther,
                        ])
                    ),
                },
            ],
        });
    }

    function stepReligionOrFaith() {
        return new Step({
            title: localise({
                en: 'Religion or belief',
                cy: 'Crefydd neu gred',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Religion or belief',
                        cy: 'Crefydd neu gred',
                    }),
                    get fields() {
                        const beneficiariesFields = [
                            allFields.beneficiariesGroupsReligion,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            includeIfBeneficiaryType(
                                BENEFICIARY_GROUPS.RELIGION,
                                beneficiariesFields
                            )
                        );
                    },
                },
            ],
        });
    }

    function isForCountry(country) {
        const currentCountry = get('projectCountry')(data);
        return currentCountry === country;
    }

    /**
     * Include fields based on the current country.
     */
    function includeIfCountry(country, fields) {
        return isForCountry(country) ? fields : [];
    }

    function stepWelshLanguage() {
        return new Step({
            title: localise({
                en: `People who speak Welsh`,
                cy: `Pobl sy’n siarad Cymraeg`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `People who speak Welsh`,
                        cy: `Pobl sy’n siarad Cymraeg`,
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesWelshLanguage],
                        includeIfCountry('wales', [
                            allFields.beneficiariesWelshLanguage,
                        ])
                    ),
                },
            ],
        });
    }

    function stepNorthernIrelandCommunity() {
        return new Step({
            title: localise({
                en: `Northern Ireland community`,
                cy: `Cymuned Gogledd Iwerddon`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Northern Ireland community`,
                        cy: `Cymuned Gogledd Iwerddon`,
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesNorthernIrelandCommunity],
                        includeIfCountry('northern-ireland', [
                            allFields.beneficiariesNorthernIrelandCommunity,
                        ])
                    ),
                },
            ],
        });
    }

    // Leadership EDI
    function stepBeneficiariesLeadershipEdi() {
        const groupsCheck = get('beneficiariesGroupsCheck')(data);
        return new Step({
            title: localise({
                en: 'Leadership of the organisation',
                cy: '',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Leadership of the organisation',
                        cy: '',
                    }),
                    introduction: localise({
                        en: `<p>We’d like to understand more about the leadership of the organisations that we’re supporting. 
                      These questions are optional - they'll just help us to understand our grantees and inform our 
                      process and strategy. But we'll not them use for this individual funding decision.</p>`,
                        cy: ``,
                    }),
                    get fields() {
                        const beneficiariesLeadershipFields = [
                            allFields.beneficiariesLeadershipGroups,
                        ];
                        return conditionalFields(
                            beneficiariesLeadershipFields,
                            compact([
                                groupsCheck === 'yes' &&
                                    allFields.beneficiariesLeadershipGroups,
                            ])
                        );
                    },
                },
            ],
        });
    }

    function stepLeadershipEthnicBackground() {
        return new Step({
            title: localise({
                en: 'Communities experiencing ethnic or racial inequity',
                cy: '',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en:
                            'Communities experiencing ethnic or racial inequity',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [
                            allFields.beneficiariesLeadershipGroupsEthnicBackground,
                        ],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                            [
                                allFields.beneficiariesLeadershipGroupsEthnicBackground,
                            ]
                        )
                    ),
                },
            ],
        });
    }

    function stepBeneficiariesAnyGroupsOther() {
        return new Step({
            title: localise({
                en: 'Any groups other',
                cy: 'Unrhyw grŵp arall',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Communities with any other',
                        cy: 'Cymunedau ag unrhyw un arall',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesAnyGroupsOther],
                        includeIfAnyBeneficiaryType([
                            allFields.beneficiariesAnyGroupsOther,
                        ])
                    ),
                },
            ],
        });
    }

    function stepLeadershipReligion() {
        return new Step({
            title: localise({ en: 'Faith communities', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Faith communities',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsReligion],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.RELIGION,
                            [allFields.beneficiariesLeadershipGroupsReligion]
                        )
                    ),
                },
            ],
        });
    }

    function stepLeadershipMigrants() {
        return new Step({
            title: localise({ en: 'Migrants', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Migrants',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsMigrants],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.MIGRANT,
                            [allFields.beneficiariesLeadershipGroupsMigrants]
                        )
                    ),
                },
            ],
        });
    }

    function stepLeadershipDisabledPeople() {
        return new Step({
            title: localise({ en: 'Disabled people', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Disabled people',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsDisabledPeople],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                            [
                                allFields.beneficiariesLeadershipGroupsDisabledPeople,
                            ]
                        )
                    ),
                },
            ],
        });
    }

    function stepLeadershipAge() {
        return new Step({
            title: localise({ en: 'Young people', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Young people',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsAge],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.AGE,
                            [allFields.beneficiariesLeadershipGroupsAge]
                        )
                    ),
                },
            ],
        });
    }

    function stepLeadershipLGBT() {
        return new Step({
            title: localise({ en: 'LGBTQ+ people', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'LGBTQ+ people',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsLGBT],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.LGBT,
                            [allFields.beneficiariesLeadershipGroupsLGBT]
                        )
                    ),
                },
            ],
        });
    }

    function stepLeadershipOtherBeneficiaryGroups() {
        return new Step({
            title: localise({
                en: 'Specific groups that are not included already',
                cy: '',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Specific groups that are not included already',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipGroupsOther],
                        includeIfLeadershipBeneficiaryType(
                            BENEFICIARY_GROUPS.OTHER,
                            [allFields.beneficiariesLeadershipGroupsOther]
                        )
                    ),
                },
            ],
        });
    }

    function stepBeneficiariesLeadershipAnyGroupsOther() {
        return new Step({
            title: localise({
                en: 'Any leadership groups other',
                cy: '',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'leaderships with any other',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesLeadershipAnyGroupsOther],
                        includeIfAnyLeadershipBeneficiaryType([
                            allFields.beneficiariesLeadershipAnyGroupsOther,
                        ])
                    ),
                },
            ],
        });
    }

    function stepOrganisationLegalName() {
        return new Step({
            title: localise({
                en: 'Organisation legal name',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [
                        allFields.organisationLegalName,
                        allFields.organisationDifferentName,
                    ],
                },
            ],
        });
    }

    function stepOrganisationTradingName() {
        return new Step({
            title: localise({
                en: 'Organisation trading name',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: conditionalFields(
                        [allFields.organisationTradingName],
                        includeIfDifferentName([
                            allFields.organisationTradingName,
                        ])
                    ),
                },
            ],
        });
    }

    function stepOrganisationAddress() {
        return new Step({
            title: localise({
                en: 'Organisation address',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [allFields.organisationAddress],
                },
            ],
        });
    }

    function stepOrganisationStartDate() {
        return new Step({
            title: localise({
                en: 'Organisation start date',
                cy: '',
            }),
            fieldsets: [{ fields: [allFields.organisationStartDate] }],
        });
    }

    function stepOrganisationSupport() {
        return new Step({
            title: localise({
                en: 'People supported by the organisation',
                cy: '',
            }),
            fieldsets: [{ fields: [allFields.organisationSupport] }],
        });
    }

    function stepOrganisationStaff() {
        return new Step({
            title: localise({
                en: 'Organisation volunteers, staff and leadership ',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.organisationVolunteers,
                        allFields.organisationFullTimeStaff,
                        allFields.organisationLeadership,
                    ],
                },
            ],
        });
    }

    function stepOrganisationType() {
        return new Step({
            title: localise({
                en: 'Organisation type',
                cy: 'Math o sefydliad',
            }),
            fieldsets: [{ fields: [allFields.organisationType] }],
        });
    }

    function stepOrganisationSubType() {
        function fields() {
            const currentOrganisationType = get('organisationType')(data);
            if (currentOrganisationType === 'statutory-body') {
                return [allFields.organisationSubType];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({
                en: 'Type of statutory body',
                cy: 'Math o gorff statudol',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepFinancialPosition() {
        return new Step({
            title: localise({
                en: 'Organisation financial position',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.accountingYearDate,
                        allFields.totalIncomeYear,
                    ],
                },
            ],
        });
    }

    /**
     * Determine if we should ask for address and date of birth information.
     * For data protection reasons we should not request address information
     * for the organisation types listed here.
     */
    function includeAddressAndDob() {
        return (
            CONTACT_EXCLUDED_TYPES.includes(currentOrganisationType) === false
        );
    }

    function stepSeniorContact() {
        return new Step({
            title: localise({ en: 'Senior contact', cy: 'Uwch gyswllt' }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your senior contact?',
                        cy: 'Pwy yw eich uwch gyswllt?',
                    }),
                    introduction: localise({
                        en: `
                        <p>
                            Please give us the contact details of a senior member of your organisation.
                        </p>
                        <p>
                            Your senior contact must be at least 18 years old and is legally responsible
                            for ensuring that this application is supported by the organisation applying,
                            any funding is delivered as set out in the application form, and that the
                            funded organisation meets our monitoring requirements. Our identity checks may 
                            appear on a credit report, but it’s not a credit check and can only be seen by 
                            the person we’re checking, so their credit rating won’t be affected. Find out 
                            more about the checks we 
                            <a href="https://www.tnlcommunityfund.org.uk/funding/funding-guidance/information-checks">carry out on your information</a>.                           
                        </p>`,
                        cy: `
                        <p>
                            Rhowch fanylion cyswllt uwch aelod o’ch sefydliad.
                        </p>
                        <p>
                            Rhaid i’ch uwch gyswllt fod dros 18 oed a’n gyfreithiol gyfrifol 
                            am sicrhau fod y cais hwn yn cael ei gefnogi gan y sefydliad sy’n ymgeisio, 
                            bod unrhyw arian yn cael ei ddarparu fel y gosodwyd yn y ffurflen gais, a bod y 
                            sefydliad a ariennir yn cwrdd â’n gofynion monitro.
                        </p>`,
                    }),
                    get fields() {
                        const contactFields = [
                            allFields.seniorContactRole,
                            allFields.seniorContactName,
                            allFields.seniorContactDateOfBirth,
                            allFields.seniorContactAddress,
                            allFields.seniorContactAddressHistory,
                            allFields.seniorContactEmail,
                            allFields.seniorContactPhone,
                            allFields.seniorContactLanguagePreference,
                            allFields.seniorContactCommunicationNeeds,
                        ];

                        const filteredFields = compact([
                            allFields.seniorContactRole,
                            allFields.seniorContactName,
                            includeAddressAndDob() &&
                                allFields.seniorContactDateOfBirth,
                            includeAddressAndDob() &&
                                allFields.seniorContactAddress,
                            includeAddressAndDob() &&
                                allFields.seniorContactAddressHistory,
                            allFields.seniorContactEmail,
                            allFields.seniorContactPhone,
                            isForCountry('wales') &&
                                allFields.seniorContactLanguagePreference,
                            allFields.seniorContactCommunicationNeeds,
                        ]);
                        return conditionalFields(contactFields, filteredFields);
                    },
                },
            ],
        });
    }

    function stepMainContact() {
        return new Step({
            title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your main contact?',
                        cy: 'Pwy yw eich prif gyswllt?',
                    }),
                    get introduction() {
                        const seniorName = getContactFullName(
                            get('seniorContactName')(data)
                        );

                        const seniorNameMsg = seniorName
                            ? safeHtml`, <strong data-hj-suppress>${seniorName}</strong>`
                            : '';

                        return localise({
                            en:
                                safeHtml`<p>
                                Please give us the contact details of a person
                                we can get in touch with if we have any questions.
                                The main contact is usually the person filling in
                                the form—so it's probably you. The main contact needs
                                to be from the organisation applying, but they don't
                                need to hold a particular position. Our identity checks 
                                may appear on a credit report, but it’s not a credit 
                                check and can only be seen by the person we’re checking, 
                                so their credit rating won’t be affected. Find out more 
                                about the checks we 
                                <a href="https://www.tnlcommunityfund.org.uk/funding/funding-guidance/information-checks">carry out on your information</a>.    
                            </p>
                            <p>
                                The main contact must be a different person from the senior contact` +
                                seniorNameMsg +
                                `. The two contacts also can't be:
                            </p>
                            <ul>                            
                                <li>be married to each other or in a civil partnership</li>
                                <li>in a long-term relationship together</li>
                                <li>living at the same address</li>
                                <li>or related by blood.</li> 
                            </ul>
                            `,
                            cy:
                                safeHtml`<p>
                                Rhowch fanylion cyswllt y person gallwn gysylltu â nhw os 
                                oes gennym unrhyw gwestiynau. Y prif gyswllt fel arfer yw’r 
                                person sy’n llenwi’r ffurflen – felly mae’n debyg mai chi yw hwn. 
                                Mae’r prif gyswllt angen bod o’r sefydliad sy’n ymgeisio, ond nid 
                                oes rhaid iddynt ddal unrhyw safle penodol o fewn y sefydliad.    
                            </p>
                            <p>
                                Rhaid i’r prif gyswllt fod yn wahanol i’r uwch gyswllt` +
                                seniorNameMsg +
                                `. Ni all y ddau gyswllt hefyd fod:
                            </p>
                            <ul>                            
                                <li>yn briod i’w gilydd</li>
                                <li>mewn perthynas hir dymor a’u gilydd</li>
                                <li>yn byw yn yr un cyfeiriad</li>
                                <li>Neu yn perthyn drwy waed.</li>
                            </ul>
                            `,
                        });
                    },
                    get fields() {
                        const contactFields = compact([
                            allFields.mainContactName,
                            allFields.mainContactDateOfBirth,
                            allFields.mainContactAddress,
                            allFields.mainContactAddressHistory,
                            allFields.mainContactEmail,
                            allFields.mainContactPhone,
                            allFields.mainContactLanguagePreference,
                            allFields.mainContactCommunicationNeeds,
                        ]);

                        return conditionalFields(
                            contactFields,
                            compact([
                                allFields.mainContactName,
                                includeAddressAndDob() &&
                                    allFields.mainContactDateOfBirth,
                                includeAddressAndDob() &&
                                    allFields.mainContactAddress,
                                includeAddressAndDob() &&
                                    allFields.mainContactAddressHistory,
                                allFields.mainContactEmail,
                                allFields.mainContactPhone,
                                isForCountry('wales') &&
                                    allFields.mainContactLanguagePreference,
                                allFields.mainContactCommunicationNeeds,
                            ])
                        );
                    },
                },
            ],
        });
    }

    function stepContactDetails() {
        function fields() {
            if (includes(projectCountries, 'wales')) {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactLanguagePreference,
                    allFields.contactCommunicationNeeds,
                ];
            } else {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactCommunicationNeeds,
                ];
            }
        }

        return new Step({
            title: localise({
                en: 'Contact details',
                cy: '',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepTerms() {
        const title = localise({
            en: 'Your declaration',
            cy: '',
        });

        return new Step({
            title: title,
            fieldsets: [
                {
                    legend: title,
                    introduction: terms(locale, data, flags),
                    get fields() {
                        return compact([
                            allFields.termsAgreement1,
                            allFields.termsAgreement2,
                            allFields.termsAgreement3,
                            allFields.termsAgreement4,
                            allFields.termsAgreement5,
                            allFields.termsAgreement6,
                            allFields.termsPersonName,
                            allFields.termsPersonPosition,
                        ]);
                    },
                },
            ],
        });
    }

    function summary() {
        const title = get('projectName')(data);
        const countries = getOr([], 'projectCountries')(data);
        const years = get('projectDurationYears')(data);
        const costs = get('projectCosts')(data);

        const overview = [
            {
                label: localise({ en: 'Requested amount', cy: '' }),
                value: costs ? `£${costs.toLocaleString()}` : null,
            },
            {
                label: localise({ en: 'Project duration', cy: '' }),
                value: years
                    ? localise({ en: `${years} years`, cy: '' })
                    : null,
            },
        ];

        return {
            title: title,
            country: countries.length > 1 ? 'uk-wide' : countries[0],
            overview: overview,
        };
    }

    function sectionYourProject() {
        function steps() {
            if (projectCountries.includes('england')) {
                return compact([
                    stepProjectName(),
                    stepProjectCountries(),
                    stepProjectRegions(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepProjectDates(),
                    stepProjectDuration(),
                    stepYourIdea(),
                    stepYourOrganisation(),
                ]);
            } else {
                return compact([
                    stepProjectName(),
                    stepProjectCountries(),
                    stepProjectRegions(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepProjectDuration(),
                    stepYourIdea(),
                ]);
            }
        }
        return {
            slug: 'your-project',
            title: localise({
                en: 'Your project',
                cy: 'Eich prosiect',
            }),
            summary: localise({
                en: oneLine`Please tell us about your project in this section. This 
                is the most important section when it comes to making a decision 
                about whether you will receive funding.`,
                cy: ``,
            }),
            steps: steps(),
        };
    }

    function sectionBeneficiaries() {
        function steps() {
            let steps = [];
            steps = [
                stepBeneficairiesPreflightCheck(),
                stepBeneficiariesCheck(),
                stepBeneficiariesGroups(),
                stepEthnicBackground(),
                stepReligionOrFaith(),
                stepMigrants(),
                stepDisabledPeople(),
                stepAge(),
                stepLGBT(),
            ];
            if (beneficiariesGroupCheck === 'yes' && beneficiariesGroups && beneficiariesGroups.includes('other')) {
                steps.push(
                    stepOtherBeneficiaryGroups(),
                );
            }
            steps.push(
                stepWelshLanguage(),
                stepNorthernIrelandCommunity(),
            );
            if (beneficiariesGroupCheck === 'yes' && beneficiariesGroups && beneficiariesGroups.includes('other')) {
                steps.push(
                    stepBeneficiariesAnyGroupsOther(),
                );
            }
            steps.push(
                // Leadership EDI
                stepBeneficiariesLeadershipEdi(),
                stepLeadershipEthnicBackground(),
                stepLeadershipReligion(),
                stepLeadershipMigrants(),
                stepLeadershipDisabledPeople(),
                stepLeadershipAge(),
                stepLeadershipLGBT(),
            );
            if (beneficiariesGroupCheck === 'yes' && beneficiariesLeadershipGroups && beneficiariesLeadershipGroups.includes('other')) {
                steps.push(
                    stepLeadershipOtherBeneficiaryGroups(),
                    stepBeneficiariesLeadershipAnyGroupsOther(),
                );
            }

            return steps;
        }
        return {
            slug: 'beneficiaries',
            title: localise({
                en:
                    'Equity, Diversity and Inclusion (EDI) monitoring information',
                cy: 'Gwybodaeth fonitro Tegwch, Amrywiaeth a Chynhwysiant',
            }),
            shortTitle: localise({
                en:
                    'Equity, Diversity and Inclusion (EDI) monitoring information',
                cy: 'Gwybodaeth fonitro Tegwch, Amrywiaeth a Chynhwysiant',
            }),
            summary: localise({
                en: `We want to hear more about the people who’ll benefit from your project and your organisation.`,
                cy: ``,
            }),
            steps: steps(),
        };
    }

    function sectionYourOrganisation() {
        function steps() {
            if (projectCountries.includes('england')) {
                return [
                    stepOrganisationLegalName(),
                    stepOrganisationTradingName(),
                    stepOrganisationAddress(),
                    stepOrganisationStartDate(),
                    stepOrganisationSupport(),
                    stepOrganisationStaff(),
                    stepOrganisationType(),
                    stepOrganisationSubType(),
                    stepFinancialPosition(),
                ];
            } else {
                return [
                    stepOrganisationLegalName(),
                    stepOrganisationTradingName(),
                    stepOrganisationAddress(),
                    stepOrganisationType(),
                    stepOrganisationSubType(),
                ];
            }
        }
        return {
            slug: 'your-organisation',
            title: localise({
                en: 'Your organisation',
                cy: 'Eich sefydliad',
            }),
            summary: localise({
                en: oneLine`Please tell us about your organisation,
                    including legal name and registered address.
                    This helps us understand the type of organisation you are.`,
                cy: oneLine`Dywedwch wrthym am eich sefydliad, gan gynnwys yr
                    enw cyfreithiol,  cyfeiriad cofrestredig ac incwm.
                    Mae hyn yn ein helpu i ddeall pa fath o sefydliad ydych.`,
            }),
            steps: steps(),
        };
    }

    function sectionSeniorContact() {
        return {
            slug: 'senior-contact',
            title: localise({ en: 'Senior contact', cy: 'Uwch gyswllt' }),
            summary: localise({
                en: oneLine`Please provide details for your senior contact.
                    This person will be legally responsible for the funding.
                    They can't be married to, in a long-term relationship with,
                    living with, or related to the main contact.`,
                cy: oneLine`Darparwch fanylion ar gyfer eich uwch gyswllt. 
                    Bydd y person yma’n gyfreithiol gyfrifol am yr arian. 
                    Ni allent fod yn briod i, mewn perthynas hir dymor â, 
                    yn byw gyda na’n perthyn drwy waed i’r prif gyswllt.`,
            }),
            steps: [stepSeniorContact()],
        };
    }

    function sectionMainContact() {
        return {
            slug: 'main-contact',
            title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
            summary: localise({
                en: oneLine`Please provide details for your main contact.
                    This will be the first person we contact if we
                    need to discuss your project.`,
                cy: oneLine`Darparwch fanylion ar gyfer eich prif gyswllt. 
                    Dyma fydd y person cyntaf i ni gysylltu â nhw os 
                    byddwn angen trafod eich prosiect.`,
            }),
            steps: [stepMainContact()],
        };
    }

    function sectionYourDetails() {
        return {
            slug: 'your-details',
            title: localise({
                en: 'Your details',
                cy: '',
            }),
            summary: localise({
                en: oneLine`Please provide details for the person
                    we should contact to talk about your idea.`,
                cy: ``,
            }),
            steps: [stepContactDetails()],
        };
    }

    function sectionTerms() {
        return {
            slug: 'terms-and-conditions',
            title: localise({
                en: 'Your declaration',
                cy: '',
            }),
            summary: localise({
                en: oneLine`In order to submit your application,
                    you will need to agree to our terms and conditions.`,
                cy: oneLine`Er mwyn anfon eich cais, 
                    bydd angen i chi gytuno â'n Telerau ac Amodau.`,
            }),
            steps: [stepTerms()],
        };
    }

    function sections() {
        if (projectCountries.includes('england')) {
            return [
                sectionYourProject(),
                sectionYourOrganisation(),
                sectionSeniorContact(),
                sectionMainContact(),
                sectionTerms(),
                sectionBeneficiaries(),
            ];
        } else {
            return [
                sectionYourProject(),
                sectionYourOrganisation(),
                sectionYourDetails(),
                sectionBeneficiaries()
            ];
        }
    }

    const form = {
        title: localise({
            en: 'Your funding proposal',
            cy: '',
        }),
        startLabel: localise({
            en: 'Start your proposal',
            cy: 'Dechrau ar eich cynnig',
        }),
        allFields,
        summary: summary(),
        schemaVersion: 'v1.0',
        forSalesforce() {
            const enriched = clone(data);
            if (metadata && metadata.programme) {
                enriched.projectName = `${metadata.programme.title}: ${enriched.projectName}`;
            }

            return enriched;
        },
        sections: sections(),
    };

    return new FormModel(form, data, locale);
};
