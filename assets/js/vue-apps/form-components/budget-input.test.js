/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { mount } from '@vue/test-utils';
import BudgetInput from './budget-input.vue';

describe('BudgetInput', () => {
    test('should be able to add items up to max limit', () => {
        const maxItems = 10;
        const maxBudget = 10000;
        const minBudget = 300;
        const wrapper = mount(BudgetInput, {
            attachToDocument: true,
            propsData: {
                fieldName: 'budget',
                minBudget: minBudget,
                maxBudget: maxBudget,
                maxItems: maxItems
            }
        });

        function addItem(description, amount) {
            const row = wrapper.find('[data-testid="budget-row"]:last-child');
            row.find('input[type="text"]').setValue(description);
            row.find('input[type="number"]').setValue(amount);
        }

        function checkItemCount(count) {
            expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(
                count
            );
        }

        function checkTotal(amount) {
            expect(
                wrapper.find('[data-testid="budget-total"]').text()
            ).toContain(amount);
        }

        function checkWarning(partialMessage) {
            expect(
                wrapper.find('[data-testid="budget-errors"]').text()
            ).toContain(partialMessage);
        }

        checkItemCount(1);
        addItem('My thing 1', 100);
        addItem('My thing 2', 100);
        addItem('My thing 3', 50);
        checkTotal('£250');
        checkItemCount(4);

        // Under-budget
        checkWarning(`Project costs must be greater than £${minBudget}.`);

        addItem('My thing 4', 250);
        addItem('My thing 5', 750);
        addItem('My thing 6', 1500);
        addItem('My thing 7', 1250);
        addItem('My thing 8', 500);
        checkItemCount(9);
        checkTotal('£4,500');

        addItem('My thing 9', 6000);
        checkItemCount(10);
        checkTotal('£10,500');
        checkWarning(
            `Project costs must be less than £${maxBudget.toLocaleString()}.`
        );

        // Reach limit
        addItem('My thing 10', 500);
        checkItemCount(10);
        checkTotal('£11,000');
        checkWarning(`You must use ${maxItems} budget headings or fewer`);
    });
});
