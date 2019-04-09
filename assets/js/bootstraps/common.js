/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
import $ from 'jquery';
import fitvids from 'fitvids';
import tabs from '../modules/tabs';
import forms from '../modules/forms';

function init() {
    fitvids();
    $('.fluid-width-video-wrapper iframe').removeAttr('style');
    tabs.init();
    forms.init();
}

export default {
    init
};
