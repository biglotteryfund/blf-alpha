/* eslint-env jest */
'use strict';
const { getSendAddress, buildMailOptions } = require('../mail-helpers');

describe('getSendAddress', () => {
    const expectedDefault = `noreply@biglotteryfund.org.uk`;
    const expectedInternal = `noreply@blf.digital`;

    it('it should return default send from address for external send to addresses', () => {
        expect(getSendAddress('example@example.com')).toBe(expectedDefault);
        expect(getSendAddress('example@gmail.com')).toBe(expectedDefault);
    });

    it('should return internal send from address for internal send to addresses', () => {
        expect(getSendAddress('example@biglotteryfund.org.uk')).toBe(expectedInternal);
        // Assert against similar looking but incorrect emails to test for false positives
        expect(getSendAddress('example@biggerlotteryfund.org.uk')).toBe(expectedDefault);
        expect(getSendAddress('example@biggestlotteryfund.org.uk')).toBe(expectedDefault);
        expect(getSendAddress('biglotteryfund.org.uk@example.com')).toBe(expectedDefault);
    });
});

// function buildMailOptions({ subject, type = 'text', content, sendTo, sendMode = 'to', customSendFrom = null })

describe('buildMailOptions', () => {
    it('should build mail options for a text email', () => {
        expect(
            buildMailOptions({
                subject: 'Test',
                sendTo: { address: 'example@example.com' },
                content: 'This is a test'
            })
        ).toEqual({
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            text: 'This is a test',
            to: { address: 'example@example.com' }
        });
    });

    it('should build mail options for a text email with a name', () => {
        expect(
            buildMailOptions({
                subject: 'Test',
                sendTo: { name: 'Example Person', address: 'example@example.com' },
                content: 'This is a test'
            })
        ).toEqual({
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            text: 'This is a test',
            to: { name: 'Example Person', address: 'example@example.com' }
        });
    });

    it('should build mail options for a html email', () => {
        expect(
            buildMailOptions({
                subject: 'Test',
                sendTo: { address: 'example@example.com' },
                type: 'html',
                content: '<p>This is a test</p>'
            })
        ).toEqual({
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            html: '<p>This is a test</p>',
            text: 'This is a test',
            to: { address: 'example@example.com' }
        });
    });

    it('should build mail options for an internal html email', () => {
        expect(
            buildMailOptions({
                subject: 'Test',
                sendTo: { address: 'example@biglotteryfund.org.uk' },
                type: 'html',
                content: '<p>This is a test</p>'
            })
        ).toEqual({
            from: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Test',
            html: '<p>This is a test</p>',
            text: 'This is a test',
            to: { address: 'example@biglotteryfund.org.uk' }
        });
    });
});
