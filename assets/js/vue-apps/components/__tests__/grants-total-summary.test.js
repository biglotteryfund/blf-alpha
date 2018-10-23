/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { mount } from '@vue/test-utils';
import GrantsTotalSummary from '../grants-total-summary.vue';

describe('GrantsTotalSummary', () => {
    it('should render', () => {
        const wrapper = mount(GrantsTotalSummary, {
            // https://github.com/vuejs/vue-test-utils/issues/918
            context: {
                props: {
                    totalResults: 190000,
                    totalAwarded: 123456789
                }
            }
        });

        expect(wrapper.element).toMatchSnapshot();
    });
});
