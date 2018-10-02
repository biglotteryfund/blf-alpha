/* global ga, cxApi */

const { isDownloadLink } = require('../helpers/urls');
const { trackEvent } = require('../helpers/metrics');

function trackDocumentDownloads() {
    const links = document.querySelectorAll('.content-box a[href]');
    [].forEach.call(links, function(link) {
        if (isDownloadLink(link.href)) {
            link.addEventListener('click', () => {
                trackEvent('Documents', 'Downloaded a document', link.href);
            });
        }
    });
}

export const init = () => {
    const thisScript = document.getElementById('js-script-main');
    const CONFIG = {
        uaCode: thisScript.getAttribute('data-ga-code'),
        abId: thisScript.getAttribute('data-ab-id'),
        abVariant: thisScript.getAttribute('data-ab-variant'),
        customMetrics: {
            maxScrollPercentage: {
                idx: 1,
                name: 'metric1',
                description: 'Max Scroll Percentage'
            }
        }
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
     * Max scroll tracker plugin
     * https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/max-scroll-tracker.md
     */
    ga('require', 'maxScrollTracker', {
        maxScrollMetricIndex: CONFIG.customMetrics.maxScrollPercentage.idx
    });

    /**
     * A/B Tests
     * If we're in a test variant, record it
     */
    if (CONFIG.abId && CONFIG.abVariant) {
        ga('set', 'expId', CONFIG.abId);
        ga('set', 'expVar', CONFIG.abVariant);
        cxApi.setChosenVariation(CONFIG.abVariant, CONFIG.abId);
    }

    /**
     * Track pageviews
     */
    ga('send', 'pageview');

    /**
     * Track document downloads
     */
    trackDocumentDownloads();
};
