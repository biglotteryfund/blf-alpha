const faker = require('faker');
const moment = require('moment');
const uuid = require('uuid/v4');
const includes = require('lodash/includes');
const random = require('lodash/random');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const sum = require('lodash/sum');
const times = require('lodash/times');

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

    cy.request({
        url: '/not/a/page',
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
            originalPath: '/global-content/programmes/england/acitve-england',
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

function assertError(partialMessage) {
    cy.getByTestId('form-errors').should('contain', partialMessage);
}

it('log in and log out', function() {
    cy.seedUser().then(newUser => {
        cy.visit('/user/login');
        logIn(newUser.username, newUser.password);

        // Log out
        cy.get('.user-nav__links')
            .contains('Log out')
            .click();

        cy.getByText('You were successfully logged out', {
            exact: false
        }).should('be.visible');
    });
});

it('should prevent invalid log ins', () => {
    cy.visit('/user/login');

    const messageText = `Your username and password aren't quite right`;
    logIn('not_a_real_account@example.com', 'examplepassword');
    assertError(messageText);

    cy.checkA11y();

    cy.seedUser().then(newUser => {
        logIn(newUser.username, 'invalidpassword');
        assertError(messageText);
    });
});

it('should rate-limit users attempting to login too often', () => {
    const fakeEmail = `${Date.now()}@example.com`;
    const fakePassword = 'hunter2';
    const maxAttempts = 10;

    times(maxAttempts, function() {
        cy.loginUser({
            username: fakeEmail,
            password: fakePassword
        }).then(response => {
            expect(response.status).to.eq(200);
        });
    });

    cy.loginUser({
        username: fakeEmail,
        password: fakePassword,
        failOnStatusCode: false
    }).then(response => {
        expect(response.status).to.eq(429);
        expect(response.body).to.include('Too many requests');
    });
});

it('should prevent registrations with invalid passwords', () => {
    const username = `${Date.now()}@example.com`;

    cy.visit('/user/register');

    createAccount(username, '5555555555');
    cy.getByTestId('form-errors').should('contain', 'Password is too weak');

    // Non-UI tests for remaining validations for speed
    cy.registerUser({
        username: username,
        password: username
    }).then(res => {
        expect(res.body).to.contain(
            'Password must be different from your email address'
        );
    });

    cy.registerUser({
        username: username,
        password: 'tooshort'
    }).then(res => {
        expect(res.body).to.contain('Password must be at least');
    });
});

it('should register and see activation screen', function() {
    // Register
    cy.visit('/user/register');
    createAccount(`${Date.now()}@example.com`, uuid());
    cy.checkA11y();
    cy.get('body').should(
        'contain',
        'Check your emails to activate your account'
    );
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

it('should be able to log in and update account details', () => {
    function changePassword(oldPassword, newPassword) {
        cy.getByText('Change your password').click();
        cy.getByLabelText('Your old password').type(oldPassword, {
            delay: 0
        });
        cy.getByLabelText('Your new password').type(newPassword, {
            delay: 0
        });
        cy.getByLabelText('Password confirmation').type(newPassword, {
            delay: 0
        });
        cy.get('.form-actions').within(() => {
            cy.getByText('Reset password').click();
        });
        cy.getByText('Your password was successfully updated!').should(
            'be.visible'
        );
    }

    function updateEmail(password) {
        const newEmail = `${Date.now()}@example.com`;
        cy.getByText('Change your email address').click();
        cy.getByLabelText('Email address').type(newEmail);
        cy.getByLabelText('Password confirmation').type('invalid password');

        cy.get('.form-actions').within(() => {
            cy.getByText('Update email address').click();
        });

        assertError('There was an error updating your details');

        cy.getByLabelText('Password confirmation')
            .clear()
            .type(password);

        cy.get('.form-actions').within(() => {
            cy.getByText('Update email address').click();
        });

        cy.get('body').should(
            'contain',
            'Check your emails to activate your account'
        );
    }

    cy.seedUser().then(user => {
        cy.visit('/user/login');
        logIn(user.username, user.password);
        const newPassword = uuid();
        changePassword(user.password, newPassword);
        updateEmail(newPassword);
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

it('should test homepage and common interactions', () => {
    cy.visit('/');

    // @TODO: Confirm contrast ratio issue on miniature heroes?
    cy.checkA11y({
        options: { rules: { 'color-contrast': { enabled: false } } }
    });

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

    cy.visit('/funding/programmes');
    // @TODO: Review colour contrast on promo cards
    cy.checkA11y({
        options: { rules: { 'color-contrast': { enabled: false } } }
    });
});

it('should submit full awards for all application', () => {
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
        cy.screenshot('dashboard');

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
        cy.screenshot('project-details');

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

    function stepProjectCountry(mock) {
        cy.screenshot('project-country');

        cy.getByLabelText(mock.country).click();
        submitStep();
    }

    function stepProjectLocation(mock) {
        cy.screenshot('project-location');

        let location = {};
        switch (mock.country) {
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
        cy.screenshot('project-idea');

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
        cy.screenshot('project-costs');

        const amounts = new Array(random(3, 10))
            .fill(null)
            .map(() => random(100, 1000));

        amounts.forEach((amount, index) => {
            cy.getAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.getByLabelText('Item or activity').type(
                        `Example budget item ${index + 1}`
                    );
                    cy.getByLabelText('Amount').type(amount.toString());
                });
        });

        cy.getAllByTestId('budget-total').should(
            'contain',
            `£${sum(amounts).toLocaleString()}`
        );

        cy.getByLabelText('Tell us the total cost of your project')
            .clear()
            .type(random(sum(amounts), 20000).toString());

        submitStep();
    }

    function sectionYourProject(mock) {
        stepProjectDetails(mock);
        stepProjectCountry(mock);
        stepProjectLocation(mock);
        stepYourIdea(mock);
        stepProjectCosts(mock);
    }

    function sectionBeneficiaries() {
        cy.screenshot('beneficiaries-screener');

        cy.checkA11y();

        cy.getByLabelText(
            'My project is aimed at a specific group of people'
        ).click();

        submitStep();

        cy.screenshot('beneficiaries-groups');

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
            includes(randomBeneficiaryGroups, 'People of a particular gender')
        ) {
            cy.checkA11y();
            cy.getByLabelText('Non-binary').click();
            submitStep();
        }

        if (includes(randomBeneficiaryGroups, 'People of a particular age')) {
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

        cy.queryByText(
            'How many of the people who will benefit from your project speak Welsh?',
            {
                exact: false,
                timeout: 500
            }
        ).then(el => {
            if (el) {
                cy.getByLabelText('More than half').click();
                submitStep();
            }
        });

        cy.queryByText(
            'Which community do the people who will benefit from your project belong to?',
            {
                exact: false,
                timeout: 500
            }
        ).then(el => {
            if (el) {
                cy.getByLabelText('Both Catholic and Protestant').click();
                submitStep();
            }
        });
    }

    function sectionOrganisation(mock) {
        cy.screenshot('organisation-details');

        cy.checkA11y();

        cy.getByLabelText('What is the full legal name of your organisation?', {
            exact: false
        }).type(mock.organisationName);

        // Org age question
        const dt = moment().subtract(random(1, 20), 'years');
        cy.getByLabelText('Month').type(dt.month() + 1);
        cy.getByLabelText('Year').type(dt.year().toString());

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

        cy.screenshot('organisation-type');

        cy.checkA11y();

        cy.getByLabelText(mock.organisationType, { exact: false }).click();

        submitStep();

        cy.checkA11y();

        cy.queryByText('Tell us what type of statutory body you are', {
            exact: false,
            timeout: 500
        }).then(el => {
            if (el) {
                // @TODO: Should we further randomise the sub-types?
                cy.getByLabelText('Parish Council', {
                    exact: false
                }).click();
                submitStep();
            }
        });

        /**
         * Registration numbers
         * Not all organisation types require a registration number
         * so we need to check if the step exists first.
         */
        cy.queryByText('Registration numbers (Step 4 of 5)', {
            exact: false,
            timeout: 500
        }).then(registrationNumbersStepEl => {
            function randomId(digits) {
                return random(10000, 99999999)
                    .toString()
                    .padStart(digits, '0');
            }

            if (registrationNumbersStepEl) {
                cy.screenshot('registration-numbers');

                const opts = { exact: false, timeout: 500 };

                cy.queryByLabelText('Companies House number', opts).then(
                    function(el) {
                        el && cy.wrap(el).type(randomId(8));
                    }
                );

                cy.queryByLabelText('Charity registration number', opts).then(
                    function(el) {
                        el && cy.wrap(el).type(randomId(7));
                    }
                );

                cy.queryByLabelText(
                    'Department for Education number',
                    opts
                ).then(function(el) {
                    el && cy.wrap(el).type(randomId(6));
                });

                submitStep();
            }
        });

        // Optional accounting year end step
        cy.queryByText('What is your accounting year end date?', {
            exact: false,
            timeout: 1000
        }).then(el => {
            if (el) {
                cy.checkA11y();
                cy.getByLabelText('Day').type(random(1, 28).toString());
                cy.getByLabelText('Month').type(random(1, 12).toString());
                cy.getByLabelText('What is your total income for the year?', {
                    exact: false
                }).type(random(25000, 150000));

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

        cy.queryByText('What language should we use to contact this person?', {
            exact: false,
            timeout: 500
        }).then(el => {
            if (el) {
                cy.wrap(el)
                    .parent()
                    .within(() => {
                        cy.getByLabelText('Welsh').click();
                    });
            }
        });

        cy.getByLabelText('tell us about any particular communication needs', {
            exact: false
        }).type('Example communication need');
    }

    function sectionSeniorContact(mock) {
        cy.screenshot('senior-contact');
        cy.checkA11y();
        cy.get('label[for="field-seniorContactRole-1"]').click();
        fillContact(mock.seniorContact);
        submitStep();
    }

    function sectionMainContact(mock) {
        cy.screenshot('main-contact');
        cy.checkA11y();
        fillContact(mock.mainContact);
        submitStep();
    }

    function stepBankAccount(mock) {
        cy.screenshot('bank-account');
        cy.checkA11y();

        cy.getByLabelText('Tell us the name of your organisation', {
            exact: false
        }).type(mock.organisationName);

        cy.getByLabelText('Account number', { exact: false }).type('25337846');

        cy.getByLabelText('Sort code', { exact: false }).type('308087');

        submitStep();
    }

    function stepBankStatement() {
        cy.screenshot('bank-statement');
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

    function sectionBankDetails(mock) {
        stepBankAccount(mock);
        stepBankStatement(mock);
    }

    function sectionTermsAndConditions() {
        cy.screenshot('terms');
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
        cy.screenshot('summary');
        cy.checkA11y();
        cy.get('h1').should('contain', 'Summary');

        cy.getAllByText('Submit application')
            .first()
            .click();

        cy.get('h1').should(
            'contain',
            'Your application has been submitted. Good luck!'
        );
    }

    const mock = {
        country: sample(['England', 'Northern Ireland', 'Scotland', 'Wales']),
        organisationType: sample([
            'Unregistered voluntary or community organisation',
            'Registered charity (unincorporated)',
            'Charitable incorporated organisation (CIO)',
            'Not-for-profit company',
            'School',
            'College or University',
            'Statutory body',
            'Faith-based group'
        ]),
        organisationName: faker.company.companyName(),
        seniorContact: {
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
        },
        mainContact: {
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
        }
    };

    Object.entries(mock).forEach(([key, value]) => {
        cy.log(key, JSON.stringify(value, null, 2));
    });

    cy.seedAndLogin().then(() => {
        cy.visit('/apply/awards-for-all');

        cy.get('.cookie-consent button').click();
        startApplication();

        sectionYourProject(mock);
        sectionBeneficiaries(mock);
        sectionOrganisation(mock);

        sectionSeniorContact(mock);
        sectionMainContact(mock);

        sectionBankDetails(mock);
        sectionTermsAndConditions(mock);

        submitApplication();
    });
});

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
        cy.getByLabelText('Phone number', { exact: false }).type('0123456789', {
            delay: 0
        });
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

it('should be able to browse grants search results', () => {
    cy.visit('/funding/grants');
    cy.get('.cookie-consent button').click();
    cy.get('.qa-grant-result').should('have.length', 50);

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
