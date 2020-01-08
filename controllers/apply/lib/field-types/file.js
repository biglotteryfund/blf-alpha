'use strict';
const mime = require('mime-types');
const filesize = require('filesize');

const Field = require('./field');
const Joi = require('../joi-extensions');

class FileField extends Field {
    constructor(props) {
        super(props);

        this.labelExisting = props.labelExisting || null;

        const maxFileSize = {
            value: 12 * 1048576,
            label: '12MB'
        };

        const supportedFileTypes = [
            { mime: 'image/png', label: 'PNG' },
            { mime: 'image/jpeg', label: 'JPEG' },
            { mime: 'application/pdf', label: 'PDF' }
        ];

        const supportedMimeTypes = supportedFileTypes.map(type => type.mime);

        this.attributes = Object.assign(
            {},
            { accept: supportedMimeTypes.join(',') },
            props.attributes
        );

        const schema =
            props.schema ||
            Joi.object({
                filename: Joi.string().required(),
                size: Joi.number()
                    .max(maxFileSize.value)
                    .required(),
                type: Joi.string()
                    .valid(supportedMimeTypes)
                    .required()
            });

        if (this.isRequired) {
            this.schema = schema.required();
        } else {
            this.schema = schema.optional();
        }

        const typeList = supportedFileTypes.map(type => type.label).join(', ');

        this.messages = [
            {
                type: 'any.allowOnly',
                message: this.localise({
                    en: `Please upload a file in one of these formats: ${typeList}`,
                    cy: `Uwch lwythwch ffeil yn un o’r fformatiau hyn: ${typeList}`
                })
            },
            {
                type: 'number.max',
                message: this.localise({
                    en: `Please upload a file below ${maxFileSize.label}`,
                    cy: `Uwch lwythwch ffeil isod ${maxFileSize.label}`
                })
            }
        ].concat(props.messages || []);
    }

    getType() {
        return 'file';
    }

    get displayValue() {
        if (this.value) {
            const mimeType = mime.extension(this.value.type) || 'File';
            const fileSize = filesize(this.value.size, { round: 0 });
            return `${
                this.value.filename
            } (${mimeType.toUpperCase()}, ${fileSize})`;
        } else {
            return '';
        }
    }
}

module.exports = FileField;
