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

                // stop browser scroll by default
                e.preventDefault();

                // if we're on mobile (eg. accordion)
                // we should scroll the pane into view
                window.setTimeout(() => {
                    let tabSetIsVisible = $tabset.is(":visible");
                    if (!tabSetIsVisible) {
                        $paneToShow[0].scrollIntoView();
                    } else {
                        $tabClicked[0].scrollIntoView();
                    }
                }, 300);

                // update the URL fragment
                if (paneId && paneId[0] === '#') {
                    if (history.pushState) {
                        history.pushState(null, null, paneId);
                    }
                }

            }
        }

    });

    // restore previously-selected hash
    let hash = window.location.hash;
    let firstLink = $(`a[href="${hash}"]`).first();
    if (firstLink.length > 0) {
        firstLink.click();
    }

};

module.exports = {
    init: init
};