describe('e2e', function() {
    it('should perform  common interactions', () => {
        cy.visit('/');

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
        cy
            .get('@survey')
            .find('button:first-child')
            .click();
        cy
            .get('@survey')
            .find('p')
            .should('contain', 'Thank you');

        // ================================================
        // Step: Inline feedback
        // ================================================ //

        cy.visit('/funding/past-grants');
        cy.get('#js-feedback').as('feedbackForm');
        cy
            .get('@feedbackForm')
            .find('summary')
            .click();
        cy
            .get('@feedbackForm')
            .find('textarea')
            .type('Test feedback');
        cy
            .get('@feedbackForm')
            .find('form')
            .submit();
        cy.get('@feedbackForm').should('contain', 'Thank you for sharing');
    });

    it('should navigate from homepage to funding page', () => {
        // ================================================
        // Step: Homepage
        // ================================================ //

        cy.visit('/');
        cy.checkMetaTitles('Home | Big Lottery Fund');
        cy.checkActiveSection('toplevel');

        // ================================================
        // Step: Test language switcher
        // ================================================ //

        cy.get('.qa-global-nav .qa-lang-switcher').as('langSwitcher');
        cy.get('@langSwitcher').click();
        cy.checkMetaTitles('Hafan | Cronfa Loteri Fawr');
        cy
            .get('.qa-global-nav .qa-nav-link a')
            .first()
            .should('have.text', 'Hafan');
        cy.get('@langSwitcher').click();

        // ================================================
        // Step:  Navigate to over 10k page
        // ================================================ //

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

        cy
            .get('.qa-programme-card')
            .contains('Reaching Communities')
            .click();
        cy.checkActiveSection('funding');

        // ================================================
        // Step: Interact with tabs
        // ================================================ //

        cy.get('.js-tabset .js-tab').each($el => {
            cy
                .wrap($el)
                .click()
                .should('have.class', 'tab--active');

            // Check there is only one tab active
            cy.get('.js-tabset .tab--active').should('have.length', 1);

            // Check tab content is visible
            cy.get($el.attr('href')).should('be.visible');
        });
    });

    it('should submit a basic application form', () => {
        const submitSelector = '.js-application-form input[type="submit"]';
        cy.visit('/apply/your-idea');

        // Start page
        cy.get('.btn--start').click();

        // Step 1
        cy.get('#field-your-idea').type('This is a test idea');
        cy.get(submitSelector).click();

        // Step 2
        cy.get('#field-location-1').check();
        cy.get('#field-location-3').check();
        cy.get('#field-project-location').type('Example');
        cy.get(submitSelector).click();

        // Step 3
        cy.get('#field-organisation-name').type('Test Organisation');
        cy.get(submitSelector).click();

        // Step 4
        cy.get('#field-first-name').type('Anne');
        cy.get('#field-last-name').type('Example');
        cy.get('#field-email').type('example@example.com');
        cy.get('#field-phone-number').type('0123456789');
        cy.get(submitSelector).click();

        // Review
        cy.get(submitSelector).click();

        // Success
        cy.url().should('include', '/apply/your-idea/success');
        cy.get('.form-message').should('contain', 'We have received your idea');
    });

    it('should submit materials order', () => {
        cy.visit('/funding/funding-guidance/managing-your-funding/ordering-free-materials');
        cy.get('a[href="#monolingual"]').click();

        // Select items
        cy.get('#qa-material-monolingual-2').as('materialA');
        cy.get('#qa-material-monolingual-3').as('materialB');

        cy
            .get('@materialA')
            .find('button[value="increase"]')
            .click();
        cy
            .get('@materialA')
            .find('.step-control__quantity')
            .should('contain', 1);

        cy
            .get('@materialB')
            .find('button[value="increase"]')
            .click()
            .click();
        cy
            .get('@materialB')
            .find('.step-control__quantity')
            .should('contain', 2);

        // Fill in form
        cy.get('#ff-yourName').type('Example');
        cy.get('#ff-yourEmail').type('example@example.com');
        cy.get('#ff-yourAddress1').type('1 Example Street');
        cy.get('#ff-yourTown').type('Fake town');
        cy.get('#ff-yourCountry').type('England');
        cy.get('#ff-yourPostcode').type('EC4A 1DE');
        cy.get('#ff-radio-yourReason-projectOpening').check();
        cy.get('#js-submit-material-order').click();

        // Confirm submission
        cy.get('h2').should('contain', 'Thank you for your order');
    });
});
