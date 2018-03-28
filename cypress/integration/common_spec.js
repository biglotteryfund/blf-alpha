describe('Interaction tests', function() {
    it('should toggle mobile navigation', function() {
        cy.viewport(320, 480);
        cy.visit('/');
        cy.get('#js-mobile-nav-toggle').click();
        cy.get('#qa-offscreen-navigation').should('be.visible');
    });
});
