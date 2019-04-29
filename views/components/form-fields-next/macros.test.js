/* eslint-env jest */
'use strict';
const { renderComponentMacro } = require('../../../modules/test-renderers');

describe.only('form field macros', () => {
    test('inputText', async () => {
        const result = await renderComponentMacro('components/form-fields-next/macros.njk', 'inputText', {
            name: 'example',
            type: 'text',
            label: 'First name',
            isRequired: true
        });
        expect(result).toMatchSnapshot();
    });

    test('inputCurrency', async () => {
        const result = await renderComponentMacro('components/form-fields-next/macros.njk', 'inputCurrency', {
            name: 'example',
            label: 'Amount',
            isRequired: true
        });
        expect(result).toMatchSnapshot();
    });
});
