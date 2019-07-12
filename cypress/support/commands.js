// @ts-nocheck
// https://on.cypress.io/custom-commands

/**
 * Percy commands
 * @see https://github.com/percy/percy-cypress
 */
import '@percy/cypress';

/**
 * Cypress testing library
 * @see https://github.com/kentcdodds/cypress-testing-library
 */
import '@testing-library/cypress/add-commands';

/**
 * File upload support
 * @see https://github.com/abramenal/cypress-file-upload
 * @see https://github.com/cypress-io/cypress/issues/170
 */
import 'cypress-file-upload';

Cypress.Commands.add(
    'checkRedirect',
    ({ from, to, isRelative = true, status = 301 }) => {
        cy.request({
            url: from,
            followRedirects: false
        }).then(response => {
            const expected = isRelative ? `http://localhost:8090${to}` : to;
            expect(response.status).to.eq(status);
            expect(response.redirectedToUrl).to.eq(expected);
        });
    }
);

Cypress.Commands.add('getCsrf', () => {
    return cy
        .request('/user/login')
        .its('body')
        .then(body => {
            const $html = Cypress.$(body);
            return $html.find('input[name=_csrf]').val();
        });
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

Cypress.Commands.add('seedAndLogin', () => {
    return cy
        .request('POST', '/user/seed')
        .its('body')
        .then(newUser => {
            return cy.loginUser({
                username: newUser.username,
                password: newUser.password
            });
        });
});

Cypress.Commands.add('registerUser', function({
    username,
    password,
    returnToken = false
}) {
    return cy.getCsrf().then(csrfToken => {
        const formBody = {
            _csrf: csrfToken,
            username: username,
            password: password,
            passwordConfirmation: password
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

/**
 * A11y check with axe-core
 * @see https://github.com/avanslaars/cypress-axe
 */
Cypress.Commands.add('checkA11y', ({ context, options } = {}) => {
    cy.window({ log: false }).then(window => {
        if (window.axe === undefined) {
            const axe = require('axe-core');
            window.eval(axe.source);
        }
    });

    cy.window({ log: false })
        .then(window => {
            return window.axe.run(context || window.document, options);
        })
        .then(({ violations }) => {
            if (violations.length) {
                cy.log(violations);
                cy.wrap(violations, { log: true }).each(v => {
                    Cypress.log({
                        name: 'a11y error!',
                        consoleProps: () => v,
                        message: `${v.id} on ${v.nodes.length} Node${
                            v.nodes.length === 1 ? '' : 's'
                        }`
                    });
                });
            }
            return cy.wrap(violations, { log: false });
        })
        .then(violations => {
            assert.equal(
                violations.length,
                0,
                `${violations.length} accessibility violation${
                    violations.length === 1 ? '' : 's'
                } ${violations.length === 1 ? 'was' : 'were'} detected`
            );
        });
});
