describe('Legacy pages', () => {
    it('should redirect old funding finder', () => {
        const pages = [
            {
                originalPath: '/funding/funding-finder',
                redirectedPath: '/funding/programmes'
            },
            {
                originalPath: '/Home/Funding/Funding Finder',
                redirectedPath: '/funding/programmes'
            },
            {
                originalPath: '/funding/funding-finder?area=northern+ireland',
                redirectedPath: '/funding/programmes?location=northernIreland'
            },
            {
                originalPath: '/funding/funding-finder?area=England&amount=up to 10000',
                redirectedPath: '/funding/programmes?location=england&max=10000'
            },
            {
                originalPath: '/funding/funding-finder?area=Scotland&amp;amount=10001%20-%2050000',
                redirectedPath: '/funding/programmes?location=scotland&min=10000'
            },
            {
                originalPath: '/funding/funding-finder?cpage=1&area=uk-wide',
                redirectedPath: '/funding/programmes?location=ukWide'
            },
            {
                originalPath:
                    '/funding/funding-finder?area=Wales&amp;amount=up to 10000&amp;org=Voluntary or community organisation',
                redirectedPath: '/funding/programmes?location=wales&max=10000'
            }
        ];

        pages.forEach(page => {
            cy.checkRedirect({
                from: page.originalPath,
                to: page.redirectedPath
            });
        });
    });

    it('should proxy old funding finder if requesting closed programmes', () => {
        cy.request('/funding/funding-finder?area=England&amp;amount=500001 - 1000000&amp;sc=1').then(response => {
            expect(response.headers['x-blf-legacy']).to.eq('true');
            expect(response.body).to.include('This is a list of our funding programmes');
            expect(response.body).to.include('Show closed programmes');
        });
    });

    it('should redirect archived pages to the national archives', () => {
        const urlPath = '/funding/funding-guidance/applying-for-funding/aims-and-outcomes';
        cy.checkRedirect({
            from: urlPath,
            to: `http://webarchive.nationalarchives.gov.uk/*/https://www.biglotteryfund.org.uk${urlPath}`,
            isRelative: false
        });
    });

    it('Should redirect top-level ~/link.aspx urls', () => {
        cy.checkRedirect({
            from: '/~/link.aspx?_id=50fab7d4b5a248f8a8c8f5d4d33f9e0f&_z=z',
            to: '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding'
        });
    });

    it('Should redirect wildcard ~/link.aspx urls', () => {
        cy.checkRedirect({
            from: '/global-content/programmes/england/~/link.aspx?_id=50FAB7D4B5A248F8A8C8F5D4D33F9E0F&_z=z',
            to: '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding'
        });
    });

    it('should follow redirects on the legacy site', () => {
        cy.checkRedirect({
            from: '/welshlanguage',
            to: '/about-big/customer-service/welsh-language-scheme'
        });
    });

    it('should serve welsh versions of legacy pages', () => {
        cy.visit('/welsh/research/communities-and-places');
        cy.title().should('include', 'Cymunedau a lleoedd');
    });
});
