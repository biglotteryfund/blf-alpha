'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('survey_response', {
        survey_id: {
            type: DataTypes.INTEGER
        },
        choice_id: {
            type: DataTypes.INTEGER
        },
        message: {
            type: DataTypes.TEXT
        },
        metadata: {
            type: DataTypes.TEXT,
            get() {
                let data = this.getDataValue('metadata');
                if (data) {
                    return JSON.parse(data);
                } else {
                    return data;
                }
            },
            set(val) {
                this.setDataValue('metadata', JSON.stringify(val, null, 4));
            }
        }
    });
};
