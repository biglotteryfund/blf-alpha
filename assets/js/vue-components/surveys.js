/* global ga */
import $ from 'jquery';
import Vue from 'vue';
import { withDefaults } from './vue-config';
import { storageAvailable } from '../helpers/storage';

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

/**
 * iOS 11 has a bug where if an input is inside a position fixed element the
 * cursor will disapear of the screen when entering text. Why???
 * https://stackoverflow.com/questions/46339063/ios-11-safari-bootstrap-modal-text-area-outside-of-cursor/46954486#46954486
 * https://bugs.webkit.org/show_bug.cgi?id=176896
 */
function hasiOSBug() {
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        /OS 11_0_1|OS 11_0_2|OS 11_0_3|OS 11_1/.test(navigator.userAgent)
    );
}

const showSurvey = survey => {
    const mountEl = document.getElementById('js-survey-container');
    if (hasTakenSurvey(survey.id) || !mountEl) {
        return;
    }

    new Vue(
        withDefaults({
            el: mountEl,
            data: {
                survey: survey,
                isShown: false,
                isActivated: false,
                isComplete: undefined,
                showMessageBox: false,
                surveyBlocked: false,
                formData: {
                    choice: undefined,
                    message: undefined
                }
            },
            mounted: function() {
                setTimeout(() => {
                    this.isShown = true;
                }, 3000);
            },
            methods: {
                toggleSurvey() {
                    this.isActivated = !this.isActivated;
                },
                blockSurvey() {
                    logSurveyTaken(this.survey.id);
                    this.surveyBlocked = true;
                },
                toggleMessage(choice) {
                    if (choice.allowMessage) {
                        this.showMessageBox = true;
                    } else {
                        this.formData.choice = choice.id;
                    }
                },
                messageOnFocus() {
                    if (hasiOSBug()) {
                        $('body').addClass('is-ios-editing-survey');
                    }
                },
                messageOnBlur() {
                    if (hasiOSBug()) {
                        $('body').removeClass('is-ios-editing-survey');
                    }
                },
                updateChoice(choice) {
                    this.formData.choice = choice.id;
                },
                submitSurvey(e) {
                    let self = this;
                    let data = this.formData;

                    // try to record an anonymous GA clientId to aid in debugging reported issues
                    ga(tracker => {
                        data.metadata = JSON.stringify({
                            clientId: tracker.get('clientId')
                        });
                    });

                    // store the page path
                    data.path = window.location.pathname;

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
        })
    );
};

function init() {
    // normalise URLs (eg. treat a Welsh URL the same as default)
    const CYMRU_URL = /\/welsh(\/|$)/;
    let uri = window.location.pathname;
    uri = uri.replace(CYMRU_URL, '/');
    const localePrefix = window.AppConfig.localePrefix;
    // does this page have any surveys?
    $.get(`${localePrefix}/surveys?path=${uri}`).then(response => {
        if (response.status === 'success') {
            showSurvey(response.survey);
        }
    });
}

export default {
    init
};
