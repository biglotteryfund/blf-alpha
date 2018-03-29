// https://on.cypress.io/custom-commands

Cypress.Commands.add('checkMetaTitles', expected => {
    cy.title().should('equal', expected);
    cy.get('meta[name="title"]').should('have.attr', 'content', expected);
    cy.get('meta[property="og:title"]').should('have.attr', 'content', expected);
});

Cypress.Commands.add('checkActiveSection', activeSection => {
    cy.get(`.qa-nav-link--${activeSection}`).should('have.class', 'is-selected');
});

Cypress.Commands.add('checkRedirect', (response, destinationPath) => {
    expect(response.status).to.eq(301);
    expect(response.redirectedToUrl).to.eq(`http://localhost:8090${destinationPath}`);
});
