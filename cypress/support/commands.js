// @ts-nocheck
// https://on.cypress.io/custom-commands

import '@percy/cypress';
import 'cypress-testing-library/add-commands';

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

Cypress.Commands.add('closeCookieMessage', () => {
    cy.get('.cookie-consent button').click();
});

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

Cypress.Commands.add('seedUserAndLogin', () => {
    return cy.seedUser().then(newUser => {
        return cy.loginUser({ username: newUser.username, password: newUser.password });
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

// @see https://github.com/avanslaars/cypress-axe
Cypress.Commands.add('checkA11y', () => {
    cy.window({ log: false }).then(window => {
        if (window.axe === undefined) {
            const axe = require('axe-core');
            window.eval(axe.source);
        }
    });

    cy.window({ log: false })
        .then(window => {
            return window.axe.run(
                {
                    include: window.document,
                    exclude: [['iframe']]
                },
                {
                    rules: {
                        // @TODO: Review and re-enable this
                        'color-contrast': { enabled: false },
                        // New ARIA complementary rule. Review and then re-enable
                        'landmark-complementary-is-top-level': { enabled: false }
                    }
                }
            );
        })
        .then(({ violations }) => {
            if (violations.length) {
                cy.log(violations);
                cy.wrap(violations, { log: true }).each(v => {
                    Cypress.log({
                        name: 'a11y error!',
                        consoleProps: () => v,
                        message: `${v.id} on ${v.nodes.length} Node${v.nodes.length === 1 ? '' : 's'}`
                    });
                });
            }
            return cy.wrap(violations, { log: false });
        })
        .then(violations => {
            assert.equal(
                violations.length,
                0,
                `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${
                    violations.length === 1 ? 'was' : 'were'
                } detected`
            );
        });
});
