/* global Vue */
'use strict';

const $ = require('jquery');

// via https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
let storageAvailable = type => {
    let storage;
    try {
        storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0
        );
    }
};

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
            activateSurvey: function() {
                this.isActivated = true;
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
                $.ajax({
                    url: e.target.action,
                    type: 'POST',
                    data: this.formData,
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
        $.post('/get-survey', { path: window.location.pathname }).then(response => {
            if (response.status === 'success') {
                showSurvey(response.survey);
            }
        });
    }
};
