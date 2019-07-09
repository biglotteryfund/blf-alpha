// @ts-nocheck
const uuid = require('uuid/v4');
const faker = require('faker');
const { includes, sample, sampleSize, times } = require('lodash');
const moment = require('moment');

describe('common', function() {
    it('should have common headers', () => {
        cy.request('/').then(response => {
            expect(response.headers['cache-control']).to.eq(
                'max-age=30,s-maxage=300'
            );

            expect(response.headers['content-security-policy']).to.contain(
                "default-src 'self'"
            );
        });

        cy.request('/apply/your-idea/1').then(response => {
            expect(response.headers['cache-control']).to.eq(
                'no-store,no-cache,max-age=0'
            );
        });
    });

    it('should 404 unknown routes', () => {
        cy.request({
            url: '/not-a-page',
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.include('Error 404');
        });
    });

    it('should redirect search queries to a google site search', () => {
        cy.checkRedirect({
            from: '/search?q=This is my search query',
            to:
                'https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+This%20is%20my%20search%20query',
            isRelative: false,
            status: 302
        });
    });

    it('should redirect archived pages to the national archives', () => {
        const urlPath =
            '/funding/funding-guidance/applying-for-funding/aims-and-outcomes';
        cy.request(urlPath).then(response => {
            expect(response.body).to.include(
                `http://webarchive.nationalarchives.gov.uk/20171011152352/https://www.biglotteryfund.org.uk${urlPath}`
            );
        });
    });

    it('should redirect legacy funding programmes', () => {
        const sampleRedirect = sample([
            {
                originalPath:
                    '/global-content/programmes/england/acitve-england',
                redirectedPath: '/funding/programmes/acitve-england'
            },
            {
                originalPath:
                    '/global-content/programmes/uk-wide/green-spaces-and-sustainable-communities',
                redirectedPath:
                    '/funding/programmes/green-spaces-and-sustainable-communities'
            },
            {
                originalPath:
                    '/global-content/programmes/northern-ireland/young-peoples-fund-change-ur-future',
                redirectedPath:
                    '/funding/programmes/young-peoples-fund-change-ur-future'
            },
            {
                originalPath:
                    '/welsh/global-content/programmes/wales/young-peoples-fund-bridging-the-gap',
                redirectedPath:
                    '/welsh/funding/programmes/young-peoples-fund-bridging-the-gap'
            }
        ]);

        cy.checkRedirect({
            from: sampleRedirect.originalPath,
            to: sampleRedirect.redirectedPath
        });
    });

    it('should protect access to staff-only tools', () => {
        cy.checkRedirect({
            from:
                '/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            to:
                '/user/staff/login?redirectUrl=/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            status: 302
        });

        cy.checkRedirect({
            from: '/tools/survey-results',
            to: '/user/staff/login?redirectUrl=/tools/survey-results',
            status: 302
        });
    });

    it('should allow survey API responses', () => {
        const dataYes = {
            choice: 'yes',
            path: '/'
        };

        cy.request('POST', '/api/survey', dataYes).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.choice).to.equal(dataYes.choice);
            expect(response.body.result.path).to.equal(dataYes.path);
        });

        const dataNo = {
            choice: 'no',
            path: '/',
            message: 'this is an example message'
        };

        cy.request('POST', '/api/survey', dataNo).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.choice).to.equal(dataNo.choice);
            expect(response.body.result.path).to.equal(dataNo.path);
            expect(response.body.result.message).to.equal(dataNo.message);
        });
    });

    it('should allow feedback API responses', () => {
        const data = {
            description: 'example',
            message: 'this is an example message'
        };

        cy.request('POST', '/api/feedback', data).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.description).to.equal(data.description);
            expect(response.body.result.message).to.equal(data.message);
        });
    });

    it('should check top-level pages', function() {
        cy.visit('/');
        cy.checkA11y();
        cy.percySnapshot('homepage');

        function interactWithMobileNav() {
            cy.viewport(375, 667);

            cy.get('.js-toggle-nav').as('navToggle');
            cy.get('#global-nav').as('nav');
            cy.get('.js-toggle-search').as('searchToggle');
            cy.get('#global-search').as('search');

            cy.get('@nav').should('not.be.visible');
            cy.get('@search').should('not.be.visible');

            // Toggle search
            cy.get('@searchToggle').click();
            cy.get('@nav').should('not.be.visible');
            cy.get('@search').should('be.visible');
            // Check search input for focus
            cy.focused().should('have.attr', 'name', 'q');

            // Toggle mobile navigation
            cy.get('@navToggle').click();
            cy.get('@nav').should('be.visible');
            cy.get('@search').should('not.be.visible');
        }

        interactWithMobileNav();

        cy.visit('/welsh');
        cy.checkA11y();
        cy.percySnapshot('homepage-welsh');

        cy.visit('/about');
        cy.checkA11y();

        cy.visit('/funding');
        cy.checkA11y();

        cy.visit('/insights');
        cy.checkA11y();

        cy.visit('/news');
        cy.checkA11y();
    });

    it('should check patterns for visual regressions', function() {
        cy.visit('/patterns/components');
        cy.percySnapshot('patterns');
    });
});

describe('user', () => {
    function logIn(username, password) {
        cy.getByLabelText('Email address')
            .clear()
            .type(username, { delay: 0 });
        cy.getByLabelText('Password')
            .clear()
            .type(password, { delay: 0 });
        cy.get('.form-actions').within(() => {
            cy.getByText('Log in').click();
        });
    }

    it('should not allow unknown users to login', () => {
        cy.visit('/user/login');
        logIn('not_a_real_account@example.com', 'examplepassword');
        cy.getByTestId('form-errors').should(
            'contain',
            'Your username and password combination is invalid'
        );
        cy.checkA11y();
    });

    function createAccount(username, password) {
        cy.getByLabelText('Email address')
            .clear()
            .type(username, { delay: 0 });
        cy.getByLabelText('Password')
            .clear()
            .type(password, { delay: 0 });
        cy.getByLabelText('Password confirmation', { exact: false })
            .clear()
            .type(password, { delay: 0 });
        cy.get('.form-actions').within(() => {
            cy.getByText('Create an account').click();
        });
    }

    it('should prevent registrations with invalid passwords', () => {
        const username = `${Date.now()}@example.com`;

        cy.visit('/user/register');

        createAccount(username, 'tooshort');
        cy.getByTestId('form-errors').should(
            'contain',
            'Password must be at least 10 characters long'
        );

        createAccount(username, username);
        cy.getByTestId('form-errors').should(
            'contain',
            'password could be too common, or is the same as your username'
        );

        createAccount(username, '5555555555');
        cy.getByTestId('form-errors').should(
            'contain',
            'password could be too common, or is the same as your username'
        );
    });

    it('should be able to register, log in, and reset password', () => {
        const password = uuid();
        const username = `${Date.now()}@example.com`;

        // Register
        cy.visit('/user/register');
        createAccount(username, password);
        cy.checkA11y();
        cy.getByText('Your account').should('be.visible');

        // Log out
        cy.getByText('Log out').click();

        // Attempt to log in with new user with an incorrect password and then correct it
        logIn(username, 'invalidpassword');

        cy.getByTestId('form-errors').should(
            'contain',
            'username and password combination is invalid'
        );

        logIn(username, password);
        cy.getByText('Your account').should('be.visible');
    });

    it('should email valid users with a token', () => {
        const now = Date.now();
        const username = `${now}@example.com`;
        cy.registerUser({
            username: username,
            password: `password${now}`,
            returnToken: true
        }).then(res => {
            // via https://github.com/auth0/node-jsonwebtoken/issues/162
            expect(res.body.token).to.match(
                /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/
            );
            expect(res.body.mailParams.sendTo).to.equal(username);
            expect(res.body.mailParams.subject).to.equal(
                'Activate your The National Lottery Community Fund website account'
            );
        });
    });
});

describe('awards for all', function() {
    it('should submit full awards for all application', () => {
        const randomCountry = faker.random.arrayElement([
            'Scotland'
            // 'England',
            // 'Northern Ireland',
            // 'Wales'
        ]);

        cy.log(`Country: ${randomCountry}`);

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
            cy.getByLabelText(randomCountry).click();
            submitStep();
        }

        function stepProjectLocation() {
            let locationOption;
            switch (randomCountry) {
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

            cy.getByLabelText('What would you like to do?', { exact: false })
                .invoke('val', faker.lorem.words(150))
                .trigger('change');

            cy.getByLabelText(
                'How does your project meet at least one of our funding priorities?',
                { exact: false }
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
            cy.checkA11y();

            cy.getByLabelText('Tell us the total cost of your project').type(
                '10000'
            );

            submitStep();

            shouldDisplayErrors([
                'Project costs must be less than £10,000',
                'Total cost must be the same as or higher than the amount you’re asking us to fund'
            ]);
            cy.checkA11y();

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

            if (randomCountry === 'Wales') {
                cy.getByText(
                    'How many of the people who will benefit from your project speak Welsh?'
                ).should('exist');
                cy.getByLabelText('More than half').click();
                submitStep();
            }

            if (randomCountry === 'Northern Ireland') {
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
        cy.get('.cookie-consent button').click();
        cy.checkA11y();
        cy.percySnapshot('funding-programme');

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

describe('reaching communities', function() {
    it('should allow applications for reaching communities', () => {
        function fillIdea() {
            cy.getByLabelText(
                'Briefly explain your idea and why it’ll make a difference',
                { exact: false }
            )
                .invoke('val', faker.lorem.paragraphs(3))
                .trigger('change');
        }

        function fillLocation() {
            cy.checkA11y();
            cy.getByLabelText('North East & Cumbria', { exact: false }).check();
            cy.getByLabelText('Yorkshire and the Humber', {
                exact: false
            }).check();
            cy.getByLabelText('Project location', { exact: false }).type(
                'Example',
                { delay: 0 }
            );
        }

        function fillOrganisation() {
            cy.getByLabelText('Legal name', { exact: false }).type(
                'Test Organisation',
                { delay: 0 }
            );
        }

        function fillYourDetails() {
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName(),
                { delay: 0 }
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName(),
                { delay: 0 }
            );
            cy.getByLabelText('Email address', { exact: false }).type(
                faker.internet.exampleEmail(),
                { delay: 0 }
            );
            cy.getByLabelText('Phone number', { exact: false }).type(
                '0123456789',
                { delay: 0 }
            );
        }

        function interactWithAnswerToggle() {
            cy.get('.js-toggle-answer button').click();
            cy.get('.js-toggle-answer').should('have.class', 'is-active');
            cy.get('.js-toggle-answer button').should('contain', 'Show less');
            cy.get('.js-toggle-answer button').click();
        }

        function interactWithInlineFeedback() {
            cy.get('#js-feedback textarea').type('Test feedback');
            cy.get('#js-feedback form').submit();
            cy.get('#js-feedback').should('contain', 'Thank you for sharing');
        }

        cy.visit('/apply/your-idea');
        cy.getByText('Start').click();

        fillIdea();
        cy.getByText('Next').click();

        fillLocation();
        cy.getByText('Next').click();

        fillOrganisation();
        cy.getByText('Next').click();

        fillYourDetails();
        cy.getByText('Next').click();

        interactWithAnswerToggle();

        cy.getByText('Submit').click();

        cy.get('h1').should('contain', 'Thank you for submitting your idea');
        cy.checkA11y();

        interactWithInlineFeedback();
    });
});

describe('free materials', function() {
    it('should submit materials order', () => {
        cy.visit(
            '/funding/funding-guidance/managing-your-funding/ordering-free-materials'
        );
        cy.get('a[href="#monolingual"]').click();

        // Select items
        cy.get('#qa-material-monolingual-2').as('materialA');
        cy.get('#qa-material-monolingual-3').as('materialB');

        cy.get('@materialA')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialA')
            .find('.step-control__quantity')
            .should('contain', 1);

        cy.get('@materialA')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialA')
            .find('.step-control__quantity')
            .should('contain', 2);

        cy.get('@materialB')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialB')
            .find('.step-control__quantity')
            .should('contain', 1);

        // Fill in form
        cy.get('#ff-yourName').type('Example', { delay: 0 });
        cy.get('#ff-yourEmail').type('example@example.com', { delay: 0 });
        cy.get('#ff-yourAddress1').type('1 Example Street', { delay: 0 });
        cy.get('#ff-yourTown').type('Fake town', { delay: 0 });
        cy.get('#ff-yourCountry').type('England', { delay: 0 });
        cy.get('#ff-yourPostcode').type('EC4A 1DE', { delay: 0 });
        cy.get('#ff-radio-yourReason-projectOpening').check();
        cy.get('#js-submit-material-order').click();

        // Confirm submission
        cy.get('h2').should('contain', 'Thank you for your order');
    });
});

describe('past grants', function() {
    it('should be able to browse grants search results', () => {
        cy.visit('/funding/grants');
        cy.get('.cookie-consent button').click();
        cy.get('.qa-grant-result').should('have.length', 50);
        cy.percySnapshot('grants-search');

        // Search query
        const testQuery = 'cake';
        const textQueryCount = 78;

        cy.get('#js-past-grants')
            .find('#search-query')
            .type(testQuery)
            .type('{enter}');
        cy.get('.active-filter').should('contain', testQuery);
        cy.get('.qa-grant-result').should('have.length', 50);

        // Use filters
        cy.get('#field-dynamic-amount-1').click();
        cy.get('.qa-grant-result').should('have.length', 6);

        // Clear filters
        cy.get('.search-filters__clear-all').click();
        cy.get('.qa-grant-result').should('have.length', 50);

        // Test pagination
        cy.get('.split-nav__next').click();
        cy.get('.qa-grant-result').should('have.length', textQueryCount - 50);
    });
});
