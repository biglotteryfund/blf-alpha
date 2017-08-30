/* global $ */
'use strict';

let activeClasses = {
    tab: 'tab--active',
    pane: 'pane--active'
};

let init = () => {

    // bind clicks on tabs
    $('.js-tab').on('click', function (e) {

        let $tabset;
        let $tabClicked = $(this);

        // get the matching pane element
        let paneId = $tabClicked.attr('href');
        let $paneToShow = $(paneId);

        // is this "tab" just a link to a panel (eg. not in a tabset)?
        let hasManualTabset = $(this).data('tabset');

        // find the "tabset" - the containing list of tabs
        if (hasManualTabset) {
            // for these links we have to manually match it to a tabset elsewhere on the page
            // eg. so we can toggle the selected tab there
            $tabset = $($(`#${hasManualTabset}`));
            // we also need to find the equivalent tab in that tabset to make it active
            $tabClicked = $tabset.find(`a[href="${paneId}"]`);
        } else {
            // find the tabset of the clicked tab
            $tabset = $tabClicked.parents('.js-tabset').first();
        }

        // if we have a pane, let's show it
        if ($paneToShow.length > 0) {
            // we need the "paneset" - the container of available panes
            // (this allows multiple sets of tabs/panes)
            let $paneSet = $paneToShow.parents('.js-paneset').first();

            if ($paneSet.length > 0) {
                // toggle the active pane in this set
                let $oldActivePane = $paneSet.find(`> .${activeClasses.pane}`);
                $oldActivePane.removeClass(activeClasses.pane);
                $paneToShow.addClass(activeClasses.pane);

                // toggle the active tab in this set
                let $oldActiveTab = $tabset.find(`.${activeClasses.tab}`);
                $oldActiveTab.removeClass(activeClasses.tab);
                $tabClicked.addClass(activeClasses.tab);

                // stop browser scroll
                e.preventDefault();
                $tabClicked[0].scrollIntoView();
            }
        }

    });

    // mark the first tab in a tabset active on init (unless explicitly prevented)
    $('.js-tabset').each(function () {
        if (!$(this).data('tabs-do-not-init')) {
            $(this).find('.js-tab').first().click();
        }
    });

};

module.exports = {
    init: init
};