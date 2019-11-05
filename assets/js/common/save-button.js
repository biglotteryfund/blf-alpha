import $ from 'jquery';

function animateSaveButtons() {
    $('.js-save-btn-form')
        .find('input[type="submit"], button[type="submit"]')
        .on('click', function(event) {
            // Prevent previous / next buttons from triggering animations
            const targetName = $(this).attr('name');
            if (['previousBtn', 'nextBtn'].indexOf(targetName) !== -1) {
                return;
            }

            // Prevent form submission initially
            event.preventDefault();

            const $form = $(this)
                .parents('form')
                .first();
            const $btn = $form.find('.js-save-btn');
            const $label = $btn.find('.js-save-btn-label');

            // animation is 0.3s long x 3 (with a 0.3s delay, eg. 1.2 total)
            const cssDotAnimationDuration = 300 * 4;
            const cssIconAnimationDuration = 300;

            const text = {
                interstitial: $btn.data('interstitial'),
                complete: $btn.data('complete')
            };

            const classes = {
                loading: 'is-loading',
                complete: 'is-complete'
            };

            const setBtnLabel = text => {
                $label.text(text);
            };

            $btn.addClass(classes.loading);
            setBtnLabel(text.interstitial);

            window.setTimeout(function() {
                setBtnLabel(text.complete);
                $btn.addClass(classes.complete);
            }, cssDotAnimationDuration);

            window.setTimeout(function() {
                // Re-trigger the submit request
                $form.submit();
            }, cssDotAnimationDuration + cssIconAnimationDuration);
        });
}

export const init = () => {
    // Launch this feature in non-prod envs (for now) and don't add extra delays for automated tests
    if (
        window.AppConfig.environment !== 'production' &&
        !window.AppConfig.isTestServer
    ) {
        animateSaveButtons();
    }
};
