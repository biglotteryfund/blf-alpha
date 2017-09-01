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

describe("Tab module", () => {
    // get first tab module
    let tabModule = document.getElementById('js-tab-test');
    let paneId = tabModule.getAttribute('data-panes');
    let paneHolder = document.getElementById(paneId);

    // look up a second module to ensure no conflicts exist
    let tabModule2 = document.getElementById('js-tab-test-2');
    let paneId2 = tabModule2.getAttribute('data-paneset');
    let paneHolder2 = document.getElementById(paneId2);

    // find a wrongly-configured tab module
    let tabModuleBroken = document.getElementById('js-tab-test-broken');

    tabs.init();

    it("registers new tab modules", () => {
        expect(tabModule.querySelectorAll('.tab--active').length).to.equal(1);
    });

    it("does not modify incorrectly configured tab modules", () => {
        expect(tabModuleBroken.querySelectorAll('.tab--active').length).to.equal(0);
    });

    it("adds a class to a tab when clicked", () => {
        let tabLink = tabModule.querySelector('a');
        tabLink.click();
        expect(getClassesFromElm(tabLink)).to.contain('tab--active');
    });

    it("removes a class from other tabs when one is clicked", () => {
        let tabs = tabModule.querySelectorAll('li');
        let t1 = tabs[1].querySelector('a');
        let t2 = tabs[0].querySelector('a');
        t1.click(); // first click tab 2
        t2.click(); // now click tab 1
        expect(getClassesFromElm(t2)).to.contain('tab--active');
        expect(getClassesFromElm(t1)).not.to.contain('tab--active');
    });

    it("adds a class to the correct pane when a tab is clicked", () => {
        let tabs = tabModule.querySelectorAll('li');
        let link = tabs[1].querySelector('a');
        link.click();
        let pane = document.querySelector(link.getAttribute('href'));
        expect(getClassesFromElm(pane)).to.contain('pane--active');
    });

    it("removes a class from other panes when a tab is clicked", () => {
        let tabs = tabModule.querySelectorAll('li');
        let t1 = tabs[1].querySelector('a');
        let t2 = tabs[0].querySelector('a');
        t1.click(); // first click tab 1
        t2.click(); // next click tab 2
        let activePane = document.querySelector(t2.getAttribute('href'));
        let inactivePane = document.querySelector(t1.getAttribute('href'));
        expect(getClassesFromElm(activePane)).to.contain('pane--active');
        expect(getClassesFromElm(inactivePane)).not.to.contain('pane--active');
    });

});