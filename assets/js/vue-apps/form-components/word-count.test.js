/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import faker from 'faker';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { setupI18n } from '../vue-helpers';

const localVue = createLocalVue();
const i18n = setupI18n(localVue, 'en');

import WordCount from './word-count.vue';
test('should render word count', () => {
    const wrapper = shallowMount(WordCount, {
        localVue,
        i18n,
        propsData: {
            currentText: null,
            minWords: 50,
            maxWords: 150,
            locale: 'en'
        }
    });

    expect(wrapper.vm.countWords('this is a test')).toBe(4);
    expect(wrapper.vm.countWords('this 📝 contains emoji ❤️')).toBe(5);
    expect(wrapper.vm.countWords(faker.lorem.words(100))).toBe(100);

    expect(wrapper.text()).toEqual(`0 / 150 words Must be at least 50 words.`);

    wrapper.setProps({ currentText: faker.lorem.words(10) });
    expect(wrapper.text()).toContain(
        `10 / 150 words Must be at least 50 words.`
    );

    wrapper.setProps({ currentText: faker.lorem.words(50) });
    expect(wrapper.text()).toContain(`50 / 150 words`);

    wrapper.setProps({ currentText: faker.lorem.words(175) });
    expect(wrapper.text()).toContain(
        '175 / 150 words You have 25 words too many.'
    );
});
