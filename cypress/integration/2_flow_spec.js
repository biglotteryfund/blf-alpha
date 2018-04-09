describe('Core funding flow', function() {
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
});
