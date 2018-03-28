describe('Common tests', function() {
    it('should render basic page', () => {
        cy.visit('/');
        const metaTitle = 'Home | Big Lottery Fund';
        cy.title().should('equal', metaTitle);
        cy.get('meta[name="title"]').should('have.attr', 'content', metaTitle);
        cy.get('meta[property="og:title"]').should('have.attr', 'content', metaTitle);
    });

    it('should mark correct section as selected', () => {
        const sections = [
            { urlPath: '/', activeSection: 'toplevel' },
            { urlPath: '/funding', activeSection: 'funding' },
            { urlPath: '/research', activeSection: 'research' },
            { urlPath: '/about', activeSection: 'about' },
            { urlPath: '/funding/programmes', activeSection: 'funding' }
        ];

        sections.forEach(section => {
            cy.visit(section.urlPath);
            cy.get(`.qa-nav-link--${section.activeSection}`).should('have.class', 'is-selected');
        });
    });

    it('should serve welsh content', () => {
        cy.request('/welsh').then(response => {
            expect(response.status).to.eq(200);
            expect(response.headers['content-language']).to.eq('cy');
            cy.log(response.headers['content-language']);
        });

        cy.visit('/welsh');

        const metaTitle = 'Hafan | Cronfa Loteri Fawr';
        cy.title().should('equal', metaTitle);
        cy.get('meta[name="title"]').should('have.attr', 'content', metaTitle);
        cy.get('meta[property="og:title"]').should('have.attr', 'content', metaTitle);

        const navLinksText = [];
        cy
            .get('.qa-global-nav .qa-nav-link a')
            .each(el => {
                navLinksText.push(el.text());
            })
            .then(() => {
                expect(navLinksText).to.have.members(['Hafan', 'Ariannu', 'Ymchwil', 'Amdanom ni']);
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

    it('should serve a list of programmes', () => {
        cy.visit('/funding/programmes');
        cy.get('.qa-programme-card').should('have.length.greaterThan', 6);
    });
});
