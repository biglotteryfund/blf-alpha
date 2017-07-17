'use strict';

let classTrigger = 'js-tabs';
let paneClassTrigger = 'js-pane';
let paneAttr = 'data-panes';
let activeTabClass = 'tab--active';
let activePaneClass = 'tab-pane--active';

let bindEvents = (tabElm, paneElm) => {
    let tabs = tabElm.querySelectorAll('li');
    let panes = paneElm.querySelectorAll(`.${paneClassTrigger}`);
    [].forEach.call(tabs, (tab, i) => {
        tab.addEventListener('click', (event) => {
            let pane = panes[i]; // find corresponding pane
            if (pane) {
                // toggle tab classes
                let oldActiveTab = tabElm.querySelector(`.${activeTabClass}`);
                if (oldActiveTab && oldActiveTab.classList) {
                    oldActiveTab.classList.remove(activeTabClass);
                }
                tab.classList.add(activeTabClass);

                // toggle pane classes
                let oldActivePane = paneElm.querySelector(`.${activePaneClass}`);
                if (oldActivePane && oldActivePane.classList) {
                    oldActivePane.classList.remove(activePaneClass);
                }
                pane.classList.add(activePaneClass);
            }

            // prevent anchor scroll
            event.preventDefault();
        });
    });
};

let init = () => {
    let tabElms = document.querySelectorAll(`.${classTrigger}`);
    [].forEach.call(tabElms, (tabElm) => {
        let paneHolderId = tabElm.getAttribute(paneAttr);
        let paneHolder = document.getElementById(paneHolderId);
        if (paneHolder) {
            // mark tab module as active
            tabElm.classList.add('js-tabs--active');
            // if no tab is active, mark one out
            let activeTab = tabElm.querySelector(`.${activeTabClass}`);
            if (!activeTab) {
                tabElm.querySelector('li').classList.add(activeTabClass);
                paneHolder.querySelector('.js-pane').classList.add(activePaneClass);
            }

            // bind click handlers
            bindEvents(tabElm, paneHolder);
        }
    });
};

module.exports = {
    init: init
};