/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount } from '@vue/test-utils';
import WordCount from '../word-count.vue';
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

    // it('should render word count', () => {
    //     const wrapper = shallowMount(WordCount, {
    //         propsData: { currentText: null, maxWords: 10, locale: 'en' }
    //     });

    //     expect(wrapper.text()).toContain('0 / 10 words');
    //     wrapper.setProps({ currentText: 'this is a test' });
    //     expect(wrapper.text()).toContain('4 / 10 words');
    //     wrapper.setProps({ currentText: 'this current text is exactly ten words and no more' });
    //     expect(wrapper.text()).toContain('10 / 10 words');
    //     wrapper.setProps({ currentText: 'this current text is over the specified limit by a couple of words.' });
    //     expect(wrapper.text()).toContain('You have 3 words too many');
    // });
});
