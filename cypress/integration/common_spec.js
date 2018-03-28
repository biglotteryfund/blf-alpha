describe('Common tests', function() {
    it('should render basic page', function() {
        cy.visit('/');

        const metaTitle = 'Home | Big Lottery Fund';
        cy.title().should('equal', metaTitle);
        // cy.get('meta[name="title"]').should('equal', metaTitle);
        // cy.get('meta[property="og:title"]').should('equal', metaTitle);
    });
});
