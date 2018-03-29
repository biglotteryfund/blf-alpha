describe('Server tests', function() {
    it('should redirect trailing slashes', () => {
        const pages = [
            {
                originalPath: '/funding/',
                redirectedPath: '/funding'
            },
            {
                originalPath: '/funding/programmes/?location=wales',
                redirectedPath: '/funding/programmes?location=wales'
            }
        ];

        pages.forEach(page => {
            cy
                .request({
                    url: page.originalPath,
                    followRedirect: false
                })
                .then(response => {
                    cy.checkRedirect(response, page.redirectedPath);
                });
        });
    });

    it('should serve static files', () => {
        cy.request('/assets/images/favicon/apple-icon.png').then(response => {
            expect(response.status).to.eq(200);
            expect(response.headers['content-type']).to.match(/^image\/png/);
        });
    });

    it('should redirect trailing slashes', () => {
        const pages = [
            {
                originalPath: '/a4aengland',
                redirectedPath: '/funding/programmes/national-lottery-awards-for-all-england'
            },
            {
                originalPath: '/funding/funding-guidance',
                redirectedPath: '/funding'
            }
        ];

        pages.forEach(page => {
            cy
                .request({
                    url: page.originalPath,
                    followRedirect: false
                })
                .then(response => {
                    cy.checkRedirect(response, page.redirectedPath);
                });
        });
    });

    it('should pass unknown routes to the legacy site', () => {
        cy.visit('/about-big/publications/corporate-documents');
        cy.title().should('include', 'Corporate documents: About - Big Lottery Fund');
    });

    it('should 404 everything else', () => {
        cy
            .request({
                url: '/foo/bar',
                failOnStatusCode: false
            })
            .then(response => {
                expect(response.status).to.eq(404);
                expect(response.body).to.include('Error 404 | Big Lottery Fund');
            });
    });
});
