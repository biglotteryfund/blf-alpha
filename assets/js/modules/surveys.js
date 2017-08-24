/* global $ */
'use strict';

// via https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
let storageAvailable = (type) => {
    let storage;
    try {
        storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
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

let logSurveyTaken = (surveyId) => {
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

let hasTakenSurvey = (surveyId) => {
    if (CAN_STORE) {
        let surveysTaken = getSurveysTaken();
        return (surveysTaken.indexOf(surveyId) !== -1);
    }
};

let takeSurvey = (elm, event) => {
    event.preventDefault();
    const url = elm.attr('action');
    let data = elm.serialize();
    $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: 'json',
        success: (response) => {
            let surveys = logSurveyTaken(response.surveyId);
            console.log(response);
            alert('Success!');
        },
        error: (err) => {
            console.error(err.responseJSON);
            alert('Error!');
        }
    });
};

module.exports = {
    init: () => {

        // show surveys to users who haven't taken them yet
        $('.js-survey').each(function () {

            // enable this survey (if applicable)
            let surveyId = parseInt($(this).data('survey'));
            if (surveyId && !hasTakenSurvey(surveyId)) {
                $(this).removeClass('hidden');
            }

            // AJAX-ify survey submissions
            $(this).on('submit', function (e) {
                return takeSurvey($(this), e);
            });
        });

    }
};