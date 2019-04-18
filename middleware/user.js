'use strict';

/*
 * Middleware to add in alert message strings based on status parameters
 */
function addAlertMessage(req, res, next) {
    let alertMessage;
    switch (req.query.s) {
        case 'passwordUpdated':
            alertMessage = 'Your password was successfully updated!';
            break;
        case 'activationSent':
            alertMessage = `We have sent an email to ${
                req.user.userData.username
            } with a link to activate your account.`;
            break;
        case 'activationComplete':
            alertMessage = `Your account was successfully activated!`;
            break;
        case 'emailUpdated':
            alertMessage = `Your email address was successfully updated!`;
            break;
        case 'loggedOut':
            alertMessage = 'You were successfully logged out.';
            break;
        case 'passwordResetRequest':
            alertMessage =
                'Password reset requested. If the email address entered is correct, you will receive further instructions via email.';
            break;
    }
    res.locals.alertMessage = alertMessage;
    console.log(alertMessage);
    next();
}

module.exports = {
    addAlertMessage
};
