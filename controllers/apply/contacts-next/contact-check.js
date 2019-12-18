'use strict';
const path = require('path');

module.exports = function(req, res, props) {
    const { form } = props;

    const seniorContactFieldMappings = {
        seniorContactName: 'Name',
        seniorContactRole: 'Role',
        seniorContactDateOfBirth: 'Date of birth',
        seniorContactAddress: 'Address',
        seniorContactAddressHistory: 'Previous address',
        seniorContactEmail: 'Email',
        seniorContactPhone: 'Phone',
        seniorContactCommunicationNeeds: 'Communication needs'
    };

    const mainContactFieldMappings = {
        mainContactName: 'Name',
        mainContactDateOfBirth: 'Date of birth',
        mainContactAddress: 'Address',
        mainContactAddressHistory: 'Previous address',
        mainContactEmail: 'Email',
        mainContactPhone: 'Phone',
        mainContactCommunicationNeeds: 'Communication needs'
    };

    function contactSummary(mappings) {
        let results = [];

        form.sections
            .flatMap(section => section.steps)
            .forEach(function(step) {
                step.getCurrentFields()
                    .filter(function(field) {
                        return (
                            Object.keys(mappings).includes(field.name) &&
                            field.displayValue
                        );
                    })
                    .forEach(function(field) {
                        results.push({
                            label: mappings[field.name] || field.label,
                            value: field.displayValue,
                            editSlug: `${step.slug}#form-field-${field.name}`
                        });
                    });
            });

        return results;
    }

    const customViewData = {
        seniorContactSummary: contactSummary(seniorContactFieldMappings),
        mainContactSummary: contactSummary(mainContactFieldMappings)
    };

    res.render(path.resolve(__dirname, './views/contact-check.njk'), {
        ...props,
        ...customViewData
    });
};
