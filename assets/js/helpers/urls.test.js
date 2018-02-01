/* eslint-env mocha */

const chai = require('chai');
const expect = chai.expect;

const { isExternalLink, isDownloadLink } = require('./urls');

describe('URL helpers', () => {
    it('should determine if a link is to an external document', () => {
        expect(isExternalLink('biglotteryfund.org.uk', 'biglotteryfund.org.uk')).to.be.false;
        expect(isExternalLink('biglotteryfund.org.uk', 'example.com')).to.be.true;
    });

    it('should determine if a link is to a document', () => {
        expect(isDownloadLink('https://example.com/path/to/url')).to.be.false;
        expect(isDownloadLink('https://example.com/path/to/some.pdf')).to.be.true;
        expect(isDownloadLink('https://example.com/path/to/some.doc')).to.be.true;
        expect(isDownloadLink('https://example.com/path/to/some.docx')).to.be.true;
    });
});
