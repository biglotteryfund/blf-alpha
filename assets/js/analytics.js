/* global ga */

import forEach from 'lodash/forEach';
import { trackEvent } from './helpers/metrics';

function trackDocumentDownloads() {
    const links = document.querySelectorAll('a[href]');
    forEach(links, function(link) {
        if (/\.(pdf|doc|docx|xls|xlsx)/i.test(link.href)) {
            link.addEventListener('click', () => {
                trackEvent('Documents', 'Downloaded a document', link.href);
            });
        }
    });
}

function trackSearchTerms() {
    forEach(document.querySelectorAll('.js-global-search-form'), function(
        form
    ) {
        const searchInput = form.querySelector('input[type=search]');
        form.addEventListener('submit', function() {
            trackEvent('Search', 'Term', searchInput.value);
        });
    });
}

export const init = () => {
    const thisScript = document.getElementById('js-script-main');
    const CONFIG = {
        uaCode: thisScript.getAttribute('data-ga-code'),
        abId: thisScript.getAttribute('data-ab-id'),
        abVariant: thisScript.getAttribute('data-ab-variant')
    };

    /**
     * Create ga queue
     */
    window.ga =
        window.ga ||
        function() {
            (ga.q = ga.q || []).push(arguments);
        };
    ga.l = +new Date();

    /**
     * Initialise analytics
     */
    ga('create', CONFIG.uaCode, {
        cookieDomain: 'none'
    });

    /**
     * Anonymise IPs
     * https://developers.google.com/analytics/devguides/collection/analyticsjs/ip-anonymization
     * https://support.google.com/analytics/answer/2763052?hl=en
     */
    ga('set', 'anonymizeIp', true);

    /**
     * Use Beacon transport mechanism if available
     * https://developers.google.com/analytics/devguides/collection/analyticsjs/sending-hits
     */
    ga('set', 'transport', 'beacon');

    /**
     * Outbound link tracker plugin
     * https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/outbound-link-tracker.md
     */
    ga('require', 'outboundLinkTracker');

    /**
     * Event tracker plugin
     * https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/event-tracker.md
     */
    ga('require', 'eventTracker', {
        attributePrefix: 'data-ga-'
    });

    /**
     * Track pageviews
     */
    ga('send', 'pageview');

    trackDocumentDownloads();
    trackSearchTerms();
};
