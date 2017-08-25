/* global $ */
'use strict';
let classTrigger = 'js-tabs';
let classTriggerItem = 'js-tab-item';
let classActivated = 'js-tabs--active';
let paneClassTrigger = 'js-pane';
let paneClassTriggerContainer = 'js-pane-holder';
let paneAttr = 'data-panes';
let activateAttr = 'data-no-initial-selection';
let activeTabClass = 'tab--active';
let activePaneClass = 'tab-pane--active';

// let bindEvents = (tabElm, paneElm) => {
//     let tabs = $(`.${classTriggerItem}`, tabElm);
//     let panes = $(`> .${paneClassTrigger}`, paneElm);
//
//     tabs.each(function (i) {
//         $(this).on('click', (event) => {
//             let pane = panes.eq(i); // find corresponding pane
//             if (pane) {
//                 // toggle tab classes
//                 let oldActiveTab = $(`> .${activeTabClass}`, tabElm);
//                 oldActiveTab.removeClass(activeTabClass);
//                 $(this).addClass(activeTabClass);
//
//                 // toggle pane classes
//                 let oldActivePane = $(`> .${activePaneClass}`, paneElm);
//                 oldActivePane.removeClass(activePaneClass);
//                 pane.addClass(activePaneClass);
//             }
//
//             // prevent anchor scroll
//             event.preventDefault();
//         });
//     });
// };

// let initOld = () => {
//     let tabElms = $(`.${classTrigger}`);
//     tabElms.each(function () {
//         let paneHolderId = $(this).attr(paneAttr);
//         let paneHolder = document.getElementById(paneHolderId);
//         if (paneHolder) {
//             // mark tab module as active
//             $(this).addClass(classActivated);
//
//             // if no tab is active, mark one out
//             let activeTab = $(this).find(`.${activeTabClass}`);
//             let neverAutoActivate = $(this).attr(activateAttr);
//             if (activeTab.length === 0 && !neverAutoActivate) {
//                 $(this).find('li').first().addClass(activeTabClass);
//                 $('.js-pane', paneHolder).first().addClass(activePaneClass);
//             }
//
//             // bind click handlers
//             bindEvents($(this), paneHolder);
//         }
//     });
// };

let init = () => {

    // listen for clicks on individual tabs
    $(`.${classTriggerItem}`).each(function () {

        let $tab = $(this);

        // get the tab's parent tabset (so we can deactivate previously-selected tabs)
        // this is optional: some "tabs" are just links on the page with no tabset
        let $tabset = $tab.parents(`.${classTrigger}`).first();

        // get the pane it's linked to (so we can show it)
        let $linkedPane = $($tab.attr('href'));

        // get the pane's parent paneset (so we can deactivate previously-selected panes)
        let $paneset = $linkedPane.parents(`.${paneClassTriggerContainer}`).first(); // for nested


        // if there's a matching set of panes, activate this tabset
        if ($paneset.length > 0) {

            // mark it as active
            $tabset.addClass(classActivated);  // only used for tests...

            $tab.on('click', function (e) {
                console.log($tabset, $linkedPane, $paneset);
                // toggle tab classes
                if ($tabset.length > 0) {
                    let oldActiveTab = $(`> .${activeTabClass}`, $tabset);
                    oldActiveTab.removeClass(activeTabClass);
                    $(this).parents('li').first().addClass(activeTabClass);
                }

                // toggle pane classes
                let oldActivePane = $(`> .${activePaneClass}`, $paneset);
                oldActivePane.removeClass(activePaneClass);
                $linkedPane.addClass(activePaneClass);
                e.preventDefault();
            });

            // if no tab is pre-set as active, mark one out
            let activeTab = $tabset.find(`.${activeTabClass}`);

            // sometimes, though, we want to leave them uninitialised
            let neverAutoActivate = $tabset.attr(activateAttr);

            // show the first tab (and its corresponding pane)
            if (activeTab.length === 0 && !neverAutoActivate && $tabset.length > 0) {
                let $firstTab = $tabset.find(`.${classTriggerItem}`).first();
                $firstTab.click();
            }

        }

    });


};

module.exports = {
    init: init
};