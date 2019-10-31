const faker = require('faker');
const moment = require('moment');
const uuid = require('uuid/v4');
const includes = require('lodash/includes');
const random = require('lodash/random');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const sum = require('lodash/sum');
const times = require('lodash/times');

function acceptCookieConsent() {
    return cy.get('.cookie-consent button').click();
}

function checkRedirect({ from, to, isRelative = true, status = 301 }) {
    cy.request({
        url: from,
        followRedirects: false
    }).then(response => {
        const expected = isRelative ? `http://localhost:8090${to}` : to;
        expect(response.status).to.eq(status);
        expect(response.redirectedToUrl).to.eq(expected);
    });
}

it('should have expected cache headers', () => {
    cy.request('/').then(response => {
        expect(response.headers['cache-control']).to.eq(
            'max-age=30,s-maxage=300'
        );
    });

    cy.request('/user/login').then(response => {
        expect(response.headers['cache-control']).to.eq(
            'no-store,no-cache,max-age=0'
        );
    });
});

it('should 404 unknown routes', () => {
    function check404(urlPath) {
        cy.request({
            url: urlPath,
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.include('Error 404');
        });
    }

    check404('/not-a-page');
    check404('/not/a/page');
});

it('should redirect search queries to a google site search', () => {
    checkRedirect({
        from: '/search?q=This is my search query',
        to: `https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+This%20is%20my%20search%20query`,
        isRelative: false,
        status: 302
    });
});

it('should redirect archived pages to the national archives', () => {
    const urlPath = `/funding/funding-guidance/applying-for-funding/aims-and-outcomes`;
    cy.request(urlPath).then(response => {
        expect(response.body).to.include(
            `http://webarchive.nationalarchives.gov.uk/20171011152352/https://www.biglotteryfund.org.uk${urlPath}`
        );
    });
});

it('should redirect legacy funding programmes', () => {
    checkRedirect({
        from: `/global-content/programmes/uk-wide/green-spaces-and-sustainable-communities`,
        to: `/funding/programmes/green-spaces-and-sustainable-communities`
    });

    checkRedirect({
        from: `/global-content/programmes/northern-ireland/young-peoples-fund-change-ur-future`,
        to: `/funding/programmes/young-peoples-fund-change-ur-future`
    });

    checkRedirect({
        from: `/welsh/global-content/programmes/wales/young-peoples-fund-bridging-the-gap`,
        to: `/welsh/funding/programmes/young-peoples-fund-bridging-the-gap`
    });
});

it('should protect access to staff-only tools', () => {
    [
        `/tools/survey-results`,
        `/funding/programmes/national-lottery-awards-for-all-england?x-craft-preview=123&token=abc`
    ].forEach(urlPath => {
        checkRedirect({
            from: urlPath,
            to: `/user/staff/login?redirectUrl=${encodeURIComponent(urlPath)}`,
            status: 302
        });
    });
});

function logIn(username, password, usingGlobalHeader = false) {
    if (usingGlobalHeader) {
        cy.visit('/');
        cy.wait(0);
        cy.get('.global-header__navigation-secondary .js-toggle-login').within(
            () => {
                cy.findByText('Log in', { exact: false }).click();
            }
        );
    } else {
        cy.visit('/user/login');
    }

    cy.findByLabelText('Email address')
        .clear()
        .type(username);
    cy.findByLabelText('Password')
        .clear()
        .type(password);
    cy.get('.form-actions').within(() => {
        cy.findByText('Log in').click();
    });
}

function createAccount(username, password) {
    cy.visit('/user/register');

    cy.findByLabelText('Email address')
        .clear()
        .type(username, { delay: 0 });
    cy.findByLabelText('Password')
        .clear()
        .type(password, { delay: 0 });
    cy.findByLabelText('Password confirmation', { exact: false })
        .clear()
        .type(password, { delay: 0 });
    cy.get('.form-actions').within(() => {
        cy.findByText('Create an account').click();
    });
}

function generateAccountEmail() {
    return `${uuid()}@example.com`;
}

function generateAccountPassword() {
    return `password${uuid()}`;
}

it('log in and log out', function() {
    cy.seedUser().then(newUser => {
        logIn(newUser.username, newUser.password);

        cy.get('.global-header__navigation-secondary').within(() => {
            cy.findByText('Log out', { exact: false }).click();
        });

        cy.findByText('You were successfully logged out', {
            exact: false
        }).should('be.visible');
    });
});

it('activate user account without logging in', function() {
    const username = generateAccountEmail();
    const password = generateAccountPassword();

    cy.registerUser({
        username: username,
        password: password,
        returnToken: true
    }).then(res => {
        cy.visit(`/user/activate?token=${res.body.token}`);

        cy.findByText('Your account was successfully activated!').should(
            'be.visible'
        );
    });
});

it('log in and log out using global header link', function() {
    cy.seedUser().then(newUser => {
        logIn(newUser.username, newUser.password, true);

        cy.wait(0);
        cy.get('.global-header__navigation-secondary').within(() => {
            cy.findByText('Log out', { exact: false }).click();
        });

        cy.findByText('You were successfully logged out', {
            exact: false
        }).should('be.visible');
    });
});

it('should prevent invalid log ins', () => {
    logIn(generateAccountEmail(), generateAccountPassword());
    cy.findByTestId('form-errors').should(
        'contain',
        `Your username and password aren't quite right`
    );

    cy.checkA11y();
});

it('should return error when logging in with invalid password', () => {
    cy.seedUser().then(newUser => {
        logIn(newUser.username, generateAccountPassword());
        cy.findByTestId('form-errors').should(
            'contain',
            `Your username and password aren't quite right`
        );
    });
});

it('should rate-limit users attempting to login too often', () => {
    const email = generateAccountEmail();
    const password = generateAccountPassword();

    times(10, function() {
        cy.loginUser({
            username: email,
            password: password
        }).then(response => {
            expect(response.status).to.eq(200);
        });
    });

    cy.loginUser({
        username: email,
        password: password,
        failOnStatusCode: false
    }).then(response => {
        expect(response.status).to.eq(429);
        expect(response.body).to.include('Too many requests');
    });
});

it('should prevent registrations with invalid passwords', () => {
    const username = generateAccountEmail();

    createAccount(username, '5555555555');
    cy.findByTestId('form-errors').should('contain', 'Password is too weak');

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
    createAccount(generateAccountEmail(), generateAccountPassword());
    cy.checkA11y();
    cy.get('body').should(
        'contain',
        'Check your emails to activate your account'
    );
});

it('should email valid users with a token', () => {
    const username = generateAccountEmail();
    const password = generateAccountPassword();

    cy.registerUser({
        username: username,
        password: password,
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

function submitPasswordReset(
    newPassword,
    oldPassword = null,
    expectError = false
) {
    if (oldPassword) {
        cy.findByText('Change your password').click();
        cy.findByLabelText('Your old password').type(oldPassword);
    }

    cy.findByLabelText('Your new password').type(newPassword);
    cy.findByLabelText('Password confirmation').type(newPassword);
    cy.get('.form-actions').within(() => {
        cy.findByText('Reset password').click();
    });

    if (expectError) {
        cy.findByTestId('form-errors').should(
            'contain',
            'There was a problem with your submission'
        );
    } else {
        cy.findByText('Your password was successfully updated!').should(
            'be.visible'
        );
    }
}

it('should be able to log in and update account details', () => {
    cy.seedUser().then(user => {
        logIn(user.username, user.password);

        cy.get('.user-nav__links').within(() => {
            cy.findByText('Account').click();
        });

        const newPassword = generateAccountPassword();
        submitPasswordReset(newPassword, user.password);

        cy.findByText('Change your email address').click();
        cy.findByLabelText('Email address').type(generateAccountEmail());
        cy.findByLabelText('Password confirmation').type('invalid password');

        cy.get('.form-actions').within(() => {
            cy.findByText('Update email address').click();
        });

        cy.findByTestId('form-errors').should(
            'contain',
            'There was an error updating your details'
        );

        cy.findByLabelText('Password confirmation')
            .clear()
            .type(newPassword);

        cy.get('.form-actions').within(() => {
            cy.findByText('Update email address').click();
        });

        cy.get('body').should(
            'contain',
            'Check your emails to activate your account'
        );
    });
});

it('should be able to reset password while logged out', () => {
    cy.seedUser().then(user => {
        cy.request('POST', '/user/password/forgot', {
            username: user.username,
            returnToken: true
        }).then(response => {
            cy.visit(`/user/password/reset?token=${response.body.token}`);
            submitPasswordReset(generateAccountPassword());
        });
    });
});

it('should throw errors on multiple error requests on pwd reset', () => {
    const weakPassword = 'password123';
    cy.seedUser().then(user => {
        cy.request('POST', '/user/password/forgot', {
            username: user.username,
            returnToken: true
        }).then(response => {
            cy.visit(`/user/password/reset?token=${response.body.token}`);
            submitPasswordReset(weakPassword, null, true);
            submitPasswordReset(weakPassword, null, true);
        });
    });
});

it('should return forgotten password screen for invalid accounts', () => {
    cy.visit('/user/password/forgot');

    cy.findByLabelText('Email address', { exact: false }).type(
        generateAccountEmail()
    );

    cy.get('.form-actions').within(() => {
        cy.findByText('Reset password').click();
    });

    cy.findByText('Password reset requested', { exact: false }).should(
        'be.visible'
    );
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

    it('should correctly email users with expiring applications', () => {
        cy.seedUser().then(newUser => {
            // Configure some applications with various expiry dates (past and future)
            const now = moment();
            const applicationExpiryDates = [
                now.clone().subtract(1, 'days'),
                now.clone().subtract(40, 'days'),
                now.clone().subtract(80, 'days'),
                now.clone().add(1, 'days'),
                // these future expiry dates should not generate any emails to be sent
                now.clone().add(10, 'week'),
                now.clone().add(3, 'months')
            ];

            // Create all the applications
            applicationExpiryDates.map(expiry => {
                cy.request('POST', '/apply/awards-for-all/seed', {
                    userId: newUser.id,
                    expiresAt: expiry.toDate()
                });
            });

            // Process expiry emails for the above applications
            cy.request('POST', '/apply/handle-expiry').then(response => {
                expect(response.body).to.have.property('emailQueue');
                expect(response.body.emailQueue.length).to.eq(12);

                const successfulEmailsSent = response.body.emailQueue.filter(
                    _ => _.emailSent === true
                ).length;
                expect(successfulEmailsSent).to.eq(12);

                // Now check again for expiry emails to confirm there are
                // no items left in the queue (eg. it's been processed)
                cy.request('POST', '/apply/handle-expiry').then(newResponse => {
                    expect(newResponse.body.emailQueue.length).to.eq(0);
                });
            });
        });
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

it('should test common interactions', () => {
    cy.visit('/');

    // @TODO: Confirm contrast ratio issue on miniature heroes?
    cy.checkA11y({
        options: { rules: { 'color-contrast': { enabled: false } } }
    });

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
});

it('should test common pages', () => {
    cy.visit('/welsh');
    cy.checkA11y();

    cy.visit('/funding/programmes');
    // @TODO: Review colour contrast on promo cards
    cy.checkA11y({
        options: { rules: { 'color-contrast': { enabled: false } } }
    });
});

it('should submit full awards for all application', () => {
    function checkLastSaveTime() {
        cy.get('.form-actions__timestamp').contains('Today');
    }

    function submitStep() {
        checkLastSaveTime();
        cy.findByText('Continue').click();
    }

    function fillAddress({ streetAddress, city, county, postcode }) {
        cy.findByText('Enter address manually').click();

        cy.findByLabelText('Building and street').type(streetAddress);

        cy.findByLabelText('Town or city').type(city);

        if (county) {
            cy.findByLabelText('County').type(county);
        }

        cy.findByLabelText('Postcode').type(postcode);
    }

    function startApplication() {
        cy.findByText('Start a new application').click();
        times(5, function() {
            cy.findByLabelText('Yes').click();
            cy.findByText('Continue').click();
        });
        cy.findByText('Start your application').click();

        cy.findAllByText('Start your application')
            .first()
            .click();
    }

    function stepProjectDetails() {
        cy.checkA11y();

        cy.findByLabelText('What is the name of your project?', {
            exact: false
        }).type('Test application');

        const startDate = moment().add(random(18, 20), 'weeks');
        const endDate = startDate.clone().add(random(0, 52), 'weeks');

        function fillDateParts(momentInstance) {
            cy.findByLabelText('Day').type(momentInstance.date());
            cy.findByLabelText('Month').type(momentInstance.month() + 1);
            cy.findByLabelText('Year').type(momentInstance.year());
        }

        cy.findByText('Start date')
            .parent()
            .within(() => {
                fillDateParts(startDate);
            });

        cy.findByText('End date')
            .parent()
            .within(() => {
                fillDateParts(endDate);
            });

        submitStep();
    }

    function stepProjectCountry(mock) {
        cy.findByLabelText(mock.country).click();
        submitStep();
    }

    function stepProjectLocation(mock) {
        let location = {};
        switch (mock.country) {
            case 'Northern Ireland':
                location = {
                    option: 'Derry and Strabane',
                    postcode: 'BT82 8AE'
                };
                break;
            case 'Scotland':
                location = {
                    option: 'Highland',
                    postcode: 'KW8 6JF'
                };

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

        cy.findByLabelText('Where will your project take place?').select(
            location.option
        );

        cy.findByLabelText(
            'Tell us the towns or villages where people who will benefit from your project live'
        ).type(`Example location description for ${location.option}`);

        cy.findByLabelText('What is the postcode', { exact: false }).type(
            location.postcode
        );

        submitStep();
    }

    function stepYourIdea() {
        cy.checkA11y();

        cy.findByLabelText('What would you like to do?')
            .invoke('val', faker.lorem.words(150))
            .trigger('change');

        cy.findByLabelText(
            'How does your project meet at least one of our funding priorities?'
        )
            .invoke('val', faker.lorem.words(100))
            .trigger('change');

        cy.findByLabelText('How does your project involve your community?')
            .invoke('val', faker.lorem.words(150))
            .trigger('change');

        submitStep();
    }

    function stepProjectCosts() {
        const amounts = new Array(random(3, 10))
            .fill(null)
            .map(() => random(100, 1000));

        amounts.forEach((amount, index) => {
            cy.findAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.findByLabelText('Item or activity').type(
                        `Example budget item ${index + 1}`
                    );
                    cy.findByLabelText('Amount').type(amount.toString());
                });
        });

        cy.findAllByTestId('budget-total').should(
            'contain',
            `£${sum(amounts).toLocaleString()}`
        );

        cy.findByLabelText('Tell us the total cost of your project')
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

    function sectionBeneficiaries(mock) {
        cy.checkA11y();

        cy.findByLabelText(
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
            cy.findByLabelText(label).click();
        });

        submitStep();

        if (
            includes(
                randomBeneficiaryGroups,
                'People from a particular ethnic background'
            )
        ) {
            cy.checkA11y();
            cy.findByLabelText('Caribbean').click();
            cy.findByLabelText('African').click();
            submitStep();
        }

        if (
            includes(randomBeneficiaryGroups, 'People of a particular gender')
        ) {
            cy.checkA11y();
            cy.findByLabelText('Non-binary').click();
            submitStep();
        }

        if (includes(randomBeneficiaryGroups, 'People of a particular age')) {
            cy.checkA11y();
            cy.findByLabelText('25-64').click();
            submitStep();
        }

        if (includes(randomBeneficiaryGroups, 'Disabled people')) {
            cy.checkA11y();
            cy.findByLabelText(
                'Disabled people with learning or mental difficulties',
                { exact: false }
            ).click();
            submitStep();
        }

        if (mock.country === 'Wales') {
            cy.findByLabelText('More than half').click();
            submitStep();
        }

        if (mock.country === 'Northern Ireland') {
            cy.findByLabelText('Both Catholic and Protestant').click();
            submitStep();
        }
    }

    function sectionOrganisation(mock) {
        cy.checkA11y();

        cy.findByLabelText(
            'What is the full legal name of your organisation?',
            {
                exact: false
            }
        ).type(mock.organisationName);

        cy.findByText('When was your organisation set up?')
            .parent()
            .within(() => {
                const dt = moment().subtract(random(5, 100), 'years');
                cy.findByLabelText('Month').type(dt.month() + 1);
                cy.findByLabelText('Year').type(dt.year().toString());
            });

        cy.findByText(
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

        cy.findByLabelText(mock.organisationType, { exact: false }).click();

        submitStep();

        cy.checkA11y();

        if (mock.organisationType === 'Statutory body') {
            // @TODO: Should we further randomise the sub-types?
            cy.findByLabelText('Parish Council', {
                exact: false
            }).click();
            submitStep();
        }

        /**
         * Registration numbers
         * Not all organisation types require a registration number
         * so we need to check if the step exists first.
         */
        function randomId(digits) {
            return random(10000, 99999999)
                .toString()
                .padStart(digits, '0');
        }

        const companyNumberTypes = ['Not-for-profit company'];

        const charityNumberTypes = [
            'Charitable Incorporated Organisation (CIO or SCIO)',
            'Faith-based group',
            'Not-for-profit company',
            'Registered charity (unincorporated)'
        ];

        const educationNumberTypes = ['School', 'College or University'];

        const registrationNumberTypes = [].concat(
            companyNumberTypes,
            charityNumberTypes,
            educationNumberTypes
        );

        if (includes(companyNumberTypes, mock.organisationType)) {
            cy.findByLabelText('Companies House number', { exact: false }).type(
                randomId(8)
            );
        }

        if (includes(charityNumberTypes, mock.organisationType)) {
            cy.findByLabelText('Charity registration number', {
                exact: false
            }).type(randomId(7));
        }

        if (includes(educationNumberTypes, mock.organisationType)) {
            cy.findByLabelText('Department for Education number', {
                exact: false
            }).type(randomId(6));
        }

        if (includes(registrationNumberTypes, mock.organisationType)) {
            submitStep();
        }

        cy.checkA11y();
        cy.findByText('What is your accounting year end date?', {
            exact: false
        })
            .parent()
            .within(() => {
                cy.findByLabelText('Day').type(random(1, 28).toString());
                cy.findByLabelText('Month').type(random(1, 12).toString());
            });

        cy.findByLabelText('What is your total income for the year?', {
            exact: false
        }).type(random(25000, 150000).toString());

        submitStep();
    }

    function fillContact(contact, includeAddressAndDob = true) {
        cy.findByLabelText('First name').type(contact.firstName);

        cy.findByLabelText('Last name').type(contact.lastName);

        if (includeAddressAndDob) {
            cy.findByText('Date of birth')
                .parent()
                .within(() => {
                    cy.findByLabelText('Day').type(
                        contact.dateOfBirth.date().toString()
                    );
                    cy.findByLabelText('Month').type(
                        contact.dateOfBirth.month() + 1
                    );
                    cy.findByLabelText('Year').type(
                        contact.dateOfBirth.year().toString()
                    );
                });

            cy.findByText('Home address', { timeout: 1000 })
                .parent()
                .within(() => {
                    fillAddress(contact.address);
                });

            cy.findByText(
                'Have they lived at their home address for the last three years?'
            )
                .parent()
                .within(() => {
                    cy.findByLabelText('No').click();
                });

            cy.findByText('Previous home address')
                .parent()
                .within(() => {
                    fillAddress({
                        streetAddress: `Apex house, Edgbaston`,
                        city: 'Birmingham',
                        postcode: 'B15 1TR'
                    });
                });
        }

        cy.findByLabelText('Email').type(
            contact.email || faker.internet.exampleEmail()
        );

        cy.findByLabelText('Telephone number').type(contact.phone);

        if (mock.country === 'Wales') {
            cy.findByText(
                'What language should we use to contact this person?',
                {
                    exact: false
                }
            ).then(el => {
                cy.wrap(el)
                    .parent()
                    .within(() => {
                        cy.findByLabelText('Welsh').click();
                    });
            });
        }

        cy.findByLabelText('tell us about any particular communication needs', {
            exact: false
        }).type('Example communication need');
    }

    function includeAddressAndDob(mock) {
        return (
            includes(
                ['School', 'College or University', 'Statutory body'],
                mock.organisationType
            ) === false
        );
    }

    function sectionSeniorContact(mock) {
        cy.checkA11y();
        cy.get('label[for="field-seniorContactRole-1"]').click();
        fillContact(mock.seniorContact, includeAddressAndDob(mock));
        submitStep();
    }

    function sectionMainContact(mock) {
        cy.checkA11y();
        fillContact(mock.mainContact, includeAddressAndDob(mock));
        submitStep();
    }

    function sectionBankDetails(mock) {
        cy.checkA11y();

        cy.findByLabelText('Tell us the name of your organisation', {
            exact: false
        }).type(mock.organisationName);

        cy.findByLabelText('Account number', { exact: false }).type('25337846');

        cy.findByLabelText('Sort code', { exact: false }).type('308087');

        submitStep();

        cy.checkA11y();

        cy.fixture('example.pdf', 'base64').then(fileContent => {
            cy.findByLabelText('Upload a bank statement', {
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

        cy.findAllByLabelText('I agree').each($el => {
            cy.wrap($el).click();
        });

        cy.findByLabelText('Full name of person completing this form', {
            exact: false
        }).type(faker.name.findName());

        cy.findByLabelText('Position in organisation', {
            exact: false
        }).type('CEO');

        submitStep();
    }

    function submitApplication() {
        cy.checkA11y();
        cy.get('h1').should('contain', 'Summary');

        cy.findAllByText('Submit application')
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
            'Charitable Incorporated Organisation (CIO or SCIO)',
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

        acceptCookieConsent();
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

it('should complete standard your funding proposal form', () => {
    const mock = {
        projectName: faker.lorem.words(5),
        projectCountries: sampleSize(
            ['England', 'Scotland', 'Northern Ireland'],
            random(1, 2)
        ),
        projectLocationDescription: faker.lorem.words(5),
        projectCosts: random(10001, 5000000),
        projectDurationYears: sample(['3 years', '4 years', '5 years']),
        yourIdeaProject: faker.lorem.words(random(50, 500)),
        yourIdeaCommunity: faker.lorem.words(random(50, 500)),
        yourIdeaActivities: faker.lorem.words(random(50, 350)),
        organisationName: faker.company.companyName(),
        organisationTradingName: sample([faker.company.companyName(), '']),
        organisationAddress: {
            streetAddress: `The Bar, 2 St James' Blvd`,
            city: 'Newcastle',
            postcode: 'NE4 7JH'
        },
        organisationType: sample([
            'Unregistered voluntary or community organisation',
            'Not-for-profit company',
            'Charitable Incorporated Organisation'
        ]),
        contactEmail: 'digital.monitoring@tnlcommunityfund.org.uk',
        contactName: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        contactPhone: '0345 4 10 20 30',
        contactCommunicationNeeds: 'Example communication need'
    };

    function submitStep() {
        cy.findByText('Continue').click();
    }

    cy.seedAndLogin().then(() => {
        cy.visit('/apply/your-funding-proposal');

        acceptCookieConsent();

        cy.findAllByText('Tell us your new proposal').click();

        cy.get('.form-actions').within(() => {
            cy.findAllByText('Start your proposal').click();
        });

        cy.findAllByText('Start')
            .first()
            .click();

        cy.findByLabelText('What is the name of your project?').type(
            mock.projectName
        );

        submitStep();

        mock.projectCountries.forEach(function(country) {
            cy.findByLabelText(country).click();
        });

        submitStep();

        function randomProjectLocation() {
            if (mock.projectCountries.includes('Northern Ireland')) {
                return 'Derry and Strabane';
            } else if (mock.projectCountries.includes('Scotland')) {
                return 'Highland';
            } else if (mock.projectCountries.includes('Wales')) {
                return 'Caerphilly';
            } else {
                return 'Bath and North East Somerset';
            }
        }

        if (mock.projectCountries.length === 1) {
            cy.findByLabelText('Where will your project take place?').select(
                randomProjectLocation()
            );
        }

        cy.findByLabelText('Project location', { exact: false }).type(
            mock.projectLocationDescription
        );

        submitStep();

        cy.findByLabelText('How much money do you want from us?').type(
            mock.projectCosts
        );
        submitStep();

        if (mock.projectCountries.length === 1) {
            cy.findByLabelText(mock.projectDurationYears).click();
            submitStep();
        }

        cy.findByLabelText('What would you like to do?')
            .invoke('val', mock.yourIdeaProject)
            .trigger('change');

        cy.findByLabelText('How does your project involve your community?')
            .invoke('val', mock.yourIdeaCommunity)
            .trigger('change');

        cy.findByLabelText(
            'How does your idea fit in with other local activities?'
        )
            .invoke('val', mock.yourIdeaActivities)
            .trigger('change');

        submitStep();

        cy.findByLabelText(
            'What is the full legal name of your organisation?'
        ).type(mock.organisationName);

        if (mock.organisationTradingName) {
            cy.findByLabelText('Organisation trading name', {
                exact: false
            }).type(mock.organisationTradingName);
        }

        cy.findByText(
            'What is the main or registered address of your organisation?'
        )
            .parent()
            .within(() => {
                cy.findByText('Enter address manually').click();
                cy.findByLabelText('Building and street').type(
                    mock.organisationAddress.streetAddress
                );
                cy.findByLabelText('Town or city').type(
                    mock.organisationAddress.city
                );
                cy.findByLabelText('Postcode').type(
                    mock.organisationAddress.postcode
                );
            });

        submitStep();

        cy.findByLabelText(mock.organisationType, { exact: false }).click();

        submitStep();

        cy.findByLabelText('First name').type(mock.contactName.firstName);

        cy.findByLabelText('Last name').type(mock.contactName.lastName);

        cy.findByLabelText('Email').type(mock.contactEmail);

        cy.findByLabelText('Telephone number', { exact: false }).type(
            mock.contactPhone
        );

        cy.findByLabelText('Communication needs', { exact: false }).type(
            mock.contactCommunicationNeeds
        );
        submitStep();

        cy.findAllByText('Nearly done', { exact: false })
            .first()
            .should('exist');

        cy.findAllByText('Submit application')
            .first()
            .click();

        cy.get('h1').should('contain', 'Thanks for telling us your proposal');
    });
});

it('should submit an enquiry for reaching communities', () => {
    function submitStep() {
        cy.findByText('Next').click();
    }

    function stepIdea() {
        cy.findByLabelText(
            'Briefly explain your idea and why it’ll make a difference',
            { exact: false }
        )
            .invoke('val', faker.lorem.paragraphs(3))
            .trigger('change');

        submitStep();
    }

    function stepLocation() {
        cy.checkA11y();
        cy.findByLabelText('North East & Cumbria', { exact: false }).check();
        cy.findByLabelText('Yorkshire and the Humber', {
            exact: false
        }).check();
        cy.findByLabelText('Project location', { exact: false }).type(
            'Example',
            { delay: 0 }
        );

        submitStep();
    }

    function stepOrganisation() {
        cy.findByLabelText('Legal name', { exact: false }).type(
            'Test Organisation',
            { delay: 0 }
        );

        submitStep();
    }

    function stepYourDetails() {
        cy.findByLabelText('First name', { exact: false }).type(
            faker.name.firstName(),
            { delay: 0 }
        );
        cy.findByLabelText('Last name', { exact: false }).type(
            faker.name.lastName(),
            { delay: 0 }
        );
        cy.findByLabelText('Email address', { exact: false }).type(
            faker.internet.exampleEmail(),
            { delay: 0 }
        );
        cy.findByLabelText('Phone number', { exact: false }).type(
            '0123456789',
            {
                delay: 0
            }
        );

        submitStep();
    }

    cy.visit('/apply/your-idea');
    cy.findByText('Start').click();

    stepIdea();
    stepLocation();
    stepOrganisation();
    stepYourDetails();

    cy.findByText('Submit').click();
    cy.get('h1').should('contain', 'Thank you for submitting your idea');
    cy.checkA11y();
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
    const QUERY = 'cake';

    cy.visit('/funding/grants');
    acceptCookieConsent();

    cy.findAllByLabelText('Search all grants', { exact: false })
        .first()
        .type(QUERY)
        .type('{enter}');

    cy.get('.filter-list').should('contain', QUERY);

    // Use filters
    cy.findByLabelText('Under £10,000').click();
    cy.get('.filter-list').should('contain', 'Under £10,000');

    // Test pagination
    cy.findByText('Next page', { exact: false })
        .should('be.visible')
        .click();

    cy.findByText('Previous page', { exact: false }).should('be.visible');
});
