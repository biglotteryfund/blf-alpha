/* eslint-env jest */
'use strict';
const { prepareFilesForUpload } = require('./file-uploads');

test('determine files to upload', () => {
    const result = prepareFilesForUpload(
        [
            { name: 'bankStatement', type: 'file' },
            { name: 'anotherField', type: 'text' }
        ],
        {
            bankStatement: {
                size: 13264,
                name: 'example.pdf',
                type: 'application/pdf'
            }
        }
    );

    expect(result).toMatchSnapshot();
});

test('trim file names for upload', () => {
    const result = prepareFilesForUpload(
        [
            { name: 'bankStatement', type: 'file' },
            { name: 'anotherField', type: 'text' }
        ],
        {
            bankStatement: {
                size: 13264,
                name: '   example.pdf  ',
                type: 'application/pdf'
            }
        }
    );

    expect(result).toMatchSnapshot();
});
