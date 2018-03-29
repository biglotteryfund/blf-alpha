// https://on.cypress.io/custom-commands

Cypress.Commands.add('checkMetaTitles', expected => {
    cy.title().should('equal', expected);
    cy.get('meta[name="title"]').should('have.attr', 'content', expected);
    cy.get('meta[property="og:title"]').should('have.attr', 'content', expected);
});

Cypress.Commands.add('checkActiveSection', activeSection => {
    cy.get(`.qa-nav-link--${activeSection}`).should('have.class', 'is-selected');
});

Cypress.Commands.add('checkRedirect', ({ from, to, isRelative = true, status = 301 }) => {
    cy
        .request({
            url: from,
            followRedirects: false
        })
        .then(response => {
            const expected = isRelative ? `http://localhost:8090${to}` : to;
            expect(response.status).to.eq(status);
            expect(response.redirectedToUrl).to.eq(expected);
        });
});
