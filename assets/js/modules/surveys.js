/* global Vue, ga */
'use strict';

const { storageAvailable } = require('./utility');
const $ = require('jquery');

const CAN_STORE = storageAvailable('localStorage');
const KEY_NAME = 'blfSurveysTaken';

let getSurveysTaken = () => {
    if (CAN_STORE) {
        let surveysTaken = window.localStorage.getItem(KEY_NAME);
        if (!surveysTaken) {
            return [];
        } else {
            return JSON.parse(surveysTaken) || [];
        }
    }
};

let logSurveyTaken = surveyId => {
    if (CAN_STORE) {
        let surveysTaken = getSurveysTaken();
        // add this survey if not there
        if (!hasTakenSurvey(surveyId)) {
            surveysTaken.push(parseInt(surveyId));
            window.localStorage.setItem(KEY_NAME, JSON.stringify(surveysTaken));
        }
        return surveysTaken;
    }
};

let hasTakenSurvey = surveyId => {
    if (CAN_STORE) {
        let surveysTaken = getSurveysTaken();
        return surveysTaken.indexOf(surveyId) !== -1;
    }
};

const showSurvey = survey => {
    const mountEl = document.getElementById('js-survey-container');

    if (hasTakenSurvey(survey.id) || !mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        data: {
            survey: survey,
            isActivated: false,
            isComplete: undefined,
            showMessageBox: false,
            formData: {
                choice: undefined,
                message: undefined
            }
        },
        methods: {
            toggleSurvey: function() {
                this.isActivated = !this.isActivated;
            },
            toggleMessage: function(choice) {
                if (choice.allow_message) {
                    this.showMessageBox = true;
                } else {
                    this.formData.choice = choice.id;
                }
            },
            updateChoice: function(choice) {
                this.formData.choice = choice.id;
            },
            localeify: function(obj, field, locale) {
                return obj[field + '_' + locale];
            },
            submitSurvey: function(e) {
                let self = this;
                let data = this.formData;

                // try to record an anonymous GA clientId to aid in debugging reported issues
                ga(tracker => {
                    data.metadata = JSON.stringify({
                        clientId: tracker.get('clientId')
                    });
                });

                $.ajax({
                    url: e.target.action,
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    success: response => {
                        if (response.status === 'error') {
                            self.isComplete = 'error';
                        } else {
                            logSurveyTaken(self.survey.id);
                            self.isComplete = 'success';
                        }
                    },
                    error: () => {
                        self.isComplete = 'error';
                    }
                });
            }
        }
    });
};

module.exports = {
    init: () => {
        // does this page have any surveys?
        $.get(`/surveys?path=${window.location.pathname}`).then(response => {
            if (response.status === 'success' && response.survey) {
                showSurvey(response.survey);
            }
        });
    }
};
