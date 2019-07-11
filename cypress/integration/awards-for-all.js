const faker = require('faker');
const includes = require('lodash/includes');
const sampleSize = require('lodash/sampleSize');
const times = require('lodash/times');
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

        function fillAllDateFields(momentInstance) {
            ['Start date', 'End date'].forEach(dateFieldName => {
                cy.getByText(dateFieldName)
                    .parent()
                    .within(() => {
                        fillDateParts(momentInstance);
                    });
            });
        }

        function fillAddress() {
            cy.getByText('Enter address manually').click();
            cy.getByLabelText('Building and street', { exact: false }).type(
                faker.address.streetAddress()
            );
            cy.getByLabelText('Town or city', { exact: false }).type(
                faker.address.city()
            );
            cy.getByLabelText('County', { exact: false }).type(
                faker.address.county()
            );
            cy.getByLabelText('Postcode', { exact: true }).type('B15 1TR');
        }

        function stepProjectDetails() {
            cy.checkA11y();
            cy.getByLabelText('What is the name of your project?', {
                exact: false
            }).type('My application');

            const invalidDate = moment();
            fillAllDateFields(invalidDate);

            submitStep();

            shouldDisplayErrors(['Date you start the project must be after']);
            cy.checkA11y();

            const validDate = moment().add('12', 'weeks');
            fillAllDateFields(validDate);

            submitStep();
        }

        function stepProjectCountry() {
            cy.getByLabelText(country).click();
            submitStep();
        }

        function stepProjectLocation() {
            let locationOption;
            switch (country) {
                case 'Northern Ireland':
                    locationOption = 'Derry and Strabane';
                    break;
                case 'Scotland':
                    locationOption = 'Perth & Kinross';
                    break;
                case 'Wales':
                    locationOption = 'Caerphilly';
                    break;
                default:
                    locationOption = 'Bath and North East Somerset';
                    break;
            }

            cy.getByLabelText('Where will your project take place?').select(
                locationOption
            );

            cy.getByLabelText(
                'Tell us the towns, villages or wards where your beneficiaries live'
            ).type(faker.lorem.sentence());

            cy.getByLabelText('What is the postcode', { exact: false }).type(
                'B15 1TR'
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
                .invoke('val', faker.lorem.words(200))
                .trigger('change');

            submitStep();
        }

        function stepProjectCosts() {
            const amounts = [250, 1000, 2500, 5000, 2500];
            amounts.forEach(amount => {
                cy.getAllByTestId('budget-row')
                    .last()
                    .within(() => {
                        cy.getByLabelText('Item or activity').type(
                            faker.lorem.words(5)
                        );
                        cy.getByLabelText('Amount').type(amount);
                    });
            });

            cy.getAllByTestId('budget-errors').should(
                'contain',
                'Project costs must be less than £10,000'
            );

            cy.getAllByTestId('budget-total').should('contain', '£11,250');
            // @TODO: Review contrast ratio of delete buttons
            cy.checkA11y({
                options: { rules: { 'color-contrast': { enabled: false } } }
            });

            cy.getByLabelText('Tell us the total cost of your project').type(
                '10000'
            );

            submitStep();

            shouldDisplayErrors([
                'Project costs must be less than £10,000',
                'Total cost must be the same as or higher than the amount you’re asking us to fund'
            ]);
            // @TODO: Review contrast ratio of delete buttons
            cy.checkA11y({
                options: { rules: { 'color-contrast': { enabled: false } } }
            });

            cy.getAllByText('Delete row', { exact: false })
                .last()
                .click();

            // @TODO: Why does this need to be clicked twice?
            cy.getAllByText('Delete row', { exact: false })
                .last()
                .click();

            cy.getAllByTestId('budget-total').should('contain', '£8,750');

            submitStep();
        }

        function stepBeneficiaries() {
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

        function stepOrganisationDetails() {
            cy.checkA11y();
            cy.getByLabelText(
                'What is the full legal name of your organisation?',
                { exact: false }
            ).type(faker.company.companyName());

            // Org age question
            cy.getByLabelText('Month').type(9);
            cy.getByLabelText('Year').type(1986);

            cy.getByText(
                'What is the main or registered address of your organisation?'
            )
                .parent()
                .within(() => {
                    fillAddress();
                });
            submitStep();
        }

        function stepOrganisationType() {
            cy.checkA11y();
            cy.getByLabelText('Registered charity (unincorporated)', {
                exact: false
            }).click();
            submitStep();
        }

        function stepRegistrationNumbers() {
            cy.checkA11y();
            cy.getByLabelText('Charity registration number', {
                exact: false
            }).type(12345678);
            submitStep();
        }

        function stepOrganisationFinances() {
            cy.checkA11y();
            cy.getByLabelText('Day').type(31);
            cy.getByLabelText('Month').type(3);
            cy.getByLabelText('What is your total income for the year?', {
                exact: false
            }).type('150000');
            submitStep();
        }

        function stepMainContact() {
            cy.checkA11y();
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName()
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName()
            );
            cy.getByLabelText('Day').type('5');
            cy.getByLabelText('Month').type('11');
            cy.getByLabelText('Year').type('1926');
            cy.getByText('Home address')
                .parent()
                .within(() => {
                    fillAddress();
                });
            cy.getByLabelText('Yes').click();
            cy.getByLabelText('Email', { exact: false }).type(
                faker.internet.exampleEmail()
            );
            cy.getByLabelText('Telephone number', { exact: false }).type(
                faker.phone.phoneNumber()
            );
            submitStep();
        }

        function stepSeniorContact() {
            cy.checkA11y();
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName()
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName()
            );
            cy.getByLabelText('Trustee').click();
            cy.getByLabelText('Day').type('5');
            cy.getByLabelText('Month').type('11');
            cy.getByLabelText('Year').type('1926');
            cy.getByText('Home address')
                .parent()
                .within(() => {
                    fillAddress();
                });
            cy.getByLabelText('Yes').click();
            cy.getByLabelText('Email', { exact: false }).type(
                faker.internet.exampleEmail()
            );
            cy.getByLabelText('Telephone number', { exact: false }).type(
                faker.phone.phoneNumber()
            );
            submitStep();
        }

        function stepBankDetails() {
            cy.checkA11y();
            cy.getByLabelText(
                'Tell us the name of your organisation - as it appears on the bank statement',
                {
                    exact: false
                }
            ).type(faker.company.companyName());
            cy.getByLabelText('Account number', { exact: false }).type(
                '25337846'
            );
            cy.getByLabelText('Sort code', { exact: false }).type('308087');
            submitStep();
        }

        function stepBankStatement() {
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

        function stepTermsAndConditions() {
            cy.checkA11y();
            cy.getAllByLabelText('I agree').each($el => {
                cy.wrap($el).click();
            });

            cy.getByLabelText('Full name of person completing this form', {
                exact: false
            }).type(faker.name.findName());
            cy.getByLabelText('Position in organisation', {
                exact: false
            }).type(faker.name.jobDescriptor());
            submitStep();
        }

        cy.visit(
            '/funding/programmes/national-lottery-awards-for-all-scotland'
        );
        cy.percySnapshot('awards-for-all');
        cy.get('.cookie-consent button').click();

        function interactWithTabs() {
            cy.get('.js-tabset .js-tab').each($el => {
                cy.wrap($el)
                    .click()
                    .should('have.class', 'is-active');

                // Check there is only one tab active
                cy.get('.js-tabset .is-active').should('have.length', 1);

                // Check tab content is visible
                cy.get($el.attr('href')).should('be.visible');
            });
        }

        interactWithTabs();

        cy.seedAndLogin().then(() => {
            cy.visit('/apply/awards-for-all');

            cy.getByText('Start new application').click();
            times(5, function() {
                cy.getByLabelText('Yes').click();
                cy.getByText('Continue').click();
            });
            cy.getByText('Start your application').click();

            stepProjectDetails();
            stepProjectCountry();
            stepProjectLocation();
            stepYourIdea();
            stepProjectCosts();
            stepBeneficiaries();
            stepOrganisationDetails();
            stepOrganisationType();
            stepRegistrationNumbers();
            stepOrganisationFinances();
            stepSeniorContact();
            stepMainContact();
            stepBankDetails();
            stepBankStatement();
            stepTermsAndConditions();

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
