'use strict';
/* global $ */
let classTrigger = 'js-tabs';
let paneClassTrigger = 'js-pane';
let paneAttr = 'data-panes';
let activeTabClass = 'tab--active';
let activePaneClass = 'tab-pane--active';

let bindEvents = (tabElm, paneElm) => {
    let tabs = $('li', tabElm);
    let panes = $(`> .${paneClassTrigger}`, paneElm);

    tabs.each(function (i) {
        $(this).on('click', (event) => {
            let pane = panes.eq(i); // find corresponding pane
            if (pane) {
                // toggle tab classes
                let oldActiveTab = $(`> .${activeTabClass}`, tabElm);
                oldActiveTab.removeClass(activeTabClass);
                $(this).addClass(activeTabClass);

                // toggle pane classes
                let oldActivePane = $(`> .${activePaneClass}`, paneElm);
                oldActivePane.removeClass(activePaneClass);
                pane.addClass(activePaneClass);
            }

            // prevent anchor scroll
            event.preventDefault();
        });
    });
};

let init = () => {
    let tabElms = $(`.${classTrigger}`);
    tabElms.each(function () {
        let paneHolderId = $(this).attr(paneAttr);
        let paneHolder = document.getElementById(paneHolderId);
        if (paneHolder) {
            // mark tab module as active
            $(this).addClass('js-tabs--active');
            // if no tab is active, mark one out
            let activeTab = $(this).find(`.${activeTabClass}`);
            if (activeTab.length === 0) {
                $(this).find('li').first().addClass(activeTabClass);
                $('.js-pane', paneHolder).first().addClass(activePaneClass);
            }

            // bind click handlers
            bindEvents($(this), paneHolder);
        }
    });
};

module.exports = {
    init: init
};