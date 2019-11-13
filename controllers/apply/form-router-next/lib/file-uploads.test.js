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

    expect(result).toEqual({
        filesToUpload: [
            {
                fieldName: 'bankStatement',
                fileData: {
                    size: 13264,
                    name: 'example.pdf',
                    type: 'application/pdf'
                }
            }
        ],
        valuesByField: {
            bankStatement: {
                size: 13264,
                filename: 'example.pdf',
                type: 'application/pdf'
            }
        }
    });
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

    expect(result).toEqual({
        filesToUpload: [
            {
                fieldName: 'bankStatement',
                fileData: {
                    size: 13264,
                    name: 'example.pdf',
                    type: 'application/pdf'
                }
            }
        ],
        valuesByField: {
            bankStatement: {
                size: 13264,
                filename: 'example.pdf',
                type: 'application/pdf'
            }
        }
    });
});
