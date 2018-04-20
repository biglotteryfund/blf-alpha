describe('Application tests', function() {
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
});
