const faker = require('faker');
const includes = require('lodash/includes');
const random = require('lodash/random');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const sum = require('lodash/sum');
const times = require('lodash/times');
const moment = require('moment');

describe('awards for all', function() {
    it('should submit full awards for all application', () => {
        const country = 'Scotland';

        function shouldDisplayErrors(errorDescriptions = []) {
            errorDescriptions.forEach(description => {
                cy.getByTestId('form-errors').should('contain', description);
            });
        }

        function submitStep() {
            cy.getByText('Continue').click();
        }

        function fillAddress({ streetAddress, city, county, postcode }) {
            cy.getByText('Enter address manually').click();

            cy.getByLabelText('Building and street').type(streetAddress);

            cy.getByLabelText('Town or city').type(city);

            if (county) {
                cy.getByLabelText('County').type(county);
            }

            cy.getByLabelText('Postcode').type(postcode);
        }

        function startApplication() {
            cy.getByText('Start new application').click();
            times(5, function() {
                cy.getByLabelText('Yes').click();
                cy.getByText('Continue').click();
            });
            cy.getByText('Start your application').click();

            cy.getAllByText('Start your application')
                .first()
                .click();
        }

        function stepProjectDetails() {
            cy.checkA11y();

            cy.getByLabelText('What is the name of your project?', {
                exact: false
            }).type('Test application');

            const startDate = moment().add(random(18, 20), 'weeks');
            const endDate = startDate.clone().add(random(0, 52), 'weeks');

            function fillDateParts(momentInstance) {
                cy.getByLabelText('Day')
                    .clear()
                    .type(momentInstance.date());

                cy.getByLabelText('Month')
                    .clear()
                    .type(momentInstance.month() + 1);

                cy.getByLabelText('Year')
                    .clear()
                    .type(momentInstance.year());
            }

            cy.getByText('Start date')
                .parent()
                .within(() => {
                    fillDateParts(startDate);
                });

            cy.getByText('End date')
                .parent()
                .within(() => {
                    fillDateParts(endDate);
                });

            submitStep();
        }

        function stepProjectCountry() {
            cy.getByLabelText(country).click();
            submitStep();
        }

        function stepProjectLocation() {
            let location = {};
            switch (country) {
                case 'Northern Ireland':
                    location = {
                        option: 'Derry and Strabane',
                        postcode: 'BT82 8AE'
                    };
                    break;
                case 'Scotland':
                    location = sample([
                        { option: 'Glasgow', postcode: 'G1 1DN' },
                        { option: 'Highlands', postcode: 'KW8 6JF' },
                        { option: 'Perth & Kinross', postcode: 'PH1 1DA' }
                    ]);

                    break;
                case 'Wales':
                    location = {
                        option: 'Caerphilly',
                        postcode: 'CF83 1AP'
                    };

                    break;
                default:
                    location = {
                        option: 'Bath and North East Somerset',
                        postcode: 'BA1 0DH'
                    };

                    break;
            }

            cy.getByLabelText('Where will your project take place?').select(
                location.option
            );

            cy.getByLabelText(
                'Tell us the towns or villages where people who will benefit from your project live'
            ).type(`Example location description for ${location.option}`);

            cy.getByLabelText('What is the postcode', { exact: false }).type(
                location.postcode
            );

            submitStep();
        }

        function stepYourIdea() {
            cy.checkA11y();

            cy.getByLabelText('What would you like to do?')
                .invoke('val', faker.lorem.words(150))
                .trigger('change');

            cy.getByLabelText(
                'How does your project meet at least one of our funding priorities?'
            )
                .invoke('val', faker.lorem.words(100))
                .trigger('change');

            cy.getByLabelText('How does your project involve your community?')
                .invoke('val', faker.lorem.words(150))
                .trigger('change');

            submitStep();
        }

        function stepProjectCosts() {
            function addItem(description, amount) {
                cy.getAllByTestId('budget-row')
                    .last()
                    .within(() => {
                        cy.getByLabelText('Item or activity').type(description);
                        cy.getByLabelText('Amount').type(amount);
                    });
            }

            function deleteLastRow() {
                cy.getAllByText('Delete row', { exact: false })
                    .last()
                    .click();
            }

            addItem('Example item', 9000);
            addItem('Example item over budget', 1050);

            cy.getAllByTestId('budget-total').should('contain', '£10,050');

            cy.getAllByTestId('budget-errors').should(
                'contain',
                'Costs you would like us to fund must be less than £10,000'
            );

            cy.getByLabelText('Tell us the total cost of your project').type(
                9000
            );

            submitStep();

            shouldDisplayErrors([
                'Costs you would like us to fund must be less than £10,000',
                'Total cost must be the same as or higher than the amount you’re asking us to fund'
            ]);

            deleteLastRow();
            deleteLastRow();

            const amounts = new Array(random(3, 10)).fill(null).map(() => {
                return random(100, 1000);
            });

            amounts.forEach((amount, index) => {
                addItem(`Example budget item ${index + 1}`, amount);
            });

            cy.getAllByTestId('budget-total').should(
                'contain',
                `£${sum(amounts).toLocaleString()}`
            );

            cy.getByLabelText('Tell us the total cost of your project')
                .clear()
                .type(random(sum(amounts), 20000));

            submitStep();
        }

        function sectionYourProject() {
            stepProjectDetails();
            stepProjectCountry();
            stepProjectLocation();
            stepYourIdea();
            stepProjectCosts();
        }

        function sectionBeneficiaries() {
            cy.checkA11y();

            cy.getByLabelText(
                'My project is aimed at a specific group of people'
            ).click();

            submitStep();

            const randomBeneficiaryGroups = sampleSize(
                [
                    'People from a particular ethnic background',
                    'People of a particular gender',
                    'People of a particular age',
                    'Disabled people',
                    'Lesbian, gay, or bisexual people'
                ],
                2
            );

            cy.log(`Beneficiary groups: ${randomBeneficiaryGroups.join(', ')}`);

            cy.checkA11y();

            randomBeneficiaryGroups.forEach(label => {
                cy.getByLabelText(label).click();
            });

            submitStep();

            if (
                includes(
                    randomBeneficiaryGroups,
                    'People from a particular ethnic background'
                )
            ) {
                cy.checkA11y();
                cy.getByLabelText('Caribbean').click();
                cy.getByLabelText('African').click();
                submitStep();
            }

            if (
                includes(
                    randomBeneficiaryGroups,
                    'People of a particular gender'
                )
            ) {
                cy.checkA11y();
                cy.getByLabelText('Non-binary').click();
                submitStep();
            }

            if (
                includes(randomBeneficiaryGroups, 'People of a particular age')
            ) {
                cy.checkA11y();
                cy.getByLabelText('25-64').click();
                submitStep();
            }

            if (includes(randomBeneficiaryGroups, 'Disabled people')) {
                cy.checkA11y();
                cy.getByLabelText(
                    'Disabled people with learning or mental difficulties',
                    { exact: false }
                ).click();
                submitStep();
            }

            if (country === 'Wales') {
                cy.getByText(
                    'How many of the people who will benefit from your project speak Welsh?'
                ).should('exist');
                cy.getByLabelText('More than half').click();
                submitStep();
            }

            if (country === 'Northern Ireland') {
                cy.getByText(
                    'Which community do the people who will benefit from your project belong to?'
                ).should('exist');
                cy.getByLabelText('Both Catholic and Protestant').click();
                submitStep();
            }
        }

        function sectionOrganisation(organisationName) {
            cy.checkA11y();

            cy.getByLabelText(
                'What is the full legal name of your organisation?',
                { exact: false }
            ).type(organisationName);

            // Org age question
            const dt = moment().subtract(random(1, 20), 'years');
            cy.getByLabelText('Month').type(dt.month() + 1);
            cy.getByLabelText('Year').type(dt.year());

            cy.getByText(
                'What is the main or registered address of your organisation?'
            )
                .parent()
                .within(() => {
                    fillAddress({
                        streetAddress: '1 Plough Place, Holborn',
                        city: 'London',
                        postcode: 'EC4A 1DE'
                    });
                });

            submitStep();

            cy.checkA11y();

            const randomOrgType = sample([
                'Unregistered voluntary or community organisation',
                'Registered charity (unincorporated)',
                'Charitable incorporated organisation (CIO)',
                'Not-for-profit company',
                'School',
                'College or University',
                'Statutory body',
                'Faith-based group'
            ]);

            cy.log(`Organisation type: ${randomOrgType}`);

            cy.getByLabelText(randomOrgType, {
                exact: false
            }).click();

            submitStep();

            cy.checkA11y();

            // @TODO: Should we further randomise the sub-types?
            if (randomOrgType === 'Statutory body') {
                cy.getByLabelText('Parish Council', {
                    exact: false
                }).click();
                submitStep();
            }

            cy.queryByLabelText('Companies House number', {
                exact: false,
                timeout: 1000
            }).then(el => {
                if (el) {
                    const randomCompanyNumber = random(10000, 99999999)
                        .toString()
                        .padStart(8, '0');
                    cy.wrap(el).type(randomCompanyNumber);
                }
            });

            cy.queryByLabelText('Charity registration number', {
                exact: false,
                timeout: 1000
            }).then(el => {
                if (el) {
                    const randomCharityNumber = random(10000, 9999999)
                        .toString()
                        .padStart(7, '0');
                    cy.wrap(el).type(randomCharityNumber);
                }
            });

            cy.queryByLabelText('Department for Education number', {
                exact: false,
                timeout: 1000
            }).then(el => {
                if (el) {
                    const randomEducationNumber = random(10000, 999999)
                        .toString()
                        .padStart(6, '0');
                    cy.wrap(el).type(randomEducationNumber);
                }
            });

            submitStep();

            // Optional accounting year end step
            cy.queryByText('What is your accounting year end date?', {
                exact: false,
                timeout: 1000
            }).then(el => {
                if (el) {
                    cy.checkA11y();
                    cy.getByLabelText('Day').type(random(1, 28).toString());
                    cy.getByLabelText('Month').type(random(1, 12).toString());
                    cy.getByLabelText(
                        'What is your total income for the year?',
                        {
                            exact: false
                        }
                    ).type(random(25000, 150000));

                    submitStep();
                }
            });
        }

        function fillDateOfBirth(dateOfBirth) {
            cy.queryByText('Date of birth', { timeout: 1000 }).then(el => {
                if (el) {
                    cy.getByLabelText('Day').type(dateOfBirth.date());
                    cy.getByLabelText('Month').type(dateOfBirth.month() + 1);
                    cy.getByLabelText('Year').type(dateOfBirth.year());
                }
            });
        }

        function fillHomeAddress(address) {
            cy.queryByText('Home address', { timeout: 1000 }).then(el => {
                if (el) {
                    cy.wrap(el)
                        .parent()
                        .within(() => {
                            fillAddress(address);
                        });
                }
            });

            cy.queryByText(
                'Have they lived at this address for the last three years?',
                { timeout: 1000 }
            ).then(el => {
                if (el) {
                    cy.wrap(el)
                        .parent()
                        .within(() => {
                            cy.getByLabelText('No').click();
                        });

                    cy.getByText('Previous home address')
                        .parent()
                        .within(() => {
                            fillAddress({
                                streetAddress: `Apex house, Edgbaston`,
                                city: 'Birmingham',
                                postcode: 'B15 1TR'
                            });
                        });
                }
            });
        }

        function fillContact(contact) {
            cy.getByLabelText('First name').type(contact.firstName);

            cy.getByLabelText('Last name').type(contact.lastName);

            cy.queryByText('I confirm that the main and senior contacts', {
                exact: false,
                timeout: 500
            }).then(el => {
                if (el) {
                    cy.wrap(el)
                        .parent()
                        .within(() => {
                            cy.getByLabelText('Yes').click();
                        });
                }
            });

            fillDateOfBirth(contact.dateOfBirth);

            cy.queryByText(
                'Have they lived at their home address for the last three years?',
                {
                    exact: false,
                    timeout: 500
                }
            ).then(el => {
                if (el) {
                    cy.wrap(el)
                        .parent()
                        .within(() => {
                            cy.getByLabelText('Yes').click();
                        });
                }
            });

            fillHomeAddress(contact.address);

            cy.getByLabelText('Email').type(
                contact.email || faker.internet.exampleEmail()
            );

            cy.getByLabelText('Telephone number').type(contact.phone);

            cy.getByLabelText(
                'tell us about any particular communication needs',
                { exact: false }
            ).type('Example communication need');
        }

        function sectionSeniorContact(contact) {
            cy.checkA11y();
            cy.get('label[for="field-seniorContactRole-1"]').click();
            fillContact(contact);
            submitStep();
        }

        function sectionMainContact(contact) {
            cy.checkA11y();
            fillContact(contact);
            submitStep();
        }

        function sectionBankDetails(organisationName) {
            cy.checkA11y();

            cy.getByLabelText('Tell us the name of your organisation', {
                exact: false
            }).type(organisationName);

            cy.getByLabelText('Account number', { exact: false }).type(
                '25337846'
            );

            cy.getByLabelText('Sort code', { exact: false }).type('308087');

            submitStep();

            cy.checkA11y();

            cy.fixture('example.pdf', 'base64').then(fileContent => {
                cy.getByLabelText('Upload a bank statement', {
                    exact: false
                }).upload(
                    {
                        fileContent,
                        fileName: 'example.pdf',
                        mimeType: 'application/pdf',
                        encoding: 'base64'
                    },
                    { subjectType: 'input' }
                );
            });

            submitStep();
        }

        function sectionTermsAndConditions() {
            cy.checkA11y();

            cy.getAllByLabelText('I agree').each($el => {
                cy.wrap($el).click();
            });

            cy.getByLabelText('Full name of person completing this form', {
                exact: false
            }).type(faker.name.findName());

            cy.getByLabelText('Position in organisation', {
                exact: false
            }).type('CEO');

            submitStep();
        }

        function submitApplication() {
            cy.getAllByText('Submit application')
                .first()
                .click();

            cy.get('h1').should(
                'contain',
                'Your application has been submitted. Good luck!'
            );
        }

        cy.seedAndLogin().then(() => {
            cy.visit('/apply/awards-for-all');

            cy.get('.cookie-consent button').click();
            startApplication();

            const organisationName = faker.company.companyName();

            sectionYourProject();
            sectionBeneficiaries();
            sectionOrganisation(organisationName);

            sectionSeniorContact({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                email: Cypress.env('afa_senior_contact_email'),
                phone: '0345 4 10 20 30',
                dateOfBirth: moment().subtract(random(18, 90), 'years'),
                address: {
                    streetAddress: `The Bar, 2 St James' Blvd`,
                    city: 'Newcastle',
                    postcode: 'NE4 7JH'
                }
            });

            sectionMainContact({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                email: Cypress.env('afa_main_contact_email'),
                phone: '020 7211 1888',
                dateOfBirth: moment().subtract(random(18, 90), 'years'),
                address: {
                    streetAddress: 'Pacific House, 70 Wellington St',
                    city: 'Glasgow',
                    postcode: 'G2 6UA'
                }
            });

            sectionBankDetails(organisationName);
            sectionTermsAndConditions();

            cy.checkA11y();
            cy.get('h1').should('contain', 'Summary');

            submitApplication();
        });
    });
});
