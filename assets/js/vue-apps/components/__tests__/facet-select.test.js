/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { mount } from '@vue/test-utils';
import FacetSelect from '../facet-select.vue';

describe('FacetSelect', () => {
    it('should render with plain options', () => {
        const wrapper = mount(FacetSelect, {
            propsData: {
                name: 'example',
                label: 'Example',
                clearLabel: 'Clear selection',
                value: 'option-1',
                options: [
                    {
                        label: 'Option 1',
                        value: 'option-1'
                    },
                    {
                        label: 'Option 2',
                        value: 'option-2'
                    }
                ]
            }
        });

        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render with optgroup', () => {
        const wrapper = mount(FacetSelect, {
            propsData: {
                name: 'example',
                label: 'Example',
                clearLabel: 'Clear selection',
                options: {
                    'Group 1': [
                        {
                            label: 'Option 1',
                            value: 'option-1'
                        },
                        {
                            label: 'Option 2',
                            value: 'option-2'
                        }
                    ],
                    'Group 2': [
                        {
                            label: 'Option 3',
                            value: 'option-2'
                        },
                        {
                            label: 'Option 4',
                            value: 'option-4'
                        }
                    ]
                }
            }
        });

        expect(wrapper.element).toMatchSnapshot();
    });
});
