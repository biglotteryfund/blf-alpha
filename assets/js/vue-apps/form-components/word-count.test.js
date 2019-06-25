/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount } from '@vue/test-utils';
import WordCount from './word-count.vue';
import faker from 'faker';

describe('WordCount', () => {
    it('should render', () => {
        const wrapper = shallowMount(WordCount, {
            propsData: {
                currentText: null,
                minWords: 10,
                maxWords: 150,
                recommendedWords: 100,
                locale: 'en'
            }
        });

        expect(wrapper.vm.countWords('this is a test')).toBe(4);
        expect(wrapper.vm.countWords('this 📝 contains emoji ❤️')).toBe(5);
        expect(wrapper.vm.countWords(faker.lorem.words(100))).toBe(100);
    });

    it('should render word count', () => {
        const wrapper = shallowMount(WordCount, {
            propsData: {
                currentText: null,
                minWords: 50,
                maxWords: 150,
                recommendedWords: 100,
                locale: 'en'
            }
        });

        expect(wrapper.text()).toEqual(
            `0 / 150 words Must be at least 50 words. You can write up to 150 words for this section, but don't worry if you use less.`
        );

        wrapper.setProps({ currentText: faker.lorem.words(10) });
        expect(wrapper.text()).toContain(
            `10 / 150 words Must be at least 50 words. You can write up to 150 words for this section, but don't worry if you use less.`
        );

        wrapper.setProps({ currentText: faker.lorem.words(50) });
        expect(wrapper.text()).toContain(
            `50 / 150 words You can write up to 150 words for this section, but don't worry if you use less.`
        );

        wrapper.setProps({ currentText: faker.lorem.words(175) });
        expect(wrapper.text()).toContain(
            '175 / 150 words You have 25 words too many.'
        );
    });
});
