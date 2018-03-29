describe('Programme tests', function() {
    it('should serve a list of programmes', () => {
        cy.visit('/funding/programmes');
        cy.get('.qa-programme-card').should('have.length.greaterThan', 6);
        cy.checkActiveSection('funding');
    });
});
