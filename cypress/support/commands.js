// @ts-nocheck
// https://on.cypress.io/custom-commands

import '@percy/cypress';

Cypress.Commands.add('getCsrf', () => {
    return cy
        .request('/user/login')
        .its('body')
        .then(body => {
            const $html = Cypress.$(body);
            return $html.find('input[name=_csrf]').val();
        });
});

Cypress.Commands.add('seedUser', () => {
    return cy.request('POST', '/tools/seed/user').its('body');
});

Cypress.Commands.add('loginUser', ({ username, password }) => {
    return cy.getCsrf().then(csrfToken => {
        return cy.request({
            method: 'POST',
            url: '/user/login',
            form: true,
            body: {
                _csrf: csrfToken,
                username: username,
                password: password
            }
        });
    });
});

Cypress.Commands.add('registerUser', ({ username, password, returnToken }) => {
    return cy.getCsrf().then(csrfToken => {
        const formBody = {
            _csrf: csrfToken,
            username: username,
            password: password
        };

        if (returnToken) {
            formBody.returnToken = returnToken;
        }

        return cy.request({
            method: 'POST',
            url: '/user/register',
            failOnStatusCode: false,
            followRedirects: false,
            form: true,
            body: formBody
        });
    });
});

Cypress.Commands.add('checkMetaTitles', expected => {
    cy.title().should('equal', expected);
    cy.get('meta[name="title"]').should('have.attr', 'content', expected);
    cy.get('meta[property="og:title"]').should('have.attr', 'content', expected);
});

Cypress.Commands.add('checkActiveSection', label => {
    cy.get(`#global-nav .is-current a`).should('have.length', 1);
    cy.get(`#global-nav .is-current a`).should('contain', label);
});

Cypress.Commands.add('checkRedirect', ({ from, to, isRelative = true, status = 301 }) => {
    cy.request({
        url: from,
        followRedirects: false
    }).then(response => {
        const expected = isRelative ? `http://localhost:8090${to}` : to;
        expect(response.status).to.eq(status);
        expect(response.redirectedToUrl).to.eq(expected);
    });
});

Cypress.Commands.add('uiRegisterUser', (username, password) => {
    cy.get('#field-username').type(username, { delay: 0 });
    cy.get('#field-password').type(password, { delay: 0 });
    cy.get('input[type="submit"]').click();
});

Cypress.Commands.add('closeCookieMessage', () => {
    cy.get('.cookie-consent button').click();
});
