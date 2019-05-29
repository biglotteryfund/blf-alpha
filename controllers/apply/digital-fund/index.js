'use strict';
const { initFormRouter } = require('../form-router');
const formModel = require('./form-model');

module.exports = {
    strand1: initFormRouter(formModel.strand1),
    strand2: initFormRouter(formModel.strand2)
};
