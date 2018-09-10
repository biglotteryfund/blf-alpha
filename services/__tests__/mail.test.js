/* eslint-env jest */
'use strict';
const path = require('path');
const nodemailer = require('nodemailer');

const {
    buildMailOptions,
    createSesTransport,
    generateHtmlEmail,
    getSendAddress,
    normaliseSendTo,
    sendEmail
} = require('../mail');

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
            sendTo: 'example@example.com',
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

    it('should handle multiple send to addresses', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@biglotteryfund.org.uk' }, { address: 'example@blah.com' }],
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should build mail options for a html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@example.com' }],
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should build mail options for an internal html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@biglotteryfund.org.uk' }],
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    it('should throw error for bad content type', () => {
        expect(() => {
            buildMailOptions({
                subject: 'Test',
                sendTo: [{ address: 'example@biglotteryfund.org.uk' }],
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
        expect(
            getSendAddress([
                {
                    address: 'example@example.com'
                }
            ])
        ).toBe(expectedDefault);
        expect(
            getSendAddress([
                {
                    address: 'example@gmail.com'
                }
            ])
        ).toBe(expectedDefault);
    });

    it('should return internal send from address for internal send to addresses', () => {
        expect(
            getSendAddress([
                {
                    address: 'example@biglotteryfund.org.uk'
                }
            ])
        ).toBe(expectedInternal);
        // Assert against similar looking but incorrect emails to test for false positives
        expect(
            getSendAddress([
                {
                    address: 'example@biggerlotteryfund.org.uk'
                }
            ])
        ).toBe(expectedDefault);
        expect(
            getSendAddress([
                {
                    address: 'example@biggestlotteryfund.org.uk'
                }
            ])
        ).toBe(expectedDefault);
        expect(
            getSendAddress([
                {
                    address: 'biglotteryfund.org.uk@example.com'
                }
            ])
        ).toBe(expectedDefault);
    });
});

describe('normaliseSendTo', () => {
    it('should handle a single address string', () => {
        expect(normaliseSendTo('example@example.com')).toEqual([{ address: 'example@example.com' }]);
    });

    it('should handle a multiple address string', () => {
        expect(normaliseSendTo('example@example.com,another@example.com')).toEqual([
            { address: 'example@example.com' },
            { address: 'another@example.com' }
        ]);
    });

    it('should handle a single address object', () => {
        expect(normaliseSendTo({ address: 'example@example.com' })).toEqual([{ address: 'example@example.com' }]);

        expect(normaliseSendTo({ name: 'Example Name', address: 'example@example.com' })).toEqual([
            { name: 'Example Name', address: 'example@example.com' }
        ]);
    });

    it('should handle an array of address objects', () => {
        expect(normaliseSendTo([{ address: 'example@example.com' }])).toEqual([{ address: 'example@example.com' }]);

        expect(
            normaliseSendTo([
                { name: 'Example Name', address: 'example@example.com' },
                { name: 'Another Name', address: 'another@example.com' }
            ])
        ).toEqual([
            { name: 'Example Name', address: 'example@example.com' },
            { name: 'Another Name', address: 'another@example.com' }
        ]);
    });
});

describe('sendEmail', () => {
    it('should create a text email response to be sent', async () => {
        const info = await sendMockEmail({
            subject: 'Mock email',
            sendTo: [{ address: 'example@example.com' }],
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
            sendTo: [{ address: 'example@example.com' }],
            type: 'html',
            content: html
        });

        expect(info.envelope).toMatchSnapshot();
        expect(info.message).toMatchSnapshot();
    });
});
