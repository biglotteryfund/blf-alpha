/* eslint-env jest */
'use strict';

const { buildPagination } = require('./pagination');

describe('buildPagination', () => {
    it('should transform API pagination meta into object for views', () => {
        expect(
            buildPagination({
                total: 28,
                count: 10,
                per_page: 10,
                current_page: 1,
                total_pages: 3
            })
        ).toMatchSnapshot();

        expect(
            buildPagination({
                total: 28,
                count: 10,
                per_page: 10,
                current_page: 2,
                total_pages: 3
            })
        ).toMatchSnapshot();

        expect(
            buildPagination({
                total: 28,
                count: 10,
                per_page: 10,
                current_page: 3,
                total_pages: 3
            })
        ).toMatchSnapshot();

        // account for existing query parameters
        expect(
            buildPagination(
                {
                    total: 28,
                    count: 10,
                    per_page: 10,
                    current_page: 2,
                    total_pages: 3
                },
                { region: 'scotland' }
            )
        ).toMatchSnapshot();
    });
});
