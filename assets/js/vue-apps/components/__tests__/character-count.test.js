/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import { shallowMount } from '@vue/test-utils';
import CharacterCount from '../character-count.vue';

describe('CharacterCount', () => {
    it('should render', () => {
        const wrapper = shallowMount(CharacterCount, {
            propsData: { currentText: null, maxWords: 10, locale: 'en' }
        });

        expect(wrapper.vm.count('this is a test')).toBe(4);
        expect(wrapper.vm.count('this 📝 contains emoji ❤️')).toBe(5);
        expect(
            wrapper.vm.count(`
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur, esse voluptas. Aspernatur explicabo quia suscipit itaque non nisi consequuntur tempore. Voluptas suscipit iure dolorum ipsam illo, temporibus incidunt sapiente deserunt.

    Ut ducimus eos possimus animi doloremque quasi fuga quis nisi, nesciunt minus cupiditate quidem. Aspernatur voluptas temporibus ducimus amet corrupti, culpa eius eaque, iste cumque sequi rerum fugit sunt est.
    
    Necessitatibus modi eius fugit inventore animi culpa saepe unde hic delectus incidunt quibusdam nisi magnam, nesciunt obcaecati totam sapiente corporis fugiat magni amet. Nesciunt dicta, doloremque nulla reiciendis nemo eum!
    
    A ut eum unde ullam quaerat ipsa sit eaque minima, maiores reprehenderit iusto hic nihil, fugit dolor, voluptate error porro nisi amet odio aliquid. Accusamus, quia. Rerum laborum repellat dignissimos.
    
    Magni recusandae modi doloremque enim amet culpa, facilis dolores architecto reiciendis nihil, iure voluptatibus delectus aperiam? Incidunt saepe, rerum modi similique cum, repudiandae veritatis dolor cumque voluptas voluptates nam amet.`)
        ).toBe(150);
    });

    it('should render word count', () => {
        const wrapper = shallowMount(CharacterCount, {
            propsData: { currentText: null, maxWords: 10, locale: 'en' }
        });

        expect(wrapper.text()).toContain('0 / 10 words');
        wrapper.setProps({ currentText: 'this is a test' });
        expect(wrapper.text()).toContain('4 / 10 words');
        wrapper.setProps({ currentText: 'this current text is exactly ten words and no more' });
        expect(wrapper.text()).toContain('10 / 10 words');
        wrapper.setProps({ currentText: 'this current text is over the specified limit by a couple of words.' });
        expect(wrapper.text()).toContain('You have 3 words too many');
    });
});
