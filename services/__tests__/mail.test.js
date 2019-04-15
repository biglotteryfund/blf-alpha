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

const exampleEmail = 'example@biglotteryfund.org.uk';
const exampleEmailNew = 'example@tnlcommunityfund.org.uk';

function sendMockEmail(mailConfig) {
    return sendEmail({
        name: 'mock_email',
        mailConfig: mailConfig,
        mailTransport: nodemailer.createTransport({
            jsonTransport: true
        })
    });
}

function createMockHtml() {
    return generateHtmlEmail({
        template: path.resolve(__dirname, 'test-email.njk'),
        templateData: { example: 'Example data' }
    });
}

describe('buildMailOptions', () => {
    test('build mail options for a text email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: 'example@example.com',
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    test('build mail options for a text email with a name', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: { name: 'Example Person', address: 'example@example.com' },
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    test('handle multiple send to addresses', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@biglotteryfund.org.uk' }, { address: 'example@blah.com' }],
            content: 'This is a test'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    test('build mail options for a html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@example.com' }],
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    test('build mail options for an internal html email', () => {
        const mailOptions = buildMailOptions({
            subject: 'Test',
            sendTo: [{ address: 'example@biglotteryfund.org.uk' }],
            type: 'html',
            content: '<p>This is a test</p>'
        });

        expect(mailOptions).toMatchSnapshot();
    });

    test('throw error for bad content type', () => {
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

    test('instance of SESTransport', () => {
        expect(transport.transporter.name).toBe('SESTransport');
    });
});

describe('generateHtmlEmail', () => {
    test('generate html email content', async () => {
        const html = await createMockHtml();
        expect(html).toMatchSnapshot();
    });

    test('throw error on bad template', async () => {
        await expect(
            generateHtmlEmail({
                template: path.resolve(__dirname, 'bad-email.njk'),
                templateData: { bad: 'Bad data' }
            })
        ).rejects.toThrow();
    });
});

describe('getSendAddress', () => {
    const expectedDefault = `noreply@tnlcommunityfund.org.uk`;
    const expectedInternal = `noreply@blf.digital`;

    test('return default send from address for external send to addresses', () => {
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

    test('return internal send from address for internal send to addresses', () => {
        expect(getSendAddress([{ address: exampleEmail }])).toBe(expectedInternal);
        expect(getSendAddress([{ address: exampleEmailNew }])).toBe(expectedInternal);
        // Assert against similar looking but incorrect emails to test for false positives
        expect(getSendAddress([{ address: 'example@tnlcommmunityfun.org.uk' }])).toBe(expectedDefault);
        expect(getSendAddress([{ address: 'example@biggerlotteryfund.org.uk' }])).toBe(expectedDefault);
        expect(getSendAddress([{ address: 'example@biggestlotteryfund.org.uk' }])).toBe(expectedDefault);
        expect(getSendAddress([{ address: 'biglotteryfund.org.uk@example.com' }])).toBe(expectedDefault);
    });
});

describe('normaliseSendTo', () => {
    test('handle a single address string', () => {
        expect(normaliseSendTo('example@example.com')).toEqual([{ address: 'example@example.com' }]);
    });

    test('handle a multiple address string', () => {
        expect(normaliseSendTo('example@example.com,another@example.com')).toEqual([
            { address: 'example@example.com' },
            { address: 'another@example.com' }
        ]);
    });

    test('handle a single address object', () => {
        expect(normaliseSendTo({ address: 'example@example.com' })).toEqual([{ address: 'example@example.com' }]);

        expect(normaliseSendTo({ name: 'Example Name', address: 'example@example.com' })).toEqual([
            { name: 'Example Name', address: 'example@example.com' }
        ]);
    });

    test('handle an array of address objects', () => {
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
    test('create a text email response to be sent', async () => {
        const info = await sendMockEmail({
            subject: 'Mock email',
            sendTo: [{ address: 'example@example.com' }],
            type: 'text',
            content: 'This is a test email'
        });

        expect(info.envelope.from).toEqual('noreply@tnlcommunityfund.org.uk');
        expect(info.envelope.to).toEqual(['example@example.com']);

        const infoMessage = JSON.parse(info.message);
        expect(infoMessage.text).toBe('This is a test email');
    });

    test('create a html email response to be sent', async () => {
        const html = await createMockHtml();

        const info = await sendMockEmail({
            subject: 'Mock email',
            sendTo: [{ address: 'example@example.com' }],
            type: 'html',
            content: html
        });

        expect(info.envelope.from).toEqual('noreply@tnlcommunityfund.org.uk');
        expect(info.envelope.to).toEqual(['example@example.com']);

        const infoMessage = JSON.parse(info.message);
        expect(infoMessage.text).toMatchSnapshot();
        expect(infoMessage.html).toMatchSnapshot();
    });
});
