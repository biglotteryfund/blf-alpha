/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount } from '@vue/test-utils';
import FacetGroup from '../facet-group.vue';

describe('FacetGroup', () => {
    it('should render', () => {
        const wrapper = shallowMount(FacetGroup, {
            propsData: {
                id: 'test',
                legend: 'Testing'
            },
            slots: {
                default: '<div class="fake-msg"></div>'
            }
        });

        const div = wrapper.find('.facet-group');

        expect(wrapper.isVueInstance()).toBeTruthy();
        expect(div.exists()).toBeTruthy();

        wrapper.setData({ isOpen: true });

        expect(div.classes()).toContain('is-open');
    });
});
