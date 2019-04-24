/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { mount } from '@vue/test-utils';
import { times } from 'lodash';
import BudgetInput from './budget-input.vue';

describe('BudgetInput', () => {
    test('should be able to add items up to max limit', () => {
        const maxItems = 10;
        const wrapper = mount(BudgetInput, {
            attachToDocument: true,
            propsData: { fieldName: 'budget', maxBudget: 500, maxItems: maxItems }
        });

        expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(1);

        times(maxItems - 2, index => {
            const row = wrapper.find('[data-testid="budget-row"]:last-child');
            row.find('input[type="text"]').setValue(`My thing ${index + 1}`);
            row.find('input[type="number"]').setValue(50);
        });

        expect(wrapper.find('[data-testid="budget-total"]').text()).toContain('£400');
        expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(9);

        // Reach limit
        const lastRow = wrapper.find('[data-testid="budget-row"]:last-child');
        lastRow.find('input[type="text"]').setValue(`One more thing`);

        expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(10);
        expect(wrapper.find('[data-testid="budget-errors"]').text()).toContain(
            'You have added the maximum number of budget rows available'
        );

        // Over-budget
        lastRow.find('input[type="number"]').setValue(1000);
        expect(wrapper.find('[data-testid="budget-errors"]').text()).toContain('You have exceeded the budget limit');

        // Can't exceed limit
        wrapper
            .find('[data-testid="budget-row"]:last-child')
            .find('input[type="text"]')
            .setValue(`One more thing`);
        expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(10);
    });
});
