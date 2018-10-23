/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount } from '@vue/test-utils';
import GrantsSort from '../grants-sort.vue';

describe('GrantsSort', () => {
    it.skip('should render', () => {
        const sort = {
            defaultSort: 'awardDate|desc',
            activeSort: 'amountAwarded|asc',
            sortOptions: [
                {
                    label: 'Most recent',
                    value: 'awardDate|desc'
                },
                {
                    label: 'Oldest first',
                    value: 'awardDate|asc'
                },
                {
                    label: 'Lowest amount first',
                    value: 'amountAwarded|asc'
                },
                {
                    label: 'Highest amount first',
                    value: 'amountAwarded|desc'
                }
            ]
        };

        const wrapper = shallowMount(GrantsSort, {
            propsData: { sort }
        });

        expect(wrapper.element).toMatchSnapshot();
    });
});
