describe('Common tests', function() {
    it('should have common headers', () => {
        cy.request('/').then(response => {
            expect(response.headers['cache-control']).to.eq('max-age=30,s-maxage=300');
        });

        cy.request('/apply/your-idea/1').then(response => {
            expect(response.headers['cache-control']).to.eq('no-store,no-cache,max-age=0');
        });
    });

    it('should handle aliases', () => {
        cy
            .request('/tools/seed/aliases-sample')
            .its('body')
            .then(aliases => {
                aliases.forEach(alias => {
                    cy.checkRedirect({
                        from: alias.from,
                        to: alias.to
                    });
                });
            });
    });

    it('should 404 unknown routes', () => {
        cy
            .request({
                url: '/not-a-page',
                failOnStatusCode: false
            })
            .then(response => {
                expect(response.status).to.eq(404);
                expect(response.body).to.include("Sorry, we couldn't find that page");
            });
    });

    it('should redirect search queries to a google site search', () => {
        cy.checkRedirect({
            from: '/search?q=This is my search query',
            to: 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+This%20is%20my%20search%20query',
            isRelative: false,
            status: 302
        });

        cy.checkRedirect({
            from: '/search?lang=en-GB&amp;q=something&amp;type=All&amp;order=r',
            to: 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+something',
            isRelative: false,
            status: 302
        });
    });

    it('should redirect archived pages to the national archives', () => {
        const urlPath = '/funding/funding-guidance/applying-for-funding/aims-and-outcomes';
        cy.checkRedirect({
            from: urlPath,
            to: `http://webarchive.nationalarchives.gov.uk/https://www.biglotteryfund.org.uk${urlPath}`,
            isRelative: false
        });
    });
});
