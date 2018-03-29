describe('Common tests', function() {
    it('correctly renders an english language page', () => {
        cy.visit('/funding/programmes/national-lottery-awards-for-all-wales');

        // Check metadata
        cy.checkMetaTitles('National Lottery Awards for All Wales | Big Lottery Fund');

        // Check active section
        cy.checkActiveSection('funding');

        // Check language switcher
        cy
            .get('.qa-lang-switcher')
            .should('have.attr', 'href', '/welsh/funding/programmes/national-lottery-awards-for-all-wales');
    });

    it('correctly renders a welsh language page', () => {
        cy.visit('/welsh/funding/programmes/national-lottery-awards-for-all-wales');

        // Check metadata
        cy.checkMetaTitles('Arian i Bawb y Loteri Genedlaethol Cymru | Cronfa Loteri Fawr');

        // Check active section
        cy.checkActiveSection('funding');

        // Check language switcher
        cy
            .get('.qa-lang-switcher')
            .should('have.attr', 'href', '/funding/programmes/national-lottery-awards-for-all-wales');

        // Check navigation is translated
        cy
            .get('.qa-global-nav .qa-nav-link a')
            .first()
            .should('have.text', 'Hafan');
    });

    it('marks correct section as selected', () => {
        const sections = [
            { urlPath: '/', activeSection: 'toplevel' },
            { urlPath: '/funding', activeSection: 'funding' },
            { urlPath: '/research', activeSection: 'research' },
            { urlPath: '/about', activeSection: 'about' }
        ];

        sections.forEach(section => {
            cy.visit(section.urlPath);
            cy.checkActiveSection(section.activeSection);
        });
    });
});
