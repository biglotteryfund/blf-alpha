'use strict';
const { createFormModel } = require('../../helpers/create-form-model');
const processor = require('./processor');
const fields = require('./fields');

const formModel = createFormModel({
    id: 'building-connections-fund',
    title: 'Building Connections Fund ',
    shortCode: 'BCF'
});

formModel.registerStartPage({
    template: 'pages/apply/building-connections/startpage'
});

formModel.registerStep({
    name: 'Your current work',
    fieldsets: fields.currentWork
});

formModel.registerStep({
    name: 'Your project idea',
    fieldsets: fields.yourIdea
});

formModel.registerStep({
    name: 'Project activities, outcomes, and milestones',
    fieldsets: fields.projectActivities
});

formModel.registerStep({
    name: 'Project location',
    fieldsets: fields.projectLocation
});

formModel.registerStep({
    name: 'Increasing impact',
    fieldsets: fields.increasingImpact
});

formModel.registerStep({
    name: 'Evaluation and impact',
    fieldsets: fields.projectEvaluation
});

formModel.registerStep({
    name: 'Your project budget',
    fieldsets: fields.projectBudget
});

formModel.registerStep({
    name: 'Your organisation',
    fieldsets: fields.organisationDetails
});

formModel.registerStep({
    name: 'Main contact',
    fieldsets: fields.mainContact
});

formModel.registerReviewStep({
    title: 'Check this is right before submitting your idea',
    proceedLabel: 'Submit'
});

formModel.registerSuccessStep({
    template: 'pages/apply/building-connections/success',
    processor: processor
});

formModel.registerErrorStep({
    title: 'There was an problem submitting your idea',
    message: `
<p>There was a problem submitting your idea, we have been notified of the problem.</p>
<p>Please return to the review step and try again. If you still see an error please call <a href="tel:03454102030">0345 4 10 20 30</a> (Monday–Friday 9am–5pm).</p>
`
});

module.exports = formModel;
