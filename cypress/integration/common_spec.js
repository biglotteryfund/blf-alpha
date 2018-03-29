describe('Common tests', function() {
    it('should render basic page', () => {
        cy.visit('/');
        const metaTitle = 'Home | Big Lottery Fund';
        cy.title().should('equal', metaTitle);
        cy.get('meta[name="title"]').should('have.attr', 'content', metaTitle);
        cy.get('meta[property="og:title"]').should('have.attr', 'content', metaTitle);

        cy.checkActiveSection('toplevel');
    });

    it('should serve welsh content', () => {
        cy.visit('/welsh');

        const metaTitle = 'Hafan | Cronfa Loteri Fawr';
        cy.title().should('equal', metaTitle);
        cy.get('meta[name="title"]').should('have.attr', 'content', metaTitle);
        cy.get('meta[property="og:title"]').should('have.attr', 'content', metaTitle);

        cy.checkActiveSection('toplevel');

        cy
            .get('.qa-global-nav .qa-nav-link a')
            .first()
            .should('have.text', 'Hafan');
    });

    it('should allow contrast preferences to be set', () => {
        const redirectUrl = 'http://www.google.com/';
        cy
            .request({
                url: `/contrast/high?url=${redirectUrl}`,
                followRedirects: false
            })
            .then(response => {
                expect(response.status).to.eq(302);
                expect(response.redirectedToUrl).to.eq(redirectUrl);
                cy.getCookies().then(cookies => {
                    const contrastCookie = cookies.find(_ => _.name === 'contrastMode');
                    expect(contrastCookie.value).to.eq('high');
                });
            });
    });

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

    it('should include correct language switcher for en locale', () => {
        cy.visit('/funding/over10k');
        cy.get('.qa-lang-switcher').should('have.attr', 'href', '/welsh/funding/over10k');
    });

    it('should include correct language switcher for cy locale', () => {
        cy.visit('/welsh/funding/over10k');
        cy.get('.qa-lang-switcher').should('have.attr', 'href', '/funding/over10k');
    });

    it('should mark correct section as selected', () => {
        const sections = [
            { urlPath: '/funding', activeSection: 'funding' },
            { urlPath: '/research', activeSection: 'research' },
            { urlPath: '/about', activeSection: 'about' }
        ];

        sections.forEach(section => {
            cy.visit(section.urlPath);
            cy.checkActiveSection(section.activeSection);
        });
    });

    it('should serve a list of programmes', () => {
        cy.visit('/funding/programmes');
        cy.get('.qa-programme-card').should('have.length.greaterThan', 6);
        cy.checkActiveSection('funding');
    });
});
