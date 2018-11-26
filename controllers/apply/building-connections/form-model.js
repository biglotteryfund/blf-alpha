'use strict';
const path = require('path');
const processor = require('./processor');
const fields = require('./fields');

const formLang = 'apply.buildingConnections';

const stepCurrentWork = {
    fieldsets: fields.currentWork
};

const stepProjectIdea = {
    fieldsets: fields.yourIdea
};

const stepProjectActivities = {
    fieldsets: fields.projectActivities
};

const stepBuildingSocialConnections = {
    fieldsets: fields.socialConnections
};

const stepProjectEvaluation = {
    fieldsets: fields.projectEvaluation
};

const stepProjectLocation = {
    fieldsets: fields.projectLocation
};

const stepProjectBudget = {
    fieldsets: fields.projectBudget
};

const stepOrgDetails = {
    fieldsets: fields.organisationDetails
};

const stepMainContact = {
    fieldsets: fields.mainContact
};

module.exports = {
    id: 'building-connections-fund-temp',
    shortCode: 'BCF-TMP',
    lang: formLang,
    isBilingual: false,
    steps: [
        stepCurrentWork,
        stepProjectIdea,
        stepProjectActivities,
        stepBuildingSocialConnections,
        stepProjectEvaluation,
        stepProjectLocation,
        stepProjectBudget,
        stepOrgDetails,
        stepMainContact
    ],
    processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
