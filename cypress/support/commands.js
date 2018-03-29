// https://on.cypress.io/custom-commands

Cypress.Commands.add('checkActiveSection', activeSection => {
    cy.get(`.qa-nav-link--${activeSection}`).should('have.class', 'is-selected');
});
