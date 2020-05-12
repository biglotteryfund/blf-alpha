/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { setupI18n } from '../vue-helpers';
import BudgetInput from './budget-input.vue';
import times from 'lodash/times';
import faker from 'faker';

const localVue = createLocalVue();
const i18n = setupI18n(localVue, 'en');

function checkItemCount(wrapper, count) {
    expect(wrapper.findAll('[data-testid="budget-row"]').length).toBe(count);
}

test('should be able to add items up to max limit', async function () {
    const maxItems = 10;
    const maxBudget = 10000;
    const minBudget = 300;
    const wrapper = shallowMount(BudgetInput, {
        localVue,
        i18n,
        propsData: {
            fieldName: 'budget',
            minBudget: minBudget,
            maxBudget: maxBudget,
            maxItems: maxItems,
        },
    });

    async function addItem(description, amount) {
        const row = wrapper.find('[data-testid="budget-row"]:last-child');
        row.find('input[type="text"]').setValue(description);
        row.find('input[type="number"]').setValue(amount);
        await localVue.nextTick();
    }

    function checkTotal(amount) {
        expect(wrapper.find('[data-testid="budget-total"]').text()).toContain(
            amount
        );
    }

    function checkWarning(partialMessage) {
        expect(wrapper.find('[data-testid="budget-errors"]').text()).toContain(
            partialMessage
        );
    }

    checkItemCount(wrapper, 1);
    await addItem('My thing 1', 100);

    await addItem('My thing 2', 100);
    await addItem('My thing 3', 50);
    checkTotal('£250');
    checkItemCount(wrapper, 4);

    await addItem('My thing 4', 250);
    await addItem('My thing 5', 750);
    await addItem('My thing 6', 1500);
    await addItem('My thing 7', 1250);
    await addItem('My thing 8', 500);
    checkItemCount(wrapper, 9);
    checkTotal('£4,500');

    await addItem('My thing 9', 6000);
    checkItemCount(wrapper, 10);
    checkTotal('£10,500');
    checkWarning(`£${maxBudget.toLocaleString()}.`);

    // Reach limit
    await addItem('My thing 10', 500);
    checkItemCount(wrapper, 10);
    checkTotal('£11,000');
    checkWarning(`${maxItems}`);
});

test('should not add new rows when loading a completed budget', () => {
    const maxItems = 10;
    const maxBudget = 10000;
    const minBudget = 300;

    const budgetData = times(10, () => ({
        item: faker.lorem.words(5),
        cost: 123,
    }));

    const wrapper = shallowMount(BudgetInput, {
        localVue,
        i18n,
        propsData: {
            fieldName: 'budget',
            minBudget: minBudget,
            maxBudget: maxBudget,
            maxItems: maxItems,
            budgetData: budgetData,
        },
    });

    checkItemCount(wrapper, 10);
});
