'use strict';
const config = require('config');
const Sentry = require('@sentry/node');
const clone = require('lodash/clone');
const concat = require('lodash/concat');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const sumBy = require('lodash/sumBy');
const { safeHtml, oneLine } = require('common-tags');

const { isTestServer } = require('../../../common/appData');

const { FormModel } = require('../lib/form-model');
const { Step } = require('../lib/step-model');
const fromDateParts = require('../lib/from-date-parts');
const { formatDateRange } = require('../lib/formatters');
const isNewOrganisation = require('./lib/new-organisation');

const { getContactFullName } = require('./lib/contacts');
const { checkBankAccountDetails } = require('./lib/bank-api');
const {
    BENEFICIARY_GROUPS,
    CONTACT_EXCLUDED_TYPES,
    ORGANISATION_TYPES,
    COMPANY_NUMBER_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES,
} = require('./constants');

const fieldsFor = require('./fields');
const terms = require('./terms');

module.exports = function ({
    locale = 'en',
    data = {},
    showAllFields = false,
    metadata = {},
    flags = config.get('fundingUnder10k'),
} = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({ locale, data, flags });

    const beneficiariesGroupCheck = get('beneficiariesGroupsCheck')(data);

    const beneficiariesGroups = get('beneficiariesGroups')(data);

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

    const currentOrganisationType = get('organisationType')(data);

    const fields = fieldsFor({ locale, data, flags });

    function anyOtherGroupsCheck(){
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

        if (beneficiariesGroupsEthnicBackground.includes('other-ethnicity') ||
            beneficiariesGroupsLGBT.includes('other-lgbt') ||
            beneficiariesGroupsDisabledPeople.includes('other-disability') ||
            beneficiariesGroupsReligion.includes('other-faith') ||
            beneficiariesGroupsMigrant.includes('other-migrant')) {
            return true;
        } else
        {
            return false;
        }
    }

    function stepProjectName() {
        return new Step({
            title: localise({
                en: 'Project name',
                cy: 'Enw eich prosiect',
            }),
            fieldsets: [{ fields: [fields.projectName] }],
        });
    }

    function stepProjectCountry() {
        return new Step({
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project country',
                        cy: 'Gwlad y prosiect',
                    }),
                    fields: [fields.projectCountry],
                },
            ],
        });
    }

    function stepProjectLocation() {
        return new Step({
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project location',
                        cy: 'Lleoliad y prosiect',
                    }),

                    /**
                     * The project location fields are conditional based
                     * on the project country, so don't include them if
                     * the country hasn't been provided yet.
                     */
                    get fields() {
                        const allFields = [
                            fields.projectLocation,
                            fields.projectLocationDescription,
                            fields.projectPostcode,
                        ];
                        return conditionalFields(
                            allFields,
                            has('projectCountry')(data) ? allFields : []
                        );
                    },
                },
            ],
        });
    }

    function stepProjectLength() {
        /**
         * 1. If in England and asap then don't ask any day questions (when flag turned on)
         * 2. If outside England and asap then only ask the end date question
         * 3. Otherwise, show both date fields
         */
        function _fields() {
            return [fields.projectStartDate, fields.projectEndDate];
        }

        return new Step({
            title: localise({
                en: 'Project length',
                cy: 'Hyd y prosiect',
            }),
            fieldsets: [
                { fields: has('projectCountry')(data) ? _fields() : [] },
            ],
        });
    }

    function stepYourIdea() {
        return new Step({
            title: localise({ en: 'Your idea', cy: 'Eich syniad' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Your idea',
                        cy: 'Eich syniad',
                    }),
                    fields: [
                        fields.yourIdeaProject,
                        fields.yourIdeaPriorities,
                        fields.yourIdeaCommunity,
                    ],
                },
            ],
        });
    }

    function stepProjectCosts() {
        return new Step({
            title: localise({
                en: 'Project costs',
                cy: 'Costau’r prosiect',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project costs',
                        cy: 'Costau’r prosiect',
                    }),
                    fields: [fields.projectBudget, fields.projectTotalCosts],
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
                            We will <strong>not</strong> use your answers to decide if we award you a grant.</p> 

                            <p>We may use these answers in information we publish about grants awarded, including on other websites
                            like <a href="http://grantnav.threesixtygiving.org/" target="_blank">360 Giving GrantNav</a>.</p>

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
                            our funding and who it's reaching.
                        </p>
                        <p>
                            However, the information you provide here is <strong>not assessed</strong>
                            and <strong>will not</strong> be used to decide whether you'll be
                            awarded funding for your project.
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

    function stepEthnicBackground() {
        return new Step({
            title: localise({
                en: 'Communities experiencing ethnic or racial inequity',
                cy: 'Cymunedau sy\'n profi annhegwch ethnig neu hiliol, ymwadiad neu anghydraddoldeb',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Communities experiencing ethnic or racial inequity',
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
                        const allFields = [
                            fields.beneficiariesGroupsReligion,
                        ];
                        return conditionalFields(
                            allFields,
                            includeIfBeneficiaryType(
                                BENEFICIARY_GROUPS.RELIGION,
                                allFields
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
                        [fields.beneficiariesWelshLanguage],
                        includeIfCountry('wales', [
                            fields.beneficiariesWelshLanguage,
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
                        [fields.beneficiariesNorthernIrelandCommunity],
                        includeIfCountry('northern-ireland', [
                            fields.beneficiariesNorthernIrelandCommunity,
                        ])
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

    function stepOrganisationDetails() {
        return new Step({
            title: localise({
                en: 'Organisation details',
                cy: 'Manylion sefydliad',
            }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation details',
                        cy: 'Manylion sefydliad',
                    }),
                    fields: [
                        fields.organisationLegalName,
                        fields.organisationHasDifferentTradingName,
                        fields.organisationStartDate,
                        fields.organisationAddress,
                    ],
                },
            ],
        });
    }

    function stepOrganisationTradingName() {
        const legalNameCheck = get('organisationHasDifferentTradingName')(data);

        return new Step({
            title: localise({
                en: 'Organisation trading name',
                cy: `Enw masnachu’r mudiad`,
            }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation trading name',
                        cy: `Enw masnachu’r mudiad`,
                    }),
                    fields: conditionalFields(
                        [fields.organisationTradingName],
                        compact([
                            legalNameCheck === 'yes' &&
                                fields.organisationTradingName,
                        ])
                    ),
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
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation type',
                        cy: 'Math o sefydliad',
                    }),
                    fields: [fields.organisationType],
                },
            ],
        });
    }

    /**
     * Include fields based on the current organisation type.
     */
    function includeIfOrganisationType(type, fields) {
        const organisationType = get('organisationType')(data);
        return organisationType === type ? fields : [];
    }

    /**
     * Conditional sub-type based on the primary organisation type.
     * Currently this is only required for statutory bodies.
     *
     * A fallback step title is provided for display on the summary
     * when the primary organisation type hasn't been provided yet.
     * i.e. for new applications
     */
    function stepOrganisationSubType() {
        let title = localise({
            en: 'Organisation sub-type',
            cy: 'Is-fath y sefydliad',
        });

        if (currentOrganisationType === ORGANISATION_TYPES.STATUTORY_BODY) {
            title = localise({
                en: 'Type of statutory body',
                cy: 'Math o gorff statudol',
            });
        }

        return new Step({
            title: title,
            fieldsets: [
                {
                    legend: title,
                    fields: conditionalFields(
                        [fields.organisationSubTypeStatutoryBody],
                        includeIfOrganisationType(
                            ORGANISATION_TYPES.STATUTORY_BODY,
                            [fields.organisationSubTypeStatutoryBody]
                        )
                    ),
                },
            ],
        });
    }

    /**
     * Registration numbers are conditional based on the organisation type
     * This step can include a combination of company number,
     * charity number, and/or department for education number.
     */
    function stepRegistrationNumbers() {
        const includeCompanyNumber = COMPANY_NUMBER_TYPES.includes(
            currentOrganisationType
        );

        const includeCharityNumber = concat(
            CHARITY_NUMBER_TYPES.required,
            CHARITY_NUMBER_TYPES.optional
        ).includes(currentOrganisationType);

        const includeEducationNumber = EDUCATION_NUMBER_TYPES.includes(
            currentOrganisationType
        );

        return new Step({
            title: localise({
                en: 'Registration numbers',
                cy: 'Rhifau cofrestru',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Registration numbers',
                        cy: 'Rhifau cofrestru',
                    }),
                    get fields() {
                        const allFields = [
                            fields.companyNumber,
                            fields.charityNumber,
                            fields.educationNumber,
                        ];
                        return conditionalFields(
                            allFields,
                            compact([
                                includeCompanyNumber && fields.companyNumber,
                                includeCharityNumber && fields.charityNumber,
                                includeEducationNumber &&
                                    fields.educationNumber,
                            ])
                        );
                    },
                },
            ],
        });
    }

    /**
     * Conditionally include organisation finance questions based
     * on the organisation start date. New organisations will not have
     * produced annual accounts yet so will not have this information.
     */
    function stepOrganisationFinances() {
        return new Step({
            title: localise({
                en: 'Organisation finances',
                cy: 'Cyllid y sefydliad',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation finances',
                        cy: 'Cyllid y sefydliad',
                    }),
                    get fields() {
                        const allFields = [
                            fields.accountingYearDate,
                            fields.totalIncomeYear,
                        ];

                        return conditionalFields(
                            allFields,
                            isNewOrganisation(
                                get('organisationStartDate')(data)
                            )
                                ? []
                                : allFields
                        );
                    },
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
                            funded organisation meets our monitoring requirements.
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
                        const allFields = [
                            fields.seniorContactRole,
                            fields.seniorContactName,
                            fields.seniorContactDateOfBirth,
                            fields.seniorContactAddress,
                            fields.seniorContactAddressHistory,
                            fields.seniorContactEmail,
                            fields.seniorContactPhone,
                            fields.seniorContactLanguagePreference,
                            fields.seniorContactCommunicationNeeds,
                        ];

                        const filteredFields = compact([
                            fields.seniorContactRole,
                            fields.seniorContactName,
                            includeAddressAndDob() &&
                                fields.seniorContactDateOfBirth,
                            includeAddressAndDob() &&
                                fields.seniorContactAddress,
                            includeAddressAndDob() &&
                                fields.seniorContactAddressHistory,
                            fields.seniorContactEmail,
                            fields.seniorContactPhone,
                            isForCountry('wales') &&
                                fields.seniorContactLanguagePreference,
                            fields.seniorContactCommunicationNeeds,
                        ]);
                        return conditionalFields(allFields, filteredFields);
                    },
                },
            ],
        });
    }

    function stepMainContact() {
        function listItems(en = true) {
            if (en) {
                return `<li>married to each other</li>
                <li>in a civil partnership with each other</li>
                <li>in a long-term relationship together</li>
                <li>living at the same address</li>
                <li>or related by blood.</li>`;
            } else {
                return `<li>yn briod i’w gilydd</li>
                <li>fod mewn partneriaeth sifil â'i gilydd</li>
                <li>mewn perthynas hir dymor a’u gilydd</li>
                <li>yn byw yn yr un cyfeiriad</li>
                <li>Neu yn perthyn drwy waed.</li>`;
            }
        }
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
                                need to hold a particular position.    
                            </p>
                            <p>
                                The main contact must be a different person from the senior contact` +
                                seniorNameMsg +
                                `. The two contacts also can't be:
                            </p>
                            <ul>                        
                                ${listItems()}
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
                                ${listItems(false)}
                            </ul>
                            `,
                        });
                    },
                    get fields() {
                        const allFields = compact([
                            fields.mainContactName,
                            fields.mainContactDateOfBirth,
                            fields.mainContactAddress,
                            fields.mainContactAddressHistory,
                            fields.mainContactEmail,
                            fields.mainContactPhone,
                            fields.mainContactLanguagePreference,
                            fields.mainContactCommunicationNeeds,
                        ]);

                        return conditionalFields(
                            allFields,
                            compact([
                                fields.mainContactName,
                                includeAddressAndDob() &&
                                    fields.mainContactDateOfBirth,
                                includeAddressAndDob() &&
                                    fields.mainContactAddress,
                                includeAddressAndDob() &&
                                    fields.mainContactAddressHistory,
                                fields.mainContactEmail,
                                fields.mainContactPhone,
                                isForCountry('wales') &&
                                    fields.mainContactLanguagePreference,
                                fields.mainContactCommunicationNeeds,
                            ])
                        );
                    },
                },
            ],
        });
    }

    /**
     * Bank account details pre-flight check
     * Returns a list of error messages if the bank details are invalid
     *
     * Wraps result in a promise so we can resolve if the API
     * returns an unknown status or an error.
     *
     * We can treat this check as optional as it is performed again
     * at the CRM end and we want to keep the form usable if
     * if the third party API is down/broken.
     *
     * Bails early if we're in a test server to avoid extra lookups.
     */
    function bankAccountPreFlightCheck(submittedData) {
        const sortCode = get('bankSortCode')(submittedData);
        const accountNumber = get('bankAccountNumber')(submittedData);

        function messagesForStatus(bankStatus) {
            let messages = [];
            switch (bankStatus.code) {
                case 'INVALID_ACCOUNT':
                    messages = [
                        {
                            label: fields.bankSortCode.label,
                            msg: localise({
                                en: `This sort code is not valid with this account number`,
                                cy:
                                    'Nid yw’r cod didoli’n ddilys â’r rhif cyfrif hwn',
                            }),
                            param: 'bankSortCode',
                        },
                        {
                            param: 'bankAccountNumber',
                            label: fields.bankAccountNumber.label,
                            msg: localise({
                                en: `This account number is not valid with this sort code`,
                                cy:
                                    'Nid yw’r rhif cyfrif yn ddilys â’r cod didoli hwn',
                            }),
                        },
                    ];
                    break;
                case 'INVALID_BACS':
                    messages = [
                        {
                            param: 'bankAccountNumber',
                            label: fields.bankAccountNumber.label,
                            msg: localise({
                                en: oneLine`This bank account cannot receive BACS payments,
                                    which is a requirement for funding`,
                                cy: oneLine`Ni all y cyfrif banc hwn dderbyn taliadau BACS, 
                                    sy’n ofynnol i gael eich ariannu.`,
                            }),
                        },
                    ];
                    break;
                default:
                    messages = [];
                    break;
            }

            return messages;
        }

        if (isTestServer) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                checkBankAccountDetails(sortCode, accountNumber)
                    .then((bankStatus) => {
                        const messages = messagesForStatus(bankStatus);
                        if (messages.length > 0) {
                            return reject(messages);
                        } else {
                            return resolve();
                        }
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        return resolve();
                    });
            });
        }
    }

    function stepBankAccount() {
        return new Step({
            title: localise({ en: 'Bank account', cy: 'Cyfrif banc' }),
            noValidate: true,
            fieldsets: [
                {
                    legend: localise({
                        en: 'What are your bank account details?',
                        cy: 'Beth yw eich manylion cyfrif banc?',
                    }),
                    introduction: localise({
                        en: `<p>
                            We need your bank details to pay the funding into your account - if your application is successful. 
                        </p>
                        <p><strong>We can't pay into all bank accounts</strong>:
                            We can't transfer money into certain types of bank
                            accounts like Tide, Cashplus and Paypal.
                        </p>`,
                        cy: `<p>
                            Rydym angen eich manylion banc i dalu’r arian i’ch cyfrif – os yw eich cais yn llwyddiannus. 
                        </p>
                        <p><strong>Ni allwn dalu i mewn i bob cyfrif banc</strong>:
                            Ni allwn drosglwyddo arian i fathau penodol o gyfrifon fel Tide, Cashplush a Paypal.
                        </p>`,
                    }),
                    fields: [
                        fields.bankAccountName,
                        fields.bankSortCode,
                        fields.bankAccountNumber,
                        fields.buildingSocietyNumber,
                    ],
                },
            ],
            preFlightCheck: bankAccountPreFlightCheck,
        });
    }

    function stepBankStatement() {
        const introduction = localise({
            en: `
            <p><strong>
                You must attach your bank statement as a PDF, JPEG or PNG file.
                Unfortunately we can’t accept Word documents,
                but photos of your bank statements are absolutely fine.
            </strong></p>
            
            <div class="o-media--constrained u-padded u-tone-background-tint u-margin-bottom">
                <a href="../help/bank-statement" target="_blank">
                    <img src="/assets/images/apply/under-10k-bank-statement-example-small.png"
                         alt="An example of a bank statement we need from you"
                         class="o-media__figure o-media__figure-gutter"
                         width="300" />
                    <span class="u-visually-hidden">Opens in a new window</span>
                 </a>
                <div class="o-media__body">
                    <p><strong>
                        Please make sure that we can clearly see the
                        following on your bank statement:
                    </strong></p>
                    <ul>
                        <li>Your organisation’s legal name</li>
                        <li>The address the statements are sent to</li>
                        <li>The bank name</li>
                        <li>Account number</li>
                        <li>Sort code</li>
                        <li>Date (must be within last 3 months)</li>
                    </ul>
                    <p>Here's an <a target="_blank" href="../help/bank-statement">
                        example of what we're looking for
                    </a>
                    <span class="u-visually-hidden"> Opens in a new window</span>.</p>
                </div>
            </div>
            <p>
                <strong>Your statement needs to be less than three months old</strong>.
                For bank accounts opened within the last three months,
                we can accept a bank welcome letter. This must confirm
                the date your account was opened, account name,
                account number and sort code.
            </p>
            <p><strong>If you're a school using a local authority bank account</strong></p>
            <p>
                We'll need a letter from the local authority dated
                within the last 3 months. It should show:
            </p> 
            <ul>
                <li>Your school name</li>
                <li>The bank account name</li>
                <li>Account number</li>
                <li>Sort code.</li>
            </ul>`,
            cy: `
            <p><strong>
                Rhaid ichi atodi eich cyfriflen banc fel ffeil PDF, JPEG neu PNG. 
                Yn anffodus, ni allwn dderbyn dogfennau Word, 
                ond mae lluniau o’ch cyfriflenni banc yn hollol iawn.
            </strong></p>
            
            <div class="o-media--constrained u-padded u-tone-background-tint u-margin-bottom">
                <a href="../help/bank-statement" target="_blank">
                    <img src="/assets/images/apply/under-10k-bank-statement-example-small-welsh.jpg"
                         alt="Enghraifft o gyfriflen banc rydym ei angen gennych"
                         class="o-media__figure o-media__figure-gutter"
                         width="300" />
                    <span class="u-visually-hidden">Yn agor mewn ffenest newydd</span>
                 </a>
                <div class="o-media__body">
                    <p><strong>
                        Sicrhewch fod y canlynol yn glir ar eich cyfriflen banc:
                    </strong></p>
                    <ul>
                        <li>Enw cyfreithiol eich sefydliad</li>
                        <li>Y cyfeiriad mae’r cyfriflenni’n cael eu hanfon</li>
                        <li>Enw’r banc</li>
                        <li>Rhif cyfrif</li>
                        <li>Cod didoli</li>
                        <li>Dyddiad (Rhaid bod o fewn y tri mis ddiwethaf)</li>
                    </ul>
                    <p>Dyma <a target="_blank" href="../help/bank-statement">
                        enghraifft o’r hyn rydym yn edrych amdano
                    </a>
                    <span class="u-visually-hidden"> Yn agor mewn ffenest newydd</span>.</p>
                </div>
            </div>
            <p>
                <strong>Rhaid i’ch cyfriflen fod yn llai na thri mis oed</strong>.
                I gyfrifon banc sydd wedi agor o fewn y tri mis diwethaf,
                gallwn dderbyn llythyr o groeso gan y banc.
            </p>
            <p><strong>Os ydych yn ysgol yn defnyddio cyfrif banc awdurdod lleol</strong></p>
            <p>
                Byddwn angen llythyr gan yr awdurdod lleol wedi’i ddyddio o
                fewn y tri mis ddiwethaf. Dylai ddangos: 
            </p> 
            <ul>
                <li>Enw eich ysgol</li>
                <li>Enw’r cyfrif banc</li>
                <li>Rhif cyfrif</li>
                <li>Cod didoli</li>
            </ul>`,
        });

        return new Step({
            title: localise({ en: 'Bank statement', cy: 'Cyfriflen banc' }),
            isMultipart: true,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Bank statement',
                        cy: 'Cyfriflen banc',
                    }),
                    introduction: introduction,
                    fields: [fields.bankStatement],
                },
            ],
        });
    }

    function stepTerms() {
        const title = localise({
            en: 'Terms and conditions of your grant',
            cy: 'Telerau ac Amodau eich grant',
        });

        const footer = localise({
            en: `<p>
                We know the vast majority of the many thousands who
                seek and use our funding are genuine. However, we
                sometimes receive fraudulent applications and so we
                have a duty to carry out checks on individuals at
                organisations which apply for grants.
                The personal information we have collected from you
                will therefore be shared with fraud prevention
                agencies who will use it to prevent fraud and money-laundering
                and to verify your identity. If fraud is detected,
                you could be refused certain services, finance or employment.
            </p>
            <p>
                Further details of how your information will be used by us
                and these fraud prevention agencies, your data protection
                rights and how to contact us, can be found in our full
                Data Protection and Privacy Notice which is published on our website
                <a href="/data-protection">www.tnlcommunityfund.org.uk/data-protection</a>.
                Contact us to request a hard copy by telephoning our advice line on 028 9568 0143,
                or by writing to Customer Services, The National Lottery Community Fund,
                2 St James’ Gate, Newcastle upon Tyne, NE1 4BE.
             </p>
             <p>When you click submit the Terms and Conditions as agreed to above become binding.</p>`,
            cy: `<p>
                Rydym yn gwybod bod y rhan fwyaf o’r miloedd sy’n 
                chwilio am arian gennym yn ddiffuant. Er hynny, rydym 
                weithiau yn derbyn ceisiadau twyllodrus ac felly mae gennym 
                ddyletswydd i wneud gwiriadau ar unigolion mewn sefydliadau 
                sy’n ymgeisio am grantiau. Bydd y wybodaeth bersonol rydym wedi’i 
                gasglu gennych felly yn cael ei rannu gydag asiantaethau atal twyll, 
                a fydd yn ei ddefnyddio i atal twyll a gwyngalchu arian, 
                ac i wireddu eich hunaniaeth. Os oes twyll yn cael ei ganfod, 
                gellid eich gwrthod rhag rhai gwasanaethau, arian neu gyflogaeth.
            </p>
            <p>
                Gall gwybodaeth pellach ar sut bydd eich gwybodaeth yn cael ei ddefnyddio gennym a’r 
                asiantaethau atal twyll hyn, eich hawliau gwarchod data a sut i gysylltu â ni, ei ganfod yn ein 
                Hysbysiad Diogelu Data a Phreifatrwydd llawn, sydd wedi’i gyhoeddi ar ein gwefan 
                <a href="/welsh/about/customer-service/data-protection">https://www.tnlcommunityfund.org.uk/welsh/about/customer-service/data-protection</a>. 
                Cysylltwch â ni i ofyn am gopi caled drwy ffonio ein llinell gynghori ar 029 2168 0214,
                neu drwy ysgrifennu i Cronfa Gymunedol y Loteri Genedlaethol, 10fed Llawr,
                Tŷ Helmont, Ffordd Churchill, Caerdydd, CF10 2DY
            </p>
            <p>Pan fyddwch yn clicio anfon, mae’r Telerau ac Amodau fel y cytunwyd uchod yn dod yn rhwymol.</p>`,
        });

        return new Step({
            title: title,
            fieldsets: [
                {
                    legend: title,
                    introduction: terms(locale, data, flags),
                    footer: footer,
                    get fields() {
                        return compact([
                            fields.termsAgreement1,
                            fields.termsAgreement2,
                            fields.termsAgreement3,
                            fields.termsAgreement4,
                            fields.termsPersonName,
                            fields.termsPersonPosition,
                        ]);
                    },
                },
            ],
        });
    }

    function sectionYourProject() {
        return {
            slug: 'your-project',
            title: localise({
                en: 'Your project',
                cy: 'Eich prosiect',
            }),
            summary: localise({
                en: oneLine`Please tell us about your project in this section.
                    This is the most important section when it comes to
                    making a decision about whether you will receive funding.`,
                cy: oneLine`Dywedwch wrthym am eich prosiect yn yr adran hon. 
                    Dyma’r adran bwysicaf pan fydd yn dod i wneud penderfyniad p’un 
                    a ydych wedi bod yn llwyddiannus ai beidio.`,
            }),
            steps: compact([
                stepProjectName(),
                stepProjectCountry(),
                stepProjectLocation(),
                stepProjectLength(),
                stepYourIdea(),
                stepProjectCosts(),
            ]),
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
            if (beneficiariesGroupCheck === 'yes' && beneficiariesGroups && anyOtherGroupsCheck()) {
                steps.push(
                    stepBeneficiariesAnyGroupsOther(),
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
                en: 'Equity, Diversity and Inclusion (EDI) monitoring information',
                cy: 'Gwybodaeth fonitro Tegwch, Amrywiaeth a Chynhwysiant',
            }),
            summary: localise({
                en: `We want to hear more about the people who’ll benefit from your project and your organisation.`,
                cy: `Rydyn ni eisiau clywed mwy am y bobl fydd yn elwa o'ch prosiect a'ch sefydliad.`,
            }),
            steps: steps(),
        };
    }

    function sectionOrganisation() {
        return {
            slug: 'organisation',
            title: localise({
                en: 'Your organisation',
                cy: 'Eich sefydliad',
            }),
            summary: localise({
                en: oneLine`Please tell us about your organisation,
                    including legal name, registered address and income.
                    This helps us understand the type of organisation you are.`,
                cy: oneLine`Dywedwch wrthym am eich sefydliad, gan gynnwys yr enw cyfreithiol, 
                    cyfeiriad cofrestredig ac incwm. Mae hyn yn ein helpu 
                    i ddeall pa fath o sefydliad ydych.`,
            }),
            steps: [
                stepOrganisationDetails(),
                stepOrganisationTradingName(),
                stepOrganisationType(),
                stepOrganisationSubType(),
                stepRegistrationNumbers(),
                stepOrganisationFinances(),
            ],
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

    function sectionBankDetails() {
        return {
            slug: 'bank-details',
            title: localise({ en: 'Bank details', cy: 'Manylion banc' }),
            summary: localise({
                en: oneLine`Please provide your bank details.
                    Before you submit your application you will
                    need to attach a copy of a bank statement
                    that is less than three months old`,
                cy: oneLine`Darparwch eich manylion banc. 
                    Cyn i chi anfon eich cais bydd angen i chi 
                    atodi copi o’ch cyfriflen banc sy’n llai na tri mis oed.`,
            }),
            steps: [stepBankAccount(), stepBankStatement()],
        };
    }

    function sectionTerms() {
        return {
            slug: 'terms-and-conditions',
            title: localise({
                en: 'Terms and conditions',
                cy: 'Telerau ac Amodau',
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

    function summary() {
        const projectDateRange = get('projectDateRange')(data);
        const organisation = get('organisationLegalName')(data);
        const budget = getOr([], 'projectBudget')(data);
        const budgetSum = sumBy(budget, (item) => parseInt(item.cost || 0));

        return {
            title: getOr(
                localise({
                    en: `Untitled application`,
                    cy: `Cais heb deitl`,
                }),
                'projectName'
            )(data),
            country: get('projectCountry')(data),
            overview: [
                {
                    label: localise({ en: 'Organisation', cy: 'Sefydliad' }),
                    value: organisation,
                },
                {
                    label: localise({
                        en: 'Project dates',
                        cy: 'Dyddiadau’r prosiect',
                    }),
                    value:
                        projectDateRange &&
                        formatDateRange(locale)(projectDateRange),
                },
                {
                    label: localise({
                        en: 'Requested amount',
                        cy: 'Swm y gofynnwyd amdano',
                    }),
                    value:
                        budget.length > 0 && `£${budgetSum.toLocaleString()}`,
                },
            ],
        };
    }

    function forSalesforce() {
        function dateFormat(dt) {
            return fromDateParts(dt).format('YYYY-MM-DD');
        }

        const enriched = clone(data);

        function normaliseProjectStartDate() {
            /**
             * If projectStartDateCheck is `asap` then pre-fill
             * the projectStartDate to today
             */
            return dateFormat(enriched.projectStartDate);
        }

        function normaliseProjectEndDate() {
            /**
             * If projectCountry is England and date check is ASAP
             * then pre-fill the projectEndDate to 6 months time
             */
            return dateFormat(enriched.projectEndDate);
        }

        const projectStartDate = normaliseProjectStartDate();
        const projectEndDate = normaliseProjectEndDate();

        enriched.projectStartDate = projectStartDate;
        enriched.projectEndDate = projectEndDate;

        // Support previous date range schema format
        enriched.projectDateRange = {
            startDate: enriched.projectStartDate,
            endDate: enriched.projectEndDate,
        };

        if (has('mainContactDateOfBirth')(enriched)) {
            enriched.mainContactDateOfBirth = dateFormat(
                enriched.mainContactDateOfBirth
            );
        }

        if (has('seniorContactDateOfBirth')(enriched)) {
            enriched.seniorContactDateOfBirth = dateFormat(
                enriched.seniorContactDateOfBirth
            );
        }

        if (metadata && metadata.programme) {
            enriched.projectName = `${metadata.programme.title}: ${enriched.projectName}`;
        }

        return enriched;
    }

    const form = {
        title: localise({
            en: 'Apply for funding under £10,000',
            cy: 'Ymgeisio am arian grant dan £10,000',
        }),
        startLabel: localise({
            en: 'Start your application',
            cy: 'Dechrau ar eich cais',
        }),
        allFields: fields,
        featuredErrorsAllowList: compact([
            { fieldName: 'projectDateRange', includeBase: false },
            { fieldName: 'projectStartDate', includeBase: false },
            { fieldName: 'projectEndDate', includeBase: false },
            {
                fieldName: 'organisationType',
                includeBase: true,
            },
            { fieldName: 'seniorContactRole', includeBase: false },
            { fieldName: 'mainContactName', includeBase: false },
            { fieldName: 'mainContactEmail', includeBase: false },
            { fieldName: 'mainContactPhone', includeBase: false },
        ]),
        summary: summary(),
        schemaVersion: 'v1.4',
        forSalesforce: forSalesforce,
        sections: [
            sectionYourProject(),
            sectionBeneficiaries(),
            sectionOrganisation(),
            sectionSeniorContact(),
            sectionMainContact(),
            sectionBankDetails(),
            sectionTerms(),
        ],
    };

    return new FormModel(form, data, locale);
};
