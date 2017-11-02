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

let takeSurvey = (survey, choiceId, event) => {
    event.preventDefault();
    const url = survey.attr('action');
    let data = survey.serialize() + '&choice=' + choiceId;

    let completeUi = status => {
        survey.find('.js-survey-responses').show();
        survey.find(`.js-survey--${status}`).show();
        survey.find('.js-survey-content').hide();
    };

    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        dataType: 'json',
        success: response => {
            logSurveyTaken(response.surveyId);
            completeUi('success');
        },
        error: () => {
            completeUi('error');
        }
    });
};

module.exports = {
    init: () => {
        $.post('/get-survey', { path: window.location.pathname }).then(response => {
            console.log(response);
        });

        // show surveys to users who haven't taken them yet
        $('.js-survey').each(function() {
            let $survey = $(this);

            // enable this survey (if applicable)
            let surveyId = parseInt($survey.data('survey'));
            if (surveyId && !hasTakenSurvey(surveyId)) {
                $survey.show();
            }

            let $toggleLink = $survey.find('.js-survey-toggle');
            let $togglePane = $survey.find('.js-survey-content');
            $toggleLink.on('click', function() {
                $togglePane.toggle();
                $survey.toggleClass('is-active');
            });

            let $optionButtons = $survey.find('.js-survey-btn');
            let $moreInfoButton = $survey.find('.js-survey-btn--more-info');
            let $moreInfoPane = $survey.find('.js-survey-extra');
            $moreInfoButton.on('click', function() {
                $optionButtons.hide();
                $moreInfoPane.show();
            });

            $('input:submit').each(function() {
                $(this).click(function() {
                    var formData = $(this)
                        .closest('form')
                        .serializeArray();
                    formData.push({ name: $(this).attr('name'), value: $(this).val() });
                });
            });

            // // AJAX-ify survey submissions
            $survey.find('[type="submit"]').on('click', function(e) {
                // get value of submit buttons when clicked
                let choiceId = $(this).val();
                return takeSurvey($survey, choiceId, e);
            });
        });
    }
};
