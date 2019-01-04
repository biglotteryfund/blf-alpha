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
        cy.request(urlPath).then(response => {
            expect(response.body).to.include(
                `http://webarchive.nationalarchives.gov.uk/20171011152352/https://www.biglotteryfund.org.uk${urlPath}`
            );
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

    it('should proxy old funding finder if requesting closed programmes', () => {
        cy.request('/funding/funding-finder?area=England&amp;amount=500001 - 1000000&amp;sc=1').then(response => {
            expect(response.headers['x-blf-legacy']).to.eq('true');
            expect(response.headers['content-security-policy']).to.not.exist;
            expect(response.body).to.include('This is a list of our funding programmes');
            expect(response.body).to.include('Show closed programmes');
        });
    });

    it('should protect access to staff-only tools', () => {
        cy.checkRedirect({
            from: '/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            to: '/user/staff/login?redirectUrl=/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            status: 302
        });

        cy.checkRedirect({
            from: '/tools/survey-results',
            to: '/user/staff/login?redirectUrl=/tools/survey-results',
            status: 302
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
});

const loremLong = `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Praesentium quidem nihil, similique voluptatibus tempore quasi, cumque laborum officia voluptatem laboriosam tempora.

- Repudiandae doloremque necessitatibus
- Laudantium repellendus
- Soluta neque consequatur tenetur maiores.

Enim provident necessitatibus ipsa ad autem aliquam ducimus minima delectus exercitationem, minus blanditiis molestias quas eaque ullam ab aperiam assumenda.`;

describe('e2e', function() {
    it('should perform common interactions', () => {
        cy.visit('/');
        cy.viewport(375, 667);
        cy.get('.cookie-consent button').click();

        // Submit micro survey
        cy.get('.survey button:first-child').click();
        cy.get('.survey').should('contain', 'Thank you');

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

        // Switch language
        cy.get('.language-control')
            .contains('Cymraeg')
            .click();

        // Welsh language smoke tests
        cy.checkMetaTitles('Hafan | Cronfa Gymunedol y Loteri Genedlaethol');
        cy.get('@navToggle').click();
        cy.get('@nav').should('be.visible');
        cy.get('.qa-nav-link').should('contain', 'Ariannu');
        cy.get('@navToggle').click();
        cy.get('@nav').should('not.be.visible');

        // Submit micro survey (welsh)
        cy.get('.survey button:first-child').click();
        cy.get('.survey').should('contain', 'Diolch am');
    });

    it('should navigate through a funding application from the homepage', () => {
        cy.visit('/');

        // Navigate to over 10k page
        cy.get('#qa-button-over10k').click();
        cy.checkActiveSection('Funding');

        // Navigate to reaching communities page
        cy.get('#qa-button-england').click();
        cy.get('#qa-promo-card-link-reaching-communities-england').click();
        cy.checkActiveSection('Funding');

        // Interact with tabs
        cy.get('.js-tabset .js-tab').each($el => {
            cy.wrap($el)
                .click()
                .should('have.class', 'is-active');

            // Check there is only one tab active
            cy.get('.js-tabset .is-active').should('have.length', 1);

            // Check tab content is visible
            cy.get($el.attr('href')).should('be.visible');
        });

        cy.get('#section-4 .btn').click();

        const submitSelector = '.js-application-form input[type="submit"]';

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
        cy.get('.js-toggle-answer button').click();

        cy.get('.js-toggle-answer').should('have.class', 'is-active');
        cy.get('.js-toggle-answer button').should('contain', 'Show less');
        cy.get('.js-toggle-answer button').click();

        // Submit form
        cy.get(submitSelector).click();

        // Success
        cy.get('h1').should('contain', 'Thank you for submitting your idea');

        // Inline feedback
        cy.get('#js-feedback textarea').type('Test feedback');
        cy.get('#js-feedback form').submit();
        cy.get('#js-feedback').should('contain', 'Thank you for sharing');
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
            .click();

        cy.get('@materialB')
            .find('.step-control__quantity')
            .should('contain', 1);

        cy.get('@materialB')
            .find('button[value="increase"]')
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

    it('should be able to browse grants search results', () => {
        cy.visit('/funding/grants');
        cy.get('.qa-grant-result').should('have.length', 50);

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
