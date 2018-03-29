describe('Interaction tests', function() {
    it('interact with mobile navigation', () => {
        cy.viewport(375, 667);
        cy.visit('/');

        cy.get('#js-mobile-nav-toggle').as('navToggle');
        cy.get('#qa-offscreen-navigation').as('nav');

        cy.get('@navToggle').click();
        cy.get('@nav').should('be.visible');

        cy.wait(200);
        cy.get('@navToggle').click();
        cy.get('@nav').should('not.be.visible');
    });

    it('interact with tabs', () => {
        cy.visit('/funding/programmes/national-lottery-awards-for-all-england');
        cy.get('.js-tabset .js-tab').each($el => {
            cy.log($el.attr('href'));

            // Click the tab and check it is active
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
