/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');
const { getSendAddress, buildMailOptions } = require('../mail-helpers');

describe('getSendAddress', () => {
    const expectedDefault = `noreply@biglotteryfund.org.uk`;
    const expectedInternal = `noreply@blf.digital`;

    it('should return default send from address for external send to addresses', () => {
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

async function mockEmail(mailOptions) {
    const transport = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
    });

    const info = await transport.sendMail(mailOptions);
    // Remove generated properties from message
    info.message = info.message
        .toString()
        .replace(/Message-ID: .*\n/, '')
        .replace(/Date: .*\n/, '')
        .replace(/ boundary=.*\n/, '')
        .replace(/----.*\n/gm, '');
    return info;
}

describe('buildMailOptions', () => {
    it('should build mail options for a text email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
        const info = await mockEmail(mailOptions);
        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });

    it('should build mail options for a text email with a name', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { name: 'Example Person', address: 'example@example.com' },
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
        const info = await mockEmail(mailOptions);
        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });

    it('should build mail options for a html email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
        const info = await mockEmail(mailOptions);
        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });

    it('should build mail options for an internal html email', async () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@biglotteryfund.org.uk' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
        const info = await mockEmail(mailOptions);
        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });
});
