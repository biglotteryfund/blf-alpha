function errorTranslator(prefix) {
    return function(prop) {
        return (value, { req }) => req.i18n.__(`${prefix}.${prop}`);
    };
}

module.exports = {
    errorTranslator
};
