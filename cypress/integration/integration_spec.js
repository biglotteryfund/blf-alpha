// @ts-nocheck
describe('common', function() {
    it('should have common headers', () => {
        cy.request('/').then(response => {
            expect(response.headers['cache-control']).to.eq('max-age=30,s-maxage=300');
        });

        cy.request('/apply/your-idea/1').then(response => {
            expect(response.headers['cache-control']).to.eq('no-store,no-cache,max-age=0');
        });
    });

    it('should handle aliases', () => {
        cy.request('/tools/seed/aliases-sample')
            .its('body')
            .then(aliases => {
                aliases.forEach(alias => {
                    cy.checkRedirect({
                        from: alias.from,
                        to: alias.to
                    });
                });
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
            to: 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+This%20is%20my%20search%20query',
            isRelative: false,
            status: 302
        });

        cy.checkRedirect({
            from: '/search?lang=en-GB&amp;q=something&amp;type=All&amp;order=r',
            to: 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+something',
            isRelative: false,
            status: 302
        });
    });

    it('should redirect archived pages to the national archives', () => {
        const urlPath = '/funding/funding-guidance/applying-for-funding/aims-and-outcomes';
        cy.checkRedirect({
            from: urlPath,
            to: `http://webarchive.nationalarchives.gov.uk/https://www.biglotteryfund.org.uk${urlPath}`,
            isRelative: false
        });
    });

    it('should pass unknown routes to the legacy site', () => {
        cy.request('/funding/funding-guidance/managing-your-funding/about-equalities/evidence-collection-tools').then(
            response => {
                expect(response.headers['x-blf-legacy']).to.eq('true');
                expect(response.headers['content-security-policy']).to.not.exist;
                expect(response.body).to.include('Evidence collection tools: Funding - Big Lottery Fund');
            }
        );
    });

    it('should redirect old funding finder', () => {
        const pages = [
            {
                originalPath: '/funding/funding-finder',
                redirectedPath: '/funding/programmes'
            },
            {
                originalPath: '/Home/Funding/Funding Finder',
                redirectedPath: '/funding/programmes'
            },
            {
                originalPath: '/funding/funding-finder?area=northern+ireland',
                redirectedPath: '/funding/programmes?location=northernIreland'
            },
            {
                originalPath: '/funding/funding-finder?area=England&amount=up to 10000',
                redirectedPath: '/funding/programmes?location=england&max=10000'
            }
        ];

        pages.forEach(page => {
            cy.checkRedirect({
                from: page.originalPath,
                to: page.redirectedPath
            });
        });
    });

    it('should proxy old funding finder if requesting closed programmes', () => {
        cy.request('/funding/funding-finder?area=England&amp;amount=500001 - 1000000&amp;sc=1').then(response => {
            expect(response.headers['x-blf-legacy']).to.eq('true');
            expect(response.headers['content-security-policy']).to.not.exist;
            expect(response.body).to.include('This is a list of our funding programmes');
            expect(response.body).to.include('Show closed programmes');
        });
    });

    it('should follow redirects on the legacy site', () => {
        cy.checkRedirect({
            from: '/welshlanguage',
            to: '/about-big/customer-service/welsh-language-scheme'
        });
    });

    it('should serve welsh versions of legacy pages', () => {
        cy.request('/welsh/research/communities-and-places').then(response => {
            expect(response.body).to.include('Cymunedau a lleoedd');
        });
    });
});

describe('user', () => {
    it('should allow users to register', () => {
        cy.visit('/user/register');
        const now = Date.now();
        const username = `${now}@example.com`;
        cy.uiRegisterUser(username, now);
    });

    it('should not allow unknown users to login', () => {
        cy.visit('/user/login');
        cy.uiRegisterUser('person@example.com', 'badpassword');
        cy.get('.form-errors').contains('Your username and password combination is invalid');
    });

    it('should prevent registrations with invalid passwords', () => {
        cy.visit('/user/register');
        cy.uiRegisterUser('person@example.com', 'badpassword');
        cy.get('.form-errors').contains('Please provide a password that contains at least one number');
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
            expect(res.body.token).to.match(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/);
            expect(res.body.email.sendTo).to.equal(username);
            expect(res.body.email.subject).to.equal('Activate your Big Lottery Fund website account');
        });
    });

    it('should block access to staff-only tools', () => {
        cy.checkRedirect({
            from: '/tools/survey-results',
            to: '/user/login',
            status: 302
        });
    });

    it('should not allow unauthorised access to staff-only tools', () => {
        cy.loginUser({
            username: 'bad@example.com',
            password: 'notarealpassword'
        }).then(res => {
            expect(res.body).to.contain('Your username and password combination is invalid');
        });
    });

    it('should allow authorised access to staff-only tools', () => {
        cy.seedUser().then(currentUser => {
            cy.loginUser({
                username: currentUser.username,
                password: currentUser.password
            });

            cy.visit('/tools/survey-results');
            cy.get('h1').should('contain', 'Did you find what you were looking for?');
        });
    });
});

const loremLong = `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Praesentium quidem nihil, similique voluptatibus tempore quasi, cumque laborum officia voluptatem laboriosam tempora.

- Repudiandae doloremque necessitatibus
- Laudantium repellendus
- Soluta neque consequatur tenetur maiores.

Enim provident necessitatibus ipsa ad autem aliquam ducimus minima delectus exercitationem, minus blanditiis molestias quas eaque ullam ab aperiam assumenda.`;

describe('e2e', function() {
    it('should enable and disable in-progress features with a query string', () => {
        // Default state
        cy.visit('/');
        cy.get('.global-header').should('be.visible');

        // Enable feature
        cy.visit('/?enable-feature=use-new-header');
        cy.get('.global-header-next').should('be.visible');

        // Confirm cookie maintains state
        cy.visit('/about');
        cy.get('.global-header-next').should('be.visible');

        // Disable feature
        cy.visit('/?disable-feature=use-new-header');
        cy.get('.global-header').should('be.visible');
        cy.visit('/');
        cy.get('.global-header').should('be.visible');
    });

    it('should navigate from homepage to funding page', () => {
        // ================================================
        // Step: Homepage
        // ================================================ //

        cy.visit('/');
        cy.checkMetaTitles('Home | Big Lottery Fund');
        cy.checkActiveSection('toplevel');

        // ================================================
        // Step: Cookie consent
        // ================================================ //

        cy.get('.cookie-consent button').click();

        // ================================================
        // Step: Mobile navigation
        // ================================================ //

        cy.viewport(375, 667);
        cy.get('#js-mobile-nav-toggle').as('navToggle');
        cy.get('#qa-offscreen-navigation').as('nav');

        cy.get('@navToggle').click();
        cy.get('@nav').should('be.visible');

        cy.get('@navToggle').click();
        cy.get('@nav').should('not.be.visible');
        cy.viewport(1024, 768);

        // ================================================
        // Step: Micro-surveys
        // ================================================ //

        cy.get('.survey').as('survey');
        cy.get('@survey')
            .find('button:first-child')
            .click();
        cy.get('@survey')
            .find('p')
            .should('contain', 'Thank you');

        // ================================================
        // Step: Test language switcher
        // ================================================ //

        cy.get('.qa-global-nav .qa-lang-switcher').as('langSwitcher');
        cy.get('@langSwitcher').click();
        cy.checkMetaTitles('Hafan | Cronfa Loteri Fawr');
        cy.get('.qa-global-nav .qa-nav-link a')
            .first()
            .should('have.text', 'Hafan');

        // ================================================
        // Step: Micro-surveys (Welsh)
        // ================================================ //

        cy.get('.survey').as('survey');
        cy.get('@survey')
            .find('button:first-child')
            .click();
        cy.get('@survey')
            .find('p')
            .should('contain', 'Diolch am');

        // ================================================
        // Step:  Navigate to over 10k page
        // ================================================ //

        cy.get('@langSwitcher').click();
        cy.get('#qa-button-over10k').click();
        cy.checkActiveSection('funding');

        // ================================================
        // Step: Navigate to funding programmes list
        // ================================================ //

        cy.get('#qa-button-england').click();
        cy.checkActiveSection('funding');

        // ================================================
        // Step: Navigate to funding programme
        // ================================================ //

        cy.get('.qa-programme-card')
            .contains('Reaching Communities')
            .click();
        cy.checkActiveSection('funding');

        // ================================================
        // Step: Interact with tabs
        // ================================================ //

        cy.get('.js-tabset .js-tab').each($el => {
            cy.wrap($el)
                .click()
                .should('have.class', 'is-active');

            // Check there is only one tab active
            cy.get('.js-tabset .is-active').should('have.length', 1);

            // Check tab content is visible
            cy.get($el.attr('href')).should('be.visible');
        });
    });

    it('should submit a reaching communities application form', () => {
        const submitSelector = '.js-application-form input[type="submit"]';
        cy.visit('/apply/your-idea');

        // Start page
        cy.get('.start-button .btn').click();

        // Step 1
        cy.get('#field-your-idea')
            .invoke('val', loremLong)
            .trigger('change');

        cy.get(submitSelector).click();

        // Step 2
        cy.get('#field-location-1').check();
        cy.get('#field-location-3').check();
        cy.get('#field-project-location').type('Example', { delay: 0 });
        cy.get(submitSelector).click();

        // Step 3
        cy.get('#field-organisation-name').type('Test Organisation', { delay: 0 });
        cy.get(submitSelector).click();

        // Step 4
        cy.get('#field-first-name').type('Anne', { delay: 0 });
        cy.get('#field-last-name').type('Example', { delay: 0 });
        cy.get('#field-email').type('example@example.com', { delay: 0 });
        cy.get('#field-phone-number').type('0123456789', { delay: 0 });
        cy.get(submitSelector).click();

        // Review, toggle answer
        cy.get('.js-toggle-answer').as('toggleAnswer');
        cy.get('@toggleAnswer')
            .find('button')
            .click();

        cy.get('@toggleAnswer').should('have.class', 'is-active');
        cy.get('@toggleAnswer')
            .find('button')
            .should('contain', 'Show less')
            .click();
        cy.get(submitSelector).click();

        // Success
        cy.get('.form-message').should('contain', 'Thank you for submitting your idea');

        // ================================================
        // Step: Inline feedback
        // ================================================ //

        cy.get('#js-feedback').as('feedbackForm');
        cy.get('@feedbackForm')
            .find('textarea')
            .type('Test feedback');
        cy.get('@feedbackForm')
            .find('form')
            .submit();
        cy.get('@feedbackForm').should('contain', 'Thank you for sharing');
    });

    it('should submit a digital funding application form', () => {
        const submitSelector = '.js-application-form input[type="submit"]';
        cy.visit('/apply/digital-funding-1/1/');

        // Step 1
        cy.get('#field-name').type('Anne Example', { delay: 0 });
        cy.get('#field-email').type('example@example.com', { delay: 0 });
        cy.get('#field-organisation-name').type('Test Organisation', { delay: 0 });
        cy.get('#field-about-your-organisation')
            .invoke('val', loremLong)
            .trigger('change');

        cy.get(submitSelector).click();

        // Review, toggle answer
        cy.get('.js-toggle-answer').as('toggleAnswer');
        cy.get('@toggleAnswer')
            .find('button')
            .click();

        cy.get('@toggleAnswer').should('have.class', 'is-active');
        cy.get('@toggleAnswer')
            .find('button')
            .should('contain', 'Show less')
            .click();
        cy.get(submitSelector).click();

        // Success
        cy.get('.form-message').should('contain', 'Thank you for getting in touch');
    });

    it('should submit materials order', () => {
        cy.visit('/funding/funding-guidance/managing-your-funding/ordering-free-materials');
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

        cy.get('@materialB')
            .find('button[value="increase"]')
            .click()
            .click();
        cy.get('@materialB')
            .find('.step-control__quantity')
            .should('contain', 2);

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
