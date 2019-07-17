const faker = require('faker');
const includes = require('lodash/includes');
const random = require('lodash/random');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const sum = require('lodash/sum');
const moment = require('moment');

describe('awards for all', function() {
    it('should submit full awards for all application', () => {
        const country = 'Scotland';

        cy.log(`Country: ${country}`);

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

            cy.getByText(`I'm done editing`).click();
        }

        function stepProjectDetails() {
            cy.checkA11y();

            cy.getByLabelText('What is the name of your project?', {
                exact: false
            }).type('Test application');

            const startDate = moment().add(random(12, 20), 'weeks');
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
            let locationOption;
            let locationPostcode;
            switch (country) {
                case 'Northern Ireland':
                    locationOption = 'Derry and Strabane';
                    locationPostcode = 'BT82 8AE';
                    break;
                case 'Scotland':
                    locationOption = 'Perth & Kinross';
                    locationPostcode = 'PH1 1DA';
                    break;
                case 'Wales':
                    locationOption = 'Caerphilly';
                    locationPostcode = 'CF83 1AP';
                    break;
                default:
                    locationOption = 'Bath and North East Somerset';
                    locationPostcode = 'BA1 0DH';
                    break;
            }

            cy.getByLabelText('Where will your project take place?').select(
                locationOption
            );

            cy.getByLabelText(
                'Tell us the towns, villages or wards where your beneficiaries live'
            ).type(`Example location description for ${locationOption}`);

            cy.getByLabelText('What is the postcode', { exact: false }).type(
                locationPostcode
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
                'Project costs must be less than £10,000'
            );

            cy.getByLabelText('Tell us the total cost of your project').type(
                '9000'
            );

            submitStep();

            shouldDisplayErrors([
                'Project costs must be less than £10,000',
                'Total cost must be the same as or higher than the amount you’re asking us to fund'
            ]);

            // @TODO: Why does this need to be clicked once more than needed?
            deleteLastRow();
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
                el && cy.wrap(el).type('12345678');
            });

            cy.queryByLabelText('Charity registration number', {
                exact: false,
                timeout: 1000
            }).then(el => {
                el && cy.wrap(el).type('23456789');
            });

            cy.queryByLabelText('Department for Education number', {
                exact: false,
                timeout: 1000
            }).then(el => {
                el && cy.wrap(el).type('34567890');
            });

            submitStep();

            // Optional accounting year end step
            cy.queryByText('What is your accounting year end date?', {
                exact: false,
                timeout: 1000
            }).then(el => {
                if (el) {
                    cy.checkA11y();
                    cy.getByLabelText('Day').type(31);
                    cy.getByLabelText('Month').type(3);
                    cy.getByLabelText(
                        'What is your total income for the year?',
                        {
                            exact: false
                        }
                    ).type('150000');

                    submitStep();
                }
            });
        }

        function fillDateOfBirth(minAge) {
            cy.queryByText('Date of birth', { timeout: 1000 }).then(el => {
                if (el) {
                    const randomDob = moment().subtract(
                        random(minAge, 80),
                        'years'
                    );
                    cy.getByLabelText('Day').type(randomDob.date());
                    cy.getByLabelText('Month').type(randomDob.month() + 1);
                    cy.getByLabelText('Year').type(randomDob.year());
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

        function sectionSeniorContact() {
            cy.checkA11y();
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName()
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName()
            );

            cy.get('label[for="field-seniorContactRole-1"]').click();

            fillDateOfBirth(16);
            fillHomeAddress({
                streetAddress: 'Pacific House, 70 Wellington St',
                city: 'Glasgow',
                postcode: 'G2 6UA'
            });

            cy.getByLabelText('Email', { exact: false }).type(
                faker.internet.exampleEmail()
            );

            cy.getByLabelText('Telephone number', { exact: false }).type(
                faker.phone.phoneNumber()
            );
            submitStep();
        }

        function sectionMainContact() {
            cy.checkA11y();
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName()
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName()
            );

            fillDateOfBirth(16);
            fillHomeAddress({
                streetAddress: `The Bar, 2 St James' Blvd`,
                city: 'Newcastle',
                postcode: 'NE4 7JH'
            });

            cy.getByLabelText('Email', { exact: false }).type(
                faker.internet.exampleEmail()
            );
            cy.getByLabelText('Telephone number', { exact: false }).type(
                faker.phone.phoneNumber()
            );
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
                        mimeType: 'application/pdf'
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

        // cy.visit(
        //     '/funding/programmes/national-lottery-awards-for-all-scotland'
        // );
        // cy.percySnapshot('awards-for-all');
        // cy.get('.cookie-consent button').click();
        //
        // function interactWithTabs() {
        //     cy.get('.js-tabset .js-tab').each($el => {
        //         cy.wrap($el)
        //             .click()
        //             .should('have.class', 'is-active');
        //
        //         // Check there is only one tab active
        //         cy.get('.js-tabset .is-active').should('have.length', 1);
        //
        //         // Check tab content is visible
        //         cy.get($el.attr('href')).should('be.visible');
        //     });
        // }
        //
        // interactWithTabs();

        cy.seedAndLogin().then(() => {
            cy.visit('/apply/awards-for-all/new');

            // cy.visit('/apply/awards-for-all');
            //
            // cy.getByText('Start new application').click();
            // times(5, function() {
            //     cy.getByLabelText('Yes').click();
            //     cy.getByText('Continue').click();
            // });
            // cy.getByText('Start your application').click();

            const organisationName = faker.company.companyName();

            sectionYourProject();
            sectionBeneficiaries();
            sectionOrganisation(organisationName);

            sectionSeniorContact();
            sectionMainContact();
            sectionBankDetails(organisationName);
            sectionTermsAndConditions();

            cy.checkA11y();
            cy.get('h1').should('contain', 'Summary');
            cy.getAllByText('Submit application')
                .first()
                .click();

            cy.get('h1').should(
                'contain',
                'Your application has been submitted. Good luck!'
            );
        });
    });
});
