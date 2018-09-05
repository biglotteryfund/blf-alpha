/* eslint-env jest */
'use strict';
const path = require('path');
const nodemailer = require('nodemailer');

const { buildMailOptions, createSesTransport, generateHtmlEmail, getSendAddress, sendEmail } = require('../mail');

async function sendMockEmail(mailConfig) {
    const info = await sendEmail({
        name: 'mock_email',
        mailConfig: mailConfig,
        mailTransport: nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        })
    });

    // Remove generated properties from message
    info.message = info.message
        .toString()
        .replace(/Message-ID: .*\n/, '')
        .replace(/Date: .*\n/, '')
        .replace(/ boundary=.*\n/, '')
        .replace(/----.*\n/gm, '');
    return info;
}

function createMockHtml() {
    return generateHtmlEmail({
        template: path.resolve(__dirname, 'test-email.njk'),
        templateData: { example: 'Example data' }
    });
}

describe('buildMailOptions', () => {
    it('should build mail options for a text email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should build mail options for a text email with a name', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { name: 'Example Person', address: 'example@example.com' },
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should build mail options for a html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@example.com' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should build mail options for an internal html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { address: 'example@biglotteryfund.org.uk' },
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should throw error for bad content type', () => {
        expect(() => {
            buildMailOptions({
                subject: 'Test',
                sendTo: { address: 'example@biglotteryfund.org.uk' },
                type: 'not_a_thing',
                content: '<p>This is a test</p>'
            });
        }).toThrow();
    });
});

describe('createSesTransport', () => {
    const transport = createSesTransport();
    expect(transport.transporter.name).toBe('SESTransport');
});

describe('generateHtmlEmail', () => {
    it('should generate html email content', async () => {
        const html = await createMockHtml();
        expect(html).toMatchSnapshot();
    });

    it('should throw error on bad template', async () => {
        await expect(
            generateHtmlEmail({
                template: path.resolve(__dirname, 'bad-email.njk'),
                templateData: { bad: 'Bad data' }
            })
        ).rejects.toThrow();
    });
});

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

describe('sendEmail', () => {
    it('should create a text email response to be sent', async () => {
        const info = await sendMockEmail({
            subject: 'Mock email',
            sendTo: { address: 'example@example.com' },
            type: 'text',
            content: 'This is a test email'
        });

        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });

    it('should create a html email response to be sent', async () => {
        const html = await createMockHtml();

        const info = await sendMockEmail({
            subject: 'Mock email',
            sendTo: { address: 'example@example.com' },
            type: 'html',
            content: html
        });

        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });

    it('should skip emails with DONT_SEND_EMAIL', async () => {
        process.env.DONT_SEND_EMAIL = 'true';

        const info = await sendEmail({
            name: 'skipped_email',
            mailConfig: {
                subject: 'Mock email',
                sendTo: { address: 'example@example.com' },
                type: 'text',
                content: 'Some content'
            },
            mailTransport: nodemailer.createTransport({
                jsonTransport: true
            })
        });

        expect(info).toBe('skipped sending mail skipped_email');
    });
});
