import $ from 'jquery';

let activeClasses = {
    tab: 'tab--active',
    pane: 'pane--active'
};

let pageHasLoaded = false;

function scrollIntoView(el) {
    el.get(0).scrollIntoView(true);
}

// toggle panes/tabs (if valid)
function showNewTabPane($tabClicked) {
    let tabData;

    // get the matching pane element
    let paneId = $tabClicked.attr('href');
    let $paneToShow = $(paneId);

    // find the tabset of the clicked tab
    const $tabset = $tabClicked.parents('.js-tabset').first();

    // if we have a pane, let's show it
    if ($paneToShow.length > 0) {
        // we need the "paneset" - the container of available panes
        // (this allows multiple sets of tabs/panes)
        let $paneSet = $paneToShow.parents('.js-paneset').first();

        if ($paneSet.length > 0) {
            // toggle the active pane in this set
            let $oldActivePane = $paneSet.find(`> .${activeClasses.pane}`);
            $oldActivePane.removeClass(activeClasses.pane).attr('aria-hidden', 'true');
            $paneToShow.addClass(activeClasses.pane).attr('aria-hidden', 'false');

            // toggle the active tab in this set
            let $oldActiveTab = $tabset.find(`.${activeClasses.tab}`);
            $oldActiveTab.removeClass(activeClasses.tab).attr('aria-selected', 'false');
            $tabClicked.addClass(activeClasses.tab).attr('aria-selected', 'true');

            // pass this data back to the click handler
            tabData = {
                tabset: $tabset,
                paneToShow: $paneToShow,
                tabClicked: $tabClicked,
                paneId: paneId,
                paneSet: $paneSet
            };
        }
    }

    // click handler needs to know if it should update URL hash etc
    return tabData;
}

/**
 * Add core tab behaviour
 */
function addTabBehaviour($tabs) {
    // bind clicks on tabs
    $tabs.on('click', function(e) {
        // show the tab pane and get the associated elements
        let tabData = showNewTabPane($(this));

        // if this was a valid tab
        if (tabData) {
            // stop browser scroll by default
            e.preventDefault();

            // if we're on mobile (eg. accordion) we should scroll the pane into view
            // we delay this because the visibility check returns false as the page loads
            // and the tabs are made visible by JavaScript
            let scrollTimeout = pageHasLoaded ? 0 : 300;
            window.setTimeout(() => {
                let tabSetIsVisible = tabData.tabset.is(':visible');
                if (!tabSetIsVisible) {
                    scrollIntoView(tabData.paneToShow);
                } else {
                    // is this a mock tab or a real one?
                    if ($(this)[0] !== tabData.tabClicked[0]) {
                        // mock tab, so make sure the tabset is in view
                        // or the lack of scroll change is jarring
                        scrollIntoView(tabData.tabClicked);
                    }
                }
                pageHasLoaded = true;
            }, scrollTimeout);

            // update the URL fragment
            if (tabData.paneId && tabData.paneId[0] === '#') {
                if (window.history.replaceState) {
                    window.history.replaceState(null, null, tabData.paneId);
                }
            }
        }
    });
}

/**
 * Add ARIA states to active tabs
 * @TODO: Should this be triggered on dynamic tab changes?
 */
function addAriaStates($tabs) {
    $('.tab__pane')
        .not(`.${activeClasses.pane}`)
        .attr('aria-hidden', 'true');

    $tabs.not(`.${activeClasses.tab}`).attr('aria-selected', 'false');
    $tabs.parents('li').attr('role', 'presentation');

    // match the panes with the tabs for ARIA labels
    $tabs.each(function() {
        let $pane = $($(this).attr('href'));
        let id = $(this).attr('id');
        if ($pane.length > 0 && id) {
            $pane.attr('aria-labelledby', $(this).attr('id'));
        }
    });
}

/**
 * Open selected tab if loading the page with an existing hash
 */
function openTabForCurrentHash() {
    const hash = window.location.hash;
    const $link = $(`.js-tab[href="${hash}"]`).first();
    if ($link.length > 0) {
        showNewTabPane($link);
        /**
         * hacky but works: scroll back to top of the page
         * as otherwise the selected pane will be scrolled to
         * and page intro will be missing
         */
        window.setTimeout(() => {
            window.scrollTo(0, 0);
        }, 1);
    }
}

/**
 * Listen for hashchange events and:
 * A. Try to toggle tab if anchoring directly to a tab
 * B. If anchoring to another element see if it's inside a tab
 *    and if so try to toggle the parent tab
 */
function openTabOnHashchange() {
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;

        const linkEl = $(`.js-tab[href="${hash}"]`).first();
        if (linkEl.length > 0) {
            showNewTabPane(linkEl);
            scrollIntoView(linkEl);
        } else {
            const idEl = $(hash).first();
            const parentTabLinkEl = idEl.closest('.tab__pane').find('.js-tab');

            if (idEl.length > 0 && parentTabLinkEl.length > 0) {
                showNewTabPane(parentTabLinkEl);
                scrollIntoView(idEl);
            }
        }
    });
}

function init() {
    const $tabs = $('.js-tab');

    if ($tabs.length < 1) {
        return;
    }

    addTabBehaviour($tabs);
    addAriaStates($tabs);

    openTabForCurrentHash();
    openTabOnHashchange();
}

export default {
    init
};
