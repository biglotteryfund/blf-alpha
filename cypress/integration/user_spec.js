Cypress.Commands.add('uiRegisterUser', (username, password) => {
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    cy.get('input[type="submit"]').click();
});

describe('User login and registration', function() {
    it('should allow users to register', () => {
        cy.visit('/user/register');
        const now = Date.now();
        const username = `${now}@example.com`;
        cy.uiRegisterUser(username, now);
    });

    it('should not allow unknown users to login', () => {
        cy.visit('/user/login');
        cy.uiRegisterUser('person@example.com', 'badpassword');
        cy.get('.alert').contains('Your username and password combination is invalid');
    });

    it('should prevent registrations with invalid passwords', () => {
        cy.visit('/user/register');
        cy.uiRegisterUser('person@example.com', 'badpassword');
        cy.get('.alert').contains('Please provide a password that contains at least one number');
    });

    it('should email valid users with a token', () => {
        const now = Date.now();
        const username = `${now}@example.com`;
        cy
            .registerUser({
                username: username,
                password: `password${now}`,
                returnToken: true
            })
            .then(res => {
                // via https://github.com/auth0/node-jsonwebtoken/issues/162
                expect(res.body.token).to.match(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/);
                expect(res.body.email.sendTo).to.equal(username);
                expect(res.body.email.subject).to.equal('Activate your Big Lottery Fund website account');
            });
    });
});
