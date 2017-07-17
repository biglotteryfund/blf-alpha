'use strict';

let classTrigger = 'js-tabs';
let paneAttr = 'data-panes';
let activeTabClass = 'tab--active';
let activePaneClass = 'tab-pane--active';

let bindEvents = (tabElm, paneElm) => {
    let tabs = tabElm.querySelectorAll('li');
    let panes = paneElm.querySelectorAll('div');
    [].forEach.call(tabs, (tab, i) => {
        tab.addEventListener('click', (event) => {
            let pane = panes[i]; // find corresponding pane

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
            tabElm.classList.add('js-tabs--active');
            bindEvents(tabElm, paneHolder);
        }
    });
};

module.exports = {
    init: init
};