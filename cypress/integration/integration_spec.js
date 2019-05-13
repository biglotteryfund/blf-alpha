// @ts-nocheck
const uuid = require('uuid/v4');
const faker = require('faker');
const sample = require('lodash/sample');

describe('common', function() {
    it('should have common headers', () => {
        cy.request('/').then(response => {
            expect(response.headers['cache-control']).to.eq(
                'max-age=30,s-maxage=300'
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

    it('should check top-level pages for a11y violations', function() {
        cy.visit('/');
        cy.checkA11y();
        cy.percySnapshot('homepage');

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

describe('interactions', () => {
    it('should perform common interactions', () => {
        cy.visit('/funding/programmes/national-lottery-awards-for-all-england');
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

        interactWithTabs();
        interactWithMobileNav();
    });
});

describe('user', () => {
    function submitForm(username, password) {
        cy.getByLabelText('Email address', { exact: false })
            .clear()
            .type(username, { delay: 0 });
        cy.getByLabelText('Password', { exact: false })
            .clear()
            .type(password, { delay: 0 });
        cy.get('.form-actions input[type="submit"]').click();
    }

    it('should not allow unknown users to login', () => {
        cy.visit('/user/login');
        submitForm('person@example.com', 'examplepassword');
        cy.getByText(
            'Your username and password combination is invalid'
        ).should('exist');
        cy.checkA11y();
    });

    it('should prevent registrations with invalid passwords', () => {
        cy.visit('/user/register');
        submitForm('person@example.com', 'tooshort');
        cy.getByText('Password must be at least 10 characters long').should(
            'exist'
        );
    });

    it('should be able to register, log in, and reset password', () => {
        const password = uuid();
        const username = `${Date.now()}@example.com`;

        // Register
        cy.visit('/user/register');
        submitForm(username, password);
        cy.checkA11y();
        cy.getByText('Your account').should('be.visible');

        // Log out
        cy.getByTestId('logout-button').click();

        // Attempt to log in with new user with an incorrect password and then correct it
        submitForm(username, 'invalidpassword');
        cy.getByText(
            'Your username and password combination is invalid'
        ).should('exist');
        submitForm(username, password);
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
        function fillAddress() {
            cy.getByLabelText('Building and street', { exact: false }).type(
                faker.address.streetAddress()
            );
            cy.getByLabelText('Town or city', { exact: false }).type(
                faker.address.city()
            );
            cy.getByLabelText('County', { exact: false }).type(
                faker.address.county()
            );
            cy.getByLabelText('Postcode', { exact: false }).type('B15 1TR');
        }

        function fillProjectDetails() {
            cy.checkA11y();
            cy.getByLabelText('What is the name of your project?', {
                exact: false
            }).type('My application');
            cy.getByLabelText('England').click();
            cy.getByLabelText('Day').type('12');
            cy.getByLabelText('Month').type('12');
            cy.getByLabelText('Year').type('2020');
            cy.getByLabelText('What is the postcode', { exact: false }).type(
                'B15 1TR'
            );
            cy.checkA11y();
        }

        function fillYourIdea() {
            cy.checkA11y();

            cy.getByLabelText('What would you like to do?', { exact: false })
                .invoke('val', faker.lorem.paragraphs(5))
                .trigger('change');

            cy.checkA11y();

            cy.getByLabelText(
                'How does your project meet at least one of our funding priorities?',
                {
                    exact: false
                }
            )
                .invoke('val', faker.lorem.words(100))
                .trigger('change');

            cy.getByLabelText('How does your project involve your community?', {
                exact: false
            })
                .invoke('val', faker.lorem.words(200))
                .trigger('change');
        }

        function fillProjectCosts() {
            cy.getByTestId('budget-row').within(() => {
                cy.getByLabelText('Item or activity').type(
                    'Example budget item'
                );
                cy.getByLabelText('Amount').type('1200');
            });
            cy.getAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.getByLabelText('Item or activity').type(
                        'Example budget item 2'
                    );
                    cy.getByLabelText('Amount').type('1200');
                });
            cy.getAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.getByLabelText('Item or activity').type(
                        'Example budget item 3'
                    );
                    cy.getByLabelText('Amount').type('500');
                });
            cy.getAllByTestId('budget-row').should('have.length', 4);
            cy.getAllByTestId('budget-total').should('contain', '£2,900');
            cy.checkA11y();
            cy.getAllByText('Delete row', { exact: false })
                .last()
                .click();
            cy.getAllByTestId('budget-total').should('contain', '£2,400');
            cy.getAllByTestId('budget-row').should('have.length', 3);

            cy.getByLabelText('Tell us the total cost of your project', {
                exact: false
            }).type('5000');
        }

        function fillBeneficiaryNumbers() {
            cy.checkA11y();
            cy.getByLabelText(
                'How many people will benefit from your project?'
            ).type(faker.random.number({ min: 1, max: 100000 }));
        }

        function fillBeneficiaryLocationCheck() {
            cy.checkA11y();
            cy.getByLabelText('Yes').click();
        }

        function fillBeneficiaryLocation() {
            cy.checkA11y();
            cy.getByLabelText(
                'Which local authority will your project benefit?'
            ).select('Maldon');
            cy.getByLabelText(
                'Tell us the town(s), village(s) or ward(s) where your beneficaries live'
            ).type(faker.lorem.sentence());
        }

        function fillBeneficiaryGroupsCheck() {
            cy.checkA11y();
            cy.getByLabelText('Yes').click();
        }

        function fillBeneficiaryGroups() {
            cy.checkA11y();
            cy.getByLabelText('Ethnic background').click();
            cy.getByLabelText('Gender').click();
            cy.getByLabelText('Age').click();
            cy.getByLabelText('Disabled people').click();
            cy.getByLabelText('Lesbians, gay or bisexual people').click();
        }

        function fillBeneficiaryGender() {
            cy.checkA11y();
            cy.getByLabelText('Non-binary').click();
        }

        function fillBeneficiaryAge() {
            cy.checkA11y();
            cy.getByLabelText('25-64').click();
        }

        function fillBeneficiaryDisability() {
            cy.checkA11y();
            cy.getByLabelText(
                'Disabled people with learning or mental difficulties',
                { exact: false }
            ).click();
        }

        function fillOrganisationDetails() {
            cy.checkA11y();
            cy.getByLabelText(
                'What is the full legal name of your organisation?',
                { exact: false }
            ).type(faker.company.companyName());
            fillAddress();
        }

        function fillOrganisationType() {
            cy.checkA11y();
            cy.getByLabelText('Registered charity (unincorporated)', {
                exact: false
            }).click();
        }

        function fillRegistrationNumbers() {
            cy.checkA11y();
            cy.getByLabelText('Charity registration number', {
                exact: false
            }).type(12345678);
        }

        function fillOrganisationFinances() {
            cy.checkA11y();
            cy.getByLabelText('Day').type(31);
            cy.getByLabelText('Month').type(3);
            cy.getByLabelText('What is your total income for the year?', {
                exact: false
            }).type('150000');
        }

        function fillContact() {
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
            fillAddress();
            cy.getByLabelText('Yes').click();
            cy.getByLabelText('Email', { exact: false }).type(
                faker.internet.exampleEmail()
            );
            cy.getByLabelText('Telephone number', { exact: false }).type(
                faker.phone.phoneNumber()
            );
        }

        function fillMainContact() {
            fillContact();
        }

        function fillSeniorContact() {
            fillContact();
            cy.getByLabelText('Trustee').click();
        }

        function fillBankDetails() {
            cy.checkA11y();
            cy.getByLabelText('Name on the bank account', {
                exact: false
            }).type(faker.company.companyName());
            cy.getByLabelText('Account number', { exact: false }).type(
                '00012345'
            );
            cy.getByLabelText('Sort code', { exact: false }).type('108800');
        }

        function fillBankStatement() {
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
        }

        function fillTerms() {
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
        }

        function submitStep() {
            cy.getByText('Continue').click();
        }

        cy.seedAndLogin().then(() => {
            cy.visit('/apply-next/simple/new');

            fillProjectDetails();
            submitStep();

            fillYourIdea();
            submitStep();

            fillProjectCosts();
            submitStep();

            cy.get('h1').should(
                'contain',
                'Who will benefit from your project'
            );
            submitStep();

            fillBeneficiaryNumbers();
            submitStep();

            fillBeneficiaryLocationCheck();
            submitStep();

            fillBeneficiaryLocation();
            submitStep();

            fillBeneficiaryGroupsCheck();
            submitStep();

            fillBeneficiaryGroups();
            submitStep();

            fillBeneficiaryGender();
            submitStep();

            fillBeneficiaryAge();
            submitStep();

            fillBeneficiaryDisability();
            submitStep();

            fillOrganisationDetails();
            submitStep();

            fillOrganisationType();
            submitStep();

            fillRegistrationNumbers();
            submitStep();

            fillOrganisationFinances();
            submitStep();

            fillMainContact();
            submitStep();

            fillSeniorContact();
            submitStep();

            fillBankDetails();
            submitStep();

            fillBankStatement();
            submitStep();

            cy.checkA11y();
            cy.get('h1').should('contain', 'Summary');
            cy.getByText('Submit application').click();

            fillTerms();
            cy.getByText('Submit application').click();

            cy.get('h1').should(
                'contain',
                'Thank you for submitting your idea'
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
        cy.getByText('Start', { exact: false }).click();

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
        const textQueryCount = 79;

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
