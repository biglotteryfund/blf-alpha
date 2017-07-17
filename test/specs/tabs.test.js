/* global describe, it, expect */
"use strict";

let tabs = require('../../assets/js/modules/tabs');

let getClassesFromElm = (elm) => {
    let classes = [];
    if (elm && elm.classList) {
        [].forEach.call(elm.classList, (c) => classes.push(c));
    }
    return classes;
};

describe("Tab module", function () {
    // get first tab module
    let tabModule = document.getElementById('js-tab-test');
    let paneId = tabModule.getAttribute('data-panes');
    let paneHolder = document.getElementById(paneId);

    // look up a second module to ensure no conflicts exist
    let tabModule2 = document.getElementById('js-tab-test-2');
    let paneId2 = tabModule2.getAttribute('data-panes');
    let paneHolder2 = document.getElementById(paneId2);

    // find a wrongly-configured tab module
    let tabModuleBroken = document.getElementById('js-tab-test-broken');

    tabs.init();

    it("registers new tab modules", () => {
        expect(getClassesFromElm(tabModule)).to.contain('js-tabs--active');
    });

    it("does not modify incorrectly configured tab modules", () => {
        expect(getClassesFromElm(tabModuleBroken)).not.to.contain('js-tabs--active');
    });

    it("adds a class to a tab when clicked", () => {
        let tabLink = tabModule.querySelector('li');
        tabLink.querySelector('a').click();
        expect(getClassesFromElm(tabLink)).to.contain('tab--active');
    });

    it("removes a class from other tabs when one is clicked", () => {
        let tabs = tabModule.querySelectorAll('li');
        tabs[1].querySelector('a').click(); // first click tab 2
        tabs[0].querySelector('a').click(); // now click tab 1
        expect(getClassesFromElm(tabs[0])).to.contain('tab--active');
        expect(getClassesFromElm(tabs[1])).not.to.contain('tab--active');
    });

    it("adds a class to the correct pane when a tab is clicked", () => {
        let tabIndex = 1;
        let tabs = tabModule.querySelectorAll('li');
        let panes = paneHolder.querySelectorAll('div');
        let activePane = panes[tabIndex];
        tabs[tabIndex].querySelector('a').click();
        expect(getClassesFromElm(activePane)).to.contain('tab-pane--active');
    });

    it("removes a class from other panes when a tab is clicked", () => {
        let tabs = tabModule.querySelectorAll('li');
        let panes = paneHolder.querySelectorAll('div');
        tabs[0].querySelector('a').click(); // first click tab 1
        tabs[1].querySelector('a').click(); // next click tab 2
        let activePane = panes[1];
        let inactivePane = panes[0];
        expect(getClassesFromElm(activePane)).to.contain('tab-pane--active');
        expect(getClassesFromElm(inactivePane)).not.to.contain('tab-pane--active');
    });

    it("allows multiple tab modules to act independently", () => {
        let activePane1 = paneHolder.querySelector('.tab-pane--active');
        tabModule2.querySelector('a').click(); // click first tab in module 2
        let activePane2 = paneHolder2.querySelector('div'); // get first pane in module 2
        expect(getClassesFromElm(activePane1)).to.contain('tab-pane--active');
        expect(getClassesFromElm(activePane2)).to.contain('tab-pane--active');
    });

});