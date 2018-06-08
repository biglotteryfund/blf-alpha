describe('e2e', function() {
    it('should navigate from homepage to funding page', () => {
        // Start on homepage
        cy.viewport(375, 667);
        cy.visit('/');

        cy.get('#js-mobile-nav-toggle').as('navToggle');
        cy.get('#qa-offscreen-navigation').as('nav');

        cy.get('@navToggle').click();
        cy.get('@nav').should('be.visible');

        cy.get('@navToggle').click();
        cy.get('@nav').should('not.be.visible');

        cy.checkMetaTitles('Home | Big Lottery Fund');

        cy.checkActiveSection('toplevel');

        // Navigate to over 10k page
        cy.get('#qa-button-over10k').click();
        cy.checkActiveSection('funding');

        // Navigate to funding programmes list for England
        cy.get('#qa-button-england').click();
        cy.checkActiveSection('funding');

        // Navigate to funding programme
        cy
            .get('.qa-programme-card')
            .contains('Reaching Communities')
            .click();

        cy.viewport(1024, 768);
        // Click the tab and check it is active
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

    it('basic application form', () => {
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

    it('should allow feedback submissions', () => {
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
});
