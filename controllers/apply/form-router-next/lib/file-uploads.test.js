/* eslint-env jest */
'use strict';
const { prepareFilesForUpload } = require('./file-uploads');

describe('prepareFilesForUpload', () => {
    test('determine files to upload', () => {
        const mockFields = [
            { name: 'bankStatement', type: 'file' },
            { name: 'anotherField', type: 'text' }
        ];

        const mockFiles = {
            bankStatement: {
                size: 13264,
                name: 'example.pdf',
                type: 'application/pdf'
            }
        };

        const preparedFiles = prepareFilesForUpload(mockFields, mockFiles);

        expect(preparedFiles.filesToUpload).toEqual([
            {
                fieldName: 'bankStatement',
                fileData: {
                    size: 13264,
                    name: 'example.pdf',
                    type: 'application/pdf'
                }
            }
        ]);

        expect(preparedFiles.valuesByField).toEqual({
            bankStatement: {
                size: 13264,
                filename: 'example.pdf',
                type: 'application/pdf'
            }
        });
    });
});
