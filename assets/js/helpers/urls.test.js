/* eslint-env jest */

const { isExternalLink, isDownloadLink } = require('./urls');

describe('URL helpers', () => {
    it('should determine if a link is to an external document', () => {
        expect(isExternalLink('biglotteryfund.org.uk', 'biglotteryfund.org.uk')).toBe(false);
        expect(isExternalLink('biglotteryfund.org.uk', 'example.com')).toBe(true);
    });

    it('should determine if a link is to a document', () => {
        expect(isDownloadLink('https://example.com/path/to/url')).toBe(false);
        expect(isDownloadLink('https://example.com/path/to/some.pdf')).toBe(true);
        expect(isDownloadLink('https://example.com/path/to/some.doc')).toBe(true);
        expect(isDownloadLink('https://example.com/path/to/some.docx')).toBe(true);
    });
});
