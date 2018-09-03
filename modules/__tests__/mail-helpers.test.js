/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');
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

function mockTransport(mailOptions) {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    return transport.sendMail(mailOptions);
}

describe('buildMailOptions', () => {
    it('should build mail options for a text email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            content: 'This is a test'
        });

        const expectedOptions = {
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            text: 'This is a test',
            to: { address: 'example@example.com' }
        };

        expect(mailOptions).toEqual(expectedOptions);

        const info = await mockTransport(mailOptions);
        const message = JSON.parse(info.message);

        expect(message.text).toBe(expectedOptions.text);
        expect(message.to).toEqual([{ address: 'example@example.com', name: '' }]);
        expect(info.envelope.from).toBe('noreply@biglotteryfund.org.uk');
        expect(info.envelope.to).toEqual(['example@example.com']);
    });

    it('should build mail options for a text email with a name', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { name: 'Example Person', address: 'example@example.com' },
            content: 'This is a test'
        });

        const expectedOptions = {
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            text: 'This is a test',
            to: { name: 'Example Person', address: 'example@example.com' }
        };

        expect(mailOptions).toEqual(expectedOptions);

        const info = await mockTransport(mailOptions);
        const message = JSON.parse(info.message);

        expect(message.text).toBe(expectedOptions.text);
        expect(message.to).toEqual([{ address: 'example@example.com', name: 'Example Person' }]);
        expect(info.envelope.from).toBe('noreply@biglotteryfund.org.uk');
        expect(info.envelope.to).toEqual(['example@example.com']);
    });

    it('should build mail options for a html email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        const expectedOptions = {
            from: 'Big Lottery Fund <noreply@biglotteryfund.org.uk>',
            subject: 'Test',
            html: '<p>This is a test</p>',
            text: 'This is a test',
            to: { address: 'example@example.com' }
        };

        expect(mailOptions).toEqual(expectedOptions);

        const info = await mockTransport(mailOptions);
        const message = JSON.parse(info.message);

        expect(message.text).toBe(expectedOptions.text);
        expect(message.to).toEqual([{ address: 'example@example.com', name: '' }]);
        expect(info.envelope.from).toBe('noreply@biglotteryfund.org.uk');
        expect(info.envelope.to).toEqual(['example@example.com']);
    });

    it('should build mail options for an internal html email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@biglotteryfund.org.uk' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        const expectedOptions = {
            from: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Test',
            html: '<p>This is a test</p>',
            text: 'This is a test',
            to: { address: 'example@biglotteryfund.org.uk' }
        };

        expect(mailOptions).toEqual(expectedOptions);

        const info = await mockTransport(mailOptions);
        const message = JSON.parse(info.message);

        expect(message.text).toBe(expectedOptions.text);
        expect(message.to).toEqual([{ address: 'example@biglotteryfund.org.uk', name: '' }]);
        expect(info.envelope.from).toBe('noreply@blf.digital');
        expect(info.envelope.to).toEqual(['example@biglotteryfund.org.uk']);
    });
});
