describe('CMS Tools', function() {
    it('should block access to staff-only tools', () => {
        cy.checkRedirect({
            from: '/tools/survey-results',
            to: '/user/login',
            status: 302
        });
    });

    it('should not allow unauthorised access to staff-only tools', () => {
        cy
            .loginUser({
                username: 'bad@example.com',
                password: 'notarealpassword'
            })
            .then(res => {
                expect(res.body).to.contain('Your username and password combination is invalid');
            });
    });

    it('should allow authorised access to staff-only tools', () => {
        cy.seedUser().then(currentUser => {
            cy.loginUser({
                username: currentUser.username,
                password: currentUser.password
            });

            cy.visit('/tools/survey-results');
            cy.get('h1').should('contain', 'All survey results');
        });
    });
});
