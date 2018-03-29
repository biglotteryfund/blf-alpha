describe('Search tests', function() {
    it('should redirect search queries to a google site search', () => {
        cy
            .request({
                url: '/search?q=This is my search query',
                followRedirects: false
            })
            .then(response => {
                expect(response.status).to.eq(302);
                expect(response.redirectedToUrl).to.eq(
                    'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+This%20is%20my%20search%20query'
                );
            });
    });

    it('should redirect legacy site search queries to google site search', () => {
        cy
            .request({
                url: '/search?lang=en-GB&amp;q=something&amp;type=All&amp;order=r',
                followRedirects: false
            })
            .then(response => {
                expect(response.status).to.eq(302);
                expect(response.redirectedToUrl).to.eq(
                    'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+something'
                );
            });
    });
});
