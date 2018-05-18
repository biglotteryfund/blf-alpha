describe('Materials tests', function() {
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
        cy.get('#field-yourName').type('Example');
        cy.get('#field-yourEmail').type('example@example.com');
        cy.get('#field-yourAddress1').type('1 Example Street');
        cy.get('#field-yourTown').type('Fake town');
        cy.get('#field-yourCountry').type('England');
        cy.get('#field-yourPostcode').type('EC4A 1DE');
        cy.get('#field-yourGrantAmount-2').check();
        cy.get('#field-yourReason-2').check();

        // Confirm submission
        cy.get('#js-submit-material-order').click();
        cy.get('h2').should('contain', 'Thank you for your order');
    });
});
