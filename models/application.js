'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        'application',
        {
            form_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            reference_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            application_data: {
                type: DataTypes.JSON
            }
        },
        {
            getterMethods: {
                formTitle() {
                    // via https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript#comment85199999_46959528
                    return this.form_id.replace(/-/g, ' ').replace(/\b\S/g, t => t.toUpperCase());
                }
            }
        }
    );
};
