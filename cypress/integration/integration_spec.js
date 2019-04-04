// @ts-nocheck
const uuid = require('uuid/v4');

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
            to: 'https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+This%20is%20my%20search%20query',
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

    it('should redirect legacy funding programmes', () => {
        [
            {
                originalPath: '/global-content/programmes/england/acitve-england',
                redirectedPath: '/funding/programmes/acitve-england'
            },
            {
                originalPath: '/global-content/programmes/uk-wide/green-spaces-and-sustainable-communities',
                redirectedPath: '/funding/programmes/green-spaces-and-sustainable-communities'
            },
            {
                originalPath: '/global-content/programmes/northern-ireland/young-peoples-fund-change-ur-future',
                redirectedPath: '/funding/programmes/young-peoples-fund-change-ur-future'
            },
            {
                originalPath: '/welsh/global-content/programmes/wales/young-peoples-fund-bridging-the-gap',
                redirectedPath: '/welsh/funding/programmes/young-peoples-fund-bridging-the-gap'
            }
        ].forEach(page => {
            cy.checkRedirect({
                from: page.originalPath,
                to: page.redirectedPath
            });
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
        cy.getByText('Your username and password combination is invalid').should('exist');
        cy.checkA11y();
    });

    it('should prevent registrations with invalid passwords', () => {
        cy.visit('/user/register');
        submitForm('person@example.com', 'tooshort');
        cy.getByText('Password must be at least 10 characters long').should('exist');
    });

    it('Register, login, reset password', () => {
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
        cy.getByText('Your username and password combination is invalid').should('exist');
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
            expect(res.body.token).to.match(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/);
            expect(res.body.email.sendTo).to.equal(username);
            expect(res.body.email.subject).to.equal(
                'Activate your The National Lottery Community Fund website account'
            );
        });
    });
});

const loremLong = `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Praesentium quidem nihil, similique voluptatibus tempore quasi, cumque laborum officia voluptatem laboriosam tempora.

- Repudiandae doloremque necessitatibus
- Laudantium repellendus
- Soluta neque consequatur tenetur maiores.

Enim provident necessitatibus ipsa ad autem aliquam ducimus minima delectus exercitationem, minus blanditiis molestias quas eaque ullam ab aperiam assumenda.`;

describe.skip('awards for all', function() {
    it('happy path application', () => {
        const eligibilityStep = () => {
            cy.getByLabelText('Yes').click();
            cy.getByText('Continue').click();
        };

        cy.seedUserAndLogin().then(() => {
            cy.visit('/apply-next/simple');
            cy.getByText('New application').click();
            cy.checkA11y();
            cy.getByLabelText('What is the name of your project?', { exact: false }).type('My application');
            cy.getByLabelText('England').click();
            cy.getByText('Start application').click();

            // Eligibility Checker
            eligibilityStep();
            eligibilityStep();
            eligibilityStep();
            eligibilityStep();
            eligibilityStep();
            cy.getByText('Continue your application').click();

            cy.getByLabelText('Day').type('12');
            cy.getByLabelText('Month').type('12');
            cy.getByLabelText('Year').type('2020');
            cy.getByLabelText('What is the postcode', { exact: false }).type('B15 1TR');
            cy.checkA11y();
            cy.getByText('Continue').click();

            cy.getByLabelText('What would you like to do?', { exact: false })
                .invoke('val', loremLong)
                .trigger('change');

            cy.checkA11y();
            cy.getByText('Continue').click();

            cy.getByTestId('budget-row').within(() => {
                cy.getByLabelText('Item or activity').type('Example budget item');
                cy.getByLabelText('Amount').type('1200');
            });
            cy.getAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.getByLabelText('Item or activity').type('Example budget item 2');
                    cy.getByLabelText('Amount').type('1200');
                });
            cy.getAllByTestId('budget-row')
                .last()
                .within(() => {
                    cy.getByLabelText('Item or activity').type('Example budget item 3');
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

            cy.getByLabelText('Tell us the total cost of your project', { exact: false }).type('5000');

            cy.getByText('Continue').click();
        });
    });
});

describe('e2e', function() {
    it('should perform common interactions', () => {
        cy.visit('/');

        cy.viewport(375, 667);
        cy.closeCookieMessage();

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
        cy.closeCookieMessage();

        cy.checkA11y();
        cy.percySnapshot('homepage');

        // Navigate to over 10k page
        cy.get('#qa-button-over10k').click();
        cy.checkActiveSection('Funding');
        cy.checkA11y();

        // Navigate to reaching communities page
        cy.get('#qa-button-england').click();
        cy.get('#qa-promo-card-link-reaching-communities-england').click();
        cy.checkActiveSection('Funding');
        cy.checkA11y();

        cy.percySnapshot('reaching-communities');

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
        cy.checkA11y();
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
        cy.checkA11y();

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
        cy.closeCookieMessage();
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

    it('smoke tests', function() {
        cy.visit('/about');
        cy.checkA11y();

        cy.visit('/funding');
        cy.checkA11y();

        cy.visit('/insights');
        cy.checkA11y();

        cy.visit('/news');
        cy.checkA11y();

        cy.visit('/patterns/components');
        cy.percySnapshot('patterns');
    });
});
